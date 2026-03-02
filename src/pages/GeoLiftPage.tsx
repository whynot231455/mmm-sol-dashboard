import { useState } from "react";
import { useGeoLiftData } from "../hooks/useGeoLiftData";
import { GeoLiftTestDesign } from "../components/GeoLiftTestDesign";
import { GeoLiftMonitor } from "../components/GeoLiftMonitor";
import { GeoLiftResults } from "../components/GeoLiftResults";
import { useDataStore } from "../store/useDataStore";
import {
  FlaskConical,
  Activity,
  BarChart3,
  Plus,
  Clock,
  CheckCircle2,
  Play,
} from "lucide-react";

type GeoLiftTab = "design" | "monitor" | "results";

export const GeoLiftPage = () => {
  const [activeTab, setActiveTab] = useState<GeoLiftTab>("design");
  const { setActivePage } = useDataStore();
  const data = useGeoLiftData();

  const tabs: { id: GeoLiftTab; label: string; icon: React.ReactNode }[] = [
    { id: "design", label: "Test Design", icon: <FlaskConical size={16} /> },
    { id: "monitor", label: "Monitor", icon: <Activity size={16} /> },
    {
      id: "results",
      label: "Results & Analysis",
      icon: <BarChart3 size={16} />,
    },
  ];

  const handleApplyToModel = () => {
    setActivePage("calibrate");
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">
            GeoLift Testing
          </h1>
          <p className="text-slate-500 mt-2 max-w-2xl">
            Design, monitor, and analyze geo-based incrementality tests to
            measure true causal impact of your marketing campaigns.
          </p>
        </div>
        <button className="flex items-center gap-2 px-5 py-3 bg-[#4a151b] hover:bg-[#3a1015] text-white rounded-xl text-sm font-bold transition-all shadow-lg shadow-red-100">
          <Plus size={16} />
          New Test
        </button>
      </div>

      {/* Past Tests Summary */}
      <div className="flex items-center gap-3 overflow-x-auto pb-1">
        {data.pastTests.map((test) => {
          const statusIcon =
            test.status === "completed" ? (
              <CheckCircle2 size={14} className="text-blue-500" />
            ) : test.status === "active" ? (
              <Play size={14} className="text-emerald-500" />
            ) : (
              <Clock size={14} className="text-amber-500" />
            );
          const statusColor =
            test.status === "completed"
              ? "border-blue-200 bg-blue-50/50"
              : test.status === "active"
                ? "border-emerald-200 bg-emerald-50/50"
                : "border-amber-200 bg-amber-50/50";

          return (
            <button
              key={test.id}
              className={`flex-shrink-0 flex items-center gap-3 px-4 py-2.5 rounded-xl border text-left transition-all hover:shadow-sm ${statusColor}`}
            >
              {statusIcon}
              <div>
                <div className="text-sm font-semibold text-slate-800 whitespace-nowrap">
                  {test.name}
                </div>
                <div className="text-xs text-slate-500">
                  {test.channel} ·{" "}
                  {test.status === "completed"
                    ? `+${test.lift}% lift`
                    : test.status}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-slate-200">
        <div className="flex items-center gap-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-5 py-3 text-sm font-bold transition-all border-b-2 ${
                activeTab === tab.id
                  ? "border-[#4a151b] text-[#4a151b]"
                  : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === "design" && (
          <GeoLiftTestDesign
            regions={data.regions}
            powerAnalysis={data.powerAnalysis}
          />
        )}
        {activeTab === "monitor" && (
          <GeoLiftMonitor
            monitorData={data.monitorData}
            regionPerformance={data.regionPerformance}
            testConfig={data.testConfig}
          />
        )}
        {activeTab === "results" && (
          <GeoLiftResults
            liftResult={data.liftResult}
            channelComparison={data.channelComparison}
            counterfactualData={data.counterfactualData}
            onApplyToModel={handleApplyToModel}
          />
        )}
      </div>
    </div>
  );
};
