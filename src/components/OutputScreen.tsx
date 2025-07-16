import React, { useState } from 'react';
import { BarChart3, Calendar, Download, TrendingUp, Users, Clock, Target, Activity, ArrowLeft, Info } from 'lucide-react';
import { SimulationResults } from '../types';
import { PlotAnalysis } from './PlotAnalysis';
import { Tooltip } from './Tooltip';

interface OutputScreenProps {
  results: SimulationResults;
  inputs: SimulationInputs;
  onBackToInput: () => void;
}

export const OutputScreen: React.FC<OutputScreenProps> = ({ results, inputs, onBackToInput }) => {
  const [activeTab, setActiveTab] = useState<'analysis' | 'intervals' | 'daily'>('analysis');
  const [selectedDay, setSelectedDay] = useState(0);

  const formatPercentage = (value: number) => (value * 100).toFixed(1) + '%';
  const formatNumber = (value: number) => Math.round(value).toString();

  const selectedDayData = results.intervalData.slice(selectedDay * 48, (selectedDay + 1) * 48);
  const selectedDayMetrics = results.dailyMetrics[selectedDay];

  const exportData = () => {
    const csv = [
      ['Date', 'Interval', 'Volume', 'AHT', 'Agents', 'Effective Agents', 'Required Agents', 'SLA Achieved', 'Occupancy', 'Staffing Gap'],
      ...results.intervalData.map((interval, index) => [
        results.dailyMetrics[Math.floor(index / 48)].date,
        interval.intervalLabel,
        interval.derivedVolume.toFixed(0),
        interval.plannedAHT.toString(),
        interval.derivedAgents.toFixed(1),
        interval.effectiveAgents.toFixed(1),
        interval.requiredAgents.toFixed(1),
        formatPercentage(interval.slaAchieved),
        formatPercentage(interval.occupancy),
        interval.staffingGap.toFixed(1)
      ])
    ].map(row => row.join(',')).join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'occupancy_model_results.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const getTooltipContent = (field: string, value?: number) => {
    const tooltips: { [key: string]: string } = {
      intervalLabel: "30-minute time interval during the day. Format: HH:MM representing the start of each interval.",
      derivedVolume: `Contact volume allocated to this interval using historical distribution patterns. Formula: Daily Volume × Time Distribution Factor. Current value: ${value?.toFixed(0)} contacts.`,
      plannedAHT: `Average handling time per contact in seconds (includes talk time + after-call work). Used in occupancy and SLA calculations. Current value: ${value} seconds.`,
      derivedAgents: `Number of agents available during this interval based on shift schedules and distribution rules. Formula: Daily Agents × Shift Distribution Factor. Current value: ${value?.toFixed(1)} agents.`,
      effectiveAgents: `Actual usable agents after applying shrinkage and break factors. Formula: Derived Agents × (1 - In-Office Shrinkage) × (1 - Out-of-Office Shrinkage) × (1 - Break %). Current value: ${value?.toFixed(1)} agents.`,
      requiredAgents: `Minimum agents needed to meet SLA target using Erlang C calculations. Formula: Calculated iteratively using queue theory to achieve target service level. Current value: ${value?.toFixed(1)} agents.`,
      slaAchieved: `Percentage of contacts answered within service time threshold. Formula: 1 - P(wait) × e^(-μ(n-ρ)×T) where P(wait) is probability of waiting, μ is service rate, n is agents, ρ is traffic intensity, T is service time. Current value: ${formatPercentage(value || 0)}.`,
      occupancy: `Agent utilization rate (time spent handling contacts vs. available time). Formula: (Volume × AHT) / (Effective Agents × Interval Duration). Current value: ${formatPercentage(value || 0)}.`,
      staffingGap: `Difference between planned and required agents. Formula: Derived Agents - Required Agents. Positive = overstaffed, negative = understaffed. Current value: ${value?.toFixed(1)} agents.`,
      totalVolume: `Total contact volume for the day. Sum of all interval volumes. Current value: ${value?.toFixed(0)} contacts.`,
      avgStaffing: `Average effective agents throughout the day. Formula: Sum of effective agents across all intervals / 48. Current value: ${value?.toFixed(1)} agents.`,
      dailySLA: `Daily average SLA performance. Formula: Volume-weighted average of interval SLAs. Current value: ${formatPercentage(value || 0)}.`,
      dailyOccupancy: `Daily average occupancy level. Formula: Volume-weighted average of interval occupancy. Current value: ${formatPercentage(value || 0)}.`
    };
    return tooltips[field] || "No tooltip available for this field.";
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      {/* Header */}
      <div className="bg-slate-800 border-b border-slate-700 px-4 sm:px-6 py-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={onBackToInput}
              className="p-2 hover:bg-slate-700 rounded-md transition-colors flex-shrink-0"
            >
              <ArrowLeft size={20} />
            </button>
            <BarChart3 className="text-blue-400 flex-shrink-0" size={24} />
            <h1 className="text-lg sm:text-xl font-semibold">Results & Analysis Dashboard</h1>
          </div>
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <button 
              onClick={onBackToInput}
              className="px-3 sm:px-4 py-2 bg-slate-700 text-slate-300 rounded-md font-medium hover:bg-slate-600 text-sm"
            >
              Input Configuration
            </button>
            <button className="px-3 sm:px-4 py-2 bg-blue-600 text-white rounded-md font-medium text-sm">
              Output Dashboard
            </button>
            <button
              onClick={exportData}
              className="px-3 sm:px-4 py-2 bg-slate-700 text-slate-300 rounded-md font-medium flex items-center gap-2 hover:bg-slate-600 text-sm"
            >
              <Download size={16} />
              <span className="hidden sm:inline">Export CSV</span>
            </button>
          </div>
        </div>
      </div>

      <div className="p-4 sm:p-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
          <div className="bg-slate-800 p-4 sm:p-6 rounded-lg border-l-4 border-blue-500">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <p className="text-sm font-medium text-slate-400">Final SLA</p>
                  <Tooltip content="Final SLA based on agents plotted in shifts considering all operational constraints. Formula: Volume-weighted average of interval SLAs using Erlang C calculations." />
                </div>
                <p className="text-xl sm:text-2xl font-bold text-blue-400">{formatPercentage(results.finalSLA)}</p>
                <p className="text-xs text-slate-500">Agents in Shifts</p>
              </div>
              <Target className="text-blue-400 flex-shrink-0" size={24} />
            </div>
          </div>
          
          <div className="bg-slate-800 p-4 sm:p-6 rounded-lg border-l-4 border-teal-500">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <p className="text-sm font-medium text-slate-400">Final Occupancy</p>
                  <Tooltip content="Final occupancy where SLA is met with optimum staffing. Formula: (Volume × AHT) / (Effective Agents × Interval Duration). Optimal range: 75-85%." />
                </div>
                <p className="text-xl sm:text-2xl font-bold text-teal-400">{formatPercentage(results.finalOccupancy)}</p>
                <p className="text-xs text-slate-500">Optimum Staffing</p>
              </div>
              <Activity className="text-teal-400 flex-shrink-0" size={24} />
            </div>
          </div>
          
          <div className="bg-slate-800 p-4 sm:p-6 rounded-lg border-l-4 border-orange-500">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <p className="text-sm font-medium text-slate-400">Total Volume</p>
                  <Tooltip content="Total contact volume across all intervals and days in the evaluation period. Sum of all derived interval volumes from daily volume distribution." />
                </div>
                <p className="text-xl sm:text-2xl font-bold text-orange-400">
                  {formatNumber(results.intervalData.reduce((sum, interval) => sum + interval.derivedVolume, 0))}
                </p>
                <p className="text-xs text-slate-500">Contacts</p>
              </div>
              <TrendingUp className="text-orange-400 flex-shrink-0" size={24} />
            </div>
          </div>
          
          <div className="bg-slate-800 p-4 sm:p-6 rounded-lg border-l-4 border-green-500">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <p className="text-sm font-medium text-slate-400">Avg. Staffing</p>
                  <Tooltip content="Average effective agents after applying all shrinkage factors. Formula: Planned Agents × (1 - In-Office Shrinkage) × (1 - Out-of-Office Shrinkage) × (1 - Break %)." />
                </div>
                <p className="text-xl sm:text-2xl font-bold text-green-400">
                  {formatNumber(results.dailyMetrics.reduce((sum, day) => sum + day.avgStaffing, 0) / results.dailyMetrics.length)}
                </p>
                <p className="text-xs text-slate-500">Effective Agents</p>
              </div>
              <Users className="text-green-400 flex-shrink-0" size={24} />
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1 mb-6 bg-slate-800 rounded-lg p-1 overflow-x-auto">
          <button
            onClick={() => setActiveTab('analysis')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${
              activeTab === 'analysis' 
                ? 'bg-blue-600 text-white' 
                : 'text-slate-400 hover:text-white hover:bg-slate-700'
            }`}
          >
            Analysis & Plots
          </button>
          <button
            onClick={() => setActiveTab('intervals')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${
              activeTab === 'intervals' 
                ? 'bg-blue-600 text-white' 
                : 'text-slate-400 hover:text-white hover:bg-slate-700'
            }`}
          >
            Interval View
          </button>
          <button
            onClick={() => setActiveTab('daily')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${
              activeTab === 'daily' 
                ? 'bg-blue-600 text-white' 
                : 'text-slate-400 hover:text-white hover:bg-slate-700'
            }`}
          >
            Daily Summary
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === 'analysis' && (
          <PlotAnalysis results={results} inputs={inputs} />
        )}

        {activeTab === 'intervals' && (
          <div className="bg-slate-800 rounded-lg overflow-hidden">
            <div className="p-4 border-b border-slate-700">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <Clock className="flex-shrink-0" size={20} />
                  Interval Analysis
                  <Tooltip content="Detailed 30-minute interval analysis showing volume, staffing, SLA, and occupancy metrics for each time period." />
                </h2>
                <select
                  value={selectedDay}
                  onChange={(e) => setSelectedDay(parseInt(e.target.value))}
                  className="px-3 py-2 bg-slate-700 border border-slate-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {results.dailyMetrics.map((day, index) => (
                    <option key={index} value={index}>
                      {day.date}
                    </option>
                  ))}
                </select>
              </div>
              
              {selectedDayMetrics && (
                <div className="mt-2 grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                  <div>SLA: <span className="font-semibold text-blue-400">{formatPercentage(selectedDayMetrics.sla)}</span></div>
                  <div>Occupancy: <span className="font-semibold text-teal-400">{formatPercentage(selectedDayMetrics.occupancy)}</span></div>
                  <div>Volume: <span className="font-semibold text-orange-400">{formatNumber(selectedDayMetrics.totalVolume)}</span></div>
                </div>
              )}
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-700 sticky top-0">
                  <tr>
                    <th className="px-4 py-3 text-left">
                      <div className="flex items-center gap-1">
                        Interval
                        <Tooltip content={getTooltipContent('intervalLabel')} />
                      </div>
                    </th>
                    <th className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        Volume
                        <Tooltip content={getTooltipContent('derivedVolume')} />
                      </div>
                    </th>
                    <th className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        Agents
                        <Tooltip content={getTooltipContent('derivedAgents')} />
                      </div>
                    </th>
                    <th className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        Effective
                        <Tooltip content={getTooltipContent('effectiveAgents')} />
                      </div>
                    </th>
                    <th className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        Required
                        <Tooltip content={getTooltipContent('requiredAgents')} />
                      </div>
                    </th>
                    <th className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        SLA
                        <Tooltip content={getTooltipContent('slaAchieved')} />
                      </div>
                    </th>
                    <th className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        Occupancy
                        <Tooltip content={getTooltipContent('occupancy')} />
                      </div>
                    </th>
                    <th className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        Gap
                        <Tooltip content={getTooltipContent('staffingGap')} />
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700">
                  {selectedDayData.map((interval, index) => (
                    <tr key={index} className="hover:bg-slate-700/50">
                      <td className="px-4 py-3 font-medium" title={getTooltipContent('intervalLabel')}>
                        {interval.intervalLabel}
                      </td>
                      <td className="px-4 py-3 text-right" title={getTooltipContent('derivedVolume', interval.derivedVolume)}>
                        {formatNumber(interval.derivedVolume)}
                      </td>
                      <td className="px-4 py-3 text-right" title={getTooltipContent('derivedAgents', interval.derivedAgents)}>
                        {interval.derivedAgents.toFixed(1)}
                      </td>
                      <td className="px-4 py-3 text-right" title={getTooltipContent('effectiveAgents', interval.effectiveAgents)}>
                        {interval.effectiveAgents.toFixed(1)}
                      </td>
                      <td className="px-4 py-3 text-right" title={getTooltipContent('requiredAgents', interval.requiredAgents)}>
                        {interval.requiredAgents.toFixed(1)}
                      </td>
                      <td className={`px-4 py-3 text-right font-medium ${
                        interval.slaAchieved >= 0.8 ? 'text-green-400' : 'text-red-400'
                      }`} title={getTooltipContent('slaAchieved', interval.slaAchieved)}>
                        {formatPercentage(interval.slaAchieved)}
                      </td>
                      <td className={`px-4 py-3 text-right font-medium ${
                        interval.occupancy >= 0.8 ? 'text-orange-400' : 'text-teal-400'
                      }`} title={getTooltipContent('occupancy', interval.occupancy)}>
                        {formatPercentage(interval.occupancy)}
                      </td>
                      <td className={`px-4 py-3 text-right font-medium ${
                        interval.staffingGap >= 0 ? 'text-green-400' : 'text-red-400'
                      }`} title={getTooltipContent('staffingGap', interval.staffingGap)}>
                        {interval.staffingGap > 0 ? '+' : ''}{interval.staffingGap.toFixed(1)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'daily' && (
          <div className="bg-slate-800 rounded-lg overflow-hidden">
            <div className="p-4 border-b border-slate-700">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <Calendar className="flex-shrink-0" size={20} />
                Daily Summary Analysis
                <Tooltip content="Daily aggregated metrics showing total volume, average staffing, SLA performance, and occupancy levels for each day in the evaluation period." />
              </h2>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-700 sticky top-0">
                  <tr>
                    <th className="px-4 py-3 text-left">Date</th>
                    <th className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        Total Volume
                        <Tooltip content={getTooltipContent('totalVolume')} />
                      </div>
                    </th>
                    <th className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        Avg. Staffing
                        <Tooltip content={getTooltipContent('avgStaffing')} />
                      </div>
                    </th>
                    <th className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        SLA Achieved
                        <Tooltip content={getTooltipContent('dailySLA')} />
                      </div>
                    </th>
                    <th className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        Occupancy
                        <Tooltip content={getTooltipContent('dailyOccupancy')} />
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700">
                  {results.dailyMetrics.map((day, index) => (
                    <tr key={index} className="hover:bg-slate-700/50">
                      <td className="px-4 py-3 font-medium">{day.date}</td>
                      <td className="px-4 py-3 text-right" title={getTooltipContent('totalVolume', day.totalVolume)}>
                        {formatNumber(day.totalVolume)}
                      </td>
                      <td className="px-4 py-3 text-right" title={getTooltipContent('avgStaffing', day.avgStaffing)}>
                        {day.avgStaffing.toFixed(1)}
                      </td>
                      <td className={`px-4 py-3 text-right font-medium ${
                        day.sla >= 0.8 ? 'text-green-400' : 'text-red-400'
                      }`} title={getTooltipContent('dailySLA', day.sla)}>
                        {formatPercentage(day.sla)}
                      </td>
                      <td className={`px-4 py-3 text-right font-medium ${
                        day.occupancy >= 0.8 ? 'text-orange-400' : 'text-teal-400'
                      }`} title={getTooltipContent('dailyOccupancy', day.occupancy)}>
                        {formatPercentage(day.occupancy)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};