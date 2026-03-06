import React, { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';
import api from '../services/api';
import { getErrorMessage } from '../utils/error';

const PIE_COLORS = ['#0052CC', '#00A3BF', '#FFAB00', '#36B37E'];

const KanbanAnalytics = () => {
  const { projectId } = useParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [analytics, setAnalytics] = useState(null);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await api.get(`/analytics/kanban/${projectId}`);
        if (!cancelled) {
          setAnalytics(res.data?.data || null);
        }
      } catch (err) {
        if (!cancelled) {
          setError(getErrorMessage(err, 'Failed to load Kanban analytics'));
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
  }, [projectId]);

  const throughputData = useMemo(() => {
    const rows = analytics?.throughputWeekly || [];
    return rows.map((row) => ({
      week: row.weekStartDate || String(row.yearWeek),
      completed: Number(row.completedCount || 0)
    }));
  }, [analytics]);

  const wipData = useMemo(() => {
    const wip = analytics?.wipCounts || {};
    return [
      { name: 'To Do', value: Number(wip.todo || 0) },
      { name: 'In Progress', value: Number(wip.in_progress || 0) },
      { name: 'In Review', value: Number(wip.in_review || 0) },
      { name: 'Done', value: Number(wip.done || 0) }
    ];
  }, [analytics]);

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center h-full text-gray-400">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0052CC]"></div>
        <span className="ml-3">Loading analytics...</span>
      </div>
    );
  }

  if (error) {
    return <div className="p-8 auth-error max-w-2xl mx-auto my-10">{error}</div>;
  }

  return (
    <div className="min-h-full bg-[#F4F5F7] p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <nav className="flex items-center gap-1 text-[13px] text-gray-400 mb-2">
            <Link to="/projects" className="hover:text-[#0052CC] transition-colors">Projects</Link>
            <span className="mx-1">/</span>
            <Link to={`/projects/${projectId}`} className="hover:text-[#0052CC] transition-colors">Project</Link>
            <span className="mx-1">/</span>
            <span className="text-gray-600 font-medium">Kanban Analytics</span>
          </nav>
          <h1 className="text-2xl md:text-3xl font-bold text-[#172B4D]">Kanban Analytics</h1>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl border border-[#DFE1E6] p-4">
            <div className="text-xs uppercase tracking-wide text-[#6B778C] mb-1">Avg Lead Time</div>
            <div className="text-2xl font-bold text-[#172B4D]">{Number(analytics?.avgLeadTimeHours || 0).toFixed(2)}h</div>
          </div>
          <div className="bg-white rounded-xl border border-[#DFE1E6] p-4">
            <div className="text-xs uppercase tracking-wide text-[#6B778C] mb-1">Avg Cycle Time</div>
            <div className="text-2xl font-bold text-[#172B4D]">{Number(analytics?.avgCycleTimeHours || 0).toFixed(2)}h</div>
          </div>
          <div className="bg-white rounded-xl border border-[#DFE1E6] p-4">
            <div className="text-xs uppercase tracking-wide text-[#6B778C] mb-1">Total Logged Hours</div>
            <div className="text-2xl font-bold text-[#172B4D]">{Number(analytics?.totalLoggedHours || 0).toFixed(2)}h</div>
          </div>
          <div className="bg-white rounded-xl border border-[#DFE1E6] p-4">
            <div className="text-xs uppercase tracking-wide text-[#6B778C] mb-1">Total WIP</div>
            <div className="text-2xl font-bold text-[#172B4D]">
              {wipData.reduce((sum, row) => sum + row.value, 0)}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl border border-[#DFE1E6] p-4 md:p-5 h-[360px]">
            <h2 className="text-sm font-semibold text-[#172B4D] mb-4">Throughput (Done per Week)</h2>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={throughputData} margin={{ top: 5, right: 20, left: 0, bottom: 24 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#DFE1E6" />
                <XAxis
                  dataKey="week"
                  angle={-25}
                  textAnchor="end"
                  tick={{ fontSize: 11, fill: '#6B778C' }}
                />
                <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#6B778C' }} />
                <Tooltip />
                <Line type="monotone" dataKey="completed" stroke="#0052CC" strokeWidth={2.5} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white rounded-xl border border-[#DFE1E6] p-4 md:p-5 h-[360px]">
            <h2 className="text-sm font-semibold text-[#172B4D] mb-4">WIP Distribution</h2>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={wipData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="45%"
                  outerRadius={95}
                  label
                >
                  {wipData.map((entry, index) => (
                    <Cell key={`cell-${entry.name}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend verticalAlign="bottom" height={36} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="mt-6 bg-white rounded-xl border border-[#DFE1E6] p-4 md:p-5 h-[320px]">
          <h2 className="text-sm font-semibold text-[#172B4D] mb-4">WIP Counts by Column</h2>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={wipData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#DFE1E6" />
              <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#6B778C' }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: '#6B778C' }} />
              <Tooltip />
              <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                {wipData.map((entry, index) => (
                  <Cell key={`bar-${entry.name}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default KanbanAnalytics;
