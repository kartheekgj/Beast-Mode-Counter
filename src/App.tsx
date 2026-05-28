/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Sparkles, Flame, Trophy, Play, Plus, Dumbbell, Award, History,
  Trash2, Edit3, Settings, ShieldAlert, Heart, Activity, CheckSquare
} from 'lucide-react';
import { WorkoutPlan, WorkoutHistoryEntry, AppTheme } from './types';
import { getWorkoutPlans, saveWorkoutPlan, deleteWorkoutPlan, getWorkoutHistory, clearHistory } from './utils/storage';
import ExerciseIcon from './components/ExerciseIcon';
import WorkoutCreator from './components/WorkoutCreator';
import WorkoutRunner from './components/WorkoutRunner';
import HistoryDashboard from './components/HistoryDashboard';

const THEME_CONFIGS = {
  BEAST: {
    accent: 'bg-orange-500',
    border: 'border-orange-500/25',
    glow: 'glow-beast',
    text: 'text-orange-500',
    bg: 'bg-orange-950/20',
    hover: 'hover:bg-orange-500/20',
    neonColor: '#f97316'
  },
  ZEN: {
    accent: 'bg-sky-400',
    border: 'border-sky-400/25',
    glow: 'glow-zen',
    text: 'text-sky-400',
    bg: 'bg-sky-950/20',
    hover: 'hover:bg-sky-400/20',
    neonColor: '#38bdf8'
  },
  ENERGY: {
    accent: 'bg-green-500',
    border: 'border-green-500/25',
    glow: 'glow-energy',
    text: 'text-green-500',
    bg: 'bg-green-950/20',
    hover: 'hover:bg-green-500/20',
    neonColor: '#22c55e'
  }
};

