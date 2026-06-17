import LoanPageTemplate from '@/components/LoanPageTemplate';

export const metadata = {
  title: 'personal loan in Mumbai City, maharashtra',
  description: 'Information and application for personal loan in Mumbai City, maharashtra.'
};

export default function Page() {
  return <LoanPageTemplate loan="personal-loan" state="maharashtra" city="Mumbai City" />;
}
