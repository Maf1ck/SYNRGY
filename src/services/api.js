const DEVICE_IP = 'http://192.168.4.1';

export const fetchRehabData = async (isSimulating = false) => {
    if (isSimulating) {
        return generateSimulationData();
    }

    try {
        // We use /state as the primary source for angle, reps, and flags
        // based on the verified combined (2).html logic.
        const response = await fetch(`${DEVICE_IP}/state`, {
            signal: AbortSignal.timeout(1500)
        });

        if (!response.ok) throw new Error('Device state not reached');
        const state = await response.json();

        // Also try to get pulse data if available
        let pulseData = { hr: 0 };
        try {
            const pulseRes = await fetch(`${DEVICE_IP}/data`, { signal: AbortSignal.timeout(1000) });
            if (pulseRes.ok) {
                const pulseJson = await pulseRes.json();
                pulseData.hr = pulseJson.bpm || 0;
                pulseData.gyro = pulseJson.imu;
            }
        } catch (e) { /* pulse might be optional */ }

        return {
            ...state,
            elbow: state.angle, // for backward compatibility in useRehabData
            hr: pulseData.hr,
            gyro: pulseData.gyro || state.gyro || {},
            status: "Connected",
            isOffline: false
        };
    } catch (error) {
        return {
            ...generateSimulationData(true),
            status: "Offline",
            isOffline: true,
            error: error.message
        };
    }
};


const generateSimulationData = (isOffline = false) => {
    const time = Date.now();
    const t = time / 1000;
    // Elbow angle: 0° (straight) to 130° (fully bent)
    const elbowAngle = 65 + Math.sin(t * 0.8) * 55;

    return {
        elbow: parseFloat(elbowAngle.toFixed(1)),
        // back-compat aliases so nothing else breaks
        injured: parseFloat(elbowAngle.toFixed(1)),
        healthy: parseFloat(elbowAngle.toFixed(1)),
        hr: 75 + Math.floor(Math.random() * 10),
        reps: Math.floor(t / 5) % 100,
        // Simulated gyroscope orientation (degrees)
        gyro: {
            pitch: parseFloat((Math.sin(t * 0.4) * 40).toFixed(1)),  // fore-aft tilt
            roll: parseFloat((Math.cos(t * 0.3) * 25).toFixed(1)),  // side tilt
            yaw: parseFloat((Math.sin(t * 0.2) * 60).toFixed(1)),  // rotation around vertical
        },
        status: isOffline ? "Offline (Simulated)" : "Connected (Simulated)",
        isOffline: isOffline
    };
};

export const saveCalibration = (data) => {
    localStorage.setItem('synrgy_calibration', JSON.stringify(data));
};

export const getCalibration = () => {
    const data = localStorage.getItem('synrgy_calibration');
    return data ? JSON.parse(data) : {
        hand: { min: 400, max: 600 }
    };
};
