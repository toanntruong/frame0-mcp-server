import fetch from "node-fetch";
export const ARROWHEADS = [
    "none",
    "arrow",
    "bar",
    "circle",
    "circle-filled",
    "circle-plus",
    "cross",
    "crowfoot-many",
    "crowfoot-one",
    "crowfoot-one-many",
    "crowfoot-only-one",
    "crowfoot-zero-many",
    "crowfoot-zero-one",
    "diamond",
    "diamond-filled",
    "dot",
    "plus",
    "solid-arrow",
    "square",
    "triangle",
    "triangle-filled",
];
export async function command(host, port, command, args = {}) {
    const res = await fetch(`http://${host}:${port}/execute_command`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            command,
            args,
        }),
    });
    if (!res.ok) {
        throw new Error(`Failed to execute command(${command}) with args: ${JSON.stringify(args)}`);
    }
    const json = (await res.json());
    if (!json.success) {
        throw new Error(`Command failed: ${json.error}`);
    }
    return json.data;
}
export function filterShape(shape, recursive = false) {
    const json = {
        id: shape.id,
        parentId: shape.parentId,
        type: shape.type,
        name: shape.name,
        left: shape.left,
        top: shape.top,
        width: shape.width,
        height: shape.height,
        fillColor: shape.fillColor,
        strokeColor: shape.strokeColor,
        strokeWidth: shape.strokeWidth,
        fontColor: shape.fontColor,
        fontSize: shape.fontSize,
    };
    if (typeof shape.text !== "undefined")
        json.text = shape.text; // TODO: convert node to text
    if (typeof shape.wordWrap !== "undefined")
        json.wordWrap = shape.wordWrap;
    if (typeof shape.corners !== "undefined")
        json.corners = shape.corners;
    if (typeof shape.horzAlign !== "undefined")
        json.horzAlign = shape.horzAlign;
    if (typeof shape.vertAlign !== "undefined")
        json.vertAlign = shape.vertAlign;
    if (typeof shape.path !== "undefined")
        json.path = shape.path;
    if (typeof shape.referenceId !== "undefined")
        json.linkToPage = shape.referenceId;
    if (recursive && Array.isArray(shape.children)) {
        json.children = shape.children.map((child) => {
            return filterShape(child, recursive);
        });
    }
    return json;
}
export function filterPage(page) {
    const json = {
        id: page.id,
        name: page.name,
        children: page.children?.map((shape) => {
            return filterShape(shape, true);
        }),
    };
    return json;
}
export function convertArrowhead(arrowhead) {
    switch (arrowhead) {
        case "none":
            return "flat"; // "flat" in dgmjs
        default:
            return arrowhead;
    }
}
/**
 * Trim object by removing undefined values.
 */
export function trimObject(obj) {
    const result = {};
    Object.keys(obj).forEach((key) => {
        if (obj[key] !== undefined) {
            result[key] = obj[key];
        }
    });
    return result;
}
