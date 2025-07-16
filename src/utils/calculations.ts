import { SimulationInputs, IntervalData, SimulationResults } from '../types';

// Erlang C calculation functions
function factorial(n: number): number {
  if (n <= 1) return 1;
  return n * factorial(n - 1);
}

function erlangC(agents: number, intensity: number): number {
  if (agents <= intensity) return 1;
  
  let sum = 0;
  for (let i = 0; i < agents; i++) {
    sum += Math.pow(intensity, i) / factorial(i);
  }
  
  const numerator = Math.pow(intensity, agents) / factorial(agents);
  const denominator = sum + (numerator * agents) / (agents - intensity);
  
  return numerator / denominator;
}

function calculateSLA(volume: number, aht: number, agents: number, serviceTime: number): number {
  if (agents <= 0) return 0;
  const intensity = (volume * aht) / 1800; // 30-minute intervals
  if (agents <= intensity) return 0;

  const pWait = erlangC(agents, intensity);
  const serviceRate = agents / aht;
  
  const sla = 1 - pWait * Math.exp(-(serviceRate * (agents - intensity)) * serviceTime);
  return Math.max(0, Math.min(1, sla));
}

function calculateOccupancy(volume: number, aht: number, agents: number): number {
  if (agents === 0) return 0;
  return Math.min(1, (volume * aht) / (agents * 1800));
}

function calculateRequiredAgents(volume: number, aht: number, slaTarget: number, serviceTime: number): number {
  const intensity = (volume * aht) / 1800;
  
  // Start with a reasonable guess
  let low = Math.ceil(intensity);
  let high = Math.max(low + 10, Math.ceil(low * 2)); // Ensure high is greater than low

  // If intensity is 0, no agents are required
  if (intensity === 0) return 0;

  let requiredAgents = high;

  // Binary search for optimal agent count
  while (low <= high) {
    const mid = Math.floor((low + high) / 2);
    if (mid === 0) {
        low = 1;
        continue;
    }
    const sla = calculateSLA(volume, aht, mid, serviceTime);
    
    if (sla >= slaTarget) {
      requiredAgents = mid;
      high = mid - 1;
    } else {
      low = mid + 1;
    }
  }
  
  return requiredAgents;
}

// Time distribution profile (typical contact center pattern)
const timeDistributionProfile = [
  0.005, 0.005, 0.005, 0.005, 0.005, 0.005, 0.005, 0.005, // 00:00-04:00
  0.015, 0.025, 0.040, 0.050, 0.060, 0.070, 0.075, 0.080, // 04:00-08:00
  0.085, 0.090, 0.090, 0.085, 0.080, 0.075, 0.070, 0.065, // 08:00-12:00
  0.060, 0.055, 0.050, 0.050, 0.050, 0.050, 0.045, 0.040, // 12:00-16:00
  0.035, 0.030, 0.025, 0.020, 0.015, 0.010, 0.010, 0.010, // 16:00-20:00
  0.005, 0.005, 0.005, 0.005, 0.005, 0.005, 0.005, 0.005, // 20:00-24:00
];

export function generateIntervalData(inputs: SimulationInputs & { dailyVolumes: number[] }): IntervalData[] {
  const intervalData: IntervalData[] = [];
  const totalDays = inputs.dailyVolumes.length;
  
  for (let day = 0; day < totalDays; day++) {
    const dailyVolume = inputs.dailyVolumes[day];
    const dailyRoster = inputs.agentRoster[day] || [];
    
    for (let interval = 0; interval < 48; interval++) {
      const hour = Math.floor(interval / 2);
      const minute = (interval % 2) * 30;
      const intervalLabel = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
      
      const derivedVolume = dailyVolume * timeDistributionProfile[interval];
      const derivedAgents = dailyRoster[interval] || 0;
      
      const effectiveAgents = derivedAgents * 
        (1 - inputs.inOfficeShrinkage) * 
        (1 - inputs.outOfOfficeShrinkage) * 
        (1 - inputs.billableBreakPercent);
      
      const requiredAgents = calculateRequiredAgents(
        derivedVolume, 
        inputs.plannedAHT, 
        inputs.slaTarget, 
        inputs.serviceTime
      );
      
      const slaAchieved = calculateSLA(
        derivedVolume, 
        inputs.plannedAHT, 
        effectiveAgents, 
        inputs.serviceTime
      );
      
      const occupancy = calculateOccupancy(
        derivedVolume, 
        inputs.plannedAHT, 
        effectiveAgents
      );
      
      intervalData.push({
        intervalLabel,
        derivedVolume,
        plannedAHT: inputs.plannedAHT,
        derivedAgents,
        effectiveAgents,
        requiredAgents,
        slaAchieved,
        occupancy,
        staffingGap: effectiveAgents - requiredAgents
      });
    }
  }
  
  return intervalData;
}

export function runSimulation(inputs: SimulationInputs & { dailyVolumes: number[] }): SimulationResults {
  // Validate inputs
  if (!inputs.dailyVolumes || inputs.dailyVolumes.length === 0) {
    throw new Error('Daily volumes are required for simulation');
  }
  
  if (!inputs.dateRange.from || !inputs.dateRange.to) {
    throw new Error('Date range is required for simulation');
  }
  
  const intervalData = generateIntervalData(inputs);
  
  if (intervalData.length === 0) {
    return {
        finalSLA: 0,
        finalOccupancy: 0,
        intervalData: [],
        dailyMetrics: []
    }
  }
  
  // Calculate weighted averages
  const totalVolume = intervalData.reduce((sum, interval) => sum + interval.derivedVolume, 0);
  
  if (totalVolume === 0) {
    return {
        finalSLA: 1,
        finalOccupancy: 0,
        intervalData,
        dailyMetrics: []
    }
  }
  
  const finalSLA = intervalData.reduce((sum, interval) => 
    sum + (interval.slaAchieved * interval.derivedVolume), 0) / totalVolume;
  
  const finalOccupancy = intervalData.reduce((sum, interval) => {
    const weightedOccupancy = interval.occupancy * interval.derivedVolume;
    return sum + (isNaN(weightedOccupancy) ? 0 : weightedOccupancy);
  }, 0) / totalVolume;
  
  // Generate daily metrics
  const dailyMetrics = inputs.dailyVolumes.map((_, index) => {
    const dayIntervals = intervalData.slice(index * 48, (index + 1) * 48);
    const dayVolume = dayIntervals.reduce((sum, interval) => sum + interval.derivedVolume, 0);

    const daySLA = dayVolume > 0
      ? dayIntervals.reduce((sum, interval) => sum + (interval.slaAchieved * interval.derivedVolume), 0) / dayVolume
      : 1;

    const dayOccupancy = dayVolume > 0
      ? dayIntervals.reduce((sum, interval) => sum + (interval.occupancy * interval.derivedVolume), 0) / dayVolume
      : 0;

    const avgStaffing = dayIntervals.reduce((sum, interval) => sum + interval.effectiveAgents, 0) / 48;
    
    const date = new Date(inputs.dateRange.from);
    date.setDate(date.getDate() + index);
    
    return {
      date: date.toISOString().split('T')[0],
      sla: isNaN(daySLA) ? 1 : daySLA,
      occupancy: isNaN(dayOccupancy) ? 0 : dayOccupancy,
      totalVolume: dayVolume,
      avgStaffing
    };
  });
  
  return {
    finalSLA,
    finalOccupancy: isNaN(finalOccupancy) ? 0 : finalOccupancy,
    intervalData,
    dailyMetrics
  };
}