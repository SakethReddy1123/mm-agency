export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    try {
      const { initDb } = await import("./lib/db");
      await initDb();
    } catch (err) {
      // Do not block app startup if DB is unreachable (e.g. ECONNRESET, network).
      // API routes that need the DB will call initDb() and handle errors per request.
      console.error("[instrumentation] initDb failed:", err instanceof Error ? err.message : err);
    }
  }
}
