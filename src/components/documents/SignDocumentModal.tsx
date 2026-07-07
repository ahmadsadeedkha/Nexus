import React, { useState } from "react";
import toast from "react-hot-toast";
import { X } from "lucide-react";
import { DocumentFile } from "../../types";
import {
  attachSignature,
  removeSignature,
  getFileUrl,
} from "../../api/documents";
import { Button } from "../ui/Button";
import { SignaturePad } from "./SignaturePad";

interface SignDocumentModalProps {
  document: DocumentFile;
  onClose: () => void;
  onUpdated: (doc: DocumentFile) => void;
}

export const SignDocumentModal: React.FC<SignDocumentModalProps> = ({
  document,
  onClose,
  onUpdated,
}) => {
  const [isSaving, setIsSaving] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);
  const [isRedrawing, setIsRedrawing] = useState(false);

  const handleSave = async (blob: Blob) => {
    setIsSaving(true);
    try {
      const updated = await attachSignature(document.id, blob);
      toast.success("Signature attached");
      onUpdated(updated);
      onClose();
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleRemove = async () => {
    setIsRemoving(true);
    try {
      const updated = await removeSignature(document.id);
      toast.success("Signature removed");
      onUpdated(updated);
      onClose();
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setIsRemoving(false);
    }
  };

  const showPad = !document.signature || isRedrawing;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="bg-white rounded-xl shadow-xl max-w-lg w-full p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            Sign "{document.name}"
          </h3>
          <button onClick={onClose} aria-label="Close">
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        {showPad ? (
          <SignaturePad
            onSave={handleSave}
            onCancel={() => (isRedrawing ? setIsRedrawing(false) : onClose())}
            isSaving={isSaving}
          />
        ) : (
          <div>
            <p className="text-sm text-gray-600 mb-2">Current signature</p>
            <div className="border border-gray-200 rounded-md p-4 bg-gray-50 flex justify-center">
              <img
                src={getFileUrl(document.signature!.imageUrl)}
                alt="Signature"
                className="max-h-32"
              />
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Signed {new Date(document.signature!.signedAt).toLocaleString()}
            </p>
            <div className="flex justify-between items-center mt-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsRedrawing(true)}
              >
                Sign again
              </Button>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={onClose}>
                  Close
                </Button>
                <Button
                  variant="error"
                  size="sm"
                  onClick={handleRemove}
                  isLoading={isRemoving}
                >
                  Remove signature
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
