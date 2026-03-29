import React, { useCallback, useMemo, useState } from "react";
import {
  X,
  CheckCircle2,
  AlertTriangle,
  Download,
  CloudUpload,
  Activity,
  Zap,
  ShieldAlert,
  BarChart3
} from "lucide-react";
import { useDataStore } from "../store/useDataStore";
import { parseCSV } from "../lib/csvParser";
import { ColumnMapping } from "../components/ColumnMapping";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import axios from "axios";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const ImportPage = () => {
  const { setData, rawData, headers, mapping } = useDataStore();
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isUploadingToDataiku, setIsUploadingToDataiku] = useState(false);
  const [dataikuResult, setDataikuResult] = useState<{ success: boolean; message: string } | null>(null);

  const handleFile = useCallback(
    async (file: File) => {
      const isCsvType = file.type === "text/csv" || file.type === "application/vnd.ms-excel";
      const isCsvExtension = file.name.toLowerCase().endsWith(".csv");
      if (!isCsvType && !isCsvExtension) {
        setError("Please upload a valid CSV file.");
        return;
      }

      setError(null);
      const result = await parseCSV(file);

      if (result.error) {
        setError(result.error);
      } else {
        setData(result.data, result.headers);
        // Start Dataiku upload
        uploadToDataiku(file);
      }
    },
    [setData],
  );

  const uploadToDataiku = async (file: File) => {
    setIsUploadingToDataiku(true);
    setDataikuResult(null);

    try {
      // Read file as text using Promise-based FileReader
      const csvContent = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          const result = e.target?.result;
          if (result) resolve(result as string);
          else reject(new Error('Failed to read file'));
        };
        reader.onerror = () => reject(new Error('FileReader error'));
        reader.readAsText(file);
      });

      const backendUrl = import.meta.env.VITE_AGENT_BACKEND_URL;
      if (!backendUrl) {
        setDataikuResult({ success: false, message: 'VITE_AGENT_BACKEND_URL is not set in .env' });
        return;
      }

      const response = await axios.post(
        `${backendUrl}/api/dataiku/upload?fileName=${encodeURIComponent(file.name)}`,
        csvContent,
        {
          headers: {
            'Content-Type': 'text/csv',
          },
        }
      );

      setDataikuResult({ success: true, message: response.data.message });

    } catch (err: any) {
      const errorMessage = err.response?.data?.details || err.message;
      setDataikuResult({
        success: false,
        message: typeof errorMessage === 'object' ? JSON.stringify(errorMessage) : errorMessage,
      });
    } finally {
      setIsUploadingToDataiku(false);
    }
  };

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile],
  );

  // Derived Metrics
  const metrics = useMemo(() => {
    if (rawData.length === 0) return null;

    const rowCount = rawData.length;
    // Simple validation: check if row has empty values
    const errorCount = rawData.filter((row) =>
      Object.values(row).some((val) => !val || val === ""),
    ).length;

    // Date Range
    let dateRange = "N/A";
    if (mapping.date) {
      const dates = rawData
        .map((row) => {
          const val = row[mapping.date!] as string | undefined;
          if (!val) return null;
          const d = new Date(val);
          return isNaN(d.getTime()) ? null : d;
        })
        .filter((d): d is Date => d !== null);

      if (dates.length > 0) {
        const timestamps = dates.map((d) => d.getTime());
        const minTimestamp = timestamps.reduce((a, b) => Math.min(a, b));
        const maxTimestamp = timestamps.reduce((a, b) => Math.max(a, b));

        const minDate = new Date(minTimestamp);
        const maxDate = new Date(maxTimestamp);
        dateRange = `${minDate.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })} - ${maxDate.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`;
      }
    }

    // Quality Calculation
    const mappedHeaders = Object.values(mapping).filter(Boolean);
    const healthScores = mappedHeaders.map(h => {
        const nulls = rawData.filter(row => !row[h!] || row[h!] === "").length;
        return { header: h!, score: Math.max(0, 100 - (nulls / rowCount) * 100) };
    });
    
    const avgHealth = healthScores.length > 0 
        ? healthScores.reduce((sum, h) => sum + h.score, 0) / healthScores.length 
        : 0;

    const needsRetraining = avgHealth < 95 || errorCount > rowCount * 0.02;

    return { rowCount, errorCount, dateRange, avgHealth, needsRetraining, healthScores };
  }, [rawData, mapping]);

  // Preview Data (First 5 rows)
  const previewData = useMemo(() => rawData.slice(0, 5), [rawData]);

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
            Import Marketing Data
          </h1>
          <p className="text-slate-500 mt-2 max-w-2xl">
            Upload your raw marketing channel data. We support CSV files for
            automatic schema detection and validation.
          </p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors shadow-sm">
          <Download size={16} />
          Download Template
        </button>
      </div>

      {/* Upload Zone */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={onDrop}
        className={cn(
          "relative border-2 border-dashed rounded-2xl p-12 transition-all duration-200 flex flex-col items-center justify-center text-center space-y-6 bg-white",
          isDragging
            ? "border-brand-primary bg-indigo-50/10"
            : "border-slate-200",
          rawData.length > 0 ? "border-green-200 bg-green-50/10" : "",
        )}
      >
        <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center">
          <CloudUpload className="w-8 h-8 text-slate-400" />
        </div>

        <div>
          <p className="text-xl font-semibold text-slate-900">
            {rawData.length > 0
              ? "File Uploaded Successfully"
              : "Drag & drop CSV or Excel here"}
          </p>
          <p className="text-slate-500 text-sm mt-2">
            Support for .csv, .xls, .xlsx up to 50MB.
          </p>
        </div>

        <div className="relative">
          <button className="bg-brand-primary text-white px-8 py-2.5 rounded-lg font-bold hover:bg-brand-primary/90 transition-colors shadow-sm">
            Browse Files
          </button>
          <input
            type="file"
            accept=".csv"
            onChange={(e) => {
              if (e.target.files?.[0]) {
                handleFile(e.target.files[0]);
                e.target.value = ''; // Reset input to allow re-uploading the same file
              }
            }}
            className="absolute inset-0 opacity-0 cursor-pointer"
          />
        </div>

        {error && (
          <div className="absolute bottom-4 bg-red-50 border border-red-100 text-red-600 px-4 py-2 rounded-lg flex items-center gap-2 text-sm">
            <X className="w-4 h-4" />
            {error}
          </div>
        )}

        {/* Dataiku Upload Status */}
        {(isUploadingToDataiku || dataikuResult) && (
          <div className={cn(
            "absolute bottom-4 px-4 py-2 rounded-lg flex items-center gap-2 text-sm border shadow-sm transition-all",
            isUploadingToDataiku ? "bg-indigo-50 border-indigo-100 text-indigo-600 animate-pulse" :
            dataikuResult?.success ? "bg-green-50 border-green-100 text-green-600" :
            "bg-red-50 border-red-100 text-red-600"
          )}>
            {isUploadingToDataiku ? (
              <>
                <div className="w-3 h-3 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                Uploading to Dataiku Managed Folder...
              </>
            ) : dataikuResult?.success ? (
              <>
                <CheckCircle2 className="w-4 h-4" />
                {String(dataikuResult.message)}
              </>
            ) : (
              <>
                <ShieldAlert className="w-4 h-4" />
                Dataiku Error: {typeof dataikuResult?.message === 'object' ? JSON.stringify(dataikuResult.message) : String(dataikuResult?.message || 'Unknown Error')}
              </>
            )}
          </div>
        )}
      </div>

      {/* Metrics & Preview Section (Only if data is loaded) */}
      {rawData.length > 0 && metrics && (
        <>
          {/* Data Health & Model Readiness */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-8 bg-white border border-slate-100 rounded-2xl p-8 shadow-sm">
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-brand-primary">
                            <Activity size={20} />
                        </div>
                        <div>
                            <h3 className="font-bold text-slate-900">Data Health Summary</h3>
                            <p className="text-xs text-slate-500 font-medium">Dataset consistency and completeness analysis</p>
                        </div>
                    </div>
                    <div className={cn(
                        "px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-2",
                        metrics.avgHealth > 90 ? "bg-green-50 text-green-600" : "bg-amber-50 text-amber-600"
                    )}>
                        <div className={cn("w-2 h-2 rounded-full animate-pulse", metrics.avgHealth > 90 ? "bg-green-500" : "bg-amber-500")} />
                        Quality Score: {metrics.avgHealth.toFixed(1)}%
                    </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Rows</p>
                        <p className="text-lg font-bold text-slate-900">{metrics.rowCount.toLocaleString()}</p>
                    </div>
                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Null Density</p>
                        <p className="text-lg font-bold text-slate-900">{(100 - metrics.avgHealth).toFixed(1)}%</p>
                    </div>
                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 col-span-2">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Active Range</p>
                        <p className="text-sm font-bold text-slate-900 truncate">{metrics.dateRange}</p>
                    </div>
                </div>
            </div>

            <div className={cn(
                "lg:col-span-4 rounded-2xl p-8 border flex flex-col justify-between transition-all",
                metrics.needsRetraining 
                    ? "bg-amber-50 border-amber-100 text-amber-900" 
                    : "bg-indigo-50 border-indigo-100 text-indigo-900 shadow-sm shadow-indigo-100/50"
            )}>
                <div>
                   <div className="flex items-center gap-2 mb-4">
                        {metrics.needsRetraining ? <ShieldAlert size={24} className="text-amber-600" /> : <Zap size={24} className="text-brand-primary" />}
                        <h3 className="font-bold">Model Readiness</h3>
                   </div>
                   <p className="text-sm leading-relaxed opacity-80 font-medium">
                        {metrics.needsRetraining 
                            ? "Significant data drift or missing entries detected. We recommend retraining the MMM model or cleaning the source CSV." 
                            : "Your data quality is excellent. The model is currently optimized for this distribution."}
                   </p>
                </div>
                
                <button className={cn(
                    "w-full py-3 rounded-xl font-bold mt-6 flex items-center justify-center gap-2 transition-all",
                    metrics.needsRetraining 
                        ? "bg-amber-600 text-white hover:bg-amber-700" 
                        : "bg-brand-primary text-white hover:bg-brand-primary"
                )}>
                    {metrics.needsRetraining ? "Retrain Model Now" : "Retrain Optional"}
                    <BarChart3 size={18} />
                </button>
            </div>
          </div>

          {/* Data Preview Table */}
          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
            <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-center">
              <h3 className="text-lg font-bold text-slate-900">Data Preview</h3>
              <span className="text-sm text-slate-500 font-medium">
                Showing first 5 rows{" "}
                <span className="text-brand-primary cursor-pointer hover:underline ml-1">
                  View All
                </span>
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-slate-500 font-medium">
                  <tr>
                    <th className="px-6 py-4 w-16">Status</th>
                    {headers.map((header) => (
                      <th key={header} className="px-6 py-4 whitespace-nowrap">
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {previewData.map((row, idx) => (
                    <tr
                      key={idx}
                      className="hover:bg-slate-50/50 transition-colors"
                    >
                      <td className="px-6 py-4">
                        {Object.values(row).some((v) => !v) ? (
                          <div className="w-6 h-6 rounded-full bg-red-100 flex items-center justify-center">
                            <AlertTriangle size={14} className="text-red-500" />
                          </div>
                        ) : (
                          <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center">
                            <CheckCircle2
                              size={14}
                              className="text-green-500"
                            />
                          </div>
                        )}
                      </td>
                      {headers.map((header) => (
                        <td
                          key={`${idx}-${header}`}
                          className="px-6 py-4 text-slate-700 whitespace-nowrap"
                        >
                          {!row[header] || row[header] === "" ? (
                            <span className="bg-red-100 text-red-600 text-xs px-2 py-0.5 rounded font-bold">
                              NULL
                            </span>
                          ) : (
                            String(row[header])
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
            <h2 className="text-xl font-bold text-slate-900 mb-6">
              Column Mapping
            </h2>
            <ColumnMapping />
          </div>
        </>
      )}
    </div>
  );
};
