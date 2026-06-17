import LoanPageTemplate from '@/components/LoanPageTemplate';

export const metadata = {
  title: 'lap loan in Navi Mumbai, maharashtra',
  description: 'Information and application for lap loan in Navi Mumbai, maharashtra.'
};

export default function Page() {
  return <LoanPageTemplate loan="lap-loan" state="maharashtra" city="Navi Mumbai" />;
}
