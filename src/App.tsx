import { useState, useEffect, useRef } from 'react';
import { format } from 'date-fns';
import * as chrono from 'chrono-node';

import type { User as SupabaseUser } from '@supabase/supabase-js';
import { isSupabaseConfigured, supabase } from './lib/supabase';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { Calendar, Plus, Wallet, Home, User, Settings, Zap, X } from 'lucide-react';
import Dashboard from './pages/Dashboard';
import CalendarView from './pages/CalendarView';
import Expenses from './pages/Expenses';
import SettingsView from './pages/Settings';
import type {
  Task,
  Bill,
  Account,
  Transaction,
  AppUser,
  PersistedUserData,
  PersistedUserDataInput,
} from './types';
import './App.css';

const DEFAULT_BUDGET = 5000;

const getDefaultAccounts = (): Account[] => [
  { id: '1', name: 'Main Bank', balance: 5000, type: 'Bank' },
  { id: '2', name: 'Cash', balance: 500, type: 'Cash' },
];

const emptyUserData = (): PersistedUserData => ({
  budget: DEFAULT_BUDGET,
  tasks: [],
  bills: [],
  loggedExpenses: [],
  accounts: getDefaultAccounts(),
  transactions: [],
});

const normalizePersistedUserData = (
  source?: PersistedUserDataInput,
  fallbackOverrides?: Partial<PersistedUserData>,
): PersistedUserData => {
  const base = {
    ...emptyUserData(),
    ...fallbackOverrides,
  };

  return {
    budget: typeof source?.budget === 'number' && Number.isFinite(source.budget)
      ? source.budget
      : base.budget,
    tasks: Array.isArray(source?.tasks) ? source.tasks : base.tasks,
    bills: Array.isArray(source?.bills) ? source.bills : base.bills,
    loggedExpenses: Array.isArray(source?.loggedExpenses) ? source.loggedExpenses : base.loggedExpenses,
    accounts: Array.isArray(source?.accounts) && source.accounts.length > 0 ? source.accounts : base.accounts,
    transactions: Array.isArray(source?.transactions) ? source.transactions : base.transactions,
  };
};

const storageKey = (field: keyof PersistedUserData, userId: string) => `${field}_${userId}`;

const loadLocalUserData = (userId: string): PersistedUserData => {
  const fallback = emptyUserData();

  const readJson = <T,>(field: keyof PersistedUserData, fallbackValue: T): T => {
    const saved = localStorage.getItem(storageKey(field, userId));
    return saved ? JSON.parse(saved) : fallbackValue;
  };

  const savedBudget = localStorage.getItem(storageKey('budget', userId));

  return normalizePersistedUserData({
    budget: savedBudget ? Number(savedBudget) : fallback.budget,
    tasks: readJson('tasks', fallback.tasks),
    bills: readJson('bills', fallback.bills),
    loggedExpenses: readJson('loggedExpenses', fallback.loggedExpenses),
    accounts: readJson('accounts', fallback.accounts),
    transactions: readJson('transactions', fallback.transactions),
  });
};

const persistLocalUserData = (userId: string, data: PersistedUserData) => {
  localStorage.setItem(storageKey('budget', userId), data.budget.toString());
  localStorage.setItem(storageKey('tasks', userId), JSON.stringify(data.tasks));
  localStorage.setItem(storageKey('bills', userId), JSON.stringify(data.bills));
  localStorage.setItem(storageKey('loggedExpenses', userId), JSON.stringify(data.loggedExpenses));
  localStorage.setItem(storageKey('accounts', userId), JSON.stringify(data.accounts));
  localStorage.setItem(storageKey('transactions', userId), JSON.stringify(data.transactions));
};

