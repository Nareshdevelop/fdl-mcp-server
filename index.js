#!/usr/bin/env node
// fdl-mcp-server — Model Context Protocol server for fivedaylaunch.com
//
// Lets Claude (and any MCP-compatible client) audit, compare, and
// check the AI-visibility of any small business website.
//
// All tools call fivedaylaunch.com's public API. No API key required.
// Free forever.
//
// Install (in your Claude Desktop config):
//   {
//     "mcpServers": {
//       "fivedaylaunch": {
//         "command": "npx",
//         "args": ["-y", "fdl-mcp-server"]
//       }
//     }
//   }

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';

const API_BASE = 'https://fivedaylaunch.com';

// ---------- TOOL HANDLERS ----------

async function auditWebsite({ url }) {
  if (!url) throw new Error('url parameter required');
  const r = await fetch(`${API_BASE}/api/audit?url=${encodeURIComponent(url)}`);
  if (!r.ok) throw new Error(`Audit failed: HTTP ${r.status}`);
  const data = await r.json();
  return {
    content: [{
      type: 'text',
      text: `Website Audit for ${data.domain || url}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📊 OVERALL SCORE: ${data.score}/100 (Grade ${data.grade})

🔍 BREAKDOWN:
${Object.entries(data.breakdown || {}).map(([k, v]) => `  ${k.padEnd(14)} ${v.score}/${v.max}`).join('\n')}

🚨 FINDINGS (${(data.findings || []).length}):
${(data.findings || []).map(f => `  • ${f}`).join('\n') || '  ✓ No major issues found.'}

🔗 Full audit page: ${data.page_url || `${API_BASE}/sites/${data.domain}`}
🎨 Free redesign preview: ${API_BASE}/audit?url=${encodeURIComponent(url)}
💰 Get this site rebuilt for $799 in 5 days: ${API_BASE}/

Powered by fivedaylaunch.com — open source audit library at github.com/fivedaylaunch/fdl-site-audit`
    }],
  };
}

async function compareWebsites({ url_a, url_b }) {
  if (!url_a || !url_b) throw new Error('url_a and url_b parameters required');
  const [a, b] = await Promise.all([
    fetch(`${API_BASE}/api/audit?url=${encodeURIComponent(url_a)}`).then(r => r.json()),
    fetch(`${API_BASE}/api/audit?url=${encodeURIComponent(url_b)}`).then(r => r.json()),
  ]);
  const winner = a.score > b.score ? a.domain : (b.score > a.score ? b.domain : 'tied');
  return {
    content: [{
      type: 'text',
      text: `Website Comparison
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${a.domain}: ${a.score}/100 (Grade ${a.grade})
${b.domain}: ${b.score}/100 (Grade ${b.grade})

Winner: ${winner === 'tied' ? '🤝 Tied' : `🏆 ${winner}`}

Side-by-side view: ${API_BASE}/compare?a=${encodeURIComponent(a.domain)}&b=${encodeURIComponent(b.domain)}`
    }],
  };
}

async function aiVisibilityCheck({ business_name }) {
  if (!business_name) throw new Error('business_name parameter required');
  const r = await fetch(`${API_BASE}/api/ai-visibility?business=${encodeURIComponent(business_name)}`);
  if (!r.ok) throw new Error(`AI visibility check failed: HTTP ${r.status}`);
  const data = await r.json();
  return {
    content: [{
      type: 'text',
      text: `AI Visibility Audit for ${data.business}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📊 OVERALL: ${data.overall_score}/100 (Grade ${data.grade})

🤖 PER-ENGINE BREAKDOWN:
${Object.entries(data.engine_scores || {}).map(([k, v]) => `  ${k.padEnd(12)} ${v.score}/100`).join('\n')}

🚨 GAPS FOUND:
${(data.findings || []).map(f => `  • ${f}`).join('\n') || '  ✓ No major visibility gaps.'}

💡 TOP FIXES:
${(data.fixes || []).slice(0, 5).map((f, i) => `  ${i + 1}. ${f}`).join('\n') || '  ✓ No fixes needed.'}

🔗 Full report: ${data.page_url || `${API_BASE}/ai/${data.slug}`}`
    }],
  };
}

