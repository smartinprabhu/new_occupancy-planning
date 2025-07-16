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
  const intensity = (volume * aht) / 1800; // 30-minute intervals
  const pWait = erlangC(agents, intensity);
  const serviceRate = agents / aht;
  
  if (agents <= intensity) return 0;
  
  const sla = 1 - pWait * Math.exp(-serviceRate * (agents - intensity) * serviceTime);
  return Math.max(0, Math.min(1, sla));
}

function calculateOccupancy(volume: number, aht: number, agents: number): number {
  if (agents === 0) return 0;
  return Math.min(1, (volume * aht) / (agents * 1800));
}

function calculateRequiredAgents(volume: number, aht: number, slaTarget: number, serviceTime: number): number {
  const intensity = (volume * aht) / 1800;
  let agents = Math.ceil(intensity);
  
  // Binary search for optimal agent count
  let low = Math.ceil(intensity);
  let high = Math.ceil(intensity * 2);
  
  while (low < high) {
    const mid = Math.floor((low + high) / 2);
    const sla = calculateSLA(volume, aht, mid, serviceTime);
    
    if (sla >= slaTarget) {
      high = mid;
    } else {
      low = mid + 1;
    }
  }
  
  return low;
}

// Time distribution profile (typical contact center pattern)
const timeDistributionProfile = [
  0.015, 0.012, 0.010, 0.008, 0.007, 0.008, 0.012, 0.018, // 00:00-04:00
  0.025, 0.035, 0.045, 0.055, 0.065, 0.070, 0.075, 0.078, // 04:00-08:00
  0.080, 0.085, 0.088, 0.090, 0.092, 0.090, 0.088, 0.085, // 08:00-12:00
  0.082, 0.080, 0.078, 0.075, 0.072, 0.070, 0.068, 0.065, // 12:00-16:00
  0.060, 0.055, 0.050, 0.045, 0.040, 0.035, 0.030, 0.025, // 16:00-20:00
  0.020, 0.018, 0.016, 0.014, 0.012, 0.010, 0.008, 0.006  // 20:00-24:00
];

// Agent distribution across shifts (assuming 8.5 hour shifts)
const shiftDistributionProfile = [
  0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, // 00:00-04:00
  0.0, 0.2, 0.4, 0.6, 0.8, 1.0, 1.0, 1.0, // 04:00-08:00
  1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, // 08:00-12:00
  1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, // 12:00-16:00
  1.0, 1.0, 0.8, 0.6, 0.4, 0.2, 0.0, 0.0, // 16:00-20:00
  0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0  // 20:00-24:00
];

export function generateIntervalData(inputs: SimulationInputs): IntervalData[] {
  const intervalData: IntervalData[] = [];
  const totalDays = inputs.dailyVolumes.length;
  
  for (let day = 0; day < totalDays; day++) {
    const dailyVolume = inputs.dailyVolumes[day];
    const dailyAgents = inputs.dailyShiftPlan[day] || [];
    
    for (let interval = 0; interval < 48; interval++) {
      const hour = Math.floor(interval / 2);
      const minute = (interval % 2) * 30;
      const intervalLabel = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
      
      const derivedVolume = dailyVolume * timeDistributionProfile[interval];
      const derivedAgents = (dailyAgents[0] || 0) * shiftDistributionProfile[interval];
      
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
        staffingGap: derivedAgents - requiredAgents
      });
    }
  }
  
  return intervalData;
}

export function runSimulation(inputs: SimulationInputs): SimulationResults {
  // Validate inputs
  if (!inputs.dailyVolumes || inputs.dailyVolumes.length === 0) {
    throw new Error('Daily volumes are required for simulation');
  }
  
  if (!inputs.dateRange.from || !inputs.dateRange.to) {
    throw new Error('Date range is required for simulation');
  }
  
  const intervalData = generateIntervalData(inputs);
  
  if (intervalData.length === 0) {
    throw new Error('No interval data generated');
  }
  
  // Calculate weighted averages
  const totalVolume = intervalData.reduce((sum, interval) => sum + interval.derivedVolume, 0);
  
  if (totalVolume === 0) {
    throw new Error('Total volume cannot be zero');
  }
  
  const finalSLA = intervalData.reduce((sum, interval) => 
    sum + (interval.slaAchieved * interval.derivedVolume), 0) / totalVolume;
  
  const finalOccupancy = intervalData.reduce((sum, interval) => 
    sum + (interval.occupancy * interval.derivedVolume), 0) / totalVolume;
  
  // Generate daily metrics
  const dailyMetrics = inputs.dailyVolumes.map((volume, index) => {
    const dayIntervals = intervalData.slice(index * 48, (index + 1) * 48);
    const dayVolume = dayIntervals.reduce((sum, interval) => sum + interval.derivedVolume, 0);
    const daySLA = dayIntervals.reduce((sum, interval) => 
      sum + (interval.slaAchieved * interval.derivedVolume), 0) / dayVolume;
    const dayOccupancy = dayIntervals.reduce((sum, interval) => 
      sum + (interval.occupancy * interval.derivedVolume), 0) / dayVolume;
    const avgStaffing = dayIntervals.reduce((sum, interval) => sum + interval.effectiveAgents, 0) / 48;
    
    const date = new Date(inputs.dateRange.from);
    date.setDate(date.getDate() + index);
    
    return {
      date: date.toISOString().split('T')[0],
      sla: daySLA,
      occupancy: dayOccupancy,
      totalVolume: dayVolume,
      avgStaffing
    };
  });
  
  return {
    finalSLA,
    finalOccupancy,
    intervalData,
    dailyMetrics
  };
}

export function calculateLivePerformance(
  dailyVolume: number,
  rosterAgents: number[],
  inputs: SimulationInputs
): any[] {
  const performanceData = [];
  
  for (let interval = 0; interval < 48; interval++) {
    const hour = Math.floor(interval / 2);
    const minute = (interval % 2) * 30;
    const intervalLabel = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
    
    const derivedVolume = dailyVolume * timeDistributionProfile[interval];
    const actualAgents = rosterAgents[interval] || 0;
    
    const effectiveAgents = actualAgents * 
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
    
    performanceData.push({
      interval: intervalLabel,
      actual: effectiveAgents,
      required: requiredAgents,
      variance: effectiveAgents - requiredAgents,
      occupancy: occupancy * 100,
      sla: slaAchieved * 100,
      volume: derivedVolume
    });
  }
  
  return performanceData;
}