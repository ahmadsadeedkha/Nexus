import React, { useEffect, useRef, useState } from "react";
import { Button } from "../ui/Button";

interface SignaturePadProps {
  onSave: (blob: Blob) => void;
  onCancel: () => void;
  isSaving?: boolean;
}

const getPoint = (
  canvas: HTMLCanvasElement,
  event: React.MouseEvent | React.TouchEvent,
): { x: number; y: number } => {
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;

  if ("touches" in event) {
    const touch = event.touches[0];
    return {
      x: (touch.clientX - rect.left) * scaleX,
      y: (touch.clientY - rect.top) * scaleY,
    };
  }
  return {
    x: (event.clientX - rect.left) * scaleX,
    y: (event.clientY - rect.top) * scaleY,
  };
};

export const SignaturePad: React.FC<SignaturePadProps> = ({
  onSave,
  onCancel,
  isSaving,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDrawingRef = useRef(false);
  const hasDrawnRef = useRef(false);
  const [isEmpty, setIsEmpty] = useState(true);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.lineWidth = 2.5;
    ctx.lineCap = "round";
    ctx.strokeStyle = "#1f2937";
  }, []);

  const startDrawing = (event: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    isDrawingRef.current = true;
    const { x, y } = getPoint(canvas, event);
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (event: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawingRef.current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    event.preventDefault();
    const { x, y } = getPoint(canvas, event);
    ctx.lineTo(x, y);
    ctx.stroke();
    hasDrawnRef.current = true;
    setIsEmpty(false);
  };

  const stopDrawing = () => {
    isDrawingRef.current = false;
  };

  const handleClear = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    hasDrawnRef.current = false;
    setIsEmpty(true);
  };

  const handleSave = () => {
    const canvas = canvasRef.current;
    if (!canvas || !hasDrawnRef.current) return;
    canvas.toBlob((blob) => {
      if (blob) onSave(blob);
    }, "image/png");
  };

  return (
    <div>
      <p className="text-sm text-gray-600 mb-2">Draw your signature below</p>
      <canvas
        ref={canvasRef}
        width={500}
        height={200}
        className="w-full border-2 border-dashed border-gray-300 rounded-md bg-white cursor-crosshair touch-none"
        onMouseDown={startDrawing}
        onMouseMove={draw}
        onMouseUp={stopDrawing}
        onMouseLeave={stopDrawing}
        onTouchStart={startDrawing}
        onTouchMove={draw}
        onTouchEnd={stopDrawing}
      />
      <div className="flex justify-between items-center mt-4">
        <Button
          variant="outline"
          size="sm"
          onClick={handleClear}
          disabled={isEmpty}
        >
          Clear
        </Button>
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={onCancel}>
            Cancel
          </Button>
          <Button
            size="sm"
            onClick={handleSave}
            disabled={isEmpty}
            isLoading={isSaving}
          >
            Save Signature
          </Button>
        </div>
      </div>
    </div>
  );
};
