interface CoefficientChange {
  channel: string;
  baselineCoeff: string;
  calibratedCoeff: string;
  impact: string;
}

interface CoefficientChangesTableProps {
  changes: CoefficientChange[];
}

export const CoefficientChangesTable = ({ changes }: CoefficientChangesTableProps) => {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
      <div className="p-6 border-b border-slate-200 flex justify-between items-center">
        <h3 className="text-lg font-bold text-slate-900">Coefficient Changes</h3>
        <button className="text-sm font-semibold text-brand-primary hover:text-brand-secondary transition-colors">
          View Full Report
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">
                Channel
              </th>
              <th className="px-6 py-3 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">
                Baseline Coeff.
              </th>
              <th className="px-6 py-3 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">
                Calibrated Coeff.
              </th>
              <th className="px-6 py-3 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">
                Impact
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {changes.map((change, index) => {
              const isPositive = change.impact.startsWith('+');
              return (
                <tr key={index} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                      <span className="text-sm font-semibold text-slate-900">{change.channel}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-700">
                    {change.baselineCoeff}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-slate-900">
                    {change.calibratedCoeff}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`text-sm font-bold ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                      {change.impact}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
