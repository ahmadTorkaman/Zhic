const SMS_IR_API = 'https://api.sms.ir/v1/send'

export type SmsResult = { ok: boolean; error?: string }

export async function sendSms(args: {
  to: string
  text: string
}): Promise<SmsResult> {
  // Dry-run gate — Tier 2 (zhic.ir) sets SMS_DRY_RUN=true so owner-review
  // submissions don't text real showroom managers.
  if (process.env.SMS_DRY_RUN === 'true') {
    console.info('[@zhic/sms] DRY_RUN — would have sent:', { to: args.to, text: args.text })
    return { ok: true }
  }

  const apiKey = process.env.SMS_IR_API_KEY
  const lineNumber = process.env.SMS_IR_LINE_NUMBER

  if (!apiKey || !lineNumber) {
    console.warn(
      '[@zhic/sms] SMS_IR_API_KEY or SMS_IR_LINE_NUMBER not set — skipping SMS',
    )
    return { ok: false, error: 'SMS credentials not configured' }
  }

  try {
    const res = await fetch(SMS_IR_API, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
      },
      body: JSON.stringify({
        lineNumber,
        messageText: args.text,
        mobiles: [args.to],
      }),
    })

    if (!res.ok) {
      const body = await res.text().catch(() => '')
      console.error(`[@zhic/sms] SMS.ir returned ${res.status}: ${body}`)
      return { ok: false, error: `SMS.ir error: ${res.status}` }
    }

    return { ok: true }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error(`[@zhic/sms] Failed to send SMS: ${message}`)
    return { ok: false, error: message }
  }
}

export type InquiryData = {
  name: string
  phone: string
  city: string
  reason: 'price_inquiry' | 'showroom_visit'
  message?: string
  productName?: string
}

const REASON_LABEL: Record<InquiryData['reason'], string> = {
  price_inquiry: 'استعلام قیمت',
  showroom_visit: 'رزرو بازدید',
}

export function formatInquirySms(data: InquiryData): string {
  const lines = [
    'استعلام جدید از سایت ژیک',
    `نام: ${data.name}`,
    `تلفن: ${data.phone}`,
    `شهر: ${data.city}`,
    `موضوع: ${REASON_LABEL[data.reason]}`,
  ]
  if (data.productName) {
    lines.push(`محصول: ${data.productName}`)
  }
  if (data.message) {
    lines.push(`پیام: ${data.message}`)
  }
  return lines.join('\n')
}
