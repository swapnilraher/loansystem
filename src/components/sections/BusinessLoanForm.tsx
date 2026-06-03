"use client"

import React, { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { leadFormSchema, LeadFormData } from "@/lib/schemas"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { ShieldCheck, Lock, ArrowRight, CheckCircle2, Briefcase } from "lucide-react"
import { cn } from "@/lib/utils"

export function BusinessLoanForm() {
  const [step, setStep] = useState(1) // 1: Form, 3: Success
  const [progress, setProgress] = useState(0)

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<LeadFormData>({
    resolver: zodResolver(leadFormSchema),
  })

  const formValues = watch()

  // Auto-save & Progress Calculation
  useEffect(() => {
    const savedData = localStorage.getItem("business_loan_draft")
    if (savedData) {
      const parsed = JSON.parse(savedData)
      Object.keys(parsed).forEach((key) => {
        setValue(key as any, parsed[key])
      })
    }
  }, [setValue])

  useEffect(() => {
    localStorage.setItem("business_loan_draft", JSON.stringify(formValues))
    
    // Calculate progress based on filled fields
    const totalFields = 6
    const filledFields = Object.values(formValues).filter(v => v && v !== "").length
    setProgress((filledFields / totalFields) * 100)
  }, [formValues])

  const onSubmit = async (data: LeadFormData) => {
    try {
      console.log("Saving Business Loan Lead via API:", data)
      const response = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          source: "Website - Business Loan",
          type: "Business Loan",
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save lead');
      }
      
      localStorage.removeItem("business_loan_draft")
      setStep(3) // Success
    } catch (error: any) {
      console.error("Error saving lead:", error)
      alert(`Error: ${error.message}`)
    }
  }

  return (
    <div className="bg-white p-6 rounded-3xl shadow-xl border border-slate-100 max-w-md w-full mx-auto relative overflow-hidden text-left">
      {/* Progress Bar */}
      {step === 1 && (
        <div className="absolute top-0 left-0 w-full h-1.5 bg-slate-100">
          <div 
            className="h-full bg-primary transition-all duration-500 ease-out" 
            style={{ width: `${progress}%` }} 
          />
        </div>
      )}

      {step === 1 && (
        <>
          <div className="flex items-center gap-4 mb-8">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shadow-sm">
              <Briefcase size={28} />
            </div>
            <div>
              <h3 className="font-black text-secondary text-xl">Business Loan Eligibility</h3>
              <p className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground flex items-center gap-1">
                <Lock size={10} className="text-green-500" /> 100% Secure & Private
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Input
              label="Full Name (Proprietor)"
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
                label="Monthly Turnover"
                placeholder="₹"
                type="number"
                {...register("monthlyIncome")}
                error={errors.monthlyIncome?.message}
              />
              <div className="space-y-1.5">
                <label className="text-sm font-bold text-slate-700">Employment</label>
                <select
                  {...register("employmentType")}
                  className={cn(
                    "flex h-10 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary shadow-sm",
                    errors.employmentType && "border-red-500"
                  )}
                >
                  <option value="Self-Employed">Self-Employed</option>
                  <option value="Salaried">Salaried</option>
                </select>
              </div>
            </div>

            <Input
              label="City"
              placeholder="Enter your city"
              {...register("city")}
              error={errors.city?.message}
            />

            <Input
              label="Required Capital"
              placeholder="₹ Loan amount needed"
              type="number"
              {...register("loanAmount")}
              error={errors.loanAmount?.message}
            />

            <Button
              type="submit"
              className="w-full h-11 text-xs font-black uppercase tracking-wider bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 border-none text-white"
              size="md"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Processing..." : "Get Business Quotes"}
              {!isSubmitting && <ArrowRight className="ml-2" size={14} />}
            </Button>

            <p className="text-[10px] text-center text-muted-foreground mt-4 leading-relaxed font-medium">
              By clicking, you agree to our Terms & Conditions and authorize us to contact you for business finance requirements.
            </p>
          </form>
        </>
      )}

      {step === 3 && (
        <div className="text-center space-y-8 py-10 animate-in fade-in zoom-in duration-500">
          <div className="w-24 h-24 bg-green-50 text-green-500 rounded-full flex items-center justify-center mx-auto shadow-inner">
            <CheckCircle2 size={48} />
          </div>
          <div className="space-y-3">
            <h3 className="text-3xl font-black text-secondary tracking-tight">Thank You!</h3>
            <p className="text-slate-500 font-medium leading-relaxed">
              Your application has been received. Our business finance expert will call you within 15 minutes.
            </p>
          </div>
          <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Application ID</p>
            <p className="text-xl font-mono font-black text-secondary">TS-BL-{Math.floor(Math.random()*90000) + 10000}</p>
          </div>
          <Button 
            className="w-full h-11 font-black text-xs uppercase tracking-wider bg-emerald-500 hover:bg-emerald-600 shadow-lg shadow-emerald-200 text-white" 
            onClick={() => setStep(1)}
          >
            Done
          </Button>
        </div>
      )}
    </div>
  )
}
