import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import fetch from "node-fetch";

const URL = "http://localhost:3000";

async function requestToFrame0(slug: string, params: any) {
  const res = await fetch(`${URL}${slug}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(params),
  });
  if (!res.ok) {
    throw new Error("Failed to create rectangle");
  }
  const data = await res.json();
  return data;
}

// Create an MCP server
const server = new McpServer({
  name: "frame0-mcp-server",
  version: "1.0.0",
});

server.tool(
  "create_frame",
  "Create a frame in Frame0",
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
    left: z.number().describe("left coordinate of the frame"),
    top: z.number().describe("top coordinate of the frame"),
    width: z.number().describe("Width of the frame"),
    height: z.number().describe("Height of the frame"),
  },
  async ({ kind, left, top, width, height }) => {
    const data = await requestToFrame0("/create_frame", {
      kind,
      left,
      top,
      width,
      height,
    });
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
  "Create a rectangle in Frame0",
  {
    left: z.number().describe("left coordinate of the rectangle"),
    top: z.number().describe("top coordinate of the rectangle"),
    width: z.number().describe("Width of the rectangle"),
    height: z.number().describe("Height of the rectangle"),
    cornerRadius: z
      .number()
      .optional()
      .describe("Corner radius of the rectangle"),
  },
  async ({ left, top, width, height, cornerRadius }) => {
    const data = await requestToFrame0("/create_rectangle", {
      left,
      top,
      width,
      height,
      cornerRadius,
    });
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
  "Create a text in Frame0",
  {
    left: z.number().describe("left coordinate of the text"),
    top: z.number().describe("top coordinate of the text"),
    text: z.string().describe("Text to display"),
    fontColor: z
      .string()
      .optional()
      .describe(
        "A palette color name for Font color of the text. Available colors are: $background, $gray3, $gray6, $gray9, $foreground."
      ),
  },
  async ({ left, top, text, fontColor }) => {
    const data = await requestToFrame0("/create_text", {
      left,
      top,
      text,
      fontColor,
    });
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

// Define design screen prompt
server.prompt(
  "design_screen",
  "Best practices for design a screen with Frame0",
  { screen: z.string() },
  ({ screen }) => {
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
      description:
        "Best practices for design wireframe for a screen with Frame0",
    };
  }
);

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
