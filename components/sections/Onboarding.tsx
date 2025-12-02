'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, Sparkles } from 'lucide-react';
import { useStore } from '@/lib/store';
import { apiClient } from '@/lib/api-client';
import { addDays, setHours, setMinutes } from 'date-fns';

// Interessi principali (ridotti e più grandi)
const mainInterests = [
  { id: 'fitness', label: 'Fitness & Sport', emoji: '💪' },
  { id: 'study', label: 'Studio', emoji: '📚' },
  { id: 'creative', label: 'Creatività & Arte', emoji: '🎨' },
  { id: 'tech', label: 'Tecnologia', emoji: '💻' },
  { id: 'social', label: 'Vita Sociale', emoji: '👥' },
  { id: 'other', label: 'Altro', emoji: '✨' },
];

// Obiettivi principali (ridotti)
const mainGoals = [
  { id: 'productivity', label: 'Più produttivo', emoji: '📈' },
  { id: 'health', label: 'Salute migliore', emoji: '🏃' },
  { id: 'learning', label: 'Imparare di più', emoji: '🧠' },
  { id: 'balance', label: 'Più equilibrio', emoji: '⚖️' },
  { id: 'other', label: 'Altro', emoji: '🎯' },
];

export default function Onboarding() {
  const { setUser, setCurrentSection, addActivity } = useStore();
  const [step, setStep] = useState(1);
  const [name, setName] = useState('');
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [selectedGoals, setSelectedGoals] = useState<string[]>([]);
  const [isStudent, setIsStudent] = useState<boolean | null>(null);

  // Student-specific state
  const [weekType, setWeekType] = useState<'short' | 'long' | null>(null); // corta o lunga
  const [schoolStart, setSchoolStart] = useState('08:00');
  const [schoolEnd, setSchoolEnd] = useState('13:00');

  // Schedule settings
  const [dayStart, setDayStart] = useState('07:00');
  const [dayEnd, setDayEnd] = useState('23:00');

  const toggleInterest = (id: string) => {
    setSelectedInterests((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const toggleGoal = (id: string) => {
    setSelectedGoals((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const createSchoolSchedule = async () => {
    if (!isStudent || !weekType) return;

    const daysOfWeek = weekType === 'short' ? 5 : 6; // lunedì-venerdì o lunedì-sabato
    const today = new Date();
    const currentDay = today.getDay(); // 0=domenica, 1=lunedì, etc.

    // Calcola il lunedì di questa settimana
    const monday = addDays(today, currentDay === 0 ? 1 : 1 - currentDay);

    for (let i = 0; i < daysOfWeek; i++) {
      const day = addDays(monday, i);
      const [startHour, startMin] = schoolStart.split(':').map(Number);
      const [endHour, endMin] = schoolEnd.split(':').map(Number);

      const startTime = setMinutes(setHours(day, startHour), startMin);
      const endTime = setMinutes(setHours(day, endHour), endMin);

      try {
        await apiClient.createActivity({
          title: 'Scuola',
          description: 'Lezioni',
          startTime: startTime.toISOString(),
          endTime: endTime.toISOString(),
          completed: false,
          type: 'scheduled',
          category: 'school',
        });
      } catch (error) {
        console.error('Error creating school activity:', error);
      }
    }
  };

  const handleComplete = async () => {
    try {
      // Update user profile with onboarding data
      const userProfile = {
        name,
        interests: selectedInterests,
        goals: selectedGoals,
        isStudent,
        weekType,
        schoolHours: isStudent ? { start: schoolStart, end: schoolEnd } : undefined,
        dayHours: { start: dayStart, end: dayEnd },
      };

      const response = await apiClient.updateUser(userProfile);

      if (response.success) {
        setUser({
          ...response.user,
          onboardingCompleted: true,
        });

        // Create school schedule if student
        if (isStudent && weekType) {
          await createSchoolSchedule();
        }

        setCurrentSection('today');
      }
    } catch (error) {
      console.error('Error completing onboarding:', error);
      alert('Errore durante il salvataggio del profilo. Riprova.');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 pb-20">
      <div className="max-w-md mx-auto px-6 py-8">
        <AnimatePresence mode="wait">
          {/* Step 1: Nome */}
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-8"
            >
              <div className="text-center space-y-4">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', delay: 0.2 }}
                >
                  <Sparkles className="w-16 h-16 mx-auto text-blue-500" />
                </motion.div>
                <h1 className="text-3xl font-bold text-gray-900">
                  Benvenuto in Kalendary
                </h1>
                <p className="text-gray-600">
                  Il tuo calendario intelligente
                </p>
              </div>

              <div className="space-y-4">
                <label className="block">
                  <span className="text-sm font-medium text-gray-700 mb-2 block">
                    Come ti chiami?
                  </span>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Il tuo nome"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all"
                  />
                </label>

                <motion.button
                  onClick={() => name && setStep(2)}
                  disabled={!name}
                  whileTap={{ scale: 0.98 }}
                  className="w-full bg-blue-500 text-white py-3 rounded-xl font-medium flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-600 transition-colors"
                >
                  Continua
                  <ChevronRight className="w-5 h-5" />
                </motion.button>
              </div>
            </motion.div>
          )}

          {/* Step 2: Sei studente? */}
          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div className="space-y-2">
                <h2 className="text-2xl font-bold text-gray-900">
                  Ciao {name}!
                </h2>
                <p className="text-gray-600">Sei uno studente?</p>
              </div>

              <div className="space-y-3">
                <motion.button
                  onClick={() => {
                    setIsStudent(true);
                    setStep(3);
                  }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full p-6 rounded-xl border-2 border-gray-200 bg-white hover:border-blue-500 hover:bg-blue-50 transition-all"
                >
                  <div className="text-xl font-bold text-gray-900 mb-1">Sì, sono studente</div>
                  <div className="text-sm text-gray-600">Configurerò il tuo orario scolastico</div>
                </motion.button>

                <motion.button
                  onClick={() => {
                    setIsStudent(false);
                    setStep(5);
                  }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full p-6 rounded-xl border-2 border-gray-200 bg-white hover:border-blue-500 hover:bg-blue-50 transition-all"
                >
                  <div className="text-xl font-bold text-gray-900 mb-1">No, non sono studente</div>
                  <div className="text-sm text-gray-600">Passerò alla configurazione generale</div>
                </motion.button>
              </div>
            </motion.div>
          )}

          {/* Step 3: Tipo settimana (solo studenti) */}
          {step === 3 && isStudent && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div className="space-y-2">
                <h2 className="text-2xl font-bold text-gray-900">
                  Tipo di settimana scolastica
                </h2>
                <p className="text-gray-600">Fai la settimana corta o lunga?</p>
              </div>

              <div className="space-y-3">
                <motion.button
                  onClick={() => {
                    setWeekType('short');
                    setStep(4);
                  }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full p-6 rounded-xl border-2 border-gray-200 bg-white hover:border-blue-500 hover:bg-blue-50 transition-all"
                >
                  <div className="text-xl font-bold text-gray-900 mb-1">Settimana corta</div>
                  <div className="text-sm text-gray-600">Lunedì - Venerdì</div>
                </motion.button>

                <motion.button
                  onClick={() => {
                    setWeekType('long');
                    setStep(4);
                  }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full p-6 rounded-xl border-2 border-gray-200 bg-white hover:border-blue-500 hover:bg-blue-50 transition-all"
                >
                  <div className="text-xl font-bold text-gray-900 mb-1">Settimana lunga</div>
                  <div className="text-sm text-gray-600">Lunedì - Sabato</div>
                </motion.button>
              </div>
            </motion.div>
          )}

          {/* Step 4: Orari scuola (solo studenti) */}
          {step === 4 && isStudent && (
            <motion.div
              key="step4"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div className="space-y-2">
                <h2 className="text-2xl font-bold text-gray-900">
                  Orario scolastico
                </h2>
                <p className="text-gray-600">A che ora inizi e finisci?</p>
              </div>

              <div className="space-y-4">
                <label className="block">
                  <span className="text-sm font-medium text-gray-700 mb-2 block">
                    Inizio lezioni
                  </span>
                  <input
                    type="time"
                    value={schoolStart}
                    onChange={(e) => setSchoolStart(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all"
                  />
                </label>

                <label className="block">
                  <span className="text-sm font-medium text-gray-700 mb-2 block">
                    Fine lezioni
                  </span>
                  <input
                    type="time"
                    value={schoolEnd}
                    onChange={(e) => setSchoolEnd(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all"
                  />
                </label>

                <motion.button
                  onClick={() => setStep(5)}
                  whileTap={{ scale: 0.98 }}
                  className="w-full bg-blue-500 text-white py-3 rounded-xl font-medium flex items-center justify-center gap-2 hover:bg-blue-600 transition-colors"
                >
                  Continua
                  <ChevronRight className="w-5 h-5" />
                </motion.button>
              </div>
            </motion.div>
          )}

          {/* Step 5: Interessi */}
          {step === 5 && (
            <motion.div
              key="step5"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div className="space-y-2">
                <h2 className="text-2xl font-bold text-gray-900">
                  I tuoi interessi
                </h2>
                <p className="text-gray-600">
                  Seleziona almeno 2 categorie
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {mainInterests.map((interest) => (
                  <motion.button
                    key={interest.id}
                    onClick={() => toggleInterest(interest.id)}
                    whileTap={{ scale: 0.95 }}
                    className={`p-6 rounded-xl border-2 transition-all ${
                      selectedInterests.includes(interest.id)
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 bg-white hover:border-gray-300'
                    }`}
                  >
                    <div className="text-3xl mb-2">{interest.emoji}</div>
                    <div className="text-base font-semibold text-gray-900 text-center">
                      {interest.label}
                    </div>
                  </motion.button>
                ))}
              </div>

              <motion.button
                onClick={() => selectedInterests.length >= 2 && setStep(6)}
                disabled={selectedInterests.length < 2}
                whileTap={{ scale: 0.98 }}
                className="w-full bg-blue-500 text-white py-3 rounded-xl font-medium flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-600 transition-colors"
              >
                Continua
                <ChevronRight className="w-5 h-5" />
              </motion.button>
            </motion.div>
          )}

          {/* Step 6: Obiettivi */}
          {step === 6 && (
            <motion.div
              key="step6"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div className="space-y-2">
                <h2 className="text-2xl font-bold text-gray-900">
                  I tuoi obiettivi
                </h2>
                <p className="text-gray-600">
                  Cosa vuoi migliorare? (almeno 1)
                </p>
              </div>

              <div className="space-y-3">
                {mainGoals.map((goal) => (
                  <motion.button
                    key={goal.id}
                    onClick={() => toggleGoal(goal.id)}
                    whileTap={{ scale: 0.98 }}
                    className={`w-full p-5 rounded-xl border-2 transition-all flex items-center gap-3 ${
                      selectedGoals.includes(goal.id)
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 bg-white hover:border-gray-300'
                    }`}
                  >
                    <span className="text-2xl">{goal.emoji}</span>
                    <span className="text-base font-semibold text-gray-900">
                      {goal.label}
                    </span>
                  </motion.button>
                ))}
              </div>

              <motion.button
                onClick={() => selectedGoals.length >= 1 && setStep(7)}
                disabled={selectedGoals.length < 1}
                whileTap={{ scale: 0.98 }}
                className="w-full bg-blue-500 text-white py-3 rounded-xl font-medium flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-600 transition-colors"
              >
                Continua
                <ChevronRight className="w-5 h-5" />
              </motion.button>
            </motion.div>
          )}

          {/* Step 7: Orari giornata */}
          {step === 7 && (
            <motion.div
              key="step7"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div className="space-y-2">
                <h2 className="text-2xl font-bold text-gray-900">
                  Orari della giornata
                </h2>
                <p className="text-gray-600">
                  Personalizza la tua fascia oraria attiva
                </p>
              </div>

              <div className="space-y-4">
                <label className="block">
                  <span className="text-sm font-medium text-gray-700 mb-2 block">
                    Inizio giornata
                  </span>
                  <input
                    type="time"
                    value={dayStart}
                    onChange={(e) => setDayStart(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all"
                  />
                </label>

                <label className="block">
                  <span className="text-sm font-medium text-gray-700 mb-2 block">
                    Fine giornata
                  </span>
                  <input
                    type="time"
                    value={dayEnd}
                    onChange={(e) => setDayEnd(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all"
                  />
                </label>

                <motion.button
                  onClick={handleComplete}
                  whileTap={{ scale: 0.98 }}
                  className="w-full bg-gradient-to-r from-blue-500 to-purple-500 text-white py-3 rounded-xl font-medium flex items-center justify-center gap-2 hover:shadow-lg transition-all"
                >
                  Inizia
                  <Sparkles className="w-5 h-5" />
                </motion.button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Progress indicator */}
        <div className="flex justify-center gap-2 mt-8">
          {[1, 2, 3, 4, 5, 6, 7].map((s) => {
            // Skip steps based on student status
            const maxStep = isStudent === false && s > 2 && s < 5 ? null : s;
            if (maxStep === null) return null;

            return (
              <div
                key={s}
                className={`h-2 rounded-full transition-all ${
                  s === step ? 'w-8 bg-blue-500' : s < step ? 'w-2 bg-blue-300' : 'w-2 bg-gray-300'
                }`}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}
