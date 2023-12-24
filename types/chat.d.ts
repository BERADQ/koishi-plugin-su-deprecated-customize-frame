import type { Logger, Session } from "@koishijs/core";
import type Vits from "@initencounter/vits";
declare global {
  interface Message {
    content: string;
    role: Role;
  }
  type CustomChat = (
    param: ChatParam,
    current_message: Message,
    messages: Message[],
    free_chat: FreeChat,
  ) => Promise<Message>;
  type FreeChat = (
    messages: Message[],
    temperature: number,
  ) => Promise<Message>;
  enum Role {
    User = "user",
    Assistant = "assistant",
    System = "system",
    Silent = "silent",
  }
  interface ChatParam {
    axios: Function;
    session: Session;
    vits: Vits;
    logger: Logger;
  }
}
