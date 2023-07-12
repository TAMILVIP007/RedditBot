import "dotenv";

class Config {
	public token: string;
	public dbUrl: string;
	public webhookUrl: string;
	public port : number;
	public devs: number[];

	constructor() {
		this.token = Deno.env.get("TOKEN") || "";
		this.dbUrl = Deno.env.get("DB_URL") || "";
		this.devs = (Deno.env.get("DEVS") || "").split(",").map(Number);
		this.webhookUrl = Deno.env.get("WEBHOOK_PATH") || "";
		this.port = parseInt(Deno.env.get("PORT") || "8080");
	}
}
export default Config;
