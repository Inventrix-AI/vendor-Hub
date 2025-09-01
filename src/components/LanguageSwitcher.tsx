'use client';

import { Languages } from 'lucide-react';
import { useLanguage } from '@/lib/language';

export default function LanguageSwitcher() {
  const { language, setLanguage } = useLanguage();

  return (
    <div className="flex items-center space-x-2">
      <Languages className="w-4 h-4 text-neutral-600" />
      <div className="flex bg-neutral-100 rounded-lg p-1">
        <button
          onClick={() => setLanguage('hi')}
          className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all duration-200 ${
            language === 'hi'
              ? 'bg-white text-blue-600 shadow-sm'
              : 'text-neutral-600 hover:text-neutral-800'
          }`}
        >
          हिं
        </button>
        <button
          onClick={() => setLanguage('en')}
          className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all duration-200 ${
            language === 'en'
              ? 'bg-white text-blue-600 shadow-sm'
              : 'text-neutral-600 hover:text-neutral-800'
          }`}
        >
          EN
        </button>
      </div>
    </div>
  );
}