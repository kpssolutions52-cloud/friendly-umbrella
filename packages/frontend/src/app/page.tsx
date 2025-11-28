export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="z-10 max-w-5xl w-full items-center justify-between font-mono text-sm">
        <h1 className="text-4xl font-bold mb-4">Construction Pricing Platform</h1>
        <p className="text-lg mb-8">
          Real-time pricing platform connecting suppliers with construction companies
        </p>
        <div className="flex gap-4">
          <a
            href="/auth/login"
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:opacity-90"
          >
            Login
          </a>
          <a
            href="/auth/register"
            className="px-4 py-2 border border-border rounded-md hover:bg-accent"
          >
            Register
          </a>
        </div>
      </div>
    </main>
  );
}

