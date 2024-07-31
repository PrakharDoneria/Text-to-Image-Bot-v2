import { debug as d } from "../platform.deno.ts";
const debug = d("grammy:session");
/**
 * Session middleware provides a persistent data storage for your bot. You can
 * use it to let your bot remember any data you want, for example the messages
 * it sent or received in the past. This is done by attaching _session data_ to
 * every chat. The stored data is then provided on the context object under
 * `ctx.session`.
 *
 * > **What is a session?** Simply put, the session of a chat is a little
 * > persistent storage that is attached to it. As an example, your bot can send
 * > a message to a chat and store the identifier of that message in the
 * > corresponding session. The next time your bot receives an update from that
 * > chat, the session will still contain that ID.
 * >
 * > Session data can be stored in a database, in a file, or simply in memory.
 * > grammY only supports memory sessions out of the box, but you can use
 * > third-party session middleware to connect to other storage solutions. Note
 * > that memory sessions will be lost when you stop your bot and the process
 * > exits, so they are usually not useful in production.
 *
 * Whenever your bot receives an update, the first thing the session middleware
 * will do is to load the correct session from your storage solution. This
 * object is then provided on `ctx.session` while your other middleware is
 * running. As soon as your bot is done handling the update, the middleware
 * takes over again and writes back the session object to your storage. This
 * allows you to modify the session object arbitrarily in your middleware, and
 * to stop worrying about the database.
 *
 * ```ts
 * bot.use(session())
 *
 * bot.on('message', ctx => {
 *   // The session object is persisted across updates!
 *   const session = ctx.session
 * })
 * ```
 *
 * It is recommended to make use of the `initial` option in the configuration
 * object, which correctly initializes session objects for new chats.
 *
 * You can delete the session data by setting `ctx.session` to `null` or
 * `undefined`.
 *
 * Check out the [documentation](https://grammy.dev/plugins/session.html) on the
 * website to know more about how sessions work in grammY.
 *
 * @param options Optional configuration to pass to the session middleware
 */ export function session(options = {}) {
    return options.type === "multi" ? strictMultiSession(options) : strictSingleSession(options);
}
function strictSingleSession(options) {
    const { initial , storage , getSessionKey , custom  } = fillDefaults(options);
    return async (ctx, next)=>{
        const propSession = new PropertySession(storage, ctx, "session", initial);
        const key = await getSessionKey(ctx);
        await propSession.init(key, {
            custom,
            lazy: false
        });
        await next(); // no catch: do not write back if middleware throws
        await propSession.finish();
    };
}
function strictMultiSession(options) {
    const props = Object.keys(options).filter((k)=>k !== "type");
    const defaults = Object.fromEntries(props.map((prop)=>[
            prop,
            fillDefaults(options[prop])
        ]));
    return async (ctx, next)=>{
        ctx.session = {};
        const propSessions = await Promise.all(props.map(async (prop)=>{
            const { initial , storage , getSessionKey , custom  } = defaults[prop];
            const s = new PropertySession(// @ts-expect-error cannot express that the storage works for a concrete prop
            storage, ctx.session, prop, initial);
            const key = await getSessionKey(ctx);
            await s.init(key, {
                custom,
                lazy: false
            });
            return s;
        }));
        await next(); // no catch: do not write back if middleware throws
        if (ctx.session == null) propSessions.forEach((s)=>s.delete());
        await Promise.all(propSessions.map((s)=>s.finish()));
    };
}
/**
 * > This is an advanced function of grammY.
 *
 * Generally speaking, lazy sessions work just like normal sessions—just they
 * are loaded on demand. Except for a few `async`s and `await`s here and there,
 * their usage looks 100 % identical.
 *
 * Instead of directly querying the storage every time an update arrives, lazy
 * sessions quickly do this _once you access_ `ctx.session`. This can
 * significantly reduce the database traffic (especially when your bot is added
 * to group chats), because it skips a read and a wrote operation for all
 * updates that the bot does not react to.
 *
 * ```ts
 * // The options are identical
 * bot.use(lazySession({ storage: ... }))
 *
 * bot.on('message', async ctx => {
 *   // The session object is persisted across updates!
 *   const session = await ctx.session
 *   //                        ^
 *   //                        |
 *   //                       This plain property access (no function call) will trigger the database query!
 * })
 * ```
 *
 * Check out the
 * [documentation](https://grammy.dev/plugins/session.html#lazy-sessions) on the
 * website to know more about how lazy sessions work in grammY.
 *
 * @param options Optional configuration to pass to the session middleware
 */ export function lazySession(options = {}) {
    if (options.type !== undefined && options.type !== "single") {
        throw new Error("Cannot use lazy multi sessions!");
    }
    const { initial , storage , getSessionKey , custom  } = fillDefaults(options);
    return async (ctx, next)=>{
        const propSession = new PropertySession(// @ts-expect-error suppress promise nature of values
        storage, ctx, "session", initial);
        const key = await getSessionKey(ctx);
        await propSession.init(key, {
            custom,
            lazy: true
        });
        await next(); // no catch: do not write back if middleware throws
        await propSession.finish();
    };
}
/**
 * Internal class that manages a single property on the session. Can be used
 * both in a strict and a lazy way. Works by using `Object.defineProperty` to
 * install `O[P]`.
 */ // deno-lint-ignore ban-types
