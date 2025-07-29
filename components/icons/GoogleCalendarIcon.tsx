/**
 * GoogleCalendarIcon Component
 * Official Google Calendar icon with brand colors
 */

import React from 'react';

interface GoogleCalendarIconProps {
  className?: string;
  size?: number;
}

const GoogleCalendarIcon: React.FC<GoogleCalendarIconProps> = ({ 
  className = '', 
  size = 16 
}) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Calendar base */}
      <rect
        x="3"
        y="4"
        width="18"
        height="18"
        rx="2"
        ry="2"
        fill="#4285f4"
        stroke="none"
      />
      
      {/* Calendar header */}
      <rect
        x="3"
        y="4"
        width="18"
        height="4"
        rx="2"
        ry="2"
        fill="#1a73e8"
      />
      
      {/* Calendar rings/holes */}
      <rect
        x="7"
        y="2"
        width="2"
        height="4"
        rx="1"
        fill="#5f6368"
      />
      <rect
        x="15"
        y="2"
        width="2"
        height="4"
        rx="1"
        fill="#5f6368"
      />
      
      {/* Calendar grid lines */}
      <line x1="6" y1="10" x2="18" y2="10" stroke="rgba(255,255,255,0.3)" strokeWidth="0.5"/>
      <line x1="6" y1="13" x2="18" y2="13" stroke="rgba(255,255,255,0.3)" strokeWidth="0.5"/>
      <line x1="6" y1="16" x2="18" y2="16" stroke="rgba(255,255,255,0.3)" strokeWidth="0.5"/>
      <line x1="9" y1="8" x2="9" y2="19" stroke="rgba(255,255,255,0.3)" strokeWidth="0.5"/>
      <line x1="12" y1="8" x2="12" y2="19" stroke="rgba(255,255,255,0.3)" strokeWidth="0.5"/>
      <line x1="15" y1="8" x2="15" y2="19" stroke="rgba(255,255,255,0.3)" strokeWidth="0.5"/>
      
      {/* Date highlight (optional - can be customized) */}
      <circle
        cx="10.5"
        cy="14.5"
        r="1.5"
        fill="#ffffff"
        opacity="0.9"
      />
    </svg>
  );
};

export default GoogleCalendarIcon;
