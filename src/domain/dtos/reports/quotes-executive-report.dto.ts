interface Options {
  year: number;
  branchId?: string;
  branchIds?: string[];
}

export class QuotesExecutiveReportDto {
  year: number;
  branchId?: string;
  branchIds?: string[];

  constructor(options: Options) {
    this.year = options.year;
    this.branchId = options.branchId;
    this.branchIds = options.branchIds;
  }

  static execute(values: Record<string, unknown>): [string?, QuotesExecutiveReportDto?] {
    const nowYear = new Date().getUTCFullYear();
    const rawYear = `${values.year ?? nowYear}`.trim();

    if (!/^\d{4}$/.test(rawYear)) return ['year inválido'];

    const year = Number(rawYear);
    if (!Number.isInteger(year) || year < 2000 || year > 2100) {
      return ['year fuera de rango'];
    }

    const branchId = `${values.branchId ?? ''}`.trim() || undefined;

    return [undefined, new QuotesExecutiveReportDto({ year, branchId })];
  }
}
