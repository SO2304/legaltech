import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Divorce Platform',
  description: 'Plateforme d\'analyse de dossiers de divorce',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  )
}
