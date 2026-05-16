import { Navigate, Routes, Route } from 'react-router-dom';
import SiteTheme from './components/public/SiteTheme.jsx';
import Login from './pages/Login.jsx';
import UserDashboard from './pages/UserDashboard.jsx';
import AdminLogin from './pages/admin/AdminLogin.jsx';
import AdminDashboard from './pages/admin/AdminDashboard.jsx';
import AdminBanners from './pages/admin/AdminBanners.jsx';
import AdminCmsDashboard from './pages/admin/AdminCmsDashboard.jsx';
import AdminVideos from './pages/admin/AdminVideos.jsx';
import AdminGuidance from './pages/admin/AdminGuidance.jsx';
import AdminWeeklySessions from './pages/admin/AdminWeeklySessions.jsx';
import AdminBlockedUsers from './pages/admin/AdminBlockedUsers.jsx';
import CmsPagesList from './pages/admin/CmsPagesList.jsx';
import CmsPageNew from './pages/admin/CmsPageNew.jsx';
import CmsPageEdit from './pages/admin/CmsPageEdit.jsx';
import CmsNavigation from './pages/admin/CmsNavigation.jsx';
import CmsMedia from './pages/admin/CmsMedia.jsx';
import CmsSeo from './pages/admin/CmsSeo.jsx';
import DynamicPage from './pages/DynamicPage.jsx';
import HomepageEditor from './pages/admin/HomepageEditor.jsx';
import PublicHome from './pages/PublicHome.jsx';
import GuidancePage from './pages/GuidancePage.jsx';
import ProtectedRoute from './routes/ProtectedRoute.jsx';
import AdminRoute from './routes/AdminRoute.jsx';

export default function App() {
  return (
    <>
      <SiteTheme />
      <Routes>
        <Route path="/" element={<PublicHome />} />
        <Route path="/login" element={<Login />} />
        <Route path="/guidance" element={<GuidancePage />} />
        <Route path="/dashboard" element={<ProtectedRoute><UserDashboard /></ProtectedRoute>} />
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
        <Route path="/admin/dashboard" element={<Navigate to="/admin" replace />} />
        <Route path="/admin/cms" element={<AdminRoute><AdminCmsDashboard /></AdminRoute>} />
        <Route path="/admin/homepage" element={<AdminRoute><HomepageEditor /></AdminRoute>} />
        <Route path="/admin/banners" element={<AdminRoute><AdminBanners /></AdminRoute>} />
        <Route path="/admin/guidance" element={<AdminRoute><AdminGuidance /></AdminRoute>} />
        <Route path="/admin/weekly-sessions" element={<AdminRoute><AdminWeeklySessions /></AdminRoute>} />
        <Route path="/admin/blocked-users" element={<AdminRoute><AdminBlockedUsers /></AdminRoute>} />
        <Route path="/admin/videos" element={<AdminRoute><AdminVideos /></AdminRoute>} />
        <Route path="/admin/pages" element={<AdminRoute><CmsPagesList /></AdminRoute>} />
        <Route path="/admin/pages/new" element={<AdminRoute><CmsPageNew /></AdminRoute>} />
        <Route path="/admin/pages/:id/edit" element={<AdminRoute><CmsPageEdit /></AdminRoute>} />
        <Route path="/admin/navigation" element={<AdminRoute><CmsNavigation /></AdminRoute>} />
        <Route path="/admin/media" element={<AdminRoute><CmsMedia /></AdminRoute>} />
        <Route path="/admin/seo" element={<AdminRoute><CmsSeo /></AdminRoute>} />
        <Route path="/:slug" element={<DynamicPage />} />
      </Routes>
    </>
  );
}
