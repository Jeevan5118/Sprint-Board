import React, { useEffect, useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { taskService } from '../services/taskService';
import { projectService } from '../services/projectService';
import { sprintService } from '../services/sprintService';
import BoardColumn from '../components/Board/BoardColumn';
import TaskDetailDrawer from '../components/Board/TaskDetailDrawer';
import CreateTaskModal from '../components/Board/CreateTaskModal';
import { useAuth } from '../context/AuthContext';

const SprintBoard = () => {
  const { projectId, sprintId } = useParams();
  const [backlog, setBacklog] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [project, setProject] = useState(null);
  const [sprint, setSprint] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedTaskId, setSelectedTaskId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [onlyMyIssues, setOnlyMyIssues] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [initialCreateStatus, setInitialCreateStatus] = useState('todo');
  const { user } = useAuth();

  const fetchTasks = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [sprintTasks, backlogTasks, projData, sprintsData] = await Promise.all([
        taskService.getTasksBySprint(sprintId),
        taskService.getBacklogByProject(projectId, sprintId),
        projectService.getProjectById(projectId),
        sprintService.getSprintsByProject(projectId)
      ]);
      setTasks(sprintTasks);
      setBacklog(backlogTasks);
      setProject(projData);
      // Normalize IDs to strings to handle mixed number/string payloads
      setSprint(sprintsData.find((s) => String(s.id) === String(sprintId)));
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load tasks');
    } finally {
      setLoading(false);
    }
  }, [projectId, sprintId]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const filterTasks = (taskList) => {
    return taskList.filter(t => {
      const matchesSearch = t.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (t.task_key && t.task_key.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesMyIssues = !onlyMyIssues || t.assigned_to === user?.id;
      return matchesSearch && matchesMyIssues;
    });
  };

  const handleDropTask = async (taskId, newStatusKey) => {
    const sourceTask =
      tasks.find((t) => t.id === taskId) || backlog.find((t) => t.id === taskId);
    if (!sourceTask) return;

    const isAlreadyInTarget =
      newStatusKey === 'backlog'
        ? sourceTask.sprint_id === null || sourceTask.sprint_id === undefined
        : String(sourceTask.sprint_id) === String(sprintId) &&
          sourceTask.status === newStatusKey;
    if (isAlreadyInTarget) return;

    try {
      // Determine if we're moving to backlog or a board column
      const isToBacklog = newStatusKey === 'backlog';
      const updateData = {
        status: isToBacklog ? 'todo' : newStatusKey,
        sprint_id: isToBacklog ? null : Number(sprintId)
      };

      const updated = await taskService.updateTask(taskId, updateData);

      if (isToBacklog) {
        // Move from tasks to backlog
        setTasks((prev) => prev.filter((t) => t.id !== taskId));
        setBacklog((prev) => {
          const others = prev.filter((t) => t.id !== taskId);
          return [updated, ...others];
        });
      } else {
        // Move from backlog to board OR within board
        setBacklog((prev) => prev.filter((t) => t.id !== taskId));
        setTasks((prev) => {
          const others = prev.filter((t) => t.id !== taskId);
          return [updated, ...others];
        });
      }
    } catch (err) {
      console.error('Failed to update task status/sprint', err);
      alert(err.response?.data?.message || 'Failed to move task');
      fetchTasks();
    }
  };

  const handleTaskUpdated = useCallback((updatedTask) => {
    if (!updatedTask?.id) return;
    setTasks((prev) => prev.map((t) => (t.id === updatedTask.id ? { ...t, ...updatedTask } : t)));
    setBacklog((prev) => prev.map((t) => (t.id === updatedTask.id ? { ...t, ...updatedTask } : t)));
  }, []);

  const filteredTasks = filterTasks(tasks);
  const filteredBacklog = filterTasks(backlog);

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center h-full text-gray-400">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0052CC]"></div>
        <span className="ml-3">Loading board...</span>
      </div>
    );
  }

  if (error) {
    return <div className="p-8 auth-error max-w-2xl mx-auto my-10">{error}</div>;
  }

  return (
    <div className="flex flex-col h-full bg-[#EBECF0]">
      <div className="px-8 pt-6 pb-2">
        <div className="flex justify-between items-start mb-4">
          <div>
            <nav className="flex items-center gap-1 text-[13px] text-gray-400 mb-2">
              <Link to="/projects" className="hover:text-[#0052CC] transition-colors">Projects</Link>
              <span className="mx-1">/</span>
              <Link to={`/projects/${projectId}`} className="hover:text-[#0052CC] transition-colors">{project?.name || 'Project'}</Link>
              <span className="mx-1">/</span>
              <span className="text-gray-600 font-medium">{sprint?.name || 'Sprint'}</span>
            </nav>
            <h1 className="text-2xl font-bold text-[#172B4D] tracking-tight">
              {project?.key_code} {sprint?.name || 'Sprint Board'}
            </h1>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => {
                setInitialCreateStatus('todo');
                setShowCreateModal(true);
              }}
              className="btn-primary"
            >
              Create Issue
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-6">
            <div className="relative group">
              <input
                type="text"
                placeholder="Search board"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border-2 border-gray-200 rounded-lg text-sm focus:border-[#0052CC] focus:ring-4 focus:ring-[#E6EFFC] outline-none transition-all w-64 bg-white shadow-sm"
              />
              <span className="absolute left-3.5 top-2.5 text-gray-400 group-focus-within:text-[#0052CC]">🔍</span>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex -space-x-2">
                {[...new Set(tasks.map(t => t.assigned_to_name).filter(Boolean))].slice(0, 5).map((name, i) => (
                  <div
                    key={i}
                    className="w-8 h-8 rounded-full bg-white border-2 border-[#F4F7FA] flex items-center justify-center text-[10px] font-bold shadow-sm hover:z-10 transition-transform hover:scale-110 cursor-help"
                    style={{ color: '#0052CC' }}
                    title={name}
                  >
                    {name[0].toUpperCase()}
                  </div>
                ))}
              </div>
              <button
                onClick={() => setOnlyMyIssues(!onlyMyIssues)}
                className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-all duration-200 ${onlyMyIssues ? 'bg-[#0052CC] text-white shadow-md' : 'btn-secondary shadow-sm'}`}
              >
                Only my issues
              </button>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-2">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Team</span>
            <div className="px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-sm font-semibold text-[#172B4D] shadow-sm">
              {project?.team_name || 'Agile Team'}
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-x-auto p-6 pt-0 bg-[#EBECF0]">
        <div className="flex gap-4 min-w-max h-full">
          <BoardColumn
            title="Backlog"
            statusKey="backlog"
            tasks={filteredBacklog}
            onDropTask={handleDropTask}
            onTaskClick={setSelectedTaskId}
            onQuickCreate={() => {
              setInitialCreateStatus('backlog');
              setShowCreateModal(true);
            }}
          />
          <BoardColumn
            title="To Do"
            statusKey="todo"
            tasks={filteredTasks.filter((t) => t.status === 'todo')}
            onDropTask={handleDropTask}
            onTaskClick={setSelectedTaskId}
            onQuickCreate={() => {
              setInitialCreateStatus('todo');
              setShowCreateModal(true);
            }}
          />
          <BoardColumn
            title="In Progress"
            statusKey="in_progress"
            tasks={filteredTasks.filter((t) => t.status === 'in_progress')}
            onDropTask={handleDropTask}
            onTaskClick={setSelectedTaskId}
            onQuickCreate={() => {
              setInitialCreateStatus('in_progress');
              setShowCreateModal(true);
            }}
          />
          <BoardColumn
            title="Review"
            statusKey="in_review"
            tasks={filteredTasks.filter((t) => t.status === 'in_review')}
            onDropTask={handleDropTask}
            onTaskClick={setSelectedTaskId}
            onQuickCreate={() => {
              setInitialCreateStatus('in_review');
              setShowCreateModal(true);
            }}
          />
          <BoardColumn
            title="Done"
            statusKey="done"
            tasks={filteredTasks.filter((t) => t.status === 'done')}
            onDropTask={handleDropTask}
            onTaskClick={setSelectedTaskId}
            onQuickCreate={() => {
              setInitialCreateStatus('done');
              setShowCreateModal(true);
            }}
          />
        </div>
      </div>

      {selectedTaskId && (
        <TaskDetailDrawer
          taskId={selectedTaskId}
          onTaskUpdated={handleTaskUpdated}
          onClose={() => {
            setSelectedTaskId(null);
            fetchTasks();
          }}
        />
      )}

      {showCreateModal && (
        <CreateTaskModal
          projectId={projectId}
          sprintId={sprintId}
          initialStatus={initialCreateStatus}
          onClose={() => setShowCreateModal(false)}
          onTaskCreated={fetchTasks}
        />
      )}
    </div>
  );
};

export default SprintBoard;
