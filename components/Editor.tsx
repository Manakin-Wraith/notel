


import React, { useState, useEffect, useRef, useLayoutEffect, useMemo, useTransition } from 'react';
import type { Page, Block, TableContent, TableRow } from '../types';
import DatePicker from './DatePicker';
import StatusPicker from './StatusPicker';
import CalendarIcon from './icons/CalendarIcon';
import XIcon from './icons/XIcon';
import StatusCircleIcon from './icons/StatusCircleIcon';
import EmojiPicker from './EmojiPicker';
import PageIcon from './icons/PageIcon';
import DocumentTextIcon from './icons/DocumentTextIcon';
import CircleIcon from './icons/CircleIcon';
import InProgressIcon from './icons/InProgressIcon';
import CheckCircleIcon from './icons/CheckCircleIcon';
import BlockTypeMenu from './BlockTypeMenu';
import PhotoIcon from './icons/PhotoIcon';
import TrashIcon from './icons/TrashIcon';
import DragHandleIcon from './icons/DragHandleIcon';
import PlusIcon from './icons/PlusIcon';
import MagicIcon from './icons/MagicIcon';
import ComponentPreview from './ComponentPreview';

interface EditorProps {
  page: Page | null;
  onUpdateTitle: (id: string, title: string) => void;
  onUpdateContent: (id: string, content: Block[]) => void;
  onUpdateIcon: (id: string, icon: string) => void;
  onUpdateDate: (id: string, date: string | null) => void;
  onUpdateStatus: (id: string, status: 'todo' | 'in-progress' | 'done' | null) => void;
}

