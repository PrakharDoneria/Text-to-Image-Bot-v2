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
        const response = await fetch("https://api.nyxs.pw/ai-image/image-generator", {
            method: "GET",
            headers: {
                "Content-Type": "application/json"
            },
            query: new URLSearchParams({
                prompt: prompt,
                model: randomModel,
                style: "cinematic"
            }).toString()
        });
        const data = await response.json();
        if (data.status === "false") {
            await ctx.api.deleteMessage(ctx.chat.id, messageId);
            return ctx.reply(JSON.stringify(data, null, 2));
        }
        const imageBuffer = new Uint8Array(await response.arrayBuffer());
        const imageFile = new Blob([
            imageBuffer
        ], {
            type: "image/jpeg"
        });
        await ctx.replyWithChatAction("upload_photo");
        await ctx.replyWithPhoto({
            source: imageFile
        }, {
            caption: `Here is your image for prompt: ${prompt}\nDownload the app: ${APP_DOWNLOAD_LINK}\nSubscribe to the API: ${API_LINK}`
        });
        await ctx.api.deleteMessage(ctx.chat.id, messageId);
    } catch (error) {
        console.error("Error:", error);
        await ctx.api.deleteMessage(ctx.chat.id, messageId);
        ctx.reply(`An error occurred: ${JSON.stringify(error, null, 2)}`);
    }
});
bot.start();
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImZpbGU6Ly8vaG9tZS9ydW5uZXIvVGV4dC10by1JbWFnZS1Cb3QtdjIvaW5kZXgudHMiXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgQm90IH0gZnJvbSBcImh0dHBzOi8vZGVuby5sYW5kL3gvZ3JhbW15L21vZC50c1wiO1xuXG5jb25zdCBib3RUb2tlbiA9IERlbm8uZW52LmdldChcIkJPVF9UT0tFTlwiKSB8fCBcIlwiO1xuY29uc3QgYm90ID0gbmV3IEJvdChib3RUb2tlbik7XG5cbmNvbnN0IG1vZGVscyA9IFtcbiAgXCJhbmltYWdpbmVcIixcbiAgXCJkcmVhbXNoYXBlclwiLFxuICBcImR5bmF2aXNpb25cIixcbiAgXCJqdWdnZXJcIixcbiAgXCJyZWFsaXNtXCIsXG4gIFwicmVhbHZpc1wiLFxuICBcInNkX3hsX2Jhc2VcIixcbiAgXCJ0dXJib3Zpc2lvblwiLFxuXTtcblxuY29uc3QgQVBQX0RPV05MT0FEX0xJTksgPSBcImh0dHBzOi8vcGxheS5nb29nbGUuY29tL3N0b3JlL2FwcHMvZGV0YWlscz9pZD1jb20ucHJvdGVjZ2FtZXMudmVyYm92aXNpb25zXCI7XG5jb25zdCBBUElfTElOSyA9IFwiaHR0cHM6Ly93d3cuYWxsdGhpbmdzZGV2LmNvL2FwaW1hcmtldHBsYWNlL3ZlcmJvdmlzaW9ucy12Mi82NjhmYmQ1OWY3ZTk5ODY1ZDg5ZGI2YTFcIjtcblxuYm90LmNvbW1hbmQoXCJzdGFydFwiLCAoY3R4KSA9PiBjdHgucmVwbHkoXCJXZWxjb21lISBVc2UgL2hlbHAgdG8gZ2V0IGluZm9ybWF0aW9uIGFib3V0IGF2YWlsYWJsZSBjb21tYW5kcy5cIikpO1xuXG5ib3QuY29tbWFuZChcImhlbHBcIiwgKGN0eCkgPT4ge1xuICBjdHgucmVwbHkoYEF2YWlsYWJsZSBjb21tYW5kczpcbi9zdGFydCAtIFN0YXJ0IHRoZSBib3Rcbi9oZWxwIC0gR2V0IGluZm9ybWF0aW9uIGFib3V0IGF2YWlsYWJsZSBjb21tYW5kc1xuL2Rvd25sb2FkIC0gR2V0IHRoZSBsaW5rIHRvIGRvd25sb2FkIHRoZSBBbmRyb2lkIGFwcFxuL2FwaSAtIEdldCB0aGUgQVBJIHN1YnNjcmlwdGlvbiBsaW5rXG4vaW1hZ2luZSB7cHJvbXB0fSAtIEdlbmVyYXRlIGFuIGltYWdlIGJhc2VkIG9uIHRoZSBwcm9tcHRgKTtcbn0pO1xuXG5ib3QuY29tbWFuZChcImRvd25sb2FkXCIsIChjdHgpID0+IHtcbiAgY3R4LnJlcGx5KGBEb3dubG9hZCB0aGUgQW5kcm9pZCBhcHA6ICR7QVBQX0RPV05MT0FEX0xJTkt9YCk7XG59KTtcblxuYm90LmNvbW1hbmQoXCJhcGlcIiwgKGN0eCkgPT4ge1xuICBjdHgucmVwbHkoYE1ha2UgeW91ciBvd24gY2xpZW50LCBzdWJzY3JpYmUgdGhlIEFQSTogJHtBUElfTElOS31gKTtcbn0pO1xuXG5ib3QuY29tbWFuZChcImltYWdpbmVcIiwgYXN5bmMgKGN0eCkgPT4ge1xuICBjb25zdCBwcm9tcHQgPSBjdHgubWF0Y2g7XG5cbiAgaWYgKCFwcm9tcHQpIHtcbiAgICByZXR1cm4gY3R4LnJlcGx5KFwiUHJvbXB0IGlzIHJlcXVpcmVkXCIpO1xuICB9XG5cbiAgY29uc3QgcmFuZG9tTW9kZWwgPSBtb2RlbHNbTWF0aC5mbG9vcihNYXRoLnJhbmRvbSgpICogbW9kZWxzLmxlbmd0aCldO1xuICBsZXQgbWVzc2FnZUlkO1xuXG4gIHRyeSB7XG4gICAgYXdhaXQgY3R4LnJlcGx5KFwiTWFraW5nIHRoZSBtYWdpYyBoYXBwZW4g4pyoXCIpLnRoZW4oKG1lc3NhZ2UpID0+IHtcbiAgICAgIG1lc3NhZ2VJZCA9IG1lc3NhZ2UubWVzc2FnZV9pZDtcbiAgICB9KTtcblxuICAgIGF3YWl0IGN0eC5yZXBseVdpdGhDaGF0QWN0aW9uKFwidHlwaW5nXCIpO1xuXG4gICAgY29uc3QgcmVzcG9uc2UgPSBhd2FpdCBmZXRjaChcbiAgICAgIFwiaHR0cHM6Ly9hcGkubnl4cy5wdy9haS1pbWFnZS9pbWFnZS1nZW5lcmF0b3JcIixcbiAgICAgIHtcbiAgICAgICAgbWV0aG9kOiBcIkdFVFwiLFxuICAgICAgICBoZWFkZXJzOiB7IFwiQ29udGVudC1UeXBlXCI6IFwiYXBwbGljYXRpb24vanNvblwiIH0sXG4gICAgICAgIHF1ZXJ5OiBuZXcgVVJMU2VhcmNoUGFyYW1zKHtcbiAgICAgICAgICBwcm9tcHQ6IHByb21wdCxcbiAgICAgICAgICBtb2RlbDogcmFuZG9tTW9kZWwsXG4gICAgICAgICAgc3R5bGU6IFwiY2luZW1hdGljXCIsXG4gICAgICAgIH0pLnRvU3RyaW5nKCksXG4gICAgICB9XG4gICAgKTtcblxuICAgIGNvbnN0IGRhdGEgPSBhd2FpdCByZXNwb25zZS5qc29uKCk7XG5cbiAgICBpZiAoZGF0YS5zdGF0dXMgPT09IFwiZmFsc2VcIikge1xuICAgICAgYXdhaXQgY3R4LmFwaS5kZWxldGVNZXNzYWdlKGN0eC5jaGF0LmlkLCBtZXNzYWdlSWQpO1xuICAgICAgcmV0dXJuIGN0eC5yZXBseShKU09OLnN0cmluZ2lmeShkYXRhLCBudWxsLCAyKSk7XG4gICAgfVxuXG4gICAgY29uc3QgaW1hZ2VCdWZmZXIgPSBuZXcgVWludDhBcnJheShhd2FpdCByZXNwb25zZS5hcnJheUJ1ZmZlcigpKTtcbiAgICBjb25zdCBpbWFnZUZpbGUgPSBuZXcgQmxvYihbaW1hZ2VCdWZmZXJdLCB7IHR5cGU6IFwiaW1hZ2UvanBlZ1wiIH0pO1xuXG4gICAgYXdhaXQgY3R4LnJlcGx5V2l0aENoYXRBY3Rpb24oXCJ1cGxvYWRfcGhvdG9cIik7XG5cbiAgICBhd2FpdCBjdHgucmVwbHlXaXRoUGhvdG8oXG4gICAgICB7IHNvdXJjZTogaW1hZ2VGaWxlIH0sXG4gICAgICB7XG4gICAgICAgIGNhcHRpb246IGBIZXJlIGlzIHlvdXIgaW1hZ2UgZm9yIHByb21wdDogJHtwcm9tcHR9XFxuRG93bmxvYWQgdGhlIGFwcDogJHtBUFBfRE9XTkxPQURfTElOS31cXG5TdWJzY3JpYmUgdG8gdGhlIEFQSTogJHtBUElfTElOS31gLFxuICAgICAgfVxuICAgICk7XG5cbiAgICBhd2FpdCBjdHguYXBpLmRlbGV0ZU1lc3NhZ2UoY3R4LmNoYXQuaWQsIG1lc3NhZ2VJZCk7XG4gIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgY29uc29sZS5lcnJvcihcIkVycm9yOlwiLCBlcnJvcik7XG4gICAgYXdhaXQgY3R4LmFwaS5kZWxldGVNZXNzYWdlKGN0eC5jaGF0LmlkLCBtZXNzYWdlSWQpO1xuICAgIGN0eC5yZXBseShgQW4gZXJyb3Igb2NjdXJyZWQ6ICR7SlNPTi5zdHJpbmdpZnkoZXJyb3IsIG51bGwsIDIpfWApO1xuICB9XG59KTtcblxuYm90LnN0YXJ0KCk7XG4iXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsU0FBUyxHQUFHLFFBQVEsb0NBQW9DO0FBRXhELE1BQU0sV0FBVyxLQUFLLEdBQUcsQ0FBQyxHQUFHLENBQUMsZ0JBQWdCO0FBQzlDLE1BQU0sTUFBTSxJQUFJLElBQUk7QUFFcEIsTUFBTSxTQUFTO0lBQ2I7SUFDQTtJQUNBO0lBQ0E7SUFDQTtJQUNBO0lBQ0E7SUFDQTtDQUNEO0FBRUQsTUFBTSxvQkFBb0I7QUFDMUIsTUFBTSxXQUFXO0FBRWpCLElBQUksT0FBTyxDQUFDLFNBQVMsQ0FBQyxNQUFRLElBQUksS0FBSyxDQUFDO0FBRXhDLElBQUksT0FBTyxDQUFDLFFBQVEsQ0FBQyxNQUFRO0lBQzNCLElBQUksS0FBSyxDQUFDLENBQUM7Ozs7O3lEQUs0QyxDQUFDO0FBQzFEO0FBRUEsSUFBSSxPQUFPLENBQUMsWUFBWSxDQUFDLE1BQVE7SUFDL0IsSUFBSSxLQUFLLENBQUMsQ0FBQywwQkFBMEIsRUFBRSxrQkFBa0IsQ0FBQztBQUM1RDtBQUVBLElBQUksT0FBTyxDQUFDLE9BQU8sQ0FBQyxNQUFRO0lBQzFCLElBQUksS0FBSyxDQUFDLENBQUMseUNBQXlDLEVBQUUsU0FBUyxDQUFDO0FBQ2xFO0FBRUEsSUFBSSxPQUFPLENBQUMsV0FBVyxPQUFPLE1BQVE7SUFDcEMsTUFBTSxTQUFTLElBQUksS0FBSztJQUV4QixJQUFJLENBQUMsUUFBUTtRQUNYLE9BQU8sSUFBSSxLQUFLLENBQUM7SUFDbkIsQ0FBQztJQUVELE1BQU0sY0FBYyxNQUFNLENBQUMsS0FBSyxLQUFLLENBQUMsS0FBSyxNQUFNLEtBQUssT0FBTyxNQUFNLEVBQUU7SUFDckUsSUFBSTtJQUVKLElBQUk7UUFDRixNQUFNLElBQUksS0FBSyxDQUFDLDZCQUE2QixJQUFJLENBQUMsQ0FBQyxVQUFZO1lBQzdELFlBQVksUUFBUSxVQUFVO1FBQ2hDO1FBRUEsTUFBTSxJQUFJLG1CQUFtQixDQUFDO1FBRTlCLE1BQU0sV0FBVyxNQUFNLE1BQ3JCLGdEQUNBO1lBQ0UsUUFBUTtZQUNSLFNBQVM7Z0JBQUUsZ0JBQWdCO1lBQW1CO1lBQzlDLE9BQU8sSUFBSSxnQkFBZ0I7Z0JBQ3pCLFFBQVE7Z0JBQ1IsT0FBTztnQkFDUCxPQUFPO1lBQ1QsR0FBRyxRQUFRO1FBQ2I7UUFHRixNQUFNLE9BQU8sTUFBTSxTQUFTLElBQUk7UUFFaEMsSUFBSSxLQUFLLE1BQU0sS0FBSyxTQUFTO1lBQzNCLE1BQU0sSUFBSSxHQUFHLENBQUMsYUFBYSxDQUFDLElBQUksSUFBSSxDQUFDLEVBQUUsRUFBRTtZQUN6QyxPQUFPLElBQUksS0FBSyxDQUFDLEtBQUssU0FBUyxDQUFDLE1BQU0sSUFBSSxFQUFFO1FBQzlDLENBQUM7UUFFRCxNQUFNLGNBQWMsSUFBSSxXQUFXLE1BQU0sU0FBUyxXQUFXO1FBQzdELE1BQU0sWUFBWSxJQUFJLEtBQUs7WUFBQztTQUFZLEVBQUU7WUFBRSxNQUFNO1FBQWE7UUFFL0QsTUFBTSxJQUFJLG1CQUFtQixDQUFDO1FBRTlCLE1BQU0sSUFBSSxjQUFjLENBQ3RCO1lBQUUsUUFBUTtRQUFVLEdBQ3BCO1lBQ0UsU0FBUyxDQUFDLCtCQUErQixFQUFFLE9BQU8sb0JBQW9CLEVBQUUsa0JBQWtCLHdCQUF3QixFQUFFLFNBQVMsQ0FBQztRQUNoSTtRQUdGLE1BQU0sSUFBSSxHQUFHLENBQUMsYUFBYSxDQUFDLElBQUksSUFBSSxDQUFDLEVBQUUsRUFBRTtJQUMzQyxFQUFFLE9BQU8sT0FBTztRQUNkLFFBQVEsS0FBSyxDQUFDLFVBQVU7UUFDeEIsTUFBTSxJQUFJLEdBQUcsQ0FBQyxhQUFhLENBQUMsSUFBSSxJQUFJLENBQUMsRUFBRSxFQUFFO1FBQ3pDLElBQUksS0FBSyxDQUFDLENBQUMsbUJBQW1CLEVBQUUsS0FBSyxTQUFTLENBQUMsT0FBTyxJQUFJLEVBQUUsR0FBRyxDQUFDO0lBQ2xFO0FBQ0Y7QUFFQSxJQUFJLEtBQUsifQ==