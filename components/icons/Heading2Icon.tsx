import React from 'react';

const Heading2Icon: React.FC<{ className?: string }> = ({ className = 'w-6 h-6' }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 4.5v15M16.5 4.5v15M7.5 12h9" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 18.75h-3" />
    </svg>
);

export default Heading2Icon;
