import { Composer, Context } from "grammy/mod.ts";
import redditDb from "./db.ts";
import Config from "./config.ts";
import Reddit from "./reddit.ts";
import { extractBotToken, genBot } from "./utils.ts";

const config = new Config();
const reddit = new Reddit();
const composer = new Composer();

// Functions
const reply = (ctx: Context, text: string, reply_markup: any = null) =>
	ctx.reply(text, {
		parse_mode: "html",
		disable_web_page_preview: true,
		reply_to_message_id: ctx.message?.message_id,
		reply_markup,
	});

async function checkadmin(
	ctx: Context,
	userid: number,
	chatid: number,
): Promise<boolean> {
	const currenuseryts = await ctx.api.getChatMember(chatid, userid);
	if (
		currenuseryts.status === "creator" ||
		currenuseryts.status === "administrator"
	) {
		return true;
	} else {
		return false;
	}
}

// Start command
composer.command(
	"start",
	(ctx: Context) =>
		reply(
			ctx,
			`Hello <b>${ctx.from?.first_name}</b>! I'm a reddit bot, made by @mybotsrealm. I can send you the latest posts from any subreddit you want. To get started, use /help.`,
			{
				inline_keyboard: [
					[
						{
							text: "Updates Channel",
							url: "t.me/mybotsrealm",
						},
					],
				],
			},
		),
);

// Help command
composer.command("help", (ctx: Context) => {
	if (ctx.message?.chat?.type === "private") {
		return reply(
			ctx,
			`You can connect your group to bot by using <code>/link</code> command. After that, you can use <code>/sub</code> command to subscribe to subreddits to your group / channel. You can also use <code>/unsub</code> command to remove subreddits from your group. To get the list of subreddits in your group, use <code>/chatsubs</code> command. To disconnect your group from bot, use <code>/unlink</code> command.`,
			{
				inline_keyboard: [
					[
						{
							text: "Updates Channel",
							url: "t.me/mybotsrealm",
						},
					],
				],
			},
		);
	}
});

// Link a channel to bot
composer.command("link", async (ctx: Context) => {
	if (ctx.message?.chat?.type === "private") {
		return reply(ctx, "This command can only be used in groups");
	}
	if (!await checkadmin(ctx, ctx.from?.id, ctx.chat?.id)) {
		return reply(
			ctx,
			"You need to be an admin to connect a channel.",
		);
	}
	const args = ctx.message?.text?.split(" ");
	if (args.length > 1) {
		const chatid = parseInt(args[1]);

		try {
			if (await checkadmin(ctx, ctx.from?.id!, chatid)) {
				await redditDb.storeConnection(ctx.chat?.id, chatid);
				return reply(ctx, `Connected to <code>${chatid}</code>`);
			} else {
				return reply(
					ctx,
					"You need to be an admin of the channel to connect to it.",
				);
			}
		} catch (error) {
			return reply(ctx, error.message);
		}
	} else {
		return reply(ctx, "Invalid arguments");
	}
});

// Unlinking the connected chat
composer.command("unlink", async (ctx: Context) => {
	if (ctx.message?.chat?.type === "private") {
		return reply(ctx, "This command can only be used in groups");
	}
	try {
		if (await checkadmin(ctx, ctx.from?.id!, ctx.chat?.id!)) {
			await redditDb.deleteConnection(ctx.chat?.id!);
			return reply(ctx, `Disconnected from Chat`);
		} else {
			return reply(
				ctx,
				"You must be an admin to disconnect the bot.",
			);
		}
	} catch (error) {
		return reply(ctx, error.message);
	}
});

// Getting the connected chat
composer.command("linked", async (ctx: Context) => {
	if (ctx.message?.chat?.type === "private") {
		return reply(ctx, "This command can only be used in groups");
	}
	if (!await checkadmin(ctx, ctx.from?.id!, ctx.chat?.id!)) {
		return reply(
			ctx,
			"You must be an admin to do this.",
		);
	}
	const connected = await redditDb.getConnection(ctx.chat?.id!);
	if (connected === undefined) {
		return reply(ctx, "Not connected to any chat");
	}
	return reply(ctx, `Connected to <code>${connected}</code>`);
});

