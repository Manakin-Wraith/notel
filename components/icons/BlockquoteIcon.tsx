import React from 'react';

const BlockquoteIcon: React.FC<{ className?: string }> = ({ className = 'w-6 h-6' }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75v10.5M8.25 6.75h12M8.25 12h12M8.25 17.25h12" />
    </svg>
);

export default BlockquoteIcon;
