import { api } from './client';
import { ApiResponse } from '../types';

export interface ChatMessage {
    role: 'system' | 'user' | 'assistant';
    content: string;
}

export interface ChatResponseData {
    type: 'recipe' | 'tip' | 'clarification' | 'refusal';
    message: string;
    data: any;
}

export const chatApi = {
    send: (message: string) => api.post<ChatResponseData>('chat/send', { message }),
};
