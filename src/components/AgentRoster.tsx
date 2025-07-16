import React from 'react';
import { Tooltip } from './Tooltip';
import { getTooltip } from '../utils/tooltips';

interface AgentRosterProps {
  dateRange: { from: string; to: string };
  agentRoster: number[][];
  onRosterChange: (newRoster: number[][]) => void;
}

export const AgentRoster: React.FC<AgentRosterProps> = ({ dateRange, agentRoster, onRosterChange }) => {
  const getDayCount = () => {
    if (!dateRange.from || !dateRange.to) return 0;
    const start = new Date(dateRange.from);
    const end = new Date(dateRange.to);
    return Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  };

  const dayCount = getDayCount();
  const intervals = Array.from({ length: 48 }, (_, i) => {
    const hour = Math.floor(i / 2);
    const minute = (i % 2) * 30;
    return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
  });

  const handleAgentChange = (dayIndex: number, intervalIndex: number, value: string) => {
    const newRoster = [...agentRoster];
    newRoster[dayIndex] = [...(newRoster[dayIndex] || [])];
    newRoster[dayIndex][intervalIndex] = parseInt(value, 10) || 0;
    onRosterChange(newRoster);
  };

  const dates = Array.from({ length: dayCount }, (_, i) => {
    const date = new Date(dateRange.from);
    date.setDate(date.getDate() + i);
    return date.toISOString().split('T')[0];
  });

  if (dayCount === 0) {
    return null;
  }

  return (
    <div className="bg-slate-800 rounded-lg p-4 sm:p-6">
      <h2 className="text-lg font-semibold mb-4 flex items-center gap-1">
        Agent Roster
        <Tooltip content={getTooltip('agentRoster')} />
      </h2>
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left text-slate-400">
          <thead className="text-xs text-slate-300 uppercase bg-slate-700">
            <tr>
              <th scope="col" className="px-6 py-3 sticky left-0 bg-slate-700 z-10">
                Date
              </th>
              {intervals.map(interval => (
                <th key={interval} scope="col" className="px-6 py-3">
                  {interval}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {dates.map((date, dayIndex) => (
              <tr key={date} className="bg-slate-800 border-b border-slate-700 hover:bg-slate-600">
                <td className="px-6 py-4 font-medium text-white sticky left-0 bg-slate-800 z-10">
                  {date}
                </td>
                {intervals.map((_, intervalIndex) => (
                  <td key={intervalIndex} className="px-6 py-4">
                    <input
                      type="number"
                      min="0"
                      value={agentRoster[dayIndex]?.[intervalIndex] || 0}
                      onChange={(e) => handleAgentChange(dayIndex, intervalIndex, e.target.value)}
                      className="w-16 bg-slate-700 border border-slate-600 rounded px-2 py-1 text-white"
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
