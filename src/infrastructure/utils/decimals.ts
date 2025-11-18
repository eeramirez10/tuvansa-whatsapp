import { Prisma } from "@prisma/client"

export const D = (v: string | number | Prisma.Decimal | null | undefined) => new Prisma.Decimal(v ?? 0)
export const toStr = (v: Prisma.Decimal | number | string | null | undefined) =>
  v == null ? null : v instanceof Prisma.Decimal ? v.toString() : String(v)

export function computeLineTotal(price: Prisma.Decimal | null, qty: Prisma.Decimal, discountAmount?: Prisma.Decimal | null) {
  const p = price ?? new Prisma.Decimal(0)
  const disc = discountAmount ?? new Prisma.Decimal(0)
  return p.mul(qty).sub(disc)
}

export function sum<T>(arr: T[], f: (x: T) => Prisma.Decimal) {
  return arr.reduce((acc, x) => acc.add(f(x)), new Prisma.Decimal(0))
}
