import React from 'react';

const Metrics = ({ stats, config }) => {
    if (!stats) return null;

    const avgWait = stats.completed > 0 ? (stats.totalWaitTime / stats.completed / 1000).toFixed(2) : 0;
    const variance = stats.variance ? (stats.variance / 1000000).toFixed(2) : 0;
    const rejectRate = ((stats.rejected / (stats.completed + stats.rejected)) * 100).toFixed(1);

    return (
        <div className="space-y-4">
            {/* Global Metrics */}
            <div className="grid grid-cols-5 gap-4">
                <MetricCard
                    label="Completed Jobs"
                    value={stats.completed}
                    color="green"
                />
                <MetricCard
                    label="Rejected (Exec)"
                    value={stats.rejectedExec}
                    color="red"
                />
                <MetricCard
                    label="Rejected (Result)"
                    value={stats.rejectedResult}
                    color="orange"
                />
                <MetricCard
                    label="Avg Wait Time (s)"
                    value={avgWait}
                    color="blue"
                />
                <MetricCard
                    label="Variance (s²)"
                    value={variance}
                    color="purple"
                />
            </div>

            {/* Per-Population Stats */}
            {config.scenario === "Channels" && stats.popStats && (
                <div className="bg-white rounded-lg p-4 border border-slate-200 shadow-sm">
                    <h3 className="text-slate-700 font-semibold mb-3 text-sm">Population Metrics</h3>
                    <div className="grid grid-cols-2 gap-4">
                        {Object.entries(stats.popStats).map(([pop, data]) => {
                            const avgWaitPop = data.completed > 0 ? (data.totalWaitTime / data.completed / 1000).toFixed(2) : 0;
                            return (
                                <div key={pop} className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                                    <div className={`text-sm font-semibold mb-3 ${pop === "ING" ? "text-blue-600" : "text-red-600"}`}>
                                        {pop} Population
                                    </div>
                                    <div className="grid grid-cols-2 gap-3 text-sm">
                                        <div>
                                            <div className="text-slate-500 text-xs mb-1">Completed</div>
                                            <div className="text-slate-900 font-semibold text-lg">{data.completed}</div>
                                        </div>
                                        <div>
                                            <div className="text-slate-500 text-xs mb-1">Rejected</div>
                                            <div className="text-slate-900 font-semibold text-lg">{data.rejected}</div>
                                        </div>
                                        <div className="col-span-2 pt-2 border-t border-slate-200">
                                            <div className="text-slate-500 text-xs mb-1">Avg Wait Time</div>
                                            <div className="text-slate-900 font-semibold text-lg">{avgWaitPop}s</div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
};

const MetricCard = ({ label, value, color }) => {
    const colorClasses = {
        green: 'bg-emerald-50 border-emerald-200 text-emerald-700',
        red: 'bg-red-50 border-red-200 text-red-700',
        orange: 'bg-orange-50 border-orange-200 text-orange-700',
        blue: 'bg-blue-50 border-blue-200 text-blue-700',
        purple: 'bg-purple-50 border-purple-200 text-purple-700'
    };

    return (
        <div className={`${colorClasses[color]} rounded-lg p-4 border shadow-sm`}>
            <div className="text-xs font-medium mb-2 opacity-75">{label}</div>
            <div className="text-2xl font-bold">{value}</div>
        </div>
    );
};

export default Metrics;
