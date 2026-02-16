import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { taskService } from '../../services/taskService';
import { projectService } from '../../services/projectService';
import { teamService } from '../../services/teamService';

const TaskDetailDrawer = ({ taskId, onClose, onTaskUpdated }) => {
  const [task, setTask] = useState(null);
  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState('');
  const [storyPoints, setStoryPoints] = useState('');
  const [linkForm, setLinkForm] = useState({ url: '', title: '', description: '' });
  const [uploading, setUploading] = useState(false);
  const [savingStoryPoints, setSavingStoryPoints] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [teamMembers, setTeamMembers] = useState([]);
  const [isEditingAssignee, setIsEditingAssignee] = useState(false);
  const { projectId } = useParams();
  const { user } = useAuth();

  useEffect(() => {
    if (!taskId) return;
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setError('');

      try {
        const [taskData, taskComments] = await Promise.all([
          taskService.getTaskDetails(taskId),
          taskService.getComments(taskId)
        ]);

        if (cancelled) return;
        setTask(taskData);
        setComments(taskComments);
        setStoryPoints(taskData.story_points ?? '');

        if (projectId) {
          const proj = await projectService.getProjectById(projectId);
          if (proj.team_id) {
            const members = await teamService.getMembers(proj.team_id);
            if (!cancelled) {
              setTeamMembers(members);
            }
          }
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.response?.data?.message || 'Failed to load task details');
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
  }
};

const handleDeleteComment = async (commentId) => {
  if (!window.confirm('Delete this comment?')) return;
  try {
    await taskService.deleteComment(commentId);
    setComments((prev) => prev.filter((c) => c.id !== commentId));
  } catch (err) {
    console.error(err);
    alert('Failed to delete comment');
  }
};

const handleUpload = async (e) => {
  const file = e.target.files?.[0];
  if (!file) return;

  // Validation
  const maxSize = 5 * 1024 * 1024; // 5MB
  const allowedTypes = [
    'image/jpeg', 'image/png', 'image/gif',
    'application/pdf', 'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain'
  ];

  if (file.size > maxSize) {
    alert('File size exceeds 5MB limit');
    return;
  }

  if (!allowedTypes.includes(file.type)) {
    alert('File type not supported. Please upload images, PDFs, or Word docs.');
    return;
  }

  setUploading(true);
  try {
    const attachments = await taskService.uploadAttachment(taskId, file);
    setTask((prev) => (prev ? { ...prev, attachments } : prev));
  } catch (err) {
    console.error(err);
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
    alert(err.response?.data?.message || 'Failed to update story points');
  } finally {
    setSavingStoryPoints(false);
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
  }
};

const handleDeleteTask = async () => {
  if (!window.confirm('Are you sure you want to delete this issue? This action cannot be undone.')) return;
  try {
    await taskService.deleteTask(taskId);
    onClose();
  } catch (err) {
    console.error(err);
    alert('Failed to delete task');
  }
};

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
              <h2 className="text-2xl font-bold text-[#172B4D] leading-tight tracking-tight mb-6">{task.title}</h2>
            </div>
            <button type="button" className="p-1 hover:bg-[#EBECF0] rounded-[3px] text-[#42526E] text-2xl leading-none transition-colors" onClick={onClose}>
              &times;
            </button>
          </header>

          <div className="flex flex-col lg:flex-row h-full">
            {/* Main Content (Left) */}
            <div className="flex-1 p-6 space-y-8 overflow-y-auto">
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
                          {user?.id === c.user_id && (
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
                {isEditingAssignee ? (
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
                    className="flex items-center gap-2 px-1 py-1 hover:bg-[#EBECF0] transition-colors cursor-pointer rounded-[3px]"
                    onClick={() => setIsEditingAssignee(true)}
                  >
                    <div className="w-6 h-6 rounded-full bg-[#0052CC] text-white flex items-center justify-center text-[10px] font-bold uppercase">
                      {task.assigned_to_name ? task.assigned_to_name[0] : '👤'}
                    </div>
                    <span className="text-[14px] text-[#172B4D]">{task.assigned_to_name || 'Unassigned'}</span>
                  </div>
                )}
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

              <div className="pt-6 border-t border-[#DFE1E6]">
                <button
                  onClick={handleDeleteTask}
                  className="w-full text-left px-3 py-2 text-sm font-semibold text-[#DE350B] hover:bg-[#FFEBE6] rounded-[3px] transition-colors flex items-center gap-2"
                >
                  <span>🗑️</span> Delete Issue
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </aside>
  </div>
);
};

export default TaskDetailDrawer;

