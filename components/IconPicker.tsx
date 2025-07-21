import React from 'react';
import { ICONS } from './icons/icon-constants';
import PageIcon from './icons/PageIcon';

interface IconPickerProps {
  onSelect: (icon: string) => void;
  onClose: () => void;
}

const IconPicker: React.FC<IconPickerProps> = ({ onSelect, onClose }) => {
  const ref = React.useRef<HTMLDivElement>(null);

  // Close if clicked outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose]);

  return (
    <div 
      ref={ref} 
      className="absolute z-10 top-full mt-2 w-64 p-2 bg-black/50 backdrop-blur-xl border border-white/10 rounded-lg shadow-lg"
      role="dialog"
      aria-label="Icon selector"
    >
      <div className="grid grid-cols-6 gap-2">
        {ICONS.map(icon => (
          <button
            key={icon}
            onClick={() => onSelect(icon)}
            className="p-2 rounded-md text-gray-400 hover:text-white hover:bg-white/20 transition-colors focus:outline-none focus:ring-2 focus:ring-purple-400"
            aria-label={`Select icon ${icon}`}
          >
            <PageIcon icon={icon} className="w-6 h-6" />
          </button>
        ))}
      </div>
    </div>
  );
};

export default IconPicker;