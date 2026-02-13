import { Plus, Minus, RotateCcw } from 'lucide-react';

interface ZoomControlProps {
    onZoomIn: () => void;
    onZoomOut: () => void;
    onReset: () => void;
}

export const ZoomControl = ({ onZoomIn, onZoomOut, onReset }: ZoomControlProps) => {
    return (
        <div className="flex items-center gap-2 bg-slate-50 p-1.5 rounded-xl border border-slate-100 shadow-inner">
            <button 
                onClick={onZoomOut}
                className="p-1.5 hover:bg-white hover:shadow-sm rounded-lg text-slate-400 hover:text-slate-600 transition-all active:scale-90"
                title="Zoom Out"
            >
                <Minus size={14} />
            </button>
            <div className="w-px h-4 bg-slate-200 mx-1"></div>
            <button 
                onClick={onZoomIn}
                className="p-1.5 hover:bg-white hover:shadow-sm rounded-lg text-slate-400 hover:text-slate-600 transition-all active:scale-90"
                title="Zoom In"
            >
                <Plus size={14} />
            </button>
            <div className="w-px h-4 bg-slate-200 mx-1"></div>
            <button 
                onClick={onReset}
                className="p-1.5 hover:bg-white hover:shadow-sm rounded-lg text-slate-400 hover:text-slate-600 transition-all active:scale-90"
                title="Reset Zoom"
            >
                <RotateCcw size={14} />
            </button>
        </div>
    );
};
