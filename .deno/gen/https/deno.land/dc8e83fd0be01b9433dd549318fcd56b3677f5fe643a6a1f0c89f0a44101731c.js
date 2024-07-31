// deno-lint-ignore-file no-explicit-any
import { debug as d, defaultAdapter } from "../platform.deno.ts";
import { adapters as nativeAdapters } from "./frameworks.ts";
const debugErr = d("grammy:error");
const callbackAdapter = (update, callback, header, unauthorized = ()=>callback('"unauthorized"'))=>({
        update: Promise.resolve(update),
        respond: callback,
        header,
        unauthorized
    });
const adapters = {
    ...nativeAdapters,
    callback: callbackAdapter
};
export function webhookCallback(bot, adapter = defaultAdapter, onTimeout, timeoutMilliseconds, secretToken) {
    const { onTimeout: timeout = "throw" , timeoutMilliseconds: ms = 10_000 , secretToken: token  } = typeof onTimeout === "object" ? onTimeout : {
        onTimeout,
        timeoutMilliseconds,
        secretToken
    };
    let initialized = false;
    const server = typeof adapter === "string" ? adapters[adapter] : adapter;
    return async (...args)=>{
        const { update , respond , unauthorized , end , handlerReturn , header  } = server(...args);
        if (!initialized) {
            // Will dedupe concurrently incoming calls from several updates
            await bot.init();
            initialized = true;
        }
        if (header !== token) {
            await unauthorized();
            // TODO: investigate deno bug that happens when this console logging is removed
            console.log(handlerReturn);
            return handlerReturn;
        }
        let usedWebhookReply = false;
        const webhookReplyEnvelope = {
            async send (json) {
                usedWebhookReply = true;
                await respond(json);
            }
        };
        await timeoutIfNecessary(bot.handleUpdate(await update, webhookReplyEnvelope), typeof timeout === "function" ? ()=>timeout(...args) : timeout, ms);
        if (!usedWebhookReply) end?.();
        return handlerReturn;
    };
}
function timeoutIfNecessary(task, onTimeout, timeout) {
    if (timeout === Infinity) return task;
    return new Promise((resolve, reject)=>{
        const handle = setTimeout(()=>{
            if (onTimeout === "throw") {
                reject(new Error(`Request timed out after ${timeout} ms`));
            } else {
                if (typeof onTimeout === "function") onTimeout();
                resolve();
            }
            const now = Date.now();
            task.finally(()=>{
                const diff = Date.now() - now;
                debugErr(`Request completed ${diff} ms after timeout!`);
            });
        }, timeout);
        task.then(resolve).catch(reject).finally(()=>clearTimeout(handle));
    });
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vZGVuby5sYW5kL3gvZ3JhbW15QHYxLjI3LjAvY29udmVuaWVuY2Uvd2ViaG9vay50cyJdLCJzb3VyY2VzQ29udGVudCI6WyIvLyBkZW5vLWxpbnQtaWdub3JlLWZpbGUgbm8tZXhwbGljaXQtYW55XG5pbXBvcnQgeyB0eXBlIEJvdCB9IGZyb20gXCIuLi9ib3QudHNcIjtcbmltcG9ydCB7IHR5cGUgQ29udGV4dCB9IGZyb20gXCIuLi9jb250ZXh0LnRzXCI7XG5pbXBvcnQgeyB0eXBlIFdlYmhvb2tSZXBseUVudmVsb3BlIH0gZnJvbSBcIi4uL2NvcmUvY2xpZW50LnRzXCI7XG5pbXBvcnQgeyBkZWJ1ZyBhcyBkLCBkZWZhdWx0QWRhcHRlciB9IGZyb20gXCIuLi9wbGF0Zm9ybS5kZW5vLnRzXCI7XG5pbXBvcnQgeyB0eXBlIFVwZGF0ZSB9IGZyb20gXCIuLi90eXBlcy50c1wiO1xuaW1wb3J0IHtcbiAgICBhZGFwdGVycyBhcyBuYXRpdmVBZGFwdGVycyxcbiAgICB0eXBlIEZyYW1ld29ya0FkYXB0ZXIsXG59IGZyb20gXCIuL2ZyYW1ld29ya3MudHNcIjtcbmNvbnN0IGRlYnVnRXJyID0gZChcImdyYW1teTplcnJvclwiKTtcblxuY29uc3QgY2FsbGJhY2tBZGFwdGVyOiBGcmFtZXdvcmtBZGFwdGVyID0gKFxuICAgIHVwZGF0ZTogVXBkYXRlLFxuICAgIGNhbGxiYWNrOiAoanNvbjogc3RyaW5nKSA9PiB1bmtub3duLFxuICAgIGhlYWRlcjogc3RyaW5nLFxuICAgIHVuYXV0aG9yaXplZCA9ICgpID0+IGNhbGxiYWNrKCdcInVuYXV0aG9yaXplZFwiJyksXG4pID0+ICh7XG4gICAgdXBkYXRlOiBQcm9taXNlLnJlc29sdmUodXBkYXRlKSxcbiAgICByZXNwb25kOiBjYWxsYmFjayxcbiAgICBoZWFkZXIsXG4gICAgdW5hdXRob3JpemVkLFxufSk7XG5jb25zdCBhZGFwdGVycyA9IHsgLi4ubmF0aXZlQWRhcHRlcnMsIGNhbGxiYWNrOiBjYWxsYmFja0FkYXB0ZXIgfTtcblxuZXhwb3J0IGludGVyZmFjZSBXZWJob29rT3B0aW9ucyB7XG4gICAgLyoqIEFuIG9wdGlvbmFsIHN0cmF0ZWd5IHRvIGhhbmRsZSB0aW1lb3V0cyAoZGVmYXVsdDogJ3Rocm93JykgKi9cbiAgICBvblRpbWVvdXQ/OiBcInRocm93XCIgfCBcInJldHVyblwiIHwgKCguLi5hcmdzOiBhbnlbXSkgPT4gdW5rbm93bik7XG4gICAgLyoqIEFuIG9wdGlvbmFsIG51bWJlciBvZiB0aW1lb3V0IG1pbGxpc2Vjb25kcyAoZGVmYXVsdDogMTBfMDAwKSAqL1xuICAgIHRpbWVvdXRNaWxsaXNlY29uZHM/OiBudW1iZXI7XG4gICAgLyoqIEFuIG9wdGlvbmFsIHN0cmluZyB0byBjb21wYXJlIHRvIFgtVGVsZWdyYW0tQm90LUFwaS1TZWNyZXQtVG9rZW4gKi9cbiAgICBzZWNyZXRUb2tlbj86IHN0cmluZztcbn1cblxudHlwZSBBZGFwdGVycyA9IHR5cGVvZiBhZGFwdGVycztcbnR5cGUgQWRhcHRlck5hbWVzID0ga2V5b2YgQWRhcHRlcnM7XG50eXBlIFJlc29sdmVOYW1lPEEgZXh0ZW5kcyBGcmFtZXdvcmtBZGFwdGVyIHwgQWRhcHRlck5hbWVzPiA9IEEgZXh0ZW5kc1xuICAgIEFkYXB0ZXJOYW1lcyA/IEFkYXB0ZXJzW0FdIDogQTtcblxuLyoqXG4gKiBDcmVhdGVzIGEgY2FsbGJhY2sgZnVuY3Rpb24gdGhhdCB5b3UgY2FuIHBhc3MgdG8gYSB3ZWIgZnJhbWV3b3JrIChzdWNoIGFzXG4gKiBleHByZXNzKSBpZiB5b3Ugd2FudCB0byBydW4geW91ciBib3QgdmlhIHdlYmhvb2tzLiBVc2UgaXQgbGlrZSB0aGlzOlxuICogYGBgdHNcbiAqIGNvbnN0IGFwcCA9IGV4cHJlc3MoKSAvLyBvciB3aGF0ZXZlciB5b3UncmUgdXNpbmdcbiAqIGNvbnN0IGJvdCA9IG5ldyBCb3QoJzx0b2tlbj4nKVxuICpcbiAqIGFwcC51c2Uod2ViaG9va0NhbGxiYWNrKGJvdCwgJ2V4cHJlc3MnKSlcbiAqIGBgYFxuICpcbiAqIENvbmZlciB0aGUgZ3JhbW1ZXG4gKiBbZG9jdW1lbnRhdGlvbl0oaHR0cHM6Ly9ncmFtbXkuZGV2L2d1aWRlL2RlcGxveW1lbnQtdHlwZXMuaHRtbCkgdG8gcmVhZCBtb3JlXG4gKiBhYm91dCBob3cgdG8gcnVuIHlvdXIgYm90IHdpdGggd2ViaG9va3MuXG4gKlxuICogQHBhcmFtIGJvdCBUaGUgYm90IGZvciB3aGljaCB0byBjcmVhdGUgYSBjYWxsYmFja1xuICogQHBhcmFtIGFkYXB0ZXIgQW4gb3B0aW9uYWwgc3RyaW5nIGlkZW50aWZ5aW5nIHRoZSBmcmFtZXdvcmsgKGRlZmF1bHQ6ICdleHByZXNzJylcbiAqIEBwYXJhbSB3ZWJob29rT3B0aW9ucyBGdXJ0aGVyIG9wdGlvbnMgZm9yIHRoZSB3ZWJob29rIHNldHVwXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiB3ZWJob29rQ2FsbGJhY2s8XG4gICAgQyBleHRlbmRzIENvbnRleHQgPSBDb250ZXh0LFxuICAgIEEgZXh0ZW5kcyBGcmFtZXdvcmtBZGFwdGVyIHwgQWRhcHRlck5hbWVzID0gRnJhbWV3b3JrQWRhcHRlciB8IEFkYXB0ZXJOYW1lcyxcbj4oXG4gICAgYm90OiBCb3Q8Qz4sXG4gICAgYWRhcHRlcjogQSxcbiAgICB3ZWJob29rT3B0aW9ucz86IFdlYmhvb2tPcHRpb25zLFxuKTogKFxuICAgIC4uLmFyZ3M6IFBhcmFtZXRlcnM8UmVzb2x2ZU5hbWU8QT4+XG4pID0+IFJldHVyblR5cGU8UmVzb2x2ZU5hbWU8QT4+W1wiaGFuZGxlclJldHVyblwiXSBleHRlbmRzIHVuZGVmaW5lZFxuICAgID8gUHJvbWlzZTx2b2lkPlxuICAgIDogTm9uTnVsbGFibGU8UmV0dXJuVHlwZTxSZXNvbHZlTmFtZTxBPj5bXCJoYW5kbGVyUmV0dXJuXCJdPjtcbmV4cG9ydCBmdW5jdGlvbiB3ZWJob29rQ2FsbGJhY2s8XG4gICAgQyBleHRlbmRzIENvbnRleHQgPSBDb250ZXh0LFxuICAgIEEgZXh0ZW5kcyBGcmFtZXdvcmtBZGFwdGVyIHwgQWRhcHRlck5hbWVzID0gRnJhbWV3b3JrQWRhcHRlciB8IEFkYXB0ZXJOYW1lcyxcbj4oXG4gICAgYm90OiBCb3Q8Qz4sXG4gICAgYWRhcHRlcjogQSxcbiAgICBvblRpbWVvdXQ/OiBXZWJob29rT3B0aW9uc1tcIm9uVGltZW91dFwiXSxcbiAgICB0aW1lb3V0TWlsbGlzZWNvbmRzPzogV2ViaG9va09wdGlvbnNbXCJ0aW1lb3V0TWlsbGlzZWNvbmRzXCJdLFxuICAgIHNlY3JldFRva2VuPzogV2ViaG9va09wdGlvbnNbXCJzZWNyZXRUb2tlblwiXSxcbik6IChcbiAgICAuLi5hcmdzOiBQYXJhbWV0ZXJzPFJlc29sdmVOYW1lPEE+PlxuKSA9PiBSZXR1cm5UeXBlPFJlc29sdmVOYW1lPEE+PltcImhhbmRsZXJSZXR1cm5cIl0gZXh0ZW5kcyB1bmRlZmluZWRcbiAgICA/IFByb21pc2U8dm9pZD5cbiAgICA6IE5vbk51bGxhYmxlPFJldHVyblR5cGU8UmVzb2x2ZU5hbWU8QT4+W1wiaGFuZGxlclJldHVyblwiXT47XG5leHBvcnQgZnVuY3Rpb24gd2ViaG9va0NhbGxiYWNrPEMgZXh0ZW5kcyBDb250ZXh0ID0gQ29udGV4dD4oXG4gICAgYm90OiBCb3Q8Qz4sXG4gICAgYWRhcHRlcjogRnJhbWV3b3JrQWRhcHRlciB8IEFkYXB0ZXJOYW1lcyA9IGRlZmF1bHRBZGFwdGVyLFxuICAgIG9uVGltZW91dD86XG4gICAgICAgIHwgV2ViaG9va09wdGlvbnNcbiAgICAgICAgfCBXZWJob29rT3B0aW9uc1tcIm9uVGltZW91dFwiXSxcbiAgICB0aW1lb3V0TWlsbGlzZWNvbmRzPzogV2ViaG9va09wdGlvbnNbXCJ0aW1lb3V0TWlsbGlzZWNvbmRzXCJdLFxuICAgIHNlY3JldFRva2VuPzogV2ViaG9va09wdGlvbnNbXCJzZWNyZXRUb2tlblwiXSxcbikge1xuICAgIGNvbnN0IHtcbiAgICAgICAgb25UaW1lb3V0OiB0aW1lb3V0ID0gXCJ0aHJvd1wiLFxuICAgICAgICB0aW1lb3V0TWlsbGlzZWNvbmRzOiBtcyA9IDEwXzAwMCxcbiAgICAgICAgc2VjcmV0VG9rZW46IHRva2VuLFxuICAgIH0gPSB0eXBlb2Ygb25UaW1lb3V0ID09PSBcIm9iamVjdFwiXG4gICAgICAgID8gb25UaW1lb3V0XG4gICAgICAgIDogeyBvblRpbWVvdXQsIHRpbWVvdXRNaWxsaXNlY29uZHMsIHNlY3JldFRva2VuIH07XG4gICAgbGV0IGluaXRpYWxpemVkID0gZmFsc2U7XG4gICAgY29uc3Qgc2VydmVyOiBGcmFtZXdvcmtBZGFwdGVyID0gdHlwZW9mIGFkYXB0ZXIgPT09IFwic3RyaW5nXCJcbiAgICAgICAgPyBhZGFwdGVyc1thZGFwdGVyXVxuICAgICAgICA6IGFkYXB0ZXI7XG4gICAgcmV0dXJuIGFzeW5jICguLi5hcmdzOiBhbnlbXSkgPT4ge1xuICAgICAgICBjb25zdCB7IHVwZGF0ZSwgcmVzcG9uZCwgdW5hdXRob3JpemVkLCBlbmQsIGhhbmRsZXJSZXR1cm4sIGhlYWRlciB9ID1cbiAgICAgICAgICAgIHNlcnZlciguLi5hcmdzKTtcbiAgICAgICAgaWYgKCFpbml0aWFsaXplZCkge1xuICAgICAgICAgICAgLy8gV2lsbCBkZWR1cGUgY29uY3VycmVudGx5IGluY29taW5nIGNhbGxzIGZyb20gc2V2ZXJhbCB1cGRhdGVzXG4gICAgICAgICAgICBhd2FpdCBib3QuaW5pdCgpO1xuICAgICAgICAgICAgaW5pdGlhbGl6ZWQgPSB0cnVlO1xuICAgICAgICB9XG4gICAgICAgIGlmIChoZWFkZXIgIT09IHRva2VuKSB7XG4gICAgICAgICAgICBhd2FpdCB1bmF1dGhvcml6ZWQoKTtcbiAgICAgICAgICAgIC8vIFRPRE86IGludmVzdGlnYXRlIGRlbm8gYnVnIHRoYXQgaGFwcGVucyB3aGVuIHRoaXMgY29uc29sZSBsb2dnaW5nIGlzIHJlbW92ZWRcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKGhhbmRsZXJSZXR1cm4pO1xuICAgICAgICAgICAgcmV0dXJuIGhhbmRsZXJSZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgbGV0IHVzZWRXZWJob29rUmVwbHkgPSBmYWxzZTtcbiAgICAgICAgY29uc3Qgd2ViaG9va1JlcGx5RW52ZWxvcGU6IFdlYmhvb2tSZXBseUVudmVsb3BlID0ge1xuICAgICAgICAgICAgYXN5bmMgc2VuZChqc29uKSB7XG4gICAgICAgICAgICAgICAgdXNlZFdlYmhvb2tSZXBseSA9IHRydWU7XG4gICAgICAgICAgICAgICAgYXdhaXQgcmVzcG9uZChqc29uKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgIH07XG4gICAgICAgIGF3YWl0IHRpbWVvdXRJZk5lY2Vzc2FyeShcbiAgICAgICAgICAgIGJvdC5oYW5kbGVVcGRhdGUoYXdhaXQgdXBkYXRlLCB3ZWJob29rUmVwbHlFbnZlbG9wZSksXG4gICAgICAgICAgICB0eXBlb2YgdGltZW91dCA9PT0gXCJmdW5jdGlvblwiID8gKCkgPT4gdGltZW91dCguLi5hcmdzKSA6IHRpbWVvdXQsXG4gICAgICAgICAgICBtcyxcbiAgICAgICAgKTtcbiAgICAgICAgaWYgKCF1c2VkV2ViaG9va1JlcGx5KSBlbmQ/LigpO1xuICAgICAgICByZXR1cm4gaGFuZGxlclJldHVybjtcbiAgICB9O1xufVxuXG5mdW5jdGlvbiB0aW1lb3V0SWZOZWNlc3NhcnkoXG4gICAgdGFzazogUHJvbWlzZTx2b2lkPixcbiAgICBvblRpbWVvdXQ6IFwidGhyb3dcIiB8IFwicmV0dXJuXCIgfCAoKCkgPT4gdW5rbm93biksXG4gICAgdGltZW91dDogbnVtYmVyLFxuKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgaWYgKHRpbWVvdXQgPT09IEluZmluaXR5KSByZXR1cm4gdGFzaztcbiAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICBjb25zdCBoYW5kbGUgPSBzZXRUaW1lb3V0KCgpID0+IHtcbiAgICAgICAgICAgIGlmIChvblRpbWVvdXQgPT09IFwidGhyb3dcIikge1xuICAgICAgICAgICAgICAgIHJlamVjdChuZXcgRXJyb3IoYFJlcXVlc3QgdGltZWQgb3V0IGFmdGVyICR7dGltZW91dH0gbXNgKSk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGlmICh0eXBlb2Ygb25UaW1lb3V0ID09PSBcImZ1bmN0aW9uXCIpIG9uVGltZW91dCgpO1xuICAgICAgICAgICAgICAgIHJlc29sdmUoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNvbnN0IG5vdyA9IERhdGUubm93KCk7XG4gICAgICAgICAgICB0YXNrLmZpbmFsbHkoKCkgPT4ge1xuICAgICAgICAgICAgICAgIGNvbnN0IGRpZmYgPSBEYXRlLm5vdygpIC0gbm93O1xuICAgICAgICAgICAgICAgIGRlYnVnRXJyKGBSZXF1ZXN0IGNvbXBsZXRlZCAke2RpZmZ9IG1zIGFmdGVyIHRpbWVvdXQhYCk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSwgdGltZW91dCk7XG4gICAgICAgIHRhc2sudGhlbihyZXNvbHZlKVxuICAgICAgICAgICAgLmNhdGNoKHJlamVjdClcbiAgICAgICAgICAgIC5maW5hbGx5KCgpID0+IGNsZWFyVGltZW91dChoYW5kbGUpKTtcbiAgICB9KTtcbn1cbiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSx3Q0FBd0M7QUFJeEMsU0FBUyxTQUFTLENBQUMsRUFBRSxjQUFjLFFBQVEsc0JBQXNCO0FBRWpFLFNBQ0ksWUFBWSxjQUFjLFFBRXZCLGtCQUFrQjtBQUN6QixNQUFNLFdBQVcsRUFBRTtBQUVuQixNQUFNLGtCQUFvQyxDQUN0QyxRQUNBLFVBQ0EsUUFDQSxlQUFlLElBQU0sU0FBUyxpQkFBaUIsR0FDOUMsQ0FBQztRQUNGLFFBQVEsUUFBUSxPQUFPLENBQUM7UUFDeEIsU0FBUztRQUNUO1FBQ0E7SUFDSixDQUFDO0FBQ0QsTUFBTSxXQUFXO0lBQUUsR0FBRyxjQUFjO0lBQUUsVUFBVTtBQUFnQjtBQTREaEUsT0FBTyxTQUFTLGdCQUNaLEdBQVcsRUFDWCxVQUEyQyxjQUFjLEVBQ3pELFNBRWlDLEVBQ2pDLG1CQUEyRCxFQUMzRCxXQUEyQyxFQUM3QztJQUNFLE1BQU0sRUFDRixXQUFXLFVBQVUsT0FBTyxDQUFBLEVBQzVCLHFCQUFxQixLQUFLLE1BQU0sQ0FBQSxFQUNoQyxhQUFhLE1BQUssRUFDckIsR0FBRyxPQUFPLGNBQWMsV0FDbkIsWUFDQTtRQUFFO1FBQVc7UUFBcUI7SUFBWSxDQUFDO0lBQ3JELElBQUksY0FBYyxLQUFLO0lBQ3ZCLE1BQU0sU0FBMkIsT0FBTyxZQUFZLFdBQzlDLFFBQVEsQ0FBQyxRQUFRLEdBQ2pCLE9BQU87SUFDYixPQUFPLE9BQU8sR0FBRyxPQUFnQjtRQUM3QixNQUFNLEVBQUUsT0FBTSxFQUFFLFFBQU8sRUFBRSxhQUFZLEVBQUUsSUFBRyxFQUFFLGNBQWEsRUFBRSxPQUFNLEVBQUUsR0FDL0QsVUFBVTtRQUNkLElBQUksQ0FBQyxhQUFhO1lBQ2QsK0RBQStEO1lBQy9ELE1BQU0sSUFBSSxJQUFJO1lBQ2QsY0FBYyxJQUFJO1FBQ3RCLENBQUM7UUFDRCxJQUFJLFdBQVcsT0FBTztZQUNsQixNQUFNO1lBQ04sK0VBQStFO1lBQy9FLFFBQVEsR0FBRyxDQUFDO1lBQ1osT0FBTztRQUNYLENBQUM7UUFDRCxJQUFJLG1CQUFtQixLQUFLO1FBQzVCLE1BQU0sdUJBQTZDO1lBQy9DLE1BQU0sTUFBSyxJQUFJLEVBQUU7Z0JBQ2IsbUJBQW1CLElBQUk7Z0JBQ3ZCLE1BQU0sUUFBUTtZQUNsQjtRQUNKO1FBQ0EsTUFBTSxtQkFDRixJQUFJLFlBQVksQ0FBQyxNQUFNLFFBQVEsdUJBQy9CLE9BQU8sWUFBWSxhQUFhLElBQU0sV0FBVyxRQUFRLE9BQU8sRUFDaEU7UUFFSixJQUFJLENBQUMsa0JBQWtCO1FBQ3ZCLE9BQU87SUFDWDtBQUNKLENBQUM7QUFFRCxTQUFTLG1CQUNMLElBQW1CLEVBQ25CLFNBQStDLEVBQy9DLE9BQWUsRUFDRjtJQUNiLElBQUksWUFBWSxVQUFVLE9BQU87SUFDakMsT0FBTyxJQUFJLFFBQVEsQ0FBQyxTQUFTLFNBQVc7UUFDcEMsTUFBTSxTQUFTLFdBQVcsSUFBTTtZQUM1QixJQUFJLGNBQWMsU0FBUztnQkFDdkIsT0FBTyxJQUFJLE1BQU0sQ0FBQyx3QkFBd0IsRUFBRSxRQUFRLEdBQUcsQ0FBQztZQUM1RCxPQUFPO2dCQUNILElBQUksT0FBTyxjQUFjLFlBQVk7Z0JBQ3JDO1lBQ0osQ0FBQztZQUNELE1BQU0sTUFBTSxLQUFLLEdBQUc7WUFDcEIsS0FBSyxPQUFPLENBQUMsSUFBTTtnQkFDZixNQUFNLE9BQU8sS0FBSyxHQUFHLEtBQUs7Z0JBQzFCLFNBQVMsQ0FBQyxrQkFBa0IsRUFBRSxLQUFLLGtCQUFrQixDQUFDO1lBQzFEO1FBQ0osR0FBRztRQUNILEtBQUssSUFBSSxDQUFDLFNBQ0wsS0FBSyxDQUFDLFFBQ04sT0FBTyxDQUFDLElBQU0sYUFBYTtJQUNwQztBQUNKIn0=