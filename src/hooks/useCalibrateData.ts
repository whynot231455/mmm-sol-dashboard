import { useMemo, useState } from 'react';
import { useDataStore } from '../store/useDataStore';

interface CalibrationStudy {
    id: string;
    name: string;
    source: string;
    date: string;
    enabled: boolean;
}

export const useCalibrateData = () => {
    const { rawData, mapping } = useDataStore();

    const [calibrationStrength, setCalibrationStrength] = useState(85);
    const [priorWeight, setPriorWeight] = useState(50); // Medium
    const [activeStudies, setActiveStudies] = useState<CalibrationStudy[]>([
        { id: '1', name: 'Q3 FB Lift Test', source: 'Facebook', date: 'Sep 2023', enabled: true },
        { id: '2', name: 'Q3 YT Geo Test', source: 'YouTube', date: 'Aug 2023', enabled: true },
        { id: '3', name: 'Q2 TV Spot A/B', source: 'TV', date: 'May 2023', enabled: false }
    ]);

    return useMemo(() => {
        if (!rawData.length || !mapping.channel) {
            return null;
        }

        // Get unique channels from CSV
        const channels = Array.from(
            new Set(rawData.map(row => row[mapping.channel!] as string).filter(Boolean))
        );

        // Mock calibration metrics
        const modelFit = 0.94;
        const mape = 4.2;
        const roiDelta = 12;

        // Deterministic pseudo-random generator from channel string to keep render pure
        const seeded = (key: string) => {
            let h = 2166136261 >>> 0;
            for (let i = 0; i < key.length; i++) {
                h = Math.imul(h ^ key.charCodeAt(i), 16777619) >>> 0;
            }
            return (h % 10000) / 10000;
        };

        const impactData = channels.slice(0, 6).map(channel => ({
            channel,
            baseline: seeded(channel + '_b') * 100 + 50,
            calibrated: seeded(channel + '_c') * 100 + 50,
            actuals: seeded(channel + '_a') * 100 + 50
        }));

        // Mock coefficient changes
        const coefficientChanges = channels.slice(0, 3).map(channel => ({
            channel,
            baselineCoeff: (seeded(channel + '_bc') * 2 - 0.5).toFixed(2),
            calibratedCoeff: (seeded(channel + '_cc') * 2 - 0.5).toFixed(2),
            impact: `${(seeded(channel + '_i') * 30 - 15).toFixed(1)}%`
        }));

        const toggleStudy = (id: string) => {
            setActiveStudies(prev =>
                prev.map(study =>
                    study.id === id ? { ...study, enabled: !study.enabled } : study
                )
            );
        };

        return {
            metrics: {
                modelFit,
                mape,
                roiDelta
            },
            impactData,
            coefficientChanges,
            activeStudies,
            toggleStudy,
            tuningParams: {
                calibrationStrength,
                setCalibrationStrength,
                priorWeight,
                setPriorWeight
            }
        };
    }, [rawData, mapping, calibrationStrength, priorWeight, activeStudies]);
};