const mapSupabaseUser = (user: SupabaseUser): AppUser => ({
  id: user.id,
  email: user.email ?? '',
  name:
    (typeof user.user_metadata?.name === 'string' && user.user_metadata.name) ||
    user.email?.split('@')[0] ||
    'User',
  avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.email ?? user.id}`,
});

function App() {
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [taskInput, setTaskInput] = useState('');
  const [isParsing, setIsParsing] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isAuthReady, setIsAuthReady] = useState(!isSupabaseConfigured);
  const [currentUser, setCurrentUser] = useState<AppUser | null>(() => {
    if (isSupabaseConfigured) return null;
    const saved = localStorage.getItem('currentUser');
    return saved ? JSON.parse(saved) : null;
  });

  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [manualAmount, setManualAmount] = useState('');
  const [manualDate, setManualDate] = useState(format(new Date(), 'yyyy-MM-dd'));

  // Task Structured States
  const [taskDate, setTaskDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [taskHour, setTaskHour] = useState('09');
  const [taskMinute, setTaskMinute] = useState('00');
  const [taskRepeat, setTaskRepeat] = useState('None');

  const navigate = useNavigate();
  const location = useLocation();

  const [budget, setBudget] = useState<number>(DEFAULT_BUDGET);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [bills, setBills] = useState<Bill[]>([]);
  const [loggedExpenses, setLoggedExpenses] = useState<Bill[]>([]);
  const [accounts, setAccounts] = useState<Account[]>(getDefaultAccounts);
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  const loadedUserId = useRef<string | null>(null);

  const syncToCloud = async (data: PersistedUserData) => {
    if (!currentUser || !supabase || loadedUserId.current !== currentUser.id) return;
    try {
      const { error } = await supabase
        .from('user_data')
        .upsert({ 
          id: currentUser.id, 
          data, 
          updated_at: new Date().toISOString() 
        });
      if (error) console.error('Cloud Sync Error:', error.message);
    } catch (err) {
      console.error('Cloud Sync Failed:', err);
    }
  };

  const loadFromCloud = async (userId: string): Promise<PersistedUserData | null> => {
    if (!supabase) return null;
    try {
      const { data, error } = await supabase
        .from('user_data')
        .select('data')
        .eq('id', userId)
        .single();
      
      if (error) {
        console.log('No cloud data found or error:', error.message);
        return null;
      }
      return normalizePersistedUserData(data?.data);
    } catch (err) {
      console.error('Failed to load from cloud:', err);
      return null;
    }
  };

  useEffect(() => {
    if (!supabase) return;
    const client = supabase;

    let isMounted = true;

    const restoreSession = async () => {
      const { data } = await client.auth.getSession();
      if (!isMounted) return;
      setCurrentUser(data.session?.user ? mapSupabaseUser(data.session.user) : null);
      setIsAuthReady(true);
    };

    restoreSession();

    const { data: authListener } = client.auth.onAuthStateChange((_event, session) => {
      setCurrentUser(session?.user ? mapSupabaseUser(session.user) : null);
      setIsAuthReady(true);
    });

    return () => {
      isMounted = false;
      authListener.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    const hydrateUserData = async () => {
      setIsInitialLoading(true);

      if (currentUser) {
        if (!isSupabaseConfigured) {
          localStorage.setItem('currentUser', JSON.stringify(currentUser));
        }

        const localData = loadLocalUserData(currentUser.id);
        const cloudData = await loadFromCloud(currentUser.id);
        const nextData = normalizePersistedUserData(cloudData, localData);

        setTasks(nextData.tasks);
        setBills(nextData.bills);
        setLoggedExpenses(nextData.loggedExpenses);
        setBudget(nextData.budget);
        setAccounts(nextData.accounts.length > 0 ? nextData.accounts : getDefaultAccounts());
        setTransactions(nextData.transactions);
        loadedUserId.current = currentUser.id;
        persistLocalUserData(currentUser.id, nextData);
        syncToCloud(nextData);
      } else {
        loadedUserId.current = null;
        const resetData = emptyUserData();
        setBudget(resetData.budget);
        setTasks(resetData.tasks);
        setBills(resetData.bills);
        setLoggedExpenses(resetData.loggedExpenses);
        setAccounts(resetData.accounts);
        setTransactions(resetData.transactions);
      }

      setIsInitialLoading(false);
    };

    if (isAuthReady) {
      hydrateUserData();
    }
  }, [currentUser, isAuthReady]);

  useEffect(() => { 
    if (currentUser && loadedUserId.current === currentUser.id) {
      const dataToSave: PersistedUserData = { tasks, bills, loggedExpenses, budget, accounts, transactions };

      persistLocalUserData(currentUser.id, dataToSave);
      syncToCloud(dataToSave);
    }
  }, [budget, tasks, bills, loggedExpenses, accounts, transactions, currentUser]);







  const calculateNextDate = (currentDate: string, frequency: string) => {
    const date = new Date(currentDate);
    if (isNaN(date.getTime())) return format(new Date(), 'yyyy-MM-dd');

    switch (frequency) {
      case 'Every Minute': {
        const next = new Date(); // In a real app we'd use a timer, but for now we'll just keep it on today
        return format(next, 'yyyy-MM-dd');
      }
      case 'Daily': {
        const next = new Date(date);
        next.setDate(next.getDate() + 1);
        return format(next, 'yyyy-MM-dd');
      }
      case 'Weekly': {
        const next = new Date(date);
        next.setDate(next.getDate() + 7);
        return format(next, 'yyyy-MM-dd');
      }
      case 'Monthly': {
        const next = new Date(date);
        next.setMonth(next.getMonth() + 1);
        return format(next, 'yyyy-MM-dd');
      }
      case 'Every 1st': {
        const next = new Date(date);
        next.setMonth(next.getMonth() + 1);
        next.setDate(1);
        return format(next, 'yyyy-MM-dd');
      }
      default:
        return currentDate;
    }
  };

  const handleLogout = async () => {
    if (supabase) {
      await supabase.auth.signOut();
    } else {
      setCurrentUser(null);
      localStorage.removeItem('currentUser');
    }
    navigate('/');
  };

  const getPath = (path: string) => location.pathname === path;

  const handleSmartTaskClick = () => {
    setShowAddMenu(false);
    setIsTaskModalOpen(true);
  };



  const handleManualEntryClick = () => {
    setShowAddMenu(false);
    setIsManualModalOpen(true);
  };

  const submitTask = async () => {
    if (!taskInput.trim()) return;
    setIsParsing(true);
    
    // Use chrono-node directly in the browser for NLP parsing
    const parsedResults = chrono.parse(taskInput);
    let detectedDate = taskDate;
    let detectedTime = `${taskHour}:${taskMinute}`;

    if (parsedResults.length > 0) {
      const result = parsedResults[0];
      if (result.start) {
        const d = result.start.date();
        detectedDate = format(d, 'yyyy-MM-dd');
        detectedTime = format(d, 'HH:mm');
      }
    }
    
    const newTask: Task = {
      id: Date.now(),
      title: taskInput,
      time: detectedTime,
      date: detectedDate,
      priority: taskInput.toLowerCase().includes('urgent') ? 'High' : 'Medium',
      done: false,
      recurring: taskRepeat !== 'None',
      repeatFrequency: taskRepeat !== 'None' ? taskRepeat : undefined
    };
    
    setTasks([newTask, ...tasks]);
    setIsTaskModalOpen(false);
    setTaskInput('');
    setIsParsing(false);
  };







  const submitManualExpense = () => {
    const expenseAmount = parseFloat(manualAmount);
    if (isNaN(expenseAmount) || expenseAmount <= 0) {
      alert('Please enter a valid amount');
      return;
    }

    if (accounts.length > 0) {
      addTransaction(accounts[0].id, expenseAmount, 'Expense', 'Expense', 'Expense');
    }
    setIsManualModalOpen(false);
    setManualAmount('');
    setManualDate(format(new Date(), 'yyyy-MM-dd'));
  };

  const toggleTask = (taskId: number) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    const isMarkingDone = !task.done;
    
    setTasks(prevTasks => {
      const updatedTasks = prevTasks.map(t => 
        t.id === taskId ? { ...t, done: isMarkingDone } : t
      );

      // If it's recurring and we just marked it as done, create the next occurrence
      if (isMarkingDone && task.recurring && task.repeatFrequency) {
        const nextDate = calculateNextDate(task.date, task.repeatFrequency);
        
        // Check if the next occurrence already exists to avoid duplicates
        const alreadyExists = updatedTasks.some(t => 
          t.title === task.title && t.date === nextDate && !t.done
        );

        if (!alreadyExists) {
          const nextTask: Task = {
            ...task,
            id: Date.now() + 1,
            date: nextDate,
            done: false
          };
          return [nextTask, ...updatedTasks];
        }
      }
      
      return updatedTasks;
    });
  };

  const deleteTask = (taskId: number) => {
    setTasks(prevTasks => prevTasks.filter(t => t.id !== taskId));
  };

  const addTransaction = (accountId: string, amount: number, description: string, category: string, type: 'Expense' | 'Income' = 'Expense') => {
    const newTransaction: Transaction = {
      id: Date.now(),
      accountId,
      amount,
      description,
      date: new Date().toISOString(),
      type,
      category
    };
    setTransactions(prev => [newTransaction, ...prev]);
    setAccounts(prev => prev.map(acc => 
      acc.id === accountId 
        ? { ...acc, balance: type === 'Expense' ? acc.balance - amount : acc.balance + amount }
        : acc
    ));
  };

  const logBill = (bill: Bill) => {
    setBills(bills.map(b => b.id === bill.id ? { ...b, status: 'Paid' } : b));
    setLoggedExpenses([bill, ...loggedExpenses]);
    if (accounts.length > 0) {
      const amount = parseFloat(bill.amount) || 0;
      addTransaction(accounts[0].id, amount, bill.name, 'General', 'Expense');
    }
  };

  // Temporarily bypass authentication for demo
  // if (!isAuthReady) {
  //   return <div className="auth-container"><div className="spinner"></div></div>;
  // }

  // if (!currentUser) {
  //   return <LoginPage onLogin={handleLogin} isCloudAuthEnabled={isSupabaseConfigured} />;
  // }

  return (
    <div className="app-container dark-theme">
      {/* Header */}
      <header className="glass-panel header-nav">
        <div className="logo-container">
          <div className="logo-icon"><Zap size={20} color="white" style={{margin: '6px'}}/></div>
          <h1>Smart Task Wallet</h1>
          {supabase ? (
            <span className="text-xs text-success ml-2" title="Cloud Sync Active">●</span>
          ) : (
            <span className="text-xs text-secondary ml-2" title="Offline Mode (Local Storage Only)">○</span>
          )}
        </div>
        <div className="header-actions">
          {isInitialLoading && <div className="spinner-small"></div>}
          <button className="icon-btn" onClick={() => navigate('/settings')}><User size={20} /></button>
        </div>
      </header>

      {/* Main Content Area */}
      <div className={isInitialLoading ? 'content-blur' : ''}>
        <Routes>
          <Route path="/" element={
            <Dashboard
              tasks={tasks}
              bills={bills}
              loggedExpenses={loggedExpenses}
              accounts={accounts}
              transactions={transactions}
              budget={budget}
              onToggleTask={toggleTask}
              onLogBill={logBill}
            />
          } />
          <Route path="/calendar" element={
            <CalendarView 
              tasks={tasks} 
              bills={bills} 
              loggedExpenses={loggedExpenses} 
            />
          } />
          <Route path="/expenses" element={<Expenses loggedExpenses={loggedExpenses} transactions={transactions} accounts={accounts} budget={budget} onAddTransaction={addTransaction} />} />
          <Route path="/settings" element={<SettingsView budget={budget} tasks={tasks} onUpdateBudget={setBudget} onDeleteTask={deleteTask} onLogout={handleLogout} currentUser={currentUser} />} />
        </Routes>
      </div>

      {/* Floating Action Button */}
      <div className="fab-container">
        {showAddMenu && (
          <div className="fab-menu animate-fade-in-up">
            <button className="fab-menu-item" onClick={handleManualEntryClick}>
              <Wallet size={18} />
              <span>Add Expense</span>
            </button>
            <button className="fab-menu-item" onClick={handleSmartTaskClick}>
              <Plus size={18} />
              <span>Smart Task</span>
            </button>
          </div>
        )}
        <button 
          className={`fab-main ${showAddMenu ? 'active' : ''}`}
          onClick={() => setShowAddMenu(!showAddMenu)}
        >
          <Plus size={28} />
        </button>
      </div>

      {/* Smart Task Modal */}
      {isTaskModalOpen && (
        <div className="modal-overlay animate-fade-in">
          <div className="glass-panel modal-content animate-fade-in-up" style={{ maxWidth: '500px' }}>
            <div className="modal-header">
              <h3>Create Smart Task</h3>
              <button className="icon-btn-small" onClick={() => setIsTaskModalOpen(false)}>
                <X size={20} />
              </button>
            </div>
            
            <div className="modal-body">
              <div className="input-group">
                <label className="text-sm text-secondary mb-2 block">Task Description</label>
                <textarea 
                  className="smart-input"
                  placeholder="e.g., Pay electricity bill"
                  value={taskInput}
                  onChange={(e) => setTaskInput(e.target.value)}
                  autoFocus
                  style={{ minHeight: '80px' }}
                ></textarea>
              </div>

              <div className="picker-grid mt-4">
                {/* Date Picker */}
                <div className="picker-column">
                  <label className="text-xs text-secondary mb-1 block">Date</label>
                  <input 
                    type="date" 
                    className="glass-input-small"
                    value={taskDate}
                    onChange={(e) => setTaskDate(e.target.value)}
                  />
                </div>

                {/* Time Picker */}
                <div className="picker-column">
                  <label className="text-xs text-secondary mb-1 block">Time</label>
                  <div className="scroll-picker-container" style={{ gap: '4px' }}>
                    <div style={{ flex: 1 }}>
                      <select 
                        className="glass-select-small"
                        value={taskHour}
                        onChange={(e) => setTaskHour(e.target.value)}
                      >
                        {Array.from({ length: 24 }).map((_, i) => (
                          <option key={i} value={i.toString().padStart(2, '0')}>{i.toString().padStart(2, '0')}</option>
                        ))}
                      </select>
                      <span className="text-xs text-secondary mt-1 block text-center">Hrs</span>
                    </div>
                    <span className="text-secondary" style={{ marginTop: '-20px' }}>:</span>
                    <div style={{ flex: 1 }}>
                      <select 
                        className="glass-select-small"
                        value={taskMinute}
                        onChange={(e) => setTaskMinute(e.target.value)}
                      >
                        {Array.from({ length: 60 }).map((_, i) => (
                          <option key={i} value={i.toString().padStart(2, '0')}>{i.toString().padStart(2, '0')}</option>
                        ))}
                      </select>
                      <span className="text-xs text-secondary mt-1 block text-center">Mins</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="input-group mt-4">
                <label className="text-sm text-secondary mb-2 block">Repeat Schedule</label>
                <div className="scroll-picker-horizontal">
                  {['None', 'Every Minute', 'Daily', 'Weekly', 'Monthly', 'Every 1st'].map((option) => (
                    <button 
                      key={option}
                      className={`pill-option ${taskRepeat === option ? 'active' : ''}`}
                      onClick={() => setTaskRepeat(option)}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            
            <div className="modal-actions mt-6">
              <button className="glass-btn-secondary" onClick={() => setIsTaskModalOpen(false)}>
                Cancel
              </button>
              <button 
                className="glass-btn" 
                onClick={submitTask}
                disabled={isParsing || !taskInput.trim()}
              >
                {isParsing ? 'Saving...' : 'Create Task'}
              </button>
            </div>
          </div>
        </div>
      )}



      {/* Manual Entry Modal */}
      {isManualModalOpen && (
        <div className="modal-overlay animate-fade-in">
          <div className="glass-panel modal-content animate-fade-in-up" style={{ maxWidth: '500px' }}>
            <div className="modal-header">
              <h3>Add Expense</h3>
              <button className="icon-btn-small" onClick={() => { setIsManualModalOpen(false); setManualAmount(''); setManualDate(format(new Date(), 'yyyy-MM-dd')); }}>
                <X size={20} />
              </button>
            </div>

            <div className="modal-body">
              <p className="text-secondary text-sm mb-4">
                Enter expense details manually.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <input
                  type="number"
                  className="smart-input"
                  placeholder="Amount"
                  value={manualAmount}
                  onChange={(e) => setManualAmount(e.target.value)}
                  step="0.01"
                />
                <input
                  type="date"
                  className="smart-input"
                  value={manualDate}
                  onChange={(e) => setManualDate(e.target.value)}
                />
              </div>
            </div>

            <div className="modal-actions mt-4">
              <button className="glass-btn-secondary" onClick={() => { setIsManualModalOpen(false); setManualAmount(''); setManualDate(format(new Date(), 'yyyy-MM-dd')); }}>
                Cancel
              </button>
              <button
                className="glass-btn"
                onClick={submitManualExpense}
                disabled={!manualAmount}
              >
                Add Expense
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Navigation */}
      <nav className="glass-panel bottom-nav">
        <button className={`nav-item ${getPath('/') ? 'active' : ''}`} onClick={() => navigate('/')}>
          <Home size={22} />
          <span>Home</span>
        </button>
        <button className={`nav-item ${getPath('/calendar') ? 'active' : ''}`} onClick={() => navigate('/calendar')}>
          <Calendar size={22} />
          <span>Calendar</span>
        </button>
        <button className={`nav-item ${getPath('/expenses') ? 'active' : ''}`} onClick={() => navigate('/expenses')}>
          <Wallet size={22} />
          <span>Expenses</span>
        </button>
        <button className={`nav-item ${getPath('/settings') ? 'active' : ''}`} onClick={() => navigate('/settings')}>
          <Settings size={22} />
          <span>Settings</span>
        </button>
      </nav>
    </div>
  );
}

export default App;
