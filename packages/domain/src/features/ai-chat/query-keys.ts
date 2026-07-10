// React-query cache keys for the ai-chat feature. Defined in the domain slice
// (they're plain data) so web + mobile can't drift apart on the shapes their
// hooks read and write.
export const aiChatKeys = {
  conversations: ['ai-chat', 'conversations'] as const,
  messages: (conversationId: string) =>
    ['ai-chat', 'messages', conversationId] as const,
};
