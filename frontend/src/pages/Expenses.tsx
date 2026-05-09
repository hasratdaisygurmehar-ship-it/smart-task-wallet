import { PieChart, Pie, Cell, BarChart, Bar, XAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { Wallet, TrendingUp, DollarSign, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import type { Bill } from '../types';

const categoryData: any[] = [];
const monthlyData: any[] = [];

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    return (
      <div style={{ background: 'rgba(15, 23, 42, 0.9)', padding: '12px', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}>
        <p style={{ color: '#fff', fontWeight: 600 }}>{`${payload[0].name}: ${payload[0].value}`}</p>
      </div>
    );
  }
  return null;
};

interface ExpensesProps {
  loggedExpenses: Bill[];
  budget: number;
}

export default function Expenses({ loggedExpenses, budget }: ExpensesProps) {
  const totalSpent = loggedExpenses.reduce((acc, curr) => {
    const val = parseFloat(curr.amount.replace('$', '').replace(',', '')) || 0;
    return acc + val;
  }, 0);

  const remaining = Math.max(budget - totalSpent, 0);

  return (
    <div className="animate-fade-in" style={{ paddingBottom: '100px' }}>
      <header className="section-header" style={{ padding: '0 1.5rem', marginTop: '1rem' }}>
        <h2>Analytics & Reports</h2>
        <span className="badge">{new Date().toLocaleString('default', { month: 'long' })} {new Date().getFullYear()}</span>
      </header>

      <div className="dashboard-grid" style={{ padding: '0 1.5rem' }}>
        {/* Left Column */}
        <div className="dashboard-column">
          {/* Top KPI Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="glass-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <p className="text-secondary text-sm">Monthly Spend</p>
                  <h3 style={{ fontSize: '1.8rem', marginTop: '4px' }}>{totalSpent.toLocaleString(undefined, { minimumFractionDigits: 2 })}</h3>
                </div>
                <div style={{ background: 'rgba(236, 72, 153, 0.2)', padding: '8px', borderRadius: '50%' }}>
                  <DollarSign size={20} color="#ec4899" />
                </div>
              </div>
              <p className="text-sm mt-4" style={{ display: 'flex', alignItems: 'center', color: '#94a3b8' }}>
                No comparison data yet
              </p>
            </div>
            
            <div className="glass-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <p className="text-secondary text-sm">Remaining Budget</p>
                  <h3 style={{ fontSize: '1.8rem', marginTop: '4px' }}>{remaining.toLocaleString(undefined, { minimumFractionDigits: 2 })}</h3>
                </div>
                <div style={{ background: 'rgba(16, 185, 129, 0.2)', padding: '8px', borderRadius: '50%' }}>
                  <Wallet size={20} color="#10b981" />
                </div>
              </div>
              <p className="text-sm mt-4" style={{ display: 'flex', alignItems: 'center', color: '#10b981' }}>
                On track
              </p>
            </div>
          </div>

          {/* Bar Chart - Monthly Trends */}
          <div className="glass-card mt-4">
            <h3 style={{ marginBottom: '1.5rem', fontSize: '1.1rem' }}>Spending Trends</h3>
            {totalSpent > 0 ? (
              <div style={{ width: '100%', height: 250 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={[{ name: new Date().toLocaleString('default', { month: 'short' }), amount: totalSpent }]}>
                    <XAxis dataKey="name" stroke="#94a3b8" axisLine={false} tickLine={false} />
                    <Tooltip cursor={{ fill: 'rgba(255,255,255,0.05)' }} content={<CustomTooltip />} />
                    <Bar dataKey="amount" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div style={{ height: 250, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' }}>
                No spending data available for this month.
              </div>
            )}
          </div>
        </div>

        {/* Right Column */}
        <div className="dashboard-column">
          {/* Pie Chart - Categories */}
          <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', minHeight: '300px' }}>
            <h3 style={{ marginBottom: '1rem', fontSize: '1.1rem' }}>Category Breakdown</h3>
            {totalSpent > 0 ? (
              <>
                <div style={{ width: '100%', height: 200, display: 'flex', justifyContent: 'center' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={[{ name: 'General', value: totalSpent, color: '#8b5cf6' }]}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        <Cell fill="#8b5cf6" />
                      </Pie>
                      <Tooltip content={<CustomTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                   <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#8b5cf6' }}></div>
                      <span className="text-sm">General Expenses</span>
                    </div>
                    <span className="font-medium">{totalSpent.toFixed(2)}</span>
                  </div>
                </div>
              </>
            ) : (
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)', textAlign: 'center' }}>
                Log expenses to see category breakdown.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
