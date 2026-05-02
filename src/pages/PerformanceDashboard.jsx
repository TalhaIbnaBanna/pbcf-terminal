import React, { useState } from 'react';
import { useSheetData } from '../hooks/useSheetData';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Activity, TrendingUp, BarChart2, AlertCircle } from 'lucide-react';

const COLORS = ['#8b5cf6', '#06b6d4', '#f59e0b'];

const PerformanceDashboard = () => {
  const { data, loading, error } = useSheetData();
  const [chartView, setChartView] = useState('overall'); // 'overall' or 'sleeve'

  if (loading) return <LoadingSkeleton />;
  if (error) return <div style={{ color: 'var(--color-negative)' }}>Error loading data: {error}</div>;
  if (!data) return <div>No data available</div>;

  const { performanceHistory, latestKPIs, holdings, allocations } = data;

  return (
    <div className="page-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '32px', animation: 'fadeIn 0.5s ease' }}>
      
      {/* Live KPIs */}
      <div style={kpiGridStyle}>
        <KpiCard title="Live NAV" value={`$${latestKPIs.nav?.toFixed(2)}`} icon={<Activity />} trend="up" />
        <KpiCard title="YTD Return" value={`${latestKPIs.ytdReturn?.toFixed(2)}%`} icon={<TrendingUp />} trend={latestKPIs.ytdReturn >= 0 ? "up" : "down"} />
        <KpiCard title="Live Volatility" value={`${latestKPIs.volatility}`} icon={<AlertCircle />} />
        <KpiCard title="Sharpe Ratio" value={`${latestKPIs.sharpeRatio}`} icon={<BarChart2 />} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '3fr 1fr', gap: '32px' }}>
        {/* Main Chart */}
        <div className="glass-panel" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <h3>Growth of $10,000</h3>
            <div style={toggleContainerStyle}>
              <button 
                style={chartView === 'overall' ? activeToggleStyle : toggleStyle}
                onClick={() => setChartView('overall')}
              >
                Overall Fund
              </button>
              <button 
                style={chartView === 'sleeve' ? activeToggleStyle : toggleStyle}
                onClick={() => setChartView('sleeve')}
              >
                Sleeve Breakdown
              </button>
            </div>
          </div>
          
          <div style={{ height: '400px', width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={performanceHistory} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" vertical={false} />
                <XAxis dataKey="date" stroke="var(--color-text-tertiary)" tick={{ fill: 'var(--color-text-tertiary)' }} tickMargin={10} />
                <YAxis stroke="var(--color-text-tertiary)" tick={{ fill: 'var(--color-text-tertiary)' }} tickFormatter={(val) => `$${val}`} domain={['auto', 'auto']} />
                <Tooltip content={<CustomTooltip />} />
                <Line 
                  type="monotone" 
                  dataKey="nav" 
                  name="PBCF Portfolio"
                  stroke="var(--color-accent-light)" 
                  strokeWidth={3}
                  dot={false}
                  activeDot={{ r: 8, fill: 'var(--color-accent)', stroke: '#fff', strokeWidth: 2 }}
                />
                {chartView === 'overall' && (
                  <Line 
                    type="monotone" 
                    dataKey="benchmarkNav" 
                    name="Benchmark"
                    stroke="var(--color-text-tertiary)" 
                    strokeWidth={2}
                    strokeDasharray="5 5"
                    dot={false}
                  />
                )}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Allocation Drift */}
        <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ marginBottom: '16px' }}>Live Allocation Drift</h3>
          <div style={{ flex: 1, minHeight: '250px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={allocations}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="live"
                  stroke="none"
                >
                  {allocations.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={<DonutTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '16px' }}>
            {allocations.map((a, i) => (
              <div key={a.name} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: COLORS[i] }}></div>
                  <span>{a.name}</span>
                </div>
                <div className="mono">
                  <span style={{ color: 'var(--color-text-tertiary)' }}>{a.target}% </span>
                  <span>→ {a.live.toFixed(1)}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Holdings Table */}
      <div className="glass-panel" style={{ padding: '24px' }}>
        <h3 style={{ marginBottom: '24px' }}>Current Holdings</h3>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--glass-border)', color: 'var(--color-text-tertiary)', fontSize: '0.85rem', textTransform: 'uppercase' }}>
              <th style={{ padding: '12px' }}>Ticker</th>
              <th style={{ padding: '12px' }}>Sector</th>
              <th style={{ padding: '12px', textAlign: 'right' }}>Target</th>
              <th style={{ padding: '12px', textAlign: 'right' }}>Live Weight</th>
              <th style={{ padding: '12px', textAlign: 'right' }}>Drift</th>
            </tr>
          </thead>
          <tbody>
            {holdings.map((h, i) => {
              const drift = h.liveWeight - h.targetWeight;
              const driftColor = drift > 0 ? 'var(--color-positive)' : drift < 0 ? 'var(--color-negative)' : 'inherit';
              
              return (
                <tr key={h.ticker} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)', transition: 'background var(--transition-fast)' }}>
                  <td style={{ padding: '16px 12px', fontWeight: 600 }}>{h.ticker}</td>
                  <td style={{ padding: '16px 12px', color: 'var(--color-text-secondary)' }}>{h.sector}</td>
                  <td className="mono" style={{ padding: '16px 12px', textAlign: 'right', color: 'var(--color-text-tertiary)' }}>{h.targetWeight}%</td>
                  <td className="mono" style={{ padding: '16px 12px', textAlign: 'right' }}>{h.liveWeight}%</td>
                  <td className="mono" style={{ padding: '16px 12px', textAlign: 'right', color: driftColor }}>
                    {drift > 0 ? '+' : ''}{drift.toFixed(2)}%
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes pulse {
          0% { opacity: 0.6; }
          50% { opacity: 0.3; }
          100% { opacity: 0.6; }
        }
        tbody tr:hover {
          background: rgba(255,255,255,0.02);
        }
      `}</style>
    </div>
  );
};

// Sub-components
const KpiCard = ({ title, value, icon, trend }) => (
  <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <span style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem' }}>{title}</span>
      {React.cloneElement(icon, { size: 18, color: 'var(--color-text-tertiary)' })}
    </div>
    <div className="mono" style={{ fontSize: '2rem', fontWeight: 600, color: trend === 'up' ? 'var(--color-positive)' : trend === 'down' ? 'var(--color-negative)' : 'var(--color-text-primary)' }}>
      {value}
    </div>
  </div>
);

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="glass-panel" style={{ padding: '12px', border: '1px solid var(--color-accent-light)' }}>
        <p style={{ margin: '0 0 8px 0', fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>{label}</p>
        <p className="mono" style={{ margin: '0 0 4px 0', fontWeight: 600, color: payload[0].color }}>
          Portfolio: ${payload[0].value.toFixed(2)}
        </p>
        {payload[1] && (
          <p className="mono" style={{ margin: 0, fontWeight: 600, color: payload[1].color }}>
            Benchmark: ${payload[1].value.toFixed(2)}
          </p>
        )}
      </div>
    );
  }
  return null;
};

const DonutTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="glass-panel" style={{ padding: '12px' }}>
        <p style={{ margin: '0 0 4px 0', fontSize: '0.85rem' }}>{data.name}</p>
        <p className="mono" style={{ margin: 0, fontWeight: 600, color: payload[0].payload.fill }}>
          {data.live.toFixed(1)}% (Target: {data.target}%)
        </p>
      </div>
    );
  }
  return null;
};

const LoadingSkeleton = () => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
    <div style={kpiGridStyle}>
      {[1,2,3,4].map(i => <div key={i} className="glass-panel" style={{ height: '100px', animation: 'pulse 1.5s infinite' }}></div>)}
    </div>
    <div className="glass-panel" style={{ height: '400px', animation: 'pulse 1.5s infinite', animationDelay: '0.2s' }}></div>
  </div>
);

// Styles
const kpiGridStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
  gap: '24px'
};

const toggleContainerStyle = {
  display: 'flex',
  background: 'rgba(0,0,0,0.3)',
  borderRadius: 'var(--radius-sm)',
  padding: '4px'
};

const toggleStyle = {
  background: 'transparent',
  border: 'none',
  color: 'var(--color-text-secondary)',
  padding: '6px 12px',
  fontSize: '0.85rem',
  cursor: 'pointer',
  borderRadius: '2px',
  transition: 'var(--transition-fast)'
};

const activeToggleStyle = {
  ...toggleStyle,
  background: 'var(--color-bg-tertiary)',
  color: 'var(--color-text-primary)',
  boxShadow: 'var(--shadow-sm)'
};

export default PerformanceDashboard;
