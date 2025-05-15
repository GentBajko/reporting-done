import {
  HiOutlineArrowCircleRight,
  HiOutlineBriefcase,
  HiOutlineCalendar,
  HiOutlineClipboardList,
  HiOutlineDocumentText,
  HiOutlineExternalLink,
  HiOutlineUsers,
  HiPlus,
} from "react-icons/hi";
import { Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext"; // To get user's name

// Simplified interfaces for summary data - in a real app, this might come from a context/store or API calls
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
  timestamp: number;
}

// Mock data for summaries - ideally, this would be derived from the actual data sources
const mockSummaryProjects: SummaryProject[] = [
  { id: "p1", name: "Active Project 1", archived: false },
  { id: "p2", name: "Archived Project", archived: true },
  { id: "p3", name: "Active Project 2", archived: false },
];

const mockSummaryTasks: SummaryTask[] = [
  { id: "t1", title: "Pending Task 1", status: "In Progress" },
  { id: "t2", title: "Completed Task", status: "Done" },
  { id: "t3", title: "Pending Task 2", status: "To Do" },
  { id: "t4", title: "Another Pending Task", status: "Returned" },
];

const mockSummaryLogs: SummaryLog[] = [
  { id: "l1", timestamp: Date.now() / 1000 - 3600 }, // 1 hour ago
  { id: "l2", timestamp: Date.now() / 1000 - 7200 }, // 2 hours ago
];

const StatCard = ({
  title,
  value,
  icon: Icon,
  bgColor = "bg-blue-500",
  linkTo,
}: {
  title: string;
  value: string | number;
  icon: React.ElementType;
  bgColor?: string;
  linkTo?: string;
}) => {
  const content = (
    <div
      className={`p-6 rounded-xl shadow-lg text-white ${bgColor} flex flex-col justify-between h-full`}
    >
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-semibold">{title}</h3>
        <Icon className="h-8 w-8 opacity-80" />
      </div>
      <p className="text-4xl font-bold mb-2">{value}</p>
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
    "flex items-center justify-center space-x-2 w-full px-6 py-3.5 bg-white text-[#002F41] border border-gray-300 rounded-lg shadow-sm hover:shadow-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#00384d] transition-all duration-150 text-sm font-medium";

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
  const { user } = useAuth(); // Get user info for welcome message

  const activeProjectsCount = mockSummaryProjects.filter(
    (p) => !p.archived
  ).length;
  const pendingTasksCount = mockSummaryTasks.filter(
    (t) => t.status && !["done", "completed"].includes(t.status.toLowerCase())
  ).length;
  const recentLogsCount = mockSummaryLogs.length; // Or filter by recent timestamp

  return (
    <div className="space-y-8">
      <div className="p-6 bg-gradient-to-r from-[#002F41] to-[#004057] rounded-lg shadow-md text-white">
        <h1 className="text-3xl font-semibold">
          Welcome back, {user?.full_name || "User"}!
        </h1>
        <p className="mt-2 text-gray-200">
          Here's a quick overview of your workspace. Jump back in or explore
          other sections.
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <StatCard
          title="Active Projects"
          value={activeProjectsCount}
          icon={HiOutlineBriefcase}
          bgColor="bg-sky-600 hover:bg-sky-700"
          linkTo="/project"
        />
        <StatCard
          title="Pending Tasks"
          value={pendingTasksCount}
          icon={HiOutlineClipboardList}
          bgColor="bg-amber-500 hover:bg-amber-600"
          linkTo="/task"
        />
        <StatCard
          title="Recent Logs"
          value={recentLogsCount}
          icon={HiOutlineDocumentText}
          bgColor="bg-teal-500 hover:bg-teal-600"
          linkTo="/log"
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
          <QuickLinkButton
            to="/user"
            icon={HiOutlineUsers}
            label="Manage Users"
          />
          <QuickLinkButton
            to="https://division5.co"
            icon={HiOutlineArrowCircleRight}
            label="Division5 Website"
            external
          />
        </div>
      </div>
    </div>
  );
};

export default HomePage;
