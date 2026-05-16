import { Navigate, Routes, Route } from 'react-router-dom';
import SiteTheme from './components/public/SiteTheme.jsx';
import Login from './pages/Login.jsx';
import UserDashboard from './pages/UserDashboard.jsx';
import AdminLogin from './pages/admin/AdminLogin.jsx';
import AdminCmsDashboard from './pages/admin/AdminCmsDashboard.jsx';
import CmsPagesList from './pages/admin/CmsPagesList.jsx';
import CmsPageNew from './pages/admin/CmsPageNew.jsx';
import CmsPageEdit from './pages/admin/CmsPageEdit.jsx';
import CmsNavigation from './pages/admin/CmsNavigation.jsx';
import CmsMedia from './pages/admin/CmsMedia.jsx';
import DynamicPage from './pages/DynamicPage.jsx';
import ProtectedRoute from './routes/ProtectedRoute.jsx';
import AdminRoute from './routes/AdminRoute.jsx';

export default function App() {
  return (
    <>
      <SiteTheme />
      <Routes>
        <Route path="/" element={<DynamicPage slug="home" />} />
        <Route path="/login" element={<Login />} />
        <Route path="/dashboard" element={<ProtectedRoute><UserDashboard /></ProtectedRoute>} />
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin" element={<AdminRoute><AdminCmsDashboard /></AdminRoute>} />
        <Route path="/admin/dashboard" element={<Navigate to="/admin" replace />} />
        <Route path="/admin/pages" element={<AdminRoute><CmsPagesList /></AdminRoute>} />
        <Route path="/admin/pages/new" element={<AdminRoute><CmsPageNew /></AdminRoute>} />
        <Route path="/admin/pages/:id/edit" element={<AdminRoute><CmsPageEdit /></AdminRoute>} />
        <Route path="/admin/navigation" element={<AdminRoute><CmsNavigation /></AdminRoute>} />
        <Route path="/admin/media" element={<AdminRoute><CmsMedia /></AdminRoute>} />
        <Route path="/:slug" element={<DynamicPage />} />
      </Routes>
    </>
  );
}
