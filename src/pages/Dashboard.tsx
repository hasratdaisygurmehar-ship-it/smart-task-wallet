import { Calendar, CheckCircle2, Circle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import type { Task, Bill, Account, Transaction } from '../types';
import { CreditCard, Landmark, Banknote, PiggyBank } from 'lucide-react';

interface DashboardProps {
  tasks: Task[];
  bills: Bill[];
  loggedExpenses: Bill[];
  accounts: Account[];
  transactions: Transaction[];
  budget: number;
  onToggleTask: (id: number) => void;
  onLogBill: (bill: Bill) => void;
}

export default function Dashboard({ tasks, bills, loggedExpenses, accounts, transactions, budget, onToggleTask, onLogBill }: DashboardProps) {
  const navigate = useNavigate();
  const today = format(new Date(), 'yyyy-MM-dd');
  
  // Filter for Today's tasks (today's tasks + overdue undone tasks)
  const todaysTasks = tasks.filter(task => {
    const isToday = task.date === today;
    const isOverdueUndone = task.date < today && !task.done;
    return isToday || isOverdueUndone;
  });

  const totalSpent = loggedExpenses.reduce((acc, curr) => {
    const val = parseFloat(curr.amount.replace('$', '').replace(',', '')) || 0;
    return acc + val;
  }, 0) + transactions.filter(t => t.type === 'Expense').reduce((acc, curr) => acc + curr.amount, 0);

  const monthlyBudget = budget;
  const progress = Math.min((totalSpent / monthlyBudget) * 100, 100);

  return (
    <main className="dashboard-grid animate-fade-in" style={{ paddingBottom: '100px' }}>
      {/* Left Column: Tasks and Overview */}
      <div className="dashboard-column">
        <section className="glass-panel main-content">
          <div className="section-header">
            <h2>Expense Summary</h2>
            <span className="badge">{format(new Date(), 'MMMM')}</span>
          </div>

          <div className="accounts-mini-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '10px', marginBottom: '20px' }}>
            {accounts.filter(acc => acc.id !== '1' && acc.id !== '2').map(acc => (
              <div key={acc.id} className="glass-card-compact" style={{ padding: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  {acc.type === 'Bank' && <Landmark size={14} className="text-accent-primary" />}
                  {acc.type === 'Card' && <CreditCard size={14} className="text-accent-primary" />}
                  {acc.type === 'Cash' && <Banknote size={14} className="text-accent-primary" />}
                  {acc.type === 'Savings' && <PiggyBank size={14} className="text-accent-primary" />}
                  <span className="text-xs text-secondary">{acc.name}</span>
                </div>
                <p className="font-bold">{acc.balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
              </div>
            ))}
          </div>
          
          <div className="expense-overview">
            <div className="expense-total">
              <span className="text-secondary">Total Spent</span>
              <h3 className="stat-value">{totalSpent.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h3>
              <div className="progress-bar-container">
                <div className="progress-bar" style={{ width: `${progress}%` }}></div>
              </div>
              <span className="text-secondary text-sm">{Math.round(progress)}% of monthly budget ({monthlyBudget.toLocaleString()})</span>
            </div>
          </div>
        </section>

        <section className="glass-panel mt-4 main-content">
          <div className="section-header">
            <h2>Today's Tasks</h2>
            <button className="text-btn" onClick={() => navigate('/calendar')}>View All</button>
          </div>
          <div className="task-list">
            {todaysTasks.map(task => (
              <div 
                key={task.id} 
                className="glass-card task-item clickable"
                onClick={() => onToggleTask(task.id)}
              >
                <div className="task-status">
                  {task.done ? <CheckCircle2 className="text-success" /> : <Circle className="text-pending" />}
                </div>
                <div className="task-info">
                  <p className={`task-title ${task.done ? 'strikethrough' : ''}`}>{task.title}</p>
                  <div className="task-meta">
                    <span className="badge-time">{task.time} • {task.date}</span>
                    {task.priority === 'High' && <span className="badge-priority high">High Priority</span>}
                    {task.recurring && <span className="badge-priority info">Recurring</span>}
                  </div>
                </div>
              </div>
            ))}
            {tasks.length === 0 && (
              <p className="text-secondary" style={{ textAlign: 'center', padding: '2rem 0' }}>No tasks found. Add a new one!</p>
            )}
          </div>
        </section>
      </div>

      {/* Right Column: Bills and Calendar */}
      <div className="dashboard-column">
        <section className="glass-panel main-content">
          <div className="section-header">
            <h2>Upcoming Bills</h2>
            <button className="icon-btn-small" onClick={() => navigate('/calendar')}>
              <Calendar size={20} className="text-accent-primary" />
            </button>
          </div>
          <div className="bill-list">
            {bills.map(bill => (
              <div
                key={bill.id}
                className={`glass-card bill-item clickable ${bill.status === 'Paid' ? 'completed' : ''}`}
                onClick={() => bill.status !== 'Paid' && onLogBill(bill)}
              >
                <div className="bill-info">
                  <h4>{bill.name}</h4>
                  <p className="text-secondary text-sm">Due: {bill.dueDate}</p>
                </div>
                <div className="bill-amount">
                  <span className="amount">{bill.amount}</span>
                  {bill.status === 'Paid' && <span className="status-badge paid">Logged</span>}
                </div>
              </div>
            ))}
            {bills.length === 0 && (
              <p className="text-secondary" style={{ textAlign: 'center', padding: '2rem 0' }}>No bills pending.</p>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
