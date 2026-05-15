import { Routes, Route } from 'react-router-dom';
import Header from './components/public/Header.jsx';
import Hero from './components/public/Hero.jsx';
import Banners from './components/public/Banners.jsx';
import About from './components/public/About.jsx';
import Services from './components/public/Services.jsx';
import Videos from './components/public/Videos.jsx';
import WeeklySession from './components/public/WeeklySession.jsx';
import Support from './components/public/Support.jsx';
import Contact from './components/public/Contact.jsx';
import Footer from './components/public/Footer.jsx';
import Login from './pages/Login.jsx';
import UserDashboard from './pages/UserDashboard.jsx';
import AdminLogin from './pages/admin/AdminLogin.jsx';
import AdminDashboard from './pages/admin/AdminDashboard.jsx';
import ProtectedRoute from './routes/ProtectedRoute.jsx';
import AdminRoute from './routes/AdminRoute.jsx';

function Home() {
  return (
    <>
      <Header />
      <main>
        <Hero />
        <Banners />
        <About />
        <Services />
        <Videos />
        <WeeklySession />
        <Support />
        <Contact />
      </main>
      <Footer />
    </>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/dashboard" element={<ProtectedRoute><UserDashboard /></ProtectedRoute>} />
      <Route path="/admin/login" element={<AdminLogin />} />
      <Route path="/admin/dashboard" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
    </Routes>
  );
}
