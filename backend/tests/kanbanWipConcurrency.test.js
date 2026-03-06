const request = require('supertest');
const app = require('../src/app');
const db = require('../src/config/database');
const { generateToken } = require('../src/utils/jwt');

describe('Kanban WIP concurrency enforcement', () => {
  let adminUser;
  let memberUser;
  let memberToken;
  let teamId;
  let projectId;
  let moveTaskAId;
  let moveTaskBId;
  const createdTaskIds = [];
  const keyPrefix = `WIPT${Date.now()}`;

  beforeAll(async () => {
    jest.setTimeout(30000);

    const [admins] = await db.query(
      "SELECT id, email, role FROM users WHERE role = 'admin' LIMIT 1"
    );
    const [members] = await db.query(
      "SELECT id, email, role FROM users WHERE role = 'member' LIMIT 1"
    );

    if (!admins.length || !members.length) {
      throw new Error('Seed users not found: admin/member required');
    }

    adminUser = admins[0];
    memberUser = members[0];
    memberToken = generateToken({
      id: memberUser.id,
      email: memberUser.email,
      role: memberUser.role
    });

    const [teamInsert] = await db.query(
      'INSERT INTO teams (name, description, team_lead_id) VALUES (?, ?, ?)',
      [`WIP Test Team ${Date.now()}`, 'WIP concurrency test team', adminUser.id]
    );
    teamId = teamInsert.insertId;

    await db.query(
      'INSERT INTO team_members (team_id, user_id) VALUES (?, ?)',
      [teamId, memberUser.id]
    );

    const [projectInsert] = await db.query(
      `INSERT INTO projects (name, key_code, description, team_id, created_by, board_type)
       VALUES (?, ?, ?, ?, ?, 'kanban')`,
      [`WIP Project ${Date.now()}`, keyPrefix, 'WIP test project', teamId, adminUser.id]
    );
    projectId = projectInsert.insertId;

    await db.query(
      `INSERT INTO kanban_column_limits (project_id, column_name, wip_limit)
       VALUES (?, 'in_progress', 5)`,
      [projectId]
    );

    // Create 4 tasks already in "in_progress"
    for (let i = 1; i <= 4; i += 1) {
      const [taskInsert] = await db.query(
        `INSERT INTO tasks (title, description, task_key, sprint_id, project_id, assigned_to, reporter_id, status)
         VALUES (?, ?, ?, NULL, ?, ?, ?, 'in_progress')`,
        [`Seed InProgress ${i}`, 'seed', `${keyPrefix}-IP${i}`, projectId, memberUser.id, adminUser.id]
      );
      createdTaskIds.push(taskInsert.insertId);
    }

    // Create 2 tasks in "todo" that will be moved concurrently
    const [taskAInsert] = await db.query(
      `INSERT INTO tasks (title, description, task_key, sprint_id, project_id, assigned_to, reporter_id, status)
       VALUES (?, ?, ?, NULL, ?, ?, ?, 'todo')`,
      ['Move Task A', 'candidate A', `${keyPrefix}-A`, projectId, memberUser.id, adminUser.id]
    );
    moveTaskAId = taskAInsert.insertId;
    createdTaskIds.push(moveTaskAId);

    const [taskBInsert] = await db.query(
      `INSERT INTO tasks (title, description, task_key, sprint_id, project_id, assigned_to, reporter_id, status)
       VALUES (?, ?, ?, NULL, ?, ?, ?, 'todo')`,
      ['Move Task B', 'candidate B', `${keyPrefix}-B`, projectId, memberUser.id, adminUser.id]
    );
    moveTaskBId = taskBInsert.insertId;
    createdTaskIds.push(moveTaskBId);
  });

  afterAll(async () => {
    if (createdTaskIds.length > 0) {
      await db.query(
        `DELETE FROM task_status_history WHERE task_id IN (${createdTaskIds.map(() => '?').join(',')})`,
        createdTaskIds
      );
      await db.query(
        `DELETE FROM tasks WHERE id IN (${createdTaskIds.map(() => '?').join(',')})`,
        createdTaskIds
      );
    }

    if (projectId) {
      await db.query('DELETE FROM kanban_column_limits WHERE project_id = ?', [projectId]);
      await db.query('DELETE FROM projects WHERE id = ?', [projectId]);
    }

    if (teamId) {
      await db.query('DELETE FROM team_members WHERE team_id = ?', [teamId]);
      await db.query('DELETE FROM teams WHERE id = ?', [teamId]);
    }
  });

  it('allows only one of two parallel moves when limit has one slot left', async () => {
    const reqA = request(app)
      .patch(`/api/tasks/${moveTaskAId}/status`)
      .set('Authorization', `Bearer ${memberToken}`)
      .send({ status: 'in_progress' });

    const reqB = request(app)
      .patch(`/api/tasks/${moveTaskBId}/status`)
      .set('Authorization', `Bearer ${memberToken}`)
      .send({ status: 'in_progress' });

    const [resA, resB] = await Promise.all([reqA, reqB]);
    const statuses = [resA.status, resB.status].sort((a, b) => a - b);

    expect(statuses).toEqual([400, 200]);
    const failed = resA.status === 400 ? resA : resB;
    expect(String(failed.body?.message || '')).toMatch(/wip limit/i);

    const [rows] = await db.query(
      `SELECT COUNT(*) AS total
       FROM tasks
       WHERE project_id = ? AND status = 'in_progress'`,
      [projectId]
    );

    expect(Number(rows[0].total)).toBe(5);
  });
});
