import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import fetch from "node-fetch";
const URL = "http://localhost:3000";
// Create an MCP server
const server = new McpServer({
    name: "frame0-mcp-server",
    version: "1.0.0",
});
server.tool("create_frame", "Create a frame", {
    kind: z
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
    left: z.number().describe("X coordinate"),
    top: z.number().describe("Y coordinate"),
    width: z.number().describe("Width of the frame"),
    height: z.number().describe("Height of the frame"),
}, async ({ kind, left, top, width, height }) => {
    const res = await fetch(`${URL}/create_frame`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ kind, left, top, width, height }),
    });
    if (!res.ok) {
        throw new Error("Failed to create rectangle");
    }
    const data = await res.json();
    return {
        content: [
            {
                type: "text",
                text: JSON.stringify(data),
            },
        ],
    };
});
server.tool("create_rectangle", "Create a rectangle", {
    left: z.number().describe("X coordinate"),
    top: z.number().describe("Y coordinate"),
    width: z.number().describe("Width of the rectangle"),
    height: z.number().describe("Height of the rectangle"),
    cornerRadius: z
        .number()
        .optional()
        .describe("Corner radius of the rectangle"),
    text: z
        .string()
        .optional()
        .describe("Text to display inside the rectangle"),
}, async ({ left, top, width, height, cornerRadius, text }) => {
    const res = await fetch(`${URL}/create_rectangle`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ left, top, width, height, cornerRadius, text }),
    });
    if (!res.ok) {
        throw new Error("Failed to create rectangle");
    }
    const data = await res.json();
    return {
        content: [
            {
                type: "text",
                text: JSON.stringify(data),
            },
        ],
    };
});
server.tool("create_text", "Create a text", {
    left: z.number().describe("X coordinate"),
    top: z.number().describe("Y coordinate"),
    text: z.string().describe("Text to display"),
}, async ({ left, top, text }) => {
    const res = await fetch(`${URL}/create_text`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json", // JSON 형식으로 보낸다는 걸 명시
        },
        body: JSON.stringify({ left, top, text }), // JSON 형식으로 변환하여 전송
    });
    if (!res.ok) {
        throw new Error("Failed to create text");
    }
    const data = await res.json();
    return {
        content: [
            {
                type: "text",
                text: JSON.stringify(data),
            },
        ],
    };
});
// Define design screen prompt
server.prompt("design_screen", "Best practices for design a screen with Frame0", { screen: z.string() }, ({ screen }) => {
    return {
        messages: [
            {
                role: "assistant",
                content: {
                    type: "text",
                    text: `When design a screen with Frame0, follow these best practices:

1. Create a frame:
   - First use create_frame()
   - Set the frame type (e.g., Phone, Tablet, Desktop)
   - Set the position (left, top) of the frame
   - Remember the resulting frame's properties (id, position, width, height) for future reference

2. Shape Creation:
   - Use create_rectangle() for containers and input fields
   - Use create_text() for labels, buttons text, and links
   - Set the position (left, top) and size (width, height) of each shape based on the frame
`,
                },
            },
        ],
        description: "Best practices for design wireframe for a screen with Frame0",
    };
});
// Add a dynamic greeting resource
// server.resource(
//   "greeting",
//   new ResourceTemplate("greeting://{name}", { list: undefined }),
//   async (uri, { name }) => ({
//     contents: [
//       {
//         uri: uri.href,
//         text: `Hello, ${name}!`,
//       },
//     ],
//   })
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
