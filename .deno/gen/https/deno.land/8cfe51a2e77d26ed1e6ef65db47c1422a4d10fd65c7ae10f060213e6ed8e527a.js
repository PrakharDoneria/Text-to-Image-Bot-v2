// === Needed imports
import { basename } from "https://deno.land/std@0.211.0/path/basename.ts";
import { debug as d, isDeno } from "./platform.deno.ts";
const debug = d("grammy:warn");
// === Export all API types
export * from "https://deno.land/x/grammy_types@v3.11.0/mod.ts";
// === InputFile handling and File augmenting
/**
 * An `InputFile` wraps a number of different sources for [sending
 * files](https://grammy.dev/guide/files.html#uploading-your-own-file).
 *
 * It corresponds to the `InputFile` type in the [Telegram Bot API
 * Reference](https://core.telegram.org/bots/api#inputfile).
 */ export class InputFile {
    consumed = false;
    fileData;
    /**
     * Optional name of the constructed `InputFile` instance.
     *
     * Check out the
     * [documentation](https://grammy.dev/guide/files.html#uploading-your-own-file)
     * on sending files with `InputFile`.
     */ filename;
    /**
     * Constructs an `InputFile` that can be used in the API to send files.
     *
     * @param file A path to a local file or a `Buffer` or a `ReadableStream` that specifies the file data
     * @param filename Optional name of the file
     */ constructor(file, filename){
        this.fileData = file;
        filename ??= this.guessFilename(file);
        this.filename = filename;
        if (typeof file === "string" && (file.startsWith("http:") || file.startsWith("https:"))) {
            debug(`InputFile received the local file path '${file}' that looks like a URL. Is this a mistake?`);
        }
    }
    guessFilename(file) {
        if (typeof file === "string") return basename(file);
        if ("url" in file) return basename(file.url);
        if (!(file instanceof URL)) return undefined;
        if (file.pathname !== "/") {
            const filename = basename(file.pathname);
            if (filename) return filename;
        }
        return basename(file.hostname);
    }
    /**
     * Internal method. Do not use.
     *
     * Converts this instance into a binary representation that can be sent to
     * the Bot API server in the request body.
     */ async toRaw() {
        if (this.consumed) {
            throw new Error("Cannot reuse InputFile data source!");
        }
        const data = this.fileData;
        // Handle local files
        if (typeof data === "string") {
            if (!isDeno) {
                throw new Error("Reading files by path requires a Deno environment");
            }
            const file = await Deno.open(data);
            return file.readable[Symbol.asyncIterator]();
        }
        if (data instanceof Blob) return data.stream();
        if (isDenoFile(data)) return data.readable[Symbol.asyncIterator]();
        // Handle Response objects
        if (data instanceof Response) {
            if (data.body === null) throw new Error(`No response body!`);
            return data.body;
        }
        // Handle URL and URLLike objects
        if (data instanceof URL) return await fetchFile(data);
        if ("url" in data) return await fetchFile(data.url);
        // Return buffers as-is
        if (data instanceof Uint8Array) return data;
        // Unwrap supplier functions
        if (typeof data === "function") {
            return new InputFile(await data()).toRaw();
        }
        // Mark streams and iterators as consumed and return them as-is
        this.consumed = true;
        return data;
    }
}
async function fetchFile(url) {
    const { body  } = await fetch(url);
    if (body === null) {
        throw new Error(`Download failed, no response body from '${url}'`);
    }
    return body[Symbol.asyncIterator]();
}
function isDenoFile(data) {
    return isDeno && data instanceof Deno.FsFile;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vZGVuby5sYW5kL3gvZ3JhbW15QHYxLjI3LjAvdHlwZXMuZGVuby50cyJdLCJzb3VyY2VzQ29udGVudCI6WyIvLyA9PT0gTmVlZGVkIGltcG9ydHNcbmltcG9ydCB7IGJhc2VuYW1lIH0gZnJvbSBcImh0dHBzOi8vZGVuby5sYW5kL3N0ZEAwLjIxMS4wL3BhdGgvYmFzZW5hbWUudHNcIjtcblxuaW1wb3J0IHtcbiAgICB0eXBlIEFwaU1ldGhvZHMgYXMgQXBpTWV0aG9kc0YsXG4gICAgdHlwZSBJbnB1dE1lZGlhIGFzIElucHV0TWVkaWFGLFxuICAgIHR5cGUgSW5wdXRNZWRpYUFuaW1hdGlvbiBhcyBJbnB1dE1lZGlhQW5pbWF0aW9uRixcbiAgICB0eXBlIElucHV0TWVkaWFBdWRpbyBhcyBJbnB1dE1lZGlhQXVkaW9GLFxuICAgIHR5cGUgSW5wdXRNZWRpYURvY3VtZW50IGFzIElucHV0TWVkaWFEb2N1bWVudEYsXG4gICAgdHlwZSBJbnB1dE1lZGlhUGhvdG8gYXMgSW5wdXRNZWRpYVBob3RvRixcbiAgICB0eXBlIElucHV0TWVkaWFWaWRlbyBhcyBJbnB1dE1lZGlhVmlkZW9GLFxuICAgIHR5cGUgSW5wdXRQYWlkTWVkaWEgYXMgSW5wdXRQYWlkTWVkaWFGLFxuICAgIHR5cGUgSW5wdXRQYWlkTWVkaWFQaG90byBhcyBJbnB1dFBhaWRNZWRpYVBob3RvRixcbiAgICB0eXBlIElucHV0UGFpZE1lZGlhVmlkZW8gYXMgSW5wdXRQYWlkTWVkaWFWaWRlb0YsXG4gICAgdHlwZSBJbnB1dFN0aWNrZXIgYXMgSW5wdXRTdGlja2VyRixcbiAgICB0eXBlIE9wdHMgYXMgT3B0c0YsXG59IGZyb20gXCJodHRwczovL2Rlbm8ubGFuZC94L2dyYW1teV90eXBlc0B2My4xMS4wL21vZC50c1wiO1xuaW1wb3J0IHsgZGVidWcgYXMgZCwgaXNEZW5vIH0gZnJvbSBcIi4vcGxhdGZvcm0uZGVuby50c1wiO1xuXG5jb25zdCBkZWJ1ZyA9IGQoXCJncmFtbXk6d2FyblwiKTtcblxuLy8gPT09IEV4cG9ydCBhbGwgQVBJIHR5cGVzXG5leHBvcnQgKiBmcm9tIFwiaHR0cHM6Ly9kZW5vLmxhbmQveC9ncmFtbXlfdHlwZXNAdjMuMTEuMC9tb2QudHNcIjtcblxuLyoqIEEgdmFsdWUsIG9yIGEgcG90ZW50aWFsbHkgYXN5bmMgZnVuY3Rpb24gc3VwcGx5aW5nIHRoYXQgdmFsdWUgKi9cbnR5cGUgTWF5YmVTdXBwbGllcjxUPiA9IFQgfCAoKCkgPT4gVCB8IFByb21pc2U8VD4pO1xuLyoqIFNvbWV0aGluZyB0aGF0IGxvb2tzIGxpa2UgYSBVUkwuICovXG5pbnRlcmZhY2UgVVJMTGlrZSB7XG4gICAgLyoqXG4gICAgICogSWRlbnRpZmllciBvZiB0aGUgcmVzb3VyY2UuIE11c3QgYmUgaW4gYSBmb3JtYXQgdGhhdCBjYW4gYmUgcGFyc2VkIGJ5IHRoZVxuICAgICAqIFVSTCBjb25zdHJ1Y3Rvci5cbiAgICAgKi9cbiAgICB1cmw6IHN0cmluZztcbn1cblxuLy8gPT09IElucHV0RmlsZSBoYW5kbGluZyBhbmQgRmlsZSBhdWdtZW50aW5nXG4vKipcbiAqIEFuIGBJbnB1dEZpbGVgIHdyYXBzIGEgbnVtYmVyIG9mIGRpZmZlcmVudCBzb3VyY2VzIGZvciBbc2VuZGluZ1xuICogZmlsZXNdKGh0dHBzOi8vZ3JhbW15LmRldi9ndWlkZS9maWxlcy5odG1sI3VwbG9hZGluZy15b3VyLW93bi1maWxlKS5cbiAqXG4gKiBJdCBjb3JyZXNwb25kcyB0byB0aGUgYElucHV0RmlsZWAgdHlwZSBpbiB0aGUgW1RlbGVncmFtIEJvdCBBUElcbiAqIFJlZmVyZW5jZV0oaHR0cHM6Ly9jb3JlLnRlbGVncmFtLm9yZy9ib3RzL2FwaSNpbnB1dGZpbGUpLlxuICovXG5leHBvcnQgY2xhc3MgSW5wdXRGaWxlIHtcbiAgICBwcml2YXRlIGNvbnN1bWVkID0gZmFsc2U7XG4gICAgcHJpdmF0ZSByZWFkb25seSBmaWxlRGF0YTogQ29uc3RydWN0b3JQYXJhbWV0ZXJzPHR5cGVvZiBJbnB1dEZpbGU+WzBdO1xuICAgIC8qKlxuICAgICAqIE9wdGlvbmFsIG5hbWUgb2YgdGhlIGNvbnN0cnVjdGVkIGBJbnB1dEZpbGVgIGluc3RhbmNlLlxuICAgICAqXG4gICAgICogQ2hlY2sgb3V0IHRoZVxuICAgICAqIFtkb2N1bWVudGF0aW9uXShodHRwczovL2dyYW1teS5kZXYvZ3VpZGUvZmlsZXMuaHRtbCN1cGxvYWRpbmcteW91ci1vd24tZmlsZSlcbiAgICAgKiBvbiBzZW5kaW5nIGZpbGVzIHdpdGggYElucHV0RmlsZWAuXG4gICAgICovXG4gICAgcHVibGljIHJlYWRvbmx5IGZpbGVuYW1lPzogc3RyaW5nO1xuICAgIC8qKlxuICAgICAqIENvbnN0cnVjdHMgYW4gYElucHV0RmlsZWAgdGhhdCBjYW4gYmUgdXNlZCBpbiB0aGUgQVBJIHRvIHNlbmQgZmlsZXMuXG4gICAgICpcbiAgICAgKiBAcGFyYW0gZmlsZSBBIHBhdGggdG8gYSBsb2NhbCBmaWxlIG9yIGEgYEJ1ZmZlcmAgb3IgYSBgUmVhZGFibGVTdHJlYW1gIHRoYXQgc3BlY2lmaWVzIHRoZSBmaWxlIGRhdGFcbiAgICAgKiBAcGFyYW0gZmlsZW5hbWUgT3B0aW9uYWwgbmFtZSBvZiB0aGUgZmlsZVxuICAgICAqL1xuICAgIGNvbnN0cnVjdG9yKFxuICAgICAgICBmaWxlOiBNYXliZVN1cHBsaWVyPFxuICAgICAgICAgICAgfCBzdHJpbmdcbiAgICAgICAgICAgIHwgQmxvYlxuICAgICAgICAgICAgfCBEZW5vLkZzRmlsZVxuICAgICAgICAgICAgfCBSZXNwb25zZVxuICAgICAgICAgICAgfCBVUkxcbiAgICAgICAgICAgIHwgVVJMTGlrZVxuICAgICAgICAgICAgfCBVaW50OEFycmF5XG4gICAgICAgICAgICB8IFJlYWRhYmxlU3RyZWFtPFVpbnQ4QXJyYXk+XG4gICAgICAgICAgICB8IEl0ZXJhYmxlPFVpbnQ4QXJyYXk+XG4gICAgICAgICAgICB8IEFzeW5jSXRlcmFibGU8VWludDhBcnJheT5cbiAgICAgICAgPixcbiAgICAgICAgZmlsZW5hbWU/OiBzdHJpbmcsXG4gICAgKSB7XG4gICAgICAgIHRoaXMuZmlsZURhdGEgPSBmaWxlO1xuICAgICAgICBmaWxlbmFtZSA/Pz0gdGhpcy5ndWVzc0ZpbGVuYW1lKGZpbGUpO1xuICAgICAgICB0aGlzLmZpbGVuYW1lID0gZmlsZW5hbWU7XG4gICAgICAgIGlmIChcbiAgICAgICAgICAgIHR5cGVvZiBmaWxlID09PSBcInN0cmluZ1wiICYmXG4gICAgICAgICAgICAoZmlsZS5zdGFydHNXaXRoKFwiaHR0cDpcIikgfHwgZmlsZS5zdGFydHNXaXRoKFwiaHR0cHM6XCIpKVxuICAgICAgICApIHtcbiAgICAgICAgICAgIGRlYnVnKFxuICAgICAgICAgICAgICAgIGBJbnB1dEZpbGUgcmVjZWl2ZWQgdGhlIGxvY2FsIGZpbGUgcGF0aCAnJHtmaWxlfScgdGhhdCBsb29rcyBsaWtlIGEgVVJMLiBJcyB0aGlzIGEgbWlzdGFrZT9gLFxuICAgICAgICAgICAgKTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBwcml2YXRlIGd1ZXNzRmlsZW5hbWUoXG4gICAgICAgIGZpbGU6IENvbnN0cnVjdG9yUGFyYW1ldGVyczx0eXBlb2YgSW5wdXRGaWxlPlswXSxcbiAgICApOiBzdHJpbmcgfCB1bmRlZmluZWQge1xuICAgICAgICBpZiAodHlwZW9mIGZpbGUgPT09IFwic3RyaW5nXCIpIHJldHVybiBiYXNlbmFtZShmaWxlKTtcbiAgICAgICAgaWYgKFwidXJsXCIgaW4gZmlsZSkgcmV0dXJuIGJhc2VuYW1lKGZpbGUudXJsKTtcbiAgICAgICAgaWYgKCEoZmlsZSBpbnN0YW5jZW9mIFVSTCkpIHJldHVybiB1bmRlZmluZWQ7XG4gICAgICAgIGlmIChmaWxlLnBhdGhuYW1lICE9PSBcIi9cIikge1xuICAgICAgICAgICAgY29uc3QgZmlsZW5hbWUgPSBiYXNlbmFtZShmaWxlLnBhdGhuYW1lKTtcbiAgICAgICAgICAgIGlmIChmaWxlbmFtZSkgcmV0dXJuIGZpbGVuYW1lO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBiYXNlbmFtZShmaWxlLmhvc3RuYW1lKTtcbiAgICB9XG4gICAgLyoqXG4gICAgICogSW50ZXJuYWwgbWV0aG9kLiBEbyBub3QgdXNlLlxuICAgICAqXG4gICAgICogQ29udmVydHMgdGhpcyBpbnN0YW5jZSBpbnRvIGEgYmluYXJ5IHJlcHJlc2VudGF0aW9uIHRoYXQgY2FuIGJlIHNlbnQgdG9cbiAgICAgKiB0aGUgQm90IEFQSSBzZXJ2ZXIgaW4gdGhlIHJlcXVlc3QgYm9keS5cbiAgICAgKi9cbiAgICBhc3luYyB0b1JhdygpOiBQcm9taXNlPFxuICAgICAgICBVaW50OEFycmF5IHwgSXRlcmFibGU8VWludDhBcnJheT4gfCBBc3luY0l0ZXJhYmxlPFVpbnQ4QXJyYXk+XG4gICAgPiB7XG4gICAgICAgIGlmICh0aGlzLmNvbnN1bWVkKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJDYW5ub3QgcmV1c2UgSW5wdXRGaWxlIGRhdGEgc291cmNlIVwiKTtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCBkYXRhID0gdGhpcy5maWxlRGF0YTtcbiAgICAgICAgLy8gSGFuZGxlIGxvY2FsIGZpbGVzXG4gICAgICAgIGlmICh0eXBlb2YgZGF0YSA9PT0gXCJzdHJpbmdcIikge1xuICAgICAgICAgICAgaWYgKCFpc0Rlbm8pIHtcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXG4gICAgICAgICAgICAgICAgICAgIFwiUmVhZGluZyBmaWxlcyBieSBwYXRoIHJlcXVpcmVzIGEgRGVubyBlbnZpcm9ubWVudFwiLFxuICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjb25zdCBmaWxlID0gYXdhaXQgRGVuby5vcGVuKGRhdGEpO1xuICAgICAgICAgICAgcmV0dXJuIGZpbGUucmVhZGFibGVbU3ltYm9sLmFzeW5jSXRlcmF0b3JdKCk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGRhdGEgaW5zdGFuY2VvZiBCbG9iKSByZXR1cm4gZGF0YS5zdHJlYW0oKTtcbiAgICAgICAgaWYgKGlzRGVub0ZpbGUoZGF0YSkpIHJldHVybiBkYXRhLnJlYWRhYmxlW1N5bWJvbC5hc3luY0l0ZXJhdG9yXSgpO1xuICAgICAgICAvLyBIYW5kbGUgUmVzcG9uc2Ugb2JqZWN0c1xuICAgICAgICBpZiAoZGF0YSBpbnN0YW5jZW9mIFJlc3BvbnNlKSB7XG4gICAgICAgICAgICBpZiAoZGF0YS5ib2R5ID09PSBudWxsKSB0aHJvdyBuZXcgRXJyb3IoYE5vIHJlc3BvbnNlIGJvZHkhYCk7XG4gICAgICAgICAgICByZXR1cm4gZGF0YS5ib2R5O1xuICAgICAgICB9XG4gICAgICAgIC8vIEhhbmRsZSBVUkwgYW5kIFVSTExpa2Ugb2JqZWN0c1xuICAgICAgICBpZiAoZGF0YSBpbnN0YW5jZW9mIFVSTCkgcmV0dXJuIGF3YWl0IGZldGNoRmlsZShkYXRhKTtcbiAgICAgICAgaWYgKFwidXJsXCIgaW4gZGF0YSkgcmV0dXJuIGF3YWl0IGZldGNoRmlsZShkYXRhLnVybCk7XG4gICAgICAgIC8vIFJldHVybiBidWZmZXJzIGFzLWlzXG4gICAgICAgIGlmIChkYXRhIGluc3RhbmNlb2YgVWludDhBcnJheSkgcmV0dXJuIGRhdGE7XG4gICAgICAgIC8vIFVud3JhcCBzdXBwbGllciBmdW5jdGlvbnNcbiAgICAgICAgaWYgKHR5cGVvZiBkYXRhID09PSBcImZ1bmN0aW9uXCIpIHtcbiAgICAgICAgICAgIHJldHVybiBuZXcgSW5wdXRGaWxlKGF3YWl0IGRhdGEoKSkudG9SYXcoKTtcbiAgICAgICAgfVxuICAgICAgICAvLyBNYXJrIHN0cmVhbXMgYW5kIGl0ZXJhdG9ycyBhcyBjb25zdW1lZCBhbmQgcmV0dXJuIHRoZW0gYXMtaXNcbiAgICAgICAgdGhpcy5jb25zdW1lZCA9IHRydWU7XG4gICAgICAgIHJldHVybiBkYXRhO1xuICAgIH1cbn1cblxuYXN5bmMgZnVuY3Rpb24gZmV0Y2hGaWxlKFxuICAgIHVybDogc3RyaW5nIHwgVVJMLFxuKTogUHJvbWlzZTxBc3luY0l0ZXJhYmxlPFVpbnQ4QXJyYXk+PiB7XG4gICAgY29uc3QgeyBib2R5IH0gPSBhd2FpdCBmZXRjaCh1cmwpO1xuICAgIGlmIChib2R5ID09PSBudWxsKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihgRG93bmxvYWQgZmFpbGVkLCBubyByZXNwb25zZSBib2R5IGZyb20gJyR7dXJsfSdgKTtcbiAgICB9XG4gICAgcmV0dXJuIGJvZHlbU3ltYm9sLmFzeW5jSXRlcmF0b3JdKCk7XG59XG5mdW5jdGlvbiBpc0Rlbm9GaWxlKGRhdGE6IHVua25vd24pOiBkYXRhIGlzIERlbm8uRnNGaWxlIHtcbiAgICByZXR1cm4gaXNEZW5vICYmIGRhdGEgaW5zdGFuY2VvZiBEZW5vLkZzRmlsZTtcbn1cblxuLy8gPT09IEV4cG9ydCBJbnB1dEZpbGUgdHlwZXNcbi8qKiBXcmFwcGVyIHR5cGUgdG8gYnVuZGxlIGFsbCBtZXRob2RzIG9mIHRoZSBUZWxlZ3JhbSBBUEkgKi9cbmV4cG9ydCB0eXBlIEFwaU1ldGhvZHMgPSBBcGlNZXRob2RzRjxJbnB1dEZpbGU+O1xuXG4vKiogVXRpbGl0eSB0eXBlIHByb3ZpZGluZyB0aGUgYXJndW1lbnQgdHlwZSBmb3IgdGhlIGdpdmVuIG1ldGhvZCBuYW1lIG9yIGB7fWAgaWYgdGhlIG1ldGhvZCBkb2VzIG5vdCB0YWtlIGFueSBwYXJhbWV0ZXJzICovXG5leHBvcnQgdHlwZSBPcHRzPE0gZXh0ZW5kcyBrZXlvZiBBcGlNZXRob2RzPiA9IE9wdHNGPElucHV0RmlsZT5bTV07XG5cbi8qKiBUaGlzIG9iamVjdCBkZXNjcmliZXMgYSBzdGlja2VyIHRvIGJlIGFkZGVkIHRvIGEgc3RpY2tlciBzZXQuICovXG5leHBvcnQgdHlwZSBJbnB1dFN0aWNrZXIgPSBJbnB1dFN0aWNrZXJGPElucHV0RmlsZT47XG5cbi8qKiBUaGlzIG9iamVjdCByZXByZXNlbnRzIHRoZSBjb250ZW50IG9mIGEgbWVkaWEgbWVzc2FnZSB0byBiZSBzZW50LiBJdCBzaG91bGQgYmUgb25lIG9mXG4tIElucHV0TWVkaWFBbmltYXRpb25cbi0gSW5wdXRNZWRpYURvY3VtZW50XG4tIElucHV0TWVkaWFBdWRpb1xuLSBJbnB1dE1lZGlhUGhvdG9cbi0gSW5wdXRNZWRpYVZpZGVvICovXG5leHBvcnQgdHlwZSBJbnB1dE1lZGlhID0gSW5wdXRNZWRpYUY8SW5wdXRGaWxlPjtcbi8qKiBSZXByZXNlbnRzIGEgcGhvdG8gdG8gYmUgc2VudC4gKi9cbmV4cG9ydCB0eXBlIElucHV0TWVkaWFQaG90byA9IElucHV0TWVkaWFQaG90b0Y8SW5wdXRGaWxlPjtcbi8qKiBSZXByZXNlbnRzIGEgdmlkZW8gdG8gYmUgc2VudC4gKi9cbmV4cG9ydCB0eXBlIElucHV0TWVkaWFWaWRlbyA9IElucHV0TWVkaWFWaWRlb0Y8SW5wdXRGaWxlPjtcbi8qKiBSZXByZXNlbnRzIGFuIGFuaW1hdGlvbiBmaWxlIChHSUYgb3IgSC4yNjQvTVBFRy00IEFWQyB2aWRlbyB3aXRob3V0IHNvdW5kKSB0byBiZSBzZW50LiAqL1xuZXhwb3J0IHR5cGUgSW5wdXRNZWRpYUFuaW1hdGlvbiA9IElucHV0TWVkaWFBbmltYXRpb25GPElucHV0RmlsZT47XG4vKiogUmVwcmVzZW50cyBhbiBhdWRpbyBmaWxlIHRvIGJlIHRyZWF0ZWQgYXMgbXVzaWMgdG8gYmUgc2VudC4gKi9cbmV4cG9ydCB0eXBlIElucHV0TWVkaWFBdWRpbyA9IElucHV0TWVkaWFBdWRpb0Y8SW5wdXRGaWxlPjtcbi8qKiBSZXByZXNlbnRzIGEgZ2VuZXJhbCBmaWxlIHRvIGJlIHNlbnQuICovXG5leHBvcnQgdHlwZSBJbnB1dE1lZGlhRG9jdW1lbnQgPSBJbnB1dE1lZGlhRG9jdW1lbnRGPElucHV0RmlsZT47XG4vKiogVGhpcyBvYmplY3QgZGVzY3JpYmVzIHRoZSBwYWlkIG1lZGlhIHRvIGJlIHNlbnQuIEN1cnJlbnRseSwgaXQgY2FuIGJlIG9uZSBvZlxuLSBJbnB1dFBhaWRNZWRpYVBob3RvXG4tIElucHV0UGFpZE1lZGlhVmlkZW8gKi9cbmV4cG9ydCB0eXBlIElucHV0UGFpZE1lZGlhID0gSW5wdXRQYWlkTWVkaWFGPElucHV0RmlsZT47XG4vKiogVGhlIHBhaWQgbWVkaWEgdG8gc2VuZCBpcyBhIHBob3RvLiAqL1xuZXhwb3J0IHR5cGUgSW5wdXRQYWlkTWVkaWFQaG90byA9IElucHV0UGFpZE1lZGlhUGhvdG9GPElucHV0RmlsZT47XG4vKiogVGhlIHBhaWQgbWVkaWEgdG8gc2VuZCBpcyBhIHZpZGVvLiAqL1xuZXhwb3J0IHR5cGUgSW5wdXRQYWlkTWVkaWFWaWRlbyA9IElucHV0UGFpZE1lZGlhVmlkZW9GPElucHV0RmlsZT47XG4iXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEscUJBQXFCO0FBQ3JCLFNBQVMsUUFBUSxRQUFRLGlEQUFpRDtBQWdCMUUsU0FBUyxTQUFTLENBQUMsRUFBRSxNQUFNLFFBQVEscUJBQXFCO0FBRXhELE1BQU0sUUFBUSxFQUFFO0FBRWhCLDJCQUEyQjtBQUMzQixjQUFjLGtEQUFrRDtBQWFoRSw2Q0FBNkM7QUFDN0M7Ozs7OztDQU1DLEdBQ0QsT0FBTyxNQUFNO0lBQ0QsV0FBVyxLQUFLLENBQUM7SUFDUixTQUFxRDtJQUN0RTs7Ozs7O0tBTUMsR0FDRCxBQUFnQixTQUFrQjtJQUNsQzs7Ozs7S0FLQyxHQUNELFlBQ0ksSUFXQyxFQUNELFFBQWlCLENBQ25CO1FBQ0UsSUFBSSxDQUFDLFFBQVEsR0FBRztRQUNoQixhQUFhLElBQUksQ0FBQyxhQUFhLENBQUM7UUFDaEMsSUFBSSxDQUFDLFFBQVEsR0FBRztRQUNoQixJQUNJLE9BQU8sU0FBUyxZQUNoQixDQUFDLEtBQUssVUFBVSxDQUFDLFlBQVksS0FBSyxVQUFVLENBQUMsU0FBUyxHQUN4RDtZQUNFLE1BQ0ksQ0FBQyx3Q0FBd0MsRUFBRSxLQUFLLDJDQUEyQyxDQUFDO1FBRXBHLENBQUM7SUFDTDtJQUNRLGNBQ0osSUFBZ0QsRUFDOUI7UUFDbEIsSUFBSSxPQUFPLFNBQVMsVUFBVSxPQUFPLFNBQVM7UUFDOUMsSUFBSSxTQUFTLE1BQU0sT0FBTyxTQUFTLEtBQUssR0FBRztRQUMzQyxJQUFJLENBQUMsQ0FBQyxnQkFBZ0IsR0FBRyxHQUFHLE9BQU87UUFDbkMsSUFBSSxLQUFLLFFBQVEsS0FBSyxLQUFLO1lBQ3ZCLE1BQU0sV0FBVyxTQUFTLEtBQUssUUFBUTtZQUN2QyxJQUFJLFVBQVUsT0FBTztRQUN6QixDQUFDO1FBQ0QsT0FBTyxTQUFTLEtBQUssUUFBUTtJQUNqQztJQUNBOzs7OztLQUtDLEdBQ0QsTUFBTSxRQUVKO1FBQ0UsSUFBSSxJQUFJLENBQUMsUUFBUSxFQUFFO1lBQ2YsTUFBTSxJQUFJLE1BQU0sdUNBQXVDO1FBQzNELENBQUM7UUFDRCxNQUFNLE9BQU8sSUFBSSxDQUFDLFFBQVE7UUFDMUIscUJBQXFCO1FBQ3JCLElBQUksT0FBTyxTQUFTLFVBQVU7WUFDMUIsSUFBSSxDQUFDLFFBQVE7Z0JBQ1QsTUFBTSxJQUFJLE1BQ04scURBQ0Y7WUFDTixDQUFDO1lBQ0QsTUFBTSxPQUFPLE1BQU0sS0FBSyxJQUFJLENBQUM7WUFDN0IsT0FBTyxLQUFLLFFBQVEsQ0FBQyxPQUFPLGFBQWEsQ0FBQztRQUM5QyxDQUFDO1FBQ0QsSUFBSSxnQkFBZ0IsTUFBTSxPQUFPLEtBQUssTUFBTTtRQUM1QyxJQUFJLFdBQVcsT0FBTyxPQUFPLEtBQUssUUFBUSxDQUFDLE9BQU8sYUFBYSxDQUFDO1FBQ2hFLDBCQUEwQjtRQUMxQixJQUFJLGdCQUFnQixVQUFVO1lBQzFCLElBQUksS0FBSyxJQUFJLEtBQUssSUFBSSxFQUFFLE1BQU0sSUFBSSxNQUFNLENBQUMsaUJBQWlCLENBQUMsRUFBRTtZQUM3RCxPQUFPLEtBQUssSUFBSTtRQUNwQixDQUFDO1FBQ0QsaUNBQWlDO1FBQ2pDLElBQUksZ0JBQWdCLEtBQUssT0FBTyxNQUFNLFVBQVU7UUFDaEQsSUFBSSxTQUFTLE1BQU0sT0FBTyxNQUFNLFVBQVUsS0FBSyxHQUFHO1FBQ2xELHVCQUF1QjtRQUN2QixJQUFJLGdCQUFnQixZQUFZLE9BQU87UUFDdkMsNEJBQTRCO1FBQzVCLElBQUksT0FBTyxTQUFTLFlBQVk7WUFDNUIsT0FBTyxJQUFJLFVBQVUsTUFBTSxRQUFRLEtBQUs7UUFDNUMsQ0FBQztRQUNELCtEQUErRDtRQUMvRCxJQUFJLENBQUMsUUFBUSxHQUFHLElBQUk7UUFDcEIsT0FBTztJQUNYO0FBQ0osQ0FBQztBQUVELGVBQWUsVUFDWCxHQUFpQixFQUNpQjtJQUNsQyxNQUFNLEVBQUUsS0FBSSxFQUFFLEdBQUcsTUFBTSxNQUFNO0lBQzdCLElBQUksU0FBUyxJQUFJLEVBQUU7UUFDZixNQUFNLElBQUksTUFBTSxDQUFDLHdDQUF3QyxFQUFFLElBQUksQ0FBQyxDQUFDLEVBQUU7SUFDdkUsQ0FBQztJQUNELE9BQU8sSUFBSSxDQUFDLE9BQU8sYUFBYSxDQUFDO0FBQ3JDO0FBQ0EsU0FBUyxXQUFXLElBQWEsRUFBdUI7SUFDcEQsT0FBTyxVQUFVLGdCQUFnQixLQUFLLE1BQU07QUFDaEQifQ==