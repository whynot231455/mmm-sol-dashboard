import { useEffect } from 'react';
import { useDataStore } from '../store/useDataStore';
import { supabase } from '../lib/supabase';
import { useMeasureData } from './useMeasureData';
import { usePredictData } from './usePredictData';
import { useOptimizeData } from './useOptimizeData';
import { useValidateData } from './useValidateData';
import { toast } from 'sonner';

export const useDashboardSync = () => {
  const { 
    transformSettings, 
    filters: globalFilters, 
    activePage, 
    isLoaded,
    isProcessing,
    setIsProcessing,
  } = useDataStore();

  const isDashboardPage = ['measure', 'predict', 'optimize', 'validate', 'train'].includes(activePage);
  
  // Simulated processing stop
  useEffect(() => {
    if (!isProcessing) return;
    const timer = setTimeout(() => setIsProcessing(false), 3000);
    return () => clearTimeout(timer);
  }, [isProcessing, setIsProcessing]);
  
  // Get data from all pages with default/current settings - ONLY when on dashboard pages
  const measureData = useMeasureData(globalFilters, { enabled: isDashboardPage });
  const predictData = usePredictData({ spendChange: 0, seasonality: 1, excludeOutliers: false }, { enabled: isDashboardPage });
  const optimizeData = useOptimizeData({ totalBudget: 10000000, channelWeights: {}, period: 4 }, { enabled: isDashboardPage });
  const validateData = useValidateData({ enabled: isDashboardPage });

  useEffect(() => {
    if (!isLoaded || !isDashboardPage) return;

    const syncState = async () => {
      const stateToSync = {
        activePage,
        settings: {
          transformSettings,
          filters: globalFilters,
        },
        metrics: {
          measure: measureData ? {
            kpi: measureData.kpi,
            channels: measureData.channels.slice(0, 5) // Top 5 channels
          } : null,
          predict: predictData ? {
            metrics: predictData.metrics,
            forecast: predictData.charts.forecast.slice(0, 3)
          } : null,
          optimize: optimizeData ? {
            metrics: optimizeData.metrics,
            topChannels: optimizeData.channels.slice(0, 5)
          } : null,
          validation: validateData ? {
            metrics: validateData.metrics,
            modelInfo: validateData.modelInfo
          } : null
        },
        lastUpdated: new Date().toISOString()
      };

      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { error } = await supabase
          .from('dashboard_state')
          .upsert({ 
            key: 'current_dashboard', 
            data: stateToSync,
            updated_at: new Date().toISOString(),
            user_id: user.id,
          }, { onConflict: 'key,user_id' });
          
        if (error) {
          console.error('Supabase sync error details:', error);
          toast.error('Failed to sync dashboard state.');
        }
      } catch (err) {
        console.error('Failed to sync dashboard state:', err);
        toast.error('Failed to sync dashboard state.');
      }
    };

    // Debounce to avoid excessive writes
    const timer = setTimeout(syncState, 2000);
    return () => clearTimeout(timer);
  }, [
    isLoaded, 
    isDashboardPage,
    activePage, 
    transformSettings, 
    globalFilters, 
    measureData, 
    predictData, 
    optimizeData, 
    validateData
  ]);
};
