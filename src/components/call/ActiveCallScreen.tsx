import React from "react";
import { Mic, MicOff, Video, VideoOff, PhoneOff } from "lucide-react";
import { useCall } from "../../context/callContext";
import { VideoTile } from "./VideoTile";
import { useAuth } from "../../context/AuthContext";

const gridColsClass = (count: number): string => {
  if (count <= 1) return "grid-cols-1";
  if (count <= 2) return "grid-cols-1 sm:grid-cols-2";
  if (count <= 4) return "grid-cols-2";
  return "grid-cols-2 md:grid-cols-3";
};

export const ActiveCallScreen: React.FC = () => {
  const { user } = useAuth();
  const {
    callStatus,
    isInitiator,
    participants,
    localStream,
    isAudioEnabled,
    isVideoEnabled,
    toggleAudio,
    toggleVideo,
    endCall,
  } = useCall();

  if (callStatus !== "in-call" || !user) return null;

  const waitingForOthers = isInitiator && participants.length === 0;
  const tileCount = participants.length + 1;

  return (
    <div className="fixed inset-0 z-[60] bg-gray-950 flex flex-col">
      <div className="flex-1 overflow-y-auto p-4">
        {waitingForOthers ? (
          <div className="h-full flex flex-col items-center justify-center text-white">
            <div className="h-24 w-24 rounded-full bg-gray-800 flex items-center justify-center mb-4 animate-pulse">
              <Video size={32} className="text-gray-400" />
            </div>
            <p className="text-lg font-medium">Calling…</p>
            <p className="text-sm text-gray-400 mt-1">
              Waiting for others to join
            </p>
          </div>
        ) : (
          <div className={`grid ${gridColsClass(tileCount)} gap-3 h-full`}>
            <VideoTile
              stream={localStream ?? undefined}
              name={user.name}
              isLocal
              audioEnabled={isAudioEnabled}
              videoEnabled={isVideoEnabled}
            />
            {participants.map((p) => (
              <VideoTile
                key={p.id}
                stream={p.stream}
                name={p.name}
                audioEnabled={p.audioEnabled}
                videoEnabled={p.videoEnabled}
              />
            ))}
          </div>
        )}
      </div>

      <div className="flex items-center justify-center gap-4 py-5 bg-gray-900/80">
        <button
          onClick={toggleAudio}
          className={`h-12 w-12 rounded-full flex items-center justify-center transition-colors ${
            isAudioEnabled
              ? "bg-gray-700 hover:bg-gray-600"
              : "bg-error-500 hover:bg-error-600"
          }`}
          aria-label={isAudioEnabled ? "Mute microphone" : "Unmute microphone"}
        >
          {isAudioEnabled ? (
            <Mic size={20} className="text-white" />
          ) : (
            <MicOff size={20} className="text-white" />
          )}
        </button>

        <button
          onClick={toggleVideo}
          className={`h-12 w-12 rounded-full flex items-center justify-center transition-colors ${
            isVideoEnabled
              ? "bg-gray-700 hover:bg-gray-600"
              : "bg-error-500 hover:bg-error-600"
          }`}
          aria-label={isVideoEnabled ? "Turn camera off" : "Turn camera on"}
        >
          {isVideoEnabled ? (
            <Video size={20} className="text-white" />
          ) : (
            <VideoOff size={20} className="text-white" />
          )}
        </button>

        <button
          onClick={endCall}
          className="h-12 w-12 rounded-full bg-error-600 hover:bg-error-700 flex items-center justify-center"
          aria-label={waitingForOthers ? "Cancel call" : "Leave call"}
        >
          <PhoneOff size={20} className="text-white" />
        </button>
      </div>
    </div>
  );
};
