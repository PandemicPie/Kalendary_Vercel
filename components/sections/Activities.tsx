'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, RefreshCw, Plus, Zap } from 'lucide-react';
import { useStore } from '@/lib/store';
import { lmStudio } from '@/lib/lm-studio';

export default function Activities() {
  const { user, activities, aiSuggestions, setAiSuggestions, addActivity } = useStore();
  const [loading, setLoading] = useState(false);
  const [motivationalMessage, setMotivationalMessage] = useState('');

  const loadSuggestions = async () => {
    setLoading(true);
    try {
      const suggestions = await lmStudio.analyzeFreeTime(activities, user);
      setAiSuggestions(suggestions);
    } catch (error) {
      console.error('Error loading suggestions:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (aiSuggestions.length === 0 && user) {
      loadSuggestions();
    }
  }, [user]);

  const handleAddSuggestion = (suggestion: string) => {
    const now = new Date();
    const endTime = new Date(now.getTime() + 60 * 60 * 1000); // 1 hour later

    addActivity({
      id: Date.now().toString(),
      title: suggestion,
      description: 'Attività suggerita da AI',
      startTime: now,
      endTime: endTime,
      completed: false,
      type: 'suggested',
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 pb-24">
      <div className="max-w-md mx-auto px-6 py-8 space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-2"
        >
          <div className="flex items-center gap-2">
            <Sparkles className="w-8 h-8 text-purple-500" />
            <h1 className="text-3xl font-bold text-gray-900">Scopri</h1>
          </div>
          <p className="text-gray-600">
            Attività personalizzate per te, basate sui tuoi interessi
          </p>
        </motion.div>

        {/* Motivational message */}
        {motivationalMessage && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-gradient-to-r from-amber-500 to-orange-500 rounded-2xl p-6 text-white shadow-lg"
          >
            <div className="flex items-start gap-3">
              <Zap className="w-6 h-6 flex-shrink-0 mt-1" />
              <p className="text-sm leading-relaxed">{motivationalMessage}</p>
            </div>
          </motion.div>
        )}

        {/* User interests */}
        {user?.interests && user.interests.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl p-6 shadow-sm"
          >
            <h2 className="text-lg font-bold text-gray-900 mb-3">
              I tuoi interessi
            </h2>
            <div className="flex flex-wrap gap-2">
              {user.interests.map((interest) => (
                <span
                  key={interest}
                  className="px-3 py-1.5 bg-purple-100 text-purple-700 rounded-full text-sm font-medium"
                >
                  {interest}
                </span>
              ))}
            </div>
          </motion.div>
        )}

        {/* AI Suggestions */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900">
              Suggerimenti AI
            </h2>
            <motion.button
              onClick={loadSuggestions}
              whileTap={{ scale: 0.95 }}
              disabled={loading}
              className="p-2 bg-purple-500 text-white rounded-xl hover:bg-purple-600 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
            </motion.button>
          </div>

          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="bg-white rounded-2xl p-6 shadow-sm animate-pulse"
                >
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-3"></div>
                  <div className="h-3 bg-gray-200 rounded w-full mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                </div>
              ))}
            </div>
          ) : aiSuggestions.length > 0 ? (
            <div className="space-y-3">
              {aiSuggestions.map((suggestion, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <p className="text-gray-800 leading-relaxed">
                        {suggestion}
                      </p>
                    </div>
                    <motion.button
                      onClick={() => handleAddSuggestion(suggestion)}
                      whileTap={{ scale: 0.95 }}
                      className="flex-shrink-0 p-2 bg-purple-100 text-purple-600 rounded-xl hover:bg-purple-200 transition-colors"
                    >
                      <Plus className="w-5 h-5" />
                    </motion.button>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-white rounded-2xl p-12 text-center shadow-sm"
            >
              <Sparkles className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <p className="text-gray-600 mb-4">
                Carica i suggerimenti AI personalizzati per te
              </p>
              <button
                onClick={loadSuggestions}
                className="px-6 py-3 bg-purple-500 text-white rounded-xl font-medium hover:bg-purple-600 transition-colors"
              >
                Genera suggerimenti
              </button>
            </motion.div>
          )}
        </div>

        {/* Quick actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-blue-500 to-purple-500 rounded-2xl p-6 text-white shadow-lg"
        >
          <h3 className="text-lg font-bold mb-3">Azioni rapide</h3>
          <div className="space-y-2">
            <button className="w-full bg-white/20 backdrop-blur rounded-xl p-3 text-left hover:bg-white/30 transition-colors">
              <div className="font-medium">💪 Sessione di fitness</div>
              <div className="text-sm opacity-90">30 minuti di allenamento</div>
            </button>
            <button className="w-full bg-white/20 backdrop-blur rounded-xl p-3 text-left hover:bg-white/30 transition-colors">
              <div className="font-medium">📚 Lettura</div>
              <div className="text-sm opacity-90">15 minuti di lettura</div>
            </button>
            <button className="w-full bg-white/20 backdrop-blur rounded-xl p-3 text-left hover:bg-white/30 transition-colors">
              <div className="font-medium">🧘 Meditazione</div>
              <div className="text-sm opacity-90">10 minuti di mindfulness</div>
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
