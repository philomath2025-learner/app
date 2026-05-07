// Discover Quran MCP server tools
async function main() {
  // Step 1: Initialize session
  const initRes = await fetch('https://mcp.quran.ai', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json, text/event-stream',
    },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: 1,
      method: 'initialize',
      params: {
        protocolVersion: '2025-03-26',
        capabilities: {},
        clientInfo: { name: 'quran-lingo', version: '1.0' },
      },
    }),
  });

  const sessionId = initRes.headers.get('mcp-session-id');
  console.log('Session ID:', sessionId);

  // Read init response
  const initText = await initRes.text();

  // Step 2: List tools
  const listRes = await fetch('https://mcp.quran.ai', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json, text/event-stream',
      'mcp-session-id': sessionId,
    },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: 2,
      method: 'tools/list',
      params: {},
    }),
  });

  const toolsText = await listRes.text();
  // Parse SSE format
  const lines = toolsText.split('\n');
  for (const line of lines) {
    if (line.startsWith('data: ')) {
      const data = JSON.parse(line.slice(6));
      const toolNames = data.result?.tools?.map(t => t.name) || [];
      console.log('\nAvailable tools:', toolNames.join(', '));
      
      // Print tool details
      for (const tool of data.result?.tools || []) {
        console.log(`\n--- ${tool.name} ---`);
        console.log('Description:', tool.description?.substring(0, 150));
        console.log('Params:', JSON.stringify(Object.keys(tool.inputSchema?.properties || {})));
      }
    }
  }
}

main().catch(e => console.error('Error:', e.message));
