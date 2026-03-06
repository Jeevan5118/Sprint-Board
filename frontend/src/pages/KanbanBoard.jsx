import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import api from '../services/api';
import { taskService } from '../services/taskService';
import TaskDetailDrawer from '../components/Board/TaskDetailDrawer';
import CreateTaskModal from '../components/Board/CreateTaskModal';
import { useAuth } from '../context/AuthContext';
import { getErrorMessage } from '../utils/error';

const COLUMNS = [
  { key: 'todo', title: 'To Do' },
  { key: 'in_progress', title: 'In Progress' },
  { key: 'in_review', title: 'Review' },
  { key: 'done', title: 'Done' }
];

const normalizeLimits = (data) => {
  const rawLimits = data?.column_limits || data?.columnLimits || data?.limits || [];

  if (Array.isArray(rawLimits)) {
    return rawLimits.reduce((acc, item) => {
      if (item?.column_name) {
        acc[item.column_name] = Number(item.wip_limit);
      }
      return acc;
    }, {});
  }

  if (rawLimits && typeof rawLimits === 'object') {
    return Object.entries(rawLimits).reduce((acc, [key, value]) => {
      const numeric = Number(value?.wip_limit ?? value);
      if (Number.isFinite(numeric) && numeric > 0) {
        acc[key] = numeric;
      }
      return acc;
    }, {});
  }

  return {};
};

