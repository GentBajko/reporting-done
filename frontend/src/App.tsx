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

  const handleLogin = (isAdminLogin: boolean) => {
    login(isAdminLogin);
    navigate("/");
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen w-screen bg-gray-200">
      <img
        src="https://division5.co/wp-content/uploads/2023/01/division5.svg"
        alt="Division5 Reports Logo"
        className="h-12 mb-8"
      />
      <h1 className="text-3xl mb-6 text-gray-800">D5 Reports Login</h1>
      <div className="space-y-4">
        <button
          onClick={() => handleLogin(false)}
          className="w-full px-6 py-3 bg-[#002F41] text-white rounded hover:bg-[#004057] transition duration-150 text-lg flex items-center justify-center"
        >
          <HiOutlineLogin className="mr-2 h-5 w-5" /> Log In as User (Mock)
        </button>
        <button
          onClick={() => handleLogin(true)}
          className="w-full px-6 py-3 bg-orange-500 text-white rounded hover:bg-orange-600 transition duration-150 text-lg flex items-center justify-center"
        >
          <HiOutlineLogin className="mr-2 h-5 w-5" /> Log In as Admin (Mock)
        </button>
      </div>
      <p className="mt-6 text-sm text-gray-600">
        (This is a mock login for demonstration)
      </p>
    </div>
  );
};

const LogoutPage = () => {
  const { logout, isLoggedIn } = useAuth();
  if (isLoggedIn) {
    logout();
  }
  return <Navigate to="/user/login" replace />;
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
  const { isLoggedIn, isAdmin, user } = useAuth();
  const location = useLocation();
  const pageTitle = getPageTitle(location.pathname);

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
