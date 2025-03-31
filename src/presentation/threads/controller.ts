import { Request, Response } from "express";
import { GetThreadsUseCase } from "../../application/use-cases/threads/get-threads.use-case";
import { ChatThreadRepository } from "../../domain/repositories/chat-thread.repository";
import { GetMessagesByThreadUseCase } from "../../application/use-cases/threads/get-messages-by-thread.use-case";


export class ThreadsController {


  constructor(private readonly chatThreadRepository: ChatThreadRepository) { }

  getList = async (req: Request, res: Response) => {


    new GetThreadsUseCase(this.chatThreadRepository)
      .execute()
      .then((data) => {
        res.json( data )
      })
      .catch((e) => {
        console.log(e)
        res.status(500).json({ error: 'Hubo un error' })
      })

  }

  getMessages = async (req: Request, res: Response) => {

    const threadId = req.body.threadId

    new GetMessagesByThreadUseCase(this.chatThreadRepository)
      .execute(threadId)
      .then((data) => {
        res.json( data )
      })
      .catch((e) => {
        console.log(e)
        res.status(500).json({ error: 'Hubo un error' })
      })

  }


}