'use client';

import Link from 'next/link';
import { Bell, Menu, Settings, X } from 'lucide-react';
import Button from '@/components/ui/Button';
import { useState } from 'react';
import Sidebar from './Sidebar';

export default function Header() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <>
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="flex items-center justify-between px-4 py-3 lg:px-6">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              className="lg:hidden"
              aria-label="Toggle menu"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </Button>

            <Link href="/" className="flex items-center gap-2">
              <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-blue-600">
                <Bell className="h-5 w-5 text-white" />
              </div>
              <span className="font-bold text-xl text-gray-900 hidden sm:block">
                Discord Task Scheduler
              </span>
            </Link>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" aria-label="Settings">
              <Settings className="h-5 w-5" />
            </Button>

            <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center">
              <span className="text-sm font-medium text-white">A</span>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            onClick={() => setIsMobileMenuOpen(false)}
          />
          
          {/* Mobile Sidebar */}
          <div className="fixed inset-y-0 left-0 z-50 w-64 lg:hidden">
            <Sidebar onNavigate={() => setIsMobileMenuOpen(false)} />
          </div>
        </>
      )}
    </>
  );
}
