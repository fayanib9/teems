'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { PageHeader } from '@/components/layout/page-header'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Modal } from '@/components/ui/modal'
import { EmptyState } from '@/components/ui/empty-state'
import { useToast } from '@/components/ui/toast'
import {
  FileText, Plus, Search, Upload, Download, Trash2, Edit,
  File, FileSpreadsheet, FileImage, FileArchive, Eye,
  CalendarDays, User, Tag,
} from 'lucide-react'

const DOCUMENT_CATEGORIES = [
  { value: 'contract', label: 'Contract' },
  { value: 'proposal', label: 'Proposal' },
  { value: 'invoice', label: 'Invoice' },
  { value: 'receipt', label: 'Receipt' },
  { value: 'floor_plan', label: 'Floor Plan' },
  { value: 'presentation', label: 'Presentation' },
  { value: 'permit', label: 'Permit' },
  { value: 'insurance', label: 'Insurance' },
  { value: 'other', label: 'Other' },
]

const CATEGORY_COLORS: Record<string, string> = {
  contract: 'bg-blue-50 text-blue-700',
  proposal: 'bg-purple-50 text-purple-700',
  invoice: 'bg-green-50 text-green-700',
  receipt: 'bg-emerald-50 text-emerald-700',
  floor_plan: 'bg-amber-50 text-amber-700',
  presentation: 'bg-orange-50 text-orange-700',
  permit: 'bg-red-50 text-red-700',
  insurance: 'bg-cyan-50 text-cyan-700',
  other: 'bg-gray-50 text-gray-700',
}

type Doc = {
  id: number
  title: string
  description: string | null
  file_path: string
  file_name: string
  file_size: number | null
  mime_type: string | null
  category: string | null
  version: number | null
  event_id: number | null
  uploaded_by: number | null
  created_at: string | null
  event_title: string | null
  uploader_name: string | null
}

type Props = {
  documents: Doc[]
  events: { id: number; title: string }[]
  canCreate: boolean
  canEdit: boolean
  canDelete: boolean
}

function getFileIcon(mimeType: string | null) {
  if (!mimeType) return File
  if (mimeType.includes('spreadsheet') || mimeType.includes('excel') || mimeType.includes('csv')) return FileSpreadsheet
  if (mimeType.startsWith('image/')) return FileImage
  if (mimeType.includes('zip') || mimeType.includes('archive')) return FileArchive
  return FileText
}

