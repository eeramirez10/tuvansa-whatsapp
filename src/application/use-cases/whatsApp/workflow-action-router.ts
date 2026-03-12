export type WorkflowActionType = 'VIEW' | 'DOWNLOAD' | 'ACCEPT' | 'REJECT_MENU' | 'QUOTED' | 'REJECTED' | 'HELP' | 'UNKNOWN'

export interface WorkflowAction {
  type: WorkflowActionType
  quoteNumber?: number
  erpQuoteNumber?: string
  reason?: string
  source: 'template_payload' | 'template_text' | 'text' | 'unknown'
  raw: string
}

interface RouteInput {
  body?: string
  messageType?: string
  payload?: Record<string, any>
}

export class WorkflowActionRouter {
  route(input: RouteInput): WorkflowAction {
    const candidates = this.getCandidates(input)

    for (const candidate of candidates) {
      const structured = this.parseStructuredAction(candidate.value, candidate.source)
      if (structured.type !== 'UNKNOWN') return structured
    }

    const body = `${input.body ?? ''}`.trim()
    if (!body) {
      return { type: 'HELP', source: 'text', raw: body }
    }

    const textAction = this.parseTextAction(body)
    if (textAction.type !== 'UNKNOWN') return textAction

    return { type: 'UNKNOWN', source: 'unknown', raw: body }
  }

  private getCandidates(input: RouteInput): Array<{ value: string, source: WorkflowAction['source'] }> {
    const payload = input.payload ?? {}
    const values: Array<{ value: string, source: WorkflowAction['source'] }> = []

    const templatePayloadFields = [
      payload.ButtonPayload,
      payload.button_payload,
      payload.PostbackData,
      payload.postbackData,
      payload.ListId,
      payload.list_id,
      payload.ActionPayload,
      payload.action_payload,
    ]

    for (const raw of templatePayloadFields) {
      const value = `${raw ?? ''}`.trim()
      if (value) values.push({ value, source: 'template_payload' })
    }

    const templateTextFields = [
      payload.ButtonText,
      payload.button_text,
      payload.ListTitle,
      payload.list_title,
      payload.InteractiveText,
      payload.interactive_text,
      payload.Body,
      payload.body
    ]

    for (const raw of templateTextFields) {
      const value = `${raw ?? ''}`.trim()
      if (value) values.push({ value, source: 'template_text' })
    }

    const body = `${input.body ?? ''}`.trim()
    if (body) values.push({ value: body, source: 'text' })

    return values
  }

  private parseStructuredAction(value: string, source: WorkflowAction['source']): WorkflowAction {
    // Canonical format for templates:
    // WF:VIEW:12345
    // WF:DOWNLOAD:12345
    // WF:ACCEPT:12345
    // WF:REJECT_MENU:12345
    // WF:QUOTED:12345:ERP-7788
    // WF:REJECTED:12345:Motivo opcional
    const withColon = value.match(/^WF:(VIEW|DOWNLOAD|ACCEPT|REJECT_MENU|QUOTED|REJECTED):(\d+)(?::(.+))?$/i)
    if (withColon) {
      return this.buildStructuredAction(withColon[1], withColon[2], withColon[3], value, source)
    }

    // Alternative separator:
    // WF|VIEW|12345
    const withPipe = value.match(/^WF\|(VIEW|DOWNLOAD|ACCEPT|REJECT_MENU|QUOTED|REJECTED)\|(\d+)(?:\|(.+))?$/i)
    if (withPipe) {
      return this.buildStructuredAction(withPipe[1], withPipe[2], withPipe[3], value, source)
    }

    return { type: 'UNKNOWN', source: 'unknown', raw: value }
  }

