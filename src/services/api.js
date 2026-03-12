const DEVICE_IP = 'http://192.168.4.1';

export const fetchRehabData = async () => {
    try {
        // We use /state as the primary source for angle, reps, and flags
        // based on the verified combined (2).html logic.
        const response = await fetch(`${DEVICE_IP}/state`, {
            signal: AbortSignal.timeout(1500)
        });

        if (!response.ok) throw new Error('Device state not reached');
        const state = await response.json();

        // Also try to get pulse data if available
        let pulseData = { hr: 0, gyro: {} };
        try {
            const pulseRes = await fetch(`${DEVICE_IP}/data`, { signal: AbortSignal.timeout(1000) });
            if (pulseRes.ok) {
                const pulseJson = await pulseRes.json();
                pulseData.hr = pulseJson.bpm || 0;
                pulseData.gyro = pulseJson.imu || {};
            }
        } catch (e) { /* pulse might be optional */ }

        return {
            ...state,
            elbow: state.angle, // for backward compatibility in useRehabData
            hr: pulseData.hr,
            gyro: pulseData.gyro,
            status: "Connected",
            isOffline: false
        };
    } catch (error) {
        throw error; // Let the hook handle the error state
    }
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
