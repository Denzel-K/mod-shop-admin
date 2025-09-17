import type { Metadata } from "next";
import { Raleway, Ubuntu_Mono } from "next/font/google";
import "./globals.css";

const raleway = Raleway({
  variable: "--font-raleway",
  subsets: ["latin"],
  display: "swap",
});

const ubuntuMono = Ubuntu_Mono({
  variable: "--font-ubuntu-mono",
  subsets: ["latin"],
  weight: ["400", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Mod Shop Admin Portal",
  description: "Asset management hub for the ultimate car customization platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${raleway.variable} ${ubuntuMono.variable} font-sans antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
