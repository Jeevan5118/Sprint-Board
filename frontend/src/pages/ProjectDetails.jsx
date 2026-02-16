import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { projectService } from '../services/projectService';
import { sprintService } from '../services/sprintService';
import BackButton from '../components/Common/BackButton';

const ProjectDetails = () => {
    const { projectId } = useParams();
    const { user } = useAuth();
    const [project, setProject] = useState(null);
    const [sprints, setSprints] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [error, setError] = useState('');
    const [isDeleting, setIsDeleting] = useState(false);

    // Form State
    const [formData, setFormData] = useState({
        name: '',
        goal: '',
        start_date: '',
        end_date: ''
    });

    const fetchData = useCallback(async () => {
        try {
            const projectData = await projectService.getProjectById(projectId);
            setProject(projectData);

            const sprintsData = await sprintService.getSprintsByProject(projectId);
            setSprints(sprintsData);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [projectId]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleInputChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleCreateSprint = async (e) => {
        e.preventDefault();
        try {
            await sprintService.createSprint({ ...formData, project_id: projectId });
            setShowModal(false);
            setFormData({
                name: '',
                goal: '',
                start_date: '',
                end_date: ''
            });
            fetchData();
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to create sprint');
        }
    };

    const handleStartSprint = async (sprintId) => {
        if (!window.confirm('Start this sprint? This will enable the sprint board.')) return;
        try {
            await sprintService.startSprint(sprintId);
            fetchData();
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to start sprint');
        }
    };

    const handleCompleteSprint = async (sprintId) => {
        if (!window.confirm('Complete this sprint? All remaining tasks will stay as they are.')) return;
        try {
            await sprintService.completeSprint(sprintId);
            fetchData();
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to complete sprint');
        }
    };

    const handleDeleteProject = async () => {
        if (!window.confirm('Are you sure you want to delete this project? This action cannot be undone.')) return;
        setIsDeleting(true);
        try {
            await projectService.deleteProject(projectId);
            window.location.href = '/projects';
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to delete project');
            setIsDeleting(false);
        }
    };

    if (loading) return (
        <div className="flex justify-center items-center h-screen bg-gray-50">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
    );

    if (!project) return (
        <div className="p-8 text-center text-gray-500">Project not found</div>
    );

    return (
        <div className="bg-gray-50 min-h-screen">
            {/* Header Banner */}
            <div className="bg-white border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-8 py-10">
                    <BackButton to="/projects" />
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div>
                            <div className="flex items-center gap-3 mb-2">
                                <span className="bg-[#E6EFFC] text-[#0052CC] text-xs font-bold px-2 py-0.5 rounded uppercase tracking-wide">{project.key_code}</span>
                                <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">{project.name}</h1>
                            </div>
                            <p className="text-gray-500 max-w-2xl leading-relaxed">{project.description}</p>
                        </div>
                        <div className="flex items-center gap-3">
                            {user?.role === 'admin' && (
                                <button
                                    onClick={handleDeleteProject}
                                    disabled={isDeleting}
                                    className="px-4 py-2 border border-[#DE350B] text-[#DE350B] hover:bg-[#FFEBE6] text-sm font-bold rounded-lg transition-all"
                                >
                                    {isDeleting ? 'Deleting...' : 'Delete Project'}
                                </button>
                            )}
                            {user?.role === 'admin' && (
                                <button
                                    onClick={() => setShowModal(true)}
                                    className="btn-primary"
                                >
                                    <span>+</span> Create Sprint
                                </button>
                            )}
                        </div>
                    </div>

                    <div className="flex gap-6 mt-8 border-t border-gray-100 pt-6">
                        <div className="text-sm">
                            <span className="block text-gray-400 font-medium mb-1 uppercase text-xs tracking-wider">Status</span>
                            <span className={`px-2 py-1 rounded-md text-sm font-semibold border ${project.status === 'active' ? 'bg-green-50 text-green-700 border-green-100' : 'bg-gray-50 text-gray-700 border-gray-100'
                                }`}>
                                {project.status?.toUpperCase() || 'ACTIVE'}
                            </span>
                        </div>
                        <div className="text-sm">
                            <span className="block text-gray-400 font-medium mb-1 uppercase text-xs tracking-wider">Duration</span>
                            <span className="text-gray-700 font-medium">
                                {project.start_date ? new Date(project.start_date).toLocaleDateString() : 'N/A'} — {project.end_date ? new Date(project.end_date).toLocaleDateString() : 'N/A'}
                            </span>
                        </div>
                        <div className="text-sm">
                            <span className="block text-gray-400 font-medium mb-1 uppercase text-xs tracking-wider">Total Sprints</span>
                            <span className="text-gray-900 font-bold text-lg">{sprints.length}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Content Area */}
            <div className="max-w-7xl mx-auto px-8 py-10">
                <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center">
                    Sprint Timeline
                    <span className="ml-3 bg-gray-200 text-gray-600 text-xs font-semibold px-2.5 py-0.5 rounded-full">{sprints.length}</span>
                </h2>

                <div className="space-y-4 max-h-[65vh] overflow-y-auto pr-1">
                    {sprints.length === 0 ? (
                        <div className="text-center py-12 bg-white rounded-xl shadow-sm border border-gray-100 border-dashed">
                            <p className="text-gray-500">No active sprints. Plan your first sprint to get started.</p>
                        </div>
                    ) : (
                        sprints.map((sprint) => (
                            <div key={sprint.id} className="card bg-white p-6 flex flex-col md:flex-row justify-between items-start group transition-all duration-300 min-w-0">
                                <div className="flex-1 mb-4 md:mb-0 min-w-0">
                                    <div className="flex items-center gap-3 mb-2">
                                        <h3 className="text-xl font-bold text-gray-900 group-hover:text-[#0052CC] transition-colors break-words">{sprint.name}</h3>
                                        <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${sprint.status === 'active' ? 'bg-green-100 text-green-700' :
                                            sprint.status === 'completed' ? 'bg-gray-100 text-gray-600' : 'bg-yellow-100 text-yellow-700'
                                            }`}>
                                            {sprint.status}
                                        </span>
                                    </div>
                                    <p className="text-gray-500 text-sm leading-relaxed mb-3 break-words">{sprint.goal || 'No goal defined.'}</p>
                                    <div className="flex items-center gap-4 text-xs font-medium text-gray-400">
                                        <div className="flex items-center gap-1.5">
                                            <span>📅</span>
                                            <span>{new Date(sprint.start_date).toLocaleDateString()} - {new Date(sprint.end_date).toLocaleDateString()}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex gap-3 flex-wrap">
                                    {user?.role === 'admin' && sprint.status === 'planned' && (
                                        <button
                                            onClick={() => handleStartSprint(sprint.id)}
                                            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold rounded-lg shadow-sm transition-all"
                                        >
                                            Start Sprint
                                        </button>
                                    )}
                                    {user?.role === 'admin' && sprint.status === 'active' && (
                                        <button
                                            onClick={() => handleCompleteSprint(sprint.id)}
                                            className="px-4 py-2 bg-[#0052CC] hover:bg-[#0065FF] text-white text-sm font-semibold rounded-lg shadow-sm transition-all"
                                        >
                                            Complete Sprint
                                        </button>
                                    )}
                                    <Link
                                        to={`/projects/${projectId}/sprints/${sprint.id}/board`}
                                        className="btn-secondary flex items-center gap-2 hover:border-[#0052CC] hover:text-[#0052CC]"
                                    >
                                        <span>Open Board</span>
                                        <span className="text-lg">→</span>
                                    </Link>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900 bg-opacity-50 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden animate-fade-in-up">
                        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
                            <h2 className="text-lg font-bold text-gray-800">Plan New Sprint</h2>
                        </div>

                        <div className="p-6">
                            {error && (
                                <div className="mb-4 p-3 bg-red-50 text-red-700 text-sm rounded-lg border border-red-100">
                                    {error}
                                </div>
                            )}
                            <form onSubmit={handleCreateSprint}>
                                <div className="mb-5">
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Sprint Name</label>
                                    <input
                                        type="text"
                                        name="name"
                                        value={formData.name}
                                        onChange={handleInputChange}
                                        className="w-full border border-gray-300 px-3 py-2.5 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all placeholder-gray-400"
                                        placeholder="e.g. Sprint 24"
                                        required
                                    />
                                </div>

                                <div className="mb-5">
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Sprint Goal</label>
                                    <textarea
                                        name="goal"
                                        value={formData.goal}
                                        onChange={handleInputChange}
                                        className="w-full border border-gray-300 px-3 py-2.5 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                                        rows="3"
                                        placeholder="What do you want to achieve?"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4 mb-6">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Start Date</label>
                                        <input
                                            type="date"
                                            name="start_date"
                                            value={formData.start_date}
                                            onChange={handleInputChange}
                                            className="w-full border border-gray-300 px-3 py-2.5 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1.5">End Date</label>
                                        <input
                                            type="date"
                                            name="end_date"
                                            value={formData.end_date}
                                            onChange={handleInputChange}
                                            className="w-full border border-gray-300 px-3 py-2.5 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="flex justify-end gap-3 pt-6 ">
                                    <button
                                        type="button"
                                        onClick={() => setShowModal(false)}
                                        className="btn-secondary"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="btn-primary"
                                    >
                                        Create Sprint
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProjectDetails;
