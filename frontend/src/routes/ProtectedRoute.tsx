import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import ForbiddenPage from "@/pages/error/error_403";

interface ProtectedRouteProps {
  role?: string;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ role }) => {
  const { user } = useAuth();

  if (!user) {
    return <Navigate replace to="/login" />;
  }

  if (role && user.role !== role) {
    return <ForbiddenPage />;
  }

  return <Outlet />;
};

export default ProtectedRoute;
