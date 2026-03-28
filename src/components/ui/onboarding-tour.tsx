'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { X, ChevronRight, ChevronLeft } from 'lucide-react'

interface TourStep {
  target: string // CSS selector
  title: string
  content: string
  position?: 'top' | 'bottom' | 'left' | 'right'
}

const TOUR_STEPS: TourStep[] = [
  {
    target: '[data-tour="sidebar"]',
    title: 'Navigation',
    content: 'Access all modules from the sidebar — events, tasks, clients, vendors, and more.',
    position: 'right',
  },
  {
    target: '[data-tour="search"]',
    title: 'Quick Search',
    content: 'Search anything or press Ctrl+K to open the command palette.',
    position: 'bottom',
  },
  {
    target: '[data-tour="notifications"]',
    title: 'Notifications',
    content: 'Stay updated with task assignments, approvals, and event changes.',
    position: 'bottom',
  },
  {
    target: '[data-tour="theme-toggle"]',
    title: 'Theme & Language',
    content: 'Switch between light/dark mode and English/Arabic.',
    position: 'bottom',
  },
  {
    target: '[data-tour="events"]',
    title: 'Events',
    content: 'Create and manage events — the core of TEEMS. Each event has tasks, vendors, budgets, and more.',
    position: 'right',
  },
]

const STORAGE_KEY = 'teems_tour_completed'

