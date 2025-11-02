import Image from "next/image";

interface ModShopLogoProps {
  className?: string
  size?: "sm" | "md" | "lg" | "xl"
  px?: number // optional explicit pixel size for larger logos
}

export function ModShopLogo({ className = "", size = "md", px }: ModShopLogoProps) {
  const sizeClasses = {
    sm: "w-[32px] h-[32px]",
    md: "w-[36px] h-[36px]",
    lg: "w-[44px] h-[44px]",
    xl: "w-[52px] h-[52px]",
  }

  return (
    <div className={`${px ? '' : sizeClasses[size]} ${className} relative flex items-center justify-center rounded-[8px] overflow-hidden`} style={px ? { width: px, height: px } : undefined}>
      <Image
        src="/mod-shop-logo3.png"
        alt="Mod Shop - Car Customization Platform"
        fill
        priority={size === 'xl'}
        sizes={px ? `${px}px` : "(max-width: 640px) 36px, (max-width: 1024px) 44px, 52px"}
        className="object-contain"
      />
    </div>
  )
}