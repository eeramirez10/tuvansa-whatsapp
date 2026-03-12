import { envs } from "../../config/envs";
import {
  QuoteExtractionResult,
  QuoteExtractionService,
  QuoteExtractionSourceFile
} from "../../domain/services/quote-extraction.service";

type ExtractionStatus = 'pending' | 'processing' | 'completed' | 'failed' | string

interface ExtractionJobCreateResponse {
  job_id?: string
  status?: ExtractionStatus
  result?: {
    items?: any[]
    file_name?: string
    file_type?: string
    items_count?: number
  }
  error?: string
}

interface ExtractionJobStatusResponse {
  job_id?: string
  status?: ExtractionStatus
  error?: string
}

interface ExtractionJobResultResponse {
  job_id?: string
  status?: ExtractionStatus
  result?: {
    items?: any[]
    file_name?: string
    file_type?: string
    items_count?: number
  }
  error?: string
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

export class QuoteExtractionJobsService extends QuoteExtractionService {
  private readonly baseUrl: string

  constructor(baseUrl = envs.QUOTE_EXTRACTION_API_URL) {
    super()
    this.baseUrl = baseUrl.replace(/\/$/, '')
  }

  async extractFromFile(file: QuoteExtractionSourceFile): Promise<QuoteExtractionResult> {
    const createResponse = await this.createJob(file)

    if (`${createResponse.status ?? ''}`.toLowerCase() === 'failed') {
      throw new Error(createResponse.error || 'Falló la extracción del archivo')
    }

    if (`${createResponse.status ?? ''}`.toLowerCase() === 'completed' && createResponse.result) {
      return this.normalizeResult({
        job_id: createResponse.job_id,
        status: createResponse.status,
        result: createResponse.result
      })
    }

    const jobId = `${createResponse.job_id ?? ''}`.trim()
    if (!jobId) {
      throw new Error('No se recibió job_id del servicio de extracción')
    }

    return this.waitForCompletion(jobId)
  }

  private async createJob(file: QuoteExtractionSourceFile): Promise<ExtractionJobCreateResponse> {
    const formData = new FormData()
    const blob = new Blob([Buffer.from(file.bytes)], { type: file.mimeType ?? 'application/octet-stream' })
    formData.append('file', blob, file.filename)

    const response = await fetch(`${this.baseUrl}/api/extract/jobs`, {
      method: 'POST',
      body: formData
    })

    return this.readJsonOrThrow<ExtractionJobCreateResponse>(response, 'No se pudo crear el job de extracción')
  }

  private async getStatus(jobId: string): Promise<ExtractionJobStatusResponse> {
    const response = await fetch(`${this.baseUrl}/api/extract/jobs/${jobId}/status`)
    return this.readJsonOrThrow<ExtractionJobStatusResponse>(response, 'No se pudo consultar el estado de extracción')
  }

  private async getResult(jobId: string): Promise<ExtractionJobResultResponse> {
    const response = await fetch(`${this.baseUrl}/api/extract/jobs/${jobId}/result`)
    return this.readJsonOrThrow<ExtractionJobResultResponse>(response, 'No se pudo obtener el resultado de extracción')
  }

  private async waitForCompletion(jobId: string): Promise<QuoteExtractionResult> {
    const timeoutMs = 4 * 60_000
    const pollIntervalMs = 5_000
    const startedAt = Date.now()

    while (Date.now() - startedAt < timeoutMs) {
      const status = await this.getStatus(jobId)
      const statusValue = `${status.status ?? ''}`.toLowerCase()

      if (statusValue === 'failed') {
        throw new Error(status.error || 'Falló la extracción del archivo')
      }

      if (statusValue === 'completed') {
        const result = await this.getResult(jobId)
        const resultStatus = `${result.status ?? ''}`.toLowerCase()

        if (resultStatus === 'failed') {
          throw new Error(result.error || 'Falló la extracción del archivo')
        }

        if (result.result) {
          return this.normalizeResult(result)
        }
      }

      await sleep(pollIntervalMs)
    }

    throw new Error('Tiempo de espera agotado al procesar la extracción')
  }

  private normalizeResult(payload: ExtractionJobResultResponse): QuoteExtractionResult {
    const items = Array.isArray(payload.result?.items) ? payload.result?.items : []
    return {
      jobId: payload.job_id,
      status: `${payload.status ?? 'completed'}`,
      fileName: payload.result?.file_name,
      fileType: payload.result?.file_type,
      itemsCount: payload.result?.items_count ?? items.length,
      items
    }
  }

  private async readJsonOrThrow<T>(response: Response, fallbackMessage: string): Promise<T> {
    if (response.ok) {
      return response.json() as Promise<T>
    }

    let detail = ''
    try {
      const body = await response.json() as Record<string, unknown>
      detail = `${body.error ?? body.message ?? ''}`.trim()
    } catch {
      detail = `${await response.text()}`.trim()
    }

    throw new Error(detail || fallbackMessage)
  }
}
