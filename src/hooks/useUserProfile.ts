import { useState, useEffect } from "react";
import { apiFetch } from "../api/client";
import { User } from "../types";

export function useUserProfile(id: string | undefined) {
  const [profileUser, setProfileUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);
    apiFetch(`/users/${id}`)
      .then((data) => setProfileUser(data))
      .catch((err) => setError(err.message))
      .finally(() => setIsLoading(false));
  }, [id]);

  return { profileUser, isLoading, error };
}
