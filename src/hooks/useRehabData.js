import { useState, useEffect, useRef } from 'react';
import { fetchRehabData, getCalibration } from '../services/api';

export const useRehabData = (pollingInterval = 100) => {
    const [data, setData] = useState({
        healthy: 0,
        injured: 0,
        hr: 0,
        reps: 0,
        status: 'Initializing...',
        isOffline: true
    });

    const [sessionStats, setSessionStats] = useState({
        maxHR: 0,
        avgHR: 0,
        duration: 0,
        reps: 0,
        history: []
    });

    const lastRepTime = useRef(Date.now());
    const isFlexed = useRef(false);
    const startTime = useRef(Date.now());

    useEffect(() => {
        const poll = async () => {
            const result = await fetchRehabData(false); // will fallback to sim if device not found

            setData(prev => {
                // Logic for repetition counting (client-side for better response)
                // If injured hand flexes > 60 and then returns < 20
                const currentAngle = result.injured;
                let newReps = sessionStats.reps;

                if (currentAngle > 60 && !isFlexed.current) {
                    isFlexed.current = true;
                } else if (currentAngle < 20 && isFlexed.current) {
                    isFlexed.current = false;
                    newReps += 1;
                    lastRepTime.current = Date.now();
                }

                // Update session stats
                setSessionStats(prevStats => {
                    const newHistory = [...prevStats.history, {
                        time: (Date.now() - startTime.current) / 1000,
                        hr: result.hr,
                        injured: result.injured
                    }].slice(-100); // keep last 100 points for real-time chart

                    return {
                        ...prevStats,
                        reps: newReps,
                        maxHR: Math.max(prevStats.maxHR, result.hr),
                        avgHR: prevStats.avgHR === 0 ? result.hr : (prevStats.avgHR * 0.9 + result.hr * 0.1),
                        duration: Math.floor((Date.now() - startTime.current) / 1000),
                        history: newHistory
                    };
                });

                return { ...result, reps: newReps };
            });
        };

        const interval = setInterval(poll, pollingInterval);
        return () => clearInterval(interval);
    }, [pollingInterval, sessionStats.reps]);

    return { data, sessionStats };
};
