import React, { useState, useRef, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import type { Block } from '../types';
import TextIcon from './icons/TextIcon';
import HeadingIcon from './icons/HeadingIcon';
import Heading2Icon from './icons/Heading2Icon';
import PhotoIcon from './icons/PhotoIcon';
import CodeBracketIcon from './icons/CodeBracketIcon';
import CheckSquareIcon from './icons/CheckSquareIcon';
import BlockquoteIcon from './icons/BlockquoteIcon';
import ListBulletIcon from './icons/ListBulletIcon';
import MinusIcon from './icons/MinusIcon';
import TableCellsIcon from './icons/TableCellsIcon';
import SparklesIcon from './icons/SparklesIcon';
import JsonIcon from './icons/JsonIcon';
import ComponentIcon from './icons/ComponentIcon';

interface BlockTypeMenuProps {
    onSelect: (type: Block['type']) => void;
    onClose: () => void;
    triggerElement?: HTMLElement | null;
}

const MENU_ITEMS: { type: Block['type'], title: string, description: string, icon: React.ReactNode, category: 'basic' | 'advanced' | 'media' }[] = [
    { type: 'paragraph', title: 'Text', description: 'Just start writing with plain text', icon: <TextIcon className="w-5 h-5" />, category: 'basic' },
    { type: 'heading1', title: 'Heading 1', description: 'Big section heading', icon: <HeadingIcon className="w-5 h-5" />, category: 'basic' },
    { type: 'heading2', title: 'Heading 2', description: 'Medium section heading', icon: <Heading2Icon className="w-5 h-5" />, category: 'basic' },
    { type: 'bulleted-list-item', title: 'Bullet List', description: 'Create a simple bulleted list', icon: <ListBulletIcon className="w-5 h-5" />, category: 'basic' },
    { type: 'todo', title: 'To-do List', description: 'Track tasks with checkboxes', icon: <CheckSquareIcon className="w-5 h-5" />, category: 'basic' },
    { type: 'blockquote', title: 'Quote', description: 'Capture a quote or callout', icon: <BlockquoteIcon className="w-5 h-5" />, category: 'basic' },
    { type: 'divider', title: 'Divider', description: 'Visually separate content', icon: <MinusIcon className="w-5 h-5" />, category: 'basic' },
    { type: 'table', title: 'Table', description: 'Insert a table with rows and columns', icon: <TableCellsIcon className="w-5 h-5" />, category: 'advanced' },
    { type: 'code', title: 'Code', description: 'Capture a code snippet', icon: <CodeBracketIcon className="w-5 h-5" />, category: 'advanced' },
    { type: 'ai-prompt', title: 'AI Prompt', description: 'Create an AI prompt block', icon: <SparklesIcon className="w-5 h-5" />, category: 'advanced' },
    { type: 'json-schema', title: 'JSON Schema', description: 'Define structured JSON data', icon: <JsonIcon className="w-5 h-5" />, category: 'advanced' },
    { type: 'ui-component', title: 'UI Component', description: 'Render a custom UI component', icon: <ComponentIcon className="w-5 h-5" />, category: 'advanced' },
    { type: 'image', title: 'Image', description: 'Upload or embed an image', icon: <PhotoIcon className="w-5 h-5" />, category: 'media' },
];

const BlockTypeMenu: React.FC<BlockTypeMenuProps> = ({ onSelect, onClose, triggerElement }) => {
    const [query, setQuery] = useState('');
    const [selectedIndex, setSelectedIndex] = useState(0);
    const [position, setPosition] = useState({ top: 0, left: 0 });
    const searchInputRef = useRef<HTMLInputElement>(null);
    const ref = useRef<HTMLDivElement>(null);

    const filteredItems = useMemo(() => {
        if (!query) return MENU_ITEMS;
        return MENU_ITEMS.filter(item => item.title.toLowerCase().includes(query.toLowerCase()) || item.description.toLowerCase().includes(query.toLowerCase()));
    }, [query]);

    useEffect(() => {
      setSelectedIndex(0);
    }, [query]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'ArrowUp') {
                e.preventDefault();
                setSelectedIndex(prev => Math.max(0, prev - 1));
            } else if (e.key === 'ArrowDown') {
                e.preventDefault();
                setSelectedIndex(prev => Math.min(filteredItems.length - 1, prev + 1));
            } else if (e.key === 'Enter') {
                e.preventDefault();
                if (filteredItems[selectedIndex]) {
                    onSelect(filteredItems[selectedIndex].type);
                } else {
                    onClose();
                }
            } else if (e.key === 'Escape') {
                e.preventDefault();
                onClose();
            } else if (e.key.length === 1 && e.key.match(/[a-z0-9]/i)) {
                 setQuery(q => q + e.key.toLowerCase());
            } else if (e.key === 'Backspace') {
                 setQuery(q => q.slice(0, -1));
            }
        };
        
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [filteredItems, selectedIndex, onSelect, onClose]);

    useEffect(() => {
        // Calculate position based on trigger element
        if (triggerElement) {
            const rect = triggerElement.getBoundingClientRect();
            const viewportHeight = window.innerHeight;
            const viewportWidth = window.innerWidth;
            const maxMenuHeight = Math.min(viewportHeight * 0.4, 300); // Reduced to 40vh/300px to show more background
            const menuWidth = 384; // w-96
            const margin = 120; // Much larger margin to show more background
            
            // Calculate available space above and below trigger
            const spaceBelow = viewportHeight - rect.bottom - margin;
            const spaceAbove = rect.top - margin;
            const minRequiredSpace = 200; // Minimum space needed for usable menu
            
            let top: number;
            let left = rect.left;
            
            // Determine best vertical position
            if (spaceBelow >= minRequiredSpace) {
                // Position below trigger
                top = rect.bottom + 8;
            } else if (spaceAbove >= minRequiredSpace) {
                // Position above trigger
                top = rect.top - maxMenuHeight - 8;
            } else {
                // Neither position is ideal, center in viewport or use best available space
                if (spaceBelow > spaceAbove) {
                    // Use available space below, but constrain height
                    top = rect.bottom + 8;
                } else {
                    // Use available space above, but constrain height
                    top = Math.max(margin, rect.top - maxMenuHeight - 8);
                }
                
                // If still not enough space, center vertically in viewport
                if (Math.max(spaceBelow, spaceAbove) < minRequiredSpace) {
                    top = (viewportHeight - maxMenuHeight) / 2;
                }
            }
            
            // Ensure menu stays within vertical viewport bounds
            top = Math.max(margin, Math.min(top, viewportHeight - maxMenuHeight - margin));
            
            // Adjust horizontal position
            if (left + menuWidth > viewportWidth - margin) {
                left = viewportWidth - menuWidth - margin;
            }
            left = Math.max(margin, left);
            
            setPosition({ top, left });
        }
    }, [triggerElement]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (ref.current && !ref.current.contains(event.target as Node)) {
                onClose();
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [onClose]);

    const basicItems = filteredItems.filter(item => item.category === 'basic');
    const advancedItems = filteredItems.filter(item => item.category === 'advanced');
    const mediaItems = filteredItems.filter(item => item.category === 'media');

    const menuContent = (
        <div
            ref={ref}
            className="fixed z-[9999] w-96 max-h-[40vh] flex flex-col bg-gray-900/95 backdrop-blur-xl border border-gray-700/50 rounded-xl shadow-2xl overflow-y-auto isolate"
            style={{
                top: `${position.top}px`,
                left: `${position.left}px`,
                overscrollBehavior: 'contain'
            }}
            role="dialog"
            aria-label="Block type selector"
        >
            {/* Search Input */}
            <div className="border-b border-gray-700/30 p-3">
                <input
                    ref={searchInputRef}
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
                            e.preventDefault();
                            searchInputRef.current?.blur();
                        }
                    }}
                    placeholder="Type to search..."
                    className="w-full px-3 py-2 bg-gray-800/50 rounded-lg text-sm text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                />
            </div>

            {/* Quick Access - Top 3 Items */}
            {!query && (
                <div className="p-4 border-b border-gray-700/30 bg-gray-800/30">
                    <h3 className="text-xs font-semibold text-gray-400 mb-3 flex items-center gap-1.5 px-1">
                        <span className="text-xs">⭐</span> Quick Access
                    </h3>
                    <div className="space-y-2">
                        {MENU_ITEMS.slice(0, 3).map((item, index) => (
                            <button
                                key={item.type}
                                onClick={() => onSelect(item.type)}
                                className={`w-full flex items-center gap-3 p-3 rounded-lg text-left transition-all duration-150 ${
                                    index === selectedIndex
                                        ? 'bg-blue-500/20 text-blue-100 border border-blue-400/30'
                                        : 'text-gray-300 hover:bg-gray-700/50 hover:text-white border border-transparent'
                                }`}
                            >
                                <div className="flex-shrink-0 p-2 bg-gray-700/50 rounded-lg text-gray-300">
                                    {item.icon}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="font-medium text-sm">{item.title}</div>
                                    <div className="text-xs text-gray-400 mt-1">{item.description}</div>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Block Categories */}
            <div className="p-4 space-y-4">
                {filteredItems.length === 0 ? (
                    <div className="text-center py-6 text-gray-400">
                        <div className="text-xl mb-1">🔍</div>
                        <p className="text-xs">No blocks found</p>
                        <p className="text-xs mt-0.5 opacity-75">Try a different search</p>
                    </div>
                ) : (
                    <>
                        {!query && basicItems.length > 0 && (
                            <div>
                                 <h3 className="text-xs font-semibold text-gray-400 mb-3 flex items-center gap-1.5 px-1">
                                     <span className="text-xs">📝</span> All Basic
                                 </h3>
                                 <div className="space-y-2">
                                     {basicItems.map((item, index) => (
                                         <button
                                             key={item.type}
                                             onClick={() => onSelect(item.type)}
                                             className={`w-full flex items-center gap-3 p-3 rounded-lg text-left transition-all duration-150 ${
                                                 (index + 3) === selectedIndex
                                                     ? 'bg-blue-500/20 text-blue-100 border border-blue-400/30'
                                                     : 'text-gray-300 hover:bg-gray-700/50 hover:text-white border border-transparent'
                                             }`}
                                         >
                                             <div className="flex-shrink-0 p-2 bg-gray-700/50 rounded-lg text-gray-300">
                                                 {item.icon}
                                             </div>
                                             <div className="flex-1 min-w-0">
                                                 <div className="font-medium text-sm">{item.title}</div>
                                                 <div className="text-xs text-gray-400 mt-1">{item.description}</div>
                                             </div>
                                         </button>
                                     ))}
                                 </div>
                             </div>
                        )}

                        {!query && advancedItems.length > 0 && (
                            <div>
                                <h3 className="text-xs font-semibold text-gray-400 mb-3 flex items-center gap-1.5 px-1">
                                    <span className="text-xs">⚡</span> Advanced
                                </h3>
                                <div className="space-y-2">
                                    {advancedItems.map((item, index) => (
                                        <button
                                            key={item.type}
                                            onClick={() => onSelect(item.type)}
                                            className={`w-full flex items-center gap-3 p-3 rounded-lg text-left transition-all duration-150 ${
                                                (index + basicItems.length + 3) === selectedIndex
                                                    ? 'bg-blue-500/20 text-blue-100 border border-blue-400/30'
                                                    : 'text-gray-300 hover:bg-gray-700/50 hover:text-white border border-transparent'
                                            }`}
                                        >
                                            <div className="flex-shrink-0 p-2 bg-gray-700/50 rounded-lg text-gray-300">
                                                {item.icon}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="font-medium text-sm">{item.title}</div>
                                                <div className="text-xs text-gray-400 mt-1">{item.description}</div>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {!query && mediaItems.length > 0 && (
                            <div>
                                <h3 className="text-xs font-semibold text-gray-400 mb-2 flex items-center gap-1.5 px-1">
                                    <span className="text-xs">🎨</span> Media
                                </h3>
                                <div className="space-y-1">
                                    {mediaItems.map((item, index) => (
                                        <button
                                            key={item.type}
                                            onClick={() => onSelect(item.type)}
                                            className={`w-full flex items-center gap-3 p-2.5 rounded-lg text-left transition-all duration-150 ${
                                                (index + basicItems.length + advancedItems.length + 3) === selectedIndex
                                                    ? 'bg-blue-500/20 text-blue-100 border border-blue-400/30'
                                                    : 'text-gray-300 hover:bg-gray-700/50 hover:text-white border border-transparent'
                                            }`}
                                        >
                                            <div className="flex-shrink-0 p-2 bg-gray-700/50 rounded-lg text-gray-300">
                                                {item.icon}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="font-medium text-sm">{item.title}</div>
                                                <div className="text-xs text-gray-400 mt-0.5">{item.description}</div>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {query && (
                            <div className="space-y-1">
                                {filteredItems.map((item, index) => (
                                    <button
                                        key={item.type}
                                        onClick={() => onSelect(item.type)}
                                        className={`w-full flex items-center gap-3 p-2.5 rounded-lg text-left transition-all duration-150 ${
                                            index === selectedIndex
                                                ? 'bg-blue-500/20 text-blue-100 border border-blue-400/30'
                                                : 'text-gray-300 hover:bg-gray-700/50 hover:text-white border border-transparent'
                                        }`}
                                    >
                                        <div className="flex-shrink-0 p-2 bg-gray-700/50 rounded-lg text-gray-300">
                                            {item.icon}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="font-medium text-sm">{item.title}</div>
                                            <div className="text-xs text-gray-400 mt-0.5">{item.description}</div>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* Footer Tip */}
            <div className="p-3 border-t border-gray-700/50 bg-gray-800/30">
                <p className="text-xs text-gray-400 text-center">
                    <span className="font-medium">Tip:</span> Use <kbd className="px-1.5 py-0.5 bg-gray-700 rounded text-xs">↑↓</kbd> to navigate, <kbd className="px-1.5 py-0.5 bg-gray-700 rounded text-xs">Enter</kbd> to select
                </p>
            </div>
        </div>
    );

    // Render in portal to avoid ancestor overflow issues
    return createPortal(menuContent, document.body);
};

export default BlockTypeMenu;