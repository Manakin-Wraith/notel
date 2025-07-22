
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { EMOJI_DATA, EmojiCategory } from './emoji-data';

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
      className="absolute z-10 top-full mt-2 w-80 max-h-[60vh] flex flex-col bg-gray-900/95 backdrop-blur-xl border border-gray-700/50 rounded-xl shadow-2xl overflow-hidden"
      role="dialog"
      aria-label="Emoji selector"
    >
      {/* Search Header */}
      <div className="p-4 border-b border-gray-700/50 bg-gray-800/50">
        <div className="relative">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search emojis..."
            className="w-full bg-gray-800/80 text-sm text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 px-3 py-2 rounded-lg border border-gray-600/50 transition-all duration-200"
            autoFocus
          />
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-xs">
            {query && `${filteredData.reduce((acc, cat) => acc + cat.emojis.length, 0)} found`}
          </div>
        </div>
      </div>
      {/* Category Tabs */}
      {!query && (
        <div className="flex border-b border-gray-700/50 bg-gray-800/30 overflow-x-auto scrollbar-hide">
          {EMOJI_DATA.map((category) => {
            const isActive = activeCategory === category.name;
            return (
              <button
                key={category.name}
                onClick={() => handleCategoryClick(category.name)}
                className={`flex-shrink-0 px-4 py-3 text-sm font-medium transition-all duration-200 border-b-2 ${
                  isActive
                    ? 'text-blue-400 bg-blue-500/10 border-blue-400'
                    : 'text-gray-400 hover:text-gray-200 hover:bg-gray-700/50 border-transparent'
                }`}
                title={category.name}
              >
                <span className="text-lg mb-1 block">{CATEGORY_ICONS[category.name] || '📁'}</span>
                <span className="text-xs hidden sm:block">{category.name.split(' ')[0]}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* Emoji Grid */}
      <div
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto p-4 space-y-6 scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800/50"
        style={{ maxHeight: '320px' }}
        onScroll={handleScroll}
      >
        {filteredData.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <div className="text-2xl mb-2">🔍</div>
            <p className="text-sm">No emojis found</p>
            <p className="text-xs mt-1">Try a different search term</p>
          </div>
        ) : (
          filteredData.map((category) => (
            <div
              key={category.name}
              ref={(el) => {
                if (el) categoryRefs.current[category.name] = el;
              }}
            >
              <h3 className="text-sm font-semibold text-gray-300 mb-3 px-1 flex items-center gap-2">
                <span>{CATEGORY_ICONS[category.name] || '📁'}</span>
                {category.name}
                <span className="text-xs text-gray-500 ml-auto">({category.emojis.length})</span>
              </h3>
              <div className="grid grid-cols-8 gap-2">
                {category.emojis.map((emoji) => (
                  <button
                    key={emoji.emoji}
                    onClick={() => onSelect(emoji.emoji)}
                    className="w-10 h-10 flex items-center justify-center text-xl hover:bg-gray-700/50 rounded-lg transition-all duration-150 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                    title={emoji.name}
                  >
                    {emoji.emoji}
                  </button>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default EmojiPicker;
