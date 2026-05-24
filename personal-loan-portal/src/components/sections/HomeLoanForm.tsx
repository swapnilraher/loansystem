"use client"
import React, { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { leadFormSchema, LeadFormData } from "@/lib/schemas"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { ShieldCheck, Lock, ArrowRight, Home } from "lucide-react"
import { cn } from "@/lib/utils"

import { db } from "@/lib/firebase"
import { collection, addDoc, serverTimestamp } from "firebase/firestore"

export function HomeLoanForm() {
  const [step, setStep] = useState(1) // 1: Form, 2: Success
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LeadFormData>({
    resolver: zodResolver(leadFormSchema),
    defaultValues: {
      employmentType: "Salaried"
    }
  })

  const onSubmit = async (data: LeadFormData) => {
    try {
      console.log("Saving Home Loan Lead via API:", data)
      const response = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          source: "Website - Home Loan",
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save lead');
      }
      
      setStep(2)
    } catch (error: any) {
      console.error("Error saving lead:", error)
      alert(`Error: ${error.message}`)
    }
  }

  return (
    <div className="bg-white p-8 rounded-[2.5rem] shadow-2xl border border-slate-100 max-w-md w-full mx-auto relative overflow-hidden">
      <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/2" />
      
      <div className="flex items-center gap-4 mb-8">
        <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center text-primary shadow-sm">
          <Home size={28} />
        </div>
        <div>
          <h3 className="font-black text-secondary text-xl">Apply for Home Loan</h3>
          <p className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground flex items-center gap-1">
            <Lock size={10} className="text-green-500" /> 100% Secure & Private
          </p>
        </div>
      </div>

      {step === 1 ? (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <Input
            label="Full Name"
            placeholder="As per PAN card"
            {...register("fullName")}
            error={errors.fullName?.message}
          />
          
          <Input
            label="Mobile Number"
            placeholder="10-digit mobile number"
            {...register("mobileNumber")}
            error={errors.mobileNumber?.message}
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Property Value (₹)"
              placeholder="Est. cost"
              type="number"
              {...register("monthlyIncome")}
              error={errors.monthlyIncome?.message}
            />
            <div className="space-y-1.5">
              <label className="text-sm font-bold text-slate-700">Employment</label>
              <select
                {...register("employmentType")}
                className={cn(
                  "flex h-12 w-full rounded-xl border border-input bg-white px-3 py-2 text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary shadow-sm",
                  errors.employmentType && "border-red-500"
                )}
              >
                <option value="Salaried">Salaried</option>
                <option value="Self-Employed">Self-Employed</option>
              </select>
            </div>
          </div>

          <Input
            label="City"
            placeholder="Property location"
            {...register("city")}
            error={errors.city?.message}
          />

          <Input
            label="Required Loan (₹)"
            placeholder="₹ Loan amount"
            type="number"
            {...register("loanAmount")}
            error={errors.loanAmount?.message}
          />

          <Button
            type="submit"
            className="w-full h-14 rounded-2xl text-lg font-black uppercase tracking-wider transition-all active:scale-95"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Processing..." : "Check Offers"}
            {!isSubmitting && <ArrowRight className="ml-2" size={18} />}
          </Button>

          <p className="text-[10px] text-center text-muted-foreground mt-4 leading-relaxed font-medium">
            By clicking, you authorize TechStar to contact you for home loan assistance.
          </p>
        </form>
      ) : (
        <div className="py-10 text-center space-y-6 animate-in fade-in zoom-in duration-500">
          <div className="w-20 h-20 bg-green-50 text-green-500 rounded-full flex items-center justify-center mx-auto shadow-inner">
            <ShieldCheck size={40} />
          </div>
          <div className="space-y-2">
            <h3 className="text-2xl font-black text-secondary tracking-tight">Success!</h3>
            <p className="text-muted-foreground text-sm font-medium">
              Your application has been submitted successfully. Our expert will contact you shortly.
            </p>
          </div>
          <Button 
            className="w-full h-14 rounded-2xl font-black text-lg bg-emerald-500 hover:bg-emerald-600 shadow-lg shadow-emerald-200" 
            onClick={() => setStep(1)}
          >
            Submit Another
          </Button>
        </div>
      )}
    </div>
  )
}
