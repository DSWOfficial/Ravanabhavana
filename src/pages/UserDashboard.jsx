import Header from '../components/public/Header.jsx';
import Footer from '../components/public/Footer.jsx';
import UserProgressOverview from '../components/user/UserProgressOverview.jsx';
import ContinueWatching from '../components/user/ContinueWatching.jsx';
import CompletedVideos from '../components/user/CompletedVideos.jsx';
import SavedVideos from '../components/user/SavedVideos.jsx';
import UserNotes from '../components/user/UserNotes.jsx';
import UserBadges from '../components/user/UserBadges.jsx';
import UserDonationHistory from '../components/user/UserDonationHistory.jsx';
import UserSessionHistory from '../components/user/UserSessionHistory.jsx';
import { useAuth } from '../context/AuthContext.jsx';

export default function UserDashboard() {
  const { user } = useAuth();
  return (
    <>
      <Header />
      <main className="section bg-[#f8f0df]">
        <div className="container-shell">
          <div className="surface rounded-lg p-7">
            <p className="eyebrow">User dashboard</p>
            <h1 className="mt-2 text-4xl font-black text-[#3a2115]">ආයුබෝවන්, {user?.displayName || user?.email}</h1>
            <p className="mt-2 text-[#6f4a31]">ඔබේ ප්‍රගතිය, සුරැකි වීඩියෝ, සටහන් සහ සැසි ඉතිහාසය මෙතැනින් බලන්න.</p>
          </div>
          <div className="mt-6 grid gap-6">
            <UserProgressOverview />
            <ContinueWatching />
            <div className="grid gap-6 lg:grid-cols-2"><CompletedVideos /><SavedVideos /></div>
            <UserNotes />
            <div className="grid gap-6 lg:grid-cols-2"><UserSessionHistory /><UserDonationHistory /></div>
            <UserBadges />
            <section className="surface rounded-lg p-6"><h2 className="text-2xl font-black">Account settings</h2><p className="mt-2 text-[#6f4a31]">{user?.email}</p></section>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
