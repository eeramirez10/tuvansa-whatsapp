interface Options {
  id: string;
  name: string;
  lastname: string;
  email: string;
  phone: string;
  branchName: string;
}

export class GetAssignedManagerResponse {
  readonly id: string;
  readonly name: string;
  readonly lastname: string;
  readonly email: string;
  readonly phone: string;
  readonly branchName: string;

  constructor(options: Options) {
    this.id = options.id;
    this.name = options.name;
    this.lastname = options.lastname;
    this.email = options.email;
    this.phone = options.phone;
    this.branchName = options.branchName;
  }
}
