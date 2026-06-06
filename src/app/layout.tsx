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
          {process.env.NEXT_PUBLIC_ZONE === "local" && (
            <div className="fixed top-0 left-0 w-full z-[200] flex items-center justify-center gap-2 py-0.5 bg-amber-500 text-black text-[11px] font-bold tracking-widest uppercase select-none">
              <span>⚡</span> Local Dev
            </div>
          )}
          <AdminGuard>
            {children}
          </AdminGuard>
        </AppProvider>
      </body>
    </html>
  )
}
