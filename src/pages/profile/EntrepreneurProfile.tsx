import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import {
  MessageCircle,
  Users,
  Calendar,
  Building2,
  MapPin,
  UserCircle,
  FileText,
  DollarSign,
  Send,
} from "lucide-react";
import { Avatar } from "../../components/ui/Avatar";
import { Button } from "../../components/ui/Button";
import { Card, CardBody, CardHeader } from "../../components/ui/Card";
import { Badge } from "../../components/ui/Badge";
import { useAuth } from "../../context/AuthContext";
import { useUserProfile } from "../../hooks/useUserProfile";
import {
  createCollaborationRequest,
  getRequestsFromInvestor,
} from "../../api/collaborationRequests";
import { Entrepreneur, CollaborationRequest } from "../../types";
import toast from "react-hot-toast";

export const EntrepreneurProfile: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user: currentUser } = useAuth();
  const { profileUser, isLoading, error } = useUserProfile(id);

  const entrepreneur = profileUser as Entrepreneur | null;
  const isInvestor = currentUser?.role === "investor";

  const [hasRequestedCollaboration, setHasRequestedCollaboration] =
    useState(false);
  const [isSendingRequest, setIsSendingRequest] = useState(false);
  const [checkingRequests, setCheckingRequests] = useState(true);

  // Check if current investor already sent a request to this entrepreneur
  useEffect(() => {
    if (isInvestor && currentUser && id) {
      getRequestsFromInvestor(currentUser.id)
        .then((requests: CollaborationRequest[]) => {
          const alreadySent = requests.some((req) => req.entrepreneurId === id);
          setHasRequestedCollaboration(alreadySent);
        })
        .catch(() => {
          // silently fail — non-critical for page load
        })
        .finally(() => setCheckingRequests(false));
    } else {
      setCheckingRequests(false);
    }
  }, [isInvestor, currentUser, id]);

  const handleSendRequest = async () => {
    if (!isInvestor || !currentUser || !id || !entrepreneur) return;

    setIsSendingRequest(true);
    try {
      await createCollaborationRequest(
        id,
        `I'm interested in learning more about ${entrepreneur.startupName} and would like to explore potential investment opportunities.`,
      );
      setHasRequestedCollaboration(true);
      toast.success("Collaboration request sent!");
    } catch (err) {
      toast.error((err as Error).message || "Failed to send request");
    } finally {
      setIsSendingRequest(false);
    }
  };

  if (isLoading) {
    return <div className="text-center py-12">Loading profile...</div>;
  }

  if (error || !entrepreneur || entrepreneur.role !== "entrepreneur") {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-900">
          Entrepreneur not found
        </h2>
        <p className="text-gray-600 mt-2">
          The entrepreneur profile you're looking for doesn't exist or has been
          removed.
        </p>
        <Link to="/dashboard/investor">
          <Button variant="outline" className="mt-4">
            Back to Dashboard
          </Button>
        </Link>
      </div>
    );
  }

  const isCurrentUser = currentUser?.id === entrepreneur.id;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Profile header */}
      <Card>
        <CardBody className="sm:flex sm:items-start sm:justify-between p-6">
          <div className="sm:flex sm:space-x-6">
            <Avatar
              src={entrepreneur.avatarUrl}
              alt={entrepreneur.name}
              size="xl"
              status={entrepreneur.isOnline ? "online" : "offline"}
              className="mx-auto sm:mx-0"
            />

            <div className="mt-4 sm:mt-0 text-center sm:text-left">
              <h1 className="text-2xl font-bold text-gray-900">
                {entrepreneur.name}
              </h1>
              <p className="text-gray-600 flex items-center justify-center sm:justify-start mt-1">
                <Building2 size={16} className="mr-1" />
                Founder at {entrepreneur.startupName || "Not specified"}
              </p>

              <div className="flex flex-wrap gap-2 justify-center sm:justify-start mt-3">
                {entrepreneur.industry && (
                  <Badge variant="primary">{entrepreneur.industry}</Badge>
                )}
                {entrepreneur.location && (
                  <Badge variant="gray">
                    <MapPin size={14} className="mr-1" />
                    {entrepreneur.location}
                  </Badge>
                )}
                {entrepreneur.foundedYear && (
                  <Badge variant="accent">
                    <Calendar size={14} className="mr-1" />
                    Founded {entrepreneur.foundedYear}
                  </Badge>
                )}
                {entrepreneur.teamSize ? (
                  <Badge variant="secondary">
                    <Users size={14} className="mr-1" />
                    {entrepreneur.teamSize} team members
                  </Badge>
                ) : null}
              </div>
            </div>
          </div>

          <div className="mt-6 sm:mt-0 flex flex-col sm:flex-row gap-2 justify-center sm:justify-end">
            {!isCurrentUser && (
              <>
                <Link to={`/chat/${entrepreneur.id}`}>
                  <Button
                    variant="outline"
                    leftIcon={<MessageCircle size={18} />}
                  >
                    Message
                  </Button>
                </Link>

                {isInvestor && (
                  <Button
                    leftIcon={<Send size={18} />}
                    disabled={
                      hasRequestedCollaboration ||
                      isSendingRequest ||
                      checkingRequests
                    }
                    isLoading={isSendingRequest}
                    onClick={handleSendRequest}
                  >
                    {hasRequestedCollaboration
                      ? "Request Sent"
                      : "Request Collaboration"}
                  </Button>
                )}
              </>
            )}

            {isCurrentUser && (
              <Link to="/profile/edit">
                <Button variant="outline" leftIcon={<UserCircle size={18} />}>
                  Edit Profile
                </Button>
              </Link>
            )}
          </div>
        </CardBody>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main content - left side */}
        <div className="lg:col-span-2 space-y-6">
          {/* About */}
          <Card>
            <CardHeader>
              <h2 className="text-lg font-medium text-gray-900">About</h2>
            </CardHeader>
            <CardBody>
              <p className="text-gray-700">
                {entrepreneur.bio || "No bio added yet."}
              </p>
            </CardBody>
          </Card>

          {/* Startup Description */}
          {entrepreneur.pitchSummary && (
            <Card>
              <CardHeader>
                <h2 className="text-lg font-medium text-gray-900">
                  Startup Overview
                </h2>
              </CardHeader>
              <CardBody>
                <div className="space-y-4">
                  <div>
                    <h3 className="text-md font-medium text-gray-900">
                      Pitch Summary
                    </h3>
                    <p className="text-gray-700 mt-1">
                      {entrepreneur.pitchSummary}
                    </p>
                  </div>
                </div>
              </CardBody>
            </Card>
          )}
        </div>

        {/* Sidebar - right side */}
        <div className="space-y-6">
          {/* Funding Details */}
          {entrepreneur.fundingNeeded && (
            <Card>
              <CardHeader>
                <h2 className="text-lg font-medium text-gray-900">Funding</h2>
              </CardHeader>
              <CardBody>
                <div>
                  <span className="text-sm text-gray-500">Current Round</span>
                  <div className="flex items-center mt-1">
                    <DollarSign size={18} className="text-accent-600 mr-1" />
                    <p className="text-lg font-semibold text-gray-900">
                      {entrepreneur.fundingNeeded}
                    </p>
                  </div>
                </div>
              </CardBody>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};
