const DEFAULT_MAX_LENGTH = 1500

export const splitWhatsAppMessage = (
  content: string,
  maxLength = DEFAULT_MAX_LENGTH
): string[] => {
  const chunks: string[] = []
  let remaining = content.trim()

  while (remaining.length > maxLength) {
    const candidate = remaining.slice(0, maxLength + 1)
    const newlineIndex = candidate.lastIndexOf('\n')
    const spaceIndex = candidate.lastIndexOf(' ')
    const splitIndex = Math.max(newlineIndex, spaceIndex)
    const safeIndex = splitIndex > Math.floor(maxLength / 2)
      ? splitIndex
      : maxLength

    chunks.push(remaining.slice(0, safeIndex).trim())
    remaining = remaining.slice(safeIndex).trim()
  }

  if (remaining) chunks.push(remaining)

  return chunks
}
