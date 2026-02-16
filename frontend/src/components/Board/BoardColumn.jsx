import React from 'react';

const BoardColumn = ({ title, statusKey, tasks, onDropTask, onTaskClick, onQuickCreate }) => {
  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('text/plain');
    if (taskId) {
      onDropTask(Number(taskId), statusKey);
    }
  };

  const getTaskTypeIcon = (type) => {
    switch (type?.toLowerCase()) {
      case 'story': return <span className="text-[#36B37E] font-bold" title="Story">📗</span>;
      case 'bug': return <span className="text-[#FF5630] font-bold" title="Bug">🔴</span>;
      case 'task': return <span className="text-[#0052CC] font-bold" title="Task">📘</span>;
      case 'epic': return <span className="text-[#6554C0] font-bold" title="Epic">🟪</span>;
      default: return <span className="text-[#0052CC] font-bold" title="Task">📘</span>;
    }
  };

  const getPriorityIcon = (priority) => {
    switch (priority?.toLowerCase()) {
      case 'highest': return <span className="text-[#DE350B] font-bold" title="Highest">⏫</span>;
      case 'high': return <span className="text-[#DE350B] font-bold" title="High">🔼</span>;
      case 'medium': return <span className="text-[#FFAB00] font-bold" title="Medium">⏺</span>;
      case 'low': return <span className="text-[#0065FF] font-bold" title="Low">🔽</span>;
      case 'lowest': return <span className="text-[#0065FF] font-bold" title="Lowest">⏬</span>;
      default: return null;
    }
  };

  const getInitials = (name) => {
    if (!name) return '?';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  return (
    <div className="board-column" onDragOver={handleDragOver} onDrop={handleDrop}>
      <div className="board-column-header">
        <span className="font-semibold text-[#5E6C84] uppercase text-[12px]">{title}</span>
        <span className="board-column-count">{tasks.length}</span>
      </div>
      <div className="board-column-body px-2 pb-2">
        {tasks.map((task) => (
          <div
            key={task.id}
            className="bg-white p-3 rounded-[3px] shadow-sm mb-2 border border-transparent hover:border-[#4C9AFF] cursor-pointer transition-all active:shadow-md group"
            draggable
            onDragStart={(e) => e.dataTransfer.setData('text/plain', String(task.id))}
            onClick={() => onTaskClick?.(task.id)}
          >
            <div className="text-[14px] text-[#172B4D] mb-3 leading-tight font-normal group-hover:text-[#0052CC]">
              {task.title}
            </div>

            <div className="flex justify-between items-end">
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1">
                  {getTaskTypeIcon(task.type)}
                  <span className="text-[11px] font-semibold text-[#5E6C84] hover:underline uppercase">
                    {task.task_key || `TASK-${task.id}`}
                  </span>
                </div>
                {getPriorityIcon(task.priority)}
              </div>

              <div className="flex items-center gap-1.5">
                {task.story_points != null && (
                  <span className="bg-[#DFE1E6] text-[#172B4D] text-[11px] font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center">
                    {task.story_points}
                  </span>
                )}
                {task.assigned_to_name ? (
                  <div
                    className="w-6 h-6 rounded-full bg-[#0052CC] text-white flex items-center justify-center text-[10px] font-bold border-2 border-white shadow-sm"
                    title={task.assigned_to_name}
                  >
                    {getInitials(task.assigned_to_name)}
                  </div>
                ) : (
                  <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-[10px] text-gray-500 border-2 border-white" title="Unassigned">
                    👤
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
        <button
          onClick={onQuickCreate}
          className="flex items-center gap-2 w-full p-2 text-[14px] text-[#5E6C84] hover:bg-[#EBECF0] hover:text-[#172B4D] rounded-[3px] transition-colors mt-2 font-medium group/create"
        >
          <span className="text-xl leading-none group-hover/create:text-[#0052CC]">+</span>
          <span>Create issue</span>
        </button>
      </div>
    </div>
  );
};

export default BoardColumn;

