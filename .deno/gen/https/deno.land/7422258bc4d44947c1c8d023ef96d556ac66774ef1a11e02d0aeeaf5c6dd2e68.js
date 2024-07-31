import { itrToStream } from "../platform.deno.ts";
import { InputFile } from "../types.ts";
// === Payload types (JSON vs. form data)
/**
 * Determines for a given payload if it may be sent as JSON, or if it has to be
 * uploaded via multipart/form-data. Returns `true` in the latter case and
 * `false` in the former.
 *
 * @param payload The payload to analyze
 */ export function requiresFormDataUpload(payload) {
    return payload instanceof InputFile || typeof payload === "object" && payload !== null && Object.values(payload).some((v)=>Array.isArray(v) ? v.some(requiresFormDataUpload) : v instanceof InputFile || requiresFormDataUpload(v));
}
/**
 * Calls `JSON.stringify` but removes `null` values from objects before
 * serialization
 *
 * @param value value
 * @returns stringified value
 */ function str(value) {
    return JSON.stringify(value, (_, v)=>v ?? undefined);
}
/**
 * Turns a payload into an options object that can be passed to a `fetch` call
 * by setting the necessary headers and method. May only be called for payloads
 * `P` that let `requiresFormDataUpload(P)` return `false`.
 *
 * @param payload The payload to wrap
 */ export function createJsonPayload(payload) {
    return {
        method: "POST",
        headers: {
            "content-type": "application/json",
            connection: "keep-alive"
        },
        body: str(payload)
    };
}
async function* protectItr(itr, onError) {
    try {
        yield* itr;
    } catch (err) {
        onError(err);
    }
}
/**
 * Turns a payload into an options object that can be passed to a `fetch` call
 * by setting the necessary headers and method. Note that this method creates a
 * multipart/form-data stream under the hood. If possible, a JSON payload should
 * be created instead for performance reasons.
 *
 * @param payload The payload to wrap
 */ export function createFormDataPayload(payload, onError) {
    const boundary = createBoundary();
    const itr = payloadToMultipartItr(payload, boundary);
    const safeItr = protectItr(itr, onError);
    const stream = itrToStream(safeItr);
    return {
        method: "POST",
        headers: {
            "content-type": `multipart/form-data; boundary=${boundary}`,
            connection: "keep-alive"
        },
        body: stream
    };
}
// === Form data creation
function createBoundary() {
    // Taken from Deno std lib
    return "----------" + randomId(32);
}
function randomId(length = 16) {
    return Array.from(Array(length)).map(()=>Math.random().toString(36)[2] || 0).join("");
}
const enc = new TextEncoder();
/**
 * Takes a payload object and produces a valid multipart/form-data stream. The
 * stream is an iterator of `Uint8Array` objects. You also need to specify the
 * boundary string that was used in the Content-Type header of the HTTP request.
 *
 * @param payload a payload object
 * @param boundary the boundary string to use between the parts
 */ async function* payloadToMultipartItr(payload, boundary) {
    const files = extractFiles(payload);
    // Start multipart/form-data protocol
    yield enc.encode(`--${boundary}\r\n`);
    // Send all payload fields
    const separator = enc.encode(`\r\n--${boundary}\r\n`);
    let first = true;
    for (const [key, value] of Object.entries(payload)){
        if (value == null) continue;
        if (!first) yield separator;
        yield valuePart(key, typeof value === "object" ? str(value) : value);
        first = false;
    }
    // Send all files
    for (const { id , origin , file  } of files){
        if (!first) yield separator;
        yield* filePart(id, origin, file);
        first = false;
    }
    // End multipart/form-data protocol
    yield enc.encode(`\r\n--${boundary}--\r\n`);
}
/**
 * Replaces all instances of `InputFile` in a given payload by attach://
 * strings. This alters the passed object. After calling this method, the
 * payload object can be stringified.
 *
 * Returns a list of `InputFile` instances along with the random identifiers
 * that were used in the corresponding attach:// strings, as well as the origin
 * keys of the original payload object.
 *
 * @param value a payload object, or a part of it
 * @param key the origin key of the payload object, if a part of it is passed
 * @returns the cleaned payload object
 */ function extractFiles(value) {
    if (typeof value !== "object" || value === null) return [];
    return Object.entries(value).flatMap(([k, v])=>{
        if (Array.isArray(v)) return v.flatMap((p)=>extractFiles(p));
        else if (v instanceof InputFile) {
            const id = randomId();
            // Overwrite `InputFile` instance with attach:// string
            Object.assign(value, {
                [k]: `attach://${id}`
            });
            const origin = k === "media" && "type" in value && typeof value.type === "string" ? value.type // use `type` for `InputMedia*`
             : k; // use property key otherwise
            return {
                id,
                origin,
                file: v
            };
        } else return extractFiles(v);
    });
}
/** Turns a regular value into a `Uint8Array` */ function valuePart(key, value) {
    return enc.encode(`content-disposition:form-data;name="${key}"\r\n\r\n${value}`);
}
/** Turns an InputFile into a generator of `Uint8Array`s */ async function* filePart(id, origin, input) {
    const filename = input.filename || `${origin}.${getExt(origin)}`;
    if (filename.includes("\r") || filename.includes("\n")) {
        throw new Error(`File paths cannot contain carriage-return (\\r) \
or newline (\\n) characters! Filename for property '${origin}' was:
"""
${filename}
"""`);
    }
    yield enc.encode(`content-disposition:form-data;name="${id}";filename=${filename}\r\ncontent-type:application/octet-stream\r\n\r\n`);
    const data = await input.toRaw();
    if (data instanceof Uint8Array) yield data;
    else yield* data;
}
/** Returns the default file extension for an API property name */ function getExt(key) {
    switch(key){
        case "certificate":
            return "pem";
        case "photo":
        case "thumbnail":
            return "jpg";
        case "voice":
            return "ogg";
        case "audio":
            return "mp3";
        case "animation":
        case "video":
        case "video_note":
            return "mp4";
        case "sticker":
            return "webp";
        default:
            return "dat";
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vZGVuby5sYW5kL3gvZ3JhbW15QHYxLjI3LjAvY29yZS9wYXlsb2FkLnRzIl0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IGl0clRvU3RyZWFtIH0gZnJvbSBcIi4uL3BsYXRmb3JtLmRlbm8udHNcIjtcbmltcG9ydCB7IElucHV0RmlsZSB9IGZyb20gXCIuLi90eXBlcy50c1wiO1xuXG4vLyA9PT0gUGF5bG9hZCB0eXBlcyAoSlNPTiB2cy4gZm9ybSBkYXRhKVxuLyoqXG4gKiBEZXRlcm1pbmVzIGZvciBhIGdpdmVuIHBheWxvYWQgaWYgaXQgbWF5IGJlIHNlbnQgYXMgSlNPTiwgb3IgaWYgaXQgaGFzIHRvIGJlXG4gKiB1cGxvYWRlZCB2aWEgbXVsdGlwYXJ0L2Zvcm0tZGF0YS4gUmV0dXJucyBgdHJ1ZWAgaW4gdGhlIGxhdHRlciBjYXNlIGFuZFxuICogYGZhbHNlYCBpbiB0aGUgZm9ybWVyLlxuICpcbiAqIEBwYXJhbSBwYXlsb2FkIFRoZSBwYXlsb2FkIHRvIGFuYWx5emVcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHJlcXVpcmVzRm9ybURhdGFVcGxvYWQocGF5bG9hZDogdW5rbm93bik6IGJvb2xlYW4ge1xuICAgIHJldHVybiBwYXlsb2FkIGluc3RhbmNlb2YgSW5wdXRGaWxlIHx8IChcbiAgICAgICAgdHlwZW9mIHBheWxvYWQgPT09IFwib2JqZWN0XCIgJiZcbiAgICAgICAgcGF5bG9hZCAhPT0gbnVsbCAmJlxuICAgICAgICBPYmplY3QudmFsdWVzKHBheWxvYWQpLnNvbWUoKHYpID0+XG4gICAgICAgICAgICBBcnJheS5pc0FycmF5KHYpXG4gICAgICAgICAgICAgICAgPyB2LnNvbWUocmVxdWlyZXNGb3JtRGF0YVVwbG9hZClcbiAgICAgICAgICAgICAgICA6IHYgaW5zdGFuY2VvZiBJbnB1dEZpbGUgfHwgcmVxdWlyZXNGb3JtRGF0YVVwbG9hZCh2KVxuICAgICAgICApXG4gICAgKTtcbn1cbi8qKlxuICogQ2FsbHMgYEpTT04uc3RyaW5naWZ5YCBidXQgcmVtb3ZlcyBgbnVsbGAgdmFsdWVzIGZyb20gb2JqZWN0cyBiZWZvcmVcbiAqIHNlcmlhbGl6YXRpb25cbiAqXG4gKiBAcGFyYW0gdmFsdWUgdmFsdWVcbiAqIEByZXR1cm5zIHN0cmluZ2lmaWVkIHZhbHVlXG4gKi9cbmZ1bmN0aW9uIHN0cih2YWx1ZTogdW5rbm93bikge1xuICAgIHJldHVybiBKU09OLnN0cmluZ2lmeSh2YWx1ZSwgKF8sIHYpID0+IHYgPz8gdW5kZWZpbmVkKTtcbn1cbi8qKlxuICogVHVybnMgYSBwYXlsb2FkIGludG8gYW4gb3B0aW9ucyBvYmplY3QgdGhhdCBjYW4gYmUgcGFzc2VkIHRvIGEgYGZldGNoYCBjYWxsXG4gKiBieSBzZXR0aW5nIHRoZSBuZWNlc3NhcnkgaGVhZGVycyBhbmQgbWV0aG9kLiBNYXkgb25seSBiZSBjYWxsZWQgZm9yIHBheWxvYWRzXG4gKiBgUGAgdGhhdCBsZXQgYHJlcXVpcmVzRm9ybURhdGFVcGxvYWQoUClgIHJldHVybiBgZmFsc2VgLlxuICpcbiAqIEBwYXJhbSBwYXlsb2FkIFRoZSBwYXlsb2FkIHRvIHdyYXBcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZUpzb25QYXlsb2FkKHBheWxvYWQ6IFJlY29yZDxzdHJpbmcsIHVua25vd24+KSB7XG4gICAgcmV0dXJuIHtcbiAgICAgICAgbWV0aG9kOiBcIlBPU1RcIixcbiAgICAgICAgaGVhZGVyczoge1xuICAgICAgICAgICAgXCJjb250ZW50LXR5cGVcIjogXCJhcHBsaWNhdGlvbi9qc29uXCIsXG4gICAgICAgICAgICBjb25uZWN0aW9uOiBcImtlZXAtYWxpdmVcIixcbiAgICAgICAgfSxcbiAgICAgICAgYm9keTogc3RyKHBheWxvYWQpLFxuICAgIH07XG59XG5hc3luYyBmdW5jdGlvbiogcHJvdGVjdEl0cjxUPihcbiAgICBpdHI6IEFzeW5jSXRlcmFibGVJdGVyYXRvcjxUPixcbiAgICBvbkVycm9yOiAoZXJyOiB1bmtub3duKSA9PiB2b2lkLFxuKSB7XG4gICAgdHJ5IHtcbiAgICAgICAgeWllbGQqIGl0cjtcbiAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgICAgb25FcnJvcihlcnIpO1xuICAgIH1cbn1cbi8qKlxuICogVHVybnMgYSBwYXlsb2FkIGludG8gYW4gb3B0aW9ucyBvYmplY3QgdGhhdCBjYW4gYmUgcGFzc2VkIHRvIGEgYGZldGNoYCBjYWxsXG4gKiBieSBzZXR0aW5nIHRoZSBuZWNlc3NhcnkgaGVhZGVycyBhbmQgbWV0aG9kLiBOb3RlIHRoYXQgdGhpcyBtZXRob2QgY3JlYXRlcyBhXG4gKiBtdWx0aXBhcnQvZm9ybS1kYXRhIHN0cmVhbSB1bmRlciB0aGUgaG9vZC4gSWYgcG9zc2libGUsIGEgSlNPTiBwYXlsb2FkIHNob3VsZFxuICogYmUgY3JlYXRlZCBpbnN0ZWFkIGZvciBwZXJmb3JtYW5jZSByZWFzb25zLlxuICpcbiAqIEBwYXJhbSBwYXlsb2FkIFRoZSBwYXlsb2FkIHRvIHdyYXBcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZUZvcm1EYXRhUGF5bG9hZChcbiAgICBwYXlsb2FkOiBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPixcbiAgICBvbkVycm9yOiAoZXJyOiB1bmtub3duKSA9PiB2b2lkLFxuKSB7XG4gICAgY29uc3QgYm91bmRhcnkgPSBjcmVhdGVCb3VuZGFyeSgpO1xuICAgIGNvbnN0IGl0ciA9IHBheWxvYWRUb011bHRpcGFydEl0cihwYXlsb2FkLCBib3VuZGFyeSk7XG4gICAgY29uc3Qgc2FmZUl0ciA9IHByb3RlY3RJdHIoaXRyLCBvbkVycm9yKTtcbiAgICBjb25zdCBzdHJlYW0gPSBpdHJUb1N0cmVhbShzYWZlSXRyKTtcbiAgICByZXR1cm4ge1xuICAgICAgICBtZXRob2Q6IFwiUE9TVFwiLFxuICAgICAgICBoZWFkZXJzOiB7XG4gICAgICAgICAgICBcImNvbnRlbnQtdHlwZVwiOiBgbXVsdGlwYXJ0L2Zvcm0tZGF0YTsgYm91bmRhcnk9JHtib3VuZGFyeX1gLFxuICAgICAgICAgICAgY29ubmVjdGlvbjogXCJrZWVwLWFsaXZlXCIsXG4gICAgICAgIH0sXG4gICAgICAgIGJvZHk6IHN0cmVhbSxcbiAgICB9O1xufVxuXG4vLyA9PT0gRm9ybSBkYXRhIGNyZWF0aW9uXG5mdW5jdGlvbiBjcmVhdGVCb3VuZGFyeSgpIHtcbiAgICAvLyBUYWtlbiBmcm9tIERlbm8gc3RkIGxpYlxuICAgIHJldHVybiBcIi0tLS0tLS0tLS1cIiArIHJhbmRvbUlkKDMyKTtcbn1cbmZ1bmN0aW9uIHJhbmRvbUlkKGxlbmd0aCA9IDE2KSB7XG4gICAgcmV0dXJuIEFycmF5LmZyb20oQXJyYXkobGVuZ3RoKSlcbiAgICAgICAgLm1hcCgoKSA9PiBNYXRoLnJhbmRvbSgpLnRvU3RyaW5nKDM2KVsyXSB8fCAwKVxuICAgICAgICAuam9pbihcIlwiKTtcbn1cblxuY29uc3QgZW5jID0gbmV3IFRleHRFbmNvZGVyKCk7XG4vKipcbiAqIFRha2VzIGEgcGF5bG9hZCBvYmplY3QgYW5kIHByb2R1Y2VzIGEgdmFsaWQgbXVsdGlwYXJ0L2Zvcm0tZGF0YSBzdHJlYW0uIFRoZVxuICogc3RyZWFtIGlzIGFuIGl0ZXJhdG9yIG9mIGBVaW50OEFycmF5YCBvYmplY3RzLiBZb3UgYWxzbyBuZWVkIHRvIHNwZWNpZnkgdGhlXG4gKiBib3VuZGFyeSBzdHJpbmcgdGhhdCB3YXMgdXNlZCBpbiB0aGUgQ29udGVudC1UeXBlIGhlYWRlciBvZiB0aGUgSFRUUCByZXF1ZXN0LlxuICpcbiAqIEBwYXJhbSBwYXlsb2FkIGEgcGF5bG9hZCBvYmplY3RcbiAqIEBwYXJhbSBib3VuZGFyeSB0aGUgYm91bmRhcnkgc3RyaW5nIHRvIHVzZSBiZXR3ZWVuIHRoZSBwYXJ0c1xuICovXG5hc3luYyBmdW5jdGlvbiogcGF5bG9hZFRvTXVsdGlwYXJ0SXRyKFxuICAgIHBheWxvYWQ6IFJlY29yZDxzdHJpbmcsIHVua25vd24+LFxuICAgIGJvdW5kYXJ5OiBzdHJpbmcsXG4pOiBBc3luY0l0ZXJhYmxlSXRlcmF0b3I8VWludDhBcnJheT4ge1xuICAgIGNvbnN0IGZpbGVzID0gZXh0cmFjdEZpbGVzKHBheWxvYWQpO1xuICAgIC8vIFN0YXJ0IG11bHRpcGFydC9mb3JtLWRhdGEgcHJvdG9jb2xcbiAgICB5aWVsZCBlbmMuZW5jb2RlKGAtLSR7Ym91bmRhcnl9XFxyXFxuYCk7XG4gICAgLy8gU2VuZCBhbGwgcGF5bG9hZCBmaWVsZHNcbiAgICBjb25zdCBzZXBhcmF0b3IgPSBlbmMuZW5jb2RlKGBcXHJcXG4tLSR7Ym91bmRhcnl9XFxyXFxuYCk7XG4gICAgbGV0IGZpcnN0ID0gdHJ1ZTtcbiAgICBmb3IgKGNvbnN0IFtrZXksIHZhbHVlXSBvZiBPYmplY3QuZW50cmllcyhwYXlsb2FkKSkge1xuICAgICAgICBpZiAodmFsdWUgPT0gbnVsbCkgY29udGludWU7XG4gICAgICAgIGlmICghZmlyc3QpIHlpZWxkIHNlcGFyYXRvcjtcbiAgICAgICAgeWllbGQgdmFsdWVQYXJ0KGtleSwgdHlwZW9mIHZhbHVlID09PSBcIm9iamVjdFwiID8gc3RyKHZhbHVlKSA6IHZhbHVlKTtcbiAgICAgICAgZmlyc3QgPSBmYWxzZTtcbiAgICB9XG4gICAgLy8gU2VuZCBhbGwgZmlsZXNcbiAgICBmb3IgKGNvbnN0IHsgaWQsIG9yaWdpbiwgZmlsZSB9IG9mIGZpbGVzKSB7XG4gICAgICAgIGlmICghZmlyc3QpIHlpZWxkIHNlcGFyYXRvcjtcbiAgICAgICAgeWllbGQqIGZpbGVQYXJ0KGlkLCBvcmlnaW4sIGZpbGUpO1xuICAgICAgICBmaXJzdCA9IGZhbHNlO1xuICAgIH1cbiAgICAvLyBFbmQgbXVsdGlwYXJ0L2Zvcm0tZGF0YSBwcm90b2NvbFxuICAgIHlpZWxkIGVuYy5lbmNvZGUoYFxcclxcbi0tJHtib3VuZGFyeX0tLVxcclxcbmApO1xufVxuXG4vKiogSW5mb3JtYXRpb24gYWJvdXQgYSBmaWxlIGV4dHJhY3RlZCBmcm9tIGEgcGF5bG9hZCAqL1xudHlwZSBFeHRyYWN0ZWRGaWxlID0ge1xuICAgIC8qKiBUbyBiZSB1c2VkIGluIHRoZSBhdHRhY2g6Ly8gc3RyaW5nICovXG4gICAgaWQ6IHN0cmluZztcbiAgICAvKiogSGludHMgYWJvdXQgd2hlcmUgdGhlIGZpbGUgY2FtZSBmcm9tLCB1c2VmdWwgZm9yIGZpbGVuYW1lIGd1ZXNzaW5nICovXG4gICAgb3JpZ2luOiBzdHJpbmc7XG4gICAgLyoqIFRoZSBleHRyYWN0ZWQgZmlsZSAqL1xuICAgIGZpbGU6IElucHV0RmlsZTtcbn07XG4vKipcbiAqIFJlcGxhY2VzIGFsbCBpbnN0YW5jZXMgb2YgYElucHV0RmlsZWAgaW4gYSBnaXZlbiBwYXlsb2FkIGJ5IGF0dGFjaDovL1xuICogc3RyaW5ncy4gVGhpcyBhbHRlcnMgdGhlIHBhc3NlZCBvYmplY3QuIEFmdGVyIGNhbGxpbmcgdGhpcyBtZXRob2QsIHRoZVxuICogcGF5bG9hZCBvYmplY3QgY2FuIGJlIHN0cmluZ2lmaWVkLlxuICpcbiAqIFJldHVybnMgYSBsaXN0IG9mIGBJbnB1dEZpbGVgIGluc3RhbmNlcyBhbG9uZyB3aXRoIHRoZSByYW5kb20gaWRlbnRpZmllcnNcbiAqIHRoYXQgd2VyZSB1c2VkIGluIHRoZSBjb3JyZXNwb25kaW5nIGF0dGFjaDovLyBzdHJpbmdzLCBhcyB3ZWxsIGFzIHRoZSBvcmlnaW5cbiAqIGtleXMgb2YgdGhlIG9yaWdpbmFsIHBheWxvYWQgb2JqZWN0LlxuICpcbiAqIEBwYXJhbSB2YWx1ZSBhIHBheWxvYWQgb2JqZWN0LCBvciBhIHBhcnQgb2YgaXRcbiAqIEBwYXJhbSBrZXkgdGhlIG9yaWdpbiBrZXkgb2YgdGhlIHBheWxvYWQgb2JqZWN0LCBpZiBhIHBhcnQgb2YgaXQgaXMgcGFzc2VkXG4gKiBAcmV0dXJucyB0aGUgY2xlYW5lZCBwYXlsb2FkIG9iamVjdFxuICovXG5mdW5jdGlvbiBleHRyYWN0RmlsZXModmFsdWU6IHVua25vd24pOiBFeHRyYWN0ZWRGaWxlW10ge1xuICAgIGlmICh0eXBlb2YgdmFsdWUgIT09IFwib2JqZWN0XCIgfHwgdmFsdWUgPT09IG51bGwpIHJldHVybiBbXTtcbiAgICByZXR1cm4gT2JqZWN0LmVudHJpZXModmFsdWUpLmZsYXRNYXAoKFtrLCB2XSkgPT4ge1xuICAgICAgICBpZiAoQXJyYXkuaXNBcnJheSh2KSkgcmV0dXJuIHYuZmxhdE1hcCgocCkgPT4gZXh0cmFjdEZpbGVzKHApKTtcbiAgICAgICAgZWxzZSBpZiAodiBpbnN0YW5jZW9mIElucHV0RmlsZSkge1xuICAgICAgICAgICAgY29uc3QgaWQgPSByYW5kb21JZCgpO1xuICAgICAgICAgICAgLy8gT3ZlcndyaXRlIGBJbnB1dEZpbGVgIGluc3RhbmNlIHdpdGggYXR0YWNoOi8vIHN0cmluZ1xuICAgICAgICAgICAgT2JqZWN0LmFzc2lnbih2YWx1ZSwgeyBba106IGBhdHRhY2g6Ly8ke2lkfWAgfSk7XG4gICAgICAgICAgICBjb25zdCBvcmlnaW4gPSBrID09PSBcIm1lZGlhXCIgJiZcbiAgICAgICAgICAgICAgICAgICAgXCJ0eXBlXCIgaW4gdmFsdWUgJiYgdHlwZW9mIHZhbHVlLnR5cGUgPT09IFwic3RyaW5nXCJcbiAgICAgICAgICAgICAgICA/IHZhbHVlLnR5cGUgLy8gdXNlIGB0eXBlYCBmb3IgYElucHV0TWVkaWEqYFxuICAgICAgICAgICAgICAgIDogazsgLy8gdXNlIHByb3BlcnR5IGtleSBvdGhlcndpc2VcbiAgICAgICAgICAgIHJldHVybiB7IGlkLCBvcmlnaW4sIGZpbGU6IHYgfTtcbiAgICAgICAgfSBlbHNlIHJldHVybiBleHRyYWN0RmlsZXModik7XG4gICAgfSk7XG59XG5cbi8qKiBUdXJucyBhIHJlZ3VsYXIgdmFsdWUgaW50byBhIGBVaW50OEFycmF5YCAqL1xuZnVuY3Rpb24gdmFsdWVQYXJ0KGtleTogc3RyaW5nLCB2YWx1ZTogdW5rbm93bik6IFVpbnQ4QXJyYXkge1xuICAgIHJldHVybiBlbmMuZW5jb2RlKFxuICAgICAgICBgY29udGVudC1kaXNwb3NpdGlvbjpmb3JtLWRhdGE7bmFtZT1cIiR7a2V5fVwiXFxyXFxuXFxyXFxuJHt2YWx1ZX1gLFxuICAgICk7XG59XG4vKiogVHVybnMgYW4gSW5wdXRGaWxlIGludG8gYSBnZW5lcmF0b3Igb2YgYFVpbnQ4QXJyYXlgcyAqL1xuYXN5bmMgZnVuY3Rpb24qIGZpbGVQYXJ0KFxuICAgIGlkOiBzdHJpbmcsXG4gICAgb3JpZ2luOiBzdHJpbmcsXG4gICAgaW5wdXQ6IElucHV0RmlsZSxcbik6IEFzeW5jSXRlcmFibGVJdGVyYXRvcjxVaW50OEFycmF5PiB7XG4gICAgY29uc3QgZmlsZW5hbWUgPSBpbnB1dC5maWxlbmFtZSB8fCBgJHtvcmlnaW59LiR7Z2V0RXh0KG9yaWdpbil9YDtcbiAgICBpZiAoZmlsZW5hbWUuaW5jbHVkZXMoXCJcXHJcIikgfHwgZmlsZW5hbWUuaW5jbHVkZXMoXCJcXG5cIikpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKFxuICAgICAgICAgICAgYEZpbGUgcGF0aHMgY2Fubm90IGNvbnRhaW4gY2FycmlhZ2UtcmV0dXJuIChcXFxccikgXFxcbm9yIG5ld2xpbmUgKFxcXFxuKSBjaGFyYWN0ZXJzISBGaWxlbmFtZSBmb3IgcHJvcGVydHkgJyR7b3JpZ2lufScgd2FzOlxuXCJcIlwiXG4ke2ZpbGVuYW1lfVxuXCJcIlwiYCxcbiAgICAgICAgKTtcbiAgICB9XG4gICAgeWllbGQgZW5jLmVuY29kZShcbiAgICAgICAgYGNvbnRlbnQtZGlzcG9zaXRpb246Zm9ybS1kYXRhO25hbWU9XCIke2lkfVwiO2ZpbGVuYW1lPSR7ZmlsZW5hbWV9XFxyXFxuY29udGVudC10eXBlOmFwcGxpY2F0aW9uL29jdGV0LXN0cmVhbVxcclxcblxcclxcbmAsXG4gICAgKTtcbiAgICBjb25zdCBkYXRhID0gYXdhaXQgaW5wdXQudG9SYXcoKTtcbiAgICBpZiAoZGF0YSBpbnN0YW5jZW9mIFVpbnQ4QXJyYXkpIHlpZWxkIGRhdGE7XG4gICAgZWxzZSB5aWVsZCogZGF0YTtcbn1cbi8qKiBSZXR1cm5zIHRoZSBkZWZhdWx0IGZpbGUgZXh0ZW5zaW9uIGZvciBhbiBBUEkgcHJvcGVydHkgbmFtZSAqL1xuZnVuY3Rpb24gZ2V0RXh0KGtleTogc3RyaW5nKSB7XG4gICAgc3dpdGNoIChrZXkpIHtcbiAgICAgICAgY2FzZSBcImNlcnRpZmljYXRlXCI6XG4gICAgICAgICAgICByZXR1cm4gXCJwZW1cIjtcbiAgICAgICAgY2FzZSBcInBob3RvXCI6XG4gICAgICAgIGNhc2UgXCJ0aHVtYm5haWxcIjpcbiAgICAgICAgICAgIHJldHVybiBcImpwZ1wiO1xuICAgICAgICBjYXNlIFwidm9pY2VcIjpcbiAgICAgICAgICAgIHJldHVybiBcIm9nZ1wiO1xuICAgICAgICBjYXNlIFwiYXVkaW9cIjpcbiAgICAgICAgICAgIHJldHVybiBcIm1wM1wiO1xuICAgICAgICBjYXNlIFwiYW5pbWF0aW9uXCI6XG4gICAgICAgIGNhc2UgXCJ2aWRlb1wiOlxuICAgICAgICBjYXNlIFwidmlkZW9fbm90ZVwiOlxuICAgICAgICAgICAgcmV0dXJuIFwibXA0XCI7XG4gICAgICAgIGNhc2UgXCJzdGlja2VyXCI6XG4gICAgICAgICAgICByZXR1cm4gXCJ3ZWJwXCI7XG4gICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgICByZXR1cm4gXCJkYXRcIjtcbiAgICB9XG59XG4iXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsU0FBUyxXQUFXLFFBQVEsc0JBQXNCO0FBQ2xELFNBQVMsU0FBUyxRQUFRLGNBQWM7QUFFeEMseUNBQXlDO0FBQ3pDOzs7Ozs7Q0FNQyxHQUNELE9BQU8sU0FBUyx1QkFBdUIsT0FBZ0IsRUFBVztJQUM5RCxPQUFPLG1CQUFtQixhQUN0QixPQUFPLFlBQVksWUFDbkIsWUFBWSxJQUFJLElBQ2hCLE9BQU8sTUFBTSxDQUFDLFNBQVMsSUFBSSxDQUFDLENBQUMsSUFDekIsTUFBTSxPQUFPLENBQUMsS0FDUixFQUFFLElBQUksQ0FBQywwQkFDUCxhQUFhLGFBQWEsdUJBQXVCLEVBQUU7QUFHckUsQ0FBQztBQUNEOzs7Ozs7Q0FNQyxHQUNELFNBQVMsSUFBSSxLQUFjLEVBQUU7SUFDekIsT0FBTyxLQUFLLFNBQVMsQ0FBQyxPQUFPLENBQUMsR0FBRyxJQUFNLEtBQUs7QUFDaEQ7QUFDQTs7Ozs7O0NBTUMsR0FDRCxPQUFPLFNBQVMsa0JBQWtCLE9BQWdDLEVBQUU7SUFDaEUsT0FBTztRQUNILFFBQVE7UUFDUixTQUFTO1lBQ0wsZ0JBQWdCO1lBQ2hCLFlBQVk7UUFDaEI7UUFDQSxNQUFNLElBQUk7SUFDZDtBQUNKLENBQUM7QUFDRCxnQkFBZ0IsV0FDWixHQUE2QixFQUM3QixPQUErQixFQUNqQztJQUNFLElBQUk7UUFDQSxPQUFPO0lBQ1gsRUFBRSxPQUFPLEtBQUs7UUFDVixRQUFRO0lBQ1o7QUFDSjtBQUNBOzs7Ozs7O0NBT0MsR0FDRCxPQUFPLFNBQVMsc0JBQ1osT0FBZ0MsRUFDaEMsT0FBK0IsRUFDakM7SUFDRSxNQUFNLFdBQVc7SUFDakIsTUFBTSxNQUFNLHNCQUFzQixTQUFTO0lBQzNDLE1BQU0sVUFBVSxXQUFXLEtBQUs7SUFDaEMsTUFBTSxTQUFTLFlBQVk7SUFDM0IsT0FBTztRQUNILFFBQVE7UUFDUixTQUFTO1lBQ0wsZ0JBQWdCLENBQUMsOEJBQThCLEVBQUUsU0FBUyxDQUFDO1lBQzNELFlBQVk7UUFDaEI7UUFDQSxNQUFNO0lBQ1Y7QUFDSixDQUFDO0FBRUQseUJBQXlCO0FBQ3pCLFNBQVMsaUJBQWlCO0lBQ3RCLDBCQUEwQjtJQUMxQixPQUFPLGVBQWUsU0FBUztBQUNuQztBQUNBLFNBQVMsU0FBUyxTQUFTLEVBQUUsRUFBRTtJQUMzQixPQUFPLE1BQU0sSUFBSSxDQUFDLE1BQU0sU0FDbkIsR0FBRyxDQUFDLElBQU0sS0FBSyxNQUFNLEdBQUcsUUFBUSxDQUFDLEdBQUcsQ0FBQyxFQUFFLElBQUksR0FDM0MsSUFBSSxDQUFDO0FBQ2Q7QUFFQSxNQUFNLE1BQU0sSUFBSTtBQUNoQjs7Ozs7OztDQU9DLEdBQ0QsZ0JBQWdCLHNCQUNaLE9BQWdDLEVBQ2hDLFFBQWdCLEVBQ2lCO0lBQ2pDLE1BQU0sUUFBUSxhQUFhO0lBQzNCLHFDQUFxQztJQUNyQyxNQUFNLElBQUksTUFBTSxDQUFDLENBQUMsRUFBRSxFQUFFLFNBQVMsSUFBSSxDQUFDO0lBQ3BDLDBCQUEwQjtJQUMxQixNQUFNLFlBQVksSUFBSSxNQUFNLENBQUMsQ0FBQyxNQUFNLEVBQUUsU0FBUyxJQUFJLENBQUM7SUFDcEQsSUFBSSxRQUFRLElBQUk7SUFDaEIsS0FBSyxNQUFNLENBQUMsS0FBSyxNQUFNLElBQUksT0FBTyxPQUFPLENBQUMsU0FBVTtRQUNoRCxJQUFJLFNBQVMsSUFBSSxFQUFFLFFBQVM7UUFDNUIsSUFBSSxDQUFDLE9BQU8sTUFBTTtRQUNsQixNQUFNLFVBQVUsS0FBSyxPQUFPLFVBQVUsV0FBVyxJQUFJLFNBQVMsS0FBSztRQUNuRSxRQUFRLEtBQUs7SUFDakI7SUFDQSxpQkFBaUI7SUFDakIsS0FBSyxNQUFNLEVBQUUsR0FBRSxFQUFFLE9BQU0sRUFBRSxLQUFJLEVBQUUsSUFBSSxNQUFPO1FBQ3RDLElBQUksQ0FBQyxPQUFPLE1BQU07UUFDbEIsT0FBTyxTQUFTLElBQUksUUFBUTtRQUM1QixRQUFRLEtBQUs7SUFDakI7SUFDQSxtQ0FBbUM7SUFDbkMsTUFBTSxJQUFJLE1BQU0sQ0FBQyxDQUFDLE1BQU0sRUFBRSxTQUFTLE1BQU0sQ0FBQztBQUM5QztBQVdBOzs7Ozs7Ozs7Ozs7Q0FZQyxHQUNELFNBQVMsYUFBYSxLQUFjLEVBQW1CO0lBQ25ELElBQUksT0FBTyxVQUFVLFlBQVksVUFBVSxJQUFJLEVBQUUsT0FBTyxFQUFFO0lBQzFELE9BQU8sT0FBTyxPQUFPLENBQUMsT0FBTyxPQUFPLENBQUMsQ0FBQyxDQUFDLEdBQUcsRUFBRSxHQUFLO1FBQzdDLElBQUksTUFBTSxPQUFPLENBQUMsSUFBSSxPQUFPLEVBQUUsT0FBTyxDQUFDLENBQUMsSUFBTSxhQUFhO2FBQ3RELElBQUksYUFBYSxXQUFXO1lBQzdCLE1BQU0sS0FBSztZQUNYLHVEQUF1RDtZQUN2RCxPQUFPLE1BQU0sQ0FBQyxPQUFPO2dCQUFFLENBQUMsRUFBRSxFQUFFLENBQUMsU0FBUyxFQUFFLEdBQUcsQ0FBQztZQUFDO1lBQzdDLE1BQU0sU0FBUyxNQUFNLFdBQ2IsVUFBVSxTQUFTLE9BQU8sTUFBTSxJQUFJLEtBQUssV0FDM0MsTUFBTSxJQUFJLENBQUMsK0JBQStCO2VBQzFDLENBQUMsRUFBRSw2QkFBNkI7WUFDdEMsT0FBTztnQkFBRTtnQkFBSTtnQkFBUSxNQUFNO1lBQUU7UUFDakMsT0FBTyxPQUFPLGFBQWE7SUFDL0I7QUFDSjtBQUVBLDhDQUE4QyxHQUM5QyxTQUFTLFVBQVUsR0FBVyxFQUFFLEtBQWMsRUFBYztJQUN4RCxPQUFPLElBQUksTUFBTSxDQUNiLENBQUMsb0NBQW9DLEVBQUUsSUFBSSxTQUFTLEVBQUUsTUFBTSxDQUFDO0FBRXJFO0FBQ0EseURBQXlELEdBQ3pELGdCQUFnQixTQUNaLEVBQVUsRUFDVixNQUFjLEVBQ2QsS0FBZ0IsRUFDaUI7SUFDakMsTUFBTSxXQUFXLE1BQU0sUUFBUSxJQUFJLENBQUMsRUFBRSxPQUFPLENBQUMsRUFBRSxPQUFPLFFBQVEsQ0FBQztJQUNoRSxJQUFJLFNBQVMsUUFBUSxDQUFDLFNBQVMsU0FBUyxRQUFRLENBQUMsT0FBTztRQUNwRCxNQUFNLElBQUksTUFDTixDQUFDO29EQUN1QyxFQUFFLE9BQU87O0FBRTdELEVBQUUsU0FBUztHQUNSLENBQUMsRUFDTTtJQUNOLENBQUM7SUFDRCxNQUFNLElBQUksTUFBTSxDQUNaLENBQUMsb0NBQW9DLEVBQUUsR0FBRyxXQUFXLEVBQUUsU0FBUyxpREFBaUQsQ0FBQztJQUV0SCxNQUFNLE9BQU8sTUFBTSxNQUFNLEtBQUs7SUFDOUIsSUFBSSxnQkFBZ0IsWUFBWSxNQUFNO1NBQ2pDLE9BQU87QUFDaEI7QUFDQSxnRUFBZ0UsR0FDaEUsU0FBUyxPQUFPLEdBQVcsRUFBRTtJQUN6QixPQUFRO1FBQ0osS0FBSztZQUNELE9BQU87UUFDWCxLQUFLO1FBQ0wsS0FBSztZQUNELE9BQU87UUFDWCxLQUFLO1lBQ0QsT0FBTztRQUNYLEtBQUs7WUFDRCxPQUFPO1FBQ1gsS0FBSztRQUNMLEtBQUs7UUFDTCxLQUFLO1lBQ0QsT0FBTztRQUNYLEtBQUs7WUFDRCxPQUFPO1FBQ1g7WUFDSSxPQUFPO0lBQ2Y7QUFDSiJ9