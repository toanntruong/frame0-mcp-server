import { CallToolResult } from "@modelcontextprotocol/sdk/types.js";

type MimeType = "image/png" | "image/jpeg" | "image/webp" | "image/svg+xml";

export function text(text: string): CallToolResult {
  return {
    content: [
      {
        type: "text",
        text,
      },
    ],
  };
}

export function error(text: string): CallToolResult {
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

export function image(mimeType: MimeType, data: string): CallToolResult {
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
