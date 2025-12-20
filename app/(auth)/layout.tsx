import type { Metadata } from "next";
import "../../app/globals.css";

export const metadata: Metadata = {
  title: "Pilates Booking",
  description: "Sistema de gestión para clases de pilates",
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="auth-container">
      {children}
    </div>
  )
}