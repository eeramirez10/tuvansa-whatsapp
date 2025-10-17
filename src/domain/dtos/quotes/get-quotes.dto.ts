import { PaginationDto } from "../pagination-dto"

interface Options {
  page?: string
  pageSize?: string
  startDate?: string
  endDate?: string
}


export class GetQuotesDto extends PaginationDto {



  constructor(options: Options) {

    super(options)

  }




}