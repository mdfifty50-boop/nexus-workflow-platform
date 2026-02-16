/**
 * ContactService - WhatsApp Contact Management
 *
 * In-memory contact storage for WhatsApp broadcast campaigns.
 * Supports tagging, filtering, and CSV bulk import.
 *
 * In production, this should be backed by a database (Supabase).
 */

// =============================================================================
// TYPES
// =============================================================================

export interface Contact {
  phone: string          // E.164 format (+96550123456)
  name: string
  tags: string[]
  addedAt: Date
  lastMessageAt: Date | null
}

export interface ContactFilters {
  tags?: string[]        // Filter by any of these tags
  search?: string        // Search by name or phone
  limit?: number
  offset?: number
}

export interface ImportResult {
  imported: number
  skipped: number
  errors: string[]
}

// =============================================================================
// SERVICE
// =============================================================================

class ContactServiceClass {
  private contacts: Map<string, Contact> = new Map()

  // ===========================================================================
  // CRUD
  // ===========================================================================

  /**
   * Add a new contact or update existing
   */
  addContact(data: { phone: string; name: string; tags?: string[] }): Contact {
    const normalized = this.normalizePhone(data.phone)
    const existing = this.contacts.get(normalized)

    const contact: Contact = {
      phone: normalized,
      name: data.name || existing?.name || '',
      tags: data.tags || existing?.tags || [],
      addedAt: existing?.addedAt || new Date(),
      lastMessageAt: existing?.lastMessageAt || null,
    }

    this.contacts.set(normalized, contact)
    console.log(`[ContactService] Contact added/updated: ${normalized} (${contact.name})`)
    return contact
  }

  /**
   * Get a contact by phone number
   */
  getContact(phone: string): Contact | null {
    const normalized = this.normalizePhone(phone)
    return this.contacts.get(normalized) || null
  }

  /**
   * List contacts with optional filters
   */
  listContacts(filters?: ContactFilters): { contacts: Contact[]; total: number } {
    let results = Array.from(this.contacts.values())

    // Filter by tags
    if (filters?.tags && filters.tags.length > 0) {
      results = results.filter(c =>
        c.tags.some(t => filters.tags!.includes(t))
      )
    }

    // Search by name or phone
    if (filters?.search) {
      const search = filters.search.toLowerCase()
      results = results.filter(c =>
        c.name.toLowerCase().includes(search) ||
        c.phone.includes(search)
      )
    }

    const total = results.length

    // Sort by addedAt descending
    results.sort((a, b) => b.addedAt.getTime() - a.addedAt.getTime())

    // Pagination
    const offset = filters?.offset || 0
    const limit = filters?.limit || 100
    results = results.slice(offset, offset + limit)

    return { contacts: results, total }
  }

  /**
   * Delete a contact
   */
  deleteContact(phone: string): boolean {
    const normalized = this.normalizePhone(phone)
    const existed = this.contacts.has(normalized)
    this.contacts.delete(normalized)
    if (existed) {
      console.log(`[ContactService] Contact deleted: ${normalized}`)
    }
    return existed
  }

  // ===========================================================================
  // TAGS
  // ===========================================================================

  /**
   * Add a tag to a contact
   */
  addTag(phone: string, tag: string): boolean {
    const normalized = this.normalizePhone(phone)
    const contact = this.contacts.get(normalized)
    if (!contact) return false

    if (!contact.tags.includes(tag)) {
      contact.tags.push(tag)
      console.log(`[ContactService] Tag "${tag}" added to ${normalized}`)
    }
    return true
  }

  /**
   * Remove a tag from a contact
   */
  removeTag(phone: string, tag: string): boolean {
    const normalized = this.normalizePhone(phone)
    const contact = this.contacts.get(normalized)
    if (!contact) return false

    const index = contact.tags.indexOf(tag)
    if (index !== -1) {
      contact.tags.splice(index, 1)
      console.log(`[ContactService] Tag "${tag}" removed from ${normalized}`)
      return true
    }
    return false
  }

  /**
   * Get contacts by a specific tag
   */
  getContactsByTag(tag: string): Contact[] {
    return Array.from(this.contacts.values())
      .filter(c => c.tags.includes(tag))
  }

