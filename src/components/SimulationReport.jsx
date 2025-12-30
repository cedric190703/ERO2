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
                        <h2 className="text-2xl font-bold">Rapport de Simulation</h2>
                        <p className="text-blue-100 text-sm">
                            Modèle {config.scenario} | Durée : {(engine.time / 1000).toFixed(1)}s
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="bg-white/20 hover:bg-white/30 rounded-lg px-4 py-2 font-medium transition-colors"
                    >
                        Fermer
                    </button>
                </div>

                <div className="p-6 space-y-6">
                    {/* Summary Metrics */}
                    <section>
                        <h3 className="text-lg font-semibold text-slate-800 mb-4">Indicateurs de Synthèse</h3>
                        <div className="grid grid-cols-5 gap-4">
                            <MetricBox label="Tâches Terminées" value={stats.completed} color="green" />
                            <MetricBox label="Total Rejetés" value={stats.rejected} sub={`${rejectRate.toFixed(1)}%`} color="red" />
                            <MetricBox label="Attente Moyenne" value={`${avgWait.toFixed(2)}s`} sub={`σ = ${stdDev.toFixed(2)}s`} color="blue" />
                            <MetricBox label="Variance" value={`${variance.toFixed(2)}s²`} color="purple" />
                            <MetricBox label="Charge Système (ρ)" value={`${systemLoad.toFixed(1)}%`} color={rho < 1 ? "green" : "red"} />
                        </div>
                    </section>

                    {/* Rejection Analysis */}
                    {(stats.rejectedExec > 0 || stats.rejectedResult > 0) && (
                        <section>
                            <h3 className="text-lg font-semibold text-slate-800 mb-4">Analyse des Rejets</h3>
                            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                                <div className="grid grid-cols-3 gap-4">
                                    <div>
                                        <div className="text-red-600 text-2xl font-bold">{stats.rejectedExec}</div>
                                        <div className="text-red-700 text-sm">Rejetés File Exec ({execRejectRate.toFixed(1)}%)</div>
                                        <div className="text-red-500 text-xs mt-1">Les étudiants reçoivent un message d'erreur</div>
                                    </div>
                                    <div>
                                        <div className="text-orange-600 text-2xl font-bold">{stats.rejectedResult}</div>
                                        <div className="text-orange-700 text-sm">Rejetés File Résultat ({resultRejectRate.toFixed(1)}%)</div>
                                        <div className="text-orange-500 text-xs mt-1">Travail terminé mais résultats perdus</div>
                                    </div>
                                    <div>
                                        <div className="text-slate-600 text-2xl font-bold">{stats.blankPages}</div>
                                        <div className="text-slate-700 text-sm">Pages Blanches</div>
                                        <div className="text-slate-500 text-xs mt-1">Les étudiants reçoivent un résultat vide</div>
                                    </div>
                                </div>
                            </div>
                        </section>
                    )}

                    {/* Backup Analysis */}
                    {(config.backupProb > 0 || stats.savedByBackup > 0) && (
                        <section>
                            <h3 className="text-lg font-semibold text-slate-800 mb-4">Analyse du Backup</h3>
                            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                                <div className="grid grid-cols-3 gap-4">
                                    <div>
                                        <div className="text-green-600 text-2xl font-bold">{stats.savedByBackup}</div>
                                        <div className="text-green-700 text-sm">Sauvés par le Backup</div>
                                    </div>
                                    <div>
                                        <div className="text-green-600 text-2xl font-bold">{backupEfficiency.toFixed(1)}%</div>
                                        <div className="text-green-700 text-sm">Efficacité du Backup</div>
                                    </div>
                                    <div>
                                        <div className="text-slate-600 text-2xl font-bold">{(config.backupProb * 100).toFixed(0)}%</div>
                                        <div className="text-slate-700 text-sm">Probabilité de Backup</div>
                                    </div>
                                </div>
                                <div className="mt-4 p-3 bg-white rounded-lg text-sm text-slate-600">
                                    <strong>Analyse :</strong> {config.backupProb === 1
                                        ? "Le backup systématique (100%) élimine toutes les pages blanches mais peut créer des goulets d'étranglement en cas de forte charge."
                                        : `Le backup aléatoire (${(config.backupProb * 100).toFixed(0)}%) offre un équilibre entre protection des données et performance du système.`
                                    }
                                </div>
                            </div>
                        </section>
                    )}

                    {/* Charts Row */}
                    <section>
                        <h3 className="text-lg font-semibold text-slate-800 mb-4">Graphiques de Performance</h3>
                        <div className="grid grid-cols-2 gap-6">
                            <ChartCard title="Longueur des Files au Cours du Temps">
                                <QueueLengthChart history={history} />
                            </ChartCard>
                            <ChartCard title="Utilisation des Serveurs">
                                <UtilizationChart history={history} />
                            </ChartCard>
                        </div>
                    </section>

                    {/* Wait Time Distribution */}
                    <section>
                        <h3 className="text-lg font-semibold text-slate-800 mb-4">Distribution du Temps d'Attente</h3>
                        <ChartCard title={`Distribution de ${stats.waitTimes.length} tâches terminées`}>
                            <WaitTimeHistogram waitTimes={stats.waitTimes} />
                        </ChartCard>
                    </section>

                    {/* Population Comparison (Channels scenario) */}
                    {config.scenario === "Channels" && stats.popStats && (
                        <section>
                            <h3 className="text-lg font-semibold text-slate-800 mb-4">Comparaison par Population</h3>
                            <div className="grid grid-cols-2 gap-6">
                                {Object.entries(stats.popStats).map(([pop, data]) => {
                                    const popAvgWait = data.completed > 0 ? data.totalWaitTime / data.completed / 1000 : 0;
                                    const popVariance = data.waitTimes.length > 1
                                        ? data.waitTimes.reduce((sum, t) => sum + Math.pow(t - data.totalWaitTime / data.completed, 2), 0) / data.waitTimes.length / 1000000
                                        : 0;
                                    return (
                                        <div key={pop} className={`p-4 rounded-lg border-2 ${pop === "ING" ? "bg-blue-50 border-blue-200" : "bg-red-50 border-red-200"}`}>
                                            <div className={`text-xl font-bold mb-3 ${pop === "ING" ? "text-blue-600" : "text-red-600"}`}>
                                                Population {pop}
                                            </div>
                                            <div className="grid grid-cols-2 gap-4 text-sm">
                                                <div>
                                                    <div className="text-slate-500">Terminés</div>
                                                    <div className="text-2xl font-bold text-slate-900">{data.completed}</div>
                                                </div>
                                                <div>
                                                    <div className="text-slate-500">Rejetés</div>
                                                    <div className="text-2xl font-bold text-slate-900">{data.rejected}</div>
                                                </div>
                                                <div>
                                                    <div className="text-slate-500">Attente Moyenne</div>
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
                                <strong>Observation :</strong> {getPopulationAnalysis(stats.popStats, config)}
                            </div>
                        </section>
                    )}

                    {/* SAÉ Analysis - Waterfall Questions */}
                    {config.scenario === "Waterfall" && (
                        <section>
                            <h3 className="text-lg font-semibold text-slate-800 mb-4">Analyse SAÉ - Modèle Waterfall</h3>
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-4">
                                {/* Q1: System Model */}
                                <AnalysisItem
                                    question="1. Système d'attente proposé"
                                    answer={`Le système modélise une architecture en cascade (Waterfall) composée d'un modèle M/M/K pour l'exécution (K=${K} serveurs, arrivées λ=${lambda.toFixed(2)} jobs/s, service μ=${mu.toFixed(2)} jobs/s) suivi d'un modèle M/M/1 pour le traitement des résultats. Les files FIFO peuvent être configurées comme ${config.execQueueCap === Infinity ? 'infinies' : `finies (ks=${config.execQueueCap} pour l'exécution, kf=${config.resultQueueCap} pour les résultats)`}.`}
                                />

                                {/* Q2: Rejection Analysis */}
                                <AnalysisItem
                                    question="2. Proportions de refus selon les paramètres"
                                    answer={`
                                        • Rejets File Exec (ks=${config.execQueueCap === Infinity ? '∞' : config.execQueueCap}) : ${execRejectRate.toFixed(2)}% (${stats.rejectedExec} rejets). Ces étudiants reçoivent un message d'erreur immédiat.
                                        • Rejets File Result (kf=${config.resultQueueCap === Infinity ? '∞' : config.resultQueueCap}) : ${resultRejectRate.toFixed(2)}% (${stats.rejectedResult} rejets). Cela génère des 'pages blanches', le pire cas utilisateur car le travail est fait mais le résultat est perdu.
                                        • État du système : Avec ρ=${rho.toFixed(3)}, le système est ${rho >= 1 ? 'SATURÉ (ρ≥1)' : rho > 0.8 ? 'proche de la saturation' : 'stable'}.
                                        • Recommandation : Maintenir ρ < 0.8 pour absorber les pics de charge. Si les pages blanches persistent, augmenter kf ou activer le backup.
                                    `}
                                />

                                {/* Q3: Backup Analysis */}
                                <AnalysisItem
                                    question="3. Analyse du mécanisme de backup"
                                    answer={`
                                        • Efficacité : Le backup a sauvé ${stats.savedByBackup} jobs critiques sur ${stats.savedByBackup + stats.blankPages} pertes potentielles (Efficacité : ${backupEfficiency.toFixed(1)}%).
                                        • Compromis du backup systématique (100%) :
                                          - Avantage : Élimine totalement les pages blanches.
                                          - Inconvénients : Double les besoins en stockage, risque de goulot d'étranglement si le stockage est lent, et complexité de récupération.
                                        • Avantage du backup aléatoire (${(config.backupProb * 100).toFixed(0)}%) : Offre un compromis linéaire entre coût de stockage et fiabilité utilisateur.
                                    `}
                                />

                                {/* Q3 continued: Sojourn Time */}
                                <AnalysisItem
                                    question="Temps de séjour moyen et variance empirique"
                                    answer={`
                                        • Temps de séjour moyen (W) : ${avgWait.toFixed(3)}s
                                        • Variance empirique : ${variance.toFixed(4)}s² (Écart-type σ : ${stdDev.toFixed(3)}s)
                                        • Validation Loi de Little : L = λ·W ≈ ${(lambda * avgWait).toFixed(2)} jobs en moyenne dans le système.
                                        • Comparaison théorique : Pour un M/M/K stable, Wq ≈ ${(rho < 1 ? (1 / (K * mu - lambda)).toFixed(4) : '∞')}s (temps d'attente théorique en file).
                                    `}
                                />

                                {/* Parameters Summary */}
                                <div className="bg-white rounded-lg p-3 text-xs">
                                    <strong>Paramètres utilisés:</strong> λ={lambda.toFixed(2)} jobs/s, μ={mu.toFixed(2)} jobs/s, K={K} serveurs,
                                    ks={config.execQueueCap === Infinity ? '∞' : config.execQueueCap},
                                    kf={config.resultQueueCap === Infinity ? '∞' : config.resultQueueCap},
                                    backup={config.backupProb * 100}%
                                </div>
                            </div>
                        </section>
                    )}

                    {/* SAÉ Analysis - Channels & Dams Questions */}
                    {config.scenario === "Channels" && (
                        <section>
                            <h3 className="text-lg font-semibold text-slate-800 mb-4">Analyse SAÉ - Modèle Channels & Dams</h3>
                            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 space-y-4">
                                {/* Q1: Population Variations */}
                                <AnalysisItem
                                    question="1. Variations de temps de séjour par population"
                                    answer={`
                                        ${stats.popStats?.ING && stats.popStats?.PREPA ? `
                                        • ING (Arrivées fréquentes, jobs courts) : λ=${config.ingRate.toFixed(2)} jobs/s, μ=${(1 / config.ingExecTime).toFixed(2)} jobs/s. Temps de séjour moyen : ${(stats.popStats.ING.totalWaitTime / (stats.popStats.ING.completed || 1) / 1000).toFixed(3)}s.
                                        • PREPA (Arrivées rares, jobs longs) : λ=${config.prepaRate.toFixed(2)} jobs/s, μ=${(1 / config.prepaExecTime).toFixed(2)} jobs/s. Temps de séjour moyen : ${(stats.popStats.PREPA.totalWaitTime / (stats.popStats.PREPA.completed || 1) / 1000).toFixed(3)}s.
                                        • Inéquité : Les PREPA attendent ${((stats.popStats.PREPA.totalWaitTime / (stats.popStats.PREPA.completed || 1)) / (stats.popStats.ING.totalWaitTime / (stats.popStats.ING.completed || 1))).toFixed(2)}x plus que les ING en raison de leur temps d'exécution plus long qui monopolise les serveurs.
                                        ` : 'Données de population non disponibles'}
                                    `}
                                />

                                {/* Q2: Dam Analysis */}
                                <AnalysisItem
                                    question="2. Analyse du mécanisme de Dam (Barrage)"
                                    answer={`
                                        • Fonctionnement : Le barrage bloque périodiquement l'accès aux serveurs (tb=${config.damBlockTime}s) pour réguler le flux des ING.
                                        • Impact : ${config.damEnabled ? `Actif. Il réduit l'inéquité en accumulant les ING dans la file, offrant des fenêtres plus libres aux PREPA. Cependant, il augmente la variance globale et le temps de séjour moyen total.` : `Inactif. Le système fonctionne en flux libre, favorisant l'efficacité globale au détriment de l'équité pour les PREPA.`}
                                    `}
                                />

                                {/* Q2 continued: Alternative Scheduling */}
                                <AnalysisItem
                                    question="3. Stratégies d'ordonnancement et optimalité"
                                    answer={`
                                        • SJF (Shortest Job First) : ${config.priorityMode === 'SJF' ? 'Actuellement sélectionné.' : 'Optionnelle.'} C'est la stratégie optimale pour minimiser le temps de séjour moyen global (Théorème de Smith). Elle priorise les ING (jobs courts).
                                        • Compromis Équité vs Efficacité : SJF est le plus efficace mais le moins équitable (risque de famine pour les PREPA). Le Dam ou la priorité PREPA augmentent l'équité mais dégradent le temps moyen global.
                                        • Recommandation : Utiliser SJF avec un mécanisme de 'timeout' (vieillissement) pour garantir que les PREPA finissent par être servis.
                                    `}
                                />

                                {/* Parameters Summary */}
                                <div className="bg-white rounded-lg p-3 text-xs">
                                    <strong>Paramètres:</strong>
                                    ING: λ={config.ingRate}, μ={1 / config.ingExecTime.toFixed(2)} |
                                    PREPA: λ={config.prepaRate}, μ={1 / config.prepaExecTime.toFixed(2)} |
                                    K={K} serveurs, Dam={config.damEnabled ? 'ON' : 'OFF'}, Mode={config.priorityMode}
                                </div>
                            </div>
                        </section>
                    )}

                    {/* Theoretical Analysis (Common) */}
                    <section>
                        <h3 className="text-lg font-semibold text-slate-800 mb-4">Modèle Théorique</h3>
                        <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 space-y-3 text-sm">
                            <div>
                                <strong>Système modélisé :</strong> {config.scenario === "Waterfall" ? "M/M/K → M/M/1" : "Multi-classe M/M/K"} avec K={K} serveurs
                            </div>
                            <div>
                                <strong>Intensité du trafic (ρ) :</strong> λ/(K×μ) = {lambda.toFixed(2)}/({K}×{mu.toFixed(2)}) = <span className={rho >= 1 ? 'text-red-600 font-bold' : rho > 0.8 ? 'text-orange-600 font-bold' : 'text-green-600 font-bold'}>{rho.toFixed(3)}</span>
                                {rho >= 1 && <span className="text-red-600 ml-2">⚠️ Système saturé !</span>}
                            </div>
                            <div>
                                <strong>Stabilité :</strong> {rho < 1 ? `Système stable (ρ=${rho.toFixed(3)} < 1)` : `Système instable (ρ=${rho.toFixed(3)} ≥ 1) - les files croîtront indéfiniment`}
                            </div>
                            <div>
                                <strong>Loi de Little :</strong> L = λ × W → {(lambda * avgWait).toFixed(2)} = {lambda.toFixed(2)} × {avgWait.toFixed(3)}
                            </div>
                        </div>
                    </section>
                </div>
            </div>
        </div>
    );
};

// Analysis Item Component for SAÉ Q&A format
const AnalysisItem = ({ question, answer }) => (
    <div className="bg-white rounded-lg p-3 border border-slate-200">
        <div className="font-semibold text-slate-800 text-sm mb-2">{question}</div>
        <div className="text-slate-600 text-xs whitespace-pre-line leading-relaxed">{answer}</div>
    </div>
);

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
        return `Les étudiants PREPA subissent des temps d'attente ${(prepaAvg / ingAvg).toFixed(1)}x plus longs que les étudiants ING. Ceci est attendu en raison de leurs temps d'exécution plus longs (${config.prepaExecTime}s contre ${config.ingExecTime}s) qui occupent les serveurs plus longtemps.`;
    } else if (ingAvg > prepaAvg * 1.5) {
        return `Les étudiants ING ont étonnamment des temps d'attente plus longs. Cela peut être dû à des taux d'arrivée plus élevés submergeant le système malgré des temps de tâches plus courts.`;
    } else {
        return `Les deux populations ont des temps d'attente similaires, ce qui suggère une configuration système bien équilibrée.`;
    }
}

export default SimulationReport;