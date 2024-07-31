// deno-lint-ignore-file camelcase
import { createRawApi } from "./client.ts";
/**
 * This class provides access to the full Telegram Bot API. All methods of the
 * API have an equivalent on this class, with the most important parameters
 * pulled up into the function signature, and the other parameters captured by
 * an object.
 *
 * In addition, this class has a property `raw` that provides raw access to the
 * complete Telegram API, with the method signatures 1:1 represented as
 * documented on the website (https://core.telegram.org/bots/api).
 *
 * Every method takes an optional `AbortSignal` object that allows you to cancel
 * the request if desired.
 *
 * In advanced use cases, this class allows to install transformers that can
 * modify the method and payload on the fly before sending it to the Telegram
 * servers. Confer the `config` property for this.
 */ export class Api {
    token;
    options;
    /**
     * Provides access to all methods of the Telegram Bot API exactly as
     * documented on the website (https://core.telegram.org/bots/api). No
     * arguments are pulled up in the function signature for convenience.
     *
     * If you suppress compiler warnings, this also allows for raw api calls to
     * undocumented methods with arbitrary parameters—use only if you know what
     * you are doing.
     */ raw;
    /**
     * Configuration object for the API instance, used as a namespace to
     * separate those API operations that are related to grammY from methods of
     * the Telegram Bot API. Contains advanced options!
     */ config;
    /**
     * Constructs a new instance of `Api`. It is independent from all other
     * instances of this class. For example, this lets you install a custom set
     * if transformers.
     *
     * @param token Bot API token obtained from [@BotFather](https://t.me/BotFather)
     * @param options Optional API client options for the underlying client instance
     * @param webhookReplyEnvelope Optional envelope to handle webhook replies
     */ constructor(token, options, webhookReplyEnvelope){
        this.token = token;
        this.options = options;
        const { raw , use , installedTransformers  } = createRawApi(token, options, webhookReplyEnvelope);
        this.raw = raw;
        this.config = {
            use,
            installedTransformers: ()=>installedTransformers.slice()
        };
    }
    /**
     * Use this method to receive incoming updates using long polling (wiki). Returns an Array of Update objects.
     *
     * Notes
     * 1. This method will not work if an outgoing webhook is set up.
     * 2. In order to avoid getting duplicate updates, recalculate offset after each server response.
     *
     * @param other Optional remaining parameters, confer the official reference below
     * @param signal Optional `AbortSignal` to cancel the request
     *
     * **Official reference:** https://core.telegram.org/bots/api#getupdates
     */ getUpdates(other, signal) {
        return this.raw.getUpdates({
            ...other
        }, signal);
    }
    /**
     * Use this method to specify a URL and receive incoming updates via an outgoing webhook. Whenever there is an update for the bot, we will send an HTTPS POST request to the specified URL, containing a JSON-serialized Update. In case of an unsuccessful request, we will give up after a reasonable amount of attempts. Returns True on success.
     *
     * If you'd like to make sure that the webhook was set by you, you can specify secret data in the parameter secret_token. If specified, the request will contain a header “X-Telegram-Bot-Api-Secret-Token” with the secret token as content.
     *
     * Notes
     * 1. You will not be able to receive updates using getUpdates for as long as an outgoing webhook is set up.
     * 2. To use a self-signed certificate, you need to upload your public key certificate using certificate parameter. Please upload as InputFile, sending a String will not work.
     * 3. Ports currently supported for Webhooks: 443, 80, 88, 8443.
     *
     * If you're having any trouble setting up webhooks, please check out this amazing guide to webhooks.
     *
     * @param url HTTPS url to send updates to. Use an empty string to remove webhook integration
     * @param other Optional remaining parameters, confer the official reference below
     * @param signal Optional `AbortSignal` to cancel the request
     *
     * **Official reference:** https://core.telegram.org/bots/api#setwebhook
     */ setWebhook(url, other, signal) {
        return this.raw.setWebhook({
            url,
            ...other
        }, signal);
    }
    /**
     * Use this method to remove webhook integration if you decide to switch back to getUpdates. Returns True on success.
     *
     * @param other Optional remaining parameters, confer the official reference below
     * @param signal Optional `AbortSignal` to cancel the request
     *
     * **Official reference:** https://core.telegram.org/bots/api#deletewebhook
     */ deleteWebhook(other, signal) {
        return this.raw.deleteWebhook({
            ...other
        }, signal);
    }
    /**
     * Use this method to get current webhook status. Requires no parameters. On success, returns a WebhookInfo object. If the bot is using getUpdates, will return an object with the url field empty.
     *
     * @param signal Optional `AbortSignal` to cancel the request
     *
     * **Official reference:** https://core.telegram.org/bots/api#getwebhookinfo
     */ getWebhookInfo(signal) {
        return this.raw.getWebhookInfo(signal);
    }
    /**
     * A simple method for testing your bot's authentication token. Requires no parameters. Returns basic information about the bot in form of a User object.
     *
     * @param signal Optional `AbortSignal` to cancel the request
     *
     * **Official reference:** https://core.telegram.org/bots/api#getme
     */ getMe(signal) {
        return this.raw.getMe(signal);
    }
    /**
     * Use this method to log out from the cloud Bot API server before launching the bot locally. You must log out the bot before running it locally, otherwise there is no guarantee that the bot will receive updates. After a successful call, you can immediately log in on a local server, but will not be able to log in back to the cloud Bot API server for 10 minutes. Returns True on success. Requires no parameters.
     *
     * @param signal Optional `AbortSignal` to cancel the request
     *
     * **Official reference:** https://core.telegram.org/bots/api#logout
     */ logOut(signal) {
        return this.raw.logOut(signal);
    }
    /**
     * Use this method to close the bot instance before moving it from one local server to another. You need to delete the webhook before calling this method to ensure that the bot isn't launched again after server restart. The method will return error 429 in the first 10 minutes after the bot is launched. Returns True on success. Requires no parameters.
     *
     * @param signal Optional `AbortSignal` to cancel the request
     *
     * **Official reference:** https://core.telegram.org/bots/api#close
     */ close(signal) {
        return this.raw.close(signal);
    }
    /**
     * Use this method to send text messages. On success, the sent Message is returned.
     *
     * @param chat_id Unique identifier for the target chat or username of the target channel (in the format @channelusername)
     * @param text Text of the message to be sent, 1-4096 characters after entities parsing
     * @param other Optional remaining parameters, confer the official reference below
     * @param signal Optional `AbortSignal` to cancel the request
     *
     * **Official reference:** https://core.telegram.org/bots/api#sendmessage
     */ sendMessage(chat_id, text, other, signal) {
        return this.raw.sendMessage({
            chat_id,
            text,
            ...other
        }, signal);
    }
    /**
     * Use this method to forward messages of any kind. Service messages and messages with protected content can't be forwarded. On success, the sent Message is returned.
     *
     * @param chat_id Unique identifier for the target chat or username of the target channel (in the format @channelusername)
     * @param from_chat_id Unique identifier for the chat where the original message was sent (or channel username in the format @channelusername)
     * @param message_id Message identifier in the chat specified in from_chat_id
     * @param other Optional remaining parameters, confer the official reference below
     * @param signal Optional `AbortSignal` to cancel the request
     *
     * **Official reference:** https://core.telegram.org/bots/api#forwardmessage
     */ forwardMessage(chat_id, from_chat_id, message_id, other, signal) {
        return this.raw.forwardMessage({
            chat_id,
            from_chat_id,
            message_id,
            ...other
        }, signal);
    }
    /**
     * Use this method to forward multiple messages of any kind. If some of the specified messages can't be found or forwarded, they are skipped. Service messages and messages with protected content can't be forwarded. Album grouping is kept for forwarded messages. On success, an array of MessageId of the sent messages is returned.
     *
     * @param chat_id Unique identifier for the target chat or username of the target channel (in the format @channelusername)
     * @param from_chat_id Unique identifier for the chat where the original messages were sent (or channel username in the format @channelusername)
     * @param message_ids A list of 1-100 identifiers of messages in the chat from_chat_id to forward. The identifiers must be specified in a strictly increasing order.
     * @param other Optional remaining parameters, confer the official reference below
     * @param signal Optional `AbortSignal` to cancel the request
     *
     * **Official reference:** https://core.telegram.org/bots/api#forwardmessages
     */ forwardMessages(chat_id, from_chat_id, message_ids, other, signal) {
        return this.raw.forwardMessages({
            chat_id,
            from_chat_id,
            message_ids,
            ...other
        }, signal);
    }
    /**
     * Use this method to copy messages of any kind. Service messages, paid media messages, giveaway messages, giveaway winners messages, and invoice messages can't be copied. A quiz poll can be copied only if the value of the field correct_option_id is known to the bot. The method is analogous to the method forwardMessage, but the copied message doesn't have a link to the original message. Returns the MessageId of the sent message on success.
     *
     * @param chat_id Unique identifier for the target chat or username of the target channel (in the format @channelusername)
     * @param from_chat_id Unique identifier for the chat where the original message was sent (or channel username in the format @channelusername)
     * @param message_id Message identifier in the chat specified in from_chat_id
     * @param other Optional remaining parameters, confer the official reference below
     * @param signal Optional `AbortSignal` to cancel the request
     *
     * **Official reference:** https://core.telegram.org/bots/api#copymessage
     */ copyMessage(chat_id, from_chat_id, message_id, other, signal) {
        return this.raw.copyMessage({
            chat_id,
            from_chat_id,
            message_id,
            ...other
        }, signal);
    }
    /**
     * Use this method to copy messages of any kind. If some of the specified messages can't be found or copied, they are skipped. Service messages, paid media messages, giveaway messages, giveaway winners messages, and invoice messages can't be copied. A quiz poll can be copied only if the value of the field correct_option_id is known to the bot. The method is analogous to the method forwardMessages, but the copied messages don't have a link to the original message. Album grouping is kept for copied messages. On success, an array of MessageId of the sent messages is returned.
     *
     * @param chat_id Unique identifier for the target chat or username of the target channel (in the format @channelusername)
     * @param from_chat_id Unique identifier for the chat where the original messages were sent (or channel username in the format @channelusername)
     * @param message_ids A list of 1-100 identifiers of messages in the chat from_chat_id to copy. The identifiers must be specified in a strictly increasing order.
     * @param other Optional remaining parameters, confer the official reference below
     * @param signal Optional `AbortSignal` to cancel the request
     *
     * **Official reference:** https://core.telegram.org/bots/api#copymessages
     */ copyMessages(chat_id, from_chat_id, message_ids, other, signal) {
        return this.raw.copyMessages({
            chat_id,
            from_chat_id,
            message_ids,
            ...other
        }, signal);
    }
    /**
     * Use this method to send photos. On success, the sent Message is returned.
     *
     * @param chat_id Unique identifier for the target chat or username of the target channel (in the format @channelusername)
     * @param photo Photo to send. Pass a file_id as String to send a photo that exists on the Telegram servers (recommended), pass an HTTP URL as a String for Telegram to get a photo from the Internet, or upload a new photo using multipart/form-data. The photo must be at most 10 MB in size. The photo's width and height must not exceed 10000 in total. Width and height ratio must be at most 20.
     * @param other Optional remaining parameters, confer the official reference below
     * @param signal Optional `AbortSignal` to cancel the request
     *
     * **Official reference:** https://core.telegram.org/bots/api#sendphoto
     */ sendPhoto(chat_id, photo, other, signal) {
        return this.raw.sendPhoto({
            chat_id,
            photo,
            ...other
        }, signal);
    }
    /**
     * Use this method to send audio files, if you want Telegram clients to display them in the music player. Your audio must be in the .MP3 or .M4A format. On success, the sent Message is returned. Bots can currently send audio files of up to 50 MB in size, this limit may be changed in the future.
     *
     * For sending voice messages, use the sendVoice method instead.
     *
     * @param chat_id Unique identifier for the target chat or username of the target channel (in the format @channelusername)
     * @param audio Audio file to send. Pass a file_id as String to send an audio file that exists on the Telegram servers (recommended), pass an HTTP URL as a String for Telegram to get an audio file from the Internet, or upload a new one using multipart/form-data.
     * @param other Optional remaining parameters, confer the official reference below
     * @param signal Optional `AbortSignal` to cancel the request
     *
     * **Official reference:** https://core.telegram.org/bots/api#sendaudio
     */ sendAudio(chat_id, audio, other, signal) {
        return this.raw.sendAudio({
            chat_id,
            audio,
            ...other
        }, signal);
    }
    /**
     * Use this method to send general files. On success, the sent Message is returned. Bots can currently send files of any type of up to 50 MB in size, this limit may be changed in the future.
     *
     * @param chat_id Unique identifier for the target chat or username of the target channel (in the format @channelusername)
     * @param document File to send. Pass a file_id as String to send a file that exists on the Telegram servers (recommended), pass an HTTP URL as a String for Telegram to get a file from the Internet, or upload a new one using multipart/form-data.
     * @param other Optional remaining parameters, confer the official reference below
     * @param signal Optional `AbortSignal` to cancel the request
     *
     * **Official reference:** https://core.telegram.org/bots/api#senddocument
     */ sendDocument(chat_id, document, other, signal) {
        return this.raw.sendDocument({
            chat_id,
            document,
            ...other
        }, signal);
    }
    /**
     * Use this method to send video files, Telegram clients support mp4 videos (other formats may be sent as Document). On success, the sent Message is returned. Bots can currently send video files of up to 50 MB in size, this limit may be changed in the future.
     *
     * @param chat_id Unique identifier for the target chat or username of the target channel (in the format @channelusername)
     * @param video Video to send. Pass a file_id as String to send a video that exists on the Telegram servers (recommended), pass an HTTP URL as a String for Telegram to get a video from the Internet, or upload a new video using multipart/form-data.
     * @param other Optional remaining parameters, confer the official reference below
     * @param signal Optional `AbortSignal` to cancel the request
     *
     * **Official reference:** https://core.telegram.org/bots/api#sendvideo
     */ sendVideo(chat_id, video, other, signal) {
        return this.raw.sendVideo({
            chat_id,
            video,
            ...other
        }, signal);
    }
    /**
     * Use this method to send animation files (GIF or H.264/MPEG-4 AVC video without sound). On success, the sent Message is returned. Bots can currently send animation files of up to 50 MB in size, this limit may be changed in the future.
     *
     * @param chat_id Unique identifier for the target chat or username of the target channel (in the format @channelusername)
     * @param animation Animation to send. Pass a file_id as String to send an animation that exists on the Telegram servers (recommended), pass an HTTP URL as a String for Telegram to get an animation from the Internet, or upload a new animation using multipart/form-data.
     * @param other Optional remaining parameters, confer the official reference below
     * @param signal Optional `AbortSignal` to cancel the request
     *
     * **Official reference:** https://core.telegram.org/bots/api#sendanimation
     */ sendAnimation(chat_id, animation, other, signal) {
        return this.raw.sendAnimation({
            chat_id,
            animation,
            ...other
        }, signal);
    }
    /**
     * Use this method to send audio files, if you want Telegram clients to display the file as a playable voice message. For this to work, your audio must be in an .OGG file encoded with OPUS (other formats may be sent as Audio or Document). On success, the sent Message is returned. Bots can currently send voice messages of up to 50 MB in size, this limit may be changed in the future.
     *
     * @param chat_id Unique identifier for the target chat or username of the target channel (in the format @channelusername)
     * @param voice Audio file to send. Pass a file_id as String to send a file that exists on the Telegram servers (recommended), pass an HTTP URL as a String for Telegram to get a file from the Internet, or upload a new one using multipart/form-data.
     * @param other Optional remaining parameters, confer the official reference below
     * @param signal Optional `AbortSignal` to cancel the request
     *
     * **Official reference:** https://core.telegram.org/bots/api#sendvoice
     */ sendVoice(chat_id, voice, other, signal) {
        return this.raw.sendVoice({
            chat_id,
            voice,
            ...other
        }, signal);
    }
    /**
     * Use this method to send video messages. On success, the sent Message is returned.
     * As of v.4.0, Telegram clients support rounded square mp4 videos of up to 1 minute long.
     *
     * @param chat_id Unique identifier for the target chat or username of the target channel (in the format @channelusername)
     * @param video_note Video note to send. Pass a file_id as String to send a video note that exists on the Telegram servers (recommended) or upload a new video using multipart/form-data.. Sending video notes by a URL is currently unsupported
     * @param other Optional remaining parameters, confer the official reference below
     * @param signal Optional `AbortSignal` to cancel the request
     *
     * **Official reference:** https://core.telegram.org/bots/api#sendvideonote
     */ sendVideoNote(chat_id, video_note, other, signal) {
        return this.raw.sendVideoNote({
            chat_id,
            video_note,
            ...other
        }, signal);
    }
    /**
     * Use this method to send a group of photos, videos, documents or audios as an album. Documents and audio files can be only grouped in an album with messages of the same type. On success, an array of Messages that were sent is returned.
     *
     * @param chat_id Unique identifier for the target chat or username of the target channel (in the format @channelusername)
     * @param media An array describing messages to be sent, must include 2-10 items
     * @param other Optional remaining parameters, confer the official reference below
     * @param signal Optional `AbortSignal` to cancel the request
     *
     * **Official reference:** https://core.telegram.org/bots/api#sendmediagroup
     */ sendMediaGroup(chat_id, media, other, signal) {
        return this.raw.sendMediaGroup({
            chat_id,
            media,
            ...other
        }, signal);
    }
    /**
     * Use this method to send point on the map. On success, the sent Message is returned.
     *
     * @param chat_id Unique identifier for the target chat or username of the target channel (in the format @channelusername)
     * @param latitude Latitude of the location
     * @param longitude Longitude of the location
     * @param other Optional remaining parameters, confer the official reference below
     * @param signal Optional `AbortSignal` to cancel the request
     *
     * **Official reference:** https://core.telegram.org/bots/api#sendlocation
     */ sendLocation(chat_id, latitude, longitude, other, signal) {
        return this.raw.sendLocation({
            chat_id,
            latitude,
            longitude,
            ...other
        }, signal);
    }
    /**
     * Use this method to edit live location messages. A location can be edited until its live_period expires or editing is explicitly disabled by a call to stopMessageLiveLocation. On success, if the edited message is not an inline message, the edited Message is returned, otherwise True is returned.
     *
     * @param chat_id Unique identifier for the target chat or username of the target channel (in the format @channelusername)
     * @param message_id Identifier of the message to edit
     * @param latitude Latitude of new location
     * @param longitude Longitude of new location
     * @param other Optional remaining parameters, confer the official reference below
     * @param signal Optional `AbortSignal` to cancel the request
     *
     * **Official reference:** https://core.telegram.org/bots/api#editmessagelivelocation
     */ editMessageLiveLocation(chat_id, message_id, latitude, longitude, other, signal) {
        return this.raw.editMessageLiveLocation({
            chat_id,
            message_id,
            latitude,
            longitude,
            ...other
        }, signal);
    }
    /**
     * Use this method to edit live location inline messages. A location can be edited until its live_period expires or editing is explicitly disabled by a call to stopMessageLiveLocation. On success, if the edited message is not an inline message, the edited Message is returned, otherwise True is returned.
     *
     * @param inline_message_id Identifier of the inline message
     * @param latitude Latitude of new location
     * @param longitude Longitude of new location
     * @param other Optional remaining parameters, confer the official reference below
     * @param signal Optional `AbortSignal` to cancel the request
     *
     * **Official reference:** https://core.telegram.org/bots/api#editmessagelivelocation
     */ editMessageLiveLocationInline(inline_message_id, latitude, longitude, other, signal) {
        return this.raw.editMessageLiveLocation({
            inline_message_id,
            latitude,
            longitude,
            ...other
        }, signal);
    }
    /**
     * Use this method to stop updating a live location message before live_period expires. On success, if the message is not an inline message, the edited Message is returned, otherwise True is returned.
     *
     * @param chat_id Unique identifier for the target chat or username of the target channel (in the format @channelusername)
     * @param message_id Identifier of the message with live location to stop
     * @param other Optional remaining parameters, confer the official reference below
     * @param signal Optional `AbortSignal` to cancel the request
     *
     * **Official reference:** https://core.telegram.org/bots/api#stopmessagelivelocation
     */ stopMessageLiveLocation(chat_id, message_id, other, signal) {
        return this.raw.stopMessageLiveLocation({
            chat_id,
            message_id,
            ...other
        }, signal);
    }
    /**
     * Use this method to stop updating a live location message before live_period expires. On success, if the message is not an inline message, the edited Message is returned, otherwise True is returned.
     *
     * @param inline_message_id Identifier of the inline message
     * @param other Optional remaining parameters, confer the official reference below
     * @param signal Optional `AbortSignal` to cancel the request
     *
     * **Official reference:** https://core.telegram.org/bots/api#stopmessagelivelocation
     */ stopMessageLiveLocationInline(inline_message_id, other, signal) {
        return this.raw.stopMessageLiveLocation({
            inline_message_id,
            ...other
        }, signal);
    }
    /**
     * Use this method to send paid media to channel chats. On success, the sent Message is returned.
     *
     * @param chat_id Unique identifier for the target chat or username of the target channel (in the format @channelusername)
     * @param star_count The number of Telegram Stars that must be paid to buy access to the media
     * @param media An array describing the media to be sent; up to 10 items
     * @param other Optional remaining parameters, confer the official reference below
     * @param signal Optional `AbortSignal` to cancel the request
     *
     * **Official reference:** https://core.telegram.org/bots/api#sendpaidmedia
     */ sendPaidMedia(chat_id, star_count, media, other, signal) {
        return this.raw.sendPaidMedia({
            chat_id,
            star_count,
            media,
            ...other
        }, signal);
    }
    /**
     * Use this method to send information about a venue. On success, the sent Message is returned.
     *
     * @param chat_id Unique identifier for the target chat or username of the target channel (in the format @channelusername)
     * @param latitude Latitude of the venue
     * @param longitude Longitude of the venue
     * @param title Name of the venue
     * @param address Address of the venue
     * @param other Optional remaining parameters, confer the official reference below
     * @param signal Optional `AbortSignal` to cancel the request
     *
     * **Official reference:** https://core.telegram.org/bots/api#sendvenue
     */ sendVenue(chat_id, latitude, longitude, title, address, other, signal) {
        return this.raw.sendVenue({
            chat_id,
            latitude,
            longitude,
            title,
            address,
            ...other
        }, signal);
    }
    /**
     * Use this method to send phone contacts. On success, the sent Message is returned.
     *
     * @param chat_id Unique identifier for the target chat or username of the target channel (in the format @channelusername)
     * @param phone_number Contact's phone number
     * @param first_name Contact's first name
     * @param other Optional remaining parameters, confer the official reference below
     * @param signal Optional `AbortSignal` to cancel the request
     *
     * **Official reference:** https://core.telegram.org/bots/api#sendcontact
     */ sendContact(chat_id, phone_number, first_name, other, signal) {
        return this.raw.sendContact({
            chat_id,
            phone_number,
            first_name,
            ...other
        }, signal);
    }
    /**
     * Use this method to send a native poll. On success, the sent Message is returned.
     *
     * @param chat_id Unique identifier for the target chat or username of the target channel (in the format @channelusername)
     * @param question Poll question, 1-300 characters
     * @param options A list of answer options, 2-10 strings 1-100 characters each
     * @param other Optional remaining parameters, confer the official reference below
     * @param signal Optional `AbortSignal` to cancel the request
     *
     * **Official reference:** https://core.telegram.org/bots/api#sendpoll
     */ sendPoll(chat_id, question, options, other, signal) {
        return this.raw.sendPoll({
            chat_id,
            question,
            options,
            ...other
        }, signal);
    }
    /**
     * Use this method to send an animated emoji that will display a random value. On success, the sent Message is returned.
     *
     * @param chat_id Unique identifier for the target chat or username of the target channel (in the format @channelusername)
     * @param emoji Emoji on which the dice throw animation is based. Currently, must be one of “🎲”, “🎯”, “🏀”, “⚽”, or “🎰”. Dice can have values 1-6 for “🎲” and “🎯”, values 1-5 for “🏀” and “⚽”, and values 1-64 for “🎰”. Defaults to “🎲”
     * @param other Optional remaining parameters, confer the official reference below
     * @param signal Optional `AbortSignal` to cancel the request
     *
     * **Official reference:** https://core.telegram.org/bots/api#senddice
     */ sendDice(chat_id, emoji, other, signal) {
        return this.raw.sendDice({
            chat_id,
            emoji,
            ...other
        }, signal);
    }
    /**
     * Use this method to change the chosen reactions on a message. Service messages can't be reacted to. Automatically forwarded messages from a channel to its discussion group have the same available reactions as messages in the channel. In albums, bots must react to the first message. Returns True on success.
     *
     * @param chat_id Unique identifier for the target chat or username of the target channel (in the format @channelusername)
     * @param message_id Identifier of the target message
     * @param reaction A list of reaction types to set on the message. Currently, as non-premium users, bots can set up to one reaction per message. A custom emoji reaction can be used if it is either already present on the message or explicitly allowed by chat administrators.
     * @param other Optional remaining parameters, confer the official reference below
     * @param signal Optional `AbortSignal` to cancel the request
     *
     * **Official reference:** https://core.telegram.org/bots/api#senddice
     */ setMessageReaction(chat_id, message_id, reaction, other, signal) {
        return this.raw.setMessageReaction({
            chat_id,
            message_id,
            reaction,
            ...other
        }, signal);
    }
    /**
     * Use this method when you need to tell the user that something is happening on the bot's side. The status is set for 5 seconds or less (when a message arrives from your bot, Telegram clients clear its typing status). Returns True on success.
     *
     * Example: The ImageBot needs some time to process a request and upload the image. Instead of sending a text message along the lines of “Retrieving image, please wait…”, the bot may use sendChatAction with action = upload_photo. The user will see a “sending photo” status for the bot.
     *
     * We only recommend using this method when a response from the bot will take a noticeable amount of time to arrive.
     *
     * @param chat_id Unique identifier for the target chat or username of the target channel (in the format @channelusername)
     * @param action Type of action to broadcast. Choose one, depending on what the user is about to receive: typing for text messages, upload_photo for photos, record_video or upload_video for videos, record_voice or upload_voice for voice notes, upload_document for general files, choose_sticker for stickers, find_location for location data, record_video_note or upload_video_note for video notes.
     * @param other Optional remaining parameters, confer the official reference below
     * @param signal Optional `AbortSignal` to cancel the request
     *
     * **Official reference:** https://core.telegram.org/bots/api#sendchataction
     */ sendChatAction(chat_id, action, other, signal) {
        return this.raw.sendChatAction({
            chat_id,
            action,
            ...other
        }, signal);
    }
    /**
     * Use this method to get a list of profile pictures for a user. Returns a UserProfilePhotos object.
     *
     * @param user_id Unique identifier of the target user
     * @param other Optional remaining parameters, confer the official reference below
     * @param signal Optional `AbortSignal` to cancel the request
     *
     * **Official reference:** https://core.telegram.org/bots/api#getuserprofilephotos
     */ getUserProfilePhotos(user_id, other, signal) {
        return this.raw.getUserProfilePhotos({
            user_id,
            ...other
        }, signal);
    }
    /**
     * Use this method to get the list of boosts added to a chat by a user. Requires administrator rights in the chat. Returns a UserChatBoosts object.
     *
     * @param chat_id Unique identifier for the chat or username of the channel (in the format @channelusername)
     * @param user_id Unique identifier of the target user
     * @param signal Optional `AbortSignal` to cancel the request
     *
     * **Official reference:** https://core.telegram.org/bots/api#getuserchatboosts
     */ getUserChatBoosts(chat_id, user_id, signal) {
        return this.raw.getUserChatBoosts({
            chat_id,
            user_id
        }, signal);
    }
    /**
     * Use this method to get information about the connection of the bot with a business account. Returns a BusinessConnection object on success.
     *
     * @param business_connection_id Unique identifier of the business connection
     * @param signal Optional `AbortSignal` to cancel the request
     *
     * **Official reference:** https://core.telegram.org/bots/api#getbusinessconnection
     */ getBusinessConnection(business_connection_id, signal) {
        return this.raw.getBusinessConnection({
            business_connection_id
        }, signal);
    }
    /**
     * Use this method to get basic info about a file and prepare it for downloading. For the moment, bots can download files of up to 20MB in size. On success, a File object is returned. The file can then be downloaded via the link `https://api.telegram.org/file/bot<token>/<file_path>`, where `<file_path>` is taken from the response. It is guaranteed that the link will be valid for at least 1 hour. When the link expires, a new one can be requested by calling getFile again.
     *
     * Note: This function may not preserve the original file name and MIME type. You should save the file's MIME type and name (if available) when the File object is received.
     *
     * @param file_id File identifier to get info about
     * @param signal Optional `AbortSignal` to cancel the request
     *
     * **Official reference:** https://core.telegram.org/bots/api#getfile
     */ getFile(file_id, signal) {
        return this.raw.getFile({
            file_id
        }, signal);
    }
    /** @deprecated Use `banChatMember` instead. */ kickChatMember(...args) {
        return this.banChatMember(...args);
    }
    /**
     * Use this method to ban a user in a group, a supergroup or a channel. In the case of supergroups and channels, the user will not be able to return to the chat on their own using invite links, etc., unless unbanned first. The bot must be an administrator in the chat for this to work and must have the appropriate administrator rights. Returns True on success.
     *
     * @param chat_id Unique identifier for the target group or username of the target supergroup or channel (in the format @channelusername)
     * @param user_id Unique identifier of the target user
     * @param other Optional remaining parameters, confer the official reference below
     * @param signal Optional `AbortSignal` to cancel the request
     *
     * **Official reference:** https://core.telegram.org/bots/api#banchatmember
     */ banChatMember(chat_id, user_id, other, signal) {
        return this.raw.banChatMember({
            chat_id,
            user_id,
            ...other
        }, signal);
    }
    /**
     * Use this method to unban a previously banned user in a supergroup or channel. The user will not return to the group or channel automatically, but will be able to join via link, etc. The bot must be an administrator for this to work. By default, this method guarantees that after the call the user is not a member of the chat, but will be able to join it. So if the user is a member of the chat they will also be removed from the chat. If you don't want this, use the parameter only_if_banned. Returns True on success.
     *
     * @param chat_id Unique identifier for the target group or username of the target supergroup or channel (in the format @username)
     * @param user_id Unique identifier of the target user
     * @param other Optional remaining parameters, confer the official reference below
     * @param signal Optional `AbortSignal` to cancel the request
     *
     * **Official reference:** https://core.telegram.org/bots/api#unbanchatmember
     */ unbanChatMember(chat_id, user_id, other, signal) {
        return this.raw.unbanChatMember({
            chat_id,
            user_id,
            ...other
        }, signal);
    }
    /**
     * Use this method to restrict a user in a supergroup. The bot must be an administrator in the supergroup for this to work and must have the appropriate administrator rights. Pass True for all permissions to lift restrictions from a user. Returns True on success.
     *
     * @param chat_id Unique identifier for the target chat or username of the target supergroup (in the format @supergroupusername)
     * @param user_id Unique identifier of the target user
     * @param permissions An object for new user permissions
     * @param other Optional remaining parameters, confer the official reference below
     * @param signal Optional `AbortSignal` to cancel the request
     *
     * **Official reference:** https://core.telegram.org/bots/api#restrictchatmember
     */ restrictChatMember(chat_id, user_id, permissions, other, signal) {
        return this.raw.restrictChatMember({
            chat_id,
            user_id,
            permissions,
            ...other
        }, signal);
    }
    /**
     * Use this method to promote or demote a user in a supergroup or a channel. The bot must be an administrator in the chat for this to work and must have the appropriate administrator rights. Pass False for all boolean parameters to demote a user. Returns True on success.
     *
     * @param chat_id Unique identifier for the target chat or username of the target channel (in the format @channelusername)
     * @param user_id Unique identifier of the target user
     * @param other Optional remaining parameters, confer the official reference below
     * @param signal Optional `AbortSignal` to cancel the request
     *
     * **Official reference:** https://core.telegram.org/bots/api#promotechatmember
     */ promoteChatMember(chat_id, user_id, other, signal) {
        return this.raw.promoteChatMember({
            chat_id,
            user_id,
            ...other
        }, signal);
    }
    /**
     * Use this method to set a custom title for an administrator in a supergroup promoted by the bot. Returns True on success.
     *
     * @param chat_id Unique identifier for the target chat or username of the target supergroup (in the format @supergroupusername)
     * @param user_id Unique identifier of the target user
     * @param custom_title New custom title for the administrator; 0-16 characters, emoji are not allowed
     * @param signal Optional `AbortSignal` to cancel the request
     *
     * **Official reference:** https://core.telegram.org/bots/api#setchatadministratorcustomtitle
     */ setChatAdministratorCustomTitle(chat_id, user_id, custom_title, signal) {
        return this.raw.setChatAdministratorCustomTitle({
            chat_id,
            user_id,
            custom_title
        }, signal);
    }
    /**
     * Use this method to ban a channel chat in a supergroup or a channel. Until the chat is unbanned, the owner of the banned chat won't be able to send messages on behalf of any of their channels. The bot must be an administrator in the supergroup or channel for this to work and must have the appropriate administrator rights. Returns True on success.
     *
     * @param chat_id Unique identifier for the target chat or username of the target channel (in the format @channelusername)
     * @param sender_chat_id Unique identifier of the target sender chat
     * @param signal Optional `AbortSignal` to cancel the request
     *
     * **Official reference:** https://core.telegram.org/bots/api#banchatsenderchat
     */ banChatSenderChat(chat_id, sender_chat_id, signal) {
        return this.raw.banChatSenderChat({
            chat_id,
            sender_chat_id
        }, signal);
    }
    /**
     * Use this method to unban a previously banned channel chat in a supergroup or channel. The bot must be an administrator for this to work and must have the appropriate administrator rights. Returns True on success.
     *
     * @param chat_id Unique identifier for the target chat or username of the target channel (in the format @channelusername)
     * @param sender_chat_id Unique identifier of the target sender chat
     * @param signal Optional `AbortSignal` to cancel the request
     *
     * **Official reference:** https://core.telegram.org/bots/api#unbanchatsenderchat
     */ unbanChatSenderChat(chat_id, sender_chat_id, signal) {
        return this.raw.unbanChatSenderChat({
            chat_id,
            sender_chat_id
        }, signal);
    }
    /**
     * Use this method to set default chat permissions for all members. The bot must be an administrator in the group or a supergroup for this to work and must have the can_restrict_members administrator rights. Returns True on success.
     *
     * @param chat_id Unique identifier for the target chat or username of the target supergroup (in the format @supergroupusername)
     * @param permissions New default chat permissions
     * @param other Optional remaining parameters, confer the official reference below
     * @param signal Optional `AbortSignal` to cancel the request
     *
     * **Official reference:** https://core.telegram.org/bots/api#setchatpermissions
     */ setChatPermissions(chat_id, permissions, other, signal) {
        return this.raw.setChatPermissions({
            chat_id,
            permissions,
            ...other
        }, signal);
    }
    /**
     * Use this method to generate a new primary invite link for a chat; any previously generated primary link is revoked. The bot must be an administrator in the chat for this to work and must have the appropriate administrator rights. Returns the new invite link as String on success.
     *
     * Note: Each administrator in a chat generates their own invite links. Bots can't use invite links generated by other administrators. If you want your bot to work with invite links, it will need to generate its own link using exportChatInviteLink or by calling the getChat method. If your bot needs to generate a new primary invite link replacing its previous one, use exportChatInviteLink again.
     *
     * @param chat_id Unique identifier for the target chat or username of the target channel (in the format @channelusername)
     * @param signal Optional `AbortSignal` to cancel the request
     *
     * **Official reference:** https://core.telegram.org/bots/api#exportchatinvitelink
     */ exportChatInviteLink(chat_id, signal) {
        return this.raw.exportChatInviteLink({
            chat_id
        }, signal);
    }
    /**
     * Use this method to create an additional invite link for a chat. The bot must be an administrator in the chat for this to work and must have the appropriate administrator rights. The link can be revoked using the method revokeChatInviteLink. Returns the new invite link as ChatInviteLink object.
     *
     * @param chat_id Unique identifier for the target chat or username of the target channel (in the format @channelusername)
     * @param other Optional remaining parameters, confer the official reference below
     * @param signal Optional `AbortSignal` to cancel the request
     *
     * **Official reference:** https://core.telegram.org/bots/api#createchatinvitelink
     */ createChatInviteLink(chat_id, other, signal) {
        return this.raw.createChatInviteLink({
            chat_id,
            ...other
        }, signal);
    }
    /**
     *  Use this method to edit a non-primary invite link created by the bot. The bot must be an administrator in the chat for this to work and must have the appropriate administrator rights. Returns the edited invite link as a ChatInviteLink object.
     *
     * @param chat_id Unique identifier for the target chat or username of the target channel (in the format @channelusername)
     * @param invite_link The invite link to edit
     * @param other Optional remaining parameters, confer the official reference below
     * @param signal Optional `AbortSignal` to cancel the request
     *
     * **Official reference:** https://core.telegram.org/bots/api#editchatinvitelink
     */ editChatInviteLink(chat_id, invite_link, other, signal) {
        return this.raw.editChatInviteLink({
            chat_id,
            invite_link,
            ...other
        }, signal);
    }
    /**
     *  Use this method to revoke an invite link created by the bot. If the primary link is revoked, a new link is automatically generated. The bot must be an administrator in the chat for this to work and must have the appropriate administrator rights. Returns the revoked invite link as ChatInviteLink object.
     *
     * @param chat_id Unique identifier of the target chat or username of the target channel (in the format @channelusername)
     * @param invite_link The invite link to revoke
     * @param signal Optional `AbortSignal` to cancel the request
     *
     * **Official reference:** https://core.telegram.org/bots/api#revokechatinvitelink
     */ revokeChatInviteLink(chat_id, invite_link, signal) {
        return this.raw.revokeChatInviteLink({
            chat_id,
            invite_link
        }, signal);
    }
    /**
     * Use this method to approve a chat join request. The bot must be an administrator in the chat for this to work and must have the can_invite_users administrator right. Returns True on success.
     *
     * @param chat_id Unique identifier for the target chat or username of the target channel (in the format @channelusername)
     * @param user_id Unique identifier of the target user
     * @param signal Optional `AbortSignal` to cancel the request
     *
     * **Official reference:** https://core.telegram.org/bots/api#approvechatjoinrequest
     */ approveChatJoinRequest(chat_id, user_id, signal) {
        return this.raw.approveChatJoinRequest({
            chat_id,
            user_id
        }, signal);
    }
    /**
     * Use this method to decline a chat join request. The bot must be an administrator in the chat for this to work and must have the can_invite_users administrator right. Returns True on success.
     *
     * @param chat_id Unique identifier for the target chat or username of the target channel (in the format @channelusername)
     * @param user_id Unique identifier of the target user
     * @param signal Optional `AbortSignal` to cancel the request
     *
     * **Official reference:** https://core.telegram.org/bots/api#declinechatjoinrequest
     */ declineChatJoinRequest(chat_id, user_id, signal) {
        return this.raw.declineChatJoinRequest({
            chat_id,
            user_id
        }, signal);
    }
    /**
     * Use this method to set a new profile photo for the chat. Photos can't be changed for private chats. The bot must be an administrator in the chat for this to work and must have the appropriate administrator rights. Returns True on success.
     *
     * @param chat_id Unique identifier for the target chat or username of the target channel (in the format @channelusername)
     * @param photo New chat photo, uploaded using multipart/form-data
     * @param signal Optional `AbortSignal` to cancel the request
     *
     * **Official reference:** https://core.telegram.org/bots/api#setchatphoto
     */ setChatPhoto(chat_id, photo, signal) {
        return this.raw.setChatPhoto({
            chat_id,
            photo
        }, signal);
    }
    /**
     * Use this method to delete a chat photo. Photos can't be changed for private chats. The bot must be an administrator in the chat for this to work and must have the appropriate administrator rights. Returns True on success.
     *
     * @param chat_id Unique identifier for the target chat or username of the target channel (in the format @channelusername)
     * @param signal Optional `AbortSignal` to cancel the request
     *
     * **Official reference:** https://core.telegram.org/bots/api#deletechatphoto
     */ deleteChatPhoto(chat_id, signal) {
        return this.raw.deleteChatPhoto({
            chat_id
        }, signal);
    }
    /**
     * Use this method to change the title of a chat. Titles can't be changed for private chats. The bot must be an administrator in the chat for this to work and must have the appropriate administrator rights. Returns True on success.
     *
     * @param chat_id Unique identifier for the target chat or username of the target channel (in the format @channelusername)
     * @param title New chat title, 1-255 characters
     * @param signal Optional `AbortSignal` to cancel the request
     *
     * **Official reference:** https://core.telegram.org/bots/api#setchattitle
     */ setChatTitle(chat_id, title, signal) {
        return this.raw.setChatTitle({
            chat_id,
            title
        }, signal);
    }
    /**
     * Use this method to change the description of a group, a supergroup or a channel. The bot must be an administrator in the chat for this to work and must have the appropriate administrator rights. Returns True on success.
     *
     * @param chat_id Unique identifier for the target chat or username of the target channel (in the format @channelusername)
     * @param description New chat description, 0-255 characters
     * @param signal Optional `AbortSignal` to cancel the request
     *
     * **Official reference:** https://core.telegram.org/bots/api#setchatdescription
     */ setChatDescription(chat_id, description, signal) {
        return this.raw.setChatDescription({
            chat_id,
            description
        }, signal);
    }
    /**
     * Use this method to add a message to the list of pinned messages in a chat. If the chat is not a private chat, the bot must be an administrator in the chat for this to work and must have the 'can_pin_messages' administrator right in a supergroup or 'can_edit_messages' administrator right in a channel. Returns True on success.
     *
     * @param chat_id Unique identifier for the target chat or username of the target channel (in the format @channelusername)
     * @param message_id Identifier of a message to pin
     * @param other Optional remaining parameters, confer the official reference below
     * @param signal Optional `AbortSignal` to cancel the request
     *
     * **Official reference:** https://core.telegram.org/bots/api#pinchatmessage
     */ pinChatMessage(chat_id, message_id, other, signal) {
        return this.raw.pinChatMessage({
            chat_id,
            message_id,
            ...other
        }, signal);
    }
    /**
     * Use this method to remove a message from the list of pinned messages in a chat. If the chat is not a private chat, the bot must be an administrator in the chat for this to work and must have the 'can_pin_messages' administrator right in a supergroup or 'can_edit_messages' administrator right in a channel. Returns True on success.
     *
     * @param chat_id Unique identifier for the target chat or username of the target channel (in the format @channelusername)
     * @param message_id Identifier of a message to unpin. If not specified, the most recent pinned message (by sending date) will be unpinned.
     * @param other Optional remaining parameters, confer the official reference below
     * @param signal Optional `AbortSignal` to cancel the request
     *
     * **Official reference:** https://core.telegram.org/bots/api#unpinchatmessage
     */ unpinChatMessage(chat_id, message_id, signal) {
        return this.raw.unpinChatMessage({
            chat_id,
            message_id
        }, signal);
    }
    /**
     * Use this method to clear the list of pinned messages in a chat. If the chat is not a private chat, the bot must be an administrator in the chat for this to work and must have the 'can_pin_messages' administrator right in a supergroup or 'can_edit_messages' administrator right in a channel. Returns True on success.
     *
     * @param chat_id Unique identifier for the target chat or username of the target channel (in the format @channelusername)
     * @param signal Optional `AbortSignal` to cancel the request
     *
     * **Official reference:** https://core.telegram.org/bots/api#unpinallchatmessages
     */ unpinAllChatMessages(chat_id, signal) {
        return this.raw.unpinAllChatMessages({
            chat_id
        }, signal);
    }
    /**
     * Use this method for your bot to leave a group, supergroup or channel. Returns True on success.
     *
     * @param chat_id Unique identifier for the target chat or username of the target supergroup or channel (in the format @channelusername)
     * @param signal Optional `AbortSignal` to cancel the request
     *
     * **Official reference:** https://core.telegram.org/bots/api#leavechat
     */ leaveChat(chat_id, signal) {
        return this.raw.leaveChat({
            chat_id
        }, signal);
    }
    /**
     * Use this method to get up to date information about the chat (current name of the user for one-on-one conversations, current username of a user, group or channel, etc.). Returns a Chat object on success.
     *
     * @param chat_id Unique identifier for the target chat or username of the target supergroup or channel (in the format @channelusername)
     * @param signal Optional `AbortSignal` to cancel the request
     *
     * **Official reference:** https://core.telegram.org/bots/api#getchat
     */ getChat(chat_id, signal) {
        return this.raw.getChat({
            chat_id
        }, signal);
    }
    /**
     * Use this method to get a list of administrators in a chat, which aren't bots. Returns an Array of ChatMember objects.
     *
     * @param chat_id Unique identifier for the target chat or username of the target supergroup or channel (in the format @channelusername)
     * @param signal Optional `AbortSignal` to cancel the request
     *
     * **Official reference:** https://core.telegram.org/bots/api#getchatadministrators
     */ getChatAdministrators(chat_id, signal) {
        return this.raw.getChatAdministrators({
            chat_id
        }, signal);
    }
    /** @deprecated Use `getChatMemberCount` instead. */ getChatMembersCount(...args) {
        return this.getChatMemberCount(...args);
    }
    /**
     * Use this method to get the number of members in a chat. Returns Int on success.
     *
     * @param chat_id Unique identifier for the target chat or username of the target supergroup or channel (in the format @channelusername)
     * @param signal Optional `AbortSignal` to cancel the request
     *
     * **Official reference:** https://core.telegram.org/bots/api#getchatmembercount
     */ getChatMemberCount(chat_id, signal) {
        return this.raw.getChatMemberCount({
            chat_id
        }, signal);
    }
    /**
     * Use this method to get information about a member of a chat. The method is guaranteed to work only if the bot is an administrator in the chat. Returns a ChatMember object on success.
     *
     * @param chat_id Unique identifier for the target chat or username of the target supergroup or channel (in the format @channelusername)
     * @param user_id Unique identifier of the target user
     * @param signal Optional `AbortSignal` to cancel the request
     *
     * **Official reference:** https://core.telegram.org/bots/api#getchatmember
     */ getChatMember(chat_id, user_id, signal) {
        return this.raw.getChatMember({
            chat_id,
            user_id
        }, signal);
    }
    /**
     * Use this method to set a new group sticker set for a supergroup. The bot must be an administrator in the chat for this to work and must have the appropriate administrator rights. Use the field can_set_sticker_set ly returned in getChat requests to check if the bot can use this method. Returns True on success.
     *
     * @param chat_id Unique identifier for the target chat or username of the target supergroup (in the format @supergroupusername)
     * @param sticker_set_name Name of the sticker set to be set as the group sticker set
     * @param signal Optional `AbortSignal` to cancel the request
     *
     * **Official reference:** https://core.telegram.org/bots/api#setchatstickerset
     */ setChatStickerSet(chat_id, sticker_set_name, signal) {
        return this.raw.setChatStickerSet({
            chat_id,
            sticker_set_name
        }, signal);
    }
    /**
     * Use this method to delete a group sticker set from a supergroup. The bot must be an administrator in the chat for this to work and must have the appropriate administrator rights. Use the field can_set_sticker_set ly returned in getChat requests to check if the bot can use this method. Returns True on success.
     *
     * @param chat_id Unique identifier for the target chat or username of the target supergroup (in the format @supergroupusername)
     * @param signal Optional `AbortSignal` to cancel the request
     *
     * **Official reference:** https://core.telegram.org/bots/api#deletechatstickerset
     */ deleteChatStickerSet(chat_id, signal) {
        return this.raw.deleteChatStickerSet({
            chat_id
        }, signal);
    }
    /**
     * Use this method to get custom emoji stickers, which can be used as a forum topic icon by any user. Requires no parameters. Returns an Array of Sticker objects.
     *
     * @param signal Optional `AbortSignal` to cancel the request
     *
     * **Official reference:** https://core.telegram.org/bots/api#getforumtopiciconstickers
     */ getForumTopicIconStickers(signal) {
        return this.raw.getForumTopicIconStickers(signal);
    }
    /**
     * Use this method to create a topic in a forum supergroup chat. The bot must be an administrator in the chat for this to work and must have the can_manage_topics administrator rights. Returns information about the created topic as a ForumTopic object.
     *
     * @param chat_id Unique identifier for the target chat or username of the target supergroup (in the format @supergroupusername)
     * @param name Topic name, 1-128 characters
     * @param other Optional remaining parameters, confer the official reference below
     * @param signal Optional `AbortSignal` to cancel the request
     *
     * **Official reference:** https://core.telegram.org/bots/api#createforumtopic
     */ createForumTopic(chat_id, name, other, signal) {
        return this.raw.createForumTopic({
            chat_id,
            name,
            ...other
        }, signal);
    }
    /**
     * Use this method to edit name and icon of a topic in a forum supergroup chat. The bot must be an administrator in the chat for this to work and must have can_manage_topics administrator rights, unless it is the creator of the topic. Returns True on success.
     *
     * @param chat_id Unique identifier for the target chat or username of the target supergroup (in the format @supergroupusername)
     * @param message_thread_id Unique identifier for the target message thread of the forum topic
     * @param other Optional remaining parameters, confer the official reference below
     * @param signal Optional `AbortSignal` to cancel the request
     *
     * **Official reference:** https://core.telegram.org/bots/api#editforumtopic
     */ editForumTopic(chat_id, message_thread_id, other, signal) {
        return this.raw.editForumTopic({
            chat_id,
            message_thread_id,
            ...other
        }, signal);
    }
    /**
     * Use this method to close an open topic in a forum supergroup chat. The bot must be an administrator in the chat for this to work and must have the can_manage_topics administrator rights, unless it is the creator of the topic. Returns True on success.
     *
     * @param chat_id Unique identifier for the target chat or username of the target supergroup (in the format @supergroupusername)
     * @param message_thread_id Unique identifier for the target message thread of the forum topic
     * @param signal Optional `AbortSignal` to cancel the request
     *
     * **Official reference:** https://core.telegram.org/bots/api#closeforumtopic
     */ closeForumTopic(chat_id, message_thread_id, signal) {
        return this.raw.closeForumTopic({
            chat_id,
            message_thread_id
        }, signal);
    }
    /**
     * Use this method to reopen a closed topic in a forum supergroup chat. The bot must be an administrator in the chat for this to work and must have the can_manage_topics administrator rights, unless it is the creator of the topic. Returns True on success.
     *
     * @param chat_id Unique identifier for the target chat or username of the target supergroup (in the format @supergroupusername)
     * @param message_thread_id Unique identifier for the target message thread of the forum topic
     * @param signal Optional `AbortSignal` to cancel the request
     *
     * **Official reference:** https://core.telegram.org/bots/api#reopenforumtopic
     */ reopenForumTopic(chat_id, message_thread_id, signal) {
        return this.raw.reopenForumTopic({
            chat_id,
            message_thread_id
        }, signal);
    }
    /**
     * Use this method to delete a forum topic along with all its messages in a forum supergroup chat. The bot must be an administrator in the chat for this to work and must have the can_delete_messages administrator rights. Returns True on success.
     *
     * @param chat_id Unique identifier for the target chat or username of the target supergroup (in the format @supergroupusername)
     * @param message_thread_id Unique identifier for the target message thread of the forum topic
     * @param signal Optional `AbortSignal` to cancel the request
     *
     * **Official reference:** https://core.telegram.org/bots/api#deleteforumtopic
     */ deleteForumTopic(chat_id, message_thread_id, signal) {
        return this.raw.deleteForumTopic({
            chat_id,
            message_thread_id
        }, signal);
    }
    /**
     * Use this method to clear the list of pinned messages in a forum topic. The bot must be an administrator in the chat for this to work and must have the can_pin_messages administrator right in the supergroup. Returns True on success.
     *
     * @param chat_id Unique identifier for the target chat or username of the target supergroup (in the format @supergroupusername)
     * @param message_thread_id Unique identifier for the target message thread of the forum topic
     * @param signal Optional `AbortSignal` to cancel the request
     *
     * **Official reference:** https://core.telegram.org/bots/api#unpinallforumtopicmessages
     */ unpinAllForumTopicMessages(chat_id, message_thread_id, signal) {
        return this.raw.unpinAllForumTopicMessages({
            chat_id,
            message_thread_id
        }, signal);
    }
    /**
     * Use this method to edit the name of the 'General' topic in a forum supergroup chat. The bot must be an administrator in the chat for this to work and must have can_manage_topics administrator rights. Returns True on success.
     *
     * @param chat_id Unique identifier for the target chat or username of the target supergroup (in the format @supergroupusername)
     * @param name New topic name, 1-128 characters
     * @param signal Optional `AbortSignal` to cancel the request
     *
     * **Official reference:** https://core.telegram.org/bots/api#editgeneralforumtopic
     */ editGeneralForumTopic(chat_id, name, signal) {
        return this.raw.editGeneralForumTopic({
            chat_id,
            name
        }, signal);
    }
    /**
     * Use this method to close an open 'General' topic in a forum supergroup chat. The bot must be an administrator in the chat for this to work and must have the can_manage_topics administrator rights. Returns True on success.
     *
     * @param chat_id Unique identifier for the target chat or username of the target supergroup (in the format @supergroupusername)
     * @param signal Optional `AbortSignal` to cancel the request
     *
     * **Official reference:** https://core.telegram.org/bots/api#closegeneralforumtopic
     */ closeGeneralForumTopic(chat_id, signal) {
        return this.raw.closeGeneralForumTopic({
            chat_id
        }, signal);
    }
    /**
     * Use this method to reopen a closed 'General' topic in a forum supergroup chat. The bot must be an administrator in the chat for this to work and must have the can_manage_topics administrator rights. The topic will be automatically unhidden if it was hidden. Returns True on success.     *
     *
     * @param chat_id Unique identifier for the target chat or username of the target supergroup (in the format @supergroupusername)
     * @param signal Optional `AbortSignal` to cancel the request
     *
     * **Official reference:** https://core.telegram.org/bots/api#reopengeneralforumtopic
     */ reopenGeneralForumTopic(chat_id, signal) {
        return this.raw.reopenGeneralForumTopic({
            chat_id
        }, signal);
    }
    /**
     * Use this method to hide the 'General' topic in a forum supergroup chat. The bot must be an administrator in the chat for this to work and must have the can_manage_topics administrator rights. The topic will be automatically closed if it was open. Returns True on success.
     *
     * @param chat_id Unique identifier for the target chat or username of the target supergroup (in the format @supergroupusername)
     * @param signal Optional `AbortSignal` to cancel the request
     *
     * **Official reference:** https://core.telegram.org/bots/api#hidegeneralforumtopic
     */ hideGeneralForumTopic(chat_id, signal) {
        return this.raw.hideGeneralForumTopic({
            chat_id
        }, signal);
    }
    /**
     * Use this method to unhide the 'General' topic in a forum supergroup chat. The bot must be an administrator in the chat for this to work and must have the can_manage_topics administrator rights. Returns True on success.
     *
     * @param chat_id Unique identifier for the target chat or username of the target supergroup (in the format @supergroupusername)
     * @param signal Optional `AbortSignal` to cancel the request
     *
     * **Official reference:** https://core.telegram.org/bots/api#unhidegeneralforumtopic
     */ unhideGeneralForumTopic(chat_id, signal) {
        return this.raw.unhideGeneralForumTopic({
            chat_id
        }, signal);
    }
    /**
     * Use this method to clear the list of pinned messages in a General forum topic. The bot must be an administrator in the chat for this to work and must have the can_pin_messages administrator right in the supergroup. Returns True on success.
     *
     * @param chat_id Unique identifier for the target chat or username of the target supergroup (in the format @supergroupusername)
     * @param signal Optional `AbortSignal` to cancel the request
     *
     * **Official reference:** https://core.telegram.org/bots/api#unpinallgeneralforumtopicmessages
     */ unpinAllGeneralForumTopicMessages(chat_id, signal) {
        return this.raw.unpinAllGeneralForumTopicMessages({
            chat_id
        }, signal);
    }
    /**
     * Use this method to send answers to callback queries sent from inline keyboards. The answer will be displayed to the user as a notification at the top of the chat screen or as an alert. On success, True is returned.
     *
     * Alternatively, the user can be redirected to the specified Game URL. For this option to work, you must first create a game for your bot via @BotFather and accept the terms. Otherwise, you may use links like t.me/your_bot?start=XXXX that open your bot with a parameter.
     *
     * @param callback_query_id Unique identifier for the query to be answered
     * @param other Optional remaining parameters, confer the official reference below
     * @param signal Optional `AbortSignal` to cancel the request
     *
     * **Official reference:** https://core.telegram.org/bots/api#answercallbackquery
     */ answerCallbackQuery(callback_query_id, other, signal) {
        return this.raw.answerCallbackQuery({
            callback_query_id,
            ...other
        }, signal);
    }
    /**
     * Use this method to change the bot's name. Returns True on success.
     *
     * @param name New bot name; 0-64 characters. Pass an empty string to remove the dedicated name for the given language.
     * @param other Optional remaining parameters, confer the official reference below
     * @param signal Optional `AbortSignal` to cancel the request
     *
     * **Official reference:** https://core.telegram.org/bots/api#setmyname
     */ setMyName(name, other, signal) {
        return this.raw.setMyName({
            name,
            ...other
        }, signal);
    }
    /**
     * Use this method to get the current bot name for the given user language. Returns BotName on success.
     *
     * @param other Optional remaining parameters, confer the official reference below
     * @param signal Optional `AbortSignal` to cancel the request
     *
     * **Official reference:** https://core.telegram.org/bots/api#getmyname
     */ getMyName(other, signal) {
        return this.raw.getMyName(other ?? {}, signal);
    }
    /**
     * Use this method to change the list of the bot's commands. See https://core.telegram.org/bots/features#commands for more details about bot commands. Returns True on success.
     *
     * @param commands A list of bot commands to be set as the list of the bot's commands. At most 100 commands can be specified.
     * @param other Optional remaining parameters, confer the official reference below
     * @param signal Optional `AbortSignal` to cancel the request
     *
     * **Official reference:** https://core.telegram.org/bots/api#setmycommands
     */ setMyCommands(commands, other, signal) {
        return this.raw.setMyCommands({
            commands,
            ...other
        }, signal);
    }
    /**
     * Use this method to delete the list of the bot's commands for the given scope and user language. After deletion, higher level commands will be shown to affected users. Returns True on success.
     *
     * @param other Optional remaining parameters, confer the official reference below
     * @param signal Optional `AbortSignal` to cancel the request
     *
     * **Official reference:** https://core.telegram.org/bots/api#deletemycommands
     */ deleteMyCommands(other, signal) {
        return this.raw.deleteMyCommands({
            ...other
        }, signal);
    }
    /**
     * Use this method to get the current list of the bot's commands for the given scope and user language. Returns an Array of BotCommand objects. If commands aren't set, an empty list is returned.
     *
     * @param other Optional remaining parameters, confer the official reference below
     * @param signal Optional `AbortSignal` to cancel the request
     *
     * **Official reference:** https://core.telegram.org/bots/api#getmycommands
     */ getMyCommands(other, signal) {
        return this.raw.getMyCommands({
            ...other
        }, signal);
    }
    /**
     * Use this method to change the bot's description, which is shown in the chat with the bot if the chat is empty. Returns True on success.
     *
     * @param description New bot description; 0-512 characters. Pass an empty string to remove the dedicated description for the given language.
     * @param other Optional remaining paramters, confer the official reference below
     * @param signal Optional `AbortSignal` to cancel the request
     *
     * **Official reference:** https://core.telegram.org/bots/api#setmydescription
     */ setMyDescription(description, other, signal) {
        return this.raw.setMyDescription({
            description,
            ...other
        }, signal);
    }
    /**
     * Use this method to get the current bot description for the given user language. Returns BotDescription on success.
     *
     * @param other Optional remaining paramters, confer the official reference below
     * @param signal Optional `AbortSignal` to cancel the request
     *
     * **Official reference:** https://core.telegram.org/bots/api#getmydescription
     */ getMyDescription(other, signal) {
        return this.raw.getMyDescription({
            ...other
        }, signal);
    }
    /**
     * Use this method to change the bot's short description, which is shown on the bot's profile page and is sent together with the link when users share the bot. Returns True on success.
     *
     * @param short_description New short description for the bot; 0-120 characters. Pass an empty string to remove the dedicated short description for the given language.
     * @param other Optional remaining paramters, confer the official reference below
     * @param signal Optional `AbortSignal` to cancel the request
     *
     * **Official reference:** https://core.telegram.org/bots/api#setmyshortdescription
     */ setMyShortDescription(short_description, other, signal) {
        return this.raw.setMyShortDescription({
            short_description,
            ...other
        }, signal);
    }
    /**
     * Use this method to get the current bot short description for the given user language. Returns BotShortDescription on success.
     *
     * @param other Optional remaining paramters, confer the official reference below
     * @param signal Optional `AbortSignal` to cancel the request
     *
     * **Official reference:** https://core.telegram.org/bots/api#getmyshortdescription
     */ getMyShortDescription(other, signal) {
        return this.raw.getMyShortDescription({
            ...other
        }, signal);
    }
    /**
     * Use this method to change the bot's menu button in a private chat, or the default menu button. Returns True on success.
     *
     * @param other Optional remaining parameters, confer the official reference below
     * @param signal Optional `AbortSignal` to cancel the request
     *
     * **Official reference:** https://core.telegram.org/bots/api#setchatmenubutton
     */ setChatMenuButton(other, signal) {
        return this.raw.setChatMenuButton({
            ...other
        }, signal);
    }
    /**
     * Use this method to get the current value of the bot's menu button in a private chat, or the default menu button. Returns MenuButton on success.
     *
     * @param other Optional remaining parameters, confer the official reference below
     * @param signal Optional `AbortSignal` to cancel the request
     *
     * **Official reference:** https://core.telegram.org/bots/api#getchatmenubutton
     */ getChatMenuButton(other, signal) {
        return this.raw.getChatMenuButton({
            ...other
        }, signal);
    }
    /**
     * Use this method to the change the default administrator rights requested by the bot when it's added as an administrator to groups or channels. These rights will be suggested to users, but they are are free to modify the list before adding the bot. Returns True on success.
     *
     * @param other Optional remaining parameters, confer the official reference below
     * @param signal Optional `AbortSignal` to cancel the request
     *
     * **Official reference:** https://core.telegram.org/bots/api#setmydefaultadministratorrights
     */ setMyDefaultAdministratorRights(other, signal) {
        return this.raw.setMyDefaultAdministratorRights({
            ...other
        }, signal);
    }
    /**
     * Use this method to get the current default administrator rights of the bot. Returns ChatAdministratorRights on success.
     *
     * @param other Optional remaining parameters, confer the official reference below
     * @param signal Optional `AbortSignal` to cancel the request
     *
     * **Official reference:** https://core.telegram.org/bots/api#getmydefaultadministratorrights
     */ getMyDefaultAdministratorRights(other, signal) {
        return this.raw.getMyDefaultAdministratorRights({
            ...other
        }, signal);
    }
    /**
     * Use this method to edit text and game messages. On success, if the edited message is not an inline message, the edited Message is returned, otherwise True is returned. Note that business messages that were not sent by the bot and do not contain an inline keyboard can only be edited within 48 hours from the time they were sent.
     *
     * @param chat_id Unique identifier for the target chat or username of the target channel (in the format @channelusername)
     * @param message_id Identifier of the message to edit
     * @param text New text of the message, 1-4096 characters after entities parsing
     * @param other Optional remaining parameters, confer the official reference below
     * @param signal Optional `AbortSignal` to cancel the request
     *
     * **Official reference:** https://core.telegram.org/bots/api#editmessagetext
     */ editMessageText(chat_id, message_id, text, other, signal) {
        return this.raw.editMessageText({
            chat_id,
            message_id,
            text,
            ...other
        }, signal);
    }
    /**
     * Use this method to edit text and game inline messages. On success, if the edited message is not an inline message, the edited Message is returned, otherwise True is returned. Note that business messages that were not sent by the bot and do not contain an inline keyboard can only be edited within 48 hours from the time they were sent.
     *
     * @param inline_message_id Identifier of the inline message
     * @param other Optional remaining parameters, confer the official reference below
     * @param signal Optional `AbortSignal` to cancel the request
     *
     * **Official reference:** https://core.telegram.org/bots/api#editmessagetext
     */ editMessageTextInline(inline_message_id, text, other, signal) {
        return this.raw.editMessageText({
            inline_message_id,
            text,
            ...other
        }, signal);
    }
    /**
     * Use this method to edit captions of messages. On success, if the edited message is not an inline message, the edited Message is returned, otherwise True is returned. Note that business messages that were not sent by the bot and do not contain an inline keyboard can only be edited within 48 hours from the time they were sent.
     *
     * @param chat_id Unique identifier for the target chat or username of the target channel (in the format @channelusername)
     * @param message_id Identifier of the message to edit
     * @param other Optional remaining parameters, confer the official reference below
     * @param signal Optional `AbortSignal` to cancel the request
     *
     * **Official reference:** https://core.telegram.org/bots/api#editmessagecaption
     */ editMessageCaption(chat_id, message_id, other, signal) {
        return this.raw.editMessageCaption({
            chat_id,
            message_id,
            ...other
        }, signal);
    }
    /**
     * Use this method to edit captions of inline messages. On success, if the edited message is not an inline message, the edited Message is returned, otherwise True is returned. Note that business messages that were not sent by the bot and do not contain an inline keyboard can only be edited within 48 hours from the time they were sent.
     *
     * @param inline_message_id Identifier of the inline message
     * @param other Optional remaining parameters, confer the official reference below
     * @param signal Optional `AbortSignal` to cancel the request
     *
     * **Official reference:** https://core.telegram.org/bots/api#editmessagecaption
     */ editMessageCaptionInline(inline_message_id, other, signal) {
        return this.raw.editMessageCaption({
            inline_message_id,
            ...other
        }, signal);
    }
    /**
     * Use this method to edit animation, audio, document, photo, or video messages. If a message is part of a message album, then it can be edited only to an audio for audio albums, only to a document for document albums and to a photo or a video otherwise. When an inline message is edited, a new file can't be uploaded; use a previously uploaded file via its file_id or specify a URL. On success, if the edited message is not an inline message, the edited Message is returned, otherwise True is returned. Note that business messages that were not sent by the bot and do not contain an inline keyboard can only be edited within 48 hours from the time they were sent.
     *
     * @param chat_id Unique identifier for the target chat or username of the target channel (in the format @channelusername)
     * @param message_id Identifier of the message to edit
     * @param media An object for a new media content of the message
     * @param other Optional remaining parameters, confer the official reference below
     * @param signal Optional `AbortSignal` to cancel the request
     *
     * **Official reference:** https://core.telegram.org/bots/api#editmessagemedia
     */ editMessageMedia(chat_id, message_id, media, other, signal) {
        return this.raw.editMessageMedia({
            chat_id,
            message_id,
            media,
            ...other
        }, signal);
    }
    /**
     * Use this method to edit animation, audio, document, photo, or video inline messages. If a message is part of a message album, then it can be edited only to an audio for audio albums, only to a document for document albums and to a photo or a video otherwise. When an inline message is edited, a new file can't be uploaded; use a previously uploaded file via its file_id or specify a URL. On success, if the edited message is not an inline message, the edited Message is returned, otherwise True is returned. Note that business messages that were not sent by the bot and do not contain an inline keyboard can only be edited within 48 hours from the time they were sent.
     *
     * @param inline_message_id Identifier of the inline message
     * @param media An object for a new media content of the message
     * @param other Optional remaining parameters, confer the official reference below
     * @param signal Optional `AbortSignal` to cancel the request
     *
     * **Official reference:** https://core.telegram.org/bots/api#editmessagemedia
     */ editMessageMediaInline(inline_message_id, media, other, signal) {
        return this.raw.editMessageMedia({
            inline_message_id,
            media,
            ...other
        }, signal);
    }
    /**
     * Use this method to edit only the reply markup of messages. On success, if the edited message is not an inline message, the edited Message is returned, otherwise True is returned. Note that business messages that were not sent by the bot and do not contain an inline keyboard can only be edited within 48 hours from the time they were sent.
     *
     * @param chat_id Unique identifier for the target chat or username of the target channel (in the format @channelusername)
     * @param message_id Identifier of the message to edit
     * @param other Optional remaining parameters, confer the official reference below
     * @param signal Optional `AbortSignal` to cancel the request
     *
     * **Official reference:** https://core.telegram.org/bots/api#editmessagereplymarkup
     */ editMessageReplyMarkup(chat_id, message_id, other, signal) {
        return this.raw.editMessageReplyMarkup({
            chat_id,
            message_id,
            ...other
        }, signal);
    }
    /**
     * Use this method to edit only the reply markup of inline messages. On success, if the edited message is not an inline message, the edited Message is returned, otherwise True is returned. Note that business messages that were not sent by the bot and do not contain an inline keyboard can only be edited within 48 hours from the time they were sent.
     *
     * @param inline_message_id Identifier of the inline message
     * @param other Optional remaining parameters, confer the official reference below
     * @param signal Optional `AbortSignal` to cancel the request
     *
     * **Official reference:** https://core.telegram.org/bots/api#editmessagereplymarkup
     */ editMessageReplyMarkupInline(inline_message_id, other, signal) {
        return this.raw.editMessageReplyMarkup({
            inline_message_id,
            ...other
        }, signal);
    }
    /**
     * Use this method to stop a poll which was sent by the bot. On success, the stopped Poll is returned.
     *
     * @param chat_id Unique identifier for the target chat or username of the target channel (in the format @channelusername)
     * @param message_id Identifier of the original message with the poll
     * @param other Optional remaining parameters, confer the official reference below
     * @param signal Optional `AbortSignal` to cancel the request
     *
     * **Official reference:** https://core.telegram.org/bots/api#stoppoll
     */ stopPoll(chat_id, message_id, other, signal) {
        return this.raw.stopPoll({
            chat_id,
            message_id,
            ...other
        }, signal);
    }
    /**
     * Use this method to delete a message, including service messages, with the following limitations:
     * - A message can only be deleted if it was sent less than 48 hours ago.
     * - A dice message in a private chat can only be deleted if it was sent more than 24 hours ago.
     * - Bots can delete outgoing messages in private chats, groups, and supergroups.
     * - Bots can delete incoming messages in private chats.
     * - Bots granted can_post_messages permissions can delete outgoing messages in channels.
     * - If the bot is an administrator of a group, it can delete any message there.
     * - If the bot has can_delete_messages permission in a supergroup or a channel, it can delete any message there.
     * Returns True on success.
     *
     * @param chat_id Unique identifier for the target chat or username of the target channel (in the format @channelusername)
     * @param message_id Identifier of the message to delete
     * @param signal Optional `AbortSignal` to cancel the request
     *
     * **Official reference:** https://core.telegram.org/bots/api#deletemessage
     */ deleteMessage(chat_id, message_id, signal) {
        return this.raw.deleteMessage({
            chat_id,
            message_id
        }, signal);
    }
    /**
     * Use this method to delete multiple messages simultaneously. Returns True on success.
     *
     * @param chat_id Unique identifier for the target chat or username of the target channel (in the format @channelusername)
     * @param message_ids A list of 1-100 identifiers of messages to delete. See deleteMessage for limitations on which messages can be deleted
     * @param signal Optional `AbortSignal` to cancel the request
     *
     * **Official reference:** https://core.telegram.org/bots/api#deletemessages
     */ deleteMessages(chat_id, message_ids, signal) {
        return this.raw.deleteMessages({
            chat_id,
            message_ids
        }, signal);
    }
    /**
     * Use this method to send static .WEBP, animated .TGS, or video .WEBM stickers. On success, the sent Message is returned.
     *
     * @param chat_id Unique identifier for the target chat or username of the target channel (in the format @channelusername)
     * @param sticker Sticker to send. Pass a file_id as String to send a file that exists on the Telegram servers (recommended), pass an HTTP URL as a String for Telegram to get a .WEBP sticker from the Internet, or upload a new .WEBP, .TGS, or .WEBM sticker using multipart/form-data. Video and animated stickers can't be sent via an HTTP URL.
     * @param other Optional remaining parameters, confer the official reference below
     * @param signal Optional `AbortSignal` to cancel the request
     *
     * **Official reference:** https://core.telegram.org/bots/api#sendsticker
     */ sendSticker(chat_id, sticker, other, signal) {
        return this.raw.sendSticker({
            chat_id,
            sticker,
            ...other
        }, signal);
    }
    /**
     * Use this method to get a sticker set. On success, a StickerSet object is returned.
     *
     * @param name Name of the sticker set
     * @param signal Optional `AbortSignal` to cancel the request
     *
     * **Official reference:** https://core.telegram.org/bots/api#getstickerset
     */ getStickerSet(name, signal) {
        return this.raw.getStickerSet({
            name
        }, signal);
    }
    /**
     * Use this method to get information about custom emoji stickers by their identifiers. Returns an Array of Sticker objects.
     *
     * @param custom_emoji_ids A list of custom emoji identifiers
     * @param signal Optional `AbortSignal` to cancel the request
     *
     * **Official reference:** https://core.telegram.org/bots/api#getcustomemojistickers
     */ getCustomEmojiStickers(custom_emoji_ids, signal) {
        return this.raw.getCustomEmojiStickers({
            custom_emoji_ids
        }, signal);
    }
    /**
     * Use this method to upload a file with a sticker for later use in the createNewStickerSet, addStickerToSet, or replaceStickerInSet methods (the file can be used multiple times). Returns the uploaded File on success.
     *
     * @param user_id User identifier of sticker file owner
     * @param sticker_format Format of the sticker, must be one of “static”, “animated”, “video”
     * @param sticker A file with the sticker in .WEBP, .PNG, .TGS, or .WEBM format. See https://core.telegram.org/stickers for technical requirements.
     * @param signal Optional `AbortSignal` to cancel the request
     *
     * **Official reference:** https://core.telegram.org/bots/api#uploadstickerfile
     */ uploadStickerFile(user_id, sticker_format, sticker, signal) {
        return this.raw.uploadStickerFile({
            user_id,
            sticker_format,
            sticker
        }, signal);
    }
    /**
     * Use this method to create a new sticker set owned by a user. The bot will be able to edit the sticker set thus created. Returns True on success.
     *
     * @param user_id User identifier of created sticker set owner
     * @param name Short name of sticker set, to be used in t.me/addstickers/ URLs (e.g., animals). Can contain only English letters, digits and underscores. Must begin with a letter, can't contain consecutive underscores and must end in `_by_<bot_username>`. `<bot_username>` is case insensitive. 1-64 characters.
     * @param title Sticker set title, 1-64 characters
     * @param stickers A list of 1-50 initial stickers to be added to the sticker set
     * @param other Optional remaining parameters, confer the official reference below
     * @param signal Optional `AbortSignal` to cancel the request
     *
     * **Official reference:** https://core.telegram.org/bots/api#createnewstickerset
     */ createNewStickerSet(user_id, name, title, stickers, other, signal) {
        return this.raw.createNewStickerSet({
            user_id,
            name,
            title,
            stickers,
            ...other
        }, signal);
    }
    /**
     * Use this method to add a new sticker to a set created by the bot. The format of the added sticker must match the format of the other stickers in the set. Emoji sticker sets can have up to 200 stickers. Animated and video sticker sets can have up to 50 stickers. Static sticker sets can have up to 120 stickers. Returns True on success.
     *
     * @param user_id User identifier of sticker set owner
     * @param name Sticker set name
     * @param sticker An object with information about the added sticker. If exactly the same sticker had already been added to the set, then the set isn't changed.
     * @param signal Optional `AbortSignal` to cancel the request
     *
     * **Official reference:** https://core.telegram.org/bots/api#addstickertoset
     */ addStickerToSet(user_id, name, sticker, signal) {
        return this.raw.addStickerToSet({
            user_id,
            name,
            sticker
        }, signal);
    }
    /**
     * Use this method to move a sticker in a set created by the bot to a specific position. Returns True on success.
     *
     * @param sticker File identifier of the sticker
     * @param position New sticker position in the set, zero-based
     * @param signal Optional `AbortSignal` to cancel the request
     *
     * **Official reference:** https://core.telegram.org/bots/api#setstickerpositioninset
     */ setStickerPositionInSet(sticker, position, signal) {
        return this.raw.setStickerPositionInSet({
            sticker,
            position
        }, signal);
    }
    /**
     * Use this method to delete a sticker from a set created by the bot. Returns True on success.
     *
     * @param sticker File identifier of the sticker
     * @param signal Optional `AbortSignal` to cancel the request
     *
     * **Official reference:** https://core.telegram.org/bots/api#deletestickerfromset
     */ deleteStickerFromSet(sticker, signal) {
        return this.raw.deleteStickerFromSet({
            sticker
        }, signal);
    }
    /**
     * Use this method to replace an existing sticker in a sticker set with a new one. The method is equivalent to calling deleteStickerFromSet, then addStickerToSet, then setStickerPositionInSet. Returns True on success.
     *
     * @param user_id User identifier of the sticker set owner
     * @param name Sticker set name
     * @param old_sticker File identifier of the replaced sticker
     * @param sticker An object with information about the added sticker. If exactly the same sticker had already been added to the set, then the set remains unchanged.:x
     * @param signal Optional `AbortSignal` to cancel the request
     *
     * **Official reference:** https://core.telegram.org/bots/api#replacestickerinset
     */ replaceStickerInSet(user_id, name, old_sticker, sticker, signal) {
        return this.raw.replaceStickerInSet({
            user_id,
            name,
            old_sticker,
            sticker
        }, signal);
    }
    /**
     * Use this method to change the list of emoji assigned to a regular or custom emoji sticker. The sticker must belong to a sticker set created by the bot. Returns True on success.
     *
     * @param sticker File identifier of the sticker
     * @param emoji_list A list of 1-20 emoji associated with the sticker
     * @param signal Optional `AbortSignal` to cancel the request
     *
     * **Official reference:** https://core.telegram.org/bots/api#setstickeremojilist
     */ setStickerEmojiList(sticker, emoji_list, signal) {
        return this.raw.setStickerEmojiList({
            sticker,
            emoji_list
        }, signal);
    }
    /**
     * Use this method to change search keywords assigned to a regular or custom emoji sticker. The sticker must belong to a sticker set created by the bot. Returns True on success.
     *
     * @param sticker File identifier of the sticker
     * @param keywords A list of 0-20 search keywords for the sticker with total length of up to 64 characters
     * @param signal Optional `AbortSignal` to cancel the request
     *
     * **Official reference:** https://core.telegram.org/bots/api#setstickerkeywords
     */ setStickerKeywords(sticker, keywords, signal) {
        return this.raw.setStickerKeywords({
            sticker,
            keywords
        }, signal);
    }
    /**
     * Use this method to change the mask position of a mask sticker. The sticker must belong to a sticker set that was created by the bot. Returns True on success.
     *
     * @param sticker File identifier of the sticker
     * @param mask_position An object with the position where the mask should be placed on faces. Omit the parameter to remove the mask position.
     * @param signal Optional `AbortSignal` to cancel the request
     *
     * **Official reference:** https://core.telegram.org/bots/api#setstickermaskposition
     */ setStickerMaskPosition(sticker, mask_position, signal) {
        return this.raw.setStickerMaskPosition({
            sticker,
            mask_position
        }, signal);
    }
    /**
     * Use this method to set the title of a created sticker set. Returns True on success.
     *
     * @param name Sticker set name
     * @param title Sticker set title, 1-64 characters
     * @param signal Optional `AbortSignal` to cancel the request
     *
     * **Official reference:** https://core.telegram.org/bots/api#setstickersettitle
     */ setStickerSetTitle(name, title, signal) {
        return this.raw.setStickerSetTitle({
            name,
            title
        }, signal);
    }
    /**
     * Use this method to delete a sticker set that was created by the bot. Returns True on success.
     *
     * @param name Sticker set name
     * @param signal Optional `AbortSignal` to cancel the request
     *
     * **Official reference:** https://core.telegram.org/bots/api#deletestickerset
     */ deleteStickerSet(name, signal) {
        return this.raw.deleteStickerSet({
            name
        }, signal);
    }
    /**
     * Use this method to set the thumbnail of a regular or mask sticker set. The format of the thumbnail file must match the format of the stickers in the set. Returns True on success.
     *
     * @param name Sticker set name
     * @param user_id User identifier of the sticker set owner
     * @param thumbnail A .WEBP or .PNG image with the thumbnail, must be up to 128 kilobytes in size and have a width and height of exactly 100px, or a .TGS animation with a thumbnail up to 32 kilobytes in size (see https://core.telegram.org/stickers#animated-sticker-requirements for animated sticker technical requirements), or a WEBM video with the thumbnail up to 32 kilobytes in size; see https://core.telegram.org/stickers#video-sticker-requirements for video sticker technical requirements. Pass a file_id as a String to send a file that already exists on the Telegram servers, pass an HTTP URL as a String for Telegram to get a file from the Internet, or upload a new one using multipart/form-data. More information on Sending Files ». Animated and video sticker set thumbnails can't be uploaded via HTTP URL. If omitted, then the thumbnail is dropped and the first sticker is used as the thumbnail.
     * @param format Format of the thumbnail, must be one of “static” for a .WEBP or .PNG image, “animated” for a .TGS animation, or “video” for a WEBM video
     * @param signal Optional `AbortSignal` to cancel the request
     *
     * **Official reference:** https://core.telegram.org/bots/api#setstickersetthumbnail
     */ setStickerSetThumbnail(name, user_id, thumbnail, format, signal) {
        return this.raw.setStickerSetThumbnail({
            name,
            user_id,
            thumbnail,
            format
        }, signal);
    }
    /**
     * Use this method to set the thumbnail of a custom emoji sticker set. Returns True on success.
     *
     * @param name Sticker set name
     * @param custom_emoji_id Custom emoji identifier of a sticker from the sticker set; pass an empty string to drop the thumbnail and use the first sticker as the thumbnail.
     * @param signal Optional `AbortSignal` to cancel the request
     *
     * **Official reference:** https://core.telegram.org/bots/api#setcustomemojistickersetthumbnail
     */ setCustomEmojiStickerSetThumbnail(name, custom_emoji_id, signal) {
        return this.raw.setCustomEmojiStickerSetThumbnail({
            name,
            custom_emoji_id
        }, signal);
    }
    /**
     * Use this method to send answers to an inline query. On success, True is returned.
     * No more than 50 results per query are allowed.
     *
     * Example: An inline bot that sends YouTube videos can ask the user to connect the bot to their YouTube account to adapt search results accordingly. To do this, it displays a 'Connect your YouTube account' button above the results, or even before showing any. The user presses the button, switches to a private chat with the bot and, in doing so, passes a start parameter that instructs the bot to return an OAuth link. Once done, the bot can offer a switch_inline button so that the user can easily return to the chat where they wanted to use the bot's inline capabilities.
     *
     * @param inline_query_id Unique identifier for the answered query
     * @param results An array of results for the inline query
     * @param other Optional remaining parameters, confer the official reference below
     * @param signal Optional `AbortSignal` to cancel the request
     *
     * **Official reference:** https://core.telegram.org/bots/api#answerinlinequery
     */ answerInlineQuery(inline_query_id, results, other, signal) {
        return this.raw.answerInlineQuery({
            inline_query_id,
            results,
            ...other
        }, signal);
    }
    /**
     * Use this method to set the result of an interaction with a Web App and send a corresponding message on behalf of the user to the chat from which the query originated. On success, a SentWebAppMessage object is returned.
     *
     * @param web_app_query_id Unique identifier for the query to be answered
     * @param result An object describing the message to be sent
     * @param signal Optional `AbortSignal` to cancel the request
     *
     * **Official reference:** https://core.telegram.org/bots/api#answerwebappquery
     */ answerWebAppQuery(web_app_query_id, result, signal) {
        return this.raw.answerWebAppQuery({
            web_app_query_id,
            result
        }, signal);
    }
    /**
     * Use this method to send invoices. On success, the sent Message is returned.
     *
     * @param chat_id Unique identifier for the target chat or username of the target channel (in the format @channelusername)
     * @param title Product name, 1-32 characters
     * @param description Product description, 1-255 characters
     * @param payload Bot-defined invoice payload, 1-128 bytes. This will not be displayed to the user, use for your internal processes.
     * @param currency Three-letter ISO 4217 currency code, see more on currencies
     * @param prices Price breakdown, a list of components (e.g. product price, tax, discount, delivery cost, delivery tax, bonus, etc.)
     * @param other Optional remaining parameters, confer the official reference below
     * @param signal Optional `AbortSignal` to cancel the request
     *
     * **Official reference:** https://core.telegram.org/bots/api#sendinvoice
     */ sendInvoice(chat_id, title, description, payload, currency, prices, other, signal) {
        return this.raw.sendInvoice({
            chat_id,
            title,
            description,
            payload,
            currency,
            prices,
            ...other
        }, signal);
    }
    /**
     * Use this method to create a link for an invoice. Returns the created invoice link as String on success.
     *
     * @param title Product name, 1-32 characters
     * @param description Product description, 1-255 characters
     * @param payload Bot-defined invoice payload, 1-128 bytes. This will not be displayed to the user, use for your internal processes.
     * @param provider_token Payment provider token, obtained via BotFather
     * @param currency Three-letter ISO 4217 currency code, see more on currencies
     * @param prices Price breakdown, a list of components (e.g. product price, tax, discount, delivery cost, delivery tax, bonus, etc.)
     * @param other Optional remaining parameters, confer the official reference below
     * @param signal Optional `AbortSignal` to cancel the request
     *
     * **Official reference:** https://core.telegram.org/bots/api#createinvoicelink
     */ createInvoiceLink(title, description, payload, provider_token, currency, prices, other, signal) {
        return this.raw.createInvoiceLink({
            title,
            description,
            payload,
            provider_token,
            currency,
            prices,
            ...other
        }, signal);
    }
    /**
     * If you sent an invoice requesting a shipping address and the parameter is_flexible was specified, the Bot API will send an Update with a shipping_query field to the bot. Use this method to reply to shipping queries. On success, True is returned.
     *
     * @param shipping_query_id Unique identifier for the query to be answered
     * @param ok Pass True if delivery to the specified address is possible and False if there are any problems (for example, if delivery to the specified address is not possible)
     * @param other Optional remaining parameters, confer the official reference below
     * @param signal Optional `AbortSignal` to cancel the request
     *
     * **Official reference:** https://core.telegram.org/bots/api#answershippingquery
     */ answerShippingQuery(shipping_query_id, ok, other, signal) {
        return this.raw.answerShippingQuery({
            shipping_query_id,
            ok,
            ...other
        }, signal);
    }
    /**
     * Once the user has confirmed their payment and shipping details, the Bot API sends the final confirmation in the form of an Update with the field pre_checkout_query. Use this method to respond to such pre-checkout queries. On success, True is returned. Note: The Bot API must receive an answer within 10 seconds after the pre-checkout query was sent.
     *
     * @param pre_checkout_query_id Unique identifier for the query to be answered
     * @param ok Specify True if everything is alright (goods are available, etc.) and the bot is ready to proceed with the order. Use False if there are any problems.
     * @param other Optional remaining parameters, confer the official reference below
     * @param signal Optional `AbortSignal` to cancel the request
     *
     * **Official reference:** https://core.telegram.org/bots/api#answerprecheckoutquery
     */ answerPreCheckoutQuery(pre_checkout_query_id, ok, other, signal) {
        return this.raw.answerPreCheckoutQuery({
            pre_checkout_query_id,
            ok,
            ...other
        }, signal);
    }
    /**
     * Returns the bot's Telegram Star transactions in chronological order. On success, returns a StarTransactions object.
     *
     * @param other Optional remaining parameters, confer the official reference below
     * @param signal Optional `AbortSignal` to cancel the request
     *
     * **Official reference:** https://core.telegram.org/bots/api#getstartransactions
     */ getStarTransactions(other, signal) {
        return this.raw.getStarTransactions({
            ...other
        }, signal);
    }
    /**
     * Refunds a successful payment in Telegram Stars.
     *
     * @param user_id Identifier of the user whose payment will be refunded
     * @param telegram_payment_charge_id Telegram payment identifier
     * @param signal Optional `AbortSignal` to cancel the request
     *
     * **Official reference:** https://core.telegram.org/bots/api#refundstarpayment
     */ refundStarPayment(user_id, telegram_payment_charge_id, signal) {
        return this.raw.refundStarPayment({
            user_id,
            telegram_payment_charge_id
        }, signal);
    }
    /**
     * Informs a user that some of the Telegram Passport elements they provided contains errors. The user will not be able to re-submit their Passport to you until the errors are fixed (the contents of the field for which you returned the error must change). Returns True on success.
     *
     * Use this if the data submitted by the user doesn't satisfy the standards your service requires for any reason. For example, if a birthday date seems invalid, a submitted document is blurry, a scan shows evidence of tampering, etc. Supply some details in the error message to make sure the user knows how to correct the issues.
     *
     * @param user_id User identifier
     * @param errors An array describing the errors
     * @param signal Optional `AbortSignal` to cancel the request
     *
     * **Official reference:** https://core.telegram.org/bots/api#setpassportdataerrors
     */ setPassportDataErrors(user_id, errors, signal) {
        return this.raw.setPassportDataErrors({
            user_id,
            errors
        }, signal);
    }
    /**
     * Use this method to send a game. On success, the sent Message is returned.
     *
     * @param chat_id Unique identifier for the target chat
     * @param game_short_name Short name of the game, serves as the unique identifier for the game. Set up your games via BotFather.
     * @param other Optional remaining parameters, confer the official reference below
     * @param signal Optional `AbortSignal` to cancel the request
     *
     * **Official reference:** https://core.telegram.org/bots/api#sendgame
     */ sendGame(chat_id, game_short_name, other, signal) {
        return this.raw.sendGame({
            chat_id,
            game_short_name,
            ...other
        }, signal);
    }
    /**
     * Use this method to set the score of the specified user in a game message. On success, if the message is not an inline message, the Message is returned, otherwise True is returned. Returns an error, if the new score is not greater than the user's current score in the chat and force is False.
     *
     * @param chat_id Unique identifier for the target chat
     * @param message_id Identifier of the sent message
     * @param user_id User identifier
     * @param score New score, must be non-negative
     * @param other Optional remaining parameters, confer the official reference below
     * @param signal Optional `AbortSignal` to cancel the request
     *
     * **Official reference:** https://core.telegram.org/bots/api#setgamescore
     */ setGameScore(chat_id, message_id, user_id, score, other, signal) {
        return this.raw.setGameScore({
            chat_id,
            message_id,
            user_id,
            score,
            ...other
        }, signal);
    }
    /**
     * Use this method to set the score of the specified user in a game message. On success, if the message is not an inline message, the Message is returned, otherwise True is returned. Returns an error, if the new score is not greater than the user's current score in the chat and force is False.
     *
     * @param inline_message_id Identifier of the inline message
     * @param user_id User identifier
     * @param score New score, must be non-negative
     * @param other Optional remaining parameters, confer the official reference below
     * @param signal Optional `AbortSignal` to cancel the request
     *
     * **Official reference:** https://core.telegram.org/bots/api#setgamescore
     */ setGameScoreInline(inline_message_id, user_id, score, other, signal) {
        return this.raw.setGameScore({
            inline_message_id,
            user_id,
            score,
            ...other
        }, signal);
    }
    /**
     * Use this method to get data for high score tables. Will return the score of the specified user and several of their neighbors in a game. Returns an Array of GameHighScore objects.
     *
     * This method will currently return scores for the target user, plus two of their closest neighbors on each side. Will also return the top three users if the user and his neighbors are not among them. Please note that this behavior is subject to change.
     *
     * @param chat_id Unique identifier for the target chat
     * @param message_id Identifier of the sent message
     * @param user_id Target user id
     * @param signal Optional `AbortSignal` to cancel the request
     *
     * **Official reference:** https://core.telegram.org/bots/api#getgamehighscores
     */ getGameHighScores(chat_id, message_id, user_id, signal) {
        return this.raw.getGameHighScores({
            chat_id,
            message_id,
            user_id
        }, signal);
    }
    /**
     * Use this method to get data for high score tables. Will return the score of the specified user and several of their neighbors in an inline game. On success, returns an Array of GameHighScore objects.
     *
     * This method will currently return scores for the target user, plus two of their closest neighbors on each side. Will also return the top three users if the user and his neighbors are not among them. Please note that this behavior is subject to change.
     *
     * @param inline_message_id Identifier of the inline message
     * @param user_id Target user id
     * @param signal Optional `AbortSignal` to cancel the request
     *
     * **Official reference:** https://core.telegram.org/bots/api#getgamehighscores
     */ getGameHighScoresInline(inline_message_id, user_id, signal) {
        return this.raw.getGameHighScores({
            inline_message_id,
            user_id
        }, signal);
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vZGVuby5sYW5kL3gvZ3JhbW15QHYxLjI3LjAvY29yZS9hcGkudHMiXSwic291cmNlc0NvbnRlbnQiOlsiLy8gZGVuby1saW50LWlnbm9yZS1maWxlIGNhbWVsY2FzZVxuaW1wb3J0IHtcbiAgICB0eXBlIEJvdENvbW1hbmQsXG4gICAgdHlwZSBDaGF0UGVybWlzc2lvbnMsXG4gICAgdHlwZSBJbmxpbmVRdWVyeVJlc3VsdCxcbiAgICB0eXBlIElucHV0RmlsZSxcbiAgICB0eXBlIElucHV0TWVkaWEsXG4gICAgdHlwZSBJbnB1dE1lZGlhQXVkaW8sXG4gICAgdHlwZSBJbnB1dE1lZGlhRG9jdW1lbnQsXG4gICAgdHlwZSBJbnB1dE1lZGlhUGhvdG8sXG4gICAgdHlwZSBJbnB1dE1lZGlhVmlkZW8sXG4gICAgdHlwZSBJbnB1dFBhaWRNZWRpYSxcbiAgICB0eXBlIElucHV0UG9sbE9wdGlvbixcbiAgICB0eXBlIElucHV0U3RpY2tlcixcbiAgICB0eXBlIExhYmVsZWRQcmljZSxcbiAgICB0eXBlIE1hc2tQb3NpdGlvbixcbiAgICB0eXBlIFBhc3Nwb3J0RWxlbWVudEVycm9yLFxuICAgIHR5cGUgUmVhY3Rpb25UeXBlLFxufSBmcm9tIFwiLi4vdHlwZXMudHNcIjtcbmltcG9ydCB7XG4gICAgdHlwZSBBcGlDbGllbnRPcHRpb25zLFxuICAgIGNyZWF0ZVJhd0FwaSxcbiAgICB0eXBlIE1ldGhvZHMsXG4gICAgdHlwZSBQYXlsb2FkLFxuICAgIHR5cGUgUmF3QXBpLFxuICAgIHR5cGUgVHJhbnNmb3JtZXIsXG4gICAgdHlwZSBUcmFuc2Zvcm1lckNvbnN1bWVyLFxuICAgIHR5cGUgV2ViaG9va1JlcGx5RW52ZWxvcGUsXG59IGZyb20gXCIuL2NsaWVudC50c1wiO1xuXG4vKipcbiAqIEhlbHBlciB0eXBlIHRvIGRlcml2ZSByZW1haW5pbmcgcHJvcGVydGllcyBvZiBhIGdpdmVuIEFQSSBtZXRob2QgY2FsbCBNLFxuICogZ2l2ZW4gdGhhdCBzb21lIHByb3BlcnRpZXMgWCBoYXZlIGFscmVhZHkgYmVlbiBzcGVjaWZpZWQuXG4gKi9cbmV4cG9ydCB0eXBlIE90aGVyPFxuICAgIFIgZXh0ZW5kcyBSYXdBcGksXG4gICAgTSBleHRlbmRzIE1ldGhvZHM8Uj4sXG4gICAgWCBleHRlbmRzIHN0cmluZyA9IG5ldmVyLFxuPiA9IE9taXQ8UGF5bG9hZDxNLCBSPiwgWD47XG4vKipcbiAqIFRoaXMgY2xhc3MgcHJvdmlkZXMgYWNjZXNzIHRvIHRoZSBmdWxsIFRlbGVncmFtIEJvdCBBUEkuIEFsbCBtZXRob2RzIG9mIHRoZVxuICogQVBJIGhhdmUgYW4gZXF1aXZhbGVudCBvbiB0aGlzIGNsYXNzLCB3aXRoIHRoZSBtb3N0IGltcG9ydGFudCBwYXJhbWV0ZXJzXG4gKiBwdWxsZWQgdXAgaW50byB0aGUgZnVuY3Rpb24gc2lnbmF0dXJlLCBhbmQgdGhlIG90aGVyIHBhcmFtZXRlcnMgY2FwdHVyZWQgYnlcbiAqIGFuIG9iamVjdC5cbiAqXG4gKiBJbiBhZGRpdGlvbiwgdGhpcyBjbGFzcyBoYXMgYSBwcm9wZXJ0eSBgcmF3YCB0aGF0IHByb3ZpZGVzIHJhdyBhY2Nlc3MgdG8gdGhlXG4gKiBjb21wbGV0ZSBUZWxlZ3JhbSBBUEksIHdpdGggdGhlIG1ldGhvZCBzaWduYXR1cmVzIDE6MSByZXByZXNlbnRlZCBhc1xuICogZG9jdW1lbnRlZCBvbiB0aGUgd2Vic2l0ZSAoaHR0cHM6Ly9jb3JlLnRlbGVncmFtLm9yZy9ib3RzL2FwaSkuXG4gKlxuICogRXZlcnkgbWV0aG9kIHRha2VzIGFuIG9wdGlvbmFsIGBBYm9ydFNpZ25hbGAgb2JqZWN0IHRoYXQgYWxsb3dzIHlvdSB0byBjYW5jZWxcbiAqIHRoZSByZXF1ZXN0IGlmIGRlc2lyZWQuXG4gKlxuICogSW4gYWR2YW5jZWQgdXNlIGNhc2VzLCB0aGlzIGNsYXNzIGFsbG93cyB0byBpbnN0YWxsIHRyYW5zZm9ybWVycyB0aGF0IGNhblxuICogbW9kaWZ5IHRoZSBtZXRob2QgYW5kIHBheWxvYWQgb24gdGhlIGZseSBiZWZvcmUgc2VuZGluZyBpdCB0byB0aGUgVGVsZWdyYW1cbiAqIHNlcnZlcnMuIENvbmZlciB0aGUgYGNvbmZpZ2AgcHJvcGVydHkgZm9yIHRoaXMuXG4gKi9cbmV4cG9ydCBjbGFzcyBBcGk8UiBleHRlbmRzIFJhd0FwaSA9IFJhd0FwaT4ge1xuICAgIC8qKlxuICAgICAqIFByb3ZpZGVzIGFjY2VzcyB0byBhbGwgbWV0aG9kcyBvZiB0aGUgVGVsZWdyYW0gQm90IEFQSSBleGFjdGx5IGFzXG4gICAgICogZG9jdW1lbnRlZCBvbiB0aGUgd2Vic2l0ZSAoaHR0cHM6Ly9jb3JlLnRlbGVncmFtLm9yZy9ib3RzL2FwaSkuIE5vXG4gICAgICogYXJndW1lbnRzIGFyZSBwdWxsZWQgdXAgaW4gdGhlIGZ1bmN0aW9uIHNpZ25hdHVyZSBmb3IgY29udmVuaWVuY2UuXG4gICAgICpcbiAgICAgKiBJZiB5b3Ugc3VwcHJlc3MgY29tcGlsZXIgd2FybmluZ3MsIHRoaXMgYWxzbyBhbGxvd3MgZm9yIHJhdyBhcGkgY2FsbHMgdG9cbiAgICAgKiB1bmRvY3VtZW50ZWQgbWV0aG9kcyB3aXRoIGFyYml0cmFyeSBwYXJhbWV0ZXJz4oCUdXNlIG9ubHkgaWYgeW91IGtub3cgd2hhdFxuICAgICAqIHlvdSBhcmUgZG9pbmcuXG4gICAgICovXG4gICAgcHVibGljIHJlYWRvbmx5IHJhdzogUjtcblxuICAgIC8qKlxuICAgICAqIENvbmZpZ3VyYXRpb24gb2JqZWN0IGZvciB0aGUgQVBJIGluc3RhbmNlLCB1c2VkIGFzIGEgbmFtZXNwYWNlIHRvXG4gICAgICogc2VwYXJhdGUgdGhvc2UgQVBJIG9wZXJhdGlvbnMgdGhhdCBhcmUgcmVsYXRlZCB0byBncmFtbVkgZnJvbSBtZXRob2RzIG9mXG4gICAgICogdGhlIFRlbGVncmFtIEJvdCBBUEkuIENvbnRhaW5zIGFkdmFuY2VkIG9wdGlvbnMhXG4gICAgICovXG4gICAgcHVibGljIHJlYWRvbmx5IGNvbmZpZzoge1xuICAgICAgICAvKipcbiAgICAgICAgICogQWxsb3dzIHRvIGluc3RhbGwgYW4gQVBJIHJlcXVlc3QgdHJhbnNmb3JtZXIgZnVuY3Rpb24uIEEgdHJhbnNmb3JtZXJcbiAgICAgICAgICogZnVuY3Rpb24gaGFzIGFjY2VzcyB0byBldmVyeSBBUEkgY2FsbCBiZWZvcmUgaXQgaXMgYmVpbmcgcGVyZm9ybWVkLlxuICAgICAgICAgKiBUaGlzIGluY2x1ZGVzIHRoZSBtZXRob2QgYXMgc3RyaW5nLCB0aGUgcGF5bG9hZCBhcyBvYmplY3QgYW5kIHRoZVxuICAgICAgICAgKiB1cHN0cmVhbSB0cmFuc2Zvcm1lciBmdW5jdGlvbi5cbiAgICAgICAgICpcbiAgICAgICAgICogX05vdGUgdGhhdCB1c2luZyB0cmFuc2Zvcm1lciBmdW5jdGlvbnMgaXMgYW4gYWR2YW5jZWQgZmVhdHVyZSBvZlxuICAgICAgICAgKiBncmFtbVkgdGhhdCBtb3N0IGJvdHMgd2lsbCBub3QgbmVlZCB0byBtYWtlIHVzZSBvZi5fXG4gICAgICAgICAqL1xuICAgICAgICByZWFkb25seSB1c2U6IFRyYW5zZm9ybWVyQ29uc3VtZXI8Uj47XG4gICAgICAgIC8qKlxuICAgICAgICAgKiBQcm92aWRlcyByZWFkIGFjY2VzcyB0byBhbGwgY3VycmVudGx5IGluc3RhbGxlZCB0cmFuc2Zvcm1lcnMgKHRob3NlXG4gICAgICAgICAqIHRoYXQgaGF2ZSBwcmV2aW91c2x5IGJlZW4gcGFzc2VkIHRvIGBjb25maWcudXNlYCkuXG4gICAgICAgICAqXG4gICAgICAgICAqIF9Ob3RlIHRoYXQgdXNpbmcgdHJhbnNmb3JtZXIgZnVuY3Rpb25zIGlzIGFuIGFkdmFuY2VkIGZlYXR1cmUgb2ZcbiAgICAgICAgICogZ3JhbW1ZIHRoYXQgbW9zdCBib3RzIHdpbGwgbm90IG5lZWQgdG8gbWFrZSB1c2Ugb2YuX1xuICAgICAgICAgKi9cbiAgICAgICAgcmVhZG9ubHkgaW5zdGFsbGVkVHJhbnNmb3JtZXJzOiAoKSA9PiBUcmFuc2Zvcm1lcjxSPltdO1xuICAgIH07XG5cbiAgICAvKipcbiAgICAgKiBDb25zdHJ1Y3RzIGEgbmV3IGluc3RhbmNlIG9mIGBBcGlgLiBJdCBpcyBpbmRlcGVuZGVudCBmcm9tIGFsbCBvdGhlclxuICAgICAqIGluc3RhbmNlcyBvZiB0aGlzIGNsYXNzLiBGb3IgZXhhbXBsZSwgdGhpcyBsZXRzIHlvdSBpbnN0YWxsIGEgY3VzdG9tIHNldFxuICAgICAqIGlmIHRyYW5zZm9ybWVycy5cbiAgICAgKlxuICAgICAqIEBwYXJhbSB0b2tlbiBCb3QgQVBJIHRva2VuIG9idGFpbmVkIGZyb20gW0BCb3RGYXRoZXJdKGh0dHBzOi8vdC5tZS9Cb3RGYXRoZXIpXG4gICAgICogQHBhcmFtIG9wdGlvbnMgT3B0aW9uYWwgQVBJIGNsaWVudCBvcHRpb25zIGZvciB0aGUgdW5kZXJseWluZyBjbGllbnQgaW5zdGFuY2VcbiAgICAgKiBAcGFyYW0gd2ViaG9va1JlcGx5RW52ZWxvcGUgT3B0aW9uYWwgZW52ZWxvcGUgdG8gaGFuZGxlIHdlYmhvb2sgcmVwbGllc1xuICAgICAqL1xuICAgIGNvbnN0cnVjdG9yKFxuICAgICAgICBwdWJsaWMgcmVhZG9ubHkgdG9rZW46IHN0cmluZyxcbiAgICAgICAgcHVibGljIHJlYWRvbmx5IG9wdGlvbnM/OiBBcGlDbGllbnRPcHRpb25zLFxuICAgICAgICB3ZWJob29rUmVwbHlFbnZlbG9wZT86IFdlYmhvb2tSZXBseUVudmVsb3BlLFxuICAgICkge1xuICAgICAgICBjb25zdCB7IHJhdywgdXNlLCBpbnN0YWxsZWRUcmFuc2Zvcm1lcnMgfSA9IGNyZWF0ZVJhd0FwaTxSPihcbiAgICAgICAgICAgIHRva2VuLFxuICAgICAgICAgICAgb3B0aW9ucyxcbiAgICAgICAgICAgIHdlYmhvb2tSZXBseUVudmVsb3BlLFxuICAgICAgICApO1xuICAgICAgICB0aGlzLnJhdyA9IHJhdztcbiAgICAgICAgdGhpcy5jb25maWcgPSB7XG4gICAgICAgICAgICB1c2UsXG4gICAgICAgICAgICBpbnN0YWxsZWRUcmFuc2Zvcm1lcnM6ICgpID0+IGluc3RhbGxlZFRyYW5zZm9ybWVycy5zbGljZSgpLFxuICAgICAgICB9O1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFVzZSB0aGlzIG1ldGhvZCB0byByZWNlaXZlIGluY29taW5nIHVwZGF0ZXMgdXNpbmcgbG9uZyBwb2xsaW5nICh3aWtpKS4gUmV0dXJucyBhbiBBcnJheSBvZiBVcGRhdGUgb2JqZWN0cy5cbiAgICAgKlxuICAgICAqIE5vdGVzXG4gICAgICogMS4gVGhpcyBtZXRob2Qgd2lsbCBub3Qgd29yayBpZiBhbiBvdXRnb2luZyB3ZWJob29rIGlzIHNldCB1cC5cbiAgICAgKiAyLiBJbiBvcmRlciB0byBhdm9pZCBnZXR0aW5nIGR1cGxpY2F0ZSB1cGRhdGVzLCByZWNhbGN1bGF0ZSBvZmZzZXQgYWZ0ZXIgZWFjaCBzZXJ2ZXIgcmVzcG9uc2UuXG4gICAgICpcbiAgICAgKiBAcGFyYW0gb3RoZXIgT3B0aW9uYWwgcmVtYWluaW5nIHBhcmFtZXRlcnMsIGNvbmZlciB0aGUgb2ZmaWNpYWwgcmVmZXJlbmNlIGJlbG93XG4gICAgICogQHBhcmFtIHNpZ25hbCBPcHRpb25hbCBgQWJvcnRTaWduYWxgIHRvIGNhbmNlbCB0aGUgcmVxdWVzdFxuICAgICAqXG4gICAgICogKipPZmZpY2lhbCByZWZlcmVuY2U6KiogaHR0cHM6Ly9jb3JlLnRlbGVncmFtLm9yZy9ib3RzL2FwaSNnZXR1cGRhdGVzXG4gICAgICovXG4gICAgZ2V0VXBkYXRlcyhvdGhlcj86IE90aGVyPFIsIFwiZ2V0VXBkYXRlc1wiPiwgc2lnbmFsPzogQWJvcnRTaWduYWwpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMucmF3LmdldFVwZGF0ZXMoeyAuLi5vdGhlciB9LCBzaWduYWwpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFVzZSB0aGlzIG1ldGhvZCB0byBzcGVjaWZ5IGEgVVJMIGFuZCByZWNlaXZlIGluY29taW5nIHVwZGF0ZXMgdmlhIGFuIG91dGdvaW5nIHdlYmhvb2suIFdoZW5ldmVyIHRoZXJlIGlzIGFuIHVwZGF0ZSBmb3IgdGhlIGJvdCwgd2Ugd2lsbCBzZW5kIGFuIEhUVFBTIFBPU1QgcmVxdWVzdCB0byB0aGUgc3BlY2lmaWVkIFVSTCwgY29udGFpbmluZyBhIEpTT04tc2VyaWFsaXplZCBVcGRhdGUuIEluIGNhc2Ugb2YgYW4gdW5zdWNjZXNzZnVsIHJlcXVlc3QsIHdlIHdpbGwgZ2l2ZSB1cCBhZnRlciBhIHJlYXNvbmFibGUgYW1vdW50IG9mIGF0dGVtcHRzLiBSZXR1cm5zIFRydWUgb24gc3VjY2Vzcy5cbiAgICAgKlxuICAgICAqIElmIHlvdSdkIGxpa2UgdG8gbWFrZSBzdXJlIHRoYXQgdGhlIHdlYmhvb2sgd2FzIHNldCBieSB5b3UsIHlvdSBjYW4gc3BlY2lmeSBzZWNyZXQgZGF0YSBpbiB0aGUgcGFyYW1ldGVyIHNlY3JldF90b2tlbi4gSWYgc3BlY2lmaWVkLCB0aGUgcmVxdWVzdCB3aWxsIGNvbnRhaW4gYSBoZWFkZXIg4oCcWC1UZWxlZ3JhbS1Cb3QtQXBpLVNlY3JldC1Ub2tlbuKAnSB3aXRoIHRoZSBzZWNyZXQgdG9rZW4gYXMgY29udGVudC5cbiAgICAgKlxuICAgICAqIE5vdGVzXG4gICAgICogMS4gWW91IHdpbGwgbm90IGJlIGFibGUgdG8gcmVjZWl2ZSB1cGRhdGVzIHVzaW5nIGdldFVwZGF0ZXMgZm9yIGFzIGxvbmcgYXMgYW4gb3V0Z29pbmcgd2ViaG9vayBpcyBzZXQgdXAuXG4gICAgICogMi4gVG8gdXNlIGEgc2VsZi1zaWduZWQgY2VydGlmaWNhdGUsIHlvdSBuZWVkIHRvIHVwbG9hZCB5b3VyIHB1YmxpYyBrZXkgY2VydGlmaWNhdGUgdXNpbmcgY2VydGlmaWNhdGUgcGFyYW1ldGVyLiBQbGVhc2UgdXBsb2FkIGFzIElucHV0RmlsZSwgc2VuZGluZyBhIFN0cmluZyB3aWxsIG5vdCB3b3JrLlxuICAgICAqIDMuIFBvcnRzIGN1cnJlbnRseSBzdXBwb3J0ZWQgZm9yIFdlYmhvb2tzOiA0NDMsIDgwLCA4OCwgODQ0My5cbiAgICAgKlxuICAgICAqIElmIHlvdSdyZSBoYXZpbmcgYW55IHRyb3VibGUgc2V0dGluZyB1cCB3ZWJob29rcywgcGxlYXNlIGNoZWNrIG91dCB0aGlzIGFtYXppbmcgZ3VpZGUgdG8gd2ViaG9va3MuXG4gICAgICpcbiAgICAgKiBAcGFyYW0gdXJsIEhUVFBTIHVybCB0byBzZW5kIHVwZGF0ZXMgdG8uIFVzZSBhbiBlbXB0eSBzdHJpbmcgdG8gcmVtb3ZlIHdlYmhvb2sgaW50ZWdyYXRpb25cbiAgICAgKiBAcGFyYW0gb3RoZXIgT3B0aW9uYWwgcmVtYWluaW5nIHBhcmFtZXRlcnMsIGNvbmZlciB0aGUgb2ZmaWNpYWwgcmVmZXJlbmNlIGJlbG93XG4gICAgICogQHBhcmFtIHNpZ25hbCBPcHRpb25hbCBgQWJvcnRTaWduYWxgIHRvIGNhbmNlbCB0aGUgcmVxdWVzdFxuICAgICAqXG4gICAgICogKipPZmZpY2lhbCByZWZlcmVuY2U6KiogaHR0cHM6Ly9jb3JlLnRlbGVncmFtLm9yZy9ib3RzL2FwaSNzZXR3ZWJob29rXG4gICAgICovXG4gICAgc2V0V2ViaG9vayhcbiAgICAgICAgdXJsOiBzdHJpbmcsXG4gICAgICAgIG90aGVyPzogT3RoZXI8UiwgXCJzZXRXZWJob29rXCIsIFwidXJsXCI+LFxuICAgICAgICBzaWduYWw/OiBBYm9ydFNpZ25hbCxcbiAgICApIHtcbiAgICAgICAgcmV0dXJuIHRoaXMucmF3LnNldFdlYmhvb2soeyB1cmwsIC4uLm90aGVyIH0sIHNpZ25hbCk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogVXNlIHRoaXMgbWV0aG9kIHRvIHJlbW92ZSB3ZWJob29rIGludGVncmF0aW9uIGlmIHlvdSBkZWNpZGUgdG8gc3dpdGNoIGJhY2sgdG8gZ2V0VXBkYXRlcy4gUmV0dXJucyBUcnVlIG9uIHN1Y2Nlc3MuXG4gICAgICpcbiAgICAgKiBAcGFyYW0gb3RoZXIgT3B0aW9uYWwgcmVtYWluaW5nIHBhcmFtZXRlcnMsIGNvbmZlciB0aGUgb2ZmaWNpYWwgcmVmZXJlbmNlIGJlbG93XG4gICAgICogQHBhcmFtIHNpZ25hbCBPcHRpb25hbCBgQWJvcnRTaWduYWxgIHRvIGNhbmNlbCB0aGUgcmVxdWVzdFxuICAgICAqXG4gICAgICogKipPZmZpY2lhbCByZWZlcmVuY2U6KiogaHR0cHM6Ly9jb3JlLnRlbGVncmFtLm9yZy9ib3RzL2FwaSNkZWxldGV3ZWJob29rXG4gICAgICovXG4gICAgZGVsZXRlV2ViaG9vayhvdGhlcj86IE90aGVyPFIsIFwiZGVsZXRlV2ViaG9va1wiPiwgc2lnbmFsPzogQWJvcnRTaWduYWwpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMucmF3LmRlbGV0ZVdlYmhvb2soeyAuLi5vdGhlciB9LCBzaWduYWwpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFVzZSB0aGlzIG1ldGhvZCB0byBnZXQgY3VycmVudCB3ZWJob29rIHN0YXR1cy4gUmVxdWlyZXMgbm8gcGFyYW1ldGVycy4gT24gc3VjY2VzcywgcmV0dXJucyBhIFdlYmhvb2tJbmZvIG9iamVjdC4gSWYgdGhlIGJvdCBpcyB1c2luZyBnZXRVcGRhdGVzLCB3aWxsIHJldHVybiBhbiBvYmplY3Qgd2l0aCB0aGUgdXJsIGZpZWxkIGVtcHR5LlxuICAgICAqXG4gICAgICogQHBhcmFtIHNpZ25hbCBPcHRpb25hbCBgQWJvcnRTaWduYWxgIHRvIGNhbmNlbCB0aGUgcmVxdWVzdFxuICAgICAqXG4gICAgICogKipPZmZpY2lhbCByZWZlcmVuY2U6KiogaHR0cHM6Ly9jb3JlLnRlbGVncmFtLm9yZy9ib3RzL2FwaSNnZXR3ZWJob29raW5mb1xuICAgICAqL1xuICAgIGdldFdlYmhvb2tJbmZvKHNpZ25hbD86IEFib3J0U2lnbmFsKSB7XG4gICAgICAgIHJldHVybiB0aGlzLnJhdy5nZXRXZWJob29rSW5mbyhzaWduYWwpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEEgc2ltcGxlIG1ldGhvZCBmb3IgdGVzdGluZyB5b3VyIGJvdCdzIGF1dGhlbnRpY2F0aW9uIHRva2VuLiBSZXF1aXJlcyBubyBwYXJhbWV0ZXJzLiBSZXR1cm5zIGJhc2ljIGluZm9ybWF0aW9uIGFib3V0IHRoZSBib3QgaW4gZm9ybSBvZiBhIFVzZXIgb2JqZWN0LlxuICAgICAqXG4gICAgICogQHBhcmFtIHNpZ25hbCBPcHRpb25hbCBgQWJvcnRTaWduYWxgIHRvIGNhbmNlbCB0aGUgcmVxdWVzdFxuICAgICAqXG4gICAgICogKipPZmZpY2lhbCByZWZlcmVuY2U6KiogaHR0cHM6Ly9jb3JlLnRlbGVncmFtLm9yZy9ib3RzL2FwaSNnZXRtZVxuICAgICAqL1xuICAgIGdldE1lKHNpZ25hbD86IEFib3J0U2lnbmFsKSB7XG4gICAgICAgIHJldHVybiB0aGlzLnJhdy5nZXRNZShzaWduYWwpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFVzZSB0aGlzIG1ldGhvZCB0byBsb2cgb3V0IGZyb20gdGhlIGNsb3VkIEJvdCBBUEkgc2VydmVyIGJlZm9yZSBsYXVuY2hpbmcgdGhlIGJvdCBsb2NhbGx5LiBZb3UgbXVzdCBsb2cgb3V0IHRoZSBib3QgYmVmb3JlIHJ1bm5pbmcgaXQgbG9jYWxseSwgb3RoZXJ3aXNlIHRoZXJlIGlzIG5vIGd1YXJhbnRlZSB0aGF0IHRoZSBib3Qgd2lsbCByZWNlaXZlIHVwZGF0ZXMuIEFmdGVyIGEgc3VjY2Vzc2Z1bCBjYWxsLCB5b3UgY2FuIGltbWVkaWF0ZWx5IGxvZyBpbiBvbiBhIGxvY2FsIHNlcnZlciwgYnV0IHdpbGwgbm90IGJlIGFibGUgdG8gbG9nIGluIGJhY2sgdG8gdGhlIGNsb3VkIEJvdCBBUEkgc2VydmVyIGZvciAxMCBtaW51dGVzLiBSZXR1cm5zIFRydWUgb24gc3VjY2Vzcy4gUmVxdWlyZXMgbm8gcGFyYW1ldGVycy5cbiAgICAgKlxuICAgICAqIEBwYXJhbSBzaWduYWwgT3B0aW9uYWwgYEFib3J0U2lnbmFsYCB0byBjYW5jZWwgdGhlIHJlcXVlc3RcbiAgICAgKlxuICAgICAqICoqT2ZmaWNpYWwgcmVmZXJlbmNlOioqIGh0dHBzOi8vY29yZS50ZWxlZ3JhbS5vcmcvYm90cy9hcGkjbG9nb3V0XG4gICAgICovXG4gICAgbG9nT3V0KHNpZ25hbD86IEFib3J0U2lnbmFsKSB7XG4gICAgICAgIHJldHVybiB0aGlzLnJhdy5sb2dPdXQoc2lnbmFsKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBVc2UgdGhpcyBtZXRob2QgdG8gY2xvc2UgdGhlIGJvdCBpbnN0YW5jZSBiZWZvcmUgbW92aW5nIGl0IGZyb20gb25lIGxvY2FsIHNlcnZlciB0byBhbm90aGVyLiBZb3UgbmVlZCB0byBkZWxldGUgdGhlIHdlYmhvb2sgYmVmb3JlIGNhbGxpbmcgdGhpcyBtZXRob2QgdG8gZW5zdXJlIHRoYXQgdGhlIGJvdCBpc24ndCBsYXVuY2hlZCBhZ2FpbiBhZnRlciBzZXJ2ZXIgcmVzdGFydC4gVGhlIG1ldGhvZCB3aWxsIHJldHVybiBlcnJvciA0MjkgaW4gdGhlIGZpcnN0IDEwIG1pbnV0ZXMgYWZ0ZXIgdGhlIGJvdCBpcyBsYXVuY2hlZC4gUmV0dXJucyBUcnVlIG9uIHN1Y2Nlc3MuIFJlcXVpcmVzIG5vIHBhcmFtZXRlcnMuXG4gICAgICpcbiAgICAgKiBAcGFyYW0gc2lnbmFsIE9wdGlvbmFsIGBBYm9ydFNpZ25hbGAgdG8gY2FuY2VsIHRoZSByZXF1ZXN0XG4gICAgICpcbiAgICAgKiAqKk9mZmljaWFsIHJlZmVyZW5jZToqKiBodHRwczovL2NvcmUudGVsZWdyYW0ub3JnL2JvdHMvYXBpI2Nsb3NlXG4gICAgICovXG4gICAgY2xvc2Uoc2lnbmFsPzogQWJvcnRTaWduYWwpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMucmF3LmNsb3NlKHNpZ25hbCk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogVXNlIHRoaXMgbWV0aG9kIHRvIHNlbmQgdGV4dCBtZXNzYWdlcy4gT24gc3VjY2VzcywgdGhlIHNlbnQgTWVzc2FnZSBpcyByZXR1cm5lZC5cbiAgICAgKlxuICAgICAqIEBwYXJhbSBjaGF0X2lkIFVuaXF1ZSBpZGVudGlmaWVyIGZvciB0aGUgdGFyZ2V0IGNoYXQgb3IgdXNlcm5hbWUgb2YgdGhlIHRhcmdldCBjaGFubmVsIChpbiB0aGUgZm9ybWF0IEBjaGFubmVsdXNlcm5hbWUpXG4gICAgICogQHBhcmFtIHRleHQgVGV4dCBvZiB0aGUgbWVzc2FnZSB0byBiZSBzZW50LCAxLTQwOTYgY2hhcmFjdGVycyBhZnRlciBlbnRpdGllcyBwYXJzaW5nXG4gICAgICogQHBhcmFtIG90aGVyIE9wdGlvbmFsIHJlbWFpbmluZyBwYXJhbWV0ZXJzLCBjb25mZXIgdGhlIG9mZmljaWFsIHJlZmVyZW5jZSBiZWxvd1xuICAgICAqIEBwYXJhbSBzaWduYWwgT3B0aW9uYWwgYEFib3J0U2lnbmFsYCB0byBjYW5jZWwgdGhlIHJlcXVlc3RcbiAgICAgKlxuICAgICAqICoqT2ZmaWNpYWwgcmVmZXJlbmNlOioqIGh0dHBzOi8vY29yZS50ZWxlZ3JhbS5vcmcvYm90cy9hcGkjc2VuZG1lc3NhZ2VcbiAgICAgKi9cbiAgICBzZW5kTWVzc2FnZShcbiAgICAgICAgY2hhdF9pZDogbnVtYmVyIHwgc3RyaW5nLFxuICAgICAgICB0ZXh0OiBzdHJpbmcsXG4gICAgICAgIG90aGVyPzogT3RoZXI8UiwgXCJzZW5kTWVzc2FnZVwiLCBcImNoYXRfaWRcIiB8IFwidGV4dFwiPixcbiAgICAgICAgc2lnbmFsPzogQWJvcnRTaWduYWwsXG4gICAgKSB7XG4gICAgICAgIHJldHVybiB0aGlzLnJhdy5zZW5kTWVzc2FnZSh7IGNoYXRfaWQsIHRleHQsIC4uLm90aGVyIH0sIHNpZ25hbCk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogVXNlIHRoaXMgbWV0aG9kIHRvIGZvcndhcmQgbWVzc2FnZXMgb2YgYW55IGtpbmQuIFNlcnZpY2UgbWVzc2FnZXMgYW5kIG1lc3NhZ2VzIHdpdGggcHJvdGVjdGVkIGNvbnRlbnQgY2FuJ3QgYmUgZm9yd2FyZGVkLiBPbiBzdWNjZXNzLCB0aGUgc2VudCBNZXNzYWdlIGlzIHJldHVybmVkLlxuICAgICAqXG4gICAgICogQHBhcmFtIGNoYXRfaWQgVW5pcXVlIGlkZW50aWZpZXIgZm9yIHRoZSB0YXJnZXQgY2hhdCBvciB1c2VybmFtZSBvZiB0aGUgdGFyZ2V0IGNoYW5uZWwgKGluIHRoZSBmb3JtYXQgQGNoYW5uZWx1c2VybmFtZSlcbiAgICAgKiBAcGFyYW0gZnJvbV9jaGF0X2lkIFVuaXF1ZSBpZGVudGlmaWVyIGZvciB0aGUgY2hhdCB3aGVyZSB0aGUgb3JpZ2luYWwgbWVzc2FnZSB3YXMgc2VudCAob3IgY2hhbm5lbCB1c2VybmFtZSBpbiB0aGUgZm9ybWF0IEBjaGFubmVsdXNlcm5hbWUpXG4gICAgICogQHBhcmFtIG1lc3NhZ2VfaWQgTWVzc2FnZSBpZGVudGlmaWVyIGluIHRoZSBjaGF0IHNwZWNpZmllZCBpbiBmcm9tX2NoYXRfaWRcbiAgICAgKiBAcGFyYW0gb3RoZXIgT3B0aW9uYWwgcmVtYWluaW5nIHBhcmFtZXRlcnMsIGNvbmZlciB0aGUgb2ZmaWNpYWwgcmVmZXJlbmNlIGJlbG93XG4gICAgICogQHBhcmFtIHNpZ25hbCBPcHRpb25hbCBgQWJvcnRTaWduYWxgIHRvIGNhbmNlbCB0aGUgcmVxdWVzdFxuICAgICAqXG4gICAgICogKipPZmZpY2lhbCByZWZlcmVuY2U6KiogaHR0cHM6Ly9jb3JlLnRlbGVncmFtLm9yZy9ib3RzL2FwaSNmb3J3YXJkbWVzc2FnZVxuICAgICAqL1xuICAgIGZvcndhcmRNZXNzYWdlKFxuICAgICAgICBjaGF0X2lkOiBudW1iZXIgfCBzdHJpbmcsXG4gICAgICAgIGZyb21fY2hhdF9pZDogbnVtYmVyIHwgc3RyaW5nLFxuICAgICAgICBtZXNzYWdlX2lkOiBudW1iZXIsXG4gICAgICAgIG90aGVyPzogT3RoZXI8XG4gICAgICAgICAgICBSLFxuICAgICAgICAgICAgXCJmb3J3YXJkTWVzc2FnZVwiLFxuICAgICAgICAgICAgXCJjaGF0X2lkXCIgfCBcImZyb21fY2hhdF9pZFwiIHwgXCJtZXNzYWdlX2lkXCJcbiAgICAgICAgPixcbiAgICAgICAgc2lnbmFsPzogQWJvcnRTaWduYWwsXG4gICAgKSB7XG4gICAgICAgIHJldHVybiB0aGlzLnJhdy5mb3J3YXJkTWVzc2FnZShcbiAgICAgICAgICAgIHsgY2hhdF9pZCwgZnJvbV9jaGF0X2lkLCBtZXNzYWdlX2lkLCAuLi5vdGhlciB9LFxuICAgICAgICAgICAgc2lnbmFsLFxuICAgICAgICApO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFVzZSB0aGlzIG1ldGhvZCB0byBmb3J3YXJkIG11bHRpcGxlIG1lc3NhZ2VzIG9mIGFueSBraW5kLiBJZiBzb21lIG9mIHRoZSBzcGVjaWZpZWQgbWVzc2FnZXMgY2FuJ3QgYmUgZm91bmQgb3IgZm9yd2FyZGVkLCB0aGV5IGFyZSBza2lwcGVkLiBTZXJ2aWNlIG1lc3NhZ2VzIGFuZCBtZXNzYWdlcyB3aXRoIHByb3RlY3RlZCBjb250ZW50IGNhbid0IGJlIGZvcndhcmRlZC4gQWxidW0gZ3JvdXBpbmcgaXMga2VwdCBmb3IgZm9yd2FyZGVkIG1lc3NhZ2VzLiBPbiBzdWNjZXNzLCBhbiBhcnJheSBvZiBNZXNzYWdlSWQgb2YgdGhlIHNlbnQgbWVzc2FnZXMgaXMgcmV0dXJuZWQuXG4gICAgICpcbiAgICAgKiBAcGFyYW0gY2hhdF9pZCBVbmlxdWUgaWRlbnRpZmllciBmb3IgdGhlIHRhcmdldCBjaGF0IG9yIHVzZXJuYW1lIG9mIHRoZSB0YXJnZXQgY2hhbm5lbCAoaW4gdGhlIGZvcm1hdCBAY2hhbm5lbHVzZXJuYW1lKVxuICAgICAqIEBwYXJhbSBmcm9tX2NoYXRfaWQgVW5pcXVlIGlkZW50aWZpZXIgZm9yIHRoZSBjaGF0IHdoZXJlIHRoZSBvcmlnaW5hbCBtZXNzYWdlcyB3ZXJlIHNlbnQgKG9yIGNoYW5uZWwgdXNlcm5hbWUgaW4gdGhlIGZvcm1hdCBAY2hhbm5lbHVzZXJuYW1lKVxuICAgICAqIEBwYXJhbSBtZXNzYWdlX2lkcyBBIGxpc3Qgb2YgMS0xMDAgaWRlbnRpZmllcnMgb2YgbWVzc2FnZXMgaW4gdGhlIGNoYXQgZnJvbV9jaGF0X2lkIHRvIGZvcndhcmQuIFRoZSBpZGVudGlmaWVycyBtdXN0IGJlIHNwZWNpZmllZCBpbiBhIHN0cmljdGx5IGluY3JlYXNpbmcgb3JkZXIuXG4gICAgICogQHBhcmFtIG90aGVyIE9wdGlvbmFsIHJlbWFpbmluZyBwYXJhbWV0ZXJzLCBjb25mZXIgdGhlIG9mZmljaWFsIHJlZmVyZW5jZSBiZWxvd1xuICAgICAqIEBwYXJhbSBzaWduYWwgT3B0aW9uYWwgYEFib3J0U2lnbmFsYCB0byBjYW5jZWwgdGhlIHJlcXVlc3RcbiAgICAgKlxuICAgICAqICoqT2ZmaWNpYWwgcmVmZXJlbmNlOioqIGh0dHBzOi8vY29yZS50ZWxlZ3JhbS5vcmcvYm90cy9hcGkjZm9yd2FyZG1lc3NhZ2VzXG4gICAgICovXG4gICAgZm9yd2FyZE1lc3NhZ2VzKFxuICAgICAgICBjaGF0X2lkOiBudW1iZXIgfCBzdHJpbmcsXG4gICAgICAgIGZyb21fY2hhdF9pZDogbnVtYmVyIHwgc3RyaW5nLFxuICAgICAgICBtZXNzYWdlX2lkczogbnVtYmVyW10sXG4gICAgICAgIG90aGVyPzogT3RoZXI8XG4gICAgICAgICAgICBSLFxuICAgICAgICAgICAgXCJmb3J3YXJkTWVzc2FnZXNcIixcbiAgICAgICAgICAgIFwiY2hhdF9pZFwiIHwgXCJmcm9tX2NoYXRfaWRcIiB8IFwibWVzc2FnZV9pZHNcIlxuICAgICAgICA+LFxuICAgICAgICBzaWduYWw/OiBBYm9ydFNpZ25hbCxcbiAgICApIHtcbiAgICAgICAgcmV0dXJuIHRoaXMucmF3LmZvcndhcmRNZXNzYWdlcyh7XG4gICAgICAgICAgICBjaGF0X2lkLFxuICAgICAgICAgICAgZnJvbV9jaGF0X2lkLFxuICAgICAgICAgICAgbWVzc2FnZV9pZHMsXG4gICAgICAgICAgICAuLi5vdGhlcixcbiAgICAgICAgfSwgc2lnbmFsKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBVc2UgdGhpcyBtZXRob2QgdG8gY29weSBtZXNzYWdlcyBvZiBhbnkga2luZC4gU2VydmljZSBtZXNzYWdlcywgcGFpZCBtZWRpYSBtZXNzYWdlcywgZ2l2ZWF3YXkgbWVzc2FnZXMsIGdpdmVhd2F5IHdpbm5lcnMgbWVzc2FnZXMsIGFuZCBpbnZvaWNlIG1lc3NhZ2VzIGNhbid0IGJlIGNvcGllZC4gQSBxdWl6IHBvbGwgY2FuIGJlIGNvcGllZCBvbmx5IGlmIHRoZSB2YWx1ZSBvZiB0aGUgZmllbGQgY29ycmVjdF9vcHRpb25faWQgaXMga25vd24gdG8gdGhlIGJvdC4gVGhlIG1ldGhvZCBpcyBhbmFsb2dvdXMgdG8gdGhlIG1ldGhvZCBmb3J3YXJkTWVzc2FnZSwgYnV0IHRoZSBjb3BpZWQgbWVzc2FnZSBkb2Vzbid0IGhhdmUgYSBsaW5rIHRvIHRoZSBvcmlnaW5hbCBtZXNzYWdlLiBSZXR1cm5zIHRoZSBNZXNzYWdlSWQgb2YgdGhlIHNlbnQgbWVzc2FnZSBvbiBzdWNjZXNzLlxuICAgICAqXG4gICAgICogQHBhcmFtIGNoYXRfaWQgVW5pcXVlIGlkZW50aWZpZXIgZm9yIHRoZSB0YXJnZXQgY2hhdCBvciB1c2VybmFtZSBvZiB0aGUgdGFyZ2V0IGNoYW5uZWwgKGluIHRoZSBmb3JtYXQgQGNoYW5uZWx1c2VybmFtZSlcbiAgICAgKiBAcGFyYW0gZnJvbV9jaGF0X2lkIFVuaXF1ZSBpZGVudGlmaWVyIGZvciB0aGUgY2hhdCB3aGVyZSB0aGUgb3JpZ2luYWwgbWVzc2FnZSB3YXMgc2VudCAob3IgY2hhbm5lbCB1c2VybmFtZSBpbiB0aGUgZm9ybWF0IEBjaGFubmVsdXNlcm5hbWUpXG4gICAgICogQHBhcmFtIG1lc3NhZ2VfaWQgTWVzc2FnZSBpZGVudGlmaWVyIGluIHRoZSBjaGF0IHNwZWNpZmllZCBpbiBmcm9tX2NoYXRfaWRcbiAgICAgKiBAcGFyYW0gb3RoZXIgT3B0aW9uYWwgcmVtYWluaW5nIHBhcmFtZXRlcnMsIGNvbmZlciB0aGUgb2ZmaWNpYWwgcmVmZXJlbmNlIGJlbG93XG4gICAgICogQHBhcmFtIHNpZ25hbCBPcHRpb25hbCBgQWJvcnRTaWduYWxgIHRvIGNhbmNlbCB0aGUgcmVxdWVzdFxuICAgICAqXG4gICAgICogKipPZmZpY2lhbCByZWZlcmVuY2U6KiogaHR0cHM6Ly9jb3JlLnRlbGVncmFtLm9yZy9ib3RzL2FwaSNjb3B5bWVzc2FnZVxuICAgICAqL1xuICAgIGNvcHlNZXNzYWdlKFxuICAgICAgICBjaGF0X2lkOiBudW1iZXIgfCBzdHJpbmcsXG4gICAgICAgIGZyb21fY2hhdF9pZDogbnVtYmVyIHwgc3RyaW5nLFxuICAgICAgICBtZXNzYWdlX2lkOiBudW1iZXIsXG4gICAgICAgIG90aGVyPzogT3RoZXI8XG4gICAgICAgICAgICBSLFxuICAgICAgICAgICAgXCJjb3B5TWVzc2FnZVwiLFxuICAgICAgICAgICAgXCJjaGF0X2lkXCIgfCBcImZyb21fY2hhdF9pZFwiIHwgXCJtZXNzYWdlX2lkXCJcbiAgICAgICAgPixcbiAgICAgICAgc2lnbmFsPzogQWJvcnRTaWduYWwsXG4gICAgKSB7XG4gICAgICAgIHJldHVybiB0aGlzLnJhdy5jb3B5TWVzc2FnZShcbiAgICAgICAgICAgIHsgY2hhdF9pZCwgZnJvbV9jaGF0X2lkLCBtZXNzYWdlX2lkLCAuLi5vdGhlciB9LFxuICAgICAgICAgICAgc2lnbmFsLFxuICAgICAgICApO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFVzZSB0aGlzIG1ldGhvZCB0byBjb3B5IG1lc3NhZ2VzIG9mIGFueSBraW5kLiBJZiBzb21lIG9mIHRoZSBzcGVjaWZpZWQgbWVzc2FnZXMgY2FuJ3QgYmUgZm91bmQgb3IgY29waWVkLCB0aGV5IGFyZSBza2lwcGVkLiBTZXJ2aWNlIG1lc3NhZ2VzLCBwYWlkIG1lZGlhIG1lc3NhZ2VzLCBnaXZlYXdheSBtZXNzYWdlcywgZ2l2ZWF3YXkgd2lubmVycyBtZXNzYWdlcywgYW5kIGludm9pY2UgbWVzc2FnZXMgY2FuJ3QgYmUgY29waWVkLiBBIHF1aXogcG9sbCBjYW4gYmUgY29waWVkIG9ubHkgaWYgdGhlIHZhbHVlIG9mIHRoZSBmaWVsZCBjb3JyZWN0X29wdGlvbl9pZCBpcyBrbm93biB0byB0aGUgYm90LiBUaGUgbWV0aG9kIGlzIGFuYWxvZ291cyB0byB0aGUgbWV0aG9kIGZvcndhcmRNZXNzYWdlcywgYnV0IHRoZSBjb3BpZWQgbWVzc2FnZXMgZG9uJ3QgaGF2ZSBhIGxpbmsgdG8gdGhlIG9yaWdpbmFsIG1lc3NhZ2UuIEFsYnVtIGdyb3VwaW5nIGlzIGtlcHQgZm9yIGNvcGllZCBtZXNzYWdlcy4gT24gc3VjY2VzcywgYW4gYXJyYXkgb2YgTWVzc2FnZUlkIG9mIHRoZSBzZW50IG1lc3NhZ2VzIGlzIHJldHVybmVkLlxuICAgICAqXG4gICAgICogQHBhcmFtIGNoYXRfaWQgVW5pcXVlIGlkZW50aWZpZXIgZm9yIHRoZSB0YXJnZXQgY2hhdCBvciB1c2VybmFtZSBvZiB0aGUgdGFyZ2V0IGNoYW5uZWwgKGluIHRoZSBmb3JtYXQgQGNoYW5uZWx1c2VybmFtZSlcbiAgICAgKiBAcGFyYW0gZnJvbV9jaGF0X2lkIFVuaXF1ZSBpZGVudGlmaWVyIGZvciB0aGUgY2hhdCB3aGVyZSB0aGUgb3JpZ2luYWwgbWVzc2FnZXMgd2VyZSBzZW50IChvciBjaGFubmVsIHVzZXJuYW1lIGluIHRoZSBmb3JtYXQgQGNoYW5uZWx1c2VybmFtZSlcbiAgICAgKiBAcGFyYW0gbWVzc2FnZV9pZHMgQSBsaXN0IG9mIDEtMTAwIGlkZW50aWZpZXJzIG9mIG1lc3NhZ2VzIGluIHRoZSBjaGF0IGZyb21fY2hhdF9pZCB0byBjb3B5LiBUaGUgaWRlbnRpZmllcnMgbXVzdCBiZSBzcGVjaWZpZWQgaW4gYSBzdHJpY3RseSBpbmNyZWFzaW5nIG9yZGVyLlxuICAgICAqIEBwYXJhbSBvdGhlciBPcHRpb25hbCByZW1haW5pbmcgcGFyYW1ldGVycywgY29uZmVyIHRoZSBvZmZpY2lhbCByZWZlcmVuY2UgYmVsb3dcbiAgICAgKiBAcGFyYW0gc2lnbmFsIE9wdGlvbmFsIGBBYm9ydFNpZ25hbGAgdG8gY2FuY2VsIHRoZSByZXF1ZXN0XG4gICAgICpcbiAgICAgKiAqKk9mZmljaWFsIHJlZmVyZW5jZToqKiBodHRwczovL2NvcmUudGVsZWdyYW0ub3JnL2JvdHMvYXBpI2NvcHltZXNzYWdlc1xuICAgICAqL1xuICAgIGNvcHlNZXNzYWdlcyhcbiAgICAgICAgY2hhdF9pZDogbnVtYmVyIHwgc3RyaW5nLFxuICAgICAgICBmcm9tX2NoYXRfaWQ6IG51bWJlciB8IHN0cmluZyxcbiAgICAgICAgbWVzc2FnZV9pZHM6IG51bWJlcltdLFxuICAgICAgICBvdGhlcj86IE90aGVyPFxuICAgICAgICAgICAgUixcbiAgICAgICAgICAgIFwiY29weU1lc3NhZ2VzXCIsXG4gICAgICAgICAgICBcImNoYXRfaWRcIiB8IFwiZnJvbV9jaGF0X2lkXCIgfCBcIm1lc3NhZ2VfaWRcIlxuICAgICAgICA+LFxuICAgICAgICBzaWduYWw/OiBBYm9ydFNpZ25hbCxcbiAgICApIHtcbiAgICAgICAgcmV0dXJuIHRoaXMucmF3LmNvcHlNZXNzYWdlcyh7XG4gICAgICAgICAgICBjaGF0X2lkLFxuICAgICAgICAgICAgZnJvbV9jaGF0X2lkLFxuICAgICAgICAgICAgbWVzc2FnZV9pZHMsXG4gICAgICAgICAgICAuLi5vdGhlcixcbiAgICAgICAgfSwgc2lnbmFsKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBVc2UgdGhpcyBtZXRob2QgdG8gc2VuZCBwaG90b3MuIE9uIHN1Y2Nlc3MsIHRoZSBzZW50IE1lc3NhZ2UgaXMgcmV0dXJuZWQuXG4gICAgICpcbiAgICAgKiBAcGFyYW0gY2hhdF9pZCBVbmlxdWUgaWRlbnRpZmllciBmb3IgdGhlIHRhcmdldCBjaGF0IG9yIHVzZXJuYW1lIG9mIHRoZSB0YXJnZXQgY2hhbm5lbCAoaW4gdGhlIGZvcm1hdCBAY2hhbm5lbHVzZXJuYW1lKVxuICAgICAqIEBwYXJhbSBwaG90byBQaG90byB0byBzZW5kLiBQYXNzIGEgZmlsZV9pZCBhcyBTdHJpbmcgdG8gc2VuZCBhIHBob3RvIHRoYXQgZXhpc3RzIG9uIHRoZSBUZWxlZ3JhbSBzZXJ2ZXJzIChyZWNvbW1lbmRlZCksIHBhc3MgYW4gSFRUUCBVUkwgYXMgYSBTdHJpbmcgZm9yIFRlbGVncmFtIHRvIGdldCBhIHBob3RvIGZyb20gdGhlIEludGVybmV0LCBvciB1cGxvYWQgYSBuZXcgcGhvdG8gdXNpbmcgbXVsdGlwYXJ0L2Zvcm0tZGF0YS4gVGhlIHBob3RvIG11c3QgYmUgYXQgbW9zdCAxMCBNQiBpbiBzaXplLiBUaGUgcGhvdG8ncyB3aWR0aCBhbmQgaGVpZ2h0IG11c3Qgbm90IGV4Y2VlZCAxMDAwMCBpbiB0b3RhbC4gV2lkdGggYW5kIGhlaWdodCByYXRpbyBtdXN0IGJlIGF0IG1vc3QgMjAuXG4gICAgICogQHBhcmFtIG90aGVyIE9wdGlvbmFsIHJlbWFpbmluZyBwYXJhbWV0ZXJzLCBjb25mZXIgdGhlIG9mZmljaWFsIHJlZmVyZW5jZSBiZWxvd1xuICAgICAqIEBwYXJhbSBzaWduYWwgT3B0aW9uYWwgYEFib3J0U2lnbmFsYCB0byBjYW5jZWwgdGhlIHJlcXVlc3RcbiAgICAgKlxuICAgICAqICoqT2ZmaWNpYWwgcmVmZXJlbmNlOioqIGh0dHBzOi8vY29yZS50ZWxlZ3JhbS5vcmcvYm90cy9hcGkjc2VuZHBob3RvXG4gICAgICovXG4gICAgc2VuZFBob3RvKFxuICAgICAgICBjaGF0X2lkOiBudW1iZXIgfCBzdHJpbmcsXG4gICAgICAgIHBob3RvOiBJbnB1dEZpbGUgfCBzdHJpbmcsXG4gICAgICAgIG90aGVyPzogT3RoZXI8UiwgXCJzZW5kUGhvdG9cIiwgXCJjaGF0X2lkXCIgfCBcInBob3RvXCI+LFxuICAgICAgICBzaWduYWw/OiBBYm9ydFNpZ25hbCxcbiAgICApIHtcbiAgICAgICAgcmV0dXJuIHRoaXMucmF3LnNlbmRQaG90byh7IGNoYXRfaWQsIHBob3RvLCAuLi5vdGhlciB9LCBzaWduYWwpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFVzZSB0aGlzIG1ldGhvZCB0byBzZW5kIGF1ZGlvIGZpbGVzLCBpZiB5b3Ugd2FudCBUZWxlZ3JhbSBjbGllbnRzIHRvIGRpc3BsYXkgdGhlbSBpbiB0aGUgbXVzaWMgcGxheWVyLiBZb3VyIGF1ZGlvIG11c3QgYmUgaW4gdGhlIC5NUDMgb3IgLk00QSBmb3JtYXQuIE9uIHN1Y2Nlc3MsIHRoZSBzZW50IE1lc3NhZ2UgaXMgcmV0dXJuZWQuIEJvdHMgY2FuIGN1cnJlbnRseSBzZW5kIGF1ZGlvIGZpbGVzIG9mIHVwIHRvIDUwIE1CIGluIHNpemUsIHRoaXMgbGltaXQgbWF5IGJlIGNoYW5nZWQgaW4gdGhlIGZ1dHVyZS5cbiAgICAgKlxuICAgICAqIEZvciBzZW5kaW5nIHZvaWNlIG1lc3NhZ2VzLCB1c2UgdGhlIHNlbmRWb2ljZSBtZXRob2QgaW5zdGVhZC5cbiAgICAgKlxuICAgICAqIEBwYXJhbSBjaGF0X2lkIFVuaXF1ZSBpZGVudGlmaWVyIGZvciB0aGUgdGFyZ2V0IGNoYXQgb3IgdXNlcm5hbWUgb2YgdGhlIHRhcmdldCBjaGFubmVsIChpbiB0aGUgZm9ybWF0IEBjaGFubmVsdXNlcm5hbWUpXG4gICAgICogQHBhcmFtIGF1ZGlvIEF1ZGlvIGZpbGUgdG8gc2VuZC4gUGFzcyBhIGZpbGVfaWQgYXMgU3RyaW5nIHRvIHNlbmQgYW4gYXVkaW8gZmlsZSB0aGF0IGV4aXN0cyBvbiB0aGUgVGVsZWdyYW0gc2VydmVycyAocmVjb21tZW5kZWQpLCBwYXNzIGFuIEhUVFAgVVJMIGFzIGEgU3RyaW5nIGZvciBUZWxlZ3JhbSB0byBnZXQgYW4gYXVkaW8gZmlsZSBmcm9tIHRoZSBJbnRlcm5ldCwgb3IgdXBsb2FkIGEgbmV3IG9uZSB1c2luZyBtdWx0aXBhcnQvZm9ybS1kYXRhLlxuICAgICAqIEBwYXJhbSBvdGhlciBPcHRpb25hbCByZW1haW5pbmcgcGFyYW1ldGVycywgY29uZmVyIHRoZSBvZmZpY2lhbCByZWZlcmVuY2UgYmVsb3dcbiAgICAgKiBAcGFyYW0gc2lnbmFsIE9wdGlvbmFsIGBBYm9ydFNpZ25hbGAgdG8gY2FuY2VsIHRoZSByZXF1ZXN0XG4gICAgICpcbiAgICAgKiAqKk9mZmljaWFsIHJlZmVyZW5jZToqKiBodHRwczovL2NvcmUudGVsZWdyYW0ub3JnL2JvdHMvYXBpI3NlbmRhdWRpb1xuICAgICAqL1xuICAgIHNlbmRBdWRpbyhcbiAgICAgICAgY2hhdF9pZDogbnVtYmVyIHwgc3RyaW5nLFxuICAgICAgICBhdWRpbzogSW5wdXRGaWxlIHwgc3RyaW5nLFxuICAgICAgICBvdGhlcj86IE90aGVyPFIsIFwic2VuZEF1ZGlvXCIsIFwiY2hhdF9pZFwiIHwgXCJhdWRpb1wiPixcbiAgICAgICAgc2lnbmFsPzogQWJvcnRTaWduYWwsXG4gICAgKSB7XG4gICAgICAgIHJldHVybiB0aGlzLnJhdy5zZW5kQXVkaW8oeyBjaGF0X2lkLCBhdWRpbywgLi4ub3RoZXIgfSwgc2lnbmFsKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBVc2UgdGhpcyBtZXRob2QgdG8gc2VuZCBnZW5lcmFsIGZpbGVzLiBPbiBzdWNjZXNzLCB0aGUgc2VudCBNZXNzYWdlIGlzIHJldHVybmVkLiBCb3RzIGNhbiBjdXJyZW50bHkgc2VuZCBmaWxlcyBvZiBhbnkgdHlwZSBvZiB1cCB0byA1MCBNQiBpbiBzaXplLCB0aGlzIGxpbWl0IG1heSBiZSBjaGFuZ2VkIGluIHRoZSBmdXR1cmUuXG4gICAgICpcbiAgICAgKiBAcGFyYW0gY2hhdF9pZCBVbmlxdWUgaWRlbnRpZmllciBmb3IgdGhlIHRhcmdldCBjaGF0IG9yIHVzZXJuYW1lIG9mIHRoZSB0YXJnZXQgY2hhbm5lbCAoaW4gdGhlIGZvcm1hdCBAY2hhbm5lbHVzZXJuYW1lKVxuICAgICAqIEBwYXJhbSBkb2N1bWVudCBGaWxlIHRvIHNlbmQuIFBhc3MgYSBmaWxlX2lkIGFzIFN0cmluZyB0byBzZW5kIGEgZmlsZSB0aGF0IGV4aXN0cyBvbiB0aGUgVGVsZWdyYW0gc2VydmVycyAocmVjb21tZW5kZWQpLCBwYXNzIGFuIEhUVFAgVVJMIGFzIGEgU3RyaW5nIGZvciBUZWxlZ3JhbSB0byBnZXQgYSBmaWxlIGZyb20gdGhlIEludGVybmV0LCBvciB1cGxvYWQgYSBuZXcgb25lIHVzaW5nIG11bHRpcGFydC9mb3JtLWRhdGEuXG4gICAgICogQHBhcmFtIG90aGVyIE9wdGlvbmFsIHJlbWFpbmluZyBwYXJhbWV0ZXJzLCBjb25mZXIgdGhlIG9mZmljaWFsIHJlZmVyZW5jZSBiZWxvd1xuICAgICAqIEBwYXJhbSBzaWduYWwgT3B0aW9uYWwgYEFib3J0U2lnbmFsYCB0byBjYW5jZWwgdGhlIHJlcXVlc3RcbiAgICAgKlxuICAgICAqICoqT2ZmaWNpYWwgcmVmZXJlbmNlOioqIGh0dHBzOi8vY29yZS50ZWxlZ3JhbS5vcmcvYm90cy9hcGkjc2VuZGRvY3VtZW50XG4gICAgICovXG4gICAgc2VuZERvY3VtZW50KFxuICAgICAgICBjaGF0X2lkOiBudW1iZXIgfCBzdHJpbmcsXG4gICAgICAgIGRvY3VtZW50OiBJbnB1dEZpbGUgfCBzdHJpbmcsXG4gICAgICAgIG90aGVyPzogT3RoZXI8UiwgXCJzZW5kRG9jdW1lbnRcIiwgXCJjaGF0X2lkXCIgfCBcImRvY3VtZW50XCI+LFxuICAgICAgICBzaWduYWw/OiBBYm9ydFNpZ25hbCxcbiAgICApIHtcbiAgICAgICAgcmV0dXJuIHRoaXMucmF3LnNlbmREb2N1bWVudCh7IGNoYXRfaWQsIGRvY3VtZW50LCAuLi5vdGhlciB9LCBzaWduYWwpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFVzZSB0aGlzIG1ldGhvZCB0byBzZW5kIHZpZGVvIGZpbGVzLCBUZWxlZ3JhbSBjbGllbnRzIHN1cHBvcnQgbXA0IHZpZGVvcyAob3RoZXIgZm9ybWF0cyBtYXkgYmUgc2VudCBhcyBEb2N1bWVudCkuIE9uIHN1Y2Nlc3MsIHRoZSBzZW50IE1lc3NhZ2UgaXMgcmV0dXJuZWQuIEJvdHMgY2FuIGN1cnJlbnRseSBzZW5kIHZpZGVvIGZpbGVzIG9mIHVwIHRvIDUwIE1CIGluIHNpemUsIHRoaXMgbGltaXQgbWF5IGJlIGNoYW5nZWQgaW4gdGhlIGZ1dHVyZS5cbiAgICAgKlxuICAgICAqIEBwYXJhbSBjaGF0X2lkIFVuaXF1ZSBpZGVudGlmaWVyIGZvciB0aGUgdGFyZ2V0IGNoYXQgb3IgdXNlcm5hbWUgb2YgdGhlIHRhcmdldCBjaGFubmVsIChpbiB0aGUgZm9ybWF0IEBjaGFubmVsdXNlcm5hbWUpXG4gICAgICogQHBhcmFtIHZpZGVvIFZpZGVvIHRvIHNlbmQuIFBhc3MgYSBmaWxlX2lkIGFzIFN0cmluZyB0byBzZW5kIGEgdmlkZW8gdGhhdCBleGlzdHMgb24gdGhlIFRlbGVncmFtIHNlcnZlcnMgKHJlY29tbWVuZGVkKSwgcGFzcyBhbiBIVFRQIFVSTCBhcyBhIFN0cmluZyBmb3IgVGVsZWdyYW0gdG8gZ2V0IGEgdmlkZW8gZnJvbSB0aGUgSW50ZXJuZXQsIG9yIHVwbG9hZCBhIG5ldyB2aWRlbyB1c2luZyBtdWx0aXBhcnQvZm9ybS1kYXRhLlxuICAgICAqIEBwYXJhbSBvdGhlciBPcHRpb25hbCByZW1haW5pbmcgcGFyYW1ldGVycywgY29uZmVyIHRoZSBvZmZpY2lhbCByZWZlcmVuY2UgYmVsb3dcbiAgICAgKiBAcGFyYW0gc2lnbmFsIE9wdGlvbmFsIGBBYm9ydFNpZ25hbGAgdG8gY2FuY2VsIHRoZSByZXF1ZXN0XG4gICAgICpcbiAgICAgKiAqKk9mZmljaWFsIHJlZmVyZW5jZToqKiBodHRwczovL2NvcmUudGVsZWdyYW0ub3JnL2JvdHMvYXBpI3NlbmR2aWRlb1xuICAgICAqL1xuICAgIHNlbmRWaWRlbyhcbiAgICAgICAgY2hhdF9pZDogbnVtYmVyIHwgc3RyaW5nLFxuICAgICAgICB2aWRlbzogSW5wdXRGaWxlIHwgc3RyaW5nLFxuICAgICAgICBvdGhlcj86IE90aGVyPFIsIFwic2VuZFZpZGVvXCIsIFwiY2hhdF9pZFwiIHwgXCJ2aWRlb1wiPixcbiAgICAgICAgc2lnbmFsPzogQWJvcnRTaWduYWwsXG4gICAgKSB7XG4gICAgICAgIHJldHVybiB0aGlzLnJhdy5zZW5kVmlkZW8oeyBjaGF0X2lkLCB2aWRlbywgLi4ub3RoZXIgfSwgc2lnbmFsKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBVc2UgdGhpcyBtZXRob2QgdG8gc2VuZCBhbmltYXRpb24gZmlsZXMgKEdJRiBvciBILjI2NC9NUEVHLTQgQVZDIHZpZGVvIHdpdGhvdXQgc291bmQpLiBPbiBzdWNjZXNzLCB0aGUgc2VudCBNZXNzYWdlIGlzIHJldHVybmVkLiBCb3RzIGNhbiBjdXJyZW50bHkgc2VuZCBhbmltYXRpb24gZmlsZXMgb2YgdXAgdG8gNTAgTUIgaW4gc2l6ZSwgdGhpcyBsaW1pdCBtYXkgYmUgY2hhbmdlZCBpbiB0aGUgZnV0dXJlLlxuICAgICAqXG4gICAgICogQHBhcmFtIGNoYXRfaWQgVW5pcXVlIGlkZW50aWZpZXIgZm9yIHRoZSB0YXJnZXQgY2hhdCBvciB1c2VybmFtZSBvZiB0aGUgdGFyZ2V0IGNoYW5uZWwgKGluIHRoZSBmb3JtYXQgQGNoYW5uZWx1c2VybmFtZSlcbiAgICAgKiBAcGFyYW0gYW5pbWF0aW9uIEFuaW1hdGlvbiB0byBzZW5kLiBQYXNzIGEgZmlsZV9pZCBhcyBTdHJpbmcgdG8gc2VuZCBhbiBhbmltYXRpb24gdGhhdCBleGlzdHMgb24gdGhlIFRlbGVncmFtIHNlcnZlcnMgKHJlY29tbWVuZGVkKSwgcGFzcyBhbiBIVFRQIFVSTCBhcyBhIFN0cmluZyBmb3IgVGVsZWdyYW0gdG8gZ2V0IGFuIGFuaW1hdGlvbiBmcm9tIHRoZSBJbnRlcm5ldCwgb3IgdXBsb2FkIGEgbmV3IGFuaW1hdGlvbiB1c2luZyBtdWx0aXBhcnQvZm9ybS1kYXRhLlxuICAgICAqIEBwYXJhbSBvdGhlciBPcHRpb25hbCByZW1haW5pbmcgcGFyYW1ldGVycywgY29uZmVyIHRoZSBvZmZpY2lhbCByZWZlcmVuY2UgYmVsb3dcbiAgICAgKiBAcGFyYW0gc2lnbmFsIE9wdGlvbmFsIGBBYm9ydFNpZ25hbGAgdG8gY2FuY2VsIHRoZSByZXF1ZXN0XG4gICAgICpcbiAgICAgKiAqKk9mZmljaWFsIHJlZmVyZW5jZToqKiBodHRwczovL2NvcmUudGVsZWdyYW0ub3JnL2JvdHMvYXBpI3NlbmRhbmltYXRpb25cbiAgICAgKi9cbiAgICBzZW5kQW5pbWF0aW9uKFxuICAgICAgICBjaGF0X2lkOiBudW1iZXIgfCBzdHJpbmcsXG4gICAgICAgIGFuaW1hdGlvbjogSW5wdXRGaWxlIHwgc3RyaW5nLFxuICAgICAgICBvdGhlcj86IE90aGVyPFIsIFwic2VuZEFuaW1hdGlvblwiLCBcImNoYXRfaWRcIiB8IFwiYW5pbWF0aW9uXCI+LFxuICAgICAgICBzaWduYWw/OiBBYm9ydFNpZ25hbCxcbiAgICApIHtcbiAgICAgICAgcmV0dXJuIHRoaXMucmF3LnNlbmRBbmltYXRpb24oeyBjaGF0X2lkLCBhbmltYXRpb24sIC4uLm90aGVyIH0sIHNpZ25hbCk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogVXNlIHRoaXMgbWV0aG9kIHRvIHNlbmQgYXVkaW8gZmlsZXMsIGlmIHlvdSB3YW50IFRlbGVncmFtIGNsaWVudHMgdG8gZGlzcGxheSB0aGUgZmlsZSBhcyBhIHBsYXlhYmxlIHZvaWNlIG1lc3NhZ2UuIEZvciB0aGlzIHRvIHdvcmssIHlvdXIgYXVkaW8gbXVzdCBiZSBpbiBhbiAuT0dHIGZpbGUgZW5jb2RlZCB3aXRoIE9QVVMgKG90aGVyIGZvcm1hdHMgbWF5IGJlIHNlbnQgYXMgQXVkaW8gb3IgRG9jdW1lbnQpLiBPbiBzdWNjZXNzLCB0aGUgc2VudCBNZXNzYWdlIGlzIHJldHVybmVkLiBCb3RzIGNhbiBjdXJyZW50bHkgc2VuZCB2b2ljZSBtZXNzYWdlcyBvZiB1cCB0byA1MCBNQiBpbiBzaXplLCB0aGlzIGxpbWl0IG1heSBiZSBjaGFuZ2VkIGluIHRoZSBmdXR1cmUuXG4gICAgICpcbiAgICAgKiBAcGFyYW0gY2hhdF9pZCBVbmlxdWUgaWRlbnRpZmllciBmb3IgdGhlIHRhcmdldCBjaGF0IG9yIHVzZXJuYW1lIG9mIHRoZSB0YXJnZXQgY2hhbm5lbCAoaW4gdGhlIGZvcm1hdCBAY2hhbm5lbHVzZXJuYW1lKVxuICAgICAqIEBwYXJhbSB2b2ljZSBBdWRpbyBmaWxlIHRvIHNlbmQuIFBhc3MgYSBmaWxlX2lkIGFzIFN0cmluZyB0byBzZW5kIGEgZmlsZSB0aGF0IGV4aXN0cyBvbiB0aGUgVGVsZWdyYW0gc2VydmVycyAocmVjb21tZW5kZWQpLCBwYXNzIGFuIEhUVFAgVVJMIGFzIGEgU3RyaW5nIGZvciBUZWxlZ3JhbSB0byBnZXQgYSBmaWxlIGZyb20gdGhlIEludGVybmV0LCBvciB1cGxvYWQgYSBuZXcgb25lIHVzaW5nIG11bHRpcGFydC9mb3JtLWRhdGEuXG4gICAgICogQHBhcmFtIG90aGVyIE9wdGlvbmFsIHJlbWFpbmluZyBwYXJhbWV0ZXJzLCBjb25mZXIgdGhlIG9mZmljaWFsIHJlZmVyZW5jZSBiZWxvd1xuICAgICAqIEBwYXJhbSBzaWduYWwgT3B0aW9uYWwgYEFib3J0U2lnbmFsYCB0byBjYW5jZWwgdGhlIHJlcXVlc3RcbiAgICAgKlxuICAgICAqICoqT2ZmaWNpYWwgcmVmZXJlbmNlOioqIGh0dHBzOi8vY29yZS50ZWxlZ3JhbS5vcmcvYm90cy9hcGkjc2VuZHZvaWNlXG4gICAgICovXG4gICAgc2VuZFZvaWNlKFxuICAgICAgICBjaGF0X2lkOiBudW1iZXIgfCBzdHJpbmcsXG4gICAgICAgIHZvaWNlOiBJbnB1dEZpbGUgfCBzdHJpbmcsXG4gICAgICAgIG90aGVyPzogT3RoZXI8UiwgXCJzZW5kVm9pY2VcIiwgXCJjaGF0X2lkXCIgfCBcInZvaWNlXCI+LFxuICAgICAgICBzaWduYWw/OiBBYm9ydFNpZ25hbCxcbiAgICApIHtcbiAgICAgICAgcmV0dXJuIHRoaXMucmF3LnNlbmRWb2ljZSh7IGNoYXRfaWQsIHZvaWNlLCAuLi5vdGhlciB9LCBzaWduYWwpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFVzZSB0aGlzIG1ldGhvZCB0byBzZW5kIHZpZGVvIG1lc3NhZ2VzLiBPbiBzdWNjZXNzLCB0aGUgc2VudCBNZXNzYWdlIGlzIHJldHVybmVkLlxuICAgICAqIEFzIG9mIHYuNC4wLCBUZWxlZ3JhbSBjbGllbnRzIHN1cHBvcnQgcm91bmRlZCBzcXVhcmUgbXA0IHZpZGVvcyBvZiB1cCB0byAxIG1pbnV0ZSBsb25nLlxuICAgICAqXG4gICAgICogQHBhcmFtIGNoYXRfaWQgVW5pcXVlIGlkZW50aWZpZXIgZm9yIHRoZSB0YXJnZXQgY2hhdCBvciB1c2VybmFtZSBvZiB0aGUgdGFyZ2V0IGNoYW5uZWwgKGluIHRoZSBmb3JtYXQgQGNoYW5uZWx1c2VybmFtZSlcbiAgICAgKiBAcGFyYW0gdmlkZW9fbm90ZSBWaWRlbyBub3RlIHRvIHNlbmQuIFBhc3MgYSBmaWxlX2lkIGFzIFN0cmluZyB0byBzZW5kIGEgdmlkZW8gbm90ZSB0aGF0IGV4aXN0cyBvbiB0aGUgVGVsZWdyYW0gc2VydmVycyAocmVjb21tZW5kZWQpIG9yIHVwbG9hZCBhIG5ldyB2aWRlbyB1c2luZyBtdWx0aXBhcnQvZm9ybS1kYXRhLi4gU2VuZGluZyB2aWRlbyBub3RlcyBieSBhIFVSTCBpcyBjdXJyZW50bHkgdW5zdXBwb3J0ZWRcbiAgICAgKiBAcGFyYW0gb3RoZXIgT3B0aW9uYWwgcmVtYWluaW5nIHBhcmFtZXRlcnMsIGNvbmZlciB0aGUgb2ZmaWNpYWwgcmVmZXJlbmNlIGJlbG93XG4gICAgICogQHBhcmFtIHNpZ25hbCBPcHRpb25hbCBgQWJvcnRTaWduYWxgIHRvIGNhbmNlbCB0aGUgcmVxdWVzdFxuICAgICAqXG4gICAgICogKipPZmZpY2lhbCByZWZlcmVuY2U6KiogaHR0cHM6Ly9jb3JlLnRlbGVncmFtLm9yZy9ib3RzL2FwaSNzZW5kdmlkZW9ub3RlXG4gICAgICovXG4gICAgc2VuZFZpZGVvTm90ZShcbiAgICAgICAgY2hhdF9pZDogbnVtYmVyIHwgc3RyaW5nLFxuICAgICAgICB2aWRlb19ub3RlOiBJbnB1dEZpbGUgfCBzdHJpbmcsXG4gICAgICAgIG90aGVyPzogT3RoZXI8UiwgXCJzZW5kVmlkZW9Ob3RlXCIsIFwiY2hhdF9pZFwiIHwgXCJ2aWRlb19ub3RlXCI+LFxuICAgICAgICBzaWduYWw/OiBBYm9ydFNpZ25hbCxcbiAgICApIHtcbiAgICAgICAgcmV0dXJuIHRoaXMucmF3LnNlbmRWaWRlb05vdGUoXG4gICAgICAgICAgICB7IGNoYXRfaWQsIHZpZGVvX25vdGUsIC4uLm90aGVyIH0sXG4gICAgICAgICAgICBzaWduYWwsXG4gICAgICAgICk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogVXNlIHRoaXMgbWV0aG9kIHRvIHNlbmQgYSBncm91cCBvZiBwaG90b3MsIHZpZGVvcywgZG9jdW1lbnRzIG9yIGF1ZGlvcyBhcyBhbiBhbGJ1bS4gRG9jdW1lbnRzIGFuZCBhdWRpbyBmaWxlcyBjYW4gYmUgb25seSBncm91cGVkIGluIGFuIGFsYnVtIHdpdGggbWVzc2FnZXMgb2YgdGhlIHNhbWUgdHlwZS4gT24gc3VjY2VzcywgYW4gYXJyYXkgb2YgTWVzc2FnZXMgdGhhdCB3ZXJlIHNlbnQgaXMgcmV0dXJuZWQuXG4gICAgICpcbiAgICAgKiBAcGFyYW0gY2hhdF9pZCBVbmlxdWUgaWRlbnRpZmllciBmb3IgdGhlIHRhcmdldCBjaGF0IG9yIHVzZXJuYW1lIG9mIHRoZSB0YXJnZXQgY2hhbm5lbCAoaW4gdGhlIGZvcm1hdCBAY2hhbm5lbHVzZXJuYW1lKVxuICAgICAqIEBwYXJhbSBtZWRpYSBBbiBhcnJheSBkZXNjcmliaW5nIG1lc3NhZ2VzIHRvIGJlIHNlbnQsIG11c3QgaW5jbHVkZSAyLTEwIGl0ZW1zXG4gICAgICogQHBhcmFtIG90aGVyIE9wdGlvbmFsIHJlbWFpbmluZyBwYXJhbWV0ZXJzLCBjb25mZXIgdGhlIG9mZmljaWFsIHJlZmVyZW5jZSBiZWxvd1xuICAgICAqIEBwYXJhbSBzaWduYWwgT3B0aW9uYWwgYEFib3J0U2lnbmFsYCB0byBjYW5jZWwgdGhlIHJlcXVlc3RcbiAgICAgKlxuICAgICAqICoqT2ZmaWNpYWwgcmVmZXJlbmNlOioqIGh0dHBzOi8vY29yZS50ZWxlZ3JhbS5vcmcvYm90cy9hcGkjc2VuZG1lZGlhZ3JvdXBcbiAgICAgKi9cbiAgICBzZW5kTWVkaWFHcm91cChcbiAgICAgICAgY2hhdF9pZDogbnVtYmVyIHwgc3RyaW5nLFxuICAgICAgICBtZWRpYTogUmVhZG9ubHlBcnJheTxcbiAgICAgICAgICAgIHwgSW5wdXRNZWRpYUF1ZGlvXG4gICAgICAgICAgICB8IElucHV0TWVkaWFEb2N1bWVudFxuICAgICAgICAgICAgfCBJbnB1dE1lZGlhUGhvdG9cbiAgICAgICAgICAgIHwgSW5wdXRNZWRpYVZpZGVvXG4gICAgICAgID4sXG4gICAgICAgIG90aGVyPzogT3RoZXI8UiwgXCJzZW5kTWVkaWFHcm91cFwiLCBcImNoYXRfaWRcIiB8IFwibWVkaWFcIj4sXG4gICAgICAgIHNpZ25hbD86IEFib3J0U2lnbmFsLFxuICAgICkge1xuICAgICAgICByZXR1cm4gdGhpcy5yYXcuc2VuZE1lZGlhR3JvdXAoeyBjaGF0X2lkLCBtZWRpYSwgLi4ub3RoZXIgfSwgc2lnbmFsKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBVc2UgdGhpcyBtZXRob2QgdG8gc2VuZCBwb2ludCBvbiB0aGUgbWFwLiBPbiBzdWNjZXNzLCB0aGUgc2VudCBNZXNzYWdlIGlzIHJldHVybmVkLlxuICAgICAqXG4gICAgICogQHBhcmFtIGNoYXRfaWQgVW5pcXVlIGlkZW50aWZpZXIgZm9yIHRoZSB0YXJnZXQgY2hhdCBvciB1c2VybmFtZSBvZiB0aGUgdGFyZ2V0IGNoYW5uZWwgKGluIHRoZSBmb3JtYXQgQGNoYW5uZWx1c2VybmFtZSlcbiAgICAgKiBAcGFyYW0gbGF0aXR1ZGUgTGF0aXR1ZGUgb2YgdGhlIGxvY2F0aW9uXG4gICAgICogQHBhcmFtIGxvbmdpdHVkZSBMb25naXR1ZGUgb2YgdGhlIGxvY2F0aW9uXG4gICAgICogQHBhcmFtIG90aGVyIE9wdGlvbmFsIHJlbWFpbmluZyBwYXJhbWV0ZXJzLCBjb25mZXIgdGhlIG9mZmljaWFsIHJlZmVyZW5jZSBiZWxvd1xuICAgICAqIEBwYXJhbSBzaWduYWwgT3B0aW9uYWwgYEFib3J0U2lnbmFsYCB0byBjYW5jZWwgdGhlIHJlcXVlc3RcbiAgICAgKlxuICAgICAqICoqT2ZmaWNpYWwgcmVmZXJlbmNlOioqIGh0dHBzOi8vY29yZS50ZWxlZ3JhbS5vcmcvYm90cy9hcGkjc2VuZGxvY2F0aW9uXG4gICAgICovXG4gICAgc2VuZExvY2F0aW9uKFxuICAgICAgICBjaGF0X2lkOiBudW1iZXIgfCBzdHJpbmcsXG4gICAgICAgIGxhdGl0dWRlOiBudW1iZXIsXG4gICAgICAgIGxvbmdpdHVkZTogbnVtYmVyLFxuICAgICAgICBvdGhlcj86IE90aGVyPFIsIFwic2VuZExvY2F0aW9uXCIsIFwiY2hhdF9pZFwiIHwgXCJsYXRpdHVkZVwiIHwgXCJsb25naXR1ZGVcIj4sXG4gICAgICAgIHNpZ25hbD86IEFib3J0U2lnbmFsLFxuICAgICkge1xuICAgICAgICByZXR1cm4gdGhpcy5yYXcuc2VuZExvY2F0aW9uKFxuICAgICAgICAgICAgeyBjaGF0X2lkLCBsYXRpdHVkZSwgbG9uZ2l0dWRlLCAuLi5vdGhlciB9LFxuICAgICAgICAgICAgc2lnbmFsLFxuICAgICAgICApO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFVzZSB0aGlzIG1ldGhvZCB0byBlZGl0IGxpdmUgbG9jYXRpb24gbWVzc2FnZXMuIEEgbG9jYXRpb24gY2FuIGJlIGVkaXRlZCB1bnRpbCBpdHMgbGl2ZV9wZXJpb2QgZXhwaXJlcyBvciBlZGl0aW5nIGlzIGV4cGxpY2l0bHkgZGlzYWJsZWQgYnkgYSBjYWxsIHRvIHN0b3BNZXNzYWdlTGl2ZUxvY2F0aW9uLiBPbiBzdWNjZXNzLCBpZiB0aGUgZWRpdGVkIG1lc3NhZ2UgaXMgbm90IGFuIGlubGluZSBtZXNzYWdlLCB0aGUgZWRpdGVkIE1lc3NhZ2UgaXMgcmV0dXJuZWQsIG90aGVyd2lzZSBUcnVlIGlzIHJldHVybmVkLlxuICAgICAqXG4gICAgICogQHBhcmFtIGNoYXRfaWQgVW5pcXVlIGlkZW50aWZpZXIgZm9yIHRoZSB0YXJnZXQgY2hhdCBvciB1c2VybmFtZSBvZiB0aGUgdGFyZ2V0IGNoYW5uZWwgKGluIHRoZSBmb3JtYXQgQGNoYW5uZWx1c2VybmFtZSlcbiAgICAgKiBAcGFyYW0gbWVzc2FnZV9pZCBJZGVudGlmaWVyIG9mIHRoZSBtZXNzYWdlIHRvIGVkaXRcbiAgICAgKiBAcGFyYW0gbGF0aXR1ZGUgTGF0aXR1ZGUgb2YgbmV3IGxvY2F0aW9uXG4gICAgICogQHBhcmFtIGxvbmdpdHVkZSBMb25naXR1ZGUgb2YgbmV3IGxvY2F0aW9uXG4gICAgICogQHBhcmFtIG90aGVyIE9wdGlvbmFsIHJlbWFpbmluZyBwYXJhbWV0ZXJzLCBjb25mZXIgdGhlIG9mZmljaWFsIHJlZmVyZW5jZSBiZWxvd1xuICAgICAqIEBwYXJhbSBzaWduYWwgT3B0aW9uYWwgYEFib3J0U2lnbmFsYCB0byBjYW5jZWwgdGhlIHJlcXVlc3RcbiAgICAgKlxuICAgICAqICoqT2ZmaWNpYWwgcmVmZXJlbmNlOioqIGh0dHBzOi8vY29yZS50ZWxlZ3JhbS5vcmcvYm90cy9hcGkjZWRpdG1lc3NhZ2VsaXZlbG9jYXRpb25cbiAgICAgKi9cbiAgICBlZGl0TWVzc2FnZUxpdmVMb2NhdGlvbihcbiAgICAgICAgY2hhdF9pZDogbnVtYmVyIHwgc3RyaW5nLFxuICAgICAgICBtZXNzYWdlX2lkOiBudW1iZXIsXG4gICAgICAgIGxhdGl0dWRlOiBudW1iZXIsXG4gICAgICAgIGxvbmdpdHVkZTogbnVtYmVyLFxuICAgICAgICBvdGhlcj86IE90aGVyPFxuICAgICAgICAgICAgUixcbiAgICAgICAgICAgIFwiZWRpdE1lc3NhZ2VMaXZlTG9jYXRpb25cIixcbiAgICAgICAgICAgIHwgXCJjaGF0X2lkXCJcbiAgICAgICAgICAgIHwgXCJtZXNzYWdlX2lkXCJcbiAgICAgICAgICAgIHwgXCJpbmxpbmVfbWVzc2FnZV9pZFwiXG4gICAgICAgICAgICB8IFwibGF0aXR1ZGVcIlxuICAgICAgICAgICAgfCBcImxvbmdpdHVkZVwiXG4gICAgICAgID4sXG4gICAgICAgIHNpZ25hbD86IEFib3J0U2lnbmFsLFxuICAgICkge1xuICAgICAgICByZXR1cm4gdGhpcy5yYXcuZWRpdE1lc3NhZ2VMaXZlTG9jYXRpb24oXG4gICAgICAgICAgICB7IGNoYXRfaWQsIG1lc3NhZ2VfaWQsIGxhdGl0dWRlLCBsb25naXR1ZGUsIC4uLm90aGVyIH0sXG4gICAgICAgICAgICBzaWduYWwsXG4gICAgICAgICk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogVXNlIHRoaXMgbWV0aG9kIHRvIGVkaXQgbGl2ZSBsb2NhdGlvbiBpbmxpbmUgbWVzc2FnZXMuIEEgbG9jYXRpb24gY2FuIGJlIGVkaXRlZCB1bnRpbCBpdHMgbGl2ZV9wZXJpb2QgZXhwaXJlcyBvciBlZGl0aW5nIGlzIGV4cGxpY2l0bHkgZGlzYWJsZWQgYnkgYSBjYWxsIHRvIHN0b3BNZXNzYWdlTGl2ZUxvY2F0aW9uLiBPbiBzdWNjZXNzLCBpZiB0aGUgZWRpdGVkIG1lc3NhZ2UgaXMgbm90IGFuIGlubGluZSBtZXNzYWdlLCB0aGUgZWRpdGVkIE1lc3NhZ2UgaXMgcmV0dXJuZWQsIG90aGVyd2lzZSBUcnVlIGlzIHJldHVybmVkLlxuICAgICAqXG4gICAgICogQHBhcmFtIGlubGluZV9tZXNzYWdlX2lkIElkZW50aWZpZXIgb2YgdGhlIGlubGluZSBtZXNzYWdlXG4gICAgICogQHBhcmFtIGxhdGl0dWRlIExhdGl0dWRlIG9mIG5ldyBsb2NhdGlvblxuICAgICAqIEBwYXJhbSBsb25naXR1ZGUgTG9uZ2l0dWRlIG9mIG5ldyBsb2NhdGlvblxuICAgICAqIEBwYXJhbSBvdGhlciBPcHRpb25hbCByZW1haW5pbmcgcGFyYW1ldGVycywgY29uZmVyIHRoZSBvZmZpY2lhbCByZWZlcmVuY2UgYmVsb3dcbiAgICAgKiBAcGFyYW0gc2lnbmFsIE9wdGlvbmFsIGBBYm9ydFNpZ25hbGAgdG8gY2FuY2VsIHRoZSByZXF1ZXN0XG4gICAgICpcbiAgICAgKiAqKk9mZmljaWFsIHJlZmVyZW5jZToqKiBodHRwczovL2NvcmUudGVsZWdyYW0ub3JnL2JvdHMvYXBpI2VkaXRtZXNzYWdlbGl2ZWxvY2F0aW9uXG4gICAgICovXG4gICAgZWRpdE1lc3NhZ2VMaXZlTG9jYXRpb25JbmxpbmUoXG4gICAgICAgIGlubGluZV9tZXNzYWdlX2lkOiBzdHJpbmcsXG4gICAgICAgIGxhdGl0dWRlOiBudW1iZXIsXG4gICAgICAgIGxvbmdpdHVkZTogbnVtYmVyLFxuICAgICAgICBvdGhlcj86IE90aGVyPFxuICAgICAgICAgICAgUixcbiAgICAgICAgICAgIFwiZWRpdE1lc3NhZ2VMaXZlTG9jYXRpb25cIixcbiAgICAgICAgICAgIHwgXCJjaGF0X2lkXCJcbiAgICAgICAgICAgIHwgXCJtZXNzYWdlX2lkXCJcbiAgICAgICAgICAgIHwgXCJpbmxpbmVfbWVzc2FnZV9pZFwiXG4gICAgICAgICAgICB8IFwibGF0aXR1ZGVcIlxuICAgICAgICAgICAgfCBcImxvbmdpdHVkZVwiXG4gICAgICAgID4sXG4gICAgICAgIHNpZ25hbD86IEFib3J0U2lnbmFsLFxuICAgICkge1xuICAgICAgICByZXR1cm4gdGhpcy5yYXcuZWRpdE1lc3NhZ2VMaXZlTG9jYXRpb24oXG4gICAgICAgICAgICB7IGlubGluZV9tZXNzYWdlX2lkLCBsYXRpdHVkZSwgbG9uZ2l0dWRlLCAuLi5vdGhlciB9LFxuICAgICAgICAgICAgc2lnbmFsLFxuICAgICAgICApO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFVzZSB0aGlzIG1ldGhvZCB0byBzdG9wIHVwZGF0aW5nIGEgbGl2ZSBsb2NhdGlvbiBtZXNzYWdlIGJlZm9yZSBsaXZlX3BlcmlvZCBleHBpcmVzLiBPbiBzdWNjZXNzLCBpZiB0aGUgbWVzc2FnZSBpcyBub3QgYW4gaW5saW5lIG1lc3NhZ2UsIHRoZSBlZGl0ZWQgTWVzc2FnZSBpcyByZXR1cm5lZCwgb3RoZXJ3aXNlIFRydWUgaXMgcmV0dXJuZWQuXG4gICAgICpcbiAgICAgKiBAcGFyYW0gY2hhdF9pZCBVbmlxdWUgaWRlbnRpZmllciBmb3IgdGhlIHRhcmdldCBjaGF0IG9yIHVzZXJuYW1lIG9mIHRoZSB0YXJnZXQgY2hhbm5lbCAoaW4gdGhlIGZvcm1hdCBAY2hhbm5lbHVzZXJuYW1lKVxuICAgICAqIEBwYXJhbSBtZXNzYWdlX2lkIElkZW50aWZpZXIgb2YgdGhlIG1lc3NhZ2Ugd2l0aCBsaXZlIGxvY2F0aW9uIHRvIHN0b3BcbiAgICAgKiBAcGFyYW0gb3RoZXIgT3B0aW9uYWwgcmVtYWluaW5nIHBhcmFtZXRlcnMsIGNvbmZlciB0aGUgb2ZmaWNpYWwgcmVmZXJlbmNlIGJlbG93XG4gICAgICogQHBhcmFtIHNpZ25hbCBPcHRpb25hbCBgQWJvcnRTaWduYWxgIHRvIGNhbmNlbCB0aGUgcmVxdWVzdFxuICAgICAqXG4gICAgICogKipPZmZpY2lhbCByZWZlcmVuY2U6KiogaHR0cHM6Ly9jb3JlLnRlbGVncmFtLm9yZy9ib3RzL2FwaSNzdG9wbWVzc2FnZWxpdmVsb2NhdGlvblxuICAgICAqL1xuICAgIHN0b3BNZXNzYWdlTGl2ZUxvY2F0aW9uKFxuICAgICAgICBjaGF0X2lkOiBudW1iZXIgfCBzdHJpbmcsXG4gICAgICAgIG1lc3NhZ2VfaWQ6IG51bWJlcixcbiAgICAgICAgb3RoZXI/OiBPdGhlcjxcbiAgICAgICAgICAgIFIsXG4gICAgICAgICAgICBcInN0b3BNZXNzYWdlTGl2ZUxvY2F0aW9uXCIsXG4gICAgICAgICAgICBcImNoYXRfaWRcIiB8IFwibWVzc2FnZV9pZFwiIHwgXCJpbmxpbmVfbWVzc2FnZV9pZFwiXG4gICAgICAgID4sXG4gICAgICAgIHNpZ25hbD86IEFib3J0U2lnbmFsLFxuICAgICkge1xuICAgICAgICByZXR1cm4gdGhpcy5yYXcuc3RvcE1lc3NhZ2VMaXZlTG9jYXRpb24oXG4gICAgICAgICAgICB7IGNoYXRfaWQsIG1lc3NhZ2VfaWQsIC4uLm90aGVyIH0sXG4gICAgICAgICAgICBzaWduYWwsXG4gICAgICAgICk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogVXNlIHRoaXMgbWV0aG9kIHRvIHN0b3AgdXBkYXRpbmcgYSBsaXZlIGxvY2F0aW9uIG1lc3NhZ2UgYmVmb3JlIGxpdmVfcGVyaW9kIGV4cGlyZXMuIE9uIHN1Y2Nlc3MsIGlmIHRoZSBtZXNzYWdlIGlzIG5vdCBhbiBpbmxpbmUgbWVzc2FnZSwgdGhlIGVkaXRlZCBNZXNzYWdlIGlzIHJldHVybmVkLCBvdGhlcndpc2UgVHJ1ZSBpcyByZXR1cm5lZC5cbiAgICAgKlxuICAgICAqIEBwYXJhbSBpbmxpbmVfbWVzc2FnZV9pZCBJZGVudGlmaWVyIG9mIHRoZSBpbmxpbmUgbWVzc2FnZVxuICAgICAqIEBwYXJhbSBvdGhlciBPcHRpb25hbCByZW1haW5pbmcgcGFyYW1ldGVycywgY29uZmVyIHRoZSBvZmZpY2lhbCByZWZlcmVuY2UgYmVsb3dcbiAgICAgKiBAcGFyYW0gc2lnbmFsIE9wdGlvbmFsIGBBYm9ydFNpZ25hbGAgdG8gY2FuY2VsIHRoZSByZXF1ZXN0XG4gICAgICpcbiAgICAgKiAqKk9mZmljaWFsIHJlZmVyZW5jZToqKiBodHRwczovL2NvcmUudGVsZWdyYW0ub3JnL2JvdHMvYXBpI3N0b3BtZXNzYWdlbGl2ZWxvY2F0aW9uXG4gICAgICovXG4gICAgc3RvcE1lc3NhZ2VMaXZlTG9jYXRpb25JbmxpbmUoXG4gICAgICAgIGlubGluZV9tZXNzYWdlX2lkOiBzdHJpbmcsXG4gICAgICAgIG90aGVyPzogT3RoZXI8XG4gICAgICAgICAgICBSLFxuICAgICAgICAgICAgXCJzdG9wTWVzc2FnZUxpdmVMb2NhdGlvblwiLFxuICAgICAgICAgICAgXCJjaGF0X2lkXCIgfCBcIm1lc3NhZ2VfaWRcIiB8IFwiaW5saW5lX21lc3NhZ2VfaWRcIlxuICAgICAgICA+LFxuICAgICAgICBzaWduYWw/OiBBYm9ydFNpZ25hbCxcbiAgICApIHtcbiAgICAgICAgcmV0dXJuIHRoaXMucmF3LnN0b3BNZXNzYWdlTGl2ZUxvY2F0aW9uKFxuICAgICAgICAgICAgeyBpbmxpbmVfbWVzc2FnZV9pZCwgLi4ub3RoZXIgfSxcbiAgICAgICAgICAgIHNpZ25hbCxcbiAgICAgICAgKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBVc2UgdGhpcyBtZXRob2QgdG8gc2VuZCBwYWlkIG1lZGlhIHRvIGNoYW5uZWwgY2hhdHMuIE9uIHN1Y2Nlc3MsIHRoZSBzZW50IE1lc3NhZ2UgaXMgcmV0dXJuZWQuXG4gICAgICpcbiAgICAgKiBAcGFyYW0gY2hhdF9pZCBVbmlxdWUgaWRlbnRpZmllciBmb3IgdGhlIHRhcmdldCBjaGF0IG9yIHVzZXJuYW1lIG9mIHRoZSB0YXJnZXQgY2hhbm5lbCAoaW4gdGhlIGZvcm1hdCBAY2hhbm5lbHVzZXJuYW1lKVxuICAgICAqIEBwYXJhbSBzdGFyX2NvdW50IFRoZSBudW1iZXIgb2YgVGVsZWdyYW0gU3RhcnMgdGhhdCBtdXN0IGJlIHBhaWQgdG8gYnV5IGFjY2VzcyB0byB0aGUgbWVkaWFcbiAgICAgKiBAcGFyYW0gbWVkaWEgQW4gYXJyYXkgZGVzY3JpYmluZyB0aGUgbWVkaWEgdG8gYmUgc2VudDsgdXAgdG8gMTAgaXRlbXNcbiAgICAgKiBAcGFyYW0gb3RoZXIgT3B0aW9uYWwgcmVtYWluaW5nIHBhcmFtZXRlcnMsIGNvbmZlciB0aGUgb2ZmaWNpYWwgcmVmZXJlbmNlIGJlbG93XG4gICAgICogQHBhcmFtIHNpZ25hbCBPcHRpb25hbCBgQWJvcnRTaWduYWxgIHRvIGNhbmNlbCB0aGUgcmVxdWVzdFxuICAgICAqXG4gICAgICogKipPZmZpY2lhbCByZWZlcmVuY2U6KiogaHR0cHM6Ly9jb3JlLnRlbGVncmFtLm9yZy9ib3RzL2FwaSNzZW5kcGFpZG1lZGlhXG4gICAgICovXG4gICAgc2VuZFBhaWRNZWRpYShcbiAgICAgICAgY2hhdF9pZDogbnVtYmVyIHwgc3RyaW5nLFxuICAgICAgICBzdGFyX2NvdW50OiBudW1iZXIsXG4gICAgICAgIG1lZGlhOiBJbnB1dFBhaWRNZWRpYVtdLFxuICAgICAgICBvdGhlcj86IE90aGVyPFIsIFwic2VuZFBhaWRNZWRpYVwiLCBcImNoYXRfaWRcIiB8IFwic3Rhcl9jb3VudFwiIHwgXCJtZWRpYVwiPixcbiAgICAgICAgc2lnbmFsPzogQWJvcnRTaWduYWwsXG4gICAgKSB7XG4gICAgICAgIHJldHVybiB0aGlzLnJhdy5zZW5kUGFpZE1lZGlhKFxuICAgICAgICAgICAgeyBjaGF0X2lkLCBzdGFyX2NvdW50LCBtZWRpYSwgLi4ub3RoZXIgfSxcbiAgICAgICAgICAgIHNpZ25hbCxcbiAgICAgICAgKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBVc2UgdGhpcyBtZXRob2QgdG8gc2VuZCBpbmZvcm1hdGlvbiBhYm91dCBhIHZlbnVlLiBPbiBzdWNjZXNzLCB0aGUgc2VudCBNZXNzYWdlIGlzIHJldHVybmVkLlxuICAgICAqXG4gICAgICogQHBhcmFtIGNoYXRfaWQgVW5pcXVlIGlkZW50aWZpZXIgZm9yIHRoZSB0YXJnZXQgY2hhdCBvciB1c2VybmFtZSBvZiB0aGUgdGFyZ2V0IGNoYW5uZWwgKGluIHRoZSBmb3JtYXQgQGNoYW5uZWx1c2VybmFtZSlcbiAgICAgKiBAcGFyYW0gbGF0aXR1ZGUgTGF0aXR1ZGUgb2YgdGhlIHZlbnVlXG4gICAgICogQHBhcmFtIGxvbmdpdHVkZSBMb25naXR1ZGUgb2YgdGhlIHZlbnVlXG4gICAgICogQHBhcmFtIHRpdGxlIE5hbWUgb2YgdGhlIHZlbnVlXG4gICAgICogQHBhcmFtIGFkZHJlc3MgQWRkcmVzcyBvZiB0aGUgdmVudWVcbiAgICAgKiBAcGFyYW0gb3RoZXIgT3B0aW9uYWwgcmVtYWluaW5nIHBhcmFtZXRlcnMsIGNvbmZlciB0aGUgb2ZmaWNpYWwgcmVmZXJlbmNlIGJlbG93XG4gICAgICogQHBhcmFtIHNpZ25hbCBPcHRpb25hbCBgQWJvcnRTaWduYWxgIHRvIGNhbmNlbCB0aGUgcmVxdWVzdFxuICAgICAqXG4gICAgICogKipPZmZpY2lhbCByZWZlcmVuY2U6KiogaHR0cHM6Ly9jb3JlLnRlbGVncmFtLm9yZy9ib3RzL2FwaSNzZW5kdmVudWVcbiAgICAgKi9cbiAgICBzZW5kVmVudWUoXG4gICAgICAgIGNoYXRfaWQ6IG51bWJlciB8IHN0cmluZyxcbiAgICAgICAgbGF0aXR1ZGU6IG51bWJlcixcbiAgICAgICAgbG9uZ2l0dWRlOiBudW1iZXIsXG4gICAgICAgIHRpdGxlOiBzdHJpbmcsXG4gICAgICAgIGFkZHJlc3M6IHN0cmluZyxcbiAgICAgICAgb3RoZXI/OiBPdGhlcjxcbiAgICAgICAgICAgIFIsXG4gICAgICAgICAgICBcInNlbmRWZW51ZVwiLFxuICAgICAgICAgICAgXCJjaGF0X2lkXCIgfCBcImxhdGl0dWRlXCIgfCBcImxvbmdpdHVkZVwiIHwgXCJ0aXRsZVwiIHwgXCJhZGRyZXNzXCJcbiAgICAgICAgPixcbiAgICAgICAgc2lnbmFsPzogQWJvcnRTaWduYWwsXG4gICAgKSB7XG4gICAgICAgIHJldHVybiB0aGlzLnJhdy5zZW5kVmVudWUoXG4gICAgICAgICAgICB7IGNoYXRfaWQsIGxhdGl0dWRlLCBsb25naXR1ZGUsIHRpdGxlLCBhZGRyZXNzLCAuLi5vdGhlciB9LFxuICAgICAgICAgICAgc2lnbmFsLFxuICAgICAgICApO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFVzZSB0aGlzIG1ldGhvZCB0byBzZW5kIHBob25lIGNvbnRhY3RzLiBPbiBzdWNjZXNzLCB0aGUgc2VudCBNZXNzYWdlIGlzIHJldHVybmVkLlxuICAgICAqXG4gICAgICogQHBhcmFtIGNoYXRfaWQgVW5pcXVlIGlkZW50aWZpZXIgZm9yIHRoZSB0YXJnZXQgY2hhdCBvciB1c2VybmFtZSBvZiB0aGUgdGFyZ2V0IGNoYW5uZWwgKGluIHRoZSBmb3JtYXQgQGNoYW5uZWx1c2VybmFtZSlcbiAgICAgKiBAcGFyYW0gcGhvbmVfbnVtYmVyIENvbnRhY3QncyBwaG9uZSBudW1iZXJcbiAgICAgKiBAcGFyYW0gZmlyc3RfbmFtZSBDb250YWN0J3MgZmlyc3QgbmFtZVxuICAgICAqIEBwYXJhbSBvdGhlciBPcHRpb25hbCByZW1haW5pbmcgcGFyYW1ldGVycywgY29uZmVyIHRoZSBvZmZpY2lhbCByZWZlcmVuY2UgYmVsb3dcbiAgICAgKiBAcGFyYW0gc2lnbmFsIE9wdGlvbmFsIGBBYm9ydFNpZ25hbGAgdG8gY2FuY2VsIHRoZSByZXF1ZXN0XG4gICAgICpcbiAgICAgKiAqKk9mZmljaWFsIHJlZmVyZW5jZToqKiBodHRwczovL2NvcmUudGVsZWdyYW0ub3JnL2JvdHMvYXBpI3NlbmRjb250YWN0XG4gICAgICovXG4gICAgc2VuZENvbnRhY3QoXG4gICAgICAgIGNoYXRfaWQ6IG51bWJlciB8IHN0cmluZyxcbiAgICAgICAgcGhvbmVfbnVtYmVyOiBzdHJpbmcsXG4gICAgICAgIGZpcnN0X25hbWU6IHN0cmluZyxcbiAgICAgICAgb3RoZXI/OiBPdGhlcjxcbiAgICAgICAgICAgIFIsXG4gICAgICAgICAgICBcInNlbmRDb250YWN0XCIsXG4gICAgICAgICAgICBcImNoYXRfaWRcIiB8IFwicGhvbmVfbnVtYmVyXCIgfCBcImZpcnN0X25hbWVcIlxuICAgICAgICA+LFxuICAgICAgICBzaWduYWw/OiBBYm9ydFNpZ25hbCxcbiAgICApIHtcbiAgICAgICAgcmV0dXJuIHRoaXMucmF3LnNlbmRDb250YWN0KFxuICAgICAgICAgICAgeyBjaGF0X2lkLCBwaG9uZV9udW1iZXIsIGZpcnN0X25hbWUsIC4uLm90aGVyIH0sXG4gICAgICAgICAgICBzaWduYWwsXG4gICAgICAgICk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogVXNlIHRoaXMgbWV0aG9kIHRvIHNlbmQgYSBuYXRpdmUgcG9sbC4gT24gc3VjY2VzcywgdGhlIHNlbnQgTWVzc2FnZSBpcyByZXR1cm5lZC5cbiAgICAgKlxuICAgICAqIEBwYXJhbSBjaGF0X2lkIFVuaXF1ZSBpZGVudGlmaWVyIGZvciB0aGUgdGFyZ2V0IGNoYXQgb3IgdXNlcm5hbWUgb2YgdGhlIHRhcmdldCBjaGFubmVsIChpbiB0aGUgZm9ybWF0IEBjaGFubmVsdXNlcm5hbWUpXG4gICAgICogQHBhcmFtIHF1ZXN0aW9uIFBvbGwgcXVlc3Rpb24sIDEtMzAwIGNoYXJhY3RlcnNcbiAgICAgKiBAcGFyYW0gb3B0aW9ucyBBIGxpc3Qgb2YgYW5zd2VyIG9wdGlvbnMsIDItMTAgc3RyaW5ncyAxLTEwMCBjaGFyYWN0ZXJzIGVhY2hcbiAgICAgKiBAcGFyYW0gb3RoZXIgT3B0aW9uYWwgcmVtYWluaW5nIHBhcmFtZXRlcnMsIGNvbmZlciB0aGUgb2ZmaWNpYWwgcmVmZXJlbmNlIGJlbG93XG4gICAgICogQHBhcmFtIHNpZ25hbCBPcHRpb25hbCBgQWJvcnRTaWduYWxgIHRvIGNhbmNlbCB0aGUgcmVxdWVzdFxuICAgICAqXG4gICAgICogKipPZmZpY2lhbCByZWZlcmVuY2U6KiogaHR0cHM6Ly9jb3JlLnRlbGVncmFtLm9yZy9ib3RzL2FwaSNzZW5kcG9sbFxuICAgICAqL1xuICAgIHNlbmRQb2xsKFxuICAgICAgICBjaGF0X2lkOiBudW1iZXIgfCBzdHJpbmcsXG4gICAgICAgIHF1ZXN0aW9uOiBzdHJpbmcsXG4gICAgICAgIG9wdGlvbnM6IElucHV0UG9sbE9wdGlvbltdLFxuICAgICAgICBvdGhlcj86IE90aGVyPFIsIFwic2VuZFBvbGxcIiwgXCJjaGF0X2lkXCIgfCBcInF1ZXN0aW9uXCIgfCBcIm9wdGlvbnNcIj4sXG4gICAgICAgIHNpZ25hbD86IEFib3J0U2lnbmFsLFxuICAgICkge1xuICAgICAgICByZXR1cm4gdGhpcy5yYXcuc2VuZFBvbGwoXG4gICAgICAgICAgICB7IGNoYXRfaWQsIHF1ZXN0aW9uLCBvcHRpb25zLCAuLi5vdGhlciB9LFxuICAgICAgICAgICAgc2lnbmFsLFxuICAgICAgICApO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFVzZSB0aGlzIG1ldGhvZCB0byBzZW5kIGFuIGFuaW1hdGVkIGVtb2ppIHRoYXQgd2lsbCBkaXNwbGF5IGEgcmFuZG9tIHZhbHVlLiBPbiBzdWNjZXNzLCB0aGUgc2VudCBNZXNzYWdlIGlzIHJldHVybmVkLlxuICAgICAqXG4gICAgICogQHBhcmFtIGNoYXRfaWQgVW5pcXVlIGlkZW50aWZpZXIgZm9yIHRoZSB0YXJnZXQgY2hhdCBvciB1c2VybmFtZSBvZiB0aGUgdGFyZ2V0IGNoYW5uZWwgKGluIHRoZSBmb3JtYXQgQGNoYW5uZWx1c2VybmFtZSlcbiAgICAgKiBAcGFyYW0gZW1vamkgRW1vamkgb24gd2hpY2ggdGhlIGRpY2UgdGhyb3cgYW5pbWF0aW9uIGlzIGJhc2VkLiBDdXJyZW50bHksIG11c3QgYmUgb25lIG9mIOKAnPCfjrLigJ0sIOKAnPCfjq/igJ0sIOKAnPCfj4DigJ0sIOKAnOKaveKAnSwgb3Ig4oCc8J+OsOKAnS4gRGljZSBjYW4gaGF2ZSB2YWx1ZXMgMS02IGZvciDigJzwn46y4oCdIGFuZCDigJzwn46v4oCdLCB2YWx1ZXMgMS01IGZvciDigJzwn4+A4oCdIGFuZCDigJzimr3igJ0sIGFuZCB2YWx1ZXMgMS02NCBmb3Ig4oCc8J+OsOKAnS4gRGVmYXVsdHMgdG8g4oCc8J+OsuKAnVxuICAgICAqIEBwYXJhbSBvdGhlciBPcHRpb25hbCByZW1haW5pbmcgcGFyYW1ldGVycywgY29uZmVyIHRoZSBvZmZpY2lhbCByZWZlcmVuY2UgYmVsb3dcbiAgICAgKiBAcGFyYW0gc2lnbmFsIE9wdGlvbmFsIGBBYm9ydFNpZ25hbGAgdG8gY2FuY2VsIHRoZSByZXF1ZXN0XG4gICAgICpcbiAgICAgKiAqKk9mZmljaWFsIHJlZmVyZW5jZToqKiBodHRwczovL2NvcmUudGVsZWdyYW0ub3JnL2JvdHMvYXBpI3NlbmRkaWNlXG4gICAgICovXG4gICAgc2VuZERpY2UoXG4gICAgICAgIGNoYXRfaWQ6IG51bWJlciB8IHN0cmluZyxcbiAgICAgICAgZW1vamk6IHN0cmluZyxcbiAgICAgICAgb3RoZXI/OiBPdGhlcjxSLCBcInNlbmREaWNlXCIsIFwiY2hhdF9pZFwiIHwgXCJlbW9qaVwiPixcbiAgICAgICAgc2lnbmFsPzogQWJvcnRTaWduYWwsXG4gICAgKSB7XG4gICAgICAgIHJldHVybiB0aGlzLnJhdy5zZW5kRGljZSh7IGNoYXRfaWQsIGVtb2ppLCAuLi5vdGhlciB9LCBzaWduYWwpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFVzZSB0aGlzIG1ldGhvZCB0byBjaGFuZ2UgdGhlIGNob3NlbiByZWFjdGlvbnMgb24gYSBtZXNzYWdlLiBTZXJ2aWNlIG1lc3NhZ2VzIGNhbid0IGJlIHJlYWN0ZWQgdG8uIEF1dG9tYXRpY2FsbHkgZm9yd2FyZGVkIG1lc3NhZ2VzIGZyb20gYSBjaGFubmVsIHRvIGl0cyBkaXNjdXNzaW9uIGdyb3VwIGhhdmUgdGhlIHNhbWUgYXZhaWxhYmxlIHJlYWN0aW9ucyBhcyBtZXNzYWdlcyBpbiB0aGUgY2hhbm5lbC4gSW4gYWxidW1zLCBib3RzIG11c3QgcmVhY3QgdG8gdGhlIGZpcnN0IG1lc3NhZ2UuIFJldHVybnMgVHJ1ZSBvbiBzdWNjZXNzLlxuICAgICAqXG4gICAgICogQHBhcmFtIGNoYXRfaWQgVW5pcXVlIGlkZW50aWZpZXIgZm9yIHRoZSB0YXJnZXQgY2hhdCBvciB1c2VybmFtZSBvZiB0aGUgdGFyZ2V0IGNoYW5uZWwgKGluIHRoZSBmb3JtYXQgQGNoYW5uZWx1c2VybmFtZSlcbiAgICAgKiBAcGFyYW0gbWVzc2FnZV9pZCBJZGVudGlmaWVyIG9mIHRoZSB0YXJnZXQgbWVzc2FnZVxuICAgICAqIEBwYXJhbSByZWFjdGlvbiBBIGxpc3Qgb2YgcmVhY3Rpb24gdHlwZXMgdG8gc2V0IG9uIHRoZSBtZXNzYWdlLiBDdXJyZW50bHksIGFzIG5vbi1wcmVtaXVtIHVzZXJzLCBib3RzIGNhbiBzZXQgdXAgdG8gb25lIHJlYWN0aW9uIHBlciBtZXNzYWdlLiBBIGN1c3RvbSBlbW9qaSByZWFjdGlvbiBjYW4gYmUgdXNlZCBpZiBpdCBpcyBlaXRoZXIgYWxyZWFkeSBwcmVzZW50IG9uIHRoZSBtZXNzYWdlIG9yIGV4cGxpY2l0bHkgYWxsb3dlZCBieSBjaGF0IGFkbWluaXN0cmF0b3JzLlxuICAgICAqIEBwYXJhbSBvdGhlciBPcHRpb25hbCByZW1haW5pbmcgcGFyYW1ldGVycywgY29uZmVyIHRoZSBvZmZpY2lhbCByZWZlcmVuY2UgYmVsb3dcbiAgICAgKiBAcGFyYW0gc2lnbmFsIE9wdGlvbmFsIGBBYm9ydFNpZ25hbGAgdG8gY2FuY2VsIHRoZSByZXF1ZXN0XG4gICAgICpcbiAgICAgKiAqKk9mZmljaWFsIHJlZmVyZW5jZToqKiBodHRwczovL2NvcmUudGVsZWdyYW0ub3JnL2JvdHMvYXBpI3NlbmRkaWNlXG4gICAgICovXG4gICAgc2V0TWVzc2FnZVJlYWN0aW9uKFxuICAgICAgICBjaGF0X2lkOiBudW1iZXIgfCBzdHJpbmcsXG4gICAgICAgIG1lc3NhZ2VfaWQ6IG51bWJlcixcbiAgICAgICAgcmVhY3Rpb246IFJlYWN0aW9uVHlwZVtdLFxuICAgICAgICBvdGhlcj86IE90aGVyPFxuICAgICAgICAgICAgUixcbiAgICAgICAgICAgIFwic2V0TWVzc2FnZVJlYWN0aW9uXCIsXG4gICAgICAgICAgICBcImNoYXRfaWRcIiB8IFwibWVzc2FnZV9pZFwiIHwgXCJyZWFjdGlvblwiXG4gICAgICAgID4sXG4gICAgICAgIHNpZ25hbD86IEFib3J0U2lnbmFsLFxuICAgICkge1xuICAgICAgICByZXR1cm4gdGhpcy5yYXcuc2V0TWVzc2FnZVJlYWN0aW9uKHtcbiAgICAgICAgICAgIGNoYXRfaWQsXG4gICAgICAgICAgICBtZXNzYWdlX2lkLFxuICAgICAgICAgICAgcmVhY3Rpb24sXG4gICAgICAgICAgICAuLi5vdGhlcixcbiAgICAgICAgfSwgc2lnbmFsKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBVc2UgdGhpcyBtZXRob2Qgd2hlbiB5b3UgbmVlZCB0byB0ZWxsIHRoZSB1c2VyIHRoYXQgc29tZXRoaW5nIGlzIGhhcHBlbmluZyBvbiB0aGUgYm90J3Mgc2lkZS4gVGhlIHN0YXR1cyBpcyBzZXQgZm9yIDUgc2Vjb25kcyBvciBsZXNzICh3aGVuIGEgbWVzc2FnZSBhcnJpdmVzIGZyb20geW91ciBib3QsIFRlbGVncmFtIGNsaWVudHMgY2xlYXIgaXRzIHR5cGluZyBzdGF0dXMpLiBSZXR1cm5zIFRydWUgb24gc3VjY2Vzcy5cbiAgICAgKlxuICAgICAqIEV4YW1wbGU6IFRoZSBJbWFnZUJvdCBuZWVkcyBzb21lIHRpbWUgdG8gcHJvY2VzcyBhIHJlcXVlc3QgYW5kIHVwbG9hZCB0aGUgaW1hZ2UuIEluc3RlYWQgb2Ygc2VuZGluZyBhIHRleHQgbWVzc2FnZSBhbG9uZyB0aGUgbGluZXMgb2Yg4oCcUmV0cmlldmluZyBpbWFnZSwgcGxlYXNlIHdhaXTigKbigJ0sIHRoZSBib3QgbWF5IHVzZSBzZW5kQ2hhdEFjdGlvbiB3aXRoIGFjdGlvbiA9IHVwbG9hZF9waG90by4gVGhlIHVzZXIgd2lsbCBzZWUgYSDigJxzZW5kaW5nIHBob3Rv4oCdIHN0YXR1cyBmb3IgdGhlIGJvdC5cbiAgICAgKlxuICAgICAqIFdlIG9ubHkgcmVjb21tZW5kIHVzaW5nIHRoaXMgbWV0aG9kIHdoZW4gYSByZXNwb25zZSBmcm9tIHRoZSBib3Qgd2lsbCB0YWtlIGEgbm90aWNlYWJsZSBhbW91bnQgb2YgdGltZSB0byBhcnJpdmUuXG4gICAgICpcbiAgICAgKiBAcGFyYW0gY2hhdF9pZCBVbmlxdWUgaWRlbnRpZmllciBmb3IgdGhlIHRhcmdldCBjaGF0IG9yIHVzZXJuYW1lIG9mIHRoZSB0YXJnZXQgY2hhbm5lbCAoaW4gdGhlIGZvcm1hdCBAY2hhbm5lbHVzZXJuYW1lKVxuICAgICAqIEBwYXJhbSBhY3Rpb24gVHlwZSBvZiBhY3Rpb24gdG8gYnJvYWRjYXN0LiBDaG9vc2Ugb25lLCBkZXBlbmRpbmcgb24gd2hhdCB0aGUgdXNlciBpcyBhYm91dCB0byByZWNlaXZlOiB0eXBpbmcgZm9yIHRleHQgbWVzc2FnZXMsIHVwbG9hZF9waG90byBmb3IgcGhvdG9zLCByZWNvcmRfdmlkZW8gb3IgdXBsb2FkX3ZpZGVvIGZvciB2aWRlb3MsIHJlY29yZF92b2ljZSBvciB1cGxvYWRfdm9pY2UgZm9yIHZvaWNlIG5vdGVzLCB1cGxvYWRfZG9jdW1lbnQgZm9yIGdlbmVyYWwgZmlsZXMsIGNob29zZV9zdGlja2VyIGZvciBzdGlja2VycywgZmluZF9sb2NhdGlvbiBmb3IgbG9jYXRpb24gZGF0YSwgcmVjb3JkX3ZpZGVvX25vdGUgb3IgdXBsb2FkX3ZpZGVvX25vdGUgZm9yIHZpZGVvIG5vdGVzLlxuICAgICAqIEBwYXJhbSBvdGhlciBPcHRpb25hbCByZW1haW5pbmcgcGFyYW1ldGVycywgY29uZmVyIHRoZSBvZmZpY2lhbCByZWZlcmVuY2UgYmVsb3dcbiAgICAgKiBAcGFyYW0gc2lnbmFsIE9wdGlvbmFsIGBBYm9ydFNpZ25hbGAgdG8gY2FuY2VsIHRoZSByZXF1ZXN0XG4gICAgICpcbiAgICAgKiAqKk9mZmljaWFsIHJlZmVyZW5jZToqKiBodHRwczovL2NvcmUudGVsZWdyYW0ub3JnL2JvdHMvYXBpI3NlbmRjaGF0YWN0aW9uXG4gICAgICovXG4gICAgc2VuZENoYXRBY3Rpb24oXG4gICAgICAgIGNoYXRfaWQ6IG51bWJlciB8IHN0cmluZyxcbiAgICAgICAgYWN0aW9uOlxuICAgICAgICAgICAgfCBcInR5cGluZ1wiXG4gICAgICAgICAgICB8IFwidXBsb2FkX3Bob3RvXCJcbiAgICAgICAgICAgIHwgXCJyZWNvcmRfdmlkZW9cIlxuICAgICAgICAgICAgfCBcInVwbG9hZF92aWRlb1wiXG4gICAgICAgICAgICB8IFwicmVjb3JkX3ZvaWNlXCJcbiAgICAgICAgICAgIHwgXCJ1cGxvYWRfdm9pY2VcIlxuICAgICAgICAgICAgfCBcInVwbG9hZF9kb2N1bWVudFwiXG4gICAgICAgICAgICB8IFwiY2hvb3NlX3N0aWNrZXJcIlxuICAgICAgICAgICAgfCBcImZpbmRfbG9jYXRpb25cIlxuICAgICAgICAgICAgfCBcInJlY29yZF92aWRlb19ub3RlXCJcbiAgICAgICAgICAgIHwgXCJ1cGxvYWRfdmlkZW9fbm90ZVwiLFxuICAgICAgICBvdGhlcj86IE90aGVyPFIsIFwic2VuZENoYXRBY3Rpb25cIiwgXCJjaGF0X2lkXCIgfCBcImFjdGlvblwiPixcbiAgICAgICAgc2lnbmFsPzogQWJvcnRTaWduYWwsXG4gICAgKSB7XG4gICAgICAgIHJldHVybiB0aGlzLnJhdy5zZW5kQ2hhdEFjdGlvbih7IGNoYXRfaWQsIGFjdGlvbiwgLi4ub3RoZXIgfSwgc2lnbmFsKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBVc2UgdGhpcyBtZXRob2QgdG8gZ2V0IGEgbGlzdCBvZiBwcm9maWxlIHBpY3R1cmVzIGZvciBhIHVzZXIuIFJldHVybnMgYSBVc2VyUHJvZmlsZVBob3RvcyBvYmplY3QuXG4gICAgICpcbiAgICAgKiBAcGFyYW0gdXNlcl9pZCBVbmlxdWUgaWRlbnRpZmllciBvZiB0aGUgdGFyZ2V0IHVzZXJcbiAgICAgKiBAcGFyYW0gb3RoZXIgT3B0aW9uYWwgcmVtYWluaW5nIHBhcmFtZXRlcnMsIGNvbmZlciB0aGUgb2ZmaWNpYWwgcmVmZXJlbmNlIGJlbG93XG4gICAgICogQHBhcmFtIHNpZ25hbCBPcHRpb25hbCBgQWJvcnRTaWduYWxgIHRvIGNhbmNlbCB0aGUgcmVxdWVzdFxuICAgICAqXG4gICAgICogKipPZmZpY2lhbCByZWZlcmVuY2U6KiogaHR0cHM6Ly9jb3JlLnRlbGVncmFtLm9yZy9ib3RzL2FwaSNnZXR1c2VycHJvZmlsZXBob3Rvc1xuICAgICAqL1xuICAgIGdldFVzZXJQcm9maWxlUGhvdG9zKFxuICAgICAgICB1c2VyX2lkOiBudW1iZXIsXG4gICAgICAgIG90aGVyPzogT3RoZXI8UiwgXCJnZXRVc2VyUHJvZmlsZVBob3Rvc1wiLCBcInVzZXJfaWRcIj4sXG4gICAgICAgIHNpZ25hbD86IEFib3J0U2lnbmFsLFxuICAgICkge1xuICAgICAgICByZXR1cm4gdGhpcy5yYXcuZ2V0VXNlclByb2ZpbGVQaG90b3MoeyB1c2VyX2lkLCAuLi5vdGhlciB9LCBzaWduYWwpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFVzZSB0aGlzIG1ldGhvZCB0byBnZXQgdGhlIGxpc3Qgb2YgYm9vc3RzIGFkZGVkIHRvIGEgY2hhdCBieSBhIHVzZXIuIFJlcXVpcmVzIGFkbWluaXN0cmF0b3IgcmlnaHRzIGluIHRoZSBjaGF0LiBSZXR1cm5zIGEgVXNlckNoYXRCb29zdHMgb2JqZWN0LlxuICAgICAqXG4gICAgICogQHBhcmFtIGNoYXRfaWQgVW5pcXVlIGlkZW50aWZpZXIgZm9yIHRoZSBjaGF0IG9yIHVzZXJuYW1lIG9mIHRoZSBjaGFubmVsIChpbiB0aGUgZm9ybWF0IEBjaGFubmVsdXNlcm5hbWUpXG4gICAgICogQHBhcmFtIHVzZXJfaWQgVW5pcXVlIGlkZW50aWZpZXIgb2YgdGhlIHRhcmdldCB1c2VyXG4gICAgICogQHBhcmFtIHNpZ25hbCBPcHRpb25hbCBgQWJvcnRTaWduYWxgIHRvIGNhbmNlbCB0aGUgcmVxdWVzdFxuICAgICAqXG4gICAgICogKipPZmZpY2lhbCByZWZlcmVuY2U6KiogaHR0cHM6Ly9jb3JlLnRlbGVncmFtLm9yZy9ib3RzL2FwaSNnZXR1c2VyY2hhdGJvb3N0c1xuICAgICAqL1xuICAgIGdldFVzZXJDaGF0Qm9vc3RzKFxuICAgICAgICBjaGF0X2lkOiBudW1iZXIgfCBzdHJpbmcsXG4gICAgICAgIHVzZXJfaWQ6IG51bWJlcixcbiAgICAgICAgc2lnbmFsPzogQWJvcnRTaWduYWwsXG4gICAgKSB7XG4gICAgICAgIHJldHVybiB0aGlzLnJhdy5nZXRVc2VyQ2hhdEJvb3N0cyh7IGNoYXRfaWQsIHVzZXJfaWQgfSwgc2lnbmFsKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBVc2UgdGhpcyBtZXRob2QgdG8gZ2V0IGluZm9ybWF0aW9uIGFib3V0IHRoZSBjb25uZWN0aW9uIG9mIHRoZSBib3Qgd2l0aCBhIGJ1c2luZXNzIGFjY291bnQuIFJldHVybnMgYSBCdXNpbmVzc0Nvbm5lY3Rpb24gb2JqZWN0IG9uIHN1Y2Nlc3MuXG4gICAgICpcbiAgICAgKiBAcGFyYW0gYnVzaW5lc3NfY29ubmVjdGlvbl9pZCBVbmlxdWUgaWRlbnRpZmllciBvZiB0aGUgYnVzaW5lc3MgY29ubmVjdGlvblxuICAgICAqIEBwYXJhbSBzaWduYWwgT3B0aW9uYWwgYEFib3J0U2lnbmFsYCB0byBjYW5jZWwgdGhlIHJlcXVlc3RcbiAgICAgKlxuICAgICAqICoqT2ZmaWNpYWwgcmVmZXJlbmNlOioqIGh0dHBzOi8vY29yZS50ZWxlZ3JhbS5vcmcvYm90cy9hcGkjZ2V0YnVzaW5lc3Njb25uZWN0aW9uXG4gICAgICovXG4gICAgZ2V0QnVzaW5lc3NDb25uZWN0aW9uKFxuICAgICAgICBidXNpbmVzc19jb25uZWN0aW9uX2lkOiBzdHJpbmcsXG4gICAgICAgIHNpZ25hbD86IEFib3J0U2lnbmFsLFxuICAgICkge1xuICAgICAgICByZXR1cm4gdGhpcy5yYXcuZ2V0QnVzaW5lc3NDb25uZWN0aW9uKFxuICAgICAgICAgICAgeyBidXNpbmVzc19jb25uZWN0aW9uX2lkIH0sXG4gICAgICAgICAgICBzaWduYWwsXG4gICAgICAgICk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogVXNlIHRoaXMgbWV0aG9kIHRvIGdldCBiYXNpYyBpbmZvIGFib3V0IGEgZmlsZSBhbmQgcHJlcGFyZSBpdCBmb3IgZG93bmxvYWRpbmcuIEZvciB0aGUgbW9tZW50LCBib3RzIGNhbiBkb3dubG9hZCBmaWxlcyBvZiB1cCB0byAyME1CIGluIHNpemUuIE9uIHN1Y2Nlc3MsIGEgRmlsZSBvYmplY3QgaXMgcmV0dXJuZWQuIFRoZSBmaWxlIGNhbiB0aGVuIGJlIGRvd25sb2FkZWQgdmlhIHRoZSBsaW5rIGBodHRwczovL2FwaS50ZWxlZ3JhbS5vcmcvZmlsZS9ib3Q8dG9rZW4+LzxmaWxlX3BhdGg+YCwgd2hlcmUgYDxmaWxlX3BhdGg+YCBpcyB0YWtlbiBmcm9tIHRoZSByZXNwb25zZS4gSXQgaXMgZ3VhcmFudGVlZCB0aGF0IHRoZSBsaW5rIHdpbGwgYmUgdmFsaWQgZm9yIGF0IGxlYXN0IDEgaG91ci4gV2hlbiB0aGUgbGluayBleHBpcmVzLCBhIG5ldyBvbmUgY2FuIGJlIHJlcXVlc3RlZCBieSBjYWxsaW5nIGdldEZpbGUgYWdhaW4uXG4gICAgICpcbiAgICAgKiBOb3RlOiBUaGlzIGZ1bmN0aW9uIG1heSBub3QgcHJlc2VydmUgdGhlIG9yaWdpbmFsIGZpbGUgbmFtZSBhbmQgTUlNRSB0eXBlLiBZb3Ugc2hvdWxkIHNhdmUgdGhlIGZpbGUncyBNSU1FIHR5cGUgYW5kIG5hbWUgKGlmIGF2YWlsYWJsZSkgd2hlbiB0aGUgRmlsZSBvYmplY3QgaXMgcmVjZWl2ZWQuXG4gICAgICpcbiAgICAgKiBAcGFyYW0gZmlsZV9pZCBGaWxlIGlkZW50aWZpZXIgdG8gZ2V0IGluZm8gYWJvdXRcbiAgICAgKiBAcGFyYW0gc2lnbmFsIE9wdGlvbmFsIGBBYm9ydFNpZ25hbGAgdG8gY2FuY2VsIHRoZSByZXF1ZXN0XG4gICAgICpcbiAgICAgKiAqKk9mZmljaWFsIHJlZmVyZW5jZToqKiBodHRwczovL2NvcmUudGVsZWdyYW0ub3JnL2JvdHMvYXBpI2dldGZpbGVcbiAgICAgKi9cbiAgICBnZXRGaWxlKGZpbGVfaWQ6IHN0cmluZywgc2lnbmFsPzogQWJvcnRTaWduYWwpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMucmF3LmdldEZpbGUoeyBmaWxlX2lkIH0sIHNpZ25hbCk7XG4gICAgfVxuXG4gICAgLyoqIEBkZXByZWNhdGVkIFVzZSBgYmFuQ2hhdE1lbWJlcmAgaW5zdGVhZC4gKi9cbiAgICBraWNrQ2hhdE1lbWJlciguLi5hcmdzOiBQYXJhbWV0ZXJzPEFwaVtcImJhbkNoYXRNZW1iZXJcIl0+KSB7XG4gICAgICAgIHJldHVybiB0aGlzLmJhbkNoYXRNZW1iZXIoLi4uYXJncyk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogVXNlIHRoaXMgbWV0aG9kIHRvIGJhbiBhIHVzZXIgaW4gYSBncm91cCwgYSBzdXBlcmdyb3VwIG9yIGEgY2hhbm5lbC4gSW4gdGhlIGNhc2Ugb2Ygc3VwZXJncm91cHMgYW5kIGNoYW5uZWxzLCB0aGUgdXNlciB3aWxsIG5vdCBiZSBhYmxlIHRvIHJldHVybiB0byB0aGUgY2hhdCBvbiB0aGVpciBvd24gdXNpbmcgaW52aXRlIGxpbmtzLCBldGMuLCB1bmxlc3MgdW5iYW5uZWQgZmlyc3QuIFRoZSBib3QgbXVzdCBiZSBhbiBhZG1pbmlzdHJhdG9yIGluIHRoZSBjaGF0IGZvciB0aGlzIHRvIHdvcmsgYW5kIG11c3QgaGF2ZSB0aGUgYXBwcm9wcmlhdGUgYWRtaW5pc3RyYXRvciByaWdodHMuIFJldHVybnMgVHJ1ZSBvbiBzdWNjZXNzLlxuICAgICAqXG4gICAgICogQHBhcmFtIGNoYXRfaWQgVW5pcXVlIGlkZW50aWZpZXIgZm9yIHRoZSB0YXJnZXQgZ3JvdXAgb3IgdXNlcm5hbWUgb2YgdGhlIHRhcmdldCBzdXBlcmdyb3VwIG9yIGNoYW5uZWwgKGluIHRoZSBmb3JtYXQgQGNoYW5uZWx1c2VybmFtZSlcbiAgICAgKiBAcGFyYW0gdXNlcl9pZCBVbmlxdWUgaWRlbnRpZmllciBvZiB0aGUgdGFyZ2V0IHVzZXJcbiAgICAgKiBAcGFyYW0gb3RoZXIgT3B0aW9uYWwgcmVtYWluaW5nIHBhcmFtZXRlcnMsIGNvbmZlciB0aGUgb2ZmaWNpYWwgcmVmZXJlbmNlIGJlbG93XG4gICAgICogQHBhcmFtIHNpZ25hbCBPcHRpb25hbCBgQWJvcnRTaWduYWxgIHRvIGNhbmNlbCB0aGUgcmVxdWVzdFxuICAgICAqXG4gICAgICogKipPZmZpY2lhbCByZWZlcmVuY2U6KiogaHR0cHM6Ly9jb3JlLnRlbGVncmFtLm9yZy9ib3RzL2FwaSNiYW5jaGF0bWVtYmVyXG4gICAgICovXG4gICAgYmFuQ2hhdE1lbWJlcihcbiAgICAgICAgY2hhdF9pZDogbnVtYmVyIHwgc3RyaW5nLFxuICAgICAgICB1c2VyX2lkOiBudW1iZXIsXG4gICAgICAgIG90aGVyPzogT3RoZXI8UiwgXCJiYW5DaGF0TWVtYmVyXCIsIFwiY2hhdF9pZFwiIHwgXCJ1c2VyX2lkXCI+LFxuICAgICAgICBzaWduYWw/OiBBYm9ydFNpZ25hbCxcbiAgICApIHtcbiAgICAgICAgcmV0dXJuIHRoaXMucmF3LmJhbkNoYXRNZW1iZXIoeyBjaGF0X2lkLCB1c2VyX2lkLCAuLi5vdGhlciB9LCBzaWduYWwpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFVzZSB0aGlzIG1ldGhvZCB0byB1bmJhbiBhIHByZXZpb3VzbHkgYmFubmVkIHVzZXIgaW4gYSBzdXBlcmdyb3VwIG9yIGNoYW5uZWwuIFRoZSB1c2VyIHdpbGwgbm90IHJldHVybiB0byB0aGUgZ3JvdXAgb3IgY2hhbm5lbCBhdXRvbWF0aWNhbGx5LCBidXQgd2lsbCBiZSBhYmxlIHRvIGpvaW4gdmlhIGxpbmssIGV0Yy4gVGhlIGJvdCBtdXN0IGJlIGFuIGFkbWluaXN0cmF0b3IgZm9yIHRoaXMgdG8gd29yay4gQnkgZGVmYXVsdCwgdGhpcyBtZXRob2QgZ3VhcmFudGVlcyB0aGF0IGFmdGVyIHRoZSBjYWxsIHRoZSB1c2VyIGlzIG5vdCBhIG1lbWJlciBvZiB0aGUgY2hhdCwgYnV0IHdpbGwgYmUgYWJsZSB0byBqb2luIGl0LiBTbyBpZiB0aGUgdXNlciBpcyBhIG1lbWJlciBvZiB0aGUgY2hhdCB0aGV5IHdpbGwgYWxzbyBiZSByZW1vdmVkIGZyb20gdGhlIGNoYXQuIElmIHlvdSBkb24ndCB3YW50IHRoaXMsIHVzZSB0aGUgcGFyYW1ldGVyIG9ubHlfaWZfYmFubmVkLiBSZXR1cm5zIFRydWUgb24gc3VjY2Vzcy5cbiAgICAgKlxuICAgICAqIEBwYXJhbSBjaGF0X2lkIFVuaXF1ZSBpZGVudGlmaWVyIGZvciB0aGUgdGFyZ2V0IGdyb3VwIG9yIHVzZXJuYW1lIG9mIHRoZSB0YXJnZXQgc3VwZXJncm91cCBvciBjaGFubmVsIChpbiB0aGUgZm9ybWF0IEB1c2VybmFtZSlcbiAgICAgKiBAcGFyYW0gdXNlcl9pZCBVbmlxdWUgaWRlbnRpZmllciBvZiB0aGUgdGFyZ2V0IHVzZXJcbiAgICAgKiBAcGFyYW0gb3RoZXIgT3B0aW9uYWwgcmVtYWluaW5nIHBhcmFtZXRlcnMsIGNvbmZlciB0aGUgb2ZmaWNpYWwgcmVmZXJlbmNlIGJlbG93XG4gICAgICogQHBhcmFtIHNpZ25hbCBPcHRpb25hbCBgQWJvcnRTaWduYWxgIHRvIGNhbmNlbCB0aGUgcmVxdWVzdFxuICAgICAqXG4gICAgICogKipPZmZpY2lhbCByZWZlcmVuY2U6KiogaHR0cHM6Ly9jb3JlLnRlbGVncmFtLm9yZy9ib3RzL2FwaSN1bmJhbmNoYXRtZW1iZXJcbiAgICAgKi9cbiAgICB1bmJhbkNoYXRNZW1iZXIoXG4gICAgICAgIGNoYXRfaWQ6IG51bWJlciB8IHN0cmluZyxcbiAgICAgICAgdXNlcl9pZDogbnVtYmVyLFxuICAgICAgICBvdGhlcj86IE90aGVyPFIsIFwidW5iYW5DaGF0TWVtYmVyXCIsIFwiY2hhdF9pZFwiIHwgXCJ1c2VyX2lkXCI+LFxuICAgICAgICBzaWduYWw/OiBBYm9ydFNpZ25hbCxcbiAgICApIHtcbiAgICAgICAgcmV0dXJuIHRoaXMucmF3LnVuYmFuQ2hhdE1lbWJlcih7IGNoYXRfaWQsIHVzZXJfaWQsIC4uLm90aGVyIH0sIHNpZ25hbCk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogVXNlIHRoaXMgbWV0aG9kIHRvIHJlc3RyaWN0IGEgdXNlciBpbiBhIHN1cGVyZ3JvdXAuIFRoZSBib3QgbXVzdCBiZSBhbiBhZG1pbmlzdHJhdG9yIGluIHRoZSBzdXBlcmdyb3VwIGZvciB0aGlzIHRvIHdvcmsgYW5kIG11c3QgaGF2ZSB0aGUgYXBwcm9wcmlhdGUgYWRtaW5pc3RyYXRvciByaWdodHMuIFBhc3MgVHJ1ZSBmb3IgYWxsIHBlcm1pc3Npb25zIHRvIGxpZnQgcmVzdHJpY3Rpb25zIGZyb20gYSB1c2VyLiBSZXR1cm5zIFRydWUgb24gc3VjY2Vzcy5cbiAgICAgKlxuICAgICAqIEBwYXJhbSBjaGF0X2lkIFVuaXF1ZSBpZGVudGlmaWVyIGZvciB0aGUgdGFyZ2V0IGNoYXQgb3IgdXNlcm5hbWUgb2YgdGhlIHRhcmdldCBzdXBlcmdyb3VwIChpbiB0aGUgZm9ybWF0IEBzdXBlcmdyb3VwdXNlcm5hbWUpXG4gICAgICogQHBhcmFtIHVzZXJfaWQgVW5pcXVlIGlkZW50aWZpZXIgb2YgdGhlIHRhcmdldCB1c2VyXG4gICAgICogQHBhcmFtIHBlcm1pc3Npb25zIEFuIG9iamVjdCBmb3IgbmV3IHVzZXIgcGVybWlzc2lvbnNcbiAgICAgKiBAcGFyYW0gb3RoZXIgT3B0aW9uYWwgcmVtYWluaW5nIHBhcmFtZXRlcnMsIGNvbmZlciB0aGUgb2ZmaWNpYWwgcmVmZXJlbmNlIGJlbG93XG4gICAgICogQHBhcmFtIHNpZ25hbCBPcHRpb25hbCBgQWJvcnRTaWduYWxgIHRvIGNhbmNlbCB0aGUgcmVxdWVzdFxuICAgICAqXG4gICAgICogKipPZmZpY2lhbCByZWZlcmVuY2U6KiogaHR0cHM6Ly9jb3JlLnRlbGVncmFtLm9yZy9ib3RzL2FwaSNyZXN0cmljdGNoYXRtZW1iZXJcbiAgICAgKi9cbiAgICByZXN0cmljdENoYXRNZW1iZXIoXG4gICAgICAgIGNoYXRfaWQ6IG51bWJlciB8IHN0cmluZyxcbiAgICAgICAgdXNlcl9pZDogbnVtYmVyLFxuICAgICAgICBwZXJtaXNzaW9uczogQ2hhdFBlcm1pc3Npb25zLFxuICAgICAgICBvdGhlcj86IE90aGVyPFxuICAgICAgICAgICAgUixcbiAgICAgICAgICAgIFwicmVzdHJpY3RDaGF0TWVtYmVyXCIsXG4gICAgICAgICAgICBcImNoYXRfaWRcIiB8IFwidXNlcl9pZFwiIHwgXCJwZXJtaXNzaW9uc1wiXG4gICAgICAgID4sXG4gICAgICAgIHNpZ25hbD86IEFib3J0U2lnbmFsLFxuICAgICkge1xuICAgICAgICByZXR1cm4gdGhpcy5yYXcucmVzdHJpY3RDaGF0TWVtYmVyKFxuICAgICAgICAgICAgeyBjaGF0X2lkLCB1c2VyX2lkLCBwZXJtaXNzaW9ucywgLi4ub3RoZXIgfSxcbiAgICAgICAgICAgIHNpZ25hbCxcbiAgICAgICAgKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBVc2UgdGhpcyBtZXRob2QgdG8gcHJvbW90ZSBvciBkZW1vdGUgYSB1c2VyIGluIGEgc3VwZXJncm91cCBvciBhIGNoYW5uZWwuIFRoZSBib3QgbXVzdCBiZSBhbiBhZG1pbmlzdHJhdG9yIGluIHRoZSBjaGF0IGZvciB0aGlzIHRvIHdvcmsgYW5kIG11c3QgaGF2ZSB0aGUgYXBwcm9wcmlhdGUgYWRtaW5pc3RyYXRvciByaWdodHMuIFBhc3MgRmFsc2UgZm9yIGFsbCBib29sZWFuIHBhcmFtZXRlcnMgdG8gZGVtb3RlIGEgdXNlci4gUmV0dXJucyBUcnVlIG9uIHN1Y2Nlc3MuXG4gICAgICpcbiAgICAgKiBAcGFyYW0gY2hhdF9pZCBVbmlxdWUgaWRlbnRpZmllciBmb3IgdGhlIHRhcmdldCBjaGF0IG9yIHVzZXJuYW1lIG9mIHRoZSB0YXJnZXQgY2hhbm5lbCAoaW4gdGhlIGZvcm1hdCBAY2hhbm5lbHVzZXJuYW1lKVxuICAgICAqIEBwYXJhbSB1c2VyX2lkIFVuaXF1ZSBpZGVudGlmaWVyIG9mIHRoZSB0YXJnZXQgdXNlclxuICAgICAqIEBwYXJhbSBvdGhlciBPcHRpb25hbCByZW1haW5pbmcgcGFyYW1ldGVycywgY29uZmVyIHRoZSBvZmZpY2lhbCByZWZlcmVuY2UgYmVsb3dcbiAgICAgKiBAcGFyYW0gc2lnbmFsIE9wdGlvbmFsIGBBYm9ydFNpZ25hbGAgdG8gY2FuY2VsIHRoZSByZXF1ZXN0XG4gICAgICpcbiAgICAgKiAqKk9mZmljaWFsIHJlZmVyZW5jZToqKiBodHRwczovL2NvcmUudGVsZWdyYW0ub3JnL2JvdHMvYXBpI3Byb21vdGVjaGF0bWVtYmVyXG4gICAgICovXG4gICAgcHJvbW90ZUNoYXRNZW1iZXIoXG4gICAgICAgIGNoYXRfaWQ6IG51bWJlciB8IHN0cmluZyxcbiAgICAgICAgdXNlcl9pZDogbnVtYmVyLFxuICAgICAgICBvdGhlcj86IE90aGVyPFIsIFwicHJvbW90ZUNoYXRNZW1iZXJcIiwgXCJjaGF0X2lkXCIgfCBcInVzZXJfaWRcIj4sXG4gICAgICAgIHNpZ25hbD86IEFib3J0U2lnbmFsLFxuICAgICkge1xuICAgICAgICByZXR1cm4gdGhpcy5yYXcucHJvbW90ZUNoYXRNZW1iZXIoXG4gICAgICAgICAgICB7IGNoYXRfaWQsIHVzZXJfaWQsIC4uLm90aGVyIH0sXG4gICAgICAgICAgICBzaWduYWwsXG4gICAgICAgICk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogVXNlIHRoaXMgbWV0aG9kIHRvIHNldCBhIGN1c3RvbSB0aXRsZSBmb3IgYW4gYWRtaW5pc3RyYXRvciBpbiBhIHN1cGVyZ3JvdXAgcHJvbW90ZWQgYnkgdGhlIGJvdC4gUmV0dXJucyBUcnVlIG9uIHN1Y2Nlc3MuXG4gICAgICpcbiAgICAgKiBAcGFyYW0gY2hhdF9pZCBVbmlxdWUgaWRlbnRpZmllciBmb3IgdGhlIHRhcmdldCBjaGF0IG9yIHVzZXJuYW1lIG9mIHRoZSB0YXJnZXQgc3VwZXJncm91cCAoaW4gdGhlIGZvcm1hdCBAc3VwZXJncm91cHVzZXJuYW1lKVxuICAgICAqIEBwYXJhbSB1c2VyX2lkIFVuaXF1ZSBpZGVudGlmaWVyIG9mIHRoZSB0YXJnZXQgdXNlclxuICAgICAqIEBwYXJhbSBjdXN0b21fdGl0bGUgTmV3IGN1c3RvbSB0aXRsZSBmb3IgdGhlIGFkbWluaXN0cmF0b3I7IDAtMTYgY2hhcmFjdGVycywgZW1vamkgYXJlIG5vdCBhbGxvd2VkXG4gICAgICogQHBhcmFtIHNpZ25hbCBPcHRpb25hbCBgQWJvcnRTaWduYWxgIHRvIGNhbmNlbCB0aGUgcmVxdWVzdFxuICAgICAqXG4gICAgICogKipPZmZpY2lhbCByZWZlcmVuY2U6KiogaHR0cHM6Ly9jb3JlLnRlbGVncmFtLm9yZy9ib3RzL2FwaSNzZXRjaGF0YWRtaW5pc3RyYXRvcmN1c3RvbXRpdGxlXG4gICAgICovXG4gICAgc2V0Q2hhdEFkbWluaXN0cmF0b3JDdXN0b21UaXRsZShcbiAgICAgICAgY2hhdF9pZDogbnVtYmVyIHwgc3RyaW5nLFxuICAgICAgICB1c2VyX2lkOiBudW1iZXIsXG4gICAgICAgIGN1c3RvbV90aXRsZTogc3RyaW5nLFxuICAgICAgICBzaWduYWw/OiBBYm9ydFNpZ25hbCxcbiAgICApIHtcbiAgICAgICAgcmV0dXJuIHRoaXMucmF3LnNldENoYXRBZG1pbmlzdHJhdG9yQ3VzdG9tVGl0bGUoXG4gICAgICAgICAgICB7IGNoYXRfaWQsIHVzZXJfaWQsIGN1c3RvbV90aXRsZSB9LFxuICAgICAgICAgICAgc2lnbmFsLFxuICAgICAgICApO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFVzZSB0aGlzIG1ldGhvZCB0byBiYW4gYSBjaGFubmVsIGNoYXQgaW4gYSBzdXBlcmdyb3VwIG9yIGEgY2hhbm5lbC4gVW50aWwgdGhlIGNoYXQgaXMgdW5iYW5uZWQsIHRoZSBvd25lciBvZiB0aGUgYmFubmVkIGNoYXQgd29uJ3QgYmUgYWJsZSB0byBzZW5kIG1lc3NhZ2VzIG9uIGJlaGFsZiBvZiBhbnkgb2YgdGhlaXIgY2hhbm5lbHMuIFRoZSBib3QgbXVzdCBiZSBhbiBhZG1pbmlzdHJhdG9yIGluIHRoZSBzdXBlcmdyb3VwIG9yIGNoYW5uZWwgZm9yIHRoaXMgdG8gd29yayBhbmQgbXVzdCBoYXZlIHRoZSBhcHByb3ByaWF0ZSBhZG1pbmlzdHJhdG9yIHJpZ2h0cy4gUmV0dXJucyBUcnVlIG9uIHN1Y2Nlc3MuXG4gICAgICpcbiAgICAgKiBAcGFyYW0gY2hhdF9pZCBVbmlxdWUgaWRlbnRpZmllciBmb3IgdGhlIHRhcmdldCBjaGF0IG9yIHVzZXJuYW1lIG9mIHRoZSB0YXJnZXQgY2hhbm5lbCAoaW4gdGhlIGZvcm1hdCBAY2hhbm5lbHVzZXJuYW1lKVxuICAgICAqIEBwYXJhbSBzZW5kZXJfY2hhdF9pZCBVbmlxdWUgaWRlbnRpZmllciBvZiB0aGUgdGFyZ2V0IHNlbmRlciBjaGF0XG4gICAgICogQHBhcmFtIHNpZ25hbCBPcHRpb25hbCBgQWJvcnRTaWduYWxgIHRvIGNhbmNlbCB0aGUgcmVxdWVzdFxuICAgICAqXG4gICAgICogKipPZmZpY2lhbCByZWZlcmVuY2U6KiogaHR0cHM6Ly9jb3JlLnRlbGVncmFtLm9yZy9ib3RzL2FwaSNiYW5jaGF0c2VuZGVyY2hhdFxuICAgICAqL1xuICAgIGJhbkNoYXRTZW5kZXJDaGF0KFxuICAgICAgICBjaGF0X2lkOiBudW1iZXIgfCBzdHJpbmcsXG4gICAgICAgIHNlbmRlcl9jaGF0X2lkOiBudW1iZXIsXG4gICAgICAgIHNpZ25hbD86IEFib3J0U2lnbmFsLFxuICAgICkge1xuICAgICAgICByZXR1cm4gdGhpcy5yYXcuYmFuQ2hhdFNlbmRlckNoYXQoeyBjaGF0X2lkLCBzZW5kZXJfY2hhdF9pZCB9LCBzaWduYWwpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFVzZSB0aGlzIG1ldGhvZCB0byB1bmJhbiBhIHByZXZpb3VzbHkgYmFubmVkIGNoYW5uZWwgY2hhdCBpbiBhIHN1cGVyZ3JvdXAgb3IgY2hhbm5lbC4gVGhlIGJvdCBtdXN0IGJlIGFuIGFkbWluaXN0cmF0b3IgZm9yIHRoaXMgdG8gd29yayBhbmQgbXVzdCBoYXZlIHRoZSBhcHByb3ByaWF0ZSBhZG1pbmlzdHJhdG9yIHJpZ2h0cy4gUmV0dXJucyBUcnVlIG9uIHN1Y2Nlc3MuXG4gICAgICpcbiAgICAgKiBAcGFyYW0gY2hhdF9pZCBVbmlxdWUgaWRlbnRpZmllciBmb3IgdGhlIHRhcmdldCBjaGF0IG9yIHVzZXJuYW1lIG9mIHRoZSB0YXJnZXQgY2hhbm5lbCAoaW4gdGhlIGZvcm1hdCBAY2hhbm5lbHVzZXJuYW1lKVxuICAgICAqIEBwYXJhbSBzZW5kZXJfY2hhdF9pZCBVbmlxdWUgaWRlbnRpZmllciBvZiB0aGUgdGFyZ2V0IHNlbmRlciBjaGF0XG4gICAgICogQHBhcmFtIHNpZ25hbCBPcHRpb25hbCBgQWJvcnRTaWduYWxgIHRvIGNhbmNlbCB0aGUgcmVxdWVzdFxuICAgICAqXG4gICAgICogKipPZmZpY2lhbCByZWZlcmVuY2U6KiogaHR0cHM6Ly9jb3JlLnRlbGVncmFtLm9yZy9ib3RzL2FwaSN1bmJhbmNoYXRzZW5kZXJjaGF0XG4gICAgICovXG4gICAgdW5iYW5DaGF0U2VuZGVyQ2hhdChcbiAgICAgICAgY2hhdF9pZDogbnVtYmVyIHwgc3RyaW5nLFxuICAgICAgICBzZW5kZXJfY2hhdF9pZDogbnVtYmVyLFxuICAgICAgICBzaWduYWw/OiBBYm9ydFNpZ25hbCxcbiAgICApIHtcbiAgICAgICAgcmV0dXJuIHRoaXMucmF3LnVuYmFuQ2hhdFNlbmRlckNoYXQoXG4gICAgICAgICAgICB7IGNoYXRfaWQsIHNlbmRlcl9jaGF0X2lkIH0sXG4gICAgICAgICAgICBzaWduYWwsXG4gICAgICAgICk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogVXNlIHRoaXMgbWV0aG9kIHRvIHNldCBkZWZhdWx0IGNoYXQgcGVybWlzc2lvbnMgZm9yIGFsbCBtZW1iZXJzLiBUaGUgYm90IG11c3QgYmUgYW4gYWRtaW5pc3RyYXRvciBpbiB0aGUgZ3JvdXAgb3IgYSBzdXBlcmdyb3VwIGZvciB0aGlzIHRvIHdvcmsgYW5kIG11c3QgaGF2ZSB0aGUgY2FuX3Jlc3RyaWN0X21lbWJlcnMgYWRtaW5pc3RyYXRvciByaWdodHMuIFJldHVybnMgVHJ1ZSBvbiBzdWNjZXNzLlxuICAgICAqXG4gICAgICogQHBhcmFtIGNoYXRfaWQgVW5pcXVlIGlkZW50aWZpZXIgZm9yIHRoZSB0YXJnZXQgY2hhdCBvciB1c2VybmFtZSBvZiB0aGUgdGFyZ2V0IHN1cGVyZ3JvdXAgKGluIHRoZSBmb3JtYXQgQHN1cGVyZ3JvdXB1c2VybmFtZSlcbiAgICAgKiBAcGFyYW0gcGVybWlzc2lvbnMgTmV3IGRlZmF1bHQgY2hhdCBwZXJtaXNzaW9uc1xuICAgICAqIEBwYXJhbSBvdGhlciBPcHRpb25hbCByZW1haW5pbmcgcGFyYW1ldGVycywgY29uZmVyIHRoZSBvZmZpY2lhbCByZWZlcmVuY2UgYmVsb3dcbiAgICAgKiBAcGFyYW0gc2lnbmFsIE9wdGlvbmFsIGBBYm9ydFNpZ25hbGAgdG8gY2FuY2VsIHRoZSByZXF1ZXN0XG4gICAgICpcbiAgICAgKiAqKk9mZmljaWFsIHJlZmVyZW5jZToqKiBodHRwczovL2NvcmUudGVsZWdyYW0ub3JnL2JvdHMvYXBpI3NldGNoYXRwZXJtaXNzaW9uc1xuICAgICAqL1xuICAgIHNldENoYXRQZXJtaXNzaW9ucyhcbiAgICAgICAgY2hhdF9pZDogbnVtYmVyIHwgc3RyaW5nLFxuICAgICAgICBwZXJtaXNzaW9uczogQ2hhdFBlcm1pc3Npb25zLFxuICAgICAgICBvdGhlcj86IE90aGVyPFIsIFwic2V0Q2hhdFBlcm1pc3Npb25zXCIsIFwiY2hhdF9pZFwiIHwgXCJwZXJtaXNzaW9uc1wiPixcbiAgICAgICAgc2lnbmFsPzogQWJvcnRTaWduYWwsXG4gICAgKSB7XG4gICAgICAgIHJldHVybiB0aGlzLnJhdy5zZXRDaGF0UGVybWlzc2lvbnMoXG4gICAgICAgICAgICB7IGNoYXRfaWQsIHBlcm1pc3Npb25zLCAuLi5vdGhlciB9LFxuICAgICAgICAgICAgc2lnbmFsLFxuICAgICAgICApO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFVzZSB0aGlzIG1ldGhvZCB0byBnZW5lcmF0ZSBhIG5ldyBwcmltYXJ5IGludml0ZSBsaW5rIGZvciBhIGNoYXQ7IGFueSBwcmV2aW91c2x5IGdlbmVyYXRlZCBwcmltYXJ5IGxpbmsgaXMgcmV2b2tlZC4gVGhlIGJvdCBtdXN0IGJlIGFuIGFkbWluaXN0cmF0b3IgaW4gdGhlIGNoYXQgZm9yIHRoaXMgdG8gd29yayBhbmQgbXVzdCBoYXZlIHRoZSBhcHByb3ByaWF0ZSBhZG1pbmlzdHJhdG9yIHJpZ2h0cy4gUmV0dXJucyB0aGUgbmV3IGludml0ZSBsaW5rIGFzIFN0cmluZyBvbiBzdWNjZXNzLlxuICAgICAqXG4gICAgICogTm90ZTogRWFjaCBhZG1pbmlzdHJhdG9yIGluIGEgY2hhdCBnZW5lcmF0ZXMgdGhlaXIgb3duIGludml0ZSBsaW5rcy4gQm90cyBjYW4ndCB1c2UgaW52aXRlIGxpbmtzIGdlbmVyYXRlZCBieSBvdGhlciBhZG1pbmlzdHJhdG9ycy4gSWYgeW91IHdhbnQgeW91ciBib3QgdG8gd29yayB3aXRoIGludml0ZSBsaW5rcywgaXQgd2lsbCBuZWVkIHRvIGdlbmVyYXRlIGl0cyBvd24gbGluayB1c2luZyBleHBvcnRDaGF0SW52aXRlTGluayBvciBieSBjYWxsaW5nIHRoZSBnZXRDaGF0IG1ldGhvZC4gSWYgeW91ciBib3QgbmVlZHMgdG8gZ2VuZXJhdGUgYSBuZXcgcHJpbWFyeSBpbnZpdGUgbGluayByZXBsYWNpbmcgaXRzIHByZXZpb3VzIG9uZSwgdXNlIGV4cG9ydENoYXRJbnZpdGVMaW5rIGFnYWluLlxuICAgICAqXG4gICAgICogQHBhcmFtIGNoYXRfaWQgVW5pcXVlIGlkZW50aWZpZXIgZm9yIHRoZSB0YXJnZXQgY2hhdCBvciB1c2VybmFtZSBvZiB0aGUgdGFyZ2V0IGNoYW5uZWwgKGluIHRoZSBmb3JtYXQgQGNoYW5uZWx1c2VybmFtZSlcbiAgICAgKiBAcGFyYW0gc2lnbmFsIE9wdGlvbmFsIGBBYm9ydFNpZ25hbGAgdG8gY2FuY2VsIHRoZSByZXF1ZXN0XG4gICAgICpcbiAgICAgKiAqKk9mZmljaWFsIHJlZmVyZW5jZToqKiBodHRwczovL2NvcmUudGVsZWdyYW0ub3JnL2JvdHMvYXBpI2V4cG9ydGNoYXRpbnZpdGVsaW5rXG4gICAgICovXG4gICAgZXhwb3J0Q2hhdEludml0ZUxpbmsoY2hhdF9pZDogbnVtYmVyIHwgc3RyaW5nLCBzaWduYWw/OiBBYm9ydFNpZ25hbCkge1xuICAgICAgICByZXR1cm4gdGhpcy5yYXcuZXhwb3J0Q2hhdEludml0ZUxpbmsoeyBjaGF0X2lkIH0sIHNpZ25hbCk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogVXNlIHRoaXMgbWV0aG9kIHRvIGNyZWF0ZSBhbiBhZGRpdGlvbmFsIGludml0ZSBsaW5rIGZvciBhIGNoYXQuIFRoZSBib3QgbXVzdCBiZSBhbiBhZG1pbmlzdHJhdG9yIGluIHRoZSBjaGF0IGZvciB0aGlzIHRvIHdvcmsgYW5kIG11c3QgaGF2ZSB0aGUgYXBwcm9wcmlhdGUgYWRtaW5pc3RyYXRvciByaWdodHMuIFRoZSBsaW5rIGNhbiBiZSByZXZva2VkIHVzaW5nIHRoZSBtZXRob2QgcmV2b2tlQ2hhdEludml0ZUxpbmsuIFJldHVybnMgdGhlIG5ldyBpbnZpdGUgbGluayBhcyBDaGF0SW52aXRlTGluayBvYmplY3QuXG4gICAgICpcbiAgICAgKiBAcGFyYW0gY2hhdF9pZCBVbmlxdWUgaWRlbnRpZmllciBmb3IgdGhlIHRhcmdldCBjaGF0IG9yIHVzZXJuYW1lIG9mIHRoZSB0YXJnZXQgY2hhbm5lbCAoaW4gdGhlIGZvcm1hdCBAY2hhbm5lbHVzZXJuYW1lKVxuICAgICAqIEBwYXJhbSBvdGhlciBPcHRpb25hbCByZW1haW5pbmcgcGFyYW1ldGVycywgY29uZmVyIHRoZSBvZmZpY2lhbCByZWZlcmVuY2UgYmVsb3dcbiAgICAgKiBAcGFyYW0gc2lnbmFsIE9wdGlvbmFsIGBBYm9ydFNpZ25hbGAgdG8gY2FuY2VsIHRoZSByZXF1ZXN0XG4gICAgICpcbiAgICAgKiAqKk9mZmljaWFsIHJlZmVyZW5jZToqKiBodHRwczovL2NvcmUudGVsZWdyYW0ub3JnL2JvdHMvYXBpI2NyZWF0ZWNoYXRpbnZpdGVsaW5rXG4gICAgICovXG4gICAgY3JlYXRlQ2hhdEludml0ZUxpbmsoXG4gICAgICAgIGNoYXRfaWQ6IG51bWJlciB8IHN0cmluZyxcbiAgICAgICAgb3RoZXI/OiBPdGhlcjxSLCBcImNyZWF0ZUNoYXRJbnZpdGVMaW5rXCIsIFwiY2hhdF9pZFwiPixcbiAgICAgICAgc2lnbmFsPzogQWJvcnRTaWduYWwsXG4gICAgKSB7XG4gICAgICAgIHJldHVybiB0aGlzLnJhdy5jcmVhdGVDaGF0SW52aXRlTGluayh7IGNoYXRfaWQsIC4uLm90aGVyIH0sIHNpZ25hbCk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogIFVzZSB0aGlzIG1ldGhvZCB0byBlZGl0IGEgbm9uLXByaW1hcnkgaW52aXRlIGxpbmsgY3JlYXRlZCBieSB0aGUgYm90LiBUaGUgYm90IG11c3QgYmUgYW4gYWRtaW5pc3RyYXRvciBpbiB0aGUgY2hhdCBmb3IgdGhpcyB0byB3b3JrIGFuZCBtdXN0IGhhdmUgdGhlIGFwcHJvcHJpYXRlIGFkbWluaXN0cmF0b3IgcmlnaHRzLiBSZXR1cm5zIHRoZSBlZGl0ZWQgaW52aXRlIGxpbmsgYXMgYSBDaGF0SW52aXRlTGluayBvYmplY3QuXG4gICAgICpcbiAgICAgKiBAcGFyYW0gY2hhdF9pZCBVbmlxdWUgaWRlbnRpZmllciBmb3IgdGhlIHRhcmdldCBjaGF0IG9yIHVzZXJuYW1lIG9mIHRoZSB0YXJnZXQgY2hhbm5lbCAoaW4gdGhlIGZvcm1hdCBAY2hhbm5lbHVzZXJuYW1lKVxuICAgICAqIEBwYXJhbSBpbnZpdGVfbGluayBUaGUgaW52aXRlIGxpbmsgdG8gZWRpdFxuICAgICAqIEBwYXJhbSBvdGhlciBPcHRpb25hbCByZW1haW5pbmcgcGFyYW1ldGVycywgY29uZmVyIHRoZSBvZmZpY2lhbCByZWZlcmVuY2UgYmVsb3dcbiAgICAgKiBAcGFyYW0gc2lnbmFsIE9wdGlvbmFsIGBBYm9ydFNpZ25hbGAgdG8gY2FuY2VsIHRoZSByZXF1ZXN0XG4gICAgICpcbiAgICAgKiAqKk9mZmljaWFsIHJlZmVyZW5jZToqKiBodHRwczovL2NvcmUudGVsZWdyYW0ub3JnL2JvdHMvYXBpI2VkaXRjaGF0aW52aXRlbGlua1xuICAgICAqL1xuICAgIGVkaXRDaGF0SW52aXRlTGluayhcbiAgICAgICAgY2hhdF9pZDogbnVtYmVyIHwgc3RyaW5nLFxuICAgICAgICBpbnZpdGVfbGluazogc3RyaW5nLFxuICAgICAgICBvdGhlcj86IE90aGVyPFIsIFwiZWRpdENoYXRJbnZpdGVMaW5rXCIsIFwiY2hhdF9pZFwiIHwgXCJpbnZpdGVfbGlua1wiPixcbiAgICAgICAgc2lnbmFsPzogQWJvcnRTaWduYWwsXG4gICAgKSB7XG4gICAgICAgIHJldHVybiB0aGlzLnJhdy5lZGl0Q2hhdEludml0ZUxpbmsoXG4gICAgICAgICAgICB7IGNoYXRfaWQsIGludml0ZV9saW5rLCAuLi5vdGhlciB9LFxuICAgICAgICAgICAgc2lnbmFsLFxuICAgICAgICApO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqICBVc2UgdGhpcyBtZXRob2QgdG8gcmV2b2tlIGFuIGludml0ZSBsaW5rIGNyZWF0ZWQgYnkgdGhlIGJvdC4gSWYgdGhlIHByaW1hcnkgbGluayBpcyByZXZva2VkLCBhIG5ldyBsaW5rIGlzIGF1dG9tYXRpY2FsbHkgZ2VuZXJhdGVkLiBUaGUgYm90IG11c3QgYmUgYW4gYWRtaW5pc3RyYXRvciBpbiB0aGUgY2hhdCBmb3IgdGhpcyB0byB3b3JrIGFuZCBtdXN0IGhhdmUgdGhlIGFwcHJvcHJpYXRlIGFkbWluaXN0cmF0b3IgcmlnaHRzLiBSZXR1cm5zIHRoZSByZXZva2VkIGludml0ZSBsaW5rIGFzIENoYXRJbnZpdGVMaW5rIG9iamVjdC5cbiAgICAgKlxuICAgICAqIEBwYXJhbSBjaGF0X2lkIFVuaXF1ZSBpZGVudGlmaWVyIG9mIHRoZSB0YXJnZXQgY2hhdCBvciB1c2VybmFtZSBvZiB0aGUgdGFyZ2V0IGNoYW5uZWwgKGluIHRoZSBmb3JtYXQgQGNoYW5uZWx1c2VybmFtZSlcbiAgICAgKiBAcGFyYW0gaW52aXRlX2xpbmsgVGhlIGludml0ZSBsaW5rIHRvIHJldm9rZVxuICAgICAqIEBwYXJhbSBzaWduYWwgT3B0aW9uYWwgYEFib3J0U2lnbmFsYCB0byBjYW5jZWwgdGhlIHJlcXVlc3RcbiAgICAgKlxuICAgICAqICoqT2ZmaWNpYWwgcmVmZXJlbmNlOioqIGh0dHBzOi8vY29yZS50ZWxlZ3JhbS5vcmcvYm90cy9hcGkjcmV2b2tlY2hhdGludml0ZWxpbmtcbiAgICAgKi9cbiAgICByZXZva2VDaGF0SW52aXRlTGluayhcbiAgICAgICAgY2hhdF9pZDogbnVtYmVyIHwgc3RyaW5nLFxuICAgICAgICBpbnZpdGVfbGluazogc3RyaW5nLFxuICAgICAgICBzaWduYWw/OiBBYm9ydFNpZ25hbCxcbiAgICApIHtcbiAgICAgICAgcmV0dXJuIHRoaXMucmF3LnJldm9rZUNoYXRJbnZpdGVMaW5rKHsgY2hhdF9pZCwgaW52aXRlX2xpbmsgfSwgc2lnbmFsKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBVc2UgdGhpcyBtZXRob2QgdG8gYXBwcm92ZSBhIGNoYXQgam9pbiByZXF1ZXN0LiBUaGUgYm90IG11c3QgYmUgYW4gYWRtaW5pc3RyYXRvciBpbiB0aGUgY2hhdCBmb3IgdGhpcyB0byB3b3JrIGFuZCBtdXN0IGhhdmUgdGhlIGNhbl9pbnZpdGVfdXNlcnMgYWRtaW5pc3RyYXRvciByaWdodC4gUmV0dXJucyBUcnVlIG9uIHN1Y2Nlc3MuXG4gICAgICpcbiAgICAgKiBAcGFyYW0gY2hhdF9pZCBVbmlxdWUgaWRlbnRpZmllciBmb3IgdGhlIHRhcmdldCBjaGF0IG9yIHVzZXJuYW1lIG9mIHRoZSB0YXJnZXQgY2hhbm5lbCAoaW4gdGhlIGZvcm1hdCBAY2hhbm5lbHVzZXJuYW1lKVxuICAgICAqIEBwYXJhbSB1c2VyX2lkIFVuaXF1ZSBpZGVudGlmaWVyIG9mIHRoZSB0YXJnZXQgdXNlclxuICAgICAqIEBwYXJhbSBzaWduYWwgT3B0aW9uYWwgYEFib3J0U2lnbmFsYCB0byBjYW5jZWwgdGhlIHJlcXVlc3RcbiAgICAgKlxuICAgICAqICoqT2ZmaWNpYWwgcmVmZXJlbmNlOioqIGh0dHBzOi8vY29yZS50ZWxlZ3JhbS5vcmcvYm90cy9hcGkjYXBwcm92ZWNoYXRqb2lucmVxdWVzdFxuICAgICAqL1xuICAgIGFwcHJvdmVDaGF0Sm9pblJlcXVlc3QoXG4gICAgICAgIGNoYXRfaWQ6IG51bWJlciB8IHN0cmluZyxcbiAgICAgICAgdXNlcl9pZDogbnVtYmVyLFxuICAgICAgICBzaWduYWw/OiBBYm9ydFNpZ25hbCxcbiAgICApIHtcbiAgICAgICAgcmV0dXJuIHRoaXMucmF3LmFwcHJvdmVDaGF0Sm9pblJlcXVlc3QoeyBjaGF0X2lkLCB1c2VyX2lkIH0sIHNpZ25hbCk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogVXNlIHRoaXMgbWV0aG9kIHRvIGRlY2xpbmUgYSBjaGF0IGpvaW4gcmVxdWVzdC4gVGhlIGJvdCBtdXN0IGJlIGFuIGFkbWluaXN0cmF0b3IgaW4gdGhlIGNoYXQgZm9yIHRoaXMgdG8gd29yayBhbmQgbXVzdCBoYXZlIHRoZSBjYW5faW52aXRlX3VzZXJzIGFkbWluaXN0cmF0b3IgcmlnaHQuIFJldHVybnMgVHJ1ZSBvbiBzdWNjZXNzLlxuICAgICAqXG4gICAgICogQHBhcmFtIGNoYXRfaWQgVW5pcXVlIGlkZW50aWZpZXIgZm9yIHRoZSB0YXJnZXQgY2hhdCBvciB1c2VybmFtZSBvZiB0aGUgdGFyZ2V0IGNoYW5uZWwgKGluIHRoZSBmb3JtYXQgQGNoYW5uZWx1c2VybmFtZSlcbiAgICAgKiBAcGFyYW0gdXNlcl9pZCBVbmlxdWUgaWRlbnRpZmllciBvZiB0aGUgdGFyZ2V0IHVzZXJcbiAgICAgKiBAcGFyYW0gc2lnbmFsIE9wdGlvbmFsIGBBYm9ydFNpZ25hbGAgdG8gY2FuY2VsIHRoZSByZXF1ZXN0XG4gICAgICpcbiAgICAgKiAqKk9mZmljaWFsIHJlZmVyZW5jZToqKiBodHRwczovL2NvcmUudGVsZWdyYW0ub3JnL2JvdHMvYXBpI2RlY2xpbmVjaGF0am9pbnJlcXVlc3RcbiAgICAgKi9cbiAgICBkZWNsaW5lQ2hhdEpvaW5SZXF1ZXN0KFxuICAgICAgICBjaGF0X2lkOiBudW1iZXIgfCBzdHJpbmcsXG4gICAgICAgIHVzZXJfaWQ6IG51bWJlcixcbiAgICAgICAgc2lnbmFsPzogQWJvcnRTaWduYWwsXG4gICAgKSB7XG4gICAgICAgIHJldHVybiB0aGlzLnJhdy5kZWNsaW5lQ2hhdEpvaW5SZXF1ZXN0KHsgY2hhdF9pZCwgdXNlcl9pZCB9LCBzaWduYWwpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFVzZSB0aGlzIG1ldGhvZCB0byBzZXQgYSBuZXcgcHJvZmlsZSBwaG90byBmb3IgdGhlIGNoYXQuIFBob3RvcyBjYW4ndCBiZSBjaGFuZ2VkIGZvciBwcml2YXRlIGNoYXRzLiBUaGUgYm90IG11c3QgYmUgYW4gYWRtaW5pc3RyYXRvciBpbiB0aGUgY2hhdCBmb3IgdGhpcyB0byB3b3JrIGFuZCBtdXN0IGhhdmUgdGhlIGFwcHJvcHJpYXRlIGFkbWluaXN0cmF0b3IgcmlnaHRzLiBSZXR1cm5zIFRydWUgb24gc3VjY2Vzcy5cbiAgICAgKlxuICAgICAqIEBwYXJhbSBjaGF0X2lkIFVuaXF1ZSBpZGVudGlmaWVyIGZvciB0aGUgdGFyZ2V0IGNoYXQgb3IgdXNlcm5hbWUgb2YgdGhlIHRhcmdldCBjaGFubmVsIChpbiB0aGUgZm9ybWF0IEBjaGFubmVsdXNlcm5hbWUpXG4gICAgICogQHBhcmFtIHBob3RvIE5ldyBjaGF0IHBob3RvLCB1cGxvYWRlZCB1c2luZyBtdWx0aXBhcnQvZm9ybS1kYXRhXG4gICAgICogQHBhcmFtIHNpZ25hbCBPcHRpb25hbCBgQWJvcnRTaWduYWxgIHRvIGNhbmNlbCB0aGUgcmVxdWVzdFxuICAgICAqXG4gICAgICogKipPZmZpY2lhbCByZWZlcmVuY2U6KiogaHR0cHM6Ly9jb3JlLnRlbGVncmFtLm9yZy9ib3RzL2FwaSNzZXRjaGF0cGhvdG9cbiAgICAgKi9cbiAgICBzZXRDaGF0UGhvdG8oXG4gICAgICAgIGNoYXRfaWQ6IG51bWJlciB8IHN0cmluZyxcbiAgICAgICAgcGhvdG86IElucHV0RmlsZSxcbiAgICAgICAgc2lnbmFsPzogQWJvcnRTaWduYWwsXG4gICAgKSB7XG4gICAgICAgIHJldHVybiB0aGlzLnJhdy5zZXRDaGF0UGhvdG8oeyBjaGF0X2lkLCBwaG90byB9LCBzaWduYWwpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFVzZSB0aGlzIG1ldGhvZCB0byBkZWxldGUgYSBjaGF0IHBob3RvLiBQaG90b3MgY2FuJ3QgYmUgY2hhbmdlZCBmb3IgcHJpdmF0ZSBjaGF0cy4gVGhlIGJvdCBtdXN0IGJlIGFuIGFkbWluaXN0cmF0b3IgaW4gdGhlIGNoYXQgZm9yIHRoaXMgdG8gd29yayBhbmQgbXVzdCBoYXZlIHRoZSBhcHByb3ByaWF0ZSBhZG1pbmlzdHJhdG9yIHJpZ2h0cy4gUmV0dXJucyBUcnVlIG9uIHN1Y2Nlc3MuXG4gICAgICpcbiAgICAgKiBAcGFyYW0gY2hhdF9pZCBVbmlxdWUgaWRlbnRpZmllciBmb3IgdGhlIHRhcmdldCBjaGF0IG9yIHVzZXJuYW1lIG9mIHRoZSB0YXJnZXQgY2hhbm5lbCAoaW4gdGhlIGZvcm1hdCBAY2hhbm5lbHVzZXJuYW1lKVxuICAgICAqIEBwYXJhbSBzaWduYWwgT3B0aW9uYWwgYEFib3J0U2lnbmFsYCB0byBjYW5jZWwgdGhlIHJlcXVlc3RcbiAgICAgKlxuICAgICAqICoqT2ZmaWNpYWwgcmVmZXJlbmNlOioqIGh0dHBzOi8vY29yZS50ZWxlZ3JhbS5vcmcvYm90cy9hcGkjZGVsZXRlY2hhdHBob3RvXG4gICAgICovXG4gICAgZGVsZXRlQ2hhdFBob3RvKGNoYXRfaWQ6IG51bWJlciB8IHN0cmluZywgc2lnbmFsPzogQWJvcnRTaWduYWwpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMucmF3LmRlbGV0ZUNoYXRQaG90byh7IGNoYXRfaWQgfSwgc2lnbmFsKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBVc2UgdGhpcyBtZXRob2QgdG8gY2hhbmdlIHRoZSB0aXRsZSBvZiBhIGNoYXQuIFRpdGxlcyBjYW4ndCBiZSBjaGFuZ2VkIGZvciBwcml2YXRlIGNoYXRzLiBUaGUgYm90IG11c3QgYmUgYW4gYWRtaW5pc3RyYXRvciBpbiB0aGUgY2hhdCBmb3IgdGhpcyB0byB3b3JrIGFuZCBtdXN0IGhhdmUgdGhlIGFwcHJvcHJpYXRlIGFkbWluaXN0cmF0b3IgcmlnaHRzLiBSZXR1cm5zIFRydWUgb24gc3VjY2Vzcy5cbiAgICAgKlxuICAgICAqIEBwYXJhbSBjaGF0X2lkIFVuaXF1ZSBpZGVudGlmaWVyIGZvciB0aGUgdGFyZ2V0IGNoYXQgb3IgdXNlcm5hbWUgb2YgdGhlIHRhcmdldCBjaGFubmVsIChpbiB0aGUgZm9ybWF0IEBjaGFubmVsdXNlcm5hbWUpXG4gICAgICogQHBhcmFtIHRpdGxlIE5ldyBjaGF0IHRpdGxlLCAxLTI1NSBjaGFyYWN0ZXJzXG4gICAgICogQHBhcmFtIHNpZ25hbCBPcHRpb25hbCBgQWJvcnRTaWduYWxgIHRvIGNhbmNlbCB0aGUgcmVxdWVzdFxuICAgICAqXG4gICAgICogKipPZmZpY2lhbCByZWZlcmVuY2U6KiogaHR0cHM6Ly9jb3JlLnRlbGVncmFtLm9yZy9ib3RzL2FwaSNzZXRjaGF0dGl0bGVcbiAgICAgKi9cbiAgICBzZXRDaGF0VGl0bGUoXG4gICAgICAgIGNoYXRfaWQ6IG51bWJlciB8IHN0cmluZyxcbiAgICAgICAgdGl0bGU6IHN0cmluZyxcbiAgICAgICAgc2lnbmFsPzogQWJvcnRTaWduYWwsXG4gICAgKSB7XG4gICAgICAgIHJldHVybiB0aGlzLnJhdy5zZXRDaGF0VGl0bGUoeyBjaGF0X2lkLCB0aXRsZSB9LCBzaWduYWwpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFVzZSB0aGlzIG1ldGhvZCB0byBjaGFuZ2UgdGhlIGRlc2NyaXB0aW9uIG9mIGEgZ3JvdXAsIGEgc3VwZXJncm91cCBvciBhIGNoYW5uZWwuIFRoZSBib3QgbXVzdCBiZSBhbiBhZG1pbmlzdHJhdG9yIGluIHRoZSBjaGF0IGZvciB0aGlzIHRvIHdvcmsgYW5kIG11c3QgaGF2ZSB0aGUgYXBwcm9wcmlhdGUgYWRtaW5pc3RyYXRvciByaWdodHMuIFJldHVybnMgVHJ1ZSBvbiBzdWNjZXNzLlxuICAgICAqXG4gICAgICogQHBhcmFtIGNoYXRfaWQgVW5pcXVlIGlkZW50aWZpZXIgZm9yIHRoZSB0YXJnZXQgY2hhdCBvciB1c2VybmFtZSBvZiB0aGUgdGFyZ2V0IGNoYW5uZWwgKGluIHRoZSBmb3JtYXQgQGNoYW5uZWx1c2VybmFtZSlcbiAgICAgKiBAcGFyYW0gZGVzY3JpcHRpb24gTmV3IGNoYXQgZGVzY3JpcHRpb24sIDAtMjU1IGNoYXJhY3RlcnNcbiAgICAgKiBAcGFyYW0gc2lnbmFsIE9wdGlvbmFsIGBBYm9ydFNpZ25hbGAgdG8gY2FuY2VsIHRoZSByZXF1ZXN0XG4gICAgICpcbiAgICAgKiAqKk9mZmljaWFsIHJlZmVyZW5jZToqKiBodHRwczovL2NvcmUudGVsZWdyYW0ub3JnL2JvdHMvYXBpI3NldGNoYXRkZXNjcmlwdGlvblxuICAgICAqL1xuICAgIHNldENoYXREZXNjcmlwdGlvbihcbiAgICAgICAgY2hhdF9pZDogbnVtYmVyIHwgc3RyaW5nLFxuICAgICAgICBkZXNjcmlwdGlvbj86IHN0cmluZyxcbiAgICAgICAgc2lnbmFsPzogQWJvcnRTaWduYWwsXG4gICAgKSB7XG4gICAgICAgIHJldHVybiB0aGlzLnJhdy5zZXRDaGF0RGVzY3JpcHRpb24oeyBjaGF0X2lkLCBkZXNjcmlwdGlvbiB9LCBzaWduYWwpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFVzZSB0aGlzIG1ldGhvZCB0byBhZGQgYSBtZXNzYWdlIHRvIHRoZSBsaXN0IG9mIHBpbm5lZCBtZXNzYWdlcyBpbiBhIGNoYXQuIElmIHRoZSBjaGF0IGlzIG5vdCBhIHByaXZhdGUgY2hhdCwgdGhlIGJvdCBtdXN0IGJlIGFuIGFkbWluaXN0cmF0b3IgaW4gdGhlIGNoYXQgZm9yIHRoaXMgdG8gd29yayBhbmQgbXVzdCBoYXZlIHRoZSAnY2FuX3Bpbl9tZXNzYWdlcycgYWRtaW5pc3RyYXRvciByaWdodCBpbiBhIHN1cGVyZ3JvdXAgb3IgJ2Nhbl9lZGl0X21lc3NhZ2VzJyBhZG1pbmlzdHJhdG9yIHJpZ2h0IGluIGEgY2hhbm5lbC4gUmV0dXJucyBUcnVlIG9uIHN1Y2Nlc3MuXG4gICAgICpcbiAgICAgKiBAcGFyYW0gY2hhdF9pZCBVbmlxdWUgaWRlbnRpZmllciBmb3IgdGhlIHRhcmdldCBjaGF0IG9yIHVzZXJuYW1lIG9mIHRoZSB0YXJnZXQgY2hhbm5lbCAoaW4gdGhlIGZvcm1hdCBAY2hhbm5lbHVzZXJuYW1lKVxuICAgICAqIEBwYXJhbSBtZXNzYWdlX2lkIElkZW50aWZpZXIgb2YgYSBtZXNzYWdlIHRvIHBpblxuICAgICAqIEBwYXJhbSBvdGhlciBPcHRpb25hbCByZW1haW5pbmcgcGFyYW1ldGVycywgY29uZmVyIHRoZSBvZmZpY2lhbCByZWZlcmVuY2UgYmVsb3dcbiAgICAgKiBAcGFyYW0gc2lnbmFsIE9wdGlvbmFsIGBBYm9ydFNpZ25hbGAgdG8gY2FuY2VsIHRoZSByZXF1ZXN0XG4gICAgICpcbiAgICAgKiAqKk9mZmljaWFsIHJlZmVyZW5jZToqKiBodHRwczovL2NvcmUudGVsZWdyYW0ub3JnL2JvdHMvYXBpI3BpbmNoYXRtZXNzYWdlXG4gICAgICovXG4gICAgcGluQ2hhdE1lc3NhZ2UoXG4gICAgICAgIGNoYXRfaWQ6IG51bWJlciB8IHN0cmluZyxcbiAgICAgICAgbWVzc2FnZV9pZDogbnVtYmVyLFxuICAgICAgICBvdGhlcj86IE90aGVyPFIsIFwicGluQ2hhdE1lc3NhZ2VcIiwgXCJjaGF0X2lkXCIgfCBcIm1lc3NhZ2VfaWRcIj4sXG4gICAgICAgIHNpZ25hbD86IEFib3J0U2lnbmFsLFxuICAgICkge1xuICAgICAgICByZXR1cm4gdGhpcy5yYXcucGluQ2hhdE1lc3NhZ2UoXG4gICAgICAgICAgICB7IGNoYXRfaWQsIG1lc3NhZ2VfaWQsIC4uLm90aGVyIH0sXG4gICAgICAgICAgICBzaWduYWwsXG4gICAgICAgICk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogVXNlIHRoaXMgbWV0aG9kIHRvIHJlbW92ZSBhIG1lc3NhZ2UgZnJvbSB0aGUgbGlzdCBvZiBwaW5uZWQgbWVzc2FnZXMgaW4gYSBjaGF0LiBJZiB0aGUgY2hhdCBpcyBub3QgYSBwcml2YXRlIGNoYXQsIHRoZSBib3QgbXVzdCBiZSBhbiBhZG1pbmlzdHJhdG9yIGluIHRoZSBjaGF0IGZvciB0aGlzIHRvIHdvcmsgYW5kIG11c3QgaGF2ZSB0aGUgJ2Nhbl9waW5fbWVzc2FnZXMnIGFkbWluaXN0cmF0b3IgcmlnaHQgaW4gYSBzdXBlcmdyb3VwIG9yICdjYW5fZWRpdF9tZXNzYWdlcycgYWRtaW5pc3RyYXRvciByaWdodCBpbiBhIGNoYW5uZWwuIFJldHVybnMgVHJ1ZSBvbiBzdWNjZXNzLlxuICAgICAqXG4gICAgICogQHBhcmFtIGNoYXRfaWQgVW5pcXVlIGlkZW50aWZpZXIgZm9yIHRoZSB0YXJnZXQgY2hhdCBvciB1c2VybmFtZSBvZiB0aGUgdGFyZ2V0IGNoYW5uZWwgKGluIHRoZSBmb3JtYXQgQGNoYW5uZWx1c2VybmFtZSlcbiAgICAgKiBAcGFyYW0gbWVzc2FnZV9pZCBJZGVudGlmaWVyIG9mIGEgbWVzc2FnZSB0byB1bnBpbi4gSWYgbm90IHNwZWNpZmllZCwgdGhlIG1vc3QgcmVjZW50IHBpbm5lZCBtZXNzYWdlIChieSBzZW5kaW5nIGRhdGUpIHdpbGwgYmUgdW5waW5uZWQuXG4gICAgICogQHBhcmFtIG90aGVyIE9wdGlvbmFsIHJlbWFpbmluZyBwYXJhbWV0ZXJzLCBjb25mZXIgdGhlIG9mZmljaWFsIHJlZmVyZW5jZSBiZWxvd1xuICAgICAqIEBwYXJhbSBzaWduYWwgT3B0aW9uYWwgYEFib3J0U2lnbmFsYCB0byBjYW5jZWwgdGhlIHJlcXVlc3RcbiAgICAgKlxuICAgICAqICoqT2ZmaWNpYWwgcmVmZXJlbmNlOioqIGh0dHBzOi8vY29yZS50ZWxlZ3JhbS5vcmcvYm90cy9hcGkjdW5waW5jaGF0bWVzc2FnZVxuICAgICAqL1xuICAgIHVucGluQ2hhdE1lc3NhZ2UoXG4gICAgICAgIGNoYXRfaWQ6IG51bWJlciB8IHN0cmluZyxcbiAgICAgICAgbWVzc2FnZV9pZD86IG51bWJlcixcbiAgICAgICAgc2lnbmFsPzogQWJvcnRTaWduYWwsXG4gICAgKSB7XG4gICAgICAgIHJldHVybiB0aGlzLnJhdy51bnBpbkNoYXRNZXNzYWdlKHsgY2hhdF9pZCwgbWVzc2FnZV9pZCB9LCBzaWduYWwpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFVzZSB0aGlzIG1ldGhvZCB0byBjbGVhciB0aGUgbGlzdCBvZiBwaW5uZWQgbWVzc2FnZXMgaW4gYSBjaGF0LiBJZiB0aGUgY2hhdCBpcyBub3QgYSBwcml2YXRlIGNoYXQsIHRoZSBib3QgbXVzdCBiZSBhbiBhZG1pbmlzdHJhdG9yIGluIHRoZSBjaGF0IGZvciB0aGlzIHRvIHdvcmsgYW5kIG11c3QgaGF2ZSB0aGUgJ2Nhbl9waW5fbWVzc2FnZXMnIGFkbWluaXN0cmF0b3IgcmlnaHQgaW4gYSBzdXBlcmdyb3VwIG9yICdjYW5fZWRpdF9tZXNzYWdlcycgYWRtaW5pc3RyYXRvciByaWdodCBpbiBhIGNoYW5uZWwuIFJldHVybnMgVHJ1ZSBvbiBzdWNjZXNzLlxuICAgICAqXG4gICAgICogQHBhcmFtIGNoYXRfaWQgVW5pcXVlIGlkZW50aWZpZXIgZm9yIHRoZSB0YXJnZXQgY2hhdCBvciB1c2VybmFtZSBvZiB0aGUgdGFyZ2V0IGNoYW5uZWwgKGluIHRoZSBmb3JtYXQgQGNoYW5uZWx1c2VybmFtZSlcbiAgICAgKiBAcGFyYW0gc2lnbmFsIE9wdGlvbmFsIGBBYm9ydFNpZ25hbGAgdG8gY2FuY2VsIHRoZSByZXF1ZXN0XG4gICAgICpcbiAgICAgKiAqKk9mZmljaWFsIHJlZmVyZW5jZToqKiBodHRwczovL2NvcmUudGVsZWdyYW0ub3JnL2JvdHMvYXBpI3VucGluYWxsY2hhdG1lc3NhZ2VzXG4gICAgICovXG4gICAgdW5waW5BbGxDaGF0TWVzc2FnZXMoY2hhdF9pZDogbnVtYmVyIHwgc3RyaW5nLCBzaWduYWw/OiBBYm9ydFNpZ25hbCkge1xuICAgICAgICByZXR1cm4gdGhpcy5yYXcudW5waW5BbGxDaGF0TWVzc2FnZXMoeyBjaGF0X2lkIH0sIHNpZ25hbCk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogVXNlIHRoaXMgbWV0aG9kIGZvciB5b3VyIGJvdCB0byBsZWF2ZSBhIGdyb3VwLCBzdXBlcmdyb3VwIG9yIGNoYW5uZWwuIFJldHVybnMgVHJ1ZSBvbiBzdWNjZXNzLlxuICAgICAqXG4gICAgICogQHBhcmFtIGNoYXRfaWQgVW5pcXVlIGlkZW50aWZpZXIgZm9yIHRoZSB0YXJnZXQgY2hhdCBvciB1c2VybmFtZSBvZiB0aGUgdGFyZ2V0IHN1cGVyZ3JvdXAgb3IgY2hhbm5lbCAoaW4gdGhlIGZvcm1hdCBAY2hhbm5lbHVzZXJuYW1lKVxuICAgICAqIEBwYXJhbSBzaWduYWwgT3B0aW9uYWwgYEFib3J0U2lnbmFsYCB0byBjYW5jZWwgdGhlIHJlcXVlc3RcbiAgICAgKlxuICAgICAqICoqT2ZmaWNpYWwgcmVmZXJlbmNlOioqIGh0dHBzOi8vY29yZS50ZWxlZ3JhbS5vcmcvYm90cy9hcGkjbGVhdmVjaGF0XG4gICAgICovXG4gICAgbGVhdmVDaGF0KGNoYXRfaWQ6IG51bWJlciB8IHN0cmluZywgc2lnbmFsPzogQWJvcnRTaWduYWwpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMucmF3LmxlYXZlQ2hhdCh7IGNoYXRfaWQgfSwgc2lnbmFsKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBVc2UgdGhpcyBtZXRob2QgdG8gZ2V0IHVwIHRvIGRhdGUgaW5mb3JtYXRpb24gYWJvdXQgdGhlIGNoYXQgKGN1cnJlbnQgbmFtZSBvZiB0aGUgdXNlciBmb3Igb25lLW9uLW9uZSBjb252ZXJzYXRpb25zLCBjdXJyZW50IHVzZXJuYW1lIG9mIGEgdXNlciwgZ3JvdXAgb3IgY2hhbm5lbCwgZXRjLikuIFJldHVybnMgYSBDaGF0IG9iamVjdCBvbiBzdWNjZXNzLlxuICAgICAqXG4gICAgICogQHBhcmFtIGNoYXRfaWQgVW5pcXVlIGlkZW50aWZpZXIgZm9yIHRoZSB0YXJnZXQgY2hhdCBvciB1c2VybmFtZSBvZiB0aGUgdGFyZ2V0IHN1cGVyZ3JvdXAgb3IgY2hhbm5lbCAoaW4gdGhlIGZvcm1hdCBAY2hhbm5lbHVzZXJuYW1lKVxuICAgICAqIEBwYXJhbSBzaWduYWwgT3B0aW9uYWwgYEFib3J0U2lnbmFsYCB0byBjYW5jZWwgdGhlIHJlcXVlc3RcbiAgICAgKlxuICAgICAqICoqT2ZmaWNpYWwgcmVmZXJlbmNlOioqIGh0dHBzOi8vY29yZS50ZWxlZ3JhbS5vcmcvYm90cy9hcGkjZ2V0Y2hhdFxuICAgICAqL1xuICAgIGdldENoYXQoY2hhdF9pZDogbnVtYmVyIHwgc3RyaW5nLCBzaWduYWw/OiBBYm9ydFNpZ25hbCkge1xuICAgICAgICByZXR1cm4gdGhpcy5yYXcuZ2V0Q2hhdCh7IGNoYXRfaWQgfSwgc2lnbmFsKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBVc2UgdGhpcyBtZXRob2QgdG8gZ2V0IGEgbGlzdCBvZiBhZG1pbmlzdHJhdG9ycyBpbiBhIGNoYXQsIHdoaWNoIGFyZW4ndCBib3RzLiBSZXR1cm5zIGFuIEFycmF5IG9mIENoYXRNZW1iZXIgb2JqZWN0cy5cbiAgICAgKlxuICAgICAqIEBwYXJhbSBjaGF0X2lkIFVuaXF1ZSBpZGVudGlmaWVyIGZvciB0aGUgdGFyZ2V0IGNoYXQgb3IgdXNlcm5hbWUgb2YgdGhlIHRhcmdldCBzdXBlcmdyb3VwIG9yIGNoYW5uZWwgKGluIHRoZSBmb3JtYXQgQGNoYW5uZWx1c2VybmFtZSlcbiAgICAgKiBAcGFyYW0gc2lnbmFsIE9wdGlvbmFsIGBBYm9ydFNpZ25hbGAgdG8gY2FuY2VsIHRoZSByZXF1ZXN0XG4gICAgICpcbiAgICAgKiAqKk9mZmljaWFsIHJlZmVyZW5jZToqKiBodHRwczovL2NvcmUudGVsZWdyYW0ub3JnL2JvdHMvYXBpI2dldGNoYXRhZG1pbmlzdHJhdG9yc1xuICAgICAqL1xuICAgIGdldENoYXRBZG1pbmlzdHJhdG9ycyhjaGF0X2lkOiBudW1iZXIgfCBzdHJpbmcsIHNpZ25hbD86IEFib3J0U2lnbmFsKSB7XG4gICAgICAgIHJldHVybiB0aGlzLnJhdy5nZXRDaGF0QWRtaW5pc3RyYXRvcnMoeyBjaGF0X2lkIH0sIHNpZ25hbCk7XG4gICAgfVxuXG4gICAgLyoqIEBkZXByZWNhdGVkIFVzZSBgZ2V0Q2hhdE1lbWJlckNvdW50YCBpbnN0ZWFkLiAqL1xuICAgIGdldENoYXRNZW1iZXJzQ291bnQoLi4uYXJnczogUGFyYW1ldGVyczxBcGlbXCJnZXRDaGF0TWVtYmVyQ291bnRcIl0+KSB7XG4gICAgICAgIHJldHVybiB0aGlzLmdldENoYXRNZW1iZXJDb3VudCguLi5hcmdzKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBVc2UgdGhpcyBtZXRob2QgdG8gZ2V0IHRoZSBudW1iZXIgb2YgbWVtYmVycyBpbiBhIGNoYXQuIFJldHVybnMgSW50IG9uIHN1Y2Nlc3MuXG4gICAgICpcbiAgICAgKiBAcGFyYW0gY2hhdF9pZCBVbmlxdWUgaWRlbnRpZmllciBmb3IgdGhlIHRhcmdldCBjaGF0IG9yIHVzZXJuYW1lIG9mIHRoZSB0YXJnZXQgc3VwZXJncm91cCBvciBjaGFubmVsIChpbiB0aGUgZm9ybWF0IEBjaGFubmVsdXNlcm5hbWUpXG4gICAgICogQHBhcmFtIHNpZ25hbCBPcHRpb25hbCBgQWJvcnRTaWduYWxgIHRvIGNhbmNlbCB0aGUgcmVxdWVzdFxuICAgICAqXG4gICAgICogKipPZmZpY2lhbCByZWZlcmVuY2U6KiogaHR0cHM6Ly9jb3JlLnRlbGVncmFtLm9yZy9ib3RzL2FwaSNnZXRjaGF0bWVtYmVyY291bnRcbiAgICAgKi9cbiAgICBnZXRDaGF0TWVtYmVyQ291bnQoY2hhdF9pZDogbnVtYmVyIHwgc3RyaW5nLCBzaWduYWw/OiBBYm9ydFNpZ25hbCkge1xuICAgICAgICByZXR1cm4gdGhpcy5yYXcuZ2V0Q2hhdE1lbWJlckNvdW50KHsgY2hhdF9pZCB9LCBzaWduYWwpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFVzZSB0aGlzIG1ldGhvZCB0byBnZXQgaW5mb3JtYXRpb24gYWJvdXQgYSBtZW1iZXIgb2YgYSBjaGF0LiBUaGUgbWV0aG9kIGlzIGd1YXJhbnRlZWQgdG8gd29yayBvbmx5IGlmIHRoZSBib3QgaXMgYW4gYWRtaW5pc3RyYXRvciBpbiB0aGUgY2hhdC4gUmV0dXJucyBhIENoYXRNZW1iZXIgb2JqZWN0IG9uIHN1Y2Nlc3MuXG4gICAgICpcbiAgICAgKiBAcGFyYW0gY2hhdF9pZCBVbmlxdWUgaWRlbnRpZmllciBmb3IgdGhlIHRhcmdldCBjaGF0IG9yIHVzZXJuYW1lIG9mIHRoZSB0YXJnZXQgc3VwZXJncm91cCBvciBjaGFubmVsIChpbiB0aGUgZm9ybWF0IEBjaGFubmVsdXNlcm5hbWUpXG4gICAgICogQHBhcmFtIHVzZXJfaWQgVW5pcXVlIGlkZW50aWZpZXIgb2YgdGhlIHRhcmdldCB1c2VyXG4gICAgICogQHBhcmFtIHNpZ25hbCBPcHRpb25hbCBgQWJvcnRTaWduYWxgIHRvIGNhbmNlbCB0aGUgcmVxdWVzdFxuICAgICAqXG4gICAgICogKipPZmZpY2lhbCByZWZlcmVuY2U6KiogaHR0cHM6Ly9jb3JlLnRlbGVncmFtLm9yZy9ib3RzL2FwaSNnZXRjaGF0bWVtYmVyXG4gICAgICovXG4gICAgZ2V0Q2hhdE1lbWJlcihcbiAgICAgICAgY2hhdF9pZDogbnVtYmVyIHwgc3RyaW5nLFxuICAgICAgICB1c2VyX2lkOiBudW1iZXIsXG4gICAgICAgIHNpZ25hbD86IEFib3J0U2lnbmFsLFxuICAgICkge1xuICAgICAgICByZXR1cm4gdGhpcy5yYXcuZ2V0Q2hhdE1lbWJlcih7IGNoYXRfaWQsIHVzZXJfaWQgfSwgc2lnbmFsKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBVc2UgdGhpcyBtZXRob2QgdG8gc2V0IGEgbmV3IGdyb3VwIHN0aWNrZXIgc2V0IGZvciBhIHN1cGVyZ3JvdXAuIFRoZSBib3QgbXVzdCBiZSBhbiBhZG1pbmlzdHJhdG9yIGluIHRoZSBjaGF0IGZvciB0aGlzIHRvIHdvcmsgYW5kIG11c3QgaGF2ZSB0aGUgYXBwcm9wcmlhdGUgYWRtaW5pc3RyYXRvciByaWdodHMuIFVzZSB0aGUgZmllbGQgY2FuX3NldF9zdGlja2VyX3NldCBseSByZXR1cm5lZCBpbiBnZXRDaGF0IHJlcXVlc3RzIHRvIGNoZWNrIGlmIHRoZSBib3QgY2FuIHVzZSB0aGlzIG1ldGhvZC4gUmV0dXJucyBUcnVlIG9uIHN1Y2Nlc3MuXG4gICAgICpcbiAgICAgKiBAcGFyYW0gY2hhdF9pZCBVbmlxdWUgaWRlbnRpZmllciBmb3IgdGhlIHRhcmdldCBjaGF0IG9yIHVzZXJuYW1lIG9mIHRoZSB0YXJnZXQgc3VwZXJncm91cCAoaW4gdGhlIGZvcm1hdCBAc3VwZXJncm91cHVzZXJuYW1lKVxuICAgICAqIEBwYXJhbSBzdGlja2VyX3NldF9uYW1lIE5hbWUgb2YgdGhlIHN0aWNrZXIgc2V0IHRvIGJlIHNldCBhcyB0aGUgZ3JvdXAgc3RpY2tlciBzZXRcbiAgICAgKiBAcGFyYW0gc2lnbmFsIE9wdGlvbmFsIGBBYm9ydFNpZ25hbGAgdG8gY2FuY2VsIHRoZSByZXF1ZXN0XG4gICAgICpcbiAgICAgKiAqKk9mZmljaWFsIHJlZmVyZW5jZToqKiBodHRwczovL2NvcmUudGVsZWdyYW0ub3JnL2JvdHMvYXBpI3NldGNoYXRzdGlja2Vyc2V0XG4gICAgICovXG4gICAgc2V0Q2hhdFN0aWNrZXJTZXQoXG4gICAgICAgIGNoYXRfaWQ6IG51bWJlciB8IHN0cmluZyxcbiAgICAgICAgc3RpY2tlcl9zZXRfbmFtZTogc3RyaW5nLFxuICAgICAgICBzaWduYWw/OiBBYm9ydFNpZ25hbCxcbiAgICApIHtcbiAgICAgICAgcmV0dXJuIHRoaXMucmF3LnNldENoYXRTdGlja2VyU2V0KFxuICAgICAgICAgICAgeyBjaGF0X2lkLCBzdGlja2VyX3NldF9uYW1lIH0sXG4gICAgICAgICAgICBzaWduYWwsXG4gICAgICAgICk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogVXNlIHRoaXMgbWV0aG9kIHRvIGRlbGV0ZSBhIGdyb3VwIHN0aWNrZXIgc2V0IGZyb20gYSBzdXBlcmdyb3VwLiBUaGUgYm90IG11c3QgYmUgYW4gYWRtaW5pc3RyYXRvciBpbiB0aGUgY2hhdCBmb3IgdGhpcyB0byB3b3JrIGFuZCBtdXN0IGhhdmUgdGhlIGFwcHJvcHJpYXRlIGFkbWluaXN0cmF0b3IgcmlnaHRzLiBVc2UgdGhlIGZpZWxkIGNhbl9zZXRfc3RpY2tlcl9zZXQgbHkgcmV0dXJuZWQgaW4gZ2V0Q2hhdCByZXF1ZXN0cyB0byBjaGVjayBpZiB0aGUgYm90IGNhbiB1c2UgdGhpcyBtZXRob2QuIFJldHVybnMgVHJ1ZSBvbiBzdWNjZXNzLlxuICAgICAqXG4gICAgICogQHBhcmFtIGNoYXRfaWQgVW5pcXVlIGlkZW50aWZpZXIgZm9yIHRoZSB0YXJnZXQgY2hhdCBvciB1c2VybmFtZSBvZiB0aGUgdGFyZ2V0IHN1cGVyZ3JvdXAgKGluIHRoZSBmb3JtYXQgQHN1cGVyZ3JvdXB1c2VybmFtZSlcbiAgICAgKiBAcGFyYW0gc2lnbmFsIE9wdGlvbmFsIGBBYm9ydFNpZ25hbGAgdG8gY2FuY2VsIHRoZSByZXF1ZXN0XG4gICAgICpcbiAgICAgKiAqKk9mZmljaWFsIHJlZmVyZW5jZToqKiBodHRwczovL2NvcmUudGVsZWdyYW0ub3JnL2JvdHMvYXBpI2RlbGV0ZWNoYXRzdGlja2Vyc2V0XG4gICAgICovXG4gICAgZGVsZXRlQ2hhdFN0aWNrZXJTZXQoY2hhdF9pZDogbnVtYmVyIHwgc3RyaW5nLCBzaWduYWw/OiBBYm9ydFNpZ25hbCkge1xuICAgICAgICByZXR1cm4gdGhpcy5yYXcuZGVsZXRlQ2hhdFN0aWNrZXJTZXQoeyBjaGF0X2lkIH0sIHNpZ25hbCk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogVXNlIHRoaXMgbWV0aG9kIHRvIGdldCBjdXN0b20gZW1vamkgc3RpY2tlcnMsIHdoaWNoIGNhbiBiZSB1c2VkIGFzIGEgZm9ydW0gdG9waWMgaWNvbiBieSBhbnkgdXNlci4gUmVxdWlyZXMgbm8gcGFyYW1ldGVycy4gUmV0dXJucyBhbiBBcnJheSBvZiBTdGlja2VyIG9iamVjdHMuXG4gICAgICpcbiAgICAgKiBAcGFyYW0gc2lnbmFsIE9wdGlvbmFsIGBBYm9ydFNpZ25hbGAgdG8gY2FuY2VsIHRoZSByZXF1ZXN0XG4gICAgICpcbiAgICAgKiAqKk9mZmljaWFsIHJlZmVyZW5jZToqKiBodHRwczovL2NvcmUudGVsZWdyYW0ub3JnL2JvdHMvYXBpI2dldGZvcnVtdG9waWNpY29uc3RpY2tlcnNcbiAgICAgKi9cbiAgICBnZXRGb3J1bVRvcGljSWNvblN0aWNrZXJzKHNpZ25hbD86IEFib3J0U2lnbmFsKSB7XG4gICAgICAgIHJldHVybiB0aGlzLnJhdy5nZXRGb3J1bVRvcGljSWNvblN0aWNrZXJzKHNpZ25hbCk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogVXNlIHRoaXMgbWV0aG9kIHRvIGNyZWF0ZSBhIHRvcGljIGluIGEgZm9ydW0gc3VwZXJncm91cCBjaGF0LiBUaGUgYm90IG11c3QgYmUgYW4gYWRtaW5pc3RyYXRvciBpbiB0aGUgY2hhdCBmb3IgdGhpcyB0byB3b3JrIGFuZCBtdXN0IGhhdmUgdGhlIGNhbl9tYW5hZ2VfdG9waWNzIGFkbWluaXN0cmF0b3IgcmlnaHRzLiBSZXR1cm5zIGluZm9ybWF0aW9uIGFib3V0IHRoZSBjcmVhdGVkIHRvcGljIGFzIGEgRm9ydW1Ub3BpYyBvYmplY3QuXG4gICAgICpcbiAgICAgKiBAcGFyYW0gY2hhdF9pZCBVbmlxdWUgaWRlbnRpZmllciBmb3IgdGhlIHRhcmdldCBjaGF0IG9yIHVzZXJuYW1lIG9mIHRoZSB0YXJnZXQgc3VwZXJncm91cCAoaW4gdGhlIGZvcm1hdCBAc3VwZXJncm91cHVzZXJuYW1lKVxuICAgICAqIEBwYXJhbSBuYW1lIFRvcGljIG5hbWUsIDEtMTI4IGNoYXJhY3RlcnNcbiAgICAgKiBAcGFyYW0gb3RoZXIgT3B0aW9uYWwgcmVtYWluaW5nIHBhcmFtZXRlcnMsIGNvbmZlciB0aGUgb2ZmaWNpYWwgcmVmZXJlbmNlIGJlbG93XG4gICAgICogQHBhcmFtIHNpZ25hbCBPcHRpb25hbCBgQWJvcnRTaWduYWxgIHRvIGNhbmNlbCB0aGUgcmVxdWVzdFxuICAgICAqXG4gICAgICogKipPZmZpY2lhbCByZWZlcmVuY2U6KiogaHR0cHM6Ly9jb3JlLnRlbGVncmFtLm9yZy9ib3RzL2FwaSNjcmVhdGVmb3J1bXRvcGljXG4gICAgICovXG4gICAgY3JlYXRlRm9ydW1Ub3BpYyhcbiAgICAgICAgY2hhdF9pZDogbnVtYmVyIHwgc3RyaW5nLFxuICAgICAgICBuYW1lOiBzdHJpbmcsXG4gICAgICAgIG90aGVyPzogT3RoZXI8UiwgXCJjcmVhdGVGb3J1bVRvcGljXCIsIFwiY2hhdF9pZFwiIHwgXCJuYW1lXCI+LFxuICAgICAgICBzaWduYWw/OiBBYm9ydFNpZ25hbCxcbiAgICApIHtcbiAgICAgICAgcmV0dXJuIHRoaXMucmF3LmNyZWF0ZUZvcnVtVG9waWMoeyBjaGF0X2lkLCBuYW1lLCAuLi5vdGhlciB9LCBzaWduYWwpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFVzZSB0aGlzIG1ldGhvZCB0byBlZGl0IG5hbWUgYW5kIGljb24gb2YgYSB0b3BpYyBpbiBhIGZvcnVtIHN1cGVyZ3JvdXAgY2hhdC4gVGhlIGJvdCBtdXN0IGJlIGFuIGFkbWluaXN0cmF0b3IgaW4gdGhlIGNoYXQgZm9yIHRoaXMgdG8gd29yayBhbmQgbXVzdCBoYXZlIGNhbl9tYW5hZ2VfdG9waWNzIGFkbWluaXN0cmF0b3IgcmlnaHRzLCB1bmxlc3MgaXQgaXMgdGhlIGNyZWF0b3Igb2YgdGhlIHRvcGljLiBSZXR1cm5zIFRydWUgb24gc3VjY2Vzcy5cbiAgICAgKlxuICAgICAqIEBwYXJhbSBjaGF0X2lkIFVuaXF1ZSBpZGVudGlmaWVyIGZvciB0aGUgdGFyZ2V0IGNoYXQgb3IgdXNlcm5hbWUgb2YgdGhlIHRhcmdldCBzdXBlcmdyb3VwIChpbiB0aGUgZm9ybWF0IEBzdXBlcmdyb3VwdXNlcm5hbWUpXG4gICAgICogQHBhcmFtIG1lc3NhZ2VfdGhyZWFkX2lkIFVuaXF1ZSBpZGVudGlmaWVyIGZvciB0aGUgdGFyZ2V0IG1lc3NhZ2UgdGhyZWFkIG9mIHRoZSBmb3J1bSB0b3BpY1xuICAgICAqIEBwYXJhbSBvdGhlciBPcHRpb25hbCByZW1haW5pbmcgcGFyYW1ldGVycywgY29uZmVyIHRoZSBvZmZpY2lhbCByZWZlcmVuY2UgYmVsb3dcbiAgICAgKiBAcGFyYW0gc2lnbmFsIE9wdGlvbmFsIGBBYm9ydFNpZ25hbGAgdG8gY2FuY2VsIHRoZSByZXF1ZXN0XG4gICAgICpcbiAgICAgKiAqKk9mZmljaWFsIHJlZmVyZW5jZToqKiBodHRwczovL2NvcmUudGVsZWdyYW0ub3JnL2JvdHMvYXBpI2VkaXRmb3J1bXRvcGljXG4gICAgICovXG4gICAgZWRpdEZvcnVtVG9waWMoXG4gICAgICAgIGNoYXRfaWQ6IG51bWJlciB8IHN0cmluZyxcbiAgICAgICAgbWVzc2FnZV90aHJlYWRfaWQ6IG51bWJlcixcbiAgICAgICAgb3RoZXI/OiBPdGhlcjxSLCBcImVkaXRGb3J1bVRvcGljXCIsIFwiY2hhdF9pZFwiIHwgXCJtZXNzYWdlX3RocmVhZF9pZFwiPixcbiAgICAgICAgc2lnbmFsPzogQWJvcnRTaWduYWwsXG4gICAgKSB7XG4gICAgICAgIHJldHVybiB0aGlzLnJhdy5lZGl0Rm9ydW1Ub3BpYyhcbiAgICAgICAgICAgIHsgY2hhdF9pZCwgbWVzc2FnZV90aHJlYWRfaWQsIC4uLm90aGVyIH0sXG4gICAgICAgICAgICBzaWduYWwsXG4gICAgICAgICk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogVXNlIHRoaXMgbWV0aG9kIHRvIGNsb3NlIGFuIG9wZW4gdG9waWMgaW4gYSBmb3J1bSBzdXBlcmdyb3VwIGNoYXQuIFRoZSBib3QgbXVzdCBiZSBhbiBhZG1pbmlzdHJhdG9yIGluIHRoZSBjaGF0IGZvciB0aGlzIHRvIHdvcmsgYW5kIG11c3QgaGF2ZSB0aGUgY2FuX21hbmFnZV90b3BpY3MgYWRtaW5pc3RyYXRvciByaWdodHMsIHVubGVzcyBpdCBpcyB0aGUgY3JlYXRvciBvZiB0aGUgdG9waWMuIFJldHVybnMgVHJ1ZSBvbiBzdWNjZXNzLlxuICAgICAqXG4gICAgICogQHBhcmFtIGNoYXRfaWQgVW5pcXVlIGlkZW50aWZpZXIgZm9yIHRoZSB0YXJnZXQgY2hhdCBvciB1c2VybmFtZSBvZiB0aGUgdGFyZ2V0IHN1cGVyZ3JvdXAgKGluIHRoZSBmb3JtYXQgQHN1cGVyZ3JvdXB1c2VybmFtZSlcbiAgICAgKiBAcGFyYW0gbWVzc2FnZV90aHJlYWRfaWQgVW5pcXVlIGlkZW50aWZpZXIgZm9yIHRoZSB0YXJnZXQgbWVzc2FnZSB0aHJlYWQgb2YgdGhlIGZvcnVtIHRvcGljXG4gICAgICogQHBhcmFtIHNpZ25hbCBPcHRpb25hbCBgQWJvcnRTaWduYWxgIHRvIGNhbmNlbCB0aGUgcmVxdWVzdFxuICAgICAqXG4gICAgICogKipPZmZpY2lhbCByZWZlcmVuY2U6KiogaHR0cHM6Ly9jb3JlLnRlbGVncmFtLm9yZy9ib3RzL2FwaSNjbG9zZWZvcnVtdG9waWNcbiAgICAgKi9cbiAgICBjbG9zZUZvcnVtVG9waWMoXG4gICAgICAgIGNoYXRfaWQ6IG51bWJlciB8IHN0cmluZyxcbiAgICAgICAgbWVzc2FnZV90aHJlYWRfaWQ6IG51bWJlcixcbiAgICAgICAgc2lnbmFsPzogQWJvcnRTaWduYWwsXG4gICAgKSB7XG4gICAgICAgIHJldHVybiB0aGlzLnJhdy5jbG9zZUZvcnVtVG9waWMoeyBjaGF0X2lkLCBtZXNzYWdlX3RocmVhZF9pZCB9LCBzaWduYWwpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFVzZSB0aGlzIG1ldGhvZCB0byByZW9wZW4gYSBjbG9zZWQgdG9waWMgaW4gYSBmb3J1bSBzdXBlcmdyb3VwIGNoYXQuIFRoZSBib3QgbXVzdCBiZSBhbiBhZG1pbmlzdHJhdG9yIGluIHRoZSBjaGF0IGZvciB0aGlzIHRvIHdvcmsgYW5kIG11c3QgaGF2ZSB0aGUgY2FuX21hbmFnZV90b3BpY3MgYWRtaW5pc3RyYXRvciByaWdodHMsIHVubGVzcyBpdCBpcyB0aGUgY3JlYXRvciBvZiB0aGUgdG9waWMuIFJldHVybnMgVHJ1ZSBvbiBzdWNjZXNzLlxuICAgICAqXG4gICAgICogQHBhcmFtIGNoYXRfaWQgVW5pcXVlIGlkZW50aWZpZXIgZm9yIHRoZSB0YXJnZXQgY2hhdCBvciB1c2VybmFtZSBvZiB0aGUgdGFyZ2V0IHN1cGVyZ3JvdXAgKGluIHRoZSBmb3JtYXQgQHN1cGVyZ3JvdXB1c2VybmFtZSlcbiAgICAgKiBAcGFyYW0gbWVzc2FnZV90aHJlYWRfaWQgVW5pcXVlIGlkZW50aWZpZXIgZm9yIHRoZSB0YXJnZXQgbWVzc2FnZSB0aHJlYWQgb2YgdGhlIGZvcnVtIHRvcGljXG4gICAgICogQHBhcmFtIHNpZ25hbCBPcHRpb25hbCBgQWJvcnRTaWduYWxgIHRvIGNhbmNlbCB0aGUgcmVxdWVzdFxuICAgICAqXG4gICAgICogKipPZmZpY2lhbCByZWZlcmVuY2U6KiogaHR0cHM6Ly9jb3JlLnRlbGVncmFtLm9yZy9ib3RzL2FwaSNyZW9wZW5mb3J1bXRvcGljXG4gICAgICovXG4gICAgcmVvcGVuRm9ydW1Ub3BpYyhcbiAgICAgICAgY2hhdF9pZDogbnVtYmVyIHwgc3RyaW5nLFxuICAgICAgICBtZXNzYWdlX3RocmVhZF9pZDogbnVtYmVyLFxuICAgICAgICBzaWduYWw/OiBBYm9ydFNpZ25hbCxcbiAgICApIHtcbiAgICAgICAgcmV0dXJuIHRoaXMucmF3LnJlb3BlbkZvcnVtVG9waWMoXG4gICAgICAgICAgICB7IGNoYXRfaWQsIG1lc3NhZ2VfdGhyZWFkX2lkIH0sXG4gICAgICAgICAgICBzaWduYWwsXG4gICAgICAgICk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogVXNlIHRoaXMgbWV0aG9kIHRvIGRlbGV0ZSBhIGZvcnVtIHRvcGljIGFsb25nIHdpdGggYWxsIGl0cyBtZXNzYWdlcyBpbiBhIGZvcnVtIHN1cGVyZ3JvdXAgY2hhdC4gVGhlIGJvdCBtdXN0IGJlIGFuIGFkbWluaXN0cmF0b3IgaW4gdGhlIGNoYXQgZm9yIHRoaXMgdG8gd29yayBhbmQgbXVzdCBoYXZlIHRoZSBjYW5fZGVsZXRlX21lc3NhZ2VzIGFkbWluaXN0cmF0b3IgcmlnaHRzLiBSZXR1cm5zIFRydWUgb24gc3VjY2Vzcy5cbiAgICAgKlxuICAgICAqIEBwYXJhbSBjaGF0X2lkIFVuaXF1ZSBpZGVudGlmaWVyIGZvciB0aGUgdGFyZ2V0IGNoYXQgb3IgdXNlcm5hbWUgb2YgdGhlIHRhcmdldCBzdXBlcmdyb3VwIChpbiB0aGUgZm9ybWF0IEBzdXBlcmdyb3VwdXNlcm5hbWUpXG4gICAgICogQHBhcmFtIG1lc3NhZ2VfdGhyZWFkX2lkIFVuaXF1ZSBpZGVudGlmaWVyIGZvciB0aGUgdGFyZ2V0IG1lc3NhZ2UgdGhyZWFkIG9mIHRoZSBmb3J1bSB0b3BpY1xuICAgICAqIEBwYXJhbSBzaWduYWwgT3B0aW9uYWwgYEFib3J0U2lnbmFsYCB0byBjYW5jZWwgdGhlIHJlcXVlc3RcbiAgICAgKlxuICAgICAqICoqT2ZmaWNpYWwgcmVmZXJlbmNlOioqIGh0dHBzOi8vY29yZS50ZWxlZ3JhbS5vcmcvYm90cy9hcGkjZGVsZXRlZm9ydW10b3BpY1xuICAgICAqL1xuICAgIGRlbGV0ZUZvcnVtVG9waWMoXG4gICAgICAgIGNoYXRfaWQ6IG51bWJlciB8IHN0cmluZyxcbiAgICAgICAgbWVzc2FnZV90aHJlYWRfaWQ6IG51bWJlcixcbiAgICAgICAgc2lnbmFsPzogQWJvcnRTaWduYWwsXG4gICAgKSB7XG4gICAgICAgIHJldHVybiB0aGlzLnJhdy5kZWxldGVGb3J1bVRvcGljKFxuICAgICAgICAgICAgeyBjaGF0X2lkLCBtZXNzYWdlX3RocmVhZF9pZCB9LFxuICAgICAgICAgICAgc2lnbmFsLFxuICAgICAgICApO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFVzZSB0aGlzIG1ldGhvZCB0byBjbGVhciB0aGUgbGlzdCBvZiBwaW5uZWQgbWVzc2FnZXMgaW4gYSBmb3J1bSB0b3BpYy4gVGhlIGJvdCBtdXN0IGJlIGFuIGFkbWluaXN0cmF0b3IgaW4gdGhlIGNoYXQgZm9yIHRoaXMgdG8gd29yayBhbmQgbXVzdCBoYXZlIHRoZSBjYW5fcGluX21lc3NhZ2VzIGFkbWluaXN0cmF0b3IgcmlnaHQgaW4gdGhlIHN1cGVyZ3JvdXAuIFJldHVybnMgVHJ1ZSBvbiBzdWNjZXNzLlxuICAgICAqXG4gICAgICogQHBhcmFtIGNoYXRfaWQgVW5pcXVlIGlkZW50aWZpZXIgZm9yIHRoZSB0YXJnZXQgY2hhdCBvciB1c2VybmFtZSBvZiB0aGUgdGFyZ2V0IHN1cGVyZ3JvdXAgKGluIHRoZSBmb3JtYXQgQHN1cGVyZ3JvdXB1c2VybmFtZSlcbiAgICAgKiBAcGFyYW0gbWVzc2FnZV90aHJlYWRfaWQgVW5pcXVlIGlkZW50aWZpZXIgZm9yIHRoZSB0YXJnZXQgbWVzc2FnZSB0aHJlYWQgb2YgdGhlIGZvcnVtIHRvcGljXG4gICAgICogQHBhcmFtIHNpZ25hbCBPcHRpb25hbCBgQWJvcnRTaWduYWxgIHRvIGNhbmNlbCB0aGUgcmVxdWVzdFxuICAgICAqXG4gICAgICogKipPZmZpY2lhbCByZWZlcmVuY2U6KiogaHR0cHM6Ly9jb3JlLnRlbGVncmFtLm9yZy9ib3RzL2FwaSN1bnBpbmFsbGZvcnVtdG9waWNtZXNzYWdlc1xuICAgICAqL1xuICAgIHVucGluQWxsRm9ydW1Ub3BpY01lc3NhZ2VzKFxuICAgICAgICBjaGF0X2lkOiBudW1iZXIgfCBzdHJpbmcsXG4gICAgICAgIG1lc3NhZ2VfdGhyZWFkX2lkOiBudW1iZXIsXG4gICAgICAgIHNpZ25hbD86IEFib3J0U2lnbmFsLFxuICAgICkge1xuICAgICAgICByZXR1cm4gdGhpcy5yYXcudW5waW5BbGxGb3J1bVRvcGljTWVzc2FnZXMoXG4gICAgICAgICAgICB7IGNoYXRfaWQsIG1lc3NhZ2VfdGhyZWFkX2lkIH0sXG4gICAgICAgICAgICBzaWduYWwsXG4gICAgICAgICk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogVXNlIHRoaXMgbWV0aG9kIHRvIGVkaXQgdGhlIG5hbWUgb2YgdGhlICdHZW5lcmFsJyB0b3BpYyBpbiBhIGZvcnVtIHN1cGVyZ3JvdXAgY2hhdC4gVGhlIGJvdCBtdXN0IGJlIGFuIGFkbWluaXN0cmF0b3IgaW4gdGhlIGNoYXQgZm9yIHRoaXMgdG8gd29yayBhbmQgbXVzdCBoYXZlIGNhbl9tYW5hZ2VfdG9waWNzIGFkbWluaXN0cmF0b3IgcmlnaHRzLiBSZXR1cm5zIFRydWUgb24gc3VjY2Vzcy5cbiAgICAgKlxuICAgICAqIEBwYXJhbSBjaGF0X2lkIFVuaXF1ZSBpZGVudGlmaWVyIGZvciB0aGUgdGFyZ2V0IGNoYXQgb3IgdXNlcm5hbWUgb2YgdGhlIHRhcmdldCBzdXBlcmdyb3VwIChpbiB0aGUgZm9ybWF0IEBzdXBlcmdyb3VwdXNlcm5hbWUpXG4gICAgICogQHBhcmFtIG5hbWUgTmV3IHRvcGljIG5hbWUsIDEtMTI4IGNoYXJhY3RlcnNcbiAgICAgKiBAcGFyYW0gc2lnbmFsIE9wdGlvbmFsIGBBYm9ydFNpZ25hbGAgdG8gY2FuY2VsIHRoZSByZXF1ZXN0XG4gICAgICpcbiAgICAgKiAqKk9mZmljaWFsIHJlZmVyZW5jZToqKiBodHRwczovL2NvcmUudGVsZWdyYW0ub3JnL2JvdHMvYXBpI2VkaXRnZW5lcmFsZm9ydW10b3BpY1xuICAgICAqL1xuICAgIGVkaXRHZW5lcmFsRm9ydW1Ub3BpYyhcbiAgICAgICAgY2hhdF9pZDogbnVtYmVyIHwgc3RyaW5nLFxuICAgICAgICBuYW1lOiBzdHJpbmcsXG4gICAgICAgIHNpZ25hbD86IEFib3J0U2lnbmFsLFxuICAgICkge1xuICAgICAgICByZXR1cm4gdGhpcy5yYXcuZWRpdEdlbmVyYWxGb3J1bVRvcGljKHsgY2hhdF9pZCwgbmFtZSB9LCBzaWduYWwpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFVzZSB0aGlzIG1ldGhvZCB0byBjbG9zZSBhbiBvcGVuICdHZW5lcmFsJyB0b3BpYyBpbiBhIGZvcnVtIHN1cGVyZ3JvdXAgY2hhdC4gVGhlIGJvdCBtdXN0IGJlIGFuIGFkbWluaXN0cmF0b3IgaW4gdGhlIGNoYXQgZm9yIHRoaXMgdG8gd29yayBhbmQgbXVzdCBoYXZlIHRoZSBjYW5fbWFuYWdlX3RvcGljcyBhZG1pbmlzdHJhdG9yIHJpZ2h0cy4gUmV0dXJucyBUcnVlIG9uIHN1Y2Nlc3MuXG4gICAgICpcbiAgICAgKiBAcGFyYW0gY2hhdF9pZCBVbmlxdWUgaWRlbnRpZmllciBmb3IgdGhlIHRhcmdldCBjaGF0IG9yIHVzZXJuYW1lIG9mIHRoZSB0YXJnZXQgc3VwZXJncm91cCAoaW4gdGhlIGZvcm1hdCBAc3VwZXJncm91cHVzZXJuYW1lKVxuICAgICAqIEBwYXJhbSBzaWduYWwgT3B0aW9uYWwgYEFib3J0U2lnbmFsYCB0byBjYW5jZWwgdGhlIHJlcXVlc3RcbiAgICAgKlxuICAgICAqICoqT2ZmaWNpYWwgcmVmZXJlbmNlOioqIGh0dHBzOi8vY29yZS50ZWxlZ3JhbS5vcmcvYm90cy9hcGkjY2xvc2VnZW5lcmFsZm9ydW10b3BpY1xuICAgICAqL1xuICAgIGNsb3NlR2VuZXJhbEZvcnVtVG9waWMoY2hhdF9pZDogbnVtYmVyIHwgc3RyaW5nLCBzaWduYWw/OiBBYm9ydFNpZ25hbCkge1xuICAgICAgICByZXR1cm4gdGhpcy5yYXcuY2xvc2VHZW5lcmFsRm9ydW1Ub3BpYyh7IGNoYXRfaWQgfSwgc2lnbmFsKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBVc2UgdGhpcyBtZXRob2QgdG8gcmVvcGVuIGEgY2xvc2VkICdHZW5lcmFsJyB0b3BpYyBpbiBhIGZvcnVtIHN1cGVyZ3JvdXAgY2hhdC4gVGhlIGJvdCBtdXN0IGJlIGFuIGFkbWluaXN0cmF0b3IgaW4gdGhlIGNoYXQgZm9yIHRoaXMgdG8gd29yayBhbmQgbXVzdCBoYXZlIHRoZSBjYW5fbWFuYWdlX3RvcGljcyBhZG1pbmlzdHJhdG9yIHJpZ2h0cy4gVGhlIHRvcGljIHdpbGwgYmUgYXV0b21hdGljYWxseSB1bmhpZGRlbiBpZiBpdCB3YXMgaGlkZGVuLiBSZXR1cm5zIFRydWUgb24gc3VjY2Vzcy4gICAgICpcbiAgICAgKlxuICAgICAqIEBwYXJhbSBjaGF0X2lkIFVuaXF1ZSBpZGVudGlmaWVyIGZvciB0aGUgdGFyZ2V0IGNoYXQgb3IgdXNlcm5hbWUgb2YgdGhlIHRhcmdldCBzdXBlcmdyb3VwIChpbiB0aGUgZm9ybWF0IEBzdXBlcmdyb3VwdXNlcm5hbWUpXG4gICAgICogQHBhcmFtIHNpZ25hbCBPcHRpb25hbCBgQWJvcnRTaWduYWxgIHRvIGNhbmNlbCB0aGUgcmVxdWVzdFxuICAgICAqXG4gICAgICogKipPZmZpY2lhbCByZWZlcmVuY2U6KiogaHR0cHM6Ly9jb3JlLnRlbGVncmFtLm9yZy9ib3RzL2FwaSNyZW9wZW5nZW5lcmFsZm9ydW10b3BpY1xuICAgICAqL1xuICAgIHJlb3BlbkdlbmVyYWxGb3J1bVRvcGljKGNoYXRfaWQ6IG51bWJlciB8IHN0cmluZywgc2lnbmFsPzogQWJvcnRTaWduYWwpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMucmF3LnJlb3BlbkdlbmVyYWxGb3J1bVRvcGljKHsgY2hhdF9pZCB9LCBzaWduYWwpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFVzZSB0aGlzIG1ldGhvZCB0byBoaWRlIHRoZSAnR2VuZXJhbCcgdG9waWMgaW4gYSBmb3J1bSBzdXBlcmdyb3VwIGNoYXQuIFRoZSBib3QgbXVzdCBiZSBhbiBhZG1pbmlzdHJhdG9yIGluIHRoZSBjaGF0IGZvciB0aGlzIHRvIHdvcmsgYW5kIG11c3QgaGF2ZSB0aGUgY2FuX21hbmFnZV90b3BpY3MgYWRtaW5pc3RyYXRvciByaWdodHMuIFRoZSB0b3BpYyB3aWxsIGJlIGF1dG9tYXRpY2FsbHkgY2xvc2VkIGlmIGl0IHdhcyBvcGVuLiBSZXR1cm5zIFRydWUgb24gc3VjY2Vzcy5cbiAgICAgKlxuICAgICAqIEBwYXJhbSBjaGF0X2lkIFVuaXF1ZSBpZGVudGlmaWVyIGZvciB0aGUgdGFyZ2V0IGNoYXQgb3IgdXNlcm5hbWUgb2YgdGhlIHRhcmdldCBzdXBlcmdyb3VwIChpbiB0aGUgZm9ybWF0IEBzdXBlcmdyb3VwdXNlcm5hbWUpXG4gICAgICogQHBhcmFtIHNpZ25hbCBPcHRpb25hbCBgQWJvcnRTaWduYWxgIHRvIGNhbmNlbCB0aGUgcmVxdWVzdFxuICAgICAqXG4gICAgICogKipPZmZpY2lhbCByZWZlcmVuY2U6KiogaHR0cHM6Ly9jb3JlLnRlbGVncmFtLm9yZy9ib3RzL2FwaSNoaWRlZ2VuZXJhbGZvcnVtdG9waWNcbiAgICAgKi9cbiAgICBoaWRlR2VuZXJhbEZvcnVtVG9waWMoY2hhdF9pZDogbnVtYmVyIHwgc3RyaW5nLCBzaWduYWw/OiBBYm9ydFNpZ25hbCkge1xuICAgICAgICByZXR1cm4gdGhpcy5yYXcuaGlkZUdlbmVyYWxGb3J1bVRvcGljKHsgY2hhdF9pZCB9LCBzaWduYWwpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFVzZSB0aGlzIG1ldGhvZCB0byB1bmhpZGUgdGhlICdHZW5lcmFsJyB0b3BpYyBpbiBhIGZvcnVtIHN1cGVyZ3JvdXAgY2hhdC4gVGhlIGJvdCBtdXN0IGJlIGFuIGFkbWluaXN0cmF0b3IgaW4gdGhlIGNoYXQgZm9yIHRoaXMgdG8gd29yayBhbmQgbXVzdCBoYXZlIHRoZSBjYW5fbWFuYWdlX3RvcGljcyBhZG1pbmlzdHJhdG9yIHJpZ2h0cy4gUmV0dXJucyBUcnVlIG9uIHN1Y2Nlc3MuXG4gICAgICpcbiAgICAgKiBAcGFyYW0gY2hhdF9pZCBVbmlxdWUgaWRlbnRpZmllciBmb3IgdGhlIHRhcmdldCBjaGF0IG9yIHVzZXJuYW1lIG9mIHRoZSB0YXJnZXQgc3VwZXJncm91cCAoaW4gdGhlIGZvcm1hdCBAc3VwZXJncm91cHVzZXJuYW1lKVxuICAgICAqIEBwYXJhbSBzaWduYWwgT3B0aW9uYWwgYEFib3J0U2lnbmFsYCB0byBjYW5jZWwgdGhlIHJlcXVlc3RcbiAgICAgKlxuICAgICAqICoqT2ZmaWNpYWwgcmVmZXJlbmNlOioqIGh0dHBzOi8vY29yZS50ZWxlZ3JhbS5vcmcvYm90cy9hcGkjdW5oaWRlZ2VuZXJhbGZvcnVtdG9waWNcbiAgICAgKi9cbiAgICB1bmhpZGVHZW5lcmFsRm9ydW1Ub3BpYyhjaGF0X2lkOiBudW1iZXIgfCBzdHJpbmcsIHNpZ25hbD86IEFib3J0U2lnbmFsKSB7XG4gICAgICAgIHJldHVybiB0aGlzLnJhdy51bmhpZGVHZW5lcmFsRm9ydW1Ub3BpYyh7IGNoYXRfaWQgfSwgc2lnbmFsKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBVc2UgdGhpcyBtZXRob2QgdG8gY2xlYXIgdGhlIGxpc3Qgb2YgcGlubmVkIG1lc3NhZ2VzIGluIGEgR2VuZXJhbCBmb3J1bSB0b3BpYy4gVGhlIGJvdCBtdXN0IGJlIGFuIGFkbWluaXN0cmF0b3IgaW4gdGhlIGNoYXQgZm9yIHRoaXMgdG8gd29yayBhbmQgbXVzdCBoYXZlIHRoZSBjYW5fcGluX21lc3NhZ2VzIGFkbWluaXN0cmF0b3IgcmlnaHQgaW4gdGhlIHN1cGVyZ3JvdXAuIFJldHVybnMgVHJ1ZSBvbiBzdWNjZXNzLlxuICAgICAqXG4gICAgICogQHBhcmFtIGNoYXRfaWQgVW5pcXVlIGlkZW50aWZpZXIgZm9yIHRoZSB0YXJnZXQgY2hhdCBvciB1c2VybmFtZSBvZiB0aGUgdGFyZ2V0IHN1cGVyZ3JvdXAgKGluIHRoZSBmb3JtYXQgQHN1cGVyZ3JvdXB1c2VybmFtZSlcbiAgICAgKiBAcGFyYW0gc2lnbmFsIE9wdGlvbmFsIGBBYm9ydFNpZ25hbGAgdG8gY2FuY2VsIHRoZSByZXF1ZXN0XG4gICAgICpcbiAgICAgKiAqKk9mZmljaWFsIHJlZmVyZW5jZToqKiBodHRwczovL2NvcmUudGVsZWdyYW0ub3JnL2JvdHMvYXBpI3VucGluYWxsZ2VuZXJhbGZvcnVtdG9waWNtZXNzYWdlc1xuICAgICAqL1xuICAgIHVucGluQWxsR2VuZXJhbEZvcnVtVG9waWNNZXNzYWdlcyhcbiAgICAgICAgY2hhdF9pZDogbnVtYmVyIHwgc3RyaW5nLFxuICAgICAgICBzaWduYWw/OiBBYm9ydFNpZ25hbCxcbiAgICApIHtcbiAgICAgICAgcmV0dXJuIHRoaXMucmF3LnVucGluQWxsR2VuZXJhbEZvcnVtVG9waWNNZXNzYWdlcyh7IGNoYXRfaWQgfSwgc2lnbmFsKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBVc2UgdGhpcyBtZXRob2QgdG8gc2VuZCBhbnN3ZXJzIHRvIGNhbGxiYWNrIHF1ZXJpZXMgc2VudCBmcm9tIGlubGluZSBrZXlib2FyZHMuIFRoZSBhbnN3ZXIgd2lsbCBiZSBkaXNwbGF5ZWQgdG8gdGhlIHVzZXIgYXMgYSBub3RpZmljYXRpb24gYXQgdGhlIHRvcCBvZiB0aGUgY2hhdCBzY3JlZW4gb3IgYXMgYW4gYWxlcnQuIE9uIHN1Y2Nlc3MsIFRydWUgaXMgcmV0dXJuZWQuXG4gICAgICpcbiAgICAgKiBBbHRlcm5hdGl2ZWx5LCB0aGUgdXNlciBjYW4gYmUgcmVkaXJlY3RlZCB0byB0aGUgc3BlY2lmaWVkIEdhbWUgVVJMLiBGb3IgdGhpcyBvcHRpb24gdG8gd29yaywgeW91IG11c3QgZmlyc3QgY3JlYXRlIGEgZ2FtZSBmb3IgeW91ciBib3QgdmlhIEBCb3RGYXRoZXIgYW5kIGFjY2VwdCB0aGUgdGVybXMuIE90aGVyd2lzZSwgeW91IG1heSB1c2UgbGlua3MgbGlrZSB0Lm1lL3lvdXJfYm90P3N0YXJ0PVhYWFggdGhhdCBvcGVuIHlvdXIgYm90IHdpdGggYSBwYXJhbWV0ZXIuXG4gICAgICpcbiAgICAgKiBAcGFyYW0gY2FsbGJhY2tfcXVlcnlfaWQgVW5pcXVlIGlkZW50aWZpZXIgZm9yIHRoZSBxdWVyeSB0byBiZSBhbnN3ZXJlZFxuICAgICAqIEBwYXJhbSBvdGhlciBPcHRpb25hbCByZW1haW5pbmcgcGFyYW1ldGVycywgY29uZmVyIHRoZSBvZmZpY2lhbCByZWZlcmVuY2UgYmVsb3dcbiAgICAgKiBAcGFyYW0gc2lnbmFsIE9wdGlvbmFsIGBBYm9ydFNpZ25hbGAgdG8gY2FuY2VsIHRoZSByZXF1ZXN0XG4gICAgICpcbiAgICAgKiAqKk9mZmljaWFsIHJlZmVyZW5jZToqKiBodHRwczovL2NvcmUudGVsZWdyYW0ub3JnL2JvdHMvYXBpI2Fuc3dlcmNhbGxiYWNrcXVlcnlcbiAgICAgKi9cbiAgICBhbnN3ZXJDYWxsYmFja1F1ZXJ5KFxuICAgICAgICBjYWxsYmFja19xdWVyeV9pZDogc3RyaW5nLFxuICAgICAgICBvdGhlcj86IE90aGVyPFIsIFwiYW5zd2VyQ2FsbGJhY2tRdWVyeVwiLCBcImNhbGxiYWNrX3F1ZXJ5X2lkXCI+LFxuICAgICAgICBzaWduYWw/OiBBYm9ydFNpZ25hbCxcbiAgICApIHtcbiAgICAgICAgcmV0dXJuIHRoaXMucmF3LmFuc3dlckNhbGxiYWNrUXVlcnkoXG4gICAgICAgICAgICB7IGNhbGxiYWNrX3F1ZXJ5X2lkLCAuLi5vdGhlciB9LFxuICAgICAgICAgICAgc2lnbmFsLFxuICAgICAgICApO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFVzZSB0aGlzIG1ldGhvZCB0byBjaGFuZ2UgdGhlIGJvdCdzIG5hbWUuIFJldHVybnMgVHJ1ZSBvbiBzdWNjZXNzLlxuICAgICAqXG4gICAgICogQHBhcmFtIG5hbWUgTmV3IGJvdCBuYW1lOyAwLTY0IGNoYXJhY3RlcnMuIFBhc3MgYW4gZW1wdHkgc3RyaW5nIHRvIHJlbW92ZSB0aGUgZGVkaWNhdGVkIG5hbWUgZm9yIHRoZSBnaXZlbiBsYW5ndWFnZS5cbiAgICAgKiBAcGFyYW0gb3RoZXIgT3B0aW9uYWwgcmVtYWluaW5nIHBhcmFtZXRlcnMsIGNvbmZlciB0aGUgb2ZmaWNpYWwgcmVmZXJlbmNlIGJlbG93XG4gICAgICogQHBhcmFtIHNpZ25hbCBPcHRpb25hbCBgQWJvcnRTaWduYWxgIHRvIGNhbmNlbCB0aGUgcmVxdWVzdFxuICAgICAqXG4gICAgICogKipPZmZpY2lhbCByZWZlcmVuY2U6KiogaHR0cHM6Ly9jb3JlLnRlbGVncmFtLm9yZy9ib3RzL2FwaSNzZXRteW5hbWVcbiAgICAgKi9cbiAgICBzZXRNeU5hbWUoXG4gICAgICAgIG5hbWU6IHN0cmluZyxcbiAgICAgICAgb3RoZXI/OiBPdGhlcjxSLCBcInNldE15TmFtZVwiLCBcIm5hbWVcIj4sXG4gICAgICAgIHNpZ25hbD86IEFib3J0U2lnbmFsLFxuICAgICkge1xuICAgICAgICByZXR1cm4gdGhpcy5yYXcuc2V0TXlOYW1lKHsgbmFtZSwgLi4ub3RoZXIgfSwgc2lnbmFsKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBVc2UgdGhpcyBtZXRob2QgdG8gZ2V0IHRoZSBjdXJyZW50IGJvdCBuYW1lIGZvciB0aGUgZ2l2ZW4gdXNlciBsYW5ndWFnZS4gUmV0dXJucyBCb3ROYW1lIG9uIHN1Y2Nlc3MuXG4gICAgICpcbiAgICAgKiBAcGFyYW0gb3RoZXIgT3B0aW9uYWwgcmVtYWluaW5nIHBhcmFtZXRlcnMsIGNvbmZlciB0aGUgb2ZmaWNpYWwgcmVmZXJlbmNlIGJlbG93XG4gICAgICogQHBhcmFtIHNpZ25hbCBPcHRpb25hbCBgQWJvcnRTaWduYWxgIHRvIGNhbmNlbCB0aGUgcmVxdWVzdFxuICAgICAqXG4gICAgICogKipPZmZpY2lhbCByZWZlcmVuY2U6KiogaHR0cHM6Ly9jb3JlLnRlbGVncmFtLm9yZy9ib3RzL2FwaSNnZXRteW5hbWVcbiAgICAgKi9cbiAgICBnZXRNeU5hbWUob3RoZXI/OiBPdGhlcjxSLCBcImdldE15TmFtZVwiPiwgc2lnbmFsPzogQWJvcnRTaWduYWwpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMucmF3LmdldE15TmFtZShvdGhlciA/PyB7fSwgc2lnbmFsKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBVc2UgdGhpcyBtZXRob2QgdG8gY2hhbmdlIHRoZSBsaXN0IG9mIHRoZSBib3QncyBjb21tYW5kcy4gU2VlIGh0dHBzOi8vY29yZS50ZWxlZ3JhbS5vcmcvYm90cy9mZWF0dXJlcyNjb21tYW5kcyBmb3IgbW9yZSBkZXRhaWxzIGFib3V0IGJvdCBjb21tYW5kcy4gUmV0dXJucyBUcnVlIG9uIHN1Y2Nlc3MuXG4gICAgICpcbiAgICAgKiBAcGFyYW0gY29tbWFuZHMgQSBsaXN0IG9mIGJvdCBjb21tYW5kcyB0byBiZSBzZXQgYXMgdGhlIGxpc3Qgb2YgdGhlIGJvdCdzIGNvbW1hbmRzLiBBdCBtb3N0IDEwMCBjb21tYW5kcyBjYW4gYmUgc3BlY2lmaWVkLlxuICAgICAqIEBwYXJhbSBvdGhlciBPcHRpb25hbCByZW1haW5pbmcgcGFyYW1ldGVycywgY29uZmVyIHRoZSBvZmZpY2lhbCByZWZlcmVuY2UgYmVsb3dcbiAgICAgKiBAcGFyYW0gc2lnbmFsIE9wdGlvbmFsIGBBYm9ydFNpZ25hbGAgdG8gY2FuY2VsIHRoZSByZXF1ZXN0XG4gICAgICpcbiAgICAgKiAqKk9mZmljaWFsIHJlZmVyZW5jZToqKiBodHRwczovL2NvcmUudGVsZWdyYW0ub3JnL2JvdHMvYXBpI3NldG15Y29tbWFuZHNcbiAgICAgKi9cbiAgICBzZXRNeUNvbW1hbmRzKFxuICAgICAgICBjb21tYW5kczogcmVhZG9ubHkgQm90Q29tbWFuZFtdLFxuICAgICAgICBvdGhlcj86IE90aGVyPFIsIFwic2V0TXlDb21tYW5kc1wiLCBcImNvbW1hbmRzXCI+LFxuICAgICAgICBzaWduYWw/OiBBYm9ydFNpZ25hbCxcbiAgICApIHtcbiAgICAgICAgcmV0dXJuIHRoaXMucmF3LnNldE15Q29tbWFuZHMoeyBjb21tYW5kcywgLi4ub3RoZXIgfSwgc2lnbmFsKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBVc2UgdGhpcyBtZXRob2QgdG8gZGVsZXRlIHRoZSBsaXN0IG9mIHRoZSBib3QncyBjb21tYW5kcyBmb3IgdGhlIGdpdmVuIHNjb3BlIGFuZCB1c2VyIGxhbmd1YWdlLiBBZnRlciBkZWxldGlvbiwgaGlnaGVyIGxldmVsIGNvbW1hbmRzIHdpbGwgYmUgc2hvd24gdG8gYWZmZWN0ZWQgdXNlcnMuIFJldHVybnMgVHJ1ZSBvbiBzdWNjZXNzLlxuICAgICAqXG4gICAgICogQHBhcmFtIG90aGVyIE9wdGlvbmFsIHJlbWFpbmluZyBwYXJhbWV0ZXJzLCBjb25mZXIgdGhlIG9mZmljaWFsIHJlZmVyZW5jZSBiZWxvd1xuICAgICAqIEBwYXJhbSBzaWduYWwgT3B0aW9uYWwgYEFib3J0U2lnbmFsYCB0byBjYW5jZWwgdGhlIHJlcXVlc3RcbiAgICAgKlxuICAgICAqICoqT2ZmaWNpYWwgcmVmZXJlbmNlOioqIGh0dHBzOi8vY29yZS50ZWxlZ3JhbS5vcmcvYm90cy9hcGkjZGVsZXRlbXljb21tYW5kc1xuICAgICAqL1xuICAgIGRlbGV0ZU15Q29tbWFuZHMoXG4gICAgICAgIG90aGVyPzogT3RoZXI8UiwgXCJkZWxldGVNeUNvbW1hbmRzXCI+LFxuICAgICAgICBzaWduYWw/OiBBYm9ydFNpZ25hbCxcbiAgICApIHtcbiAgICAgICAgcmV0dXJuIHRoaXMucmF3LmRlbGV0ZU15Q29tbWFuZHMoeyAuLi5vdGhlciB9LCBzaWduYWwpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFVzZSB0aGlzIG1ldGhvZCB0byBnZXQgdGhlIGN1cnJlbnQgbGlzdCBvZiB0aGUgYm90J3MgY29tbWFuZHMgZm9yIHRoZSBnaXZlbiBzY29wZSBhbmQgdXNlciBsYW5ndWFnZS4gUmV0dXJucyBhbiBBcnJheSBvZiBCb3RDb21tYW5kIG9iamVjdHMuIElmIGNvbW1hbmRzIGFyZW4ndCBzZXQsIGFuIGVtcHR5IGxpc3QgaXMgcmV0dXJuZWQuXG4gICAgICpcbiAgICAgKiBAcGFyYW0gb3RoZXIgT3B0aW9uYWwgcmVtYWluaW5nIHBhcmFtZXRlcnMsIGNvbmZlciB0aGUgb2ZmaWNpYWwgcmVmZXJlbmNlIGJlbG93XG4gICAgICogQHBhcmFtIHNpZ25hbCBPcHRpb25hbCBgQWJvcnRTaWduYWxgIHRvIGNhbmNlbCB0aGUgcmVxdWVzdFxuICAgICAqXG4gICAgICogKipPZmZpY2lhbCByZWZlcmVuY2U6KiogaHR0cHM6Ly9jb3JlLnRlbGVncmFtLm9yZy9ib3RzL2FwaSNnZXRteWNvbW1hbmRzXG4gICAgICovXG4gICAgZ2V0TXlDb21tYW5kcyhvdGhlcj86IE90aGVyPFIsIFwiZ2V0TXlDb21tYW5kc1wiPiwgc2lnbmFsPzogQWJvcnRTaWduYWwpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMucmF3LmdldE15Q29tbWFuZHMoeyAuLi5vdGhlciB9LCBzaWduYWwpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFVzZSB0aGlzIG1ldGhvZCB0byBjaGFuZ2UgdGhlIGJvdCdzIGRlc2NyaXB0aW9uLCB3aGljaCBpcyBzaG93biBpbiB0aGUgY2hhdCB3aXRoIHRoZSBib3QgaWYgdGhlIGNoYXQgaXMgZW1wdHkuIFJldHVybnMgVHJ1ZSBvbiBzdWNjZXNzLlxuICAgICAqXG4gICAgICogQHBhcmFtIGRlc2NyaXB0aW9uIE5ldyBib3QgZGVzY3JpcHRpb247IDAtNTEyIGNoYXJhY3RlcnMuIFBhc3MgYW4gZW1wdHkgc3RyaW5nIHRvIHJlbW92ZSB0aGUgZGVkaWNhdGVkIGRlc2NyaXB0aW9uIGZvciB0aGUgZ2l2ZW4gbGFuZ3VhZ2UuXG4gICAgICogQHBhcmFtIG90aGVyIE9wdGlvbmFsIHJlbWFpbmluZyBwYXJhbXRlcnMsIGNvbmZlciB0aGUgb2ZmaWNpYWwgcmVmZXJlbmNlIGJlbG93XG4gICAgICogQHBhcmFtIHNpZ25hbCBPcHRpb25hbCBgQWJvcnRTaWduYWxgIHRvIGNhbmNlbCB0aGUgcmVxdWVzdFxuICAgICAqXG4gICAgICogKipPZmZpY2lhbCByZWZlcmVuY2U6KiogaHR0cHM6Ly9jb3JlLnRlbGVncmFtLm9yZy9ib3RzL2FwaSNzZXRteWRlc2NyaXB0aW9uXG4gICAgICovXG4gICAgc2V0TXlEZXNjcmlwdGlvbihcbiAgICAgICAgZGVzY3JpcHRpb246IHN0cmluZyxcbiAgICAgICAgb3RoZXI/OiBPdGhlcjxSLCBcInNldE15RGVzY3JpcHRpb25cIiwgXCJkZXNjcmlwdGlvblwiPixcbiAgICAgICAgc2lnbmFsPzogQWJvcnRTaWduYWwsXG4gICAgKSB7XG4gICAgICAgIHJldHVybiB0aGlzLnJhdy5zZXRNeURlc2NyaXB0aW9uKHsgZGVzY3JpcHRpb24sIC4uLm90aGVyIH0sIHNpZ25hbCk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogVXNlIHRoaXMgbWV0aG9kIHRvIGdldCB0aGUgY3VycmVudCBib3QgZGVzY3JpcHRpb24gZm9yIHRoZSBnaXZlbiB1c2VyIGxhbmd1YWdlLiBSZXR1cm5zIEJvdERlc2NyaXB0aW9uIG9uIHN1Y2Nlc3MuXG4gICAgICpcbiAgICAgKiBAcGFyYW0gb3RoZXIgT3B0aW9uYWwgcmVtYWluaW5nIHBhcmFtdGVycywgY29uZmVyIHRoZSBvZmZpY2lhbCByZWZlcmVuY2UgYmVsb3dcbiAgICAgKiBAcGFyYW0gc2lnbmFsIE9wdGlvbmFsIGBBYm9ydFNpZ25hbGAgdG8gY2FuY2VsIHRoZSByZXF1ZXN0XG4gICAgICpcbiAgICAgKiAqKk9mZmljaWFsIHJlZmVyZW5jZToqKiBodHRwczovL2NvcmUudGVsZWdyYW0ub3JnL2JvdHMvYXBpI2dldG15ZGVzY3JpcHRpb25cbiAgICAgKi9cbiAgICBnZXRNeURlc2NyaXB0aW9uKFxuICAgICAgICBvdGhlcj86IE90aGVyPFIsIFwiZ2V0TXlEZXNjcmlwdGlvblwiPixcbiAgICAgICAgc2lnbmFsPzogQWJvcnRTaWduYWwsXG4gICAgKSB7XG4gICAgICAgIHJldHVybiB0aGlzLnJhdy5nZXRNeURlc2NyaXB0aW9uKHsgLi4ub3RoZXIgfSwgc2lnbmFsKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBVc2UgdGhpcyBtZXRob2QgdG8gY2hhbmdlIHRoZSBib3QncyBzaG9ydCBkZXNjcmlwdGlvbiwgd2hpY2ggaXMgc2hvd24gb24gdGhlIGJvdCdzIHByb2ZpbGUgcGFnZSBhbmQgaXMgc2VudCB0b2dldGhlciB3aXRoIHRoZSBsaW5rIHdoZW4gdXNlcnMgc2hhcmUgdGhlIGJvdC4gUmV0dXJucyBUcnVlIG9uIHN1Y2Nlc3MuXG4gICAgICpcbiAgICAgKiBAcGFyYW0gc2hvcnRfZGVzY3JpcHRpb24gTmV3IHNob3J0IGRlc2NyaXB0aW9uIGZvciB0aGUgYm90OyAwLTEyMCBjaGFyYWN0ZXJzLiBQYXNzIGFuIGVtcHR5IHN0cmluZyB0byByZW1vdmUgdGhlIGRlZGljYXRlZCBzaG9ydCBkZXNjcmlwdGlvbiBmb3IgdGhlIGdpdmVuIGxhbmd1YWdlLlxuICAgICAqIEBwYXJhbSBvdGhlciBPcHRpb25hbCByZW1haW5pbmcgcGFyYW10ZXJzLCBjb25mZXIgdGhlIG9mZmljaWFsIHJlZmVyZW5jZSBiZWxvd1xuICAgICAqIEBwYXJhbSBzaWduYWwgT3B0aW9uYWwgYEFib3J0U2lnbmFsYCB0byBjYW5jZWwgdGhlIHJlcXVlc3RcbiAgICAgKlxuICAgICAqICoqT2ZmaWNpYWwgcmVmZXJlbmNlOioqIGh0dHBzOi8vY29yZS50ZWxlZ3JhbS5vcmcvYm90cy9hcGkjc2V0bXlzaG9ydGRlc2NyaXB0aW9uXG4gICAgICovXG4gICAgc2V0TXlTaG9ydERlc2NyaXB0aW9uKFxuICAgICAgICBzaG9ydF9kZXNjcmlwdGlvbjogc3RyaW5nLFxuICAgICAgICBvdGhlcj86IE90aGVyPFIsIFwic2V0TXlTaG9ydERlc2NyaXB0aW9uXCIsIFwic2hvcnRfZGVzY3JpcHRpb25cIj4sXG4gICAgICAgIHNpZ25hbD86IEFib3J0U2lnbmFsLFxuICAgICkge1xuICAgICAgICByZXR1cm4gdGhpcy5yYXcuc2V0TXlTaG9ydERlc2NyaXB0aW9uKFxuICAgICAgICAgICAgeyBzaG9ydF9kZXNjcmlwdGlvbiwgLi4ub3RoZXIgfSxcbiAgICAgICAgICAgIHNpZ25hbCxcbiAgICAgICAgKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBVc2UgdGhpcyBtZXRob2QgdG8gZ2V0IHRoZSBjdXJyZW50IGJvdCBzaG9ydCBkZXNjcmlwdGlvbiBmb3IgdGhlIGdpdmVuIHVzZXIgbGFuZ3VhZ2UuIFJldHVybnMgQm90U2hvcnREZXNjcmlwdGlvbiBvbiBzdWNjZXNzLlxuICAgICAqXG4gICAgICogQHBhcmFtIG90aGVyIE9wdGlvbmFsIHJlbWFpbmluZyBwYXJhbXRlcnMsIGNvbmZlciB0aGUgb2ZmaWNpYWwgcmVmZXJlbmNlIGJlbG93XG4gICAgICogQHBhcmFtIHNpZ25hbCBPcHRpb25hbCBgQWJvcnRTaWduYWxgIHRvIGNhbmNlbCB0aGUgcmVxdWVzdFxuICAgICAqXG4gICAgICogKipPZmZpY2lhbCByZWZlcmVuY2U6KiogaHR0cHM6Ly9jb3JlLnRlbGVncmFtLm9yZy9ib3RzL2FwaSNnZXRteXNob3J0ZGVzY3JpcHRpb25cbiAgICAgKi9cbiAgICBnZXRNeVNob3J0RGVzY3JpcHRpb24oXG4gICAgICAgIG90aGVyPzogT3RoZXI8UiwgXCJnZXRNeVNob3J0RGVzY3JpcHRpb25cIj4sXG4gICAgICAgIHNpZ25hbD86IEFib3J0U2lnbmFsLFxuICAgICkge1xuICAgICAgICByZXR1cm4gdGhpcy5yYXcuZ2V0TXlTaG9ydERlc2NyaXB0aW9uKHsgLi4ub3RoZXIgfSwgc2lnbmFsKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBVc2UgdGhpcyBtZXRob2QgdG8gY2hhbmdlIHRoZSBib3QncyBtZW51IGJ1dHRvbiBpbiBhIHByaXZhdGUgY2hhdCwgb3IgdGhlIGRlZmF1bHQgbWVudSBidXR0b24uIFJldHVybnMgVHJ1ZSBvbiBzdWNjZXNzLlxuICAgICAqXG4gICAgICogQHBhcmFtIG90aGVyIE9wdGlvbmFsIHJlbWFpbmluZyBwYXJhbWV0ZXJzLCBjb25mZXIgdGhlIG9mZmljaWFsIHJlZmVyZW5jZSBiZWxvd1xuICAgICAqIEBwYXJhbSBzaWduYWwgT3B0aW9uYWwgYEFib3J0U2lnbmFsYCB0byBjYW5jZWwgdGhlIHJlcXVlc3RcbiAgICAgKlxuICAgICAqICoqT2ZmaWNpYWwgcmVmZXJlbmNlOioqIGh0dHBzOi8vY29yZS50ZWxlZ3JhbS5vcmcvYm90cy9hcGkjc2V0Y2hhdG1lbnVidXR0b25cbiAgICAgKi9cbiAgICBzZXRDaGF0TWVudUJ1dHRvbihcbiAgICAgICAgb3RoZXI/OiBPdGhlcjxSLCBcInNldENoYXRNZW51QnV0dG9uXCI+LFxuICAgICAgICBzaWduYWw/OiBBYm9ydFNpZ25hbCxcbiAgICApIHtcbiAgICAgICAgcmV0dXJuIHRoaXMucmF3LnNldENoYXRNZW51QnV0dG9uKHsgLi4ub3RoZXIgfSwgc2lnbmFsKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBVc2UgdGhpcyBtZXRob2QgdG8gZ2V0IHRoZSBjdXJyZW50IHZhbHVlIG9mIHRoZSBib3QncyBtZW51IGJ1dHRvbiBpbiBhIHByaXZhdGUgY2hhdCwgb3IgdGhlIGRlZmF1bHQgbWVudSBidXR0b24uIFJldHVybnMgTWVudUJ1dHRvbiBvbiBzdWNjZXNzLlxuICAgICAqXG4gICAgICogQHBhcmFtIG90aGVyIE9wdGlvbmFsIHJlbWFpbmluZyBwYXJhbWV0ZXJzLCBjb25mZXIgdGhlIG9mZmljaWFsIHJlZmVyZW5jZSBiZWxvd1xuICAgICAqIEBwYXJhbSBzaWduYWwgT3B0aW9uYWwgYEFib3J0U2lnbmFsYCB0byBjYW5jZWwgdGhlIHJlcXVlc3RcbiAgICAgKlxuICAgICAqICoqT2ZmaWNpYWwgcmVmZXJlbmNlOioqIGh0dHBzOi8vY29yZS50ZWxlZ3JhbS5vcmcvYm90cy9hcGkjZ2V0Y2hhdG1lbnVidXR0b25cbiAgICAgKi9cbiAgICBnZXRDaGF0TWVudUJ1dHRvbihcbiAgICAgICAgb3RoZXI/OiBPdGhlcjxSLCBcImdldENoYXRNZW51QnV0dG9uXCI+LFxuICAgICAgICBzaWduYWw/OiBBYm9ydFNpZ25hbCxcbiAgICApIHtcbiAgICAgICAgcmV0dXJuIHRoaXMucmF3LmdldENoYXRNZW51QnV0dG9uKHsgLi4ub3RoZXIgfSwgc2lnbmFsKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBVc2UgdGhpcyBtZXRob2QgdG8gdGhlIGNoYW5nZSB0aGUgZGVmYXVsdCBhZG1pbmlzdHJhdG9yIHJpZ2h0cyByZXF1ZXN0ZWQgYnkgdGhlIGJvdCB3aGVuIGl0J3MgYWRkZWQgYXMgYW4gYWRtaW5pc3RyYXRvciB0byBncm91cHMgb3IgY2hhbm5lbHMuIFRoZXNlIHJpZ2h0cyB3aWxsIGJlIHN1Z2dlc3RlZCB0byB1c2VycywgYnV0IHRoZXkgYXJlIGFyZSBmcmVlIHRvIG1vZGlmeSB0aGUgbGlzdCBiZWZvcmUgYWRkaW5nIHRoZSBib3QuIFJldHVybnMgVHJ1ZSBvbiBzdWNjZXNzLlxuICAgICAqXG4gICAgICogQHBhcmFtIG90aGVyIE9wdGlvbmFsIHJlbWFpbmluZyBwYXJhbWV0ZXJzLCBjb25mZXIgdGhlIG9mZmljaWFsIHJlZmVyZW5jZSBiZWxvd1xuICAgICAqIEBwYXJhbSBzaWduYWwgT3B0aW9uYWwgYEFib3J0U2lnbmFsYCB0byBjYW5jZWwgdGhlIHJlcXVlc3RcbiAgICAgKlxuICAgICAqICoqT2ZmaWNpYWwgcmVmZXJlbmNlOioqIGh0dHBzOi8vY29yZS50ZWxlZ3JhbS5vcmcvYm90cy9hcGkjc2V0bXlkZWZhdWx0YWRtaW5pc3RyYXRvcnJpZ2h0c1xuICAgICAqL1xuICAgIHNldE15RGVmYXVsdEFkbWluaXN0cmF0b3JSaWdodHMoXG4gICAgICAgIG90aGVyPzogT3RoZXI8UiwgXCJzZXRNeURlZmF1bHRBZG1pbmlzdHJhdG9yUmlnaHRzXCI+LFxuICAgICAgICBzaWduYWw/OiBBYm9ydFNpZ25hbCxcbiAgICApIHtcbiAgICAgICAgcmV0dXJuIHRoaXMucmF3LnNldE15RGVmYXVsdEFkbWluaXN0cmF0b3JSaWdodHMoeyAuLi5vdGhlciB9LCBzaWduYWwpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFVzZSB0aGlzIG1ldGhvZCB0byBnZXQgdGhlIGN1cnJlbnQgZGVmYXVsdCBhZG1pbmlzdHJhdG9yIHJpZ2h0cyBvZiB0aGUgYm90LiBSZXR1cm5zIENoYXRBZG1pbmlzdHJhdG9yUmlnaHRzIG9uIHN1Y2Nlc3MuXG4gICAgICpcbiAgICAgKiBAcGFyYW0gb3RoZXIgT3B0aW9uYWwgcmVtYWluaW5nIHBhcmFtZXRlcnMsIGNvbmZlciB0aGUgb2ZmaWNpYWwgcmVmZXJlbmNlIGJlbG93XG4gICAgICogQHBhcmFtIHNpZ25hbCBPcHRpb25hbCBgQWJvcnRTaWduYWxgIHRvIGNhbmNlbCB0aGUgcmVxdWVzdFxuICAgICAqXG4gICAgICogKipPZmZpY2lhbCByZWZlcmVuY2U6KiogaHR0cHM6Ly9jb3JlLnRlbGVncmFtLm9yZy9ib3RzL2FwaSNnZXRteWRlZmF1bHRhZG1pbmlzdHJhdG9ycmlnaHRzXG4gICAgICovXG4gICAgZ2V0TXlEZWZhdWx0QWRtaW5pc3RyYXRvclJpZ2h0cyhcbiAgICAgICAgb3RoZXI/OiBPdGhlcjxSLCBcImdldE15RGVmYXVsdEFkbWluaXN0cmF0b3JSaWdodHNcIj4sXG4gICAgICAgIHNpZ25hbD86IEFib3J0U2lnbmFsLFxuICAgICkge1xuICAgICAgICByZXR1cm4gdGhpcy5yYXcuZ2V0TXlEZWZhdWx0QWRtaW5pc3RyYXRvclJpZ2h0cyh7IC4uLm90aGVyIH0sIHNpZ25hbCk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogVXNlIHRoaXMgbWV0aG9kIHRvIGVkaXQgdGV4dCBhbmQgZ2FtZSBtZXNzYWdlcy4gT24gc3VjY2VzcywgaWYgdGhlIGVkaXRlZCBtZXNzYWdlIGlzIG5vdCBhbiBpbmxpbmUgbWVzc2FnZSwgdGhlIGVkaXRlZCBNZXNzYWdlIGlzIHJldHVybmVkLCBvdGhlcndpc2UgVHJ1ZSBpcyByZXR1cm5lZC4gTm90ZSB0aGF0IGJ1c2luZXNzIG1lc3NhZ2VzIHRoYXQgd2VyZSBub3Qgc2VudCBieSB0aGUgYm90IGFuZCBkbyBub3QgY29udGFpbiBhbiBpbmxpbmUga2V5Ym9hcmQgY2FuIG9ubHkgYmUgZWRpdGVkIHdpdGhpbiA0OCBob3VycyBmcm9tIHRoZSB0aW1lIHRoZXkgd2VyZSBzZW50LlxuICAgICAqXG4gICAgICogQHBhcmFtIGNoYXRfaWQgVW5pcXVlIGlkZW50aWZpZXIgZm9yIHRoZSB0YXJnZXQgY2hhdCBvciB1c2VybmFtZSBvZiB0aGUgdGFyZ2V0IGNoYW5uZWwgKGluIHRoZSBmb3JtYXQgQGNoYW5uZWx1c2VybmFtZSlcbiAgICAgKiBAcGFyYW0gbWVzc2FnZV9pZCBJZGVudGlmaWVyIG9mIHRoZSBtZXNzYWdlIHRvIGVkaXRcbiAgICAgKiBAcGFyYW0gdGV4dCBOZXcgdGV4dCBvZiB0aGUgbWVzc2FnZSwgMS00MDk2IGNoYXJhY3RlcnMgYWZ0ZXIgZW50aXRpZXMgcGFyc2luZ1xuICAgICAqIEBwYXJhbSBvdGhlciBPcHRpb25hbCByZW1haW5pbmcgcGFyYW1ldGVycywgY29uZmVyIHRoZSBvZmZpY2lhbCByZWZlcmVuY2UgYmVsb3dcbiAgICAgKiBAcGFyYW0gc2lnbmFsIE9wdGlvbmFsIGBBYm9ydFNpZ25hbGAgdG8gY2FuY2VsIHRoZSByZXF1ZXN0XG4gICAgICpcbiAgICAgKiAqKk9mZmljaWFsIHJlZmVyZW5jZToqKiBodHRwczovL2NvcmUudGVsZWdyYW0ub3JnL2JvdHMvYXBpI2VkaXRtZXNzYWdldGV4dFxuICAgICAqL1xuICAgIGVkaXRNZXNzYWdlVGV4dChcbiAgICAgICAgY2hhdF9pZDogbnVtYmVyIHwgc3RyaW5nLFxuICAgICAgICBtZXNzYWdlX2lkOiBudW1iZXIsXG4gICAgICAgIHRleHQ6IHN0cmluZyxcbiAgICAgICAgb3RoZXI/OiBPdGhlcjxcbiAgICAgICAgICAgIFIsXG4gICAgICAgICAgICBcImVkaXRNZXNzYWdlVGV4dFwiLFxuICAgICAgICAgICAgXCJjaGF0X2lkXCIgfCBcIm1lc3NhZ2VfaWRcIiB8IFwiaW5saW5lX21lc3NhZ2VfaWRcIiB8IFwidGV4dFwiXG4gICAgICAgID4sXG4gICAgICAgIHNpZ25hbD86IEFib3J0U2lnbmFsLFxuICAgICkge1xuICAgICAgICByZXR1cm4gdGhpcy5yYXcuZWRpdE1lc3NhZ2VUZXh0KFxuICAgICAgICAgICAgeyBjaGF0X2lkLCBtZXNzYWdlX2lkLCB0ZXh0LCAuLi5vdGhlciB9LFxuICAgICAgICAgICAgc2lnbmFsLFxuICAgICAgICApO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFVzZSB0aGlzIG1ldGhvZCB0byBlZGl0IHRleHQgYW5kIGdhbWUgaW5saW5lIG1lc3NhZ2VzLiBPbiBzdWNjZXNzLCBpZiB0aGUgZWRpdGVkIG1lc3NhZ2UgaXMgbm90IGFuIGlubGluZSBtZXNzYWdlLCB0aGUgZWRpdGVkIE1lc3NhZ2UgaXMgcmV0dXJuZWQsIG90aGVyd2lzZSBUcnVlIGlzIHJldHVybmVkLiBOb3RlIHRoYXQgYnVzaW5lc3MgbWVzc2FnZXMgdGhhdCB3ZXJlIG5vdCBzZW50IGJ5IHRoZSBib3QgYW5kIGRvIG5vdCBjb250YWluIGFuIGlubGluZSBrZXlib2FyZCBjYW4gb25seSBiZSBlZGl0ZWQgd2l0aGluIDQ4IGhvdXJzIGZyb20gdGhlIHRpbWUgdGhleSB3ZXJlIHNlbnQuXG4gICAgICpcbiAgICAgKiBAcGFyYW0gaW5saW5lX21lc3NhZ2VfaWQgSWRlbnRpZmllciBvZiB0aGUgaW5saW5lIG1lc3NhZ2VcbiAgICAgKiBAcGFyYW0gb3RoZXIgT3B0aW9uYWwgcmVtYWluaW5nIHBhcmFtZXRlcnMsIGNvbmZlciB0aGUgb2ZmaWNpYWwgcmVmZXJlbmNlIGJlbG93XG4gICAgICogQHBhcmFtIHNpZ25hbCBPcHRpb25hbCBgQWJvcnRTaWduYWxgIHRvIGNhbmNlbCB0aGUgcmVxdWVzdFxuICAgICAqXG4gICAgICogKipPZmZpY2lhbCByZWZlcmVuY2U6KiogaHR0cHM6Ly9jb3JlLnRlbGVncmFtLm9yZy9ib3RzL2FwaSNlZGl0bWVzc2FnZXRleHRcbiAgICAgKi9cbiAgICBlZGl0TWVzc2FnZVRleHRJbmxpbmUoXG4gICAgICAgIGlubGluZV9tZXNzYWdlX2lkOiBzdHJpbmcsXG4gICAgICAgIHRleHQ6IHN0cmluZyxcbiAgICAgICAgb3RoZXI/OiBPdGhlcjxcbiAgICAgICAgICAgIFIsXG4gICAgICAgICAgICBcImVkaXRNZXNzYWdlVGV4dFwiLFxuICAgICAgICAgICAgXCJjaGF0X2lkXCIgfCBcIm1lc3NhZ2VfaWRcIiB8IFwiaW5saW5lX21lc3NhZ2VfaWRcIiB8IFwidGV4dFwiXG4gICAgICAgID4sXG4gICAgICAgIHNpZ25hbD86IEFib3J0U2lnbmFsLFxuICAgICkge1xuICAgICAgICByZXR1cm4gdGhpcy5yYXcuZWRpdE1lc3NhZ2VUZXh0KFxuICAgICAgICAgICAgeyBpbmxpbmVfbWVzc2FnZV9pZCwgdGV4dCwgLi4ub3RoZXIgfSxcbiAgICAgICAgICAgIHNpZ25hbCxcbiAgICAgICAgKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBVc2UgdGhpcyBtZXRob2QgdG8gZWRpdCBjYXB0aW9ucyBvZiBtZXNzYWdlcy4gT24gc3VjY2VzcywgaWYgdGhlIGVkaXRlZCBtZXNzYWdlIGlzIG5vdCBhbiBpbmxpbmUgbWVzc2FnZSwgdGhlIGVkaXRlZCBNZXNzYWdlIGlzIHJldHVybmVkLCBvdGhlcndpc2UgVHJ1ZSBpcyByZXR1cm5lZC4gTm90ZSB0aGF0IGJ1c2luZXNzIG1lc3NhZ2VzIHRoYXQgd2VyZSBub3Qgc2VudCBieSB0aGUgYm90IGFuZCBkbyBub3QgY29udGFpbiBhbiBpbmxpbmUga2V5Ym9hcmQgY2FuIG9ubHkgYmUgZWRpdGVkIHdpdGhpbiA0OCBob3VycyBmcm9tIHRoZSB0aW1lIHRoZXkgd2VyZSBzZW50LlxuICAgICAqXG4gICAgICogQHBhcmFtIGNoYXRfaWQgVW5pcXVlIGlkZW50aWZpZXIgZm9yIHRoZSB0YXJnZXQgY2hhdCBvciB1c2VybmFtZSBvZiB0aGUgdGFyZ2V0IGNoYW5uZWwgKGluIHRoZSBmb3JtYXQgQGNoYW5uZWx1c2VybmFtZSlcbiAgICAgKiBAcGFyYW0gbWVzc2FnZV9pZCBJZGVudGlmaWVyIG9mIHRoZSBtZXNzYWdlIHRvIGVkaXRcbiAgICAgKiBAcGFyYW0gb3RoZXIgT3B0aW9uYWwgcmVtYWluaW5nIHBhcmFtZXRlcnMsIGNvbmZlciB0aGUgb2ZmaWNpYWwgcmVmZXJlbmNlIGJlbG93XG4gICAgICogQHBhcmFtIHNpZ25hbCBPcHRpb25hbCBgQWJvcnRTaWduYWxgIHRvIGNhbmNlbCB0aGUgcmVxdWVzdFxuICAgICAqXG4gICAgICogKipPZmZpY2lhbCByZWZlcmVuY2U6KiogaHR0cHM6Ly9jb3JlLnRlbGVncmFtLm9yZy9ib3RzL2FwaSNlZGl0bWVzc2FnZWNhcHRpb25cbiAgICAgKi9cbiAgICBlZGl0TWVzc2FnZUNhcHRpb24oXG4gICAgICAgIGNoYXRfaWQ6IG51bWJlciB8IHN0cmluZyxcbiAgICAgICAgbWVzc2FnZV9pZDogbnVtYmVyLFxuICAgICAgICBvdGhlcj86IE90aGVyPFxuICAgICAgICAgICAgUixcbiAgICAgICAgICAgIFwiZWRpdE1lc3NhZ2VDYXB0aW9uXCIsXG4gICAgICAgICAgICBcImNoYXRfaWRcIiB8IFwibWVzc2FnZV9pZFwiIHwgXCJpbmxpbmVfbWVzc2FnZV9pZFwiXG4gICAgICAgID4sXG4gICAgICAgIHNpZ25hbD86IEFib3J0U2lnbmFsLFxuICAgICkge1xuICAgICAgICByZXR1cm4gdGhpcy5yYXcuZWRpdE1lc3NhZ2VDYXB0aW9uKFxuICAgICAgICAgICAgeyBjaGF0X2lkLCBtZXNzYWdlX2lkLCAuLi5vdGhlciB9LFxuICAgICAgICAgICAgc2lnbmFsLFxuICAgICAgICApO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFVzZSB0aGlzIG1ldGhvZCB0byBlZGl0IGNhcHRpb25zIG9mIGlubGluZSBtZXNzYWdlcy4gT24gc3VjY2VzcywgaWYgdGhlIGVkaXRlZCBtZXNzYWdlIGlzIG5vdCBhbiBpbmxpbmUgbWVzc2FnZSwgdGhlIGVkaXRlZCBNZXNzYWdlIGlzIHJldHVybmVkLCBvdGhlcndpc2UgVHJ1ZSBpcyByZXR1cm5lZC4gTm90ZSB0aGF0IGJ1c2luZXNzIG1lc3NhZ2VzIHRoYXQgd2VyZSBub3Qgc2VudCBieSB0aGUgYm90IGFuZCBkbyBub3QgY29udGFpbiBhbiBpbmxpbmUga2V5Ym9hcmQgY2FuIG9ubHkgYmUgZWRpdGVkIHdpdGhpbiA0OCBob3VycyBmcm9tIHRoZSB0aW1lIHRoZXkgd2VyZSBzZW50LlxuICAgICAqXG4gICAgICogQHBhcmFtIGlubGluZV9tZXNzYWdlX2lkIElkZW50aWZpZXIgb2YgdGhlIGlubGluZSBtZXNzYWdlXG4gICAgICogQHBhcmFtIG90aGVyIE9wdGlvbmFsIHJlbWFpbmluZyBwYXJhbWV0ZXJzLCBjb25mZXIgdGhlIG9mZmljaWFsIHJlZmVyZW5jZSBiZWxvd1xuICAgICAqIEBwYXJhbSBzaWduYWwgT3B0aW9uYWwgYEFib3J0U2lnbmFsYCB0byBjYW5jZWwgdGhlIHJlcXVlc3RcbiAgICAgKlxuICAgICAqICoqT2ZmaWNpYWwgcmVmZXJlbmNlOioqIGh0dHBzOi8vY29yZS50ZWxlZ3JhbS5vcmcvYm90cy9hcGkjZWRpdG1lc3NhZ2VjYXB0aW9uXG4gICAgICovXG4gICAgZWRpdE1lc3NhZ2VDYXB0aW9uSW5saW5lKFxuICAgICAgICBpbmxpbmVfbWVzc2FnZV9pZDogc3RyaW5nLFxuICAgICAgICBvdGhlcj86IE90aGVyPFxuICAgICAgICAgICAgUixcbiAgICAgICAgICAgIFwiZWRpdE1lc3NhZ2VDYXB0aW9uXCIsXG4gICAgICAgICAgICBcImNoYXRfaWRcIiB8IFwibWVzc2FnZV9pZFwiIHwgXCJpbmxpbmVfbWVzc2FnZV9pZFwiXG4gICAgICAgID4sXG4gICAgICAgIHNpZ25hbD86IEFib3J0U2lnbmFsLFxuICAgICkge1xuICAgICAgICByZXR1cm4gdGhpcy5yYXcuZWRpdE1lc3NhZ2VDYXB0aW9uKFxuICAgICAgICAgICAgeyBpbmxpbmVfbWVzc2FnZV9pZCwgLi4ub3RoZXIgfSxcbiAgICAgICAgICAgIHNpZ25hbCxcbiAgICAgICAgKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBVc2UgdGhpcyBtZXRob2QgdG8gZWRpdCBhbmltYXRpb24sIGF1ZGlvLCBkb2N1bWVudCwgcGhvdG8sIG9yIHZpZGVvIG1lc3NhZ2VzLiBJZiBhIG1lc3NhZ2UgaXMgcGFydCBvZiBhIG1lc3NhZ2UgYWxidW0sIHRoZW4gaXQgY2FuIGJlIGVkaXRlZCBvbmx5IHRvIGFuIGF1ZGlvIGZvciBhdWRpbyBhbGJ1bXMsIG9ubHkgdG8gYSBkb2N1bWVudCBmb3IgZG9jdW1lbnQgYWxidW1zIGFuZCB0byBhIHBob3RvIG9yIGEgdmlkZW8gb3RoZXJ3aXNlLiBXaGVuIGFuIGlubGluZSBtZXNzYWdlIGlzIGVkaXRlZCwgYSBuZXcgZmlsZSBjYW4ndCBiZSB1cGxvYWRlZDsgdXNlIGEgcHJldmlvdXNseSB1cGxvYWRlZCBmaWxlIHZpYSBpdHMgZmlsZV9pZCBvciBzcGVjaWZ5IGEgVVJMLiBPbiBzdWNjZXNzLCBpZiB0aGUgZWRpdGVkIG1lc3NhZ2UgaXMgbm90IGFuIGlubGluZSBtZXNzYWdlLCB0aGUgZWRpdGVkIE1lc3NhZ2UgaXMgcmV0dXJuZWQsIG90aGVyd2lzZSBUcnVlIGlzIHJldHVybmVkLiBOb3RlIHRoYXQgYnVzaW5lc3MgbWVzc2FnZXMgdGhhdCB3ZXJlIG5vdCBzZW50IGJ5IHRoZSBib3QgYW5kIGRvIG5vdCBjb250YWluIGFuIGlubGluZSBrZXlib2FyZCBjYW4gb25seSBiZSBlZGl0ZWQgd2l0aGluIDQ4IGhvdXJzIGZyb20gdGhlIHRpbWUgdGhleSB3ZXJlIHNlbnQuXG4gICAgICpcbiAgICAgKiBAcGFyYW0gY2hhdF9pZCBVbmlxdWUgaWRlbnRpZmllciBmb3IgdGhlIHRhcmdldCBjaGF0IG9yIHVzZXJuYW1lIG9mIHRoZSB0YXJnZXQgY2hhbm5lbCAoaW4gdGhlIGZvcm1hdCBAY2hhbm5lbHVzZXJuYW1lKVxuICAgICAqIEBwYXJhbSBtZXNzYWdlX2lkIElkZW50aWZpZXIgb2YgdGhlIG1lc3NhZ2UgdG8gZWRpdFxuICAgICAqIEBwYXJhbSBtZWRpYSBBbiBvYmplY3QgZm9yIGEgbmV3IG1lZGlhIGNvbnRlbnQgb2YgdGhlIG1lc3NhZ2VcbiAgICAgKiBAcGFyYW0gb3RoZXIgT3B0aW9uYWwgcmVtYWluaW5nIHBhcmFtZXRlcnMsIGNvbmZlciB0aGUgb2ZmaWNpYWwgcmVmZXJlbmNlIGJlbG93XG4gICAgICogQHBhcmFtIHNpZ25hbCBPcHRpb25hbCBgQWJvcnRTaWduYWxgIHRvIGNhbmNlbCB0aGUgcmVxdWVzdFxuICAgICAqXG4gICAgICogKipPZmZpY2lhbCByZWZlcmVuY2U6KiogaHR0cHM6Ly9jb3JlLnRlbGVncmFtLm9yZy9ib3RzL2FwaSNlZGl0bWVzc2FnZW1lZGlhXG4gICAgICovXG4gICAgZWRpdE1lc3NhZ2VNZWRpYShcbiAgICAgICAgY2hhdF9pZDogbnVtYmVyIHwgc3RyaW5nLFxuICAgICAgICBtZXNzYWdlX2lkOiBudW1iZXIsXG4gICAgICAgIG1lZGlhOiBJbnB1dE1lZGlhLFxuICAgICAgICBvdGhlcj86IE90aGVyPFxuICAgICAgICAgICAgUixcbiAgICAgICAgICAgIFwiZWRpdE1lc3NhZ2VNZWRpYVwiLFxuICAgICAgICAgICAgXCJjaGF0X2lkXCIgfCBcIm1lc3NhZ2VfaWRcIiB8IFwiaW5saW5lX21lc3NhZ2VfaWRcIiB8IFwibWVkaWFcIlxuICAgICAgICA+LFxuICAgICAgICBzaWduYWw/OiBBYm9ydFNpZ25hbCxcbiAgICApIHtcbiAgICAgICAgcmV0dXJuIHRoaXMucmF3LmVkaXRNZXNzYWdlTWVkaWEoXG4gICAgICAgICAgICB7IGNoYXRfaWQsIG1lc3NhZ2VfaWQsIG1lZGlhLCAuLi5vdGhlciB9LFxuICAgICAgICAgICAgc2lnbmFsLFxuICAgICAgICApO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFVzZSB0aGlzIG1ldGhvZCB0byBlZGl0IGFuaW1hdGlvbiwgYXVkaW8sIGRvY3VtZW50LCBwaG90bywgb3IgdmlkZW8gaW5saW5lIG1lc3NhZ2VzLiBJZiBhIG1lc3NhZ2UgaXMgcGFydCBvZiBhIG1lc3NhZ2UgYWxidW0sIHRoZW4gaXQgY2FuIGJlIGVkaXRlZCBvbmx5IHRvIGFuIGF1ZGlvIGZvciBhdWRpbyBhbGJ1bXMsIG9ubHkgdG8gYSBkb2N1bWVudCBmb3IgZG9jdW1lbnQgYWxidW1zIGFuZCB0byBhIHBob3RvIG9yIGEgdmlkZW8gb3RoZXJ3aXNlLiBXaGVuIGFuIGlubGluZSBtZXNzYWdlIGlzIGVkaXRlZCwgYSBuZXcgZmlsZSBjYW4ndCBiZSB1cGxvYWRlZDsgdXNlIGEgcHJldmlvdXNseSB1cGxvYWRlZCBmaWxlIHZpYSBpdHMgZmlsZV9pZCBvciBzcGVjaWZ5IGEgVVJMLiBPbiBzdWNjZXNzLCBpZiB0aGUgZWRpdGVkIG1lc3NhZ2UgaXMgbm90IGFuIGlubGluZSBtZXNzYWdlLCB0aGUgZWRpdGVkIE1lc3NhZ2UgaXMgcmV0dXJuZWQsIG90aGVyd2lzZSBUcnVlIGlzIHJldHVybmVkLiBOb3RlIHRoYXQgYnVzaW5lc3MgbWVzc2FnZXMgdGhhdCB3ZXJlIG5vdCBzZW50IGJ5IHRoZSBib3QgYW5kIGRvIG5vdCBjb250YWluIGFuIGlubGluZSBrZXlib2FyZCBjYW4gb25seSBiZSBlZGl0ZWQgd2l0aGluIDQ4IGhvdXJzIGZyb20gdGhlIHRpbWUgdGhleSB3ZXJlIHNlbnQuXG4gICAgICpcbiAgICAgKiBAcGFyYW0gaW5saW5lX21lc3NhZ2VfaWQgSWRlbnRpZmllciBvZiB0aGUgaW5saW5lIG1lc3NhZ2VcbiAgICAgKiBAcGFyYW0gbWVkaWEgQW4gb2JqZWN0IGZvciBhIG5ldyBtZWRpYSBjb250ZW50IG9mIHRoZSBtZXNzYWdlXG4gICAgICogQHBhcmFtIG90aGVyIE9wdGlvbmFsIHJlbWFpbmluZyBwYXJhbWV0ZXJzLCBjb25mZXIgdGhlIG9mZmljaWFsIHJlZmVyZW5jZSBiZWxvd1xuICAgICAqIEBwYXJhbSBzaWduYWwgT3B0aW9uYWwgYEFib3J0U2lnbmFsYCB0byBjYW5jZWwgdGhlIHJlcXVlc3RcbiAgICAgKlxuICAgICAqICoqT2ZmaWNpYWwgcmVmZXJlbmNlOioqIGh0dHBzOi8vY29yZS50ZWxlZ3JhbS5vcmcvYm90cy9hcGkjZWRpdG1lc3NhZ2VtZWRpYVxuICAgICAqL1xuICAgIGVkaXRNZXNzYWdlTWVkaWFJbmxpbmUoXG4gICAgICAgIGlubGluZV9tZXNzYWdlX2lkOiBzdHJpbmcsXG4gICAgICAgIG1lZGlhOiBJbnB1dE1lZGlhLFxuICAgICAgICBvdGhlcj86IE90aGVyPFxuICAgICAgICAgICAgUixcbiAgICAgICAgICAgIFwiZWRpdE1lc3NhZ2VNZWRpYVwiLFxuICAgICAgICAgICAgXCJjaGF0X2lkXCIgfCBcIm1lc3NhZ2VfaWRcIiB8IFwiaW5saW5lX21lc3NhZ2VfaWRcIiB8IFwibWVkaWFcIlxuICAgICAgICA+LFxuICAgICAgICBzaWduYWw/OiBBYm9ydFNpZ25hbCxcbiAgICApIHtcbiAgICAgICAgcmV0dXJuIHRoaXMucmF3LmVkaXRNZXNzYWdlTWVkaWEoXG4gICAgICAgICAgICB7IGlubGluZV9tZXNzYWdlX2lkLCBtZWRpYSwgLi4ub3RoZXIgfSxcbiAgICAgICAgICAgIHNpZ25hbCxcbiAgICAgICAgKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBVc2UgdGhpcyBtZXRob2QgdG8gZWRpdCBvbmx5IHRoZSByZXBseSBtYXJrdXAgb2YgbWVzc2FnZXMuIE9uIHN1Y2Nlc3MsIGlmIHRoZSBlZGl0ZWQgbWVzc2FnZSBpcyBub3QgYW4gaW5saW5lIG1lc3NhZ2UsIHRoZSBlZGl0ZWQgTWVzc2FnZSBpcyByZXR1cm5lZCwgb3RoZXJ3aXNlIFRydWUgaXMgcmV0dXJuZWQuIE5vdGUgdGhhdCBidXNpbmVzcyBtZXNzYWdlcyB0aGF0IHdlcmUgbm90IHNlbnQgYnkgdGhlIGJvdCBhbmQgZG8gbm90IGNvbnRhaW4gYW4gaW5saW5lIGtleWJvYXJkIGNhbiBvbmx5IGJlIGVkaXRlZCB3aXRoaW4gNDggaG91cnMgZnJvbSB0aGUgdGltZSB0aGV5IHdlcmUgc2VudC5cbiAgICAgKlxuICAgICAqIEBwYXJhbSBjaGF0X2lkIFVuaXF1ZSBpZGVudGlmaWVyIGZvciB0aGUgdGFyZ2V0IGNoYXQgb3IgdXNlcm5hbWUgb2YgdGhlIHRhcmdldCBjaGFubmVsIChpbiB0aGUgZm9ybWF0IEBjaGFubmVsdXNlcm5hbWUpXG4gICAgICogQHBhcmFtIG1lc3NhZ2VfaWQgSWRlbnRpZmllciBvZiB0aGUgbWVzc2FnZSB0byBlZGl0XG4gICAgICogQHBhcmFtIG90aGVyIE9wdGlvbmFsIHJlbWFpbmluZyBwYXJhbWV0ZXJzLCBjb25mZXIgdGhlIG9mZmljaWFsIHJlZmVyZW5jZSBiZWxvd1xuICAgICAqIEBwYXJhbSBzaWduYWwgT3B0aW9uYWwgYEFib3J0U2lnbmFsYCB0byBjYW5jZWwgdGhlIHJlcXVlc3RcbiAgICAgKlxuICAgICAqICoqT2ZmaWNpYWwgcmVmZXJlbmNlOioqIGh0dHBzOi8vY29yZS50ZWxlZ3JhbS5vcmcvYm90cy9hcGkjZWRpdG1lc3NhZ2VyZXBseW1hcmt1cFxuICAgICAqL1xuICAgIGVkaXRNZXNzYWdlUmVwbHlNYXJrdXAoXG4gICAgICAgIGNoYXRfaWQ6IG51bWJlciB8IHN0cmluZyxcbiAgICAgICAgbWVzc2FnZV9pZDogbnVtYmVyLFxuICAgICAgICBvdGhlcj86IE90aGVyPFxuICAgICAgICAgICAgUixcbiAgICAgICAgICAgIFwiZWRpdE1lc3NhZ2VSZXBseU1hcmt1cFwiLFxuICAgICAgICAgICAgXCJjaGF0X2lkXCIgfCBcIm1lc3NhZ2VfaWRcIiB8IFwiaW5saW5lX21lc3NhZ2VfaWRcIlxuICAgICAgICA+LFxuICAgICAgICBzaWduYWw/OiBBYm9ydFNpZ25hbCxcbiAgICApIHtcbiAgICAgICAgcmV0dXJuIHRoaXMucmF3LmVkaXRNZXNzYWdlUmVwbHlNYXJrdXAoXG4gICAgICAgICAgICB7IGNoYXRfaWQsIG1lc3NhZ2VfaWQsIC4uLm90aGVyIH0sXG4gICAgICAgICAgICBzaWduYWwsXG4gICAgICAgICk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogVXNlIHRoaXMgbWV0aG9kIHRvIGVkaXQgb25seSB0aGUgcmVwbHkgbWFya3VwIG9mIGlubGluZSBtZXNzYWdlcy4gT24gc3VjY2VzcywgaWYgdGhlIGVkaXRlZCBtZXNzYWdlIGlzIG5vdCBhbiBpbmxpbmUgbWVzc2FnZSwgdGhlIGVkaXRlZCBNZXNzYWdlIGlzIHJldHVybmVkLCBvdGhlcndpc2UgVHJ1ZSBpcyByZXR1cm5lZC4gTm90ZSB0aGF0IGJ1c2luZXNzIG1lc3NhZ2VzIHRoYXQgd2VyZSBub3Qgc2VudCBieSB0aGUgYm90IGFuZCBkbyBub3QgY29udGFpbiBhbiBpbmxpbmUga2V5Ym9hcmQgY2FuIG9ubHkgYmUgZWRpdGVkIHdpdGhpbiA0OCBob3VycyBmcm9tIHRoZSB0aW1lIHRoZXkgd2VyZSBzZW50LlxuICAgICAqXG4gICAgICogQHBhcmFtIGlubGluZV9tZXNzYWdlX2lkIElkZW50aWZpZXIgb2YgdGhlIGlubGluZSBtZXNzYWdlXG4gICAgICogQHBhcmFtIG90aGVyIE9wdGlvbmFsIHJlbWFpbmluZyBwYXJhbWV0ZXJzLCBjb25mZXIgdGhlIG9mZmljaWFsIHJlZmVyZW5jZSBiZWxvd1xuICAgICAqIEBwYXJhbSBzaWduYWwgT3B0aW9uYWwgYEFib3J0U2lnbmFsYCB0byBjYW5jZWwgdGhlIHJlcXVlc3RcbiAgICAgKlxuICAgICAqICoqT2ZmaWNpYWwgcmVmZXJlbmNlOioqIGh0dHBzOi8vY29yZS50ZWxlZ3JhbS5vcmcvYm90cy9hcGkjZWRpdG1lc3NhZ2VyZXBseW1hcmt1cFxuICAgICAqL1xuICAgIGVkaXRNZXNzYWdlUmVwbHlNYXJrdXBJbmxpbmUoXG4gICAgICAgIGlubGluZV9tZXNzYWdlX2lkOiBzdHJpbmcsXG4gICAgICAgIG90aGVyPzogT3RoZXI8XG4gICAgICAgICAgICBSLFxuICAgICAgICAgICAgXCJlZGl0TWVzc2FnZVJlcGx5TWFya3VwXCIsXG4gICAgICAgICAgICBcImNoYXRfaWRcIiB8IFwibWVzc2FnZV9pZFwiIHwgXCJpbmxpbmVfbWVzc2FnZV9pZFwiXG4gICAgICAgID4sXG4gICAgICAgIHNpZ25hbD86IEFib3J0U2lnbmFsLFxuICAgICkge1xuICAgICAgICByZXR1cm4gdGhpcy5yYXcuZWRpdE1lc3NhZ2VSZXBseU1hcmt1cChcbiAgICAgICAgICAgIHsgaW5saW5lX21lc3NhZ2VfaWQsIC4uLm90aGVyIH0sXG4gICAgICAgICAgICBzaWduYWwsXG4gICAgICAgICk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogVXNlIHRoaXMgbWV0aG9kIHRvIHN0b3AgYSBwb2xsIHdoaWNoIHdhcyBzZW50IGJ5IHRoZSBib3QuIE9uIHN1Y2Nlc3MsIHRoZSBzdG9wcGVkIFBvbGwgaXMgcmV0dXJuZWQuXG4gICAgICpcbiAgICAgKiBAcGFyYW0gY2hhdF9pZCBVbmlxdWUgaWRlbnRpZmllciBmb3IgdGhlIHRhcmdldCBjaGF0IG9yIHVzZXJuYW1lIG9mIHRoZSB0YXJnZXQgY2hhbm5lbCAoaW4gdGhlIGZvcm1hdCBAY2hhbm5lbHVzZXJuYW1lKVxuICAgICAqIEBwYXJhbSBtZXNzYWdlX2lkIElkZW50aWZpZXIgb2YgdGhlIG9yaWdpbmFsIG1lc3NhZ2Ugd2l0aCB0aGUgcG9sbFxuICAgICAqIEBwYXJhbSBvdGhlciBPcHRpb25hbCByZW1haW5pbmcgcGFyYW1ldGVycywgY29uZmVyIHRoZSBvZmZpY2lhbCByZWZlcmVuY2UgYmVsb3dcbiAgICAgKiBAcGFyYW0gc2lnbmFsIE9wdGlvbmFsIGBBYm9ydFNpZ25hbGAgdG8gY2FuY2VsIHRoZSByZXF1ZXN0XG4gICAgICpcbiAgICAgKiAqKk9mZmljaWFsIHJlZmVyZW5jZToqKiBodHRwczovL2NvcmUudGVsZWdyYW0ub3JnL2JvdHMvYXBpI3N0b3Bwb2xsXG4gICAgICovXG4gICAgc3RvcFBvbGwoXG4gICAgICAgIGNoYXRfaWQ6IG51bWJlciB8IHN0cmluZyxcbiAgICAgICAgbWVzc2FnZV9pZDogbnVtYmVyLFxuICAgICAgICBvdGhlcj86IE90aGVyPFIsIFwic3RvcFBvbGxcIiwgXCJjaGF0X2lkXCIgfCBcIm1lc3NhZ2VfaWRcIj4sXG4gICAgICAgIHNpZ25hbD86IEFib3J0U2lnbmFsLFxuICAgICkge1xuICAgICAgICByZXR1cm4gdGhpcy5yYXcuc3RvcFBvbGwoeyBjaGF0X2lkLCBtZXNzYWdlX2lkLCAuLi5vdGhlciB9LCBzaWduYWwpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFVzZSB0aGlzIG1ldGhvZCB0byBkZWxldGUgYSBtZXNzYWdlLCBpbmNsdWRpbmcgc2VydmljZSBtZXNzYWdlcywgd2l0aCB0aGUgZm9sbG93aW5nIGxpbWl0YXRpb25zOlxuICAgICAqIC0gQSBtZXNzYWdlIGNhbiBvbmx5IGJlIGRlbGV0ZWQgaWYgaXQgd2FzIHNlbnQgbGVzcyB0aGFuIDQ4IGhvdXJzIGFnby5cbiAgICAgKiAtIEEgZGljZSBtZXNzYWdlIGluIGEgcHJpdmF0ZSBjaGF0IGNhbiBvbmx5IGJlIGRlbGV0ZWQgaWYgaXQgd2FzIHNlbnQgbW9yZSB0aGFuIDI0IGhvdXJzIGFnby5cbiAgICAgKiAtIEJvdHMgY2FuIGRlbGV0ZSBvdXRnb2luZyBtZXNzYWdlcyBpbiBwcml2YXRlIGNoYXRzLCBncm91cHMsIGFuZCBzdXBlcmdyb3Vwcy5cbiAgICAgKiAtIEJvdHMgY2FuIGRlbGV0ZSBpbmNvbWluZyBtZXNzYWdlcyBpbiBwcml2YXRlIGNoYXRzLlxuICAgICAqIC0gQm90cyBncmFudGVkIGNhbl9wb3N0X21lc3NhZ2VzIHBlcm1pc3Npb25zIGNhbiBkZWxldGUgb3V0Z29pbmcgbWVzc2FnZXMgaW4gY2hhbm5lbHMuXG4gICAgICogLSBJZiB0aGUgYm90IGlzIGFuIGFkbWluaXN0cmF0b3Igb2YgYSBncm91cCwgaXQgY2FuIGRlbGV0ZSBhbnkgbWVzc2FnZSB0aGVyZS5cbiAgICAgKiAtIElmIHRoZSBib3QgaGFzIGNhbl9kZWxldGVfbWVzc2FnZXMgcGVybWlzc2lvbiBpbiBhIHN1cGVyZ3JvdXAgb3IgYSBjaGFubmVsLCBpdCBjYW4gZGVsZXRlIGFueSBtZXNzYWdlIHRoZXJlLlxuICAgICAqIFJldHVybnMgVHJ1ZSBvbiBzdWNjZXNzLlxuICAgICAqXG4gICAgICogQHBhcmFtIGNoYXRfaWQgVW5pcXVlIGlkZW50aWZpZXIgZm9yIHRoZSB0YXJnZXQgY2hhdCBvciB1c2VybmFtZSBvZiB0aGUgdGFyZ2V0IGNoYW5uZWwgKGluIHRoZSBmb3JtYXQgQGNoYW5uZWx1c2VybmFtZSlcbiAgICAgKiBAcGFyYW0gbWVzc2FnZV9pZCBJZGVudGlmaWVyIG9mIHRoZSBtZXNzYWdlIHRvIGRlbGV0ZVxuICAgICAqIEBwYXJhbSBzaWduYWwgT3B0aW9uYWwgYEFib3J0U2lnbmFsYCB0byBjYW5jZWwgdGhlIHJlcXVlc3RcbiAgICAgKlxuICAgICAqICoqT2ZmaWNpYWwgcmVmZXJlbmNlOioqIGh0dHBzOi8vY29yZS50ZWxlZ3JhbS5vcmcvYm90cy9hcGkjZGVsZXRlbWVzc2FnZVxuICAgICAqL1xuICAgIGRlbGV0ZU1lc3NhZ2UoXG4gICAgICAgIGNoYXRfaWQ6IG51bWJlciB8IHN0cmluZyxcbiAgICAgICAgbWVzc2FnZV9pZDogbnVtYmVyLFxuICAgICAgICBzaWduYWw/OiBBYm9ydFNpZ25hbCxcbiAgICApIHtcbiAgICAgICAgcmV0dXJuIHRoaXMucmF3LmRlbGV0ZU1lc3NhZ2UoeyBjaGF0X2lkLCBtZXNzYWdlX2lkIH0sIHNpZ25hbCk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogVXNlIHRoaXMgbWV0aG9kIHRvIGRlbGV0ZSBtdWx0aXBsZSBtZXNzYWdlcyBzaW11bHRhbmVvdXNseS4gUmV0dXJucyBUcnVlIG9uIHN1Y2Nlc3MuXG4gICAgICpcbiAgICAgKiBAcGFyYW0gY2hhdF9pZCBVbmlxdWUgaWRlbnRpZmllciBmb3IgdGhlIHRhcmdldCBjaGF0IG9yIHVzZXJuYW1lIG9mIHRoZSB0YXJnZXQgY2hhbm5lbCAoaW4gdGhlIGZvcm1hdCBAY2hhbm5lbHVzZXJuYW1lKVxuICAgICAqIEBwYXJhbSBtZXNzYWdlX2lkcyBBIGxpc3Qgb2YgMS0xMDAgaWRlbnRpZmllcnMgb2YgbWVzc2FnZXMgdG8gZGVsZXRlLiBTZWUgZGVsZXRlTWVzc2FnZSBmb3IgbGltaXRhdGlvbnMgb24gd2hpY2ggbWVzc2FnZXMgY2FuIGJlIGRlbGV0ZWRcbiAgICAgKiBAcGFyYW0gc2lnbmFsIE9wdGlvbmFsIGBBYm9ydFNpZ25hbGAgdG8gY2FuY2VsIHRoZSByZXF1ZXN0XG4gICAgICpcbiAgICAgKiAqKk9mZmljaWFsIHJlZmVyZW5jZToqKiBodHRwczovL2NvcmUudGVsZWdyYW0ub3JnL2JvdHMvYXBpI2RlbGV0ZW1lc3NhZ2VzXG4gICAgICovXG4gICAgZGVsZXRlTWVzc2FnZXMoXG4gICAgICAgIGNoYXRfaWQ6IG51bWJlciB8IHN0cmluZyxcbiAgICAgICAgbWVzc2FnZV9pZHM6IG51bWJlcltdLFxuICAgICAgICBzaWduYWw/OiBBYm9ydFNpZ25hbCxcbiAgICApIHtcbiAgICAgICAgcmV0dXJuIHRoaXMucmF3LmRlbGV0ZU1lc3NhZ2VzKHsgY2hhdF9pZCwgbWVzc2FnZV9pZHMgfSwgc2lnbmFsKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBVc2UgdGhpcyBtZXRob2QgdG8gc2VuZCBzdGF0aWMgLldFQlAsIGFuaW1hdGVkIC5UR1MsIG9yIHZpZGVvIC5XRUJNIHN0aWNrZXJzLiBPbiBzdWNjZXNzLCB0aGUgc2VudCBNZXNzYWdlIGlzIHJldHVybmVkLlxuICAgICAqXG4gICAgICogQHBhcmFtIGNoYXRfaWQgVW5pcXVlIGlkZW50aWZpZXIgZm9yIHRoZSB0YXJnZXQgY2hhdCBvciB1c2VybmFtZSBvZiB0aGUgdGFyZ2V0IGNoYW5uZWwgKGluIHRoZSBmb3JtYXQgQGNoYW5uZWx1c2VybmFtZSlcbiAgICAgKiBAcGFyYW0gc3RpY2tlciBTdGlja2VyIHRvIHNlbmQuIFBhc3MgYSBmaWxlX2lkIGFzIFN0cmluZyB0byBzZW5kIGEgZmlsZSB0aGF0IGV4aXN0cyBvbiB0aGUgVGVsZWdyYW0gc2VydmVycyAocmVjb21tZW5kZWQpLCBwYXNzIGFuIEhUVFAgVVJMIGFzIGEgU3RyaW5nIGZvciBUZWxlZ3JhbSB0byBnZXQgYSAuV0VCUCBzdGlja2VyIGZyb20gdGhlIEludGVybmV0LCBvciB1cGxvYWQgYSBuZXcgLldFQlAsIC5UR1MsIG9yIC5XRUJNIHN0aWNrZXIgdXNpbmcgbXVsdGlwYXJ0L2Zvcm0tZGF0YS4gVmlkZW8gYW5kIGFuaW1hdGVkIHN0aWNrZXJzIGNhbid0IGJlIHNlbnQgdmlhIGFuIEhUVFAgVVJMLlxuICAgICAqIEBwYXJhbSBvdGhlciBPcHRpb25hbCByZW1haW5pbmcgcGFyYW1ldGVycywgY29uZmVyIHRoZSBvZmZpY2lhbCByZWZlcmVuY2UgYmVsb3dcbiAgICAgKiBAcGFyYW0gc2lnbmFsIE9wdGlvbmFsIGBBYm9ydFNpZ25hbGAgdG8gY2FuY2VsIHRoZSByZXF1ZXN0XG4gICAgICpcbiAgICAgKiAqKk9mZmljaWFsIHJlZmVyZW5jZToqKiBodHRwczovL2NvcmUudGVsZWdyYW0ub3JnL2JvdHMvYXBpI3NlbmRzdGlja2VyXG4gICAgICovXG4gICAgc2VuZFN0aWNrZXIoXG4gICAgICAgIGNoYXRfaWQ6IG51bWJlciB8IHN0cmluZyxcbiAgICAgICAgc3RpY2tlcjogSW5wdXRGaWxlIHwgc3RyaW5nLFxuICAgICAgICBvdGhlcj86IE90aGVyPFIsIFwic2VuZFN0aWNrZXJcIiwgXCJjaGF0X2lkXCIgfCBcInN0aWNrZXJcIj4sXG4gICAgICAgIHNpZ25hbD86IEFib3J0U2lnbmFsLFxuICAgICkge1xuICAgICAgICByZXR1cm4gdGhpcy5yYXcuc2VuZFN0aWNrZXIoeyBjaGF0X2lkLCBzdGlja2VyLCAuLi5vdGhlciB9LCBzaWduYWwpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFVzZSB0aGlzIG1ldGhvZCB0byBnZXQgYSBzdGlja2VyIHNldC4gT24gc3VjY2VzcywgYSBTdGlja2VyU2V0IG9iamVjdCBpcyByZXR1cm5lZC5cbiAgICAgKlxuICAgICAqIEBwYXJhbSBuYW1lIE5hbWUgb2YgdGhlIHN0aWNrZXIgc2V0XG4gICAgICogQHBhcmFtIHNpZ25hbCBPcHRpb25hbCBgQWJvcnRTaWduYWxgIHRvIGNhbmNlbCB0aGUgcmVxdWVzdFxuICAgICAqXG4gICAgICogKipPZmZpY2lhbCByZWZlcmVuY2U6KiogaHR0cHM6Ly9jb3JlLnRlbGVncmFtLm9yZy9ib3RzL2FwaSNnZXRzdGlja2Vyc2V0XG4gICAgICovXG4gICAgZ2V0U3RpY2tlclNldChuYW1lOiBzdHJpbmcsIHNpZ25hbD86IEFib3J0U2lnbmFsKSB7XG4gICAgICAgIHJldHVybiB0aGlzLnJhdy5nZXRTdGlja2VyU2V0KHsgbmFtZSB9LCBzaWduYWwpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFVzZSB0aGlzIG1ldGhvZCB0byBnZXQgaW5mb3JtYXRpb24gYWJvdXQgY3VzdG9tIGVtb2ppIHN0aWNrZXJzIGJ5IHRoZWlyIGlkZW50aWZpZXJzLiBSZXR1cm5zIGFuIEFycmF5IG9mIFN0aWNrZXIgb2JqZWN0cy5cbiAgICAgKlxuICAgICAqIEBwYXJhbSBjdXN0b21fZW1vamlfaWRzIEEgbGlzdCBvZiBjdXN0b20gZW1vamkgaWRlbnRpZmllcnNcbiAgICAgKiBAcGFyYW0gc2lnbmFsIE9wdGlvbmFsIGBBYm9ydFNpZ25hbGAgdG8gY2FuY2VsIHRoZSByZXF1ZXN0XG4gICAgICpcbiAgICAgKiAqKk9mZmljaWFsIHJlZmVyZW5jZToqKiBodHRwczovL2NvcmUudGVsZWdyYW0ub3JnL2JvdHMvYXBpI2dldGN1c3RvbWVtb2ppc3RpY2tlcnNcbiAgICAgKi9cbiAgICBnZXRDdXN0b21FbW9qaVN0aWNrZXJzKGN1c3RvbV9lbW9qaV9pZHM6IHN0cmluZ1tdLCBzaWduYWw/OiBBYm9ydFNpZ25hbCkge1xuICAgICAgICByZXR1cm4gdGhpcy5yYXcuZ2V0Q3VzdG9tRW1vamlTdGlja2Vycyh7IGN1c3RvbV9lbW9qaV9pZHMgfSwgc2lnbmFsKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBVc2UgdGhpcyBtZXRob2QgdG8gdXBsb2FkIGEgZmlsZSB3aXRoIGEgc3RpY2tlciBmb3IgbGF0ZXIgdXNlIGluIHRoZSBjcmVhdGVOZXdTdGlja2VyU2V0LCBhZGRTdGlja2VyVG9TZXQsIG9yIHJlcGxhY2VTdGlja2VySW5TZXQgbWV0aG9kcyAodGhlIGZpbGUgY2FuIGJlIHVzZWQgbXVsdGlwbGUgdGltZXMpLiBSZXR1cm5zIHRoZSB1cGxvYWRlZCBGaWxlIG9uIHN1Y2Nlc3MuXG4gICAgICpcbiAgICAgKiBAcGFyYW0gdXNlcl9pZCBVc2VyIGlkZW50aWZpZXIgb2Ygc3RpY2tlciBmaWxlIG93bmVyXG4gICAgICogQHBhcmFtIHN0aWNrZXJfZm9ybWF0IEZvcm1hdCBvZiB0aGUgc3RpY2tlciwgbXVzdCBiZSBvbmUgb2Yg4oCcc3RhdGlj4oCdLCDigJxhbmltYXRlZOKAnSwg4oCcdmlkZW/igJ1cbiAgICAgKiBAcGFyYW0gc3RpY2tlciBBIGZpbGUgd2l0aCB0aGUgc3RpY2tlciBpbiAuV0VCUCwgLlBORywgLlRHUywgb3IgLldFQk0gZm9ybWF0LiBTZWUgaHR0cHM6Ly9jb3JlLnRlbGVncmFtLm9yZy9zdGlja2VycyBmb3IgdGVjaG5pY2FsIHJlcXVpcmVtZW50cy5cbiAgICAgKiBAcGFyYW0gc2lnbmFsIE9wdGlvbmFsIGBBYm9ydFNpZ25hbGAgdG8gY2FuY2VsIHRoZSByZXF1ZXN0XG4gICAgICpcbiAgICAgKiAqKk9mZmljaWFsIHJlZmVyZW5jZToqKiBodHRwczovL2NvcmUudGVsZWdyYW0ub3JnL2JvdHMvYXBpI3VwbG9hZHN0aWNrZXJmaWxlXG4gICAgICovXG4gICAgdXBsb2FkU3RpY2tlckZpbGUoXG4gICAgICAgIHVzZXJfaWQ6IG51bWJlcixcbiAgICAgICAgc3RpY2tlcl9mb3JtYXQ6IFwic3RhdGljXCIgfCBcImFuaW1hdGVkXCIgfCBcInZpZGVvXCIsXG4gICAgICAgIHN0aWNrZXI6IElucHV0RmlsZSxcbiAgICAgICAgc2lnbmFsPzogQWJvcnRTaWduYWwsXG4gICAgKSB7XG4gICAgICAgIHJldHVybiB0aGlzLnJhdy51cGxvYWRTdGlja2VyRmlsZShcbiAgICAgICAgICAgIHsgdXNlcl9pZCwgc3RpY2tlcl9mb3JtYXQsIHN0aWNrZXIgfSxcbiAgICAgICAgICAgIHNpZ25hbCxcbiAgICAgICAgKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBVc2UgdGhpcyBtZXRob2QgdG8gY3JlYXRlIGEgbmV3IHN0aWNrZXIgc2V0IG93bmVkIGJ5IGEgdXNlci4gVGhlIGJvdCB3aWxsIGJlIGFibGUgdG8gZWRpdCB0aGUgc3RpY2tlciBzZXQgdGh1cyBjcmVhdGVkLiBSZXR1cm5zIFRydWUgb24gc3VjY2Vzcy5cbiAgICAgKlxuICAgICAqIEBwYXJhbSB1c2VyX2lkIFVzZXIgaWRlbnRpZmllciBvZiBjcmVhdGVkIHN0aWNrZXIgc2V0IG93bmVyXG4gICAgICogQHBhcmFtIG5hbWUgU2hvcnQgbmFtZSBvZiBzdGlja2VyIHNldCwgdG8gYmUgdXNlZCBpbiB0Lm1lL2FkZHN0aWNrZXJzLyBVUkxzIChlLmcuLCBhbmltYWxzKS4gQ2FuIGNvbnRhaW4gb25seSBFbmdsaXNoIGxldHRlcnMsIGRpZ2l0cyBhbmQgdW5kZXJzY29yZXMuIE11c3QgYmVnaW4gd2l0aCBhIGxldHRlciwgY2FuJ3QgY29udGFpbiBjb25zZWN1dGl2ZSB1bmRlcnNjb3JlcyBhbmQgbXVzdCBlbmQgaW4gYF9ieV88Ym90X3VzZXJuYW1lPmAuIGA8Ym90X3VzZXJuYW1lPmAgaXMgY2FzZSBpbnNlbnNpdGl2ZS4gMS02NCBjaGFyYWN0ZXJzLlxuICAgICAqIEBwYXJhbSB0aXRsZSBTdGlja2VyIHNldCB0aXRsZSwgMS02NCBjaGFyYWN0ZXJzXG4gICAgICogQHBhcmFtIHN0aWNrZXJzIEEgbGlzdCBvZiAxLTUwIGluaXRpYWwgc3RpY2tlcnMgdG8gYmUgYWRkZWQgdG8gdGhlIHN0aWNrZXIgc2V0XG4gICAgICogQHBhcmFtIG90aGVyIE9wdGlvbmFsIHJlbWFpbmluZyBwYXJhbWV0ZXJzLCBjb25mZXIgdGhlIG9mZmljaWFsIHJlZmVyZW5jZSBiZWxvd1xuICAgICAqIEBwYXJhbSBzaWduYWwgT3B0aW9uYWwgYEFib3J0U2lnbmFsYCB0byBjYW5jZWwgdGhlIHJlcXVlc3RcbiAgICAgKlxuICAgICAqICoqT2ZmaWNpYWwgcmVmZXJlbmNlOioqIGh0dHBzOi8vY29yZS50ZWxlZ3JhbS5vcmcvYm90cy9hcGkjY3JlYXRlbmV3c3RpY2tlcnNldFxuICAgICAqL1xuICAgIGNyZWF0ZU5ld1N0aWNrZXJTZXQoXG4gICAgICAgIHVzZXJfaWQ6IG51bWJlcixcbiAgICAgICAgbmFtZTogc3RyaW5nLFxuICAgICAgICB0aXRsZTogc3RyaW5nLFxuICAgICAgICBzdGlja2VyczogSW5wdXRTdGlja2VyW10sXG4gICAgICAgIG90aGVyPzogT3RoZXI8XG4gICAgICAgICAgICBSLFxuICAgICAgICAgICAgXCJjcmVhdGVOZXdTdGlja2VyU2V0XCIsXG4gICAgICAgICAgICB8IFwidXNlcl9pZFwiXG4gICAgICAgICAgICB8IFwibmFtZVwiXG4gICAgICAgICAgICB8IFwidGl0bGVcIlxuICAgICAgICAgICAgfCBcInN0aWNrZXJfZm9ybWF0XCJcbiAgICAgICAgICAgIHwgXCJzdGlja2Vyc1wiXG4gICAgICAgID4sXG4gICAgICAgIHNpZ25hbD86IEFib3J0U2lnbmFsLFxuICAgICkge1xuICAgICAgICByZXR1cm4gdGhpcy5yYXcuY3JlYXRlTmV3U3RpY2tlclNldChcbiAgICAgICAgICAgIHsgdXNlcl9pZCwgbmFtZSwgdGl0bGUsIHN0aWNrZXJzLCAuLi5vdGhlciB9LFxuICAgICAgICAgICAgc2lnbmFsLFxuICAgICAgICApO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFVzZSB0aGlzIG1ldGhvZCB0byBhZGQgYSBuZXcgc3RpY2tlciB0byBhIHNldCBjcmVhdGVkIGJ5IHRoZSBib3QuIFRoZSBmb3JtYXQgb2YgdGhlIGFkZGVkIHN0aWNrZXIgbXVzdCBtYXRjaCB0aGUgZm9ybWF0IG9mIHRoZSBvdGhlciBzdGlja2VycyBpbiB0aGUgc2V0LiBFbW9qaSBzdGlja2VyIHNldHMgY2FuIGhhdmUgdXAgdG8gMjAwIHN0aWNrZXJzLiBBbmltYXRlZCBhbmQgdmlkZW8gc3RpY2tlciBzZXRzIGNhbiBoYXZlIHVwIHRvIDUwIHN0aWNrZXJzLiBTdGF0aWMgc3RpY2tlciBzZXRzIGNhbiBoYXZlIHVwIHRvIDEyMCBzdGlja2Vycy4gUmV0dXJucyBUcnVlIG9uIHN1Y2Nlc3MuXG4gICAgICpcbiAgICAgKiBAcGFyYW0gdXNlcl9pZCBVc2VyIGlkZW50aWZpZXIgb2Ygc3RpY2tlciBzZXQgb3duZXJcbiAgICAgKiBAcGFyYW0gbmFtZSBTdGlja2VyIHNldCBuYW1lXG4gICAgICogQHBhcmFtIHN0aWNrZXIgQW4gb2JqZWN0IHdpdGggaW5mb3JtYXRpb24gYWJvdXQgdGhlIGFkZGVkIHN0aWNrZXIuIElmIGV4YWN0bHkgdGhlIHNhbWUgc3RpY2tlciBoYWQgYWxyZWFkeSBiZWVuIGFkZGVkIHRvIHRoZSBzZXQsIHRoZW4gdGhlIHNldCBpc24ndCBjaGFuZ2VkLlxuICAgICAqIEBwYXJhbSBzaWduYWwgT3B0aW9uYWwgYEFib3J0U2lnbmFsYCB0byBjYW5jZWwgdGhlIHJlcXVlc3RcbiAgICAgKlxuICAgICAqICoqT2ZmaWNpYWwgcmVmZXJlbmNlOioqIGh0dHBzOi8vY29yZS50ZWxlZ3JhbS5vcmcvYm90cy9hcGkjYWRkc3RpY2tlcnRvc2V0XG4gICAgICovXG4gICAgYWRkU3RpY2tlclRvU2V0KFxuICAgICAgICB1c2VyX2lkOiBudW1iZXIsXG4gICAgICAgIG5hbWU6IHN0cmluZyxcbiAgICAgICAgc3RpY2tlcjogSW5wdXRTdGlja2VyLFxuICAgICAgICBzaWduYWw/OiBBYm9ydFNpZ25hbCxcbiAgICApIHtcbiAgICAgICAgcmV0dXJuIHRoaXMucmF3LmFkZFN0aWNrZXJUb1NldChcbiAgICAgICAgICAgIHsgdXNlcl9pZCwgbmFtZSwgc3RpY2tlciB9LFxuICAgICAgICAgICAgc2lnbmFsLFxuICAgICAgICApO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFVzZSB0aGlzIG1ldGhvZCB0byBtb3ZlIGEgc3RpY2tlciBpbiBhIHNldCBjcmVhdGVkIGJ5IHRoZSBib3QgdG8gYSBzcGVjaWZpYyBwb3NpdGlvbi4gUmV0dXJucyBUcnVlIG9uIHN1Y2Nlc3MuXG4gICAgICpcbiAgICAgKiBAcGFyYW0gc3RpY2tlciBGaWxlIGlkZW50aWZpZXIgb2YgdGhlIHN0aWNrZXJcbiAgICAgKiBAcGFyYW0gcG9zaXRpb24gTmV3IHN0aWNrZXIgcG9zaXRpb24gaW4gdGhlIHNldCwgemVyby1iYXNlZFxuICAgICAqIEBwYXJhbSBzaWduYWwgT3B0aW9uYWwgYEFib3J0U2lnbmFsYCB0byBjYW5jZWwgdGhlIHJlcXVlc3RcbiAgICAgKlxuICAgICAqICoqT2ZmaWNpYWwgcmVmZXJlbmNlOioqIGh0dHBzOi8vY29yZS50ZWxlZ3JhbS5vcmcvYm90cy9hcGkjc2V0c3RpY2tlcnBvc2l0aW9uaW5zZXRcbiAgICAgKi9cbiAgICBzZXRTdGlja2VyUG9zaXRpb25JblNldChcbiAgICAgICAgc3RpY2tlcjogc3RyaW5nLFxuICAgICAgICBwb3NpdGlvbjogbnVtYmVyLFxuICAgICAgICBzaWduYWw/OiBBYm9ydFNpZ25hbCxcbiAgICApIHtcbiAgICAgICAgcmV0dXJuIHRoaXMucmF3LnNldFN0aWNrZXJQb3NpdGlvbkluU2V0KHsgc3RpY2tlciwgcG9zaXRpb24gfSwgc2lnbmFsKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBVc2UgdGhpcyBtZXRob2QgdG8gZGVsZXRlIGEgc3RpY2tlciBmcm9tIGEgc2V0IGNyZWF0ZWQgYnkgdGhlIGJvdC4gUmV0dXJucyBUcnVlIG9uIHN1Y2Nlc3MuXG4gICAgICpcbiAgICAgKiBAcGFyYW0gc3RpY2tlciBGaWxlIGlkZW50aWZpZXIgb2YgdGhlIHN0aWNrZXJcbiAgICAgKiBAcGFyYW0gc2lnbmFsIE9wdGlvbmFsIGBBYm9ydFNpZ25hbGAgdG8gY2FuY2VsIHRoZSByZXF1ZXN0XG4gICAgICpcbiAgICAgKiAqKk9mZmljaWFsIHJlZmVyZW5jZToqKiBodHRwczovL2NvcmUudGVsZWdyYW0ub3JnL2JvdHMvYXBpI2RlbGV0ZXN0aWNrZXJmcm9tc2V0XG4gICAgICovXG4gICAgZGVsZXRlU3RpY2tlckZyb21TZXQoc3RpY2tlcjogc3RyaW5nLCBzaWduYWw/OiBBYm9ydFNpZ25hbCkge1xuICAgICAgICByZXR1cm4gdGhpcy5yYXcuZGVsZXRlU3RpY2tlckZyb21TZXQoeyBzdGlja2VyIH0sIHNpZ25hbCk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogVXNlIHRoaXMgbWV0aG9kIHRvIHJlcGxhY2UgYW4gZXhpc3Rpbmcgc3RpY2tlciBpbiBhIHN0aWNrZXIgc2V0IHdpdGggYSBuZXcgb25lLiBUaGUgbWV0aG9kIGlzIGVxdWl2YWxlbnQgdG8gY2FsbGluZyBkZWxldGVTdGlja2VyRnJvbVNldCwgdGhlbiBhZGRTdGlja2VyVG9TZXQsIHRoZW4gc2V0U3RpY2tlclBvc2l0aW9uSW5TZXQuIFJldHVybnMgVHJ1ZSBvbiBzdWNjZXNzLlxuICAgICAqXG4gICAgICogQHBhcmFtIHVzZXJfaWQgVXNlciBpZGVudGlmaWVyIG9mIHRoZSBzdGlja2VyIHNldCBvd25lclxuICAgICAqIEBwYXJhbSBuYW1lIFN0aWNrZXIgc2V0IG5hbWVcbiAgICAgKiBAcGFyYW0gb2xkX3N0aWNrZXIgRmlsZSBpZGVudGlmaWVyIG9mIHRoZSByZXBsYWNlZCBzdGlja2VyXG4gICAgICogQHBhcmFtIHN0aWNrZXIgQW4gb2JqZWN0IHdpdGggaW5mb3JtYXRpb24gYWJvdXQgdGhlIGFkZGVkIHN0aWNrZXIuIElmIGV4YWN0bHkgdGhlIHNhbWUgc3RpY2tlciBoYWQgYWxyZWFkeSBiZWVuIGFkZGVkIHRvIHRoZSBzZXQsIHRoZW4gdGhlIHNldCByZW1haW5zIHVuY2hhbmdlZC46eFxuICAgICAqIEBwYXJhbSBzaWduYWwgT3B0aW9uYWwgYEFib3J0U2lnbmFsYCB0byBjYW5jZWwgdGhlIHJlcXVlc3RcbiAgICAgKlxuICAgICAqICoqT2ZmaWNpYWwgcmVmZXJlbmNlOioqIGh0dHBzOi8vY29yZS50ZWxlZ3JhbS5vcmcvYm90cy9hcGkjcmVwbGFjZXN0aWNrZXJpbnNldFxuICAgICAqL1xuICAgIHJlcGxhY2VTdGlja2VySW5TZXQoXG4gICAgICAgIHVzZXJfaWQ6IG51bWJlcixcbiAgICAgICAgbmFtZTogc3RyaW5nLFxuICAgICAgICBvbGRfc3RpY2tlcjogc3RyaW5nLFxuICAgICAgICBzdGlja2VyOiBJbnB1dFN0aWNrZXIsXG4gICAgICAgIHNpZ25hbD86IEFib3J0U2lnbmFsLFxuICAgICkge1xuICAgICAgICByZXR1cm4gdGhpcy5yYXcucmVwbGFjZVN0aWNrZXJJblNldChcbiAgICAgICAgICAgIHsgdXNlcl9pZCwgbmFtZSwgb2xkX3N0aWNrZXIsIHN0aWNrZXIgfSxcbiAgICAgICAgICAgIHNpZ25hbCxcbiAgICAgICAgKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBVc2UgdGhpcyBtZXRob2QgdG8gY2hhbmdlIHRoZSBsaXN0IG9mIGVtb2ppIGFzc2lnbmVkIHRvIGEgcmVndWxhciBvciBjdXN0b20gZW1vamkgc3RpY2tlci4gVGhlIHN0aWNrZXIgbXVzdCBiZWxvbmcgdG8gYSBzdGlja2VyIHNldCBjcmVhdGVkIGJ5IHRoZSBib3QuIFJldHVybnMgVHJ1ZSBvbiBzdWNjZXNzLlxuICAgICAqXG4gICAgICogQHBhcmFtIHN0aWNrZXIgRmlsZSBpZGVudGlmaWVyIG9mIHRoZSBzdGlja2VyXG4gICAgICogQHBhcmFtIGVtb2ppX2xpc3QgQSBsaXN0IG9mIDEtMjAgZW1vamkgYXNzb2NpYXRlZCB3aXRoIHRoZSBzdGlja2VyXG4gICAgICogQHBhcmFtIHNpZ25hbCBPcHRpb25hbCBgQWJvcnRTaWduYWxgIHRvIGNhbmNlbCB0aGUgcmVxdWVzdFxuICAgICAqXG4gICAgICogKipPZmZpY2lhbCByZWZlcmVuY2U6KiogaHR0cHM6Ly9jb3JlLnRlbGVncmFtLm9yZy9ib3RzL2FwaSNzZXRzdGlja2VyZW1vamlsaXN0XG4gICAgICovXG4gICAgc2V0U3RpY2tlckVtb2ppTGlzdChcbiAgICAgICAgc3RpY2tlcjogc3RyaW5nLFxuICAgICAgICBlbW9qaV9saXN0OiBzdHJpbmdbXSxcbiAgICAgICAgc2lnbmFsPzogQWJvcnRTaWduYWwsXG4gICAgKSB7XG4gICAgICAgIHJldHVybiB0aGlzLnJhdy5zZXRTdGlja2VyRW1vamlMaXN0KHsgc3RpY2tlciwgZW1vamlfbGlzdCB9LCBzaWduYWwpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFVzZSB0aGlzIG1ldGhvZCB0byBjaGFuZ2Ugc2VhcmNoIGtleXdvcmRzIGFzc2lnbmVkIHRvIGEgcmVndWxhciBvciBjdXN0b20gZW1vamkgc3RpY2tlci4gVGhlIHN0aWNrZXIgbXVzdCBiZWxvbmcgdG8gYSBzdGlja2VyIHNldCBjcmVhdGVkIGJ5IHRoZSBib3QuIFJldHVybnMgVHJ1ZSBvbiBzdWNjZXNzLlxuICAgICAqXG4gICAgICogQHBhcmFtIHN0aWNrZXIgRmlsZSBpZGVudGlmaWVyIG9mIHRoZSBzdGlja2VyXG4gICAgICogQHBhcmFtIGtleXdvcmRzIEEgbGlzdCBvZiAwLTIwIHNlYXJjaCBrZXl3b3JkcyBmb3IgdGhlIHN0aWNrZXIgd2l0aCB0b3RhbCBsZW5ndGggb2YgdXAgdG8gNjQgY2hhcmFjdGVyc1xuICAgICAqIEBwYXJhbSBzaWduYWwgT3B0aW9uYWwgYEFib3J0U2lnbmFsYCB0byBjYW5jZWwgdGhlIHJlcXVlc3RcbiAgICAgKlxuICAgICAqICoqT2ZmaWNpYWwgcmVmZXJlbmNlOioqIGh0dHBzOi8vY29yZS50ZWxlZ3JhbS5vcmcvYm90cy9hcGkjc2V0c3RpY2tlcmtleXdvcmRzXG4gICAgICovXG4gICAgc2V0U3RpY2tlcktleXdvcmRzKFxuICAgICAgICBzdGlja2VyOiBzdHJpbmcsXG4gICAgICAgIGtleXdvcmRzOiBzdHJpbmdbXSxcbiAgICAgICAgc2lnbmFsPzogQWJvcnRTaWduYWwsXG4gICAgKSB7XG4gICAgICAgIHJldHVybiB0aGlzLnJhdy5zZXRTdGlja2VyS2V5d29yZHMoeyBzdGlja2VyLCBrZXl3b3JkcyB9LCBzaWduYWwpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFVzZSB0aGlzIG1ldGhvZCB0byBjaGFuZ2UgdGhlIG1hc2sgcG9zaXRpb24gb2YgYSBtYXNrIHN0aWNrZXIuIFRoZSBzdGlja2VyIG11c3QgYmVsb25nIHRvIGEgc3RpY2tlciBzZXQgdGhhdCB3YXMgY3JlYXRlZCBieSB0aGUgYm90LiBSZXR1cm5zIFRydWUgb24gc3VjY2Vzcy5cbiAgICAgKlxuICAgICAqIEBwYXJhbSBzdGlja2VyIEZpbGUgaWRlbnRpZmllciBvZiB0aGUgc3RpY2tlclxuICAgICAqIEBwYXJhbSBtYXNrX3Bvc2l0aW9uIEFuIG9iamVjdCB3aXRoIHRoZSBwb3NpdGlvbiB3aGVyZSB0aGUgbWFzayBzaG91bGQgYmUgcGxhY2VkIG9uIGZhY2VzLiBPbWl0IHRoZSBwYXJhbWV0ZXIgdG8gcmVtb3ZlIHRoZSBtYXNrIHBvc2l0aW9uLlxuICAgICAqIEBwYXJhbSBzaWduYWwgT3B0aW9uYWwgYEFib3J0U2lnbmFsYCB0byBjYW5jZWwgdGhlIHJlcXVlc3RcbiAgICAgKlxuICAgICAqICoqT2ZmaWNpYWwgcmVmZXJlbmNlOioqIGh0dHBzOi8vY29yZS50ZWxlZ3JhbS5vcmcvYm90cy9hcGkjc2V0c3RpY2tlcm1hc2twb3NpdGlvblxuICAgICAqL1xuICAgIHNldFN0aWNrZXJNYXNrUG9zaXRpb24oXG4gICAgICAgIHN0aWNrZXI6IHN0cmluZyxcbiAgICAgICAgbWFza19wb3NpdGlvbj86IE1hc2tQb3NpdGlvbixcbiAgICAgICAgc2lnbmFsPzogQWJvcnRTaWduYWwsXG4gICAgKSB7XG4gICAgICAgIHJldHVybiB0aGlzLnJhdy5zZXRTdGlja2VyTWFza1Bvc2l0aW9uKFxuICAgICAgICAgICAgeyBzdGlja2VyLCBtYXNrX3Bvc2l0aW9uIH0sXG4gICAgICAgICAgICBzaWduYWwsXG4gICAgICAgICk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogVXNlIHRoaXMgbWV0aG9kIHRvIHNldCB0aGUgdGl0bGUgb2YgYSBjcmVhdGVkIHN0aWNrZXIgc2V0LiBSZXR1cm5zIFRydWUgb24gc3VjY2Vzcy5cbiAgICAgKlxuICAgICAqIEBwYXJhbSBuYW1lIFN0aWNrZXIgc2V0IG5hbWVcbiAgICAgKiBAcGFyYW0gdGl0bGUgU3RpY2tlciBzZXQgdGl0bGUsIDEtNjQgY2hhcmFjdGVyc1xuICAgICAqIEBwYXJhbSBzaWduYWwgT3B0aW9uYWwgYEFib3J0U2lnbmFsYCB0byBjYW5jZWwgdGhlIHJlcXVlc3RcbiAgICAgKlxuICAgICAqICoqT2ZmaWNpYWwgcmVmZXJlbmNlOioqIGh0dHBzOi8vY29yZS50ZWxlZ3JhbS5vcmcvYm90cy9hcGkjc2V0c3RpY2tlcnNldHRpdGxlXG4gICAgICovXG4gICAgc2V0U3RpY2tlclNldFRpdGxlKG5hbWU6IHN0cmluZywgdGl0bGU6IHN0cmluZywgc2lnbmFsPzogQWJvcnRTaWduYWwpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMucmF3LnNldFN0aWNrZXJTZXRUaXRsZSh7IG5hbWUsIHRpdGxlIH0sIHNpZ25hbCk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogVXNlIHRoaXMgbWV0aG9kIHRvIGRlbGV0ZSBhIHN0aWNrZXIgc2V0IHRoYXQgd2FzIGNyZWF0ZWQgYnkgdGhlIGJvdC4gUmV0dXJucyBUcnVlIG9uIHN1Y2Nlc3MuXG4gICAgICpcbiAgICAgKiBAcGFyYW0gbmFtZSBTdGlja2VyIHNldCBuYW1lXG4gICAgICogQHBhcmFtIHNpZ25hbCBPcHRpb25hbCBgQWJvcnRTaWduYWxgIHRvIGNhbmNlbCB0aGUgcmVxdWVzdFxuICAgICAqXG4gICAgICogKipPZmZpY2lhbCByZWZlcmVuY2U6KiogaHR0cHM6Ly9jb3JlLnRlbGVncmFtLm9yZy9ib3RzL2FwaSNkZWxldGVzdGlja2Vyc2V0XG4gICAgICovXG4gICAgZGVsZXRlU3RpY2tlclNldChuYW1lOiBzdHJpbmcsIHNpZ25hbD86IEFib3J0U2lnbmFsKSB7XG4gICAgICAgIHJldHVybiB0aGlzLnJhdy5kZWxldGVTdGlja2VyU2V0KHsgbmFtZSB9LCBzaWduYWwpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFVzZSB0aGlzIG1ldGhvZCB0byBzZXQgdGhlIHRodW1ibmFpbCBvZiBhIHJlZ3VsYXIgb3IgbWFzayBzdGlja2VyIHNldC4gVGhlIGZvcm1hdCBvZiB0aGUgdGh1bWJuYWlsIGZpbGUgbXVzdCBtYXRjaCB0aGUgZm9ybWF0IG9mIHRoZSBzdGlja2VycyBpbiB0aGUgc2V0LiBSZXR1cm5zIFRydWUgb24gc3VjY2Vzcy5cbiAgICAgKlxuICAgICAqIEBwYXJhbSBuYW1lIFN0aWNrZXIgc2V0IG5hbWVcbiAgICAgKiBAcGFyYW0gdXNlcl9pZCBVc2VyIGlkZW50aWZpZXIgb2YgdGhlIHN0aWNrZXIgc2V0IG93bmVyXG4gICAgICogQHBhcmFtIHRodW1ibmFpbCBBIC5XRUJQIG9yIC5QTkcgaW1hZ2Ugd2l0aCB0aGUgdGh1bWJuYWlsLCBtdXN0IGJlIHVwIHRvIDEyOCBraWxvYnl0ZXMgaW4gc2l6ZSBhbmQgaGF2ZSBhIHdpZHRoIGFuZCBoZWlnaHQgb2YgZXhhY3RseSAxMDBweCwgb3IgYSAuVEdTIGFuaW1hdGlvbiB3aXRoIGEgdGh1bWJuYWlsIHVwIHRvIDMyIGtpbG9ieXRlcyBpbiBzaXplIChzZWUgaHR0cHM6Ly9jb3JlLnRlbGVncmFtLm9yZy9zdGlja2VycyNhbmltYXRlZC1zdGlja2VyLXJlcXVpcmVtZW50cyBmb3IgYW5pbWF0ZWQgc3RpY2tlciB0ZWNobmljYWwgcmVxdWlyZW1lbnRzKSwgb3IgYSBXRUJNIHZpZGVvIHdpdGggdGhlIHRodW1ibmFpbCB1cCB0byAzMiBraWxvYnl0ZXMgaW4gc2l6ZTsgc2VlIGh0dHBzOi8vY29yZS50ZWxlZ3JhbS5vcmcvc3RpY2tlcnMjdmlkZW8tc3RpY2tlci1yZXF1aXJlbWVudHMgZm9yIHZpZGVvIHN0aWNrZXIgdGVjaG5pY2FsIHJlcXVpcmVtZW50cy4gUGFzcyBhIGZpbGVfaWQgYXMgYSBTdHJpbmcgdG8gc2VuZCBhIGZpbGUgdGhhdCBhbHJlYWR5IGV4aXN0cyBvbiB0aGUgVGVsZWdyYW0gc2VydmVycywgcGFzcyBhbiBIVFRQIFVSTCBhcyBhIFN0cmluZyBmb3IgVGVsZWdyYW0gdG8gZ2V0IGEgZmlsZSBmcm9tIHRoZSBJbnRlcm5ldCwgb3IgdXBsb2FkIGEgbmV3IG9uZSB1c2luZyBtdWx0aXBhcnQvZm9ybS1kYXRhLiBNb3JlIGluZm9ybWF0aW9uIG9uIFNlbmRpbmcgRmlsZXMgwrsuIEFuaW1hdGVkIGFuZCB2aWRlbyBzdGlja2VyIHNldCB0aHVtYm5haWxzIGNhbid0IGJlIHVwbG9hZGVkIHZpYSBIVFRQIFVSTC4gSWYgb21pdHRlZCwgdGhlbiB0aGUgdGh1bWJuYWlsIGlzIGRyb3BwZWQgYW5kIHRoZSBmaXJzdCBzdGlja2VyIGlzIHVzZWQgYXMgdGhlIHRodW1ibmFpbC5cbiAgICAgKiBAcGFyYW0gZm9ybWF0IEZvcm1hdCBvZiB0aGUgdGh1bWJuYWlsLCBtdXN0IGJlIG9uZSBvZiDigJxzdGF0aWPigJ0gZm9yIGEgLldFQlAgb3IgLlBORyBpbWFnZSwg4oCcYW5pbWF0ZWTigJ0gZm9yIGEgLlRHUyBhbmltYXRpb24sIG9yIOKAnHZpZGVv4oCdIGZvciBhIFdFQk0gdmlkZW9cbiAgICAgKiBAcGFyYW0gc2lnbmFsIE9wdGlvbmFsIGBBYm9ydFNpZ25hbGAgdG8gY2FuY2VsIHRoZSByZXF1ZXN0XG4gICAgICpcbiAgICAgKiAqKk9mZmljaWFsIHJlZmVyZW5jZToqKiBodHRwczovL2NvcmUudGVsZWdyYW0ub3JnL2JvdHMvYXBpI3NldHN0aWNrZXJzZXR0aHVtYm5haWxcbiAgICAgKi9cbiAgICBzZXRTdGlja2VyU2V0VGh1bWJuYWlsKFxuICAgICAgICBuYW1lOiBzdHJpbmcsXG4gICAgICAgIHVzZXJfaWQ6IG51bWJlcixcbiAgICAgICAgdGh1bWJuYWlsOiBJbnB1dEZpbGUgfCBzdHJpbmcgfCB1bmRlZmluZWQsXG4gICAgICAgIGZvcm1hdDogXCJzdGF0aWNcIiB8IFwiYW5pbWF0ZWRcIiB8IFwidmlkZW9cIixcbiAgICAgICAgc2lnbmFsPzogQWJvcnRTaWduYWwsXG4gICAgKSB7XG4gICAgICAgIHJldHVybiB0aGlzLnJhdy5zZXRTdGlja2VyU2V0VGh1bWJuYWlsKFxuICAgICAgICAgICAgeyBuYW1lLCB1c2VyX2lkLCB0aHVtYm5haWwsIGZvcm1hdCB9LFxuICAgICAgICAgICAgc2lnbmFsLFxuICAgICAgICApO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFVzZSB0aGlzIG1ldGhvZCB0byBzZXQgdGhlIHRodW1ibmFpbCBvZiBhIGN1c3RvbSBlbW9qaSBzdGlja2VyIHNldC4gUmV0dXJucyBUcnVlIG9uIHN1Y2Nlc3MuXG4gICAgICpcbiAgICAgKiBAcGFyYW0gbmFtZSBTdGlja2VyIHNldCBuYW1lXG4gICAgICogQHBhcmFtIGN1c3RvbV9lbW9qaV9pZCBDdXN0b20gZW1vamkgaWRlbnRpZmllciBvZiBhIHN0aWNrZXIgZnJvbSB0aGUgc3RpY2tlciBzZXQ7IHBhc3MgYW4gZW1wdHkgc3RyaW5nIHRvIGRyb3AgdGhlIHRodW1ibmFpbCBhbmQgdXNlIHRoZSBmaXJzdCBzdGlja2VyIGFzIHRoZSB0aHVtYm5haWwuXG4gICAgICogQHBhcmFtIHNpZ25hbCBPcHRpb25hbCBgQWJvcnRTaWduYWxgIHRvIGNhbmNlbCB0aGUgcmVxdWVzdFxuICAgICAqXG4gICAgICogKipPZmZpY2lhbCByZWZlcmVuY2U6KiogaHR0cHM6Ly9jb3JlLnRlbGVncmFtLm9yZy9ib3RzL2FwaSNzZXRjdXN0b21lbW9qaXN0aWNrZXJzZXR0aHVtYm5haWxcbiAgICAgKi9cbiAgICBzZXRDdXN0b21FbW9qaVN0aWNrZXJTZXRUaHVtYm5haWwoXG4gICAgICAgIG5hbWU6IHN0cmluZyxcbiAgICAgICAgY3VzdG9tX2Vtb2ppX2lkOiBzdHJpbmcsXG4gICAgICAgIHNpZ25hbD86IEFib3J0U2lnbmFsLFxuICAgICkge1xuICAgICAgICByZXR1cm4gdGhpcy5yYXcuc2V0Q3VzdG9tRW1vamlTdGlja2VyU2V0VGh1bWJuYWlsKHtcbiAgICAgICAgICAgIG5hbWUsXG4gICAgICAgICAgICBjdXN0b21fZW1vamlfaWQsXG4gICAgICAgIH0sIHNpZ25hbCk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogVXNlIHRoaXMgbWV0aG9kIHRvIHNlbmQgYW5zd2VycyB0byBhbiBpbmxpbmUgcXVlcnkuIE9uIHN1Y2Nlc3MsIFRydWUgaXMgcmV0dXJuZWQuXG4gICAgICogTm8gbW9yZSB0aGFuIDUwIHJlc3VsdHMgcGVyIHF1ZXJ5IGFyZSBhbGxvd2VkLlxuICAgICAqXG4gICAgICogRXhhbXBsZTogQW4gaW5saW5lIGJvdCB0aGF0IHNlbmRzIFlvdVR1YmUgdmlkZW9zIGNhbiBhc2sgdGhlIHVzZXIgdG8gY29ubmVjdCB0aGUgYm90IHRvIHRoZWlyIFlvdVR1YmUgYWNjb3VudCB0byBhZGFwdCBzZWFyY2ggcmVzdWx0cyBhY2NvcmRpbmdseS4gVG8gZG8gdGhpcywgaXQgZGlzcGxheXMgYSAnQ29ubmVjdCB5b3VyIFlvdVR1YmUgYWNjb3VudCcgYnV0dG9uIGFib3ZlIHRoZSByZXN1bHRzLCBvciBldmVuIGJlZm9yZSBzaG93aW5nIGFueS4gVGhlIHVzZXIgcHJlc3NlcyB0aGUgYnV0dG9uLCBzd2l0Y2hlcyB0byBhIHByaXZhdGUgY2hhdCB3aXRoIHRoZSBib3QgYW5kLCBpbiBkb2luZyBzbywgcGFzc2VzIGEgc3RhcnQgcGFyYW1ldGVyIHRoYXQgaW5zdHJ1Y3RzIHRoZSBib3QgdG8gcmV0dXJuIGFuIE9BdXRoIGxpbmsuIE9uY2UgZG9uZSwgdGhlIGJvdCBjYW4gb2ZmZXIgYSBzd2l0Y2hfaW5saW5lIGJ1dHRvbiBzbyB0aGF0IHRoZSB1c2VyIGNhbiBlYXNpbHkgcmV0dXJuIHRvIHRoZSBjaGF0IHdoZXJlIHRoZXkgd2FudGVkIHRvIHVzZSB0aGUgYm90J3MgaW5saW5lIGNhcGFiaWxpdGllcy5cbiAgICAgKlxuICAgICAqIEBwYXJhbSBpbmxpbmVfcXVlcnlfaWQgVW5pcXVlIGlkZW50aWZpZXIgZm9yIHRoZSBhbnN3ZXJlZCBxdWVyeVxuICAgICAqIEBwYXJhbSByZXN1bHRzIEFuIGFycmF5IG9mIHJlc3VsdHMgZm9yIHRoZSBpbmxpbmUgcXVlcnlcbiAgICAgKiBAcGFyYW0gb3RoZXIgT3B0aW9uYWwgcmVtYWluaW5nIHBhcmFtZXRlcnMsIGNvbmZlciB0aGUgb2ZmaWNpYWwgcmVmZXJlbmNlIGJlbG93XG4gICAgICogQHBhcmFtIHNpZ25hbCBPcHRpb25hbCBgQWJvcnRTaWduYWxgIHRvIGNhbmNlbCB0aGUgcmVxdWVzdFxuICAgICAqXG4gICAgICogKipPZmZpY2lhbCByZWZlcmVuY2U6KiogaHR0cHM6Ly9jb3JlLnRlbGVncmFtLm9yZy9ib3RzL2FwaSNhbnN3ZXJpbmxpbmVxdWVyeVxuICAgICAqL1xuICAgIGFuc3dlcklubGluZVF1ZXJ5KFxuICAgICAgICBpbmxpbmVfcXVlcnlfaWQ6IHN0cmluZyxcbiAgICAgICAgcmVzdWx0czogcmVhZG9ubHkgSW5saW5lUXVlcnlSZXN1bHRbXSxcbiAgICAgICAgb3RoZXI/OiBPdGhlcjxSLCBcImFuc3dlcklubGluZVF1ZXJ5XCIsIFwiaW5saW5lX3F1ZXJ5X2lkXCIgfCBcInJlc3VsdHNcIj4sXG4gICAgICAgIHNpZ25hbD86IEFib3J0U2lnbmFsLFxuICAgICkge1xuICAgICAgICByZXR1cm4gdGhpcy5yYXcuYW5zd2VySW5saW5lUXVlcnkoXG4gICAgICAgICAgICB7IGlubGluZV9xdWVyeV9pZCwgcmVzdWx0cywgLi4ub3RoZXIgfSxcbiAgICAgICAgICAgIHNpZ25hbCxcbiAgICAgICAgKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBVc2UgdGhpcyBtZXRob2QgdG8gc2V0IHRoZSByZXN1bHQgb2YgYW4gaW50ZXJhY3Rpb24gd2l0aCBhIFdlYiBBcHAgYW5kIHNlbmQgYSBjb3JyZXNwb25kaW5nIG1lc3NhZ2Ugb24gYmVoYWxmIG9mIHRoZSB1c2VyIHRvIHRoZSBjaGF0IGZyb20gd2hpY2ggdGhlIHF1ZXJ5IG9yaWdpbmF0ZWQuIE9uIHN1Y2Nlc3MsIGEgU2VudFdlYkFwcE1lc3NhZ2Ugb2JqZWN0IGlzIHJldHVybmVkLlxuICAgICAqXG4gICAgICogQHBhcmFtIHdlYl9hcHBfcXVlcnlfaWQgVW5pcXVlIGlkZW50aWZpZXIgZm9yIHRoZSBxdWVyeSB0byBiZSBhbnN3ZXJlZFxuICAgICAqIEBwYXJhbSByZXN1bHQgQW4gb2JqZWN0IGRlc2NyaWJpbmcgdGhlIG1lc3NhZ2UgdG8gYmUgc2VudFxuICAgICAqIEBwYXJhbSBzaWduYWwgT3B0aW9uYWwgYEFib3J0U2lnbmFsYCB0byBjYW5jZWwgdGhlIHJlcXVlc3RcbiAgICAgKlxuICAgICAqICoqT2ZmaWNpYWwgcmVmZXJlbmNlOioqIGh0dHBzOi8vY29yZS50ZWxlZ3JhbS5vcmcvYm90cy9hcGkjYW5zd2Vyd2ViYXBwcXVlcnlcbiAgICAgKi9cbiAgICBhbnN3ZXJXZWJBcHBRdWVyeShcbiAgICAgICAgd2ViX2FwcF9xdWVyeV9pZDogc3RyaW5nLFxuICAgICAgICByZXN1bHQ6IElubGluZVF1ZXJ5UmVzdWx0LFxuICAgICAgICBzaWduYWw/OiBBYm9ydFNpZ25hbCxcbiAgICApIHtcbiAgICAgICAgcmV0dXJuIHRoaXMucmF3LmFuc3dlcldlYkFwcFF1ZXJ5KHsgd2ViX2FwcF9xdWVyeV9pZCwgcmVzdWx0IH0sIHNpZ25hbCk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogVXNlIHRoaXMgbWV0aG9kIHRvIHNlbmQgaW52b2ljZXMuIE9uIHN1Y2Nlc3MsIHRoZSBzZW50IE1lc3NhZ2UgaXMgcmV0dXJuZWQuXG4gICAgICpcbiAgICAgKiBAcGFyYW0gY2hhdF9pZCBVbmlxdWUgaWRlbnRpZmllciBmb3IgdGhlIHRhcmdldCBjaGF0IG9yIHVzZXJuYW1lIG9mIHRoZSB0YXJnZXQgY2hhbm5lbCAoaW4gdGhlIGZvcm1hdCBAY2hhbm5lbHVzZXJuYW1lKVxuICAgICAqIEBwYXJhbSB0aXRsZSBQcm9kdWN0IG5hbWUsIDEtMzIgY2hhcmFjdGVyc1xuICAgICAqIEBwYXJhbSBkZXNjcmlwdGlvbiBQcm9kdWN0IGRlc2NyaXB0aW9uLCAxLTI1NSBjaGFyYWN0ZXJzXG4gICAgICogQHBhcmFtIHBheWxvYWQgQm90LWRlZmluZWQgaW52b2ljZSBwYXlsb2FkLCAxLTEyOCBieXRlcy4gVGhpcyB3aWxsIG5vdCBiZSBkaXNwbGF5ZWQgdG8gdGhlIHVzZXIsIHVzZSBmb3IgeW91ciBpbnRlcm5hbCBwcm9jZXNzZXMuXG4gICAgICogQHBhcmFtIGN1cnJlbmN5IFRocmVlLWxldHRlciBJU08gNDIxNyBjdXJyZW5jeSBjb2RlLCBzZWUgbW9yZSBvbiBjdXJyZW5jaWVzXG4gICAgICogQHBhcmFtIHByaWNlcyBQcmljZSBicmVha2Rvd24sIGEgbGlzdCBvZiBjb21wb25lbnRzIChlLmcuIHByb2R1Y3QgcHJpY2UsIHRheCwgZGlzY291bnQsIGRlbGl2ZXJ5IGNvc3QsIGRlbGl2ZXJ5IHRheCwgYm9udXMsIGV0Yy4pXG4gICAgICogQHBhcmFtIG90aGVyIE9wdGlvbmFsIHJlbWFpbmluZyBwYXJhbWV0ZXJzLCBjb25mZXIgdGhlIG9mZmljaWFsIHJlZmVyZW5jZSBiZWxvd1xuICAgICAqIEBwYXJhbSBzaWduYWwgT3B0aW9uYWwgYEFib3J0U2lnbmFsYCB0byBjYW5jZWwgdGhlIHJlcXVlc3RcbiAgICAgKlxuICAgICAqICoqT2ZmaWNpYWwgcmVmZXJlbmNlOioqIGh0dHBzOi8vY29yZS50ZWxlZ3JhbS5vcmcvYm90cy9hcGkjc2VuZGludm9pY2VcbiAgICAgKi9cbiAgICBzZW5kSW52b2ljZShcbiAgICAgICAgY2hhdF9pZDogbnVtYmVyIHwgc3RyaW5nLFxuICAgICAgICB0aXRsZTogc3RyaW5nLFxuICAgICAgICBkZXNjcmlwdGlvbjogc3RyaW5nLFxuICAgICAgICBwYXlsb2FkOiBzdHJpbmcsXG4gICAgICAgIGN1cnJlbmN5OiBzdHJpbmcsXG4gICAgICAgIHByaWNlczogcmVhZG9ubHkgTGFiZWxlZFByaWNlW10sXG4gICAgICAgIG90aGVyPzogT3RoZXI8XG4gICAgICAgICAgICBSLFxuICAgICAgICAgICAgXCJzZW5kSW52b2ljZVwiLFxuICAgICAgICAgICAgfCBcImNoYXRfaWRcIlxuICAgICAgICAgICAgfCBcInRpdGxlXCJcbiAgICAgICAgICAgIHwgXCJkZXNjcmlwdGlvblwiXG4gICAgICAgICAgICB8IFwicGF5bG9hZFwiXG4gICAgICAgICAgICB8IFwiY3VycmVuY3lcIlxuICAgICAgICAgICAgfCBcInByaWNlc1wiXG4gICAgICAgID4sXG4gICAgICAgIHNpZ25hbD86IEFib3J0U2lnbmFsLFxuICAgICkge1xuICAgICAgICByZXR1cm4gdGhpcy5yYXcuc2VuZEludm9pY2Uoe1xuICAgICAgICAgICAgY2hhdF9pZCxcbiAgICAgICAgICAgIHRpdGxlLFxuICAgICAgICAgICAgZGVzY3JpcHRpb24sXG4gICAgICAgICAgICBwYXlsb2FkLFxuICAgICAgICAgICAgY3VycmVuY3ksXG4gICAgICAgICAgICBwcmljZXMsXG4gICAgICAgICAgICAuLi5vdGhlcixcbiAgICAgICAgfSwgc2lnbmFsKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBVc2UgdGhpcyBtZXRob2QgdG8gY3JlYXRlIGEgbGluayBmb3IgYW4gaW52b2ljZS4gUmV0dXJucyB0aGUgY3JlYXRlZCBpbnZvaWNlIGxpbmsgYXMgU3RyaW5nIG9uIHN1Y2Nlc3MuXG4gICAgICpcbiAgICAgKiBAcGFyYW0gdGl0bGUgUHJvZHVjdCBuYW1lLCAxLTMyIGNoYXJhY3RlcnNcbiAgICAgKiBAcGFyYW0gZGVzY3JpcHRpb24gUHJvZHVjdCBkZXNjcmlwdGlvbiwgMS0yNTUgY2hhcmFjdGVyc1xuICAgICAqIEBwYXJhbSBwYXlsb2FkIEJvdC1kZWZpbmVkIGludm9pY2UgcGF5bG9hZCwgMS0xMjggYnl0ZXMuIFRoaXMgd2lsbCBub3QgYmUgZGlzcGxheWVkIHRvIHRoZSB1c2VyLCB1c2UgZm9yIHlvdXIgaW50ZXJuYWwgcHJvY2Vzc2VzLlxuICAgICAqIEBwYXJhbSBwcm92aWRlcl90b2tlbiBQYXltZW50IHByb3ZpZGVyIHRva2VuLCBvYnRhaW5lZCB2aWEgQm90RmF0aGVyXG4gICAgICogQHBhcmFtIGN1cnJlbmN5IFRocmVlLWxldHRlciBJU08gNDIxNyBjdXJyZW5jeSBjb2RlLCBzZWUgbW9yZSBvbiBjdXJyZW5jaWVzXG4gICAgICogQHBhcmFtIHByaWNlcyBQcmljZSBicmVha2Rvd24sIGEgbGlzdCBvZiBjb21wb25lbnRzIChlLmcuIHByb2R1Y3QgcHJpY2UsIHRheCwgZGlzY291bnQsIGRlbGl2ZXJ5IGNvc3QsIGRlbGl2ZXJ5IHRheCwgYm9udXMsIGV0Yy4pXG4gICAgICogQHBhcmFtIG90aGVyIE9wdGlvbmFsIHJlbWFpbmluZyBwYXJhbWV0ZXJzLCBjb25mZXIgdGhlIG9mZmljaWFsIHJlZmVyZW5jZSBiZWxvd1xuICAgICAqIEBwYXJhbSBzaWduYWwgT3B0aW9uYWwgYEFib3J0U2lnbmFsYCB0byBjYW5jZWwgdGhlIHJlcXVlc3RcbiAgICAgKlxuICAgICAqICoqT2ZmaWNpYWwgcmVmZXJlbmNlOioqIGh0dHBzOi8vY29yZS50ZWxlZ3JhbS5vcmcvYm90cy9hcGkjY3JlYXRlaW52b2ljZWxpbmtcbiAgICAgKi9cbiAgICBjcmVhdGVJbnZvaWNlTGluayhcbiAgICAgICAgdGl0bGU6IHN0cmluZyxcbiAgICAgICAgZGVzY3JpcHRpb246IHN0cmluZyxcbiAgICAgICAgcGF5bG9hZDogc3RyaW5nLFxuICAgICAgICBwcm92aWRlcl90b2tlbjogc3RyaW5nLFxuICAgICAgICBjdXJyZW5jeTogc3RyaW5nLFxuICAgICAgICBwcmljZXM6IExhYmVsZWRQcmljZVtdLFxuICAgICAgICBvdGhlcj86IE90aGVyPFxuICAgICAgICAgICAgUixcbiAgICAgICAgICAgIFwiY3JlYXRlSW52b2ljZUxpbmtcIixcbiAgICAgICAgICAgIHwgXCJ0aXRsZVwiXG4gICAgICAgICAgICB8IFwiZGVzY3JpcHRpb25cIlxuICAgICAgICAgICAgfCBcInBheWxvYWRcIlxuICAgICAgICAgICAgfCBcInByb3ZpZGVyX3Rva2VuXCJcbiAgICAgICAgICAgIHwgXCJjdXJyZW5jeVwiXG4gICAgICAgICAgICB8IFwicHJpY2VzXCJcbiAgICAgICAgPixcbiAgICAgICAgc2lnbmFsPzogQWJvcnRTaWduYWwsXG4gICAgKSB7XG4gICAgICAgIHJldHVybiB0aGlzLnJhdy5jcmVhdGVJbnZvaWNlTGluayh7XG4gICAgICAgICAgICB0aXRsZSxcbiAgICAgICAgICAgIGRlc2NyaXB0aW9uLFxuICAgICAgICAgICAgcGF5bG9hZCxcbiAgICAgICAgICAgIHByb3ZpZGVyX3Rva2VuLFxuICAgICAgICAgICAgY3VycmVuY3ksXG4gICAgICAgICAgICBwcmljZXMsXG4gICAgICAgICAgICAuLi5vdGhlcixcbiAgICAgICAgfSwgc2lnbmFsKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBJZiB5b3Ugc2VudCBhbiBpbnZvaWNlIHJlcXVlc3RpbmcgYSBzaGlwcGluZyBhZGRyZXNzIGFuZCB0aGUgcGFyYW1ldGVyIGlzX2ZsZXhpYmxlIHdhcyBzcGVjaWZpZWQsIHRoZSBCb3QgQVBJIHdpbGwgc2VuZCBhbiBVcGRhdGUgd2l0aCBhIHNoaXBwaW5nX3F1ZXJ5IGZpZWxkIHRvIHRoZSBib3QuIFVzZSB0aGlzIG1ldGhvZCB0byByZXBseSB0byBzaGlwcGluZyBxdWVyaWVzLiBPbiBzdWNjZXNzLCBUcnVlIGlzIHJldHVybmVkLlxuICAgICAqXG4gICAgICogQHBhcmFtIHNoaXBwaW5nX3F1ZXJ5X2lkIFVuaXF1ZSBpZGVudGlmaWVyIGZvciB0aGUgcXVlcnkgdG8gYmUgYW5zd2VyZWRcbiAgICAgKiBAcGFyYW0gb2sgUGFzcyBUcnVlIGlmIGRlbGl2ZXJ5IHRvIHRoZSBzcGVjaWZpZWQgYWRkcmVzcyBpcyBwb3NzaWJsZSBhbmQgRmFsc2UgaWYgdGhlcmUgYXJlIGFueSBwcm9ibGVtcyAoZm9yIGV4YW1wbGUsIGlmIGRlbGl2ZXJ5IHRvIHRoZSBzcGVjaWZpZWQgYWRkcmVzcyBpcyBub3QgcG9zc2libGUpXG4gICAgICogQHBhcmFtIG90aGVyIE9wdGlvbmFsIHJlbWFpbmluZyBwYXJhbWV0ZXJzLCBjb25mZXIgdGhlIG9mZmljaWFsIHJlZmVyZW5jZSBiZWxvd1xuICAgICAqIEBwYXJhbSBzaWduYWwgT3B0aW9uYWwgYEFib3J0U2lnbmFsYCB0byBjYW5jZWwgdGhlIHJlcXVlc3RcbiAgICAgKlxuICAgICAqICoqT2ZmaWNpYWwgcmVmZXJlbmNlOioqIGh0dHBzOi8vY29yZS50ZWxlZ3JhbS5vcmcvYm90cy9hcGkjYW5zd2Vyc2hpcHBpbmdxdWVyeVxuICAgICAqL1xuICAgIGFuc3dlclNoaXBwaW5nUXVlcnkoXG4gICAgICAgIHNoaXBwaW5nX3F1ZXJ5X2lkOiBzdHJpbmcsXG4gICAgICAgIG9rOiBib29sZWFuLFxuICAgICAgICBvdGhlcj86IE90aGVyPFIsIFwiYW5zd2VyU2hpcHBpbmdRdWVyeVwiLCBcInNoaXBwaW5nX3F1ZXJ5X2lkXCIgfCBcIm9rXCI+LFxuICAgICAgICBzaWduYWw/OiBBYm9ydFNpZ25hbCxcbiAgICApIHtcbiAgICAgICAgcmV0dXJuIHRoaXMucmF3LmFuc3dlclNoaXBwaW5nUXVlcnkoXG4gICAgICAgICAgICB7IHNoaXBwaW5nX3F1ZXJ5X2lkLCBvaywgLi4ub3RoZXIgfSxcbiAgICAgICAgICAgIHNpZ25hbCxcbiAgICAgICAgKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBPbmNlIHRoZSB1c2VyIGhhcyBjb25maXJtZWQgdGhlaXIgcGF5bWVudCBhbmQgc2hpcHBpbmcgZGV0YWlscywgdGhlIEJvdCBBUEkgc2VuZHMgdGhlIGZpbmFsIGNvbmZpcm1hdGlvbiBpbiB0aGUgZm9ybSBvZiBhbiBVcGRhdGUgd2l0aCB0aGUgZmllbGQgcHJlX2NoZWNrb3V0X3F1ZXJ5LiBVc2UgdGhpcyBtZXRob2QgdG8gcmVzcG9uZCB0byBzdWNoIHByZS1jaGVja291dCBxdWVyaWVzLiBPbiBzdWNjZXNzLCBUcnVlIGlzIHJldHVybmVkLiBOb3RlOiBUaGUgQm90IEFQSSBtdXN0IHJlY2VpdmUgYW4gYW5zd2VyIHdpdGhpbiAxMCBzZWNvbmRzIGFmdGVyIHRoZSBwcmUtY2hlY2tvdXQgcXVlcnkgd2FzIHNlbnQuXG4gICAgICpcbiAgICAgKiBAcGFyYW0gcHJlX2NoZWNrb3V0X3F1ZXJ5X2lkIFVuaXF1ZSBpZGVudGlmaWVyIGZvciB0aGUgcXVlcnkgdG8gYmUgYW5zd2VyZWRcbiAgICAgKiBAcGFyYW0gb2sgU3BlY2lmeSBUcnVlIGlmIGV2ZXJ5dGhpbmcgaXMgYWxyaWdodCAoZ29vZHMgYXJlIGF2YWlsYWJsZSwgZXRjLikgYW5kIHRoZSBib3QgaXMgcmVhZHkgdG8gcHJvY2VlZCB3aXRoIHRoZSBvcmRlci4gVXNlIEZhbHNlIGlmIHRoZXJlIGFyZSBhbnkgcHJvYmxlbXMuXG4gICAgICogQHBhcmFtIG90aGVyIE9wdGlvbmFsIHJlbWFpbmluZyBwYXJhbWV0ZXJzLCBjb25mZXIgdGhlIG9mZmljaWFsIHJlZmVyZW5jZSBiZWxvd1xuICAgICAqIEBwYXJhbSBzaWduYWwgT3B0aW9uYWwgYEFib3J0U2lnbmFsYCB0byBjYW5jZWwgdGhlIHJlcXVlc3RcbiAgICAgKlxuICAgICAqICoqT2ZmaWNpYWwgcmVmZXJlbmNlOioqIGh0dHBzOi8vY29yZS50ZWxlZ3JhbS5vcmcvYm90cy9hcGkjYW5zd2VycHJlY2hlY2tvdXRxdWVyeVxuICAgICAqL1xuICAgIGFuc3dlclByZUNoZWNrb3V0UXVlcnkoXG4gICAgICAgIHByZV9jaGVja291dF9xdWVyeV9pZDogc3RyaW5nLFxuICAgICAgICBvazogYm9vbGVhbixcbiAgICAgICAgb3RoZXI/OiBPdGhlcjxcbiAgICAgICAgICAgIFIsXG4gICAgICAgICAgICBcImFuc3dlclByZUNoZWNrb3V0UXVlcnlcIixcbiAgICAgICAgICAgIFwicHJlX2NoZWNrb3V0X3F1ZXJ5X2lkXCIgfCBcIm9rXCJcbiAgICAgICAgPixcbiAgICAgICAgc2lnbmFsPzogQWJvcnRTaWduYWwsXG4gICAgKSB7XG4gICAgICAgIHJldHVybiB0aGlzLnJhdy5hbnN3ZXJQcmVDaGVja291dFF1ZXJ5KFxuICAgICAgICAgICAgeyBwcmVfY2hlY2tvdXRfcXVlcnlfaWQsIG9rLCAuLi5vdGhlciB9LFxuICAgICAgICAgICAgc2lnbmFsLFxuICAgICAgICApO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFJldHVybnMgdGhlIGJvdCdzIFRlbGVncmFtIFN0YXIgdHJhbnNhY3Rpb25zIGluIGNocm9ub2xvZ2ljYWwgb3JkZXIuIE9uIHN1Y2Nlc3MsIHJldHVybnMgYSBTdGFyVHJhbnNhY3Rpb25zIG9iamVjdC5cbiAgICAgKlxuICAgICAqIEBwYXJhbSBvdGhlciBPcHRpb25hbCByZW1haW5pbmcgcGFyYW1ldGVycywgY29uZmVyIHRoZSBvZmZpY2lhbCByZWZlcmVuY2UgYmVsb3dcbiAgICAgKiBAcGFyYW0gc2lnbmFsIE9wdGlvbmFsIGBBYm9ydFNpZ25hbGAgdG8gY2FuY2VsIHRoZSByZXF1ZXN0XG4gICAgICpcbiAgICAgKiAqKk9mZmljaWFsIHJlZmVyZW5jZToqKiBodHRwczovL2NvcmUudGVsZWdyYW0ub3JnL2JvdHMvYXBpI2dldHN0YXJ0cmFuc2FjdGlvbnNcbiAgICAgKi9cbiAgICBnZXRTdGFyVHJhbnNhY3Rpb25zKFxuICAgICAgICBvdGhlcj86IE90aGVyPFIsIFwiZ2V0U3RhclRyYW5zYWN0aW9uc1wiPixcbiAgICAgICAgc2lnbmFsPzogQWJvcnRTaWduYWwsXG4gICAgKSB7XG4gICAgICAgIHJldHVybiB0aGlzLnJhdy5nZXRTdGFyVHJhbnNhY3Rpb25zKHsgLi4ub3RoZXIgfSwgc2lnbmFsKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBSZWZ1bmRzIGEgc3VjY2Vzc2Z1bCBwYXltZW50IGluIFRlbGVncmFtIFN0YXJzLlxuICAgICAqXG4gICAgICogQHBhcmFtIHVzZXJfaWQgSWRlbnRpZmllciBvZiB0aGUgdXNlciB3aG9zZSBwYXltZW50IHdpbGwgYmUgcmVmdW5kZWRcbiAgICAgKiBAcGFyYW0gdGVsZWdyYW1fcGF5bWVudF9jaGFyZ2VfaWQgVGVsZWdyYW0gcGF5bWVudCBpZGVudGlmaWVyXG4gICAgICogQHBhcmFtIHNpZ25hbCBPcHRpb25hbCBgQWJvcnRTaWduYWxgIHRvIGNhbmNlbCB0aGUgcmVxdWVzdFxuICAgICAqXG4gICAgICogKipPZmZpY2lhbCByZWZlcmVuY2U6KiogaHR0cHM6Ly9jb3JlLnRlbGVncmFtLm9yZy9ib3RzL2FwaSNyZWZ1bmRzdGFycGF5bWVudFxuICAgICAqL1xuICAgIHJlZnVuZFN0YXJQYXltZW50KFxuICAgICAgICB1c2VyX2lkOiBudW1iZXIsXG4gICAgICAgIHRlbGVncmFtX3BheW1lbnRfY2hhcmdlX2lkOiBzdHJpbmcsXG4gICAgICAgIHNpZ25hbD86IEFib3J0U2lnbmFsLFxuICAgICkge1xuICAgICAgICByZXR1cm4gdGhpcy5yYXcucmVmdW5kU3RhclBheW1lbnQoXG4gICAgICAgICAgICB7IHVzZXJfaWQsIHRlbGVncmFtX3BheW1lbnRfY2hhcmdlX2lkIH0sXG4gICAgICAgICAgICBzaWduYWwsXG4gICAgICAgICk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogSW5mb3JtcyBhIHVzZXIgdGhhdCBzb21lIG9mIHRoZSBUZWxlZ3JhbSBQYXNzcG9ydCBlbGVtZW50cyB0aGV5IHByb3ZpZGVkIGNvbnRhaW5zIGVycm9ycy4gVGhlIHVzZXIgd2lsbCBub3QgYmUgYWJsZSB0byByZS1zdWJtaXQgdGhlaXIgUGFzc3BvcnQgdG8geW91IHVudGlsIHRoZSBlcnJvcnMgYXJlIGZpeGVkICh0aGUgY29udGVudHMgb2YgdGhlIGZpZWxkIGZvciB3aGljaCB5b3UgcmV0dXJuZWQgdGhlIGVycm9yIG11c3QgY2hhbmdlKS4gUmV0dXJucyBUcnVlIG9uIHN1Y2Nlc3MuXG4gICAgICpcbiAgICAgKiBVc2UgdGhpcyBpZiB0aGUgZGF0YSBzdWJtaXR0ZWQgYnkgdGhlIHVzZXIgZG9lc24ndCBzYXRpc2Z5IHRoZSBzdGFuZGFyZHMgeW91ciBzZXJ2aWNlIHJlcXVpcmVzIGZvciBhbnkgcmVhc29uLiBGb3IgZXhhbXBsZSwgaWYgYSBiaXJ0aGRheSBkYXRlIHNlZW1zIGludmFsaWQsIGEgc3VibWl0dGVkIGRvY3VtZW50IGlzIGJsdXJyeSwgYSBzY2FuIHNob3dzIGV2aWRlbmNlIG9mIHRhbXBlcmluZywgZXRjLiBTdXBwbHkgc29tZSBkZXRhaWxzIGluIHRoZSBlcnJvciBtZXNzYWdlIHRvIG1ha2Ugc3VyZSB0aGUgdXNlciBrbm93cyBob3cgdG8gY29ycmVjdCB0aGUgaXNzdWVzLlxuICAgICAqXG4gICAgICogQHBhcmFtIHVzZXJfaWQgVXNlciBpZGVudGlmaWVyXG4gICAgICogQHBhcmFtIGVycm9ycyBBbiBhcnJheSBkZXNjcmliaW5nIHRoZSBlcnJvcnNcbiAgICAgKiBAcGFyYW0gc2lnbmFsIE9wdGlvbmFsIGBBYm9ydFNpZ25hbGAgdG8gY2FuY2VsIHRoZSByZXF1ZXN0XG4gICAgICpcbiAgICAgKiAqKk9mZmljaWFsIHJlZmVyZW5jZToqKiBodHRwczovL2NvcmUudGVsZWdyYW0ub3JnL2JvdHMvYXBpI3NldHBhc3Nwb3J0ZGF0YWVycm9yc1xuICAgICAqL1xuICAgIHNldFBhc3Nwb3J0RGF0YUVycm9ycyhcbiAgICAgICAgdXNlcl9pZDogbnVtYmVyLFxuICAgICAgICBlcnJvcnM6IHJlYWRvbmx5IFBhc3Nwb3J0RWxlbWVudEVycm9yW10sXG4gICAgICAgIHNpZ25hbD86IEFib3J0U2lnbmFsLFxuICAgICkge1xuICAgICAgICByZXR1cm4gdGhpcy5yYXcuc2V0UGFzc3BvcnREYXRhRXJyb3JzKHsgdXNlcl9pZCwgZXJyb3JzIH0sIHNpZ25hbCk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogVXNlIHRoaXMgbWV0aG9kIHRvIHNlbmQgYSBnYW1lLiBPbiBzdWNjZXNzLCB0aGUgc2VudCBNZXNzYWdlIGlzIHJldHVybmVkLlxuICAgICAqXG4gICAgICogQHBhcmFtIGNoYXRfaWQgVW5pcXVlIGlkZW50aWZpZXIgZm9yIHRoZSB0YXJnZXQgY2hhdFxuICAgICAqIEBwYXJhbSBnYW1lX3Nob3J0X25hbWUgU2hvcnQgbmFtZSBvZiB0aGUgZ2FtZSwgc2VydmVzIGFzIHRoZSB1bmlxdWUgaWRlbnRpZmllciBmb3IgdGhlIGdhbWUuIFNldCB1cCB5b3VyIGdhbWVzIHZpYSBCb3RGYXRoZXIuXG4gICAgICogQHBhcmFtIG90aGVyIE9wdGlvbmFsIHJlbWFpbmluZyBwYXJhbWV0ZXJzLCBjb25mZXIgdGhlIG9mZmljaWFsIHJlZmVyZW5jZSBiZWxvd1xuICAgICAqIEBwYXJhbSBzaWduYWwgT3B0aW9uYWwgYEFib3J0U2lnbmFsYCB0byBjYW5jZWwgdGhlIHJlcXVlc3RcbiAgICAgKlxuICAgICAqICoqT2ZmaWNpYWwgcmVmZXJlbmNlOioqIGh0dHBzOi8vY29yZS50ZWxlZ3JhbS5vcmcvYm90cy9hcGkjc2VuZGdhbWVcbiAgICAgKi9cbiAgICBzZW5kR2FtZShcbiAgICAgICAgY2hhdF9pZDogbnVtYmVyLFxuICAgICAgICBnYW1lX3Nob3J0X25hbWU6IHN0cmluZyxcbiAgICAgICAgb3RoZXI/OiBPdGhlcjxSLCBcInNlbmRHYW1lXCIsIFwiY2hhdF9pZFwiIHwgXCJnYW1lX3Nob3J0X25hbWVcIj4sXG4gICAgICAgIHNpZ25hbD86IEFib3J0U2lnbmFsLFxuICAgICkge1xuICAgICAgICByZXR1cm4gdGhpcy5yYXcuc2VuZEdhbWUoXG4gICAgICAgICAgICB7IGNoYXRfaWQsIGdhbWVfc2hvcnRfbmFtZSwgLi4ub3RoZXIgfSxcbiAgICAgICAgICAgIHNpZ25hbCxcbiAgICAgICAgKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBVc2UgdGhpcyBtZXRob2QgdG8gc2V0IHRoZSBzY29yZSBvZiB0aGUgc3BlY2lmaWVkIHVzZXIgaW4gYSBnYW1lIG1lc3NhZ2UuIE9uIHN1Y2Nlc3MsIGlmIHRoZSBtZXNzYWdlIGlzIG5vdCBhbiBpbmxpbmUgbWVzc2FnZSwgdGhlIE1lc3NhZ2UgaXMgcmV0dXJuZWQsIG90aGVyd2lzZSBUcnVlIGlzIHJldHVybmVkLiBSZXR1cm5zIGFuIGVycm9yLCBpZiB0aGUgbmV3IHNjb3JlIGlzIG5vdCBncmVhdGVyIHRoYW4gdGhlIHVzZXIncyBjdXJyZW50IHNjb3JlIGluIHRoZSBjaGF0IGFuZCBmb3JjZSBpcyBGYWxzZS5cbiAgICAgKlxuICAgICAqIEBwYXJhbSBjaGF0X2lkIFVuaXF1ZSBpZGVudGlmaWVyIGZvciB0aGUgdGFyZ2V0IGNoYXRcbiAgICAgKiBAcGFyYW0gbWVzc2FnZV9pZCBJZGVudGlmaWVyIG9mIHRoZSBzZW50IG1lc3NhZ2VcbiAgICAgKiBAcGFyYW0gdXNlcl9pZCBVc2VyIGlkZW50aWZpZXJcbiAgICAgKiBAcGFyYW0gc2NvcmUgTmV3IHNjb3JlLCBtdXN0IGJlIG5vbi1uZWdhdGl2ZVxuICAgICAqIEBwYXJhbSBvdGhlciBPcHRpb25hbCByZW1haW5pbmcgcGFyYW1ldGVycywgY29uZmVyIHRoZSBvZmZpY2lhbCByZWZlcmVuY2UgYmVsb3dcbiAgICAgKiBAcGFyYW0gc2lnbmFsIE9wdGlvbmFsIGBBYm9ydFNpZ25hbGAgdG8gY2FuY2VsIHRoZSByZXF1ZXN0XG4gICAgICpcbiAgICAgKiAqKk9mZmljaWFsIHJlZmVyZW5jZToqKiBodHRwczovL2NvcmUudGVsZWdyYW0ub3JnL2JvdHMvYXBpI3NldGdhbWVzY29yZVxuICAgICAqL1xuICAgIHNldEdhbWVTY29yZShcbiAgICAgICAgY2hhdF9pZDogbnVtYmVyLFxuICAgICAgICBtZXNzYWdlX2lkOiBudW1iZXIsXG4gICAgICAgIHVzZXJfaWQ6IG51bWJlcixcbiAgICAgICAgc2NvcmU6IG51bWJlcixcbiAgICAgICAgb3RoZXI/OiBPdGhlcjxcbiAgICAgICAgICAgIFIsXG4gICAgICAgICAgICBcInNldEdhbWVTY29yZVwiLFxuICAgICAgICAgICAgXCJjaGF0X2lkXCIgfCBcIm1lc3NhZ2VfaWRcIiB8IFwiaW5saW5lX21lc3NhZ2VfaWRcIiB8IFwidXNlcl9pZFwiIHwgXCJzY29yZVwiXG4gICAgICAgID4sXG4gICAgICAgIHNpZ25hbD86IEFib3J0U2lnbmFsLFxuICAgICkge1xuICAgICAgICByZXR1cm4gdGhpcy5yYXcuc2V0R2FtZVNjb3JlKFxuICAgICAgICAgICAgeyBjaGF0X2lkLCBtZXNzYWdlX2lkLCB1c2VyX2lkLCBzY29yZSwgLi4ub3RoZXIgfSxcbiAgICAgICAgICAgIHNpZ25hbCxcbiAgICAgICAgKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBVc2UgdGhpcyBtZXRob2QgdG8gc2V0IHRoZSBzY29yZSBvZiB0aGUgc3BlY2lmaWVkIHVzZXIgaW4gYSBnYW1lIG1lc3NhZ2UuIE9uIHN1Y2Nlc3MsIGlmIHRoZSBtZXNzYWdlIGlzIG5vdCBhbiBpbmxpbmUgbWVzc2FnZSwgdGhlIE1lc3NhZ2UgaXMgcmV0dXJuZWQsIG90aGVyd2lzZSBUcnVlIGlzIHJldHVybmVkLiBSZXR1cm5zIGFuIGVycm9yLCBpZiB0aGUgbmV3IHNjb3JlIGlzIG5vdCBncmVhdGVyIHRoYW4gdGhlIHVzZXIncyBjdXJyZW50IHNjb3JlIGluIHRoZSBjaGF0IGFuZCBmb3JjZSBpcyBGYWxzZS5cbiAgICAgKlxuICAgICAqIEBwYXJhbSBpbmxpbmVfbWVzc2FnZV9pZCBJZGVudGlmaWVyIG9mIHRoZSBpbmxpbmUgbWVzc2FnZVxuICAgICAqIEBwYXJhbSB1c2VyX2lkIFVzZXIgaWRlbnRpZmllclxuICAgICAqIEBwYXJhbSBzY29yZSBOZXcgc2NvcmUsIG11c3QgYmUgbm9uLW5lZ2F0aXZlXG4gICAgICogQHBhcmFtIG90aGVyIE9wdGlvbmFsIHJlbWFpbmluZyBwYXJhbWV0ZXJzLCBjb25mZXIgdGhlIG9mZmljaWFsIHJlZmVyZW5jZSBiZWxvd1xuICAgICAqIEBwYXJhbSBzaWduYWwgT3B0aW9uYWwgYEFib3J0U2lnbmFsYCB0byBjYW5jZWwgdGhlIHJlcXVlc3RcbiAgICAgKlxuICAgICAqICoqT2ZmaWNpYWwgcmVmZXJlbmNlOioqIGh0dHBzOi8vY29yZS50ZWxlZ3JhbS5vcmcvYm90cy9hcGkjc2V0Z2FtZXNjb3JlXG4gICAgICovXG4gICAgc2V0R2FtZVNjb3JlSW5saW5lKFxuICAgICAgICBpbmxpbmVfbWVzc2FnZV9pZDogc3RyaW5nLFxuICAgICAgICB1c2VyX2lkOiBudW1iZXIsXG4gICAgICAgIHNjb3JlOiBudW1iZXIsXG4gICAgICAgIG90aGVyPzogT3RoZXI8XG4gICAgICAgICAgICBSLFxuICAgICAgICAgICAgXCJzZXRHYW1lU2NvcmVcIixcbiAgICAgICAgICAgIFwiY2hhdF9pZFwiIHwgXCJtZXNzYWdlX2lkXCIgfCBcImlubGluZV9tZXNzYWdlX2lkXCIgfCBcInVzZXJfaWRcIiB8IFwic2NvcmVcIlxuICAgICAgICA+LFxuICAgICAgICBzaWduYWw/OiBBYm9ydFNpZ25hbCxcbiAgICApIHtcbiAgICAgICAgcmV0dXJuIHRoaXMucmF3LnNldEdhbWVTY29yZShcbiAgICAgICAgICAgIHsgaW5saW5lX21lc3NhZ2VfaWQsIHVzZXJfaWQsIHNjb3JlLCAuLi5vdGhlciB9LFxuICAgICAgICAgICAgc2lnbmFsLFxuICAgICAgICApO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFVzZSB0aGlzIG1ldGhvZCB0byBnZXQgZGF0YSBmb3IgaGlnaCBzY29yZSB0YWJsZXMuIFdpbGwgcmV0dXJuIHRoZSBzY29yZSBvZiB0aGUgc3BlY2lmaWVkIHVzZXIgYW5kIHNldmVyYWwgb2YgdGhlaXIgbmVpZ2hib3JzIGluIGEgZ2FtZS4gUmV0dXJucyBhbiBBcnJheSBvZiBHYW1lSGlnaFNjb3JlIG9iamVjdHMuXG4gICAgICpcbiAgICAgKiBUaGlzIG1ldGhvZCB3aWxsIGN1cnJlbnRseSByZXR1cm4gc2NvcmVzIGZvciB0aGUgdGFyZ2V0IHVzZXIsIHBsdXMgdHdvIG9mIHRoZWlyIGNsb3Nlc3QgbmVpZ2hib3JzIG9uIGVhY2ggc2lkZS4gV2lsbCBhbHNvIHJldHVybiB0aGUgdG9wIHRocmVlIHVzZXJzIGlmIHRoZSB1c2VyIGFuZCBoaXMgbmVpZ2hib3JzIGFyZSBub3QgYW1vbmcgdGhlbS4gUGxlYXNlIG5vdGUgdGhhdCB0aGlzIGJlaGF2aW9yIGlzIHN1YmplY3QgdG8gY2hhbmdlLlxuICAgICAqXG4gICAgICogQHBhcmFtIGNoYXRfaWQgVW5pcXVlIGlkZW50aWZpZXIgZm9yIHRoZSB0YXJnZXQgY2hhdFxuICAgICAqIEBwYXJhbSBtZXNzYWdlX2lkIElkZW50aWZpZXIgb2YgdGhlIHNlbnQgbWVzc2FnZVxuICAgICAqIEBwYXJhbSB1c2VyX2lkIFRhcmdldCB1c2VyIGlkXG4gICAgICogQHBhcmFtIHNpZ25hbCBPcHRpb25hbCBgQWJvcnRTaWduYWxgIHRvIGNhbmNlbCB0aGUgcmVxdWVzdFxuICAgICAqXG4gICAgICogKipPZmZpY2lhbCByZWZlcmVuY2U6KiogaHR0cHM6Ly9jb3JlLnRlbGVncmFtLm9yZy9ib3RzL2FwaSNnZXRnYW1laGlnaHNjb3Jlc1xuICAgICAqL1xuICAgIGdldEdhbWVIaWdoU2NvcmVzKFxuICAgICAgICBjaGF0X2lkOiBudW1iZXIsXG4gICAgICAgIG1lc3NhZ2VfaWQ6IG51bWJlcixcbiAgICAgICAgdXNlcl9pZDogbnVtYmVyLFxuICAgICAgICBzaWduYWw/OiBBYm9ydFNpZ25hbCxcbiAgICApIHtcbiAgICAgICAgcmV0dXJuIHRoaXMucmF3LmdldEdhbWVIaWdoU2NvcmVzKFxuICAgICAgICAgICAgeyBjaGF0X2lkLCBtZXNzYWdlX2lkLCB1c2VyX2lkIH0sXG4gICAgICAgICAgICBzaWduYWwsXG4gICAgICAgICk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogVXNlIHRoaXMgbWV0aG9kIHRvIGdldCBkYXRhIGZvciBoaWdoIHNjb3JlIHRhYmxlcy4gV2lsbCByZXR1cm4gdGhlIHNjb3JlIG9mIHRoZSBzcGVjaWZpZWQgdXNlciBhbmQgc2V2ZXJhbCBvZiB0aGVpciBuZWlnaGJvcnMgaW4gYW4gaW5saW5lIGdhbWUuIE9uIHN1Y2Nlc3MsIHJldHVybnMgYW4gQXJyYXkgb2YgR2FtZUhpZ2hTY29yZSBvYmplY3RzLlxuICAgICAqXG4gICAgICogVGhpcyBtZXRob2Qgd2lsbCBjdXJyZW50bHkgcmV0dXJuIHNjb3JlcyBmb3IgdGhlIHRhcmdldCB1c2VyLCBwbHVzIHR3byBvZiB0aGVpciBjbG9zZXN0IG5laWdoYm9ycyBvbiBlYWNoIHNpZGUuIFdpbGwgYWxzbyByZXR1cm4gdGhlIHRvcCB0aHJlZSB1c2VycyBpZiB0aGUgdXNlciBhbmQgaGlzIG5laWdoYm9ycyBhcmUgbm90IGFtb25nIHRoZW0uIFBsZWFzZSBub3RlIHRoYXQgdGhpcyBiZWhhdmlvciBpcyBzdWJqZWN0IHRvIGNoYW5nZS5cbiAgICAgKlxuICAgICAqIEBwYXJhbSBpbmxpbmVfbWVzc2FnZV9pZCBJZGVudGlmaWVyIG9mIHRoZSBpbmxpbmUgbWVzc2FnZVxuICAgICAqIEBwYXJhbSB1c2VyX2lkIFRhcmdldCB1c2VyIGlkXG4gICAgICogQHBhcmFtIHNpZ25hbCBPcHRpb25hbCBgQWJvcnRTaWduYWxgIHRvIGNhbmNlbCB0aGUgcmVxdWVzdFxuICAgICAqXG4gICAgICogKipPZmZpY2lhbCByZWZlcmVuY2U6KiogaHR0cHM6Ly9jb3JlLnRlbGVncmFtLm9yZy9ib3RzL2FwaSNnZXRnYW1laGlnaHNjb3Jlc1xuICAgICAqL1xuICAgIGdldEdhbWVIaWdoU2NvcmVzSW5saW5lKFxuICAgICAgICBpbmxpbmVfbWVzc2FnZV9pZDogc3RyaW5nLFxuICAgICAgICB1c2VyX2lkOiBudW1iZXIsXG4gICAgICAgIHNpZ25hbD86IEFib3J0U2lnbmFsLFxuICAgICkge1xuICAgICAgICByZXR1cm4gdGhpcy5yYXcuZ2V0R2FtZUhpZ2hTY29yZXMoXG4gICAgICAgICAgICB7IGlubGluZV9tZXNzYWdlX2lkLCB1c2VyX2lkIH0sXG4gICAgICAgICAgICBzaWduYWwsXG4gICAgICAgICk7XG4gICAgfVxufVxuIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLGtDQUFrQztBQW1CbEMsU0FFSSxZQUFZLFFBT1QsY0FB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