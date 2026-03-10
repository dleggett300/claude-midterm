import { Link } from 'react-router-dom'

const features = [
  {
    icon: '↑',
    title: 'Income Tracking',
    description: 'Log every sale and payment. Categorize revenue streams and watch your income grow month over month.',
    color: 'bg-green-50 text-green-600',
  },
  {
    icon: '↓',
    title: 'Expense Management',
    description: 'Record and categorize outgoing costs. Know exactly where your money is going at a glance.',
    color: 'bg-red-50 text-red-600',
  },
  {
    icon: '🗂',
    title: 'Receipt Storage',
    description: 'Upload and store receipts digitally. Never lose proof of purchase for tax time again.',
    color: 'bg-blue-50 text-blue-600',
  },
  {
    icon: '✓',
    title: 'Task Tracking',
    description: 'Stay on top of your to-dos. Manage daily business tasks and mark them complete as you go.',
    color: 'bg-purple-50 text-purple-600',
  },
]

export default function Landing() {
  return (
    <div className="min-h-screen bg-white flex flex-col">

      {/* Nav */}
      <header className="border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <span className="text-xl font-bold text-brand-700 tracking-tight">BizTrack</span>
          <Link
            to="/dashboard"
            className="text-sm font-medium text-brand-600 hover:text-brand-800 transition-colors"
          >
            Go to Dashboard →
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="flex-1 flex items-center justify-center px-6 py-24 bg-gradient-to-br from-brand-50 via-white to-blue-50">
        <div className="max-w-3xl text-center">
          <span className="inline-block mb-4 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-brand-600 bg-brand-100 rounded-full">
            Small Business Tools
          </span>
          <h1 className="text-5xl sm:text-6xl font-extrabold text-gray-900 leading-tight mb-6">
            Run your business.{' '}
            <span className="text-brand-600">Stay in control.</span>
          </h1>
          <p className="text-xl text-gray-500 max-w-xl mx-auto mb-10">
            BizTrack brings income, expenses, receipts, and tasks into one clean dashboard — built for small business owners who want clarity, not complexity.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/dashboard"
              className="px-8 py-3 bg-brand-600 text-white font-semibold rounded-xl shadow-md hover:bg-brand-700 active:scale-95 transition-all duration-150"
            >
              Open Dashboard
            </Link>
            <a
              href="#features"
              className="px-8 py-3 bg-white text-brand-700 font-semibold rounded-xl border border-brand-200 hover:border-brand-400 hover:bg-brand-50 active:scale-95 transition-all duration-150"
            >
              See Features
            </a>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-24 px-6 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Everything you need. Nothing you don't.</h2>
            <p className="text-gray-500 max-w-xl mx-auto">
              Four focused tools that work together to give you a complete picture of your business.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map(({ icon, title, description, color }) => (
              <div
                key={title}
                className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-200"
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl mb-4 ${color}`}>
                  {icon}
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">{title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA footer */}
      <section className="py-16 px-6 bg-brand-700 text-white text-center">
        <h2 className="text-2xl font-bold mb-4">Ready to take control?</h2>
        <p className="text-brand-200 mb-8">Jump into the dashboard and start tracking today.</p>
        <Link
          to="/dashboard"
          className="inline-block px-8 py-3 bg-white text-brand-700 font-semibold rounded-xl hover:bg-brand-50 active:scale-95 transition-all duration-150"
        >
          Get Started
        </Link>
      </section>

      <footer className="py-6 text-center text-xs text-gray-400 border-t border-gray-100">
        © {new Date().getFullYear()} BizTrack. Built for small business.
      </footer>
    </div>
  )
}
