import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

const ProtectedRoute = () => {
  const { isAdmin, isLoggedIn } = useAuth();

  if (!isLoggedIn) {
    // If not logged in, redirect to login page
    // In this basic setup, login is part of Layout, but a real app might have a separate /login route
    return <Navigate to="/user/login" replace />;
  }

  if (!isAdmin) {
    // If logged in but not an admin, redirect to home or an unauthorized page
    return <Navigate to="/" replace />;
  }

  return <Outlet />; // Render the child route (UsersPage in this case)
};

export default ProtectedRoute;
