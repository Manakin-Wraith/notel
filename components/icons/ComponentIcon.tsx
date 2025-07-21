
import React from 'react';

const ComponentIcon: React.FC<{ className?: string }> = ({ className = 'w-6 h-6' }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 7.5l-2.25-1.313M21 7.5v7.5M21 7.5l-8.25 4.875M3 7.5l2.25-1.313M3 7.5v7.5M3 7.5l8.25 4.875m0-12.375L3 7.5m8.25-4.875L21 7.5m0 0l-8.25 4.875m8.25-4.875v7.5m-8.25-12.375L3 7.5m8.25 4.875L3 15m8.25-4.875l8.25 4.875" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 7.5l8.25-4.875L21 7.5v7.5l-8.25 4.875L3 15V7.5z" />
    </svg>
);

export default ComponentIcon;
