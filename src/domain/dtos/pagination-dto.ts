

interface Options {
  page?: string
  pageSize?: string
  startDate?: string
  endDate?: string
  search?: string
}



export class PaginationDto {
  page?: number
  pageSize?: number
  startDate?: string
  endDate?: string
  search?: string

  constructor(options: Options) {

    const page = parseInt(options.page)
    const pageSize = parseInt(options.pageSize)

    this.page = page
    this.pageSize = pageSize
    this.startDate = options.startDate
    this.endDate = options.endDate
    this.search = options.search
  }

  static execute(options: { [key: string]: any; }): [string?, PaginationDto?] {

    const {
      page = 1,
      pageSize = 10,
      startDate,
      endDate,
      search
    } = options

    let formatStartDate;
    let formatEndDate;

    if (page < 0) return ['the page cannot be less than zero ']
    if (pageSize < 0) return ['Page size cannot be less than zero']

    if (startDate && endDate) {

      const [error, start] = this.parseDDMMYYYY(startDate)
      const [error2, end] = this.parseDDMMYYYY(endDate)

      if (error) return [error]

      if (error2) return [error2]

      formatStartDate =

        formatStartDate = new Date(Date.UTC(start.y, start.mo - 1, start.d, 0, 0, 0, 0));
      formatEndDate = new Date(Date.UTC(end.y, end.mo - 1, end.d + 1, 0, 0, 0, 0));
    }




    return [, new PaginationDto({ page, pageSize, startDate: formatStartDate, endDate: formatEndDate })]
  }



  private static parseDDMMYYYY(s: string): [string?, { y: number; mo: number; d: number; }?] {
    const m = /^(\d{2})-(\d{2})-(\d{4})$/.exec(s.trim());
    if (!m) return [`Error Date format in ${s} should be  dd-mm-yyyy`]
    const d = Number(m[1]), mo = Number(m[2]), y = Number(m[3]);
    return [, { y, mo, d }];
  }
}