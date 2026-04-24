import React, { useState } from 'react';
import { Mail, Lock, BarChart3, Moon } from 'lucide-react';
import { useDataStore } from '../store/useDataStore';
import { supabase } from '../lib/supabase';

export const LoginPage: React.FC = () => {
    const { setActivePage } = useDataStore();
    const [email, setEmail] = useState(() => localStorage.getItem('remembered_email') || '');
    const [password, setPassword] = useState(() => localStorage.getItem('remembered_password') || '');
    const [rememberMe, setRememberMe] = useState(() => localStorage.getItem('remember_me') === 'true');
    const [isLoading, setIsLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setErrorMessage(null);

        localStorage.setItem('remember_me', rememberMe ? 'true' : 'false');
        if (rememberMe) {
            localStorage.setItem('remembered_email', email.trim());
            localStorage.setItem('remembered_password', password);
        } else {
            localStorage.removeItem('remembered_email');
            localStorage.removeItem('remembered_password');
        }

        const { error } = await supabase.auth.signInWithPassword({
            email: email.trim(),
            password,
        });

        setIsLoading(false);

        if (error) {
            setErrorMessage(error.message);
            return;
        }

        setActivePage('measure');
    };

    return (
        <div className="relative min-h-screen flex font-['Inter',sans-serif] selection:bg-brand-primary/10">
                        {/* Full-screen loading overlay */}
            {isLoading && (
                <div className="absolute inset-0 z-50 bg-white/80 backdrop-blur-sm flex items-center justify-center">
                    <div className="w-8 h-8 border-2 border-slate-200 border-t-[#450a0a] rounded-full animate-spin" />
                </div>
            )}
            {/* Left Side: Dashboard Preview & Glassmorphism Card */}
            <div className="hidden lg:block lg:w-[60%] relative overflow-hidden bg-[#0A0A0B]">
                {/* Dashboard Image Overlay */}
                <div 
                    className="absolute inset-0 opacity-40 bg-cover bg-center"
                    style={{ 
                        backgroundImage: `url('https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&q=80&w=2070')`,
                        filter: 'brightness(0.6) contrast(1.2)'
                    }}
                />
                
                {/* Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-br from-[#0F0F12]/80 via-transparent to-[#450a0a]/20" />

                {/* Glassmorphism Card */}
                <div className="absolute inset-0 flex items-center justify-center p-12">
                    <div className="max-w-[480px] w-full bg-white/5 backdrop-blur-xl border border-white/10 rounded-[40px] p-12 shadow-2xl space-y-8 animate-in fade-in zoom-in duration-700">
                        <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center border border-white/20">
                            <BarChart3 className="text-white w-8 h-8" />
                        </div>
                        <div className="space-y-4">
                            <h1 className="text-4xl font-extrabold text-white leading-tight tracking-tight">
                                Unlock the power of <br />
                                your Marketing Mix.
                            </h1>
                            <p className="text-slate-300 text-lg leading-relaxed font-medium">
                                Optimize spend, predict outcomes, and visualize growth with Sol Analytics' advanced MMM dashboard.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Right Side: Login Form */}
            <div className="w-full lg:w-[40%] bg-white flex flex-col relative">
                <div className="flex-1 flex flex-col justify-center px-8 sm:px-12 lg:px-20 max-w-[600px] mx-auto w-full">
                    {/* Header & Logo */}
                    <div className="space-y-0 mb-12">
                        <div className="flex flex-col items-center">
                            <img 
                                src="/sol_analytics_logo.jpg" 
                                alt="Sol Analytics" 
                                className="h-28 w-auto object-contain"
                            />
                        </div>

                        <div className="space-y-2 text-center">
                            <h3 className="text-3xl font-black text-[#1F2937]">Welcome Back</h3>
                            <p className="text-slate-500 font-medium">Please enter your details to sign in.</p>
                        </div>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleLogin} className="space-y-6">
                        <div className="space-y-5">
                            <div className="space-y-2">
                                <label htmlFor="login-email" className="text-xs font-bold text-slate-600 ml-1">Email Address</label>
                                <div className="relative group">
                                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#450a0a] transition-colors">
                                        <Mail size={18} />
                                    </div>
                                    <input
                                        id="login-email"
                                        type="email"
                                        required
                                        className="w-full bg-[#F9FAFB] border border-slate-200 rounded-2xl py-3.5 pl-12 pr-4 text-slate-900 text-sm font-semibold focus:border-[#450a0a] outline-none focus:ring-4 focus:ring-[#450a0a]/5 transition-all"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="jane@solanalytics.com"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label htmlFor="login-password" className="text-xs font-bold text-slate-600 ml-1">Password</label>
                                <div className="relative group">
                                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#450a0a] transition-colors">
                                        <Lock size={18} />
                                    </div>
                                    <input
                                        id="login-password"
                                        type="password"
                                        required
                                        className="w-full bg-[#F9FAFB] border border-slate-200 rounded-2xl py-3.5 pl-12 pr-4 text-slate-900 text-sm font-semibold focus:border-[#450a0a] outline-none focus:ring-4 focus:ring-[#450a0a]/5 transition-all"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder="••••••••"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center justify-between text-xs font-bold px-1">
                            <label className="flex items-center gap-2 text-slate-500 cursor-pointer group">
                                <input 
                                    type="checkbox" 
                                    className="w-4 h-4 rounded border-slate-300 text-[#450a0a] focus:ring-[#450a0a]"
                                    checked={rememberMe}
                                    onChange={(e) => setRememberMe(e.target.checked)}
                                />
                                <span className="group-hover:text-slate-700 transition-colors">Remember me for 30 days</span>
                            </label>
                            <button type="button" className="text-[#450a0a] hover:underline">Forgot Password?</button>
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full bg-[#450a0a] hover:bg-[#5C1010] text-white font-bold py-4 rounded-xl shadow-lg shadow-brand-primary/10 transition-all flex items-center justify-center gap-2 group disabled:opacity-70"
                        >
                            {isLoading ? (
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : "Log In"}
                        </button>

                        {errorMessage ? (
                            <p className="text-sm font-medium text-red-700" role="alert">
                                {errorMessage}
                            </p>
                        ) : null}
                    </form>

                    {/* Social Login */}
                    <div className="mt-8 space-y-6">
                        <div className="relative">
                            <div className="absolute inset-0 flex items-center">
                                <span className="w-full border-t border-slate-100"></span>
                            </div>
                            <div className="relative flex justify-center text-[10px] font-black uppercase tracking-widest">
                                <span className="bg-white px-4 text-slate-400">Or continue with</span>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <button className="flex items-center justify-center gap-2 px-4 py-3 border border-slate-200 rounded-xl hover:bg-slate-50 transition-all text-xs font-bold text-slate-700">
                                <img src="https://www.svgrepo.com/show/475656/google-color.svg" className="w-4 h-4" alt="Google" />
                                Google
                            </button>
                            <button className="flex items-center justify-center gap-2 px-4 py-3 border border-slate-200 rounded-xl hover:bg-slate-50 transition-all text-xs font-bold text-slate-700">
                                <img src="https://www.svgrepo.com/show/448239/microsoft.svg" className="w-4 h-4" alt="Microsoft" />
                                Microsoft
                            </button>
                        </div>

                        <p className="text-center text-xs text-slate-500 font-bold">
                            Don't have an account? <button onClick={() => setActivePage('signup')} className="text-[#450a0a] hover:underline">Sign up</button>
                        </p>
                    </div>
                </div>

                {/* Dark Mode Toggle Placeholder */}
                <div className="absolute bottom-8 right-8">
                    <button className="w-10 h-10 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-all">
                        <Moon size={18} />
                    </button>
                </div>
            </div>
        </div>
    );
};



