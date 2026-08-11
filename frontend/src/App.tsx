import { Route, Routes } from "react-router-dom";
import AppLayout from "./layouts/AppLayout";
import ProtectedRoute from "./components/ProtectedRoute";
import LoginPage from "./pages/LoginPage";
import DashboardPage from "./pages/DashboardPage";
import CustomersListPage from "./pages/customers/CustomersListPage";
import CustomerDetailPage from "./pages/customers/CustomerDetailPage";
import ProductsListPage from "./pages/products/ProductsListPage";
import ChallansListPage from "./pages/challans/ChallansListPage";
import NewChallanPage from "./pages/challans/NewChallanPage";
import ChallanDetailPage from "./pages/challans/ChallanDetailPage";

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      <Route
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/" element={<DashboardPage />} />

        <Route
          path="/customers"
          element={
            <ProtectedRoute allowedRoles={["ADMIN", "SALES", "ACCOUNTS"]}>
              <CustomersListPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/customers/:id"
          element={
            <ProtectedRoute allowedRoles={["ADMIN", "SALES", "ACCOUNTS"]}>
              <CustomerDetailPage />
            </ProtectedRoute>
          }
        />

        <Route path="/products" element={<ProductsListPage />} />

        <Route path="/challans" element={<ChallansListPage />} />
        <Route
          path="/challans/new"
          element={
            <ProtectedRoute allowedRoles={["ADMIN", "SALES"]}>
              <NewChallanPage />
            </ProtectedRoute>
          }
        />
        <Route path="/challans/:id" element={<ChallanDetailPage />} />
      </Route>
    </Routes>
  );
}
