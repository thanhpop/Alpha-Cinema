import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";

// Chỉ cho khách chưa đăng nhập vào (vd: /login); đã đăng nhập thì đưa về trang chính
const GuestRoute: React.FC = () => {
  const { user } = useAuth();

  if (user) {
    return <Navigate replace to={user.role === "ADMIN" ? "/admin" : "/"} />;
  }

  return <Outlet />;
};

export default GuestRoute;
