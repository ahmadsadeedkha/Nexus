import { apiFetch } from "./client";

export interface MeetingUser {
  id: string;
  name: string;
  email: string;
  role: string;
}

export type MeetingStatus = "pending" | "accepted" | "rejected" | "cancelled";

export interface Meeting {
  id: string;
  title: string;
  description?: string;
  organizer: MeetingUser;
  participants: MeetingUser[];
  startTime: string;
  endTime: string;
  status: MeetingStatus;
  location?: string;
  meetingLink?: string;
}

export interface CalendarEvent {
  id: string;
  title: string;
  start: string;
  end: string;
  status: MeetingStatus;
  allDay: boolean;
  extendedProps: {
    description?: string;
    location?: string;
    meetingLink?: string;
    organizer: MeetingUser;
    participants: MeetingUser[];
  };
}

export interface MeetingConflict {
  id: string;
  title: string;
  startTime: string;
  endTime: string;
}

interface ScheduleMeetingInput {
  title: string;
  description?: string;
  participants: string[];
  startTime: string;
  endTime: string;
  location?: string;
  meetingLink?: string;
}

export class ApiError extends Error {
  status?: number;
  conflicts?: MeetingConflict[];

  constructor(message: string, status?: number, conflicts?: MeetingConflict[]) {
    super(message);
    this.status = status;
    this.conflicts = conflicts;
  }
}

// apiFetch throws a plain Error with .data/.status attached (see client.ts).
// This normalizes that into an ApiError so components can read `.conflicts`.
function toApiError(err: unknown): ApiError {
  if (err instanceof Error) {
    const withData = err as Error & {
      data?: { conflicts?: MeetingConflict[] };
      status?: number;
    };
    return new ApiError(err.message, withData.status, withData.data?.conflicts);
  }
  return new ApiError("Request failed");
}

export const meetingsApi = {
  schedule: async (input: ScheduleMeetingInput): Promise<Meeting> => {
    try {
      const body = await apiFetch("/meetings", {
        method: "POST",
        body: JSON.stringify(input),
      });
      return body.data as Meeting;
    } catch (err) {
      throw toApiError(err);
    }
  },

  list: async (params?: {
    status?: MeetingStatus;
    from?: string;
    to?: string;
  }): Promise<Meeting[]> => {
    try {
      const query = params
        ? new URLSearchParams(
            Object.entries(params).filter(([, v]) => v) as [string, string][],
          ).toString()
        : "";
      const body = await apiFetch(`/meetings${query ? `?${query}` : ""}`);
      return body.data as Meeting[];
    } catch (err) {
      throw toApiError(err);
    }
  },

  getById: async (id: string): Promise<Meeting> => {
    try {
      const body = await apiFetch(`/meetings/${id}`);
      return body.data as Meeting;
    } catch (err) {
      throw toApiError(err);
    }
  },

  getCalendarFeed: async (
    from: string,
    to: string,
  ): Promise<CalendarEvent[]> => {
    try {
      const query = new URLSearchParams({ from, to }).toString();
      const body = await apiFetch(`/meetings/calendar?${query}`);
      return body.data as CalendarEvent[];
    } catch (err) {
      throw toApiError(err);
    }
  },

  accept: async (id: string): Promise<Meeting> => {
    try {
      const body = await apiFetch(`/meetings/${id}/accept`, {
        method: "PATCH",
      });
      return body.data as Meeting;
    } catch (err) {
      throw toApiError(err);
    }
  },

  reject: async (id: string): Promise<Meeting> => {
    try {
      const body = await apiFetch(`/meetings/${id}/reject`, {
        method: "PATCH",
      });
      return body.data as Meeting;
    } catch (err) {
      throw toApiError(err);
    }
  },

  cancel: async (id: string): Promise<Meeting> => {
    try {
      const body = await apiFetch(`/meetings/${id}/cancel`, {
        method: "PATCH",
      });
      return body.data as Meeting;
    } catch (err) {
      throw toApiError(err);
    }
  },
};
