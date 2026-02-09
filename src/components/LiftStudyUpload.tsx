import { Upload } from 'lucide-react';

interface LiftStudyUploadProps {
  onFileUpload: (file: File) => void;
}

export const LiftStudyUpload = ({ onFileUpload }: LiftStudyUploadProps) => {
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onFileUpload(file);
    }
  };

  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-200">
      <div className="flex items-center gap-2 mb-4">
        <Upload size={20} className="text-brand-primary" />
        <h3 className="text-lg font-bold text-slate-900">Upload Lift Studies</h3>
      </div>
      
      <label className="block cursor-pointer">
        <div className="border-2 border-dashed border-slate-300 rounded-xl p-8 text-center hover:border-brand-primary hover:bg-slate-50 transition-all">
          <div className="flex flex-col items-center gap-3">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center">
              <Upload size={28} className="text-slate-400" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-900">Click to upload or drag and drop</p>
              <p className="text-xs text-slate-500 mt-1">CSV, JSON (Max 10MB)</p>
            </div>
          </div>
        </div>
        <input
          type="file"
          className="hidden"
          accept=".csv,.json"
          onChange={handleFileChange}
        />
      </label>
    </div>
  );
};
