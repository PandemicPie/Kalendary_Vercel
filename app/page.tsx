'use client';

import { useState, useEffect } from 'react';
import { useStore } from '@/lib/store';
import { apiClient } from '@/lib/api-client';
import { ThemeProvider } from '@/components/ThemeProvider';
import BottomNav from '@/components/BottomNav';
import Auth from '@/components/Auth';
import Onboarding from '@/components/sections/Onboarding';
import Today from '@/components/sections/Today';
import Calendar from '@/components/sections/Calendar';
import Activities from '@/components/sections/Activities';
import Progress from '@/components/sections/Progress';
import Profile from '@/components/sections/Profile';
import { motion, AnimatePresence } from 'framer-motion';

export default function Home() {
  const { user, currentSection, setUser, setActivities } = useStore();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  // Check for existing token and validate it
  useEffect(() => {
    const validateToken = async () => {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

      if (!token) {
        setLoading(false);
        return;
      }

      try {
        apiClient.setToken(token);
        const response = await apiClient.getUser();

        if (response.success) {
          setUser(response.user);
          setIsAuthenticated(true);

          // Load activities from API
          const activitiesResponse = await apiClient.getActivities();
          if (activitiesResponse.activities) {
            setActivities(activitiesResponse.activities);
          }
        } else {
          // Invalid token, clear it
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          apiClient.clearToken();
        }
      } catch (error) {
        console.error('Token validation failed:', error);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        apiClient.clearToken();
      }

      setLoading(false);
    };

    validateToken();
  }, [setUser, setActivities]);

  const handleLogin = async (userData: any, token: string) => {
    apiClient.setToken(token);
    setUser(userData);
    setIsAuthenticated(true);

    // Load activities after login
    try {
      const activitiesResponse = await apiClient.getActivities();
      if (activitiesResponse.activities) {
        setActivities(activitiesResponse.activities);
      }
    } catch (error) {
      console.error('Error loading activities:', error);
    }
  };

  // Loading screen
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 flex items-center justify-center">
        <div className="text-center">
          <div className="w-20 h-20 bg-white rounded-full mx-auto mb-4 flex items-center justify-center">
            <span className="text-4xl">📅</span>
          </div>
          <div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin mx-auto"></div>
        </div>
      </div>
    );
  }

  // Show auth if not authenticated
  if (!isAuthenticated) {
    return (
      <ThemeProvider>
        <Auth onLogin={handleLogin} />
      </ThemeProvider>
    );
  }

  // Show onboarding if user hasn't completed it
  if (!user || !user.onboardingCompleted) {
    return (
      <ThemeProvider>
        <Onboarding />
      </ThemeProvider>
    );
  }

  const renderSection = () => {
    switch (currentSection) {
      case 'today':
        return <Today />;
      case 'calendar':
        return <Calendar />;
      case 'activities':
        return <Activities />;
      case 'progress':
        return <Progress />;
      case 'profile':
        return <Profile />;
      default:
        return <Today />;
    }
  };

  return (
    <ThemeProvider>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentSection}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
          >
            {renderSection()}
          </motion.div>
        </AnimatePresence>

        <BottomNav />
      </div>
    </ThemeProvider>
  );
}
