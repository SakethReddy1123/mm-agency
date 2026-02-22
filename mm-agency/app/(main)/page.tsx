export default function DashboardPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight text-white">
        Dashboard
      </h1>
      <p className="mt-1 text-zinc-500">
        Overview of your agency.
      </p>
      <div className="mt-8 rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
        <h2 className="text-lg font-medium text-white">Welcome</h2>
        <p className="mt-1 text-zinc-400">
          Your content and tools can go here.
        </p>
      </div>
    </div>
  );
}
