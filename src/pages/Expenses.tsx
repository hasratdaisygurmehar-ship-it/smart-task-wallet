import { useState } from 'react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { Wallet, DollarSign, ArrowDownRight, ArrowUpRight, Clock, Plus, X } from 'lucide-react';
import type { Bill, Transaction, Account } from '../types';
import { format } from 'date-fns';

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
  transactions: Transaction[];
  accounts: Account[];
  budget: number;
  onAddTransaction: (accountId: string, amount: number, description: string, category: string, type: 'Expense' | 'Income') => void;
}

export default function Expenses({ loggedExpenses, transactions, accounts, budget, onAddTransaction }: ExpensesProps) {
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [manualAmount, setManualAmount] = useState('');
  const [manualDescription, setManualDescription] = useState('');
  const [manualCategory, setManualCategory] = useState('General');

  const totalSpent = loggedExpenses.reduce((acc, curr) => {
    const val = parseFloat(curr.amount.replace('$', '').replace(',', '')) || 0;
    return acc + val;
  }, 0) + transactions.filter(t => t.type === 'Expense').reduce((acc, curr) => acc + curr.amount, 0);

  const remaining = Math.max(budget - totalSpent, 0);

  const handleAddExpense = () => {
    const amount = parseFloat(manualAmount);
    if (isNaN(amount) || amount <= 0) {
      alert('Please enter a valid amount');
      return;
    }
    if (!manualDescription.trim()) {
      alert('Please enter a description');
      return;
    }

    if (accounts.length > 0) {
      onAddTransaction(accounts[0].id, amount, manualDescription, manualCategory, 'Expense');
    }
    setIsManualModalOpen(false);
    setManualAmount('');
    setManualDescription('');
    setManualCategory('General');
  };

  return (
    <div className="animate-fade-in" style={{ paddingBottom: '100px' }}>
      <header className="section-header" style={{ padding: '0 1.5rem', marginTop: '1rem' }}>
        <h2>Analytics & Reports</h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <button className="glass-btn-small" onClick={() => setIsManualModalOpen(true)}>
            <Plus size={16} />
            Add Expense
          </button>
          <span className="badge">{new Date().toLocaleString('default', { month: 'long' })} {new Date().getFullYear()}</span>
        </div>
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

      {/* Transaction History Section */}
      <div style={{ padding: '1.5rem' }}>
        <section className="glass-panel main-content">
          <div className="section-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Clock size={20} className="text-accent-secondary" />
              <h2>Transaction History</h2>
            </div>
            <span className="text-secondary text-sm">{transactions.length} Total</span>
          </div>

          <div className="transaction-list" style={{ marginTop: '1rem' }}>
            {transactions.length > 0 ? (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ textAlign: 'left', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                      <th style={{ padding: '12px', color: 'var(--text-secondary)', fontWeight: 500, fontSize: '0.85rem' }}>Description</th>
                      <th style={{ padding: '12px', color: 'var(--text-secondary)', fontWeight: 500, fontSize: '0.85rem' }}>Account</th>
                      <th style={{ padding: '12px', color: 'var(--text-secondary)', fontWeight: 500, fontSize: '0.85rem' }}>Date</th>
                      <th style={{ padding: '12px', color: 'var(--text-secondary)', fontWeight: 500, fontSize: '0.85rem', textAlign: 'right' }}>Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.map(tx => {
                      const account = accounts.find(a => a.id === tx.accountId);
                      return (
                        <tr key={tx.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                          <td style={{ padding: '12px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                              {tx.type === 'Expense' ? <ArrowDownRight size={16} color="#ef4444" /> : <ArrowUpRight size={16} color="#10b981" />}
                              <div>
                                <p style={{ fontWeight: 500 }}>{tx.description}</p>
                                <span className="text-xs text-secondary">{tx.category}</span>
                              </div>
                            </div>
                          </td>
                          <td style={{ padding: '12px' }}>
                            <span className="badge-small">{account?.name || 'Unknown'}</span>
                          </td>
                          <td style={{ padding: '12px', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                            {format(new Date(tx.date), 'MMM dd, HH:mm')}
                          </td>
                          <td style={{ padding: '12px', textAlign: 'right', fontWeight: 600, color: tx.type === 'Expense' ? '#fff' : '#10b981' }}>
                            {tx.type === 'Expense' ? '-' : '+'}{tx.amount.toFixed(2)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '3rem' }}>
                <p className="text-secondary">No transactions recorded yet.</p>
              </div>
            )}
          </div>
        </section>
      </div>

      {/* Manual Entry Modal */}
      {isManualModalOpen && (
        <div className="modal-overlay animate-fade-in">
          <div className="glass-panel modal-content animate-fade-in-up" style={{ maxWidth: '500px' }}>
            <div className="modal-header">
              <h3>Add Expense</h3>
              <button className="icon-btn-small" onClick={() => { setIsManualModalOpen(false); setManualAmount(''); setManualDescription(''); setManualCategory('General'); }}>
                <X size={20} />
              </button>
            </div>

            <div className="modal-body">
              <p className="text-secondary text-sm mb-4">
                Enter expense details manually.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <input
                  type="text"
                  className="smart-input"
                  placeholder="Description"
                  value={manualDescription}
                  onChange={(e) => setManualDescription(e.target.value)}
                />
                <input
                  type="number"
                  className="smart-input"
                  placeholder="Amount"
                  value={manualAmount}
                  onChange={(e) => setManualAmount(e.target.value)}
                  step="0.01"
                />
                <select
                  className="smart-input"
                  value={manualCategory}
                  onChange={(e) => setManualCategory(e.target.value)}
                >
                  <option value="General">General</option>
                  <option value="Food">Food</option>
                  <option value="Transportation">Transportation</option>
                  <option value="Entertainment">Entertainment</option>
                  <option value="Utilities">Utilities</option>
                  <option value="Shopping">Shopping</option>
                  <option value="Health">Health</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>

            <div className="modal-actions mt-4">
              <button className="glass-btn-secondary" onClick={() => { setIsManualModalOpen(false); setManualAmount(''); setManualDescription(''); setManualCategory('General'); }}>
                Cancel
              </button>
              <button
                className="glass-btn"
                onClick={handleAddExpense}
                disabled={!manualAmount || !manualDescription}
              >
                Add Expense
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
