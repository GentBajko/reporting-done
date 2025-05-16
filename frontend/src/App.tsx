import React, { useEffect, useState } from "react";
import {
  HiOutlineBriefcase,
  HiOutlineCalendar,
  HiOutlineClipboardList,
  HiOutlineDocumentText,
  HiOutlineHome,
  HiOutlineLogin,
  HiOutlineLogout,
  HiOutlineMenu,
  HiOutlineUserCircle,
  HiOutlineUsers,
} from "react-icons/hi";
import {
  Link,
  Navigate,
  Outlet,
  Route,
  NavLink as RouterNavLink,
  Routes,
  useLocation,
  useNavigate,
} from "react-router-dom";
import "./App.css";
import AvailabilityPage from "./components/AvailabilityPage";
import CalendarPage from "./components/CalendarPage";
import HomePage from "./components/HomePage";
import LogsPage from "./components/LogsPage";
import NotFoundPage from "./components/NotFoundPage";
import ProjectsPage from "./components/ProjectsPage";
import ProtectedRoute from "./components/ProtectedRoute";
import TasksPage from "./components/TasksPage";
import UserProfilePage from "./components/UserProfilePage";
import UsersPage from "./components/UsersPage";
import { useAuth } from "./contexts/AuthContext";

const LoginPage = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setIsLoading(true);
    try {
      await login(email, password);
      navigate("/");
    } catch (err: any) {
      setError(err.message || "Login failed. Please check your credentials.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen w-screen bg-gray-200">
      <img
        src="https://division5.co/wp-content/uploads/2023/01/division5.svg"
        alt="Division5 Reports Logo"
        className="h-12 mb-8"
      />
      <h1 className="text-3xl mb-6 text-gray-800">D5 Reports Login</h1>
      <form
        onSubmit={handleLogin}
        className="w-full max-w-xs space-y-4 bg-white p-8 rounded-lg shadow-md"
      >
        <div>
          <label
            htmlFor="email"
            className="block text-sm font-medium text-gray-700"
          >
            Email Address
          </label>
          <input
            type="email"
            id="email"
            name="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            disabled={isLoading}
          />
        </div>
        <div>
          <label
            htmlFor="password"
            className="block text-sm font-medium text-gray-700"
          >
            Password
          </label>
          <input
            type="password"
            id="password"
            name="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            disabled={isLoading}
          />
        </div>
        {error && (
          <div className="text-sm text-red-600 bg-red-100 p-3 rounded">
            {error}
          </div>
        )}
        <button
          type="submit"
          disabled={isLoading}
          className="w-full px-6 py-3 bg-[#002F41] text-white rounded hover:bg-[#004057] transition duration-150 text-lg flex items-center justify-center disabled:opacity-50"
        >
          {isLoading ? (
            <svg
              className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
          ) : (
            <HiOutlineLogin className="mr-2 h-5 w-5" />
          )}
          {isLoading ? "Logging in..." : "Log In"}
        </button>
      </form>
    </div>
  );
};

const LogoutPage = () => {
  const { logout, isLoggedIn } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const performLogout = async () => {
      if (isLoggedIn) {
        await logout();
      }
      navigate("/user/login", { replace: true });
    };
    performLogout();
  }, [logout, isLoggedIn, navigate]);

  return (
    <div className="h-screen w-screen flex items-center justify-center">
      <p>Logging out...</p>
    </div>
  );
};

const NavLink = ({
  to,
  icon: Icon,
  children,
}: {
  to: string;
  icon: React.ElementType;
  children: React.ReactNode;
}) => {
  const baseClasses =
    "flex items-center px-4 py-2.5 rounded transition duration-150 text-sm";
  const inactiveClasses =
    "text-gray-300 hover:bg-gray-700 hover:text-[#71c9ed]";
  const activeClasses = "bg-gray-700 text-[#71c9ed] font-semibold";

  return (
    <RouterNavLink
      to={to}
      className={({ isActive }) =>
        `${baseClasses} ${isActive ? activeClasses : inactiveClasses}`
      }
    >
      <Icon className="mr-3 h-5 w-5" />
      {children}
    </RouterNavLink>
  );
};

