import { supabase, getCurrentUser } from './supabase'
import type { Page, Block, Event } from '../types'
import type { Database } from '../types/database'

// Global lock to prevent concurrent welcome page creation
let isCreatingWelcomePages = false

type PageRow = Database['public']['Tables']['pages']['Row']
type BlockRow = Database['public']['Tables']['blocks']['Row']
type EventRow = Database['public']['Tables']['events']['Row']
type PageInsert = Database['public']['Tables']['pages']['Insert']
type BlockInsert = Database['public']['Tables']['blocks']['Insert']
type EventInsert = Database['public']['Tables']['events']['Insert']

// Convert database row to app Page type
const dbPageToPage = (dbPage: PageRow, blocks: Block[] = []): Page => ({
  id: dbPage.id,
  title: dbPage.title,
  icon: dbPage.icon,
  parentId: dbPage.parent_id,
  position: dbPage.position || 0,
  dueDate: dbPage.due_date,
  status: dbPage.status,
  content: blocks
})

// Convert database row to app Block type
const dbBlockToBlock = (dbBlock: BlockRow): Block => ({
  id: dbBlock.id,
  type: dbBlock.type as Block['type'],
  content: typeof dbBlock.content === 'string' ? JSON.parse(dbBlock.content) : dbBlock.content,
  checked: dbBlock.checked || false
})

// Convert app Page to database insert
const pageToDbInsert = (page: Page, userId: string): PageInsert => ({
  id: page.id,
  user_id: userId,
  title: page.title || 'Untitled',
  icon: page.icon || 'document-text',
  parent_id: page.parentId || null,
  position: page.position || 0,
  due_date: page.dueDate ? new Date(page.dueDate).toISOString() : null,
  status: page.status || null
})

// Convert app Block to database insert
const blockToDbInsert = (block: Block, pageId: string, position: number): BlockInsert => ({
  id: block.id,
  page_id: pageId,
  type: block.type,
  content: JSON.stringify(block.content), // Ensure content is properly serialized
  position,
  checked: block.checked || false
})

// Convert database row to app Event type
const dbEventToEvent = (dbEvent: EventRow): Event => ({
  id: dbEvent.id,
  title: dbEvent.title,
  description: dbEvent.description || undefined,
  icon: dbEvent.icon || undefined,
  startDate: dbEvent.start_date,
  endDate: dbEvent.end_date || undefined,
  allDay: dbEvent.all_day,
  status: dbEvent.status,
  priority: dbEvent.priority,
  linkedPageId: dbEvent.linked_page_id || undefined,
  createdAt: dbEvent.created_at,
  updatedAt: dbEvent.updated_at
})

// Convert app Event to database insert
const eventToDbInsert = (event: Event, userId: string): EventInsert => ({
  id: event.id,
  user_id: userId,
  title: event.title,
  description: event.description || null,
  icon: event.icon || null,
  start_date: event.startDate,
  end_date: event.endDate || null,
  all_day: event.allDay,
  status: event.status,
  priority: event.priority,
  linked_page_id: event.linkedPageId || null
})