const createBlockId = () => `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

const statusDisplay: { [key in 'todo' | 'in-progress' | 'done']: { text: string; icon: React.ReactNode } } = {
  'todo': { text: 'To Do', icon: <CircleIcon className="w-4 h-4 text-gray-500" /> },
  'in-progress': { text: 'In Progress', icon: <InProgressIcon className="w-4 h-4 text-yellow-400" /> },
  'done': { text: 'Done', icon: <CheckCircleIcon className="w-4 h-4 text-green-500" /> },
};

const Editor: React.FC<EditorProps> = ({ page, onUpdateTitle, onUpdateContent, onUpdateIcon, onUpdateDate, onUpdateStatus }) => {
  const [title, setTitle] = useState('');
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [currentIcon, setCurrentIcon] = useState('document-text');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showStatusPicker, setShowStatusPicker] = useState(false);
  const [menuState, setMenuState] = useState<{ open: boolean, blockId: string | null }>({ open: false, blockId: null });
  const [blockToFocus, setBlockToFocus] = useState<{ id: string, position: 'start' | 'end' } | null>(null);
  const [draggedBlockId, setDraggedBlockId] = useState<string | null>(null);
  const [dropIndicator, setDropIndicator] = useState<{ blockId: string, position: 'before' | 'after' } | null>(null);
  const [hoveredTablePos, setHoveredTablePos] = useState<{ row: number | null; col: number | null }>({ row: null, col: null });
  const [isPending, startTransition] = useTransition();


  const lastPageId = useRef<string | null>(null);
  const editorRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const uploadingBlockId = useRef<string | null>(null);
  const blockContentOnFocus = useRef<Record<string, string>>({});
  const typeChangeInProgress = useRef(false);

  // When a transition completes, reset the flag that prevents onBlur from firing.
  // This is the key to fixing the race condition when changing block types.
  useEffect(() => {
    if (!isPending) {
      typeChangeInProgress.current = false;
    }
  }, [isPending]);


  // Load page data into local state when page changes
  useEffect(() => {
    if (page && page.id !== lastPageId.current) {
      setTitle(page.title);
      setBlocks(page.content);
      setCurrentIcon(page.icon);
      lastPageId.current = page.id;
      setMenuState({ open: false, blockId: null });
    } else if (!page) {
      lastPageId.current = null;
    }
  }, [page]);

  // Debounced saving for page title
  useEffect(() => {
    if (!page || title === page.title) return;
    
    const handler = setTimeout(() => {
        onUpdateTitle(page.id, title);
    }, 500);
    return () => clearTimeout(handler);
  }, [title, page, onUpdateTitle]);

  // Debounced saving for page content (blocks)
  useEffect(() => {
    if (!page || JSON.stringify(blocks) === JSON.stringify(page.content)) return;

    const handler = setTimeout(() => {
        onUpdateContent(page.id, blocks);
    }, 500);
    return () => clearTimeout(handler);
  }, [blocks, page, onUpdateContent]);

  // Effect to handle focusing blocks programmatically
  useLayoutEffect(() => {
    if (!blockToFocus) return;

    const el = editorRef.current?.querySelector(`[data-cell-id="${blockToFocus.id}"]`) || 
               editorRef.current?.querySelector(`[data-block-id="${blockToFocus.id}"]`);

    if (el) {
        const elementToFocus = el as HTMLElement;
        elementToFocus.focus();

        const selection = window.getSelection();
        if (selection) {
            const range = document.createRange();
            range.selectNodeContents(elementToFocus);
            range.collapse(blockToFocus.position === 'start');
            selection.removeAllRanges();
            selection.addRange(range);
        }
    }
    setBlockToFocus(null); // Reset after focusing
  }, [blockToFocus]);

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTitle(e.target.value);
  };
  
  const handleBlockBlur = (blockId: string, element: HTMLElement) => {
    if (typeChangeInProgress.current) {
      // The type is changing, so the block might be unmounted.
      // We don't want to save potentially stale content that could corrupt the state.
      delete blockContentOnFocus.current[blockId];
      return;
    }

    const newContent = element.innerHTML;
    const originalContent = blockContentOnFocus.current[blockId];

    if (newContent !== originalContent) {
        setBlocks(currentBlocks => 
          currentBlocks.map(b => {
            if (b.id === blockId) {
                // To be extra safe, only update content if the block's content is a string.
                // This prevents race conditions from overwriting object-based content (like tables).
                if (typeof b.content === 'string') {
                    return { ...b, content: newContent };
                }
            }
            return b;
          })
        );
    }
    delete blockContentOnFocus.current[blockId];
  };

  const handleTableCellBlur = (blockId: string, rowIndex: number, colIndex: number, newContent: string) => {
    setBlocks(currentBlocks => {
      return currentBlocks.map(b => {
        if (b.id === blockId && b.type === 'table') {
          const tableContent = b.content as TableContent;
          const newRows = tableContent.rows.map((row, rIdx) => {
            if (rIdx !== rowIndex) return row;
            const newCells = row.cells.map((cell, cIdx) => {
              if (cIdx !== colIndex) return cell;
              return { ...cell, content: newContent };
            });
            return { ...row, cells: newCells };
          });
          return { ...b, content: { ...tableContent, rows: newRows } };
        }
        return b;
      });
    });
  };
  
  const handleDeleteBlock = (blockId: string) => {
    setBlocks(currentBlocks => {
      if (currentBlocks.length <= 1) {
        // If it's the last block, clear its content instead of removing it
        return [{ id: createBlockId(), type: 'paragraph', content: '' }];
      }
      return currentBlocks.filter(b => b.id !== blockId);
    });
  };

  const handleToggleTodo = (blockId: string) => {
    const block = blocks.find(b => b.id === blockId);
    // Only proceed if the block exists and is being checked (not unchecked)
    if (block && !block.checked) {
      // 1. Visually mark as complete immediately
      setBlocks(currentBlocks => 
        currentBlocks.map(b => 
          b.id === blockId ? { ...b, checked: true } : b
        )
      );

      // 2. Schedule deletion after a short delay for visual feedback
      setTimeout(() => {
        setBlocks(currentBlocks => {
          // If this is the last block on the page, replace it with an empty paragraph
          if (currentBlocks.length === 1 && currentBlocks[0].id === blockId) {
            return [{ id: createBlockId(), type: 'paragraph', content: '' }];
          }
          // Otherwise, just filter out the block
          return currentBlocks.filter(b => b.id !== blockId);
        });
      }, 500);
    }
  };

  const updateBlockContent = (blockId: string, newContent: string) => {
    const newBlocks = blocks.map(b => b.id === blockId ? { ...b, content: newContent } : b);
    setBlocks(newBlocks);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && uploadingBlockId.current) {
      const reader = new FileReader();
      const blockIdToUpdate = uploadingBlockId.current;
      reader.onloadend = () => {
        updateBlockContent(blockIdToUpdate, reader.result as string);
        uploadingBlockId.current = null;
      };
      reader.readAsDataURL(file);
    }
    if (e.target) e.target.value = '';
  };
  
  const handleBlockTypeChange = (blockId: string, newType: Block['type']) => {
    // This flag prevents onBlur from saving corrupted data during the re-render.
    // It is reset by a useEffect hook that watches the `isPending` state of the transition.
    typeChangeInProgress.current = true;
    setMenuState({ open: false, blockId: null });

    if (newType === 'image') {
        uploadingBlockId.current = blockId;
        startTransition(() => {
            setBlocks(prev => prev.map(b => b.id === blockId ? { ...b, type: newType, content: '' } : b));
        });
        fileInputRef.current?.click();
        return;
    }
    
    if (newType === 'table') {
        const defaultTableContent: TableContent = {
            hasHeaders: false,
            rows: Array(2).fill(0).map(() => ({
                id: createBlockId(),
                cells: Array(3).fill(0).map(() => ({
                    id: createBlockId(),
                    content: '',
                })),
            })),
        };
        
        // Update the block type and content with proper typing
        setBlocks(prev => 
            prev.map(b => {
                if (b.id === blockId) {
                    return {
                        ...b,
                        type: 'table' as const, // Explicitly type as 'table'
                        content: defaultTableContent,
                    };
                }
                return b;
            })
        );
        
        // Then set focus to the first cell after a small delay to ensure the DOM is updated
        const firstCellId = defaultTableContent.rows[0]?.cells[0]?.id;
        if (firstCellId) {
            setTimeout(() => {
                setBlockToFocus({ id: `${blockId}-${firstCellId}`, position: 'start' });
            }, 50);
        }
        return;
    }

    startTransition(() => {
        setBlocks(prev => prev.map(b => (b.id === blockId ? { ...b, type: newType, content: newType === 'divider' ? '' : (typeof b.content === 'string' ? b.content : ''), checked: newType === 'todo' ? false : undefined } : b)));
        if(newType !== 'divider') {
            setBlockToFocus({ id: blockId, position: 'start' });
        }
    });
  };
  
  const handleKeyDown = (e: React.KeyboardEvent<HTMLElement>, block: Block) => {
    const element = e.currentTarget as HTMLElement;
    const currentBlockContent = element.innerHTML;
    const currentIndex = blocks.findIndex(b => b.id === block.id);
    
    if (block.type === 'code' && e.key === 'Tab') {
        e.preventDefault();
        document.execCommand('insertText', false, '\t');
        return;
    }

    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        
        let newBlockType: Block['type'] = 'paragraph';
        if (block.type === 'todo' || block.type === 'bulleted-list-item') {
            newBlockType = block.type;
        }

        if (currentBlockContent === '' && (block.type === 'bulleted-list-item' || block.type === 'todo')) {
            // If enter is pressed on an empty list or todo item, convert it to a paragraph
            setBlocks(prev => prev.map(b => b.id === block.id ? { ...b, type: 'paragraph', checked: undefined } : b));
            setBlockToFocus({ id: block.id, position: 'start' });
            return;
        }

        const newBlock: Block = { 
          id: createBlockId(), 
          type: newBlockType, 
          content: '',
          checked: newBlockType === 'todo' ? false : undefined
        };
        
        setBlocks(currentBlocks => {
            const blocksWithUpdatedContent = currentBlocks.map(b =>
                b.id === block.id ? { ...b, content: currentBlockContent } : b
            );
            const updatedIndex = blocksWithUpdatedContent.findIndex(b => b.id === block.id);
            return [
                ...blocksWithUpdatedContent.slice(0, updatedIndex + 1),
                newBlock,
                ...blocksWithUpdatedContent.slice(updatedIndex + 1)
            ];
        });

        setBlockToFocus({ id: newBlock.id, position: 'start' });
        return;
    }
    
    if (e.key === 'Backspace' && (currentBlockContent === '' || currentBlockContent === '<br>')) {
        e.preventDefault();
        if (blocks.length > 1) {
            setBlocks(prev => prev.filter(b => b.id !== block.id));
            const prevBlockId = blocks[currentIndex - 1]?.id;
            if (prevBlockId) {
                setBlockToFocus({ id: prevBlockId, position: 'end' });
            }
        }
        return;
    }
    
    if (e.key === '/') {
        if(currentBlockContent === '') {
            setMenuState({ open: true, blockId: block.id });
        }
    }
  };
  
  const handleDragStart = (e: React.DragEvent, blockId: string) => {
    setDraggedBlockId(blockId);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', blockId);
  };

  const handleDragOver = (e: React.DragEvent, targetBlockId: string) => {
      e.preventDefault();
      if (draggedBlockId === targetBlockId) return;
      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
      const middleY = rect.top + rect.height / 2;
      const position = e.clientY < middleY ? 'before' : 'after';
      setDropIndicator({ blockId: targetBlockId, position });
  };

  const handleDrop = (e: React.DragEvent) => {
      e.preventDefault();
      if (!draggedBlockId || !dropIndicator) return;
      
      setBlocks(currentBlocks => {
          const draggedBlock = currentBlocks.find(b => b.id === draggedBlockId);
          if (!draggedBlock) return currentBlocks;

          const blocksWithoutDragged = currentBlocks.filter(b => b.id !== draggedBlockId);
          let targetIndex = blocksWithoutDragged.findIndex(b => b.id === dropIndicator.blockId);
          
          if (dropIndicator.position === 'after') {
              targetIndex++;
          }
          
          const newBlocks = [...blocksWithoutDragged];
          newBlocks.splice(targetIndex, 0, draggedBlock);
          
          return newBlocks;
      });

      setDraggedBlockId(null);
      setDropIndicator(null);
  };
  
  const handleAddRow = (blockId: string, rowIndex: number) => {
    setBlocks(currentBlocks =>
      currentBlocks.map(b => {
        if (b.id === blockId && b.type === 'table') {
          const tableContent = b.content as TableContent;
          const numCols = tableContent.rows[0]?.cells.length || 1;
          const newRow: TableRow = {
              id: createBlockId(),
              cells: Array(numCols).fill(0).map(() => ({ id: createBlockId(), content: '' })),
          };
          const newRows = [...tableContent.rows];
          newRows.splice(rowIndex + 1, 0, newRow);
          return { ...b, content: { ...tableContent, rows: newRows } };
        }
        return b;
      })
    );
  };

  const handleAddColumn = (blockId: string, colIndex: number) => {
    setBlocks(currentBlocks =>
      currentBlocks.map(b => {
        if (b.id === blockId && b.type === 'table') {
          const tableContent = b.content as TableContent;
          const newRows = tableContent.rows.map(row => {
            const newCells = [...row.cells];
            newCells.splice(colIndex + 1, 0, { id: createBlockId(), content: '' });
            return { ...row, cells: newCells };
          });
          return { ...b, content: { ...tableContent, rows: newRows } };
        }
        return b;
      })
    );
  };
  
  const handleDeleteRow = (blockId: string, rowIndex: number) => {
    setBlocks(currentBlocks =>
      currentBlocks.map(b => {
        if (b.id === blockId && b.type === 'table') {
          const tableContent = b.content as TableContent;
          if (tableContent.rows.length <= 1) return b; // Don't delete the last row
          const newRows = tableContent.rows.filter((_, idx) => idx !== rowIndex);
          return { ...b, content: { ...tableContent, rows: newRows } };
        }
        return b;
      })
    );
  };

  const handleDeleteColumn = (blockId: string, colIndex: number) => {
    setBlocks(currentBlocks =>
      currentBlocks.map(b => {
        if (b.id === blockId && b.type === 'table') {
          const tableContent = b.content as TableContent;
          if (tableContent.rows[0]?.cells.length <= 1) return b; // Don't delete the last column
          const newRows = tableContent.rows.map(row => ({
              ...row,
              cells: row.cells.filter((_, idx) => idx !== colIndex),
          }));
          return { ...b, content: { ...tableContent, rows: newRows } };
        }
        return b;
      })
    );
  };

  const handleTableKeyDown = (e: React.KeyboardEvent<HTMLDivElement>, blockId: string, rowIndex: number, colIndex: number) => {
    if (e.key === 'Tab') {
        e.preventDefault();
        const block = blocks.find(b => b.id === blockId);
        if (block && block.type === 'table') {
            const tableContent = block.content as TableContent;
            const numRows = tableContent.rows.length;
            const numCols = tableContent.rows[0]?.cells.length || 0;

            let nextRow = rowIndex;
            let nextCol = colIndex;

            if (e.shiftKey) { // Backwards
                if (colIndex > 0) nextCol--;
                else if (rowIndex > 0) {
                    nextRow--;
                    nextCol = numCols - 1;
                } else return;
            } else { // Forwards
                if (colIndex < numCols - 1) nextCol++;
                else if (rowIndex < numRows - 1) {
                    nextRow++;
                    nextCol = 0;
                } else {
                    return; // Do nothing on tab in last cell for now
                }
            }
            const nextCell = tableContent.rows[nextRow]?.cells[nextCol];
            if (nextCell) {
              setBlockToFocus({ id: `${blockId}-${nextCell.id}`, position: 'start' });
            }
        }
    }
  };


  const handleIconSelect = (icon: string) => { if(page) { setCurrentIcon(icon); onUpdateIcon(page.id, icon); } setShowEmojiPicker(false); }
  const handleDateSelect = (date: string) => { if(page) onUpdateDate(page.id, date); setShowDatePicker(false); }
  const handleClearDate = (e: React.MouseEvent) => { e.stopPropagation(); if(page) onUpdateDate(page.id, null); }
  const handleStatusSelect = (status: 'todo' | 'in-progress' | 'done' | null) => { if (page) onUpdateStatus(page.id, status); setShowStatusPicker(false); };
  
  const formattedDate = page?.dueDate ? new Date(page.dueDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : null;

  // Move useMemo hook before early return to fix React Hooks order
  const renderedContent = useMemo(() => {
    const content: JSX.Element[] = [];
    let i = 0;
    while (i < blocks.length) {
      const block = blocks[i];
      if (block.type === 'bulleted-list-item') {
        const listItems = [];
        const firstItemId = block.id;
        while (i < blocks.length && blocks[i].type === 'bulleted-list-item') {
          listItems.push(renderBlock(blocks[i]));
          i++;
        }
        content.push(<ul key={`list-wrapper-${firstItemId}`}>{listItems}</ul>);
      } else {
        const rendered = renderBlock(block);
        if (rendered) {
          content.push(rendered);
        }
        i++;
      }
    }
    return content;
  }, [blocks, hoveredTablePos]);

  if (!page) {
    return (
      <div className="flex-1 flex items-center justify-center text-gray-500 p-8">
        <div className="text-center">
            <DocumentTextIcon className="w-20 h-20 mx-auto text-gray-600 mb-4" />
            <h2 className="text-2xl font-semibold text-gray-300">Select a page</h2>
            <p className="text-gray-500 mt-1">Or create a new one to start writing.</p>
        </div>
      </div>
    );
  }

  const renderBlock = (block: Block) => {
    const commonProps = {
      'data-block-id': block.id,
    };
    
    const editableProps = {
      contentEditable: true,
      suppressContentEditableWarning: true,
      onFocus: (e: React.FocusEvent<HTMLElement>) => {
        if(typeof block.content === 'string') {
          blockContentOnFocus.current[block.id] = e.currentTarget.innerHTML;
        }
      },
      onBlur: (e: React.FocusEvent<HTMLElement>) => handleBlockBlur(block.id, e.currentTarget),
      dangerouslySetInnerHTML: { __html: (typeof block.content === 'string' ? block.content : '') },
      onKeyDown: (e: React.KeyboardEvent<HTMLElement>) => handleKeyDown(e, block),
    };

    switch (block.type) {
      case 'heading1':
      case 'heading2':
      case 'paragraph':
      case 'blockquote': {
        const isHeading1 = block.type === 'heading1';
        const isHeading2 = block.type === 'heading2';
        const isBlockquote = block.type === 'blockquote';

        const Tag = isHeading1 ? 'h1' : isHeading2 ? 'h2' : isBlockquote ? 'blockquote' : 'p';
        
        const tagProps = {
          className: `w-full min-h-[1em] bg-transparent focus:outline-none leading-relaxed ${
              isHeading1 
              ? 'text-3xl font-bold text-gray-200' 
              : isHeading2
              ? 'text-2xl font-bold text-gray-200'
              : 'text-lg text-gray-300'
          }`,
          'data-placeholder': isHeading1 ? 'Heading 1' : isHeading2 ? 'Heading 2' : isBlockquote ? 'Empty quote' : "Type '/' for commands...",
        };
        return <Tag key={block.id} {...commonProps} {...editableProps} {...tagProps} />;
      }
       case 'bulleted-list-item': {
          const tagProps = {
            className: `w-full min-h-[1em] bg-transparent focus:outline-none leading-relaxed text-lg text-gray-300`,
            'data-placeholder': "List item",
          };
          return <li key={block.id} {...commonProps}><div {...editableProps} {...tagProps} /></li>;
       }
      case 'todo':
        return (
          <div key={block.id} className="flex items-start gap-3 todo-block" data-checked={block.checked}>
            <button 
              onClick={() => handleToggleTodo(block.id)}
              className="mt-1.5 w-5 h-5 flex-shrink-0 border-2 rounded-md transition-all flex items-center justify-center
              border-gray-500 hover:border-purple-400
              data-[checked=true]:bg-purple-600 data-[checked=true]:border-purple-600"
              data-checked={block.checked}
            >
              {block.checked && <svg className="w-3 h-3 text-white" viewBox="0 0 14 11" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M1 5.5L4.95263 9.45263L13 1.40526" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>}
            </button>
            <div
              {...commonProps}
              {...editableProps}
              className="w-full min-h-[1em] bg-transparent focus:outline-none leading-relaxed text-lg text-gray-300 todo-content"
              data-placeholder="To-do"
            />
          </div>
        );
      case 'code':
        return (
            <pre className="code-block-pre">
                <code 
                  {...commonProps}
                  {...editableProps}
                  data-placeholder="Empty code block..." 
                ></code>
            </pre>
        );
      case 'ai-prompt':
        return (
            <div className="ai-prompt-block">
                <MagicIcon className="w-5 h-5 text-purple-400 flex-shrink-0" />
                <div 
                    {...commonProps}
                    {...editableProps}
                    className="w-full min-h-[1em] bg-transparent focus:outline-none text-lg text-purple-200 placeholder:text-purple-400/50"
                    data-placeholder="Write a prompt..."
                ></div>
            </div>
        );
      case 'json-schema':
        return (
            <pre className="json-schema-block">
                <span className="json-schema-label">JSON</span>
                <code
                  {...commonProps}
                  {...editableProps}
                  data-placeholder="Enter JSON schema..." 
                ></code>
            </pre>
        );
      case 'ui-component':
        return (
            <div className="ui-component-block" contentEditable={false}>
                <pre className="ui-component-editor">
                    <code
                        {...commonProps}
                        {...editableProps}
                        data-placeholder="Write JSX component code..."
                    ></code>
                </pre>
                <ComponentPreview code={typeof block.content === 'string' ? block.content : ''} />
            </div>
        );
      case 'image':
        return (
            <div contentEditable={false}>
                {block.content ? (
                    <img src={block.content as string} alt="User uploaded content" className="max-w-full h-auto rounded-lg my-2" />
                ) : (
                    <div className="image-placeholder">
                        <PhotoIcon className="w-12 h-12 text-gray-600 mb-2" />
                        <p className="text-gray-500 mb-3">Image Block</p>
                        <button 
                            onClick={() => {
                                uploadingBlockId.current = block.id;
                                fileInputRef.current?.click();
                            }}
                            className="text-sm bg-purple-600 hover:bg-purple-500 text-white font-semibold py-1 px-3 rounded-md transition-colors"
                        >
                            Upload Image
                        </button>
                    </div>
                )}
            </div>
        );
      case 'divider':
        return <hr {...commonProps} contentEditable={false} />;
      case 'table':
          const tableContent = block.content as TableContent;
          const numCols = tableContent.rows[0]?.cells.length || 0;
          return (
            <div className="table-wrapper" onMouseLeave={() => setHoveredTablePos({ row: null, col: null })}>
              <table {...commonProps} contentEditable={false}>
                <tbody>
                  {tableContent.rows.map((row, rowIndex) => (
                    <tr key={row.id} onMouseEnter={() => setHoveredTablePos(p => ({ ...p, row: rowIndex }))}>
                      {/* Delete Row Handle */}
                      <td className="w-6 p-0 border-none relative">
                        {hoveredTablePos.row === rowIndex && (
                          <div 
                           onClick={() => handleDeleteRow(block.id, rowIndex)}
                           className="absolute -left-6 top-1/2 -translate-y-1/2 w-5 h-5 flex items-center justify-center bg-gray-800 border border-white/10 rounded cursor-pointer hover:bg-red-500/50">
                            <TrashIcon className="w-3 h-3" />
                          </div>
                        )}
                      </td>
                      {row.cells.map((cell, colIndex) => (
                        <td
                          key={cell.id}
                          className="relative"
                        >
                          {/* Delete Col Handle */}
                          {rowIndex === 0 && hoveredTablePos.col === colIndex && (
                             <div 
                             onClick={() => handleDeleteColumn(block.id, colIndex)}
                             className="absolute -top-6 left-1/2 -translate-x-1/2 w-5 h-5 flex items-center justify-center bg-gray-800 border border-white/10 rounded cursor-pointer hover:bg-red-500/50">
                              <TrashIcon className="w-3 h-3" />
                            </div>
                          )}
                          <div
                            contentEditable
                            suppressContentEditableWarning
                            onBlur={(e) => handleTableCellBlur(block.id, rowIndex, colIndex, e.currentTarget.innerHTML)}
                            dangerouslySetInnerHTML={{ __html: cell.content }}
                            data-cell-id={`${block.id}-${cell.id}`}
                            onKeyDown={(e) => handleTableKeyDown(e, block.id, rowIndex, colIndex)}
                            onMouseEnter={() => setHoveredTablePos(p => ({ ...p, col: colIndex }))}
                            className="w-full h-full min-h-[2rem] focus:outline-none"
                          />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
               {/* Add Column Button */}
              <button 
                onClick={() => handleAddColumn(block.id, numCols -1)}
                className="absolute top-1/2 -right-3 -translate-y-1/2 w-6 h-6 flex items-center justify-center bg-gray-800 border border-white/10 rounded-full hover:bg-purple-500/50 table-controls">
                <PlusIcon className="w-4 h-4" />
              </button>
               {/* Add Row Button */}
              <button
                onClick={() => handleAddRow(block.id, tableContent.rows.length -1)}
                className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-6 h-6 flex items-center justify-center bg-gray-800 border border-white/10 rounded-full hover:bg-purple-500/50 table-controls">
                <PlusIcon className="w-4 h-4" />
              </button>
            </div>
          );
      default:
        // This should not be reached
        return null;
    }
  };



  return (
    <main className="flex-1 p-4 sm:p-6 md:p-8 lg:p-12 overflow-y-auto" ref={editorRef} onDrop={handleDrop}>
      <div className="max-w-3xl mx-auto">
        <input type="file" ref={fileInputRef} onChange={handleImageUpload} accept="image/*" className="hidden" />

        <div className="relative w-min mb-4">
          <button onClick={() => setShowEmojiPicker(s => !s)} className="text-gray-400 select-none hover:bg-white/10 rounded-lg p-2 -ml-2 transition-colors" aria-label="Change page icon">
            <PageIcon icon={currentIcon} className="w-16 h-16"/>
          </button>
          {showEmojiPicker && <EmojiPicker onSelect={handleIconSelect} onClose={() => setShowEmojiPicker(false)} />}
        </div>
        <input type="text" value={title} onChange={handleTitleChange} placeholder="Untitled" className="w-full bg-transparent text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold focus:outline-none text-gray-100 placeholder-gray-600 mb-4" />

        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4 mb-4 pb-4 border-b border-white/10">
          <div className="relative">
            {page.dueDate ? (
              <button onClick={() => setShowDatePicker(true)} className="flex items-center gap-2 text-sm text-gray-400 hover:bg-white/10 p-1.5 rounded-md transition-colors group">
                <CalendarIcon className="w-4 h-4 text-gray-500" />
                <span>{formattedDate}</span>
                <div onClick={handleClearDate} className="opacity-0 group-hover:opacity-100 transition-opacity" aria-label="Clear date">
                  <XIcon className="w-4 h-4 hover:text-red-400"/>
                </div>
              </button>
            ) : (
              <button onClick={() => setShowDatePicker(true)} className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-300 hover:bg-white/10 p-1.5 rounded-md transition-colors">
                <CalendarIcon className="w-4 h-4" />
                <span>Add Date</span>
              </button>
            )}
            {showDatePicker && <DatePicker initialDate={page.dueDate} onSelect={handleDateSelect} onClose={() => setShowDatePicker(false)} />}
          </div>
          <div className="relative">
            {page.status ? (
              <button onClick={() => setShowStatusPicker(true)} className="flex items-center gap-2 text-sm text-gray-400 hover:bg-white/10 p-1.5 rounded-md transition-colors">
                {statusDisplay[page.status].icon}
                <span>{statusDisplay[page.status].text}</span>
              </button>
            ) : (
              <button onClick={() => setShowStatusPicker(true)} className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-300 hover:bg-white/10 p-1.5 rounded-md transition-colors">
                <StatusCircleIcon className="w-4 h-4" />
                <span>Add Status</span>
              </button>
            )}
            {showStatusPicker && <StatusPicker onSelect={handleStatusSelect} onClose={() => setShowStatusPicker(false)} />}
          </div>
        </div>
        
        <div className="mt-4 space-y-1">
          {renderedContent.map((content, index) => {
             const key = content.key || index;
             const currentBlock = blocks.find(b => `list-wrapper-${b.id}` === key || b.id === (content.props['data-block-id']));
            
             return (
              <div
                  key={key}
                  className="relative block-wrapper"
                  data-block-wrapper-id={currentBlock?.id}
                  onDragOver={(e) => currentBlock && handleDragOver(e, currentBlock.id)}
                  onDragLeave={() => setDropIndicator(null)}
              >
                  {dropIndicator && dropIndicator.blockId === currentBlock?.id && dropIndicator.position === 'before' && (
                      <div className="absolute -top-1 left-0 w-full h-1 bg-purple-500 rounded-full z-10" />
                  )}

                  <div className="relative group flex items-start gap-1">
                      <div className="block-controls flex items-center h-8">
                          {currentBlock && currentBlock.type !== 'divider' && (
                            <>
                              <button
                                  onMouseDown={(e) => {
                                      e.preventDefault();
                                      currentBlock && handleDeleteBlock(currentBlock.id);
                                  }}
                                  className="p-1 text-gray-500 hover:text-red-400 rounded"
                                  aria-label="Delete block"
                              >
                                  <TrashIcon className="w-4 h-4" />
                              </button>
                              <button
                                  draggable
                                  onMouseDown={(e) => e.preventDefault()}
                                  onDragStart={(e) => currentBlock && handleDragStart(e, currentBlock.id)}
                                  className="p-1 text-gray-500 hover:text-gray-300 rounded cursor-grab active:cursor-grabbing"
                                  aria-label="Drag to reorder"
                              >
                                  <DragHandleIcon className="w-4 h-4" />
                              </button>
                            </>
                          )}
                      </div>
                      <div className={`flex-1 ${draggedBlockId === currentBlock?.id ? 'opacity-30' : ''}`}>
                          {content}
                      </div>
                  </div>

                  {dropIndicator && dropIndicator.blockId === currentBlock?.id && dropIndicator.position === 'after' && (
                      <div className="absolute -bottom-1 left-0 w-full h-1 bg-purple-500 rounded-full z-10" />
                  )}
                  
                  {currentBlock && menuState.open && menuState.blockId === currentBlock.id && (
                      <BlockTypeMenu 
                          onSelect={(newType) => handleBlockTypeChange(currentBlock.id, newType)} 
                          onClose={() => setMenuState({ open: false, blockId: null })} 
                      />
                  )}
              </div>
          )})}
        </div>
      </div>
    </main>
  );
};

export default Editor;