
import React, { useState, useEffect, useCallback } from 'react';
import Sidebar from './components/Sidebar';
import Editor from './components/Editor';
import Auth from './components/Auth';
import type { Page, Block, TableContent, TableRow } from './types';
import CommandPalette from './components/CommandPalette';
import Agenda from './components/Agenda';
import Board from './components/Board';
import CalendarView from './components/CalendarView';
import { ICONS } from './components/icons/icon-constants';
import HamburgerIcon from './components/icons/HamburgerIcon';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { DatabaseService } from './lib/database';
import { ProductionDebug } from './lib/production-debug';
import ProductionErrorBoundary from './components/ProductionErrorBoundary';

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
                // Allow both predefined icons and emoji characters
                const sanitizedIcon = typeof p.icon === 'string' && p.icon.length > 0 ? p.icon : 'document-text';
                const sanitizedParentId = p.parentId !== undefined ? p.parentId : null;
                const sanitizedPosition = typeof p.position === 'number' ? p.position : 0;
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
                    position: sanitizedPosition,
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
        { id: '1', title: 'Welcome to Notel', icon: 'sparkles', parentId: null, position: 0,
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
        { id: '3', title: 'Project Ideas', icon: 'light-bulb', parentId: '1', position: 0,
          content: [
            { id: createBlockId(), type: 'paragraph', content: '- Build a cool app with React and Tailwind.' },
            { id: createBlockId(), type: 'paragraph', content: '- Learn a new programming language.' }
          ],
          dueDate: null, status: 'todo' },
        { id: '4', title: 'Finish Q2 report', icon: 'chart-bar', parentId: null, position: 1,
          content: [{ id: createBlockId(), type: 'paragraph', content: 'Review numbers and finalize the presentation slides.' }], 
          dueDate: new Date(new Date().setDate(new Date().getDate() + 1)).toISOString(), status: 'todo' },
    ];
};


const getRandomIcon = () => ICONS[Math.floor(Math.random() * ICONS.length)];

