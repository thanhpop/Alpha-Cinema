import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";

const UserRoute: React.FC = () => {
  const { user } = useAuth();

  if (user?.role === "ADMIN") {
    return <Navigate replace to="/admin" />;
  }

  return <Outlet />;
};

export default UserRoute;
