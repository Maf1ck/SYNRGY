import React from 'react';
import { motion } from 'framer-motion';

/* ─────────────────────────────────────────────
   ElbowArm – single arm with two segments
   angleDeg: 0 = fully straight, 130 = fully bent
   ───────────────────────────────────────────── */
const UPPER_LEN = 110;
const FORE_LEN = 100;
const SEG_W = 20;
const JOINT_R = 13;
const SVG_W = 140;
const SVG_H = 280;
const ORIGIN_X = SVG_W / 2;
const ORIGIN_Y = 20;

function toRad(deg) { return (deg * Math.PI) / 180; }

function describeArc(cx, cy, r, startDeg, endDeg) {
    const x1 = cx + r * Math.cos(toRad(startDeg));
    const y1 = cy + r * Math.sin(toRad(startDeg));
    const x2 = cx + r * Math.cos(toRad(endDeg));
    const y2 = cy + r * Math.sin(toRad(endDeg));
    const large = Math.abs(endDeg - startDeg) > 180 ? 1 : 0;
    return `M ${x1} ${y1} A ${r} ${r} 0 ${large} 0 ${x2} ${y2}`;
}

const ElbowArm = ({ angleDeg, t, exercise }) => {
    const angle = Math.max(0, Math.min(180, angleDeg));
    const elbowY = ORIGIN_Y + UPPER_LEN;

    // Calculate target arc if exercise is active
    let targetArc = null;
    if (exercise?.target) {
        const [low, high] = exercise.target.split(' - ').map(s => parseInt(s)).sort((a, b) => a - b);
        targetArc = describeArc(ORIGIN_X, elbowY, 45, 90 - low, 90 - high);
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
            {/* Angle badge */}
            <motion.div
                animate={{ scale: [1, 1.06, 1] }}
                transition={{ duration: 0.4 }}
                key={Math.round(angle)}
                style={{
                    fontSize: '32px',
                    fontWeight: 900,
                    color: 'var(--accent-cyan)',
                    background: 'rgba(0,230,255,0.08)',
                    borderRadius: '14px',
                    padding: '6px 20px',
                    border: '1px solid rgba(0,230,255,0.25)',
                    letterSpacing: '-1px',
                }}
            >
                {Math.round(angle)}°
            </motion.div>

            <svg width={SVG_W} height={SVG_H} overflow="visible">
                {/* Shadow / glow filter */}
                <defs>
                    <filter id="glow">
                        <feGaussianBlur stdDeviation="3" result="blur" />
                        <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
                    </filter>
                </defs>

                {/* Upper arm (fixed, vertical) */}
                <rect
                    x={ORIGIN_X - SEG_W / 2} y={ORIGIN_Y}
                    width={SEG_W} height={UPPER_LEN}
                    rx={SEG_W / 2}
                    fill="var(--accent-cyan)" opacity={0.3}
                />
                {/* Shoulder cap */}
                <circle cx={ORIGIN_X} cy={ORIGIN_Y} r={9}
                    fill="var(--accent-cyan)" opacity={0.5} />

                {/* Elbow joint */}
                <circle cx={ORIGIN_X} cy={elbowY} r={JOINT_R}
                    fill="var(--accent-cyan)" opacity={0.9}
                    filter="url(#glow)" />

                {/* Angle arc */}
                {angle > 2 && (
                    <path
                        d={describeArc(ORIGIN_X, elbowY, 38, 90, 90 - angle)}
                        stroke="var(--accent-cyan)" strokeWidth="1.5"
                        fill="none" strokeDasharray="5 4" opacity={0.5}
                    />
                )}

                {/* Target Range arc */}
                {targetArc && (
                    <path
                        d={targetArc}
                        stroke="var(--accent-green)" strokeWidth="4"
                        fill="none" opacity={0.4}
                        strokeLinecap="round"
                    />
                )}

                {/* Forearm (rotates from elbow) */}
                <motion.g
                    style={{ transformOrigin: `${ORIGIN_X}px ${elbowY}px` }}
                    animate={{ rotate: -angle }}
                    transition={{ type: 'spring', stiffness: 110, damping: 18 }}
                >
                    <rect
                        x={ORIGIN_X - SEG_W / 2} y={elbowY}
                        width={SEG_W} height={FORE_LEN}
                        rx={SEG_W / 2}
                        fill="var(--accent-green)" opacity={0.7}
                        filter="url(#glow)"
                    />
                    {/* Wrist cap */}
                    <circle cx={ORIGIN_X} cy={elbowY + FORE_LEN} r={8}
                        fill="var(--accent-green)" opacity={0.5} />
                </motion.g>
            </svg>

            <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                {t.elbowLabel || 'Elbow flexion'}
            </span>
        </div>
    );
};

