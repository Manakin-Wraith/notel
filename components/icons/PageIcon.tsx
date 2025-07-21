
import React from 'react';
import { ICONS } from './icon-constants';
import DocumentTextIcon from './DocumentTextIcon';
import LightBulbIcon from './LightBulbIcon';
import BookOpenIcon from './BookOpenIcon';
import BriefcaseIcon from './BriefcaseIcon';
import ChartBarIcon from './ChartBarIcon';
import CodeBracketIcon from './CodeBracketIcon';
import RocketLaunchIcon from './RocketLaunchIcon';
import SparklesIcon from './SparklesIcon';

interface PageIconProps {
  icon: string;
  className?: string;
}

const PageIcon: React.FC<PageIconProps> = ({ icon, className = "w-6 h-6" }) => {
  // A simple check if the icon is one of the built-in named icons
  const isNamedIcon = ICONS.includes(icon);

  if (isNamedIcon) {
    switch (icon) {
      case 'light-bulb':
        return <LightBulbIcon className={className} />;
      case 'book-open':
        return <BookOpenIcon className={className} />;
      case 'briefcase':
          return <BriefcaseIcon className={className} />;
      case 'chart-bar':
          return <ChartBarIcon className={className} />;
      case 'code-bracket':
          return <CodeBracketIcon className={className} />;
      case 'rocket-launch':
          return <RocketLaunchIcon className={className} />;
      case 'sparkles':
          return <SparklesIcon className={className} />;
      case 'document-text':
      default:
        return <DocumentTextIcon className={className} />;
    }
  }

  // Otherwise, it's an emoji. Render it as text.
  // We determine a suitable font size based on the container size class.
  let fontSize;
  if (className.includes('w-16')) { // For large display in Editor
    fontSize = '4rem';
  } else if (className.includes('w-10')) { // For CalendarView title
    fontSize = '2.25rem';
  } else if (className.includes('w-6')) { // Default/medium size
    fontSize = '1.5rem';
  } else if (className.includes('w-5')) { // Sidebar size
    fontSize = '1.25rem';
  } else if (className.includes('w-4')) { // Smallest size (e.g., calendar events)
    fontSize = '1rem';
  } else {
    fontSize = '1.25rem'; // A sensible fallback
  }

  return (
    <span 
      className={`${className} inline-flex items-center justify-center`} 
      style={{ fontSize: fontSize, lineHeight: 1 }}
    >
      {icon}
    </span>
  );
};

export default PageIcon;
