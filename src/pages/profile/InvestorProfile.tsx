import React from "react";
import { useParams, Link } from "react-router-dom";
import {
  MessageCircle,
  Building2,
  UserCircle,
  BarChart3,
  Briefcase,
} from "lucide-react";
import { Avatar } from "../../components/ui/Avatar";
import { Button } from "../../components/ui/Button";
import { Card, CardBody, CardHeader } from "../../components/ui/Card";
import { Badge } from "../../components/ui/Badge";
import { useAuth } from "../../context/AuthContext";
import { useUserProfile } from "../../hooks/useUserProfile";
import { Investor } from "../../types";

export const InvestorProfile: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user: currentUser } = useAuth();
  const { profileUser, isLoading, error } = useUserProfile(id);

  const investor = profileUser as Investor | null;

  if (isLoading) {
    return <div className="text-center py-12">Loading profile...</div>;
  }

  if (error || !investor || investor.role !== "investor") {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-900">Investor not found</h2>
        <p className="text-gray-600 mt-2">
          The investor profile you're looking for doesn't exist or has been
          removed.
        </p>
        <Link to="/dashboard/entrepreneur">
          <Button variant="outline" className="mt-4">
            Back to Dashboard
          </Button>
        </Link>
      </div>
    );
  }

  const isCurrentUser = currentUser?.id === investor.id;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Profile header */}
      <Card>
        <CardBody className="sm:flex sm:items-start sm:justify-between p-6">
          <div className="sm:flex sm:space-x-6">
            <Avatar
              src={investor.avatarUrl}
              alt={investor.name}
              size="xl"
              status={investor.isOnline ? "online" : "offline"}
              className="mx-auto sm:mx-0"
            />

            <div className="mt-4 sm:mt-0 text-center sm:text-left">
              <h1 className="text-2xl font-bold text-gray-900">
                {investor.name}
              </h1>
              <p className="text-gray-600 flex items-center justify-center sm:justify-start mt-1">
                <Building2 size={16} className="mr-1" />
                Investor • {investor.totalInvestments || 0} investments
              </p>

              <div className="flex flex-wrap gap-2 justify-center sm:justify-start mt-3">
                {investor.investmentStage?.map((stage, index) => (
                  <Badge key={index} variant="secondary" size="sm">
                    {stage}
                  </Badge>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-6 sm:mt-0 flex flex-col sm:flex-row gap-2 justify-center sm:justify-end">
            {!isCurrentUser && (
              <Link to={`/chat/${investor.id}`}>
                <Button leftIcon={<MessageCircle size={18} />}>Message</Button>
              </Link>
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
        {/* Main content */}
        <div className="lg:col-span-2 space-y-6">
          {/* About */}
          <Card>
            <CardHeader>
              <h2 className="text-lg font-medium text-gray-900">About</h2>
            </CardHeader>
            <CardBody>
              <p className="text-gray-700">
                {investor.bio || "No bio added yet."}
              </p>
            </CardBody>
          </Card>

          {/* Investment Interests */}
          {(investor.investmentInterests?.length > 0 ||
            investor.investmentStage?.length > 0) && (
            <Card>
              <CardHeader>
                <h2 className="text-lg font-medium text-gray-900">
                  Investment Interests
                </h2>
              </CardHeader>
              <CardBody>
                <div className="space-y-4">
                  {investor.investmentInterests?.length > 0 && (
                    <div>
                      <h3 className="text-md font-medium text-gray-900">
                        Industries
                      </h3>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {investor.investmentInterests.map((interest, index) => (
                          <Badge key={index} variant="primary" size="md">
                            {interest}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {investor.investmentStage?.length > 0 && (
                    <div>
                      <h3 className="text-md font-medium text-gray-900">
                        Investment Stages
                      </h3>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {investor.investmentStage.map((stage, index) => (
                          <Badge key={index} variant="secondary" size="md">
                            {stage}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </CardBody>
            </Card>
          )}

          {/* Portfolio Companies */}
          {investor.portfolioCompanies?.length > 0 && (
            <Card>
              <CardHeader className="flex justify-between items-center">
                <h2 className="text-lg font-medium text-gray-900">
                  Portfolio Companies
                </h2>
                <span className="text-sm text-gray-500">
                  {investor.portfolioCompanies.length} companies
                </span>
              </CardHeader>
              <CardBody>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {investor.portfolioCompanies.map((company, index) => (
                    <div
                      key={index}
                      className="flex items-center p-3 border border-gray-200 rounded-md"
                    >
                      <div className="p-3 bg-primary-50 rounded-md mr-3">
                        <Briefcase size={18} className="text-primary-700" />
                      </div>
                      <div>
                        <h3 className="text-sm font-medium text-gray-900">
                          {company}
                        </h3>
                      </div>
                    </div>
                  ))}
                </div>
              </CardBody>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {(investor.minimumInvestment || investor.maximumInvestment) && (
            <Card>
              <CardHeader>
                <h2 className="text-lg font-medium text-gray-900">
                  Investment Details
                </h2>
              </CardHeader>
              <CardBody>
                <div className="space-y-4">
                  <div>
                    <span className="text-sm text-gray-500">
                      Investment Range
                    </span>
                    <p className="text-lg font-semibold text-gray-900">
                      {investor.minimumInvestment || "—"} -{" "}
                      {investor.maximumInvestment || "—"}
                    </p>
                  </div>

                  <div>
                    <span className="text-sm text-gray-500">
                      Total Investments
                    </span>
                    <p className="text-md font-medium text-gray-900">
                      {investor.totalInvestments || 0} companies
                    </p>
                  </div>
                </div>
              </CardBody>
            </Card>
          )}

          <Card>
            <CardHeader>
              <h2 className="text-lg font-medium text-gray-900">
                Investment Stats
              </h2>
            </CardHeader>
            <CardBody>
              <div className="space-y-3">
                <div className="p-3 border border-gray-200 rounded-md bg-gray-50">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="text-sm font-medium text-gray-900">
                        Active Investments
                      </h3>
                      <p className="text-xl font-semibold text-primary-700 mt-1">
                        {investor.portfolioCompanies?.length || 0}
                      </p>
                    </div>
                    <BarChart3 size={24} className="text-primary-600" />
                  </div>
                </div>

                <div className="p-3 border border-gray-200 rounded-md bg-gray-50">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="text-sm font-medium text-gray-900">
                        Total Investments
                      </h3>
                      <p className="text-xl font-semibold text-primary-700 mt-1">
                        {investor.totalInvestments || 0}
                      </p>
                    </div>
                    <BarChart3 size={24} className="text-primary-600" />
                  </div>
                </div>
              </div>
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
};
