import React, { useState, useEffect } from 'react';
import { Calendar, Filter, Download, RotateCcw } from 'lucide-react';

interface VolumeMatrixProps {
  dateRange: { from: string; to: string };
  dailyVolumes: number[];
  onVolumeChange: (volumes: number[][]) => void;
  onDailyVolumesChange: (volumes: number[]) => void;
}

export const VolumeMatrix: React.FC<VolumeMatrixProps> = ({ 
  dateRange, 
  dailyVolumes, 
  onVolumeChange,
  onDailyVolumesChange
}) => {
  const [selectedWeeks, setSelectedWeeks] = useState<number>(4);
  const [volumeMatrix, setVolumeMatrix] = useState<number[][]>([]);

  // Time distribution profile for 30-minute intervals
  const timeDistributionProfile = [
    0.015, 0.012, 0.010, 0.008, 0.007, 0.008, 0.012, 0.018, // 00:00-04:00
    0.025, 0.035, 0.045, 0.055, 0.065, 0.070, 0.075, 0.078, // 04:00-08:00
    0.080, 0.085, 0.088, 0.090, 0.092, 0.090, 0.088, 0.085, // 08:00-12:00
    0.082, 0.080, 0.078, 0.075, 0.072, 0.070, 0.068, 0.065, // 12:00-16:00
    0.060, 0.055, 0.050, 0.045, 0.040, 0.035, 0.030, 0.025, // 16:00-20:00
    0.020, 0.018, 0.016, 0.014, 0.012, 0.010, 0.008, 0.006  // 20:00-24:00
  ];

  const timeIntervals = Array.from({ length: 48 }, (_, i) => {
    const hour = Math.floor(i / 2);
    const minute = (i % 2) * 30;
    return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
  });

  const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

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

  // Handle week selection and update date range
  const handleWeekSelection = (weeks: number) => {
    setSelectedWeeks(weeks);
    
    // Generate sample data for selected weeks
    const totalDays = weeks * 7;
    const sampleVolumes = Array.from({ length: totalDays }, (_, i) => {
      const dayOfWeek = i % 7;
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
      const baseVolume = isWeekend ? 450 : 600;
      const variation = Math.random() * 100 - 50;
      return Math.round(baseVolume + variation);
    });
    
    onDailyVolumesChange(sampleVolumes);
  };

  useEffect(() => {
    if (dailyVolumes.length > 0) {
      const matrix = dailyVolumes.map(dailyVolume => 
        timeDistributionProfile.map(factor => Math.round(dailyVolume * factor))
      );
      setVolumeMatrix(matrix);
      onVolumeChange(matrix);
    }
  }, [dailyVolumes, onVolumeChange]);

  const calculateHourlyTotal = (intervalIndex: number) => {
    return volumeMatrix.reduce((sum, dayVolumes) => sum + (dayVolumes[intervalIndex] || 0), 0);
  };

  const calculateDayTotal = (dayIndex: number) => {
    if (!volumeMatrix[dayIndex]) return 0;
    return volumeMatrix[dayIndex].reduce((sum, volume) => sum + volume, 0);
  };

  const calculateGrandTotal = () => {
    return volumeMatrix.reduce((total, dayVolumes) => 
      total + dayVolumes.reduce((sum, vol) => sum + vol, 0), 0
    );
  };

  const handleVolumeChange = (dayIndex: number, intervalIndex: number, value: number) => {
    const newMatrix = [...volumeMatrix];
    if (!newMatrix[dayIndex]) newMatrix[dayIndex] = new Array(48).fill(0);
    newMatrix[dayIndex][intervalIndex] = value;
    setVolumeMatrix(newMatrix);
    onVolumeChange(newMatrix);
  };

  const exportToCSV = () => {
    const headers = ['Time Interval', ...dates.map(d => d.toLocaleDateString('en-GB')), 'Hourly Total'];
    const rows = timeIntervals.map((interval, intervalIndex) => [
      interval,
      ...dates.map((_, dayIndex) => volumeMatrix[dayIndex]?.[intervalIndex] || 0),
      calculateHourlyTotal(intervalIndex)
    ]);
    
    const dailyTotals = ['Daily Total', ...dates.map((_, dayIndex) => calculateDayTotal(dayIndex)), calculateGrandTotal()];
    
    const csvContent = [headers, ...rows, dailyTotals]
      .map(row => row.join(','))
      .join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'volume_matrix.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-slate-800 rounded-lg p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
        <div>
          <h2 className="text-lg sm:text-xl font-semibold text-white mb-2">Daily Interval-wise Volume</h2>
          <p className="text-slate-400 text-sm">
            48 intervals × {dates.length} days contact volume matrix
          </p>
        </div>
        <div className="text-right text-sm text-slate-400">
          <div>Date Range: {dateRange.from} to {dateRange.to}</div>
          <div>Total Days: {dates.length} ({Math.ceil(dates.length / 7)} weeks)</div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-end gap-2 mb-6">
        <button
          onClick={exportToCSV}
          className="px-3 py-2 bg-slate-700 text-slate-300 rounded text-sm font-medium hover:bg-slate-600 flex items-center gap-2"
        >
          <Download size={14} />
          Export CSV
        </button>
        <button
          onClick={() => setVolumeMatrix([])}
          className="px-3 py-2 bg-slate-700 text-slate-300 rounded text-sm font-medium hover:bg-slate-600 flex items-center gap-2"
        >
          <RotateCcw size={14} />
          Clear
        </button>
      </div>

      {/* Volume Matrix Table */}
      <div className="relative">
        <div 
          className="overflow-auto border border-slate-700 rounded-lg"
          style={{ maxHeight: '600px' }}
        >
          <table className="w-full text-xs">
            <thead className="bg-slate-700 sticky top-0 z-20">
              <tr>
                <th className="text-left p-3 text-slate-300 font-medium sticky left-0 bg-slate-700 z-30 border-r border-slate-600">
                  <div className="text-xs text-blue-400">TIME</div>
                  <div className="text-xs">INTERVAL</div>
                </th>
                {dates.map((date, index) => {
                  const dayName = dayLabels[date.getDay()];
                  return (
                    <th key={index} className="text-center p-3 text-slate-300 font-medium min-w-[80px] border-r border-slate-600">
                      <div className="text-xs text-blue-400">{dayName}</div>
                      <div className="text-xs">{date.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit' })}</div>
                    </th>
                  );
                })}
                <th className="text-center p-3 text-slate-300 font-medium bg-slate-600 sticky right-0 z-30 border-l border-slate-500">
                  <div className="text-xs text-orange-400">HOURLY TOTAL</div>
                  <div className="text-xs">SUM & %</div>
                </th>
              </tr>
            </thead>
            <tbody>
              {timeIntervals.map((interval, intervalIndex) => (
                <tr key={intervalIndex} className="border-b border-slate-700/50 hover:bg-slate-700/30">
                  <td className="p-3 text-slate-300 font-mono sticky left-0 bg-slate-800 z-10 border-r border-slate-600">
                    {interval}
                  </td>
                  {dates.map((date, dayIndex) => {
                    const volume = volumeMatrix[dayIndex]?.[intervalIndex] || 0;
                    return (
                      <td key={dayIndex} className="p-2 text-center border-r border-slate-700/50">
                        <input
                          type="number"
                          value={volume}
                          onChange={(e) => handleVolumeChange(dayIndex, intervalIndex, parseInt(e.target.value) || 0)}
                          className="w-full bg-transparent text-center text-slate-200 border-none outline-none hover:bg-slate-600/50 focus:bg-slate-600 rounded px-1 py-1"
                          min="0"
                        />
                      </td>
                    );
                  })}
                  <td className="p-3 text-center text-slate-200 bg-slate-700/50 font-medium sticky right-0 z-10 border-l border-slate-500">
                    <div>{calculateHourlyTotal(intervalIndex).toLocaleString()}</div>
                    <div className="text-xs text-slate-400">
                      {((calculateHourlyTotal(intervalIndex) / calculateGrandTotal()) * 100).toFixed(1)}%
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-slate-700 sticky bottom-0 z-20">
              <tr className="border-t-2 border-slate-600">
                <td className="p-3 text-slate-300 font-semibold sticky left-0 bg-slate-700 z-30 border-r border-slate-600">
                  Daily Total
                </td>
                {dates.map((date, dayIndex) => (
                  <td key={dayIndex} className="p-3 text-center text-slate-200 font-semibold border-r border-slate-600">
                    {calculateDayTotal(dayIndex).toLocaleString()}
                  </td>
                ))}
                <td className="p-3 text-center text-slate-200 font-bold bg-slate-600 sticky right-0 z-30 border-l border-slate-500">
                  {calculateGrandTotal().toLocaleString()}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      <div className="mt-4 text-xs text-slate-400 space-y-1">
        <div>• 48 time intervals (30-minute blocks) × {dates.length} days ({Math.ceil(dates.length / 7)} weeks)</div>
        <div>• Date Range: {dateRange.from} to {dateRange.to}</div>
        <div>• Grand Total: {calculateGrandTotal().toLocaleString()} contacts</div>
      </div>
    </div>
  );
};