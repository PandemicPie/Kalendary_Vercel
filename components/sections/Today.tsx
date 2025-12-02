'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, CheckCircle2, Circle, Clock, Trash2, Edit } from 'lucide-react';
import { useStore } from '@/lib/store';
import { apiClient } from '@/lib/api-client';
import { format, isSameDay, setHours, setMinutes } from 'date-fns';
import { it } from 'date-fns/locale';
import Confetti from '../Confetti';

export default function Today() {
  const { activities, toggleActivityComplete, deleteActivity, user, incrementStreak, addPoints, addActivity, aiSuggestions, setAiSuggestions } = useStore();
  const [showAddModal, setShowAddModal] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [deadTimeSlots, setDeadTimeSlots] = useState<Array<{start: string; end: string; duration: number}>>([]);
  const [newActivity, setNewActivity] = useState({
    title: '',
    description: '',
    startTime: '09:00',
    endTime: '10:00',
    type: 'scheduled' as 'scheduled' | 'exam',
    emoji: '',
    recurring: 'once' as 'once' | 'daily' | 'weekly' | 'monthly',
    examSubject: '',
  });

  // Emoji categories
  const emojiCategories = [
    { emoji: '📚', label: 'Studio', category: 'study' },
    { emoji: '🏃', label: 'Sport', category: 'fitness' },
    { emoji: '🎨', label: 'Arte', category: 'creative' },
    { emoji: '💻', label: 'Lavoro', category: 'work' },
    { emoji: '🍽️', label: 'Cibo', category: 'food' },
    { emoji: '👥', label: 'Sociale', category: 'social' },
    { emoji: '🎮', label: 'Svago', category: 'leisure' },
    { emoji: '🏠', label: 'Casa', category: 'home' },
  ];

  const today = new Date();
  const todayActivities = activities.filter((activity) =>
    isSameDay(new Date(activity.startTime), today)
  ).sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());

  const completedToday = todayActivities.filter((a) => a.completed).length;
  const totalToday = todayActivities.length;
  const completionPercentage = totalToday > 0 ? (completedToday / totalToday) * 100 : 0;

  const handleToggleComplete = async (id: string) => {
    const activity = activities.find(a => a.id === id);
    const wasCompleted = activity?.completed;

    // Optimistic update
    toggleActivityComplete(id);

    try {
      await apiClient.updateActivity(id, { completed: !wasCompleted });

      if (!wasCompleted) {
        // Just completed an activity
        addPoints(10);
        incrementStreak();
      }
    } catch (error) {
      console.error('Error toggling activity:', error);
      // Revert on error
      toggleActivityComplete(id);
    }
  };

  const handleAddActivity = async () => {
    const [startHour, startMin] = newActivity.startTime.split(':').map(Number);
    const [endHour, endMin] = newActivity.endTime.split(':').map(Number);

    const startTime = setMinutes(setHours(today, startHour), startMin);
    const endTime = setMinutes(setHours(today, endHour), endMin);

    // Prepare recurring data if needed
    let recurringData = null;
    if (newActivity.recurring !== 'once') {
      recurringData = {
        frequency: newActivity.recurring,
      };
    }

    const activityData = {
      title: newActivity.type === 'exam'
        ? `📝 ${newActivity.examSubject} - ${newActivity.title}`
        : newActivity.title,
      description: newActivity.description,
      startTime: startTime.toISOString(),
      endTime: endTime.toISOString(),
      completed: false,
      type: newActivity.type,
      emoji: newActivity.emoji,
      recurring: recurringData,
      examSubject: newActivity.type === 'exam' ? newActivity.examSubject : null,
    };

    try {
      const response = await apiClient.createActivity(activityData);

      if (response.success) {
        addActivity({
          id: response.activityId.toString(),
          title: activityData.title,
          description: activityData.description,
          startTime,
          endTime,
          completed: false,
          type: activityData.type as any,
          emoji: activityData.emoji,
          recurring: recurringData as any,
          examSubject: activityData.examSubject || undefined,
        });
      }

      setNewActivity({
        title: '',
        description: '',
        startTime: '09:00',
        endTime: '10:00',
        type: 'scheduled',
        emoji: '',
        recurring: 'once',
        examSubject: '',
      });
      setShowAddModal(false);
    } catch (error) {
      console.error('Error creating activity:', error);
      alert('Errore nella creazione dell\'attività');
    }
  };

  const handleDeleteActivity = async (id: string) => {
    if (!confirm('Sei sicuro di voler eliminare questa attività?')) return;

    try {
      await apiClient.deleteActivity(id);
      deleteActivity(id);
    } catch (error) {
      console.error('Error deleting activity:', error);
      alert('Errore nell\'eliminazione dell\'attività');
    }
  };

  // Load AI suggestions on mount
  useEffect(() => {
    const loadSuggestions = async () => {
      if (!user) return;

      try {
        const response = await apiClient.getDailySuggestions(user, today);
        if (response.success) {
          setAiSuggestions(response.suggestions || []);
          setDeadTimeSlots(response.deadTimeSlots || []);
        }
      } catch (error) {
        console.log('ℹ️ Suggerimenti AI non disponibili, uso fallback');
        // Anche se c'è un errore, i suggerimenti fallback verranno comunque restituiti dall'API
      }
    };

    loadSuggestions();
  }, [user, setAiSuggestions]);

  // Check if all goals are completed - for confetti animation
  useEffect(() => {
    if (totalToday > 0 && completedToday === totalToday && !showConfetti) {
      // All activities completed! Trigger confetti
      setShowConfetti(true);
    } else if (completedToday !== totalToday && showConfetti) {
      // Reset confetti if not all completed
      setShowConfetti(false);
    }
  }, [completedToday, totalToday, showConfetti]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50 pb-24">
      <div className="max-w-md mx-auto px-6 py-8 space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-2"
        >
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Ciao, {user?.name}
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            {format(today, "EEEE, d MMMM", { locale: it })}
          </p>
        </motion.div>

        {/* AI Suggestions */}
        {aiSuggestions.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-3xl p-5 shadow-lg text-white"
          >
            <div className="flex items-center gap-2 mb-3">
              <span className="text-2xl">✨</span>
              <h3 className="font-semibold">Suggerimenti AI</h3>
            </div>
            <div className="space-y-2">
              {aiSuggestions.map((suggestion, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-white/20 rounded-xl px-4 py-2 text-sm backdrop-blur-sm"
                >
                  {suggestion}
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Dead Time Alert */}
        {deadTimeSlots.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-yellow-50 border-2 border-yellow-200 rounded-2xl p-4"
          >
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xl">⏰</span>
              <h3 className="font-semibold text-yellow-900">Tempo Libero Disponibile</h3>
            </div>
            <div className="space-y-1">
              {deadTimeSlots.slice(0, 2).map((slot, index) => (
                <p key={index} className="text-sm text-yellow-800">
                  {slot.start} - {slot.end} ({Math.round(slot.duration)} min)
                </p>
              ))}
            </div>
          </motion.div>
        )}

        {/* Progress Card */}
        {totalToday > 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`rounded-3xl p-6 shadow-lg ${
              completionPercentage === 100
                ? 'bg-gradient-to-r from-green-500 to-emerald-500'
                : 'bg-gradient-to-r from-blue-500 to-purple-500'
            } text-white`}
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium opacity-90">
                Progressi di oggi
              </span>
              <span className="text-3xl font-bold">
                {completedToday}/{totalToday}
              </span>
            </div>
            <div className="w-full bg-white/20 rounded-full h-3 overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${completionPercentage}%` }}
                className="h-full bg-white rounded-full"
                transition={{ duration: 0.5, ease: 'easeOut' }}
              />
            </div>
            {completionPercentage === 100 && (
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-3 text-sm font-medium text-center"
              >
                🎉 Fantastico! Hai completato tutte le attività!
              </motion.p>
            )}
          </motion.div>
        )}

        {/* Activities List */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Le tue attività
            </h2>
            <motion.button
              onClick={() => setShowAddModal(true)}
              whileTap={{ scale: 0.95 }}
              className="p-3 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors shadow-md"
            >
              <Plus className="w-6 h-6" />
            </motion.button>
          </div>

          <AnimatePresence>
            {todayActivities.length > 0 ? (
              <div className="space-y-3">
                {todayActivities.map((activity, index) => (
                  <motion.div
                    key={activity.id}
                    layout
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -100 }}
                    transition={{ delay: index * 0.05 }}
                    className={`rounded-2xl p-5 shadow-md border-2 transition-all ${
                      activity.completed
                        ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                        : 'border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700'
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      {/* Checkbox - più grande */}
                      <button
                        onClick={() => handleToggleComplete(activity.id)}
                        className="flex-shrink-0 mt-1"
                      >
                        {activity.completed ? (
                          <CheckCircle2 className="w-8 h-8 text-green-500" />
                        ) : (
                          <Circle className="w-8 h-8 text-gray-400 hover:text-blue-500 transition-colors" />
                        )}
                      </button>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <h3
                          className={`text-lg font-semibold text-gray-900 dark:text-white mb-1 flex items-center gap-2 ${
                            activity.completed ? 'line-through opacity-60' : ''
                          }`}
                        >
                          {activity.emoji && <span className="text-2xl">{activity.emoji}</span>}
                          <span>{activity.title}</span>
                        </h3>
                        {activity.description && (
                          <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                            {activity.description}
                          </p>
                        )}
                        <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                          <Clock className="w-4 h-4" />
                          <span>
                            {format(new Date(activity.startTime), 'HH:mm')} -{' '}
                            {format(new Date(activity.endTime), 'HH:mm')}
                          </span>
                        </div>
                      </div>

                      {/* Delete button */}
                      <button
                        onClick={() => handleDeleteActivity(activity.id)}
                        className="flex-shrink-0 p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-16"
              >
                <div className="text-6xl mb-4">📅</div>
                <p className="text-gray-600 dark:text-gray-300 mb-6">
                  Nessuna attività programmata per oggi
                </p>
                <button
                  onClick={() => setShowAddModal(true)}
                  className="px-6 py-3 bg-blue-500 text-white rounded-xl font-medium hover:bg-blue-600 transition-colors"
                >
                  Aggiungi la prima attività
                </button>
              </motion.div>
            )}
          </AnimatePresence>
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
              className="bg-white dark:bg-gray-800 w-full rounded-3xl p-6 max-w-md shadow-2xl"
            >

              <h3 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">
                Nuova attività
              </h3>

              <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
                {/* Tipo Attività */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Tipo
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setNewActivity({ ...newActivity, type: 'scheduled' })}
                      className={`py-3 px-4 rounded-xl font-medium transition-all ${
                        newActivity.type === 'scheduled'
                          ? 'bg-blue-500 text-white'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                      }`}
                    >
                      📅 Attività
                    </button>
                    <button
                      type="button"
                      onClick={() => setNewActivity({ ...newActivity, type: 'exam' })}
                      className={`py-3 px-4 rounded-xl font-medium transition-all ${
                        newActivity.type === 'exam'
                          ? 'bg-red-500 text-white'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                      }`}
                    >
                      📝 Verifica
                    </button>
                  </div>
                </div>

                {/* Materia (solo per verifiche) */}
                {newActivity.type === 'exam' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Materia
                    </label>
                    <input
                      type="text"
                      value={newActivity.examSubject}
                      onChange={(e) =>
                        setNewActivity({ ...newActivity, examSubject: e.target.value })
                      }
                      placeholder="Es: Matematica, Storia..."
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:border-red-500 focus:ring-2 focus:ring-red-200 outline-none transition-all"
                    />
                  </div>
                )}

                {/* Emoji Categoria */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Categoria
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {emojiCategories.map((cat) => (
                      <button
                        key={cat.category}
                        type="button"
                        onClick={() => setNewActivity({ ...newActivity, emoji: cat.emoji })}
                        className={`py-3 rounded-xl text-2xl transition-all ${
                          newActivity.emoji === cat.emoji
                            ? 'bg-blue-100 dark:bg-blue-900 ring-2 ring-blue-500'
                            : 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600'
                        }`}
                        title={cat.label}
                      >
                        {cat.emoji}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Titolo */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {newActivity.type === 'exam' ? 'Argomento' : 'Titolo'}
                  </label>
                  <input
                    type="text"
                    value={newActivity.title}
                    onChange={(e) =>
                      setNewActivity({ ...newActivity, title: e.target.value })
                    }
                    placeholder={newActivity.type === 'exam' ? "Es: Capitolo 1-3" : "Es: Studiare matematica"}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all"
                  />
                </div>

                {/* Descrizione */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Note (opzionale)
                  </label>
                  <input
                    type="text"
                    value={newActivity.description}
                    onChange={(e) =>
                      setNewActivity({ ...newActivity, description: e.target.value })
                    }
                    placeholder="Es: Portare calcolatrice"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all"
                  />
                </div>

                {/* Orari */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Inizio
                    </label>
                    <input
                      type="time"
                      value={newActivity.startTime}
                      onChange={(e) =>
                        setNewActivity({ ...newActivity, startTime: e.target.value })
                      }
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Fine
                    </label>
                    <input
                      type="time"
                      value={newActivity.endTime}
                      onChange={(e) =>
                        setNewActivity({ ...newActivity, endTime: e.target.value })
                      }
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all"
                    />
                  </div>
                </div>

                {/* Ricorrenza */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Ripeti
                  </label>
                  <select
                    value={newActivity.recurring}
                    onChange={(e) =>
                      setNewActivity({ ...newActivity, recurring: e.target.value as any })
                    }
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all"
                  >
                    <option value="once">Una volta</option>
                    <option value="daily">Ogni giorno</option>
                    <option value="weekly">Ogni settimana</option>
                    <option value="monthly">Ogni mese</option>
                  </select>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => setShowAddModal(false)}
                    className="flex-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 py-3 rounded-xl font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                  >
                    Annulla
                  </button>
                  <button
                    onClick={handleAddActivity}
                    disabled={!newActivity.title || (newActivity.type === 'exam' && !newActivity.examSubject)}
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

      {/* Confetti Animation */}
      <Confetti show={showConfetti} onComplete={() => setShowConfetti(false)} />
    </div>
  );
}
