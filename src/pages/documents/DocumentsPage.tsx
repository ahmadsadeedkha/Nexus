import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";
import {
  FileText,
  Upload,
  Download,
  Trash2,
  Share2,
  RefreshCw,
  PenLine,
  Eye,
} from "lucide-react";
import { Card, CardHeader, CardBody } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { Badge } from "../../components/ui/Badge";
import { useAuth } from "../../context/AuthContext";
import { DocumentFile, DocumentStatus } from "../../types";
import {
  getDocuments,
  deleteDocument,
  reuploadDocument,
  getFileUrl,
  DocumentScope,
} from "../../api/documents";
import { UploadDocumentModal } from "../../components/documents/UploadDocumentModal";
import { DocumentPreviewModal } from "../../components/documents/DocumentPreviewModal";
import { ShareDocumentModal } from "../../components/documents/ShareDocumentModal";
import { SignDocumentModal } from "../../components/documents/SignDocumentModal";

const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const statusBadge = (status: DocumentStatus) => {
  if (status === "signed")
    return (
      <Badge variant="success" size="sm">
        Signed
      </Badge>
    );
  if (status === "archived")
    return (
      <Badge variant="gray" size="sm">
        Archived
      </Badge>
    );
  return (
    <Badge variant="primary" size="sm">
      Uploaded
    </Badge>
  );
};

const TABS: { key: DocumentScope; label: string }[] = [
  { key: "all", label: "All Documents" },
  { key: "mine", label: "My Uploads" },
  { key: "shared", label: "Shared with Me" },
];

