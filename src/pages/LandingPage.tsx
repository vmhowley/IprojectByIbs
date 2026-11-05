import { Features } from '../components/landing/Features';
import { Footer } from '../components/landing/Footer';
import { Hero } from '../components/landing/Hero';
import { Navbar } from '../components/landing/Navbar';
import { Pricing } from '../components/landing/Pricing';

export function LandingPage() {
    return (
        <div className="min-h-screen bg-desk text-ink selection:bg-brand/15">
            <Navbar />
            <main>
                <Hero />
                <Features />
                <Pricing />
            </main>
            <Footer />
        </div>
    );
}
