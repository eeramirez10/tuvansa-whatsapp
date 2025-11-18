import { DisplayQuery, IncludeKeys, PreferMode } from "../../dtos/quotes/display.dto";


export function parsePrefer(v: unknown): PreferMode {
  if (v === 'draft') return 'draft';
  return 'final';
}

export function parseInclude(v: unknown): IncludeKeys {
  if (!v || typeof v !== 'string') return ['items', 'artifacts'];
  const parts = v.split(',').map(s => s.trim()).filter(Boolean);
  const valid = new Set(['items','artifacts','messages']);
  return parts.filter(p => valid.has(p)) as IncludeKeys;
}

export function parsePresign(v: unknown): number | undefined {
  if (!v) return undefined;
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? n : undefined;
}

export function buildDisplayQuery(params: {
  quoteId: string;
  prefer?: unknown;
  include?: unknown;
  presign?: unknown;
}): DisplayQuery {
  return {
    quoteId: params.quoteId,
    prefer: parsePrefer(params.prefer),
    include: parseInclude(params.include),
    presignSeconds: parsePresign(params.presign),
  };
}