const AppContent: React.FC = () => {
  const { user, loading: authLoading, signOut } = useAuth();
  const [pages, setPages] = useState<Page[]>([]);
  const [activePageId, setActivePageId] = useState<string | null>(null);
  const [isPaletteOpen, setIsPaletteOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'editor' | 'agenda' | 'board' | 'calendar'>('editor');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);


  // Load data from Supabase when user is authenticated
  useEffect(() => {
    const loadData = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const supabasePages = await DatabaseService.getPages();
        
        // Always prioritize database data over localStorage
        if (supabasePages.length === 0) {
          // Try to migrate localStorage data only if no database data exists
          const localPages = getInitialPages();
          if (localPages.length > 0) {
            setSyncing(true);
            ProductionDebug.logStateSync('localStorage migration', { pageCount: localPages.length });
            await DatabaseService.syncLocalData();
            const migratedPages = await DatabaseService.getPages();
            setPages(migratedPages);
            setSyncing(false);
          } else {
            setPages([]);
          }
        } else {
          // Database has data - use it and clear localStorage to prevent conflicts
          console.log('Loading pages from database with positions preserved');
          setPages(supabasePages);
          // Clear localStorage to prevent it from overriding database order
          localStorage.removeItem('glasstion-pages');
        }
      } catch (error) {
        console.error('Failed to load data:', error);
        // Fallback to localStorage
        setPages(getInitialPages());
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [user]);

  // Save to Supabase whenever pages change (if user is authenticated)
  useEffect(() => {
    if (!user || loading || pages.length === 0) return;
    
    const saveToSupabase = async () => {
      try {
        setSyncing(true);
        
        // Only save to localStorage if user is NOT authenticated
        // When authenticated, database is the source of truth
        if (!user) {
          localStorage.setItem('glasstion-pages', JSON.stringify(pages));
          console.log('Data synced to local storage (offline mode)');
        } else {
          console.log('Skipping localStorage sync - using database persistence');
        }
      } catch (error) {
        console.error('Sync error:', error);
      } finally {
        setSyncing(false);
      }
    };
    
    // Debounce the save operation
    const timeoutId = setTimeout(saveToSupabase, 1000);
    return () => clearTimeout(timeoutId);
  }, [pages, user, loading]);

  // Listen for Cmd/Ctrl+K to open command palette
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsPaletteOpen(true);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Handle mobile detection and sidebar behavior
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (!mobile) {
        setIsSidebarOpen(false); // Auto-close sidebar on desktop
      }
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Close sidebar when clicking outside on mobile
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (isMobile && isSidebarOpen) {
        const sidebar = document.getElementById('mobile-sidebar');
        const hamburger = document.getElementById('hamburger-button');
        if (sidebar && !sidebar.contains(e.target as Node) && 
            hamburger && !hamburger.contains(e.target as Node)) {
          setIsSidebarOpen(false);
        }
      }
    };

    if (isMobile && isSidebarOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isMobile, isSidebarOpen]);

  const handleAddPage = useCallback(async (initialData?: Partial<Page>, openInEditor = true) => {
    const newPage: Page = {
      id: createBlockId(),
      title: initialData?.title || 'Untitled',
      icon: initialData?.icon || getRandomIcon(),
      parentId: initialData?.parentId || null,
      position: initialData?.position || 0,
      dueDate: initialData?.dueDate || null,
      status: initialData?.status || null,
      content: initialData?.content || [{ id: createBlockId(), type: 'paragraph', content: '', checked: false }],
    };

    if (user) {
      try {
        await DatabaseService.createPage(newPage);
        setPages(prev => [...prev, newPage]);
      } catch (error) {
        console.error('Failed to create page:', error);
        setPages(prev => [...prev, newPage]);
      }
    } else {
      setPages(prev => [...prev, newPage]);
    }

    if (openInEditor) {
      setActivePageId(newPage.id);
      setViewMode('editor');
    }
  }, [user]);

  const handleDeletePage = useCallback(async (pageId: string) => {
    if (user) {
      try {
        await DatabaseService.deletePage(pageId);
      } catch (error) {
        console.error('Failed to delete page:', error);
      }
    }

    setPages(prev => prev.filter(p => p.id !== pageId));
    if (activePageId === pageId) {
      setActivePageId(null);
    }
  }, [activePageId, user]);

  const handleUpdatePageTitle = useCallback(async (pageId: string, title: string) => {
    setPages(prev => {
      const updatedPages = prev.map(p => p.id === pageId ? { ...p, title } : p);
      const updatedPage = updatedPages.find(p => p.id === pageId);
      
      if (user && updatedPage) {
        DatabaseService.updatePage(updatedPage).catch(error => {
          console.error('Failed to update page title:', error);
        });
      }
      
      return updatedPages;
    });
  }, [user]);

  const handleUpdatePageContent = useCallback(async (pageId: string, content: Block[]) => {
    setPages(prev => {
      const updatedPages = prev.map(p => p.id === pageId ? { ...p, content } : p);
      const updatedPage = updatedPages.find(p => p.id === pageId);
      
      if (user && updatedPage) {
        DatabaseService.updatePage(updatedPage).catch(error => {
          console.error('Failed to update page content:', error);
        });
      }
      
      return updatedPages;
    });
  }, [user]);

  const handleUpdatePageIcon = useCallback(async (pageId: string, icon: string) => {
    setPages(prev => {
      const updatedPages = prev.map(p => p.id === pageId ? { ...p, icon } : p);
      const updatedPage = updatedPages.find(p => p.id === pageId);
      
      if (user && updatedPage) {
        DatabaseService.updatePage(updatedPage).catch(error => {
          console.error('Failed to update page icon:', error);
        });
      }
      
      return updatedPages;
    });
  }, [user]);

  const handleUpdatePageDate = useCallback(async (pageId: string, dueDate: string | null) => {
    setPages(prev => {
      const updatedPages = prev.map(p => p.id === pageId ? { ...p, dueDate } : p);
      const updatedPage = updatedPages.find(p => p.id === pageId);
      
      if (user && updatedPage) {
        DatabaseService.updatePage(updatedPage).catch(error => {
          console.error('Failed to update page date:', error);
        });
      }
      
      return updatedPages;
    });
  }, [user]);

  const handleUpdatePageStatus = useCallback(async (pageId: string, status: 'todo' | 'in-progress' | 'done' | null) => {
    setPages(prev => {
      const updatedPages = prev.map(p => p.id === pageId ? { ...p, status } : p);
      const updatedPage = updatedPages.find(p => p.id === pageId);
      
      if (user && updatedPage) {
        DatabaseService.updatePage(updatedPage).catch(error => {
          console.error('Failed to update page status:', error);
        });
      }
      
      return updatedPages;
    });
  }, [user]);

  const handleMovePage = useCallback(async (draggedId: string, targetId: string, position: 'top' | 'bottom' | 'middle') => {
    // First, update local state immediately and capture the new state for database sync
    let updatedPagesForSync: Page[] = [];
    
    setPages(currentPages => {
      const getAllDescendantIds = (pageId: string): Set<string> => {
        const descendantIds = new Set<string>();
        const findChildrenOf = (pId: string) => {
          const children = currentPages.filter(p => p.parentId === pId);
          children.forEach(child => {
            descendantIds.add(child.id);
            findChildrenOf(child.id);
          });
        };
        findChildrenOf(pageId);
        return descendantIds;
      };

      if (targetId === draggedId || getAllDescendantIds(draggedId).has(targetId)) {
        return currentPages;
      }

      const draggedPage = currentPages.find(p => p.id === draggedId);
      const otherPages = currentPages.filter(p => p.id !== draggedId);

      if (!draggedPage) return currentPages;

      let newPages: Page[];

      if (position === 'middle') {
        newPages = [...otherPages, { ...draggedPage, parentId: targetId }];
      } else {
        const targetPage = currentPages.find(p => p.id === targetId);
        newPages = [...otherPages, { ...draggedPage, parentId: targetPage?.parentId || null }];
      }

      // Calculate positions for all pages and store for database sync
      const pagesByParent = new Map<string | null, Page[]>();
      newPages.forEach(page => {
        const parentKey = page.parentId;
        if (!pagesByParent.has(parentKey)) {
          pagesByParent.set(parentKey, []);
        }
        pagesByParent.get(parentKey)!.push(page);
      });
      
      // Assign position values within each parent group
      updatedPagesForSync = newPages.map(page => {
        const siblings = pagesByParent.get(page.parentId) || [];
        const newPosition = siblings.indexOf(page);
        return { ...page, position: newPosition };
      });

      return updatedPagesForSync;
    });

    // Then, sync to database with proper position values for persistence
    if (user && updatedPagesForSync.length > 0) {
      try {
        // Find the dragged page and update it in the database
        const draggedPage = updatedPagesForSync.find(p => p.id === draggedId);
        if (draggedPage) {
          console.log('Saving page position:', { id: draggedPage.id, parentId: draggedPage.parentId, position: draggedPage.position });
          await DatabaseService.updatePage(draggedPage);
          
          // Also update any other pages in the same parent group to ensure consistent ordering
          const affectedPages = updatedPagesForSync.filter(p => 
            p.parentId === draggedPage.parentId && p.id !== draggedPage.id
          );
          
          for (const page of affectedPages) {
            try {
              await DatabaseService.updatePage(page);
            } catch (error) {
              console.warn('Failed to update sibling page position:', page.id, error);
            }
          }
        }
      } catch (error) {
        console.warn('Cross-device sync failed for page reorder:', error);
      }
    }
  }, [user]);

  const handleSelectPage = useCallback((id: string) => {
    setActivePageId(id);
    setViewMode('editor');
    setIsPaletteOpen(false);
  }, []);

  const activePage = pages.find(p => p.id === activePageId) || null;

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
        return (
          <CalendarView
            pages={pages}
            onAddPage={(data) => handleAddPage(data, true)}
            onDeletePage={handleDeletePage}
            onSelectPage={handleSelectPage}
            onUpdateDate={handleUpdatePageDate}
          />
        );
      default:
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
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#111111]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <p className="text-gray-400">
            {authLoading ? 'Authenticating...' : syncing ? 'Syncing your data...' : 'Loading...'}
          </p>
        </div>
      </div>
    );
  }

  // Show auth screen if user is not authenticated
  if (!user) {
    return <Auth />;
  }

  return (
    <div className="flex h-screen w-full bg-[#111111] text-gray-200 relative">
      {/* Mobile hamburger button */}
      {isMobile && (
        <button
          id="hamburger-button"
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="fixed top-4 left-4 z-50 p-2 bg-black/50 backdrop-blur-xl border border-white/10 rounded-lg text-gray-200 hover:bg-white/10 transition-colors md:hidden"
          aria-label="Toggle sidebar"
        >
          <HamburgerIcon className="w-5 h-5" />
        </button>
      )}

      {/* Sign out button */}
      <button
        onClick={signOut}
        className="fixed top-4 right-4 z-50 p-2 bg-black/50 backdrop-blur-xl border border-white/10 rounded-lg text-gray-200 hover:bg-white/10 transition-colors text-sm"
        title="Sign out"
      >
        Sign Out
      </button>

      {/* Mobile overlay */}
      {isMobile && isSidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-30 md:hidden" />
      )}

      {/* Sidebar */}
      <div className={`
        ${isMobile ? 'fixed' : 'relative'}
        ${isMobile && !isSidebarOpen ? '-translate-x-full' : 'translate-x-0'}
        transition-transform duration-300 ease-in-out
        ${isMobile ? 'z-40' : 'z-0'}
        h-screen
      `}>
        <Sidebar
          id={isMobile ? 'mobile-sidebar' : undefined}
          pages={pages}
          activePageId={activePageId}
          viewMode={viewMode}
          onSelectPage={(id) => {
            handleSelectPage(id);
            if (isMobile) setIsSidebarOpen(false);
          }}
          onAddPage={() => {
            handleAddPage();
            if (isMobile) setIsSidebarOpen(false);
          }}
          onDeletePage={handleDeletePage}
          onMovePage={handleMovePage}
          onSetViewMode={(mode) => {
            setViewMode(mode);
            if (isMobile) setIsSidebarOpen(false);
          }}
          isMobile={isMobile}
        />
      </div>

      {/* Main content */}
      <div className={`flex-1 ${isMobile ? 'w-full' : ''}`}>
        {renderView()}
      </div>

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

const App: React.FC = () => {
  return (
    <ProductionErrorBoundary>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ProductionErrorBoundary>
  );
};

export default App;
