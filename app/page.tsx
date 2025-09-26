'use client';

import { useState } from 'react';
import { LogIn } from 'lucide-react';
import LoginForm from '@/components/auth/LoginForm';
import PasswordResetForm from '@/components/auth/PasswordResetForm';
import { ModShopLogo } from '@/components/mod-shop-logo';
import { ImageSlideshow } from '@/components/slideshow/ImageSlideshow';

export default function Home() {
  const [currentView, setCurrentView] = useState<'login' | 'reset'>('login');
  const [activePanel, setActivePanel] = useState<'landing' | 'signin'>('landing');

  // Sample car and garage images - replace with actual image paths
  const slideshowImages = [
    'https://i.pinimg.com/736x/29/c7/0d/29c70d55a609a4fa74323929749d9e47.jpg',
    'https://i.pinimg.com/1200x/3e/f3/32/3ef332ccc45aeac9170c274d0e2f5837.jpg',
    'https://i.pinimg.com/1200x/1e/bb/09/1ebb0917b9c0bcbb9ac22841d1f821c9.jpg',
    'https://i.pinimg.com/736x/35/da/50/35da50e84b726061a74cc77cb16996b0.jpg',
    'https://i.pinimg.com/736x/ab/59/c2/ab59c24662fa944c3a707b7e265f2a42.jpg',
    'https://i.pinimg.com/1200x/73/7b/c2/737bc257905df5e5236061c79e5010b8.jpg'
  ];

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

      {/* Desktop Layout - Split Panel */}
      <div className="hidden lg:flex relative z-10 min-h-screen">
        {/* Left Panel - Landing Content */}
        <div className="w-1/2 flex flex-col justify-center p-8 xl:p-12 overflow-y-auto bg-gradient-to-br from-slate-900/90 to-slate-800/90">
          <div className="space-y-8">
            {/* Header with Logo */}
            <div className="flex items-center space-x-4">
              <ModShopLogo size="xl" />
              <div>
                <h1 className="text-2xl xl:text-3xl font-bold bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 bg-clip-text text-transparent">
                  ModShop Admin Portal
                </h1>
              </div>
            </div>

            {/* Slideshow */}
            <div className="space-y-4">
              <ImageSlideshow 
                images={slideshowImages}
                className="h-[200px] lg:h-[400px]"
                autoPlay={true}
                interval={5000}
              />
            </div>

            {/* Description */}
            <div className="space-y-6">
              <div className="space-y-4">
                <h2 className="text-2xl xl:text-3xl font-semibold text-white">
                  Asset Management Hub
                </h2>
                <p className="text-slate-400 text-lg leading-relaxed">
                  Manage 3D models, textures, and assets for the ultimate car customization platform. 
                  Curate content that powers immersive automotive experiences.
                </p>
              </div>

              {/* Features */}
              <div className="grid grid-cols-2 gap-4">
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
          </div>
        </div>

        {/* Right Panel - Authentication */}
        <div className="w-1/2 flex items-center justify-center p-8 border-l border-slate-800/50">
          <div className="w-full max-w-xl">
            {currentView === 'login' ? (
              <LoginForm onSwitchToReset={() => setCurrentView('reset')} />
            ) : (
              <PasswordResetForm onSwitchToLogin={() => setCurrentView('login')} />
            )}
          </div>
        </div>
      </div>

      {/* Mobile/Tablet Layout - Single Panel with Toggle */}
      <div className="lg:hidden relative z-10 min-h-screen">
        {activePanel === 'landing' ? (
          /* Landing Panel */
          <div className="min-h-screen flex flex-col p-4 sm:p-6 overflow-y-auto">
            <div className="flex-1 flex flex-col justify-center space-y-6 sm:space-y-8 max-w-lg mx-auto w-full">
              {/* Header with Logo */}
              <div className="text-left space-y-4">
                <div className="flex items-center justify-start space-x-3">
                  <ModShopLogo size="md" />
                  <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 bg-clip-text text-transparent">
                    ModShop Admin Portal
                  </h1>
                </div>
              </div>

              {/* Slideshow */}
              <ImageSlideshow 
                images={slideshowImages}
                className="h-48 sm:h-56"
                autoPlay={true}
                interval={5000}
              />

              {/* Description - Compact for mobile */}
              <div className="space-y-4 text-center">
                <h2 className="text-xl sm:text-2xl font-semibold text-white text-left">
                  Asset Management Hub
                </h2>
                <p className="text-slate-400 text-base leading-relaxed text-left">
                  Manage 3D models, textures, and assets for the ultimate car customization platform.
                </p>
              </div>

              {/* Features - Compact grid */}
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="flex items-center space-x-2 text-slate-300">
                  <div className="w-1.5 h-1.5 bg-cyan-400 rounded-full" />
                  <span>3D Models</span>
                </div>
                <div className="flex items-center space-x-2 text-slate-300">
                  <div className="w-1.5 h-1.5 bg-blue-400 rounded-full" />
                  <span>Curation</span>
                </div>
                <div className="flex items-center space-x-2 text-slate-300">
                  <div className="w-1.5 h-1.5 bg-purple-400 rounded-full" />
                  <span>Quality Control</span>
                </div>
                <div className="flex items-center space-x-2 text-slate-300">
                  <div className="w-1.5 h-1.5 bg-green-400 rounded-full" />
                  <span>Management</span>
                </div>
              </div>

              {/* Sign In Button */}
              <button
                onClick={() => setActivePanel('signin')}
                className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 flex items-center justify-center space-x-2"
              >
                <LogIn className="w-5 h-5" />
                <span>Sign In to Admin Portal</span>
              </button>
            </div>

            {/* Footer */}
            <div className="text-center py-4 text-slate-500 text-xs">
              <p>© 2025 Mod Shop Admin Portal</p>
            </div>
          </div>
        ) : (
          /* Sign In Panel */
          <div className="min-h-screen flex flex-col items-center justify-center p-4 sm:p-6">
            {/* Back Button */}
            <button
              onClick={() => setActivePanel('landing')}
              className="absolute top-4 left-4 text-slate-400 hover:text-white transition-colors duration-200"
            >
              ← Back
            </button>

            <div className="w-full max-w-md">
              {currentView === 'login' ? (
                <LoginForm onSwitchToReset={() => setCurrentView('reset')} />
              ) : (
                <PasswordResetForm onSwitchToLogin={() => setCurrentView('login')} />
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
