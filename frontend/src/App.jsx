import { Routes, Route, Navigate } from "react-router-dom";
import Navbar from "./components/layout/Navbar.jsx";
import Sidebar from "./components/layout/Sidebar.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import Login from "./pages/auth/Login.jsx";
import AdminDashboard from "./pages/admin/AdminDashboard.jsx";
import CatalogManager from "./pages/admin/CatalogManager.jsx";
import AllocationPanel from "./pages/admin/AllocationPanel.jsx";
import CatalogBrowser from "./pages/center/CatalogBrowser.jsx";
import RequestWizard from "./pages/center/RequestWizard.jsx";
import MyAllocations from "./pages/center/MyAllocations.jsx";

function App() {
  return (
    <div className="app-shell" style={{ display: "flex", minHeight: "100vh" }}>
      <Sidebar />
      <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        <Navbar />
        <main style={{ padding: "24px" }}>
          <Routes>
            <Route path="/login" element={<Login />} />

            <Route
              path="/admin"
              element={
                <ProtectedRoute>
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/catalog"
              element={
                <ProtectedRoute>
                  <CatalogManager />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/allocation"
              element={
                <ProtectedRoute>
                  <AllocationPanel />
                </ProtectedRoute>
              }
            />

            <Route
              path="/center/catalog"
              element={
                <ProtectedRoute>
                  <CatalogBrowser />
                </ProtectedRoute>
              }
            />
            <Route
              path="/center/request"
              element={
                <ProtectedRoute>
                  <RequestWizard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/center/allocations"
              element={
                <ProtectedRoute>
                  <MyAllocations />
                </ProtectedRoute>
              }
            />

            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}

export default App;
