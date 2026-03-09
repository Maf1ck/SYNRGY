const DEVICE_IP = 'http://192.168.4.1/json';

export const fetchRehabData = async (isSimulating = false) => {
    if (isSimulating) {
        return generateSimulationData();
    }

    // Check for Mixed Content issue (HTTPS calling HTTP)
    const isHttps = window.location.protocol === 'https:';
    const isLocalDevice = DEVICE_IP.startsWith('http:');

    try {
        const response = await fetch(DEVICE_IP, {
            signal: AbortSignal.timeout(1000)
        });
        if (!response.ok) throw new Error('Device not reached');
        return await response.json();
    } catch (error) {
        let status = "Offline";
        let mixedContentError = false;

        if (isHttps && isLocalDevice) {
            console.error("Mixed Content Error: HTTPS site cannot call HTTP device directly. Use Localhost for full hardware support or allow 'Insecure Content' in browser settings.");
            mixedContentError = true;
            status = "Mixed Content Error";
        }

        return {
            ...generateSimulationData(true),
            status: status,
            mixedContentError: mixedContentError
        };
    }
};


const generateSimulationData = (isOffline = false) => {
    const time = Date.now();
    // Simulate sin-based movement for flex sensors
    const baseAngle = 30 + Math.sin(time / 1000) * 40; // 0 to 70 range approx

    return {
        healthy: parseFloat(baseAngle.toFixed(1)),
        injured: parseFloat((baseAngle * 0.8 + Math.random() * 5).toFixed(1)),
        hr: 75 + Math.floor(Math.random() * 10),
        reps: Math.floor(time / 5000) % 100, // mock reps incrementing
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
        healthy: { min: 200, max: 800 },
        injured: { min: 200, max: 800 }
    };
};
