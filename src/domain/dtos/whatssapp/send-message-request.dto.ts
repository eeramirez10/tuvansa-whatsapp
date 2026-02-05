
interface Option {
  message: string;
  to: string;

}

export class SendMessageRequestDTO {

  public readonly message: string;
  public readonly to: string;
  // private readonly mediaUrl;
  // private readonly contentSid;
  // private readonly contentVariables;

  constructor(options: Option) {
    this.message = options.message
    this.to = options.to
  }

  static execute(options: Option): [String?, SendMessageRequestDTO?] {


    if (!options.message) return ["message is required"];
    if (!options.to) return ["to is required"];


    return [, new SendMessageRequestDTO({ ...options })]

  }



}