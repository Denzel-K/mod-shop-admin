'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { LogOut, Upload, Database, Settings, Users } from 'lucide-react';

export default function Dashboard() {
  const [admin, setAdmin] = useState<{ fullname: string; email: string } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Check if user is authenticated by trying to access a protected route
    // For now, we'll just show the dashboard
    setIsLoading(false);
  }, []);

  const handleLogout = async () => {
    try {
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
      });

      if (response.ok) {
        router.push('/');
      }
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 flex items-center justify-center">
        <div className="text-cyan-400">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800">
      {/* Header */}
      <header className="border-b border-slate-700/50 bg-slate-900/50 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
                MOD SHOP
              </h1>
              <span className="text-slate-400">Admin Portal</span>
            </div>
            <Button
              onClick={handleLogout}
              variant="outline"
              className="border-slate-600/50 text-slate-300 hover:bg-slate-700/50 hover:text-white"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-white mb-2">Welcome to the Admin Portal</h2>
          <p className="text-slate-400">Manage your 3D assets and content for the Mod Shop platform</p>
        </div>

        {/* Dashboard Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Asset Management */}
          <div className="bg-gradient-to-br from-slate-900/90 to-slate-800/90 backdrop-blur-xl border border-cyan-500/20 rounded-2xl p-6 shadow-2xl shadow-cyan-500/10 hover:shadow-cyan-500/20 transition-all duration-300 cursor-pointer group">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-gradient-to-br from-cyan-400/20 to-blue-500/20 rounded-xl">
                <Upload className="w-6 h-6 text-cyan-400" />
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-white">0</div>
                <div className="text-xs text-slate-400">Assets</div>
              </div>
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">Asset Upload</h3>
            <p className="text-slate-400 text-sm">Upload and manage 3D models, textures, and other assets</p>
          </div>

          {/* Database Management */}
          <div className="bg-gradient-to-br from-slate-900/90 to-slate-800/90 backdrop-blur-xl border border-blue-500/20 rounded-2xl p-6 shadow-2xl shadow-blue-500/10 hover:shadow-blue-500/20 transition-all duration-300 cursor-pointer group">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-gradient-to-br from-blue-400/20 to-purple-500/20 rounded-xl">
                <Database className="w-6 h-6 text-blue-400" />
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-white">0</div>
                <div className="text-xs text-slate-400">Records</div>
              </div>
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">Database</h3>
            <p className="text-slate-400 text-sm">View and manage asset metadata and relationships</p>
          </div>

          {/* User Management */}
          <div className="bg-gradient-to-br from-slate-900/90 to-slate-800/90 backdrop-blur-xl border border-purple-500/20 rounded-2xl p-6 shadow-2xl shadow-purple-500/10 hover:shadow-purple-500/20 transition-all duration-300 cursor-pointer group">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-gradient-to-br from-purple-400/20 to-pink-500/20 rounded-xl">
                <Users className="w-6 h-6 text-purple-400" />
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-white">1</div>
                <div className="text-xs text-slate-400">Admins</div>
              </div>
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">User Management</h3>
            <p className="text-slate-400 text-sm">Manage admin accounts and permissions</p>
          </div>

          {/* Settings */}
          <div className="bg-gradient-to-br from-slate-900/90 to-slate-800/90 backdrop-blur-xl border border-green-500/20 rounded-2xl p-6 shadow-2xl shadow-green-500/10 hover:shadow-green-500/20 transition-all duration-300 cursor-pointer group">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-gradient-to-br from-green-400/20 to-emerald-500/20 rounded-xl">
                <Settings className="w-6 h-6 text-green-400" />
              </div>
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">Settings</h3>
            <p className="text-slate-400 text-sm">Configure platform settings and preferences</p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-12">
          <h3 className="text-xl font-semibold text-white mb-6">Quick Actions</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button className="h-16 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white font-semibold rounded-xl shadow-lg shadow-cyan-500/25 hover:shadow-cyan-500/40 transition-all duration-300">
              <Upload className="w-5 h-5 mr-2" />
              Upload New Asset
            </Button>
            <Button className="h-16 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold rounded-xl shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 transition-all duration-300">
              <Database className="w-5 h-5 mr-2" />
              Browse Library
            </Button>
            <Button className="h-16 bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white font-semibold rounded-xl shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40 transition-all duration-300">
              <Settings className="w-5 h-5 mr-2" />
              System Settings
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
