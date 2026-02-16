
interface Option {

  id: string
  name: string
  address: string

}

export class GetBranchesResponse {
  readonly id: string
  readonly name: string
  readonly address: string

  constructor(options: Option) {
    this.id = options.id
    this.name = options.name
    this.address = options.address
  }
}