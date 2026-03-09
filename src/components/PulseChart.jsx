import React from 'react';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    AreaChart,
    Area
} from 'recharts';

const PulseChart = ({ history, title }) => {
    return (
        <div className="premium-card" style={{ height: '300px', padding: '1rem' }}>
            <h3 style={{ marginBottom: '1rem' }}>{title}</h3>
            <ResponsiveContainer width="100%" height="80%">
                <AreaChart data={history}>
                    <defs>
                        <linearGradient id="colorPulse" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="var(--accent-red)" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="var(--accent-red)" stopOpacity={0} />
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--text-muted)" vertical={false} />
                    <XAxis
                        dataKey="time"
                        hide
                    />
                    <YAxis
                        domain={[40, 180]}
                        stroke="var(--text-secondary)"
                        fontSize={12}
                        tickFormatter={(val) => `${val}`}
                    />
                    <Tooltip
                        contentStyle={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--glass-border)', borderRadius: '8px' }}
                        itemStyle={{ color: 'var(--accent-red)' }}
                    />
                    <Area
                        type="monotone"
                        dataKey="hr"
                        stroke="var(--accent-red)"
                        fillOpacity={1}
                        fill="url(#colorPulse)"
                        isAnimationActive={false}
                    />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    );
};

export default PulseChart;
