[![smithery badge](https://smithery.ai/badge/@niklauslee/frame0-mcp-server)](https://smithery.ai/server/@niklauslee/frame0-mcp-server)

[![Frame0 MCP Video Example](https://github.com/niklauslee/frame0-mcp-server/raw/main/thumbnail.png)](https://frame0.app/videos/frame0-mcp-example.mp4)

# Frame0 MCP Server

[Frame0](https://frame0.app/) is a Balsamiq-alternative wireframe tool for modern apps. **Frame0 MCP Server** allows you for creating and modifying wireframes in Frame0 by prompting.

## Setup

Prerequisite:
- [Frame0](https://frame0.app/) `v1.0.0-beta.17` or higher.
- [Node.js](https://nodejs.org/) `v22` or higher.

## Transport Options

The Frame0 MCP server supports multiple transport methods:

1. **Stdio Transport** (default) - For Claude Desktop and command-line tools
2. **HTTP Transport** (Streamable HTTP) - For web applications and HTTP clients  
3. **SSE Transport** (Server-Sent Events) - For backwards compatibility

### Stdio Transport (Default)

Setup for Claude Desktop in `claude_desktop_config.json` as below:

```json
{
  "mcpServers": {
    "frame0-mcp-server": {
      "command": "npx",
      "args": ["-y", "frame0-mcp-server"]
    }
  }
}
```

Optional parameters:
- `--host=<hostname>` - Specify the hostname/IP address for Frame0's API server (default: `localhost`)
- `--api-port=<port>` - Specify the port number for Frame0's API server (default: `58320`)

Example with custom host and port:
```json
{
  "mcpServers": {
    "frame0-mcp-server": {
      "command": "npx",
      "args": ["-y", "frame0-mcp-server", "--host=10.10.10.38", "--api-port=58320"]
    }
  }
}
```

### HTTP Transport (for Web Applications)

Start the HTTP server:
```bash
# Using npm
npm run start:http

# Or using npx
npx frame0-mcp-http --host=10.10.10.38 --api-port=58320 --http-port=3000

# Or using node directly
node build/http-server.js --host=10.10.10.38 --api-port=58320 --http-port=3000
```

HTTP server parameters:
- `--host=<hostname>` - Frame0 API server hostname/IP (default: `localhost`)
- `--api-port=<port>` - Frame0 API server port (default: `58320`)
- `--http-port=<port>` - HTTP server port (default: `3000`)
- `--cors=<true|false>` - Enable CORS (default: `true`)

#### Available Endpoints

- **Streamable HTTP**: `POST http://localhost:3000/mcp` - Modern MCP protocol
- **SSE**: `GET http://localhost:3000/sse` - Legacy SSE stream  
- **Messages**: `POST http://localhost:3000/messages` - Legacy message endpoint
- **Health**: `GET http://localhost:3000/health` - Server health check
- **Info**: `GET http://localhost:3000/info` - Server information

#### Client Connection Example

```javascript
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";

const client = new Client({
  name: 'frame0-client',
  version: '1.0.0'
});

const transport = new StreamableHTTPClientTransport(
  new URL('http://localhost:3000/mcp')
);

await client.connect(transport);

// Now you can use the client
const tools = await client.listTools();
const result = await client.callTool({
  name: "add_page",
  arguments: { name: "My Page" }
});
```

See [examples/http-client.js](examples/http-client.js) for a complete client example with backwards compatibility.

## Example Prompts

- _“Create a login screen for Phone in Frame0”_
- _“Create a Instagram home screen for Phone in Frame0”_
- _“Create a Netflix home screen for TV in Frame0”_
- _“Change the color of the Login button”_
- _“Remove the Twitter social login”_
- _“Replace the emojis by icons”_
- _“Set a link from the google login button to the Google website”_

## Tools

- `create_frame`
- `create_rectangle`
- `create_ellipse`
- `create_text`
- `create_line`
- `create_polygon`
- `create_connector`
- `create_icon`
- `create_image`
- `update_shape`
- `duplicate_shape`
- `delete_shape`
- `search_icons`
- `move_shape`
- `align_shapes`
- `group`
- `ungroup`
- `set_link`
- `export_shape_as_image`
- `add_page`
- `update_page`
- `duplicate_page`
- `delete_page`
- `get_current_page_id`
- `set_current_page_by_id`
- `get_page`
- `get_all_pages`
- `export_page_as_image`

## Dev

1. Clone this repository.
2. Build with `npm run build`.
3. Update `claude_desktop_config.json` in Claude Desktop as below.
4. Restart Claude Desktop.

```json
{
  "mcpServers": {
    "frame0-mcp-server": {
      "command": "node",
      "args": ["<full-path-to>/frame0-mcp-server/build/index.js", "--host=10.10.10.38", "--api-port=58320"]
    }
  }
}
```
