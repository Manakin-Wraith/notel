import React from 'react';

const LightBulbIcon: React.FC<{ className?: string }> = ({ className = 'w-6 h-6' }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 18v-5.25m0 0a6.01 6.01 0 0 0 1.5-1.5c1.5-1.5 1.5-3.75 0-5.25S10.5 4.5 9 6c-1.5 1.5-1.5 3.75 0 5.25a6.01 6.01 0 0 0 1.5 1.5m3 0H9" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9 9 0 1 1 0-18 9 9 0 0 1 0 18Z" />
  </svg>
);

export default LightBulbIcon;