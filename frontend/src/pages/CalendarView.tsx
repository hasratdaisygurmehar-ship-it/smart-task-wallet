import { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, CheckCircle2, ShoppingCart, Calendar as CalendarIcon, Wallet, Clock } from 'lucide-react';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday, startOfWeek, endOfWeek, isSameDay, parseISO } from 'date-fns';
import type { Bill, Task } from '../types';

interface CalendarViewProps {
  tasks: Task[];
  bills: Bill[];
  loggedExpenses: Bill[];
}

export default function CalendarView({ tasks, bills, loggedExpenses }: CalendarViewProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart);
  const endDate = endOfWeek(monthEnd);

  const days = eachDayOfInterval({ start: startDate, end: endDate });

  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));

  // Helper to normalize date strings for comparison
  const normalizeDate = (dateStr: string) => {
    if (!dateStr) return null;
    try {
      // Handle YYYY-MM-DD
      if (dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) return dateStr;
      
      // Handle "Tomorrow"
      if (dateStr.toLowerCase() === 'tomorrow') {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        return format(tomorrow, 'yyyy-MM-dd');
      }

      // Handle "Today"
      if (dateStr.toLowerCase() === 'today') {
        return format(new Date(), 'yyyy-MM-dd');
      }

      // Handle "25th Oct" format (simplified)
      if (dateStr.includes('Oct')) {
        const day = dateStr.match(/\d+/)?.[0];
        if (day) return `2026-10-${day.padStart(2, '0')}`;
      }

      return dateStr;
    } catch (e) {
      return dateStr;
    }
  };

  const selectedDateStr = format(selectedDate, 'yyyy-MM-dd');

  const filteredTasks = useMemo(() => 
    tasks.filter(t => normalizeDate(t.date) === selectedDateStr),
    [tasks, selectedDateStr]
  );

  const filteredBills = useMemo(() => 
    bills.filter(b => normalizeDate(b.dueDate) === selectedDateStr),
    [bills, selectedDateStr]
  );

  const filteredExpenses = useMemo(() => 
    loggedExpenses.filter(e => normalizeDate(e.dueDate) === selectedDateStr),
    [loggedExpenses, selectedDateStr]
  );

  const hasItemsOnDay = (day: Date) => {
    const dayStr = format(day, 'yyyy-MM-dd');
    return tasks.some(t => normalizeDate(t.date) === dayStr) ||
           bills.some(b => normalizeDate(b.dueDate) === dayStr) ||
           loggedExpenses.some(e => normalizeDate(e.dueDate) === dayStr);
  };

  return (
    <div className="main-content animate-fade-in" style={{ paddingBottom: '100px' }}>
      <header className="section-header">
        <h2>Calendar</h2>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <button className="icon-btn-small" onClick={prevMonth} style={{ padding: '4px' }}>
            <ChevronLeft size={20} />
          </button>
          <span className="badge">{format(currentMonth, "MMMM yyyy")}</span>
          <button className="icon-btn-small" onClick={nextMonth} style={{ padding: '4px' }}>
            <ChevronRight size={20} />
          </button>
        </div>
      </header>
      
      <section className="glass-panel" style={{ padding: '1.5rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '8px', marginBottom: '1rem', textAlign: 'center', fontWeight: 600, color: 'var(--text-secondary)' }}>
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => <div key={day} className="text-sm">{day}</div>)}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '8px' }}>
          {days.map((day, i) => {
            const isCurrMonth = isSameMonth(day, monthStart);
            const isCurrDay = isToday(day);
            const isSelected = isSameDay(day, selectedDate);
            const hasItems = hasItemsOnDay(day);

            return (
              <div 
                key={i} 
                onClick={() => setSelectedDate(day)}
                style={{ 
                  height: '60px', 
                  background: isSelected ? 'rgba(139, 92, 246, 0.3)' : (isCurrDay ? 'rgba(139, 92, 246, 0.1)' : 'rgba(255,255,255,0.02)'),
                  border: isSelected ? '2px solid var(--accent-primary)' : (isCurrDay ? '1px solid rgba(139, 92, 246, 0.3)' : '1px solid transparent'),
                  borderRadius: '12px', 
                  padding: '6px',
                  opacity: isCurrMonth ? 1 : 0.4,
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '4px'
                }}
              >
                <span className="text-sm" style={{ fontWeight: (isSelected || isCurrDay) ? 'bold' : 'normal', color: (isSelected || isCurrDay) ? 'var(--text-primary)' : 'inherit' }}>
                  {format(day, 'd')}
                </span>
                {hasItems && (
                  <div style={{ display: 'flex', gap: '2px' }}>
                    <div style={{ width: '4px', height: '4px', borderRadius: '50%', background: 'var(--accent-primary)' }}></div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </section>
      
      <section className="mt-4">
        <div className="section-header">
          <h3 style={{ fontSize: '1.1rem' }}>Activities for {format(selectedDate, 'MMMM d, yyyy')}</h3>
          {isToday(selectedDate) && <span className="badge">Today</span>}
        </div>

        <div className="task-list">
          {/* Combined list of filtered items */}
          {filteredTasks.map(task => (
            <div key={task.id} className="glass-card task-item">
              <div className="task-status">
                <div style={{ background: 'rgba(59, 130, 246, 0.2)', padding: '6px', borderRadius: '50%' }}>
                  <Clock size={18} color="#3b82f6" />
                </div>
              </div>
              <div className="task-info">
                <p className={`task-title ${task.done ? 'strikethrough' : ''}`}>{task.title}</p>
                <div className="task-meta">
                  <span className="badge-time">{task.time}</span>
                  <span className="badge-priority info">Reminder</span>
                </div>
              </div>
            </div>
          ))}

          {filteredBills.map(bill => (
            <div key={bill.id} className="glass-card bill-item" style={{ padding: '1.25rem' }}>
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                <div style={{ background: 'rgba(245, 158, 11, 0.2)', padding: '8px', borderRadius: '50%' }}>
                  <Wallet size={18} color="#f59e0b" />
                </div>
                <div>
                  <h4 style={{ fontSize: '1.05rem' }}>{bill.name}</h4>
                  <p className="text-secondary text-sm">Upcoming Bill</p>
                </div>
              </div>
              <div style={{ fontWeight: 700, fontSize: '1.1rem' }}>{bill.amount.toString().replace('$', '')}</div>
            </div>
          ))}

          {filteredExpenses.map(expense => (
            <div key={expense.id} className="glass-card task-item">
              <div className="task-status">
                <div style={{ background: 'rgba(16, 185, 129, 0.2)', padding: '6px', borderRadius: '50%' }}>
                  <ShoppingCart size={18} className="text-success" />
                </div>
              </div>
              <div className="task-info">
                <p className="task-title">{expense.name}</p>
                <div className="task-meta">
                  <span className="badge-time">Paid</span>
                  <span className="badge-priority info">Transaction</span>
                </div>
              </div>
              <div style={{ fontWeight: 600 }}>{expense.amount.toString().replace('$', '')}</div>
            </div>
          ))}

          {filteredTasks.length === 0 && filteredBills.length === 0 && filteredExpenses.length === 0 && (
            <div className="glass-panel" style={{ textAlign: 'center', padding: '3rem', opacity: 0.7 }}>
              <CalendarIcon size={40} className="text-secondary mb-2" style={{ margin: '0 auto 10px' }} />
              <p className="text-secondary">No activities or history for this day.</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