// Subscribing to subreddits
composer.command("sub", async (ctx) => {
	if (ctx.message?.chat?.type === "private") {
		return reply(ctx, "This command can only be used in groups");
	}
	if (!await checkadmin(ctx, ctx.from?.id!, ctx.chat?.id!)) {
		return reply(
			ctx,
			"You need to be an admin of the channel to connect to it.",
		);
	}
	const args = ctx.message?.text?.split(" ");
	const connected = await redditDb.getConnection(ctx.chat?.id);
	if (connected === undefined) {
		return reply(ctx, "Not connected to a chat");
	}
	if (args.length > 1) {
		const subreddit = reddit.getSubredditFromUrl(args[1]);
		if (subreddit) {
			try {
				if (await reddit.checkValidSubreddit(subreddit)) {
					return (
						await redditDb.newRedditPostChat(
							connected,
							subreddit,
							ctx.me?.id!,
						)
					) && reply(ctx, `Subscribed to <code>${subreddit}</code>`);
				} else {
					return reply(ctx, "Invalid subreddit url");
				}
			} catch (error) {
				return reply(ctx, error.message);
			}
		} else {
			return reply(ctx, "Invalid subreddit URL");
		}
	} else {
		return reply(
			ctx,
			"Invalid arguments provided <code>/sub [subreddit]</code>",
		);
	}
});

// Unsubscribe from a subreddit
composer.command("unsub", async (ctx) => {
	if (ctx.message?.chat?.type === "private") {
		return reply(ctx, "This command can only be used in groups");
	}
	if (!await checkadmin(ctx, ctx.from?.id!, ctx.chat?.id!)) {
		return reply(
			ctx,
			"You need to be an admin of the channel to connect to it.",
		);
	}
	const args = ctx.message?.text?.split(" ");
	const connected = await redditDb.getConnection(ctx.chat?.id);
	if (connected === undefined) {
		return reply(ctx, "Not connected to a chat");
	}
	if (args.length > 1) {
		try {
			return (
				await redditDb.deleteRedditPostChat(
					args[1],
					connected,
					ctx.me?.id,
				)
			) && reply(ctx, `Unsubscribed from <code>${args[1]}</code>`);
		} catch (error) {
			return reply(ctx, error.message);
		}
	} else {
		return reply(
			ctx,
			"Invalid arguments use <code>/unsub [subreddit]</code>",
		);
	}
});

// Get all subreddits a chat is subscribed to
composer.command("chatsubs", async (ctx) => {
	if (ctx.message?.chat?.type === "private") {
		return reply(ctx, "This command can only be used in groups");
	}
	if (!await checkadmin(ctx, ctx.from?.id!, ctx.chat?.id!)) {
		return reply(
			ctx,
			"You need to be an admin of the channel to connect to it.",
		);
	}
	const connected = await redditDb.getConnection(ctx.chat?.id);
	if (connected === undefined) {
		return reply(ctx, "Not connected to a chat");
	}
	try {
		const chats = await redditDb.getChatRedditPosts(
			connected,
		);
		if (chats.length === 0) {
			return reply(ctx, "Chat has not subscribed to any subreddits");
		}
		return reply(
			ctx,
			`<b>Subcribed Subreddits:</b>\n- ${chats.join("\n- ")}`,
		);
	} catch (error) {
		return reply(ctx, error.message);
	}
});

// Get Bot Stats
// Dev Only
composer.command("botstats", async (ctx) => {
	if (config.devs.includes(ctx.from?.id!) === false) {
		return;
	}
	const allposts = await redditDb.getAllRedditPosts();
	const allbots = await redditDb.getallbots();
	const allchats = await redditDb.getallchatscount();
	return reply(
		ctx,
		`<b>Bot Stats</b>\n<b>Total Posts:</b> <code>${allposts.length}</code>\n<b>Total Bots:</b> <code>${allbots}</code>\n<b>Total Chats:</b> <code>${allchats}</code>`,
	);
});

// cc : https://github.com/xditya/GrammyCloneableBot/blob/main/src/helpers/genBot.ts

composer.on("msg:text").filter(
	(ctx) => ctx.msg.forward_from?.username?.toLowerCase() === "botfather",
	async (ctx) => {
		const entities = ctx.message?.entities;
		const msgText = ctx.message?.text || "";
		const r = await reply(ctx, "<code>Creating a clone...</code>");
		const bot_token = extractBotToken(msgText, entities);
		if (bot_token !== undefined) {
			const newbot = await genBot(bot_token);
			if (newbot) {
				try {
					await newbot.api.setWebhook(
						`${config.webhookUrl}?token=${bot_token}`,
					);
				} catch (e) {
					return await ctx.api.editMessageText(
						ctx.chat!.id,
						r.message_id,
						`An error occured while setting webhook\n\n<b>Error:</b> <code>${e.description}</code>`,
						{
							parse_mode: "HTML",
						},
					);
				}
			}
			await ctx.api.editMessageText(
				ctx.chat!.id,
				r.message_id,
				`<b>Bot created successfully!</b>\n\n<b>Username:</b> @${newbot?.botInfo?.username}`,
				{
					parse_mode: "HTML",
				},
			);
		}
	},
);

export default composer;
