interface ActiveStudy {
  id: string;
  name: string;
  source: string;
  date: string;
  enabled: boolean;
}

interface ActiveStudiesListProps {
  studies: ActiveStudy[];
  onToggle: (id: string) => void;
}

export const ActiveStudiesList = ({ studies, onToggle }: ActiveStudiesListProps) => {
  const activeCount = studies.filter(s => s.enabled).length;

  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-200">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-slate-900">Active Studies</h3>
        <span className="px-3 py-1 bg-brand-secondary/10 text-brand-secondary text-xs font-bold rounded-full">
          {activeCount} Active
        </span>
      </div>

      <div className="space-y-3">
        {studies.map((study) => (
          <div
            key={study.id}
            className="flex items-center justify-between p-4 rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className={`w-2 h-2 rounded-full ${study.enabled ? 'bg-green-500' : 'bg-slate-300'}`}></div>
              <div>
                <p className="text-sm font-bold text-slate-900">{study.name}</p>
                <p className="text-xs text-slate-500">{study.source} • {study.date}</p>
              </div>
            </div>
            
            <button
              onClick={() => onToggle(study.id)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                study.enabled ? 'bg-brand-secondary' : 'bg-slate-300'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  study.enabled ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};
