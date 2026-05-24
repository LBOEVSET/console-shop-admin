import "./globals.css"
import AdminGuard from "@/components/layout/admin-guard"
import AppProvider from "@/providers/app-provider"

export default function RootLayout({
  children
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <AppProvider>
          <AdminGuard>
            {children}
          </AdminGuard>
        </AppProvider>
      </body>
    </html>
  )
}
