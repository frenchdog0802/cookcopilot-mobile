import { api } from './client';
import { Folder, ApiResponse } from '../types';

export const folderApi = {
    list: (q?: string): Promise<ApiResponse<Folder[]>> =>
        api.get<Folder[]>(q ? `folder?q=${encodeURIComponent(q)}` : 'folder'),

    get: (id: string | number): Promise<ApiResponse<Folder>> =>
        api.get<Folder>(`folder/${id}`),

    create: (data: Partial<Folder>): Promise<ApiResponse<Folder>> =>
        api.post<Folder>('folder', data),

    update: (id: string | number, data: Partial<Folder>): Promise<ApiResponse<Folder>> =>
        api.put<Folder>(`folder/${id}`, data),

    delete: (id: string | number): Promise<ApiResponse<void>> =>
        api.delete<void>(`folder/${id}`),
};
