export function text(text) {
    return {
        content: [
            {
                type: "text",
                text,
            },
        ],
    };
}
export function error(text) {
    return {
        content: [
            {
                type: "text",
                text,
            },
        ],
        isError: true,
    };
}
export function image(mimeType, data) {
    return {
        content: [
            {
                type: "image",
                data,
                mimeType,
            },
        ],
    };
}
