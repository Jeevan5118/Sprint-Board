import React from 'react';
import { useNavigate } from 'react-router-dom';

const BackButton = ({ label = 'Back', to }) => {
    const navigate = useNavigate();

    const handleBack = () => {
        if (to) {
            navigate(to);
        } else {
            navigate(-1);
        }
    };

    return (
        <button className="btn-back mb-4" onClick={handleBack} type="button">
            <span style={{ fontSize: '18px' }}>←</span>
            <span>{label}</span>
        </button>
    );
};

export default BackButton;
