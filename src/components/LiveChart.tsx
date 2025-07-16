import React from 'react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, ComposedChart } from 'recharts';
import { TrendingUp, Users, Target } from 'lucide-react';

interface LiveChartProps {
  chartData: {
    interval: string;
    actual: number;
    required: number;
    variance: number;
    occupancy: number;
    sla: number;
    volume: number;
  }[];
  selectedDay: number;
}

export const LiveChart: React.FC<LiveChartProps> = ({ chartData, selectedDay }) => {
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-800 p-3 rounded-lg border border-slate-600 shadow-lg">
          <p className="text-slate-300 font-medium">{`Time: ${label}`}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} style={{ color: entry.color }} className="text-sm">
              {`${entry.name}: ${typeof entry.value === 'number' ? entry.value.toFixed(1) : entry.value}${entry.name.includes('SLA') || entry.name.includes('Occupancy') ? '%' : ''}`}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  // Filter data for business hours (8 AM - 6 PM)
  const businessHoursData = chartData.filter((_, index) => {
    const hour = Math.floor(index / 2);
    return hour >= 8 && hour < 18;
  });

  return (
    <div className="bg-slate-800 rounded-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <TrendingUp className="text-blue-400" size={24} />
          <h2 className="text-xl font-semibold text-white">Live Intraday Performance</h2>
        </div>
        <div className="text-sm text-slate-400">
          Day {selectedDay + 1} - Business Hours (8 AM - 6 PM)
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-slate-700/50 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Users className="text-blue-400" size={16} />
            <span className="text-sm font-medium text-slate-300">Avg. Staffing</span>
          </div>
          <div className="text-xl font-bold text-blue-400">
            {(businessHoursData.reduce((sum, d) => sum + d.actual, 0) / businessHoursData.length).toFixed(1)}
          </div>
          <div className="text-xs text-slate-500">Actual Agents</div>
        </div>
        
        <div className="bg-slate-700/50 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Target className="text-green-400" size={16} />
            <span className="text-sm font-medium text-slate-300">Avg. SLA</span>
          </div>
          <div className="text-xl font-bold text-green-400">
            {(businessHoursData.reduce((sum, d) => sum + d.sla, 0) / businessHoursData.length).toFixed(1)}%
          </div>
          <div className="text-xs text-slate-500">Service Level</div>
        </div>
        
        <div className="bg-slate-700/50 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="text-orange-400" size={16} />
            <span className="text-sm font-medium text-slate-300">Avg. Occupancy</span>
          </div>
          <div className="text-xl font-bold text-orange-400">
            {(businessHoursData.reduce((sum, d) => sum + d.occupancy, 0) / businessHoursData.length).toFixed(1)}%
          </div>
          <div className="text-xs text-slate-500">Agent Utilization</div>
        </div>
      </div>

      {/* Main Chart */}
      <div className="h-80 mb-6">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={businessHoursData}>
            <CartesianGrid strokeDasharray="3,3" stroke="#475569" />
            <XAxis 
              dataKey="interval" 
              stroke="#94A3B8" 
              fontSize={12}
              interval={1}
            />
            <YAxis yAxisId="agents" stroke="#94A3B8" fontSize={12} />
            <YAxis yAxisId="percentage" orientation="right" stroke="#94A3B8" fontSize={12} domain={[0, 100]} />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            
            {/* Agent Lines */}
            <Line 
              yAxisId="agents"
              type="monotone" 
              dataKey="actual" 
              stroke="#3B82F6" 
              strokeWidth={3}
              name="Actual Agents"
              dot={{ fill: '#3B82F6', strokeWidth: 2, r: 4 }}
            />
            <Line 
              yAxisId="agents"
              type="monotone" 
              dataKey="required" 
              stroke="#EF4444" 
              strokeWidth={2}
              strokeDasharray="5,5"
              name="Required Agents"
              dot={{ fill: '#EF4444', strokeWidth: 2, r: 3 }}
            />
            
            {/* Variance Bars */}
            <Bar 
              yAxisId="agents"
              dataKey="variance" 
              fill={(data: any) => data.variance >= 0 ? '#10B981' : '#F59E0B'}
              name="Variance (Actual - Required)"
              opacity={0.6}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Performance Indicators */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h4 className="text-sm font-medium text-slate-300 mb-3">SLA Performance</h4>
          <div className="h-32">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={businessHoursData}>
                <CartesianGrid strokeDasharray="3,3" stroke="#475569" />
                <XAxis dataKey="interval" stroke="#94A3B8" fontSize={10} />
                <YAxis stroke="#94A3B8" fontSize={10} domain={[0, 100]} />
                <Tooltip content={<CustomTooltip />} />
                <Bar 
                  dataKey="sla" 
                  fill="#10B981"
                  name="SLA %"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        <div>
          <h4 className="text-sm font-medium text-slate-300 mb-3">Occupancy Levels</h4>
          <div className="h-32">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={businessHoursData}>
                <CartesianGrid strokeDasharray="3,3" stroke="#475569" />
                <XAxis dataKey="interval" stroke="#94A3B8" fontSize={10} />
                <YAxis stroke="#94A3B8" fontSize={10} domain={[0, 100]} />
                <Tooltip content={<CustomTooltip />} />
                <Bar 
                  dataKey="occupancy" 
                  fill="#F97316"
                  name="Occupancy %"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};