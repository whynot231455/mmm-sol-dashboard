import { useEffect } from 'react';
import { useDataStore } from '../store/useDataStore';
import { supabase } from '../lib/supabase';
import { useMeasureData } from './useMeasureData';
import { usePredictData } from './usePredictData';
import { useOptimizeData } from './useOptimizeData';
import { useValidateData } from './useValidateData';

export const useDashboardSync = () => {
  const { 
    transformSettings, 
    filters: globalFilters, 
    activePage, 
    isLoaded,
    isProcessing,
    setIsProcessing,
    setMeridianResults
  } = useDataStore();

  const isDashboardPage = ['measure', 'predict', 'optimize', 'validate', 'train'].includes(activePage);
  
  // Polling for Meridian results when processing
  useEffect(() => {
    if (!isProcessing) return;

    const pollResults = async () => {
      try {
        const { meridianApi } = await import('../services/meridianApi');
        const results = await meridianApi.getLatestResults();
        
        // If results are fresh and status is stable, stop processing
        if (results && results.modelInfo.status === 'STABLE') {
          setMeridianResults(results);
          setIsProcessing(false);
        }
      } catch (err) {
        console.error('Polling failed:', err);
      }
    };

    const pollInterval = setInterval(pollResults, 5000);
    return () => clearInterval(pollInterval);
  }, [isProcessing, setIsProcessing, setMeridianResults]);
  
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
        const { error } = await supabase
          .from('dashboard_state')
          .upsert({ 
            key: 'current_dashboard', 
            data: stateToSync,
            updated_at: new Date().toISOString()
          }, { onConflict: 'key' });
          
        if (error) {
          console.error('Supabase sync error details:', error);
        }
      } catch (err) {
        console.error('Failed to sync dashboard state:', err);
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
