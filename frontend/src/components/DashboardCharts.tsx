import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import type { DetectedApp } from '../services/api';

interface DashboardChartsProps {
  detectedApps: DetectedApp[];
}

const CATEGORY_COLORS = [
  '#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#22c55e',
  '#06b6d4', '#f97316', '#14b8a6', '#a855f7', '#6366f1',
];

const RISK_COLORS: Record<string, string> = {
  critical: '#dc2626',
  high: '#ef4444',
  medium: '#f59e0b',
  low: '#22c55e',
};

const RISK_ORDER = ['critical', 'high', 'medium', 'low'];

// Custom tooltip styling for dark theme
const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ name: string; value: number; color: string }>; label?: string }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: '#1e293b',
      border: '1px solid #334155',
      borderRadius: '8px',
      padding: '10px 14px',
      fontSize: '0.8rem',
      color: '#f1f5f9',
      boxShadow: '0 10px 25px rgba(0,0,0,0.4)',
    }}>
      {label && <p style={{ fontWeight: 600, marginBottom: 4 }}>{label}</p>}
      {payload.map((entry, i) => (
        <p key={i} style={{ color: entry.color, margin: '2px 0' }}>
          {entry.name}: {typeof entry.value === 'number' && entry.name.includes('$') ? `$${entry.value}` : entry.value}
        </p>
      ))}
    </div>
  );
};

// Custom label for pie chart
const renderCustomLabel = (props: any) => {
  const { name, percent } = props;
  if (!name || !percent || percent < 0.05) return null;
  return `${name} (${(percent * 100).toFixed(0)}%)`;
};

export default function DashboardCharts({ detectedApps }: DashboardChartsProps) {
  // ── Spend by Category (Donut) ──
  const categorySpend: Record<string, number> = {};
  const categoryCount: Record<string, number> = {};
  for (const app of detectedApps) {
    categorySpend[app.category] = (categorySpend[app.category] || 0) + app.typical_price;
    categoryCount[app.category] = (categoryCount[app.category] || 0) + 1;
  }
  const spendData = Object.entries(categorySpend)
    .map(([name, value]) => ({ name, value, count: categoryCount[name] }))
    .sort((a, b) => b.value - a.value);

  const totalSpend = spendData.reduce((s, d) => s + d.value, 0);

  // ── Risk Distribution (Bar) ──
  const riskCounts: Record<string, number> = { critical: 0, high: 0, medium: 0, low: 0 };
  for (const app of detectedApps) {
    const level = app.risk_level || 'low';
    riskCounts[level] = (riskCounts[level] || 0) + 1;
  }
  const riskData = RISK_ORDER
    .filter((level) => riskCounts[level] > 0)
    .map((level) => ({
      name: level.charAt(0).toUpperCase() + level.slice(1),
      count: riskCounts[level],
      fill: RISK_COLORS[level],
    }));

  // ── Department breakdown ──
  const deptSpend: Record<string, number> = {};
  for (const app of detectedApps) {
    const dept = app.department || 'Unknown';
    deptSpend[dept] = (deptSpend[dept] || 0) + app.typical_price;
  }
  const deptData = Object.entries(deptSpend)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);

  return (
    <div className="charts-grid">
      {/* Spend by Category - Donut Chart */}
      <div className="chart-card">
        <div className="chart-header">
          <h3>💰 Spend by Category</h3>
          <span className="chart-total">${totalSpend}/mo total</span>
        </div>
        <ResponsiveContainer width="100%" height={280}>
          <PieChart>
            <Pie
              data={spendData}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={100}
              paddingAngle={3}
              dataKey="value"
              label={renderCustomLabel}
              labelLine={{ stroke: '#64748b', strokeWidth: 1 }}
            >
              {spendData.map((_entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={CATEGORY_COLORS[index % CATEGORY_COLORS.length]}
                  stroke="transparent"
                />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>
        <div className="chart-legend-grid">
          {spendData.map((entry, i) => (
            <div key={entry.name} className="chart-legend-item">
              <span className="legend-dot" style={{ background: CATEGORY_COLORS[i % CATEGORY_COLORS.length] }} />
              <span className="legend-label">{entry.name}</span>
              <span className="legend-value">${entry.value}/mo</span>
            </div>
          ))}
        </div>
      </div>

      {/* Risk Distribution - Bar Chart */}
      <div className="chart-card">
        <div className="chart-header">
          <h3>🛡️ Risk Distribution</h3>
          <span className="chart-total">{detectedApps.length} apps scanned</span>
        </div>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={riskData} barCategoryGap="25%">
            <XAxis
              dataKey="name"
              tick={{ fill: '#94a3b8', fontSize: 12 }}
              axisLine={{ stroke: '#334155' }}
              tickLine={false}
            />
            <YAxis
              tick={{ fill: '#94a3b8', fontSize: 12 }}
              axisLine={{ stroke: '#334155' }}
              tickLine={false}
              allowDecimals={false}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="count" name="Apps" radius={[6, 6, 0, 0]}>
              {riskData.map((entry, index) => (
                <Cell key={`bar-${index}`} fill={entry.fill} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Dept Spend - Horizontal Bar */}
      <div className="chart-card chart-card-wide">
        <div className="chart-header">
          <h3>🏢 Shadow Spend by Department</h3>
        </div>
        <ResponsiveContainer width="100%" height={Math.max(180, deptData.length * 44)}>
          <BarChart data={deptData} layout="vertical" barCategoryGap="20%">
            <XAxis
              type="number"
              tick={{ fill: '#94a3b8', fontSize: 12 }}
              axisLine={{ stroke: '#334155' }}
              tickLine={false}
              tickFormatter={(v) => `$${v}`}
            />
            <YAxis
              dataKey="name"
              type="category"
              tick={{ fill: '#f1f5f9', fontSize: 12 }}
              axisLine={false}
              tickLine={false}
              width={100}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="value" name="$ Monthly Spend" fill="#8b5cf6" radius={[0, 6, 6, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
