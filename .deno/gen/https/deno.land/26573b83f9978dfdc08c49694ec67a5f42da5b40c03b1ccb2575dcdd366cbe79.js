// deno-lint-ignore-file camelcase
import { BotError, Composer, run } from "./composer.ts";
import { Context } from "./context.ts";
import { Api } from "./core/api.ts";
import { GrammyError, HttpError } from "./core/error.ts";
import { parse, preprocess } from "./filter.ts";
import { debug as d } from "./platform.deno.ts";
const debug = d("grammy:bot");
const debugWarn = d("grammy:warn");
const debugErr = d("grammy:error");
export const DEFAULT_UPDATE_TYPES = [
    "message",
    "edited_message",
    "channel_post",
    "edited_channel_post",
    "business_connection",
    "business_message",
    "edited_business_message",
    "deleted_business_messages",
    "inline_query",
    "chosen_inline_result",
    "callback_query",
    "shipping_query",
    "pre_checkout_query",
    "poll",
    "poll_answer",
    "my_chat_member",
    "chat_join_request",
    "chat_boost",
    "removed_chat_boost"
];
export { BotError };
/**
 * This is the single most important class of grammY. It represents your bot.
 *
 * First, you must create a bot by talking to @BotFather, check out
 * https://t.me/BotFather. Once it is ready, you obtain a secret token for your
 * bot. grammY will use that token to identify as your bot when talking to the
 * Telegram servers. Got the token? You are now ready to write some code and run
 * your bot!
 *
 * You should do three things to run your bot:
 * ```ts
 * // 1. Create a bot instance
 * const bot = new Bot('<secret-token>')
 * // 2. Listen for updates
 * bot.on('message:text', ctx => ctx.reply('You wrote: ' + ctx.message.text))
 * // 3. Launch it!
 * bot.start()
 * ```
 */ export class Bot extends Composer {
    token;
    pollingRunning;
    pollingAbortController;
    lastTriedUpdateId;
    /**
     * Gives you full access to the Telegram Bot API.
     * ```ts
     * // This is how to call the Bot API methods:
     * bot.api.sendMessage(chat_id, 'Hello, grammY!')
     * ```
     *
     * Use this only outside of your middleware. If you have access to `ctx`,
     * then using `ctx.api` instead of `bot.api` is preferred.
     */ api;
    me;
    mePromise;
    clientConfig;
    ContextConstructor;
    /** Used to log a warning if some update types are not in allowed_updates */ observedUpdateTypes;
    /**
     * Holds the bot's error handler that is invoked whenever middleware throws
     * (rejects). If you set your own error handler via `bot.catch`, all that
     * happens is that this variable is assigned.
     */ errorHandler;
    /**
     * Creates a new Bot with the given token.
     *
     * Remember that you can listen for messages by calling
     * ```ts
     * bot.on('message', ctx => { ... })
     * ```
     * or similar methods.
     *
     * The simplest way to start your bot is via simple long polling:
     * ```ts
     * bot.start()
     * ```
     *
     * @param token The bot's token as acquired from https://t.me/BotFather
     * @param config Optional configuration properties for the bot
     */ constructor(token, config){
        super();
        this.token = token;
        this.pollingRunning = false;
        this.lastTriedUpdateId = 0;
        this.observedUpdateTypes = new Set();
        this.errorHandler = async (err)=>{
            console.error("Error in middleware while handling update", err.ctx?.update?.update_id, err.error);
            console.error("No error handler was set!");
            console.error("Set your own error handler with `bot.catch = ...`");
            if (this.pollingRunning) {
                console.error("Stopping bot");
                await this.stop();
            }
            throw err;
        };
        if (!token) throw new Error("Empty token!");
        this.me = config?.botInfo;
        this.clientConfig = config?.client;
        this.ContextConstructor = config?.ContextConstructor ?? Context;
        this.api = new Api(token, this.clientConfig);
    }
    /**
     * Information about the bot itself as retrieved from `api.getMe()`. Only
     * available after the bot has been initialized via `await bot.init()`, or
     * after the value has been set manually.
     *
     * Starting the bot will always perform the initialization automatically,
     * unless a manual value is already set.
     *
     * Note that the recommended way to set a custom bot information object is
     * to pass it to the configuration object of the `new Bot()` instantiation,
     * rather than assigning this property.
     */ set botInfo(botInfo) {
        this.me = botInfo;
    }
    get botInfo() {
        if (this.me === undefined) {
            throw new Error("Bot information unavailable! Make sure to call `await bot.init()` before accessing `bot.botInfo`!");
        }
        return this.me;
    }
    /**
     * @inheritdoc
     */ on(filter, ...middleware) {
        for (const [u] of parse(filter).flatMap(preprocess)){
            this.observedUpdateTypes.add(u);
        }
        return super.on(filter, ...middleware);
    }
    /**
     * @inheritdoc
     */ reaction(reaction, ...middleware) {
        this.observedUpdateTypes.add("message_reaction");
        return super.reaction(reaction, ...middleware);
    }
    /**
     * Checks if the bot has been initialized. A bot is initialized if the bot
     * information is set. The bot information can either be set automatically
     * by calling `bot.init`, or manually through the bot constructor. Note that
     * usually, initialization is done automatically and you do not have to care
     * about this method.
     *
     * @returns true if the bot is initialized, and false otherwise
     */ isInited() {
        return this.me !== undefined;
    }
    /**
     * Initializes the bot, i.e. fetches information about the bot itself. This
     * method is called automatically, you usually don't have to call it
     * manually.
     *
     * @param signal Optional `AbortSignal` to cancel the initialization
     */ async init(signal) {
        if (!this.isInited()) {
            debug("Initializing bot");
            this.mePromise ??= withRetries(()=>this.api.getMe(signal), signal);
            let me;
            try {
                me = await this.mePromise;
            } finally{
                this.mePromise = undefined;
            }
            if (this.me === undefined) this.me = me;
            else debug("Bot info was set by now, will not overwrite");
        }
        debug(`I am ${this.me.username}!`);
    }
    /**
     * Internal. Do not call. Handles an update batch sequentially by supplying
     * it one-by-one to the middleware. Handles middleware errors and stores the
     * last update identifier that was being tried to handle.
     *
     * @param updates An array of updates to handle
     */ async handleUpdates(updates) {
        // handle updates sequentially (!)
        for (const update of updates){
            this.lastTriedUpdateId = update.update_id;
            try {
                await this.handleUpdate(update);
            } catch (err) {
                // should always be true
                if (err instanceof BotError) {
                    await this.errorHandler(err);
                } else {
                    console.error("FATAL: grammY unable to handle:", err);
                    throw err;
                }
            }
        }
    }
    /**
     * This is an internal method that you probably will not ever need to call.
     * It is used whenever a new update arrives from the Telegram servers that
     * your bot will handle.
     *
     * If you're writing a library on top of grammY, check out the
     * [documentation](https://grammy.dev/plugins/runner.html) of the runner
     * plugin for an example that uses this method.
     *
     * @param update An update from the Telegram Bot API
     * @param webhookReplyEnvelope An optional webhook reply envelope
     */ async handleUpdate(update, webhookReplyEnvelope) {
        if (this.me === undefined) {
            throw new Error("Bot not initialized! Either call `await bot.init()`, \
or directly set the `botInfo` option in the `Bot` constructor to specify \
a known bot info object.");
        }
        debug(`Processing update ${update.update_id}`);
        // create API object
        const api = new Api(this.token, this.clientConfig, webhookReplyEnvelope);
        // configure it with the same transformers as bot.api
        const t = this.api.config.installedTransformers();
        if (t.length > 0) api.config.use(...t);
        // create context object
        const ctx = new this.ContextConstructor(update, api, this.me);
        try {
            // run middleware stack
            await run(this.middleware(), ctx);
        } catch (err) {
            debugErr(`Error in middleware for update ${update.update_id}`);
            throw new BotError(err, ctx);
        }
    }
    /**
     * Starts your bot using long polling.
     *
     * > This method returns a `Promise` that will never resolve except if your
     * > bot is stopped. **You don't need to `await` the call to `bot.start`**,
     * > but remember to catch potential errors by calling `bot.catch`.
     * > Otherwise your bot will crash (and stop) if something goes wrong in
     * > your code.
     *
     * This method effectively enters a loop that will repeatedly call
     * `getUpdates` and run your middleware for every received update, allowing
     * your bot to respond to messages.
     *
     * If your bot is already running, this method does nothing.
     *
     * **Note that this starts your bot using a very simple long polling
     * implementation.** `bot.start` should only be used for small bots. While
     * the rest of grammY was built to perform well even under extreme loads,
     * simple long polling is not capable of scaling up in a similar fashion.
     * You should switch over to using `@grammyjs/runner` if you are running a
     * bot with high load.
     *
     * What exactly _high load_ means differs from bot to bot, but as a rule of
     * thumb, simple long polling should not be processing more than ~5K
     * messages every hour. Also, if your bot has long-running operations such
     * as large file transfers that block the middleware from completing, this
     * will impact the responsiveness negatively, so it makes sense to use the
     * `@grammyjs/runner` package even if you receive much fewer messages. If
     * you worry about how much load your bot can handle, check out the grammY
     * [documentation](https://grammy.dev/advanced/scaling.html) about scaling
     * up.
     *
     * @param options Options to use for simple long polling
     */ async start(options) {
        // Perform setup
        const setup = [];
        if (!this.isInited()) {
            setup.push(this.init(this.pollingAbortController?.signal));
        }
        if (this.pollingRunning) {
            await Promise.all(setup);
            debug("Simple long polling already running!");
            return;
        }
        this.pollingRunning = true;
        this.pollingAbortController = new AbortController();
        try {
            setup.push(withRetries(async ()=>{
                await this.api.deleteWebhook({
                    drop_pending_updates: options?.drop_pending_updates
                }, this.pollingAbortController?.signal);
            }, this.pollingAbortController?.signal));
            await Promise.all(setup);
            // All async ops of setup complete, run callback
            await options?.onStart?.(this.botInfo);
        } catch (err) {
            this.pollingRunning = false;
            this.pollingAbortController = undefined;
            throw err;
        }
        // Bot was stopped during `onStart`
        if (!this.pollingRunning) return;
        // Prevent common misuse that leads to missing updates
        validateAllowedUpdates(this.observedUpdateTypes, options?.allowed_updates);
        // Prevent common misuse that causes memory leak
        this.use = noUseFunction;
        // Start polling
        debug("Starting simple long polling");
        await this.loop(options);
        debug("Middleware is done running");
    }
    /**
     * Stops the bot from long polling.
     *
     * All middleware that is currently being executed may complete, but no
     * further `getUpdates` calls will be performed. The current `getUpdates`
     * request will be cancelled.
     *
     * In addition, this method will _confirm_ the last received update to the
     * Telegram servers by calling `getUpdates` one last time with the latest
     * offset value. If any updates are received in this call, they are
     * discarded and will be fetched again when the bot starts up the next time.
     * Confer the official documentation on confirming updates if you want to
     * know more: https://core.telegram.org/bots/api#getupdates
     *
     * > Note that this method will not wait for the middleware stack to finish.
     * > If you need to run code after all middleware is done, consider waiting
     * > for the promise returned by `bot.start()` to resolve.
     */ async stop() {
        if (this.pollingRunning) {
            debug("Stopping bot, saving update offset");
            this.pollingRunning = false;
            this.pollingAbortController?.abort();
            const offset = this.lastTriedUpdateId + 1;
            await this.api.getUpdates({
                offset,
                limit: 1
            }).finally(()=>this.pollingAbortController = undefined);
        } else {
            debug("Bot is not running!");
        }
    }
    /**
     * Sets the bots error handler that is used during long polling.
     *
     * You should call this method to set an error handler if you are using long
     * polling, no matter whether you use `bot.start` or the `@grammyjs/runner`
     * package to run your bot.
     *
     * Calling `bot.catch` when using other means of running your bot (or
     * webhooks) has no effect.
     *
     * @param errorHandler A function that handles potential middleware errors
     */ catch(errorHandler) {
        this.errorHandler = errorHandler;
    }
    /**
     * Internal. Do not call. Enters a loop that will perform long polling until
     * the bot is stopped.
     */ async loop(options) {
        const limit = options?.limit;
        const timeout = options?.timeout ?? 30; // seconds
        let allowed_updates = options?.allowed_updates ?? []; // reset to default if unspecified
        while(this.pollingRunning){
            // fetch updates
            const updates = await this.fetchUpdates({
                limit,
                timeout,
                allowed_updates
            });
            // check if polling stopped
            if (updates === undefined) break;
            // handle updates
            await this.handleUpdates(updates);
            // Telegram uses the last setting if `allowed_updates` is omitted so
            // we can save some traffic by only sending it in the first request
            allowed_updates = undefined;
        }
    }
    /**
     * Internal. Do not call. Reliably fetches an update batch via `getUpdates`.
     * Handles all known errors. Returns `undefined` if the bot is stopped and
     * the call gets cancelled.
     *
     * @param options Polling options
     * @returns An array of updates, or `undefined` if the bot is stopped.
     */ async fetchUpdates({ limit , timeout , allowed_updates  }) {
        const offset = this.lastTriedUpdateId + 1;
        let updates = undefined;
        do {
            try {
                updates = await this.api.getUpdates({
                    offset,
                    limit,
                    timeout,
                    allowed_updates
                }, this.pollingAbortController?.signal);
            } catch (error) {
                await this.handlePollingError(error);
            }
        }while (updates === undefined && this.pollingRunning)
        return updates;
    }
    /**
     * Internal. Do not call. Handles an error that occurred during long
     * polling.
     */ async handlePollingError(error) {
        if (!this.pollingRunning) {
            debug("Pending getUpdates request cancelled");
            return;
        }
        let sleepSeconds = 3;
        if (error instanceof GrammyError) {
            debugErr(error.message);
            // rethrow upon unauthorized or conflict
            if (error.error_code === 401 || error.error_code === 409) {
                throw error;
            } else if (error.error_code === 429) {
                debugErr("Bot API server is closing.");
                sleepSeconds = error.parameters.retry_after ?? sleepSeconds;
            }
        } else debugErr(error);
        debugErr(`Call to getUpdates failed, retrying in ${sleepSeconds} seconds ...`);
        await sleep(sleepSeconds);
    }
}
/**
 * Performs a network call task, retrying upon known errors until success.
 *
 * If the task errors and a retry_after value can be used, a subsequent retry
 * will be delayed by the specified period of time.
 *
 * Otherwise, if the first attempt at running the task fails, the task is
 * retried immediately. If second attempt fails, too, waits for 100 ms, and then
 * doubles this delay for every subsequent attemt. Never waits longer than 1
 * hour before retrying.
 *
 * @param task Async task to perform
 * @param signal Optional `AbortSignal` to prevent further retries
 */ async function withRetries(task, signal) {
    // Set up delays between retries
    const INITIAL_DELAY = 50; // ms
    let lastDelay = INITIAL_DELAY;
    // Define error handler
    /**
     * Determines the error handling strategy based on various error types.
     * Sleeps if necessary, and returns whether to retry or rethrow an error.
     */ async function handleError(error) {
        let delay = false;
        let strategy = "rethrow";
        if (error instanceof HttpError) {
            delay = true;
            strategy = "retry";
        } else if (error instanceof GrammyError) {
            if (error.error_code >= 500) {
                delay = true;
                strategy = "retry";
            } else if (error.error_code === 429) {
                const retryAfter = error.parameters.retry_after;
                if (typeof retryAfter === "number") {
                    // ignore the backoff for sleep, then reset it
                    await sleep(retryAfter, signal);
                    lastDelay = INITIAL_DELAY;
                } else {
                    delay = true;
                }
                strategy = "retry";
            }
        }
        if (delay) {
            // Do not sleep for the first retry
            if (lastDelay !== INITIAL_DELAY) {
                await sleep(lastDelay, signal);
            }
            const TWENTY_MINUTES = 20 * 60 * 1000; // ms
            lastDelay = Math.min(TWENTY_MINUTES, 2 * lastDelay);
        }
        return strategy;
    }
    // Perform the actual task with retries
    let result = {
        ok: false
    };
    while(!result.ok){
        try {
            result = {
                ok: true,
                value: await task()
            };
        } catch (error) {
            debugErr(error);
            const strategy = await handleError(error);
            switch(strategy){
                case "retry":
                    continue;
                case "rethrow":
                    throw error;
            }
        }
    }
    return result.value;
}
/**
 * Returns a new promise that resolves after the specified number of seconds, or
 * rejects as soon as the given signal is aborted.
 */ async function sleep(seconds, signal) {
    let handle;
    let reject;
    function abort() {
        reject?.(new Error("Aborted delay"));
        if (handle !== undefined) clearTimeout(handle);
    }
    try {
        await new Promise((res, rej)=>{
            reject = rej;
            if (signal?.aborted) {
                abort();
                return;
            }
            signal?.addEventListener("abort", abort);
            handle = setTimeout(res, 1000 * seconds);
        });
    } finally{
        signal?.removeEventListener("abort", abort);
    }
}
/**
 * Takes a set of observed update types and a list of allowed updates and logs a
 * warning in debug mode if some update types were observed that have not been
 * allowed.
 */ function validateAllowedUpdates(updates, allowed = DEFAULT_UPDATE_TYPES) {
    const impossible = Array.from(updates).filter((u)=>!allowed.includes(u));
    if (impossible.length > 0) {
        debugWarn(`You registered listeners for the following update types, \
but you did not specify them in \`allowed_updates\` \
so they may not be received: ${impossible.map((u)=>`'${u}'`).join(", ")}`);
    }
}
function noUseFunction() {
    throw new Error(`It looks like you are registering more listeners \
on your bot from within other listeners! This means that every time your bot \
handles a message like this one, new listeners will be added. This list grows until \
your machine crashes, so grammY throws this error to tell you that you should \
probably do things a bit differently. If you're unsure how to resolve this problem, \
you can ask in the group chat: https://telegram.me/grammyjs

On the other hand, if you actually know what you're doing and you do need to install \
further middleware while your bot is running, consider installing a composer \
instance on your bot, and in turn augment the composer after the fact. This way, \
you can circumvent this protection against memory leaks.`);
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vZGVuby5sYW5kL3gvZ3JhbW15QHYxLjI3LjAvYm90LnRzIl0sInNvdXJjZXNDb250ZW50IjpbIi8vIGRlbm8tbGludC1pZ25vcmUtZmlsZSBjYW1lbGNhc2VcbmltcG9ydCB7XG4gICAgQm90RXJyb3IsXG4gICAgQ29tcG9zZXIsXG4gICAgdHlwZSBNaWRkbGV3YXJlLFxuICAgIHR5cGUgUmVhY3Rpb25NaWRkbGV3YXJlLFxuICAgIHJ1bixcbn0gZnJvbSBcIi4vY29tcG9zZXIudHNcIjtcbmltcG9ydCB7IENvbnRleHQsIHR5cGUgTWF5YmVBcnJheSwgdHlwZSBSZWFjdGlvbkNvbnRleHQgfSBmcm9tIFwiLi9jb250ZXh0LnRzXCI7XG5pbXBvcnQgeyBBcGkgfSBmcm9tIFwiLi9jb3JlL2FwaS50c1wiO1xuaW1wb3J0IHtcbiAgICB0eXBlIEFwaUNsaWVudE9wdGlvbnMsXG4gICAgdHlwZSBXZWJob29rUmVwbHlFbnZlbG9wZSxcbn0gZnJvbSBcIi4vY29yZS9jbGllbnQudHNcIjtcbmltcG9ydCB7IEdyYW1teUVycm9yLCBIdHRwRXJyb3IgfSBmcm9tIFwiLi9jb3JlL2Vycm9yLnRzXCI7XG5pbXBvcnQgeyB0eXBlIEZpbHRlciwgdHlwZSBGaWx0ZXJRdWVyeSwgcGFyc2UsIHByZXByb2Nlc3MgfSBmcm9tIFwiLi9maWx0ZXIudHNcIjtcbmltcG9ydCB7IGRlYnVnIGFzIGQgfSBmcm9tIFwiLi9wbGF0Zm9ybS5kZW5vLnRzXCI7XG5pbXBvcnQge1xuICAgIHR5cGUgUmVhY3Rpb25UeXBlLFxuICAgIHR5cGUgUmVhY3Rpb25UeXBlRW1vamksXG4gICAgdHlwZSBVcGRhdGUsXG4gICAgdHlwZSBVc2VyRnJvbUdldE1lLFxufSBmcm9tIFwiLi90eXBlcy50c1wiO1xuY29uc3QgZGVidWcgPSBkKFwiZ3JhbW15OmJvdFwiKTtcbmNvbnN0IGRlYnVnV2FybiA9IGQoXCJncmFtbXk6d2FyblwiKTtcbmNvbnN0IGRlYnVnRXJyID0gZChcImdyYW1teTplcnJvclwiKTtcblxuZXhwb3J0IGNvbnN0IERFRkFVTFRfVVBEQVRFX1RZUEVTID0gW1xuICAgIFwibWVzc2FnZVwiLFxuICAgIFwiZWRpdGVkX21lc3NhZ2VcIixcbiAgICBcImNoYW5uZWxfcG9zdFwiLFxuICAgIFwiZWRpdGVkX2NoYW5uZWxfcG9zdFwiLFxuICAgIFwiYnVzaW5lc3NfY29ubmVjdGlvblwiLFxuICAgIFwiYnVzaW5lc3NfbWVzc2FnZVwiLFxuICAgIFwiZWRpdGVkX2J1c2luZXNzX21lc3NhZ2VcIixcbiAgICBcImRlbGV0ZWRfYnVzaW5lc3NfbWVzc2FnZXNcIixcbiAgICBcImlubGluZV9xdWVyeVwiLFxuICAgIFwiY2hvc2VuX2lubGluZV9yZXN1bHRcIixcbiAgICBcImNhbGxiYWNrX3F1ZXJ5XCIsXG4gICAgXCJzaGlwcGluZ19xdWVyeVwiLFxuICAgIFwicHJlX2NoZWNrb3V0X3F1ZXJ5XCIsXG4gICAgXCJwb2xsXCIsXG4gICAgXCJwb2xsX2Fuc3dlclwiLFxuICAgIFwibXlfY2hhdF9tZW1iZXJcIixcbiAgICBcImNoYXRfam9pbl9yZXF1ZXN0XCIsXG4gICAgXCJjaGF0X2Jvb3N0XCIsXG4gICAgXCJyZW1vdmVkX2NoYXRfYm9vc3RcIixcbl0gYXMgY29uc3Q7XG5cbi8qKlxuICogT3B0aW9ucyB0aGF0IGNhbiBiZSBzcGVjaWZpZWQgd2hlbiBydW5uaW5nIHRoZSBib3QgdmlhIHNpbXBsZSBsb25nIHBvbGxpbmcuXG4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgUG9sbGluZ09wdGlvbnMge1xuICAgIC8qKlxuICAgICAqIExpbWl0cyB0aGUgbnVtYmVyIG9mIHVwZGF0ZXMgdG8gYmUgcmV0cmlldmVkIHBlciBgZ2V0VXBkYXRlc2AgY2FsbC5cbiAgICAgKiBWYWx1ZXMgYmV0d2VlbiAxLTEwMCBhcmUgYWNjZXB0ZWQuIERlZmF1bHRzIHRvIDEwMC5cbiAgICAgKi9cbiAgICBsaW1pdD86IG51bWJlcjtcbiAgICAvKipcbiAgICAgKiBUaW1lb3V0IGluIHNlY29uZHMgZm9yIGxvbmcgcG9sbGluZy4gZ3JhbW1ZIHVzZXMgMzAgc2Vjb25kcyBhcyBhIGRlZmF1bHRcbiAgICAgKiB2YWx1ZS5cbiAgICAgKi9cbiAgICB0aW1lb3V0PzogbnVtYmVyO1xuICAgIC8qKlxuICAgICAqIEEgbGlzdCBvZiB0aGUgdXBkYXRlIHR5cGVzIHlvdSB3YW50IHlvdXIgYm90IHRvIHJlY2VpdmUuIEZvciBleGFtcGxlLFxuICAgICAqIHNwZWNpZnkgW+KAnG1lc3NhZ2XigJ0sIOKAnGVkaXRlZF9jaGFubmVsX3Bvc3TigJ0sIOKAnGNhbGxiYWNrX3F1ZXJ54oCdXSB0byBvbmx5XG4gICAgICogcmVjZWl2ZSB1cGRhdGVzIG9mIHRoZXNlIHR5cGVzLiBTZWUgVXBkYXRlIGZvciBhIGNvbXBsZXRlIGxpc3Qgb2ZcbiAgICAgKiBhdmFpbGFibGUgdXBkYXRlIHR5cGVzLiBTcGVjaWZ5IGFuIGVtcHR5IGxpc3QgdG8gcmVjZWl2ZSBhbGwgdXBkYXRlIHR5cGVzXG4gICAgICogZXhjZXB0IGNoYXRfbWVtYmVyIChkZWZhdWx0KS4gSWYgbm90IHNwZWNpZmllZCwgdGhlIHByZXZpb3VzIHNldHRpbmcgd2lsbFxuICAgICAqIGJlIHVzZWQuXG4gICAgICpcbiAgICAgKiBQbGVhc2Ugbm90ZSB0aGF0IHRoaXMgcGFyYW1ldGVyIGRvZXNuJ3QgYWZmZWN0IHVwZGF0ZXMgY3JlYXRlZCBiZWZvcmUgdGhlXG4gICAgICogY2FsbCB0byB0aGUgZ2V0VXBkYXRlcywgc28gdW53YW50ZWQgdXBkYXRlcyBtYXkgYmUgcmVjZWl2ZWQgZm9yIGEgc2hvcnRcbiAgICAgKiBwZXJpb2Qgb2YgdGltZS5cbiAgICAgKi9cbiAgICBhbGxvd2VkX3VwZGF0ZXM/OiBSZWFkb25seUFycmF5PEV4Y2x1ZGU8a2V5b2YgVXBkYXRlLCBcInVwZGF0ZV9pZFwiPj47XG4gICAgLyoqXG4gICAgICogUGFzcyBUcnVlIHRvIGRyb3AgYWxsIHBlbmRpbmcgdXBkYXRlcyBiZWZvcmUgc3RhcnRpbmcgdGhlIGxvbmcgcG9sbGluZy5cbiAgICAgKi9cbiAgICBkcm9wX3BlbmRpbmdfdXBkYXRlcz86IGJvb2xlYW47XG4gICAgLyoqXG4gICAgICogQSBjYWxsYmFjayBmdW5jdGlvbiB0aGF0IGlzIHVzZWZ1bCBmb3IgbG9nZ2luZyAob3Igc2V0dGluZyB1cCBtaWRkbGV3YXJlXG4gICAgICogaWYgeW91IGRpZCBub3QgZG8gdGhpcyBiZWZvcmUpLiBJdCB3aWxsIGJlIGV4ZWN1dGVkIGFmdGVyIHRoZSBzZXR1cCBvZlxuICAgICAqIHRoZSBib3QgaGFzIGNvbXBsZXRlZCwgYW5kIGltbWVkaWF0ZWx5IGJlZm9yZSB0aGUgZmlyc3QgdXBkYXRlcyBhcmUgYmVpbmdcbiAgICAgKiBmZXRjaGVkLiBUaGUgYm90IGluZm9ybWF0aW9uIGBib3QuYm90SW5mb2Agd2lsbCBiZSBhdmFpbGFibGUgd2hlbiB0aGVcbiAgICAgKiBmdW5jdGlvbiBpcyBydW4uIEZvciBjb252ZW5pZW5jZSwgdGhlIGNhbGxiYWNrIGZ1bmN0aW9uIHJlY2VpdmVzIHRoZVxuICAgICAqIHZhbHVlIG9mIGBib3QuYm90SW5mb2AgYXMgYW4gYXJndW1lbnQuXG4gICAgICovXG4gICAgb25TdGFydD86IChib3RJbmZvOiBVc2VyRnJvbUdldE1lKSA9PiB2b2lkIHwgUHJvbWlzZTx2b2lkPjtcbn1cblxuZXhwb3J0IHsgQm90RXJyb3IgfTtcbi8qKlxuICogRXJyb3IgaGFuZGxlciB0aGF0IGNhbiBiZSBpbnN0YWxsZWQgb24gYSBib3QgdG8gY2F0Y2ggZXJyb3IgdGhyb3duIGJ5XG4gKiBtaWRkbGV3YXJlLlxuICovXG5leHBvcnQgdHlwZSBFcnJvckhhbmRsZXI8QyBleHRlbmRzIENvbnRleHQgPSBDb250ZXh0PiA9IChcbiAgICBlcnJvcjogQm90RXJyb3I8Qz4sXG4pID0+IHVua25vd247XG5cbi8qKlxuICogT3B0aW9ucyB0byBwYXNzIHRvIHRoZSBib3Qgd2hlbiBjcmVhdGluZyBpdC5cbiAqL1xuZXhwb3J0IGludGVyZmFjZSBCb3RDb25maWc8QyBleHRlbmRzIENvbnRleHQ+IHtcbiAgICAvKipcbiAgICAgKiBZb3UgY2FuIHNwZWNpZnkgYSBudW1iZXIgb2YgYWR2YW5jZWQgb3B0aW9ucyB1bmRlciB0aGUgYGNsaWVudGAgcHJvcGVydHkuXG4gICAgICogVGhlIG9wdGlvbnMgd2lsbCBiZSBwYXNzZWQgdG8gdGhlIGdyYW1tWSBjbGllbnTigJR0aGlzIGlzIHRoZSBwYXJ0IG9mXG4gICAgICogZ3JhbW1ZIHRoYXQgYWN0dWFsbHkgY29ubmVjdHMgdG8gdGhlIFRlbGVncmFtIEJvdCBBUEkgc2VydmVyIGluIHRoZSBlbmRcbiAgICAgKiB3aGVuIG1ha2luZyBIVFRQIHJlcXVlc3RzLlxuICAgICAqL1xuICAgIGNsaWVudD86IEFwaUNsaWVudE9wdGlvbnM7XG4gICAgLyoqXG4gICAgICogZ3JhbW1ZIGF1dG9tYXRpY2FsbHkgY2FsbHMgYGdldE1lYCB3aGVuIHN0YXJ0aW5nIHVwIHRvIG1ha2Ugc3VyZSB0aGF0XG4gICAgICogeW91ciBib3QgaGFzIGFjY2VzcyB0byB0aGUgYm90J3Mgb3duIGluZm9ybWF0aW9uLiBJZiB5b3UgcmVzdGFydCB5b3VyIGJvdFxuICAgICAqIG9mdGVuLCBmb3IgZXhhbXBsZSBiZWNhdXNlIGl0IGlzIHJ1bm5pbmcgaW4gYSBzZXJ2ZXJsZXNzIGVudmlyb25tZW50LFxuICAgICAqIHRoZW4geW91IG1heSB3YW50IHRvIHNraXAgdGhpcyBpbml0aWFsIEFQSSBjYWxsLlxuICAgICAqXG4gICAgICogU2V0IHRoaXMgcHJvcGVydHkgb2YgdGhlIG9wdGlvbnMgdG8gcHJlLWluaXRpYWxpemUgdGhlIGJvdCB3aXRoIGNhY2hlZFxuICAgICAqIHZhbHVlcy4gSWYgeW91IHVzZSB0aGlzIG9wdGlvbiwgZ3JhbW1ZIHdpbGwgbm90IGF0dGVtcHQgdG8gbWFrZSBhIGBnZXRNZWBcbiAgICAgKiBjYWxsIGJ1dCB1c2UgdGhlIHByb3ZpZGVkIGRhdGEgaW5zdGVhZC5cbiAgICAgKi9cbiAgICBib3RJbmZvPzogVXNlckZyb21HZXRNZTtcbiAgICAvKipcbiAgICAgKiBQYXNzIHRoZSBjb25zdHJ1Y3RvciBvZiBhIGN1c3RvbSBjb250ZXh0IG9iamVjdCB0aGF0IHdpbGwgYmUgdXNlZCB3aGVuXG4gICAgICogY3JlYXRpbmcgdGhlIGNvbnRleHQgZm9yIGVhY2ggaW5jb21pbmcgdXBkYXRlLlxuICAgICAqL1xuICAgIENvbnRleHRDb25zdHJ1Y3Rvcj86IG5ldyAoXG4gICAgICAgIC4uLmFyZ3M6IENvbnN0cnVjdG9yUGFyYW1ldGVyczx0eXBlb2YgQ29udGV4dD5cbiAgICApID0+IEM7XG59XG5cbi8qKlxuICogVGhpcyBpcyB0aGUgc2luZ2xlIG1vc3QgaW1wb3J0YW50IGNsYXNzIG9mIGdyYW1tWS4gSXQgcmVwcmVzZW50cyB5b3VyIGJvdC5cbiAqXG4gKiBGaXJzdCwgeW91IG11c3QgY3JlYXRlIGEgYm90IGJ5IHRhbGtpbmcgdG8gQEJvdEZhdGhlciwgY2hlY2sgb3V0XG4gKiBodHRwczovL3QubWUvQm90RmF0aGVyLiBPbmNlIGl0IGlzIHJlYWR5LCB5b3Ugb2J0YWluIGEgc2VjcmV0IHRva2VuIGZvciB5b3VyXG4gKiBib3QuIGdyYW1tWSB3aWxsIHVzZSB0aGF0IHRva2VuIHRvIGlkZW50aWZ5IGFzIHlvdXIgYm90IHdoZW4gdGFsa2luZyB0byB0aGVcbiAqIFRlbGVncmFtIHNlcnZlcnMuIEdvdCB0aGUgdG9rZW4/IFlvdSBhcmUgbm93IHJlYWR5IHRvIHdyaXRlIHNvbWUgY29kZSBhbmQgcnVuXG4gKiB5b3VyIGJvdCFcbiAqXG4gKiBZb3Ugc2hvdWxkIGRvIHRocmVlIHRoaW5ncyB0byBydW4geW91ciBib3Q6XG4gKiBgYGB0c1xuICogLy8gMS4gQ3JlYXRlIGEgYm90IGluc3RhbmNlXG4gKiBjb25zdCBib3QgPSBuZXcgQm90KCc8c2VjcmV0LXRva2VuPicpXG4gKiAvLyAyLiBMaXN0ZW4gZm9yIHVwZGF0ZXNcbiAqIGJvdC5vbignbWVzc2FnZTp0ZXh0JywgY3R4ID0+IGN0eC5yZXBseSgnWW91IHdyb3RlOiAnICsgY3R4Lm1lc3NhZ2UudGV4dCkpXG4gKiAvLyAzLiBMYXVuY2ggaXQhXG4gKiBib3Quc3RhcnQoKVxuICogYGBgXG4gKi9cbmV4cG9ydCBjbGFzcyBCb3Q8XG4gICAgQyBleHRlbmRzIENvbnRleHQgPSBDb250ZXh0LFxuICAgIEEgZXh0ZW5kcyBBcGkgPSBBcGksXG4+IGV4dGVuZHMgQ29tcG9zZXI8Qz4ge1xuICAgIHByaXZhdGUgcG9sbGluZ1J1bm5pbmcgPSBmYWxzZTtcbiAgICBwcml2YXRlIHBvbGxpbmdBYm9ydENvbnRyb2xsZXI6IEFib3J0Q29udHJvbGxlciB8IHVuZGVmaW5lZDtcbiAgICBwcml2YXRlIGxhc3RUcmllZFVwZGF0ZUlkID0gMDtcblxuICAgIC8qKlxuICAgICAqIEdpdmVzIHlvdSBmdWxsIGFjY2VzcyB0byB0aGUgVGVsZWdyYW0gQm90IEFQSS5cbiAgICAgKiBgYGB0c1xuICAgICAqIC8vIFRoaXMgaXMgaG93IHRvIGNhbGwgdGhlIEJvdCBBUEkgbWV0aG9kczpcbiAgICAgKiBib3QuYXBpLnNlbmRNZXNzYWdlKGNoYXRfaWQsICdIZWxsbywgZ3JhbW1ZIScpXG4gICAgICogYGBgXG4gICAgICpcbiAgICAgKiBVc2UgdGhpcyBvbmx5IG91dHNpZGUgb2YgeW91ciBtaWRkbGV3YXJlLiBJZiB5b3UgaGF2ZSBhY2Nlc3MgdG8gYGN0eGAsXG4gICAgICogdGhlbiB1c2luZyBgY3R4LmFwaWAgaW5zdGVhZCBvZiBgYm90LmFwaWAgaXMgcHJlZmVycmVkLlxuICAgICAqL1xuICAgIHB1YmxpYyByZWFkb25seSBhcGk6IEE7XG5cbiAgICBwcml2YXRlIG1lOiBVc2VyRnJvbUdldE1lIHwgdW5kZWZpbmVkO1xuICAgIHByaXZhdGUgbWVQcm9taXNlOiBQcm9taXNlPFVzZXJGcm9tR2V0TWU+IHwgdW5kZWZpbmVkO1xuICAgIHByaXZhdGUgcmVhZG9ubHkgY2xpZW50Q29uZmlnOiBBcGlDbGllbnRPcHRpb25zIHwgdW5kZWZpbmVkO1xuXG4gICAgcHJpdmF0ZSByZWFkb25seSBDb250ZXh0Q29uc3RydWN0b3I6IG5ldyAoXG4gICAgICAgIC4uLmFyZ3M6IENvbnN0cnVjdG9yUGFyYW1ldGVyczx0eXBlb2YgQ29udGV4dD5cbiAgICApID0+IEM7XG5cbiAgICAvKiogVXNlZCB0byBsb2cgYSB3YXJuaW5nIGlmIHNvbWUgdXBkYXRlIHR5cGVzIGFyZSBub3QgaW4gYWxsb3dlZF91cGRhdGVzICovXG4gICAgcHJpdmF0ZSBvYnNlcnZlZFVwZGF0ZVR5cGVzID0gbmV3IFNldDxzdHJpbmc+KCk7XG5cbiAgICAvKipcbiAgICAgKiBIb2xkcyB0aGUgYm90J3MgZXJyb3IgaGFuZGxlciB0aGF0IGlzIGludm9rZWQgd2hlbmV2ZXIgbWlkZGxld2FyZSB0aHJvd3NcbiAgICAgKiAocmVqZWN0cykuIElmIHlvdSBzZXQgeW91ciBvd24gZXJyb3IgaGFuZGxlciB2aWEgYGJvdC5jYXRjaGAsIGFsbCB0aGF0XG4gICAgICogaGFwcGVucyBpcyB0aGF0IHRoaXMgdmFyaWFibGUgaXMgYXNzaWduZWQuXG4gICAgICovXG4gICAgcHVibGljIGVycm9ySGFuZGxlcjogRXJyb3JIYW5kbGVyPEM+ID0gYXN5bmMgKGVycikgPT4ge1xuICAgICAgICBjb25zb2xlLmVycm9yKFxuICAgICAgICAgICAgXCJFcnJvciBpbiBtaWRkbGV3YXJlIHdoaWxlIGhhbmRsaW5nIHVwZGF0ZVwiLFxuICAgICAgICAgICAgZXJyLmN0eD8udXBkYXRlPy51cGRhdGVfaWQsXG4gICAgICAgICAgICBlcnIuZXJyb3IsXG4gICAgICAgICk7XG4gICAgICAgIGNvbnNvbGUuZXJyb3IoXCJObyBlcnJvciBoYW5kbGVyIHdhcyBzZXQhXCIpO1xuICAgICAgICBjb25zb2xlLmVycm9yKFwiU2V0IHlvdXIgb3duIGVycm9yIGhhbmRsZXIgd2l0aCBgYm90LmNhdGNoID0gLi4uYFwiKTtcbiAgICAgICAgaWYgKHRoaXMucG9sbGluZ1J1bm5pbmcpIHtcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoXCJTdG9wcGluZyBib3RcIik7XG4gICAgICAgICAgICBhd2FpdCB0aGlzLnN0b3AoKTtcbiAgICAgICAgfVxuICAgICAgICB0aHJvdyBlcnI7XG4gICAgfTtcblxuICAgIC8qKlxuICAgICAqIENyZWF0ZXMgYSBuZXcgQm90IHdpdGggdGhlIGdpdmVuIHRva2VuLlxuICAgICAqXG4gICAgICogUmVtZW1iZXIgdGhhdCB5b3UgY2FuIGxpc3RlbiBmb3IgbWVzc2FnZXMgYnkgY2FsbGluZ1xuICAgICAqIGBgYHRzXG4gICAgICogYm90Lm9uKCdtZXNzYWdlJywgY3R4ID0+IHsgLi4uIH0pXG4gICAgICogYGBgXG4gICAgICogb3Igc2ltaWxhciBtZXRob2RzLlxuICAgICAqXG4gICAgICogVGhlIHNpbXBsZXN0IHdheSB0byBzdGFydCB5b3VyIGJvdCBpcyB2aWEgc2ltcGxlIGxvbmcgcG9sbGluZzpcbiAgICAgKiBgYGB0c1xuICAgICAqIGJvdC5zdGFydCgpXG4gICAgICogYGBgXG4gICAgICpcbiAgICAgKiBAcGFyYW0gdG9rZW4gVGhlIGJvdCdzIHRva2VuIGFzIGFjcXVpcmVkIGZyb20gaHR0cHM6Ly90Lm1lL0JvdEZhdGhlclxuICAgICAqIEBwYXJhbSBjb25maWcgT3B0aW9uYWwgY29uZmlndXJhdGlvbiBwcm9wZXJ0aWVzIGZvciB0aGUgYm90XG4gICAgICovXG4gICAgY29uc3RydWN0b3IocHVibGljIHJlYWRvbmx5IHRva2VuOiBzdHJpbmcsIGNvbmZpZz86IEJvdENvbmZpZzxDPikge1xuICAgICAgICBzdXBlcigpO1xuICAgICAgICBpZiAoIXRva2VuKSB0aHJvdyBuZXcgRXJyb3IoXCJFbXB0eSB0b2tlbiFcIik7XG4gICAgICAgIHRoaXMubWUgPSBjb25maWc/LmJvdEluZm87XG4gICAgICAgIHRoaXMuY2xpZW50Q29uZmlnID0gY29uZmlnPy5jbGllbnQ7XG4gICAgICAgIHRoaXMuQ29udGV4dENvbnN0cnVjdG9yID0gY29uZmlnPy5Db250ZXh0Q29uc3RydWN0b3IgPz9cbiAgICAgICAgICAgIChDb250ZXh0IGFzIHVua25vd24gYXMgbmV3IChcbiAgICAgICAgICAgICAgICAuLi5hcmdzOiBDb25zdHJ1Y3RvclBhcmFtZXRlcnM8dHlwZW9mIENvbnRleHQ+XG4gICAgICAgICAgICApID0+IEMpO1xuICAgICAgICB0aGlzLmFwaSA9IG5ldyBBcGkodG9rZW4sIHRoaXMuY2xpZW50Q29uZmlnKSBhcyBBO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEluZm9ybWF0aW9uIGFib3V0IHRoZSBib3QgaXRzZWxmIGFzIHJldHJpZXZlZCBmcm9tIGBhcGkuZ2V0TWUoKWAuIE9ubHlcbiAgICAgKiBhdmFpbGFibGUgYWZ0ZXIgdGhlIGJvdCBoYXMgYmVlbiBpbml0aWFsaXplZCB2aWEgYGF3YWl0IGJvdC5pbml0KClgLCBvclxuICAgICAqIGFmdGVyIHRoZSB2YWx1ZSBoYXMgYmVlbiBzZXQgbWFudWFsbHkuXG4gICAgICpcbiAgICAgKiBTdGFydGluZyB0aGUgYm90IHdpbGwgYWx3YXlzIHBlcmZvcm0gdGhlIGluaXRpYWxpemF0aW9uIGF1dG9tYXRpY2FsbHksXG4gICAgICogdW5sZXNzIGEgbWFudWFsIHZhbHVlIGlzIGFscmVhZHkgc2V0LlxuICAgICAqXG4gICAgICogTm90ZSB0aGF0IHRoZSByZWNvbW1lbmRlZCB3YXkgdG8gc2V0IGEgY3VzdG9tIGJvdCBpbmZvcm1hdGlvbiBvYmplY3QgaXNcbiAgICAgKiB0byBwYXNzIGl0IHRvIHRoZSBjb25maWd1cmF0aW9uIG9iamVjdCBvZiB0aGUgYG5ldyBCb3QoKWAgaW5zdGFudGlhdGlvbixcbiAgICAgKiByYXRoZXIgdGhhbiBhc3NpZ25pbmcgdGhpcyBwcm9wZXJ0eS5cbiAgICAgKi9cbiAgICBwdWJsaWMgc2V0IGJvdEluZm8oYm90SW5mbzogVXNlckZyb21HZXRNZSkge1xuICAgICAgICB0aGlzLm1lID0gYm90SW5mbztcbiAgICB9XG4gICAgcHVibGljIGdldCBib3RJbmZvKCk6IFVzZXJGcm9tR2V0TWUge1xuICAgICAgICBpZiAodGhpcy5tZSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXG4gICAgICAgICAgICAgICAgXCJCb3QgaW5mb3JtYXRpb24gdW5hdmFpbGFibGUhIE1ha2Ugc3VyZSB0byBjYWxsIGBhd2FpdCBib3QuaW5pdCgpYCBiZWZvcmUgYWNjZXNzaW5nIGBib3QuYm90SW5mb2AhXCIsXG4gICAgICAgICAgICApO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB0aGlzLm1lO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEBpbmhlcml0ZG9jXG4gICAgICovXG4gICAgb248USBleHRlbmRzIEZpbHRlclF1ZXJ5PihcbiAgICAgICAgZmlsdGVyOiBRIHwgUVtdLFxuICAgICAgICAuLi5taWRkbGV3YXJlOiBBcnJheTxNaWRkbGV3YXJlPEZpbHRlcjxDLCBRPj4+XG4gICAgKTogQ29tcG9zZXI8RmlsdGVyPEMsIFE+PiB7XG4gICAgICAgIGZvciAoY29uc3QgW3VdIG9mIHBhcnNlKGZpbHRlcikuZmxhdE1hcChwcmVwcm9jZXNzKSkge1xuICAgICAgICAgICAgdGhpcy5vYnNlcnZlZFVwZGF0ZVR5cGVzLmFkZCh1KTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gc3VwZXIub24oZmlsdGVyLCAuLi5taWRkbGV3YXJlKTtcbiAgICB9XG4gICAgLyoqXG4gICAgICogQGluaGVyaXRkb2NcbiAgICAgKi9cbiAgICByZWFjdGlvbihcbiAgICAgICAgcmVhY3Rpb246IE1heWJlQXJyYXk8UmVhY3Rpb25UeXBlRW1vamlbXCJlbW9qaVwiXSB8IFJlYWN0aW9uVHlwZT4sXG4gICAgICAgIC4uLm1pZGRsZXdhcmU6IEFycmF5PFJlYWN0aW9uTWlkZGxld2FyZTxDPj5cbiAgICApOiBDb21wb3NlcjxSZWFjdGlvbkNvbnRleHQ8Qz4+IHtcbiAgICAgICAgdGhpcy5vYnNlcnZlZFVwZGF0ZVR5cGVzLmFkZChcIm1lc3NhZ2VfcmVhY3Rpb25cIik7XG4gICAgICAgIHJldHVybiBzdXBlci5yZWFjdGlvbihyZWFjdGlvbiwgLi4ubWlkZGxld2FyZSk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQ2hlY2tzIGlmIHRoZSBib3QgaGFzIGJlZW4gaW5pdGlhbGl6ZWQuIEEgYm90IGlzIGluaXRpYWxpemVkIGlmIHRoZSBib3RcbiAgICAgKiBpbmZvcm1hdGlvbiBpcyBzZXQuIFRoZSBib3QgaW5mb3JtYXRpb24gY2FuIGVpdGhlciBiZSBzZXQgYXV0b21hdGljYWxseVxuICAgICAqIGJ5IGNhbGxpbmcgYGJvdC5pbml0YCwgb3IgbWFudWFsbHkgdGhyb3VnaCB0aGUgYm90IGNvbnN0cnVjdG9yLiBOb3RlIHRoYXRcbiAgICAgKiB1c3VhbGx5LCBpbml0aWFsaXphdGlvbiBpcyBkb25lIGF1dG9tYXRpY2FsbHkgYW5kIHlvdSBkbyBub3QgaGF2ZSB0byBjYXJlXG4gICAgICogYWJvdXQgdGhpcyBtZXRob2QuXG4gICAgICpcbiAgICAgKiBAcmV0dXJucyB0cnVlIGlmIHRoZSBib3QgaXMgaW5pdGlhbGl6ZWQsIGFuZCBmYWxzZSBvdGhlcndpc2VcbiAgICAgKi9cbiAgICBpc0luaXRlZCgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMubWUgIT09IHVuZGVmaW5lZDtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBJbml0aWFsaXplcyB0aGUgYm90LCBpLmUuIGZldGNoZXMgaW5mb3JtYXRpb24gYWJvdXQgdGhlIGJvdCBpdHNlbGYuIFRoaXNcbiAgICAgKiBtZXRob2QgaXMgY2FsbGVkIGF1dG9tYXRpY2FsbHksIHlvdSB1c3VhbGx5IGRvbid0IGhhdmUgdG8gY2FsbCBpdFxuICAgICAqIG1hbnVhbGx5LlxuICAgICAqXG4gICAgICogQHBhcmFtIHNpZ25hbCBPcHRpb25hbCBgQWJvcnRTaWduYWxgIHRvIGNhbmNlbCB0aGUgaW5pdGlhbGl6YXRpb25cbiAgICAgKi9cbiAgICBhc3luYyBpbml0KHNpZ25hbD86IEFib3J0U2lnbmFsKSB7XG4gICAgICAgIGlmICghdGhpcy5pc0luaXRlZCgpKSB7XG4gICAgICAgICAgICBkZWJ1ZyhcIkluaXRpYWxpemluZyBib3RcIik7XG4gICAgICAgICAgICB0aGlzLm1lUHJvbWlzZSA/Pz0gd2l0aFJldHJpZXMoXG4gICAgICAgICAgICAgICAgKCkgPT4gdGhpcy5hcGkuZ2V0TWUoc2lnbmFsKSxcbiAgICAgICAgICAgICAgICBzaWduYWwsXG4gICAgICAgICAgICApO1xuICAgICAgICAgICAgbGV0IG1lOiBVc2VyRnJvbUdldE1lO1xuICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICBtZSA9IGF3YWl0IHRoaXMubWVQcm9taXNlO1xuICAgICAgICAgICAgfSBmaW5hbGx5IHtcbiAgICAgICAgICAgICAgICB0aGlzLm1lUHJvbWlzZSA9IHVuZGVmaW5lZDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmICh0aGlzLm1lID09PSB1bmRlZmluZWQpIHRoaXMubWUgPSBtZTtcbiAgICAgICAgICAgIGVsc2UgZGVidWcoXCJCb3QgaW5mbyB3YXMgc2V0IGJ5IG5vdywgd2lsbCBub3Qgb3ZlcndyaXRlXCIpO1xuICAgICAgICB9XG4gICAgICAgIGRlYnVnKGBJIGFtICR7dGhpcy5tZSEudXNlcm5hbWV9IWApO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEludGVybmFsLiBEbyBub3QgY2FsbC4gSGFuZGxlcyBhbiB1cGRhdGUgYmF0Y2ggc2VxdWVudGlhbGx5IGJ5IHN1cHBseWluZ1xuICAgICAqIGl0IG9uZS1ieS1vbmUgdG8gdGhlIG1pZGRsZXdhcmUuIEhhbmRsZXMgbWlkZGxld2FyZSBlcnJvcnMgYW5kIHN0b3JlcyB0aGVcbiAgICAgKiBsYXN0IHVwZGF0ZSBpZGVudGlmaWVyIHRoYXQgd2FzIGJlaW5nIHRyaWVkIHRvIGhhbmRsZS5cbiAgICAgKlxuICAgICAqIEBwYXJhbSB1cGRhdGVzIEFuIGFycmF5IG9mIHVwZGF0ZXMgdG8gaGFuZGxlXG4gICAgICovXG4gICAgcHJpdmF0ZSBhc3luYyBoYW5kbGVVcGRhdGVzKHVwZGF0ZXM6IFVwZGF0ZVtdKSB7XG4gICAgICAgIC8vIGhhbmRsZSB1cGRhdGVzIHNlcXVlbnRpYWxseSAoISlcbiAgICAgICAgZm9yIChjb25zdCB1cGRhdGUgb2YgdXBkYXRlcykge1xuICAgICAgICAgICAgdGhpcy5sYXN0VHJpZWRVcGRhdGVJZCA9IHVwZGF0ZS51cGRhdGVfaWQ7XG4gICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgIGF3YWl0IHRoaXMuaGFuZGxlVXBkYXRlKHVwZGF0ZSk7XG4gICAgICAgICAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgICAgICAgICAgICAvLyBzaG91bGQgYWx3YXlzIGJlIHRydWVcbiAgICAgICAgICAgICAgICBpZiAoZXJyIGluc3RhbmNlb2YgQm90RXJyb3IpIHtcbiAgICAgICAgICAgICAgICAgICAgYXdhaXQgdGhpcy5lcnJvckhhbmRsZXIoZXJyKTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKFwiRkFUQUw6IGdyYW1tWSB1bmFibGUgdG8gaGFuZGxlOlwiLCBlcnIpO1xuICAgICAgICAgICAgICAgICAgICB0aHJvdyBlcnI7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogVGhpcyBpcyBhbiBpbnRlcm5hbCBtZXRob2QgdGhhdCB5b3UgcHJvYmFibHkgd2lsbCBub3QgZXZlciBuZWVkIHRvIGNhbGwuXG4gICAgICogSXQgaXMgdXNlZCB3aGVuZXZlciBhIG5ldyB1cGRhdGUgYXJyaXZlcyBmcm9tIHRoZSBUZWxlZ3JhbSBzZXJ2ZXJzIHRoYXRcbiAgICAgKiB5b3VyIGJvdCB3aWxsIGhhbmRsZS5cbiAgICAgKlxuICAgICAqIElmIHlvdSdyZSB3cml0aW5nIGEgbGlicmFyeSBvbiB0b3Agb2YgZ3JhbW1ZLCBjaGVjayBvdXQgdGhlXG4gICAgICogW2RvY3VtZW50YXRpb25dKGh0dHBzOi8vZ3JhbW15LmRldi9wbHVnaW5zL3J1bm5lci5odG1sKSBvZiB0aGUgcnVubmVyXG4gICAgICogcGx1Z2luIGZvciBhbiBleGFtcGxlIHRoYXQgdXNlcyB0aGlzIG1ldGhvZC5cbiAgICAgKlxuICAgICAqIEBwYXJhbSB1cGRhdGUgQW4gdXBkYXRlIGZyb20gdGhlIFRlbGVncmFtIEJvdCBBUElcbiAgICAgKiBAcGFyYW0gd2ViaG9va1JlcGx5RW52ZWxvcGUgQW4gb3B0aW9uYWwgd2ViaG9vayByZXBseSBlbnZlbG9wZVxuICAgICAqL1xuICAgIGFzeW5jIGhhbmRsZVVwZGF0ZShcbiAgICAgICAgdXBkYXRlOiBVcGRhdGUsXG4gICAgICAgIHdlYmhvb2tSZXBseUVudmVsb3BlPzogV2ViaG9va1JlcGx5RW52ZWxvcGUsXG4gICAgKSB7XG4gICAgICAgIGlmICh0aGlzLm1lID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcbiAgICAgICAgICAgICAgICBcIkJvdCBub3QgaW5pdGlhbGl6ZWQhIEVpdGhlciBjYWxsIGBhd2FpdCBib3QuaW5pdCgpYCwgXFxcbm9yIGRpcmVjdGx5IHNldCB0aGUgYGJvdEluZm9gIG9wdGlvbiBpbiB0aGUgYEJvdGAgY29uc3RydWN0b3IgdG8gc3BlY2lmeSBcXFxuYSBrbm93biBib3QgaW5mbyBvYmplY3QuXCIsXG4gICAgICAgICAgICApO1xuICAgICAgICB9XG4gICAgICAgIGRlYnVnKGBQcm9jZXNzaW5nIHVwZGF0ZSAke3VwZGF0ZS51cGRhdGVfaWR9YCk7XG4gICAgICAgIC8vIGNyZWF0ZSBBUEkgb2JqZWN0XG4gICAgICAgIGNvbnN0IGFwaSA9IG5ldyBBcGkoXG4gICAgICAgICAgICB0aGlzLnRva2VuLFxuICAgICAgICAgICAgdGhpcy5jbGllbnRDb25maWcsXG4gICAgICAgICAgICB3ZWJob29rUmVwbHlFbnZlbG9wZSxcbiAgICAgICAgKTtcbiAgICAgICAgLy8gY29uZmlndXJlIGl0IHdpdGggdGhlIHNhbWUgdHJhbnNmb3JtZXJzIGFzIGJvdC5hcGlcbiAgICAgICAgY29uc3QgdCA9IHRoaXMuYXBpLmNvbmZpZy5pbnN0YWxsZWRUcmFuc2Zvcm1lcnMoKTtcbiAgICAgICAgaWYgKHQubGVuZ3RoID4gMCkgYXBpLmNvbmZpZy51c2UoLi4udCk7XG4gICAgICAgIC8vIGNyZWF0ZSBjb250ZXh0IG9iamVjdFxuICAgICAgICBjb25zdCBjdHggPSBuZXcgdGhpcy5Db250ZXh0Q29uc3RydWN0b3IodXBkYXRlLCBhcGksIHRoaXMubWUpO1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgLy8gcnVuIG1pZGRsZXdhcmUgc3RhY2tcbiAgICAgICAgICAgIGF3YWl0IHJ1bih0aGlzLm1pZGRsZXdhcmUoKSwgY3R4KTtcbiAgICAgICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICAgICAgICBkZWJ1Z0VycihgRXJyb3IgaW4gbWlkZGxld2FyZSBmb3IgdXBkYXRlICR7dXBkYXRlLnVwZGF0ZV9pZH1gKTtcbiAgICAgICAgICAgIHRocm93IG5ldyBCb3RFcnJvcjxDPihlcnIsIGN0eCk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBTdGFydHMgeW91ciBib3QgdXNpbmcgbG9uZyBwb2xsaW5nLlxuICAgICAqXG4gICAgICogPiBUaGlzIG1ldGhvZCByZXR1cm5zIGEgYFByb21pc2VgIHRoYXQgd2lsbCBuZXZlciByZXNvbHZlIGV4Y2VwdCBpZiB5b3VyXG4gICAgICogPiBib3QgaXMgc3RvcHBlZC4gKipZb3UgZG9uJ3QgbmVlZCB0byBgYXdhaXRgIHRoZSBjYWxsIHRvIGBib3Quc3RhcnRgKiosXG4gICAgICogPiBidXQgcmVtZW1iZXIgdG8gY2F0Y2ggcG90ZW50aWFsIGVycm9ycyBieSBjYWxsaW5nIGBib3QuY2F0Y2hgLlxuICAgICAqID4gT3RoZXJ3aXNlIHlvdXIgYm90IHdpbGwgY3Jhc2ggKGFuZCBzdG9wKSBpZiBzb21ldGhpbmcgZ29lcyB3cm9uZyBpblxuICAgICAqID4geW91ciBjb2RlLlxuICAgICAqXG4gICAgICogVGhpcyBtZXRob2QgZWZmZWN0aXZlbHkgZW50ZXJzIGEgbG9vcCB0aGF0IHdpbGwgcmVwZWF0ZWRseSBjYWxsXG4gICAgICogYGdldFVwZGF0ZXNgIGFuZCBydW4geW91ciBtaWRkbGV3YXJlIGZvciBldmVyeSByZWNlaXZlZCB1cGRhdGUsIGFsbG93aW5nXG4gICAgICogeW91ciBib3QgdG8gcmVzcG9uZCB0byBtZXNzYWdlcy5cbiAgICAgKlxuICAgICAqIElmIHlvdXIgYm90IGlzIGFscmVhZHkgcnVubmluZywgdGhpcyBtZXRob2QgZG9lcyBub3RoaW5nLlxuICAgICAqXG4gICAgICogKipOb3RlIHRoYXQgdGhpcyBzdGFydHMgeW91ciBib3QgdXNpbmcgYSB2ZXJ5IHNpbXBsZSBsb25nIHBvbGxpbmdcbiAgICAgKiBpbXBsZW1lbnRhdGlvbi4qKiBgYm90LnN0YXJ0YCBzaG91bGQgb25seSBiZSB1c2VkIGZvciBzbWFsbCBib3RzLiBXaGlsZVxuICAgICAqIHRoZSByZXN0IG9mIGdyYW1tWSB3YXMgYnVpbHQgdG8gcGVyZm9ybSB3ZWxsIGV2ZW4gdW5kZXIgZXh0cmVtZSBsb2FkcyxcbiAgICAgKiBzaW1wbGUgbG9uZyBwb2xsaW5nIGlzIG5vdCBjYXBhYmxlIG9mIHNjYWxpbmcgdXAgaW4gYSBzaW1pbGFyIGZhc2hpb24uXG4gICAgICogWW91IHNob3VsZCBzd2l0Y2ggb3ZlciB0byB1c2luZyBgQGdyYW1teWpzL3J1bm5lcmAgaWYgeW91IGFyZSBydW5uaW5nIGFcbiAgICAgKiBib3Qgd2l0aCBoaWdoIGxvYWQuXG4gICAgICpcbiAgICAgKiBXaGF0IGV4YWN0bHkgX2hpZ2ggbG9hZF8gbWVhbnMgZGlmZmVycyBmcm9tIGJvdCB0byBib3QsIGJ1dCBhcyBhIHJ1bGUgb2ZcbiAgICAgKiB0aHVtYiwgc2ltcGxlIGxvbmcgcG9sbGluZyBzaG91bGQgbm90IGJlIHByb2Nlc3NpbmcgbW9yZSB0aGFuIH41S1xuICAgICAqIG1lc3NhZ2VzIGV2ZXJ5IGhvdXIuIEFsc28sIGlmIHlvdXIgYm90IGhhcyBsb25nLXJ1bm5pbmcgb3BlcmF0aW9ucyBzdWNoXG4gICAgICogYXMgbGFyZ2UgZmlsZSB0cmFuc2ZlcnMgdGhhdCBibG9jayB0aGUgbWlkZGxld2FyZSBmcm9tIGNvbXBsZXRpbmcsIHRoaXNcbiAgICAgKiB3aWxsIGltcGFjdCB0aGUgcmVzcG9uc2l2ZW5lc3MgbmVnYXRpdmVseSwgc28gaXQgbWFrZXMgc2Vuc2UgdG8gdXNlIHRoZVxuICAgICAqIGBAZ3JhbW15anMvcnVubmVyYCBwYWNrYWdlIGV2ZW4gaWYgeW91IHJlY2VpdmUgbXVjaCBmZXdlciBtZXNzYWdlcy4gSWZcbiAgICAgKiB5b3Ugd29ycnkgYWJvdXQgaG93IG11Y2ggbG9hZCB5b3VyIGJvdCBjYW4gaGFuZGxlLCBjaGVjayBvdXQgdGhlIGdyYW1tWVxuICAgICAqIFtkb2N1bWVudGF0aW9uXShodHRwczovL2dyYW1teS5kZXYvYWR2YW5jZWQvc2NhbGluZy5odG1sKSBhYm91dCBzY2FsaW5nXG4gICAgICogdXAuXG4gICAgICpcbiAgICAgKiBAcGFyYW0gb3B0aW9ucyBPcHRpb25zIHRvIHVzZSBmb3Igc2ltcGxlIGxvbmcgcG9sbGluZ1xuICAgICAqL1xuICAgIGFzeW5jIHN0YXJ0KG9wdGlvbnM/OiBQb2xsaW5nT3B0aW9ucykge1xuICAgICAgICAvLyBQZXJmb3JtIHNldHVwXG4gICAgICAgIGNvbnN0IHNldHVwOiBQcm9taXNlPHZvaWQ+W10gPSBbXTtcbiAgICAgICAgaWYgKCF0aGlzLmlzSW5pdGVkKCkpIHtcbiAgICAgICAgICAgIHNldHVwLnB1c2godGhpcy5pbml0KHRoaXMucG9sbGluZ0Fib3J0Q29udHJvbGxlcj8uc2lnbmFsKSk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHRoaXMucG9sbGluZ1J1bm5pbmcpIHtcbiAgICAgICAgICAgIGF3YWl0IFByb21pc2UuYWxsKHNldHVwKTtcbiAgICAgICAgICAgIGRlYnVnKFwiU2ltcGxlIGxvbmcgcG9sbGluZyBhbHJlYWR5IHJ1bm5pbmchXCIpO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5wb2xsaW5nUnVubmluZyA9IHRydWU7XG4gICAgICAgIHRoaXMucG9sbGluZ0Fib3J0Q29udHJvbGxlciA9IG5ldyBBYm9ydENvbnRyb2xsZXIoKTtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIHNldHVwLnB1c2god2l0aFJldHJpZXMoYXN5bmMgKCkgPT4ge1xuICAgICAgICAgICAgICAgIGF3YWl0IHRoaXMuYXBpLmRlbGV0ZVdlYmhvb2soe1xuICAgICAgICAgICAgICAgICAgICBkcm9wX3BlbmRpbmdfdXBkYXRlczogb3B0aW9ucz8uZHJvcF9wZW5kaW5nX3VwZGF0ZXMsXG4gICAgICAgICAgICAgICAgfSwgdGhpcy5wb2xsaW5nQWJvcnRDb250cm9sbGVyPy5zaWduYWwpO1xuICAgICAgICAgICAgfSwgdGhpcy5wb2xsaW5nQWJvcnRDb250cm9sbGVyPy5zaWduYWwpKTtcbiAgICAgICAgICAgIGF3YWl0IFByb21pc2UuYWxsKHNldHVwKTtcblxuICAgICAgICAgICAgLy8gQWxsIGFzeW5jIG9wcyBvZiBzZXR1cCBjb21wbGV0ZSwgcnVuIGNhbGxiYWNrXG4gICAgICAgICAgICBhd2FpdCBvcHRpb25zPy5vblN0YXJ0Py4odGhpcy5ib3RJbmZvKTtcbiAgICAgICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICAgICAgICB0aGlzLnBvbGxpbmdSdW5uaW5nID0gZmFsc2U7XG4gICAgICAgICAgICB0aGlzLnBvbGxpbmdBYm9ydENvbnRyb2xsZXIgPSB1bmRlZmluZWQ7XG4gICAgICAgICAgICB0aHJvdyBlcnI7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBCb3Qgd2FzIHN0b3BwZWQgZHVyaW5nIGBvblN0YXJ0YFxuICAgICAgICBpZiAoIXRoaXMucG9sbGluZ1J1bm5pbmcpIHJldHVybjtcblxuICAgICAgICAvLyBQcmV2ZW50IGNvbW1vbiBtaXN1c2UgdGhhdCBsZWFkcyB0byBtaXNzaW5nIHVwZGF0ZXNcbiAgICAgICAgdmFsaWRhdGVBbGxvd2VkVXBkYXRlcyhcbiAgICAgICAgICAgIHRoaXMub2JzZXJ2ZWRVcGRhdGVUeXBlcyxcbiAgICAgICAgICAgIG9wdGlvbnM/LmFsbG93ZWRfdXBkYXRlcyxcbiAgICAgICAgKTtcbiAgICAgICAgLy8gUHJldmVudCBjb21tb24gbWlzdXNlIHRoYXQgY2F1c2VzIG1lbW9yeSBsZWFrXG4gICAgICAgIHRoaXMudXNlID0gbm9Vc2VGdW5jdGlvbjtcblxuICAgICAgICAvLyBTdGFydCBwb2xsaW5nXG4gICAgICAgIGRlYnVnKFwiU3RhcnRpbmcgc2ltcGxlIGxvbmcgcG9sbGluZ1wiKTtcbiAgICAgICAgYXdhaXQgdGhpcy5sb29wKG9wdGlvbnMpO1xuICAgICAgICBkZWJ1ZyhcIk1pZGRsZXdhcmUgaXMgZG9uZSBydW5uaW5nXCIpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFN0b3BzIHRoZSBib3QgZnJvbSBsb25nIHBvbGxpbmcuXG4gICAgICpcbiAgICAgKiBBbGwgbWlkZGxld2FyZSB0aGF0IGlzIGN1cnJlbnRseSBiZWluZyBleGVjdXRlZCBtYXkgY29tcGxldGUsIGJ1dCBub1xuICAgICAqIGZ1cnRoZXIgYGdldFVwZGF0ZXNgIGNhbGxzIHdpbGwgYmUgcGVyZm9ybWVkLiBUaGUgY3VycmVudCBgZ2V0VXBkYXRlc2BcbiAgICAgKiByZXF1ZXN0IHdpbGwgYmUgY2FuY2VsbGVkLlxuICAgICAqXG4gICAgICogSW4gYWRkaXRpb24sIHRoaXMgbWV0aG9kIHdpbGwgX2NvbmZpcm1fIHRoZSBsYXN0IHJlY2VpdmVkIHVwZGF0ZSB0byB0aGVcbiAgICAgKiBUZWxlZ3JhbSBzZXJ2ZXJzIGJ5IGNhbGxpbmcgYGdldFVwZGF0ZXNgIG9uZSBsYXN0IHRpbWUgd2l0aCB0aGUgbGF0ZXN0XG4gICAgICogb2Zmc2V0IHZhbHVlLiBJZiBhbnkgdXBkYXRlcyBhcmUgcmVjZWl2ZWQgaW4gdGhpcyBjYWxsLCB0aGV5IGFyZVxuICAgICAqIGRpc2NhcmRlZCBhbmQgd2lsbCBiZSBmZXRjaGVkIGFnYWluIHdoZW4gdGhlIGJvdCBzdGFydHMgdXAgdGhlIG5leHQgdGltZS5cbiAgICAgKiBDb25mZXIgdGhlIG9mZmljaWFsIGRvY3VtZW50YXRpb24gb24gY29uZmlybWluZyB1cGRhdGVzIGlmIHlvdSB3YW50IHRvXG4gICAgICoga25vdyBtb3JlOiBodHRwczovL2NvcmUudGVsZWdyYW0ub3JnL2JvdHMvYXBpI2dldHVwZGF0ZXNcbiAgICAgKlxuICAgICAqID4gTm90ZSB0aGF0IHRoaXMgbWV0aG9kIHdpbGwgbm90IHdhaXQgZm9yIHRoZSBtaWRkbGV3YXJlIHN0YWNrIHRvIGZpbmlzaC5cbiAgICAgKiA+IElmIHlvdSBuZWVkIHRvIHJ1biBjb2RlIGFmdGVyIGFsbCBtaWRkbGV3YXJlIGlzIGRvbmUsIGNvbnNpZGVyIHdhaXRpbmdcbiAgICAgKiA+IGZvciB0aGUgcHJvbWlzZSByZXR1cm5lZCBieSBgYm90LnN0YXJ0KClgIHRvIHJlc29sdmUuXG4gICAgICovXG4gICAgYXN5bmMgc3RvcCgpIHtcbiAgICAgICAgaWYgKHRoaXMucG9sbGluZ1J1bm5pbmcpIHtcbiAgICAgICAgICAgIGRlYnVnKFwiU3RvcHBpbmcgYm90LCBzYXZpbmcgdXBkYXRlIG9mZnNldFwiKTtcbiAgICAgICAgICAgIHRoaXMucG9sbGluZ1J1bm5pbmcgPSBmYWxzZTtcbiAgICAgICAgICAgIHRoaXMucG9sbGluZ0Fib3J0Q29udHJvbGxlcj8uYWJvcnQoKTtcbiAgICAgICAgICAgIGNvbnN0IG9mZnNldCA9IHRoaXMubGFzdFRyaWVkVXBkYXRlSWQgKyAxO1xuICAgICAgICAgICAgYXdhaXQgdGhpcy5hcGkuZ2V0VXBkYXRlcyh7IG9mZnNldCwgbGltaXQ6IDEgfSlcbiAgICAgICAgICAgICAgICAuZmluYWxseSgoKSA9PiB0aGlzLnBvbGxpbmdBYm9ydENvbnRyb2xsZXIgPSB1bmRlZmluZWQpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgZGVidWcoXCJCb3QgaXMgbm90IHJ1bm5pbmchXCIpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogU2V0cyB0aGUgYm90cyBlcnJvciBoYW5kbGVyIHRoYXQgaXMgdXNlZCBkdXJpbmcgbG9uZyBwb2xsaW5nLlxuICAgICAqXG4gICAgICogWW91IHNob3VsZCBjYWxsIHRoaXMgbWV0aG9kIHRvIHNldCBhbiBlcnJvciBoYW5kbGVyIGlmIHlvdSBhcmUgdXNpbmcgbG9uZ1xuICAgICAqIHBvbGxpbmcsIG5vIG1hdHRlciB3aGV0aGVyIHlvdSB1c2UgYGJvdC5zdGFydGAgb3IgdGhlIGBAZ3JhbW15anMvcnVubmVyYFxuICAgICAqIHBhY2thZ2UgdG8gcnVuIHlvdXIgYm90LlxuICAgICAqXG4gICAgICogQ2FsbGluZyBgYm90LmNhdGNoYCB3aGVuIHVzaW5nIG90aGVyIG1lYW5zIG9mIHJ1bm5pbmcgeW91ciBib3QgKG9yXG4gICAgICogd2ViaG9va3MpIGhhcyBubyBlZmZlY3QuXG4gICAgICpcbiAgICAgKiBAcGFyYW0gZXJyb3JIYW5kbGVyIEEgZnVuY3Rpb24gdGhhdCBoYW5kbGVzIHBvdGVudGlhbCBtaWRkbGV3YXJlIGVycm9yc1xuICAgICAqL1xuICAgIGNhdGNoKGVycm9ySGFuZGxlcjogRXJyb3JIYW5kbGVyPEM+KSB7XG4gICAgICAgIHRoaXMuZXJyb3JIYW5kbGVyID0gZXJyb3JIYW5kbGVyO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEludGVybmFsLiBEbyBub3QgY2FsbC4gRW50ZXJzIGEgbG9vcCB0aGF0IHdpbGwgcGVyZm9ybSBsb25nIHBvbGxpbmcgdW50aWxcbiAgICAgKiB0aGUgYm90IGlzIHN0b3BwZWQuXG4gICAgICovXG4gICAgcHJpdmF0ZSBhc3luYyBsb29wKG9wdGlvbnM/OiBQb2xsaW5nT3B0aW9ucykge1xuICAgICAgICBjb25zdCBsaW1pdCA9IG9wdGlvbnM/LmxpbWl0O1xuICAgICAgICBjb25zdCB0aW1lb3V0ID0gb3B0aW9ucz8udGltZW91dCA/PyAzMDsgLy8gc2Vjb25kc1xuICAgICAgICBsZXQgYWxsb3dlZF91cGRhdGVzOiBQb2xsaW5nT3B0aW9uc1tcImFsbG93ZWRfdXBkYXRlc1wiXSA9XG4gICAgICAgICAgICBvcHRpb25zPy5hbGxvd2VkX3VwZGF0ZXMgPz8gW107IC8vIHJlc2V0IHRvIGRlZmF1bHQgaWYgdW5zcGVjaWZpZWRcblxuICAgICAgICB3aGlsZSAodGhpcy5wb2xsaW5nUnVubmluZykge1xuICAgICAgICAgICAgLy8gZmV0Y2ggdXBkYXRlc1xuICAgICAgICAgICAgY29uc3QgdXBkYXRlcyA9IGF3YWl0IHRoaXMuZmV0Y2hVcGRhdGVzKFxuICAgICAgICAgICAgICAgIHsgbGltaXQsIHRpbWVvdXQsIGFsbG93ZWRfdXBkYXRlcyB9LFxuICAgICAgICAgICAgKTtcbiAgICAgICAgICAgIC8vIGNoZWNrIGlmIHBvbGxpbmcgc3RvcHBlZFxuICAgICAgICAgICAgaWYgKHVwZGF0ZXMgPT09IHVuZGVmaW5lZCkgYnJlYWs7XG4gICAgICAgICAgICAvLyBoYW5kbGUgdXBkYXRlc1xuICAgICAgICAgICAgYXdhaXQgdGhpcy5oYW5kbGVVcGRhdGVzKHVwZGF0ZXMpO1xuICAgICAgICAgICAgLy8gVGVsZWdyYW0gdXNlcyB0aGUgbGFzdCBzZXR0aW5nIGlmIGBhbGxvd2VkX3VwZGF0ZXNgIGlzIG9taXR0ZWQgc29cbiAgICAgICAgICAgIC8vIHdlIGNhbiBzYXZlIHNvbWUgdHJhZmZpYyBieSBvbmx5IHNlbmRpbmcgaXQgaW4gdGhlIGZpcnN0IHJlcXVlc3RcbiAgICAgICAgICAgIGFsbG93ZWRfdXBkYXRlcyA9IHVuZGVmaW5lZDtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEludGVybmFsLiBEbyBub3QgY2FsbC4gUmVsaWFibHkgZmV0Y2hlcyBhbiB1cGRhdGUgYmF0Y2ggdmlhIGBnZXRVcGRhdGVzYC5cbiAgICAgKiBIYW5kbGVzIGFsbCBrbm93biBlcnJvcnMuIFJldHVybnMgYHVuZGVmaW5lZGAgaWYgdGhlIGJvdCBpcyBzdG9wcGVkIGFuZFxuICAgICAqIHRoZSBjYWxsIGdldHMgY2FuY2VsbGVkLlxuICAgICAqXG4gICAgICogQHBhcmFtIG9wdGlvbnMgUG9sbGluZyBvcHRpb25zXG4gICAgICogQHJldHVybnMgQW4gYXJyYXkgb2YgdXBkYXRlcywgb3IgYHVuZGVmaW5lZGAgaWYgdGhlIGJvdCBpcyBzdG9wcGVkLlxuICAgICAqL1xuICAgIHByaXZhdGUgYXN5bmMgZmV0Y2hVcGRhdGVzKFxuICAgICAgICB7IGxpbWl0LCB0aW1lb3V0LCBhbGxvd2VkX3VwZGF0ZXMgfTogUG9sbGluZ09wdGlvbnMsXG4gICAgKSB7XG4gICAgICAgIGNvbnN0IG9mZnNldCA9IHRoaXMubGFzdFRyaWVkVXBkYXRlSWQgKyAxO1xuICAgICAgICBsZXQgdXBkYXRlczogVXBkYXRlW10gfCB1bmRlZmluZWQgPSB1bmRlZmluZWQ7XG4gICAgICAgIGRvIHtcbiAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgdXBkYXRlcyA9IGF3YWl0IHRoaXMuYXBpLmdldFVwZGF0ZXMoXG4gICAgICAgICAgICAgICAgICAgIHsgb2Zmc2V0LCBsaW1pdCwgdGltZW91dCwgYWxsb3dlZF91cGRhdGVzIH0sXG4gICAgICAgICAgICAgICAgICAgIHRoaXMucG9sbGluZ0Fib3J0Q29udHJvbGxlcj8uc2lnbmFsLFxuICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICAgICAgICAgIGF3YWl0IHRoaXMuaGFuZGxlUG9sbGluZ0Vycm9yKGVycm9yKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSB3aGlsZSAodXBkYXRlcyA9PT0gdW5kZWZpbmVkICYmIHRoaXMucG9sbGluZ1J1bm5pbmcpO1xuICAgICAgICByZXR1cm4gdXBkYXRlcztcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBJbnRlcm5hbC4gRG8gbm90IGNhbGwuIEhhbmRsZXMgYW4gZXJyb3IgdGhhdCBvY2N1cnJlZCBkdXJpbmcgbG9uZ1xuICAgICAqIHBvbGxpbmcuXG4gICAgICovXG4gICAgcHJpdmF0ZSBhc3luYyBoYW5kbGVQb2xsaW5nRXJyb3IoZXJyb3I6IHVua25vd24pIHtcbiAgICAgICAgaWYgKCF0aGlzLnBvbGxpbmdSdW5uaW5nKSB7XG4gICAgICAgICAgICBkZWJ1ZyhcIlBlbmRpbmcgZ2V0VXBkYXRlcyByZXF1ZXN0IGNhbmNlbGxlZFwiKTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBsZXQgc2xlZXBTZWNvbmRzID0gMztcbiAgICAgICAgaWYgKGVycm9yIGluc3RhbmNlb2YgR3JhbW15RXJyb3IpIHtcbiAgICAgICAgICAgIGRlYnVnRXJyKGVycm9yLm1lc3NhZ2UpO1xuICAgICAgICAgICAgLy8gcmV0aHJvdyB1cG9uIHVuYXV0aG9yaXplZCBvciBjb25mbGljdFxuICAgICAgICAgICAgaWYgKGVycm9yLmVycm9yX2NvZGUgPT09IDQwMSB8fCBlcnJvci5lcnJvcl9jb2RlID09PSA0MDkpIHtcbiAgICAgICAgICAgICAgICB0aHJvdyBlcnJvcjtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoZXJyb3IuZXJyb3JfY29kZSA9PT0gNDI5KSB7XG4gICAgICAgICAgICAgICAgZGVidWdFcnIoXCJCb3QgQVBJIHNlcnZlciBpcyBjbG9zaW5nLlwiKTtcbiAgICAgICAgICAgICAgICBzbGVlcFNlY29uZHMgPSBlcnJvci5wYXJhbWV0ZXJzLnJldHJ5X2FmdGVyID8/IHNsZWVwU2Vjb25kcztcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIGRlYnVnRXJyKGVycm9yKTtcbiAgICAgICAgZGVidWdFcnIoXG4gICAgICAgICAgICBgQ2FsbCB0byBnZXRVcGRhdGVzIGZhaWxlZCwgcmV0cnlpbmcgaW4gJHtzbGVlcFNlY29uZHN9IHNlY29uZHMgLi4uYCxcbiAgICAgICAgKTtcbiAgICAgICAgYXdhaXQgc2xlZXAoc2xlZXBTZWNvbmRzKTtcbiAgICB9XG59XG5cbi8qKlxuICogUGVyZm9ybXMgYSBuZXR3b3JrIGNhbGwgdGFzaywgcmV0cnlpbmcgdXBvbiBrbm93biBlcnJvcnMgdW50aWwgc3VjY2Vzcy5cbiAqXG4gKiBJZiB0aGUgdGFzayBlcnJvcnMgYW5kIGEgcmV0cnlfYWZ0ZXIgdmFsdWUgY2FuIGJlIHVzZWQsIGEgc3Vic2VxdWVudCByZXRyeVxuICogd2lsbCBiZSBkZWxheWVkIGJ5IHRoZSBzcGVjaWZpZWQgcGVyaW9kIG9mIHRpbWUuXG4gKlxuICogT3RoZXJ3aXNlLCBpZiB0aGUgZmlyc3QgYXR0ZW1wdCBhdCBydW5uaW5nIHRoZSB0YXNrIGZhaWxzLCB0aGUgdGFzayBpc1xuICogcmV0cmllZCBpbW1lZGlhdGVseS4gSWYgc2Vjb25kIGF0dGVtcHQgZmFpbHMsIHRvbywgd2FpdHMgZm9yIDEwMCBtcywgYW5kIHRoZW5cbiAqIGRvdWJsZXMgdGhpcyBkZWxheSBmb3IgZXZlcnkgc3Vic2VxdWVudCBhdHRlbXQuIE5ldmVyIHdhaXRzIGxvbmdlciB0aGFuIDFcbiAqIGhvdXIgYmVmb3JlIHJldHJ5aW5nLlxuICpcbiAqIEBwYXJhbSB0YXNrIEFzeW5jIHRhc2sgdG8gcGVyZm9ybVxuICogQHBhcmFtIHNpZ25hbCBPcHRpb25hbCBgQWJvcnRTaWduYWxgIHRvIHByZXZlbnQgZnVydGhlciByZXRyaWVzXG4gKi9cbmFzeW5jIGZ1bmN0aW9uIHdpdGhSZXRyaWVzPFQ+KFxuICAgIHRhc2s6ICgpID0+IFByb21pc2U8VD4sXG4gICAgc2lnbmFsPzogQWJvcnRTaWduYWwsXG4pOiBQcm9taXNlPFQ+IHtcbiAgICAvLyBTZXQgdXAgZGVsYXlzIGJldHdlZW4gcmV0cmllc1xuICAgIGNvbnN0IElOSVRJQUxfREVMQVkgPSA1MDsgLy8gbXNcbiAgICBsZXQgbGFzdERlbGF5ID0gSU5JVElBTF9ERUxBWTtcblxuICAgIC8vIERlZmluZSBlcnJvciBoYW5kbGVyXG4gICAgLyoqXG4gICAgICogRGV0ZXJtaW5lcyB0aGUgZXJyb3IgaGFuZGxpbmcgc3RyYXRlZ3kgYmFzZWQgb24gdmFyaW91cyBlcnJvciB0eXBlcy5cbiAgICAgKiBTbGVlcHMgaWYgbmVjZXNzYXJ5LCBhbmQgcmV0dXJucyB3aGV0aGVyIHRvIHJldHJ5IG9yIHJldGhyb3cgYW4gZXJyb3IuXG4gICAgICovXG4gICAgYXN5bmMgZnVuY3Rpb24gaGFuZGxlRXJyb3IoZXJyb3I6IHVua25vd24pIHtcbiAgICAgICAgbGV0IGRlbGF5ID0gZmFsc2U7XG4gICAgICAgIGxldCBzdHJhdGVneTogXCJyZXRyeVwiIHwgXCJyZXRocm93XCIgPSBcInJldGhyb3dcIjtcblxuICAgICAgICBpZiAoZXJyb3IgaW5zdGFuY2VvZiBIdHRwRXJyb3IpIHtcbiAgICAgICAgICAgIGRlbGF5ID0gdHJ1ZTtcbiAgICAgICAgICAgIHN0cmF0ZWd5ID0gXCJyZXRyeVwiO1xuICAgICAgICB9IGVsc2UgaWYgKGVycm9yIGluc3RhbmNlb2YgR3JhbW15RXJyb3IpIHtcbiAgICAgICAgICAgIGlmIChlcnJvci5lcnJvcl9jb2RlID49IDUwMCkge1xuICAgICAgICAgICAgICAgIGRlbGF5ID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICBzdHJhdGVneSA9IFwicmV0cnlcIjtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoZXJyb3IuZXJyb3JfY29kZSA9PT0gNDI5KSB7XG4gICAgICAgICAgICAgICAgY29uc3QgcmV0cnlBZnRlciA9IGVycm9yLnBhcmFtZXRlcnMucmV0cnlfYWZ0ZXI7XG4gICAgICAgICAgICAgICAgaWYgKHR5cGVvZiByZXRyeUFmdGVyID09PSBcIm51bWJlclwiKSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIGlnbm9yZSB0aGUgYmFja29mZiBmb3Igc2xlZXAsIHRoZW4gcmVzZXQgaXRcbiAgICAgICAgICAgICAgICAgICAgYXdhaXQgc2xlZXAocmV0cnlBZnRlciwgc2lnbmFsKTtcbiAgICAgICAgICAgICAgICAgICAgbGFzdERlbGF5ID0gSU5JVElBTF9ERUxBWTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBkZWxheSA9IHRydWU7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHN0cmF0ZWd5ID0gXCJyZXRyeVwiO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgaWYgKGRlbGF5KSB7XG4gICAgICAgICAgICAvLyBEbyBub3Qgc2xlZXAgZm9yIHRoZSBmaXJzdCByZXRyeVxuICAgICAgICAgICAgaWYgKGxhc3REZWxheSAhPT0gSU5JVElBTF9ERUxBWSkge1xuICAgICAgICAgICAgICAgIGF3YWl0IHNsZWVwKGxhc3REZWxheSwgc2lnbmFsKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNvbnN0IFRXRU5UWV9NSU5VVEVTID0gMjAgKiA2MCAqIDEwMDA7IC8vIG1zXG4gICAgICAgICAgICBsYXN0RGVsYXkgPSBNYXRoLm1pbihUV0VOVFlfTUlOVVRFUywgMiAqIGxhc3REZWxheSk7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gc3RyYXRlZ3k7XG4gICAgfVxuXG4gICAgLy8gUGVyZm9ybSB0aGUgYWN0dWFsIHRhc2sgd2l0aCByZXRyaWVzXG4gICAgbGV0IHJlc3VsdDogeyBvazogZmFsc2UgfSB8IHsgb2s6IHRydWU7IHZhbHVlOiBUIH0gPSB7IG9rOiBmYWxzZSB9O1xuICAgIHdoaWxlICghcmVzdWx0Lm9rKSB7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICByZXN1bHQgPSB7IG9rOiB0cnVlLCB2YWx1ZTogYXdhaXQgdGFzaygpIH07XG4gICAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgICAgICBkZWJ1Z0VycihlcnJvcik7XG4gICAgICAgICAgICBjb25zdCBzdHJhdGVneSA9IGF3YWl0IGhhbmRsZUVycm9yKGVycm9yKTtcbiAgICAgICAgICAgIHN3aXRjaCAoc3RyYXRlZ3kpIHtcbiAgICAgICAgICAgICAgICBjYXNlIFwicmV0cnlcIjpcbiAgICAgICAgICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgICAgICAgY2FzZSBcInJldGhyb3dcIjpcbiAgICAgICAgICAgICAgICAgICAgdGhyb3cgZXJyb3I7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHJlc3VsdC52YWx1ZTtcbn1cblxuLyoqXG4gKiBSZXR1cm5zIGEgbmV3IHByb21pc2UgdGhhdCByZXNvbHZlcyBhZnRlciB0aGUgc3BlY2lmaWVkIG51bWJlciBvZiBzZWNvbmRzLCBvclxuICogcmVqZWN0cyBhcyBzb29uIGFzIHRoZSBnaXZlbiBzaWduYWwgaXMgYWJvcnRlZC5cbiAqL1xuYXN5bmMgZnVuY3Rpb24gc2xlZXAoc2Vjb25kczogbnVtYmVyLCBzaWduYWw/OiBBYm9ydFNpZ25hbCkge1xuICAgIGxldCBoYW5kbGU6IG51bWJlciB8IHVuZGVmaW5lZDtcbiAgICBsZXQgcmVqZWN0OiAoKGVycjogRXJyb3IpID0+IHZvaWQpIHwgdW5kZWZpbmVkO1xuICAgIGZ1bmN0aW9uIGFib3J0KCkge1xuICAgICAgICByZWplY3Q/LihuZXcgRXJyb3IoXCJBYm9ydGVkIGRlbGF5XCIpKTtcbiAgICAgICAgaWYgKGhhbmRsZSAhPT0gdW5kZWZpbmVkKSBjbGVhclRpbWVvdXQoaGFuZGxlKTtcbiAgICB9XG4gICAgdHJ5IHtcbiAgICAgICAgYXdhaXQgbmV3IFByb21pc2U8dm9pZD4oKHJlcywgcmVqKSA9PiB7XG4gICAgICAgICAgICByZWplY3QgPSByZWo7XG4gICAgICAgICAgICBpZiAoc2lnbmFsPy5hYm9ydGVkKSB7XG4gICAgICAgICAgICAgICAgYWJvcnQoKTtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBzaWduYWw/LmFkZEV2ZW50TGlzdGVuZXIoXCJhYm9ydFwiLCBhYm9ydCk7XG4gICAgICAgICAgICBoYW5kbGUgPSBzZXRUaW1lb3V0KHJlcywgMTAwMCAqIHNlY29uZHMpO1xuICAgICAgICB9KTtcbiAgICB9IGZpbmFsbHkge1xuICAgICAgICBzaWduYWw/LnJlbW92ZUV2ZW50TGlzdGVuZXIoXCJhYm9ydFwiLCBhYm9ydCk7XG4gICAgfVxufVxuXG4vKipcbiAqIFRha2VzIGEgc2V0IG9mIG9ic2VydmVkIHVwZGF0ZSB0eXBlcyBhbmQgYSBsaXN0IG9mIGFsbG93ZWQgdXBkYXRlcyBhbmQgbG9ncyBhXG4gKiB3YXJuaW5nIGluIGRlYnVnIG1vZGUgaWYgc29tZSB1cGRhdGUgdHlwZXMgd2VyZSBvYnNlcnZlZCB0aGF0IGhhdmUgbm90IGJlZW5cbiAqIGFsbG93ZWQuXG4gKi9cbmZ1bmN0aW9uIHZhbGlkYXRlQWxsb3dlZFVwZGF0ZXMoXG4gICAgdXBkYXRlczogU2V0PHN0cmluZz4sXG4gICAgYWxsb3dlZDogcmVhZG9ubHkgc3RyaW5nW10gPSBERUZBVUxUX1VQREFURV9UWVBFUyxcbikge1xuICAgIGNvbnN0IGltcG9zc2libGUgPSBBcnJheS5mcm9tKHVwZGF0ZXMpLmZpbHRlcigodSkgPT4gIWFsbG93ZWQuaW5jbHVkZXModSkpO1xuICAgIGlmIChpbXBvc3NpYmxlLmxlbmd0aCA+IDApIHtcbiAgICAgICAgZGVidWdXYXJuKFxuICAgICAgICAgICAgYFlvdSByZWdpc3RlcmVkIGxpc3RlbmVycyBmb3IgdGhlIGZvbGxvd2luZyB1cGRhdGUgdHlwZXMsIFxcXG5idXQgeW91IGRpZCBub3Qgc3BlY2lmeSB0aGVtIGluIFxcYGFsbG93ZWRfdXBkYXRlc1xcYCBcXFxuc28gdGhleSBtYXkgbm90IGJlIHJlY2VpdmVkOiAke2ltcG9zc2libGUubWFwKCh1KSA9PiBgJyR7dX0nYCkuam9pbihcIiwgXCIpfWAsXG4gICAgICAgICk7XG4gICAgfVxufVxuZnVuY3Rpb24gbm9Vc2VGdW5jdGlvbigpOiBuZXZlciB7XG4gICAgdGhyb3cgbmV3IEVycm9yKGBJdCBsb29rcyBsaWtlIHlvdSBhcmUgcmVnaXN0ZXJpbmcgbW9yZSBsaXN0ZW5lcnMgXFxcbm9uIHlvdXIgYm90IGZyb20gd2l0aGluIG90aGVyIGxpc3RlbmVycyEgVGhpcyBtZWFucyB0aGF0IGV2ZXJ5IHRpbWUgeW91ciBib3QgXFxcbmhhbmRsZXMgYSBtZXNzYWdlIGxpa2UgdGhpcyBvbmUsIG5ldyBsaXN0ZW5lcnMgd2lsbCBiZSBhZGRlZC4gVGhpcyBsaXN0IGdyb3dzIHVudGlsIFxcXG55b3VyIG1hY2hpbmUgY3Jhc2hlcywgc28gZ3JhbW1ZIHRocm93cyB0aGlzIGVycm9yIHRvIHRlbGwgeW91IHRoYXQgeW91IHNob3VsZCBcXFxucHJvYmFibHkgZG8gdGhpbmdzIGEgYml0IGRpZmZlcmVudGx5LiBJZiB5b3UncmUgdW5zdXJlIGhvdyB0byByZXNvbHZlIHRoaXMgcHJvYmxlbSwgXFxcbnlvdSBjYW4gYXNrIGluIHRoZSBncm91cCBjaGF0OiBodHRwczovL3RlbGVncmFtLm1lL2dyYW1teWpzXG5cbk9uIHRoZSBvdGhlciBoYW5kLCBpZiB5b3UgYWN0dWFsbHkga25vdyB3aGF0IHlvdSdyZSBkb2luZyBhbmQgeW91IGRvIG5lZWQgdG8gaW5zdGFsbCBcXFxuZnVydGhlciBtaWRkbGV3YXJlIHdoaWxlIHlvdXIgYm90IGlzIHJ1bm5pbmcsIGNvbnNpZGVyIGluc3RhbGxpbmcgYSBjb21wb3NlciBcXFxuaW5zdGFuY2Ugb24geW91ciBib3QsIGFuZCBpbiB0dXJuIGF1Z21lbnQgdGhlIGNvbXBvc2VyIGFmdGVyIHRoZSBmYWN0LiBUaGlzIHdheSwgXFxcbnlvdSBjYW4gY2lyY3VtdmVudCB0aGlzIHByb3RlY3Rpb24gYWdhaW5zdCBtZW1vcnkgbGVha3MuYCk7XG59XG4iXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsa0NBQWtDO0FBQ2xDLFNBQ0ksUUFBUSxFQUNSLFFBQVEsRUFHUixHQUFHLFFBQ0EsZ0JBQWdCO0FBQ3ZCLFNBQVMsT0FBTyxRQUErQyxlQUFlO0FBQzlFLFNBQVMsR0FBRyxRQUFRLGdCQUFnQjtBQUtwQyxTQUFTLFdBQVcsRUFBRSxTQUFTLFFBQVEsa0JBQWtCO0FBQ3pELFNBQXdDLEtBQUssRUFBRSxVQUFVLFFBQVEsY0FBYztBQUMvRSxTQUFTLFNBQVMsQ0FBQyxRQUFRLHFCQUFxQjtBQU9oRCxNQUFNLFFBQVEsRUFBRTtBQUNo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