const http = require('http');
const fs = require('fs');
const path = require('path');
const app = require('../src/app');
const db = require('../src/config/database');
const { generateToken } = require('../src/utils/jwt');

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

async function requestJson(base, route, method, token, body) {
  const response = await fetch(`${base}${route}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
    body: body ? JSON.stringify(body) : undefined
  });

  const text = await response.text();
  let data;
  try {
    data = text ? JSON.parse(text) : null;
  } catch (_error) {
    data = { raw: text };
  }

  return { status: response.status, data };
}

async function requestMultipart(base, route, method, token, formData) {
  const response = await fetch(`${base}${route}`, {
    method,
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
    body: formData
  });

  const text = await response.text();
  let data;
  try {
    data = text ? JSON.parse(text) : null;
  } catch (_error) {
    data = { raw: text };
  }

  return { status: response.status, data };
}

function getNextStatus(currentStatus) {
  const transitionOrder = ['todo', 'in_progress', 'in_review', 'done'];
  const currentIndex = transitionOrder.indexOf(currentStatus);
  if (currentIndex === -1) return 'in_progress';
  return transitionOrder[(currentIndex + 1) % transitionOrder.length];
}

async function run() {
  const [admins] = await db.query("SELECT id, email, role FROM users WHERE role = 'admin' ORDER BY id LIMIT 1");
  assert(admins.length > 0, 'No admin user found');
  const admin = admins[0];
  const token = generateToken({ id: admin.id, email: admin.email, role: admin.role });

  const [taskRows] = await db.query(
    `SELECT t.id, t.status
     FROM tasks t
     LEFT JOIN sprints s ON s.id = t.sprint_id
     WHERE t.project_id IS NOT NULL
       AND (t.sprint_id IS NULL OR s.status <> 'completed')
     ORDER BY t.updated_at DESC
     LIMIT 1`
  );
  assert(taskRows.length > 0, 'No mutable task found for validation');
  const taskId = Number(taskRows[0].id);
  const initialStatus = String(taskRows[0].status);
  const targetStatus = getNextStatus(initialStatus);

  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;
  const base = `http://127.0.0.1:${port}/api`;

  let uploadedAttachmentId = null;
  let uploadedFilePath = null;

  try {
    const statusResponse = await requestJson(base, `/tasks/${taskId}/status`, 'PATCH', token, {
      status: targetStatus
    });
    assert(
      statusResponse.status === 200,
      `Status update API failed. Expected 200, got ${statusResponse.status} (${statusResponse.data?.message || 'no message'})`
    );

    const [updatedTaskRows] = await db.query('SELECT status FROM tasks WHERE id = ?', [taskId]);
    assert(updatedTaskRows.length === 1, 'Updated task row not found in tasks table');
    assert(
      String(updatedTaskRows[0].status) === targetStatus,
      `Task status mismatch in tasks table. Expected "${targetStatus}", got "${updatedTaskRows[0].status}"`
    );

    const [historyRows] = await db.query(
      `SELECT task_id, from_status, to_status, changed_by
       FROM task_status_history
       WHERE task_id = ?
       ORDER BY changed_at DESC, id DESC
       LIMIT 1`,
      [taskId]
    );
    assert(historyRows.length === 1, 'No status history row found after status update');
    assert(
      Number(historyRows[0].task_id) === taskId &&
      String(historyRows[0].from_status) === initialStatus &&
      String(historyRows[0].to_status) === targetStatus &&
      Number(historyRows[0].changed_by) === Number(admin.id),
      'Latest task_status_history row does not match expected status transition metadata'
    );

    const sampleText = `integrity-check-${Date.now()}`;
    const form = new FormData();
    form.append('file', new Blob([sampleText], { type: 'text/plain' }), 'integrity-check.txt');

    const uploadResponse = await requestMultipart(base, `/tasks/${taskId}/attachments`, 'POST', token, form);
    assert(
      uploadResponse.status === 201,
      `Attachment upload API failed. Expected 201, got ${uploadResponse.status} (${uploadResponse.data?.message || 'no message'})`
    );

    const [attachmentRows] = await db.query(
      `SELECT id, task_id, uploaded_by, file_path
       FROM task_attachments
       WHERE task_id = ?
       ORDER BY created_at DESC, id DESC
       LIMIT 1`,
      [taskId]
    );
    assert(attachmentRows.length === 1, 'No task_attachments row found after upload');

    uploadedAttachmentId = Number(attachmentRows[0].id);
    uploadedFilePath = attachmentRows[0].file_path;

    assert(
      Number(attachmentRows[0].task_id) === taskId &&
      Number(attachmentRows[0].uploaded_by) === Number(admin.id),
      'Latest task_attachments row does not match expected task/user metadata'
    );
    assert(uploadedFilePath && fs.existsSync(uploadedFilePath), `Uploaded file missing on disk at ${uploadedFilePath}`);

    const deleteResponse = await requestJson(
      base,
      `/tasks/attachments/${uploadedAttachmentId}`,
      'DELETE',
      token
    );
    assert(
      deleteResponse.status === 200,
      `Attachment delete API failed. Expected 200, got ${deleteResponse.status} (${deleteResponse.data?.message || 'no message'})`
    );

    const [deletedRows] = await db.query('SELECT id FROM task_attachments WHERE id = ?', [uploadedAttachmentId]);
    assert(deletedRows.length === 0, 'Attachment row still exists after delete');
    assert(!fs.existsSync(uploadedFilePath), 'Attachment file still exists on disk after delete');

    console.log('PASS - status update stored in tasks + task_status_history with correct metadata');
    console.log('PASS - attachment upload stored in task_attachments and file created on disk');
    console.log('PASS - attachment delete removed DB row and file');
    console.log(`Validated task id: ${taskId}`);
  } finally {
    server.close();

    if (uploadedAttachmentId) {
      await db.query('DELETE FROM task_attachments WHERE id = ?', [uploadedAttachmentId]);
    }
    if (uploadedFilePath && fs.existsSync(uploadedFilePath)) {
      try {
        fs.unlinkSync(uploadedFilePath);
      } catch (_error) {
        // best-effort cleanup
      }
    }

    const [currentTaskRows] = await db.query('SELECT status FROM tasks WHERE id = ?', [taskId]);
    if (currentTaskRows.length === 1 && String(currentTaskRows[0].status) !== initialStatus) {
      await db.query('UPDATE tasks SET status = ? WHERE id = ?', [initialStatus, taskId]);
    }
  }
}

run()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('FAIL - task data integrity verification failed');
    console.error(error?.message || error);
    process.exit(1);
  });
