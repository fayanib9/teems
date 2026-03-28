'use client'

import { useEffect, useRef, useState } from 'react'
import { cn } from '@/lib/utils'
import { Camera } from 'lucide-react'

type QrScannerProps = {
  onScan: (decodedText: string) => void
  onError?: (error: string) => void
  width?: number
  height?: number
}

export function QrScanner({ onScan, onError, width = 300, height = 300 }: QrScannerProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const scannerRef = useRef<any>(null)
  const onScanRef = useRef(onScan)
  const onErrorRef = useRef(onError)
  const [ready, setReady] = useState(false)

  // Keep callback refs current without re-triggering the effect
  useEffect(() => {
    onScanRef.current = onScan
    onErrorRef.current = onError
  }, [onScan, onError])

  useEffect(() => {
    if (typeof window === 'undefined') return

    let scanner: any = null
    let mounted = true

    async function init() {
      try {
        const { Html5QrcodeScanner } = await import('html5-qrcode')

        if (!mounted || !containerRef.current) return

        const elementId = 'qr-scanner-region'

        // Ensure the target element exists
        if (!containerRef.current.querySelector(`#${elementId}`)) {
          const div = document.createElement('div')
          div.id = elementId
          containerRef.current.appendChild(div)
        }

        scanner = new Html5QrcodeScanner(
          elementId,
          {
            fps: 10,
            qrbox: { width: Math.min(width, 250), height: Math.min(height, 250) },
            rememberLastUsedCamera: true,
            showTorchButtonIfSupported: true,
          },
          false // verbose
        )

        scannerRef.current = scanner

        scanner.render(
          (decodedText: string) => {
            onScanRef.current(decodedText)
          },
          () => {
            // Ignore per-frame "no QR found" errors
          }
        )

        setReady(true)
      } catch (err: any) {
        const message =
          err?.toString?.().includes('NotAllowed') || err?.toString?.().includes('Permission')
            ? 'Camera permission denied. Please allow camera access to scan QR codes.'
            : `Failed to start scanner: ${err}`
        onErrorRef.current?.(message)
      }
    }

    init()

    return () => {
      mounted = false
      if (scannerRef.current) {
        scannerRef.current
          .clear()
          .catch(() => {})
      }
    }
  }, [width, height])

  return (
    <div className="space-y-3">
      <div
        ref={containerRef}
        className={cn(
          'rounded-xl border-2 border-border overflow-hidden bg-black/5',
          '[&_#qr-scanner-region]:!border-0',
          '[&_#qr-scanner-region__scan_region]:rounded-lg',
          '[&_#qr-scanner-region__dashboard_section]:!p-3',
          '[&_#qr-scanner-region__dashboard_section]:!border-0',
          '[&_button]:!rounded-lg [&_button]:!px-4 [&_button]:!py-2',
          '[&_button]:!bg-brand [&_button]:!text-white [&_button]:!border-0',
          '[&_button]:!text-sm [&_button]:!cursor-pointer',
          '[&_select]:!rounded-lg [&_select]:!px-3 [&_select]:!py-2 [&_select]:!border-border',
          '[&_a]:!text-brand',
        )}
        style={{ minHeight: height }}
      />
      {!ready && (
        <div className="flex flex-col items-center justify-center gap-2 py-6 text-text-tertiary">
          <Camera className="h-8 w-8 animate-pulse" />
          <p className="text-sm">Initializing camera...</p>
        </div>
      )}
      <p className="text-xs text-text-tertiary text-center">
        Point your camera at a QR code to scan
      </p>
    </div>
  )
}
