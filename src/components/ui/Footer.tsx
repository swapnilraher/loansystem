import Image from 'next/image';
import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="bg-gray-100 dark:bg-gray-800 py-8 px-6 mt-16">
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8 text-gray-600 dark:text-gray-300">
        <div>
          <h3 className="text-lg font-semibold mb-3 text-gray-800 dark:text-gray-100">Techstar Loans</h3>
          <p>Fast, flexible financing for your dreams.</p>
        </div>
        <div>
          <h3 className="text-lg font-semibold mb-3">Quick Links</h3>
          <ul>
            <li><Link href="/" className="hover:underline">Home</Link></li>
            <li><Link href="/personal-loan" className="hover:underline">Personal Loan</Link></li>
            <li><Link href="/home-loan" className="hover:underline">Home Loan</Link></li>
          </ul>
        </div>
        <div>
          <h3 className="text-lg font-semibold mb-3">Contact</h3>
          <p>Email: support@techstarloans.com</p>
          <p>Phone: +1 (800) 123‑4567</p>
        </div>
      </div>
      <div className="text-center mt-6 text-sm">© {new Date().getFullYear()} Techstar Loans. All rights reserved.</div>
    </footer>
  );
}
