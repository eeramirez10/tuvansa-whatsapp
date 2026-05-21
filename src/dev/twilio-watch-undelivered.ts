import dotenv from 'dotenv'
import { get } from 'env-var'

const envFile = process.env.NODE_ENV === 'production' ? '.env.production' : '.env.development'
dotenv.config({ path: envFile })

const accountSid = get('TWILIO_ACCOUNT_SID').required().asString()
const authToken = get('TWILIO_AUTH_TOKEN').required().asString()

const pageSize = Number.parseInt(process.env.TWILIO_WATCH_PAGE_SIZE ?? '50', 10)
const intervalMs = Number.parseInt(process.env.TWILIO_WATCH_INTERVAL_MS ?? '15000', 10)

const seen = new Set<string>()

type TwilioMessage = {
  sid: string
  date_created: string
  direction: string
  status: string
  error_code: number | null
  error_message: string | null
  from: string
  to: string
  body: string
}

type TwilioMessageList = {
  messages: TwilioMessage[]
}

const fetchRecentMessages = async (): Promise<TwilioMessage[]> => {
  const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json?PageSize=${pageSize}`
  const basic = Buffer.from(`${accountSid}:${authToken}`).toString('base64')

  const response = await fetch(url, {
    headers: {
      Authorization: `Basic ${basic}`
    }
  })

  if (!response.ok) {
    throw new Error(`Twilio API error ${response.status}`)
  }

  const payload = await response.json() as TwilioMessageList
  return payload.messages ?? []
}

const printFailures = (messages: TwilioMessage[]) => {
  const failed = messages.filter((msg) =>
    msg.direction === 'outbound-api' &&
    ['failed', 'undelivered'].includes(`${msg.status}`.toLowerCase())
  )

  for (const msg of failed) {
    if (seen.has(msg.sid)) continue
    seen.add(msg.sid)

    const preview = (msg.body ?? '').replace(/\s+/g, ' ').trim().slice(0, 120)
    console.log(
      `[TwilioWatch] ${msg.date_created} sid=${msg.sid} status=${msg.status} error_code=${msg.error_code ?? '-'} from=${msg.from} to=${msg.to} body="${preview}"`
    )
  }
}

const tick = async () => {
  try {
    const messages = await fetchRecentMessages()
    printFailures(messages)
  } catch (error: any) {
    console.error('[TwilioWatch] poll error:', error?.message ?? error)
  }
}

console.log(`[TwilioWatch] started (${envFile}) interval=${intervalMs}ms pageSize=${pageSize}`)
void tick()
setInterval(() => {
  void tick()
}, intervalMs)