export class DatabaseService {
  // Test if position column exists in database
  async testPositionColumn(): Promise<void> {
    const user = await getCurrentUser()
    if (!user) throw new Error('User not authenticated')

    try {
      console.log('Testing if position column exists in database...')
      
      // Try to select position column specifically
      const { data, error } = await supabase
        .from('pages')
        .select('id, title, position')
        .eq('user_id', user.id)
        .limit(1)
      
      if (error) {
        console.error('Position column test failed:', error)
        console.error('This suggests the position column does not exist in your Supabase database!')
      } else {
        console.log('Position column test successful:', data)
        console.log('Position column exists in database')
      }
    } catch (error) {
      console.error('Database schema test error:', error)
    }
  }
  // Fetch all pages for current user
  async getPages(): Promise<Page[]> {
    const user = await getCurrentUser()
    if (!user) throw new Error('User not authenticated')

    const { data: pagesData, error: pagesError } = await supabase
      .from('pages')
      .select('*')
      .eq('user_id', user.id)
      .order('parent_id', { ascending: true, nullsFirst: true })
      .order('position', { ascending: true })
      .order('created_at', { ascending: true })

    if (pagesError) throw pagesError
    
    // Debug: Log the raw data from database
    console.log('Raw pages from database:');
    pagesData.forEach(p => {
      console.log(`  ${p.title}: parent_id=${p.parent_id}, position=${p.position}`);
    });
    console.log('Full raw data:', pagesData.map(p => ({ 
      id: p.id, 
      title: p.title, 
      parent_id: p.parent_id, 
      position: p.position 
    })));

    // Fetch blocks for all pages
    const pageIds = pagesData.map(p => p.id)
    const { data: blocksData, error: blocksError } = await supabase
      .from('blocks')
      .select('*')
      .in('page_id', pageIds)
      .order('position', { ascending: true })

    if (blocksError) throw blocksError

    // Group blocks by page_id
    const blocksByPageId = blocksData.reduce((acc, block) => {
      if (!acc[block.page_id]) acc[block.page_id] = []
      acc[block.page_id].push(dbBlockToBlock(block))
      return acc
    }, {} as Record<string, Block[]>)

    // Convert to app format
    const pages = pagesData.map(dbPage => {
      const pageBlocks = blocksByPageId[dbPage.id] || []
      return dbPageToPage(dbPage, pageBlocks)
    })

    // Debug: Log the final converted pages
    console.log('Final converted pages:');
    pages.forEach(p => {
      console.log(`  ${p.title}: parentId=${p.parentId}, position=${p.position}`);
    });
    console.log('Full converted data:', pages.map(p => ({ 
      id: p.id, 
      title: p.title, 
      parentId: p.parentId, 
      position: p.position 
    })));

    return pages
  }

  // Create a new page
  async createPage(page: Page): Promise<Page> {
    const user = await getCurrentUser()
    if (!user) throw new Error('User not authenticated')

    // Debug logging
    const pageInsert = pageToDbInsert(page, user.id)
    console.log('Creating page with data:', pageInsert)

    // Insert page
    const { data: pageData, error: pageError } = await supabase
      .from('pages')
      .insert(pageInsert)
      .select()
      .single()

    if (pageError) {
      console.error('Page creation error:', pageError)
      throw pageError
    }

    // Insert blocks
    if (page.content.length > 0) {
      const blockInserts = page.content.map((block, index) => 
        blockToDbInsert(block, page.id, index)
      )
      
      console.log('Creating blocks with data:', blockInserts)

      const { error: blocksError } = await supabase
        .from('blocks')
        .insert(blockInserts)

      if (blocksError) {
        console.error('Blocks creation error:', blocksError)
        throw blocksError
      }
    }

    return dbPageToPage(pageData, page.content)
  }

  // Update an existing page
  async updatePage(page: Page): Promise<Page> {
    const user = await getCurrentUser()
    if (!user) throw new Error('User not authenticated')

    console.log('Attempting to update page with position:', {
      id: page.id,
      title: page.title,
      parentId: page.parentId,
      position: page.position
    })

    const updateData = {
      title: page.title,
      icon: page.icon,
      parent_id: page.parentId,
      position: page.position, // Explicitly include position
      due_date: page.dueDate,
      status: page.status,
      updated_at: new Date().toISOString()
    }

    console.log('Update data being sent to Supabase:', updateData)

    const { data: pageData, error: pageError } = await supabase
      .from('pages')
      .update(updateData)
      .eq('id', page.id)
      .eq('user_id', user.id)
      .select()
      .single()

    console.log('Supabase update response:', { data: pageData, error: pageError })

    if (pageError) throw pageError

    // Delete existing blocks
    await supabase
      .from('blocks')
      .delete()
      .eq('page_id', page.id)

    // Insert new blocks
    if (page.content.length > 0) {
      const blockInserts = page.content.map((block, index) => 
        blockToDbInsert(block, page.id, index)
      )

      const { error: blocksError } = await supabase
        .from('blocks')
        .insert(blockInserts)

      if (blocksError) throw blocksError
    }

    return dbPageToPage(pageData, page.content)
  }

