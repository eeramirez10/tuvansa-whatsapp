import { validate as isUuid } from 'uuid';

interface Option {
  id: string
}

export class GetTodoDto {

  private readonly id: string

  constructor(option: Option) {

    this.id = option.id
  }

  static execute(options: Option): [string?, GetTodoDto?] {
    const { id } = options

    if (!id) return ['El id es necesario']
    if(!isUuid(id)) return ['No es un id valido']


    return [undefined, new GetTodoDto({ id })]
  }

}