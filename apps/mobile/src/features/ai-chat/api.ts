import { createAiChatApi } from '@rinciku/domain/ai-chat';

import { supabase } from '@/lib/supabase';

// Shared ai-chat brain (@rinciku/domain/ai-chat) bound to the mobile Supabase
// client — the same shim pattern as features/expenses/api.ts. Conversation CRUD,
// the LLM proxy, budget grounding, the agentic tool loop, and confirm handlers
// all live in the portable slice. Image capture (expo-image-picker) is deferred
// and will be added here app-locally, like the web File helpers.
const api = createAiChatApi(supabase);

export const {
  listConversations,
  createConversation,
  getMessages,
  chatImageUrl,
  appendMessage,
  touchConversation,
  deleteConversation,
  buildBudgetContext,
  sendChat,
  executeReadTool,
  applyProposedChange,
  resolveChangeTarget,
  runAgentTurn,
  confirmExpenseProposal,
  confirmIncomeProposal,
} = api;

// Pure helpers + types re-exported straight from the domain slice.
export {
  extractText,
  parseProposal,
  parseChange,
  summarizeProposal,
  conversationTitleFrom,
} from '@rinciku/domain/ai-chat';
export type {
  AppendMessageInput,
  ConfirmAttachment,
  ConfirmBase,
  ChatMessageRowWithImage,
  AiChatApi,
} from '@rinciku/domain/ai-chat';
