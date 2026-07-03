import { useState } from "react";
import { MeetingCalendar } from "../../components/meetings/MeetingCalendar";
import { ScheduleMeetingModal } from "../../components/meetings/ScheduleMeetingModal";
import { MeetingDetailsModal } from "../../components/meetings/MeetingDetailsModal";

interface MeetingsPageProps {
  currentUserId: string;
  participantOptions: { id: string; name: string }[];
}

export function MeetingsPage({
  currentUserId,
  participantOptions,
}: MeetingsPageProps) {
  const [showSchedule, setShowSchedule] = useState(false);
  const [selectedMeetingId, setSelectedMeetingId] = useState<string | null>(
    null,
  );
  const [refreshKey, setRefreshKey] = useState(0);

  const bump = () => setRefreshKey((k) => k + 1);

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Meetings</h1>
          <p className="text-sm text-slate-500">
            Schedule and manage your meetings.
          </p>
        </div>
        <button
          onClick={() => setShowSchedule(true)}
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
        >
          + Schedule meeting
        </button>
      </div>

      <MeetingCalendar
        onSelectMeeting={setSelectedMeetingId}
        refreshKey={refreshKey}
      />

      {showSchedule && (
        <ScheduleMeetingModal
          participantOptions={participantOptions}
          onClose={() => setShowSchedule(false)}
          onScheduled={bump}
        />
      )}

      {selectedMeetingId && (
        <MeetingDetailsModal
          meetingId={selectedMeetingId}
          currentUserId={currentUserId}
          onClose={() => setSelectedMeetingId(null)}
          onChanged={bump}
        />
      )}
    </div>
  );
}
