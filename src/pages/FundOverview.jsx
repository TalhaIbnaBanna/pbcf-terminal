import React from 'react';
import { Target, Activity, DollarSign, TrendingUp, ShieldCheck, Briefcase, Scale, Landmark, Users, Layers, FileText } from 'lucide-react';
import { useSheetData } from '../hooks/useSheetData';

const FundOverview = () => {
  const { data, loading, error } = useSheetData();

  if (loading) return <div style={{ padding: '48px' }}>Loading overview...</div>;
  if (error) return <div style={{ padding: '48px', color: 'var(--color-negative)' }}>Error loading data: {error}</div>;

  const metrics = data?.fundMetrics || {
    aum: '$100K',
    expectedReturn: '9.16%',
    targetVol: '12-13%',
    targetSharpe: '0.70',
    expenseRatio: '1.55%'
  };

  return (
    <div className="page-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '48px', animation: 'fadeIn 0.5s ease' }}>
      
      {/* Hero Section */}
      <section className="hero glass-panel" style={heroStyle}>
        <div style={{ maxWidth: '800px' }}>
          <h1 className="text-gradient" style={{ fontSize: '3.5rem', marginBottom: '16px', letterSpacing: '-1px' }}>
            Pinnacle Balanced Open-End Fund
          </h1>
          <p style={{ fontSize: '1.25rem', color: 'var(--color-text-secondary)', marginBottom: '32px' }}>
            A meticulously engineered 40/40/20 allocation designed for current income and long-term capital appreciation.
          </p>
          <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
            <div style={badgeStyle}>
              <span style={{ color: 'var(--color-text-tertiary)' }}>Inception</span>
              <span className="mono">May 1, 2026</span>
            </div>
            <div style={badgeStyle}>
              <span style={{ color: 'var(--color-text-tertiary)' }}>Ticker</span>
              <span className="mono" style={{ color: 'var(--color-accent-light)' }}>PBCF</span>
            </div>
          </div>
        </div>
      </section>

      {/* Target Metrics */}
      <section className="section-distinct" style={{ marginTop: 0, paddingTop: 0 }}>
        <h2 className="section-header">Target Metrics</h2>
        <div className="grid-4">
          <MetricCard icon={<DollarSign />} title="Target AUM" value={metrics.aum} />
          <MetricCard icon={<TrendingUp />} title="Net Expected Return" value={metrics.expectedReturn} />
          <MetricCard icon={<Target />} title="Sharpe Ratio" value={metrics.targetSharpe} />
          <MetricCard icon={<Activity />} title="Target Volatility" value={metrics.targetVol} />
        </div>
      </section>

      {/* Strategy & Allocation */}
      <section className="section-distinct section-bg-1">
        <h2 className="section-header">Fund Strategy & Profile</h2>
        <div className="grid-2">
          <div className="glass-panel card-hover" style={{ padding: '32px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
              <Briefcase color="var(--color-accent)" />
              <h3>Strategic Allocation</h3>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <AllocationRow color="var(--color-alloc-fixed)" title="Fixed Income" weight="40%" desc="Core stability and steady yield generation." />
              <AllocationRow color="var(--color-alloc-bluechip)" title="Blue-Chip Equity" weight="40%" desc="Dividend growth and defensive market positioning." />
              <AllocationRow color="var(--color-alloc-growth)" title="Growth Equity" weight="20%" desc="High-conviction tech and innovation exposure." />
            </div>
          </div>

          <div className="glass-panel card-hover" style={{ padding: '32px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
              <ShieldCheck color="var(--color-positive)" />
              <h3>Fund Characteristics</h3>
            </div>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <li style={listItemStyle}><strong>Total Expense Ratio:</strong> <span className="mono">{metrics.expenseRatio}</span></li>
              <li style={listItemStyle}><strong>Load:</strong> None (No-load fund)</li>
              <li style={listItemStyle}><strong>Distributions:</strong> Quarterly</li>
              <li style={listItemStyle}><strong>DRIP:</strong> Available</li>
            </ul>
          </div>
        </div>
      </section>

      {/* Administration & Governance */}
      <section className="section-distinct section-bg-2">
        <h2 className="section-header">Administration & Governance</h2>
        <div className="grid-3">
          
          <div className="glass-panel card-hover" style={{ padding: '32px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
              <Scale color="var(--color-accent)" />
              <h3>Legal Framework</h3>
            </div>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <li style={listItemStyle}><strong>Registration:</strong> <span>Inv. Co. Act of 1940</span></li>
              <li style={listItemStyle}><strong>Legal Structure:</strong> <span>Delaware Statutory Trust</span></li>
              <li style={listItemStyle}><strong>Compliance:</strong> <span>Rule 17j-1 (SEC)</span></li>
              <li style={listItemStyle}><strong>Management:</strong> <span style={{ textAlign: 'right' }}>Pinnacle Capital Mgmt LLC</span></li>
            </ul>
          </div>

          <div className="glass-panel card-hover" style={{ padding: '32px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
              <Users color="var(--color-alloc-growth)" />
              <h3>Governance Snapshot</h3>
            </div>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <li style={listItemStyle}><strong>Oversight:</strong> <span>Independent Board Review</span></li>
              <li style={listItemStyle}><strong>Voting Rights:</strong> <span>1 Share = 1 Vote</span></li>
              <li style={listItemStyle}><strong>Valuation:</strong> <span>Priced Daily at Fair Value</span></li>
              <li style={listItemStyle}><strong>Fee Protection:</strong> <span>High-Water Mark</span></li>
            </ul>
          </div>

          <div className="glass-panel card-hover" style={{ padding: '32px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
              <Landmark color="var(--color-positive)" />
              <h3>Tax Highlights</h3>
            </div>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <li style={listItemStyle}><strong>Status:</strong> <span>RIC-Qualified</span></li>
              <li style={listItemStyle}><strong>Tax Code:</strong> <span>Subchapter M</span></li>
              <li style={listItemStyle}><strong>Tax Rate:</strong> <span>Subject to 0-20% Rate</span></li>
            </ul>
          </div>

        </div>
      </section>

      {/* Operations & Management */}
      <section className="section-distinct section-bg-3">
        <h2 className="section-header">Operations & Management</h2>
        <div className="grid-3">

          <div className="glass-panel card-hover" style={{ padding: '32px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
              <Layers color="var(--color-alloc-fixed)" />
              <h3>Open-End Share Structure</h3>
            </div>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <li style={listItemStyle}><strong>Share Count:</strong> <span>Variable</span></li>
              <li style={listItemStyle}><strong>Issuance:</strong> <span style={{ textAlign: 'right' }}>New investment creates shares</span></li>
              <li style={listItemStyle}><strong>Pricing & Redemption:</strong> <span>At NAV</span></li>
            </ul>
          </div>

          <div className="glass-panel card-hover" style={{ padding: '32px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
              <FileText color="var(--color-accent-light)" />
              <h3>Reporting & Review</h3>
            </div>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <li style={listItemStyle}><strong>Reporting:</strong> <span>Quarterly / Semi-Annual</span></li>
              <li style={listItemStyle}><strong>Next IPS Review:</strong> <span>1Q27</span></li>
            </ul>
          </div>

          <div className="glass-panel card-hover" style={{ padding: '32px', background: 'linear-gradient(145deg, rgba(37, 99, 235, 0.1) 0%, rgba(20, 20, 28, 0.4) 100%)', borderLeft: '4px solid var(--color-accent)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
              <Users color="var(--color-text-primary)" />
              <h3>Fund Managers</h3>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {['Talha Ibna Banna', 'Sarwar Hossain Khan', 'Fariha Binte Ali Afrin', 'Nabiha Nuha', 'Raiyan Razi Rahman'].map(name => (
                <div key={name} style={{ ...listItemStyle, background: 'transparent', borderBottom: '1px solid rgba(255,255,255,0.05)', borderRadius: 0, padding: '8px 4px' }}>
                  <span style={{ fontWeight: 500, color: 'var(--color-text-primary)' }}>{name}</span>
                </div>
              ))}
            </div>
          </div>

        </div>
      </section>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};

const heroStyle = {
  padding: '64px 48px',
  marginTop: '24px',
  background: 'linear-gradient(145deg, rgba(31, 31, 46, 0.8) 0%, rgba(20, 20, 28, 0.4) 100%)',
  borderLeft: '4px solid var(--color-accent)'
};

const badgeStyle = {
  display: 'flex',
  flexDirection: 'column',
  background: 'rgba(0,0,0,0.3)',
  padding: '8px 16px',
  borderRadius: 'var(--radius-md)',
  fontSize: '0.85rem'
};

const gridStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
  gap: '24px'
};

const MetricCard = ({ icon, title, value }) => (
  <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '12px', transition: 'transform var(--transition-fast)' }}
       onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-4px)'}
       onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}>
    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: 'var(--color-text-secondary)' }}>
      {React.cloneElement(icon, { size: 20, color: 'var(--color-accent-light)' })}
      <span style={{ fontSize: '0.9rem', fontWeight: 500 }}>{title}</span>
    </div>
    <div className="mono text-gradient" style={{ fontSize: '2rem', fontWeight: 600 }}>
      {value}
    </div>
  </div>
);

const AllocationRow = ({ color, title, weight, desc }) => (
  <div style={{ display: 'flex', gap: '16px' }}>
    <div style={{ width: '4px', background: color, borderRadius: '4px' }}></div>
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
        <h4 style={{ margin: 0 }}>{title}</h4>
        <span className="mono" style={{ color: 'var(--color-text-secondary)' }}>{weight}</span>
      </div>
      <p style={{ fontSize: '0.85rem', color: 'var(--color-text-tertiary)', margin: 0 }}>{desc}</p>
    </div>
  </div>
);

const listItemStyle = {
  padding: '12px 16px',
  background: 'rgba(255,255,255,0.03)',
  borderRadius: 'var(--radius-sm)',
  display: 'flex',
  justifyContent: 'space-between',
  fontSize: '0.95rem'
};

export default FundOverview;
