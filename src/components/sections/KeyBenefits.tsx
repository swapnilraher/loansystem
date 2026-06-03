import React from 'react';
import styles from '@/components/sections/KeyBenefits.module.css';

export const KeyBenefits: React.FC = () => {
  return (
    <section className={styles.container} aria-labelledby="benefits-heading">
      <h2 id="benefits-heading" className={styles.title}>Why Choose TechStar?</h2>
      <div className={styles.grid}>
        <div className={styles.card}>
          <h3>50+</h3>
          <p>Partners</p>
        </div>
        <div className={styles.card}>
          <h3>₹100+ Cr</h3>
          <p>Loans Processed</p>
        </div>
        <div className={styles.card}>
          <h3>5K+</h3>
          <p>Happy Customers</p>
        </div>
      </div>
    </section>
  );
};
