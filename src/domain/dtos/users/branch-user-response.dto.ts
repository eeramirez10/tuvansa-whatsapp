export class BranchUserResponse {


  constructor(
    readonly id: string,
    readonly name: string,
    readonly address?: string | null,
  ) { }

}
