import { supabase, getCurrentUser } from './supabase'
import type { Page, Block } from '../types'
import type { Database } from '../types/database'

type PageRow = Database['public']['Tables']['pages']['Row']
type BlockRow = Database['public']['Tables']['blocks']['Row']
type PageInsert = Database['public']['Tables']['pages']['Insert']
type BlockInsert = Database['public']['Tables']['blocks']['Insert']

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

export class DatabaseService {
  // Fetch all pages for current user
  static async getPages(): Promise<Page[]> {
    const user = await getCurrentUser()
    if (!user) throw new Error('User not authenticated')

    const { data: pagesData, error: pagesError } = await supabase
      .from('pages')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: true })

    if (pagesError) throw pagesError

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

    // Convert pages with their blocks
    return pagesData.map(dbPage => 
      dbPageToPage(dbPage, blocksByPageId[dbPage.id] || [])
    )
  }

  // Create a new page
  static async createPage(page: Page): Promise<Page> {
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
  static async updatePage(page: Page): Promise<Page> {
    const user = await getCurrentUser()
    if (!user) throw new Error('User not authenticated')

    // Update page
    const { data: pageData, error: pageError } = await supabase
      .from('pages')
      .update({
        title: page.title,
        icon: page.icon,
        parent_id: page.parentId,
        due_date: page.dueDate,
        status: page.status,
        updated_at: new Date().toISOString()
      })
      .eq('id', page.id)
      .eq('user_id', user.id)
      .select()
      .single()

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
  static async deletePage(pageId: string): Promise<void> {
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

  // Sync local data to Supabase (for migration)
  static async syncLocalData(): Promise<void> {
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
  static async updatePagePosition(pageId: string, newPosition: number, newParentId: string | null = null): Promise<void> {
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
  static async reorderPages(draggedId: string, targetId: string, position: 'top' | 'bottom' | 'middle'): Promise<void> {
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
  private static async normalizePositions(): Promise<void> {
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
}
