import { Bot } from "grammy/mod.ts";

import Config from "./src/config.ts";
import composer from "./src/bot.ts";

// we set up a test instance for the bot, using the BOT_TOKEN provided in the .env file.

const bot = new Bot(new Config().token);
await bot.init();
console.info(`Started as @${bot.botInfo.username}`);

bot.use(composer);

bot.start({
  drop_pending_updates: true,
  allowed_updates: ["message"],
});

Deno.addSignalListener("SIGINT", () => bot.stop());
Deno.addSignalListener("SIGTERM", () => bot.stop());