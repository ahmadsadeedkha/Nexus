import API_URL, { apiFetch } from "./client";
import { DocumentFile } from "../types";

export type DocumentScope = "mine" | "shared" | "all";

// The backend serves file URLs as paths relative to its own origin
// (e.g. "/uploads/documents/xyz.pdf"), not the "/api" origin used for
// JSON requests. This turns one into a fully-qualified, fetchable URL.
export function getFileUrl(relativeUrl: string): string {
  const origin = API_URL.replace(/\/api\/?$/, "");
  return `${origin}${relativeUrl}`;
}

async function uploadFetch(
  endpoint: string,
  method: "POST" | "PUT",
  formData: FormData,
): Promise<DocumentFile> {
  const token = localStorage.getItem("business_nexus_token");

  const response = await fetch(`${API_URL}${endpoint}`, {
    method,
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    body: formData,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    const error = new Error(errorData?.message || "Request failed") as Error & {
      data?: unknown;
      status?: number;
    };
    error.data = errorData;
    error.status = response.status;
    throw error;
  }

  return response.json();
}

export async function getDocuments(
  scope: DocumentScope = "all",
): Promise<DocumentFile[]> {
  return apiFetch(`/documents?scope=${scope}`);
}

export async function getDocumentById(id: string): Promise<DocumentFile> {
  return apiFetch(`/documents/${id}`);
}

export async function uploadDocument(
  file: File,
  name?: string,
): Promise<DocumentFile> {
  const formData = new FormData();
  formData.append("file", file);
  if (name) formData.append("name", name);
  return uploadFetch("/documents", "POST", formData);
}

export async function reuploadDocument(
  id: string,
  file: File,
): Promise<DocumentFile> {
  const formData = new FormData();
  formData.append("file", file);
  return uploadFetch(`/documents/${id}`, "PUT", formData);
}

export async function deleteDocument(id: string): Promise<{ message: string }> {
  return apiFetch(`/documents/${id}`, { method: "DELETE" });
}

export async function updateDocumentSharing(
  id: string,
  userIds: string[],
): Promise<DocumentFile> {
  return apiFetch(`/documents/${id}/share`, {
    method: "PATCH",
    body: JSON.stringify({ userIds }),
  });
}

export async function attachSignature(
  id: string,
  signatureBlob: Blob,
): Promise<DocumentFile> {
  const formData = new FormData();
  formData.append("signature", signatureBlob, "signature.png");
  return uploadFetch(`/documents/${id}/signature`, "POST", formData);
}

export async function removeSignature(id: string): Promise<DocumentFile> {
  return apiFetch(`/documents/${id}/signature`, { method: "DELETE" });
}
