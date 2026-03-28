import { db } from '@/db'
import { notifications, users } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { sendEmail, taskAssignedEmail, approvalRequestEmail, deadlineReminderEmail } from './email'

type CreateNotificationParams = {
  userId: number
  title: string
  message: string
  type: 'task' | 'approval' | 'deadline' | 'event' | 'system'
  link?: string
  referenceType?: string
  referenceId?: number
  sendEmailNotification?: boolean
}

export async function createNotification({
  userId,
  title,
  message,
  type,
  link,
  referenceType,
  referenceId,
  sendEmailNotification = true,
}: CreateNotificationParams) {
  await db.insert(notifications).values({
    user_id: userId,
    title,
    message,
    type,
    link: link ?? null,
    reference_type: referenceType ?? null,
    reference_id: referenceId ?? null,
  })

  // Send email notification if configured
  if (sendEmailNotification) {
    try {
      const user = await db.select({ email: users.email }).from(users).where(eq(users.id, userId)).limit(1)
      if (user[0]) {
        await sendEmail({
          to: user[0].email,
          subject: `TEEMS — ${title}`,
          html: `<p>${message}</p>${link ? `<p><a href="${link}">View in TEEMS</a></p>` : ''}`,
        })
      }
    } catch {
      // Don't fail the notification if email fails
    }
  }
}

// ─── Convenience functions ──────────────────────────────────

export async function notifyTaskAssigned(params: {
  assigneeId: number
  taskTitle: string
  eventTitle: string
  eventId: number
  taskId: number
  assignerName: string
}) {
  const email = taskAssignedEmail(params.taskTitle, params.eventTitle, params.assignerName)
  const user = await db.select({ email: users.email }).from(users).where(eq(users.id, params.assigneeId)).limit(1)

  await db.insert(notifications).values({
    user_id: params.assigneeId,
    title: 'Task Assigned',
    message: `You've been assigned: ${params.taskTitle} (${params.eventTitle})`,
    type: 'task',
    link: `/events/${params.eventId}`,
    reference_type: 'task',
    reference_id: params.taskId,
  })

  if (user[0]) {
    await sendEmail({ to: user[0].email, ...email }).catch(() => {})
  }
}

export async function notifyApprovalRequired(params: {
  approverId: number
  approvalTitle: string
  approvalId: number
  requesterName: string
}) {
  const email = approvalRequestEmail(params.approvalTitle, params.requesterName)
  const user = await db.select({ email: users.email }).from(users).where(eq(users.id, params.approverId)).limit(1)

  await db.insert(notifications).values({
    user_id: params.approverId,
    title: 'Approval Required',
    message: `${params.requesterName} needs your approval: ${params.approvalTitle}`,
    type: 'approval',
    link: `/approvals`,
    reference_type: 'approval',
    reference_id: params.approvalId,
  })

  if (user[0]) {
    await sendEmail({ to: user[0].email, ...email }).catch(() => {})
  }
}

export async function notifyDeadlineApproaching(params: {
  userId: number
  taskTitle: string
  eventTitle: string
  eventId: number
  taskId: number
  dueDate: string
}) {
  const email = deadlineReminderEmail(params.taskTitle, params.eventTitle, params.dueDate)
  const user = await db.select({ email: users.email }).from(users).where(eq(users.id, params.userId)).limit(1)

  await db.insert(notifications).values({
    user_id: params.userId,
    title: 'Deadline Approaching',
    message: `Task "${params.taskTitle}" is due on ${params.dueDate}`,
    type: 'deadline',
    link: `/events/${params.eventId}`,
    reference_type: 'task',
    reference_id: params.taskId,
  })

  if (user[0]) {
    await sendEmail({ to: user[0].email, ...email }).catch(() => {})
  }
}
