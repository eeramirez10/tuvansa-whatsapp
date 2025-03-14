import { EmailService, SendMailOptions } from '../../infrastructure/services/mail.service';


export class SendMailUseCase{


  constructor (private readonly emailService: EmailService){}

  async execute(options: SendMailOptions){


    await this.emailService.sendEmail(options)

  }
}