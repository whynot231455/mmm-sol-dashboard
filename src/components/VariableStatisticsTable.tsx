interface VariableStatisticsTableProps {
  variables: Array<{
    variable: string;
    coefficient: string;
    stdError: string;
    tStatistic: string;
    pValue: number;
    vif: string;
    confidence: number;
  }>;
}

export const VariableStatisticsTable = ({ variables }: VariableStatisticsTableProps) => {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
      <div className="p-6 border-b border-slate-200 flex justify-between items-center">
        <div>
          <h3 className="text-lg font-bold text-slate-900">Variable Statistics</h3>
          <p className="text-sm text-slate-500 mt-1">Showing 4 of 16 variables</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-xs font-bold">
            <span className="px-3 py-1 rounded-full bg-green-50 text-green-600">12 Significant</span>
            <span className="px-3 py-1 rounded-full bg-orange-50 text-orange-600">4 Inactive</span>
          </div>
          <button className="text-sm font-semibold text-brand-primary hover:text-brand-secondary transition-colors">
            View all model parameters
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">
                Variable Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">
                Coefficient
              </th>
              <th className="px-6 py-3 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">
                Std. Error
              </th>
              <th className="px-6 py-3 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">
                T-Statistic
              </th>
              <th className="px-6 py-3 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">
                P-Value
              </th>
              <th className="px-6 py-3 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">
                VIF
              </th>
              <th className="px-6 py-3 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">
                Confidence
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {variables.map((variable, index) => {
              return (
                <tr key={index} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm font-semibold text-slate-900">{variable.variable}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-700">
                    {variable.coefficient}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-700">
                    {variable.stdError}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-700">
                    {variable.tStatistic}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`text-sm font-bold ${variable.pValue < 0.05 ? 'text-green-600' : 'text-orange-600'}`}>
                      {variable.pValue < 0.001 ? '< 0.001' : variable.pValue.toFixed(3)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-700">
                    {variable.vif}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-slate-100 rounded-full h-2 overflow-hidden">
                        <div 
                          className="bg-green-500 h-full rounded-full" 
                          style={{ width: `${variable.confidence}%` }}
                        ></div>
                      </div>
                      <span className="text-xs font-bold text-slate-700">{variable.confidence}%</span>
                    </div>
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
