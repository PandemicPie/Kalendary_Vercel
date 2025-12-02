'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { User, Settings, Heart, Target, LogOut, Bell, Moon, Sun, Trash2 } from 'lucide-react';
import { useStore } from '@/lib/store';
import { useTheme } from '@/components/ThemeProvider';
import {
  initializeNotifications,
  areNotificationsSupported,
  getNotificationPermission,
  showLocalNotification
} from '@/lib/notification-service';

export default function Profile() {
  const { user, activities, setUser, setCurrentSection } = useStore();
  const { theme, toggleTheme } = useTheme();
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);

  const stats = {
    totalActivities: activities.length,
    completed: activities.filter((a) => a.completed).length,
    interests: user?.interests?.length || 0,
    goals: user?.goals?.length || 0,
  };

  // Check notification preferences
  useEffect(() => {
    // Check notification status
    if (areNotificationsSupported()) {
      const isEnabled = localStorage.getItem('notificationsEnabled') === 'true';
      const hasPermission = getNotificationPermission() === 'granted';
      setNotificationsEnabled(isEnabled && hasPermission);
    }
  }, []);

  // Handle logout
  const handleLogout = () => {
    if (confirm('Sei sicuro di voler uscire?')) {
      // Clear all data
      localStorage.removeItem('kalendary-storage');
      localStorage.removeItem('token');
      localStorage.removeItem('user');

      // Reset user in store
      setUser(null);

      // Reload page to go back to login/onboarding
      window.location.reload();
    }
  };

  // Reset app data (for testing)
  const handleResetApp = () => {
    if (confirm('Sei sicuro di voler cancellare TUTTI i dati? Questa azione è irreversibile!')) {
      localStorage.clear();
      window.location.reload();
    }
  };

  // Toggle notifications
  const toggleNotifications = async () => {
    if (!areNotificationsSupported()) {
      alert('Le notifiche non sono supportate su questo dispositivo');
      return;
    }

    if (!notificationsEnabled) {
      // Initialize notifications
      const success = await initializeNotifications();
      if (success) {
        setNotificationsEnabled(true);
        localStorage.setItem('notificationsEnabled', 'true');

        // Show test notification
        await showLocalNotification(
          '🎉 Notifiche attivate!',
          {
            body: 'Riceverai promemoria per le tue attività e suggerimenti AI',
            tag: 'notifications-enabled',
          }
        );
      } else {
        alert('Impossibile attivare le notifiche. Controlla le impostazioni del browser.');
      }
    } else {
      setNotificationsEnabled(false);
      localStorage.setItem('notificationsEnabled', 'false');

      // Show notification disabled message
      alert('Notifiche disattivate. Puoi riattivarle in qualsiasi momento.');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 pb-24">
      <div className="max-w-md mx-auto px-6 py-8 space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-4"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', delay: 0.2 }}
            className="w-24 h-24 mx-auto bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white text-4xl font-bold shadow-lg"
          >
            {user?.name?.charAt(0).toUpperCase() || 'U'}
          </motion.div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              {user?.name || 'Utente'}
            </h1>
            <p className="text-gray-600 dark:text-gray-400">Membro Kalendary</p>
          </div>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
            className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-lg text-center"
          >
            <div className="text-3xl font-bold text-blue-500 mb-1">
              {stats.totalActivities}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Attività totali</div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-lg text-center"
          >
            <div className="text-3xl font-bold text-green-500 mb-1">
              {stats.completed}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Completate</div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
            className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-lg text-center"
          >
            <div className="text-3xl font-bold text-purple-500 mb-1">
              {stats.interests}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Interessi</div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4 }}
            className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-lg text-center"
          >
            <div className="text-3xl font-bold text-orange-500 mb-1">
              {stats.goals}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Obiettivi</div>
          </motion.div>
        </div>

        {/* Interests */}
        {user?.interests && user.interests.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg"
          >
            <div className="flex items-center gap-2 mb-4">
              <Heart className="w-5 h-5 text-pink-500" />
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">I tuoi interessi</h2>
            </div>
            <div className="flex flex-wrap gap-2">
              {user.interests.map((interest) => (
                <span
                  key={interest}
                  className="px-3 py-1.5 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded-full text-sm font-medium"
                >
                  {interest}
                </span>
              ))}
            </div>
          </motion.div>
        )}

        {/* Goals */}
        {user?.goals && user.goals.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg"
          >
            <div className="flex items-center gap-2 mb-4">
              <Target className="w-5 h-5 text-green-500" />
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">I tuoi obiettivi</h2>
            </div>
            <div className="space-y-2">
              {user.goals.map((goal, index) => (
                <div
                  key={index}
                  className="flex items-center gap-3 p-3 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/30 dark:to-emerald-900/30 rounded-xl"
                >
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-gray-700 dark:text-gray-300 font-medium">{goal}</span>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Settings */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white px-6 pt-6 pb-4 flex items-center gap-2">
            <Settings className="w-5 h-5 text-gray-700 dark:text-gray-300" />
            Impostazioni
          </h2>

          <div className="divide-y divide-gray-100 dark:divide-gray-700">
            {/* Notifications Toggle */}
            <button
              onClick={toggleNotifications}
              className="w-full px-6 py-4 flex items-center gap-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-left"
            >
              <Bell className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              <div className="flex-1">
                <div className="font-medium text-gray-900 dark:text-white">Notifiche</div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  {notificationsEnabled ? 'Attive' : 'Disattivate'}
                </div>
              </div>
              <div className={`w-12 h-6 rounded-full transition-colors ${notificationsEnabled ? 'bg-blue-500' : 'bg-gray-300'}`}>
                <div className={`w-5 h-5 bg-white rounded-full shadow-md transition-transform transform ${notificationsEnabled ? 'translate-x-6' : 'translate-x-0.5'} mt-0.5`} />
              </div>
            </button>

            {/* Dark Mode Toggle */}
            <button
              onClick={toggleTheme}
              className="w-full px-6 py-4 flex items-center gap-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-left"
            >
              {theme === 'dark' ? (
                <Sun className="w-5 h-5 text-yellow-500" />
              ) : (
                <Moon className="w-5 h-5 text-gray-600" />
              )}
              <div className="flex-1">
                <div className="font-medium text-gray-900 dark:text-white">
                  {theme === 'dark' ? 'Tema Chiaro' : 'Tema Scuro'}
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  {theme === 'dark' ? 'Passa al tema chiaro' : 'Attiva il tema scuro'}
                </div>
              </div>
              <div className={`w-12 h-6 rounded-full transition-colors ${theme === 'dark' ? 'bg-blue-500' : 'bg-gray-300'}`}>
                <div className={`w-5 h-5 bg-white rounded-full shadow-md transition-transform transform ${theme === 'dark' ? 'translate-x-6' : 'translate-x-0.5'} mt-0.5`} />
              </div>
            </button>

            {/* Reset App (for testing) */}
            <button
              onClick={handleResetApp}
              className="w-full px-6 py-4 flex items-center gap-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-left"
            >
              <Trash2 className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              <div className="flex-1">
                <div className="font-medium text-gray-900 dark:text-white">
                  Reset App
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  Cancella tutti i dati (per testing)
                </div>
              </div>
            </button>
          </div>
        </div>

        {/* Logout */}
        <motion.button
          onClick={handleLogout}
          whileTap={{ scale: 0.98 }}
          className="w-full bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 py-4 rounded-2xl font-medium flex items-center justify-center gap-2 hover:bg-red-100 dark:hover:bg-red-900/50 transition-colors shadow-lg"
        >
          <LogOut className="w-5 h-5" />
          Esci
        </motion.button>

        {/* App Info */}
        <div className="text-center text-sm text-gray-500 dark:text-gray-400 space-y-1">
          <p>Kalendary v1.0.0</p>
          <p>Powered by AI</p>
        </div>
      </div>
    </div>
  );
}
