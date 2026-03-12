interface Option {
  name: string
  address: string
}

export class UpdateBranchDto {

  public readonly name: string
  public readonly address: string

  constructor(options: Option) {
    this.name = options.name
    this.address = options.address
  }

  static execute(branch: Option): [string?, UpdateBranchDto?] {
    const name = `${branch?.name ?? ''}`.trim()
    const address = `${branch?.address ?? ''}`.trim()

    if (!name) return ['Name of branch is required']
    if (!address) return ['Address is required']

    return [, new UpdateBranchDto({ name, address })]
  }
}
