import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { dashboardService } from '../services/dashboardService';
import { teamService } from '../services/teamService';
import { projectService } from '../services/projectService';
import { sprintService } from '../services/sprintService';
import { useAuth } from '../context/AuthContext';
import { getErrorMessage } from '../utils/error';

const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showProgressChart, setShowProgressChart] = useState(false);
  const [showCategoryDetails, setShowCategoryDetails] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('total');
  const [progressReport, setProgressReport] = useState(null);
  const [progressReportLoading, setProgressReportLoading] = useState(true);
  const [progressReportError, setProgressReportError] = useState('');
  const [deadlineAlerts, setDeadlineAlerts] = useState(null);
  const [teamBoards, setTeamBoards] = useState([]);
  const [teamBoardsError, setTeamBoardsError] = useState('');

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setError('');
      setProgressReportError('');
      setProgressReportLoading(true);
      setTeamBoardsError('');
      try {
        const [userDashboard, teamProjectProgress, alerts, teams, projects] = await Promise.all([
          dashboardService.getUserDashboard(),
          dashboardService.getTeamProjectProgress(),
          dashboardService.getDeadlineAlerts(),
          user?.role === 'admin' ? teamService.getAllTeams() : teamService.getMyTeams(),
          projectService.getAllProjects()
        ]);

        const sprintByTeam = await Promise.all(
          (teams || []).map(async (team) => {
            const sprints = await sprintService.getSprintsByTeam(team.id);
            const active = (sprints || []).find((s) => s.status === 'active');
            const hasKanban = (projects || []).some(
              (p) => Number(p.team_id) === Number(team.id) && p.board_type === 'kanban'
            );
            return {
              teamId: team.id,
              teamName: team.name,
              sprintCount: (sprints || []).length,
              activeSprintId: active?.id || null,
              activeSprintName: active?.name || '',
              hasKanban
            };
          })
        );

        if (!cancelled) {
          setStats(userDashboard.stats);
          setProgressReport(teamProjectProgress);
          setDeadlineAlerts(alerts);
          setTeamBoards(sprintByTeam);
        }
      } catch (err) {
        if (!cancelled) {
          setError(getErrorMessage(err, 'Failed to load dashboard'));
          setTeamBoardsError(getErrorMessage(err, 'Failed to load team board overview'));
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
          setProgressReportLoading(false);
        }
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [user?.role]);

  const total = stats?.assigned_tasks ?? 0;
  const completed = stats?.completed_tasks ?? 0;
  const pending = stats?.pending_tasks ?? 0;
  const aggregatedFromReport = (progressReport?.teams || []).reduce(
    (acc, team) => {
      (team.projects || []).forEach((project) => {
        acc.total += Number(project.total_tasks || 0);
        acc.completed += Number(project.completed_tasks || 0);
        acc.pending += Number(project.pending_tasks || 0);
      });
      return acc;
    },
    { total: 0, completed: 0, pending: 0 }
  );
  const hasAggregatedReportData = aggregatedFromReport.total > 0;
  const displayTotal = hasAggregatedReportData ? aggregatedFromReport.total : total;
  const displayCompleted = hasAggregatedReportData ? aggregatedFromReport.completed : completed;
  const displayPending = hasAggregatedReportData ? aggregatedFromReport.pending : pending;
  const progress =
    displayTotal > 0 ? Math.round((displayCompleted / displayTotal) * 100) : 0;
  const pieStyle = {
    background: `conic-gradient(#36B37E ${progress}%, #FFAB00 ${progress}% 100%)`
  };
  const selectedCategoryLabel =
    selectedCategory === 'completed'
      ? 'Completed Tasks'
      : selectedCategory === 'pending'
        ? 'Pending Tasks'
        : 'Total Tasks';

  const openCategoryDetails = (category) => {
    setSelectedCategory(category);
    setShowCategoryDetails(true);
  };

  const openProgressChart = async () => {
    setShowProgressChart(true);
  };

  const getAlertTaskLink = (task) => {
    if (!task?.team_id) {
      return task?.project_id ? `/projects/${task.project_id}` : '/timeline';
    }
    if (task.sprint_id) {
      return `/teams/${task.team_id}/sprints/${task.sprint_id}/board?taskId=${task.task_id}`;
    }
    return `/teams/${task.team_id}/kanban?taskId=${task.task_id}`;
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="mb-10">
        <h1 className="text-3xl font-bold text-[#172B4D]">Dashboard</h1>
        <p className="text-gray-500 mt-2">Track your team board progress and task status.</p>
      </div>

      {loading && (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      )}

      {error && <div className="auth-error mb-8">{error}</div>}

      {!loading && !error && (
        <>
          <div className="dashboard-grid">
            <button
              type="button"
              onClick={() => openCategoryDetails('total')}
              className="card dashboard-card card-hoverable text-left cursor-pointer"
            >
              <div className="dashboard-label">Total tasks</div>
              <div className="dashboard-value">{displayTotal}</div>
            </button>
            <button
              type="button"
              onClick={() => openCategoryDetails('completed')}
              className="card dashboard-card card-hoverable text-left cursor-pointer"
            >
              <div className="dashboard-label">Completed</div>
              <div className="dashboard-value text-green-600" style={{ backgroundClip: 'text', WebkitBackgroundClip: 'text' }}>{displayCompleted}</div>
            </button>
            <button
              type="button"
              onClick={() => openCategoryDetails('pending')}
              className="card dashboard-card card-hoverable text-left cursor-pointer"
            >
              <div className="dashboard-label">Pending</div>
              <div className="dashboard-value text-orange-500" style={{ backgroundClip: 'text', WebkitBackgroundClip: 'text' }}>{displayPending}</div>
            </button>
            <button
              type="button"
              className="card dashboard-card text-left cursor-pointer"
              onClick={openProgressChart}
            >
              <div className="dashboard-label">Progress</div>
              <div className="dashboard-value">{progress}%</div>
            </button>
          </div>

          <div className="mt-6 card">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-bold text-[#172B4D]">Deadline Alerts</h2>
              <Link to="/timeline" className="text-sm text-[#0052CC] hover:underline">
                View Timeline
              </Link>
            </div>
            {!deadlineAlerts || ((deadlineAlerts.tasks || []).length === 0 && (deadlineAlerts.sprints || []).length === 0) ? (
              <div className="text-sm text-[#5E6C84]">No upcoming or overdue deadlines.</div>
            ) : (
              <div className="space-y-3">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <Link to="/timeline" className="bg-[#FAFBFC] border border-[#DFE1E6] rounded-md p-3 hover:border-[#FF8F73] transition-colors">
                    <div className="text-xs text-[#6B778C] uppercase">Overdue Tasks</div>
                    <div className="text-xl font-bold text-[#DE350B]">{deadlineAlerts.summary?.overdue_tasks || 0}</div>
                  </Link>
                  <Link to="/timeline" className="bg-[#FAFBFC] border border-[#DFE1E6] rounded-md p-3 hover:border-[#FF8F73] transition-colors">
                    <div className="text-xs text-[#6B778C] uppercase">Upcoming Tasks</div>
                    <div className="text-xl font-bold text-[#FF8B00]">{deadlineAlerts.summary?.upcoming_tasks || 0}</div>
                  </Link>
                  <Link to="/timeline" className="bg-[#FAFBFC] border border-[#DFE1E6] rounded-md p-3 hover:border-[#FF8F73] transition-colors">
                    <div className="text-xs text-[#6B778C] uppercase">Overdue Sprints</div>
                    <div className="text-xl font-bold text-[#DE350B]">{deadlineAlerts.summary?.overdue_sprints || 0}</div>
                  </Link>
                  <Link to="/timeline" className="bg-[#FAFBFC] border border-[#DFE1E6] rounded-md p-3 hover:border-[#FF8F73] transition-colors">
                    <div className="text-xs text-[#6B778C] uppercase">Upcoming Sprints</div>
                    <div className="text-xl font-bold text-[#FF8B00]">{deadlineAlerts.summary?.upcoming_sprints || 0}</div>
                  </Link>
                </div>
                {(deadlineAlerts.tasks || []).slice(0, 5).map((task) => (
                  <Link
                    key={task.task_id}
                    to={getAlertTaskLink(task)}
                    className="block text-sm border border-[#DFE1E6] rounded-[3px] p-2 bg-[#FAFBFC] hover:border-[#4C9AFF] transition-colors"
                  >
                    <span className="font-semibold text-[#172B4D]">{task.task_key} - {task.task_title}</span>
                    <span className="ml-2 text-[#5E6C84]">{task.alert_label}</span>
                  </Link>
                ))}
              </div>
            )}
          </div>

          <div className="mt-8 card">
            <h2 className="text-lg font-bold text-[#172B4D] mb-4">Team Boards Overview</h2>
            {teamBoardsError && (
              <div className="text-sm text-[#DE350B] bg-[#FFEBE6] p-2 rounded-[3px] border border-[#FFBDAD] mb-3">
                {teamBoardsError}
              </div>
            )}
            {teamBoards.length === 0 ? (
              <div className="text-sm text-[#5E6C84]">No teams available for board overview.</div>
            ) : (
              <div className="space-y-3 mb-6">
                {teamBoards.map((teamBoard) => (
                  <div key={teamBoard.teamId} className="border border-[#DFE1E6] rounded-[3px] p-3 bg-[#FAFBFC]">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <div className="text-sm font-bold text-[#172B4D]">{teamBoard.teamName}</div>
                        <div className="text-xs text-[#6B778C] mt-0.5">
                          Sprints: {teamBoard.sprintCount}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {teamBoard.activeSprintId ? (
                          <Link
                            to={`/teams/${teamBoard.teamId}/sprints/${teamBoard.activeSprintId}/board`}
                            className="text-xs font-semibold px-2.5 py-1.5 rounded-[3px] border border-[#0052CC] text-[#0052CC] hover:bg-[#E6EFFC]"
                          >
                            Open Active Sprint
                          </Link>
                        ) : (
                          <span className="text-xs text-[#6B778C] px-2 py-1 border border-[#DFE1E6] rounded-[3px]">
                            No active sprint
                          </span>
                        )}
                        {teamBoard.hasKanban ? (
                          <Link
                            to={`/teams/${teamBoard.teamId}/kanban`}
                            className="text-xs font-semibold px-2.5 py-1.5 rounded-[3px] border border-[#36B37E] text-[#00875A] hover:bg-[#E3FCEF]"
                          >
                            Open Kanban
                          </Link>
                        ) : (
                          <span className="text-xs text-[#6B778C] px-2 py-1 border border-[#DFE1E6] rounded-[3px]">
                            No kanban project
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

          </div>

          <div className="mt-8 card">
            <h2 className="text-lg font-bold text-[#172B4D] mb-4">Teams and Projects Progress</h2>
            {progressReportLoading && (
              <div className="text-sm text-[#5E6C84]">Loading team progress report...</div>
            )}
            {progressReportError && (
              <div className="text-sm text-[#DE350B] bg-[#FFEBE6] p-2 rounded-[3px] border border-[#FFBDAD]">
                {progressReportError}
              </div>
            )}
            {!progressReportLoading && !progressReportError && (
              <div className="space-y-4">
                {(progressReport?.teams || []).length === 0 ? (
                  <div className="text-sm text-[#5E6C84]">No team/project data found.</div>
                ) : (
                  (progressReport?.teams || []).map((team) => (
                    <div key={team.id} className="border border-[#DFE1E6] rounded-[3px] p-3 bg-[#FAFBFC]">
                      <div className="text-sm font-bold text-[#172B4D] mb-2">{team.name}</div>
                      <div className="overflow-x-auto">
                        <table className="min-w-full text-sm">
                          <thead>
                            <tr className="text-left text-[#6B778C] text-xs uppercase">
                              <th className="py-2 pr-3">Project</th>
                              <th className="py-2 pr-3">Done</th>
                              <th className="py-2 pr-3">Pending</th>
                              <th className="py-2 pr-3">Total</th>
                              <th className="py-2">Progress</th>
                            </tr>
                          </thead>
                          <tbody>
                            {team.projects.map((project) => {
                              const projProgress = project.progress_percentage || 0;
                              return (
                                <tr key={project.id} className="border-t border-[#DFE1E6]">
                                  <td className="py-2 pr-3 font-medium text-[#172B4D]">
                                    <Link to={`/projects/${project.id}`} className="hover:text-[#0052CC] hover:underline">
                                      {project.key_code} - {project.name}
                                    </Link>
                                  </td>
                                  <td className="py-2 pr-3 text-[#172B4D]">{project.completed_tasks}</td>
                                  <td className="py-2 pr-3 text-[#172B4D]">{project.pending_tasks}</td>
                                  <td className="py-2 pr-3 text-[#172B4D]">{project.total_tasks}</td>
                                  <td className="py-2">
                                    <div className="w-full max-w-[180px] bg-[#DFE1E6] rounded-full h-2.5">
                                      <div className="bg-[#36B37E] h-2.5 rounded-full" style={{ width: `${projProgress}%` }} />
                                    </div>
                                    <div className="text-xs text-[#5E6C84] mt-1">{projProgress}%</div>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </>
      )}

      {showProgressChart && (
        <div
          className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4"
          onClick={() => setShowProgressChart(false)}
        >
          <div
            className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-[#172B4D]">Progress Breakdown</h2>
              <button
                type="button"
                className="text-[#5E6C84] hover:text-[#172B4D] text-xl leading-none"
                onClick={() => setShowProgressChart(false)}
              >
                &times;
              </button>
            </div>

            <div className="flex items-center justify-center mb-5">
              <div className="relative w-48 h-48 rounded-full" style={pieStyle}>
                <div className="absolute inset-6 bg-white rounded-full flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-[#172B4D]">{progress}%</div>
                    <div className="text-xs text-[#5E6C84]">Completed</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-[#172B4D]">
                  <span className="inline-block w-3 h-3 rounded-full bg-[#36B37E]" />
                  Completed
                </span>
                <span className="font-semibold text-[#172B4D]">{displayCompleted}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-[#172B4D]">
                  <span className="inline-block w-3 h-3 rounded-full bg-[#FFAB00]" />
                  Pending
                </span>
                <span className="font-semibold text-[#172B4D]">{displayPending}</span>
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-[#DFE1E6]">
                <span className="text-[#5E6C84]">Total Tasks</span>
                <span className="font-semibold text-[#172B4D]">{displayTotal}</span>
              </div>
            </div>

          </div>
        </div>
      )}

      {showCategoryDetails && (
        <div
          className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4"
          onClick={() => setShowCategoryDetails(false)}
        >
          <div
            className="bg-white rounded-xl shadow-xl p-6 w-full max-w-4xl max-h-[85vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-[#172B4D]">{selectedCategoryLabel} by Team and Project</h2>
              <button
                type="button"
                className="text-[#5E6C84] hover:text-[#172B4D] text-xl leading-none"
                onClick={() => setShowCategoryDetails(false)}
              >
                &times;
              </button>
            </div>

            <div className="mb-4">
              <Link to="/projects" className="text-sm text-[#0052CC] hover:underline">
                Go to Projects
              </Link>
            </div>

            {progressReportLoading && (
              <div className="text-sm text-[#5E6C84]">Loading details...</div>
            )}
            {progressReportError && (
              <div className="text-sm text-[#DE350B] bg-[#FFEBE6] p-2 rounded-[3px] border border-[#FFBDAD]">
                {progressReportError}
              </div>
            )}

            {!progressReportLoading && !progressReportError && (
              <div className="space-y-4">
                {(progressReport?.teams || []).length === 0 ? (
                  <div className="text-sm text-[#5E6C84]">No team/project data found.</div>
                ) : (
                  (progressReport?.teams || []).map((team) => {
                    const projectsForCategory = (team.projects || []).filter((project) => {
                      if (selectedCategory === 'completed') return project.completed_tasks > 0;
                      if (selectedCategory === 'pending') return project.pending_tasks > 0;
                      return project.total_tasks > 0;
                    });

                    if (projectsForCategory.length === 0) return null;

                    return (
                      <div key={team.id} className="border border-[#DFE1E6] rounded-[3px] p-3 bg-[#FAFBFC]">
                        <div className="text-sm font-bold text-[#172B4D] mb-2">{team.name}</div>
                        <div className="overflow-x-auto">
                          <table className="min-w-full text-sm">
                            <thead>
                              <tr className="text-left text-[#6B778C] text-xs uppercase">
                                <th className="py-2 pr-3">Project</th>
                                <th className="py-2 pr-3">Done</th>
                                <th className="py-2 pr-3">Pending</th>
                                <th className="py-2 pr-3">Total</th>
                                <th className="py-2">Category Count</th>
                              </tr>
                            </thead>
                            <tbody>
                              {projectsForCategory.map((project) => {
                                const categoryCount =
                                  selectedCategory === 'completed'
                                    ? project.completed_tasks
                                    : selectedCategory === 'pending'
                                      ? project.pending_tasks
                                      : project.total_tasks;
                                return (
                                  <tr key={project.id} className="border-t border-[#DFE1E6]">
                                    <td className="py-2 pr-3 font-medium text-[#172B4D]">
                                      <Link to={`/projects/${project.id}`} className="hover:text-[#0052CC] hover:underline">
                                        {project.key_code} - {project.name}
                                      </Link>
                                    </td>
                                    <td className="py-2 pr-3 text-[#172B4D]">{project.completed_tasks}</td>
                                    <td className="py-2 pr-3 text-[#172B4D]">{project.pending_tasks}</td>
                                    <td className="py-2 pr-3 text-[#172B4D]">{project.total_tasks}</td>
                                    <td className="py-2 font-semibold text-[#0052CC]">{categoryCount}</td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;

