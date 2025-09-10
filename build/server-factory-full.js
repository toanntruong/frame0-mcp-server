import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import * as response from "./response.js";
import { JsonRpcErrorCode } from "./response.js";
import { ARROWHEADS, convertArrowhead, command, filterPage, filterShape, trimObject, } from "./utils.js";
import packageJson from "../package.json" with { type: "json" };
const NAME = "frame0-mcp-server";
const VERSION = packageJson.version;
export function createFrame0Server(apiHost, apiPort) {
    // Create an MCP server
    const server = new McpServer({
        name: NAME,
        version: VERSION,
    });
    server.tool("create_frame", "Create a frame shape in Frame0. Must add a new page before you create a new frame.", {
        frameType: z
            .enum(["phone", "tablet", "desktop", "browser", "watch", "tv"])
            .describe("Type of the frame shape to create."),
        name: z.string().describe("Name of the frame shape."),
        fillColor: z
            .string()
            .optional()
            .default("#ffffff")
            .describe("Background color in hex code of the frame shape."),
    }, async ({ frameType, name, fillColor }) => {
        const FRAME_NAME = {
            phone: "Phone",
            tablet: "Tablet",
            desktop: "Desktop",
            browser: "Browser",
            watch: "Watch",
            tv: "TV",
        };
        const FRAME_SIZE = {
            phone: { width: 320, height: 690 },
            tablet: { width: 600, height: 800 },
            desktop: { width: 800, height: 600 },
            browser: { width: 800, height: 600 },
            watch: { width: 198, height: 242 },
            tv: { width: 960, height: 570 },
        };
        const FRAME_HEADER_HEIGHT = {
            phone: 0,
            tablet: 0,
            desktop: 32,
            browser: 76,
            watch: 0,
            tv: 0,
        };
        try {
            // frame headers should be consider to calculate actual content area
            const frameHeaderHeight = FRAME_HEADER_HEIGHT[frameType];
            const frameSize = FRAME_SIZE[frameType];
            const frameName = FRAME_NAME[frameType];
            const shapeId = await command(apiHost, apiPort, "shape:create-shape-from-library-by-query", {
                query: `${frameName}&@Frame`,
                shapeProps: trimObject({
                    name,
                    left: 0,
                    top: -frameHeaderHeight,
                    width: frameSize.width,
                    height: frameSize.height + frameHeaderHeight,
                    fillColor,
                }),
                convertColors: true,
            });
            await command(apiHost, apiPort, "view:fit-to-screen");
            const data = await command(apiHost, apiPort, "shape:get-shape", {
                shapeId,
            });
            return response.text("Created frame: " +
                JSON.stringify({
                    ...filterShape(data),
                    top: -frameHeaderHeight,
                    height: frameSize.height + frameHeaderHeight,
                }));
        }
        catch (error) {
            console.error(error);
            return response.error(JsonRpcErrorCode.InternalError, `Failed to create frame: ${error instanceof Error ? error.message : String(error)}`);
        }
    });
    server.tool("create_rectangle", `Create a rectangle shape in Frame0.`, {
        name: z.string().describe("Name of the rectangle shape."),
        parentId: z
            .string()
            .optional()
            .describe("ID of the parent shape. Typically frame ID."),
        left: z
            .number()
            .describe("Left position of the rectangle shape in the absolute coordinate system."),
        top: z
            .number()
            .describe("Top position of the rectangle shape in the absolute coordinate system."),
        width: z.number().describe("Width of the rectangle shape."),
        height: z.number().describe("Height of the rectangle shape."),
        fillColor: z
            .string()
            .optional()
            .default("#ffffff")
            .describe("Fill color in hex code of the rectangle shape."),
        strokeColor: z
            .string()
            .optional()
            .default("#000000")
            .describe("Stroke color in hex code of the rectangle shape."),
        corners: z
            .array(z.number())
            .length(4)
            .optional()
            .default([0, 0, 0, 0])
            .describe("Corner radius of the rectangle shape. Must be in the form of [left-top, right-top, right-bottom, left-bottom]."),
    }, async ({ name, parentId, left, top, width, height, fillColor, strokeColor, corners, }) => {
        try {
            const shapeId = await command(apiHost, apiPort, "shape:create-shape", {
                type: "Rectangle",
                shapeProps: trimObject({
                    name,
                    left,
                    top,
                    width,
                    height,
                    fillColor,
                    strokeColor,
                    corners,
                }),
                parentId,
                convertColors: true,
            });
            const data = await command(apiHost, apiPort, "shape:get-shape", {
                shapeId,
            });
            return response.text("Created rectangle: " + JSON.stringify(filterShape(data)));
        }
        catch (error) {
            console.error(error);
            return response.error(JsonRpcErrorCode.InternalError, `Failed to create rectangle: ${error instanceof Error ? error.message : String(error)}`);
        }
    });
    server.tool("create_ellipse", `Create an ellipse shape in Frame0.`, {
        name: z.string().describe("Name of the ellipse shape."),
        parentId: z
            .string()
            .optional()
            .describe("ID of the parent shape. Typically frame ID."),
        left: z
            .number()
            .describe("Left position of the ellipse shape in the absolute coordinate system."),
        top: z
            .number()
            .describe("Top position of the ellipse shape in the absolute coordinate system."),
        width: z.number().describe("Width of the ellipse shape."),
        height: z.number().describe("Height of the ellipse shape."),
        fillColor: z
            .string()
            .optional()
            .default("#ffffff")
            .describe("Fill color in hex code of the ellipse shape."),
        strokeColor: z
            .string()
            .optional()
            .default("#000000")
            .describe("Stroke color in hex code of the ellipse shape."),
    }, async ({ name, parentId, left, top, width, height, fillColor, strokeColor, }) => {
        try {
            const shapeId = await command(apiHost, apiPort, "shape:create-shape", {
                type: "Ellipse",
                shapeProps: trimObject({
                    name,
                    left,
                    top,
                    width,
                    height,
                    fillColor,
                    strokeColor,
                }),
                parentId,
                convertColors: true,
            });
            const data = await command(apiHost, apiPort, "shape:get-shape", {
                shapeId,
            });
            return response.text("Created ellipse: " + JSON.stringify(filterShape(data)));
        }
        catch (error) {
            console.error(error);
            return response.error(JsonRpcErrorCode.InternalError, `Failed to create ellipse: ${error instanceof Error ? error.message : String(error)}`);
        }
    });
    server.tool("create_text", "Create a text shape in Frame0.", {
        type: z
            .enum(["label", "paragraph", "heading", "link", "normal"])
            .optional()
            .describe("Type of the text shape to create. If type is 'paragraph', text width need to be updated using 'update_shape' tool."),
        name: z.string().describe("Name of the text shape."),
        parentId: z
            .string()
            .optional()
            .describe("ID of the parent shape. Typically frame ID."),
        left: z
            .number()
            .describe("Left position of the text shape in the absolute coordinate system. Position need to be adjusted using 'move_shape' tool based on the width and height of the created text."),
        top: z
            .number()
            .describe("Top position of the text shape in the absolute coordinate system.  Position need to be adjusted using 'move_shape' tool based on the width and height of the created text."),
        width: z
            .number()
            .optional()
            .describe("Width of the text shape. if the type is 'paragraph' recommend to set width."),
        text: z
            .string()
            .describe("Plain text content to display of the text shape. Use newline character (0x0A) instead of '\\n' for new line. Dont's use HTML and CSS code in the text content."),
        fontColor: z
            .string()
            .optional()
            .default("#000000")
            .describe("Font color in hex code of the text shape."),
        fontSize: z.number().optional().describe("Font size of the text shape."),
    }, async ({ type, name, parentId, left, top, width, text, fontColor, fontSize, }) => {
        try {
            const shapeId = await command(apiHost, apiPort, "shape:create-shape", {
                type: "Text",
                shapeProps: trimObject({
                    name,
                    left,
                    width,
                    top,
                    text,
                    fontColor,
                    fontSize,
                    wordWrap: type === "paragraph",
                }),
                parentId,
                convertColors: true,
            });
            const data = await command(apiHost, apiPort, "shape:get-shape", {
                shapeId,
            });
            return response.text("Created text: " +
                JSON.stringify({ ...filterShape(data), textType: type }));
        }
        catch (error) {
            console.error(error);
            return response.error(JsonRpcErrorCode.InternalError, `Failed to create text: ${error instanceof Error ? error.message : String(error)}`);
        }
    });
    server.tool("create_line", "Create a line shape in Frame0.", {
        name: z.string().describe("Name of the line shape."),
        parentId: z
            .string()
            .optional()
            .describe("ID of the parent shape. Typically frame ID."),
        x1: z.number().describe("X coordinate of the first point."),
        y1: z.number().describe("Y coordinate of the first point."),
        x2: z.number().describe("X coordinate of the second point."),
        y2: z.number().describe("Y coordinate of the second point."),
        strokeColor: z
            .string()
            .optional()
            .default("#000000")
            .describe("Stroke color in hex code of the line shape. (e.g., black) - temp string type"),
    }, async ({ name, parentId, x1, y1, x2, y2, strokeColor }) => {
        try {
            const shapeId = await command(apiHost, apiPort, "shape:create-shape", {
                type: "Line",
                shapeProps: trimObject({
                    name,
                    path: [
                        [x1, y1],
                        [x2, y2],
                    ],
                    tailEndType: "flat",
                    headEndType: "flat",
                    strokeColor,
                    lineType: "straight",
                }),
                parentId,
                convertColors: true,
            });
            const data = await command(apiHost, apiPort, "shape:get-shape", {
                shapeId,
            });
            return response.text("Created line: " + JSON.stringify(filterShape(data)));
        }
        catch (error) {
            console.error(error);
            return response.error(JsonRpcErrorCode.InternalError, `Failed to create line: ${error instanceof Error ? error.message : String(error)}`);
        }
    });
    server.tool("create_polygon", "Create a polygon or polyline shape in Frame0.", {
        name: z.string().describe("Name of the polygon shape."),
        parentId: z
            .string()
            .optional()
            .describe("ID of the parent shape. Typically frame ID."),
        points: z
            .array(z.object({
            x: z.number().describe("X coordinate of the point."),
            y: z.number().describe("Y coordinate of the point."),
        }))
            .min(3)
            .describe("Array of points defining the polygon shape."),
        closed: z
            .boolean()
            .optional()
            .default(true)
            .describe("Whether the polygon shape is closed or not. Default is true."),
        fillColor: z
            .string()
            .optional()
            .default("#ffffff")
            .describe("Fill color in hex code of the polygon shape. (e.g., white) - temp string type"),
        strokeColor: z
            .string()
            .optional()
            .default("#000000")
            .describe("Stroke color in hex code of the line shape. (e.g., black) - temp string type"),
    }, async ({ name, parentId, points, closed, strokeColor }) => {
        try {
            const path = points.map((point) => [point.x, point.y]);
            const pathClosed = path[0][0] === path[path.length - 1][0] &&
                path[0][1] === path[path.length - 1][1];
            if (closed && !pathClosed)
                path.push(path[0]);
            const shapeId = await command(apiHost, apiPort, "shape:create-shape", {
                type: "Line",
                shapeProps: trimObject({
                    name,
                    path,
                    tailEndType: "flat",
                    headEndType: "flat",
                    strokeColor,
                    lineType: "straight",
                }),
                parentId,
                convertColors: true,
            });
            const data = await command(apiHost, apiPort, "shape:get-shape", {
                shapeId,
            });
            return response.text("Created line: " + JSON.stringify(filterShape(data)));
        }
        catch (error) {
            console.error(error);
            return response.error(JsonRpcErrorCode.InternalError, `Failed to create line: ${error instanceof Error ? error.message : String(error)}`);
        }
    });
    server.tool("create_connector", "Create a connector shape in Frame0.", {
        name: z.string().describe("Name of the line shape."),
        parentId: z
            .string()
            .optional()
            .describe("ID of the parent shape. Typically frame ID."),
        startId: z.string().describe("ID of the start shape."),
        endId: z.string().describe("ID of the end shape."),
        startArrowhead: z
            .enum(ARROWHEADS)
            .optional()
            .default("none")
            .describe("Start arrowhead of the line shape."),
        endArrowhead: z
            .enum(ARROWHEADS)
            .optional()
            .default("none")
            .describe("End arrowhead of the line shape."),
        strokeColor: z
            .string()
            .optional()
            .default("#000000")
            .describe("Stroke color in hex code of the line. shape"),
    }, async ({ name, parentId, startId, endId, startArrowhead, endArrowhead, strokeColor, }) => {
        try {
            const shapeId = await command(apiHost, apiPort, "shape:create-connector", {
                tailId: startId,
                headId: endId,
                shapeProps: trimObject({
                    name,
                    tailEndType: convertArrowhead(startArrowhead || "none"),
                    headEndType: convertArrowhead(endArrowhead || "none"),
                    strokeColor,
                }),
                parentId,
                convertColors: true,
            });
            const data = await command(apiHost, apiPort, "shape:get-shape", {
                shapeId,
            });
            return response.text("Created connector: " + JSON.stringify(filterShape(data)));
        }
        catch (error) {
            console.error(error);
            return response.error(JsonRpcErrorCode.InternalError, `Failed to create connector: ${error instanceof Error ? error.message : String(error)}`);
        }
    });
    server.tool("create_icon", "Create an icon shape in Frame0.", {
        name: z
            .string()
            .describe("The name of the icon shape to create. The name should be one of the result of 'get_available_icons' tool."),
        parentId: z
            .string()
            .optional()
            .describe("ID of the parent shape. Typically frame ID."),
        left: z
            .number()
            .describe("Left position of the icon shape in the absolute coordinate system."),
        top: z
            .number()
            .describe("Top position of the icon shape in the absolute coordinate system."),
        size: z
            .enum(["small", "medium", "large", "extra-large"])
            .describe("Size of the icon shape. 'small' is 16 x 16, 'medium' is 24 x 24, 'large' is 32 x 32, 'extra-large' is 48 x 48."),
        strokeColor: z
            .string()
            .optional()
            .default("#000000")
            .describe(`Stroke color in hex code of the icon shape.`),
    }, async ({ name, parentId, left, top, size, strokeColor }) => {
        try {
            const sizeValue = {
                small: 16,
                medium: 24,
                large: 32,
                "extra-large": 48,
            }[size];
            const shapeId = await command(apiHost, apiPort, "shape:create-icon", {
                iconName: name,
                shapeProps: trimObject({
                    left,
                    top,
                    width: sizeValue ?? 24,
                    height: sizeValue ?? 24,
                    strokeColor,
                }),
                parentId,
                convertColors: true,
            });
            const data = await command(apiHost, apiPort, "shape:get-shape", {
                shapeId,
            });
            return response.text("Created icon: " + JSON.stringify(filterShape(data)));
        }
        catch (error) {
            console.error(error);
            return response.error(JsonRpcErrorCode.InternalError, `Failed to create icon: ${error instanceof Error ? error.message : String(error)}`);
        }
    });
    server.tool("create_image", "Create an image shape in Frame0.", {
        name: z.string().describe("The name of the image shape to create."),
        parentId: z
            .string()
            .optional()
            .describe("ID of the parent shape. Typically frame ID."),
        mimeType: z
            .enum(["image/png", "image/jpeg", "image/webp", "image/svg+xml"])
            .describe("MIME type of the image."),
        imageData: z.string().describe("Base64 encoded image data."),
        left: z
            .number()
            .describe("Left position of the image shape in the absolute coordinate system."),
        top: z
            .number()
            .describe("Top position of the image shape in the absolute coordinate system."),
    }, async ({ name, parentId, mimeType, imageData, left, top }) => {
        try {
            const shapeId = await command(apiHost, apiPort, "shape:create-image", {
                mimeType,
                imageData,
                shapeProps: trimObject({
                    name,
                    left,
                    top,
                }),
                parentId,
            });
            const data = await command(apiHost, apiPort, "shape:get-shape", {
                shapeId,
            });
            return response.text("Created image: " + JSON.stringify(filterShape(data)));
        }
        catch (error) {
            console.error(error);
            return response.error(JsonRpcErrorCode.InternalError, `Failed to create image: ${error instanceof Error ? error.message : String(error)}`);
        }
    });
    server.tool("update_shape", "Update properties of a shape in Frame0.", {
        shapeId: z.string().describe("ID of the shape to update"),
        name: z.string().optional().describe("Name of the shape."),
        width: z.number().optional().describe("Width of the shape."),
        height: z.number().optional().describe("Height of the shape."),
        fillColor: z
            .string()
            .optional()
            .describe("Fill color in hex code of the shape."),
        strokeColor: z
            .string()
            .optional()
            .describe("Stroke color in hex code of the shape."),
        fontColor: z
            .string()
            .optional()
            .describe("Font color in hex code of the text shape."),
        fontSize: z.number().optional().describe("Font size of the text shape."),
        corners: z
            .array(z.number())
            .length(4)
            .optional()
            .describe("Corner radius of the rectangle shape. Must be in the form of [left-top, right-top, right-bottom, left-bottom]."),
        text: z
            .string()
            .optional()
            .describe("Plain text content to display of the text shape. Don't include escape sequences and HTML and CSS code in the text content."),
    }, async ({ shapeId, name, width, height, strokeColor, fillColor, fontColor, fontSize, corners, text, }) => {
        try {
            const updatedId = await command(apiHost, apiPort, "shape:update-shape", {
                shapeId,
                shapeProps: trimObject({
                    name,
                    width,
                    height,
                    fillColor,
                    strokeColor,
                    fontColor,
                    fontSize,
                    corners,
                    text,
                }),
                convertColors: true,
            });
            const data = await command(apiHost, apiPort, "shape:get-shape", {
                shapeId: updatedId,
            });
            return response.text("Updated shape: " + JSON.stringify(filterShape(data)));
        }
        catch (error) {
            console.error(error);
            return response.error(JsonRpcErrorCode.InternalError, `Failed to update shape: ${error instanceof Error ? error.message : String(error)}`);
        }
    });
    server.tool("duplicate_shape", "Duplicate a shape in Frame0.", {
        shapeId: z.string().describe("ID of the shape to duplicate"),
        parentId: z
            .string()
            .optional()
            .describe("ID of the parent shape where the duplicated shape will be added. If not provided, the duplicated shape will be added to the current page."),
        dx: z
            .number()
            .optional()
            .describe("Delta X value by which the duplicated shape moves."),
        dy: z
            .number()
            .optional()
            .describe("Delta Y value by which the duplicated shape moves."),
    }, async ({ shapeId, parentId, dx, dy }) => {
        try {
            const duplicatedShapeIdArray = await command(apiHost, apiPort, "edit:duplicate", {
                shapeIdArray: [shapeId],
                parentId,
                dx,
                dy,
            });
            const duplicatedShapeId = duplicatedShapeIdArray[0];
            const data = await command(apiHost, apiPort, "shape:get-shape", {
                shapeId: duplicatedShapeId,
            });
            return response.text("Duplicated shape: " + JSON.stringify(filterShape(data)));
        }
        catch (error) {
            console.error(error);
            return response.error(JsonRpcErrorCode.InternalError, `Failed to duplicate shape: ${error instanceof Error ? error.message : String(error)}`);
        }
    });
    server.tool("delete_shape", "Delete a shape in Frame0.", { shapeId: z.string().describe("ID of the shape to delete") }, async ({ shapeId }) => {
        try {
            await command(apiHost, apiPort, "edit:delete", {
                shapeIdArray: [shapeId],
            });
            return response.text("Deleted shape of id: " + shapeId);
        }
        catch (error) {
            console.error(error);
            return response.error(JsonRpcErrorCode.InternalError, `Failed to delete shape: ${error instanceof Error ? error.message : String(error)}`);
        }
    });
    server.tool("search_icons", "Search icon shapes available in Frame0.", {
        keyword: z
            .string()
            .optional()
            .describe("Search keyword to filter icon by name or tags (case-insensitive)"),
    }, async ({ keyword }) => {
        try {
            const data = await command(apiHost, apiPort, "shape:get-available-icons", {});
            const icons = Array.isArray(data) ? data : [];
            const filtered = keyword
                ? icons.filter((icon) => {
                    if (typeof icon !== "object" ||
                        !icon.name ||
                        !Array.isArray(icon.tags)) {
                        return false;
                    }
                    const searchLower = keyword.toLowerCase();
                    return (icon.name.toLowerCase().includes(searchLower) ||
                        icon.tags.some((tag) => tag.toLowerCase().includes(searchLower)));
                })
                : icons;
            return response.text("Available icons: " + JSON.stringify(filtered));
        }
        catch (error) {
            console.error(error);
            return response.error(JsonRpcErrorCode.InternalError, `Failed to search available icons: ${error instanceof Error ? error.message : String(error)}`);
        }
    });
    server.tool("move_shape", "Move a shape in Frame0.", {
        shapeId: z.string().describe("ID of the shape to move"),
        dx: z.number().describe("Delta X"),
        dy: z.number().describe("Delta Y"),
    }, async ({ shapeId, dx, dy }) => {
        try {
            await command(apiHost, apiPort, "shape:move", {
                shapeId,
                dx,
                dy,
            });
            return response.text(`Moved shape (id: ${shapeId}) as (${dx}, ${dy})`);
        }
        catch (error) {
            console.error(error);
            return response.error(JsonRpcErrorCode.InternalError, `Failed to move shape: ${error instanceof Error ? error.message : String(error)}`);
        }
    });
    server.tool("align_shapes", "Align shapes in Frame0.", {
        alignType: z
            .enum([
            "bring-to-front",
            "send-to-back",
            "align-left",
            "align-right",
            "align-horizontal-center",
            "align-top",
            "align-bottom",
            "align-vertical-center",
            "distribute-horizontally",
            "distribute-vertically",
        ])
            .describe("Type of the alignment to apply."),
        shapeIdArray: z.array(z.string()).describe("Array of shape IDs to align"),
    }, async ({ alignType, shapeIdArray }) => {
        const COMMAND = {
            "bring-to-front": "align:bring-to-front",
            "send-to-back": "align:send-to-back",
            "align-left": "align:align-left",
            "align-right": "align:align-right",
            "align-horizontal-center": "align:align-center",
            "align-top": "align:align-top",
            "align-bottom": "align:align-bottom",
            "align-vertical-center": "align:align-middle",
            "distribute-horizontally": "align:horizontal-distribute",
            "distribute-vertically": "align:vertical-distribute",
        };
        try {
            await command(apiHost, apiPort, COMMAND[alignType], { shapeIdArray });
            return response.text("Shapes are aligned.");
        }
        catch (error) {
            console.error(error);
            return response.error(JsonRpcErrorCode.InternalError, `Failed to align shapes: ${error instanceof Error ? error.message : String(error)}`);
        }
    });
    server.tool("group", "Group shapes in Frame0.", {
        shapeIdArray: z.array(z.string()).describe("Array of shape IDs to group"),
        parentId: z
            .string()
            .optional()
            .describe("ID of the parent shape where the group will be added. If not provided, the group will be added to the current page."),
    }, async ({ shapeIdArray, parentId }) => {
        try {
            const groupId = await command(apiHost, apiPort, "shape:group", {
                shapeIdArray,
                parentId,
            });
            const data = await command(apiHost, apiPort, "shape:get-shape", {
                shapeId: groupId,
            });
            return response.text("Created group: " + JSON.stringify(filterShape(data)));
        }
        catch (error) {
            console.error(error);
            return response.error(JsonRpcErrorCode.InternalError, `Failed to group shapes: ${error instanceof Error ? error.message : String(error)}`);
        }
    });
    server.tool("ungroup", "Ungroup a group in Frame0.", {
        groupId: z.string().describe("ID of the group to ungroup"),
    }, async ({ groupId }) => {
        try {
            await command(apiHost, apiPort, "shape:ungroup", {
                shapeIdArray: [groupId],
            });
            return response.text("Deleted group of id: " + groupId);
        }
        catch (error) {
            console.error(error);
            return response.error(JsonRpcErrorCode.InternalError, `Failed to ungroup shapes: ${error instanceof Error ? error.message : String(error)}`);
        }
    });
    server.tool("set_link", "Set a link from a shape to a URL or a page in Frame0.", {
        shapeId: z.string().describe("ID of the shape to set link"),
        linkType: z
            .enum(["none", "web", "page", "action:backward"])
            .describe("Type of the link to set."),
        url: z
            .string()
            .optional()
            .describe("URL to set. Required if linkType is 'web'."),
        pageId: z
            .string()
            .optional()
            .describe("ID of the page to set. Required if linkType is 'page'."),
    }, async ({ shapeId, linkType, url, pageId }) => {
        try {
            await command(apiHost, apiPort, "shape:set-link", {
                shapeId,
                linkProps: trimObject({
                    linkType,
                    url,
                    pageId,
                }),
            });
            return response.text(`A link is assigned to shape (id: ${shapeId})`);
        }
        catch (error) {
            console.error(error);
            return response.error(JsonRpcErrorCode.InternalError, `Failed to set link: ${error instanceof Error ? error.message : String(error)}`);
        }
    });
    server.tool("export_shape_as_image", "Export shape as image in Frame0.", {
        shapeId: z.string().describe("ID of the shape to export"),
        format: z
            .enum(["image/png", "image/jpeg", "image/webp"])
            .optional()
            .default("image/png")
            .describe("Image format to export."),
    }, async ({ shapeId, format }) => {
        try {
            const data = await command(apiHost, apiPort, "shape:get-shape", {
                shapeId,
            });
            const image = await command(apiHost, apiPort, "file:export-image", {
                pageId: data.pageId,
                shapeIdArray: [shapeId],
                format,
                fillBackground: true,
            });
            return response.image(format, image);
        }
        catch (error) {
            console.error(error);
            return response.error(JsonRpcErrorCode.InternalError, `Failed to export shape as image: ${error instanceof Error ? error.message : String(error)}`);
        }
    });
    server.tool("add_page", "Add a new page in Frame0. The added page becomes the current page.", {
        name: z.string().describe("Name of the page to add."),
    }, async ({ name }) => {
        try {
            const pageData = await command(apiHost, apiPort, "page:add", {
                pageProps: trimObject({ name }),
            });
            return response.text(`Added page: ${JSON.stringify(pageData)}`);
        }
        catch (error) {
            console.error(error);
            return response.error(JsonRpcErrorCode.InternalError, `Failed to add page: ${error instanceof Error ? error.message : String(error)}`);
        }
    });
    server.tool("update_page", "Update a page in Frame0.", {
        pageId: z.string().describe("ID of the page to update."),
        name: z.string().describe("Name of the page."),
    }, async ({ pageId, name }) => {
        try {
            const updatedPageId = await command(apiHost, apiPort, "page:update", {
                pageId,
                pageProps: trimObject({ name }),
            });
            const pageData = await command(apiHost, apiPort, "page:get", {
                pageId: updatedPageId,
            });
            return response.text(`Updated page: ${JSON.stringify(pageData)}`);
        }
        catch (error) {
            console.error(error);
            return response.error(JsonRpcErrorCode.InternalError, `Failed to update page: ${error instanceof Error ? error.message : String(error)}`);
        }
    });
    server.tool("duplicate_page", "Duplicate a page in Frame0.", {
        pageId: z.string().describe("ID of the page to duplicate"),
        name: z.string().optional().describe("Name of the duplicated page."),
    }, async ({ pageId, name }) => {
        try {
            const duplicatedPageId = await command(apiHost, apiPort, "page:duplicate", {
                pageId,
                pageProps: trimObject({ name }),
            });
            const pageData = await command(apiHost, apiPort, "page:get", {
                pageId: duplicatedPageId,
                exportShapes: true,
            });
            return response.text(`Duplicated page data: ${JSON.stringify(pageData)}`);
        }
        catch (error) {
            console.error(error);
            return response.error(JsonRpcErrorCode.InternalError, `Failed to duplicate page: ${error instanceof Error ? error.message : String(error)}`);
        }
    });
    server.tool("delete_page", "Delete a page in Frame0.", {
        pageId: z.string().describe("ID of the page to delete"),
    }, async ({ pageId }) => {
        try {
            await command(apiHost, apiPort, "page:delete", {
                pageId,
            });
            return response.text(`Deleted page ID is${pageId}`);
        }
        catch (error) {
            console.error(error);
            return response.error(JsonRpcErrorCode.InternalError, `Failed to delete page: ${error instanceof Error ? error.message : String(error)}`);
        }
    });
    server.tool("get_current_page_id", "Get ID of the current page in Frame0.", {}, async () => {
        try {
            const pageId = await command(apiHost, apiPort, "page:get-current-page");
            return response.text(`Current page ID is ${pageId},`);
        }
        catch (error) {
            console.error(error);
            return response.error(JsonRpcErrorCode.InternalError, `Failed to get current page: ${error instanceof Error ? error.message : String(error)}`);
        }
    });
    server.tool("set_current_page_by_id", "Set current page by ID in Frame0.", {
        pageId: z.string().describe("ID of the page to set as current page."),
    }, async ({ pageId }) => {
        try {
            await command(apiHost, apiPort, "page:set-current-page", {
                pageId,
            });
            return response.text(`Current page ID is ${pageId}`);
        }
        catch (error) {
            console.error(error);
            return response.error(JsonRpcErrorCode.InternalError, `Failed to set current page: ${error instanceof Error ? error.message : String(error)}`);
        }
    });
    server.tool("get_page", "Get page data in Frame0.", {
        pageId: z
            .string()
            .optional()
            .describe("ID of the page to get data. If not provided, the current page data is returned."),
        exportShapes: z
            .boolean()
            .optional()
            .default(true)
            .describe("Export shapes data included in the page."),
    }, async ({ pageId, exportShapes }) => {
        try {
            const pageData = await command(apiHost, apiPort, "page:get", {
                pageId,
                exportShapes,
            });
            return response.text(`The page data: ${JSON.stringify(filterPage(pageData))}`);
        }
        catch (error) {
            console.error(error);
            return response.error(JsonRpcErrorCode.InternalError, `Failed to get page data: ${error instanceof Error ? error.message : String(error)}`);
        }
    });
    server.tool("get_all_pages", "Get all pages data in Frame0.", {
        exportShapes: z
            .boolean()
            .optional()
            .default(false)
            .describe("Export shapes data included in the page data."),
    }, async ({ exportShapes }) => {
        try {
            const docData = await command(apiHost, apiPort, "doc:get", {
                exportPages: true,
                exportShapes,
            });
            if (!Array.isArray(docData.children))
                docData.children = [];
            const pageArray = docData.children.map((page) => filterPage(page));
            return response.text(`The all pages data: ${JSON.stringify(pageArray)}`);
        }
        catch (error) {
            console.error(error);
            return response.error(JsonRpcErrorCode.InternalError, `Failed to get page data: ${error instanceof Error ? error.message : String(error)}`);
        }
    });
    server.tool("export_page_as_image", "Export page as image in Frame0.", {
        pageId: z
            .string()
            .optional()
            .describe("ID of the page to export. If not provided, the current page is used."),
        format: z
            .enum(["image/png", "image/jpeg", "image/webp"])
            .optional()
            .default("image/png")
            .describe("Image format to export."),
    }, async ({ pageId, format }) => {
        try {
            const image = await command(apiHost, apiPort, "file:export-image", {
                pageId,
                format,
                fillBackground: true,
            });
            return response.image(format, image);
        }
        catch (error) {
            console.error(error);
            return response.error(JsonRpcErrorCode.InternalError, `Failed to export page as image: ${error instanceof Error ? error.message : String(error)}`);
        }
    });
    return server;
}
