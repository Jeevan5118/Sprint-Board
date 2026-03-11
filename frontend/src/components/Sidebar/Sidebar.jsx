import React, { useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { teamService } from '../../services/teamService';
import { sprintService } from '../../services/sprintService';
import { useAuth } from '../../context/AuthContext';

const Sidebar = () => {
  const { user } = useAuth();
  const [activeSprintLink, setActiveSprintLink] = useState(null);
  const [kanbanTeamLink, setKanbanTeamLink] = useState(null);

  useEffect(() => {
    const fetchBoardLinks = async () => {
      try {
        const teams = user?.role === 'admin'
          ? await teamService.getAllTeams()
          : await teamService.getMyTeams();
        if (!teams || teams.length === 0) {
          return;
        }

        setKanbanTeamLink(`/teams/${teams[0].id}/kanban`);

        let fallbackLink = null;
        for (const team of teams) {
          const sprints = await sprintService.getSprintsByTeam(team.id);
          if (!sprints || sprints.length === 0) continue;

          const activeSprint = sprints.find((s) => s.status === 'active');
          if (activeSprint) {
            setActiveSprintLink(`/teams/${team.id}/sprints/${activeSprint.id}/board`);
            return;
          }

          if (!fallbackLink) {
            fallbackLink = `/teams/${team.id}/sprints/${sprints[0].id}/board`;
          }
        }

        setActiveSprintLink(fallbackLink);
      } catch (error) {
        console.error('Failed to fetch sidebar navigation data', error);
      }
    };

    fetchBoardLinks();
  }, [user?.role]);

  return (
    <aside className="app-shell-sidebar">
      <div className="sidebar flex flex-col h-full bg-white border-r border-[#DFE1E6]">
        <div className="mb-8 px-2 py-4">
          <div className="flex items-center gap-3 px-3 py-2 rounded-lg bg-[#E6EFFC] text-[#0052CC]">
            <span className="text-xl">??</span>
            <span className="font-extrabold tracking-tight text-lg">ScrumBoard</span>
          </div>
        </div>

        <nav className="sidebar-nav flex-1">
          <div className="sidebar-section-label px-3 mb-2 font-bold text-[11px] text-[#6B778C] uppercase tracking-widest">Planning</div>

          <NavLink
            to="/dashboard"
            end
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 mb-1 ${isActive ? 'bg-[#E6EFFC] text-[#0052CC]' : 'text-[#42526E] hover:bg-[#F4F5F7]'
              }`
            }
          >
            <span className="text-lg">??</span>
            <span>Dashboard</span>
          </NavLink>

          <NavLink
            to="/projects"
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 mb-1 ${isActive ? 'bg-[#E6EFFC] text-[#0052CC]' : 'text-[#42526E] hover:bg-[#F4F5F7]'
              }`
            }
          >
            <span className="text-lg">??</span>
            <span>Projects</span>
          </NavLink>

          <NavLink
            to="/timeline"
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 mb-1 ${isActive ? 'bg-[#E6EFFC] text-[#0052CC]' : 'text-[#42526E] hover:bg-[#F4F5F7]'
              }`
            }
          >
            <span className="text-lg">??</span>
            <span>Timeline</span>
          </NavLink>

          <NavLink
            to="/teams"
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 mb-10 ${isActive ? 'bg-[#E6EFFC] text-[#0052CC]' : 'text-[#42526E] hover:bg-[#F4F5F7]'
              }`
            }
          >
            <span className="text-lg">??</span>
            <span>Teams</span>
          </NavLink>

          <div className="sidebar-section-label px-3 mb-2 font-bold text-[11px] text-[#6B778C] uppercase tracking-widest">Execution</div>
          {activeSprintLink ? (
            <NavLink
              to={activeSprintLink}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 ${isActive ? 'bg-[#E6EFFC] text-[#0052CC]' : 'text-[#42526E] hover:bg-[#F4F5F7]'
                }`
              }
            >
              <span className="text-lg">??</span>
              <span>Sprint Board</span>
            </NavLink>
          ) : (
            <div className="flex items-center gap-3 px-4 py-2.5 text-sm font-semibold text-gray-300 cursor-not-allowed opacity-50">
              <span className="text-lg">??</span>
              <span>Sprint Board</span>
            </div>
          )}

          {kanbanTeamLink ? (
            <NavLink
              to={kanbanTeamLink}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 mt-1 ${isActive ? 'bg-[#E6EFFC] text-[#0052CC]' : 'text-[#42526E] hover:bg-[#F4F5F7]'
                }`
              }
            >
              <span className="text-lg">???</span>
              <span>Kanban Board</span>
            </NavLink>
          ) : (
            <div className="flex items-center gap-3 px-4 py-2.5 text-sm font-semibold text-gray-300 cursor-not-allowed opacity-50 mt-1">
              <span className="text-lg">???</span>
              <span>Kanban Board</span>
            </div>
          )}
        </nav>

        <div className="mt-auto px-2 py-6 border-t border-[#DFE1E6]">
          <div className="bg-[#F4F7FA] p-3 rounded-lg">
            <p className="text-[10px] uppercase font-bold text-[#6B778C] mb-1">Current Plan</p>
            <p className="text-xs font-bold text-[#172B4D]">Professional Trial</p>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
