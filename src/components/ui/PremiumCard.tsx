"use client"
import React, { useRef, useState } from "react"
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion"
import { cn } from "@/lib/utils"

interface PremiumCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
  className?: string
  glowColor?: string
  enableTilt?: boolean
}

export function PremiumCard({
  children,
  className,
  glowColor = "rgba(37, 99, 235, 0.1)",
  enableTilt = true,
  ...props
}: PremiumCardProps) {
  const cardRef = useRef<HTMLDivElement>(null)
  const [mouseX, setMouseX] = useState(0)
  const [mouseY, setMouseY] = useState(0)
  const [hovering, setHovering] = useState(false)

  // Motion values for smooth spring-based 3D tilt
  const x = useMotionValue(0)
  const y = useMotionValue(0)

  // Spring configuration for premium elastic physics feel
  const springConfig = { damping: 25, stiffness: 220, mass: 0.5 }
  const rotateX = useSpring(useTransform(y, [-0.5, 0.5], [8, -8]), springConfig)
  const rotateY = useSpring(useTransform(x, [-0.5, 0.5], [-8, 8]), springConfig)

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return
    const rect = cardRef.current.getBoundingClientRect()
    const width = rect.width
    const height = rect.height

    const clientX = e.clientX - rect.left
    const clientY = e.clientY - rect.top

    setMouseX(clientX)
    setMouseY(clientY)

    // Values between -0.5 and 0.5 for 3D tilt
    const normX = (clientX / width) - 0.5
    const normY = (clientY / height) - 0.5
    
    x.set(normX)
    y.set(normY)
  }

  const handleMouseEnter = () => {
    setHovering(true)
  }

  const handleMouseLeave = () => {
    setHovering(false)
    x.set(0)
    y.set(0)
  }

  return (
    <motion.div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={{
        rotateX: enableTilt ? rotateX : 0,
        rotateY: enableTilt ? rotateY : 0,
        transformStyle: "preserve-3d",
      }}
      className={cn(
        "relative rounded-3xl border border-slate-150/60 dark:border-slate-800/80 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl shadow-lg hover:shadow-2xl transition-shadow duration-300 overflow-hidden group",
        className
      )}
      {...props}
    >
      {/* Background radial spotlight glow */}
      <div
        className="absolute inset-0 pointer-events-none transition-opacity duration-500 z-0"
        style={{
          opacity: hovering ? 1 : 0,
          background: `radial-gradient(400px circle at ${mouseX}px ${mouseY}px, ${glowColor}, transparent 80%)`,
        }}
      />

      {/* Decorative Border Glowing Edge */}
      <div
        className="absolute -inset-[1px] pointer-events-none rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 z-10"
        style={{
          background: `radial-gradient(150px circle at ${mouseX}px ${mouseY}px, rgba(37, 99, 235, 0.35), transparent 75%)`,
          maskImage: "linear-gradient(black, black) exclude, linear-gradient(black, black)",
          WebkitMaskComposite: "xor",
          maskComposite: "exclude",
        }}
      />

      {/* Card Content Wrapper preserving 3D space */}
      <div className="relative z-20 h-full w-full" style={{ transform: "translateZ(10px)" }}>
        {children}
      </div>
    </motion.div>
  )
}
