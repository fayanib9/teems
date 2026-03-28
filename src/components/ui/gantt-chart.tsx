'use client'

import { useMemo, useRef, useState } from 'react'
import { cn } from '@/lib/utils'

type GanttTask = {
  id: string | number
  title: string
  start: Date
  end: Date
  progress?: number // 0-100
  color?: string
  dependencies?: (string | number)[] // ids of tasks this depends on
  isCriticalPath?: boolean
}

type GanttChartProps = {
  tasks: GanttTask[]
  startDate?: Date
  endDate?: Date
}

const TOADA_PURPLE = '#312C6A'
const LABEL_WIDTH = 200
const ROW_HEIGHT = 40
const HEADER_HEIGHT = 50
const MIN_COL_WIDTH = 36
const DAY_MS = 86_400_000

function startOfDay(d: Date): Date {
  const r = new Date(d)
  r.setHours(0, 0, 0, 0)
  return r
}

function addDays(d: Date, n: number): Date {
  return new Date(d.getTime() + n * DAY_MS)
}

function diffDays(a: Date, b: Date): number {
  return (b.getTime() - a.getTime()) / DAY_MS
}

function formatMonth(d: Date): string {
  return d.toLocaleDateString('en-US', { month: 'short' })
}

function formatDay(d: Date): string {
  return d.getDate().toString()
}

