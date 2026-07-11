import type { Profile } from '../auth';
import { AGENT_TOOLS, isWriteTool } from './agent-tools';
import type {
  ChatResponse,
  ImageBlock,
  MessageParam,
  TextBlock,
  ToolChoice,
  ToolDef,
  ToolResultBlock,
  ToolUseBlock,
} from './types';

// Bounds the read-tool loop so a misbehaving model can't spin forever. Each
// step is one model round-trip; reads in between are auto-executed. 8 gives
// multi-tool analysis turns (overview → grouped query → compare_periods → …)
// headroom without letting a loop run away.
export const MAX_STEPS = 8;

// Verbatim history sent per turn. 30 history + 1 new user message + up to
// 2 × MAX_STEPS tool-loop messages = 47, safely under the edge function's
// 60-message cap. Older context arrives via the running conversation summary
// (params.summary). Always ≤ the thread page size, so the loaded tail suffices.
export const HISTORY_WINDOW = 30;

export type RunAgentTurnDeps = {
  // The LLM proxy (createAiChatApi binds this to `db.functions.invoke`).
  sendChat: (req: {
    system: string;
    messages: MessageParam[];
    tools?: ToolDef[];
    tool_choice?: ToolChoice;
  }) => Promise<ChatResponse>;
  // Client-side read tool execution (createAiChatApi binds this to the apis).
  executeReadTool: (
    name: string,
    input: unknown,
    profile: Profile
  ) => Promise<string>;
  // UI-supplied fallback message if the model never produces a response.
  noResponseMessage?: string;
};

export type RunAgentTurnParams = {
  system: string;
  // Prior thread as text-only messages (tool/image blocks are never replayed).
  // Windowed to the last HISTORY_WINDOW entries inside the loop.
  history: MessageParam[];
  // This turn's user content (text and/or a base64 image block).
  apiContent: Array<TextBlock | ImageBlock>;
  // First-step tool choice; images force a tool for a clean extraction.
  toolChoice: ToolChoice;
  profile: Profile;
  // Running summary of messages older than the window (conversations.summary);
  // appended to the system prompt so long threads keep their context.
  summary?: string | null;
};

// The agentic loop, extracted UI-free so web + mobile share it. The model may
// call read tools (auto-executed here, reusing the RLS-scoped api factories)
// and reason over the results before answering. Write proposals (propose_*) end
// the loop — they are never executed here; the caller stages a confirmation
// card from the returned terminal response.
export async function runAgentTurn(
  params: RunAgentTurnParams,
  deps: RunAgentTurnDeps
): Promise<ChatResponse> {
  // Window here (not in the callers) so the ≤ edge-cap invariant holds no
  // matter how much history a caller loads.
  const apiMessages: MessageParam[] = [
    ...params.history.slice(-HISTORY_WINDOW),
    { role: 'user', content: params.apiContent },
  ];
  const system = params.summary?.trim()
    ? `${params.system}\n\n## Earlier conversation (summary)\nOlder messages in this conversation are not shown verbatim. Summary of what came before:\n${params.summary.trim()}`
    : params.system;
  let toolChoice = params.toolChoice;
  let res: ChatResponse | null = null;

  for (let step = 0; step < MAX_STEPS; step++) {
    res = await deps.sendChat({
      system,
      messages: apiMessages,
      tools: AGENT_TOOLS,
      tool_choice: toolChoice,
    });
    if (res.error) throw new Error(res.error);

    const blocks = res.content ?? [];
    const hasWrite = blocks.some(
      (b) => b.type === 'tool_use' && isWriteTool(b.name)
    );
    if (hasWrite) break; // terminal: a write proposal needs confirmation

    const readUses = blocks.filter(
      (b): b is ToolUseBlock => b.type === 'tool_use' && !isWriteTool(b.name)
    );
    if (readUses.length === 0) break; // terminal: plain text answer

    // Execute the requested reads and replay the results to the model.
    apiMessages.push({ role: 'assistant', content: blocks });
    const results: ToolResultBlock[] = await Promise.all(
      readUses.map(async (u) => ({
        type: 'tool_result' as const,
        tool_use_id: u.id,
        content: await deps.executeReadTool(u.name, u.input, params.profile),
      }))
    );
    apiMessages.push({ role: 'user', content: results });
    toolChoice = { type: 'auto' };
  }

  if (!res) {
    throw new Error(deps.noResponseMessage ?? 'The assistant did not respond.');
  }
  return res;
}
