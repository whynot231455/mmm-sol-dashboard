import React, { useState } from 'react';
import { Mail, Lock, User, BarChart3 } from 'lucide-react';
import { useDataStore } from '../store/useDataStore';

export const SignUpPage: React.FC = () => {
    const { setActivePage } = useDataStore();
    const [isLoading, setIsLoading] = useState(false);

    const handleSignUp = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setTimeout(() => {
            setIsLoading(false);
            setActivePage('measure');
        }, 800);
    };

    return (
        <div className="relative min-h-screen flex font-['Inter',sans-serif] selection:bg-brand-primary/10">
            {isLoading && (
                <div className="absolute inset-0 z-50 bg-white/80 backdrop-blur-sm flex items-center justify-center">
                    <div className="w-8 h-8 border-2 border-slate-200 border-t-[#450a0a] rounded-full animate-spin" />
                </div>
            )}
            <div className="hidden lg:block lg:w-[60%] relative overflow-hidden bg-[#0A0A0B]">
                <div 
                    className="absolute inset-0 opacity-40 bg-cover bg-center"
                    style={{ 
                        backgroundImage: `url('https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&q=80&w=2070')`,
                        filter: 'brightness(0.6) contrast(1.2)'
                    }}
                />
                <div className="absolute inset-0 bg-gradient-to-br from-[#0F0F12]/80 via-transparent to-[#450a0a]/20" />
                <div className="absolute inset-0 flex items-center justify-center p-12">
                    <div className="max-w-[480px] w-full bg-white/5 backdrop-blur-xl border border-white/10 rounded-[40px] p-12 shadow-2xl space-y-8 animate-in fade-in zoom-in duration-700">
                        <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center border border-white/20">
                            <BarChart3 className="text-white w-8 h-8" />
                        </div>
                        <div className="space-y-4">
                            <h1 className="text-4xl font-extrabold text-white leading-tight tracking-tight">
                                Start your journey with <br />
                                Sol Analytics.
                            </h1>
                            <p className="text-slate-300 text-lg leading-relaxed font-medium">
                                Join thousands of marketers optimizing their spend and visualizing growth with our advanced MMM dashboard.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="w-full lg:w-[40%] bg-white flex flex-col relative">
                <div className="flex-1 flex flex-col justify-center px-8 sm:px-12 lg:px-20 max-w-[600px] mx-auto w-full">
                    <div className="space-y-0 mb-8">
                        <div className="flex flex-col items-center">
                            <img src="/sol_analytics_logo.jpg" alt="Sol Analytics" className="h-28 w-auto object-contain" />
                        </div>
                        <div className="space-y-2 text-center">
                            <h3 className="text-3xl font-black text-[#1F2937]">Create Account</h3>
                            <p className="text-slate-500 font-medium text-sm">Please fill in your details to get started.</p>
                        </div>
                    </div>

                    <form onSubmit={handleSignUp} className="space-y-5">
                        <div className="space-y-4">
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-slate-600 ml-1">Full Name</label>
                                <div className="relative group">
                                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                                        <User size={18} />
                                    </div>
                                    <input type="text" defaultValue="Jane Doe" className="w-full bg-[#F9FAFB] border border-slate-200 rounded-2xl py-3 pl-12 pr-4 text-slate-900 text-sm font-semibold focus:border-[#450a0a] outline-none focus:ring-4 focus:ring-[#450a0a]/5 transition-all" placeholder="John Doe" />
                                </div>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-slate-600 ml-1">Work Email</label>
                                <div className="relative group">
                                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                                        <Mail size={18} />
                                    </div>
                                    <input type="email" defaultValue="demo@solanalytics.com" className="w-full bg-[#F9FAFB] border border-slate-200 rounded-2xl py-3 pl-12 pr-4 text-slate-900 text-sm font-semibold focus:border-[#450a0a] outline-none focus:ring-4 focus:ring-[#450a0a]/5 transition-all" placeholder="john@company.com" />
                                </div>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-slate-600 ml-1">Password</label>
                                <div className="relative group">
                                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                                        <Lock size={18} />
                                    </div>
                                    <input type="password" defaultValue="password" className="w-full bg-[#F9FAFB] border border-slate-200 rounded-2xl py-3 pl-12 pr-4 text-slate-900 text-sm font-semibold focus:border-[#450a0a] outline-none focus:ring-4 focus:ring-[#450a0a]/5 transition-all" placeholder="••••••••" />
                                </div>
                            </div>
                        </div>
                        <button type="submit" disabled={isLoading} className="w-full bg-[#450a0a] hover:bg-[#5C1010] text-white font-bold py-3.5 rounded-xl shadow-lg shadow-brand-primary/10 transition-all flex items-center justify-center gap-2 disabled:opacity-70">
                            {isLoading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : "Sign Up"}
                        </button>
                    </form>

                    <div className="mt-6 space-y-6">
                        <div className="relative">
                            <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-slate-100"></span></div>
                            <div className="relative flex justify-center text-[10px] font-black uppercase tracking-widest"><span className="bg-white px-4 text-slate-400">Or sign up with</span></div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <button className="flex items-center justify-center gap-2 px-4 py-3 border border-slate-200 rounded-xl hover:bg-slate-50 transition-all text-xs font-bold text-slate-700">
                                <img src="https://www.svgrepo.com/show/475656/google-color.svg" className="w-4 h-4" alt="Google" /> Google
                            </button>
                            <button className="flex items-center justify-center gap-2 px-4 py-3 border border-slate-200 rounded-xl hover:bg-slate-50 transition-all text-xs font-bold text-slate-700">
                                <img src="https://www.svgrepo.com/show/448239/microsoft.svg" className="w-4 h-4" alt="Microsoft" /> Microsoft
                            </button>
                        </div>
                        <p className="text-center text-xs text-slate-500 font-bold">
                            Already have an account? <button onClick={() => setActivePage('login')} className="text-[#450a0a] hover:underline">Log in</button>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};
