import React, { useState, useEffect } from 'react';
import { projectService } from '../../services/projectService';
import { teamService } from '../../services/teamService';
import { taskService } from '../../services/taskService';

const CreateTaskModal = ({ projectId, sprintId, initialStatus = 'todo', onClose, onTaskCreated }) => {
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        type: 'task',
        priority: 'medium',
        status: initialStatus,
        assigned_to: '',
        story_points: 0,
        due_date: ''
    });
    const [teamMembers, setTeamMembers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchMembers = async () => {
            try {
                const project = await projectService.getProjectById(projectId);
                if (project.team_id) {
                    const members = await teamService.getMembers(project.team_id);
                    setTeamMembers(members);
                }
            } catch (err) {
                console.error('Failed to fetch team members', err);
            }
        };
        fetchMembers();
    }, [projectId]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            await taskService.createTask({
                ...formData,
                project_id: projectId,
                sprint_id: sprintId
            });
            onTaskCreated();
            onClose();
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to create task');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#091E42] bg-opacity-50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-[3px] shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-fade-in-up">
                <header className="px-6 py-4 border-b border-[#DFE1E6] flex justify-between items-center sticky top-0 bg-white z-10">
                    <h2 className="text-xl font-semibold text-[#172B4D]">Create Issue</h2>
                    <button onClick={onClose} className="text-[#42526E] hover:bg-[#EBECF0] p-1 rounded transition-colors text-2xl leading-none">&times;</button>
                </header>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {error && (
                        <div className="p-3 bg-[#FFEBE6] text-[#DE350B] text-sm rounded-[3px] border border-[#FFBDAD]">
                            {error}
                        </div>
                    )}

                    <div className="space-y-4">
                        <div>
                            <label className="block text-xs font-bold text-[#5E6C84] uppercase mb-1">Summary <span className="text-red-500">*</span></label>
                            <input
                                type="text"
                                name="title"
                                value={formData.title}
                                onChange={handleInputChange}
                                className="w-full border-2 border-[#DFE1E6] bg-[#FAFBFC] px-3 py-2 rounded-[3px] focus:bg-white focus:border-[#4C9AFF] outline-none transition-all text-sm"
                                placeholder="What needs to be done?"
                                required
                                autoFocus
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-[#5E6C84] uppercase mb-1">Issue Type</label>
                                <select
                                    name="type"
                                    value={formData.type}
                                    onChange={handleInputChange}
                                    className="w-full border-2 border-[#DFE1E6] bg-[#FAFBFC] px-3 py-2 rounded-[3px] focus:bg-white focus:border-[#4C9AFF] outline-none text-sm"
                                >
                                    <option value="task">Task</option>
                                    <option value="story">Story</option>
                                    <option value="bug">Bug</option>
                                    <option value="epic">Epic</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-[#5E6C84] uppercase mb-1">Priority</label>
                                <select
                                    name="priority"
                                    value={formData.priority}
                                    onChange={handleInputChange}
                                    className="w-full border-2 border-[#DFE1E6] bg-[#FAFBFC] px-3 py-2 rounded-[3px] focus:bg-white focus:border-[#4C9AFF] outline-none text-sm"
                                >
                                    <option value="highest">Highest</option>
                                    <option value="high">High</option>
                                    <option value="medium">Medium</option>
                                    <option value="low">Low</option>
                                    <option value="lowest">Lowest</option>
                                </select>
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-[#5E6C84] uppercase mb-1">Description</label>
                            <textarea
                                name="description"
                                value={formData.description}
                                onChange={handleInputChange}
                                className="w-full border-2 border-[#DFE1E6] bg-[#FAFBFC] px-3 py-2 rounded-[3px] focus:bg-white focus:border-[#4C9AFF] outline-none transition-all text-sm"
                                rows="4"
                                placeholder="Add more details about this issue..."
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-[#5E6C84] uppercase mb-1">Assignee</label>
                                <select
                                    name="assigned_to"
                                    value={formData.assigned_to}
                                    onChange={handleInputChange}
                                    className="w-full border-2 border-[#DFE1E6] bg-[#FAFBFC] px-3 py-2 rounded-[3px] focus:bg-white focus:border-[#4C9AFF] outline-none text-sm"
                                >
                                    <option value="">Unassigned</option>
                                    {teamMembers.map(m => (
                                        <option key={m.id} value={m.id}>{m.first_name} {m.last_name}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-[#5E6C84] uppercase mb-1">Story Points</label>
                                <input
                                    type="number"
                                    name="story_points"
                                    value={formData.story_points}
                                    onChange={handleInputChange}
                                    className="w-full border-2 border-[#DFE1E6] bg-[#FAFBFC] px-3 py-2 rounded-[3px] focus:bg-white focus:border-[#4C9AFF] outline-none text-sm"
                                    min="0"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-[#5E6C84] uppercase mb-1">Due Date</label>
                            <input
                                type="date"
                                name="due_date"
                                value={formData.due_date}
                                onChange={handleInputChange}
                                className="w-full border-2 border-[#DFE1E6] bg-[#FAFBFC] px-3 py-2 rounded-[3px] focus:bg-white focus:border-[#4C9AFF] outline-none text-sm"
                            />
                        </div>
                    </div>

                    <footer className="flex justify-end gap-3 pt-6 border-t border-[#DFE1E6]">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-sm font-semibold text-[#42526E] hover:bg-[#EBECF0] rounded-[3px] transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="btn-primary flex items-center gap-2"
                        >
                            {loading ? 'Creating...' : 'Create Issue'}
                        </button>
                    </footer>
                </form>
            </div>
        </div>
    );
};

export default CreateTaskModal;
