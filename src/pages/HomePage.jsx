import About from '../components/public/About.jsx';
import Banners from '../components/public/Banners.jsx';
import Contact from '../components/public/Contact.jsx';
import AnonymousGuidance from '../components/public/AnonymousGuidance.jsx';
import Hero from '../components/public/Hero.jsx';
import NextWeeklySession from '../components/public/NextWeeklySession.jsx';
import Services from '../components/public/Services.jsx';
import Support from '../components/public/Support.jsx';
import Videos from '../components/public/Videos.jsx';
import WeeklySession from '../components/public/WeeklySession.jsx';

export default function HomePage() {
  return (
    <>
      <Hero />
      <Banners />
      <About />
      <Services />
      <Videos />
      <AnonymousGuidance compact />
      <NextWeeklySession />
      <WeeklySession />
      <Support />
      <Contact />
    </>
  );
}
