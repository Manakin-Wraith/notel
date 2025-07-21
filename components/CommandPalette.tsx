
import React, { useState, useEffect, useMemo, useRef } from 'react';
import type { Page } from '../types';
import PlusIcon from './icons/PlusIcon';
import PageIcon from './icons/PageIcon';

interface CommandPaletteProps {
  pages: Page[];
  onSelectPage: (id: string) => void;
  onAddPage: () => void;
  onClose: () => void;
}

interface Command {
  id: string;
  type: 'page' | 'action';
  title: string;
  icon: string | React.ReactNode;
  action: () => void;
}

const CommandPalette: React.FC<CommandPaletteProps> = ({ pages, onSelectPage, onAddPage, onClose }) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const paletteRef = useRef<HTMLDivElement>(null);

  const commands = useMemo<Command[]>(() => {
    const pageCommands: Command[] = pages
      .filter(page => page.title.toLowerCase().includes(query.toLowerCase()))
      .map(page => ({
        id: page.id,
        type: 'page',
        title: page.title || 'Untitled',
        icon: page.icon,
        action: () => onSelectPage(page.id),
      }));

    const actionCommands: Command[] = ([
      {
        id: 'new-page',
        type: 'action',
        title: 'Create new page',
        icon: <PlusIcon className="w-5 h-5" />,
        action: onAddPage,
      },
    ] as Command[]).filter(cmd => cmd.title.toLowerCase().includes(query.toLowerCase()) || query === '');

    return [...actionCommands, ...pageCommands];
  }, [pages, query, onSelectPage, onAddPage]);

  // Keyboard navigation and closing
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => (prev > 0 ? prev - 1 : commands.length - 1));
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev => (prev < commands.length - 1 ? prev + 1 : 0));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (commands[selectedIndex]) {
          commands[selectedIndex].action();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [commands, selectedIndex, onClose]);

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);
  
  // Scroll to selected item
  useEffect(() => {
    const item = listRef.current?.children[selectedIndex] as HTMLLIElement;
    item?.scrollIntoView({ block: 'nearest' });
  }, [selectedIndex]);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (paletteRef.current && !paletteRef.current.contains(event.target as Node)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-start justify-center pt-[20vh] sm:pt-[15vh]">
      <div 
        ref={paletteRef}
        className="w-full max-w-xl bg-black/50 backdrop-blur-2xl border border-white/10 rounded-lg shadow-2xl overflow-hidden"
        role="dialog"
        aria-modal="true"
        aria-label="Command palette"
      >
        <div className="p-3 border-b border-white/10">
          <input
            ref={inputRef}
            type="text"
            placeholder="Search pages or run commands..."
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            className="w-full bg-transparent text-lg text-gray-100 placeholder-gray-500 focus:outline-none"
          />
        </div>
        <ul ref={listRef} className="max-h-[40vh] overflow-y-auto p-2">
          {commands.length > 0 ? (
            commands.map((cmd, index) => (
              <li key={cmd.id}>
                <button
                  onClick={cmd.action}
                  onMouseMove={() => setSelectedIndex(index)}
                  className={`w-full flex items-center text-left p-2.5 rounded-md transition-colors text-gray-300 ${
                    selectedIndex === index ? 'bg-white/10' : 'hover:bg-white/5'
                  }`}
                >
                  {cmd.type === 'page' ? (
                    <PageIcon icon={cmd.icon as string} className="w-5 h-5 mr-4 text-gray-400 flex-shrink-0" />
                  ) : (
                    <div className="w-5 h-5 mr-4 flex items-center justify-center text-gray-400 flex-shrink-0">{cmd.icon}</div>
                  )}
                  <span className="flex-1 truncate">{cmd.title}</span>
                </button>
              </li>
            ))
          ) : (
            <li className="p-4 text-center text-gray-500">No results found.</li>
          )}
        </ul>
      </div>
    </div>
  );
};

export default CommandPalette;
