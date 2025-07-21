import React from 'react';

interface NotelLogoProps {
  className?: string;
  size?: number;
}

const NotelLogo: React.FC<NotelLogoProps> = ({ className = 'w-6 h-6', size }) => {
  const sizeProps = size ? { width: size, height: size } : {};
  
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      viewBox="0 0 24 24" 
      fill="currentColor"
      className={className}
      {...sizeProps}
    >
      <path d="M20 2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h4l4 4 4-4h4c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-2 12H6v-2h12v2zm0-3H6V9h12v2zm0-3H6V6h12v2z"/>
    </svg>
  );
};

export default NotelLogo;
