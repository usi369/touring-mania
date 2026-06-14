const key = process.env.PENPOT_MCP_KEY;
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
function findByName(node, name) {
  if (node.name === name) return node;
  for (const child of node.children ?? []) {
    const found = findByName(child, name);
    if (found) return found;
  }
  return null;
}

function collectTexts(node, acc = []) {
  if (node.type === 'text' || node.name === 'svg-text' || node.name === 'svg-node') {
    const content = node.characters ?? node.content ?? node.name;
    if (typeof content === 'string' && content.trim() && !content.startsWith('svg-')) {
      acc.push(content.trim());
    }
  }
  for (const child of node.children ?? []) collectTexts(child, acc);
  return acc;
}

function collectFills(node, acc = []) {
  if (node.fills?.length) {
    for (const fill of node.fills) {
      if (fill.fillColor) acc.push({ name: node.name, color: fill.fillColor, opacity: fill.fillOpacity ?? 1 });
    }
  }
  for (const child of node.children ?? []) collectFills(child, acc);
  return acc;
}

const page = penpot.currentPage;
const root = page.root;
const touring = findByName(root, 'penpot_touring_mania_board');
const tokens = touring ? findByName(touring, 'Tokens') : null;

const tokenTexts = tokens ? [...new Set(collectTexts(tokens))] : [];
const touringFills = touring ? collectFills(touring).slice(0, 40) : [];

const frames = (touring?.children ?? [])
  .filter(c => c.name.includes('Frame') || c.name.includes('Component'))
  .map(c => ({ name: c.name, type: c.type, childCount: c.children?.length ?? 0 }));

return { tokenTexts, touringFills, frames };
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
const text = result?.result?.content?.map((c) => c.text).join("\n") ?? JSON.stringify(result);
console.log(text);
