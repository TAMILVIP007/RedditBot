<h1>Reddit AutoPoster Bot</h1>
A simple Autoposter Telegram bot written using <a href="https://grammy.dev">Grammy Framework</a> in Typescript and using Mongo database. This bot let users to subscribe to a specific subreddit and automatically posts new submissions to a designated channel. The bot is designed to run continuously, checking for new posts at a regular interval and posting them to the channel using the Telegram API.

<h2>Setup</h2>

<h2>Local Hosting</h2>

<p>To get started, clone this repository to your local machine and navigate to the project directory using below command</p>

<pre><code>git clone https://github.com/TAMILVIP007/RedditBot.git && cd RedditBot</code></pre>

<p>Before running the bot, you will need to configure it with your Telegram API key, the subreddit you want to monitor, and the channel you want to post to. To do this, create a <code>.env</code> file in the project directory and add the following lines:</p>

<pre><code>TOKEN=&lt;your Telegram bot token&gt;
DB_URL=&lt;your database URL&gt;
DEVS=&lt;comma-separated list of developer Telegram IDs&gt;
WEBHOOK_PATH=&lt;your webhook path&gt;
PORT=&lt;port number&gt;</code></pre>

<p>Replace <code>&lt;your Telegram bot token&gt;</code> with your actual Telegram bot token, <code>&lt;your database URL&gt;</code> with the URL of your database, <code>&lt;comma-separated list of developer Telegram IDs&gt;</code> with a comma-separated list of Telegram IDs for developers who should receive error messages, <code>&lt;your webhook path&gt;</code> with the path to your webhook URL, and <code>&lt;port number&gt;</code> with the port number to listen on.</p>

<h2>Usage</h2>

<h3>Webhook</h3>
<p>To start the bot using a webhook, run the following command in the project directory:</p>

<pre><code>deno task start</code></pre>

<h3>Polling </h3>
<p>To host the bot using polling, run the following command in the project directory:</p>

<pre><code>deno task local </code></pre>

<p>This will start the bot and bot in polling mode </p>

<h2>Deno Deploy</h2>

[![Deploy Now!](https://img.shields.io/badge/Deploy%20Now-Deno%20Deploy-blue?style=for-the-badge&logo=deno)](https://dash.deno.com/new?url=https://raw.githubusercontent.com/TAMILVIP007/RedditBot/blob/main/main.ts&env=DB_URL,DEVS,WEBHOOK_PATH)


<p>
<b>1.</b> Open <a href="https://dash.deno.com">Deno Deploy</a>, create a new project.<br>
<b>2.</b> Fork <a href="https://github.com/TAMILVIP007/RedditBot.git">this</a> repo.<br>
<b>3.</b> Search for this repo on deno deploy, set branch as deno, set file as<code>main.ts</code><br>
<b>4.</b> Add your environment vars <code>DB_URL, DEVS, WEBHOOK_PATH</code>and click "Link".<br>
<b>5.</b> Once done, open the deployment page, copy deployment URL, set your bot's webhook using
    <code>https://api.telegram.org/bot<your_bot_token_here>/setWebhook?url=deployment_url_here?token=your_bot_token_here</code>.<br>
</p>

<h2>Contributing</h2>
<p>If you would like to contribute to this project, please fork the repository and submit a pull request with your changes. Contributions are always welcome and appreciated!</p>

<h2>License</h2>
<p>This project is licensed under the MIT License - see the <code>LICENSE</code> file for details.</p>

<h2>Disclaimer</h2>
<p>This software is provided "as is", without warranty of any kind, express or implied, including but not limited to the warranties of merchantability, fitness for a particular purpose and noninfringement. In no event shall the authors or copyright holders be liable for any claim, damages or other liability, whether in an actionof contract, tort or otherwise, arising from, out of or in connection with the software or the use or other dealings in the software.</p>
