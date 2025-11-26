import React from 'react';

const ProgressBar = ({ progreso }) => {
    return (
        <div className="flex items-center">
            <div className="relative w-10 h-10 mr-2">
                <svg viewBox="0 0 36 36" className="w-full h-full">
                    <path
                        d="M18 2.0845
                        a 15.9155 15.9155 0 0 1 0 31.831
                        a 15.9155 15.9155 0 0 1 0 -31.831"
                        fill="none"
                        stroke="#e5e7eb"
                        strokeWidth="4"
                    />
                    <path
                        d="M18 2.0845
                        a 15.9155 15.9155 0 0 1 0 31.831"
                        fill="none"
                        stroke="#2dd4bf"
                        strokeWidth="4"
                        strokeDasharray={`${progreso}, 100`}
                    />
                    <text x="18" y="20.35" className="text-sm font-medium text-gray-400" fill="#6b7280" textAnchor="middle" dominantBaseline="middle">
                        {progreso}%
                    </text>
                </svg>
            </div>
            <div className="w-full bg-gray-300 h-2 rounded-full">
                <div
                    className="bg-teal-500 h-2 rounded-full"
                    style={{
                        width: `${progreso}%`
                    }}
                />
            </div>
        </div>
    );
};

export default ProgressBar;
