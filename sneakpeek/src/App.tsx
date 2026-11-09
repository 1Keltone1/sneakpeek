import { useState } from 'react';
import { StartScreen } from './components/StartScreen';
import { ARCamera } from './components/ARCamera';
import { type ShoeConfig } from './config/shoes';
import './App.css';

function App() {
  const [selectedShoe, setSelectedShoe] = useState<ShoeConfig | null>(null);

  if (selectedShoe) {
    return (
      <div className="App">
        <ARCamera 
          shoe={selectedShoe} 
          onBack={() => setSelectedShoe(null)} 
        />
      </div>
    );
  }

  return (
    <div className="App">
      <StartScreen onSelect={setSelectedShoe} />
    </div>
  );
}

export default App;