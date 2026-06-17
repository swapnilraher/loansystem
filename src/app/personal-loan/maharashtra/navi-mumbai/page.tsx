import LoanPageTemplate from '@/components/LoanPageTemplate';

export const metadata = {
  title: 'personal loan in Navi Mumbai, maharashtra',
  description: 'Information and application for personal loan in Navi Mumbai, maharashtra.'
};

export default function Page() {
  return <LoanPageTemplate loan="personal-loan" state="maharashtra" city="Navi Mumbai" />;
}
