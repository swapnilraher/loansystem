/* ─────────────────────────────────────────
   TechStar Business Solution — Global JS
   ───────────────────────────────────────── */

// ── Mobile Menu Toggle ──
const menuToggle = document.getElementById('menuToggle');
const mobileNav  = document.getElementById('mobileNav');
if (menuToggle && mobileNav) {
  menuToggle.addEventListener('click', () => mobileNav.classList.toggle('open'));
}

// ── Sticky header shadow ──
const mainHeader = document.getElementById('mainHeader');
if (mainHeader) {
  window.addEventListener('scroll', () => {
    mainHeader.classList.toggle('scrolled', window.scrollY > 20);
  });
}

// ── Scroll Reveal (supports .reveal, .reveal-left, .reveal-right) ──
const revealEls = document.querySelectorAll('.reveal, .reveal-left, .reveal-right');
const revealObserver = new IntersectionObserver(entries => {
  entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('active'); });
}, { threshold: 0.1 });
revealEls.forEach(el => revealObserver.observe(el));

// ── EMI Calculator (index.html only) ──
const loanAmountInput  = document.getElementById('loanAmount');
const interestRateInput = document.getElementById('interestRate');
const loanTenureInput  = document.getElementById('loanTenure');
const loanAmountVal    = document.getElementById('loanAmountVal');
const interestRateVal  = document.getElementById('interestRateVal');
const loanTenureVal    = document.getElementById('loanTenureVal');
const monthlyEmiDisplay    = document.getElementById('monthlyEmi');
const totalInterestDisplay = document.getElementById('totalInterest');
const totalPayableDisplay  = document.getElementById('totalPayable');

function calculateEMI() {
  if (!loanAmountInput || !interestRateInput || !loanTenureInput) return;
  const P = parseFloat(loanAmountInput.value);
  const r = parseFloat(interestRateInput.value) / 12 / 100;
  const n = parseFloat(loanTenureInput.value) * 12;
  const emi = (P * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
  const totalPayable  = emi * n;
  const totalInterest = totalPayable - P;

  if (loanAmountVal)   loanAmountVal.innerText   = `₹ ${P.toLocaleString('en-IN')}`;
  if (interestRateVal) interestRateVal.innerText  = `${interestRateInput.value}%`;
  if (loanTenureVal)   loanTenureVal.innerText    = `${loanTenureInput.value} Years`;
  if (monthlyEmiDisplay)    monthlyEmiDisplay.innerText    = Math.round(emi).toLocaleString('en-IN');
  if (totalInterestDisplay) totalInterestDisplay.innerText = `₹ ${Math.round(totalInterest).toLocaleString('en-IN')}`;
  if (totalPayableDisplay)  totalPayableDisplay.innerText  = `₹ ${Math.round(totalPayable).toLocaleString('en-IN')}`;
}
[loanAmountInput, interestRateInput, loanTenureInput].forEach(input => {
  if (input) input.addEventListener('input', calculateEMI);
});
calculateEMI();

// ── Lead Form Submit Feedback ──
const leadForm = document.getElementById('leadForm');
if (leadForm) {
  leadForm.addEventListener('submit', e => {
    e.preventDefault();
    const btn = leadForm.querySelector('button[type="submit"]');
    btn.disabled = true;
    btn.textContent = 'Submitting…';
    setTimeout(() => {
      btn.textContent = '✓ Submitted! We\'ll call you shortly.';
      btn.style.background = '#16a34a';
    }, 1000);
  });
}

// ── FAQ Accordion (contact-us.html) ──
document.querySelectorAll('.faq-q').forEach(q => {
  q.addEventListener('click', () => {
    const item = q.closest('.faq-item');
    const isOpen = item.classList.contains('open');
    document.querySelectorAll('.faq-item').forEach(i => i.classList.remove('open'));
    if (!isOpen) item.classList.add('open');
  });
});

// ── Contact Form (contact-us.html) ──
const contactForm = document.getElementById('contactForm');
if (contactForm) {
  contactForm.addEventListener('submit', e => {
    e.preventDefault();
    const btn = document.getElementById('submitBtn');
    btn.innerHTML = 'Sending…'; btn.disabled = true;
    setTimeout(() => {
      btn.innerHTML = '✓ Message Sent';
      btn.style.background = '#16a34a';
      const msg = document.getElementById('formSuccess');
      if (msg) msg.style.display = 'block';
    }, 1200);
  });
}

// ── Active nav link highlight ──
(function markActiveLink() {
  const path = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-links a, .mobile-nav a').forEach(a => {
    const href = a.getAttribute('href');
    if (href === path) a.classList.add('active');
  });
})();
