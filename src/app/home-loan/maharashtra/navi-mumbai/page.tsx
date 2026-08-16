import LoanPageTemplate from '@/components/LoanPageTemplate';

export const metadata = {
  title: 'home loan in Navi Mumbai, maharashtra',
  description: 'Information and application for home loan in Navi Mumbai, maharashtra.'
};

export default function Page() {
  return <LoanPageTemplate loan="home-loan" state="maharashtra" city="Navi Mumbai" />;
}
