'use client'

import { useState, useEffect, useCallback } from 'react'
import { PageHeader } from '@/components/layout/page-header'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Modal } from '@/components/ui/modal'
import { formatDate, timeAgo } from '@/lib/utils'
import {
  MessageSquare, Send, Plus, ArrowLeft, Inbox,
  CheckCheck, Clock, Paperclip,
} from 'lucide-react'

type Message = {
  id: number
  event_id: number
  event_title: string
  sender_id: number
  sender_name: string
  sender_role: string
  recipient_id: number | null
  subject: string | null
  content: string
  is_read: boolean
  read_at: string | null
  parent_id: number | null
  attachment_path: string | null
  created_at: string
  replies?: Message[]
}

type EventOption = {
  id: number
  title: string
}

export default function PortalMessagesPage() {
  const [messages, setMessages] = useState<Message[]>([])
  const [events, setEvents] = useState<EventOption[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedThread, setSelectedThread] = useState<Message | null>(null)
  const [showCompose, setShowCompose] = useState(false)
  const [replyContent, setReplyContent] = useState('')
  const [sending, setSending] = useState(false)

  // Compose form
  const [composeEventId, setComposeEventId] = useState('')
  const [composeSubject, setComposeSubject] = useState('')
  const [composeContent, setComposeContent] = useState('')

  const fetchMessages = useCallback(async () => {
    try {
      const res = await fetch('/api/portal/messages')
      if (res.ok) {
        const data = await res.json()
        setMessages(data.data || [])
        // Extract unique events
        const eventMap = new Map<number, string>()
        for (const m of (data.data || [])) {
          if (m.event_id && m.event_title) eventMap.set(m.event_id, m.event_title)
        }
        setEvents(Array.from(eventMap, ([id, title]) => ({ id, title })))
      }
    } catch { /* silent */ }
    setLoading(false)
  }, [])

  useEffect(() => { fetchMessages() }, [fetchMessages])

  // Also fetch events for compose
  useEffect(() => {
    async function fetchEvents() {
      try {
        const res = await fetch('/api/portal/events')
        if (res.ok) {
          const data = await res.json()
          const evts = (data.data || data || []).map((e: { id: number; title: string }) => ({ id: e.id, title: e.title }))
          setEvents(prev => {
            const merged = new Map<number, string>()
            for (const e of prev) merged.set(e.id, e.title)
            for (const e of evts) merged.set(e.id, e.title)
            return Array.from(merged, ([id, title]) => ({ id, title }))
          })
        }
      } catch {}
    }
    fetchEvents()
  }, [])

  async function handleCompose(e: React.FormEvent) {
    e.preventDefault()
    if (!composeEventId || !composeContent.trim()) return
    setSending(true)
    try {
      const res = await fetch('/api/portal/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event_id: Number(composeEventId),
          subject: composeSubject || undefined,
          content: composeContent,
        }),
      })
      if (res.ok) {
        setShowCompose(false)
        setComposeEventId('')
        setComposeSubject('')
        setComposeContent('')
        fetchMessages()
      }
    } catch { /* silent */ }
    setSending(false)
  }

  async function handleReply() {
    if (!selectedThread || !replyContent.trim()) return
    setSending(true)
    try {
      const res = await fetch('/api/portal/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event_id: selectedThread.event_id,
          content: replyContent,
          parent_id: selectedThread.id,
        }),
      })
      if (res.ok) {
        setReplyContent('')
        fetchMessages()
        // Refresh thread
        const data = await res.json()
        if (data.data) {
          setSelectedThread(prev => prev ? {
            ...prev,
            replies: [...(prev.replies || []), data.data],
          } : prev)
        }
      }
    } catch { /* silent */ }
    setSending(false)
  }

  // Group messages by thread (top-level only)
  const threads = messages.filter(m => !m.parent_id)

  if (loading) {
    return (
      <>
        <PageHeader title="Messages" description="Communicate with your event team" />
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-surface rounded-xl border border-border p-5 animate-pulse">
              <div className="h-4 bg-surface-tertiary rounded w-1/3 mb-2" />
              <div className="h-3 bg-surface-tertiary rounded w-2/3" />
            </div>
          ))}
        </div>
      </>
    )
  }

  // Thread detail view
  if (selectedThread) {
    const threadReplies = messages.filter(m => m.parent_id === selectedThread.id)
    return (
      <>
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={() => setSelectedThread(null)}
            className="h-9 w-9 flex items-center justify-center rounded-lg hover:bg-surface-tertiary text-text-secondary"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div>
            <h1 className="text-lg font-semibold text-text-primary">
              {selectedThread.subject || 'Message'}
            </h1>
            <p className="text-xs text-text-secondary">{selectedThread.event_title}</p>
          </div>
        </div>

        <div className="bg-surface rounded-xl border border-border overflow-hidden">
          {/* Original message */}
          <div className="p-5 border-b border-border-light">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-xs font-medium">
                  {selectedThread.sender_name?.split(' ').map(n => n[0]).join('').slice(0, 2)}
                </div>
                <div>
                  <p className="text-sm font-medium text-text-primary">{selectedThread.sender_name}</p>
                  <p className="text-[11px] text-text-tertiary capitalize">{selectedThread.sender_role}</p>
                </div>
              </div>
              <span className="text-xs text-text-tertiary">{timeAgo(selectedThread.created_at)}</span>
            </div>
            <p className="text-sm text-text-primary whitespace-pre-wrap">{selectedThread.content}</p>
          </div>

          {/* Replies */}
          {threadReplies.map(reply => (
            <div key={reply.id} className="p-5 border-b border-border-light bg-surface-secondary/30">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-xs font-medium">
                    {reply.sender_name?.split(' ').map(n => n[0]).join('').slice(0, 2)}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-text-primary">{reply.sender_name}</p>
                    <p className="text-[11px] text-text-tertiary capitalize">{reply.sender_role}</p>
                  </div>
                </div>
                <span className="text-xs text-text-tertiary">{timeAgo(reply.created_at)}</span>
              </div>
              <p className="text-sm text-text-primary whitespace-pre-wrap">{reply.content}</p>
            </div>
          ))}

          {/* Reply input */}
          <div className="p-4 bg-surface-secondary/50">
            <div className="flex gap-2">
              <textarea
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                placeholder="Type your reply..."
                rows={2}
                className="flex-1 rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
              />
              <Button onClick={handleReply} loading={sending} disabled={!replyContent.trim()}>
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </>
    )
  }

  return (
    <>
      <PageHeader
        title="Messages"
        description="Communicate with your event team"
        actions={
          <Button onClick={() => setShowCompose(true)}>
            <Plus className="h-4 w-4 mr-1.5" />
            New Message
          </Button>
        }
      />

      {threads.length === 0 ? (
        <div className="bg-surface rounded-xl border border-border p-12 text-center">
          <Inbox className="h-10 w-10 text-text-tertiary mx-auto mb-3" />
          <p className="text-sm font-medium text-text-primary mb-1">No messages yet</p>
          <p className="text-xs text-text-secondary mb-4">Start a conversation with your event team</p>
          <Button onClick={() => setShowCompose(true)} size="sm">
            <Plus className="h-3.5 w-3.5 mr-1" /> Send First Message
          </Button>
        </div>
      ) : (
        <div className="bg-surface rounded-xl border border-border overflow-hidden divide-y divide-border-light">
          {threads.map(thread => {
            const replyCount = messages.filter(m => m.parent_id === thread.id).length
            return (
              <button
                key={thread.id}
                onClick={() => setSelectedThread(thread)}
                className={`w-full text-left px-5 py-4 hover:bg-surface-secondary/50 transition-colors ${
                  !thread.is_read ? 'bg-primary-50/30' : ''
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      {!thread.is_read && (
                        <span className="h-2 w-2 rounded-full bg-primary-500 shrink-0" />
                      )}
                      <p className="text-sm font-medium text-text-primary truncate">
                        {thread.subject || 'No subject'}
                      </p>
                    </div>
                    <p className="text-xs text-text-secondary line-clamp-1">{thread.content}</p>
                    <div className="flex items-center gap-3 mt-1.5">
                      <span className="text-[11px] text-text-tertiary">{thread.sender_name}</span>
                      <Badge color="gray" className="text-[10px]">{thread.event_title}</Badge>
                      {replyCount > 0 && (
                        <span className="flex items-center gap-0.5 text-[11px] text-text-tertiary">
                          <MessageSquare className="h-3 w-3" /> {replyCount}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[11px] text-text-tertiary">{timeAgo(thread.created_at)}</span>
                    {thread.is_read ? (
                      <CheckCheck className="h-3.5 w-3.5 text-primary-500" />
                    ) : (
                      <Clock className="h-3.5 w-3.5 text-text-tertiary" />
                    )}
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      )}

      {/* Compose Modal */}
      <Modal open={showCompose} onClose={() => setShowCompose(false)} title="New Message">
        <form onSubmit={handleCompose} className="space-y-4">
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-text-primary">Event</label>
            <select
              value={composeEventId}
              onChange={(e) => setComposeEventId(e.target.value)}
              required
              className="w-full h-9 rounded-md border border-border bg-surface px-3 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="">Select event...</option>
              {events.map(evt => (
                <option key={evt.id} value={evt.id}>{evt.title}</option>
              ))}
            </select>
          </div>
          <Input
            label="Subject"
            value={composeSubject}
            onChange={(e) => setComposeSubject(e.target.value)}
            placeholder="Optional subject line"
          />
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-text-primary">Message</label>
            <textarea
              value={composeContent}
              onChange={(e) => setComposeContent(e.target.value)}
              placeholder="Type your message..."
              rows={4}
              required
              className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => setShowCompose(false)}>Cancel</Button>
            <Button type="submit" loading={sending}>
              <Send className="h-4 w-4 mr-1.5" /> Send
            </Button>
          </div>
        </form>
      </Modal>
    </>
  )
}
