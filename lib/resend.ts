import { Resend } from 'resend'

export const resend = new Resend(process.env.RESEND_API_KEY)

export async function addContactToAudience(email: string) {
  const audienceId = process.env.RESEND_AUDIENCE_ID
  if (!audienceId) {
    console.warn('RESEND_AUDIENCE_ID is not set — skipping contact creation')
    return
  }

  try {
    await resend.contacts.create({
      email,
      audienceId,
    })
  } catch (error) {
    console.error('Failed to add contact to Resend:', error)
  }
}
