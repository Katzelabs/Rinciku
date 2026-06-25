import type { RouteObject } from 'react-router';
import { protectedRoute } from '@/features/auth';
import { ChatPage } from './pages/chat-page';

export const aiChatRoutes: RouteObject[] = [
  {
    path: 'ai-chat',
    element: protectedRoute(<ChatPage />),
  },
];
