import { LogOut, Wallet } from 'lucide-react';

interface SettingsProps {
  budget: number;
  onUpdateBudget: (val: number) => void;
  onLogout: () => void;
  currentUser: any;
}

export default function Settings({ budget, onUpdateBudget, onLogout, currentUser }: SettingsProps) {
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
