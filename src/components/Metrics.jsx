const Metrics = ({ stats, config }) => {
    if (!stats) return null;

    const avgWait = stats.completed > 0 ? (stats.totalWaitTime / stats.completed / 1000).toFixed(2) : 0;
    const variance = stats.variance ? (stats.variance / 1000000).toFixed(2) : 0;
    const stdDev = stats.variance ? Math.sqrt(stats.variance / 1000000).toFixed(2) : 0;
    const totalAttempts = stats.completed + stats.rejected;
    const rejectRate = totalAttempts > 0 ? ((stats.rejected / totalAttempts) * 100).toFixed(1) : 0;
    const execRejectRate = totalAttempts > 0 ? ((stats.rejectedExec / totalAttempts) * 100).toFixed(1) : 0;
    const resultRejectRate = totalAttempts > 0 ? ((stats.rejectedResult / totalAttempts) * 100).toFixed(1) : 0;
    const backupEfficiency = stats.savedByBackup + stats.blankPages > 0
        ? ((stats.savedByBackup / (stats.savedByBackup + stats.blankPages)) * 100).toFixed(1)
        : 0;

    return (
        <div className="space-y-4">
            {/* Global Metrics */}
            <div className="grid grid-cols-5 gap-4">
                <MetricCard
                    label="Tâches Terminées"
                    value={stats.completed}
                    color="green"
                />
                <MetricCard
                    label="Rejetés (Exec)"
                    value={stats.rejectedExec}
                    subValue={`${execRejectRate}%`}
                    color="red"
                />
                <MetricCard
                    label="Rejetés (Résultat)"
                    value={stats.rejectedResult}
                    subValue={`${resultRejectRate}%`}
                    color="orange"
                />
                <MetricCard
                    label="Attente Moyenne (s)"
                    value={avgWait}
                    subValue={`σ = ${stdDev}s`}
                    color="blue"
                />
                <MetricCard
                    label="Variance (s²)"
                    value={variance}
                    color="purple"
                />
            </div>

            {/* Backup and Rejection Analysis */}
            {(config.backupProb > 0 || stats.blankPages > 0 || stats.savedByBackup > 0) && (
                <div className="grid grid-cols-4 gap-4">
                    <MetricCard
                        label="Sauvegardés (Backup)"
                        value={stats.savedByBackup}
                        color="green"
                    />
                    <MetricCard
                        label="Pages Blanches"
                        value={stats.blankPages}
                        color="orange"
                    />
                    <MetricCard
                        label="Efficacité Backup"
                        value={`${backupEfficiency}%`}
                        color="blue"
                    />
                    <MetricCard
                        label="Taux de Rejet Total"
                        value={`${rejectRate}%`}
                        color="red"
                    />
                </div>
            )}

            {/* Per-Population Stats */}
            {config.scenario === "Channels" && stats.popStats && (
                <div className="bg-white rounded-lg p-4 border border-slate-200 shadow-sm">
                    <h3 className="text-slate-700 font-semibold mb-3 text-sm">Indicateurs par Population</h3>
                    <div className="grid grid-cols-2 gap-4">
                        {Object.entries(stats.popStats).map(([pop, data]) => {
                            const avgWaitPop = data.completed > 0 ? (data.totalWaitTime / data.completed / 1000).toFixed(2) : 0;
                            const popVariance = data.waitTimes.length > 1
                                ? (data.waitTimes.reduce((sum, t) => sum + Math.pow(t - data.totalWaitTime / data.completed, 2), 0) / data.waitTimes.length / 1000000).toFixed(2)
                                : 0;
                            return (
                                <div key={pop} className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                                    <div className={`text-sm font-semibold mb-3 ${pop === "ING" ? "text-blue-600" : "text-red-600"}`}>
                                        Population {pop}
                                    </div>
                                    <div className="grid grid-cols-2 gap-3 text-sm">
                                        <div>
                                            <div className="text-slate-500 text-xs mb-1">Terminés</div>
                                            <div className="text-slate-900 font-semibold text-lg">{data.completed}</div>
                                        </div>
                                        <div>
                                            <div className="text-slate-500 text-xs mb-1">Rejetés</div>
                                            <div className="text-slate-900 font-semibold text-lg">{data.rejected}</div>
                                        </div>
                                        <div>
                                            <div className="text-slate-500 text-xs mb-1">Attente Moyenne</div>
                                            <div className="text-slate-900 font-semibold text-lg">{avgWaitPop}s</div>
                                        </div>
                                        <div>
                                            <div className="text-slate-500 text-xs mb-1">Variance (s²)</div>
                                            <div className="text-slate-900 font-semibold text-lg">{popVariance}</div>
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

const MetricCard = ({ label, value, subValue, color }) => {
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
            {subValue && <div className="text-xs opacity-75 mt-1">{subValue}</div>}
        </div>
    );
};

export default Metrics;