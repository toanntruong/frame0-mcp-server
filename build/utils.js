import fetch from "node-fetch";
const URL = "http://localhost:3000";
export async function executeCommand(command, args = {}) {
    const res = await fetch(`${URL}/execute_command`, {
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
        throw new Error(`Failed to execute command(${command}) with args`, args);
    }
    const json = (await res.json());
    if (!json.success) {
        throw new Error(`Command failed: ${json.error}`);
    }
    return json.data;
}
export function textResult(text) {
    return {
        content: [
            {
                type: "text",
                text,
            },
        ],
    };
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
    if (recursive) {
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
        size: page.size,
        children: page.children?.map((shape) => {
            return filterShape(shape, true);
        }),
    };
    return json;
}
