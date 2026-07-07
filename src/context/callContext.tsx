import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import toast from "react-hot-toast";
import {
  connectSocket,
  disconnectSocket,
  getSocket,
} from "../socket/socketClient";
import { useAuth } from "./AuthContext";

// Public STUN only (per project decision) — good enough for most home/office
// networks. Calls across strict corporate NATs/firewalls may fail to connect;
// that's a known limitation without a TURN server.
const ICE_SERVERS: RTCIceServer[] = [
  { urls: ["stun:stun.l.google.com:19302", "stun:stun1.l.google.com:19302"] },
];

export interface CallPeerInfo {
  id: string;
  name: string;
  role: string;
}

export interface CallParticipant extends CallPeerInfo {
  stream?: MediaStream;
  audioEnabled: boolean;
  videoEnabled: boolean;
}

export interface IncomingCallInfo {
  roomId: string;
  from: CallPeerInfo;
  invitedCount: number;
}

type CallStatus = "idle" | "in-call";

interface CallContextType {
  callStatus: CallStatus;
  isInitiator: boolean;
  incomingCall: IncomingCallInfo | null;
  participants: CallParticipant[];
  localStream: MediaStream | null;
  isAudioEnabled: boolean;
  isVideoEnabled: boolean;
  onlineUserIds: Set<string>;
  startCall: (toUserIds: string[]) => Promise<void>;
  acceptCall: () => Promise<void>;
  rejectCall: () => void;
  endCall: () => void;
  toggleAudio: () => void;
  toggleVideo: () => void;
}

const CallContext = createContext<CallContextType | undefined>(undefined);

const CALL_EVENTS = [
  "call:incoming",
  "call:invite-sent",
  "call:rejected",
  "call:cancelled",
  "call:error",
  "call:room-peers",
  "call:peer-joined",
  "call:peer-left",
  "call:media-toggle",
  "webrtc:offer",
  "webrtc:answer",
  "webrtc:ice-candidate",
] as const;