  private buildStructuredAction(
    actionRaw?: string,
    quoteRaw?: string,
    extraRaw?: string,
    raw?: string,
    source: WorkflowAction['source'] = 'unknown'
  ): WorkflowAction {
    const action = `${actionRaw ?? ''}`.toUpperCase()
    const quoteNumber = Number(quoteRaw)
    if (!Number.isFinite(quoteNumber)) {
      return { type: 'UNKNOWN', source: 'unknown', raw: raw ?? '' }
    }

    if (action === 'VIEW') return { type: 'VIEW', quoteNumber, source, raw: raw ?? '' }
    if (action === 'DOWNLOAD') return { type: 'DOWNLOAD', quoteNumber, source, raw: raw ?? '' }
    if (action === 'ACCEPT') return { type: 'ACCEPT', quoteNumber, source, raw: raw ?? '' }
    if (action === 'REJECT_MENU') return { type: 'REJECT_MENU', quoteNumber, source, raw: raw ?? '' }

    if (action === 'QUOTED') {
      const erpQuoteNumber = this.decodeExtra(extraRaw)
      if (!erpQuoteNumber) {
        return { type: 'QUOTED', quoteNumber, source, raw: raw ?? '' }
      }
      return { type: 'QUOTED', quoteNumber, erpQuoteNumber, source, raw: raw ?? '' }
    }

    if (action === 'REJECTED') {
      const reason = this.decodeExtra(extraRaw) || undefined
      return { type: 'REJECTED', quoteNumber, reason, source, raw: raw ?? '' }
    }

    return { type: 'UNKNOWN', source: 'unknown', raw: raw ?? '' }
  }

  private parseTextAction(raw: string): WorkflowAction {
    const normalized = this.normalize(raw)

    if (!normalized || normalized === 'ayuda' || normalized === 'help' || normalized === 'menu') {
      return { type: 'HELP', source: 'text', raw }
    }

    const viewMatch = raw.match(/^(?:ver|vista)\s+(?:cot[-\s]*)?(\d+)\s*$/i)
    if (viewMatch?.[1]) {
      return { type: 'VIEW', quoteNumber: Number(viewMatch[1]), source: 'text', raw }
    }

    const downloadMatch = raw.match(/^(?:descargar|descargado)\s+(?:cot[-\s]*)?(\d+)\s*$/i)
    if (downloadMatch?.[1]) {
      return { type: 'DOWNLOAD', quoteNumber: Number(downloadMatch[1]), source: 'text', raw }
    }

    const quotedMatch = raw.match(/^(?:cotizada|cotizado)\s+(?:cot[-\s]*)?(\d+)\s+([^\s]+)\s*$/i)
    if (quotedMatch?.[1] && quotedMatch?.[2]) {
      return {
        type: 'QUOTED',
        quoteNumber: Number(quotedMatch[1]),
        erpQuoteNumber: quotedMatch[2],
        source: 'text',
        raw
      }
    }

    const acceptMatch = raw.match(/^(?:aceptar|aceptada|aceptado|en\s+proceso)\s+(?:cot[-\s]*)?(\d+)\s*$/i)
    if (acceptMatch?.[1]) {
      return { type: 'ACCEPT', quoteNumber: Number(acceptMatch[1]), source: 'text', raw }
    }

    const rejectedMatch = raw.match(/^(?:rechazar|rechazada|rechazado|descartar|descartada|descartado)\s+(?:cot[-\s]*)?(\d+)(?:\s+(.+))?$/i)
    if (rejectedMatch?.[1]) {
      return {
        type: 'REJECTED',
        quoteNumber: Number(rejectedMatch[1]),
        reason: rejectedMatch[2]?.trim(),
        source: 'text',
        raw
      }
    }

    return { type: 'UNKNOWN', source: 'unknown', raw }
  }

  private normalize(value: string): string {
    return `${value ?? ''}`
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim()
  }

  private decodeExtra(value?: string): string {
    const raw = `${value ?? ''}`.trim()
    if (!raw) return ''
    try {
      return decodeURIComponent(raw)
    } catch {
      return raw
    }
  }
}
