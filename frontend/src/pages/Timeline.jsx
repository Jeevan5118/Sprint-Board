import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import BackButton from '../components/Common/BackButton';
import { projectService } from '../services/projectService';
import { sprintService } from '../services/sprintService';
import { dashboardService } from '../services/dashboardService';
import { getErrorMessage } from '../utils/error';

const DAY_MS = 24 * 60 * 60 * 1000;
const LEFT_COL_WIDTH = 320;

const startOfDay = (d) => {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
};

const toISO = (d) => {
  const x = new Date(d);
  return x.toISOString().slice(0, 10);
};

const addDays = (d, n) => {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
};

const daysBetween = (a, b) => {
  return Math.round((startOfDay(b).getTime() - startOfDay(a).getTime()) / DAY_MS);
};

const statusStyles = {
  planned: { bg: '#0052CC', text: '#FFFFFF' },
  active: { bg: '#36B37E', text: '#FFFFFF' },
  completed: { bg: '#6B778C', text: '#FFFFFF' },
  cancelled: { bg: '#FFAB00', text: '#172B4D' }
};

const zoomConfig = {
  week: { label: 'Week', dayWidth: 34 },
  month: { label: 'Month', dayWidth: 18 },
  quarter: { label: 'Quarter', dayWidth: 9 }
};

