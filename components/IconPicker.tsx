import React, { useState, useMemo } from 'react';
import { ICONS, EMOJI_CATEGORIES } from './icons/icon-constants';
import PageIcon from './icons/PageIcon';

interface IconPickerProps {
  onSelect: (icon: string) => void;
  onClose: () => void;
}

const IconPicker: React.FC<IconPickerProps> = ({ onSelect, onClose }) => {
  const ref = React.useRef<HTMLDivElement>(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Filter emojis based on search term only
  const filteredEmojis = useMemo(() => {
    let emojis = ICONS;
    
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      emojis = emojis.filter(emoji => {
        // Find the emoji data to search by name
        const emojiData = EMOJI_CATEGORIES
          .flatMap(cat => cat.emojis)
          .find(e => e.emoji === emoji);
        return emojiData?.name.toLowerCase().includes(searchLower) || emoji.includes(searchTerm);
      });
    }
    
    return emojis;
  }, [searchTerm]);

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
      className="absolute z-10 top-full mt-2 w-80 bg-black/50 backdrop-blur-xl border border-white/10 rounded-lg shadow-lg"
      role="dialog"
      aria-label="Icon selector"
    >
      {/* Search Only */}
      <div className="p-3 border-b border-white/10">
        <input
          type="text"
          placeholder="Search emojis... (try 'karate', 'rugby', 'calendar')"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onClick={(e) => e.stopPropagation()}
          className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md text-white placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
        />
      </div>
      
      {/* Emoji Grid */}
      <div className="p-2 max-h-64 overflow-y-auto">
        {filteredEmojis.length > 0 ? (
          <div className="grid grid-cols-8 gap-1">
            {filteredEmojis.map((emoji, index) => (
              <button
                key={`emoji-${index}-${emoji}`}
                onClick={() => onSelect(emoji)}
                className="p-2 rounded-md hover:bg-white/20 transition-colors focus:outline-none focus:ring-2 focus:ring-purple-400"
                aria-label={`Select emoji ${emoji}`}
                title={EMOJI_CATEGORIES
                  .flatMap(cat => cat.emojis)
                  .find(e => e.emoji === emoji)?.name || emoji
                }
              >
                <PageIcon icon={emoji} className="w-5 h-5" />
              </button>
            ))}
          </div>
        ) : (
          <div className="text-center text-gray-400 py-4">
            No emojis found
          </div>
        )}
      </div>
    </div>
  );
};

export default IconPicker;