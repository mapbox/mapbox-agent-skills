import MapComponent from './MapComponent';
import './App.css';

function App() {
  return (
    <div className="App">
      <header className="header">
        <h1>React + Mapbox GL JS</h1>
        <p>
          Following patterns from <strong>mapbox-web-integration-patterns</strong> skill
        </p>
      </header>
      <MapComponent />
    </div>
  );
}

export default App;
