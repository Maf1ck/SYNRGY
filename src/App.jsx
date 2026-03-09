import React, { useState } from 'react';
import { useRehabData } from './hooks/useRehabData';
import HandVisualizer from './components/HandVisualizer';
import PulseChart from './components/PulseChart';
import Calibration from './components/Calibration';
import { translations } from './services/translations';
import {
  Heart,
  Activity,
  RotateCcw,
  Settings,
  Download,
  Bell,
  CheckCircle2,
  Languages
} from 'lucide-react';

const App = () => {
  const { data, sessionStats } = useRehabData(200);
  const [userProfile] = useState({ age: 25, restingHR: 65 });
  const [isCalibOpen, setIsCalibOpen] = useState(false);
  const [lang, setLang] = useState('uk'); // Default to Ukrainian as requested

  const t = translations[lang];

  // Karvonen Calculation
  const maxHR = 220 - userProfile.age;
  const hrReserve = maxHR - userProfile.restingHR;
  const currentIntensity = ((data.hr - userProfile.restingHR) / hrReserve) * 100;

  const getHRZone = (intensity) => {
    if (intensity < 50) return { label: t.zones.rest, color: 'var(--text-secondary)' };
    if (intensity < 60) return { label: t.zones.warmup, color: 'var(--accent-cyan)' };
    if (intensity < 70) return { label: t.zones.fatBurn, color: 'var(--accent-green)' };
    if (intensity < 80) return { label: t.zones.endurance, color: 'var(--accent-orange)' };
    return { label: t.zones.peak, color: 'var(--accent-red)' };
  };

  const zone = getHRZone(currentIntensity);

  const exportData = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(sessionStats));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", `synrgy_session_${new Date().toISOString()}.json`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto', width: '100%' }}>
      {/* Header */}
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <div>
          <h1 className="gradient-text" style={{ fontSize: '2.5rem' }}>{t.systemTitle}</h1>
          <p style={{ color: 'var(--text-secondary)' }}>{t.systemSubtitle}</p>
        </div>
        <div style={{ display: 'flex', gap: '15px' }}>
          <button
            className="secondary"
            onClick={() => setLang(lang === 'en' ? 'uk' : 'en')}
            style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            <Languages size={18} />
            <span style={{ fontSize: '14px' }}>{lang.toUpperCase()}</span>
          </button>

          <div className="premium-card" style={{ padding: '8px 16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div className={`status-indicator ${data.isOffline ? 'status-offline' : 'status-online'}`} />
            <span style={{ fontSize: '14px', fontWeight: '600' }}>
              {data.isOffline ? t.simulator : t.hardware}
            </span>
          </div>
          <button className="secondary" onClick={exportData} title={t.exportData}><Download size={18} /></button>
          <button className="secondary" onClick={() => setIsCalibOpen(true)} title={t.settings}><Settings size={18} /></button>
        </div>
      </header>

      {/* Main Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>

        {/* Left Column: Hand Visualization */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <HandVisualizer injuredAngle={data.injured} healthyAngle={data.healthy} t={t} />

          <div className="premium-card" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--text-secondary)', marginBottom: '10px' }}>
                <RotateCcw size={20} />
                <span>{t.reps}</span>
              </div>
              <div style={{ fontSize: '3rem', fontWeight: '800' }}>{data.reps}</div>
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--text-secondary)', marginBottom: '10px' }}>
                <Activity size={20} />
                <span>{t.sessionTime}</span>
              </div>
              <div style={{ fontSize: '3rem', fontWeight: '800' }}>
                {Math.floor(sessionStats.duration / 60)}:{(sessionStats.duration % 60).toString().padStart(2, '0')}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Heart Rate and Stats */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

          <div className="premium-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
              <div style={{ background: 'rgba(255, 62, 62, 0.1)', padding: '15px', borderRadius: '15px' }}>
                <Heart color="var(--accent-red)" size={32} />
              </div>
              <div>
                <span style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>{t.currentBpm}</span>
                <div style={{ fontSize: '2.5rem', fontWeight: 'bold' }}>{data.hr} <span style={{ fontSize: '1rem', color: 'var(--text-secondary)' }}>bpm</span></div>
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ color: zone.color, fontWeight: 'bold', fontSize: '18px' }}>{zone.label}</div>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{t.zones.zone} {Math.floor(currentIntensity / 20) + 1}</div>
            </div>
          </div>

          <PulseChart history={sessionStats.history} title={t.hrTrend} />

          <div className="premium-card">
            <h3>{t.medicalInsights}</h3>
            <div style={{ marginTop: '15px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'start' }}>
                <CheckCircle2 color="var(--accent-green)" size={18} />
                <p style={{ fontSize: '14px' }} dangerouslySetInnerHTML={{ __html: t.insights.rom.replace('{val}', Math.round(data.injured)) }} />
              </div>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'start' }}>
                <Bell color="var(--accent-orange)" size={18} />
                <p style={{ fontSize: '14px' }}>
                  {data.hr > 140
                    ? t.insights.pulseAlert.replace('{val}', data.hr)
                    : t.insights.pulseNormal
                  }
                </p>
              </div>
            </div>
          </div>

        </div>
      </div>
      <Calibration isOpen={isCalibOpen} onClose={() => setIsCalibOpen(false)} t={t.calibration} />
    </div>
  );
};


export default App;
