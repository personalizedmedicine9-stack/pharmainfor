'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Mail, Lock, User, Loader2, AlertCircle, Cloud, Database } from 'lucide-react';
import { useAuth, PreferredAuthMode } from '@/lib/auth';
import { isSupabaseConfigured } from '@/lib/supabase';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTab?: 'signin' | 'signup';
}

export default function AuthModal({ isOpen, onClose, defaultTab = 'signin' }: AuthModalProps) {
  const { signIn, signUp, isSupabaseAvailable } = useAuth();
  const supabaseConfigured = isSupabaseConfigured();

  // Sign In state
  const [signInEmail, setSignInEmail] = useState('');
  const [signInPassword, setSignInPassword] = useState('');

  // Sign Up state
  const [signUpEmail, setSignUpEmail] = useState('');
  const [signUpPassword, setSignUpPassword] = useState('');
  const [signUpDisplayName, setSignUpDisplayName] = useState('');
  const [signUpConfirmPassword, setSignUpConfirmPassword] = useState('');

  // Shared state
  const [activeTab, setActiveTab] = useState<string>(defaultTab);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // ─── Auth Mode Selector ───
  // Default to cloud if Supabase is configured, else local
  const [selectedMode, setSelectedMode] = useState<PreferredAuthMode>(
    supabaseConfigured ? 'supabase' : 'local'
  );

  const resetForm = () => {
    setSignInEmail('');
    setSignInPassword('');
    setSignUpEmail('');
    setSignUpPassword('');
    setSignUpDisplayName('');
    setSignUpConfirmPassword('');
    setError(null);
    setSuccessMessage(null);
    setIsLoading(false);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    if (!signInEmail.trim() || !signInPassword) {
      setError('Please enter your email and password.');
      setIsLoading(false);
      return;
    }

    const { error: authError } = await signIn(signInEmail.trim(), signInPassword, selectedMode);
    if (authError) {
      setError(authError);
    } else {
      handleClose();
    }
    setIsLoading(false);
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);
    setIsLoading(true);

    if (!signUpEmail.trim() || !signUpPassword || !signUpConfirmPassword) {
      setError('Please fill in all required fields.');
      setIsLoading(false);
      return;
    }

    if (signUpPassword.length < 6) {
      setError('Password must be at least 6 characters.');
      setIsLoading(false);
      return;
    }

    if (signUpPassword !== signUpConfirmPassword) {
      setError('Passwords do not match.');
      setIsLoading(false);
      return;
    }

    const result = await signUp(signUpEmail.trim(), signUpPassword, signUpDisplayName.trim() || undefined, selectedMode);
    if (result.error) {
      setError(result.error);
    } else {
      if (result.autoSignedIn) {
        // Local auth or Supabase auto-confirmed: user is signed in, close modal
        handleClose();
      } else if (result.needsEmailConfirmation) {
        // Supabase requires email confirmation
        setSuccessMessage('Account created! Supabase requires email confirmation. If you don\'t receive an email within a few minutes, try signing in directly — some Supabase projects auto-confirm accounts.');
        setActiveTab('signin');
        setSignInEmail(signUpEmail.trim());
      } else {
        handleClose();
      }
    }
    setIsLoading(false);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            width: '100vw',
            height: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 99999,
            margin: 0,
            padding: '1rem',
            overflow: 'auto',
          }}
          className="bg-slate-900/70 backdrop-blur-md"
        >
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            style={{ position: 'fixed', inset: 0 }}
            onClick={(e) => {
              if (e.target === e.currentTarget) handleClose();
            }}
          />
          <motion.div
            initial={{ scale: 0.95, y: 20, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.95, y: 20, opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            style={{ position: 'relative', zIndex: 100000, maxWidth: '28rem', width: '100%' }}
            className="bg-white rounded-2xl shadow-2xl border border-gray-200/80 overflow-hidden"
          >
            {/* Header */}
            <div className="relative bg-[#0f172a] px-6 py-5">
              <button
                onClick={handleClose}
                className="absolute top-4 right-4 text-white/60 hover:text-white transition-colors"
                aria-label="Close"
              >
                <X size={20} />
              </button>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-white/10 rounded-lg flex items-center justify-center">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 1L3 5.5V12C3 17.5 6.8 22.7 12 24C17.2 22.7 21 17.5 21 12V5.5L12 1Z" fill="white" fillOpacity="0.15" stroke="white" strokeWidth="1.5" strokeLinejoin="round" />
                    <circle cx="10" cy="10" r="1.8" fill="white" />
                    <circle cx="15" cy="10" r="1.8" fill="white" />
                    <circle cx="12.5" cy="15" r="1.8" fill="white" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">PharmaInsight</h2>
                  <p className="text-xs text-white/60 font-medium">Sign in to save reports & bookmarks</p>
                </div>
              </div>
            </div>

            {/* Auth Mode Selector */}
            <div className="px-6 pt-5 pb-0">
              <p className="text-xs font-semibold text-gray-500 mb-2.5 uppercase tracking-wide">Authentication Method</p>
              <div className="grid grid-cols-2 gap-2">
                {/* Cloud Auth Button */}
                <button
                  type="button"
                  onClick={() => { setSelectedMode('supabase'); setError(null); setSuccessMessage(null); }}
                  disabled={!supabaseConfigured}
                  className={`
                    flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl border-2 transition-all text-left
                    ${selectedMode === 'supabase'
                      ? 'border-blue-500 bg-blue-50 shadow-sm'
                      : 'border-gray-200 bg-white hover:border-gray-300'
                    }
                    ${!supabaseConfigured ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}
                  `}
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                    selectedMode === 'supabase' ? 'bg-blue-500' : 'bg-gray-100'
                  }`}>
                    <Cloud size={16} className={selectedMode === 'supabase' ? 'text-white' : 'text-gray-400'} />
                  </div>
                  <div>
                    <p className={`text-xs font-bold ${selectedMode === 'supabase' ? 'text-blue-700' : 'text-gray-700'}`}>
                      Cloud
                    </p>
                    <p className="text-[10px] text-gray-400 leading-tight">Supabase Auth</p>
                  </div>
                  {selectedMode === 'supabase' && (
                    <div className="ml-auto w-4 h-4 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0">
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    </div>
                  )}
                </button>

                {/* Local Auth Button */}
                <button
                  type="button"
                  onClick={() => { setSelectedMode('local'); setError(null); setSuccessMessage(null); }}
                  className={`
                    flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl border-2 transition-all text-left cursor-pointer
                    ${selectedMode === 'local'
                      ? 'border-emerald-500 bg-emerald-50 shadow-sm'
                      : 'border-gray-200 bg-white hover:border-gray-300'
                    }
                  `}
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                    selectedMode === 'local' ? 'bg-emerald-500' : 'bg-gray-100'
                  }`}>
                    <Database size={16} className={selectedMode === 'local' ? 'text-white' : 'text-gray-400'} />
                  </div>
                  <div>
                    <p className={`text-xs font-bold ${selectedMode === 'local' ? 'text-emerald-700' : 'text-gray-700'}`}>
                      Local
                    </p>
                    <p className="text-[10px] text-gray-400 leading-tight">SQLite Database</p>
                  </div>
                  {selectedMode === 'local' && (
                    <div className="ml-auto w-4 h-4 rounded-full bg-emerald-500 flex items-center justify-center flex-shrink-0">
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    </div>
                  )}
                </button>
              </div>

              {/* Mode info banner */}
              {selectedMode === 'supabase' && (
                <div className="mt-2.5 flex items-center gap-2 px-3 py-2 bg-blue-50/70 rounded-lg border border-blue-100">
                  <Cloud size={13} className="text-blue-500 flex-shrink-0" />
                  <p className="text-[11px] text-blue-600 leading-tight">
                    Cloud auth syncs across devices. Email verification may be required.
                  </p>
                </div>
              )}
              {selectedMode === 'local' && (
                <div className="mt-2.5 flex items-center gap-2 px-3 py-2 bg-emerald-50/70 rounded-lg border border-emerald-100">
                  <Database size={13} className="text-emerald-500 flex-shrink-0" />
                  <p className="text-[11px] text-emerald-600 leading-tight">
                    Local auth stores credentials on this device only. No email verification needed.
                  </p>
                </div>
              )}
            </div>

            {/* Tabs & Forms */}
            <div className="p-6 pt-4">
              <Tabs value={activeTab} onValueChange={(v) => { setActiveTab(v); setError(null); setSuccessMessage(null); }}>
                <TabsList className="w-full mb-5">
                  <TabsTrigger value="signin" className="flex-1">Sign In</TabsTrigger>
                  <TabsTrigger value="signup" className="flex-1">Sign Up</TabsTrigger>
                </TabsList>

                {/* Sign In Form */}
                <TabsContent value="signin">
                  <form onSubmit={handleSignIn} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="signin-email" className="text-gray-700 text-xs font-semibold">Email</Label>
                      <div className="relative">
                        <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <Input
                          id="signin-email"
                          type="email"
                          placeholder="you@example.com"
                          value={signInEmail}
                          onChange={(e) => setSignInEmail(e.target.value)}
                          className="pl-10 h-10"
                          autoComplete="email"
                          disabled={isLoading}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="signin-password" className="text-gray-700 text-xs font-semibold">Password</Label>
                      <div className="relative">
                        <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <Input
                          id="signin-password"
                          type="password"
                          placeholder="Enter your password"
                          value={signInPassword}
                          onChange={(e) => setSignInPassword(e.target.value)}
                          className="pl-10 h-10"
                          autoComplete="current-password"
                          disabled={isLoading}
                        />
                      </div>
                    </div>

                    {error && (
                      <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-100 rounded-lg">
                        <AlertCircle size={16} className="text-red-500 mt-0.5 flex-shrink-0" />
                        <p className="text-sm text-red-700">{error}</p>
                      </div>
                    )}

                    {successMessage && (
                      <div className="flex items-start gap-2 p-3 bg-emerald-50 border border-emerald-100 rounded-lg">
                        <AlertCircle size={16} className="text-emerald-500 mt-0.5 flex-shrink-0" />
                        <p className="text-sm text-emerald-700">{successMessage}</p>
                      </div>
                    )}

                    <Button
                      type="submit"
                      disabled={isLoading}
                      className={`w-full h-10 font-semibold rounded-lg text-white ${
                        selectedMode === 'supabase'
                          ? 'bg-blue-600 hover:bg-blue-700'
                          : 'bg-emerald-600 hover:bg-emerald-700'
                      }`}
                    >
                      {isLoading ? (
                        <>
                          <Loader2 size={16} className="animate-spin" />
                          Signing in...
                        </>
                      ) : (
                        <>
                          {selectedMode === 'supabase' ? <Cloud size={15} className="mr-1.5" /> : <Database size={15} className="mr-1.5" />}
                          Sign In ({selectedMode === 'supabase' ? 'Cloud' : 'Local'})
                        </>
                      )}
                    </Button>
                  </form>
                </TabsContent>

                {/* Sign Up Form */}
                <TabsContent value="signup">
                  <form onSubmit={handleSignUp} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="signup-displayname" className="text-gray-700 text-xs font-semibold">Display Name <span className="text-gray-400">(optional)</span></Label>
                      <div className="relative">
                        <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <Input
                          id="signup-displayname"
                          type="text"
                          placeholder="Dr. Jane Smith"
                          value={signUpDisplayName}
                          onChange={(e) => setSignUpDisplayName(e.target.value)}
                          className="pl-10 h-10"
                          autoComplete="name"
                          disabled={isLoading}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="signup-email" className="text-gray-700 text-xs font-semibold">Email</Label>
                      <div className="relative">
                        <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <Input
                          id="signup-email"
                          type="email"
                          placeholder="you@example.com"
                          value={signUpEmail}
                          onChange={(e) => setSignUpEmail(e.target.value)}
                          className="pl-10 h-10"
                          autoComplete="email"
                          disabled={isLoading}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="signup-password" className="text-gray-700 text-xs font-semibold">Password</Label>
                      <div className="relative">
                        <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <Input
                          id="signup-password"
                          type="password"
                          placeholder="Min. 6 characters"
                          value={signUpPassword}
                          onChange={(e) => setSignUpPassword(e.target.value)}
                          className="pl-10 h-10"
                          autoComplete="new-password"
                          disabled={isLoading}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="signup-confirm-password" className="text-gray-700 text-xs font-semibold">Confirm Password</Label>
                      <div className="relative">
                        <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <Input
                          id="signup-confirm-password"
                          type="password"
                          placeholder="Repeat your password"
                          value={signUpConfirmPassword}
                          onChange={(e) => setSignUpConfirmPassword(e.target.value)}
                          className="pl-10 h-10"
                          autoComplete="new-password"
                          disabled={isLoading}
                        />
                      </div>
                    </div>

                    {error && (
                      <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-100 rounded-lg">
                        <AlertCircle size={16} className="text-red-500 mt-0.5 flex-shrink-0" />
                        <p className="text-sm text-red-700">{error}</p>
                      </div>
                    )}

                    <Button
                      type="submit"
                      disabled={isLoading}
                      className={`w-full h-10 font-semibold rounded-lg text-white ${
                        selectedMode === 'supabase'
                          ? 'bg-blue-600 hover:bg-blue-700'
                          : 'bg-emerald-600 hover:bg-emerald-700'
                      }`}
                    >
                      {isLoading ? (
                        <>
                          <Loader2 size={16} className="animate-spin" />
                          Creating account...
                        </>
                      ) : (
                        <>
                          {selectedMode === 'supabase' ? <Cloud size={15} className="mr-1.5" /> : <Database size={15} className="mr-1.5" />}
                          Create Account ({selectedMode === 'supabase' ? 'Cloud' : 'Local'})
                        </>
                      )}
                    </Button>
                  </form>
                </TabsContent>
              </Tabs>

              {/* Footer */}
              <p className="text-[11px] text-gray-400 text-center mt-5 leading-relaxed">
                By signing in, you agree to our terms of service.<br />
                Search is always public. Auth is only required for saving reports.
              </p>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
