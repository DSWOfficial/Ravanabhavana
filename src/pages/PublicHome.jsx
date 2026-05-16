import Footer from '../components/public/Footer.jsx';
import Header from '../components/public/Header.jsx';
import { useEffect } from 'react';
import HomePage from './HomePage.jsx';

export default function PublicHome() {
  useEffect(() => {
    document.title = 'Ravana Bhavana | රාවණ භවණ';
  }, []);

  return (
    <>
      <Header />
      <main>
        <HomePage />
      </main>
      <Footer />
    </>
  );
}
