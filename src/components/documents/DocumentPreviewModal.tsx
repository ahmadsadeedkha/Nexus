import React, { useState } from "react";
import { Document as PdfDocument, Page as PdfPage, pdfjs } from "react-pdf";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";
import { X, ChevronLeft, ChevronRight, Download, FileText } from "lucide-react";
import { DocumentFile } from "../../types";
import { getFileUrl } from "../../api/documents";
import { Button } from "../ui/Button";

// Loaded from a CDN matching the installed pdfjs-dist version — the simplest
// reliable setup for a Vite app without extra bundler/worker configuration.
pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface DocumentPreviewModalProps {
  document: DocumentFile;
  onClose: () => void;
}

export const DocumentPreviewModal: React.FC<DocumentPreviewModalProps> = ({
  document,
  onClose,
}) => {
  const [numPages, setNumPages] = useState<number | null>(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [loadError, setLoadError] = useState(false);

  const fileUrl = getFileUrl(document.fileUrl);
  const isPdf = document.mimeType === "application/pdf";
  const isImage = document.mimeType.startsWith("image/");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 py-8">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-3xl max-h-full flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 truncate">
            {document.name}
          </h3>
          <div className="flex items-center gap-3">
            <a href={fileUrl} download={document.originalFileName}>
              <Button
                variant="ghost"
                size="sm"
                leftIcon={<Download size={16} />}
              >
                Download
              </Button>
            </a>
            <button onClick={onClose} aria-label="Close">
              <X size={20} className="text-gray-500" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-auto bg-gray-100 flex items-center justify-center p-4">
          {isPdf && !loadError && (
            <PdfDocument
              file={fileUrl}
              onLoadSuccess={({ numPages: n }) => setNumPages(n)}
              onLoadError={() => setLoadError(true)}
              loading={
                <p className="text-gray-500 text-sm">Loading preview...</p>
              }
            >
              <PdfPage pageNumber={pageNumber} width={640} />
            </PdfDocument>
          )}

          {isImage && (
            <img
              src={fileUrl}
              alt={document.name}
              className="max-w-full max-h-full object-contain"
            />
          )}

          {(!isPdf && !isImage) || loadError ? (
            <div className="text-center py-12">
              <FileText size={40} className="mx-auto text-gray-400 mb-3" />
              <p className="text-gray-600 font-medium">
                Preview not available for this file type
              </p>
              <p className="text-sm text-gray-500 mt-1">
                Download it to view the full content.
              </p>
            </div>
          ) : null}
        </div>

        {isPdf && !loadError && numPages && numPages > 1 && (
          <div className="flex items-center justify-center gap-4 px-5 py-3 border-t border-gray-200">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setPageNumber((p) => Math.max(1, p - 1))}
              disabled={pageNumber <= 1}
              leftIcon={<ChevronLeft size={16} />}
            >
              Prev
            </Button>
            <span className="text-sm text-gray-600">
              Page {pageNumber} of {numPages}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setPageNumber((p) => Math.min(numPages, p + 1))}
              disabled={pageNumber >= numPages}
              rightIcon={<ChevronRight size={16} />}
            >
              Next
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};
