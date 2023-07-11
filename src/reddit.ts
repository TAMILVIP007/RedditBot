interface RedditPost {
	name: string;
	title: string;
	author: string;
	url: string;
	subreddit: string;
	image: string | null;
	video: string | null | undefined;
}

interface RedditApiResponse {
	data: {
		children: {
			data: {
				name: string;
				title: string;
				author: string;
				permalink: string;
				url_overridden_by_dest: string;
				subreddit_name_prefixed: string;
				preview?: {
					images: {
						source: {
							url: string;
						};
					}[];
				};
				is_video: boolean;
				media?: {
					reddit_video: {
						fallback_url: string;
					};
				};
			};
		}[];
	};
}

class Reddit {
	public getSubredditFromUrl(url: string): string | null {
		const regex = /\/r\/(\w+)/;
		const match = url.match(regex);
		return match ? match[1] : null;
	}

	public async fetchPosts(subreddit: string): Promise<RedditPost[]> {
		const res = await fetch(
			`https://www.reddit.com/r/${subreddit}/top.json?limit=5&t=day`,
		);
		const json: RedditApiResponse = await res.json();
		const posts = json.data.children.map((post) => {
			const data = post.data;
			return {
				name: data.name,
				title: data.title,
				author: data.author,
				url: "https://reddit.com" + data.permalink,
				subreddit: data.subreddit_name_prefixed,
				image: data.url_overridden_by_dest
					? data.url_overridden_by_dest.endsWith(".jpg") ||
							data.url_overridden_by_dest.endsWith(".png")
						? data.url_overridden_by_dest
						: null
					: null,
				video: data.is_video
					? data.media?.reddit_video.fallback_url
					: null,
			};
		});
		return posts;
	}

	public async fetchFirstPost(subreddit: string): Promise<RedditPost> {
		const posts = await this.fetchPosts(subreddit);
		return posts[0];
	}

	public async checkValidSubreddit(subredditUrl: string): Promise<boolean> {
		const posts = await this.fetchPosts(subredditUrl);
		return posts.length > 0;
	}
}

export default Reddit;
