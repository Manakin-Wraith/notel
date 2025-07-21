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
  dueDate: dbPage.due_date,
  status: dbPage.status,
  content: blocks
})

// Convert database row to app Block type
const dbBlockToBlock = (dbBlock: BlockRow): Block => ({
  id: dbBlock.id,
  type: dbBlock.type as Block['type'],
  content: dbBlock.content as string | any,
  checked: dbBlock.checked
})

// Convert app Page to database insert
const pageToDbInsert = (page: Page, userId: string): PageInsert => ({
  id: page.id,
  user_id: userId,
  title: page.title,
  icon: page.icon,
  parent_id: page.parentId,
  due_date: page.dueDate,
  status: page.status
})

// Convert app Block to database insert
const blockToDbInsert = (block: Block, pageId: string, position: number): BlockInsert => ({
  id: block.id,
  page_id: pageId,
  type: block.type,
  content: block.content as any, // Cast to any for Json compatibility
  position,
  checked: block.checked
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

    // Insert page
    const { data: pageData, error: pageError } = await supabase
      .from('pages')
      .insert(pageToDbInsert(page, user.id))
      .select()
      .single()

    if (pageError) throw pageError

    // Insert blocks
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
  static async syncLocalData(pages: Page[]): Promise<void> {
    const user = await getCurrentUser()
    if (!user) throw new Error('User not authenticated')

    for (const page of pages) {
      try {
        await this.createPage(page)
      } catch (error) {
        console.error(`Failed to sync page ${page.id}:`, error)
      }
    }
  }
}
