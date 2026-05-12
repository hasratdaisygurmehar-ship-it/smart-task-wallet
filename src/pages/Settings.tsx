import { LogOut, Wallet, Trash2, RotateCcw } from 'lucide-react';
import type { Task } from '../types';

interface SettingsProps {
  budget: number;
  tasks: Task[];
  onUpdateBudget: (val: number) => void;
  onDeleteTask: (taskId: number) => void;
  onLogout: () => void | Promise<void>;
  currentUser: any;
}

export default function Settings({ budget, tasks, onUpdateBudget, onDeleteTask, onLogout, currentUser }: SettingsProps) {

  return (
    <div className="main-content animate-fade-in" style={{ paddingBottom: '100px' }}>
      <header className="section-header">
        <h2>Settings</h2>
      </header>

      {/* Profile Section */}
      <section className="glass-panel" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
        <div style={{ width: '60px', height: '60px', borderRadius: '50%', overflow: 'hidden', border: '2px solid var(--accent-primary)' }}>
          <img src={currentUser?.avatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=default'} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        </div>
        <div>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 600 }}>{currentUser?.name || 'User'}</h3>
          <p className="text-secondary text-sm" style={{ marginTop: '4px' }}>{currentUser?.email || 'user@example.com'}</p>
        </div>
      </section>

      {/* Budget Settings */}
      <section className="glass-panel" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
          <Wallet size={20} className="text-accent-primary" />
          <h3 style={{ fontSize: '1.1rem', fontWeight: 600 }}>Monthly Budget</h3>
        </div>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <input 
            type="number" 
            className="smart-input" 
            style={{ margin: 0, minHeight: 'auto', padding: '10px 15px' }}
            value={budget}
            onChange={(e) => onUpdateBudget(Number(e.target.value))}
          />
          <span className="text-secondary">Amount</span>
        </div>
      </section>

      {/* All Tasks Management */}
      <section className="glass-panel" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
          <RotateCcw size={20} className="text-accent-primary" />
          <h3 style={{ fontSize: '1.1rem', fontWeight: 600 }}>All Tasks</h3>
          <span className="badge">{tasks.length}</span>
        </div>

        <div className="task-list">
          {tasks.length > 0 ? (
            tasks.map(task => (
              <div key={task.id} className="glass-card task-item">
                <div className="task-status">
                  <div style={{
                    background: task.done
                      ? 'rgba(16, 185, 129, 0.2)'
                      : 'rgba(59, 130, 246, 0.2)',
                    padding: '6px',
                    borderRadius: '50%'
                  }}>
                    <RotateCcw size={18} color={task.done ? "#10b981" : "#3b82f6"} />
                  </div>
                </div>
                <div className="task-info" style={{ flex: 1 }}>
                  <p className={`task-title ${task.done ? 'strikethrough' : ''}`}>
                    {task.title}
                  </p>
                  <div className="task-meta">
                    <span className="badge-time">{task.time} • {task.date}</span>
                    <span className={`badge-priority ${task.done ? 'info' : 'high'}`}>
                      {task.done ? 'Completed' : 'Pending'}
                    </span>
                    {task.recurring && (
                      <span className="badge-priority" style={{ background: 'rgba(245, 158, 11, 0.2)', color: '#f59e0b' }}>
                        Recurring
                      </span>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => onDeleteTask(task.id)}
                  style={{
                    background: 'rgba(239, 68, 68, 0.1)',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                    color: 'var(--danger)',
                    padding: '8px',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                  className="icon-btn-small"
                  title="Delete task permanently"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))
          ) : (
            <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
              No tasks created yet.
            </div>
          )}
        </div>
      </section>

      {/* Completed Tasks Management */}
      <section className="glass-panel" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
          <RotateCcw size={20} className="text-accent-primary" />
          <h3 style={{ fontSize: '1.1rem', fontWeight: 600 }}>Completed Tasks</h3>
        </div>

        <div className="task-list">
          {tasks.filter(task => task.done).length > 0 ? (
            tasks.filter(task => task.done).map(task => (
              <div key={task.id} className="glass-card task-item" style={{ opacity: 0.8 }}>
                <div className="task-status">
                  <div style={{ background: 'rgba(16, 185, 129, 0.2)', padding: '6px', borderRadius: '50%' }}>
                    <RotateCcw size={18} color="#10b981" />
                  </div>
                </div>
                <div className="task-info" style={{ flex: 1 }}>
                  <p className="task-title" style={{ textDecoration: 'line-through', color: 'var(--text-secondary)' }}>
                    {task.title}
                  </p>
                  <div className="task-meta">
                    <span className="badge-time">{task.time} • {task.date}</span>
                    {task.recurring && (
                      <span className="badge-priority info" style={{ background: 'rgba(59, 130, 246, 0.2)', color: '#3b82f6' }}>
                        Recurring
                      </span>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => onDeleteTask(task.id)}
                  style={{
                    background: 'rgba(239, 68, 68, 0.1)',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                    color: 'var(--danger)',
                    padding: '8px',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                  className="icon-btn-small"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))
          ) : (
            <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
              No completed tasks yet.
            </div>
          )}
        </div>
      </section>

      {/* App Settings */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {/* Logout Only in this section */}
        <button 
          className="glass-card" 
          onClick={onLogout}
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', width: '100%', cursor: 'pointer', border: '1px solid rgba(239, 68, 68, 0.3)', color: 'var(--danger)', background: 'rgba(239, 68, 68, 0.05)' }}
        >
          <LogOut size={20} />
          <span style={{ fontWeight: 600 }}>Log Out</span>
        </button>
      </div>
    </div>
  );
}
