import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { getEntrepreneurs, getInvestors } from "../../api/users";
import { MeetingsPage } from "./MeetingsPage";

interface ParticipantOption {
  id: string;
  name: string;
}

export function MeetingsPageWrapper() {
  const { user, isLoading: authLoading } = useAuth();
  const [participantOptions, setParticipantOptions] = useState<
    ParticipantOption[]
  >([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;

    let cancelled = false;
    setLoadingUsers(true);

    Promise.all([getEntrepreneurs(), getInvestors()])
      .then(([entrepreneurs, investors]) => {
        if (cancelled) return;
        const combined = [...entrepreneurs, ...investors]
          .filter((u) => u.id !== user.id)
          .map((u) => ({ id: u.id, name: u.name }));
        setParticipantOptions(combined);
      })
      .catch((err) => {
        if (!cancelled)
          setError(err instanceof Error ? err.message : "Failed to load users");
      })
      .finally(() => {
        if (!cancelled) setLoadingUsers(false);
      });

    return () => {
      cancelled = true;
    };
  }, [user]);

  if (authLoading || loadingUsers) {
    return (
      <div className="flex items-center justify-center py-16 text-sm text-slate-500">
        Loading…
      </div>
    );
  }

  if (!user) {
    // ProtectedRoute should already prevent reaching here without a user
    return null;
  }

  if (error) {
    return <div className="px-4 py-8 text-sm text-rose-600">{error}</div>;
  }

  return (
    <MeetingsPage
      currentUserId={user.id}
      participantOptions={participantOptions}
    />
  );
}
