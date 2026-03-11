import { Link } from 'react-router-dom'

const YEAR = new Date().getFullYear()

export default function Landing() {
  return (
    <div className="min-h-screen bg-white flex flex-col">

      {/* Nav */}
      <header className="border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between gap-4">
          <span className="text-xl font-bold text-brand-700 tracking-tight">DML BizCompanion</span>
          <Link
            to="/dashboard"
            className="text-sm font-medium text-brand-600 hover:text-brand-800 transition-colors whitespace-nowrap"
          >
            Dashboard →
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="flex-1 flex items-center justify-center px-6 py-24 bg-gradient-to-br from-brand-50 via-white to-orange-50">
        <div className="max-w-3xl text-center">
          <span className="inline-block mb-4 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-brand-600 bg-brand-100 rounded-full">
            Small Business Tools
          </span>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-gray-900 leading-tight mb-6">
            David's{' '}
            <span className="text-brand-600">Freelance Companion.</span>
          </h1>
          <p className="text-xl text-gray-500 max-w-2xl mx-auto mb-10">
            My midterm project is a multi-feature freelancer business companion app combining tools and implementation practices that I have learned throughout the semester so far. The site will help me keep track of my income and expenses as a business, be able to store files such as receipts, and help me stay on top of tasks I face as a freelancer.
          </p>
          <Link
            to="/dashboard"
            className="inline-block px-10 py-4 bg-brand-600 text-white text-lg font-semibold rounded-xl shadow-md hover:bg-brand-700 active:scale-95 transition-all duration-150"
          >
            Enter
          </Link>
        </div>
      </section>

      <footer className="py-6 text-center text-xs text-gray-400 border-t border-gray-100">
        © {YEAR} David Leggett — Made for DIG4503C, designed for life.
      </footer>
    </div>
  )
}
