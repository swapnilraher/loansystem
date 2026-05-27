import Image from 'next/image';
import Link from 'next/link';

export default function HeroSection() {
  return (
    <section className="relative h-[70vh] flex items-center justify-center bg-cover bg-center" style={{ backgroundImage: "url('/assets/hero_techstar_loans.jpg')" }}>
      <div className="text-center text-white glass-card p-8 rounded-lg shadow-premium animate-float">
        <h1 className="text-4xl md:text-5xl font-bold mb-4 text-gradient">Techstar Loans</h1>
        <p className="text-xl mb-6">Fast, flexible financing for your dreams.</p>
        <Link href="/personal-loan" className="inline-block bg-primary text-primary-foreground px-6 py-3 rounded-full hover:scale-105 transition-transform">
          Get Started
        </Link>
      </div>
    </section>
  );
}
