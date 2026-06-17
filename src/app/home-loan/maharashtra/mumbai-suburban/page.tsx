import LoanPageTemplate from '@/components/LoanPageTemplate';

export const metadata = {
  title: 'home loan in Mumbai Suburban, maharashtra',
  description: 'Information and application for home loan in Mumbai Suburban, maharashtra.'
};

export default function Page() {
  return <LoanPageTemplate loan="home-loan" state="maharashtra" city="Mumbai Suburban" />;
}
