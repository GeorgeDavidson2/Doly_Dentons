export default function Home() {
  return (
    <main className="min-h-screen flex items-center justify-center">
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center gap-3 mb-8">
          <span className="text-4xl font-bold text-white">Doly</span>
          <span className="text-xs font-semibold tracking-widest text-brand-red uppercase px-2 py-1 border border-brand-red rounded">
            Dentons
          </span>
        </div>
        <h1 className="text-2xl font-semibold text-slate-300">
          One firm. Everywhere.
        </h1>
        <p className="text-slate-500 max-w-md mx-auto">
          Connecting 12,000 lawyers across 80+ countries into one seamless,
          intelligent network.
        </p>
        <div className="pt-6">
          <a
            href="/dashboard"
            className="inline-block bg-brand-red text-white px-6 py-3 rounded-lg font-medium hover:bg-red-700 transition-colors"
          >
            Enter Doly
          </a>
        </div>
      </div>
    </main>
  );
}
