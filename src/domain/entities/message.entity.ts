// message.ts

import { Message } from "@prisma/client";

interface MessageOptions {
  id: string;
  role: string;
  content: string;
  createdAt: Date;
  chatThreadId: string;
}

export class MessageEntity implements Message {
  readonly id: string;
  readonly role: string;
  readonly content: string;
  readonly createdAt: Date;
  readonly chatThreadId: string;

  constructor(options: MessageOptions) {
    this.id = options.id;
    this.role = options.role;
    this.content = options.content;
    this.createdAt = options.createdAt;
    this.chatThreadId = options.chatThreadId;
  }
}
