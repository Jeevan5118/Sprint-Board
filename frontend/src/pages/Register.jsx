import React from 'react';
import { Link } from 'react-router-dom';

const Register = () => {
  return (
    <div className="auth-page px-4">
      <div className="auth-card max-w-md w-full">
        <div className="auth-title">Registration Disabled</div>
        <div className="auth-subtitle text-[#5E6C84]">
          Accounts can only be created by admin from Account Settings.
        </div>
        <div className="auth-footer mt-6">
          Already have an account?{' '}
          <Link className="auth-link" to="/login">
            Sign in
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Register;
