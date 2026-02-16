
interface Option {
  id: string
  name: string
  lastname: string
  username: string
  branchName: string
}


export class AssingnManagerResponse {

  readonly id: string
  readonly name: string
  readonly lastname: string
  readonly username: string
  readonly branchName: string

  constructor(option: Option) {

    this.id = option.id
    this.name = option.name
    this.lastname = option.lastname
    this.username = option.username
    this.branchName = option.branchName
  }

}