// ---- UpdateQuoteDto.ts ----

import { UpdateQuoteItemDto } from "./update-quote-item.dto";

export interface UpdateQuote {
  customerId?: string;
      // arreglo de items a actualizar (parcial)
  fileKey?: string | null;            // null para desvincular archivo
  summary?: string | null;            // null para limpiar resumen
  chatThreadId?: string | null;       // null para desvincular chatThread
}

export class UpdateQuoteDto {
  public readonly customerId?: string;
  public readonly fileKey?: string | null;
  public readonly summary?: string | null;
  public readonly chatThreadId?: string | null;

  private constructor(options: {
    customerId?: string;
    items?: UpdateQuoteItemDto[];
    fileKey?: string | null;
    summary?: string | null;
    chatThreadId?: string | null;
  }) {
    this.customerId = options.customerId;
    this.fileKey = options.fileKey;
    this.summary = options.summary;
    this.chatThreadId = options.chatThreadId;
  }

  static execute(quote: UpdateQuote): [string?, UpdateQuoteDto?] {
    const {
      customerId,
      fileKey,
      summary,
      chatThreadId,
    } = quote;

    // Debe venir al menos un campo a actualizar
    if (
      customerId === undefined &&
      fileKey === undefined &&
      summary === undefined &&
      chatThreadId === undefined
    ) {
      return ["No se ha enviado ningún campo para actualizar"];
    }

    // Validaciones de tipos y contenido
    if (customerId !== undefined) {
      if (typeof customerId !== "string" || customerId.trim() === "") {
        return ["El customerId, de estar presente, no puede estar vacío"];
      }
    }

    if (fileKey !== undefined) {
      if (fileKey !== null && (typeof fileKey !== "string" || fileKey.trim() === "")) {
        return ["El fileKey, de estar presente, debe ser una cadena no vacía o null para desvincular"];
      }
    }

    if (summary !== undefined) {
      if (summary !== null && (typeof summary !== "string" || summary.trim() === "")) {
        return ["El summary, de estar presente, debe ser una cadena no vacía o null para limpiar"];
      }
    }

    if (chatThreadId !== undefined) {
      if (chatThreadId !== null && (typeof chatThreadId !== "string" || chatThreadId.trim() === "")) {
        return ["El chatThreadId, de estar presente, debe ser una cadena no vacía o null para desvincular"];
      }
    }



    // Construcción final (datos ya validados/sanitizados)
    return [
      undefined,
      new UpdateQuoteDto({
        customerId: customerId?.trim(),
        fileKey: fileKey === undefined ? undefined : (fileKey === null ? null : fileKey.trim()),
        summary: summary === undefined ? undefined : (summary === null ? null : summary.trim()),
        chatThreadId: chatThreadId === undefined ? undefined : (chatThreadId === null ? null : chatThreadId.trim()),
      }),
    ];
  }
}
