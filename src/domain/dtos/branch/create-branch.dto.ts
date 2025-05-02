

interface Option {
  name: string
  address: string
}

export class CreateBranchDto {

  public readonly name: string
  public readonly address: string


  constructor(options: Option) {

    this.name = options.name
    this.address = options.address

  }

  static execute(branch: Option):[string?, CreateBranchDto?] {
    const { name, address } = branch

    if(!name) return ['Name of branch is required']
    if(!address) return ['Address is required']

    return[, new CreateBranchDto(branch)]

  }


}