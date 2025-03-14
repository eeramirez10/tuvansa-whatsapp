import { MessageService } from '../../domain/services/message.service';


interface Options {
  body: any []
  to: string
}


export class SendWhatsApp {


  constructor(private readonly messageService: MessageService) { }


  async execute(options: Options) {
    const { body, to } = options

    this.messageService.createWhatsAppMessage({ body, to })
    return
  }
}