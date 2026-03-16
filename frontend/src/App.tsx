import { useState } from 'react';
import Dashboard from './components/Dashboard';
import Simulator from './components/Simulator';
import AIInsights from './components/AIInsights';
import AttackSurfaceMap from './components/AttackSurfaceMap';
import ExecutiveBrief from './components/ExecutiveBrief';
import SupplyChainRisk from './components/SupplyChainRisk';
import ThreatTicker from './components/ThreatTicker';
import DemoStory from './pages/DemoStory';
import Toast from './components/Toast';
import type { DetectedApp } from './services/api';
import './index.css';

type Tab = 'dashboard' | 'threat-map' | 'simulator' | 'ai' | 'demo';

export default function App() {
  const [tab, setTab] = useState<Tab>('dashboard');
  const [detectedApps, setDetectedApps] = useState<DetectedApp[]>([]);
  const [revokedApps, setRevokedApps] = useState<Set<string | number>>(new Set());

  return (
    <div className="app-container">
      <Toast />

      {/* Header */}
      <header className="app-header">
        <div className="app-header-left">
          <h1>🔍 Shadow SaaS Detector</h1>
          <span className="header-tagline">Enterprise Shadow IT Discovery & Compliance Platform</span>
        </div>
        <div className="app-header-right">
          <span className="demo-badge">Preview</span>
          {detectedApps.length > 0 && (
            <span className="app-count-badge">{detectedApps.length} apps found</span>
          )}
        </div>
      </header>

      {/* Live Threat Ticker */}
      <ThreatTicker detectedApps={detectedApps} />

      {/* Navigation */}
      <nav className="nav-tabs">
        <button
          className={`nav-tab ${tab === 'dashboard' ? 'active' : ''}`}
          onClick={() => setTab('dashboard')}
        >
          📊 Dashboard
        </button>
        <button
          className={`nav-tab ${tab === 'threat-map' ? 'active' : ''}`}
          onClick={() => setTab('threat-map')}
        >
          🗺️ Threat Map
        </button>
        <button
          className={`nav-tab ${tab === 'simulator' ? 'active' : ''}`}
          onClick={() => setTab('simulator')}
        >
          💰 Simulator
        </button>
        <button
          className={`nav-tab ${tab === 'ai' ? 'active' : ''}`}
          onClick={() => setTab('ai')}
          data-testid="ai-tab-btn"
        >
          🤖 AI Insights
        </button>
        <button
          className={`nav-tab ${tab === 'demo' ? 'active' : ''}`}
          onClick={() => setTab('demo')}
        >
          🎬 Demo Story
        </button>
      </nav>

      {/* Tab Content */}
      {tab === 'dashboard' && (
        <Dashboard
          detectedApps={detectedApps}
          setDetectedApps={setDetectedApps}
          revokedApps={revokedApps}
          setRevokedApps={setRevokedApps}
        />
      )}

      {tab === 'threat-map' && (
        <>
          <SupplyChainRisk detectedApps={detectedApps} />
          <AttackSurfaceMap detectedApps={detectedApps} />
          <ExecutiveBrief detectedApps={detectedApps} />
        </>
      )}

      {tab === 'simulator' && (
        <Simulator detectedApps={detectedApps} />
      )}

      {tab === 'ai' && (
        <AIInsights detectedApps={detectedApps} />
      )}

      {tab === 'demo' && (
        <DemoStory />
      )}
    </div>
  );
}
