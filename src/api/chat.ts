import { api } from './client';
import { ApiResponse } from '../types';

export type ChatResponseType =
    | 'text'
    | 'recipe_created'
    | 'recipe_imported'
    | 'recipe_updated'
    | 'shopping_list_updated'
    | 'meal_plan_updated'
    | 'pantry_updated'
    | 'meal_suggestions'
    | 'multi_action'
    | 'action_result'
    | 'error';

export interface ChatRequest {
    message: string;
    recipeContext?: {
        recipeId: string;
        recipeName: string;
    };
}

export interface ChatResponseData {
    type: ChatResponseType;
    message: string;
    data?: Record<string, unknown>;
}

export interface HistoryMessage {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    createdAt: number;
}

export const CARD_RESPONSE_TYPES: ChatResponseType[] = [
    'recipe_created',
    'recipe_imported',
    'recipe_updated',
    'shopping_list_updated',
    'meal_plan_updated',
    'pantry_updated',
    'meal_suggestions',
    'multi_action',
    'action_result',
];

export const chatApi = {
    send: (message: string, recipeContext?: ChatRequest['recipeContext']) =>
        api.post<ChatResponseData>('/api/chat/send', { message, recipe_context: recipeContext }),

    getHistory: () => api.get<{ messages: HistoryMessage[] }>('/api/chat/history'),

    getActions: () => api.get<{ actions: string[]; description: string }>('/api/chat/actions'),
};

export type { ApiResponse };
