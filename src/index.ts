import {
  McpServer,
  ResourceTemplate,
} from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import fetch from "node-fetch";

const URL = "http://localhost:3000";

// Create an MCP server
const server = new McpServer({
  name: "frame0-mcp-server",
  version: "1.0.0",
});

// Add an addition tool
// server.tool("add", { a: z.number(), b: z.number() }, async ({ a, b }) => ({
//   content: [{ type: "text", text: String(a + b) }],
// }));

server.tool(
  "create_frame",
  "Create a frame",
  {
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
  },
  async ({ kind, left, top }) => {
    const res = await fetch(`${URL}/create_frame`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ kind, left, top }),
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
  }
);

server.tool(
  "create_rectangle",
  "Create a rectangle",
  {
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
  },
  async ({ left, top, width, height, cornerRadius, text }) => {
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
  }
);

server.tool(
  "create_text",
  "Create a text",
  {
    left: z.number().describe("X coordinate"),
    top: z.number().describe("Y coordinate"),
    text: z.string().describe("Text to display"),
  },
  async ({ left, top, text }) => {
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
  }
);

// Add a dynamic greeting resource
server.resource(
  "greeting",
  new ResourceTemplate("greeting://{name}", { list: undefined }),
  async (uri, { name }) => ({
    contents: [
      {
        uri: uri.href,
        text: `Hello, ${name}!`,
      },
    ],
  })
);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Weather MCP Server running on stdio");
}

main().catch((error) => {
  console.error("Error starting server:", error);
  process.exit(1);
});
