import { apiFetch } from "./client";
import { CollaborationRequest } from "../types";

export async function createCollaborationRequest(
  entrepreneurId: string,
  message: string,
): Promise<CollaborationRequest> {
  return apiFetch("/collaboration-requests", {
    method: "POST",
    body: JSON.stringify({ entrepreneurId, message }),
  });
}

export async function getRequestsForEntrepreneur(
  entrepreneurId: string,
): Promise<CollaborationRequest[]> {
  return apiFetch(`/collaboration-requests/entrepreneur/${entrepreneurId}`);
}

export async function getRequestsFromInvestor(
  investorId: string,
): Promise<CollaborationRequest[]> {
  return apiFetch(`/collaboration-requests/investor/${investorId}`);
}

export async function updateRequestStatus(
  requestId: string,
  status: "pending" | "accepted" | "rejected",
): Promise<CollaborationRequest> {
  return apiFetch(`/collaboration-requests/${requestId}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
}
