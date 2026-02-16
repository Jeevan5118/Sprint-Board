import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { dashboardService } from '../services/dashboardService';

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const data = await dashboardService.getUserDashboard();
        if (!cancelled) {
          setStats(data.stats);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.response?.data?.message || 'Failed to load dashboard');
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

  const total = stats?.assigned_tasks ?? 0;
  const completed = stats?.completed_tasks ?? 0;
  const pending = stats?.pending_tasks ?? 0;
  const progress =
    total > 0 ? Math.round((completed / total) * 100) : 0;

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
        <div className="dashboard-grid">
          <Link to="/projects" className="card dashboard-card card-hoverable">
            <div className="dashboard-label">Total tasks</div>
            <div className="dashboard-value">{total}</div>
          </Link>
          <Link to="/projects" className="card dashboard-card card-hoverable">
            <div className="dashboard-label">Completed</div>
            <div className="dashboard-value text-green-600" style={{ backgroundClip: 'text', WebkitBackgroundClip: 'text' }}>{completed}</div>
          </Link>
          <Link to="/projects" className="card dashboard-card card-hoverable">
            <div className="dashboard-label">Pending</div>
            <div className="dashboard-value text-orange-500" style={{ backgroundClip: 'text', WebkitBackgroundClip: 'text' }}>{pending}</div>
          </Link>
          <div className="card dashboard-card">
            <div className="dashboard-label">Progress</div>
            <div className="dashboard-value">{progress}%</div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;