export function GanttChart({ tasks, startDate, endDate }: GanttChartProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [tooltip, setTooltip] = useState<{
    task: GanttTask
    x: number
    y: number
  } | null>(null)

  const { rangeStart, rangeEnd, totalDays, colWidth, dates } = useMemo(() => {
    if (tasks.length === 0) {
      const today = startOfDay(new Date())
      return {
        rangeStart: today,
        rangeEnd: addDays(today, 7),
        totalDays: 7,
        colWidth: MIN_COL_WIDTH,
        dates: Array.from({ length: 7 }, (_, i) => addDays(today, i)),
      }
    }

    let minDate = startDate ? startOfDay(startDate) : startOfDay(tasks[0].start)
    let maxDate = endDate ? startOfDay(endDate) : startOfDay(tasks[0].end)

    if (!startDate || !endDate) {
      for (const t of tasks) {
        const s = startOfDay(t.start)
        const e = startOfDay(t.end)
        if (!startDate && s < minDate) minDate = s
        if (!endDate && e > maxDate) maxDate = e
      }
    }

    // 1-day padding on each side
    const rs = addDays(minDate, -1)
    const re = addDays(maxDate, 1)
    const td = Math.max(1, Math.round(diffDays(rs, re)))
    const cw = Math.max(MIN_COL_WIDTH, Math.min(60, 800 / td))
    const ds = Array.from({ length: td }, (_, i) => addDays(rs, i))

    return { rangeStart: rs, rangeEnd: re, totalDays: td, colWidth: cw, dates: ds }
  }, [tasks, startDate, endDate])

  const chartWidth = totalDays * colWidth
  const chartHeight = tasks.length * ROW_HEIGHT

  const todayOffset = useMemo(() => {
    const today = startOfDay(new Date())
    const offset = diffDays(rangeStart, today)
    if (offset < 0 || offset > totalDays) return null
    return offset * colWidth
  }, [rangeStart, totalDays, colWidth])

  // Group dates by month for the header
  const monthGroups = useMemo(() => {
    const groups: { label: string; startIdx: number; count: number }[] = []
    let current: (typeof groups)[0] | null = null

    for (let i = 0; i < dates.length; i++) {
      const label = formatMonth(dates[i]) + ' ' + dates[i].getFullYear()
      if (current && current.label === label) {
        current.count++
      } else {
        current = { label, startIdx: i, count: 1 }
        groups.push(current)
      }
    }
    return groups
  }, [dates])

  // Build a task index for dependency lookups
  const taskIndex = useMemo(() => {
    const map = new Map<string | number, number>()
    tasks.forEach((t, i) => map.set(t.id, i))
    return map
  }, [tasks])

  // Compute dependency lines
  const depLines = useMemo(() => {
    const lines: { x1: number; y1: number; x2: number; y2: number }[] = []

    for (let i = 0; i < tasks.length; i++) {
      const task = tasks[i]
      if (!task.dependencies?.length) continue

      const taskStart = startOfDay(task.start)
      const taskX = diffDays(rangeStart, taskStart) * colWidth

      for (const depId of task.dependencies) {
        const depIdx = taskIndex.get(depId)
        if (depIdx === undefined) continue

        const dep = tasks[depIdx]
        const depEnd = startOfDay(dep.end)
        const depDuration = Math.max(1, Math.round(diffDays(startOfDay(dep.start), depEnd)))
        const depX = diffDays(rangeStart, startOfDay(dep.start)) * colWidth + depDuration * colWidth

        const fromY = depIdx * ROW_HEIGHT + ROW_HEIGHT / 2
        const toY = i * ROW_HEIGHT + ROW_HEIGHT / 2

        lines.push({ x1: depX, y1: fromY, x2: taskX, y2: toY })
      }
    }
    return lines
  }, [tasks, rangeStart, colWidth, taskIndex])

  function handleBarHover(task: GanttTask, e: React.MouseEvent) {
    const rect = scrollRef.current?.getBoundingClientRect()
    if (!rect) return
    setTooltip({
      task,
      x: e.clientX - rect.left + (scrollRef.current?.scrollLeft ?? 0),
      y: e.clientY - rect.top + (scrollRef.current?.scrollTop ?? 0),
    })
  }

  if (tasks.length === 0) {
    return (
      <div className="flex items-center justify-center rounded-lg border border-gray-200 bg-gray-50 p-12 text-sm text-gray-500">
        No tasks to display
      </div>
    )
  }

  return (
    <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
      <div className="flex">
        {/* Fixed label column */}
        <div
          className="shrink-0 border-r border-gray-200 bg-gray-50"
          style={{ width: LABEL_WIDTH }}
        >
          {/* Header spacer */}
          <div
            className="border-b border-gray-200 px-3 text-xs font-semibold text-gray-600 flex items-end pb-1"
            style={{ height: HEADER_HEIGHT }}
          >
            Task
          </div>
          {/* Task labels */}
          {tasks.map((task) => (
            <div
              key={task.id}
              className="flex items-center border-b border-gray-100 px-3 text-sm text-gray-800 truncate"
              style={{ height: ROW_HEIGHT }}
              title={task.title}
            >
              {task.isCriticalPath && (
                <span className="mr-1.5 inline-block h-2 w-2 shrink-0 rounded-full bg-red-500" />
              )}
              <span className="truncate">{task.title}</span>
            </div>
          ))}
        </div>

        {/* Scrollable chart area */}
        <div
          ref={scrollRef}
          className="relative flex-1 overflow-x-auto"
          onMouseLeave={() => setTooltip(null)}
        >
          {/* Date header */}
          <div
            className="sticky top-0 z-10 border-b border-gray-200 bg-gray-50"
            style={{ width: chartWidth, height: HEADER_HEIGHT }}
          >
            {/* Month row */}
            <div className="flex" style={{ height: 22 }}>
              {monthGroups.map((g) => (
                <div
                  key={g.label + g.startIdx}
                  className="border-r border-gray-200 text-center text-[10px] font-semibold text-gray-600 leading-[22px]"
                  style={{ width: g.count * colWidth }}
                >
                  {g.label}
                </div>
              ))}
            </div>
            {/* Day row */}
            <div className="flex" style={{ height: HEADER_HEIGHT - 22 }}>
              {dates.map((d, i) => {
                const isWeekend = d.getDay() === 0 || d.getDay() === 6
                return (
                  <div
                    key={i}
                    className={cn(
                      'border-r border-gray-100 text-center text-[10px] leading-[28px]',
                      isWeekend ? 'text-gray-400 bg-gray-100/50' : 'text-gray-500'
                    )}
                    style={{ width: colWidth }}
                  >
                    {formatDay(d)}
                  </div>
                )
              })}
            </div>
          </div>

          {/* Chart body */}
          <div className="relative" style={{ width: chartWidth, height: chartHeight }}>
            {/* Grid columns */}
            {dates.map((d, i) => {
              const isWeekend = d.getDay() === 0 || d.getDay() === 6
              return (
                <div
                  key={i}
                  className={cn(
                    'absolute top-0 border-r border-gray-50',
                    isWeekend && 'bg-gray-50/40'
                  )}
                  style={{
                    left: i * colWidth,
                    width: colWidth,
                    height: chartHeight,
                  }}
                />
              )
            })}

            {/* Row lines */}
            {tasks.map((_, i) => (
              <div
                key={i}
                className="absolute left-0 w-full border-b border-gray-100"
                style={{ top: (i + 1) * ROW_HEIGHT }}
              />
            ))}

            {/* Today line */}
            {todayOffset !== null && (
              <div
                className="absolute top-0 z-20 pointer-events-none"
                style={{
                  left: todayOffset,
                  height: chartHeight,
                  width: 0,
                  borderLeft: '2px dashed #ef4444',
                }}
              />
            )}

            {/* Dependency lines (SVG overlay) */}
            {depLines.length > 0 && (
              <svg
                className="absolute inset-0 z-10 pointer-events-none"
                width={chartWidth}
                height={chartHeight}
              >
                <defs>
                  <marker
                    id="gantt-arrow"
                    markerWidth="6"
                    markerHeight="6"
                    refX="5"
                    refY="3"
                    orient="auto"
                  >
                    <path d="M0,0 L6,3 L0,6 Z" fill="#94a3b8" />
                  </marker>
                </defs>
                {depLines.map((line, i) => {
                  const midX = line.x1 + 8
                  return (
                    <g key={i}>
                      {/* Down from predecessor end */}
                      <line
                        x1={line.x1}
                        y1={line.y1}
                        x2={midX}
                        y2={line.y1}
                        stroke="#94a3b8"
                        strokeWidth={1.5}
                      />
                      {/* Vertical connector */}
                      <line
                        x1={midX}
                        y1={line.y1}
                        x2={midX}
                        y2={line.y2}
                        stroke="#94a3b8"
                        strokeWidth={1.5}
                      />
                      {/* Horizontal to successor start */}
                      <line
                        x1={midX}
                        y1={line.y2}
                        x2={line.x2}
                        y2={line.y2}
                        stroke="#94a3b8"
                        strokeWidth={1.5}
                        markerEnd="url(#gantt-arrow)"
                      />
                    </g>
                  )
                })}
              </svg>
            )}

            {/* Task bars */}
            {tasks.map((task, i) => {
              const taskStart = startOfDay(task.start)
              const taskEnd = startOfDay(task.end)
              const durationDays = Math.max(1, Math.round(diffDays(taskStart, taskEnd)))
              const offsetDays = diffDays(rangeStart, taskStart)

              const left = offsetDays * colWidth
              const width = Math.max(colWidth * 0.6, durationDays * colWidth)
              const top = i * ROW_HEIGHT + 8
              const height = ROW_HEIGHT - 16

              const barColor = task.color || TOADA_PURPLE
              const progress = Math.max(0, Math.min(100, task.progress ?? 0))

              return (
                <div
                  key={task.id}
                  className="absolute z-10 cursor-pointer rounded"
                  style={{
                    left,
                    top,
                    width,
                    height,
                    backgroundColor: barColor + '33',
                    border: task.isCriticalPath
                      ? '2px solid #ef4444'
                      : `1px solid ${barColor}66`,
                    borderRadius: 4,
                  }}
                  onMouseMove={(e) => handleBarHover(task, e)}
                  onMouseLeave={() => setTooltip(null)}
                >
                  {/* Progress fill */}
                  <div
                    className="h-full rounded"
                    style={{
                      width: `${progress}%`,
                      backgroundColor: barColor,
                      borderRadius: task.isCriticalPath ? 2 : 3,
                      opacity: 0.85,
                    }}
                  />
                </div>
              )
            })}

            {/* Tooltip */}
            {tooltip && (
              <div
                className="absolute z-50 pointer-events-none rounded-md bg-gray-900 px-3 py-2 text-xs text-white shadow-lg"
                style={{
                  left: tooltip.x + 12,
                  top: tooltip.y - 10,
                  maxWidth: 220,
                }}
              >
                <p className="font-semibold mb-1">{tooltip.task.title}</p>
                <p className="text-gray-300">
                  {tooltip.task.start.toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                  })}{' '}
                  &ndash;{' '}
                  {tooltip.task.end.toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                  })}
                </p>
                {tooltip.task.progress !== undefined && (
                  <p className="text-gray-300 mt-0.5">
                    Progress: {tooltip.task.progress}%
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
