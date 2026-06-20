// src/components/ui/DynamicSections.tsx
"use client";

import dynamic from "next/dynamic";
import { AnimatedSection } from "@/components/ui/AnimatedSection";

const EligibilityWizard = dynamic(
  () => import("@/components/sections/EligibilityWizard").then((mod) => mod.EligibilityWizard),
  {
    loading: () => (
      <div className="h-[400px] flex items-center justify-center bg-slate-50/50 dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-slate-800/80">
        Loading Eligibility Wizard...
      </div>
    ),
  }
);

const EMICalculator = dynamic(
  () => import("@/components/sections/EMICalculator").then((mod) => mod.EMICalculator),
  {
    loading: () => (
      <div className="h-[400px] flex items-center justify-center bg-slate-50/50 dark:bg-slate-900/80 rounded-2xl border border-slate-100 dark:border-slate-800/80">
        Loading EMI Calculator...
      </div>
    ),
  }
);

const Testimonials = dynamic(
  () => import("@/components/sections/Testimonials").then((mod) => mod.Testimonials),
  {
    loading: () => (
      <div className="h-[300px] flex items-center justify-center bg-slate-50/50 dark:bg-slate-900/80 rounded-2xl border border-slate-100 dark:border-slate-800/80">
        Loading Reviews...
      </div>
    ),
  }
);

const FAQ = dynamic(
  () => import("@/components/sections/FAQ").then((mod) => mod.FAQ),
  {
    loading: () => (
      <div className="h-[300px] flex items-center justify-center bg-slate-50/50 dark:bg-slate-900/80 rounded-2xl border border-slate-100 dark:border-slate-800/80">
        Loading FAQs...
      </div>
    ),
  }
);

export default function DynamicSections() {
  return (
    <>
      <AnimatedSection>
        <EligibilityWizard />
      </AnimatedSection>
      <AnimatedSection>
        <EMICalculator />
      </AnimatedSection>
      <AnimatedSection>
        <Testimonials />
      </AnimatedSection>
      <AnimatedSection>
        <FAQ />
      </AnimatedSection>
    </>
  );
}
