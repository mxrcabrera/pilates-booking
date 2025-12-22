import type { Metadata, Viewport } from "next";
import { Inter, Cormorant_Garamond, Raleway } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { GalaxyBackground } from "@/components/galaxy-background";

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
  variable: "--font-inter",
  preload: true,
});

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400"],
  display: "optional",
  variable: "--font-serif",
  preload: false,
});

const raleway = Raleway({
  subsets: ["latin"],
  weight: ["400"],
  display: "optional",
  variable: "--font-body",
  preload: false,
});

export const metadata: Metadata = {
  title: "Pilates Booking",
  description: "Sistema de gestión para clases de pilates",
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body className={`${inter.className} ${inter.variable} ${cormorant.variable} ${raleway.variable}`}>
        <GalaxyBackground />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}