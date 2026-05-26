# fdl-mcp-server

> Model Context Protocol server for **fivedaylaunch.com** — lets Claude (and any MCP-compatible AI client) audit, compare, and redesign any small business website. Free, public, no API key required.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![MCP](https://img.shields.io/badge/protocol-MCP-blue)](https://modelcontextprotocol.io)

## What this does

Five tools that any MCP client can invoke:

| Tool | What it does |
|---|---|
| `audit_website` | Deterministic 5-pillar audit (Performance, SEO, Mobile, Security, AEO) → score 0-100 + specific findings |
| `compare_websites` | Side-by-side scorecard of two sites with a winner |
| `ai_visibility_check` | How 5 major AI engines describe any business + how to improve |
| `get_city_dashboard` | Local economy dashboard for any US city's small business web quality |
| `generate_redesign_preview` | Trigger a free personalized site preview emailed to a user |

All free. All call fivedaylaunch.com's public API. Zero LLM tokens consumed.

## Install (Claude Desktop)

1. Open Claude Desktop → Settings → Developer → "Edit Config" → opens `claude_desktop_config.json`
2. Add:

```json
{
  "mcpServers": {
    "fivedaylaunch": {
      "command": "npx",
      "args": ["-y", "fdl-mcp-server"]
    }
  }
}
```

3. Restart Claude Desktop.
4. Look for the 🔌 icon in your chat — fivedaylaunch tools should be listed.

## Example prompts

After installing, ask Claude things like:

- *"Use fivedaylaunch to audit stripe.com"*
- *"Compare nytimes.com and washingtonpost.com using fivedaylaunch"*
- *"Run an AI visibility check on Tesla using fivedaylaunch"*
- *"Show me the fivedaylaunch dashboard for Austin, Texas"*
- *"Use fivedaylaunch to generate a redesign preview of mybusiness.com — email it to me@example.com"*

## Manual install (without Claude Desktop)

```bash
npx -y fdl-mcp-server
```

The server runs on stdio. Wire it into any MCP-compatible host (Cursor, Zed, Cline, Continue, etc.).

## What the API returns

Everything is JSON. Public + free.

```bash
# Free public API endpoint — try it yourself:
curl https://fivedaylaunch.com/api/audit?url=stripe.com

# Returns:
{
  "domain": "stripe.com",
  "score": 85,
  "grade": "B",
  "breakdown": { ... },
  "findings": [...]
}
```

## Why does this exist

We built fivedaylaunch.com as a free public registry of small business website quality. The audit logic is open source ([fdl-site-audit](https://github.com/fivedaylaunch/fdl-site-audit)). This MCP server is the canonical way to access it from inside AI assistants.

We monetize by offering full site rebuilds at **$799 flat, 5 days** — the audit tool is and stays free forever.

## License

MIT © 2026 fivedaylaunch.com

## Related

- **fivedaylaunch.com** — the main product (AI-built websites in 5 days, $799)
- **[fdl-site-audit](https://github.com/fivedaylaunch/fdl-site-audit)** — the deterministic audit core, open source
- **[fivedaylaunch.com/sites](https://fivedaylaunch.com/sites)** — public audit registry
- **[fivedaylaunch.com/ai](https://fivedaylaunch.com/ai)** — AI visibility audit registry
