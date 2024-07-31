/**
 * Use this class to simplify building a custom keyboard (something like this:
 * https://core.telegram.org/bots/features#keyboards).
 *
 * ```ts
 * // Build a custom keyboard:
 * const keyboard = new Keyboard()
 *   .text('A').text('B').row()
 *   .text('C').text('D')
 *
 * // Now you can send it like so:
 * await ctx.reply('Here is your custom keyboard!', {
 *   reply_markup: keyboard
 * })
 * ```
 *
 * If you already have some source data which you would like to turn into a
 * keyboard button object, you can use the static equivalents which every button
 * has. You can use them to create a two-dimensional keyboard button array. The
 * resulting array can be turned into a keyboard instance.
 *
 * ```ts
 * const button = Keyboard.text('push my buttons')
 * const array = [[button]]
 * const keyboard = Keyboard.from(array)
 * ```
 *
 * If you want to create text buttons only, you can directly use a
 * two-dimensional string array and turn it into a keyboard.
 *
 * ```ts
 * const data = [['A', 'B'], ['C', 'D']]
 * const keyboard = Keyboard.from(data)
 * ```
 *
 * Be sure to check out the
 * [documentation](https://grammy.dev/plugins/keyboard.html#custom-keyboards) on
 * custom keyboards in grammY.
 */ export class Keyboard {
    keyboard;
    /**
     * Requests clients to always show the keyboard when the regular keyboard is
     * hidden. Defaults to false, in which case the custom keyboard can be
     * hidden and opened with a keyboard icon.
     */ is_persistent;
    /**
     * Show the current keyboard only to those users that are mentioned in the
     * text of the message object.
     */ selective;
    /**
     * Hide the keyboard after a button is pressed.
     */ one_time_keyboard;
    /**
     * Resize the current keyboard according to its buttons. Usually, this will
     * make the keyboard smaller.
     */ resize_keyboard;
    /**
     * Placeholder to be shown in the input field when the keyboard is active.
     */ input_field_placeholder;
    /**
     * Initialize a new `Keyboard` with an optional two-dimensional array of
     * `KeyboardButton` objects. This is the nested array that holds the custom
     * keyboard. It will be extended every time you call one of the provided
     * methods.
     *
     * @param keyboard An optional initial two-dimensional button array
     */ constructor(keyboard = [
        []
    ]){
        this.keyboard = keyboard;
    }
    /**
     * Allows you to add your own `KeyboardButton` objects if you already have
     * them for some reason. You most likely want to call one of the other
     * methods.
     *
     * @param buttons The buttons to add
     */ add(...buttons) {
        this.keyboard[this.keyboard.length - 1]?.push(...buttons);
        return this;
    }
    /**
     * Adds a 'line break'. Call this method to make sure that the next added
     * buttons will be on a new row.
     *
     * You may pass a number of `KeyboardButton` objects if you already have the
     * instances for some reason. You most likely don't want to pass any
     * arguments to `row`.
     *
     * @param buttons A number of buttons to add to the next row
     */ row(...buttons) {
        this.keyboard.push(buttons);
        return this;
    }
    /**
     * Adds a new text button. This button will simply send the given text as a
     * text message back to your bot if a user clicks on it.
     *
     * @param text The text to display
     */ text(text) {
        return this.add(Keyboard.text(text));
    }
    /**
     * Creates a new text button. This button will simply send the given text as
     * a text message back to your bot if a user clicks on it.
     *
     * @param text The text to display
     */ static text(text) {
        return {
            text
        };
    }
    /**
     * Adds a new request users button. When the user presses the button, a list
     * of suitable users will be opened. Tapping on any number of users will
     * send their identifiers to the bot in a “users_shared” service message.
     * Available in private chats only.
     *
     * @param text The text to display
     * @param requestId A signed 32-bit identifier of the request
     * @param options Options object for further requirements
     */ requestUsers(text, requestId, options = {}) {
        return this.add(Keyboard.requestUsers(text, requestId, options));
    }
    /**
     * Creates a new request users button. When the user presses the button, a
     * list of suitable users will be opened. Tapping on any number of users
     * will send their identifiers to the bot in a “users_shared” service
     * message. Available in private chats only.
     *
     * @param text The text to display
     * @param requestId A signed 32-bit identifier of the request
     * @param options Options object for further requirements
     */ static requestUsers(text, requestId, options = {}) {
        return {
            text,
            request_users: {
                request_id: requestId,
                ...options
            }
        };
    }
    /**
     * Adds a new request chat button. When the user presses the button, a list
     * of suitable users will be opened. Tapping on a chat will send its
     * identifier to the bot in a “chat_shared” service message. Available in
     * private chats only.
     *
     * @param text The text to display
     * @param requestId A signed 32-bit identifier of the request
     * @param options Options object for further requirements
     */ requestChat(text, requestId, options = {
        chat_is_channel: false
    }) {
        return this.add(Keyboard.requestChat(text, requestId, options));
    }
    /**
     * Creates a new request chat button. When the user presses the button, a
     * list of suitable users will be opened. Tapping on a chat will send its
     * identifier to the bot in a “chat_shared” service message. Available in
     * private chats only.
     *
     * @param text The text to display
     * @param requestId A signed 32-bit identifier of the request
     * @param options Options object for further requirements
     */ static requestChat(text, requestId, options = {
        chat_is_channel: false
    }) {
        return {
            text,
            request_chat: {
                request_id: requestId,
                ...options
            }
        };
    }
    /**
     * Adds a new contact request button. The user's phone number will be sent
     * as a contact when the button is pressed. Available in private chats only.
     *
     * @param text The text to display
     */ requestContact(text) {
        return this.add(Keyboard.requestContact(text));
    }
    /**
     * Creates a new contact request button. The user's phone number will be
     * sent as a contact when the button is pressed. Available in private chats
     * only.
     *
     * @param text The text to display
     */ static requestContact(text) {
        return {
            text,
            request_contact: true
        };
    }
    /**
     * Adds a new location request button. The user's current location will be
     * sent when the button is pressed. Available in private chats only.
     *
     * @param text The text to display
     */ requestLocation(text) {
        return this.add(Keyboard.requestLocation(text));
    }
    /**
     * Creates a new location request button. The user's current location will
     * be sent when the button is pressed. Available in private chats only.
     *
     * @param text The text to display
     */ static requestLocation(text) {
        return {
            text,
            request_location: true
        };
    }
    /**
     * Adds a new poll request button. The user will be asked to create a poll
     * and send it to the bot when the button is pressed. Available in private
     * chats only.
     *
     * @param text The text to display
     * @param type The type of permitted polls to create, omit if the user may
     * send a poll of any type
     */ requestPoll(text, type) {
        return this.add(Keyboard.requestPoll(text, type));
    }
    /**
     * Creates a new poll request button. The user will be asked to create a
     * poll and send it to the bot when the button is pressed. Available in
     * private chats only.
     *
     * @param text The text to display
     * @param type The type of permitted polls to create, omit if the user may
     * send a poll of any type
     */ static requestPoll(text, type) {
        return {
            text,
            request_poll: {
                type
            }
        };
    }
    /**
     * Adds a new web app button. The Web App that will be launched when the
     * user presses the button. The Web App will be able to send a
     * “web_app_data” service message. Available in private chats only.
     *
     * @param text The text to display
     * @param url An HTTPS URL of a Web App to be opened with additional data
     */ webApp(text, url) {
        return this.add(Keyboard.webApp(text, url));
    }
    /**
     * Creates a new web app button. The Web App that will be launched when the
     * user presses the button. The Web App will be able to send a
     * “web_app_data” service message. Available in private chats only.
     *
     * @param text The text to display
     * @param url An HTTPS URL of a Web App to be opened with additional data
     */ static webApp(text, url) {
        return {
            text,
            web_app: {
                url
            }
        };
    }
    /**
     * Make the current keyboard persistent. See
     * https://grammy.dev/plugins/keyboard.html#persistent-keyboards for more
     * details.
     *
     * Keyboards are not persistent by default, use this function to enable it
     * (without any parameters or pass `true`). Pass `false` to force the
     * keyboard to not persist.
     *
     * @param isEnabled `true` if the keyboard should persist, and `false` otherwise
     */ persistent(isEnabled = true) {
        this.is_persistent = isEnabled;
        return this;
    }
    /**
     * Make the current keyboard selective. See
     * https://grammy.dev/plugins/keyboard.html#selectively-send-custom-keyboards
     * for more details.
     *
     * Keyboards are non-selective by default, use this function to enable it
     * (without any parameters or pass `true`). Pass `false` to force the
     * keyboard to be non-selective.
     *
     * @param isEnabled `true` if the keyboard should be selective, and `false` otherwise
     */ selected(isEnabled = true) {
        this.selective = isEnabled;
        return this;
    }
    /**
     * Make the current keyboard one-time. See
     * https://grammy.dev/plugins/keyboard.html#one-time-custom-keyboards for
     * more details.
     *
     * Keyboards are non-one-time by default, use this function to enable it
     * (without any parameters or pass `true`). Pass `false` to force the
     * keyboard to be non-one-time.
     *
     * @param isEnabled `true` if the keyboard should be one-time, and `false` otherwise
     */ oneTime(isEnabled = true) {
        this.one_time_keyboard = isEnabled;
        return this;
    }
    /**
     * Make the current keyboard resized. See
     * https://grammy.dev/plugins/keyboard.html#resize-custom-keyboard for more
     * details.
     *
     * Keyboards are non-resized by default, use this function to enable it
     * (without any parameters or pass `true`). Pass `false` to force the
     * keyboard to be non-resized.
     *
     * @param isEnabled `true` if the keyboard should be resized, and `false` otherwise
     */ resized(isEnabled = true) {
        this.resize_keyboard = isEnabled;
        return this;
    }
    /**
     * Set the current keyboard's input field placeholder. See
     * https://grammy.dev/plugins/keyboard.html#input-field-placeholder for more
     * details.
     *
     * @param value The placeholder text
     */ placeholder(value) {
        this.input_field_placeholder = value;
        return this;
    }
    /**
     * Creates a new keyboard that contains the transposed grid of buttons of
     * this keyboard. This means that the resulting keyboard has the rows and
     * columns flipped.
     *
     * Note that buttons can only span multiple columns, but never multiple
     * rows. This means that if the given arrays have different lengths, some
     * buttons might flow up in the layout. In these cases, transposing a
     * keyboard a second time will not undo the first transposition.
     *
     * Here are some examples.
     *
     * ```
     * original    transposed
     * [  a  ]  ~> [  a  ]
     *
     *             [  a  ]
     * [a b c]  ~> [  b  ]
     *             [  c  ]
     *
     * [ a b ]     [a c e]
     * [ c d ]  ~> [ b d ]
     * [  e  ]
     *
     * [ a b ]     [a c d]
     * [  c  ]  ~> [ b e ]
     * [d e f]     [  f  ]
     * ```
     */ toTransposed() {
        const original = this.keyboard;
        const transposed = transpose(original);
        return this.clone(transposed);
    }
    /**
     * Creates a new keyboard with the same buttons but reflowed into a given
     * number of columns as if the buttons were text elements. Optionally, you
     * can specify if the flow should make sure to fill up the last row.
     *
     * This method is idempotent, so calling it a second time will effectively
     * clone this keyboard without reordering the buttons.
     *
     * Here are some examples.
     *
     * ```
     * original    flowed
     * [  a  ]  ~> [  a  ]    (4 columns)
     *
     *             [  a  ]
     * [a b c]  ~> [  b  ]    (1 column)
     *             [  c  ]
     *
     * [ a b ]     [a b c]
     * [ c d ]  ~> [ d e ]    (3 columns)
     * [  e  ]
     *
     * [ a b ]     [abcde]
     * [  c  ]  ~> [  f  ]    (5 columns)
     * [d e f]
     *
     * [a b c]     [  a  ]
     * [d e f]  ~> [b c d]    (3 colums, { fillLastRow: true })
     * [g h i]     [e f g]
     * [  j  ]     [h i j]
     * ```
     *
     * @param columns Maximum number of buttons per row
     * @param options Optional flowing behavior
     */ toFlowed(columns, options = {}) {
        const original = this.keyboard;
        const flowed = reflow(original, columns, options);
        return this.clone(flowed);
    }
    /**
     * Creates and returns a deep copy of this keyboard.
     *
     * Optionally takes a new grid of buttons to replace the current buttons. If
     * specified, only the options will be cloned, and the given buttons will be
     * used instead.
     */ clone(keyboard = this.keyboard) {
        const clone = new Keyboard(keyboard.map((row)=>row.slice()));
        clone.is_persistent = this.is_persistent;
        clone.selective = this.selective;
        clone.one_time_keyboard = this.one_time_keyboard;
        clone.resize_keyboard = this.resize_keyboard;
        clone.input_field_placeholder = this.input_field_placeholder;
        return clone;
    }
    /**
     * Appends the buttons of the given keyboards to this keyboard. If other
     * options are specified in these keyboards, they will be ignored.
     *
     * @param sources A number of keyboards to append
     */ append(...sources) {
        for (const source of sources){
            const keyboard = Keyboard.from(source);
            this.keyboard.push(...keyboard.keyboard.map((row)=>row.slice()));
        }
        return this;
    }
    /**
     * Returns the keyboard that was build. Note that it doesn't return
     * `resize_keyboard` or other options that may be set. You don't usually
     * need to call this method. It is no longer useful.
     */ build() {
        return this.keyboard;
    }
    /**
     * Turns a two-dimensional keyboard button array into a keyboard instance.
     * You can use the static button builder methods to create keyboard button
     * objects.
     *
     * @param source A two-dimensional button array
     */ static from(source) {
        if (source instanceof Keyboard) return source.clone();
        function toButton(btn) {
            return typeof btn === "string" ? Keyboard.text(btn) : btn;
        }
        return new Keyboard(source.map((row)=>row.map(toButton)));
    }
}
/**
 * Use this class to simplify building an inline keyboard (something like this:
 * https://core.telegram.org/bots/features#inline-keyboards).
 *
 * ```ts
 * // Build an inline keyboard:
 * const keyboard = new InlineKeyboard()
 *   .text('A').text('B', 'callback-data').row()
 *   .text('C').text('D').row()
 *   .url('Telegram', 'telegram.org')
 *
 * // Send the keyboard:
 * await ctx.reply('Here is your inline keyboard!', {
 *   reply_markup: keyboard
 * })
 * ```
 *
 * If you already have some source data which you would like to turn into an
 * inline button object, you can use the static equivalents which every inline
 * button has. You can use them to create a two-dimensional inline button array.
 * The resulting array can be turned into a keyboard instance.
 *
 * ```ts
 * const button = InlineKeyboard.text('GO', 'go')
 * const array = [[button]]
 * const keyboard = InlineKeyboard.from(array)
 * ```
 *
 * Be sure to to check the
 * [documentation](https://grammy.dev/plugins/keyboard.html#inline-keyboards) on
 * inline keyboards in grammY.
 */ export class InlineKeyboard {
    inline_keyboard;
    /**
     * Initialize a new `InlineKeyboard` with an optional two-dimensional array
     * of `InlineKeyboardButton` objects. This is the nested array that holds
     * the inline keyboard. It will be extended every time you call one of the
     * provided methods.
     *
     * @param inline_keyboard An optional initial two-dimensional button array
     */ constructor(inline_keyboard = [
        []
    ]){
        this.inline_keyboard = inline_keyboard;
    }
    /**
     * Allows you to add your own `InlineKeyboardButton` objects if you already
     * have them for some reason. You most likely want to call one of the other
     * methods.
     *
     * @param buttons The buttons to add
     */ add(...buttons) {
        this.inline_keyboard[this.inline_keyboard.length - 1]?.push(...buttons);
        return this;
    }
    /**
     * Adds a 'line break'. Call this method to make sure that the next added
     * buttons will be on a new row.
     *
     * You may pass a number of `InlineKeyboardButton` objects if you already
     * have the instances for some reason. You most likely don't want to pass
     * any arguments to `row`.
     *
     * @param buttons A number of buttons to add to the next row
     */ row(...buttons) {
        this.inline_keyboard.push(buttons);
        return this;
    }
    /**
     * Adds a new URL button. Telegram clients will open the provided URL when
     * the button is pressed.
     *
     * @param text The text to display
     * @param url HTTP or tg:// url to be opened when the button is pressed. Links tg://user?id=<user_id> can be used to mention a user by their ID without using a username, if this is allowed by their privacy settings.
     */ url(text, url) {
        return this.add(InlineKeyboard.url(text, url));
    }
    /**
     * Creates a new URL button. Telegram clients will open the provided URL
     * when the button is pressed.
     *
     * @param text The text to display
     * @param url HTTP or tg:// url to be opened when the button is pressed. Links tg://user?id=<user_id> can be used to mention a user by their ID without using a username, if this is allowed by their privacy settings.
     */ static url(text, url) {
        return {
            text,
            url
        };
    }
    /**
     * Adds a new callback query button. The button contains a text and a custom
     * payload. This payload will be sent back to your bot when the button is
     * pressed. If you omit the payload, the display text will be sent back to
     * your bot.
     *
     * Your bot will receive an update every time a user presses any of the text
     * buttons. You can listen to these updates like this:
     * ```ts
     * // Specific buttons:
     * bot.callbackQuery('button-data', ctx => { ... })
     * // Any button of any inline keyboard:
     * bot.on('callback_query:data',    ctx => { ... })
     * ```
     *
     * @param text The text to display
     * @param data The callback data to send back to your bot (default = text)
     */ text(text, data = text) {
        return this.add(InlineKeyboard.text(text, data));
    }
    /**
     * Creates a new callback query button. The button contains a text and a
     * custom payload. This payload will be sent back to your bot when the
     * button is pressed. If you omit the payload, the display text will be sent
     * back to your bot.
     *
     * Your bot will receive an update every time a user presses any of the text
     * buttons. You can listen to these updates like this:
     * ```ts
     * // Specific buttons:
     * bot.callbackQuery('button-data', ctx => { ... })
     * // Any button of any inline keyboard:
     * bot.on('callback_query:data',    ctx => { ... })
     * ```
     *
     * @param text The text to display
     * @param data The callback data to send back to your bot (default = text)
     */ static text(text, data = text) {
        return {
            text,
            callback_data: data
        };
    }
    /**
     * Adds a new web app button, confer https://core.telegram.org/bots/webapps
     *
     * @param text The text to display
     * @param url An HTTPS URL of a Web App to be opened with additional data
     */ webApp(text, url) {
        return this.add(InlineKeyboard.webApp(text, url));
    }
    /**
     * Creates a new web app button, confer https://core.telegram.org/bots/webapps
     *
     * @param text The text to display
     * @param url An HTTPS URL of a Web App to be opened with additional data
     */ static webApp(text, url) {
        return {
            text,
            web_app: {
                url
            }
        };
    }
    /**
     * Adds a new login button. This can be used as a replacement for the
     * Telegram Login Widget. You must specify an HTTPS URL used to
     * automatically authorize the user.
     *
     * @param text The text to display
     * @param loginUrl The login URL as string or `LoginUrl` object
     */ login(text, loginUrl) {
        return this.add(InlineKeyboard.login(text, loginUrl));
    }
    /**
     * Creates a new login button. This can be used as a replacement for the
     * Telegram Login Widget. You must specify an HTTPS URL used to
     * automatically authorize the user.
     *
     * @param text The text to display
     * @param loginUrl The login URL as string or `LoginUrl` object
     */ static login(text, loginUrl) {
        return {
            text,
            login_url: typeof loginUrl === "string" ? {
                url: loginUrl
            } : loginUrl
        };
    }
    /**
     * Adds a new inline query button. Telegram clients will let the user pick a
     * chat when this button is pressed. This will start an inline query. The
     * selected chat will be prefilled with the name of your bot. You may
     * provide a text that is specified along with it.
     *
     * Your bot will in turn receive updates for inline queries. You can listen
     * to inline query updates like this:
     * ```ts
     * bot.on('inline_query', ctx => { ... })
     * ```
     *
     * @param text The text to display
     * @param query The (optional) inline query string to prefill
     */ switchInline(text, query = "") {
        return this.add(InlineKeyboard.switchInline(text, query));
    }
    /**
     * Creates a new inline query button. Telegram clients will let the user pick a
     * chat when this button is pressed. This will start an inline query. The
     * selected chat will be prefilled with the name of your bot. You may
     * provide a text that is specified along with it.
     *
     * Your bot will in turn receive updates for inline queries. You can listen
     * to inline query updates like this:
     * ```ts
     * bot.on('inline_query', ctx => { ... })
     * ```
     *
     * @param text The text to display
     * @param query The (optional) inline query string to prefill
     */ static switchInline(text, query = "") {
        return {
            text,
            switch_inline_query: query
        };
    }
    /**
     * Adds a new inline query button that acts on the current chat. The
     * selected chat will be prefilled with the name of your bot. You may
     * provide a text that is specified along with it. This will start an inline
     * query.
     *
     * Your bot will in turn receive updates for inline queries. You can listen
     * to inline query updates like this:
     * ```ts
     * bot.on('inline_query', ctx => { ... })
     * ```
     *
     * @param text The text to display
     * @param query The (optional) inline query string to prefill
     */ switchInlineCurrent(text, query = "") {
        return this.add(InlineKeyboard.switchInlineCurrent(text, query));
    }
    /**
     * Creates a new inline query button that acts on the current chat. The
     * selected chat will be prefilled with the name of your bot. You may
     * provide a text that is specified along with it. This will start an inline
     * query.
     *
     * Your bot will in turn receive updates for inline queries. You can listen
     * to inline query updates like this:
     * ```ts
     * bot.on('inline_query', ctx => { ... })
     * ```
     *
     * @param text The text to display
     * @param query The (optional) inline query string to prefill
     */ static switchInlineCurrent(text, query = "") {
        return {
            text,
            switch_inline_query_current_chat: query
        };
    }
    /**
     * Adds a new inline query button. Telegram clients will let the user pick a
     * chat when this button is pressed. This will start an inline query. The
     * selected chat will be prefilled with the name of your bot. You may
     * provide a text that is specified along with it.
     *
     * Your bot will in turn receive updates for inline queries. You can listen
     * to inline query updates like this:
     * ```ts
     * bot.on('inline_query', ctx => { ... })
     * ```
     *
     * @param text The text to display
     * @param query The query object describing which chats can be picked
     */ switchInlineChosen(text, query = {}) {
        return this.add(InlineKeyboard.switchInlineChosen(text, query));
    }
    /**
     * Creates a new inline query button. Telegram clients will let the user pick a
     * chat when this button is pressed. This will start an inline query. The
     * selected chat will be prefilled with the name of your bot. You may
     * provide a text that is specified along with it.
     *
     * Your bot will in turn receive updates for inline queries. You can listen
     * to inline query updates like this:
     * ```ts
     * bot.on('inline_query', ctx => { ... })
     * ```
     *
     * @param text The text to display
     * @param query The query object describing which chats can be picked
     */ static switchInlineChosen(text, query = {}) {
        return {
            text,
            switch_inline_query_chosen_chat: query
        };
    }
    /**
     * Adds a new game query button, confer
     * https://core.telegram.org/bots/api#games
     *
     * This type of button must always be the first button in the first row.
     *
     * @param text The text to display
     */ game(text) {
        return this.add(InlineKeyboard.game(text));
    }
    /**
     * Creates a new game query button, confer
     * https://core.telegram.org/bots/api#games
     *
     * This type of button must always be the first button in the first row.
     *
     * @param text The text to display
     */ static game(text) {
        return {
            text,
            callback_game: {}
        };
    }
    /**
     * Adds a new payment button, confer
     * https://core.telegram.org/bots/api#payments
     *
     * This type of button must always be the first button in the first row and
     * can only be used in invoice messages.
     *
     * @param text The text to display. Substrings “⭐” and “XTR” in the buttons's text will be replaced with a Telegram Star icon.
     */ pay(text) {
        return this.add(InlineKeyboard.pay(text));
    }
    /**
     * Create a new payment button, confer
     * https://core.telegram.org/bots/api#payments
     *
     * This type of button must always be the first button in the first row and
     * can only be used in invoice messages.
     *
     * @param text The text to display. Substrings “⭐” and “XTR” in the buttons's text will be replaced with a Telegram Star icon.
     */ static pay(text) {
        return {
            text,
            pay: true
        };
    }
    /**
     * Creates a new inline keyboard that contains the transposed grid of
     * buttons of this inline keyboard. This means that the resulting inline
     * keyboard has the rows and columns flipped.
     *
     * Note that inline buttons can only span multiple columns, but never
     * multiple rows. This means that if the given arrays have different
     * lengths, some buttons might flow up in the layout. In these cases,
     * transposing an inline keyboard a second time will not undo the first
     * transposition.
     *
     * Here are some examples.
     *
     * ```
     * original    transposed
     * [  a  ]  ~> [  a  ]
     *
     *             [  a  ]
     * [a b c]  ~> [  b  ]
     *             [  c  ]
     *
     * [ a b ]     [a c e]
     * [ c d ]  ~> [ b d ]
     * [  e  ]
     *
     * [ a b ]     [a c d]
     * [  c  ]  ~> [ b e ]
     * [d e f]     [  f  ]
     * ```
     */ toTransposed() {
        const original = this.inline_keyboard;
        const transposed = transpose(original);
        return new InlineKeyboard(transposed);
    }
    /**
     * Creates a new inline keyboard with the same buttons but reflowed into a
     * given number of columns as if the buttons were text elements. Optionally,
     * you can specify if the flow should make sure to fill up the last row.
     *
     * This method is idempotent, so calling it a second time will effectively
     * clone this inline keyboard without reordering the buttons.
     *
     * Here are some examples.
     *
     * ```
     * original    flowed
     * [  a  ]  ~> [  a  ]    (4 columns)
     *
     *             [  a  ]
     * [a b c]  ~> [  b  ]    (1 column)
     *             [  c  ]
     *
     * [ a b ]     [a b c]
     * [ c d ]  ~> [ d e ]    (3 columns)
     * [  e  ]
     *
     * [ a b ]     [abcde]
     * [  c  ]  ~> [  f  ]    (5 columns)
     * [d e f]
     *
     * [a b c]     [  a  ]
     * [d e f]  ~> [b c d]    (3 colums, { fillLastRow: true })
     * [g h i]     [e f g]
     * [  j  ]     [h i j]
     * ```
     *
     * @param columns Maximum number of buttons per row
     * @param options Optional flowing behavior
     */ toFlowed(columns, options = {}) {
        const original = this.inline_keyboard;
        const flowed = reflow(original, columns, options);
        return new InlineKeyboard(flowed);
    }
    /**
     * Creates and returns a deep copy of this inline keyboard.
     */ clone() {
        return new InlineKeyboard(this.inline_keyboard.map((row)=>row.slice()));
    }
    /**
     * Appends the buttons of the given inline keyboards to this keyboard.
     *
     * @param sources A number of inline keyboards to append
     */ append(...sources) {
        for (const source of sources){
            const keyboard = InlineKeyboard.from(source);
            this.inline_keyboard.push(...keyboard.inline_keyboard.map((row)=>row.slice()));
        }
        return this;
    }
    /**
     * Turns a two-dimensional inline button array into an inline keyboard
     * instance. You can use the static button builder methods to create inline
     * button objects.
     *
     * @param source A two-dimensional inline button array
     */ static from(source) {
        if (source instanceof InlineKeyboard) return source.clone();
        return new InlineKeyboard(source.map((row)=>row.slice()));
    }
}
function transpose(grid) {
    const transposed = [];
    for(let i = 0; i < grid.length; i++){
        const row = grid[i];
        for(let j = 0; j < row.length; j++){
            const button = row[j];
            (transposed[j] ??= []).push(button);
        }
    }
    return transposed;
}
function reflow(grid, columns, { fillLastRow =false  }) {
    let first = columns;
    if (fillLastRow) {
        const buttonCount = grid.map((row)=>row.length).reduce((a, b)=>a + b, 0);
        first = buttonCount % columns;
    }
    const reflowed = [];
    for (const row of grid){
        for (const button of row){
            const at = Math.max(0, reflowed.length - 1);
            const max = at === 0 ? first : columns;
            let next = reflowed[at] ??= [];
            if (next.length === max) {
                next = [];
                reflowed.push(next);
            }
            next.push(button);
        }
    }
    return reflowed;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vZGVuby5sYW5kL3gvZ3JhbW15QHYxLjI3LjAvY29udmVuaWVuY2Uva2V5Ym9hcmQudHMiXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHtcbiAgICB0eXBlIElubGluZUtleWJvYXJkQnV0dG9uLFxuICAgIHR5cGUgS2V5Ym9hcmRCdXR0b24sXG4gICAgdHlwZSBLZXlib2FyZEJ1dHRvblBvbGxUeXBlLFxuICAgIHR5cGUgS2V5Ym9hcmRCdXR0b25SZXF1ZXN0Q2hhdCxcbiAgICB0eXBlIEtleWJvYXJkQnV0dG9uUmVxdWVzdFVzZXJzLFxuICAgIHR5cGUgTG9naW5VcmwsXG4gICAgdHlwZSBTd2l0Y2hJbmxpbmVRdWVyeUNob3NlbkNoYXQsXG59IGZyb20gXCIuLi90eXBlcy50c1wiO1xuXG50eXBlIEtleWJvYXJkQnV0dG9uU291cmNlID0gc3RyaW5nIHwgS2V5Ym9hcmRCdXR0b247XG50eXBlIEtleWJvYXJkU291cmNlID0gS2V5Ym9hcmRCdXR0b25Tb3VyY2VbXVtdIHwgS2V5Ym9hcmQ7XG4vKipcbiAqIFVzZSB0aGlzIGNsYXNzIHRvIHNpbXBsaWZ5IGJ1aWxkaW5nIGEgY3VzdG9tIGtleWJvYXJkIChzb21ldGhpbmcgbGlrZSB0aGlzOlxuICogaHR0cHM6Ly9jb3JlLnRlbGVncmFtLm9yZy9ib3RzL2ZlYXR1cmVzI2tleWJvYXJkcykuXG4gKlxuICogYGBgdHNcbiAqIC8vIEJ1aWxkIGEgY3VzdG9tIGtleWJvYXJkOlxuICogY29uc3Qga2V5Ym9hcmQgPSBuZXcgS2V5Ym9hcmQoKVxuICogICAudGV4dCgnQScpLnRleHQoJ0InKS5yb3coKVxuICogICAudGV4dCgnQycpLnRleHQoJ0QnKVxuICpcbiAqIC8vIE5vdyB5b3UgY2FuIHNlbmQgaXQgbGlrZSBzbzpcbiAqIGF3YWl0IGN0eC5yZXBseSgnSGVyZSBpcyB5b3VyIGN1c3RvbSBrZXlib2FyZCEnLCB7XG4gKiAgIHJlcGx5X21hcmt1cDoga2V5Ym9hcmRcbiAqIH0pXG4gKiBgYGBcbiAqXG4gKiBJZiB5b3UgYWxyZWFkeSBoYXZlIHNvbWUgc291cmNlIGRhdGEgd2hpY2ggeW91IHdvdWxkIGxpa2UgdG8gdHVybiBpbnRvIGFcbiAqIGtleWJvYXJkIGJ1dHRvbiBvYmplY3QsIHlvdSBjYW4gdXNlIHRoZSBzdGF0aWMgZXF1aXZhbGVudHMgd2hpY2ggZXZlcnkgYnV0dG9uXG4gKiBoYXMuIFlvdSBjYW4gdXNlIHRoZW0gdG8gY3JlYXRlIGEgdHdvLWRpbWVuc2lvbmFsIGtleWJvYXJkIGJ1dHRvbiBhcnJheS4gVGhlXG4gKiByZXN1bHRpbmcgYXJyYXkgY2FuIGJlIHR1cm5lZCBpbnRvIGEga2V5Ym9hcmQgaW5zdGFuY2UuXG4gKlxuICogYGBgdHNcbiAqIGNvbnN0IGJ1dHRvbiA9IEtleWJvYXJkLnRleHQoJ3B1c2ggbXkgYnV0dG9ucycpXG4gKiBjb25zdCBhcnJheSA9IFtbYnV0dG9uXV1cbiAqIGNvbnN0IGtleWJvYXJkID0gS2V5Ym9hcmQuZnJvbShhcnJheSlcbiAqIGBgYFxuICpcbiAqIElmIHlvdSB3YW50IHRvIGNyZWF0ZSB0ZXh0IGJ1dHRvbnMgb25seSwgeW91IGNhbiBkaXJlY3RseSB1c2UgYVxuICogdHdvLWRpbWVuc2lvbmFsIHN0cmluZyBhcnJheSBhbmQgdHVybiBpdCBpbnRvIGEga2V5Ym9hcmQuXG4gKlxuICogYGBgdHNcbiAqIGNvbnN0IGRhdGEgPSBbWydBJywgJ0InXSwgWydDJywgJ0QnXV1cbiAqIGNvbnN0IGtleWJvYXJkID0gS2V5Ym9hcmQuZnJvbShkYXRhKVxuICogYGBgXG4gKlxuICogQmUgc3VyZSB0byBjaGVjayBvdXQgdGhlXG4gKiBbZG9jdW1lbnRhdGlvbl0oaHR0cHM6Ly9ncmFtbXkuZGV2L3BsdWdpbnMva2V5Ym9hcmQuaHRtbCNjdXN0b20ta2V5Ym9hcmRzKSBvblxuICogY3VzdG9tIGtleWJvYXJkcyBpbiBncmFtbVkuXG4gKi9cbmV4cG9ydCBjbGFzcyBLZXlib2FyZCB7XG4gICAgLyoqXG4gICAgICogUmVxdWVzdHMgY2xpZW50cyB0byBhbHdheXMgc2hvdyB0aGUga2V5Ym9hcmQgd2hlbiB0aGUgcmVndWxhciBrZXlib2FyZCBpc1xuICAgICAqIGhpZGRlbi4gRGVmYXVsdHMgdG8gZmFsc2UsIGluIHdoaWNoIGNhc2UgdGhlIGN1c3RvbSBrZXlib2FyZCBjYW4gYmVcbiAgICAgKiBoaWRkZW4gYW5kIG9wZW5lZCB3aXRoIGEga2V5Ym9hcmQgaWNvbi5cbiAgICAgKi9cbiAgICBwdWJsaWMgaXNfcGVyc2lzdGVudD86IGJvb2xlYW47XG4gICAgLyoqXG4gICAgICogU2hvdyB0aGUgY3VycmVudCBrZXlib2FyZCBvbmx5IHRvIHRob3NlIHVzZXJzIHRoYXQgYXJlIG1lbnRpb25lZCBpbiB0aGVcbiAgICAgKiB0ZXh0IG9mIHRoZSBtZXNzYWdlIG9iamVjdC5cbiAgICAgKi9cbiAgICBwdWJsaWMgc2VsZWN0aXZlPzogYm9vbGVhbjtcbiAgICAvKipcbiAgICAgKiBIaWRlIHRoZSBrZXlib2FyZCBhZnRlciBhIGJ1dHRvbiBpcyBwcmVzc2VkLlxuICAgICAqL1xuICAgIHB1YmxpYyBvbmVfdGltZV9rZXlib2FyZD86IGJvb2xlYW47XG4gICAgLyoqXG4gICAgICogUmVzaXplIHRoZSBjdXJyZW50IGtleWJvYXJkIGFjY29yZGluZyB0byBpdHMgYnV0dG9ucy4gVXN1YWxseSwgdGhpcyB3aWxsXG4gICAgICogbWFrZSB0aGUga2V5Ym9hcmQgc21hbGxlci5cbiAgICAgKi9cbiAgICBwdWJsaWMgcmVzaXplX2tleWJvYXJkPzogYm9vbGVhbjtcbiAgICAvKipcbiAgICAgKiBQbGFjZWhvbGRlciB0byBiZSBzaG93biBpbiB0aGUgaW5wdXQgZmllbGQgd2hlbiB0aGUga2V5Ym9hcmQgaXMgYWN0aXZlLlxuICAgICAqL1xuICAgIHB1YmxpYyBpbnB1dF9maWVsZF9wbGFjZWhvbGRlcj86IHN0cmluZztcblxuICAgIC8qKlxuICAgICAqIEluaXRpYWxpemUgYSBuZXcgYEtleWJvYXJkYCB3aXRoIGFuIG9wdGlvbmFsIHR3by1kaW1lbnNpb25hbCBhcnJheSBvZlxuICAgICAqIGBLZXlib2FyZEJ1dHRvbmAgb2JqZWN0cy4gVGhpcyBpcyB0aGUgbmVzdGVkIGFycmF5IHRoYXQgaG9sZHMgdGhlIGN1c3RvbVxuICAgICAqIGtleWJvYXJkLiBJdCB3aWxsIGJlIGV4dGVuZGVkIGV2ZXJ5IHRpbWUgeW91IGNhbGwgb25lIG9mIHRoZSBwcm92aWRlZFxuICAgICAqIG1ldGhvZHMuXG4gICAgICpcbiAgICAgKiBAcGFyYW0ga2V5Ym9hcmQgQW4gb3B0aW9uYWwgaW5pdGlhbCB0d28tZGltZW5zaW9uYWwgYnV0dG9uIGFycmF5XG4gICAgICovXG4gICAgY29uc3RydWN0b3IocHVibGljIHJlYWRvbmx5IGtleWJvYXJkOiBLZXlib2FyZEJ1dHRvbltdW10gPSBbW11dKSB7fVxuICAgIC8qKlxuICAgICAqIEFsbG93cyB5b3UgdG8gYWRkIHlvdXIgb3duIGBLZXlib2FyZEJ1dHRvbmAgb2JqZWN0cyBpZiB5b3UgYWxyZWFkeSBoYXZlXG4gICAgICogdGhlbSBmb3Igc29tZSByZWFzb24uIFlvdSBtb3N0IGxpa2VseSB3YW50IHRvIGNhbGwgb25lIG9mIHRoZSBvdGhlclxuICAgICAqIG1ldGhvZHMuXG4gICAgICpcbiAgICAgKiBAcGFyYW0gYnV0dG9ucyBUaGUgYnV0dG9ucyB0byBhZGRcbiAgICAgKi9cbiAgICBhZGQoLi4uYnV0dG9uczogS2V5Ym9hcmRCdXR0b25bXSkge1xuICAgICAgICB0aGlzLmtleWJvYXJkW3RoaXMua2V5Ym9hcmQubGVuZ3RoIC0gMV0/LnB1c2goLi4uYnV0dG9ucyk7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBBZGRzIGEgJ2xpbmUgYnJlYWsnLiBDYWxsIHRoaXMgbWV0aG9kIHRvIG1ha2Ugc3VyZSB0aGF0IHRoZSBuZXh0IGFkZGVkXG4gICAgICogYnV0dG9ucyB3aWxsIGJlIG9uIGEgbmV3IHJvdy5cbiAgICAgKlxuICAgICAqIFlvdSBtYXkgcGFzcyBhIG51bWJlciBvZiBgS2V5Ym9hcmRCdXR0b25gIG9iamVjdHMgaWYgeW91IGFscmVhZHkgaGF2ZSB0aGVcbiAgICAgKiBpbnN0YW5jZXMgZm9yIHNvbWUgcmVhc29uLiBZb3UgbW9zdCBsaWtlbHkgZG9uJ3Qgd2FudCB0byBwYXNzIGFueVxuICAgICAqIGFyZ3VtZW50cyB0byBgcm93YC5cbiAgICAgKlxuICAgICAqIEBwYXJhbSBidXR0b25zIEEgbnVtYmVyIG9mIGJ1dHRvbnMgdG8gYWRkIHRvIHRoZSBuZXh0IHJvd1xuICAgICAqL1xuICAgIHJvdyguLi5idXR0b25zOiBLZXlib2FyZEJ1dHRvbltdKSB7XG4gICAgICAgIHRoaXMua2V5Ym9hcmQucHVzaChidXR0b25zKTtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuICAgIC8qKlxuICAgICAqIEFkZHMgYSBuZXcgdGV4dCBidXR0b24uIFRoaXMgYnV0dG9uIHdpbGwgc2ltcGx5IHNlbmQgdGhlIGdpdmVuIHRleHQgYXMgYVxuICAgICAqIHRleHQgbWVzc2FnZSBiYWNrIHRvIHlvdXIgYm90IGlmIGEgdXNlciBjbGlja3Mgb24gaXQuXG4gICAgICpcbiAgICAgKiBAcGFyYW0gdGV4dCBUaGUgdGV4dCB0byBkaXNwbGF5XG4gICAgICovXG4gICAgdGV4dCh0ZXh0OiBzdHJpbmcpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuYWRkKEtleWJvYXJkLnRleHQodGV4dCkpO1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBDcmVhdGVzIGEgbmV3IHRleHQgYnV0dG9uLiBUaGlzIGJ1dHRvbiB3aWxsIHNpbXBseSBzZW5kIHRoZSBnaXZlbiB0ZXh0IGFzXG4gICAgICogYSB0ZXh0IG1lc3NhZ2UgYmFjayB0byB5b3VyIGJvdCBpZiBhIHVzZXIgY2xpY2tzIG9uIGl0LlxuICAgICAqXG4gICAgICogQHBhcmFtIHRleHQgVGhlIHRleHQgdG8gZGlzcGxheVxuICAgICAqL1xuICAgIHN0YXRpYyB0ZXh0KHRleHQ6IHN0cmluZyk6IEtleWJvYXJkQnV0dG9uLkNvbW1vbkJ1dHRvbiB7XG4gICAgICAgIHJldHVybiB7IHRleHQgfTtcbiAgICB9XG4gICAgLyoqXG4gICAgICogQWRkcyBhIG5ldyByZXF1ZXN0IHVzZXJzIGJ1dHRvbi4gV2hlbiB0aGUgdXNlciBwcmVzc2VzIHRoZSBidXR0b24sIGEgbGlzdFxuICAgICAqIG9mIHN1aXRhYmxlIHVzZXJzIHdpbGwgYmUgb3BlbmVkLiBUYXBwaW5nIG9uIGFueSBudW1iZXIgb2YgdXNlcnMgd2lsbFxuICAgICAqIHNlbmQgdGhlaXIgaWRlbnRpZmllcnMgdG8gdGhlIGJvdCBpbiBhIOKAnHVzZXJzX3NoYXJlZOKAnSBzZXJ2aWNlIG1lc3NhZ2UuXG4gICAgICogQXZhaWxhYmxlIGluIHByaXZhdGUgY2hhdHMgb25seS5cbiAgICAgKlxuICAgICAqIEBwYXJhbSB0ZXh0IFRoZSB0ZXh0IHRvIGRpc3BsYXlcbiAgICAgKiBAcGFyYW0gcmVxdWVzdElkIEEgc2lnbmVkIDMyLWJpdCBpZGVudGlmaWVyIG9mIHRoZSByZXF1ZXN0XG4gICAgICogQHBhcmFtIG9wdGlvbnMgT3B0aW9ucyBvYmplY3QgZm9yIGZ1cnRoZXIgcmVxdWlyZW1lbnRzXG4gICAgICovXG4gICAgcmVxdWVzdFVzZXJzKFxuICAgICAgICB0ZXh0OiBzdHJpbmcsXG4gICAgICAgIHJlcXVlc3RJZDogbnVtYmVyLFxuICAgICAgICBvcHRpb25zOiBPbWl0PEtleWJvYXJkQnV0dG9uUmVxdWVzdFVzZXJzLCBcInJlcXVlc3RfaWRcIj4gPSB7fSxcbiAgICApIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuYWRkKEtleWJvYXJkLnJlcXVlc3RVc2Vycyh0ZXh0LCByZXF1ZXN0SWQsIG9wdGlvbnMpKTtcbiAgICB9XG4gICAgLyoqXG4gICAgICogQ3JlYXRlcyBhIG5ldyByZXF1ZXN0IHVzZXJzIGJ1dHRvbi4gV2hlbiB0aGUgdXNlciBwcmVzc2VzIHRoZSBidXR0b24sIGFcbiAgICAgKiBsaXN0IG9mIHN1aXRhYmxlIHVzZXJzIHdpbGwgYmUgb3BlbmVkLiBUYXBwaW5nIG9uIGFueSBudW1iZXIgb2YgdXNlcnNcbiAgICAgKiB3aWxsIHNlbmQgdGhlaXIgaWRlbnRpZmllcnMgdG8gdGhlIGJvdCBpbiBhIOKAnHVzZXJzX3NoYXJlZOKAnSBzZXJ2aWNlXG4gICAgICogbWVzc2FnZS4gQXZhaWxhYmxlIGluIHByaXZhdGUgY2hhdHMgb25seS5cbiAgICAgKlxuICAgICAqIEBwYXJhbSB0ZXh0IFRoZSB0ZXh0IHRvIGRpc3BsYXlcbiAgICAgKiBAcGFyYW0gcmVxdWVzdElkIEEgc2lnbmVkIDMyLWJpdCBpZGVudGlmaWVyIG9mIHRoZSByZXF1ZXN0XG4gICAgICogQHBhcmFtIG9wdGlvbnMgT3B0aW9ucyBvYmplY3QgZm9yIGZ1cnRoZXIgcmVxdWlyZW1lbnRzXG4gICAgICovXG4gICAgc3RhdGljIHJlcXVlc3RVc2VycyhcbiAgICAgICAgdGV4dDogc3RyaW5nLFxuICAgICAgICByZXF1ZXN0SWQ6IG51bWJlcixcbiAgICAgICAgb3B0aW9uczogT21pdDxLZXlib2FyZEJ1dHRvblJlcXVlc3RVc2VycywgXCJyZXF1ZXN0X2lkXCI+ID0ge30sXG4gICAgKTogS2V5Ym9hcmRCdXR0b24uUmVxdWVzdFVzZXJzQnV0dG9uIHtcbiAgICAgICAgcmV0dXJuIHsgdGV4dCwgcmVxdWVzdF91c2VyczogeyByZXF1ZXN0X2lkOiByZXF1ZXN0SWQsIC4uLm9wdGlvbnMgfSB9O1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBBZGRzIGEgbmV3IHJlcXVlc3QgY2hhdCBidXR0b24uIFdoZW4gdGhlIHVzZXIgcHJlc3NlcyB0aGUgYnV0dG9uLCBhIGxpc3RcbiAgICAgKiBvZiBzdWl0YWJsZSB1c2VycyB3aWxsIGJlIG9wZW5lZC4gVGFwcGluZyBvbiBhIGNoYXQgd2lsbCBzZW5kIGl0c1xuICAgICAqIGlkZW50aWZpZXIgdG8gdGhlIGJvdCBpbiBhIOKAnGNoYXRfc2hhcmVk4oCdIHNlcnZpY2UgbWVzc2FnZS4gQXZhaWxhYmxlIGluXG4gICAgICogcHJpdmF0ZSBjaGF0cyBvbmx5LlxuICAgICAqXG4gICAgICogQHBhcmFtIHRleHQgVGhlIHRleHQgdG8gZGlzcGxheVxuICAgICAqIEBwYXJhbSByZXF1ZXN0SWQgQSBzaWduZWQgMzItYml0IGlkZW50aWZpZXIgb2YgdGhlIHJlcXVlc3RcbiAgICAgKiBAcGFyYW0gb3B0aW9ucyBPcHRpb25zIG9iamVjdCBmb3IgZnVydGhlciByZXF1aXJlbWVudHNcbiAgICAgKi9cbiAgICByZXF1ZXN0Q2hhdChcbiAgICAgICAgdGV4dDogc3RyaW5nLFxuICAgICAgICByZXF1ZXN0SWQ6IG51bWJlcixcbiAgICAgICAgb3B0aW9uczogT21pdDxLZXlib2FyZEJ1dHRvblJlcXVlc3RDaGF0LCBcInJlcXVlc3RfaWRcIj4gPSB7XG4gICAgICAgICAgICBjaGF0X2lzX2NoYW5uZWw6IGZhbHNlLFxuICAgICAgICB9LFxuICAgICkge1xuICAgICAgICByZXR1cm4gdGhpcy5hZGQoS2V5Ym9hcmQucmVxdWVzdENoYXQodGV4dCwgcmVxdWVzdElkLCBvcHRpb25zKSk7XG4gICAgfVxuICAgIC8qKlxuICAgICAqIENyZWF0ZXMgYSBuZXcgcmVxdWVzdCBjaGF0IGJ1dHRvbi4gV2hlbiB0aGUgdXNlciBwcmVzc2VzIHRoZSBidXR0b24sIGFcbiAgICAgKiBsaXN0IG9mIHN1aXRhYmxlIHVzZXJzIHdpbGwgYmUgb3BlbmVkLiBUYXBwaW5nIG9uIGEgY2hhdCB3aWxsIHNlbmQgaXRzXG4gICAgICogaWRlbnRpZmllciB0byB0aGUgYm90IGluIGEg4oCcY2hhdF9zaGFyZWTigJ0gc2VydmljZSBtZXNzYWdlLiBBdmFpbGFibGUgaW5cbiAgICAgKiBwcml2YXRlIGNoYXRzIG9ubHkuXG4gICAgICpcbiAgICAgKiBAcGFyYW0gdGV4dCBUaGUgdGV4dCB0byBkaXNwbGF5XG4gICAgICogQHBhcmFtIHJlcXVlc3RJZCBBIHNpZ25lZCAzMi1iaXQgaWRlbnRpZmllciBvZiB0aGUgcmVxdWVzdFxuICAgICAqIEBwYXJhbSBvcHRpb25zIE9wdGlvbnMgb2JqZWN0IGZvciBmdXJ0aGVyIHJlcXVpcmVtZW50c1xuICAgICAqL1xuICAgIHN0YXRpYyByZXF1ZXN0Q2hhdChcbiAgICAgICAgdGV4dDogc3RyaW5nLFxuICAgICAgICByZXF1ZXN0SWQ6IG51bWJlcixcbiAgICAgICAgb3B0aW9uczogT21pdDxLZXlib2FyZEJ1dHRvblJlcXVlc3RDaGF0LCBcInJlcXVlc3RfaWRcIj4gPSB7XG4gICAgICAgICAgICBjaGF0X2lzX2NoYW5uZWw6IGZhbHNlLFxuICAgICAgICB9LFxuICAgICk6IEtleWJvYXJkQnV0dG9uLlJlcXVlc3RDaGF0QnV0dG9uIHtcbiAgICAgICAgcmV0dXJuIHsgdGV4dCwgcmVxdWVzdF9jaGF0OiB7IHJlcXVlc3RfaWQ6IHJlcXVlc3RJZCwgLi4ub3B0aW9ucyB9IH07XG4gICAgfVxuICAgIC8qKlxuICAgICAqIEFkZHMgYSBuZXcgY29udGFjdCByZXF1ZXN0IGJ1dHRvbi4gVGhlIHVzZXIncyBwaG9uZSBudW1iZXIgd2lsbCBiZSBzZW50XG4gICAgICogYXMgYSBjb250YWN0IHdoZW4gdGhlIGJ1dHRvbiBpcyBwcmVzc2VkLiBBdmFpbGFibGUgaW4gcHJpdmF0ZSBjaGF0cyBvbmx5LlxuICAgICAqXG4gICAgICogQHBhcmFtIHRleHQgVGhlIHRleHQgdG8gZGlzcGxheVxuICAgICAqL1xuICAgIHJlcXVlc3RDb250YWN0KHRleHQ6IHN0cmluZykge1xuICAgICAgICByZXR1cm4gdGhpcy5hZGQoS2V5Ym9hcmQucmVxdWVzdENvbnRhY3QodGV4dCkpO1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBDcmVhdGVzIGEgbmV3IGNvbnRhY3QgcmVxdWVzdCBidXR0b24uIFRoZSB1c2VyJ3MgcGhvbmUgbnVtYmVyIHdpbGwgYmVcbiAgICAgKiBzZW50IGFzIGEgY29udGFjdCB3aGVuIHRoZSBidXR0b24gaXMgcHJlc3NlZC4gQXZhaWxhYmxlIGluIHByaXZhdGUgY2hhdHNcbiAgICAgKiBvbmx5LlxuICAgICAqXG4gICAgICogQHBhcmFtIHRleHQgVGhlIHRleHQgdG8gZGlzcGxheVxuICAgICAqL1xuICAgIHN0YXRpYyByZXF1ZXN0Q29udGFjdCh0ZXh0OiBzdHJpbmcpOiBLZXlib2FyZEJ1dHRvbi5SZXF1ZXN0Q29udGFjdEJ1dHRvbiB7XG4gICAgICAgIHJldHVybiB7IHRleHQsIHJlcXVlc3RfY29udGFjdDogdHJ1ZSB9O1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBBZGRzIGEgbmV3IGxvY2F0aW9uIHJlcXVlc3QgYnV0dG9uLiBUaGUgdXNlcidzIGN1cnJlbnQgbG9jYXRpb24gd2lsbCBiZVxuICAgICAqIHNlbnQgd2hlbiB0aGUgYnV0dG9uIGlzIHByZXNzZWQuIEF2YWlsYWJsZSBpbiBwcml2YXRlIGNoYXRzIG9ubHkuXG4gICAgICpcbiAgICAgKiBAcGFyYW0gdGV4dCBUaGUgdGV4dCB0byBkaXNwbGF5XG4gICAgICovXG4gICAgcmVxdWVzdExvY2F0aW9uKHRleHQ6IHN0cmluZykge1xuICAgICAgICByZXR1cm4gdGhpcy5hZGQoS2V5Ym9hcmQucmVxdWVzdExvY2F0aW9uKHRleHQpKTtcbiAgICB9XG4gICAgLyoqXG4gICAgICogQ3JlYXRlcyBhIG5ldyBsb2NhdGlvbiByZXF1ZXN0IGJ1dHRvbi4gVGhlIHVzZXIncyBjdXJyZW50IGxvY2F0aW9uIHdpbGxcbiAgICAgKiBiZSBzZW50IHdoZW4gdGhlIGJ1dHRvbiBpcyBwcmVzc2VkLiBBdmFpbGFibGUgaW4gcHJpdmF0ZSBjaGF0cyBvbmx5LlxuICAgICAqXG4gICAgICogQHBhcmFtIHRleHQgVGhlIHRleHQgdG8gZGlzcGxheVxuICAgICAqL1xuICAgIHN0YXRpYyByZXF1ZXN0TG9jYXRpb24odGV4dDogc3RyaW5nKTogS2V5Ym9hcmRCdXR0b24uUmVxdWVzdExvY2F0aW9uQnV0dG9uIHtcbiAgICAgICAgcmV0dXJuIHsgdGV4dCwgcmVxdWVzdF9sb2NhdGlvbjogdHJ1ZSB9O1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBBZGRzIGEgbmV3IHBvbGwgcmVxdWVzdCBidXR0b24uIFRoZSB1c2VyIHdpbGwgYmUgYXNrZWQgdG8gY3JlYXRlIGEgcG9sbFxuICAgICAqIGFuZCBzZW5kIGl0IHRvIHRoZSBib3Qgd2hlbiB0aGUgYnV0dG9uIGlzIHByZXNzZWQuIEF2YWlsYWJsZSBpbiBwcml2YXRlXG4gICAgICogY2hhdHMgb25seS5cbiAgICAgKlxuICAgICAqIEBwYXJhbSB0ZXh0IFRoZSB0ZXh0IHRvIGRpc3BsYXlcbiAgICAgKiBAcGFyYW0gdHlwZSBUaGUgdHlwZSBvZiBwZXJtaXR0ZWQgcG9sbHMgdG8gY3JlYXRlLCBvbWl0IGlmIHRoZSB1c2VyIG1heVxuICAgICAqIHNlbmQgYSBwb2xsIG9mIGFueSB0eXBlXG4gICAgICovXG4gICAgcmVxdWVzdFBvbGwodGV4dDogc3RyaW5nLCB0eXBlPzogS2V5Ym9hcmRCdXR0b25Qb2xsVHlwZVtcInR5cGVcIl0pIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuYWRkKEtleWJvYXJkLnJlcXVlc3RQb2xsKHRleHQsIHR5cGUpKTtcbiAgICB9XG4gICAgLyoqXG4gICAgICogQ3JlYXRlcyBhIG5ldyBwb2xsIHJlcXVlc3QgYnV0dG9uLiBUaGUgdXNlciB3aWxsIGJlIGFza2VkIHRvIGNyZWF0ZSBhXG4gICAgICogcG9sbCBhbmQgc2VuZCBpdCB0byB0aGUgYm90IHdoZW4gdGhlIGJ1dHRvbiBpcyBwcmVzc2VkLiBBdmFpbGFibGUgaW5cbiAgICAgKiBwcml2YXRlIGNoYXRzIG9ubHkuXG4gICAgICpcbiAgICAgKiBAcGFyYW0gdGV4dCBUaGUgdGV4dCB0byBkaXNwbGF5XG4gICAgICogQHBhcmFtIHR5cGUgVGhlIHR5cGUgb2YgcGVybWl0dGVkIHBvbGxzIHRvIGNyZWF0ZSwgb21pdCBpZiB0aGUgdXNlciBtYXlcbiAgICAgKiBzZW5kIGEgcG9sbCBvZiBhbnkgdHlwZVxuICAgICAqL1xuICAgIHN0YXRpYyByZXF1ZXN0UG9sbChcbiAgICAgICAgdGV4dDogc3RyaW5nLFxuICAgICAgICB0eXBlPzogS2V5Ym9hcmRCdXR0b25Qb2xsVHlwZVtcInR5cGVcIl0sXG4gICAgKTogS2V5Ym9hcmRCdXR0b24uUmVxdWVzdFBvbGxCdXR0b24ge1xuICAgICAgICByZXR1cm4geyB0ZXh0LCByZXF1ZXN0X3BvbGw6IHsgdHlwZSB9IH07XG4gICAgfVxuICAgIC8qKlxuICAgICAqIEFkZHMgYSBuZXcgd2ViIGFwcCBidXR0b24uIFRoZSBXZWIgQXBwIHRoYXQgd2lsbCBiZSBsYXVuY2hlZCB3aGVuIHRoZVxuICAgICAqIHVzZXIgcHJlc3NlcyB0aGUgYnV0dG9uLiBUaGUgV2ViIEFwcCB3aWxsIGJlIGFibGUgdG8gc2VuZCBhXG4gICAgICog4oCcd2ViX2FwcF9kYXRh4oCdIHNlcnZpY2UgbWVzc2FnZS4gQXZhaWxhYmxlIGluIHByaXZhdGUgY2hhdHMgb25seS5cbiAgICAgKlxuICAgICAqIEBwYXJhbSB0ZXh0IFRoZSB0ZXh0IHRvIGRpc3BsYXlcbiAgICAgKiBAcGFyYW0gdXJsIEFuIEhUVFBTIFVSTCBvZiBhIFdlYiBBcHAgdG8gYmUgb3BlbmVkIHdpdGggYWRkaXRpb25hbCBkYXRhXG4gICAgICovXG4gICAgd2ViQXBwKHRleHQ6IHN0cmluZywgdXJsOiBzdHJpbmcpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuYWRkKEtleWJvYXJkLndlYkFwcCh0ZXh0LCB1cmwpKTtcbiAgICB9XG4gICAgLyoqXG4gICAgICogQ3JlYXRlcyBhIG5ldyB3ZWIgYXBwIGJ1dHRvbi4gVGhlIFdlYiBBcHAgdGhhdCB3aWxsIGJlIGxhdW5jaGVkIHdoZW4gdGhlXG4gICAgICogdXNlciBwcmVzc2VzIHRoZSBidXR0b24uIFRoZSBXZWIgQXBwIHdpbGwgYmUgYWJsZSB0byBzZW5kIGFcbiAgICAgKiDigJx3ZWJfYXBwX2RhdGHigJ0gc2VydmljZSBtZXNzYWdlLiBBdmFpbGFibGUgaW4gcHJpdmF0ZSBjaGF0cyBvbmx5LlxuICAgICAqXG4gICAgICogQHBhcmFtIHRleHQgVGhlIHRleHQgdG8gZGlzcGxheVxuICAgICAqIEBwYXJhbSB1cmwgQW4gSFRUUFMgVVJMIG9mIGEgV2ViIEFwcCB0byBiZSBvcGVuZWQgd2l0aCBhZGRpdGlvbmFsIGRhdGFcbiAgICAgKi9cbiAgICBzdGF0aWMgd2ViQXBwKHRleHQ6IHN0cmluZywgdXJsOiBzdHJpbmcpOiBLZXlib2FyZEJ1dHRvbi5XZWJBcHBCdXR0b24ge1xuICAgICAgICByZXR1cm4geyB0ZXh0LCB3ZWJfYXBwOiB7IHVybCB9IH07XG4gICAgfVxuICAgIC8qKlxuICAgICAqIE1ha2UgdGhlIGN1cnJlbnQga2V5Ym9hcmQgcGVyc2lzdGVudC4gU2VlXG4gICAgICogaHR0cHM6Ly9ncmFtbXkuZGV2L3BsdWdpbnMva2V5Ym9hcmQuaHRtbCNwZXJzaXN0ZW50LWtleWJvYXJkcyBmb3IgbW9yZVxuICAgICAqIGRldGFpbHMuXG4gICAgICpcbiAgICAgKiBLZXlib2FyZHMgYXJlIG5vdCBwZXJzaXN0ZW50IGJ5IGRlZmF1bHQsIHVzZSB0aGlzIGZ1bmN0aW9uIHRvIGVuYWJsZSBpdFxuICAgICAqICh3aXRob3V0IGFueSBwYXJhbWV0ZXJzIG9yIHBhc3MgYHRydWVgKS4gUGFzcyBgZmFsc2VgIHRvIGZvcmNlIHRoZVxuICAgICAqIGtleWJvYXJkIHRvIG5vdCBwZXJzaXN0LlxuICAgICAqXG4gICAgICogQHBhcmFtIGlzRW5hYmxlZCBgdHJ1ZWAgaWYgdGhlIGtleWJvYXJkIHNob3VsZCBwZXJzaXN0LCBhbmQgYGZhbHNlYCBvdGhlcndpc2VcbiAgICAgKi9cbiAgICBwZXJzaXN0ZW50KGlzRW5hYmxlZCA9IHRydWUpIHtcbiAgICAgICAgdGhpcy5pc19wZXJzaXN0ZW50ID0gaXNFbmFibGVkO1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG4gICAgLyoqXG4gICAgICogTWFrZSB0aGUgY3VycmVudCBrZXlib2FyZCBzZWxlY3RpdmUuIFNlZVxuICAgICAqIGh0dHBzOi8vZ3JhbW15LmRldi9wbHVnaW5zL2tleWJvYXJkLmh0bWwjc2VsZWN0aXZlbHktc2VuZC1jdXN0b20ta2V5Ym9hcmRzXG4gICAgICogZm9yIG1vcmUgZGV0YWlscy5cbiAgICAgKlxuICAgICAqIEtleWJvYXJkcyBhcmUgbm9uLXNlbGVjdGl2ZSBieSBkZWZhdWx0LCB1c2UgdGhpcyBmdW5jdGlvbiB0byBlbmFibGUgaXRcbiAgICAgKiAod2l0aG91dCBhbnkgcGFyYW1ldGVycyBvciBwYXNzIGB0cnVlYCkuIFBhc3MgYGZhbHNlYCB0byBmb3JjZSB0aGVcbiAgICAgKiBrZXlib2FyZCB0byBiZSBub24tc2VsZWN0aXZlLlxuICAgICAqXG4gICAgICogQHBhcmFtIGlzRW5hYmxlZCBgdHJ1ZWAgaWYgdGhlIGtleWJvYXJkIHNob3VsZCBiZSBzZWxlY3RpdmUsIGFuZCBgZmFsc2VgIG90aGVyd2lzZVxuICAgICAqL1xuICAgIHNlbGVjdGVkKGlzRW5hYmxlZCA9IHRydWUpIHtcbiAgICAgICAgdGhpcy5zZWxlY3RpdmUgPSBpc0VuYWJsZWQ7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBNYWtlIHRoZSBjdXJyZW50IGtleWJvYXJkIG9uZS10aW1lLiBTZWVcbiAgICAgKiBodHRwczovL2dyYW1teS5kZXYvcGx1Z2lucy9rZXlib2FyZC5odG1sI29uZS10aW1lLWN1c3RvbS1rZXlib2FyZHMgZm9yXG4gICAgICogbW9yZSBkZXRhaWxzLlxuICAgICAqXG4gICAgICogS2V5Ym9hcmRzIGFyZSBub24tb25lLXRpbWUgYnkgZGVmYXVsdCwgdXNlIHRoaXMgZnVuY3Rpb24gdG8gZW5hYmxlIGl0XG4gICAgICogKHdpdGhvdXQgYW55IHBhcmFtZXRlcnMgb3IgcGFzcyBgdHJ1ZWApLiBQYXNzIGBmYWxzZWAgdG8gZm9yY2UgdGhlXG4gICAgICoga2V5Ym9hcmQgdG8gYmUgbm9uLW9uZS10aW1lLlxuICAgICAqXG4gICAgICogQHBhcmFtIGlzRW5hYmxlZCBgdHJ1ZWAgaWYgdGhlIGtleWJvYXJkIHNob3VsZCBiZSBvbmUtdGltZSwgYW5kIGBmYWxzZWAgb3RoZXJ3aXNlXG4gICAgICovXG4gICAgb25lVGltZShpc0VuYWJsZWQgPSB0cnVlKSB7XG4gICAgICAgIHRoaXMub25lX3RpbWVfa2V5Ym9hcmQgPSBpc0VuYWJsZWQ7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBNYWtlIHRoZSBjdXJyZW50IGtleWJvYXJkIHJlc2l6ZWQuIFNlZVxuICAgICAqIGh0dHBzOi8vZ3JhbW15LmRldi9wbHVnaW5zL2tleWJvYXJkLmh0bWwjcmVzaXplLWN1c3RvbS1rZXlib2FyZCBmb3IgbW9yZVxuICAgICAqIGRldGFpbHMuXG4gICAgICpcbiAgICAgKiBLZXlib2FyZHMgYXJlIG5vbi1yZXNpemVkIGJ5IGRlZmF1bHQsIHVzZSB0aGlzIGZ1bmN0aW9uIHRvIGVuYWJsZSBpdFxuICAgICAqICh3aXRob3V0IGFueSBwYXJhbWV0ZXJzIG9yIHBhc3MgYHRydWVgKS4gUGFzcyBgZmFsc2VgIHRvIGZvcmNlIHRoZVxuICAgICAqIGtleWJvYXJkIHRvIGJlIG5vbi1yZXNpemVkLlxuICAgICAqXG4gICAgICogQHBhcmFtIGlzRW5hYmxlZCBgdHJ1ZWAgaWYgdGhlIGtleWJvYXJkIHNob3VsZCBiZSByZXNpemVkLCBhbmQgYGZhbHNlYCBvdGhlcndpc2VcbiAgICAgKi9cbiAgICByZXNpemVkKGlzRW5hYmxlZCA9IHRydWUpIHtcbiAgICAgICAgdGhpcy5yZXNpemVfa2V5Ym9hcmQgPSBpc0VuYWJsZWQ7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBTZXQgdGhlIGN1cnJlbnQga2V5Ym9hcmQncyBpbnB1dCBmaWVsZCBwbGFjZWhvbGRlci4gU2VlXG4gICAgICogaHR0cHM6Ly9ncmFtbXkuZGV2L3BsdWdpbnMva2V5Ym9hcmQuaHRtbCNpbnB1dC1maWVsZC1wbGFjZWhvbGRlciBmb3IgbW9yZVxuICAgICAqIGRldGFpbHMuXG4gICAgICpcbiAgICAgKiBAcGFyYW0gdmFsdWUgVGhlIHBsYWNlaG9sZGVyIHRleHRcbiAgICAgKi9cbiAgICBwbGFjZWhvbGRlcih2YWx1ZTogc3RyaW5nKSB7XG4gICAgICAgIHRoaXMuaW5wdXRfZmllbGRfcGxhY2Vob2xkZXIgPSB2YWx1ZTtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuICAgIC8qKlxuICAgICAqIENyZWF0ZXMgYSBuZXcga2V5Ym9hcmQgdGhhdCBjb250YWlucyB0aGUgdHJhbnNwb3NlZCBncmlkIG9mIGJ1dHRvbnMgb2ZcbiAgICAgKiB0aGlzIGtleWJvYXJkLiBUaGlzIG1lYW5zIHRoYXQgdGhlIHJlc3VsdGluZyBrZXlib2FyZCBoYXMgdGhlIHJvd3MgYW5kXG4gICAgICogY29sdW1ucyBmbGlwcGVkLlxuICAgICAqXG4gICAgICogTm90ZSB0aGF0IGJ1dHRvbnMgY2FuIG9ubHkgc3BhbiBtdWx0aXBsZSBjb2x1bW5zLCBidXQgbmV2ZXIgbXVsdGlwbGVcbiAgICAgKiByb3dzLiBUaGlzIG1lYW5zIHRoYXQgaWYgdGhlIGdpdmVuIGFycmF5cyBoYXZlIGRpZmZlcmVudCBsZW5ndGhzLCBzb21lXG4gICAgICogYnV0dG9ucyBtaWdodCBmbG93IHVwIGluIHRoZSBsYXlvdXQuIEluIHRoZXNlIGNhc2VzLCB0cmFuc3Bvc2luZyBhXG4gICAgICoga2V5Ym9hcmQgYSBzZWNvbmQgdGltZSB3aWxsIG5vdCB1bmRvIHRoZSBmaXJzdCB0cmFuc3Bvc2l0aW9uLlxuICAgICAqXG4gICAgICogSGVyZSBhcmUgc29tZSBleGFtcGxlcy5cbiAgICAgKlxuICAgICAqIGBgYFxuICAgICAqIG9yaWdpbmFsICAgIHRyYW5zcG9zZWRcbiAgICAgKiBbICBhICBdICB+PiBbICBhICBdXG4gICAgICpcbiAgICAgKiAgICAgICAgICAgICBbICBhICBdXG4gICAgICogW2EgYiBjXSAgfj4gWyAgYiAgXVxuICAgICAqICAgICAgICAgICAgIFsgIGMgIF1cbiAgICAgKlxuICAgICAqIFsgYSBiIF0gICAgIFthIGMgZV1cbiAgICAgKiBbIGMgZCBdICB+PiBbIGIgZCBdXG4gICAgICogWyAgZSAgXVxuICAgICAqXG4gICAgICogWyBhIGIgXSAgICAgW2EgYyBkXVxuICAgICAqIFsgIGMgIF0gIH4+IFsgYiBlIF1cbiAgICAgKiBbZCBlIGZdICAgICBbICBmICBdXG4gICAgICogYGBgXG4gICAgICovXG4gICAgdG9UcmFuc3Bvc2VkKCkge1xuICAgICAgICBjb25zdCBvcmlnaW5hbCA9IHRoaXMua2V5Ym9hcmQ7XG4gICAgICAgIGNvbnN0IHRyYW5zcG9zZWQgPSB0cmFuc3Bvc2Uob3JpZ2luYWwpO1xuICAgICAgICByZXR1cm4gdGhpcy5jbG9uZSh0cmFuc3Bvc2VkKTtcbiAgICB9XG4gICAgLyoqXG4gICAgICogQ3JlYXRlcyBhIG5ldyBrZXlib2FyZCB3aXRoIHRoZSBzYW1lIGJ1dHRvbnMgYnV0IHJlZmxvd2VkIGludG8gYSBnaXZlblxuICAgICAqIG51bWJlciBvZiBjb2x1bW5zIGFzIGlmIHRoZSBidXR0b25zIHdlcmUgdGV4dCBlbGVtZW50cy4gT3B0aW9uYWxseSwgeW91XG4gICAgICogY2FuIHNwZWNpZnkgaWYgdGhlIGZsb3cgc2hvdWxkIG1ha2Ugc3VyZSB0byBmaWxsIHVwIHRoZSBsYXN0IHJvdy5cbiAgICAgKlxuICAgICAqIFRoaXMgbWV0aG9kIGlzIGlkZW1wb3RlbnQsIHNvIGNhbGxpbmcgaXQgYSBzZWNvbmQgdGltZSB3aWxsIGVmZmVjdGl2ZWx5XG4gICAgICogY2xvbmUgdGhpcyBrZXlib2FyZCB3aXRob3V0IHJlb3JkZXJpbmcgdGhlIGJ1dHRvbnMuXG4gICAgICpcbiAgICAgKiBIZXJlIGFyZSBzb21lIGV4YW1wbGVzLlxuICAgICAqXG4gICAgICogYGBgXG4gICAgICogb3JpZ2luYWwgICAgZmxvd2VkXG4gICAgICogWyAgYSAgXSAgfj4gWyAgYSAgXSAgICAoNCBjb2x1bW5zKVxuICAgICAqXG4gICAgICogICAgICAgICAgICAgWyAgYSAgXVxuICAgICAqIFthIGIgY10gIH4+IFsgIGIgIF0gICAgKDEgY29sdW1uKVxuICAgICAqICAgICAgICAgICAgIFsgIGMgIF1cbiAgICAgKlxuICAgICAqIFsgYSBiIF0gICAgIFthIGIgY11cbiAgICAgKiBbIGMgZCBdICB+PiBbIGQgZSBdICAgICgzIGNvbHVtbnMpXG4gICAgICogWyAgZSAgXVxuICAgICAqXG4gICAgICogWyBhIGIgXSAgICAgW2FiY2RlXVxuICAgICAqIFsgIGMgIF0gIH4+IFsgIGYgIF0gICAgKDUgY29sdW1ucylcbiAgICAgKiBbZCBlIGZdXG4gICAgICpcbiAgICAgKiBbYSBiIGNdICAgICBbICBhICBdXG4gICAgICogW2QgZSBmXSAgfj4gW2IgYyBkXSAgICAoMyBjb2x1bXMsIHsgZmlsbExhc3RSb3c6IHRydWUgfSlcbiAgICAgKiBbZyBoIGldICAgICBbZSBmIGddXG4gICAgICogWyAgaiAgXSAgICAgW2ggaSBqXVxuICAgICAqIGBgYFxuICAgICAqXG4gICAgICogQHBhcmFtIGNvbHVtbnMgTWF4aW11bSBudW1iZXIgb2YgYnV0dG9ucyBwZXIgcm93XG4gICAgICogQHBhcmFtIG9wdGlvbnMgT3B0aW9uYWwgZmxvd2luZyBiZWhhdmlvclxuICAgICAqL1xuICAgIHRvRmxvd2VkKGNvbHVtbnM6IG51bWJlciwgb3B0aW9uczogRmxvd09wdGlvbnMgPSB7fSkge1xuICAgICAgICBjb25zdCBvcmlnaW5hbCA9IHRoaXMua2V5Ym9hcmQ7XG4gICAgICAgIGNvbnN0IGZsb3dlZCA9IHJlZmxvdyhvcmlnaW5hbCwgY29sdW1ucywgb3B0aW9ucyk7XG4gICAgICAgIHJldHVybiB0aGlzLmNsb25lKGZsb3dlZCk7XG4gICAgfVxuICAgIC8qKlxuICAgICAqIENyZWF0ZXMgYW5kIHJldHVybnMgYSBkZWVwIGNvcHkgb2YgdGhpcyBrZXlib2FyZC5cbiAgICAgKlxuICAgICAqIE9wdGlvbmFsbHkgdGFrZXMgYSBuZXcgZ3JpZCBvZiBidXR0b25zIHRvIHJlcGxhY2UgdGhlIGN1cnJlbnQgYnV0dG9ucy4gSWZcbiAgICAgKiBzcGVjaWZpZWQsIG9ubHkgdGhlIG9wdGlvbnMgd2lsbCBiZSBjbG9uZWQsIGFuZCB0aGUgZ2l2ZW4gYnV0dG9ucyB3aWxsIGJlXG4gICAgICogdXNlZCBpbnN0ZWFkLlxuICAgICAqL1xuICAgIGNsb25lKGtleWJvYXJkOiBLZXlib2FyZEJ1dHRvbltdW10gPSB0aGlzLmtleWJvYXJkKSB7XG4gICAgICAgIGNvbnN0IGNsb25lID0gbmV3IEtleWJvYXJkKGtleWJvYXJkLm1hcCgocm93KSA9PiByb3cuc2xpY2UoKSkpO1xuICAgICAgICBjbG9uZS5pc19wZXJzaXN0ZW50ID0gdGhpcy5pc19wZXJzaXN0ZW50O1xuICAgICAgICBjbG9uZS5zZWxlY3RpdmUgPSB0aGlzLnNlbGVjdGl2ZTtcbiAgICAgICAgY2xvbmUub25lX3RpbWVfa2V5Ym9hcmQgPSB0aGlzLm9uZV90aW1lX2tleWJvYXJkO1xuICAgICAgICBjbG9uZS5yZXNpemVfa2V5Ym9hcmQgPSB0aGlzLnJlc2l6ZV9rZXlib2FyZDtcbiAgICAgICAgY2xvbmUuaW5wdXRfZmllbGRfcGxhY2Vob2xkZXIgPSB0aGlzLmlucHV0X2ZpZWxkX3BsYWNlaG9sZGVyO1xuICAgICAgICByZXR1cm4gY2xvbmU7XG4gICAgfVxuICAgIC8qKlxuICAgICAqIEFwcGVuZHMgdGhlIGJ1dHRvbnMgb2YgdGhlIGdpdmVuIGtleWJvYXJkcyB0byB0aGlzIGtleWJvYXJkLiBJZiBvdGhlclxuICAgICAqIG9wdGlvbnMgYXJlIHNwZWNpZmllZCBpbiB0aGVzZSBrZXlib2FyZHMsIHRoZXkgd2lsbCBiZSBpZ25vcmVkLlxuICAgICAqXG4gICAgICogQHBhcmFtIHNvdXJjZXMgQSBudW1iZXIgb2Yga2V5Ym9hcmRzIHRvIGFwcGVuZFxuICAgICAqL1xuICAgIGFwcGVuZCguLi5zb3VyY2VzOiBLZXlib2FyZFNvdXJjZVtdKSB7XG4gICAgICAgIGZvciAoY29uc3Qgc291cmNlIG9mIHNvdXJjZXMpIHtcbiAgICAgICAgICAgIGNvbnN0IGtleWJvYXJkID0gS2V5Ym9hcmQuZnJvbShzb3VyY2UpO1xuICAgICAgICAgICAgdGhpcy5rZXlib2FyZC5wdXNoKC4uLmtleWJvYXJkLmtleWJvYXJkLm1hcCgocm93KSA9PiByb3cuc2xpY2UoKSkpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBSZXR1cm5zIHRoZSBrZXlib2FyZCB0aGF0IHdhcyBidWlsZC4gTm90ZSB0aGF0IGl0IGRvZXNuJ3QgcmV0dXJuXG4gICAgICogYHJlc2l6ZV9rZXlib2FyZGAgb3Igb3RoZXIgb3B0aW9ucyB0aGF0IG1heSBiZSBzZXQuIFlvdSBkb24ndCB1c3VhbGx5XG4gICAgICogbmVlZCB0byBjYWxsIHRoaXMgbWV0aG9kLiBJdCBpcyBubyBsb25nZXIgdXNlZnVsLlxuICAgICAqL1xuICAgIGJ1aWxkKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5rZXlib2FyZDtcbiAgICB9XG4gICAgLyoqXG4gICAgICogVHVybnMgYSB0d28tZGltZW5zaW9uYWwga2V5Ym9hcmQgYnV0dG9uIGFycmF5IGludG8gYSBrZXlib2FyZCBpbnN0YW5jZS5cbiAgICAgKiBZb3UgY2FuIHVzZSB0aGUgc3RhdGljIGJ1dHRvbiBidWlsZGVyIG1ldGhvZHMgdG8gY3JlYXRlIGtleWJvYXJkIGJ1dHRvblxuICAgICAqIG9iamVjdHMuXG4gICAgICpcbiAgICAgKiBAcGFyYW0gc291cmNlIEEgdHdvLWRpbWVuc2lvbmFsIGJ1dHRvbiBhcnJheVxuICAgICAqL1xuICAgIHN0YXRpYyBmcm9tKHNvdXJjZTogS2V5Ym9hcmRTb3VyY2UpOiBLZXlib2FyZCB7XG4gICAgICAgIGlmIChzb3VyY2UgaW5zdGFuY2VvZiBLZXlib2FyZCkgcmV0dXJuIHNvdXJjZS5jbG9uZSgpO1xuICAgICAgICBmdW5jdGlvbiB0b0J1dHRvbihidG46IEtleWJvYXJkQnV0dG9uU291cmNlKSB7XG4gICAgICAgICAgICByZXR1cm4gdHlwZW9mIGJ0biA9PT0gXCJzdHJpbmdcIiA/IEtleWJvYXJkLnRleHQoYnRuKSA6IGJ0bjtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gbmV3IEtleWJvYXJkKHNvdXJjZS5tYXAoKHJvdykgPT4gcm93Lm1hcCh0b0J1dHRvbikpKTtcbiAgICB9XG59XG5cbnR5cGUgSW5saW5lS2V5Ym9hcmRTb3VyY2UgPSBJbmxpbmVLZXlib2FyZEJ1dHRvbltdW10gfCBJbmxpbmVLZXlib2FyZDtcbi8qKlxuICogVXNlIHRoaXMgY2xhc3MgdG8gc2ltcGxpZnkgYnVpbGRpbmcgYW4gaW5saW5lIGtleWJvYXJkIChzb21ldGhpbmcgbGlrZSB0aGlzOlxuICogaHR0cHM6Ly9jb3JlLnRlbGVncmFtLm9yZy9ib3RzL2ZlYXR1cmVzI2lubGluZS1rZXlib2FyZHMpLlxuICpcbiAqIGBgYHRzXG4gKiAvLyBCdWlsZCBhbiBpbmxpbmUga2V5Ym9hcmQ6XG4gKiBjb25zdCBrZXlib2FyZCA9IG5ldyBJbmxpbmVLZXlib2FyZCgpXG4gKiAgIC50ZXh0KCdBJykudGV4dCgnQicsICdjYWxsYmFjay1kYXRhJykucm93KClcbiAqICAgLnRleHQoJ0MnKS50ZXh0KCdEJykucm93KClcbiAqICAgLnVybCgnVGVsZWdyYW0nLCAndGVsZWdyYW0ub3JnJylcbiAqXG4gKiAvLyBTZW5kIHRoZSBrZXlib2FyZDpcbiAqIGF3YWl0IGN0eC5yZXBseSgnSGVyZSBpcyB5b3VyIGlubGluZSBrZXlib2FyZCEnLCB7XG4gKiAgIHJlcGx5X21hcmt1cDoga2V5Ym9hcmRcbiAqIH0pXG4gKiBgYGBcbiAqXG4gKiBJZiB5b3UgYWxyZWFkeSBoYXZlIHNvbWUgc291cmNlIGRhdGEgd2hpY2ggeW91IHdvdWxkIGxpa2UgdG8gdHVybiBpbnRvIGFuXG4gKiBpbmxpbmUgYnV0dG9uIG9iamVjdCwgeW91IGNhbiB1c2UgdGhlIHN0YXRpYyBlcXVpdmFsZW50cyB3aGljaCBldmVyeSBpbmxpbmVcbiAqIGJ1dHRvbiBoYXMuIFlvdSBjYW4gdXNlIHRoZW0gdG8gY3JlYXRlIGEgdHdvLWRpbWVuc2lvbmFsIGlubGluZSBidXR0b24gYXJyYXkuXG4gKiBUaGUgcmVzdWx0aW5nIGFycmF5IGNhbiBiZSB0dXJuZWQgaW50byBhIGtleWJvYXJkIGluc3RhbmNlLlxuICpcbiAqIGBgYHRzXG4gKiBjb25zdCBidXR0b24gPSBJbmxpbmVLZXlib2FyZC50ZXh0KCdHTycsICdnbycpXG4gKiBjb25zdCBhcnJheSA9IFtbYnV0dG9uXV1cbiAqIGNvbnN0IGtleWJvYXJkID0gSW5saW5lS2V5Ym9hcmQuZnJvbShhcnJheSlcbiAqIGBgYFxuICpcbiAqIEJlIHN1cmUgdG8gdG8gY2hlY2sgdGhlXG4gKiBbZG9jdW1lbnRhdGlvbl0oaHR0cHM6Ly9ncmFtbXkuZGV2L3BsdWdpbnMva2V5Ym9hcmQuaHRtbCNpbmxpbmUta2V5Ym9hcmRzKSBvblxuICogaW5saW5lIGtleWJvYXJkcyBpbiBncmFtbVkuXG4gKi9cbmV4cG9ydCBjbGFzcyBJbmxpbmVLZXlib2FyZCB7XG4gICAgLyoqXG4gICAgICogSW5pdGlhbGl6ZSBhIG5ldyBgSW5saW5lS2V5Ym9hcmRgIHdpdGggYW4gb3B0aW9uYWwgdHdvLWRpbWVuc2lvbmFsIGFycmF5XG4gICAgICogb2YgYElubGluZUtleWJvYXJkQnV0dG9uYCBvYmplY3RzLiBUaGlzIGlzIHRoZSBuZXN0ZWQgYXJyYXkgdGhhdCBob2xkc1xuICAgICAqIHRoZSBpbmxpbmUga2V5Ym9hcmQuIEl0IHdpbGwgYmUgZXh0ZW5kZWQgZXZlcnkgdGltZSB5b3UgY2FsbCBvbmUgb2YgdGhlXG4gICAgICogcHJvdmlkZWQgbWV0aG9kcy5cbiAgICAgKlxuICAgICAqIEBwYXJhbSBpbmxpbmVfa2V5Ym9hcmQgQW4gb3B0aW9uYWwgaW5pdGlhbCB0d28tZGltZW5zaW9uYWwgYnV0dG9uIGFycmF5XG4gICAgICovXG4gICAgY29uc3RydWN0b3IoXG4gICAgICAgIHB1YmxpYyByZWFkb25seSBpbmxpbmVfa2V5Ym9hcmQ6IElubGluZUtleWJvYXJkQnV0dG9uW11bXSA9IFtbXV0sXG4gICAgKSB7fVxuICAgIC8qKlxuICAgICAqIEFsbG93cyB5b3UgdG8gYWRkIHlvdXIgb3duIGBJbmxpbmVLZXlib2FyZEJ1dHRvbmAgb2JqZWN0cyBpZiB5b3UgYWxyZWFkeVxuICAgICAqIGhhdmUgdGhlbSBmb3Igc29tZSByZWFzb24uIFlvdSBtb3N0IGxpa2VseSB3YW50IHRvIGNhbGwgb25lIG9mIHRoZSBvdGhlclxuICAgICAqIG1ldGhvZHMuXG4gICAgICpcbiAgICAgKiBAcGFyYW0gYnV0dG9ucyBUaGUgYnV0dG9ucyB0byBhZGRcbiAgICAgKi9cbiAgICBhZGQoLi4uYnV0dG9uczogSW5saW5lS2V5Ym9hcmRCdXR0b25bXSkge1xuICAgICAgICB0aGlzLmlubGluZV9rZXlib2FyZFt0aGlzLmlubGluZV9rZXlib2FyZC5sZW5ndGggLSAxXT8ucHVzaCguLi5idXR0b25zKTtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuICAgIC8qKlxuICAgICAqIEFkZHMgYSAnbGluZSBicmVhaycuIENhbGwgdGhpcyBtZXRob2QgdG8gbWFrZSBzdXJlIHRoYXQgdGhlIG5leHQgYWRkZWRcbiAgICAgKiBidXR0b25zIHdpbGwgYmUgb24gYSBuZXcgcm93LlxuICAgICAqXG4gICAgICogWW91IG1heSBwYXNzIGEgbnVtYmVyIG9mIGBJbmxpbmVLZXlib2FyZEJ1dHRvbmAgb2JqZWN0cyBpZiB5b3UgYWxyZWFkeVxuICAgICAqIGhhdmUgdGhlIGluc3RhbmNlcyBmb3Igc29tZSByZWFzb24uIFlvdSBtb3N0IGxpa2VseSBkb24ndCB3YW50IHRvIHBhc3NcbiAgICAgKiBhbnkgYXJndW1lbnRzIHRvIGByb3dgLlxuICAgICAqXG4gICAgICogQHBhcmFtIGJ1dHRvbnMgQSBudW1iZXIgb2YgYnV0dG9ucyB0byBhZGQgdG8gdGhlIG5leHQgcm93XG4gICAgICovXG4gICAgcm93KC4uLmJ1dHRvbnM6IElubGluZUtleWJvYXJkQnV0dG9uW10pIHtcbiAgICAgICAgdGhpcy5pbmxpbmVfa2V5Ym9hcmQucHVzaChidXR0b25zKTtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuICAgIC8qKlxuICAgICAqIEFkZHMgYSBuZXcgVVJMIGJ1dHRvbi4gVGVsZWdyYW0gY2xpZW50cyB3aWxsIG9wZW4gdGhlIHByb3ZpZGVkIFVSTCB3aGVuXG4gICAgICogdGhlIGJ1dHRvbiBpcyBwcmVzc2VkLlxuICAgICAqXG4gICAgICogQHBhcmFtIHRleHQgVGhlIHRleHQgdG8gZGlzcGxheVxuICAgICAqIEBwYXJhbSB1cmwgSFRUUCBvciB0ZzovLyB1cmwgdG8gYmUgb3BlbmVkIHdoZW4gdGhlIGJ1dHRvbiBpcyBwcmVzc2VkLiBMaW5rcyB0ZzovL3VzZXI/aWQ9PHVzZXJfaWQ+IGNhbiBiZSB1c2VkIHRvIG1lbnRpb24gYSB1c2VyIGJ5IHRoZWlyIElEIHdpdGhvdXQgdXNpbmcgYSB1c2VybmFtZSwgaWYgdGhpcyBpcyBhbGxvd2VkIGJ5IHRoZWlyIHByaXZhY3kgc2V0dGluZ3MuXG4gICAgICovXG4gICAgdXJsKHRleHQ6IHN0cmluZywgdXJsOiBzdHJpbmcpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuYWRkKElubGluZUtleWJvYXJkLnVybCh0ZXh0LCB1cmwpKTtcbiAgICB9XG4gICAgLyoqXG4gICAgICogQ3JlYXRlcyBhIG5ldyBVUkwgYnV0dG9uLiBUZWxlZ3JhbSBjbGllbnRzIHdpbGwgb3BlbiB0aGUgcHJvdmlkZWQgVVJMXG4gICAgICogd2hlbiB0aGUgYnV0dG9uIGlzIHByZXNzZWQuXG4gICAgICpcbiAgICAgKiBAcGFyYW0gdGV4dCBUaGUgdGV4dCB0byBkaXNwbGF5XG4gICAgICogQHBhcmFtIHVybCBIVFRQIG9yIHRnOi8vIHVybCB0byBiZSBvcGVuZWQgd2hlbiB0aGUgYnV0dG9uIGlzIHByZXNzZWQuIExpbmtzIHRnOi8vdXNlcj9pZD08dXNlcl9pZD4gY2FuIGJlIHVzZWQgdG8gbWVudGlvbiBhIHVzZXIgYnkgdGhlaXIgSUQgd2l0aG91dCB1c2luZyBhIHVzZXJuYW1lLCBpZiB0aGlzIGlzIGFsbG93ZWQgYnkgdGhlaXIgcHJpdmFjeSBzZXR0aW5ncy5cbiAgICAgKi9cbiAgICBzdGF0aWMgdXJsKHRleHQ6IHN0cmluZywgdXJsOiBzdHJpbmcpOiBJbmxpbmVLZXlib2FyZEJ1dHRvbi5VcmxCdXR0b24ge1xuICAgICAgICByZXR1cm4geyB0ZXh0LCB1cmwgfTtcbiAgICB9XG4gICAgLyoqXG4gICAgICogQWRkcyBhIG5ldyBjYWxsYmFjayBxdWVyeSBidXR0b24uIFRoZSBidXR0b24gY29udGFpbnMgYSB0ZXh0IGFuZCBhIGN1c3RvbVxuICAgICAqIHBheWxvYWQuIFRoaXMgcGF5bG9hZCB3aWxsIGJlIHNlbnQgYmFjayB0byB5b3VyIGJvdCB3aGVuIHRoZSBidXR0b24gaXNcbiAgICAgKiBwcmVzc2VkLiBJZiB5b3Ugb21pdCB0aGUgcGF5bG9hZCwgdGhlIGRpc3BsYXkgdGV4dCB3aWxsIGJlIHNlbnQgYmFjayB0b1xuICAgICAqIHlvdXIgYm90LlxuICAgICAqXG4gICAgICogWW91ciBib3Qgd2lsbCByZWNlaXZlIGFuIHVwZGF0ZSBldmVyeSB0aW1lIGEgdXNlciBwcmVzc2VzIGFueSBvZiB0aGUgdGV4dFxuICAgICAqIGJ1dHRvbnMuIFlvdSBjYW4gbGlzdGVuIHRvIHRoZXNlIHVwZGF0ZXMgbGlrZSB0aGlzOlxuICAgICAqIGBgYHRzXG4gICAgICogLy8gU3BlY2lmaWMgYnV0dG9uczpcbiAgICAgKiBib3QuY2FsbGJhY2tRdWVyeSgnYnV0dG9uLWRhdGEnLCBjdHggPT4geyAuLi4gfSlcbiAgICAgKiAvLyBBbnkgYnV0dG9uIG9mIGFueSBpbmxpbmUga2V5Ym9hcmQ6XG4gICAgICogYm90Lm9uKCdjYWxsYmFja19xdWVyeTpkYXRhJywgICAgY3R4ID0+IHsgLi4uIH0pXG4gICAgICogYGBgXG4gICAgICpcbiAgICAgKiBAcGFyYW0gdGV4dCBUaGUgdGV4dCB0byBkaXNwbGF5XG4gICAgICogQHBhcmFtIGRhdGEgVGhlIGNhbGxiYWNrIGRhdGEgdG8gc2VuZCBiYWNrIHRvIHlvdXIgYm90IChkZWZhdWx0ID0gdGV4dClcbiAgICAgKi9cbiAgICB0ZXh0KHRleHQ6IHN0cmluZywgZGF0YSA9IHRleHQpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuYWRkKElubGluZUtleWJvYXJkLnRleHQodGV4dCwgZGF0YSkpO1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBDcmVhdGVzIGEgbmV3IGNhbGxiYWNrIHF1ZXJ5IGJ1dHRvbi4gVGhlIGJ1dHRvbiBjb250YWlucyBhIHRleHQgYW5kIGFcbiAgICAgKiBjdXN0b20gcGF5bG9hZC4gVGhpcyBwYXlsb2FkIHdpbGwgYmUgc2VudCBiYWNrIHRvIHlvdXIgYm90IHdoZW4gdGhlXG4gICAgICogYnV0dG9uIGlzIHByZXNzZWQuIElmIHlvdSBvbWl0IHRoZSBwYXlsb2FkLCB0aGUgZGlzcGxheSB0ZXh0IHdpbGwgYmUgc2VudFxuICAgICAqIGJhY2sgdG8geW91ciBib3QuXG4gICAgICpcbiAgICAgKiBZb3VyIGJvdCB3aWxsIHJlY2VpdmUgYW4gdXBkYXRlIGV2ZXJ5IHRpbWUgYSB1c2VyIHByZXNzZXMgYW55IG9mIHRoZSB0ZXh0XG4gICAgICogYnV0dG9ucy4gWW91IGNhbiBsaXN0ZW4gdG8gdGhlc2UgdXBkYXRlcyBsaWtlIHRoaXM6XG4gICAgICogYGBgdHNcbiAgICAgKiAvLyBTcGVjaWZpYyBidXR0b25zOlxuICAgICAqIGJvdC5jYWxsYmFja1F1ZXJ5KCdidXR0b24tZGF0YScsIGN0eCA9PiB7IC4uLiB9KVxuICAgICAqIC8vIEFueSBidXR0b24gb2YgYW55IGlubGluZSBrZXlib2FyZDpcbiAgICAgKiBib3Qub24oJ2NhbGxiYWNrX3F1ZXJ5OmRhdGEnLCAgICBjdHggPT4geyAuLi4gfSlcbiAgICAgKiBgYGBcbiAgICAgKlxuICAgICAqIEBwYXJhbSB0ZXh0IFRoZSB0ZXh0IHRvIGRpc3BsYXlcbiAgICAgKiBAcGFyYW0gZGF0YSBUaGUgY2FsbGJhY2sgZGF0YSB0byBzZW5kIGJhY2sgdG8geW91ciBib3QgKGRlZmF1bHQgPSB0ZXh0KVxuICAgICAqL1xuICAgIHN0YXRpYyB0ZXh0KFxuICAgICAgICB0ZXh0OiBzdHJpbmcsXG4gICAgICAgIGRhdGEgPSB0ZXh0LFxuICAgICk6IElubGluZUtleWJvYXJkQnV0dG9uLkNhbGxiYWNrQnV0dG9uIHtcbiAgICAgICAgcmV0dXJuIHsgdGV4dCwgY2FsbGJhY2tfZGF0YTogZGF0YSB9O1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBBZGRzIGEgbmV3IHdlYiBhcHAgYnV0dG9uLCBjb25mZXIgaHR0cHM6Ly9jb3JlLnRlbGVncmFtLm9yZy9ib3RzL3dlYmFwcHNcbiAgICAgKlxuICAgICAqIEBwYXJhbSB0ZXh0IFRoZSB0ZXh0IHRvIGRpc3BsYXlcbiAgICAgKiBAcGFyYW0gdXJsIEFuIEhUVFBTIFVSTCBvZiBhIFdlYiBBcHAgdG8gYmUgb3BlbmVkIHdpdGggYWRkaXRpb25hbCBkYXRhXG4gICAgICovXG4gICAgd2ViQXBwKHRleHQ6IHN0cmluZywgdXJsOiBzdHJpbmcpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuYWRkKElubGluZUtleWJvYXJkLndlYkFwcCh0ZXh0LCB1cmwpKTtcbiAgICB9XG4gICAgLyoqXG4gICAgICogQ3JlYXRlcyBhIG5ldyB3ZWIgYXBwIGJ1dHRvbiwgY29uZmVyIGh0dHBzOi8vY29yZS50ZWxlZ3JhbS5vcmcvYm90cy93ZWJhcHBzXG4gICAgICpcbiAgICAgKiBAcGFyYW0gdGV4dCBUaGUgdGV4dCB0byBkaXNwbGF5XG4gICAgICogQHBhcmFtIHVybCBBbiBIVFRQUyBVUkwgb2YgYSBXZWIgQXBwIHRvIGJlIG9wZW5lZCB3aXRoIGFkZGl0aW9uYWwgZGF0YVxuICAgICAqL1xuICAgIHN0YXRpYyB3ZWJBcHAoXG4gICAgICAgIHRleHQ6IHN0cmluZyxcbiAgICAgICAgdXJsOiBzdHJpbmcsXG4gICAgKTogSW5saW5lS2V5Ym9hcmRCdXR0b24uV2ViQXBwQnV0dG9uIHtcbiAgICAgICAgcmV0dXJuIHsgdGV4dCwgd2ViX2FwcDogeyB1cmwgfSB9O1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBBZGRzIGEgbmV3IGxvZ2luIGJ1dHRvbi4gVGhpcyBjYW4gYmUgdXNlZCBhcyBhIHJlcGxhY2VtZW50IGZvciB0aGVcbiAgICAgKiBUZWxlZ3JhbSBMb2dpbiBXaWRnZXQuIFlvdSBtdXN0IHNwZWNpZnkgYW4gSFRUUFMgVVJMIHVzZWQgdG9cbiAgICAgKiBhdXRvbWF0aWNhbGx5IGF1dGhvcml6ZSB0aGUgdXNlci5cbiAgICAgKlxuICAgICAqIEBwYXJhbSB0ZXh0IFRoZSB0ZXh0IHRvIGRpc3BsYXlcbiAgICAgKiBAcGFyYW0gbG9naW5VcmwgVGhlIGxvZ2luIFVSTCBhcyBzdHJpbmcgb3IgYExvZ2luVXJsYCBvYmplY3RcbiAgICAgKi9cbiAgICBsb2dpbih0ZXh0OiBzdHJpbmcsIGxvZ2luVXJsOiBzdHJpbmcgfCBMb2dpblVybCkge1xuICAgICAgICByZXR1cm4gdGhpcy5hZGQoSW5saW5lS2V5Ym9hcmQubG9naW4odGV4dCwgbG9naW5VcmwpKTtcbiAgICB9XG4gICAgLyoqXG4gICAgICogQ3JlYXRlcyBhIG5ldyBsb2dpbiBidXR0b24uIFRoaXMgY2FuIGJlIHVzZWQgYXMgYSByZXBsYWNlbWVudCBmb3IgdGhlXG4gICAgICogVGVsZWdyYW0gTG9naW4gV2lkZ2V0LiBZb3UgbXVzdCBzcGVjaWZ5IGFuIEhUVFBTIFVSTCB1c2VkIHRvXG4gICAgICogYXV0b21hdGljYWxseSBhdXRob3JpemUgdGhlIHVzZXIuXG4gICAgICpcbiAgICAgKiBAcGFyYW0gdGV4dCBUaGUgdGV4dCB0byBkaXNwbGF5XG4gICAgICogQHBhcmFtIGxvZ2luVXJsIFRoZSBsb2dpbiBVUkwgYXMgc3RyaW5nIG9yIGBMb2dpblVybGAgb2JqZWN0XG4gICAgICovXG4gICAgc3RhdGljIGxvZ2luKFxuICAgICAgICB0ZXh0OiBzdHJpbmcsXG4gICAgICAgIGxvZ2luVXJsOiBzdHJpbmcgfCBMb2dpblVybCxcbiAgICApOiBJbmxpbmVLZXlib2FyZEJ1dHRvbi5Mb2dpbkJ1dHRvbiB7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICB0ZXh0LFxuICAgICAgICAgICAgbG9naW5fdXJsOiB0eXBlb2YgbG9naW5VcmwgPT09IFwic3RyaW5nXCJcbiAgICAgICAgICAgICAgICA/IHsgdXJsOiBsb2dpblVybCB9XG4gICAgICAgICAgICAgICAgOiBsb2dpblVybCxcbiAgICAgICAgfTtcbiAgICB9XG4gICAgLyoqXG4gICAgICogQWRkcyBhIG5ldyBpbmxpbmUgcXVlcnkgYnV0dG9uLiBUZWxlZ3JhbSBjbGllbnRzIHdpbGwgbGV0IHRoZSB1c2VyIHBpY2sgYVxuICAgICAqIGNoYXQgd2hlbiB0aGlzIGJ1dHRvbiBpcyBwcmVzc2VkLiBUaGlzIHdpbGwgc3RhcnQgYW4gaW5saW5lIHF1ZXJ5LiBUaGVcbiAgICAgKiBzZWxlY3RlZCBjaGF0IHdpbGwgYmUgcHJlZmlsbGVkIHdpdGggdGhlIG5hbWUgb2YgeW91ciBib3QuIFlvdSBtYXlcbiAgICAgKiBwcm92aWRlIGEgdGV4dCB0aGF0IGlzIHNwZWNpZmllZCBhbG9uZyB3aXRoIGl0LlxuICAgICAqXG4gICAgICogWW91ciBib3Qgd2lsbCBpbiB0dXJuIHJlY2VpdmUgdXBkYXRlcyBmb3IgaW5saW5lIHF1ZXJpZXMuIFlvdSBjYW4gbGlzdGVuXG4gICAgICogdG8gaW5saW5lIHF1ZXJ5IHVwZGF0ZXMgbGlrZSB0aGlzOlxuICAgICAqIGBgYHRzXG4gICAgICogYm90Lm9uKCdpbmxpbmVfcXVlcnknLCBjdHggPT4geyAuLi4gfSlcbiAgICAgKiBgYGBcbiAgICAgKlxuICAgICAqIEBwYXJhbSB0ZXh0IFRoZSB0ZXh0IHRvIGRpc3BsYXlcbiAgICAgKiBAcGFyYW0gcXVlcnkgVGhlIChvcHRpb25hbCkgaW5saW5lIHF1ZXJ5IHN0cmluZyB0byBwcmVmaWxsXG4gICAgICovXG4gICAgc3dpdGNoSW5saW5lKHRleHQ6IHN0cmluZywgcXVlcnkgPSBcIlwiKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmFkZChJbmxpbmVLZXlib2FyZC5zd2l0Y2hJbmxpbmUodGV4dCwgcXVlcnkpKTtcbiAgICB9XG4gICAgLyoqXG4gICAgICogQ3JlYXRlcyBhIG5ldyBpbmxpbmUgcXVlcnkgYnV0dG9uLiBUZWxlZ3JhbSBjbGllbnRzIHdpbGwgbGV0IHRoZSB1c2VyIHBpY2sgYVxuICAgICAqIGNoYXQgd2hlbiB0aGlzIGJ1dHRvbiBpcyBwcmVzc2VkLiBUaGlzIHdpbGwgc3RhcnQgYW4gaW5saW5lIHF1ZXJ5LiBUaGVcbiAgICAgKiBzZWxlY3RlZCBjaGF0IHdpbGwgYmUgcHJlZmlsbGVkIHdpdGggdGhlIG5hbWUgb2YgeW91ciBib3QuIFlvdSBtYXlcbiAgICAgKiBwcm92aWRlIGEgdGV4dCB0aGF0IGlzIHNwZWNpZmllZCBhbG9uZyB3aXRoIGl0LlxuICAgICAqXG4gICAgICogWW91ciBib3Qgd2lsbCBpbiB0dXJuIHJlY2VpdmUgdXBkYXRlcyBmb3IgaW5saW5lIHF1ZXJpZXMuIFlvdSBjYW4gbGlzdGVuXG4gICAgICogdG8gaW5saW5lIHF1ZXJ5IHVwZGF0ZXMgbGlrZSB0aGlzOlxuICAgICAqIGBgYHRzXG4gICAgICogYm90Lm9uKCdpbmxpbmVfcXVlcnknLCBjdHggPT4geyAuLi4gfSlcbiAgICAgKiBgYGBcbiAgICAgKlxuICAgICAqIEBwYXJhbSB0ZXh0IFRoZSB0ZXh0IHRvIGRpc3BsYXlcbiAgICAgKiBAcGFyYW0gcXVlcnkgVGhlIChvcHRpb25hbCkgaW5saW5lIHF1ZXJ5IHN0cmluZyB0byBwcmVmaWxsXG4gICAgICovXG4gICAgc3RhdGljIHN3aXRjaElubGluZShcbiAgICAgICAgdGV4dDogc3RyaW5nLFxuICAgICAgICBxdWVyeSA9IFwiXCIsXG4gICAgKTogSW5saW5lS2V5Ym9hcmRCdXR0b24uU3dpdGNoSW5saW5lQnV0dG9uIHtcbiAgICAgICAgcmV0dXJuIHsgdGV4dCwgc3dpdGNoX2lubGluZV9xdWVyeTogcXVlcnkgfTtcbiAgICB9XG4gICAgLyoqXG4gICAgICogQWRkcyBhIG5ldyBpbmxpbmUgcXVlcnkgYnV0dG9uIHRoYXQgYWN0cyBvbiB0aGUgY3VycmVudCBjaGF0LiBUaGVcbiAgICAgKiBzZWxlY3RlZCBjaGF0IHdpbGwgYmUgcHJlZmlsbGVkIHdpdGggdGhlIG5hbWUgb2YgeW91ciBib3QuIFlvdSBtYXlcbiAgICAgKiBwcm92aWRlIGEgdGV4dCB0aGF0IGlzIHNwZWNpZmllZCBhbG9uZyB3aXRoIGl0LiBUaGlzIHdpbGwgc3RhcnQgYW4gaW5saW5lXG4gICAgICogcXVlcnkuXG4gICAgICpcbiAgICAgKiBZb3VyIGJvdCB3aWxsIGluIHR1cm4gcmVjZWl2ZSB1cGRhdGVzIGZvciBpbmxpbmUgcXVlcmllcy4gWW91IGNhbiBsaXN0ZW5cbiAgICAgKiB0byBpbmxpbmUgcXVlcnkgdXBkYXRlcyBsaWtlIHRoaXM6XG4gICAgICogYGBgdHNcbiAgICAgKiBib3Qub24oJ2lubGluZV9xdWVyeScsIGN0eCA9PiB7IC4uLiB9KVxuICAgICAqIGBgYFxuICAgICAqXG4gICAgICogQHBhcmFtIHRleHQgVGhlIHRleHQgdG8gZGlzcGxheVxuICAgICAqIEBwYXJhbSBxdWVyeSBUaGUgKG9wdGlvbmFsKSBpbmxpbmUgcXVlcnkgc3RyaW5nIHRvIHByZWZpbGxcbiAgICAgKi9cbiAgICBzd2l0Y2hJbmxpbmVDdXJyZW50KHRleHQ6IHN0cmluZywgcXVlcnkgPSBcIlwiKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmFkZChJbmxpbmVLZXlib2FyZC5zd2l0Y2hJbmxpbmVDdXJyZW50KHRleHQsIHF1ZXJ5KSk7XG4gICAgfVxuICAgIC8qKlxuICAgICAqIENyZWF0ZXMgYSBuZXcgaW5saW5lIHF1ZXJ5IGJ1dHRvbiB0aGF0IGFjdHMgb24gdGhlIGN1cnJlbnQgY2hhdC4gVGhlXG4gICAgICogc2VsZWN0ZWQgY2hhdCB3aWxsIGJlIHByZWZpbGxlZCB3aXRoIHRoZSBuYW1lIG9mIHlvdXIgYm90LiBZb3UgbWF5XG4gICAgICogcHJvdmlkZSBhIHRleHQgdGhhdCBpcyBzcGVjaWZpZWQgYWxvbmcgd2l0aCBpdC4gVGhpcyB3aWxsIHN0YXJ0IGFuIGlubGluZVxuICAgICAqIHF1ZXJ5LlxuICAgICAqXG4gICAgICogWW91ciBib3Qgd2lsbCBpbiB0dXJuIHJlY2VpdmUgdXBkYXRlcyBmb3IgaW5saW5lIHF1ZXJpZXMuIFlvdSBjYW4gbGlzdGVuXG4gICAgICogdG8gaW5saW5lIHF1ZXJ5IHVwZGF0ZXMgbGlrZSB0aGlzOlxuICAgICAqIGBgYHRzXG4gICAgICogYm90Lm9uKCdpbmxpbmVfcXVlcnknLCBjdHggPT4geyAuLi4gfSlcbiAgICAgKiBgYGBcbiAgICAgKlxuICAgICAqIEBwYXJhbSB0ZXh0IFRoZSB0ZXh0IHRvIGRpc3BsYXlcbiAgICAgKiBAcGFyYW0gcXVlcnkgVGhlIChvcHRpb25hbCkgaW5saW5lIHF1ZXJ5IHN0cmluZyB0byBwcmVmaWxsXG4gICAgICovXG4gICAgc3RhdGljIHN3aXRjaElubGluZUN1cnJlbnQoXG4gICAgICAgIHRleHQ6IHN0cmluZyxcbiAgICAgICAgcXVlcnkgPSBcIlwiLFxuICAgICk6IElubGluZUtleWJvYXJkQnV0dG9uLlN3aXRjaElubGluZUN1cnJlbnRDaGF0QnV0dG9uIHtcbiAgICAgICAgcmV0dXJuIHsgdGV4dCwgc3dpdGNoX2lubGluZV9xdWVyeV9jdXJyZW50X2NoYXQ6IHF1ZXJ5IH07XG4gICAgfVxuICAgIC8qKlxuICAgICAqIEFkZHMgYSBuZXcgaW5saW5lIHF1ZXJ5IGJ1dHRvbi4gVGVsZWdyYW0gY2xpZW50cyB3aWxsIGxldCB0aGUgdXNlciBwaWNrIGFcbiAgICAgKiBjaGF0IHdoZW4gdGhpcyBidXR0b24gaXMgcHJlc3NlZC4gVGhpcyB3aWxsIHN0YXJ0IGFuIGlubGluZSBxdWVyeS4gVGhlXG4gICAgICogc2VsZWN0ZWQgY2hhdCB3aWxsIGJlIHByZWZpbGxlZCB3aXRoIHRoZSBuYW1lIG9mIHlvdXIgYm90LiBZb3UgbWF5XG4gICAgICogcHJvdmlkZSBhIHRleHQgdGhhdCBpcyBzcGVjaWZpZWQgYWxvbmcgd2l0aCBpdC5cbiAgICAgKlxuICAgICAqIFlvdXIgYm90IHdpbGwgaW4gdHVybiByZWNlaXZlIHVwZGF0ZXMgZm9yIGlubGluZSBxdWVyaWVzLiBZb3UgY2FuIGxpc3RlblxuICAgICAqIHRvIGlubGluZSBxdWVyeSB1cGRhdGVzIGxpa2UgdGhpczpcbiAgICAgKiBgYGB0c1xuICAgICAqIGJvdC5vbignaW5saW5lX3F1ZXJ5JywgY3R4ID0+IHsgLi4uIH0pXG4gICAgICogYGBgXG4gICAgICpcbiAgICAgKiBAcGFyYW0gdGV4dCBUaGUgdGV4dCB0byBkaXNwbGF5XG4gICAgICogQHBhcmFtIHF1ZXJ5IFRoZSBxdWVyeSBvYmplY3QgZGVzY3JpYmluZyB3aGljaCBjaGF0cyBjYW4gYmUgcGlja2VkXG4gICAgICovXG4gICAgc3dpdGNoSW5saW5lQ2hvc2VuKFxuICAgICAgICB0ZXh0OiBzdHJpbmcsXG4gICAgICAgIHF1ZXJ5OiBTd2l0Y2hJbmxpbmVRdWVyeUNob3NlbkNoYXQgPSB7fSxcbiAgICApIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuYWRkKElubGluZUtleWJvYXJkLnN3aXRjaElubGluZUNob3Nlbih0ZXh0LCBxdWVyeSkpO1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBDcmVhdGVzIGEgbmV3IGlubGluZSBxdWVyeSBidXR0b24uIFRlbGVncmFtIGNsaWVudHMgd2lsbCBsZXQgdGhlIHVzZXIgcGljayBhXG4gICAgICogY2hhdCB3aGVuIHRoaXMgYnV0dG9uIGlzIHByZXNzZWQuIFRoaXMgd2lsbCBzdGFydCBhbiBpbmxpbmUgcXVlcnkuIFRoZVxuICAgICAqIHNlbGVjdGVkIGNoYXQgd2lsbCBiZSBwcmVmaWxsZWQgd2l0aCB0aGUgbmFtZSBvZiB5b3VyIGJvdC4gWW91IG1heVxuICAgICAqIHByb3ZpZGUgYSB0ZXh0IHRoYXQgaXMgc3BlY2lmaWVkIGFsb25nIHdpdGggaXQuXG4gICAgICpcbiAgICAgKiBZb3VyIGJvdCB3aWxsIGluIHR1cm4gcmVjZWl2ZSB1cGRhdGVzIGZvciBpbmxpbmUgcXVlcmllcy4gWW91IGNhbiBsaXN0ZW5cbiAgICAgKiB0byBpbmxpbmUgcXVlcnkgdXBkYXRlcyBsaWtlIHRoaXM6XG4gICAgICogYGBgdHNcbiAgICAgKiBib3Qub24oJ2lubGluZV9xdWVyeScsIGN0eCA9PiB7IC4uLiB9KVxuICAgICAqIGBgYFxuICAgICAqXG4gICAgICogQHBhcmFtIHRleHQgVGhlIHRleHQgdG8gZGlzcGxheVxuICAgICAqIEBwYXJhbSBxdWVyeSBUaGUgcXVlcnkgb2JqZWN0IGRlc2NyaWJpbmcgd2hpY2ggY2hhdHMgY2FuIGJlIHBpY2tlZFxuICAgICAqL1xuICAgIHN0YXRpYyBzd2l0Y2hJbmxpbmVDaG9zZW4oXG4gICAgICAgIHRleHQ6IHN0cmluZyxcbiAgICAgICAgcXVlcnk6IFN3aXRjaElubGluZVF1ZXJ5Q2hvc2VuQ2hhdCA9IHt9LFxuICAgICk6IElubGluZUtleWJvYXJkQnV0dG9uLlN3aXRjaElubGluZUNob3NlbkNoYXRCdXR0b24ge1xuICAgICAgICByZXR1cm4geyB0ZXh0LCBzd2l0Y2hfaW5saW5lX3F1ZXJ5X2Nob3Nlbl9jaGF0OiBxdWVyeSB9O1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBBZGRzIGEgbmV3IGdhbWUgcXVlcnkgYnV0dG9uLCBjb25mZXJcbiAgICAgKiBodHRwczovL2NvcmUudGVsZWdyYW0ub3JnL2JvdHMvYXBpI2dhbWVzXG4gICAgICpcbiAgICAgKiBUaGlzIHR5cGUgb2YgYnV0dG9uIG11c3QgYWx3YXlzIGJlIHRoZSBmaXJzdCBidXR0b24gaW4gdGhlIGZpcnN0IHJvdy5cbiAgICAgKlxuICAgICAqIEBwYXJhbSB0ZXh0IFRoZSB0ZXh0IHRvIGRpc3BsYXlcbiAgICAgKi9cbiAgICBnYW1lKHRleHQ6IHN0cmluZykge1xuICAgICAgICByZXR1cm4gdGhpcy5hZGQoSW5saW5lS2V5Ym9hcmQuZ2FtZSh0ZXh0KSk7XG4gICAgfVxuICAgIC8qKlxuICAgICAqIENyZWF0ZXMgYSBuZXcgZ2FtZSBxdWVyeSBidXR0b24sIGNvbmZlclxuICAgICAqIGh0dHBzOi8vY29yZS50ZWxlZ3JhbS5vcmcvYm90cy9hcGkjZ2FtZXNcbiAgICAgKlxuICAgICAqIFRoaXMgdHlwZSBvZiBidXR0b24gbXVzdCBhbHdheXMgYmUgdGhlIGZpcnN0IGJ1dHRvbiBpbiB0aGUgZmlyc3Qgcm93LlxuICAgICAqXG4gICAgICogQHBhcmFtIHRleHQgVGhlIHRleHQgdG8gZGlzcGxheVxuICAgICAqL1xuICAgIHN0YXRpYyBnYW1lKHRleHQ6IHN0cmluZyk6IElubGluZUtleWJvYXJkQnV0dG9uLkdhbWVCdXR0b24ge1xuICAgICAgICByZXR1cm4geyB0ZXh0LCBjYWxsYmFja19nYW1lOiB7fSB9O1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBBZGRzIGEgbmV3IHBheW1lbnQgYnV0dG9uLCBjb25mZXJcbiAgICAgKiBodHRwczovL2NvcmUudGVsZWdyYW0ub3JnL2JvdHMvYXBpI3BheW1lbnRzXG4gICAgICpcbiAgICAgKiBUaGlzIHR5cGUgb2YgYnV0dG9uIG11c3QgYWx3YXlzIGJlIHRoZSBmaXJzdCBidXR0b24gaW4gdGhlIGZpcnN0IHJvdyBhbmRcbiAgICAgKiBjYW4gb25seSBiZSB1c2VkIGluIGludm9pY2UgbWVzc2FnZXMuXG4gICAgICpcbiAgICAgKiBAcGFyYW0gdGV4dCBUaGUgdGV4dCB0byBkaXNwbGF5LiBTdWJzdHJpbmdzIOKAnOKtkOKAnSBhbmQg4oCcWFRS4oCdIGluIHRoZSBidXR0b25zJ3MgdGV4dCB3aWxsIGJlIHJlcGxhY2VkIHdpdGggYSBUZWxlZ3JhbSBTdGFyIGljb24uXG4gICAgICovXG4gICAgcGF5KHRleHQ6IHN0cmluZykge1xuICAgICAgICByZXR1cm4gdGhpcy5hZGQoSW5saW5lS2V5Ym9hcmQucGF5KHRleHQpKTtcbiAgICB9XG4gICAgLyoqXG4gICAgICogQ3JlYXRlIGEgbmV3IHBheW1lbnQgYnV0dG9uLCBjb25mZXJcbiAgICAgKiBodHRwczovL2NvcmUudGVsZWdyYW0ub3JnL2JvdHMvYXBpI3BheW1lbnRzXG4gICAgICpcbiAgICAgKiBUaGlzIHR5cGUgb2YgYnV0dG9uIG11c3QgYWx3YXlzIGJlIHRoZSBmaXJzdCBidXR0b24gaW4gdGhlIGZpcnN0IHJvdyBhbmRcbiAgICAgKiBjYW4gb25seSBiZSB1c2VkIGluIGludm9pY2UgbWVzc2FnZXMuXG4gICAgICpcbiAgICAgKiBAcGFyYW0gdGV4dCBUaGUgdGV4dCB0byBkaXNwbGF5LiBTdWJzdHJpbmdzIOKAnOKtkOKAnSBhbmQg4oCcWFRS4oCdIGluIHRoZSBidXR0b25zJ3MgdGV4dCB3aWxsIGJlIHJlcGxhY2VkIHdpdGggYSBUZWxlZ3JhbSBTdGFyIGljb24uXG4gICAgICovXG4gICAgc3RhdGljIHBheSh0ZXh0OiBzdHJpbmcpOiBJbmxpbmVLZXlib2FyZEJ1dHRvbi5QYXlCdXR0b24ge1xuICAgICAgICByZXR1cm4geyB0ZXh0LCBwYXk6IHRydWUgfTtcbiAgICB9XG4gICAgLyoqXG4gICAgICogQ3JlYXRlcyBhIG5ldyBpbmxpbmUga2V5Ym9hcmQgdGhhdCBjb250YWlucyB0aGUgdHJhbnNwb3NlZCBncmlkIG9mXG4gICAgICogYnV0dG9ucyBvZiB0aGlzIGlubGluZSBrZXlib2FyZC4gVGhpcyBtZWFucyB0aGF0IHRoZSByZXN1bHRpbmcgaW5saW5lXG4gICAgICoga2V5Ym9hcmQgaGFzIHRoZSByb3dzIGFuZCBjb2x1bW5zIGZsaXBwZWQuXG4gICAgICpcbiAgICAgKiBOb3RlIHRoYXQgaW5saW5lIGJ1dHRvbnMgY2FuIG9ubHkgc3BhbiBtdWx0aXBsZSBjb2x1bW5zLCBidXQgbmV2ZXJcbiAgICAgKiBtdWx0aXBsZSByb3dzLiBUaGlzIG1lYW5zIHRoYXQgaWYgdGhlIGdpdmVuIGFycmF5cyBoYXZlIGRpZmZlcmVudFxuICAgICAqIGxlbmd0aHMsIHNvbWUgYnV0dG9ucyBtaWdodCBmbG93IHVwIGluIHRoZSBsYXlvdXQuIEluIHRoZXNlIGNhc2VzLFxuICAgICAqIHRyYW5zcG9zaW5nIGFuIGlubGluZSBrZXlib2FyZCBhIHNlY29uZCB0aW1lIHdpbGwgbm90IHVuZG8gdGhlIGZpcnN0XG4gICAgICogdHJhbnNwb3NpdGlvbi5cbiAgICAgKlxuICAgICAqIEhlcmUgYXJlIHNvbWUgZXhhbXBsZXMuXG4gICAgICpcbiAgICAgKiBgYGBcbiAgICAgKiBvcmlnaW5hbCAgICB0cmFuc3Bvc2VkXG4gICAgICogWyAgYSAgXSAgfj4gWyAgYSAgXVxuICAgICAqXG4gICAgICogICAgICAgICAgICAgWyAgYSAgXVxuICAgICAqIFthIGIgY10gIH4+IFsgIGIgIF1cbiAgICAgKiAgICAgICAgICAgICBbICBjICBdXG4gICAgICpcbiAgICAgKiBbIGEgYiBdICAgICBbYSBjIGVdXG4gICAgICogWyBjIGQgXSAgfj4gWyBiIGQgXVxuICAgICAqIFsgIGUgIF1cbiAgICAgKlxuICAgICAqIFsgYSBiIF0gICAgIFthIGMgZF1cbiAgICAgKiBbICBjICBdICB+PiBbIGIgZSBdXG4gICAgICogW2QgZSBmXSAgICAgWyAgZiAgXVxuICAgICAqIGBgYFxuICAgICAqL1xuICAgIHRvVHJhbnNwb3NlZCgpIHtcbiAgICAgICAgY29uc3Qgb3JpZ2luYWwgPSB0aGlzLmlubGluZV9rZXlib2FyZDtcbiAgICAgICAgY29uc3QgdHJhbnNwb3NlZCA9IHRyYW5zcG9zZShvcmlnaW5hbCk7XG4gICAgICAgIHJldHVybiBuZXcgSW5saW5lS2V5Ym9hcmQodHJhbnNwb3NlZCk7XG4gICAgfVxuICAgIC8qKlxuICAgICAqIENyZWF0ZXMgYSBuZXcgaW5saW5lIGtleWJvYXJkIHdpdGggdGhlIHNhbWUgYnV0dG9ucyBidXQgcmVmbG93ZWQgaW50byBhXG4gICAgICogZ2l2ZW4gbnVtYmVyIG9mIGNvbHVtbnMgYXMgaWYgdGhlIGJ1dHRvbnMgd2VyZSB0ZXh0IGVsZW1lbnRzLiBPcHRpb25hbGx5LFxuICAgICAqIHlvdSBjYW4gc3BlY2lmeSBpZiB0aGUgZmxvdyBzaG91bGQgbWFrZSBzdXJlIHRvIGZpbGwgdXAgdGhlIGxhc3Qgcm93LlxuICAgICAqXG4gICAgICogVGhpcyBtZXRob2QgaXMgaWRlbXBvdGVudCwgc28gY2FsbGluZyBpdCBhIHNlY29uZCB0aW1lIHdpbGwgZWZmZWN0aXZlbHlcbiAgICAgKiBjbG9uZSB0aGlzIGlubGluZSBrZXlib2FyZCB3aXRob3V0IHJlb3JkZXJpbmcgdGhlIGJ1dHRvbnMuXG4gICAgICpcbiAgICAgKiBIZXJlIGFyZSBzb21lIGV4YW1wbGVzLlxuICAgICAqXG4gICAgICogYGBgXG4gICAgICogb3JpZ2luYWwgICAgZmxvd2VkXG4gICAgICogWyAgYSAgXSAgfj4gWyAgYSAgXSAgICAoNCBjb2x1bW5zKVxuICAgICAqXG4gICAgICogICAgICAgICAgICAgWyAgYSAgXVxuICAgICAqIFthIGIgY10gIH4+IFsgIGIgIF0gICAgKDEgY29sdW1uKVxuICAgICAqICAgICAgICAgICAgIFsgIGMgIF1cbiAgICAgKlxuICAgICAqIFsgYSBiIF0gICAgIFthIGIgY11cbiAgICAgKiBbIGMgZCBdICB+PiBbIGQgZSBdICAgICgzIGNvbHVtbnMpXG4gICAgICogWyAgZSAgXVxuICAgICAqXG4gICAgICogWyBhIGIgXSAgICAgW2FiY2RlXVxuICAgICAqIFsgIGMgIF0gIH4+IFsgIGYgIF0gICAgKDUgY29sdW1ucylcbiAgICAgKiBbZCBlIGZdXG4gICAgICpcbiAgICAgKiBbYSBiIGNdICAgICBbICBhICBdXG4gICAgICogW2QgZSBmXSAgfj4gW2IgYyBkXSAgICAoMyBjb2x1bXMsIHsgZmlsbExhc3RSb3c6IHRydWUgfSlcbiAgICAgKiBbZyBoIGldICAgICBbZSBmIGddXG4gICAgICogWyAgaiAgXSAgICAgW2ggaSBqXVxuICAgICAqIGBgYFxuICAgICAqXG4gICAgICogQHBhcmFtIGNvbHVtbnMgTWF4aW11bSBudW1iZXIgb2YgYnV0dG9ucyBwZXIgcm93XG4gICAgICogQHBhcmFtIG9wdGlvbnMgT3B0aW9uYWwgZmxvd2luZyBiZWhhdmlvclxuICAgICAqL1xuICAgIHRvRmxvd2VkKGNvbHVtbnM6IG51bWJlciwgb3B0aW9uczogRmxvd09wdGlvbnMgPSB7fSkge1xuICAgICAgICBjb25zdCBvcmlnaW5hbCA9IHRoaXMuaW5saW5lX2tleWJvYXJkO1xuICAgICAgICBjb25zdCBmbG93ZWQgPSByZWZsb3cob3JpZ2luYWwsIGNvbHVtbnMsIG9wdGlvbnMpO1xuICAgICAgICByZXR1cm4gbmV3IElubGluZUtleWJvYXJkKGZsb3dlZCk7XG4gICAgfVxuICAgIC8qKlxuICAgICAqIENyZWF0ZXMgYW5kIHJldHVybnMgYSBkZWVwIGNvcHkgb2YgdGhpcyBpbmxpbmUga2V5Ym9hcmQuXG4gICAgICovXG4gICAgY2xvbmUoKSB7XG4gICAgICAgIHJldHVybiBuZXcgSW5saW5lS2V5Ym9hcmQoXG4gICAgICAgICAgICB0aGlzLmlubGluZV9rZXlib2FyZC5tYXAoKHJvdykgPT4gcm93LnNsaWNlKCkpLFxuICAgICAgICApO1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBBcHBlbmRzIHRoZSBidXR0b25zIG9mIHRoZSBnaXZlbiBpbmxpbmUga2V5Ym9hcmRzIHRvIHRoaXMga2V5Ym9hcmQuXG4gICAgICpcbiAgICAgKiBAcGFyYW0gc291cmNlcyBBIG51bWJlciBvZiBpbmxpbmUga2V5Ym9hcmRzIHRvIGFwcGVuZFxuICAgICAqL1xuICAgIGFwcGVuZCguLi5zb3VyY2VzOiBJbmxpbmVLZXlib2FyZFNvdXJjZVtdKSB7XG4gICAgICAgIGZvciAoY29uc3Qgc291cmNlIG9mIHNvdXJjZXMpIHtcbiAgICAgICAgICAgIGNvbnN0IGtleWJvYXJkID0gSW5saW5lS2V5Ym9hcmQuZnJvbShzb3VyY2UpO1xuICAgICAgICAgICAgdGhpcy5pbmxpbmVfa2V5Ym9hcmQucHVzaChcbiAgICAgICAgICAgICAgICAuLi5rZXlib2FyZC5pbmxpbmVfa2V5Ym9hcmQubWFwKChyb3cpID0+IHJvdy5zbGljZSgpKSxcbiAgICAgICAgICAgICk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuICAgIC8qKlxuICAgICAqIFR1cm5zIGEgdHdvLWRpbWVuc2lvbmFsIGlubGluZSBidXR0b24gYXJyYXkgaW50byBhbiBpbmxpbmUga2V5Ym9hcmRcbiAgICAgKiBpbnN0YW5jZS4gWW91IGNhbiB1c2UgdGhlIHN0YXRpYyBidXR0b24gYnVpbGRlciBtZXRob2RzIHRvIGNyZWF0ZSBpbmxpbmVcbiAgICAgKiBidXR0b24gb2JqZWN0cy5cbiAgICAgKlxuICAgICAqIEBwYXJhbSBzb3VyY2UgQSB0d28tZGltZW5zaW9uYWwgaW5saW5lIGJ1dHRvbiBhcnJheVxuICAgICAqL1xuICAgIHN0YXRpYyBmcm9tKHNvdXJjZTogSW5saW5lS2V5Ym9hcmRTb3VyY2UpOiBJbmxpbmVLZXlib2FyZCB7XG4gICAgICAgIGlmIChzb3VyY2UgaW5zdGFuY2VvZiBJbmxpbmVLZXlib2FyZCkgcmV0dXJuIHNvdXJjZS5jbG9uZSgpO1xuICAgICAgICByZXR1cm4gbmV3IElubGluZUtleWJvYXJkKHNvdXJjZS5tYXAoKHJvdykgPT4gcm93LnNsaWNlKCkpKTtcbiAgICB9XG59XG5cbmZ1bmN0aW9uIHRyYW5zcG9zZTxUPihncmlkOiBUW11bXSk6IFRbXVtdIHtcbiAgICBjb25zdCB0cmFuc3Bvc2VkOiBUW11bXSA9IFtdO1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgZ3JpZC5sZW5ndGg7IGkrKykge1xuICAgICAgICBjb25zdCByb3cgPSBncmlkW2ldO1xuICAgICAgICBmb3IgKGxldCBqID0gMDsgaiA8IHJvdy5sZW5ndGg7IGorKykge1xuICAgICAgICAgICAgY29uc3QgYnV0dG9uID0gcm93W2pdO1xuICAgICAgICAgICAgKHRyYW5zcG9zZWRbal0gPz89IFtdKS5wdXNoKGJ1dHRvbik7XG4gICAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHRyYW5zcG9zZWQ7XG59XG5pbnRlcmZhY2UgRmxvd09wdGlvbnMge1xuICAgIC8qKiBTZXQgdG8gYHRydWVgIHRvIGNvbXBsZXRlbHkgZmlsbCB1cCB0aGUgbGFzdCByb3cgKi9cbiAgICBmaWxsTGFzdFJvdz86IGJvb2xlYW47XG59XG5mdW5jdGlvbiByZWZsb3c8VD4oXG4gICAgZ3JpZDogVFtdW10sXG4gICAgY29sdW1uczogbnVtYmVyLFxuICAgIHsgZmlsbExhc3RSb3cgPSBmYWxzZSB9OiBGbG93T3B0aW9ucyxcbik6IFRbXVtdIHtcbiAgICBsZXQgZmlyc3QgPSBjb2x1bW5zO1xuICAgIGlmIChmaWxsTGFzdFJvdykge1xuICAgICAgICBjb25zdCBidXR0b25Db3VudCA9IGdyaWRcbiAgICAgICAgICAgIC5tYXAoKHJvdykgPT4gcm93Lmxlbmd0aClcbiAgICAgICAgICAgIC5yZWR1Y2UoKGEsIGIpID0+IGEgKyBiLCAwKTtcbiAgICAgICAgZmlyc3QgPSBidXR0b25Db3VudCAlIGNvbHVtbnM7XG4gICAgfVxuICAgIGNvbnN0IHJlZmxvd2VkOiBUW11bXSA9IFtdO1xuICAgIGZvciAoY29uc3Qgcm93IG9mIGdyaWQpIHtcbiAgICAgICAgZm9yIChjb25zdCBidXR0b24gb2Ygcm93KSB7XG4gICAgICAgICAgICBjb25zdCBhdCA9IE1hdGgubWF4KDAsIHJlZmxvd2VkLmxlbmd0aCAtIDEpO1xuICAgICAgICAgICAgY29uc3QgbWF4ID0gYXQgPT09IDAgPyBmaXJzdCA6IGNvbHVtbnM7XG4gICAgICAgICAgICBsZXQgbmV4dCA9IChyZWZsb3dlZFthdF0gPz89IFtdKTtcbiAgICAgICAgICAgIGlmIChuZXh0Lmxlbmd0aCA9PT0gbWF4KSB7XG4gICAgICAgICAgICAgICAgbmV4dCA9IFtdO1xuICAgICAgICAgICAgICAgIHJlZmxvd2VkLnB1c2gobmV4dCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBuZXh0LnB1c2goYnV0dG9uKTtcbiAgICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gcmVmbG93ZWQ7XG59XG4iXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBWUE7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0NBc0NDLEdBQ0QsT0FBTyxNQUFNO0lBa0NtQjtJQWpDNUI7Ozs7S0FJQyxHQUNELEFBQU8sY0FBd0I7SUFDL0I7OztLQUdDLEdBQ0QsQUFBTyxVQUFvQjtJQUMzQjs7S0FFQyxHQUNELEFBQU8sa0JBQTRCO0lBQ25DOzs7S0FHQyxHQUNELEFBQU8sZ0JBQTBCO0lBQ2pDOztLQUVDLEdBQ0QsQUFBTyx3QkFBaUM7SUFFeEM7Ozs7Ozs7S0FPQyxHQUNELFlBQTRCLFdBQStCO1FBQUMsRUFBRTtL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