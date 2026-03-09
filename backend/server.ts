import express from 'express';
import cors from 'cors';
import path from 'path';
import uploadRoutes from './routes/upload';
import simulateRoutes from './routes/simulate';
import playbookRoutes from './routes/playbook';
import aiRoutes from './routes/ai';

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// API Routes
app.use('/api/upload', uploadRoutes);
app.use('/api/simulate', simulateRoutes);
app.use('/api/playbook', playbookRoutes);
app.use('/api/ai', aiRoutes);

// Serve test_data for demo
app.use('/test_data', express.static(path.join(__dirname, '..', 'test_data')));

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString(), demo: true });
});

// Serve static frontend in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '..', 'frontend', 'dist')));
  app.get('*', (_req, res) => {
    res.sendFile(path.join(__dirname, '..', 'frontend', 'dist', 'index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`🚀 Shadow SaaS Detector backend running on port ${PORT}`);
  console.log(`   DEMO MODE — no live revocations`);
});

export default app;
