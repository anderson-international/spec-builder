import Link from 'next/link'

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 sm:p-24">
      <div className="card max-w-3xl w-full text-center">
        <h1 className="text-3xl font-bold mb-4">Spec Builder</h1>
        <p className="mb-8">A tool for managing tobacco snuff product specifications</p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <Link href="/auth/login" className="btn btn-blue w-full">
            Login
          </Link>
          <Link href="/specifications" className="btn btn-green w-full">
            View Specifications
          </Link>
        </div>
        
        <div className="text-sm text-divider">
          <p>Access your product specifications and contribute to our product knowledge base</p>
        </div>
      </div>
    </main>
  )
}
