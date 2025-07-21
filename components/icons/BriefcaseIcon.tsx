import React from 'react';

const BriefcaseIcon: React.FC<{ className?: string }> = ({ className = 'w-6 h-6' }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 14.15v4.075c0 1.313-.972 2.4-2.215 2.541-1.428.16-2.613-.933-2.613-2.31v-2.305a2.25 2.25 0 0 1 2.25-2.25H19.5Z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 14.15V18.25c0 1.313.972 2.4 2.215 2.541 1.428.16 2.613-.933 2.613-2.31v-2.305a2.25 2.25 0 0 0-2.25-2.25H4.5A.75.75 0 0 1 3.75 14.15Z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 9.75h7.5M8.25 12h7.5M12 3.75a2.25 2.25 0 0 1 2.25 2.25v.75H9.75v-.75A2.25 2.25 0 0 1 12 3.75Z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 9.75a2.25 2.25 0 0 1 2.25-2.25h13.5a2.25 2.25 0 0 1 2.25 2.25v9a2.25 2.25 0 0 1-2.25 2.25H5.25a2.25 2.25 0 0 1-2.25-2.25v-9Z" />
  </svg>
);

export default BriefcaseIcon;