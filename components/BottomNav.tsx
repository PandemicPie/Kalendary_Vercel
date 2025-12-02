'use client';

import { Calendar, CheckSquare, Sparkles, Trophy, User } from 'lucide-react';
import { motion } from 'framer-motion';
import { useStore } from '@/lib/store';

const navItems = [
  { id: 'today', icon: CheckSquare, label: 'Oggi' },
  { id: 'calendar', icon: Calendar, label: 'Calendario' },
  { id: 'activities', icon: Sparkles, label: 'Scopri' },
  { id: 'progress', icon: Trophy, label: 'Progressi' },
  { id: 'profile', icon: User, label: 'Profilo' },
];

export default function BottomNav() {
  const { currentSection, setCurrentSection } = useStore();

  return (
    <motion.nav
      initial={{ y: 100 }}
      animate={{ y: 0 }}
      className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-lg border-t border-gray-200 pb-safe z-50"
    >
      <div className="max-w-md mx-auto px-4">
        <div className="flex items-center justify-around h-16">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentSection === item.id;

            return (
              <button
                key={item.id}
                onClick={() => setCurrentSection(item.id)}
                className="relative flex flex-col items-center justify-center w-16 h-full group"
              >
                <motion.div
                  animate={{
                    scale: isActive ? 1.1 : 1,
                    color: isActive ? '#3b82f6' : '#6b7280',
                  }}
                  className="relative"
                >
                  <Icon className="w-6 h-6" />
                  {isActive && (
                    <motion.div
                      layoutId="activeTab"
                      className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-1 h-1 bg-blue-500 rounded-full"
                      transition={{
                        type: 'spring',
                        stiffness: 500,
                        damping: 30,
                      }}
                    />
                  )}
                </motion.div>
                <span
                  className={`text-xs mt-1 transition-colors ${
                    isActive ? 'text-blue-500 font-medium' : 'text-gray-500'
                  }`}
                >
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </motion.nav>
  );
}
