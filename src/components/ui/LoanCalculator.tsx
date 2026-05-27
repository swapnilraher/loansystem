import { useState } from 'react';

export default function LoanCalculator() {
  const [amount, setAmount] = useState('');
  const [rate, setRate] = useState('');
  const [term, setTerm] = useState(''); // in years
  const [monthly, setMonthly] = useState(null as number | null);

  const calculate = () => {
    const principal = parseFloat(amount);
    const annualRate = parseFloat(rate);
    const years = parseFloat(term);
    if (isNaN(principal) || isNaN(annualRate) || isNaN(years) || principal <= 0 || annualRate <= 0 || years <= 0) {
      setMonthly(null);
      return;
    }
    const monthlyRate = annualRate / 100 / 12;
    const months = years * 12;
    const payment =
      (principal * monthlyRate * Math.pow(1 + monthlyRate, months)) /
      (Math.pow(1 + monthlyRate, months) - 1);
    setMonthly(Math.round(payment));
  };

  return (
    <div className="glass-card p-6 rounded-lg shadow-md max-w-md mx-auto">
      <h3 className="text-xl font-bold mb-4 text-primary text-center">Loan Calculator</h3>
      <div className="grid grid-cols-1 gap-4">
        <input
          type="number"
          placeholder="Loan amount"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="border border-gray-300 rounded p-2 focus:outline-none focus:ring-2 focus:ring-primary"
        />
        <input
          type="number"
          placeholder="Annual interest rate (%)"
          value={rate}
          onChange={(e) => setRate(e.target.value)}
          className="border border-gray-300 rounded p-2 focus:outline-none focus:ring-2 focus:ring-primary"
        />
        <input
          type="number"
          placeholder="Term (years)"
          value={term}
          onChange={(e) => setTerm(e.target.value)}
          className="border border-gray-300 rounded p-2 focus:outline-none focus:ring-2 focus:ring-primary"
        />
        <button
          onClick={calculate}
          className="bg-primary text-primary-foreground py-2 rounded hover:scale-105 transition-transform"
        >
          Calculate
        </button>
        {monthly !== null && (
          <div className="mt-4 text-center text-lg font-medium text-green-600">
            Monthly Payment: <span className="font-bold">${monthly.toLocaleString()}</span>
          </div>
        )}
      </div>
    </div>
  );
}
