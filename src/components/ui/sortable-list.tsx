'use client'

import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical } from 'lucide-react'
import { cn } from '@/lib/utils'

type SortableListProps<T extends { id: string | number }> = {
  items: T[]
  onReorder: (items: T[]) => void
  renderItem: (item: T, dragHandleProps: React.HTMLAttributes<HTMLElement>) => React.ReactNode
}

function SortableItem({
  id,
  children,
}: {
  id: string | number
  children: (dragHandleProps: React.HTMLAttributes<HTMLElement>) => React.ReactNode
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  const dragHandleProps: React.HTMLAttributes<HTMLElement> = {
    ...attributes,
    ...listeners,
    className: cn(
      'cursor-grab active:cursor-grabbing text-text-tertiary hover:text-text-secondary p-1 rounded touch-none',
      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500'
    ),
    children: <GripVertical className="h-4 w-4" />,
    'aria-label': 'Drag to reorder',
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(isDragging && 'opacity-50 z-10')}
    >
      {children(dragHandleProps)}
    </div>
  )
}

export function SortableList<T extends { id: string | number }>({
  items,
  onReorder,
  renderItem,
}: SortableListProps<T>) {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const oldIndex = items.findIndex((item) => item.id === active.id)
    const newIndex = items.findIndex((item) => item.id === over.id)

    if (oldIndex === -1 || newIndex === -1) return

    const reordered = arrayMove(items, oldIndex, newIndex)
    onReorder(reordered)
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext
        items={items.map((item) => item.id)}
        strategy={verticalListSortingStrategy}
      >
        <div className="space-y-1">
          {items.map((item) => (
            <SortableItem key={item.id} id={item.id}>
              {(dragHandleProps) => renderItem(item, dragHandleProps)}
            </SortableItem>
          ))}
        </div>
      </SortableContext>
    </DndContext>
  )
}
