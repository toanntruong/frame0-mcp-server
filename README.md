# Frame0 MCP Server

## API

### Tools

- `create_frame`
- `create_rectangle`
- `create_ellipse`
- `create_text`
- `create_line`
- `create_icon`
- `update_shape`
- `duplicate_shape`
- `delete_shape`
- `get_available_icons`
- `move_shape`
- `add_page`
- `update_page`
- `duplicate_page`
- `delete_page`
- `get_current_page_id`
- `set_current_page_by_id`
- `get_page`
- `get_all_pages`

## Dev

1. clone this repository
2. Update `claude_desktop_config.json` in Claude Desktop as below:

```json
{
  "mcpServers": {
    "frame0-mcp-server": {
      "command": "node",
      "args": ["<full-path-to>/frame0-mcp-server/build/index.js"]
    }
  }
}
```

3. Restart Claude Desktop.