  /**
   * Get all unique tags across all contacts
   */
  getAllTags(): string[] {
    const tags = new Set<string>()
    for (const contact of this.contacts.values()) {
      for (const tag of contact.tags) {
        tags.add(tag)
      }
    }
    return Array.from(tags).sort()
  }

  // ===========================================================================
  // BULK IMPORT
  // ===========================================================================

  /**
   * Import contacts from CSV data
   *
   * Expected CSV format:
   * phone,name,tags
   * +96550123456,Ahmed,customer;vip
   * +96551234567,Sara,lead
   *
   * Tags are semicolon-separated within the tags column.
   */
  importContacts(csvData: string): ImportResult {
    const result: ImportResult = {
      imported: 0,
      skipped: 0,
      errors: [],
    }

    const lines = csvData.trim().split('\n')
    if (lines.length === 0) {
      result.errors.push('Empty CSV data')
      return result
    }

    // Parse header
    const header = lines[0].toLowerCase().trim()
    const columns = header.split(',').map(c => c.trim())
    const phoneIdx = columns.findIndex(c => c === 'phone' || c === 'phonenumber' || c === 'phone_number' || c === 'mobile')
    const nameIdx = columns.findIndex(c => c === 'name' || c === 'fullname' || c === 'full_name' || c === 'contact')
    const tagsIdx = columns.findIndex(c => c === 'tags' || c === 'tag' || c === 'labels' || c === 'label')

    if (phoneIdx === -1) {
      result.errors.push('CSV must have a "phone" column')
      return result
    }

    // Parse rows
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim()
      if (!line) continue

      const values = this.parseCSVLine(line)

      const phone = values[phoneIdx]?.trim()
      if (!phone) {
        result.errors.push(`Row ${i + 1}: Missing phone number`)
        result.skipped++
        continue
      }

      // Validate phone number
      const normalized = this.normalizePhone(phone)
      if (normalized.length < 8) {
        result.errors.push(`Row ${i + 1}: Invalid phone number "${phone}"`)
        result.skipped++
        continue
      }

      const name = nameIdx >= 0 ? (values[nameIdx]?.trim() || '') : ''
      const tagsStr = tagsIdx >= 0 ? (values[tagsIdx]?.trim() || '') : ''
      const tags = tagsStr ? tagsStr.split(';').map(t => t.trim()).filter(Boolean) : []

      this.addContact({ phone: normalized, name, tags })
      result.imported++
    }

    console.log(`[ContactService] Import complete: ${result.imported} imported, ${result.skipped} skipped, ${result.errors.length} errors`)
    return result
  }

  // ===========================================================================
  // TRACKING
  // ===========================================================================

  /**
   * Update the last message timestamp for a contact
   */
  updateLastMessageAt(phone: string): void {
    const normalized = this.normalizePhone(phone)
    const contact = this.contacts.get(normalized)
    if (contact) {
      contact.lastMessageAt = new Date()
    }
  }

  /**
   * Get total contact count
   */
  getCount(): number {
    return this.contacts.size
  }

  // ===========================================================================
  // UTILITIES
  // ===========================================================================

  /**
   * Normalize phone number to E.164 format
   */
  private normalizePhone(phone: string): string {
    let normalized = phone.replace(/[^\d+]/g, '')

    if (!normalized.startsWith('+')) {
      if (normalized.length === 8) {
        normalized = '+965' + normalized
      } else if (normalized.startsWith('00')) {
        normalized = '+' + normalized.substring(2)
      } else {
        normalized = '+' + normalized
      }
    }

    return normalized
  }

  /**
   * Parse a CSV line, handling quoted values
   */
  private parseCSVLine(line: string): string[] {
    const result: string[] = []
    let current = ''
    let inQuotes = false

    for (let i = 0; i < line.length; i++) {
      const char = line[i]

      if (char === '"') {
        inQuotes = !inQuotes
      } else if (char === ',' && !inQuotes) {
        result.push(current)
        current = ''
      } else {
        current += char
      }
    }

    result.push(current)
    return result
  }
}

// Singleton export
export const contactService = new ContactServiceClass()
export default contactService
