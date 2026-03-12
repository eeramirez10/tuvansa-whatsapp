import { SendInProgressQuoteRemindersUseCase } from "./send-in-progress-quote-reminders.use-case";

export class InProgressQuoteRemindersScheduler {
  private timer: NodeJS.Timeout | null = null
  private isRunning = false
  private readonly businessDays = new Set(['Mon', 'Tue', 'Wed', 'Thu', 'Fri'])
  private readonly businessStartMinutes = (8 * 60) + 30
  private readonly businessEndMinutes = 18 * 60
  private readonly timeZone = 'America/Mexico_City'
  private readonly clockFormatter = new Intl.DateTimeFormat('en-US', {
    timeZone: this.timeZone,
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  })

  constructor(
    private readonly useCase: SendInProgressQuoteRemindersUseCase,
    private readonly intervalMs: number = 15 * 60 * 1000
  ) { }

  start() {
    if (this.timer) return

    this.run().catch((error) => {
      console.error('[QuoteReminderScheduler] Initial run failed', error)
    })

    this.timer = setInterval(() => {
      this.run().catch((error) => {
        console.error('[QuoteReminderScheduler] Run failed', error)
      })
    }, this.intervalMs)
  }

  stop() {
    if (!this.timer) return
    clearInterval(this.timer)
    this.timer = null
  }

  private async run() {
    if (this.isRunning) return
    if (!this.isBusinessTime(new Date())) return

    this.isRunning = true
    try {
      const result = await this.useCase.execute()
      if (result.due > 0 || result.failed > 0) {
        console.log(
          `[QuoteReminderScheduler] due=${result.due} sent=${result.sent} failed=${result.failed} skipped=${result.skipped}`
        )
      }
    } finally {
      this.isRunning = false
    }
  }

  private isBusinessTime(date: Date): boolean {
    const parts = this.clockFormatter.formatToParts(date)
    const weekday = parts.find((part) => part.type === 'weekday')?.value ?? ''
    const hour = Number(parts.find((part) => part.type === 'hour')?.value ?? '0')
    const minute = Number(parts.find((part) => part.type === 'minute')?.value ?? '0')

    if (!this.businessDays.has(weekday)) return false

    const totalMinutes = (hour * 60) + minute
    return totalMinutes >= this.businessStartMinutes && totalMinutes <= this.businessEndMinutes
  }
}
