
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
      className="absolute z-10 top-full mt-2 w-80 max-h-[50vh] flex flex-col bg-black/50 backdrop-blur-xl border border-white/10 rounded-lg shadow-lg"
      role="dialog"
      aria-label="Emoji selector"
    >
      <div className="p-2 border-b border-white/10">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search emoji..."
          className="w-full bg-transparent text-sm text-gray-200 placeholder-gray-500 focus:outline-none px-2 py-1"
        />
      </div>
      {!query && (
         <div className="p-2 border-b border-white/10 flex justify-around">
            {EMOJI_DATA.map(category => (
                <button 
                    key={category.name} 
                    onClick={() => handleCategoryClick(category.name)}
                    className={`p-1.5 rounded-md transition-colors text-xl ${activeCategory === category.name ? 'bg-white/20' : 'hover:bg-white/10'}`}
                    title={category.name}
                >
                    {CATEGORY_ICONS[category.name]}
                </button>
            ))}
        </div>
      )}
      <div 
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto p-2"
      >
        {filteredData.map(category => (
          <div key={category.name} ref={el => { if(el) categoryRefs.current[category.name] = el; }}>
            <h3 className="text-xs font-bold uppercase text-gray-500 py-2 px-1 sticky top-0 bg-black/50 backdrop-blur-xl">{category.name}</h3>
            <div className="grid grid-cols-8 gap-1">
              {category.emojis.map(emoji => (
                <button
                  key={emoji.name}
                  onClick={() => onSelect(emoji.emoji)}
                  className="p-1 rounded-md text-2xl hover:bg-white/20 transition-colors focus:outline-none focus:ring-2 focus:ring-purple-400"
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
