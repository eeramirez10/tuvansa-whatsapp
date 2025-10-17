interface Option<T> {
  items: T[]
  total: number;
  page: number
  pageSize: number
}

export class PaginationResult<T> {

  items: T[]
  total: number;
  page: number
  pageSize: number

  constructor(options: Option<T>) {
    this.items = options.items
    this.total = options.total
    this.page = options.page
    this.pageSize = options.pageSize
  }



}