import React from 'react';
import { Header, Footer } from '@/components/sections/Layout';
import PersonalLoanPageContent from '@/components/sections/PersonalLoanPageBS';
import { StickyMobileCTA } from '@/components/ui/StickyMobileCTA';

export const metadata = {
  title: 'Personal Loan in Mumbai City, Maharashtra | Techstar Money Solution',
  description: 'Apply for Personal Loan in Mumbai City, Maharashtra. Compare rates, check eligibility, and get instant approval up to ₹50 Lakhs.',
  alternates: {
    canonical: 'https://techstarsolution.in/personal-loan/maharashtra/mumbai-city'
  }
};

export default function Page() {
  return (
    <main>
      <Header />
      <PersonalLoanPageContent city="Mumbai City" />
      <Footer />
      <StickyMobileCTA targetId="personal-loan-form" label="Apply Now" />
    </main>
  );
}