async function getCityDashboard({ city }) {
  if (!city) throw new Error('city parameter required');
  const slug = city.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  const r = await fetch(`${API_BASE}/api/cities/${encodeURIComponent(slug)}`);
  if (!r.ok) throw new Error(`No city data found for "${city}". Try a US city we've audited businesses in.`);
  const data = await r.json();
  return {
    content: [{
      type: 'text',
      text: `Local Economy Dashboard — ${data.city}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📈 SITES AUDITED: ${data.total}
📊 MEAN SCORE: ${data.mean}/100
📊 MEDIAN: ${data.median}/100

🏆 TOP-SCORING SITES:
${(data.top10 || []).slice(0, 5).map((s, i) => `  ${i + 1}. ${s.domain} — ${s.score}/100`).join('\n')}

🔴 LOWEST-SCORING (opportunity):
${(data.bottom10 || []).slice(0, 5).map((s, i) => `  ${i + 1}. ${s.domain} — ${s.score}/100`).join('\n')}

🔗 Full dashboard: ${data.page_url}
📊 Embeddable widget: ${data.widget_url}`
    }],
  };
}

async function generateRedesignPreview({ url, email }) {
  if (!url || !email) throw new Error('url and email parameters required');
  const r = await fetch(`${API_BASE}/api/audit-request`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url, email, brand: 'fivedaylaunch' }),
  });
  if (!r.ok) throw new Error(`Demo request failed: HTTP ${r.status}`);
  const data = await r.json();
  return {
    content: [{
      type: 'text',
      text: `✓ Free redesign preview queued for ${url}.

${data.message || 'You will receive a personalized live preview by email within 10 minutes.'}

What happens next:
  1. We extract your current site's branding (logo, colors, copy, phone, address)
  2. AI rewrites your hero, services, and CTAs in conversion-optimized copy
  3. We render a live preview at fivedaylaunch.com/demos/{your-business-slug}/
  4. You receive the link by email

No payment required. The preview is yours to keep, share, or use as a brief if you want a full rebuild ($799, 5 days).`
    }],
  };
}

// ---------- MCP SERVER SETUP ----------

const server = new Server(
  { name: 'fivedaylaunch', version: '1.0.0' },
  { capabilities: { tools: {} } }
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: 'audit_website',
      description: 'Run a deterministic 5-pillar audit on any website (Performance, SEO, Mobile, Security, AEO). Returns a 0-100 score with specific findings. Free, no API key, instant.',
      inputSchema: {
        type: 'object',
        properties: {
          url: { type: 'string', description: 'Website URL or domain (e.g. "acmeplumbing.com" or "https://acme.com")' },
        },
        required: ['url'],
      },
    },
    {
      name: 'compare_websites',
      description: 'Compare two websites side-by-side. Returns scores, grades, and a winner.',
      inputSchema: {
        type: 'object',
        properties: {
          url_a: { type: 'string', description: 'First website to compare' },
          url_b: { type: 'string', description: 'Second website to compare' },
        },
        required: ['url_a', 'url_b'],
      },
    },
    {
      name: 'ai_visibility_check',
      description: 'Check how the 5 major AI search engines (ChatGPT, Perplexity, Gemini, Claude, Bing Copilot) describe a business. Returns visibility score 0-100 + specific fixes. Deterministic, no LLM tokens used.',
      inputSchema: {
        type: 'object',
        properties: {
          business_name: { type: 'string', description: 'Business name (e.g. "Joe\'s Pizza Frisco")' },
        },
        required: ['business_name'],
      },
    },
    {
      name: 'get_city_dashboard',
      description: 'Get the small business web-quality dashboard for a US city. Returns audited site count, mean score, top/bottom performers, and niche breakdown.',
      inputSchema: {
        type: 'object',
        properties: {
          city: { type: 'string', description: 'US city name (e.g. "Frisco", "Dallas", "Austin")' },
        },
        required: ['city'],
      },
    },
    {
      name: 'generate_redesign_preview',
      description: 'Request a free AI-generated redesign preview of any website. Returns a confirmation; the actual preview is emailed within 10 minutes. Costs $0.',
      inputSchema: {
        type: 'object',
        properties: {
          url: { type: 'string', description: 'Website URL to redesign' },
          email: { type: 'string', description: 'Email to receive the preview link' },
        },
        required: ['url', 'email'],
      },
    },
  ],
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;
  try {
    if (name === 'audit_website') return await auditWebsite(args);
    if (name === 'compare_websites') return await compareWebsites(args);
    if (name === 'ai_visibility_check') return await aiVisibilityCheck(args);
    if (name === 'get_city_dashboard') return await getCityDashboard(args);
    if (name === 'generate_redesign_preview') return await generateRedesignPreview(args);
    throw new Error(`Unknown tool: ${name}`);
  } catch (e) {
    return {
      content: [{ type: 'text', text: `Error: ${e.message}` }],
      isError: true,
    };
  }
});

const transport = new StdioServerTransport();
await server.connect(transport);
console.error('fdl-mcp-server running on stdio');
