import React from 'react';

const StatusCircleIcon: React.FC<{ className?: string }> = ({ className = 'w-6 h-6' }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
    className={className}
    aria-hidden="true"
  >
    <path 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      strokeDasharray="2 3" 
      d="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z" 
    />
  </svg>
);

export default StatusCircleIcon;
