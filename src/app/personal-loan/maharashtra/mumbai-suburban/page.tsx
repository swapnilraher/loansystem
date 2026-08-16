import React from 'react';
import { Header, Footer } from '@/components/sections/Layout';
import PersonalLoanPageContent from '@/components/sections/PersonalLoanPageBS';
import { StickyMobileCTA } from '@/components/ui/StickyMobileCTA';

export const metadata = {
  title: 'Personal Loan in Mumbai Suburban, Maharashtra | Techstar Money Solution',
  description: 'Apply for Personal Loan in Mumbai Suburban, Maharashtra. Compare rates, check eligibility, and get instant approval up to ₹50 Lakhs.',
  alternates: {
    canonical: 'https://techstarsolution.in/personal-loan/maharashtra/mumbai-suburban'
  }
};

export default function Page() {
  return (
    <main>
      <Header />
      <PersonalLoanPageContent city="Mumbai Suburban" />
      <Footer />
      <StickyMobileCTA targetId="personal-loan-form" label="Apply Now" />
    </main>
  );
}