const KanbanBoard = () => {
  const { projectId } = useParams();
  const { user } = useAuth();
  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [columnLimits, setColumnLimits] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionMessage, setActionMessage] = useState('');
  const [wipMessage, setWipMessage] = useState('');
  const [selectedTaskId, setSelectedTaskId] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [initialCreateStatus, setInitialCreateStatus] = useState('todo');
  const [movingTaskIds, setMovingTaskIds] = useState(new Set());
  const canManageProject =
    user?.role === 'admin' || Number(project?.team_lead_id) === Number(user?.id);

  const fetchBoard = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get(`/kanban/${projectId}`);
      const payload = res.data?.data || {};
      setProject(payload.project || null);
      setTasks(payload.tasks || []);
      setColumnLimits(normalizeLimits(payload));
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to load Kanban board'));
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchBoard();
  }, [fetchBoard]);

  const groupedTasks = useMemo(() => {
    return COLUMNS.reduce((acc, column) => {
      acc[column.key] = tasks.filter((task) => task.status === column.key);
      return acc;
    }, {});
  }, [tasks]);

  const getLimitState = (statusKey) => {
    const count = groupedTasks[statusKey]?.length || 0;
    const limit = Number(columnLimits[statusKey]);
    if (!Number.isFinite(limit) || limit <= 0) {
      return { count, limit: null, nearLimit: false };
    }

    const ratio = count / limit;
    return {
      count,
      limit,
      nearLimit: ratio >= 0.8 && ratio < 1
    };
  };

  const handleDropTask = async (taskId, toStatus) => {
    if (movingTaskIds.has(taskId)) {
      return;
    }

    const sourceTask = tasks.find((task) => Number(task.id) === Number(taskId));
    if (!sourceTask || sourceTask.status === toStatus) {
      return;
    }

    try {
      setWipMessage('');
      setMovingTaskIds((prev) => {
        const next = new Set(prev);
        next.add(taskId);
        return next;
      });
      await taskService.updateStatus(taskId, toStatus);
      setActionMessage('Task moved successfully.');
      setTimeout(() => setActionMessage(''), 1500);
      await fetchBoard();
    } catch (err) {
      const message = getErrorMessage(err, 'Failed to move task');
      const isWipExceeded =
        err?.response?.status === 400 &&
        /wip limit|limit reached/i.test(message);

      if (isWipExceeded) {
        setWipMessage(message);
      } else {
        setError(message);
      }
    } finally {
      setMovingTaskIds((prev) => {
        const next = new Set(prev);
        next.delete(taskId);
        return next;
      });
    }
  };

  const handleTaskUpdated = useCallback((updatedTask) => {
    if (!updatedTask?.id) return;
    setTasks((prev) =>
      prev.map((task) =>
        Number(task.id) === Number(updatedTask.id) ? { ...task, ...updatedTask } : task
      )
    );
  }, []);

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center h-full text-gray-400">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0052CC]"></div>
        <span className="ml-3">Loading Kanban board...</span>
      </div>
    );
  }

  if (error) {
    return <div className="p-8 auth-error max-w-2xl mx-auto my-10">{error}</div>;
  }

  return (
    <div className="flex flex-col h-full bg-[#EBECF0]">
      <div className="px-8 pt-6 pb-2">
        {actionMessage && (
          <div className="mb-3 rounded-[3px] border border-[#B3DFCC] bg-[#E3FCEF] px-3 py-2 text-sm text-[#006644]">
            {actionMessage}
          </div>
        )}
        {wipMessage && (
          <div className="mb-3 rounded-[3px] border border-[#FFBDAD] bg-[#FFEBE6] px-3 py-2 text-sm text-[#BF2600]">
            {wipMessage}
          </div>
        )}
        <nav className="flex items-center gap-1 text-[13px] text-gray-400 mb-2">
          <Link to="/projects" className="hover:text-[#0052CC] transition-colors">Projects</Link>
          <span className="mx-1">/</span>
          <Link to={`/projects/${projectId}`} className="hover:text-[#0052CC] transition-colors">
            {project?.name || 'Project'}
          </Link>
          <span className="mx-1">/</span>
          <span className="text-gray-600 font-medium">Kanban Board</span>
        </nav>
        <h1 className="text-2xl font-bold text-[#172B4D] tracking-tight">
          {project?.key_code} Kanban Board
        </h1>
        {canManageProject && (
          <div className="mt-3">
            <button
              type="button"
              className="btn-primary"
              onClick={() => {
                setInitialCreateStatus('todo');
                setShowCreateModal(true);
              }}
            >
              Create Issue
            </button>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-x-auto p-6 pt-0 bg-[#EBECF0]">
        <div className="flex gap-4 min-w-max h-full">
          {COLUMNS.map((column) => {
            const limitState = getLimitState(column.key);
            const columnTasks = groupedTasks[column.key] || [];

            return (
              <div
                key={column.key}
                className="board-column"
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  const taskId = e.dataTransfer.getData('text/plain');
                  if (taskId) {
                    handleDropTask(Number(taskId), column.key);
                  }
                }}
              >
                <div className="board-column-header">
                  <span className="font-semibold text-[#5E6C84] uppercase text-[12px]">
                    {`${column.title} (${limitState.count}/${limitState.limit ?? '-'})`}
                  </span>
                </div>
                {limitState.nearLimit && (
                  <div className="mx-2 mt-2 rounded border border-[#FFAB00] bg-[#FFFAE6] px-2 py-1 text-[11px] text-[#974F0C]">
                    WIP is near limit
                  </div>
                )}
                <div className="board-column-body px-2 pb-2 mt-2">
                  {columnTasks.map((task) => (
                    <div
                      key={task.id}
                      className={`bg-white p-3 rounded-[3px] shadow-sm mb-2 border border-transparent hover:border-[#4C9AFF] cursor-pointer transition-all ${movingTaskIds.has(task.id) ? 'opacity-60 cursor-not-allowed' : ''}`}
                      draggable={!movingTaskIds.has(task.id)}
                      onDragStart={(e) => {
                        if (movingTaskIds.has(task.id)) {
                          e.preventDefault();
                          return;
                        }
                        e.dataTransfer.setData('text/plain', String(task.id));
                      }}
                      onClick={() => setSelectedTaskId(task.id)}
                    >
                      <div className="text-[14px] text-[#172B4D] mb-2 leading-tight">
                        {task.title}
                      </div>
                      <div className="text-[11px] font-semibold text-[#5E6C84] uppercase">
                        {task.task_key || `TASK-${task.id}`}
                      </div>
                    </div>
                  ))}
                  {canManageProject && (
                    <button
                      type="button"
                      className="w-full mt-1 text-left text-[13px] font-semibold text-[#0052CC] hover:underline px-1 py-1"
                      onClick={() => {
                        setInitialCreateStatus(column.key);
                        setShowCreateModal(true);
                      }}
                    >
                      + Create issue
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {selectedTaskId && (
        <TaskDetailDrawer
          taskId={selectedTaskId}
          onTaskUpdated={handleTaskUpdated}
          onClose={() => {
            setSelectedTaskId(null);
            fetchBoard();
          }}
        />
      )}

      {canManageProject && showCreateModal && (
        <CreateTaskModal
          projectId={projectId}
          sprintId={null}
          initialStatus={initialCreateStatus}
          onClose={() => setShowCreateModal(false)}
          onTaskCreated={fetchBoard}
        />
      )}
    </div>
  );
};

export default KanbanBoard;
