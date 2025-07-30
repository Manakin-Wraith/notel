import React, { useState, useEffect } from 'react';
import type { Page } from '../types';
import { useAuth } from '../contexts/AuthContext';
import PlusIcon from './icons/PlusIcon';
import TrashIcon from './icons/TrashIcon';
import ListBulletIcon from './icons/ListBulletIcon';
import CalendarDaysIcon from './icons/CalendarDaysIcon';
import ViewColumnsIcon from './icons/ViewColumnsIcon';
import Logo from './Logo';
import ChevronRightIcon from './icons/ChevronRightIcon';
import PageIcon from './icons/PageIcon';
import ProfileCard from './ProfileCard';
import MessageCircleIcon from './icons/MessageCircleIcon';

type DropIndicatorPosition = 'top' | 'bottom' | 'middle';
type ViewMode = 'editor' | 'agenda' | 'board' | 'calendar' | 'chat';

interface PageTreeProps {
  pages: Page[];
  allPages: Page[];
  level: number;
  activePageId: string | null;
  viewMode: ViewMode;
  onSelectPage: (id: string) => void;
  onDeletePage: (id: string) => void;
  onMovePage: (draggedId: string, targetId: string, position: DropIndicatorPosition) => void;
  dropIndicator: { pageId: string, position: DropIndicatorPosition } | null;
  setDropIndicator: React.Dispatch<React.SetStateAction<{ pageId: string, position: DropIndicatorPosition } | null>>;
  expandedPages: Set<string>;
  onToggleExpand: (id: string) => void;
}

const PageTree: React.FC<PageTreeProps> = ({
  pages,
  allPages,
  level,
  activePageId,
  viewMode,
  onSelectPage,
  onDeletePage,
  onMovePage,
  dropIndicator,
  setDropIndicator,
  expandedPages,
  onToggleExpand,
}) => {
  const handleDragStart = (e: React.DragEvent, pageId: string) => {
    e.dataTransfer.setData('text/plain', pageId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, pageId: string) => {
    e.preventDefault();
    const draggedId = e.dataTransfer.getData('text/plain');
    if(draggedId === pageId) return;

    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const ratio = (e.clientY - rect.top) / rect.height;

    let position: DropIndicatorPosition;
    if (ratio < 0.25) {
      position = 'top';
    } else if (ratio > 0.75) {
      position = 'bottom';
    } else {
      position = 'middle';
    }
    setDropIndicator({ pageId, position });
  };
  
  const handleDrop = (e: React.DragEvent, targetPageId: string) => {
    e.preventDefault();
    if (!dropIndicator) return;
    const draggedId = e.dataTransfer.getData('text/plain');
    if (draggedId && draggedId !== targetPageId) {
      onMovePage(draggedId, targetPageId, dropIndicator.position);
    }
    setDropIndicator(null);
  };
  
  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation(); // Prevent page selection when deleting
    onDeletePage(id);
  };
  
  return (
    <ul style={{ paddingLeft: level > 0 ? '1rem' : 0 }}>
      {pages.map(page => {
        const children = allPages.filter(p => p.parentId === page.id);
        const isExpanded = expandedPages.has(page.id);
        return (
          <li
            key={page.id}
            onDragOver={(e) => handleDragOver(e, page.id)}
            onDrop={(e) => handleDrop(e, page.id)}
            onDragLeave={() => setDropIndicator(null)}
          >
            <div className="relative group">
                {dropIndicator && dropIndicator.pageId === page.id && dropIndicator.position === 'top' && <div className="absolute -top-0.5 left-0 w-full h-0.5 bg-purple-500 rounded-full z-10" />}
                
                {children.length > 0 && (
                    <button
                        onClick={(e) => { e.stopPropagation(); onToggleExpand(page.id); }}
                        className="absolute left-0 top-0 h-full w-8 flex items-center justify-center text-gray-500 hover:text-gray-200"
                        aria-label={isExpanded ? "Collapse" : "Expand"}
                    >
                        <ChevronRightIcon className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                    </button>
                )}

                <button
                    onClick={() => onSelectPage(page.id)}
                    draggable
                    onDragStart={(e) => handleDragStart(e, page.id)}
                    className={`w-full flex items-center text-left py-2 pl-8 pr-2 rounded-md transition-colors text-gray-300 ${
                        activePageId === page.id && viewMode === 'editor' ? 'bg-white/10' : 'hover:bg-white/5'
                    } ${dropIndicator && dropIndicator.pageId === page.id && dropIndicator.position === 'middle' ? 'bg-purple-500/20' : ''}`}
                >
                    <PageIcon icon={page.icon} className="w-5 h-5 mr-3 text-gray-400 flex-shrink-0" />
                    <span className="flex-1 truncate">{page.title || 'Untitled'}</span>
                    <div
                        onClick={(e) => handleDelete(e, page.id)}
                        className="ml-2 text-gray-500 opacity-0 group-hover:opacity-100 hover:text-red-400 transition-opacity"
                        aria-label="Delete page"
                    >
                        <TrashIcon className="w-4 h-4" />
                    </div>
                </button>
                {dropIndicator && dropIndicator.pageId === page.id && dropIndicator.position === 'bottom' && <div className="absolute -bottom-0.5 left-0 w-full h-0.5 bg-purple-500 rounded-full z-10" />}
            </div>
            
            {isExpanded && children.length > 0 && (
              <PageTree
                pages={children}
                allPages={allPages}
                level={level + 1}
                activePageId={activePageId}
                viewMode={viewMode}
                onSelectPage={onSelectPage}
                onDeletePage={onDeletePage}
                onMovePage={onMovePage}
                dropIndicator={dropIndicator}
                setDropIndicator={setDropIndicator}
                expandedPages={expandedPages}
                onToggleExpand={onToggleExpand}
              />
            )}
          </li>
        )
      })}
    </ul>
  )
};

