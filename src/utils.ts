import { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import fetch from "node-fetch";

const URL = "http://localhost:3000";

type CommandResponse = {
  success: boolean;
  data?: any;
  error?: string;
};

export async function executeCommand(command: string, args: any = {}) {
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
  const json = (await res.json()) as CommandResponse;
  if (!json.success) {
    throw new Error(`Command failed: ${json.error}`);
  }
  return json.data;
}

export function textResult(text: string): CallToolResult {
  return {
    content: [
      {
        type: "text",
        text,
      },
    ],
  };
}

export function filterShape(shape: any, recursive: boolean = false): any {
  const json: any = {
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
  if (typeof shape.text !== "undefined") json.text = shape.text; // TODO: convert node to text
  if (typeof shape.wordWrap !== "undefined") json.wordWrap = shape.wordWrap;
  if (typeof shape.corners !== "undefined") json.corners = shape.corners;
  if (typeof shape.horzAlign !== "undefined") json.horzAlign = shape.horzAlign;
  if (typeof shape.vertAlign !== "undefined") json.vertAlign = shape.vertAlign;
  if (typeof shape.path !== "undefined") json.path = shape.path;
  if (recursive) {
    json.children = shape.children.map((child: any) => {
      return filterShape(child, recursive);
    });
  }
  return json;
}

export function filterPage(page: any): any {
  const json: any = {
    id: page.id,
    name: page.name,
    size: page.size,
    children: page.children?.map((shape: any) => {
      return filterShape(shape, true);
    }),
  };
  return json;
}
