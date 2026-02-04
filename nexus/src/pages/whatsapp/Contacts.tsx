/**
 * WhatsApp Contacts Page
 *
 * Manage contacts for WhatsApp Business campaigns.
 * Features:
 * - View all contacts
 * - Add individual contacts
 * - Import contacts from CSV
 * - Edit/delete contacts
 * - Tag contacts for segmentation
 * - Export contacts
 *
 * Uses AiSensy Contacts API for full CRM functionality.
 */

import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { cn } from '@/lib/utils'

// =============================================================================
// TYPES
// =============================================================================

interface Contact {
  id: string
  name: string
  phoneNumber: string
  email?: string
  tags: string[]
  attributes: Record<string, string>
  createdAt: string
  lastActivity?: string
  optedIn: boolean
}

interface ContactFilters {
  search: string
  tag: string
  optedIn: 'all' | 'yes' | 'no'
}

// =============================================================================
// ICONS
// =============================================================================

function BackIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
    </svg>
  )
}

function SearchIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  )
}

function PlusIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
    </svg>
  )
}

function UploadIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
    </svg>
  )
}

function DownloadIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
    </svg>
  )
}

function TrashIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
  )
}

function EditIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
    </svg>
  )
}

function TagIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
    </svg>
  )
}

function WhatsAppLogo({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
    </svg>
  )
}

// =============================================================================
// ADD CONTACT MODAL
// =============================================================================

interface AddContactModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (contact: Omit<Contact, 'id' | 'createdAt'>) => Promise<void>
  editContact?: Contact | null
}

