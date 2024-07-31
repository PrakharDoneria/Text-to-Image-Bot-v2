// deno-lint-ignore-file camelcase no-explicit-any
const filterQueryCache = new Map();
// === Obtain O(1) filter function from query
/**
 * > This is an advanced function of grammY.
 *
 * Takes a filter query and turns it into a predicate function that can check in
 * constant time whether a given context object satisfies the query. The created
 * predicate can be passed to `bot.filter` and will narrow down the context
 * accordingly.
 *
 * This function is used internally by `bot.on` but exposed for advanced usage
 * like the following.
 * ```ts
 * // Listens for updates except forwards of messages or channel posts
 * bot.drop(matchFilter(':forward_origin'), ctx => { ... })
 * ```
 *
 * Check out the
 * [documentation](https://doc.deno.land/https://deno.land/x/grammy/mod.ts/~/Composer)
 * of `bot.on` for examples. In addition, the
 * [website](https://grammy.dev/guide/filter-queries.html) contains more
 * information about how filter queries work in grammY.
 *
 * @param filter A filter query or an array of filter queries
 */ export function matchFilter(filter) {
    const queries = Array.isArray(filter) ? filter : [
        filter
    ];
    const key = queries.join(",");
    const predicate = filterQueryCache.get(key) ?? (()=>{
        const parsed = parse(queries);
        const pred = compile(parsed);
        filterQueryCache.set(key, pred);
        return pred;
    })();
    return (ctx)=>predicate(ctx);
}
export function parse(filter) {
    return Array.isArray(filter) ? filter.map((q)=>q.split(":")) : [
        filter.split(":")
    ];
}
function compile(parsed) {
    const preprocessed = parsed.flatMap((q)=>check(q, preprocess(q)));
    const ltree = treeify(preprocessed);
    const predicate = arborist(ltree); // arborists check trees
    return (ctx)=>!!predicate(ctx.update, ctx);
}
export function preprocess(filter) {
    const valid = UPDATE_KEYS;
    const expanded = [
        filter
    ]// expand L1
    .flatMap((q)=>{
        const [l1, l2, l3] = q;
        // only expand if shortcut is given
        if (!(l1 in L1_SHORTCUTS)) return [
            q
        ];
        // only expand for at least one non-empty part
        if (!l1 && !l2 && !l3) return [
            q
        ];
        // perform actual expansion
        const targets = L1_SHORTCUTS[l1];
        const expanded = targets.map((s)=>[
                s,
                l2,
                l3
            ]);
        // assume that bare L1 expansions are always correct
        if (l2 === undefined) return expanded;
        // only filter out invalid expansions if we don't do this later
        if (l2 in L2_SHORTCUTS && (l2 || l3)) return expanded;
        // filter out invalid expansions, e.g. `channel_post:new_chat_member` for empty L1
        return expanded.filter(([s])=>!!valid[s]?.[l2]);
    })// expand L2
    .flatMap((q)=>{
        const [l1, l2, l3] = q;
        // only expand if shortcut is given
        if (!(l2 in L2_SHORTCUTS)) return [
            q
        ];
        // only expand for at least one non-empty part
        if (!l2 && !l3) return [
            q
        ];
        // perform actual expansion
        const targets = L2_SHORTCUTS[l2];
        const expanded = targets.map((s)=>[
                l1,
                s,
                l3
            ]);
        // assume that bare L2 expansions are always correct
        if (l3 === undefined) return expanded;
        // filter out invalid expansions
        return expanded.filter(([, s])=>!!valid[l1]?.[s]?.[l3]);
    });
    if (expanded.length === 0) {
        throw new Error(`Shortcuts in '${filter.join(":")}' do not expand to any valid filter query`);
    }
    return expanded;
}
function check(original, preprocessed) {
    if (preprocessed.length === 0) throw new Error("Empty filter query given");
    const errors = preprocessed.map(checkOne).filter((r)=>r !== true);
    if (errors.length === 0) return preprocessed;
    else if (errors.length === 1) throw new Error(errors[0]);
    else {
        throw new Error(`Invalid filter query '${original.join(":")}'. There are ${errors.length} errors after expanding the contained shortcuts: ${errors.join("; ")}`);
    }
}
function checkOne(filter) {
    const [l1, l2, l3, ...n] = filter;
    if (l1 === undefined) return "Empty filter query given";
    if (!(l1 in UPDATE_KEYS)) {
        const permitted = Object.keys(UPDATE_KEYS);
        return `Invalid L1 filter '${l1}' given in '${filter.join(":")}'. \
Permitted values are: ${permitted.map((k)=>`'${k}'`).join(", ")}.`;
    }
    if (l2 === undefined) return true;
    const l1Obj = UPDATE_KEYS[l1];
    if (!(l2 in l1Obj)) {
        const permitted = Object.keys(l1Obj);
        return `Invalid L2 filter '${l2}' given in '${filter.join(":")}'. \
Permitted values are: ${permitted.map((k)=>`'${k}'`).join(", ")}.`;
    }
    if (l3 === undefined) return true;
    const l2Obj = l1Obj[l2];
    if (!(l3 in l2Obj)) {
        const permitted = Object.keys(l2Obj);
        return `Invalid L3 filter '${l3}' given in '${filter.join(":")}'. ${permitted.length === 0 ? `No further filtering is possible after '${l1}:${l2}'.` : `Permitted values are: ${permitted.map((k)=>`'${k}'`).join(", ")}.`}`;
    }
    if (n.length === 0) return true;
    return `Cannot filter further than three levels, ':${n.join(":")}' is invalid!`;
}
function treeify(paths) {
    const tree = {};
    for (const [l1, l2, l3] of paths){
        const subtree = tree[l1] ??= {};
        if (l2 !== undefined) {
            const set = subtree[l2] ??= new Set();
            if (l3 !== undefined) set.add(l3);
        }
    }
    return tree;
}
function or(left, right) {
    return (obj, ctx)=>left(obj, ctx) || right(obj, ctx);
}
function concat(get, test) {
    return (obj, ctx)=>{
        const nextObj = get(obj, ctx);
        return nextObj && test(nextObj, ctx);
    };
}
function leaf(pred) {
    return (obj, ctx)=>pred(obj, ctx) != null;
}
function arborist(tree) {
    const l1Predicates = Object.entries(tree).map(([l1, subtree])=>{
        const l1Pred = (obj)=>obj[l1];
        const l2Predicates = Object.entries(subtree).map(([l2, set])=>{
            const l2Pred = (obj)=>obj[l2];
            const l3Predicates = Array.from(set).map((l3)=>{
                const l3Pred = l3 === "me" // special handling for `me` shortcut
                 ? (obj, ctx)=>{
                    const me = ctx.me.id;
                    return testMaybeArray(obj, (u)=>u.id === me);
                } : (obj)=>testMaybeArray(obj, (e)=>e[l3] || e.type === l3);
                return l3Pred;
            });
            return l3Predicates.length === 0 ? leaf(l2Pred) : concat(l2Pred, l3Predicates.reduce(or));
        });
        return l2Predicates.length === 0 ? leaf(l1Pred) : concat(l1Pred, l2Predicates.reduce(or));
    });
    if (l1Predicates.length === 0) {
        throw new Error("Cannot create filter function for empty query");
    }
    return l1Predicates.reduce(or);
}
function testMaybeArray(t, pred) {
    const p = (x)=>x != null && pred(x);
    return Array.isArray(t) ? t.some(p) : p(t);
}
// === Define a structure to validate the queries
// L3
const ENTITY_KEYS = {
    mention: {},
    hashtag: {},
    cashtag: {},
    bot_command: {},
    url: {},
    email: {},
    phone_number: {},
    bold: {},
    italic: {},
    underline: {},
    strikethrough: {},
    spoiler: {},
    blockquote: {},
    expandable_blockquote: {},
    code: {},
    pre: {},
    text_link: {},
    text_mention: {},
    custom_emoji: {}
};
const USER_KEYS = {
    me: {},
    is_bot: {},
    is_premium: {},
    added_to_attachment_menu: {}
};
const FORWARD_ORIGIN_KEYS = {
    user: {},
    hidden_user: {},
    chat: {},
    channel: {}
};
const STICKER_KEYS = {
    is_video: {},
    is_animated: {},
    premium_animation: {}
};
const REACTION_KEYS = {
    emoji: {},
    custom_emoji: {}
};
// L2
const COMMON_MESSAGE_KEYS = {
    forward_origin: FORWARD_ORIGIN_KEYS,
    is_topic_message: {},
    is_automatic_forward: {},
    business_connection_id: {},
    text: {},
    animation: {},
    audio: {},
    document: {},
    photo: {},
    sticker: STICKER_KEYS,
    story: {},
    video: {},
    video_note: {},
    voice: {},
    contact: {},
    dice: {},
    game: {},
    poll: {},
    venue: {},
    location: {},
    paid_media: {},
    entities: ENTITY_KEYS,
    caption_entities: ENTITY_KEYS,
    caption: {},
    effect_id: {},
    has_media_spoiler: {},
    new_chat_title: {},
    new_chat_photo: {},
    delete_chat_photo: {},
    message_auto_delete_timer_changed: {},
    pinned_message: {},
    chat_background_set: {},
    invoice: {},
    proximity_alert_triggered: {},
    video_chat_scheduled: {},
    video_chat_started: {},
    video_chat_ended: {},
    video_chat_participants_invited: {},
    web_app_data: {}
};
const MESSAGE_KEYS = {
    ...COMMON_MESSAGE_KEYS,
    sender_boost_count: {},
    new_chat_members: USER_KEYS,
    left_chat_member: USER_KEYS,
    group_chat_created: {},
    supergroup_chat_created: {},
    migrate_to_chat_id: {},
    migrate_from_chat_id: {},
    successful_payment: {},
    refunded_payment: {},
    boost_added: {},
    users_shared: {},
    chat_shared: {},
    connected_website: {},
    write_access_allowed: {},
    passport_data: {},
    forum_topic_created: {},
    forum_topic_edited: {
        name: {},
        icon_custom_emoji_id: {}
    },
    forum_topic_closed: {},
    forum_topic_reopened: {},
    general_forum_topic_hidden: {},
    general_forum_topic_unhidden: {}
};
const CHANNEL_POST_KEYS = {
    ...COMMON_MESSAGE_KEYS,
    channel_chat_created: {}
};
const BUSINESS_CONNECTION_KEYS = {
    can_reply: {},
    is_enabled: {}
};
const MESSAGE_REACTION_KEYS = {
    old_reaction: REACTION_KEYS,
    new_reaction: REACTION_KEYS
};
const MESSAGE_REACTION_COUNT_UPDATED_KEYS = {
    reactions: REACTION_KEYS
};
const CALLBACK_QUERY_KEYS = {
    data: {},
    game_short_name: {}
};
const CHAT_MEMBER_UPDATED_KEYS = {
    from: USER_KEYS
};
// L1
const UPDATE_KEYS = {
    message: MESSAGE_KEYS,
    edited_message: MESSAGE_KEYS,
    channel_post: CHANNEL_POST_KEYS,
    edited_channel_post: CHANNEL_POST_KEYS,
    business_connection: BUSINESS_CONNECTION_KEYS,
    business_message: MESSAGE_KEYS,
    edited_business_message: MESSAGE_KEYS,
    deleted_business_messages: {},
    inline_query: {},
    chosen_inline_result: {},
    callback_query: CALLBACK_QUERY_KEYS,
    shipping_query: {},
    pre_checkout_query: {},
    poll: {},
    poll_answer: {},
    my_chat_member: CHAT_MEMBER_UPDATED_KEYS,
    chat_member: CHAT_MEMBER_UPDATED_KEYS,
    chat_join_request: {},
    message_reaction: MESSAGE_REACTION_KEYS,
    message_reaction_count: MESSAGE_REACTION_COUNT_UPDATED_KEYS,
    chat_boost: {},
    removed_chat_boost: {}
};
// === Define some helpers for handling shortcuts, e.g. in 'edit:photo'
const L1_SHORTCUTS = {
    "": [
        "message",
        "channel_post"
    ],
    msg: [
        "message",
        "channel_post"
    ],
    edit: [
        "edited_message",
        "edited_channel_post"
    ]
};
const L2_SHORTCUTS = {
    "": [
        "entities",
        "caption_entities"
    ],
    media: [
        "photo",
        "video"
    ],
    file: [
        "photo",
        "animation",
        "audio",
        "document",
        "video",
        "video_note",
        "voice",
        "sticker"
    ]
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vZGVuby5sYW5kL3gvZ3JhbW15QHYxLjI3LjAvZmlsdGVyLnRzIl0sInNvdXJjZXNDb250ZW50IjpbIi8vIGRlbm8tbGludC1pZ25vcmUtZmlsZSBjYW1lbGNhc2Ugbm8tZXhwbGljaXQtYW55XG5pbXBvcnQgeyB0eXBlIENvbnRleHQgfSBmcm9tIFwiLi9jb250ZXh0LnRzXCI7XG5pbXBvcnQgeyB0eXBlIFVwZGF0ZSB9IGZyb20gXCIuL3R5cGVzLnRzXCI7XG5cbnR5cGUgRmlsdGVyRnVuY3Rpb248QyBleHRlbmRzIENvbnRleHQsIEQgZXh0ZW5kcyBDPiA9IChjdHg6IEMpID0+IGN0eCBpcyBEO1xuXG5jb25zdCBmaWx0ZXJRdWVyeUNhY2hlID0gbmV3IE1hcDxzdHJpbmcsIChjdHg6IENvbnRleHQpID0+IGJvb2xlYW4+KCk7XG5cbi8vID09PSBPYnRhaW4gTygxKSBmaWx0ZXIgZnVuY3Rpb24gZnJvbSBxdWVyeVxuLyoqXG4gKiA+IFRoaXMgaXMgYW4gYWR2YW5jZWQgZnVuY3Rpb24gb2YgZ3JhbW1ZLlxuICpcbiAqIFRha2VzIGEgZmlsdGVyIHF1ZXJ5IGFuZCB0dXJucyBpdCBpbnRvIGEgcHJlZGljYXRlIGZ1bmN0aW9uIHRoYXQgY2FuIGNoZWNrIGluXG4gKiBjb25zdGFudCB0aW1lIHdoZXRoZXIgYSBnaXZlbiBjb250ZXh0IG9iamVjdCBzYXRpc2ZpZXMgdGhlIHF1ZXJ5LiBUaGUgY3JlYXRlZFxuICogcHJlZGljYXRlIGNhbiBiZSBwYXNzZWQgdG8gYGJvdC5maWx0ZXJgIGFuZCB3aWxsIG5hcnJvdyBkb3duIHRoZSBjb250ZXh0XG4gKiBhY2NvcmRpbmdseS5cbiAqXG4gKiBUaGlzIGZ1bmN0aW9uIGlzIHVzZWQgaW50ZXJuYWxseSBieSBgYm90Lm9uYCBidXQgZXhwb3NlZCBmb3IgYWR2YW5jZWQgdXNhZ2VcbiAqIGxpa2UgdGhlIGZvbGxvd2luZy5cbiAqIGBgYHRzXG4gKiAvLyBMaXN0ZW5zIGZvciB1cGRhdGVzIGV4Y2VwdCBmb3J3YXJkcyBvZiBtZXNzYWdlcyBvciBjaGFubmVsIHBvc3RzXG4gKiBib3QuZHJvcChtYXRjaEZpbHRlcignOmZvcndhcmRfb3JpZ2luJyksIGN0eCA9PiB7IC4uLiB9KVxuICogYGBgXG4gKlxuICogQ2hlY2sgb3V0IHRoZVxuICogW2RvY3VtZW50YXRpb25dKGh0dHBzOi8vZG9jLmRlbm8ubGFuZC9odHRwczovL2Rlbm8ubGFuZC94L2dyYW1teS9tb2QudHMvfi9Db21wb3NlcilcbiAqIG9mIGBib3Qub25gIGZvciBleGFtcGxlcy4gSW4gYWRkaXRpb24sIHRoZVxuICogW3dlYnNpdGVdKGh0dHBzOi8vZ3JhbW15LmRldi9ndWlkZS9maWx0ZXItcXVlcmllcy5odG1sKSBjb250YWlucyBtb3JlXG4gKiBpbmZvcm1hdGlvbiBhYm91dCBob3cgZmlsdGVyIHF1ZXJpZXMgd29yayBpbiBncmFtbVkuXG4gKlxuICogQHBhcmFtIGZpbHRlciBBIGZpbHRlciBxdWVyeSBvciBhbiBhcnJheSBvZiBmaWx0ZXIgcXVlcmllc1xuICovXG5leHBvcnQgZnVuY3Rpb24gbWF0Y2hGaWx0ZXI8QyBleHRlbmRzIENvbnRleHQsIFEgZXh0ZW5kcyBGaWx0ZXJRdWVyeT4oXG4gICAgZmlsdGVyOiBRIHwgUVtdLFxuKTogRmlsdGVyRnVuY3Rpb248QywgRmlsdGVyPEMsIFE+PiB7XG4gICAgY29uc3QgcXVlcmllcyA9IEFycmF5LmlzQXJyYXkoZmlsdGVyKSA/IGZpbHRlciA6IFtmaWx0ZXJdO1xuICAgIGNvbnN0IGtleSA9IHF1ZXJpZXMuam9pbihcIixcIik7XG4gICAgY29uc3QgcHJlZGljYXRlID0gZmlsdGVyUXVlcnlDYWNoZS5nZXQoa2V5KSA/PyAoKCkgPT4ge1xuICAgICAgICBjb25zdCBwYXJzZWQgPSBwYXJzZShxdWVyaWVzKTtcbiAgICAgICAgY29uc3QgcHJlZCA9IGNvbXBpbGUocGFyc2VkKTtcbiAgICAgICAgZmlsdGVyUXVlcnlDYWNoZS5zZXQoa2V5LCBwcmVkKTtcbiAgICAgICAgcmV0dXJuIHByZWQ7XG4gICAgfSkoKTtcbiAgICByZXR1cm4gKGN0eDogQyk6IGN0eCBpcyBGaWx0ZXI8QywgUT4gPT4gcHJlZGljYXRlKGN0eCk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBwYXJzZShmaWx0ZXI6IEZpbHRlclF1ZXJ5IHwgRmlsdGVyUXVlcnlbXSk6IHN0cmluZ1tdW10ge1xuICAgIHJldHVybiBBcnJheS5pc0FycmF5KGZpbHRlcilcbiAgICAgICAgPyBmaWx0ZXIubWFwKChxKSA9PiBxLnNwbGl0KFwiOlwiKSlcbiAgICAgICAgOiBbZmlsdGVyLnNwbGl0KFwiOlwiKV07XG59XG5cbmZ1bmN0aW9uIGNvbXBpbGUocGFyc2VkOiBzdHJpbmdbXVtdKTogKGN0eDogQ29udGV4dCkgPT4gYm9vbGVhbiB7XG4gICAgY29uc3QgcHJlcHJvY2Vzc2VkID0gcGFyc2VkLmZsYXRNYXAoKHEpID0+IGNoZWNrKHEsIHByZXByb2Nlc3MocSkpKTtcbiAgICBjb25zdCBsdHJlZSA9IHRyZWVpZnkocHJlcHJvY2Vzc2VkKTtcbiAgICBjb25zdCBwcmVkaWNhdGUgPSBhcmJvcmlzdChsdHJlZSk7IC8vIGFyYm9yaXN0cyBjaGVjayB0cmVlc1xuICAgIHJldHVybiAoY3R4KSA9PiAhIXByZWRpY2F0ZShjdHgudXBkYXRlLCBjdHgpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gcHJlcHJvY2VzcyhmaWx0ZXI6IHN0cmluZ1tdKTogc3RyaW5nW11bXSB7XG4gICAgY29uc3QgdmFsaWQ6IGFueSA9IFVQREFURV9LRVlTO1xuICAgIGNvbnN0IGV4cGFuZGVkID0gW2ZpbHRlcl1cbiAgICAgICAgLy8gZXhwYW5kIEwxXG4gICAgICAgIC5mbGF0TWFwKChxKSA9PiB7XG4gICAgICAgICAgICBjb25zdCBbbDEsIGwyLCBsM10gPSBxO1xuICAgICAgICAgICAgLy8gb25seSBleHBhbmQgaWYgc2hvcnRjdXQgaXMgZ2l2ZW5cbiAgICAgICAgICAgIGlmICghKGwxIGluIEwxX1NIT1JUQ1VUUykpIHJldHVybiBbcV07XG4gICAgICAgICAgICAvLyBvbmx5IGV4cGFuZCBmb3IgYXQgbGVhc3Qgb25lIG5vbi1lbXB0eSBwYXJ0XG4gICAgICAgICAgICBpZiAoIWwxICYmICFsMiAmJiAhbDMpIHJldHVybiBbcV07XG4gICAgICAgICAgICAvLyBwZXJmb3JtIGFjdHVhbCBleHBhbnNpb25cbiAgICAgICAgICAgIGNvbnN0IHRhcmdldHMgPSBMMV9TSE9SVENVVFNbbDEgYXMgTDFTaG9ydGN1dHNdO1xuICAgICAgICAgICAgY29uc3QgZXhwYW5kZWQgPSB0YXJnZXRzLm1hcCgocykgPT4gW3MsIGwyLCBsM10pO1xuICAgICAgICAgICAgLy8gYXNzdW1lIHRoYXQgYmFyZSBMMSBleHBhbnNpb25zIGFyZSBhbHdheXMgY29ycmVjdFxuICAgICAgICAgICAgaWYgKGwyID09PSB1bmRlZmluZWQpIHJldHVybiBleHBhbmRlZDtcbiAgICAgICAgICAgIC8vIG9ubHkgZmlsdGVyIG91dCBpbnZhbGlkIGV4cGFuc2lvbnMgaWYgd2UgZG9uJ3QgZG8gdGhpcyBsYXRlclxuICAgICAgICAgICAgaWYgKGwyIGluIEwyX1NIT1JUQ1VUUyAmJiAobDIgfHwgbDMpKSByZXR1cm4gZXhwYW5kZWQ7XG4gICAgICAgICAgICAvLyBmaWx0ZXIgb3V0IGludmFsaWQgZXhwYW5zaW9ucywgZS5nLiBgY2hhbm5lbF9wb3N0Om5ld19jaGF0X21lbWJlcmAgZm9yIGVtcHR5IEwxXG4gICAgICAgICAgICByZXR1cm4gZXhwYW5kZWQuZmlsdGVyKChbc10pID0+ICEhdmFsaWRbc10/LltsMl0pO1xuICAgICAgICB9KVxuICAgICAgICAvLyBleHBhbmQgTDJcbiAgICAgICAgLmZsYXRNYXAoKHEpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IFtsMSwgbDIsIGwzXSA9IHE7XG4gICAgICAgICAgICAvLyBvbmx5IGV4cGFuZCBpZiBzaG9ydGN1dCBpcyBnaXZlblxuICAgICAgICAgICAgaWYgKCEobDIgaW4gTDJfU0hPUlRDVVRTKSkgcmV0dXJuIFtxXTtcbiAgICAgICAgICAgIC8vIG9ubHkgZXhwYW5kIGZvciBhdCBsZWFzdCBvbmUgbm9uLWVtcHR5IHBhcnRcbiAgICAgICAgICAgIGlmICghbDIgJiYgIWwzKSByZXR1cm4gW3FdO1xuICAgICAgICAgICAgLy8gcGVyZm9ybSBhY3R1YWwgZXhwYW5zaW9uXG4gICAgICAgICAgICBjb25zdCB0YXJnZXRzID0gTDJfU0hPUlRDVVRTW2wyIGFzIEwyU2hvcnRjdXRzXTtcbiAgICAgICAgICAgIGNvbnN0IGV4cGFuZGVkID0gdGFyZ2V0cy5tYXAoKHMpID0+IFtsMSwgcywgbDNdKTtcbiAgICAgICAgICAgIC8vIGFzc3VtZSB0aGF0IGJhcmUgTDIgZXhwYW5zaW9ucyBhcmUgYWx3YXlzIGNvcnJlY3RcbiAgICAgICAgICAgIGlmIChsMyA9PT0gdW5kZWZpbmVkKSByZXR1cm4gZXhwYW5kZWQ7XG4gICAgICAgICAgICAvLyBmaWx0ZXIgb3V0IGludmFsaWQgZXhwYW5zaW9uc1xuICAgICAgICAgICAgcmV0dXJuIGV4cGFuZGVkLmZpbHRlcigoWywgc10pID0+ICEhdmFsaWRbbDFdPy5bc10/LltsM10pO1xuICAgICAgICB9KTtcbiAgICBpZiAoZXhwYW5kZWQubGVuZ3RoID09PSAwKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihcbiAgICAgICAgICAgIGBTaG9ydGN1dHMgaW4gJyR7XG4gICAgICAgICAgICAgICAgZmlsdGVyLmpvaW4oXCI6XCIpXG4gICAgICAgICAgICB9JyBkbyBub3QgZXhwYW5kIHRvIGFueSB2YWxpZCBmaWx0ZXIgcXVlcnlgLFxuICAgICAgICApO1xuICAgIH1cbiAgICByZXR1cm4gZXhwYW5kZWQ7XG59XG5cbmZ1bmN0aW9uIGNoZWNrKG9yaWdpbmFsOiBzdHJpbmdbXSwgcHJlcHJvY2Vzc2VkOiBzdHJpbmdbXVtdKTogc3RyaW5nW11bXSB7XG4gICAgaWYgKHByZXByb2Nlc3NlZC5sZW5ndGggPT09IDApIHRocm93IG5ldyBFcnJvcihcIkVtcHR5IGZpbHRlciBxdWVyeSBnaXZlblwiKTtcbiAgICBjb25zdCBlcnJvcnMgPSBwcmVwcm9jZXNzZWRcbiAgICAgICAgLm1hcChjaGVja09uZSlcbiAgICAgICAgLmZpbHRlcigocik6IHIgaXMgc3RyaW5nID0+IHIgIT09IHRydWUpO1xuICAgIGlmIChlcnJvcnMubGVuZ3RoID09PSAwKSByZXR1cm4gcHJlcHJvY2Vzc2VkO1xuICAgIGVsc2UgaWYgKGVycm9ycy5sZW5ndGggPT09IDEpIHRocm93IG5ldyBFcnJvcihlcnJvcnNbMF0pO1xuICAgIGVsc2Uge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXG4gICAgICAgICAgICBgSW52YWxpZCBmaWx0ZXIgcXVlcnkgJyR7XG4gICAgICAgICAgICAgICAgb3JpZ2luYWwuam9pbihcIjpcIilcbiAgICAgICAgICAgIH0nLiBUaGVyZSBhcmUgJHtlcnJvcnMubGVuZ3RofSBlcnJvcnMgYWZ0ZXIgZXhwYW5kaW5nIHRoZSBjb250YWluZWQgc2hvcnRjdXRzOiAke1xuICAgICAgICAgICAgICAgIGVycm9ycy5qb2luKFwiOyBcIilcbiAgICAgICAgICAgIH1gLFxuICAgICAgICApO1xuICAgIH1cbn1cbmZ1bmN0aW9uIGNoZWNrT25lKGZpbHRlcjogc3RyaW5nW10pOiBzdHJpbmcgfCB0cnVlIHtcbiAgICBjb25zdCBbbDEsIGwyLCBsMywgLi4ubl0gPSBmaWx0ZXI7XG4gICAgaWYgKGwxID09PSB1bmRlZmluZWQpIHJldHVybiBcIkVtcHR5IGZpbHRlciBxdWVyeSBnaXZlblwiO1xuICAgIGlmICghKGwxIGluIFVQREFURV9LRVlTKSkge1xuICAgICAgICBjb25zdCBwZXJtaXR0ZWQgPSBPYmplY3Qua2V5cyhVUERBVEVfS0VZUyk7XG4gICAgICAgIHJldHVybiBgSW52YWxpZCBMMSBmaWx0ZXIgJyR7bDF9JyBnaXZlbiBpbiAnJHtmaWx0ZXIuam9pbihcIjpcIil9Jy4gXFxcblBlcm1pdHRlZCB2YWx1ZXMgYXJlOiAke3Blcm1pdHRlZC5tYXAoKGspID0+IGAnJHtrfSdgKS5qb2luKFwiLCBcIil9LmA7XG4gICAgfVxuICAgIGlmIChsMiA9PT0gdW5kZWZpbmVkKSByZXR1cm4gdHJ1ZTtcbiAgICBjb25zdCBsMU9iajogYW55ID0gVVBEQVRFX0tFWVNbbDEgYXMga2V5b2YgU107XG4gICAgaWYgKCEobDIgaW4gbDFPYmopKSB7XG4gICAgICAgIGNvbnN0IHBlcm1pdHRlZCA9IE9iamVjdC5rZXlzKGwxT2JqKTtcbiAgICAgICAgcmV0dXJuIGBJbnZhbGlkIEwyIGZpbHRlciAnJHtsMn0nIGdpdmVuIGluICcke2ZpbHRlci5qb2luKFwiOlwiKX0nLiBcXFxuUGVybWl0dGVkIHZhbHVlcyBhcmU6ICR7cGVybWl0dGVkLm1hcCgoaykgPT4gYCcke2t9J2ApLmpvaW4oXCIsIFwiKX0uYDtcbiAgICB9XG4gICAgaWYgKGwzID09PSB1bmRlZmluZWQpIHJldHVybiB0cnVlO1xuICAgIGNvbnN0IGwyT2JqID0gbDFPYmpbbDJdO1xuICAgIGlmICghKGwzIGluIGwyT2JqKSkge1xuICAgICAgICBjb25zdCBwZXJtaXR0ZWQgPSBPYmplY3Qua2V5cyhsMk9iaik7XG4gICAgICAgIHJldHVybiBgSW52YWxpZCBMMyBmaWx0ZXIgJyR7bDN9JyBnaXZlbiBpbiAnJHtmaWx0ZXIuam9pbihcIjpcIil9Jy4gJHtcbiAgICAgICAgICAgIHBlcm1pdHRlZC5sZW5ndGggPT09IDBcbiAgICAgICAgICAgICAgICA/IGBObyBmdXJ0aGVyIGZpbHRlcmluZyBpcyBwb3NzaWJsZSBhZnRlciAnJHtsMX06JHtsMn0nLmBcbiAgICAgICAgICAgICAgICA6IGBQZXJtaXR0ZWQgdmFsdWVzIGFyZTogJHtcbiAgICAgICAgICAgICAgICAgICAgcGVybWl0dGVkLm1hcCgoaykgPT4gYCcke2t9J2ApLmpvaW4oXCIsIFwiKVxuICAgICAgICAgICAgICAgIH0uYFxuICAgICAgICB9YDtcbiAgICB9XG4gICAgaWYgKG4ubGVuZ3RoID09PSAwKSByZXR1cm4gdHJ1ZTtcbiAgICByZXR1cm4gYENhbm5vdCBmaWx0ZXIgZnVydGhlciB0aGFuIHRocmVlIGxldmVscywgJzoke1xuICAgICAgICBuLmpvaW4oXCI6XCIpXG4gICAgfScgaXMgaW52YWxpZCFgO1xufVxuaW50ZXJmYWNlIExUcmVlIHtcbiAgICBbbDE6IHN0cmluZ106IHsgW2wyOiBzdHJpbmddOiBTZXQ8c3RyaW5nPiB9O1xufVxuZnVuY3Rpb24gdHJlZWlmeShwYXRoczogc3RyaW5nW11bXSk6IExUcmVlIHtcbiAgICBjb25zdCB0cmVlOiBMVHJlZSA9IHt9O1xuICAgIGZvciAoY29uc3QgW2wxLCBsMiwgbDNdIG9mIHBhdGhzKSB7XG4gICAgICAgIGNvbnN0IHN1YnRyZWUgPSAodHJlZVtsMV0gPz89IHt9KTtcbiAgICAgICAgaWYgKGwyICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgIGNvbnN0IHNldCA9IChzdWJ0cmVlW2wyXSA/Pz0gbmV3IFNldCgpKTtcbiAgICAgICAgICAgIGlmIChsMyAhPT0gdW5kZWZpbmVkKSBzZXQuYWRkKGwzKTtcbiAgICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gdHJlZTtcbn1cblxudHlwZSBQcmVkID0gKG9iajogYW55LCBjdHg6IENvbnRleHQpID0+IGJvb2xlYW47XG5mdW5jdGlvbiBvcihsZWZ0OiBQcmVkLCByaWdodDogUHJlZCk6IFByZWQge1xuICAgIHJldHVybiAob2JqLCBjdHgpID0+IGxlZnQob2JqLCBjdHgpIHx8IHJpZ2h0KG9iaiwgY3R4KTtcbn1cbmZ1bmN0aW9uIGNvbmNhdChnZXQ6IFByZWQsIHRlc3Q6IFByZWQpOiBQcmVkIHtcbiAgICByZXR1cm4gKG9iaiwgY3R4KSA9PiB7XG4gICAgICAgIGNvbnN0IG5leHRPYmogPSBnZXQob2JqLCBjdHgpO1xuICAgICAgICByZXR1cm4gbmV4dE9iaiAmJiB0ZXN0KG5leHRPYmosIGN0eCk7XG4gICAgfTtcbn1cbmZ1bmN0aW9uIGxlYWYocHJlZDogUHJlZCk6IFByZWQge1xuICAgIHJldHVybiAob2JqLCBjdHgpID0+IHByZWQob2JqLCBjdHgpICE9IG51bGw7XG59XG5mdW5jdGlvbiBhcmJvcmlzdCh0cmVlOiBMVHJlZSk6IFByZWQge1xuICAgIGNvbnN0IGwxUHJlZGljYXRlcyA9IE9iamVjdC5lbnRyaWVzKHRyZWUpLm1hcCgoW2wxLCBzdWJ0cmVlXSkgPT4ge1xuICAgICAgICBjb25zdCBsMVByZWQ6IFByZWQgPSAob2JqKSA9PiBvYmpbbDFdO1xuICAgICAgICBjb25zdCBsMlByZWRpY2F0ZXMgPSBPYmplY3QuZW50cmllcyhzdWJ0cmVlKS5tYXAoKFtsMiwgc2V0XSkgPT4ge1xuICAgICAgICAgICAgY29uc3QgbDJQcmVkOiBQcmVkID0gKG9iaikgPT4gb2JqW2wyXTtcbiAgICAgICAgICAgIGNvbnN0IGwzUHJlZGljYXRlcyA9IEFycmF5LmZyb20oc2V0KS5tYXAoKGwzKSA9PiB7XG4gICAgICAgICAgICAgICAgY29uc3QgbDNQcmVkOiBQcmVkID0gbDMgPT09IFwibWVcIiAvLyBzcGVjaWFsIGhhbmRsaW5nIGZvciBgbWVgIHNob3J0Y3V0XG4gICAgICAgICAgICAgICAgICAgID8gKG9iaiwgY3R4KSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBtZSA9IGN0eC5tZS5pZDtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiB0ZXN0TWF5YmVBcnJheShvYmosICh1KSA9PiB1LmlkID09PSBtZSk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgOiAob2JqKSA9PlxuICAgICAgICAgICAgICAgICAgICAgICAgdGVzdE1heWJlQXJyYXkob2JqLCAoZSkgPT4gZVtsM10gfHwgZS50eXBlID09PSBsMyk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGwzUHJlZDtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgcmV0dXJuIGwzUHJlZGljYXRlcy5sZW5ndGggPT09IDBcbiAgICAgICAgICAgICAgICA/IGxlYWYobDJQcmVkKVxuICAgICAgICAgICAgICAgIDogY29uY2F0KGwyUHJlZCwgbDNQcmVkaWNhdGVzLnJlZHVjZShvcikpO1xuICAgICAgICB9KTtcbiAgICAgICAgcmV0dXJuIGwyUHJlZGljYXRlcy5sZW5ndGggPT09IDBcbiAgICAgICAgICAgID8gbGVhZihsMVByZWQpXG4gICAgICAgICAgICA6IGNvbmNhdChsMVByZWQsIGwyUHJlZGljYXRlcy5yZWR1Y2Uob3IpKTtcbiAgICB9KTtcbiAgICBpZiAobDFQcmVkaWNhdGVzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJDYW5ub3QgY3JlYXRlIGZpbHRlciBmdW5jdGlvbiBmb3IgZW1wdHkgcXVlcnlcIik7XG4gICAgfVxuICAgIHJldHVybiBsMVByZWRpY2F0ZXMucmVkdWNlKG9yKTtcbn1cblxuZnVuY3Rpb24gdGVzdE1heWJlQXJyYXk8VD4odDogVCB8IFRbXSwgcHJlZDogKHQ6IFQpID0+IGJvb2xlYW4pOiBib29sZWFuIHtcbiAgICBjb25zdCBwID0gKHg6IFQpID0+IHggIT0gbnVsbCAmJiBwcmVkKHgpO1xuICAgIHJldHVybiBBcnJheS5pc0FycmF5KHQpID8gdC5zb21lKHApIDogcCh0KTtcbn1cblxuLy8gPT09IERlZmluZSBhIHN0cnVjdHVyZSB0byB2YWxpZGF0ZSB0aGUgcXVlcmllc1xuLy8gTDNcbmNvbnN0IEVOVElUWV9LRVlTID0ge1xuICAgIG1lbnRpb246IHt9LFxuICAgIGhhc2h0YWc6IHt9LFxuICAgIGNhc2h0YWc6IHt9LFxuICAgIGJvdF9jb21tYW5kOiB7fSxcbiAgICB1cmw6IHt9LFxuICAgIGVtYWlsOiB7fSxcbiAgICBwaG9uZV9udW1iZXI6IHt9LFxuICAgIGJvbGQ6IHt9LFxuICAgIGl0YWxpYzoge30sXG4gICAgdW5kZXJsaW5lOiB7fSxcbiAgICBzdHJpa2V0aHJvdWdoOiB7fSxcbiAgICBzcG9pbGVyOiB7fSxcbiAgICBibG9ja3F1b3RlOiB7fSxcbiAgICBleHBhbmRhYmxlX2Jsb2NrcXVvdGU6IHt9LFxuICAgIGNvZGU6IHt9LFxuICAgIHByZToge30sXG4gICAgdGV4dF9saW5rOiB7fSxcbiAgICB0ZXh0X21lbnRpb246IHt9LFxuICAgIGN1c3RvbV9lbW9qaToge30sXG59IGFzIGNvbnN0O1xuY29uc3QgVVNFUl9LRVlTID0ge1xuICAgIG1lOiB7fSxcbiAgICBpc19ib3Q6IHt9LFxuICAgIGlzX3ByZW1pdW06IHt9LFxuICAgIGFkZGVkX3RvX2F0dGFjaG1lbnRfbWVudToge30sXG59IGFzIGNvbnN0O1xuY29uc3QgRk9SV0FSRF9PUklHSU5fS0VZUyA9IHtcbiAgICB1c2VyOiB7fSxcbiAgICBoaWRkZW5fdXNlcjoge30sXG4gICAgY2hhdDoge30sXG4gICAgY2hhbm5lbDoge30sXG59IGFzIGNvbnN0O1xuY29uc3QgU1RJQ0tFUl9LRVlTID0ge1xuICAgIGlzX3ZpZGVvOiB7fSxcbiAgICBpc19hbmltYXRlZDoge30sXG4gICAgcHJlbWl1bV9hbmltYXRpb246IHt9LFxufSBhcyBjb25zdDtcbmNvbnN0IFJFQUNUSU9OX0tFWVMgPSB7XG4gICAgZW1vamk6IHt9LFxuICAgIGN1c3RvbV9lbW9qaToge30sXG59IGFzIGNvbnN0O1xuXG4vLyBMMlxuY29uc3QgQ09NTU9OX01FU1NBR0VfS0VZUyA9IHtcbiAgICBmb3J3YXJkX29yaWdpbjogRk9SV0FSRF9PUklHSU5fS0VZUyxcbiAgICBpc190b3BpY19tZXNzYWdlOiB7fSxcbiAgICBpc19hdXRvbWF0aWNfZm9yd2FyZDoge30sXG4gICAgYnVzaW5lc3NfY29ubmVjdGlvbl9pZDoge30sXG5cbiAgICB0ZXh0OiB7fSxcbiAgICBhbmltYXRpb246IHt9LFxuICAgIGF1ZGlvOiB7fSxcbiAgICBkb2N1bWVudDoge30sXG4gICAgcGhvdG86IHt9LFxuICAgIHN0aWNrZXI6IFNUSUNLRVJfS0VZUyxcbiAgICBzdG9yeToge30sXG4gICAgdmlkZW86IHt9LFxuICAgIHZpZGVvX25vdGU6IHt9LFxuICAgIHZvaWNlOiB7fSxcbiAgICBjb250YWN0OiB7fSxcbiAgICBkaWNlOiB7fSxcbiAgICBnYW1lOiB7fSxcbiAgICBwb2xsOiB7fSxcbiAgICB2ZW51ZToge30sXG4gICAgbG9jYXRpb246IHt9LFxuICAgIHBhaWRfbWVkaWE6IHt9LFxuXG4gICAgZW50aXRpZXM6IEVOVElUWV9LRVlTLFxuICAgIGNhcHRpb25fZW50aXRpZXM6IEVOVElUWV9LRVlTLFxuICAgIGNhcHRpb246IHt9LFxuXG4gICAgZWZmZWN0X2lkOiB7fSxcbiAgICBoYXNfbWVkaWFfc3BvaWxlcjoge30sXG5cbiAgICBuZXdfY2hhdF90aXRsZToge30sXG4gICAgbmV3X2NoYXRfcGhvdG86IHt9LFxuICAgIGRlbGV0ZV9jaGF0X3Bob3RvOiB7fSxcbiAgICBtZXNzYWdlX2F1dG9fZGVsZXRlX3RpbWVyX2NoYW5nZWQ6IHt9LFxuICAgIHBpbm5lZF9tZXNzYWdlOiB7fSxcbiAgICBjaGF0X2JhY2tncm91bmRfc2V0OiB7fSxcbiAgICBpbnZvaWNlOiB7fSxcbiAgICBwcm94aW1pdHlfYWxlcnRfdHJpZ2dlcmVkOiB7fSxcbiAgICB2aWRlb19jaGF0X3NjaGVkdWxlZDoge30sXG4gICAgdmlkZW9fY2hhdF9zdGFydGVkOiB7fSxcbiAgICB2aWRlb19jaGF0X2VuZGVkOiB7fSxcbiAgICB2aWRlb19jaGF0X3BhcnRpY2lwYW50c19pbnZpdGVkOiB7fSxcbiAgICB3ZWJfYXBwX2RhdGE6IHt9LFxufSBhcyBjb25zdDtcbmNvbnN0IE1FU1NBR0VfS0VZUyA9IHtcbiAgICAuLi5DT01NT05fTUVTU0FHRV9LRVlTLFxuXG4gICAgc2VuZGVyX2Jvb3N0X2NvdW50OiB7fSxcblxuICAgIG5ld19jaGF0X21lbWJlcnM6IFVTRVJfS0VZUyxcbiAgICBsZWZ0X2NoYXRfbWVtYmVyOiBVU0VSX0tFWVMsXG4gICAgZ3JvdXBfY2hhdF9jcmVhdGVkOiB7fSxcbiAgICBzdXBlcmdyb3VwX2NoYXRfY3JlYXRlZDoge30sXG4gICAgbWlncmF0ZV90b19jaGF0X2lkOiB7fSxcbiAgICBtaWdyYXRlX2Zyb21fY2hhdF9pZDoge30sXG4gICAgc3VjY2Vzc2Z1bF9wYXltZW50OiB7fSxcbiAgICByZWZ1bmRlZF9wYXltZW50OiB7fSxcbiAgICBib29zdF9hZGRlZDoge30sXG4gICAgdXNlcnNfc2hhcmVkOiB7fSxcbiAgICBjaGF0X3NoYXJlZDoge30sXG4gICAgY29ubmVjdGVkX3dlYnNpdGU6IHt9LFxuICAgIHdyaXRlX2FjY2Vzc19hbGxvd2VkOiB7fSxcbiAgICBwYXNzcG9ydF9kYXRhOiB7fSxcbiAgICBmb3J1bV90b3BpY19jcmVhdGVkOiB7fSxcbiAgICBmb3J1bV90b3BpY19lZGl0ZWQ6IHsgbmFtZToge30sIGljb25fY3VzdG9tX2Vtb2ppX2lkOiB7fSB9LFxuICAgIGZvcnVtX3RvcGljX2Nsb3NlZDoge30sXG4gICAgZm9ydW1fdG9waWNfcmVvcGVuZWQ6IHt9LFxuICAgIGdlbmVyYWxfZm9ydW1fdG9waWNfaGlkZGVuOiB7fSxcbiAgICBnZW5lcmFsX2ZvcnVtX3RvcGljX3VuaGlkZGVuOiB7fSxcbn0gYXMgY29uc3Q7XG5jb25zdCBDSEFOTkVMX1BPU1RfS0VZUyA9IHtcbiAgICAuLi5DT01NT05fTUVTU0FHRV9LRVlTLFxuICAgIGNoYW5uZWxfY2hhdF9jcmVhdGVkOiB7fSxcbn0gYXMgY29uc3Q7XG5jb25zdCBCVVNJTkVTU19DT05ORUNUSU9OX0tFWVMgPSB7XG4gICAgY2FuX3JlcGx5OiB7fSxcbiAgICBpc19lbmFibGVkOiB7fSxcbn0gYXMgY29uc3Q7XG5jb25zdCBNRVNTQUdFX1JFQUNUSU9OX0tFWVMgPSB7XG4gICAgb2xkX3JlYWN0aW9uOiBSRUFDVElPTl9LRVlTLFxuICAgIG5ld19yZWFjdGlvbjogUkVBQ1RJT05fS0VZUyxcbn0gYXMgY29uc3Q7XG5jb25zdCBNRVNTQUdFX1JFQUNUSU9OX0NPVU5UX1VQREFURURfS0VZUyA9IHtcbiAgICByZWFjdGlvbnM6IFJFQUNUSU9OX0tFWVMsXG59IGFzIGNvbnN0O1xuY29uc3QgQ0FMTEJBQ0tfUVVFUllfS0VZUyA9IHsgZGF0YToge30sIGdhbWVfc2hvcnRfbmFtZToge30gfSBhcyBjb25zdDtcbmNvbnN0IENIQVRfTUVNQkVSX1VQREFURURfS0VZUyA9IHsgZnJvbTogVVNFUl9LRVlTIH0gYXMgY29uc3Q7XG5cbi8vIEwxXG5jb25zdCBVUERBVEVfS0VZUyA9IHtcbiAgICBtZXNzYWdlOiBNRVNTQUdFX0tFWVMsXG4gICAgZWRpdGVkX21lc3NhZ2U6IE1FU1NBR0VfS0VZUyxcbiAgICBjaGFubmVsX3Bvc3Q6IENIQU5ORUxfUE9TVF9LRVlTLFxuICAgIGVkaXRlZF9jaGFubmVsX3Bvc3Q6IENIQU5ORUxfUE9TVF9LRVlTLFxuICAgIGJ1c2luZXNzX2Nvbm5lY3Rpb246IEJVU0lORVNTX0NPTk5FQ1RJT05fS0VZUyxcbiAgICBidXNpbmVzc19tZXNzYWdlOiBNRVNTQUdFX0tFWVMsXG4gICAgZWRpdGVkX2J1c2luZXNzX21lc3NhZ2U6IE1FU1NBR0VfS0VZUyxcbiAgICBkZWxldGVkX2J1c2luZXNzX21lc3NhZ2VzOiB7fSxcbiAgICBpbmxpbmVfcXVlcnk6IHt9LFxuICAgIGNob3Nlbl9pbmxpbmVfcmVzdWx0OiB7fSxcbiAgICBjYWxsYmFja19xdWVyeTogQ0FMTEJBQ0tfUVVFUllfS0VZUyxcbiAgICBzaGlwcGluZ19xdWVyeToge30sXG4gICAgcHJlX2NoZWNrb3V0X3F1ZXJ5OiB7fSxcbiAgICBwb2xsOiB7fSxcbiAgICBwb2xsX2Fuc3dlcjoge30sXG4gICAgbXlfY2hhdF9tZW1iZXI6IENIQVRfTUVNQkVSX1VQREFURURfS0VZUyxcbiAgICBjaGF0X21lbWJlcjogQ0hBVF9NRU1CRVJfVVBEQVRFRF9LRVlTLFxuICAgIGNoYXRfam9pbl9yZXF1ZXN0OiB7fSxcbiAgICBtZXNzYWdlX3JlYWN0aW9uOiBNRVNTQUdFX1JFQUNUSU9OX0tFWVMsXG4gICAgbWVzc2FnZV9yZWFjdGlvbl9jb3VudDogTUVTU0FHRV9SRUFDVElPTl9DT1VOVF9VUERBVEVEX0tFWVMsXG4gICAgY2hhdF9ib29zdDoge30sXG4gICAgcmVtb3ZlZF9jaGF0X2Jvb3N0OiB7fSxcbn0gYXMgY29uc3Q7XG5cbi8vID09PSBCdWlsZCB1cCBhbGwgcG9zc2libGUgZmlsdGVyIHF1ZXJpZXMgZnJvbSB0aGUgYWJvdmUgdmFsaWRhdGlvbiBzdHJ1Y3R1cmVcbnR5cGUgS2V5T2Y8VD4gPSBzdHJpbmcgJiBrZXlvZiBUOyAvLyBFbXVsYXRlIGBrZXlvZlN0cmluZ3NPbmx5YFxuXG4vLyBTdWdnZXN0aW9uIGJ1aWxkaW5nIGJhc2Ugc3RydWN0dXJlXG50eXBlIFMgPSB0eXBlb2YgVVBEQVRFX0tFWVM7XG5cbi8vIEUuZy4gJ21lc3NhZ2UnIHN1Z2dlc3Rpb25zXG50eXBlIEwxUyA9IEtleU9mPFM+O1xuLy8gRS5nLiAnbWVzc2FnZTplbnRpdGllcycgc3VnZ2VzdGlvbnNcbnR5cGUgTDJTPEwxIGV4dGVuZHMgTDFTID0gTDFTPiA9IEwxIGV4dGVuZHMgdW5rbm93biA/IGAke0wxfToke0tleU9mPFNbTDFdPn1gXG4gICAgOiBuZXZlcjtcbi8vIEUuZy4gJ21lc3NhZ2U6ZW50aXRpZXM6dXJsJyBzdWdnZXN0aW9uc1xudHlwZSBMM1M8TDEgZXh0ZW5kcyBMMVMgPSBMMVM+ID0gTDEgZXh0ZW5kcyB1bmtub3duID8gTDNTXzxMMT4gOiBuZXZlcjtcbnR5cGUgTDNTXzxcbiAgICBMMSBleHRlbmRzIEwxUyxcbiAgICBMMiBleHRlbmRzIEtleU9mPFNbTDFdPiA9IEtleU9mPFNbTDFdPixcbj4gPSBMMiBleHRlbmRzIHVua25vd24gPyBgJHtMMX06JHtMMn06JHtLZXlPZjxTW0wxXVtMMl0+fWAgOiBuZXZlcjtcbi8vIFN1Z2dlc3Rpb25zIGZvciBhbGwgdGhyZWUgY29tYmluZWRcbnR5cGUgTDEyMyA9IEwxUyB8IEwyUyB8IEwzUztcbi8vIEUuZy4gJ21lc3NhZ2U6OnVybCcgZ2VuZXJhdGlvblxudHlwZSBJbmplY3RTaG9ydGN1dHM8USBleHRlbmRzIEwxMjMgPSBMMTIzPiA9IFEgZXh0ZW5kc1xuICAgIGAke2luZmVyIEwxfToke2luZmVyIEwyfToke2luZmVyIEwzfWBcbiAgICA/IGAke0NvbGxhcHNlTDE8TDEsIEwxU2hvcnRjdXRzPn06JHtDb2xsYXBzZUwyPEwyLCBMMlNob3J0Y3V0cz59OiR7TDN9YFxuICAgIDogUSBleHRlbmRzIGAke2luZmVyIEwxfToke2luZmVyIEwyfWBcbiAgICAgICAgPyBgJHtDb2xsYXBzZUwxPEwxLCBMMVNob3J0Y3V0cz59OiR7Q29sbGFwc2VMMjxMMj59YFxuICAgIDogQ29sbGFwc2VMMTxRPjtcbi8vIEFkZCBMMSBzaG9ydGN1dHNcbnR5cGUgQ29sbGFwc2VMMTxcbiAgICBRIGV4dGVuZHMgc3RyaW5nLFxuICAgIEwgZXh0ZW5kcyBMMVNob3J0Y3V0cyA9IEV4Y2x1ZGU8TDFTaG9ydGN1dHMsIFwiXCI+LFxuPiA9XG4gICAgfCBRXG4gICAgfCAoTCBleHRlbmRzIHN0cmluZyA/IFEgZXh0ZW5kcyB0eXBlb2YgTDFfU0hPUlRDVVRTW0xdW251bWJlcl0gPyBMXG4gICAgICAgIDogbmV2ZXJcbiAgICAgICAgOiBuZXZlcik7XG4vLyBBZGQgTDIgc2hvcnRjdXRzXG50eXBlIENvbGxhcHNlTDI8XG4gICAgUSBleHRlbmRzIHN0cmluZyxcbiAgICBMIGV4dGVuZHMgTDJTaG9ydGN1dHMgPSBFeGNsdWRlPEwyU2hvcnRjdXRzLCBcIlwiPixcbj4gPVxuICAgIHwgUVxuICAgIHwgKEwgZXh0ZW5kcyBzdHJpbmcgPyBRIGV4dGVuZHMgdHlwZW9mIEwyX1NIT1JUQ1VUU1tMXVtudW1iZXJdID8gTFxuICAgICAgICA6IG5ldmVyXG4gICAgICAgIDogbmV2ZXIpO1xuLy8gQWxsIHF1ZXJpZXNcbnR5cGUgQ29tcHV0ZUZpbHRlclF1ZXJ5TGlzdCA9IEluamVjdFNob3J0Y3V0cztcblxuLyoqXG4gKiBSZXByZXNlbnRzIGEgZmlsdGVyIHF1ZXJ5IHRoYXQgY2FuIGJlIHBhc3NlZCB0byBgYm90Lm9uYC4gVGhlcmUgYXJlIHRocmVlXG4gKiBkaWZmZXJlbnQga2luZHMgb2YgZmlsdGVyIHF1ZXJpZXM6IExldmVsIDEsIExldmVsIDIsIGFuZCBMZXZlbCAzLiBDaGVjayBvdXRcbiAqIHRoZSBbd2Vic2l0ZV0oaHR0cHM6Ly9ncmFtbXkuZGV2L2d1aWRlL2ZpbHRlci1xdWVyaWVzLmh0bWwpIHRvIHJlYWQgYWJvdXQgaG93XG4gKiBmaWx0ZXIgcXVlcmllcyB3b3JrIGluIGdyYW1tWSwgYW5kIGhvdyB0byB1c2UgdGhlbS5cbiAqXG4gKiBIZXJlIGFyZSB0aHJlZSBicmllZiBleGFtcGxlczpcbiAqIGBgYHRzXG4gKiAvLyBMaXN0ZW4gZm9yIG1lc3NhZ2VzIG9mIGFueSB0eXBlIChMZXZlbCAxKVxuICogYm90Lm9uKCdtZXNzYWdlJywgY3R4ID0+IHsgLi4uIH0pXG4gKiAvLyBMaXN0ZW4gZm9yIGF1ZGlvIG1lc3NhZ2VzIG9ubHkgKExldmVsIDIpXG4gKiBib3Qub24oJ21lc3NhZ2U6YXVkaW8nLCBjdHggPT4geyAuLi4gfSlcbiAqIC8vIExpc3RlbiBmb3IgdGV4dCBtZXNzYWdlcyB0aGF0IGhhdmUgYSBVUkwgZW50aXR5IChMZXZlbCAzKVxuICogYm90Lm9uKCdtZXNzYWdlOmVudGl0aWVzOnVybCcsIGN0eCA9PiB7IC4uLiB9KVxuICogYGBgXG4gKi9cbmV4cG9ydCB0eXBlIEZpbHRlclF1ZXJ5ID0gQ29tcHV0ZUZpbHRlclF1ZXJ5TGlzdDtcblxuLy8gPT09IEluZmVyIHRoZSBwcmVzZW50L2Fic2VudCBwcm9wZXJ0aWVzIG9uIGEgY29udGV4dCBvYmplY3QgYmFzZWQgb24gYSBxdWVyeVxuLy8gTm90ZTogTDMgZmlsdGVycyBhcmUgbm90IHJlcHJlc2VudGVkIGluIHR5cGVzXG5cbi8qKlxuICogQW55IGtpbmQgb2YgdmFsdWUgdGhhdCBhcHBlYXJzIGluIHRoZSBUZWxlZ3JhbSBCb3QgQVBJLiBXaGVuIGludGVyc2VjdGVkIHdpdGhcbiAqIGFuIG9wdGlvbmFsIGZpZWxkLCBpdCBlZmZlY3RpdmVseSByZW1vdmVzIGB8IHVuZGVmaW5lZGAuXG4gKi9cbnR5cGUgTm90VW5kZWZpbmVkID0gc3RyaW5nIHwgbnVtYmVyIHwgYm9vbGVhbiB8IG9iamVjdDtcblxuLyoqXG4gKiBHaXZlbiBhIEZpbHRlclF1ZXJ5LCByZXR1cm5zIGFuIG9iamVjdCB0aGF0LCB3aGVuIGludGVyc2VjdGVkIHdpdGggYW4gVXBkYXRlLFxuICogbWFya3MgdGhvc2UgcHJvcGVydGllcyBhcyByZXF1aXJlZCB0aGF0IGFyZSBndWFyYW50ZWVkIHRvIGV4aXN0LlxuICovXG50eXBlIFJ1blF1ZXJ5PFEgZXh0ZW5kcyBzdHJpbmc+ID0gTDFEaXNjcmltaW5hdG9yPFEsIEwxUGFydHM8UT4+O1xuXG4vLyBnZXRzIGFsbCBMMSBxdWVyeSBzbmlwcGV0c1xudHlwZSBMMVBhcnRzPFEgZXh0ZW5kcyBzdHJpbmc+ID0gUSBleHRlbmRzIGAke2luZmVyIEwxfToke3N0cmluZ31gID8gTDEgOiBRO1xuLy8gZ2V0cyBhbGwgTDIgcXVlcnkgc25pcHBldHMgZm9yIHRoZSBnaXZlbiBMMSBwYXJ0LCBvciBgbmV2ZXJgXG50eXBlIEwyUGFydHM8XG4gICAgUSBleHRlbmRzIHN0cmluZyxcbiAgICBMMSBleHRlbmRzIHN0cmluZyxcbj4gPSBRIGV4dGVuZHMgYCR7TDF9OiR7aW5mZXIgTDJ9OiR7c3RyaW5nfWAgPyBMMlxuICAgIDogUSBleHRlbmRzIGAke0wxfToke2luZmVyIEwyfWAgPyBMMlxuICAgIDogbmV2ZXI7XG5cbi8vIGJ1aWxkIHVwIGFsbCBjb21iaW5hdGlvbnMgb2YgYWxsIEwxIGZpZWxkc1xudHlwZSBMMURpc2NyaW1pbmF0b3I8USBleHRlbmRzIHN0cmluZywgTDEgZXh0ZW5kcyBzdHJpbmc+ID0gQ29tYmluZTxcbiAgICBMMUZyYWdtZW50PFEsIEwxPixcbiAgICBMMVxuPjtcbi8vIG1hcHMgZWFjaCBMMSBwYXJ0IG9mIHRoZSBmaWx0ZXIgcXVlcnkgdG8gYW4gb2JqZWN0XG50eXBlIEwxRnJhZ21lbnQ8USBleHRlbmRzIHN0cmluZywgTDEgZXh0ZW5kcyBzdHJpbmc+ID0gTDEgZXh0ZW5kcyB1bmtub3duXG4gICAgPyBSZWNvcmQ8TDEsIEwyRGlzY3JpbWluYXRvcjxMMSwgTDJQYXJ0czxRLCBMMT4+PlxuICAgIDogbmV2ZXI7XG5cbi8vIGJ1aWxkIHVwIGFsbCBjb21iaW5hdGlvbnMgb2YgYWxsIEwyIGZpZWxkc1xudHlwZSBMMkRpc2NyaW1pbmF0b3I8TDEgZXh0ZW5kcyBzdHJpbmcsIEwyIGV4dGVuZHMgc3RyaW5nPiA9IFtMMl0gZXh0ZW5kc1xuICAgIFtuZXZlcl0gPyBMMlNoYWxsb3dGcmFnbWVudDxMMT4gLy8gc2hvcnQtY2lyY3VpdCBMMSBxdWVyaWVzIChMMiBpcyBuZXZlciksIG9ubHkgYWRkIHR3aW5zXG4gICAgOiBDb21iaW5lPEwyRnJhZ21lbnQ8TDEsIEwyPiwgTDI+O1xuLy8gbWFwcyBlYWNoIEwyIHBhcnQgb2YgdGhlIGZpbHRlciBxdWVyeSB0byBhbiBvYmplY3QgYW5kIGhhbmRsZXMgc2libGluZ3NcbnR5cGUgTDJGcmFnbWVudDxMMSBleHRlbmRzIHN0cmluZywgTDIgZXh0ZW5kcyBzdHJpbmc+ID0gTDIgZXh0ZW5kcyB1bmtub3duXG4gICAgPyBSZWNvcmQ8TDIgfCBBZGRUd2luczxMMSwgTDI+LCBOb3RVbmRlZmluZWQ+XG4gICAgOiBuZXZlcjtcbi8vIGRvZXMgdGhlIHNhbWUgYXMgTDFGcmFnbWVudCBidXQgd2l0aG91dCBjb21iaW5pbmcgTDIgcHJvcGVydGllc1xudHlwZSBMMlNoYWxsb3dGcmFnbWVudDxMMSBleHRlbmRzIHN0cmluZz4gPSBSZWNvcmQ8XG4gICAgQWRkVHdpbnM8TDEsIG5ldmVyPixcbiAgICBOb3RVbmRlZmluZWRcbj47XG5cbi8vIGRlZmluZSBhZGRpdGlvbmFsIGZpZWxkcyBvbiBVIHdpdGggdmFsdWUgYHVuZGVmaW5lZGBcbnR5cGUgQ29tYmluZTxVLCBLIGV4dGVuZHMgc3RyaW5nPiA9IFUgZXh0ZW5kcyB1bmtub3duXG4gICAgPyBVICYgUGFydGlhbDxSZWNvcmQ8RXhjbHVkZTxLLCBrZXlvZiBVPiwgdW5kZWZpbmVkPj5cbiAgICA6IG5ldmVyO1xuXG4vKipcbiAqIFRoaXMgdHlwZSBpbmZlcnMgd2hpY2ggcHJvcGVydGllcyB3aWxsIGJlIHByZXNlbnQgb24gdGhlIGdpdmVuIGNvbnRleHQgb2JqZWN0XG4gKiBwcm92aWRlZCBpdCBtYXRjaGVzIHRoZSBnaXZlbiBmaWx0ZXIgcXVlcnkuIElmIHRoZSBmaWx0ZXIgcXVlcnkgaXMgYSB1bmlvblxuICogdHlwZSwgdGhlIHByb2R1Y2VkIGNvbnRleHQgb2JqZWN0IHdpbGwgYmUgYSB1bmlvbiBvZiBwb3NzaWJsZSBjb21iaW5hdGlvbnMsXG4gKiBoZW5jZSBhbGxvd2luZyB5b3UgdG8gbmFycm93IGRvd24gbWFudWFsbHkgd2hpY2ggb2YgdGhlIHByb3BlcnRpZXMgYXJlXG4gKiBwcmVzZW50LlxuICpcbiAqIEluIHNvbWUgc2Vuc2UsIHRoaXMgdHlwZSBjb21wdXRlcyBgbWF0Y2hGaWx0ZXJgIG9uIHRoZSB0eXBlIGxldmVsLlxuICovXG5leHBvcnQgdHlwZSBGaWx0ZXI8QyBleHRlbmRzIENvbnRleHQsIFEgZXh0ZW5kcyBGaWx0ZXJRdWVyeT4gPSBQZXJmb3JtUXVlcnk8XG4gICAgQyxcbiAgICBSdW5RdWVyeTxFeHBhbmRTaG9ydGN1dHM8UT4+XG4+O1xuLy8gc2FtZSBhcyBGaWx0ZXIgYnV0IHN0b3AgYmVmb3JlIGludGVyc2VjdGluZyB3aXRoIENvbnRleHRcbmV4cG9ydCB0eXBlIEZpbHRlckNvcmU8USBleHRlbmRzIEZpbHRlclF1ZXJ5PiA9IFBlcmZvcm1RdWVyeUNvcmU8XG4gICAgUnVuUXVlcnk8RXhwYW5kU2hvcnRjdXRzPFE+PlxuPjtcblxuLy8gYXBwbHkgYSBxdWVyeSByZXN1bHQgYnkgaW50ZXJzZWN0aW5nIGl0IHdpdGggVXBkYXRlLCBhbmQgdGhlbiBpbmplY3RpbmcgaW50byBDXG50eXBlIFBlcmZvcm1RdWVyeTxDIGV4dGVuZHMgQ29udGV4dCwgVSBleHRlbmRzIG9iamVjdD4gPSBVIGV4dGVuZHMgdW5rbm93blxuICAgID8gRmlsdGVyZWRDb250ZXh0PEMsIFVwZGF0ZSAmIFU+XG4gICAgOiBuZXZlcjtcbnR5cGUgUGVyZm9ybVF1ZXJ5Q29yZTxVIGV4dGVuZHMgb2JqZWN0PiA9IFUgZXh0ZW5kcyB1bmtub3duXG4gICAgPyBGaWx0ZXJlZENvbnRleHRDb3JlPFVwZGF0ZSAmIFU+XG4gICAgOiBuZXZlcjtcblxuLy8gc2V0IHRoZSBnaXZlbiB1cGRhdGUgaW50byBhIGdpdmVuIGNvbnRleHQgb2JqZWN0LCBhbmQgYWRqdXN0IHRoZSBhbGlhc2VzXG50eXBlIEZpbHRlcmVkQ29udGV4dDxDIGV4dGVuZHMgQ29udGV4dCwgVSBleHRlbmRzIFVwZGF0ZT4gPVxuICAgICYgQ1xuICAgICYgRmlsdGVyZWRDb250ZXh0Q29yZTxVPjtcblxuLy8gZ2VuZXJhdGUgYSBzdHJ1Y3R1cmUgd2l0aCBhbGwgYWxpYXNlcyBmb3IgYSBuYXJyb3dlZCB1cGRhdGVcbnR5cGUgRmlsdGVyZWRDb250ZXh0Q29yZTxVIGV4dGVuZHMgVXBkYXRlPiA9XG4gICAgJiBSZWNvcmQ8XCJ1cGRhdGVcIiwgVT5cbiAgICAmIFNob3J0Y3V0czxVPjtcblxuLy8gaGVscGVyIHR5cGUgdG8gaW5mZXIgc2hvcnRjdXRzIG9uIGNvbnRleHQgb2JqZWN0IGJhc2VkIG9uIHByZXNlbnQgcHJvcGVydGllcyxcbi8vIG11c3QgYmUgaW4gc3luYyB3aXRoIHNob3J0Y3V0IGltcGwhXG5pbnRlcmZhY2UgU2hvcnRjdXRzPFUgZXh0ZW5kcyBVcGRhdGU+IHtcbiAgICBtZXNzYWdlOiBbVVtcIm1lc3NhZ2VcIl1dIGV4dGVuZHMgW29iamVjdF0gPyBVW1wibWVzc2FnZVwiXSA6IHVuZGVmaW5lZDtcbiAgICBlZGl0ZWRNZXNzYWdlOiBbVVtcImVkaXRlZF9tZXNzYWdlXCJdXSBleHRlbmRzIFtvYmplY3RdID8gVVtcImVkaXRlZF9tZXNzYWdlXCJdXG4gICAgICAgIDogdW5kZWZpbmVkO1xuICAgIGNoYW5uZWxQb3N0OiBbVVtcImNoYW5uZWxfcG9zdFwiXV0gZXh0ZW5kcyBbb2JqZWN0XSA/IFVbXCJjaGFubmVsX3Bvc3RcIl1cbiAgICAgICAgOiB1bmRlZmluZWQ7XG4gICAgZWRpdGVkQ2hhbm5lbFBvc3Q6IFtVW1wiZWRpdGVkX2NoYW5uZWxfcG9zdFwiXV0gZXh0ZW5kcyBbb2JqZWN0XVxuICAgICAgICA/IFVbXCJlZGl0ZWRfY2hhbm5lbF9wb3N0XCJdXG4gICAgICAgIDogdW5kZWZpbmVkO1xuICAgIGJ1c2luZXNzQ29ubmVjdGlvbjogW1VbXCJidXNpbmVzc19jb25uZWN0aW9uXCJdXSBleHRlbmRzIFtvYmplY3RdXG4gICAgICAgID8gVVtcImJ1c2luZXNzX2Nvbm5lY3Rpb25cIl1cbiAgICAgICAgOiB1bmRlZmluZWQ7XG4gICAgYnVzaW5lc3NNZXNzYWdlOiBbVVtcImJ1c2luZXNzX21lc3NhZ2VcIl1dIGV4dGVuZHMgW29iamVjdF1cbiAgICAgICAgPyBVW1wiYnVzaW5lc3NfbWVzc2FnZVwiXVxuICAgICAgICA6IHVuZGVmaW5lZDtcbiAgICBlZGl0ZWRCdXNpbmVzc01lc3NhZ2U6IFtVW1wiZWRpdGVkX2J1c2luZXNzX21lc3NhZ2VcIl1dIGV4dGVuZHMgW29iamVjdF1cbiAgICAgICAgPyBVW1wiZWRpdGVkX2J1c2luZXNzX21lc3NhZ2VcIl1cbiAgICAgICAgOiB1bmRlZmluZWQ7XG4gICAgZGVsZXRlZEJ1c2luZXNzTWVzc2FnZXM6IFtVW1wiZGVsZXRlZF9idXNpbmVzc19tZXNzYWdlc1wiXV0gZXh0ZW5kcyBbb2JqZWN0XVxuICAgICAgICA/IFVbXCJkZWxldGVkX2J1c2luZXNzX21lc3NhZ2VzXCJdXG4gICAgICAgIDogdW5kZWZpbmVkO1xuICAgIG1lc3NhZ2VSZWFjdGlvbjogW1VbXCJtZXNzYWdlX3JlYWN0aW9uXCJdXSBleHRlbmRzIFtvYmplY3RdXG4gICAgICAgID8gVVtcIm1lc3NhZ2VfcmVhY3Rpb25cIl1cbiAgICAgICAgOiB1bmRlZmluZWQ7XG4gICAgbWVzc2FnZVJlYWN0aW9uQ291bnQ6IFtVW1wibWVzc2FnZV9yZWFjdGlvbl9jb3VudFwiXV0gZXh0ZW5kcyBbb2JqZWN0XVxuICAgICAgICA/IFVbXCJtZXNzYWdlX3JlYWN0aW9uX2NvdW50XCJdXG4gICAgICAgIDogdW5kZWZpbmVkO1xuICAgIGlubGluZVF1ZXJ5OiBbVVtcImlubGluZV9xdWVyeVwiXV0gZXh0ZW5kcyBbb2JqZWN0XSA/IFVbXCJpbmxpbmVfcXVlcnlcIl1cbiAgICAgICAgOiB1bmRlZmluZWQ7XG4gICAgY2hvc2VuSW5saW5lUmVzdWx0OiBbVVtcImNob3Nlbl9pbmxpbmVfcmVzdWx0XCJdXSBleHRlbmRzIFtvYmplY3RdXG4gICAgICAgID8gVVtcImNob3Nlbl9pbmxpbmVfcmVzdWx0XCJdXG4gICAgICAgIDogdW5kZWZpbmVkO1xuICAgIGNhbGxiYWNrUXVlcnk6IFtVW1wiY2FsbGJhY2tfcXVlcnlcIl1dIGV4dGVuZHMgW29iamVjdF0gPyBVW1wiY2FsbGJhY2tfcXVlcnlcIl1cbiAgICAgICAgOiB1bmRlZmluZWQ7XG4gICAgc2hpcHBpbmdRdWVyeTogW1VbXCJzaGlwcGluZ19xdWVyeVwiXV0gZXh0ZW5kcyBbb2JqZWN0XSA/IFVbXCJzaGlwcGluZ19xdWVyeVwiXVxuICAgICAgICA6IHVuZGVmaW5lZDtcbiAgICBwcmVDaGVja291dFF1ZXJ5OiBbVVtcInByZV9jaGVja291dF9xdWVyeVwiXV0gZXh0ZW5kcyBbb2JqZWN0XVxuICAgICAgICA/IFVbXCJwcmVfY2hlY2tvdXRfcXVlcnlcIl1cbiAgICAgICAgOiB1bmRlZmluZWQ7XG4gICAgcG9sbDogW1VbXCJwb2xsXCJdXSBleHRlbmRzIFtvYmplY3RdID8gVVtcInBvbGxcIl0gOiB1bmRlZmluZWQ7XG4gICAgcG9sbEFuc3dlcjogW1VbXCJwb2xsX2Fuc3dlclwiXV0gZXh0ZW5kcyBbb2JqZWN0XSA/IFVbXCJwb2xsX2Fuc3dlclwiXVxuICAgICAgICA6IHVuZGVmaW5lZDtcbiAgICBteUNoYXRNZW1iZXI6IFtVW1wibXlfY2hhdF9tZW1iZXJcIl1dIGV4dGVuZHMgW29iamVjdF0gPyBVW1wibXlfY2hhdF9tZW1iZXJcIl1cbiAgICAgICAgOiB1bmRlZmluZWQ7XG4gICAgY2hhdE1lbWJlcjogW1VbXCJjaGF0X21lbWJlclwiXV0gZXh0ZW5kcyBbb2JqZWN0XSA/IFVbXCJjaGF0X21lbWJlclwiXVxuICAgICAgICA6IHVuZGVmaW5lZDtcbiAgICBjaGF0Sm9pblJlcXVlc3Q6IFtVW1wiY2hhdF9qb2luX3JlcXVlc3RcIl1dIGV4dGVuZHMgW29iamVjdF1cbiAgICAgICAgPyBVW1wiY2hhdF9qb2luX3JlcXVlc3RcIl1cbiAgICAgICAgOiB1bmRlZmluZWQ7XG4gICAgY2hhdEJvb3N0OiBbVVtcImNoYXRfYm9vc3RcIl1dIGV4dGVuZHMgW29iamVjdF0gPyBVW1wiY2hhdF9ib29zdFwiXSA6IHVuZGVmaW5lZDtcbiAgICByZW1vdmVkQ2hhdEJvb3N0OiBbVVtcInJlbW92ZWRfY2hhdF9ib29zdFwiXV0gZXh0ZW5kcyBbb2JqZWN0XVxuICAgICAgICA/IFVbXCJyZW1vdmVkX2NoYXRfYm9vc3RcIl1cbiAgICAgICAgOiB1bmRlZmluZWQ7XG4gICAgbXNnOiBbVVtcIm1lc3NhZ2VcIl1dIGV4dGVuZHMgW29iamVjdF0gPyBVW1wibWVzc2FnZVwiXVxuICAgICAgICA6IFtVW1wiZWRpdGVkX21lc3NhZ2VcIl1dIGV4dGVuZHMgW29iamVjdF0gPyBVW1wiZWRpdGVkX21lc3NhZ2VcIl1cbiAgICAgICAgOiBbVVtcImNoYW5uZWxfcG9zdFwiXV0gZXh0ZW5kcyBbb2JqZWN0XSA/IFVbXCJjaGFubmVsX3Bvc3RcIl1cbiAgICAgICAgOiBbVVtcImVkaXRlZF9jaGFubmVsX3Bvc3RcIl1dIGV4dGVuZHMgW29iamVjdF0gPyBVW1wiZWRpdGVkX2NoYW5uZWxfcG9zdFwiXVxuICAgICAgICA6IFtVW1wiYnVzaW5lc3NfbWVzc2FnZVwiXV0gZXh0ZW5kcyBbb2JqZWN0XSA/IFVbXCJidXNpbmVzc19tZXNzYWdlXCJdXG4gICAgICAgIDogW1VbXCJlZGl0ZWRfYnVzaW5lc3NfbWVzc2FnZVwiXV0gZXh0ZW5kcyBbb2JqZWN0XVxuICAgICAgICAgICAgPyBVW1wiZWRpdGVkX2J1c2luZXNzX21lc3NhZ2VcIl1cbiAgICAgICAgOiBbVVtcImNhbGxiYWNrX3F1ZXJ5XCJdXSBleHRlbmRzIFtvYmplY3RdXG4gICAgICAgICAgICA/IFVbXCJjYWxsYmFja19xdWVyeVwiXVtcIm1lc3NhZ2VcIl1cbiAgICAgICAgOiB1bmRlZmluZWQ7XG4gICAgY2hhdDogW1VbXCJjYWxsYmFja19xdWVyeVwiXV0gZXh0ZW5kcyBbb2JqZWN0XVxuICAgICAgICA/IE5vbk51bGxhYmxlPFVbXCJjYWxsYmFja19xdWVyeVwiXVtcIm1lc3NhZ2VcIl0+W1wiY2hhdFwiXSB8IHVuZGVmaW5lZFxuICAgICAgICA6IFtTaG9ydGN1dHM8VT5bXCJtc2dcIl1dIGV4dGVuZHMgW29iamVjdF0gPyBTaG9ydGN1dHM8VT5bXCJtc2dcIl1bXCJjaGF0XCJdXG4gICAgICAgIDogW1VbXCJkZWxldGVkX2J1c2luZXNzX21lc3NhZ2VzXCJdXSBleHRlbmRzIFtvYmplY3RdXG4gICAgICAgICAgICA/IFVbXCJkZWxldGVkX2J1c2luZXNzX21lc3NhZ2VzXCJdW1wiY2hhdFwiXVxuICAgICAgICA6IFtVW1wibWVzc2FnZV9yZWFjdGlvblwiXV0gZXh0ZW5kcyBbb2JqZWN0XVxuICAgICAgICAgICAgPyBVW1wibWVzc2FnZV9yZWFjdGlvblwiXVtcImNoYXRcIl1cbiAgICAgICAgOiBbVVtcIm1lc3NhZ2VfcmVhY3Rpb25fY291bnRcIl1dIGV4dGVuZHMgW29iamVjdF1cbiAgICAgICAgICAgID8gVVtcIm1lc3NhZ2VfcmVhY3Rpb25fY291bnRcIl1bXCJjaGF0XCJdXG4gICAgICAgIDogW1VbXCJteV9jaGF0X21lbWJlclwiXV0gZXh0ZW5kcyBbb2JqZWN0XSA/IFVbXCJteV9jaGF0X21lbWJlclwiXVtcImNoYXRcIl1cbiAgICAgICAgOiBbVVtcImNoYXRfbWVtYmVyXCJdXSBleHRlbmRzIFtvYmplY3RdID8gVVtcImNoYXRfbWVtYmVyXCJdW1wiY2hhdFwiXVxuICAgICAgICA6IFtVW1wiY2hhdF9qb2luX3JlcXVlc3RcIl1dIGV4dGVuZHMgW29iamVjdF1cbiAgICAgICAgICAgID8gVVtcImNoYXRfam9pbl9yZXF1ZXN0XCJdW1wiY2hhdFwiXVxuICAgICAgICA6IFtVW1wiY2hhdF9ib29zdFwiXV0gZXh0ZW5kcyBbb2JqZWN0XSA/IFVbXCJjaGF0X2Jvb3N0XCJdW1wiY2hhdFwiXVxuICAgICAgICA6IFtVW1wicmVtb3ZlZF9jaGF0X2Jvb3N0XCJdXSBleHRlbmRzIFtvYmplY3RdXG4gICAgICAgICAgICA/IFVbXCJyZW1vdmVkX2NoYXRfYm9vc3RcIl1bXCJjaGF0XCJdXG4gICAgICAgIDogdW5kZWZpbmVkO1xuICAgIHNlbmRlckNoYXQ6IFtTaG9ydGN1dHM8VT5bXCJtc2dcIl1dIGV4dGVuZHMgW29iamVjdF1cbiAgICAgICAgPyBTaG9ydGN1dHM8VT5bXCJtc2dcIl1bXCJzZW5kZXJfY2hhdFwiXVxuICAgICAgICA6IHVuZGVmaW5lZDtcbiAgICBmcm9tOiBbVVtcImJ1c2luZXNzX2Nvbm5lY3Rpb25cIl1dIGV4dGVuZHMgW29iamVjdF1cbiAgICAgICAgPyBVW1wiYnVzaW5lc3NfY29ubmVjdGlvblwiXVtcInVzZXJcIl1cbiAgICAgICAgOiBbVVtcIm1lc3NhZ2VfcmVhY3Rpb25cIl1dIGV4dGVuZHMgW29iamVjdF1cbiAgICAgICAgICAgID8gVVtcIm1lc3NhZ2VfcmVhY3Rpb25cIl1bXCJ1c2VyXCJdXG4gICAgICAgIDogW1VbXCJjaGF0X2Jvb3N0XCJdXSBleHRlbmRzIFtvYmplY3RdXG4gICAgICAgICAgICA/IFVbXCJjaGF0X2Jvb3N0XCJdW1wiYm9vc3RcIl1bXCJzb3VyY2VcIl1bXCJ1c2VyXCJdXG4gICAgICAgIDogW1VbXCJyZW1vdmVkX2NoYXRfYm9vc3RcIl1dIGV4dGVuZHMgW29iamVjdF1cbiAgICAgICAgICAgID8gVVtcInJlbW92ZWRfY2hhdF9ib29zdFwiXVtcInNvdXJjZVwiXVtcInVzZXJcIl1cbiAgICAgICAgOiBbVVtcImNhbGxiYWNrX3F1ZXJ5XCJdXSBleHRlbmRzIFtvYmplY3RdID8gVVtcImNhbGxiYWNrX3F1ZXJ5XCJdW1wiZnJvbVwiXVxuICAgICAgICA6IFtTaG9ydGN1dHM8VT5bXCJtc2dcIl1dIGV4dGVuZHMgW29iamVjdF0gPyBTaG9ydGN1dHM8VT5bXCJtc2dcIl1bXCJmcm9tXCJdXG4gICAgICAgIDogW1VbXCJpbmxpbmVfcXVlcnlcIl1dIGV4dGVuZHMgW29iamVjdF0gPyBVW1wiaW5saW5lX3F1ZXJ5XCJdW1wiZnJvbVwiXVxuICAgICAgICA6IFtVW1wiY2hvc2VuX2lubGluZV9yZXN1bHRcIl1dIGV4dGVuZHMgW29iamVjdF1cbiAgICAgICAgICAgID8gVVtcImNob3Nlbl9pbmxpbmVfcmVzdWx0XCJdW1wiZnJvbVwiXVxuICAgICAgICA6IFtVW1wic2hpcHBpbmdfcXVlcnlcIl1dIGV4dGVuZHMgW29iamVjdF0gPyBVW1wic2hpcHBpbmdfcXVlcnlcIl1bXCJmcm9tXCJdXG4gICAgICAgIDogW1VbXCJwcmVfY2hlY2tvdXRfcXVlcnlcIl1dIGV4dGVuZHMgW29iamVjdF1cbiAgICAgICAgICAgID8gVVtcInByZV9jaGVja291dF9xdWVyeVwiXVtcImZyb21cIl1cbiAgICAgICAgOiBbVVtcIm15X2NoYXRfbWVtYmVyXCJdXSBleHRlbmRzIFtvYmplY3RdID8gVVtcIm15X2NoYXRfbWVtYmVyXCJdW1wiZnJvbVwiXVxuICAgICAgICA6IFtVW1wiY2hhdF9tZW1iZXJcIl1dIGV4dGVuZHMgW29iamVjdF0gPyBVW1wiY2hhdF9tZW1iZXJcIl1bXCJmcm9tXCJdXG4gICAgICAgIDogW1VbXCJjaGF0X2pvaW5fcmVxdWVzdFwiXV0gZXh0ZW5kcyBbb2JqZWN0XVxuICAgICAgICAgICAgPyBVW1wiY2hhdF9qb2luX3JlcXVlc3RcIl1bXCJmcm9tXCJdXG4gICAgICAgIDogdW5kZWZpbmVkO1xuICAgIG1zZ0lkOiBbVVtcImNhbGxiYWNrX3F1ZXJ5XCJdXSBleHRlbmRzIFtvYmplY3RdID8gbnVtYmVyIHwgdW5kZWZpbmVkXG4gICAgICAgIDogW1Nob3J0Y3V0czxVPltcIm1zZ1wiXV0gZXh0ZW5kcyBbb2JqZWN0XSA/IG51bWJlclxuICAgICAgICA6IFtVW1wibWVzc2FnZV9yZWFjdGlvblwiXV0gZXh0ZW5kcyBbb2JqZWN0XSA/IG51bWJlclxuICAgICAgICA6IFtVW1wibWVzc2FnZV9yZWFjdGlvbl9jb3VudFwiXV0gZXh0ZW5kcyBbb2JqZWN0XSA/IG51bWJlclxuICAgICAgICA6IHVuZGVmaW5lZDtcbiAgICBjaGF0SWQ6IFtVW1wiY2FsbGJhY2tfcXVlcnlcIl1dIGV4dGVuZHMgW29iamVjdF0gPyBudW1iZXIgfCB1bmRlZmluZWRcbiAgICAgICAgOiBbU2hvcnRjdXRzPFU+W1wiY2hhdFwiXV0gZXh0ZW5kcyBbb2JqZWN0XSA/IG51bWJlclxuICAgICAgICA6IFtVW1wiYnVzaW5lc3NfY29ubmVjdGlvblwiXV0gZXh0ZW5kcyBbb2JqZWN0XSA/IG51bWJlclxuICAgICAgICA6IHVuZGVmaW5lZDtcbiAgICAvLyBpbmxpbmVNZXNzYWdlSWQ6IGRpc3JlZ2FyZGVkIGhlcmUgYmVjYXVzZSBhbHdheXMgb3B0aW9uYWwgb24gYm90aCB0eXBlc1xuICAgIGJ1c2luZXNzQ29ubmVjdGlvbklkOiBbVVtcImNhbGxiYWNrX3F1ZXJ5XCJdXSBleHRlbmRzIFtvYmplY3RdXG4gICAgICAgID8gc3RyaW5nIHwgdW5kZWZpbmVkXG4gICAgICAgIDogW1Nob3J0Y3V0czxVPltcIm1zZ1wiXV0gZXh0ZW5kcyBbb2JqZWN0XSA/IHN0cmluZyB8IHVuZGVmaW5lZFxuICAgICAgICA6IFtVW1wiYnVzaW5lc3NfY29ubmVjdGlvblwiXV0gZXh0ZW5kcyBbb2JqZWN0XSA/IHN0cmluZ1xuICAgICAgICA6IFtVW1wiZGVsZXRlZF9idXNpbmVzc19tZXNzYWdlc1wiXV0gZXh0ZW5kcyBbb2JqZWN0XSA/IHN0cmluZ1xuICAgICAgICA6IHVuZGVmaW5lZDtcbn1cblxuLy8gPT09IERlZmluZSBzb21lIGhlbHBlcnMgZm9yIGhhbmRsaW5nIHNob3J0Y3V0cywgZS5nLiBpbiAnZWRpdDpwaG90bydcbmNvbnN0IEwxX1NIT1JUQ1VUUyA9IHtcbiAgICBcIlwiOiBbXCJtZXNzYWdlXCIsIFwiY2hhbm5lbF9wb3N0XCJdLFxuICAgIG1zZzogW1wibWVzc2FnZVwiLCBcImNoYW5uZWxfcG9zdFwiXSxcbiAgICBlZGl0OiBbXCJlZGl0ZWRfbWVzc2FnZVwiLCBcImVkaXRlZF9jaGFubmVsX3Bvc3RcIl0sXG59IGFzIGNvbnN0O1xuY29uc3QgTDJfU0hPUlRDVVRTID0ge1xuICAgIFwiXCI6IFtcImVudGl0aWVzXCIsIFwiY2FwdGlvbl9lbnRpdGllc1wiXSxcbiAgICBtZWRpYTogW1wicGhvdG9cIiwgXCJ2aWRlb1wiXSxcbiAgICBmaWxlOiBbXG4gICAgICAgIFwicGhvdG9cIixcbiAgICAgICAgXCJhbmltYXRpb25cIixcbiAgICAgICAgXCJhdWRpb1wiLFxuICAgICAgICBcImRvY3VtZW50XCIsXG4gICAgICAgIFwidmlkZW9cIixcbiAgICAgICAgXCJ2aWRlb19ub3RlXCIsXG4gICAgICAgIFwidm9pY2VcIixcbiAgICAgICAgXCJzdGlja2VyXCIsXG4gICAgXSxcbn0gYXMgY29uc3Q7XG50eXBlIEwxU2hvcnRjdXRzID0gS2V5T2Y8dHlwZW9mIEwxX1NIT1JUQ1VUUz47XG50eXBlIEwyU2hvcnRjdXRzID0gS2V5T2Y8dHlwZW9mIEwyX1NIT1JUQ1VUUz47XG5cbnR5cGUgRXhwYW5kU2hvcnRjdXRzPFEgZXh0ZW5kcyBzdHJpbmc+ID0gUSBleHRlbmRzXG4gICAgYCR7aW5mZXIgTDF9OiR7aW5mZXIgTDJ9OiR7aW5mZXIgTDN9YFxuICAgID8gYCR7RXhwYW5kTDE8TDE+fToke0V4cGFuZEwyPEwyPn06JHtMM31gXG4gICAgOiBRIGV4dGVuZHMgYCR7aW5mZXIgTDF9OiR7aW5mZXIgTDJ9YCA/IGAke0V4cGFuZEwxPEwxPn06JHtFeHBhbmRMMjxMMj59YFxuICAgIDogRXhwYW5kTDE8UT47XG50eXBlIEV4cGFuZEwxPFMgZXh0ZW5kcyBzdHJpbmc+ID0gUyBleHRlbmRzIEwxU2hvcnRjdXRzXG4gICAgPyB0eXBlb2YgTDFfU0hPUlRDVVRTW1NdW251bWJlcl1cbiAgICA6IFM7XG50eXBlIEV4cGFuZEwyPFMgZXh0ZW5kcyBzdHJpbmc+ID0gUyBleHRlbmRzIEwyU2hvcnRjdXRzXG4gICAgPyB0eXBlb2YgTDJfU0hPUlRDVVRTW1NdW251bWJlcl1cbiAgICA6IFM7XG5cbi8vID09PSBEZWZpbmUgc29tZSBoZWxwZXJzIGZvciB3aGVuIG9uZSBwcm9wZXJ0eSBpbXBsaWVzIHRoZSBleGlzdGVuY2Ugb2Ygb3RoZXJzXG5cbi8vIG1lcmdlcyB0d2lucyBiYXNlZCBvbiBMMSB3aXRoIHRob3NlIGJhc2VkIG9uIEwxIGFuZCBMMlxudHlwZSBBZGRUd2luczxMMSBleHRlbmRzIHN0cmluZywgTDIgZXh0ZW5kcyBzdHJpbmc+ID1cbiAgICB8IFR3aW5zRnJvbUwxPEwxLCBMMj5cbiAgICB8IFR3aW5zRnJvbUwyPEwxLCBMMj47XG5cbi8vIHlpZWxkcyB0d2lucyBiYXNlZCBvbiBhIGdpdmVuIEwxIHByb3BlcnR5XG50eXBlIFR3aW5zRnJvbUwxPEwxIGV4dGVuZHMgc3RyaW5nLCBMMiBleHRlbmRzIHN0cmluZz4gPSBMMSBleHRlbmRzXG4gICAgS2V5T2Y8TDFFcXVpdmFsZW50cz4gPyBMMUVxdWl2YWxlbnRzW0wxXVxuICAgIDogTDI7XG50eXBlIEwxRXF1aXZhbGVudHMgPSB7XG4gICAgbWVzc2FnZTogXCJmcm9tXCI7XG4gICAgZWRpdGVkX21lc3NhZ2U6IFwiZnJvbVwiIHwgXCJlZGl0X2RhdGVcIjtcbiAgICBjaGFubmVsX3Bvc3Q6IFwic2VuZGVyX2NoYXRcIjtcbiAgICBlZGl0ZWRfY2hhbm5lbF9wb3N0OiBcInNlbmRlcl9jaGF0XCIgfCBcImVkaXRfZGF0ZVwiO1xuICAgIGJ1c2luZXNzX21lc3NhZ2U6IFwiZnJvbVwiO1xuICAgIGVkaXRlZF9idXNpbmVzc19tZXNzYWdlOiBcImZyb21cIiB8IFwiZWRpdF9kYXRlXCI7XG59O1xuXG4vLyB5aWVsZHMgdHdpbnMgYmFzZWQgb24gZ2l2ZW4gTDEgYW5kIEwyIHByb3BlcnRpZXNcbnR5cGUgVHdpbnNGcm9tTDI8TDEgZXh0ZW5kcyBzdHJpbmcsIEwyIGV4dGVuZHMgc3RyaW5nPiA9IEwxIGV4dGVuZHNcbiAgICBLZXlPZjxMMkVxdWl2YWxlbnRzPlxuICAgID8gTDIgZXh0ZW5kcyBLZXlPZjxMMkVxdWl2YWxlbnRzW0wxXT4gPyBMMkVxdWl2YWxlbnRzW0wxXVtMMl0gOiBMMlxuICAgIDogTDI7XG50eXBlIEwyRXF1aXZhbGVudHMgPSB7XG4gICAgbWVzc2FnZTogTWVzc2FnZUVxdWl2YWxlbnRzO1xuICAgIGVkaXRlZF9tZXNzYWdlOiBNZXNzYWdlRXF1aXZhbGVudHM7XG4gICAgY2hhbm5lbF9wb3N0OiBNZXNzYWdlRXF1aXZhbGVudHM7XG4gICAgZWRpdGVkX2NoYW5uZWxfcG9zdDogTWVzc2FnZUVxdWl2YWxlbnRzO1xuICAgIGJ1c2luZXNzX21lc3NhZ2U6IE1lc3NhZ2VFcXVpdmFsZW50cztcbiAgICBlZGl0ZWRfYnVzaW5lc3NfbWVzc2FnZTogTWVzc2FnZUVxdWl2YWxlbnRzO1xufTtcbnR5cGUgTWVzc2FnZUVxdWl2YWxlbnRzID0ge1xuICAgIGFuaW1hdGlvbjogXCJkb2N1bWVudFwiO1xuICAgIGVudGl0aWVzOiBcInRleHRcIjtcbiAgICBjYXB0aW9uX2VudGl0aWVzOiBcImNhcHRpb25cIjtcbiAgICBpc190b3BpY19tZXNzYWdlOiBcIm1lc3NhZ2VfdGhyZWFkX2lkXCI7XG59O1xuIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLGtEQUFrRDtBQU1sRCxNQUFNLG1CQUFtQixJQUFJO0FBRTdCLDZDQUE2QztBQUM3Qzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztDQXNCQyxHQUNELE9BQU8sU0FBUyxZQUNaLE1BQWUsRUFDZ0I7SUFDL0IsTUFBTSxVQUFVLE1BQU0sT0FBTyxDQUFDLFVBQVUsU0FBUztRQUFDO0tBQU87SUFDekQsTUFBTSxNQUFNLFFBQVEsSUFBSSxDQUFDO0lBQ3pCLE1BQU0sWUFBWSxpQkFBaUIsR0FBRyxDQUFDLFFBQVEsQUFBQyxDQUFBLElBQU07UUFDbEQsTUFBTSxTQUFTLE1BQU07UUFDckIsTUFBTSxPQUFPLFFBQVE7UUFDckIs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