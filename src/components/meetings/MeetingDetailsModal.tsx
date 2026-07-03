import { useEffect, useState } from "react";
import { meetingsApi, Meeting } from "../../api/meetings";

interface MeetingDetailsModalProps {
  meetingId: string;
  currentUserId: string;
  onClose: () => void;
  onChanged: () => void;
}

const STATUS_STYLES: Record<string, string> = {
  pending: "bg-amber-100 text-amber-800",
  accepted: "bg-emerald-100 text-emerald-800",
  rejected: "bg-rose-100 text-rose-800",
  cancelled: "bg-slate-200 text-slate-600",
};

export function MeetingDetailsModal({
  meetingId,
  currentUserId,
  onClose,
  onChanged,
}: MeetingDetailsModalProps) {
  const [meeting, setMeeting] = useState<Meeting | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionError, setActionError] = useState<string | null>(null);
  const [acting, setActing] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    meetingsApi
      .getById(meetingId)
      .then((m) => {
        if (!cancelled) setMeeting(m);
      })
      .catch((err) =>
        setActionError(
          err instanceof Error ? err.message : "Failed to load meeting",
        ),
      )
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [meetingId]);

  const runAction = async (action: "accept" | "reject" | "cancel") => {
    setActing(true);
    setActionError(null);
    try {
      const updated =
        action === "accept"
          ? await meetingsApi.accept(meetingId)
          : action === "reject"
            ? await meetingsApi.reject(meetingId)
            : await meetingsApi.cancel(meetingId);
      setMeeting(updated);
      onChanged();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Action failed");
    } finally {
      setActing(false);
    }
  };

  const isParticipant = meeting?.participants.some(
    (p) => p.id === currentUserId,
  );
  const isOrganizer = meeting?.organizer.id === currentUserId;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
        {loading && <p className="text-sm text-slate-500">Loading…</p>}

        {!loading && meeting && (
          <>
            <div className="mb-3 flex items-start justify-between">
              <h2 className="text-lg font-semibold text-slate-900">
                {meeting.title}
              </h2>
              <span
                className={`rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_STYLES[meeting.status]}`}
              >
                {meeting.status}
              </span>
            </div>

            {meeting.description && (
              <p className="mb-3 text-sm text-slate-600">
                {meeting.description}
              </p>
            )}

            <dl className="space-y-1.5 text-sm text-slate-600">
              <div>
                <dt className="inline font-medium text-slate-700">When: </dt>
                <dd className="inline">
                  {new Date(meeting.startTime).toLocaleString()} –{" "}
                  {new Date(meeting.endTime).toLocaleTimeString()}
                </dd>
              </div>
              <div>
                <dt className="inline font-medium text-slate-700">
                  Organizer:{" "}
                </dt>
                <dd className="inline">{meeting.organizer.name}</dd>
              </div>
              <div>
                <dt className="inline font-medium text-slate-700">
                  Participants:{" "}
                </dt>
                <dd className="inline">
                  {meeting.participants.map((p) => p.name).join(", ")}
                </dd>
              </div>
              {meeting.location && (
                <div>
                  <dt className="inline font-medium text-slate-700">
                    Location:{" "}
                  </dt>
                  <dd className="inline">{meeting.location}</dd>
                </div>
              )}
            </dl>

            {actionError && (
              <div className="mt-3 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">
                {actionError}
              </div>
            )}

            <div className="mt-5 flex justify-end gap-2">
              <button
                onClick={onClose}
                className="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100"
              >
                Close
              </button>

              {isParticipant && meeting.status === "pending" && (
                <>
                  <button
                    disabled={acting}
                    onClick={() => runAction("reject")}
                    className="rounded-lg bg-rose-100 px-4 py-2 text-sm font-medium text-rose-700 hover:bg-rose-200 disabled:opacity-50"
                  >
                    Reject
                  </button>
                  <button
                    disabled={acting}
                    onClick={() => runAction("accept")}
                    className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
                  >
                    Accept
                  </button>
                </>
              )}

              {isOrganizer && meeting.status !== "cancelled" && (
                <button
                  disabled={acting}
                  onClick={() => runAction("cancel")}
                  className="rounded-lg bg-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-300 disabled:opacity-50"
                >
                  Cancel meeting
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
