import Link from 'next/link';

export default function Header() {
  return (
    <header className="bg-white dark:bg-gray-900 shadow-md py-4 px-6 flex items-center justify-between">
      <div className="flex items-center">
        {/* Logo */}
        <img src="/img/logo.jpeg" alt="Techstar Loans Logo" className="h-8 w-8 object-cover rounded mr-2" />
        <span className="text-xl font-bold text-gray-800 dark:text-gray-100">Techstar Loans</span>
      </div>
      <nav className="space-x-6">
        <Link href="/" className="text-gray-700 dark:text-gray-200 hover:underline">Home</Link>
        <Link href="/personal-loan" className="text-gray-700 dark:text-gray-200 hover:underline">Personal Loan</Link>
        <Link href="/home-loan" className="text-gray-700 dark:text-gray-200 hover:underline">Home Loan</Link>
        <Link href="/contact" className="text-gray-700 dark:text-gray-200 hover:underline">Contact</Link>
      </nav>
    </header>
  );
}
