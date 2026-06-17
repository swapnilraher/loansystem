import LoanPageTemplate from '@/components/LoanPageTemplate';

export const metadata = {
  title: 'personal loan in Mumbai Suburban, maharashtra',
  description: 'Information and application for personal loan in Mumbai Suburban, maharashtra.'
};

export default function Page() {
  return <LoanPageTemplate loan="personal-loan" state="maharashtra" city="Mumbai Suburban" />;
}
