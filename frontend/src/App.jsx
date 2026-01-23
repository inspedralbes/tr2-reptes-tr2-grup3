import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import Navbar from "./components/layout/Navbar.jsx";
import Sidebar from "./components/layout/Sidebar.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import { useState, useEffect } from "react";
import { useAuth } from "./context/AuthContext.jsx";

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
import RequestDetail from "./pages/center/RequestDetail.jsx";
import StudentManager from "./pages/center/StudentManager.jsx";
import TeachersManager from "./pages/center/TeachersManager.jsx";
import NominalConfirmation from "./pages/center/NominalConfirmation.jsx";

// ZONA PROFESOR
import TeacherDashboard from "./pages/teacher/TeacherDashboard.jsx";
import WorkshopAttendance from "./pages/teacher/WorkshopAttendance.jsx";
import WorkshopEvaluate from "./pages/teacher/WorkshopEvaluate.jsx";
import MyStudents from "./pages/teacher/MyStudents.jsx";

function App() {
  const location = useLocation();
  const { isAuthenticated } = useAuth();
  const isLoginPage = location.pathname === "/login";
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Close sidebar when navigating
  useEffect(() => {
    setIsSidebarOpen(false);
  }, [location.pathname]);

  // Close sidebar on window resize to desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setIsSidebarOpen(false);
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Determine if we should show the sidebar
  const showSidebar = isAuthenticated && !isLoginPage;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar is always visible */}
      <Navbar
        onMenuClick={() => setIsSidebarOpen(!isSidebarOpen)}
        isSidebarOpen={isSidebarOpen}
      />

      {/* Main layout container */}
      <div className="flex">
        {/* Sidebar - only rendered when authenticated and not on login */}
        {showSidebar && (
          <Sidebar
            isOpen={isSidebarOpen}
            onClose={() => setIsSidebarOpen(false)}
          />
        )}

        {/* Main content area */}
        <main
          className={`
            flex-1 min-w-0 min-h-[calc(100vh-4rem)]
            ${showSidebar ? 'lg:ml-0' : ''}
          `}
        >
          <div className="p-4 lg:p-6 max-w-7xl mx-auto">
            <Routes>
              <Route path="/login" element={<Login />} />

              {/* ADMIN ROUTES */}
              <Route path="/admin" element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>} />
              <Route path="/admin/catalog" element={<ProtectedRoute><CatalogManager /></ProtectedRoute>} />
              <Route path="/admin/catalog/:editionId" element={<ProtectedRoute><WorkshopDetail /></ProtectedRoute>} />
              <Route path="/admin/providers" element={<ProtectedRoute><ProviderManager /></ProtectedRoute>} />
              <Route path="/admin/centers" element={<ProtectedRoute><CenterManager /></ProtectedRoute>} />
              <Route path="/admin/allocation" element={<ProtectedRoute><AllocationPanel /></ProtectedRoute>} />
              <Route path="/admin/enrollment" element={<ProtectedRoute><EnrollmentManager /></ProtectedRoute>} />
              <Route path="/admin/requests" element={<ProtectedRoute><RequestsMonitor /></ProtectedRoute>} />

              {/* CENTER ROUTES */}
              <Route path="/center" element={<ProtectedRoute><CenterDashboard /></ProtectedRoute>} />
              <Route path="/center/catalog" element={<ProtectedRoute><CatalogBrowser /></ProtectedRoute>} />
              <Route path="/center/request" element={<ProtectedRoute><RequestWizard /></ProtectedRoute>} />
              <Route path="/center/allocations" element={<ProtectedRoute><MyAllocations /></ProtectedRoute>} />
              <Route path="/center/allocation/:allocationId/confirm" element={<ProtectedRoute><NominalConfirmation /></ProtectedRoute>} />
              <Route path="/center/requests" element={<ProtectedRoute><MyRequests /></ProtectedRoute>} />
              <Route path="/center/request/:id" element={<ProtectedRoute><RequestDetail /></ProtectedRoute>} />
              <Route path="/center/teachers" element={<ProtectedRoute><TeachersManager /></ProtectedRoute>} />
              <Route path="/center/students" element={<ProtectedRoute><StudentManager /></ProtectedRoute>} />

              {/* TEACHER ROUTES */}
              <Route path="/teacher" element={<ProtectedRoute><TeacherDashboard /></ProtectedRoute>} />
              <Route path="/teacher/students" element={<ProtectedRoute><MyStudents /></ProtectedRoute>} />
              <Route path="/teacher/attendance/:sessionId" element={<ProtectedRoute><WorkshopAttendance /></ProtectedRoute>} />
              <Route path="/teacher/workshop/:editionId/evaluate" element={<ProtectedRoute><WorkshopEvaluate /></ProtectedRoute>} />

              {/* ERROR ROUTES */}
              <Route path="/forbidden" element={<Forbidden />} />
              <Route path="*" element={<Navigate to="/login" replace />} />
            </Routes>
          </div>
        </main>
      </div>
    </div>
  );
}

export default App;
