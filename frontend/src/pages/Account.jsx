import React, { useState } from 'react';
import { useEffect } from 'react';
import BackButton from '../components/Common/BackButton';
import { useAuth } from '../context/AuthContext';
import { authService } from '../services/authService';
import { teamService } from '../services/teamService';
import { getErrorMessage } from '../utils/error';

const Account = () => {
  const { user, refreshUser } = useAuth();
  const isAdmin = user?.role === 'admin';
  const [formData, setFormData] = useState({
    email: user?.email || '',
    current_password: '',
    new_password: '',
    confirm_password: ''
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [teams, setTeams] = useState([]);
  const [createForm, setCreateForm] = useState({
    name: '',
    email: '',
    password: '',
    doj: '',
    team_id: '',
    role: 'member'
  });
  const [createSaving, setCreateSaving] = useState(false);
  const [createError, setCreateError] = useState('');
  const [createSuccess, setCreateSuccess] = useState('');

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  useEffect(() => {
    const loadTeams = async () => {
      if (!isAdmin) return;
      try {
        const teamList = await teamService.getAllTeams();
        setTeams(teamList || []);
      } catch (err) {
        setCreateError(getErrorMessage(err, 'Failed to load teams'));
      }
    };
    loadTeams();
  }, [isAdmin]);

  const handleCreateFormChange = (e) => {
    setCreateForm((prev) => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    const normalizedEmail = formData.email.trim().toLowerCase();
    const hasEmailChange = normalizedEmail && normalizedEmail !== String(user?.email || '').toLowerCase();
    const hasPasswordChange = !!formData.new_password;

    if (!hasEmailChange && !hasPasswordChange) {
      setError('No changes detected.');
      return;
    }

    if (hasPasswordChange && formData.new_password !== formData.confirm_password) {
      setError('New password and confirm password must match.');
      return;
    }

    try {
      setSaving(true);
      await authService.updateProfile({
        email: normalizedEmail,
        current_password: formData.current_password,
        new_password: hasPasswordChange ? formData.new_password : undefined
      });
      refreshUser();
      setSuccess('Credentials updated successfully.');
      setFormData((prev) => ({
        ...prev,
        current_password: '',
        new_password: '',
        confirm_password: '',
        email: normalizedEmail
      }));
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to update credentials'));
    } finally {
      setSaving(false);
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setCreateError('');
    setCreateSuccess('');

    if (!createForm.team_id) {
      setCreateError('Team is required.');
      return;
    }

    try {
      setCreateSaving(true);
      await authService.createUserByAdmin({
        ...createForm,
        email: createForm.email.trim().toLowerCase(),
        team_id: Number(createForm.team_id)
      });
      setCreateSuccess('Employee account created and assigned to team.');
      setCreateForm({
        name: '',
        email: '',
        password: '',
        doj: '',
        team_id: '',
        role: 'member'
      });
    } catch (err) {
      setCreateError(getErrorMessage(err, 'Failed to create user account'));
    } finally {
      setCreateSaving(false);
    }
  };

  return (
    <div className="p-8 bg-white min-h-screen">
      <div className="max-w-2xl mx-auto">
        <BackButton to="/dashboard" />
        <h1 className="text-3xl font-extrabold text-[#172B4D] tracking-tight mb-2">Account Settings</h1>
        <p className="text-[#5E6C84] mb-8">Update your email and password.</p>

        <div className="border border-[#DFE1E6] rounded-[6px] bg-[#FAFBFC] p-6">
          <h2 className="text-lg font-bold text-[#172B4D] mb-4">My Credentials</h2>
          {error && (
            <div className="mb-4 p-3 bg-[#FFEBE6] text-[#DE350B] text-sm rounded-[3px]">
              {error}
            </div>
          )}
          {success && (
            <div className="mb-4 p-3 bg-[#E3FCEF] text-[#006644] text-sm rounded-[3px] border border-[#B3DFCC]">
              {success}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold text-[#5E6C84] mb-1.5 uppercase">Email</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full border border-[#DFE1E6] bg-white px-3 py-2 rounded-[3px] text-sm focus:outline-none focus:border-[#4C9AFF]"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#5E6C84] mb-1.5 uppercase">Current Password</label>
              <input
                type="password"
                name="current_password"
                value={formData.current_password}
                onChange={handleChange}
                className="w-full border border-[#DFE1E6] bg-white px-3 py-2 rounded-[3px] text-sm focus:outline-none focus:border-[#4C9AFF]"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#5E6C84] mb-1.5 uppercase">New Password (Optional)</label>
              <input
                type="password"
                name="new_password"
                value={formData.new_password}
                onChange={handleChange}
                className="w-full border border-[#DFE1E6] bg-white px-3 py-2 rounded-[3px] text-sm focus:outline-none focus:border-[#4C9AFF]"
                minLength={6}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#5E6C84] mb-1.5 uppercase">Confirm New Password</label>
              <input
                type="password"
                name="confirm_password"
                value={formData.confirm_password}
                onChange={handleChange}
                className="w-full border border-[#DFE1E6] bg-white px-3 py-2 rounded-[3px] text-sm focus:outline-none focus:border-[#4C9AFF]"
                minLength={6}
              />
            </div>

            <div className="pt-2">
              <button type="submit" disabled={saving} className="btn-primary">
                {saving ? 'Saving...' : 'Update Credentials'}
              </button>
            </div>
          </form>
        </div>

        {isAdmin && (
          <div className="border border-[#DFE1E6] rounded-[6px] bg-[#FAFBFC] p-6 mt-8">
            <h2 className="text-lg font-bold text-[#172B4D] mb-4">Create Employee Account</h2>
            {createError && (
              <div className="mb-4 p-3 bg-[#FFEBE6] text-[#DE350B] text-sm rounded-[3px]">
                {createError}
              </div>
            )}
            {createSuccess && (
              <div className="mb-4 p-3 bg-[#E3FCEF] text-[#006644] text-sm rounded-[3px] border border-[#B3DFCC]">
                {createSuccess}
              </div>
            )}
            <form onSubmit={handleCreateUser} className="space-y-5">
              <div>
                <label className="block text-xs font-semibold text-[#5E6C84] mb-1.5 uppercase">Member Name</label>
                <input
                  type="text"
                  name="name"
                  value={createForm.name}
                  onChange={handleCreateFormChange}
                  className="w-full border border-[#DFE1E6] bg-white px-3 py-2 rounded-[3px] text-sm focus:outline-none focus:border-[#4C9AFF]"
                  required
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#5E6C84] mb-1.5 uppercase">Email</label>
                  <input
                    type="email"
                    name="email"
                    value={createForm.email}
                    onChange={handleCreateFormChange}
                    className="w-full border border-[#DFE1E6] bg-white px-3 py-2 rounded-[3px] text-sm focus:outline-none focus:border-[#4C9AFF]"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#5E6C84] mb-1.5 uppercase">Password</label>
                  <input
                    type="password"
                    name="password"
                    value={createForm.password}
                    onChange={handleCreateFormChange}
                    className="w-full border border-[#DFE1E6] bg-white px-3 py-2 rounded-[3px] text-sm focus:outline-none focus:border-[#4C9AFF]"
                    minLength={6}
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#5E6C84] mb-1.5 uppercase">DOJ (Date of Joining)</label>
                  <input
                    type="date"
                    name="doj"
                    value={createForm.doj}
                    onChange={handleCreateFormChange}
                    className="w-full border border-[#DFE1E6] bg-white px-3 py-2 rounded-[3px] text-sm focus:outline-none focus:border-[#4C9AFF]"
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#5E6C84] mb-1.5 uppercase">Team</label>
                  <select
                    name="team_id"
                    value={createForm.team_id}
                    onChange={handleCreateFormChange}
                    className="w-full border border-[#DFE1E6] bg-white px-3 py-2 rounded-[3px] text-sm focus:outline-none focus:border-[#4C9AFF]"
                    required
                  >
                    <option value="">Select team</option>
                    {teams.map((team) => (
                      <option key={team.id} value={team.id}>
                        {team.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#5E6C84] mb-1.5 uppercase">Role</label>
                  <select
                    name="role"
                    value={createForm.role}
                    onChange={handleCreateFormChange}
                    className="w-full border border-[#DFE1E6] bg-white px-3 py-2 rounded-[3px] text-sm focus:outline-none focus:border-[#4C9AFF]"
                  >
                    <option value="member">Member</option>
                    <option value="team_lead">Team Lead</option>
                  </select>
                </div>
              </div>
              <div className="pt-2">
                <button type="submit" disabled={createSaving} className="btn-primary">
                  {createSaving ? 'Creating...' : 'Create Employee Account'}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default Account;
