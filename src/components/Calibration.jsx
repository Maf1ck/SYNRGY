import React, { useState, useEffect } from 'react';
import { getCalibration, saveCalibration } from '../services/api';
import { Save, RefreshCw, ChevronLeft } from 'lucide-react';

const Calibration = ({ isOpen, onClose, t }) => {
    const [calib, setCalib] = useState(getCalibration());
    const [currentRaw, setCurrentRaw] = useState(512);

    // Simulate reading raw values periodically while calibration is open
    useEffect(() => {
        if (!isOpen) return;
        const interval = setInterval(() => {
            setCurrentRaw(400 + Math.floor(Math.random() * 200));
        }, 500);
        return () => clearInterval(interval);
    }, [isOpen]);

    if (!isOpen) return null;

    const handleSave = () => {
        saveCalibration(calib);
        onClose();
    };

    const setMinmax = (type) => {
        setCalib(prev => ({
            ...prev,
            hand: { ...prev.hand, [type]: currentRaw }
        }));
    };

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(10px)',
            display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000
        }}>
            <div className="premium-card" style={{ width: '90%', maxWidth: '500px', position: 'relative' }}>
                <button
                    onClick={onClose}
                    style={{ position: 'absolute', top: '1rem', left: '1rem', background: 'transparent', padding: '5px' }}
                >
                    <ChevronLeft size={24} />
                </button>

                <h2 style={{ textAlign: 'center', marginBottom: '2rem' }} className="gradient-text">{t.title}</h2>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '25px' }}>
                    <div className="premium-card" style={{ padding: '15px', background: 'var(--bg-tertiary)' }}>
                        <h3 style={{ textTransform: 'capitalize', marginBottom: '10px' }}>
                            {t.hand}
                        </h3>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px' }}>
                            <div>
                                <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{t.currentRaw}</div>
                                <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--accent-cyan)' }}>{currentRaw}</div>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                                <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{t.range}</div>
                                <div style={{ fontSize: '12px' }}>{calib.hand.min} - {calib.hand.max}</div>
                            </div>
                        </div>

                        <div style={{ display: 'flex', gap: '10px' }}>
                            <button
                                className="secondary"
                                style={{ flex: 1, fontSize: '12px' }}
                                onClick={() => setMinmax('min')}
                            >
                                {t.setMin}
                            </button>
                            <button
                                className="secondary"
                                style={{ flex: 1, fontSize: '12px' }}
                                onClick={() => setMinmax('max')}
                            >
                                {t.setMax}
                            </button>
                        </div>
                    </div>
                </div>

                <div style={{ marginTop: '2rem', display: 'flex', gap: '15px' }}>
                    <button className="primary" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }} onClick={handleSave}>
                        <Save size={18} /> {t.save}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Calibration;
