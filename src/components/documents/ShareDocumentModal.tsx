import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { X, Search } from "lucide-react";
import { DocumentFile, User } from "../../types";
import { getAllUsers } from "../../api/users";
import { updateDocumentSharing } from "../../api/documents";
import { useAuth } from "../../context/AuthContext";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";
import { Avatar } from "../ui/Avatar";

interface ShareDocumentModalProps {
  document: DocumentFile;
  onClose: () => void;
  onUpdated: (doc: DocumentFile) => void;
}

export const ShareDocumentModal: React.FC<ShareDocumentModalProps> = ({
  document,
  onClose,
  onUpdated,
}) => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>(document.sharedWith);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    getAllUsers()
      .then((all) => setUsers(all.filter((u) => u.id !== currentUser?.id)))
      .catch(() => toast.error("Could not load users"))
      .finally(() => setIsLoading(false));
  }, [currentUser?.id]);

  const filteredUsers = users.filter(
    (u) =>
      !searchQuery ||
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const toggle = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id],
    );
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const updated = await updateDocumentSharing(document.id, selectedIds);
      toast.success("Sharing updated");
      onUpdated(updated);
      onClose();
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            Share "{document.name}"
          </h3>
          <button onClick={onClose} aria-label="Close">
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        <Input
          placeholder="Search people..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          startAdornment={<Search size={16} />}
          fullWidth
        />

        <div className="flex-1 overflow-y-auto mt-3 space-y-1">
          {isLoading ? (
            <p className="text-sm text-gray-500 text-center py-6">
              Loading people...
            </p>
          ) : filteredUsers.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-6">
              No one found.
            </p>
          ) : (
            filteredUsers.map((u) => (
              <label
                key={u.id}
                className="flex items-center gap-3 px-2 py-2 rounded-md hover:bg-gray-50 cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={selectedIds.includes(u.id)}
                  onChange={() => toggle(u.id)}
                  className="rounded text-primary-600 focus:ring-primary-500"
                />
                <Avatar src={u.avatarUrl} alt={u.name} size="sm" />
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {u.name}
                  </p>
                  <p className="text-xs text-gray-500 truncate">{u.email}</p>
                </div>
              </label>
            ))
          )}
        </div>

        <div className="flex justify-end gap-2 mt-4 pt-4 border-t border-gray-200">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave} isLoading={isSaving}>
            Save
          </Button>
        </div>
      </div>
    </div>
  );
};
