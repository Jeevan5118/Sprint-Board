import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { dashboardService } from '../services/dashboardService';
import { getErrorMessage } from '../utils/error';

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showProgressChart, setShowProgressChart] = useState(false);
  const [showCategoryDetails, setShowCategoryDetails] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('total');
  const [progressReport, setProgressReport] = useState(null);
  const [progressReportLoading, setProgressReportLoading] = useState(true);
  const [progressReportError, setProgressReportError] = useState('');

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setError('');
      setProgressReportError('');
      setProgressReportLoading(true);
      try {
        const [userDashboard, teamProjectProgress] = await Promise.all([
          dashboardService.getUserDashboard(),
          dashboardService.getTeamProjectProgress()
        ]);
        if (!cancelled) {
          setStats(userDashboard.stats);
          setProgressReport(teamProjectProgress);
        }
      } catch (err) {
        if (!cancelled) {
          setError(getErrorMessage(err, 'Failed to load dashboard'));
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
  }, []);

  const total = stats?.assigned_tasks ?? 0;
  const completed = stats?.completed_tasks ?? 0;
  const pending = stats?.pending_tasks ?? 0;
  const progress =
    total > 0 ? Math.round((completed / total) * 100) : 0;
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

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="mb-10">
        <h1 className="text-3xl font-bold text-[#172B4D]">Dashboard</h1>
        <p className="text-gray-500 mt-2">Track your sprint progress and task status.</p>
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
              <div className="dashboard-value">{total}</div>
            </button>
            <button
              type="button"
              onClick={() => openCategoryDetails('completed')}
              className="card dashboard-card card-hoverable text-left cursor-pointer"
            >
              <div className="dashboard-label">Completed</div>
              <div className="dashboard-value text-green-600" style={{ backgroundClip: 'text', WebkitBackgroundClip: 'text' }}>{completed}</div>
            </button>
            <button
              type="button"
              onClick={() => openCategoryDetails('pending')}
              className="card dashboard-card card-hoverable text-left cursor-pointer"
            >
              <div className="dashboard-label">Pending</div>
              <div className="dashboard-value text-orange-500" style={{ backgroundClip: 'text', WebkitBackgroundClip: 'text' }}>{pending}</div>
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
                                  <td className="py-2 pr-3 font-medium text-[#172B4D]">{project.key_code} - {project.name}</td>
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
                <span className="font-semibold text-[#172B4D]">{completed}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-[#172B4D]">
                  <span className="inline-block w-3 h-3 rounded-full bg-[#FFAB00]" />
                  Pending
                </span>
                <span className="font-semibold text-[#172B4D]">{pending}</span>
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-[#DFE1E6]">
                <span className="text-[#5E6C84]">Total Tasks</span>
                <span className="font-semibold text-[#172B4D]">{total}</span>
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
                                    <td className="py-2 pr-3 font-medium text-[#172B4D]">{project.key_code} - {project.name}</td>
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

