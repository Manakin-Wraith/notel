
import React, { useState, useEffect, useCallback } from 'react';
import Sidebar from './components/Sidebar';
import Editor from './components/Editor';
import type { Page, Block, TableContent, TableRow } from './types';
import CommandPalette from './components/CommandPalette';
import Agenda from './components/Agenda';
import Board from './components/Board';
import CalendarView from './components/CalendarView';
import { ICONS } from './components/icons/icon-constants';

const createBlockId = () => `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

// Some initial data to make the app feel alive
const getInitialPages = (): Page[] => {
    const savedPages = localStorage.getItem('glasstion-pages');
    if (savedPages) {
        try {
            const parsed = JSON.parse(savedPages);
            if (Array.isArray(parsed) && parsed.length > 0) {
              // Robust data sanitization
              return parsed.map((rawPage: any): Page => {
                const p = rawPage || {};

                const sanitizedId = String(p.id || createBlockId());
                const sanitizedTitle = typeof p.title === 'string' ? p.title : 'Untitled';
                const sanitizedIcon = typeof p.icon === 'string' && ICONS.includes(p.icon) ? p.icon : 'document-text';
                const sanitizedParentId = p.parentId !== undefined ? p.parentId : null;
                const sanitizedDueDate = typeof p.dueDate === 'string' ? p.dueDate : null;
                const sanitizedStatus = (['todo', 'in-progress', 'done'] as const).includes(p.status) ? p.status : null;

                let sanitizedContent: Block[];
                if (Array.isArray(p.content)) {
                    sanitizedContent = p.content.map((rawBlock: any): Block => {
                        const b = rawBlock || {};
                        const type = (['paragraph', 'heading1', 'heading2', 'image', 'code', 'todo', 'blockquote', 'bulleted-list-item', 'divider', 'table', 'ai-prompt', 'json-schema', 'ui-component'] as const).includes(b.type) ? b.type : 'paragraph';
                        
                        let content: string | TableContent;
                        if (type === 'table') {
                            let tableRows: TableRow[];
                            // Check for new format (rows) first for robust migration
                            if (Array.isArray(b.content?.rows)) {
                                tableRows = b.content.rows.map((row: any) => ({
                                    id: String(row.id || createBlockId()),
                                    cells: (Array.isArray(row.cells) ? row.cells : []).map((cell: any) => ({
                                        id: String(cell.id || createBlockId()),
                                        content: typeof cell?.content === 'string' ? cell.content : '',
                                    }))
                                }));
                            } else { // Handle old format (cells) or create new structure
                                const oldCells = (Array.isArray(b.content?.cells) ? b.content.cells : [[{ content: '' }]]);
                                tableRows = oldCells.map((row: any) => ({
                                    id: createBlockId(),
                                    cells: (Array.isArray(row) ? row : [{ content: '' }]).map((cell: any) => ({
                                        id: createBlockId(),
                                        content: typeof cell?.content === 'string' ? cell.content : '',
                                    }))
                                }));
                            }

                            content = {
                                hasHeaders: typeof b.content?.hasHeaders === 'boolean' ? b.content.hasHeaders : false,
                                rows: tableRows.length > 0 ? tableRows : [{ id: createBlockId(), cells: [{ id: createBlockId(), content: ''}]}],
                            };
                        } else {
                            content = typeof b.content === 'string' ? b.content : '';
                        }

                        return {
                            id: String(b.id || createBlockId()),
                            type: type,
                            content: content,
                            checked: typeof b.checked === 'boolean' ? b.checked : false,
                        };
                    });
                    if (sanitizedContent.length === 0) {
                        sanitizedContent = [{ id: createBlockId(), type: 'paragraph', content: '', checked: false }];
                    }
                } else if (typeof p.content === 'string') { // Legacy string content migration
                    sanitizedContent = p.content.split('\n').map((line: string) => ({
                        id: createBlockId(),
                        type: 'paragraph',
                        content: line || '',
                        checked: false,
                    }));
                } else {
                    sanitizedContent = [{ id: createBlockId(), type: 'paragraph', content: '', checked: false }];
                }

                return {
                    id: sanitizedId,
                    title: sanitizedTitle,
                    icon: sanitizedIcon,
                    parentId: sanitizedParentId,
                    dueDate: sanitizedDueDate,
                    status: sanitizedStatus,
                    content: sanitizedContent,
                };
              });
            }
        } catch (e) {
            console.error("Failed to parse pages from localStorage", e);
        }
    }
    // Default initial data if localStorage is empty or parsing fails
    return [
        { id: '1', title: 'Welcome to Notel', icon: 'sparkles', parentId: null, 
          content: [
            { id: createBlockId(), type: 'heading1', content: 'Getting Started' },
            { id: createBlockId(), type: 'paragraph', content: 'Here are a few things to get you started. Check them off as you go!' },
            { id: createBlockId(), type: 'todo', content: 'Create a new page using the + button in the sidebar.', checked: false },
            { id: createBlockId(), type: 'todo', content: 'Type `/` on a new line to see all available block commands.', checked: false },
            { id: createBlockId(), type: 'todo', content: 'Drag this item by its handle to reorder the list.', checked: false },
            { id: createBlockId(), type: 'todo', content: 'Add a status or a due date to this page using the buttons below the title.', checked: false },
            { id: createBlockId(), type: 'todo', content: 'Explore the Agenda, Board, and Calendar views using the icons in the sidebar.', checked: false },
            { id: createBlockId(), type: 'paragraph', content: '' },
          ], 
          dueDate: new Date().toISOString(), status: 'in-progress' },
        { id: '3', title: 'Project Ideas', icon: 'light-bulb', parentId: '1', 
          content: [
            { id: createBlockId(), type: 'paragraph', content: '- Build a cool app with React and Tailwind.' },
            { id: createBlockId(), type: 'paragraph', content: '- Learn a new programming language.' }
          ],
          dueDate: null, status: 'todo' },
        { id: '4', title: 'Finish Q2 report', icon: 'chart-bar', parentId: null, 
          content: [{ id: createBlockId(), type: 'paragraph', content: 'Review numbers and finalize the presentation slides.' }], 
          dueDate: new Date(new Date().setDate(new Date().getDate() + 1)).toISOString(), status: 'todo' },
    ];
};


const getRandomIcon = () => ICONS[Math.floor(Math.random() * ICONS.length)];

const App: React.FC = () => {
  const [pages, setPages] = useState<Page[]>(getInitialPages);
  const [activePageId, setActivePageId] = useState<string | null>(() => {
    const initialPages = getInitialPages();
    return initialPages.length > 0 ? initialPages[0].id : null;
  });
  const [isPaletteOpen, setIsPaletteOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'editor' | 'agenda' | 'board' | 'calendar'>('editor');


  // Save to localStorage whenever pages change
  useEffect(() => {
    localStorage.setItem('glasstion-pages', JSON.stringify(pages));
  }, [pages]);

  // Listen for Cmd/Ctrl+K to open command palette
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsPaletteOpen(true);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const handleAddPage = useCallback((initialData?: Partial<Page>, openInEditor = true) => {
    const newPage: Page = {
      id: new Date().toISOString(),
      title: 'Untitled',
      content: [{ id: createBlockId(), type: 'paragraph', content: '' }],
      icon: getRandomIcon(),
      parentId: null,
      dueDate: null,
      status: 'todo',
      ...initialData,
    };
    const newPages = [newPage, ...pages];
    setPages(newPages);
    
    if (openInEditor) {
        setActivePageId(newPage.id);
        setViewMode('editor');
    }

    setIsPaletteOpen(false); // Close palette after action
  }, [pages]);

  const handleDeletePage = (id: string) => {
    setPages(currentPages => {
      const pageToDelete = currentPages.find(p => p.id === id);
      if (!pageToDelete) return currentPages;
      
      const pagesToKeep = currentPages.filter(p => p.id !== id);
      
      // Re-parent any children of the deleted page to the root
      const newPages = pagesToKeep.map(p => {
        if (p.parentId === id) {
          return { ...p, parentId: null };
        }
        return p;
      });

      if (activePageId === id) {
          // if the active page is deleted, select the first page or null
          setActivePageId(newPages.length > 0 ? newPages[0].id : null);
      }
      return newPages;
    });
  };

  const handleSelectPage = useCallback((id: string) => {
    setActivePageId(id);
    setViewMode('editor');
    setIsPaletteOpen(false); // Close palette after action
  }, []);

  const handleUpdatePageContent = (id: string, content: Block[]) => {
    setPages((prevPages) =>
      prevPages.map((p) => (p.id === id ? { ...p, content } : p))
    );
  };
  
  const handleUpdatePageTitle = (id: string, title: string) => {
    setPages((prevPages) =>
      prevPages.map((p) => (p.id === id ? { ...p, title } : p))
    );
  };

  const handleUpdatePageIcon = (id: string, icon: string) => {
    setPages((prevPages) =>
      prevPages.map((p) => (p.id === id ? { ...p, icon } : p))
    );
  };

  const handleUpdatePageDate = (id: string, dueDate: string | null) => {
    setPages((prevPages) =>
      prevPages.map((p) => (p.id === id ? { ...p, dueDate } : p))
    );
  };

  const handleUpdatePageStatus = (id: string, status: 'todo' | 'in-progress' | 'done' | null) => {
    setPages((prevPages) =>
      prevPages.map((p) => (p.id === id ? { ...p, status } : p))
    );
  };

  const handleMovePage = useCallback((draggedId: string, targetId: string, position: 'top' | 'bottom' | 'middle') => {
      setPages(currentPages => {
        // Helper to find all descendants of a page to prevent illegal moves
        const getAllDescendantIds = (pageId: string): Set<string> => {
            const descendantIds = new Set<string>();
            const findChildrenOf = (pId: string) => {
                const children = currentPages.filter(p => p.parentId === pId);
for (const child of children) {
                    descendantIds.add(child.id);
                    findChildrenOf(child.id);
                }
            };
            findChildrenOf(pageId);
            return descendantIds;
        };

        // Prevent dropping a page into itself or one of its descendants
        if (targetId === draggedId || getAllDescendantIds(draggedId).has(targetId)) {
            console.warn("Invalid move: cannot move a page into itself or its own descendant.");
            return currentPages;
        }

        const draggedPage = currentPages.find(p => p.id === draggedId);
        if (!draggedPage) return currentPages;
        
        const pagesWithoutDragged = currentPages.filter(p => p.id !== draggedId);
        const targetIndex = pagesWithoutDragged.findIndex(p => p.id === targetId);
        
        if (targetIndex === -1) {
            console.error("Target page not found in handleMovePage");
            return currentPages; // Should not happen
        }
        
        const targetPage = pagesWithoutDragged[targetIndex];
        const newPages = [...pagesWithoutDragged];

        if (position === 'middle') { // Nesting
          const updatedDraggedPage = { ...draggedPage, parentId: targetId };
          newPages.splice(targetIndex + 1, 0, updatedDraggedPage);
        } else { // Reordering
          const updatedDraggedPage = { ...draggedPage, parentId: targetPage.parentId };
          const insertionIndex = position === 'top' ? targetIndex : targetIndex + 1;
          newPages.splice(insertionIndex, 0, updatedDraggedPage);
        }
        
        return newPages;
      });
  }, []);

  const activePage = pages.find((p) => p.id === activePageId) || null;
  
  const renderView = () => {
    switch (viewMode) {
      case 'editor':
        return (
          <Editor
            page={activePage}
            onUpdateTitle={handleUpdatePageTitle}
            onUpdateContent={handleUpdatePageContent}
            onUpdateIcon={handleUpdatePageIcon}
            onUpdateDate={handleUpdatePageDate}
            onUpdateStatus={handleUpdatePageStatus}
          />
        );
      case 'agenda':
        return <Agenda pages={pages} onSelectPage={handleSelectPage} />;
      case 'board':
        return <Board pages={pages} onUpdateStatus={handleUpdatePageStatus} onSelectPage={handleSelectPage} />;
      case 'calendar':
        return <CalendarView 
          pages={pages} 
          onAddPage={(data) => handleAddPage(data, true)} 
          onDeletePage={handleDeletePage}
          onSelectPage={handleSelectPage} 
          onUpdateDate={handleUpdatePageDate} 
        />;
      default:
        return <Editor page={activePage} onUpdateTitle={handleUpdatePageTitle} onUpdateContent={handleUpdatePageContent} onUpdateIcon={handleUpdatePageIcon} onUpdateDate={handleUpdatePageDate} onUpdateStatus={handleUpdatePageStatus} />;
    }
  };


  return (
    <div className="flex h-screen w-full bg-[#111111] text-gray-200">
      <Sidebar
        pages={pages}
        activePageId={activePageId}
        viewMode={viewMode}
        onSelectPage={handleSelectPage}
        onAddPage={() => handleAddPage()}
        onDeletePage={handleDeletePage}
        onMovePage={handleMovePage}
        onSetViewMode={setViewMode}
      />
      {renderView()}
      {isPaletteOpen && (
        <CommandPalette
          pages={pages}
          onSelectPage={handleSelectPage}
          onAddPage={() => handleAddPage()}
          onClose={() => setIsPaletteOpen(false)}
        />
      )}
    </div>
  );
};

export default App;