const getPageTitle = (pathname: string): string => {
  if (pathname === "/") return "Dashboard";
  const segments = pathname.split("/").filter(Boolean);
  if (segments.length === 0) return "Dashboard";
  const title = segments[segments.length - 1];
  return title.charAt(0).toUpperCase() + title.slice(1);
};

const Layout = () => {
  const { isLoggedIn, isAdmin, user, isLoadingAuth } = useAuth();
  const location = useLocation();
  const pageTitle = getPageTitle(location.pathname);

  if (isLoadingAuth) {
    return (
      <div className="flex items-center justify-center h-screen w-screen bg-gray-100">
        <p className="text-xl text-gray-700">Loading application...</p>
      </div>
    );
  }

  if (!isLoggedIn) {
    return <Navigate to="/user/login" replace />;
  }

  return (
    <div className="flex h-screen w-screen bg-gray-100 overflow-x-hidden">
      <div className="w-64 bg-[#002F41] shadow-md flex flex-col text-white shrink-0">
        <div className="p-4 border-b border-gray-700">
          <Link to="/" className="flex items-center">
            <img
              src="https://division5.co/wp-content/uploads/2023/01/division5.svg"
              alt="Division5 Reports"
              className="h-auto"
            />
          </Link>
        </div>
        <nav className="flex-1 p-3 space-y-1.5 overflow-y-auto">
          <NavLink to="/" icon={HiOutlineHome}>
            Dashboard
          </NavLink>
          <NavLink to="/project" icon={HiOutlineBriefcase}>
            Projects
          </NavLink>
          <NavLink to="/task" icon={HiOutlineClipboardList}>
            Tasks
          </NavLink>
          <NavLink to="/log" icon={HiOutlineDocumentText}>
            Logs
          </NavLink>
          {isAdmin && (
            <NavLink to="/user" icon={HiOutlineUsers}>
              Users
            </NavLink>
          )}
          <NavLink to="/calendar" icon={HiOutlineCalendar}>
            Calendar
          </NavLink>
          <NavLink to="/availability" icon={HiOutlineCalendar}>
            Availability
          </NavLink>
        </nav>
        <div className="p-3 border-t border-gray-700 space-y-1">
          <NavLink to="/profile" icon={HiOutlineUserCircle}>
            Profile
          </NavLink>
          <NavLink to="/user/logout" icon={HiOutlineLogout}>
            Logout
          </NavLink>
        </div>
      </div>
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white shadow-sm p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <button className="text-gray-500 mr-3 md:hidden">
                <HiOutlineMenu className="h-6 w-6" />
              </button>
              <h1 className="text-xl font-semibold text-gray-800">
                {pageTitle}
              </h1>
            </div>
            <div className="flex items-center space-x-3">
              <Link
                to="/profile"
                className="text-sm text-gray-600 hover:text-indigo-600 hover:underline"
              >
                Welcome,{" "}
                {user?.full_name ? user.full_name : isAdmin ? "Admin" : "User"}
              </Link>
              <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center text-gray-600">
                {isAdmin ? "A" : "U"}
              </div>
            </div>
          </div>
        </header>
        <main
          id="main-content"
          className="flex-1 p-6 overflow-y-auto bg-gray-50"
        >
          <Outlet />
        </main>
      </div>
    </div>
  );
};

function App() {
  return (
    <Routes>
      <Route path="/user/login" element={<LoginPage />} />
      <Route path="/user/logout" element={<LogoutPage />} />
      <Route path="/" element={<Layout />}>
        <Route index element={<HomePage />} />
        <Route path="project" element={<ProjectsPage />} />
        <Route path="task" element={<TasksPage />} />
        <Route path="log" element={<LogsPage />} />
        <Route path="calendar" element={<CalendarPage />} />
        <Route path="availability" element={<AvailabilityPage />} />
        <Route path="profile" element={<UserProfilePage />} />
        <Route path="user" element={<ProtectedRoute />}>
          <Route index element={<UsersPage />} />
        </Route>
      </Route>
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}

export default App;
