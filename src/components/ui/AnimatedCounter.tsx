"use client"
import React, { useEffect, useRef } from "react"
import { useInView, useMotionValue, useSpring, animate } from "framer-motion"

interface AnimatedCounterProps {
  value: number
  suffix?: string
  decimals?: number
  duration?: number
}

export function AnimatedCounter({ value, suffix = "", decimals = 0, duration = 2.5 }: AnimatedCounterProps) {
  const ref = useRef<HTMLSpanElement>(null)
  const motionValue = useMotionValue(0)
  const springValue = useSpring(motionValue, {
    damping: 35,
    stiffness: 90,
  })
  
  const isInView = useInView(ref, { once: true, margin: "-50px" })

  useEffect(() => {
    if (isInView) {
      animate(motionValue, value, {
        duration: duration,
        ease: "easeOut",
      })
    }
  }, [motionValue, value, isInView, duration])

  useEffect(() => {
    return springValue.on("change", (latest) => {
      if (ref.current) {
        const formatted = latest.toFixed(decimals)
        const parts = formatted.split(".")
        // Format integer portion using Indian numbering system standard (en-IN)
        const intVal = parseInt(parts[0], 10)
        const intString = isNaN(intVal) ? "0" : intVal.toLocaleString("en-IN")
        
        const finalVal = parts.length > 1 ? `${intString}.${parts[1]}` : intString
        ref.current.textContent = `${finalVal}${suffix}`
      }
    })
  }, [springValue, decimals, suffix])

  return <span ref={ref} className="tabular-nums">0{suffix}</span>
}
