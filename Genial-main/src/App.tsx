import React from 'react';
import { Navbar } from './components/layout/Navbar';
import { Footer } from './components/layout/Footer';
import { Hero } from './components/sections/Hero';
import { Overview } from './components/sections/Overview';
import { Stats } from './components/sections/Stats';
import { Amenities } from './components/sections/Amenities';
import { Gallery } from './components/sections/Gallery';
import { FAQ } from './components/sections/FAQ';
import { Contact } from './components/sections/Contact';

function App() {
  return (
    <div className="min-h-screen bg-pure">
      <Navbar />
      <main>
        <Hero />
        <Overview />
        <Stats />
        <Amenities />
        <Gallery />
        <FAQ />
        <Contact />
      </main>
      <Footer />
    </div>
  );
}

export default App;
