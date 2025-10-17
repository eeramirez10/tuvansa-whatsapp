import { PaginationDto } from "../pagination-dto";

interface Options {
  page?: string
  pageSize?: string

}

export class GetMessagesDto extends PaginationDto {

  constructor(options:Options){
    super(options)
  }

  
}