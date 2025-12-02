'use client';

import { motion } from 'framer-motion';
import { Trophy, Flame, Target, TrendingUp, Calendar, Award } from 'lucide-react';
import { useStore } from '@/lib/store';
import { format, startOfWeek, addDays, isSameDay } from 'date-fns';
import { it } from 'date-fns/locale';

export default function Progress() {
  const { streak, activities, user } = useStore();

  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  // Calculate weekly completion
  const weeklyCompletion = weekDays.map((day) => {
    const dayActivities = activities.filter((a) =>
      isSameDay(new Date(a.startTime), day)
    );
    const completed = dayActivities.filter((a) => a.completed).length;
    const total = dayActivities.length;
    return {
      day,
      percentage: total > 0 ? (completed / total) * 100 : 0,
      completed,
      total,
    };
  });

  const totalActivities = activities.length;
  const completedActivities = activities.filter((a) => a.completed).length;
  const completionRate = totalActivities > 0
    ? Math.round((completedActivities / totalActivities) * 100)
    : 0;

  // Achievement levels
  const level = Math.floor(streak.totalPoints / 100) + 1;
  const pointsToNextLevel = 100 - (streak.totalPoints % 100);

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-orange-50 pb-24">
      <div className="max-w-md mx-auto px-6 py-8 space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-2"
        >
          <div className="flex items-center gap-2">
            <Trophy className="w-8 h-8 text-amber-500" />
            <h1 className="text-3xl font-bold text-gray-900">I tuoi progressi</h1>
          </div>
          <p className="text-gray-600">
            Continua così, stai facendo un ottimo lavoro!
          </p>
        </motion.div>

        {/* Streak Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-gradient-to-br from-orange-500 to-red-500 rounded-3xl p-8 text-white shadow-xl"
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Flame className="w-8 h-8" />
                <span className="text-sm font-medium opacity-90">
                  Streak attuale
                </span>
              </div>
              <div className="text-5xl font-bold">{streak.current}</div>
              <div className="text-sm opacity-90 mt-1">giorni consecutivi</div>
            </div>
            <div className="text-right">
              <div className="text-sm font-medium opacity-90 mb-1">
                Record
              </div>
              <div className="text-3xl font-bold">{streak.best}</div>
            </div>
          </div>

          <div className="bg-white/20 backdrop-blur rounded-2xl p-4">
            <div className="flex items-center justify-between text-sm">
              <span className="opacity-90">Punti totali</span>
              <span className="text-2xl font-bold">{streak.totalPoints}</span>
            </div>
          </div>
        </motion.div>

        {/* Level Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl p-6 shadow-sm"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-blue-500 rounded-xl flex items-center justify-center text-white font-bold text-lg">
                {level}
              </div>
              <div>
                <div className="font-bold text-gray-900">Livello {level}</div>
                <div className="text-sm text-gray-600">
                  {pointsToNextLevel} punti al prossimo livello
                </div>
              </div>
            </div>
            <Award className="w-8 h-8 text-amber-500" />
          </div>

          <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${((streak.totalPoints % 100) / 100) * 100}%` }}
              className="h-full bg-gradient-to-r from-purple-500 to-blue-500 rounded-full"
              transition={{ duration: 0.5, ease: 'easeOut' }}
            />
          </div>
        </motion.div>

        {/* Weekly Activity */}
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Calendar className="w-5 h-5 text-gray-700" />
            <h2 className="text-lg font-bold text-gray-900">Questa settimana</h2>
          </div>

          <div className="space-y-3">
            {weeklyCompletion.map((day, index) => (
              <div key={index}>
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="text-gray-700 font-medium">
                    {format(day.day, 'EEE d', { locale: it })}
                  </span>
                  <span className="text-gray-600">
                    {day.completed}/{day.total}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${day.percentage}%` }}
                    transition={{ delay: index * 0.1 }}
                    className={`h-full rounded-full ${
                      day.percentage === 100
                        ? 'bg-gradient-to-r from-green-500 to-emerald-500'
                        : day.percentage >= 50
                        ? 'bg-gradient-to-r from-blue-500 to-purple-500'
                        : 'bg-gradient-to-r from-gray-400 to-gray-500'
                    }`}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-6 text-white"
          >
            <Target className="w-8 h-8 mb-3 opacity-90" />
            <div className="text-3xl font-bold mb-1">{completedActivities}</div>
            <div className="text-sm opacity-90">Attività completate</div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl p-6 text-white"
          >
            <TrendingUp className="w-8 h-8 mb-3 opacity-90" />
            <div className="text-3xl font-bold mb-1">{completionRate}%</div>
            <div className="text-sm opacity-90">Tasso di successo</div>
          </motion.div>
        </div>

        {/* Achievements */}
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Award className="w-5 h-5 text-amber-500" />
            Obiettivi
          </h2>

          <div className="space-y-3">
            {user?.goals && user.goals.length > 0 ? (
              user.goals.map((goal, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-center gap-3 p-3 bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl"
                >
                  <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                  <span className="text-gray-700 font-medium">{goal}</span>
                </motion.div>
              ))
            ) : (
              <p className="text-gray-500 text-sm">
                Nessun obiettivo impostato
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
