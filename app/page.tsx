export default function Home() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-white">
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center gap-3 mb-8">
          <span className="text-4xl font-bold text-gray-900">Doly</span>
          <span className="text-xs font-semibold tracking-widest uppercase px-2 py-1 border border-brand-purple text-brand-purple rounded">
            Dentons
          </span>
        </div>
        <h1 className="text-2xl font-semibold text-gray-700">
          One firm. Everywhere.
        </h1>
        <p className="text-gray-500 max-w-md mx-auto">
          Connecting 12,000 lawyers across 80+ countries into one seamless,
          intelligent network.
        </p>
        <div className="pt-6">
          <a
            href="/dashboard"
            className="inline-block bg-brand-purple text-white px-6 py-3 rounded-lg font-medium hover:bg-brand-purple-dark transition-colors"
          >
            Enter Doly
          </a>
        </div>
      </div>
    </main>
  );
}
