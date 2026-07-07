import { apiFetch } from "./client";
import { User, Entrepreneur, Investor } from "../types";

export async function getAllUsers(): Promise<User[]> {
  return apiFetch("/users");
}

export async function getEntrepreneurs(): Promise<Entrepreneur[]> {
  return apiFetch("/users?role=entrepreneur");
}

export async function getInvestors(): Promise<Investor[]> {
  return apiFetch("/users?role=investor");
}

export async function getUserById(id: string): Promise<User> {
  return apiFetch(`/users/${id}`);
}

export async function updateUser(
  id: string,
  updates: Partial<User>,
): Promise<User> {
  return apiFetch(`/users/${id}`, {
    method: "PATCH",
    body: JSON.stringify(updates),
  });
}
