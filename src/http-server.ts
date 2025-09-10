#!/usr/bin/env node
import express from "express";
import cors from "cors";
import { randomUUID } from "node:crypto";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import { isInitializeRequest } from "@modelcontextprotocol/sdk/types.js";
import { createFrame0Server } from "./server-factory-full.js";
import packageJson from "../package.json" with { type: "json" };

const NAME = "frame0-mcp-server";
const VERSION = packageJson.version;

// Configuration from command line arguments
let apiHost: string = "localhost";
let apiPort: number = 58320;
let httpPort: number = 3000;
let enableCors: boolean = true;

// Parse command line arguments
const args = process.argv.slice(2);
const apiHostArg = args.find((arg) => arg.startsWith("--host="));
const apiPortArg = args.find((arg) => arg.startsWith("--api-port="));
const httpPortArg = args.find((arg) => arg.startsWith("--http-port="));
const corsArg = args.find((arg) => arg.startsWith("--cors="));

if (apiHostArg) {
  const host = apiHostArg.split("=")[1];
  apiHost = host || "localhost";
}

if (apiPortArg) {
  const port = apiPortArg.split("=")[1];
  try {
    apiPort = parseInt(port, 10);
    if (isNaN(apiPort) || apiPort < 0 || apiPort > 65535) {
      throw new Error(`Invalid API port number: ${port}`);
    }
  } catch (error) {
    console.error(`Invalid API port number: ${port}`);
    process.exit(1);
  }
}

if (httpPortArg) {
  const port = httpPortArg.split("=")[1];
  try {
    httpPort = parseInt(port, 10);
    if (isNaN(httpPort) || httpPort < 0 || httpPort > 65535) {
      throw new Error(`Invalid HTTP port number: ${port}`);
    }
  } catch (error) {
    console.error(`Invalid HTTP port number: ${port}`);
    process.exit(1);
  }
}

if (corsArg) {
  enableCors = corsArg.split("=")[1].toLowerCase() === "true";
}

const app = express();
app.use(express.json());

// Enable CORS if requested
if (enableCors) {
  app.use(cors({
    origin: '*', // Configure appropriately for production
    exposedHeaders: ['Mcp-Session-Id'],
    allowedHeaders: ['Content-Type', 'mcp-session-id'],
  }));
}

// Store transports for each session type
const transports = {
  streamable: {} as Record<string, StreamableHTTPServerTransport>,
  sse: {} as Record<string, SSEServerTransport>
};

// Create server factory function
function createServer(): McpServer {
  return createFrame0Server(apiHost, apiPort);
}

// Modern Streamable HTTP endpoint (/mcp)
app.all('/mcp', async (req, res) => {
  try {
    const sessionId = req.headers['mcp-session-id'] as string | undefined;
    let transport: StreamableHTTPServerTransport;

    if (sessionId && transports.streamable[sessionId]) {
      // Reuse existing transport
      transport = transports.streamable[sessionId];
    } else if (!sessionId && isInitializeRequest(req.body)) {
      // New initialization request
      transport = new StreamableHTTPServerTransport({
        sessionIdGenerator: () => randomUUID(),
        onsessioninitialized: (sessionId) => {
          transports.streamable[sessionId] = transport;
        },
        // DNS rebinding protection is disabled by default for backwards compatibility
      });

      // Clean up transport when closed
      transport.onclose = () => {
        if (transport.sessionId) {
          delete transports.streamable[transport.sessionId];
        }
      };

      const server = createServer();
      await server.connect(transport);
    } else {
      // Invalid request
      res.status(400).json({
        jsonrpc: '2.0',
        error: {
          code: -32000,
          message: 'Bad Request: No valid session ID provided',
        },
        id: null,
      });
      return;
    }

    // Handle the request
    await transport.handleRequest(req, res, req.body);
  } catch (error) {
    console.error('Error handling Streamable HTTP request:', error);
    if (!res.headersSent) {
      res.status(500).json({
        jsonrpc: '2.0',
        error: {
          code: -32603,
          message: 'Internal server error',
        },
        id: null,
      });
    }
  }
});

// Legacy SSE endpoint for backwards compatibility
app.get('/sse', async (req, res) => {
  try {
    const transport = new SSEServerTransport('/messages', res);
    transports.sse[transport.sessionId] = transport;
    
    res.on("close", () => {
      delete transports.sse[transport.sessionId];
    });
    
    const server = createServer();
    await server.connect(transport);
    
    console.log(`SSE connection established: ${transport.sessionId}`);
  } catch (error) {
    console.error('Error establishing SSE connection:', error);
    if (!res.headersSent) {
      res.status(500).json({
        jsonrpc: '2.0',
        error: {
          code: -32603,
          message: 'Internal server error',
        },
        id: null,
      });
    }
  }
});

// Legacy message endpoint for SSE
app.post('/messages', async (req, res) => {
  try {
    const sessionId = req.query.sessionId as string;
    const transport = transports.sse[sessionId];
    
    if (transport) {
      await transport.handlePostMessage(req, res, req.body);
    } else {
      res.status(400).json({
        jsonrpc: '2.0',
        error: {
          code: -32000,
          message: 'No transport found for sessionId',
        },
        id: null,
      });
    }
  } catch (error) {
    console.error('Error handling SSE message:', error);
    if (!res.headersSent) {
      res.status(500).json({
        jsonrpc: '2.0',
        error: {
          code: -32603,
          message: 'Internal server error',
        },
        id: null,
      });
    }
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    name: NAME,
    version: VERSION,
    apiHost,
    apiPort,
    transports: {
      streamable: Object.keys(transports.streamable).length,
      sse: Object.keys(transports.sse).length
    }
  });
});

// Info endpoint
app.get('/info', (req, res) => {
  res.json({
    name: NAME,
    version: VERSION,
    endpoints: {
      streamableHttp: '/mcp',
      sse: '/sse',
      messages: '/messages',
      health: '/health',
      info: '/info'
    },
    configuration: {
      apiHost,
      apiPort,
      httpPort,
      enableCors
    }
  });
});

// Start the HTTP server
app.listen(httpPort, () => {
  console.log(`Frame0 MCP HTTP Server running on port ${httpPort}`);
  console.log(`Connecting to Frame0 API at ${apiHost}:${apiPort}`);
  console.log(`Endpoints:`);
  console.log(`  - Streamable HTTP: http://localhost:${httpPort}/mcp`);
  console.log(`  - SSE: http://localhost:${httpPort}/sse`);
  console.log(`  - Health: http://localhost:${httpPort}/health`);
  console.log(`  - Info: http://localhost:${httpPort}/info`);
});

process.on('SIGINT', () => {
  console.log('\nShutting down HTTP server...');
  process.exit(0);
});