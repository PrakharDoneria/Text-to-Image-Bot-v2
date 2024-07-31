import { Context } from "./context.ts";
// === Middleware errors
/**
 * This error is thrown when middleware throws. It simply wraps the original
 * error (accessible via the `error` property), but also provides access to the
 * respective context object that was processed while the error occurred.
 */ export class BotError extends Error {
    error;
    ctx;
    constructor(error, ctx){
        super(generateBotErrorMessage(error));
        this.error = error;
        this.ctx = ctx;
        this.name = "BotError";
        if (error instanceof Error) this.stack = error.stack;
    }
}
function generateBotErrorMessage(error) {
    let msg;
    if (error instanceof Error) {
        msg = `${error.name} in middleware: ${error.message}`;
    } else {
        const type = typeof error;
        msg = `Non-error value of type ${type} thrown in middleware`;
        switch(type){
            case "bigint":
            case "boolean":
            case "number":
            case "symbol":
                msg += `: ${error}`;
                break;
            case "string":
                msg += `: ${String(error).substring(0, 50)}`;
                break;
            default:
                msg += "!";
                break;
        }
    }
    return msg;
}
// === Middleware base functions
function flatten(mw) {
    return typeof mw === "function" ? mw : (ctx, next)=>mw.middleware()(ctx, next);
}
function concat(first, andThen) {
    return async (ctx, next)=>{
        let nextCalled = false;
        await first(ctx, async ()=>{
            if (nextCalled) throw new Error("`next` already called before!");
            else nextCalled = true;
            await andThen(ctx, next);
        });
    };
}
function pass(_ctx, next) {
    return next();
}
const leaf = ()=>Promise.resolve();
/**
 * Runs some given middleware function with a given context object.
 *
 * @param middleware The middleware to run
 * @param ctx The context to use
 */ export async function run(middleware, ctx) {
    await middleware(ctx, leaf);
}
// === Composer
/**
 * The composer is the heart of the middleware system in grammY. It is also the
 * superclass of `Bot`. Whenever you call `use` or `on` or some of the other
 * methods on your bot, you are in fact using the underlying composer instance
 * to register your middleware.
 *
 * If you're just getting started, you do not need to worry about what
 * middleware is, or about how to use a composer.
 *
 * On the other hand, if you want to dig deeper into how grammY implements
 * middleware, check out the
 * [documentation](https://grammy.dev/advanced/middleware.html) on the website.
 */ export class Composer {
    handler;
    /**
     * Constructs a new composer based on the provided middleware. If no
     * middleware is given, the composer instance will simply make all context
     * objects pass through without touching them.
     *
     * @param middleware The middleware to compose
     */ constructor(...middleware){
        this.handler = middleware.length === 0 ? pass : middleware.map(flatten).reduce(concat);
    }
    middleware() {
        return this.handler;
    }
    /**
     * Registers some middleware that receives all updates. It is installed by
     * concatenating it to the end of all previously installed middleware.
     *
     * Often, this method is used to install middleware that behaves like a
     * plugin, for example session middleware.
     * ```ts
     * bot.use(session())
     * ```
     *
     * This method returns a new instance of composer. The returned instance can
     * be further extended, and all changes will be regarded here. Confer the
     * [documentation](https://grammy.dev/advanced/middleware.html) on the
     * website if you want to know more about how the middleware system in
     * grammY works, especially when it comes to chaining the method calls
     * (`use( ... ).use( ... ).use( ... )`).
     *
     * @param middleware The middleware to register
     */ use(...middleware) {
        const composer = new Composer(...middleware);
        this.handler = concat(this.handler, flatten(composer));
        return composer;
    }
    /**
     * Registers some middleware that will only be executed for some specific
     * updates, namely those matching the provided filter query. Filter queries
     * are a concise way to specify which updates you are interested in.
     *
     * Here are some examples of valid filter queries:
     * ```ts
     * // All kinds of message updates
     * bot.on('message', ctx => { ... })
     *
     * // Only text messages
     * bot.on('message:text', ctx => { ... })
     *
     * // Only text messages with URL
     * bot.on('message:entities:url', ctx => { ... })
     *
     * // Text messages and text channel posts
     * bot.on(':text', ctx => { ... })
     *
     * // Messages with URL in text or caption (i.e. entities or caption entities)
     * bot.on('message::url', ctx => { ... })
     *
     * // Messages or channel posts with URL in text or caption
     * bot.on('::url', ctx => { ... })
     * ```
     *
     * You can use autocomplete in VS Code to see all available filter queries.
     * Check out the
     * [documentation](https://grammy.dev/guide/filter-queries.html) on the
     * website to learn more about filter queries in grammY.
     *
     * It is possible to pass multiple filter queries in an array, i.e.
     * ```ts
     * // Matches all text messages and edited text messages that contain a URL
     * bot.on(['message:entities:url', 'edited_message:entities:url'], ctx => { ... })
     * ```
     *
     * Your middleware will be executed if _any of the provided filter queries_
     * matches (logical OR).
     *
     * If you instead want to match _all of the provided filter queries_
     * (logical AND), you can chain the `.on` calls:
     * ```ts
     * // Matches all messages and channel posts that both a) contain a URL and b) are forwards
     * bot.on('::url').on(':forward_origin', ctx => { ... })
     * ```
     *
     * @param filter The filter query to use, may also be an array of queries
     * @param middleware The middleware to register behind the given filter
     */ on(filter, ...middleware) {
        return this.filter(Context.has.filterQuery(filter), ...middleware);
    }
    /**
     * Registers some middleware that will only be executed when the message
     * contains some text. Is it possible to pass a regular expression to match:
     * ```ts
     * // Match some text (exact match)
     * bot.hears('I love grammY', ctx => ctx.reply('And grammY loves you! <3'))
     * // Match a regular expression
     * bot.hears(/\/echo (.+)/, ctx => ctx.reply(ctx.match[1]))
     * ```
     * Note how `ctx.match` will contain the result of the regular expression.
     * Here it is a `RegExpMatchArray` object, so `ctx.match[1]` refers to the
     * part of the regex that was matched by `(.+)`, i.e. the text that comes
     * after “/echo”.
     *
     * You can pass an array of triggers. Your middleware will be executed if at
     * least one of them matches.
     *
     * Both text and captions of the received messages will be scanned. For
     * example, when a photo is sent to the chat and its caption matches the
     * trigger, your middleware will be executed.
     *
     * If you only want to match text messages and not captions, you can do
     * this:
     * ```ts
     * // Only matches text messages (and channel posts) for the regex
     * bot.on(':text').hears(/\/echo (.+)/, ctx => { ... })
     * ```
     *
     * @param trigger The text to look for
     * @param middleware The middleware to register
     */ hears(trigger, ...middleware) {
        return this.filter(Context.has.text(trigger), ...middleware);
    }
    /**
     * Registers some middleware that will only be executed when a certain
     * command is found.
     * ```ts
     * // Reacts to /start commands
     * bot.command('start', ctx => { ... })
     * // Reacts to /help commands
     * bot.command('help', ctx => { ... })
     * ```
     *
     * The rest of the message (excluding the command, and trimmed) is provided
     * via `ctx.match`.
     *
     * > **Did you know?** You can use deep linking
     * > (https://core.telegram.org/bots/features#deep-linking) to let users
     * > start your bot with a custom payload. As an example, send someone the
     * > link https://t.me/name-of-your-bot?start=custom-payload and register a
     * > start command handler on your bot with grammY. As soon as the user
     * > starts your bot, you will receive `custom-payload` in the `ctx.match`
     * > property!
     * > ```ts
     * > bot.command('start', ctx => {
     * >   const payload = ctx.match // will be 'custom-payload'
     * > })
     * > ```
     *
     * Note that commands are not matched in captions or in the middle of the
     * text.
     * ```ts
     * bot.command('start', ctx => { ... })
     * // ... does not match:
     * // A message saying: “some text /start some more text”
     * // A photo message with the caption “/start”
     * ```
     *
     * By default, commands are detected in channel posts, too. This means that
     * `ctx.message` is potentially `undefined`, so you should use `ctx.msg`
     * instead to grab both messages and channel posts. Alternatively, if you
     * want to limit your bot to finding commands only in private and group
     * chats, you can use `bot.on('message').command('start', ctx => { ... })`,
     * or even store a message-only version of your bot in a variable like so:
     * ```ts
     * const m = bot.on('message')
     *
     * m.command('start', ctx => { ... })
     * m.command('help', ctx => { ... })
     * // etc
     * ```
     *
     * If you need more freedom matching your commands, check out the `commands`
     * plugin.
     *
     * @param command The command to look for
     * @param middleware The middleware to register
     */ command(command, ...middleware) {
        return this.filter(Context.has.command(command), ...middleware);
    }
    /**
     * Registers some middleware that will only be added when a new reaction of
     * the given type is added to a message.
     * ```ts
     * // Reacts to new '👍' reactions
     * bot.reaction('👍', ctx => { ... })
     * // Reacts to new '👍' or '👎' reactions
     * bot.reaction(['👍', '👎'], ctx => { ... })
     * ```
     *
     * > Note that you have to enable `message_reaction` updates in
     * `allowed_updates` if you want your bot to receive updates about message
     * reactions.
     *
     * `bot.reaction` will trigger if:
     * - a new emoji reaction is added to a message
     * - a new custom emoji reaction is added a message
     *
     * `bot.reaction` will not trigger if:
     * - a reaction is removed
     * - an anonymous reaction count is updated, such as on channel posts
     * - `message_reaction` updates are not enabled for your bot
     *
     * @param reaction The reaction to look for
     * @param middleware The middleware to register
     */ reaction(reaction, ...middleware) {
        return this.filter(Context.has.reaction(reaction), ...middleware);
    }
    /**
     * Registers some middleware for certain chat types only. For example, you
     * can use this method to only receive updates from private chats. The four
     * chat types are `"channel"`, `"supergroup"`, `"group"`, and `"private"`.
     * This is especially useful when combined with other filtering logic. For
     * example, this is how can you respond to `/start` commands only from
     * private chats:
     * ```ts
     * bot.chatType("private").command("start", ctx => { ... })
     * ```
     *
     * Naturally, you can also use this method on its own.
     * ```ts
     * // Private chats only
     * bot.chatType("private", ctx => { ... });
     * // Channels only
     * bot.chatType("channel", ctx => { ... });
     * ```
     *
     * You can pass an array of chat types if you want your middleware to run
     * for any of several provided chat types.
     * ```ts
     * // Groups and supergroups only
     * bot.chatType(["group", "supergroup"], ctx => { ... });
     * ```
     * [Remember](https://grammy.dev/guide/context.html#shortcuts) also that you
     * can access the chat type via `ctx.chat.type`.
     *
     * @param chatType The chat type
     * @param middleware The middleware to register
     */ chatType(chatType, ...middleware) {
        return this.filter(Context.has.chatType(chatType), ...middleware);
    }
    /**
     * Registers some middleware for callback queries, i.e. the updates that
     * Telegram delivers to your bot when a user clicks an inline button (that
     * is a button under a message).
     *
     * This method is essentially the same as calling
     * ```ts
     * bot.on('callback_query:data', ctx => { ... })
     * ```
     * but it also allows you to match the query data against a given text or
     * regular expression.
     *
     * ```ts
     * // Create an inline keyboard
     * const keyboard = new InlineKeyboard().text('Go!', 'button-payload')
     * // Send a message with the keyboard
     * await bot.api.sendMessage(chat_id, 'Press a button!', {
     *   reply_markup: keyboard
     * })
     * // Listen to users pressing buttons with that specific payload
     * bot.callbackQuery('button-payload', ctx => { ... })
     *
     * // Listen to users pressing any button your bot ever sent
     * bot.on('callback_query:data', ctx => { ... })
     * ```
     *
     * Always remember to call `answerCallbackQuery`—even if you don't perform
     * any action: https://core.telegram.org/bots/api#answercallbackquery
     * ```ts
     * bot.on('callback_query:data', async ctx => {
     *   await ctx.answerCallbackQuery()
     * })
     * ```
     *
     * You can pass an array of triggers. Your middleware will be executed if at
     * least one of them matches.
     *
     * @param trigger The string to look for in the payload
     * @param middleware The middleware to register
     */ callbackQuery(trigger, ...middleware) {
        return this.filter(Context.has.callbackQuery(trigger), ...middleware);
    }
    /**
     * Registers some middleware for game queries, i.e. the updates that
     * Telegram delivers to your bot when a user clicks an inline button for the
     * HTML5 games platform on Telegram.
     *
     * This method is essentially the same as calling
     * ```ts
     * bot.on('callback_query:game_short_name', ctx => { ... })
     * ```
     * but it also allows you to match the query data against a given text or
     * regular expression.
     *
     * You can pass an array of triggers. Your middleware will be executed if at
     * least one of them matches.
     *
     * @param trigger The string to look for in the payload
     * @param middleware The middleware to register
     */ gameQuery(trigger, ...middleware) {
        return this.filter(Context.has.gameQuery(trigger), ...middleware);
    }
    /**
     * Registers middleware for inline queries. Telegram sends an inline query
     * to your bot whenever a user types “@your_bot_name ...” into a text field
     * in Telegram. You bot will then receive the entered search query and can
     * respond with a number of results (text, images, etc) that the user can
     * pick from to send a message _via_ your bot to the respective chat. Check
     * out https://core.telegram.org/bots/inline to read more about inline bots.
     *
     * > Note that you have to enable inline mode for you bot by contacting
     * > @BotFather first.
     *
     * ```ts
     * // Listen for users typing “@your_bot_name query”
     * bot.inlineQuery('query', async ctx => {
     *   // Answer the inline query, confer https://core.telegram.org/bots/api#answerinlinequery
     *   await ctx.answerInlineQuery( ... )
     * })
     * ```
     *
     * @param trigger The inline query text to match
     * @param middleware The middleware to register
     */ inlineQuery(trigger, ...middleware) {
        return this.filter(Context.has.inlineQuery(trigger), ...middleware);
    }
    /**
     * Registers middleware for the ChosenInlineResult by the given id or ids.
     * ChosenInlineResult represents a result of an inline query that was chosen
     * by the user and sent to their chat partner. Check out
     * https://core.telegram.org/bots/api#choseninlineresult to read more about
     * chosen inline results.
     *
     * ```ts
     * bot.chosenInlineResult('id', async ctx => {
     *   const id = ctx.result_id;
     *   // Your code
     * })
     * ```
     *
     * @param resultId An id or array of ids
     * @param middleware The middleware to register
     */ chosenInlineResult(resultId, ...middleware) {
        return this.filter(Context.has.chosenInlineResult(resultId), ...middleware);
    }
    /**
     * Registers middleware for pre-checkout queries. Telegram sends a
     * pre-checkout query to your bot whenever a user has confirmed their
     * payment and shipping details. You bot will then receive all information
     * about the order and has to respond within 10 seconds with a confirmation
     * of whether everything is alright (goods are available, etc.) and the bot
     * is ready to proceed with the order. Check out
     * https://core.telegram.org/bots/api#precheckoutquery to read more about
     * pre-checkout queries.
     *
     * ```ts
     * bot.preCheckoutQuery('invoice_payload', async ctx => {
     *   // Answer the pre-checkout query, confer https://core.telegram.org/bots/api#answerprecheckoutquery
     *   await ctx.answerPreCheckoutQuery( ... )
     * })
     * ```
     *
     * @param trigger The string to look for in the invoice payload
     * @param middleware The middleware to register
     */ preCheckoutQuery(trigger, ...middleware) {
        return this.filter(Context.has.preCheckoutQuery(trigger), ...middleware);
    }
    /**
     * Registers middleware for shipping queries. If you sent an invoice
     * requesting a shipping address and the parameter _is_flexible_ was
     * specified, Telegram will send a shipping query to your bot whenever a
     * user has confirmed their shipping details. You bot will then receive the
     * shipping information and can respond with a confirmation of whether
     * delivery to the specified address is possible. Check out
     * https://core.telegram.org/bots/api#shippingquery to read more about
     * shipping queries.
     *
     * ```ts
     * bot.shippingQuery('invoice_payload', async ctx => {
     *   // Answer the shipping query, confer https://core.telegram.org/bots/api#answershippingquery
     *   await ctx.answerShippingQuery( ... )
     * })
     * ```
     *
     * @param trigger The string to look for in the invoice payload
     * @param middleware The middleware to register
     */ shippingQuery(trigger, ...middleware) {
        return this.filter(Context.has.shippingQuery(trigger), ...middleware);
    }
    filter(predicate, ...middleware) {
        const composer = new Composer(...middleware);
        this.branch(predicate, composer, pass);
        return composer;
    }
    /**
     * > This is an advanced method of grammY.
     *
     * Registers middleware behind a custom filter function that operates on the
     * context object and decides whether or not to execute the middleware. In
     * other words, the middleware will only be executed if the given predicate
     * returns `false` for the given context object. Otherwise, it will be
     * skipped and the next middleware will be executed. Note that the predicate
     * may be asynchronous, i.e. it can return a Promise of a boolean.
     *
     * This method is the same using `filter` (normal usage) with a negated
     * predicate.
     *
     * @param predicate The predicate to check
     * @param middleware The middleware to register
     */ drop(predicate, ...middleware) {
        return this.filter(async (ctx)=>!await predicate(ctx), ...middleware);
    }
    /**
     * > This is an advanced method of grammY.
     *
     * Registers some middleware that runs concurrently to the executing
     * middleware stack.
     * ```ts
     * bot.use( ... ) // will run first
     * bot.fork( ... ) // will be started second, but run concurrently
     * bot.use( ... ) // will also be run second
     * ```
     * In the first middleware, as soon as `next`'s Promise resolves, both forks
     * have completed.
     *
     * Both the fork and the downstream middleware are awaited with
     * `Promise.all`, so you will only be to catch up to one error (the one that
     * is thrown first).
     *
     * In opposite to the other middleware methods on composer, `fork` does not
     * return simply return the composer connected to the main middleware stack.
     * Instead, it returns the created composer _of the fork_ connected to the
     * middleware stack. This allows for the following pattern.
     * ```ts
     * // Middleware will be run concurrently!
     * bot.fork().on('message', ctx => { ... })
     * ```
     *
     * @param middleware The middleware to run concurrently
     */ fork(...middleware) {
        const composer = new Composer(...middleware);
        const fork = flatten(composer);
        this.use((ctx, next)=>Promise.all([
                next(),
                run(fork, ctx)
            ]));
        return composer;
    }
    /**
     * > This is an advanced method of grammY.
     *
     * Executes some middleware that can be generated on the fly for each
     * context. Pass a factory function that creates some middleware (or a
     * middleware array even). The factory function will be called once per
     * context, and its result will be executed with the context object.
     * ```ts
     * // The middleware returned by `createMyMiddleware` will be used only once
     * bot.lazy(ctx => createMyMiddleware(ctx))
     * ```
     *
     * You may generate this middleware in an `async` fashion.
     *
     * You can decide to return an empty array (`[]`) if you don't want to run
     * any middleware for a given context object. This is equivalent to
     * returning an empty instance of `Composer`.
     *
     * @param middlewareFactory The factory function creating the middleware
     */ lazy(middlewareFactory) {
        return this.use(async (ctx, next)=>{
            const middleware = await middlewareFactory(ctx);
            const arr = Array.isArray(middleware) ? middleware : [
                middleware
            ];
            await flatten(new Composer(...arr))(ctx, next);
        });
    }
    /**
     * > This is an advanced method of grammY.
     *
     * _Not to be confused with the `router` plugin._
     *
     * This method is an alternative to the `router` plugin. It allows you to
     * branch between different middleware per context object. You can pass two
     * things to it:
     * 1. A routing function
     * 2. Different middleware identified by key
     *
     * The routing function decides based on the context object which middleware
     * to run. Each middleware is identified by a key, so the routing function
     * simply returns the key of that middleware.
     * ```ts
     * // Define different route handlers
     * const routeHandlers = {
     *   evenUpdates: (ctx: Context) => { ... }
     *   oddUpdates: (ctx: Context) => { ... }
     * }
     * // Decide for a context object which one to pick
     * const router = (ctx: Context) => ctx.update.update_id % 2 === 0
     *   ? 'evenUpdates'
     *   : 'oddUpdates'
     * // Route it!
     * bot.route(router, routeHandlers)
     * ```
     *
     * Optionally, you can pass a third option that is used as fallback
     * middleware if your route function returns `undefined`, or if the key
     * returned by your router has no middleware associated with it.
     *
     * This method may need less setup than first instantiating a `Router`, but
     * for more complex setups, having a `Router` may be more readable.
     *
     * @param router The routing function to use
     * @param routeHandlers Handlers for every route
     * @param fallback Optional fallback middleware if no route matches
     */ route(router, routeHandlers, fallback = pass) {
        return this.lazy(async (ctx)=>{
            const route = await router(ctx);
            return (route === undefined || !routeHandlers[route] ? fallback : routeHandlers[route]) ?? [];
        });
    }
    /**
     * > This is an advanced method of grammY.
     *
     * Allows you to branch between two cases for a given context object.
     *
     * This method takes a predicate function that is tested once per context
     * object. If it returns `true`, the first supplied middleware is executed.
     * If it returns `false`, the second supplied middleware is executed. Note
     * that the predicate may be asynchronous, i.e. it can return a Promise of a
     * boolean.
     *
     * @param predicate The predicate to check
     * @param trueMiddleware The middleware for the `true` case
     * @param falseMiddleware The middleware for the `false` case
     */ branch(predicate, trueMiddleware, falseMiddleware) {
        return this.lazy(async (ctx)=>await predicate(ctx) ? trueMiddleware : falseMiddleware);
    }
    /**
     * > This is an advanced function of grammY.
     *
     * Installs an error boundary that catches errors that happen only inside
     * the given middleware. This allows you to install custom error handlers
     * that protect some parts of your bot. Errors will not be able to bubble
     * out of this part of your middleware system, unless the supplied error
     * handler rethrows them, in which case the next surrounding error boundary
     * will catch the error.
     *
     * Example usage:
     * ```ts
     * function errHandler(err: BotError) {
     *   console.error('Error boundary caught error!', err)
     * }
     *
     * const safe =
     *   // All passed middleware will be protected by the error boundary.
     *   bot.errorBoundary(errHandler, middleware0, middleware1, middleware2)
     *
     * // Those will also be protected!
     * safe.on('message', middleware3)
     *
     * // No error from `middleware4` will reach the `errHandler` from above,
     * // as errors are suppressed.
     *
     * // do nothing on error (suppress error), and run outside middleware
     * const suppress = (_err: BotError, next: NextFunction) => { return next() }
     * safe.errorBoundary(suppress).on('edited_message', middleware4)
     * ```
     *
     * Check out the
     * [documentation](https://grammy.dev/guide/errors.html#error-boundaries) on
     * the website to learn more about error boundaries.
     *
     * @param errorHandler The error handler to use
     * @param middleware The middleware to protect
     */ errorBoundary(errorHandler, ...middleware) {
        const composer = new Composer(...middleware);
        const bound = flatten(composer);
        this.use(async (ctx, next)=>{
            let nextCalled = false;
            const cont = ()=>(nextCalled = true, Promise.resolve());
            try {
                await bound(ctx, cont);
            } catch (err) {
                nextCalled = false;
                await errorHandler(new BotError(err, ctx), cont);
            }
            if (nextCalled) await next();
        });
        return composer;
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vZGVuby5sYW5kL3gvZ3JhbW15QHYxLjI3LjAvY29tcG9zZXIudHMiXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHtcbiAgICB0eXBlIENhbGxiYWNrUXVlcnlDb250ZXh0LFxuICAgIHR5cGUgQ2hhdFR5cGVDb250ZXh0LFxuICAgIHR5cGUgQ2hvc2VuSW5saW5lUmVzdWx0Q29udGV4dCxcbiAgICB0eXBlIENvbW1hbmRDb250ZXh0LFxuICAgIENvbnRleHQsXG4gICAgdHlwZSBHYW1lUXVlcnlDb250ZXh0LFxuICAgIHR5cGUgSGVhcnNDb250ZXh0LFxuICAgIHR5cGUgSW5saW5lUXVlcnlDb250ZXh0LFxuICAgIHR5cGUgTWF5YmVBcnJheSxcbiAgICB0eXBlIFByZUNoZWNrb3V0UXVlcnlDb250ZXh0LFxuICAgIHR5cGUgUmVhY3Rpb25Db250ZXh0LFxuICAgIHR5cGUgU2hpcHBpbmdRdWVyeUNvbnRleHQsXG4gICAgdHlwZSBTdHJpbmdXaXRoQ29tbWFuZFN1Z2dlc3Rpb25zLFxufSBmcm9tIFwiLi9jb250ZXh0LnRzXCI7XG5pbXBvcnQgeyB0eXBlIEZpbHRlciwgdHlwZSBGaWx0ZXJRdWVyeSB9IGZyb20gXCIuL2ZpbHRlci50c1wiO1xuaW1wb3J0IHtcbiAgICB0eXBlIENoYXQsXG4gICAgdHlwZSBSZWFjdGlvblR5cGUsXG4gICAgdHlwZSBSZWFjdGlvblR5cGVFbW9qaSxcbn0gZnJvbSBcIi4vdHlwZXMudHNcIjtcblxudHlwZSBNYXliZVByb21pc2U8VD4gPSBUIHwgUHJvbWlzZTxUPjtcblxuLy8gPT09IE1pZGRsZXdhcmUgdHlwZXNcbi8qKlxuICogQSBmdW5jdGlvbiBvZiB0aGlzIHR5cGUgaXMgcGFzc2VkIGFzIHRoZSBzZWNvbmQgcGFyYW1ldGVyIHRvIGFsbCBtaWRkbGV3YXJlLlxuICogSW52b2tlIGl0IHRvIGNhbGwgdGhlIGRvd25zdHJlYW0gbWlkZGxld2FyZSBhbmQgcGFzcyBvbiB0aGUgY29udHJvbCBmbG93LlxuICpcbiAqIEluIG90aGVyIHdvcmRzLCBpZiB5b3VyIG1pZGRsZXdhcmUgaXMgZG9uZSBoYW5kbGluZyB0aGUgY29udGV4dCBvYmplY3QsIGFuZFxuICogb3RoZXIgbWlkZGxld2FyZSBzaG91bGQgdGFrZSBvdmVyLCB0aGlzIGZ1bmN0aW9uIHNob3VsZCBiZSBjYWxsZWQgYW5kXG4gKiBgYXdhaXRgZWQuXG4gKlxuICogT25jZSB0aGUgYFByb21pc2VgIHJldHVybmVkIGJ5IHRoaXMgZnVuY3Rpb24gcmVzb2x2ZXMsIHRoZSBkb3duc3RyZWFtXG4gKiBtaWRkbGV3YXJlIGlzIGRvbmUgZXhlY3V0aW5nLCBoZW5jZSByZXR1cm5pbmcgdGhlIGNvbnRyb2wuXG4gKi9cbmV4cG9ydCB0eXBlIE5leHRGdW5jdGlvbiA9ICgpID0+IFByb21pc2U8dm9pZD47XG5cbi8qKlxuICogTWlkZGxld2FyZSBpbiB0aGUgZm9ybSBvZiBhIGZ1bmN0aW9uLlxuICovXG5leHBvcnQgdHlwZSBNaWRkbGV3YXJlRm48QyBleHRlbmRzIENvbnRleHQgPSBDb250ZXh0PiA9IChcbiAgICBjdHg6IEMsXG4gICAgbmV4dDogTmV4dEZ1bmN0aW9uLFxuKSA9PiBNYXliZVByb21pc2U8dW5rbm93bj47XG4vKipcbiAqIE1pZGRsZXdhcmUgaW4gdGhlIGZvcm0gb2YgYSBjb250YWluZXIgZm9yIGEgZnVuY3Rpb24uXG4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgTWlkZGxld2FyZU9iajxDIGV4dGVuZHMgQ29udGV4dCA9IENvbnRleHQ+IHtcbiAgICAvKipcbiAgICAgKiBSZXR1cm5zIHRoZSBjb250YWluZWQgbWlkZGxld2FyZS5cbiAgICAgKi9cbiAgICBtaWRkbGV3YXJlOiAoKSA9PiBNaWRkbGV3YXJlRm48Qz47XG59XG4vKipcbiAqIE1pZGRsZXdhcmUgZm9yIGdyYW1tWSwgZWl0aGVyIGFzIGEgZnVuY3Rpb24gb3IgYXMgYSBjb250YWluZXIgZm9yIGEgZnVuY3Rpb24uXG4gKlxuICogU2ltcGx5IHB1dCwgbWlkZGxld2FyZSBpcyBqdXN0IGEgZmFuY3kgdGVybSBmb3IgYSBfbGlzdGVuZXJfLiBZb3UgY2FuXG4gKiByZWdpc3RlciBtaWRkbGV3YXJlIG9uIGEgYm90IHRvIGxpc3RlbiBmb3IgdXBkYXRlcy4gRXhhbXBsZTpcbiAqXG4gKiBgYGB0c1xuICogYm90Lm9uKCdtZXNzYWdlJywgY3R4ID0+IGN0eC5yZXBseSgnSSBnb3QgeW91ciBtZXNzYWdlIScpKVxuICogLy8gICAgICAgICAgICAgICAgfn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+XG4gKiAvLyAgICAgICAgICAgICAgICBeXG4gKiAvLyAgICAgICAgICAgICAgICB8XG4gKiAvLyAgICAgICAgICAgICAgIFRoaXMgaXMgbWlkZGxld2FyZSFcbiAqIGBgYFxuICpcbiAqIE1pZGRsZXdhcmUgcmVjZWl2ZXMgb25lIG9iamVjdCB0aGF0IHdlIGNhbGwgdGhlIF9jb250ZXh0IG9iamVjdF8uIFRoaXMgaXNcbiAqIGFub3RoZXIgZmFuY3kgdGVybSBmb3IgYSBzaW1wbGUgb2JqZWN0IHRoYXQgaG9sZHMgaW5mb3JtYXRpb24gYWJvdXQgdGhlXG4gKiB1cGRhdGUgeW91J3JlIHByb2Nlc3NpbmcuIEZvciBpbnN0YW5jZSwgdGhlIGNvbnRleHQgb2JqZWN0IGdpdmVzIHlvdSBhY2Nlc3NcbiAqIHRvIHRoZSBtZXNzYWdlIHRoYXQgd2FzIHNlbnQgdG8geW91ciBib3QgKGBjdHgubWVzc2FnZWApLCBpbmNsdWRpbmcgdGhlIHRleHRcbiAqIChvciBwaG90byBvciB3aGF0ZXZlciBtZXNzYWdlIHRoZSB1c2VyIGhhcyBzZW50KS4gVGhlIGNvbnRleHQgb2JqZWN0IGlzXG4gKiBjb21tb25seSBuYW1lZCBgY3R4YC5cbiAqXG4gKiBJdCBhbHNvIHByb3ZpZGVzIHlvdSB3aXRoIHRoZSBgY3R4LmFwaWAgb2JqZWN0IHRoYXQgeW91IGFsc28gZmluZCBvblxuICogYGJvdC5hcGlgLiBBcyBhIHJlc3VsdCwgeW91IGNhbiBjYWxsIGBjdHguYXBpLnNlbmRNZXNzYWdlYCBpbnN0ZWFkIG9mXG4gKiBgYm90LmFwaS5zZW5kTWVzc2FnZWAuIFRoaXMgcHJldmVudHMgeW91IGZyb20gaGF2aW5nIHRvIHBhc3MgYXJvdW5kIHlvdXJcbiAqIGBib3RgIGluc3RhbmNlIGFsbCBvdmVyIHlvdXIgY29kZS5cbiAqXG4gKiBNb3N0IGltcG9ydGFudGx5LCB0aGUgY29udGV4dCBvYmplY3QgZ2l2ZXMgeW91IGEgaGFuZGZ1bCBvZiByZWFsbHkgdXNlZnVsXG4gKiBzaG9ydGN1dHMsIHN1Y2ggYXMgYSBgcmVwbHlgIG1ldGhvZCAoc2VlIGFib3ZlKS4gVGhpcyBtZXRob2QgaXMgbm90aGluZyBlbHNlXG4gKiB0aGFuIGEgd3JhcHBlciBhcm91bmQgYGN0eC5hcGkuc2VuZE1lc3NhZ2Vg4oCUYnV0IHdpdGggc29tZSBhcmd1bWVudHNcbiAqIHByZS1maWxsZWQgZm9yIHlvdS4gQXMgeW91IGNhbiBzZWUgYWJvdmUsIHlvdSBubyBsb25nZXIgaGF2ZSB0byBzcGVjaWZ5IGFcbiAqIGBjaGF0X2lkYCBvciBhbnl0aGluZzsgdGhlIGNvbnRleHQgb2JqZWN0IGtub3dzIHdoaWNoIGNoYXQgaXQgYmVsb25ncyB0bywgc29cbiAqIHdoZW4geW91IGNhbGwgYHJlcGx5YCwgdGhlIGNvbnRleHQgd2lsbCBjYWxsIGBzZW5kTWVzc2FnZWAgd2l0aCB0aGUgY29ycmVjdFxuICogYGNoYXRfaWRgLCBuYW1lbHkgdGhlIG9uZSBmb3IgdGhlIHNhbWUgY2hhdCB0aGF0IHRoZSBpbmNvbWluZyBtZXNzYWdlXG4gKiBvcmlnaW5hdGVzIGZyb20uIFRoaXMgbWFrZXMgaXQgdmVyeSBjb252ZW5pZW50IHRvIHJlcGx5IHRvIGEgbWVzc2FnZS5cbiAqXG4gKiBNaWRkbGV3YXJlIGlzIGFuIGV4dHJlbWVseSBwb3dlcmZ1bCBjb25jZXB0IGFuZCB0aGlzIHNob3J0IGV4cGxhbmF0aW9uIG9ubHlcbiAqIHNjcmF0Y2hlZCB0aGUgc3VyZmFjZSBvZiB3aGF0IGlzIHBvc3NpYmxlIHdpdGggZ3JhbW1ZLiBJZiB5b3Ugd2FudCB0byBrbm93XG4gKiBtb3JlIGFkdmFuY2VkIHRoaW5ncyBhYm91dCBtaWRkbGV3YXJlLCBjaGVjayBvdXQgdGhlXG4gKiBbZG9jdW1lbnRhdGlvbl0oaHR0cHM6Ly9ncmFtbXkuZGV2L2d1aWRlL21pZGRsZXdhcmUuaHRtbCkgb24gdGhlIHdlYnNpdGUuXG4gKi9cbmV4cG9ydCB0eXBlIE1pZGRsZXdhcmU8QyBleHRlbmRzIENvbnRleHQgPSBDb250ZXh0PiA9XG4gICAgfCBNaWRkbGV3YXJlRm48Qz5cbiAgICB8IE1pZGRsZXdhcmVPYmo8Qz47XG5cbi8vID09PSBNaWRkbGV3YXJlIGVycm9yc1xuLyoqXG4gKiBUaGlzIGVycm9yIGlzIHRocm93biB3aGVuIG1pZGRsZXdhcmUgdGhyb3dzLiBJdCBzaW1wbHkgd3JhcHMgdGhlIG9yaWdpbmFsXG4gKiBlcnJvciAoYWNjZXNzaWJsZSB2aWEgdGhlIGBlcnJvcmAgcHJvcGVydHkpLCBidXQgYWxzbyBwcm92aWRlcyBhY2Nlc3MgdG8gdGhlXG4gKiByZXNwZWN0aXZlIGNvbnRleHQgb2JqZWN0IHRoYXQgd2FzIHByb2Nlc3NlZCB3aGlsZSB0aGUgZXJyb3Igb2NjdXJyZWQuXG4gKi9cbmV4cG9ydCBjbGFzcyBCb3RFcnJvcjxDIGV4dGVuZHMgQ29udGV4dCA9IENvbnRleHQ+IGV4dGVuZHMgRXJyb3Ige1xuICAgIGNvbnN0cnVjdG9yKHB1YmxpYyByZWFkb25seSBlcnJvcjogdW5rbm93biwgcHVibGljIHJlYWRvbmx5IGN0eDogQykge1xuICAgICAgICBzdXBlcihnZW5lcmF0ZUJvdEVycm9yTWVzc2FnZShlcnJvcikpO1xuICAgICAgICB0aGlzLm5hbWUgPSBcIkJvdEVycm9yXCI7XG4gICAgICAgIGlmIChlcnJvciBpbnN0YW5jZW9mIEVycm9yKSB0aGlzLnN0YWNrID0gZXJyb3Iuc3RhY2s7XG4gICAgfVxufVxuZnVuY3Rpb24gZ2VuZXJhdGVCb3RFcnJvck1lc3NhZ2UoZXJyb3I6IHVua25vd24pIHtcbiAgICBsZXQgbXNnOiBzdHJpbmc7XG4gICAgaWYgKGVycm9yIGluc3RhbmNlb2YgRXJyb3IpIHtcbiAgICAgICAgbXNnID0gYCR7ZXJyb3IubmFtZX0gaW4gbWlkZGxld2FyZTogJHtlcnJvci5tZXNzYWdlfWA7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgY29uc3QgdHlwZSA9IHR5cGVvZiBlcnJvcjtcbiAgICAgICAgbXNnID0gYE5vbi1lcnJvciB2YWx1ZSBvZiB0eXBlICR7dHlwZX0gdGhyb3duIGluIG1pZGRsZXdhcmVgO1xuICAgICAgICBzd2l0Y2ggKHR5cGUpIHtcbiAgICAgICAgICAgIGNhc2UgXCJiaWdpbnRcIjpcbiAgICAgICAgICAgIGNhc2UgXCJib29sZWFuXCI6XG4gICAgICAgICAgICBjYXNlIFwibnVtYmVyXCI6XG4gICAgICAgICAgICBjYXNlIFwic3ltYm9sXCI6XG4gICAgICAgICAgICAgICAgbXNnICs9IGA6ICR7ZXJyb3J9YDtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIGNhc2UgXCJzdHJpbmdcIjpcbiAgICAgICAgICAgICAgICBtc2cgKz0gYDogJHtTdHJpbmcoZXJyb3IpLnN1YnN0cmluZygwLCA1MCl9YDtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgICAgICAgbXNnICs9IFwiIVwiO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgfVxuICAgIHJldHVybiBtc2c7XG59XG5cbi8vID09PSBNaWRkbGV3YXJlIGJhc2UgZnVuY3Rpb25zXG5mdW5jdGlvbiBmbGF0dGVuPEMgZXh0ZW5kcyBDb250ZXh0PihtdzogTWlkZGxld2FyZTxDPik6IE1pZGRsZXdhcmVGbjxDPiB7XG4gICAgcmV0dXJuIHR5cGVvZiBtdyA9PT0gXCJmdW5jdGlvblwiXG4gICAgICAgID8gbXdcbiAgICAgICAgOiAoY3R4LCBuZXh0KSA9PiBtdy5taWRkbGV3YXJlKCkoY3R4LCBuZXh0KTtcbn1cbmZ1bmN0aW9uIGNvbmNhdDxDIGV4dGVuZHMgQ29udGV4dD4oXG4gICAgZmlyc3Q6IE1pZGRsZXdhcmVGbjxDPixcbiAgICBhbmRUaGVuOiBNaWRkbGV3YXJlRm48Qz4sXG4pOiBNaWRkbGV3YXJlRm48Qz4ge1xuICAgIHJldHVybiBhc3luYyAoY3R4LCBuZXh0KSA9PiB7XG4gICAgICAgIGxldCBuZXh0Q2FsbGVkID0gZmFsc2U7XG4gICAgICAgIGF3YWl0IGZpcnN0KGN0eCwgYXN5bmMgKCkgPT4ge1xuICAgICAgICAgICAgaWYgKG5leHRDYWxsZWQpIHRocm93IG5ldyBFcnJvcihcImBuZXh0YCBhbHJlYWR5IGNhbGxlZCBiZWZvcmUhXCIpO1xuICAgICAgICAgICAgZWxzZSBuZXh0Q2FsbGVkID0gdHJ1ZTtcbiAgICAgICAgICAgIGF3YWl0IGFuZFRoZW4oY3R4LCBuZXh0KTtcbiAgICAgICAgfSk7XG4gICAgfTtcbn1cbmZ1bmN0aW9uIHBhc3M8QyBleHRlbmRzIENvbnRleHQ+KF9jdHg6IEMsIG5leHQ6IE5leHRGdW5jdGlvbikge1xuICAgIHJldHVybiBuZXh0KCk7XG59XG5cbmNvbnN0IGxlYWY6IE5leHRGdW5jdGlvbiA9ICgpID0+IFByb21pc2UucmVzb2x2ZSgpO1xuLyoqXG4gKiBSdW5zIHNvbWUgZ2l2ZW4gbWlkZGxld2FyZSBmdW5jdGlvbiB3aXRoIGEgZ2l2ZW4gY29udGV4dCBvYmplY3QuXG4gKlxuICogQHBhcmFtIG1pZGRsZXdhcmUgVGhlIG1pZGRsZXdhcmUgdG8gcnVuXG4gKiBAcGFyYW0gY3R4IFRoZSBjb250ZXh0IHRvIHVzZVxuICovXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gcnVuPEMgZXh0ZW5kcyBDb250ZXh0PihcbiAgICBtaWRkbGV3YXJlOiBNaWRkbGV3YXJlRm48Qz4sXG4gICAgY3R4OiBDLFxuKSB7XG4gICAgYXdhaXQgbWlkZGxld2FyZShjdHgsIGxlYWYpO1xufVxuXG4vLyA9PT0gQ29tcG9zZXJcbi8qKlxuICogVGhlIGNvbXBvc2VyIGlzIHRoZSBoZWFydCBvZiB0aGUgbWlkZGxld2FyZSBzeXN0ZW0gaW4gZ3JhbW1ZLiBJdCBpcyBhbHNvIHRoZVxuICogc3VwZXJjbGFzcyBvZiBgQm90YC4gV2hlbmV2ZXIgeW91IGNhbGwgYHVzZWAgb3IgYG9uYCBvciBzb21lIG9mIHRoZSBvdGhlclxuICogbWV0aG9kcyBvbiB5b3VyIGJvdCwgeW91IGFyZSBpbiBmYWN0IHVzaW5nIHRoZSB1bmRlcmx5aW5nIGNvbXBvc2VyIGluc3RhbmNlXG4gKiB0byByZWdpc3RlciB5b3VyIG1pZGRsZXdhcmUuXG4gKlxuICogSWYgeW91J3JlIGp1c3QgZ2V0dGluZyBzdGFydGVkLCB5b3UgZG8gbm90IG5lZWQgdG8gd29ycnkgYWJvdXQgd2hhdFxuICogbWlkZGxld2FyZSBpcywgb3IgYWJvdXQgaG93IHRvIHVzZSBhIGNvbXBvc2VyLlxuICpcbiAqIE9uIHRoZSBvdGhlciBoYW5kLCBpZiB5b3Ugd2FudCB0byBkaWcgZGVlcGVyIGludG8gaG93IGdyYW1tWSBpbXBsZW1lbnRzXG4gKiBtaWRkbGV3YXJlLCBjaGVjayBvdXQgdGhlXG4gKiBbZG9jdW1lbnRhdGlvbl0oaHR0cHM6Ly9ncmFtbXkuZGV2L2FkdmFuY2VkL21pZGRsZXdhcmUuaHRtbCkgb24gdGhlIHdlYnNpdGUuXG4gKi9cbmV4cG9ydCBjbGFzcyBDb21wb3NlcjxDIGV4dGVuZHMgQ29udGV4dD4gaW1wbGVtZW50cyBNaWRkbGV3YXJlT2JqPEM+IHtcbiAgICBwcml2YXRlIGhhbmRsZXI6IE1pZGRsZXdhcmVGbjxDPjtcblxuICAgIC8qKlxuICAgICAqIENvbnN0cnVjdHMgYSBuZXcgY29tcG9zZXIgYmFzZWQgb24gdGhlIHByb3ZpZGVkIG1pZGRsZXdhcmUuIElmIG5vXG4gICAgICogbWlkZGxld2FyZSBpcyBnaXZlbiwgdGhlIGNvbXBvc2VyIGluc3RhbmNlIHdpbGwgc2ltcGx5IG1ha2UgYWxsIGNvbnRleHRcbiAgICAgKiBvYmplY3RzIHBhc3MgdGhyb3VnaCB3aXRob3V0IHRvdWNoaW5nIHRoZW0uXG4gICAgICpcbiAgICAgKiBAcGFyYW0gbWlkZGxld2FyZSBUaGUgbWlkZGxld2FyZSB0byBjb21wb3NlXG4gICAgICovXG4gICAgY29uc3RydWN0b3IoLi4ubWlkZGxld2FyZTogQXJyYXk8TWlkZGxld2FyZTxDPj4pIHtcbiAgICAgICAgdGhpcy5oYW5kbGVyID0gbWlkZGxld2FyZS5sZW5ndGggPT09IDBcbiAgICAgICAgICAgID8gcGFzc1xuICAgICAgICAgICAgOiBtaWRkbGV3YXJlLm1hcChmbGF0dGVuKS5yZWR1Y2UoY29uY2F0KTtcbiAgICB9XG5cbiAgICBtaWRkbGV3YXJlKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5oYW5kbGVyO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFJlZ2lzdGVycyBzb21lIG1pZGRsZXdhcmUgdGhhdCByZWNlaXZlcyBhbGwgdXBkYXRlcy4gSXQgaXMgaW5zdGFsbGVkIGJ5XG4gICAgICogY29uY2F0ZW5hdGluZyBpdCB0byB0aGUgZW5kIG9mIGFsbCBwcmV2aW91c2x5IGluc3RhbGxlZCBtaWRkbGV3YXJlLlxuICAgICAqXG4gICAgICogT2Z0ZW4sIHRoaXMgbWV0aG9kIGlzIHVzZWQgdG8gaW5zdGFsbCBtaWRkbGV3YXJlIHRoYXQgYmVoYXZlcyBsaWtlIGFcbiAgICAgKiBwbHVnaW4sIGZvciBleGFtcGxlIHNlc3Npb24gbWlkZGxld2FyZS5cbiAgICAgKiBgYGB0c1xuICAgICAqIGJvdC51c2Uoc2Vzc2lvbigpKVxuICAgICAqIGBgYFxuICAgICAqXG4gICAgICogVGhpcyBtZXRob2QgcmV0dXJucyBhIG5ldyBpbnN0YW5jZSBvZiBjb21wb3Nlci4gVGhlIHJldHVybmVkIGluc3RhbmNlIGNhblxuICAgICAqIGJlIGZ1cnRoZXIgZXh0ZW5kZWQsIGFuZCBhbGwgY2hhbmdlcyB3aWxsIGJlIHJlZ2FyZGVkIGhlcmUuIENvbmZlciB0aGVcbiAgICAgKiBbZG9jdW1lbnRhdGlvbl0oaHR0cHM6Ly9ncmFtbXkuZGV2L2FkdmFuY2VkL21pZGRsZXdhcmUuaHRtbCkgb24gdGhlXG4gICAgICogd2Vic2l0ZSBpZiB5b3Ugd2FudCB0byBrbm93IG1vcmUgYWJvdXQgaG93IHRoZSBtaWRkbGV3YXJlIHN5c3RlbSBpblxuICAgICAqIGdyYW1tWSB3b3JrcywgZXNwZWNpYWxseSB3aGVuIGl0IGNvbWVzIHRvIGNoYWluaW5nIHRoZSBtZXRob2QgY2FsbHNcbiAgICAgKiAoYHVzZSggLi4uICkudXNlKCAuLi4gKS51c2UoIC4uLiApYCkuXG4gICAgICpcbiAgICAgKiBAcGFyYW0gbWlkZGxld2FyZSBUaGUgbWlkZGxld2FyZSB0byByZWdpc3RlclxuICAgICAqL1xuICAgIHVzZSguLi5taWRkbGV3YXJlOiBBcnJheTxNaWRkbGV3YXJlPEM+Pikge1xuICAgICAgICBjb25zdCBjb21wb3NlciA9IG5ldyBDb21wb3NlciguLi5taWRkbGV3YXJlKTtcbiAgICAgICAgdGhpcy5oYW5kbGVyID0gY29uY2F0KHRoaXMuaGFuZGxlciwgZmxhdHRlbihjb21wb3NlcikpO1xuICAgICAgICByZXR1cm4gY29tcG9zZXI7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogUmVnaXN0ZXJzIHNvbWUgbWlkZGxld2FyZSB0aGF0IHdpbGwgb25seSBiZSBleGVjdXRlZCBmb3Igc29tZSBzcGVjaWZpY1xuICAgICAqIHVwZGF0ZXMsIG5hbWVseSB0aG9zZSBtYXRjaGluZyB0aGUgcHJvdmlkZWQgZmlsdGVyIHF1ZXJ5LiBGaWx0ZXIgcXVlcmllc1xuICAgICAqIGFyZSBhIGNvbmNpc2Ugd2F5IHRvIHNwZWNpZnkgd2hpY2ggdXBkYXRlcyB5b3UgYXJlIGludGVyZXN0ZWQgaW4uXG4gICAgICpcbiAgICAgKiBIZXJlIGFyZSBzb21lIGV4YW1wbGVzIG9mIHZhbGlkIGZpbHRlciBxdWVyaWVzOlxuICAgICAqIGBgYHRzXG4gICAgICogLy8gQWxsIGtpbmRzIG9mIG1lc3NhZ2UgdXBkYXRlc1xuICAgICAqIGJvdC5vbignbWVzc2FnZScsIGN0eCA9PiB7IC4uLiB9KVxuICAgICAqXG4gICAgICogLy8gT25seSB0ZXh0IG1lc3NhZ2VzXG4gICAgICogYm90Lm9uKCdtZXNzYWdlOnRleHQnLCBjdHggPT4geyAuLi4gfSlcbiAgICAgKlxuICAgICAqIC8vIE9ubHkgdGV4dCBtZXNzYWdlcyB3aXRoIFVSTFxuICAgICAqIGJvdC5vbignbWVzc2FnZTplbnRpdGllczp1cmwnLCBjdHggPT4geyAuLi4gfSlcbiAgICAgKlxuICAgICAqIC8vIFRleHQgbWVzc2FnZXMgYW5kIHRleHQgY2hhbm5lbCBwb3N0c1xuICAgICAqIGJvdC5vbignOnRleHQnLCBjdHggPT4geyAuLi4gfSlcbiAgICAgKlxuICAgICAqIC8vIE1lc3NhZ2VzIHdpdGggVVJMIGluIHRleHQgb3IgY2FwdGlvbiAoaS5lLiBlbnRpdGllcyBvciBjYXB0aW9uIGVudGl0aWVzKVxuICAgICAqIGJvdC5vbignbWVzc2FnZTo6dXJsJywgY3R4ID0+IHsgLi4uIH0pXG4gICAgICpcbiAgICAgKiAvLyBNZXNzYWdlcyBvciBjaGFubmVsIHBvc3RzIHdpdGggVVJMIGluIHRleHQgb3IgY2FwdGlvblxuICAgICAqIGJvdC5vbignOjp1cmwnLCBjdHggPT4geyAuLi4gfSlcbiAgICAgKiBgYGBcbiAgICAgKlxuICAgICAqIFlvdSBjYW4gdXNlIGF1dG9jb21wbGV0ZSBpbiBWUyBDb2RlIHRvIHNlZSBhbGwgYXZhaWxhYmxlIGZpbHRlciBxdWVyaWVzLlxuICAgICAqIENoZWNrIG91dCB0aGVcbiAgICAgKiBbZG9jdW1lbnRhdGlvbl0oaHR0cHM6Ly9ncmFtbXkuZGV2L2d1aWRlL2ZpbHRlci1xdWVyaWVzLmh0bWwpIG9uIHRoZVxuICAgICAqIHdlYnNpdGUgdG8gbGVhcm4gbW9yZSBhYm91dCBmaWx0ZXIgcXVlcmllcyBpbiBncmFtbVkuXG4gICAgICpcbiAgICAgKiBJdCBpcyBwb3NzaWJsZSB0byBwYXNzIG11bHRpcGxlIGZpbHRlciBxdWVyaWVzIGluIGFuIGFycmF5LCBpLmUuXG4gICAgICogYGBgdHNcbiAgICAgKiAvLyBNYXRjaGVzIGFsbCB0ZXh0IG1lc3NhZ2VzIGFuZCBlZGl0ZWQgdGV4dCBtZXNzYWdlcyB0aGF0IGNvbnRhaW4gYSBVUkxcbiAgICAgKiBib3Qub24oWydtZXNzYWdlOmVudGl0aWVzOnVybCcsICdlZGl0ZWRfbWVzc2FnZTplbnRpdGllczp1cmwnXSwgY3R4ID0+IHsgLi4uIH0pXG4gICAgICogYGBgXG4gICAgICpcbiAgICAgKiBZb3VyIG1pZGRsZXdhcmUgd2lsbCBiZSBleGVjdXRlZCBpZiBfYW55IG9mIHRoZSBwcm92aWRlZCBmaWx0ZXIgcXVlcmllc19cbiAgICAgKiBtYXRjaGVzIChsb2dpY2FsIE9SKS5cbiAgICAgKlxuICAgICAqIElmIHlvdSBpbnN0ZWFkIHdhbnQgdG8gbWF0Y2ggX2FsbCBvZiB0aGUgcHJvdmlkZWQgZmlsdGVyIHF1ZXJpZXNfXG4gICAgICogKGxvZ2ljYWwgQU5EKSwgeW91IGNhbiBjaGFpbiB0aGUgYC5vbmAgY2FsbHM6XG4gICAgICogYGBgdHNcbiAgICAgKiAvLyBNYXRjaGVzIGFsbCBtZXNzYWdlcyBhbmQgY2hhbm5lbCBwb3N0cyB0aGF0IGJvdGggYSkgY29udGFpbiBhIFVSTCBhbmQgYikgYXJlIGZvcndhcmRzXG4gICAgICogYm90Lm9uKCc6OnVybCcpLm9uKCc6Zm9yd2FyZF9vcmlnaW4nLCBjdHggPT4geyAuLi4gfSlcbiAgICAgKiBgYGBcbiAgICAgKlxuICAgICAqIEBwYXJhbSBmaWx0ZXIgVGhlIGZpbHRlciBxdWVyeSB0byB1c2UsIG1heSBhbHNvIGJlIGFuIGFycmF5IG9mIHF1ZXJpZXNcbiAgICAgKiBAcGFyYW0gbWlkZGxld2FyZSBUaGUgbWlkZGxld2FyZSB0byByZWdpc3RlciBiZWhpbmQgdGhlIGdpdmVuIGZpbHRlclxuICAgICAqL1xuICAgIG9uPFEgZXh0ZW5kcyBGaWx0ZXJRdWVyeT4oXG4gICAgICAgIGZpbHRlcjogUSB8IFFbXSxcbiAgICAgICAgLi4ubWlkZGxld2FyZTogQXJyYXk8TWlkZGxld2FyZTxGaWx0ZXI8QywgUT4+PlxuICAgICk6IENvbXBvc2VyPEZpbHRlcjxDLCBRPj4ge1xuICAgICAgICByZXR1cm4gdGhpcy5maWx0ZXIoQ29udGV4dC5oYXMuZmlsdGVyUXVlcnkoZmlsdGVyKSwgLi4ubWlkZGxld2FyZSk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogUmVnaXN0ZXJzIHNvbWUgbWlkZGxld2FyZSB0aGF0IHdpbGwgb25seSBiZSBleGVjdXRlZCB3aGVuIHRoZSBtZXNzYWdlXG4gICAgICogY29udGFpbnMgc29tZSB0ZXh0LiBJcyBpdCBwb3NzaWJsZSB0byBwYXNzIGEgcmVndWxhciBleHByZXNzaW9uIHRvIG1hdGNoOlxuICAgICAqIGBgYHRzXG4gICAgICogLy8gTWF0Y2ggc29tZSB0ZXh0IChleGFjdCBtYXRjaClcbiAgICAgKiBib3QuaGVhcnMoJ0kgbG92ZSBncmFtbVknLCBjdHggPT4gY3R4LnJlcGx5KCdBbmQgZ3JhbW1ZIGxvdmVzIHlvdSEgPDMnKSlcbiAgICAgKiAvLyBNYXRjaCBhIHJlZ3VsYXIgZXhwcmVzc2lvblxuICAgICAqIGJvdC5oZWFycygvXFwvZWNobyAoLispLywgY3R4ID0+IGN0eC5yZXBseShjdHgubWF0Y2hbMV0pKVxuICAgICAqIGBgYFxuICAgICAqIE5vdGUgaG93IGBjdHgubWF0Y2hgIHdpbGwgY29udGFpbiB0aGUgcmVzdWx0IG9mIHRoZSByZWd1bGFyIGV4cHJlc3Npb24uXG4gICAgICogSGVyZSBpdCBpcyBhIGBSZWdFeHBNYXRjaEFycmF5YCBvYmplY3QsIHNvIGBjdHgubWF0Y2hbMV1gIHJlZmVycyB0byB0aGVcbiAgICAgKiBwYXJ0IG9mIHRoZSByZWdleCB0aGF0IHdhcyBtYXRjaGVkIGJ5IGAoLispYCwgaS5lLiB0aGUgdGV4dCB0aGF0IGNvbWVzXG4gICAgICogYWZ0ZXIg4oCcL2VjaG/igJ0uXG4gICAgICpcbiAgICAgKiBZb3UgY2FuIHBhc3MgYW4gYXJyYXkgb2YgdHJpZ2dlcnMuIFlvdXIgbWlkZGxld2FyZSB3aWxsIGJlIGV4ZWN1dGVkIGlmIGF0XG4gICAgICogbGVhc3Qgb25lIG9mIHRoZW0gbWF0Y2hlcy5cbiAgICAgKlxuICAgICAqIEJvdGggdGV4dCBhbmQgY2FwdGlvbnMgb2YgdGhlIHJlY2VpdmVkIG1lc3NhZ2VzIHdpbGwgYmUgc2Nhbm5lZC4gRm9yXG4gICAgICogZXhhbXBsZSwgd2hlbiBhIHBob3RvIGlzIHNlbnQgdG8gdGhlIGNoYXQgYW5kIGl0cyBjYXB0aW9uIG1hdGNoZXMgdGhlXG4gICAgICogdHJpZ2dlciwgeW91ciBtaWRkbGV3YXJlIHdpbGwgYmUgZXhlY3V0ZWQuXG4gICAgICpcbiAgICAgKiBJZiB5b3Ugb25seSB3YW50IHRvIG1hdGNoIHRleHQgbWVzc2FnZXMgYW5kIG5vdCBjYXB0aW9ucywgeW91IGNhbiBkb1xuICAgICAqIHRoaXM6XG4gICAgICogYGBgdHNcbiAgICAgKiAvLyBPbmx5IG1hdGNoZXMgdGV4dCBtZXNzYWdlcyAoYW5kIGNoYW5uZWwgcG9zdHMpIGZvciB0aGUgcmVnZXhcbiAgICAgKiBib3Qub24oJzp0ZXh0JykuaGVhcnMoL1xcL2VjaG8gKC4rKS8sIGN0eCA9PiB7IC4uLiB9KVxuICAgICAqIGBgYFxuICAgICAqXG4gICAgICogQHBhcmFtIHRyaWdnZXIgVGhlIHRleHQgdG8gbG9vayBmb3JcbiAgICAgKiBAcGFyYW0gbWlkZGxld2FyZSBUaGUgbWlkZGxld2FyZSB0byByZWdpc3RlclxuICAgICAqL1xuICAgIGhlYXJzKFxuICAgICAgICB0cmlnZ2VyOiBNYXliZUFycmF5PHN0cmluZyB8IFJlZ0V4cD4sXG4gICAgICAgIC4uLm1pZGRsZXdhcmU6IEFycmF5PEhlYXJzTWlkZGxld2FyZTxDPj5cbiAgICApOiBDb21wb3NlcjxIZWFyc0NvbnRleHQ8Qz4+IHtcbiAgICAgICAgcmV0dXJuIHRoaXMuZmlsdGVyKENvbnRleHQuaGFzLnRleHQodHJpZ2dlciksIC4uLm1pZGRsZXdhcmUpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFJlZ2lzdGVycyBzb21lIG1pZGRsZXdhcmUgdGhhdCB3aWxsIG9ubHkgYmUgZXhlY3V0ZWQgd2hlbiBhIGNlcnRhaW5cbiAgICAgKiBjb21tYW5kIGlzIGZvdW5kLlxuICAgICAqIGBgYHRzXG4gICAgICogLy8gUmVhY3RzIHRvIC9zdGFydCBjb21tYW5kc1xuICAgICAqIGJvdC5jb21tYW5kKCdzdGFydCcsIGN0eCA9PiB7IC4uLiB9KVxuICAgICAqIC8vIFJlYWN0cyB0byAvaGVscCBjb21tYW5kc1xuICAgICAqIGJvdC5jb21tYW5kKCdoZWxwJywgY3R4ID0+IHsgLi4uIH0pXG4gICAgICogYGBgXG4gICAgICpcbiAgICAgKiBUaGUgcmVzdCBvZiB0aGUgbWVzc2FnZSAoZXhjbHVkaW5nIHRoZSBjb21tYW5kLCBhbmQgdHJpbW1lZCkgaXMgcHJvdmlkZWRcbiAgICAgKiB2aWEgYGN0eC5tYXRjaGAuXG4gICAgICpcbiAgICAgKiA+ICoqRGlkIHlvdSBrbm93PyoqIFlvdSBjYW4gdXNlIGRlZXAgbGlua2luZ1xuICAgICAqID4gKGh0dHBzOi8vY29yZS50ZWxlZ3JhbS5vcmcvYm90cy9mZWF0dXJlcyNkZWVwLWxpbmtpbmcpIHRvIGxldCB1c2Vyc1xuICAgICAqID4gc3RhcnQgeW91ciBib3Qgd2l0aCBhIGN1c3RvbSBwYXlsb2FkLiBBcyBhbiBleGFtcGxlLCBzZW5kIHNvbWVvbmUgdGhlXG4gICAgICogPiBsaW5rIGh0dHBzOi8vdC5tZS9uYW1lLW9mLXlvdXItYm90P3N0YXJ0PWN1c3RvbS1wYXlsb2FkIGFuZCByZWdpc3RlciBhXG4gICAgICogPiBzdGFydCBjb21tYW5kIGhhbmRsZXIgb24geW91ciBib3Qgd2l0aCBncmFtbVkuIEFzIHNvb24gYXMgdGhlIHVzZXJcbiAgICAgKiA+IHN0YXJ0cyB5b3VyIGJvdCwgeW91IHdpbGwgcmVjZWl2ZSBgY3VzdG9tLXBheWxvYWRgIGluIHRoZSBgY3R4Lm1hdGNoYFxuICAgICAqID4gcHJvcGVydHkhXG4gICAgICogPiBgYGB0c1xuICAgICAqID4gYm90LmNvbW1hbmQoJ3N0YXJ0JywgY3R4ID0+IHtcbiAgICAgKiA+ICAgY29uc3QgcGF5bG9hZCA9IGN0eC5tYXRjaCAvLyB3aWxsIGJlICdjdXN0b20tcGF5bG9hZCdcbiAgICAgKiA+IH0pXG4gICAgICogPiBgYGBcbiAgICAgKlxuICAgICAqIE5vdGUgdGhhdCBjb21tYW5kcyBhcmUgbm90IG1hdGNoZWQgaW4gY2FwdGlvbnMgb3IgaW4gdGhlIG1pZGRsZSBvZiB0aGVcbiAgICAgKiB0ZXh0LlxuICAgICAqIGBgYHRzXG4gICAgICogYm90LmNvbW1hbmQoJ3N0YXJ0JywgY3R4ID0+IHsgLi4uIH0pXG4gICAgICogLy8gLi4uIGRvZXMgbm90IG1hdGNoOlxuICAgICAqIC8vIEEgbWVzc2FnZSBzYXlpbmc6IOKAnHNvbWUgdGV4dCAvc3RhcnQgc29tZSBtb3JlIHRleHTigJ1cbiAgICAgKiAvLyBBIHBob3RvIG1lc3NhZ2Ugd2l0aCB0aGUgY2FwdGlvbiDigJwvc3RhcnTigJ1cbiAgICAgKiBgYGBcbiAgICAgKlxuICAgICAqIEJ5IGRlZmF1bHQsIGNvbW1hbmRzIGFyZSBkZXRlY3RlZCBpbiBjaGFubmVsIHBvc3RzLCB0b28uIFRoaXMgbWVhbnMgdGhhdFxuICAgICAqIGBjdHgubWVzc2FnZWAgaXMgcG90ZW50aWFsbHkgYHVuZGVmaW5lZGAsIHNvIHlvdSBzaG91bGQgdXNlIGBjdHgubXNnYFxuICAgICAqIGluc3RlYWQgdG8gZ3JhYiBib3RoIG1lc3NhZ2VzIGFuZCBjaGFubmVsIHBvc3RzLiBBbHRlcm5hdGl2ZWx5LCBpZiB5b3VcbiAgICAgKiB3YW50IHRvIGxpbWl0IHlvdXIgYm90IHRvIGZpbmRpbmcgY29tbWFuZHMgb25seSBpbiBwcml2YXRlIGFuZCBncm91cFxuICAgICAqIGNoYXRzLCB5b3UgY2FuIHVzZSBgYm90Lm9uKCdtZXNzYWdlJykuY29tbWFuZCgnc3RhcnQnLCBjdHggPT4geyAuLi4gfSlgLFxuICAgICAqIG9yIGV2ZW4gc3RvcmUgYSBtZXNzYWdlLW9ubHkgdmVyc2lvbiBvZiB5b3VyIGJvdCBpbiBhIHZhcmlhYmxlIGxpa2Ugc286XG4gICAgICogYGBgdHNcbiAgICAgKiBjb25zdCBtID0gYm90Lm9uKCdtZXNzYWdlJylcbiAgICAgKlxuICAgICAqIG0uY29tbWFuZCgnc3RhcnQnLCBjdHggPT4geyAuLi4gfSlcbiAgICAgKiBtLmNvbW1hbmQoJ2hlbHAnLCBjdHggPT4geyAuLi4gfSlcbiAgICAgKiAvLyBldGNcbiAgICAgKiBgYGBcbiAgICAgKlxuICAgICAqIElmIHlvdSBuZWVkIG1vcmUgZnJlZWRvbSBtYXRjaGluZyB5b3VyIGNvbW1hbmRzLCBjaGVjayBvdXQgdGhlIGBjb21tYW5kc2BcbiAgICAgKiBwbHVnaW4uXG4gICAgICpcbiAgICAgKiBAcGFyYW0gY29tbWFuZCBUaGUgY29tbWFuZCB0byBsb29rIGZvclxuICAgICAqIEBwYXJhbSBtaWRkbGV3YXJlIFRoZSBtaWRkbGV3YXJlIHRvIHJlZ2lzdGVyXG4gICAgICovXG4gICAgY29tbWFuZChcbiAgICAgICAgY29tbWFuZDogTWF5YmVBcnJheTxTdHJpbmdXaXRoQ29tbWFuZFN1Z2dlc3Rpb25zPixcbiAgICAgICAgLi4ubWlkZGxld2FyZTogQXJyYXk8Q29tbWFuZE1pZGRsZXdhcmU8Qz4+XG4gICAgKTogQ29tcG9zZXI8Q29tbWFuZENvbnRleHQ8Qz4+IHtcbiAgICAgICAgcmV0dXJuIHRoaXMuZmlsdGVyKENvbnRleHQuaGFzLmNvbW1hbmQoY29tbWFuZCksIC4uLm1pZGRsZXdhcmUpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFJlZ2lzdGVycyBzb21lIG1pZGRsZXdhcmUgdGhhdCB3aWxsIG9ubHkgYmUgYWRkZWQgd2hlbiBhIG5ldyByZWFjdGlvbiBvZlxuICAgICAqIHRoZSBnaXZlbiB0eXBlIGlzIGFkZGVkIHRvIGEgbWVzc2FnZS5cbiAgICAgKiBgYGB0c1xuICAgICAqIC8vIFJlYWN0cyB0byBuZXcgJ/CfkY0nIHJlYWN0aW9uc1xuICAgICAqIGJvdC5yZWFjdGlvbign8J+RjScsIGN0eCA9PiB7IC4uLiB9KVxuICAgICAqIC8vIFJlYWN0cyB0byBuZXcgJ/CfkY0nIG9yICfwn5GOJyByZWFjdGlvbnNcbiAgICAgKiBib3QucmVhY3Rpb24oWyfwn5GNJywgJ/CfkY4nXSwgY3R4ID0+IHsgLi4uIH0pXG4gICAgICogYGBgXG4gICAgICpcbiAgICAgKiA+IE5vdGUgdGhhdCB5b3UgaGF2ZSB0byBlbmFibGUgYG1lc3NhZ2VfcmVhY3Rpb25gIHVwZGF0ZXMgaW5cbiAgICAgKiBgYWxsb3dlZF91cGRhdGVzYCBpZiB5b3Ugd2FudCB5b3VyIGJvdCB0byByZWNlaXZlIHVwZGF0ZXMgYWJvdXQgbWVzc2FnZVxuICAgICAqIHJlYWN0aW9ucy5cbiAgICAgKlxuICAgICAqIGBib3QucmVhY3Rpb25gIHdpbGwgdHJpZ2dlciBpZjpcbiAgICAgKiAtIGEgbmV3IGVtb2ppIHJlYWN0aW9uIGlzIGFkZGVkIHRvIGEgbWVzc2FnZVxuICAgICAqIC0gYSBuZXcgY3VzdG9tIGVtb2ppIHJlYWN0aW9uIGlzIGFkZGVkIGEgbWVzc2FnZVxuICAgICAqXG4gICAgICogYGJvdC5yZWFjdGlvbmAgd2lsbCBub3QgdHJpZ2dlciBpZjpcbiAgICAgKiAtIGEgcmVhY3Rpb24gaXMgcmVtb3ZlZFxuICAgICAqIC0gYW4gYW5vbnltb3VzIHJlYWN0aW9uIGNvdW50IGlzIHVwZGF0ZWQsIHN1Y2ggYXMgb24gY2hhbm5lbCBwb3N0c1xuICAgICAqIC0gYG1lc3NhZ2VfcmVhY3Rpb25gIHVwZGF0ZXMgYXJlIG5vdCBlbmFibGVkIGZvciB5b3VyIGJvdFxuICAgICAqXG4gICAgICogQHBhcmFtIHJlYWN0aW9uIFRoZSByZWFjdGlvbiB0byBsb29rIGZvclxuICAgICAqIEBwYXJhbSBtaWRkbGV3YXJlIFRoZSBtaWRkbGV3YXJlIHRvIHJlZ2lzdGVyXG4gICAgICovXG4gICAgcmVhY3Rpb24oXG4gICAgICAgIHJlYWN0aW9uOiBNYXliZUFycmF5PFJlYWN0aW9uVHlwZUVtb2ppW1wiZW1vamlcIl0gfCBSZWFjdGlvblR5cGU+LFxuICAgICAgICAuLi5taWRkbGV3YXJlOiBBcnJheTxSZWFjdGlvbk1pZGRsZXdhcmU8Qz4+XG4gICAgKTogQ29tcG9zZXI8UmVhY3Rpb25Db250ZXh0PEM+PiB7XG4gICAgICAgIHJldHVybiB0aGlzLmZpbHRlcihDb250ZXh0Lmhhcy5yZWFjdGlvbihyZWFjdGlvbiksIC4uLm1pZGRsZXdhcmUpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFJlZ2lzdGVycyBzb21lIG1pZGRsZXdhcmUgZm9yIGNlcnRhaW4gY2hhdCB0eXBlcyBvbmx5LiBGb3IgZXhhbXBsZSwgeW91XG4gICAgICogY2FuIHVzZSB0aGlzIG1ldGhvZCB0byBvbmx5IHJlY2VpdmUgdXBkYXRlcyBmcm9tIHByaXZhdGUgY2hhdHMuIFRoZSBmb3VyXG4gICAgICogY2hhdCB0eXBlcyBhcmUgYFwiY2hhbm5lbFwiYCwgYFwic3VwZXJncm91cFwiYCwgYFwiZ3JvdXBcImAsIGFuZCBgXCJwcml2YXRlXCJgLlxuICAgICAqIFRoaXMgaXMgZXNwZWNpYWxseSB1c2VmdWwgd2hlbiBjb21iaW5lZCB3aXRoIG90aGVyIGZpbHRlcmluZyBsb2dpYy4gRm9yXG4gICAgICogZXhhbXBsZSwgdGhpcyBpcyBob3cgY2FuIHlvdSByZXNwb25kIHRvIGAvc3RhcnRgIGNvbW1hbmRzIG9ubHkgZnJvbVxuICAgICAqIHByaXZhdGUgY2hhdHM6XG4gICAgICogYGBgdHNcbiAgICAgKiBib3QuY2hhdFR5cGUoXCJwcml2YXRlXCIpLmNvbW1hbmQoXCJzdGFydFwiLCBjdHggPT4geyAuLi4gfSlcbiAgICAgKiBgYGBcbiAgICAgKlxuICAgICAqIE5hdHVyYWxseSwgeW91IGNhbiBhbHNvIHVzZSB0aGlzIG1ldGhvZCBvbiBpdHMgb3duLlxuICAgICAqIGBgYHRzXG4gICAgICogLy8gUHJpdmF0ZSBjaGF0cyBvbmx5XG4gICAgICogYm90LmNoYXRUeXBlKFwicHJpdmF0ZVwiLCBjdHggPT4geyAuLi4gfSk7XG4gICAgICogLy8gQ2hhbm5lbHMgb25seVxuICAgICAqIGJvdC5jaGF0VHlwZShcImNoYW5uZWxcIiwgY3R4ID0+IHsgLi4uIH0pO1xuICAgICAqIGBgYFxuICAgICAqXG4gICAgICogWW91IGNhbiBwYXNzIGFuIGFycmF5IG9mIGNoYXQgdHlwZXMgaWYgeW91IHdhbnQgeW91ciBtaWRkbGV3YXJlIHRvIHJ1blxuICAgICAqIGZvciBhbnkgb2Ygc2V2ZXJhbCBwcm92aWRlZCBjaGF0IHR5cGVzLlxuICAgICAqIGBgYHRzXG4gICAgICogLy8gR3JvdXBzIGFuZCBzdXBlcmdyb3VwcyBvbmx5XG4gICAgICogYm90LmNoYXRUeXBlKFtcImdyb3VwXCIsIFwic3VwZXJncm91cFwiXSwgY3R4ID0+IHsgLi4uIH0pO1xuICAgICAqIGBgYFxuICAgICAqIFtSZW1lbWJlcl0oaHR0cHM6Ly9ncmFtbXkuZGV2L2d1aWRlL2NvbnRleHQuaHRtbCNzaG9ydGN1dHMpIGFsc28gdGhhdCB5b3VcbiAgICAgKiBjYW4gYWNjZXNzIHRoZSBjaGF0IHR5cGUgdmlhIGBjdHguY2hhdC50eXBlYC5cbiAgICAgKlxuICAgICAqIEBwYXJhbSBjaGF0VHlwZSBUaGUgY2hhdCB0eXBlXG4gICAgICogQHBhcmFtIG1pZGRsZXdhcmUgVGhlIG1pZGRsZXdhcmUgdG8gcmVnaXN0ZXJcbiAgICAgKi9cbiAgICBjaGF0VHlwZTxUIGV4dGVuZHMgQ2hhdFtcInR5cGVcIl0+KFxuICAgICAgICBjaGF0VHlwZTogTWF5YmVBcnJheTxUPixcbiAgICAgICAgLi4ubWlkZGxld2FyZTogQXJyYXk8TWlkZGxld2FyZTxDaGF0VHlwZUNvbnRleHQ8QywgVD4+PlxuICAgICk6IENvbXBvc2VyPENoYXRUeXBlQ29udGV4dDxDLCBUPj4ge1xuICAgICAgICByZXR1cm4gdGhpcy5maWx0ZXIoQ29udGV4dC5oYXMuY2hhdFR5cGUoY2hhdFR5cGUpLCAuLi5taWRkbGV3YXJlKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBSZWdpc3RlcnMgc29tZSBtaWRkbGV3YXJlIGZvciBjYWxsYmFjayBxdWVyaWVzLCBpLmUuIHRoZSB1cGRhdGVzIHRoYXRcbiAgICAgKiBUZWxlZ3JhbSBkZWxpdmVycyB0byB5b3VyIGJvdCB3aGVuIGEgdXNlciBjbGlja3MgYW4gaW5saW5lIGJ1dHRvbiAodGhhdFxuICAgICAqIGlzIGEgYnV0dG9uIHVuZGVyIGEgbWVzc2FnZSkuXG4gICAgICpcbiAgICAgKiBUaGlzIG1ldGhvZCBpcyBlc3NlbnRpYWxseSB0aGUgc2FtZSBhcyBjYWxsaW5nXG4gICAgICogYGBgdHNcbiAgICAgKiBib3Qub24oJ2NhbGxiYWNrX3F1ZXJ5OmRhdGEnLCBjdHggPT4geyAuLi4gfSlcbiAgICAgKiBgYGBcbiAgICAgKiBidXQgaXQgYWxzbyBhbGxvd3MgeW91IHRvIG1hdGNoIHRoZSBxdWVyeSBkYXRhIGFnYWluc3QgYSBnaXZlbiB0ZXh0IG9yXG4gICAgICogcmVndWxhciBleHByZXNzaW9uLlxuICAgICAqXG4gICAgICogYGBgdHNcbiAgICAgKiAvLyBDcmVhdGUgYW4gaW5saW5lIGtleWJvYXJkXG4gICAgICogY29uc3Qga2V5Ym9hcmQgPSBuZXcgSW5saW5lS2V5Ym9hcmQoKS50ZXh0KCdHbyEnLCAnYnV0dG9uLXBheWxvYWQnKVxuICAgICAqIC8vIFNlbmQgYSBtZXNzYWdlIHdpdGggdGhlIGtleWJvYXJkXG4gICAgICogYXdhaXQgYm90LmFwaS5zZW5kTWVzc2FnZShjaGF0X2lkLCAnUHJlc3MgYSBidXR0b24hJywge1xuICAgICAqICAgcmVwbHlfbWFya3VwOiBrZXlib2FyZFxuICAgICAqIH0pXG4gICAgICogLy8gTGlzdGVuIHRvIHVzZXJzIHByZXNzaW5nIGJ1dHRvbnMgd2l0aCB0aGF0IHNwZWNpZmljIHBheWxvYWRcbiAgICAgKiBib3QuY2FsbGJhY2tRdWVyeSgnYnV0dG9uLXBheWxvYWQnLCBjdHggPT4geyAuLi4gfSlcbiAgICAgKlxuICAgICAqIC8vIExpc3RlbiB0byB1c2VycyBwcmVzc2luZyBhbnkgYnV0dG9uIHlvdXIgYm90IGV2ZXIgc2VudFxuICAgICAqIGJvdC5vbignY2FsbGJhY2tfcXVlcnk6ZGF0YScsIGN0eCA9PiB7IC4uLiB9KVxuICAgICAqIGBgYFxuICAgICAqXG4gICAgICogQWx3YXlzIHJlbWVtYmVyIHRvIGNhbGwgYGFuc3dlckNhbGxiYWNrUXVlcnlg4oCUZXZlbiBpZiB5b3UgZG9uJ3QgcGVyZm9ybVxuICAgICAqIGFueSBhY3Rpb246IGh0dHBzOi8vY29yZS50ZWxlZ3JhbS5vcmcvYm90cy9hcGkjYW5zd2VyY2FsbGJhY2txdWVyeVxuICAgICAqIGBgYHRzXG4gICAgICogYm90Lm9uKCdjYWxsYmFja19xdWVyeTpkYXRhJywgYXN5bmMgY3R4ID0+IHtcbiAgICAgKiAgIGF3YWl0IGN0eC5hbnN3ZXJDYWxsYmFja1F1ZXJ5KClcbiAgICAgKiB9KVxuICAgICAqIGBgYFxuICAgICAqXG4gICAgICogWW91IGNhbiBwYXNzIGFuIGFycmF5IG9mIHRyaWdnZXJzLiBZb3VyIG1pZGRsZXdhcmUgd2lsbCBiZSBleGVjdXRlZCBpZiBhdFxuICAgICAqIGxlYXN0IG9uZSBvZiB0aGVtIG1hdGNoZXMuXG4gICAgICpcbiAgICAgKiBAcGFyYW0gdHJpZ2dlciBUaGUgc3RyaW5nIHRvIGxvb2sgZm9yIGluIHRoZSBwYXlsb2FkXG4gICAgICogQHBhcmFtIG1pZGRsZXdhcmUgVGhlIG1pZGRsZXdhcmUgdG8gcmVnaXN0ZXJcbiAgICAgKi9cbiAgICBjYWxsYmFja1F1ZXJ5KFxuICAgICAgICB0cmlnZ2VyOiBNYXliZUFycmF5PHN0cmluZyB8IFJlZ0V4cD4sXG4gICAgICAgIC4uLm1pZGRsZXdhcmU6IEFycmF5PENhbGxiYWNrUXVlcnlNaWRkbGV3YXJlPEM+PlxuICAgICk6IENvbXBvc2VyPENhbGxiYWNrUXVlcnlDb250ZXh0PEM+PiB7XG4gICAgICAgIHJldHVybiB0aGlzLmZpbHRlcihDb250ZXh0Lmhhcy5jYWxsYmFja1F1ZXJ5KHRyaWdnZXIpLCAuLi5taWRkbGV3YXJlKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBSZWdpc3RlcnMgc29tZSBtaWRkbGV3YXJlIGZvciBnYW1lIHF1ZXJpZXMsIGkuZS4gdGhlIHVwZGF0ZXMgdGhhdFxuICAgICAqIFRlbGVncmFtIGRlbGl2ZXJzIHRvIHlvdXIgYm90IHdoZW4gYSB1c2VyIGNsaWNrcyBhbiBpbmxpbmUgYnV0dG9uIGZvciB0aGVcbiAgICAgKiBIVE1MNSBnYW1lcyBwbGF0Zm9ybSBvbiBUZWxlZ3JhbS5cbiAgICAgKlxuICAgICAqIFRoaXMgbWV0aG9kIGlzIGVzc2VudGlhbGx5IHRoZSBzYW1lIGFzIGNhbGxpbmdcbiAgICAgKiBgYGB0c1xuICAgICAqIGJvdC5vbignY2FsbGJhY2tfcXVlcnk6Z2FtZV9zaG9ydF9uYW1lJywgY3R4ID0+IHsgLi4uIH0pXG4gICAgICogYGBgXG4gICAgICogYnV0IGl0IGFsc28gYWxsb3dzIHlvdSB0byBtYXRjaCB0aGUgcXVlcnkgZGF0YSBhZ2FpbnN0IGEgZ2l2ZW4gdGV4dCBvclxuICAgICAqIHJlZ3VsYXIgZXhwcmVzc2lvbi5cbiAgICAgKlxuICAgICAqIFlvdSBjYW4gcGFzcyBhbiBhcnJheSBvZiB0cmlnZ2Vycy4gWW91ciBtaWRkbGV3YXJlIHdpbGwgYmUgZXhlY3V0ZWQgaWYgYXRcbiAgICAgKiBsZWFzdCBvbmUgb2YgdGhlbSBtYXRjaGVzLlxuICAgICAqXG4gICAgICogQHBhcmFtIHRyaWdnZXIgVGhlIHN0cmluZyB0byBsb29rIGZvciBpbiB0aGUgcGF5bG9hZFxuICAgICAqIEBwYXJhbSBtaWRkbGV3YXJlIFRoZSBtaWRkbGV3YXJlIHRvIHJlZ2lzdGVyXG4gICAgICovXG4gICAgZ2FtZVF1ZXJ5KFxuICAgICAgICB0cmlnZ2VyOiBNYXliZUFycmF5PHN0cmluZyB8IFJlZ0V4cD4sXG4gICAgICAgIC4uLm1pZGRsZXdhcmU6IEFycmF5PEdhbWVRdWVyeU1pZGRsZXdhcmU8Qz4+XG4gICAgKTogQ29tcG9zZXI8R2FtZVF1ZXJ5Q29udGV4dDxDPj4ge1xuICAgICAgICByZXR1cm4gdGhpcy5maWx0ZXIoQ29udGV4dC5oYXMuZ2FtZVF1ZXJ5KHRyaWdnZXIpLCAuLi5taWRkbGV3YXJlKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBSZWdpc3RlcnMgbWlkZGxld2FyZSBmb3IgaW5saW5lIHF1ZXJpZXMuIFRlbGVncmFtIHNlbmRzIGFuIGlubGluZSBxdWVyeVxuICAgICAqIHRvIHlvdXIgYm90IHdoZW5ldmVyIGEgdXNlciB0eXBlcyDigJxAeW91cl9ib3RfbmFtZSAuLi7igJ0gaW50byBhIHRleHQgZmllbGRcbiAgICAgKiBpbiBUZWxlZ3JhbS4gWW91IGJvdCB3aWxsIHRoZW4gcmVjZWl2ZSB0aGUgZW50ZXJlZCBzZWFyY2ggcXVlcnkgYW5kIGNhblxuICAgICAqIHJlc3BvbmQgd2l0aCBhIG51bWJlciBvZiByZXN1bHRzICh0ZXh0LCBpbWFnZXMsIGV0YykgdGhhdCB0aGUgdXNlciBjYW5cbiAgICAgKiBwaWNrIGZyb20gdG8gc2VuZCBhIG1lc3NhZ2UgX3ZpYV8geW91ciBib3QgdG8gdGhlIHJlc3BlY3RpdmUgY2hhdC4gQ2hlY2tcbiAgICAgKiBvdXQgaHR0cHM6Ly9jb3JlLnRlbGVncmFtLm9yZy9ib3RzL2lubGluZSB0byByZWFkIG1vcmUgYWJvdXQgaW5saW5lIGJvdHMuXG4gICAgICpcbiAgICAgKiA+IE5vdGUgdGhhdCB5b3UgaGF2ZSB0byBlbmFibGUgaW5saW5lIG1vZGUgZm9yIHlvdSBib3QgYnkgY29udGFjdGluZ1xuICAgICAqID4gQEJvdEZhdGhlciBmaXJzdC5cbiAgICAgKlxuICAgICAqIGBgYHRzXG4gICAgICogLy8gTGlzdGVuIGZvciB1c2VycyB0eXBpbmcg4oCcQHlvdXJfYm90X25hbWUgcXVlcnnigJ1cbiAgICAgKiBib3QuaW5saW5lUXVlcnkoJ3F1ZXJ5JywgYXN5bmMgY3R4ID0+IHtcbiAgICAgKiAgIC8vIEFuc3dlciB0aGUgaW5saW5lIHF1ZXJ5LCBjb25mZXIgaHR0cHM6Ly9jb3JlLnRlbGVncmFtLm9yZy9ib3RzL2FwaSNhbnN3ZXJpbmxpbmVxdWVyeVxuICAgICAqICAgYXdhaXQgY3R4LmFuc3dlcklubGluZVF1ZXJ5KCAuLi4gKVxuICAgICAqIH0pXG4gICAgICogYGBgXG4gICAgICpcbiAgICAgKiBAcGFyYW0gdHJpZ2dlciBUaGUgaW5saW5lIHF1ZXJ5IHRleHQgdG8gbWF0Y2hcbiAgICAgKiBAcGFyYW0gbWlkZGxld2FyZSBUaGUgbWlkZGxld2FyZSB0byByZWdpc3RlclxuICAgICAqL1xuICAgIGlubGluZVF1ZXJ5KFxuICAgICAgICB0cmlnZ2VyOiBNYXliZUFycmF5PHN0cmluZyB8IFJlZ0V4cD4sXG4gICAgICAgIC4uLm1pZGRsZXdhcmU6IEFycmF5PElubGluZVF1ZXJ5TWlkZGxld2FyZTxDPj5cbiAgICApOiBDb21wb3NlcjxJbmxpbmVRdWVyeUNvbnRleHQ8Qz4+IHtcbiAgICAgICAgcmV0dXJuIHRoaXMuZmlsdGVyKENvbnRleHQuaGFzLmlubGluZVF1ZXJ5KHRyaWdnZXIpLCAuLi5taWRkbGV3YXJlKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBSZWdpc3RlcnMgbWlkZGxld2FyZSBmb3IgdGhlIENob3NlbklubGluZVJlc3VsdCBieSB0aGUgZ2l2ZW4gaWQgb3IgaWRzLlxuICAgICAqIENob3NlbklubGluZVJlc3VsdCByZXByZXNlbnRzIGEgcmVzdWx0IG9mIGFuIGlubGluZSBxdWVyeSB0aGF0IHdhcyBjaG9zZW5cbiAgICAgKiBieSB0aGUgdXNlciBhbmQgc2VudCB0byB0aGVpciBjaGF0IHBhcnRuZXIuIENoZWNrIG91dFxuICAgICAqIGh0dHBzOi8vY29yZS50ZWxlZ3JhbS5vcmcvYm90cy9hcGkjY2hvc2VuaW5saW5lcmVzdWx0IHRvIHJlYWQgbW9yZSBhYm91dFxuICAgICAqIGNob3NlbiBpbmxpbmUgcmVzdWx0cy5cbiAgICAgKlxuICAgICAqIGBgYHRzXG4gICAgICogYm90LmNob3NlbklubGluZVJlc3VsdCgnaWQnLCBhc3luYyBjdHggPT4ge1xuICAgICAqICAgY29uc3QgaWQgPSBjdHgucmVzdWx0X2lkO1xuICAgICAqICAgLy8gWW91ciBjb2RlXG4gICAgICogfSlcbiAgICAgKiBgYGBcbiAgICAgKlxuICAgICAqIEBwYXJhbSByZXN1bHRJZCBBbiBpZCBvciBhcnJheSBvZiBpZHNcbiAgICAgKiBAcGFyYW0gbWlkZGxld2FyZSBUaGUgbWlkZGxld2FyZSB0byByZWdpc3RlclxuICAgICAqL1xuICAgIGNob3NlbklubGluZVJlc3VsdChcbiAgICAgICAgcmVzdWx0SWQ6IE1heWJlQXJyYXk8c3RyaW5nIHwgUmVnRXhwPixcbiAgICAgICAgLi4ubWlkZGxld2FyZTogQXJyYXk8Q2hvc2VuSW5saW5lUmVzdWx0TWlkZGxld2FyZTxDPj5cbiAgICApOiBDb21wb3NlcjxDaG9zZW5JbmxpbmVSZXN1bHRDb250ZXh0PEM+PiB7XG4gICAgICAgIHJldHVybiB0aGlzLmZpbHRlcihcbiAgICAgICAgICAgIENvbnRleHQuaGFzLmNob3NlbklubGluZVJlc3VsdChyZXN1bHRJZCksXG4gICAgICAgICAgICAuLi5taWRkbGV3YXJlLFxuICAgICAgICApO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFJlZ2lzdGVycyBtaWRkbGV3YXJlIGZvciBwcmUtY2hlY2tvdXQgcXVlcmllcy4gVGVsZWdyYW0gc2VuZHMgYVxuICAgICAqIHByZS1jaGVja291dCBxdWVyeSB0byB5b3VyIGJvdCB3aGVuZXZlciBhIHVzZXIgaGFzIGNvbmZpcm1lZCB0aGVpclxuICAgICAqIHBheW1lbnQgYW5kIHNoaXBwaW5nIGRldGFpbHMuIFlvdSBib3Qgd2lsbCB0aGVuIHJlY2VpdmUgYWxsIGluZm9ybWF0aW9uXG4gICAgICogYWJvdXQgdGhlIG9yZGVyIGFuZCBoYXMgdG8gcmVzcG9uZCB3aXRoaW4gMTAgc2Vjb25kcyB3aXRoIGEgY29uZmlybWF0aW9uXG4gICAgICogb2Ygd2hldGhlciBldmVyeXRoaW5nIGlzIGFscmlnaHQgKGdvb2RzIGFyZSBhdmFpbGFibGUsIGV0Yy4pIGFuZCB0aGUgYm90XG4gICAgICogaXMgcmVhZHkgdG8gcHJvY2VlZCB3aXRoIHRoZSBvcmRlci4gQ2hlY2sgb3V0XG4gICAgICogaHR0cHM6Ly9jb3JlLnRlbGVncmFtLm9yZy9ib3RzL2FwaSNwcmVjaGVja291dHF1ZXJ5IHRvIHJlYWQgbW9yZSBhYm91dFxuICAgICAqIHByZS1jaGVja291dCBxdWVyaWVzLlxuICAgICAqXG4gICAgICogYGBgdHNcbiAgICAgKiBib3QucHJlQ2hlY2tvdXRRdWVyeSgnaW52b2ljZV9wYXlsb2FkJywgYXN5bmMgY3R4ID0+IHtcbiAgICAgKiAgIC8vIEFuc3dlciB0aGUgcHJlLWNoZWNrb3V0IHF1ZXJ5LCBjb25mZXIgaHR0cHM6Ly9jb3JlLnRlbGVncmFtLm9yZy9ib3RzL2FwaSNhbnN3ZXJwcmVjaGVja291dHF1ZXJ5XG4gICAgICogICBhd2FpdCBjdHguYW5zd2VyUHJlQ2hlY2tvdXRRdWVyeSggLi4uIClcbiAgICAgKiB9KVxuICAgICAqIGBgYFxuICAgICAqXG4gICAgICogQHBhcmFtIHRyaWdnZXIgVGhlIHN0cmluZyB0byBsb29rIGZvciBpbiB0aGUgaW52b2ljZSBwYXlsb2FkXG4gICAgICogQHBhcmFtIG1pZGRsZXdhcmUgVGhlIG1pZGRsZXdhcmUgdG8gcmVnaXN0ZXJcbiAgICAgKi9cbiAgICBwcmVDaGVja291dFF1ZXJ5KFxuICAgICAgICB0cmlnZ2VyOiBNYXliZUFycmF5PHN0cmluZyB8IFJlZ0V4cD4sXG4gICAgICAgIC4uLm1pZGRsZXdhcmU6IEFycmF5PFByZUNoZWNrb3V0UXVlcnlNaWRkbGV3YXJlPEM+PlxuICAgICk6IENvbXBvc2VyPFByZUNoZWNrb3V0UXVlcnlDb250ZXh0PEM+PiB7XG4gICAgICAgIHJldHVybiB0aGlzLmZpbHRlcihcbiAgICAgICAgICAgIENvbnRleHQuaGFzLnByZUNoZWNrb3V0UXVlcnkodHJpZ2dlciksXG4gICAgICAgICAgICAuLi5taWRkbGV3YXJlLFxuICAgICAgICApO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFJlZ2lzdGVycyBtaWRkbGV3YXJlIGZvciBzaGlwcGluZyBxdWVyaWVzLiBJZiB5b3Ugc2VudCBhbiBpbnZvaWNlXG4gICAgICogcmVxdWVzdGluZyBhIHNoaXBwaW5nIGFkZHJlc3MgYW5kIHRoZSBwYXJhbWV0ZXIgX2lzX2ZsZXhpYmxlXyB3YXNcbiAgICAgKiBzcGVjaWZpZWQsIFRlbGVncmFtIHdpbGwgc2VuZCBhIHNoaXBwaW5nIHF1ZXJ5IHRvIHlvdXIgYm90IHdoZW5ldmVyIGFcbiAgICAgKiB1c2VyIGhhcyBjb25maXJtZWQgdGhlaXIgc2hpcHBpbmcgZGV0YWlscy4gWW91IGJvdCB3aWxsIHRoZW4gcmVjZWl2ZSB0aGVcbiAgICAgKiBzaGlwcGluZyBpbmZvcm1hdGlvbiBhbmQgY2FuIHJlc3BvbmQgd2l0aCBhIGNvbmZpcm1hdGlvbiBvZiB3aGV0aGVyXG4gICAgICogZGVsaXZlcnkgdG8gdGhlIHNwZWNpZmllZCBhZGRyZXNzIGlzIHBvc3NpYmxlLiBDaGVjayBvdXRcbiAgICAgKiBodHRwczovL2NvcmUudGVsZWdyYW0ub3JnL2JvdHMvYXBpI3NoaXBwaW5ncXVlcnkgdG8gcmVhZCBtb3JlIGFib3V0XG4gICAgICogc2hpcHBpbmcgcXVlcmllcy5cbiAgICAgKlxuICAgICAqIGBgYHRzXG4gICAgICogYm90LnNoaXBwaW5nUXVlcnkoJ2ludm9pY2VfcGF5bG9hZCcsIGFzeW5jIGN0eCA9PiB7XG4gICAgICogICAvLyBBbnN3ZXIgdGhlIHNoaXBwaW5nIHF1ZXJ5LCBjb25mZXIgaHR0cHM6Ly9jb3JlLnRlbGVncmFtLm9yZy9ib3RzL2FwaSNhbnN3ZXJzaGlwcGluZ3F1ZXJ5XG4gICAgICogICBhd2FpdCBjdHguYW5zd2VyU2hpcHBpbmdRdWVyeSggLi4uIClcbiAgICAgKiB9KVxuICAgICAqIGBgYFxuICAgICAqXG4gICAgICogQHBhcmFtIHRyaWdnZXIgVGhlIHN0cmluZyB0byBsb29rIGZvciBpbiB0aGUgaW52b2ljZSBwYXlsb2FkXG4gICAgICogQHBhcmFtIG1pZGRsZXdhcmUgVGhlIG1pZGRsZXdhcmUgdG8gcmVnaXN0ZXJcbiAgICAgKi9cbiAgICBzaGlwcGluZ1F1ZXJ5KFxuICAgICAgICB0cmlnZ2VyOiBNYXliZUFycmF5PHN0cmluZyB8IFJlZ0V4cD4sXG4gICAgICAgIC4uLm1pZGRsZXdhcmU6IEFycmF5PFNoaXBwaW5nUXVlcnlNaWRkbGV3YXJlPEM+PlxuICAgICk6IENvbXBvc2VyPFNoaXBwaW5nUXVlcnlDb250ZXh0PEM+PiB7XG4gICAgICAgIHJldHVybiB0aGlzLmZpbHRlcihDb250ZXh0Lmhhcy5zaGlwcGluZ1F1ZXJ5KHRyaWdnZXIpLCAuLi5taWRkbGV3YXJlKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiA+IFRoaXMgaXMgYW4gYWR2YW5jZWQgbWV0aG9kIG9mIGdyYW1tWS5cbiAgICAgKlxuICAgICAqIFJlZ2lzdGVycyBtaWRkbGV3YXJlIGJlaGluZCBhIGN1c3RvbSBmaWx0ZXIgZnVuY3Rpb24gdGhhdCBvcGVyYXRlcyBvbiB0aGVcbiAgICAgKiBjb250ZXh0IG9iamVjdCBhbmQgZGVjaWRlcyB3aGV0aGVyIG9yIG5vdCB0byBleGVjdXRlIHRoZSBtaWRkbGV3YXJlLiBJblxuICAgICAqIG90aGVyIHdvcmRzLCB0aGUgbWlkZGxld2FyZSB3aWxsIG9ubHkgYmUgZXhlY3V0ZWQgaWYgdGhlIGdpdmVuIHByZWRpY2F0ZVxuICAgICAqIHJldHVybnMgYHRydWVgIGZvciB0aGUgZ2l2ZW4gY29udGV4dCBvYmplY3QuIE90aGVyd2lzZSwgaXQgd2lsbCBiZVxuICAgICAqIHNraXBwZWQgYW5kIHRoZSBuZXh0IG1pZGRsZXdhcmUgd2lsbCBiZSBleGVjdXRlZC5cbiAgICAgKlxuICAgICAqIFRoaXMgbWV0aG9kIGhhcyB0d28gc2lnbmF0dXJlcy4gVGhlIGZpcnN0IG9uZSBpcyBzdHJhaWdodGZvcndhcmQsIGl0IGlzXG4gICAgICogdGhlIG9uZSBkZXNjcmliZWQgYWJvdmUuIE5vdGUgdGhhdCB0aGUgcHJlZGljYXRlIG1heSBiZSBhc3luY2hyb25vdXMsXG4gICAgICogaS5lLiBpdCBjYW4gcmV0dXJuIGEgUHJvbWlzZSBvZiBhIGJvb2xlYW4uXG4gICAgICpcbiAgICAgKiBBbHRlcm5hdGl2ZWx5LCB5b3UgY2FuIHBhc3MgYSBmdW5jdGlvbiB0aGF0IGhhcyBhIHR5cGUgcHJlZGljYXRlIGFzXG4gICAgICogcmV0dXJuIHR5cGUuIFRoaXMgd2lsbCBhbGxvdyB5b3UgdG8gbmFycm93IGRvd24gdGhlIGNvbnRleHQgb2JqZWN0LiBUaGVcbiAgICAgKiBpbnN0YWxsZWQgbWlkZGxld2FyZSBpcyB0aGVuIGFibGUgdG8gb3BlcmF0ZSBvbiB0aGlzIGNvbnN0cmFpbmVkIGNvbnRleHRcbiAgICAgKiBvYmplY3QuXG4gICAgICogYGBgdHNcbiAgICAgKiAvLyBOT1JNQUwgVVNBR0VcbiAgICAgKiAvLyBPbmx5IHByb2Nlc3MgZXZlcnkgc2Vjb25kIHVwZGF0ZVxuICAgICAqIGJvdC5maWx0ZXIoY3R4ID0+IGN0eC51cGRhdGUudXBkYXRlX2lkICUgMiA9PT0gMCwgY3R4ID0+IHsgLi4uIH0pXG4gICAgICpcbiAgICAgKiAvLyBUWVBFIFBSRURJQ0FURSBVU0FHRVxuICAgICAqIGZ1bmN0aW9uIHByZWRpY2F0ZShjdHgpOiBjdHggaXMgQ29udGV4dCAmIHsgbWVzc2FnZTogdW5kZWZpbmVkIH0ge1xuICAgICAqICAgcmV0dXJuIGN0eC5tZXNzYWdlID09PSB1bmRlZmluZWRcbiAgICAgKiB9XG4gICAgICogLy8gT25seSBwcm9jZXNzIHVwZGF0ZXMgd2hlcmUgYG1lc3NhZ2VgIGlzIGB1bmRlZmluZWRgXG4gICAgICogYm90LmZpbHRlcihwcmVkaWNhdGUsIGN0eCA9PiB7XG4gICAgICogICBjb25zdCBtID0gY3R4Lm1lc3NhZ2UgLy8gaW5mZXJyZWQgYXMgYWx3YXlzIHVuZGVmaW5lZCFcbiAgICAgKiAgIGNvbnN0IG0yID0gY3R4LnVwZGF0ZS5tZXNzYWdlIC8vIGFsc28gaW5mZXJyZWQgYXMgYWx3YXlzIHVuZGVmaW5lZCFcbiAgICAgKiB9KVxuICAgICAqIGBgYFxuICAgICAqXG4gICAgICogQHBhcmFtIHByZWRpY2F0ZSBUaGUgcHJlZGljYXRlIHRvIGNoZWNrXG4gICAgICogQHBhcmFtIG1pZGRsZXdhcmUgVGhlIG1pZGRsZXdhcmUgdG8gcmVnaXN0ZXJcbiAgICAgKi9cbiAgICBmaWx0ZXI8RCBleHRlbmRzIEM+KFxuICAgICAgICBwcmVkaWNhdGU6IChjdHg6IEMpID0+IGN0eCBpcyBELFxuICAgICAgICAuLi5taWRkbGV3YXJlOiBBcnJheTxNaWRkbGV3YXJlPEQ+PlxuICAgICk6IENvbXBvc2VyPEQ+O1xuICAgIGZpbHRlcihcbiAgICAgICAgcHJlZGljYXRlOiAoY3R4OiBDKSA9PiBNYXliZVByb21pc2U8Ym9vbGVhbj4sXG4gICAgICAgIC4uLm1pZGRsZXdhcmU6IEFycmF5PE1pZGRsZXdhcmU8Qz4+XG4gICAgKTogQ29tcG9zZXI8Qz47XG4gICAgZmlsdGVyKFxuICAgICAgICBwcmVkaWNhdGU6IChjdHg6IEMpID0+IE1heWJlUHJvbWlzZTxib29sZWFuPixcbiAgICAgICAgLi4ubWlkZGxld2FyZTogQXJyYXk8TWlkZGxld2FyZTxDPj5cbiAgICApIHtcbiAgICAgICAgY29uc3QgY29tcG9zZXIgPSBuZXcgQ29tcG9zZXIoLi4ubWlkZGxld2FyZSk7XG4gICAgICAgIHRoaXMuYnJhbmNoKHByZWRpY2F0ZSwgY29tcG9zZXIsIHBhc3MpO1xuICAgICAgICByZXR1cm4gY29tcG9zZXI7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogPiBUaGlzIGlzIGFuIGFkdmFuY2VkIG1ldGhvZCBvZiBncmFtbVkuXG4gICAgICpcbiAgICAgKiBSZWdpc3RlcnMgbWlkZGxld2FyZSBiZWhpbmQgYSBjdXN0b20gZmlsdGVyIGZ1bmN0aW9uIHRoYXQgb3BlcmF0ZXMgb24gdGhlXG4gICAgICogY29udGV4dCBvYmplY3QgYW5kIGRlY2lkZXMgd2hldGhlciBvciBub3QgdG8gZXhlY3V0ZSB0aGUgbWlkZGxld2FyZS4gSW5cbiAgICAgKiBvdGhlciB3b3JkcywgdGhlIG1pZGRsZXdhcmUgd2lsbCBvbmx5IGJlIGV4ZWN1dGVkIGlmIHRoZSBnaXZlbiBwcmVkaWNhdGVcbiAgICAgKiByZXR1cm5zIGBmYWxzZWAgZm9yIHRoZSBnaXZlbiBjb250ZXh0IG9iamVjdC4gT3RoZXJ3aXNlLCBpdCB3aWxsIGJlXG4gICAgICogc2tpcHBlZCBhbmQgdGhlIG5leHQgbWlkZGxld2FyZSB3aWxsIGJlIGV4ZWN1dGVkLiBOb3RlIHRoYXQgdGhlIHByZWRpY2F0ZVxuICAgICAqIG1heSBiZSBhc3luY2hyb25vdXMsIGkuZS4gaXQgY2FuIHJldHVybiBhIFByb21pc2Ugb2YgYSBib29sZWFuLlxuICAgICAqXG4gICAgICogVGhpcyBtZXRob2QgaXMgdGhlIHNhbWUgdXNpbmcgYGZpbHRlcmAgKG5vcm1hbCB1c2FnZSkgd2l0aCBhIG5lZ2F0ZWRcbiAgICAgKiBwcmVkaWNhdGUuXG4gICAgICpcbiAgICAgKiBAcGFyYW0gcHJlZGljYXRlIFRoZSBwcmVkaWNhdGUgdG8gY2hlY2tcbiAgICAgKiBAcGFyYW0gbWlkZGxld2FyZSBUaGUgbWlkZGxld2FyZSB0byByZWdpc3RlclxuICAgICAqL1xuICAgIGRyb3AoXG4gICAgICAgIHByZWRpY2F0ZTogKGN0eDogQykgPT4gTWF5YmVQcm9taXNlPGJvb2xlYW4+LFxuICAgICAgICAuLi5taWRkbGV3YXJlOiBBcnJheTxNaWRkbGV3YXJlPEM+PlxuICAgICkge1xuICAgICAgICByZXR1cm4gdGhpcy5maWx0ZXIoXG4gICAgICAgICAgICBhc3luYyAoY3R4OiBDKSA9PiAhKGF3YWl0IHByZWRpY2F0ZShjdHgpKSxcbiAgICAgICAgICAgIC4uLm1pZGRsZXdhcmUsXG4gICAgICAgICk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogPiBUaGlzIGlzIGFuIGFkdmFuY2VkIG1ldGhvZCBvZiBncmFtbVkuXG4gICAgICpcbiAgICAgKiBSZWdpc3RlcnMgc29tZSBtaWRkbGV3YXJlIHRoYXQgcnVucyBjb25jdXJyZW50bHkgdG8gdGhlIGV4ZWN1dGluZ1xuICAgICAqIG1pZGRsZXdhcmUgc3RhY2suXG4gICAgICogYGBgdHNcbiAgICAgKiBib3QudXNlKCAuLi4gKSAvLyB3aWxsIHJ1biBmaXJzdFxuICAgICAqIGJvdC5mb3JrKCAuLi4gKSAvLyB3aWxsIGJlIHN0YXJ0ZWQgc2Vjb25kLCBidXQgcnVuIGNvbmN1cnJlbnRseVxuICAgICAqIGJvdC51c2UoIC4uLiApIC8vIHdpbGwgYWxzbyBiZSBydW4gc2Vjb25kXG4gICAgICogYGBgXG4gICAgICogSW4gdGhlIGZpcnN0IG1pZGRsZXdhcmUsIGFzIHNvb24gYXMgYG5leHRgJ3MgUHJvbWlzZSByZXNvbHZlcywgYm90aCBmb3Jrc1xuICAgICAqIGhhdmUgY29tcGxldGVkLlxuICAgICAqXG4gICAgICogQm90aCB0aGUgZm9yayBhbmQgdGhlIGRvd25zdHJlYW0gbWlkZGxld2FyZSBhcmUgYXdhaXRlZCB3aXRoXG4gICAgICogYFByb21pc2UuYWxsYCwgc28geW91IHdpbGwgb25seSBiZSB0byBjYXRjaCB1cCB0byBvbmUgZXJyb3IgKHRoZSBvbmUgdGhhdFxuICAgICAqIGlzIHRocm93biBmaXJzdCkuXG4gICAgICpcbiAgICAgKiBJbiBvcHBvc2l0ZSB0byB0aGUgb3RoZXIgbWlkZGxld2FyZSBtZXRob2RzIG9uIGNvbXBvc2VyLCBgZm9ya2AgZG9lcyBub3RcbiAgICAgKiByZXR1cm4gc2ltcGx5IHJldHVybiB0aGUgY29tcG9zZXIgY29ubmVjdGVkIHRvIHRoZSBtYWluIG1pZGRsZXdhcmUgc3RhY2suXG4gICAgICogSW5zdGVhZCwgaXQgcmV0dXJucyB0aGUgY3JlYXRlZCBjb21wb3NlciBfb2YgdGhlIGZvcmtfIGNvbm5lY3RlZCB0byB0aGVcbiAgICAgKiBtaWRkbGV3YXJlIHN0YWNrLiBUaGlzIGFsbG93cyBmb3IgdGhlIGZvbGxvd2luZyBwYXR0ZXJuLlxuICAgICAqIGBgYHRzXG4gICAgICogLy8gTWlkZGxld2FyZSB3aWxsIGJlIHJ1biBjb25jdXJyZW50bHkhXG4gICAgICogYm90LmZvcmsoKS5vbignbWVzc2FnZScsIGN0eCA9PiB7IC4uLiB9KVxuICAgICAqIGBgYFxuICAgICAqXG4gICAgICogQHBhcmFtIG1pZGRsZXdhcmUgVGhlIG1pZGRsZXdhcmUgdG8gcnVuIGNvbmN1cnJlbnRseVxuICAgICAqL1xuICAgIGZvcmsoLi4ubWlkZGxld2FyZTogQXJyYXk8TWlkZGxld2FyZTxDPj4pIHtcbiAgICAgICAgY29uc3QgY29tcG9zZXIgPSBuZXcgQ29tcG9zZXIoLi4ubWlkZGxld2FyZSk7XG4gICAgICAgIGNvbnN0IGZvcmsgPSBmbGF0dGVuKGNvbXBvc2VyKTtcbiAgICAgICAgdGhpcy51c2UoKGN0eCwgbmV4dCkgPT4gUHJvbWlzZS5hbGwoW25leHQoKSwgcnVuKGZvcmssIGN0eCldKSk7XG4gICAgICAgIHJldHVybiBjb21wb3NlcjtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiA+IFRoaXMgaXMgYW4gYWR2YW5jZWQgbWV0aG9kIG9mIGdyYW1tWS5cbiAgICAgKlxuICAgICAqIEV4ZWN1dGVzIHNvbWUgbWlkZGxld2FyZSB0aGF0IGNhbiBiZSBnZW5lcmF0ZWQgb24gdGhlIGZseSBmb3IgZWFjaFxuICAgICAqIGNvbnRleHQuIFBhc3MgYSBmYWN0b3J5IGZ1bmN0aW9uIHRoYXQgY3JlYXRlcyBzb21lIG1pZGRsZXdhcmUgKG9yIGFcbiAgICAgKiBtaWRkbGV3YXJlIGFycmF5IGV2ZW4pLiBUaGUgZmFjdG9yeSBmdW5jdGlvbiB3aWxsIGJlIGNhbGxlZCBvbmNlIHBlclxuICAgICAqIGNvbnRleHQsIGFuZCBpdHMgcmVzdWx0IHdpbGwgYmUgZXhlY3V0ZWQgd2l0aCB0aGUgY29udGV4dCBvYmplY3QuXG4gICAgICogYGBgdHNcbiAgICAgKiAvLyBUaGUgbWlkZGxld2FyZSByZXR1cm5lZCBieSBgY3JlYXRlTXlNaWRkbGV3YXJlYCB3aWxsIGJlIHVzZWQgb25seSBvbmNlXG4gICAgICogYm90LmxhenkoY3R4ID0+IGNyZWF0ZU15TWlkZGxld2FyZShjdHgpKVxuICAgICAqIGBgYFxuICAgICAqXG4gICAgICogWW91IG1heSBnZW5lcmF0ZSB0aGlzIG1pZGRsZXdhcmUgaW4gYW4gYGFzeW5jYCBmYXNoaW9uLlxuICAgICAqXG4gICAgICogWW91IGNhbiBkZWNpZGUgdG8gcmV0dXJuIGFuIGVtcHR5IGFycmF5IChgW11gKSBpZiB5b3UgZG9uJ3Qgd2FudCB0byBydW5cbiAgICAgKiBhbnkgbWlkZGxld2FyZSBmb3IgYSBnaXZlbiBjb250ZXh0IG9iamVjdC4gVGhpcyBpcyBlcXVpdmFsZW50IHRvXG4gICAgICogcmV0dXJuaW5nIGFuIGVtcHR5IGluc3RhbmNlIG9mIGBDb21wb3NlcmAuXG4gICAgICpcbiAgICAgKiBAcGFyYW0gbWlkZGxld2FyZUZhY3RvcnkgVGhlIGZhY3RvcnkgZnVuY3Rpb24gY3JlYXRpbmcgdGhlIG1pZGRsZXdhcmVcbiAgICAgKi9cbiAgICBsYXp5KFxuICAgICAgICBtaWRkbGV3YXJlRmFjdG9yeTogKGN0eDogQykgPT4gTWF5YmVQcm9taXNlPE1heWJlQXJyYXk8TWlkZGxld2FyZTxDPj4+LFxuICAgICk6IENvbXBvc2VyPEM+IHtcbiAgICAgICAgcmV0dXJuIHRoaXMudXNlKGFzeW5jIChjdHgsIG5leHQpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IG1pZGRsZXdhcmUgPSBhd2FpdCBtaWRkbGV3YXJlRmFjdG9yeShjdHgpO1xuICAgICAgICAgICAgY29uc3QgYXJyID0gQXJyYXkuaXNBcnJheShtaWRkbGV3YXJlKSA/IG1pZGRsZXdhcmUgOiBbbWlkZGxld2FyZV07XG4gICAgICAgICAgICBhd2FpdCBmbGF0dGVuKG5ldyBDb21wb3NlciguLi5hcnIpKShjdHgsIG5leHQpO1xuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiA+IFRoaXMgaXMgYW4gYWR2YW5jZWQgbWV0aG9kIG9mIGdyYW1tWS5cbiAgICAgKlxuICAgICAqIF9Ob3QgdG8gYmUgY29uZnVzZWQgd2l0aCB0aGUgYHJvdXRlcmAgcGx1Z2luLl9cbiAgICAgKlxuICAgICAqIFRoaXMgbWV0aG9kIGlzIGFuIGFsdGVybmF0aXZlIHRvIHRoZSBgcm91dGVyYCBwbHVnaW4uIEl0IGFsbG93cyB5b3UgdG9cbiAgICAgKiBicmFuY2ggYmV0d2VlbiBkaWZmZXJlbnQgbWlkZGxld2FyZSBwZXIgY29udGV4dCBvYmplY3QuIFlvdSBjYW4gcGFzcyB0d29cbiAgICAgKiB0aGluZ3MgdG8gaXQ6XG4gICAgICogMS4gQSByb3V0aW5nIGZ1bmN0aW9uXG4gICAgICogMi4gRGlmZmVyZW50IG1pZGRsZXdhcmUgaWRlbnRpZmllZCBieSBrZXlcbiAgICAgKlxuICAgICAqIFRoZSByb3V0aW5nIGZ1bmN0aW9uIGRlY2lkZXMgYmFzZWQgb24gdGhlIGNvbnRleHQgb2JqZWN0IHdoaWNoIG1pZGRsZXdhcmVcbiAgICAgKiB0byBydW4uIEVhY2ggbWlkZGxld2FyZSBpcyBpZGVudGlmaWVkIGJ5IGEga2V5LCBzbyB0aGUgcm91dGluZyBmdW5jdGlvblxuICAgICAqIHNpbXBseSByZXR1cm5zIHRoZSBrZXkgb2YgdGhhdCBtaWRkbGV3YXJlLlxuICAgICAqIGBgYHRzXG4gICAgICogLy8gRGVmaW5lIGRpZmZlcmVudCByb3V0ZSBoYW5kbGVyc1xuICAgICAqIGNvbnN0IHJvdXRlSGFuZGxlcnMgPSB7XG4gICAgICogICBldmVuVXBkYXRlczogKGN0eDogQ29udGV4dCkgPT4geyAuLi4gfVxuICAgICAqICAgb2RkVXBkYXRlczogKGN0eDogQ29udGV4dCkgPT4geyAuLi4gfVxuICAgICAqIH1cbiAgICAgKiAvLyBEZWNpZGUgZm9yIGEgY29udGV4dCBvYmplY3Qgd2hpY2ggb25lIHRvIHBpY2tcbiAgICAgKiBjb25zdCByb3V0ZXIgPSAoY3R4OiBDb250ZXh0KSA9PiBjdHgudXBkYXRlLnVwZGF0ZV9pZCAlIDIgPT09IDBcbiAgICAgKiAgID8gJ2V2ZW5VcGRhdGVzJ1xuICAgICAqICAgOiAnb2RkVXBkYXRlcydcbiAgICAgKiAvLyBSb3V0ZSBpdCFcbiAgICAgKiBib3Qucm91dGUocm91dGVyLCByb3V0ZUhhbmRsZXJzKVxuICAgICAqIGBgYFxuICAgICAqXG4gICAgICogT3B0aW9uYWxseSwgeW91IGNhbiBwYXNzIGEgdGhpcmQgb3B0aW9uIHRoYXQgaXMgdXNlZCBhcyBmYWxsYmFja1xuICAgICAqIG1pZGRsZXdhcmUgaWYgeW91ciByb3V0ZSBmdW5jdGlvbiByZXR1cm5zIGB1bmRlZmluZWRgLCBvciBpZiB0aGUga2V5XG4gICAgICogcmV0dXJuZWQgYnkgeW91ciByb3V0ZXIgaGFzIG5vIG1pZGRsZXdhcmUgYXNzb2NpYXRlZCB3aXRoIGl0LlxuICAgICAqXG4gICAgICogVGhpcyBtZXRob2QgbWF5IG5lZWQgbGVzcyBzZXR1cCB0aGFuIGZpcnN0IGluc3RhbnRpYXRpbmcgYSBgUm91dGVyYCwgYnV0XG4gICAgICogZm9yIG1vcmUgY29tcGxleCBzZXR1cHMsIGhhdmluZyBhIGBSb3V0ZXJgIG1heSBiZSBtb3JlIHJlYWRhYmxlLlxuICAgICAqXG4gICAgICogQHBhcmFtIHJvdXRlciBUaGUgcm91dGluZyBmdW5jdGlvbiB0byB1c2VcbiAgICAgKiBAcGFyYW0gcm91dGVIYW5kbGVycyBIYW5kbGVycyBmb3IgZXZlcnkgcm91dGVcbiAgICAgKiBAcGFyYW0gZmFsbGJhY2sgT3B0aW9uYWwgZmFsbGJhY2sgbWlkZGxld2FyZSBpZiBubyByb3V0ZSBtYXRjaGVzXG4gICAgICovXG4gICAgcm91dGU8UiBleHRlbmRzIFJlY29yZDxQcm9wZXJ0eUtleSwgTWlkZGxld2FyZTxDPj4+KFxuICAgICAgICByb3V0ZXI6IChjdHg6IEMpID0+IE1heWJlUHJvbWlzZTx1bmRlZmluZWQgfCBrZXlvZiBSPixcbiAgICAgICAgcm91dGVIYW5kbGVyczogUixcbiAgICAgICAgZmFsbGJhY2s6IE1pZGRsZXdhcmU8Qz4gPSBwYXNzLFxuICAgICk6IENvbXBvc2VyPEM+IHtcbiAgICAgICAgcmV0dXJuIHRoaXMubGF6eShhc3luYyAoY3R4KSA9PiB7XG4gICAgICAgICAgICBjb25zdCByb3V0ZSA9IGF3YWl0IHJvdXRlcihjdHgpO1xuICAgICAgICAgICAgcmV0dXJuIChyb3V0ZSA9PT0gdW5kZWZpbmVkIHx8ICFyb3V0ZUhhbmRsZXJzW3JvdXRlXVxuICAgICAgICAgICAgICAgID8gZmFsbGJhY2tcbiAgICAgICAgICAgICAgICA6IHJvdXRlSGFuZGxlcnNbcm91dGVdKSA/PyBbXTtcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogPiBUaGlzIGlzIGFuIGFkdmFuY2VkIG1ldGhvZCBvZiBncmFtbVkuXG4gICAgICpcbiAgICAgKiBBbGxvd3MgeW91IHRvIGJyYW5jaCBiZXR3ZWVuIHR3byBjYXNlcyBmb3IgYSBnaXZlbiBjb250ZXh0IG9iamVjdC5cbiAgICAgKlxuICAgICAqIFRoaXMgbWV0aG9kIHRha2VzIGEgcHJlZGljYXRlIGZ1bmN0aW9uIHRoYXQgaXMgdGVzdGVkIG9uY2UgcGVyIGNvbnRleHRcbiAgICAgKiBvYmplY3QuIElmIGl0IHJldHVybnMgYHRydWVgLCB0aGUgZmlyc3Qgc3VwcGxpZWQgbWlkZGxld2FyZSBpcyBleGVjdXRlZC5cbiAgICAgKiBJZiBpdCByZXR1cm5zIGBmYWxzZWAsIHRoZSBzZWNvbmQgc3VwcGxpZWQgbWlkZGxld2FyZSBpcyBleGVjdXRlZC4gTm90ZVxuICAgICAqIHRoYXQgdGhlIHByZWRpY2F0ZSBtYXkgYmUgYXN5bmNocm9ub3VzLCBpLmUuIGl0IGNhbiByZXR1cm4gYSBQcm9taXNlIG9mIGFcbiAgICAgKiBib29sZWFuLlxuICAgICAqXG4gICAgICogQHBhcmFtIHByZWRpY2F0ZSBUaGUgcHJlZGljYXRlIHRvIGNoZWNrXG4gICAgICogQHBhcmFtIHRydWVNaWRkbGV3YXJlIFRoZSBtaWRkbGV3YXJlIGZvciB0aGUgYHRydWVgIGNhc2VcbiAgICAgKiBAcGFyYW0gZmFsc2VNaWRkbGV3YXJlIFRoZSBtaWRkbGV3YXJlIGZvciB0aGUgYGZhbHNlYCBjYXNlXG4gICAgICovXG4gICAgYnJhbmNoKFxuICAgICAgICBwcmVkaWNhdGU6IChjdHg6IEMpID0+IE1heWJlUHJvbWlzZTxib29sZWFuPixcbiAgICAgICAgdHJ1ZU1pZGRsZXdhcmU6IE1heWJlQXJyYXk8TWlkZGxld2FyZTxDPj4sXG4gICAgICAgIGZhbHNlTWlkZGxld2FyZTogTWF5YmVBcnJheTxNaWRkbGV3YXJlPEM+PixcbiAgICApIHtcbiAgICAgICAgcmV0dXJuIHRoaXMubGF6eShhc3luYyAoY3R4KSA9PlxuICAgICAgICAgICAgKGF3YWl0IHByZWRpY2F0ZShjdHgpKSA/IHRydWVNaWRkbGV3YXJlIDogZmFsc2VNaWRkbGV3YXJlXG4gICAgICAgICk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogPiBUaGlzIGlzIGFuIGFkdmFuY2VkIGZ1bmN0aW9uIG9mIGdyYW1tWS5cbiAgICAgKlxuICAgICAqIEluc3RhbGxzIGFuIGVycm9yIGJvdW5kYXJ5IHRoYXQgY2F0Y2hlcyBlcnJvcnMgdGhhdCBoYXBwZW4gb25seSBpbnNpZGVcbiAgICAgKiB0aGUgZ2l2ZW4gbWlkZGxld2FyZS4gVGhpcyBhbGxvd3MgeW91IHRvIGluc3RhbGwgY3VzdG9tIGVycm9yIGhhbmRsZXJzXG4gICAgICogdGhhdCBwcm90ZWN0IHNvbWUgcGFydHMgb2YgeW91ciBib3QuIEVycm9ycyB3aWxsIG5vdCBiZSBhYmxlIHRvIGJ1YmJsZVxuICAgICAqIG91dCBvZiB0aGlzIHBhcnQgb2YgeW91ciBtaWRkbGV3YXJlIHN5c3RlbSwgdW5sZXNzIHRoZSBzdXBwbGllZCBlcnJvclxuICAgICAqIGhhbmRsZXIgcmV0aHJvd3MgdGhlbSwgaW4gd2hpY2ggY2FzZSB0aGUgbmV4dCBzdXJyb3VuZGluZyBlcnJvciBib3VuZGFyeVxuICAgICAqIHdpbGwgY2F0Y2ggdGhlIGVycm9yLlxuICAgICAqXG4gICAgICogRXhhbXBsZSB1c2FnZTpcbiAgICAgKiBgYGB0c1xuICAgICAqIGZ1bmN0aW9uIGVyckhhbmRsZXIoZXJyOiBCb3RFcnJvcikge1xuICAgICAqICAgY29uc29sZS5lcnJvcignRXJyb3IgYm91bmRhcnkgY2F1Z2h0IGVycm9yIScsIGVycilcbiAgICAgKiB9XG4gICAgICpcbiAgICAgKiBjb25zdCBzYWZlID1cbiAgICAgKiAgIC8vIEFsbCBwYXNzZWQgbWlkZGxld2FyZSB3aWxsIGJlIHByb3RlY3RlZCBieSB0aGUgZXJyb3IgYm91bmRhcnkuXG4gICAgICogICBib3QuZXJyb3JCb3VuZGFyeShlcnJIYW5kbGVyLCBtaWRkbGV3YXJlMCwgbWlkZGxld2FyZTEsIG1pZGRsZXdhcmUyKVxuICAgICAqXG4gICAgICogLy8gVGhvc2Ugd2lsbCBhbHNvIGJlIHByb3RlY3RlZCFcbiAgICAgKiBzYWZlLm9uKCdtZXNzYWdlJywgbWlkZGxld2FyZTMpXG4gICAgICpcbiAgICAgKiAvLyBObyBlcnJvciBmcm9tIGBtaWRkbGV3YXJlNGAgd2lsbCByZWFjaCB0aGUgYGVyckhhbmRsZXJgIGZyb20gYWJvdmUsXG4gICAgICogLy8gYXMgZXJyb3JzIGFyZSBzdXBwcmVzc2VkLlxuICAgICAqXG4gICAgICogLy8gZG8gbm90aGluZyBvbiBlcnJvciAoc3VwcHJlc3MgZXJyb3IpLCBhbmQgcnVuIG91dHNpZGUgbWlkZGxld2FyZVxuICAgICAqIGNvbnN0IHN1cHByZXNzID0gKF9lcnI6IEJvdEVycm9yLCBuZXh0OiBOZXh0RnVuY3Rpb24pID0+IHsgcmV0dXJuIG5leHQoKSB9XG4gICAgICogc2FmZS5lcnJvckJvdW5kYXJ5KHN1cHByZXNzKS5vbignZWRpdGVkX21lc3NhZ2UnLCBtaWRkbGV3YXJlNClcbiAgICAgKiBgYGBcbiAgICAgKlxuICAgICAqIENoZWNrIG91dCB0aGVcbiAgICAgKiBbZG9jdW1lbnRhdGlvbl0oaHR0cHM6Ly9ncmFtbXkuZGV2L2d1aWRlL2Vycm9ycy5odG1sI2Vycm9yLWJvdW5kYXJpZXMpIG9uXG4gICAgICogdGhlIHdlYnNpdGUgdG8gbGVhcm4gbW9yZSBhYm91dCBlcnJvciBib3VuZGFyaWVzLlxuICAgICAqXG4gICAgICogQHBhcmFtIGVycm9ySGFuZGxlciBUaGUgZXJyb3IgaGFuZGxlciB0byB1c2VcbiAgICAgKiBAcGFyYW0gbWlkZGxld2FyZSBUaGUgbWlkZGxld2FyZSB0byBwcm90ZWN0XG4gICAgICovXG4gICAgZXJyb3JCb3VuZGFyeShcbiAgICAgICAgZXJyb3JIYW5kbGVyOiAoXG4gICAgICAgICAgICBlcnJvcjogQm90RXJyb3I8Qz4sXG4gICAgICAgICAgICBuZXh0OiBOZXh0RnVuY3Rpb24sXG4gICAgICAgICkgPT4gTWF5YmVQcm9taXNlPHVua25vd24+LFxuICAgICAgICAuLi5taWRkbGV3YXJlOiBBcnJheTxNaWRkbGV3YXJlPEM+PlxuICAgICkge1xuICAgICAgICBjb25zdCBjb21wb3NlciA9IG5ldyBDb21wb3NlcjxDPiguLi5taWRkbGV3YXJlKTtcbiAgICAgICAgY29uc3QgYm91bmQgPSBmbGF0dGVuKGNvbXBvc2VyKTtcbiAgICAgICAgdGhpcy51c2UoYXN5bmMgKGN0eCwgbmV4dCkgPT4ge1xuICAgICAgICAgICAgbGV0IG5leHRDYWxsZWQgPSBmYWxzZTtcbiAgICAgICAgICAgIGNvbnN0IGNvbnQgPSAoKSA9PiAoKG5leHRDYWxsZWQgPSB0cnVlKSwgUHJvbWlzZS5yZXNvbHZlKCkpO1xuICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICBhd2FpdCBib3VuZChjdHgsIGNvbnQpO1xuICAgICAgICAgICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICAgICAgICAgICAgbmV4dENhbGxlZCA9IGZhbHNlO1xuICAgICAgICAgICAgICAgIGF3YWl0IGVycm9ySGFuZGxlcihuZXcgQm90RXJyb3I8Qz4oZXJyLCBjdHgpLCBjb250KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChuZXh0Q2FsbGVkKSBhd2FpdCBuZXh0KCk7XG4gICAgICAgIH0pO1xuICAgICAgICByZXR1cm4gY29tcG9zZXI7XG4gICAgfVxufVxuXG4vLyA9PT0gRmlsdGVyZWQgY29udGV4dCBtaWRkbGV3YXJlIHR5cGVzXG4vKipcbiAqIFR5cGUgb2YgdGhlIG1pZGRsZXdhcmUgdGhhdCBjYW4gYmUgcGFzc2VkIHRvIGBib3QuaGVhcnNgLlxuICpcbiAqIFRoaXMgaGVscGVyIHR5cGUgY2FuIGJlIHVzZWQgdG8gYW5ub3RhdGUgbWlkZGxld2FyZSBmdW5jdGlvbnMgdGhhdCBhcmVcbiAqIGRlZmluZWQgaW4gb25lIHBsYWNlLCBzbyB0aGF0IHRoZXkgaGF2ZSB0aGUgY29ycmVjdCB0eXBlIHdoZW4gcGFzc2VkIHRvXG4gKiBgYm90LmhlYXJzYCBpbiBhIGRpZmZlcmVudCBwbGFjZS4gRm9yIGluc3RhbmNlLCB0aGlzIGFsbG93cyBmb3IgbW9yZSBtb2R1bGFyXG4gKiBjb2RlIHdoZXJlIGhhbmRsZXJzIGFyZSBkZWZpbmVkIGluIHNlcGFyYXRlIGZpbGVzLlxuICovXG5leHBvcnQgdHlwZSBIZWFyc01pZGRsZXdhcmU8QyBleHRlbmRzIENvbnRleHQ+ID0gTWlkZGxld2FyZTxcbiAgICBIZWFyc0NvbnRleHQ8Qz5cbj47XG4vKipcbiAqIFR5cGUgb2YgdGhlIG1pZGRsZXdhcmUgdGhhdCBjYW4gYmUgcGFzc2VkIHRvIGBib3QuY29tbWFuZGAuXG4gKlxuICogVGhpcyBoZWxwZXIgdHlwZSBjYW4gYmUgdXNlZCB0byBhbm5vdGF0ZSBtaWRkbGV3YXJlIGZ1bmN0aW9ucyB0aGF0IGFyZVxuICogZGVmaW5lZCBpbiBvbmUgcGxhY2UsIHNvIHRoYXQgdGhleSBoYXZlIHRoZSBjb3JyZWN0IHR5cGUgd2hlbiBwYXNzZWQgdG9cbiAqIGBib3QuY29tbWFuZGAgaW4gYSBkaWZmZXJlbnQgcGxhY2UuIEZvciBpbnN0YW5jZSwgdGhpcyBhbGxvd3MgZm9yIG1vcmVcbiAqIG1vZHVsYXIgY29kZSB3aGVyZSBoYW5kbGVycyBhcmUgZGVmaW5lZCBpbiBzZXBhcmF0ZSBmaWxlcy5cbiAqL1xuZXhwb3J0IHR5cGUgQ29tbWFuZE1pZGRsZXdhcmU8QyBleHRlbmRzIENvbnRleHQ+ID0gTWlkZGxld2FyZTxcbiAgICBDb21tYW5kQ29udGV4dDxDPlxuPjtcbi8qKlxuICogVHlwZSBvZiB0aGUgbWlkZGxld2FyZSB0aGF0IGNhbiBiZSBwYXNzZWQgdG8gYGJvdC5yZWFjdGlvbmAuXG4gKlxuICogVGhpcyBoZWxwZXIgdHlwZSBjYW4gYmUgdXNlZCB0byBhbm5vdGF0ZSBtaWRkbGV3YXJlIGZ1bmN0aW9ucyB0aGF0IGFyZVxuICogZGVmaW5lZCBpbiBvbmUgcGxhY2UsIHNvIHRoYXQgdGhleSBoYXZlIHRoZSBjb3JyZWN0IHR5cGUgd2hlbiBwYXNzZWQgdG9cbiAqIGBib3QucmVhY3Rpb25gIGluIGEgZGlmZmVyZW50IHBsYWNlLiBGb3IgaW5zdGFuY2UsIHRoaXMgYWxsb3dzIGZvciBtb3JlXG4gKiBtb2R1bGFyIGNvZGUgd2hlcmUgaGFuZGxlcnMgYXJlIGRlZmluZWQgaW4gc2VwYXJhdGUgZmlsZXMuXG4gKi9cbmV4cG9ydCB0eXBlIFJlYWN0aW9uTWlkZGxld2FyZTxDIGV4dGVuZHMgQ29udGV4dD4gPSBNaWRkbGV3YXJlPFxuICAgIFJlYWN0aW9uQ29udGV4dDxDPlxuPjtcbi8qKlxuICogVHlwZSBvZiB0aGUgbWlkZGxld2FyZSB0aGF0IGNhbiBiZSBwYXNzZWQgdG8gYGJvdC5jYWxsYmFja1F1ZXJ5YC5cbiAqXG4gKiBUaGlzIGhlbHBlciB0eXBlIGNhbiBiZSB1c2VkIHRvIGFubm90YXRlIG1pZGRsZXdhcmUgZnVuY3Rpb25zIHRoYXQgYXJlXG4gKiBkZWZpbmVkIGluIG9uZSBwbGFjZSwgc28gdGhhdCB0aGV5IGhhdmUgdGhlIGNvcnJlY3QgdHlwZSB3aGVuIHBhc3NlZCB0b1xuICogYGJvdC5jYWxsYmFja1F1ZXJ5YCBpbiBhIGRpZmZlcmVudCBwbGFjZS4gRm9yIGluc3RhbmNlLCB0aGlzIGFsbG93cyBmb3IgbW9yZVxuICogbW9kdWxhciBjb2RlIHdoZXJlIGhhbmRsZXJzIGFyZSBkZWZpbmVkIGluIHNlcGFyYXRlIGZpbGVzLlxuICovXG5leHBvcnQgdHlwZSBDYWxsYmFja1F1ZXJ5TWlkZGxld2FyZTxDIGV4dGVuZHMgQ29udGV4dD4gPSBNaWRkbGV3YXJlPFxuICAgIENhbGxiYWNrUXVlcnlDb250ZXh0PEM+XG4+O1xuLyoqXG4gKiBUeXBlIG9mIHRoZSBtaWRkbGV3YXJlIHRoYXQgY2FuIGJlIHBhc3NlZCB0byBgYm90LmdhbWVRdWVyeWAuXG4gKlxuICogVGhpcyBoZWxwZXIgdHlwZSBjYW4gYmUgdXNlZCB0byBhbm5vdGF0ZSBtaWRkbGV3YXJlIGZ1bmN0aW9ucyB0aGF0IGFyZVxuICogZGVmaW5lZCBpbiBvbmUgcGxhY2UsIHNvIHRoYXQgdGhleSBoYXZlIHRoZSBjb3JyZWN0IHR5cGUgd2hlbiBwYXNzZWQgdG9cbiAqIGBib3QuZ2FtZVF1ZXJ5YCBpbiBhIGRpZmZlcmVudCBwbGFjZS4gRm9yIGluc3RhbmNlLCB0aGlzIGFsbG93cyBmb3IgbW9yZVxuICogbW9kdWxhciBjb2RlIHdoZXJlIGhhbmRsZXJzIGFyZSBkZWZpbmVkIGluIHNlcGFyYXRlIGZpbGVzLlxuICovXG5leHBvcnQgdHlwZSBHYW1lUXVlcnlNaWRkbGV3YXJlPEMgZXh0ZW5kcyBDb250ZXh0PiA9IE1pZGRsZXdhcmU8XG4gICAgR2FtZVF1ZXJ5Q29udGV4dDxDPlxuPjtcbi8qKlxuICogVHlwZSBvZiB0aGUgbWlkZGxld2FyZSB0aGF0IGNhbiBiZSBwYXNzZWQgdG8gYGJvdC5pbmxpbmVRdWVyeWAuXG4gKlxuICogVGhpcyBoZWxwZXIgdHlwZSBjYW4gYmUgdXNlZCB0byBhbm5vdGF0ZSBtaWRkbGV3YXJlIGZ1bmN0aW9ucyB0aGF0IGFyZVxuICogZGVmaW5lZCBpbiBvbmUgcGxhY2UsIHNvIHRoYXQgdGhleSBoYXZlIHRoZSBjb3JyZWN0IHR5cGUgd2hlbiBwYXNzZWQgdG9cbiAqIGBib3QuaW5saW5lUXVlcnlgIGluIGEgZGlmZmVyZW50IHBsYWNlLiBGb3IgaW5zdGFuY2UsIHRoaXMgYWxsb3dzIGZvciBtb3JlXG4gKiBtb2R1bGFyIGNvZGUgd2hlcmUgaGFuZGxlcnMgYXJlIGRlZmluZWQgaW4gc2VwYXJhdGUgZmlsZXMuXG4gKi9cbmV4cG9ydCB0eXBlIElubGluZVF1ZXJ5TWlkZGxld2FyZTxDIGV4dGVuZHMgQ29udGV4dD4gPSBNaWRkbGV3YXJlPFxuICAgIElubGluZVF1ZXJ5Q29udGV4dDxDPlxuPjtcbi8qKlxuICogVHlwZSBvZiB0aGUgbWlkZGxld2FyZSB0aGF0IGNhbiBiZSBwYXNzZWQgdG8gYGJvdC5jaG9zZW5JbmxpbmVSZXN1bHRgLlxuICpcbiAqIFRoaXMgaGVscGVyIHR5cGUgY2FuIGJlIHVzZWQgdG8gYW5ub3RhdGUgbWlkZGxld2FyZSBmdW5jdGlvbnMgdGhhdCBhcmVcbiAqIGRlZmluZWQgaW4gb25lIHBsYWNlLCBzbyB0aGF0IHRoZXkgaGF2ZSB0aGUgY29ycmVjdCB0eXBlIHdoZW4gcGFzc2VkIHRvXG4gKiBgYm90LmNob3NlbklubGluZVJlc3VsdGAgaW4gYSBkaWZmZXJlbnQgcGxhY2UuIEZvciBpbnN0YW5jZSwgdGhpcyBhbGxvd3MgZm9yXG4gKiBtb3JlIG1vZHVsYXIgY29kZSB3aGVyZSBoYW5kbGVycyBhcmUgZGVmaW5lZCBpbiBzZXBhcmF0ZSBmaWxlcy5cbiAqL1xuZXhwb3J0IHR5cGUgQ2hvc2VuSW5saW5lUmVzdWx0TWlkZGxld2FyZTxDIGV4dGVuZHMgQ29udGV4dD4gPSBNaWRkbGV3YXJlPFxuICAgIENob3NlbklubGluZVJlc3VsdENvbnRleHQ8Qz5cbj47XG4vKipcbiAqIFR5cGUgb2YgdGhlIG1pZGRsZXdhcmUgdGhhdCBjYW4gYmUgcGFzc2VkIHRvIGBib3QucHJlQ2hlY2tvdXRRdWVyeWAuXG4gKlxuICogVGhpcyBoZWxwZXIgdHlwZSBjYW4gYmUgdXNlZCB0byBhbm5vdGF0ZSBtaWRkbGV3YXJlIGZ1bmN0aW9ucyB0aGF0IGFyZVxuICogZGVmaW5lZCBpbiBvbmUgcGxhY2UsIHNvIHRoYXQgdGhleSBoYXZlIHRoZSBjb3JyZWN0IHR5cGUgd2hlbiBwYXNzZWQgdG9cbiAqIGBib3QucHJlQ2hlY2tvdXRRdWVyeWAgaW4gYSBkaWZmZXJlbnQgcGxhY2UuIEZvciBpbnN0YW5jZSwgdGhpcyBhbGxvd3MgZm9yXG4gKiBtb3JlIG1vZHVsYXIgY29kZSB3aGVyZSBoYW5kbGVycyBhcmUgZGVmaW5lZCBpbiBzZXBhcmF0ZSBmaWxlcy5cbiAqL1xuZXhwb3J0IHR5cGUgUHJlQ2hlY2tvdXRRdWVyeU1pZGRsZXdhcmU8QyBleHRlbmRzIENvbnRleHQ+ID0gTWlkZGxld2FyZTxcbiAgICBQcmVDaGVja291dFF1ZXJ5Q29udGV4dDxDPlxuPjtcbi8qKlxuICogVHlwZSBvZiB0aGUgbWlkZGxld2FyZSB0aGF0IGNhbiBiZSBwYXNzZWQgdG8gYGJvdC5zaGlwcGluZ1F1ZXJ5YC5cbiAqXG4gKiBUaGlzIGhlbHBlciB0eXBlIGNhbiBiZSB1c2VkIHRvIGFubm90YXRlIG1pZGRsZXdhcmUgZnVuY3Rpb25zIHRoYXQgYXJlXG4gKiBkZWZpbmVkIGluIG9uZSBwbGFjZSwgc28gdGhhdCB0aGV5IGhhdmUgdGhlIGNvcnJlY3QgdHlwZSB3aGVuIHBhc3NlZCB0b1xuICogYGJvdC5zaGlwcGluZ1F1ZXJ5YCBpbiBhIGRpZmZlcmVudCBwbGFjZS4gRm9yIGluc3RhbmNlLCB0aGlzIGFsbG93cyBmb3IgbW9yZVxuICogbW9kdWxhciBjb2RlIHdoZXJlIGhhbmRsZXJzIGFyZSBkZWZpbmVkIGluIHNlcGFyYXRlIGZpbGVzLlxuICovXG5leHBvcnQgdHlwZSBTaGlwcGluZ1F1ZXJ5TWlkZGxld2FyZTxDIGV4dGVuZHMgQ29udGV4dD4gPSBNaWRkbGV3YXJlPFxuICAgIFNoaXBwaW5nUXVlcnlDb250ZXh0PEM+XG4+O1xuLyoqXG4gKiBUeXBlIG9mIHRoZSBtaWRkbGV3YXJlIHRoYXQgY2FuIGJlIHBhc3NlZCB0byBgYm90LmNoYXRUeXBlYC5cbiAqXG4gKiBUaGlzIGhlbHBlciB0eXBlIGNhbiBiZSB1c2VkIHRvIGFubm90YXRlIG1pZGRsZXdhcmUgZnVuY3Rpb25zIHRoYXQgYXJlXG4gKiBkZWZpbmVkIGluIG9uZSBwbGFjZSwgc28gdGhhdCB0aGV5IGhhdmUgdGhlIGNvcnJlY3QgdHlwZSB3aGVuIHBhc3NlZCB0b1xuICogYGJvdC5jaGF0VHlwZWAgaW4gYSBkaWZmZXJlbnQgcGxhY2UuIEZvciBpbnN0YW5jZSwgdGhpcyBhbGxvd3MgZm9yIG1vcmVcbiAqIG1vZHVsYXIgY29kZSB3aGVyZSBoYW5kbGVycyBhcmUgZGVmaW5lZCBpbiBzZXBhcmF0ZSBmaWxlcy5cbiAqL1xuZXhwb3J0IHR5cGUgQ2hhdFR5cGVNaWRkbGV3YXJlPEMgZXh0ZW5kcyBDb250ZXh0LCBUIGV4dGVuZHMgQ2hhdFtcInR5cGVcIl0+ID1cbiAgICBNaWRkbGV3YXJlPENoYXRUeXBlQ29udGV4dDxDLCBUPj47XG4iXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsU0FLSSxPQUFPLFFBU0osZUFBZTtBQW9GdEIsd0JBQXdCO0FBQ3hCOzs7O0NBSUMsR0FDRCxPQUFPLE1BQU0saUJBQThDO0lBQzNCO0lBQWdDO0lBQTVELFlBQTRCLE9BQWdDLElBQVE7UUFDaEUsS0FBSyxDQUFDLHdCQUF3QjtxQkFETjttQkFBZ0M7UUFFeEQsSUFBSSxDQUFDLElBQUksR0FBRztRQUNaLElBQUksaUJBQWlCLE9BQU8sSUFBSSxDQUFDLEtBQUssR0FBRyxNQUFNLEtBQUs7SUFDeEQ7QUFDSixDQUFDO0FBQ0QsU0FBUyx3QkFBd0IsS0FBYyxFQUFFO0lBQzdDLElBQUk7SUFDSixJQUFJLGlCQUFpQixPQUFPO1FBQ3hCLE1BQU0sQ0FBQyxFQUFFLE1BQU0sSUFBSSxDQUFDLGdCQUFnQixFQUFFLE1BQU0sT0FBTyxDQUFDLENBQUM7SUFDekQsT0FBTztRQUNILE1BQU0sT0FBTyxPQUFPO1FBQ3BCLE1BQU0sQ0FBQyx3QkFBd0IsRUFBRSxLQUFLLHFCQUFxQixDQUFDO1FBQzVELE9BQVE7WUFDSixLQUFLO1lBQ0wsS0FBSztZQUNMLEtBQUs7WUFDTCxLQUFLO2dCQUNELE9BQU8sQ0FBQyxFQUFFLEVBQUUsTUFBTSxDQUFDO2dCQUNuQixLQUFNO1lBQ1YsS0FBSztnQkFDRCxPQUFPLENBQUMsRUFBRSxFQUFFLE9BQU8sT0FBTyxTQUFTLENBQUMsR0FBRyxJQUFJLENBQUM7Z0JBQzVDLEtBQU07WUFDVjtnQkFDSSxPQUFPO2dCQUNQLEtBQU07UUFDZDtJQUNKLENBQUM7SUFDRCxPQUFPO0FBQ1g7QUFFQSxnQ0FBZ0M7QUFDaEMsU0FBUyxRQUEyQixFQUFpQixFQUFtQjtJQUNwRSxPQUFPLE9BQU8sT0FBTyxhQUNmLEtBQ0EsQ0FBQyxLQUFLLE9BQVMsR0FB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