function AddContactModal({ isOpen, onClose, onSave, editContact }: AddContactModalProps) {
  const [name, setName] = useState('')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [email, setEmail] = useState('')
  const [tags, setTags] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (editContact) {
      setName(editContact.name)
      setPhoneNumber(editContact.phoneNumber)
      setEmail(editContact.email || '')
      setTags(editContact.tags.join(', '))
    } else {
      setName('')
      setPhoneNumber('')
      setEmail('')
      setTags('')
    }
    setError('')
  }, [editContact, isOpen])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    // Validate
    if (!name.trim()) {
      setError('Name is required')
      return
    }
    if (!phoneNumber.trim()) {
      setError('Phone number is required')
      return
    }

    // Format phone number
    const formattedPhone = phoneNumber.replace(/[\s\-\(\)]/g, '')
    if (!/^\+?\d{10,15}$/.test(formattedPhone)) {
      setError('Invalid phone number format')
      return
    }

    setIsSaving(true)
    try {
      await onSave({
        name: name.trim(),
        phoneNumber: formattedPhone,
        email: email.trim() || undefined,
        tags: tags.split(',').map(t => t.trim()).filter(Boolean),
        attributes: {},
        optedIn: true
      })
      onClose()
    } catch (err: any) {
      setError(err.message || 'Failed to save contact')
    } finally {
      setIsSaving(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative bg-slate-900 border border-slate-700 rounded-xl p-6 w-full max-w-md mx-4">
        <h2 className="text-xl font-semibold text-white mb-4">
          {editContact ? 'Edit Contact' : 'Add Contact'}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-slate-400 mb-1">Name *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="John Doe"
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>

          <div>
            <label className="block text-sm text-slate-400 mb-1">Phone Number *</label>
            <input
              type="tel"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder="+1234567890"
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-green-500"
            />
            <p className="text-xs text-slate-500 mt-1">Include country code (e.g., +1 for US)</p>
          </div>

          <div>
            <label className="block text-sm text-slate-400 mb-1">Email (Optional)</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="john@example.com"
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>

          <div>
            <label className="block text-sm text-slate-400 mb-1">Tags (Optional)</label>
            <input
              type="text"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="vip, customer, lead"
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-green-500"
            />
            <p className="text-xs text-slate-500 mt-1">Comma-separated tags for segmentation</p>
          </div>

          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
              {error}
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-slate-700 text-slate-300 rounded-lg hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? 'Saving...' : editContact ? 'Update' : 'Add Contact'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// =============================================================================
// IMPORT CSV MODAL
// =============================================================================

interface ImportModalProps {
  isOpen: boolean
  onClose: () => void
  onImport: (file: File) => Promise<void>
}

function ImportModal({ isOpen, onClose, onImport }: ImportModalProps) {
  const [file, setFile] = useState<File | null>(null)
  const [isImporting, setIsImporting] = useState(false)
  const [error, setError] = useState('')

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      if (selectedFile.type !== 'text/csv' && !selectedFile.name.endsWith('.csv')) {
        setError('Please select a CSV file')
        return
      }
      setFile(selectedFile)
      setError('')
    }
  }

  const handleImport = async () => {
    if (!file) {
      setError('Please select a file')
      return
    }

    setIsImporting(true)
    try {
      await onImport(file)
      onClose()
    } catch (err: any) {
      setError(err.message || 'Failed to import contacts')
    } finally {
      setIsImporting(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative bg-slate-900 border border-slate-700 rounded-xl p-6 w-full max-w-md mx-4">
        <h2 className="text-xl font-semibold text-white mb-4">Import Contacts</h2>

        <div className="space-y-4">
          <div className="p-4 border-2 border-dashed border-slate-700 rounded-lg text-center">
            <UploadIcon className="w-8 h-8 text-slate-500 mx-auto mb-2" />
            <p className="text-sm text-slate-400 mb-2">
              {file ? file.name : 'Drop CSV file here or click to browse'}
            </p>
            <input
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              className="hidden"
              id="csv-upload"
            />
            <label
              htmlFor="csv-upload"
              className="inline-block px-4 py-2 bg-slate-800 text-slate-300 rounded-lg cursor-pointer hover:bg-slate-700 transition-colors"
            >
              Select File
            </label>
          </div>

          <div className="p-3 bg-slate-800/50 rounded-lg">
            <p className="text-sm text-slate-400 font-medium mb-2">CSV Format:</p>
            <code className="text-xs text-green-400">name,phone,email,tags</code>
            <p className="text-xs text-slate-500 mt-1">
              Phone numbers should include country code (e.g., +1234567890)
            </p>
          </div>

          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
              {error}
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-slate-700 text-slate-300 rounded-lg hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleImport}
              disabled={!file || isImporting}
              className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isImporting ? 'Importing...' : 'Import'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export function WhatsAppContacts() {
  const navigate = useNavigate()
  const [contacts, setContacts] = useState<Contact[]>([])
  const [filteredContacts, setFilteredContacts] = useState<Contact[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [filters, setFilters] = useState<ContactFilters>({
    search: '',
    tag: '',
    optedIn: 'all'
  })
  const [showAddModal, setShowAddModal] = useState(false)
  const [showImportModal, setShowImportModal] = useState(false)
  const [editingContact, setEditingContact] = useState<Contact | null>(null)
  const [selectedContacts, setSelectedContacts] = useState<Set<string>>(new Set())
  const [allTags, setAllTags] = useState<string[]>([])

  // Fetch contacts from API
  const fetchContacts = useCallback(async () => {
    try {
      const response = await fetch('/api/whatsapp-business/contacts')
      if (response.ok) {
        const data = await response.json()
        const contactsList = data.contacts || []
        setContacts(contactsList)

        // Extract all unique tags
        const tags = new Set<string>()
        contactsList.forEach((c: Contact) => c.tags.forEach(t => tags.add(t)))
        setAllTags(Array.from(tags))
      }
    } catch (error) {
      console.error('Failed to fetch contacts:', error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchContacts()
  }, [fetchContacts])

  // Filter contacts
  useEffect(() => {
    let result = [...contacts]

    // Search filter
    if (filters.search) {
      const search = filters.search.toLowerCase()
      result = result.filter(c =>
        c.name.toLowerCase().includes(search) ||
        c.phoneNumber.includes(search) ||
        c.email?.toLowerCase().includes(search)
      )
    }

    // Tag filter
    if (filters.tag) {
      result = result.filter(c => c.tags.includes(filters.tag))
    }

    // Opted-in filter
    if (filters.optedIn !== 'all') {
      result = result.filter(c => c.optedIn === (filters.optedIn === 'yes'))
    }

    setFilteredContacts(result)
  }, [contacts, filters])

  // Add/Update contact
  const handleSaveContact = async (contactData: Omit<Contact, 'id' | 'createdAt'>) => {
    const endpoint = editingContact
      ? `/api/whatsapp-business/contacts/${editingContact.id}`
      : '/api/whatsapp-business/contacts'

    const response = await fetch(endpoint, {
      method: editingContact ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(contactData)
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to save contact')
    }

    await fetchContacts()
    setEditingContact(null)
  }

  // Delete contact
  const handleDeleteContact = async (contactId: string) => {
    if (!confirm('Are you sure you want to delete this contact?')) return

    try {
      const response = await fetch(`/api/whatsapp-business/contacts/${contactId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        await fetchContacts()
      }
    } catch (error) {
      console.error('Failed to delete contact:', error)
    }
  }

  // Bulk delete
  const handleBulkDelete = async () => {
    if (!confirm(`Delete ${selectedContacts.size} contacts?`)) return

    try {
      await Promise.all(
        Array.from(selectedContacts).map(id =>
          fetch(`/api/whatsapp-business/contacts/${id}`, { method: 'DELETE' })
        )
      )
      setSelectedContacts(new Set())
      await fetchContacts()
    } catch (error) {
      console.error('Failed to delete contacts:', error)
    }
  }

  // Import CSV
  const handleImportCSV = async (file: File) => {
    const formData = new FormData()
    formData.append('file', file)

    const response = await fetch('/api/whatsapp-business/contacts/import', {
      method: 'POST',
      body: formData
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to import contacts')
    }

    await fetchContacts()
  }

  // Export CSV
  const handleExportCSV = () => {
    const csvContent = [
      'name,phone,email,tags',
      ...filteredContacts.map(c =>
        `"${c.name}","${c.phoneNumber}","${c.email || ''}","${c.tags.join(';')}"`
      )
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `whatsapp-contacts-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  // Toggle select all
  const toggleSelectAll = () => {
    if (selectedContacts.size === filteredContacts.length) {
      setSelectedContacts(new Set())
    } else {
      setSelectedContacts(new Set(filteredContacts.map(c => c.id)))
    }
  }

  // Toggle single select
  const toggleSelect = (contactId: string) => {
    const newSelected = new Set(selectedContacts)
    if (newSelected.has(contactId)) {
      newSelected.delete(contactId)
    } else {
      newSelected.add(contactId)
    }
    setSelectedContacts(newSelected)
  }

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/whatsapp')}
                className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
              >
                <BackIcon className="w-5 h-5" />
              </button>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-500/10 rounded-lg">
                  <WhatsAppLogo className="w-5 h-5 text-green-500" />
                </div>
                <div>
                  <h1 className="text-lg font-semibold text-white">Contacts</h1>
                  <p className="text-xs text-slate-400">{contacts.length} contacts</p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowImportModal(true)}
                className="flex items-center gap-2 px-3 py-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
              >
                <UploadIcon className="w-4 h-4" />
                <span className="hidden sm:inline">Import</span>
              </button>
              <button
                onClick={handleExportCSV}
                className="flex items-center gap-2 px-3 py-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
              >
                <DownloadIcon className="w-4 h-4" />
                <span className="hidden sm:inline">Export</span>
              </button>
              <button
                onClick={() => setShowAddModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors"
              >
                <PlusIcon className="w-4 h-4" />
                Add Contact
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Filters */}
      <div className="border-b border-slate-800 bg-slate-900/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-wrap items-center gap-4">
            {/* Search */}
            <div className="relative flex-1 min-w-[200px]">
              <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="text"
                value={filters.search}
                onChange={(e) => setFilters(f => ({ ...f, search: e.target.value }))}
                placeholder="Search contacts..."
                className="w-full pl-10 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>

            {/* Tag filter */}
            <select
              value={filters.tag}
              onChange={(e) => setFilters(f => ({ ...f, tag: e.target.value }))}
              className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="">All Tags</option>
              {allTags.map(tag => (
                <option key={tag} value={tag}>{tag}</option>
              ))}
            </select>

            {/* Opted-in filter */}
            <select
              value={filters.optedIn}
              onChange={(e) => setFilters(f => ({ ...f, optedIn: e.target.value as ContactFilters['optedIn'] }))}
              className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="all">All Contacts</option>
              <option value="yes">Opted In</option>
              <option value="no">Opted Out</option>
            </select>

            {/* Bulk actions */}
            {selectedContacts.size > 0 && (
              <button
                onClick={handleBulkDelete}
                className="flex items-center gap-2 px-3 py-2 bg-red-500/10 text-red-400 hover:bg-red-500/20 rounded-lg transition-colors"
              >
                <TrashIcon className="w-4 h-4" />
                Delete ({selectedContacts.size})
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Contacts List */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filteredContacts.length === 0 ? (
          <div className="text-center py-12">
            <div className="p-4 bg-slate-800/50 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
              <TagIcon className="w-8 h-8 text-slate-500" />
            </div>
            <h3 className="text-lg font-medium text-white mb-2">No contacts found</h3>
            <p className="text-slate-400 mb-4">
              {filters.search || filters.tag ? 'Try adjusting your filters' : 'Add your first contact to get started'}
            </p>
            {!filters.search && !filters.tag && (
              <button
                onClick={() => setShowAddModal(true)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors"
              >
                <PlusIcon className="w-4 h-4" />
                Add Contact
              </button>
            )}
          </div>
        ) : (
          <div className="bg-slate-900/50 border border-slate-800 rounded-xl overflow-hidden">
            {/* Table Header */}
            <div className="grid grid-cols-[auto_1fr_1fr_1fr_auto] gap-4 p-4 border-b border-slate-800 bg-slate-800/30">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={selectedContacts.size === filteredContacts.length}
                  onChange={toggleSelectAll}
                  className="w-4 h-4 rounded border-slate-600 text-green-500 focus:ring-green-500 bg-slate-700"
                />
              </div>
              <div className="text-sm font-medium text-slate-400">Name</div>
              <div className="text-sm font-medium text-slate-400">Phone</div>
              <div className="text-sm font-medium text-slate-400">Tags</div>
              <div className="text-sm font-medium text-slate-400">Actions</div>
            </div>

            {/* Contact Rows */}
            {filteredContacts.map((contact) => (
              <div
                key={contact.id}
                className={cn(
                  'grid grid-cols-[auto_1fr_1fr_1fr_auto] gap-4 p-4 border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors',
                  selectedContacts.has(contact.id) && 'bg-green-500/5'
                )}
              >
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    checked={selectedContacts.has(contact.id)}
                    onChange={() => toggleSelect(contact.id)}
                    className="w-4 h-4 rounded border-slate-600 text-green-500 focus:ring-green-500 bg-slate-700"
                  />
                </div>
                <div>
                  <p className="text-white font-medium">{contact.name}</p>
                  {contact.email && (
                    <p className="text-sm text-slate-500">{contact.email}</p>
                  )}
                </div>
                <div className="flex items-center">
                  <span className="text-slate-300">{contact.phoneNumber}</span>
                  {!contact.optedIn && (
                    <span className="ml-2 px-2 py-0.5 bg-red-500/10 text-red-400 rounded text-xs">
                      Opted Out
                    </span>
                  )}
                </div>
                <div className="flex items-center flex-wrap gap-1">
                  {contact.tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-2 py-0.5 bg-green-500/10 text-green-400 rounded text-xs"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setEditingContact(contact)
                      setShowAddModal(true)
                    }}
                    className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
                    title="Edit"
                  >
                    <EditIcon className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteContact(contact.id)}
                    className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                    title="Delete"
                  >
                    <TrashIcon className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Modals */}
      <AddContactModal
        isOpen={showAddModal}
        onClose={() => {
          setShowAddModal(false)
          setEditingContact(null)
        }}
        onSave={handleSaveContact}
        editContact={editingContact}
      />

      <ImportModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        onImport={handleImportCSV}
      />
    </div>
  )
}

export default WhatsAppContacts
