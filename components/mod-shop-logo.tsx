interface ModShopLogoProps {
  className?: string
  size?: "sm" | "md" | "lg" | "xl"
}

export function ModShopLogo({ className = "", size = "md" }: ModShopLogoProps) {
  const sizeClasses = {
    sm: "w-[32px] h-[32px]",
    md: "w-[36px] h-[36px]",
    lg: "w-[44px] h-[44px]",
    xl: "w-[52px] h-[52px]",
  }

  return (
    <div className={`${sizeClasses[size]} ${className} flex items-center justify-center rounded-[8px] overflow-hidden`}>
      <img
        src="/mod-shop-logo3.png"
        alt="Mod Shop - Car Customization Platform"
        className="w-full h-full object-contain"
      />
    </div>
  )
}