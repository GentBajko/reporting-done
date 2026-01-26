import React, { useEffect, useState } from "react";
import {
  HiOutlineBriefcase,
  HiOutlineCalendar,
  HiOutlineClipboardList,
  HiOutlineDocumentText,
  HiOutlineExternalLink,
  HiOutlineUsers,
  HiPlus,
} from "react-icons/hi";
import { Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { useApi } from "../hooks/useApi";

interface DashboardSummaryData {
  active_projects_count: number;
  pending_tasks_count: number;
  recent_logs_count: number;
  is_admin_user: boolean;
}

interface SummaryProject {
  id: string;
  name: string;
  archived: boolean;
}

interface SummaryTask {
  id: string;
  title: string;
  status: string | null;
}

interface SummaryLog {
  id: string;
  created_at: number;
}

const StatCard = ({
  title,
  value,
  icon: Icon,
  bgColor = "bg-blue-500",
  linkTo,
  isLoading = false,
}: {
  title: string;
  value: string | number;
  icon: React.ElementType;
  bgColor?: string;
  linkTo?: string;
  isLoading?: boolean;
}) => {
  const content = (
    <div
      className={`p-8 rounded-xl shadow-lg text-white ${bgColor} flex flex-col justify-between h-full min-h-[280px]`}
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-semibold">{title}</h3>
        <Icon className="h-10 w-10 opacity-80" />
      </div>
      {isLoading ? (
        <div className="text-5xl font-bold mb-3 h-12 bg-white/30 animate-pulse rounded"></div>
      ) : (
        <p className="text-5xl font-bold mb-3">{value}</p>
      )}
      {linkTo && (
        <div className="text-sm opacity-90 hover:opacity-100">
          View More &rarr;
        </div>
      )}
    </div>
  );
  if (linkTo) {
    return (
      <Link
        to={linkTo}
        className="block hover:scale-105 transform transition-transform duration-200"
      >
        {content}
      </Link>
    );
  }
  return content;
};

const QuickLinkButton = ({
  to,
  icon: Icon,
  label,
  external = false,
}: {
  to: string;
  icon: React.ElementType;
  label: string;
  external?: boolean;
}) => {
  const commonClasses =
    "flex items-center justify-center space-x-3 w-full px-6 py-5 bg-white text-[#002F41] border border-gray-300 rounded-lg shadow-sm hover:shadow-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#00384d] transition-all duration-150 text-base font-medium";

  if (external) {
    return (
      <a
        href={to}
        target="_blank"
        rel="noopener noreferrer"
        className={commonClasses}
      >
        <Icon className="h-5 w-5" />
        <span>{label}</span>
        <HiOutlineExternalLink className="h-4 w-4 opacity-70" />
      </a>
    );
  }

  return (
    <Link to={to} className={commonClasses}>
      <Icon className="h-5 w-5" />
      <span>{label}</span>
    </Link>
  );
};

const HomePage = () => {
  const { user } = useAuth();
  const { request } = useApi();
  const [summaryData, setSummaryData] = useState<DashboardSummaryData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSummaryData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const data = await request<DashboardSummaryData>("/api/dashboard/summary");
        setSummaryData(data);
      } catch (e: unknown) {
        console.error("Failed to fetch dashboard summary:", e);
        setError(e instanceof Error ? e.message : "Failed to load data");
      } finally {
        setIsLoading(false);
      }
    };

    fetchSummaryData();
  }, []);

  if (error) {
    return (
      <div className="p-6 bg-red-100 border border-red-400 text-red-700 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-2">Error Loading Dashboard</h2>
        <p>{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-4 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8 p-6">
      <div className="p-8 bg-gradient-to-r from-[#002F41] to-[#004057] rounded-lg shadow-md text-white">
        <h1 className="text-3xl font-semibold">
          Welcome back, {user?.full_name || "User"}!
        </h1>
        <p className="mt-3 text-lg text-gray-200">
          Here's a quick overview of your workspace. Jump back in or explore
          other sections.
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <StatCard
          title="Active Projects"
          value={summaryData?.active_projects_count ?? 0}
          icon={HiOutlineBriefcase}
          bgColor="bg-sky-600 hover:bg-sky-700"
          linkTo="/project"
          isLoading={isLoading}
        />
        <StatCard
          title="Pending Tasks"
          value={summaryData?.pending_tasks_count ?? 0}
          icon={HiOutlineClipboardList}
          bgColor="bg-amber-500 hover:bg-amber-600"
          linkTo="/task"
          isLoading={isLoading}
        />
        <StatCard
          title="Recent Logs"
          value={summaryData?.recent_logs_count ?? 0}
          icon={HiOutlineDocumentText}
          bgColor="bg-teal-500 hover:bg-teal-600"
          linkTo="/log"
          isLoading={isLoading}
        />
      </div>

      {/* Quick Links */}
      <div>
        <h2 className="text-xl font-semibold text-gray-700 mb-4">
          Quick Links
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <QuickLinkButton
            to="/project/new"
            icon={HiPlus}
            label="Create New Project"
          />
          <QuickLinkButton
            to="/task/new"
            icon={HiPlus}
            label="Create New Task"
          />
          <QuickLinkButton to="/log/new" icon={HiPlus} label="Create New Log" />
          <QuickLinkButton
            to="/calendar"
            icon={HiOutlineCalendar}
            label="View Calendar"
          />
          {summaryData?.is_admin_user && (
            <QuickLinkButton
              to="/user"
              icon={HiOutlineUsers}
              label="Manage Users"
            />
          )}
          <QuickLinkButton
            to="/availability"
            icon={HiOutlineCalendar}
            label="Set Availability"
          />
        </div>
      </div>
    </div>
  );
};

export default HomePage;
