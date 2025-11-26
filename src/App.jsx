import React, { useState, useEffect, useRef } from 'react';
import Controls from './components/Controls';
import CanvasView from './components/CanvasView';
import Metrics from './components/Metrics';
import Charts from './components/Charts';
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
    speed: 1
  });

  const engineRef = useRef(null);
  const [stats, setStats] = useState(null);
  const [paused, setPaused] = useState(false);
  const requestRef = useRef();
  const lastTimeRef = useRef(Date.now());

  // Reinitialize engine when critical config changes
  useEffect(() => {
    engineRef.current = new SimulationEngine(config);
    setStats({ ...engineRef.current.stats });
    setPaused(false);
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
      setStats({ ...engineRef.current.stats, variance: engineRef.current.getVariance() });
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
    }
  };

  const handleTogglePause = () => {
    if (engineRef.current) {
      engineRef.current.togglePause();
      setPaused(engineRef.current.paused);
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
            <div className="flex gap-2 mb-4">
              <button
                onClick={handleTogglePause}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2.5 px-4 rounded-lg font-medium transition-colors text-sm"
              >
                {paused ? 'Play' : 'Pause'}
              </button>
              <button
                onClick={handleReset}
                className="flex-1 bg-slate-600 hover:bg-slate-700 text-white py-2.5 px-4 rounded-lg font-medium transition-colors text-sm"
              >
                Reset
              </button>
            </div>
            <div>
              <label className="text-slate-700 text-sm font-medium mb-2 block">Speed</label>
              <input
                type="range"
                min="0.5"
                max="3"
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
    </div>
  );
}

export default App;
