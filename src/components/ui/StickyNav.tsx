import React, { useEffect, useState } from 'react';
import styles from '@/components/ui/StickyNav.module.css';
import Link from 'next/link';

export const StickyNav: React.FC = () => {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <nav className={`${styles.stickyNav} ${scrolled ? styles.scrolled : ''}`}> 
      <div className={styles.logo} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <img src="/img/logo.jpeg" alt="Techstar Money Solution Logo" style={{ height: '32px', width: '32px', borderRadius: '4px', objectFit: 'cover' }} />
        Techstar Money Solution
      </div>
      <div className={styles.navLinks}>
        <Link href="/" className={styles.navLink}>Home</Link>
        <Link href="/loans" className={styles.navLink}>Loans</Link>
        <Link href="/compare" className={styles.navLink}>Compare</Link>
        <Link href="/blog" className={styles.navLink}>Blog</Link>
        <Link href="/contact" className={styles.navLink}>Contact</Link>
      </div>
      <button className={styles.ctaButton}>Get Quote</button>
    </nav>
  );
};
