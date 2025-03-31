import { validate as isUuid } from 'uuid';

interface Option {
  id: string
}

export class GetCustomerDto {

  private readonly id: string

  constructor(option: Option) {

    this.id = option.id
  }

  static execute(options: Option): [string?, GetCustomerDto?] {
    const { id } = options

    if (!id) return ['El id es necesario']
    if(!isUuid(id)) return ['No es un id valido']


    return [undefined, new GetCustomerDto({ id })]
  }

}