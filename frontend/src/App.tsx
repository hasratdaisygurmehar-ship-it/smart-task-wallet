import { useState, useRef, useEffect } from 'react';
import { format } from 'date-fns';
import Tesseract from 'tesseract.js';
import * as chrono from 'chrono-node';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { Calendar, Plus, Wallet, Home, User, Settings, Camera, Zap, X, Upload } from 'lucide-react';
import Dashboard from './pages/Dashboard';
import CalendarView from './pages/CalendarView';
import Expenses from './pages/Expenses';
import SettingsView from './pages/Settings';
import type { Task, Bill } from './types';
import './App.css';
import LoginPage from './pages/LoginPage';

function App() {
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [taskInput, setTaskInput] = useState('');
  const [isParsing, setIsParsing] = useState(false);
  
  const [currentUser, setCurrentUser] = useState<any>(() => {
    const saved = localStorage.getItem('currentUser');
    return saved ? JSON.parse(saved) : null;
  });

  const [isOcrModalOpen, setIsOcrModalOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Task Structured States
  const [taskDate, setTaskDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [taskHour, setTaskHour] = useState('09');
  const [taskMinute, setTaskMinute] = useState('00');
  const [taskRepeat, setTaskRepeat] = useState('None');

  const navigate = useNavigate();
  const location = useLocation();

  const [budget, setBudget] = useState<number>(() => {
    if (!currentUser) return 0;
    const saved = localStorage.getItem(`budget_${currentUser.id}`);
    return saved ? Number(saved) : 0;
  });
  const [tasks, setTasks] = useState<Task[]>(() => {
    if (!currentUser) return [];
    const saved = localStorage.getItem(`tasks_${currentUser.id}`);
    return saved ? JSON.parse(saved) : [];
  });
  const [bills, setBills] = useState<Bill[]>(() => {
    if (!currentUser) return [];
    const saved = localStorage.getItem(`bills_${currentUser.id}`);
    return saved ? JSON.parse(saved) : [];
  });
  const [loggedExpenses, setLoggedExpenses] = useState<Bill[]>(() => {
    if (!currentUser) return [];
    const saved = localStorage.getItem(`loggedExpenses_${currentUser.id}`);
    return saved ? JSON.parse(saved) : [];
  });

  // Persistence effects
  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('currentUser', JSON.stringify(currentUser));
      
      const savedBudget = localStorage.getItem(`budget_${currentUser.id}`);
      const savedTasks = localStorage.getItem(`tasks_${currentUser.id}`);
      const savedBills = localStorage.getItem(`bills_${currentUser.id}`);
      const savedLogged = localStorage.getItem(`loggedExpenses_${currentUser.id}`);
      
      if (savedBudget !== null) setBudget(Number(savedBudget));
      if (savedTasks !== null) {
        const loadedTasks = JSON.parse(savedTasks);
        setTasks(loadedTasks);
        
        // Auto-rollover recurring tasks that are in the past
        const today = format(new Date(), 'yyyy-MM-dd');
        let needsUpdate = false;
        const tasksToUpdate = [...loadedTasks];

        loadedTasks.forEach((task: Task) => {
          if (task.recurring && task.repeatFrequency && task.date < today) {
            const nextDate = calculateNextDate(task.date, task.repeatFrequency);
            const exists = tasksToUpdate.some(t => t.title === task.title && t.date === nextDate);
            
            if (!exists) {
              const nextTask: Task = {
                ...task,
                id: Date.now() + Math.random(),
                date: nextDate,
                done: false
              };
              tasksToUpdate.unshift(nextTask);
              needsUpdate = true;
            }
          }
        });

        if (needsUpdate) {
          setTasks(tasksToUpdate);
        }
      }
      if (savedBills !== null) setBills(JSON.parse(savedBills));
      if (savedLogged !== null) setLoggedExpenses(JSON.parse(savedLogged));
    }
  }, [currentUser]);

  useEffect(() => { if (currentUser) localStorage.setItem(`budget_${currentUser.id}`, budget.toString()); }, [budget, currentUser]);
  useEffect(() => { if (currentUser) localStorage.setItem(`tasks_${currentUser.id}`, JSON.stringify(tasks)); }, [tasks, currentUser]);
  useEffect(() => { if (currentUser) localStorage.setItem(`bills_${currentUser.id}`, JSON.stringify(bills)); }, [bills, currentUser]);
  useEffect(() => { if (currentUser) localStorage.setItem(`loggedExpenses_${currentUser.id}`, JSON.stringify(loggedExpenses)); }, [loggedExpenses, currentUser]);

  const handleLogin = (user: any) => {
    setCurrentUser(user);
    // Reload data for this user
    const savedBudget = localStorage.getItem(`budget_${user.id}`);
    const savedTasks = localStorage.getItem(`tasks_${user.id}`);
    const savedBills = localStorage.getItem(`bills_${user.id}`);
    const savedLogged = localStorage.getItem(`loggedExpenses_${user.id}`);
    
    setBudget(savedBudget ? Number(savedBudget) : 0);
    setTasks(savedTasks ? JSON.parse(savedTasks) : []);
    setBills(savedBills ? JSON.parse(savedBills) : []);
    setLoggedExpenses(savedLogged ? JSON.parse(savedLogged) : []);
  };

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

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('currentUser');
    navigate('/');
  };

  const getPath = (path: string) => location.pathname === path;

  const handleSmartTaskClick = () => {
    setShowAddMenu(false);
    setIsTaskModalOpen(true);
  };

  const handleOcrClick = () => {
    setShowAddMenu(false);
    setIsOcrModalOpen(true);
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

  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [showCamera, setShowCamera] = useState(false);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      setCameraStream(stream);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setShowCamera(true);
    } catch (err) {
      console.error("Error accessing camera:", err);
      alert("Could not access camera. Please check permissions.");
    }
  };

  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
    }
    setShowCamera(false);
  };

  const captureImage = () => {
    if (videoRef.current) {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0);
        canvas.toBlob((blob) => {
          if (blob) {
            const file = new File([blob], "captured_bill.jpg", { type: "image/jpeg" });
            setSelectedFile(file);
            stopCamera();
          }
        }, 'image/jpeg', 0.95);
      }
    }
  };

  const submitOcrScan = async () => {
    if (!selectedFile) return;
    setIsScanning(true);

    try {
      // Run OCR directly in the browser
      const { data: { text } } = await Tesseract.recognize(
        selectedFile,
        'eng',
        { logger: m => console.log(m) }
      );

      // Extract Amount
      const amountRegex = /[$]?\d{1,3}(?:,\d{3})*(?:\.\d{2})/g;
      const amounts = text.match(amountRegex) || [];
      let maxAmount = 0;
      amounts.forEach(amt => {
        const num = parseFloat(amt.replace(/[$|,]/g, ''));
        if (num > maxAmount) maxAmount = num;
      });

      // Extract Dates
      const dateRegex = /\b\d{1,2}[\/-]\d{1,2}[\/-]\d{2,4}\b|\b\d{4}[\/-]\d{1,2}[\/-]\d{1,2}\b/g;
      const dates = text.match(dateRegex) || [];
      
      // Clean up vendor name (first line usually)
      const lines = text.split('\n').filter(l => l.trim().length > 2);
      const vendor = lines.length > 0 ? lines[0].trim() : 'Scanned Bill';
      
      const newBill: Bill = {
        id: Date.now(),
        name: vendor,
        amount: maxAmount > 0 ? maxAmount.toFixed(2) : '0.00',
        dueDate: (dates && dates.length > 0) ? dates[0] : format(new Date(), 'yyyy-MM-dd'),
        status: 'Logged'
      };

      setLoggedExpenses([newBill, ...loggedExpenses]);
      setIsOcrModalOpen(false);
      setSelectedFile(null);
      stopCamera();
    } catch (error) {
      console.error('Failed to scan bill', error);
      const newBill: Bill = {
        id: Date.now(),
        name: 'Scan Failed',
        amount: '0.00',
        dueDate: format(new Date(), 'yyyy-MM-dd'),
        status: 'Error'
      };
      setBills([newBill, ...bills]);
      setIsOcrModalOpen(false);
      setSelectedFile(null);
      stopCamera();
    } finally {
      setIsScanning(false);
    }
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

  const payBill = (billId: number) => {
    const billToPay = bills.find(b => b.id === billId);
    if (!billToPay) return;

    setBills(bills.map(bill => 
      bill.id === billId ? { ...bill, status: 'Paid' } : bill
    ));

    setTimeout(() => {
      setBills(prev => prev.filter(b => b.id !== billId));
      setLoggedExpenses(prev => [{ ...billToPay, status: 'Logged' }, ...prev]);
    }, 500);
  };

  if (!currentUser) {
    return <LoginPage onLogin={handleLogin} />;
  }

  return (
    <div className={`app-container dark-theme`}>
      {/* Header */}
      <header className="glass-panel header-nav">
        <div className="logo-container">
          <div className="logo-icon"><Zap size={20} color="white" style={{margin: '6px'}}/></div>
          <h1>Smart Task Wallet</h1>
        </div>
        <div className="header-actions">
          <button className="icon-btn" onClick={() => navigate('/settings')}><User size={20} /></button>
        </div>
      </header>

      {/* Main Content Area */}
      <Routes>
        <Route path="/" element={
          <Dashboard 
            tasks={tasks} 
            bills={bills} 
            loggedExpenses={loggedExpenses}
            budget={budget}
            onToggleTask={toggleTask} 
            onPayBill={payBill} 
          />
        } />
        <Route path="/calendar" element={
          <CalendarView 
            tasks={tasks} 
            bills={bills} 
            loggedExpenses={loggedExpenses} 
          />
        } />
        <Route path="/expenses" element={<Expenses loggedExpenses={loggedExpenses} budget={budget} />} />
        <Route path="/settings" element={<SettingsView budget={budget} onUpdateBudget={setBudget} onLogout={handleLogout} currentUser={currentUser} />} />
      </Routes>

      {/* Floating Action Button */}
      <div className="fab-container">
        {showAddMenu && (
          <div className="fab-menu animate-fade-in-up">
            <button className="fab-menu-item" onClick={handleOcrClick}>
              <Camera size={18} />
              <span>Scan Bill (OCR)</span>
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

      {/* OCR Bill Scanner Modal */}
      {isOcrModalOpen && (
        <div className="modal-overlay animate-fade-in">
          <div className="glass-panel modal-content animate-fade-in-up" style={{ maxWidth: '600px' }}>
            <div className="modal-header">
              <h3>Scan Bill or Receipt</h3>
              <button className="icon-btn-small" onClick={() => { setIsOcrModalOpen(false); setSelectedFile(null); stopCamera(); }}>
                <X size={20} />
              </button>
            </div>
            
            <div className="modal-body">
              {showCamera ? (
                <div className="camera-view-container">
                  <video ref={videoRef} autoPlay playsInline className="camera-preview"></video>
                  <div className="camera-controls">
                    <button className="glass-btn-secondary" onClick={stopCamera}>Cancel</button>
                    <button className="capture-btn" onClick={captureImage}>
                      <div className="capture-btn-inner"></div>
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <p className="text-secondary text-sm mb-4">
                    Take a photo or upload an image of your bill. Our AI will extract the details even from blurry images.
                  </p>
                  
                  <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
                    <button className="glass-panel camera-toggle-btn" style={{ flex: 1 }} onClick={startCamera}>
                      <Camera size={24} className="mb-2" />
                      <span>Use Camera</span>
                    </button>
                    <div className="upload-container" style={{ flex: 1, margin: 0 }} onClick={() => fileInputRef.current?.click()}>
                      <input 
                        type="file" 
                        ref={fileInputRef} 
                        className="hidden-file-input" 
                        accept="image/*"
                        onChange={(e) => {
                          if (e.target.files && e.target.files.length > 0) {
                            setSelectedFile(e.target.files[0]);
                          }
                        }}
                      />
                      <Upload size={24} className="mb-2" />
                      <span>{selectedFile ? selectedFile.name : 'Upload Image'}</span>
                    </div>
                  </div>
                </>
              )}
              
              {selectedFile && !showCamera && (
                <div className="selected-preview glass-panel">
                  <p className="text-sm">Image Selected: <strong>{selectedFile.name}</strong></p>
                  <button className="text-accent-secondary text-xs" onClick={() => setSelectedFile(null)}>Remove</button>
                </div>
              )}
            </div>
            
            {isScanning && (
              <div className="scanning-indicator">
                <div className="spinner"></div>
                <p className="text-sm text-accent-primary">AI is analyzing image...</p>
              </div>
            )}
            
            <div className="modal-actions mt-4">
              <button className="glass-btn-secondary" onClick={() => { setIsOcrModalOpen(false); setSelectedFile(null); stopCamera(); }}>
                Cancel
              </button>
              <button 
                className="glass-btn" 
                onClick={submitOcrScan}
                disabled={isScanning || !selectedFile || showCamera}
              >
                {isScanning ? 'Scanning...' : 'Extract Data'}
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
