import React from 'react';

const RocketLaunchIcon: React.FC<{ className?: string }> = ({ className = 'w-6 h-6' }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.59 14.37a6 6 0 0 1-5.84 7.38v-4.82m5.84-2.56a6 6 0 0 0-7.38-5.84m2.56 5.84L6.16 14.37a6 6 0 0 1 7.38 5.84m-7.38-5.84l5.84-2.56a6 6 0 0 0 5.84-7.38l-5.84 2.56m-2.56 5.84l-2.56-5.84a6 6 0 0 1 5.84-7.38l2.56 5.84" />
    <path strokeLinecap="round" strokeLinejoin="round" d="m21.75 6.75-5.25 5.25" />
    <path strokeLinecap="round" strokeLinejoin="round" d="m16.5 2.25 5.25 5.25" />
  </svg>
);

export default RocketLaunchIcon;