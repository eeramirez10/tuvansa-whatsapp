
interface Option {

  id: string
  name: string
  address: string
  managerId?: string | null
  manager?: {
    id: string
    name: string
    lastname: string
    username: string
  } | null

}

export class GetBranchesResponse {
  readonly id: string
  readonly name: string
  readonly address: string
  readonly managerId?: string | null
  readonly manager?: {
    id: string
    name: string
    lastname: string
    username: string
  } | null

  constructor(options: Option) {
    this.id = options.id
    this.name = options.name
    this.address = options.address
    this.managerId = options.managerId ?? null
    this.manager = options.manager ?? null
  }
}