class PropertySession {
    storage;
    obj;
    prop;
    initial;
    key;
    value;
    promise;
    fetching;
    read;
    wrote;
    constructor(storage, obj, prop, initial){
        this.storage = storage;
        this.obj = obj;
        this.prop = prop;
        this.initial = initial;
        this.fetching = false;
        this.read = false;
        this.wrote = false;
    }
    /** Performs a read op and stores the result in `this.value` */ load() {
        if (this.key === undefined) {
            // No session key provided, cannot load
            return;
        }
        if (this.wrote) {
            // Value was set, no need to load
            return;
        }
        // Perform read op if not cached
        if (this.promise === undefined) {
            this.fetching = true;
            this.promise = Promise.resolve(this.storage.read(this.key)).then((val)=>{
                this.fetching = false;
                // Check for write op in the meantime
                if (this.wrote) {
                    // Discard read op
                    return this.value;
                }
                // Store received value in `this.value`
                if (val !== undefined) {
                    this.value = val;
                    return val;
                }
                // No value, need to initialize
                val = this.initial?.();
                if (val !== undefined) {
                    // Wrote initial value
                    this.wrote = true;
                    this.value = val;
                }
                return val;
            });
        }
        return this.promise;
    }
    async init(key, opts) {
        this.key = key;
        if (!opts.lazy) await this.load();
        Object.defineProperty(this.obj, this.prop, {
            enumerable: true,
            get: ()=>{
                if (key === undefined) {
                    const msg = undef("access", opts);
                    throw new Error(msg);
                }
                this.read = true;
                if (!opts.lazy || this.wrote) return this.value;
                this.load();
                return this.fetching ? this.promise : this.value;
            },
            set: (v)=>{
                if (key === undefined) {
                    const msg = undef("assign", opts);
                    throw new Error(msg);
                }
                this.wrote = true;
                this.fetching = false;
                this.value = v;
            }
        });
    }
    delete() {
        Object.assign(this.obj, {
            [this.prop]: undefined
        });
    }
    async finish() {
        if (this.key !== undefined) {
            if (this.read) await this.load();
            if (this.read || this.wrote) {
                const value = await this.value;
                if (value == null) await this.storage.delete(this.key);
                else await this.storage.write(this.key, value);
            }
        }
    }
}
function fillDefaults(opts = {}) {
    let { getSessionKey =defaultGetSessionKey , initial , storage  } = opts;
    if (storage == null) {
        debug("Storing session data in memory, all data will be lost when the bot restarts.");
        storage = new MemorySessionStorage();
    }
    const custom = getSessionKey !== defaultGetSessionKey;
    return {
        initial,
        storage,
        getSessionKey,
        custom
    };
}
/** Stores session data per chat by default */ function defaultGetSessionKey(ctx) {
    return ctx.chatId?.toString();
}
/** Returns a useful error message for when the session key is undefined */ function undef(op, opts) {
    const { lazy =false , custom  } = opts;
    const reason = custom ? "the custom `getSessionKey` function returned undefined for this update" : "this update does not belong to a chat, so the session key is undefined";
    return `Cannot ${op} ${lazy ? "lazy " : ""}session data because ${reason}!`;
}
function isEnhance(value) {
    return value === undefined || typeof value === "object" && value !== null && "__d" in value;
}
/**
 * You can use this function to transform an existing storage adapter, and add
 * more features to it. Currently, you can add session migrations and expiry
 * dates.
 *
 * You can use this function like so:
 * ```ts
 * const storage = ... // define your storage adapter
 * const enhanced = enhanceStorage({ storage, millisecondsToLive: 500 })
 * bot.use(session({ storage: enhanced }))
 * ```
 *
 * @param options Session enhancing options
 * @returns The enhanced storage adapter
 */ export function enhanceStorage(options) {
    let { storage , millisecondsToLive , migrations  } = options;
    storage = compatStorage(storage);
    if (millisecondsToLive !== undefined) {
        storage = timeoutStorage(storage, millisecondsToLive);
    }
    if (migrations !== undefined) {
        storage = migrationStorage(storage, migrations);
    }
    return wrapStorage(storage);
}
function compatStorage(storage) {
    return {
        read: async (k)=>{
            const v = await storage.read(k);
            return isEnhance(v) ? v : {
                __d: v
            };
        },
        write: (k, v)=>storage.write(k, v),
        delete: (k)=>storage.delete(k)
    };
}
function timeoutStorage(storage, millisecondsToLive) {
    const ttlStorage = {
        read: async (k)=>{
            const value = await storage.read(k);
            if (value === undefined) return undefined;
            if (value.e === undefined) {
                await ttlStorage.write(k, value);
                return value;
            }
            if (value.e < Date.now()) {
                await ttlStorage.delete(k);
                return undefined;
            }
            return value;
        },
        write: async (k, v)=>{
            v.e = addExpiryDate(v, millisecondsToLive).expires;
            await storage.write(k, v);
        },
        delete: (k)=>storage.delete(k)
    };
    return ttlStorage;
}
function migrationStorage(storage, migrations) {
    const versions = Object.keys(migrations).map((v)=>parseInt(v)).sort((a, b)=>a - b);
    const count = versions.length;
    if (count === 0) throw new Error("No migrations given!");
    const earliest = versions[0];
    const last = count - 1;
    const latest = versions[last];
    const index = new Map();
    versions.forEach((v, i)=>index.set(v, i)); // inverse array lookup
    function nextAfter(current) {
        // TODO: use `findLastIndex` with Node 18
        let i = last;
        while(current <= versions[i])i--;
        return i;
    // return versions.findLastIndex((v) => v < current)
    }
    return {
        read: async (k)=>{
            const val = await storage.read(k);
            if (val === undefined) return val;
            let { __d: value , v: current = earliest - 1  } = val;
            let i = 1 + (index.get(current) ?? nextAfter(current));
            for(; i < count; i++)value = migrations[versions[i]](value);
            return {
                ...val,
                v: latest,
                __d: value
            };
        },
        write: (k, v)=>storage.write(k, {
                v: latest,
                ...v
            }),
        delete: (k)=>storage.delete(k)
    };
}
function wrapStorage(storage) {
    return {
        read: (k)=>Promise.resolve(storage.read(k)).then((v)=>v?.__d),
        write: (k, v)=>storage.write(k, {
                __d: v
            }),
        delete: (k)=>storage.delete(k)
    };
}
// === Memory storage adapter
/**
 * The memory session storage is a built-in storage adapter that saves your
 * session data in RAM using a regular JavaScript `Map` object. If you use this
 * storage adapter, all sessions will be lost when your process terminates or
 * restarts. Hence, you should only use it for short-lived data that is not
 * important to persist.
 *
 * This class is used as default if you do not provide a storage adapter, e.g.
 * to your database.
 *
 * This storage adapter features expiring sessions. When instantiating this class
 * yourself, you can pass a time to live in milliseconds that will be used for
 * each session object. If a session for a user expired, the session data will
 * be discarded on its first read, and a fresh session object as returned by the
 * `initial` option (or undefined) will be put into place.
 */ export class MemorySessionStorage {
    timeToLive;
    /**
     * Internally used `Map` instance that stores the session data
     */ storage;
    /**
     * Constructs a new memory session storage with the given time to live. Note
     * that this storage adapter will not store your data permanently.
     *
     * @param timeToLive TTL in milliseconds, default is `Infinity`
     */ constructor(timeToLive){
        this.timeToLive = timeToLive;
        this.storage = new Map();
    }
    read(key) {
        const value = this.storage.get(key);
        if (value === undefined) return undefined;
        if (value.expires !== undefined && value.expires < Date.now()) {
            this.delete(key);
            return undefined;
        }
        return value.session;
    }
    /**
     * @deprecated Use {@link readAllValues} instead
     */ readAll() {
        return this.readAllValues();
    }
    readAllKeys() {
        return Array.from(this.storage.keys());
    }
    readAllValues() {
        return Array.from(this.storage.keys()).map((key)=>this.read(key)).filter((value)=>value !== undefined);
    }
    readAllEntries() {
        return Array.from(this.storage.keys()).map((key)=>[
                key,
                this.read(key)
            ]).filter((pair)=>pair[1] !== undefined);
    }
    has(key) {
        return this.storage.has(key);
    }
    write(key, value) {
        this.storage.set(key, addExpiryDate(value, this.timeToLive));
    }
    delete(key) {
        this.storage.delete(key);
    }
}
function addExpiryDate(value, ttl) {
    if (ttl !== undefined && ttl < Infinity) {
        const now = Date.now();
        return {
            session: value,
            expires: now + ttl
        };
    } else {
        return {
            session: value
        };
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vZGVuby5sYW5kL3gvZ3JhbW15QHYxLjI3LjAvY29udmVuaWVuY2Uvc2Vzc2lvbi50cyJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyB0eXBlIE1pZGRsZXdhcmVGbiB9IGZyb20gXCIuLi9jb21wb3Nlci50c1wiO1xuaW1wb3J0IHsgdHlwZSBDb250ZXh0IH0gZnJvbSBcIi4uL2NvbnRleHQudHNcIjtcbmltcG9ydCB7IGRlYnVnIGFzIGQgfSBmcm9tIFwiLi4vcGxhdGZvcm0uZGVuby50c1wiO1xuY29uc3QgZGVidWcgPSBkKFwiZ3JhbW15OnNlc3Npb25cIik7XG5cbnR5cGUgTWF5YmVQcm9taXNlPFQ+ID0gUHJvbWlzZTxUPiB8IFQ7XG5cbi8vID09PSBNYWluIHNlc3Npb24gcGx1Z2luXG4vKipcbiAqIEEgc2Vzc2lvbiBmbGF2b3IgaXMgYSBjb250ZXh0IGZsYXZvciB0aGF0IGhvbGRzIHNlc3Npb24gZGF0YSB1bmRlclxuICogYGN0eC5zZXNzaW9uYC5cbiAqXG4gKiBTZXNzaW9uIG1pZGRsZXdhcmUgd2lsbCBsb2FkIHRoZSBzZXNzaW9uIGRhdGEgb2YgYSBzcGVjaWZpYyBjaGF0IGZyb20geW91clxuICogc3RvcmFnZSBzb2x1dGlvbiwgYW5kIG1ha2UgaXQgYXZhaWxhYmxlIHRvIHlvdSBvbiB0aGUgY29udGV4dCBvYmplY3QuIENoZWNrXG4gKiBvdXQgdGhlXG4gKiBbZG9jdW1lbnRhdGlvbl0oaHR0cHM6Ly9kb2MuZGVuby5sYW5kL2h0dHBzOi8vZGVuby5sYW5kL3gvZ3JhbW15L21vZC50cy9+L3Nlc3Npb24pXG4gKiBvbiBzZXNzaW9uIG1pZGRsZXdhcmUgdG8ga25vdyBtb3JlLCBhbmQgcmVhZCB0aGUgc2VjdGlvbiBhYm91dCBzZXNzaW9ucyBvblxuICogdGhlIFt3ZWJzaXRlXShodHRwczovL2dyYW1teS5kZXYvcGx1Z2lucy9zZXNzaW9uLmh0bWwpLlxuICovXG5leHBvcnQgaW50ZXJmYWNlIFNlc3Npb25GbGF2b3I8Uz4ge1xuICAgIC8qKlxuICAgICAqIFNlc3Npb24gZGF0YSBvbiB0aGUgY29udGV4dCBvYmplY3QuXG4gICAgICpcbiAgICAgKiAqKldBUk5JTkc6KiogWW91IGhhdmUgdG8gbWFrZSBzdXJlIHRoYXQgeW91ciBzZXNzaW9uIGRhdGEgaXMgbm90XG4gICAgICogdW5kZWZpbmVkIGJ5IF9wcm92aWRpbmcgYW4gaW5pdGlhbCB2YWx1ZSB0byB0aGUgc2Vzc2lvbiBtaWRkbGV3YXJlXywgb3IgYnlcbiAgICAgKiBtYWtpbmcgc3VyZSB0aGF0IGBjdHguc2Vzc2lvbmAgaXMgYXNzaWduZWQgaWYgaXQgaXMgZW1wdHkhIFRoZSB0eXBlXG4gICAgICogc3lzdGVtIGRvZXMgbm90IGluY2x1ZGUgYHwgdW5kZWZpbmVkYCBiZWNhdXNlIHRoaXMgaXMgcmVhbGx5IGFubm95aW5nIHRvXG4gICAgICogd29yayB3aXRoLlxuICAgICAqXG4gICAgICogIEFjY2Vzc2luZyBgY3R4LnNlc3Npb25gIGJ5IHJlYWRpbmcgb3Igd3JpdGluZyB3aWxsIHRocm93IGlmXG4gICAgICogYGdldFNlc3Npb25LZXkoY3R4KSA9PT0gdW5kZWZpbmVkYCBmb3IgdGhlIHJlc3BlY3RpdmUgY29udGV4dCBvYmplY3RcbiAgICAgKiBgY3R4YC5cbiAgICAgKi9cbiAgICBnZXQgc2Vzc2lvbigpOiBTO1xuICAgIHNldCBzZXNzaW9uKHNlc3Npb246IFMgfCBudWxsIHwgdW5kZWZpbmVkKTtcbn1cbi8qKlxuICogQSBsYXp5IHNlc3Npb24gZmxhdm9yIGlzIGEgY29udGV4dCBmbGF2b3IgdGhhdCBob2xkcyBhIHByb21pc2Ugb2Ygc29tZVxuICogc2Vzc2lvbiBkYXRhIHVuZGVyIGBjdHguc2Vzc2lvbmAuXG4gKlxuICogTGF6eSBzZXNzaW9uIG1pZGRsZXdhcmUgd2lsbCBwcm92aWRlIHRoaXMgcHJvbWlzZSBsYXppbHkgb24gdGhlIGNvbnRleHRcbiAqIG9iamVjdC4gT25jZSB5b3UgYWNjZXNzIGBjdHguc2Vzc2lvbmAsIHRoZSBzdG9yYWdlIHdpbGwgYmUgcXVlcmllZCBhbmQgdGhlXG4gKiBzZXNzaW9uIGRhdGEgYmVjb21lcyBhdmFpbGFibGUuIElmIHlvdSBhY2Nlc3MgYGN0eC5zZXNzaW9uYCBhZ2FpbiBmb3IgdGhlXG4gKiBzYW1lIGNvbnRleHQgb2JqZWN0LCB0aGUgY2FjaGVkIHZhbHVlIHdpbGwgYmUgdXNlZC4gQ2hlY2sgb3V0IHRoZVxuICogW2RvY3VtZW50YXRpb25dKGh0dHBzOi8vZG9jLmRlbm8ubGFuZC9odHRwczovL2Rlbm8ubGFuZC94L2dyYW1teS9tb2QudHMvfi9sYXp5U2Vzc2lvbilcbiAqIG9uIGxhenkgc2Vzc2lvbiBtaWRkbGV3YXJlIHRvIGtub3cgbW9yZSwgYW5kIHJlYWQgdGhlIHNlY3Rpb24gYWJvdXQgbGF6eVxuICogc2Vzc2lvbnMgb24gdGhlXG4gKiBbd2Vic2l0ZV0oaHR0cHM6Ly9ncmFtbXkuZGV2L3BsdWdpbnMvc2Vzc2lvbi5odG1sI2xhenktc2Vzc2lvbnMpLlxuICovXG5leHBvcnQgaW50ZXJmYWNlIExhenlTZXNzaW9uRmxhdm9yPFM+IHtcbiAgICAvKipcbiAgICAgKiBTZXNzaW9uIGRhdGEgb24gdGhlIGNvbnRleHQgb2JqZWN0LCBwb3RlbnRpYWxseSBhIHByb21pc2UuXG4gICAgICpcbiAgICAgKiAqKldBUk5JTkc6KiogWW91IGhhdmUgdG8gbWFrZSBzdXJlIHRoYXQgeW91ciBzZXNzaW9uIGRhdGEgaXMgbm90XG4gICAgICogdW5kZWZpbmVkIGJ5IF9wcm92aWRpbmcgYSBkZWZhdWx0IHZhbHVlIHRvIHRoZSBzZXNzaW9uIG1pZGRsZXdhcmVfLCBvciBieVxuICAgICAqIG1ha2luZyBzdXJlIHRoYXQgYGN0eC5zZXNzaW9uYCBpcyBhc3NpZ25lZCBpZiBpdCBpcyBlbXB0eSEgVGhlIHR5cGVcbiAgICAgKiBzeXN0ZW0gZG9lcyBub3QgaW5jbHVkZSBgfCB1bmRlZmluZWRgIGJlY2F1c2UgdGhpcyBpcyByZWFsbHkgYW5ub3lpbmcgdG9cbiAgICAgKiB3b3JrIHdpdGguXG4gICAgICpcbiAgICAgKiBBY2Nlc3NpbmcgYGN0eC5zZXNzaW9uYCBieSByZWFkaW5nIG9yIHdyaXRpbmcgd2lsbCB0aHJvdyBpZmZcbiAgICAgKiBgZ2V0U2Vzc2lvbktleShjdHgpID09PSB1bmRlZmluZWRgIGhvbGRzIGZvciB0aGUgcmVzcGVjdGl2ZSBjb250ZXh0XG4gICAgICogb2JqZWN0IGBjdHhgLlxuICAgICAqL1xuICAgIGdldCBzZXNzaW9uKCk6IE1heWJlUHJvbWlzZTxTPjtcbiAgICBzZXQgc2Vzc2lvbihzZXNzaW9uOiBNYXliZVByb21pc2U8UyB8IG51bGwgfCB1bmRlZmluZWQ+KTtcbn1cblxuLyoqXG4gKiBBIHN0b3JhZ2UgYWRhcHRlciBpcyBhbiBhYnN0cmFjdGlvbiB0aGF0IHByb3ZpZGVzIHJlYWQsIHdyaXRlLCBhbmQgZGVsZXRlXG4gKiBhY2Nlc3MgdG8gYSBzdG9yYWdlIHNvbHV0aW9uIG9mIGFueSBraW5kLiBTdG9yYWdlIGFkYXB0ZXJzIGFyZSB1c2VkIHRvIGtlZXBcbiAqIHNlc3Npb24gbWlkZGxld2FyZSBpbmRlcGVuZGVudCBvZiB5b3VyIGRhdGFiYXNlIHByb3ZpZGVyLCBhbmQgdGhleSBhbGxvdyB5b3VcbiAqIHRvIHBhc3MgeW91ciBvd24gc3RvcmFnZSBzb2x1dGlvbi5cbiAqL1xuZXhwb3J0IGludGVyZmFjZSBTdG9yYWdlQWRhcHRlcjxUPiB7XG4gICAgLyoqXG4gICAgICogUmVhZHMgYSB2YWx1ZSBmb3IgdGhlIGdpdmVuIGtleSBmcm9tIHRoZSBzdG9yYWdlLiBNYXkgcmV0dXJuIHRoZSB2YWx1ZSBvclxuICAgICAqIHVuZGVmaW5lZCwgb3IgYSBwcm9taXNlIG9mIGVpdGhlci5cbiAgICAgKi9cbiAgICByZWFkOiAoa2V5OiBzdHJpbmcpID0+IE1heWJlUHJvbWlzZTxUIHwgdW5kZWZpbmVkPjtcbiAgICAvKipcbiAgICAgKiBXcml0ZXMgYSB2YWx1ZSBmb3IgdGhlIGdpdmVuIGtleSB0byB0aGUgc3RvcmFnZS5cbiAgICAgKi9cbiAgICB3cml0ZTogKGtleTogc3RyaW5nLCB2YWx1ZTogVCkgPT4gTWF5YmVQcm9taXNlPHZvaWQ+O1xuICAgIC8qKlxuICAgICAqIERlbGV0ZXMgYSB2YWx1ZSBmb3IgdGhlIGdpdmVuIGtleSBmcm9tIHRoZSBzdG9yYWdlLlxuICAgICAqL1xuICAgIGRlbGV0ZTogKGtleTogc3RyaW5nKSA9PiBNYXliZVByb21pc2U8dm9pZD47XG4gICAgLyoqXG4gICAgICogQ2hlY2tzIHdoZXRoZXIgYSBrZXkgZXhpc3RzIGluIHRoZSBzdG9yYWdlLlxuICAgICAqL1xuICAgIGhhcz86IChrZXk6IHN0cmluZykgPT4gTWF5YmVQcm9taXNlPGJvb2xlYW4+O1xuICAgIC8qKlxuICAgICAqIExpc3RzIGFsbCBrZXlzLlxuICAgICAqL1xuICAgIHJlYWRBbGxLZXlzPzogKCkgPT4gSXRlcmFibGU8c3RyaW5nPiB8IEFzeW5jSXRlcmFibGU8c3RyaW5nPjtcbiAgICAvKipcbiAgICAgKiBMaXN0cyBhbGwgdmFsdWVzLlxuICAgICAqL1xuICAgIHJlYWRBbGxWYWx1ZXM/OiAoKSA9PiBJdGVyYWJsZTxUPiB8IEFzeW5jSXRlcmFibGU8VD47XG4gICAgLyoqXG4gICAgICogTGlzdHMgYWxsIGtleXMgd2l0aCB0aGVpciB2YWx1ZXMuXG4gICAgICovXG4gICAgcmVhZEFsbEVudHJpZXM/OiAoKSA9PlxuICAgICAgICB8IEl0ZXJhYmxlPFtrZXk6IHN0cmluZywgdmFsdWU6IFRdPlxuICAgICAgICB8IEFzeW5jSXRlcmFibGU8W2tleTogc3RyaW5nLCB2YWx1ZTogVF0+O1xufVxuXG4vKipcbiAqIE9wdGlvbnMgZm9yIHNlc3Npb24gbWlkZGxld2FyZS5cbiAqL1xuZXhwb3J0IGludGVyZmFjZSBTZXNzaW9uT3B0aW9uczxTLCBDIGV4dGVuZHMgQ29udGV4dCA9IENvbnRleHQ+IHtcbiAgICB0eXBlPzogXCJzaW5nbGVcIjtcbiAgICAvKipcbiAgICAgKiAqKlJlY29tbWVuZGVkIHRvIHVzZS4qKlxuICAgICAqXG4gICAgICogQSBmdW5jdGlvbiB0aGF0IHByb2R1Y2VzIGFuIGluaXRpYWwgdmFsdWUgZm9yIGBjdHguc2Vzc2lvbmAuIFRoaXNcbiAgICAgKiBmdW5jdGlvbiB3aWxsIGJlIGNhbGxlZCBldmVyeSB0aW1lIHRoZSBzdG9yYWdlIHNvbHV0aW9uIHJldHVybnMgdW5kZWZpbmVkXG4gICAgICogZm9yIGEgZ2l2ZW4gc2Vzc2lvbiBrZXkuIE1ha2Ugc3VyZSB0byBjcmVhdGUgYSBuZXcgdmFsdWUgZXZlcnkgdGltZSwgc3VjaFxuICAgICAqIHRoYXQgZGlmZmVyZW50IGNvbnRleHQgb2JqZWN0cyBkbyB0aGF0IGFjY2lkZW50YWxseSBzaGFyZSB0aGUgc2FtZVxuICAgICAqIHNlc3Npb24gZGF0YS5cbiAgICAgKi9cbiAgICBpbml0aWFsPzogKCkgPT4gUztcbiAgICAvKipcbiAgICAgKiBUaGlzIG9wdGlvbiBsZXRzIHlvdSBnZW5lcmF0ZSB5b3VyIG93biBzZXNzaW9uIGtleXMgcGVyIGNvbnRleHQgb2JqZWN0LlxuICAgICAqIFRoZSBzZXNzaW9uIGtleSBkZXRlcm1pbmVzIGhvdyB0byBtYXAgdGhlIGRpZmZlcmVudCBzZXNzaW9uIG9iamVjdHMgdG9cbiAgICAgKiB5b3VyIGNoYXRzIGFuZCB1c2Vycy4gQ2hlY2sgb3V0IHRoZVxuICAgICAqIFtkb2N1bWVudGF0aW9uXShodHRwczovL2dyYW1teS5kZXYvcGx1Z2lucy9zZXNzaW9uLmh0bWwjaG93LXRvLXVzZS1zZXNzaW9ucylcbiAgICAgKiBvbiB0aGUgd2Vic2l0ZSBhYm91dCBob3cgdG8gdXNlIHNlc3Npb24gbWlkZGxld2FyZSB0byBrbm93IGhvdyBzZXNzaW9uXG4gICAgICoga2V5cyBhcmUgdXNlZC5cbiAgICAgKlxuICAgICAqIFRoZSBkZWZhdWx0IGltcGxlbWVudGF0aW9uIHdpbGwgc3RvcmUgc2Vzc2lvbnMgcGVyIGNoYXQsIGFzIGRldGVybWluZWQgYnlcbiAgICAgKiBgY3R4LmNoYXRJZGAuXG4gICAgICovXG4gICAgZ2V0U2Vzc2lvbktleT86IChcbiAgICAgICAgY3R4OiBPbWl0PEMsIFwic2Vzc2lvblwiPixcbiAgICApID0+IE1heWJlUHJvbWlzZTxzdHJpbmcgfCB1bmRlZmluZWQ+O1xuICAgIC8qKlxuICAgICAqIEEgc3RvcmFnZSBhZGFwdGVyIHRvIHlvdXIgc3RvcmFnZSBzb2x1dGlvbi4gUHJvdmlkZXMgcmVhZCwgd3JpdGUsIGFuZFxuICAgICAqIGRlbGV0ZSBhY2Nlc3MgdG8gdGhlIHNlc3Npb24gbWlkZGxld2FyZS5cbiAgICAgKlxuICAgICAqIENvbnNpZGVyIHVzaW5nIGEgW2tub3duIHN0b3JhZ2VcbiAgICAgKiBhZGFwdGVyXShodHRwczovL2dyYW1teS5kZXYvcGx1Z2lucy9zZXNzaW9uLmh0bWwja25vd24tc3RvcmFnZS1hZGFwdGVycylcbiAgICAgKiBpbnN0ZWFkIG9mIHJvbGxpbmcgeW91ciBvd24gaW1wbGVtZW50YXRpb24gb2YgdGhpcy5cbiAgICAgKlxuICAgICAqIFRoZSBkZWZhdWx0IGltcGxlbWVudGF0aW9uIHdpbGwgc3RvcmUgc2Vzc2lvbiBpbiBtZW1vcnkuIFRoZSBkYXRhIHdpbGwgYmVcbiAgICAgKiBsb3N0IHdoZW5ldmVyIHlvdXIgYm90IHJlc3RhcnRzLlxuICAgICAqL1xuICAgIHN0b3JhZ2U/OiBTdG9yYWdlQWRhcHRlcjxTPjtcbn1cblxuLyoqXG4gKiBPcHRpb25zIGZvciBzZXNzaW9uIG1pZGRsZXdhcmUgaWYgbXVsdGkgc2Vzc2lvbnMgYXJlIHVzZWQuIFNwZWNpZnkgYFwidHlwZVwiOlxuICogXCJtdWx0aVwiYCBpbiB0aGUgb3B0aW9ucyB0byB1c2UgbXVsdGkgc2Vzc2lvbnMuXG4gKi9cbmV4cG9ydCB0eXBlIE11bHRpU2Vzc2lvbk9wdGlvbnM8UywgQyBleHRlbmRzIENvbnRleHQ+ID1cbiAgICAvLyBkZW5vLWxpbnQtaWdub3JlIG5vLWV4cGxpY2l0LWFueVxuICAgIFMgZXh0ZW5kcyBSZWNvcmQ8c3RyaW5nLCBhbnk+IC8vIHVua25vd24gYnJlYWtzIGV4dGVuZHNcbiAgICAgICAgPyB7IHR5cGU6IFwibXVsdGlcIiB9ICYgTXVsdGlTZXNzaW9uT3B0aW9uc1JlY29yZDxTLCBDPlxuICAgICAgICA6IG5ldmVyO1xudHlwZSBNdWx0aVNlc3Npb25PcHRpb25zUmVjb3JkPFxuICAgIFMgZXh0ZW5kcyBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPixcbiAgICBDIGV4dGVuZHMgQ29udGV4dCxcbj4gPSB7XG4gICAgW0sgaW4ga2V5b2YgU106IFNlc3Npb25PcHRpb25zPFNbS10sIEM+O1xufTtcblxuLyoqXG4gKiBTZXNzaW9uIG1pZGRsZXdhcmUgcHJvdmlkZXMgYSBwZXJzaXN0ZW50IGRhdGEgc3RvcmFnZSBmb3IgeW91ciBib3QuIFlvdSBjYW5cbiAqIHVzZSBpdCB0byBsZXQgeW91ciBib3QgcmVtZW1iZXIgYW55IGRhdGEgeW91IHdhbnQsIGZvciBleGFtcGxlIHRoZSBtZXNzYWdlc1xuICogaXQgc2VudCBvciByZWNlaXZlZCBpbiB0aGUgcGFzdC4gVGhpcyBpcyBkb25lIGJ5IGF0dGFjaGluZyBfc2Vzc2lvbiBkYXRhXyB0b1xuICogZXZlcnkgY2hhdC4gVGhlIHN0b3JlZCBkYXRhIGlzIHRoZW4gcHJvdmlkZWQgb24gdGhlIGNvbnRleHQgb2JqZWN0IHVuZGVyXG4gKiBgY3R4LnNlc3Npb25gLlxuICpcbiAqID4gKipXaGF0IGlzIGEgc2Vzc2lvbj8qKiBTaW1wbHkgcHV0LCB0aGUgc2Vzc2lvbiBvZiBhIGNoYXQgaXMgYSBsaXR0bGVcbiAqID4gcGVyc2lzdGVudCBzdG9yYWdlIHRoYXQgaXMgYXR0YWNoZWQgdG8gaXQuIEFzIGFuIGV4YW1wbGUsIHlvdXIgYm90IGNhbiBzZW5kXG4gKiA+IGEgbWVzc2FnZSB0byBhIGNoYXQgYW5kIHN0b3JlIHRoZSBpZGVudGlmaWVyIG9mIHRoYXQgbWVzc2FnZSBpbiB0aGVcbiAqID4gY29ycmVzcG9uZGluZyBzZXNzaW9uLiBUaGUgbmV4dCB0aW1lIHlvdXIgYm90IHJlY2VpdmVzIGFuIHVwZGF0ZSBmcm9tIHRoYXRcbiAqID4gY2hhdCwgdGhlIHNlc3Npb24gd2lsbCBzdGlsbCBjb250YWluIHRoYXQgSUQuXG4gKiA+XG4gKiA+IFNlc3Npb24gZGF0YSBjYW4gYmUgc3RvcmVkIGluIGEgZGF0YWJhc2UsIGluIGEgZmlsZSwgb3Igc2ltcGx5IGluIG1lbW9yeS5cbiAqID4gZ3JhbW1ZIG9ubHkgc3VwcG9ydHMgbWVtb3J5IHNlc3Npb25zIG91dCBvZiB0aGUgYm94LCBidXQgeW91IGNhbiB1c2VcbiAqID4gdGhpcmQtcGFydHkgc2Vzc2lvbiBtaWRkbGV3YXJlIHRvIGNvbm5lY3QgdG8gb3RoZXIgc3RvcmFnZSBzb2x1dGlvbnMuIE5vdGVcbiAqID4gdGhhdCBtZW1vcnkgc2Vzc2lvbnMgd2lsbCBiZSBsb3N0IHdoZW4geW91IHN0b3AgeW91ciBib3QgYW5kIHRoZSBwcm9jZXNzXG4gKiA+IGV4aXRzLCBzbyB0aGV5IGFyZSB1c3VhbGx5IG5vdCB1c2VmdWwgaW4gcHJvZHVjdGlvbi5cbiAqXG4gKiBXaGVuZXZlciB5b3VyIGJvdCByZWNlaXZlcyBhbiB1cGRhdGUsIHRoZSBmaXJzdCB0aGluZyB0aGUgc2Vzc2lvbiBtaWRkbGV3YXJlXG4gKiB3aWxsIGRvIGlzIHRvIGxvYWQgdGhlIGNvcnJlY3Qgc2Vzc2lvbiBmcm9tIHlvdXIgc3RvcmFnZSBzb2x1dGlvbi4gVGhpc1xuICogb2JqZWN0IGlzIHRoZW4gcHJvdmlkZWQgb24gYGN0eC5zZXNzaW9uYCB3aGlsZSB5b3VyIG90aGVyIG1pZGRsZXdhcmUgaXNcbiAqIHJ1bm5pbmcuIEFzIHNvb24gYXMgeW91ciBib3QgaXMgZG9uZSBoYW5kbGluZyB0aGUgdXBkYXRlLCB0aGUgbWlkZGxld2FyZVxuICogdGFrZXMgb3ZlciBhZ2FpbiBhbmQgd3JpdGVzIGJhY2sgdGhlIHNlc3Npb24gb2JqZWN0IHRvIHlvdXIgc3RvcmFnZS4gVGhpc1xuICogYWxsb3dzIHlvdSB0byBtb2RpZnkgdGhlIHNlc3Npb24gb2JqZWN0IGFyYml0cmFyaWx5IGluIHlvdXIgbWlkZGxld2FyZSwgYW5kXG4gKiB0byBzdG9wIHdvcnJ5aW5nIGFib3V0IHRoZSBkYXRhYmFzZS5cbiAqXG4gKiBgYGB0c1xuICogYm90LnVzZShzZXNzaW9uKCkpXG4gKlxuICogYm90Lm9uKCdtZXNzYWdlJywgY3R4ID0+IHtcbiAqICAgLy8gVGhlIHNlc3Npb24gb2JqZWN0IGlzIHBlcnNpc3RlZCBhY3Jvc3MgdXBkYXRlcyFcbiAqICAgY29uc3Qgc2Vzc2lvbiA9IGN0eC5zZXNzaW9uXG4gKiB9KVxuICogYGBgXG4gKlxuICogSXQgaXMgcmVjb21tZW5kZWQgdG8gbWFrZSB1c2Ugb2YgdGhlIGBpbml0aWFsYCBvcHRpb24gaW4gdGhlIGNvbmZpZ3VyYXRpb25cbiAqIG9iamVjdCwgd2hpY2ggY29ycmVjdGx5IGluaXRpYWxpemVzIHNlc3Npb24gb2JqZWN0cyBmb3IgbmV3IGNoYXRzLlxuICpcbiAqIFlvdSBjYW4gZGVsZXRlIHRoZSBzZXNzaW9uIGRhdGEgYnkgc2V0dGluZyBgY3R4LnNlc3Npb25gIHRvIGBudWxsYCBvclxuICogYHVuZGVmaW5lZGAuXG4gKlxuICogQ2hlY2sgb3V0IHRoZSBbZG9jdW1lbnRhdGlvbl0oaHR0cHM6Ly9ncmFtbXkuZGV2L3BsdWdpbnMvc2Vzc2lvbi5odG1sKSBvbiB0aGVcbiAqIHdlYnNpdGUgdG8ga25vdyBtb3JlIGFib3V0IGhvdyBzZXNzaW9ucyB3b3JrIGluIGdyYW1tWS5cbiAqXG4gKiBAcGFyYW0gb3B0aW9ucyBPcHRpb25hbCBjb25maWd1cmF0aW9uIHRvIHBhc3MgdG8gdGhlIHNlc3Npb24gbWlkZGxld2FyZVxuICovXG5leHBvcnQgZnVuY3Rpb24gc2Vzc2lvbjxTLCBDIGV4dGVuZHMgQ29udGV4dD4oXG4gICAgb3B0aW9uczogU2Vzc2lvbk9wdGlvbnM8UywgQz4gfCBNdWx0aVNlc3Npb25PcHRpb25zPFMsIEM+ID0ge30sXG4pOiBNaWRkbGV3YXJlRm48QyAmIFNlc3Npb25GbGF2b3I8Uz4+IHtcbiAgICByZXR1cm4gb3B0aW9ucy50eXBlID09PSBcIm11bHRpXCJcbiAgICAgICAgPyBzdHJpY3RNdWx0aVNlc3Npb24ob3B0aW9ucylcbiAgICAgICAgOiBzdHJpY3RTaW5nbGVTZXNzaW9uKG9wdGlvbnMpO1xufVxuXG5mdW5jdGlvbiBzdHJpY3RTaW5nbGVTZXNzaW9uPFMsIEMgZXh0ZW5kcyBDb250ZXh0PihcbiAgICBvcHRpb25zOiBTZXNzaW9uT3B0aW9uczxTLCBDPixcbik6IE1pZGRsZXdhcmVGbjxDICYgU2Vzc2lvbkZsYXZvcjxTPj4ge1xuICAgIGNvbnN0IHsgaW5pdGlhbCwgc3RvcmFnZSwgZ2V0U2Vzc2lvbktleSwgY3VzdG9tIH0gPSBmaWxsRGVmYXVsdHMob3B0aW9ucyk7XG4gICAgcmV0dXJuIGFzeW5jIChjdHgsIG5leHQpID0+IHtcbiAgICAgICAgY29uc3QgcHJvcFNlc3Npb24gPSBuZXcgUHJvcGVydHlTZXNzaW9uPFNlc3Npb25GbGF2b3I8Uz4sIFwic2Vzc2lvblwiPihcbiAgICAgICAgICAgIHN0b3JhZ2UsXG4gICAgICAgICAgICBjdHgsXG4gICAgICAgICAgICBcInNlc3Npb25cIixcbiAgICAgICAgICAgIGluaXRpYWwsXG4gICAgICAgICk7XG4gICAgICAgIGNvbnN0IGtleSA9IGF3YWl0IGdldFNlc3Npb25LZXkoY3R4KTtcbiAgICAgICAgYXdhaXQgcHJvcFNlc3Npb24uaW5pdChrZXksIHsgY3VzdG9tLCBsYXp5OiBmYWxzZSB9KTtcbiAgICAgICAgYXdhaXQgbmV4dCgpOyAvLyBubyBjYXRjaDogZG8gbm90IHdyaXRlIGJhY2sgaWYgbWlkZGxld2FyZSB0aHJvd3NcbiAgICAgICAgYXdhaXQgcHJvcFNlc3Npb24uZmluaXNoKCk7XG4gICAgfTtcbn1cbmZ1bmN0aW9uIHN0cmljdE11bHRpU2Vzc2lvbjxTLCBDIGV4dGVuZHMgQ29udGV4dD4oXG4gICAgb3B0aW9uczogTXVsdGlTZXNzaW9uT3B0aW9uczxTLCBDPixcbik6IE1pZGRsZXdhcmVGbjxDICYgU2Vzc2lvbkZsYXZvcjxTPj4ge1xuICAgIGNvbnN0IHByb3BzID0gT2JqZWN0LmtleXMob3B0aW9ucykuZmlsdGVyKChrKSA9PiBrICE9PSBcInR5cGVcIik7XG4gICAgY29uc3QgZGVmYXVsdHMgPSBPYmplY3QuZnJvbUVudHJpZXMoXG4gICAgICAgIHByb3BzLm1hcCgocHJvcCkgPT4gW3Byb3AsIGZpbGxEZWZhdWx0cyhvcHRpb25zW3Byb3BdKV0pLFxuICAgICk7XG4gICAgcmV0dXJuIGFzeW5jIChjdHgsIG5leHQpID0+IHtcbiAgICAgICAgY3R4LnNlc3Npb24gPSB7fSBhcyBTO1xuICAgICAgICBjb25zdCBwcm9wU2Vzc2lvbnMgPSBhd2FpdCBQcm9taXNlLmFsbChwcm9wcy5tYXAoYXN5bmMgKHByb3ApID0+IHtcbiAgICAgICAgICAgIGNvbnN0IHsgaW5pdGlhbCwgc3RvcmFnZSwgZ2V0U2Vzc2lvbktleSwgY3VzdG9tIH0gPSBkZWZhdWx0c1twcm9wXTtcbiAgICAgICAgICAgIGNvbnN0IHMgPSBuZXcgUHJvcGVydHlTZXNzaW9uKFxuICAgICAgICAgICAgICAgIC8vIEB0cy1leHBlY3QtZXJyb3IgY2Fubm90IGV4cHJlc3MgdGhhdCB0aGUgc3RvcmFnZSB3b3JrcyBmb3IgYSBjb25jcmV0ZSBwcm9wXG4gICAgICAgICAgICAgICAgc3RvcmFnZSxcbiAgICAgICAgICAgICAgICBjdHguc2Vzc2lvbixcbiAgICAgICAgICAgICAgICBwcm9wLFxuICAgICAgICAgICAgICAgIGluaXRpYWwsXG4gICAgICAgICAgICApO1xuICAgICAgICAgICAgY29uc3Qga2V5ID0gYXdhaXQgZ2V0U2Vzc2lvbktleShjdHgpO1xuICAgICAgICAgICAgYXdhaXQgcy5pbml0KGtleSwgeyBjdXN0b20sIGxhenk6IGZhbHNlIH0pO1xuICAgICAgICAgICAgcmV0dXJuIHM7XG4gICAgICAgIH0pKTtcbiAgICAgICAgYXdhaXQgbmV4dCgpOyAvLyBubyBjYXRjaDogZG8gbm90IHdyaXRlIGJhY2sgaWYgbWlkZGxld2FyZSB0aHJvd3NcbiAgICAgICAgaWYgKGN0eC5zZXNzaW9uID09IG51bGwpIHByb3BTZXNzaW9ucy5mb3JFYWNoKChzKSA9PiBzLmRlbGV0ZSgpKTtcbiAgICAgICAgYXdhaXQgUHJvbWlzZS5hbGwocHJvcFNlc3Npb25zLm1hcCgocykgPT4gcy5maW5pc2goKSkpO1xuICAgIH07XG59XG5cbi8qKlxuICogPiBUaGlzIGlzIGFuIGFkdmFuY2VkIGZ1bmN0aW9uIG9mIGdyYW1tWS5cbiAqXG4gKiBHZW5lcmFsbHkgc3BlYWtpbmcsIGxhenkgc2Vzc2lvbnMgd29yayBqdXN0IGxpa2Ugbm9ybWFsIHNlc3Npb25z4oCUanVzdCB0aGV5XG4gKiBhcmUgbG9hZGVkIG9uIGRlbWFuZC4gRXhjZXB0IGZvciBhIGZldyBgYXN5bmNgcyBhbmQgYGF3YWl0YHMgaGVyZSBhbmQgdGhlcmUsXG4gKiB0aGVpciB1c2FnZSBsb29rcyAxMDAgJSBpZGVudGljYWwuXG4gKlxuICogSW5zdGVhZCBvZiBkaXJlY3RseSBxdWVyeWluZyB0aGUgc3RvcmFnZSBldmVyeSB0aW1lIGFuIHVwZGF0ZSBhcnJpdmVzLCBsYXp5XG4gKiBzZXNzaW9ucyBxdWlja2x5IGRvIHRoaXMgX29uY2UgeW91IGFjY2Vzc18gYGN0eC5zZXNzaW9uYC4gVGhpcyBjYW5cbiAqIHNpZ25pZmljYW50bHkgcmVkdWNlIHRoZSBkYXRhYmFzZSB0cmFmZmljIChlc3BlY2lhbGx5IHdoZW4geW91ciBib3QgaXMgYWRkZWRcbiAqIHRvIGdyb3VwIGNoYXRzKSwgYmVjYXVzZSBpdCBza2lwcyBhIHJlYWQgYW5kIGEgd3JvdGUgb3BlcmF0aW9uIGZvciBhbGxcbiAqIHVwZGF0ZXMgdGhhdCB0aGUgYm90IGRvZXMgbm90IHJlYWN0IHRvLlxuICpcbiAqIGBgYHRzXG4gKiAvLyBUaGUgb3B0aW9ucyBhcmUgaWRlbnRpY2FsXG4gKiBib3QudXNlKGxhenlTZXNzaW9uKHsgc3RvcmFnZTogLi4uIH0pKVxuICpcbiAqIGJvdC5vbignbWVzc2FnZScsIGFzeW5jIGN0eCA9PiB7XG4gKiAgIC8vIFRoZSBzZXNzaW9uIG9iamVjdCBpcyBwZXJzaXN0ZWQgYWNyb3NzIHVwZGF0ZXMhXG4gKiAgIGNvbnN0IHNlc3Npb24gPSBhd2FpdCBjdHguc2Vzc2lvblxuICogICAvLyAgICAgICAgICAgICAgICAgICAgICAgIF5cbiAqICAgLy8gICAgICAgICAgICAgICAgICAgICAgICB8XG4gKiAgIC8vICAgICAgICAgICAgICAgICAgICAgICBUaGlzIHBsYWluIHByb3BlcnR5IGFjY2VzcyAobm8gZnVuY3Rpb24gY2FsbCkgd2lsbCB0cmlnZ2VyIHRoZSBkYXRhYmFzZSBxdWVyeSFcbiAqIH0pXG4gKiBgYGBcbiAqXG4gKiBDaGVjayBvdXQgdGhlXG4gKiBbZG9jdW1lbnRhdGlvbl0oaHR0cHM6Ly9ncmFtbXkuZGV2L3BsdWdpbnMvc2Vzc2lvbi5odG1sI2xhenktc2Vzc2lvbnMpIG9uIHRoZVxuICogd2Vic2l0ZSB0byBrbm93IG1vcmUgYWJvdXQgaG93IGxhenkgc2Vzc2lvbnMgd29yayBpbiBncmFtbVkuXG4gKlxuICogQHBhcmFtIG9wdGlvbnMgT3B0aW9uYWwgY29uZmlndXJhdGlvbiB0byBwYXNzIHRvIHRoZSBzZXNzaW9uIG1pZGRsZXdhcmVcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGxhenlTZXNzaW9uPFMsIEMgZXh0ZW5kcyBDb250ZXh0PihcbiAgICBvcHRpb25zOiBTZXNzaW9uT3B0aW9uczxTLCBDPiA9IHt9LFxuKTogTWlkZGxld2FyZUZuPEMgJiBMYXp5U2Vzc2lvbkZsYXZvcjxTPj4ge1xuICAgIGlmIChvcHRpb25zLnR5cGUgIT09IHVuZGVmaW5lZCAmJiBvcHRpb25zLnR5cGUgIT09IFwic2luZ2xlXCIpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiQ2Fubm90IHVzZSBsYXp5IG11bHRpIHNlc3Npb25zIVwiKTtcbiAgICB9XG4gICAgY29uc3QgeyBpbml0aWFsLCBzdG9yYWdlLCBnZXRTZXNzaW9uS2V5LCBjdXN0b20gfSA9IGZpbGxEZWZhdWx0cyhvcHRpb25zKTtcbiAgICByZXR1cm4gYXN5bmMgKGN0eCwgbmV4dCkgPT4ge1xuICAgICAgICBjb25zdCBwcm9wU2Vzc2lvbiA9IG5ldyBQcm9wZXJ0eVNlc3Npb24oXG4gICAgICAgICAgICAvLyBAdHMtZXhwZWN0LWVycm9yIHN1cHByZXNzIHByb21pc2UgbmF0dXJlIG9mIHZhbHVlc1xuICAgICAgICAgICAgc3RvcmFnZSxcbiAgICAgICAgICAgIGN0eCxcbiAgICAgICAgICAgIFwic2Vzc2lvblwiLFxuICAgICAgICAgICAgaW5pdGlhbCxcbiAgICAgICAgKTtcbiAgICAgICAgY29uc3Qga2V5ID0gYXdhaXQgZ2V0U2Vzc2lvbktleShjdHgpO1xuICAgICAgICBhd2FpdCBwcm9wU2Vzc2lvbi5pbml0KGtleSwgeyBjdXN0b20sIGxhenk6IHRydWUgfSk7XG4gICAgICAgIGF3YWl0IG5leHQoKTsgLy8gbm8gY2F0Y2g6IGRvIG5vdCB3cml0ZSBiYWNrIGlmIG1pZGRsZXdhcmUgdGhyb3dzXG4gICAgICAgIGF3YWl0IHByb3BTZXNzaW9uLmZpbmlzaCgpO1xuICAgIH07XG59XG5cbi8qKlxuICogSW50ZXJuYWwgY2xhc3MgdGhhdCBtYW5hZ2VzIGEgc2luZ2xlIHByb3BlcnR5IG9uIHRoZSBzZXNzaW9uLiBDYW4gYmUgdXNlZFxuICogYm90aCBpbiBhIHN0cmljdCBhbmQgYSBsYXp5IHdheS4gV29ya3MgYnkgdXNpbmcgYE9iamVjdC5kZWZpbmVQcm9wZXJ0eWAgdG9cbiAqIGluc3RhbGwgYE9bUF1gLlxuICovXG4vLyBkZW5vLWxpbnQtaWdub3JlIGJhbi10eXBlc1xuY2xhc3MgUHJvcGVydHlTZXNzaW9uPE8gZXh0ZW5kcyB7fSwgUCBleHRlbmRzIGtleW9mIE8+IHtcbiAgICBwcml2YXRlIGtleT86IHN0cmluZztcbiAgICBwcml2YXRlIHZhbHVlOiBPW1BdIHwgdW5kZWZpbmVkO1xuICAgIHByaXZhdGUgcHJvbWlzZTogUHJvbWlzZTxPW1BdIHwgdW5kZWZpbmVkPiB8IHVuZGVmaW5lZDtcblxuICAgIHByaXZhdGUgZmV0Y2hpbmcgPSBmYWxzZTtcbiAgICBwcml2YXRlIHJlYWQgPSBmYWxzZTtcbiAgICBwcml2YXRlIHdyb3RlID0gZmFsc2U7XG5cbiAgICBjb25zdHJ1Y3RvcihcbiAgICAgICAgcHJpdmF0ZSBzdG9yYWdlOiBTdG9yYWdlQWRhcHRlcjxPW1BdPixcbiAgICAgICAgcHJpdmF0ZSBvYmo6IE8sXG4gICAgICAgIHByaXZhdGUgcHJvcDogUCxcbiAgICAgICAgcHJpdmF0ZSBpbml0aWFsOiAoKCkgPT4gT1tQXSkgfCB1bmRlZmluZWQsXG4gICAgKSB7fVxuXG4gICAgLyoqIFBlcmZvcm1zIGEgcmVhZCBvcCBhbmQgc3RvcmVzIHRoZSByZXN1bHQgaW4gYHRoaXMudmFsdWVgICovXG4gICAgcHJpdmF0ZSBsb2FkKCkge1xuICAgICAgICBpZiAodGhpcy5rZXkgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgLy8gTm8gc2Vzc2lvbiBrZXkgcHJvdmlkZWQsIGNhbm5vdCBsb2FkXG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHRoaXMud3JvdGUpIHtcbiAgICAgICAgICAgIC8vIFZhbHVlIHdhcyBzZXQsIG5vIG5lZWQgdG8gbG9hZFxuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIC8vIFBlcmZvcm0gcmVhZCBvcCBpZiBub3QgY2FjaGVkXG4gICAgICAgIGlmICh0aGlzLnByb21pc2UgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgdGhpcy5mZXRjaGluZyA9IHRydWU7XG4gICAgICAgICAgICB0aGlzLnByb21pc2UgPSBQcm9taXNlLnJlc29sdmUodGhpcy5zdG9yYWdlLnJlYWQodGhpcy5rZXkpKVxuICAgICAgICAgICAgICAgIC50aGVuKCh2YWw/OiBPW1BdKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuZmV0Y2hpbmcgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgLy8gQ2hlY2sgZm9yIHdyaXRlIG9wIGluIHRoZSBtZWFudGltZVxuICAgICAgICAgICAgICAgICAgICBpZiAodGhpcy53cm90ZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgLy8gRGlzY2FyZCByZWFkIG9wXG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy52YWx1ZTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAvLyBTdG9yZSByZWNlaXZlZCB2YWx1ZSBpbiBgdGhpcy52YWx1ZWBcbiAgICAgICAgICAgICAgICAgICAgaWYgKHZhbCAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnZhbHVlID0gdmFsO1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHZhbDtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAvLyBObyB2YWx1ZSwgbmVlZCB0byBpbml0aWFsaXplXG4gICAgICAgICAgICAgICAgICAgIHZhbCA9IHRoaXMuaW5pdGlhbD8uKCk7XG4gICAgICAgICAgICAgICAgICAgIGlmICh2YWwgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgLy8gV3JvdGUgaW5pdGlhbCB2YWx1ZVxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy53cm90ZSA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnZhbHVlID0gdmFsO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB2YWw7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHRoaXMucHJvbWlzZTtcbiAgICB9XG5cbiAgICBhc3luYyBpbml0KFxuICAgICAgICBrZXk6IHN0cmluZyB8IHVuZGVmaW5lZCxcbiAgICAgICAgb3B0czogeyBjdXN0b206IGJvb2xlYW47IGxhenk6IGJvb2xlYW4gfSxcbiAgICApIHtcbiAgICAgICAgdGhpcy5rZXkgPSBrZXk7XG4gICAgICAgIGlmICghb3B0cy5sYXp5KSBhd2FpdCB0aGlzLmxvYWQoKTtcbiAgICAgICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KHRoaXMub2JqLCB0aGlzLnByb3AsIHtcbiAgICAgICAgICAgIGVudW1lcmFibGU6IHRydWUsXG4gICAgICAgICAgICBnZXQ6ICgpID0+IHtcbiAgICAgICAgICAgICAgICBpZiAoa2V5ID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgbXNnID0gdW5kZWYoXCJhY2Nlc3NcIiwgb3B0cyk7XG4gICAgICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihtc2cpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB0aGlzLnJlYWQgPSB0cnVlO1xuICAgICAgICAgICAgICAgIGlmICghb3B0cy5sYXp5IHx8IHRoaXMud3JvdGUpIHJldHVybiB0aGlzLnZhbHVlO1xuICAgICAgICAgICAgICAgIHRoaXMubG9hZCgpO1xuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLmZldGNoaW5nID8gdGhpcy5wcm9taXNlIDogdGhpcy52YWx1ZTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBzZXQ6ICh2KSA9PiB7XG4gICAgICAgICAgICAgICAgaWYgKGtleSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IG1zZyA9IHVuZGVmKFwiYXNzaWduXCIsIG9wdHMpO1xuICAgICAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IobXNnKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgdGhpcy53cm90ZSA9IHRydWU7XG4gICAgICAgICAgICAgICAgdGhpcy5mZXRjaGluZyA9IGZhbHNlO1xuICAgICAgICAgICAgICAgIHRoaXMudmFsdWUgPSB2O1xuICAgICAgICAgICAgfSxcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgZGVsZXRlKCkge1xuICAgICAgICBPYmplY3QuYXNzaWduKHRoaXMub2JqLCB7IFt0aGlzLnByb3BdOiB1bmRlZmluZWQgfSk7XG4gICAgfVxuXG4gICAgYXN5bmMgZmluaXNoKCkge1xuICAgICAgICBpZiAodGhpcy5rZXkgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgaWYgKHRoaXMucmVhZCkgYXdhaXQgdGhpcy5sb2FkKCk7XG4gICAgICAgICAgICBpZiAodGhpcy5yZWFkIHx8IHRoaXMud3JvdGUpIHtcbiAgICAgICAgICAgICAgICBjb25zdCB2YWx1ZSA9IGF3YWl0IHRoaXMudmFsdWU7XG4gICAgICAgICAgICAgICAgaWYgKHZhbHVlID09IG51bGwpIGF3YWl0IHRoaXMuc3RvcmFnZS5kZWxldGUodGhpcy5rZXkpO1xuICAgICAgICAgICAgICAgIGVsc2UgYXdhaXQgdGhpcy5zdG9yYWdlLndyaXRlKHRoaXMua2V5LCB2YWx1ZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG59XG5cbmZ1bmN0aW9uIGZpbGxEZWZhdWx0czxTLCBDIGV4dGVuZHMgQ29udGV4dD4ob3B0czogU2Vzc2lvbk9wdGlvbnM8UywgQz4gPSB7fSkge1xuICAgIGxldCB7IGdldFNlc3Npb25LZXkgPSBkZWZhdWx0R2V0U2Vzc2lvbktleSwgaW5pdGlhbCwgc3RvcmFnZSB9ID0gb3B0cztcbiAgICBpZiAoc3RvcmFnZSA9PSBudWxsKSB7XG4gICAgICAgIGRlYnVnKFxuICAgICAgICAgICAgXCJTdG9yaW5nIHNlc3Npb24gZGF0YSBpbiBtZW1vcnksIGFsbCBkYXRhIHdpbGwgYmUgbG9zdCB3aGVuIHRoZSBib3QgcmVzdGFydHMuXCIsXG4gICAgICAgICk7XG4gICAgICAgIHN0b3JhZ2UgPSBuZXcgTWVtb3J5U2Vzc2lvblN0b3JhZ2U8Uz4oKTtcbiAgICB9XG4gICAgY29uc3QgY3VzdG9tID0gZ2V0U2Vzc2lvbktleSAhPT0gZGVmYXVsdEdldFNlc3Npb25LZXk7XG4gICAgcmV0dXJuIHsgaW5pdGlhbCwgc3RvcmFnZSwgZ2V0U2Vzc2lvbktleSwgY3VzdG9tIH07XG59XG5cbi8qKiBTdG9yZXMgc2Vzc2lvbiBkYXRhIHBlciBjaGF0IGJ5IGRlZmF1bHQgKi9cbmZ1bmN0aW9uIGRlZmF1bHRHZXRTZXNzaW9uS2V5KGN0eDogQ29udGV4dCk6IHN0cmluZyB8IHVuZGVmaW5lZCB7XG4gICAgcmV0dXJuIGN0eC5jaGF0SWQ/LnRvU3RyaW5nKCk7XG59XG5cbi8qKiBSZXR1cm5zIGEgdXNlZnVsIGVycm9yIG1lc3NhZ2UgZm9yIHdoZW4gdGhlIHNlc3Npb24ga2V5IGlzIHVuZGVmaW5lZCAqL1xuZnVuY3Rpb24gdW5kZWYoXG4gICAgb3A6IFwiYWNjZXNzXCIgfCBcImFzc2lnblwiLFxuICAgIG9wdHM6IHsgY3VzdG9tOiBib29sZWFuOyBsYXp5PzogYm9vbGVhbiB9LFxuKSB7XG4gICAgY29uc3QgeyBsYXp5ID0gZmFsc2UsIGN1c3RvbSB9ID0gb3B0cztcbiAgICBjb25zdCByZWFzb24gPSBjdXN0b21cbiAgICAgICAgPyBcInRoZSBjdXN0b20gYGdldFNlc3Npb25LZXlgIGZ1bmN0aW9uIHJldHVybmVkIHVuZGVmaW5lZCBmb3IgdGhpcyB1cGRhdGVcIlxuICAgICAgICA6IFwidGhpcyB1cGRhdGUgZG9lcyBub3QgYmVsb25nIHRvIGEgY2hhdCwgc28gdGhlIHNlc3Npb24ga2V5IGlzIHVuZGVmaW5lZFwiO1xuICAgIHJldHVybiBgQ2Fubm90ICR7b3B9ICR7bGF6eSA/IFwibGF6eSBcIiA6IFwiXCJ9c2Vzc2lvbiBkYXRhIGJlY2F1c2UgJHtyZWFzb259IWA7XG59XG5cbi8vID09PSBTZXNzaW9uIG1pZ3JhdGlvbnNcbi8qKlxuICogV2hlbiBlbmhhbmNpbmcgYSBzdG9yYWdlIGFkYXB0ZXIsIGl0IG5lZWRzIHRvIGJlIGFibGUgdG8gc3RvcmUgYWRkaXRpb25hbFxuICogaW5mb3JtYXRpb24uIEl0IGRvZXMgdGhpcyBieSB3cmFwcGluZyB0aGUgYWN0dWFsIGRhdGEgaW5zaWRlIGFuIG9iamVjdCwgYW5kXG4gKiBhZGRpbmcgbW9yZSBwcm9wZXJ0aWVzIHRvIHRoaXMgd3JhcHBlci5cbiAqXG4gKiBUaGlzIGludGVyZmFjZSBkZWZpbmVzIHRoZSBhZGRpdGlvbmFsIHByb3BlcnRpZXMgdGhhdCBuZWVkIHRvIGJlIHN0b3JlZCBieSBhXG4gKiBzdG9yYWdlIGFkYXB0ZXIgdGhhdCBzdXBwb3J0cyBlbmhhbmNlZCBzZXNzaW9ucy5cbiAqL1xuZXhwb3J0IGludGVyZmFjZSBFbmhhbmNlPFQ+IHtcbiAgICAvKiogVmVyc2lvbiAqL1xuICAgIHY/OiBudW1iZXI7XG4gICAgLyoqIERhdGEgKi9cbiAgICBfX2Q6IFQ7XG4gICAgLyoqIEV4cGlyeSBkYXRlICovXG4gICAgZT86IG51bWJlcjtcbn1cbmZ1bmN0aW9uIGlzRW5oYW5jZTxUPih2YWx1ZT86IFQgfCBFbmhhbmNlPFQ+KTogdmFsdWUgaXMgRW5oYW5jZTxUPiB8IHVuZGVmaW5lZCB7XG4gICAgcmV0dXJuIHZhbHVlID09PSB1bmRlZmluZWQgfHxcbiAgICAgICAgdHlwZW9mIHZhbHVlID09PSBcIm9iamVjdFwiICYmIHZhbHVlICE9PSBudWxsICYmIFwiX19kXCIgaW4gdmFsdWU7XG59XG4vKiogT3B0aW9ucyBmb3IgZW5oYW5jZWQgc2Vzc2lvbnMgKi9cbmV4cG9ydCBpbnRlcmZhY2UgTWlncmF0aW9uT3B0aW9uczxUPiB7XG4gICAgLyoqIFRoZSBvcmlnaW5hbCBzdG9yYWdlIGFkYXB0ZXIgdGhhdCB3aWxsIGJlIGVuaGFuY2VkICovXG4gICAgc3RvcmFnZTogU3RvcmFnZUFkYXB0ZXI8RW5oYW5jZTxUPj47XG4gICAgLyoqXG4gICAgICogQSBzZXQgb2Ygc2Vzc2lvbiBtaWdyYXRpb25zLCBkZWZpbmVkIGFzIGFuIG9iamVjdCBtYXBwaW5nIGZyb20gdmVyc2lvblxuICAgICAqIG51bWJlcnMgdG8gbWlncmF0aW9uIGZ1bmN0aW9ucyB0aGF0IHRyYW5zZm9ybSBkYXRhIHRvIHRoZSByZXNwZWN0aXZlXG4gICAgICogdmVyc2lvbi5cbiAgICAgKi9cbiAgICBtaWdyYXRpb25zPzogTWlncmF0aW9ucztcbiAgICAvKipcbiAgICAgKiBOdW1iZXIgb2YgbWlsbGlzZWNvbmRzIGFmdGVyIHRoZSBsYXN0IHdyaXRlIG9wZXJhdGlvbiB1bnRpbCB0aGUgc2Vzc2lvblxuICAgICAqIGRhdGEgZXhwaXJlcy5cbiAgICAgKi9cbiAgICBtaWxsaXNlY29uZHNUb0xpdmU/OiBudW1iZXI7XG59XG4vKipcbiAqIEEgbWFwcGluZyBmcm9tIHZlcnNpb24gbnVtYmVycyB0byBzZXNzaW9uIG1pZ3JhdGlvbiBmdW5jdGlvbnMuIEVhY2ggZW50cnkgaW5cbiAqIHRoaXMgb2JqZWN0IGhhcyBhIHZlcnNpb24gbnVtYmVyIGFzIGEga2V5LCBhbmQgYSBmdW5jdGlvbiBhcyBhIHZhbHVlLlxuICpcbiAqIEZvciBhIGtleSBgbmAsIHRoZSByZXNwZWN0aXZlIHZhbHVlIHNob3VsZCBiZSBhIGZ1bmN0aW9uIHRoYXQgdGFrZXMgdGhlXG4gKiBwcmV2aW91cyBzZXNzaW9uIGRhdGEgYW5kIG1pZ3JhdGVzIGl0IHRvIGNvbmZvcm0gd2l0aCB0aGUgZGF0YSB0aGF0IGlzIHVzZWRcbiAqIGJ5IHZlcnNpb24gYG5gLiBUaGUgcHJldmlvdXMgc2Vzc2lvbiBkYXRhIGlzIGRlZmluZWQgYnkgdGhlIG5leHQga2V5IGxlc3NcbiAqIHRoYW4gYG5gLCBzdWNoIGFzIGBuLTFgLiBWZXJzaW9ucyBkb24ndCBoYXZlIHRvIGJlIGludGVnZXJzLCBub3IgZG8gYWxsXG4gKiB2ZXJzaW9ucyBoYXZlIHRvIGJlIGFkamFjZW50LiBGb3IgZXhhbXBsZSwgeW91IGNhbiB1c2UgYFsxLCAxLjUsIDRdYCBhc1xuICogdmVyc2lvbnMuIElmIGBuYCBpcyB0aGUgbG93ZXN0IHZhbHVlIGluIHRoZSBzZXQgb2Yga2V5cywgdGhlIGZ1bmN0aW9uIHN0b3JlZFxuICogZm9yIGBuYCBjYW4gYmUgdXNlZCB0byBtaWdyYXRlIHNlc3Npb24gZGF0YSB0aGF0IHdhcyBzdG9yZWQgYmVmb3JlIG1pZ3JhdGlvbnNcbiAqIHdlcmUgdXNlZC5cbiAqL1xuZXhwb3J0IGludGVyZmFjZSBNaWdyYXRpb25zIHtcbiAgICAvLyBkZW5vLWxpbnQtaWdub3JlIG5vLWV4cGxpY2l0LWFueVxuICAgIFt2ZXJzaW9uOiBudW1iZXJdOiAob2xkOiBhbnkpID0+IGFueTtcbn1cblxuLyoqXG4gKiBZb3UgY2FuIHVzZSB0aGlzIGZ1bmN0aW9uIHRvIHRyYW5zZm9ybSBhbiBleGlzdGluZyBzdG9yYWdlIGFkYXB0ZXIsIGFuZCBhZGRcbiAqIG1vcmUgZmVhdHVyZXMgdG8gaXQuIEN1cnJlbnRseSwgeW91IGNhbiBhZGQgc2Vzc2lvbiBtaWdyYXRpb25zIGFuZCBleHBpcnlcbiAqIGRhdGVzLlxuICpcbiAqIFlvdSBjYW4gdXNlIHRoaXMgZnVuY3Rpb24gbGlrZSBzbzpcbiAqIGBgYHRzXG4gKiBjb25zdCBzdG9yYWdlID0gLi4uIC8vIGRlZmluZSB5b3VyIHN0b3JhZ2UgYWRhcHRlclxuICogY29uc3QgZW5oYW5jZWQgPSBlbmhhbmNlU3RvcmFnZSh7IHN0b3JhZ2UsIG1pbGxpc2Vjb25kc1RvTGl2ZTogNTAwIH0pXG4gKiBib3QudXNlKHNlc3Npb24oeyBzdG9yYWdlOiBlbmhhbmNlZCB9KSlcbiAqIGBgYFxuICpcbiAqIEBwYXJhbSBvcHRpb25zIFNlc3Npb24gZW5oYW5jaW5nIG9wdGlvbnNcbiAqIEByZXR1cm5zIFRoZSBlbmhhbmNlZCBzdG9yYWdlIGFkYXB0ZXJcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGVuaGFuY2VTdG9yYWdlPFQ+KFxuICAgIG9wdGlvbnM6IE1pZ3JhdGlvbk9wdGlvbnM8VD4sXG4pOiBTdG9yYWdlQWRhcHRlcjxUPiB7XG4gICAgbGV0IHsgc3RvcmFnZSwgbWlsbGlzZWNvbmRzVG9MaXZlLCBtaWdyYXRpb25zIH0gPSBvcHRpb25zO1xuICAgIHN0b3JhZ2UgPSBjb21wYXRTdG9yYWdlKHN0b3JhZ2UpO1xuICAgIGlmIChtaWxsaXNlY29uZHNUb0xpdmUgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICBzdG9yYWdlID0gdGltZW91dFN0b3JhZ2Uoc3RvcmFnZSwgbWlsbGlzZWNvbmRzVG9MaXZlKTtcbiAgICB9XG4gICAgaWYgKG1pZ3JhdGlvbnMgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICBzdG9yYWdlID0gbWlncmF0aW9uU3RvcmFnZShzdG9yYWdlLCBtaWdyYXRpb25zKTtcbiAgICB9XG4gICAgcmV0dXJuIHdyYXBTdG9yYWdlKHN0b3JhZ2UpO1xufVxuXG5mdW5jdGlvbiBjb21wYXRTdG9yYWdlPFQ+KFxuICAgIHN0b3JhZ2U6IFN0b3JhZ2VBZGFwdGVyPEVuaGFuY2U8VD4+LFxuKTogU3RvcmFnZUFkYXB0ZXI8RW5oYW5jZTxUPj4ge1xuICAgIHJldHVybiB7XG4gICAgICAgIHJlYWQ6IGFzeW5jIChrKSA9PiB7XG4gICAgICAgICAgICBjb25zdCB2ID0gYXdhaXQgc3RvcmFnZS5yZWFkKGspO1xuICAgICAgICAgICAgcmV0dXJuIGlzRW5oYW5jZSh2KSA/IHYgOiB7IF9fZDogdiB9O1xuICAgICAgICB9LFxuICAgICAgICB3cml0ZTogKGssIHYpID0+IHN0b3JhZ2Uud3JpdGUoaywgdiksXG4gICAgICAgIGRlbGV0ZTogKGspID0+IHN0b3JhZ2UuZGVsZXRlKGspLFxuICAgIH07XG59XG5cbmZ1bmN0aW9uIHRpbWVvdXRTdG9yYWdlPFQ+KFxuICAgIHN0b3JhZ2U6IFN0b3JhZ2VBZGFwdGVyPEVuaGFuY2U8VD4+LFxuICAgIG1pbGxpc2Vjb25kc1RvTGl2ZTogbnVtYmVyLFxuKTogU3RvcmFnZUFkYXB0ZXI8RW5oYW5jZTxUPj4ge1xuICAgIGNvbnN0IHR0bFN0b3JhZ2U6IFN0b3JhZ2VBZGFwdGVyPEVuaGFuY2U8VD4+ID0ge1xuICAgICAgICByZWFkOiBhc3luYyAoaykgPT4ge1xuICAgICAgICAgICAgY29uc3QgdmFsdWUgPSBhd2FpdCBzdG9yYWdlLnJlYWQoayk7XG4gICAgICAgICAgICBpZiAodmFsdWUgPT09IHVuZGVmaW5lZCkgcmV0dXJuIHVuZGVmaW5lZDtcbiAgICAgICAgICAgIGlmICh2YWx1ZS5lID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgICAgICBhd2FpdCB0dGxTdG9yYWdlLndyaXRlKGssIHZhbHVlKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gdmFsdWU7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAodmFsdWUuZSA8IERhdGUubm93KCkpIHtcbiAgICAgICAgICAgICAgICBhd2FpdCB0dGxTdG9yYWdlLmRlbGV0ZShrKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gdW5kZWZpbmVkO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIHZhbHVlO1xuICAgICAgICB9LFxuICAgICAgICB3cml0ZTogYXN5bmMgKGssIHYpID0+IHtcbiAgICAgICAgICAgIHYuZSA9IGFkZEV4cGlyeURhdGUodiwgbWlsbGlzZWNvbmRzVG9MaXZlKS5leHBpcmVzO1xuICAgICAgICAgICAgYXdhaXQgc3RvcmFnZS53cml0ZShrLCB2KTtcbiAgICAgICAgfSxcbiAgICAgICAgZGVsZXRlOiAoaykgPT4gc3RvcmFnZS5kZWxldGUoayksXG4gICAgfTtcbiAgICByZXR1cm4gdHRsU3RvcmFnZTtcbn1cbmZ1bmN0aW9uIG1pZ3JhdGlvblN0b3JhZ2U8VD4oXG4gICAgc3RvcmFnZTogU3RvcmFnZUFkYXB0ZXI8RW5oYW5jZTxUPj4sXG4gICAgbWlncmF0aW9uczogTWlncmF0aW9ucyxcbik6IFN0b3JhZ2VBZGFwdGVyPEVuaGFuY2U8VD4+IHtcbiAgICBjb25zdCB2ZXJzaW9ucyA9IE9iamVjdC5rZXlzKG1pZ3JhdGlvbnMpXG4gICAgICAgIC5tYXAoKHYpID0+IHBhcnNlSW50KHYpKVxuICAgICAgICAuc29ydCgoYSwgYikgPT4gYSAtIGIpO1xuICAgIGNvbnN0IGNvdW50ID0gdmVyc2lvbnMubGVuZ3RoO1xuICAgIGlmIChjb3VudCA9PT0gMCkgdGhyb3cgbmV3IEVycm9yKFwiTm8gbWlncmF0aW9ucyBnaXZlbiFcIik7XG4gICAgY29uc3QgZWFybGllc3QgPSB2ZXJzaW9uc1swXTtcbiAgICBjb25zdCBsYXN0ID0gY291bnQgLSAxO1xuICAgIGNvbnN0IGxhdGVzdCA9IHZlcnNpb25zW2xhc3RdO1xuICAgIGNvbnN0IGluZGV4ID0gbmV3IE1hcDxudW1iZXIsIG51bWJlcj4oKTtcbiAgICB2ZXJzaW9ucy5mb3JFYWNoKCh2LCBpKSA9PiBpbmRleC5zZXQodiwgaSkpOyAvLyBpbnZlcnNlIGFycmF5IGxvb2t1cFxuICAgIGZ1bmN0aW9uIG5leHRBZnRlcihjdXJyZW50OiBudW1iZXIpIHtcbiAgICAgICAgLy8gVE9ETzogdXNlIGBmaW5kTGFzdEluZGV4YCB3aXRoIE5vZGUgMThcbiAgICAgICAgbGV0IGkgPSBsYXN0O1xuICAgICAgICB3aGlsZSAoY3VycmVudCA8PSB2ZXJzaW9uc1tpXSkgaS0tO1xuICAgICAgICByZXR1cm4gaTtcbiAgICAgICAgLy8gcmV0dXJuIHZlcnNpb25zLmZpbmRMYXN0SW5kZXgoKHYpID0+IHYgPCBjdXJyZW50KVxuICAgIH1cbiAgICByZXR1cm4ge1xuICAgICAgICByZWFkOiBhc3luYyAoaykgPT4ge1xuICAgICAgICAgICAgY29uc3QgdmFsID0gYXdhaXQgc3RvcmFnZS5yZWFkKGspO1xuICAgICAgICAgICAgaWYgKHZhbCA9PT0gdW5kZWZpbmVkKSByZXR1cm4gdmFsO1xuICAgICAgICAgICAgbGV0IHsgX19kOiB2YWx1ZSwgdjogY3VycmVudCA9IGVhcmxpZXN0IC0gMSB9ID0gdmFsO1xuICAgICAgICAgICAgbGV0IGkgPSAxICsgKGluZGV4LmdldChjdXJyZW50KSA/PyBuZXh0QWZ0ZXIoY3VycmVudCkpO1xuICAgICAgICAgICAgZm9yICg7IGkgPCBjb3VudDsgaSsrKSB2YWx1ZSA9IG1pZ3JhdGlvbnNbdmVyc2lvbnNbaV1dKHZhbHVlKTtcbiAgICAgICAgICAgIHJldHVybiB7IC4uLnZhbCwgdjogbGF0ZXN0LCBfX2Q6IHZhbHVlIH07XG4gICAgICAgIH0sXG4gICAgICAgIHdyaXRlOiAoaywgdikgPT4gc3RvcmFnZS53cml0ZShrLCB7IHY6IGxhdGVzdCwgLi4udiB9KSxcbiAgICAgICAgZGVsZXRlOiAoaykgPT4gc3RvcmFnZS5kZWxldGUoayksXG4gICAgfTtcbn1cbmZ1bmN0aW9uIHdyYXBTdG9yYWdlPFQ+KFxuICAgIHN0b3JhZ2U6IFN0b3JhZ2VBZGFwdGVyPEVuaGFuY2U8VD4+LFxuKTogU3RvcmFnZUFkYXB0ZXI8VD4ge1xuICAgIHJldHVybiB7XG4gICAgICAgIHJlYWQ6IChrKSA9PiBQcm9taXNlLnJlc29sdmUoc3RvcmFnZS5yZWFkKGspKS50aGVuKCh2KSA9PiB2Py5fX2QpLFxuICAgICAgICB3cml0ZTogKGssIHYpID0+IHN0b3JhZ2Uud3JpdGUoaywgeyBfX2Q6IHYgfSksXG4gICAgICAgIGRlbGV0ZTogKGspID0+IHN0b3JhZ2UuZGVsZXRlKGspLFxuICAgIH07XG59XG5cbi8vID09PSBNZW1vcnkgc3RvcmFnZSBhZGFwdGVyXG4vKipcbiAqIFRoZSBtZW1vcnkgc2Vzc2lvbiBzdG9yYWdlIGlzIGEgYnVpbHQtaW4gc3RvcmFnZSBhZGFwdGVyIHRoYXQgc2F2ZXMgeW91clxuICogc2Vzc2lvbiBkYXRhIGluIFJBTSB1c2luZyBhIHJlZ3VsYXIgSmF2YVNjcmlwdCBgTWFwYCBvYmplY3QuIElmIHlvdSB1c2UgdGhpc1xuICogc3RvcmFnZSBhZGFwdGVyLCBhbGwgc2Vzc2lvbnMgd2lsbCBiZSBsb3N0IHdoZW4geW91ciBwcm9jZXNzIHRlcm1pbmF0ZXMgb3JcbiAqIHJlc3RhcnRzLiBIZW5jZSwgeW91IHNob3VsZCBvbmx5IHVzZSBpdCBmb3Igc2hvcnQtbGl2ZWQgZGF0YSB0aGF0IGlzIG5vdFxuICogaW1wb3J0YW50IHRvIHBlcnNpc3QuXG4gKlxuICogVGhpcyBjbGFzcyBpcyB1c2VkIGFzIGRlZmF1bHQgaWYgeW91IGRvIG5vdCBwcm92aWRlIGEgc3RvcmFnZSBhZGFwdGVyLCBlLmcuXG4gKiB0byB5b3VyIGRhdGFiYXNlLlxuICpcbiAqIFRoaXMgc3RvcmFnZSBhZGFwdGVyIGZlYXR1cmVzIGV4cGlyaW5nIHNlc3Npb25zLiBXaGVuIGluc3RhbnRpYXRpbmcgdGhpcyBjbGFzc1xuICogeW91cnNlbGYsIHlvdSBjYW4gcGFzcyBhIHRpbWUgdG8gbGl2ZSBpbiBtaWxsaXNlY29uZHMgdGhhdCB3aWxsIGJlIHVzZWQgZm9yXG4gKiBlYWNoIHNlc3Npb24gb2JqZWN0LiBJZiBhIHNlc3Npb24gZm9yIGEgdXNlciBleHBpcmVkLCB0aGUgc2Vzc2lvbiBkYXRhIHdpbGxcbiAqIGJlIGRpc2NhcmRlZCBvbiBpdHMgZmlyc3QgcmVhZCwgYW5kIGEgZnJlc2ggc2Vzc2lvbiBvYmplY3QgYXMgcmV0dXJuZWQgYnkgdGhlXG4gKiBgaW5pdGlhbGAgb3B0aW9uIChvciB1bmRlZmluZWQpIHdpbGwgYmUgcHV0IGludG8gcGxhY2UuXG4gKi9cbmV4cG9ydCBjbGFzcyBNZW1vcnlTZXNzaW9uU3RvcmFnZTxTPiBpbXBsZW1lbnRzIFN0b3JhZ2VBZGFwdGVyPFM+IHtcbiAgICAvKipcbiAgICAgKiBJbnRlcm5hbGx5IHVzZWQgYE1hcGAgaW5zdGFuY2UgdGhhdCBzdG9yZXMgdGhlIHNlc3Npb24gZGF0YVxuICAgICAqL1xuICAgIHByb3RlY3RlZCByZWFkb25seSBzdG9yYWdlID0gbmV3IE1hcDxcbiAgICAgICAgc3RyaW5nLFxuICAgICAgICB7IHNlc3Npb246IFM7IGV4cGlyZXM/OiBudW1iZXIgfVxuICAgID4oKTtcblxuICAgIC8qKlxuICAgICAqIENvbnN0cnVjdHMgYSBuZXcgbWVtb3J5IHNlc3Npb24gc3RvcmFnZSB3aXRoIHRoZSBnaXZlbiB0aW1lIHRvIGxpdmUuIE5vdGVcbiAgICAgKiB0aGF0IHRoaXMgc3RvcmFnZSBhZGFwdGVyIHdpbGwgbm90IHN0b3JlIHlvdXIgZGF0YSBwZXJtYW5lbnRseS5cbiAgICAgKlxuICAgICAqIEBwYXJhbSB0aW1lVG9MaXZlIFRUTCBpbiBtaWxsaXNlY29uZHMsIGRlZmF1bHQgaXMgYEluZmluaXR5YFxuICAgICAqL1xuICAgIGNvbnN0cnVjdG9yKHByaXZhdGUgcmVhZG9ubHkgdGltZVRvTGl2ZT86IG51bWJlcikge31cblxuICAgIHJlYWQoa2V5OiBzdHJpbmcpIHtcbiAgICAgICAgY29uc3QgdmFsdWUgPSB0aGlzLnN0b3JhZ2UuZ2V0KGtleSk7XG4gICAgICAgIGlmICh2YWx1ZSA9PT0gdW5kZWZpbmVkKSByZXR1cm4gdW5kZWZpbmVkO1xuICAgICAgICBpZiAodmFsdWUuZXhwaXJlcyAhPT0gdW5kZWZpbmVkICYmIHZhbHVlLmV4cGlyZXMgPCBEYXRlLm5vdygpKSB7XG4gICAgICAgICAgICB0aGlzLmRlbGV0ZShrZXkpO1xuICAgICAgICAgICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdmFsdWUuc2Vzc2lvbjtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBAZGVwcmVjYXRlZCBVc2Uge0BsaW5rIHJlYWRBbGxWYWx1ZXN9IGluc3RlYWRcbiAgICAgKi9cbiAgICByZWFkQWxsKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5yZWFkQWxsVmFsdWVzKCk7XG4gICAgfVxuXG4gICAgcmVhZEFsbEtleXMoKSB7XG4gICAgICAgIHJldHVybiBBcnJheS5mcm9tKHRoaXMuc3RvcmFnZS5rZXlzKCkpO1xuICAgIH1cblxuICAgIHJlYWRBbGxWYWx1ZXMoKSB7XG4gICAgICAgIHJldHVybiBBcnJheVxuICAgICAgICAgICAgLmZyb20odGhpcy5zdG9yYWdlLmtleXMoKSlcbiAgICAgICAgICAgIC5tYXAoKGtleSkgPT4gdGhpcy5yZWFkKGtleSkpXG4gICAgICAgICAgICAuZmlsdGVyKCh2YWx1ZSk6IHZhbHVlIGlzIFMgPT4gdmFsdWUgIT09IHVuZGVmaW5lZCk7XG4gICAgfVxuXG4gICAgcmVhZEFsbEVudHJpZXMoKSB7XG4gICAgICAgIHJldHVybiBBcnJheS5mcm9tKHRoaXMuc3RvcmFnZS5rZXlzKCkpXG4gICAgICAgICAgICAubWFwKChrZXkpID0+IFtrZXksIHRoaXMucmVhZChrZXkpXSlcbiAgICAgICAgICAgIC5maWx0ZXIoKHBhaXIpOiBwYWlyIGlzIFtzdHJpbmcsIFNdID0+IHBhaXJbMV0gIT09IHVuZGVmaW5lZCk7XG4gICAgfVxuXG4gICAgaGFzKGtleTogc3RyaW5nKSB7XG4gICAgICAgIHJldHVybiB0aGlzLnN0b3JhZ2UuaGFzKGtleSk7XG4gICAgfVxuXG4gICAgd3JpdGUoa2V5OiBzdHJpbmcsIHZhbHVlOiBTKSB7XG4gICAgICAgIHRoaXMuc3RvcmFnZS5zZXQoa2V5LCBhZGRFeHBpcnlEYXRlKHZhbHVlLCB0aGlzLnRpbWVUb0xpdmUpKTtcbiAgICB9XG5cbiAgICBkZWxldGUoa2V5OiBzdHJpbmcpIHtcbiAgICAgICAgdGhpcy5zdG9yYWdlLmRlbGV0ZShrZXkpO1xuICAgIH1cbn1cblxuZnVuY3Rpb24gYWRkRXhwaXJ5RGF0ZTxUPih2YWx1ZTogVCwgdHRsPzogbnVtYmVyKSB7XG4gICAgaWYgKHR0bCAhPT0gdW5kZWZpbmVkICYmIHR0bCA8IEluZmluaXR5KSB7XG4gICAgICAgIGNvbnN0IG5vdyA9IERhdGUubm93KCk7XG4gICAgICAgIHJldHVybiB7IHNlc3Npb246IHZhbHVlLCBleHBpcmVzOiBub3cgKyB0dGwgfTtcbiAgICB9IGVsc2Uge1xuICAgICAgICByZXR1cm4geyBzZXNzaW9uOiB2YWx1ZSB9O1xuICAgIH1cbn1cbiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFFQSxTQUFTLFNBQVMsQ0FBQyxRQUFRLHNCQUFzQjtBQUNqRCxNQUFNLFFBQVEsRUFBRTtBQW1LaEI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Q0E4Q0MsR0FDRCxPQUFPLFNBQVMsUUFDWixVQUE0RCxDQUFDLENBQUMsRUFDNUI7SUFDbEMsT0FBTyxRQUFRLElBQUksS0FBSyxVQUNsQixtQkFBbUIsV0FDbkIsb0JBQW9CLFFBQVE7QUFDdEMsQ0FBQztBQUVELFNBQVMsb0JBQ0wsT0FBNkIsRUFDSztJQUNsQyxNQUFNLEVBQUUsUUFBTyxFQUFFLFFBQU8sRUFBRSxjQUFhLEVBQUUsT0FBTSxFQUFFLEdBQUcsYUFBYTtJQUNqRSxPQUFPLE9BQU8sS0FBSyxPQUFTO1FBQ3hCLE1BQU0sY0FBYyxJQUFJLGdCQUNwQixTQUNBLEtBQ0EsV0FDQTtRQUVKLE1BQU0sTUFBTSxNQUFNLGNBQWM7UUFDaEMsTUFBTSxZQUFZLElBQUksQ0FBQyxLQUFLO1lBQUU7WUFBUSxNQUFNLEtBQUs7UUFBQztRQUNsRCxNQUFNLFFBQVEsbURBQW1EO1FBQ2pFLE1BQU0sWUFBWSxNQUFNO0lBQzVCO0FBQ0o7QUFDQSxTQUFTLG1CQUNMLE9BQWtDLEVBQ0E7SUFDbEMsTUFBTSxRQUFRLE9BQU8sSUFBSSxDQUFDLFNBQVMsTUFBTSxDQUFDLENBQUMsSUFBTSxNQUFNO0lBQ3ZELE1BQU0sV0FBVyxPQUFPLFdBQVcsQ0FDL0IsTUFBTSxHQUFHLENBQUMsQ0FBQyxPQUFTO1lBQUM7WUFBTSxhQUFhLE9BQU8sQ0FBQyxLQUFLO1NBQUU7SUFFM0QsT0FBTyxPQUFPLEtBQUssT0FBUztRQUN4QixJQUFJLE9BQU8sR0FBRyxDQUFDO1FBQ2YsTUFBTSxlQUFlLE1BQU0sUUFBUSxHQUFHLENBQUMsTUFBTSxHQUFHLENBQUMsT0FBTyxPQUFTO1lBQzdELE1BQU0sRUFBRSxRQUFPLEVBQUUsUUFBTyxFQUFFLGNBQWEsRUFBRSxPQUFNLEVBQUUsR0FBRyxRQUFRLENBQUMsS0FBSztZQUNsRSxNQUFNLElBQUksSUFBSSxnQkFDViw2RUFBNkU7WUFDN0UsU0FDQSxJQUFJLE9BQU8sRUFDWCxNQUNBO1lBRUosTUFBTSxNQUFNLE1BQU0sY0FBYztZQUNoQyxNQUFNLEVBQUUsSUFBSSxDQUFDLEtBQUs7Z0JBQUU7Z0JBQVEsTUFBTSxLQUFLO1lBQUM7WUFDeEMsT0FBTztRQUNYO1FBQ0EsTUFBTSxRQUFRLG1EQUFtRDtRQUNqRSxJQUFJLElBQUksT0FBTyxJQUFJLElBQUksRUFBRSxhQUFhLE9BQU8sQ0FBQyxDQUFDLElBQU0sRUFBRSxNQUFNO1FBQzdELE1BQU0sUUFBUSxHQUFHLENBQUMsYUFBYSxHQUFHLENBQUMsQ0FBQyxJQUFNLEVBQUUsTUFBTTtJQUN0RDtBQUNKO0FBRUE7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Q0ErQkMsR0FDRCxPQUFPLFNBQVMsWUFDWixVQUFnQyxDQUFDLENBQUMsRUFDSTtJQUN0QyxJQUFJLFFBQVEsSUFBSSxLQUFLLGFBQWEsUUFBUSxJQUFJLEtBQUssVUFBVTtRQUN6RCxNQUFNLElBQUksTUFBTSxtQ0FBbUM7SUFDdkQsQ0FBQztJQUNELE1BQU0sRUFBRSxRQUFPLEVBQUUsUUFBTyxFQUFFLGNBQWEsRUFBRSxPQUFNLEVBQUUsR0FBRyxhQUFhO0lBQ2pFLE9BQU8sT0FBTyxLQUFLLE9BQVM7UUFDeEIsTUFBTSxjQUFjLElBQUksZ0JBQ3BCLHFEQUFxRDtRQUNyRCxTQUNBLEtBQ0EsV0FDQTtRQUVKLE1BQU0sTUFBTSxNQUFNLGNBQWM7UUFDaEMsTUFBTSxZQUFZLElBQUksQ0FBQyxLQUFLO1lBQUU7WUFBUSxNQUFNLElBQUk7UUFBQztRQUNqRCxNQUFNLFFBQVEsbURBQW1EO1FBQ2pFLE1BQU0sWUFBWSxNQUFNO0lBQzVCO0FBQ0osQ0FBQztBQUVEOzs7O0NBSUMsR0FDRCw2QkFBNkI7QUFDN0IsTUFBTTtJQVVVO0lBQ0E7SUFDQTtJQUNBO0lBWkosSUFBYTtJQUNiLE1BQXdCO0lBQ3hCLFFBQStDO0lBRS9DLFNBQWlCO0lBQ2pCLEtBQWE7SUFDYixNQUFjO0lBRXRCLFlBQ1ksU0FDQSxLQUNBLE1BQ0EsUUFDVjt1QkFKVTttQkFDQTtvQkFDQTt1QkFDQTthQVJKLFdBQVcsS0FBSzthQUNoQixPQUFPLEtBQUs7YUFDWixRQUFRLEtBQUs7SUFPbEI7SUFFSCw2REFBNkQsR0FDN0QsQUFBUSxPQUFPO1FBQ1gsSUFBSSxJQUFJLENBQUMsR0FBRyxLQUFLLFdBQVc7WUFDeEIsdUNBQXVDO1lBQ3ZDO1FBQ0osQ0FBQztRQUNELElBQUksSUFBSSxDQUFDLEtBQUssRUFBRTtZQUNaLGlDQUFpQztZQUNqQztRQUNKLENBQUM7UUFDRCxnQ0FBZ0M7UUFDaEMsSUFBSSxJQUFJLENBQUMsT0FBTyxLQUFLLFdBQVc7WUFDNUIsSUFBSSxDQUFDLFFBQVEsR0FBRyxJQUFJO1lBQ3BCLElBQUksQ0FBQyxPQUFPLEdBQUcsUUFBUSxPQUFPLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLEdBQUcsR0FDcEQsSUFBSSxDQUFDLENBQUMsTUFBZTtnQkFDbEIsSUFBSSxDQUFDLFFBQVEsR0FBRyxLQUFLO2dCQUNyQixxQ0FBcUM7Z0JBQ3JDLElBQUksSUFBSSxDQUFDLEtBQUssRUFBRTtvQkFDWixrQkFBa0I7b0JBQ2xCLE9BQU8sSUFBSSxDQUFDLEtBQUs7Z0JBQ3JCLENBQUM7Z0JBQ0QsdUNBQXVDO2dCQUN2QyxJQUFJLFFBQVEsV0FBVztvQkFDbkIsSUFBSSxDQUFDLEtBQUssR0FBRztvQkFDYixPQUFPO2dCQUNYLENBQUM7Z0JBQ0QsK0JBQStCO2dCQUMvQixNQUFNLElBQUksQ0FBQyxPQUFPO2dCQUNsQixJQUFJLFFBQVEsV0FBVztvQkFDbkIsc0JBQXNCO29CQUN0QixJQUFJLENBQUMsS0FBSyxHQUFHLElBQUk7b0JBQ2pCLElBQUksQ0FBQyxLQUFLLEdBQUc7Z0JBQ2pCLENBQUM7Z0JBQ0QsT0FBTztZQUNYO1FBQ1IsQ0FBQztRQUNELE9BQU8sSUFBSSxDQUFDLE9BQU87SUFDdkI7SUFFQSxNQUFNLEtBQ0YsR0FBdUIsRUFDdkIsSUFBd0MsRUFDMUM7UUFDRSxJQUFJLENBQUMsR0FBRyxHQUFHO1FBQ1gsSUFBSSxDQUFDLEtBQUssSUFBSSxFQUFFLE1BQU0sSUFBSSxDQUFDLElBQUk7UUFDL0IsT0FBTyxjQUFjLENBQUMsSUFBSSxDQUFDLEdBQUcsRUFBRSxJQUFJLENBQUMsSUFBSSxFQUFFO1lBQ3ZDLFlBQVksSUFBSTtZQUNoQixLQUFLLElBQU07Z0JBQ1AsSUFBSSxRQUFRLFdBQVc7b0JBQ25CLE1BQU0sTUFBTSxNQUFNLFVBQVU7b0JBQzVCLE1BQU0sSUFBSSxNQUFNLEtBQUs7Z0JBQ3pCLENBQUM7Z0JBQ0QsSUFBSSxDQUFDLElBQUksR0FBRyxJQUFJO2dCQUNoQixJQUFJLENBQUMsS0FBSyxJQUFJLElBQUksSUFBSSxDQUFDLEtBQUssRUFBRSxPQUFPLElBQUksQ0FBQyxLQUFLO2dCQUMvQyxJQUFJLENBQUMsSUFBSTtnQkFDVCxPQUFPLElBQUksQ0FBQyxRQUFRLEdBQUcsSUFBSSxDQUFDLE9BQU8sR0FBRyxJQUFJLENBQUMsS0FBSztZQUNwRDtZQUNBLEtBQUssQ0FBQyxJQUFNO2dCQUNSLElBQUksUUFBUSxXQUFXO29CQUNuQixNQUFNLE1BQU0sTUFBTSxVQUFVO29CQUM1QixNQUFNLElBQUksTUFBTSxLQUFLO2dCQUN6QixDQUFDO2dCQUNELElBQUksQ0FBQyxLQUFLLEdBQUcsSUFBSTtnQkFDakIsSUFBSSxDQUFDLFFBQVEsR0FBRyxLQUFLO2dCQUNyQixJQUFJLENBQUMsS0FBSyxHQUFHO1lBQ2pCO1FBQ0o7SUFDSjtJQUVBLFNBQVM7UUFDTCxPQUFPLE1BQU0sQ0FBQyxJQUFJLENBQUMsR0FBRyxFQUFFO1lBQUUsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLEVBQUU7UUFBVTtJQUNyRDtJQUVBLE1BQU0sU0FBUztRQUNYLElBQUksSUFBSSxDQUFDLEdBQUcsS0FBSyxXQUFXO1lBQ3hCLElBQUksSUFBSSxDQUFDLElBQUksRUFBRSxNQUFNLElBQUksQ0FBQyxJQUFJO1lBQzlCLElBQUksSUFBSSxDQUFDLElBQUksSUFBSSxJQUFJLENBQUMsS0FBSyxFQUFFO2dCQUN6QixNQUFNLFFBQVEsTUFBTSxJQUFJLENBQUMsS0FBSztnQkFDOUIsSUFBSSxTQUFTLElBQUksRUFBRSxNQUFNLElBQUksQ0FBQyxPQUFPLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxHQUFHO3FCQUNoRCxNQUFNLElBQUksQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxHQUFHLEVBQUU7WUFDNUMsQ0FBQztRQUNMLENBQUM7SUFDTDtBQUNKO0FBRUEsU0FBUyxhQUFtQyxPQUE2QixDQUFDLENBQUMsRUFBRTtJQUN6RSxJQUFJLEVBQUUsZUFBZ0IscUJBQW9CLEVBQUUsUUFBTyxFQUFFLFFBQU8sRUFBRSxHQUFHO0lBQ2pFLElBQUksV0FBVyxJQUFJLEVBQUU7UUFDakIsTUFDSTtRQUVKLFVBQVUsSUFBSTtJQUNsQixDQUFDO0lBQ0QsTUFBTSxTQUFTLGtCQUFrQjtJQUNqQyxPQUFPO1FBQUU7UUFBUztRQUFTO1FBQWU7SUFBTztBQUNyRDtBQUVBLDRDQUE0QyxHQUM1QyxTQUFTLHFCQUFxQixHQUFZLEVBQXNCO0lBQzVELE9BQU8sSUFBSSxNQUFNLEVBQUU7QUFDdkI7QUFFQSx5RUFBeUUsR0FDekUsU0FBUyxNQUNMLEVBQXVCLEVBQ3ZCLElBQXlDLEVBQzNDO0lBQ0UsTUFBTSxFQUFFLE1BQU8sS0FBSyxDQUFBLEVBQUUsT0FBTSxFQUFFLEdBQUc7SUFDakMsTUFBTSxTQUFTLFNBQ1QsMkVBQ0Esd0VBQXdFO0lBQzlFLE9BQU8sQ0FBQyxPQUFPLEVBQUUsR0FBRyxDQUFDLEVBQUUsT0FBTyxVQUFVLEVBQUUsQ0FBQyxxQkFBcUIsRUFBRSxPQUFPLENBQUMsQ0FBQztBQUMvRTtBQW1CQSxTQUFTLFVBQWEsS0FBc0IsRUFBbUM7SUFDM0UsT0FBTyxVQUFVLGFBQ2IsT0FBTyxVQUFVLFlBQVksVUFBVSxJQUFJLElBQUksU0FBUztBQUNoRTtBQW1DQTs7Ozs7Ozs7Ozs7Ozs7Q0FjQyxHQUNELE9BQU8sU0FBUyxlQUNaLE9BQTRCLEVBQ1g7SUFDakIsSUFBSSxFQUFFLFFBQU8sRUFBRSxtQkFBa0IsRUFBRSxXQUFVLEVBQUUsR0FBRztJQUNsRCxVQUFVLGNBQWM7SUFDeEIsSUFBSSx1QkFBdUIsV0FBVztRQUNsQyxVQUFVLGVBQWUsU0FBUztJQUN0QyxDQUFDO0lBQ0QsSUFBSSxlQUFlLFdBQVc7UUFDMUIsVUFBVSxpQkFBaUIsU0FBUztJQUN4QyxDQUFDO0lBQ0QsT0FBTyxZQUFZO0FBQ3ZCLENBQUM7QUFFRCxTQUFTLGNBQ0wsT0FBbUMsRUFDVDtJQUMxQixPQUFPO1FBQ0gsTUFBTSxPQUFPLElBQU07WUFDZixNQUFNLElBQUksTUFBTSxRQUFRLElBQUksQ0FBQztZQUM3QixPQUFPLFVBQVUsS0FBSyxJQUFJO2dCQUFFLEtBQUs7WUFBRSxDQUFDO1FBQ3hDO1FBQ0EsT0FBTyxDQUFDLEdBQUcsSUFBTSxRQUFRLEtBQUssQ0FBQyxHQUFHO1FBQ2xDLFFBQVEsQ0FBQyxJQUFNLFFBQVEsTUFBTSxDQUFDO0lBQ2xDO0FBQ0o7QUFFQSxTQUFTLGVBQ0wsT0FBbUMsRUFDbkMsa0JBQTBCLEVBQ0E7SUFDMUIsTUFBTSxhQUF5QztRQUMzQyxNQUFNLE9BQU8sSUFBTTtZQUNmLE1BQU0sUUFBUSxNQUFNLFFBQVEsSUFBSSxDQUFDO1lBQ2pDLElBQUksVUFBVSxXQUFXLE9BQU87WUFDaEMsSUFBSSxNQUFNLENBQUMsS0FBSyxXQUFXO2dCQUN2QixNQUFNLFdBQVcsS0FBSyxDQUFDLEdBQUc7Z0JBQzFCLE9BQU87WUFDWCxDQUFDO1lBQ0QsSUFBSSxNQUFNLENBQUMsR0FBRyxLQUFLLEdBQUcsSUFBSTtnQkFDdEIsTUFBTSxXQUFXLE1BQU0sQ0FBQztnQkFDeEIsT0FBTztZQUNYLENBQUM7WUFDRCxPQUFPO1FBQ1g7UUFDQSxPQUFPLE9BQU8sR0FBRyxJQUFNO1lBQ25CLEVBQUUsQ0FBQyxHQUFHLGNBQWMsR0FBRyxvQkFBb0IsT0FBTztZQUNsRCxNQUFNLFFBQVEsS0FBSyxDQUFDLEdBQUc7UUFDM0I7UUFDQSxRQUFRLENBQUMsSUFBTSxRQUFRLE1BQU0sQ0FBQztJQUNsQztJQUNBLE9BQU87QUFDWDtBQUNBLFNBQVMsaUJBQ0wsT0FBbUMsRUFDbkMsVUFBc0IsRUFDSTtJQUMxQixNQUFNLFdBQVcsT0FBTyxJQUFJLENBQUMsWUFDeEIsR0FBRyxDQUFDLENBQUMsSUFBTSxTQUFTLElBQ3BCLElBQUksQ0FBQyxDQUFDLEdBQUcsSUFBTSxJQUFJO0lBQ3hCLE1BQU0sUUFBUSxTQUFTLE1BQU07SUFDN0IsSUFBSSxVQUFVLEdBQUcsTUFBTSxJQUFJLE1BQU0sd0JBQXdCO0lBQ3pELE1BQU0sV0FBVyxRQUFRLENBQUMsRUFBRTtJQUM1QixNQUFNLE9BQU8sUUFBUTtJQUNyQixNQUFNLFNBQVMsUUFBUSxDQUFDLEtBQUs7SUFDN0IsTUFBTSxRQUFRLElBQUk7SUFDbEIsU0FBUyxPQUFPLENBQUMsQ0FBQyxHQUFHLElBQU0sTUFBTSxHQUFHLENBQUMsR0FBRyxLQUFLLHVCQUF1QjtJQUNwRSxTQUFTLFVBQVUsT0FBZSxFQUFFO1FBQ2hDLHlDQUF5QztRQUN6QyxJQUFJLElBQUk7UUFDUixNQUFPLFdBQVcsUUFBUSxDQUFDLEVBQUUsQ0FBRTtRQUMvQixPQUFPO0lBQ1Asb0RBQW9EO0lBQ3hEO0lBQ0EsT0FBTztRQUNILE1BQU0sT0FBTyxJQUFNO1lBQ2YsTUFBTSxNQUFNLE1BQU0sUUFBUSxJQUFJLENBQUM7WUFDL0IsSUFBSSxRQUFRLFdBQVcsT0FBTztZQUM5QixJQUFJLEVBQUUsS0FBSyxNQUFLLEVBQUUsR0FBRyxVQUFVLFdBQVcsQ0FBQyxDQUFBLEVBQUUsR0FBRztZQUNoRCxJQUFJLElBQUksSUFBSSxDQUFDLE1BQU0sR0FBRyxDQUFDLFlBQVksVUFBVSxRQUFRO1lBQ3JELE1BQU8sSUFBSSxPQUFPLElBQUssUUFBUSxVQUFVLENBQUMsUUFBUSxDQUFDLEVBQUUsQ0FBQyxDQUFDO1lBQ3ZELE9BQU87Z0JBQUUsR0FBRyxHQUFHO2dCQUFFLEdBQUc7Z0JBQVEsS0FBSztZQUFNO1FBQzNDO1FBQ0EsT0FBTyxDQUFDLEdBQUcsSUFBTSxRQUFRLEtBQUssQ0FBQyxHQUFHO2dCQUFFLEdBQUc7Z0JBQVEsR0FBRyxDQUFDO1lBQUM7UUFDcEQsUUFBUSxDQUFDLElBQU0sUUFBUSxNQUFNLENBQUM7SUFDbEM7QUFDSjtBQUNBLFNBQVMsWUFDTCxPQUFtQyxFQUNsQjtJQUNqQixPQUFPO1FBQ0gsTUFBTSxDQUFDLElBQU0sUUFBUSxPQUFPLENBQUMsUUFBUSxJQUFJLENBQUMsSUFBSSxJQUFJLENBQUMsQ0FBQyxJQUFNLEdBQUc7UUFDN0QsT0FBTyxDQUFDLEdBQUcsSUFBTSxRQUFRLEtBQUssQ0FBQyxHQUFHO2dCQUFFLEtBQUs7WUFBRTtRQUMzQyxRQUFRLENBQUMsSUFBTSxRQUFRLE1BQU0sQ0FBQztJQUNsQztBQUNKO0FBRUEsNkJBQTZCO0FBQzdCOzs7Ozs7Ozs7Ozs7Ozs7Q0FlQyxHQUNELE9BQU8sTUFBTTtJQWVvQjtJQWQ3Qjs7S0FFQyxHQUNELEFBQW1CLFFBR2Y7SUFFSjs7Ozs7S0FLQyxHQUNELFlBQTZCLFdBQXFCOzBCQUFyQjthQVhWLFVBQVUsSUFBSTtJQVdrQjtJQUVuRCxLQUFLLEdBQVcsRUFBRTtRQUNkLE1BQU0sUUFBUSxJQUFJLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQztRQUMvQixJQUFJLFVBQVUsV0FBVyxPQUFPO1FBQ2hDLElBQUksTUFBTSxPQUFPLEtBQUssYUFBYSxNQUFNLE9BQU8sR0FBRyxLQUFLLEdBQUcsSUFBSTtZQUMzRCxJQUFJLENBQUMsTUFBTSxDQUFDO1lBQ1osT0FBTztRQUNYLENBQUM7UUFDRCxPQUFPLE1BQU0sT0FBTztJQUN4QjtJQUVBOztLQUVDLEdBQ0QsVUFBVTtRQUNOLE9BQU8sSUFBSSxDQUFDLGFBQWE7SUFDN0I7SUFFQSxjQUFjO1FBQ1YsT0FBTyxNQUFNLElBQUksQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLElBQUk7SUFDdkM7SUFFQSxnQkFBZ0I7UUFDWixPQUFPLE1BQ0YsSUFBSSxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsSUFBSSxJQUN0QixHQUFHLENBQUMsQ0FBQyxNQUFRLElBQUksQ0FBQyxJQUFJLENBQUMsTUFDdkIsTUFBTSxDQUFDLENBQUMsUUFBc0IsVUFBVTtJQUNqRDtJQUVBLGlCQUFpQjtRQUNiLE9BQU8sTUFBTSxJQUFJLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxJQUFJLElBQzlCLEdBQUcsQ0FBQyxDQUFDLE1BQVE7Z0JBQUM7Z0JBQUssSUFBSSxDQUFDLElBQUksQ0FBQzthQUFLLEVBQ2xDLE1BQU0sQ0FBQyxDQUFDLE9BQThCLElBQUksQ0FBQyxFQUFFLEtBQUs7SUFDM0Q7SUFFQSxJQUFJLEdBQVcsRUFBRTtRQUNiLE9BQU8sSUFBSSxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUM7SUFDNUI7SUFFQSxNQUFNLEdBQVcsRUFBRSxLQUFRLEVBQUU7UUFDekIsSUFBSSxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsS0FBSyxjQUFjLE9BQU8sSUFBSSxDQUFDLFVBQVU7SUFDOUQ7SUFFQSxPQUFPLEdBQVcsRUFBRTtRQUNoQixJQUFJLENBQUMsT0FBTyxDQUFDLE1BQU0sQ0FBQztJQUN4QjtBQUNKLENBQUM7QUFFRCxTQUFTLGNBQWlCLEtBQVEsRUFBRSxHQUFZLEVBQUU7SUFDOUMsSUFBSSxRQUFRLGFBQWEsTUFBTSxVQUFVO1FBQ3JDLE1BQU0sTUFBTSxLQUFLLEdBQUc7UUFDcEIsT0FBTztZQUFFLFNBQVM7WUFBTyxTQUFTLE1BQU07UUFBSTtJQUNoRCxPQUFPO1FBQ0gsT0FBTztZQUFFLFNBQVM7UUFBTTtJQUM1QixDQUFDO0FBQ0wifQ==