import { Bot } from "https://deno.land/x/grammy/mod.ts";

const botToken = Deno.env.get("BOT_TOKEN") || "";
const bot = new Bot(botToken);

const models = [
    "animagine",
    "dreamshaper",
    "dynavision",
    "jugger",
    "realism",
    "realvis",
    "sd_xl_base",
    "turbovision"
];

const APP_DOWNLOAD_LINK = "https://play.google.com/store/apps/details?id=com.protecgames.verbovisions";
const API_LINK = "https://www.allthingsdev.co/apimarketplace/verbovisions-v2/668fbd59f7e99865d89db6a1";

bot.command("start", (ctx) => ctx.reply("Welcome! Use /help to get information about available commands."));

bot.command("help", (ctx) => {
    ctx.reply(`Available commands:
/start - Start the bot
/help - Get information about available commands
/download - Get the link to download the Android app
/api - Get the API subscription link
/imagine {prompt} - Generate an image based on the prompt`);
});

bot.command("download", (ctx) => {
    ctx.reply(`Download the Android app: ${APP_DOWNLOAD_LINK}`);
});

bot.command("api", (ctx) => {
    ctx.reply(`Make your own client, subscribe the API: ${API_LINK}`);
});

bot.command("imagine", async (ctx) => {
    const prompt = ctx.match;

    if (!prompt) {
        return ctx.reply("Prompt is required");
    }

    const randomModel = models[Math.floor(Math.random() * models.length)];
    let messageId;

    try {
        await ctx.reply("Making the magic happen ✨")
            .then((message) => {
                messageId = message.message_id;
            });

        await ctx.replyWithChatAction("typing");

        const response = await fetch('https://api.nyxs.pw/ai-image/image-generator', {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
            query: new URLSearchParams({
                prompt: prompt,
                model: randomModel,
                style: 'cinematic'
            }).toString(),
        });

        const data = await response.json();

        if (data.status === 'false') {
            await ctx.api.deleteMessage(ctx.chat.id, messageId);
            return ctx.reply(data.message);
        }

        const imageBuffer = new Uint8Array(await response.arrayBuffer());
        const imageFile = new Blob([imageBuffer], { type: 'image/jpeg' });

        await ctx.replyWithChatAction("upload_photo");

        await ctx.replyWithPhoto(
            { source: imageFile },
            { caption: `Here is your image for prompt: ${prompt}\nDownload the app: ${APP_DOWNLOAD_LINK}\nSubscribe to the API: ${API_LINK}` }
        );

        await ctx.api.deleteMessage(ctx.chat.id, messageId);

    } catch (error) {
        console.error('Error:', error);
        await ctx.api.deleteMessage(ctx.chat.id, messageId);
        ctx.reply(`An error occurred: ${error.message}`);
    }
});

bot.start();
