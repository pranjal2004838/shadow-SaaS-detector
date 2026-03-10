import { useState } from 'react';
import Dashboard from './components/Dashboard';
import Simulator from './components/Simulator';
import AIInsights from './components/AIInsights';
import DemoStory from './pages/DemoStory';
import Toast from './components/Toast';
import type { DetectedApp } from './services/api';
import './index.css';

type Tab = 'dashboard' | 'simulator' | 'ai' | 'demo';

export default function App() {
  const [tab, setTab] = useState<Tab>('dashboard');
  const [detectedApps, setDetectedApps] = useState<DetectedApp[]>([]);
  const [revokedApps, setRevokedApps] = useState<Set<string | number>>(new Set());

  return (
    <div className="app-container">
      <Toast />

      {/* Header */}
      <header className="app-header">
        <h1>🔍 Shadow SaaS Detector</h1>
        <span className="demo-badge">Demo Mode</span>
      </header>

      {/* Navigation */}
      <nav className="nav-tabs">
        <button
          className={`nav-tab ${tab === 'dashboard' ? 'active' : ''}`}
          onClick={() => setTab('dashboard')}
        >
          📊 Dashboard
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
