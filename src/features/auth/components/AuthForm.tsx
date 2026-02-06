'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';

export function AuthForm() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [mode, setMode] = useState<'signin' | 'signup'>('signin');
    const [message, setMessage] = useState<string | null>(null);

    const supabase = createClient();

    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setMessage(null);

        try {
            if (mode === 'signup') {
                const { error } = await supabase.auth.signUp({
                    email,
                    password,
                    options: {
                        emailRedirectTo: `${location.origin}/auth/callback`,
                        data: { full_name: email.split('@')[0] }, // Default name
                    },
                });
                if (error) throw error;
                setMessage('Check your email for the confirmation link!');
            } else {
                const { error } = await supabase.auth.signInWithPassword({
                    email,
                    password,
                });
                if (error) throw error;
                window.location.href = '/dashboard'; // Force refresh/redirect
            }
        } catch (err: any) {
            setMessage(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Card className="w-full max-w-md relative overflow-hidden">
            <div className="mb-8 text-center space-y-2">
                <h2 className="text-2xl font-bold tracking-tight text-white">
                    {mode === 'signin' ? 'Welcome Back' : 'Create Account'}
                </h2>
                <p className="text-[var(--text-secondary)] text-sm">
                    {mode === 'signin' ? 'Enter your credentials to access the terminal.' : 'Join the protocol to begin training.'}
                </p>
            </div>

            <form onSubmit={handleAuth} className="space-y-6">
                <Input
                    label="Email Address"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="YOU@EXAMPLE.COM"
                    required
                />
                <Input
                    label="Password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                />

                {message && (
                    <div className={`p-4 rounded-[var(--radius-sm)] text-sm font-bold text-center ${mode === 'signup' && !message.includes('error') ? 'bg-green-900/50 text-green-400' : 'bg-red-900/50 text-red-400'}`}>
                        {message}
                    </div>
                )}

                <Button type="submit" fullWidth disabled={loading} size="lg">
                    {loading ? 'Processing...' : mode === 'signin' ? 'Enter Gym' : 'Sign Up Now'}
                </Button>
            </form>

            <div className="mt-6 text-center">
                <button
                    onClick={() => {
                        setMode(mode === 'signin' ? 'signup' : 'signin');
                        setMessage(null);
                    }}
                    className="text-sm text-[var(--accent-primary)] hover:text-[var(--accent-secondary)] transition-colors font-medium"
                >
                    {mode === 'signin' ? "No account? Initialize Protocol" : "Existing user? Access Terminal"}
                </button>
            </div>
        </Card>
    );
}
