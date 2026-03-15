import { Outlet } from "react-router-dom";
import { getAdminKey } from "../../api/admin";
import AdminLoginPage from "./AdminLoginPage";
import AdminLayout from "./AdminLayout";

export default function AdminRoute() {
  const key = getAdminKey();

  if (!key) {
    return <AdminLoginPage />;
  }

  return (
    <AdminLayout>
      <Outlet />
    </AdminLayout>
  );
}
