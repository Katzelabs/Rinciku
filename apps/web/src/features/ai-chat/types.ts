// The ai-chat types are portable and live in @rinciku/domain/ai-chat (shared by
// web + mobile). This file re-exports them so existing `../types` imports keep
// working.
export type {
  Conversation,
  ConversationListItem,
  ChatMessageRow,
  ChatMessageRowWithImage,
  ChatItem,
  TextBlock,
  ImageBlock,
  ToolUseBlock,
  ToolResultBlock,
  ContentBlock,
  MessageParam,
  ToolDef,
  ToolChoice,
  ChatResponse,
  ProposalKind,
  DocType,
  ProposedTransaction,
  PendingAttachment,
  ChangeAction,
  ChangeEntity,
  ChangeTarget,
  ChangeTargetRecord,
  ProposedChange,
} from '@rinciku/domain/ai-chat';
