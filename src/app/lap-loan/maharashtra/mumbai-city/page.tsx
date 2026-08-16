import LoanPageTemplate from '@/components/LoanPageTemplate';

export const metadata = {
  title: 'lap loan in Mumbai City, maharashtra',
  description: 'Information and application for lap loan in Mumbai City, maharashtra.'
};

export default function Page() {
  return <LoanPageTemplate loan="lap-loan" state="maharashtra" city="Mumbai City" />;
}
