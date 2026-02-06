import { AuthForm } from '@/features/auth/components/AuthForm';

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Background Ambience */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-[-20%] left-[-20%] w-[50%] h-[50%] bg-[var(--accent-primary)] rounded-full blur-[150px] opacity-20 animate-pulse" />
        <div className="absolute bottom-[-20%] right-[-20%] w-[50%] h-[50%] bg-[var(--accent-secondary)] rounded-full blur-[150px] opacity-20 animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      <div className="z-10 w-full max-w-md flex flex-col items-center">
        <h1 className="text-6xl font-bold text-center mb-2 bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent tracking-tight">
          DAD<span className="text-[var(--accent-primary)]">.</span>GYM
        </h1>
        <p className="text-[var(--text-secondary)] font-medium tracking-wide mb-12 text-sm">
          EFFORTLESS PROGRESSIVE OVERLOAD
        </p>

        <AuthForm />
      </div>
    </main>
  );
}
