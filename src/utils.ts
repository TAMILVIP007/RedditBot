import { Bot, InputFile } from "grammy/mod.ts";
import redditDb from "./db.ts";
import Reddit from "./reddit.ts";
import { cron } from "cron";

const reddit = new Reddit();
const botsList = new Map<string, Bot>();

export async function genBot(token: string) {
	let bot = botsList.get(token);
	if (!bot) {
		bot = new Bot(token);
		try {
			await bot.init();
			botsList.set(token, bot);
			const botid = await bot.api.getMe();
			const botid_ = botid.id;
			await redditDb.storebottoken(botid_, token);
		} catch (err) {
			if (err.description == "Unauthorized") {
				console.log("Invalid Token");
				await redditDb.deletebottoken(token);
			}
		}
	}
	return bot;
}

export function extractBotToken(
	msgText: string,
	entities: any,
): string | undefined {
	for (const entity_ in entities) {
		const entity = entities[Number(entity_)];
		if (entity.type == "code") {
			return msgText?.substring(
				entity.offset,
				entity.offset + entity.length,
			);
		}
	}
}

async function notifyReddits() {
	const reddits = await redditDb.getAllRedditPosts();
	for (const subreddit of reddits) {
		const title = reddit.fetchFirstPost(subreddit);
		if (title) {
			const update = redditDb.newpost(subreddit, (await title).title);
			if (await update) {
				const imgurl = (await title).image;
				const vidurl = (await title).video;
				const chatids = await redditDb.getRedditPostChat(subreddit);
				for (const { chatId, botId } of chatids) {
					try {
						const token = await redditDb.getbottoken(botId);
						if (!token) {
							continue;
						}
						const bot = await genBot(token);
						if (imgurl) {
							await bot.api.sendPhoto(
								chatId,
								new InputFile({ url: imgurl }),
								{
									caption: `<b>${
										(await title).subreddit
									}</b>\n\n${
										(await title).title
									}\n\n<b>By:</b> ${(await title).author}`,
									parse_mode: "html",
									disable_web_page_preview: true,
									reply_markup: {
										inline_keyboard: [
											[
												{
													text: "View Post",
													url: (await title).url,
												},
											],
										],
									},
								},
							);
						} else if (vidurl) {
							await bot.api.sendVideo(
								chatId,
								new InputFile({ url: vidurl }),
								{
									caption: `<b>${
										(await title).subreddit
									}</b>\n\n${
										(await title).title
									}\n\n<b>By:</b> ${(await title).author}`,
									parse_mode: "html",
									disable_web_page_preview: true,
									reply_markup: {
										inline_keyboard: [
											[
												{
													text: "View Post",
													url: (await title).url,
												},
											],
										],
									},
								},
							);
						} else {
							await bot.api.sendMessage(
								chatId,
								`<b>${(await title).subreddit}</b>\n\n${
									(await title).title
								}\n\n<b>By:</b> ${(await title).author}`,
								{
									parse_mode: "html",
									disable_web_page_preview: true,
									reply_markup: {
										inline_keyboard: [
											[
												{
													text: "View Post",
													url: (await title).url,
												},
											],
										],
									},
								},
							);
						}
						await sleep(5000);
					} catch (err) {
						console.log(err);
						continue;
					}
				}
				await sleep(10000);
			} else {
				await sleep(10000);
			}
		}
	}
}

function sleep(ms: number): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

console.log("cron started");

cron("*/5 * * * *", async () => {
	await notifyReddits();
});
