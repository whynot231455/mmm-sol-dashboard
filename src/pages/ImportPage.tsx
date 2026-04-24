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
  BarChart3,
  Loader2
} from "lucide-react";
import { useDataStore } from "../store/useDataStore";
import { parseCSV } from "../lib/csvParser";
import { ColumnMapping } from "../components/ColumnMapping";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const ImportPage = () => {
  const { setData, rawData, headers, mapping } = useDataStore();
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingResult, setProcessingResult] = useState<{ success: boolean; message: string } | null>(null);

  const handleFile = useCallback(
    async (file: File) => {
      const isCsvType = file.type === "text/csv" || file.type === "application/csv" || file.type === "";
      const isCsvExtension = file.name.toLowerCase().endsWith(".csv");
      if (!isCsvType && !isCsvExtension) {
        setError("Please upload a valid CSV file.");
        return;
      }

      setError(null);
      setIsProcessing(true);
      setProcessingResult(null);

      try {
        const result = await parseCSV(file);

        if (result.error) {
          setError(result.error);
          setIsProcessing(false);
          return;
        }

        setData(result.data, result.headers);
        
        setProcessingResult({ 
          success: true, 
          message: "Data imported successfully." 
        });
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Failed to process data.";
        setError(message);
        setProcessingResult({ 
          success: false, 
          message: "Import failed." 
        });
      } finally {
        setIsProcessing(false);
      }
    },
    [setData],
  );

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
    const errorCount = rawData.filter((row) =>
      Object.values(row).some((val) => !val || val === ""),
    ).length;

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
            automatic schema detection and model validation.
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
              : "Drag & drop CSV here"}
          </p>
          <p className="text-slate-500 text-sm mt-2">
            Support for .csv up to 50MB.
          </p>
        </div>

        <div className="relative">
          <button 
            disabled={isProcessing}
            className="bg-brand-primary text-white px-8 py-2.5 rounded-lg font-bold hover:bg-brand-primary/90 transition-colors shadow-sm disabled:opacity-50"
          >
            {isProcessing ? "Processing..." : "Browse Files"}
          </button>
          <input
            type="file"
            accept=".csv"
            disabled={isProcessing}
            onChange={(e) => {
              if (e.target.files?.[0]) {
                handleFile(e.target.files[0]);
                e.target.value = ''; 
              }
            }}
            className="absolute inset-0 opacity-0 cursor-pointer disabled:cursor-not-allowed"
          />
        </div>

        {error && (
          <div className="absolute bottom-4 bg-red-50 border border-red-100 text-red-600 px-4 py-2 rounded-lg flex items-center gap-2 text-sm">
            <X className="w-4 h-4" />
            {error}
          </div>
        )}

        {/* Processing Status */}
        {(isProcessing || processingResult) && (
          <div className={cn(
            "absolute bottom-4 px-4 py-2 rounded-lg flex items-center gap-2 text-sm border shadow-sm transition-all",
            isProcessing ? "bg-indigo-50 border-indigo-100 text-indigo-600" :
            processingResult?.success ? "bg-green-50 border-green-100 text-green-600" :
            "bg-red-50 border-red-100 text-red-600"
          )}>
            {isProcessing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Validating Data Schema...
              </>
            ) : processingResult?.success ? (
              <>
                <CheckCircle2 className="w-4 h-4" />
                {processingResult.message}
              </>
            ) : (
              <>
                <ShieldAlert className="w-4 h-4" />
                Error: {processingResult?.message || "Unknown Error"}
              </>
            )}
          </div>
        )}
      </div>

      {/* Metrics & Preview Section (Only if data is loaded) */}
      {rawData.length > 0 && metrics && (
        <>
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
                
                <button 
                  className={cn(
                    "w-full py-3 rounded-xl font-bold mt-6 flex items-center justify-center gap-2 transition-all",
                    metrics.needsRetraining 
                        ? "bg-amber-600 text-white hover:bg-amber-700" 
                        : "bg-brand-primary text-white hover:bg-brand-primary"
                )}>
                    {metrics.needsRetraining ? "Retrain Model Now" : "Retrain Model"}
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

          {/* Data Mapping (Initially Hidden to favor Auto-Detect) */}
          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
            <button 
              onClick={() => {
                const el = document.getElementById('manual-mapping-section');
                if (el) el.classList.toggle('hidden');
              }}
              className="w-full px-8 py-6 flex justify-between items-center hover:bg-slate-50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-500">
                  <BarChart3 size={20} />
                </div>
                <div className="text-left">
                  <h3 className="font-bold text-slate-900">Advanced Column Mapping</h3>
                  <p className="text-xs text-slate-500 font-medium">Auto-detection active. Manual override available.</p>
                </div>
              </div>
              <span className="text-sm font-bold text-brand-primary">Toggle Mapping</span>
            </button>
            <div id="manual-mapping-section" className="hidden p-8 pt-0 border-t border-slate-100">
              <div className="mt-6">
                <ColumnMapping />
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
