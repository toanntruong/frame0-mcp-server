# Frame0 MCP Server

- [ ] Add `set_link` tool
- [x] Add `duplicate_shape` tool
- [x] Add `update_page` tool
- [x] Add `duplicate_page` tool
- [x] Add `delete_page` tool
- [ ] Add `export_page_as_image` tool
- [ ] Add `group` and `ungroup` tools
- [ ] Add `bring-to-front`, `send-to-back` tools

## API

### Tools

- `create_frame`
- `create_rectangle`
- `create_ellipse`
- `create_text`
- `create_line`
- `create_icon`
- `update_shape`
- `delete_shape`
- `get_available_icons`
- `move_shape`
- `add_page`
- `get_current_page_id`
- `set_current_page_by_id`
_ `get_page`
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
