import { Request } from "express"


interface Option {
  id: string
  managerId: string


}

interface ParamsOption {
  [key: string]: any
}


export interface AssingnManagerReq extends Request {
  params: ParamsOption
}

export class AssingnManagerRequest {

  readonly id: string
  readonly managerId: string

  constructor(option: Option) {
    this.id = option.id
    this.managerId = option.managerId
  }


  static execute(body: Option): [String?, AssingnManagerRequest?] {

    if (!body.id) return ['Id branch is required']
    if (!body.managerId) return ['Manager id is required']


    return [, new AssingnManagerRequest({ id: body.id, managerId: body.managerId })]

  }

}