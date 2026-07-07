import React from "react";
import { Phone, PhoneOff } from "lucide-react";
import { useCall } from "../../context/callContext";
import { Button } from "../ui/Button";

export const IncomingCallModal: React.FC = () => {
  const { incomingCall, acceptCall, rejectCall } = useCall();

  if (!incomingCall) return null;

  const { from, invitedCount } = incomingCall;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/40 px-4">
      <div className="bg-white rounded-xl shadow-xl max-w-sm w-full p-6 text-center animate-pulse-once">
        <div className="mx-auto h-20 w-20 rounded-full bg-primary-100 flex items-center justify-center text-2xl font-semibold text-primary-700">
          {from.name.charAt(0).toUpperCase()}
        </div>
        <h3 className="mt-4 text-lg font-semibold text-gray-900">
          {from.name}
        </h3>
        <p className="text-sm text-gray-500 mt-1">
          {invitedCount > 1
            ? `Incoming group video call (${invitedCount} invited)`
            : "Incoming video call"}
        </p>

        <div className="mt-6 flex justify-center gap-4">
          <Button
            variant="error"
            size="lg"
            leftIcon={<PhoneOff size={18} />}
            onClick={rejectCall}
          >
            Decline
          </Button>
          <Button
            variant="success"
            size="lg"
            leftIcon={<Phone size={18} />}
            onClick={acceptCall}
          >
            Accept
          </Button>
        </div>
      </div>
    </div>
  );
};