export function OnboardingTour() {
  const [active, setActive] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)
  const [tooltipStyle, setTooltipStyle] = useState<React.CSSProperties>({})
  const [arrowStyle, setArrowStyle] = useState<React.CSSProperties>({})
  const [arrowPosition, setArrowPosition] = useState<'top' | 'bottom' | 'left' | 'right'>('top')
  const [highlightStyle, setHighlightStyle] = useState<React.CSSProperties>({})
  const tooltipRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (typeof window === 'undefined') return
    const completed = localStorage.getItem(STORAGE_KEY)
    if (!completed) {
      // Small delay to let the layout render
      const timer = setTimeout(() => setActive(true), 800)
      return () => clearTimeout(timer)
    }
  }, [])

  const positionTooltip = useCallback(() => {
    const step = TOUR_STEPS[currentStep]
    if (!step) return

    const el = document.querySelector(step.target)
    if (!el) return

    const rect = el.getBoundingClientRect()
    const pos = step.position || 'bottom'
    const gap = 12

    // Highlight
    setHighlightStyle({
      position: 'fixed',
      top: rect.top - 4,
      left: rect.left - 4,
      width: rect.width + 8,
      height: rect.height + 8,
      borderRadius: 8,
    })

    // Tooltip positioning
    const style: React.CSSProperties = { position: 'fixed' }
    const arrow: React.CSSProperties = { position: 'absolute' }

    if (pos === 'bottom') {
      style.top = rect.bottom + gap
      style.left = rect.left + rect.width / 2
      style.transform = 'translateX(-50%)'
      arrow.top = -6
      arrow.left = '50%'
      arrow.transform = 'translateX(-50%) rotate(45deg)'
      setArrowPosition('top')
    } else if (pos === 'top') {
      style.bottom = window.innerHeight - rect.top + gap
      style.left = rect.left + rect.width / 2
      style.transform = 'translateX(-50%)'
      arrow.bottom = -6
      arrow.left = '50%'
      arrow.transform = 'translateX(-50%) rotate(45deg)'
      setArrowPosition('bottom')
    } else if (pos === 'right') {
      style.top = rect.top + rect.height / 2
      style.left = rect.right + gap
      style.transform = 'translateY(-50%)'
      arrow.top = '50%'
      arrow.left = -6
      arrow.transform = 'translateY(-50%) rotate(45deg)'
      setArrowPosition('left')
    } else if (pos === 'left') {
      style.top = rect.top + rect.height / 2
      style.right = window.innerWidth - rect.left + gap
      style.transform = 'translateY(-50%)'
      arrow.top = '50%'
      arrow.right = -6
      arrow.transform = 'translateY(-50%) rotate(45deg)'
      setArrowPosition('right')
    }

    setTooltipStyle(style)
    setArrowStyle(arrow)
  }, [currentStep])

  // Find the next valid step (one whose target exists in DOM)
  const findValidStep = useCallback((from: number, direction: 1 | -1): number | null => {
    let idx = from
    while (idx >= 0 && idx < TOUR_STEPS.length) {
      const el = document.querySelector(TOUR_STEPS[idx].target)
      if (el) return idx
      idx += direction
    }
    return null
  }, [])

  useEffect(() => {
    if (!active) return

    // If current target doesn't exist, find the next valid one
    const el = document.querySelector(TOUR_STEPS[currentStep]?.target || '')
    if (!el) {
      const nextValid = findValidStep(currentStep + 1, 1)
      if (nextValid !== null) {
        setCurrentStep(nextValid)
      } else {
        completeTour()
      }
      return
    }

    positionTooltip()
    window.addEventListener('resize', positionTooltip)
    window.addEventListener('scroll', positionTooltip, true)
    return () => {
      window.removeEventListener('resize', positionTooltip)
      window.removeEventListener('scroll', positionTooltip, true)
    }
  }, [active, currentStep, positionTooltip, findValidStep])

  function completeTour() {
    localStorage.setItem(STORAGE_KEY, 'true')
    setActive(false)
  }

  function goNext() {
    const nextValid = findValidStep(currentStep + 1, 1)
    if (nextValid !== null) {
      setCurrentStep(nextValid)
    } else {
      completeTour()
    }
  }

  function goPrev() {
    const prevValid = findValidStep(currentStep - 1, -1)
    if (prevValid !== null) {
      setCurrentStep(prevValid)
    }
  }

  if (!active) return null

  return (
    <>
      {/* Backdrop overlay */}
      <div className="fixed inset-0 z-[9998] bg-black/40 transition-opacity duration-300" />

      {/* Highlight cutout */}
      <div
        className="fixed z-[9999] border-2 border-white/60 pointer-events-none transition-all duration-300 ease-in-out"
        style={highlightStyle}
      >
        <div className="absolute inset-0 rounded-md shadow-[0_0_0_9999px_rgba(0,0,0,0.001)]" />
      </div>

      {/* Tooltip */}
      <div
        ref={tooltipRef}
        className="fixed z-[10000] w-80 bg-[#312C6A] text-white rounded-xl shadow-2xl transition-all duration-300 ease-in-out"
        style={tooltipStyle}
      >
        {/* Arrow */}
        <div
          className="w-3 h-3 bg-[#312C6A]"
          style={arrowStyle}
        />

        <div className="p-4">
          {/* Header */}
          <div className="flex items-start justify-between mb-2">
            <h3 className="text-sm font-semibold">{TOUR_STEPS[currentStep].title}</h3>
            <button
              onClick={completeTour}
              className="text-white/60 hover:text-white transition-colors -mt-0.5 -mr-0.5"
              aria-label="Skip tour"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Content */}
          <p className="text-sm text-white/80 leading-relaxed">
            {TOUR_STEPS[currentStep].content}
          </p>

          {/* Footer */}
          <div className="flex items-center justify-between mt-4">
            <span className="text-xs text-white/50">
              {currentStep + 1} of {TOUR_STEPS.length}
            </span>

            <div className="flex items-center gap-2">
              {currentStep > 0 && (
                <button
                  onClick={goPrev}
                  className="flex items-center gap-1 text-xs text-white/70 hover:text-white transition-colors px-2 py-1 rounded-md hover:bg-white/10"
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                  Back
                </button>
              )}
              <button
                onClick={goNext}
                className="flex items-center gap-1 text-xs font-medium bg-white/20 hover:bg-white/30 transition-colors px-3 py-1.5 rounded-md"
              >
                {currentStep === TOUR_STEPS.length - 1 ? 'Finish' : 'Next'}
                {currentStep < TOUR_STEPS.length - 1 && <ChevronRight className="h-3.5 w-3.5" />}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
