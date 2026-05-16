import About from '../components/public/About.jsx';
import Banners from '../components/public/Banners.jsx';
import Contact from '../components/public/Contact.jsx';
import Hero from '../components/public/Hero.jsx';
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
      <WeeklySession />
      <Support />
      <Contact />
    </>
  );
}
