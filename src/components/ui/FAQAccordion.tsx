import { useState } from 'react';

const faqs = [
  { question: 'What is the maximum loan amount?', answer: 'You can apply for loans up to $500,000.' },
  { question: 'How long does approval take?', answer: 'Most approvals are completed within 24 hours.' },
  { question: 'What documents are required?', answer: 'Proof of identity, income statements, and address verification.' },
  { question: 'Can I prepay my loan?', answer: 'Yes, you can prepay without any penalty.' },
];

export default function FAQAccordion() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggle = (idx: number) => {
    setOpenIndex(openIndex === idx ? null : idx);
  };

  return (
    <div className="space-y-4">
      {faqs.map((faq, idx) => (
        <div key={idx} className="border border-gray-200 rounded-lg">
          <button
            onClick={() => toggle(idx)}
            className="w-full text-left px-4 py-3 flex justify-between items-center bg-gray-100 hover:bg-gray-200 transition"
          >
            <span>{faq.question}</span>
            <span>{openIndex === idx ? '-' : '+'}</span>
          </button>
          {openIndex === idx && (
            <div className="px-4 py-2 bg-white">
              {faq.answer}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