  // Delete a page
  async deletePage(pageId: string): Promise<void> {
    const user = await getCurrentUser()
    if (!user) throw new Error('User not authenticated')

    // Delete blocks first (cascade should handle this, but being explicit)
    await supabase
      .from('blocks')
      .delete()
      .eq('page_id', pageId)

    // Delete page
    const { error } = await supabase
      .from('pages')
      .delete()
      .eq('id', pageId)
      .eq('user_id', user.id)

    if (error) throw error
  }

  // Create welcome pages for new authenticated users
  async createWelcomePages(): Promise<void> {
    const user = await getCurrentUser()
    if (!user) {
      console.error('Cannot create welcome pages: User not authenticated')
      return
    }

    // Global lock to prevent concurrent calls
    if (isCreatingWelcomePages) {
      console.log('Welcome pages are already being created, skipping duplicate call')
      return
    }

    isCreatingWelcomePages = true
    
    try {
      // Check if user already has pages to prevent duplication
      const existingPages = await this.getPages()
      if (existingPages.length > 0) {
        console.log('User already has pages, skipping welcome page creation:', existingPages.length)
        return
      }
      
      // Double-check for existing welcome pages specifically
      const welcomePageExists = existingPages.some(page => page.title === 'Welcome to Notel')
      if (welcomePageExists) {
        console.log('Welcome page already exists, skipping creation')
        return
      }

      console.log('Creating welcome pages for new user:', user.email)
    
    const createBlockId = () => `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    const createPageId = () => `welcome-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    
    const welcomePageId = createPageId();
    const projectIdeasId = createPageId();
    const reportId = createPageId();
    
    const welcomePages: Page[] = [
      { 
        id: welcomePageId, 
        title: 'Welcome to Notel', 
        icon: 'sparkles', 
        parentId: null, 
        position: 0,
        content: [
          { id: createBlockId(), type: 'heading1', content: 'Getting Started' },
          { id: createBlockId(), type: 'paragraph', content: 'Here are a few things to get you started. Check them off as you go!' },
          { id: createBlockId(), type: 'todo', content: 'Create a new page using the + button in the sidebar.', checked: false },
          { id: createBlockId(), type: 'todo', content: 'Type `/` on a new line to see all available block commands.', checked: false },
          { id: createBlockId(), type: 'todo', content: 'Drag this item by its handle to reorder the list.', checked: false },
          { id: createBlockId(), type: 'todo', content: 'Click on any page icon (like ✨) to change it to a different emoji.', checked: false },
          { id: createBlockId(), type: 'todo', content: 'Add a status or a due date to this page using the buttons below the title.', checked: false },
          { id: createBlockId(), type: 'todo', content: 'Explore the Agenda, Board, and Calendar views using the icons in the sidebar.', checked: false },
          { id: createBlockId(), type: 'paragraph', content: '' },
        ], 
        dueDate: new Date().toISOString(), 
        status: 'in-progress' 
      },
      { 
        id: projectIdeasId, 
        title: 'Project Ideas', 
        icon: 'light-bulb', 
        parentId: welcomePageId, 
        position: 0,
        content: [
          { id: createBlockId(), type: 'paragraph', content: '- Build a cool app with React and Tailwind.' },
          { id: createBlockId(), type: 'paragraph', content: '- Learn a new programming language.' }
        ],
        dueDate: null, 
        status: 'todo' 
      },
      { 
        id: reportId, 
        title: 'Finish Q2 report', 
        icon: 'chart-bar', 
        parentId: null, 
        position: 1,
        content: [
          { id: createBlockId(), type: 'paragraph', content: 'Review numbers and finalize the presentation slides.' }
        ], 
        dueDate: new Date(new Date().setDate(new Date().getDate() + 1)).toISOString(), 
        status: 'todo' 
      },
    ];
    
    console.log(`About to create ${welcomePages.length} welcome pages for user ${user.email}`);
    
    for (const page of welcomePages) {
      try {
        console.log(`Creating welcome page: ${page.title} (ID: ${page.id})`);
        await this.createPage(page);
        console.log(`✅ Successfully created welcome page: ${page.title}`);
      } catch (error) {
        console.error(`❌ Failed to create welcome page ${page.title} (${page.id}):`, error);
        // Continue creating other pages even if one fails
      }
    }
    
      console.log('Finished creating welcome pages');
    } catch (error) {
      console.error('❌ Error during welcome page creation:', error);
      throw error; // Re-throw to let caller handle
    } finally {
      // Always release the lock
      isCreatingWelcomePages = false;
    }
  }

