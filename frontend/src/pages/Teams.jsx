import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { teamService } from '../services/teamService';
import BackButton from '../components/Common/BackButton';
import { getErrorMessage } from '../utils/error';
import useDebouncedValue from '../hooks/useDebouncedValue';

const Teams = () => {
    const { user } = useAuth();
    const isAdmin = user?.role === 'admin';
    const canManageTeam = (team) => isAdmin || Number(team?.team_lead_id) === Number(user?.id);
    const [teams, setTeams] = useState([]);
    const [availableUsers, setAvailableUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [newTeamName, setNewTeamName] = useState('');
    const [newTeamDescription, setNewTeamDescription] = useState('');
    const [error, setError] = useState('');
    const [expandedTeams, setExpandedTeams] = useState({}); // { teamId: { members: [], loading: false } }
    const [addingMemberTo, setAddingMemberTo] = useState(null);
    const [selectedUserId, setSelectedUserId] = useState('');
    const [loadError, setLoadError] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [page, setPage] = useState(1);
    const [selectedMember, setSelectedMember] = useState(null);
    const [memberTasksModalOpen, setMemberTasksModalOpen] = useState(false);
    const [memberTasksLoading, setMemberTasksLoading] = useState(false);
    const [memberTasksError, setMemberTasksError] = useState('');
    const [memberTasksData, setMemberTasksData] = useState({ total: 0, status_counts: {}, tasks: [] });
    const PAGE_SIZE = 6;
    const debouncedSearchTerm = useDebouncedValue(searchTerm, 250);
    const hasTeamLead = (team) =>
        team?.team_lead_id !== null &&
        team?.team_lead_id !== undefined &&
        Number(team.team_lead_id) > 0;
    const getTeamLeadLabel = (team, members = []) => {
        if (!hasTeamLead(team)) return 'Not assigned';
        if (team?.team_lead_name) return team.team_lead_name;
        const lead = members.find((m) => Number(m.id) === Number(team.team_lead_id));
        if (!lead) return `User #${team.team_lead_id}`;
        return `${lead.first_name || ''} ${lead.last_name || ''}`.trim() || `User #${team.team_lead_id}`;
    };

    const fetchTeams = useCallback(async () => {
        setLoadError('');
        try {
            if (isAdmin) {
                const data = await teamService.getAllTeams();
                setTeams(data);
            } else {
                const myTeams = await teamService.getMyTeams();
                setTeams(myTeams);
                const expanded = {};
                myTeams.forEach((team) => {
                    expanded[team.id] = { loading: false, members: team.members || [] };
                });
                setExpandedTeams(expanded);
            }
        } catch (err) {
            setLoadError(getErrorMessage(err, 'Failed to load teams'));
        } finally {
            setLoading(false);
        }
    }, [isAdmin]);

    useEffect(() => {
        fetchTeams();
        if (user) {
            fetchAvailableMembers();
        }
    }, [user, fetchTeams, isAdmin]);

    const fetchAvailableMembers = async () => {
        try {
            const users = await teamService.getAvailableMembers();
            setAvailableUsers(users);
        } catch (err) {
            if (err?.response?.status === 403) {
                return;
            }
            setLoadError(getErrorMessage(err, 'Failed to load users'));
        }
    };

    const toggleTeamMembers = async (teamId) => {
        if (expandedTeams[teamId]) {
            const newExpanded = { ...expandedTeams };
            delete newExpanded[teamId];
            setExpandedTeams(newExpanded);
            return;
        }

        const selectedTeam = teams.find((team) => Number(team.id) === Number(teamId));
        if (!canManageTeam(selectedTeam)) {
            setExpandedTeams(prev => ({
                ...prev,
                [teamId]: { loading: false, members: selectedTeam?.members || [] }
            }));
            return;
        }

        setExpandedTeams(prev => ({
            ...prev,
            [teamId]: { loading: true, members: [] }
        }));

        try {
            const teamData = await teamService.getTeamById(teamId);
            setExpandedTeams(prev => ({
                ...prev,
                [teamId]: { loading: false, members: teamData.members || [] }
            }));
        } catch (err) {
            console.error('Failed to fetch team members', err);
            setExpandedTeams(prev => ({
                ...prev,
                [teamId]: { loading: false, members: [], error: getErrorMessage(err, 'Failed to load members') }
            }));
        }
    };

    const handleCreateTeam = async (e) => {
        e.preventDefault();
        try {
            await teamService.createTeam({
                name: newTeamName,
                description: newTeamDescription
            });
            setShowModal(false);
            setNewTeamName('');
            setNewTeamDescription('');
            fetchTeams();
            await fetchAvailableMembers();
        } catch (err) {
            setError(getErrorMessage(err, 'Failed to create team'));
        }
    };

    const handleAddMember = async (teamId) => {
        if (!selectedUserId) return;
        try {
            await teamService.addMember(teamId, selectedUserId);
            setSelectedUserId('');
            setAddingMemberTo(null);
            await fetchAvailableMembers();
            // Refresh members
            const teamData = await teamService.getTeamById(teamId);
            setExpandedTeams(prev => ({
                ...prev,
                [teamId]: { loading: false, members: teamData.members || [] }
            }));
        } catch (err) {
            alert(getErrorMessage(err, 'Failed to add member'));
        }
    };

    const handleSetTeamLead = async (teamId, userId) => {
        if (!window.confirm('Set this member as team lead for this team?')) return;
        try {
            const updatedTeam = await teamService.setTeamLead(teamId, userId);
            setTeams((prev) => prev.map((team) => (Number(team.id) === Number(teamId) ? { ...team, ...updatedTeam } : team)));
            setExpandedTeams((prev) => ({
                ...prev,
                [teamId]: { loading: false, members: updatedTeam.members || [] }
            }));
        } catch (err) {
            alert(getErrorMessage(err, 'Failed to set team lead'));
        }
    };

    const handleRemoveTeamLead = async (teamId) => {
        if (!window.confirm('Remove current team lead from this team?')) return;
        try {
            const updatedTeam = await teamService.removeTeamLead(teamId);
            setTeams((prev) => prev.map((team) => (Number(team.id) === Number(teamId) ? { ...team, ...updatedTeam } : team)));
            setExpandedTeams((prev) => ({
                ...prev,
                [teamId]: { loading: false, members: updatedTeam.members || [] }
            }));
        } catch (err) {
            alert(getErrorMessage(err, 'Failed to remove team lead'));
        }
    };

    const handleRemoveMember = async (teamId, userId) => {
        if (!window.confirm('Remove this member from the team?')) return;
        try {
            await teamService.removeMember(teamId, userId);
            await fetchAvailableMembers();
            const teamData = await teamService.getTeamById(teamId);
            setTeams((prev) =>
                prev.map((team) =>
                    Number(team.id) === Number(teamId) ? { ...team, ...teamData } : team
                )
            );
            setExpandedTeams(prev => ({
                ...prev,
                [teamId]: { loading: false, members: teamData.members || [] }
            }));
        } catch (err) {
            alert(getErrorMessage(err, 'Failed to remove member'));
        }
    };

    const handleOpenMemberTasks = async (team, member) => {
        setSelectedMember({ ...member, teamId: team.id, teamName: team.name });
        setMemberTasksModalOpen(true);
        setMemberTasksLoading(true);
        setMemberTasksError('');
        setMemberTasksData({ total: 0, status_counts: {}, tasks: [] });

        try {
            const report = await teamService.getMemberTasks(team.id, member.id);
            setMemberTasksData(report);
        } catch (err) {
            setMemberTasksError(getErrorMessage(err, 'Failed to load member tasks'));
        } finally {
            setMemberTasksLoading(false);
        }
    };

    const filteredTeams = teams.filter((team) => {
        const q = debouncedSearchTerm.trim().toLowerCase();
        if (!q) return true;
        return (
            team.name.toLowerCase().includes(q) ||
            (team.description || '').toLowerCase().includes(q)
        );
    });
    const totalPages = Math.max(1, Math.ceil(filteredTeams.length / PAGE_SIZE));
    const safePage = Math.min(page, totalPages);
    const pagedTeams = filteredTeams.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

    return (
        <div className="p-8 bg-[#F4F7FA] min-h-screen">
            <div className="max-w-7xl mx-auto">
                <div className="flex justify-between items-center mb-10">
                    <div>
                        <BackButton to="/" />
                        <h1 className="text-3xl font-extrabold text-[#172B4D] tracking-tight">Teams</h1>
                        <p className="text-gray-500 mt-2">Manage your team members and roles efficiently.</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => {
                                setSearchTerm(e.target.value);
                                setPage(1);
                            }}
                            placeholder="Search teams"
                            className="border border-[#DFE1E6] bg-white px-3 py-2 rounded-[3px] text-sm focus:outline-none focus:border-[#4C9AFF]"
                        />
                    {isAdmin && (
                        <button
                            onClick={() => setShowModal(true)}
                            className="btn-primary"
                        >
                            <span>+</span> Create team
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
                        {filteredTeams.length === 0 ? (
                            <div className="text-center py-20 bg-gray-50 rounded-lg shadow-sm border border-[#DFE1E6] border-dashed">
                                <h3 className="text-lg font-medium text-[#172B4D]">No teams found</h3>
                                <p className="mt-1 text-[#5E6C84]">{searchTerm ? 'Try a different search.' : 'Get started by creating a new team.'}</p>
                            </div>
                        ) : (
                            <div className="border border-[#DFE1E6] rounded-lg overflow-hidden bg-white shadow-sm transition-all duration-300">
                                <table className="min-w-full divide-y divide-[#DFE1E6]">
                                    <thead className="bg-[#FAFBFC]">
                                        <tr>
                                            <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-[#6B778C] uppercase tracking-widest">Team Name</th>
                                            <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-[#6B778C] uppercase tracking_widest w-1/2">Description</th>
                                            <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-[#6B778C] uppercase tracking_widest">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-[#DFE1E6]">
                                        {pagedTeams.map((team) => (
                                            <React.Fragment key={team.id}>
                                                <tr
                                                    className={`hover:bg-[#FAFBFC] transition-colors cursor-pointer group ${expandedTeams[team.id] ? 'bg-[#FAFBFC]' : ''}`}
                                                    onClick={() => toggleTeamMembers(team.id)}
                                                >
                                                    <td className="px-6 py-5">
                                                        <div className="flex items-center">
                                                            <div className="h-10 w-10 rounded-lg bg-[#0052CC] text-white flex items-center justify-center font-bold text-sm shadow-md uppercase transition-transform group-hover:scale-105">
                                                                {team.name.charAt(0)}
                                                            </div>
                                                            <div className="ml-4">
                                                                <div className="text-[15px] font-bold text-[#172B4D] group-hover:text-[#0052CC] transition-colors">{team.name}</div>
                                                                <div className="text-[12px] text-[#5E6C84] mt-0.5">ID: {team.id}</div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-5">
                                                        <div className="text-[14px] text-[#5E6C84] line-clamp-2 leading-relaxed">{team.description || 'No description provided.'}</div>
                                                    </td>
                                                    <td className="px-6 py-5 whitespace-nowrap">
                                                        <button
                                                            className="text-[#0052CC] text-[13px] font-bold hover:underline flex items-center gap-1.5 px-3 py-1.5 rounded-md hover:bg-[#E6EFFC] transition-all"
                                                            onClick={(e) => { e.stopPropagation(); toggleTeamMembers(team.id); }}
                                                        >
                                                            {expandedTeams[team.id] ? 'Hide members' : 'View members'}
                                                            <span className={`transition-transform duration-300 ${expandedTeams[team.id] ? 'rotate-180' : ''}`}>
                                                                ▼
                                                            </span>
                                                        </button>
                                                    </td>
                                                </tr>
                                                {expandedTeams[team.id] && (
                                                    <tr className="bg-[#F4F5F7] border-l-4 border-[#0052CC]">
                                                        <td colSpan="3" className="px-10 py-6">
                                                            <div className="space-y-6">
                                                                <div className="flex justify-between items-center">
                                                                    <div className="text-[12px] font-bold text-[#6B778C] uppercase tracking-widest flex items-center gap-2">
                                                                        <span>👥</span> Team Members ({expandedTeams[team.id].members.length})
                                                                    </div>
                                                                    <div className="flex items-center gap-3">
                                                                        <div className="px-3 py-1 rounded-md border border-[#DFE1E6] bg-white text-[11px] text-[#42526E]">
                                                                            <span className="font-bold uppercase text-[#6B778C] mr-2">Current Team Lead</span>
                                                                            <span className="font-semibold text-[#172B4D] normal-case">
                                                                                {getTeamLeadLabel(team, expandedTeams[team.id].members || [])}
                                                                            </span>
                                                                        </div>
                                                                    {canManageTeam(team) && (
                                                                        <div className="flex gap-2">
                                                                            {addingMemberTo === team.id ? (
                                                                                <div className="flex gap-2 animate-fade-in">
                                                                                    <select
                                                                                        className="border-2 border-[#DFE1E6] rounded-md px-3 py-1.5 text-sm bg-white focus:border-[#4C9AFF] outline-none"
                                                                                        value={selectedUserId}
                                                                                        onChange={(e) => setSelectedUserId(e.target.value)}
                                                                                    >
                                                                                        <option value="">Select user...</option>
                                                                                        {availableUsers.map((u) => (
                                                                                            <option key={u.id} value={u.id}>{u.first_name} {u.last_name} ({u.email})</option>
                                                                                        ))}
                                                                                    </select>
                                                                                    <button
                                                                                        onClick={() => handleAddMember(team.id)}
                                                                                        disabled={!selectedUserId}
                                                                                        className="px-3 py-1.5 bg-[#0052CC] text-white text-xs font-bold rounded-md hover:bg-[#0065FF] disabled:opacity-50 transition-colors"
                                                                                    >
                                                                                        Add
                                                                                    </button>
                                                                                    <button
                                                                                        onClick={() => { setAddingMemberTo(null); setSelectedUserId(''); }}
                                                                                        className="px-3 py-1.5 bg-gray-200 text-gray-600 text-xs font-bold rounded-md hover:bg-gray-300 transition-colors"
                                                                                    >
                                                                                        Cancel
                                                                                    </button>
                                                                                </div>
                                                                            ) : (
                                                                                <button
                                                                                    onClick={() => setAddingMemberTo(team.id)}
                                                                                    className="text-[#0052CC] text-[13px] font-bold hover:underline"
                                                                                >
                                                                                    + Add Member
                                                                                </button>
                                                                            )}
                                                                        </div>
                                                                    )}
                                                                    </div>
                                                                </div>

                                                                {expandedTeams[team.id].loading ? (
                                                                    <div className="flex items-center gap-2 text-sm text-[#5E6C84]">
                                                                        <div className="animate-spin h-4 w-4 border-2 border-[#0052CC] border-t-transparent rounded-full"></div>
                                                                        Loading members...
                                                                    </div>
                                                                ) : expandedTeams[team.id].error ? (
                                                                    <div className="text-sm text-[#DE350B] bg-[#FFEBE6] p-4 rounded-md border border-[#FFBDAD]">
                                                                        {expandedTeams[team.id].error}
                                                                    </div>
                                                                ) : expandedTeams[team.id].members.length === 0 ? (
                                                                    <div className="text-sm text-[#5E6C84] italic bg-white p-4 rounded-md border border-dashed border-[#DFE1E6]">
                                                                        No members in this team yet.
                                                                    </div>
                                                                ) : (
                                                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                                                        {expandedTeams[team.id].members.map(member => (
                                                                            <div
                                                                                key={member.id}
                                                                                className="group relative flex items-start justify-between p-4 bg-white rounded-xl border border-[#DFE1E6] shadow-sm hover:shadow-md hover:border-[#B3D4FF] transition-all duration-300 cursor-pointer"
                                                                                onClick={() => handleOpenMemberTasks(team, member)}
                                                                                title="Click to view assigned tasks"
                                                                            >
                                                                                <div className="flex items-center gap-3 min-w-0">
                                                                                    <div className="w-10 h-10 rounded-full bg-[#E6EFFC] text-[#0052CC] flex items-center justify-center text-xs font-bold uppercase shadow-inner">
                                                                                        {member.first_name ? member.first_name[0] : 'U'}{member.last_name ? member.last_name[0] : ''}
                                                                                    </div>
                                                                                    <div className="min-w-0">
                                                                                        <div className="text-[14px] font-bold text-[#172B4D]">{member.first_name} {member.last_name}</div>
                                                                                        <div className="text-[12px] text-[#5E6C84] truncate">{member.email}</div>
                                                                                        <div className="text-[11px] text-[#6B778C] uppercase tracking-wide mt-0.5">{member.role || 'member'}</div>
                                                                                    </div>
                                                                                </div>
                                                                                {canManageTeam(team) && (
                                                                                    <div className="flex flex-col items-stretch gap-2 min-w-[88px] ml-3">
                                                                                        {isAdmin && Number(team.team_lead_id) === Number(member.id) && (
                                                                                            <button
                                                                                                onClick={(e) => {
                                                                                                    e.stopPropagation();
                                                                                                    handleRemoveTeamLead(team.id);
                                                                                                }}
                                                                                                className="w-[88px] px-2 py-1 text-[11px] font-semibold text-[#DE350B] bg-[#FFEBE6] hover:bg-[#FFBDAD] rounded-md transition-colors text-center"
                                                                                                title="Remove as team lead"
                                                                                            >
                                                                                                Remove Lead
                                                                                            </button>
                                                                                        )}
                                                                                        {isAdmin && !hasTeamLead(team) && (
                                                                                            <button
                                                                                                onClick={(e) => {
                                                                                                    e.stopPropagation();
                                                                                                    handleSetTeamLead(team.id, member.id);
                                                                                                }}
                                                                                                className="w-[88px] px-2 py-1 text-[11px] font-semibold text-[#0052CC] bg-[#E6EFFC] hover:bg-[#B3D4FF] rounded-md transition-colors text-center"
                                                                                                title="Set as team lead"
                                                                                            >
                                                                                                Set Lead
                                                                                            </button>
                                                                                        )}
                                                                                        <button
                                                                                            onClick={(e) => {
                                                                                                e.stopPropagation();
                                                                                                handleRemoveMember(team.id, member.id);
                                                                                            }}
                                                                                            className="w-[88px] px-2 py-1 text-[11px] font-semibold text-[#DE350B] bg-[#FFEBE6] hover:bg-[#FFBDAD] rounded-md transition-colors text-center"
                                                                                            title="Remove from team"
                                                                                        >
                                                                                            Remove
                                                                                        </button>
                                                                                    </div>
                                                                                )}
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </td>
                                                    </tr>
                                                )}
                                            </React.Fragment>
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

                {memberTasksModalOpen && (
                    <div
                        className="fixed inset-0 z-50 flex items-center justify-center bg-[#091E42] bg-opacity-50 backdrop-blur-sm p-4"
                        onClick={() => setMemberTasksModalOpen(false)}
                    >
                        <div
                            className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[85vh] overflow-hidden"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="px-6 py-4 border-b border-[#DFE1E6] flex items-center justify-between">
                                <div>
                                    <h2 className="text-lg font-bold text-[#172B4D]">
                                        {selectedMember?.first_name} {selectedMember?.last_name} - Assigned Tasks
                                    </h2>
                                    <p className="text-xs text-[#5E6C84] mt-1">
                                        Team: {selectedMember?.teamName || '-'} | Total Assigned: {memberTasksData.total || 0}
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    className="text-[#42526E] hover:bg-[#EBECF0] p-1 rounded text-2xl leading-none"
                                    onClick={() => setMemberTasksModalOpen(false)}
                                >
                                    &times;
                                </button>
                            </div>

                            <div className="p-6 overflow-y-auto max-h-[70vh]">
                                {memberTasksLoading && (
                                    <div className="text-sm text-[#5E6C84]">Loading assigned tasks...</div>
                                )}
                                {memberTasksError && (
                                    <div className="mb-4 p-3 bg-[#FFEBE6] text-[#DE350B] text-sm rounded-[3px]">{memberTasksError}</div>
                                )}
                                {!memberTasksLoading && !memberTasksError && (
                                    <>
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
                                            <div className="bg-[#FAFBFC] border border-[#DFE1E6] rounded-md p-3">
                                                <div className="text-xs text-[#6B778C] uppercase">To Do</div>
                                                <div className="text-xl font-bold text-[#172B4D]">{memberTasksData.status_counts?.todo || 0}</div>
                                            </div>
                                            <div className="bg-[#FAFBFC] border border-[#DFE1E6] rounded-md p-3">
                                                <div className="text-xs text-[#6B778C] uppercase">In Progress</div>
                                                <div className="text-xl font-bold text-[#172B4D]">{memberTasksData.status_counts?.in_progress || 0}</div>
                                            </div>
                                            <div className="bg-[#FAFBFC] border border-[#DFE1E6] rounded-md p-3">
                                                <div className="text-xs text-[#6B778C] uppercase">In Review</div>
                                                <div className="text-xl font-bold text-[#172B4D]">{memberTasksData.status_counts?.in_review || 0}</div>
                                            </div>
                                            <div className="bg-[#FAFBFC] border border-[#DFE1E6] rounded-md p-3">
                                                <div className="text-xs text-[#6B778C] uppercase">Done</div>
                                                <div className="text-xl font-bold text-[#172B4D]">{memberTasksData.status_counts?.done || 0}</div>
                                            </div>
                                        </div>

                                        {memberTasksData.tasks?.length === 0 ? (
                                            <div className="text-sm text-[#5E6C84]">No assigned tasks found for this member in this team.</div>
                                        ) : (
                                            <div className="overflow-x-auto border border-[#DFE1E6] rounded-md">
                                                <table className="min-w-full text-sm">
                                                    <thead className="bg-[#FAFBFC]">
                                                        <tr className="text-left text-[#6B778C] text-xs uppercase">
                                                            <th className="px-3 py-2">Task</th>
                                                            <th className="px-3 py-2">Project</th>
                                                            <th className="px-3 py-2">Sprint</th>
                                                            <th className="px-3 py-2">Status</th>
                                                            <th className="px-3 py-2">Points</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {memberTasksData.tasks.map((task) => (
                                                            <tr key={task.id} className="border-t border-[#DFE1E6]">
                                                                <td className="px-3 py-2 text-[#172B4D] font-medium">
                                                                    {task.task_key} - {task.title}
                                                                </td>
                                                                <td className="px-3 py-2 text-[#172B4D]">
                                                                    {task.project_key} - {task.project_name}
                                                                </td>
                                                                <td className="px-3 py-2 text-[#172B4D]">
                                                                    {task.sprint_name || 'Backlog'}
                                                                </td>
                                                                <td className="px-3 py-2">
                                                                    <span className="px-2 py-1 rounded-full bg-[#EBECF0] text-[#42526E] text-xs font-semibold uppercase">
                                                                        {task.status}
                                                                    </span>
                                                                </td>
                                                                <td className="px-3 py-2 text-[#172B4D]">
                                                                    {task.story_points ?? '-'}
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {showModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#091E42] bg-opacity-50 backdrop-blur-sm p-4">
                        <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-fade-in-up">
                            <div className="px-6 py-5 border-b border-[#DFE1E6] bg-[#FAFBFC]">
                                <h2 className="text-xl font-bold text-[#172B4D]">Create New Team</h2>
                            </div>

                            <div className="p-8">
                                {error && (
                                    <div className="mb-6 p-4 bg-[#FFEBE6] text-[#DE350B] text-sm font-medium rounded-lg border border-[#FFBDAD]">
                                        {error}
                                    </div>
                                )}
                                <form onSubmit={handleCreateTeam} className="space-y-6">
                                    <div>
                                        <label className="block text-xs font-bold text-[#5E6C84] mb-2 uppercase tracking-widest">Team Name</label>
                                        <input
                                            type="text"
                                            value={newTeamName}
                                            onChange={(e) => setNewTeamName(e.target.value)}
                                            className="w-full border-2 border-[#DFE1E6] bg-[#FAFBFC] px-4 py-2.5 rounded-lg focus:bg-white focus:border-[#4C9AFF] focus:ring-4 focus:ring-[#E6EFFC] outline-none transition-all text-[15px] font-medium"
                                            placeholder="e.g. Frontend Squad"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-[#5E6C84] mb-2 uppercase tracking-widest">Description</label>
                                        <textarea
                                            value={newTeamDescription}
                                            onChange={(e) => setNewTeamDescription(e.target.value)}
                                            className="w-full border-2 border-[#DFE1E6] bg-[#FAFBFC] px-4 py-2.5 rounded-lg focus:bg-white focus:border-[#4C9AFF] focus:ring-4 focus:ring-[#E6EFFC] outline-none transition-all text-[15px] font-medium"
                                            placeholder="Describe the team's mission..."
                                            rows="4"
                                        />
                                    </div>
                                    <div className="flex justify-end gap-3 pt-4">
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setShowModal(false);
                                                setError('');
                                            }}
                                            className="px-6 py-2.5 text-sm font-bold text-[#42526E] hover:bg-[#EBECF0] rounded-lg transition-colors"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            className="px-6 py-2.5 bg-[#0052CC] hover:bg-[#0065FF] text-white text-sm font-bold rounded-lg shadow-md transition-all active:scale-95"
                                        >
                                            Create Team
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

export default Teams;



