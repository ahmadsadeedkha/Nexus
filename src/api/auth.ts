import { apiFetch } from "./client";
import { User, UserRole } from "../types";

interface AuthResponse {
  user: User;
  token: string;
}

export async function loginRequest(
  email: string,
  password: string,
  role: UserRole,
): Promise<AuthResponse> {
  return apiFetch("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password, role }),
  });
}

export async function registerRequest(
  name: string,
  email: string,
  password: string,
  role: UserRole,
): Promise<AuthResponse> {
  return apiFetch("/auth/register", {
    method: "POST",
    body: JSON.stringify({ name, email, password, role }),
  });
}

export async function forgotPasswordRequest(
  email: string,
): Promise<{ message: string }> {
  return apiFetch("/auth/forgot-password", {
    method: "POST",
    body: JSON.stringify({ email }),
  });
}

export async function resetPasswordRequest(
  token: string,
  newPassword: string,
): Promise<{ message: string }> {
  return apiFetch("/auth/reset-password", {
    method: "POST",
    body: JSON.stringify({ token, newPassword }),
  });
}

export async function updateProfileRequest(
  userId: string,
  updates: Partial<User>,
): Promise<User> {
  return apiFetch(`/users/${userId}`, {
    method: "PATCH",
    body: JSON.stringify(updates),
  });
}
