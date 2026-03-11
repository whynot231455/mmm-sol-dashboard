import React from 'react';
import { 
  Workflow, 
  TrendingUp, 
  Users, 
  Target, 
  Zap, 
  ShieldCheck, 
  ArrowRight,
  Activity,
  Brain
} from 'lucide-react';
import { useDataStore } from '../store/useDataStore';

interface PipelineCardProps {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  accuracy: string;
  status: 'Ready' | 'Training' | 'Deployed';
  onClick: () => void;
}

const PipelineCard = ({ 
  title, 
  description, 
  icon, 
  accuracy, 
  status, 
  onClick 
}: PipelineCardProps) => (
  <div 
    onClick={onClick}
    className="group relative flex flex-col h-full bg-white border border-slate-200 rounded-[2rem] p-8 hover:shadow-2xl hover:shadow-brand-primary/5 hover:border-brand-primary/20 transition-all duration-500 cursor-pointer overflow-hidden"
  >
    {/* Background Glow */}
    <div className="absolute top-0 right-0 w-32 h-32 bg-brand-primary/5 rounded-full blur-[80px] group-hover:bg-brand-primary/10 transition-colors duration-700" />
    
    <div className="relative z-10 flex flex-col h-full">
      <div className="flex items-center justify-between mb-8">
        <div className="p-3.5 bg-slate-50 rounded-2xl text-slate-900 group-hover:bg-brand-primary/10 group-hover:text-brand-primary transition-all duration-500">
          {icon}
        </div>
        <div className="flex flex-col items-end gap-1.5">
          <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
            status === 'Ready' ? 'bg-emerald-50 text-emerald-600' : 
            status === 'Training' ? 'bg-amber-50 text-amber-600' : 'bg-blue-50 text-blue-600'
          }`}>
            {status}
          </span>
          <div className="flex items-center gap-1">
            <Activity size={10} className="text-emerald-500" />
            <span className="text-[11px] font-bold text-slate-500">{accuracy}</span>
          </div>
        </div>
      </div>

      <div className="flex-1">
        <h3 className="text-xl font-black text-slate-900 tracking-tight group-hover:text-brand-primary transition-colors leading-tight">
          {title}
        </h3>
        <p className="mt-3 text-slate-500 leading-relaxed text-sm">
          {description}
        </p>
      </div>

      <div className="mt-10 pt-6 border-t border-slate-50 flex items-center justify-between">
        <div className="flex -space-x-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="w-8 h-8 rounded-full border-2 border-white bg-slate-100 flex items-center justify-center overflow-hidden">
               <img src={`https://i.pravatar.cc/100?img=${i + 14}`} alt="user" className="w-full h-full object-cover" />
            </div>
          ))}
        </div>
        
        <button className="flex items-center gap-2 text-[11px] font-black text-slate-400 group-hover:text-brand-primary transition-all uppercase tracking-[0.1em]">
          Get Started
          <ArrowRight size={14} className="transform group-hover:translate-x-1 transition-transform" />
        </button>
      </div>
    </div>
  </div>
);

