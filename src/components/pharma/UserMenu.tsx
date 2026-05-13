'use client';

import { useAuth } from '@/lib/auth';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { LogOut, Bookmark, User } from 'lucide-react';
import Link from 'next/link';

interface UserMenuProps {
  onSignInClick: () => void;
}

export default function UserMenu({ onSignInClick }: UserMenuProps) {
  const { user, isAuthenticated, signOut } = useAuth();

  if (!isAuthenticated) {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={onSignInClick}
        className="h-8 px-3 text-xs font-semibold border-gray-200 text-gray-700 hover:bg-[#0f172a] hover:text-white hover:border-[#0f172a] transition-colors"
      >
        <User size={14} />
        Sign In
      </Button>
    );
  }

  const email = user?.email ?? '';
  const displayName = user?.displayName || (user as any)?.user_metadata?.display_name as string | undefined;
  const isLocal = user?.authMode === 'local';
  const isCloud = user?.authMode === 'supabase';
  const initial = (displayName?.[0] || email?.[0] || 'U').toUpperCase();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className="w-8 h-8 rounded-full bg-[#0f172a] text-white flex items-center justify-center text-sm font-bold hover:bg-[#1e293b] transition-colors focus:outline-none focus:ring-2 focus:ring-[#0f172a]/30 focus:ring-offset-2"
          aria-label="User menu"
        >
          {initial}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" sideOffset={8}>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <div className="flex items-center gap-1.5">
              <p className="text-sm font-medium leading-none">
                {displayName || 'User'}
              </p>
              {isCloud && (
                <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[9px] font-bold bg-blue-100 text-blue-700 rounded-full">
                  <svg width="8" height="8" viewBox="0 0 24 24" fill="currentColor"><path d="M19.35 10.04A7.49 7.49 0 0012 4C9.11 4 6.6 5.64 5.35 8.04A5.994 5.994 0 000 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96z"/></svg>
                  Cloud
                </span>
              )}
              {isLocal && (
                <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[9px] font-bold bg-emerald-100 text-emerald-700 rounded-full">
                  <svg width="8" height="8" viewBox="0 0 24 24" fill="currentColor"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/></svg>
                  Local
                </span>
              )}
            </div>
            <p className="text-xs leading-none text-muted-foreground">
              {email}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem className="cursor-pointer" asChild>
            <Link href="/saved" className="flex items-center gap-2">
              <Bookmark size={14} />
              Saved Reports
            </Link>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50"
          onClick={() => signOut()}
        >
          <LogOut size={14} />
          Sign Out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
