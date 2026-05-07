// Test fetch_word_morphology from Quran MCP
async function main() {
  // Step 1: Initialize
  const initRes = await fetch('https://mcp.quran.ai', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Accept': 'application/json, text/event-stream' },
    body: JSON.stringify({
      jsonrpc: '2.0', id: 1, method: 'initialize',
      params: { protocolVersion: '2025-03-26', capabilities: {}, clientInfo: { name: 'quran-lingo', version: '1.0' } },
    }),
  });
  const sessionId = initRes.headers.get('mcp-session-id');
  await initRes.text(); // consume
  
  // Step 2: Call fetch_word_morphology for بِسْمِ (1:1 word 1)
  const morphRes = await fetch('https://mcp.quran.ai', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Accept': 'application/json, text/event-stream', 'mcp-session-id': sessionId },
    body: JSON.stringify({
      jsonrpc: '2.0', id: 2, method: 'tools/call',
      params: { name: 'fetch_word_morphology', arguments: { ayah_key: '1:1', word_position: 1 } },
    }),
  });
  const morphText = await morphRes.text();
  for (const line of morphText.split('\n')) {
    if (line.startsWith('data: ')) {
      const data = JSON.parse(line.slice(6));
      console.log('\n=== MORPHOLOGY 1:1 word 1 (بِسْمِ) ===');
      console.log(JSON.stringify(data.result, null, 2));
    }
  }

  // Step 3: Call fetch_word_concordance for root ر-ح-م
  const concRes = await fetch('https://mcp.quran.ai', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Accept': 'application/json, text/event-stream', 'mcp-session-id': sessionId },
    body: JSON.stringify({
      jsonrpc: '2.0', id: 3, method: 'tools/call',
      params: { name: 'fetch_word_concordance', arguments: { ayah_key: '1:1', word_position: 3, page_size: 3 } },
    }),
  });
  const concText = await concRes.text();
  for (const line of concText.split('\n')) {
    if (line.startsWith('data: ')) {
      const data = JSON.parse(line.slice(6));
      console.log('\n=== CONCORDANCE 1:1 word 3 (ٱلرَّحْمَـٰنِ) ===');
      console.log(JSON.stringify(data.result, null, 2));
    }
  }

  // Step 4: Test 2:2 word 2 (ٱلْكِتَـٰبُ) - Al-Baqarah
  const morph2Res = await fetch('https://mcp.quran.ai', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Accept': 'application/json, text/event-stream', 'mcp-session-id': sessionId },
    body: JSON.stringify({
      jsonrpc: '2.0', id: 4, method: 'tools/call',
      params: { name: 'fetch_word_morphology', arguments: { ayah_key: '2:2', word_position: 2 } },
    }),
  });
  const morph2Text = await morph2Res.text();
  for (const line of morph2Text.split('\n')) {
    if (line.startsWith('data: ')) {
      const data = JSON.parse(line.slice(6));
      console.log('\n=== MORPHOLOGY 2:2 word 2 (ٱلْكِتَـٰبُ) ===');
      console.log(JSON.stringify(data.result, null, 2));
    }
  }
}

main().catch(e => console.error('Error:', e.message));
