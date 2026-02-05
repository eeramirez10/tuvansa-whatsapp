import { Request } from "express";

interface Option {
  summary: string;
  to: string;
  url: string

}

export interface SendWhatssAppTemplateRequest extends Request {
  body: SendWhatssAppTemplateRequestDTO
}

export class SendWhatssAppTemplateRequestDTO {

  public readonly summary: string;
  public readonly to: string;
  public readonly url: string;
  // private readonly mediaUrl;
  // private readonly contentSid;
  // private readonly contentVariables;

  constructor(options: Option) {
    this.summary = options.summary
    this.to = options.to
    this.url = options.url
  }

  static execute(options: Option): [String?, SendWhatssAppTemplateRequestDTO?] {


    if (!options.summary) return ["message is required"];
    if (!options.to) return ["to is required"];
    if (!options.url) return ["url is required"];


    return [, new SendWhatssAppTemplateRequestDTO({ ...options })]

  }


}