import Link from 'next/link';

export default function BillingPage() {
    return (
        <div className="min-h-screen bg-gray-50 font-sans">
            {/* Header */}
            <div className="bg-white border-b border-gray-200">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        <Link href="/" className="text-2xl font-bold tracking-tighter text-gray-900">
                            Optimus
                        </Link>
                        <nav className="flex gap-6">
                            <Link href="/sessions" className="text-gray-500 hover:text-gray-900 font-medium">Logs</Link>
                            <Link href="/billing" className="text-forest-600 font-bold">Billing</Link>
                        </nav>
                    </div>
                </div>
            </div>

            <main className="max-w-6xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
                <div className="text-center mb-16">
                    <h1 className="text-4xl font-bold text-gray-900 mb-4">Invest in Autonomy</h1>
                    <p className="text-xl text-gray-500 max-w-2xl mx-auto">
                        Experience the power of Optimus risk-free. Pay only when you verify value.
                    </p>
                </div>

                {/* Pricing Tiers */}
                <div className="grid md:grid-cols-3 gap-8 mb-16">
                    {/* Free Tier */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 flex flex-col">
                        <h3 className="text-lg font-bold text-gray-500 uppercase tracking-widest mb-4">Discovery</h3>
                        <div className="text-5xl font-bold text-gray-900 mb-6">$0<span className="text-lg text-gray-400 font-medium">/mo</span></div>
                        <ul className="space-y-4 mb-8 flex-1 text-gray-600">
                            <li className="flex items-center gap-3">
                                <span className="w-2 h-2 bg-forest-500 rounded-full"></span>
                                3 Daily Missions
                            </li>
                            <li className="flex items-center gap-3">
                                <span className="w-2 h-2 bg-forest-500 rounded-full"></span>
                                Standard Execution Speed
                            </li>
                            <li className="flex items-center gap-3">
                                <span className="w-2 h-2 bg-forest-500 rounded-full"></span>
                                24h Log Retention
                            </li>
                        </ul>
                        <button className="w-full block text-center bg-gray-100 hover:bg-gray-200 text-gray-900 font-bold py-4 rounded-xl transition">
                            Current Plan
                        </button>
                    </div>

                    {/* Pro Tier - Highlighted */}
                    <div className="relative bg-white rounded-2xl shadow-xl border-2 border-forest-500 p-8 flex flex-col transform scale-105 z-10">
                        <div className="absolute top-0 right-0 bg-forest-500 text-white text-xs font-bold px-3 py-1 rounded-bl-xl rounded-tr-lg uppercase tracking-wider">
                            Recommended
                        </div>
                        <h3 className="text-lg font-bold text-forest-600 uppercase tracking-widest mb-4">Professional</h3>
                        <div className="text-5xl font-bold text-gray-900 mb-6">$49<span className="text-lg text-gray-400 font-medium">/mo</span></div>
                        <ul className="space-y-4 mb-8 flex-1 text-gray-600">
                            <li className="flex items-center gap-3">
                                <span className="w-2 h-2 bg-forest-500 rounded-full"></span>
                                50 Daily Missions
                            </li>
                            <li className="flex items-center gap-3">
                                <span className="w-2 h-2 bg-forest-500 rounded-full"></span>
                                Priority Execution Channels
                            </li>
                            <li className="flex items-center gap-3">
                                <span className="w-2 h-2 bg-forest-500 rounded-full"></span>
                                Cost Analysis Dashboard
                            </li>
                            <li className="flex items-center gap-3">
                                <span className="w-2 h-2 bg-forest-500 rounded-full"></span>
                                30-Day Log Retention
                            </li>
                        </ul>
                        <button className="w-full block text-center bg-forest-600 hover:bg-forest-500 text-white font-bold py-4 rounded-xl shadow-md transition uppercase tracking-wide text-sm">
                            Start Risk-Free Trial
                        </button>
                    </div>

                    {/* Enterprise Tier */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 flex flex-col">
                        <h3 className="text-lg font-bold text-gray-500 uppercase tracking-widest mb-4">Authority</h3>
                        <div className="text-5xl font-bold text-gray-900 mb-6">Custom</div>
                        <ul className="space-y-4 mb-8 flex-1 text-gray-600">
                            <li className="flex items-center gap-3">
                                <span className="w-2 h-2 bg-forest-500 rounded-full"></span>
                                Unlimited Missions
                            </li>
                            <li className="flex items-center gap-3">
                                <span className="w-2 h-2 bg-forest-500 rounded-full"></span>
                                Dedicated Compute Nodes
                            </li>
                            <li className="flex items-center gap-3">
                                <span className="w-2 h-2 bg-forest-500 rounded-full"></span>
                                SSO & Audit Logs
                            </li>
                            <li className="flex items-center gap-3">
                                <span className="w-2 h-2 bg-forest-500 rounded-full"></span>
                                1-Year Log Retention
                            </li>
                        </ul>
                        <button className="w-full block text-center bg-white border border-gray-300 hover:bg-gray-50 text-gray-900 font-bold py-4 rounded-xl transition">
                            Contact Sales
                        </button>
                    </div>
                </div>

                {/* Risk Free Guarantee */}
                <div className="bg-forest-50 border border-forest-100 rounded-2xl p-8 flex flex-col md:flex-row items-center gap-8">
                    <div className="flex-1">
                        <h3 className="text-2xl font-bold text-forest-800 mb-2">The ROI Guarantee</h3>
                        <p className="text-forest-700">
                            We believe in proving value first. If Optimus doesn't save you at least 5 hours of work in your first month, you don't pay a cent. Cancel anytime with one click.
                        </p>
                    </div>
                    <div className="flex-shrink-0">
                        <div className="bg-white p-4 rounded-lg border border-forest-200 shadow-sm text-center">
                            <div className="text-sm text-gray-500 font-mono mb-1">CURRENT SAVINGS</div>
                            <div className="text-3xl font-bold text-forest-600">0h 0m</div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
