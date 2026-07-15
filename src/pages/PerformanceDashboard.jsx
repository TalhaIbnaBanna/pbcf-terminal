import React, { useState, useMemo, useEffect } from 'react';
import { useSheetData } from '../hooks/useSheetData';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Activity, TrendingUp, BarChart3, PieChart as PieIcon, ArrowUpRight, ArrowDownRight, Percent, Calendar } from 'lucide-react';

const stdDev = (arr) => {
  if (arr.length <= 1) return 0;
  const mean = arr.reduce((a, b) => a + b) / arr.length;
  return Math.sqrt(arr.map(x => Math.pow(x - mean, 2)).reduce((a, b) => a + b) / (arr.length - 1));
};

const formatDateToISO = (dateVal) => {
  if (!dateVal) return '';
  const d = new Date(dateVal);
  if (isNaN(d.getTime())) return '';
  const month = '' + (d.getMonth() + 1);
  const day = '' + d.getDate();
  const year = d.getFullYear();
  return [year, month.padStart(2, '0'), day.padStart(2, '0')].join('-');
};

const parseISODate = (isoStr) => {
  if (!isoStr) return null;
  const parts = isoStr.split('-');
  if (parts.length !== 3) return null;
  return new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
};

const PerformanceDashboard = () => {
  const { data, loading, error } = useSheetData();
  const [chartView, setChartView] = useState('overall'); // 'overall' or 'sleeves'
  const [timeRange, setTimeRange] = useState('ALL'); // '1W', '1M', '3M', 'YTD', 'ALL', 'CUSTOM'
  const [customStartDate, setCustomStartDate] = useState(null);
  const [customEndDate, setCustomEndDate] = useState(null);

  useEffect(() => {
    if (data?.performanceHistory && data.performanceHistory.length > 0) {
      const history = data.performanceHistory;
      setCustomStartDate(new Date(history[0].date));
      setCustomEndDate(new Date(history[history.length - 1].date));
    }
  }, [data]);

  const handleDateChange = (type, val) => {
    const parsedDate = parseISODate(val);
    if (!parsedDate) return;
    if (type === 'start') {
      setCustomStartDate(parsedDate);
    } else {
      setCustomEndDate(parsedDate);
    }
  };

  // Filtering and Re-basing logic
  const filteredHistory = useMemo(() => {
    if (!data?.performanceHistory) return [];
    
    let filtered = [...data.performanceHistory];
    const latestDate = new Date(filtered[filtered.length - 1].date);
    
    if (timeRange === 'CUSTOM') {
      const startLimit = customStartDate ? new Date(customStartDate) : null;
      if (startLimit) startLimit.setHours(0, 0, 0, 0);
      const endLimit = customEndDate ? new Date(customEndDate) : null;
      if (endLimit) endLimit.setHours(23, 59, 59, 999);
      
      filtered = filtered.filter(d => {
        const dDate = new Date(d.date);
        return (!startLimit || dDate >= startLimit) && (!endLimit || dDate <= endLimit);
      });
    } else if (timeRange !== 'ALL') {
      const cutoff = new Date(latestDate);
      if (timeRange === '1W') cutoff.setDate(cutoff.getDate() - 7);
      if (timeRange === '1M') cutoff.setMonth(cutoff.getMonth() - 1);
      if (timeRange === '3M') cutoff.setMonth(cutoff.getMonth() - 3);
      if (timeRange === 'YTD') cutoff.setMonth(0, 1); // Jan 1st
      
      filtered = filtered.filter(d => new Date(d.date) >= cutoff);
    }

    if (filtered.length === 0) return [];

    // Re-base logic: Calculate cumulative return from the start of the period
    const startNav = filtered[0].nav;
    const startBenchNav = filtered[0].benchmarkNav;
    
    return filtered.map(d => ({
      ...d,
      navReturn: ((d.nav / startNav) - 1) * 100,
      benchReturn: ((d.benchmarkNav / startBenchNav) - 1) * 100
    }));
  }, [data, timeRange, customStartDate, customEndDate]);

  // Dynamically recalculate all metrics based on active timeframe
  const derivedMetrics = useMemo(() => {
    if (!data || filteredHistory.length === 0) return null;

    const firstRow = filteredHistory[0];
    const latestRow = filteredHistory[filteredHistory.length - 1];

    const firstValidRow = filteredHistory.find(d => d.portfolioValue > 0) || firstRow;

    // HPR / Total Return
    const hpr = firstValidRow.portfolioValue > 0 
      ? (latestRow.portfolioValue / firstValidRow.portfolioValue) - 1 
      : 0;
    
    const benchHpr = firstValidRow.benchmarkNav > 0 
      ? (latestRow.benchmarkNav / firstValidRow.benchmarkNav) - 1 
      : 0;

    // Annualized Return
    const startDate = new Date(firstRow.date);
    const endDate = new Date(latestRow.date);
    const daysElapsed = Math.max(1, (endDate - startDate) / (1000 * 60 * 60 * 24));
    const annualizedReturn = (Math.pow(1 + hpr, 365 / daysElapsed) - 1) * 100;

    // Daily Returns of the sub-period for Volatility
    const subDailyReturns = [];
    for (let i = 1; i < filteredHistory.length; i++) {
      const prevVal = filteredHistory[i - 1].portfolioValue;
      const currVal = filteredHistory[i].portfolioValue;
      const dailyRet = prevVal > 0 ? (currVal / prevVal) - 1 : 0;
      if (dailyRet !== 0) {
        subDailyReturns.push(dailyRet);
      }
    }

    // Volatility & Sharpe
    const dailyVolatility = stdDev(subDailyReturns);
    const annualizedVolatility = dailyVolatility * Math.sqrt(252) * 100;
    const sharpeRatio = dailyVolatility === 0 ? 0 : (annualizedReturn / annualizedVolatility);

    // Dynamic Holdings at the end of the selected period
    const holdings = data.holdings.map(h => {
      const liveVal = latestRow.sanitizedTickerValues[h.ticker] || 0;
      return {
        ...h,
        liveValue: liveVal,
        liveWeight: latestRow.portfolioValue > 0 ? (liveVal / latestRow.portfolioValue) * 100 : 0
      };
    });

    // Dynamic Allocations at the end of the selected period
    const uniqueSectors = [...new Set(holdings.map(h => h.sector))];
    const allocations = uniqueSectors.map(sector => {
      const sectorHoldings = holdings.filter(h => h.sector === sector);
      return {
        name: sector,
        target: sectorHoldings.reduce((sum, h) => sum + h.targetWeight, 0),
        live: sectorHoldings.reduce((sum, h) => sum + h.liveWeight, 0)
      };
    });

    return {
      latestKPIs: {
        nav: latestRow.portfolioValue,
        ytdReturn: hpr * 100,
        annualizedReturn,
        volatility: annualizedVolatility.toFixed(2) + '%',
        sharpeRatio: sharpeRatio.toFixed(2),
        alpha: (hpr - benchHpr) * 100
      },
      holdings,
      allocations
    };
  }, [data, filteredHistory]);

  if (loading) return <div style={{ padding: '48px', color: 'var(--color-text-secondary)' }}>Loading analytical data...</div>;
  if (error) return <div style={{ padding: '48px', color: 'var(--color-negative)' }}>Error: {error}</div>;

  const { latestKPIs, holdings, allocations } = derivedMetrics || data;

  return (
    <div className="page-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      
      {/* Header & Main KPIs */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '24px' }}>
        <div>
          <h1 className="text-gradient" style={{ fontSize: '2.5rem', marginBottom: '8px' }}>Performance Analytics</h1>
          <p style={{ color: 'var(--color-text-tertiary)' }}>Institutional-grade portfolio attribution and risk metrics.</p>
        </div>
        <div style={{ display: 'flex', gap: '16px' }}>
          <KPICard title="Total Portfolio Value" value={`$${latestKPIs.nav.toLocaleString()}`} icon={<BarChart3 size={16} />} />
          <KPICard 
            title="Total Return (HPR)" 
            value={`${latestKPIs.ytdReturn.toFixed(2)}%`} 
            subValue="Inception to Date"
            icon={<TrendingUp size={16} />} 
            trend={latestKPIs.ytdReturn >= 0 ? 'up' : 'down'}
          />
        </div>
      </div>

      {/* Analytical Grid */}
      <div className="grid-4" style={{ marginBottom: '16px' }}>
        <MiniMetric title="Annualized Return" value={`${latestKPIs.annualizedReturn.toFixed(2)}%`} icon={<Percent />} />
        <MiniMetric title="Alpha vs. Composite" value={`${latestKPIs.alpha.toFixed(2)}%`} icon={<ArrowUpRight />} highlight={latestKPIs.alpha >= 0 ? 'var(--color-positive)' : 'var(--color-negative)'} />
        <MiniMetric title="Annualized Volatility" value={latestKPIs.volatility} icon={<Activity />} />
        <MiniMetric title="Sharpe Ratio" value={latestKPIs.sharpeRatio} icon={<TrendingUp />} />
      </div>

      {/* Main Chart Section */}
      <section className="glass-panel" style={{ padding: '32px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px', flexWrap: 'wrap', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', gap: '8px', background: 'rgba(255,255,255,0.05)', padding: '4px', borderRadius: '8px' }}>
              {['1W', '1M', '3M', 'YTD', 'ALL', 'CUSTOM'].map(range => (
                <button 
                  key={range}
                  onClick={() => setTimeRange(range)}
                  style={{
                    padding: '6px 12px',
                    borderRadius: '6px',
                    border: 'none',
                    background: timeRange === range ? 'var(--color-accent)' : 'transparent',
                    color: timeRange === range ? '#fff' : 'var(--color-text-secondary)',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  {range === 'CUSTOM' ? 'Custom Date' : range}
                </button>
              ))}
            </div>

            {timeRange === 'CUSTOM' && (
              <div className="page-fade-in" style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(255,255,255,0.03)', padding: '6px 16px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--color-text-tertiary)' }}>From:</span>
                <input 
                  type="date" 
                  value={formatDateToISO(customStartDate)}
                  min={formatDateToISO(data?.performanceHistory?.[0]?.date)}
                  max={formatDateToISO(data?.performanceHistory?.[data.performanceHistory.length - 1]?.date)}
                  onChange={(e) => handleDateChange('start', e.target.value)}
                  style={{
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '4px',
                    color: '#fff',
                    padding: '4px 8px',
                    fontSize: '0.8rem',
                    fontFamily: 'inherit',
                    outline: 'none',
                    cursor: 'pointer'
                  }}
                />
                <span style={{ fontSize: '0.8rem', color: 'var(--color-text-tertiary)' }}>To:</span>
                <input 
                  type="date" 
                  value={formatDateToISO(customEndDate)}
                  min={formatDateToISO(data?.performanceHistory?.[0]?.date)}
                  max={formatDateToISO(data?.performanceHistory?.[data.performanceHistory.length - 1]?.date)}
                  onChange={(e) => handleDateChange('end', e.target.value)}
                  style={{
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '4px',
                    color: '#fff',
                    padding: '4px 8px',
                    fontSize: '0.8rem',
                    fontFamily: 'inherit',
                    outline: 'none',
                    cursor: 'pointer'
                  }}
                />
              </div>
            )}
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button className={`tab-btn ${chartView === 'overall' ? 'active' : ''}`} onClick={() => setChartView('overall')}>Cumulative Return (%)</button>
            <button className={`tab-btn ${chartView === 'sleeves' ? 'active' : ''}`} onClick={() => setChartView('sleeves')}>Asset Allocation</button>
          </div>
        </div>

        {chartView === 'overall' ? (
          <div style={{ height: '450px', width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={filteredHistory} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis 
                  dataKey="date" 
                  stroke="var(--color-text-tertiary)" 
                  tick={{ fill: 'var(--color-text-tertiary)', fontSize: 10 }} 
                  tickMargin={12}
                  interval="preserveStartEnd"
                  minTickGap={100}
                  tickFormatter={(str) => {
                    const date = new Date(str);
                    const isShortRange = timeRange === '1W' || timeRange === '1M' || (timeRange === 'CUSTOM' && customStartDate && customEndDate && (customEndDate - customStartDate) / (1000*60*60*24) <= 31);
                    if (isShortRange) {
                      return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
                    }
                    return date.toLocaleDateString(undefined, { month: 'short' });
                  }}
                />
                <YAxis 
                  stroke="var(--color-text-tertiary)" 
                  tick={{ fill: 'var(--color-text-tertiary)', fontSize: 12 }} 
                  tickFormatter={(val) => `${val > 0 ? '+' : ''}${val.toFixed(1)}%`} 
                  domain={['auto', 'auto']} 
                />
                <Tooltip content={<CustomTooltip />} />
                <Line 
                  type="monotone" 
                  dataKey="navReturn" 
                  name="Portfolio Return"
                  stroke="var(--color-accent-light)" 
                  strokeWidth={3}
                  dot={false}
                  activeDot={{ r: 6, fill: 'var(--color-accent)' }}
                />
                <Line 
                  type="monotone" 
                  dataKey="benchReturn" 
                  name="Benchmark Return"
                  stroke="rgba(255, 255, 255, 0.45)" 
                  strokeWidth={2.5}
                  strokeDasharray="6 4"
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '48px', alignItems: 'center' }}>
            <div style={{ height: '350px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={allocations}
                    cx="50%"
                    cy="50%"
                    innerRadius={80}
                    outerRadius={120}
                    paddingAngle={5}
                    dataKey="live"
                  >
                    {allocations.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={ALLOC_COLORS[index % ALLOC_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              {allocations.map((alloc, idx) => (
                <div key={alloc.name}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span style={{ fontWeight: 500 }}>{alloc.name}</span>
                    <span className="mono">{alloc.live.toFixed(1)}%</span>
                  </div>
                  <div style={{ height: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${alloc.live}%`, background: ALLOC_COLORS[idx % ALLOC_COLORS.length] }}></div>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px', fontSize: '0.75rem', color: 'var(--color-text-tertiary)' }}>
                    <span>Target: {alloc.target}%</span>
                    <span style={{ color: alloc.live > alloc.target ? 'var(--color-positive)' : 'var(--color-negative)' }}>
                      Drift: {(alloc.live - alloc.target).toFixed(1)}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* Holdings Detailed View */}
      <section className="glass-panel" style={{ padding: '32px' }}>
        <h3 style={{ marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <PieIcon size={20} color="var(--color-accent-light)" />
          Constituent Holdings
        </h3>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ color: 'var(--color-text-tertiary)', fontSize: '0.85rem', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <th style={{ padding: '12px' }}>Ticker</th>
                <th style={{ padding: '12px' }}>Sector</th>
                <th style={{ padding: '12px' }}>Value</th>
                <th style={{ padding: '12px' }}>Live Weight</th>
                <th style={{ padding: '12px' }}>Target</th>
                <th style={{ padding: '12px' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {holdings.sort((a, b) => b.liveWeight - a.liveWeight).map((h) => (
                <tr key={h.ticker} style={{ borderBottom: '1px solid rgba(255,255,255,0.02)', fontSize: '0.95rem' }}>
                  <td style={{ padding: '16px 12px' }}><span className="mono" style={{ color: 'var(--color-accent-light)', fontWeight: 600 }}>{h.ticker}</span></td>
                  <td style={{ padding: '16px 12px', color: 'var(--color-text-secondary)' }}>{h.sector}</td>
                  <td style={{ padding: '16px 12px' }} className="mono">${h.liveValue.toLocaleString()}</td>
                  <td style={{ padding: '16px 12px' }} className="mono">{h.liveWeight.toFixed(2)}%</td>
                  <td style={{ padding: '16px 12px', color: 'var(--color-text-tertiary)' }} className="mono">{h.targetWeight}%</td>
                  <td style={{ padding: '16px 12px' }}>
                    <div style={{ 
                      display: 'inline-block', 
                      padding: '4px 8px', 
                      borderRadius: '4px', 
                      fontSize: '0.75rem',
                      background: Math.abs(h.liveWeight - h.targetWeight) < 2 ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.1)',
                      color: Math.abs(h.liveWeight - h.targetWeight) < 2 ? 'var(--color-positive)' : '#f59e0b'
                    }}>
                      {Math.abs(h.liveWeight - h.targetWeight) < 2 ? 'On Track' : 'Rebalance'}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <style>{`
        .tab-btn {
          background: transparent;
          border: 1px solid rgba(255,255,255,0.1);
          color: var(--color-text-secondary);
          padding: 8px 16px;
          border-radius: 6px;
          cursor: pointer;
          font-size: 0.85rem;
          transition: all 0.2s;
        }
        .tab-btn.active {
          background: rgba(37, 99, 235, 0.1);
          border-color: var(--color-accent);
          color: var(--color-text-primary);
        }
      `}</style>
    </div>
  );
};

const KPICard = ({ title, value, subValue, icon, trend }) => (
  <div className="glass-panel" style={{ padding: '24px', minWidth: '240px', borderLeft: `4px solid ${trend === 'up' ? 'var(--color-positive)' : trend === 'down' ? 'var(--color-negative)' : 'var(--color-accent)'}` }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-text-tertiary)', fontSize: '0.8rem', marginBottom: '12px' }}>
      {icon}
      <span>{title}</span>
    </div>
    <div style={{ fontSize: '1.8rem', fontWeight: 600, marginBottom: '4px' }}>{value}</div>
    {subValue && <div style={{ fontSize: '0.75rem', color: 'var(--color-text-tertiary)' }}>{subValue}</div>}
  </div>
);

const MiniMetric = ({ title, value, icon, highlight }) => (
  <div className="glass-panel" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
    <div style={{ padding: '10px', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', color: highlight || 'var(--color-accent-light)' }}>
      {icon}
    </div>
    <div>
      <div style={{ fontSize: '0.75rem', color: 'var(--color-text-tertiary)', marginBottom: '4px' }}>{title}</div>
      <div className="mono" style={{ fontSize: '1.1rem', fontWeight: 600, color: highlight || 'inherit' }}>{value}</div>
    </div>
  </div>
);

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="glass-panel" style={{ padding: '12px', border: '1px solid var(--color-accent-light)', minWidth: '180px' }}>
        <p style={{ margin: '0 0 8px 0', fontSize: '0.85rem', color: 'var(--color-text-secondary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Calendar size={12} />
          {new Date(label).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '16px' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--color-text-primary)' }}>Portfolio:</span>
            <span className="mono" style={{ fontWeight: 600, color: 'var(--color-accent-light)' }}>
              {payload[0].value > 0 ? '+' : ''}{payload[0].value.toFixed(2)}%
            </span>
          </div>
          {payload[1] && (
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '16px' }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--color-text-tertiary)' }}>Benchmark:</span>
              <span className="mono" style={{ fontWeight: 600, color: 'var(--color-text-tertiary)' }}>
                {payload[1].value > 0 ? '+' : ''}{payload[1].value.toFixed(2)}%
              </span>
            </div>
          )}
        </div>
      </div>
    );
  }
  return null;
};

const ALLOC_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6'];

export default PerformanceDashboard;
