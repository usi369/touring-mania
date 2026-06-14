const key = process.env.PENPOT_MCP_KEY;
if (!key) {
  console.log(JSON.stringify({ error: "PENPOT_MCP_KEY not set" }));
  process.exit(1);
}

const url =
  "https://design.penpot.app/mcp/stream?userToken=" +
  encodeURIComponent(key);
const headers = {
  Accept: "application/json, text/event-stream",
  "Content-Type": "application/json",
};

async function mcpCall(body, sessionId) {
  const h = { ...headers };
  if (sessionId) h["mcp-session-id"] = sessionId;
  const res = await fetch(url, { method: "POST", headers: h, body: JSON.stringify(body) });
  const text = await res.text();
  const session = res.headers.get("mcp-session-id");
  const dataLines = text
    .split("\n")
    .filter((l) => l.startsWith("data: "))
    .map((l) => l.slice(6));
  const messages = dataLines
    .map((l) => {
      try {
        return JSON.parse(l);
      } catch {
        return null;
      }
    })
    .filter(Boolean);
  return { session, messages };
}

let { session, messages } = await mcpCall({
  jsonrpc: "2.0",
  id: 1,
  method: "initialize",
  params: {
    protocolVersion: "2024-11-05",
    capabilities: {},
    clientInfo: { name: "cursor-agent", version: "1.0" },
  },
});
await mcpCall({ jsonrpc: "2.0", method: "notifications/initialized" }, session);

const code = `
const page = penpot.currentPage;
if (!page) return { error: 'No page connected. Open Penpot file and use File -> MCP Server -> Connect.' };

function summarizeShape(shape, depth = 0) {
  const item = {
    type: shape.type,
    name: shape.name,
    id: shape.id,
    x: Math.round(shape.x),
    y: Math.round(shape.y),
    w: Math.round(shape.bounds?.width ?? shape.width ?? 0),
    h: Math.round(shape.bounds?.height ?? shape.height ?? 0),
    hidden: shape.hidden,
    children: []
  };
  if (shape.children && depth < 6) {
    for (const child of shape.children) {
      item.children.push(summarizeShape(child, depth + 1));
    }
  }
  return item;
}

const library = penpot.library?.local;
const components = (library?.components ?? []).map(c => ({ name: c.name, id: c.id }));
const colors = (library?.colors ?? []).map(c => ({ name: c.name, color: c.color, id: c.id }));
const typographies = (library?.typographies ?? []).map(t => ({ name: t.name, id: t.id }));

const tokenCatalog = library?.tokens;
const tokenSets = (tokenCatalog?.sets ?? []).map(set => ({
  name: set.name,
  active: set.active,
  tokens: (set.tokens ?? []).map(tok => ({
    name: tok.name,
    type: tok.type,
    value: tok.value,
    resolvedValue: tok.resolvedValue
  }))
}));

return {
  fileName: penpot.currentFile?.name ?? null,
  pageName: page.name,
  pageId: page.id,
  structure: summarizeShape(page.root),
  components,
  libraryColors: colors,
  typographies,
  tokenSets
};
`;

({ session, messages } = await mcpCall(
  {
    jsonrpc: "2.0",
    id: 4,
    method: "tools/call",
    params: { name: "execute_code", arguments: { code } },
  },
  session
));

const result = messages.find((m) => m.result || m.error);
if (result?.error) {
  console.log(JSON.stringify({ error: result.error }, null, 2));
} else {
  const text =
    result?.result?.content?.map((c) => c.text).join("\n") ??
    JSON.stringify(result?.result);
  console.log(text);
}
