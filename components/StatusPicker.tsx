import React, { useRef, useEffect } from 'react';
import CircleIcon from './icons/CircleIcon';
import InProgressIcon from './icons/InProgressIcon';
import CheckCircleIcon from './icons/CheckCircleIcon';

type Status = 'todo' | 'in-progress' | 'done';
interface StatusPickerProps {
  onSelect: (status: Status | null) => void;
  onClose: () => void;
}

const statusOptions: { id: Status; text: string; icon: React.ReactNode }[] = [
  { id: 'todo', text: 'To Do', icon: <CircleIcon className="w-4 h-4 text-gray-500" /> },
  { id: 'in-progress', text: 'In Progress', icon: <InProgressIcon className="w-4 h-4 text-yellow-400" /> },
  { id: 'done', text: 'Done', icon: <CheckCircleIcon className="w-4 h-4 text-green-500" /> },
];

const StatusPicker: React.FC<StatusPickerProps> = ({ onSelect, onClose }) => {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  return (
    <div
      ref={ref}
      className="absolute z-10 top-full mt-2 w-48 p-2 bg-black/50 backdrop-blur-xl border border-white/10 rounded-lg shadow-lg"
      role="dialog"
      aria-label="Status selector"
    >
      <ul className="space-y-1">
        {statusOptions.map(({ id, text, icon }) => (
          <li key={id}>
            <button
              onClick={() => onSelect(id)}
              className="w-full flex items-center text-left p-2 rounded-md transition-colors text-gray-300 hover:bg-white/10"
            >
              <div className="mr-3">{icon}</div>
              <span>{text}</span>
            </button>
          </li>
        ))}
         <li>
            <button
              onClick={() => onSelect(null)}
              className="w-full text-left p-2 rounded-md transition-colors text-gray-400 hover:bg-white/10 text-sm"
            >
              Clear status
            </button>
          </li>
      </ul>
    </div>
  );
};

export default StatusPicker;