import { AuthForm } from '@/features/auth/components/AuthForm';

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Background Ambience */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-[-20%] left-[-20%] w-[50%] h-[50%] bg-[var(--color-primary)] rounded-full blur-[150px] opacity-10 animate-pulse" />
        <div className="absolute bottom-[-20%] right-[-20%] w-[50%] h-[50%] bg-[var(--color-accent)] rounded-full blur-[150px] opacity-5 animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      <div className="z-10 w-full max-w-md flex flex-col items-center">
        <h1 className="text-[5rem] leading-[0.85] text-center mb-2 bg-gradient-to-br from-white to-gray-400 bg-clip-text text-transparent drop-shadow-2xl">
          DAD<br />GYM
        </h1>
        <p className="text-[var(--color-text-muted)] font-bold tracking-[0.2em] mb-12 uppercase text-xs">
          Effortless Progressive Overload
        </p>

        <AuthForm />
      </div>
    </main>
  );
}
