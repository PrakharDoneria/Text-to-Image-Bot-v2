// deno-lint-ignore-file camelcase
import { matchFilter } from "./filter.ts";
const checker = {
    filterQuery (filter) {
        const pred = matchFilter(filter);
        return (ctx)=>pred(ctx);
    },
    text (trigger) {
        const hasText = checker.filterQuery([
            ":text",
            ":caption"
        ]);
        const trg = triggerFn(trigger);
        return (ctx)=>{
            if (!hasText(ctx)) return false;
            const msg = ctx.message ?? ctx.channelPost;
            const txt = msg.text ?? msg.caption;
            return match(ctx, txt, trg);
        };
    },
    command (command) {
        const hasEntities = checker.filterQuery(":entities:bot_command");
        const atCommands = new Set();
        const noAtCommands = new Set();
        toArray(command).forEach((cmd)=>{
            if (cmd.startsWith("/")) {
                throw new Error(`Do not include '/' when registering command handlers (use '${cmd.substring(1)}' not '${cmd}')`);
            }
            const set = cmd.includes("@") ? atCommands : noAtCommands;
            set.add(cmd);
        });
        return (ctx)=>{
            if (!hasEntities(ctx)) return false;
            const msg = ctx.message ?? ctx.channelPost;
            const txt = msg.text ?? msg.caption;
            return msg.entities.some((e)=>{
                if (e.type !== "bot_command") return false;
                if (e.offset !== 0) return false;
                const cmd = txt.substring(1, e.length);
                if (noAtCommands.has(cmd) || atCommands.has(cmd)) {
                    ctx.match = txt.substring(cmd.length + 1).trimStart();
                    return true;
                }
                const index = cmd.indexOf("@");
                if (index === -1) return false;
                const atTarget = cmd.substring(index + 1).toLowerCase();
                const username = ctx.me.username.toLowerCase();
                if (atTarget !== username) return false;
                const atCommand = cmd.substring(0, index);
                if (noAtCommands.has(atCommand)) {
                    ctx.match = txt.substring(cmd.length + 1).trimStart();
                    return true;
                }
                return false;
            });
        };
    },
    reaction (reaction) {
        const hasMessageReaction = checker.filterQuery("message_reaction");
        const normalized = typeof reaction === "string" ? [
            {
                type: "emoji",
                emoji: reaction
            }
        ] : (Array.isArray(reaction) ? reaction : [
            reaction
        ]).map((emoji)=>typeof emoji === "string" ? {
                type: "emoji",
                emoji
            } : emoji);
        return (ctx)=>{
            if (!hasMessageReaction(ctx)) return false;
            const { old_reaction , new_reaction  } = ctx.messageReaction;
            for (const reaction of new_reaction){
                let isOld = false;
                if (reaction.type === "emoji") {
                    for (const old of old_reaction){
                        if (old.type !== "emoji") continue;
                        if (old.emoji === reaction.emoji) {
                            isOld = true;
                            break;
                        }
                    }
                } else if (reaction.type === "custom_emoji") {
                    for (const old of old_reaction){
                        if (old.type !== "custom_emoji") continue;
                        if (old.custom_emoji_id === reaction.custom_emoji_id) {
                            isOld = true;
                            break;
                        }
                    }
                } else {
                // always regard unsupported emoji types as new
                }
                if (!isOld) {
                    if (reaction.type === "emoji") {
                        for (const wanted of normalized){
                            if (wanted.type !== "emoji") continue;
                            if (wanted.emoji === reaction.emoji) {
                                return true;
                            }
                        }
                    } else if (reaction.type === "custom_emoji") {
                        for (const wanted of normalized){
                            if (wanted.type !== "custom_emoji") continue;
                            if (wanted.custom_emoji_id === reaction.custom_emoji_id) {
                                return true;
                            }
                        }
                    } else {
                        // always regard unsupported emoji types as new
                        return true;
                    }
                }
            }
            return false;
        };
    },
    chatType (chatType) {
        const set = new Set(toArray(chatType));
        return (ctx)=>ctx.chat?.type !== undefined && set.has(ctx.chat.type);
    },
    callbackQuery (trigger) {
        const hasCallbackQuery = checker.filterQuery("callback_query:data");
        const trg = triggerFn(trigger);
        return (ctx)=>hasCallbackQuery(ctx) && match(ctx, ctx.callbackQuery.data, trg);
    },
    gameQuery (trigger) {
        const hasGameQuery = checker.filterQuery("callback_query:game_short_name");
        const trg = triggerFn(trigger);
        return (ctx)=>hasGameQuery(ctx) && match(ctx, ctx.callbackQuery.game_short_name, trg);
    },
    inlineQuery (trigger) {
        const hasInlineQuery = checker.filterQuery("inline_query");
        const trg = triggerFn(trigger);
        return (ctx)=>hasInlineQuery(ctx) && match(ctx, ctx.inlineQuery.query, trg);
    },
    chosenInlineResult (trigger) {
        const hasChosenInlineResult = checker.filterQuery("chosen_inline_result");
        const trg = triggerFn(trigger);
        return (ctx)=>hasChosenInlineResult(ctx) && match(ctx, ctx.chosenInlineResult.result_id, trg);
    },
    preCheckoutQuery (trigger) {
        const hasPreCheckoutQuery = checker.filterQuery("pre_checkout_query");
        const trg = triggerFn(trigger);
        return (ctx)=>hasPreCheckoutQuery(ctx) && match(ctx, ctx.preCheckoutQuery.invoice_payload, trg);
    },
    shippingQuery (trigger) {
        const hasShippingQuery = checker.filterQuery("shipping_query");
        const trg = triggerFn(trigger);
        return (ctx)=>hasShippingQuery(ctx) && match(ctx, ctx.shippingQuery.invoice_payload, trg);
    }
};
// === Context class
/**
 * When your bot receives a message, Telegram sends an update object to your
 * bot. The update contains information about the chat, the user, and of course
 * the message itself. There are numerous other updates, too:
 * https://core.telegram.org/bots/api#update
 *
 * When grammY receives an update, it wraps this update into a context object
 * for you. Context objects are commonly named `ctx`. A context object does two
 * things:
 * 1. **`ctx.update`** holds the update object that you can use to process the
 *    message. This includes providing useful shortcuts for the update, for
 *    instance, `ctx.msg` is a shortcut that gives you the message object from
 *    the update—no matter whether it is contained in `ctx.update.message`, or
 *    `ctx.update.edited_message`, or `ctx.update.channel_post`, or
 *    `ctx.update.edited_channel_post`.
 * 2. **`ctx.api`** gives you access to the full Telegram Bot API so that you
 *    can directly call any method, such as responding via
 *    `ctx.api.sendMessage`. Also here, the context objects has some useful
 *    shortcuts for you. For instance, if you want to send a message to the same
 *    chat that a message comes from (i.e. just respond to a user) you can call
 *    `ctx.reply`. This is nothing but a wrapper for `ctx.api.sendMessage` with
 *    the right `chat_id` pre-filled for you. Almost all methods of the Telegram
 *    Bot API have their own shortcut directly on the context object, so you
 *    probably never really have to use `ctx.api` at all.
 *
 * This context object is then passed to all of the listeners (called
 * middleware) that you register on your bot. Because this is so useful, the
 * context object is often used to hold more information. One example are
 * sessions (a chat-specific data storage that is stored in a database), and
 * another example is `ctx.match` that is used by `bot.command` and other
 * methods to keep information about how a regular expression was matched.
 *
 * Read up about middleware on the
 * [website](https://grammy.dev/guide/context.html) if you want to know more
 * about the powerful opportunities that lie in context objects, and about how
 * grammY implements them.
 */ export class Context {
    update;
    api;
    me;
    /**
     * Used by some middleware to store information about how a certain string
     * or regular expression was matched.
     */ match;
    constructor(update, api, me){
        this.update = update;
        this.api = api;
        this.me = me;
    }
    // UPDATE SHORTCUTS
    /** Alias for `ctx.update.message` */ get message() {
        return this.update.message;
    }
    /** Alias for `ctx.update.edited_message` */ get editedMessage() {
        return this.update.edited_message;
    }
    /** Alias for `ctx.update.channel_post` */ get channelPost() {
        return this.update.channel_post;
    }
    /** Alias for `ctx.update.edited_channel_post` */ get editedChannelPost() {
        return this.update.edited_channel_post;
    }
    /** Alias for `ctx.update.business_connection` */ get businessConnection() {
        return this.update.business_connection;
    }
    /** Alias for `ctx.update.business_message` */ get businessMessage() {
        return this.update.business_message;
    }
    /** Alias for `ctx.update.edited_business_message` */ get editedBusinessMessage() {
        return this.update.edited_business_message;
    }
    /** Alias for `ctx.update.deleted_business_messages` */ get deletedBusinessMessages() {
        return this.update.deleted_business_messages;
    }
    /** Alias for `ctx.update.message_reaction` */ get messageReaction() {
        return this.update.message_reaction;
    }
    /** Alias for `ctx.update.message_reaction_count` */ get messageReactionCount() {
        return this.update.message_reaction_count;
    }
    /** Alias for `ctx.update.inline_query` */ get inlineQuery() {
        return this.update.inline_query;
    }
    /** Alias for `ctx.update.chosen_inline_result` */ get chosenInlineResult() {
        return this.update.chosen_inline_result;
    }
    /** Alias for `ctx.update.callback_query` */ get callbackQuery() {
        return this.update.callback_query;
    }
    /** Alias for `ctx.update.shipping_query` */ get shippingQuery() {
        return this.update.shipping_query;
    }
    /** Alias for `ctx.update.pre_checkout_query` */ get preCheckoutQuery() {
        return this.update.pre_checkout_query;
    }
    /** Alias for `ctx.update.poll` */ get poll() {
        return this.update.poll;
    }
    /** Alias for `ctx.update.poll_answer` */ get pollAnswer() {
        return this.update.poll_answer;
    }
    /** Alias for `ctx.update.my_chat_member` */ get myChatMember() {
        return this.update.my_chat_member;
    }
    /** Alias for `ctx.update.chat_member` */ get chatMember() {
        return this.update.chat_member;
    }
    /** Alias for `ctx.update.chat_join_request` */ get chatJoinRequest() {
        return this.update.chat_join_request;
    }
    /** Alias for `ctx.update.chat_boost` */ get chatBoost() {
        return this.update.chat_boost;
    }
    /** Alias for `ctx.update.removed_chat_boost` */ get removedChatBoost() {
        return this.update.removed_chat_boost;
    }
    // AGGREGATION SHORTCUTS
    /**
     * Get the message object from wherever possible. Alias for `this.message ??
     * this.editedMessage ?? this.channelPost ?? this.editedChannelPost ??
     * this.businessMessage ?? this.editedBusinessMessage ??
     * this.callbackQuery?.message`.
     */ get msg() {
        // Keep in sync with types in `filter.ts`.
        return this.message ?? this.editedMessage ?? this.channelPost ?? this.editedChannelPost ?? this.businessMessage ?? this.editedBusinessMessage ?? this.callbackQuery?.message;
    }
    /**
     * Get the chat object from wherever possible. Alias for `(this.msg ??
     * this.deletedBusinessMessages ?? this.messageReaction ??
     * this.messageReactionCount ?? this.myChatMember ??  this.chatMember ??
     * this.chatJoinRequest ?? this.chatBoost ??  this.removedChatBoost)?.chat`.
     */ get chat() {
        // Keep in sync with types in `filter.ts`.
        return (this.msg ?? this.deletedBusinessMessages ?? this.messageReaction ?? this.messageReactionCount ?? this.myChatMember ?? this.chatMember ?? this.chatJoinRequest ?? this.chatBoost ?? this.removedChatBoost)?.chat;
    }
    /**
     * Get the sender chat object from wherever possible. Alias for
     * `ctx.msg?.sender_chat`.
     */ get senderChat() {
        // Keep in sync with types in `filter.ts`.
        return this.msg?.sender_chat;
    }
    /**
     * Get the user object from wherever possible. Alias for
     * `(this.businessConnection ?? this.messageReaction ??
     * (this.chatBoost?.boost ?? this.removedChatBoost)?.source)?.user ??
     * (this.callbackQuery ?? this.msg ?? this.inlineQuery ??
     * this.chosenInlineResult ?? this.shippingQuery ?? this.preCheckoutQuery ??
     * this.myChatMember ?? this.chatMember ?? this.chatJoinRequest)?.from`.
     */ get from() {
        // Keep in sync with types in `filter.ts`.
        return (this.businessConnection ?? this.messageReaction ?? (this.chatBoost?.boost ?? this.removedChatBoost)?.source)?.user ?? (this.callbackQuery ?? this.msg ?? this.inlineQuery ?? this.chosenInlineResult ?? this.shippingQuery ?? this.preCheckoutQuery ?? this.myChatMember ?? this.chatMember ?? this.chatJoinRequest)?.from;
    }
    /**
     * Get the message identifier from wherever possible. Alias for
     * `this.msg?.message_id ?? this.messageReaction?.message_id ??
     * this.messageReactionCount?.message_id`.
     */ get msgId() {
        // Keep in sync with types in `filter.ts`.
        return this.msg?.message_id ?? this.messageReaction?.message_id ?? this.messageReactionCount?.message_id;
    }
    /**
     * Gets the chat identifier from wherever possible. Alias for `this.chat?.id
     * ?? this.businessConnection?.user_chat_id`.
     */ get chatId() {
        // Keep in sync with types in `filter.ts`.
        return this.chat?.id ?? this.businessConnection?.user_chat_id;
    }
    /**
     * Get the inline message identifier from wherever possible. Alias for
     * `(ctx.callbackQuery ?? ctx.chosenInlineResult)?.inline_message_id`.
     */ get inlineMessageId() {
        return this.callbackQuery?.inline_message_id ?? this.chosenInlineResult?.inline_message_id;
    }
    /**
     * Get the business connection identifier from wherever possible. Alias for
     * `this.msg?.business_connection_id ?? this.businessConnection?.id ??
     * this.deletedBusinessMessages?.business_connection_id`.
     */ get businessConnectionId() {
        return this.msg?.business_connection_id ?? this.businessConnection?.id ?? this.deletedBusinessMessages?.business_connection_id;
    }
    entities(types) {
        const message = this.msg;
        if (message === undefined) return [];
        const text = message.text ?? message.caption;
        if (text === undefined) return [];
        let entities = message.entities ?? message.caption_entities;
        if (entities === undefined) return [];
        if (types !== undefined) {
            const filters = new Set(toArray(types));
            entities = entities.filter((entity)=>filters.has(entity.type));
        }
        return entities.map((entity)=>({
                ...entity,
                text: text.substring(entity.offset, entity.offset + entity.length)
            }));
    }
    /**
     * Find out which reactions were added and removed in a `message_reaction`
     * update. This method looks at `ctx.messageReaction` and computes the
     * difference between the old reaction and the new reaction. It also groups
     * the reactions by emoji reactions and custom emoji reactions. For example,
     * the resulting object could look like this:
     * ```ts
     * {
     *   emoji: ['👍', '🎉']
     *   emojiAdded: ['🎉'],
     *   emojiKept: ['👍'],
     *   emojiRemoved: [],
     *   customEmoji: [],
     *   customEmojiAdded: [],
     *   customEmojiKept: [],
     *   customEmojiRemoved: ['id0123'],
     * }
     * ```
     * In the above example, a tada reaction was added by the user, and a custom
     * emoji reaction with the custom emoji 'id0123' was removed in the same
     * update. The user had already reacted with a thumbs up reaction, which
     * they left unchanged. As a result, the current reaction by the user is
     * thumbs up and tada. Note that the current reaction (both emoji and custom
     * emoji in one list) can also be obtained from
     * `ctx.messageReaction.new_reaction`.
     *
     * Remember that reaction updates only include information about the
     * reaction of a specific user. The respective message may have many more
     * reactions by other people which will not be included in this update.
     *
     * @returns An object containing information about the reaction update
     */ reactions() {
        const emoji = [];
        const emojiAdded = [];
        const emojiKept = [];
        const emojiRemoved = [];
        const customEmoji = [];
        const customEmojiAdded = [];
        const customEmojiKept = [];
        const customEmojiRemoved = [];
        const r = this.messageReaction;
        if (r !== undefined) {
            const { old_reaction , new_reaction  } = r;
            // group all current emoji in `emoji` and `customEmoji`
            for (const reaction of new_reaction){
                if (reaction.type === "emoji") {
                    emoji.push(reaction.emoji);
                } else if (reaction.type === "custom_emoji") {
                    customEmoji.push(reaction.custom_emoji_id);
                }
            }
            // temporarily move all old emoji to the *Removed arrays
            for (const reaction of old_reaction){
                if (reaction.type === "emoji") {
                    emojiRemoved.push(reaction.emoji);
                } else if (reaction.type === "custom_emoji") {
                    customEmojiRemoved.push(reaction.custom_emoji_id);
                }
            }
            // temporarily move all new emoji to the *Added arrays
            emojiAdded.push(...emoji);
            customEmojiAdded.push(...customEmoji);
            // drop common emoji from both lists and add them to `emojiKept`
            for(let i = 0; i < emojiRemoved.length; i++){
                const len = emojiAdded.length;
                if (len === 0) break;
                const rem = emojiRemoved[i];
                for(let j = 0; j < len; j++){
                    if (rem === emojiAdded[j]) {
                        emojiKept.push(rem);
                        emojiRemoved.splice(i, 1);
                        emojiAdded.splice(j, 1);
                        i--;
                        break;
                    }
                }
            }
            // drop common custom emoji from both lists and add them to `customEmojiKept`
            for(let i = 0; i < customEmojiRemoved.length; i++){
                const len = customEmojiAdded.length;
                if (len === 0) break;
                const rem = customEmojiRemoved[i];
                for(let j = 0; j < len; j++){
                    if (rem === customEmojiAdded[j]) {
                        customEmojiKept.push(rem);
                        customEmojiRemoved.splice(i, 1);
                        customEmojiAdded.splice(j, 1);
                        i--;
                        break;
                    }
                }
            }
        }
        return {
            emoji,
            emojiAdded,
            emojiKept,
            emojiRemoved,
            customEmoji,
            customEmojiAdded,
            customEmojiKept,
            customEmojiRemoved
        };
    }
    // PROBING SHORTCUTS
    /**
     * `Context.has` is an object that contains a number of useful functions for
     * probing context objects. Each of these functions can generate a predicate
     * function, to which you can pass context objects in order to check if a
     * condition holds for the respective context object.
     *
     * For example, you can call `Context.has.filterQuery(":text")` to generate
     * a predicate function that tests context objects for containing text:
     * ```ts
     * const hasText = Context.has.filterQuery(":text");
     *
     * if (hasText(ctx0)) {} // `ctx0` matches the filter query `:text`
     * if (hasText(ctx1)) {} // `ctx1` matches the filter query `:text`
     * if (hasText(ctx2)) {} // `ctx2` matches the filter query `:text`
     * ```
     * These predicate functions are used internally by the has-methods that are
     * installed on every context object. This means that calling
     * `ctx.has(":text")` is equivalent to
     * `Context.has.filterQuery(":text")(ctx)`.
     */ static has = checker;
    /**
     * Returns `true` if this context object matches the given filter query, and
     * `false` otherwise. This uses the same logic as `bot.on`.
     *
     * @param filter The filter query to check
     */ has(filter) {
        return Context.has.filterQuery(filter)(this);
    }
    /**
     * Returns `true` if this context object contains the given text, or if it
     * contains text that matches the given regular expression. It returns
     * `false` otherwise. This uses the same logic as `bot.hears`.
     *
     * @param trigger The string or regex to match
     */ hasText(trigger) {
        return Context.has.text(trigger)(this);
    }
    /**
     * Returns `true` if this context object contains the given command, and
     * `false` otherwise. This uses the same logic as `bot.command`.
     *
     * @param command The command to match
     */ hasCommand(command) {
        return Context.has.command(command)(this);
    }
    hasReaction(reaction) {
        return Context.has.reaction(reaction)(this);
    }
    /**
     * Returns `true` if this context object belongs to a chat with the given
     * chat type, and `false` otherwise. This uses the same logic as
     * `bot.chatType`.
     *
     * @param chatType The chat type to match
     */ hasChatType(chatType) {
        return Context.has.chatType(chatType)(this);
    }
    /**
     * Returns `true` if this context object contains the given callback query,
     * or if the contained callback query data matches the given regular
     * expression. It returns `false` otherwise. This uses the same logic as
     * `bot.callbackQuery`.
     *
     * @param trigger The string or regex to match
     */ hasCallbackQuery(trigger) {
        return Context.has.callbackQuery(trigger)(this);
    }
    /**
     * Returns `true` if this context object contains the given game query, or
     * if the contained game query matches the given regular expression. It
     * returns `false` otherwise. This uses the same logic as `bot.gameQuery`.
     *
     * @param trigger The string or regex to match
     */ hasGameQuery(trigger) {
        return Context.has.gameQuery(trigger)(this);
    }
    /**
     * Returns `true` if this context object contains the given inline query, or
     * if the contained inline query matches the given regular expression. It
     * returns `false` otherwise. This uses the same logic as `bot.inlineQuery`.
     *
     * @param trigger The string or regex to match
     */ hasInlineQuery(trigger) {
        return Context.has.inlineQuery(trigger)(this);
    }
    /**
     * Returns `true` if this context object contains the chosen inline result,
     * or if the contained chosen inline result matches the given regular
     * expression. It returns `false` otherwise. This uses the same logic as
     * `bot.chosenInlineResult`.
     *
     * @param trigger The string or regex to match
     */ hasChosenInlineResult(trigger) {
        return Context.has.chosenInlineResult(trigger)(this);
    }
    /**
     * Returns `true` if this context object contains the given pre-checkout
     * query, or if the contained pre-checkout query matches the given regular
     * expression. It returns `false` otherwise. This uses the same logic as
     * `bot.preCheckoutQuery`.
     *
     * @param trigger The string or regex to match
     */ hasPreCheckoutQuery(trigger) {
        return Context.has.preCheckoutQuery(trigger)(this);
    }
    /**
     * Returns `true` if this context object contains the given shipping query,
     * or if the contained shipping query matches the given regular expression.
     * It returns `false` otherwise. This uses the same logic as
     * `bot.shippingQuery`.
     *
     * @param trigger The string or regex to match
     */ hasShippingQuery(trigger) {
        return Context.has.shippingQuery(trigger)(this);
    }
    // API
    /**
     * Context-aware alias for `api.sendMessage`. Use this method to send text messages. On success, the sent Message is returned.
     *
     * @param text Text of the message to be sent, 1-4096 characters after entities parsing
     * @param other Optional remaining parameters, confer the official reference below
     * @param signal Optional `AbortSignal` to cancel the request
     *
     * **Official reference:** https://core.telegram.org/bots/api#sendmessage
     */ reply(text, other, signal) {
        return this.api.sendMessage(orThrow(this.chatId, "sendMessage"), text, {
            business_connection_id: this.businessConnectionId,
            ...other
        }, signal);
    }
    /**
     * Context-aware alias for `api.forwardMessage`. Use this method to forward messages of any kind. Service messages and messages with protected content can't be forwarded. On success, the sent Message is returned.
     *
     * @param chat_id Unique identifier for the target chat or username of the target channel (in the format @channelusername)
     * @param other Optional remaining parameters, confer the official reference below
     * @param signal Optional `AbortSignal` to cancel the request
     *
     * **Official reference:** https://core.telegram.org/bots/api#forwardmessage
     */ forwardMessage(chat_id, other, signal) {
        return this.api.forwardMessage(chat_id, orThrow(this.chatId, "forwardMessage"), orThrow(this.msgId, "forwardMessage"), other, signal);
    }
    /**
     * Context-aware alias for `api.forwardMessages`. Use this method to forward multiple messages of any kind. If some of the specified messages can't be found or forwarded, they are skipped. Service messages and messages with protected content can't be forwarded. Album grouping is kept for forwarded messages. On success, an array of MessageId of the sent messages is returned.
     *
     * @param chat_id Unique identifier for the target chat or username of the target channel (in the format @channelusername)
     * @param message_ids A list of 1-100 identifiers of messages in the current chat to forward. The identifiers must be specified in a strictly increasing order.
     * @param other Optional remaining parameters, confer the official reference below
     * @param signal Optional `AbortSignal` to cancel the request
     *
     * **Official reference:** https://core.telegram.org/bots/api#forwardmessages
     */ forwardMessages(chat_id, message_ids, other, signal) {
        return this.api.forwardMessages(chat_id, orThrow(this.chatId, "forwardMessages"), message_ids, other, signal);
    }
    /**
     * Context-aware alias for `api.copyMessage`. Use this method to copy messages of any kind. Service messages, paid media messages, giveaway messages, giveaway winners messages, and invoice messages can't be copied. A quiz poll can be copied only if the value of the field correct_option_id is known to the bot. The method is analogous to the method forwardMessage, but the copied message doesn't have a link to the original message. Returns the MessageId of the sent message on success.
     *
     * @param chat_id Unique identifier for the target chat or username of the target channel (in the format @channelusername)
     * @param other Optional remaining parameters, confer the official reference below
     * @param signal Optional `AbortSignal` to cancel the request
     *
     * **Official reference:** https://core.telegram.org/bots/api#copymessage
     */ copyMessage(chat_id, other, signal) {
        return this.api.copyMessage(chat_id, orThrow(this.chatId, "copyMessage"), orThrow(this.msgId, "copyMessage"), other, signal);
    }
    /**
     * Context-aware alias for `api.copyMessages`. Use this method to copy messages of any kind. If some of the specified messages can't be found or copied, they are skipped. Service messages, paid media messages, giveaway messages, giveaway winners messages, and invoice messages can't be copied. A quiz poll can be copied only if the value of the field correct_option_id is known to the bot. The method is analogous to the method forwardMessages, but the copied messages don't have a link to the original message. Album grouping is kept for copied messages. On success, an array of MessageId of the sent messages is returned.
     *
     * @param chat_id Unique identifier for the target chat or username of the target channel (in the format @channelusername)
     * @param message_ids A list of 1-100 identifiers of messages in the current chat to copy. The identifiers must be specified in a strictly increasing order.
     * @param other Optional remaining parameters, confer the official reference below
     * @param signal Optional `AbortSignal` to cancel the request
     *
     * **Official reference:** https://core.telegram.org/bots/api#copymessages
     */ copyMessages(chat_id, message_ids, other, signal) {
        return this.api.copyMessages(chat_id, orThrow(this.chatId, "copyMessages"), message_ids, other, signal);
    }
    /**
     * Context-aware alias for `api.sendPhoto`. Use this method to send photos. On success, the sent Message is returned.
     *
     * @param photo Photo to send. Pass a file_id as String to send a photo that exists on the Telegram servers (recommended), pass an HTTP URL as a String for Telegram to get a photo from the Internet, or upload a new photo using multipart/form-data. The photo must be at most 10 MB in size. The photo's width and height must not exceed 10000 in total. Width and height ratio must be at most 20.
     * @param other Optional remaining parameters, confer the official reference below
     * @param signal Optional `AbortSignal` to cancel the request
     *
     * **Official reference:** https://core.telegram.org/bots/api#sendphoto
     */ replyWithPhoto(photo, other, signal) {
        return this.api.sendPhoto(orThrow(this.chatId, "sendPhoto"), photo, {
            business_connection_id: this.businessConnectionId,
            ...other
        }, signal);
    }
    /**
     * Context-aware alias for `api.sendAudio`. Use this method to send audio files, if you want Telegram clients to display them in the music player. Your audio must be in the .MP3 or .M4A format. On success, the sent Message is returned. Bots can currently send audio files of up to 50 MB in size, this limit may be changed in the future.
     *
     * For sending voice messages, use the sendVoice method instead.
     *
     * @param audio Audio file to send. Pass a file_id as String to send an audio file that exists on the Telegram servers (recommended), pass an HTTP URL as a String for Telegram to get an audio file from the Internet, or upload a new one using multipart/form-data.
     * @param other Optional remaining parameters, confer the official reference below
     * @param signal Optional `AbortSignal` to cancel the request
     *
     * **Official reference:** https://core.telegram.org/bots/api#sendaudio
     */ replyWithAudio(audio, other, signal) {
        return this.api.sendAudio(orThrow(this.chatId, "sendAudio"), audio, {
            business_connection_id: this.businessConnectionId,
            ...other
        }, signal);
    }
    /**
     * Context-aware alias for `api.sendDocument`. Use this method to send general files. On success, the sent Message is returned. Bots can currently send files of any type of up to 50 MB in size, this limit may be changed in the future.
     *
     * @param document File to send. Pass a file_id as String to send a file that exists on the Telegram servers (recommended), pass an HTTP URL as a String for Telegram to get a file from the Internet, or upload a new one using multipart/form-data.
     * @param other Optional remaining parameters, confer the official reference below
     * @param signal Optional `AbortSignal` to cancel the request
     *
     * **Official reference:** https://core.telegram.org/bots/api#senddocument
     */ replyWithDocument(document, other, signal) {
        return this.api.sendDocument(orThrow(this.chatId, "sendDocument"), document, {
            business_connection_id: this.businessConnectionId,
            ...other
        }, signal);
    }
    /**
     * Context-aware alias for `api.sendVideo`. Use this method to send video files, Telegram clients support mp4 videos (other formats may be sent as Document). On success, the sent Message is returned. Bots can currently send video files of up to 50 MB in size, this limit may be changed in the future.
     *
     * @param video Video to send. Pass a file_id as String to send a video that exists on the Telegram servers (recommended), pass an HTTP URL as a String for Telegram to get a video from the Internet, or upload a new video using multipart/form-data.
     * @param other Optional remaining parameters, confer the official reference below
     * @param signal Optional `AbortSignal` to cancel the request
     *
     * **Official reference:** https://core.telegram.org/bots/api#sendvideo
     */ replyWithVideo(video, other, signal) {
        return this.api.sendVideo(orThrow(this.chatId, "sendVideo"), video, {
            business_connection_id: this.businessConnectionId,
            ...other
        }, signal);
    }
    /**
     * Context-aware alias for `api.sendAnimation`. Use this method to send animation files (GIF or H.264/MPEG-4 AVC video without sound). On success, the sent Message is returned. Bots can currently send animation files of up to 50 MB in size, this limit may be changed in the future.
     *
     * @param animation Animation to send. Pass a file_id as String to send an animation that exists on the Telegram servers (recommended), pass an HTTP URL as a String for Telegram to get an animation from the Internet, or upload a new animation using multipart/form-data.
     * @param other Optional remaining parameters, confer the official reference below
     * @param signal Optional `AbortSignal` to cancel the request
     *
     * **Official reference:** https://core.telegram.org/bots/api#sendanimation
     */ replyWithAnimation(animation, other, signal) {
        return this.api.sendAnimation(orThrow(this.chatId, "sendAnimation"), animation, {
            business_connection_id: this.businessConnectionId,
            ...other
        }, signal);
    }
    /**
     * Context-aware alias for `api.sendVoice`. Use this method to send audio files, if you want Telegram clients to display the file as a playable voice message. For this to work, your audio must be in an .OGG file encoded with OPUS (other formats may be sent as Audio or Document). On success, the sent Message is returned. Bots can currently send voice messages of up to 50 MB in size, this limit may be changed in the future.
     *
     * @param voice Audio file to send. Pass a file_id as String to send a file that exists on the Telegram servers (recommended), pass an HTTP URL as a String for Telegram to get a file from the Internet, or upload a new one using multipart/form-data.
     * @param other Optional remaining parameters, confer the official reference below
     * @param signal Optional `AbortSignal` to cancel the request
     *
     * **Official reference:** https://core.telegram.org/bots/api#sendvoice
     */ replyWithVoice(voice, other, signal) {
        return this.api.sendVoice(orThrow(this.chatId, "sendVoice"), voice, {
            business_connection_id: this.businessConnectionId,
            ...other
        }, signal);
    }
    /**
     * Context-aware alias for `api.sendVideoNote`. Use this method to send video messages. On success, the sent Message is returned.
     * As of v.4.0, Telegram clients support rounded square mp4 videos of up to 1 minute long.
     *
     * @param video_note Video note to send. Pass a file_id as String to send a video note that exists on the Telegram servers (recommended) or upload a new video using multipart/form-data.. Sending video notes by a URL is currently unsupported
     * @param other Optional remaining parameters, confer the official reference below
     * @param signal Optional `AbortSignal` to cancel the request
     *
     * **Official reference:** https://core.telegram.org/bots/api#sendvideonote
     */ replyWithVideoNote(video_note, other, signal) {
        return this.api.sendVideoNote(orThrow(this.chatId, "sendVideoNote"), video_note, {
            business_connection_id: this.businessConnectionId,
            ...other
        }, signal);
    }
    /**
     * Context-aware alias for `api.sendMediaGroup`. Use this method to send a group of photos, videos, documents or audios as an album. Documents and audio files can be only grouped in an album with messages of the same type. On success, an array of Messages that were sent is returned.
     *
     * @param media An array describing messages to be sent, must include 2-10 items
     * @param other Optional remaining parameters, confer the official reference below
     * @param signal Optional `AbortSignal` to cancel the request
     *
     * **Official reference:** https://core.telegram.org/bots/api#sendmediagroup
     */ replyWithMediaGroup(media, other, signal) {
        return this.api.sendMediaGroup(orThrow(this.chatId, "sendMediaGroup"), media, {
            business_connection_id: this.businessConnectionId,
            ...other
        }, signal);
    }
    /**
     * Context-aware alias for `api.sendLocation`. Use this method to send point on the map. On success, the sent Message is returned.
     *
     * @param latitude Latitude of the location
     * @param longitude Longitude of the location
     * @param other Optional remaining parameters, confer the official reference below
     * @param signal Optional `AbortSignal` to cancel the request
     *
     * **Official reference:** https://core.telegram.org/bots/api#sendlocation
     */ replyWithLocation(latitude, longitude, other, signal) {
        return this.api.sendLocation(orThrow(this.chatId, "sendLocation"), latitude, longitude, {
            business_connection_id: this.businessConnectionId,
            ...other
        }, signal);
    }
    /**
     * Context-aware alias for `api.editMessageLiveLocation`. Use this method to edit live location messages. A location can be edited until its live_period expires or editing is explicitly disabled by a call to stopMessageLiveLocation. On success, if the edited message is not an inline message, the edited Message is returned, otherwise True is returned.
     *
     * @param latitude Latitude of new location
     * @param longitude Longitude of new location
     * @param other Optional remaining parameters, confer the official reference below
     * @param signal Optional `AbortSignal` to cancel the request
     *
     * **Official reference:** https://core.telegram.org/bots/api#editmessagelivelocation
     */ editMessageLiveLocation(latitude, longitude, other, signal) {
        const inlineId = this.inlineMessageId;
        return inlineId !== undefined ? this.api.editMessageLiveLocationInline(inlineId, latitude, longitude, other) : this.api.editMessageLiveLocation(orThrow(this.chatId, "editMessageLiveLocation"), orThrow(this.msgId, "editMessageLiveLocation"), latitude, longitude, other, signal);
    }
    /**
     * Context-aware alias for `api.stopMessageLiveLocation`. Use this method to stop updating a live location message before live_period expires. On success, if the message is not an inline message, the edited Message is returned, otherwise True is returned.
     *
     * @param other Optional remaining parameters, confer the official reference below
     * @param signal Optional `AbortSignal` to cancel the request
     *
     * **Official reference:** https://core.telegram.org/bots/api#stopmessagelivelocation
     */ stopMessageLiveLocation(other, signal) {
        const inlineId = this.inlineMessageId;
        return inlineId !== undefined ? this.api.stopMessageLiveLocationInline(inlineId, other) : this.api.stopMessageLiveLocation(orThrow(this.chatId, "stopMessageLiveLocation"), orThrow(this.msgId, "stopMessageLiveLocation"), other, signal);
    }
    /**
     * Context-aware alias for `api.sendPaidMedia`. Use this method to send paid media to channel chats. On success, the sent Message is returned.
     *
     * @param star_count The number of Telegram Stars that must be paid to buy access to the media
     * @param media An array describing the media to be sent; up to 10 items
     * @param other Optional remaining parameters, confer the official reference below
     * @param signal Optional `AbortSignal` to cancel the request
     *
     * **Official reference:** https://core.telegram.org/bots/api#sendpaidmedia
     */ sendPaidMedia(star_count, media, other, signal) {
        return this.api.sendPaidMedia(orThrow(this.chatId, "sendPaidMedia"), star_count, media, other, signal);
    }
    /**
     * Context-aware alias for `api.sendVenue`. Use this method to send information about a venue. On success, the sent Message is returned.
     *
     * @param latitude Latitude of the venue
     * @param longitude Longitude of the venue
     * @param title Name of the venue
     * @param address Address of the venue
     * @param other Optional remaining parameters, confer the official reference below
     * @param signal Optional `AbortSignal` to cancel the request
     *
     * **Official reference:** https://core.telegram.org/bots/api#sendvenue
     */ replyWithVenue(latitude, longitude, title, address, other, signal) {
        return this.api.sendVenue(orThrow(this.chatId, "sendVenue"), latitude, longitude, title, address, {
            business_connection_id: this.businessConnectionId,
            ...other
        }, signal);
    }
    /**
     * Context-aware alias for `api.sendContact`. Use this method to send phone contacts. On success, the sent Message is returned.
     *
     * @param phone_number Contact's phone number
     * @param first_name Contact's first name
     * @param other Optional remaining parameters, confer the official reference below
     * @param signal Optional `AbortSignal` to cancel the request
     *
     * **Official reference:** https://core.telegram.org/bots/api#sendcontact
     */ replyWithContact(phone_number, first_name, other, signal) {
        return this.api.sendContact(orThrow(this.chatId, "sendContact"), phone_number, first_name, {
            business_connection_id: this.businessConnectionId,
            ...other
        }, signal);
    }
    /**
     * Context-aware alias for `api.sendPoll`. Use this method to send a native poll. On success, the sent Message is returned.
     *
     * @param question Poll question, 1-300 characters
     * @param options A list of answer options, 2-10 strings 1-100 characters each
     * @param other Optional remaining parameters, confer the official reference below
     * @param signal Optional `AbortSignal` to cancel the request
     *
     * **Official reference:** https://core.telegram.org/bots/api#sendpoll
     */ replyWithPoll(question, options, other, signal) {
        return this.api.sendPoll(orThrow(this.chatId, "sendPoll"), question, options, {
            business_connection_id: this.businessConnectionId,
            ...other
        }, signal);
    }
    /**
     * Context-aware alias for `api.sendDice`. Use this method to send an animated emoji that will display a random value. On success, the sent Message is returned.
     *
     * @param emoji Emoji on which the dice throw animation is based. Currently, must be one of “🎲”, “🎯”, “🏀”, “⚽”, or “🎰”. Dice can have values 1-6 for “🎲” and “🎯”, values 1-5 for “🏀” and “⚽”, and values 1-64 for “🎰”. Defaults to “🎲”
     * @param other Optional remaining parameters, confer the official reference below
     * @param signal Optional `AbortSignal` to cancel the request
     *
     * **Official reference:** https://core.telegram.org/bots/api#senddice
     */ replyWithDice(emoji, other, signal) {
        return this.api.sendDice(orThrow(this.chatId, "sendDice"), emoji, {
            business_connection_id: this.businessConnectionId,
            ...other
        }, signal);
    }
    /**
     * Context-aware alias for `api.sendChatAction`. Use this method when you need to tell the user that something is happening on the bot's side. The status is set for 5 seconds or less (when a message arrives from your bot, Telegram clients clear its typing status). Returns True on success.
     *
     * Example: The ImageBot needs some time to process a request and upload the image. Instead of sending a text message along the lines of “Retrieving image, please wait…”, the bot may use sendChatAction with action = upload_photo. The user will see a “sending photo” status for the bot.
     *
     * We only recommend using this method when a response from the bot will take a noticeable amount of time to arrive.
     *
     * @param action Type of action to broadcast. Choose one, depending on what the user is about to receive: typing for text messages, upload_photo for photos, record_video or upload_video for videos, record_voice or upload_voice for voice notes, upload_document for general files, choose_sticker for stickers, find_location for location data, record_video_note or upload_video_note for video notes.
     * @param other Optional remaining parameters, confer the official reference below
     * @param signal Optional `AbortSignal` to cancel the request
     *
     * **Official reference:** https://core.telegram.org/bots/api#sendchataction
     */ replyWithChatAction(action, other, signal) {
        return this.api.sendChatAction(orThrow(this.chatId, "sendChatAction"), action, {
            business_connection_id: this.businessConnectionId,
            ...other
        }, signal);
    }
    /**
     * Context-aware alias for `api.setMessageReaction`. Use this method to change the chosen reactions on a message. Service messages can't be reacted to. Automatically forwarded messages from a channel to its discussion group have the same available reactions as messages in the channel. In albums, bots must react to the first message. Returns True on success.
     *
     * @param reaction A list of reaction types to set on the message. Currently, as non-premium users, bots can set up to one reaction per message. A custom emoji reaction can be used if it is either already present on the message or explicitly allowed by chat administrators.
     * @param other Optional remaining parameters, confer the official reference below
     * @param signal Optional `AbortSignal` to cancel the request
     *
     * **Official reference:** https://core.telegram.org/bots/api#setmessagereaction
     */ react(reaction, other, signal) {
        return this.api.setMessageReaction(orThrow(this.chatId, "setMessageReaction"), orThrow(this.msgId, "setMessageReaction"), typeof reaction === "string" ? [
            {
                type: "emoji",
                emoji: reaction
            }
        ] : (Array.isArray(reaction) ? reaction : [
            reaction
        ]).map((emoji)=>typeof emoji === "string" ? {
                type: "emoji",
                emoji
            } : emoji), other, signal);
    }
    /**
     * Context-aware alias for `api.getUserProfilePhotos`. Use this method to get a list of profile pictures for a user. Returns a UserProfilePhotos object.
     *
     * @param user_id Unique identifier of the target user
     * @param other Optional remaining parameters, confer the official reference below
     * @param signal Optional `AbortSignal` to cancel the request
     *
     * **Official reference:** https://core.telegram.org/bots/api#getuserprofilephotos
     */ getUserProfilePhotos(other, signal) {
        return this.api.getUserProfilePhotos(orThrow(this.from, "getUserProfilePhotos").id, other, signal);
    }
    /**
     * Context-aware alias for `api.getUserChatBoosts`. Use this method to get the list of boosts added to a chat by a user. Requires administrator rights in the chat. Returns a UserChatBoosts object.
     *
     * @param chat_id Unique identifier for the chat or username of the channel (in the format @channelusername)
     * @param signal Optional `AbortSignal` to cancel the request
     *
     * **Official reference:** https://core.telegram.org/bots/api#getuserchatboosts
     */ getUserChatBoosts(chat_id, signal) {
        return this.api.getUserChatBoosts(chat_id, orThrow(this.from, "getUserChatBoosts").id, signal);
    }
    /**
     *  Context-aware alias for `api.getBusinessConnection`. Use this method to get information about the connection of the bot with a business account. Returns a BusinessConnection object on success.
     * @param signal Optional `AbortSignal` to cancel the request
     *
     * **Official reference:** https://core.telegram.org/bots/api#getbusinessconnection
     */ getBusinessConnection(signal) {
        return this.api.getBusinessConnection(orThrow(this.businessConnectionId, "getBusinessConnection"), signal);
    }
    /**
     * Context-aware alias for `api.getFile`. Use this method to get basic info about a file and prepare it for downloading. For the moment, bots can download files of up to 20MB in size. On success, a File object is returned. The file can then be downloaded via the link https://api.telegram.org/file/bot<token>/<file_path>, where <file_path> is taken from the response. It is guaranteed that the link will be valid for at least 1 hour. When the link expires, a new one can be requested by calling getFile again.
     *
     * Note: This function may not preserve the original file name and MIME type. You should save the file's MIME type and name (if available) when the File object is received.
     *
     * @param signal Optional `AbortSignal` to cancel the request
     *
     * **Official reference:** https://core.telegram.org/bots/api#getfile
     */ getFile(signal) {
        const m = orThrow(this.msg, "getFile");
        const file = m.photo !== undefined ? m.photo[m.photo.length - 1] : m.animation ?? m.audio ?? m.document ?? m.video ?? m.video_note ?? m.voice ?? m.sticker;
        return this.api.getFile(orThrow(file, "getFile").file_id, signal);
    }
    /** @deprecated Use `banAuthor` instead. */ kickAuthor(...args) {
        return this.banAuthor(...args);
    }
    /**
     * Context-aware alias for `api.banChatMember`. Use this method to ban a user in a group, a supergroup or a channel. In the case of supergroups and channels, the user will not be able to return to the chat on their own using invite links, etc., unless unbanned first. The bot must be an administrator in the chat for this to work and must have the appropriate administrator rights. Returns True on success.
     *
     * @param other Optional remaining parameters, confer the official reference below
     * @param signal Optional `AbortSignal` to cancel the request
     *
     * **Official reference:** https://core.telegram.org/bots/api#banchatmember
     */ banAuthor(other, signal) {
        return this.api.banChatMember(orThrow(this.chatId, "banAuthor"), orThrow(this.from, "banAuthor").id, other, signal);
    }
    /** @deprecated Use `banChatMember` instead. */ kickChatMember(...args) {
        return this.banChatMember(...args);
    }
    /**
     * Context-aware alias for `api.banChatMember`. Use this method to ban a user in a group, a supergroup or a channel. In the case of supergroups and channels, the user will not be able to return to the chat on their own using invite links, etc., unless unbanned first. The bot must be an administrator in the chat for this to work and must have the appropriate administrator rights. Returns True on success.
     *
     * @param user_id Unique identifier of the target user
     * @param other Optional remaining parameters, confer the official reference below
     * @param signal Optional `AbortSignal` to cancel the request
     *
     * **Official reference:** https://core.telegram.org/bots/api#banchatmember
     */ banChatMember(user_id, other, signal) {
        return this.api.banChatMember(orThrow(this.chatId, "banChatMember"), user_id, other, signal);
    }
    /**
     * Context-aware alias for `api.unbanChatMember`. Use this method to unban a previously banned user in a supergroup or channel. The user will not return to the group or channel automatically, but will be able to join via link, etc. The bot must be an administrator for this to work. By default, this method guarantees that after the call the user is not a member of the chat, but will be able to join it. So if the user is a member of the chat they will also be removed from the chat. If you don't want this, use the parameter only_if_banned. Returns True on success.
     *
     * @param user_id Unique identifier of the target user
     * @param other Optional remaining parameters, confer the official reference below
     * @param signal Optional `AbortSignal` to cancel the request
     *
     * **Official reference:** https://core.telegram.org/bots/api#unbanchatmember
     */ unbanChatMember(user_id, other, signal) {
        return this.api.unbanChatMember(orThrow(this.chatId, "unbanChatMember"), user_id, other, signal);
    }
    /**
     * Context-aware alias for `api.restrictChatMember`. Use this method to restrict a user in a supergroup. The bot must be an administrator in the supergroup for this to work and must have the appropriate administrator rights. Pass True for all permissions to lift restrictions from a user. Returns True on success.
     *
     * @param permissions An object for new user permissions
     * @param other Optional remaining parameters, confer the official reference below
     * @param signal Optional `AbortSignal` to cancel the request
     *
     * **Official reference:** https://core.telegram.org/bots/api#restrictchatmember
     */ restrictAuthor(permissions, other, signal) {
        return this.api.restrictChatMember(orThrow(this.chatId, "restrictAuthor"), orThrow(this.from, "restrictAuthor").id, permissions, other, signal);
    }
    /**
     * Context-aware alias for `api.restrictChatMember`. Use this method to restrict a user in a supergroup. The bot must be an administrator in the supergroup for this to work and must have the appropriate administrator rights. Pass True for all permissions to lift restrictions from a user. Returns True on success.
     *
     * @param user_id Unique identifier of the target user
     * @param permissions An object for new user permissions
     * @param other Optional remaining parameters, confer the official reference below
     * @param signal Optional `AbortSignal` to cancel the request
     *
     * **Official reference:** https://core.telegram.org/bots/api#restrictchatmember
     */ restrictChatMember(user_id, permissions, other, signal) {
        return this.api.restrictChatMember(orThrow(this.chatId, "restrictChatMember"), user_id, permissions, other, signal);
    }
    /**
     * Context-aware alias for `api.promoteChatMember`. Use this method to promote or demote a user in a supergroup or a channel. The bot must be an administrator in the chat for this to work and must have the appropriate administrator rights. Pass False for all boolean parameters to demote a user. Returns True on success.
     *
     * @param other Optional remaining parameters, confer the official reference below
     * @param signal Optional `AbortSignal` to cancel the request
     *
     * **Official reference:** https://core.telegram.org/bots/api#promotechatmember
     */ promoteAuthor(other, signal) {
        return this.api.promoteChatMember(orThrow(this.chatId, "promoteAuthor"), orThrow(this.from, "promoteAuthor").id, other, signal);
    }
    /**
     * Context-aware alias for `api.promoteChatMember`. Use this method to promote or demote a user in a supergroup or a channel. The bot must be an administrator in the chat for this to work and must have the appropriate administrator rights. Pass False for all boolean parameters to demote a user. Returns True on success.
     *
     * @param user_id Unique identifier of the target user
     * @param other Optional remaining parameters, confer the official reference below
     * @param signal Optional `AbortSignal` to cancel the request
     *
     * **Official reference:** https://core.telegram.org/bots/api#promotechatmember
     */ promoteChatMember(user_id, other, signal) {
        return this.api.promoteChatMember(orThrow(this.chatId, "promoteChatMember"), user_id, other, signal);
    }
    /**
     * Context-aware alias for `api.setChatAdministratorCustomTitle`. Use this method to set a custom title for an administrator in a supergroup promoted by the bot. Returns True on success.
     *
     * @param custom_title New custom title for the administrator; 0-16 characters, emoji are not allowed
     * @param signal Optional `AbortSignal` to cancel the request
     *
     * **Official reference:** https://core.telegram.org/bots/api#setchatadministratorcustomtitle
     */ setChatAdministratorAuthorCustomTitle(custom_title, signal) {
        return this.api.setChatAdministratorCustomTitle(orThrow(this.chatId, "setChatAdministratorAuthorCustomTitle"), orThrow(this.from, "setChatAdministratorAuthorCustomTitle").id, custom_title, signal);
    }
    /**
     * Context-aware alias for `api.setChatAdministratorCustomTitle`. Use this method to set a custom title for an administrator in a supergroup promoted by the bot. Returns True on success.
     *
     * @param user_id Unique identifier of the target user
     * @param custom_title New custom title for the administrator; 0-16 characters, emoji are not allowed
     * @param signal Optional `AbortSignal` to cancel the request
     *
     * **Official reference:** https://core.telegram.org/bots/api#setchatadministratorcustomtitle
     */ setChatAdministratorCustomTitle(user_id, custom_title, signal) {
        return this.api.setChatAdministratorCustomTitle(orThrow(this.chatId, "setChatAdministratorCustomTitle"), user_id, custom_title, signal);
    }
    /**
     * Context-aware alias for `api.banChatSenderChat`. Use this method to ban a channel chat in a supergroup or a channel. Until the chat is unbanned, the owner of the banned chat won't be able to send messages on behalf of any of their channels. The bot must be an administrator in the supergroup or channel for this to work and must have the appropriate administrator rights. Returns True on success.
     *
     * @param sender_chat_id Unique identifier of the target sender chat
     * @param signal Optional `AbortSignal` to cancel the request
     *
     * **Official reference:** https://core.telegram.org/bots/api#banchatsenderchat
     */ banChatSenderChat(sender_chat_id, signal) {
        return this.api.banChatSenderChat(orThrow(this.chatId, "banChatSenderChat"), sender_chat_id, signal);
    }
    /**
     * Context-aware alias for `api.unbanChatSenderChat`. Use this method to unban a previously banned channel chat in a supergroup or channel. The bot must be an administrator for this to work and must have the appropriate administrator rights. Returns True on success.
     *
     * @param sender_chat_id Unique identifier of the target sender chat
     * @param signal Optional `AbortSignal` to cancel the request
     *
     * **Official reference:** https://core.telegram.org/bots/api#unbanchatsenderchat
     */ unbanChatSenderChat(sender_chat_id, signal) {
        return this.api.unbanChatSenderChat(orThrow(this.chatId, "unbanChatSenderChat"), sender_chat_id, signal);
    }
    /**
     * Context-aware alias for `api.setChatPermissions`. Use this method to set default chat permissions for all members. The bot must be an administrator in the group or a supergroup for this to work and must have the can_restrict_members administrator rights. Returns True on success.
     *
     * @param permissions New default chat permissions
     * @param other Optional remaining parameters, confer the official reference below
     * @param signal Optional `AbortSignal` to cancel the request
     *
     * **Official reference:** https://core.telegram.org/bots/api#setchatpermissions
     */ setChatPermissions(permissions, other, signal) {
        return this.api.setChatPermissions(orThrow(this.chatId, "setChatPermissions"), permissions, other, signal);
    }
    /**
     * Context-aware alias for `api.exportChatInviteLink`. Use this method to generate a new primary invite link for a chat; any previously generated primary link is revoked. The bot must be an administrator in the chat for this to work and must have the appropriate administrator rights. Returns the new invite link as String on success.
     *
     * Note: Each administrator in a chat generates their own invite links. Bots can't use invite links generated by other administrators. If you want your bot to work with invite links, it will need to generate its own link using exportChatInviteLink or by calling the getChat method. If your bot needs to generate a new primary invite link replacing its previous one, use exportChatInviteLink again.
     *
     * @param signal Optional `AbortSignal` to cancel the request
     *
     * **Official reference:** https://core.telegram.org/bots/api#exportchatinvitelink
     */ exportChatInviteLink(signal) {
        return this.api.exportChatInviteLink(orThrow(this.chatId, "exportChatInviteLink"), signal);
    }
    /**
     * Context-aware alias for `api.createChatInviteLink`. Use this method to create an additional invite link for a chat. The bot must be an administrator in the chat for this to work and must have the appropriate administrator rights. The link can be revoked using the method revokeChatInviteLink. Returns the new invite link as ChatInviteLink object.
     *
     * @param other Optional remaining parameters, confer the official reference below
     * @param signal Optional `AbortSignal` to cancel the request
     *
     * **Official reference:** https://core.telegram.org/bots/api#createchatinvitelink
     */ createChatInviteLink(other, signal) {
        return this.api.createChatInviteLink(orThrow(this.chatId, "createChatInviteLink"), other, signal);
    }
    /**
     *  Context-aware alias for `api.editChatInviteLink`. Use this method to edit a non-primary invite link created by the bot. The bot must be an administrator in the chat for this to work and must have the appropriate administrator rights. Returns the edited invite link as a ChatInviteLink object.
     *
     * @param invite_link The invite link to edit
     * @param other Optional remaining parameters, confer the official reference below
     * @param signal Optional `AbortSignal` to cancel the request
     *
     * **Official reference:** https://core.telegram.org/bots/api#editchatinvitelink
     */ editChatInviteLink(invite_link, other, signal) {
        return this.api.editChatInviteLink(orThrow(this.chatId, "editChatInviteLink"), invite_link, other, signal);
    }
    /**
     *  Context-aware alias for `api.revokeChatInviteLink`. Use this method to revoke an invite link created by the bot. If the primary link is revoked, a new link is automatically generated. The bot must be an administrator in the chat for this to work and must have the appropriate administrator rights. Returns the revoked invite link as ChatInviteLink object.
     *
     * @param invite_link The invite link to revoke
     * @param signal Optional `AbortSignal` to cancel the request
     *
     * **Official reference:** https://core.telegram.org/bots/api#revokechatinvitelink
     */ revokeChatInviteLink(invite_link, signal) {
        return this.api.revokeChatInviteLink(orThrow(this.chatId, "editChatInviteLink"), invite_link, signal);
    }
    /**
     * Context-aware alias for `api.approveChatJoinRequest`. Use this method to approve a chat join request. The bot must be an administrator in the chat for this to work and must have the can_invite_users administrator right. Returns True on success.
     *
     * @param user_id Unique identifier of the target user
     * @param signal Optional `AbortSignal` to cancel the request
     *
     * **Official reference:** https://core.telegram.org/bots/api#approvechatjoinrequest
     */ approveChatJoinRequest(user_id, signal) {
        return this.api.approveChatJoinRequest(orThrow(this.chatId, "approveChatJoinRequest"), user_id, signal);
    }
    /**
     * Context-aware alias for `api.declineChatJoinRequest`. Use this method to decline a chat join request. The bot must be an administrator in the chat for this to work and must have the can_invite_users administrator right. Returns True on success.
     *
     * @param user_id Unique identifier of the target user
     * @param signal Optional `AbortSignal` to cancel the request
     *
     * **Official reference:** https://core.telegram.org/bots/api#declinechatjoinrequest
     */ declineChatJoinRequest(user_id, signal) {
        return this.api.declineChatJoinRequest(orThrow(this.chatId, "declineChatJoinRequest"), user_id, signal);
    }
    /**
     * Context-aware alias for `api.setChatPhoto`. Use this method to set a new profile photo for the chat. Photos can't be changed for private chats. The bot must be an administrator in the chat for this to work and must have the appropriate administrator rights. Returns True on success.
     *
     * @param photo New chat photo, uploaded using multipart/form-data
     * @param signal Optional `AbortSignal` to cancel the request
     *
     * **Official reference:** https://core.telegram.org/bots/api#setchatphoto
     */ setChatPhoto(photo, signal) {
        return this.api.setChatPhoto(orThrow(this.chatId, "setChatPhoto"), photo, signal);
    }
    /**
     * Context-aware alias for `api.deleteChatPhoto`. Use this method to delete a chat photo. Photos can't be changed for private chats. The bot must be an administrator in the chat for this to work and must have the appropriate administrator rights. Returns True on success.
     *
     * @param signal Optional `AbortSignal` to cancel the request
     *
     * **Official reference:** https://core.telegram.org/bots/api#deletechatphoto
     */ deleteChatPhoto(signal) {
        return this.api.deleteChatPhoto(orThrow(this.chatId, "deleteChatPhoto"), signal);
    }
    /**
     * Context-aware alias for `api.setChatTitle`. Use this method to change the title of a chat. Titles can't be changed for private chats. The bot must be an administrator in the chat for this to work and must have the appropriate administrator rights. Returns True on success.
     *
     * @param title New chat title, 1-255 characters
     * @param signal Optional `AbortSignal` to cancel the request
     *
     * **Official reference:** https://core.telegram.org/bots/api#setchattitle
     */ setChatTitle(title, signal) {
        return this.api.setChatTitle(orThrow(this.chatId, "setChatTitle"), title, signal);
    }
    /**
     * Context-aware alias for `api.setChatDescription`. Use this method to change the description of a group, a supergroup or a channel. The bot must be an administrator in the chat for this to work and must have the appropriate administrator rights. Returns True on success.
     *
     * @param description New chat description, 0-255 characters
     * @param signal Optional `AbortSignal` to cancel the request
     *
     * **Official reference:** https://core.telegram.org/bots/api#setchatdescription
     */ setChatDescription(description, signal) {
        return this.api.setChatDescription(orThrow(this.chatId, "setChatDescription"), description, signal);
    }
    /**
     * Context-aware alias for `api.pinChatMessage`. Use this method to add a message to the list of pinned messages in a chat. If the chat is not a private chat, the bot must be an administrator in the chat for this to work and must have the 'can_pin_messages' administrator right in a supergroup or 'can_edit_messages' administrator right in a channel. Returns True on success.
     *
     * @param message_id Identifier of a message to pin
     * @param other Optional remaining parameters, confer the official reference below
     * @param signal Optional `AbortSignal` to cancel the request
     *
     * **Official reference:** https://core.telegram.org/bots/api#pinchatmessage
     */ pinChatMessage(message_id, other, signal) {
        return this.api.pinChatMessage(orThrow(this.chatId, "pinChatMessage"), message_id, other, signal);
    }
    /**
     * Context-aware alias for `api.unpinChatMessage`. Use this method to remove a message from the list of pinned messages in a chat. If the chat is not a private chat, the bot must be an administrator in the chat for this to work and must have the 'can_pin_messages' administrator right in a supergroup or 'can_edit_messages' administrator right in a channel. Returns True on success.
     *
     * @param message_id Identifier of a message to unpin. If not specified, the most recent pinned message (by sending date) will be unpinned.
     * @param signal Optional `AbortSignal` to cancel the request
     *
     * **Official reference:** https://core.telegram.org/bots/api#unpinchatmessage
     */ unpinChatMessage(message_id, signal) {
        return this.api.unpinChatMessage(orThrow(this.chatId, "unpinChatMessage"), message_id, signal);
    }
    /**
     * Context-aware alias for `api.unpinAllChatMessages`. Use this method to clear the list of pinned messages in a chat. If the chat is not a private chat, the bot must be an administrator in the chat for this to work and must have the 'can_pin_messages' administrator right in a supergroup or 'can_edit_messages' administrator right in a channel. Returns True on success.
     *
     * @param signal Optional `AbortSignal` to cancel the request
     *
     * **Official reference:** https://core.telegram.org/bots/api#unpinallchatmessages
     */ unpinAllChatMessages(signal) {
        return this.api.unpinAllChatMessages(orThrow(this.chatId, "unpinAllChatMessages"), signal);
    }
    /**
     * Context-aware alias for `api.leaveChat`. Use this method for your bot to leave a group, supergroup or channel. Returns True on success.
     *
     * @param signal Optional `AbortSignal` to cancel the request
     *
     * **Official reference:** https://core.telegram.org/bots/api#leavechat
     */ leaveChat(signal) {
        return this.api.leaveChat(orThrow(this.chatId, "leaveChat"), signal);
    }
    /**
     * Context-aware alias for `api.getChat`. Use this method to get up to date information about the chat (current name of the user for one-on-one conversations, current username of a user, group or channel, etc.). Returns a Chat object on success.
     *
     * @param signal Optional `AbortSignal` to cancel the request
     *
     * **Official reference:** https://core.telegram.org/bots/api#getchat
     */ getChat(signal) {
        return this.api.getChat(orThrow(this.chatId, "getChat"), signal);
    }
    /**
     * Context-aware alias for `api.getChatAdministrators`. Use this method to get a list of administrators in a chat, which aren't bots. Returns an Array of ChatMember objects.
     *
     * @param signal Optional `AbortSignal` to cancel the request
     *
     * **Official reference:** https://core.telegram.org/bots/api#getchatadministrators
     */ getChatAdministrators(signal) {
        return this.api.getChatAdministrators(orThrow(this.chatId, "getChatAdministrators"), signal);
    }
    /** @deprecated Use `getChatMembersCount` instead. */ getChatMembersCount(...args) {
        return this.getChatMemberCount(...args);
    }
    /**
     * Context-aware alias for `api.getChatMemberCount`. Use this method to get the number of members in a chat. Returns Int on success.
     *
     * @param signal Optional `AbortSignal` to cancel the request
     *
     * **Official reference:** https://core.telegram.org/bots/api#getchatmembercount
     */ getChatMemberCount(signal) {
        return this.api.getChatMemberCount(orThrow(this.chatId, "getChatMemberCount"), signal);
    }
    /**
     * Context-aware alias for `api.getChatMember`. Use this method to get information about a member of a chat. The method is guaranteed to work only if the bot is an administrator in the chat. Returns a ChatMember object on success.
     *
     * @param signal Optional `AbortSignal` to cancel the request
     *
     * **Official reference:** https://core.telegram.org/bots/api#getchatmember
     */ getAuthor(signal) {
        return this.api.getChatMember(orThrow(this.chatId, "getAuthor"), orThrow(this.from, "getAuthor").id, signal);
    }
    /**
     * Context-aware alias for `api.getChatMember`. Use this method to get information about a member of a chat. The method is guaranteed to work only if the bot is an administrator in the chat. Returns a ChatMember object on success.
     *
     * @param user_id Unique identifier of the target user
     * @param signal Optional `AbortSignal` to cancel the request
     *
     * **Official reference:** https://core.telegram.org/bots/api#getchatmember
     */ getChatMember(user_id, signal) {
        return this.api.getChatMember(orThrow(this.chatId, "getChatMember"), user_id, signal);
    }
    /**
     * Context-aware alias for `api.setChatStickerSet`. Use this method to set a new group sticker set for a supergroup. The bot must be an administrator in the chat for this to work and must have the appropriate administrator rights. Use the field can_set_sticker_set ly returned in getChat requests to check if the bot can use this method. Returns True on success.
     *
     * @param sticker_set_name Name of the sticker set to be set as the group sticker set
     * @param signal Optional `AbortSignal` to cancel the request
     *
     * **Official reference:** https://core.telegram.org/bots/api#setchatstickerset
     */ setChatStickerSet(sticker_set_name, signal) {
        return this.api.setChatStickerSet(orThrow(this.chatId, "setChatStickerSet"), sticker_set_name, signal);
    }
    /**
     * Context-aware alias for `api.deleteChatStickerSet`. Use this method to delete a group sticker set from a supergroup. The bot must be an administrator in the chat for this to work and must have the appropriate administrator rights. Use the field can_set_sticker_set ly returned in getChat requests to check if the bot can use this method. Returns True on success.
     *
     * @param signal Optional `AbortSignal` to cancel the request
     *
     * **Official reference:** https://core.telegram.org/bots/api#deletechatstickerset
     */ deleteChatStickerSet(signal) {
        return this.api.deleteChatStickerSet(orThrow(this.chatId, "deleteChatStickerSet"), signal);
    }
    /**
     * Context-aware alias for `api.createForumTopic`. Use this method to create a topic in a forum supergroup chat. The bot must be an administrator in the chat for this to work and must have the can_manage_topics administrator rights. Returns information about the created topic as a ForumTopic object.
     *
     * @param name Topic name, 1-128 characters
     * @param other Optional remaining parameters, confer the official reference below
     * @param signal Optional `AbortSignal` to cancel the request
     *
     * **Official reference:** https://core.telegram.org/bots/api#createforumtopic
     */ createForumTopic(name, other, signal) {
        return this.api.createForumTopic(orThrow(this.chatId, "createForumTopic"), name, other, signal);
    }
    /**
     * Context-aware alias for `api.editForumTopic`. Use this method to edit name and icon of a topic in a forum supergroup chat. The bot must be an administrator in the chat for this to work and must have can_manage_topics administrator rights, unless it is the creator of the topic. Returns True on success.
     *
     * @param other Optional remaining parameters, confer the official reference below
     * @param signal Optional `AbortSignal` to cancel the request
     *
     * **Official reference:** https://core.telegram.org/bots/api#editforumtopic
     */ editForumTopic(other, signal) {
        const message = orThrow(this.msg, "editForumTopic");
        const thread = orThrow(message.message_thread_id, "editForumTopic");
        return this.api.editForumTopic(message.chat.id, thread, other, signal);
    }
    /**
     * Context-aware alias for `api.closeForumTopic`. Use this method to close an open topic in a forum supergroup chat. The bot must be an administrator in the chat for this to work and must have the can_manage_topics administrator rights, unless it is the creator of the topic. Returns True on success.
     *
     * @param signal Optional `AbortSignal` to cancel the request
     *
     * **Official reference:** https://core.telegram.org/bots/api#closeforumtopic
     */ closeForumTopic(signal) {
        const message = orThrow(this.msg, "closeForumTopic");
        const thread = orThrow(message.message_thread_id, "closeForumTopic");
        return this.api.closeForumTopic(message.chat.id, thread, signal);
    }
    /**
     * Context-aware alias for `api.reopenForumTopic`. Use this method to reopen a closed topic in a forum supergroup chat. The bot must be an administrator in the chat for this to work and must have the can_manage_topics administrator rights, unless it is the creator of the topic. Returns True on success.
     *
     * @param signal Optional `AbortSignal` to cancel the request
     *
     * **Official reference:** https://core.telegram.org/bots/api#reopenforumtopic
     */ reopenForumTopic(signal) {
        const message = orThrow(this.msg, "reopenForumTopic");
        const thread = orThrow(message.message_thread_id, "reopenForumTopic");
        return this.api.reopenForumTopic(message.chat.id, thread, signal);
    }
    /**
     * Context-aware alias for `api.deleteForumTopic`. Use this method to delete a forum topic along with all its messages in a forum supergroup chat. The bot must be an administrator in the chat for this to work and must have the can_delete_messages administrator rights. Returns True on success.
     *
     * @param signal Optional `AbortSignal` to cancel the request
     *
     * **Official reference:** https://core.telegram.org/bots/api#deleteforumtopic
     */ deleteForumTopic(signal) {
        const message = orThrow(this.msg, "deleteForumTopic");
        const thread = orThrow(message.message_thread_id, "deleteForumTopic");
        return this.api.deleteForumTopic(message.chat.id, thread, signal);
    }
    /**
     * Context-aware alias for `api.unpinAllForumTopicMessages`. Use this method to clear the list of pinned messages in a forum topic. The bot must be an administrator in the chat for this to work and must have the can_pin_messages administrator right in the supergroup. Returns True on success.
     *
     * @param signal Optional `AbortSignal` to cancel the request
     *
     * **Official reference:** https://core.telegram.org/bots/api#unpinallforumtopicmessages
     */ unpinAllForumTopicMessages(signal) {
        const message = orThrow(this.msg, "unpinAllForumTopicMessages");
        const thread = orThrow(message.message_thread_id, "unpinAllForumTopicMessages");
        return this.api.unpinAllForumTopicMessages(message.chat.id, thread, signal);
    }
    /**
     * Context-aware alias for `api.editGeneralForumTopic`. Use this method to edit the name of the 'General' topic in a forum supergroup chat. The bot must be an administrator in the chat for this to work and must have can_manage_topics administrator rights. Returns True on success.
     *
     * @param name New topic name, 1-128 characters
     * @param signal Optional `AbortSignal` to cancel the request
     *
     * **Official reference:** https://core.telegram.org/bots/api#editgeneralforumtopic
     */ editGeneralForumTopic(name, signal) {
        return this.api.editGeneralForumTopic(orThrow(this.chatId, "editGeneralForumTopic"), name, signal);
    }
    /**
     * Context-aware alias for `api.closeGeneralForumTopic`. Use this method to close an open 'General' topic in a forum supergroup chat. The bot must be an administrator in the chat for this to work and must have the can_manage_topics administrator rights. Returns True on success.
     *
     * @param signal Optional `AbortSignal` to cancel the request
     *
     * **Official reference:** https://core.telegram.org/bots/api#closegeneralforumtopic
     */ closeGeneralForumTopic(signal) {
        return this.api.closeGeneralForumTopic(orThrow(this.chatId, "closeGeneralForumTopic"), signal);
    }
    /**
     * Context-aware alias for `api.reopenGeneralForumTopic`. Use this method to reopen a closed 'General' topic in a forum supergroup chat. The bot must be an administrator in the chat for this to work and must have the can_manage_topics administrator rights. The topic will be automatically unhidden if it was hidden. Returns True on success.     *
     *
     * @param signal Optional `AbortSignal` to cancel the request
     *
     * **Official reference:** https://core.telegram.org/bots/api#reopengeneralforumtopic
     */ reopenGeneralForumTopic(signal) {
        return this.api.reopenGeneralForumTopic(orThrow(this.chatId, "reopenGeneralForumTopic"), signal);
    }
    /**
     * Context-aware alias for `api.hideGeneralForumTopic`. Use this method to hide the 'General' topic in a forum supergroup chat. The bot must be an administrator in the chat for this to work and must have the can_manage_topics administrator rights. The topic will be automatically closed if it was open. Returns True on success.
     *
     * @param signal Optional `AbortSignal` to cancel the request
     *
     * **Official reference:** https://core.telegram.org/bots/api#hidegeneralforumtopic
     */ hideGeneralForumTopic(signal) {
        return this.api.hideGeneralForumTopic(orThrow(this.chatId, "hideGeneralForumTopic"), signal);
    }
    /**
     * Context-aware alias for `api.unhideGeneralForumTopic`. Use this method to unhide the 'General' topic in a forum supergroup chat. The bot must be an administrator in the chat for this to work and must have the can_manage_topics administrator rights. Returns True on success.
     *
     * @param signal Optional `AbortSignal` to cancel the request
     *
     * **Official reference:** https://core.telegram.org/bots/api#unhidegeneralforumtopic
     */ unhideGeneralForumTopic(signal) {
        return this.api.unhideGeneralForumTopic(orThrow(this.chatId, "unhideGeneralForumTopic"), signal);
    }
    /**
     * Context-aware alias for `api.unpinAllGeneralForumTopicMessages`. Use this method to clear the list of pinned messages in a General forum topic. The bot must be an administrator in the chat for this to work and must have the can_pin_messages administrator right in the supergroup. Returns True on success.
     *
     * @param signal Optional `AbortSignal` to cancel the request
     *
     * **Official reference:** https://core.telegram.org/bots/api#unpinallgeneralforumtopicmessages
     */ unpinAllGeneralForumTopicMessages(signal) {
        return this.api.unpinAllGeneralForumTopicMessages(orThrow(this.chatId, "unpinAllGeneralForumTopicMessages"), signal);
    }
    /**
     * Context-aware alias for `api.answerCallbackQuery`. Use this method to send answers to callback queries sent from inline keyboards. The answer will be displayed to the user as a notification at the top of the chat screen or as an alert. On success, True is returned.
     *
     * Alternatively, the user can be redirected to the specified Game URL. For this option to work, you must first create a game for your bot via @BotFather and accept the terms. Otherwise, you may use links like t.me/your_bot?start=XXXX that open your bot with a parameter.
     *
     * @param other Optional remaining parameters, confer the official reference below
     * @param signal Optional `AbortSignal` to cancel the request
     *
     * **Official reference:** https://core.telegram.org/bots/api#answercallbackquery
     */ answerCallbackQuery(other, signal) {
        return this.api.answerCallbackQuery(orThrow(this.callbackQuery, "answerCallbackQuery").id, typeof other === "string" ? {
            text: other
        } : other, signal);
    }
    /**
     * Context-aware alias for `api.setChatMenuButton`. Use this method to change the bot's menu button in a private chat, or the default menu button. Returns True on success.
     *
     * @param other Optional remaining parameters, confer the official reference below
     * @param signal Optional `AbortSignal` to cancel the request
     *
     * **Official reference:** https://core.telegram.org/bots/api#setchatmenubutton
     */ setChatMenuButton(other, signal) {
        return this.api.setChatMenuButton(other, signal);
    }
    /**
     * Context-aware alias for `api.getChatMenuButton`. Use this method to get the current value of the bot's menu button in a private chat, or the default menu button. Returns MenuButton on success.
     *
     * @param other Optional remaining parameters, confer the official reference below
     * @param signal Optional `AbortSignal` to cancel the request
     *
     * **Official reference:** https://core.telegram.org/bots/api#setchatmenubutton
     */ getChatMenuButton(other, signal) {
        return this.api.getChatMenuButton(other, signal);
    }
    /**
     * Context-aware alias for `api.setMyDefaultAdministratorRights`. Use this method to the change the default administrator rights requested by the bot when it's added as an administrator to groups or channels. These rights will be suggested to users, but they are are free to modify the list before adding the bot. Returns True on success.
     *
     * @param other Optional remaining parameters, confer the official reference below
     * @param signal Optional `AbortSignal` to cancel the request
     *
     * **Official reference:** https://core.telegram.org/bots/api#setmydefaultadministratorrights
     */ setMyDefaultAdministratorRights(other, signal) {
        return this.api.setMyDefaultAdministratorRights(other, signal);
    }
    /**
     * Context-aware alias for `api.getMyDefaultAdministratorRights`. Use this method to get the current default administrator rights of the bot. Returns ChatAdministratorRights on success.
     *
     * @param other Optional remaining parameters, confer the official reference below
     * @param signal Optional `AbortSignal` to cancel the request
     */ getMyDefaultAdministratorRights(other, signal) {
        return this.api.getMyDefaultAdministratorRights(other, signal);
    }
    /**
     * Context-aware alias for `api.editMessageText`. Use this method to edit text and game messages. On success, if the edited message is not an inline message, the edited Message is returned, otherwise True is returned. Note that business messages that were not sent by the bot and do not contain an inline keyboard can only be edited within 48 hours from the time they were sent.
     *
     * @param text New text of the message, 1-4096 characters after entities parsing
     * @param other Optional remaining parameters, confer the official reference below
     * @param signal Optional `AbortSignal` to cancel the request
     *
     * **Official reference:** https://core.telegram.org/bots/api#editmessagetext
     */ editMessageText(text, other, signal) {
        const inlineId = this.inlineMessageId;
        return inlineId !== undefined ? this.api.editMessageTextInline(inlineId, text, other) : this.api.editMessageText(orThrow(this.chatId, "editMessageText"), orThrow(this.msg?.message_id ?? this.messageReaction?.message_id ?? this.messageReactionCount?.message_id, "editMessageText"), text, other, signal);
    }
    /**
     * Context-aware alias for `api.editMessageCaption`. Use this method to edit captions of messages. On success, if the edited message is not an inline message, the edited Message is returned, otherwise True is returned. Note that business messages that were not sent by the bot and do not contain an inline keyboard can only be edited within 48 hours from the time they were sent.
     *
     * @param other Optional remaining parameters, confer the official reference below
     * @param signal Optional `AbortSignal` to cancel the request
     *
     * **Official reference:** https://core.telegram.org/bots/api#editmessagecaption
     */ editMessageCaption(other, signal) {
        const inlineId = this.inlineMessageId;
        return inlineId !== undefined ? this.api.editMessageCaptionInline(inlineId, other) : this.api.editMessageCaption(orThrow(this.chatId, "editMessageCaption"), orThrow(this.msg?.message_id ?? this.messageReaction?.message_id ?? this.messageReactionCount?.message_id, "editMessageCaption"), other, signal);
    }
    /**
     * Context-aware alias for `api.editMessageMedia`. Use this method to edit animation, audio, document, photo, or video messages. If a message is part of a message album, then it can be edited only to an audio for audio albums, only to a document for document albums and to a photo or a video otherwise. When an inline message is edited, a new file can't be uploaded; use a previously uploaded file via its file_id or specify a URL. On success, if the edited message is not an inline message, the edited Message is returned, otherwise True is returned. Note that business messages that were not sent by the bot and do not contain an inline keyboard can only be edited within 48 hours from the time they were sent.
     *
     * @param media An object for a new media content of the message
     * @param other Optional remaining parameters, confer the official reference below
     * @param signal Optional `AbortSignal` to cancel the request
     *
     * **Official reference:** https://core.telegram.org/bots/api#editmessagemedia
     */ editMessageMedia(media, other, signal) {
        const inlineId = this.inlineMessageId;
        return inlineId !== undefined ? this.api.editMessageMediaInline(inlineId, media, other) : this.api.editMessageMedia(orThrow(this.chatId, "editMessageMedia"), orThrow(this.msg?.message_id ?? this.messageReaction?.message_id ?? this.messageReactionCount?.message_id, "editMessageMedia"), media, other, signal);
    }
    /**
     * Context-aware alias for `api.editMessageReplyMarkup`. Use this method to edit only the reply markup of messages. On success, if the edited message is not an inline message, the edited Message is returned, otherwise True is returned. Note that business messages that were not sent by the bot and do not contain an inline keyboard can only be edited within 48 hours from the time they were sent.
     *
     * @param other Optional remaining parameters, confer the official reference below
     * @param signal Optional `AbortSignal` to cancel the request
     *
     * **Official reference:** https://core.telegram.org/bots/api#editmessagereplymarkup
     */ editMessageReplyMarkup(other, signal) {
        const inlineId = this.inlineMessageId;
        return inlineId !== undefined ? this.api.editMessageReplyMarkupInline(inlineId, other) : this.api.editMessageReplyMarkup(orThrow(this.chatId, "editMessageReplyMarkup"), orThrow(this.msg?.message_id ?? this.messageReaction?.message_id ?? this.messageReactionCount?.message_id, "editMessageReplyMarkup"), other, signal);
    }
    /**
     * Context-aware alias for `api.stopPoll`. Use this method to stop a poll which was sent by the bot. On success, the stopped Poll is returned.
     *
     * @param other Optional remaining parameters, confer the official reference below
     * @param signal Optional `AbortSignal` to cancel the request
     *
     * **Official reference:** https://core.telegram.org/bots/api#stoppoll
     */ stopPoll(other, signal) {
        return this.api.stopPoll(orThrow(this.chatId, "stopPoll"), orThrow(this.msg?.message_id ?? this.messageReaction?.message_id ?? this.messageReactionCount?.message_id, "stopPoll"), other, signal);
    }
    /**
     * Context-aware alias for `api.deleteMessage`. Use this method to delete a message, including service messages, with the following limitations:
     * - A message can only be deleted if it was sent less than 48 hours ago.
     * - A dice message in a private chat can only be deleted if it was sent more than 24 hours ago.
     * - Bots can delete outgoing messages in private chats, groups, and supergroups.
     * - Bots can delete incoming messages in private chats.
     * - Bots granted can_post_messages permissions can delete outgoing messages in channels.
     * - If the bot is an administrator of a group, it can delete any message there.
     * - If the bot has can_delete_messages permission in a supergroup or a channel, it can delete any message there.
     * Returns True on success.
     *
     * @param signal Optional `AbortSignal` to cancel the request
     *
     * **Official reference:** https://core.telegram.org/bots/api#deletemessage
     */ deleteMessage(signal) {
        return this.api.deleteMessage(orThrow(this.chatId, "deleteMessage"), orThrow(this.msg?.message_id ?? this.messageReaction?.message_id ?? this.messageReactionCount?.message_id, "deleteMessage"), signal);
    }
    /**
     * Context-aware alias for `api.deleteMessages`. Use this method to delete multiple messages simultaneously. Returns True on success.
     *
     * @param chat_id Unique identifier for the target chat or username of the target channel (in the format @channelusername)
     * @param message_ids A list of 1-100 identifiers of messages to delete. See deleteMessage for limitations on which messages can be deleted
     * @param signal Optional `AbortSignal` to cancel the request
     *
     * **Official reference:** https://core.telegram.org/bots/api#deletemessages
     */ deleteMessages(message_ids, signal) {
        return this.api.deleteMessages(orThrow(this.chatId, "deleteMessages"), message_ids, signal);
    }
    /**
     * Context-aware alias for `api.sendSticker`. Use this method to send static .WEBP, animated .TGS, or video .WEBM stickers. On success, the sent Message is returned.
     *
     * @param sticker Sticker to send. Pass a file_id as String to send a file that exists on the Telegram servers (recommended), pass an HTTP URL as a String for Telegram to get a .WEBP sticker from the Internet, or upload a new .WEBP, .TGS, or .WEBM sticker using multipart/form-data. Video and animated stickers can't be sent via an HTTP URL.
     * @param other Optional remaining parameters, confer the official reference below
     * @param signal Optional `AbortSignal` to cancel the request
     *
     * **Official reference:** https://core.telegram.org/bots/api#sendsticker
     */ replyWithSticker(sticker, other, signal) {
        return this.api.sendSticker(orThrow(this.chatId, "sendSticker"), sticker, {
            business_connection_id: this.businessConnectionId,
            ...other
        }, signal);
    }
    /**
     * Use this method to get information about custom emoji stickers by their identifiers. Returns an Array of Sticker objects.
     *
     * @param custom_emoji_ids A list of custom emoji identifiers
     * @param signal Optional `AbortSignal` to cancel the request
     *
     * **Official reference:** https://core.telegram.org/bots/api#getcustomemojistickers
     */ getCustomEmojiStickers(signal) {
        return this.api.getCustomEmojiStickers((this.msg?.entities ?? []).filter((e)=>e.type === "custom_emoji").map((e)=>e.custom_emoji_id), signal);
    }
    /**
     * Context-aware alias for `api.answerInlineQuery`. Use this method to send answers to an inline query. On success, True is returned.
     * No more than 50 results per query are allowed.
     *
     * Example: An inline bot that sends YouTube videos can ask the user to connect the bot to their YouTube account to adapt search results accordingly. To do this, it displays a 'Connect your YouTube account' button above the results, or even before showing any. The user presses the button, switches to a private chat with the bot and, in doing so, passes a start parameter that instructs the bot to return an OAuth link. Once done, the bot can offer a switch_inline button so that the user can easily return to the chat where they wanted to use the bot's inline capabilities.
     *
     * @param results An array of results for the inline query
     * @param other Optional remaining parameters, confer the official reference below
     * @param signal Optional `AbortSignal` to cancel the request
     *
     * **Official reference:** https://core.telegram.org/bots/api#answerinlinequery
     */ answerInlineQuery(results, other, signal) {
        return this.api.answerInlineQuery(orThrow(this.inlineQuery, "answerInlineQuery").id, results, other, signal);
    }
    /**
     * Context-aware alias for `api.sendInvoice`. Use this method to send invoices. On success, the sent Message is returned.
     *
     * @param title Product name, 1-32 characters
     * @param description Product description, 1-255 characters
     * @param payload Bot-defined invoice payload, 1-128 bytes. This will not be displayed to the user, use for your internal processes.
     * @param currency Three-letter ISO 4217 currency code, see more on currencies
     * @param prices Price breakdown, a list of components (e.g. product price, tax, discount, delivery cost, delivery tax, bonus, etc.)
     * @param other Optional remaining parameters, confer the official reference below
     * @param signal Optional `AbortSignal` to cancel the request
     *
     * **Official reference:** https://core.telegram.org/bots/api#sendinvoice
     */ replyWithInvoice(title, description, payload, currency, prices, other, signal) {
        return this.api.sendInvoice(orThrow(this.chatId, "sendInvoice"), title, description, payload, currency, prices, other, signal);
    }
    /**
     * Context-aware alias for `api.answerShippingQuery`. If you sent an invoice requesting a shipping address and the parameter is_flexible was specified, the Bot API will send an Update with a shipping_query field to the bot. Use this method to reply to shipping queries. On success, True is returned.
     *
     * @param shipping_query_id Unique identifier for the query to be answered
     * @param ok Pass True if delivery to the specified address is possible and False if there are any problems (for example, if delivery to the specified address is not possible)
     * @param other Optional remaining parameters, confer the official reference below
     * @param signal Optional `AbortSignal` to cancel the request
     *
     * **Official reference:** https://core.telegram.org/bots/api#answershippingquery
     */ answerShippingQuery(ok, other, signal) {
        return this.api.answerShippingQuery(orThrow(this.shippingQuery, "answerShippingQuery").id, ok, other, signal);
    }
    /**
     * Context-aware alias for `api.answerPreCheckoutQuery`. Once the user has confirmed their payment and shipping details, the Bot API sends the final confirmation in the form of an Update with the field pre_checkout_query. Use this method to respond to such pre-checkout queries. On success, True is returned. Note: The Bot API must receive an answer within 10 seconds after the pre-checkout query was sent.
     *
     * @param ok Specify True if everything is alright (goods are available, etc.) and the bot is ready to proceed with the order. Use False if there are any problems.
     * @param other Optional remaining parameters, confer the official reference below
     * @param signal Optional `AbortSignal` to cancel the request
     *
     * **Official reference:** https://core.telegram.org/bots/api#answerprecheckoutquery
     */ answerPreCheckoutQuery(ok, other, signal) {
        return this.api.answerPreCheckoutQuery(orThrow(this.preCheckoutQuery, "answerPreCheckoutQuery").id, ok, typeof other === "string" ? {
            error_message: other
        } : other, signal);
    }
    /**
     * Context-aware alias for `api.refundStarPayment`. Refunds a successful payment in Telegram Stars.
     *
     * @param signal Optional `AbortSignal` to cancel the request
     *
     * **Official reference:** https://core.telegram.org/bots/api#refundstarpayment
     */ refundStarPayment(signal) {
        return this.api.refundStarPayment(orThrow(this.from, "refundStarPayment").id, orThrow(this.msg?.successful_payment, "refundStarPayment").telegram_payment_charge_id, signal);
    }
    /**
     * Context-aware alias for `api.setPassportDataErrors`. Informs a user that some of the Telegram Passport elements they provided contains errors. The user will not be able to re-submit their Passport to you until the errors are fixed (the contents of the field for which you returned the error must change). Returns True on success.
     *
     * Use this if the data submitted by the user doesn't satisfy the standards your service requires for any reason. For example, if a birthday date seems invalid, a submitted document is blurry, a scan shows evidence of tampering, etc. Supply some details in the error message to make sure the user knows how to correct the issues.
     *
     * @param errors An array describing the errors
     * @param signal Optional `AbortSignal` to cancel the request
     *
     * **Official reference:** https://core.telegram.org/bots/api#setpassportdataerrors
     */ setPassportDataErrors(errors, signal) {
        return this.api.setPassportDataErrors(orThrow(this.from, "setPassportDataErrors").id, errors, signal);
    }
    /**
     * Context-aware alias for `api.sendGame`. Use this method to send a game. On success, the sent Message is returned.
     *
     * @param game_short_name Short name of the game, serves as the unique identifier for the game. Set up your games via BotFather.
     * @param other Optional remaining parameters, confer the official reference below
     * @param signal Optional `AbortSignal` to cancel the request
     *
     * **Official reference:** https://core.telegram.org/bots/api#sendgame
     */ replyWithGame(game_short_name, other, signal) {
        return this.api.sendGame(orThrow(this.chatId, "sendGame"), game_short_name, {
            business_connection_id: this.businessConnectionId,
            ...other
        }, signal);
    }
}
// === Util functions
function orThrow(value, method) {
    if (value === undefined) {
        throw new Error(`Missing information for API call to ${method}`);
    }
    return value;
}
function triggerFn(trigger) {
    return toArray(trigger).map((t)=>typeof t === "string" ? (txt)=>txt === t ? t : null : (txt)=>txt.match(t));
}
function match(ctx, content, triggers) {
    for (const t of triggers){
        const res = t(content);
        if (res) {
            ctx.match = res;
            return true;
        }
    }
    return false;
}
function toArray(e) {
    return Array.isArray(e) ? e : [
        e
    ];
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vZGVuby5sYW5kL3gvZ3JhbW15QHYxLjI3LjAvY29udGV4dC50cyJdLCJzb3VyY2VzQ29udGVudCI6WyIvLyBkZW5vLWxpbnQtaWdub3JlLWZpbGUgY2FtZWxjYXNlXG5pbXBvcnQgeyB0eXBlIEFwaSwgdHlwZSBPdGhlciBhcyBPdGhlckFwaSB9IGZyb20gXCIuL2NvcmUvYXBpLnRzXCI7XG5pbXBvcnQgeyB0eXBlIE1ldGhvZHMsIHR5cGUgUmF3QXBpIH0gZnJvbSBcIi4vY29yZS9jbGllbnQudHNcIjtcbmltcG9ydCB7XG4gICAgdHlwZSBGaWx0ZXIsXG4gICAgdHlwZSBGaWx0ZXJDb3JlLFxuICAgIHR5cGUgRmlsdGVyUXVlcnksXG4gICAgbWF0Y2hGaWx0ZXIsXG59IGZyb20gXCIuL2ZpbHRlci50c1wiO1xuaW1wb3J0IHtcbiAgICB0eXBlIENoYXQsXG4gICAgdHlwZSBDaGF0UGVybWlzc2lvbnMsXG4gICAgdHlwZSBJbmxpbmVRdWVyeVJlc3VsdCxcbiAgICB0eXBlIElucHV0RmlsZSxcbiAgICB0eXBlIElucHV0TWVkaWEsXG4gICAgdHlwZSBJbnB1dE1lZGlhQXVkaW8sXG4gICAgdHlwZSBJbnB1dE1lZGlhRG9jdW1lbnQsXG4gICAgdHlwZSBJbnB1dE1lZGlhUGhvdG8sXG4gICAgdHlwZSBJbnB1dE1lZGlhVmlkZW8sXG4gICAgdHlwZSBJbnB1dFBhaWRNZWRpYSxcbiAgICB0eXBlIElucHV0UG9sbE9wdGlvbixcbiAgICB0eXBlIExhYmVsZWRQcmljZSxcbiAgICB0eXBlIE1lc3NhZ2UsXG4gICAgdHlwZSBNZXNzYWdlRW50aXR5LFxuICAgIHR5cGUgUGFzc3BvcnRFbGVtZW50RXJyb3IsXG4gICAgdHlwZSBSZWFjdGlvblR5cGUsXG4gICAgdHlwZSBSZWFjdGlvblR5cGVFbW9qaSxcbiAgICB0eXBlIFVwZGF0ZSxcbiAgICB0eXBlIFVzZXIsXG4gICAgdHlwZSBVc2VyRnJvbUdldE1lLFxufSBmcm9tIFwiLi90eXBlcy50c1wiO1xuXG4vLyA9PT0gVXRpbCB0eXBlc1xuZXhwb3J0IHR5cGUgTWF5YmVBcnJheTxUPiA9IFQgfCBUW107XG4vKiogcGVybWl0cyBgc3RyaW5nYCBidXQgZ2l2ZXMgaGludHMgKi9cbmV4cG9ydCB0eXBlIFN0cmluZ1dpdGhDb21tYW5kU3VnZ2VzdGlvbnMgPVxuICAgIHwgKHN0cmluZyAmIFJlY29yZDxuZXZlciwgbmV2ZXI+KVxuICAgIHwgXCJzdGFydFwiXG4gICAgfCBcImhlbHBcIlxuICAgIHwgXCJzZXR0aW5nc1wiXG4gICAgfCBcInByaXZhY3lcIjtcblxudHlwZSBPdGhlcjxNIGV4dGVuZHMgTWV0aG9kczxSYXdBcGk+LCBYIGV4dGVuZHMgc3RyaW5nID0gbmV2ZXI+ID0gT3RoZXJBcGk8XG4gICAgUmF3QXBpLFxuICAgIE0sXG4gICAgWFxuPjtcbnR5cGUgU25ha2VUb0NhbWVsQ2FzZTxTIGV4dGVuZHMgc3RyaW5nPiA9IFMgZXh0ZW5kcyBgJHtpbmZlciBMfV8ke2luZmVyIFJ9YFxuICAgID8gYCR7TH0ke0NhcGl0YWxpemU8U25ha2VUb0NhbWVsQ2FzZTxSPj59YFxuICAgIDogUztcbnR5cGUgQWxpYXNQcm9wczxVPiA9IHtcbiAgICBbSyBpbiBzdHJpbmcgJiBrZXlvZiBVIGFzIFNuYWtlVG9DYW1lbENhc2U8Sz5dOiBVW0tdO1xufTtcbnR5cGUgUmVuYW1lZFVwZGF0ZSA9IEFsaWFzUHJvcHM8T21pdDxVcGRhdGUsIFwidXBkYXRlX2lkXCI+PjtcblxuLy8gPT09IENvbnRleHQgcHJvYmluZyBsb2dpY1xuaW50ZXJmYWNlIFN0YXRpY0hhcyB7XG4gICAgLyoqXG4gICAgICogR2VuZXJhdGVzIGEgcHJlZGljYXRlIGZ1bmN0aW9uIHRoYXQgY2FuIHRlc3QgY29udGV4dCBvYmplY3RzIGZvciBtYXRjaGluZ1xuICAgICAqIHRoZSBnaXZlbiBmaWx0ZXIgcXVlcnkuIFRoaXMgdXNlcyB0aGUgc2FtZSBsb2dpYyBhcyBgYm90Lm9uYC5cbiAgICAgKlxuICAgICAqIEBwYXJhbSBmaWx0ZXIgVGhlIGZpbHRlciBxdWVyeSB0byBjaGVja1xuICAgICAqL1xuICAgIGZpbHRlclF1ZXJ5PFEgZXh0ZW5kcyBGaWx0ZXJRdWVyeT4oXG4gICAgICAgIGZpbHRlcjogUSB8IFFbXSxcbiAgICApOiA8QyBleHRlbmRzIENvbnRleHQ+KGN0eDogQykgPT4gY3R4IGlzIEZpbHRlcjxDLCBRPjtcbiAgICAvKipcbiAgICAgKiBHZW5lcmF0ZXMgYSBwcmVkaWNhdGUgZnVuY3Rpb24gdGhhdCBjYW4gdGVzdCBjb250ZXh0IG9iamVjdHMgZm9yXG4gICAgICogY29udGFpbmluZyB0aGUgZ2l2ZW4gdGV4dCwgb3IgZm9yIHRoZSB0ZXh0IHRvIG1hdGNoIHRoZSBnaXZlbiByZWd1bGFyXG4gICAgICogZXhwcmVzc2lvbi4gVGhpcyB1c2VzIHRoZSBzYW1lIGxvZ2ljIGFzIGBib3QuaGVhcnNgLlxuICAgICAqXG4gICAgICogQHBhcmFtIHRyaWdnZXIgVGhlIHN0cmluZyBvciByZWdleCB0byBtYXRjaFxuICAgICAqL1xuICAgIHRleHQoXG4gICAgICAgIHRyaWdnZXI6IE1heWJlQXJyYXk8c3RyaW5nIHwgUmVnRXhwPixcbiAgICApOiA8QyBleHRlbmRzIENvbnRleHQ+KGN0eDogQykgPT4gY3R4IGlzIEhlYXJzQ29udGV4dDxDPjtcbiAgICAvKipcbiAgICAgKiBHZW5lcmF0ZXMgYSBwcmVkaWNhdGUgZnVuY3Rpb24gdGhhdCBjYW4gdGVzdCBjb250ZXh0IG9iamVjdHMgZm9yXG4gICAgICogY29udGFpbmluZyBhIGNvbW1hbmQuIFRoaXMgdXNlcyB0aGUgc2FtZSBsb2dpYyBhcyBgYm90LmNvbW1hbmRgLlxuICAgICAqXG4gICAgICogQHBhcmFtIGNvbW1hbmQgVGhlIGNvbW1hbmQgdG8gbWF0Y2hcbiAgICAgKi9cbiAgICBjb21tYW5kKFxuICAgICAgICBjb21tYW5kOiBNYXliZUFycmF5PFN0cmluZ1dpdGhDb21tYW5kU3VnZ2VzdGlvbnM+LFxuICAgICk6IDxDIGV4dGVuZHMgQ29udGV4dD4oY3R4OiBDKSA9PiBjdHggaXMgQ29tbWFuZENvbnRleHQ8Qz47XG4gICAgLyoqXG4gICAgICogR2VuZXJhdGVzIGEgcHJlZGljYXRlIGZ1bmN0aW9uIHRoYXQgY2FuIHRlc3QgY29udGV4dCBvYmplY3RzIGZvclxuICAgICAqIGNvbnRhaW5pbmcgYSBtZXNzYWdlIHJlYWN0aW9uIHVwZGF0ZS4gVGhpcyB1c2VzIHRoZSBzYW1lIGxvZ2ljIGFzXG4gICAgICogYGJvdC5yZWFjdGlvbmAuXG4gICAgICpcbiAgICAgKiBAcGFyYW0gcmVhY3Rpb24gVGhlIHJlYWN0aW9uIHRvIHRlc3QgYWdhaW5zdFxuICAgICAqL1xuICAgIHJlYWN0aW9uKFxuICAgICAgICByZWFjdGlvbjogTWF5YmVBcnJheTxSZWFjdGlvblR5cGVFbW9qaVtcImVtb2ppXCJdIHwgUmVhY3Rpb25UeXBlPixcbiAgICApOiA8QyBleHRlbmRzIENvbnRleHQ+KGN0eDogQykgPT4gY3R4IGlzIFJlYWN0aW9uQ29udGV4dDxDPjtcbiAgICAvKipcbiAgICAgKiBHZW5lcmF0ZXMgYSBwcmVkaWNhdGUgZnVuY3Rpb24gdGhhdCBjYW4gdGVzdCBjb250ZXh0IG9iamVjdHMgZm9yXG4gICAgICogYmVsb25naW5nIHRvIGEgY2hhdCB3aXRoIHRoZSBnaXZlbiBjaGF0IHR5cGUuIFRoaXMgdXNlcyB0aGUgc2FtZSBsb2dpYyBhc1xuICAgICAqIGBib3QuY2hhdFR5cGVgLlxuICAgICAqXG4gICAgICogQHBhcmFtIGNoYXRUeXBlIFRoZSBjaGF0IHR5cGUgdG8gbWF0Y2hcbiAgICAgKi9cbiAgICBjaGF0VHlwZTxUIGV4dGVuZHMgQ2hhdFtcInR5cGVcIl0+KFxuICAgICAgICBjaGF0VHlwZTogTWF5YmVBcnJheTxUPixcbiAgICApOiA8QyBleHRlbmRzIENvbnRleHQ+KGN0eDogQykgPT4gY3R4IGlzIENoYXRUeXBlQ29udGV4dDxDLCBUPjtcbiAgICAvKipcbiAgICAgKiBHZW5lcmF0ZXMgYSBwcmVkaWNhdGUgZnVuY3Rpb24gdGhhdCBjYW4gdGVzdCBjb250ZXh0IG9iamVjdHMgZm9yXG4gICAgICogY29udGFpbmluZyB0aGUgZ2l2ZW4gY2FsbGJhY2sgcXVlcnksIG9yIGZvciB0aGUgY2FsbGJhY2sgcXVlcnkgZGF0YSB0b1xuICAgICAqIG1hdGNoIHRoZSBnaXZlbiByZWd1bGFyIGV4cHJlc3Npb24uIFRoaXMgdXNlcyB0aGUgc2FtZSBsb2dpYyBhc1xuICAgICAqIGBib3QuY2FsbGJhY2tRdWVyeWAuXG4gICAgICpcbiAgICAgKiBAcGFyYW0gdHJpZ2dlciBUaGUgc3RyaW5nIG9yIHJlZ2V4IHRvIG1hdGNoXG4gICAgICovXG4gICAgY2FsbGJhY2tRdWVyeShcbiAgICAgICAgdHJpZ2dlcjogTWF5YmVBcnJheTxzdHJpbmcgfCBSZWdFeHA+LFxuICAgICk6IDxDIGV4dGVuZHMgQ29udGV4dD4oY3R4OiBDKSA9PiBjdHggaXMgQ2FsbGJhY2tRdWVyeUNvbnRleHQ8Qz47XG4gICAgLyoqXG4gICAgICogR2VuZXJhdGVzIGEgcHJlZGljYXRlIGZ1bmN0aW9uIHRoYXQgY2FuIHRlc3QgY29udGV4dCBvYmplY3RzIGZvclxuICAgICAqIGNvbnRhaW5pbmcgdGhlIGdpdmVuIGdhbWUgcXVlcnksIG9yIGZvciB0aGUgZ2FtZSBuYW1lIHRvIG1hdGNoIHRoZSBnaXZlblxuICAgICAqIHJlZ3VsYXIgZXhwcmVzc2lvbi4gVGhpcyB1c2VzIHRoZSBzYW1lIGxvZ2ljIGFzIGBib3QuZ2FtZVF1ZXJ5YC5cbiAgICAgKlxuICAgICAqIEBwYXJhbSB0cmlnZ2VyIFRoZSBzdHJpbmcgb3IgcmVnZXggdG8gbWF0Y2hcbiAgICAgKi9cbiAgICBnYW1lUXVlcnkoXG4gICAgICAgIHRyaWdnZXI6IE1heWJlQXJyYXk8c3RyaW5nIHwgUmVnRXhwPixcbiAgICApOiA8QyBleHRlbmRzIENvbnRleHQ+KGN0eDogQykgPT4gY3R4IGlzIEdhbWVRdWVyeUNvbnRleHQ8Qz47XG4gICAgLyoqXG4gICAgICogR2VuZXJhdGVzIGEgcHJlZGljYXRlIGZ1bmN0aW9uIHRoYXQgY2FuIHRlc3QgY29udGV4dCBvYmplY3RzIGZvclxuICAgICAqIGNvbnRhaW5pbmcgdGhlIGdpdmVuIGlubGluZSBxdWVyeSwgb3IgZm9yIHRoZSBpbmxpbmUgcXVlcnkgdG8gbWF0Y2ggdGhlXG4gICAgICogZ2l2ZW4gcmVndWxhciBleHByZXNzaW9uLiBUaGlzIHVzZXMgdGhlIHNhbWUgbG9naWMgYXMgYGJvdC5pbmxpbmVRdWVyeWAuXG4gICAgICpcbiAgICAgKiBAcGFyYW0gdHJpZ2dlciBUaGUgc3RyaW5nIG9yIHJlZ2V4IHRvIG1hdGNoXG4gICAgICovXG4gICAgaW5saW5lUXVlcnkoXG4gICAgICAgIHRyaWdnZXI6IE1heWJlQXJyYXk8c3RyaW5nIHwgUmVnRXhwPixcbiAgICApOiA8QyBleHRlbmRzIENvbnRleHQ+KGN0eDogQykgPT4gY3R4IGlzIElubGluZVF1ZXJ5Q29udGV4dDxDPjtcbiAgICAvKipcbiAgICAgKiBHZW5lcmF0ZXMgYSBwcmVkaWNhdGUgZnVuY3Rpb24gdGhhdCBjYW4gdGVzdCBjb250ZXh0IG9iamVjdHMgZm9yXG4gICAgICogY29udGFpbmluZyB0aGUgY2hvc2VuIGlubGluZSByZXN1bHQsIG9yIGZvciB0aGUgY2hvc2VuIGlubGluZSByZXN1bHQgdG9cbiAgICAgKiBtYXRjaCB0aGUgZ2l2ZW4gcmVndWxhciBleHByZXNzaW9uLlxuICAgICAqXG4gICAgICogQHBhcmFtIHRyaWdnZXIgVGhlIHN0cmluZyBvciByZWdleCB0byBtYXRjaFxuICAgICAqL1xuICAgIGNob3NlbklubGluZVJlc3VsdChcbiAgICAgICAgdHJpZ2dlcjogTWF5YmVBcnJheTxzdHJpbmcgfCBSZWdFeHA+LFxuICAgICk6IDxDIGV4dGVuZHMgQ29udGV4dD4oY3R4OiBDKSA9PiBjdHggaXMgQ2hvc2VuSW5saW5lUmVzdWx0Q29udGV4dDxDPjtcbiAgICAvKipcbiAgICAgKiBHZW5lcmF0ZXMgYSBwcmVkaWNhdGUgZnVuY3Rpb24gdGhhdCBjYW4gdGVzdCBjb250ZXh0IG9iamVjdHMgZm9yXG4gICAgICogY29udGFpbmluZyB0aGUgZ2l2ZW4gcHJlLWNoZWNrb3V0IHF1ZXJ5LCBvciBmb3IgdGhlIHByZS1jaGVja291dCBxdWVyeVxuICAgICAqIHBheWxvYWQgdG8gbWF0Y2ggdGhlIGdpdmVuIHJlZ3VsYXIgZXhwcmVzc2lvbi4gVGhpcyB1c2VzIHRoZSBzYW1lIGxvZ2ljXG4gICAgICogYXMgYGJvdC5wcmVDaGVja291dFF1ZXJ5YC5cbiAgICAgKlxuICAgICAqIEBwYXJhbSB0cmlnZ2VyIFRoZSBzdHJpbmcgb3IgcmVnZXggdG8gbWF0Y2hcbiAgICAgKi9cbiAgICBwcmVDaGVja291dFF1ZXJ5KFxuICAgICAgICB0cmlnZ2VyOiBNYXliZUFycmF5PHN0cmluZyB8IFJlZ0V4cD4sXG4gICAgKTogPEMgZXh0ZW5kcyBDb250ZXh0PihjdHg6IEMpID0+IGN0eCBpcyBQcmVDaGVja291dFF1ZXJ5Q29udGV4dDxDPjtcbiAgICAvKipcbiAgICAgKiBHZW5lcmF0ZXMgYSBwcmVkaWNhdGUgZnVuY3Rpb24gdGhhdCBjYW4gdGVzdCBjb250ZXh0IG9iamVjdHMgZm9yXG4gICAgICogY29udGFpbmluZyB0aGUgZ2l2ZW4gc2hpcHBpbmcgcXVlcnksIG9yIGZvciB0aGUgc2hpcHBpbmcgcXVlcnkgdG8gbWF0Y2hcbiAgICAgKiB0aGUgZ2l2ZW4gcmVndWxhciBleHByZXNzaW9uLiBUaGlzIHVzZXMgdGhlIHNhbWUgbG9naWMgYXNcbiAgICAgKiBgYm90LnNoaXBwaW5nUXVlcnlgLlxuICAgICAqXG4gICAgICogQHBhcmFtIHRyaWdnZXIgVGhlIHN0cmluZyBvciByZWdleCB0byBtYXRjaFxuICAgICAqL1xuICAgIHNoaXBwaW5nUXVlcnkoXG4gICAgICAgIHRyaWdnZXI6IE1heWJlQXJyYXk8c3RyaW5nIHwgUmVnRXhwPixcbiAgICApOiA8QyBleHRlbmRzIENvbnRleHQ+KGN0eDogQykgPT4gY3R4IGlzIFNoaXBwaW5nUXVlcnlDb250ZXh0PEM+O1xufVxuY29uc3QgY2hlY2tlcjogU3RhdGljSGFzID0ge1xuICAgIGZpbHRlclF1ZXJ5PFEgZXh0ZW5kcyBGaWx0ZXJRdWVyeT4oZmlsdGVyOiBRIHwgUVtdKSB7XG4gICAgICAgIGNvbnN0IHByZWQgPSBtYXRjaEZpbHRlcihmaWx0ZXIpO1xuICAgICAgICByZXR1cm4gPEMgZXh0ZW5kcyBDb250ZXh0PihjdHg6IEMpOiBjdHggaXMgRmlsdGVyPEMsIFE+ID0+IHByZWQoY3R4KTtcbiAgICB9LFxuICAgIHRleHQodHJpZ2dlcikge1xuICAgICAgICBjb25zdCBoYXNUZXh0ID0gY2hlY2tlci5maWx0ZXJRdWVyeShbXCI6dGV4dFwiLCBcIjpjYXB0aW9uXCJdKTtcbiAgICAgICAgY29uc3QgdHJnID0gdHJpZ2dlckZuKHRyaWdnZXIpO1xuICAgICAgICByZXR1cm4gPEMgZXh0ZW5kcyBDb250ZXh0PihjdHg6IEMpOiBjdHggaXMgSGVhcnNDb250ZXh0PEM+ID0+IHtcbiAgICAgICAgICAgIGlmICghaGFzVGV4dChjdHgpKSByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICBjb25zdCBtc2cgPSBjdHgubWVzc2FnZSA/PyBjdHguY2hhbm5lbFBvc3Q7XG4gICAgICAgICAgICBjb25zdCB0eHQgPSBtc2cudGV4dCA/PyBtc2cuY2FwdGlvbjtcbiAgICAgICAgICAgIHJldHVybiBtYXRjaChjdHgsIHR4dCwgdHJnKTtcbiAgICAgICAgfTtcbiAgICB9LFxuICAgIGNvbW1hbmQoY29tbWFuZCkge1xuICAgICAgICBjb25zdCBoYXNFbnRpdGllcyA9IGNoZWNrZXIuZmlsdGVyUXVlcnkoXCI6ZW50aXRpZXM6Ym90X2NvbW1hbmRcIik7XG4gICAgICAgIGNvbnN0IGF0Q29tbWFuZHMgPSBuZXcgU2V0PHN0cmluZz4oKTtcbiAgICAgICAgY29uc3Qgbm9BdENvbW1hbmRzID0gbmV3IFNldDxzdHJpbmc+KCk7XG4gICAgICAgIHRvQXJyYXkoY29tbWFuZCkuZm9yRWFjaCgoY21kKSA9PiB7XG4gICAgICAgICAgICBpZiAoY21kLnN0YXJ0c1dpdGgoXCIvXCIpKSB7XG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFxuICAgICAgICAgICAgICAgICAgICBgRG8gbm90IGluY2x1ZGUgJy8nIHdoZW4gcmVnaXN0ZXJpbmcgY29tbWFuZCBoYW5kbGVycyAodXNlICcke1xuICAgICAgICAgICAgICAgICAgICAgICAgY21kLnN1YnN0cmluZygxKVxuICAgICAgICAgICAgICAgICAgICB9JyBub3QgJyR7Y21kfScpYCxcbiAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY29uc3Qgc2V0ID0gY21kLmluY2x1ZGVzKFwiQFwiKSA/IGF0Q29tbWFuZHMgOiBub0F0Q29tbWFuZHM7XG4gICAgICAgICAgICBzZXQuYWRkKGNtZCk7XG4gICAgICAgIH0pO1xuICAgICAgICByZXR1cm4gPEMgZXh0ZW5kcyBDb250ZXh0PihjdHg6IEMpOiBjdHggaXMgQ29tbWFuZENvbnRleHQ8Qz4gPT4ge1xuICAgICAgICAgICAgaWYgKCFoYXNFbnRpdGllcyhjdHgpKSByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICBjb25zdCBtc2cgPSBjdHgubWVzc2FnZSA/PyBjdHguY2hhbm5lbFBvc3Q7XG4gICAgICAgICAgICBjb25zdCB0eHQgPSBtc2cudGV4dCA/PyBtc2cuY2FwdGlvbjtcbiAgICAgICAgICAgIHJldHVybiBtc2cuZW50aXRpZXMuc29tZSgoZSkgPT4ge1xuICAgICAgICAgICAgICAgIGlmIChlLnR5cGUgIT09IFwiYm90X2NvbW1hbmRcIikgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgICAgIGlmIChlLm9mZnNldCAhPT0gMCkgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgICAgIGNvbnN0IGNtZCA9IHR4dC5zdWJzdHJpbmcoMSwgZS5sZW5ndGgpO1xuICAgICAgICAgICAgICAgIGlmIChub0F0Q29tbWFuZHMuaGFzKGNtZCkgfHwgYXRDb21tYW5kcy5oYXMoY21kKSkge1xuICAgICAgICAgICAgICAgICAgICBjdHgubWF0Y2ggPSB0eHQuc3Vic3RyaW5nKGNtZC5sZW5ndGggKyAxKS50cmltU3RhcnQoKTtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGNvbnN0IGluZGV4ID0gY21kLmluZGV4T2YoXCJAXCIpO1xuICAgICAgICAgICAgICAgIGlmIChpbmRleCA9PT0gLTEpIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgICAgICBjb25zdCBhdFRhcmdldCA9IGNtZC5zdWJzdHJpbmcoaW5kZXggKyAxKS50b0xvd2VyQ2FzZSgpO1xuICAgICAgICAgICAgICAgIGNvbnN0IHVzZXJuYW1lID0gY3R4Lm1lLnVzZXJuYW1lLnRvTG93ZXJDYXNlKCk7XG4gICAgICAgICAgICAgICAgaWYgKGF0VGFyZ2V0ICE9PSB1c2VybmFtZSkgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgICAgIGNvbnN0IGF0Q29tbWFuZCA9IGNtZC5zdWJzdHJpbmcoMCwgaW5kZXgpO1xuICAgICAgICAgICAgICAgIGlmIChub0F0Q29tbWFuZHMuaGFzKGF0Q29tbWFuZCkpIHtcbiAgICAgICAgICAgICAgICAgICAgY3R4Lm1hdGNoID0gdHh0LnN1YnN0cmluZyhjbWQubGVuZ3RoICsgMSkudHJpbVN0YXJ0KCk7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfTtcbiAgICB9LFxuICAgIHJlYWN0aW9uKHJlYWN0aW9uKSB7XG4gICAgICAgIGNvbnN0IGhhc01lc3NhZ2VSZWFjdGlvbiA9IGNoZWNrZXIuZmlsdGVyUXVlcnkoXCJtZXNzYWdlX3JlYWN0aW9uXCIpO1xuICAgICAgICBjb25zdCBub3JtYWxpemVkOiBSZWFjdGlvblR5cGVbXSA9IHR5cGVvZiByZWFjdGlvbiA9PT0gXCJzdHJpbmdcIlxuICAgICAgICAgICAgPyBbeyB0eXBlOiBcImVtb2ppXCIsIGVtb2ppOiByZWFjdGlvbiB9XVxuICAgICAgICAgICAgOiAoQXJyYXkuaXNBcnJheShyZWFjdGlvbikgPyByZWFjdGlvbiA6IFtyZWFjdGlvbl0pLm1hcCgoZW1vamkpID0+XG4gICAgICAgICAgICAgICAgdHlwZW9mIGVtb2ppID09PSBcInN0cmluZ1wiID8geyB0eXBlOiBcImVtb2ppXCIsIGVtb2ppIH0gOiBlbW9qaVxuICAgICAgICAgICAgKTtcbiAgICAgICAgcmV0dXJuIDxDIGV4dGVuZHMgQ29udGV4dD4oY3R4OiBDKTogY3R4IGlzIFJlYWN0aW9uQ29udGV4dDxDPiA9PiB7XG4gICAgICAgICAgICBpZiAoIWhhc01lc3NhZ2VSZWFjdGlvbihjdHgpKSByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICBjb25zdCB7IG9sZF9yZWFjdGlvbiwgbmV3X3JlYWN0aW9uIH0gPSBjdHgubWVzc2FnZVJlYWN0aW9uO1xuICAgICAgICAgICAgZm9yIChjb25zdCByZWFjdGlvbiBvZiBuZXdfcmVhY3Rpb24pIHtcbiAgICAgICAgICAgICAgICBsZXQgaXNPbGQgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICBpZiAocmVhY3Rpb24udHlwZSA9PT0gXCJlbW9qaVwiKSB7XG4gICAgICAgICAgICAgICAgICAgIGZvciAoY29uc3Qgb2xkIG9mIG9sZF9yZWFjdGlvbikge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKG9sZC50eXBlICE9PSBcImVtb2ppXCIpIGNvbnRpbnVlO1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKG9sZC5lbW9qaSA9PT0gcmVhY3Rpb24uZW1vamkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpc09sZCA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKHJlYWN0aW9uLnR5cGUgPT09IFwiY3VzdG9tX2Vtb2ppXCIpIHtcbiAgICAgICAgICAgICAgICAgICAgZm9yIChjb25zdCBvbGQgb2Ygb2xkX3JlYWN0aW9uKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAob2xkLnR5cGUgIT09IFwiY3VzdG9tX2Vtb2ppXCIpIGNvbnRpbnVlO1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKG9sZC5jdXN0b21fZW1vamlfaWQgPT09IHJlYWN0aW9uLmN1c3RvbV9lbW9qaV9pZCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlzT2xkID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIGFsd2F5cyByZWdhcmQgdW5zdXBwb3J0ZWQgZW1vamkgdHlwZXMgYXMgbmV3XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlmICghaXNPbGQpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHJlYWN0aW9uLnR5cGUgPT09IFwiZW1vamlcIikge1xuICAgICAgICAgICAgICAgICAgICAgICAgZm9yIChjb25zdCB3YW50ZWQgb2Ygbm9ybWFsaXplZCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmICh3YW50ZWQudHlwZSAhPT0gXCJlbW9qaVwiKSBjb250aW51ZTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAod2FudGVkLmVtb2ppID09PSByZWFjdGlvbi5lbW9qaSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAocmVhY3Rpb24udHlwZSA9PT0gXCJjdXN0b21fZW1vamlcIikge1xuICAgICAgICAgICAgICAgICAgICAgICAgZm9yIChjb25zdCB3YW50ZWQgb2Ygbm9ybWFsaXplZCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmICh3YW50ZWQudHlwZSAhPT0gXCJjdXN0b21fZW1vamlcIikgY29udGludWU7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB3YW50ZWQuY3VzdG9tX2Vtb2ppX2lkID09PVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVhY3Rpb24uY3VzdG9tX2Vtb2ppX2lkXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIGFsd2F5cyByZWdhcmQgdW5zdXBwb3J0ZWQgZW1vamkgdHlwZXMgYXMgbmV3XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfTtcbiAgICB9LFxuICAgIGNoYXRUeXBlPFQgZXh0ZW5kcyBDaGF0W1widHlwZVwiXT4oY2hhdFR5cGU6IE1heWJlQXJyYXk8VD4pIHtcbiAgICAgICAgY29uc3Qgc2V0ID0gbmV3IFNldDxDaGF0W1widHlwZVwiXT4odG9BcnJheShjaGF0VHlwZSkpO1xuICAgICAgICByZXR1cm4gPEMgZXh0ZW5kcyBDb250ZXh0PihjdHg6IEMpOiBjdHggaXMgQ2hhdFR5cGVDb250ZXh0PEMsIFQ+ID0+XG4gICAgICAgICAgICBjdHguY2hhdD8udHlwZSAhPT0gdW5kZWZpbmVkICYmIHNldC5oYXMoY3R4LmNoYXQudHlwZSk7XG4gICAgfSxcbiAgICBjYWxsYmFja1F1ZXJ5KHRyaWdnZXIpIHtcbiAgICAgICAgY29uc3QgaGFzQ2FsbGJhY2tRdWVyeSA9IGNoZWNrZXIuZmlsdGVyUXVlcnkoXCJjYWxsYmFja19xdWVyeTpkYXRhXCIpO1xuICAgICAgICBjb25zdCB0cmcgPSB0cmlnZ2VyRm4odHJpZ2dlcik7XG4gICAgICAgIHJldHVybiA8QyBleHRlbmRzIENvbnRleHQ+KGN0eDogQyk6IGN0eCBpcyBDYWxsYmFja1F1ZXJ5Q29udGV4dDxDPiA9PlxuICAgICAgICAgICAgaGFzQ2FsbGJhY2tRdWVyeShjdHgpICYmIG1hdGNoKGN0eCwgY3R4LmNhbGxiYWNrUXVlcnkuZGF0YSwgdHJnKTtcbiAgICB9LFxuICAgIGdhbWVRdWVyeSh0cmlnZ2VyKSB7XG4gICAgICAgIGNvbnN0IGhhc0dhbWVRdWVyeSA9IGNoZWNrZXIuZmlsdGVyUXVlcnkoXG4gICAgICAgICAgICBcImNhbGxiYWNrX3F1ZXJ5OmdhbWVfc2hvcnRfbmFtZVwiLFxuICAgICAgICApO1xuICAgICAgICBjb25zdCB0cmcgPSB0cmlnZ2VyRm4odHJpZ2dlcik7XG4gICAgICAgIHJldHVybiA8QyBleHRlbmRzIENvbnRleHQ+KGN0eDogQyk6IGN0eCBpcyBHYW1lUXVlcnlDb250ZXh0PEM+ID0+XG4gICAgICAgICAgICBoYXNHYW1lUXVlcnkoY3R4KSAmJlxuICAgICAgICAgICAgbWF0Y2goY3R4LCBjdHguY2FsbGJhY2tRdWVyeS5nYW1lX3Nob3J0X25hbWUsIHRyZyk7XG4gICAgfSxcbiAgICBpbmxpbmVRdWVyeSh0cmlnZ2VyKSB7XG4gICAgICAgIGNvbnN0IGhhc0lubGluZVF1ZXJ5ID0gY2hlY2tlci5maWx0ZXJRdWVyeShcImlubGluZV9xdWVyeVwiKTtcbiAgICAgICAgY29uc3QgdHJnID0gdHJpZ2dlckZuKHRyaWdnZXIpO1xuICAgICAgICByZXR1cm4gPEMgZXh0ZW5kcyBDb250ZXh0PihjdHg6IEMpOiBjdHggaXMgSW5saW5lUXVlcnlDb250ZXh0PEM+ID0+XG4gICAgICAgICAgICBoYXNJbmxpbmVRdWVyeShjdHgpICYmIG1hdGNoKGN0eCwgY3R4LmlubGluZVF1ZXJ5LnF1ZXJ5LCB0cmcpO1xuICAgIH0sXG4gICAgY2hvc2VuSW5saW5lUmVzdWx0KHRyaWdnZXIpIHtcbiAgICAgICAgY29uc3QgaGFzQ2hvc2VuSW5saW5lUmVzdWx0ID0gY2hlY2tlci5maWx0ZXJRdWVyeShcbiAgICAgICAgICAgIFwiY2hvc2VuX2lubGluZV9yZXN1bHRcIixcbiAgICAgICAgKTtcbiAgICAgICAgY29uc3QgdHJnID0gdHJpZ2dlckZuKHRyaWdnZXIpO1xuICAgICAgICByZXR1cm4gPEMgZXh0ZW5kcyBDb250ZXh0PihcbiAgICAgICAgICAgIGN0eDogQyxcbiAgICAgICAgKTogY3R4IGlzIENob3NlbklubGluZVJlc3VsdENvbnRleHQ8Qz4gPT5cbiAgICAgICAgICAgIGhhc0Nob3NlbklubGluZVJlc3VsdChjdHgpICYmXG4gICAgICAgICAgICBtYXRjaChjdHgsIGN0eC5jaG9zZW5JbmxpbmVSZXN1bHQucmVzdWx0X2lkLCB0cmcpO1xuICAgIH0sXG4gICAgcHJlQ2hlY2tvdXRRdWVyeSh0cmlnZ2VyKSB7XG4gICAgICAgIGNvbnN0IGhhc1ByZUNoZWNrb3V0UXVlcnkgPSBjaGVja2VyLmZpbHRlclF1ZXJ5KFwicHJlX2NoZWNrb3V0X3F1ZXJ5XCIpO1xuICAgICAgICBjb25zdCB0cmcgPSB0cmlnZ2VyRm4odHJpZ2dlcik7XG4gICAgICAgIHJldHVybiA8QyBleHRlbmRzIENvbnRleHQ+KGN0eDogQyk6IGN0eCBpcyBQcmVDaGVja291dFF1ZXJ5Q29udGV4dDxDPiA9PlxuICAgICAgICAgICAgaGFzUHJlQ2hlY2tvdXRRdWVyeShjdHgpICYmXG4gICAgICAgICAgICBtYXRjaChjdHgsIGN0eC5wcmVDaGVja291dFF1ZXJ5Lmludm9pY2VfcGF5bG9hZCwgdHJnKTtcbiAgICB9LFxuICAgIHNoaXBwaW5nUXVlcnkodHJpZ2dlcikge1xuICAgICAgICBjb25zdCBoYXNTaGlwcGluZ1F1ZXJ5ID0gY2hlY2tlci5maWx0ZXJRdWVyeShcInNoaXBwaW5nX3F1ZXJ5XCIpO1xuICAgICAgICBjb25zdCB0cmcgPSB0cmlnZ2VyRm4odHJpZ2dlcik7XG4gICAgICAgIHJldHVybiA8QyBleHRlbmRzIENvbnRleHQ+KGN0eDogQyk6IGN0eCBpcyBTaGlwcGluZ1F1ZXJ5Q29udGV4dDxDPiA9PlxuICAgICAgICAgICAgaGFzU2hpcHBpbmdRdWVyeShjdHgpICYmXG4gICAgICAgICAgICBtYXRjaChjdHgsIGN0eC5zaGlwcGluZ1F1ZXJ5Lmludm9pY2VfcGF5bG9hZCwgdHJnKTtcbiAgICB9LFxufTtcblxuLy8gPT09IENvbnRleHQgY2xhc3Ncbi8qKlxuICogV2hlbiB5b3VyIGJvdCByZWNlaXZlcyBhIG1lc3NhZ2UsIFRlbGVncmFtIHNlbmRzIGFuIHVwZGF0ZSBvYmplY3QgdG8geW91clxuICogYm90LiBUaGUgdXBkYXRlIGNvbnRhaW5zIGluZm9ybWF0aW9uIGFib3V0IHRoZSBjaGF0LCB0aGUgdXNlciwgYW5kIG9mIGNvdXJzZVxuICogdGhlIG1lc3NhZ2UgaXRzZWxmLiBUaGVyZSBhcmUgbnVtZXJvdXMgb3RoZXIgdXBkYXRlcywgdG9vOlxuICogaHR0cHM6Ly9jb3JlLnRlbGVncmFtLm9yZy9ib3RzL2FwaSN1cGRhdGVcbiAqXG4gKiBXaGVuIGdyYW1tWSByZWNlaXZlcyBhbiB1cGRhdGUsIGl0IHdyYXBzIHRoaXMgdXBkYXRlIGludG8gYSBjb250ZXh0IG9iamVjdFxuICogZm9yIHlvdS4gQ29udGV4dCBvYmplY3RzIGFyZSBjb21tb25seSBuYW1lZCBgY3R4YC4gQSBjb250ZXh0IG9iamVjdCBkb2VzIHR3b1xuICogdGhpbmdzOlxuICogMS4gKipgY3R4LnVwZGF0ZWAqKiBob2xkcyB0aGUgdXBkYXRlIG9iamVjdCB0aGF0IHlvdSBjYW4gdXNlIHRvIHByb2Nlc3MgdGhlXG4gKiAgICBtZXNzYWdlLiBUaGlzIGluY2x1ZGVzIHByb3ZpZGluZyB1c2VmdWwgc2hvcnRjdXRzIGZvciB0aGUgdXBkYXRlLCBmb3JcbiAqICAgIGluc3RhbmNlLCBgY3R4Lm1zZ2AgaXMgYSBzaG9ydGN1dCB0aGF0IGdpdmVzIHlvdSB0aGUgbWVzc2FnZSBvYmplY3QgZnJvbVxuICogICAgdGhlIHVwZGF0ZeKAlG5vIG1hdHRlciB3aGV0aGVyIGl0IGlzIGNvbnRhaW5lZCBpbiBgY3R4LnVwZGF0ZS5tZXNzYWdlYCwgb3JcbiAqICAgIGBjdHgudXBkYXRlLmVkaXRlZF9tZXNzYWdlYCwgb3IgYGN0eC51cGRhdGUuY2hhbm5lbF9wb3N0YCwgb3JcbiAqICAgIGBjdHgudXBkYXRlLmVkaXRlZF9jaGFubmVsX3Bvc3RgLlxuICogMi4gKipgY3R4LmFwaWAqKiBnaXZlcyB5b3UgYWNjZXNzIHRvIHRoZSBmdWxsIFRlbGVncmFtIEJvdCBBUEkgc28gdGhhdCB5b3VcbiAqICAgIGNhbiBkaXJlY3RseSBjYWxsIGFueSBtZXRob2QsIHN1Y2ggYXMgcmVzcG9uZGluZyB2aWFcbiAqICAgIGBjdHguYXBpLnNlbmRNZXNzYWdlYC4gQWxzbyBoZXJlLCB0aGUgY29udGV4dCBvYmplY3RzIGhhcyBzb21lIHVzZWZ1bFxuICogICAgc2hvcnRjdXRzIGZvciB5b3UuIEZvciBpbnN0YW5jZSwgaWYgeW91IHdhbnQgdG8gc2VuZCBhIG1lc3NhZ2UgdG8gdGhlIHNhbWVcbiAqICAgIGNoYXQgdGhhdCBhIG1lc3NhZ2UgY29tZXMgZnJvbSAoaS5lLiBqdXN0IHJlc3BvbmQgdG8gYSB1c2VyKSB5b3UgY2FuIGNhbGxcbiAqICAgIGBjdHgucmVwbHlgLiBUaGlzIGlzIG5vdGhpbmcgYnV0IGEgd3JhcHBlciBmb3IgYGN0eC5hcGkuc2VuZE1lc3NhZ2VgIHdpdGhcbiAqICAgIHRoZSByaWdodCBgY2hhdF9pZGAgcHJlLWZpbGxlZCBmb3IgeW91LiBBbG1vc3QgYWxsIG1ldGhvZHMgb2YgdGhlIFRlbGVncmFtXG4gKiAgICBCb3QgQVBJIGhhdmUgdGhlaXIgb3duIHNob3J0Y3V0IGRpcmVjdGx5IG9uIHRoZSBjb250ZXh0IG9iamVjdCwgc28geW91XG4gKiAgICBwcm9iYWJseSBuZXZlciByZWFsbHkgaGF2ZSB0byB1c2UgYGN0eC5hcGlgIGF0IGFsbC5cbiAqXG4gKiBUaGlzIGNvbnRleHQgb2JqZWN0IGlzIHRoZW4gcGFzc2VkIHRvIGFsbCBvZiB0aGUgbGlzdGVuZXJzIChjYWxsZWRcbiAqIG1pZGRsZXdhcmUpIHRoYXQgeW91IHJlZ2lzdGVyIG9uIHlvdXIgYm90LiBCZWNhdXNlIHRoaXMgaXMgc28gdXNlZnVsLCB0aGVcbiAqIGNvbnRleHQgb2JqZWN0IGlzIG9mdGVuIHVzZWQgdG8gaG9sZCBtb3JlIGluZm9ybWF0aW9uLiBPbmUgZXhhbXBsZSBhcmVcbiAqIHNlc3Npb25zIChhIGNoYXQtc3BlY2lmaWMgZGF0YSBzdG9yYWdlIHRoYXQgaXMgc3RvcmVkIGluIGEgZGF0YWJhc2UpLCBhbmRcbiAqIGFub3RoZXIgZXhhbXBsZSBpcyBgY3R4Lm1hdGNoYCB0aGF0IGlzIHVzZWQgYnkgYGJvdC5jb21tYW5kYCBhbmQgb3RoZXJcbiAqIG1ldGhvZHMgdG8ga2VlcCBpbmZvcm1hdGlvbiBhYm91dCBob3cgYSByZWd1bGFyIGV4cHJlc3Npb24gd2FzIG1hdGNoZWQuXG4gKlxuICogUmVhZCB1cCBhYm91dCBtaWRkbGV3YXJlIG9uIHRoZVxuICogW3dlYnNpdGVdKGh0dHBzOi8vZ3JhbW15LmRldi9ndWlkZS9jb250ZXh0Lmh0bWwpIGlmIHlvdSB3YW50IHRvIGtub3cgbW9yZVxuICogYWJvdXQgdGhlIHBvd2VyZnVsIG9wcG9ydHVuaXRpZXMgdGhhdCBsaWUgaW4gY29udGV4dCBvYmplY3RzLCBhbmQgYWJvdXQgaG93XG4gKiBncmFtbVkgaW1wbGVtZW50cyB0aGVtLlxuICovXG5leHBvcnQgY2xhc3MgQ29udGV4dCBpbXBsZW1lbnRzIFJlbmFtZWRVcGRhdGUge1xuICAgIC8qKlxuICAgICAqIFVzZWQgYnkgc29tZSBtaWRkbGV3YXJlIHRvIHN0b3JlIGluZm9ybWF0aW9uIGFib3V0IGhvdyBhIGNlcnRhaW4gc3RyaW5nXG4gICAgICogb3IgcmVndWxhciBleHByZXNzaW9uIHdhcyBtYXRjaGVkLlxuICAgICAqL1xuICAgIHB1YmxpYyBtYXRjaDogc3RyaW5nIHwgUmVnRXhwTWF0Y2hBcnJheSB8IHVuZGVmaW5lZDtcblxuICAgIGNvbnN0cnVjdG9yKFxuICAgICAgICAvKipcbiAgICAgICAgICogVGhlIHVwZGF0ZSBvYmplY3QgdGhhdCBpcyBjb250YWluZWQgaW4gdGhlIGNvbnRleHQuXG4gICAgICAgICAqL1xuICAgICAgICBwdWJsaWMgcmVhZG9ubHkgdXBkYXRlOiBVcGRhdGUsXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBBbiBBUEkgaW5zdGFuY2UgdGhhdCBhbGxvd3MgeW91IHRvIGNhbGwgYW55IG1ldGhvZCBvZiB0aGUgVGVsZWdyYW1cbiAgICAgICAgICogQm90IEFQSS5cbiAgICAgICAgICovXG4gICAgICAgIHB1YmxpYyByZWFkb25seSBhcGk6IEFwaSxcbiAgICAgICAgLyoqXG4gICAgICAgICAqIEluZm9ybWF0aW9uIGFib3V0IHRoZSBib3QgaXRzZWxmLlxuICAgICAgICAgKi9cbiAgICAgICAgcHVibGljIHJlYWRvbmx5IG1lOiBVc2VyRnJvbUdldE1lLFxuICAgICkge31cblxuICAgIC8vIFVQREFURSBTSE9SVENVVFNcblxuICAgIC8qKiBBbGlhcyBmb3IgYGN0eC51cGRhdGUubWVzc2FnZWAgKi9cbiAgICBnZXQgbWVzc2FnZSgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMudXBkYXRlLm1lc3NhZ2U7XG4gICAgfVxuICAgIC8qKiBBbGlhcyBmb3IgYGN0eC51cGRhdGUuZWRpdGVkX21lc3NhZ2VgICovXG4gICAgZ2V0IGVkaXRlZE1lc3NhZ2UoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLnVwZGF0ZS5lZGl0ZWRfbWVzc2FnZTtcbiAgICB9XG4gICAgLyoqIEFsaWFzIGZvciBgY3R4LnVwZGF0ZS5jaGFubmVsX3Bvc3RgICovXG4gICAgZ2V0IGNoYW5uZWxQb3N0KCkge1xuICAgICAgICByZXR1cm4gdGhpcy51cGRhdGUuY2hhbm5lbF9wb3N0O1xuICAgIH1cbiAgICAvKiogQWxpYXMgZm9yIGBjdHgudXBkYXRlLmVkaXRlZF9jaGFubmVsX3Bvc3RgICovXG4gICAgZ2V0IGVkaXRlZENoYW5uZWxQb3N0KCkge1xuICAgICAgICByZXR1cm4gdGhpcy51cGRhdGUuZWRpdGVkX2NoYW5uZWxfcG9zdDtcbiAgICB9XG4gICAgLyoqIEFsaWFzIGZvciBgY3R4LnVwZGF0ZS5idXNpbmVzc19jb25uZWN0aW9uYCAqL1xuICAgIGdldCBidXNpbmVzc0Nvbm5lY3Rpb24oKSB7XG4gICAgICAgIHJldHVybiB0aGlzLnVwZGF0ZS5idXNpbmVzc19jb25uZWN0aW9uO1xuICAgIH1cbiAgICAvKiogQWxpYXMgZm9yIGBjdHgudXBkYXRlLmJ1c2luZXNzX21lc3NhZ2VgICovXG4gICAgZ2V0IGJ1c2luZXNzTWVzc2FnZSgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMudXBkYXRlLmJ1c2luZXNzX21lc3NhZ2U7XG4gICAgfVxuICAgIC8qKiBBbGlhcyBmb3IgYGN0eC51cGRhdGUuZWRpdGVkX2J1c2luZXNzX21lc3NhZ2VgICovXG4gICAgZ2V0IGVkaXRlZEJ1c2luZXNzTWVzc2FnZSgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMudXBkYXRlLmVkaXRlZF9idXNpbmVzc19tZXNzYWdlO1xuICAgIH1cbiAgICAvKiogQWxpYXMgZm9yIGBjdHgudXBkYXRlLmRlbGV0ZWRfYnVzaW5lc3NfbWVzc2FnZXNgICovXG4gICAgZ2V0IGRlbGV0ZWRCdXNpbmVzc01lc3NhZ2VzKCkge1xuICAgICAgICByZXR1cm4gdGhpcy51cGRhdGUuZGVsZXRlZF9idXNpbmVzc19tZXNzYWdlcztcbiAgICB9XG4gICAgLyoqIEFsaWFzIGZvciBgY3R4LnVwZGF0ZS5tZXNzYWdlX3JlYWN0aW9uYCAqL1xuICAgIGdldCBtZXNzYWdlUmVhY3Rpb24oKSB7XG4gICAgICAgIHJldHVybiB0aGlzLnVwZGF0ZS5tZXNzYWdlX3JlYWN0aW9uO1xuICAgIH1cbiAgICAvKiogQWxpYXMgZm9yIGBjdHgudXBkYXRlLm1lc3NhZ2VfcmVhY3Rpb25fY291bnRgICovXG4gICAgZ2V0IG1lc3NhZ2VSZWFjdGlvbkNvdW50KCkge1xuICAgICAgICByZXR1cm4gdGhpcy51cGRhdGUubWVzc2FnZV9yZWFjdGlvbl9jb3VudDtcbiAgICB9XG4gICAgLyoqIEFsaWFzIGZvciBgY3R4LnVwZGF0ZS5pbmxpbmVfcXVlcnlgICovXG4gICAgZ2V0IGlubGluZVF1ZXJ5KCkge1xuICAgICAgICByZXR1cm4gdGhpcy51cGRhdGUuaW5saW5lX3F1ZXJ5O1xuICAgIH1cbiAgICAvKiogQWxpYXMgZm9yIGBjdHgudXBkYXRlLmNob3Nlbl9pbmxpbmVfcmVzdWx0YCAqL1xuICAgIGdldCBjaG9zZW5JbmxpbmVSZXN1bHQoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLnVwZGF0ZS5jaG9zZW5faW5saW5lX3Jlc3VsdDtcbiAgICB9XG4gICAgLyoqIEFsaWFzIGZvciBgY3R4LnVwZGF0ZS5jYWxsYmFja19xdWVyeWAgKi9cbiAgICBnZXQgY2FsbGJhY2tRdWVyeSgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMudXBkYXRlLmNhbGxiYWNrX3F1ZXJ5O1xuICAgIH1cbiAgICAvKiogQWxpYXMgZm9yIGBjdHgudXBkYXRlLnNoaXBwaW5nX3F1ZXJ5YCAqL1xuICAgIGdldCBzaGlwcGluZ1F1ZXJ5KCkge1xuICAgICAgICByZXR1cm4gdGhpcy51cGRhdGUuc2hpcHBpbmdfcXVlcnk7XG4gICAgfVxuICAgIC8qKiBBbGlhcyBmb3IgYGN0eC51cGRhdGUucHJlX2NoZWNrb3V0X3F1ZXJ5YCAqL1xuICAgIGdldCBwcmVDaGVja291dFF1ZXJ5KCkge1xuICAgICAgICByZXR1cm4gdGhpcy51cGRhdGUucHJlX2NoZWNrb3V0X3F1ZXJ5O1xuICAgIH1cbiAgICAvKiogQWxpYXMgZm9yIGBjdHgudXBkYXRlLnBvbGxgICovXG4gICAgZ2V0IHBvbGwoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLnVwZGF0ZS5wb2xsO1xuICAgIH1cbiAgICAvKiogQWxpYXMgZm9yIGBjdHgudXBkYXRlLnBvbGxfYW5zd2VyYCAqL1xuICAgIGdldCBwb2xsQW5zd2VyKCkge1xuICAgICAgICByZXR1cm4gdGhpcy51cGRhdGUucG9sbF9hbnN3ZXI7XG4gICAgfVxuICAgIC8qKiBBbGlhcyBmb3IgYGN0eC51cGRhdGUubXlfY2hhdF9tZW1iZXJgICovXG4gICAgZ2V0IG15Q2hhdE1lbWJlcigpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMudXBkYXRlLm15X2NoYXRfbWVtYmVyO1xuICAgIH1cbiAgICAvKiogQWxpYXMgZm9yIGBjdHgudXBkYXRlLmNoYXRfbWVtYmVyYCAqL1xuICAgIGdldCBjaGF0TWVtYmVyKCkge1xuICAgICAgICByZXR1cm4gdGhpcy51cGRhdGUuY2hhdF9tZW1iZXI7XG4gICAgfVxuICAgIC8qKiBBbGlhcyBmb3IgYGN0eC51cGRhdGUuY2hhdF9qb2luX3JlcXVlc3RgICovXG4gICAgZ2V0IGNoYXRKb2luUmVxdWVzdCgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMudXBkYXRlLmNoYXRfam9pbl9yZXF1ZXN0O1xuICAgIH1cbiAgICAvKiogQWxpYXMgZm9yIGBjdHgudXBkYXRlLmNoYXRfYm9vc3RgICovXG4gICAgZ2V0IGNoYXRCb29zdCgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMudXBkYXRlLmNoYXRfYm9vc3Q7XG4gICAgfVxuICAgIC8qKiBBbGlhcyBmb3IgYGN0eC51cGRhdGUucmVtb3ZlZF9jaGF0X2Jvb3N0YCAqL1xuICAgIGdldCByZW1vdmVkQ2hhdEJvb3N0KCkge1xuICAgICAgICByZXR1cm4gdGhpcy51cGRhdGUucmVtb3ZlZF9jaGF0X2Jvb3N0O1xuICAgIH1cblxuICAgIC8vIEFHR1JFR0FUSU9OIFNIT1JUQ1VUU1xuXG4gICAgLyoqXG4gICAgICogR2V0IHRoZSBtZXNzYWdlIG9iamVjdCBmcm9tIHdoZXJldmVyIHBvc3NpYmxlLiBBbGlhcyBmb3IgYHRoaXMubWVzc2FnZSA/P1xuICAgICAqIHRoaXMuZWRpdGVkTWVzc2FnZSA/PyB0aGlzLmNoYW5uZWxQb3N0ID8/IHRoaXMuZWRpdGVkQ2hhbm5lbFBvc3QgPz9cbiAgICAgKiB0aGlzLmJ1c2luZXNzTWVzc2FnZSA/PyB0aGlzLmVkaXRlZEJ1c2luZXNzTWVzc2FnZSA/P1xuICAgICAqIHRoaXMuY2FsbGJhY2tRdWVyeT8ubWVzc2FnZWAuXG4gICAgICovXG4gICAgZ2V0IG1zZygpOiBNZXNzYWdlIHwgdW5kZWZpbmVkIHtcbiAgICAgICAgLy8gS2VlcCBpbiBzeW5jIHdpdGggdHlwZXMgaW4gYGZpbHRlci50c2AuXG4gICAgICAgIHJldHVybiAoXG4gICAgICAgICAgICB0aGlzLm1lc3NhZ2UgPz9cbiAgICAgICAgICAgICAgICB0aGlzLmVkaXRlZE1lc3NhZ2UgPz9cbiAgICAgICAgICAgICAgICB0aGlzLmNoYW5uZWxQb3N0ID8/XG4gICAgICAgICAgICAgICAgdGhpcy5lZGl0ZWRDaGFubmVsUG9zdCA/P1xuICAgICAgICAgICAgICAgIHRoaXMuYnVzaW5lc3NNZXNzYWdlID8/XG4gICAgICAgICAgICAgICAgdGhpcy5lZGl0ZWRCdXNpbmVzc01lc3NhZ2UgPz9cbiAgICAgICAgICAgICAgICB0aGlzLmNhbGxiYWNrUXVlcnk/Lm1lc3NhZ2VcbiAgICAgICAgKTtcbiAgICB9XG4gICAgLyoqXG4gICAgICogR2V0IHRoZSBjaGF0IG9iamVjdCBmcm9tIHdoZXJldmVyIHBvc3NpYmxlLiBBbGlhcyBmb3IgYCh0aGlzLm1zZyA/P1xuICAgICAqIHRoaXMuZGVsZXRlZEJ1c2luZXNzTWVzc2FnZXMgPz8gdGhpcy5tZXNzYWdlUmVhY3Rpb24gPz9cbiAgICAgKiB0aGlzLm1lc3NhZ2VSZWFjdGlvbkNvdW50ID8/IHRoaXMubXlDaGF0TWVtYmVyID8/ICB0aGlzLmNoYXRNZW1iZXIgPz9cbiAgICAgKiB0aGlzLmNoYXRKb2luUmVxdWVzdCA/PyB0aGlzLmNoYXRCb29zdCA/PyAgdGhpcy5yZW1vdmVkQ2hhdEJvb3N0KT8uY2hhdGAuXG4gICAgICovXG4gICAgZ2V0IGNoYXQoKTogQ2hhdCB8IHVuZGVmaW5lZCB7XG4gICAgICAgIC8vIEtlZXAgaW4gc3luYyB3aXRoIHR5cGVzIGluIGBmaWx0ZXIudHNgLlxuICAgICAgICByZXR1cm4gKFxuICAgICAgICAgICAgdGhpcy5tc2cgPz9cbiAgICAgICAgICAgICAgICB0aGlzLmRlbGV0ZWRCdXNpbmVzc01lc3NhZ2VzID8/XG4gICAgICAgICAgICAgICAgdGhpcy5tZXNzYWdlUmVhY3Rpb24gPz9cbiAgICAgICAgICAgICAgICB0aGlzLm1lc3NhZ2VSZWFjdGlvbkNvdW50ID8/XG4gICAgICAgICAgICAgICAgdGhpcy5teUNoYXRNZW1iZXIgPz9cbiAgICAgICAgICAgICAgICB0aGlzLmNoYXRNZW1iZXIgPz9cbiAgICAgICAgICAgICAgICB0aGlzLmNoYXRKb2luUmVxdWVzdCA/P1xuICAgICAgICAgICAgICAgIHRoaXMuY2hhdEJvb3N0ID8/XG4gICAgICAgICAgICAgICAgdGhpcy5yZW1vdmVkQ2hhdEJvb3N0XG4gICAgICAgICk/LmNoYXQ7XG4gICAgfVxuICAgIC8qKlxuICAgICAqIEdldCB0aGUgc2VuZGVyIGNoYXQgb2JqZWN0IGZyb20gd2hlcmV2ZXIgcG9zc2libGUuIEFsaWFzIGZvclxuICAgICAqIGBjdHgubXNnPy5zZW5kZXJfY2hhdGAuXG4gICAgICovXG4gICAgZ2V0IHNlbmRlckNoYXQoKTogQ2hhdCB8IHVuZGVmaW5lZCB7XG4gICAgICAgIC8vIEtlZXAgaW4gc3luYyB3aXRoIHR5cGVzIGluIGBmaWx0ZXIudHNgLlxuICAgICAgICByZXR1cm4gdGhpcy5tc2c/LnNlbmRlcl9jaGF0O1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBHZXQgdGhlIHVzZXIgb2JqZWN0IGZyb20gd2hlcmV2ZXIgcG9zc2libGUuIEFsaWFzIGZvclxuICAgICAqIGAodGhpcy5idXNpbmVzc0Nvbm5lY3Rpb24gPz8gdGhpcy5tZXNzYWdlUmVhY3Rpb24gPz9cbiAgICAgKiAodGhpcy5jaGF0Qm9vc3Q/LmJvb3N0ID8/IHRoaXMucmVtb3ZlZENoYXRCb29zdCk/LnNvdXJjZSk/LnVzZXIgPz9cbiAgICAgKiAodGhpcy5jYWxsYmFja1F1ZXJ5ID8/IHRoaXMubXNnID8/IHRoaXMuaW5saW5lUXVlcnkgPz9cbiAgICAgKiB0aGlzLmNob3NlbklubGluZVJlc3VsdCA/PyB0aGlzLnNoaXBwaW5nUXVlcnkgPz8gdGhpcy5wcmVDaGVja291dFF1ZXJ5ID8/XG4gICAgICogdGhpcy5teUNoYXRNZW1iZXIgPz8gdGhpcy5jaGF0TWVtYmVyID8/IHRoaXMuY2hhdEpvaW5SZXF1ZXN0KT8uZnJvbWAuXG4gICAgICovXG4gICAgZ2V0IGZyb20oKTogVXNlciB8IHVuZGVmaW5lZCB7XG4gICAgICAgIC8vIEtlZXAgaW4gc3luYyB3aXRoIHR5cGVzIGluIGBmaWx0ZXIudHNgLlxuICAgICAgICByZXR1cm4gKFxuICAgICAgICAgICAgdGhpcy5idXNpbmVzc0Nvbm5lY3Rpb24gPz9cbiAgICAgICAgICAgICAgICB0aGlzLm1lc3NhZ2VSZWFjdGlvbiA/P1xuICAgICAgICAgICAgICAgICh0aGlzLmNoYXRCb29zdD8uYm9vc3QgPz8gdGhpcy5yZW1vdmVkQ2hhdEJvb3N0KT8uc291cmNlXG4gICAgICAgICk/LnVzZXIgPz9cbiAgICAgICAgICAgIChcbiAgICAgICAgICAgICAgICB0aGlzLmNhbGxiYWNrUXVlcnkgPz9cbiAgICAgICAgICAgICAgICAgICAgdGhpcy5tc2cgPz9cbiAgICAgICAgICAgICAgICAgICAgdGhpcy5pbmxpbmVRdWVyeSA/P1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmNob3NlbklubGluZVJlc3VsdCA/P1xuICAgICAgICAgICAgICAgICAgICB0aGlzLnNoaXBwaW5nUXVlcnkgPz9cbiAgICAgICAgICAgICAgICAgICAgdGhpcy5wcmVDaGVja291dFF1ZXJ5ID8/XG4gICAgICAgICAgICAgICAgICAgIHRoaXMubXlDaGF0TWVtYmVyID8/XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuY2hhdE1lbWJlciA/P1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmNoYXRKb2luUmVxdWVzdFxuICAgICAgICAgICAgKT8uZnJvbTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBHZXQgdGhlIG1lc3NhZ2UgaWRlbnRpZmllciBmcm9tIHdoZXJldmVyIHBvc3NpYmxlLiBBbGlhcyBmb3JcbiAgICAgKiBgdGhpcy5tc2c/Lm1lc3NhZ2VfaWQgPz8gdGhpcy5tZXNzYWdlUmVhY3Rpb24/Lm1lc3NhZ2VfaWQgPz9cbiAgICAgKiB0aGlzLm1lc3NhZ2VSZWFjdGlvbkNvdW50Py5tZXNzYWdlX2lkYC5cbiAgICAgKi9cbiAgICBnZXQgbXNnSWQoKTogbnVtYmVyIHwgdW5kZWZpbmVkIHtcbiAgICAgICAgLy8gS2VlcCBpbiBzeW5jIHdpdGggdHlwZXMgaW4gYGZpbHRlci50c2AuXG4gICAgICAgIHJldHVybiB0aGlzLm1zZz8ubWVzc2FnZV9pZCA/PyB0aGlzLm1lc3NhZ2VSZWFjdGlvbj8ubWVzc2FnZV9pZCA/P1xuICAgICAgICAgICAgdGhpcy5tZXNzYWdlUmVhY3Rpb25Db3VudD8ubWVzc2FnZV9pZDtcbiAgICB9XG4gICAgLyoqXG4gICAgICogR2V0cyB0aGUgY2hhdCBpZGVudGlmaWVyIGZyb20gd2hlcmV2ZXIgcG9zc2libGUuIEFsaWFzIGZvciBgdGhpcy5jaGF0Py5pZFxuICAgICAqID8/IHRoaXMuYnVzaW5lc3NDb25uZWN0aW9uPy51c2VyX2NoYXRfaWRgLlxuICAgICAqL1xuICAgIGdldCBjaGF0SWQoKTogbnVtYmVyIHwgdW5kZWZpbmVkIHtcbiAgICAgICAgLy8gS2VlcCBpbiBzeW5jIHdpdGggdHlwZXMgaW4gYGZpbHRlci50c2AuXG4gICAgICAgIHJldHVybiB0aGlzLmNoYXQ/LmlkID8/IHRoaXMuYnVzaW5lc3NDb25uZWN0aW9uPy51c2VyX2NoYXRfaWQ7XG4gICAgfVxuICAgIC8qKlxuICAgICAqIEdldCB0aGUgaW5saW5lIG1lc3NhZ2UgaWRlbnRpZmllciBmcm9tIHdoZXJldmVyIHBvc3NpYmxlLiBBbGlhcyBmb3JcbiAgICAgKiBgKGN0eC5jYWxsYmFja1F1ZXJ5ID8/IGN0eC5jaG9zZW5JbmxpbmVSZXN1bHQpPy5pbmxpbmVfbWVzc2FnZV9pZGAuXG4gICAgICovXG4gICAgZ2V0IGlubGluZU1lc3NhZ2VJZCgpOiBzdHJpbmcgfCB1bmRlZmluZWQge1xuICAgICAgICByZXR1cm4gKFxuICAgICAgICAgICAgdGhpcy5jYWxsYmFja1F1ZXJ5Py5pbmxpbmVfbWVzc2FnZV9pZCA/P1xuICAgICAgICAgICAgICAgIHRoaXMuY2hvc2VuSW5saW5lUmVzdWx0Py5pbmxpbmVfbWVzc2FnZV9pZFxuICAgICAgICApO1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBHZXQgdGhlIGJ1c2luZXNzIGNvbm5lY3Rpb24gaWRlbnRpZmllciBmcm9tIHdoZXJldmVyIHBvc3NpYmxlLiBBbGlhcyBmb3JcbiAgICAgKiBgdGhpcy5tc2c/LmJ1c2luZXNzX2Nvbm5lY3Rpb25faWQgPz8gdGhpcy5idXNpbmVzc0Nvbm5lY3Rpb24/LmlkID8/XG4gICAgICogdGhpcy5kZWxldGVkQnVzaW5lc3NNZXNzYWdlcz8uYnVzaW5lc3NfY29ubmVjdGlvbl9pZGAuXG4gICAgICovXG4gICAgZ2V0IGJ1c2luZXNzQ29ubmVjdGlvbklkKCk6IHN0cmluZyB8IHVuZGVmaW5lZCB7XG4gICAgICAgIHJldHVybiB0aGlzLm1zZz8uYnVzaW5lc3NfY29ubmVjdGlvbl9pZCA/P1xuICAgICAgICAgICAgdGhpcy5idXNpbmVzc0Nvbm5lY3Rpb24/LmlkID8/XG4gICAgICAgICAgICB0aGlzLmRlbGV0ZWRCdXNpbmVzc01lc3NhZ2VzPy5idXNpbmVzc19jb25uZWN0aW9uX2lkO1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBHZXQgZW50aXRpZXMgYW5kIHRoZWlyIHRleHQuIEV4dHJhY3RzIHRoZSB0ZXh0IGZyb20gYGN0eC5tc2cudGV4dGAgb3JcbiAgICAgKiBgY3R4Lm1zZy5jYXB0aW9uYC4gUmV0dXJucyBhbiBlbXB0eSBhcnJheSBpZiBvbmUgb2YgYGN0eC5tc2dgLFxuICAgICAqIGBjdHgubXNnLnRleHRgIG9yIGBjdHgubXNnLmVudGl0aWVzYCBpcyB1bmRlZmluZWQuXG4gICAgICpcbiAgICAgKiBZb3UgY2FuIGZpbHRlciBzcGVjaWZpYyBlbnRpdHkgdHlwZXMgYnkgcGFzc2luZyB0aGUgYHR5cGVzYCBwYXJhbWV0ZXIuXG4gICAgICogRXhhbXBsZTpcbiAgICAgKlxuICAgICAqIGBgYHRzXG4gICAgICogY3R4LmVudGl0aWVzKCkgLy8gUmV0dXJucyBhbGwgZW50aXR5IHR5cGVzXG4gICAgICogY3R4LmVudGl0aWVzKCd1cmwnKSAvLyBSZXR1cm5zIG9ubHkgdXJsIGVudGl0aWVzXG4gICAgICogY3R4LmVudHRpdGllcyhbJ3VybCcsICdlbWFpbCddKSAvLyBSZXR1cm5zIHVybCBhbmQgZW1haWwgZW50aXRpZXNcbiAgICAgKiBgYGBcbiAgICAgKlxuICAgICAqIEBwYXJhbSB0eXBlcyBUeXBlcyBvZiBlbnRpdGllcyB0byByZXR1cm4uIE9taXQgdG8gZ2V0IGFsbCBlbnRpdGllcy5cbiAgICAgKiBAcmV0dXJucyBBcnJheSBvZiBlbnRpdGllcyBhbmQgdGhlaXIgdGV4dHMsIG9yIGVtcHR5IGFycmF5IHdoZW4gdGhlcmUncyBubyB0ZXh0XG4gICAgICovXG4gICAgZW50aXRpZXMoKTogQXJyYXk8XG4gICAgICAgIE1lc3NhZ2VFbnRpdHkgJiB7XG4gICAgICAgICAgICAvKiogU2xpY2Ugb2YgdGhlIG1lc3NhZ2UgdGV4dCB0aGF0IGNvbnRhaW5zIHRoaXMgZW50aXR5ICovXG4gICAgICAgICAgICB0ZXh0OiBzdHJpbmc7XG4gICAgICAgIH1cbiAgICA+O1xuICAgIGVudGl0aWVzPFQgZXh0ZW5kcyBNZXNzYWdlRW50aXR5W1widHlwZVwiXT4oXG4gICAgICAgIHR5cGVzOiBNYXliZUFycmF5PFQ+LFxuICAgICk6IEFycmF5PFxuICAgICAgICBNZXNzYWdlRW50aXR5ICYge1xuICAgICAgICAgICAgdHlwZTogVDtcbiAgICAgICAgICAgIC8qKiBTbGljZSBvZiB0aGUgbWVzc2FnZSB0ZXh0IHRoYXQgY29udGFpbnMgdGhpcyBlbnRpdHkgKi9cbiAgICAgICAgICAgIHRleHQ6IHN0cmluZztcbiAgICAgICAgfVxuICAgID47XG4gICAgZW50aXRpZXModHlwZXM/OiBNYXliZUFycmF5PE1lc3NhZ2VFbnRpdHlbXCJ0eXBlXCJdPikge1xuICAgICAgICBjb25zdCBtZXNzYWdlID0gdGhpcy5tc2c7XG4gICAgICAgIGlmIChtZXNzYWdlID09PSB1bmRlZmluZWQpIHJldHVybiBbXTtcblxuICAgICAgICBjb25zdCB0ZXh0ID0gbWVzc2FnZS50ZXh0ID8/IG1lc3NhZ2UuY2FwdGlvbjtcbiAgICAgICAgaWYgKHRleHQgPT09IHVuZGVmaW5lZCkgcmV0dXJuIFtdO1xuICAgICAgICBsZXQgZW50aXRpZXMgPSBtZXNzYWdlLmVudGl0aWVzID8/IG1lc3NhZ2UuY2FwdGlvbl9lbnRpdGllcztcbiAgICAgICAgaWYgKGVudGl0aWVzID09PSB1bmRlZmluZWQpIHJldHVybiBbXTtcbiAgICAgICAgaWYgKHR5cGVzICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgIGNvbnN0IGZpbHRlcnMgPSBuZXcgU2V0KHRvQXJyYXkodHlwZXMpKTtcbiAgICAgICAgICAgIGVudGl0aWVzID0gZW50aXRpZXMuZmlsdGVyKChlbnRpdHkpID0+IGZpbHRlcnMuaGFzKGVudGl0eS50eXBlKSk7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gZW50aXRpZXMubWFwKChlbnRpdHkpID0+ICh7XG4gICAgICAgICAgICAuLi5lbnRpdHksXG4gICAgICAgICAgICB0ZXh0OiB0ZXh0LnN1YnN0cmluZyhlbnRpdHkub2Zmc2V0LCBlbnRpdHkub2Zmc2V0ICsgZW50aXR5Lmxlbmd0aCksXG4gICAgICAgIH0pKTtcbiAgICB9XG4gICAgLyoqXG4gICAgICogRmluZCBvdXQgd2hpY2ggcmVhY3Rpb25zIHdlcmUgYWRkZWQgYW5kIHJlbW92ZWQgaW4gYSBgbWVzc2FnZV9yZWFjdGlvbmBcbiAgICAgKiB1cGRhdGUuIFRoaXMgbWV0aG9kIGxvb2tzIGF0IGBjdHgubWVzc2FnZVJlYWN0aW9uYCBhbmQgY29tcHV0ZXMgdGhlXG4gICAgICogZGlmZmVyZW5jZSBiZXR3ZWVuIHRoZSBvbGQgcmVhY3Rpb24gYW5kIHRoZSBuZXcgcmVhY3Rpb24uIEl0IGFsc28gZ3JvdXBzXG4gICAgICogdGhlIHJlYWN0aW9ucyBieSBlbW9qaSByZWFjdGlvbnMgYW5kIGN1c3RvbSBlbW9qaSByZWFjdGlvbnMuIEZvciBleGFtcGxlLFxuICAgICAqIHRoZSByZXN1bHRpbmcgb2JqZWN0IGNvdWxkIGxvb2sgbGlrZSB0aGlzOlxuICAgICAqIGBgYHRzXG4gICAgICoge1xuICAgICAqICAgZW1vamk6IFsn8J+RjScsICfwn46JJ11cbiAgICAgKiAgIGVtb2ppQWRkZWQ6IFsn8J+OiSddLFxuICAgICAqICAgZW1vamlLZXB0OiBbJ/CfkY0nXSxcbiAgICAgKiAgIGVtb2ppUmVtb3ZlZDogW10sXG4gICAgICogICBjdXN0b21FbW9qaTogW10sXG4gICAgICogICBjdXN0b21FbW9qaUFkZGVkOiBbXSxcbiAgICAgKiAgIGN1c3RvbUVtb2ppS2VwdDogW10sXG4gICAgICogICBjdXN0b21FbW9qaVJlbW92ZWQ6IFsnaWQwMTIzJ10sXG4gICAgICogfVxuICAgICAqIGBgYFxuICAgICAqIEluIHRoZSBhYm92ZSBleGFtcGxlLCBhIHRhZGEgcmVhY3Rpb24gd2FzIGFkZGVkIGJ5IHRoZSB1c2VyLCBhbmQgYSBjdXN0b21cbiAgICAgKiBlbW9qaSByZWFjdGlvbiB3aXRoIHRoZSBjdXN0b20gZW1vamkgJ2lkMDEyMycgd2FzIHJlbW92ZWQgaW4gdGhlIHNhbWVcbiAgICAgKiB1cGRhdGUuIFRoZSB1c2VyIGhhZCBhbHJlYWR5IHJlYWN0ZWQgd2l0aCBhIHRodW1icyB1cCByZWFjdGlvbiwgd2hpY2hcbiAgICAgKiB0aGV5IGxlZnQgdW5jaGFuZ2VkLiBBcyBhIHJlc3VsdCwgdGhlIGN1cnJlbnQgcmVhY3Rpb24gYnkgdGhlIHVzZXIgaXNcbiAgICAgKiB0aHVtYnMgdXAgYW5kIHRhZGEuIE5vdGUgdGhhdCB0aGUgY3VycmVudCByZWFjdGlvbiAoYm90aCBlbW9qaSBhbmQgY3VzdG9tXG4gICAgICogZW1vamkgaW4gb25lIGxpc3QpIGNhbiBhbHNvIGJlIG9idGFpbmVkIGZyb21cbiAgICAgKiBgY3R4Lm1lc3NhZ2VSZWFjdGlvbi5uZXdfcmVhY3Rpb25gLlxuICAgICAqXG4gICAgICogUmVtZW1iZXIgdGhhdCByZWFjdGlvbiB1cGRhdGVzIG9ubHkgaW5jbHVkZSBpbmZvcm1hdGlvbiBhYm91dCB0aGVcbiAgICAgKiByZWFjdGlvbiBvZiBhIHNwZWNpZmljIHVzZXIuIFRoZSByZXNwZWN0aXZlIG1lc3NhZ2UgbWF5IGhhdmUgbWFueSBtb3JlXG4gICAgICogcmVhY3Rpb25zIGJ5IG90aGVyIHBlb3BsZSB3aGljaCB3aWxsIG5vdCBiZSBpbmNsdWRlZCBpbiB0aGlzIHVwZGF0ZS5cbiAgICAgKlxuICAgICAqIEByZXR1cm5zIEFuIG9iamVjdCBjb250YWluaW5nIGluZm9ybWF0aW9uIGFib3V0IHRoZSByZWFjdGlvbiB1cGRhdGVcbiAgICAgKi9cbiAgICByZWFjdGlvbnMoKToge1xuICAgICAgICAvKiogRW1vamkgY3VycmVudGx5IHByZXNlbnQgaW4gdGhpcyB1c2VyJ3MgcmVhY3Rpb24gKi9cbiAgICAgICAgZW1vamk6IFJlYWN0aW9uVHlwZUVtb2ppW1wiZW1vamlcIl1bXTtcbiAgICAgICAgLyoqIEVtb2ppIG5ld2x5IGFkZGVkIHRvIHRoaXMgdXNlcidzIHJlYWN0aW9uICovXG4gICAgICAgIGVtb2ppQWRkZWQ6IFJlYWN0aW9uVHlwZUVtb2ppW1wiZW1vamlcIl1bXTtcbiAgICAgICAgLyoqIEVtb2ppIG5vdCBjaGFuZ2VkIGJ5IHRoZSB1cGRhdGUgdG8gdGhpcyB1c2VyJ3MgcmVhY3Rpb24gKi9cbiAgICAgICAgZW1vamlLZXB0OiBSZWFjdGlvblR5cGVFbW9qaVtcImVtb2ppXCJdW107XG4gICAgICAgIC8qKiBFbW9qaSByZW1vdmVkIGZyb20gdGhpcyB1c2VyJ3MgcmVhY3Rpb24gKi9cbiAgICAgICAgZW1vamlSZW1vdmVkOiBSZWFjdGlvblR5cGVFbW9qaVtcImVtb2ppXCJdW107XG4gICAgICAgIC8qKiBDdXN0b20gZW1vamkgY3VycmVudGx5IHByZXNlbnQgaW4gdGhpcyB1c2VyJ3MgcmVhY3Rpb24gKi9cbiAgICAgICAgY3VzdG9tRW1vamk6IHN0cmluZ1tdO1xuICAgICAgICAvKiogQ3VzdG9tIGVtb2ppIG5ld2x5IGFkZGVkIHRvIHRoaXMgdXNlcidzIHJlYWN0aW9uICovXG4gICAgICAgIGN1c3RvbUVtb2ppQWRkZWQ6IHN0cmluZ1tdO1xuICAgICAgICAvKiogQ3VzdG9tIGVtb2ppIG5vdCBjaGFuZ2VkIGJ5IHRoZSB1cGRhdGUgdG8gdGhpcyB1c2VyJ3MgcmVhY3Rpb24gKi9cbiAgICAgICAgY3VzdG9tRW1vamlLZXB0OiBzdHJpbmdbXTtcbiAgICAgICAgLyoqIEN1c3RvbSBlbW9qaSByZW1vdmVkIGZyb20gdGhpcyB1c2VyJ3MgcmVhY3Rpb24gKi9cbiAgICAgICAgY3VzdG9tRW1vamlSZW1vdmVkOiBzdHJpbmdbXTtcbiAgICB9IHtcbiAgICAgICAgY29uc3QgZW1vamk6IFJlYWN0aW9uVHlwZUVtb2ppW1wiZW1vamlcIl1bXSA9IFtdO1xuICAgICAgICBjb25zdCBlbW9qaUFkZGVkOiBSZWFjdGlvblR5cGVFbW9qaVtcImVtb2ppXCJdW10gPSBbXTtcbiAgICAgICAgY29uc3QgZW1vamlLZXB0OiBSZWFjdGlvblR5cGVFbW9qaVtcImVtb2ppXCJdW10gPSBbXTtcbiAgICAgICAgY29uc3QgZW1vamlSZW1vdmVkOiBSZWFjdGlvblR5cGVFbW9qaVtcImVtb2ppXCJdW10gPSBbXTtcbiAgICAgICAgY29uc3QgY3VzdG9tRW1vamk6IHN0cmluZ1tdID0gW107XG4gICAgICAgIGNvbnN0IGN1c3RvbUVtb2ppQWRkZWQ6IHN0cmluZ1tdID0gW107XG4gICAgICAgIGNvbnN0IGN1c3RvbUVtb2ppS2VwdDogc3RyaW5nW10gPSBbXTtcbiAgICAgICAgY29uc3QgY3VzdG9tRW1vamlSZW1vdmVkOiBzdHJpbmdbXSA9IFtdO1xuICAgICAgICBjb25zdCByID0gdGhpcy5tZXNzYWdlUmVhY3Rpb247XG4gICAgICAgIGlmIChyICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgIGNvbnN0IHsgb2xkX3JlYWN0aW9uLCBuZXdfcmVhY3Rpb24gfSA9IHI7XG4gICAgICAgICAgICAvLyBncm91cCBhbGwgY3VycmVudCBlbW9qaSBpbiBgZW1vamlgIGFuZCBgY3VzdG9tRW1vamlgXG4gICAgICAgICAgICBmb3IgKGNvbnN0IHJlYWN0aW9uIG9mIG5ld19yZWFjdGlvbikge1xuICAgICAgICAgICAgICAgIGlmIChyZWFjdGlvbi50eXBlID09PSBcImVtb2ppXCIpIHtcbiAgICAgICAgICAgICAgICAgICAgZW1vamkucHVzaChyZWFjdGlvbi5lbW9qaSk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmIChyZWFjdGlvbi50eXBlID09PSBcImN1c3RvbV9lbW9qaVwiKSB7XG4gICAgICAgICAgICAgICAgICAgIGN1c3RvbUVtb2ppLnB1c2gocmVhY3Rpb24uY3VzdG9tX2Vtb2ppX2lkKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICAvLyB0ZW1wb3JhcmlseSBtb3ZlIGFsbCBvbGQgZW1vamkgdG8gdGhlICpSZW1vdmVkIGFycmF5c1xuICAgICAgICAgICAgZm9yIChjb25zdCByZWFjdGlvbiBvZiBvbGRfcmVhY3Rpb24pIHtcbiAgICAgICAgICAgICAgICBpZiAocmVhY3Rpb24udHlwZSA9PT0gXCJlbW9qaVwiKSB7XG4gICAgICAgICAgICAgICAgICAgIGVtb2ppUmVtb3ZlZC5wdXNoKHJlYWN0aW9uLmVtb2ppKTtcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKHJlYWN0aW9uLnR5cGUgPT09IFwiY3VzdG9tX2Vtb2ppXCIpIHtcbiAgICAgICAgICAgICAgICAgICAgY3VzdG9tRW1vamlSZW1vdmVkLnB1c2gocmVhY3Rpb24uY3VzdG9tX2Vtb2ppX2lkKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICAvLyB0ZW1wb3JhcmlseSBtb3ZlIGFsbCBuZXcgZW1vamkgdG8gdGhlICpBZGRlZCBhcnJheXNcbiAgICAgICAgICAgIGVtb2ppQWRkZWQucHVzaCguLi5lbW9qaSk7XG4gICAgICAgICAgICBjdXN0b21FbW9qaUFkZGVkLnB1c2goLi4uY3VzdG9tRW1vamkpO1xuICAgICAgICAgICAgLy8gZHJvcCBjb21tb24gZW1vamkgZnJvbSBib3RoIGxpc3RzIGFuZCBhZGQgdGhlbSB0byBgZW1vamlLZXB0YFxuICAgICAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBlbW9qaVJlbW92ZWQubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICBjb25zdCBsZW4gPSBlbW9qaUFkZGVkLmxlbmd0aDtcbiAgICAgICAgICAgICAgICBpZiAobGVuID09PSAwKSBicmVhaztcbiAgICAgICAgICAgICAgICBjb25zdCByZW0gPSBlbW9qaVJlbW92ZWRbaV07XG4gICAgICAgICAgICAgICAgZm9yIChsZXQgaiA9IDA7IGogPCBsZW47IGorKykge1xuICAgICAgICAgICAgICAgICAgICBpZiAocmVtID09PSBlbW9qaUFkZGVkW2pdKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBlbW9qaUtlcHQucHVzaChyZW0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgZW1vamlSZW1vdmVkLnNwbGljZShpLCAxKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGVtb2ppQWRkZWQuc3BsaWNlKGosIDEpO1xuICAgICAgICAgICAgICAgICAgICAgICAgaS0tO1xuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICAvLyBkcm9wIGNvbW1vbiBjdXN0b20gZW1vamkgZnJvbSBib3RoIGxpc3RzIGFuZCBhZGQgdGhlbSB0byBgY3VzdG9tRW1vamlLZXB0YFxuICAgICAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBjdXN0b21FbW9qaVJlbW92ZWQubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICBjb25zdCBsZW4gPSBjdXN0b21FbW9qaUFkZGVkLmxlbmd0aDtcbiAgICAgICAgICAgICAgICBpZiAobGVuID09PSAwKSBicmVhaztcbiAgICAgICAgICAgICAgICBjb25zdCByZW0gPSBjdXN0b21FbW9qaVJlbW92ZWRbaV07XG4gICAgICAgICAgICAgICAgZm9yIChsZXQgaiA9IDA7IGogPCBsZW47IGorKykge1xuICAgICAgICAgICAgICAgICAgICBpZiAocmVtID09PSBjdXN0b21FbW9qaUFkZGVkW2pdKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjdXN0b21FbW9qaUtlcHQucHVzaChyZW0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgY3VzdG9tRW1vamlSZW1vdmVkLnNwbGljZShpLCAxKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGN1c3RvbUVtb2ppQWRkZWQuc3BsaWNlKGosIDEpO1xuICAgICAgICAgICAgICAgICAgICAgICAgaS0tO1xuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIGVtb2ppLFxuICAgICAgICAgICAgZW1vamlBZGRlZCxcbiAgICAgICAgICAgIGVtb2ppS2VwdCxcbiAgICAgICAgICAgIGVtb2ppUmVtb3ZlZCxcbiAgICAgICAgICAgIGN1c3RvbUVtb2ppLFxuICAgICAgICAgICAgY3VzdG9tRW1vamlBZGRlZCxcbiAgICAgICAgICAgIGN1c3RvbUVtb2ppS2VwdCxcbiAgICAgICAgICAgIGN1c3RvbUVtb2ppUmVtb3ZlZCxcbiAgICAgICAgfTtcbiAgICB9XG5cbiAgICAvLyBQUk9CSU5HIFNIT1JUQ1VUU1xuXG4gICAgLyoqXG4gICAgICogYENvbnRleHQuaGFzYCBpcyBhbiBvYmplY3QgdGhhdCBjb250YWlucyBhIG51bWJlciBvZiB1c2VmdWwgZnVuY3Rpb25zIGZvclxuICAgICAqIHByb2JpbmcgY29udGV4dCBvYmplY3RzLiBFYWNoIG9mIHRoZXNlIGZ1bmN0aW9ucyBjYW4gZ2VuZXJhdGUgYSBwcmVkaWNhdGVcbiAgICAgKiBmdW5jdGlvbiwgdG8gd2hpY2ggeW91IGNhbiBwYXNzIGNvbnRleHQgb2JqZWN0cyBpbiBvcmRlciB0byBjaGVjayBpZiBhXG4gICAgICogY29uZGl0aW9uIGhvbGRzIGZvciB0aGUgcmVzcGVjdGl2ZSBjb250ZXh0IG9iamVjdC5cbiAgICAgKlxuICAgICAqIEZvciBleGFtcGxlLCB5b3UgY2FuIGNhbGwgYENvbnRleHQuaGFzLmZpbHRlclF1ZXJ5KFwiOnRleHRcIilgIHRvIGdlbmVyYXRlXG4gICAgICogYSBwcmVkaWNhdGUgZnVuY3Rpb24gdGhhdCB0ZXN0cyBjb250ZXh0IG9iamVjdHMgZm9yIGNvbnRhaW5pbmcgdGV4dDpcbiAgICAgKiBgYGB0c1xuICAgICAqIGNvbnN0IGhhc1RleHQgPSBDb250ZXh0Lmhhcy5maWx0ZXJRdWVyeShcIjp0ZXh0XCIpO1xuICAgICAqXG4gICAgICogaWYgKGhhc1RleHQoY3R4MCkpIHt9IC8vIGBjdHgwYCBtYXRjaGVzIHRoZSBmaWx0ZXIgcXVlcnkgYDp0ZXh0YFxuICAgICAqIGlmIChoYXNUZXh0KGN0eDEpKSB7fSAvLyBgY3R4MWAgbWF0Y2hlcyB0aGUgZmlsdGVyIHF1ZXJ5IGA6dGV4dGBcbiAgICAgKiBpZiAoaGFzVGV4dChjdHgyKSkge30gLy8gYGN0eDJgIG1hdGNoZXMgdGhlIGZpbHRlciBxdWVyeSBgOnRleHRgXG4gICAgICogYGBgXG4gICAgICogVGhlc2UgcHJlZGljYXRlIGZ1bmN0aW9ucyBhcmUgdXNlZCBpbnRlcm5hbGx5IGJ5IHRoZSBoYXMtbWV0aG9kcyB0aGF0IGFyZVxuICAgICAqIGluc3RhbGxlZCBvbiBldmVyeSBjb250ZXh0IG9iamVjdC4gVGhpcyBtZWFucyB0aGF0IGNhbGxpbmdcbiAgICAgKiBgY3R4LmhhcyhcIjp0ZXh0XCIpYCBpcyBlcXVpdmFsZW50IHRvXG4gICAgICogYENvbnRleHQuaGFzLmZpbHRlclF1ZXJ5KFwiOnRleHRcIikoY3R4KWAuXG4gICAgICovXG4gICAgc3RhdGljIGhhcyA9IGNoZWNrZXI7XG4gICAgLyoqXG4gICAgICogUmV0dXJucyBgdHJ1ZWAgaWYgdGhpcyBjb250ZXh0IG9iamVjdCBtYXRjaGVzIHRoZSBnaXZlbiBmaWx0ZXIgcXVlcnksIGFuZFxuICAgICAqIGBmYWxzZWAgb3RoZXJ3aXNlLiBUaGlzIHVzZXMgdGhlIHNhbWUgbG9naWMgYXMgYGJvdC5vbmAuXG4gICAgICpcbiAgICAgKiBAcGFyYW0gZmlsdGVyIFRoZSBmaWx0ZXIgcXVlcnkgdG8gY2hlY2tcbiAgICAgKi9cbiAgICBoYXM8USBleHRlbmRzIEZpbHRlclF1ZXJ5PihmaWx0ZXI6IFEgfCBRW10pOiB0aGlzIGlzIEZpbHRlckNvcmU8UT4ge1xuICAgICAgICByZXR1cm4gQ29udGV4dC5oYXMuZmlsdGVyUXVlcnkoZmlsdGVyKSh0aGlzKTtcbiAgICB9XG4gICAgLyoqXG4gICAgICogUmV0dXJucyBgdHJ1ZWAgaWYgdGhpcyBjb250ZXh0IG9iamVjdCBjb250YWlucyB0aGUgZ2l2ZW4gdGV4dCwgb3IgaWYgaXRcbiAgICAgKiBjb250YWlucyB0ZXh0IHRoYXQgbWF0Y2hlcyB0aGUgZ2l2ZW4gcmVndWxhciBleHByZXNzaW9uLiBJdCByZXR1cm5zXG4gICAgICogYGZhbHNlYCBvdGhlcndpc2UuIFRoaXMgdXNlcyB0aGUgc2FtZSBsb2dpYyBhcyBgYm90LmhlYXJzYC5cbiAgICAgKlxuICAgICAqIEBwYXJhbSB0cmlnZ2VyIFRoZSBzdHJpbmcgb3IgcmVnZXggdG8gbWF0Y2hcbiAgICAgKi9cbiAgICBoYXNUZXh0KHRyaWdnZXI6IE1heWJlQXJyYXk8c3RyaW5nIHwgUmVnRXhwPik6IHRoaXMgaXMgSGVhcnNDb250ZXh0Q29yZSB7XG4gICAgICAgIHJldHVybiBDb250ZXh0Lmhhcy50ZXh0KHRyaWdnZXIpKHRoaXMpO1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBSZXR1cm5zIGB0cnVlYCBpZiB0aGlzIGNvbnRleHQgb2JqZWN0IGNvbnRhaW5zIHRoZSBnaXZlbiBjb21tYW5kLCBhbmRcbiAgICAgKiBgZmFsc2VgIG90aGVyd2lzZS4gVGhpcyB1c2VzIHRoZSBzYW1lIGxvZ2ljIGFzIGBib3QuY29tbWFuZGAuXG4gICAgICpcbiAgICAgKiBAcGFyYW0gY29tbWFuZCBUaGUgY29tbWFuZCB0byBtYXRjaFxuICAgICAqL1xuICAgIGhhc0NvbW1hbmQoXG4gICAgICAgIGNvbW1hbmQ6IE1heWJlQXJyYXk8U3RyaW5nV2l0aENvbW1hbmRTdWdnZXN0aW9ucz4sXG4gICAgKTogdGhpcyBpcyBDb21tYW5kQ29udGV4dENvcmUge1xuICAgICAgICByZXR1cm4gQ29udGV4dC5oYXMuY29tbWFuZChjb21tYW5kKSh0aGlzKTtcbiAgICB9XG4gICAgaGFzUmVhY3Rpb24oXG4gICAgICAgIHJlYWN0aW9uOiBNYXliZUFycmF5PFJlYWN0aW9uVHlwZUVtb2ppW1wiZW1vamlcIl0gfCBSZWFjdGlvblR5cGU+LFxuICAgICk6IHRoaXMgaXMgUmVhY3Rpb25Db250ZXh0Q29yZSB7XG4gICAgICAgIHJldHVybiBDb250ZXh0Lmhhcy5yZWFjdGlvbihyZWFjdGlvbikodGhpcyk7XG4gICAgfVxuICAgIC8qKlxuICAgICAqIFJldHVybnMgYHRydWVgIGlmIHRoaXMgY29udGV4dCBvYmplY3QgYmVsb25ncyB0byBhIGNoYXQgd2l0aCB0aGUgZ2l2ZW5cbiAgICAgKiBjaGF0IHR5cGUsIGFuZCBgZmFsc2VgIG90aGVyd2lzZS4gVGhpcyB1c2VzIHRoZSBzYW1lIGxvZ2ljIGFzXG4gICAgICogYGJvdC5jaGF0VHlwZWAuXG4gICAgICpcbiAgICAgKiBAcGFyYW0gY2hhdFR5cGUgVGhlIGNoYXQgdHlwZSB0byBtYXRjaFxuICAgICAqL1xuICAgIGhhc0NoYXRUeXBlPFQgZXh0ZW5kcyBDaGF0W1widHlwZVwiXT4oXG4gICAgICAgIGNoYXRUeXBlOiBNYXliZUFycmF5PFQ+LFxuICAgICk6IHRoaXMgaXMgQ2hhdFR5cGVDb250ZXh0Q29yZTxUPiB7XG4gICAgICAgIHJldHVybiBDb250ZXh0Lmhhcy5jaGF0VHlwZShjaGF0VHlwZSkodGhpcyk7XG4gICAgfVxuICAgIC8qKlxuICAgICAqIFJldHVybnMgYHRydWVgIGlmIHRoaXMgY29udGV4dCBvYmplY3QgY29udGFpbnMgdGhlIGdpdmVuIGNhbGxiYWNrIHF1ZXJ5LFxuICAgICAqIG9yIGlmIHRoZSBjb250YWluZWQgY2FsbGJhY2sgcXVlcnkgZGF0YSBtYXRjaGVzIHRoZSBnaXZlbiByZWd1bGFyXG4gICAgICogZXhwcmVzc2lvbi4gSXQgcmV0dXJucyBgZmFsc2VgIG90aGVyd2lzZS4gVGhpcyB1c2VzIHRoZSBzYW1lIGxvZ2ljIGFzXG4gICAgICogYGJvdC5jYWxsYmFja1F1ZXJ5YC5cbiAgICAgKlxuICAgICAqIEBwYXJhbSB0cmlnZ2VyIFRoZSBzdHJpbmcgb3IgcmVnZXggdG8gbWF0Y2hcbiAgICAgKi9cbiAgICBoYXNDYWxsYmFja1F1ZXJ5KFxuICAgICAgICB0cmlnZ2VyOiBNYXliZUFycmF5PHN0cmluZyB8IFJlZ0V4cD4sXG4gICAgKTogdGhpcyBpcyBDYWxsYmFja1F1ZXJ5Q29udGV4dENvcmUge1xuICAgICAgICByZXR1cm4gQ29udGV4dC5oYXMuY2FsbGJhY2tRdWVyeSh0cmlnZ2VyKSh0aGlzKTtcbiAgICB9XG4gICAgLyoqXG4gICAgICogUmV0dXJucyBgdHJ1ZWAgaWYgdGhpcyBjb250ZXh0IG9iamVjdCBjb250YWlucyB0aGUgZ2l2ZW4gZ2FtZSBxdWVyeSwgb3JcbiAgICAgKiBpZiB0aGUgY29udGFpbmVkIGdhbWUgcXVlcnkgbWF0Y2hlcyB0aGUgZ2l2ZW4gcmVndWxhciBleHByZXNzaW9uLiBJdFxuICAgICAqIHJldHVybnMgYGZhbHNlYCBvdGhlcndpc2UuIFRoaXMgdXNlcyB0aGUgc2FtZSBsb2dpYyBhcyBgYm90LmdhbWVRdWVyeWAuXG4gICAgICpcbiAgICAgKiBAcGFyYW0gdHJpZ2dlciBUaGUgc3RyaW5nIG9yIHJlZ2V4IHRvIG1hdGNoXG4gICAgICovXG4gICAgaGFzR2FtZVF1ZXJ5KFxuICAgICAgICB0cmlnZ2VyOiBNYXliZUFycmF5PHN0cmluZyB8IFJlZ0V4cD4sXG4gICAgKTogdGhpcyBpcyBHYW1lUXVlcnlDb250ZXh0Q29yZSB7XG4gICAgICAgIHJldHVybiBDb250ZXh0Lmhhcy5nYW1lUXVlcnkodHJpZ2dlcikodGhpcyk7XG4gICAgfVxuICAgIC8qKlxuICAgICAqIFJldHVybnMgYHRydWVgIGlmIHRoaXMgY29udGV4dCBvYmplY3QgY29udGFpbnMgdGhlIGdpdmVuIGlubGluZSBxdWVyeSwgb3JcbiAgICAgKiBpZiB0aGUgY29udGFpbmVkIGlubGluZSBxdWVyeSBtYXRjaGVzIHRoZSBnaXZlbiByZWd1bGFyIGV4cHJlc3Npb24uIEl0XG4gICAgICogcmV0dXJucyBgZmFsc2VgIG90aGVyd2lzZS4gVGhpcyB1c2VzIHRoZSBzYW1lIGxvZ2ljIGFzIGBib3QuaW5saW5lUXVlcnlgLlxuICAgICAqXG4gICAgICogQHBhcmFtIHRyaWdnZXIgVGhlIHN0cmluZyBvciByZWdleCB0byBtYXRjaFxuICAgICAqL1xuICAgIGhhc0lubGluZVF1ZXJ5KFxuICAgICAgICB0cmlnZ2VyOiBNYXliZUFycmF5PHN0cmluZyB8IFJlZ0V4cD4sXG4gICAgKTogdGhpcyBpcyBJbmxpbmVRdWVyeUNvbnRleHRDb3JlIHtcbiAgICAgICAgcmV0dXJuIENvbnRleHQuaGFzLmlubGluZVF1ZXJ5KHRyaWdnZXIpKHRoaXMpO1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBSZXR1cm5zIGB0cnVlYCBpZiB0aGlzIGNvbnRleHQgb2JqZWN0IGNvbnRhaW5zIHRoZSBjaG9zZW4gaW5saW5lIHJlc3VsdCxcbiAgICAgKiBvciBpZiB0aGUgY29udGFpbmVkIGNob3NlbiBpbmxpbmUgcmVzdWx0IG1hdGNoZXMgdGhlIGdpdmVuIHJlZ3VsYXJcbiAgICAgKiBleHByZXNzaW9uLiBJdCByZXR1cm5zIGBmYWxzZWAgb3RoZXJ3aXNlLiBUaGlzIHVzZXMgdGhlIHNhbWUgbG9naWMgYXNcbiAgICAgKiBgYm90LmNob3NlbklubGluZVJlc3VsdGAuXG4gICAgICpcbiAgICAgKiBAcGFyYW0gdHJpZ2dlciBUaGUgc3RyaW5nIG9yIHJlZ2V4IHRvIG1hdGNoXG4gICAgICovXG4gICAgaGFzQ2hvc2VuSW5saW5lUmVzdWx0KFxuICAgICAgICB0cmlnZ2VyOiBNYXliZUFycmF5PHN0cmluZyB8IFJlZ0V4cD4sXG4gICAgKTogdGhpcyBpcyBDaG9zZW5JbmxpbmVSZXN1bHRDb250ZXh0Q29yZSB7XG4gICAgICAgIHJldHVybiBDb250ZXh0Lmhhcy5jaG9zZW5JbmxpbmVSZXN1bHQodHJpZ2dlcikodGhpcyk7XG4gICAgfVxuICAgIC8qKlxuICAgICAqIFJldHVybnMgYHRydWVgIGlmIHRoaXMgY29udGV4dCBvYmplY3QgY29udGFpbnMgdGhlIGdpdmVuIHByZS1jaGVja291dFxuICAgICAqIHF1ZXJ5LCBvciBpZiB0aGUgY29udGFpbmVkIHByZS1jaGVja291dCBxdWVyeSBtYXRjaGVzIHRoZSBnaXZlbiByZWd1bGFyXG4gICAgICogZXhwcmVzc2lvbi4gSXQgcmV0dXJucyBgZmFsc2VgIG90aGVyd2lzZS4gVGhpcyB1c2VzIHRoZSBzYW1lIGxvZ2ljIGFzXG4gICAgICogYGJvdC5wcmVDaGVja291dFF1ZXJ5YC5cbiAgICAgKlxuICAgICAqIEBwYXJhbSB0cmlnZ2VyIFRoZSBzdHJpbmcgb3IgcmVnZXggdG8gbWF0Y2hcbiAgICAgKi9cbiAgICBoYXNQcmVDaGVja291dFF1ZXJ5KFxuICAgICAgICB0cmlnZ2VyOiBNYXliZUFycmF5PHN0cmluZyB8IFJlZ0V4cD4sXG4gICAgKTogdGhpcyBpcyBQcmVDaGVja291dFF1ZXJ5Q29udGV4dENvcmUge1xuICAgICAgICByZXR1cm4gQ29udGV4dC5oYXMucHJlQ2hlY2tvdXRRdWVyeSh0cmlnZ2VyKSh0aGlzKTtcbiAgICB9XG4gICAgLyoqXG4gICAgICogUmV0dXJucyBgdHJ1ZWAgaWYgdGhpcyBjb250ZXh0IG9iamVjdCBjb250YWlucyB0aGUgZ2l2ZW4gc2hpcHBpbmcgcXVlcnksXG4gICAgICogb3IgaWYgdGhlIGNvbnRhaW5lZCBzaGlwcGluZyBxdWVyeSBtYXRjaGVzIHRoZSBnaXZlbiByZWd1bGFyIGV4cHJlc3Npb24uXG4gICAgICogSXQgcmV0dXJucyBgZmFsc2VgIG90aGVyd2lzZS4gVGhpcyB1c2VzIHRoZSBzYW1lIGxvZ2ljIGFzXG4gICAgICogYGJvdC5zaGlwcGluZ1F1ZXJ5YC5cbiAgICAgKlxuICAgICAqIEBwYXJhbSB0cmlnZ2VyIFRoZSBzdHJpbmcgb3IgcmVnZXggdG8gbWF0Y2hcbiAgICAgKi9cbiAgICBoYXNTaGlwcGluZ1F1ZXJ5KFxuICAgICAgICB0cmlnZ2VyOiBNYXliZUFycmF5PHN0cmluZyB8IFJlZ0V4cD4sXG4gICAgKTogdGhpcyBpcyBTaGlwcGluZ1F1ZXJ5Q29udGV4dENvcmUge1xuICAgICAgICByZXR1cm4gQ29udGV4dC5oYXMuc2hpcHBpbmdRdWVyeSh0cmlnZ2VyKSh0aGlzKTtcbiAgICB9XG5cbiAgICAvLyBBUElcblxuICAgIC8qKlxuICAgICAqIENvbnRleHQtYXdhcmUgYWxpYXMgZm9yIGBhcGkuc2VuZE1lc3NhZ2VgLiBVc2UgdGhpcyBtZXRob2QgdG8gc2VuZCB0ZXh0IG1lc3NhZ2VzLiBPbiBzdWNjZXNzLCB0aGUgc2VudCBNZXNzYWdlIGlzIHJldHVybmVkLlxuICAgICAqXG4gICAgICogQHBhcmFtIHRleHQgVGV4dCBvZiB0aGUgbWVzc2FnZSB0byBiZSBzZW50LCAxLTQwOTYgY2hhcmFjdGVycyBhZnRlciBlbnRpdGllcyBwYXJzaW5nXG4gICAgICogQHBhcmFtIG90aGVyIE9wdGlvbmFsIHJlbWFpbmluZyBwYXJhbWV0ZXJzLCBjb25mZXIgdGhlIG9mZmljaWFsIHJlZmVyZW5jZSBiZWxvd1xuICAgICAqIEBwYXJhbSBzaWduYWwgT3B0aW9uYWwgYEFib3J0U2lnbmFsYCB0byBjYW5jZWwgdGhlIHJlcXVlc3RcbiAgICAgKlxuICAgICAqICoqT2ZmaWNpYWwgcmVmZXJlbmNlOioqIGh0dHBzOi8vY29yZS50ZWxlZ3JhbS5vcmcvYm90cy9hcGkjc2VuZG1lc3NhZ2VcbiAgICAgKi9cbiAgICByZXBseShcbiAgICAgICAgdGV4dDogc3RyaW5nLFxuICAgICAgICBvdGhlcj86IE90aGVyPFwic2VuZE1lc3NhZ2VcIiwgXCJjaGF0X2lkXCIgfCBcInRleHRcIj4sXG4gICAgICAgIHNpZ25hbD86IEFib3J0U2lnbmFsLFxuICAgICkge1xuICAgICAgICByZXR1cm4gdGhpcy5hcGkuc2VuZE1lc3NhZ2UoXG4gICAgICAgICAgICBvclRocm93KHRoaXMuY2hhdElkLCBcInNlbmRNZXNzYWdlXCIpLFxuICAgICAgICAgICAgdGV4dCxcbiAgICAgICAgICAgIHsgYnVzaW5lc3NfY29ubmVjdGlvbl9pZDogdGhpcy5idXNpbmVzc0Nvbm5lY3Rpb25JZCwgLi4ub3RoZXIgfSxcbiAgICAgICAgICAgIHNpZ25hbCxcbiAgICAgICAgKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBDb250ZXh0LWF3YXJlIGFsaWFzIGZvciBgYXBpLmZvcndhcmRNZXNzYWdlYC4gVXNlIHRoaXMgbWV0aG9kIHRvIGZvcndhcmQgbWVzc2FnZXMgb2YgYW55IGtpbmQuIFNlcnZpY2UgbWVzc2FnZXMgYW5kIG1lc3NhZ2VzIHdpdGggcHJvdGVjdGVkIGNvbnRlbnQgY2FuJ3QgYmUgZm9yd2FyZGVkLiBPbiBzdWNjZXNzLCB0aGUgc2VudCBNZXNzYWdlIGlzIHJldHVybmVkLlxuICAgICAqXG4gICAgICogQHBhcmFtIGNoYXRfaWQgVW5pcXVlIGlkZW50aWZpZXIgZm9yIHRoZSB0YXJnZXQgY2hhdCBvciB1c2VybmFtZSBvZiB0aGUgdGFyZ2V0IGNoYW5uZWwgKGluIHRoZSBmb3JtYXQgQGNoYW5uZWx1c2VybmFtZSlcbiAgICAgKiBAcGFyYW0gb3RoZXIgT3B0aW9uYWwgcmVtYWluaW5nIHBhcmFtZXRlcnMsIGNvbmZlciB0aGUgb2ZmaWNpYWwgcmVmZXJlbmNlIGJlbG93XG4gICAgICogQHBhcmFtIHNpZ25hbCBPcHRpb25hbCBgQWJvcnRTaWduYWxgIHRvIGNhbmNlbCB0aGUgcmVxdWVzdFxuICAgICAqXG4gICAgICogKipPZmZpY2lhbCByZWZlcmVuY2U6KiogaHR0cHM6Ly9jb3JlLnRlbGVncmFtLm9yZy9ib3RzL2FwaSNmb3J3YXJkbWVzc2FnZVxuICAgICAqL1xuICAgIGZvcndhcmRNZXNzYWdlKFxuICAgICAgICBjaGF0X2lkOiBudW1iZXIgfCBzdHJpbmcsXG4gICAgICAgIG90aGVyPzogT3RoZXI8XG4gICAgICAgICAgICBcImZvcndhcmRNZXNzYWdlXCIsXG4gICAgICAgICAgICBcImNoYXRfaWRcIiB8IFwiZnJvbV9jaGF0X2lkXCIgfCBcIm1lc3NhZ2VfaWRcIlxuICAgICAgICA+LFxuICAgICAgICBzaWduYWw/OiBBYm9ydFNpZ25hbCxcbiAgICApIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuYXBpLmZvcndhcmRNZXNzYWdlKFxuICAgICAgICAgICAgY2hhdF9pZCxcbiAgICAgICAgICAgIG9yVGhyb3codGhpcy5jaGF0SWQsIFwiZm9yd2FyZE1lc3NhZ2VcIiksXG4gICAgICAgICAgICBvclRocm93KHRoaXMubXNnSWQsIFwiZm9yd2FyZE1lc3NhZ2VcIiksXG4gICAgICAgICAgICBvdGhlcixcbiAgICAgICAgICAgIHNpZ25hbCxcbiAgICAgICAgKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBDb250ZXh0LWF3YXJlIGFsaWFzIGZvciBgYXBpLmZvcndhcmRNZXNzYWdlc2AuIFVzZSB0aGlzIG1ldGhvZCB0byBmb3J3YXJkIG11bHRpcGxlIG1lc3NhZ2VzIG9mIGFueSBraW5kLiBJZiBzb21lIG9mIHRoZSBzcGVjaWZpZWQgbWVzc2FnZXMgY2FuJ3QgYmUgZm91bmQgb3IgZm9yd2FyZGVkLCB0aGV5IGFyZSBza2lwcGVkLiBTZXJ2aWNlIG1lc3NhZ2VzIGFuZCBtZXNzYWdlcyB3aXRoIHByb3RlY3RlZCBjb250ZW50IGNhbid0IGJlIGZvcndhcmRlZC4gQWxidW0gZ3JvdXBpbmcgaXMga2VwdCBmb3IgZm9yd2FyZGVkIG1lc3NhZ2VzLiBPbiBzdWNjZXNzLCBhbiBhcnJheSBvZiBNZXNzYWdlSWQgb2YgdGhlIHNlbnQgbWVzc2FnZXMgaXMgcmV0dXJuZWQuXG4gICAgICpcbiAgICAgKiBAcGFyYW0gY2hhdF9pZCBVbmlxdWUgaWRlbnRpZmllciBmb3IgdGhlIHRhcmdldCBjaGF0IG9yIHVzZXJuYW1lIG9mIHRoZSB0YXJnZXQgY2hhbm5lbCAoaW4gdGhlIGZvcm1hdCBAY2hhbm5lbHVzZXJuYW1lKVxuICAgICAqIEBwYXJhbSBtZXNzYWdlX2lkcyBBIGxpc3Qgb2YgMS0xMDAgaWRlbnRpZmllcnMgb2YgbWVzc2FnZXMgaW4gdGhlIGN1cnJlbnQgY2hhdCB0byBmb3J3YXJkLiBUaGUgaWRlbnRpZmllcnMgbXVzdCBiZSBzcGVjaWZpZWQgaW4gYSBzdHJpY3RseSBpbmNyZWFzaW5nIG9yZGVyLlxuICAgICAqIEBwYXJhbSBvdGhlciBPcHRpb25hbCByZW1haW5pbmcgcGFyYW1ldGVycywgY29uZmVyIHRoZSBvZmZpY2lhbCByZWZlcmVuY2UgYmVsb3dcbiAgICAgKiBAcGFyYW0gc2lnbmFsIE9wdGlvbmFsIGBBYm9ydFNpZ25hbGAgdG8gY2FuY2VsIHRoZSByZXF1ZXN0XG4gICAgICpcbiAgICAgKiAqKk9mZmljaWFsIHJlZmVyZW5jZToqKiBodHRwczovL2NvcmUudGVsZWdyYW0ub3JnL2JvdHMvYXBpI2ZvcndhcmRtZXNzYWdlc1xuICAgICAqL1xuICAgIGZvcndhcmRNZXNzYWdlcyhcbiAgICAgICAgY2hhdF9pZDogbnVtYmVyIHwgc3RyaW5nLFxuICAgICAgICBtZXNzYWdlX2lkczogbnVtYmVyW10sXG4gICAgICAgIG90aGVyPzogT3RoZXI8XG4gICAgICAgICAgICBcImZvcndhcmRNZXNzYWdlc1wiLFxuICAgICAgICAgICAgXCJjaGF0X2lkXCIgfCBcImZyb21fY2hhdF9pZFwiIHwgXCJtZXNzYWdlX2lkc1wiXG4gICAgICAgID4sXG4gICAgICAgIHNpZ25hbD86IEFib3J0U2lnbmFsLFxuICAgICkge1xuICAgICAgICByZXR1cm4gdGhpcy5hcGkuZm9yd2FyZE1lc3NhZ2VzKFxuICAgICAgICAgICAgY2hhdF9pZCxcbiAgICAgICAgICAgIG9yVGhyb3codGhpcy5jaGF0SWQsIFwiZm9yd2FyZE1lc3NhZ2VzXCIpLFxuICAgICAgICAgICAgbWVzc2FnZV9pZHMsXG4gICAgICAgICAgICBvdGhlcixcbiAgICAgICAgICAgIHNpZ25hbCxcbiAgICAgICAgKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBDb250ZXh0LWF3YXJlIGFsaWFzIGZvciBgYXBpLmNvcHlNZXNzYWdlYC4gVXNlIHRoaXMgbWV0aG9kIHRvIGNvcHkgbWVzc2FnZXMgb2YgYW55IGtpbmQuIFNlcnZpY2UgbWVzc2FnZXMsIHBhaWQgbWVkaWEgbWVzc2FnZXMsIGdpdmVhd2F5IG1lc3NhZ2VzLCBnaXZlYXdheSB3aW5uZXJzIG1lc3NhZ2VzLCBhbmQgaW52b2ljZSBtZXNzYWdlcyBjYW4ndCBiZSBjb3BpZWQuIEEgcXVpeiBwb2xsIGNhbiBiZSBjb3BpZWQgb25seSBpZiB0aGUgdmFsdWUgb2YgdGhlIGZpZWxkIGNvcnJlY3Rfb3B0aW9uX2lkIGlzIGtub3duIHRvIHRoZSBib3QuIFRoZSBtZXRob2QgaXMgYW5hbG9nb3VzIHRvIHRoZSBtZXRob2QgZm9yd2FyZE1lc3NhZ2UsIGJ1dCB0aGUgY29waWVkIG1lc3NhZ2UgZG9lc24ndCBoYXZlIGEgbGluayB0byB0aGUgb3JpZ2luYWwgbWVzc2FnZS4gUmV0dXJucyB0aGUgTWVzc2FnZUlkIG9mIHRoZSBzZW50IG1lc3NhZ2Ugb24gc3VjY2Vzcy5cbiAgICAgKlxuICAgICAqIEBwYXJhbSBjaGF0X2lkIFVuaXF1ZSBpZGVudGlmaWVyIGZvciB0aGUgdGFyZ2V0IGNoYXQgb3IgdXNlcm5hbWUgb2YgdGhlIHRhcmdldCBjaGFubmVsIChpbiB0aGUgZm9ybWF0IEBjaGFubmVsdXNlcm5hbWUpXG4gICAgICogQHBhcmFtIG90aGVyIE9wdGlvbmFsIHJlbWFpbmluZyBwYXJhbWV0ZXJzLCBjb25mZXIgdGhlIG9mZmljaWFsIHJlZmVyZW5jZSBiZWxvd1xuICAgICAqIEBwYXJhbSBzaWduYWwgT3B0aW9uYWwgYEFib3J0U2lnbmFsYCB0byBjYW5jZWwgdGhlIHJlcXVlc3RcbiAgICAgKlxuICAgICAqICoqT2ZmaWNpYWwgcmVmZXJlbmNlOioqIGh0dHBzOi8vY29yZS50ZWxlZ3JhbS5vcmcvYm90cy9hcGkjY29weW1lc3NhZ2VcbiAgICAgKi9cbiAgICBjb3B5TWVzc2FnZShcbiAgICAgICAgY2hhdF9pZDogbnVtYmVyIHwgc3RyaW5nLFxuICAgICAgICBvdGhlcj86IE90aGVyPFwiY29weU1lc3NhZ2VcIiwgXCJjaGF0X2lkXCIgfCBcImZyb21fY2hhdF9pZFwiIHwgXCJtZXNzYWdlX2lkXCI+LFxuICAgICAgICBzaWduYWw/OiBBYm9ydFNpZ25hbCxcbiAgICApIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuYXBpLmNvcHlNZXNzYWdlKFxuICAgICAgICAgICAgY2hhdF9pZCxcbiAgICAgICAgICAgIG9yVGhyb3codGhpcy5jaGF0SWQsIFwiY29weU1lc3NhZ2VcIiksXG4gICAgICAgICAgICBvclRocm93KHRoaXMubXNnSWQsIFwiY29weU1lc3NhZ2VcIiksXG4gICAgICAgICAgICBvdGhlcixcbiAgICAgICAgICAgIHNpZ25hbCxcbiAgICAgICAgKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBDb250ZXh0LWF3YXJlIGFsaWFzIGZvciBgYXBpLmNvcHlNZXNzYWdlc2AuIFVzZSB0aGlzIG1ldGhvZCB0byBjb3B5IG1lc3NhZ2VzIG9mIGFueSBraW5kLiBJZiBzb21lIG9mIHRoZSBzcGVjaWZpZWQgbWVzc2FnZXMgY2FuJ3QgYmUgZm91bmQgb3IgY29waWVkLCB0aGV5IGFyZSBza2lwcGVkLiBTZXJ2aWNlIG1lc3NhZ2VzLCBwYWlkIG1lZGlhIG1lc3NhZ2VzLCBnaXZlYXdheSBtZXNzYWdlcywgZ2l2ZWF3YXkgd2lubmVycyBtZXNzYWdlcywgYW5kIGludm9pY2UgbWVzc2FnZXMgY2FuJ3QgYmUgY29waWVkLiBBIHF1aXogcG9sbCBjYW4gYmUgY29waWVkIG9ubHkgaWYgdGhlIHZhbHVlIG9mIHRoZSBmaWVsZCBjb3JyZWN0X29wdGlvbl9pZCBpcyBrbm93biB0byB0aGUgYm90LiBUaGUgbWV0aG9kIGlzIGFuYWxvZ291cyB0byB0aGUgbWV0aG9kIGZvcndhcmRNZXNzYWdlcywgYnV0IHRoZSBjb3BpZWQgbWVzc2FnZXMgZG9uJ3QgaGF2ZSBhIGxpbmsgdG8gdGhlIG9yaWdpbmFsIG1lc3NhZ2UuIEFsYnVtIGdyb3VwaW5nIGlzIGtlcHQgZm9yIGNvcGllZCBtZXNzYWdlcy4gT24gc3VjY2VzcywgYW4gYXJyYXkgb2YgTWVzc2FnZUlkIG9mIHRoZSBzZW50IG1lc3NhZ2VzIGlzIHJldHVybmVkLlxuICAgICAqXG4gICAgICogQHBhcmFtIGNoYXRfaWQgVW5pcXVlIGlkZW50aWZpZXIgZm9yIHRoZSB0YXJnZXQgY2hhdCBvciB1c2VybmFtZSBvZiB0aGUgdGFyZ2V0IGNoYW5uZWwgKGluIHRoZSBmb3JtYXQgQGNoYW5uZWx1c2VybmFtZSlcbiAgICAgKiBAcGFyYW0gbWVzc2FnZV9pZHMgQSBsaXN0IG9mIDEtMTAwIGlkZW50aWZpZXJzIG9mIG1lc3NhZ2VzIGluIHRoZSBjdXJyZW50IGNoYXQgdG8gY29weS4gVGhlIGlkZW50aWZpZXJzIG11c3QgYmUgc3BlY2lmaWVkIGluIGEgc3RyaWN0bHkgaW5jcmVhc2luZyBvcmRlci5cbiAgICAgKiBAcGFyYW0gb3RoZXIgT3B0aW9uYWwgcmVtYWluaW5nIHBhcmFtZXRlcnMsIGNvbmZlciB0aGUgb2ZmaWNpYWwgcmVmZXJlbmNlIGJlbG93XG4gICAgICogQHBhcmFtIHNpZ25hbCBPcHRpb25hbCBgQWJvcnRTaWduYWxgIHRvIGNhbmNlbCB0aGUgcmVxdWVzdFxuICAgICAqXG4gICAgICogKipPZmZpY2lhbCByZWZlcmVuY2U6KiogaHR0cHM6Ly9jb3JlLnRlbGVncmFtLm9yZy9ib3RzL2FwaSNjb3B5bWVzc2FnZXNcbiAgICAgKi9cbiAgICBjb3B5TWVzc2FnZXMoXG4gICAgICAgIGNoYXRfaWQ6IG51bWJlciB8IHN0cmluZyxcbiAgICAgICAgbWVzc2FnZV9pZHM6IG51bWJlcltdLFxuICAgICAgICBvdGhlcj86IE90aGVyPFxuICAgICAgICAgICAgXCJjb3B5TWVzc2FnZXNcIixcbiAgICAgICAgICAgIFwiY2hhdF9pZFwiIHwgXCJmcm9tX2NoYXRfaWRcIiB8IFwibWVzc2FnZV9pZFwiXG4gICAgICAgID4sXG4gICAgICAgIHNpZ25hbD86IEFib3J0U2lnbmFsLFxuICAgICkge1xuICAgICAgICByZXR1cm4gdGhpcy5hcGkuY29weU1lc3NhZ2VzKFxuICAgICAgICAgICAgY2hhdF9pZCxcbiAgICAgICAgICAgIG9yVGhyb3codGhpcy5jaGF0SWQsIFwiY29weU1lc3NhZ2VzXCIpLFxuICAgICAgICAgICAgbWVzc2FnZV9pZHMsXG4gICAgICAgICAgICBvdGhlcixcbiAgICAgICAgICAgIHNpZ25hbCxcbiAgICAgICAgKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBDb250ZXh0LWF3YXJlIGFsaWFzIGZvciBgYXBpLnNlbmRQaG90b2AuIFVzZSB0aGlzIG1ldGhvZCB0byBzZW5kIHBob3Rvcy4gT24gc3VjY2VzcywgdGhlIHNlbnQgTWVzc2FnZSBpcyByZXR1cm5lZC5cbiAgICAgKlxuICAgICAqIEBwYXJhbSBwaG90byBQaG90byB0byBzZW5kLiBQYXNzIGEgZmlsZV9pZCBhcyBTdHJpbmcgdG8gc2VuZCBhIHBob3RvIHRoYXQgZXhpc3RzIG9uIHRoZSBUZWxlZ3JhbSBzZXJ2ZXJzIChyZWNvbW1lbmRlZCksIHBhc3MgYW4gSFRUUCBVUkwgYXMgYSBTdHJpbmcgZm9yIFRlbGVncmFtIHRvIGdldCBhIHBob3RvIGZyb20gdGhlIEludGVybmV0LCBvciB1cGxvYWQgYSBuZXcgcGhvdG8gdXNpbmcgbXVsdGlwYXJ0L2Zvcm0tZGF0YS4gVGhlIHBob3RvIG11c3QgYmUgYXQgbW9zdCAxMCBNQiBpbiBzaXplLiBUaGUgcGhvdG8ncyB3aWR0aCBhbmQgaGVpZ2h0IG11c3Qgbm90IGV4Y2VlZCAxMDAwMCBpbiB0b3RhbC4gV2lkdGggYW5kIGhlaWdodCByYXRpbyBtdXN0IGJlIGF0IG1vc3QgMjAuXG4gICAgICogQHBhcmFtIG90aGVyIE9wdGlvbmFsIHJlbWFpbmluZyBwYXJhbWV0ZXJzLCBjb25mZXIgdGhlIG9mZmljaWFsIHJlZmVyZW5jZSBiZWxvd1xuICAgICAqIEBwYXJhbSBzaWduYWwgT3B0aW9uYWwgYEFib3J0U2lnbmFsYCB0byBjYW5jZWwgdGhlIHJlcXVlc3RcbiAgICAgKlxuICAgICAqICoqT2ZmaWNpYWwgcmVmZXJlbmNlOioqIGh0dHBzOi8vY29yZS50ZWxlZ3JhbS5vcmcvYm90cy9hcGkjc2VuZHBob3RvXG4gICAgICovXG4gICAgcmVwbHlXaXRoUGhvdG8oXG4gICAgICAgIHBob3RvOiBJbnB1dEZpbGUgfCBzdHJpbmcsXG4gICAgICAgIG90aGVyPzogT3RoZXI8XCJzZW5kUGhvdG9cIiwgXCJjaGF0X2lkXCIgfCBcInBob3RvXCI+LFxuICAgICAgICBzaWduYWw/OiBBYm9ydFNpZ25hbCxcbiAgICApIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuYXBpLnNlbmRQaG90byhcbiAgICAgICAgICAgIG9yVGhyb3codGhpcy5jaGF0SWQsIFwic2VuZFBob3RvXCIpLFxuICAgICAgICAgICAgcGhvdG8sXG4gICAgICAgICAgICB7IGJ1c2luZXNzX2Nvbm5lY3Rpb25faWQ6IHRoaXMuYnVzaW5lc3NDb25uZWN0aW9uSWQsIC4uLm90aGVyIH0sXG4gICAgICAgICAgICBzaWduYWwsXG4gICAgICAgICk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQ29udGV4dC1hd2FyZSBhbGlhcyBmb3IgYGFwaS5zZW5kQXVkaW9gLiBVc2UgdGhpcyBtZXRob2QgdG8gc2VuZCBhdWRpbyBmaWxlcywgaWYgeW91IHdhbnQgVGVsZWdyYW0gY2xpZW50cyB0byBkaXNwbGF5IHRoZW0gaW4gdGhlIG11c2ljIHBsYXllci4gWW91ciBhdWRpbyBtdXN0IGJlIGluIHRoZSAuTVAzIG9yIC5NNEEgZm9ybWF0LiBPbiBzdWNjZXNzLCB0aGUgc2VudCBNZXNzYWdlIGlzIHJldHVybmVkLiBCb3RzIGNhbiBjdXJyZW50bHkgc2VuZCBhdWRpbyBmaWxlcyBvZiB1cCB0byA1MCBNQiBpbiBzaXplLCB0aGlzIGxpbWl0IG1heSBiZSBjaGFuZ2VkIGluIHRoZSBmdXR1cmUuXG4gICAgICpcbiAgICAgKiBGb3Igc2VuZGluZyB2b2ljZSBtZXNzYWdlcywgdXNlIHRoZSBzZW5kVm9pY2UgbWV0aG9kIGluc3RlYWQuXG4gICAgICpcbiAgICAgKiBAcGFyYW0gYXVkaW8gQXVkaW8gZmlsZSB0byBzZW5kLiBQYXNzIGEgZmlsZV9pZCBhcyBTdHJpbmcgdG8gc2VuZCBhbiBhdWRpbyBmaWxlIHRoYXQgZXhpc3RzIG9uIHRoZSBUZWxlZ3JhbSBzZXJ2ZXJzIChyZWNvbW1lbmRlZCksIHBhc3MgYW4gSFRUUCBVUkwgYXMgYSBTdHJpbmcgZm9yIFRlbGVncmFtIHRvIGdldCBhbiBhdWRpbyBmaWxlIGZyb20gdGhlIEludGVybmV0LCBvciB1cGxvYWQgYSBuZXcgb25lIHVzaW5nIG11bHRpcGFydC9mb3JtLWRhdGEuXG4gICAgICogQHBhcmFtIG90aGVyIE9wdGlvbmFsIHJlbWFpbmluZyBwYXJhbWV0ZXJzLCBjb25mZXIgdGhlIG9mZmljaWFsIHJlZmVyZW5jZSBiZWxvd1xuICAgICAqIEBwYXJhbSBzaWduYWwgT3B0aW9uYWwgYEFib3J0U2lnbmFsYCB0byBjYW5jZWwgdGhlIHJlcXVlc3RcbiAgICAgKlxuICAgICAqICoqT2ZmaWNpYWwgcmVmZXJlbmNlOioqIGh0dHBzOi8vY29yZS50ZWxlZ3JhbS5vcmcvYm90cy9hcGkjc2VuZGF1ZGlvXG4gICAgICovXG4gICAgcmVwbHlXaXRoQXVkaW8oXG4gICAgICAgIGF1ZGlvOiBJbnB1dEZpbGUgfCBzdHJpbmcsXG4gICAgICAgIG90aGVyPzogT3RoZXI8XCJzZW5kQXVkaW9cIiwgXCJjaGF0X2lkXCIgfCBcImF1ZGlvXCI+LFxuICAgICAgICBzaWduYWw/OiBBYm9ydFNpZ25hbCxcbiAgICApIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuYXBpLnNlbmRBdWRpbyhcbiAgICAgICAgICAgIG9yVGhyb3codGhpcy5jaGF0SWQsIFwic2VuZEF1ZGlvXCIpLFxuICAgICAgICAgICAgYXVkaW8sXG4gICAgICAgICAgICB7IGJ1c2luZXNzX2Nvbm5lY3Rpb25faWQ6IHRoaXMuYnVzaW5lc3NDb25uZWN0aW9uSWQsIC4uLm90aGVyIH0sXG4gICAgICAgICAgICBzaWduYWwsXG4gICAgICAgICk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQ29udGV4dC1hd2FyZSBhbGlhcyBmb3IgYGFwaS5zZW5kRG9jdW1lbnRgLiBVc2UgdGhpcyBtZXRob2QgdG8gc2VuZCBnZW5lcmFsIGZpbGVzLiBPbiBzdWNjZXNzLCB0aGUgc2VudCBNZXNzYWdlIGlzIHJldHVybmVkLiBCb3RzIGNhbiBjdXJyZW50bHkgc2VuZCBmaWxlcyBvZiBhbnkgdHlwZSBvZiB1cCB0byA1MCBNQiBpbiBzaXplLCB0aGlzIGxpbWl0IG1heSBiZSBjaGFuZ2VkIGluIHRoZSBmdXR1cmUuXG4gICAgICpcbiAgICAgKiBAcGFyYW0gZG9jdW1lbnQgRmlsZSB0byBzZW5kLiBQYXNzIGEgZmlsZV9pZCBhcyBTdHJpbmcgdG8gc2VuZCBhIGZpbGUgdGhhdCBleGlzdHMgb24gdGhlIFRlbGVncmFtIHNlcnZlcnMgKHJlY29tbWVuZGVkKSwgcGFzcyBhbiBIVFRQIFVSTCBhcyBhIFN0cmluZyBmb3IgVGVsZWdyYW0gdG8gZ2V0IGEgZmlsZSBmcm9tIHRoZSBJbnRlcm5ldCwgb3IgdXBsb2FkIGEgbmV3IG9uZSB1c2luZyBtdWx0aXBhcnQvZm9ybS1kYXRhLlxuICAgICAqIEBwYXJhbSBvdGhlciBPcHRpb25hbCByZW1haW5pbmcgcGFyYW1ldGVycywgY29uZmVyIHRoZSBvZmZpY2lhbCByZWZlcmVuY2UgYmVsb3dcbiAgICAgKiBAcGFyYW0gc2lnbmFsIE9wdGlvbmFsIGBBYm9ydFNpZ25hbGAgdG8gY2FuY2VsIHRoZSByZXF1ZXN0XG4gICAgICpcbiAgICAgKiAqKk9mZmljaWFsIHJlZmVyZW5jZToqKiBodHRwczovL2NvcmUudGVsZWdyYW0ub3JnL2JvdHMvYXBpI3NlbmRkb2N1bWVudFxuICAgICAqL1xuICAgIHJlcGx5V2l0aERvY3VtZW50KFxuICAgICAgICBkb2N1bWVudDogSW5wdXRGaWxlIHwgc3RyaW5nLFxuICAgICAgICBvdGhlcj86IE90aGVyPFwic2VuZERvY3VtZW50XCIsIFwiY2hhdF9pZFwiIHwgXCJkb2N1bWVudFwiPixcbiAgICAgICAgc2lnbmFsPzogQWJvcnRTaWduYWwsXG4gICAgKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmFwaS5zZW5kRG9jdW1lbnQoXG4gICAgICAgICAgICBvclRocm93KHRoaXMuY2hhdElkLCBcInNlbmREb2N1bWVudFwiKSxcbiAgICAgICAgICAgIGRvY3VtZW50LFxuICAgICAgICAgICAgeyBidXNpbmVzc19jb25uZWN0aW9uX2lkOiB0aGlzLmJ1c2luZXNzQ29ubmVjdGlvbklkLCAuLi5vdGhlciB9LFxuICAgICAgICAgICAgc2lnbmFsLFxuICAgICAgICApO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIENvbnRleHQtYXdhcmUgYWxpYXMgZm9yIGBhcGkuc2VuZFZpZGVvYC4gVXNlIHRoaXMgbWV0aG9kIHRvIHNlbmQgdmlkZW8gZmlsZXMsIFRlbGVncmFtIGNsaWVudHMgc3VwcG9ydCBtcDQgdmlkZW9zIChvdGhlciBmb3JtYXRzIG1heSBiZSBzZW50IGFzIERvY3VtZW50KS4gT24gc3VjY2VzcywgdGhlIHNlbnQgTWVzc2FnZSBpcyByZXR1cm5lZC4gQm90cyBjYW4gY3VycmVudGx5IHNlbmQgdmlkZW8gZmlsZXMgb2YgdXAgdG8gNTAgTUIgaW4gc2l6ZSwgdGhpcyBsaW1pdCBtYXkgYmUgY2hhbmdlZCBpbiB0aGUgZnV0dXJlLlxuICAgICAqXG4gICAgICogQHBhcmFtIHZpZGVvIFZpZGVvIHRvIHNlbmQuIFBhc3MgYSBmaWxlX2lkIGFzIFN0cmluZyB0byBzZW5kIGEgdmlkZW8gdGhhdCBleGlzdHMgb24gdGhlIFRlbGVncmFtIHNlcnZlcnMgKHJlY29tbWVuZGVkKSwgcGFzcyBhbiBIVFRQIFVSTCBhcyBhIFN0cmluZyBmb3IgVGVsZWdyYW0gdG8gZ2V0IGEgdmlkZW8gZnJvbSB0aGUgSW50ZXJuZXQsIG9yIHVwbG9hZCBhIG5ldyB2aWRlbyB1c2luZyBtdWx0aXBhcnQvZm9ybS1kYXRhLlxuICAgICAqIEBwYXJhbSBvdGhlciBPcHRpb25hbCByZW1haW5pbmcgcGFyYW1ldGVycywgY29uZmVyIHRoZSBvZmZpY2lhbCByZWZlcmVuY2UgYmVsb3dcbiAgICAgKiBAcGFyYW0gc2lnbmFsIE9wdGlvbmFsIGBBYm9ydFNpZ25hbGAgdG8gY2FuY2VsIHRoZSByZXF1ZXN0XG4gICAgICpcbiAgICAgKiAqKk9mZmljaWFsIHJlZmVyZW5jZToqKiBodHRwczovL2NvcmUudGVsZWdyYW0ub3JnL2JvdHMvYXBpI3NlbmR2aWRlb1xuICAgICAqL1xuICAgIHJlcGx5V2l0aFZpZGVvKFxuICAgICAgICB2aWRlbzogSW5wdXRGaWxlIHwgc3RyaW5nLFxuICAgICAgICBvdGhlcj86IE90aGVyPFwic2VuZFZpZGVvXCIsIFwiY2hhdF9pZFwiIHwgXCJ2aWRlb1wiPixcbiAgICAgICAgc2lnbmFsPzogQWJvcnRTaWduYWwsXG4gICAgKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmFwaS5zZW5kVmlkZW8oXG4gICAgICAgICAgICBvclRocm93KHRoaXMuY2hhdElkLCBcInNlbmRWaWRlb1wiKSxcbiAgICAgICAgICAgIHZpZGVvLFxuICAgICAgICAgICAgeyBidXNpbmVzc19jb25uZWN0aW9uX2lkOiB0aGlzLmJ1c2luZXNzQ29ubmVjdGlvbklkLCAuLi5vdGhlciB9LFxuICAgICAgICAgICAgc2lnbmFsLFxuICAgICAgICApO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIENvbnRleHQtYXdhcmUgYWxpYXMgZm9yIGBhcGkuc2VuZEFuaW1hdGlvbmAuIFVzZSB0aGlzIG1ldGhvZCB0byBzZW5kIGFuaW1hdGlvbiBmaWxlcyAoR0lGIG9yIEguMjY0L01QRUctNCBBVkMgdmlkZW8gd2l0aG91dCBzb3VuZCkuIE9uIHN1Y2Nlc3MsIHRoZSBzZW50IE1lc3NhZ2UgaXMgcmV0dXJuZWQuIEJvdHMgY2FuIGN1cnJlbnRseSBzZW5kIGFuaW1hdGlvbiBmaWxlcyBvZiB1cCB0byA1MCBNQiBpbiBzaXplLCB0aGlzIGxpbWl0IG1heSBiZSBjaGFuZ2VkIGluIHRoZSBmdXR1cmUuXG4gICAgICpcbiAgICAgKiBAcGFyYW0gYW5pbWF0aW9uIEFuaW1hdGlvbiB0byBzZW5kLiBQYXNzIGEgZmlsZV9pZCBhcyBTdHJpbmcgdG8gc2VuZCBhbiBhbmltYXRpb24gdGhhdCBleGlzdHMgb24gdGhlIFRlbGVncmFtIHNlcnZlcnMgKHJlY29tbWVuZGVkKSwgcGFzcyBhbiBIVFRQIFVSTCBhcyBhIFN0cmluZyBmb3IgVGVsZWdyYW0gdG8gZ2V0IGFuIGFuaW1hdGlvbiBmcm9tIHRoZSBJbnRlcm5ldCwgb3IgdXBsb2FkIGEgbmV3IGFuaW1hdGlvbiB1c2luZyBtdWx0aXBhcnQvZm9ybS1kYXRhLlxuICAgICAqIEBwYXJhbSBvdGhlciBPcHRpb25hbCByZW1haW5pbmcgcGFyYW1ldGVycywgY29uZmVyIHRoZSBvZmZpY2lhbCByZWZlcmVuY2UgYmVsb3dcbiAgICAgKiBAcGFyYW0gc2lnbmFsIE9wdGlvbmFsIGBBYm9ydFNpZ25hbGAgdG8gY2FuY2VsIHRoZSByZXF1ZXN0XG4gICAgICpcbiAgICAgKiAqKk9mZmljaWFsIHJlZmVyZW5jZToqKiBodHRwczovL2NvcmUudGVsZWdyYW0ub3JnL2JvdHMvYXBpI3NlbmRhbmltYXRpb25cbiAgICAgKi9cbiAgICByZXBseVdpdGhBbmltYXRpb24oXG4gICAgICAgIGFuaW1hdGlvbjogSW5wdXRGaWxlIHwgc3RyaW5nLFxuICAgICAgICBvdGhlcj86IE90aGVyPFwic2VuZEFuaW1hdGlvblwiLCBcImNoYXRfaWRcIiB8IFwiYW5pbWF0aW9uXCI+LFxuICAgICAgICBzaWduYWw/OiBBYm9ydFNpZ25hbCxcbiAgICApIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuYXBpLnNlbmRBbmltYXRpb24oXG4gICAgICAgICAgICBvclRocm93KHRoaXMuY2hhdElkLCBcInNlbmRBbmltYXRpb25cIiksXG4gICAgICAgICAgICBhbmltYXRpb24sXG4gICAgICAgICAgICB7IGJ1c2luZXNzX2Nvbm5lY3Rpb25faWQ6IHRoaXMuYnVzaW5lc3NDb25uZWN0aW9uSWQsIC4uLm90aGVyIH0sXG4gICAgICAgICAgICBzaWduYWwsXG4gICAgICAgICk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQ29udGV4dC1hd2FyZSBhbGlhcyBmb3IgYGFwaS5zZW5kVm9pY2VgLiBVc2UgdGhpcyBtZXRob2QgdG8gc2VuZCBhdWRpbyBmaWxlcywgaWYgeW91IHdhbnQgVGVsZWdyYW0gY2xpZW50cyB0byBkaXNwbGF5IHRoZSBmaWxlIGFzIGEgcGxheWFibGUgdm9pY2UgbWVzc2FnZS4gRm9yIHRoaXMgdG8gd29yaywgeW91ciBhdWRpbyBtdXN0IGJlIGluIGFuIC5PR0cgZmlsZSBlbmNvZGVkIHdpdGggT1BVUyAob3RoZXIgZm9ybWF0cyBtYXkgYmUgc2VudCBhcyBBdWRpbyBvciBEb2N1bWVudCkuIE9uIHN1Y2Nlc3MsIHRoZSBzZW50IE1lc3NhZ2UgaXMgcmV0dXJuZWQuIEJvdHMgY2FuIGN1cnJlbnRseSBzZW5kIHZvaWNlIG1lc3NhZ2VzIG9mIHVwIHRvIDUwIE1CIGluIHNpemUsIHRoaXMgbGltaXQgbWF5IGJlIGNoYW5nZWQgaW4gdGhlIGZ1dHVyZS5cbiAgICAgKlxuICAgICAqIEBwYXJhbSB2b2ljZSBBdWRpbyBmaWxlIHRvIHNlbmQuIFBhc3MgYSBmaWxlX2lkIGFzIFN0cmluZyB0byBzZW5kIGEgZmlsZSB0aGF0IGV4aXN0cyBvbiB0aGUgVGVsZWdyYW0gc2VydmVycyAocmVjb21tZW5kZWQpLCBwYXNzIGFuIEhUVFAgVVJMIGFzIGEgU3RyaW5nIGZvciBUZWxlZ3JhbSB0byBnZXQgYSBmaWxlIGZyb20gdGhlIEludGVybmV0LCBvciB1cGxvYWQgYSBuZXcgb25lIHVzaW5nIG11bHRpcGFydC9mb3JtLWRhdGEuXG4gICAgICogQHBhcmFtIG90aGVyIE9wdGlvbmFsIHJlbWFpbmluZyBwYXJhbWV0ZXJzLCBjb25mZXIgdGhlIG9mZmljaWFsIHJlZmVyZW5jZSBiZWxvd1xuICAgICAqIEBwYXJhbSBzaWduYWwgT3B0aW9uYWwgYEFib3J0U2lnbmFsYCB0byBjYW5jZWwgdGhlIHJlcXVlc3RcbiAgICAgKlxuICAgICAqICoqT2ZmaWNpYWwgcmVmZXJlbmNlOioqIGh0dHBzOi8vY29yZS50ZWxlZ3JhbS5vcmcvYm90cy9hcGkjc2VuZHZvaWNlXG4gICAgICovXG4gICAgcmVwbHlXaXRoVm9pY2UoXG4gICAgICAgIHZvaWNlOiBJbnB1dEZpbGUgfCBzdHJpbmcsXG4gICAgICAgIG90aGVyPzogT3RoZXI8XCJzZW5kVm9pY2VcIiwgXCJjaGF0X2lkXCIgfCBcInZvaWNlXCI+LFxuICAgICAgICBzaWduYWw/OiBBYm9ydFNpZ25hbCxcbiAgICApIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuYXBpLnNlbmRWb2ljZShcbiAgICAgICAgICAgIG9yVGhyb3codGhpcy5jaGF0SWQsIFwic2VuZFZvaWNlXCIpLFxuICAgICAgICAgICAgdm9pY2UsXG4gICAgICAgICAgICB7IGJ1c2luZXNzX2Nvbm5lY3Rpb25faWQ6IHRoaXMuYnVzaW5lc3NDb25uZWN0aW9uSWQsIC4uLm90aGVyIH0sXG4gICAgICAgICAgICBzaWduYWwsXG4gICAgICAgICk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQ29udGV4dC1hd2FyZSBhbGlhcyBmb3IgYGFwaS5zZW5kVmlkZW9Ob3RlYC4gVXNlIHRoaXMgbWV0aG9kIHRvIHNlbmQgdmlkZW8gbWVzc2FnZXMuIE9uIHN1Y2Nlc3MsIHRoZSBzZW50IE1lc3NhZ2UgaXMgcmV0dXJuZWQuXG4gICAgICogQXMgb2Ygdi40LjAsIFRlbGVncmFtIGNsaWVudHMgc3VwcG9ydCByb3VuZGVkIHNxdWFyZSBtcDQgdmlkZW9zIG9mIHVwIHRvIDEgbWludXRlIGxvbmcuXG4gICAgICpcbiAgICAgKiBAcGFyYW0gdmlkZW9fbm90ZSBWaWRlbyBub3RlIHRvIHNlbmQuIFBhc3MgYSBmaWxlX2lkIGFzIFN0cmluZyB0byBzZW5kIGEgdmlkZW8gbm90ZSB0aGF0IGV4aXN0cyBvbiB0aGUgVGVsZWdyYW0gc2VydmVycyAocmVjb21tZW5kZWQpIG9yIHVwbG9hZCBhIG5ldyB2aWRlbyB1c2luZyBtdWx0aXBhcnQvZm9ybS1kYXRhLi4gU2VuZGluZyB2aWRlbyBub3RlcyBieSBhIFVSTCBpcyBjdXJyZW50bHkgdW5zdXBwb3J0ZWRcbiAgICAgKiBAcGFyYW0gb3RoZXIgT3B0aW9uYWwgcmVtYWluaW5nIHBhcmFtZXRlcnMsIGNvbmZlciB0aGUgb2ZmaWNpYWwgcmVmZXJlbmNlIGJlbG93XG4gICAgICogQHBhcmFtIHNpZ25hbCBPcHRpb25hbCBgQWJvcnRTaWduYWxgIHRvIGNhbmNlbCB0aGUgcmVxdWVzdFxuICAgICAqXG4gICAgICogKipPZmZpY2lhbCByZWZlcmVuY2U6KiogaHR0cHM6Ly9jb3JlLnRlbGVncmFtLm9yZy9ib3RzL2FwaSNzZW5kdmlkZW9ub3RlXG4gICAgICovXG4gICAgcmVwbHlXaXRoVmlkZW9Ob3RlKFxuICAgICAgICB2aWRlb19ub3RlOiBJbnB1dEZpbGUgfCBzdHJpbmcsXG4gICAgICAgIG90aGVyPzogT3RoZXI8XCJzZW5kVmlkZW9Ob3RlXCIsIFwiY2hhdF9pZFwiIHwgXCJ2aWRlb19ub3RlXCI+LFxuICAgICAgICBzaWduYWw/OiBBYm9ydFNpZ25hbCxcbiAgICApIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuYXBpLnNlbmRWaWRlb05vdGUoXG4gICAgICAgICAgICBvclRocm93KHRoaXMuY2hhdElkLCBcInNlbmRWaWRlb05vdGVcIiksXG4gICAgICAgICAgICB2aWRlb19ub3RlLFxuICAgICAgICAgICAgeyBidXNpbmVzc19jb25uZWN0aW9uX2lkOiB0aGlzLmJ1c2luZXNzQ29ubmVjdGlvbklkLCAuLi5vdGhlciB9LFxuICAgICAgICAgICAgc2lnbmFsLFxuICAgICAgICApO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIENvbnRleHQtYXdhcmUgYWxpYXMgZm9yIGBhcGkuc2VuZE1lZGlhR3JvdXBgLiBVc2UgdGhpcyBtZXRob2QgdG8gc2VuZCBhIGdyb3VwIG9mIHBob3RvcywgdmlkZW9zLCBkb2N1bWVudHMgb3IgYXVkaW9zIGFzIGFuIGFsYnVtLiBEb2N1bWVudHMgYW5kIGF1ZGlvIGZpbGVzIGNhbiBiZSBvbmx5IGdyb3VwZWQgaW4gYW4gYWxidW0gd2l0aCBtZXNzYWdlcyBvZiB0aGUgc2FtZSB0eXBlLiBPbiBzdWNjZXNzLCBhbiBhcnJheSBvZiBNZXNzYWdlcyB0aGF0IHdlcmUgc2VudCBpcyByZXR1cm5lZC5cbiAgICAgKlxuICAgICAqIEBwYXJhbSBtZWRpYSBBbiBhcnJheSBkZXNjcmliaW5nIG1lc3NhZ2VzIHRvIGJlIHNlbnQsIG11c3QgaW5jbHVkZSAyLTEwIGl0ZW1zXG4gICAgICogQHBhcmFtIG90aGVyIE9wdGlvbmFsIHJlbWFpbmluZyBwYXJhbWV0ZXJzLCBjb25mZXIgdGhlIG9mZmljaWFsIHJlZmVyZW5jZSBiZWxvd1xuICAgICAqIEBwYXJhbSBzaWduYWwgT3B0aW9uYWwgYEFib3J0U2lnbmFsYCB0byBjYW5jZWwgdGhlIHJlcXVlc3RcbiAgICAgKlxuICAgICAqICoqT2ZmaWNpYWwgcmVmZXJlbmNlOioqIGh0dHBzOi8vY29yZS50ZWxlZ3JhbS5vcmcvYm90cy9hcGkjc2VuZG1lZGlhZ3JvdXBcbiAgICAgKi9cbiAgICByZXBseVdpdGhNZWRpYUdyb3VwKFxuICAgICAgICBtZWRpYTogUmVhZG9ubHlBcnJheTxcbiAgICAgICAgICAgIHwgSW5wdXRNZWRpYUF1ZGlvXG4gICAgICAgICAgICB8IElucHV0TWVkaWFEb2N1bWVudFxuICAgICAgICAgICAgfCBJbnB1dE1lZGlhUGhvdG9cbiAgICAgICAgICAgIHwgSW5wdXRNZWRpYVZpZGVvXG4gICAgICAgID4sXG4gICAgICAgIG90aGVyPzogT3RoZXI8XCJzZW5kTWVkaWFHcm91cFwiLCBcImNoYXRfaWRcIiB8IFwibWVkaWFcIj4sXG4gICAgICAgIHNpZ25hbD86IEFib3J0U2lnbmFsLFxuICAgICkge1xuICAgICAgICByZXR1cm4gdGhpcy5hcGkuc2VuZE1lZGlhR3JvdXAoXG4gICAgICAgICAgICBvclRocm93KHRoaXMuY2hhdElkLCBcInNlbmRNZWRpYUdyb3VwXCIpLFxuICAgICAgICAgICAgbWVkaWEsXG4gICAgICAgICAgICB7IGJ1c2luZXNzX2Nvbm5lY3Rpb25faWQ6IHRoaXMuYnVzaW5lc3NDb25uZWN0aW9uSWQsIC4uLm90aGVyIH0sXG4gICAgICAgICAgICBzaWduYWwsXG4gICAgICAgICk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQ29udGV4dC1hd2FyZSBhbGlhcyBmb3IgYGFwaS5zZW5kTG9jYXRpb25gLiBVc2UgdGhpcyBtZXRob2QgdG8gc2VuZCBwb2ludCBvbiB0aGUgbWFwLiBPbiBzdWNjZXNzLCB0aGUgc2VudCBNZXNzYWdlIGlzIHJldHVybmVkLlxuICAgICAqXG4gICAgICogQHBhcmFtIGxhdGl0dWRlIExhdGl0dWRlIG9mIHRoZSBsb2NhdGlvblxuICAgICAqIEBwYXJhbSBsb25naXR1ZGUgTG9uZ2l0dWRlIG9mIHRoZSBsb2NhdGlvblxuICAgICAqIEBwYXJhbSBvdGhlciBPcHRpb25hbCByZW1haW5pbmcgcGFyYW1ldGVycywgY29uZmVyIHRoZSBvZmZpY2lhbCByZWZlcmVuY2UgYmVsb3dcbiAgICAgKiBAcGFyYW0gc2lnbmFsIE9wdGlvbmFsIGBBYm9ydFNpZ25hbGAgdG8gY2FuY2VsIHRoZSByZXF1ZXN0XG4gICAgICpcbiAgICAgKiAqKk9mZmljaWFsIHJlZmVyZW5jZToqKiBodHRwczovL2NvcmUudGVsZWdyYW0ub3JnL2JvdHMvYXBpI3NlbmRsb2NhdGlvblxuICAgICAqL1xuICAgIHJlcGx5V2l0aExvY2F0aW9uKFxuICAgICAgICBsYXRpdHVkZTogbnVtYmVyLFxuICAgICAgICBsb25naXR1ZGU6IG51bWJlcixcbiAgICAgICAgb3RoZXI/OiBPdGhlcjxcInNlbmRMb2NhdGlvblwiLCBcImNoYXRfaWRcIiB8IFwibGF0aXR1ZGVcIiB8IFwibG9uZ2l0dWRlXCI+LFxuICAgICAgICBzaWduYWw/OiBBYm9ydFNpZ25hbCxcbiAgICApIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuYXBpLnNlbmRMb2NhdGlvbihcbiAgICAgICAgICAgIG9yVGhyb3codGhpcy5jaGF0SWQsIFwic2VuZExvY2F0aW9uXCIpLFxuICAgICAgICAgICAgbGF0aXR1ZGUsXG4gICAgICAgICAgICBsb25naXR1ZGUsXG4gICAgICAgICAgICB7IGJ1c2luZXNzX2Nvbm5lY3Rpb25faWQ6IHRoaXMuYnVzaW5lc3NDb25uZWN0aW9uSWQsIC4uLm90aGVyIH0sXG4gICAgICAgICAgICBzaWduYWwsXG4gICAgICAgICk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQ29udGV4dC1hd2FyZSBhbGlhcyBmb3IgYGFwaS5lZGl0TWVzc2FnZUxpdmVMb2NhdGlvbmAuIFVzZSB0aGlzIG1ldGhvZCB0byBlZGl0IGxpdmUgbG9jYXRpb24gbWVzc2FnZXMuIEEgbG9jYXRpb24gY2FuIGJlIGVkaXRlZCB1bnRpbCBpdHMgbGl2ZV9wZXJpb2QgZXhwaXJlcyBvciBlZGl0aW5nIGlzIGV4cGxpY2l0bHkgZGlzYWJsZWQgYnkgYSBjYWxsIHRvIHN0b3BNZXNzYWdlTGl2ZUxvY2F0aW9uLiBPbiBzdWNjZXNzLCBpZiB0aGUgZWRpdGVkIG1lc3NhZ2UgaXMgbm90IGFuIGlubGluZSBtZXNzYWdlLCB0aGUgZWRpdGVkIE1lc3NhZ2UgaXMgcmV0dXJuZWQsIG90aGVyd2lzZSBUcnVlIGlzIHJldHVybmVkLlxuICAgICAqXG4gICAgICogQHBhcmFtIGxhdGl0dWRlIExhdGl0dWRlIG9mIG5ldyBsb2NhdGlvblxuICAgICAqIEBwYXJhbSBsb25naXR1ZGUgTG9uZ2l0dWRlIG9mIG5ldyBsb2NhdGlvblxuICAgICAqIEBwYXJhbSBvdGhlciBPcHRpb25hbCByZW1haW5pbmcgcGFyYW1ldGVycywgY29uZmVyIHRoZSBvZmZpY2lhbCByZWZlcmVuY2UgYmVsb3dcbiAgICAgKiBAcGFyYW0gc2lnbmFsIE9wdGlvbmFsIGBBYm9ydFNpZ25hbGAgdG8gY2FuY2VsIHRoZSByZXF1ZXN0XG4gICAgICpcbiAgICAgKiAqKk9mZmljaWFsIHJlZmVyZW5jZToqKiBodHRwczovL2NvcmUudGVsZWdyYW0ub3JnL2JvdHMvYXBpI2VkaXRtZXNzYWdlbGl2ZWxvY2F0aW9uXG4gICAgICovXG4gICAgZWRpdE1lc3NhZ2VMaXZlTG9jYXRpb24oXG4gICAgICAgIGxhdGl0dWRlOiBudW1iZXIsXG4gICAgICAgIGxvbmdpdHVkZTogbnVtYmVyLFxuICAgICAgICBvdGhlcj86IE90aGVyPFxuICAgICAgICAgICAgXCJlZGl0TWVzc2FnZUxpdmVMb2NhdGlvblwiLFxuICAgICAgICAgICAgfCBcImNoYXRfaWRcIlxuICAgICAgICAgICAgfCBcIm1lc3NhZ2VfaWRcIlxuICAgICAgICAgICAgfCBcImlubGluZV9tZXNzYWdlX2lkXCJcbiAgICAgICAgICAgIHwgXCJsYXRpdHVkZVwiXG4gICAgICAgICAgICB8IFwibG9uZ2l0dWRlXCJcbiAgICAgICAgPixcbiAgICAgICAgc2lnbmFsPzogQWJvcnRTaWduYWwsXG4gICAgKSB7XG4gICAgICAgIGNvbnN0IGlubGluZUlkID0gdGhpcy5pbmxpbmVNZXNzYWdlSWQ7XG4gICAgICAgIHJldHVybiBpbmxpbmVJZCAhPT0gdW5kZWZpbmVkXG4gICAgICAgICAgICA/IHRoaXMuYXBpLmVkaXRNZXNzYWdlTGl2ZUxvY2F0aW9uSW5saW5lKFxuICAgICAgICAgICAgICAgIGlubGluZUlkLFxuICAgICAgICAgICAgICAgIGxhdGl0dWRlLFxuICAgICAgICAgICAgICAgIGxvbmdpdHVkZSxcbiAgICAgICAgICAgICAgICBvdGhlcixcbiAgICAgICAgICAgIClcbiAgICAgICAgICAgIDogdGhpcy5hcGkuZWRpdE1lc3NhZ2VMaXZlTG9jYXRpb24oXG4gICAgICAgICAgICAgICAgb3JUaHJvdyh0aGlzLmNoYXRJZCwgXCJlZGl0TWVzc2FnZUxpdmVMb2NhdGlvblwiKSxcbiAgICAgICAgICAgICAgICBvclRocm93KHRoaXMubXNnSWQsIFwiZWRpdE1lc3NhZ2VMaXZlTG9jYXRpb25cIiksXG4gICAgICAgICAgICAgICAgbGF0aXR1ZGUsXG4gICAgICAgICAgICAgICAgbG9uZ2l0dWRlLFxuICAgICAgICAgICAgICAgIG90aGVyLFxuICAgICAgICAgICAgICAgIHNpZ25hbCxcbiAgICAgICAgICAgICk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQ29udGV4dC1hd2FyZSBhbGlhcyBmb3IgYGFwaS5zdG9wTWVzc2FnZUxpdmVMb2NhdGlvbmAuIFVzZSB0aGlzIG1ldGhvZCB0byBzdG9wIHVwZGF0aW5nIGEgbGl2ZSBsb2NhdGlvbiBtZXNzYWdlIGJlZm9yZSBsaXZlX3BlcmlvZCBleHBpcmVzLiBPbiBzdWNjZXNzLCBpZiB0aGUgbWVzc2FnZSBpcyBub3QgYW4gaW5saW5lIG1lc3NhZ2UsIHRoZSBlZGl0ZWQgTWVzc2FnZSBpcyByZXR1cm5lZCwgb3RoZXJ3aXNlIFRydWUgaXMgcmV0dXJuZWQuXG4gICAgICpcbiAgICAgKiBAcGFyYW0gb3RoZXIgT3B0aW9uYWwgcmVtYWluaW5nIHBhcmFtZXRlcnMsIGNvbmZlciB0aGUgb2ZmaWNpYWwgcmVmZXJlbmNlIGJlbG93XG4gICAgICogQHBhcmFtIHNpZ25hbCBPcHRpb25hbCBgQWJvcnRTaWduYWxgIHRvIGNhbmNlbCB0aGUgcmVxdWVzdFxuICAgICAqXG4gICAgICogKipPZmZpY2lhbCByZWZlcmVuY2U6KiogaHR0cHM6Ly9jb3JlLnRlbGVncmFtLm9yZy9ib3RzL2FwaSNzdG9wbWVzc2FnZWxpdmVsb2NhdGlvblxuICAgICAqL1xuICAgIHN0b3BNZXNzYWdlTGl2ZUxvY2F0aW9uKFxuICAgICAgICBvdGhlcj86IE90aGVyPFxuICAgICAgICAgICAgXCJzdG9wTWVzc2FnZUxpdmVMb2NhdGlvblwiLFxuICAgICAgICAgICAgXCJjaGF0X2lkXCIgfCBcIm1lc3NhZ2VfaWRcIiB8IFwiaW5saW5lX21lc3NhZ2VfaWRcIlxuICAgICAgICA+LFxuICAgICAgICBzaWduYWw/OiBBYm9ydFNpZ25hbCxcbiAgICApIHtcbiAgICAgICAgY29uc3QgaW5saW5lSWQgPSB0aGlzLmlubGluZU1lc3NhZ2VJZDtcbiAgICAgICAgcmV0dXJuIGlubGluZUlkICE9PSB1bmRlZmluZWRcbiAgICAgICAgICAgID8gdGhpcy5hcGkuc3RvcE1lc3NhZ2VMaXZlTG9jYXRpb25JbmxpbmUoaW5saW5lSWQsIG90aGVyKVxuICAgICAgICAgICAgOiB0aGlzLmFwaS5zdG9wTWVzc2FnZUxpdmVMb2NhdGlvbihcbiAgICAgICAgICAgICAgICBvclRocm93KHRoaXMuY2hhdElkLCBcInN0b3BNZXNzYWdlTGl2ZUxvY2F0aW9uXCIpLFxuICAgICAgICAgICAgICAgIG9yVGhyb3codGhpcy5tc2dJZCwgXCJzdG9wTWVzc2FnZUxpdmVMb2NhdGlvblwiKSxcbiAgICAgICAgICAgICAgICBvdGhlcixcbiAgICAgICAgICAgICAgICBzaWduYWwsXG4gICAgICAgICAgICApO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIENvbnRleHQtYXdhcmUgYWxpYXMgZm9yIGBhcGkuc2VuZFBhaWRNZWRpYWAuIFVzZSB0aGlzIG1ldGhvZCB0byBzZW5kIHBhaWQgbWVkaWEgdG8gY2hhbm5lbCBjaGF0cy4gT24gc3VjY2VzcywgdGhlIHNlbnQgTWVzc2FnZSBpcyByZXR1cm5lZC5cbiAgICAgKlxuICAgICAqIEBwYXJhbSBzdGFyX2NvdW50IFRoZSBudW1iZXIgb2YgVGVsZWdyYW0gU3RhcnMgdGhhdCBtdXN0IGJlIHBhaWQgdG8gYnV5IGFjY2VzcyB0byB0aGUgbWVkaWFcbiAgICAgKiBAcGFyYW0gbWVkaWEgQW4gYXJyYXkgZGVzY3JpYmluZyB0aGUgbWVkaWEgdG8gYmUgc2VudDsgdXAgdG8gMTAgaXRlbXNcbiAgICAgKiBAcGFyYW0gb3RoZXIgT3B0aW9uYWwgcmVtYWluaW5nIHBhcmFtZXRlcnMsIGNvbmZlciB0aGUgb2ZmaWNpYWwgcmVmZXJlbmNlIGJlbG93XG4gICAgICogQHBhcmFtIHNpZ25hbCBPcHRpb25hbCBgQWJvcnRTaWduYWxgIHRvIGNhbmNlbCB0aGUgcmVxdWVzdFxuICAgICAqXG4gICAgICogKipPZmZpY2lhbCByZWZlcmVuY2U6KiogaHR0cHM6Ly9jb3JlLnRlbGVncmFtLm9yZy9ib3RzL2FwaSNzZW5kcGFpZG1lZGlhXG4gICAgICovXG4gICAgc2VuZFBhaWRNZWRpYShcbiAgICAgICAgc3Rhcl9jb3VudDogbnVtYmVyLFxuICAgICAgICBtZWRpYTogSW5wdXRQYWlkTWVkaWFbXSxcbiAgICAgICAgb3RoZXI/OiBPdGhlcjxcInNlbmRQYWlkTWVkaWFcIiwgXCJjaGF0X2lkXCIgfCBcInN0YXJfY291bnRcIiB8IFwibWVkaWFcIj4sXG4gICAgICAgIHNpZ25hbD86IEFib3J0U2lnbmFsLFxuICAgICkge1xuICAgICAgICByZXR1cm4gdGhpcy5hcGkuc2VuZFBhaWRNZWRpYShcbiAgICAgICAgICAgIG9yVGhyb3codGhpcy5jaGF0SWQsIFwic2VuZFBhaWRNZWRpYVwiKSxcbiAgICAgICAgICAgIHN0YXJfY291bnQsXG4gICAgICAgICAgICBtZWRpYSxcbiAgICAgICAgICAgIG90aGVyLFxuICAgICAgICAgICAgc2lnbmFsLFxuICAgICAgICApO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIENvbnRleHQtYXdhcmUgYWxpYXMgZm9yIGBhcGkuc2VuZFZlbnVlYC4gVXNlIHRoaXMgbWV0aG9kIHRvIHNlbmQgaW5mb3JtYXRpb24gYWJvdXQgYSB2ZW51ZS4gT24gc3VjY2VzcywgdGhlIHNlbnQgTWVzc2FnZSBpcyByZXR1cm5lZC5cbiAgICAgKlxuICAgICAqIEBwYXJhbSBsYXRpdHVkZSBMYXRpdHVkZSBvZiB0aGUgdmVudWVcbiAgICAgKiBAcGFyYW0gbG9uZ2l0dWRlIExvbmdpdHVkZSBvZiB0aGUgdmVudWVcbiAgICAgKiBAcGFyYW0gdGl0bGUgTmFtZSBvZiB0aGUgdmVudWVcbiAgICAgKiBAcGFyYW0gYWRkcmVzcyBBZGRyZXNzIG9mIHRoZSB2ZW51ZVxuICAgICAqIEBwYXJhbSBvdGhlciBPcHRpb25hbCByZW1haW5pbmcgcGFyYW1ldGVycywgY29uZmVyIHRoZSBvZmZpY2lhbCByZWZlcmVuY2UgYmVsb3dcbiAgICAgKiBAcGFyYW0gc2lnbmFsIE9wdGlvbmFsIGBBYm9ydFNpZ25hbGAgdG8gY2FuY2VsIHRoZSByZXF1ZXN0XG4gICAgICpcbiAgICAgKiAqKk9mZmljaWFsIHJlZmVyZW5jZToqKiBodHRwczovL2NvcmUudGVsZWdyYW0ub3JnL2JvdHMvYXBpI3NlbmR2ZW51ZVxuICAgICAqL1xuICAgIHJlcGx5V2l0aFZlbnVlKFxuICAgICAgICBsYXRpdHVkZTogbnVtYmVyLFxuICAgICAgICBsb25naXR1ZGU6IG51bWJlcixcbiAgICAgICAgdGl0bGU6IHN0cmluZyxcbiAgICAgICAgYWRkcmVzczogc3RyaW5nLFxuICAgICAgICBvdGhlcj86IE90aGVyPFxuICAgICAgICAgICAgXCJzZW5kVmVudWVcIixcbiAgICAgICAgICAgIFwiY2hhdF9pZFwiIHwgXCJsYXRpdHVkZVwiIHwgXCJsb25naXR1ZGVcIiB8IFwidGl0bGVcIiB8IFwiYWRkcmVzc1wiXG4gICAgICAgID4sXG4gICAgICAgIHNpZ25hbD86IEFib3J0U2lnbmFsLFxuICAgICkge1xuICAgICAgICByZXR1cm4gdGhpcy5hcGkuc2VuZFZlbnVlKFxuICAgICAgICAgICAgb3JUaHJvdyh0aGlzLmNoYXRJZCwgXCJzZW5kVmVudWVcIiksXG4gICAgICAgICAgICBsYXRpdHVkZSxcbiAgICAgICAgICAgIGxvbmdpdHVkZSxcbiAgICAgICAgICAgIHRpdGxlLFxuICAgICAgICAgICAgYWRkcmVzcyxcbiAgICAgICAgICAgIHsgYnVzaW5lc3NfY29ubmVjdGlvbl9pZDogdGhpcy5idXNpbmVzc0Nvbm5lY3Rpb25JZCwgLi4ub3RoZXIgfSxcbiAgICAgICAgICAgIHNpZ25hbCxcbiAgICAgICAgKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBDb250ZXh0LWF3YXJlIGFsaWFzIGZvciBgYXBpLnNlbmRDb250YWN0YC4gVXNlIHRoaXMgbWV0aG9kIHRvIHNlbmQgcGhvbmUgY29udGFjdHMuIE9uIHN1Y2Nlc3MsIHRoZSBzZW50IE1lc3NhZ2UgaXMgcmV0dXJuZWQuXG4gICAgICpcbiAgICAgKiBAcGFyYW0gcGhvbmVfbnVtYmVyIENvbnRhY3QncyBwaG9uZSBudW1iZXJcbiAgICAgKiBAcGFyYW0gZmlyc3RfbmFtZSBDb250YWN0J3MgZmlyc3QgbmFtZVxuICAgICAqIEBwYXJhbSBvdGhlciBPcHRpb25hbCByZW1haW5pbmcgcGFyYW1ldGVycywgY29uZmVyIHRoZSBvZmZpY2lhbCByZWZlcmVuY2UgYmVsb3dcbiAgICAgKiBAcGFyYW0gc2lnbmFsIE9wdGlvbmFsIGBBYm9ydFNpZ25hbGAgdG8gY2FuY2VsIHRoZSByZXF1ZXN0XG4gICAgICpcbiAgICAgKiAqKk9mZmljaWFsIHJlZmVyZW5jZToqKiBodHRwczovL2NvcmUudGVsZWdyYW0ub3JnL2JvdHMvYXBpI3NlbmRjb250YWN0XG4gICAgICovXG4gICAgcmVwbHlXaXRoQ29udGFjdChcbiAgICAgICAgcGhvbmVfbnVtYmVyOiBzdHJpbmcsXG4gICAgICAgIGZpcnN0X25hbWU6IHN0cmluZyxcbiAgICAgICAgb3RoZXI/OiBPdGhlcjxcInNlbmRDb250YWN0XCIsIFwiY2hhdF9pZFwiIHwgXCJwaG9uZV9udW1iZXJcIiB8IFwiZmlyc3RfbmFtZVwiPixcbiAgICAgICAgc2lnbmFsPzogQWJvcnRTaWduYWwsXG4gICAgKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmFwaS5zZW5kQ29udGFjdChcbiAgICAgICAgICAgIG9yVGhyb3codGhpcy5jaGF0SWQsIFwic2VuZENvbnRhY3RcIiksXG4gICAgICAgICAgICBwaG9uZV9udW1iZXIsXG4gICAgICAgICAgICBmaXJzdF9uYW1lLFxuICAgICAgICAgICAgeyBidXNpbmVzc19jb25uZWN0aW9uX2lkOiB0aGlzLmJ1c2luZXNzQ29ubmVjdGlvbklkLCAuLi5vdGhlciB9LFxuICAgICAgICAgICAgc2lnbmFsLFxuICAgICAgICApO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIENvbnRleHQtYXdhcmUgYWxpYXMgZm9yIGBhcGkuc2VuZFBvbGxgLiBVc2UgdGhpcyBtZXRob2QgdG8gc2VuZCBhIG5hdGl2ZSBwb2xsLiBPbiBzdWNjZXNzLCB0aGUgc2VudCBNZXNzYWdlIGlzIHJldHVybmVkLlxuICAgICAqXG4gICAgICogQHBhcmFtIHF1ZXN0aW9uIFBvbGwgcXVlc3Rpb24sIDEtMzAwIGNoYXJhY3RlcnNcbiAgICAgKiBAcGFyYW0gb3B0aW9ucyBBIGxpc3Qgb2YgYW5zd2VyIG9wdGlvbnMsIDItMTAgc3RyaW5ncyAxLTEwMCBjaGFyYWN0ZXJzIGVhY2hcbiAgICAgKiBAcGFyYW0gb3RoZXIgT3B0aW9uYWwgcmVtYWluaW5nIHBhcmFtZXRlcnMsIGNvbmZlciB0aGUgb2ZmaWNpYWwgcmVmZXJlbmNlIGJlbG93XG4gICAgICogQHBhcmFtIHNpZ25hbCBPcHRpb25hbCBgQWJvcnRTaWduYWxgIHRvIGNhbmNlbCB0aGUgcmVxdWVzdFxuICAgICAqXG4gICAgICogKipPZmZpY2lhbCByZWZlcmVuY2U6KiogaHR0cHM6Ly9jb3JlLnRlbGVncmFtLm9yZy9ib3RzL2FwaSNzZW5kcG9sbFxuICAgICAqL1xuICAgIHJlcGx5V2l0aFBvbGwoXG4gICAgICAgIHF1ZXN0aW9uOiBzdHJpbmcsXG4gICAgICAgIG9wdGlvbnM6IElucHV0UG9sbE9wdGlvbltdLFxuICAgICAgICBvdGhlcj86IE90aGVyPFwic2VuZFBvbGxcIiwgXCJjaGF0X2lkXCIgfCBcInF1ZXN0aW9uXCIgfCBcIm9wdGlvbnNcIj4sXG4gICAgICAgIHNpZ25hbD86IEFib3J0U2lnbmFsLFxuICAgICkge1xuICAgICAgICByZXR1cm4gdGhpcy5hcGkuc2VuZFBvbGwoXG4gICAgICAgICAgICBvclRocm93KHRoaXMuY2hhdElkLCBcInNlbmRQb2xsXCIpLFxuICAgICAgICAgICAgcXVlc3Rpb24sXG4gICAgICAgICAgICBvcHRpb25zLFxuICAgICAgICAgICAgeyBidXNpbmVzc19jb25uZWN0aW9uX2lkOiB0aGlzLmJ1c2luZXNzQ29ubmVjdGlvbklkLCAuLi5vdGhlciB9LFxuICAgICAgICAgICAgc2lnbmFsLFxuICAgICAgICApO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIENvbnRleHQtYXdhcmUgYWxpYXMgZm9yIGBhcGkuc2VuZERpY2VgLiBVc2UgdGhpcyBtZXRob2QgdG8gc2VuZCBhbiBhbmltYXRlZCBlbW9qaSB0aGF0IHdpbGwgZGlzcGxheSBhIHJhbmRvbSB2YWx1ZS4gT24gc3VjY2VzcywgdGhlIHNlbnQgTWVzc2FnZSBpcyByZXR1cm5lZC5cbiAgICAgKlxuICAgICAqIEBwYXJhbSBlbW9qaSBFbW9qaSBvbiB3aGljaCB0aGUgZGljZSB0aHJvdyBhbmltYXRpb24gaXMgYmFzZWQuIEN1cnJlbnRseSwgbXVzdCBiZSBvbmUgb2Yg4oCc8J+OsuKAnSwg4oCc8J+Or+KAnSwg4oCc8J+PgOKAnSwg4oCc4pq94oCdLCBvciDigJzwn46w4oCdLiBEaWNlIGNhbiBoYXZlIHZhbHVlcyAxLTYgZm9yIOKAnPCfjrLigJ0gYW5kIOKAnPCfjq/igJ0sIHZhbHVlcyAxLTUgZm9yIOKAnPCfj4DigJ0gYW5kIOKAnOKaveKAnSwgYW5kIHZhbHVlcyAxLTY0IGZvciDigJzwn46w4oCdLiBEZWZhdWx0cyB0byDigJzwn46y4oCdXG4gICAgICogQHBhcmFtIG90aGVyIE9wdGlvbmFsIHJlbWFpbmluZyBwYXJhbWV0ZXJzLCBjb25mZXIgdGhlIG9mZmljaWFsIHJlZmVyZW5jZSBiZWxvd1xuICAgICAqIEBwYXJhbSBzaWduYWwgT3B0aW9uYWwgYEFib3J0U2lnbmFsYCB0byBjYW5jZWwgdGhlIHJlcXVlc3RcbiAgICAgKlxuICAgICAqICoqT2ZmaWNpYWwgcmVmZXJlbmNlOioqIGh0dHBzOi8vY29yZS50ZWxlZ3JhbS5vcmcvYm90cy9hcGkjc2VuZGRpY2VcbiAgICAgKi9cbiAgICByZXBseVdpdGhEaWNlKFxuICAgICAgICBlbW9qaTogc3RyaW5nLFxuICAgICAgICBvdGhlcj86IE90aGVyPFwic2VuZERpY2VcIiwgXCJjaGF0X2lkXCIgfCBcImVtb2ppXCI+LFxuICAgICAgICBzaWduYWw/OiBBYm9ydFNpZ25hbCxcbiAgICApIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuYXBpLnNlbmREaWNlKFxuICAgICAgICAgICAgb3JUaHJvdyh0aGlzLmNoYXRJZCwgXCJzZW5kRGljZVwiKSxcbiAgICAgICAgICAgIGVtb2ppLFxuICAgICAgICAgICAgeyBidXNpbmVzc19jb25uZWN0aW9uX2lkOiB0aGlzLmJ1c2luZXNzQ29ubmVjdGlvbklkLCAuLi5vdGhlciB9LFxuICAgICAgICAgICAgc2lnbmFsLFxuICAgICAgICApO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIENvbnRleHQtYXdhcmUgYWxpYXMgZm9yIGBhcGkuc2VuZENoYXRBY3Rpb25gLiBVc2UgdGhpcyBtZXRob2Qgd2hlbiB5b3UgbmVlZCB0byB0ZWxsIHRoZSB1c2VyIHRoYXQgc29tZXRoaW5nIGlzIGhhcHBlbmluZyBvbiB0aGUgYm90J3Mgc2lkZS4gVGhlIHN0YXR1cyBpcyBzZXQgZm9yIDUgc2Vjb25kcyBvciBsZXNzICh3aGVuIGEgbWVzc2FnZSBhcnJpdmVzIGZyb20geW91ciBib3QsIFRlbGVncmFtIGNsaWVudHMgY2xlYXIgaXRzIHR5cGluZyBzdGF0dXMpLiBSZXR1cm5zIFRydWUgb24gc3VjY2Vzcy5cbiAgICAgKlxuICAgICAqIEV4YW1wbGU6IFRoZSBJbWFnZUJvdCBuZWVkcyBzb21lIHRpbWUgdG8gcHJvY2VzcyBhIHJlcXVlc3QgYW5kIHVwbG9hZCB0aGUgaW1hZ2UuIEluc3RlYWQgb2Ygc2VuZGluZyBhIHRleHQgbWVzc2FnZSBhbG9uZyB0aGUgbGluZXMgb2Yg4oCcUmV0cmlldmluZyBpbWFnZSwgcGxlYXNlIHdhaXTigKbigJ0sIHRoZSBib3QgbWF5IHVzZSBzZW5kQ2hhdEFjdGlvbiB3aXRoIGFjdGlvbiA9IHVwbG9hZF9waG90by4gVGhlIHVzZXIgd2lsbCBzZWUgYSDigJxzZW5kaW5nIHBob3Rv4oCdIHN0YXR1cyBmb3IgdGhlIGJvdC5cbiAgICAgKlxuICAgICAqIFdlIG9ubHkgcmVjb21tZW5kIHVzaW5nIHRoaXMgbWV0aG9kIHdoZW4gYSByZXNwb25zZSBmcm9tIHRoZSBib3Qgd2lsbCB0YWtlIGEgbm90aWNlYWJsZSBhbW91bnQgb2YgdGltZSB0byBhcnJpdmUuXG4gICAgICpcbiAgICAgKiBAcGFyYW0gYWN0aW9uIFR5cGUgb2YgYWN0aW9uIHRvIGJyb2FkY2FzdC4gQ2hvb3NlIG9uZSwgZGVwZW5kaW5nIG9uIHdoYXQgdGhlIHVzZXIgaXMgYWJvdXQgdG8gcmVjZWl2ZTogdHlwaW5nIGZvciB0ZXh0IG1lc3NhZ2VzLCB1cGxvYWRfcGhvdG8gZm9yIHBob3RvcywgcmVjb3JkX3ZpZGVvIG9yIHVwbG9hZF92aWRlbyBmb3IgdmlkZW9zLCByZWNvcmRfdm9pY2Ugb3IgdXBsb2FkX3ZvaWNlIGZvciB2b2ljZSBub3RlcywgdXBsb2FkX2RvY3VtZW50IGZvciBnZW5lcmFsIGZpbGVzLCBjaG9vc2Vfc3RpY2tlciBmb3Igc3RpY2tlcnMsIGZpbmRfbG9jYXRpb24gZm9yIGxvY2F0aW9uIGRhdGEsIHJlY29yZF92aWRlb19ub3RlIG9yIHVwbG9hZF92aWRlb19ub3RlIGZvciB2aWRlbyBub3Rlcy5cbiAgICAgKiBAcGFyYW0gb3RoZXIgT3B0aW9uYWwgcmVtYWluaW5nIHBhcmFtZXRlcnMsIGNvbmZlciB0aGUgb2ZmaWNpYWwgcmVmZXJlbmNlIGJlbG93XG4gICAgICogQHBhcmFtIHNpZ25hbCBPcHRpb25hbCBgQWJvcnRTaWduYWxgIHRvIGNhbmNlbCB0aGUgcmVxdWVzdFxuICAgICAqXG4gICAgICogKipPZmZpY2lhbCByZWZlcmVuY2U6KiogaHR0cHM6Ly9jb3JlLnRlbGVncmFtLm9yZy9ib3RzL2FwaSNzZW5kY2hhdGFjdGlvblxuICAgICAqL1xuICAgIHJlcGx5V2l0aENoYXRBY3Rpb24oXG4gICAgICAgIGFjdGlvbjpcbiAgICAgICAgICAgIHwgXCJ0eXBpbmdcIlxuICAgICAgICAgICAgfCBcInVwbG9hZF9waG90b1wiXG4gICAgICAgICAgICB8IFwicmVjb3JkX3ZpZGVvXCJcbiAgICAgICAgICAgIHwgXCJ1cGxvYWRfdmlkZW9cIlxuICAgICAgICAgICAgfCBcInJlY29yZF92b2ljZVwiXG4gICAgICAgICAgICB8IFwidXBsb2FkX3ZvaWNlXCJcbiAgICAgICAgICAgIHwgXCJ1cGxvYWRfZG9jdW1lbnRcIlxuICAgICAgICAgICAgfCBcImNob29zZV9zdGlja2VyXCJcbiAgICAgICAgICAgIHwgXCJmaW5kX2xvY2F0aW9uXCJcbiAgICAgICAgICAgIHwgXCJyZWNvcmRfdmlkZW9fbm90ZVwiXG4gICAgICAgICAgICB8IFwidXBsb2FkX3ZpZGVvX25vdGVcIixcbiAgICAgICAgb3RoZXI/OiBPdGhlcjxcInNlbmRDaGF0QWN0aW9uXCIsIFwiY2hhdF9pZFwiIHwgXCJhY3Rpb25cIj4sXG4gICAgICAgIHNpZ25hbD86IEFib3J0U2lnbmFsLFxuICAgICkge1xuICAgICAgICByZXR1cm4gdGhpcy5hcGkuc2VuZENoYXRBY3Rpb24oXG4gICAgICAgICAgICBvclRocm93KHRoaXMuY2hhdElkLCBcInNlbmRDaGF0QWN0aW9uXCIpLFxuICAgICAgICAgICAgYWN0aW9uLFxuICAgICAgICAgICAgeyBidXNpbmVzc19jb25uZWN0aW9uX2lkOiB0aGlzLmJ1c2luZXNzQ29ubmVjdGlvbklkLCAuLi5vdGhlciB9LFxuICAgICAgICAgICAgc2lnbmFsLFxuICAgICAgICApO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIENvbnRleHQtYXdhcmUgYWxpYXMgZm9yIGBhcGkuc2V0TWVzc2FnZVJlYWN0aW9uYC4gVXNlIHRoaXMgbWV0aG9kIHRvIGNoYW5nZSB0aGUgY2hvc2VuIHJlYWN0aW9ucyBvbiBhIG1lc3NhZ2UuIFNlcnZpY2UgbWVzc2FnZXMgY2FuJ3QgYmUgcmVhY3RlZCB0by4gQXV0b21hdGljYWxseSBmb3J3YXJkZWQgbWVzc2FnZXMgZnJvbSBhIGNoYW5uZWwgdG8gaXRzIGRpc2N1c3Npb24gZ3JvdXAgaGF2ZSB0aGUgc2FtZSBhdmFpbGFibGUgcmVhY3Rpb25zIGFzIG1lc3NhZ2VzIGluIHRoZSBjaGFubmVsLiBJbiBhbGJ1bXMsIGJvdHMgbXVzdCByZWFjdCB0byB0aGUgZmlyc3QgbWVzc2FnZS4gUmV0dXJucyBUcnVlIG9uIHN1Y2Nlc3MuXG4gICAgICpcbiAgICAgKiBAcGFyYW0gcmVhY3Rpb24gQSBsaXN0IG9mIHJlYWN0aW9uIHR5cGVzIHRvIHNldCBvbiB0aGUgbWVzc2FnZS4gQ3VycmVudGx5LCBhcyBub24tcHJlbWl1bSB1c2VycywgYm90cyBjYW4gc2V0IHVwIHRvIG9uZSByZWFjdGlvbiBwZXIgbWVzc2FnZS4gQSBjdXN0b20gZW1vamkgcmVhY3Rpb24gY2FuIGJlIHVzZWQgaWYgaXQgaXMgZWl0aGVyIGFscmVhZHkgcHJlc2VudCBvbiB0aGUgbWVzc2FnZSBvciBleHBsaWNpdGx5IGFsbG93ZWQgYnkgY2hhdCBhZG1pbmlzdHJhdG9ycy5cbiAgICAgKiBAcGFyYW0gb3RoZXIgT3B0aW9uYWwgcmVtYWluaW5nIHBhcmFtZXRlcnMsIGNvbmZlciB0aGUgb2ZmaWNpYWwgcmVmZXJlbmNlIGJlbG93XG4gICAgICogQHBhcmFtIHNpZ25hbCBPcHRpb25hbCBgQWJvcnRTaWduYWxgIHRvIGNhbmNlbCB0aGUgcmVxdWVzdFxuICAgICAqXG4gICAgICogKipPZmZpY2lhbCByZWZlcmVuY2U6KiogaHR0cHM6Ly9jb3JlLnRlbGVncmFtLm9yZy9ib3RzL2FwaSNzZXRtZXNzYWdlcmVhY3Rpb25cbiAgICAgKi9cbiAgICByZWFjdChcbiAgICAgICAgcmVhY3Rpb246IE1heWJlQXJyYXk8UmVhY3Rpb25UeXBlRW1vamlbXCJlbW9qaVwiXSB8IFJlYWN0aW9uVHlwZT4sXG4gICAgICAgIG90aGVyPzogT3RoZXI8XG4gICAgICAgICAgICBcInNldE1lc3NhZ2VSZWFjdGlvblwiLFxuICAgICAgICAgICAgXCJjaGF0X2lkXCIgfCBcIm1lc3NhZ2VfaWRcIiB8IFwicmVhY3Rpb25cIlxuICAgICAgICA+LFxuICAgICAgICBzaWduYWw/OiBBYm9ydFNpZ25hbCxcbiAgICApIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuYXBpLnNldE1lc3NhZ2VSZWFjdGlvbihcbiAgICAgICAgICAgIG9yVGhyb3codGhpcy5jaGF0SWQsIFwic2V0TWVzc2FnZVJlYWN0aW9uXCIpLFxuICAgICAgICAgICAgb3JUaHJvdyh0aGlzLm1zZ0lkLCBcInNldE1lc3NhZ2VSZWFjdGlvblwiKSxcbiAgICAgICAgICAgIHR5cGVvZiByZWFjdGlvbiA9PT0gXCJzdHJpbmdcIlxuICAgICAgICAgICAgICAgID8gW3sgdHlwZTogXCJlbW9qaVwiLCBlbW9qaTogcmVhY3Rpb24gfV1cbiAgICAgICAgICAgICAgICA6IChBcnJheS5pc0FycmF5KHJlYWN0aW9uKSA/IHJlYWN0aW9uIDogW3JlYWN0aW9uXSlcbiAgICAgICAgICAgICAgICAgICAgLm1hcCgoZW1vamkpID0+XG4gICAgICAgICAgICAgICAgICAgICAgICB0eXBlb2YgZW1vamkgPT09IFwic3RyaW5nXCJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA/IHsgdHlwZTogXCJlbW9qaVwiLCBlbW9qaSB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgOiBlbW9qaVxuICAgICAgICAgICAgICAgICAgICApLFxuICAgICAgICAgICAgb3RoZXIsXG4gICAgICAgICAgICBzaWduYWwsXG4gICAgICAgICk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQ29udGV4dC1hd2FyZSBhbGlhcyBmb3IgYGFwaS5nZXRVc2VyUHJvZmlsZVBob3Rvc2AuIFVzZSB0aGlzIG1ldGhvZCB0byBnZXQgYSBsaXN0IG9mIHByb2ZpbGUgcGljdHVyZXMgZm9yIGEgdXNlci4gUmV0dXJucyBhIFVzZXJQcm9maWxlUGhvdG9zIG9iamVjdC5cbiAgICAgKlxuICAgICAqIEBwYXJhbSB1c2VyX2lkIFVuaXF1ZSBpZGVudGlmaWVyIG9mIHRoZSB0YXJnZXQgdXNlclxuICAgICAqIEBwYXJhbSBvdGhlciBPcHRpb25hbCByZW1haW5pbmcgcGFyYW1ldGVycywgY29uZmVyIHRoZSBvZmZpY2lhbCByZWZlcmVuY2UgYmVsb3dcbiAgICAgKiBAcGFyYW0gc2lnbmFsIE9wdGlvbmFsIGBBYm9ydFNpZ25hbGAgdG8gY2FuY2VsIHRoZSByZXF1ZXN0XG4gICAgICpcbiAgICAgKiAqKk9mZmljaWFsIHJlZmVyZW5jZToqKiBodHRwczovL2NvcmUudGVsZWdyYW0ub3JnL2JvdHMvYXBpI2dldHVzZXJwcm9maWxlcGhvdG9zXG4gICAgICovXG4gICAgZ2V0VXNlclByb2ZpbGVQaG90b3MoXG4gICAgICAgIG90aGVyPzogT3RoZXI8XCJnZXRVc2VyUHJvZmlsZVBob3Rvc1wiLCBcInVzZXJfaWRcIj4sXG4gICAgICAgIHNpZ25hbD86IEFib3J0U2lnbmFsLFxuICAgICkge1xuICAgICAgICByZXR1cm4gdGhpcy5hcGkuZ2V0VXNlclByb2ZpbGVQaG90b3MoXG4gICAgICAgICAgICBvclRocm93KHRoaXMuZnJvbSwgXCJnZXRVc2VyUHJvZmlsZVBob3Rvc1wiKS5pZCxcbiAgICAgICAgICAgIG90aGVyLFxuICAgICAgICAgICAgc2lnbmFsLFxuICAgICAgICApO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIENvbnRleHQtYXdhcmUgYWxpYXMgZm9yIGBhcGkuZ2V0VXNlckNoYXRCb29zdHNgLiBVc2UgdGhpcyBtZXRob2QgdG8gZ2V0IHRoZSBsaXN0IG9mIGJvb3N0cyBhZGRlZCB0byBhIGNoYXQgYnkgYSB1c2VyLiBSZXF1aXJlcyBhZG1pbmlzdHJhdG9yIHJpZ2h0cyBpbiB0aGUgY2hhdC4gUmV0dXJucyBhIFVzZXJDaGF0Qm9vc3RzIG9iamVjdC5cbiAgICAgKlxuICAgICAqIEBwYXJhbSBjaGF0X2lkIFVuaXF1ZSBpZGVudGlmaWVyIGZvciB0aGUgY2hhdCBvciB1c2VybmFtZSBvZiB0aGUgY2hhbm5lbCAoaW4gdGhlIGZvcm1hdCBAY2hhbm5lbHVzZXJuYW1lKVxuICAgICAqIEBwYXJhbSBzaWduYWwgT3B0aW9uYWwgYEFib3J0U2lnbmFsYCB0byBjYW5jZWwgdGhlIHJlcXVlc3RcbiAgICAgKlxuICAgICAqICoqT2ZmaWNpYWwgcmVmZXJlbmNlOioqIGh0dHBzOi8vY29yZS50ZWxlZ3JhbS5vcmcvYm90cy9hcGkjZ2V0dXNlcmNoYXRib29zdHNcbiAgICAgKi9cbiAgICBnZXRVc2VyQ2hhdEJvb3N0cyhjaGF0X2lkOiBudW1iZXIgfCBzdHJpbmcsIHNpZ25hbD86IEFib3J0U2lnbmFsKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmFwaS5nZXRVc2VyQ2hhdEJvb3N0cyhcbiAgICAgICAgICAgIGNoYXRfaWQsXG4gICAgICAgICAgICBvclRocm93KHRoaXMuZnJvbSwgXCJnZXRVc2VyQ2hhdEJvb3N0c1wiKS5pZCxcbiAgICAgICAgICAgIHNpZ25hbCxcbiAgICAgICAgKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiAgQ29udGV4dC1hd2FyZSBhbGlhcyBmb3IgYGFwaS5nZXRCdXNpbmVzc0Nvbm5lY3Rpb25gLiBVc2UgdGhpcyBtZXRob2QgdG8gZ2V0IGluZm9ybWF0aW9uIGFib3V0IHRoZSBjb25uZWN0aW9uIG9mIHRoZSBib3Qgd2l0aCBhIGJ1c2luZXNzIGFjY291bnQuIFJldHVybnMgYSBCdXNpbmVzc0Nvbm5lY3Rpb24gb2JqZWN0IG9uIHN1Y2Nlc3MuXG4gICAgICogQHBhcmFtIHNpZ25hbCBPcHRpb25hbCBgQWJvcnRTaWduYWxgIHRvIGNhbmNlbCB0aGUgcmVxdWVzdFxuICAgICAqXG4gICAgICogKipPZmZpY2lhbCByZWZlcmVuY2U6KiogaHR0cHM6Ly9jb3JlLnRlbGVncmFtLm9yZy9ib3RzL2FwaSNnZXRidXNpbmVzc2Nvbm5lY3Rpb25cbiAgICAgKi9cbiAgICBnZXRCdXNpbmVzc0Nvbm5lY3Rpb24oc2lnbmFsPzogQWJvcnRTaWduYWwpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuYXBpLmdldEJ1c2luZXNzQ29ubmVjdGlvbihcbiAgICAgICAgICAgIG9yVGhyb3codGhpcy5idXNpbmVzc0Nvbm5lY3Rpb25JZCwgXCJnZXRCdXNpbmVzc0Nvbm5lY3Rpb25cIiksXG4gICAgICAgICAgICBzaWduYWwsXG4gICAgICAgICk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQ29udGV4dC1hd2FyZSBhbGlhcyBmb3IgYGFwaS5nZXRGaWxlYC4gVXNlIHRoaXMgbWV0aG9kIHRvIGdldCBiYXNpYyBpbmZvIGFib3V0IGEgZmlsZSBhbmQgcHJlcGFyZSBpdCBmb3IgZG93bmxvYWRpbmcuIEZvciB0aGUgbW9tZW50LCBib3RzIGNhbiBkb3dubG9hZCBmaWxlcyBvZiB1cCB0byAyME1CIGluIHNpemUuIE9uIHN1Y2Nlc3MsIGEgRmlsZSBvYmplY3QgaXMgcmV0dXJuZWQuIFRoZSBmaWxlIGNhbiB0aGVuIGJlIGRvd25sb2FkZWQgdmlhIHRoZSBsaW5rIGh0dHBzOi8vYXBpLnRlbGVncmFtLm9yZy9maWxlL2JvdDx0b2tlbj4vPGZpbGVfcGF0aD4sIHdoZXJlIDxmaWxlX3BhdGg+IGlzIHRha2VuIGZyb20gdGhlIHJlc3BvbnNlLiBJdCBpcyBndWFyYW50ZWVkIHRoYXQgdGhlIGxpbmsgd2lsbCBiZSB2YWxpZCBmb3IgYXQgbGVhc3QgMSBob3VyLiBXaGVuIHRoZSBsaW5rIGV4cGlyZXMsIGEgbmV3IG9uZSBjYW4gYmUgcmVxdWVzdGVkIGJ5IGNhbGxpbmcgZ2V0RmlsZSBhZ2Fpbi5cbiAgICAgKlxuICAgICAqIE5vdGU6IFRoaXMgZnVuY3Rpb24gbWF5IG5vdCBwcmVzZXJ2ZSB0aGUgb3JpZ2luYWwgZmlsZSBuYW1lIGFuZCBNSU1FIHR5cGUuIFlvdSBzaG91bGQgc2F2ZSB0aGUgZmlsZSdzIE1JTUUgdHlwZSBhbmQgbmFtZSAoaWYgYXZhaWxhYmxlKSB3aGVuIHRoZSBGaWxlIG9iamVjdCBpcyByZWNlaXZlZC5cbiAgICAgKlxuICAgICAqIEBwYXJhbSBzaWduYWwgT3B0aW9uYWwgYEFib3J0U2lnbmFsYCB0byBjYW5jZWwgdGhlIHJlcXVlc3RcbiAgICAgKlxuICAgICAqICoqT2ZmaWNpYWwgcmVmZXJlbmNlOioqIGh0dHBzOi8vY29yZS50ZWxlZ3JhbS5vcmcvYm90cy9hcGkjZ2V0ZmlsZVxuICAgICAqL1xuICAgIGdldEZpbGUoc2lnbmFsPzogQWJvcnRTaWduYWwpIHtcbiAgICAgICAgY29uc3QgbSA9IG9yVGhyb3codGhpcy5tc2csIFwiZ2V0RmlsZVwiKTtcbiAgICAgICAgY29uc3QgZmlsZSA9IG0ucGhvdG8gIT09IHVuZGVmaW5lZFxuICAgICAgICAgICAgPyBtLnBob3RvW20ucGhvdG8ubGVuZ3RoIC0gMV1cbiAgICAgICAgICAgIDogbS5hbmltYXRpb24gPz9cbiAgICAgICAgICAgICAgICBtLmF1ZGlvID8/XG4gICAgICAgICAgICAgICAgbS5kb2N1bWVudCA/P1xuICAgICAgICAgICAgICAgIG0udmlkZW8gPz9cbiAgICAgICAgICAgICAgICBtLnZpZGVvX25vdGUgPz9cbiAgICAgICAgICAgICAgICBtLnZvaWNlID8/XG4gICAgICAgICAgICAgICAgbS5zdGlja2VyO1xuICAgICAgICByZXR1cm4gdGhpcy5hcGkuZ2V0RmlsZShvclRocm93KGZpbGUsIFwiZ2V0RmlsZVwiKS5maWxlX2lkLCBzaWduYWwpO1xuICAgIH1cblxuICAgIC8qKiBAZGVwcmVjYXRlZCBVc2UgYGJhbkF1dGhvcmAgaW5zdGVhZC4gKi9cbiAgICBraWNrQXV0aG9yKC4uLmFyZ3M6IFBhcmFtZXRlcnM8Q29udGV4dFtcImJhbkF1dGhvclwiXT4pIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuYmFuQXV0aG9yKC4uLmFyZ3MpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIENvbnRleHQtYXdhcmUgYWxpYXMgZm9yIGBhcGkuYmFuQ2hhdE1lbWJlcmAuIFVzZSB0aGlzIG1ldGhvZCB0byBiYW4gYSB1c2VyIGluIGEgZ3JvdXAsIGEgc3VwZXJncm91cCBvciBhIGNoYW5uZWwuIEluIHRoZSBjYXNlIG9mIHN1cGVyZ3JvdXBzIGFuZCBjaGFubmVscywgdGhlIHVzZXIgd2lsbCBub3QgYmUgYWJsZSB0byByZXR1cm4gdG8gdGhlIGNoYXQgb24gdGhlaXIgb3duIHVzaW5nIGludml0ZSBsaW5rcywgZXRjLiwgdW5sZXNzIHVuYmFubmVkIGZpcnN0LiBUaGUgYm90IG11c3QgYmUgYW4gYWRtaW5pc3RyYXRvciBpbiB0aGUgY2hhdCBmb3IgdGhpcyB0byB3b3JrIGFuZCBtdXN0IGhhdmUgdGhlIGFwcHJvcHJpYXRlIGFkbWluaXN0cmF0b3IgcmlnaHRzLiBSZXR1cm5zIFRydWUgb24gc3VjY2Vzcy5cbiAgICAgKlxuICAgICAqIEBwYXJhbSBvdGhlciBPcHRpb25hbCByZW1haW5pbmcgcGFyYW1ldGVycywgY29uZmVyIHRoZSBvZmZpY2lhbCByZWZlcmVuY2UgYmVsb3dcbiAgICAgKiBAcGFyYW0gc2lnbmFsIE9wdGlvbmFsIGBBYm9ydFNpZ25hbGAgdG8gY2FuY2VsIHRoZSByZXF1ZXN0XG4gICAgICpcbiAgICAgKiAqKk9mZmljaWFsIHJlZmVyZW5jZToqKiBodHRwczovL2NvcmUudGVsZWdyYW0ub3JnL2JvdHMvYXBpI2JhbmNoYXRtZW1iZXJcbiAgICAgKi9cbiAgICBiYW5BdXRob3IoXG4gICAgICAgIG90aGVyPzogT3RoZXI8XCJiYW5DaGF0TWVtYmVyXCIsIFwiY2hhdF9pZFwiIHwgXCJ1c2VyX2lkXCI+LFxuICAgICAgICBzaWduYWw/OiBBYm9ydFNpZ25hbCxcbiAgICApIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuYXBpLmJhbkNoYXRNZW1iZXIoXG4gICAgICAgICAgICBvclRocm93KHRoaXMuY2hhdElkLCBcImJhbkF1dGhvclwiKSxcbiAgICAgICAgICAgIG9yVGhyb3codGhpcy5mcm9tLCBcImJhbkF1dGhvclwiKS5pZCxcbiAgICAgICAgICAgIG90aGVyLFxuICAgICAgICAgICAgc2lnbmFsLFxuICAgICAgICApO1xuICAgIH1cblxuICAgIC8qKiBAZGVwcmVjYXRlZCBVc2UgYGJhbkNoYXRNZW1iZXJgIGluc3RlYWQuICovXG4gICAga2lja0NoYXRNZW1iZXIoLi4uYXJnczogUGFyYW1ldGVyczxDb250ZXh0W1wiYmFuQ2hhdE1lbWJlclwiXT4pIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuYmFuQ2hhdE1lbWJlciguLi5hcmdzKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBDb250ZXh0LWF3YXJlIGFsaWFzIGZvciBgYXBpLmJhbkNoYXRNZW1iZXJgLiBVc2UgdGhpcyBtZXRob2QgdG8gYmFuIGEgdXNlciBpbiBhIGdyb3VwLCBhIHN1cGVyZ3JvdXAgb3IgYSBjaGFubmVsLiBJbiB0aGUgY2FzZSBvZiBzdXBlcmdyb3VwcyBhbmQgY2hhbm5lbHMsIHRoZSB1c2VyIHdpbGwgbm90IGJlIGFibGUgdG8gcmV0dXJuIHRvIHRoZSBjaGF0IG9uIHRoZWlyIG93biB1c2luZyBpbnZpdGUgbGlua3MsIGV0Yy4sIHVubGVzcyB1bmJhbm5lZCBmaXJzdC4gVGhlIGJvdCBtdXN0IGJlIGFuIGFkbWluaXN0cmF0b3IgaW4gdGhlIGNoYXQgZm9yIHRoaXMgdG8gd29yayBhbmQgbXVzdCBoYXZlIHRoZSBhcHByb3ByaWF0ZSBhZG1pbmlzdHJhdG9yIHJpZ2h0cy4gUmV0dXJucyBUcnVlIG9uIHN1Y2Nlc3MuXG4gICAgICpcbiAgICAgKiBAcGFyYW0gdXNlcl9pZCBVbmlxdWUgaWRlbnRpZmllciBvZiB0aGUgdGFyZ2V0IHVzZXJcbiAgICAgKiBAcGFyYW0gb3RoZXIgT3B0aW9uYWwgcmVtYWluaW5nIHBhcmFtZXRlcnMsIGNvbmZlciB0aGUgb2ZmaWNpYWwgcmVmZXJlbmNlIGJlbG93XG4gICAgICogQHBhcmFtIHNpZ25hbCBPcHRpb25hbCBgQWJvcnRTaWduYWxgIHRvIGNhbmNlbCB0aGUgcmVxdWVzdFxuICAgICAqXG4gICAgICogKipPZmZpY2lhbCByZWZlcmVuY2U6KiogaHR0cHM6Ly9jb3JlLnRlbGVncmFtLm9yZy9ib3RzL2FwaSNiYW5jaGF0bWVtYmVyXG4gICAgICovXG4gICAgYmFuQ2hhdE1lbWJlcihcbiAgICAgICAgdXNlcl9pZDogbnVtYmVyLFxuICAgICAgICBvdGhlcj86IE90aGVyPFwiYmFuQ2hhdE1lbWJlclwiLCBcImNoYXRfaWRcIiB8IFwidXNlcl9pZFwiPixcbiAgICAgICAgc2lnbmFsPzogQWJvcnRTaWduYWwsXG4gICAgKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmFwaS5iYW5DaGF0TWVtYmVyKFxuICAgICAgICAgICAgb3JUaHJvdyh0aGlzLmNoYXRJZCwgXCJiYW5DaGF0TWVtYmVyXCIpLFxuICAgICAgICAgICAgdXNlcl9pZCxcbiAgICAgICAgICAgIG90aGVyLFxuICAgICAgICAgICAgc2lnbmFsLFxuICAgICAgICApO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIENvbnRleHQtYXdhcmUgYWxpYXMgZm9yIGBhcGkudW5iYW5DaGF0TWVtYmVyYC4gVXNlIHRoaXMgbWV0aG9kIHRvIHVuYmFuIGEgcHJldmlvdXNseSBiYW5uZWQgdXNlciBpbiBhIHN1cGVyZ3JvdXAgb3IgY2hhbm5lbC4gVGhlIHVzZXIgd2lsbCBub3QgcmV0dXJuIHRvIHRoZSBncm91cCBvciBjaGFubmVsIGF1dG9tYXRpY2FsbHksIGJ1dCB3aWxsIGJlIGFibGUgdG8gam9pbiB2aWEgbGluaywgZXRjLiBUaGUgYm90IG11c3QgYmUgYW4gYWRtaW5pc3RyYXRvciBmb3IgdGhpcyB0byB3b3JrLiBCeSBkZWZhdWx0LCB0aGlzIG1ldGhvZCBndWFyYW50ZWVzIHRoYXQgYWZ0ZXIgdGhlIGNhbGwgdGhlIHVzZXIgaXMgbm90IGEgbWVtYmVyIG9mIHRoZSBjaGF0LCBidXQgd2lsbCBiZSBhYmxlIHRvIGpvaW4gaXQuIFNvIGlmIHRoZSB1c2VyIGlzIGEgbWVtYmVyIG9mIHRoZSBjaGF0IHRoZXkgd2lsbCBhbHNvIGJlIHJlbW92ZWQgZnJvbSB0aGUgY2hhdC4gSWYgeW91IGRvbid0IHdhbnQgdGhpcywgdXNlIHRoZSBwYXJhbWV0ZXIgb25seV9pZl9iYW5uZWQuIFJldHVybnMgVHJ1ZSBvbiBzdWNjZXNzLlxuICAgICAqXG4gICAgICogQHBhcmFtIHVzZXJfaWQgVW5pcXVlIGlkZW50aWZpZXIgb2YgdGhlIHRhcmdldCB1c2VyXG4gICAgICogQHBhcmFtIG90aGVyIE9wdGlvbmFsIHJlbWFpbmluZyBwYXJhbWV0ZXJzLCBjb25mZXIgdGhlIG9mZmljaWFsIHJlZmVyZW5jZSBiZWxvd1xuICAgICAqIEBwYXJhbSBzaWduYWwgT3B0aW9uYWwgYEFib3J0U2lnbmFsYCB0byBjYW5jZWwgdGhlIHJlcXVlc3RcbiAgICAgKlxuICAgICAqICoqT2ZmaWNpYWwgcmVmZXJlbmNlOioqIGh0dHBzOi8vY29yZS50ZWxlZ3JhbS5vcmcvYm90cy9hcGkjdW5iYW5jaGF0bWVtYmVyXG4gICAgICovXG4gICAgdW5iYW5DaGF0TWVtYmVyKFxuICAgICAgICB1c2VyX2lkOiBudW1iZXIsXG4gICAgICAgIG90aGVyPzogT3RoZXI8XCJ1bmJhbkNoYXRNZW1iZXJcIiwgXCJjaGF0X2lkXCIgfCBcInVzZXJfaWRcIj4sXG4gICAgICAgIHNpZ25hbD86IEFib3J0U2lnbmFsLFxuICAgICkge1xuICAgICAgICByZXR1cm4gdGhpcy5hcGkudW5iYW5DaGF0TWVtYmVyKFxuICAgICAgICAgICAgb3JUaHJvdyh0aGlzLmNoYXRJZCwgXCJ1bmJhbkNoYXRNZW1iZXJcIiksXG4gICAgICAgICAgICB1c2VyX2lkLFxuICAgICAgICAgICAgb3RoZXIsXG4gICAgICAgICAgICBzaWduYWwsXG4gICAgICAgICk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQ29udGV4dC1hd2FyZSBhbGlhcyBmb3IgYGFwaS5yZXN0cmljdENoYXRNZW1iZXJgLiBVc2UgdGhpcyBtZXRob2QgdG8gcmVzdHJpY3QgYSB1c2VyIGluIGEgc3VwZXJncm91cC4gVGhlIGJvdCBtdXN0IGJlIGFuIGFkbWluaXN0cmF0b3IgaW4gdGhlIHN1cGVyZ3JvdXAgZm9yIHRoaXMgdG8gd29yayBhbmQgbXVzdCBoYXZlIHRoZSBhcHByb3ByaWF0ZSBhZG1pbmlzdHJhdG9yIHJpZ2h0cy4gUGFzcyBUcnVlIGZvciBhbGwgcGVybWlzc2lvbnMgdG8gbGlmdCByZXN0cmljdGlvbnMgZnJvbSBhIHVzZXIuIFJldHVybnMgVHJ1ZSBvbiBzdWNjZXNzLlxuICAgICAqXG4gICAgICogQHBhcmFtIHBlcm1pc3Npb25zIEFuIG9iamVjdCBmb3IgbmV3IHVzZXIgcGVybWlzc2lvbnNcbiAgICAgKiBAcGFyYW0gb3RoZXIgT3B0aW9uYWwgcmVtYWluaW5nIHBhcmFtZXRlcnMsIGNvbmZlciB0aGUgb2ZmaWNpYWwgcmVmZXJlbmNlIGJlbG93XG4gICAgICogQHBhcmFtIHNpZ25hbCBPcHRpb25hbCBgQWJvcnRTaWduYWxgIHRvIGNhbmNlbCB0aGUgcmVxdWVzdFxuICAgICAqXG4gICAgICogKipPZmZpY2lhbCByZWZlcmVuY2U6KiogaHR0cHM6Ly9jb3JlLnRlbGVncmFtLm9yZy9ib3RzL2FwaSNyZXN0cmljdGNoYXRtZW1iZXJcbiAgICAgKi9cbiAgICByZXN0cmljdEF1dGhvcihcbiAgICAgICAgcGVybWlzc2lvbnM6IENoYXRQZXJtaXNzaW9ucyxcbiAgICAgICAgb3RoZXI/OiBPdGhlcjxcbiAgICAgICAgICAgIFwicmVzdHJpY3RDaGF0TWVtYmVyXCIsXG4gICAgICAgICAgICBcImNoYXRfaWRcIiB8IFwidXNlcl9pZFwiIHwgXCJwZXJtaXNzaW9uc1wiXG4gICAgICAgID4sXG4gICAgICAgIHNpZ25hbD86IEFib3J0U2lnbmFsLFxuICAgICkge1xuICAgICAgICByZXR1cm4gdGhpcy5hcGkucmVzdHJpY3RDaGF0TWVtYmVyKFxuICAgICAgICAgICAgb3JUaHJvdyh0aGlzLmNoYXRJZCwgXCJyZXN0cmljdEF1dGhvclwiKSxcbiAgICAgICAgICAgIG9yVGhyb3codGhpcy5mcm9tLCBcInJlc3RyaWN0QXV0aG9yXCIpLmlkLFxuICAgICAgICAgICAgcGVybWlzc2lvbnMsXG4gICAgICAgICAgICBvdGhlcixcbiAgICAgICAgICAgIHNpZ25hbCxcbiAgICAgICAgKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBDb250ZXh0LWF3YXJlIGFsaWFzIGZvciBgYXBpLnJlc3RyaWN0Q2hhdE1lbWJlcmAuIFVzZSB0aGlzIG1ldGhvZCB0byByZXN0cmljdCBhIHVzZXIgaW4gYSBzdXBlcmdyb3VwLiBUaGUgYm90IG11c3QgYmUgYW4gYWRtaW5pc3RyYXRvciBpbiB0aGUgc3VwZXJncm91cCBmb3IgdGhpcyB0byB3b3JrIGFuZCBtdXN0IGhhdmUgdGhlIGFwcHJvcHJpYXRlIGFkbWluaXN0cmF0b3IgcmlnaHRzLiBQYXNzIFRydWUgZm9yIGFsbCBwZXJtaXNzaW9ucyB0byBsaWZ0IHJlc3RyaWN0aW9ucyBmcm9tIGEgdXNlci4gUmV0dXJucyBUcnVlIG9uIHN1Y2Nlc3MuXG4gICAgICpcbiAgICAgKiBAcGFyYW0gdXNlcl9pZCBVbmlxdWUgaWRlbnRpZmllciBvZiB0aGUgdGFyZ2V0IHVzZXJcbiAgICAgKiBAcGFyYW0gcGVybWlzc2lvbnMgQW4gb2JqZWN0IGZvciBuZXcgdXNlciBwZXJtaXNzaW9uc1xuICAgICAqIEBwYXJhbSBvdGhlciBPcHRpb25hbCByZW1haW5pbmcgcGFyYW1ldGVycywgY29uZmVyIHRoZSBvZmZpY2lhbCByZWZlcmVuY2UgYmVsb3dcbiAgICAgKiBAcGFyYW0gc2lnbmFsIE9wdGlvbmFsIGBBYm9ydFNpZ25hbGAgdG8gY2FuY2VsIHRoZSByZXF1ZXN0XG4gICAgICpcbiAgICAgKiAqKk9mZmljaWFsIHJlZmVyZW5jZToqKiBodHRwczovL2NvcmUudGVsZWdyYW0ub3JnL2JvdHMvYXBpI3Jlc3RyaWN0Y2hhdG1lbWJlclxuICAgICAqL1xuICAgIHJlc3RyaWN0Q2hhdE1lbWJlcihcbiAgICAgICAgdXNlcl9pZDogbnVtYmVyLFxuICAgICAgICBwZXJtaXNzaW9uczogQ2hhdFBlcm1pc3Npb25zLFxuICAgICAgICBvdGhlcj86IE90aGVyPFxuICAgICAgICAgICAgXCJyZXN0cmljdENoYXRNZW1iZXJcIixcbiAgICAgICAgICAgIFwiY2hhdF9pZFwiIHwgXCJ1c2VyX2lkXCIgfCBcInBlcm1pc3Npb25zXCJcbiAgICAgICAgPixcbiAgICAgICAgc2lnbmFsPzogQWJvcnRTaWduYWwsXG4gICAgKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmFwaS5yZXN0cmljdENoYXRNZW1iZXIoXG4gICAgICAgICAgICBvclRocm93KHRoaXMuY2hhdElkLCBcInJlc3RyaWN0Q2hhdE1lbWJlclwiKSxcbiAgICAgICAgICAgIHVzZXJfaWQsXG4gICAgICAgICAgICBwZXJtaXNzaW9ucyxcbiAgICAgICAgICAgIG90aGVyLFxuICAgICAgICAgICAgc2lnbmFsLFxuICAgICAgICApO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIENvbnRleHQtYXdhcmUgYWxpYXMgZm9yIGBhcGkucHJvbW90ZUNoYXRNZW1iZXJgLiBVc2UgdGhpcyBtZXRob2QgdG8gcHJvbW90ZSBvciBkZW1vdGUgYSB1c2VyIGluIGEgc3VwZXJncm91cCBvciBhIGNoYW5uZWwuIFRoZSBib3QgbXVzdCBiZSBhbiBhZG1pbmlzdHJhdG9yIGluIHRoZSBjaGF0IGZvciB0aGlzIHRvIHdvcmsgYW5kIG11c3QgaGF2ZSB0aGUgYXBwcm9wcmlhdGUgYWRtaW5pc3RyYXRvciByaWdodHMuIFBhc3MgRmFsc2UgZm9yIGFsbCBib29sZWFuIHBhcmFtZXRlcnMgdG8gZGVtb3RlIGEgdXNlci4gUmV0dXJucyBUcnVlIG9uIHN1Y2Nlc3MuXG4gICAgICpcbiAgICAgKiBAcGFyYW0gb3RoZXIgT3B0aW9uYWwgcmVtYWluaW5nIHBhcmFtZXRlcnMsIGNvbmZlciB0aGUgb2ZmaWNpYWwgcmVmZXJlbmNlIGJlbG93XG4gICAgICogQHBhcmFtIHNpZ25hbCBPcHRpb25hbCBgQWJvcnRTaWduYWxgIHRvIGNhbmNlbCB0aGUgcmVxdWVzdFxuICAgICAqXG4gICAgICogKipPZmZpY2lhbCByZWZlcmVuY2U6KiogaHR0cHM6Ly9jb3JlLnRlbGVncmFtLm9yZy9ib3RzL2FwaSNwcm9tb3RlY2hhdG1lbWJlclxuICAgICAqL1xuICAgIHByb21vdGVBdXRob3IoXG4gICAgICAgIG90aGVyPzogT3RoZXI8XCJwcm9tb3RlQ2hhdE1lbWJlclwiLCBcImNoYXRfaWRcIiB8IFwidXNlcl9pZFwiPixcbiAgICAgICAgc2lnbmFsPzogQWJvcnRTaWduYWwsXG4gICAgKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmFwaS5wcm9tb3RlQ2hhdE1lbWJlcihcbiAgICAgICAgICAgIG9yVGhyb3codGhpcy5jaGF0SWQsIFwicHJvbW90ZUF1dGhvclwiKSxcbiAgICAgICAgICAgIG9yVGhyb3codGhpcy5mcm9tLCBcInByb21vdGVBdXRob3JcIikuaWQsXG4gICAgICAgICAgICBvdGhlcixcbiAgICAgICAgICAgIHNpZ25hbCxcbiAgICAgICAgKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBDb250ZXh0LWF3YXJlIGFsaWFzIGZvciBgYXBpLnByb21vdGVDaGF0TWVtYmVyYC4gVXNlIHRoaXMgbWV0aG9kIHRvIHByb21vdGUgb3IgZGVtb3RlIGEgdXNlciBpbiBhIHN1cGVyZ3JvdXAgb3IgYSBjaGFubmVsLiBUaGUgYm90IG11c3QgYmUgYW4gYWRtaW5pc3RyYXRvciBpbiB0aGUgY2hhdCBmb3IgdGhpcyB0byB3b3JrIGFuZCBtdXN0IGhhdmUgdGhlIGFwcHJvcHJpYXRlIGFkbWluaXN0cmF0b3IgcmlnaHRzLiBQYXNzIEZhbHNlIGZvciBhbGwgYm9vbGVhbiBwYXJhbWV0ZXJzIHRvIGRlbW90ZSBhIHVzZXIuIFJldHVybnMgVHJ1ZSBvbiBzdWNjZXNzLlxuICAgICAqXG4gICAgICogQHBhcmFtIHVzZXJfaWQgVW5pcXVlIGlkZW50aWZpZXIgb2YgdGhlIHRhcmdldCB1c2VyXG4gICAgICogQHBhcmFtIG90aGVyIE9wdGlvbmFsIHJlbWFpbmluZyBwYXJhbWV0ZXJzLCBjb25mZXIgdGhlIG9mZmljaWFsIHJlZmVyZW5jZSBiZWxvd1xuICAgICAqIEBwYXJhbSBzaWduYWwgT3B0aW9uYWwgYEFib3J0U2lnbmFsYCB0byBjYW5jZWwgdGhlIHJlcXVlc3RcbiAgICAgKlxuICAgICAqICoqT2ZmaWNpYWwgcmVmZXJlbmNlOioqIGh0dHBzOi8vY29yZS50ZWxlZ3JhbS5vcmcvYm90cy9hcGkjcHJvbW90ZWNoYXRtZW1iZXJcbiAgICAgKi9cbiAgICBwcm9tb3RlQ2hhdE1lbWJlcihcbiAgICAgICAgdXNlcl9pZDogbnVtYmVyLFxuICAgICAgICBvdGhlcj86IE90aGVyPFwicHJvbW90ZUNoYXRNZW1iZXJcIiwgXCJjaGF0X2lkXCIgfCBcInVzZXJfaWRcIj4sXG4gICAgICAgIHNpZ25hbD86IEFib3J0U2lnbmFsLFxuICAgICkge1xuICAgICAgICByZXR1cm4gdGhpcy5hcGkucHJvbW90ZUNoYXRNZW1iZXIoXG4gICAgICAgICAgICBvclRocm93KHRoaXMuY2hhdElkLCBcInByb21vdGVDaGF0TWVtYmVyXCIpLFxuICAgICAgICAgICAgdXNlcl9pZCxcbiAgICAgICAgICAgIG90aGVyLFxuICAgICAgICAgICAgc2lnbmFsLFxuICAgICAgICApO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIENvbnRleHQtYXdhcmUgYWxpYXMgZm9yIGBhcGkuc2V0Q2hhdEFkbWluaXN0cmF0b3JDdXN0b21UaXRsZWAuIFVzZSB0aGlzIG1ldGhvZCB0byBzZXQgYSBjdXN0b20gdGl0bGUgZm9yIGFuIGFkbWluaXN0cmF0b3IgaW4gYSBzdXBlcmdyb3VwIHByb21vdGVkIGJ5IHRoZSBib3QuIFJldHVybnMgVHJ1ZSBvbiBzdWNjZXNzLlxuICAgICAqXG4gICAgICogQHBhcmFtIGN1c3RvbV90aXRsZSBOZXcgY3VzdG9tIHRpdGxlIGZvciB0aGUgYWRtaW5pc3RyYXRvcjsgMC0xNiBjaGFyYWN0ZXJzLCBlbW9qaSBhcmUgbm90IGFsbG93ZWRcbiAgICAgKiBAcGFyYW0gc2lnbmFsIE9wdGlvbmFsIGBBYm9ydFNpZ25hbGAgdG8gY2FuY2VsIHRoZSByZXF1ZXN0XG4gICAgICpcbiAgICAgKiAqKk9mZmljaWFsIHJlZmVyZW5jZToqKiBodHRwczovL2NvcmUudGVsZWdyYW0ub3JnL2JvdHMvYXBpI3NldGNoYXRhZG1pbmlzdHJhdG9yY3VzdG9tdGl0bGVcbiAgICAgKi9cbiAgICBzZXRDaGF0QWRtaW5pc3RyYXRvckF1dGhvckN1c3RvbVRpdGxlKFxuICAgICAgICBjdXN0b21fdGl0bGU6IHN0cmluZyxcbiAgICAgICAgc2lnbmFsPzogQWJvcnRTaWduYWwsXG4gICAgKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmFwaS5zZXRDaGF0QWRtaW5pc3RyYXRvckN1c3RvbVRpdGxlKFxuICAgICAgICAgICAgb3JUaHJvdyh0aGlzLmNoYXRJZCwgXCJzZXRDaGF0QWRtaW5pc3RyYXRvckF1dGhvckN1c3RvbVRpdGxlXCIpLFxuICAgICAgICAgICAgb3JUaHJvdyh0aGlzLmZyb20sIFwic2V0Q2hhdEFkbWluaXN0cmF0b3JBdXRob3JDdXN0b21UaXRsZVwiKS5pZCxcbiAgICAgICAgICAgIGN1c3RvbV90aXRsZSxcbiAgICAgICAgICAgIHNpZ25hbCxcbiAgICAgICAgKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBDb250ZXh0LWF3YXJlIGFsaWFzIGZvciBgYXBpLnNldENoYXRBZG1pbmlzdHJhdG9yQ3VzdG9tVGl0bGVgLiBVc2UgdGhpcyBtZXRob2QgdG8gc2V0IGEgY3VzdG9tIHRpdGxlIGZvciBhbiBhZG1pbmlzdHJhdG9yIGluIGEgc3VwZXJncm91cCBwcm9tb3RlZCBieSB0aGUgYm90LiBSZXR1cm5zIFRydWUgb24gc3VjY2Vzcy5cbiAgICAgKlxuICAgICAqIEBwYXJhbSB1c2VyX2lkIFVuaXF1ZSBpZGVudGlmaWVyIG9mIHRoZSB0YXJnZXQgdXNlclxuICAgICAqIEBwYXJhbSBjdXN0b21fdGl0bGUgTmV3IGN1c3RvbSB0aXRsZSBmb3IgdGhlIGFkbWluaXN0cmF0b3I7IDAtMTYgY2hhcmFjdGVycywgZW1vamkgYXJlIG5vdCBhbGxvd2VkXG4gICAgICogQHBhcmFtIHNpZ25hbCBPcHRpb25hbCBgQWJvcnRTaWduYWxgIHRvIGNhbmNlbCB0aGUgcmVxdWVzdFxuICAgICAqXG4gICAgICogKipPZmZpY2lhbCByZWZlcmVuY2U6KiogaHR0cHM6Ly9jb3JlLnRlbGVncmFtLm9yZy9ib3RzL2FwaSNzZXRjaGF0YWRtaW5pc3RyYXRvcmN1c3RvbXRpdGxlXG4gICAgICovXG4gICAgc2V0Q2hhdEFkbWluaXN0cmF0b3JDdXN0b21UaXRsZShcbiAgICAgICAgdXNlcl9pZDogbnVtYmVyLFxuICAgICAgICBjdXN0b21fdGl0bGU6IHN0cmluZyxcbiAgICAgICAgc2lnbmFsPzogQWJvcnRTaWduYWwsXG4gICAgKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmFwaS5zZXRDaGF0QWRtaW5pc3RyYXRvckN1c3RvbVRpdGxlKFxuICAgICAgICAgICAgb3JUaHJvdyh0aGlzLmNoYXRJZCwgXCJzZXRDaGF0QWRtaW5pc3RyYXRvckN1c3RvbVRpdGxlXCIpLFxuICAgICAgICAgICAgdXNlcl9pZCxcbiAgICAgICAgICAgIGN1c3RvbV90aXRsZSxcbiAgICAgICAgICAgIHNpZ25hbCxcbiAgICAgICAgKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBDb250ZXh0LWF3YXJlIGFsaWFzIGZvciBgYXBpLmJhbkNoYXRTZW5kZXJDaGF0YC4gVXNlIHRoaXMgbWV0aG9kIHRvIGJhbiBhIGNoYW5uZWwgY2hhdCBpbiBhIHN1cGVyZ3JvdXAgb3IgYSBjaGFubmVsLiBVbnRpbCB0aGUgY2hhdCBpcyB1bmJhbm5lZCwgdGhlIG93bmVyIG9mIHRoZSBiYW5uZWQgY2hhdCB3b24ndCBiZSBhYmxlIHRvIHNlbmQgbWVzc2FnZXMgb24gYmVoYWxmIG9mIGFueSBvZiB0aGVpciBjaGFubmVscy4gVGhlIGJvdCBtdXN0IGJlIGFuIGFkbWluaXN0cmF0b3IgaW4gdGhlIHN1cGVyZ3JvdXAgb3IgY2hhbm5lbCBmb3IgdGhpcyB0byB3b3JrIGFuZCBtdXN0IGhhdmUgdGhlIGFwcHJvcHJpYXRlIGFkbWluaXN0cmF0b3IgcmlnaHRzLiBSZXR1cm5zIFRydWUgb24gc3VjY2Vzcy5cbiAgICAgKlxuICAgICAqIEBwYXJhbSBzZW5kZXJfY2hhdF9pZCBVbmlxdWUgaWRlbnRpZmllciBvZiB0aGUgdGFyZ2V0IHNlbmRlciBjaGF0XG4gICAgICogQHBhcmFtIHNpZ25hbCBPcHRpb25hbCBgQWJvcnRTaWduYWxgIHRvIGNhbmNlbCB0aGUgcmVxdWVzdFxuICAgICAqXG4gICAgICogKipPZmZpY2lhbCByZWZlcmVuY2U6KiogaHR0cHM6Ly9jb3JlLnRlbGVncmFtLm9yZy9ib3RzL2FwaSNiYW5jaGF0c2VuZGVyY2hhdFxuICAgICAqL1xuICAgIGJhbkNoYXRTZW5kZXJDaGF0KHNlbmRlcl9jaGF0X2lkOiBudW1iZXIsIHNpZ25hbD86IEFib3J0U2lnbmFsKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmFwaS5iYW5DaGF0U2VuZGVyQ2hhdChcbiAgICAgICAgICAgIG9yVGhyb3codGhpcy5jaGF0SWQsIFwiYmFuQ2hhdFNlbmRlckNoYXRcIiksXG4gICAgICAgICAgICBzZW5kZXJfY2hhdF9pZCxcbiAgICAgICAgICAgIHNpZ25hbCxcbiAgICAgICAgKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBDb250ZXh0LWF3YXJlIGFsaWFzIGZvciBgYXBpLnVuYmFuQ2hhdFNlbmRlckNoYXRgLiBVc2UgdGhpcyBtZXRob2QgdG8gdW5iYW4gYSBwcmV2aW91c2x5IGJhbm5lZCBjaGFubmVsIGNoYXQgaW4gYSBzdXBlcmdyb3VwIG9yIGNoYW5uZWwuIFRoZSBib3QgbXVzdCBiZSBhbiBhZG1pbmlzdHJhdG9yIGZvciB0aGlzIHRvIHdvcmsgYW5kIG11c3QgaGF2ZSB0aGUgYXBwcm9wcmlhdGUgYWRtaW5pc3RyYXRvciByaWdodHMuIFJldHVybnMgVHJ1ZSBvbiBzdWNjZXNzLlxuICAgICAqXG4gICAgICogQHBhcmFtIHNlbmRlcl9jaGF0X2lkIFVuaXF1ZSBpZGVudGlmaWVyIG9mIHRoZSB0YXJnZXQgc2VuZGVyIGNoYXRcbiAgICAgKiBAcGFyYW0gc2lnbmFsIE9wdGlvbmFsIGBBYm9ydFNpZ25hbGAgdG8gY2FuY2VsIHRoZSByZXF1ZXN0XG4gICAgICpcbiAgICAgKiAqKk9mZmljaWFsIHJlZmVyZW5jZToqKiBodHRwczovL2NvcmUudGVsZWdyYW0ub3JnL2JvdHMvYXBpI3VuYmFuY2hhdHNlbmRlcmNoYXRcbiAgICAgKi9cbiAgICB1bmJhbkNoYXRTZW5kZXJDaGF0KFxuICAgICAgICBzZW5kZXJfY2hhdF9pZDogbnVtYmVyLFxuICAgICAgICBzaWduYWw/OiBBYm9ydFNpZ25hbCxcbiAgICApIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuYXBpLnVuYmFuQ2hhdFNlbmRlckNoYXQoXG4gICAgICAgICAgICBvclRocm93KHRoaXMuY2hhdElkLCBcInVuYmFuQ2hhdFNlbmRlckNoYXRcIiksXG4gICAgICAgICAgICBzZW5kZXJfY2hhdF9pZCxcbiAgICAgICAgICAgIHNpZ25hbCxcbiAgICAgICAgKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBDb250ZXh0LWF3YXJlIGFsaWFzIGZvciBgYXBpLnNldENoYXRQZXJtaXNzaW9uc2AuIFVzZSB0aGlzIG1ldGhvZCB0byBzZXQgZGVmYXVsdCBjaGF0IHBlcm1pc3Npb25zIGZvciBhbGwgbWVtYmVycy4gVGhlIGJvdCBtdXN0IGJlIGFuIGFkbWluaXN0cmF0b3IgaW4gdGhlIGdyb3VwIG9yIGEgc3VwZXJncm91cCBmb3IgdGhpcyB0byB3b3JrIGFuZCBtdXN0IGhhdmUgdGhlIGNhbl9yZXN0cmljdF9tZW1iZXJzIGFkbWluaXN0cmF0b3IgcmlnaHRzLiBSZXR1cm5zIFRydWUgb24gc3VjY2Vzcy5cbiAgICAgKlxuICAgICAqIEBwYXJhbSBwZXJtaXNzaW9ucyBOZXcgZGVmYXVsdCBjaGF0IHBlcm1pc3Npb25zXG4gICAgICogQHBhcmFtIG90aGVyIE9wdGlvbmFsIHJlbWFpbmluZyBwYXJhbWV0ZXJzLCBjb25mZXIgdGhlIG9mZmljaWFsIHJlZmVyZW5jZSBiZWxvd1xuICAgICAqIEBwYXJhbSBzaWduYWwgT3B0aW9uYWwgYEFib3J0U2lnbmFsYCB0byBjYW5jZWwgdGhlIHJlcXVlc3RcbiAgICAgKlxuICAgICAqICoqT2ZmaWNpYWwgcmVmZXJlbmNlOioqIGh0dHBzOi8vY29yZS50ZWxlZ3JhbS5vcmcvYm90cy9hcGkjc2V0Y2hhdHBlcm1pc3Npb25zXG4gICAgICovXG4gICAgc2V0Q2hhdFBlcm1pc3Npb25zKFxuICAgICAgICBwZXJtaXNzaW9uczogQ2hhdFBlcm1pc3Npb25zLFxuICAgICAgICBvdGhlcj86IE90aGVyPFwic2V0Q2hhdFBlcm1pc3Npb25zXCIsIFwiY2hhdF9pZFwiIHwgXCJwZXJtaXNzaW9uc1wiPixcbiAgICAgICAgc2lnbmFsPzogQWJvcnRTaWduYWwsXG4gICAgKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmFwaS5zZXRDaGF0UGVybWlzc2lvbnMoXG4gICAgICAgICAgICBvclRocm93KHRoaXMuY2hhdElkLCBcInNldENoYXRQZXJtaXNzaW9uc1wiKSxcbiAgICAgICAgICAgIHBlcm1pc3Npb25zLFxuICAgICAgICAgICAgb3RoZXIsXG4gICAgICAgICAgICBzaWduYWwsXG4gICAgICAgICk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQ29udGV4dC1hd2FyZSBhbGlhcyBmb3IgYGFwaS5leHBvcnRDaGF0SW52aXRlTGlua2AuIFVzZSB0aGlzIG1ldGhvZCB0byBnZW5lcmF0ZSBhIG5ldyBwcmltYXJ5IGludml0ZSBsaW5rIGZvciBhIGNoYXQ7IGFueSBwcmV2aW91c2x5IGdlbmVyYXRlZCBwcmltYXJ5IGxpbmsgaXMgcmV2b2tlZC4gVGhlIGJvdCBtdXN0IGJlIGFuIGFkbWluaXN0cmF0b3IgaW4gdGhlIGNoYXQgZm9yIHRoaXMgdG8gd29yayBhbmQgbXVzdCBoYXZlIHRoZSBhcHByb3ByaWF0ZSBhZG1pbmlzdHJhdG9yIHJpZ2h0cy4gUmV0dXJucyB0aGUgbmV3IGludml0ZSBsaW5rIGFzIFN0cmluZyBvbiBzdWNjZXNzLlxuICAgICAqXG4gICAgICogTm90ZTogRWFjaCBhZG1pbmlzdHJhdG9yIGluIGEgY2hhdCBnZW5lcmF0ZXMgdGhlaXIgb3duIGludml0ZSBsaW5rcy4gQm90cyBjYW4ndCB1c2UgaW52aXRlIGxpbmtzIGdlbmVyYXRlZCBieSBvdGhlciBhZG1pbmlzdHJhdG9ycy4gSWYgeW91IHdhbnQgeW91ciBib3QgdG8gd29yayB3aXRoIGludml0ZSBsaW5rcywgaXQgd2lsbCBuZWVkIHRvIGdlbmVyYXRlIGl0cyBvd24gbGluayB1c2luZyBleHBvcnRDaGF0SW52aXRlTGluayBvciBieSBjYWxsaW5nIHRoZSBnZXRDaGF0IG1ldGhvZC4gSWYgeW91ciBib3QgbmVlZHMgdG8gZ2VuZXJhdGUgYSBuZXcgcHJpbWFyeSBpbnZpdGUgbGluayByZXBsYWNpbmcgaXRzIHByZXZpb3VzIG9uZSwgdXNlIGV4cG9ydENoYXRJbnZpdGVMaW5rIGFnYWluLlxuICAgICAqXG4gICAgICogQHBhcmFtIHNpZ25hbCBPcHRpb25hbCBgQWJvcnRTaWduYWxgIHRvIGNhbmNlbCB0aGUgcmVxdWVzdFxuICAgICAqXG4gICAgICogKipPZmZpY2lhbCByZWZlcmVuY2U6KiogaHR0cHM6Ly9jb3JlLnRlbGVncmFtLm9yZy9ib3RzL2FwaSNleHBvcnRjaGF0aW52aXRlbGlua1xuICAgICAqL1xuICAgIGV4cG9ydENoYXRJbnZpdGVMaW5rKHNpZ25hbD86IEFib3J0U2lnbmFsKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmFwaS5leHBvcnRDaGF0SW52aXRlTGluayhcbiAgICAgICAgICAgIG9yVGhyb3codGhpcy5jaGF0SWQsIFwiZXhwb3J0Q2hhdEludml0ZUxpbmtcIiksXG4gICAgICAgICAgICBzaWduYWwsXG4gICAgICAgICk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQ29udGV4dC1hd2FyZSBhbGlhcyBmb3IgYGFwaS5jcmVhdGVDaGF0SW52aXRlTGlua2AuIFVzZSB0aGlzIG1ldGhvZCB0byBjcmVhdGUgYW4gYWRkaXRpb25hbCBpbnZpdGUgbGluayBmb3IgYSBjaGF0LiBUaGUgYm90IG11c3QgYmUgYW4gYWRtaW5pc3RyYXRvciBpbiB0aGUgY2hhdCBmb3IgdGhpcyB0byB3b3JrIGFuZCBtdXN0IGhhdmUgdGhlIGFwcHJvcHJpYXRlIGFkbWluaXN0cmF0b3IgcmlnaHRzLiBUaGUgbGluayBjYW4gYmUgcmV2b2tlZCB1c2luZyB0aGUgbWV0aG9kIHJldm9rZUNoYXRJbnZpdGVMaW5rLiBSZXR1cm5zIHRoZSBuZXcgaW52aXRlIGxpbmsgYXMgQ2hhdEludml0ZUxpbmsgb2JqZWN0LlxuICAgICAqXG4gICAgICogQHBhcmFtIG90aGVyIE9wdGlvbmFsIHJlbWFpbmluZyBwYXJhbWV0ZXJzLCBjb25mZXIgdGhlIG9mZmljaWFsIHJlZmVyZW5jZSBiZWxvd1xuICAgICAqIEBwYXJhbSBzaWduYWwgT3B0aW9uYWwgYEFib3J0U2lnbmFsYCB0byBjYW5jZWwgdGhlIHJlcXVlc3RcbiAgICAgKlxuICAgICAqICoqT2ZmaWNpYWwgcmVmZXJlbmNlOioqIGh0dHBzOi8vY29yZS50ZWxlZ3JhbS5vcmcvYm90cy9hcGkjY3JlYXRlY2hhdGludml0ZWxpbmtcbiAgICAgKi9cbiAgICBjcmVhdGVDaGF0SW52aXRlTGluayhcbiAgICAgICAgb3RoZXI/OiBPdGhlcjxcImNyZWF0ZUNoYXRJbnZpdGVMaW5rXCIsIFwiY2hhdF9pZFwiPixcbiAgICAgICAgc2lnbmFsPzogQWJvcnRTaWduYWwsXG4gICAgKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmFwaS5jcmVhdGVDaGF0SW52aXRlTGluayhcbiAgICAgICAgICAgIG9yVGhyb3codGhpcy5jaGF0SWQsIFwiY3JlYXRlQ2hhdEludml0ZUxpbmtcIiksXG4gICAgICAgICAgICBvdGhlcixcbiAgICAgICAgICAgIHNpZ25hbCxcbiAgICAgICAgKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiAgQ29udGV4dC1hd2FyZSBhbGlhcyBmb3IgYGFwaS5lZGl0Q2hhdEludml0ZUxpbmtgLiBVc2UgdGhpcyBtZXRob2QgdG8gZWRpdCBhIG5vbi1wcmltYXJ5IGludml0ZSBsaW5rIGNyZWF0ZWQgYnkgdGhlIGJvdC4gVGhlIGJvdCBtdXN0IGJlIGFuIGFkbWluaXN0cmF0b3IgaW4gdGhlIGNoYXQgZm9yIHRoaXMgdG8gd29yayBhbmQgbXVzdCBoYXZlIHRoZSBhcHByb3ByaWF0ZSBhZG1pbmlzdHJhdG9yIHJpZ2h0cy4gUmV0dXJucyB0aGUgZWRpdGVkIGludml0ZSBsaW5rIGFzIGEgQ2hhdEludml0ZUxpbmsgb2JqZWN0LlxuICAgICAqXG4gICAgICogQHBhcmFtIGludml0ZV9saW5rIFRoZSBpbnZpdGUgbGluayB0byBlZGl0XG4gICAgICogQHBhcmFtIG90aGVyIE9wdGlvbmFsIHJlbWFpbmluZyBwYXJhbWV0ZXJzLCBjb25mZXIgdGhlIG9mZmljaWFsIHJlZmVyZW5jZSBiZWxvd1xuICAgICAqIEBwYXJhbSBzaWduYWwgT3B0aW9uYWwgYEFib3J0U2lnbmFsYCB0byBjYW5jZWwgdGhlIHJlcXVlc3RcbiAgICAgKlxuICAgICAqICoqT2ZmaWNpYWwgcmVmZXJlbmNlOioqIGh0dHBzOi8vY29yZS50ZWxlZ3JhbS5vcmcvYm90cy9hcGkjZWRpdGNoYXRpbnZpdGVsaW5rXG4gICAgICovXG4gICAgZWRpdENoYXRJbnZpdGVMaW5rKFxuICAgICAgICBpbnZpdGVfbGluazogc3RyaW5nLFxuICAgICAgICBvdGhlcj86IE90aGVyPFwiZWRpdENoYXRJbnZpdGVMaW5rXCIsIFwiY2hhdF9pZFwiIHwgXCJpbnZpdGVfbGlua1wiPixcbiAgICAgICAgc2lnbmFsPzogQWJvcnRTaWduYWwsXG4gICAgKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmFwaS5lZGl0Q2hhdEludml0ZUxpbmsoXG4gICAgICAgICAgICBvclRocm93KHRoaXMuY2hhdElkLCBcImVkaXRDaGF0SW52aXRlTGlua1wiKSxcbiAgICAgICAgICAgIGludml0ZV9saW5rLFxuICAgICAgICAgICAgb3RoZXIsXG4gICAgICAgICAgICBzaWduYWwsXG4gICAgICAgICk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogIENvbnRleHQtYXdhcmUgYWxpYXMgZm9yIGBhcGkucmV2b2tlQ2hhdEludml0ZUxpbmtgLiBVc2UgdGhpcyBtZXRob2QgdG8gcmV2b2tlIGFuIGludml0ZSBsaW5rIGNyZWF0ZWQgYnkgdGhlIGJvdC4gSWYgdGhlIHByaW1hcnkgbGluayBpcyByZXZva2VkLCBhIG5ldyBsaW5rIGlzIGF1dG9tYXRpY2FsbHkgZ2VuZXJhdGVkLiBUaGUgYm90IG11c3QgYmUgYW4gYWRtaW5pc3RyYXRvciBpbiB0aGUgY2hhdCBmb3IgdGhpcyB0byB3b3JrIGFuZCBtdXN0IGhhdmUgdGhlIGFwcHJvcHJpYXRlIGFkbWluaXN0cmF0b3IgcmlnaHRzLiBSZXR1cm5zIHRoZSByZXZva2VkIGludml0ZSBsaW5rIGFzIENoYXRJbnZpdGVMaW5rIG9iamVjdC5cbiAgICAgKlxuICAgICAqIEBwYXJhbSBpbnZpdGVfbGluayBUaGUgaW52aXRlIGxpbmsgdG8gcmV2b2tlXG4gICAgICogQHBhcmFtIHNpZ25hbCBPcHRpb25hbCBgQWJvcnRTaWduYWxgIHRvIGNhbmNlbCB0aGUgcmVxdWVzdFxuICAgICAqXG4gICAgICogKipPZmZpY2lhbCByZWZlcmVuY2U6KiogaHR0cHM6Ly9jb3JlLnRlbGVncmFtLm9yZy9ib3RzL2FwaSNyZXZva2VjaGF0aW52aXRlbGlua1xuICAgICAqL1xuICAgIHJldm9rZUNoYXRJbnZpdGVMaW5rKGludml0ZV9saW5rOiBzdHJpbmcsIHNpZ25hbD86IEFib3J0U2lnbmFsKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmFwaS5yZXZva2VDaGF0SW52aXRlTGluayhcbiAgICAgICAgICAgIG9yVGhyb3codGhpcy5jaGF0SWQsIFwiZWRpdENoYXRJbnZpdGVMaW5rXCIpLFxuICAgICAgICAgICAgaW52aXRlX2xpbmssXG4gICAgICAgICAgICBzaWduYWwsXG4gICAgICAgICk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQ29udGV4dC1hd2FyZSBhbGlhcyBmb3IgYGFwaS5hcHByb3ZlQ2hhdEpvaW5SZXF1ZXN0YC4gVXNlIHRoaXMgbWV0aG9kIHRvIGFwcHJvdmUgYSBjaGF0IGpvaW4gcmVxdWVzdC4gVGhlIGJvdCBtdXN0IGJlIGFuIGFkbWluaXN0cmF0b3IgaW4gdGhlIGNoYXQgZm9yIHRoaXMgdG8gd29yayBhbmQgbXVzdCBoYXZlIHRoZSBjYW5faW52aXRlX3VzZXJzIGFkbWluaXN0cmF0b3IgcmlnaHQuIFJldHVybnMgVHJ1ZSBvbiBzdWNjZXNzLlxuICAgICAqXG4gICAgICogQHBhcmFtIHVzZXJfaWQgVW5pcXVlIGlkZW50aWZpZXIgb2YgdGhlIHRhcmdldCB1c2VyXG4gICAgICogQHBhcmFtIHNpZ25hbCBPcHRpb25hbCBgQWJvcnRTaWduYWxgIHRvIGNhbmNlbCB0aGUgcmVxdWVzdFxuICAgICAqXG4gICAgICogKipPZmZpY2lhbCByZWZlcmVuY2U6KiogaHR0cHM6Ly9jb3JlLnRlbGVncmFtLm9yZy9ib3RzL2FwaSNhcHByb3ZlY2hhdGpvaW5yZXF1ZXN0XG4gICAgICovXG4gICAgYXBwcm92ZUNoYXRKb2luUmVxdWVzdChcbiAgICAgICAgdXNlcl9pZDogbnVtYmVyLFxuICAgICAgICBzaWduYWw/OiBBYm9ydFNpZ25hbCxcbiAgICApIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuYXBpLmFwcHJvdmVDaGF0Sm9pblJlcXVlc3QoXG4gICAgICAgICAgICBvclRocm93KHRoaXMuY2hhdElkLCBcImFwcHJvdmVDaGF0Sm9pblJlcXVlc3RcIiksXG4gICAgICAgICAgICB1c2VyX2lkLFxuICAgICAgICAgICAgc2lnbmFsLFxuICAgICAgICApO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIENvbnRleHQtYXdhcmUgYWxpYXMgZm9yIGBhcGkuZGVjbGluZUNoYXRKb2luUmVxdWVzdGAuIFVzZSB0aGlzIG1ldGhvZCB0byBkZWNsaW5lIGEgY2hhdCBqb2luIHJlcXVlc3QuIFRoZSBib3QgbXVzdCBiZSBhbiBhZG1pbmlzdHJhdG9yIGluIHRoZSBjaGF0IGZvciB0aGlzIHRvIHdvcmsgYW5kIG11c3QgaGF2ZSB0aGUgY2FuX2ludml0ZV91c2VycyBhZG1pbmlzdHJhdG9yIHJpZ2h0LiBSZXR1cm5zIFRydWUgb24gc3VjY2Vzcy5cbiAgICAgKlxuICAgICAqIEBwYXJhbSB1c2VyX2lkIFVuaXF1ZSBpZGVudGlmaWVyIG9mIHRoZSB0YXJnZXQgdXNlclxuICAgICAqIEBwYXJhbSBzaWduYWwgT3B0aW9uYWwgYEFib3J0U2lnbmFsYCB0byBjYW5jZWwgdGhlIHJlcXVlc3RcbiAgICAgKlxuICAgICAqICoqT2ZmaWNpYWwgcmVmZXJlbmNlOioqIGh0dHBzOi8vY29yZS50ZWxlZ3JhbS5vcmcvYm90cy9hcGkjZGVjbGluZWNoYXRqb2lucmVxdWVzdFxuICAgICAqL1xuICAgIGRlY2xpbmVDaGF0Sm9pblJlcXVlc3QoXG4gICAgICAgIHVzZXJfaWQ6IG51bWJlcixcbiAgICAgICAgc2lnbmFsPzogQWJvcnRTaWduYWwsXG4gICAgKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmFwaS5kZWNsaW5lQ2hhdEpvaW5SZXF1ZXN0KFxuICAgICAgICAgICAgb3JUaHJvdyh0aGlzLmNoYXRJZCwgXCJkZWNsaW5lQ2hhdEpvaW5SZXF1ZXN0XCIpLFxuICAgICAgICAgICAgdXNlcl9pZCxcbiAgICAgICAgICAgIHNpZ25hbCxcbiAgICAgICAgKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBDb250ZXh0LWF3YXJlIGFsaWFzIGZvciBgYXBpLnNldENoYXRQaG90b2AuIFVzZSB0aGlzIG1ldGhvZCB0byBzZXQgYSBuZXcgcHJvZmlsZSBwaG90byBmb3IgdGhlIGNoYXQuIFBob3RvcyBjYW4ndCBiZSBjaGFuZ2VkIGZvciBwcml2YXRlIGNoYXRzLiBUaGUgYm90IG11c3QgYmUgYW4gYWRtaW5pc3RyYXRvciBpbiB0aGUgY2hhdCBmb3IgdGhpcyB0byB3b3JrIGFuZCBtdXN0IGhhdmUgdGhlIGFwcHJvcHJpYXRlIGFkbWluaXN0cmF0b3IgcmlnaHRzLiBSZXR1cm5zIFRydWUgb24gc3VjY2Vzcy5cbiAgICAgKlxuICAgICAqIEBwYXJhbSBwaG90byBOZXcgY2hhdCBwaG90bywgdXBsb2FkZWQgdXNpbmcgbXVsdGlwYXJ0L2Zvcm0tZGF0YVxuICAgICAqIEBwYXJhbSBzaWduYWwgT3B0aW9uYWwgYEFib3J0U2lnbmFsYCB0byBjYW5jZWwgdGhlIHJlcXVlc3RcbiAgICAgKlxuICAgICAqICoqT2ZmaWNpYWwgcmVmZXJlbmNlOioqIGh0dHBzOi8vY29yZS50ZWxlZ3JhbS5vcmcvYm90cy9hcGkjc2V0Y2hhdHBob3RvXG4gICAgICovXG4gICAgc2V0Q2hhdFBob3RvKHBob3RvOiBJbnB1dEZpbGUsIHNpZ25hbD86IEFib3J0U2lnbmFsKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmFwaS5zZXRDaGF0UGhvdG8oXG4gICAgICAgICAgICBvclRocm93KHRoaXMuY2hhdElkLCBcInNldENoYXRQaG90b1wiKSxcbiAgICAgICAgICAgIHBob3RvLFxuICAgICAgICAgICAgc2lnbmFsLFxuICAgICAgICApO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIENvbnRleHQtYXdhcmUgYWxpYXMgZm9yIGBhcGkuZGVsZXRlQ2hhdFBob3RvYC4gVXNlIHRoaXMgbWV0aG9kIHRvIGRlbGV0ZSBhIGNoYXQgcGhvdG8uIFBob3RvcyBjYW4ndCBiZSBjaGFuZ2VkIGZvciBwcml2YXRlIGNoYXRzLiBUaGUgYm90IG11c3QgYmUgYW4gYWRtaW5pc3RyYXRvciBpbiB0aGUgY2hhdCBmb3IgdGhpcyB0byB3b3JrIGFuZCBtdXN0IGhhdmUgdGhlIGFwcHJvcHJpYXRlIGFkbWluaXN0cmF0b3IgcmlnaHRzLiBSZXR1cm5zIFRydWUgb24gc3VjY2Vzcy5cbiAgICAgKlxuICAgICAqIEBwYXJhbSBzaWduYWwgT3B0aW9uYWwgYEFib3J0U2lnbmFsYCB0byBjYW5jZWwgdGhlIHJlcXVlc3RcbiAgICAgKlxuICAgICAqICoqT2ZmaWNpYWwgcmVmZXJlbmNlOioqIGh0dHBzOi8vY29yZS50ZWxlZ3JhbS5vcmcvYm90cy9hcGkjZGVsZXRlY2hhdHBob3RvXG4gICAgICovXG4gICAgZGVsZXRlQ2hhdFBob3RvKHNpZ25hbD86IEFib3J0U2lnbmFsKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmFwaS5kZWxldGVDaGF0UGhvdG8oXG4gICAgICAgICAgICBvclRocm93KHRoaXMuY2hhdElkLCBcImRlbGV0ZUNoYXRQaG90b1wiKSxcbiAgICAgICAgICAgIHNpZ25hbCxcbiAgICAgICAgKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBDb250ZXh0LWF3YXJlIGFsaWFzIGZvciBgYXBpLnNldENoYXRUaXRsZWAuIFVzZSB0aGlzIG1ldGhvZCB0byBjaGFuZ2UgdGhlIHRpdGxlIG9mIGEgY2hhdC4gVGl0bGVzIGNhbid0IGJlIGNoYW5nZWQgZm9yIHByaXZhdGUgY2hhdHMuIFRoZSBib3QgbXVzdCBiZSBhbiBhZG1pbmlzdHJhdG9yIGluIHRoZSBjaGF0IGZvciB0aGlzIHRvIHdvcmsgYW5kIG11c3QgaGF2ZSB0aGUgYXBwcm9wcmlhdGUgYWRtaW5pc3RyYXRvciByaWdodHMuIFJldHVybnMgVHJ1ZSBvbiBzdWNjZXNzLlxuICAgICAqXG4gICAgICogQHBhcmFtIHRpdGxlIE5ldyBjaGF0IHRpdGxlLCAxLTI1NSBjaGFyYWN0ZXJzXG4gICAgICogQHBhcmFtIHNpZ25hbCBPcHRpb25hbCBgQWJvcnRTaWduYWxgIHRvIGNhbmNlbCB0aGUgcmVxdWVzdFxuICAgICAqXG4gICAgICogKipPZmZpY2lhbCByZWZlcmVuY2U6KiogaHR0cHM6Ly9jb3JlLnRlbGVncmFtLm9yZy9ib3RzL2FwaSNzZXRjaGF0dGl0bGVcbiAgICAgKi9cbiAgICBzZXRDaGF0VGl0bGUodGl0bGU6IHN0cmluZywgc2lnbmFsPzogQWJvcnRTaWduYWwpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuYXBpLnNldENoYXRUaXRsZShcbiAgICAgICAgICAgIG9yVGhyb3codGhpcy5jaGF0SWQsIFwic2V0Q2hhdFRpdGxlXCIpLFxuICAgICAgICAgICAgdGl0bGUsXG4gICAgICAgICAgICBzaWduYWwsXG4gICAgICAgICk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQ29udGV4dC1hd2FyZSBhbGlhcyBmb3IgYGFwaS5zZXRDaGF0RGVzY3JpcHRpb25gLiBVc2UgdGhpcyBtZXRob2QgdG8gY2hhbmdlIHRoZSBkZXNjcmlwdGlvbiBvZiBhIGdyb3VwLCBhIHN1cGVyZ3JvdXAgb3IgYSBjaGFubmVsLiBUaGUgYm90IG11c3QgYmUgYW4gYWRtaW5pc3RyYXRvciBpbiB0aGUgY2hhdCBmb3IgdGhpcyB0byB3b3JrIGFuZCBtdXN0IGhhdmUgdGhlIGFwcHJvcHJpYXRlIGFkbWluaXN0cmF0b3IgcmlnaHRzLiBSZXR1cm5zIFRydWUgb24gc3VjY2Vzcy5cbiAgICAgKlxuICAgICAqIEBwYXJhbSBkZXNjcmlwdGlvbiBOZXcgY2hhdCBkZXNjcmlwdGlvbiwgMC0yNTUgY2hhcmFjdGVyc1xuICAgICAqIEBwYXJhbSBzaWduYWwgT3B0aW9uYWwgYEFib3J0U2lnbmFsYCB0byBjYW5jZWwgdGhlIHJlcXVlc3RcbiAgICAgKlxuICAgICAqICoqT2ZmaWNpYWwgcmVmZXJlbmNlOioqIGh0dHBzOi8vY29yZS50ZWxlZ3JhbS5vcmcvYm90cy9hcGkjc2V0Y2hhdGRlc2NyaXB0aW9uXG4gICAgICovXG4gICAgc2V0Q2hhdERlc2NyaXB0aW9uKGRlc2NyaXB0aW9uOiBzdHJpbmcgfCB1bmRlZmluZWQsIHNpZ25hbD86IEFib3J0U2lnbmFsKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmFwaS5zZXRDaGF0RGVzY3JpcHRpb24oXG4gICAgICAgICAgICBvclRocm93KHRoaXMuY2hhdElkLCBcInNldENoYXREZXNjcmlwdGlvblwiKSxcbiAgICAgICAgICAgIGRlc2NyaXB0aW9uLFxuICAgICAgICAgICAgc2lnbmFsLFxuICAgICAgICApO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIENvbnRleHQtYXdhcmUgYWxpYXMgZm9yIGBhcGkucGluQ2hhdE1lc3NhZ2VgLiBVc2UgdGhpcyBtZXRob2QgdG8gYWRkIGEgbWVzc2FnZSB0byB0aGUgbGlzdCBvZiBwaW5uZWQgbWVzc2FnZXMgaW4gYSBjaGF0LiBJZiB0aGUgY2hhdCBpcyBub3QgYSBwcml2YXRlIGNoYXQsIHRoZSBib3QgbXVzdCBiZSBhbiBhZG1pbmlzdHJhdG9yIGluIHRoZSBjaGF0IGZvciB0aGlzIHRvIHdvcmsgYW5kIG11c3QgaGF2ZSB0aGUgJ2Nhbl9waW5fbWVzc2FnZXMnIGFkbWluaXN0cmF0b3IgcmlnaHQgaW4gYSBzdXBlcmdyb3VwIG9yICdjYW5fZWRpdF9tZXNzYWdlcycgYWRtaW5pc3RyYXRvciByaWdodCBpbiBhIGNoYW5uZWwuIFJldHVybnMgVHJ1ZSBvbiBzdWNjZXNzLlxuICAgICAqXG4gICAgICogQHBhcmFtIG1lc3NhZ2VfaWQgSWRlbnRpZmllciBvZiBhIG1lc3NhZ2UgdG8gcGluXG4gICAgICogQHBhcmFtIG90aGVyIE9wdGlvbmFsIHJlbWFpbmluZyBwYXJhbWV0ZXJzLCBjb25mZXIgdGhlIG9mZmljaWFsIHJlZmVyZW5jZSBiZWxvd1xuICAgICAqIEBwYXJhbSBzaWduYWwgT3B0aW9uYWwgYEFib3J0U2lnbmFsYCB0byBjYW5jZWwgdGhlIHJlcXVlc3RcbiAgICAgKlxuICAgICAqICoqT2ZmaWNpYWwgcmVmZXJlbmNlOioqIGh0dHBzOi8vY29yZS50ZWxlZ3JhbS5vcmcvYm90cy9hcGkjcGluY2hhdG1lc3NhZ2VcbiAgICAgKi9cbiAgICBwaW5DaGF0TWVzc2FnZShcbiAgICAgICAgbWVzc2FnZV9pZDogbnVtYmVyLFxuICAgICAgICBvdGhlcj86IE90aGVyPFwicGluQ2hhdE1lc3NhZ2VcIiwgXCJjaGF0X2lkXCIgfCBcIm1lc3NhZ2VfaWRcIj4sXG4gICAgICAgIHNpZ25hbD86IEFib3J0U2lnbmFsLFxuICAgICkge1xuICAgICAgICByZXR1cm4gdGhpcy5hcGkucGluQ2hhdE1lc3NhZ2UoXG4gICAgICAgICAgICBvclRocm93KHRoaXMuY2hhdElkLCBcInBpbkNoYXRNZXNzYWdlXCIpLFxuICAgICAgICAgICAgbWVzc2FnZV9pZCxcbiAgICAgICAgICAgIG90aGVyLFxuICAgICAgICAgICAgc2lnbmFsLFxuICAgICAgICApO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIENvbnRleHQtYXdhcmUgYWxpYXMgZm9yIGBhcGkudW5waW5DaGF0TWVzc2FnZWAuIFVzZSB0aGlzIG1ldGhvZCB0byByZW1vdmUgYSBtZXNzYWdlIGZyb20gdGhlIGxpc3Qgb2YgcGlubmVkIG1lc3NhZ2VzIGluIGEgY2hhdC4gSWYgdGhlIGNoYXQgaXMgbm90IGEgcHJpdmF0ZSBjaGF0LCB0aGUgYm90IG11c3QgYmUgYW4gYWRtaW5pc3RyYXRvciBpbiB0aGUgY2hhdCBmb3IgdGhpcyB0byB3b3JrIGFuZCBtdXN0IGhhdmUgdGhlICdjYW5fcGluX21lc3NhZ2VzJyBhZG1pbmlzdHJhdG9yIHJpZ2h0IGluIGEgc3VwZXJncm91cCBvciAnY2FuX2VkaXRfbWVzc2FnZXMnIGFkbWluaXN0cmF0b3IgcmlnaHQgaW4gYSBjaGFubmVsLiBSZXR1cm5zIFRydWUgb24gc3VjY2Vzcy5cbiAgICAgKlxuICAgICAqIEBwYXJhbSBtZXNzYWdlX2lkIElkZW50aWZpZXIgb2YgYSBtZXNzYWdlIHRvIHVucGluLiBJZiBub3Qgc3BlY2lmaWVkLCB0aGUgbW9zdCByZWNlbnQgcGlubmVkIG1lc3NhZ2UgKGJ5IHNlbmRpbmcgZGF0ZSkgd2lsbCBiZSB1bnBpbm5lZC5cbiAgICAgKiBAcGFyYW0gc2lnbmFsIE9wdGlvbmFsIGBBYm9ydFNpZ25hbGAgdG8gY2FuY2VsIHRoZSByZXF1ZXN0XG4gICAgICpcbiAgICAgKiAqKk9mZmljaWFsIHJlZmVyZW5jZToqKiBodHRwczovL2NvcmUudGVsZWdyYW0ub3JnL2JvdHMvYXBpI3VucGluY2hhdG1lc3NhZ2VcbiAgICAgKi9cbiAgICB1bnBpbkNoYXRNZXNzYWdlKG1lc3NhZ2VfaWQ/OiBudW1iZXIsIHNpZ25hbD86IEFib3J0U2lnbmFsKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmFwaS51bnBpbkNoYXRNZXNzYWdlKFxuICAgICAgICAgICAgb3JUaHJvdyh0aGlzLmNoYXRJZCwgXCJ1bnBpbkNoYXRNZXNzYWdlXCIpLFxuICAgICAgICAgICAgbWVzc2FnZV9pZCxcbiAgICAgICAgICAgIHNpZ25hbCxcbiAgICAgICAgKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBDb250ZXh0LWF3YXJlIGFsaWFzIGZvciBgYXBpLnVucGluQWxsQ2hhdE1lc3NhZ2VzYC4gVXNlIHRoaXMgbWV0aG9kIHRvIGNsZWFyIHRoZSBsaXN0IG9mIHBpbm5lZCBtZXNzYWdlcyBpbiBhIGNoYXQuIElmIHRoZSBjaGF0IGlzIG5vdCBhIHByaXZhdGUgY2hhdCwgdGhlIGJvdCBtdXN0IGJlIGFuIGFkbWluaXN0cmF0b3IgaW4gdGhlIGNoYXQgZm9yIHRoaXMgdG8gd29yayBhbmQgbXVzdCBoYXZlIHRoZSAnY2FuX3Bpbl9tZXNzYWdlcycgYWRtaW5pc3RyYXRvciByaWdodCBpbiBhIHN1cGVyZ3JvdXAgb3IgJ2Nhbl9lZGl0X21lc3NhZ2VzJyBhZG1pbmlzdHJhdG9yIHJpZ2h0IGluIGEgY2hhbm5lbC4gUmV0dXJucyBUcnVlIG9uIHN1Y2Nlc3MuXG4gICAgICpcbiAgICAgKiBAcGFyYW0gc2lnbmFsIE9wdGlvbmFsIGBBYm9ydFNpZ25hbGAgdG8gY2FuY2VsIHRoZSByZXF1ZXN0XG4gICAgICpcbiAgICAgKiAqKk9mZmljaWFsIHJlZmVyZW5jZToqKiBodHRwczovL2NvcmUudGVsZWdyYW0ub3JnL2JvdHMvYXBpI3VucGluYWxsY2hhdG1lc3NhZ2VzXG4gICAgICovXG4gICAgdW5waW5BbGxDaGF0TWVzc2FnZXMoc2lnbmFsPzogQWJvcnRTaWduYWwpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuYXBpLnVucGluQWxsQ2hhdE1lc3NhZ2VzKFxuICAgICAgICAgICAgb3JUaHJvdyh0aGlzLmNoYXRJZCwgXCJ1bnBpbkFsbENoYXRNZXNzYWdlc1wiKSxcbiAgICAgICAgICAgIHNpZ25hbCxcbiAgICAgICAgKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBDb250ZXh0LWF3YXJlIGFsaWFzIGZvciBgYXBpLmxlYXZlQ2hhdGAuIFVzZSB0aGlzIG1ldGhvZCBmb3IgeW91ciBib3QgdG8gbGVhdmUgYSBncm91cCwgc3VwZXJncm91cCBvciBjaGFubmVsLiBSZXR1cm5zIFRydWUgb24gc3VjY2Vzcy5cbiAgICAgKlxuICAgICAqIEBwYXJhbSBzaWduYWwgT3B0aW9uYWwgYEFib3J0U2lnbmFsYCB0byBjYW5jZWwgdGhlIHJlcXVlc3RcbiAgICAgKlxuICAgICAqICoqT2ZmaWNpYWwgcmVmZXJlbmNlOioqIGh0dHBzOi8vY29yZS50ZWxlZ3JhbS5vcmcvYm90cy9hcGkjbGVhdmVjaGF0XG4gICAgICovXG4gICAgbGVhdmVDaGF0KHNpZ25hbD86IEFib3J0U2lnbmFsKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmFwaS5sZWF2ZUNoYXQob3JUaHJvdyh0aGlzLmNoYXRJZCwgXCJsZWF2ZUNoYXRcIiksIHNpZ25hbCk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQ29udGV4dC1hd2FyZSBhbGlhcyBmb3IgYGFwaS5nZXRDaGF0YC4gVXNlIHRoaXMgbWV0aG9kIHRvIGdldCB1cCB0byBkYXRlIGluZm9ybWF0aW9uIGFib3V0IHRoZSBjaGF0IChjdXJyZW50IG5hbWUgb2YgdGhlIHVzZXIgZm9yIG9uZS1vbi1vbmUgY29udmVyc2F0aW9ucywgY3VycmVudCB1c2VybmFtZSBvZiBhIHVzZXIsIGdyb3VwIG9yIGNoYW5uZWwsIGV0Yy4pLiBSZXR1cm5zIGEgQ2hhdCBvYmplY3Qgb24gc3VjY2Vzcy5cbiAgICAgKlxuICAgICAqIEBwYXJhbSBzaWduYWwgT3B0aW9uYWwgYEFib3J0U2lnbmFsYCB0byBjYW5jZWwgdGhlIHJlcXVlc3RcbiAgICAgKlxuICAgICAqICoqT2ZmaWNpYWwgcmVmZXJlbmNlOioqIGh0dHBzOi8vY29yZS50ZWxlZ3JhbS5vcmcvYm90cy9hcGkjZ2V0Y2hhdFxuICAgICAqL1xuICAgIGdldENoYXQoc2lnbmFsPzogQWJvcnRTaWduYWwpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuYXBpLmdldENoYXQob3JUaHJvdyh0aGlzLmNoYXRJZCwgXCJnZXRDaGF0XCIpLCBzaWduYWwpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIENvbnRleHQtYXdhcmUgYWxpYXMgZm9yIGBhcGkuZ2V0Q2hhdEFkbWluaXN0cmF0b3JzYC4gVXNlIHRoaXMgbWV0aG9kIHRvIGdldCBhIGxpc3Qgb2YgYWRtaW5pc3RyYXRvcnMgaW4gYSBjaGF0LCB3aGljaCBhcmVuJ3QgYm90cy4gUmV0dXJucyBhbiBBcnJheSBvZiBDaGF0TWVtYmVyIG9iamVjdHMuXG4gICAgICpcbiAgICAgKiBAcGFyYW0gc2lnbmFsIE9wdGlvbmFsIGBBYm9ydFNpZ25hbGAgdG8gY2FuY2VsIHRoZSByZXF1ZXN0XG4gICAgICpcbiAgICAgKiAqKk9mZmljaWFsIHJlZmVyZW5jZToqKiBodHRwczovL2NvcmUudGVsZWdyYW0ub3JnL2JvdHMvYXBpI2dldGNoYXRhZG1pbmlzdHJhdG9yc1xuICAgICAqL1xuICAgIGdldENoYXRBZG1pbmlzdHJhdG9ycyhzaWduYWw/OiBBYm9ydFNpZ25hbCkge1xuICAgICAgICByZXR1cm4gdGhpcy5hcGkuZ2V0Q2hhdEFkbWluaXN0cmF0b3JzKFxuICAgICAgICAgICAgb3JUaHJvdyh0aGlzLmNoYXRJZCwgXCJnZXRDaGF0QWRtaW5pc3RyYXRvcnNcIiksXG4gICAgICAgICAgICBzaWduYWwsXG4gICAgICAgICk7XG4gICAgfVxuXG4gICAgLyoqIEBkZXByZWNhdGVkIFVzZSBgZ2V0Q2hhdE1lbWJlcnNDb3VudGAgaW5zdGVhZC4gKi9cbiAgICBnZXRDaGF0TWVtYmVyc0NvdW50KC4uLmFyZ3M6IFBhcmFtZXRlcnM8Q29udGV4dFtcImdldENoYXRNZW1iZXJDb3VudFwiXT4pIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuZ2V0Q2hhdE1lbWJlckNvdW50KC4uLmFyZ3MpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIENvbnRleHQtYXdhcmUgYWxpYXMgZm9yIGBhcGkuZ2V0Q2hhdE1lbWJlckNvdW50YC4gVXNlIHRoaXMgbWV0aG9kIHRvIGdldCB0aGUgbnVtYmVyIG9mIG1lbWJlcnMgaW4gYSBjaGF0LiBSZXR1cm5zIEludCBvbiBzdWNjZXNzLlxuICAgICAqXG4gICAgICogQHBhcmFtIHNpZ25hbCBPcHRpb25hbCBgQWJvcnRTaWduYWxgIHRvIGNhbmNlbCB0aGUgcmVxdWVzdFxuICAgICAqXG4gICAgICogKipPZmZpY2lhbCByZWZlcmVuY2U6KiogaHR0cHM6Ly9jb3JlLnRlbGVncmFtLm9yZy9ib3RzL2FwaSNnZXRjaGF0bWVtYmVyY291bnRcbiAgICAgKi9cbiAgICBnZXRDaGF0TWVtYmVyQ291bnQoc2lnbmFsPzogQWJvcnRTaWduYWwpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuYXBpLmdldENoYXRNZW1iZXJDb3VudChcbiAgICAgICAgICAgIG9yVGhyb3codGhpcy5jaGF0SWQsIFwiZ2V0Q2hhdE1lbWJlckNvdW50XCIpLFxuICAgICAgICAgICAgc2lnbmFsLFxuICAgICAgICApO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIENvbnRleHQtYXdhcmUgYWxpYXMgZm9yIGBhcGkuZ2V0Q2hhdE1lbWJlcmAuIFVzZSB0aGlzIG1ldGhvZCB0byBnZXQgaW5mb3JtYXRpb24gYWJvdXQgYSBtZW1iZXIgb2YgYSBjaGF0LiBUaGUgbWV0aG9kIGlzIGd1YXJhbnRlZWQgdG8gd29yayBvbmx5IGlmIHRoZSBib3QgaXMgYW4gYWRtaW5pc3RyYXRvciBpbiB0aGUgY2hhdC4gUmV0dXJucyBhIENoYXRNZW1iZXIgb2JqZWN0IG9uIHN1Y2Nlc3MuXG4gICAgICpcbiAgICAgKiBAcGFyYW0gc2lnbmFsIE9wdGlvbmFsIGBBYm9ydFNpZ25hbGAgdG8gY2FuY2VsIHRoZSByZXF1ZXN0XG4gICAgICpcbiAgICAgKiAqKk9mZmljaWFsIHJlZmVyZW5jZToqKiBodHRwczovL2NvcmUudGVsZWdyYW0ub3JnL2JvdHMvYXBpI2dldGNoYXRtZW1iZXJcbiAgICAgKi9cbiAgICBnZXRBdXRob3Ioc2lnbmFsPzogQWJvcnRTaWduYWwpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuYXBpLmdldENoYXRNZW1iZXIoXG4gICAgICAgICAgICBvclRocm93KHRoaXMuY2hhdElkLCBcImdldEF1dGhvclwiKSxcbiAgICAgICAgICAgIG9yVGhyb3codGhpcy5mcm9tLCBcImdldEF1dGhvclwiKS5pZCxcbiAgICAgICAgICAgIHNpZ25hbCxcbiAgICAgICAgKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBDb250ZXh0LWF3YXJlIGFsaWFzIGZvciBgYXBpLmdldENoYXRNZW1iZXJgLiBVc2UgdGhpcyBtZXRob2QgdG8gZ2V0IGluZm9ybWF0aW9uIGFib3V0IGEgbWVtYmVyIG9mIGEgY2hhdC4gVGhlIG1ldGhvZCBpcyBndWFyYW50ZWVkIHRvIHdvcmsgb25seSBpZiB0aGUgYm90IGlzIGFuIGFkbWluaXN0cmF0b3IgaW4gdGhlIGNoYXQuIFJldHVybnMgYSBDaGF0TWVtYmVyIG9iamVjdCBvbiBzdWNjZXNzLlxuICAgICAqXG4gICAgICogQHBhcmFtIHVzZXJfaWQgVW5pcXVlIGlkZW50aWZpZXIgb2YgdGhlIHRhcmdldCB1c2VyXG4gICAgICogQHBhcmFtIHNpZ25hbCBPcHRpb25hbCBgQWJvcnRTaWduYWxgIHRvIGNhbmNlbCB0aGUgcmVxdWVzdFxuICAgICAqXG4gICAgICogKipPZmZpY2lhbCByZWZlcmVuY2U6KiogaHR0cHM6Ly9jb3JlLnRlbGVncmFtLm9yZy9ib3RzL2FwaSNnZXRjaGF0bWVtYmVyXG4gICAgICovXG4gICAgZ2V0Q2hhdE1lbWJlcih1c2VyX2lkOiBudW1iZXIsIHNpZ25hbD86IEFib3J0U2lnbmFsKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmFwaS5nZXRDaGF0TWVtYmVyKFxuICAgICAgICAgICAgb3JUaHJvdyh0aGlzLmNoYXRJZCwgXCJnZXRDaGF0TWVtYmVyXCIpLFxuICAgICAgICAgICAgdXNlcl9pZCxcbiAgICAgICAgICAgIHNpZ25hbCxcbiAgICAgICAgKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBDb250ZXh0LWF3YXJlIGFsaWFzIGZvciBgYXBpLnNldENoYXRTdGlja2VyU2V0YC4gVXNlIHRoaXMgbWV0aG9kIHRvIHNldCBhIG5ldyBncm91cCBzdGlja2VyIHNldCBmb3IgYSBzdXBlcmdyb3VwLiBUaGUgYm90IG11c3QgYmUgYW4gYWRtaW5pc3RyYXRvciBpbiB0aGUgY2hhdCBmb3IgdGhpcyB0byB3b3JrIGFuZCBtdXN0IGhhdmUgdGhlIGFwcHJvcHJpYXRlIGFkbWluaXN0cmF0b3IgcmlnaHRzLiBVc2UgdGhlIGZpZWxkIGNhbl9zZXRfc3RpY2tlcl9zZXQgbHkgcmV0dXJuZWQgaW4gZ2V0Q2hhdCByZXF1ZXN0cyB0byBjaGVjayBpZiB0aGUgYm90IGNhbiB1c2UgdGhpcyBtZXRob2QuIFJldHVybnMgVHJ1ZSBvbiBzdWNjZXNzLlxuICAgICAqXG4gICAgICogQHBhcmFtIHN0aWNrZXJfc2V0X25hbWUgTmFtZSBvZiB0aGUgc3RpY2tlciBzZXQgdG8gYmUgc2V0IGFzIHRoZSBncm91cCBzdGlja2VyIHNldFxuICAgICAqIEBwYXJhbSBzaWduYWwgT3B0aW9uYWwgYEFib3J0U2lnbmFsYCB0byBjYW5jZWwgdGhlIHJlcXVlc3RcbiAgICAgKlxuICAgICAqICoqT2ZmaWNpYWwgcmVmZXJlbmNlOioqIGh0dHBzOi8vY29yZS50ZWxlZ3JhbS5vcmcvYm90cy9hcGkjc2V0Y2hhdHN0aWNrZXJzZXRcbiAgICAgKi9cbiAgICBzZXRDaGF0U3RpY2tlclNldChzdGlja2VyX3NldF9uYW1lOiBzdHJpbmcsIHNpZ25hbD86IEFib3J0U2lnbmFsKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmFwaS5zZXRDaGF0U3RpY2tlclNldChcbiAgICAgICAgICAgIG9yVGhyb3codGhpcy5jaGF0SWQsIFwic2V0Q2hhdFN0aWNrZXJTZXRcIiksXG4gICAgICAgICAgICBzdGlja2VyX3NldF9uYW1lLFxuICAgICAgICAgICAgc2lnbmFsLFxuICAgICAgICApO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIENvbnRleHQtYXdhcmUgYWxpYXMgZm9yIGBhcGkuZGVsZXRlQ2hhdFN0aWNrZXJTZXRgLiBVc2UgdGhpcyBtZXRob2QgdG8gZGVsZXRlIGEgZ3JvdXAgc3RpY2tlciBzZXQgZnJvbSBhIHN1cGVyZ3JvdXAuIFRoZSBib3QgbXVzdCBiZSBhbiBhZG1pbmlzdHJhdG9yIGluIHRoZSBjaGF0IGZvciB0aGlzIHRvIHdvcmsgYW5kIG11c3QgaGF2ZSB0aGUgYXBwcm9wcmlhdGUgYWRtaW5pc3RyYXRvciByaWdodHMuIFVzZSB0aGUgZmllbGQgY2FuX3NldF9zdGlja2VyX3NldCBseSByZXR1cm5lZCBpbiBnZXRDaGF0IHJlcXVlc3RzIHRvIGNoZWNrIGlmIHRoZSBib3QgY2FuIHVzZSB0aGlzIG1ldGhvZC4gUmV0dXJucyBUcnVlIG9uIHN1Y2Nlc3MuXG4gICAgICpcbiAgICAgKiBAcGFyYW0gc2lnbmFsIE9wdGlvbmFsIGBBYm9ydFNpZ25hbGAgdG8gY2FuY2VsIHRoZSByZXF1ZXN0XG4gICAgICpcbiAgICAgKiAqKk9mZmljaWFsIHJlZmVyZW5jZToqKiBodHRwczovL2NvcmUudGVsZWdyYW0ub3JnL2JvdHMvYXBpI2RlbGV0ZWNoYXRzdGlja2Vyc2V0XG4gICAgICovXG4gICAgZGVsZXRlQ2hhdFN0aWNrZXJTZXQoc2lnbmFsPzogQWJvcnRTaWduYWwpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuYXBpLmRlbGV0ZUNoYXRTdGlja2VyU2V0KFxuICAgICAgICAgICAgb3JUaHJvdyh0aGlzLmNoYXRJZCwgXCJkZWxldGVDaGF0U3RpY2tlclNldFwiKSxcbiAgICAgICAgICAgIHNpZ25hbCxcbiAgICAgICAgKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBDb250ZXh0LWF3YXJlIGFsaWFzIGZvciBgYXBpLmNyZWF0ZUZvcnVtVG9waWNgLiBVc2UgdGhpcyBtZXRob2QgdG8gY3JlYXRlIGEgdG9waWMgaW4gYSBmb3J1bSBzdXBlcmdyb3VwIGNoYXQuIFRoZSBib3QgbXVzdCBiZSBhbiBhZG1pbmlzdHJhdG9yIGluIHRoZSBjaGF0IGZvciB0aGlzIHRvIHdvcmsgYW5kIG11c3QgaGF2ZSB0aGUgY2FuX21hbmFnZV90b3BpY3MgYWRtaW5pc3RyYXRvciByaWdodHMuIFJldHVybnMgaW5mb3JtYXRpb24gYWJvdXQgdGhlIGNyZWF0ZWQgdG9waWMgYXMgYSBGb3J1bVRvcGljIG9iamVjdC5cbiAgICAgKlxuICAgICAqIEBwYXJhbSBuYW1lIFRvcGljIG5hbWUsIDEtMTI4IGNoYXJhY3RlcnNcbiAgICAgKiBAcGFyYW0gb3RoZXIgT3B0aW9uYWwgcmVtYWluaW5nIHBhcmFtZXRlcnMsIGNvbmZlciB0aGUgb2ZmaWNpYWwgcmVmZXJlbmNlIGJlbG93XG4gICAgICogQHBhcmFtIHNpZ25hbCBPcHRpb25hbCBgQWJvcnRTaWduYWxgIHRvIGNhbmNlbCB0aGUgcmVxdWVzdFxuICAgICAqXG4gICAgICogKipPZmZpY2lhbCByZWZlcmVuY2U6KiogaHR0cHM6Ly9jb3JlLnRlbGVncmFtLm9yZy9ib3RzL2FwaSNjcmVhdGVmb3J1bXRvcGljXG4gICAgICovXG4gICAgY3JlYXRlRm9ydW1Ub3BpYyhcbiAgICAgICAgbmFtZTogc3RyaW5nLFxuICAgICAgICBvdGhlcj86IE90aGVyPFwiY3JlYXRlRm9ydW1Ub3BpY1wiLCBcImNoYXRfaWRcIiB8IFwibmFtZVwiPixcbiAgICAgICAgc2lnbmFsPzogQWJvcnRTaWduYWwsXG4gICAgKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmFwaS5jcmVhdGVGb3J1bVRvcGljKFxuICAgICAgICAgICAgb3JUaHJvdyh0aGlzLmNoYXRJZCwgXCJjcmVhdGVGb3J1bVRvcGljXCIpLFxuICAgICAgICAgICAgbmFtZSxcbiAgICAgICAgICAgIG90aGVyLFxuICAgICAgICAgICAgc2lnbmFsLFxuICAgICAgICApO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIENvbnRleHQtYXdhcmUgYWxpYXMgZm9yIGBhcGkuZWRpdEZvcnVtVG9waWNgLiBVc2UgdGhpcyBtZXRob2QgdG8gZWRpdCBuYW1lIGFuZCBpY29uIG9mIGEgdG9waWMgaW4gYSBmb3J1bSBzdXBlcmdyb3VwIGNoYXQuIFRoZSBib3QgbXVzdCBiZSBhbiBhZG1pbmlzdHJhdG9yIGluIHRoZSBjaGF0IGZvciB0aGlzIHRvIHdvcmsgYW5kIG11c3QgaGF2ZSBjYW5fbWFuYWdlX3RvcGljcyBhZG1pbmlzdHJhdG9yIHJpZ2h0cywgdW5sZXNzIGl0IGlzIHRoZSBjcmVhdG9yIG9mIHRoZSB0b3BpYy4gUmV0dXJucyBUcnVlIG9uIHN1Y2Nlc3MuXG4gICAgICpcbiAgICAgKiBAcGFyYW0gb3RoZXIgT3B0aW9uYWwgcmVtYWluaW5nIHBhcmFtZXRlcnMsIGNvbmZlciB0aGUgb2ZmaWNpYWwgcmVmZXJlbmNlIGJlbG93XG4gICAgICogQHBhcmFtIHNpZ25hbCBPcHRpb25hbCBgQWJvcnRTaWduYWxgIHRvIGNhbmNlbCB0aGUgcmVxdWVzdFxuICAgICAqXG4gICAgICogKipPZmZpY2lhbCByZWZlcmVuY2U6KiogaHR0cHM6Ly9jb3JlLnRlbGVncmFtLm9yZy9ib3RzL2FwaSNlZGl0Zm9ydW10b3BpY1xuICAgICAqL1xuICAgIGVkaXRGb3J1bVRvcGljKFxuICAgICAgICBvdGhlcj86IE90aGVyPFwiZWRpdEZvcnVtVG9waWNcIiwgXCJjaGF0X2lkXCIgfCBcIm1lc3NhZ2VfdGhyZWFkX2lkXCI+LFxuICAgICAgICBzaWduYWw/OiBBYm9ydFNpZ25hbCxcbiAgICApIHtcbiAgICAgICAgY29uc3QgbWVzc2FnZSA9IG9yVGhyb3codGhpcy5tc2csIFwiZWRpdEZvcnVtVG9waWNcIik7XG4gICAgICAgIGNvbnN0IHRocmVhZCA9IG9yVGhyb3cobWVzc2FnZS5tZXNzYWdlX3RocmVhZF9pZCwgXCJlZGl0Rm9ydW1Ub3BpY1wiKTtcbiAgICAgICAgcmV0dXJuIHRoaXMuYXBpLmVkaXRGb3J1bVRvcGljKG1lc3NhZ2UuY2hhdC5pZCwgdGhyZWFkLCBvdGhlciwgc2lnbmFsKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBDb250ZXh0LWF3YXJlIGFsaWFzIGZvciBgYXBpLmNsb3NlRm9ydW1Ub3BpY2AuIFVzZSB0aGlzIG1ldGhvZCB0byBjbG9zZSBhbiBvcGVuIHRvcGljIGluIGEgZm9ydW0gc3VwZXJncm91cCBjaGF0LiBUaGUgYm90IG11c3QgYmUgYW4gYWRtaW5pc3RyYXRvciBpbiB0aGUgY2hhdCBmb3IgdGhpcyB0byB3b3JrIGFuZCBtdXN0IGhhdmUgdGhlIGNhbl9tYW5hZ2VfdG9waWNzIGFkbWluaXN0cmF0b3IgcmlnaHRzLCB1bmxlc3MgaXQgaXMgdGhlIGNyZWF0b3Igb2YgdGhlIHRvcGljLiBSZXR1cm5zIFRydWUgb24gc3VjY2Vzcy5cbiAgICAgKlxuICAgICAqIEBwYXJhbSBzaWduYWwgT3B0aW9uYWwgYEFib3J0U2lnbmFsYCB0byBjYW5jZWwgdGhlIHJlcXVlc3RcbiAgICAgKlxuICAgICAqICoqT2ZmaWNpYWwgcmVmZXJlbmNlOioqIGh0dHBzOi8vY29yZS50ZWxlZ3JhbS5vcmcvYm90cy9hcGkjY2xvc2Vmb3J1bXRvcGljXG4gICAgICovXG4gICAgY2xvc2VGb3J1bVRvcGljKHNpZ25hbD86IEFib3J0U2lnbmFsKSB7XG4gICAgICAgIGNvbnN0IG1lc3NhZ2UgPSBvclRocm93KHRoaXMubXNnLCBcImNsb3NlRm9ydW1Ub3BpY1wiKTtcbiAgICAgICAgY29uc3QgdGhyZWFkID0gb3JUaHJvdyhtZXNzYWdlLm1lc3NhZ2VfdGhyZWFkX2lkLCBcImNsb3NlRm9ydW1Ub3BpY1wiKTtcbiAgICAgICAgcmV0dXJuIHRoaXMuYXBpLmNsb3NlRm9ydW1Ub3BpYyhtZXNzYWdlLmNoYXQuaWQsIHRocmVhZCwgc2lnbmFsKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBDb250ZXh0LWF3YXJlIGFsaWFzIGZvciBgYXBpLnJlb3BlbkZvcnVtVG9waWNgLiBVc2UgdGhpcyBtZXRob2QgdG8gcmVvcGVuIGEgY2xvc2VkIHRvcGljIGluIGEgZm9ydW0gc3VwZXJncm91cCBjaGF0LiBUaGUgYm90IG11c3QgYmUgYW4gYWRtaW5pc3RyYXRvciBpbiB0aGUgY2hhdCBmb3IgdGhpcyB0byB3b3JrIGFuZCBtdXN0IGhhdmUgdGhlIGNhbl9tYW5hZ2VfdG9waWNzIGFkbWluaXN0cmF0b3IgcmlnaHRzLCB1bmxlc3MgaXQgaXMgdGhlIGNyZWF0b3Igb2YgdGhlIHRvcGljLiBSZXR1cm5zIFRydWUgb24gc3VjY2Vzcy5cbiAgICAgKlxuICAgICAqIEBwYXJhbSBzaWduYWwgT3B0aW9uYWwgYEFib3J0U2lnbmFsYCB0byBjYW5jZWwgdGhlIHJlcXVlc3RcbiAgICAgKlxuICAgICAqICoqT2ZmaWNpYWwgcmVmZXJlbmNlOioqIGh0dHBzOi8vY29yZS50ZWxlZ3JhbS5vcmcvYm90cy9hcGkjcmVvcGVuZm9ydW10b3BpY1xuICAgICAqL1xuICAgIHJlb3BlbkZvcnVtVG9waWMoc2lnbmFsPzogQWJvcnRTaWduYWwpIHtcbiAgICAgICAgY29uc3QgbWVzc2FnZSA9IG9yVGhyb3codGhpcy5tc2csIFwicmVvcGVuRm9ydW1Ub3BpY1wiKTtcbiAgICAgICAgY29uc3QgdGhyZWFkID0gb3JUaHJvdyhtZXNzYWdlLm1lc3NhZ2VfdGhyZWFkX2lkLCBcInJlb3BlbkZvcnVtVG9waWNcIik7XG4gICAgICAgIHJldHVybiB0aGlzLmFwaS5yZW9wZW5Gb3J1bVRvcGljKG1lc3NhZ2UuY2hhdC5pZCwgdGhyZWFkLCBzaWduYWwpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIENvbnRleHQtYXdhcmUgYWxpYXMgZm9yIGBhcGkuZGVsZXRlRm9ydW1Ub3BpY2AuIFVzZSB0aGlzIG1ldGhvZCB0byBkZWxldGUgYSBmb3J1bSB0b3BpYyBhbG9uZyB3aXRoIGFsbCBpdHMgbWVzc2FnZXMgaW4gYSBmb3J1bSBzdXBlcmdyb3VwIGNoYXQuIFRoZSBib3QgbXVzdCBiZSBhbiBhZG1pbmlzdHJhdG9yIGluIHRoZSBjaGF0IGZvciB0aGlzIHRvIHdvcmsgYW5kIG11c3QgaGF2ZSB0aGUgY2FuX2RlbGV0ZV9tZXNzYWdlcyBhZG1pbmlzdHJhdG9yIHJpZ2h0cy4gUmV0dXJucyBUcnVlIG9uIHN1Y2Nlc3MuXG4gICAgICpcbiAgICAgKiBAcGFyYW0gc2lnbmFsIE9wdGlvbmFsIGBBYm9ydFNpZ25hbGAgdG8gY2FuY2VsIHRoZSByZXF1ZXN0XG4gICAgICpcbiAgICAgKiAqKk9mZmljaWFsIHJlZmVyZW5jZToqKiBodHRwczovL2NvcmUudGVsZWdyYW0ub3JnL2JvdHMvYXBpI2RlbGV0ZWZvcnVtdG9waWNcbiAgICAgKi9cbiAgICBkZWxldGVGb3J1bVRvcGljKHNpZ25hbD86IEFib3J0U2lnbmFsKSB7XG4gICAgICAgIGNvbnN0IG1lc3NhZ2UgPSBvclRocm93KHRoaXMubXNnLCBcImRlbGV0ZUZvcnVtVG9waWNcIik7XG4gICAgICAgIGNvbnN0IHRocmVhZCA9IG9yVGhyb3cobWVzc2FnZS5tZXNzYWdlX3RocmVhZF9pZCwgXCJkZWxldGVGb3J1bVRvcGljXCIpO1xuICAgICAgICByZXR1cm4gdGhpcy5hcGkuZGVsZXRlRm9ydW1Ub3BpYyhtZXNzYWdlLmNoYXQuaWQsIHRocmVhZCwgc2lnbmFsKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBDb250ZXh0LWF3YXJlIGFsaWFzIGZvciBgYXBpLnVucGluQWxsRm9ydW1Ub3BpY01lc3NhZ2VzYC4gVXNlIHRoaXMgbWV0aG9kIHRvIGNsZWFyIHRoZSBsaXN0IG9mIHBpbm5lZCBtZXNzYWdlcyBpbiBhIGZvcnVtIHRvcGljLiBUaGUgYm90IG11c3QgYmUgYW4gYWRtaW5pc3RyYXRvciBpbiB0aGUgY2hhdCBmb3IgdGhpcyB0byB3b3JrIGFuZCBtdXN0IGhhdmUgdGhlIGNhbl9waW5fbWVzc2FnZXMgYWRtaW5pc3RyYXRvciByaWdodCBpbiB0aGUgc3VwZXJncm91cC4gUmV0dXJucyBUcnVlIG9uIHN1Y2Nlc3MuXG4gICAgICpcbiAgICAgKiBAcGFyYW0gc2lnbmFsIE9wdGlvbmFsIGBBYm9ydFNpZ25hbGAgdG8gY2FuY2VsIHRoZSByZXF1ZXN0XG4gICAgICpcbiAgICAgKiAqKk9mZmljaWFsIHJlZmVyZW5jZToqKiBodHRwczovL2NvcmUudGVsZWdyYW0ub3JnL2JvdHMvYXBpI3VucGluYWxsZm9ydW10b3BpY21lc3NhZ2VzXG4gICAgICovXG4gICAgdW5waW5BbGxGb3J1bVRvcGljTWVzc2FnZXMoc2lnbmFsPzogQWJvcnRTaWduYWwpIHtcbiAgICAgICAgY29uc3QgbWVzc2FnZSA9IG9yVGhyb3codGhpcy5tc2csIFwidW5waW5BbGxGb3J1bVRvcGljTWVzc2FnZXNcIik7XG4gICAgICAgIGNvbnN0IHRocmVhZCA9IG9yVGhyb3coXG4gICAgICAgICAgICBtZXNzYWdlLm1lc3NhZ2VfdGhyZWFkX2lkLFxuICAgICAgICAgICAgXCJ1bnBpbkFsbEZvcnVtVG9waWNNZXNzYWdlc1wiLFxuICAgICAgICApO1xuICAgICAgICByZXR1cm4gdGhpcy5hcGkudW5waW5BbGxGb3J1bVRvcGljTWVzc2FnZXMoXG4gICAgICAgICAgICBtZXNzYWdlLmNoYXQuaWQsXG4gICAgICAgICAgICB0aHJlYWQsXG4gICAgICAgICAgICBzaWduYWwsXG4gICAgICAgICk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQ29udGV4dC1hd2FyZSBhbGlhcyBmb3IgYGFwaS5lZGl0R2VuZXJhbEZvcnVtVG9waWNgLiBVc2UgdGhpcyBtZXRob2QgdG8gZWRpdCB0aGUgbmFtZSBvZiB0aGUgJ0dlbmVyYWwnIHRvcGljIGluIGEgZm9ydW0gc3VwZXJncm91cCBjaGF0LiBUaGUgYm90IG11c3QgYmUgYW4gYWRtaW5pc3RyYXRvciBpbiB0aGUgY2hhdCBmb3IgdGhpcyB0byB3b3JrIGFuZCBtdXN0IGhhdmUgY2FuX21hbmFnZV90b3BpY3MgYWRtaW5pc3RyYXRvciByaWdodHMuIFJldHVybnMgVHJ1ZSBvbiBzdWNjZXNzLlxuICAgICAqXG4gICAgICogQHBhcmFtIG5hbWUgTmV3IHRvcGljIG5hbWUsIDEtMTI4IGNoYXJhY3RlcnNcbiAgICAgKiBAcGFyYW0gc2lnbmFsIE9wdGlvbmFsIGBBYm9ydFNpZ25hbGAgdG8gY2FuY2VsIHRoZSByZXF1ZXN0XG4gICAgICpcbiAgICAgKiAqKk9mZmljaWFsIHJlZmVyZW5jZToqKiBodHRwczovL2NvcmUudGVsZWdyYW0ub3JnL2JvdHMvYXBpI2VkaXRnZW5lcmFsZm9ydW10b3BpY1xuICAgICAqL1xuICAgIGVkaXRHZW5lcmFsRm9ydW1Ub3BpYyhuYW1lOiBzdHJpbmcsIHNpZ25hbD86IEFib3J0U2lnbmFsKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmFwaS5lZGl0R2VuZXJhbEZvcnVtVG9waWMoXG4gICAgICAgICAgICBvclRocm93KHRoaXMuY2hhdElkLCBcImVkaXRHZW5lcmFsRm9ydW1Ub3BpY1wiKSxcbiAgICAgICAgICAgIG5hbWUsXG4gICAgICAgICAgICBzaWduYWwsXG4gICAgICAgICk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQ29udGV4dC1hd2FyZSBhbGlhcyBmb3IgYGFwaS5jbG9zZUdlbmVyYWxGb3J1bVRvcGljYC4gVXNlIHRoaXMgbWV0aG9kIHRvIGNsb3NlIGFuIG9wZW4gJ0dlbmVyYWwnIHRvcGljIGluIGEgZm9ydW0gc3VwZXJncm91cCBjaGF0LiBUaGUgYm90IG11c3QgYmUgYW4gYWRtaW5pc3RyYXRvciBpbiB0aGUgY2hhdCBmb3IgdGhpcyB0byB3b3JrIGFuZCBtdXN0IGhhdmUgdGhlIGNhbl9tYW5hZ2VfdG9waWNzIGFkbWluaXN0cmF0b3IgcmlnaHRzLiBSZXR1cm5zIFRydWUgb24gc3VjY2Vzcy5cbiAgICAgKlxuICAgICAqIEBwYXJhbSBzaWduYWwgT3B0aW9uYWwgYEFib3J0U2lnbmFsYCB0byBjYW5jZWwgdGhlIHJlcXVlc3RcbiAgICAgKlxuICAgICAqICoqT2ZmaWNpYWwgcmVmZXJlbmNlOioqIGh0dHBzOi8vY29yZS50ZWxlZ3JhbS5vcmcvYm90cy9hcGkjY2xvc2VnZW5lcmFsZm9ydW10b3BpY1xuICAgICAqL1xuICAgIGNsb3NlR2VuZXJhbEZvcnVtVG9waWMoc2lnbmFsPzogQWJvcnRTaWduYWwpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuYXBpLmNsb3NlR2VuZXJhbEZvcnVtVG9waWMoXG4gICAgICAgICAgICBvclRocm93KHRoaXMuY2hhdElkLCBcImNsb3NlR2VuZXJhbEZvcnVtVG9waWNcIiksXG4gICAgICAgICAgICBzaWduYWwsXG4gICAgICAgICk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQ29udGV4dC1hd2FyZSBhbGlhcyBmb3IgYGFwaS5yZW9wZW5HZW5lcmFsRm9ydW1Ub3BpY2AuIFVzZSB0aGlzIG1ldGhvZCB0byByZW9wZW4gYSBjbG9zZWQgJ0dlbmVyYWwnIHRvcGljIGluIGEgZm9ydW0gc3VwZXJncm91cCBjaGF0LiBUaGUgYm90IG11c3QgYmUgYW4gYWRtaW5pc3RyYXRvciBpbiB0aGUgY2hhdCBmb3IgdGhpcyB0byB3b3JrIGFuZCBtdXN0IGhhdmUgdGhlIGNhbl9tYW5hZ2VfdG9waWNzIGFkbWluaXN0cmF0b3IgcmlnaHRzLiBUaGUgdG9waWMgd2lsbCBiZSBhdXRvbWF0aWNhbGx5IHVuaGlkZGVuIGlmIGl0IHdhcyBoaWRkZW4uIFJldHVybnMgVHJ1ZSBvbiBzdWNjZXNzLiAgICAgKlxuICAgICAqXG4gICAgICogQHBhcmFtIHNpZ25hbCBPcHRpb25hbCBgQWJvcnRTaWduYWxgIHRvIGNhbmNlbCB0aGUgcmVxdWVzdFxuICAgICAqXG4gICAgICogKipPZmZpY2lhbCByZWZlcmVuY2U6KiogaHR0cHM6Ly9jb3JlLnRlbGVncmFtLm9yZy9ib3RzL2FwaSNyZW9wZW5nZW5lcmFsZm9ydW10b3BpY1xuICAgICAqL1xuICAgIHJlb3BlbkdlbmVyYWxGb3J1bVRvcGljKHNpZ25hbD86IEFib3J0U2lnbmFsKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmFwaS5yZW9wZW5HZW5lcmFsRm9ydW1Ub3BpYyhcbiAgICAgICAgICAgIG9yVGhyb3codGhpcy5jaGF0SWQsIFwicmVvcGVuR2VuZXJhbEZvcnVtVG9waWNcIiksXG4gICAgICAgICAgICBzaWduYWwsXG4gICAgICAgICk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQ29udGV4dC1hd2FyZSBhbGlhcyBmb3IgYGFwaS5oaWRlR2VuZXJhbEZvcnVtVG9waWNgLiBVc2UgdGhpcyBtZXRob2QgdG8gaGlkZSB0aGUgJ0dlbmVyYWwnIHRvcGljIGluIGEgZm9ydW0gc3VwZXJncm91cCBjaGF0LiBUaGUgYm90IG11c3QgYmUgYW4gYWRtaW5pc3RyYXRvciBpbiB0aGUgY2hhdCBmb3IgdGhpcyB0byB3b3JrIGFuZCBtdXN0IGhhdmUgdGhlIGNhbl9tYW5hZ2VfdG9waWNzIGFkbWluaXN0cmF0b3IgcmlnaHRzLiBUaGUgdG9waWMgd2lsbCBiZSBhdXRvbWF0aWNhbGx5IGNsb3NlZCBpZiBpdCB3YXMgb3Blbi4gUmV0dXJucyBUcnVlIG9uIHN1Y2Nlc3MuXG4gICAgICpcbiAgICAgKiBAcGFyYW0gc2lnbmFsIE9wdGlvbmFsIGBBYm9ydFNpZ25hbGAgdG8gY2FuY2VsIHRoZSByZXF1ZXN0XG4gICAgICpcbiAgICAgKiAqKk9mZmljaWFsIHJlZmVyZW5jZToqKiBodHRwczovL2NvcmUudGVsZWdyYW0ub3JnL2JvdHMvYXBpI2hpZGVnZW5lcmFsZm9ydW10b3BpY1xuICAgICAqL1xuICAgIGhpZGVHZW5lcmFsRm9ydW1Ub3BpYyhzaWduYWw/OiBBYm9ydFNpZ25hbCkge1xuICAgICAgICByZXR1cm4gdGhpcy5hcGkuaGlkZUdlbmVyYWxGb3J1bVRvcGljKFxuICAgICAgICAgICAgb3JUaHJvdyh0aGlzLmNoYXRJZCwgXCJoaWRlR2VuZXJhbEZvcnVtVG9waWNcIiksXG4gICAgICAgICAgICBzaWduYWwsXG4gICAgICAgICk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQ29udGV4dC1hd2FyZSBhbGlhcyBmb3IgYGFwaS51bmhpZGVHZW5lcmFsRm9ydW1Ub3BpY2AuIFVzZSB0aGlzIG1ldGhvZCB0byB1bmhpZGUgdGhlICdHZW5lcmFsJyB0b3BpYyBpbiBhIGZvcnVtIHN1cGVyZ3JvdXAgY2hhdC4gVGhlIGJvdCBtdXN0IGJlIGFuIGFkbWluaXN0cmF0b3IgaW4gdGhlIGNoYXQgZm9yIHRoaXMgdG8gd29yayBhbmQgbXVzdCBoYXZlIHRoZSBjYW5fbWFuYWdlX3RvcGljcyBhZG1pbmlzdHJhdG9yIHJpZ2h0cy4gUmV0dXJucyBUcnVlIG9uIHN1Y2Nlc3MuXG4gICAgICpcbiAgICAgKiBAcGFyYW0gc2lnbmFsIE9wdGlvbmFsIGBBYm9ydFNpZ25hbGAgdG8gY2FuY2VsIHRoZSByZXF1ZXN0XG4gICAgICpcbiAgICAgKiAqKk9mZmljaWFsIHJlZmVyZW5jZToqKiBodHRwczovL2NvcmUudGVsZWdyYW0ub3JnL2JvdHMvYXBpI3VuaGlkZWdlbmVyYWxmb3J1bXRvcGljXG4gICAgICovXG4gICAgdW5oaWRlR2VuZXJhbEZvcnVtVG9waWMoc2lnbmFsPzogQWJvcnRTaWduYWwpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuYXBpLnVuaGlkZUdlbmVyYWxGb3J1bVRvcGljKFxuICAgICAgICAgICAgb3JUaHJvdyh0aGlzLmNoYXRJZCwgXCJ1bmhpZGVHZW5lcmFsRm9ydW1Ub3BpY1wiKSxcbiAgICAgICAgICAgIHNpZ25hbCxcbiAgICAgICAgKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBDb250ZXh0LWF3YXJlIGFsaWFzIGZvciBgYXBpLnVucGluQWxsR2VuZXJhbEZvcnVtVG9waWNNZXNzYWdlc2AuIFVzZSB0aGlzIG1ldGhvZCB0byBjbGVhciB0aGUgbGlzdCBvZiBwaW5uZWQgbWVzc2FnZXMgaW4gYSBHZW5lcmFsIGZvcnVtIHRvcGljLiBUaGUgYm90IG11c3QgYmUgYW4gYWRtaW5pc3RyYXRvciBpbiB0aGUgY2hhdCBmb3IgdGhpcyB0byB3b3JrIGFuZCBtdXN0IGhhdmUgdGhlIGNhbl9waW5fbWVzc2FnZXMgYWRtaW5pc3RyYXRvciByaWdodCBpbiB0aGUgc3VwZXJncm91cC4gUmV0dXJucyBUcnVlIG9uIHN1Y2Nlc3MuXG4gICAgICpcbiAgICAgKiBAcGFyYW0gc2lnbmFsIE9wdGlvbmFsIGBBYm9ydFNpZ25hbGAgdG8gY2FuY2VsIHRoZSByZXF1ZXN0XG4gICAgICpcbiAgICAgKiAqKk9mZmljaWFsIHJlZmVyZW5jZToqKiBodHRwczovL2NvcmUudGVsZWdyYW0ub3JnL2JvdHMvYXBpI3VucGluYWxsZ2VuZXJhbGZvcnVtdG9waWNtZXNzYWdlc1xuICAgICAqL1xuICAgIHVucGluQWxsR2VuZXJhbEZvcnVtVG9waWNNZXNzYWdlcyhzaWduYWw/OiBBYm9ydFNpZ25hbCkge1xuICAgICAgICByZXR1cm4gdGhpcy5hcGkudW5waW5BbGxHZW5lcmFsRm9ydW1Ub3BpY01lc3NhZ2VzKFxuICAgICAgICAgICAgb3JUaHJvdyh0aGlzLmNoYXRJZCwgXCJ1bnBpbkFsbEdlbmVyYWxGb3J1bVRvcGljTWVzc2FnZXNcIiksXG4gICAgICAgICAgICBzaWduYWwsXG4gICAgICAgICk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQ29udGV4dC1hd2FyZSBhbGlhcyBmb3IgYGFwaS5hbnN3ZXJDYWxsYmFja1F1ZXJ5YC4gVXNlIHRoaXMgbWV0aG9kIHRvIHNlbmQgYW5zd2VycyB0byBjYWxsYmFjayBxdWVyaWVzIHNlbnQgZnJvbSBpbmxpbmUga2V5Ym9hcmRzLiBUaGUgYW5zd2VyIHdpbGwgYmUgZGlzcGxheWVkIHRvIHRoZSB1c2VyIGFzIGEgbm90aWZpY2F0aW9uIGF0IHRoZSB0b3Agb2YgdGhlIGNoYXQgc2NyZWVuIG9yIGFzIGFuIGFsZXJ0LiBPbiBzdWNjZXNzLCBUcnVlIGlzIHJldHVybmVkLlxuICAgICAqXG4gICAgICogQWx0ZXJuYXRpdmVseSwgdGhlIHVzZXIgY2FuIGJlIHJlZGlyZWN0ZWQgdG8gdGhlIHNwZWNpZmllZCBHYW1lIFVSTC4gRm9yIHRoaXMgb3B0aW9uIHRvIHdvcmssIHlvdSBtdXN0IGZpcnN0IGNyZWF0ZSBhIGdhbWUgZm9yIHlvdXIgYm90IHZpYSBAQm90RmF0aGVyIGFuZCBhY2NlcHQgdGhlIHRlcm1zLiBPdGhlcndpc2UsIHlvdSBtYXkgdXNlIGxpbmtzIGxpa2UgdC5tZS95b3VyX2JvdD9zdGFydD1YWFhYIHRoYXQgb3BlbiB5b3VyIGJvdCB3aXRoIGEgcGFyYW1ldGVyLlxuICAgICAqXG4gICAgICogQHBhcmFtIG90aGVyIE9wdGlvbmFsIHJlbWFpbmluZyBwYXJhbWV0ZXJzLCBjb25mZXIgdGhlIG9mZmljaWFsIHJlZmVyZW5jZSBiZWxvd1xuICAgICAqIEBwYXJhbSBzaWduYWwgT3B0aW9uYWwgYEFib3J0U2lnbmFsYCB0byBjYW5jZWwgdGhlIHJlcXVlc3RcbiAgICAgKlxuICAgICAqICoqT2ZmaWNpYWwgcmVmZXJlbmNlOioqIGh0dHBzOi8vY29yZS50ZWxlZ3JhbS5vcmcvYm90cy9hcGkjYW5zd2VyY2FsbGJhY2txdWVyeVxuICAgICAqL1xuICAgIGFuc3dlckNhbGxiYWNrUXVlcnkoXG4gICAgICAgIG90aGVyPzogc3RyaW5nIHwgT3RoZXI8XCJhbnN3ZXJDYWxsYmFja1F1ZXJ5XCIsIFwiY2FsbGJhY2tfcXVlcnlfaWRcIj4sXG4gICAgICAgIHNpZ25hbD86IEFib3J0U2lnbmFsLFxuICAgICkge1xuICAgICAgICByZXR1cm4gdGhpcy5hcGkuYW5zd2VyQ2FsbGJhY2tRdWVyeShcbiAgICAgICAgICAgIG9yVGhyb3codGhpcy5jYWxsYmFja1F1ZXJ5LCBcImFuc3dlckNhbGxiYWNrUXVlcnlcIikuaWQsXG4gICAgICAgICAgICB0eXBlb2Ygb3RoZXIgPT09IFwic3RyaW5nXCIgPyB7IHRleHQ6IG90aGVyIH0gOiBvdGhlcixcbiAgICAgICAgICAgIHNpZ25hbCxcbiAgICAgICAgKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBDb250ZXh0LWF3YXJlIGFsaWFzIGZvciBgYXBpLnNldENoYXRNZW51QnV0dG9uYC4gVXNlIHRoaXMgbWV0aG9kIHRvIGNoYW5nZSB0aGUgYm90J3MgbWVudSBidXR0b24gaW4gYSBwcml2YXRlIGNoYXQsIG9yIHRoZSBkZWZhdWx0IG1lbnUgYnV0dG9uLiBSZXR1cm5zIFRydWUgb24gc3VjY2Vzcy5cbiAgICAgKlxuICAgICAqIEBwYXJhbSBvdGhlciBPcHRpb25hbCByZW1haW5pbmcgcGFyYW1ldGVycywgY29uZmVyIHRoZSBvZmZpY2lhbCByZWZlcmVuY2UgYmVsb3dcbiAgICAgKiBAcGFyYW0gc2lnbmFsIE9wdGlvbmFsIGBBYm9ydFNpZ25hbGAgdG8gY2FuY2VsIHRoZSByZXF1ZXN0XG4gICAgICpcbiAgICAgKiAqKk9mZmljaWFsIHJlZmVyZW5jZToqKiBodHRwczovL2NvcmUudGVsZWdyYW0ub3JnL2JvdHMvYXBpI3NldGNoYXRtZW51YnV0dG9uXG4gICAgICovXG4gICAgc2V0Q2hhdE1lbnVCdXR0b24oXG4gICAgICAgIG90aGVyPzogT3RoZXI8XCJzZXRDaGF0TWVudUJ1dHRvblwiPixcbiAgICAgICAgc2lnbmFsPzogQWJvcnRTaWduYWwsXG4gICAgKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmFwaS5zZXRDaGF0TWVudUJ1dHRvbihvdGhlciwgc2lnbmFsKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBDb250ZXh0LWF3YXJlIGFsaWFzIGZvciBgYXBpLmdldENoYXRNZW51QnV0dG9uYC4gVXNlIHRoaXMgbWV0aG9kIHRvIGdldCB0aGUgY3VycmVudCB2YWx1ZSBvZiB0aGUgYm90J3MgbWVudSBidXR0b24gaW4gYSBwcml2YXRlIGNoYXQsIG9yIHRoZSBkZWZhdWx0IG1lbnUgYnV0dG9uLiBSZXR1cm5zIE1lbnVCdXR0b24gb24gc3VjY2Vzcy5cbiAgICAgKlxuICAgICAqIEBwYXJhbSBvdGhlciBPcHRpb25hbCByZW1haW5pbmcgcGFyYW1ldGVycywgY29uZmVyIHRoZSBvZmZpY2lhbCByZWZlcmVuY2UgYmVsb3dcbiAgICAgKiBAcGFyYW0gc2lnbmFsIE9wdGlvbmFsIGBBYm9ydFNpZ25hbGAgdG8gY2FuY2VsIHRoZSByZXF1ZXN0XG4gICAgICpcbiAgICAgKiAqKk9mZmljaWFsIHJlZmVyZW5jZToqKiBodHRwczovL2NvcmUudGVsZWdyYW0ub3JnL2JvdHMvYXBpI3NldGNoYXRtZW51YnV0dG9uXG4gICAgICovXG4gICAgZ2V0Q2hhdE1lbnVCdXR0b24oXG4gICAgICAgIG90aGVyPzogT3RoZXI8XCJnZXRDaGF0TWVudUJ1dHRvblwiPixcbiAgICAgICAgc2lnbmFsPzogQWJvcnRTaWduYWwsXG4gICAgKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmFwaS5nZXRDaGF0TWVudUJ1dHRvbihvdGhlciwgc2lnbmFsKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBDb250ZXh0LWF3YXJlIGFsaWFzIGZvciBgYXBpLnNldE15RGVmYXVsdEFkbWluaXN0cmF0b3JSaWdodHNgLiBVc2UgdGhpcyBtZXRob2QgdG8gdGhlIGNoYW5nZSB0aGUgZGVmYXVsdCBhZG1pbmlzdHJhdG9yIHJpZ2h0cyByZXF1ZXN0ZWQgYnkgdGhlIGJvdCB3aGVuIGl0J3MgYWRkZWQgYXMgYW4gYWRtaW5pc3RyYXRvciB0byBncm91cHMgb3IgY2hhbm5lbHMuIFRoZXNlIHJpZ2h0cyB3aWxsIGJlIHN1Z2dlc3RlZCB0byB1c2VycywgYnV0IHRoZXkgYXJlIGFyZSBmcmVlIHRvIG1vZGlmeSB0aGUgbGlzdCBiZWZvcmUgYWRkaW5nIHRoZSBib3QuIFJldHVybnMgVHJ1ZSBvbiBzdWNjZXNzLlxuICAgICAqXG4gICAgICogQHBhcmFtIG90aGVyIE9wdGlvbmFsIHJlbWFpbmluZyBwYXJhbWV0ZXJzLCBjb25mZXIgdGhlIG9mZmljaWFsIHJlZmVyZW5jZSBiZWxvd1xuICAgICAqIEBwYXJhbSBzaWduYWwgT3B0aW9uYWwgYEFib3J0U2lnbmFsYCB0byBjYW5jZWwgdGhlIHJlcXVlc3RcbiAgICAgKlxuICAgICAqICoqT2ZmaWNpYWwgcmVmZXJlbmNlOioqIGh0dHBzOi8vY29yZS50ZWxlZ3JhbS5vcmcvYm90cy9hcGkjc2V0bXlkZWZhdWx0YWRtaW5pc3RyYXRvcnJpZ2h0c1xuICAgICAqL1xuICAgIHNldE15RGVmYXVsdEFkbWluaXN0cmF0b3JSaWdodHMoXG4gICAgICAgIG90aGVyPzogT3RoZXI8XCJzZXRNeURlZmF1bHRBZG1pbmlzdHJhdG9yUmlnaHRzXCI+LFxuICAgICAgICBzaWduYWw/OiBBYm9ydFNpZ25hbCxcbiAgICApIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuYXBpLnNldE15RGVmYXVsdEFkbWluaXN0cmF0b3JSaWdodHMob3RoZXIsIHNpZ25hbCk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQ29udGV4dC1hd2FyZSBhbGlhcyBmb3IgYGFwaS5nZXRNeURlZmF1bHRBZG1pbmlzdHJhdG9yUmlnaHRzYC4gVXNlIHRoaXMgbWV0aG9kIHRvIGdldCB0aGUgY3VycmVudCBkZWZhdWx0IGFkbWluaXN0cmF0b3IgcmlnaHRzIG9mIHRoZSBib3QuIFJldHVybnMgQ2hhdEFkbWluaXN0cmF0b3JSaWdodHMgb24gc3VjY2Vzcy5cbiAgICAgKlxuICAgICAqIEBwYXJhbSBvdGhlciBPcHRpb25hbCByZW1haW5pbmcgcGFyYW1ldGVycywgY29uZmVyIHRoZSBvZmZpY2lhbCByZWZlcmVuY2UgYmVsb3dcbiAgICAgKiBAcGFyYW0gc2lnbmFsIE9wdGlvbmFsIGBBYm9ydFNpZ25hbGAgdG8gY2FuY2VsIHRoZSByZXF1ZXN0XG4gICAgICovXG4gICAgZ2V0TXlEZWZhdWx0QWRtaW5pc3RyYXRvclJpZ2h0cyhcbiAgICAgICAgb3RoZXI/OiBPdGhlcjxcImdldE15RGVmYXVsdEFkbWluaXN0cmF0b3JSaWdodHNcIj4sXG4gICAgICAgIHNpZ25hbD86IEFib3J0U2lnbmFsLFxuICAgICkge1xuICAgICAgICByZXR1cm4gdGhpcy5hcGkuZ2V0TXlEZWZhdWx0QWRtaW5pc3RyYXRvclJpZ2h0cyhvdGhlciwgc2lnbmFsKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBDb250ZXh0LWF3YXJlIGFsaWFzIGZvciBgYXBpLmVkaXRNZXNzYWdlVGV4dGAuIFVzZSB0aGlzIG1ldGhvZCB0byBlZGl0IHRleHQgYW5kIGdhbWUgbWVzc2FnZXMuIE9uIHN1Y2Nlc3MsIGlmIHRoZSBlZGl0ZWQgbWVzc2FnZSBpcyBub3QgYW4gaW5saW5lIG1lc3NhZ2UsIHRoZSBlZGl0ZWQgTWVzc2FnZSBpcyByZXR1cm5lZCwgb3RoZXJ3aXNlIFRydWUgaXMgcmV0dXJuZWQuIE5vdGUgdGhhdCBidXNpbmVzcyBtZXNzYWdlcyB0aGF0IHdlcmUgbm90IHNlbnQgYnkgdGhlIGJvdCBhbmQgZG8gbm90IGNvbnRhaW4gYW4gaW5saW5lIGtleWJvYXJkIGNhbiBvbmx5IGJlIGVkaXRlZCB3aXRoaW4gNDggaG91cnMgZnJvbSB0aGUgdGltZSB0aGV5IHdlcmUgc2VudC5cbiAgICAgKlxuICAgICAqIEBwYXJhbSB0ZXh0IE5ldyB0ZXh0IG9mIHRoZSBtZXNzYWdlLCAxLTQwOTYgY2hhcmFjdGVycyBhZnRlciBlbnRpdGllcyBwYXJzaW5nXG4gICAgICogQHBhcmFtIG90aGVyIE9wdGlvbmFsIHJlbWFpbmluZyBwYXJhbWV0ZXJzLCBjb25mZXIgdGhlIG9mZmljaWFsIHJlZmVyZW5jZSBiZWxvd1xuICAgICAqIEBwYXJhbSBzaWduYWwgT3B0aW9uYWwgYEFib3J0U2lnbmFsYCB0byBjYW5jZWwgdGhlIHJlcXVlc3RcbiAgICAgKlxuICAgICAqICoqT2ZmaWNpYWwgcmVmZXJlbmNlOioqIGh0dHBzOi8vY29yZS50ZWxlZ3JhbS5vcmcvYm90cy9hcGkjZWRpdG1lc3NhZ2V0ZXh0XG4gICAgICovXG4gICAgZWRpdE1lc3NhZ2VUZXh0KFxuICAgICAgICB0ZXh0OiBzdHJpbmcsXG4gICAgICAgIG90aGVyPzogT3RoZXI8XG4gICAgICAgICAgICBcImVkaXRNZXNzYWdlVGV4dFwiLFxuICAgICAgICAgICAgXCJjaGF0X2lkXCIgfCBcIm1lc3NhZ2VfaWRcIiB8IFwiaW5saW5lX21lc3NhZ2VfaWRcIiB8IFwidGV4dFwiXG4gICAgICAgID4sXG4gICAgICAgIHNpZ25hbD86IEFib3J0U2lnbmFsLFxuICAgICkge1xuICAgICAgICBjb25zdCBpbmxpbmVJZCA9IHRoaXMuaW5saW5lTWVzc2FnZUlkO1xuICAgICAgICByZXR1cm4gaW5saW5lSWQgIT09IHVuZGVmaW5lZFxuICAgICAgICAgICAgPyB0aGlzLmFwaS5lZGl0TWVzc2FnZVRleHRJbmxpbmUoaW5saW5lSWQsIHRleHQsIG90aGVyKVxuICAgICAgICAgICAgOiB0aGlzLmFwaS5lZGl0TWVzc2FnZVRleHQoXG4gICAgICAgICAgICAgICAgb3JUaHJvdyh0aGlzLmNoYXRJZCwgXCJlZGl0TWVzc2FnZVRleHRcIiksXG4gICAgICAgICAgICAgICAgb3JUaHJvdyhcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5tc2c/Lm1lc3NhZ2VfaWQgPz8gdGhpcy5tZXNzYWdlUmVhY3Rpb24/Lm1lc3NhZ2VfaWQgPz9cbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMubWVzc2FnZVJlYWN0aW9uQ291bnQ/Lm1lc3NhZ2VfaWQsXG4gICAgICAgICAgICAgICAgICAgIFwiZWRpdE1lc3NhZ2VUZXh0XCIsXG4gICAgICAgICAgICAgICAgKSxcbiAgICAgICAgICAgICAgICB0ZXh0LFxuICAgICAgICAgICAgICAgIG90aGVyLFxuICAgICAgICAgICAgICAgIHNpZ25hbCxcbiAgICAgICAgICAgICk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQ29udGV4dC1hd2FyZSBhbGlhcyBmb3IgYGFwaS5lZGl0TWVzc2FnZUNhcHRpb25gLiBVc2UgdGhpcyBtZXRob2QgdG8gZWRpdCBjYXB0aW9ucyBvZiBtZXNzYWdlcy4gT24gc3VjY2VzcywgaWYgdGhlIGVkaXRlZCBtZXNzYWdlIGlzIG5vdCBhbiBpbmxpbmUgbWVzc2FnZSwgdGhlIGVkaXRlZCBNZXNzYWdlIGlzIHJldHVybmVkLCBvdGhlcndpc2UgVHJ1ZSBpcyByZXR1cm5lZC4gTm90ZSB0aGF0IGJ1c2luZXNzIG1lc3NhZ2VzIHRoYXQgd2VyZSBub3Qgc2VudCBieSB0aGUgYm90IGFuZCBkbyBub3QgY29udGFpbiBhbiBpbmxpbmUga2V5Ym9hcmQgY2FuIG9ubHkgYmUgZWRpdGVkIHdpdGhpbiA0OCBob3VycyBmcm9tIHRoZSB0aW1lIHRoZXkgd2VyZSBzZW50LlxuICAgICAqXG4gICAgICogQHBhcmFtIG90aGVyIE9wdGlvbmFsIHJlbWFpbmluZyBwYXJhbWV0ZXJzLCBjb25mZXIgdGhlIG9mZmljaWFsIHJlZmVyZW5jZSBiZWxvd1xuICAgICAqIEBwYXJhbSBzaWduYWwgT3B0aW9uYWwgYEFib3J0U2lnbmFsYCB0byBjYW5jZWwgdGhlIHJlcXVlc3RcbiAgICAgKlxuICAgICAqICoqT2ZmaWNpYWwgcmVmZXJlbmNlOioqIGh0dHBzOi8vY29yZS50ZWxlZ3JhbS5vcmcvYm90cy9hcGkjZWRpdG1lc3NhZ2VjYXB0aW9uXG4gICAgICovXG4gICAgZWRpdE1lc3NhZ2VDYXB0aW9uKFxuICAgICAgICBvdGhlcj86IE90aGVyPFxuICAgICAgICAgICAgXCJlZGl0TWVzc2FnZUNhcHRpb25cIixcbiAgICAgICAgICAgIFwiY2hhdF9pZFwiIHwgXCJtZXNzYWdlX2lkXCIgfCBcImlubGluZV9tZXNzYWdlX2lkXCJcbiAgICAgICAgPixcbiAgICAgICAgc2lnbmFsPzogQWJvcnRTaWduYWwsXG4gICAgKSB7XG4gICAgICAgIGNvbnN0IGlubGluZUlkID0gdGhpcy5pbmxpbmVNZXNzYWdlSWQ7XG4gICAgICAgIHJldHVybiBpbmxpbmVJZCAhPT0gdW5kZWZpbmVkXG4gICAgICAgICAgICA/IHRoaXMuYXBpLmVkaXRNZXNzYWdlQ2FwdGlvbklubGluZShpbmxpbmVJZCwgb3RoZXIpXG4gICAgICAgICAgICA6IHRoaXMuYXBpLmVkaXRNZXNzYWdlQ2FwdGlvbihcbiAgICAgICAgICAgICAgICBvclRocm93KHRoaXMuY2hhdElkLCBcImVkaXRNZXNzYWdlQ2FwdGlvblwiKSxcbiAgICAgICAgICAgICAgICBvclRocm93KFxuICAgICAgICAgICAgICAgICAgICB0aGlzLm1zZz8ubWVzc2FnZV9pZCA/PyB0aGlzLm1lc3NhZ2VSZWFjdGlvbj8ubWVzc2FnZV9pZCA/P1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5tZXNzYWdlUmVhY3Rpb25Db3VudD8ubWVzc2FnZV9pZCxcbiAgICAgICAgICAgICAgICAgICAgXCJlZGl0TWVzc2FnZUNhcHRpb25cIixcbiAgICAgICAgICAgICAgICApLFxuICAgICAgICAgICAgICAgIG90aGVyLFxuICAgICAgICAgICAgICAgIHNpZ25hbCxcbiAgICAgICAgICAgICk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQ29udGV4dC1hd2FyZSBhbGlhcyBmb3IgYGFwaS5lZGl0TWVzc2FnZU1lZGlhYC4gVXNlIHRoaXMgbWV0aG9kIHRvIGVkaXQgYW5pbWF0aW9uLCBhdWRpbywgZG9jdW1lbnQsIHBob3RvLCBvciB2aWRlbyBtZXNzYWdlcy4gSWYgYSBtZXNzYWdlIGlzIHBhcnQgb2YgYSBtZXNzYWdlIGFsYnVtLCB0aGVuIGl0IGNhbiBiZSBlZGl0ZWQgb25seSB0byBhbiBhdWRpbyBmb3IgYXVkaW8gYWxidW1zLCBvbmx5IHRvIGEgZG9jdW1lbnQgZm9yIGRvY3VtZW50IGFsYnVtcyBhbmQgdG8gYSBwaG90byBvciBhIHZpZGVvIG90aGVyd2lzZS4gV2hlbiBhbiBpbmxpbmUgbWVzc2FnZSBpcyBlZGl0ZWQsIGEgbmV3IGZpbGUgY2FuJ3QgYmUgdXBsb2FkZWQ7IHVzZSBhIHByZXZpb3VzbHkgdXBsb2FkZWQgZmlsZSB2aWEgaXRzIGZpbGVfaWQgb3Igc3BlY2lmeSBhIFVSTC4gT24gc3VjY2VzcywgaWYgdGhlIGVkaXRlZCBtZXNzYWdlIGlzIG5vdCBhbiBpbmxpbmUgbWVzc2FnZSwgdGhlIGVkaXRlZCBNZXNzYWdlIGlzIHJldHVybmVkLCBvdGhlcndpc2UgVHJ1ZSBpcyByZXR1cm5lZC4gTm90ZSB0aGF0IGJ1c2luZXNzIG1lc3NhZ2VzIHRoYXQgd2VyZSBub3Qgc2VudCBieSB0aGUgYm90IGFuZCBkbyBub3QgY29udGFpbiBhbiBpbmxpbmUga2V5Ym9hcmQgY2FuIG9ubHkgYmUgZWRpdGVkIHdpdGhpbiA0OCBob3VycyBmcm9tIHRoZSB0aW1lIHRoZXkgd2VyZSBzZW50LlxuICAgICAqXG4gICAgICogQHBhcmFtIG1lZGlhIEFuIG9iamVjdCBmb3IgYSBuZXcgbWVkaWEgY29udGVudCBvZiB0aGUgbWVzc2FnZVxuICAgICAqIEBwYXJhbSBvdGhlciBPcHRpb25hbCByZW1haW5pbmcgcGFyYW1ldGVycywgY29uZmVyIHRoZSBvZmZpY2lhbCByZWZlcmVuY2UgYmVsb3dcbiAgICAgKiBAcGFyYW0gc2lnbmFsIE9wdGlvbmFsIGBBYm9ydFNpZ25hbGAgdG8gY2FuY2VsIHRoZSByZXF1ZXN0XG4gICAgICpcbiAgICAgKiAqKk9mZmljaWFsIHJlZmVyZW5jZToqKiBodHRwczovL2NvcmUudGVsZWdyYW0ub3JnL2JvdHMvYXBpI2VkaXRtZXNzYWdlbWVkaWFcbiAgICAgKi9cbiAgICBlZGl0TWVzc2FnZU1lZGlhKFxuICAgICAgICBtZWRpYTogSW5wdXRNZWRpYSxcbiAgICAgICAgb3RoZXI/OiBPdGhlcjxcbiAgICAgICAgICAgIFwiZWRpdE1lc3NhZ2VNZWRpYVwiLFxuICAgICAgICAgICAgXCJjaGF0X2lkXCIgfCBcIm1lc3NhZ2VfaWRcIiB8IFwiaW5saW5lX21lc3NhZ2VfaWRcIiB8IFwibWVkaWFcIlxuICAgICAgICA+LFxuICAgICAgICBzaWduYWw/OiBBYm9ydFNpZ25hbCxcbiAgICApIHtcbiAgICAgICAgY29uc3QgaW5saW5lSWQgPSB0aGlzLmlubGluZU1lc3NhZ2VJZDtcbiAgICAgICAgcmV0dXJuIGlubGluZUlkICE9PSB1bmRlZmluZWRcbiAgICAgICAgICAgID8gdGhpcy5hcGkuZWRpdE1lc3NhZ2VNZWRpYUlubGluZShpbmxpbmVJZCwgbWVkaWEsIG90aGVyKVxuICAgICAgICAgICAgOiB0aGlzLmFwaS5lZGl0TWVzc2FnZU1lZGlhKFxuICAgICAgICAgICAgICAgIG9yVGhyb3codGhpcy5jaGF0SWQsIFwiZWRpdE1lc3NhZ2VNZWRpYVwiKSxcbiAgICAgICAgICAgICAgICBvclRocm93KFxuICAgICAgICAgICAgICAgICAgICB0aGlzLm1zZz8ubWVzc2FnZV9pZCA/PyB0aGlzLm1lc3NhZ2VSZWFjdGlvbj8ubWVzc2FnZV9pZCA/P1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5tZXNzYWdlUmVhY3Rpb25Db3VudD8ubWVzc2FnZV9pZCxcbiAgICAgICAgICAgICAgICAgICAgXCJlZGl0TWVzc2FnZU1lZGlhXCIsXG4gICAgICAgICAgICAgICAgKSxcbiAgICAgICAgICAgICAgICBtZWRpYSxcbiAgICAgICAgICAgICAgICBvdGhlcixcbiAgICAgICAgICAgICAgICBzaWduYWwsXG4gICAgICAgICAgICApO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIENvbnRleHQtYXdhcmUgYWxpYXMgZm9yIGBhcGkuZWRpdE1lc3NhZ2VSZXBseU1hcmt1cGAuIFVzZSB0aGlzIG1ldGhvZCB0byBlZGl0IG9ubHkgdGhlIHJlcGx5IG1hcmt1cCBvZiBtZXNzYWdlcy4gT24gc3VjY2VzcywgaWYgdGhlIGVkaXRlZCBtZXNzYWdlIGlzIG5vdCBhbiBpbmxpbmUgbWVzc2FnZSwgdGhlIGVkaXRlZCBNZXNzYWdlIGlzIHJldHVybmVkLCBvdGhlcndpc2UgVHJ1ZSBpcyByZXR1cm5lZC4gTm90ZSB0aGF0IGJ1c2luZXNzIG1lc3NhZ2VzIHRoYXQgd2VyZSBub3Qgc2VudCBieSB0aGUgYm90IGFuZCBkbyBub3QgY29udGFpbiBhbiBpbmxpbmUga2V5Ym9hcmQgY2FuIG9ubHkgYmUgZWRpdGVkIHdpdGhpbiA0OCBob3VycyBmcm9tIHRoZSB0aW1lIHRoZXkgd2VyZSBzZW50LlxuICAgICAqXG4gICAgICogQHBhcmFtIG90aGVyIE9wdGlvbmFsIHJlbWFpbmluZyBwYXJhbWV0ZXJzLCBjb25mZXIgdGhlIG9mZmljaWFsIHJlZmVyZW5jZSBiZWxvd1xuICAgICAqIEBwYXJhbSBzaWduYWwgT3B0aW9uYWwgYEFib3J0U2lnbmFsYCB0byBjYW5jZWwgdGhlIHJlcXVlc3RcbiAgICAgKlxuICAgICAqICoqT2ZmaWNpYWwgcmVmZXJlbmNlOioqIGh0dHBzOi8vY29yZS50ZWxlZ3JhbS5vcmcvYm90cy9hcGkjZWRpdG1lc3NhZ2VyZXBseW1hcmt1cFxuICAgICAqL1xuICAgIGVkaXRNZXNzYWdlUmVwbHlNYXJrdXAoXG4gICAgICAgIG90aGVyPzogT3RoZXI8XG4gICAgICAgICAgICBcImVkaXRNZXNzYWdlUmVwbHlNYXJrdXBcIixcbiAgICAgICAgICAgIFwiY2hhdF9pZFwiIHwgXCJtZXNzYWdlX2lkXCIgfCBcImlubGluZV9tZXNzYWdlX2lkXCJcbiAgICAgICAgPixcbiAgICAgICAgc2lnbmFsPzogQWJvcnRTaWduYWwsXG4gICAgKSB7XG4gICAgICAgIGNvbnN0IGlubGluZUlkID0gdGhpcy5pbmxpbmVNZXNzYWdlSWQ7XG4gICAgICAgIHJldHVybiBpbmxpbmVJZCAhPT0gdW5kZWZpbmVkXG4gICAgICAgICAgICA/IHRoaXMuYXBpLmVkaXRNZXNzYWdlUmVwbHlNYXJrdXBJbmxpbmUoaW5saW5lSWQsIG90aGVyKVxuICAgICAgICAgICAgOiB0aGlzLmFwaS5lZGl0TWVzc2FnZVJlcGx5TWFya3VwKFxuICAgICAgICAgICAgICAgIG9yVGhyb3codGhpcy5jaGF0SWQsIFwiZWRpdE1lc3NhZ2VSZXBseU1hcmt1cFwiKSxcbiAgICAgICAgICAgICAgICBvclRocm93KFxuICAgICAgICAgICAgICAgICAgICB0aGlzLm1zZz8ubWVzc2FnZV9pZCA/PyB0aGlzLm1lc3NhZ2VSZWFjdGlvbj8ubWVzc2FnZV9pZCA/P1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5tZXNzYWdlUmVhY3Rpb25Db3VudD8ubWVzc2FnZV9pZCxcbiAgICAgICAgICAgICAgICAgICAgXCJlZGl0TWVzc2FnZVJlcGx5TWFya3VwXCIsXG4gICAgICAgICAgICAgICAgKSxcbiAgICAgICAgICAgICAgICBvdGhlcixcbiAgICAgICAgICAgICAgICBzaWduYWwsXG4gICAgICAgICAgICApO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIENvbnRleHQtYXdhcmUgYWxpYXMgZm9yIGBhcGkuc3RvcFBvbGxgLiBVc2UgdGhpcyBtZXRob2QgdG8gc3RvcCBhIHBvbGwgd2hpY2ggd2FzIHNlbnQgYnkgdGhlIGJvdC4gT24gc3VjY2VzcywgdGhlIHN0b3BwZWQgUG9sbCBpcyByZXR1cm5lZC5cbiAgICAgKlxuICAgICAqIEBwYXJhbSBvdGhlciBPcHRpb25hbCByZW1haW5pbmcgcGFyYW1ldGVycywgY29uZmVyIHRoZSBvZmZpY2lhbCByZWZlcmVuY2UgYmVsb3dcbiAgICAgKiBAcGFyYW0gc2lnbmFsIE9wdGlvbmFsIGBBYm9ydFNpZ25hbGAgdG8gY2FuY2VsIHRoZSByZXF1ZXN0XG4gICAgICpcbiAgICAgKiAqKk9mZmljaWFsIHJlZmVyZW5jZToqKiBodHRwczovL2NvcmUudGVsZWdyYW0ub3JnL2JvdHMvYXBpI3N0b3Bwb2xsXG4gICAgICovXG4gICAgc3RvcFBvbGwoXG4gICAgICAgIG90aGVyPzogT3RoZXI8XCJzdG9wUG9sbFwiLCBcImNoYXRfaWRcIiB8IFwibWVzc2FnZV9pZFwiPixcbiAgICAgICAgc2lnbmFsPzogQWJvcnRTaWduYWwsXG4gICAgKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmFwaS5zdG9wUG9sbChcbiAgICAgICAgICAgIG9yVGhyb3codGhpcy5jaGF0SWQsIFwic3RvcFBvbGxcIiksXG4gICAgICAgICAgICBvclRocm93KFxuICAgICAgICAgICAgICAgIHRoaXMubXNnPy5tZXNzYWdlX2lkID8/IHRoaXMubWVzc2FnZVJlYWN0aW9uPy5tZXNzYWdlX2lkID8/XG4gICAgICAgICAgICAgICAgICAgIHRoaXMubWVzc2FnZVJlYWN0aW9uQ291bnQ/Lm1lc3NhZ2VfaWQsXG4gICAgICAgICAgICAgICAgXCJzdG9wUG9sbFwiLFxuICAgICAgICAgICAgKSxcbiAgICAgICAgICAgIG90aGVyLFxuICAgICAgICAgICAgc2lnbmFsLFxuICAgICAgICApO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIENvbnRleHQtYXdhcmUgYWxpYXMgZm9yIGBhcGkuZGVsZXRlTWVzc2FnZWAuIFVzZSB0aGlzIG1ldGhvZCB0byBkZWxldGUgYSBtZXNzYWdlLCBpbmNsdWRpbmcgc2VydmljZSBtZXNzYWdlcywgd2l0aCB0aGUgZm9sbG93aW5nIGxpbWl0YXRpb25zOlxuICAgICAqIC0gQSBtZXNzYWdlIGNhbiBvbmx5IGJlIGRlbGV0ZWQgaWYgaXQgd2FzIHNlbnQgbGVzcyB0aGFuIDQ4IGhvdXJzIGFnby5cbiAgICAgKiAtIEEgZGljZSBtZXNzYWdlIGluIGEgcHJpdmF0ZSBjaGF0IGNhbiBvbmx5IGJlIGRlbGV0ZWQgaWYgaXQgd2FzIHNlbnQgbW9yZSB0aGFuIDI0IGhvdXJzIGFnby5cbiAgICAgKiAtIEJvdHMgY2FuIGRlbGV0ZSBvdXRnb2luZyBtZXNzYWdlcyBpbiBwcml2YXRlIGNoYXRzLCBncm91cHMsIGFuZCBzdXBlcmdyb3Vwcy5cbiAgICAgKiAtIEJvdHMgY2FuIGRlbGV0ZSBpbmNvbWluZyBtZXNzYWdlcyBpbiBwcml2YXRlIGNoYXRzLlxuICAgICAqIC0gQm90cyBncmFudGVkIGNhbl9wb3N0X21lc3NhZ2VzIHBlcm1pc3Npb25zIGNhbiBkZWxldGUgb3V0Z29pbmcgbWVzc2FnZXMgaW4gY2hhbm5lbHMuXG4gICAgICogLSBJZiB0aGUgYm90IGlzIGFuIGFkbWluaXN0cmF0b3Igb2YgYSBncm91cCwgaXQgY2FuIGRlbGV0ZSBhbnkgbWVzc2FnZSB0aGVyZS5cbiAgICAgKiAtIElmIHRoZSBib3QgaGFzIGNhbl9kZWxldGVfbWVzc2FnZXMgcGVybWlzc2lvbiBpbiBhIHN1cGVyZ3JvdXAgb3IgYSBjaGFubmVsLCBpdCBjYW4gZGVsZXRlIGFueSBtZXNzYWdlIHRoZXJlLlxuICAgICAqIFJldHVybnMgVHJ1ZSBvbiBzdWNjZXNzLlxuICAgICAqXG4gICAgICogQHBhcmFtIHNpZ25hbCBPcHRpb25hbCBgQWJvcnRTaWduYWxgIHRvIGNhbmNlbCB0aGUgcmVxdWVzdFxuICAgICAqXG4gICAgICogKipPZmZpY2lhbCByZWZlcmVuY2U6KiogaHR0cHM6Ly9jb3JlLnRlbGVncmFtLm9yZy9ib3RzL2FwaSNkZWxldGVtZXNzYWdlXG4gICAgICovXG4gICAgZGVsZXRlTWVzc2FnZShzaWduYWw/OiBBYm9ydFNpZ25hbCkge1xuICAgICAgICByZXR1cm4gdGhpcy5hcGkuZGVsZXRlTWVzc2FnZShcbiAgICAgICAgICAgIG9yVGhyb3codGhpcy5jaGF0SWQsIFwiZGVsZXRlTWVzc2FnZVwiKSxcbiAgICAgICAgICAgIG9yVGhyb3coXG4gICAgICAgICAgICAgICAgdGhpcy5tc2c/Lm1lc3NhZ2VfaWQgPz8gdGhpcy5tZXNzYWdlUmVhY3Rpb24/Lm1lc3NhZ2VfaWQgPz9cbiAgICAgICAgICAgICAgICAgICAgdGhpcy5tZXNzYWdlUmVhY3Rpb25Db3VudD8ubWVzc2FnZV9pZCxcbiAgICAgICAgICAgICAgICBcImRlbGV0ZU1lc3NhZ2VcIixcbiAgICAgICAgICAgICksXG4gICAgICAgICAgICBzaWduYWwsXG4gICAgICAgICk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQ29udGV4dC1hd2FyZSBhbGlhcyBmb3IgYGFwaS5kZWxldGVNZXNzYWdlc2AuIFVzZSB0aGlzIG1ldGhvZCB0byBkZWxldGUgbXVsdGlwbGUgbWVzc2FnZXMgc2ltdWx0YW5lb3VzbHkuIFJldHVybnMgVHJ1ZSBvbiBzdWNjZXNzLlxuICAgICAqXG4gICAgICogQHBhcmFtIGNoYXRfaWQgVW5pcXVlIGlkZW50aWZpZXIgZm9yIHRoZSB0YXJnZXQgY2hhdCBvciB1c2VybmFtZSBvZiB0aGUgdGFyZ2V0IGNoYW5uZWwgKGluIHRoZSBmb3JtYXQgQGNoYW5uZWx1c2VybmFtZSlcbiAgICAgKiBAcGFyYW0gbWVzc2FnZV9pZHMgQSBsaXN0IG9mIDEtMTAwIGlkZW50aWZpZXJzIG9mIG1lc3NhZ2VzIHRvIGRlbGV0ZS4gU2VlIGRlbGV0ZU1lc3NhZ2UgZm9yIGxpbWl0YXRpb25zIG9uIHdoaWNoIG1lc3NhZ2VzIGNhbiBiZSBkZWxldGVkXG4gICAgICogQHBhcmFtIHNpZ25hbCBPcHRpb25hbCBgQWJvcnRTaWduYWxgIHRvIGNhbmNlbCB0aGUgcmVxdWVzdFxuICAgICAqXG4gICAgICogKipPZmZpY2lhbCByZWZlcmVuY2U6KiogaHR0cHM6Ly9jb3JlLnRlbGVncmFtLm9yZy9ib3RzL2FwaSNkZWxldGVtZXNzYWdlc1xuICAgICAqL1xuICAgIGRlbGV0ZU1lc3NhZ2VzKG1lc3NhZ2VfaWRzOiBudW1iZXJbXSwgc2lnbmFsPzogQWJvcnRTaWduYWwpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuYXBpLmRlbGV0ZU1lc3NhZ2VzKFxuICAgICAgICAgICAgb3JUaHJvdyh0aGlzLmNoYXRJZCwgXCJkZWxldGVNZXNzYWdlc1wiKSxcbiAgICAgICAgICAgIG1lc3NhZ2VfaWRzLFxuICAgICAgICAgICAgc2lnbmFsLFxuICAgICAgICApO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIENvbnRleHQtYXdhcmUgYWxpYXMgZm9yIGBhcGkuc2VuZFN0aWNrZXJgLiBVc2UgdGhpcyBtZXRob2QgdG8gc2VuZCBzdGF0aWMgLldFQlAsIGFuaW1hdGVkIC5UR1MsIG9yIHZpZGVvIC5XRUJNIHN0aWNrZXJzLiBPbiBzdWNjZXNzLCB0aGUgc2VudCBNZXNzYWdlIGlzIHJldHVybmVkLlxuICAgICAqXG4gICAgICogQHBhcmFtIHN0aWNrZXIgU3RpY2tlciB0byBzZW5kLiBQYXNzIGEgZmlsZV9pZCBhcyBTdHJpbmcgdG8gc2VuZCBhIGZpbGUgdGhhdCBleGlzdHMgb24gdGhlIFRlbGVncmFtIHNlcnZlcnMgKHJlY29tbWVuZGVkKSwgcGFzcyBhbiBIVFRQIFVSTCBhcyBhIFN0cmluZyBmb3IgVGVsZWdyYW0gdG8gZ2V0IGEgLldFQlAgc3RpY2tlciBmcm9tIHRoZSBJbnRlcm5ldCwgb3IgdXBsb2FkIGEgbmV3IC5XRUJQLCAuVEdTLCBvciAuV0VCTSBzdGlja2VyIHVzaW5nIG11bHRpcGFydC9mb3JtLWRhdGEuIFZpZGVvIGFuZCBhbmltYXRlZCBzdGlja2VycyBjYW4ndCBiZSBzZW50IHZpYSBhbiBIVFRQIFVSTC5cbiAgICAgKiBAcGFyYW0gb3RoZXIgT3B0aW9uYWwgcmVtYWluaW5nIHBhcmFtZXRlcnMsIGNvbmZlciB0aGUgb2ZmaWNpYWwgcmVmZXJlbmNlIGJlbG93XG4gICAgICogQHBhcmFtIHNpZ25hbCBPcHRpb25hbCBgQWJvcnRTaWduYWxgIHRvIGNhbmNlbCB0aGUgcmVxdWVzdFxuICAgICAqXG4gICAgICogKipPZmZpY2lhbCByZWZlcmVuY2U6KiogaHR0cHM6Ly9jb3JlLnRlbGVncmFtLm9yZy9ib3RzL2FwaSNzZW5kc3RpY2tlclxuICAgICAqL1xuICAgIHJlcGx5V2l0aFN0aWNrZXIoXG4gICAgICAgIHN0aWNrZXI6IElucHV0RmlsZSB8IHN0cmluZyxcbiAgICAgICAgb3RoZXI/OiBPdGhlcjxcInNlbmRTdGlja2VyXCIsIFwiY2hhdF9pZFwiIHwgXCJzdGlja2VyXCI+LFxuICAgICAgICBzaWduYWw/OiBBYm9ydFNpZ25hbCxcbiAgICApIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuYXBpLnNlbmRTdGlja2VyKFxuICAgICAgICAgICAgb3JUaHJvdyh0aGlzLmNoYXRJZCwgXCJzZW5kU3RpY2tlclwiKSxcbiAgICAgICAgICAgIHN0aWNrZXIsXG4gICAgICAgICAgICB7IGJ1c2luZXNzX2Nvbm5lY3Rpb25faWQ6IHRoaXMuYnVzaW5lc3NDb25uZWN0aW9uSWQsIC4uLm90aGVyIH0sXG4gICAgICAgICAgICBzaWduYWwsXG4gICAgICAgICk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogVXNlIHRoaXMgbWV0aG9kIHRvIGdldCBpbmZvcm1hdGlvbiBhYm91dCBjdXN0b20gZW1vamkgc3RpY2tlcnMgYnkgdGhlaXIgaWRlbnRpZmllcnMuIFJldHVybnMgYW4gQXJyYXkgb2YgU3RpY2tlciBvYmplY3RzLlxuICAgICAqXG4gICAgICogQHBhcmFtIGN1c3RvbV9lbW9qaV9pZHMgQSBsaXN0IG9mIGN1c3RvbSBlbW9qaSBpZGVudGlmaWVyc1xuICAgICAqIEBwYXJhbSBzaWduYWwgT3B0aW9uYWwgYEFib3J0U2lnbmFsYCB0byBjYW5jZWwgdGhlIHJlcXVlc3RcbiAgICAgKlxuICAgICAqICoqT2ZmaWNpYWwgcmVmZXJlbmNlOioqIGh0dHBzOi8vY29yZS50ZWxlZ3JhbS5vcmcvYm90cy9hcGkjZ2V0Y3VzdG9tZW1vamlzdGlja2Vyc1xuICAgICAqL1xuICAgIGdldEN1c3RvbUVtb2ppU3RpY2tlcnMoc2lnbmFsPzogQWJvcnRTaWduYWwpIHtcbiAgICAgICAgdHlwZSBFbW9qaSA9IE1lc3NhZ2VFbnRpdHkuQ3VzdG9tRW1vamlNZXNzYWdlRW50aXR5O1xuICAgICAgICByZXR1cm4gdGhpcy5hcGkuZ2V0Q3VzdG9tRW1vamlTdGlja2VycyhcbiAgICAgICAgICAgICh0aGlzLm1zZz8uZW50aXRpZXMgPz8gW10pXG4gICAgICAgICAgICAgICAgLmZpbHRlcigoZSk6IGUgaXMgRW1vamkgPT4gZS50eXBlID09PSBcImN1c3RvbV9lbW9qaVwiKVxuICAgICAgICAgICAgICAgIC5tYXAoKGUpID0+IGUuY3VzdG9tX2Vtb2ppX2lkKSxcbiAgICAgICAgICAgIHNpZ25hbCxcbiAgICAgICAgKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBDb250ZXh0LWF3YXJlIGFsaWFzIGZvciBgYXBpLmFuc3dlcklubGluZVF1ZXJ5YC4gVXNlIHRoaXMgbWV0aG9kIHRvIHNlbmQgYW5zd2VycyB0byBhbiBpbmxpbmUgcXVlcnkuIE9uIHN1Y2Nlc3MsIFRydWUgaXMgcmV0dXJuZWQuXG4gICAgICogTm8gbW9yZSB0aGFuIDUwIHJlc3VsdHMgcGVyIHF1ZXJ5IGFyZSBhbGxvd2VkLlxuICAgICAqXG4gICAgICogRXhhbXBsZTogQW4gaW5saW5lIGJvdCB0aGF0IHNlbmRzIFlvdVR1YmUgdmlkZW9zIGNhbiBhc2sgdGhlIHVzZXIgdG8gY29ubmVjdCB0aGUgYm90IHRvIHRoZWlyIFlvdVR1YmUgYWNjb3VudCB0byBhZGFwdCBzZWFyY2ggcmVzdWx0cyBhY2NvcmRpbmdseS4gVG8gZG8gdGhpcywgaXQgZGlzcGxheXMgYSAnQ29ubmVjdCB5b3VyIFlvdVR1YmUgYWNjb3VudCcgYnV0dG9uIGFib3ZlIHRoZSByZXN1bHRzLCBvciBldmVuIGJlZm9yZSBzaG93aW5nIGFueS4gVGhlIHVzZXIgcHJlc3NlcyB0aGUgYnV0dG9uLCBzd2l0Y2hlcyB0byBhIHByaXZhdGUgY2hhdCB3aXRoIHRoZSBib3QgYW5kLCBpbiBkb2luZyBzbywgcGFzc2VzIGEgc3RhcnQgcGFyYW1ldGVyIHRoYXQgaW5zdHJ1Y3RzIHRoZSBib3QgdG8gcmV0dXJuIGFuIE9BdXRoIGxpbmsuIE9uY2UgZG9uZSwgdGhlIGJvdCBjYW4gb2ZmZXIgYSBzd2l0Y2hfaW5saW5lIGJ1dHRvbiBzbyB0aGF0IHRoZSB1c2VyIGNhbiBlYXNpbHkgcmV0dXJuIHRvIHRoZSBjaGF0IHdoZXJlIHRoZXkgd2FudGVkIHRvIHVzZSB0aGUgYm90J3MgaW5saW5lIGNhcGFiaWxpdGllcy5cbiAgICAgKlxuICAgICAqIEBwYXJhbSByZXN1bHRzIEFuIGFycmF5IG9mIHJlc3VsdHMgZm9yIHRoZSBpbmxpbmUgcXVlcnlcbiAgICAgKiBAcGFyYW0gb3RoZXIgT3B0aW9uYWwgcmVtYWluaW5nIHBhcmFtZXRlcnMsIGNvbmZlciB0aGUgb2ZmaWNpYWwgcmVmZXJlbmNlIGJlbG93XG4gICAgICogQHBhcmFtIHNpZ25hbCBPcHRpb25hbCBgQWJvcnRTaWduYWxgIHRvIGNhbmNlbCB0aGUgcmVxdWVzdFxuICAgICAqXG4gICAgICogKipPZmZpY2lhbCByZWZlcmVuY2U6KiogaHR0cHM6Ly9jb3JlLnRlbGVncmFtLm9yZy9ib3RzL2FwaSNhbnN3ZXJpbmxpbmVxdWVyeVxuICAgICAqL1xuICAgIGFuc3dlcklubGluZVF1ZXJ5KFxuICAgICAgICByZXN1bHRzOiByZWFkb25seSBJbmxpbmVRdWVyeVJlc3VsdFtdLFxuICAgICAgICBvdGhlcj86IE90aGVyPFwiYW5zd2VySW5saW5lUXVlcnlcIiwgXCJpbmxpbmVfcXVlcnlfaWRcIiB8IFwicmVzdWx0c1wiPixcbiAgICAgICAgc2lnbmFsPzogQWJvcnRTaWduYWwsXG4gICAgKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmFwaS5hbnN3ZXJJbmxpbmVRdWVyeShcbiAgICAgICAgICAgIG9yVGhyb3codGhpcy5pbmxpbmVRdWVyeSwgXCJhbnN3ZXJJbmxpbmVRdWVyeVwiKS5pZCxcbiAgICAgICAgICAgIHJlc3VsdHMsXG4gICAgICAgICAgICBvdGhlcixcbiAgICAgICAgICAgIHNpZ25hbCxcbiAgICAgICAgKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBDb250ZXh0LWF3YXJlIGFsaWFzIGZvciBgYXBpLnNlbmRJbnZvaWNlYC4gVXNlIHRoaXMgbWV0aG9kIHRvIHNlbmQgaW52b2ljZXMuIE9uIHN1Y2Nlc3MsIHRoZSBzZW50IE1lc3NhZ2UgaXMgcmV0dXJuZWQuXG4gICAgICpcbiAgICAgKiBAcGFyYW0gdGl0bGUgUHJvZHVjdCBuYW1lLCAxLTMyIGNoYXJhY3RlcnNcbiAgICAgKiBAcGFyYW0gZGVzY3JpcHRpb24gUHJvZHVjdCBkZXNjcmlwdGlvbiwgMS0yNTUgY2hhcmFjdGVyc1xuICAgICAqIEBwYXJhbSBwYXlsb2FkIEJvdC1kZWZpbmVkIGludm9pY2UgcGF5bG9hZCwgMS0xMjggYnl0ZXMuIFRoaXMgd2lsbCBub3QgYmUgZGlzcGxheWVkIHRvIHRoZSB1c2VyLCB1c2UgZm9yIHlvdXIgaW50ZXJuYWwgcHJvY2Vzc2VzLlxuICAgICAqIEBwYXJhbSBjdXJyZW5jeSBUaHJlZS1sZXR0ZXIgSVNPIDQyMTcgY3VycmVuY3kgY29kZSwgc2VlIG1vcmUgb24gY3VycmVuY2llc1xuICAgICAqIEBwYXJhbSBwcmljZXMgUHJpY2UgYnJlYWtkb3duLCBhIGxpc3Qgb2YgY29tcG9uZW50cyAoZS5nLiBwcm9kdWN0IHByaWNlLCB0YXgsIGRpc2NvdW50LCBkZWxpdmVyeSBjb3N0LCBkZWxpdmVyeSB0YXgsIGJvbnVzLCBldGMuKVxuICAgICAqIEBwYXJhbSBvdGhlciBPcHRpb25hbCByZW1haW5pbmcgcGFyYW1ldGVycywgY29uZmVyIHRoZSBvZmZpY2lhbCByZWZlcmVuY2UgYmVsb3dcbiAgICAgKiBAcGFyYW0gc2lnbmFsIE9wdGlvbmFsIGBBYm9ydFNpZ25hbGAgdG8gY2FuY2VsIHRoZSByZXF1ZXN0XG4gICAgICpcbiAgICAgKiAqKk9mZmljaWFsIHJlZmVyZW5jZToqKiBodHRwczovL2NvcmUudGVsZWdyYW0ub3JnL2JvdHMvYXBpI3NlbmRpbnZvaWNlXG4gICAgICovXG4gICAgcmVwbHlXaXRoSW52b2ljZShcbiAgICAgICAgdGl0bGU6IHN0cmluZyxcbiAgICAgICAgZGVzY3JpcHRpb246IHN0cmluZyxcbiAgICAgICAgcGF5bG9hZDogc3RyaW5nLFxuICAgICAgICBjdXJyZW5jeTogc3RyaW5nLFxuICAgICAgICBwcmljZXM6IHJlYWRvbmx5IExhYmVsZWRQcmljZVtdLFxuICAgICAgICBvdGhlcj86IE90aGVyPFxuICAgICAgICAgICAgXCJzZW5kSW52b2ljZVwiLFxuICAgICAgICAgICAgfCBcImNoYXRfaWRcIlxuICAgICAgICAgICAgfCBcInRpdGxlXCJcbiAgICAgICAgICAgIHwgXCJkZXNjcmlwdGlvblwiXG4gICAgICAgICAgICB8IFwicGF5bG9hZFwiXG4gICAgICAgICAgICB8IFwiY3VycmVuY3lcIlxuICAgICAgICAgICAgfCBcInByaWNlc1wiXG4gICAgICAgID4sXG4gICAgICAgIHNpZ25hbD86IEFib3J0U2lnbmFsLFxuICAgICkge1xuICAgICAgICByZXR1cm4gdGhpcy5hcGkuc2VuZEludm9pY2UoXG4gICAgICAgICAgICBvclRocm93KHRoaXMuY2hhdElkLCBcInNlbmRJbnZvaWNlXCIpLFxuICAgICAgICAgICAgdGl0bGUsXG4gICAgICAgICAgICBkZXNjcmlwdGlvbixcbiAgICAgICAgICAgIHBheWxvYWQsXG4gICAgICAgICAgICBjdXJyZW5jeSxcbiAgICAgICAgICAgIHByaWNlcyxcbiAgICAgICAgICAgIG90aGVyLFxuICAgICAgICAgICAgc2lnbmFsLFxuICAgICAgICApO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIENvbnRleHQtYXdhcmUgYWxpYXMgZm9yIGBhcGkuYW5zd2VyU2hpcHBpbmdRdWVyeWAuIElmIHlvdSBzZW50IGFuIGludm9pY2UgcmVxdWVzdGluZyBhIHNoaXBwaW5nIGFkZHJlc3MgYW5kIHRoZSBwYXJhbWV0ZXIgaXNfZmxleGlibGUgd2FzIHNwZWNpZmllZCwgdGhlIEJvdCBBUEkgd2lsbCBzZW5kIGFuIFVwZGF0ZSB3aXRoIGEgc2hpcHBpbmdfcXVlcnkgZmllbGQgdG8gdGhlIGJvdC4gVXNlIHRoaXMgbWV0aG9kIHRvIHJlcGx5IHRvIHNoaXBwaW5nIHF1ZXJpZXMuIE9uIHN1Y2Nlc3MsIFRydWUgaXMgcmV0dXJuZWQuXG4gICAgICpcbiAgICAgKiBAcGFyYW0gc2hpcHBpbmdfcXVlcnlfaWQgVW5pcXVlIGlkZW50aWZpZXIgZm9yIHRoZSBxdWVyeSB0byBiZSBhbnN3ZXJlZFxuICAgICAqIEBwYXJhbSBvayBQYXNzIFRydWUgaWYgZGVsaXZlcnkgdG8gdGhlIHNwZWNpZmllZCBhZGRyZXNzIGlzIHBvc3NpYmxlIGFuZCBGYWxzZSBpZiB0aGVyZSBhcmUgYW55IHByb2JsZW1zIChmb3IgZXhhbXBsZSwgaWYgZGVsaXZlcnkgdG8gdGhlIHNwZWNpZmllZCBhZGRyZXNzIGlzIG5vdCBwb3NzaWJsZSlcbiAgICAgKiBAcGFyYW0gb3RoZXIgT3B0aW9uYWwgcmVtYWluaW5nIHBhcmFtZXRlcnMsIGNvbmZlciB0aGUgb2ZmaWNpYWwgcmVmZXJlbmNlIGJlbG93XG4gICAgICogQHBhcmFtIHNpZ25hbCBPcHRpb25hbCBgQWJvcnRTaWduYWxgIHRvIGNhbmNlbCB0aGUgcmVxdWVzdFxuICAgICAqXG4gICAgICogKipPZmZpY2lhbCByZWZlcmVuY2U6KiogaHR0cHM6Ly9jb3JlLnRlbGVncmFtLm9yZy9ib3RzL2FwaSNhbnN3ZXJzaGlwcGluZ3F1ZXJ5XG4gICAgICovXG4gICAgYW5zd2VyU2hpcHBpbmdRdWVyeShcbiAgICAgICAgb2s6IGJvb2xlYW4sXG4gICAgICAgIG90aGVyPzogT3RoZXI8XCJhbnN3ZXJTaGlwcGluZ1F1ZXJ5XCIsIFwic2hpcHBpbmdfcXVlcnlfaWRcIiB8IFwib2tcIj4sXG4gICAgICAgIHNpZ25hbD86IEFib3J0U2lnbmFsLFxuICAgICkge1xuICAgICAgICByZXR1cm4gdGhpcy5hcGkuYW5zd2VyU2hpcHBpbmdRdWVyeShcbiAgICAgICAgICAgIG9yVGhyb3codGhpcy5zaGlwcGluZ1F1ZXJ5LCBcImFuc3dlclNoaXBwaW5nUXVlcnlcIikuaWQsXG4gICAgICAgICAgICBvayxcbiAgICAgICAgICAgIG90aGVyLFxuICAgICAgICAgICAgc2lnbmFsLFxuICAgICAgICApO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIENvbnRleHQtYXdhcmUgYWxpYXMgZm9yIGBhcGkuYW5zd2VyUHJlQ2hlY2tvdXRRdWVyeWAuIE9uY2UgdGhlIHVzZXIgaGFzIGNvbmZpcm1lZCB0aGVpciBwYXltZW50IGFuZCBzaGlwcGluZyBkZXRhaWxzLCB0aGUgQm90IEFQSSBzZW5kcyB0aGUgZmluYWwgY29uZmlybWF0aW9uIGluIHRoZSBmb3JtIG9mIGFuIFVwZGF0ZSB3aXRoIHRoZSBmaWVsZCBwcmVfY2hlY2tvdXRfcXVlcnkuIFVzZSB0aGlzIG1ldGhvZCB0byByZXNwb25kIHRvIHN1Y2ggcHJlLWNoZWNrb3V0IHF1ZXJpZXMuIE9uIHN1Y2Nlc3MsIFRydWUgaXMgcmV0dXJuZWQuIE5vdGU6IFRoZSBCb3QgQVBJIG11c3QgcmVjZWl2ZSBhbiBhbnN3ZXIgd2l0aGluIDEwIHNlY29uZHMgYWZ0ZXIgdGhlIHByZS1jaGVja291dCBxdWVyeSB3YXMgc2VudC5cbiAgICAgKlxuICAgICAqIEBwYXJhbSBvayBTcGVjaWZ5IFRydWUgaWYgZXZlcnl0aGluZyBpcyBhbHJpZ2h0IChnb29kcyBhcmUgYXZhaWxhYmxlLCBldGMuKSBhbmQgdGhlIGJvdCBpcyByZWFkeSB0byBwcm9jZWVkIHdpdGggdGhlIG9yZGVyLiBVc2UgRmFsc2UgaWYgdGhlcmUgYXJlIGFueSBwcm9ibGVtcy5cbiAgICAgKiBAcGFyYW0gb3RoZXIgT3B0aW9uYWwgcmVtYWluaW5nIHBhcmFtZXRlcnMsIGNvbmZlciB0aGUgb2ZmaWNpYWwgcmVmZXJlbmNlIGJlbG93XG4gICAgICogQHBhcmFtIHNpZ25hbCBPcHRpb25hbCBgQWJvcnRTaWduYWxgIHRvIGNhbmNlbCB0aGUgcmVxdWVzdFxuICAgICAqXG4gICAgICogKipPZmZpY2lhbCByZWZlcmVuY2U6KiogaHR0cHM6Ly9jb3JlLnRlbGVncmFtLm9yZy9ib3RzL2FwaSNhbnN3ZXJwcmVjaGVja291dHF1ZXJ5XG4gICAgICovXG4gICAgYW5zd2VyUHJlQ2hlY2tvdXRRdWVyeShcbiAgICAgICAgb2s6IGJvb2xlYW4sXG4gICAgICAgIG90aGVyPzpcbiAgICAgICAgICAgIHwgc3RyaW5nXG4gICAgICAgICAgICB8IE90aGVyPFwiYW5zd2VyUHJlQ2hlY2tvdXRRdWVyeVwiLCBcInByZV9jaGVja291dF9xdWVyeV9pZFwiIHwgXCJva1wiPixcbiAgICAgICAgc2lnbmFsPzogQWJvcnRTaWduYWwsXG4gICAgKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmFwaS5hbnN3ZXJQcmVDaGVja291dFF1ZXJ5KFxuICAgICAgICAgICAgb3JUaHJvdyh0aGlzLnByZUNoZWNrb3V0UXVlcnksIFwiYW5zd2VyUHJlQ2hlY2tvdXRRdWVyeVwiKS5pZCxcbiAgICAgICAgICAgIG9rLFxuICAgICAgICAgICAgdHlwZW9mIG90aGVyID09PSBcInN0cmluZ1wiID8geyBlcnJvcl9tZXNzYWdlOiBvdGhlciB9IDogb3RoZXIsXG4gICAgICAgICAgICBzaWduYWwsXG4gICAgICAgICk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQ29udGV4dC1hd2FyZSBhbGlhcyBmb3IgYGFwaS5yZWZ1bmRTdGFyUGF5bWVudGAuIFJlZnVuZHMgYSBzdWNjZXNzZnVsIHBheW1lbnQgaW4gVGVsZWdyYW0gU3RhcnMuXG4gICAgICpcbiAgICAgKiBAcGFyYW0gc2lnbmFsIE9wdGlvbmFsIGBBYm9ydFNpZ25hbGAgdG8gY2FuY2VsIHRoZSByZXF1ZXN0XG4gICAgICpcbiAgICAgKiAqKk9mZmljaWFsIHJlZmVyZW5jZToqKiBodHRwczovL2NvcmUudGVsZWdyYW0ub3JnL2JvdHMvYXBpI3JlZnVuZHN0YXJwYXltZW50XG4gICAgICovXG4gICAgcmVmdW5kU3RhclBheW1lbnQoc2lnbmFsPzogQWJvcnRTaWduYWwpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuYXBpLnJlZnVuZFN0YXJQYXltZW50KFxuICAgICAgICAgICAgb3JUaHJvdyh0aGlzLmZyb20sIFwicmVmdW5kU3RhclBheW1lbnRcIikuaWQsXG4gICAgICAgICAgICBvclRocm93KHRoaXMubXNnPy5zdWNjZXNzZnVsX3BheW1lbnQsIFwicmVmdW5kU3RhclBheW1lbnRcIilcbiAgICAgICAgICAgICAgICAudGVsZWdyYW1fcGF5bWVudF9jaGFyZ2VfaWQsXG4gICAgICAgICAgICBzaWduYWwsXG4gICAgICAgICk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQ29udGV4dC1hd2FyZSBhbGlhcyBmb3IgYGFwaS5zZXRQYXNzcG9ydERhdGFFcnJvcnNgLiBJbmZvcm1zIGEgdXNlciB0aGF0IHNvbWUgb2YgdGhlIFRlbGVncmFtIFBhc3Nwb3J0IGVsZW1lbnRzIHRoZXkgcHJvdmlkZWQgY29udGFpbnMgZXJyb3JzLiBUaGUgdXNlciB3aWxsIG5vdCBiZSBhYmxlIHRvIHJlLXN1Ym1pdCB0aGVpciBQYXNzcG9ydCB0byB5b3UgdW50aWwgdGhlIGVycm9ycyBhcmUgZml4ZWQgKHRoZSBjb250ZW50cyBvZiB0aGUgZmllbGQgZm9yIHdoaWNoIHlvdSByZXR1cm5lZCB0aGUgZXJyb3IgbXVzdCBjaGFuZ2UpLiBSZXR1cm5zIFRydWUgb24gc3VjY2Vzcy5cbiAgICAgKlxuICAgICAqIFVzZSB0aGlzIGlmIHRoZSBkYXRhIHN1Ym1pdHRlZCBieSB0aGUgdXNlciBkb2Vzbid0IHNhdGlzZnkgdGhlIHN0YW5kYXJkcyB5b3VyIHNlcnZpY2UgcmVxdWlyZXMgZm9yIGFueSByZWFzb24uIEZvciBleGFtcGxlLCBpZiBhIGJpcnRoZGF5IGRhdGUgc2VlbXMgaW52YWxpZCwgYSBzdWJtaXR0ZWQgZG9jdW1lbnQgaXMgYmx1cnJ5LCBhIHNjYW4gc2hvd3MgZXZpZGVuY2Ugb2YgdGFtcGVyaW5nLCBldGMuIFN1cHBseSBzb21lIGRldGFpbHMgaW4gdGhlIGVycm9yIG1lc3NhZ2UgdG8gbWFrZSBzdXJlIHRoZSB1c2VyIGtub3dzIGhvdyB0byBjb3JyZWN0IHRoZSBpc3N1ZXMuXG4gICAgICpcbiAgICAgKiBAcGFyYW0gZXJyb3JzIEFuIGFycmF5IGRlc2NyaWJpbmcgdGhlIGVycm9yc1xuICAgICAqIEBwYXJhbSBzaWduYWwgT3B0aW9uYWwgYEFib3J0U2lnbmFsYCB0byBjYW5jZWwgdGhlIHJlcXVlc3RcbiAgICAgKlxuICAgICAqICoqT2ZmaWNpYWwgcmVmZXJlbmNlOioqIGh0dHBzOi8vY29yZS50ZWxlZ3JhbS5vcmcvYm90cy9hcGkjc2V0cGFzc3BvcnRkYXRhZXJyb3JzXG4gICAgICovXG4gICAgc2V0UGFzc3BvcnREYXRhRXJyb3JzKFxuICAgICAgICBlcnJvcnM6IHJlYWRvbmx5IFBhc3Nwb3J0RWxlbWVudEVycm9yW10sXG4gICAgICAgIHNpZ25hbD86IEFib3J0U2lnbmFsLFxuICAgICkge1xuICAgICAgICByZXR1cm4gdGhpcy5hcGkuc2V0UGFzc3BvcnREYXRhRXJyb3JzKFxuICAgICAgICAgICAgb3JUaHJvdyh0aGlzLmZyb20sIFwic2V0UGFzc3BvcnREYXRhRXJyb3JzXCIpLmlkLFxuICAgICAgICAgICAgZXJyb3JzLFxuICAgICAgICAgICAgc2lnbmFsLFxuICAgICAgICApO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIENvbnRleHQtYXdhcmUgYWxpYXMgZm9yIGBhcGkuc2VuZEdhbWVgLiBVc2UgdGhpcyBtZXRob2QgdG8gc2VuZCBhIGdhbWUuIE9uIHN1Y2Nlc3MsIHRoZSBzZW50IE1lc3NhZ2UgaXMgcmV0dXJuZWQuXG4gICAgICpcbiAgICAgKiBAcGFyYW0gZ2FtZV9zaG9ydF9uYW1lIFNob3J0IG5hbWUgb2YgdGhlIGdhbWUsIHNlcnZlcyBhcyB0aGUgdW5pcXVlIGlkZW50aWZpZXIgZm9yIHRoZSBnYW1lLiBTZXQgdXAgeW91ciBnYW1lcyB2aWEgQm90RmF0aGVyLlxuICAgICAqIEBwYXJhbSBvdGhlciBPcHRpb25hbCByZW1haW5pbmcgcGFyYW1ldGVycywgY29uZmVyIHRoZSBvZmZpY2lhbCByZWZlcmVuY2UgYmVsb3dcbiAgICAgKiBAcGFyYW0gc2lnbmFsIE9wdGlvbmFsIGBBYm9ydFNpZ25hbGAgdG8gY2FuY2VsIHRoZSByZXF1ZXN0XG4gICAgICpcbiAgICAgKiAqKk9mZmljaWFsIHJlZmVyZW5jZToqKiBodHRwczovL2NvcmUudGVsZWdyYW0ub3JnL2JvdHMvYXBpI3NlbmRnYW1lXG4gICAgICovXG4gICAgcmVwbHlXaXRoR2FtZShcbiAgICAgICAgZ2FtZV9zaG9ydF9uYW1lOiBzdHJpbmcsXG4gICAgICAgIG90aGVyPzogT3RoZXI8XCJzZW5kR2FtZVwiLCBcImNoYXRfaWRcIiB8IFwiZ2FtZV9zaG9ydF9uYW1lXCI+LFxuICAgICAgICBzaWduYWw/OiBBYm9ydFNpZ25hbCxcbiAgICApIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuYXBpLnNlbmRHYW1lKFxuICAgICAgICAgICAgb3JUaHJvdyh0aGlzLmNoYXRJZCwgXCJzZW5kR2FtZVwiKSxcbiAgICAgICAgICAgIGdhbWVfc2hvcnRfbmFtZSxcbiAgICAgICAgICAgIHsgYnVzaW5lc3NfY29ubmVjdGlvbl9pZDogdGhpcy5idXNpbmVzc0Nvbm5lY3Rpb25JZCwgLi4ub3RoZXIgfSxcbiAgICAgICAgICAgIHNpZ25hbCxcbiAgICAgICAgKTtcbiAgICB9XG59XG5cbi8vID09PSBGaWx0ZXJlZCBjb250ZXh0IHR5cGVzXG50eXBlIEhlYXJzQ29udGV4dENvcmUgPVxuICAgICYgRmlsdGVyQ29yZTxcIjp0ZXh0XCIgfCBcIjpjYXB0aW9uXCI+XG4gICAgJiBOYXJyb3dNYXRjaENvcmU8c3RyaW5nIHwgUmVnRXhwTWF0Y2hBcnJheT47XG4vKipcbiAqIFR5cGUgb2YgdGhlIGNvbnRleHQgb2JqZWN0IHRoYXQgaXMgYXZhaWxhYmxlIGluc2lkZSB0aGUgaGFuZGxlcnMgZm9yXG4gKiBgYm90LmhlYXJzYC5cbiAqXG4gKiBUaGlzIGhlbHBlciB0eXBlIGNhbiBiZSB1c2VkIHRvIG5hcnJvdyBkb3duIGNvbnRleHQgb2JqZWN0cyB0aGUgc2FtZSB3YXkgaG93XG4gKiBgYm90LmhlYXJzYCBkb2VzIGl0LiBUaGlzIGFsbG93cyB5b3UgdG8gYW5ub3RhdGUgY29udGV4dCBvYmplY3RzIGluXG4gKiBtaWRkbGV3YXJlIHRoYXQgaXMgbm90IGRpcmVjdGx5IHBhc3NlZCB0byBgYm90LmhlYXJzYCwgaGVuY2Ugbm90IGluZmVycmluZ1xuICogdGhlIGNvcnJlY3QgdHlwZSBhdXRvbWF0aWNhbGx5LiBUaGF0IHdheSwgaGFuZGxlcnMgY2FuIGJlIGRlZmluZWQgaW4gc2VwYXJhdGVcbiAqIGZpbGVzIGFuZCBzdGlsbCBoYXZlIHRoZSBjb3JyZWN0IHR5cGVzLlxuICovXG5leHBvcnQgdHlwZSBIZWFyc0NvbnRleHQ8QyBleHRlbmRzIENvbnRleHQ+ID0gRmlsdGVyPFxuICAgIE5hcnJvd01hdGNoPEMsIHN0cmluZyB8IFJlZ0V4cE1hdGNoQXJyYXk+LFxuICAgIFwiOnRleHRcIiB8IFwiOmNhcHRpb25cIlxuPjtcblxudHlwZSBDb21tYW5kQ29udGV4dENvcmUgPVxuICAgICYgRmlsdGVyQ29yZTxcIjplbnRpdGllczpib3RfY29tbWFuZFwiPlxuICAgICYgTmFycm93TWF0Y2hDb3JlPHN0cmluZz47XG4vKipcbiAqIFR5cGUgb2YgdGhlIGNvbnRleHQgb2JqZWN0IHRoYXQgaXMgYXZhaWxhYmxlIGluc2lkZSB0aGUgaGFuZGxlcnMgZm9yXG4gKiBgYm90LmNvbW1hbmRgLlxuICpcbiAqIFRoaXMgaGVscGVyIHR5cGUgY2FuIGJlIHVzZWQgdG8gbmFycm93IGRvd24gY29udGV4dCBvYmplY3RzIHRoZSBzYW1lIHdheSBob3dcbiAqIGBib3QuY29tbWFuZGAgZG9lcyBpdC4gVGhpcyBhbGxvd3MgeW91IHRvIGFubm90YXRlIGNvbnRleHQgb2JqZWN0cyBpblxuICogbWlkZGxld2FyZSB0aGF0IGlzIG5vdCBkaXJlY3RseSBwYXNzZWQgdG8gYGJvdC5jb21tYW5kYCwgaGVuY2Ugbm90IGluZmVycmluZ1xuICogdGhlIGNvcnJlY3QgdHlwZSBhdXRvbWF0aWNhbGx5LiBUaGF0IHdheSwgaGFuZGxlcnMgY2FuIGJlIGRlZmluZWQgaW4gc2VwYXJhdGVcbiAqIGZpbGVzIGFuZCBzdGlsbCBoYXZlIHRoZSBjb3JyZWN0IHR5cGVzLlxuICovXG5leHBvcnQgdHlwZSBDb21tYW5kQ29udGV4dDxDIGV4dGVuZHMgQ29udGV4dD4gPSBGaWx0ZXI8XG4gICAgTmFycm93TWF0Y2g8Qywgc3RyaW5nPixcbiAgICBcIjplbnRpdGllczpib3RfY29tbWFuZFwiXG4+O1xudHlwZSBOYXJyb3dNYXRjaENvcmU8VCBleHRlbmRzIENvbnRleHRbXCJtYXRjaFwiXT4gPSB7IG1hdGNoOiBUIH07XG50eXBlIE5hcnJvd01hdGNoPEMgZXh0ZW5kcyBDb250ZXh0LCBUIGV4dGVuZHMgQ1tcIm1hdGNoXCJdPiA9IHtcbiAgICBbSyBpbiBrZXlvZiBDXTogSyBleHRlbmRzIFwibWF0Y2hcIiA/IChUIGV4dGVuZHMgQ1tLXSA/IFQgOiBuZXZlcikgOiBDW0tdO1xufTtcblxudHlwZSBDYWxsYmFja1F1ZXJ5Q29udGV4dENvcmUgPSBGaWx0ZXJDb3JlPFwiY2FsbGJhY2tfcXVlcnk6ZGF0YVwiPjtcbi8qKlxuICogVHlwZSBvZiB0aGUgY29udGV4dCBvYmplY3QgdGhhdCBpcyBhdmFpbGFibGUgaW5zaWRlIHRoZSBoYW5kbGVycyBmb3JcbiAqIGBib3QuY2FsbGJhY2tRdWVyeWAuXG4gKlxuICogVGhpcyBoZWxwZXIgdHlwZSBjYW4gYmUgdXNlZCB0byBhbm5vdGF0ZSBuYXJyb3cgZG93biBjb250ZXh0IG9iamVjdHMgdGhlIHNhbWVcbiAqIHdheSBgYm90LmNhbGxiYWNrUXVlcnlgIGRvZXMgaXQuIFRoaXMgYWxsb3dzIHlvdSB0byBob3cgY29udGV4dCBvYmplY3RzIGluXG4gKiBtaWRkbGV3YXJlIHRoYXQgaXMgbm90IGRpcmVjdGx5IHBhc3NlZCB0byBgYm90LmNhbGxiYWNrUXVlcnlgLCBoZW5jZSBub3RcbiAqIGluZmVycmluZyB0aGUgY29ycmVjdCB0eXBlIGF1dG9tYXRpY2FsbHkuIFRoYXQgd2F5LCBoYW5kbGVycyBjYW4gYmUgZGVmaW5lZFxuICogaW4gc2VwYXJhdGUgZmlsZXMgYW5kIHN0aWxsIGhhdmUgdGhlIGNvcnJlY3QgdHlwZXMuXG4gKi9cbmV4cG9ydCB0eXBlIENhbGxiYWNrUXVlcnlDb250ZXh0PEMgZXh0ZW5kcyBDb250ZXh0PiA9IEZpbHRlcjxcbiAgICBOYXJyb3dNYXRjaDxDLCBzdHJpbmcgfCBSZWdFeHBNYXRjaEFycmF5PixcbiAgICBcImNhbGxiYWNrX3F1ZXJ5OmRhdGFcIlxuPjtcblxudHlwZSBHYW1lUXVlcnlDb250ZXh0Q29yZSA9IEZpbHRlckNvcmU8XCJjYWxsYmFja19xdWVyeTpnYW1lX3Nob3J0X25hbWVcIj47XG4vKipcbiAqIFR5cGUgb2YgdGhlIGNvbnRleHQgb2JqZWN0IHRoYXQgaXMgYXZhaWxhYmxlIGluc2lkZSB0aGUgaGFuZGxlcnMgZm9yXG4gKiBgYm90LmdhbWVRdWVyeWAuXG4gKlxuICogVGhpcyBoZWxwZXIgdHlwZSBjYW4gYmUgdXNlZCB0byBuYXJyb3cgZG93biBjb250ZXh0IG9iamVjdHMgdGhlIHNhbWUgd2F5IGhvd1xuICogYGJvdC5nYW1lUXVlcnlgIGRvZXMgaXQuIFRoaXMgYWxsb3dzIHlvdSB0byBhbm5vdGF0ZSBjb250ZXh0IG9iamVjdHMgaW5cbiAqIG1pZGRsZXdhcmUgdGhhdCBpcyBub3QgZGlyZWN0bHkgcGFzc2VkIHRvIGBib3QuZ2FtZVF1ZXJ5YCwgaGVuY2Ugbm90XG4gKiBpbmZlcnJpbmcgdGhlIGNvcnJlY3QgdHlwZSBhdXRvbWF0aWNhbGx5LiBUaGF0IHdheSwgaGFuZGxlcnMgY2FuIGJlIGRlZmluZWRcbiAqIGluIHNlcGFyYXRlIGZpbGVzIGFuZCBzdGlsbCBoYXZlIHRoZSBjb3JyZWN0IHR5cGVzLlxuICovXG5leHBvcnQgdHlwZSBHYW1lUXVlcnlDb250ZXh0PEMgZXh0ZW5kcyBDb250ZXh0PiA9IEZpbHRlcjxcbiAgICBOYXJyb3dNYXRjaDxDLCBzdHJpbmcgfCBSZWdFeHBNYXRjaEFycmF5PixcbiAgICBcImNhbGxiYWNrX3F1ZXJ5OmdhbWVfc2hvcnRfbmFtZVwiXG4+O1xuXG50eXBlIElubGluZVF1ZXJ5Q29udGV4dENvcmUgPSBGaWx0ZXJDb3JlPFwiaW5saW5lX3F1ZXJ5XCI+O1xuLyoqXG4gKiBUeXBlIG9mIHRoZSBjb250ZXh0IG9iamVjdCB0aGF0IGlzIGF2YWlsYWJsZSBpbnNpZGUgdGhlIGhhbmRsZXJzIGZvclxuICogYGJvdC5pbmxpbmVRdWVyeWAuXG4gKlxuICogVGhpcyBoZWxwZXIgdHlwZSBjYW4gYmUgdXNlZCB0byBuYXJyb3cgZG93biBjb250ZXh0IG9iamVjdHMgdGhlIHNhbWUgd2F5IGhvd1xuICogYW5ub3RhdGUgYGJvdC5pbmxpbmVRdWVyeWAgZG9lcyBpdC4gVGhpcyBhbGxvd3MgeW91IHRvIGNvbnRleHQgb2JqZWN0cyBpblxuICogbWlkZGxld2FyZSB0aGF0IGlzIG5vdCBkaXJlY3RseSBwYXNzZWQgdG8gYGJvdC5pbmxpbmVRdWVyeWAsIGhlbmNlIG5vdFxuICogaW5mZXJyaW5nIHRoZSBjb3JyZWN0IHR5cGUgYXV0b21hdGljYWxseS4gVGhhdCB3YXksIGhhbmRsZXJzIGNhbiBiZSBkZWZpbmVkXG4gKiBpbiBzZXBhcmF0ZSBmaWxlcyBhbmQgc3RpbGwgaGF2ZSB0aGUgY29ycmVjdCB0eXBlcy5cbiAqL1xuZXhwb3J0IHR5cGUgSW5saW5lUXVlcnlDb250ZXh0PEMgZXh0ZW5kcyBDb250ZXh0PiA9IEZpbHRlcjxcbiAgICBOYXJyb3dNYXRjaDxDLCBzdHJpbmcgfCBSZWdFeHBNYXRjaEFycmF5PixcbiAgICBcImlubGluZV9xdWVyeVwiXG4+O1xuXG50eXBlIFJlYWN0aW9uQ29udGV4dENvcmUgPSBGaWx0ZXJDb3JlPFwibWVzc2FnZV9yZWFjdGlvblwiPjtcbi8qKlxuICogVHlwZSBvZiB0aGUgY29udGV4dCBvYmplY3QgdGhhdCBpcyBhdmFpbGFibGUgaW5zaWRlIHRoZSBoYW5kbGVycyBmb3JcbiAqIGBib3QucmVhY3Rpb25gLlxuICpcbiAqIFRoaXMgaGVscGVyIHR5cGUgY2FuIGJlIHVzZWQgdG8gbmFycm93IGRvd24gY29udGV4dCBvYmplY3RzIHRoZSBzYW1lIHdheSBob3dcbiAqIGFubm90YXRlIGBib3QucmVhY3Rpb25gIGRvZXMgaXQuIFRoaXMgYWxsb3dzIHlvdSB0byBjb250ZXh0IG9iamVjdHMgaW5cbiAqIG1pZGRsZXdhcmUgdGhhdCBpcyBub3QgZGlyZWN0bHkgcGFzc2VkIHRvIGBib3QucmVhY3Rpb25gLCBoZW5jZSBub3QgaW5mZXJyaW5nXG4gKiB0aGUgY29ycmVjdCB0eXBlIGF1dG9tYXRpY2FsbHkuIFRoYXQgd2F5LCBoYW5kbGVycyBjYW4gYmUgZGVmaW5lZCBpbiBzZXBhcmF0ZVxuICogZmlsZXMgYW5kIHN0aWxsIGhhdmUgdGhlIGNvcnJlY3QgdHlwZXMuXG4gKi9cbmV4cG9ydCB0eXBlIFJlYWN0aW9uQ29udGV4dDxDIGV4dGVuZHMgQ29udGV4dD4gPSBGaWx0ZXI8QywgXCJtZXNzYWdlX3JlYWN0aW9uXCI+O1xuXG50eXBlIENob3NlbklubGluZVJlc3VsdENvbnRleHRDb3JlID0gRmlsdGVyQ29yZTxcImNob3Nlbl9pbmxpbmVfcmVzdWx0XCI+O1xuLyoqXG4gKiBUeXBlIG9mIHRoZSBjb250ZXh0IG9iamVjdCB0aGF0IGlzIGF2YWlsYWJsZSBpbnNpZGUgdGhlIGhhbmRsZXJzIGZvclxuICogYGJvdC5jaG9zZW5JbmxpbmVSZXN1bHRgLlxuICpcbiAqIFRoaXMgaGVscGVyIHR5cGUgY2FuIGJlIHVzZWQgdG8gbmFycm93IGRvd24gY29udGV4dCBvYmplY3RzIHRoZSBzYW1lIHdheSBob3dcbiAqIGFubm90YXRlIGBib3QuY2hvc2VuSW5saW5lUmVzdWx0YCBkb2VzIGl0LiBUaGlzIGFsbG93cyB5b3UgdG8gY29udGV4dCBvYmplY3RzIGluXG4gKiBtaWRkbGV3YXJlIHRoYXQgaXMgbm90IGRpcmVjdGx5IHBhc3NlZCB0byBgYm90LmNob3NlbklubGluZVJlc3VsdGAsIGhlbmNlIG5vdFxuICogaW5mZXJyaW5nIHRoZSBjb3JyZWN0IHR5cGUgYXV0b21hdGljYWxseS4gVGhhdCB3YXksIGhhbmRsZXJzIGNhbiBiZSBkZWZpbmVkXG4gKiBpbiBzZXBhcmF0ZSBmaWxlcyBhbmQgc3RpbGwgaGF2ZSB0aGUgY29ycmVjdCB0eXBlcy5cbiAqL1xuZXhwb3J0IHR5cGUgQ2hvc2VuSW5saW5lUmVzdWx0Q29udGV4dDxDIGV4dGVuZHMgQ29udGV4dD4gPSBGaWx0ZXI8XG4gICAgTmFycm93TWF0Y2g8Qywgc3RyaW5nIHwgUmVnRXhwTWF0Y2hBcnJheT4sXG4gICAgXCJjaG9zZW5faW5saW5lX3Jlc3VsdFwiXG4+O1xuXG50eXBlIFByZUNoZWNrb3V0UXVlcnlDb250ZXh0Q29yZSA9IEZpbHRlckNvcmU8XCJwcmVfY2hlY2tvdXRfcXVlcnlcIj47XG4vKipcbiAqIFR5cGUgb2YgdGhlIGNvbnRleHQgb2JqZWN0IHRoYXQgaXMgYXZhaWxhYmxlIGluc2lkZSB0aGUgaGFuZGxlcnMgZm9yXG4gKiBgYm90LnByZUNoZWNrb3V0UXVlcnlgLlxuICpcbiAqIFRoaXMgaGVscGVyIHR5cGUgY2FuIGJlIHVzZWQgdG8gbmFycm93IGRvd24gY29udGV4dCBvYmplY3RzIHRoZSBzYW1lIHdheSBob3dcbiAqIGFubm90YXRlIGBib3QucHJlQ2hlY2tvdXRRdWVyeWAgZG9lcyBpdC4gVGhpcyBhbGxvd3MgeW91IHRvIGNvbnRleHQgb2JqZWN0cyBpblxuICogbWlkZGxld2FyZSB0aGF0IGlzIG5vdCBkaXJlY3RseSBwYXNzZWQgdG8gYGJvdC5wcmVDaGVja291dFF1ZXJ5YCwgaGVuY2Ugbm90XG4gKiBpbmZlcnJpbmcgdGhlIGNvcnJlY3QgdHlwZSBhdXRvbWF0aWNhbGx5LiBUaGF0IHdheSwgaGFuZGxlcnMgY2FuIGJlIGRlZmluZWRcbiAqIGluIHNlcGFyYXRlIGZpbGVzIGFuZCBzdGlsbCBoYXZlIHRoZSBjb3JyZWN0IHR5cGVzLlxuICovXG5leHBvcnQgdHlwZSBQcmVDaGVja291dFF1ZXJ5Q29udGV4dDxDIGV4dGVuZHMgQ29udGV4dD4gPSBGaWx0ZXI8XG4gICAgTmFycm93TWF0Y2g8Qywgc3RyaW5nIHwgUmVnRXhwTWF0Y2hBcnJheT4sXG4gICAgXCJwcmVfY2hlY2tvdXRfcXVlcnlcIlxuPjtcblxudHlwZSBTaGlwcGluZ1F1ZXJ5Q29udGV4dENvcmUgPSBGaWx0ZXJDb3JlPFwic2hpcHBpbmdfcXVlcnlcIj47XG4vKipcbiAqIFR5cGUgb2YgdGhlIGNvbnRleHQgb2JqZWN0IHRoYXQgaXMgYXZhaWxhYmxlIGluc2lkZSB0aGUgaGFuZGxlcnMgZm9yXG4gKiBgYm90LnNoaXBwaW5nUXVlcnlgLlxuICpcbiAqIFRoaXMgaGVscGVyIHR5cGUgY2FuIGJlIHVzZWQgdG8gbmFycm93IGRvd24gY29udGV4dCBvYmplY3RzIHRoZSBzYW1lIHdheSBob3dcbiAqIGFubm90YXRlIGBib3Quc2hpcHBpbmdRdWVyeWAgZG9lcyBpdC4gVGhpcyBhbGxvd3MgeW91IHRvIGNvbnRleHQgb2JqZWN0cyBpblxuICogbWlkZGxld2FyZSB0aGF0IGlzIG5vdCBkaXJlY3RseSBwYXNzZWQgdG8gYGJvdC5zaGlwcGluZ1F1ZXJ5YCwgaGVuY2Ugbm90XG4gKiBpbmZlcnJpbmcgdGhlIGNvcnJlY3QgdHlwZSBhdXRvbWF0aWNhbGx5LiBUaGF0IHdheSwgaGFuZGxlcnMgY2FuIGJlIGRlZmluZWRcbiAqIGluIHNlcGFyYXRlIGZpbGVzIGFuZCBzdGlsbCBoYXZlIHRoZSBjb3JyZWN0IHR5cGVzLlxuICovXG5leHBvcnQgdHlwZSBTaGlwcGluZ1F1ZXJ5Q29udGV4dDxDIGV4dGVuZHMgQ29udGV4dD4gPSBGaWx0ZXI8XG4gICAgTmFycm93TWF0Y2g8Qywgc3RyaW5nIHwgUmVnRXhwTWF0Y2hBcnJheT4sXG4gICAgXCJzaGlwcGluZ19xdWVyeVwiXG4+O1xuXG50eXBlIENoYXRUeXBlQ29udGV4dENvcmU8VCBleHRlbmRzIENoYXRbXCJ0eXBlXCJdPiA9XG4gICAgJiBSZWNvcmQ8XCJ1cGRhdGVcIiwgQ2hhdFR5cGVVcGRhdGU8VD4+IC8vIGN0eC51cGRhdGVcbiAgICAmIENoYXRUeXBlPFQ+IC8vIGN0eC5jaGF0XG4gICAgJiBSZWNvcmQ8XCJjaGF0SWRcIiwgbnVtYmVyPiAvLyBjdHguY2hhdElkXG4gICAgJiBDaGF0RnJvbTxUPiAvLyBjdHguZnJvbVxuICAgICYgQ2hhdFR5cGVSZWNvcmQ8XCJtc2dcIiwgVD4gLy8gY3R4Lm1zZ1xuICAgICYgQWxpYXNQcm9wczxDaGF0VHlwZVVwZGF0ZTxUPj47IC8vIGN0eC5tZXNzYWdlIGV0Y1xuLyoqXG4gKiBUeXBlIG9mIHRoZSBjb250ZXh0IG9iamVjdCB0aGF0IGlzIGF2YWlsYWJsZSBpbnNpZGUgdGhlIGhhbmRsZXJzIGZvclxuICogYGJvdC5jaGF0VHlwZWAuXG4gKlxuICogVGhpcyBoZWxwZXIgdHlwZSBjYW4gYmUgdXNlZCB0byBuYXJyb3cgZG93biBjb250ZXh0IG9iamVjdHMgdGhlIHNhbWUgd2F5IGhvd1xuICogYGJvdC5jaGF0VHlwZWAgZG9lcyBpdC4gVGhpcyBhbGxvd3MgeW91IHRvIGFubm90YXRlIGNvbnRleHQgb2JqZWN0cyBpblxuICogbWlkZGxld2FyZSB0aGF0IGlzIG5vdCBkaXJlY3RseSBwYXNzZWQgdG8gYGJvdC5jaGF0VHlwZWAsIGhlbmNlIG5vdCBpbmZlcnJpbmdcbiAqIHRoZSBjb3JyZWN0IHR5cGUgYXV0b21hdGljYWxseS4gVGhhdCB3YXksIGhhbmRsZXJzIGNhbiBiZSBkZWZpbmVkIGluIHNlcGFyYXRlXG4gKiBmaWxlcyBhbmQgc3RpbGwgaGF2ZSB0aGUgY29ycmVjdCB0eXBlcy5cbiAqL1xuZXhwb3J0IHR5cGUgQ2hhdFR5cGVDb250ZXh0PEMgZXh0ZW5kcyBDb250ZXh0LCBUIGV4dGVuZHMgQ2hhdFtcInR5cGVcIl0+ID1cbiAgICBUIGV4dGVuZHMgdW5rbm93biA/IEMgJiBDaGF0VHlwZUNvbnRleHRDb3JlPFQ+IDogbmV2ZXI7XG50eXBlIENoYXRUeXBlVXBkYXRlPFQgZXh0ZW5kcyBDaGF0W1widHlwZVwiXT4gPVxuICAgICYgQ2hhdFR5cGVSZWNvcmQ8XG4gICAgICAgIHwgXCJtZXNzYWdlXCJcbiAgICAgICAgfCBcImVkaXRlZF9tZXNzYWdlXCJcbiAgICAgICAgfCBcImNoYW5uZWxfcG9zdFwiXG4gICAgICAgIHwgXCJlZGl0ZWRfY2hhbm5lbF9wb3N0XCJcbiAgICAgICAgfCBcIm15X2NoYXRfbWVtYmVyXCJcbiAgICAgICAgfCBcImNoYXRfbWVtYmVyXCJcbiAgICAgICAgfCBcImNoYXRfam9pbl9yZXF1ZXN0XCIsXG4gICAgICAgIFRcbiAgICA+XG4gICAgJiBQYXJ0aWFsPFJlY29yZDxcImNhbGxiYWNrX3F1ZXJ5XCIsIENoYXRUeXBlUmVjb3JkPFwibWVzc2FnZVwiLCBUPj4+XG4gICAgJiBDb25zdHJhaW5VcGRhdGVzQnlDaGF0VHlwZTxUPjtcbnR5cGUgQ29uc3RyYWluVXBkYXRlc0J5Q2hhdFR5cGU8VCBleHRlbmRzIENoYXRbXCJ0eXBlXCJdPiA9IFJlY29yZDxcbiAgICBbVF0gZXh0ZW5kcyBbXCJjaGFubmVsXCJdID8gXCJtZXNzYWdlXCIgfCBcImVkaXRlZF9tZXNzYWdlXCJcbiAgICAgICAgOiBcImNoYW5uZWxfcG9zdFwiIHwgXCJlZGl0ZWRfY2hhbm5lbF9wb3N0XCIsXG4gICAgdW5kZWZpbmVkXG4+O1xuXG50eXBlIENoYXRUeXBlUmVjb3JkPEsgZXh0ZW5kcyBzdHJpbmcsIFQgZXh0ZW5kcyBDaGF0W1widHlwZVwiXT4gPSBQYXJ0aWFsPFxuICAgIFJlY29yZDxLLCBDaGF0VHlwZTxUPj5cbj47XG5pbnRlcmZhY2UgQ2hhdFR5cGU8VCBleHRlbmRzIENoYXRbXCJ0eXBlXCJdPiB7XG4gICAgY2hhdDogeyB0eXBlOiBUIH07XG59XG5pbnRlcmZhY2UgQ2hhdEZyb208VCBleHRlbmRzIENoYXRbXCJ0eXBlXCJdPiB7XG4gICAgLy8gZGVuby1saW50LWlnbm9yZSBiYW4tdHlwZXNcbiAgICBmcm9tOiBbVF0gZXh0ZW5kcyBbXCJwcml2YXRlXCJdID8ge30gOiB1bmtub3duO1xufVxuXG4vLyA9PT0gVXRpbCBmdW5jdGlvbnNcbmZ1bmN0aW9uIG9yVGhyb3c8VD4odmFsdWU6IFQgfCB1bmRlZmluZWQsIG1ldGhvZDogc3RyaW5nKTogVCB7XG4gICAgaWYgKHZhbHVlID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBNaXNzaW5nIGluZm9ybWF0aW9uIGZvciBBUEkgY2FsbCB0byAke21ldGhvZH1gKTtcbiAgICB9XG4gICAgcmV0dXJuIHZhbHVlO1xufVxuXG5mdW5jdGlvbiB0cmlnZ2VyRm4odHJpZ2dlcjogTWF5YmVBcnJheTxzdHJpbmcgfCBSZWdFeHA+KSB7XG4gICAgcmV0dXJuIHRvQXJyYXkodHJpZ2dlcikubWFwKCh0KSA9PlxuICAgICAgICB0eXBlb2YgdCA9PT0gXCJzdHJpbmdcIlxuICAgICAgICAgICAgPyAodHh0OiBzdHJpbmcpID0+ICh0eHQgPT09IHQgPyB0IDogbnVsbClcbiAgICAgICAgICAgIDogKHR4dDogc3RyaW5nKSA9PiB0eHQubWF0Y2godClcbiAgICApO1xufVxuXG5mdW5jdGlvbiBtYXRjaDxDIGV4dGVuZHMgQ29udGV4dD4oXG4gICAgY3R4OiBDLFxuICAgIGNvbnRlbnQ6IHN0cmluZyxcbiAgICB0cmlnZ2VyczogQXJyYXk8KGNvbnRlbnQ6IHN0cmluZykgPT4gc3RyaW5nIHwgUmVnRXhwTWF0Y2hBcnJheSB8IG51bGw+LFxuKTogYm9vbGVhbiB7XG4gICAgZm9yIChjb25zdCB0IG9mIHRyaWdnZXJzKSB7XG4gICAgICAgIGNvbnN0IHJlcyA9IHQoY29udGVudCk7XG4gICAgICAgIGlmIChyZXMpIHtcbiAgICAgICAgICAgIGN0eC5tYXRjaCA9IHJlcztcbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICB9XG4gICAgfVxuICAgIHJldHVybiBmYWxzZTtcbn1cbmZ1bmN0aW9uIHRvQXJyYXk8RT4oZTogTWF5YmVBcnJheTxFPik6IEVbXSB7XG4gICAgcmV0dXJuIEFycmF5LmlzQXJyYXkoZSkgPyBlIDogW2VdO1xufVxuIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLGtDQUFrQztBQUdsQyxTQUlJLFdBQVcsUUFDUixjQUFjO0FBaUtyQixNQUFNLFVBQXFCO0lBQ3ZCLGFBQW1DLE1BQWUsRUFBRTtRQUNoRCxNQUFNLE9BQU8sWUFBWTtRQUN6QixPQUFPLENBQW9CLE1BQWdDLEtBQUs7SUFDcEU7SUFDQSxNQUFLLE9BQU8sRUFBRTtRQUNWLE1BQU0sVUFBVSxRQUFRLFdBQVcsQ0FBQztZQUFDO1lBQVM7U0FBVztRQUN6RCxNQUFNLE1BQU0sVUFBVTtRQUN0QixPQUFPLENBQW9CLE1BQW1DO1lBQzFELElBQUksQ0FBQyxRQUFRLE1BQU0sT0FBTyxLQUFLO1lBQy9CLE1BQU0sTUFBTSxJQUFJLE9BQU8sSUFBSSxJQUFJLFdBQVc7WUFDMUMsTUFBTSxNQUFNLElBQUksSUFBSSxJQUFJLElBQUksT0FBTztZQUNuQyxPQUFPLE1BQU0sS0FBSyxLQUFLO1FBQzNCO0lBQ0o7SUFDQSxTQUFRLE9BQU8sRUFBRTtRQUNiLE1BQU0sY0FBYyxRQUFRLFdBQVcsQ0FBQztRQUN4QyxNQUFNLGFBQWEsSUFBSTtRQUN2QixNQUFNLGVBQWUsSUFBSTtR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