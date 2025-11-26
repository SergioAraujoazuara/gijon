import React from "react";

const Spinner = () => {
  return (
    <div className="flex justify-center items-center" style={{ width: 24, height: 24 }}>
      <div className="w-6 h-2 bg-gray-200 rounded-full overflow-hidden" style={{ width: 24, height: 6 }}>
        <div className="h-2 bg-blue-500 rounded-full animate-pulse-bar" style={{ width: '40%' }}></div>
      </div>
      <style>{`
        @keyframes pulse-bar {
          0% { margin-left: -40%; }
          100% { margin-left: 100%; }
        }
        .animate-pulse-bar {
          animation: pulse-bar 1.2s cubic-bezier(0.4, 0, 0.2, 1) infinite;
        }
      `}</style>
    </div>
  );
};

export default Spinner;
  