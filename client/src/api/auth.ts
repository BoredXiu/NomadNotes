import api from './client';
import type { ApiResponse, AuthData, TokenPair } from '../types';

export async function register(data: {
  username: string;
  email: string;
  password: string;
}): Promise<AuthData> {
  const res = await api.post<ApiResponse<AuthData>>('/auth/register', data);
  return res.data.data;
}

export async function login(data: {
  email: string;
  password: string;
}): Promise<AuthData> {
  const res = await api.post<ApiResponse<AuthData>>('/auth/login', data);
  return res.data.data;
}

export async function refreshToken(
  refreshToken: string
): Promise<TokenPair> {
  const res = await api.post<ApiResponse<TokenPair>>('/auth/refresh', {
    refreshToken,
  });
  return res.data.data;
}