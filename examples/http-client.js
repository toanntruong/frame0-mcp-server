#!/usr/bin/env node

import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import { SSEClientTransport } from "@modelcontextprotocol/sdk/client/sse.js";

const SERVER_URL = process.argv[2] || "http://localhost:3000";

async function connectWithBackwardsCompatibility(url) {
  let client = undefined;
  const baseUrl = new URL(url);
  
  try {
    // Try modern Streamable HTTP transport first
    console.log("Attempting to connect using Streamable HTTP transport...");
    client = new Client({
      name: 'frame0-http-client',
      version: '1.0.0'
    });
    
    const mcpUrl = new URL('/mcp', baseUrl);
    const transport = new StreamableHTTPClientTransport(mcpUrl);
    await client.connect(transport);
    console.log("✅ Connected using Streamable HTTP transport");
    return client;
    
  } catch (error) {
    console.log("❌ Streamable HTTP connection failed:", error.message);
    
    try {
      // Fallback to SSE transport
      console.log("Attempting to connect using SSE transport...");
      client = new Client({
        name: 'frame0-sse-client',
        version: '1.0.0'
      });
      
      const sseUrl = new URL('/sse', baseUrl);
      const sseTransport = new SSEClientTransport(sseUrl);
      await client.connect(sseTransport);
      console.log("✅ Connected using SSE transport");
      return client;
      
    } catch (sseError) {
      console.error("❌ Both transport methods failed:");
      console.error("Streamable HTTP:", error.message);
      console.error("SSE:", sseError.message);
      throw sseError;
    }
  }
}

async function main() {
  try {
    console.log(`Connecting to Frame0 MCP Server at ${SERVER_URL}...`);
    
    const client = await connectWithBackwardsCompatibility(SERVER_URL);
    
    // Test the connection by listing available tools
    console.log("\n📋 Listing available tools...");
    const tools = await client.listTools();
    console.log(`Found ${tools.tools.length} tools:`);
    tools.tools.forEach(tool => {
      console.log(`  - ${tool.name}: ${tool.description}`);
    });
    
    // Test a simple tool call - get current page ID
    console.log("\n🔧 Testing tool call: get_current_page_id");
    try {
      const result = await client.callTool({
        name: "get_current_page_id",
        arguments: {}
      });
      console.log("✅ Tool call successful:", result.content[0].text);
    } catch (toolError) {
      console.log("⚠️ Tool call failed (expected if Frame0 not running):", toolError.message);
    }
    
    console.log("\n✅ Connection test completed successfully!");
    
  } catch (error) {
    console.error("❌ Connection failed:", error.message);
    process.exit(1);
  }
}

console.log("Frame0 MCP HTTP Client Example");
console.log("Usage: node http-client.js [server-url]");
console.log("Example: node http-client.js http://localhost:3000\n");

main().catch(console.error);