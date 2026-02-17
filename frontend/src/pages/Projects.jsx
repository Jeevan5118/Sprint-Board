import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { projectService } from '../services/projectService';
import { teamService } from '../services/teamService';
import { useAuth } from '../context/AuthContext';
import BackButton from '../components/Common/BackButton';
import { getErrorMessage } from '../utils/error';
import useDebouncedValue from '../hooks/useDebouncedValue';

const Projects = () => {
    const { user } = useAuth();
    const [projects, setProjects] = useState([]);
    const [teams, setTeams] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [error, setError] = useState('');
    const [loadError, setLoadError] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [page, setPage] = useState(1);
    const PAGE_SIZE = 8;
    const debouncedSearchTerm = useDebouncedValue(searchTerm, 250);

    // Form State
    const [formData, setFormData] = useState({
        name: '',
        key_code: '',
        description: '',
        team_id: '',
        start_date: '',
        end_date: ''
    });

    const fetchData = useCallback(async () => {
        setLoadError('');
        try {
            const projectsData = await projectService.getAllProjects();
            setProjects(projectsData);

            if (user?.role === 'admin') {
                const teamsData = await teamService.getAllTeams();
                setTeams(teamsData);
            }
        } catch (err) {
            setLoadError(getErrorMessage(err, 'Failed to load projects'));
        } finally {
            setLoading(false);
        }
    }, [user?.role]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleInputChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleCreateProject = async (e) => {
        e.preventDefault();
        setError('');
        const key = formData.key_code.trim().toUpperCase();
        if (!/^[A-Z0-9]{2,10}$/.test(key)) {
            setError('Project key must be 2-10 characters (A-Z, 0-9).');
            return;
        }
        if (formData.start_date && formData.end_date && formData.end_date < formData.start_date) {
            setError('End date cannot be before start date.');
            return;
        }
        try {
            await projectService.createProject({ ...formData, key_code: key });
            setShowModal(false);
            setFormData({
                name: '',
                key_code: '',
                description: '',
                team_id: '',
                start_date: '',
                end_date: ''
            });
            fetchData();
        } catch (err) {
            setError(getErrorMessage(err, 'Failed to create project'));
        }
    };

    const filteredProjects = projects.filter((project) => {
        const q = debouncedSearchTerm.trim().toLowerCase();
        if (!q) return true;
        return (
            project.name.toLowerCase().includes(q) ||
            project.key_code.toLowerCase().includes(q)
        );
    });
    const totalPages = Math.max(1, Math.ceil(filteredProjects.length / PAGE_SIZE));
    const safePage = Math.min(page, totalPages);
    const pagedProjects = filteredProjects.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

    return (
        <div className="p-8 bg-white min-h-screen">
            <div className="max-w-7xl mx-auto">
                <div className="flex justify-between items-center mb-10">
                    <div>
                        <BackButton to="/" />
                        <h1 className="text-3xl font-extrabold text-[#172B4D] tracking-tight">Projects</h1>
                        <p className="text-gray-500 mt-2">Manage and monitor all your agile projects.</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => {
                                setSearchTerm(e.target.value);
                                setPage(1);
                            }}
                            placeholder="Search by name or key"
                            className="border border-[#DFE1E6] bg-white px-3 py-2 rounded-[3px] text-sm focus:outline-none focus:border-[#4C9AFF]"
                        />
                    {user?.role === 'admin' && (
                        <button
                            onClick={() => setShowModal(true)}
                            className="btn-primary"
                        >
                            <span>+</span> Create project
                        </button>
                    )}
                    </div>
                </div>

                {loading ? (
                    <div className="flex justify-center items-center h-64">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0052CC]"></div>
                    </div>
                ) : (
                    <>
                        {loadError && (
                            <div className="mb-4 p-3 bg-[#FFEBE6] text-[#DE350B] text-sm rounded-[3px]">{loadError}</div>
                        )}
                        {filteredProjects.length === 0 ? (
                            <div className="text-center py-20 bg-gray-50 rounded-lg">
                                <h3 className="text-lg font-medium text-[#172B4D]">No projects found</h3>
                                <p className="mt-1 text-[#5E6C84]">{searchTerm ? 'Try a different search.' : 'Start by creating your first project.'}</p>
                            </div>
                        ) : (
                            <div className="border border-[#DFE1E6] rounded-[3px] overflow-hidden bg-white">
                                <table className="min-w-full divide-y divide-[#DFE1E6]">
                                    <thead className="bg-[#FAFBFC]">
                                        <tr>
                                            <th scope="col" className="px-4 py-3 text-left text-xs font-bold text-[#6B778C] uppercase tracking-[0.04em]">Name</th>
                                            <th scope="col" className="px-4 py-3 text-left text-xs font-bold text-[#6B778C] uppercase tracking-[0.04em]">Key</th>
                                            <th scope="col" className="px-4 py-3 text-left text-xs font-bold text-[#6B778C] uppercase tracking-[0.04em]">Type</th>
                                            <th scope="col" className="px-4 py-3 text-left text-xs font-bold text-[#6B778C] uppercase tracking-[0.04em]">Lead</th>
                                            <th scope="col" className="relative px-4 py-3"><span className="sr-only">Actions</span></th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-[#DFE1E6]">
                                        {pagedProjects.map((project) => (
                                            <tr key={project.id} className="hover:bg-[#FAFBFC] transition-colors group">
                                                <td className="px-4 py-3 whitespace-nowrap">
                                                    <div className="flex items-center">
                                                        <div className="flex-shrink-0 h-6 w-6 rounded-[3px] bg-[#0052CC] flex items-center justify-center text-white text-[10px] font-bold shadow-sm">
                                                            {project.key_code.substring(0, 2)}
                                                        </div>
                                                        <div className="ml-3">
                                                            <Link to={`/projects/${project.id}`} className="text-sm font-medium text-[#0052CC] hover:underline focus:outline-none">
                                                                {project.name}
                                                            </Link>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3 whitespace-nowrap">
                                                    <div className="text-sm text-[#172B4D] font-medium">{project.key_code}</div>
                                                </td>
                                                <td className="px-4 py-3 whitespace-nowrap">
                                                    <div className="text-sm text-[#172B4D]">Software</div>
                                                </td>
                                                <td className="px-4 py-3 whitespace-nowrap">
                                                    <div className="flex items-center">
                                                        <div className="h-6 w-6 rounded-full bg-[#DFE1E6] flex items-center justify-center text-[10px] text-[#42526E] font-bold">
                                                            U
                                                        </div>
                                                        <span className="ml-2 text-sm text-[#5E6C84]">Unassigned</span>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium">
                                                    <Link to={`/projects/${project.id}`} className="text-[#42526E] hover:bg-[#EBECF0] p-1.5 rounded-[3px] transition-colors">
                                                        <span className="text-lg leading-none">•••</span>
                                                    </Link>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                <div className="flex items-center justify-between px-4 py-3 border-t border-[#DFE1E6] bg-[#FAFBFC] text-sm">
                                    <span className="text-[#5E6C84]">Page {safePage} of {totalPages}</span>
                                    <div className="flex gap-2">
                                        <button
                                            type="button"
                                            disabled={safePage === 1}
                                            onClick={() => setPage((p) => Math.max(1, p - 1))}
                                            className="btn-secondary disabled:opacity-50"
                                        >
                                            Previous
                                        </button>
                                        <button
                                            type="button"
                                            disabled={safePage === totalPages}
                                            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                                            className="btn-secondary disabled:opacity-50"
                                        >
                                            Next
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </>
                )}

                {showModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#091E42] bg-opacity-50">
                        <div className="bg-white rounded-[3px] shadow-2xl w-full max-w-lg overflow-hidden">
                            <div className="px-6 py-4 border-b border-[#DFE1E6]">
                                <h2 className="text-lg font-medium text-[#172B4D]">Create Project</h2>
                            </div>

                            <div className="p-6">
                                {error && (
                                    <div className="mb-4 p-3 bg-[#FFEBE6] text-[#DE350B] text-sm rounded-[3px]">
                                        {error}
                                    </div>
                                )}
                                <form onSubmit={handleCreateProject}>
                                    <div className="grid grid-cols-2 gap-4 mb-4">
                                        <div>
                                            <label className="block text-xs font-semibold text-[#5E6C84] mb-1.5 uppercase">Name</label>
                                            <input
                                                type="text"
                                                name="name"
                                                value={formData.name}
                                                onChange={handleInputChange}
                                                className="w-full border border-[#DFE1E6] bg-[#FAFBFC] px-3 py-2 rounded-[3px] focus:bg-white focus:border-[#4C9AFF] focus:ring-2 focus:ring-[#4C9AFF] outline-none transition-all text-sm hover:bg-[#EBECF0]"
                                                required
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-semibold text-[#5E6C84] mb-1.5 uppercase">Key</label>
                                            <input
                                                type="text"
                                                name="key_code"
                                                value={formData.key_code}
                                                onChange={handleInputChange}
                                                className="w-full border border-[#DFE1E6] bg-[#FAFBFC] px-3 py-2 rounded-[3px] focus:bg-white focus:border-[#4C9AFF] focus:ring-2 focus:ring-[#4C9AFF] outline-none transition-all text-sm uppercase hover:bg-[#EBECF0]"
                                                maxLength={5}
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div className="mb-4">
                                        <label className="block text-xs font-semibold text-[#5E6C84] mb-1.5 uppercase">Description</label>
                                        <textarea
                                            name="description"
                                            value={formData.description}
                                            onChange={handleInputChange}
                                            className="w-full border border-[#DFE1E6] bg-[#FAFBFC] px-3 py-2 rounded-[3px] focus:bg-white focus:border-[#4C9AFF] focus:ring-2 focus:ring-[#4C9AFF] outline-none transition-all text-sm hover:bg-[#EBECF0]"
                                            rows="3"
                                        />
                                    </div>

                                    <div className="mb-4">
                                        <label className="block text-xs font-semibold text-[#5E6C84] mb-1.5 uppercase">Team</label>
                                        <div className="relative">
                                            <select
                                                name="team_id"
                                                value={formData.team_id}
                                                onChange={handleInputChange}
                                                className="w-full border border-[#DFE1E6] bg-[#FAFBFC] px-3 py-2 rounded-[3px] focus:bg-white focus:border-[#4C9AFF] focus:ring-2 focus:ring-[#4C9AFF] outline-none transition-all appearance-none text-sm hover:bg-[#EBECF0]"
                                                required
                                            >
                                                <option value="">Select a Team</option>
                                                {teams.map(team => (
                                                    <option key={team.id} value={team.id}>{team.name}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4 mb-6">
                                        <div>
                                            <label className="block text-xs font-semibold text-[#5E6C84] mb-1.5 uppercase">Start Date</label>
                                            <input
                                                type="date"
                                                name="start_date"
                                                value={formData.start_date}
                                                onChange={handleInputChange}
                                                className="w-full border border-[#DFE1E6] bg-[#FAFBFC] px-3 py-2 rounded-[3px] focus:bg-white focus:border-[#4C9AFF] focus:ring-2 focus:ring-[#4C9AFF] outline-none transition-all text-sm hover:bg-[#EBECF0]"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-semibold text-[#5E6C84] mb-1.5 uppercase">End Date</label>
                                            <input
                                                type="date"
                                                name="end_date"
                                                value={formData.end_date}
                                                onChange={handleInputChange}
                                                className="w-full border border-[#DFE1E6] bg-[#FAFBFC] px-3 py-2 rounded-[3px] focus:bg-white focus:border-[#4C9AFF] focus:ring-2 focus:ring-[#4C9AFF] outline-none transition-all text-sm hover:bg-[#EBECF0]"
                                            />
                                        </div>
                                    </div>

                                    <div className="flex justify-end gap-3 pt-6">
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
                                            Create project
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Projects;
