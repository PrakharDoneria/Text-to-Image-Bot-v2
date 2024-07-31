// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
// This module is browser compatible.
import { assertPath } from "./assert_path.ts";
export function stripSuffix(name, suffix) {
    if (suffix.length >= name.length) {
        return name;
    }
    const lenDiff = name.length - suffix.length;
    for(let i = suffix.length - 1; i >= 0; --i){
        if (name.charCodeAt(lenDiff + i) !== suffix.charCodeAt(i)) {
            return name;
        }
    }
    return name.slice(0, -suffix.length);
}
export function lastPathSegment(path, isSep, start = 0) {
    let matchedNonSeparator = false;
    let end = path.length;
    for(let i = path.length - 1; i >= start; --i){
        if (isSep(path.charCodeAt(i))) {
            if (matchedNonSeparator) {
                start = i + 1;
                break;
            }
        } else if (!matchedNonSeparator) {
            matchedNonSeparator = true;
            end = i + 1;
        }
    }
    return path.slice(start, end);
}
export function assertArgs(path, suffix) {
    assertPath(path);
    if (path.length === 0) return path;
    if (typeof suffix !== "string") {
        throw new TypeError(`Suffix must be a string. Received ${JSON.stringify(suffix)}`);
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vZGVuby5sYW5kL3N0ZEAwLjIxMS4wL3BhdGgvX2NvbW1vbi9iYXNlbmFtZS50cyJdLCJzb3VyY2VzQ29udGVudCI6WyIvLyBDb3B5cmlnaHQgMjAxOC0yMDI0IHRoZSBEZW5vIGF1dGhvcnMuIEFsbCByaWdodHMgcmVzZXJ2ZWQuIE1JVCBsaWNlbnNlLlxuLy8gVGhpcyBtb2R1bGUgaXMgYnJvd3NlciBjb21wYXRpYmxlLlxuXG5pbXBvcnQgeyBhc3NlcnRQYXRoIH0gZnJvbSBcIi4vYXNzZXJ0X3BhdGgudHNcIjtcblxuZXhwb3J0IGZ1bmN0aW9uIHN0cmlwU3VmZml4KG5hbWU6IHN0cmluZywgc3VmZml4OiBzdHJpbmcpOiBzdHJpbmcge1xuICBpZiAoc3VmZml4Lmxlbmd0aCA+PSBuYW1lLmxlbmd0aCkge1xuICAgIHJldHVybiBuYW1lO1xuICB9XG5cbiAgY29uc3QgbGVuRGlmZiA9IG5hbWUubGVuZ3RoIC0gc3VmZml4Lmxlbmd0aDtcblxuICBmb3IgKGxldCBpID0gc3VmZml4Lmxlbmd0aCAtIDE7IGkgPj0gMDsgLS1pKSB7XG4gICAgaWYgKG5hbWUuY2hhckNvZGVBdChsZW5EaWZmICsgaSkgIT09IHN1ZmZpeC5jaGFyQ29kZUF0KGkpKSB7XG4gICAgICByZXR1cm4gbmFtZTtcbiAgICB9XG4gIH1cblxuICByZXR1cm4gbmFtZS5zbGljZSgwLCAtc3VmZml4Lmxlbmd0aCk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBsYXN0UGF0aFNlZ21lbnQoXG4gIHBhdGg6IHN0cmluZyxcbiAgaXNTZXA6IChjaGFyOiBudW1iZXIpID0+IGJvb2xlYW4sXG4gIHN0YXJ0ID0gMCxcbik6IHN0cmluZyB7XG4gIGxldCBtYXRjaGVkTm9uU2VwYXJhdG9yID0gZmFsc2U7XG4gIGxldCBlbmQgPSBwYXRoLmxlbmd0aDtcblxuICBmb3IgKGxldCBpID0gcGF0aC5sZW5ndGggLSAxOyBpID49IHN0YXJ0OyAtLWkpIHtcbiAgICBpZiAoaXNTZXAocGF0aC5jaGFyQ29kZUF0KGkpKSkge1xuICAgICAgaWYgKG1hdGNoZWROb25TZXBhcmF0b3IpIHtcbiAgICAgICAgc3RhcnQgPSBpICsgMTtcbiAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgfSBlbHNlIGlmICghbWF0Y2hlZE5vblNlcGFyYXRvcikge1xuICAgICAgbWF0Y2hlZE5vblNlcGFyYXRvciA9IHRydWU7XG4gICAgICBlbmQgPSBpICsgMTtcbiAgICB9XG4gIH1cblxuICByZXR1cm4gcGF0aC5zbGljZShzdGFydCwgZW5kKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGFzc2VydEFyZ3MocGF0aDogc3RyaW5nLCBzdWZmaXg6IHN0cmluZykge1xuICBhc3NlcnRQYXRoKHBhdGgpO1xuICBpZiAocGF0aC5sZW5ndGggPT09IDApIHJldHVybiBwYXRoO1xuICBpZiAodHlwZW9mIHN1ZmZpeCAhPT0gXCJzdHJpbmdcIikge1xuICAgIHRocm93IG5ldyBUeXBlRXJyb3IoXG4gICAgICBgU3VmZml4IG11c3QgYmUgYSBzdHJpbmcuIFJlY2VpdmVkICR7SlNPTi5zdHJpbmdpZnkoc3VmZml4KX1gLFxuICAgICk7XG4gIH1cbn1cbiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSwwRUFBMEU7QUFDMUUscUNBQXFDO0FBRXJDLFNBQVMsVUFBVSxRQUFRLG1CQUFtQjtBQUU5QyxPQUFPLFNBQVMsWUFBWSxJQUFZLEVBQUUsTUFBYyxFQUFVO0lBQ2hFLElBQUksT0FBTyxNQUFNLElBQUksS0FBSyxNQUFNLEVBQUU7UUFDaEMsT0FBTztJQUNULENBQUM7SUFFRCxNQUFNLFVBQVUsS0FBSyxNQUFNLEdBQUcsT0FBTyxNQUFNO0lBRTNDLElBQUssSUFBSSxJQUFJLE9BQU8sTUFBTSxHQUFHLEdBQUcsS0FBSyxHQUFHLEVBQUUsRUFBRztRQUMzQyxJQUFJLEtBQUssVUFBVSxDQUFDLFVBQVUsT0FBTyxPQUFPLFVBQVUsQ0FBQyxJQUFJO1lBQ3pELE9BQU87UUFDVCxDQUFDO0lBQ0g7SUFFQSxPQUFPLEtBQUssS0FBSyxDQUFDLEdBQUcsQ0FBQyxPQUFPLE1BQU07QUFDckMsQ0FBQztBQUVELE9BQU8sU0FBUyxnQkFDZCxJQUFZLEVBQ1osS0FBZ0MsRUFDaEMsUUFBUSxDQUFDLEVBQ0Q7SUFDUixJQUFJLHNCQUFzQixLQUFLO0lBQy9CLElBQUksTUFBTSxLQUFLLE1BQU07SUFFckIsSUFBSyxJQUFJLElBQUksS0FBSyxNQUFNLEdBQUcsR0FBRyxLQUFLLE9BQU8sRUFBRSxFQUFHO1FBQzdDLElBQUksTUFBTSxLQUFLLFVBQVUsQ0FBQyxLQUFLO1lBQzdCLElBQUkscUJBQXFCO2dCQUN2QixRQUFRLElBQUk7Z0JBQ1osS0FBTTtZQUNSLENBQUM7UUFDSCxPQUFPLElBQUksQ0FBQyxxQkFBcUI7WUFDL0Isc0JBQXNCLElBQUk7WUFDMUIsTUFBTSxJQUFJO1FBQ1osQ0FBQztJQUNIO0lBRUEsT0FBTyxLQUFLLEtBQUssQ0FBQyxPQUFPO0FBQzNCLENBQUM7QUFFRCxPQUFPLFNBQVMsV0FBVyxJQUFZLEVBQUUsTUFBYyxFQUFFO0lBQ3ZELFdBQVc7SUFDWCxJQUFJLEtBQUssTUFBTSxLQUFLLEdBQUcsT0FBTztJQUM5QixJQUFJLE9BQU8sV0FBVyxVQUFVO1FBQzlCLE1BQU0sSUFBSSxVQUNSLENBQUMsa0NBQWtDLEVBQUUsS0FBSyxTQUFTLENBQUMsUUFBUSxDQUFDLEVBQzdEO0lBQ0osQ0FBQztBQUNILENBQUMifQ==