  // Sync local data to Supabase (for migration)
  async syncLocalData(): Promise<void> {
    const user = await getCurrentUser()
    if (!user) return

    // Get pages from localStorage
    const savedPages = localStorage.getItem('glasstion-pages')
    if (!savedPages) return
    
    let localPages: Page[]
    try {
      localPages = JSON.parse(savedPages)
    } catch (error) {
      console.error('Failed to parse localStorage pages:', error)
      return
    }
    
    if (localPages.length === 0) return

    console.log('Syncing local data to Supabase...', localPages)
    
    for (const page of localPages) {
      try {
        console.log(`Attempting to sync page ${page.id}:`, page)
        await this.createPage(page)
        console.log(`Synced page: ${page.title}`)
      } catch (error) {
        console.error(`Failed to sync page ${page.id}:`, error)
      }
    }
  }

  // Update page position for cross-device synchronization
  async updatePagePosition(pageId: string, newPosition: number, newParentId: string | null = null): Promise<void> {
    const user = await getCurrentUser()
    if (!user) throw new Error('User not authenticated')

    const updateData: any = { position: newPosition }
    if (newParentId !== undefined) {
      updateData.parent_id = newParentId
    }

    const { error } = await supabase
      .from('pages')
      .update(updateData)
      .eq('id', pageId)
      .eq('user_id', user.id)

    if (error) throw error
  }

  // Reorder pages after a drag-and-drop operation
  async reorderPages(draggedId: string, targetId: string, position: 'top' | 'bottom' | 'middle'): Promise<void> {
    const user = await getCurrentUser()
    if (!user) throw new Error('User not authenticated')

    // Get all pages to calculate new positions
    const pages = await this.getPages()
    const draggedPage = pages.find(p => p.id === draggedId)
    const targetPage = pages.find(p => p.id === targetId)
    
    if (!draggedPage || !targetPage) {
      throw new Error('Page not found')
    }

    // Prevent moving a page into itself
    if (targetId === draggedId) {
      throw new Error('Cannot move page into itself')
    }

    // Only check descendants when moving as child (position === 'middle')
    if (position === 'middle') {
      const getAllDescendantIds = (pageId: string): Set<string> => {
        const descendantIds = new Set<string>()
        const findChildrenOf = (pId: string) => {
          const children = pages.filter(p => p.parentId === pId)
          children.forEach(child => {
            descendantIds.add(child.id)
            findChildrenOf(child.id)
          })
        }
        findChildrenOf(pageId)
        return descendantIds
      }

      if (getAllDescendantIds(draggedId).has(targetId)) {
        throw new Error('Cannot move page into its descendants')
      }
    }

    let newParentId: string | null
    let newPosition: number

    if (position === 'middle') {
      // Move as child of target
      newParentId = targetId
      const siblings = pages.filter(p => p.parentId === targetId && p.id !== draggedId)
      newPosition = siblings.length > 0 ? Math.max(...siblings.map(p => p.position)) + 1 : 0
    } else {
      // Move as sibling of target
      newParentId = targetPage.parentId
      
      if (position === 'top') {
        newPosition = targetPage.position - 0.5
      } else { // bottom
        newPosition = targetPage.position + 0.5
      }
    }

    // Update the dragged page's position and parent
    await this.updatePagePosition(draggedId, newPosition, newParentId)

    // Normalize positions to avoid floating point issues
    await this.normalizePositions()
  }

