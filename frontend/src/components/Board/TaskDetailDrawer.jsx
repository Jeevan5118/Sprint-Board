import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { taskService } from '../../services/taskService';
import { projectService } from '../../services/projectService';
import { teamService } from '../../services/teamService';
import { getErrorMessage } from '../../utils/error';

const TaskDetailDrawer = ({ taskId, onClose, onTaskUpdated }) => {
  const [task, setTask] = useState(null);
  const [comments, setComments] = useState([]);
  const [timeLogs, setTimeLogs] = useState([]);
  const [commentText, setCommentText] = useState('');
  const [timeLogForm, setTimeLogForm] = useState({ hours: '', description: '' });
  const [storyPoints, setStoryPoints] = useState('');
  const [linkForm, setLinkForm] = useState({ url: '', title: '', description: '' });
  const [uploading, setUploading] = useState(false);
  const [savingTimeLog, setSavingTimeLog] = useState(false);
  const [deletingTimeLogId, setDeletingTimeLogId] = useState(null);
  const [savingStoryPoints, setSavingStoryPoints] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [teamMembers, setTeamMembers] = useState([]);
  const [projectInfo, setProjectInfo] = useState(null);
  const [isEditingAssignee, setIsEditingAssignee] = useState(false);
  const [isEditingIssue, setIsEditingIssue] = useState(false);
  const [savingIssue, setSavingIssue] = useState(false);
  const [editForm, setEditForm] = useState({
    title: '',
    description: '',
    type: 'task',
    priority: 'medium',
    status: 'todo',
    due_date: ''
  });
  const { projectId } = useParams();
  const { user } = useAuth();
  const canManageIssue =
    user?.role === 'admin' ||
    (user?.role === 'team_lead' && Number(projectInfo?.team_lead_id) === Number(user?.id));

  useEffect(() => {
    if (!taskId) return;
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setError('');

      try {
        const [taskData, taskComments, taskTimeLogs] = await Promise.all([
          taskService.getTaskDetails(taskId),
          taskService.getComments(taskId),
          taskService.getTimeLogs(taskId)
        ]);

        if (cancelled) return;
        setTask(taskData);
        setComments(taskComments);
        setTimeLogs(taskTimeLogs || []);
        setStoryPoints(taskData.story_points ?? '');
        setEditForm({
          title: taskData.title || '',
          description: taskData.description || '',
          type: taskData.type || 'task',
          priority: taskData.priority || 'medium',
          status: taskData.status || 'todo',
          due_date: taskData.due_date ? String(taskData.due_date).slice(0, 10) : ''
        });

        const effectiveProjectId = projectId || taskData.project_id;
        if (effectiveProjectId) {
          const proj = await projectService.getProjectById(effectiveProjectId);
          if (!cancelled) {
            setProjectInfo(proj);
          }
          if (proj.team_id) {
            const members = await teamService.getMembers(proj.team_id);
            if (!cancelled) {
              setTeamMembers(members);
            }
          }
        }
      } catch (err) {
        if (!cancelled) {
          setError(getErrorMessage(err, 'Failed to load task details'));
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [taskId, projectId]);

if (!taskId) return null;

const handleAddComment = async (e) => {
  e.preventDefault();
  if (!commentText.trim()) return;
  try {
    const newComment = await taskService.addComment(taskId, commentText.trim());
    setComments((prev) => [newComment, ...prev]);
    setCommentText('');
  } catch (err) {
    console.error(err);
    alert(getErrorMessage(err, 'Failed to add comment'));
  }
};

const handleDeleteComment = async (commentId) => {
  if (!window.confirm('Delete this comment?')) return;
  try {
    await taskService.deleteComment(commentId);
    setComments((prev) => prev.filter((c) => c.id !== commentId));
  } catch (err) {
    console.error(err);
    alert(getErrorMessage(err, 'Failed to delete comment'));
  }
};

const handleUpload = async (e) => {
  const file = e.target.files?.[0];
  if (!file) return;

  // Validation
  const maxSize = 100 * 1024 * 1024; // 100MB

  if (file.size > maxSize) {
    alert('File size exceeds 100MB limit');
    return;
  }

  setUploading(true);
  try {
    const attachments = await taskService.uploadAttachment(taskId, file);
    setTask((prev) => (prev ? { ...prev, attachments } : prev));
  } catch (err) {
    console.error(err);
    alert(getErrorMessage(err, 'Failed to upload attachment'));
  } finally {
    setUploading(false);
  }
};

const handleAddLink = async (e) => {
  e.preventDefault();
  if (!linkForm.url) return;
  try {
    const links = await taskService.addLink(taskId, linkForm);
    setTask((prev) => (prev ? { ...prev, links } : prev));
    setLinkForm({ url: '', title: '', description: '' });
  } catch (err) {
    console.error(err);
    alert(getErrorMessage(err, 'Failed to add link'));
  }
};

const handleSaveStoryPoints = async (e) => {
  e.preventDefault();
  setSavingStoryPoints(true);
  try {
    const normalizedStoryPoints =
      storyPoints === '' ? null : Number(storyPoints);
    const updated = await taskService.updateStoryPoints(taskId, normalizedStoryPoints);
    setTask(updated);
    setStoryPoints(updated.story_points ?? '');
    onTaskUpdated?.(updated);
  } catch (err) {
    console.error(err);
    alert(getErrorMessage(err, 'Failed to update story points'));
  } finally {
    setSavingStoryPoints(false);
  }
};

const handleDeleteAttachment = async (attachmentId) => {
  if (!window.confirm('Delete this attachment?')) return;
  try {
    const attachments = await taskService.deleteAttachment(attachmentId);
    setTask((prev) => (prev ? { ...prev, attachments } : prev));
  } catch (err) {
    console.error(err);
    alert(getErrorMessage(err, 'Failed to delete attachment'));
  }
};

const handleAddTimeLog = async (e) => {
  e.preventDefault();
  const hours = Number(timeLogForm.hours);
  if (!Number.isFinite(hours) || hours <= 0) {
    alert('Hours must be greater than 0');
    return;
  }

  setSavingTimeLog(true);
  try {
    const created = await taskService.addTimeLog(taskId, {
      hours,
      description: timeLogForm.description?.trim() || ''
    });
    setTimeLogs((prev) => [created, ...prev]);
    setTimeLogForm({ hours: '', description: '' });
  } catch (err) {
    console.error(err);
    alert(getErrorMessage(err, 'Failed to add time log'));
  } finally {
    setSavingTimeLog(false);
  }
};

const handleDeleteTimeLog = async (timeLogId) => {
  if (!window.confirm('Delete this time log?')) return;

  setDeletingTimeLogId(timeLogId);
  try {
    await taskService.deleteTimeLog(timeLogId);
    setTimeLogs((prev) => prev.filter((log) => Number(log.id) !== Number(timeLogId)));
  } catch (err) {
    console.error(err);
    alert(getErrorMessage(err, 'Failed to delete time log'));
  } finally {
    setDeletingTimeLogId(null);
  }
};

const handleUpdateAssignee = async (userId) => {
  try {
    const updated = await taskService.updateAssignee(taskId, userId);
    const merged = {
      ...task,
      assigned_to: updated.assigned_to,
      assigned_to_name: updated.assigned_to_name
    };
    setTask(merged);
    onTaskUpdated?.(merged);
    setIsEditingAssignee(false);
  } catch (err) {
    console.error(err);
    alert(getErrorMessage(err, 'Failed to update assignee'));
  }
};

const handleDeleteTask = async () => {
  if (!window.confirm('Are you sure you want to delete this issue? This action cannot be undone.')) return;
  try {
    await taskService.deleteTask(taskId);
    onClose();
  } catch (err) {
    console.error(err);
    alert(getErrorMessage(err, 'Failed to delete task'));
  }
};

const handleEditChange = (e) => {
  const { name, value } = e.target;
  setEditForm((prev) => ({ ...prev, [name]: value }));
};

const handleSaveIssue = async (e) => {
  e.preventDefault();
  if (!editForm.title.trim()) {
    alert('Title is required.');
    return;
  }
  setSavingIssue(true);
  try {
    const payload = {
      title: editForm.title.trim(),
      description: editForm.description?.trim() || null,
      type: editForm.type,
      priority: editForm.priority,
      status: editForm.status,
      due_date: editForm.due_date || null
    };
    const updated = await taskService.updateTask(taskId, payload);
    const merged = {
      ...task,
      ...updated
    };
    setTask(merged);
    setEditForm({
      title: merged.title || '',
      description: merged.description || '',
      type: merged.type || 'task',
      priority: merged.priority || 'medium',
      status: merged.status || 'todo',
      due_date: merged.due_date ? String(merged.due_date).slice(0, 10) : ''
    });
    onTaskUpdated?.(merged);
    setIsEditingIssue(false);
  } catch (err) {
    console.error(err);
    alert(getErrorMessage(err, 'Failed to update issue'));
  } finally {
    setSavingIssue(false);
  }
};

const totalLoggedHours = timeLogs.reduce(
  (sum, log) => sum + Number(log.hours || 0),
  0
);

return (
  <div className="drawer-backdrop" onClick={onClose}>
    <aside className="drawer" onClick={(e) => e.stopPropagation()}>
      {loading ? (
        <div>Loading task…</div>
      ) : error ? (
        <div className="auth-error">{error}</div>
      ) : (
        <>
          <header className="flex justify-between items-start p-6 border-b border-[#DFE1E6] bg-white sticky top-0 z-10">
            <div className="flex-1 mr-4">
              <div className="flex items-center gap-2 mb-2">
                <span
                  onClick={() => {
                    navigator.clipboard.writeText(task.task_key);
                    alert('Task key copied!');
                  }}
                  className="text-[12px] font-bold text-[#0052CC] uppercase hover:underline cursor-pointer bg-[#E6EFFC] px-2 py-0.5 rounded tracking-wider transition-all active:scale-95"
                  title="Click to copy key"
                >
                  {task.task_key}
                </span>
                <span className="text-gray-300">•</span>
                <span className="text-[12px] text-gray-500 font-medium">Updated just now</span>
              </div>
              <h2 className="text-2xl font-bold text-[#172B4D] leading-tight tracking-tight mb-2">{task.title}</h2>
            </div>
            <div className="flex items-center gap-2">
              {canManageIssue && (
                <button
                  type="button"
                  className="px-3 py-1.5 text-sm font-semibold text-[#0052CC] hover:bg-[#E6EFFC] rounded-[3px] transition-colors"
                  onClick={() => setIsEditingIssue((prev) => !prev)}
                >
                  {isEditingIssue ? 'Cancel Edit' : 'Edit Issue'}
                </button>
              )}
              <button type="button" className="p-1 hover:bg-[#EBECF0] rounded-[3px] text-[#42526E] text-2xl leading-none transition-colors" onClick={onClose}>
                &times;
              </button>
            </div>
          </header>

          <div className="flex flex-col lg:flex-row h-full">
            {/* Main Content (Left) */}
            <div className="flex-1 p-6 space-y-8 overflow-y-auto">
              {canManageIssue && isEditingIssue && (
                <section className="border border-[#DFE1E6] rounded-[3px] bg-[#FAFBFC] p-4">
                  <h3 className="text-[#172B4D] font-semibold text-[14px] mb-3">Edit Issue</h3>
                  <form className="space-y-3" onSubmit={handleSaveIssue}>
                    <input
                      className="w-full px-3 py-2 border-2 border-[#DFE1E6] rounded-[3px] text-sm focus:border-[#4C9AFF] outline-none"
                      name="title"
                      value={editForm.title}
                      onChange={handleEditChange}
                      placeholder="Issue title"
                      required
                    />
                    <textarea
                      className="w-full px-3 py-2 border-2 border-[#DFE1E6] rounded-[3px] text-sm focus:border-[#4C9AFF] outline-none"
                      name="description"
                      value={editForm.description}
                      onChange={handleEditChange}
                      rows={3}
                      placeholder="Issue description"
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <select
                        className="px-3 py-2 border-2 border-[#DFE1E6] rounded-[3px] text-sm focus:border-[#4C9AFF] outline-none"
                        name="type"
                        value={editForm.type}
                        onChange={handleEditChange}
                      >
                        <option value="task">Task</option>
                        <option value="story">Story</option>
                        <option value="bug">Bug</option>
                        <option value="epic">Epic</option>
                      </select>
                      <select
                        className="px-3 py-2 border-2 border-[#DFE1E6] rounded-[3px] text-sm focus:border-[#4C9AFF] outline-none"
                        name="priority"
                        value={editForm.priority}
                        onChange={handleEditChange}
                      >
                        <option value="lowest">Lowest</option>
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                        <option value="highest">Highest</option>
                      </select>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <select
                        className="px-3 py-2 border-2 border-[#DFE1E6] rounded-[3px] text-sm focus:border-[#4C9AFF] outline-none"
                        name="status"
                        value={editForm.status}
                        onChange={handleEditChange}
                      >
                        <option value="todo">To Do</option>
                        <option value="in_progress">In Progress</option>
                        <option value="in_review">In Review</option>
                        <option value="done">Done</option>
                      </select>
                      <input
                        type="date"
                        className="px-3 py-2 border-2 border-[#DFE1E6] rounded-[3px] text-sm focus:border-[#4C9AFF] outline-none"
                        name="due_date"
                        value={editForm.due_date}
                        onChange={handleEditChange}
                      />
                    </div>
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        className="px-3 py-1.5 text-sm font-semibold text-[#42526E] hover:bg-[#EBECF0] rounded-[3px]"
                        onClick={() => setIsEditingIssue(false)}
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-3 py-1.5 text-sm font-semibold bg-[#0052CC] text-white rounded-[3px] hover:bg-[#0065FF]"
                        disabled={savingIssue}
                      >
                        {savingIssue ? 'Saving...' : 'Save Issue'}
                      </button>
                    </div>
                  </form>
                </section>
              )}

              <section>
                <h3 className="text-[#172B4D] font-semibold text-[14px] mb-2">Description</h3>
                <div className="text-[14px] text-[#172B4D] leading-relaxed whitespace-pre-wrap">
                  {task.description || 'No description provided.'}
                </div>
              </section>

              {/* Attachments */}
              <section>
                <h3 className="text-[#172B4D] font-semibold text-[14px] mb-3">Attachments</h3>
                <div className="flex flex-wrap gap-2 mb-3">
                  {(task.attachments || []).map((att) => (
                    <div key={att.id} className="group relative border border-[#DFE1E6] rounded-[3px] p-2 bg-white hover:bg-[#F4F5F7] transition-colors w-32 truncate">
                      <div className="text-xs text-[#172B4D] truncate mb-1">{att.file_name}</div>
                      <div className="text-[10px] text-[#5E6C84]">{(att.file_size / 1024).toFixed(1)} KB</div>
                      {(canManageIssue || Number(att.uploaded_by) === Number(user?.id)) && (
                        <button
                          type="button"
                          className="mt-1 text-[10px] font-semibold text-[#DE350B] hover:underline"
                          onClick={() => handleDeleteAttachment(att.id)}
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  ))}
                  <label className="border-2 border-dashed border-[#DFE1E6] rounded-[3px] w-32 font-medium flex flex-col items-center justify-center cursor-pointer hover:bg-[#F4F5F7] transition-colors h-[54px] text-[#5E6C84]">
                    <span className="text-lg">+</span>
                    <span className="text-[11px]">Upload</span>
                    <input type="file" className="hidden" onChange={handleUpload} disabled={uploading} />
                  </label>
                </div>
                {uploading && <div className="text-[11px] text-[#0052CC] animate-pulse">Uploading…</div>}
              </section>

              {/* Reference Links */}
              <section>
                <h3 className="text-[#172B4D] font-semibold text-[14px] mb-3">Reference Links</h3>
                <div className="space-y-2 mb-4">
                  {(task.links || []).map((link) => (
                    <div key={link.id} className="flex flex-col p-2 border border-[#DFE1E6] rounded-[3px] bg-white">
                      <a href={link.url} target="_blank" rel="noreferrer" className="text-[14px] text-[#0052CC] font-medium hover:underline">
                        {link.title || link.url}
                      </a>
                      {link.description && <div className="text-[12px] text-[#5E6C84] mt-0.5">{link.description}</div>}
                    </div>
                  ))}
                </div>
                <form className="space-y-2" onSubmit={handleAddLink}>
                  <input
                    className="w-full px-3 py-1.5 border-2 border-[#DFE1E6] rounded-[3px] text-sm focus:border-[#4C9AFF] outline-none"
                    placeholder="Paste link URL"
                    value={linkForm.url}
                    onChange={(e) => setLinkForm((p) => ({ ...p, url: e.target.value }))}
                    required
                  />
                  <div className="flex gap-2">
                    <input
                      className="flex-1 px-3 py-1.5 border-2 border-[#DFE1E6] rounded-[3px] text-sm focus:border-[#4C9AFF] outline-none"
                      placeholder="Link title"
                      value={linkForm.title}
                      onChange={(e) => setLinkForm((p) => ({ ...p, title: e.target.value }))}
                    />
                    <button type="submit" className="bg-[#EBECF0] hover:bg-[#DFE1E6] text-[#42526E] px-3 py-1.5 rounded-[3px] text-sm font-medium transition-colors">
                      Add
                    </button>
                  </div>
                </form>
              </section>

              {/* Activity / Comments */}
              <section>
                <h3 className="text-[#172B4D] font-semibold text-[14px] mb-4">Time Tracking</h3>

                <form onSubmit={handleAddTimeLog} className="space-y-2 mb-4">
                  <div className="flex gap-2">
                    <input
                      type="number"
                      min="0.25"
                      step="0.25"
                      className="w-28 px-3 py-1.5 border-2 border-[#DFE1E6] rounded-[3px] text-sm focus:border-[#4C9AFF] outline-none"
                      placeholder="Hours"
                      value={timeLogForm.hours}
                      onChange={(e) => setTimeLogForm((prev) => ({ ...prev, hours: e.target.value }))}
                      required
                    />
                    <input
                      className="flex-1 px-3 py-1.5 border-2 border-[#DFE1E6] rounded-[3px] text-sm focus:border-[#4C9AFF] outline-none"
                      placeholder="What did you work on?"
                      value={timeLogForm.description}
                      onChange={(e) => setTimeLogForm((prev) => ({ ...prev, description: e.target.value }))}
                    />
                    <button
                      type="submit"
                      className="bg-[#0052CC] hover:bg-[#0065FF] text-white px-3 py-1.5 rounded-[3px] text-sm font-semibold shadow-sm disabled:opacity-60"
                      disabled={savingTimeLog}
                    >
                      {savingTimeLog ? 'Adding...' : 'Log'}
                    </button>
                  </div>
                </form>

                <div className="space-y-2">
                  {timeLogs.length === 0 && (
                    <div className="text-[12px] text-[#5E6C84]">No time logs yet.</div>
                  )}
                  {timeLogs.map((log) => {
                    const canDeleteTimeLog = Number(user?.id) === Number(log.user_id) || canManageIssue;
                    return (
                      <div key={log.id} className="flex items-start justify-between gap-2 p-2 border border-[#DFE1E6] rounded-[3px] bg-white">
                        <div>
                          <div className="text-[13px] text-[#172B4D] font-semibold">
                            {Number(log.hours).toFixed(2)}h
                            <span className="ml-2 text-[11px] text-[#5E6C84] font-normal">
                              by {log.user_name || 'User'}
                            </span>
                          </div>
                          {log.description && (
                            <div className="text-[12px] text-[#42526E] mt-1">{log.description}</div>
                          )}
                          <div className="text-[11px] text-[#5E6C84] mt-1">
                            {new Date(log.logged_at).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                          </div>
                        </div>
                        {canDeleteTimeLog && (
                          <button
                            type="button"
                            onClick={() => handleDeleteTimeLog(log.id)}
                            className="text-[11px] font-semibold text-[#DE350B] hover:underline disabled:opacity-50"
                            disabled={deletingTimeLogId === log.id}
                          >
                            {deletingTimeLogId === log.id ? 'Deleting...' : 'Delete'}
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </section>

              <section>
                <h3 className="text-[#172B4D] font-semibold text-[14px] mb-4">Activity</h3>
                <div className="flex gap-3 mb-6">
                  <div className="w-8 h-8 rounded-full bg-[#0052CC] text-white flex items-center justify-center text-xs font-bold shadow-sm">
                    {user?.first_name?.[0]}{user?.last_name?.[0]}
                  </div>
                  <form onSubmit={handleAddComment} className="flex-1">
                    <textarea
                      className="w-full px-3 py-2 border-2 border-[#DFE1E6] rounded-[3px] text-sm focus:border-[#4C9AFF] outline-none transition-all placeholder:text-gray-400 focus:bg-white bg-[#F4F5F7]"
                      rows={2}
                      placeholder="Add a comment…"
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                    />
                    <div className={`flex justify-end mt-2 transition-all ${commentText.trim() ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
                      <button type="submit" className="bg-[#0052CC] hover:bg-[#0065FF] text-white px-3 py-1.5 rounded-[3px] text-sm font-semibold shadow-sm">
                        Save
                      </button>
                    </div>
                  </form>
                </div>

                <div className="space-y-6">
                  {comments.map((c) => (
                    <div key={c.id} className="flex gap-3 group">
                      <div className="w-8 h-8 rounded-full bg-[#E6EFFC] text-[#0052CC] flex items-center justify-center text-xs font-bold border border-[#DFE1E6] uppercase shadow-sm">
                        {c.author_name?.[0] || '?'}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2">
                            <span className="text-[13px] font-bold text-[#172B4D]">{c.author_name}</span>
                            <span className="text-[11px] text-[#5E6C84]">{new Date(c.created_at).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}</span>
                          </div>
                          {(Number(user?.id) === Number(c.user_id) || canManageIssue) && (
                            <button
                              onClick={() => handleDeleteComment(c.id)}
                              className="opacity-0 group-hover:opacity-100 text-[11px] font-semibold text-[#DE350B] hover:underline transition-all"
                            >
                              Delete
                            </button>
                          )}
                        </div>
                        <div className="text-[14px] text-[#172B4D] leading-relaxed bg-[#F4F5F7] p-3 rounded-tr-lg rounded-br-lg rounded-bl-lg border border-[#DFE1E6]">
                          {c.content}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            </div>

            {/* Sidebar Properties (Right) */}
            <div className="w-full lg:w-72 border-l border-[#DFE1E6] p-6 bg-white space-y-6">
              <div>
                <h4 className="text-[11px] font-bold text-[#5E6C84] uppercase mb-3">Status</h4>
                <div className="inline-block px-3 py-1 bg-[#EBECF0] text-[#42526E] font-bold text-[12px] rounded-[3px] uppercase">
                  {task.status}
                </div>
              </div>

              <div>
                <h4 className="text-[11px] font-bold text-[#5E6C84] uppercase mb-3">Assignee</h4>
                {canManageIssue && isEditingAssignee ? (
                  <select
                    className="w-full border border-[#DFE1E6] bg-[#FAFBFC] px-3 py-2 rounded-[3px] focus:bg-white focus:border-[#4C9AFF] outline-none text-sm"
                    value={task.assigned_to || ''}
                    onChange={(e) => handleUpdateAssignee(e.target.value)}
                    onBlur={() => setIsEditingAssignee(false)}
                    autoFocus
                  >
                    <option value="">Unassigned</option>
                    {teamMembers.map(m => (
                      <option key={m.id} value={m.id}>{m.first_name} {m.last_name}</option>
                    ))}
                  </select>
                ) : (
                  <div
                    className={`flex items-center gap-2 px-1 py-1 rounded-[3px] ${canManageIssue ? 'hover:bg-[#EBECF0] transition-colors cursor-pointer' : ''}`}
                    onClick={() => {
                      if (canManageIssue) setIsEditingAssignee(true);
                    }}
                  >
                    <div className="w-6 h-6 rounded-full bg-[#0052CC] text-white flex items-center justify-center text-[10px] font-bold uppercase">
                      {task.assigned_to_name ? task.assigned_to_name[0] : '👤'}
                    </div>
                    <span className="text-[14px] text-[#172B4D]">{task.assigned_to_name || 'Unassigned'}</span>
                  </div>
                )}
              </div>

              <div>
                <h4 className="text-[11px] font-bold text-[#5E6C84] uppercase mb-3">Estimated Hours</h4>
                <div className="text-[14px] text-[#172B4D] font-semibold">
                  {task.estimated_hours != null ? `${Number(task.estimated_hours).toFixed(2)}h` : '-'}
                </div>
              </div>

              <div>
                <h4 className="text-[11px] font-bold text-[#5E6C84] uppercase mb-3">Total Logged Hours</h4>
                <div className="text-[14px] text-[#172B4D] font-semibold">
                  {totalLoggedHours.toFixed(2)}h
                </div>
              </div>

              <div>
                <h4 className="text-[11px] font-bold text-[#5E6C84] uppercase mb-3">Story Points</h4>
                <form className="flex items-center gap-2" onSubmit={handleSaveStoryPoints}>
                  <input
                    className="w-20 px-3 py-1 border-2 border-[#DFE1E6] rounded-[3px] text-sm focus:border-[#4C9AFF] outline-none"
                    type="number"
                    min="0"
                    value={storyPoints}
                    onChange={(e) => setStoryPoints(e.target.value)}
                  />
                  <button type="submit" className={`text-[#0052CC] text-sm font-semibold hover:underline ${savingStoryPoints ? 'opacity-50' : ''}`} disabled={savingStoryPoints}>
                    {savingStoryPoints ? '...' : 'Set'}
                  </button>
                </form>
              </div>

              <div>
                <h3 className="text-[11px] font-bold text-[#5E6C84] uppercase mb-3">Timeline</h3>
                <div className="text-[12px] text-[#172B4D]">
                  <div className="flex justify-between py-1">
                    <span className="text-[#5E6C84]">Created</span>
                    <span>{new Date(task.created_at).toLocaleDateString()}</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-[#5E6C84]">Updated</span>
                    <span>{new Date(task.updated_at).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>

              {canManageIssue && <div className="pt-6 border-t border-[#DFE1E6]">
                <button
                  onClick={handleDeleteTask}
                  className="w-full text-left px-3 py-2 text-sm font-semibold text-[#DE350B] hover:bg-[#FFEBE6] rounded-[3px] transition-colors flex items-center gap-2"
                >
                  <span>🗑️</span> Delete Issue
                </button>
              </div>}
            </div>
          </div>
        </>
      )}
    </aside>
  </div>
);
};

export default TaskDetailDrawer;

