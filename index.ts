import { Bot } from "https://deno.land/x/grammy/mod.ts";
import { serve } from "https://deno.land/std/http/server.ts";

const botToken = Deno.env.get("BOT_TOKEN") || "";
const bot = new Bot(botToken);

const APP_DOWNLOAD_LINK = "https://play.google.com/store/apps/details?id=com.protecgames.verbovisions";
const API_LINK = "https://www.allthingsdev.co/apimarketplace/verbovisions-v2/668fbd59f7e99865d89db6a1";

const kv = await Deno.openKv();

bot.command("start", (ctx) => ctx.reply("Welcome! Use /help to get information about available commands.", { reply_to_message_id: ctx.message.message_id }));

bot.command("help", (ctx) => {
  ctx.reply(`Available commands:
/start - Start the bot
/help - Get information about available commands
/download - Get the link to download the Android app
/api - Get the API subscription link
/save {api_key} - Save your API key for image generation
/imagine {prompt} - Generate an image based on the prompt`, { reply_to_message_id: ctx.message.message_id });
});

bot.command("download", (ctx) => {
  ctx.reply(`Download the Android app: ${APP_DOWNLOAD_LINK}`, { reply_to_message_id: ctx.message.message_id });
});

bot.command("api", (ctx) => {
  ctx.reply(`Make your own client, subscribe the API: ${API_LINK}`, { reply_to_message_id: ctx.message.message_id });
});

bot.command("save", async (ctx) => {
  const apiKey = ctx.match?.trim();

  if (!apiKey) {
    return ctx.reply("Please provide your API key. Use /save {api_key}", { reply_to_message_id: ctx.message.message_id });
  }

  try {
    await kv.set(["api_keys", ctx.from.id.toString()], apiKey);
    ctx.reply("Your API key has been saved successfully.", { reply_to_message_id: ctx.message.message_id });
  } catch (error) {
    console.error("Error saving API key:", error);
    ctx.reply("An error occurred while saving your API key.", { reply_to_message_id: ctx.message.message_id });
  }
});

bot.command("imagine", async (ctx) => {
  const prompt = ctx.match;

  if (!prompt) {
    return ctx.reply("Prompt is required. Use /imagine {prompt}", { reply_to_message_id: ctx.message.message_id });
  }

  try {
    const apiKey = (await kv.get(["api_keys", ctx.from.id.toString()])).value as string;

    if (!apiKey) {
      return ctx.reply("No API key found. Please use /save {api_key} to save your API key.", { reply_to_message_id: ctx.message.message_id });
    }

    const myHeaders = new Headers();
    myHeaders.append("x-apihub-key", apiKey);
    myHeaders.append("x-apihub-host", "VerboVisions-v2.allthingsdev.co");
    myHeaders.append("x-apihub-endpoint", "fcec7430-1bd2-4eca-a032-0770b2d9122e");

    const requestOptions = {
      method: "GET",
      headers: myHeaders,
      redirect: "follow",
    };

    const url = new URL("https://VerboVisions-v2.proxy-production.allthingsdev.co/generate");
    url.searchParams.append("prompt", prompt);

    const initialMessage = await ctx.reply("Making the magic happen ✨", { reply_to_message_id: ctx.message.message_id });

    const response = await fetch(url.toString(), requestOptions);

    if (response.ok) {
      const result = await response.json();
      const imageUrl = result.img;

      await ctx.replyWithPhoto(
        imageUrl,
        {
          caption: `Here is your image for prompt: ${prompt}\nDownload the app: ${APP_DOWNLOAD_LINK}\nSubscribe to the API: ${API_LINK}`,
          reply_to_message_id: ctx.message.message_id,
        }
      );

      await ctx.api.deleteMessage(ctx.chat.id, initialMessage.message_id);
    } else {
      ctx.reply(`Failed to fetch image. Status code: ${response.status}`, { reply_to_message_id: ctx.message.message_id });
      await ctx.api.deleteMessage(ctx.chat.id, initialMessage.message_id);
    }
  } catch (error) {
    console.error("Error:", error);
    ctx.reply(`An error occurred: ${JSON.stringify(error, null, 2)}`, { reply_to_message_id: ctx.message.message_id });
    await ctx.api.deleteMessage(ctx.chat.id, initialMessage.message_id);
  }
});

async function handleRequest(req: Request): Promise<Response> {
  if (req.method === "POST" && req.url.endswith("/webhook")) {
    const update = await req.json();
    bot.handleUpdate(update);
    return new Response("OK", { status: 200 });
  }
  if (req.method === "GET" && req.url.endsWith("/")) {
    return new Response("Server is active", { status: 200 });
  }
  return new Response("Not Found", { status: 404 });
}

async function startServer() {
  console.log("Server is running on http://localhost:8000");
  for await (const req of serve("0.0.0.0:8000")) {
    handleRequest(req).then(response => req.respond(response));
  }
}

await bot.api.setWebhook("https://verbovisions-bot.deno.dev/webhook");

startServer().catch(console.error);

bot.start();
