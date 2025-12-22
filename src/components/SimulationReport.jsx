import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';

const SimulationReport = ({ engine, config, onClose }) => {
    if (!engine || !engine.stats) return null;

    const stats = engine.stats;
    const history = engine.history;

    // Calculate derived metrics
    const avgWait = stats.completed > 0 ? stats.totalWaitTime / stats.completed / 1000 : 0;
    const variance = engine.getVariance() / 1000000;
    const stdDev = Math.sqrt(variance);
    const totalAttempts = stats.completed + stats.rejected;
    const rejectRate = totalAttempts > 0 ? (stats.rejected / totalAttempts) * 100 : 0;
    const execRejectRate = totalAttempts > 0 ? (stats.rejectedExec / totalAttempts) * 100 : 0;
    const resultRejectRate = totalAttempts > 0 ? (stats.rejectedResult / totalAttempts) * 100 : 0;
    const backupEfficiency = stats.savedByBackup + stats.blankPages > 0
        ? (stats.savedByBackup / (stats.savedByBackup + stats.blankPages)) * 100
        : 0;

    // Theoretical analysis based on M/M/K model
    const lambda = config.scenario === "Waterfall" ? config.arrivalRate : (config.ingRate + config.prepaRate);
    const mu = config.scenario === "Waterfall" ? (1 / config.avgExecTime) :
        ((config.ingRate * (1 / config.ingExecTime) + config.prepaRate * (1 / config.prepaExecTime)) / (config.ingRate + config.prepaRate));
    const K = config.numExecServers;
    const rho = lambda / (K * mu);
    const systemLoad = Math.min(rho * 100, 100);

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-4 rounded-t-2xl flex justify-between items-center sticky top-0">
                    <div>
                        <h2 className="text-2xl font-bold">Simulation Report</h2>
                        <p className="text-blue-100 text-sm">
                            {config.scenario} Model | Duration: {(engine.time / 1000).toFixed(1)}s
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="bg-white/20 hover:bg-white/30 rounded-lg px-4 py-2 font-medium transition-colors"
                    >
                        Close
                    </button>
                </div>

                <div className="p-6 space-y-6">
                    {/* Summary Metrics */}
                    <section>
                        <h3 className="text-lg font-semibold text-slate-800 mb-4">📊 Summary Metrics</h3>
                        <div className="grid grid-cols-5 gap-4">
                            <MetricBox label="Completed Jobs" value={stats.completed} color="green" />
                            <MetricBox label="Total Rejected" value={stats.rejected} sub={`${rejectRate.toFixed(1)}%`} color="red" />
                            <MetricBox label="Avg Wait Time" value={`${avgWait.toFixed(2)}s`} sub={`σ = ${stdDev.toFixed(2)}s`} color="blue" />
                            <MetricBox label="Variance" value={`${variance.toFixed(2)}s²`} color="purple" />
                            <MetricBox label="System Load (ρ)" value={`${systemLoad.toFixed(1)}%`} color={rho < 1 ? "green" : "red"} />
                        </div>
                    </section>

                    {/* Rejection Analysis */}
                    {(stats.rejectedExec > 0 || stats.rejectedResult > 0) && (
                        <section>
                            <h3 className="text-lg font-semibold text-slate-800 mb-4">🚫 Rejection Analysis</h3>
                            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                                <div className="grid grid-cols-3 gap-4">
                                    <div>
                                        <div className="text-red-600 text-2xl font-bold">{stats.rejectedExec}</div>
                                        <div className="text-red-700 text-sm">Rejected at Exec Queue ({execRejectRate.toFixed(1)}%)</div>
                                        <div className="text-red-500 text-xs mt-1">Students received error message</div>
                                    </div>
                                    <div>
                                        <div className="text-orange-600 text-2xl font-bold">{stats.rejectedResult}</div>
                                        <div className="text-orange-700 text-sm">Rejected at Result Queue ({resultRejectRate.toFixed(1)}%)</div>
                                        <div className="text-orange-500 text-xs mt-1">Work completed but results lost</div>
                                    </div>
                                    <div>
                                        <div className="text-slate-600 text-2xl font-bold">{stats.blankPages}</div>
                                        <div className="text-slate-700 text-sm">Blank Pages</div>
                                        <div className="text-slate-500 text-xs mt-1">Students received empty result</div>
                                    </div>
                                </div>
                            </div>
                        </section>
                    )}

                    {/* Backup Analysis */}
                    {(config.backupProb > 0 || stats.savedByBackup > 0) && (
                        <section>
                            <h3 className="text-lg font-semibold text-slate-800 mb-4">💾 Backup Analysis</h3>
                            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                                <div className="grid grid-cols-3 gap-4">
                                    <div>
                                        <div className="text-green-600 text-2xl font-bold">{stats.savedByBackup}</div>
                                        <div className="text-green-700 text-sm">Saved by Backup</div>
                                    </div>
                                    <div>
                                        <div className="text-green-600 text-2xl font-bold">{backupEfficiency.toFixed(1)}%</div>
                                        <div className="text-green-700 text-sm">Backup Efficiency</div>
                                    </div>
                                    <div>
                                        <div className="text-slate-600 text-2xl font-bold">{(config.backupProb * 100).toFixed(0)}%</div>
                                        <div className="text-slate-700 text-sm">Backup Probability</div>
                                    </div>
                                </div>
                                <div className="mt-4 p-3 bg-white rounded-lg text-sm text-slate-600">
                                    <strong>Analysis:</strong> {config.backupProb === 1
                                        ? "Systematic backup (100%) eliminates all blank pages but may create bottlenecks in high-load scenarios."
                                        : `Random backup (${(config.backupProb * 100).toFixed(0)}%) provides a balance between data protection and system performance.`
                                    }
                                </div>
                            </div>
                        </section>
                    )}

                    {/* Charts Row */}
                    <section>
                        <h3 className="text-lg font-semibold text-slate-800 mb-4">📈 Performance Charts</h3>
                        <div className="grid grid-cols-2 gap-6">
                            <ChartCard title="Queue Lengths Over Time">
                                <QueueLengthChart history={history} />
                            </ChartCard>
                            <ChartCard title="Server Utilization">
                                <UtilizationChart history={history} />
                            </ChartCard>
                        </div>
                    </section>

                    {/* Wait Time Distribution */}
                    <section>
                        <h3 className="text-lg font-semibold text-slate-800 mb-4">⏱️ Wait Time Distribution</h3>
                        <ChartCard title={`Distribution of ${stats.waitTimes.length} completed jobs`}>
                            <WaitTimeHistogram waitTimes={stats.waitTimes} />
                        </ChartCard>
                    </section>

                    {/* Population Comparison (Channels scenario) */}
                    {config.scenario === "Channels" && stats.popStats && (
                        <section>
                            <h3 className="text-lg font-semibold text-slate-800 mb-4">👥 Population Comparison</h3>
                            <div className="grid grid-cols-2 gap-6">
                                {Object.entries(stats.popStats).map(([pop, data]) => {
                                    const popAvgWait = data.completed > 0 ? data.totalWaitTime / data.completed / 1000 : 0;
                                    const popVariance = data.waitTimes.length > 1
                                        ? data.waitTimes.reduce((sum, t) => sum + Math.pow(t - data.totalWaitTime / data.completed, 2), 0) / data.waitTimes.length / 1000000
                                        : 0;
                                    return (
                                        <div key={pop} className={`p-4 rounded-lg border-2 ${pop === "ING" ? "bg-blue-50 border-blue-200" : "bg-red-50 border-red-200"}`}>
                                            <div className={`text-xl font-bold mb-3 ${pop === "ING" ? "text-blue-600" : "text-red-600"}`}>
                                                {pop} Population
                                            </div>
                                            <div className="grid grid-cols-2 gap-4 text-sm">
                                                <div>
                                                    <div className="text-slate-500">Completed</div>
                                                    <div className="text-2xl font-bold text-slate-900">{data.completed}</div>
                                                </div>
                                                <div>
                                                    <div className="text-slate-500">Rejected</div>
                                                    <div className="text-2xl font-bold text-slate-900">{data.rejected}</div>
                                                </div>
                                                <div>
                                                    <div className="text-slate-500">Avg Wait Time</div>
                                                    <div className="text-2xl font-bold text-slate-900">{popAvgWait.toFixed(2)}s</div>
                                                </div>
                                                <div>
                                                    <div className="text-slate-500">Variance</div>
                                                    <div className="text-2xl font-bold text-slate-900">{popVariance.toFixed(2)}s²</div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                            <div className="mt-4 p-4 bg-slate-50 rounded-lg text-sm text-slate-600">
                                <strong>Observation:</strong> {getPopulationAnalysis(stats.popStats, config)}
                            </div>
                        </section>
                    )}

                    {/* Theoretical Analysis */}
                    <section>
                        <h3 className="text-lg font-semibold text-slate-800 mb-4">📚 Theoretical Analysis</h3>
                        <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 space-y-4 text-sm">
                            <div>
                                <strong>System Model:</strong> {config.scenario === "Waterfall" ? "M/M/K" : "Multi-class M/M/K"} with {K} servers
                            </div>
                            <div>
                                <strong>Traffic Intensity (ρ):</strong> λ/(K×μ) = {lambda.toFixed(2)}/({K}×{mu.toFixed(2)}) = {rho.toFixed(3)}
                                {rho >= 1 && <span className="text-red-600 ml-2">⚠️ System overloaded (ρ ≥ 1)</span>}
                            </div>
                            {config.execQueueCap !== Infinity && (
                                <div>
                                    <strong>Finite Queue (ks={config.execQueueCap}):</strong> Rejection occurs when queue is full. Observed rejection rate: {execRejectRate.toFixed(1)}%
                                </div>
                            )}
                            {config.resultQueueCap !== Infinity && (
                                <div>
                                    <strong>Finite Result Queue (kf={config.resultQueueCap}):</strong> Creates blank pages when full.
                                    {config.backupProb > 0 && ` Backup mechanism saves ${backupEfficiency.toFixed(0)}% of potential losses.`}
                                </div>
                            )}
                            <div>
                                <strong>Little's Law Verification:</strong> L = λ × W ≈ {(lambda * avgWait).toFixed(2)} jobs in system
                            </div>
                        </div>
                    </section>
                </div>
            </div>
        </div>
    );
};

// Metric Box Component
const MetricBox = ({ label, value, sub, color }) => {
    const colors = {
        green: 'bg-emerald-50 border-emerald-200 text-emerald-700',
        red: 'bg-red-50 border-red-200 text-red-700',
        blue: 'bg-blue-50 border-blue-200 text-blue-700',
        purple: 'bg-purple-50 border-purple-200 text-purple-700',
        orange: 'bg-orange-50 border-orange-200 text-orange-700'
    };
    return (
        <div className={`${colors[color]} rounded-lg p-4 border`}>
            <div className="text-xs font-medium opacity-75 mb-1">{label}</div>
            <div className="text-2xl font-bold">{value}</div>
            {sub && <div className="text-xs opacity-75">{sub}</div>}
        </div>
    );
};

// Chart Card Component
const ChartCard = ({ title, children }) => (
    <div className="bg-white border border-slate-200 rounded-lg p-4">
        <div className="text-sm font-medium text-slate-600 mb-3">{title}</div>
        {children}
    </div>
);

// Queue Length Chart (D3)
const QueueLengthChart = ({ history }) => {
    const svgRef = useRef();

    useEffect(() => {
        if (!history || !history.time.length) return;

        const svg = d3.select(svgRef.current);
        svg.selectAll("*").remove();

        const width = 400;
        const height = 150;
        const margin = { top: 20, right: 60, bottom: 30, left: 40 };

        const x = d3.scaleLinear()
            .domain([0, d3.max(history.time) || 1])
            .range([margin.left, width - margin.right]);

        const y = d3.scaleLinear()
            .domain([0, Math.max(d3.max(history.execQueue) || 1, d3.max(history.resultQueue) || 1)])
            .nice()
            .range([height - margin.bottom, margin.top]);

        // X Axis
        svg.append("g")
            .attr("transform", `translate(0,${height - margin.bottom})`)
            .call(d3.axisBottom(x).ticks(5))
            .call(g => g.append("text")
                .attr("x", width - margin.right)
                .attr("y", -4)
                .attr("fill", "currentColor")
                .attr("text-anchor", "end")
                .text("Time (s)"));

        // Y Axis
        svg.append("g")
            .attr("transform", `translate(${margin.left},0)`)
            .call(d3.axisLeft(y).ticks(5));

        // Exec Queue Line
        const lineExec = d3.line()
            .x((d, i) => x(history.time[i]))
            .y(d => y(d));

        svg.append("path")
            .datum(history.execQueue)
            .attr("fill", "none")
            .attr("stroke", "#3b82f6")
            .attr("stroke-width", 2)
            .attr("d", lineExec);

        // Result Queue Line
        const lineResult = d3.line()
            .x((d, i) => x(history.time[i]))
            .y(d => y(d));

        svg.append("path")
            .datum(history.resultQueue)
            .attr("fill", "none")
            .attr("stroke", "#8b5cf6")
            .attr("stroke-width", 2)
            .attr("d", lineResult);

        // Legend
        svg.append("circle").attr("cx", width - 55).attr("cy", 15).attr("r", 5).style("fill", "#3b82f6");
        svg.append("text").attr("x", width - 45).attr("y", 15).text("Exec").style("font-size", "10px").attr("alignment-baseline", "middle");
        svg.append("circle").attr("cx", width - 55).attr("cy", 30).attr("r", 5).style("fill", "#8b5cf6");
        svg.append("text").attr("x", width - 45).attr("y", 30).text("Result").style("font-size", "10px").attr("alignment-baseline", "middle");

    }, [history]);

    return <svg ref={svgRef} width="100%" height="150" viewBox="0 0 400 150" />;
};

// Utilization Chart (D3)
const UtilizationChart = ({ history }) => {
    const svgRef = useRef();

    useEffect(() => {
        if (!history || !history.time.length) return;

        const svg = d3.select(svgRef.current);
        svg.selectAll("*").remove();

        const width = 400;
        const height = 150;
        const margin = { top: 20, right: 20, bottom: 30, left: 40 };

        const x = d3.scaleLinear()
            .domain([0, d3.max(history.time) || 1])
            .range([margin.left, width - margin.right]);

        const y = d3.scaleLinear()
            .domain([0, 100])
            .range([height - margin.bottom, margin.top]);

        // Area fill
        const area = d3.area()
            .x((d, i) => x(history.time[i]))
            .y0(height - margin.bottom)
            .y1(d => y(d));

        svg.append("path")
            .datum(history.utilization)
            .attr("fill", "rgba(16, 185, 129, 0.2)")
            .attr("d", area);

        // Line
        const line = d3.line()
            .x((d, i) => x(history.time[i]))
            .y(d => y(d));

        svg.append("path")
            .datum(history.utilization)
            .attr("fill", "none")
            .attr("stroke", "#10b981")
            .attr("stroke-width", 2)
            .attr("d", line);

        // X Axis
        svg.append("g")
            .attr("transform", `translate(0,${height - margin.bottom})`)
            .call(d3.axisBottom(x).ticks(5));

        // Y Axis
        svg.append("g")
            .attr("transform", `translate(${margin.left},0)`)
            .call(d3.axisLeft(y).ticks(5).tickFormat(d => d + "%"));

    }, [history]);

    return <svg ref={svgRef} width="100%" height="150" viewBox="0 0 400 150" />;
};

// Wait Time Histogram (D3)
const WaitTimeHistogram = ({ waitTimes }) => {
    const svgRef = useRef();

    useEffect(() => {
        if (!waitTimes || !waitTimes.length) return;

        const svg = d3.select(svgRef.current);
        svg.selectAll("*").remove();

        const width = 800;
        const height = 200;
        const margin = { top: 20, right: 20, bottom: 40, left: 50 };

        // Convert to seconds
        const data = waitTimes.map(t => t / 1000);

        const x = d3.scaleLinear()
            .domain([0, d3.max(data) || 1])
            .range([margin.left, width - margin.right]);

        const histogram = d3.histogram()
            .domain(x.domain())
            .thresholds(x.ticks(20));

        const bins = histogram(data);

        const y = d3.scaleLinear()
            .domain([0, d3.max(bins, d => d.length) || 1])
            .nice()
            .range([height - margin.bottom, margin.top]);

        // Bars
        svg.selectAll("rect")
            .data(bins)
            .join("rect")
            .attr("x", d => x(d.x0) + 1)
            .attr("width", d => Math.max(0, x(d.x1) - x(d.x0) - 2))
            .attr("y", d => y(d.length))
            .attr("height", d => y(0) - y(d.length))
            .attr("fill", "#3b82f6")
            .attr("rx", 2);

        // X Axis
        svg.append("g")
            .attr("transform", `translate(0,${height - margin.bottom})`)
            .call(d3.axisBottom(x).ticks(10))
            .call(g => g.append("text")
                .attr("x", width / 2)
                .attr("y", 30)
                .attr("fill", "currentColor")
                .attr("text-anchor", "middle")
                .text("Wait Time (seconds)"));

        // Y Axis
        svg.append("g")
            .attr("transform", `translate(${margin.left},0)`)
            .call(d3.axisLeft(y).ticks(5))
            .call(g => g.append("text")
                .attr("transform", "rotate(-90)")
                .attr("x", -height / 2)
                .attr("y", -35)
                .attr("fill", "currentColor")
                .attr("text-anchor", "middle")
                .text("Frequency"));

    }, [waitTimes]);

    return <svg ref={svgRef} width="100%" height="200" viewBox="0 0 800 200" />;
};

// Population Analysis Helper
function getPopulationAnalysis(popStats, config) {
    if (!popStats.ING || !popStats.PREPA) return "";

    const ingAvg = popStats.ING.completed > 0 ? popStats.ING.totalWaitTime / popStats.ING.completed / 1000 : 0;
    const prepaAvg = popStats.PREPA.completed > 0 ? popStats.PREPA.totalWaitTime / popStats.PREPA.completed / 1000 : 0;

    if (prepaAvg > ingAvg * 1.5) {
        return `PREPA students experience ${(prepaAvg / ingAvg).toFixed(1)}x longer wait times than ING students. This is expected due to their longer execution times (${config.prepaExecTime}s vs ${config.ingExecTime}s) which occupy servers longer.`;
    } else if (ingAvg > prepaAvg * 1.5) {
        return `ING students surprisingly have longer wait times. This may be due to higher arrival rates overwhelming the system despite shorter job times.`;
    } else {
        return `Both populations have similar wait times, suggesting a well-balanced system configuration.`;
    }
}

export default SimulationReport;