export const PipelinesPage = () => {
  const { setActivePage } = useDataStore();

  const pipelines = [
    {
      id: 'mmm',
      title: 'Marketing Mix Modeling',
      description: 'Analyze the impact of various marketing tactics on sales and forecast future performance across all channels.',
      icon: <Target size={22} />,
      accuracy: '94.2%',
      status: 'Ready' as const,
      targetPage: 'train' as const
    },
    {
      id: 'clv',
      title: 'Customer Lifetime Value',
      description: 'Predict the total revenue a business can reasonably expect from a single customer account throughout the relationship.',
      icon: <Users size={22} />,
      accuracy: '88.5%',
      status: 'Ready' as const,
      targetPage: 'measure' as const
    },
    {
      id: 'churn',
      title: 'Predictive Churn Analysis',
      description: 'Identify at-risk customers before they leave and develop proactive retention strategies based on behavioral data.',
      icon: <Zap size={22} />,
      accuracy: '91.0%',
      status: 'Training' as const,
      targetPage: 'predict' as const
    },
    {
      id: 'attribution',
      title: 'Multi-Touch Attribution',
      description: 'Distribute credit for sales and conversions to touchpoints in user journeys across multiple marketing channels.',
      icon: <Workflow size={22} />,
      accuracy: '86.4%',
      status: 'Deployed' as const,
      targetPage: 'measure' as const
    },
    {
      id: 'optimization',
      title: 'Budget Optimization',
      description: 'Algorithmic allocation of marketing spend across channels to maximize ROI and minimize customer acquisition costs.',
      icon: <TrendingUp size={22} />,
      accuracy: '92.8%',
      status: 'Ready' as const,
      targetPage: 'optimize' as const
    },
    {
      id: 'anomalies',
      title: 'Anomaly Detection',
      description: 'Automatically identify unusual patterns or outliers in marketing performance data that require immediate attention.',
      icon: <ShieldCheck size={22} />,
      accuracy: '99.1%',
      status: 'Ready' as const,
      targetPage: 'validate' as const
    }
  ];

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col">
      {/* Hero Header */}
      <div className="relative pt-16 pb-24 px-12 overflow-hidden bg-[#0f172a]">
        {/* Animated Patterns */}
        <div className="absolute top-0 right-0 w-2/3 h-full bg-[radial-gradient(circle_at_70%_20%,#4a151b_0%,transparent_50%)] opacity-30 pointer-events-none" />
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-[0.03] pointer-events-none" />
        
        <div className="relative z-10 max-w-7xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-primary/10 border border-brand-primary/20 text-brand-primary text-[10px] font-black uppercase tracking-widest mb-8">
            <Zap size={12} className="fill-brand-primary" />
            AI Intelligence Hub
          </div>
          <h1 className="text-6xl font-black text-white tracking-tight leading-none">
            Centralized AI <span className="text-brand-primary">Pipelines</span>
          </h1>
          <p className="mt-8 text-slate-400 text-xl leading-relaxed max-w-2xl font-medium">
            Deploy state-of-the-art machine learning models tailored for high-growth marketing teams. 
            Automate insights, optimize budgets, and predict outcomes with surgical precision.
          </p>
          
          <div className="mt-14 flex items-center gap-12">
            <div className="flex flex-col gap-1">
              <span className="text-4xl font-black text-white leading-none">06</span>
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Active Models</span>
            </div>
            <div className="w-px h-12 bg-slate-800" />
            <div className="flex flex-col gap-1">
              <span className="text-4xl font-black text-white leading-none">92%</span>
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Avg. Accuracy</span>
            </div>
            <div className="w-px h-12 bg-slate-800" />
            <div className="flex items-center gap-4">
              <div className="flex -space-x-2.5">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="w-10 h-10 rounded-full border-2 border-slate-900 bg-slate-800 flex items-center justify-center overflow-hidden shadow-xl">
                    <img src={`https://i.pravatar.cc/100?img=${i + 22}`} alt="user" className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
              <div className="flex flex-col gap-0.5">
                <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Collaborators</span>
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">12 Data Scientists</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid Content */}
      <div className="flex-1 -mt-12 relative z-20 px-12 pb-24">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white/80 backdrop-blur-2xl border border-slate-200/50 rounded-[2.5rem] p-12 shadow-2xl shadow-slate-200/50">
            <div className="flex items-center justify-between mb-12">
              <div className="space-y-1">
                <h2 className="text-2xl font-black text-slate-900 tracking-tight">Available Pipelines</h2>
                <p className="text-slate-500 text-sm font-medium">Select a model to begin configuration and training.</p>
              </div>
              <div className="flex items-center gap-4 bg-slate-50 p-2 rounded-2xl border border-slate-100">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-2">Filter</span>
                <select className="bg-white border border-slate-200 rounded-xl px-4 py-2 text-xs font-black text-slate-900 focus:ring-2 focus:ring-brand-primary/20 outline-none cursor-pointer uppercase tracking-widest shadow-sm">
                  <option>Top Performance</option>
                  <option>Channel Specific</option>
                  <option>Recently Active</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {pipelines.map((pipeline) => (
                <PipelineCard
                  key={pipeline.id}
                  {...pipeline}
                  onClick={() => setActivePage(pipeline.targetPage)}
                />
              ))}
            </div>

            <div className="mt-16 pt-12 border-t border-slate-100 flex flex-col items-center gap-4 text-center">
              <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400">
                <Brain size={24} />
              </div>
              <div className="max-w-md">
                <h4 className="text-sm font-black text-slate-900 uppercase tracking-tight">Custom Architecture?</h4>
                <p className="mt-2 text-slate-500 text-xs leading-relaxed">
                  Our machine learning team can help you build and deploy proprietary solutions. 
                  Reach out for tailored model development.
                </p>
                <button className="mt-6 text-[10px] font-black text-brand-primary uppercase tracking-[0.2em] hover:underline">
                  Connect with ML Support
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
