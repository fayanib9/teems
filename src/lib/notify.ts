import { db } from '@/db'
import { notifications, users, event_assignments } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { sendEmail, taskAssignedEmail, approvalRequestEmail, deadlineReminderEmail } from './email'

type NotifyParams = {
  userId: number
  title: string
  message: string
  type: 'info' | 'success' | 'warning' | 'error'
  link?: string
  referenceType?: string
  referenceId?: number
  sendEmailNotification?: boolean
}

/** Create notification + optionally email */
export async function notify(params: NotifyParams) {
  const [notif] = await db.insert(notifications).values({
    user_id: params.userId,
    title: params.title,
    message: params.message,
    type: params.type,
    link: params.link || null,
    reference_type: params.referenceType || null,
    reference_id: params.referenceId || null,
    is_read: false,
    is_emailed: false,
  }).returning()

  if (params.sendEmailNotification) {
    const [user] = await db
      .select({ email: users.email })
      .from(users)
      .where(eq(users.id, params.userId))
      .limit(1)

    if (user?.email) {
      const result = await sendEmail({
        to: user.email,
        subject: params.title,
        html: `<p>${params.message}</p>`,
      })
      if (result.success) {
        await db.update(notifications).set({ is_emailed: true }).where(eq(notifications.id, notif.id))
      }
    }
  }

  return notif
}

/** Notify when a task is assigned */
export async function notifyTaskAssigned(
  assigneeId: number,
  taskTitle: string,
  eventTitle: string,
  eventId: number,
  assignerName: string,
) {
  const [notif] = await db.insert(notifications).values({
    user_id: assigneeId,
    title: 'New Task Assigned',
    message: `${assignerName} assigned you the task "${taskTitle}" for event "${eventTitle}"`,
    type: 'info',
    link: `/events/${eventId}?tab=tasks`,
    reference_type: 'task',
    reference_id: eventId,
    is_read: false,
    is_emailed: false,
  }).returning()

  const [user] = await db
    .select({ email: users.email })
    .from(users)
    .where(eq(users.id, assigneeId))
    .limit(1)

  if (user?.email) {
    const template = taskAssignedEmail(taskTitle, eventTitle, assignerName)
    const result = await sendEmail({ to: user.email, ...template })
    if (result.success) {
      await db.update(notifications).set({ is_emailed: true }).where(eq(notifications.id, notif.id))
    }
  }

  return notif
}

/** Notify when approval is requested */
export async function notifyApprovalRequested(
  approverId: number,
  approvalTitle: string,
  approvalId: number,
  requesterName: string,
) {
  const [notif] = await db.insert(notifications).values({
    user_id: approverId,
    title: 'Approval Required',
    message: `${requesterName} submitted "${approvalTitle}" for your approval`,
    type: 'warning',
    link: `/approvals/${approvalId}`,
    reference_type: 'approval',
    reference_id: approvalId,
    is_read: false,
    is_emailed: false,
  }).returning()

  const [user] = await db
    .select({ email: users.email })
    .from(users)
    .where(eq(users.id, approverId))
    .limit(1)

  if (user?.email) {
    const template = approvalRequestEmail(approvalTitle, requesterName)
    const result = await sendEmail({ to: user.email, ...template })
    if (result.success) {
      await db.update(notifications).set({ is_emailed: true }).where(eq(notifications.id, notif.id))
    }
  }

  return notif
}

/** Notify when a task is overdue */
export async function notifyTaskOverdue(
  assigneeId: number,
  taskTitle: string,
  eventTitle: string,
  eventId: number,
  dueDate: string,
) {
  const [notif] = await db.insert(notifications).values({
    user_id: assigneeId,
    title: 'Task Overdue',
    message: `Your task "${taskTitle}" for event "${eventTitle}" was due on ${dueDate}`,
    type: 'error',
    link: `/events/${eventId}?tab=tasks`,
    reference_type: 'task',
    reference_id: eventId,
    is_read: false,
    is_emailed: false,
  }).returning()

  const [user] = await db
    .select({ email: users.email })
    .from(users)
    .where(eq(users.id, assigneeId))
    .limit(1)

  if (user?.email) {
    const template = deadlineReminderEmail(taskTitle, eventTitle, dueDate)
    const result = await sendEmail({ to: user.email, ...template })
    if (result.success) {
      await db.update(notifications).set({ is_emailed: true }).where(eq(notifications.id, notif.id))
    }
  }

  return notif
}

/** Notify on event status change */
export async function notifyEventStatusChange(
  userIds: number[],
  eventTitle: string,
  eventId: number,
  newStatus: string,
) {
  const statusLabels: Record<string, string> = {
    draft: 'Draft',
    planning: 'Planning',
    confirmed: 'Confirmed',
    in_progress: 'In Progress',
    on_hold: 'On Hold',
    postponed: 'Postponed',
    completed: 'Completed',
    cancelled: 'Cancelled',
    archived: 'Archived',
  }

  const label = statusLabels[newStatus] || newStatus

  for (const userId of userIds) {
    await db.insert(notifications).values({
      user_id: userId,
      title: 'Event Status Updated',
      message: `Event "${eventTitle}" status changed to ${label}`,
      type: newStatus === 'cancelled' ? 'error' : 'info',
      link: `/events/${eventId}`,
      reference_type: 'event',
      reference_id: eventId,
      is_read: false,
      is_emailed: false,
    })
  }
}

/** Get user IDs assigned to an event (from event_assignments) */
export async function getEventMemberIds(eventId: number): Promise<number[]> {
  const rows = await db
    .select({ user_id: event_assignments.user_id })
    .from(event_assignments)
    .where(eq(event_assignments.event_id, eventId))
  return rows.map(r => r.user_id)
}
