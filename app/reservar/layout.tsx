import { SessionProvider } from '@/components/session-provider'

export default function ReservarLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <SessionProvider>
      {children}
    </SessionProvider>
  )
}
