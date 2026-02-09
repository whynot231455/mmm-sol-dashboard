import React, { useCallback, useMemo, useState } from 'react';
import { 
  X, 
  CheckCircle2, 
  AlertTriangle, 
  Calendar, 
  Download, 
  CloudUpload
} from 'lucide-react';
import { useDataStore } from '../store/useDataStore';
import { parseCSV } from '../lib/csvParser';
import { ColumnMapping } from '../components/ColumnMapping';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const ImportPage = () => {
  const { setData, rawData, headers, mapping } = useDataStore();
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFile = async (file: File) => {
    if (file.type !== 'text/csv' && !file.name.endsWith('.csv')) {
      setError('Please upload a valid CSV file.');
      return;
    }
    
    setError(null);
    const result = await parseCSV(file);
    
    if (result.error) {
      setError(result.error);
    } else {
      setData(result.data, result.headers);
    }
  };

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, []);

  // Derived Metrics
  const metrics = useMemo(() => {
    if (rawData.length === 0) return null;

    const rowCount = rawData.length;
    // Simple validation: check if row has empty values
    const errorCount = rawData.filter(row => Object.values(row).some(val => !val || val === '')).length;
    
    // Date Range
    let dateRange = 'N/A';
    if (mapping.date) {
      const dates = rawData
        .map(row => {
            const val = row[mapping.date!] as string | undefined;
            if (!val) return null;
            const d = new Date(val);
            return isNaN(d.getTime()) ? null : d;
        })
        .filter((d): d is Date => d !== null);
      
      if (dates.length > 0) {
        const timestamps = dates.map(d => d.getTime());
        const minTimestamp = timestamps.reduce((a, b) => Math.min(a, b));
        const maxTimestamp = timestamps.reduce((a, b) => Math.max(a, b));
        
        const minDate = new Date(minTimestamp);
        const maxDate = new Date(maxTimestamp);
        dateRange = `${minDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} - ${maxDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
      }
    }

    return { rowCount, errorCount, dateRange };
  }, [rawData, mapping.date]);

  // Preview Data (First 5 rows)
  const previewData = useMemo(() => rawData.slice(0, 5), [rawData]);

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Import Marketing Data</h1>
          <p className="text-slate-500 mt-2 max-w-2xl">
            Upload your raw marketing channel data. We support CSV files for automatic schema detection and validation.
          </p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors shadow-sm">
          <Download size={16} />
          Download Template
        </button>
      </div>

      {/* Upload Zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={onDrop}
        className={cn(
          "relative border-2 border-dashed rounded-2xl p-12 transition-all duration-200 flex flex-col items-center justify-center text-center space-y-6 bg-white",
          isDragging ? "border-brand-primary bg-indigo-50/10" : "border-slate-200",
          rawData.length > 0 ? "border-green-200 bg-green-50/10" : ""
        )}
      >
        <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center">
          <CloudUpload className="w-8 h-8 text-slate-400" />
        </div>
        
        <div>
          <p className="text-xl font-semibold text-slate-900">
            {rawData.length > 0 ? 'File Uploaded Successfully' : 'Drag & drop CSV or Excel here'}
          </p>
          <p className="text-slate-500 text-sm mt-2">Support for .csv, .xls, .xlsx up to 50MB.</p>
        </div>

        <div className="relative">
           <button className="bg-brand-primary text-white px-8 py-2.5 rounded-lg font-bold hover:bg-brand-primary/90 transition-colors shadow-sm">
             Browse Files
           </button>
           <input
              type="file"
              accept=".csv"
              onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
              className="absolute inset-0 opacity-0 cursor-pointer"
            />
        </div>

        {error && (
            <div className="absolute bottom-4 bg-red-50 border border-red-100 text-red-600 px-4 py-2 rounded-lg flex items-center gap-2 text-sm">
              <X className="w-4 h-4" />
              {error}
            </div>
        )}
      </div>

      {/* Metrics & Preview Section (Only if data is loaded) */}
      {rawData.length > 0 && metrics && (
        <>
          {/* Metrics Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-center">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle2 className="w-5 h-5 text-green-500" />
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Rows Imported</span>
              </div>
              <p className="text-3xl font-bold text-slate-900">{metrics.rowCount.toLocaleString()}</p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-center bg-red-50/30 border-red-100">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="w-5 h-5 text-brand-secondary" />
                <span className="text-xs font-bold text-brand-secondary uppercase tracking-wider">Validation Errors</span>
              </div>
              <p className="text-3xl font-bold text-slate-900">{metrics.errorCount}</p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-center">
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="w-5 h-5 text-brand-third" />
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Date Range</span>
              </div>
              <p className="text-xl font-bold text-slate-900 truncate">{metrics.dateRange}</p>
            </div>
          </div>

          {/* Data Preview Table */}
          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
             <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-center">
               <h3 className="text-lg font-bold text-slate-900">Data Preview</h3>
               <span className="text-sm text-slate-500 font-medium">Showing first 5 rows <span className="text-brand-primary cursor-pointer hover:underline ml-1">View All</span></span>
             </div>
             
             <div className="overflow-x-auto">
               <table className="w-full text-left text-sm">
                 <thead className="bg-slate-50 text-slate-500 font-medium">
                   <tr>
                     <th className="px-6 py-4 w-16">Status</th>
                     {headers.map(header => (
                       <th key={header} className="px-6 py-4 whitespace-nowrap">{header}</th>
                     ))}
                   </tr>
                 </thead>
                 <tbody className="divide-y divide-slate-100">
                   {previewData.map((row, idx) => (
                     <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                       <td className="px-6 py-4">
                         {Object.values(row).some(v => !v) ? (
                            <div className="w-6 h-6 rounded-full bg-red-100 flex items-center justify-center">
                              <AlertTriangle size={14} className="text-red-500" />
                            </div>
                         ) : (
                            <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center">
                              <CheckCircle2 size={14} className="text-green-500" />
                            </div>
                         )}
                       </td>
                       {headers.map(header => (
                         <td key={`${idx}-${header}`} className="px-6 py-4 text-slate-700 whitespace-nowrap">
                           {(!row[header] || row[header] === '') ? (
                             <span className="bg-red-100 text-red-600 text-xs px-2 py-0.5 rounded font-bold">NULL</span>
                           ) : (
                             row[header]
                           )}
                         </td>
                       ))}
                     </tr>
                   ))}
                 </tbody>
               </table>
             </div>
          </div>

          {/* Data Mapping (Retained) */}
          <div className="bg-white border border-slate-200 rounded-2xl p-8">
            <h2 className="text-xl font-bold text-slate-900 mb-6">Column Mapping</h2>
            <ColumnMapping />
          </div>
        </>
      )}
    </div>
  );
};
