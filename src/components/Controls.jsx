import React from 'react';

const Controls = ({ config, setConfig }) => {
    const handleChange = (key, value) => {
        setConfig(prev => ({ ...prev, [key]: value }));
    };

    return (
        <div className="space-y-4">
            <Section title="Scenario">
                <select
                    value={config.scenario}
                    onChange={(e) => handleChange('scenario', e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                >
                    <option value="Waterfall">Waterfall</option>
                    <option value="Channels">Channels & Dams</option>
                </select>
            </Section>

            <Section title="Resources">
                <Slider
                    label="Execution Servers"
                    value={config.numExecServers}
                    min={1}
                    max={20}
                    onChange={(v) => handleChange('numExecServers', v)}
                />
                <Slider
                    label="Result Servers"
                    value={config.numResultServers}
                    min={1}
                    max={10}
                    onChange={(v) => handleChange('numResultServers', v)}
                />
            </Section>

            {config.scenario === "Waterfall" ? (
                <>
                    <Section title="Waterfall Parameters">
                        <Slider
                            label="Arrival Rate (jobs/s)"
                            value={config.arrivalRate}
                            min={0.1}
                            max={10}
                            step={0.1}
                            onChange={(v) => handleChange('arrivalRate', v)}
                        />
                        <Slider
                            label="Execution Time (s)"
                            value={config.avgExecTime}
                            min={0.5}
                            max={10}
                            step={0.1}
                            onChange={(v) => handleChange('avgExecTime', v)}
                        />
                        <Slider
                            label="Result Time (s)"
                            value={config.avgResultTime}
                            min={0.1}
                            max={5}
                            step={0.1}
                            onChange={(v) => handleChange('avgResultTime', v)}
                        />
                    </Section>

                    <Section title="Queue Capacities">
                        <div className="mb-3">
                            <label className="flex items-center space-x-2 text-slate-700 text-sm cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={config.execQueueCap === Infinity}
                                    onChange={(e) => handleChange('execQueueCap', e.target.checked ? Infinity : 10)}
                                    className="rounded border-slate-300"
                                />
                                <span>Infinite Execution Queue</span>
                            </label>
                        </div>
                        {config.execQueueCap !== Infinity && (
                            <Slider
                                label="Execution Queue Cap"
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
                                <span>Infinite Result Queue</span>
                            </label>
                        </div>
                        {config.resultQueueCap !== Infinity && (
                            <Slider
                                label="Result Queue Cap"
                                value={config.resultQueueCap}
                                min={5}
                                max={100}
                                onChange={(v) => handleChange('resultQueueCap', v)}
                            />
                        )}
                    </Section>

                    <Section title="Backup Mechanism">
                        <Slider
                            label="Backup Probability"
                            value={config.backupProb}
                            min={0}
                            max={1}
                            step={0.1}
                            onChange={(v) => handleChange('backupProb', v)}
                        />
                    </Section>
                </>
            ) : (
                <>
                    <Section title="Population: ING">
                        <Slider
                            label="Arrival Rate (jobs/s)"
                            value={config.ingRate}
                            min={0.1}
                            max={10}
                            step={0.1}
                            onChange={(v) => handleChange('ingRate', v)}
                        />
                        <Slider
                            label="Execution Time (s)"
                            value={config.ingExecTime}
                            min={0.5}
                            max={5}
                            step={0.1}
                            onChange={(v) => handleChange('ingExecTime', v)}
                        />
                    </Section>

                    <Section title="Population: PREPA">
                        <Slider
                            label="Arrival Rate (jobs/s)"
                            value={config.prepaRate}
                            min={0.1}
                            max={5}
                            step={0.1}
                            onChange={(v) => handleChange('prepaRate', v)}
                        />
                        <Slider
                            label="Execution Time (s)"
                            value={config.prepaExecTime}
                            min={1}
                            max={10}
                            step={0.1}
                            onChange={(v) => handleChange('prepaExecTime', v)}
                        />
                    </Section>

                    <Section title="Dam Regulation">
                        <div className="mb-3">
                            <label className="flex items-center space-x-2 text-slate-700 text-sm cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={config.damEnabled}
                                    onChange={(e) => handleChange('damEnabled', e.target.checked)}
                                    className="rounded border-slate-300"
                                />
                                <span>Enable Dam</span>
                            </label>
                        </div>
                        {config.damEnabled && (
                            <>
                                <Slider
                                    label="Block Time (s)"
                                    value={config.damBlockTime}
                                    min={1}
                                    max={20}
                                    onChange={(v) => handleChange('damBlockTime', v)}
                                />
                                <Slider
                                    label="Open Time (s)"
                                    value={config.damOpenTime}
                                    min={1}
                                    max={10}
                                    onChange={(v) => handleChange('damOpenTime', v)}
                                />
                            </>
                        )}
                    </Section>
                </>
            )}
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
