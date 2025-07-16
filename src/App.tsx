import React, { useState } from 'react';
import { InputScreen } from './components/InputScreen';
import { OutputScreen } from './components/OutputScreen';
import { SimulationInputs, SimulationResults } from './types';

function App() {
  const [currentScreen, setCurrentScreen] = useState<'input' | 'output'>('input');
  const [simulationResults, setSimulationResults] = useState<SimulationResults | null>(null);
  const [simulationInputs, setSimulationInputs] = useState<SimulationInputs | null>(null);


  const handleSimulationComplete = (results: SimulationResults, inputs: SimulationInputs) => {
    setSimulationResults(results);
    setSimulationInputs(inputs);
    setCurrentScreen('output');
  };

  const handleBackToInput = () => {
    setCurrentScreen('input');
  };

  return (
    <div className="min-h-screen bg-slate-900">
      {currentScreen === 'input' ? (
        <InputScreen onSimulationComplete={handleSimulationComplete} />
      ) : (
        simulationResults && simulationInputs && (
          <OutputScreen 
            results={simulationResults} 
            inputs={simulationInputs}
            onBackToInput={handleBackToInput}
          />
        )
      )}
    </div>
  );
}

export default App;