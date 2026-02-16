import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { teamService } from '../services/teamService';

const Register = () => {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [teams, setTeams] = useState([]);
  const [form, setForm] = useState({
    first_name: '',
    last_name: '',
    email: '',
    password: '',
    role: 'member',
    team_id: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchTeams = async () => {
      try {
        const data = await teamService.getAllTeams();
        setTeams(data);
        if (data.length > 0) {
          setForm(prev => ({ ...prev, team_id: data[0].id }));
        }
      } catch (err) {
        console.error('Failed to fetch teams', err);
      }
    };
    fetchTeams();
  }, []);

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await register(form);
      if (res.success) {
        navigate('/', { replace: true });
      } else {
        setError(res.message || 'Registration failed');
      }
    } catch (err) {
      let errorMessage = 'Registration failed';
      if (err.response?.data) {
        if (err.response.data.errors && Array.isArray(err.response.data.errors)) {
          errorMessage = err.response.data.errors.map(e => e.msg).join(', ');
        } else if (err.response.data.message) {
          errorMessage = err.response.data.message;
        }
      }
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page px-4">
      <form className="auth-card max-w-md w-full" onSubmit={handleSubmit}>
        <div className="auth-title">Create your account</div>
        <div className="auth-subtitle text-[#5E6C84]">Join your team on Scrum Board.</div>

        {error && <div className="auth-error mb-4">{error}</div>}

        <div className="grid grid-cols-2 gap-4">
          <div className="auth-field">
            <label className="auth-label" htmlFor="first_name">
              First name
            </label>
            <input
              id="first_name"
              name="first_name"
              className="auth-input"
              value={form.first_name}
              onChange={handleChange}
              required
            />
          </div>

          <div className="auth-field">
            <label className="auth-label" htmlFor="last_name">
              Last name
            </label>
            <input
              id="last_name"
              name="last_name"
              className="auth-input"
              value={form.last_name}
              onChange={handleChange}
              required
            />
          </div>
        </div>

        <div className="auth-field">
          <label className="auth-label" htmlFor="email">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            className="auth-input"
            value={form.email}
            onChange={handleChange}
            required
          />
        </div>

        <div className="auth-field">
          <label className="auth-label" htmlFor="password">
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            className="auth-input"
            value={form.password}
            onChange={handleChange}
            required
          />
        </div>

        <div className="auth-field">
          <label className="auth-label" htmlFor="team_id">
            Join Team
          </label>
          <select
            id="team_id"
            name="team_id"
            className="auth-input"
            value={form.team_id}
            onChange={handleChange}
            required={form.role === 'member'}
          >
            <option value="" disabled>Select a team</option>
            {teams.map(t => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
        </div>

        <div className="auth-field">
          <label className="auth-label" htmlFor="role">
            Role
          </label>
          <select
            id="role"
            name="role"
            className="auth-input"
            value={form.role}
            onChange={handleChange}
          >
            <option value="member">Member</option>
            <option value="admin">Admin</option>
          </select>
        </div>

        <button className="auth-button mt-4" type="submit" disabled={loading}>
          {loading ? 'Creating account…' : 'Create account'}
        </button>

        <div className="auth-footer mt-6">
          Already have an account?{' '}
          <Link className="auth-link" to="/login">
            Sign in
          </Link>
        </div>
      </form>
    </div>
  );
};

export default Register;

