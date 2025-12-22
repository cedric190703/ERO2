import React, { useState, useEffect, useRef } from 'react';
import Controls from './components/Controls';
import CanvasView from './components/CanvasView';
import Metrics from './components/Metrics';
import Charts from './components/Charts';
import SimulationReport from './components/SimulationReport';
import { SimulationEngine } from './simulation/SimulationEngine';

function App() {
  const [config, setConfig] = useState({
    scenario: "Waterfall",
    numExecServers: 5,
    numResultServers: 1,
    arrivalRate: 1.0,
    avgExecTime: 2.0,
    avgResultTime: 1.0,
    execQueueCap: 10,
    resultQueueCap: 10,
    backupProb: 0.0,
    ingRate: 2.0,
    prepaRate: 0.5,
    ingExecTime: 1.0,
    prepaExecTime: 4.0,
    damEnabled: false,
    damBlockTime: 5,
    damOpenTime: 2,
    priorityMode: "FIFO",
    maxDuration: 60,
    speed: 1
  });

  const engineRef = useRef(null);
  const [stats, setStats] = useState(null);
  const [paused, setPaused] = useState(false);
  const [finished, setFinished] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const requestRef = useRef();
  const lastTimeRef = useRef(Date.now());
  const lastStatsUpdate = useRef(0);

  // Reinitialize engine when critical config changes
  useEffect(() => {
    engineRef.current = new SimulationEngine(config);
    engineRef.current.paused = true; // Start paused
    setStats({ ...engineRef.current.stats });
    setPaused(true); // Start paused - user must click Play
    setFinished(false);
  }, [
    config.scenario,
    config.numExecServers,
    config.numResultServers,
    config.execQueueCap,
    config.resultQueueCap
  ]);

  useEffect(() => {
    if (engineRef.current) {
      engineRef.current.config = { ...config };
    }
  }, [config]);

  const animate = () => {
    const now = Date.now();
    const dt = Math.min(now - lastTimeRef.current, 50);
    lastTimeRef.current = now;

    if (engineRef.current) {
      engineRef.current.update(dt);

      // Throttle stats updates to reduce lag (every 100ms)
      if (now - lastStatsUpdate.current > 100) {
        setStats({ ...engineRef.current.stats, variance: engineRef.current.getVariance() });
        setFinished(engineRef.current.finished);
        setPaused(engineRef.current.paused);
        lastStatsUpdate.current = now;
      }
    }
    requestRef.current = requestAnimationFrame(animate);
  };

  useEffect(() => {
    requestRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(requestRef.current);
  }, []);

  const handleReset = () => {
    if (engineRef.current) {
      engineRef.current.reset();
      setStats({ ...engineRef.current.stats });
      setFinished(false);
      setPaused(false);
      setShowReport(false);
    }
  };

  const handleTogglePause = () => {
    if (engineRef.current) {
      engineRef.current.togglePause();
      setPaused(engineRef.current.paused);
    }
  };



  const handleFastForward = () => {
    if (engineRef.current && !finished) {
      engineRef.current.runToCompletion();
      setStats({ ...engineRef.current.stats, variance: engineRef.current.getVariance() });
      setFinished(true);
      setPaused(true);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="flex h-screen">
        {/* Sidebar */}
        <div className="w-80 bg-white border-r border-slate-200 shadow-sm p-6 overflow-y-auto">
          <div className="mb-6">
            <h1 className="text-2xl font-semibold text-slate-900 mb-1">
              Moulinette Simulation
            </h1>
            <p className="text-slate-500 text-sm">Queuing System Analysis</p>
          </div>

          {/* Playback Controls */}
          <div className="bg-slate-50 rounded-lg p-4 mb-6 border border-slate-200">
            {finished && (
              <div className="bg-green-100 border border-green-300 text-green-800 px-3 py-2 rounded-lg text-sm font-medium mb-4 text-center">
                ✓ Simulation terminée
              </div>
            )}
            {finished && (
              <button
                onClick={() => setShowReport(true)}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white py-2.5 px-4 rounded-lg font-medium transition-all text-sm mb-4 shadow-md"
              >
                📊 View Report
              </button>
            )}
            <div className="flex gap-2 mb-2">
              <button
                onClick={handleTogglePause}
                disabled={finished}
                className={`flex-1 py-2.5 px-4 rounded-lg font-medium transition-colors text-sm text-white ${finished ? 'bg-slate-400 cursor-not-allowed' : paused ? 'bg-green-600 hover:bg-green-700' : 'bg-blue-600 hover:bg-blue-700'}`}
              >
                {paused ? '▶ Play' : '⏸ Pause'}
              </button>
            </div>
            <div className="flex gap-2 mb-4">
              <button
                onClick={handleFastForward}
                disabled={finished}
                className={`flex-1 py-2.5 px-4 rounded-lg font-medium transition-colors text-sm text-white ${finished ? 'bg-slate-400 cursor-not-allowed' : 'bg-purple-600 hover:bg-purple-700'}`}
              >
                ⚡ Simulation Rapide
              </button>
              <button
                onClick={handleReset}
                className="flex-1 bg-slate-600 hover:bg-slate-700 text-white py-2.5 px-4 rounded-lg font-medium transition-colors text-sm"
              >
                Reset
              </button>
            </div>
            <div className="mb-3">
              <label className="text-slate-700 text-sm font-medium mb-2 block">Durée Max (s)</label>
              <input
                type="number"
                min="10"
                max="600"
                value={config.maxDuration}
                onChange={(e) => setConfig(prev => ({ ...prev, maxDuration: parseInt(e.target.value) || 60 }))}
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
              <div className="text-slate-500 text-xs mt-1">La simulation s'arrête automatiquement après cette durée</div>
            </div>
            <div>
              <label className="text-slate-700 text-sm font-medium mb-2 block">Vitesse</label>
              <input
                type="range"
                min="0.5"
                max="5"
                step="0.5"
                value={config.speed}
                onChange={(e) => setConfig(prev => ({ ...prev, speed: parseFloat(e.target.value) }))}
                className="w-full accent-blue-600"
              />
              <div className="text-center text-slate-500 text-xs mt-1">{config.speed}x</div>
            </div>
          </div>

          <Controls config={config} setConfig={setConfig} />
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col p-6 bg-slate-50">
          <Metrics stats={stats} config={config} />

          <div className="grid grid-cols-3 gap-6 mt-6 flex-1">
            <div className="col-span-2 bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
              <div className="bg-slate-50 border-b border-slate-200 px-4 py-3">
                <h2 className="text-sm font-semibold text-slate-700">System Visualization</h2>
              </div>
              <div className="p-4">
                <CanvasView engine={engineRef.current} config={config} />
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-4 overflow-y-auto">
              <Charts engine={engineRef.current} />
            </div>
          </div>
        </div>
      </div>

      {/* Simulation Report Modal */}
      {showReport && (
        <SimulationReport
          engine={engineRef.current}
          config={config}
          onClose={() => setShowReport(false)}
        />
      )}
    </div>
  );
}

export default App;
