import { useState } from 'react';

export default function ContactForm() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    amount: '',
    message: '',
  });
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setStatus('idle');
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      if (!res.ok) throw new Error('Network response was not ok');
      setStatus('success');
      setFormData({ name: '', email: '', phone: '', amount: '', message: '' });
    } catch (err) {
      console.error(err);
      setStatus('error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="glass-card p-6 rounded-lg shadow-md max-w-xl mx-auto">
      <div className="grid grid-cols-1 gap-4">
        <input
          type="text"
          name="name"
          placeholder="Your Name"
          value={formData.name}
          onChange={handleChange}
          required
          className="border border-gray-300 rounded p-2 focus:outline-none focus:ring-2 focus:ring-primary"
        />
        <input
          type="email"
          name="email"
          placeholder="Email"
          value={formData.email}
          onChange={handleChange}
          required
          className="border border-gray-300 rounded p-2 focus:outline-none focus:ring-2 focus:ring-primary"
        />
        <input
          type="tel"
          name="phone"
          placeholder="Phone"
          value={formData.phone}
          onChange={handleChange}
          required
          className="border border-gray-300 rounded p-2 focus:outline-none focus:ring-2 focus:ring-primary"
        />
        <input
          type="number"
          name="amount"
          placeholder="Desired Loan Amount"
          value={formData.amount}
          onChange={handleChange}
          required
          className="border border-gray-300 rounded p-2 focus:outline-none focus:ring-2 focus:ring-primary"
        />
        <textarea
          name="message"
          placeholder="Additional details (optional)"
          value={formData.message}
          onChange={handleChange}
          rows={3}
          className="border border-gray-300 rounded p-2 focus:outline-none focus:ring-2 focus:ring-primary"
        />
        <button
          type="submit"
          disabled={loading}
          className="bg-primary text-primary-foreground py-2 rounded hover:scale-105 transition-transform"
        >
          {loading ? 'Sending...' : 'Submit'}
        </button>
        {status === 'success' && (
          <p className="text-green-600 mt-2">Your request has been sent successfully!</p>
        )}
        {status === 'error' && (
          <p className="text-red-600 mt-2">There was an error submitting the form. Please try again.</p>
        )}
      </div>
    </form>
  );
}
