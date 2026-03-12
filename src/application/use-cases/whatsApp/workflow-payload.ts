export type WorkflowPayloadAction = 'VIEW' | 'DOWNLOAD' | 'ACCEPT' | 'REJECT_MENU' | 'QUOTED' | 'REJECTED'

export const buildWorkflowPayload = (
  action: WorkflowPayloadAction,
  quoteNumber: number | string,
  extra?: string
): string => {
  const base = `WF:${action}:${quoteNumber}`
  if (!extra) return base
  return `${base}:${encodeURIComponent(extra)}`
}
