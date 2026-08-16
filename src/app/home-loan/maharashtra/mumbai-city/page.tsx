import LoanPageTemplate from '@/components/LoanPageTemplate';

export const metadata = {
  title: 'home loan in Mumbai City, maharashtra',
  description: 'Information and application for home loan in Mumbai City, maharashtra.'
};

export default function Page() {
  return <LoanPageTemplate loan="home-loan" state="maharashtra" city="Mumbai City" />;
}