function formatFileSize(bytes: number | null) {
  if (!bytes) return '—'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function formatDate(date: string | null) {
  if (!date) return '—'
  return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export function DocumentsClient({ documents: docs, events, canCreate, canEdit, canDelete }: Props) {
  const router = useRouter()
  const { toast } = useToast()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [showUpload, setShowUpload] = useState(false)
  const [editingDoc, setEditingDoc] = useState<Doc | null>(null)
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)

  // Upload form state
  const [uploadFile, setUploadFile] = useState<File | null>(null)
  const [uploadTitle, setUploadTitle] = useState('')
  const [uploadDescription, setUploadDescription] = useState('')
  const [uploadCategory, setUploadCategory] = useState('other')
  const [uploadEventId, setUploadEventId] = useState('')

  // Edit form state
  const [editTitle, setEditTitle] = useState('')
  const [editDescription, setEditDescription] = useState('')
  const [editCategory, setEditCategory] = useState('')
  const [editEventId, setEditEventId] = useState('')

  const filtered = docs.filter(doc => {
    if (search && !doc.title.toLowerCase().includes(search.toLowerCase()) && !doc.file_name.toLowerCase().includes(search.toLowerCase())) return false
    if (categoryFilter && doc.category !== categoryFilter) return false
    return true
  })

  function openUpload() {
    setUploadFile(null)
    setUploadTitle('')
    setUploadDescription('')
    setUploadCategory('other')
    setUploadEventId('')
    setShowUpload(true)
  }

  function openEdit(doc: Doc) {
    setEditingDoc(doc)
    setEditTitle(doc.title)
    setEditDescription(doc.description || '')
    setEditCategory(doc.category || 'other')
    setEditEventId(doc.event_id ? String(doc.event_id) : '')
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) {
      setUploadFile(file)
      if (!uploadTitle) setUploadTitle(file.name.replace(/\.[^.]+$/, '').replace(/[-_]/g, ' '))
    }
  }

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault()
    if (!uploadFile) {
      toast({ type: 'error', message: 'Please select a file' })
      return
    }
    if (!uploadTitle.trim()) {
      toast({ type: 'error', message: 'Title is required' })
      return
    }

    setUploading(true)
    try {
      // Step 1: Upload file
      const formData = new FormData()
      formData.append('file', uploadFile)
      formData.append('category', 'documents')
      const uploadRes = await fetch('/api/upload', { method: 'POST', body: formData })
      if (!uploadRes.ok) {
        const err = await uploadRes.json()
        throw new Error(err.error || 'Upload failed')
      }
      const fileData = await uploadRes.json()

      // Step 2: Create document record
      const docRes = await fetch('/api/documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: uploadTitle.trim(),
          description: uploadDescription || null,
          category: uploadCategory,
          event_id: uploadEventId || null,
          ...fileData,
        }),
      })
      if (!docRes.ok) throw new Error('Failed to save document')

      toast({ type: 'success', message: 'Document uploaded' })
      setShowUpload(false)
      router.refresh()
    } catch (err: any) {
      toast({ type: 'error', message: err.message || 'Upload failed' })
    } finally {
      setUploading(false)
    }
  }

  async function handleEdit(e: React.FormEvent) {
    e.preventDefault()
    if (!editingDoc) return
    setSaving(true)
    try {
      const res = await fetch(`/api/documents/${editingDoc.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: editTitle.trim(),
          description: editDescription || null,
          category: editCategory,
          event_id: editEventId || null,
        }),
      })
      if (!res.ok) throw new Error('Failed')
      toast({ type: 'success', message: 'Document updated' })
      setEditingDoc(null)
      router.refresh()
    } catch {
      toast({ type: 'error', message: 'Failed to update' })
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!deleteId) return
    try {
      const res = await fetch(`/api/documents/${deleteId}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed')
      toast({ type: 'success', message: 'Document removed' })
      setDeleteId(null)
      router.refresh()
    } catch {
      toast({ type: 'error', message: 'Failed to remove' })
    }
  }

  function getDownloadUrl(doc: Doc) {
    const parts = doc.file_path.replace('data/uploads/', '').split('/')
    return `/api/files/${parts.join('/')}`
  }

  return (
    <>
      <PageHeader
        title="Documents"
        description={`${docs.length} document${docs.length !== 1 ? 's' : ''}`}
        actions={canCreate ? <Button onClick={openUpload}><Upload className="h-4 w-4" /> Upload Document</Button> : undefined}
      />

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-tertiary" />
          <input
            type="text"
            placeholder="Search documents..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-9 pl-9 pr-3 rounded-md border border-border bg-surface text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="h-9 rounded-md border border-border bg-surface px-3 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent appearance-none"
        >
          <option value="">All Categories</option>
          {DOCUMENT_CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
        </select>
      </div>

      {/* Document List */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No documents found"
          description={search || categoryFilter ? 'Try adjusting your filters' : 'Upload your first document'}
          action={canCreate ? { label: 'Upload Document', onClick: openUpload } : undefined}
        />
      ) : (
        <div className="bg-surface rounded-xl border border-border overflow-hidden">
          <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-gray-50">
                <th className="text-left px-4 py-2.5 font-medium text-text-secondary">Document</th>
                <th className="text-left px-4 py-2.5 font-medium text-text-secondary hidden sm:table-cell">Category</th>
                <th className="text-left px-4 py-2.5 font-medium text-text-secondary hidden md:table-cell">Event</th>
                <th className="text-left px-4 py-2.5 font-medium text-text-secondary hidden lg:table-cell">Size</th>
                <th className="text-left px-4 py-2.5 font-medium text-text-secondary hidden lg:table-cell">Uploaded</th>
                <th className="text-right px-4 py-2.5 font-medium text-text-secondary">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(doc => {
                const Icon = getFileIcon(doc.mime_type)
                return (
                  <tr key={doc.id} className="border-b border-border last:border-0 hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-primary-50 flex items-center justify-center shrink-0">
                          <Icon className="h-4.5 w-4.5 text-primary-600" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-text-primary truncate">{doc.title}</p>
                          <p className="text-xs text-text-tertiary truncate">{doc.file_name}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell">
                      {doc.category && (
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${CATEGORY_COLORS[doc.category] || CATEGORY_COLORS.other}`}>
                          {DOCUMENT_CATEGORIES.find(c => c.value === doc.category)?.label || doc.category}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-text-secondary hidden md:table-cell">
                      {doc.event_title || '—'}
                    </td>
                    <td className="px-4 py-3 text-text-secondary hidden lg:table-cell">
                      {formatFileSize(doc.file_size)}
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      <div>
                        <p className="text-text-secondary">{formatDate(doc.created_at)}</p>
                        {doc.uploader_name && <p className="text-xs text-text-tertiary">{doc.uploader_name}</p>}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <a
                          href={getDownloadUrl(doc)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 rounded-md hover:bg-surface-tertiary text-text-tertiary hover:text-text-primary"
                          title="View / Download"
                        >
                          <Download className="h-4 w-4" />
                        </a>
                        {canEdit && (
                          <button onClick={() => openEdit(doc)} className="p-1.5 rounded-md hover:bg-surface-tertiary text-text-tertiary hover:text-text-primary cursor-pointer" title="Edit">
                            <Edit className="h-4 w-4" />
                          </button>
                        )}
                        {canDelete && (
                          <button onClick={() => setDeleteId(doc.id)} className="p-1.5 rounded-md hover:bg-red-50 text-text-tertiary hover:text-red-500 cursor-pointer" title="Remove">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          </div>
        </div>
      )}

      {/* Upload Modal */}
      <Modal open={showUpload} onClose={() => setShowUpload(false)} title="Upload Document" size="lg">
        <form onSubmit={handleUpload} className="space-y-4">
          {/* File Drop Zone */}
          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-border rounded-lg p-6 text-center cursor-pointer hover:border-primary-300 hover:bg-primary-50/30 transition-colors"
          >
            {uploadFile ? (
              <div className="flex items-center justify-center gap-3">
                <FileText className="h-8 w-8 text-primary-500" />
                <div className="text-left">
                  <p className="text-sm font-medium text-text-primary">{uploadFile.name}</p>
                  <p className="text-xs text-text-tertiary">{formatFileSize(uploadFile.size)}</p>
                </div>
              </div>
            ) : (
              <>
                <Upload className="h-8 w-8 text-text-tertiary mx-auto mb-2" />
                <p className="text-sm text-text-secondary">Click to select a file</p>
                <p className="text-xs text-text-tertiary mt-1">PDF, Word, Excel, PowerPoint, Images, ZIP (max 20MB)</p>
              </>
            )}
            <input
              ref={fileInputRef}
              type="file"
              onChange={handleFileSelect}
              className="hidden"
              accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.jpg,.jpeg,.png,.webp,.svg,.txt,.csv,.zip"
            />
          </div>

          <Input
            label="Title"
            value={uploadTitle}
            onChange={(e) => setUploadTitle(e.target.value)}
            placeholder="Document title"
          />

          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-text-primary">Description</label>
            <textarea
              value={uploadDescription}
              onChange={(e) => setUploadDescription(e.target.value)}
              rows={2}
              placeholder="Optional description"
              className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-text-primary">Category</label>
              <select
                value={uploadCategory}
                onChange={(e) => setUploadCategory(e.target.value)}
                className="flex h-9 w-full rounded-md border border-border bg-surface px-3 py-1.5 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent appearance-none"
              >
                {DOCUMENT_CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-text-primary">Event (optional)</label>
              <select
                value={uploadEventId}
                onChange={(e) => setUploadEventId(e.target.value)}
                className="flex h-9 w-full rounded-md border border-border bg-surface px-3 py-1.5 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent appearance-none"
              >
                <option value="">No event</option>
                {events.map(ev => <option key={ev.id} value={ev.id}>{ev.title}</option>)}
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" type="button" onClick={() => setShowUpload(false)}>Cancel</Button>
            <Button type="submit" loading={uploading}>Upload</Button>
          </div>
        </form>
      </Modal>

      {/* Edit Modal */}
      <Modal open={!!editingDoc} onClose={() => setEditingDoc(null)} title="Edit Document" size="lg">
        <form onSubmit={handleEdit} className="space-y-4">
          <Input
            label="Title"
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
          />
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-text-primary">Description</label>
            <textarea
              value={editDescription}
              onChange={(e) => setEditDescription(e.target.value)}
              rows={2}
              className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-text-primary">Category</label>
              <select
                value={editCategory}
                onChange={(e) => setEditCategory(e.target.value)}
                className="flex h-9 w-full rounded-md border border-border bg-surface px-3 py-1.5 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent appearance-none"
              >
                {DOCUMENT_CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-text-primary">Event</label>
              <select
                value={editEventId}
                onChange={(e) => setEditEventId(e.target.value)}
                className="flex h-9 w-full rounded-md border border-border bg-surface px-3 py-1.5 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent appearance-none"
              >
                <option value="">No event</option>
                {events.map(ev => <option key={ev.id} value={ev.id}>{ev.title}</option>)}
              </select>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" type="button" onClick={() => setEditingDoc(null)}>Cancel</Button>
            <Button type="submit" loading={saving}>Update</Button>
          </div>
        </form>
      </Modal>

      {/* Delete Modal */}
      <Modal open={!!deleteId} onClose={() => setDeleteId(null)} title="Remove Document" size="sm">
        <p className="text-sm text-text-secondary mb-4">Are you sure you want to remove this document? It will be archived.</p>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => setDeleteId(null)}>Cancel</Button>
          <Button variant="danger" onClick={handleDelete}>Remove</Button>
        </div>
      </Modal>
    </>
  )
}