  // Normalize all page positions to integers
  async normalizePositions(): Promise<void> {
    const user = await getCurrentUser()
    if (!user) return

    const pages = await this.getPages()
    
    // Group pages by parent
    const pagesByParent = new Map<string | null, typeof pages>()
    pages.forEach(page => {
      const parentId = page.parentId
      if (!pagesByParent.has(parentId)) {
        pagesByParent.set(parentId, [])
      }
      pagesByParent.get(parentId)!.push(page)
    })

    // Normalize positions within each parent group
    for (const [, siblings] of pagesByParent) {
      siblings.sort((a, b) => a.position - b.position)
      
      for (let i = 0; i < siblings.length; i++) {
        const page = siblings[i]
        const newPosition = i * 10 // Use increments of 10 for future insertions
        
        if (page.position !== newPosition) {
          await this.updatePagePosition(page.id, newPosition)
        }
      }
    }
  }

  // Event CRUD Operations
  async getEvents(): Promise<Event[]> {
    const user = await getCurrentUser()
    if (!user) {
      console.warn('No authenticated user found')
      return []
    }

    try {
      const { data: events, error } = await supabase
        .from('events')
        .select('*')
        .eq('user_id', user.id)
        .order('start_date', { ascending: true })

      if (error) {
        // Check if it's a "relation does not exist" error
        if (error.code === '42P01' || error.message.includes('relation "events" does not exist')) {
          console.warn('⚠️ Events table does not exist yet. Please run the database schema to create it.');
          return [];
        }
        console.error('Error fetching events:', error)
        return []
      }

      return events ? events.map(dbEventToEvent) : []
    } catch (error) {
      console.error('Unexpected error fetching events:', error)
      return []
    }
  }

  async createEvent(event: Event): Promise<Event> {
    const user = await getCurrentUser()
    if (!user) {
      throw new Error('No authenticated user found')
    }

    try {
      const eventData = eventToDbInsert(event, user.id)
      const { data, error } = await supabase
        .from('events')
        .insert(eventData)
        .select()
        .single()

      if (error) {
        // Check if it's a "relation does not exist" error
        if (error.code === '42P01' || error.message.includes('relation "events" does not exist')) {
          console.warn('⚠️ Events table does not exist yet. Event will be stored locally only.');
          throw new Error('Events table not found. Please run the database schema.');
        }
        console.error('Error creating event:', error)
        throw error
      }

      return dbEventToEvent(data)
    } catch (error) {
      console.error('Unexpected error creating event:', error)
      throw error
    }
  }

  async updateEvent(event: Event): Promise<Event> {
    const user = await getCurrentUser()
    if (!user) {
      throw new Error('No authenticated user found')
    }

    try {
      const eventData = eventToDbInsert(event, user.id)
      const { data, error } = await supabase
        .from('events')
        .update({
          ...eventData,
          updated_at: new Date().toISOString()
        })
        .eq('id', event.id)
        .eq('user_id', user.id)
        .select()
        .single()

      if (error) {
        // Check if it's a "relation does not exist" error
        if (error.code === '42P01' || error.message.includes('relation "events" does not exist')) {
          console.warn('⚠️ Events table does not exist yet. Event will be stored locally only.');
          throw new Error('Events table not found. Please run the database schema.');
        }
        console.error('Error updating event:', error)
        throw error
      }

      return dbEventToEvent(data)
    } catch (error) {
      console.error('Unexpected error updating event:', error)
      throw error
    }
  }

  async deleteEvent(eventId: string): Promise<void> {
    const user = await getCurrentUser()
    if (!user) {
      throw new Error('No authenticated user found')
    }

    try {
      const { error } = await supabase
        .from('events')
        .delete()
        .eq('id', eventId)
        .eq('user_id', user.id)

      if (error) {
        // Check if it's a "relation does not exist" error
        if (error.code === '42P01' || error.message.includes('relation "events" does not exist')) {
          console.warn('⚠️ Events table does not exist yet. Event will be deleted locally only.');
          return; // Don't throw error, just delete locally
        }
        console.error('Error deleting event:', error)
        throw error
      }
    } catch (error) {
      console.error('Unexpected error deleting event:', error)
      throw error
    }
  }
}

export const databaseService = new DatabaseService()
