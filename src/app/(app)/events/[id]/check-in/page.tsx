'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { useParams } from 'next/navigation'
import { QrScanner } from '@/components/ui/qr-scanner'
import { Camera, QrCode, UserCheck, AlertCircle, Search } from 'lucide-react'

type CheckedInEntry = {
  id: string
  name: string
  time: string
}

type ScanFeedback = {
  type: 'success' | 'error'
  message: string
} | null

export default function CheckInPage() {
  const { id } = useParams<{ id: string }>()
  const [eventName, setEventName] = useState('')
  const [scannerActive, setScannerActive] = useState(true)
  const [manualCode, setManualCode] = useState('')
  const [checkedIn, setCheckedIn] = useState<CheckedInEntry[]>([])
  const [feedback, setFeedback] = useState<ScanFeedback>(null)
  const [processing, setProcessing] = useState(false)
  const feedbackTimeout = useRef<NodeJS.Timeout | null>(null)

  // Fetch event name
  useEffect(() => {
    async function fetchEvent() {
      try {
        const res = await fetch(`/api/events/${id}`)
        if (res.ok) {
          const data = await res.json()
          setEventName(data.title ?? data.name ?? `Event #${id}`)
        } else {
          setEventName(`Event #${id}`)
        }
      } catch {
        setEventName(`Event #${id}`)
      }
    }
    if (id) fetchEvent()
  }, [id])

  const showFeedback = useCallback((fb: ScanFeedback) => {
    if (feedbackTimeout.current) clearTimeout(feedbackTimeout.current)
    setFeedback(fb)
    feedbackTimeout.current = setTimeout(() => setFeedback(null), 3500)
  }, [])

  const processCheckIn = useCallback(
    async (code: string) => {
      if (processing) return
      setProcessing(true)

      try {
        const res = await fetch(`/api/events/${id}/check-in`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code }),
        })

        if (res.ok) {
          const data = await res.json()
          const name = data.name ?? data.attendee_name ?? code
          showFeedback({ type: 'success', message: `${name} checked in` })
          setCheckedIn((prev) => [
            {
              id: code,
              name,
              time: new Date().toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit',
              }),
            },
            ...prev,
          ])
        } else {
          const err = await res.json().catch(() => ({}))
          showFeedback({
            type: 'error',
            message: err.error ?? `Check-in failed (${res.status})`,
          })
        }
      } catch {
        showFeedback({ type: 'error', message: 'Network error. Please try again.' })
      } finally {
        setProcessing(false)
      }
    },
    [id, processing, showFeedback]
  )

  const handleScan = useCallback(
    (decodedText: string) => {
      if (processing) return
      processCheckIn(decodedText.trim())
    },
    [processing, processCheckIn]
  )

  const handleManualSubmit = () => {
    const code = manualCode.trim()
    if (!code) return
    processCheckIn(code)
    setManualCode('')
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-8 max-w-2xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 text-brand mb-1">
          <QrCode className="h-5 w-5" />
          <span className="text-sm font-medium uppercase tracking-wide">Check-In</span>
        </div>
        <h1 className="text-2xl md:text-3xl font-bold text-text-primary">Attendee Check-In</h1>
        {eventName && (
          <p className="text-text-secondary mt-1 text-lg">{eventName}</p>
        )}
      </div>

      {/* Session Counter */}
      <div className="flex items-center gap-3 mb-6 bg-surface border border-border rounded-xl px-5 py-4">
        <UserCheck className="h-6 w-6 text-brand" />
        <div>
          <p className="text-2xl font-bold text-text-primary">{checkedIn.length}</p>
          <p className="text-xs text-text-tertiary">Checked in this session</p>
        </div>
      </div>

      {/* Feedback Banner */}
      {feedback && (
        <div
          className={`mb-6 rounded-xl border-2 p-4 flex items-center gap-3 transition-all ${
            feedback.type === 'success'
              ? 'border-green-400 bg-green-50 animate-[pulse-green_0.5s_ease-out]'
              : 'border-red-400 bg-red-50 animate-[pulse-red_0.5s_ease-out]'
          }`}
        >
          {feedback.type === 'success' ? (
            <div className="h-10 w-10 rounded-full bg-green-500 flex items-center justify-center shrink-0">
              <UserCheck className="h-5 w-5 text-white" />
            </div>
          ) : (
            <div className="h-10 w-10 rounded-full bg-red-500 flex items-center justify-center shrink-0">
              <AlertCircle className="h-5 w-5 text-white" />
            </div>
          )}
          <p
            className={`text-base font-medium ${
              feedback.type === 'success' ? 'text-green-800' : 'text-red-800'
            }`}
          >
            {feedback.message}
          </p>
        </div>
      )}

      {/* Scanner Toggle */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setScannerActive(true)}
          className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-medium transition-colors ${
            scannerActive
              ? 'bg-brand text-white'
              : 'bg-surface border border-border text-text-secondary hover:bg-surface-hover'
          }`}
        >
          <Camera className="h-4 w-4" />
          QR Scanner
        </button>
        <button
          onClick={() => setScannerActive(false)}
          className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-medium transition-colors ${
            !scannerActive
              ? 'bg-brand text-white'
              : 'bg-surface border border-border text-text-secondary hover:bg-surface-hover'
          }`}
        >
          <Search className="h-4 w-4" />
          Manual Entry
        </button>
      </div>

      {/* QR Scanner */}
      {scannerActive && (
        <div className="mb-8">
          <QrScanner
            onScan={handleScan}
            onError={(error) => showFeedback({ type: 'error', message: error })}
            width={300}
            height={300}
          />
        </div>
      )}

      {/* Manual Entry */}
      {!scannerActive && (
        <div className="mb-8 bg-surface border border-border rounded-xl p-5">
          <label className="block text-sm font-medium text-text-secondary mb-2">
            Enter attendee code or ticket number
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={manualCode}
              onChange={(e) => setManualCode(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleManualSubmit()}
              placeholder="e.g. ATT-001 or ticket ID..."
              className="flex-1 rounded-xl border border-border bg-background px-4 py-3 text-base text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand"
              autoFocus
            />
            <button
              onClick={handleManualSubmit}
              disabled={processing || !manualCode.trim()}
              className="rounded-xl bg-brand text-white px-6 py-3 text-base font-medium hover:bg-brand/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {processing ? 'Checking...' : 'Check In'}
            </button>
          </div>
        </div>
      )}

      {/* Recently Checked In */}
      {checkedIn.length > 0 && (
        <div>
          <h2 className="text-sm font-medium text-text-secondary mb-3 flex items-center gap-2">
            <UserCheck className="h-4 w-4" />
            Recently Checked In
          </h2>
          <div className="border border-border rounded-xl bg-surface divide-y divide-border overflow-hidden">
            {checkedIn.map((entry, idx) => (
              <div
                key={`${entry.id}-${idx}`}
                className={`flex items-center justify-between px-4 py-3 ${
                  idx === 0 ? 'bg-green-50/50' : ''
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center shrink-0">
                    <UserCheck className="h-4 w-4 text-green-600" />
                  </div>
                  <span className="text-sm font-medium text-text-primary truncate">
                    {entry.name}
                  </span>
                </div>
                <span className="text-xs text-text-tertiary shrink-0 ml-3">
                  {entry.time}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Inline CSS animations for feedback */}
      <style>{`
        @keyframes pulse-green {
          0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.4); }
          50% { transform: scale(1.01); box-shadow: 0 0 0 8px rgba(34, 197, 94, 0); }
          100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(34, 197, 94, 0); }
        }
        @keyframes pulse-red {
          0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.4); }
          50% { transform: scale(1.01); box-shadow: 0 0 0 8px rgba(239, 68, 68, 0); }
          100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); }
        }
      `}</style>
    </div>
  )
}
