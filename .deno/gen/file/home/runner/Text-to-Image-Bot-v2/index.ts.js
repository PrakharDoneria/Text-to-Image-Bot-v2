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
bot.command("start", (ctx)=>ctx.reply("Welcome! Use /help to get information about available commands."));
bot.command("help", (ctx)=>{
    ctx.reply(`Available commands:
/start - Start the bot
/help - Get information about available commands
/download - Get the link to download the Android app
/api - Get the API subscription link
/imagine {prompt} - Generate an image based on the prompt`);
});
bot.command("download", (ctx)=>{
    ctx.reply(`Download the Android app: ${APP_DOWNLOAD_LINK}`);
});
bot.command("api", (ctx)=>{
    ctx.reply(`Make your own client, subscribe the API: ${API_LINK}`);
});
bot.command("imagine", async (ctx)=>{
    const prompt = ctx.match;
    if (!prompt) {
        return ctx.reply("Prompt is required");
    }
    const randomModel = models[Math.floor(Math.random() * models.length)];
    let messageId;
    try {
        await ctx.reply("Making the magic happen ✨").then((message)=>{
            messageId = message.message_id;
        });
        await ctx.replyWithChatAction("typing");
        const response = await fetch('https://api.nyxs.pw/ai-image/image-generator', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            },
            query: new URLSearchParams({
                prompt: prompt,
                model: randomModel,
                style: 'cinematic'
            }).toString()
        });
        const data = await response.json();
        if (data.status === 'false') {
            await ctx.api.deleteMessage(ctx.chat.id, messageId);
            return ctx.reply(data.message);
        }
        const imageBuffer = new Uint8Array(await response.arrayBuffer());
        const imageFile = new Blob([
            imageBuffer
        ], {
            type: 'image/jpeg'
        });
        await ctx.replyWithChatAction("upload_photo");
        await ctx.replyWithPhoto({
            source: imageFile
        }, {
            caption: `Here is your image for prompt: ${prompt}\nDownload the app: ${APP_DOWNLOAD_LINK}\nSubscribe to the API: ${API_LINK}`
        });
        await ctx.api.deleteMessage(ctx.chat.id, messageId);
    } catch (error) {
        console.error('Error:', error);
        await ctx.api.deleteMessage(ctx.chat.id, messageId);
        ctx.reply(`An error occurred: ${error.message}`);
    }
});
bot.start();
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImZpbGU6Ly8vaG9tZS9ydW5uZXIvVGV4dC10by1JbWFnZS1Cb3QtdjIvaW5kZXgudHMiXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgQm90IH0gZnJvbSBcImh0dHBzOi8vZGVuby5sYW5kL3gvZ3JhbW15L21vZC50c1wiO1xuXG5jb25zdCBib3RUb2tlbiA9IERlbm8uZW52LmdldChcIkJPVF9UT0tFTlwiKSB8fCBcIlwiO1xuY29uc3QgYm90ID0gbmV3IEJvdChib3RUb2tlbik7XG5cbmNvbnN0IG1vZGVscyA9IFtcbiAgICBcImFuaW1hZ2luZVwiLFxuICAgIFwiZHJlYW1zaGFwZXJcIixcbiAgICBcImR5bmF2aXNpb25cIixcbiAgICBcImp1Z2dlclwiLFxuICAgIFwicmVhbGlzbVwiLFxuICAgIFwicmVhbHZpc1wiLFxuICAgIFwic2RfeGxfYmFzZVwiLFxuICAgIFwidHVyYm92aXNpb25cIlxuXTtcblxuY29uc3QgQVBQX0RPV05MT0FEX0xJTksgPSBcImh0dHBzOi8vcGxheS5nb29nbGUuY29tL3N0b3JlL2FwcHMvZGV0YWlscz9pZD1jb20ucHJvdGVjZ2FtZXMudmVyYm92aXNpb25zXCI7XG5jb25zdCBBUElfTElOSyA9IFwiaHR0cHM6Ly93d3cuYWxsdGhpbmdzZGV2LmNvL2FwaW1hcmtldHBsYWNlL3ZlcmJvdmlzaW9ucy12Mi82NjhmYmQ1OWY3ZTk5ODY1ZDg5ZGI2YTFcIjtcblxuYm90LmNvbW1hbmQoXCJzdGFydFwiLCAoY3R4KSA9PiBjdHgucmVwbHkoXCJXZWxjb21lISBVc2UgL2hlbHAgdG8gZ2V0IGluZm9ybWF0aW9uIGFib3V0IGF2YWlsYWJsZSBjb21tYW5kcy5cIikpO1xuXG5ib3QuY29tbWFuZChcImhlbHBcIiwgKGN0eCkgPT4ge1xuICAgIGN0eC5yZXBseShgQXZhaWxhYmxlIGNvbW1hbmRzOlxuL3N0YXJ0IC0gU3RhcnQgdGhlIGJvdFxuL2hlbHAgLSBHZXQgaW5mb3JtYXRpb24gYWJvdXQgYXZhaWxhYmxlIGNvbW1hbmRzXG4vZG93bmxvYWQgLSBHZXQgdGhlIGxpbmsgdG8gZG93bmxvYWQgdGhlIEFuZHJvaWQgYXBwXG4vYXBpIC0gR2V0IHRoZSBBUEkgc3Vic2NyaXB0aW9uIGxpbmtcbi9pbWFnaW5lIHtwcm9tcHR9IC0gR2VuZXJhdGUgYW4gaW1hZ2UgYmFzZWQgb24gdGhlIHByb21wdGApO1xufSk7XG5cbmJvdC5jb21tYW5kKFwiZG93bmxvYWRcIiwgKGN0eCkgPT4ge1xuICAgIGN0eC5yZXBseShgRG93bmxvYWQgdGhlIEFuZHJvaWQgYXBwOiAke0FQUF9ET1dOTE9BRF9MSU5LfWApO1xufSk7XG5cbmJvdC5jb21tYW5kKFwiYXBpXCIsIChjdHgpID0+IHtcbiAgICBjdHgucmVwbHkoYE1ha2UgeW91ciBvd24gY2xpZW50LCBzdWJzY3JpYmUgdGhlIEFQSTogJHtBUElfTElOS31gKTtcbn0pO1xuXG5ib3QuY29tbWFuZChcImltYWdpbmVcIiwgYXN5bmMgKGN0eCkgPT4ge1xuICAgIGNvbnN0IHByb21wdCA9IGN0eC5tYXRjaDtcblxuICAgIGlmICghcHJvbXB0KSB7XG4gICAgICAgIHJldHVybiBjdHgucmVwbHkoXCJQcm9tcHQgaXMgcmVxdWlyZWRcIik7XG4gICAgfVxuXG4gICAgY29uc3QgcmFuZG9tTW9kZWwgPSBtb2RlbHNbTWF0aC5mbG9vcihNYXRoLnJhbmRvbSgpICogbW9kZWxzLmxlbmd0aCldO1xuICAgIGxldCBtZXNzYWdlSWQ7XG5cbiAgICB0cnkge1xuICAgICAgICBhd2FpdCBjdHgucmVwbHkoXCJNYWtpbmcgdGhlIG1hZ2ljIGhhcHBlbiDinKhcIilcbiAgICAgICAgICAgIC50aGVuKChtZXNzYWdlKSA9PiB7XG4gICAgICAgICAgICAgICAgbWVzc2FnZUlkID0gbWVzc2FnZS5tZXNzYWdlX2lkO1xuICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgYXdhaXQgY3R4LnJlcGx5V2l0aENoYXRBY3Rpb24oXCJ0eXBpbmdcIik7XG5cbiAgICAgICAgY29uc3QgcmVzcG9uc2UgPSBhd2FpdCBmZXRjaCgnaHR0cHM6Ly9hcGkubnl4cy5wdy9haS1pbWFnZS9pbWFnZS1nZW5lcmF0b3InLCB7XG4gICAgICAgICAgICBtZXRob2Q6ICdHRVQnLFxuICAgICAgICAgICAgaGVhZGVyczogeyAnQ29udGVudC1UeXBlJzogJ2FwcGxpY2F0aW9uL2pzb24nIH0sXG4gICAgICAgICAgICBxdWVyeTogbmV3IFVSTFNlYXJjaFBhcmFtcyh7XG4gICAgICAgICAgICAgICAgcHJvbXB0OiBwcm9tcHQsXG4gICAgICAgICAgICAgICAgbW9kZWw6IHJhbmRvbU1vZGVsLFxuICAgICAgICAgICAgICAgIHN0eWxlOiAnY2luZW1hdGljJ1xuICAgICAgICAgICAgfSkudG9TdHJpbmcoKSxcbiAgICAgICAgfSk7XG5cbiAgICAgICAgY29uc3QgZGF0YSA9IGF3YWl0IHJlc3BvbnNlLmpzb24oKTtcblxuICAgICAgICBpZiAoZGF0YS5zdGF0dXMgPT09ICdmYWxzZScpIHtcbiAgICAgICAgICAgIGF3YWl0IGN0eC5hcGkuZGVsZXRlTWVzc2FnZShjdHguY2hhdC5pZCwgbWVzc2FnZUlkKTtcbiAgICAgICAgICAgIHJldHVybiBjdHgucmVwbHkoZGF0YS5tZXNzYWdlKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IGltYWdlQnVmZmVyID0gbmV3IFVpbnQ4QXJyYXkoYXdhaXQgcmVzcG9uc2UuYXJyYXlCdWZmZXIoKSk7XG4gICAgICAgIGNvbnN0IGltYWdlRmlsZSA9IG5ldyBCbG9iKFtpbWFnZUJ1ZmZlcl0sIHsgdHlwZTogJ2ltYWdlL2pwZWcnIH0pO1xuXG4gICAgICAgIGF3YWl0IGN0eC5yZXBseVdpdGhDaGF0QWN0aW9uKFwidXBsb2FkX3Bob3RvXCIpO1xuXG4gICAgICAgIGF3YWl0IGN0eC5yZXBseVdpdGhQaG90byhcbiAgICAgICAgICAgIHsgc291cmNlOiBpbWFnZUZpbGUgfSxcbiAgICAgICAgICAgIHsgY2FwdGlvbjogYEhlcmUgaXMgeW91ciBpbWFnZSBmb3IgcHJvbXB0OiAke3Byb21wdH1cXG5Eb3dubG9hZCB0aGUgYXBwOiAke0FQUF9ET1dOTE9BRF9MSU5LfVxcblN1YnNjcmliZSB0byB0aGUgQVBJOiAke0FQSV9MSU5LfWAgfVxuICAgICAgICApO1xuXG4gICAgICAgIGF3YWl0IGN0eC5hcGkuZGVsZXRlTWVzc2FnZShjdHguY2hhdC5pZCwgbWVzc2FnZUlkKTtcblxuICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgIGNvbnNvbGUuZXJyb3IoJ0Vycm9yOicsIGVycm9yKTtcbiAgICAgICAgYXdhaXQgY3R4LmFwaS5kZWxldGVNZXNzYWdlKGN0eC5jaGF0LmlkLCBtZXNzYWdlSWQpO1xuICAgICAgICBjdHgucmVwbHkoYEFuIGVycm9yIG9jY3VycmVkOiAke2Vycm9yLm1lc3NhZ2V9YCk7XG4gICAgfVxufSk7XG5cbmJvdC5zdGFydCgpO1xuIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLFNBQVMsR0FBRyxRQUFRLG9DQUFvQztBQUV4RCxNQUFNLFdBQVcsS0FBSyxHQUFHLENBQUMsR0FBRyxDQUFDLGdCQUFnQjtBQUM5QyxNQUFNLE1BQU0sSUFBSSxJQUFJO0FBRXBCLE1BQU0sU0FBUztJQUNYO0lBQ0E7SUFDQTtJQUNBO0lBQ0E7SUFDQTtJQUNBO0lBQ0E7Q0FDSDtBQUVELE1BQU0sb0JBQW9CO0FBQzFCLE1BQU0sV0FBVztBQUVqQixJQUFJLE9BQU8sQ0FBQyxTQUFTLENBQUMsTUFBUSxJQUFJLEtBQUssQ0FBQztBQUV4QyxJQUFJLE9BQU8sQ0FBQyxRQUFRLENBQUMsTUFBUTtJQUN6QixJQUFJLEtBQUssQ0FBQyxDQUFDOzs7Ozt5REFLMEMsQ0FBQztBQUMxRDtBQUVBLElBQUksT0FBTyxDQUFDLFlBQVksQ0FBQyxNQUFRO0lBQzdCLElBQUksS0FBSyxDQUFDLENBQUMsMEJBQTBCLEVBQUUsa0JBQWtCLENBQUM7QUFDOUQ7QUFFQSxJQUFJLE9BQU8sQ0FBQyxPQUFPLENBQUMsTUFBUTtJQUN4QixJQUFJLEtBQUssQ0FBQyxDQUFDLHlDQUF5QyxFQUFFLFNBQVMsQ0FBQztBQUNwRTtBQUVBLElBQUksT0FBTyxDQUFDLFdBQVcsT0FBTyxNQUFRO0lBQ2xDLE1BQU0sU0FBUyxJQUFJLEtBQUs7SUFFeEIsSUFBSSxDQUFDLFFBQVE7UUFDVCxPQUFPLElBQUksS0FBSyxDQUFDO0lBQ3JCLENBQUM7SUFFRCxNQUFNLGNBQWMsTUFBTSxDQUFDLEtBQUssS0FBSyxDQUFDLEtBQUssTUFBTSxLQUFLLE9BQU8sTUFBTSxFQUFFO0lBQ3JFLElBQUk7SUFFSixJQUFJO1FBQ0EsTUFBTSxJQUFJLEtBQUssQ0FBQyw2QkFDWCxJQUFJLENBQUMsQ0FBQyxVQUFZO1lBQ2YsWUFBWSxRQUFRLFVBQVU7UUFDbEM7UUFFSixNQUFNLElBQUksbUJBQW1CLENBQUM7UUFFOUIsTUFBTSxXQUFXLE1BQU0sTUFBTSxnREFBZ0Q7WUFDekUsUUFBUTtZQUNSLFNBQVM7Z0JBQUUsZ0JBQWdCO1lBQW1CO1lBQzlDLE9BQU8sSUFBSSxnQkFBZ0I7Z0JBQ3ZCLFFBQVE7Z0JBQ1IsT0FBTztnQkFDUCxPQUFPO1lBQ1gsR0FBRyxRQUFRO1FBQ2Y7UUFFQSxNQUFNLE9BQU8sTUFBTSxTQUFTLElBQUk7UUFFaEMsSUFBSSxLQUFLLE1BQU0sS0FBSyxTQUFTO1lBQ3pCLE1BQU0sSUFBSSxHQUFHLENBQUMsYUFBYSxDQUFDLElBQUksSUFBSSxDQUFDLEVBQUUsRUFBRTtZQUN6QyxPQUFPLElBQUksS0FBSyxDQUFDLEtBQUssT0FBTztRQUNqQyxDQUFDO1FBRUQsTUFBTSxjQUFjLElBQUksV0FBVyxNQUFNLFNBQVMsV0FBVztRQUM3RCxNQUFNLFlBQVksSUFBSSxLQUFLO1lBQUM7U0FBWSxFQUFFO1lBQUUsTUFBTTtRQUFhO1FBRS9ELE1BQU0sSUFBSSxtQkFBbUIsQ0FBQztRQUU5QixNQUFNLElBQUksY0FBYyxDQUNwQjtZQUFFLFFBQVE7UUFBVSxHQUNwQjtZQUFFLFNBQVMsQ0FBQywrQkFBK0IsRUFBRSxPQUFPLG9CQUFvQixFQUFFLGtCQUFrQix3QkFBd0IsRUFBRSxTQUFTLENBQUM7UUFBQztRQUdySSxNQUFNLElBQUksR0FBRyxDQUFDLGFBQWEsQ0FBQyxJQUFJLElBQUksQ0FBQyxFQUFFLEVBQUU7SUFFN0MsRUFBRSxPQUFPLE9BQU87UUFDWixRQUFRLEtBQUssQ0FBQyxVQUFVO1FBQ3hCLE1BQU0sSUFBSSxHQUFHLENBQUMsYUFBYSxDQUFDLElBQUksSUFBSSxDQUFDLEVBQUUsRUFBRTtRQUN6QyxJQUFJLEtBQUssQ0FBQyxDQUFDLG1CQUFtQixFQUFFLE1BQU0sT0FBTyxDQUFDLENBQUM7SUFDbkQ7QUFDSjtBQUVBLElBQUksS0FBSyJ9