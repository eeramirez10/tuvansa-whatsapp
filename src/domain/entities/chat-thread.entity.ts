// chat-thread.ts

import { ChatThread } from "@prisma/client";
import { MessageEntity } from "./message.entity";

interface ChatThreadOptions {
  id: string;
  openAiThreadId: string;
  clientPhoneNumber: string;
  status: string;
  createdAt: Date;
  lastInteraction: Date;
  location: string;
  customerId: string;
}

export class ChatThreadEntity implements ChatThread {
  id: string;
  openAiThreadId: string;
  clientPhoneNumber: string;
  status: string;
  createdAt: Date;
  lastInteraction: Date | null;
  location: string | null;
  customerId: string | null;
  messages?: MessageEntity[]

  constructor(options: ChatThreadOptions) {
    this.id = options.id;
    this.openAiThreadId = options.openAiThreadId;
    this.clientPhoneNumber = options.clientPhoneNumber;
    this.status = options.status;
    this.createdAt = options.createdAt;
    this.lastInteraction = options.lastInteraction;
    this.location = options.location;
    this.customerId = options.customerId;
  }
}