const findAncestors = (pageId: string | null, allPages: Page[]): Set<string> => {
    if (!pageId) return new Set();
    const ancestors = new Set<string>();
    const pageMap = new Map(allPages.map(p => [p.id, p]));
    let currentId: string | null = pageId;
    while (currentId) {
        const page = pageMap.get(currentId);
        if (page?.parentId) {
            ancestors.add(page.parentId);
            currentId = page.parentId;
        } else {
            currentId = null;
        }
    }
    return ancestors;
};

interface SidebarProps {
  pages: Page[];
  activePageId: string | null;
  viewMode: ViewMode;
  onSelectPage: (id: string) => void;
  onAddPage: () => void;
  onDeletePage: (id: string) => void;
  onMovePage: (draggedId: string, targetId: string, position: DropIndicatorPosition) => void;
  onSetViewMode: (mode: ViewMode) => void;
  onOpenSettings: () => void;
  onOpenProfile: () => void;
  id?: string;
  isMobile?: boolean;
  isOpen?: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({
  pages,
  activePageId,
  viewMode,
  onSelectPage,
  onAddPage,
  onDeletePage,
  onMovePage,
  onSetViewMode,
  onOpenSettings,
  onOpenProfile,
  id,
  isMobile = false,
  isOpen = true
}) => {
  const { user, profile, signOut } = useAuth();
  const [isMac, setIsMac] = useState(false);
  const [dropIndicator, setDropIndicator] = useState<{ pageId: string, position: DropIndicatorPosition } | null>(null);
  const [expandedPages, setExpandedPages] = useState<Set<string>>(() => findAncestors(activePageId, pages));
  
  useEffect(() => {
    setIsMac(navigator.platform.toUpperCase().indexOf('MAC') >= 0);
  }, []);
  
  useEffect(() => {
    if (activePageId) {
      const ancestors = findAncestors(activePageId, pages);
      // Automatically expand ancestors of the active page
      setExpandedPages(prev => new Set([...prev, ...ancestors]));
    }
  }, [activePageId, pages]);

  const handleToggleExpand = (pageId: string) => {
    setExpandedPages(currentExpanded => {
      const newExpanded = new Set(currentExpanded);
      if (newExpanded.has(pageId)) {
        newExpanded.delete(pageId);
      } else {
        newExpanded.add(pageId);
      }
      return newExpanded;
    });
  };

  const rootPages = pages.filter(p => p.parentId === null);

  const handleViewChange = (mode: ViewMode) => {
    if (viewMode === mode) {
      onSetViewMode('editor');
    } else {
      onSetViewMode(mode);
    }
  };

  return (
    <aside 
      id={id}
      className={`fixed left-0 top-0 w-80 h-screen p-4 flex flex-col bg-black/30 backdrop-blur-xl border-r border-white/10 shrink-0 z-40 transition-transform duration-300 ease-in-out ${isMobile ? 'min-w-80' : ''} ${isMobile && !isOpen ? '-translate-x-full' : 'translate-x-0'}`}
    >
      <div className="flex items-center justify-between mb-6 px-1">
        <Logo size="medium" showText={true} />
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleViewChange('agenda')}
            className={`p-1.5 rounded-md transition-colors ${
              viewMode === 'agenda'
                ? 'bg-white/10 text-white'
                : 'text-gray-400 hover:text-white hover:bg-white/10'
            }`}
            aria-label={viewMode === 'agenda' ? 'Back to Editor' : 'Open Agenda'}
          >
            <ListBulletIcon className="w-5 h-5" />
          </button>
           <button
            onClick={() => handleViewChange('board')}
            className={`p-1.5 rounded-md transition-colors ${
              viewMode === 'board'
                ? 'bg-white/10 text-white'
                : 'text-gray-400 hover:text-white hover:bg-white/10'
            }`}
            aria-label={viewMode === 'board' ? 'Back to Editor' : 'Open Board View'}
          >
            <ViewColumnsIcon className="w-5 h-5" />
          </button>
           <button
            onClick={() => handleViewChange('calendar')}
            className={`p-1.5 rounded-md transition-colors ${
              viewMode === 'calendar'
                ? 'bg-white/10 text-white'
                : 'text-gray-400 hover:text-white hover:bg-white/10'
            }`}
            aria-label={viewMode === 'calendar' ? 'Back to Editor' : 'Open Calendar View'}
          >
            <CalendarDaysIcon className="w-5 h-5" />
          </button>
           <button
            onClick={() => handleViewChange('chat')}
            className={`p-1.5 rounded-md transition-colors ${
              viewMode === 'chat'
                ? 'bg-white/10 text-white'
                : 'text-gray-400 hover:text-white hover:bg-white/10'
            }`}
            aria-label={viewMode === 'chat' ? 'Back to Editor' : 'Open Chat'}
          >
            <MessageCircleIcon className="w-5 h-5" />
          </button>
          <button
            onClick={onAddPage}
            className="p-1.5 text-gray-400 hover:text-white hover:bg-white/10 rounded-md transition-colors"
            aria-label="Add new page"
          >
            <PlusIcon className="w-5 h-5" />
          </button>
        </div>
      </div>
      <nav 
        onDragLeave={() => setDropIndicator(null)}
        className="flex-1 overflow-y-auto pr-2 -mr-2 space-y-1"
      >
        <PageTree
          pages={rootPages}
          allPages={pages}
          level={0}
          activePageId={activePageId}
          viewMode={viewMode}
          onSelectPage={onSelectPage}
          onDeletePage={onDeletePage}
          onMovePage={onMovePage}
          dropIndicator={dropIndicator}
          setDropIndicator={setDropIndicator}
          expandedPages={expandedPages}
          onToggleExpand={handleToggleExpand}
        />
      </nav>
      
      {/* Profile Section */}
      <div className="mt-4 mb-4">
        <ProfileCard
          profile={profile}
          userEmail={user?.email || null}
          onClick={onOpenProfile}
          className="mb-3"
        />
      </div>
      
      {/* Settings and Sign Out Buttons */}
      <div className="mb-4 space-y-2">
        {/* Settings Button */}
        <button
          onClick={onOpenSettings}
          className="w-full flex items-center justify-center px-3 py-2 text-sm text-gray-400 hover:text-white hover:bg-white/10 rounded-md transition-colors"
        >
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          Settings
        </button>
        
        {/* Sign Out Button */}
        <button
          onClick={signOut}
          className="w-full flex items-center justify-center px-3 py-2 text-sm text-gray-400 hover:text-white hover:bg-white/10 rounded-md transition-colors"
        >
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          Sign Out
        </button>
      </div>
      
      <div className="pt-4 border-t border-white/10 text-center text-xs text-gray-500 space-y-2">
        <div className="flex items-center justify-center mb-2">
          <Logo size="small" />
        </div>
        <p>
          Press{' '}
          <kbd className="font-sans text-xs bg-black/30 border border-white/20 rounded p-0.5 px-1.5">
            {isMac ? '⌘' : 'Ctrl'}
          </kbd>{' '}
          +{' '}
          <kbd className="font-sans text-xs bg-black/30 border border-white/20 rounded p-0.5 px-1.5">
            K
          </kbd>{' '}
          to search
        </p>
      </div>
    </aside>
  );
};

export default Sidebar;