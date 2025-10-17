import { Request, Response } from "express";
import { GetThreadsUseCase } from "../../application/use-cases/threads/get-threads.use-case";
import { ChatThreadRepository } from "../../domain/repositories/chat-thread.repository";
import { GetMessagesByThreadUseCase } from "../../application/use-cases/threads/get-messages-by-thread.use-case";
import { GetThreadsDto } from '../../domain/dtos/threads/get-threads.dto';
import { GetMessagesDto } from "../../domain/dtos/threads/get-messages.dto";


export class ThreadsController {


  constructor(private readonly chatThreadRepository: ChatThreadRepository) { }

  getList = async (req: Request, res: Response) => {


    const [error, getThreadsDto] = GetThreadsDto.execute({ ...req.query })

    if (error) {
      res.json({ error })
      return
    }

    new GetThreadsUseCase(this.chatThreadRepository)
      .execute(getThreadsDto)
      .then((data) => {
        res.json(data)
      })
      .catch((e) => {
        console.log(e)
        res.status(500).json({ error: 'Hubo un error' })
      })

  }

  getMessages = async (req: Request, res: Response) => {

    const threadId = req.body.threadId

    const [error, getMessageDto] = GetMessagesDto.execute(req.query)

    if (error) {
      res.status(400).json({ error })
      return
    }

    // console.log({ threadId })

    new GetMessagesByThreadUseCase(this.chatThreadRepository)
      .execute(threadId, getMessageDto)
      .then((data) => {
        res.json(data)
      })
      .catch((e) => {
        console.log(e)
        res.status(500).json({ error: 'Hubo un error' })
      })

  }




}