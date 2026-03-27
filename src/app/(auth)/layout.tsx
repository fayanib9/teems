export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-surface-secondary flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center h-12 w-12 rounded-xl bg-primary-500 mb-3">
            <span className="text-white font-bold text-xl">T</span>
          </div>
          <h1 className="text-xl font-bold text-text-primary">TEEMS</h1>
          <p className="text-sm text-text-secondary mt-1">Event & Exhibition Management</p>
        </div>
        {children}
      </div>
    </div>
  )
}
