import Config from "./src/config.ts";
import composer from "./src/bot.ts";
import { webhookCallback } from "grammy/mod.ts";
import { serve } from "server";
import { genBot } from "./src/utils.ts";

const config = new Config();

serve(async (req) => {
	if (req.method === "POST") {
		const url = new URL(req.url);
		try {
			const token = url.searchParams.get("token");
			if (!token) return;
			const bot = await genBot(token);
			if (!bot) return;
			bot.use(composer);
			bot.catch((err) => console.log(err));
			return await webhookCallback(bot, "std/http")(req);
		} catch (error) {
			return new Response("Error " + error.message);
		}
	}
	return new Response("OK");
}, { port: config.port });
