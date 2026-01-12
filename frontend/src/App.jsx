import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import Navbar from "./components/layout/Navbar.jsx";
import Sidebar from "./components/layout/Sidebar.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";

// Páginas públicas
import Login from "./pages/auth/Login.jsx";
import NotFound from "./pages/errors/NotFound.jsx";
import Forbidden from "./pages/errors/Forbidden.jsx";

// ZONA ADMIN
import AdminDashboard from "./pages/admin/AdminDashboard.jsx";
import CatalogManager from "./pages/admin/CatalogManager.jsx";
import AllocationPanel from "./pages/admin/AllocationPanel.jsx";
import EnrollmentManager from "./pages/admin/EnrollmentManager.jsx";
import WorkshopDetail from "./pages/admin/WorkshopDetail.jsx";
import RequestsMonitor from "./pages/admin/RequestsMonitor.jsx";
import ProviderManager from "./pages/admin/ProviderManager.jsx";
import CenterManager from "./pages/admin/CenterManager.jsx";

// ZONA CENTRO
import CenterDashboard from "./pages/center/CenterDashboard.jsx";
import CatalogBrowser from "./pages/center/CatalogBrowser.jsx";
import RequestWizard from "./pages/center/RequestWizard.jsx";
import MyAllocations from "./pages/center/MyAllocations.jsx";
import MyRequests from "./pages/center/MyRequests.jsx";
import NominalConfirmation from "./pages/center/NominalConfirmation.jsx";

// ZONA PROFESOR
import TeacherDashboard from "./pages/teacher/TeacherDashboard.jsx";
import WorkshopAttendance from "./pages/teacher/WorkshopAttendance.jsx";
import WorkshopEvaluate from "./pages/teacher/WorkshopEvaluate.jsx";

function App() {
  const location = useLocation();
  const isLoginPage = location.pathname === "/login";

  return (
    <div className="app-shell min-h-screen flex flex-col">
      <Navbar />
      <div className="flex flex-1">
        {!isLoginPage && <Sidebar />}
        <main className="flex-1 p-6 bg-gray-50/30">
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
              path="/admin/catalog/:editionId"
              element={
                <ProtectedRoute>
                  <WorkshopDetail />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/providers"
              element={
                <ProtectedRoute>
                  <ProviderManager />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/centers"
              element={
                <ProtectedRoute>
                  <CenterManager />
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
              path="/admin/enrollment"
              element={
                <ProtectedRoute>
                  <EnrollmentManager />
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
            <Route
              path="/center/allocations/:allocationId/confirm"
              element={
                <ProtectedRoute>
                  <NominalConfirmation />
                </ProtectedRoute>
              }
            />
            <Route
              path="/center/requests"
              element={
                <ProtectedRoute>
                  <MyRequests />
                </ProtectedRoute>
              }
            />

            {/* ==================== ZONA CENTRO ==================== */}
            <Route
              path="/center"
              element={
                <ProtectedRoute>
                  <CenterDashboard />
                </ProtectedRoute>
              }
            />

            {/* ==================== ZONA PROFESOR ==================== */}
            <Route
              path="/teacher"
              element={
                <ProtectedRoute>
                  <TeacherDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/teacher/workshop/:sessionId"
              element={
                <ProtectedRoute>
                  <WorkshopAttendance />
                </ProtectedRoute>
              }
            />
            <Route
              path="/teacher/workshop/:editionId/evaluate"
              element={
                <ProtectedRoute>
                  <WorkshopEvaluate />
                </ProtectedRoute>
              }
            />

            {/* ==================== ADMIN EXTRA ==================== */}
            <Route
              path="/admin/requests"
              element={
                <ProtectedRoute>
                  <RequestsMonitor />
                </ProtectedRoute>
              }
            />

            {/* ==================== ERRORES Y FALLBACK ==================== */}
            <Route path="/forbidden" element={<Forbidden />} />
            {/* ==================== ERRORES Y FALLBACK ==================== */}
            <Route path="/forbidden" element={<Forbidden />} />
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}

export default App;
