'use client';

import { useState } from 'react';
import LoginForm from '@/components/auth/LoginForm';
import PasswordResetForm from '@/components/auth/PasswordResetForm';

export default function Home() {
  const [currentView, setCurrentView] = useState<'login' | 'reset'>('login');

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0">
        {/* Grid Pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(6,182,212,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(6,182,212,0.03)_1px,transparent_1px)] bg-[size:50px_50px]" />
        
        {/* Floating Orbs */}
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse delay-1000" />
        <div className="absolute top-1/2 right-1/3 w-48 h-48 bg-purple-500/10 rounded-full blur-3xl animate-pulse delay-2000" />
        
        {/* Geometric Shapes */}
        <div className="absolute top-20 right-20 w-4 h-4 bg-cyan-400/20 rotate-45 animate-spin" style={{ animationDuration: '20s' }} />
        <div className="absolute bottom-32 left-32 w-6 h-6 bg-blue-400/20 rotate-45 animate-spin" style={{ animationDuration: '15s' }} />
        <div className="absolute top-1/3 left-20 w-3 h-3 bg-purple-400/20 rotate-45 animate-spin" style={{ animationDuration: '25s' }} />
      </div>

      {/* Main Content */}
      <div className="relative z-10 flex items-center justify-center min-h-screen p-4">
        <div className="w-full max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Side - Branding */}
            <div className="text-center lg:text-left space-y-8">
              {/* Logo */}
              <div className="space-y-4">
                <h1 className="text-6xl lg:text-7xl font-bold bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 bg-clip-text text-transparent">
                  MOD SHOP
                </h1>
                <div className="text-xl lg:text-2xl text-slate-300 font-light">
                  Admin Portal
                </div>
                <div className="w-24 h-1 bg-gradient-to-r from-cyan-400 to-blue-500 mx-auto lg:mx-0 rounded-full" />
              </div>

              {/* Description */}
              <div className="space-y-4 max-w-lg mx-auto lg:mx-0">
                <h2 className="text-2xl lg:text-3xl font-semibold text-white">
                  Asset Management Hub
                </h2>
                <p className="text-slate-400 text-lg leading-relaxed">
                  Manage 3D models, textures, and assets for the ultimate car customization platform. 
                  Curate content that powers immersive automotive experiences.
                </p>
              </div>

              {/* Features */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-lg mx-auto lg:mx-0">
                <div className="flex items-center space-x-3 text-slate-300">
                  <div className="w-2 h-2 bg-cyan-400 rounded-full" />
                  <span>3D Model Library</span>
                </div>
                <div className="flex items-center space-x-3 text-slate-300">
                  <div className="w-2 h-2 bg-blue-400 rounded-full" />
                  <span>Asset Curation</span>
                </div>
                <div className="flex items-center space-x-3 text-slate-300">
                  <div className="w-2 h-2 bg-purple-400 rounded-full" />
                  <span>Quality Control</span>
                </div>
                <div className="flex items-center space-x-3 text-slate-300">
                  <div className="w-2 h-2 bg-green-400 rounded-full" />
                  <span>Content Management</span>
                </div>
              </div>
            </div>

            {/* Right Side - Authentication Forms */}
            <div className="flex justify-center lg:justify-end">
              {currentView === 'login' ? (
                <LoginForm onSwitchToReset={() => setCurrentView('reset')} />
              ) : (
                <PasswordResetForm onSwitchToLogin={() => setCurrentView('login')} />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="absolute bottom-0 left-0 right-0 z-10">
        <div className="text-center py-6 text-slate-500 text-sm">
          <p>© 2024 Mod Shop Admin Portal. Powered by cutting-edge 3D technology.</p>
        </div>
      </div>
    </div>
  );
}
