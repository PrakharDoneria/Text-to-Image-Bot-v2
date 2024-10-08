import { debug as d } from "../platform.deno.ts";
const debug = d("grammy:warn");
/**
 * This class represents errors that are thrown by grammY because the Telegram
 * Bot API responded with an error.
 *
 * Instances of this class hold the information that the Telegram backend
 * returned.
 *
 * If this error is thrown, grammY could successfully communicate with the
 * Telegram Bot API servers, however, an error code was returned for the
 * respective method call.
 */ export class GrammyError extends Error {
    method;
    payload;
    /** Flag that this request was unsuccessful. Always `false`. */ ok;
    /** An integer holding Telegram's error code. Subject to change. */ error_code;
    /** A human-readable description of the error. */ description;
    /** Further parameters that may help to automatically handle the error. */ parameters;
    constructor(message, err, method, payload){
        super(`${message} (${err.error_code}: ${err.description})`);
        this.method = method;
        this.payload = payload;
        this.ok = false;
        this.name = "GrammyError";
        this.error_code = err.error_code;
        this.description = err.description;
        this.parameters = err.parameters ?? {};
    }
}
export function toGrammyError(err, method, payload) {
    switch(err.error_code){
        case 401:
            debug("Error 401 means that your bot token is wrong, talk to https://t.me/BotFather to check it.");
            break;
        case 409:
            debug("Error 409 means that you are running your bot several times on long polling. Consider revoking the bot token if you believe that no other instance is running.");
            break;
    }
    return new GrammyError(`Call to '${method}' failed!`, err, method, payload);
}
/**
 * This class represents errors that are thrown by grammY because an HTTP call
 * to the Telegram Bot API failed.
 *
 * Instances of this class hold the error object that was created because the
 * fetch call failed. It can be inspected to determine why exactly the network
 * request failed.
 *
 * If an [API transformer
 * function](https://grammy.dev/advanced/transformers.html) throws an error,
 * grammY will regard this as if the network request failed. The contained error
 * will then be the error that was thrown by the transformer function.
 */ export class HttpError extends Error {
    error;
    constructor(message, error){
        super(message);
        this.error = error;
        this.name = "HttpError";
    }
}
function isTelegramError(err) {
    return typeof err === "object" && err !== null && "status" in err && "statusText" in err;
}
export function toHttpError(method, sensitiveLogs) {
    return (err)=>{
        let msg = `Network request for '${method}' failed!`;
        if (isTelegramError(err)) msg += ` (${err.status}: ${err.statusText})`;
        if (sensitiveLogs && err instanceof Error) msg += ` ${err.message}`;
        throw new HttpError(msg, err);
    };
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vZGVuby5sYW5kL3gvZ3JhbW15QHYxLjI3LjAvY29yZS9lcnJvci50cyJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyB0eXBlIEFwaUVycm9yLCB0eXBlIFJlc3BvbnNlUGFyYW1ldGVycyB9IGZyb20gXCIuLi90eXBlcy50c1wiO1xuaW1wb3J0IHsgZGVidWcgYXMgZCB9IGZyb20gXCIuLi9wbGF0Zm9ybS5kZW5vLnRzXCI7XG5jb25zdCBkZWJ1ZyA9IGQoXCJncmFtbXk6d2FyblwiKTtcblxuLyoqXG4gKiBUaGlzIGNsYXNzIHJlcHJlc2VudHMgZXJyb3JzIHRoYXQgYXJlIHRocm93biBieSBncmFtbVkgYmVjYXVzZSB0aGUgVGVsZWdyYW1cbiAqIEJvdCBBUEkgcmVzcG9uZGVkIHdpdGggYW4gZXJyb3IuXG4gKlxuICogSW5zdGFuY2VzIG9mIHRoaXMgY2xhc3MgaG9sZCB0aGUgaW5mb3JtYXRpb24gdGhhdCB0aGUgVGVsZWdyYW0gYmFja2VuZFxuICogcmV0dXJuZWQuXG4gKlxuICogSWYgdGhpcyBlcnJvciBpcyB0aHJvd24sIGdyYW1tWSBjb3VsZCBzdWNjZXNzZnVsbHkgY29tbXVuaWNhdGUgd2l0aCB0aGVcbiAqIFRlbGVncmFtIEJvdCBBUEkgc2VydmVycywgaG93ZXZlciwgYW4gZXJyb3IgY29kZSB3YXMgcmV0dXJuZWQgZm9yIHRoZVxuICogcmVzcGVjdGl2ZSBtZXRob2QgY2FsbC5cbiAqL1xuZXhwb3J0IGNsYXNzIEdyYW1teUVycm9yIGV4dGVuZHMgRXJyb3IgaW1wbGVtZW50cyBBcGlFcnJvciB7XG4gICAgLyoqIEZsYWcgdGhhdCB0aGlzIHJlcXVlc3Qgd2FzIHVuc3VjY2Vzc2Z1bC4gQWx3YXlzIGBmYWxzZWAuICovXG4gICAgcHVibGljIHJlYWRvbmx5IG9rOiBmYWxzZSA9IGZhbHNlO1xuICAgIC8qKiBBbiBpbnRlZ2VyIGhvbGRpbmcgVGVsZWdyYW0ncyBlcnJvciBjb2RlLiBTdWJqZWN0IHRvIGNoYW5nZS4gKi9cbiAgICBwdWJsaWMgcmVhZG9ubHkgZXJyb3JfY29kZTogbnVtYmVyO1xuICAgIC8qKiBBIGh1bWFuLXJlYWRhYmxlIGRlc2NyaXB0aW9uIG9mIHRoZSBlcnJvci4gKi9cbiAgICBwdWJsaWMgcmVhZG9ubHkgZGVzY3JpcHRpb246IHN0cmluZztcbiAgICAvKiogRnVydGhlciBwYXJhbWV0ZXJzIHRoYXQgbWF5IGhlbHAgdG8gYXV0b21hdGljYWxseSBoYW5kbGUgdGhlIGVycm9yLiAqL1xuICAgIHB1YmxpYyByZWFkb25seSBwYXJhbWV0ZXJzOiBSZXNwb25zZVBhcmFtZXRlcnM7XG4gICAgY29uc3RydWN0b3IoXG4gICAgICAgIG1lc3NhZ2U6IHN0cmluZyxcbiAgICAgICAgZXJyOiBBcGlFcnJvcixcbiAgICAgICAgLyoqIFRoZSBjYWxsZWQgbWV0aG9kIG5hbWUgd2hpY2ggY2F1c2VkIHRoaXMgZXJyb3IgdG8gYmUgdGhyb3duLiAqL1xuICAgICAgICBwdWJsaWMgcmVhZG9ubHkgbWV0aG9kOiBzdHJpbmcsXG4gICAgICAgIC8qKiBUaGUgcGF5bG9hZCB0aGF0IHdhcyBwYXNzZWQgd2hlbiBjYWxsaW5nIHRoZSBtZXRob2QuICovXG4gICAgICAgIHB1YmxpYyByZWFkb25seSBwYXlsb2FkOiBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPixcbiAgICApIHtcbiAgICAgICAgc3VwZXIoYCR7bWVzc2FnZX0gKCR7ZXJyLmVycm9yX2NvZGV9OiAke2Vyci5kZXNjcmlwdGlvbn0pYCk7XG4gICAgICAgIHRoaXMubmFtZSA9IFwiR3JhbW15RXJyb3JcIjtcbiAgICAgICAgdGhpcy5lcnJvcl9jb2RlID0gZXJyLmVycm9yX2NvZGU7XG4gICAgICAgIHRoaXMuZGVzY3JpcHRpb24gPSBlcnIuZGVzY3JpcHRpb247XG4gICAgICAgIHRoaXMucGFyYW1ldGVycyA9IGVyci5wYXJhbWV0ZXJzID8/IHt9O1xuICAgIH1cbn1cbmV4cG9ydCBmdW5jdGlvbiB0b0dyYW1teUVycm9yKFxuICAgIGVycjogQXBpRXJyb3IsXG4gICAgbWV0aG9kOiBzdHJpbmcsXG4gICAgcGF5bG9hZDogUmVjb3JkPHN0cmluZywgdW5rbm93bj4sXG4pIHtcbiAgICBzd2l0Y2ggKGVyci5lcnJvcl9jb2RlKSB7XG4gICAgICAgIGNhc2UgNDAxOlxuICAgICAgICAgICAgZGVidWcoXG4gICAgICAgICAgICAgICAgXCJFcnJvciA0MDEgbWVhbnMgdGhhdCB5b3VyIGJvdCB0b2tlbiBpcyB3cm9uZywgdGFsayB0byBodHRwczovL3QubWUvQm90RmF0aGVyIHRvIGNoZWNrIGl0LlwiLFxuICAgICAgICAgICAgKTtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlIDQwOTpcbiAgICAgICAgICAgIGRlYnVnKFxuICAgICAgICAgICAgICAgIFwiRXJyb3IgNDA5IG1lYW5zIHRoYXQgeW91IGFyZSBydW5uaW5nIHlvdXIgYm90IHNldmVyYWwgdGltZXMgb24gbG9uZyBwb2xsaW5nLiBDb25zaWRlciByZXZva2luZyB0aGUgYm90IHRva2VuIGlmIHlvdSBiZWxpZXZlIHRoYXQgbm8gb3RoZXIgaW5zdGFuY2UgaXMgcnVubmluZy5cIixcbiAgICAgICAgICAgICk7XG4gICAgICAgICAgICBicmVhaztcbiAgICB9XG4gICAgcmV0dXJuIG5ldyBHcmFtbXlFcnJvcihcbiAgICAgICAgYENhbGwgdG8gJyR7bWV0aG9kfScgZmFpbGVkIWAsXG4gICAgICAgIGVycixcbiAgICAgICAgbWV0aG9kLFxuICAgICAgICBwYXlsb2FkLFxuICAgICk7XG59XG5cbi8qKlxuICogVGhpcyBjbGFzcyByZXByZXNlbnRzIGVycm9ycyB0aGF0IGFyZSB0aHJvd24gYnkgZ3JhbW1ZIGJlY2F1c2UgYW4gSFRUUCBjYWxsXG4gKiB0byB0aGUgVGVsZWdyYW0gQm90IEFQSSBmYWlsZWQuXG4gKlxuICogSW5zdGFuY2VzIG9mIHRoaXMgY2xhc3MgaG9sZCB0aGUgZXJyb3Igb2JqZWN0IHRoYXQgd2FzIGNyZWF0ZWQgYmVjYXVzZSB0aGVcbiAqIGZldGNoIGNhbGwgZmFpbGVkLiBJdCBjYW4gYmUgaW5zcGVjdGVkIHRvIGRldGVybWluZSB3aHkgZXhhY3RseSB0aGUgbmV0d29ya1xuICogcmVxdWVzdCBmYWlsZWQuXG4gKlxuICogSWYgYW4gW0FQSSB0cmFuc2Zvcm1lclxuICogZnVuY3Rpb25dKGh0dHBzOi8vZ3JhbW15LmRldi9hZHZhbmNlZC90cmFuc2Zvcm1lcnMuaHRtbCkgdGhyb3dzIGFuIGVycm9yLFxuICogZ3JhbW1ZIHdpbGwgcmVnYXJkIHRoaXMgYXMgaWYgdGhlIG5ldHdvcmsgcmVxdWVzdCBmYWlsZWQuIFRoZSBjb250YWluZWQgZXJyb3JcbiAqIHdpbGwgdGhlbiBiZSB0aGUgZXJyb3IgdGhhdCB3YXMgdGhyb3duIGJ5IHRoZSB0cmFuc2Zvcm1lciBmdW5jdGlvbi5cbiAqL1xuZXhwb3J0IGNsYXNzIEh0dHBFcnJvciBleHRlbmRzIEVycm9yIHtcbiAgICBjb25zdHJ1Y3RvcihcbiAgICAgICAgbWVzc2FnZTogc3RyaW5nLFxuICAgICAgICAvKiogVGhlIHRocm93biBlcnJvciBvYmplY3QuICovXG4gICAgICAgIHB1YmxpYyByZWFkb25seSBlcnJvcjogdW5rbm93bixcbiAgICApIHtcbiAgICAgICAgc3VwZXIobWVzc2FnZSk7XG4gICAgICAgIHRoaXMubmFtZSA9IFwiSHR0cEVycm9yXCI7XG4gICAgfVxufVxuXG5mdW5jdGlvbiBpc1RlbGVncmFtRXJyb3IoXG4gICAgZXJyOiB1bmtub3duLFxuKTogZXJyIGlzIHsgc3RhdHVzOiBzdHJpbmc7IHN0YXR1c1RleHQ6IHN0cmluZyB9IHtcbiAgICByZXR1cm4gKFxuICAgICAgICB0eXBlb2YgZXJyID09PSBcIm9iamVjdFwiICYmXG4gICAgICAgIGVyciAhPT0gbnVsbCAmJlxuICAgICAgICBcInN0YXR1c1wiIGluIGVyciAmJlxuICAgICAgICBcInN0YXR1c1RleHRcIiBpbiBlcnJcbiAgICApO1xufVxuZXhwb3J0IGZ1bmN0aW9uIHRvSHR0cEVycm9yKG1ldGhvZDogc3RyaW5nLCBzZW5zaXRpdmVMb2dzOiBib29sZWFuKSB7XG4gICAgcmV0dXJuIChlcnI6IHVua25vd24pID0+IHtcbiAgICAgICAgbGV0IG1zZyA9IGBOZXR3b3JrIHJlcXVlc3QgZm9yICcke21ldGhvZH0nIGZhaWxlZCFgO1xuICAgICAgICBpZiAoaXNUZWxlZ3JhbUVycm9yKGVycikpIG1zZyArPSBgICgke2Vyci5zdGF0dXN9OiAke2Vyci5zdGF0dXNUZXh0fSlgO1xuICAgICAgICBpZiAoc2Vuc2l0aXZlTG9ncyAmJiBlcnIgaW5zdGFuY2VvZiBFcnJvcikgbXNnICs9IGAgJHtlcnIubWVzc2FnZX1gO1xuICAgICAgICB0aHJvdyBuZXcgSHR0cEVycm9yKG1zZywgZXJyKTtcbiAgICB9O1xufVxuIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUNBLFNBQVMsU0FBUyxDQUFDLFFBQVEsc0JBQXNCO0FBQ2pELE1BQU0sUUFBUSxFQUFFO0FBRWhCOzs7Ozs7Ozs7O0NBVUMsR0FDRCxPQUFPLE1BQU0sb0JBQW9CO0lBYVQ7SUFFQTtJQWRwQiw2REFBNkQsR0FDN0QsQUFBZ0IsR0FBa0I7SUFDbEMsaUVBQWlFLEdBQ2pFLEFBQWdCLFdBQW1CO0lBQ25DLCtDQUErQyxHQUMvQyxBQUFnQixZQUFvQjtJQUNwQyx3RUFBd0UsR0FDeEUsQUFBZ0IsV0FBK0I7SUFDL0MsWUFDSSxPQUFlLEVBQ2YsR0FBYSxFQUVHLFFBRUEsUUFDbEI7UUFDRSxLQUFLLENBQUMsQ0FBQyxFQUFFLFFBQVEsRUFBRSxFQUFFLElBQUksVUFBVSxDQUFDLEVBQUUsRUFBRSxJQUFJLFdBQVcsQ0FBQyxDQUFDLENBQUM7c0JBSjFDO3VCQUVBO2FBYkosS0FBWSxLQUFLO1FBZ0I3QixJQUFJLENBQUMsSUFBSSxHQUFHO1FBQ1osSUFBSSxDQUFDLFVBQVUsR0FBRyxJQUFJLFVBQVU7UUFDaEMsSUFBSSxDQUFDLFdBQVcsR0FBRyxJQUFJLFdBQVc7UUFDbEMsSUFBSSxDQUFDLFVBQVUsR0FBRyxJQUFJLFVBQVUsSUFBSSxDQUFDO0lBQ3pDO0FBQ0osQ0FBQztBQUNELE9BQU8sU0FBUyxjQUNaLEdBQWEsRUFDYixNQUFjLEVBQ2QsT0FBZ0MsRUFDbEM7SUFDRSxPQUFRLElBQUksVUFBVTtRQUNsQixLQUFLO1lBQ0QsTUFDSTtZQUVKLEtBQU07UUFDVixLQUFLO1lBQ0QsTUFDSTtZQUVKLEtBQU07SUFDZDtJQUNBLE9BQU8sSUFBSSxZQUNQLENBQUMsU0FBUyxFQUFFLE9BQU8sU0FBUyxDQUFDLEVBQzdCLEtBQ0EsUUFDQTtBQUVSLENBQUM7QUFFRDs7Ozs7Ozs7Ozs7O0NBWUMsR0FDRCxPQUFPLE1BQU0sa0JBQWtCO0lBSVA7SUFIcEIsWUFDSSxPQUFlLEVBRUMsTUFDbEI7UUFDRSxLQUFLLENBQUM7cUJBRlU7UUFHaEIsSUFBSSxDQUFDLElBQUksR0FBRztJQUNoQjtBQUNKLENBQUM7QUFFRCxTQUFTLGdCQUNMLEdBQVksRUFDaUM7SUFDN0MsT0FDSSxPQUFPLFFBQVEsWUFDZixRQUFRLElBQUksSUFDWixZQUFZLE9BQ1osZ0JBQWdCO0FBRXhCO0FBQ0EsT0FBTyxTQUFTLFlBQVksTUFBYyxFQUFFLGFBQXNCLEVBQUU7SUFDaEUsT0FBTyxDQUFDLE1BQWlCO1FBQ3JCLElBQUksTUFBTSxDQUFDLHFCQUFxQixFQUFFLE9BQU8sU0FBUyxDQUFDO1FBQ25ELElBQUksZ0JBQWdCLE1BQU0sT0FBTyxDQUFDLEVBQUUsRUFBRSxJQUFJLE1BQU0sQ0FBQyxFQUFFLEVBQUUsSUFBSSxVQUFVLENBQUMsQ0FBQyxDQUFDO1FBQ3RFLElBQUksaUJBQWlCLGVBQWUsT0FBTyxPQUFPLENBQUMsQ0FBQyxFQUFFLElBQUksT0FBTyxDQUFDLENBQUM7UUFDbkUsTUFBTSxJQUFJLFVBQVUsS0FBSyxLQUFLO0lBQ2xDO0FBQ0osQ0FBQyJ9