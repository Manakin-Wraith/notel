
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { EMOJI_DATA, EmojiCategory, Emoji } from './emoji-data';

interface EmojiPickerProps {
  onSelect: (icon: string) => void;
  onClose: () => void;
}

const CATEGORY_ICONS: { [key: string]: string } = {
  'Smileys & Emotion': '😊',
  'People & Body': '🧑',
  'Animals & Nature': '🌿',
  'Food & Drink': '🍔',
  'Travel & Places': '✈️',
  'Activities': '🎉',
  'Objects': '💡',
  'Symbols': '❤️',
  'Flags': '🚩',
};

const EmojiPicker: React.FC<EmojiPickerProps> = ({ onSelect, onClose }) => {
  const [query, setQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState(EMOJI_DATA[0].name);
  const ref = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const categoryRefs = useRef<Record<string, HTMLDivElement>>({});

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  const filteredData = useMemo(() => {
    if (!query) return EMOJI_DATA;
    const lowerCaseQuery = query.toLowerCase();
    const result: EmojiCategory[] = [];

    for (const category of EMOJI_DATA) {
      const matchingEmojis = category.emojis.filter(emoji => 
        emoji.name.toLowerCase().includes(lowerCaseQuery)
      );
      if (matchingEmojis.length > 0) {
        result.push({ ...category, emojis: matchingEmojis });
      }
    }
    return result;
  }, [query]);

  const handleCategoryClick = (categoryName: string) => {
      setActiveCategory(categoryName);
      categoryRefs.current[categoryName]?.scrollIntoView({ behavior: 'smooth' });
  };
  
  const handleScroll = () => {
    if (!scrollContainerRef.current) return;
    const { scrollTop } = scrollContainerRef.current;
    
    let currentCategory = '';
    for (const category of filteredData) {
        const el = categoryRefs.current[category.name];
        if (el && el.offsetTop - 100 <= scrollTop) {
            currentCategory = category.name;
        }
    }
    if (currentCategory && currentCategory !== activeCategory) {
        setActiveCategory(currentCategory);
    }
  };

  return (
    <div
      ref={ref}
      className="absolute z-10 top-full mt-2 w-80 sm:w-96 max-h-[60vh] sm:max-h-[50vh] flex flex-col bg-black/50 backdrop-blur-xl border border-white/10 rounded-lg shadow-lg"
      role="dialog"
      aria-label="Emoji selector"
    >
      <div className="p-3 sm:p-2 border-b border-white/10">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search emoji..."
          className="w-full bg-transparent text-sm text-gray-200 placeholder-gray-500 focus:outline-none px-2 py-2 sm:py-1 rounded border border-white/10 focus:border-purple-400"
        />
      </div>
      {!query && (
         <div className="p-2 border-b border-white/10 flex justify-around overflow-x-auto">
            {EMOJI_DATA.map(category => (
                <button 
                    key={category.name} 
                    onClick={() => handleCategoryClick(category.name)}
                    className={`p-2 sm:p-1.5 rounded-md transition-colors text-xl sm:text-lg min-w-[2.5rem] ${activeCategory === category.name ? 'bg-white/20' : 'hover:bg-white/10'}`}
                    title={category.name}
                >
                    {CATEGORY_ICONS[category.name]}
                </button>
            ))}
        </div>
      )}
      <div className="flex-1 overflow-y-auto p-3 sm:p-2" onScroll={handleScroll} ref={scrollContainerRef}>
        {filteredData.map(category => (
          <div key={category.name} ref={el => { if (el) categoryRefs.current[category.name] = el; }}>
            <h3 className="text-xs font-semibold text-gray-400 mb-2 px-1">{category.name}</h3>
            <div className="grid grid-cols-6 sm:grid-cols-8 gap-1 mb-4">
              {category.emojis.map(emoji => (
                <button
                  key={emoji.emoji}
                  onClick={() => onSelect(emoji.emoji)}
                  className="p-3 sm:p-2 rounded-md hover:bg-white/10 transition-colors text-xl sm:text-lg active:bg-white/20 touch-manipulation"
                  title={emoji.name}
                >
                  {emoji.emoji}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default EmojiPicker;