/* ─────────────────────────────────────────────
   GyroIndicator – 3D orientation cube/arrow
   ───────────────────────────────────────────── */
const GyroIndicator = ({ gyro, t }) => {
    const { pitch = 0, roll = 0, yaw = 0 } = gyro || {};

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <h4 style={{ color: 'var(--text-secondary)', fontSize: '13px', fontWeight: 600, marginBottom: '4px' }}>
                {t.gyroTitle || 'Arm orientation (gyro)'}
            </h4>

            {/* Simple visual: a perspective box that rotates */}
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '8px' }}>
                <motion.div
                    animate={{ rotateX: pitch, rotateY: yaw, rotateZ: roll }}
                    transition={{ type: 'spring', stiffness: 80, damping: 20 }}
                    style={{
                        width: '60px', height: '60px',
                        background: 'linear-gradient(135deg, var(--accent-cyan) 0%, var(--accent-green) 100%)',
                        borderRadius: '10px',
                        transformStyle: 'preserve-3d',
                        boxShadow: '0 0 20px rgba(0,230,255,0.3)',
                        opacity: 0.85,
                    }}
                />
            </div>

            {/* Numeric axes */}
            {[
                { key: 'pitch', label: t.gyroPitch || 'Pitch', value: pitch, color: 'var(--accent-cyan)' },
                { key: 'roll', label: t.gyroRoll || 'Roll', value: roll, color: 'var(--accent-green)' },
                { key: 'yaw', label: t.gyroYaw || 'Yaw', value: yaw, color: 'var(--accent-orange)' },
            ].map(({ key, label, value, color }) => (
                <div key={key} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ width: '44px', fontSize: '12px', color: 'var(--text-secondary)' }}>{label}</span>
                    {/* Bar */}
                    <div style={{
                        flex: 1, height: '6px', background: 'var(--bg-tertiary)',
                        borderRadius: '3px', overflow: 'hidden'
                    }}>
                        <motion.div
                            animate={{ width: `${50 + (value / 180) * 50}%` }}
                            transition={{ type: 'spring', stiffness: 100, damping: 20 }}
                            style={{ height: '100%', background: color, borderRadius: '3px' }}
                        />
                    </div>
                    <span style={{ width: '38px', textAlign: 'right', fontSize: '12px', fontWeight: 700, color }}>{Math.round(value)}°</span>
                </div>
            ))}
        </div>
    );
};

/* ─────────────────────────────────────────────
   Main export – replaces the old HandVisualizer
   ───────────────────────────────────────────── */
const HandVisualizer = ({ angle, gyro, t, exercise }) => {
    return (
        <div className="premium-card" style={{ padding: '24px' }}>
            {/* Header */}
            <div style={{ marginBottom: '20px' }}>
                <h3 className="gradient-text">{t.handFlexion}</h3>
                <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>{t.realTimeData}</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1px 1fr', gap: '24px', alignItems: 'start' }}>
                {/* Left: Elbow arm */}
                <div style={{ display: 'flex', justifyContent: 'center' }}>
                    <ElbowArm angleDeg={angle} t={t} exercise={exercise} />
                </div>

                {/* Divider */}
                <div style={{ background: 'var(--glass-border)', height: '100%', minHeight: '200px' }} />

                {/* Right: Gyroscope */}
                <GyroIndicator gyro={gyro} t={t} />
            </div>
        </div>
    );
};

export default HandVisualizer;
