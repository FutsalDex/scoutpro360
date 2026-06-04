
'use client';

import React from 'react';
import { useTranslation } from '@/lib/i18n/context';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Globe } from 'lucide-react';

export function LanguageSwitcher() {
  const { language, setLanguage } = useTranslation();

  const languages = [
    { code: 'en', label: 'English', flag: '🇬🇧' },
    { code: 'es', label: 'Español', flag: '🇪🇸' },
  ];

  const currentLang = languages.find((l) => l.code === language);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="h-9 px-3 gap-3 bg-secondary/50 border-border/50 hover:bg-secondary">
          <div className="flex items-center gap-1.5 font-black text-[12px] tracking-widest">
            <span className="text-base leading-none">{currentLang?.flag}</span>
            <span className="text-foreground">{currentLang?.code.toUpperCase()}</span>
          </div>
          <Globe className="h-3.5 w-3.5 text-muted-foreground" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44 bg-[#1b263b] border-border/40 shadow-2xl p-1.5">
        {languages.map((lang) => (
          <DropdownMenuItem
            key={lang.code}
            onClick={() => setLanguage(lang.code as 'en' | 'es')}
            className={`flex items-center gap-3 py-2.5 px-4 cursor-pointer transition-all rounded-lg mb-1 last:mb-0 ${
              language === lang.code 
                ? 'bg-primary/20 text-primary font-bold' 
                : 'hover:bg-white/5 text-foreground/80'
            }`}
          >
            <span className="text-lg leading-none w-6">{lang.flag}</span>
            <span className="text-sm font-medium">{lang.label}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