export const DocumentsPage: React.FC = () => {
  const { user } = useAuth();
  const [documents, setDocuments] = useState<DocumentFile[]>([]);
  const [scope, setScope] = useState<DocumentScope>("all");
  const [isLoading, setIsLoading] = useState(true);

  const [showUpload, setShowUpload] = useState(false);
  const [previewDoc, setPreviewDoc] = useState<DocumentFile | null>(null);
  const [shareDoc, setShareDoc] = useState<DocumentFile | null>(null);
  const [signDoc, setSignDoc] = useState<DocumentFile | null>(null);
  const [reuploadingId, setReuploadingId] = useState<string | null>(null);

  useEffect(() => {
    setIsLoading(true);
    getDocuments(scope)
      .then(setDocuments)
      .catch(() => toast.error("Could not load documents"))
      .finally(() => setIsLoading(false));
  }, [scope]);

  const upsertDocument = (doc: DocumentFile) => {
    setDocuments((prev) => {
      const exists = prev.some((d) => d.id === doc.id);
      return exists
        ? prev.map((d) => (d.id === doc.id ? doc : d))
        : [doc, ...prev];
    });
  };

  const handleDelete = async (doc: DocumentFile) => {
    if (!window.confirm(`Delete "${doc.name}"? This can't be undone.`)) return;
    try {
      await deleteDocument(doc.id);
      setDocuments((prev) => prev.filter((d) => d.id !== doc.id));
      toast.success("Document deleted");
    } catch (error) {
      toast.error((error as Error).message);
    }
  };

  const handleReuploadPick = (doc: DocumentFile) => {
    const input = window.document.createElement("input");
    input.type = "file";
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;
      setReuploadingId(doc.id);
      try {
        const updated = await reuploadDocument(doc.id, file);
        upsertDocument(updated);
        toast.success(`Uploaded version ${updated.version}`);
      } catch (error) {
        toast.error((error as Error).message);
      } finally {
        setReuploadingId(null);
      }
    };
    input.click();
  };

  const isOwner = (doc: DocumentFile) =>
    typeof doc.uploadedBy === "string"
      ? doc.uploadedBy === user?.id
      : doc.uploadedBy.id === user?.id;

  const uploaderName = (doc: DocumentFile) =>
    typeof doc.uploadedBy === "string" ? "Someone" : doc.uploadedBy.name;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Documents</h1>
          <p className="text-gray-600">
            Upload, preview, and sign your important files
          </p>
        </div>

        <Button
          leftIcon={<Upload size={18} />}
          onClick={() => setShowUpload(true)}
        >
          Upload Document
        </Button>
      </div>

      <div className="flex gap-2 border-b border-gray-200">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setScope(tab.key)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              scope === tab.key
                ? "border-primary-600 text-primary-700"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <Card>
        <CardHeader className="flex justify-between items-center">
          <h2 className="text-lg font-medium text-gray-900">
            {TABS.find((t) => t.key === scope)?.label}
          </h2>
        </CardHeader>
        <CardBody>
          {isLoading ? (
            <p className="text-center text-gray-500 py-12">
              Loading documents...
            </p>
          ) : documents.length === 0 ? (
            <p className="text-center text-gray-500 py-12">
              No documents here yet.
            </p>
          ) : (
            <div className="space-y-2">
              {documents.map((doc) => {
                const owner = isOwner(doc);
                return (
                  <div
                    key={doc.id}
                    className="flex items-center p-4 hover:bg-gray-50 rounded-lg transition-colors duration-200"
                  >
                    <div className="p-2 bg-primary-50 rounded-lg mr-4">
                      <FileText size={24} className="text-primary-600" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-sm font-medium text-gray-900 truncate">
                          {doc.name}
                        </h3>
                        <Badge variant="gray" size="sm">
                          v{doc.version}
                        </Badge>
                        {statusBadge(doc.status)}
                        {doc.sharedWith.length > 0 && (
                          <Badge variant="secondary" size="sm">
                            Shared
                          </Badge>
                        )}
                      </div>

                      <div className="flex items-center gap-3 mt-1 text-sm text-gray-500 flex-wrap">
                        <span>{formatFileSize(doc.fileSize)}</span>
                        <span>
                          Updated {new Date(doc.updatedAt).toLocaleDateString()}
                        </span>
                        {!owner && <span>Uploaded by {uploaderName(doc)}</span>}
                      </div>
                    </div>

                    <div className="flex items-center gap-1 ml-4">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="p-2"
                        aria-label="Preview"
                        onClick={() => setPreviewDoc(doc)}
                      >
                        <Eye size={18} />
                      </Button>

                      <a
                        href={getFileUrl(doc.fileUrl)}
                        download={doc.originalFileName}
                      >
                        <Button
                          variant="ghost"
                          size="sm"
                          className="p-2"
                          aria-label="Download"
                        >
                          <Download size={18} />
                        </Button>
                      </a>

                      {owner && (
                        <>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="p-2"
                            aria-label="Re-upload new version"
                            onClick={() => handleReuploadPick(doc)}
                            isLoading={reuploadingId === doc.id}
                          >
                            <RefreshCw size={18} />
                          </Button>

                          <Button
                            variant="ghost"
                            size="sm"
                            className="p-2"
                            aria-label="Sign"
                            onClick={() => setSignDoc(doc)}
                          >
                            <PenLine size={18} />
                          </Button>

                          <Button
                            variant="ghost"
                            size="sm"
                            className="p-2"
                            aria-label="Share"
                            onClick={() => setShareDoc(doc)}
                          >
                            <Share2 size={18} />
                          </Button>

                          <Button
                            variant="ghost"
                            size="sm"
                            className="p-2 text-error-600 hover:text-error-700"
                            aria-label="Delete"
                            onClick={() => handleDelete(doc)}
                          >
                            <Trash2 size={18} />
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardBody>
      </Card>

      {showUpload && (
        <UploadDocumentModal
          onClose={() => setShowUpload(false)}
          onUploaded={(doc) => upsertDocument(doc)}
        />
      )}

      {previewDoc && (
        <DocumentPreviewModal
          document={previewDoc}
          onClose={() => setPreviewDoc(null)}
        />
      )}

      {shareDoc && (
        <ShareDocumentModal
          document={shareDoc}
          onClose={() => setShareDoc(null)}
          onUpdated={(doc) => upsertDocument(doc)}
        />
      )}

      {signDoc && (
        <SignDocumentModal
          document={signDoc}
          onClose={() => setSignDoc(null)}
          onUpdated={(doc) => upsertDocument(doc)}
        />
      )}
    </div>
  );
};
