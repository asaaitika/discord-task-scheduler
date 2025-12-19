import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Discord Task Scheduler',
  description: 'Schedule tasks and send notifications to Discord',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
