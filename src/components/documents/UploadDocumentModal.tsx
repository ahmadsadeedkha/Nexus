import React, { useCallback, useState } from "react";
import { useDropzone, FileRejection } from "react-dropzone";
import toast from "react-hot-toast";
import { X, UploadCloud, FileText } from "lucide-react";
import { uploadDocument } from "../../api/documents";
import { DocumentFile } from "../../types";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";

interface UploadDocumentModalProps {
  onClose: () => void;
  onUploaded: (doc: DocumentFile) => void;
}

const ACCEPTED_TYPES = {
  "application/pdf": [".pdf"],
  "application/msword": [".doc"],
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [
    ".docx",
  ],
  "application/vnd.ms-excel": [".xls"],
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [
    ".xlsx",
  ],
  "application/vnd.ms-powerpoint": [".ppt"],
  "application/vnd.openxmlformats-officedocument.presentationml.presentation": [
    ".pptx",
  ],
  "image/png": [".png"],
  "image/jpeg": [".jpg", ".jpeg"],
};

export const UploadDocumentModal: React.FC<UploadDocumentModalProps> = ({
  onClose,
  onUploaded,
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [name, setName] = useState("");
  const [isUploading, setIsUploading] = useState(false);

  const onDrop = useCallback(
    (acceptedFiles: File[], rejectedFiles: FileRejection[]) => {
      if (rejectedFiles.length > 0) {
        toast.error(rejectedFiles[0].errors[0]?.message || "File not accepted");
        return;
      }
      const dropped = acceptedFiles[0];
      if (dropped) {
        setFile(dropped);
        setName((prev) => prev || dropped.name);
      }
    },
    [],
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: ACCEPTED_TYPES,
    maxFiles: 1,
    maxSize: 20 * 1024 * 1024,
  });

  const handleUpload = async () => {
    if (!file) return;
    setIsUploading(true);
    try {
      const doc = await uploadDocument(file, name);
      toast.success("Document uploaded");
      onUploaded(doc);
      onClose();
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="bg-white rounded-xl shadow-xl max-w-lg w-full p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            Upload Document
          </h3>
          <button onClick={onClose} aria-label="Close">
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
            isDragActive
              ? "border-primary-500 bg-primary-50"
              : "border-gray-300 hover:bg-gray-50"
          }`}
        >
          <input {...getInputProps()} />
          {file ? (
            <div className="flex flex-col items-center text-gray-700">
              <FileText size={32} className="text-primary-600 mb-2" />
              <p className="text-sm font-medium">{file.name}</p>
              <p className="text-xs text-gray-500">
                {(file.size / 1024 / 1024).toFixed(2)} MB
              </p>
            </div>
          ) : (
            <div className="flex flex-col items-center text-gray-500">
              <UploadCloud size={32} className="mb-2" />
              <p className="text-sm">
                {isDragActive
                  ? "Drop the file here"
                  : "Drag & drop a file, or click to browse"}
              </p>
              <p className="text-xs mt-1">
                PDF, Word, Excel, PowerPoint, or image · up to 20MB
              </p>
            </div>
          )}
        </div>

        {file && (
          <Input
            label="Document name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-4"
            fullWidth
          />
        )}

        <div className="flex justify-end gap-2 mt-6">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={handleUpload}
            disabled={!file}
            isLoading={isUploading}
          >
            Upload
          </Button>
        </div>
      </div>
    </div>
  );
};
