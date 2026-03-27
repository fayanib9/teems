import { db } from '@/db'
import { activity_logs } from '@/db/schema'

export type ActivityAction =
  | 'created'
  | 'updated'
  | 'deleted'
  | 'status_changed'
  | 'assigned'
  | 'uploaded'
  | 'approved'
  | 'rejected'

export type ActivityResource =
  | 'event'
  | 'task'
  | 'document'
  | 'approval'
  | 'vendor'
  | 'speaker'
  | 'exhibitor'
  | 'team'
  | 'user'
  | 'settings'

type LogActivityParams = {
  userId: number
  eventId?: number | null
  action: ActivityAction
  resource: ActivityResource
  resourceId?: number | null
  details?: string | null
  ipAddress?: string | null
}

export async function logActivity({
  userId,
  eventId,
  action,
  resource,
  resourceId,
  details,
  ipAddress,
}: LogActivityParams) {
  await db.insert(activity_logs).values({
    user_id: userId,
    event_id: eventId ?? null,
    action,
    resource,
    resource_id: resourceId ?? null,
    details: details ?? null,
    ip_address: ipAddress ?? null,
  })
}
