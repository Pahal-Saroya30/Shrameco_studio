import { Hero } from '../src/components/sections/Hero';
import { Overview } from '../src/components/sections/Overview';
import { Stats } from '../src/components/sections/Stats';
import { Amenities } from '../src/components/sections/Amenities';
import { Gallery } from '../src/components/sections/Gallery';
import { FAQ } from '../src/components/sections/FAQ';
import { Contact } from '../src/components/sections/Contact';

export default function Home() {
  return (
    <div className="min-h-screen bg-[#F9FBF9]">
      <Hero />
      <Overview />
      <Stats />
      <Amenities />
      <Gallery />
      <FAQ />
      <Contact />
    </div>
  );
}
