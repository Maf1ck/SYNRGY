import { useState, useEffect, useRef } from 'react';
import { fetchRehabData, getCalibration } from '../services/api';
import { audioService } from '../services/audio';

export const useRehabData = (pollingInterval = 100, activeExercise = null) => {
    const [data, setData] = useState({
        angle: 0,
        hr: 0,
        reps: 0,
        status: 'Initializing...',
        isOffline: true,
        holdProgress: 0
    });

    const [sessionStats, setSessionStats] = useState({
        maxHR: 0,
        avgHR: 0,
        duration: 0,
        reps: 0,
        history: []
    });

    const lastRepTime = useRef(Date.now());
    const isFlexed = useRef(false); // true when reaching upper target
    const isExtended = useRef(false); // true when reaching lower target
    const startTime = useRef(Date.now());
    const holdStartTime = useRef(null);
    const audioDebounce = useRef({ up: false, down: false });

    // Helper to map raw value to degrees [0, 180]
    const mapRawToDeg = (val, cal) => {
        const { min, max } = cal.hand;
        // Simple linear mapping: min -> 0 deg, max -> 130 deg (as per ElbowArm limits)
        // Adjusting to 180 based on user request "180 to 90"
        const angle = ((val - min) / (max - min)) * 180;
        return Math.max(0, Math.min(180, angle));
    };

    useEffect(() => {
        const poll = async () => {
            try {
                const result = await fetchRehabData();
                const calib = getCalibration();

                // If hardware provides angle, use it. Otherwise map raw values.
                const currentAngle = (result.angle !== undefined) ? result.angle : mapRawToDeg(result.raw || 512, calib);

                setData(prev => {
                    let newReps = sessionStats.reps;
                    let holdProgress = 0;

                    if (activeExercise) {
                        const { target } = activeExercise;
                        const [targetLow, targetHigh] = target.split(' - ').map(s => parseInt(s)).sort((a, b) => a - b);

                        // Logic for reaching limits
                        const reachedHigh = currentAngle >= targetHigh;
                        const reachedLow = currentAngle <= targetLow;

                        // Audio feedback for limits
                        if (reachedHigh && !audioDebounce.current.up) {
                            audioService.playLimit();
                            audioDebounce.current.up = true;
                        } else if (!reachedHigh) {
                            audioDebounce.current.up = false;
                        }

                        if (reachedLow && !audioDebounce.current.down) {
                            audioService.playLimit();
                            audioDebounce.current.down = true;
                        } else if (!reachedLow) {
                            audioDebounce.current.down = false;
                        }

                        // Repetition counting
                        if (reachedHigh && !isFlexed.current) {
                            isFlexed.current = true;
                            // If it's a hold exercise (e.g. ex3), start counter
                            if (activeExercise.hold) {
                                holdStartTime.current = Date.now();
                            }
                        } else if (reachedLow && isFlexed.current) {
                            // Complete a rep only if we return to the bottom
                            isFlexed.current = false;
                            newReps += 1;
                            audioService.playSuccess();
                        }

                        // Handle Hold
                        if (activeExercise.hold && isFlexed.current && holdStartTime.current) {
                            const elapsed = Date.now() - holdStartTime.current;
                            const targetMs = parseInt(activeExercise.hold) * 1000;
                            holdProgress = Math.min(100, (elapsed / targetMs) * 100);

                            if (elapsed >= targetMs) {
                                holdStartTime.current = null;
                                // Optionally play another sound or wait for extension
                            }
                        }
                    } else {
                        // Fallback to basic rep counting if no exercise
                        if (currentAngle > 100 && !isFlexed.current) {
                            isFlexed.current = true;
                        } else if (currentAngle < 30 && isFlexed.current) {
                            isFlexed.current = false;
                            newReps += 1;
                        }
                    }

                    // Update session stats
                    setSessionStats(prevStats => {
                        const newHistory = [...prevStats.history, {
                            time: (Date.now() - startTime.current) / 1000,
                            hr: result.hr,
                            angle: currentAngle
                        }].slice(-100);

                        return {
                            ...prevStats,
                            reps: newReps,
                            maxHR: Math.max(prevStats.maxHR, result.hr),
                            avgHR: prevStats.avgHR === 0 ? result.hr : (prevStats.avgHR * 0.9 + result.hr * 0.1),
                            duration: Math.floor((Date.now() - startTime.current) / 1000),
                            history: newHistory
                        };
                    });

                    return { ...result, angle: currentAngle, reps: newReps, holdProgress };
                });
            } catch (error) {
                setData(prev => ({
                    ...prev,
                    status: "Offline",
                    isOffline: true,
                    error: error.message
                }));
            }
        };

        const interval = setInterval(poll, pollingInterval);
        return () => clearInterval(interval);
    }, [pollingInterval, sessionStats.reps, activeExercise]);

    return { data, sessionStats };
};
