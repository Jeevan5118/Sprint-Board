import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Landing = () => {
  const { isAuthenticated } = useAuth();

  return (
    <div className="landing-page">
      <div className="landing-bg-orb landing-bg-orb-1" />
      <div className="landing-bg-orb landing-bg-orb-2" />

      <header className="landing-header">
        <div className="landing-brand">Scrum Board</div>
        <nav className="landing-nav">
          <Link className="landing-nav-link" to="/login">Sign in</Link>
          <Link className="landing-nav-cta" to={isAuthenticated ? '/dashboard' : '/login'}>
            {isAuthenticated ? 'Open Dashboard' : 'Get Started'}
          </Link>
        </nav>
      </header>

      <main className="landing-main">
        <section className="landing-hero">
          <p className="landing-eyebrow">Enterprise Agile Workspace</p>
          <h1 className="landing-title">
            Plan sprints, run kanban, and ship with confidence.
          </h1>
          <p className="landing-subtitle">
            One platform for teams, projects, timelines, task analytics, notifications, and role-based execution.
          </p>
          <div className="landing-actions">
            <Link className="landing-primary" to={isAuthenticated ? '/dashboard' : '/login'}>
              {isAuthenticated ? 'Go to Dashboard' : 'Sign in'}
            </Link>
            <Link className="landing-secondary" to={isAuthenticated ? '/projects' : '/login'}>
              {isAuthenticated ? 'View Projects' : 'Admin creates accounts'}
            </Link>
          </div>
        </section>

        <aside className="landing-panel">
          <div className="landing-metric">
            <span className="landing-metric-value">2 Boards</span>
            <span className="landing-metric-label">Scrum + Kanban, project-based mode</span>
          </div>
          <div className="landing-metric">
            <span className="landing-metric-value">3 Roles</span>
            <span className="landing-metric-label">Admin, Team Lead, Member with RBAC</span>
          </div>
          <div className="landing-metric">
            <span className="landing-metric-value">1 Workspace</span>
            <span className="landing-metric-label">Projects, timeline, analytics, notifications</span>
          </div>
        </aside>
      </main>

      <section className="landing-grid">
        <article className="landing-card">
          <h3>Dual Board System</h3>
          <p>Use Scrum and Kanban based on project mode without workflow overlap.</p>
        </article>
        <article className="landing-card">
          <h3>Role-Based Control</h3>
          <p>Admin, Team Lead, and Member permissions with strict team-scoped access.</p>
        </article>
        <article className="landing-card">
          <h3>Execution Intelligence</h3>
          <p>Timeline, throughput, WIP controls, and activity notifications in one place.</p>
        </article>
      </section>
    </div>
  );
};

export default Landing;
