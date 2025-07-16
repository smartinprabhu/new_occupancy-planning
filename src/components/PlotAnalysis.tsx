import React from 'react';
import { BarChart3, TrendingUp, Target, Activity, Users, Clock, AlertTriangle, CheckCircle, Info } from 'lucide-react';
import { LineChart, Line, AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Legend } from 'recharts';
import { SimulationResults } from '../types';
import { Tooltip } from './Tooltip';

interface PlotAnalysisProps {
  results: SimulationResults;
  inputs: SimulationInputs;
}

export const PlotAnalysis: React.FC<PlotAnalysisProps> = ({ results, inputs }) => {
  const formatPercentage = (value: number) => (value * 100).toFixed(1) + '%';

  // Calculate key metrics for analysis
  const avgSLA = results.dailyMetrics.reduce((sum, day) => sum + day.sla, 0) / results.dailyMetrics.length;
  const avgOccupancy = results.dailyMetrics.reduce((sum, day) => sum + day.occupancy, 0) / results.dailyMetrics.length;
  const totalVolume = results.intervalData.reduce((sum, interval) => sum + interval.derivedVolume, 0);
  const avgStaffing = results.dailyMetrics.reduce((sum, day) => sum + day.avgStaffing, 0) / results.dailyMetrics.length;

  // Prepare data for charts
  const dailyChartData = results.dailyMetrics.map((day, index) => ({
    date: day.date,
    day: index + 1,
    sla: day.sla * 100,
    occupancy: day.occupancy * 100,
    volume: day.totalVolume,
    staffing: day.avgStaffing
  }));

  // Hourly patterns
  const hourlyPatterns = Array(24).fill(0).map((_, hour) => {
    const hourlyIntervals = results.intervalData.filter((_, index) => Math.floor((index % 48) / 2) === hour);
    const avgSLA = hourlyIntervals.reduce((sum, interval) => sum + interval.slaAchieved, 0) / hourlyIntervals.length;
    const avgOccupancy = hourlyIntervals.reduce((sum, interval) => sum + interval.occupancy, 0) / hourlyIntervals.length;
    const avgVolume = hourlyIntervals.reduce((sum, interval) => sum + interval.derivedVolume, 0) / hourlyIntervals.length;
    const avgAgents = hourlyIntervals.reduce((sum, interval) => sum + interval.effectiveAgents, 0) / hourlyIntervals.length;
    const avgRequired = hourlyIntervals.reduce((sum, interval) => sum + interval.requiredAgents, 0) / hourlyIntervals.length;
    
    return { 
      hour: `${hour.toString().padStart(2, '0')}:00`, 
      sla: avgSLA * 100, 
      occupancy: avgOccupancy * 100, 
      volume: avgVolume,
      effectiveAgents: avgAgents,
      requiredAgents: avgRequired
    };
  });

  // Business hours data (8 AM - 6 PM)
  const businessHoursData = hourlyPatterns.slice(8, 18);

  // SLA performance by day of week
  const slaByDayOfWeek = Array(7).fill(0).map((_, dayIndex) => {
    const daysOfWeek = results.dailyMetrics.filter((_, index) => index % 7 === dayIndex);
    const avgSLA = daysOfWeek.length > 0 ? daysOfWeek.reduce((sum, day) => sum + day.sla, 0) / daysOfWeek.length : 0;
    const avgOccupancy = daysOfWeek.length > 0 ? daysOfWeek.reduce((sum, day) => sum + day.occupancy, 0) / daysOfWeek.length : 0;
    return {
      day: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][dayIndex],
      sla: avgSLA * 100,
      occupancy: avgOccupancy * 100
    };
  });

  // Calculate staffing efficiency metrics
  const totalRequiredAgents = results.intervalData.reduce((sum, interval) => sum + interval.requiredAgents, 0);
  const totalEffectiveAgents = results.intervalData.reduce((sum, interval) => sum + interval.effectiveAgents, 0);
  const staffingEfficiency = totalRequiredAgents / totalEffectiveAgents;

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-800 p-3 rounded-lg border border-slate-600 shadow-lg">
          <p className="text-slate-300 font-medium">{`${label}`}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} style={{ color: entry.color }} className="text-sm">              {`${String(entry.dataKey)}: ${typeof entry.value === 'number' ? entry.value.toFixed(1) : entry.value}${String(entry.dataKey).includes('sla') || String(entry.dataKey).includes('occupancy') ? '%' : ''}`}
              {/* Check if entry.dataKey is a string before calling includes */}
              {`${String(entry.dataKey)}: ${typeof entry.value === 'number' ? entry.value.toFixed(1) : entry.value}${typeof entry.dataKey === 'string' && (entry.dataKey.includes('sla') || entry.dataKey.includes('occupancy')) ? '%' : ''}`}
             </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-8">
      {/* Main Analysis Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* 1. Final SLA Based on Agents Plotted in Shifts */}
        <div className="bg-gradient-to-br from-blue-900/40 to-blue-800/30 rounded-lg p-6 border border-blue-600/30">
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
            <Target className="text-blue-400" size={28} />
            Final SLA Based on Agents Plotted in Shifts
            <Tooltip content="SLA calculated using actual agent distribution across shifts, considering all operational constraints including shrinkage factors. Formula: Weighted average of interval SLAs using Erlang C: SLA = 1 - P(wait) × e^(-μ(n-ρ)×T). Where P(wait) is probability of waiting, μ is service rate, n is agents, ρ is traffic intensity, T is service time threshold." />
          </h2>
          
          <div className="space-y-6">
            {/* SLA Achievement Display */}
            <div className="bg-slate-800/60 rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <span className="text-lg font-medium text-slate-300">Achieved SLA Performance</span>
                <span className={`text-3xl font-bold ${results.finalSLA >= 0.8 ? 'text-green-400' : 'text-red-400'}`}>
                  {formatPercentage(results.finalSLA)}
                </span>
              </div>
              
              <div className="w-full bg-slate-700 rounded-full h-4 mb-4">
                <div 
                  className={`h-4 rounded-full transition-all duration-1000 ${
                    results.finalSLA >= 0.8 ? 'bg-gradient-to-r from-green-500 to-green-400' : 'bg-gradient-to-r from-red-500 to-red-400'
                  }`}
                  style={{ width: `${Math.min(results.finalSLA * 100, 100)}%` }}
                />
              </div>
              
              <div className="flex items-center gap-2 mb-4">
                {results.finalSLA >= 0.8 ? (
                  <CheckCircle className="text-green-400" size={16} />
                ) : (
                  <AlertTriangle className="text-red-400" size={16} />
                )}
                <span className={`text-sm font-medium ${results.finalSLA >= 0.8 ? 'text-green-400' : 'text-red-400'}`}>
                  {results.finalSLA >= 0.8 ? 'SLA Target Achieved' : 'SLA Below Target'}
                </span>
                <span className="text-slate-400 text-sm">
                  (Gap: {((results.finalSLA - 0.8) * 100).toFixed(1)}%)
                </span>
              </div>
            </div>

            {/* Daily SLA Trend Line Chart */}
            <div className="bg-slate-800/40 rounded-lg p-4">
              <h4 className="font-semibold text-blue-300 mb-3 flex items-center gap-2">
                <TrendingUp size={16} />
                Daily SLA Performance Trend
                <Tooltip content="Daily SLA performance over the selected date range. Shows how service level varies day by day based on volume patterns and agent availability. Target line at 80% for reference." />
              </h4>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={dailyChartData}>
                    <CartesianGrid strokeDasharray="3,3" stroke="#475569" />
                    <XAxis 
                      dataKey="date" 
                      stroke="#94A3B8"
                      fontSize={12}
                      tickFormatter={(value) => new Date(value).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit' })}
                    />
                    <YAxis stroke="#94A3B8" fontSize={12} domain={[0, 100]} />
                    <RechartsTooltip content={<CustomTooltip />} />
                    <Area 
                      type="monotone" 
                      dataKey="sla" 
                      stroke="#3B82F6" 
                      fill="url(#slaGradient)" 
                      strokeWidth={2}
                    />
                    <Line 
                      type="monotone" 
                      dataKey={() => 80} 
                      stroke="#EF4444" 
                      strokeDasharray="5,5"
                      strokeWidth={1}
                    />
                    <defs>
                      <linearGradient id="slaGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.1}/>
                      </linearGradient>
                    </defs>
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Hourly SLA Performance Bar Chart */}
            <div className="bg-slate-800/40 rounded-lg p-4">
              <h4 className="font-semibold text-blue-300 mb-3 flex items-center gap-2">
                <BarChart3 size={16} />
                Hourly SLA Performance Pattern
                <Tooltip content="SLA performance by hour during business hours (8 AM - 6 PM). Shows peak and off-peak performance patterns. Green bars indicate hours meeting SLA target, red bars show underperformance." />
              </h4>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={businessHoursData}>
                    <CartesianGrid strokeDasharray="3,3" stroke="#475569" />
                    <XAxis dataKey="hour" stroke="#94A3B8" fontSize={12} />
                    <YAxis stroke="#94A3B8" fontSize={12} domain={[0, 100]} />
                    <RechartsTooltip content={<CustomTooltip />} />
                    <Bar 
                      dataKey="sla" 
                      fill="#10B981"
                      radius={[2, 2, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Calculation Methodology */}
            <div className="bg-slate-800/40 rounded-lg p-4">
              <h4 className="font-semibold text-blue-300 mb-3 flex items-center gap-2">
                <Info size={16} />
                Calculation Methodology
              </h4>
              <div className="space-y-2 text-sm text-slate-300">
                <p>• <strong>Agent Distribution:</strong> Based on actual shift schedules and timing</p>
                <p>• <strong>Shrinkage Applied:</strong> In-office ({(inputs.inOfficeShrinkage * 100).toFixed(1)}%), Out-of-office ({(inputs.outOfOfficeShrinkage * 100).toFixed(1)}%), Breaks ({(inputs.billableBreakPercent * 100).toFixed(1)}%)</p>
                <p>• <strong>Erlang C Model:</strong> Queue theory calculations for service level</p>
                <p>• <strong>Weighted Average:</strong> Volume-weighted across all {results.intervalData.length} intervals</p>
                <p>• <strong>Service Threshold:</strong> {inputs.serviceTime} seconds answer time target</p>
              </div>
            </div>
          </div>
        </div>

        {/* 2. Final Occupancy with Optimum Staffing */}
        <div className="bg-gradient-to-br from-teal-900/40 to-teal-800/30 rounded-lg p-6 border border-teal-600/30">
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
            <Activity className="text-teal-400" size={28} />
            Final Occupancy with Optimum Staffing
            <Tooltip content="Occupancy calculated with minimum agents needed to meet SLA target. Formula: Occupancy = (Volume × AHT) / (Effective Agents × Interval Duration). Optimum staffing uses minimum agents required to achieve 80% SLA while maximizing efficiency." />
          </h2>
          
          <div className="space-y-6">
            {/* Occupancy Achievement Display */}
            <div className="bg-slate-800/60 rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <span className="text-lg font-medium text-slate-300">Optimum Occupancy Level</span>
                <span className={`text-3xl font-bold ${results.finalOccupancy <= 0.85 ? 'text-teal-400' : 'text-orange-400'}`}>
                  {formatPercentage(results.finalOccupancy)}
                </span>
              </div>
              
              <div className="w-full bg-slate-700 rounded-full h-4 mb-4">
                <div 
                  className={`h-4 rounded-full transition-all duration-1000 ${
                    results.finalOccupancy <= 0.85 ? 'bg-gradient-to-r from-teal-500 to-teal-400' : 'bg-gradient-to-r from-orange-500 to-orange-400'
                  }`}
                  style={{ width: `${Math.min(results.finalOccupancy * 100, 100)}%` }}
                />
              </div>
              
              <div className="flex items-center gap-2 mb-4">
                {results.finalOccupancy <= 0.85 ? (
                  <CheckCircle className="text-teal-400" size={16} />
                ) : (
                  <AlertTriangle className="text-orange-400" size={16} />
                )}
                <span className={`text-sm font-medium ${results.finalOccupancy <= 0.85 ? 'text-teal-400' : 'text-orange-400'}`}>
                  {results.finalOccupancy <= 0.85 ? 'Optimal Range' : 'High Risk Zone'}
                </span>
                <span className="text-slate-400 text-sm">
                  (Target: 75-85%)
                </span>
              </div>
            </div>

            {/* Daily Occupancy Trend Area Chart */}
            <div className="bg-slate-800/40 rounded-lg p-4">
              <h4 className="font-semibold text-teal-300 mb-3 flex items-center gap-2">
                <Activity size={16} />
                Daily Occupancy Trend
                <Tooltip content="Daily occupancy levels over the evaluation period with optimum staffing. Shows agent utilization rates. Optimal range is 75-85% for sustainable operations without agent burnout." />
              </h4>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={dailyChartData}>
                    <CartesianGrid strokeDasharray="3,3" stroke="#475569" />
                    <XAxis 
                      dataKey="date" 
                      stroke="#94A3B8"
                      fontSize={12}
                      tickFormatter={(value) => new Date(value).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit' })}
                    />
                    <YAxis stroke="#94A3B8" fontSize={12} domain={[0, 100]} />
                    <RechartsTooltip content={<CustomTooltip />} />
                    <Area 
                      type="monotone" 
                      dataKey="occupancy" 
                      stroke="#14B8A6" 
                      fill="url(#occupancyGradient)" 
                      strokeWidth={2}
                    />
                    <defs>
                      <linearGradient id="occupancyGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#14B8A6" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#14B8A6" stopOpacity={0.1}/>
                      </linearGradient>
                    </defs>
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Hourly Occupancy Pattern Chart */}
            <div className="bg-slate-800/40 rounded-lg p-4">
              <h4 className="font-semibold text-teal-300 mb-3 flex items-center gap-2">
                <BarChart3 size={16} />
                Hourly Occupancy Pattern
                <Tooltip content="Occupancy distribution during business hours. Orange bars indicate high occupancy (>85%) which may lead to agent stress. Teal bars show optimal utilization levels." />
              </h4>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={businessHoursData}>
                    <CartesianGrid strokeDasharray="3,3" stroke="#475569" />
                    <XAxis dataKey="hour" stroke="#94A3B8" fontSize={12} />
                    <YAxis stroke="#94A3B8" fontSize={12} domain={[0, 100]} />
                    <RechartsTooltip content={<CustomTooltip />} />
                    <Bar 
                      dataKey="occupancy" 
                      fill="#F97316"
                      radius={[2, 2, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Optimization Details */}
            <div className="bg-slate-800/40 rounded-lg p-4">
              <h4 className="font-semibold text-teal-300 mb-3 flex items-center gap-2">
                <Info size={16} />
                Optimization Methodology
              </h4>
              <div className="space-y-2 text-sm text-slate-300">
                <p>• <strong>Minimum Staffing:</strong> Calculated to meet 80% SLA target exactly</p>
                <p>• <strong>Efficiency Focus:</strong> Maximizes agent utilization while maintaining service</p>
                <p>• <strong>Sustainable Range:</strong> 75-85% prevents burnout and maintains quality</p>
                <p>• <strong>Staffing Efficiency:</strong> {(staffingEfficiency * 100).toFixed(1)}% utilization of planned agents</p>
                <p>• <strong>Risk Assessment:</strong> {results.finalOccupancy > 0.85 ? 'High occupancy may impact agent wellbeing' : 'Occupancy within sustainable limits'}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Agent vs Volume Correlation Chart */}
      <div className="bg-gradient-to-r from-purple-900/30 to-indigo-900/30 rounded-lg p-6 border border-purple-600/30">
        <h3 className="text-xl font-bold mb-6 flex items-center gap-3">
          <BarChart3 className="text-purple-400" size={24} />
          Agent Staffing vs Volume Correlation Analysis
          <Tooltip content="Correlation between contact volume patterns and agent staffing levels. Shows effective vs required agents throughout the day and volume distribution impact on service levels." />
        </h3>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-slate-800/50 rounded-lg p-4">
            <h4 className="font-semibold text-purple-300 mb-3">Effective vs Required Agents</h4>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={businessHoursData}>
                  <CartesianGrid strokeDasharray="3,3" stroke="#475569" />
                  <XAxis dataKey="hour" stroke="#94A3B8" fontSize={12} />
                  <YAxis stroke="#94A3B8" fontSize={12} />
                  <RechartsTooltip content={<CustomTooltip />} />
                  <Line 
                    type="monotone" 
                    dataKey="effectiveAgents" 
                    stroke="#3B82F6" 
                    strokeWidth={2}
                    name="Effective Agents"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="requiredAgents" 
                    stroke="#EF4444" 
                    strokeWidth={2}
                    strokeDasharray="5,5"
                    name="Required Agents"
                  />
                  <Legend />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
          
          <div className="bg-slate-800/50 rounded-lg p-4">
            <h4 className="font-semibold text-purple-300 mb-3">Volume Distribution Impact</h4>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={businessHoursData}>
                  <CartesianGrid strokeDasharray="3,3" stroke="#475569" />
                  <XAxis dataKey="hour" stroke="#94A3B8" fontSize={12} />
                  <YAxis stroke="#94A3B8" fontSize={12} />
                  <RechartsTooltip content={<CustomTooltip />} />
                  <Bar dataKey="volume" fill="#F97316" opacity={0.7} name="Volume" />
                  <Line 
                    type="monotone" 
                    dataKey="sla" 
                    stroke="#10B981" 
                    strokeWidth={2}
                    name="SLA %"
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      {/* Day of Week Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-slate-800 rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Target className="text-blue-400" size={20} />
            SLA Performance by Day of Week
            <Tooltip content="Average SLA performance grouped by day of the week. Helps identify patterns in service levels across different days. Green indicates meeting SLA target, red shows underperformance." />
          </h3>
          
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={slaByDayOfWeek}>
                <CartesianGrid strokeDasharray="3,3" stroke="#475569" />
                <XAxis dataKey="day" stroke="#94A3B8" fontSize={12} />
                <YAxis stroke="#94A3B8" fontSize={12} domain={[0, 100]} />
                <RechartsTooltip content={<CustomTooltip />} />
                <Bar 
                  dataKey="sla" 
                  fill="#3B82F6"
                  radius={[2, 2, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-slate-800 rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Activity className="text-teal-400" size={20} />
            Occupancy Distribution by Day of Week
            <Tooltip content="Average occupancy levels grouped by day of the week. Shows agent utilization patterns. Teal indicates optimal range (75-85%), orange shows high occupancy risk zones." />
          </h3>
          
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={slaByDayOfWeek}>
                <CartesianGrid strokeDasharray="3,3" stroke="#475569" />
                <XAxis dataKey="day" stroke="#94A3B8" fontSize={12} />
                <YAxis stroke="#94A3B8" fontSize={12} domain={[0, 100]} />
                <RechartsTooltip content={<CustomTooltip />} />
                <Bar 
                  dataKey="occupancy" 
                  fill="#14B8A6"
                  radius={[2, 2, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Performance Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-slate-800 rounded-lg p-6 border-l-4 border-blue-500">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Target className="text-blue-400" size={24} />
              <Tooltip content="Average SLA performance across all intervals. Formula: Weighted average of interval SLAs using contact volume as weights. Target: 80%." />
            </div>
            <span className="text-2xl font-bold text-blue-400">{formatPercentage(avgSLA)}</span>
          </div>
          <p className="text-sm text-slate-300">Average SLA</p>
          <p className="text-xs text-slate-500">Across all intervals</p>
        </div>
        
        <div className="bg-slate-800 rounded-lg p-6 border-l-4 border-teal-500">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Activity className="text-teal-400" size={24} />
              <Tooltip content="Average occupancy with optimum staffing. Formula: (Volume × AHT) / (Effective Agents × Interval Duration). Optimal range: 75-85%." />
            </div>
            <span className="text-2xl font-bold text-teal-400">{formatPercentage(avgOccupancy)}</span>
          </div>
          <p className="text-sm text-slate-300">Average Occupancy</p>
          <p className="text-xs text-slate-500">Agent utilization</p>
        </div>
        
        <div className="bg-slate-800 rounded-lg p-6 border-l-4 border-orange-500">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <TrendingUp className="text-orange-400" size={24} />
              <Tooltip content="Total contact volume across all intervals and days in the evaluation period. Sum of all derived interval volumes." />
            </div>
            <span className="text-2xl font-bold text-orange-400">{totalVolume.toLocaleString()}</span>
          </div>
          <p className="text-sm text-slate-300">Total Volume</p>
          <p className="text-xs text-slate-500">Contacts handled</p>
        </div>
        
        <div className="bg-slate-800 rounded-lg p-6 border-l-4 border-green-500">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Users className="text-green-400" size={24} />
              <Tooltip content="Average effective agents after applying all shrinkage factors. Formula: Planned Agents × (1 - In-Office Shrinkage) × (1 - Out-of-Office Shrinkage) × (1 - Break %)." />
            </div>
            <span className="text-2xl font-bold text-green-400">{avgStaffing.toFixed(0)}</span>
          </div>
          <p className="text-sm text-slate-300">Average Staffing</p>
          <p className="text-xs text-slate-500">Effective agents</p>
        </div>
      </div>

      {/* Key Recommendations */}
      <div className="bg-gradient-to-r from-purple-900/30 to-blue-900/30 rounded-lg p-6 border border-purple-700/50">
        <h3 className="text-xl font-semibold mb-4 text-purple-300">
          Key Recommendations & Action Items
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-medium text-white mb-3">SLA Optimization:</h4>
            <ul className="space-y-2 text-sm text-slate-300">
              <li>• {results.finalSLA >= 0.8 ? 'SLA target is being met consistently' : 'SLA is below target - consider increasing staffing'}</li>
              <li>• Focus on peak hours (9 AM - 5 PM) for maximum impact</li>
              <li>• Monitor day-of-week variations for targeted improvements</li>
              <li>• Consider flexible scheduling during high-volume periods</li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-medium text-white mb-3">Occupancy Management:</h4>
            <ul className="space-y-2 text-sm text-slate-300">
              <li>• {results.finalOccupancy <= 0.85 ? 'Occupancy is within optimal range' : 'High occupancy may lead to agent burnout'}</li>
              <li>• Balance efficiency with agent wellbeing</li>
              <li>• Plan for adequate break coverage</li>
              <li>• Consider cross-training for flexibility</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};