'use client'

import { cn } from '@/lib/utils'
import { Minus, Plus } from 'lucide-react'
import { useCallback, useRef, useState } from 'react'

export type Booth = {
  id: string | number
  label: string
  x: number
  y: number
  width: number
  height: number
  color?: string
  status?: 'available' | 'reserved' | 'occupied'
  assignee?: string
}

export type FloorPlanEditorProps = {
  booths: Booth[]
  gridCols?: number
  gridRows?: number
  cellSize?: number
  readOnly?: boolean
  onBoothClick?: (booth: Booth) => void
  onBoothMove?: (boothId: string | number, x: number, y: number) => void
  selectedBoothId?: string | number | null
}

const STATUS_STYLES: Record<string, string> = {
  available: 'bg-emerald-50 border-emerald-300',
  reserved: 'bg-amber-50 border-amber-300',
  occupied: 'bg-blue-50 border-blue-300',
}

const STATUS_LABELS: Record<string, string> = {
  available: 'Available',
  reserved: 'Reserved',
  occupied: 'Occupied',
}

function colLabel(index: number): string {
  let label = ''
  let n = index
  while (n >= 0) {
    label = String.fromCharCode(65 + (n % 26)) + label
    n = Math.floor(n / 26) - 1
  }
  return label
}

export function FloorPlanEditor({
  booths,
  gridCols = 20,
  gridRows = 15,
  cellSize: initialCellSize = 40,
  readOnly = false,
  onBoothClick,
  onBoothMove,
  selectedBoothId,
}: FloorPlanEditorProps) {
  const [cellSize, setCellSize] = useState(initialCellSize)
  const [dragState, setDragState] = useState<{
    boothId: string | number
    startMouseX: number
    startMouseY: number
    startGridX: number
    startGridY: number
    currentGridX: number
    currentGridY: number
  } | null>(null)

  const gridRef = useRef<HTMLDivElement>(null)

  const zoomIn = () => setCellSize((s) => Math.min(s + 10, 100))
  const zoomOut = () => setCellSize((s) => Math.max(s - 10, 20))

  const getGridPosition = useCallback(
    (clientX: number, clientY: number) => {
      if (!gridRef.current) return { x: 0, y: 0 }
      const rect = gridRef.current.getBoundingClientRect()
      const scrollLeft = gridRef.current.scrollLeft
      const scrollTop = gridRef.current.scrollTop
      // offset by header column (cellSize width for row numbers)
      const x = Math.floor((clientX - rect.left + scrollLeft - cellSize) / cellSize)
      const y = Math.floor((clientY - rect.top + scrollTop - cellSize) / cellSize)
      return { x: Math.max(0, x), y: Math.max(0, y) }
    },
    [cellSize],
  )

  const handleMouseDown = useCallback(
    (e: React.MouseEvent, booth: Booth) => {
      if (readOnly) return
      e.preventDefault()
      e.stopPropagation()
      setDragState({
        boothId: booth.id,
        startMouseX: e.clientX,
        startMouseY: e.clientY,
        startGridX: booth.x,
        startGridY: booth.y,
        currentGridX: booth.x,
        currentGridY: booth.y,
      })
    },
    [readOnly],
  )

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!dragState) return
      const dx = Math.round((e.clientX - dragState.startMouseX) / cellSize)
      const dy = Math.round((e.clientY - dragState.startMouseY) / cellSize)
      const booth = booths.find((b) => b.id === dragState.boothId)
      if (!booth) return

      const newX = Math.max(0, Math.min(dragState.startGridX + dx, gridCols - booth.width))
      const newY = Math.max(0, Math.min(dragState.startGridY + dy, gridRows - booth.height))

      if (newX !== dragState.currentGridX || newY !== dragState.currentGridY) {
        setDragState((prev) => (prev ? { ...prev, currentGridX: newX, currentGridY: newY } : null))
      }
    },
    [dragState, booths, cellSize, gridCols, gridRows],
  )

  const handleMouseUp = useCallback(() => {
    if (!dragState) return
    if (dragState.currentGridX !== dragState.startGridX || dragState.currentGridY !== dragState.startGridY) {
      onBoothMove?.(dragState.boothId, dragState.currentGridX, dragState.currentGridY)
    }
    setDragState(null)
  }, [dragState, onBoothMove])

  const handleBoothClick = useCallback(
    (booth: Booth) => {
      if (dragState) return
      onBoothClick?.(booth)
    },
    [dragState, onBoothClick],
  )

  // Total grid size including headers
  const totalWidth = (gridCols + 1) * cellSize
  const totalHeight = (gridRows + 1) * cellSize

  return (
    <div className="flex flex-col gap-3">
      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={zoomOut}
            className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-border bg-surface hover:bg-surface-secondary"
          >
            <Minus className="h-4 w-4" />
          </button>
          <span className="text-sm text-text-secondary min-w-[3rem] text-center">{cellSize}px</span>
          <button
            type="button"
            onClick={zoomIn}
            className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-border bg-surface hover:bg-surface-secondary"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4">
          {Object.entries(STATUS_LABELS).map(([status, label]) => (
            <div key={status} className="flex items-center gap-1.5">
              <div className={cn('h-3 w-3 rounded-sm border', STATUS_STYLES[status])} />
              <span className="text-xs text-text-secondary">{label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Grid area */}
      <div
        ref={gridRef}
        className="overflow-auto rounded-lg border border-border bg-white"
        style={{ maxHeight: '70vh' }}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <div
          className="relative"
          style={{ width: totalWidth, height: totalHeight }}
        >
          {/* Column headers */}
          {Array.from({ length: gridCols }, (_, i) => (
            <div
              key={`col-${i}`}
              className="absolute flex items-center justify-center text-[10px] font-medium text-text-secondary select-none"
              style={{
                left: (i + 1) * cellSize,
                top: 0,
                width: cellSize,
                height: cellSize,
              }}
            >
              {colLabel(i)}
            </div>
          ))}

          {/* Row headers */}
          {Array.from({ length: gridRows }, (_, i) => (
            <div
              key={`row-${i}`}
              className="absolute flex items-center justify-center text-[10px] font-medium text-text-secondary select-none"
              style={{
                left: 0,
                top: (i + 1) * cellSize,
                width: cellSize,
                height: cellSize,
              }}
            >
              {i + 1}
            </div>
          ))}

          {/* Grid cells */}
          {Array.from({ length: gridRows }, (_, row) =>
            Array.from({ length: gridCols }, (_, col) => (
              <div
                key={`cell-${row}-${col}`}
                className="absolute border-r border-b border-gray-100"
                style={{
                  left: (col + 1) * cellSize,
                  top: (row + 1) * cellSize,
                  width: cellSize,
                  height: cellSize,
                }}
              />
            )),
          )}

          {/* Booths */}
          {booths.map((booth) => {
            const isDragging = dragState?.boothId === booth.id
            const posX = isDragging ? dragState.currentGridX : booth.x
            const posY = isDragging ? dragState.currentGridY : booth.y
            const status = booth.status || 'available'
            const isSelected = selectedBoothId === booth.id

            return (
              <div
                key={booth.id}
                className={cn(
                  'absolute rounded-md border-2 p-1.5 flex flex-col justify-center items-center overflow-hidden transition-shadow',
                  STATUS_STYLES[status],
                  isSelected && 'ring-2 ring-offset-1',
                  !readOnly && 'cursor-grab active:cursor-grabbing',
                  isDragging && 'opacity-80 shadow-lg z-20',
                  !isDragging && 'z-10',
                )}
                style={{
                  left: (posX + 1) * cellSize + 2,
                  top: (posY + 1) * cellSize + 2,
                  width: booth.width * cellSize - 4,
                  height: booth.height * cellSize - 4,
                  ...(isSelected ? { borderColor: '#312C6A', ringColor: '#312C6A' } : {}),
                  ...(isSelected ? { boxShadow: '0 0 0 2px rgba(49, 44, 106, 0.3)' } : {}),
                  ...(booth.color ? { backgroundColor: booth.color } : {}),
                }}
                onMouseDown={(e) => handleMouseDown(e, booth)}
                onClick={() => handleBoothClick(booth)}
              >
                <span className="text-xs font-semibold text-text-primary truncate w-full text-center leading-tight">
                  {booth.label}
                </span>
                {booth.assignee && (
                  <span className="text-[10px] text-text-secondary truncate w-full text-center leading-tight mt-0.5">
                    {booth.assignee}
                  </span>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
