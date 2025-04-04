import {
  McpServer,
  ResourceTemplate,
} from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import fetch from "node-fetch";

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
  "create_rectangle",
  { x: z.number(), y: z.number(), w: z.number(), h: z.number() },
  async ({ x, y, w, h }) => {
    // ...
    const res = await fetch("http://localhost:3000/create_rectangle", {
      method: "POST",
      headers: {
        "Content-Type": "application/json", // JSON 형식으로 보낸다는 걸 명시
      },
      body: JSON.stringify({ x, y, w, h }),
    });
    if (!res.ok) {
      throw new Error("Failed to create rectangle");
    }
    // const data = await res.json();
    return {
      content: [
        {
          type: "text",
          text: `Created rectangle at (${x}, ${y}) with width ${w} and height ${h}`,
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
