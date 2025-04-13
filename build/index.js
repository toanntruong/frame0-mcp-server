import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { executeCommand, filterShape, textResult } from "./utils.js";
import { colors, convertColor } from "./colors.js";
// TODO: Allow to add "title", "url" for Desktop and Browser frame
// TODO: style theme? "sketch", "solid", "neobrutalism", ...
// TODO: Consider to use palette colors (e.g. "primary", "secondary", "muted", "background", "foreground", "transparent")
// TODO: add page when adding frame
// TODO: get_current_page()
const AVAILABLE_COLORS_PROMPT = `Light theme is default.`;
const NAME_DESC = `Name of the shape.`;
const LEFT_DESC = `Left coordinate of the shape in absolute coordinate system even inside the parent area.`;
const TOP_DESC = `Top coordinate of the shape in absolute coordinate system even inside the parent area.`;
const WIDTH_DESC = `Width of the shape.`;
const HEIGHT_DESC = `Height of the shape.`;
const PARENT_ID_DESC = `ID of the parent shape.
- Typically a frame ID.
- Child shapes do not placed inside the parent shape. Just form a tree structure.
- All shapes are drawn in the same coordinate system regardless of parent-child relationships.
- If not provided, the shape will be created in the page.`;
// Create an MCP server
const server = new McpServer({
    name: "frame0-mcp-server",
    version: "1.0.0",
});
server.tool("create_frame", `Create a frame shape in Frame0.

1. Frame Types and Sizes
Typical size of frames:
- Phone: 320 x 690
- Tablet: 520 x 790
- Desktop: 800 x 600
- Browser: 800 x 600
- Watch: 198 x 242
- TV: 960 x 570

2. Frame and Page
- One frame per page.
- Add a new page when you create a new frame.

3. Frame Position
- Recommend to place the frame at (0, 0) position in absolute coordinate system.

4. Frame Structure
- When you create a screen, you need to create a frame first.
- The frame is the parent of all UI elements in the screen.
`, {
    frameType: z
        .enum([
        "Phone",
        "Tablet",
        "Desktop",
        "Browser",
        "Watch",
        "TV",
        "Custom Frame",
    ])
        .describe("Frame type"),
    left: z.number().describe(LEFT_DESC),
    top: z.number().describe(TOP_DESC),
    width: z.number().describe(WIDTH_DESC),
    height: z.number().describe(HEIGHT_DESC),
    fillColor: z
        .enum(colors)
        .optional()
        .describe(`Background color of the frame. ${AVAILABLE_COLORS_PROMPT}`),
}, async ({ frameType, left, top, width, height, fillColor }) => {
    // frame headers should be consider to calculate actual content area
    const FRAME_HEADER = {
        Phone: 0,
        Tablet: 0,
        Desktop: 32,
        Browser: 76,
        Watch: 0,
        TV: 0,
        "Custom Frame": 0,
    };
    try {
        const header = FRAME_HEADER[frameType];
        const shapeId = await executeCommand("shape:create-shape-from-library-by-query", {
            query: `${frameType}&@Frame`,
            shapeProps: {
                left,
                top: top - header,
                width,
                height: height + header,
                fillColor: convertColor(fillColor),
            },
        });
        await executeCommand("view:fit-to-screen");
        const data = await executeCommand("shape:get-shape", {
            shapeId,
        });
        return textResult("Created frame: " +
            JSON.stringify({
                ...filterShape(data),
                top: top - header,
                height: height + header,
            }));
    }
    catch (error) {
        console.error(error);
        return textResult(`Failed to create frame: ${error}`);
    }
});
// server.tool(
//   "create_element",
//   `Create an UI element shape in Frame0.
// Create a UI element as a priority, and if there is no suitable UI element,
// create it using a rectangle, ellipse, text, line, or icon.
//   `,
//   {
//     elementType: z
//       .enum([
//         "Panel",
//         "Input",
//         "Select",
//         "Combobox",
//         "Radio",
//         "Checkbox",
//         "Switch",
//         "Text Area",
//         "Button",
//         "Button (primary)",
//         "Button (secondary)",
//       ])
//       .describe("Type of the UI element"),
//     parentId: z
//       .string()
//       .optional()
//       .describe(
//         PARENT_ID_DESC
//       ),
//     left: z.number().describe("left coordinate of the UI element"),
//     top: z.number().describe("top coordinate of the UI element"),
//     width: z.number().optional().describe("Width of the UI element"),
//     height: z.number().optional().describe("Height of the UI element"),
//     text: z.string().optional().describe("Text content of the UI element"),
//   },
//   async ({ elementType, parentId, left, top, width, height, text }) => {
//     try {
//       const shapeId = await executeCommand(
//         "shape:create-shape-from-library-by-query",
//         {
//           query: `${elementType}`,
//           shapeProps: {
//             left,
//             top,
//             width,
//             height,
//             text,
//           },
//           parentId,
//         }
//       );
//       const data = await executeCommand("shape:get-shape", {
//         shapeId,
//       });
//       return textResult(
//         "Created element: " + JSON.stringify(filterShape(data))
//       );
//     } catch (error) {
//       console.error(error);
//       return textResult(`Failed to create element: ${error}`);
//     }
//   }
// );
server.tool("create_rectangle", `Create a rectangle shape in Frame0.`, {
    name: z.string().optional().describe(NAME_DESC),
    parentId: z.string().optional().describe(PARENT_ID_DESC),
    left: z.number().describe(LEFT_DESC),
    top: z.number().describe(TOP_DESC),
    width: z.number().describe(WIDTH_DESC),
    height: z.number().describe(HEIGHT_DESC),
    fillColor: z
        .enum(colors)
        .optional()
        .describe(`Fill color of the rectangle. ${AVAILABLE_COLORS_PROMPT}`),
    strokeColor: z
        .enum(colors)
        .optional()
        .describe(`Stroke color of the rectangle. ${AVAILABLE_COLORS_PROMPT}`),
    corners: z
        .array(z.number())
        .optional()
        .describe("Corner radius of the rectangle. Must be an array of 4 numbers: [left-top, right-top, right-bottom, left-bottom]."),
}, async ({ name, parentId, left, top, width, height, fillColor, strokeColor, corners, }) => {
    try {
        const shapeId = await executeCommand("shape:create-shape", {
            type: "Rectangle",
            shapeProps: {
                name,
                left,
                top,
                width,
                height,
                fillColor: convertColor(fillColor),
                strokeColor: convertColor(strokeColor),
                corners,
            },
            parentId,
        });
        const data = await executeCommand("shape:get-shape", {
            shapeId,
        });
        return textResult("Created rectangle: " + JSON.stringify(filterShape(data)));
    }
    catch (error) {
        console.error(error);
        return textResult(`Failed to create rectangle: ${error}`);
    }
});
server.tool("create_ellipse", `Create an ellipse shape in Frame0.`, {
    name: z.string().optional().describe(NAME_DESC),
    parentId: z.string().optional().describe(PARENT_ID_DESC),
    left: z.number().describe(LEFT_DESC),
    top: z.number().describe(TOP_DESC),
    width: z.number().describe(WIDTH_DESC),
    height: z.number().describe(HEIGHT_DESC),
    fillColor: z
        .enum(colors)
        .optional()
        .describe(`Fill color of the ellipse. ${AVAILABLE_COLORS_PROMPT}`),
    strokeColor: z
        .enum(colors)
        .optional()
        .describe(`Stroke color of the ellipse. ${AVAILABLE_COLORS_PROMPT}`),
}, async ({ name, parentId, left, top, width, height, fillColor, strokeColor, }) => {
    try {
        const shapeId = await executeCommand("shape:create-shape", {
            type: "Ellipse",
            shapeProps: {
                name,
                left,
                top,
                width,
                height,
                fillColor: convertColor(fillColor),
                strokeColor: convertColor(strokeColor),
            },
            parentId,
        });
        const data = await executeCommand("shape:get-shape", {
            shapeId,
        });
        return textResult("Created ellipse: " + JSON.stringify(filterShape(data)));
    }
    catch (error) {
        console.error(error);
        return textResult(`Failed to create ellipse: ${error}`);
    }
});
server.tool("create_text", `Create a text shape in Frame0.  

- Text is plain text without formatting. Therefore, rich text cannot be used, and HTML or CSS styles are not allowed.
- Text position need to be adjusted using 'move_shape()' tool based on the width and height of the created text.
- If text type is paragraph, text width need to be updated using 'update_shape()' tool.
`, {
    type: z
        .enum(["label", "paragraph", "heading", "link", "normal"])
        .optional()
        .describe("Type of the text shape."),
    name: z.string().optional().describe(NAME_DESC),
    parentId: z.string().optional().describe(PARENT_ID_DESC),
    left: z.number().describe(LEFT_DESC),
    top: z.number().describe(TOP_DESC),
    // width: z
    //   .number()
    //   .optional()
    //   .describe(
    //     "Optional width of the text. The text will be wrapped to fit the width. It is recommend to set width if the type is 'paragraph'."
    //   ),
    text: z
        .string()
        .describe("Text content to display of the text shape. Use newline character (0x0A) instead of '\\n' for new line."),
    // textAlignment: z
    //   .enum(["left", "center", "right"])
    //   .optional()
    //   .default("left")
    //   .describe("Text alignment of the text."),
    fontColor: z
        .enum(colors)
        .optional()
        .describe(`Font color of the text. ${AVAILABLE_COLORS_PROMPT}`),
    fontSize: z.number().optional().describe("Font size of the text."),
}, async ({ type, name, parentId, left, top, 
// width,
text, 
// textAlignment,
fontColor, fontSize, }) => {
    try {
        const shapeId = await executeCommand("shape:create-shape", {
            type: "Text",
            shapeProps: {
                name,
                left,
                // width,
                top,
                text,
                // horzAlign: textAlignment,
                fontColor: convertColor(fontColor),
                fontSize,
                wordWrap: type === "paragraph",
            },
            parentId,
        });
        const data = await executeCommand("shape:get-shape", {
            shapeId,
        });
        return textResult("Created text: " +
            JSON.stringify({ ...filterShape(data), textType: type }));
    }
    catch (error) {
        console.error(error);
        return textResult(`Failed to create text: ${error}`);
    }
});
server.tool("create_line", `Create a multi-point line shape in Frame0.
  A line can be used to create a line, arrow, a polyline, or a polygon.
  If first point and last point are the same, it will be a polygon.`, {
    name: z.string().optional().describe(NAME_DESC),
    parentId: z.string().optional().describe(PARENT_ID_DESC),
    points: z
        .array(z.tuple([z.number(), z.number()]))
        .min(2)
        .describe("Array of points. At least 2 points are required."),
    fillColor: z
        .enum(colors)
        .optional()
        .describe(`Fill color of the line. ${AVAILABLE_COLORS_PROMPT}`),
    strokeColor: z
        .enum(colors)
        .optional()
        .describe(`Stroke color of the line. ${AVAILABLE_COLORS_PROMPT}`),
}, async ({ name, parentId, points, fillColor, strokeColor }) => {
    try {
        const shapeId = await executeCommand("shape:create-shape", {
            type: "Line",
            shapeProps: {
                name,
                path: points,
                fillColor: convertColor(fillColor),
                strokeColor: convertColor(strokeColor),
            },
            parentId,
        });
        const data = await executeCommand("shape:get-shape", {
            shapeId,
        });
        return textResult("Created line: " + JSON.stringify(filterShape(data)));
    }
    catch (error) {
        console.error(error);
        return textResult(`Failed to create line: ${error}`);
    }
});
// TODO: use 'size' instead of 'width' and 'height'
server.tool("create_icon", `Create an icon shape in Frame0.

Typical size of icons:
- Small: 16 x 16
- Medium: 24 x 24
- Large: 32 x 32
`, {
    name: z
        .string()
        .describe("The name of the icon to create. The name should be one of the result of 'get_available_icons' tool."),
    parentId: z.string().optional().describe(PARENT_ID_DESC),
    left: z.number().describe(LEFT_DESC),
    top: z.number().describe(TOP_DESC),
    width: z.number().describe(WIDTH_DESC),
    height: z.number().describe(HEIGHT_DESC),
    strokeColor: z
        .enum(colors)
        .optional()
        .describe(`Stroke color of the icon. ${AVAILABLE_COLORS_PROMPT}`),
}, async ({ name, parentId, left, top, width, height, strokeColor }) => {
    try {
        const shapeId = await executeCommand("shape:create-icon", {
            iconName: name,
            shapeProps: {
                left,
                top,
                width,
                height,
                strokeColor: convertColor(strokeColor),
            },
            parentId,
        });
        const data = await executeCommand("shape:get-shape", {
            shapeId,
        });
        return textResult("Created icon: " + JSON.stringify(filterShape(data)));
    }
    catch (error) {
        console.error(error);
        return textResult(`Failed to create icon: ${error}`);
    }
});
server.tool("update_shape", `Update properties of a shape in Frame0.`, {
    shapeId: z.string().describe("ID of the shape to update"),
    name: z.string().optional().describe(NAME_DESC),
    // parentId: z.string().optional().describe(PARENT_ID_DESC),
    // left: z.number().optional().describe(LEFT_DESC),
    // top: z.number().optional().describe(TOP_DESC),
    width: z.number().optional().describe(WIDTH_DESC),
    height: z.number().optional().describe(HEIGHT_DESC),
    fillColor: z
        .enum(colors)
        .optional()
        .describe("Fill color of the shape. ${AVAILABLE_COLORS_PROMPT}"),
    strokeColor: z
        .enum(colors)
        .optional()
        .describe(`Stroke color of the shape. ${AVAILABLE_COLORS_PROMPT}`),
    fontColor: z
        .enum(colors)
        .optional()
        .describe(`Font color of the shape. ${AVAILABLE_COLORS_PROMPT}`),
    fontSize: z.number().optional().describe("Font size of the text."),
    corners: z
        .array(z.number())
        .optional()
        .describe("Corner radius of the shape. Must be an array of 4 numbers: [left-top, right-top, right-bottom, left-bottom]."),
    text: z.string().optional().describe("Text content of the shape"),
}, async ({ shapeId, name, 
// left,
// top,
width, height, strokeColor, fillColor, fontColor, fontSize, corners, }) => {
    try {
        const updatedId = await executeCommand("shape:update-shape", {
            shapeId,
            shapeProps: {
                name,
                // left,
                // top,
                width,
                height,
                fillColor: convertColor(fillColor),
                strokeColor: convertColor(strokeColor),
                fontColor: convertColor(fontColor),
                fontSize,
                corners,
            },
        });
        const data = await executeCommand("shape:get-shape", {
            shapeId: updatedId,
        });
        return textResult("Updated shape: " + JSON.stringify(filterShape(data)));
    }
    catch (error) {
        console.error(error);
        return textResult(`Failed to update shape: ${error}`);
    }
});
server.tool("delete_shape", `Delete a shape in Frame0.`, { shapeId: z.string().describe("ID of the shape to delete") }, async ({ shapeId }) => {
    try {
        await executeCommand("edit:delete", {
            shapeIdArray: [shapeId],
        });
        return textResult("Deleted shape of id: " + shapeId);
    }
    catch (error) {
        console.error(error);
        return textResult(`Failed to delete shape: ${error}`);
    }
});
server.tool("get_available_icons", `Get available icon shapes in Frame0.`, {}, async ({}) => {
    try {
        const data = await executeCommand("shape:get-available-icons", {});
        return textResult("Available icons: " + JSON.stringify(data));
    }
    catch (error) {
        console.error(error);
        return textResult(`Failed to get available icons: ${error}`);
    }
});
server.tool("move_shape", `Move a shape in Frame0.`, {
    shapeId: z.string().describe("ID of the shape to move"),
    dx: z.number().describe("Delta X"),
    dy: z.number().describe("Delta Y"),
}, async ({ shapeId, dx, dy }) => {
    try {
        await executeCommand("shape:move", {
            shapeId,
            dx,
            dy,
        });
        return textResult(`Moved shape (id: ${shapeId}) as (${dx}, ${dy})`);
    }
    catch (error) {
        console.error(error);
        return textResult(`Failed to get available icons: ${error}`);
    }
});
server.tool("add_page", `Add a new page in Frame0.
  - Add a new page when you create a new frame.
  `, {}, async () => {
    try {
        const pageId = await executeCommand("page:add");
        return textResult(`Added new page (pageId: ${pageId})`);
    }
    catch (error) {
        console.error(error);
        return textResult(`Failed to add new page: ${error}`);
    }
});
server.tool("get_current_page", "Get current page in Frame0.", {}, async () => {
    try {
        const pageId = await executeCommand("page:get-current-page");
        return textResult(`Current page (pageId: ${pageId})`);
    }
    catch (error) {
        console.error(error);
        return textResult(`Failed to get current page: ${error}`);
    }
});
// Define design screen prompt
// server.prompt(
//   "design_screen",
//   "Best practices for design a screen with Frame0",
//   { screen: z.string() },
//   ({ screen }) => {
//     return {
//       messages: [
//         {
//           role: "assistant",
//           content: {
//             type: "text",
//             text: `When design a screen with Frame0, follow these best practices:
// 1. Create a frame:
//    - First use create_frame()
//    - Set the frame type (e.g., Phone, Tablet, Desktop)
//    - Set the position (left, top) of the frame
//    - Remember the resulting frame's properties (id, position, width, height) for future reference
// 2. Shape Creation:
//    - Use create_rectangle() for containers and input fields
//    - Use create_text() for labels, buttons text, and links
//    - Set the position (left, top) and size (width, height) of each shape based on the frame
// `,
//           },
//         },
//       ],
//       description:
//         "Best practices for design wireframe for a screen with Frame0",
//     };
//   }
// );
async function main() {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error("Weather MCP Server running on stdio");
}
main().catch((error) => {
    console.error("Error starting server:", error);
    process.exit(1);
});
