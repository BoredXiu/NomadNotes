import api from "./client";
import type { ApiResponse, User } from "../types";

export async function getProfile(): Promise<User> {
  const res = await api.get<ApiResponse<User>>("/profile");
  return res.data.data;
}

export async function updateProfile(data: {
  username?: string;
  bio?: string;
  address?: string;
  gender?: string;
  avatarUrl?: string;
}): Promise<User> {
  const res = await api.patch<ApiResponse<User>>("/profile", data);
  return res.data.data;
}