export const CallProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { user, isAuthenticated } = useAuth();

  const [callStatus, setCallStatus] = useState<CallStatus>("idle");
  const [isInitiator, setIsInitiator] = useState(false);
  const [incomingCall, setIncomingCall] = useState<IncomingCallInfo | null>(
    null,
  );
  const [participants, setParticipants] = useState<CallParticipant[]>([]);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [onlineUserIds, setOnlineUserIds] = useState<Set<string>>(new Set());

  // Refs mirror the state above so socket handlers (registered once) always
  // see current values instead of a stale closure from the render they were
  // created in.
  const callStatusRef = useRef<CallStatus>("idle");
  const incomingCallRef = useRef<IncomingCallInfo | null>(null);
  const roomIdRef = useRef<string | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const peerConnectionsRef = useRef<Map<string, RTCPeerConnection>>(new Map());
  const pendingCandidatesRef = useRef<Map<string, RTCIceCandidateInit[]>>(
    new Map(),
  );

  useEffect(() => {
    callStatusRef.current = callStatus;
  }, [callStatus]);
  useEffect(() => {
    incomingCallRef.current = incomingCall;
  }, [incomingCall]);

  // ---------------------------------------------------------------------
  // WebRTC helpers
  // ---------------------------------------------------------------------

  const createPeerConnection = useCallback(
    (peerId: string): RTCPeerConnection => {
      const existing = peerConnectionsRef.current.get(peerId);
      if (existing) return existing;

      const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });

      localStreamRef.current?.getTracks().forEach((track) => {
        pc.addTrack(track, localStreamRef.current as MediaStream);
      });

      pc.ontrack = (event) => {
        setParticipants((prev) =>
          prev.map((p) =>
            p.id === peerId ? { ...p, stream: event.streams[0] } : p,
          ),
        );
      };

      pc.onicecandidate = (event) => {
        if (event.candidate) {
          getSocket()?.emit("webrtc:ice-candidate", {
            roomId: roomIdRef.current,
            toUserId: peerId,
            candidate: event.candidate,
          });
        }
      };

      peerConnectionsRef.current.set(peerId, pc);
      return pc;
    },
    [],
  );

  const closePeerConnection = useCallback((peerId: string) => {
    peerConnectionsRef.current.get(peerId)?.close();
    peerConnectionsRef.current.delete(peerId);
    pendingCandidatesRef.current.delete(peerId);
  }, []);

  const addParticipant = useCallback((peer: CallPeerInfo) => {
    setParticipants((prev) =>
      prev.some((p) => p.id === peer.id)
        ? prev
        : [...prev, { ...peer, audioEnabled: true, videoEnabled: true }],
    );
  }, []);

  const removeParticipant = useCallback(
    (peerId: string) => {
      setParticipants((prev) => prev.filter((p) => p.id !== peerId));
      closePeerConnection(peerId);
    },
    [closePeerConnection],
  );

  const flushPendingCandidates = useCallback(
    async (pc: RTCPeerConnection, peerId: string) => {
      const queued = pendingCandidatesRef.current.get(peerId);
      if (!queued) return;
      for (const candidate of queued) {
        await pc.addIceCandidate(candidate).catch((err) => console.error(err));
      }
      pendingCandidatesRef.current.delete(peerId);
    },
    [],
  );

  const teardownCall = useCallback(() => {
    peerConnectionsRef.current.forEach((pc) => pc.close());
    peerConnectionsRef.current.clear();
    pendingCandidatesRef.current.clear();
    localStreamRef.current?.getTracks().forEach((track) => track.stop());
    localStreamRef.current = null;
    roomIdRef.current = null;

    setLocalStream(null);
    setParticipants([]);
    setCallStatus("idle");
    setIsInitiator(false);
    setIncomingCall(null);
    setIsAudioEnabled(true);
    setIsVideoEnabled(true);
  }, []);

  const getLocalMedia = useCallback(async (): Promise<MediaStream> => {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: true,
    });
    localStreamRef.current = stream;
    setLocalStream(stream);
    return stream;
  }, []);

  // ---------------------------------------------------------------------
  // Socket connection lifecycle, tied to auth
  // ---------------------------------------------------------------------

  useEffect(() => {
    if (!isAuthenticated) {
      disconnectSocket();
      return;
    }

    const token = localStorage.getItem("business_nexus_token");
    if (!token) return;

    const socket = connectSocket(token);

    socket.on("presence:online", ({ userId }: { userId: string }) => {
      setOnlineUserIds((prev) => new Set(prev).add(userId));
    });
    socket.on("presence:offline", ({ userId }: { userId: string }) => {
      setOnlineUserIds((prev) => {
        const next = new Set(prev);
        next.delete(userId);
        return next;
      });
    });

    socket.on("call:incoming", (payload: IncomingCallInfo) => {
      if (callStatusRef.current !== "idle") {
        // Already on a call — automatically decline (busy).
        socket.emit("call:reject", { roomId: payload.roomId });
        return;
      }
      setIncomingCall(payload);
    });

    socket.on(
      "call:invite-sent",
      (payload: {
        roomId: string;
        reached: string[];
        unavailable: string[];
      }) => {
        roomIdRef.current = payload.roomId;
        if (payload.unavailable.length > 0) {
          toast.error(
            `${payload.unavailable.length} participant(s) are offline and weren't reached`,
          );
        }
      },
    );

    socket.on("call:rejected", (payload: { by: { name: string } }) => {
      toast(`${payload.by.name} declined the call`);
    });

    socket.on("call:cancelled", (payload: { roomId: string }) => {
      if (incomingCallRef.current?.roomId === payload.roomId) {
        setIncomingCall(null);
        toast("The call was cancelled");
      }
    });

    socket.on("call:error", (payload: { message: string }) => {
      toast.error(payload.message);
    });

    socket.on(
      "call:room-peers",
      async (payload: { roomId: string; peers: CallPeerInfo[] }) => {
        if (payload.roomId !== roomIdRef.current) return;
        setCallStatus("in-call");
        for (const peer of payload.peers) {
          addParticipant(peer);
          const pc = createPeerConnection(peer.id);
          try {
            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);
            socket.emit("webrtc:offer", {
              roomId: payload.roomId,
              toUserId: peer.id,
              sdp: offer,
            });
          } catch (err) {
            console.error("Failed to create offer for", peer.id, err);
          }
        }
      },
    );

    socket.on(
      "call:peer-joined",
      (payload: { roomId: string; peer: CallPeerInfo }) => {
        if (payload.roomId !== roomIdRef.current) return;
        addParticipant(payload.peer);
      },
    );

    socket.on(
      "call:peer-left",
      (payload: { roomId: string; peerId: string }) => {
        if (payload.roomId !== roomIdRef.current) return;
        removeParticipant(payload.peerId);
      },
    );

    socket.on(
      "call:media-toggle",
      (payload: {
        roomId: string;
        userId: string;
        kind: "audio" | "video";
        enabled: boolean;
      }) => {
        if (payload.roomId !== roomIdRef.current) return;
        const field =
          payload.kind === "audio" ? "audioEnabled" : "videoEnabled";
        setParticipants((prev) =>
          prev.map((p) =>
            p.id === payload.userId ? { ...p, [field]: payload.enabled } : p,
          ),
        );
      },
    );

    socket.on(
      "webrtc:offer",
      async (payload: {
        roomId: string;
        fromUserId: string;
        sdp: RTCSessionDescriptionInit;
      }) => {
        if (payload.roomId !== roomIdRef.current) return;
        const pc = createPeerConnection(payload.fromUserId);
        await pc.setRemoteDescription(new RTCSessionDescription(payload.sdp));
        await flushPendingCandidates(pc, payload.fromUserId);
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        socket.emit("webrtc:answer", {
          roomId: payload.roomId,
          toUserId: payload.fromUserId,
          sdp: answer,
        });
      },
    );

    socket.on(
      "webrtc:answer",
      async (payload: {
        roomId: string;
        fromUserId: string;
        sdp: RTCSessionDescriptionInit;
      }) => {
        if (payload.roomId !== roomIdRef.current) return;
        const pc = peerConnectionsRef.current.get(payload.fromUserId);
        if (!pc) return;
        await pc.setRemoteDescription(new RTCSessionDescription(payload.sdp));
        await flushPendingCandidates(pc, payload.fromUserId);
      },
    );

    socket.on(
      "webrtc:ice-candidate",
      async (payload: {
        roomId: string;
        fromUserId: string;
        candidate: RTCIceCandidateInit;
      }) => {
        if (payload.roomId !== roomIdRef.current) return;
        const pc = peerConnectionsRef.current.get(payload.fromUserId);
        if (pc && pc.remoteDescription) {
          await pc
            .addIceCandidate(payload.candidate)
            .catch((err) => console.error(err));
        } else {
          const queue =
            pendingCandidatesRef.current.get(payload.fromUserId) || [];
          queue.push(payload.candidate);
          pendingCandidatesRef.current.set(payload.fromUserId, queue);
        }
      },
    );

    return () => {
      socket.off("presence:online");
      socket.off("presence:offline");
      CALL_EVENTS.forEach((event) => socket.off(event));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]);

  useEffect(() => {
    return () => {
      disconnectSocket();
    };
  }, []);

  // ---------------------------------------------------------------------
  // Public actions
  // ---------------------------------------------------------------------

  const startCall = useCallback(
    async (toUserIds: string[]) => {
      const socket = getSocket();
      if (!socket || !user) return;
      try {
        await getLocalMedia();
        setIsInitiator(true);
        setCallStatus("in-call");
        socket.emit("call:invite", { toUserIds });
      } catch (err) {
        console.error(err);
        toast.error("Could not access camera/microphone");
        teardownCall();
      }
    },
    [user, getLocalMedia, teardownCall],
  );

  const acceptCall = useCallback(async () => {
    const socket = getSocket();
    if (!socket || !incomingCall) return;
    const roomId = incomingCall.roomId;
    try {
      await getLocalMedia();
      roomIdRef.current = roomId;
      setIsInitiator(false);
      setIncomingCall(null);
      socket.emit("call:accept", { roomId });
    } catch (err) {
      console.error(err);
      toast.error("Could not access camera/microphone");
    }
  }, [incomingCall, getLocalMedia]);

  const rejectCall = useCallback(() => {
    const socket = getSocket();
    if (!socket || !incomingCall) return;
    socket.emit("call:reject", { roomId: incomingCall.roomId });
    setIncomingCall(null);
  }, [incomingCall]);

  const endCall = useCallback(() => {
    const socket = getSocket();
    if (roomIdRef.current) {
      socket?.emit("call:leave", { roomId: roomIdRef.current });
    }
    teardownCall();
  }, [teardownCall]);

  const toggleAudio = useCallback(() => {
    const track = localStreamRef.current?.getAudioTracks()[0];
    if (!track) return;
    track.enabled = !track.enabled;
    setIsAudioEnabled(track.enabled);
    getSocket()?.emit("call:media-toggle", {
      roomId: roomIdRef.current,
      kind: "audio",
      enabled: track.enabled,
    });
  }, []);

  const toggleVideo = useCallback(() => {
    const track = localStreamRef.current?.getVideoTracks()[0];
    if (!track) return;
    track.enabled = !track.enabled;
    setIsVideoEnabled(track.enabled);
    getSocket()?.emit("call:media-toggle", {
      roomId: roomIdRef.current,
      kind: "video",
      enabled: track.enabled,
    });
  }, []);

  const value: CallContextType = {
    callStatus,
    isInitiator,
    incomingCall,
    participants,
    localStream,
    isAudioEnabled,
    isVideoEnabled,
    onlineUserIds,
    startCall,
    acceptCall,
    rejectCall,
    endCall,
    toggleAudio,
    toggleVideo,
  };

  return <CallContext.Provider value={value}>{children}</CallContext.Provider>;
};

export const useCall = (): CallContextType => {
  const context = useContext(CallContext);
  if (context === undefined) {
    throw new Error("useCall must be used within a CallProvider");
  }
  return context;
};
