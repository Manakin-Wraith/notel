
import React from 'react';

const JsonIcon: React.FC<{ className?: string }> = ({ className = 'w-6 h-6' }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 6.75h7.5" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 12h7.5" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 17.25h7.5" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 3.75c-1.04 0-1.9.8-2.48 1.833-.6.983-.92 2.125-.92 3.292v2.25c0 1.167.32 2.31.92 3.292C7.1 19.45 7.96 20.25 9 20.25" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 3.75c1.04 0 1.9.8 2.48 1.833.6.983.92 2.125.92 3.292v2.25c0 1.167-.32 2.31-.92 3.292C16.9 19.45 16.04 20.25 15 20.25" />
    </svg>
);

export default JsonIcon;
