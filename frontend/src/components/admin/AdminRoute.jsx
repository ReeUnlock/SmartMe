import { Outlet } from "react-router-dom";
import AdminLoginPage from "./AdminLoginPage";
import AdminLayout from "./AdminLayout";

export default function AdminRoute() {
  const key = sessionStorage.getItem("admin_key");

  if (!key) {
    return <AdminLoginPage />;
  }

  return (
    <AdminLayout>
      <Outlet />
    </AdminLayout>
  );
}
