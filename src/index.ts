import { Context, Logger, Schema } from "koishi";
import {} from "@initencounter/vits";
import path from "path";

export const name = "su-deprecated-customize-frame";

export interface Config {
  js_file_path: string;
  yaml_file_path: string;
  context_max_len: number;
  cid_list: string[];
}

export const Config: Schema<Config> = Schema.object({
  js_file_path: Schema.path({
    filters: ["file", "directory"],
    allowCreate: false,
  }).required(true),
  yaml_file_path: Schema.path({ filters: ["file"], allowCreate: false })
    .required(true),
  context_max_len: Schema.number().min(3).max(50).step(1).role("slider")
    .default(8),
  cid_list: Schema.array(Schema.string().required(true)).required(true),
});

export function apply(ctx: Context, config: Config) {
  const logger = new Logger("custom-never");

  let { js_file_path, yaml_file_path, context_max_len, cid_list } = config;
  let message_chain_p_cid: { [key: string]: Message[] } = {};
  let chat_func: CustomChat = require(path.resolve(js_file_path));
  let prompt: Message[] = require(path.resolve(yaml_file_path));
  ctx.middleware(async (s, next) => {
    let { cid } = s;
    if (cid_list.includes(cid)) {
      let { content } = s;
      if (!(message_chain_p_cid[cid] instanceof Array)) {
        message_chain_p_cid[cid] = [];
      }
      limit_length(message_chain_p_cid[cid], context_max_len);
      let current_message: Message = { role: Role.User, content };
      message_chain_p_cid[cid].push(current_message);
      let chat_param: ChatParam = {
        axios: ctx.http.axios,
        session: s,
        vits: ctx.vits,
        logger,
      };
      let res_message: Message = await chat_func(
        chat_param,
        current_message,
        [...prompt, ...message_chain_p_cid[cid]],
        undefined as FreeChat,
      );
      if (res_message.content.trim() != "") {
        if (res_message.role == Role.Silent) {
          message_chain_p_cid[cid].push({
            role: Role.Silent,
            content: res_message.content,
          });
        } else {
          message_chain_p_cid[cid].push(res_message);
          return res_message.content;
        }
      } else {
        message_chain_p_cid[cid].pop();
      }
    }
    return next();
  });
}
function limit_length(array: Array<any>, length: number) {
  while (array.length > length) {
    array.shift();
  }
}