export default function App() {
  // Views states
  const [view, setView] = useState<'DASHBOARD' | 'CREATING' | 'RUNNING'>('DASHBOARD');
  const [dashboardTab, setDashboardTab] = useState<'WORKOUTS' | 'STATS'>('WORKOUTS');
  
  // Theme state
  const [theme, setTheme] = useState<AppTheme>('BEAST');
  
  // Active collections
  const [plans, setPlans] = useState<WorkoutPlan[]>([]);
  const [history, setHistory] = useState<WorkoutHistoryEntry[]>([]);
  
  // Target workout
  const [selectedPlan, setSelectedPlan] = useState<WorkoutPlan | null>(null);
  const [editingPlan, setEditingPlan] = useState<WorkoutPlan | null>(null);

  // Sync with LocalStorage on startup
  useEffect(() => {
    setPlans(getWorkoutPlans());
    setHistory(getWorkoutHistory());

    const savedTheme = localStorage.getItem('beast_active_theme') as AppTheme;
    if (savedTheme && ['BEAST', 'ZEN', 'ENERGY'].includes(savedTheme)) {
      setTheme(savedTheme);
    }
  }, []);

  const handleSetTheme = (newTheme: AppTheme) => {
    setTheme(newTheme);
    localStorage.setItem('beast_active_theme', newTheme);
  };

  const currentThemeConfig = THEME_CONFIGS[theme];

  // Callbacks
  const handleCreatePlan = (p: WorkoutPlan) => {
    const updated = saveWorkoutPlan(p);
    setPlans(updated);
    setView('DASHBOARD');
    setEditingPlan(null);
  };

  const handleDeletePlan = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const confirm = window.confirm("Are you sure you want to delete this custom workout plan?");
    if (confirm) {
      const updated = deleteWorkoutPlan(id);
      setPlans(updated);
    }
  };

  const handleEditPlan = (plan: WorkoutPlan, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingPlan(plan);
    setView('CREATING');
  };

  const handleLaunchPlan = (plan: WorkoutPlan) => {
    setSelectedPlan(plan);
    setView('RUNNING');
  };

  const handleReplayFromHistory = (planId: string) => {
    const target = plans.find(p => p.id === planId);
    if (target) {
      handleLaunchPlan(target);
    } else {
      alert("This custom plan was previously deleted. Build a fresh plan above!");
    }
  };

  const handleClearHistory = () => {
    clearHistory();
    setHistory([]);
  };

  const handleWorkoutTimerSaved = () => {
    // Reload logs
    setHistory(getWorkoutHistory());
    setView('DASHBOARD');
    setDashboardTab('STATS'); // Go direct to stats logs of premium workouts
  };

  return (
    <div className="min-h-screen bg-black text-white font-sans selection:bg-zinc-800 selection:text-white pb-12 transition-colors duration-500 relative">
      {/* Immersive Dark mesh background grids */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#111_1px,transparent_1px),linear-gradient(to_bottom,#111_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none" />

      {view === 'RUNNING' && selectedPlan ? (
        <div className="container mx-auto px-4 max-w-4xl py-6 min-h-screen flex flex-col justify-center">
          <WorkoutRunner
            plan={selectedPlan}
            theme={theme}
            themeConfig={currentThemeConfig}
            onClose={() => {
              setView('DASHBOARD');
              setSelectedPlan(null);
            }}
            onSaved={handleWorkoutTimerSaved}
          />
        </div>
      ) : view === 'CREATING' ? (
        <div className="container mx-auto py-4">
          <WorkoutCreator
            theme={theme}
            themeConfig={currentThemeConfig}
            onSave={handleCreatePlan}
            onCancel={() => {
              setView('DASHBOARD');
              setEditingPlan(null);
            }}
            editingPlan={editingPlan}
          />
        </div>
      ) : (
        /* STANDARD CENTRAL DASHBOARD VIEWPORT */
        <div className="container mx-auto px-4 max-w-4xl pt-8 space-y-8 relative z-10" id="main-dashboard-app">
          {/* Header & Theme Switches */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-5 border-b border-zinc-900 pb-6">
            <div className="flex items-center space-x-3.5 select-none" id="dashboard-logo-badge">
              <div className={`h-11 w-11 rounded-2xl flex items-center justify-center ${currentThemeConfig.accent} ${currentThemeConfig.glow} transition-all duration-500`}>
                <Flame className="h-6 w-6 text-black fill-black" />
              </div>
              <div>
                <h1 className="text-2xl font-display font-black tracking-tight uppercase text-white flex items-center gap-1.5">
                  Beast Mode <span className={currentThemeConfig.text}>Timer</span>
                </h1>
                <p className="text-xs text-zinc-550 font-mono tracking-widest uppercase">HIIT & SETS COMPANION</p>
              </div>
            </div>

            {/* Custom Theme selection pill buttons */}
            <div className="bg-zinc-950 p-1 rounded-2xl border border-zinc-850 flex items-center gap-1" id="theme-selector-pill">
              <button
                onClick={() => handleSetTheme('BEAST')}
                className={`px-2.5 sm:px-3 py-1.5 rounded-xl font-display text-[10px] sm:text-xs font-extrabold uppercase transition-all tracking-wider ${
                  theme === 'BEAST' 
                    ? 'bg-orange-500 text-black shadow-lg shadow-orange-500/10' 
                    : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900/30'
                }`}
                title="Beast theme (Crimson)"
              >
                Beast
              </button>
              
              <button
                onClick={() => handleSetTheme('ZEN')}
                className={`px-2.5 sm:px-3 py-1.5 rounded-xl font-display text-[10px] sm:text-xs font-extrabold uppercase transition-all tracking-wider ${
                  theme === 'ZEN' 
                    ? 'bg-sky-400 text-black shadow-lg shadow-sky-400/10' 
                    : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900/30'
                }`}
                title="Zen theme (Azure)"
              >
                Zen
              </button>

              <button
                onClick={() => handleSetTheme('ENERGY')}
                className={`px-2.5 sm:px-3 py-1.5 rounded-xl font-display text-[10px] sm:text-xs font-extrabold uppercase transition-all tracking-wider ${
                  theme === 'ENERGY' 
                    ? 'bg-green-500 text-black shadow-lg shadow-green-500/10' 
                    : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900/30'
                }`}
                title="Energy theme (Neon Green)"
              >
                Energy
              </button>
            </div>
          </div>

          {/* Active Dashboard Views tabs selectors */}
          <div className="flex space-x-1 p-1 bg-zinc-950 border border-zinc-850/80 rounded-2xl select-none" id="dashboard-tab-selectors">
            <button
              onClick={() => setDashboardTab('WORKOUTS')}
              className={`flex-1 py-2.5 sm:py-3 text-[11px] sm:text-sm font-display font-black uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-1.5 sm:gap-2 ${
                dashboardTab === 'WORKOUTS'
                  ? `${currentThemeConfig.accent} text-black font-extrabold shadow-md`
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/30'
              }`}
              id="tab-workouts"
            >
              <Dumbbell className="h-4 w-4 sm:h-4.5 sm:w-4.5" />
              <span>Workout Plans</span>
            </button>

            <button
              onClick={() => setDashboardTab('STATS')}
              className={`flex-1 py-2.5 sm:py-3 text-[11px] sm:text-sm font-display font-black uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-1.5 sm:gap-2 ${
                dashboardTab === 'STATS'
                  ? `${currentThemeConfig.accent} text-black font-extrabold shadow-md`
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/30'
              }`}
              id="tab-metrics"
            >
              <History className="h-4 w-4 sm:h-4.5 sm:w-4.5" />
              <span>Performance Logs</span>
            </button>
          </div>

          {/* Core Content Body with Sliding Transitions */}
          <AnimatePresence mode="wait">
            {dashboardTab === 'WORKOUTS' ? (
              <motion.div
                key="tab-workouts-element"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="space-y-6"
              >
                <div className="flex items-center justify-between px-1">
                  <h2 className="text-xl font-display font-extrabold text-white">Your Training Routines</h2>
                  <button
                    onClick={() => {
                      setEditingPlan(null);
                      setView('CREATING');
                    }}
                    className={`flex items-center gap-1.5 text-xs font-display font-extrabold uppercase tracking-wider py-2.5 px-4 rounded-xl border border-zinc-850 bg-zinc-900 hover:bg-zinc-805 text-white shadow-xl`}
                    id="btn-trigger-creator"
                  >
                    <Plus className={`h-4.5 w-4.5 ${currentThemeConfig.text}`} />
                    Build Custom
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4" id="plans-card-grid">
                  {plans.map((p) => {
                    // Summarize exercises values
                    const exerciseCount = p.exercises.length;
                    const totalSets = p.type === 'SETS' 
                      ? p.exercises.reduce((sum, ex) => sum + ex.sets, 0)
                      : 0;
                    
                    const isDefault = p.id.startsWith('beast_default_');

                    return (
                      <motion.div
                        key={p.id}
                        layout
                        whileHover={{ y: -3 }}
                        className="bg-zinc-900/40 relative border border-zinc-850/70 p-6 rounded-2.5xl flex flex-col justify-between space-y-6 hover:border-zinc-750 transition-colors cursor-pointer group"
                        onClick={() => handleLaunchPlan(p)}
                        id={`plan-card-${p.id}`}
                      >
                        {/* Tags & info line */}
                        <div>
                          <div className="flex justify-between items-start mb-3.5">
                            <span className="font-mono text-[9px] uppercase tracking-widest font-extrabold bg-zinc-950 text-zinc-400 px-2 py-0.5 rounded border border-zinc-850">
                              {p.type === 'SETS' ? 'SETS BASED' : 'TIME CHALLENGE'}
                            </span>
                            
                            {isDefault ? (
                              <span className="text-[10px] text-zinc-550 font-sans tracking-wide">TEMPLATE Routine</span>
                            ) : (
                              <div className="flex space-x-1">
                                <button
                                  onClick={(e) => handleEditPlan(p, e)}
                                  className="text-zinc-500 hover:text-white p-1 bg-zinc-950 hover:bg-zinc-805 rounded-lg border border-zinc-900"
                                  title="Edit layout details"
                                >
                                  <Edit3 className="h-3.5 w-3.5" />
                                </button>
                                <button
                                  onClick={(e) => handleDeletePlan(p.id, e)}
                                  className="text-zinc-500 hover:text-red-400 p-1 bg-zinc-950 hover:bg-zinc-805 rounded-lg border border-zinc-900"
                                  title="Delete custom plan"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            )}
                          </div>

                          <h3 className="text-xl font-display font-black tracking-tight text-white group-hover:text-white transition-colors">{p.name}</h3>
                          
                          {/* Exercises list summary icons */}
                          <div className="flex flex-wrap gap-2 mt-4">
                            {p.exercises.map((ex, exIdx) => (
                              <div
                                key={ex.id || exIdx}
                                className="flex items-center gap-1 text-[11px] font-sans font-medium text-zinc-450 bg-zinc-955 px-2.5 py-1 rounded-xl border border-zinc-900/60"
                                title={ex.name}
                              >
                                <ExerciseIcon name={ex.icon} className="h-3 w-3 shrink-0 text-zinc-500" />
                                <span className="truncate max-w-[80px]">{ex.name}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Bottom status and launch action */}
                        <div className="flex items-center justify-between pt-4 border-t border-zinc-950 select-none">
                          <span className="text-xs text-zinc-500 font-mono">
                            {p.type === 'SETS' ? (
                              <span>{exerciseCount} Ex • {totalSets} Sets Total</span>
                            ) : (
                              <span>AMRAP Challenge • {Math.round(p.amrapDuration / 60)}m</span>
                            )}
                          </span>

                          <button
                            className={`flex items-center gap-1.5 text-xs font-display font-extrabold uppercase py-2.5 px-4 rounded-xl transition-all ${currentThemeConfig.accent} text-black shadow-lg`}
                            id={`btn-start-${p.id}`}
                          >
                            <Play className="h-3.5 w-3.5 fill-current" />
                            Launch Timer
                          </button>
                        </div>
                      </motion.div>
                    );
                  })}

                  {/* Empty Dashed Builder trigger */}
                  <div
                    onClick={() => {
                      setEditingPlan(null);
                      setView('CREATING');
                    }}
                    className="border-2 border-dashed border-zinc-850 hover:border-zinc-600 rounded-2.5xl p-6 flex flex-col items-center justify-center text-center space-y-3 cursor-pointer hover:bg-zinc-955/30 transition-all py-10"
                    id="dashed-trigger-builder"
                  >
                    <div className="h-11 w-11 rounded-full bg-zinc-900 flex items-center justify-center text-zinc-500">
                      <Plus className="h-5 w-5" />
                    </div>
                    <div>
                      <h4 className="font-display font-extrabold text-sm text-zinc-300">Design a New Routine</h4>
                      <p className="text-xs text-zinc-500 max-w-[200px] mx-auto mt-1 font-medium font-sans">
                        Tailor sets, workout times, and rests with personalized metrics.
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>
            ) : (
              /* TAB HISTORIC PERFORMANCE LOGS */
              <motion.div
                key="tab-history-element"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                <HistoryDashboard
                  history={history}
                  plans={plans}
                  onReplay={handleReplayFromHistory}
                  onClear={handleClearHistory}
                  themeConfig={currentThemeConfig}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
