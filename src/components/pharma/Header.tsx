'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { Menu, X } from 'lucide-react';

import { API_SOURCES } from '@/lib/knowledge-base';
import UserMenu from '@/components/pharma/UserMenu';
import AuthModal from '@/components/pharma/AuthModal';
import { useAuth } from '@/lib/auth';

const NAV_ITEMS = [
  { href: '/', label: 'Home' },
  { href: '/interaction', label: 'Interaction' },
  { href: '/pharmacology', label: 'Pharmacology & Phytochemistry' },
  { href: '/saved', label: 'Saved', authOnly: true },
];

export default function Header() {
  const pathname = usePathname();
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { isAuthenticated } = useAuth();

  const visibleNavItems = NAV_ITEMS.filter((item) => !item.authOnly || isAuthenticated);

  const closeMobileMenu = () => setMobileMenuOpen(false);

  return (
    <header className="bg-white/90 backdrop-blur-xl border-b border-gray-300/70 sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 md:px-8 lg:px-12 py-3 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3 group" onClick={closeMobileMenu}>
          {/* Standalone Icon — Shield + Green Leaf + Molecular Dot on White */}
          <div className="w-[4.75rem] h-[4.25rem] bg-white rounded-xl flex items-center justify-center shadow-sm border border-gray-200/80 group-hover:shadow-md transition-shadow">
            <svg width="34" height="34" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
              {/* Dark shield outline */}
              <path d="M16 2L5 7.5V15C5 21.5 9.5 27.2 16 29C22.5 27.2 27 21.5 27 15V7.5L16 2Z" fill="#0f172a" fillOpacity="0.08" stroke="#0f172a" strokeWidth="1.8" strokeLinejoin="round"/>
              {/* Green leaf */}
              <path d="M10 20C10 20 12 14 18 12C18 12 16 18 10 20Z" fill="#059669" fillOpacity="0.9" stroke="#059669" strokeWidth="0.7"/>
              <path d="M12 17C13 15 15 13.5 18 12" stroke="#0f172a" strokeWidth="0.7" strokeLinecap="round" fill="none" strokeOpacity="0.4"/>
              {/* Small molecular/scientific dot */}
              <circle cx="20" cy="9" r="1.6" fill="#0f172a" fillOpacity="0.85"/>
              <circle cx="23" cy="11" r="1" fill="#0f172a" fillOpacity="0.45"/>
              <line x1="21.4" y1="9.6" x2="22.3" y2="10.4" stroke="#0f172a" strokeWidth="0.6" strokeOpacity="0.45"/>
            </svg>
          </div>
          <div className="flex flex-col">
            <h1 className="text-xl md:text-2xl font-extrabold tracking-tight text-[#0f172a] leading-tight">PharmaInsight</h1>
            <p className="text-[11px] md:text-xs font-semibold text-slate-700 tracking-wide leading-tight">Dr. Mahmoud Evidence-Based Drug–Herb Intelligence</p>
            <span className="inline-block mt-0.5 px-2 py-0.5 bg-white rounded text-[11px] md:text-xs font-bold text-slate-700 tracking-[0.15em] uppercase leading-tight border border-gray-200/80">Evidence-Based Only</span>
          </div>
        </Link>

        <div className="hidden md:flex items-center gap-2">
          {API_SOURCES.map((s) => (
            <div key={s.name} className="flex items-center gap-1.5 px-2.5 py-1 bg-gray-50 border border-gray-200 rounded-md">
              <div className={`w-2 h-2 rounded-full ${s.color}`}></div>
              <span className="text-[11px] font-bold text-gray-700">{s.name}</span>
            </div>
          ))}
        </div>

        {/* Desktop: UserMenu directly | Mobile: hamburger + UserMenu */}
        <div className="flex items-center gap-2">
          <div className="hidden md:block">
            <UserMenu onSignInClick={() => setAuthModalOpen(true)} />
          </div>
          <button
            className="md:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? (
              <X size={20} className="text-gray-700" />
            ) : (
              <Menu size={20} className="text-gray-700" />
            )}
          </button>
        </div>
      </div>

      {/* Desktop Navigation */}
      <div className="hidden md:block max-w-6xl mx-auto px-4 md:px-8 lg:px-12 pb-2.5">
        <nav className="flex gap-1" aria-label="Main navigation">
          {visibleNavItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`relative px-4 py-2.5 rounded-lg text-[15px] font-bold transition-all whitespace-nowrap ${
                  isActive
                    ? 'text-[#0f172a] bg-gray-100'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
                aria-current={isActive ? 'page' : undefined}
              >
                {item.label}
                {isActive && (
                  <span className="absolute bottom-0 left-2 right-2 h-[3px] bg-[#0f172a] rounded-full" />
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Mobile Navigation */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-gray-200 bg-white">
          <nav className="flex flex-col px-4 py-2" aria-label="Mobile navigation">
            {visibleNavItems.map((item) => {
              const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={closeMobileMenu}
                  className={`px-4 py-3 rounded-lg text-[15px] font-bold transition-all ${
                    isActive
                      ? 'text-[#0f172a] bg-gray-100'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                  aria-current={isActive ? 'page' : undefined}
                >
                  {item.label}
                </Link>
              );
            })}
            <div className="px-4 py-3 border-t border-gray-200 mt-1">
              <UserMenu onSignInClick={() => { setAuthModalOpen(true); closeMobileMenu(); }} />
            </div>
          </nav>
        </div>
      )}

      <AuthModal isOpen={authModalOpen} onClose={() => setAuthModalOpen(false)} />
    </header>
  );
}
