import { Collection, Database, MongoClient } from "mongo/mod.ts";
import { ObjectId } from "web_bson";
import Config from "./config.ts";

interface RedditChat {
	_id: number;
	reddits: string[];
	botid: number;
}

interface RedditPost {
	_id: string;
	title: string;
}

interface TempChat {
	_id: number;
	chat: number;
}

interface Clones {
	Token: string;
	_id: number;
}

class RedditDatabase {
	private client: MongoClient;
	private db!: Database;
	public chats: Collection<RedditChat>;
	public temp: Collection<TempChat>;
	public posts: Collection<RedditPost>;
	public clones: Collection<Clones>;

	constructor() {
		this.client = new MongoClient();
		this.chats = null!;
		this.temp = null!;
		this.posts = null!;
		this.clones = null!;
	}

	async connect(uri: string, database: string): Promise<void> {
		await this.client.connect(uri);
		this.db = this.client.database(database);
		this.chats = this.db.collection<RedditChat>("chats");
		this.posts = this.db.collection<RedditPost>("posts");
		this.clones = this.db.collection<Clones>("clones");
		this.temp = this.db.collection<TempChat>("temp");
		await this.createTempIndexes();
	}

	async createTempIndexes(): Promise<void> {
		await this.temp.createIndexes({
			indexes: [
				{
					expireAfterSeconds: 31600,
					key: { createdAt: 1 },
					name: "expireAfterSecondsIndex",
				},
			],
		});
	}

	async getChatRedditPosts(chatid: number): Promise<string[]> {
		const reddits = await this.chats.findOne({ _id: chatid });
		return reddits?.reddits || [];
	}

	async getAllRedditPosts(): Promise<string[]> {
		return [
			...new Set(
				(await this.chats.find().toArray()).flatMap((redditChat) =>
					redditChat.reddits
				),
			),
		];
	}
	async getRedditPostChat(
		id: string,
	): Promise<{ chatId: number; botId: number }[]> {
		const chats: RedditChat[] = await this.chats.find({
			reddits: { $elemMatch: { $eq: id } },
		}).toArray();
		const resultArray: { chatId: number; botId: number }[] = [];
		chats.forEach((chat) => {
			chat.reddits.forEach((reddit) => {
				if (reddit === id) {
					resultArray.push({ chatId: chat._id, botId: chat.botid });
				}
			});
		});
		return resultArray;
	}

	async newRedditPostChat(
		chatid: number,
		id: string,
		botid: number,
	): Promise<boolean> {
		const { modifiedCount = 0, upsertedId = null } = await this.chats
			.updateOne(
				{
					_id: chatid,
					botid: botid,
					reddits: { $not: { $elemMatch: { $eq: id } } },
				},
				{ $push: { reddits: { $each: [id] } } },
				{ upsert: true },
			);
		if (modifiedCount === 0 && upsertedId === null) {
			throw new Error("Already Subscribed to this subreddit");
		}
		return true;
	}

	async getallchatscount(): Promise<number> {
		return await this.chats.countDocuments();
	}

	async deleteRedditPostChat(
		id: string,
		chatid: number,
		botid: number,
	): Promise<boolean> {
		const result = await this.chats.updateOne(
			{ _id: chatid, botid: botid },
			{
				$pull: { reddits: id },
			},
		);
		if (result.modifiedCount === 0) {
			throw new Error("Not Subscribed to this subreddit");
		}
		return true;
	}

	async storeConnection(
		chatid: number,
		id: number,
	): Promise<number | ObjectId> {
		return await this.temp.insertOne({
			_id: chatid,
			chat: id,
		}).catch(
			(): never => {
				throw new Error("Current Chat is already linked to another chat");
			},
		);
	}

	async deleteConnection(chatid: number): Promise<boolean> {
		return (await this.temp.deleteOne({ _id: chatid })) === 0 &&
			((): never => {
				throw new Error("Current Chat is Not linked to any chat");
			})();
	}

	async getConnection(chatid: number): Promise<number | undefined> {
		const data: TempChat | undefined = await this.temp.findOne({
			_id: chatid,
		});
		return data?.chat;
	}

	async newpost(id: string, title: string): Promise<boolean> {
		const { modifiedCount = 0, upsertedId = null } = await this.posts
			.updateOne(
				{ _id: id },
				{ $set: { title: title } },
				{ upsert: true },
			);
		if (modifiedCount === 0 && upsertedId === null) {
			return false;
		}
		return true;
	}

	async getbottoken(id: number): Promise<string | undefined> {
		const data: Clones | undefined = await this.clones.findOne({
			_id: id,
		});
		return data?.Token;
	}

	async storebottoken(
		id: number,
		token: string,
	): Promise<boolean> {
		const { modifiedCount = 0, upsertedId = null } = await this.clones
			.updateOne(
				{ _id: id },
				{ $set: { Token: token } },
				{ upsert: true },
			);
		if (modifiedCount === 0 && upsertedId === null) {
			return false;
		}
		return true;
	}

	async deletebottoken(token: string) {
		await this.clones.deleteOne({ Token: token });
	}

	async getallbots(): Promise<number> {
		return await this.clones.countDocuments();
	}
}

const redditDb = new RedditDatabase();
await redditDb.connect(
	new Config().dbUrl,
	"reddit",
);

export default redditDb;
