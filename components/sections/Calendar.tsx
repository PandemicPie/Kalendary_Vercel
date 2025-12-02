'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, ChevronLeft, ChevronRight, Circle, CheckCircle2 } from 'lucide-react';
import { useStore } from '@/lib/store';
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  addMonths,
  subMonths,
  isSameDay,
  isSameMonth,
  isToday,
  setHours,
  setMinutes,
} from 'date-fns';
import { it } from 'date-fns/locale';

export default function Calendar() {
  const { activities, toggleActivityComplete, addActivity, deleteActivity } = useStore();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showAddModal, setShowAddModal] = useState(false);
  const [newActivity, setNewActivity] = useState({
    title: '',
    description: '',
    startTime: '09:00',
    endTime: '10:00',
  });

  // Generate calendar days
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart, { weekStartsOn: 1 });
  const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });

  const dateFormat = 'd';
  const rows = [];
  let days = [];
  let day = startDate;

  while (day <= endDate) {
    for (let i = 0; i < 7; i++) {
      const formattedDate = format(day, dateFormat);
      const cloneDay = day;
      const dayActivities = activities.filter((a) =>
        isSameDay(new Date(a.startTime), cloneDay)
      );
      const hasActivities = dayActivities.length > 0;
      const hasCompleted = dayActivities.some((a) => a.completed);

      days.push(
        <motion.button
          key={day.toString()}
          onClick={() => setSelectedDate(cloneDay)}
          whileTap={{ scale: 0.95 }}
          className={`aspect-square relative flex flex-col items-center justify-center rounded-2xl transition-all ${
            !isSameMonth(day, monthStart)
              ? 'text-gray-300'
              : isSameDay(day, selectedDate)
              ? 'bg-blue-500 text-white shadow-lg scale-105'
              : isToday(day)
              ? 'bg-blue-100 text-blue-600 font-bold'
              : 'text-gray-700 hover:bg-gray-100'
          }`}
        >
          <span className="text-sm">{formattedDate}</span>
          {hasActivities && (
            <div className="flex gap-0.5 mt-1">
              {dayActivities.slice(0, 3).map((_, i) => (
                <div
                  key={i}
                  className={`w-1 h-1 rounded-full ${
                    isSameDay(day, selectedDate)
                      ? 'bg-white'
                      : hasCompleted
                      ? 'bg-green-500'
                      : 'bg-blue-500'
                  }`}
                />
              ))}
            </div>
          )}
        </motion.button>
      );
      day = addDays(day, 1);
    }
    rows.push(
      <div key={day.toString()} className="grid grid-cols-7 gap-2">
        {days}
      </div>
    );
    days = [];
  }

  const selectedDateActivities = activities
    .filter((a) => isSameDay(new Date(a.startTime), selectedDate))
    .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());

  const handleAddActivity = () => {
    const [startHour, startMin] = newActivity.startTime.split(':').map(Number);
    const [endHour, endMin] = newActivity.endTime.split(':').map(Number);

    const startTime = setMinutes(setHours(selectedDate, startHour), startMin);
    const endTime = setMinutes(setHours(selectedDate, endHour), endMin);

    addActivity({
      id: `activity-${Date.now()}`,
      title: newActivity.title,
      description: newActivity.description,
      startTime,
      endTime,
      completed: false,
      type: 'scheduled',
    });

    setNewActivity({
      title: '',
      description: '',
      startTime: '09:00',
      endTime: '10:00',
    });
    setShowAddModal(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 pb-24">
      <div className="max-w-md mx-auto px-4 py-6 space-y-6">
        {/* Header with Month Navigation */}
        <div className="bg-white rounded-3xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <motion.button
              onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
              whileTap={{ scale: 0.95 }}
              className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
            >
              <ChevronLeft className="w-6 h-6 text-gray-600" />
            </motion.button>

            <h2 className="text-2xl font-bold text-gray-900">
              {format(currentMonth, 'MMMM yyyy', { locale: it })}
            </h2>

            <motion.button
              onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
              whileTap={{ scale: 0.95 }}
              className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
            >
              <ChevronRight className="w-6 h-6 text-gray-600" />
            </motion.button>
          </div>

          {/* Weekday Headers */}
          <div className="grid grid-cols-7 gap-2 mb-3">
            {['L', 'M', 'M', 'G', 'V', 'S', 'D'].map((day, i) => (
              <div
                key={i}
                className="text-center text-xs font-semibold text-gray-500"
              >
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Grid */}
          <div className="space-y-2">{rows}</div>
        </div>

        {/* Selected Date Activities */}
        <div className="bg-white rounded-3xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-xl font-bold text-gray-900">
                {format(selectedDate, 'EEEE d MMMM', { locale: it })}
              </h3>
              <p className="text-sm text-gray-500">
                {selectedDateActivities.length} attività
              </p>
            </div>
            <motion.button
              onClick={() => setShowAddModal(true)}
              whileTap={{ scale: 0.95 }}
              className="p-3 bg-blue-500 text-white rounded-2xl hover:bg-blue-600 transition-colors shadow-md"
            >
              <Plus className="w-5 h-5" />
            </motion.button>
          </div>

          <div className="space-y-3">
            <AnimatePresence>
              {selectedDateActivities.length > 0 ? (
                selectedDateActivities.map((activity) => (
                  <motion.div
                    key={activity.id}
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className={`p-4 rounded-2xl border-2 transition-all ${
                      activity.completed
                        ? 'border-green-500 bg-green-50'
                        : 'border-gray-200 bg-gray-50'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <button
                        onClick={() => toggleActivityComplete(activity.id)}
                        className="mt-0.5"
                      >
                        {activity.completed ? (
                          <CheckCircle2 className="w-5 h-5 text-green-500" />
                        ) : (
                          <Circle className="w-5 h-5 text-gray-400 hover:text-blue-500 transition-colors" />
                        )}
                      </button>

                      <div className="flex-1 min-w-0">
                        <h4
                          className={`font-semibold text-gray-900 mb-1 ${
                            activity.completed ? 'line-through opacity-60' : ''
                          }`}
                        >
                          {activity.title}
                        </h4>
                        <p className="text-xs text-gray-500">
                          {format(new Date(activity.startTime), 'HH:mm')} -{' '}
                          {format(new Date(activity.endTime), 'HH:mm')}
                        </p>
                      </div>

                      <button
                        onClick={() => deleteActivity(activity.id)}
                        className="text-red-500 hover:bg-red-50 p-1.5 rounded-lg transition-colors text-xs"
                      >
                        ✕
                      </button>
                    </div>
                  </motion.div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-400">
                  <p>Nessuna attività per questo giorno</p>
                </div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Add Activity Modal */}
      <AnimatePresence>
        {showAddModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm p-4"
            onClick={() => setShowAddModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: 'spring', damping: 25 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white w-full rounded-3xl p-6 max-w-md shadow-2xl"
            >
              <h3 className="text-2xl font-bold mb-6 text-gray-900">
                Nuova attività
              </h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Titolo
                  </label>
                  <input
                    type="text"
                    value={newActivity.title}
                    onChange={(e) =>
                      setNewActivity({ ...newActivity, title: e.target.value })
                    }
                    placeholder="Es: Riunione importante"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Descrizione (opzionale)
                  </label>
                  <input
                    type="text"
                    value={newActivity.description}
                    onChange={(e) =>
                      setNewActivity({ ...newActivity, description: e.target.value })
                    }
                    placeholder="Dettagli..."
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Inizio
                    </label>
                    <input
                      type="time"
                      value={newActivity.startTime}
                      onChange={(e) =>
                        setNewActivity({ ...newActivity, startTime: e.target.value })
                      }
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Fine
                    </label>
                    <input
                      type="time"
                      value={newActivity.endTime}
                      onChange={(e) =>
                        setNewActivity({ ...newActivity, endTime: e.target.value })
                      }
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all"
                    />
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => setShowAddModal(false)}
                    className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-xl font-medium hover:bg-gray-200 transition-colors"
                  >
                    Annulla
                  </button>
                  <button
                    onClick={handleAddActivity}
                    disabled={!newActivity.title}
                    className="flex-1 bg-blue-500 text-white py-3 rounded-xl font-medium hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Aggiungi
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
