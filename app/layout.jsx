export const metadata = { title: 'LendGuard', description: 'Autonomous USDT Lending Position Manager' }

export default function RootLayout ({ children }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, background: '#0a0f2e', color: '#e2e8f0', fontFamily: 'system-ui, sans-serif' }}>
        {children}
      </body>
    </html>
  )
}
