import React, { useState } from 'react';
import { Calendar, Play, RotateCcw, Download, Upload, Settings, TrendingUp } from 'lucide-react';
import { SimulationInputs, SimulationResults } from '../types';
import { runSimulation, calculateLivePerformance } from '../utils/calculations';
import { VolumeMatrix } from './VolumeMatrix';
import { LiveChart } from './LiveChart';
import { EditableRosterGrid } from './EditableRosterGrid';
import { Tooltip } from './Tooltip';
import { getTooltip } from '../utils/tooltips';

interface InputScreenProps {
  onSimulationComplete: (results: SimulationResults, inputs: SimulationInputs) => void;
}

export const InputScreen: React.FC<InputScreenProps> = ({ onSimulationComplete }) => {
  const [inputs, setInputs] = useState<SimulationInputs>({
    dateRange: { from: '2025-06-29', to: '2025-07-26' },
    dailyVolumes: [],
    rosterData: [],
    plannedAHT: 1560,
    inOfficeShrinkage: 0.0,
    outOfOfficeShrinkage: 0.3488,
    billableBreakPercent: 0.0588,
    slaTarget: 0.80,
    serviceTime: 30,
    shiftDuration: 8.5,
    dailyShiftPlan: []
  });

  const [isLoading, setIsLoading] = useState(false);
  const [selectedDay, setSelectedDay] = useState(0);
  const [activeTab, setActiveTab] = useState<'config' | 'roster' | 'chart'>('config');
  const [livePerformanceData, setLivePerformanceData] = useState<any[]>([]);

  const handleDateRangeChange = (field: 'from' | 'to', value: string) => {
    setInputs(prev => ({
      ...prev,
      dateRange: { ...prev.dateRange, [field]: value }
    }));
  };

  const handleQuickSelect = (weeks: number) => {
    setSelectedWeeks(weeks);
    const from = new Date('2025-06-29');
    const to = new Date(from);
    to.setDate(from.getDate() + (weeks * 7) - 1);
    
    setInputs(prev => ({
      ...prev,
      dateRange: {
        from: from.toISOString().split('T')[0],
        to: to.toISOString().split('T')[0]
      }
    }));
    
    // Auto-generate sample data for the selected period
    const totalDays = weeks * 7;
    const sampleVolumes = Array.from({ length: totalDays }, (_, i) => {
      const dayOfWeek = i % 7;
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
      const baseVolume = isWeekend ? 450 : 600;
      const variation = Math.random() * 100 - 50;
      return Math.round(baseVolume + variation);
    });
    
    setInputs(prev => ({
      ...prev,
      dailyVolumes: sampleVolumes,
      dailyShiftPlan: sampleVolumes.map(() => [50]),
      rosterData: sampleVolumes.map(() => new Array(48).fill(50))
    }));
  };

  const [selectedWeeks, setSelectedWeeks] = useState(4);

  const handleLoadSample = () => {
    const dayCount = getDayCount();
    const sampleVolumes = Array.from({ length: dayCount }, (_, i) => {
      const dayOfWeek = i % 7;
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
      const baseVolume = isWeekend ? 450 : 600;
      const variation = Math.random() * 100 - 50;
      return Math.round(baseVolume + variation);
    });
    
    setInputs(prev => ({
      ...prev,
      dailyVolumes: sampleVolumes,
      dailyShiftPlan: sampleVolumes.map(() => [50]),
      rosterData: sampleVolumes.map(() => new Array(48).fill(50))
    }));
  };

  const handleRunSimulation = async () => {
    // Validate inputs before running simulation
    if (!inputs.dateRange.from || !inputs.dateRange.to) {
      alert('Please select a date range');
      return;
    }
    
    if (!inputs.dailyVolumes || inputs.dailyVolumes.length === 0) {
      alert('Please load sample data or enter daily volumes');
      return;
    }
    
    setIsLoading(true);
    try {
      console.log('Running simulation with inputs:', inputs);
      const results = runSimulation(inputs);
      console.log('Simulation results:', results);
      onSimulationComplete(results, inputs);
    } catch (error) {
      console.error('Simulation error:', error);
      alert(`Simulation failed: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClear = () => {
    setInputs({
      dateRange: { from: '', to: '' },
      dailyVolumes: [],
      rosterData: [],
      plannedAHT: 1560,
      inOfficeShrinkage: 0.0,
      outOfOfficeShrinkage: 0.3488,
      billableBreakPercent: 0.0588,
      slaTarget: 0.80,
      serviceTime: 30,
      shiftDuration: 8.5,
      dailyShiftPlan: []
    });
  };

  const getDayCount = () => {
    if (!inputs.dateRange.from || !inputs.dateRange.to) return 0;
    const start = new Date(inputs.dateRange.from);
    const end = new Date(inputs.dateRange.to);
    return Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  };

  const getWeekCount = () => Math.ceil(getDayCount() / 7);

  const handleDailyVolumesChange = (volumes: number[]) => {
    setInputs(prev => ({
      ...prev,
      dailyVolumes: volumes,
      dailyShiftPlan: volumes.map(() => [50]),
      rosterData: volumes.map(() => new Array(48).fill(50))
    }));
  };

  const handleRosterChange = (roster: number[][]) => {
    setInputs(prev => ({ ...prev, rosterData: roster }));
    
    // Update live performance data
    if (roster[selectedDay] && inputs.dailyVolumes[selectedDay]) {
      const performanceData = calculateLivePerformance(
        inputs.dailyVolumes[selectedDay],
        roster[selectedDay],
        inputs
      );
      setLivePerformanceData(performanceData);
    }
  };

  // Update live performance when inputs change
  React.useEffect(() => {
    if (inputs.rosterData[selectedDay] && inputs.dailyVolumes[selectedDay]) {
      const performanceData = calculateLivePerformance(
        inputs.dailyVolumes[selectedDay],
        inputs.rosterData[selectedDay],
        inputs
      );
      setLivePerformanceData(performanceData);
    }
  }, [inputs, selectedDay]);

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      {/* Header */}
      <div className="bg-slate-800 border-b border-slate-700 px-4 sm:px-6 py-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Settings className="text-blue-400 flex-shrink-0" size={24} />
            <h1 className="text-lg sm:text-xl font-semibold">Contact Center Occupancy Modeling</h1>
          </div>
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <button 
              onClick={() => setActiveTab('config')}
              className={`px-3 sm:px-4 py-2 rounded-md font-medium text-sm ${
                activeTab === 'config' ? 'bg-blue-600 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
              }`}
            >
              Configuration
            </button>
            <button 
              onClick={() => setActiveTab('roster')}
              className={`px-3 sm:px-4 py-2 rounded-md font-medium text-sm ${
                activeTab === 'roster' ? 'bg-blue-600 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
              }`}
            >
              Agent Roster
            </button>
            <button 
              onClick={() => setActiveTab('chart')}
              className={`px-3 sm:px-4 py-2 rounded-md font-medium text-sm ${
                activeTab === 'chart' ? 'bg-blue-600 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
              }`}
            >
              Live Chart
            </button>
            <button className="px-3 sm:px-4 py-2 bg-slate-700 text-slate-300 rounded-md font-medium hover:bg-slate-600 flex items-center gap-2 text-sm">
              <Upload size={16} />
              <span className="hidden sm:inline">Upload Template</span>
            </button>
          </div>
        </div>
      </div>

      <div className="p-4 sm:p-6 space-y-6">
        {activeTab === 'config' && (
          <>
            {/* Date Range Section */}
            <div className="bg-slate-800 rounded-lg p-4 sm:p-6">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-4">
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                  <div className="flex items-center gap-2">
                    <Calendar className="text-blue-400 flex-shrink-0" size={20} />
                    <span className="font-medium">Date Range:</span>
                    <Tooltip content={getTooltip('dateRange')} />
                  </div>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                    <span className="text-slate-400 text-sm">From:</span>
                    <input
                      type="date"
                      value={inputs.dateRange.from}
                      onChange={(e) => handleDateRangeChange('from', e.target.value)}
                      className="bg-slate-700 border border-slate-600 rounded px-3 py-1 text-sm w-full sm:w-auto"
                    />
                    <span className="text-slate-400 text-sm">To:</span>
                    <input
                      type="date"
                      value={inputs.dateRange.to}
                      onChange={(e) => handleDateRangeChange('to', e.target.value)}
                      className="bg-slate-700 border border-slate-600 rounded px-3 py-1 text-sm w-full sm:w-auto"
                    />
                  </div>
                  <span className="text-slate-400 text-sm">
                    ({getDayCount()} days, {getWeekCount()} weeks)
                  </span>
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                  <span className="text-slate-400 text-sm">Quick Select:</span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleQuickSelect(4)}
                      className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                        selectedWeeks === 4 
                          ? 'bg-blue-600 text-white' 
                          : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                      }`}
                    >
                      4 Weeks
                    </button>
                    <button
                      onClick={() => handleQuickSelect(8)}
                      className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                        selectedWeeks === 8 
                          ? 'bg-blue-600 text-white' 
                          : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                      }`}
                    >
                      8 Weeks
                    </button>
                    <button
                      onClick={() => handleQuickSelect(12)}
                      className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                        selectedWeeks === 12 
                          ? 'bg-blue-600 text-white' 
                          : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                      }`}
                    >
                      12 Weeks
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Configuration Parameters */}
            <div className="bg-slate-800 rounded-lg p-4 sm:p-6">
              <h2 className="text-lg font-semibold mb-4">Configuration Parameters</h2>
              <div className="text-sm text-slate-400 mb-4">
                LOB: Contact Center | Forecast Range: {inputs.dateRange.from} to {inputs.dateRange.to} | {getDayCount()} days ({getWeekCount()} weeks)
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2 flex items-center gap-1">
                    Planned AHT (seconds)
                    <Tooltip content={getTooltip('plannedAHT')} />
                  </label>
                  <input
                    type="number"
                    value={inputs.plannedAHT}
                    onChange={(e) => setInputs(prev => ({ ...prev, plannedAHT: parseInt(e.target.value) }))}
                    className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2 flex items-center gap-1">
                    In-Office Shrinkage (%)
                    <Tooltip content={getTooltip('inOfficeShrinkage')} />
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={inputs.inOfficeShrinkage * 100}
                    onChange={(e) => setInputs(prev => ({ ...prev, inOfficeShrinkage: parseFloat(e.target.value) / 100 }))}
                    className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2 flex items-center gap-1">
                    Out-of-Office Shrinkage (%)
                    <Tooltip content={getTooltip('outOfOfficeShrinkage')} />
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={inputs.outOfOfficeShrinkage * 100}
                    onChange={(e) => setInputs(prev => ({ ...prev, outOfOfficeShrinkage: parseFloat(e.target.value) / 100 }))}
                    className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2 flex items-center gap-1">
                    Billable Break (%)
                    <Tooltip content={getTooltip('billableBreakPercent')} />
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={inputs.billableBreakPercent * 100}
                    onChange={(e) => setInputs(prev => ({ ...prev, billableBreakPercent: parseFloat(e.target.value) / 100 }))}
                    className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2 flex items-center gap-1">
                    SLA Target (%)
                    <Tooltip content={getTooltip('slaTarget')} />
                  </label>
                  <input
                    type="number"
                    value={inputs.slaTarget * 100}
                    onChange={(e) => setInputs(prev => ({ ...prev, slaTarget: parseFloat(e.target.value) / 100 }))}
                    className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2 flex items-center gap-1">
                    Service Time (seconds)
                    <Tooltip content={getTooltip('serviceTime')} />
                  </label>
                  <input
                    type="number"
                    value={inputs.serviceTime}
                    onChange={(e) => setInputs(prev => ({ ...prev, serviceTime: parseInt(e.target.value) }))}
                    className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2 flex items-center gap-1">
                    Shift Duration
                    <Tooltip content={getTooltip('shiftDuration')} />
                  </label>
                  <select
                    value={inputs.shiftDuration}
                    onChange={(e) => setInputs(prev => ({ ...prev, shiftDuration: parseFloat(e.target.value) }))}
                    className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white"
                  >
                    <option value={8.5}>8.5 hours</option>
                    <option value={9}>9 hours</option>
                    <option value={9.5}>9.5 hours</option>
                    <option value={10}>10 hours</option>
                  </select>
                </div>
                
                <div className="flex flex-col gap-2">
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={handleLoadSample}
                      className="px-3 py-2 bg-slate-600 hover:bg-slate-500 text-white rounded font-medium flex items-center gap-2 text-sm"
                    >
                      <Download size={16} />
                      Load Sample
                    </button>
                    <button
                      onClick={handleClear}
                      className="px-3 py-2 bg-slate-600 hover:bg-slate-500 text-white rounded font-medium flex items-center gap-2 text-sm"
                    >
                      <RotateCcw size={16} />
                      Clear
                    </button>
                  </div>
                  <button
                    onClick={handleRunSimulation}
                    disabled={isLoading || inputs.dailyVolumes.length === 0}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 text-white rounded font-medium flex items-center gap-2 text-sm"
                  >
                    <Play size={16} />
                    {isLoading ? 'Running...' : 'Run Simulation'}
                  </button>
                </div>
              </div>
            </div>

            {/* Volume Matrix */}
            {inputs.dateRange.from && inputs.dateRange.to && (
              <VolumeMatrix
                dateRange={inputs.dateRange}
                dailyVolumes={inputs.dailyVolumes}
                onVolumeChange={() => {}}
                onDailyVolumesChange={handleDailyVolumesChange}
              />
            )}
          </>
        )}

        {activeTab === 'roster' && inputs.dateRange.from && inputs.dateRange.to && (
          <EditableRosterGrid
            dateRange={inputs.dateRange}
            selectedDay={selectedDay}
            onSelectedDayChange={setSelectedDay}
            rosterData={inputs.rosterData}
            onRosterChange={handleRosterChange}
            performanceData={livePerformanceData}
          />
        )}

        {activeTab === 'chart' && livePerformanceData.length > 0 && (
          <LiveChart
            chartData={livePerformanceData}
            selectedDay={selectedDay}
          />
        )}
      </div>
    </div>
  );
};