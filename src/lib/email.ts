import nodemailer from 'nodemailer'

let transporter: nodemailer.Transporter | null = null

function getTransporter() {
  if (transporter) return transporter

  const host = process.env.SMTP_HOST
  const port = parseInt(process.env.SMTP_PORT || '587')
  const user = process.env.SMTP_USER
  const pass = process.env.SMTP_PASS

  if (!host || !user || !pass) {
    console.warn('SMTP not configured — emails will be logged to console')
    return null
  }

  transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  })

  return transporter
}

type SendEmailParams = {
  to: string
  subject: string
  html: string
  from?: string
}

export async function sendEmail({ to, subject, html, from }: SendEmailParams) {
  const sender = from || process.env.SMTP_FROM || 'TEEMS <noreply@toada.com>'
  const transport = getTransporter()

  if (!transport) {
    console.log(`[EMAIL] To: ${to} | Subject: ${subject}`)
    console.log(`[EMAIL] Body: ${html.substring(0, 200)}...`)
    return { success: true, simulated: true }
  }

  try {
    await transport.sendMail({ from: sender, to, subject, html })
    return { success: true }
  } catch (error) {
    console.error('Email send error:', error)
    return { success: false, error }
  }
}

// ─── Email Templates ──────────────────────────────────────────

export function passwordResetEmail(resetUrl: string) {
  return {
    subject: 'TEEMS — Password Reset Request',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #312C6A; padding: 24px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 24px;">TEEMS</h1>
        </div>
        <div style="padding: 32px 24px;">
          <h2 style="color: #111827; margin-top: 0;">Password Reset</h2>
          <p style="color: #6b7280;">You requested a password reset. Click the button below to set a new password. This link expires in 1 hour.</p>
          <div style="text-align: center; margin: 32px 0;">
            <a href="${resetUrl}" style="background: #312C6A; color: white; padding: 12px 32px; border-radius: 8px; text-decoration: none; font-weight: 600;">Reset Password</a>
          </div>
          <p style="color: #9ca3af; font-size: 14px;">If you didn't request this, you can safely ignore this email.</p>
        </div>
      </div>
    `,
  }
}

export function taskAssignedEmail(taskTitle: string, eventTitle: string, assignerName: string) {
  return {
    subject: `TEEMS — Task Assigned: ${taskTitle}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #312C6A; padding: 24px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 24px;">TEEMS</h1>
        </div>
        <div style="padding: 32px 24px;">
          <h2 style="color: #111827; margin-top: 0;">New Task Assignment</h2>
          <p style="color: #6b7280;">${assignerName} assigned you a task:</p>
          <div style="background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; margin: 16px 0;">
            <p style="margin: 0 0 4px 0; font-weight: 600; color: #111827;">${taskTitle}</p>
            <p style="margin: 0; color: #6b7280; font-size: 14px;">Event: ${eventTitle}</p>
          </div>
        </div>
      </div>
    `,
  }
}

export function approvalRequestEmail(approvalTitle: string, requesterName: string) {
  return {
    subject: `TEEMS — Approval Needed: ${approvalTitle}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #312C6A; padding: 24px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 24px;">TEEMS</h1>
        </div>
        <div style="padding: 32px 24px;">
          <h2 style="color: #111827; margin-top: 0;">Approval Required</h2>
          <p style="color: #6b7280;">${requesterName} has submitted an approval request that requires your review:</p>
          <div style="background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; margin: 16px 0;">
            <p style="margin: 0; font-weight: 600; color: #111827;">${approvalTitle}</p>
          </div>
        </div>
      </div>
    `,
  }
}

export function deadlineReminderEmail(taskTitle: string, eventTitle: string, dueDate: string) {
  return {
    subject: `TEEMS — Deadline Approaching: ${taskTitle}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #312C6A; padding: 24px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 24px;">TEEMS</h1>
        </div>
        <div style="padding: 32px 24px;">
          <h2 style="color: #111827; margin-top: 0;">Deadline Reminder</h2>
          <p style="color: #6b7280;">A task deadline is approaching:</p>
          <div style="background: #FEF3C7; border: 1px solid #F59E0B; border-radius: 8px; padding: 16px; margin: 16px 0;">
            <p style="margin: 0 0 4px 0; font-weight: 600; color: #111827;">${taskTitle}</p>
            <p style="margin: 0 0 4px 0; color: #6b7280; font-size: 14px;">Event: ${eventTitle}</p>
            <p style="margin: 0; color: #D97706; font-size: 14px; font-weight: 600;">Due: ${dueDate}</p>
          </div>
        </div>
      </div>
    `,
  }
}
