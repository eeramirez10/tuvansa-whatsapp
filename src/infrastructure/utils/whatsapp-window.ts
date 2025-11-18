export type SendMode = 'DIRECT' | 'TEMPLATE'

type DecideSendModeReturn = {
  mode: SendMode,
  diffMs: number
  diffHours: number
}

export class WhatsappWindow {


  static decideSendModeFromLastInteraction = (lastInteraction?: Date, now: Date = new Date()): DecideSendModeReturn => {

    if (!lastInteraction || Number.isNaN(lastInteraction.getTime())) {
      return {
        mode: "TEMPLATE",
        diffMs: Number.POSITIVE_INFINITY,
        diffHours: Number.POSITIVE_INFINITY
      }
    }

    const diffMs = now.getTime() - lastInteraction.getTime()

    if (diffMs < 0) {
      return {
        mode: 'DIRECT',
        diffMs,
        diffHours: diffMs / 36e5
      }
    }

    const diffHours = diffMs / 36e5; // 36e5 = 3,600,000 ms = 1 h
    const mode: SendMode = diffHours >= 24 ? 'TEMPLATE' : 'DIRECT';

    return { mode, diffMs, diffHours };



  }
}