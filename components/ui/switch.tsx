"use client"

import * as React from "react"
import * as SwitchPrimitive from "@radix-ui/react-switch"

import { cn } from "@/lib/utils"

function Switch({
  className,
  ...props
}: React.ComponentProps<typeof SwitchPrimitive.Root>) {
  return (
    <SwitchPrimitive.Root
      data-slot="switch"
      className={cn(
        // Track colors for deep blue dark theme
        "peer inline-flex h-[1.15rem] w-8 shrink-0 items-center rounded-full border shadow-xs transition-all outline-none",
        "data-[state=checked]:bg-blue-500 data-[state=unchecked]:bg-slate-700/80",
        "border-slate-600/40",
        // Focus ring
        "focus-visible:ring-[3px] focus-visible:ring-blue-500/40 focus-visible:border-blue-500",
        // Disabled
        "disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    >
      <SwitchPrimitive.Thumb
        data-slot="switch-thumb"
        className={cn(
          // Light thumb for contrast in dark theme with smooth translate
          "pointer-events-none block size-4 rounded-full ring-0 transition-transform",
          "data-[state=checked]:translate-x-[calc(100%-2px)] data-[state=unchecked]:translate-x-0",
          // Thumb colors per state
          "data-[state=checked]:bg-slate-100 data-[state=unchecked]:bg-slate-300"
        )}
      />
    </SwitchPrimitive.Root>
  )
}

export { Switch }
