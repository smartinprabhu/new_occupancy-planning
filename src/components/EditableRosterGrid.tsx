import React, { useState, useEffect } from 'react';
import { Users, Download, Upload, RotateCcw, Calendar, AlertTriangle, CheckCircle } from 'lucide-react';

interface EditableRosterGridProps {
  dateRange: { from: string; to: string };
  selectedDay: number;
  onSelectedDayChange: (day: number) => void;
  rosterData: number[][];
  onRosterChange: (roster: number[][]) => void;
  performanceData: {
    interval: string;
    actual: number;
    required: number;
    variance: number;
    occupancy: number;
    sla: number;
    volume: number;
  }[];
}

export const EditableRosterGrid: React.FC<EditableRosterGridProps> = ({
  dateRange,
  selectedDay,
  onSelectedDayChange,
  rosterData,
  onRosterChange,
  performanceData
}) => {
  const timeIntervals = Array.from({ length: 48 }, (_, i) => {
    const hour = Math.floor(i / 2);
    const minute = (i % 2) * 30;
    return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
  });

  const getDatesInRange = () => {
    if (!dateRange.from || !dateRange.to) return [];
    
    const dates = [];
    const start = new Date(dateRange.from);
    const end = new Date(dateRange.to);
    
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      dates.push(new Date(d));
    }
    
    return dates;
  };

  const dates = getDatesInRange();
  const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const handleAgentChange = (intervalIndex: number, value: number) => {
    const newRoster = [...rosterData];
    if (!newRoster[selectedDay]) {
      newRoster[selectedDay] = new Array(48).fill(0);
    }
    newRoster[selectedDay][intervalIndex] = Math.max(0, value);
    onRosterChange(newRoster);
  };

  const handleBulkFill = (value: number) => {
    const newRoster = [...rosterData];
    if (!newRoster[selectedDay]) {
      newRoster[selectedDay] = new Array(48).fill(0);
    }
    newRoster[selectedDay] = new Array(48).fill(Math.max(0, value));
    onRosterChange(newRoster);
  };

  const handleBusinessHoursFill = (value: number) => {
    const newRoster = [...rosterData];
    if (!newRoster[selectedDay]) {
      newRoster[selectedDay] = new Array(48).fill(0);
    }
    
    // Fill business hours (8 AM - 6 PM = intervals 16-35)
    for (let i = 16; i <= 35; i++) {
      newRoster[selectedDay][i] = Math.max(0, value);
    }
    onRosterChange(newRoster);
  };

  const clearDay = () => {
    const newRoster = [...rosterData];
    newRoster[selectedDay] = new Array(48).fill(0);
    onRosterChange(newRoster);
  };

  const exportToCSV = () => {
    const headers = ['Time Interval', 'Actual Agents', 'Required Agents', 'Variance', 'SLA %', 'Occupancy %', 'Volume'];
    const rows = performanceData.map((data, index) => [
      data.interval,
      data.actual.toFixed(1),
      data.required.toFixed(1),
      data.variance.toFixed(1),
      data.sla.toFixed(1),
      data.occupancy.toFixed(1),
      data.volume.toFixed(0)
    ]);
    
    const csvContent = [headers, ...rows]
      .map(row => row.join(','))
      .join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `roster_day_${selectedDay + 1}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const currentDayRoster = rosterData[selectedDay] || new Array(48).fill(0);
  const selectedDate = dates[selectedDay];
  const dayName = selectedDate ? dayLabels[selectedDate.getDay()] : '';

  return (
    <div className="bg-slate-800 rounded-lg p-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-6 gap-4">
        <div className="flex items-center gap-3">
          <Users className="text-blue-400" size={24} />
          <h2 className="text-xl font-semibold text-white">Editable Agent Roster</h2>
        </div>
        
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="flex items-center gap-2">
            <Calendar className="text-slate-400" size={16} />
            <select
              value={selectedDay}
              onChange={(e) => onSelectedDayChange(parseInt(e.target.value))}
              className="px-3 py-2 bg-slate-700 border border-slate-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white"
            >
              {dates.map((date, index) => (
                <option key={index} value={index}>
                  Day {index + 1}: {dayLabels[date.getDay()]} {date.toLocaleDateString('en-GB')}
                </option>
              ))}
            </select>
          </div>
          
          <div className="text-sm text-slate-400">
            {dayName} {selectedDate?.toLocaleDateString('en-GB')}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="flex flex-wrap gap-2 mb-6">
        <div className="flex items-center gap-2">
          <span className="text-sm text-slate-400">Quick Fill:</span>
          <input
            type="number"
            placeholder="Agents"
            className="w-20 px-2 py-1 bg-slate-700 border border-slate-600 rounded text-sm text-white"
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                const value = parseInt((e.target as HTMLInputElement).value) || 0;
                handleBulkFill(value);
                (e.target as HTMLInputElement).value = '';
              }
            }}
          />
          <button
            onClick={() => {
              const input = document.querySelector('input[placeholder="Agents"]') as HTMLInputElement;
              const value = parseInt(input.value) || 0;
              handleBusinessHoursFill(value);
              input.value = '';
            }}
            className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm font-medium"
          >
            Business Hours
          </button>
        </div>
        
        <button
          onClick={clearDay}
          className="px-3 py-1 bg-slate-600 hover:bg-slate-500 text-white rounded text-sm font-medium flex items-center gap-1"
        >
          <RotateCcw size={14} />
          Clear Day
        </button>
        
        <button
          onClick={exportToCSV}
          className="px-3 py-1 bg-slate-600 hover:bg-slate-500 text-white rounded text-sm font-medium flex items-center gap-1"
        >
          <Download size={14} />
          Export
        </button>
      </div>

      {/* Roster Grid */}
      <div className="relative">
        <div className="overflow-auto border border-slate-700 rounded-lg" style={{ maxHeight: '600px' }}>
          <table className="w-full text-sm">
            <thead className="bg-slate-700 sticky top-0 z-10">
              <tr>
                <th className="text-left p-3 text-slate-300 font-medium sticky left-0 bg-slate-700 z-20 border-r border-slate-600">
                  <div className="text-xs text-blue-400">TIME</div>
                  <div className="text-xs">INTERVAL</div>
                </th>
                <th className="text-center p-3 text-slate-300 font-medium min-w-[100px] border-r border-slate-600">
                  <div className="text-xs text-blue-400">ACTUAL</div>
                  <div className="text-xs">AGENTS</div>
                </th>
                <th className="text-center p-3 text-slate-300 font-medium min-w-[100px] border-r border-slate-600">
                  <div className="text-xs text-red-400">REQUIRED</div>
                  <div className="text-xs">AGENTS</div>
                </th>
                <th className="text-center p-3 text-slate-300 font-medium min-w-[80px] border-r border-slate-600">
                  <div className="text-xs text-green-400">VARIANCE</div>
                  <div className="text-xs">+/-</div>
                </th>
                <th className="text-center p-3 text-slate-300 font-medium min-w-[80px] border-r border-slate-600">
                  <div className="text-xs text-orange-400">SLA</div>
                  <div className="text-xs">%</div>
                </th>
                <th className="text-center p-3 text-slate-300 font-medium min-w-[80px] border-r border-slate-600">
                  <div className="text-xs text-purple-400">OCCUPANCY</div>
                  <div className="text-xs">%</div>
                </th>
                <th className="text-center p-3 text-slate-300 font-medium min-w-[80px]">
                  <div className="text-xs text-yellow-400">VOLUME</div>
                  <div className="text-xs">CONTACTS</div>
                </th>
              </tr>
            </thead>
            <tbody>
              {timeIntervals.map((interval, intervalIndex) => {
                const data = performanceData[intervalIndex];
                const agents = currentDayRoster[intervalIndex] || 0;
                const isBusinessHour = intervalIndex >= 16 && intervalIndex <= 35; // 8 AM - 6 PM
                
                return (
                  <tr 
                    key={intervalIndex} 
                    className={`border-b border-slate-700/50 hover:bg-slate-700/30 ${
                      isBusinessHour ? 'bg-slate-800/50' : ''
                    }`}
                  >
                    <td className="p-3 text-slate-300 font-mono sticky left-0 bg-slate-800 z-10 border-r border-slate-600">
                      <div className="flex items-center gap-2">
                        {interval}
                        {isBusinessHour && <div className="w-2 h-2 bg-blue-400 rounded-full"></div>}
                      </div>
                    </td>
                    <td className="p-2 text-center border-r border-slate-700/50">
                      <input
                        type="number"
                        value={agents}
                        onChange={(e) => handleAgentChange(intervalIndex, parseInt(e.target.value) || 0)}
                        className="w-full bg-transparent text-center text-white border border-slate-600 rounded px-2 py-1 hover:border-blue-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                        min="0"
                      />
                    </td>
                    <td className="p-3 text-center text-red-400 font-medium border-r border-slate-700/50">
                      {data?.required.toFixed(1) || '0.0'}
                    </td>
                    <td className={`p-3 text-center font-medium border-r border-slate-700/50 ${
                      (data?.variance || 0) >= 0 ? 'text-green-400' : 'text-red-400'
                    }`}>
                      <div className="flex items-center justify-center gap-1">
                        {(data?.variance || 0) >= 0 ? (
                          <CheckCircle size={12} />
                        ) : (
                          <AlertTriangle size={12} />
                        )}
                        {(data?.variance || 0) > 0 ? '+' : ''}{data?.variance.toFixed(1) || '0.0'}
                      </div>
                    </td>
                    <td className={`p-3 text-center font-medium border-r border-slate-700/50 ${
                      (data?.sla || 0) >= 80 ? 'text-green-400' : 'text-red-400'
                    }`}>
                      {data?.sla.toFixed(1) || '0.0'}%
                    </td>
                    <td className={`p-3 text-center font-medium border-r border-slate-700/50 ${
                      (data?.occupancy || 0) > 85 ? 'text-red-400' : 'text-orange-400'
                    }`}>
                      {data?.occupancy.toFixed(1) || '0.0'}%
                    </td>
                    <td className="p-3 text-center text-yellow-400 font-medium">
                      {data?.volume.toFixed(0) || '0'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Summary */}
      <div className="mt-4 text-xs text-slate-400 space-y-1">
        <div>• Blue dots indicate business hours (8 AM - 6 PM)</div>
        <div>• Green variance = overstaffed, Red variance = understaffed</div>
        <div>• SLA target: 80%, Occupancy warning: >85%</div>
      </div>
    </div>
  );
};