import { useState, useEffect, useCallback } from 'react';

export interface AppSettings {
  appearance: 'system' | 'light' | 'dark';
  language: string;
  soundEffects: boolean;
  notifications: boolean;
  emailNotifications: boolean;
}

const defaultSettings: AppSettings = {
  appearance: 'dark',
  language: 'auto',
  soundEffects: true,
  notifications: true,
  emailNotifications: true,
};

export const useSettings = () => {
  const [settings, setSettings] = useState<AppSettings>(() => {
    return {
      appearance: (localStorage.getItem('appearance') as AppSettings['appearance']) || defaultSettings.appearance,
      language: localStorage.getItem('language') || defaultSettings.language,
      soundEffects: localStorage.getItem('soundEffects') !== 'false',
      notifications: localStorage.getItem('notifications') !== 'false',
      emailNotifications: localStorage.getItem('emailNotifications') !== 'false',
    };
  });

  // Apply appearance/theme
  useEffect(() => {
    const root = document.documentElement;
    if (settings.appearance === 'light') {
      root.classList.remove('dark');
    } else if (settings.appearance === 'dark') {
      root.classList.add('dark');
    } else {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (prefersDark) {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
    }
  }, [settings.appearance]);

  // Apply language
  useEffect(() => {
    if (settings.language !== 'auto') {
      document.documentElement.lang = settings.language;
    } else {
      document.documentElement.lang = navigator.language.split('-')[0] || 'en';
    }
  }, [settings.language]);

  const updateSetting = useCallback(<K extends keyof AppSettings>(key: K, value: AppSettings[K]) => {
    setSettings(prev => ({ ...prev, [key]: value }));
    localStorage.setItem(key, String(value));
  }, []);

  const playSound = useCallback((soundType: 'send' | 'receive' | 'error') => {
    if (!settings.soundEffects) return;
    
    // Create simple audio feedback using Web Audio API
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    switch (soundType) {
      case 'send':
        oscillator.frequency.value = 880;
        oscillator.type = 'sine';
        gainNode.gain.value = 0.1;
        break;
      case 'receive':
        oscillator.frequency.value = 660;
        oscillator.type = 'sine';
        gainNode.gain.value = 0.1;
        break;
      case 'error':
        oscillator.frequency.value = 220;
        oscillator.type = 'square';
        gainNode.gain.value = 0.05;
        break;
    }
    
    oscillator.start();
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
    oscillator.stop(audioContext.currentTime + 0.1);
  }, [settings.soundEffects]);

  return {
    settings,
    updateSetting,
    playSound,
  };
};
