import { PaginationDto } from "../pagination-dto";

interface Options {
  page?: string
  pageSize?: string

}

export class GetThreadsDto extends PaginationDto {


  constructor(options:Options){
    super(options);
  }

}

