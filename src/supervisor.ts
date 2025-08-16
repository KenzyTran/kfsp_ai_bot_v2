import 'dotenv/config';
import { setDefaultOpenAIKey, Agent } from '@openai/agents';
import { createSearchAgentWithBraveMCP } from './search-agent.js';
import { helpAgent } from './help-agent.js';
import { macroAgent } from './macro-agent.js';

setDefaultOpenAIKey(process.env.OPENAI_API_KEY!);

export async function createSupervisor() {
  // Lấy Search Agent + Brave MCP (đã connect)
  const { searchAgent, brave } = await createSearchAgentWithBraveMCP();

  // Biến Search Agent thành tool
  const searchTool = searchAgent.asTool({
    toolName: 'Researcher',
  toolDescription: "This tool researches online for news and opportunities, \
                    either based on your specific request to look into a certain stock, \
                    or generally for notable financial news and opportunities. \
                    Describe what kind of research you're looking for.",
  });

  const supervisor = new Agent({
    name: 'Supervisor',
    instructions: `
    Bạn là điều phối viên.

    ĐỊNH TUYẾN:
    - HƯỚNG DẪN/CHỈ BÁO/THAO TÁC KFSP → HANDOFF "KFSP Help Agent".
    - VĨ MÔ VIỆT NAM (GDP, IIP, DN thành lập/giải thể, bán lẻ & dịch vụ, du lịch, nông nghiệp...) → HANDOFF "Macro Agent".
    - Ngoài phạm vi trên, có thể trả lời trực tiếp hoặc dùng tool "Researcher" để tra cứu web.
    - Khi agent con trả về "[RETURN_TO_SUPERVISOR]" → kết thúc handoff.

    Trả lời ngắn gọn, tiếng Việt.
`.trim(),
    handoffs: [helpAgent, macroAgent],
    tools: [searchTool],
    model: 'gpt-4o-mini',
    modelSettings: { toolChoice: 'auto' }
  });

  // Hàm đóng MCP khi kết thúc tiến trình
  const closeMcp = async () => {
    try { await brave.close(); } catch {}
  };

  return { supervisor, closeMcp };
}
