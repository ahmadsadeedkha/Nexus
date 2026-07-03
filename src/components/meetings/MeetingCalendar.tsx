import { useCallback, useState } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import type { EventClickArg, EventInput } from "@fullcalendar/core";
import { meetingsApi, CalendarEvent } from "../../api/meetings";

interface MeetingCalendarProps {
  onSelectMeeting: (meetingId: string) => void;
  /** Bump this number after scheduling/accepting/rejecting to force a refetch */
  refreshKey?: number;
}

const STATUS_COLORS: Record<string, { bg: string; border: string }> = {
  pending: { bg: "#FEF3C7", border: "#D97706" },
  accepted: { bg: "#D1FAE5", border: "#059669" },
};

export function MeetingCalendar({
  onSelectMeeting,
  refreshKey,
}: MeetingCalendarProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchEvents = useCallback(
    async (
      info: { startStr: string; endStr: string },
      success: (events: EventInput[]) => void,
      failure: (error: Error) => void,
    ) => {
      setLoading(true);
      setError(null);
      try {
        const events: CalendarEvent[] = await meetingsApi.getCalendarFeed(
          info.startStr,
          info.endStr,
        );
        const mapped: EventInput[] = events.map((e) => ({
          id: e.id,
          title: e.title,
          start: e.start,
          end: e.end,
          backgroundColor: STATUS_COLORS[e.status]?.bg ?? "#E2E8F0",
          borderColor: STATUS_COLORS[e.status]?.border ?? "#64748B",
          textColor: "#1E293B",
          extendedProps: e.extendedProps,
        }));
        success(mapped);
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Failed to load meetings";
        setError(message);
        failure(err instanceof Error ? err : new Error(message));
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  const handleEventClick = (arg: EventClickArg) => {
    onSelectMeeting(arg.event.id);
  };

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-4 text-sm text-slate-600">
          <span className="flex items-center gap-1.5">
            <span
              className="h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: "#D97706" }}
            />
            Pending
          </span>
          <span className="flex items-center gap-1.5">
            <span
              className="h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: "#059669" }}
            />
            Accepted
          </span>
        </div>
        {loading && <span className="text-xs text-slate-400">Loading…</span>}
      </div>

      {error && (
        <div className="mb-3 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">
          {error}
        </div>
      )}

      <FullCalendar
        key={refreshKey ?? 0}
        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
        initialView="timeGridWeek"
        headerToolbar={{
          left: "prev,next today",
          center: "title",
          right: "dayGridMonth,timeGridWeek,timeGridDay",
        }}
        height="auto"
        events={fetchEvents}
        eventClick={handleEventClick}
        nowIndicator
        slotMinTime="07:00:00"
        slotMaxTime="20:00:00"
      />
    </div>
  );
}
