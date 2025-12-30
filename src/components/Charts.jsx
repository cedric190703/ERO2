import React from 'react';

const Charts = ({ engine }) => {
    if (!engine || !engine.history) return null;

    const { history } = engine;
    const maxDataPoints = 50;
    const recentHistory = {
        time: history.time.slice(-maxDataPoints),
        execQueue: history.execQueue.slice(-maxDataPoints),
        resultQueue: history.resultQueue.slice(-maxDataPoints),
        utilization: history.utilization.slice(-maxDataPoints)
    };

    return (
        <div className="space-y-6">
            <div>
                <h3 className="text-slate-700 font-semibold text-sm mb-4">Indicateurs de Performance</h3>
                <div className="space-y-4">
                    <MiniChart
                        data={recentHistory.execQueue}
                        label="File d'Exécution"
                        color="#3b82f6"
                    />
                    <MiniChart
                        data={recentHistory.resultQueue}
                        label="File de Résultats"
                        color="#8b5cf6"
                    />
                    <MiniChart
                        data={recentHistory.utilization}
                        label="Utilisation Serveurs (%)"
                        color="#10b981"
                    />
                </div>
            </div>

            <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                <h4 className="text-slate-700 text-xs font-semibold mb-3 uppercase tracking-wide">Légende</h4>
                <div className="space-y-2 text-xs">
                    <LegendItem color="#3b82f6" label="ING / Standard" />
                    <LegendItem color="#ef4444" label="PREPA" />
                    <LegendItem color="#10b981" label="Serveur Libre" />
                    <LegendItem color="#3b82f6" label="Serveur Occupé" />
                    <LegendItem color="#94a3b8" label="Rejeté" />
                </div>
            </div>

            <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                <h4 className="text-slate-700 text-xs font-semibold mb-3 uppercase tracking-wide">État du Système</h4>
                <div className="space-y-2 text-xs">
                    <StatusRow label="Temps de Simulation" value={`${(engine.time / 1000).toFixed(1)}s`} />
                    <StatusRow label="Étudiants Actifs" value={engine.students.filter(s => s.status !== "Done" && !s.status.includes("Rejected")).length} />
                    <StatusRow label="Dans les Files" value={engine.execQueue.length + engine.resultQueue.length} />
                </div>
            </div>
        </div>
    );
};

const MiniChart = ({ data, label, color }) => {
    if (!data || data.length === 0) return null;

    const max = Math.max(...data, 1);
    const width = 240;
    const height = 60;
    const padding = 4;

    const points = data.map((val, i) => {
        const x = padding + (i / (data.length - 1 || 1)) * (width - 2 * padding);
        const y = height - padding - (val / max) * (height - 2 * padding);
        return { x, y };
    });

    const pathData = points.length > 0
        ? `M ${points[0].x} ${points[0].y} ` + points.slice(1).map(p => `L ${p.x} ${p.y}`).join(' ')
        : '';

    const areaData = points.length > 0
        ? pathData + ` L ${width - padding} ${height} L ${padding} ${height} Z`
        : '';

    return (
        <div>
            <div className="text-xs text-slate-600 font-medium mb-2">{label}</div>
            <div className="bg-white rounded-lg p-3 border border-slate-200">
                <svg width={width} height={height} className="w-full">
                    <defs>
                        <linearGradient id={`gradient-${label}`} x1="0%" y1="0%" x2="0%" y2="100%">
                            <stop offset="0%" stopColor={color} stopOpacity="0.2" />
                            <stop offset="100%" stopColor={color} stopOpacity="0.05" />
                        </linearGradient>
                    </defs>
                    <path d={areaData} fill={`url(#gradient-${label})`} />
                    <path d={pathData} stroke={color} strokeWidth="2.5" fill="none" />
                    {points.map((p, i) => (
                        <circle key={i} cx={p.x} cy={p.y} r="2" fill={color} opacity={i === points.length - 1 ? 1 : 0} />
                    ))}
                </svg>
                <div className="text-xs text-slate-900 font-semibold mt-2">
                    Current: {data[data.length - 1] || 0}
                </div>
            </div>
        </div>
    );
};

const LegendItem = ({ color, label }) => (
    <div className="flex items-center space-x-2">
        <div className="w-4 h-4 rounded" style={{ backgroundColor: color }}></div>
        <span className="text-slate-600">{label}</span>
    </div>
);

const StatusRow = ({ label, value }) => (
    <div className="flex justify-between items-center">
        <span className="text-slate-600">{label}</span>
        <span className="text-slate-900 font-semibold">{value}</span>
    </div>
);

export default Charts;
