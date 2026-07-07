import React, { useEffect, useMemo, useState } from "react";
import { Search, Video, X } from "lucide-react";
import toast from "react-hot-toast";
import { Input } from "../../components/ui/Input";
import { Button } from "../../components/ui/Button";
import { Card, CardBody } from "../../components/ui/Card";
import { Avatar } from "../../components/ui/Avatar";
import { Badge } from "../../components/ui/Badge";
import { getAllUsers } from "../../api/users";
import { useAuth } from "../../context/AuthContext";
import { useCall } from "../../context/callContext";
import { User } from "../../types";

export const VideoCallPage: React.FC = () => {
  const { user: currentUser } = useAuth();
  const { onlineUserIds, startCall, callStatus } = useCall();

  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  useEffect(() => {
    getAllUsers()
      .then((all) => setUsers(all.filter((u) => u.id !== currentUser?.id)))
      .catch(() => toast.error("Could not load users"))
      .finally(() => setIsLoading(false));
  }, [currentUser?.id]);

  const isOnline = (u: User) => onlineUserIds.has(u.id) || Boolean(u.isOnline);

  const filteredUsers = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const list = q
      ? users.filter(
          (u) =>
            u.name.toLowerCase().includes(q) ||
            u.email.toLowerCase().includes(q),
        )
      : users;
    // Online users first.
    return [...list].sort((a, b) => Number(isOnline(b)) - Number(isOnline(a)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [users, searchQuery, onlineUserIds]);

  const selectedUsers = users.filter((u) => selectedIds.includes(u.id));

  const toggleSelect = (u: User) => {
    if (!isOnline(u)) return;
    setSelectedIds((prev) =>
      prev.includes(u.id) ? prev.filter((id) => id !== u.id) : [...prev, u.id],
    );
  };

  const handleStartCall = async () => {
    if (selectedIds.length === 0) return;
    await startCall(selectedIds);
    setSelectedIds([]);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Video Call</h1>
        <p className="text-gray-600">
          Start a video call with anyone on Nexus — select one person for a 1:1
          call, or several for a group call.
        </p>
      </div>

      {selectedUsers.length > 0 && (
        <Card>
          <CardBody className="flex flex-wrap items-center gap-3">
            <span className="text-sm font-medium text-gray-700">
              Calling {selectedUsers.length}{" "}
              {selectedUsers.length === 1 ? "person" : "people"}:
            </span>
            {selectedUsers.map((u) => (
              <span
                key={u.id}
                className="inline-flex items-center gap-1.5 bg-primary-50 text-primary-800 rounded-full pl-1 pr-2 py-1 text-sm"
              >
                <Avatar src={u.avatarUrl} alt={u.name} size="xs" />
                {u.name}
                <button
                  onClick={() => toggleSelect(u)}
                  aria-label={`Remove ${u.name}`}
                >
                  <X size={14} />
                </button>
              </span>
            ))}
            <Button
              size="sm"
              leftIcon={<Video size={16} />}
              onClick={handleStartCall}
              disabled={callStatus !== "idle"}
              className="ml-auto"
            >
              Start Call
            </Button>
          </CardBody>
        </Card>
      )}

      <Input
        placeholder="Search people by name or email..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        startAdornment={<Search size={18} />}
        fullWidth
      />

      {isLoading ? (
        <p className="text-center text-gray-500 py-12">Loading people...</p>
      ) : filteredUsers.length === 0 ? (
        <p className="text-center text-gray-500 py-12">No one found.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredUsers.map((u) => {
            const online = isOnline(u);
            const selected = selectedIds.includes(u.id);
            return (
              <Card
                key={u.id}
                hoverable={online}
                onClick={() => toggleSelect(u)}
                className={`${selected ? "ring-2 ring-primary-500" : ""} ${
                  !online ? "opacity-60" : ""
                }`}
              >
                <CardBody className="flex items-center gap-3">
                  <Avatar
                    src={u.avatarUrl}
                    alt={u.name}
                    size="lg"
                    status={online ? "online" : "offline"}
                  />
                  <div className="min-w-0 flex-1">
                    <h3 className="text-sm font-medium text-gray-900 truncate">
                      {u.name}
                    </h3>
                    <p className="text-xs text-gray-500 capitalize">{u.role}</p>
                  </div>
                  <Badge variant={online ? "success" : "gray"} size="sm">
                    {online ? "Online" : "Offline"}
                  </Badge>
                </CardBody>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};
