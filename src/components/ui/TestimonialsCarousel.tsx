import React from 'react';

const testimonials = [
  { name: 'Amit Sharma', text: 'Techstar Loans helped me get my dream home quickly!' },
  { name: 'Neha Gupta', text: 'Excellent customer service and low interest rates.' },
  { name: 'Rohit Patel', text: 'The loan approval was instant and hassle‑free.' },
];

export default function TestimonialsCarousel() {
  return (
    <div className="relative overflow-hidden">
      <div className="flex animate-scroll space-x-8">
        {testimonials.map((t, i) => (
          <div key={i} className="min-w-[300px] bg-white bg-opacity-80 backdrop-blur-sm p-4 rounded-lg shadow-md">
            <p className="italic">"{t.text}"</p>
            <p className="mt-2 font-semibold text-right">- {t.name}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

/*
  CSS (add to globals.css or a module):
  @keyframes scroll {
    0% { transform: translateX(0); }
    100% { transform: translateX(-50%); }
  }
  .animate-scroll { animation: scroll 20s linear infinite; }
*/
