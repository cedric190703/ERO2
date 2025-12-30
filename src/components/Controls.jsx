const Controls = ({ config, setConfig }) => {
    const handleChange = (key, value) => {
        setConfig(prev => ({ ...prev, [key]: value }));
    };

    return (
        <div className="space-y-4">
            <Section title="Scénario">
                <select
                    value={config.scenario}
                    onChange={(e) => handleChange('scenario', e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                >
                    <option value="Waterfall">Waterfall</option>
                    <option value="Channels">Channels & Dams</option>
                </select>
            </Section>
            <Section title="Préréglages & Optimisation">
                <div className="grid grid-cols-1 gap-2">
                    <button
                        onClick={() => {
                            setConfig(prev => ({
                                ...prev,
                                scenario: "Waterfall",
                                arrivalRate: 1.0,
                                numExecServers: 7,
                                avgExecTime: 2.0,
                                execQueueCap: Infinity
                            }));
                        }}
                        className="text-left px-3 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-xs font-medium transition-colors border border-blue-200"
                    >
                        Waterfall Optimal (λ=1.0, K=7)
                    </button>
                    <button
                        onClick={() => {
                            setConfig(prev => ({
                                ...prev,
                                scenario: "Waterfall",
                                arrivalRate: 0.3,
                                numExecServers: 3,
                                avgExecTime: 2.0,
                                execQueueCap: Infinity
                            }));
                        }}
                        className="text-left px-3 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-xs font-medium transition-colors border border-blue-200"
                    >
                        Waterfall Optimal (λ=0.3, K=3)
                    </button>
                    <button
                        onClick={() => {
                            setConfig(prev => ({
                                ...prev,
                                scenario: "Channels",
                                damEnabled: true,
                                damBlockTime: 5,
                                damOpenTime: 2,
                                priorityMode: "SJF"
                            }));
                        }}
                        className="text-left px-3 py-2 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-lg text-xs font-medium transition-colors border border-purple-200"
                    >
                        Canaux Équilibrés (Équité + SJF)
                    </button>
                </div>
            </Section>
            <Section title="Ressources">
                <Slider
                    label="Serveurs d'Exécution (K)"
                    value={config.numExecServers}
                    min={1}
                    max={20}
                    onChange={(v) => handleChange('numExecServers', v)}
                />
                <Slider
                    label="Serveurs de Résultats"
                    value={config.numResultServers}
                    min={1}
                    max={10}
                    onChange={(v) => handleChange('numResultServers', v)}
                />
            </Section>

            {config.scenario === "Waterfall" ? (
                <>
                    <Section title="Paramètres Waterfall">
                        <Slider
                            label="Taux d'Arrivée (λ)"
                            value={config.arrivalRate}
                            min={0.1}
                            max={10}
                            step={0.1}
                            onChange={(v) => handleChange('arrivalRate', v)}
                        />
                        <Slider
                            label="Temps d'Exécution (s)"
                            value={config.avgExecTime}
                            min={0.5}
                            max={10}
                            step={0.1}
                            onChange={(v) => handleChange('avgExecTime', v)}
                        />
                        <Slider
                            label="Temps de Résultat (s)"
                            value={config.avgResultTime}
                            min={0.1}
                            max={5}
                            step={0.1}
                            onChange={(v) => handleChange('avgResultTime', v)}
                        />
                    </Section>
                </>
            ) : (
                <>
                    <Section title="Population : ING">
                        <Slider
                            label="Taux d'Arrivée (λ)"
                            value={config.ingRate}
                            min={0.1}
                            max={10}
                            step={0.1}
                            onChange={(v) => handleChange('ingRate', v)}
                        />
                        <Slider
                            label="Temps d'Exécution (s)"
                            value={config.ingExecTime}
                            min={0.5}
                            max={5}
                            step={0.1}
                            onChange={(v) => handleChange('ingExecTime', v)}
                        />
                    </Section>

                    <Section title="Population : PREPA">
                        <Slider
                            label="Taux d'Arrivée (λ)"
                            value={config.prepaRate}
                            min={0.1}
                            max={5}
                            step={0.1}
                            onChange={(v) => handleChange('prepaRate', v)}
                        />
                        <Slider
                            label="Temps d'Exécution (s)"
                            value={config.prepaExecTime}
                            min={1}
                            max={10}
                            step={0.1}
                            onChange={(v) => handleChange('prepaExecTime', v)}
                        />
                    </Section>

                    <Section title="Régulation par Barrage (Dam)">
                        <div className="mb-3">
                            <label className="flex items-center space-x-2 text-slate-700 text-sm cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={config.damEnabled}
                                    onChange={(e) => handleChange('damEnabled', e.target.checked)}
                                    className="rounded border-slate-300"
                                />
                                <span>Activer le Barrage</span>
                            </label>
                        </div>
                        {config.damEnabled && (
                            <>
                                <Slider
                                    label="Temps de Blocage (s)"
                                    value={config.damBlockTime}
                                    min={1}
                                    max={20}
                                    onChange={(v) => handleChange('damBlockTime', v)}
                                />
                                <Slider
                                    label="Temps d'Ouverture (s)"
                                    value={config.damOpenTime}
                                    min={1}
                                    max={10}
                                    onChange={(v) => handleChange('damOpenTime', v)}
                                />
                            </>
                        )}
                    </Section>

                    <Section title="Stratégie d'Ordonnancement">
                        <select
                            value={config.priorityMode}
                            onChange={(e) => handleChange('priorityMode', e.target.value)}
                            className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                        >
                            <option value="FIFO">FIFO (Premier Arrivé, Premier Servi)</option>
                            <option value="ING_FIRST">Priorité : ING en premier</option>
                            <option value="PREPA_FIRST">Priorité : PREPA en premier</option>
                            <option value="SJF">SJF (Shortest Job First)</option>
                        </select>
                        <p className="text-xs text-slate-500 mt-2">
                            SJF minimise le temps d'attente moyen en priorisant les tâches courtes (ING).
                        </p>
                    </Section>

                    <Section title="Traitement des Résultats">
                        <Slider
                            label="Temps de Résultat (s)"
                            value={config.avgResultTime}
                            min={0.1}
                            max={5}
                            step={0.1}
                            onChange={(v) => handleChange('avgResultTime', v)}
                        />
                    </Section>
                </>
            )}

            <Section title="Capacités des Files">
                <div className="mb-3">
                    <label className="flex items-center space-x-2 text-slate-700 text-sm cursor-pointer">
                        <input
                            type="checkbox"
                            checked={config.execQueueCap === Infinity}
                            onChange={(e) => handleChange('execQueueCap', e.target.checked ? Infinity : 10)}
                            className="rounded border-slate-300"
                        />
                        <span>File d'Exécution Infinie</span>
                    </label>
                </div>
                {config.execQueueCap !== Infinity && (
                    <Slider
                        label="Capacité File d'Exécution"
                        value={config.execQueueCap}
                        min={5}
                        max={100}
                        onChange={(v) => handleChange('execQueueCap', v)}
                    />
                )}

                <div className="mb-3 mt-2">
                    <label className="flex items-center space-x-2 text-slate-700 text-sm cursor-pointer">
                        <input
                            type="checkbox"
                            checked={config.resultQueueCap === Infinity}
                            onChange={(e) => handleChange('resultQueueCap', e.target.checked ? Infinity : 10)}
                            className="rounded border-slate-300"
                        />
                        <span>File de Résultats Infinie</span>
                    </label>
                </div>
                {config.resultQueueCap !== Infinity && (
                    <Slider
                        label="Capacité File de Résultats"
                        value={config.resultQueueCap}
                        min={5}
                        max={100}
                        onChange={(v) => handleChange('resultQueueCap', v)}
                    />
                )}
            </Section>

            <Section title="Mécanisme de Sauvegarde (Backup)">
                <Slider
                    label="Probabilité de Sauvegarde"
                    value={config.backupProb}
                    min={0}
                    max={1}
                    step={0.1}
                    onChange={(v) => handleChange('backupProb', v)}
                />
            </Section>
        </div>
    );
};

const Section = ({ title, children }) => (
    <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
        <h3 className="text-slate-700 font-semibold text-sm mb-3">{title}</h3>
        <div className="space-y-3">
            {children}
        </div>
    </div>
);

const Slider = ({ label, value, min, max, step = 1, onChange }) => (
    <div className="mb-2">
        <div className="flex justify-between text-xs text-slate-600 mb-1.5">
            <span className="font-medium">{label}</span>
            <span className="font-mono text-blue-600 font-semibold">{value}</span>
        </div>
        <input
            type="range"
            min={min}
            max={max}
            step={step}
            value={value}
            onChange={(e) => onChange(parseFloat(e.target.value))}
            className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
        />
    </div>
);

export default Controls;