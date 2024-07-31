import { Bot } from "https://deno.land/x/grammy/mod.ts";

const botToken = Deno.env.get("BOT_TOKEN") || "";
const bot = new Bot(botToken);

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

  let messageId;

  try {
    await ctx.reply("Making the magic happen ✨").then((message) => {
      messageId = message.message_id;
    });

    await ctx.replyWithChatAction("typing");

    const url = "https://ai-api.magicstudio.com/api/ai-art-generator";
    const headers = {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36 Edg/124.0.0.0",
      "Accept": "application/json, text/plain, */*",
      "Accept-Encoding": "gzip, deflate, br, zstd",
      "Accept-Language": "en-US,en;q=0.9",
      "Origin": "https://magicstudio.com",
      "Referer": "https://magicstudio.com/ai-art-generator/",
    };
    const data = {
      "prompt": prompt,
      "output_format": "bytes",
      "user_profile_id": "null",
      "anonymous_user_id": "a584e30d-1996-4598-909f-70c7ac715dc1",
      "request_timestamp": "1715704441.446",
      "user_is_subscribed": "false",
      "client_id": "pSgX7WgjukXCBoYwDM8G8GLnRRkvAoJlqa5eAVvj95o",
    };

    const response = await fetch(url, {
      method: "POST",
      headers: headers,
      body: JSON.stringify(data),
    });

    if (response.status === 200) {
      const imageBuffer = new Uint8Array(await response.arrayBuffer());
      const imageFile = new Blob([imageBuffer], { type: "image/png" });

      await ctx.replyWithChatAction("upload_photo");

      await ctx.replyWithPhoto(
        { source: imageFile.stream() },
        {
          caption: `Here is your image for prompt: ${prompt}\nDownload the app: ${APP_DOWNLOAD_LINK}\nSubscribe to the API: ${API_LINK}`,
        }
      );
    } else {
      await ctx.api.deleteMessage(ctx.chat.id, messageId);
      ctx.reply(`Failed to fetch image. Status code: ${response.status}`);
    }
  } catch (error) {
    console.error("Error:", error);
    await ctx.api.deleteMessage(ctx.chat.id, messageId);
    ctx.reply(`An error occurred: ${JSON.stringify(error, null, 2)}`);
  }
});

bot.start();
