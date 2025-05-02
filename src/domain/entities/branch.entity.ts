import { Branch } from "@prisma/client";
import { UserEntity } from "./user.entity";


interface BranchEntityOptions {
  name: string;
  id: string;
  address: string;
  createdAt: Date;
  updatedAt: Date;
}


export class BranchEntity implements Branch {


  name: string;
  id: string;
  address: string;
  createdAt: Date;
  updatedAt: Date;
  users?: UserEntity[]

  constructor(options: BranchEntityOptions) {

    this.name = options.name
    this.id = options.id
    this.address = options.address
    this.createdAt = options.createdAt
    this.updatedAt = options.updatedAt
  }
}