const Timeline = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [rows, setRows] = useState([]);
  const [zoom, setZoom] = useState('month');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedProject, setSelectedProject] = useState('all');
  const [deadlineAlerts, setDeadlineAlerts] = useState({ tasks: [], sprints: [], summary: {} });

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const [projects, alerts] = await Promise.all([
          projectService.getAllProjects(),
          dashboardService.getDeadlineAlerts()
        ]);
        const timelineRows = await Promise.all(
          projects.map(async (project) => {
            const sprints = await sprintService.getSprintsByProject(project.id);
            return {
              project,
              sprints: (sprints || []).sort(
                (a, b) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime()
              )
            };
          })
        );
        if (!cancelled) {
          setRows(timelineRows);
          setDeadlineAlerts(alerts || { tasks: [], sprints: [], summary: {} });
        }
      } catch (err) {
        if (!cancelled) {
          setError(getErrorMessage(err, 'Failed to load timeline'));
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const filteredRows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows
      .filter((r) => selectedProject === 'all' || String(r.project.id) === selectedProject)
      .map((r) => {
        const sprints = r.sprints.filter((s) => {
          const matchesStatus = statusFilter === 'all' || s.status === statusFilter;
          const matchesSearch =
            !q ||
            r.project.name.toLowerCase().includes(q) ||
            r.project.key_code.toLowerCase().includes(q) ||
            s.name.toLowerCase().includes(q);
          return matchesStatus && matchesSearch;
        });
        return { ...r, sprints };
      })
      .filter((r) => r.sprints.length > 0 || !search.trim());
  }, [rows, search, statusFilter, selectedProject]);

  const range = useMemo(() => {
    const allDates = filteredRows
      .flatMap((r) => r.sprints)
      .flatMap((s) => [s.start_date, s.end_date])
      .map((d) => startOfDay(d).getTime())
      .filter((n) => !Number.isNaN(n));

    if (allDates.length === 0) {
      const today = startOfDay(new Date());
      return {
        min: addDays(today, -14),
        max: addDays(today, 45)
      };
    }

    const minDate = new Date(Math.min(...allDates));
    const maxDate = new Date(Math.max(...allDates));
    return {
      min: addDays(minDate, -7),
      max: addDays(maxDate, 14)
    };
  }, [filteredRows]);

  const totalDays = Math.max(1, daysBetween(range.min, range.max) + 1);
  const dayWidth = zoomConfig[zoom].dayWidth;
  const timelineWidth = totalDays * dayWidth;
  const todayOffset = daysBetween(range.min, new Date()) * dayWidth;

  const dayTicks = useMemo(() => {
    return Array.from({ length: totalDays }).map((_, i) => addDays(range.min, i));
  }, [range.min, totalDays]);

  const monthTicks = useMemo(() => {
    const out = [];
    let cur = new Date(range.min);
    cur.setDate(1);
    while (cur <= range.max) {
      out.push(new Date(cur));
      cur = new Date(cur.getFullYear(), cur.getMonth() + 1, 1);
    }
    return out;
  }, [range.min, range.max]);

  const projectOptions = rows.map((r) => r.project);

  const sprintAlertMap = useMemo(() => {
    const map = new Map();
    (deadlineAlerts?.sprints || []).forEach((s) => {
      map.set(Number(s.sprint_id), s);
    });
    return map;
  }, [deadlineAlerts]);

  const projectTaskAlertMap = useMemo(() => {
    const map = new Map();
    (deadlineAlerts?.tasks || []).forEach((t) => {
      const key = Number(t.project_id);
      if (!map.has(key)) {
        map.set(key, { overdue: 0, upcoming: 0 });
      }
      const current = map.get(key);
      if (t.alert_type === 'overdue') current.overdue += 1;
      else current.upcoming += 1;
    });
    return map;
  }, [deadlineAlerts]);

  return (
    <div className="p-6 md:p-8 bg-[#F4F7FA] min-h-screen">
      <div className="max-w-[1400px] mx-auto">
        <BackButton to="/" />
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-5">
          <div>
            <h1 className="text-3xl font-extrabold text-[#172B4D] tracking-tight">Timeline</h1>
            <p className="text-[#5E6C84] mt-1">
              Jira-style roadmap view of projects and sprints.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search project or sprint"
              className="border border-[#DFE1E6] bg-white px-3 py-2 rounded-[3px] text-sm min-w-[220px]"
            />
            <select
              value={selectedProject}
              onChange={(e) => setSelectedProject(e.target.value)}
              className="border border-[#DFE1E6] bg-white px-3 py-2 rounded-[3px] text-sm"
            >
              <option value="all">All Projects</option>
              {projectOptions.map((p) => (
                <option key={p.id} value={String(p.id)}>
                  {p.key_code} - {p.name}
                </option>
              ))}
            </select>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="border border-[#DFE1E6] bg-white px-3 py-2 rounded-[3px] text-sm"
            >
              <option value="all">All Status</option>
              <option value="planned">Planned</option>
              <option value="active">Active</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
            <div className="inline-flex border border-[#DFE1E6] rounded-[3px] overflow-hidden">
              {Object.keys(zoomConfig).map((z) => (
                <button
                  key={z}
                  type="button"
                  onClick={() => setZoom(z)}
                  className={`px-3 py-2 text-xs font-semibold ${
                    zoom === z
                      ? 'bg-[#0052CC] text-white'
                      : 'bg-white text-[#42526E] hover:bg-[#F4F5F7]'
                  }`}
                >
                  {zoomConfig[z].label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="mb-4 rounded-lg border border-[#DFE1E6] bg-white px-4 py-3">
          <div className="text-xs font-bold uppercase tracking-widest text-[#6B778C] mb-2">
            Sprint Status Legend
          </div>
          <div className="flex flex-wrap items-center gap-3">
            {Object.entries(statusStyles).map(([status, style]) => (
              <div key={status} className="inline-flex items-center gap-2 text-xs text-[#42526E]">
                <span
                  className="inline-block h-3 w-3 rounded-full border border-[#DFE1E6]"
                  style={{ backgroundColor: style.bg }}
                />
                <span className="uppercase font-semibold">{status}</span>
              </div>
            ))}
          </div>
        </div>

        {loading && (
          <div className="flex justify-center items-center h-56">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0052CC]" />
          </div>
        )}

        {error && <div className="auth-error">{error}</div>}

        {!loading && !error && (
          <div className="bg-white border border-[#DFE1E6] rounded-lg overflow-hidden shadow-sm">
            <div className="overflow-auto">
              <div style={{ minWidth: LEFT_COL_WIDTH + timelineWidth }}>
                <div className="sticky top-0 z-20 bg-white border-b border-[#DFE1E6]">
                  <div className="flex">
                    <div
                      className="px-4 py-3 border-r border-[#DFE1E6] text-xs font-bold uppercase text-[#6B778C]"
                      style={{ width: LEFT_COL_WIDTH, minWidth: LEFT_COL_WIDTH }}
                    >
                      Project / Sprint
                    </div>
                    <div className="relative" style={{ width: timelineWidth, minWidth: timelineWidth }}>
                      <div className="h-8 border-b border-[#DFE1E6] relative bg-[#FAFBFC]">
                        {monthTicks.map((m) => {
                          const offset = daysBetween(range.min, m) * dayWidth;
                          return (
                            <div
                              key={toISO(m)}
                              className="absolute top-0 h-full border-l border-[#DFE1E6] px-2 text-[11px] font-semibold text-[#5E6C84] flex items-center"
                              style={{ left: offset }}
                            >
                              {m.toLocaleString([], { month: 'short', year: 'numeric' })}
                            </div>
                          );
                        })}
                      </div>
                      <div className="h-8 relative bg-white">
                        {dayTicks.map((d, i) => {
                          const isWeekStart = d.getDay() === 1;
                          if (!isWeekStart) return null;
                          return (
                            <div
                              key={`wk-${i}`}
                              className="absolute top-0 h-full border-l border-[#EEF1F4] px-1 text-[10px] text-[#97A0AF] flex items-center"
                              style={{ left: i * dayWidth }}
                            >
                              W{Math.ceil((d.getDate() + 6) / 7)}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="relative">
                  <div
                    className="absolute top-0 bottom-0 border-l-2 border-[#FF5630] z-10 pointer-events-none"
                    style={{ left: LEFT_COL_WIDTH + todayOffset }}
                  />
                  {filteredRows.length === 0 && (
                    <div className="px-4 py-8 text-sm text-[#5E6C84]">No timeline data found for current filters.</div>
                  )}

                  {filteredRows.map((row) => (
                    <div key={row.project.id} className="border-t border-[#DFE1E6]">
                      <div className="flex">
                        <div
                          className="px-4 py-3 border-r border-[#DFE1E6] bg-[#FAFBFC]"
                          style={{ width: LEFT_COL_WIDTH, minWidth: LEFT_COL_WIDTH }}
                        >
                          <div className="text-sm font-bold text-[#172B4D]">
                            {row.project.key_code} - {row.project.name}
                          </div>
                          <div className="text-xs text-[#6B778C]">{row.project.team_name || '-'}</div>
                          {projectTaskAlertMap.has(Number(row.project.id)) && (
                            <div className="mt-1 text-[11px]">
                              <span className="text-[#DE350B] font-semibold">
                                Overdue: {projectTaskAlertMap.get(Number(row.project.id)).overdue}
                              </span>
                              <span className="mx-1 text-[#97A0AF]">|</span>
                              <span className="text-[#FF8B00] font-semibold">
                                Upcoming: {projectTaskAlertMap.get(Number(row.project.id)).upcoming}
                              </span>
                            </div>
                          )}
                        </div>
                        <div className="relative" style={{ width: timelineWidth, minWidth: timelineWidth, height: 52 }}>
                          {dayTicks.map((_, i) => (
                            <div
                              key={`g-${row.project.id}-${i}`}
                              className="absolute top-0 bottom-0 border-l border-[#F4F5F7]"
                              style={{ left: i * dayWidth }}
                            />
                          ))}
                        </div>
                      </div>

                      {row.sprints.map((sprint) => {
                        const startOffset = daysBetween(range.min, sprint.start_date) * dayWidth;
                        const length = Math.max(2, (daysBetween(sprint.start_date, sprint.end_date) + 1) * dayWidth);
                        const style = statusStyles[sprint.status] || { bg: '#42526E', text: '#FFFFFF' };
                        const sprintLink = `/projects/${row.project.id}/sprints/${sprint.id}/board`;
                        return (
                          <div key={sprint.id} className="flex border-t border-[#EEF1F4]">
                            <div
                              className="px-4 py-2 border-r border-[#DFE1E6] text-sm bg-white flex items-center justify-between gap-2"
                              style={{ width: LEFT_COL_WIDTH, minWidth: LEFT_COL_WIDTH }}
                            >
                              <div className="truncate">
                                <Link
                                  to={sprintLink}
                                  className="font-medium text-[#172B4D] truncate hover:text-[#0052CC] hover:underline"
                                  title="Open sprint details"
                                >
                                  {sprint.name}
                                </Link>
                                <div className="text-[11px] text-[#6B778C]">
                                  {new Date(sprint.start_date).toLocaleDateString()} -{' '}
                                  {new Date(sprint.end_date).toLocaleDateString()}
                                </div>
                                {sprintAlertMap.has(Number(sprint.id)) && (
                                  <div
                                    className={`mt-1 inline-block rounded px-2 py-0.5 text-[10px] font-bold ${
                                      sprintAlertMap.get(Number(sprint.id)).alert_type === 'overdue'
                                        ? 'bg-[#FFEBE6] text-[#DE350B]'
                                        : 'bg-[#FFFAE6] text-[#974F0C]'
                                    }`}
                                  >
                                    {sprintAlertMap.get(Number(sprint.id)).alert_label}
                                  </div>
                                )}
                              </div>
                              <span className="text-[10px] uppercase font-bold text-[#6B778C]">
                                {sprint.status}
                              </span>
                            </div>
                            <div className="relative bg-white" style={{ width: timelineWidth, minWidth: timelineWidth, height: 46 }}>
                              {dayTicks.map((_, i) => (
                                <div
                                  key={`sg-${sprint.id}-${i}`}
                                  className="absolute top-0 bottom-0 border-l border-[#F7F8F9]"
                                  style={{ left: i * dayWidth }}
                                />
                              ))}
                              <Link
                                to={sprintLink}
                                className="absolute top-1/2 -translate-y-1/2 h-7 rounded-md px-2 text-xs font-semibold flex items-center truncate shadow-sm"
                                style={{
                                  left: startOffset,
                                  width: length,
                                  backgroundColor: style.bg,
                                  color: style.text
                                }}
                                title={`${sprint.name} (${sprint.status}) - Open sprint details`}
                              >
                                {sprint.name}
                              </Link>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Timeline;
