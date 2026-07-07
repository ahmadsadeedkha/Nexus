import React, { useEffect, useRef } from "react";
import { MicOff, VideoOff } from "lucide-react";

interface VideoTileProps {
  stream?: MediaStream;
  name: string;
  isLocal?: boolean;
  audioEnabled: boolean;
  videoEnabled: boolean;
}

export const VideoTile: React.FC<VideoTileProps> = ({
  stream,
  name,
  isLocal = false,
  audioEnabled,
  videoEnabled,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  return (
    <div className="relative bg-gray-900 rounded-lg overflow-hidden aspect-video flex items-center justify-center">
      {stream && videoEnabled ? (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted={isLocal}
          className={`w-full h-full object-cover ${isLocal ? "-scale-x-100" : ""}`}
        />
      ) : (
        <div className="flex flex-col items-center justify-center text-gray-400">
          <div className="h-16 w-16 rounded-full bg-gray-700 flex items-center justify-center text-xl font-semibold text-white">
            {name.charAt(0).toUpperCase()}
          </div>
          <span className="mt-2 text-sm">
            {videoEnabled ? "Connecting…" : "Camera off"}
          </span>
        </div>
      )}

      <div className="absolute bottom-2 left-2 flex items-center gap-1.5 bg-black/50 rounded px-2 py-1">
        <span className="text-xs text-white font-medium">
          {isLocal ? "You" : name}
        </span>
        {!audioEnabled && <MicOff size={12} className="text-error-400" />}
        {!videoEnabled && <VideoOff size={12} className="text-error-400" />}
      </div>
    </div>
  );
};
