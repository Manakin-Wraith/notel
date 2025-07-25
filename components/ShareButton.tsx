import React, { useState } from 'react';
import ShareModal from './ShareModal';

interface ShareButtonProps {
  resourceId: string;
  resourceType: 'page' | 'event';
  resourceTitle: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'icon' | 'button';
}

const ShareButton: React.FC<ShareButtonProps> = ({
  resourceId,
  resourceType,
  resourceTitle,
  className = '',
  size = 'md',
  variant = 'icon'
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6'
  };

  const buttonSizeClasses = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-1.5 text-sm',
    lg: 'px-4 py-2 text-base'
  };

  const handleShare = () => {
    setIsModalOpen(true);
  };

  if (variant === 'button') {
    return (
      <>
        <button
          onClick={handleShare}
          className={`
            inline-flex items-center space-x-2 
            bg-gray-100 hover:bg-gray-200 
            text-gray-700 font-medium rounded-md 
            transition-colors duration-200
            focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
            ${buttonSizeClasses[size]}
            ${className}
          `}
        >
          <svg 
            className={sizeClasses[size]} 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" 
            />
          </svg>
          <span>Share</span>
        </button>

        <ShareModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          resourceId={resourceId}
          resourceType={resourceType}
          resourceTitle={resourceTitle}
        />
      </>
    );
  }

  return (
    <>
      <button
        onClick={handleShare}
        className={`
          inline-flex items-center justify-center
          text-gray-400 hover:text-gray-600 
          transition-colors duration-200
          focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
          rounded-md p-1
          ${className}
        `}
        title="Share"
      >
        <svg 
          className={sizeClasses[size]} 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={2} 
            d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" 
          />
        </svg>
      </button>

      <ShareModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        resourceId={resourceId}
        resourceType={resourceType}
        resourceTitle={resourceTitle}
      />
    </>
  );
};

export default ShareButton;
