

import React, { useState, useEffect, useRef, useMemo } from 'react';
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
}

const MENU_ITEMS: { type: Block['type'], title: string, description: string, icon: React.ReactNode }[] = [
    { type: 'paragraph', title: 'Text', description: 'Just a plain paragraph of text.', icon: <TextIcon className="w-10 h-10" /> },
    { type: 'heading1', title: 'Heading 1', description: 'A big, section heading.', icon: <HeadingIcon className="w-10 h-10" /> },
    { type: 'heading2', title: 'Heading 2', description: 'A medium-sized heading.', icon: <Heading2Icon className="w-10 h-10" /> },
    { type: 'bulleted-list-item', title: 'Bulleted list', description: 'Create a simple list.', icon: <ListBulletIcon className="w-10 h-10" /> },
    { type: 'todo', title: 'To-do list', description: 'Track tasks with a checklist.', icon: <CheckSquareIcon className="w-10 h-10" /> },
    { type: 'blockquote', title: 'Blockquote', description: 'Capture a quote.', icon: <BlockquoteIcon className="w-10 h-10" /> },
    { type: 'table', title: 'Table', description: 'Create a simple grid.', icon: <TableCellsIcon className="w-10 h-10" /> },
    { type: 'divider', title: 'Divider', description: 'Visually separate blocks.', icon: <MinusIcon className="w-10 h-10" /> },
    { type: 'image', title: 'Image', description: 'Upload an image from your device.', icon: <PhotoIcon className="w-10 h-10" /> },
    { type: 'code', title: 'Code Block', description: 'Capture a snippet of code.', icon: <CodeBracketIcon className="w-10 h-10" /> },
    { type: 'ai-prompt', title: 'AI Prompt', description: 'A prompt for an AI model.', icon: <SparklesIcon className="w-10 h-10" /> },
    { type: 'json-schema', title: 'JSON Schema', description: 'Define structured JSON data.', icon: <JsonIcon className="w-10 h-10" /> },
    { type: 'ui-component', title: 'UI Component', description: 'Render a UI component.', icon: <ComponentIcon className="w-10 h-10" /> },
];

const BlockTypeMenu: React.FC<BlockTypeMenuProps> = ({ onSelect, onClose }) => {
    const [query, setQuery] = useState('');
    const [selectedIndex, setSelectedIndex] = useState(0);
    const ref = useRef<HTMLDivElement>(null);

    const filteredItems = useMemo(() => {
        if (!query) return MENU_ITEMS;
        return MENU_ITEMS.filter(item => item.title.toLowerCase().includes(query.toLowerCase()));
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
            className="absolute z-20 top-full mt-2 w-80 bg-black/60 backdrop-blur-2xl border border-white/10 rounded-lg shadow-xl p-2"
        >
            <div className="px-2 pb-2 text-xs text-gray-400">
                <p className="font-semibold">BLOCKS</p>
            </div>
            <ul className="space-y-1">
                {filteredItems.length > 0 ? filteredItems.map((item, index) => (
                    <li key={item.type}>
                        <button
                            onMouseDown={(e) => {
                                e.preventDefault();
                                onSelect(item.type);
                            }}
                            onMouseMove={() => setSelectedIndex(index)}
                            className={`w-full flex items-center text-left p-2 rounded-md transition-colors ${selectedIndex === index ? 'bg-white/10' : 'hover:bg-white/5'}`}
                        >
                            <div className="w-12 h-12 flex items-center justify-center mr-3 border border-white/10 rounded-md text-gray-400">
                                {item.icon}
                            </div>
                            <div>
                                <p className="font-semibold text-gray-200">{item.title}</p>
                                <p className="text-xs text-gray-400">{item.description}</p>
                            </div>
                        </button>
                    </li>
                )) : (
                    <li className="text-center text-gray-500 p-4">No results</li>
                )}
            </ul>
        </div>
    );
};

export default BlockTypeMenu;