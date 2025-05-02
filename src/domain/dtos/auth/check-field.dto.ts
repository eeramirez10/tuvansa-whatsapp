

interface CheckFieldDtoOption {
  field: string
  value: string
}

export class CheckFieldDto {
  public readonly field: string
  public readonly value: string

  constructor(options: CheckFieldDto) {
    this.field = options.field
    this.value = options.value
  }

  static execute(options: CheckFieldDtoOption): [string?, CheckFieldDto?] {

    const { field, value } = options


    const allowedFileds = ['email','username']

    if (!field) return ['field is required']
    if (!value) return ['value is required']
    if(!allowedFileds.includes(field)) return[`${field} is no allowed`]


    return [undefined, new CheckFieldDto({ field, value })]
  }

}