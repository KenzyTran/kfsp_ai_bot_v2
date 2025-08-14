import { Agent, webSearchTool, MCPServerStdio } from '@openai/agents';

type BraveMcpBundle = {
  brave: MCPServerStdio;
  searchAgent: Agent;
};

let singleton: BraveMcpBundle | undefined;

export async function createSearchAgentWithBraveMCP(): Promise<BraveMcpBundle> {
  if (singleton) return singleton;

  const isWin = process.platform === 'win32';
  const npxCmd = isWin ? 'npx.cmd' : 'npx';

  // Khởi tạo Brave MCP (STDIO)
  const brave = new MCPServerStdio({
    name: 'Brave Search MCP',
    command: npxCmd,
    args: ['-y', '@modelcontextprotocol/server-brave-search'],
    env: { BRAVE_API_KEY: process.env.BRAVE_API_KEY ?? '' },
    cacheToolsList: true,
  });

  // Kết nối MCP
  await brave.connect();

  // Prompt
  const INSTRUCTIONS = `You are a research assistant. Given a search term, you search the web for that term and 
produce a concise summary of the results. The summary must be 2–3 paragraphs and <300 words.
Capture main points; fragments are fine; no extra commentary. Focus on essence, ignore fluff.
The current datetime is ${new Date().toISOString()}.`;

  // Agent tìm kiếm: có webSearchTool + Brave MCP
  const searchAgent = new Agent({
    name: 'Search agent',
    instructions: INSTRUCTIONS,
    tools: [
      webSearchTool({ searchContextSize: 'low' }) // vẫn giữ tool web mặc định (fallback)
    ],
    mcpServers: [brave],
    model: 'gpt-4o-mini',
    modelSettings: { toolChoice: 'auto' }
  });

  singleton = { brave, searchAgent };
  return singleton;
}
