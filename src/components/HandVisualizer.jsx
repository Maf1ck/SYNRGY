import React from 'react';
import { motion } from 'framer-motion';

const Finger = ({ label, percentage }) => {
    // Map 0-100% to a rotation or translation
    // 0% = straight, 100% = fully bent (approx 90-120 degrees)
    const rotation = (percentage / 100) * 80;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', margin: '0 10px' }}>
            <div style={{
                width: '40px',
                height: '150px',
                background: 'var(--bg-tertiary)',
                borderRadius: '20px',
                position: 'relative',
                overflow: 'hidden',
                border: '1px solid var(--glass-border)'
            }}>
                {/* Progress Fill */}
                <motion.div
                    initial={false}
                    animate={{ height: `${percentage}%`, backgroundColor: percentage > 80 ? 'var(--accent-red)' : 'var(--accent-green)' }}
                    style={{
                        position: 'absolute',
                        bottom: 0,
                        width: '100%',
                        opacity: 0.6,
                        boxShadow: '0 0 15px rgba(0, 255, 136, 0.3)'
                    }}
                />

                {/* Joint Marker */}
                <motion.div
                    animate={{ rotateX: rotation }}
                    style={{
                        width: '100%',
                        height: '100%',
                        transformOrigin: 'bottom',
                        display: 'flex',
                        justifyContent: 'center',
                        paddingTop: '10px'
                    }}
                >
                    <div style={{ width: '2px', height: '80%', background: 'rgba(255,255,255,0.1)' }} />
                </motion.div>
            </div>
            <span style={{ marginTop: '8px', fontSize: '12px', color: 'var(--text-secondary)' }}>{label}</span>
            <span style={{ fontWeight: 'bold', color: 'var(--accent-cyan)' }}>{Math.round(percentage)}%</span>
        </div>
    );
};

const HandVisualizer = ({ injuredAngle, healthyAngle, t }) => {
    return (
        <div className="premium-card" style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'flex-end', minHeight: '300px' }}>
            <div style={{ position: 'absolute', top: '1rem', left: '1.5rem' }}>
                <h3 className="gradient-text">{t.handFlexion}</h3>
                <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{t.realTimeData}</p>
            </div>

            {/* Assuming for now we show injured hand's fingers symmetrically or focus on the main sensor */}
            {/* In the future, this can be expanded to 5 distinct sensors */}
            <Finger label={t.fingers.thumb} percentage={injuredAngle} />
            <Finger label={t.fingers.index} percentage={injuredAngle * 0.9} />
            <Finger label={t.fingers.middle} percentage={injuredAngle * 1.1} />
            <Finger label={t.fingers.ring} percentage={injuredAngle * 0.95} />
            <Finger label={t.fingers.pinky} percentage={injuredAngle * 0.8} />
        </div>
    );
};

export default HandVisualizer;
```
