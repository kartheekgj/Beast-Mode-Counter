import React from 'react';
import { motion } from 'motion/react';
import {
  History, Calendar, Clock, Flame, Shield, Trophy, Trash2,
  Play, Award, TrendingUp, BarChart2
} from 'lucide-react';
import { WorkoutHistoryEntry, WorkoutPlan } from '../types';

interface HistoryDashboardProps {
  history: WorkoutHistoryEntry[];
  plans: WorkoutPlan[];
  onReplay: (planId: string) => void;
  onClear: () => void;
  themeConfig: {
    accent: string;
    text: string;
    bg: string;
  };
}

export default function HistoryDashboard({
  history,
  plans,
  onReplay,
  onClear,
  themeConfig
}: HistoryDashboardProps) {

  // Cumulative Stat Math
  const totalWorkouts = history.length;
  const totalSeconds = history.reduce((sum, entry) => sum + entry.totalDuration, 0);
  const totalCalories = history.reduce((sum, entry) => sum + entry.caloriesBurned, 0);
  
  const totalMinutes = Math.round(totalSeconds / 60);

  // Score description color band
  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-emerald-400 bg-emerald-950/40 border-emerald-900/50';
    if (score >= 75) return 'text-sky-400 bg-sky-950/40 border-sky-900/50';
    return 'text-amber-400 bg-amber-950/40 border-amber-900/50';
  };

  const formatHistoryDate = (timestamp: number) => {
    const d = new Date(timestamp);
    return d.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleClearPrompt = () => {
    const confirm = window.confirm("Are you sure you want to permanently delete all your workout history? This cannot be undone.");
    if (confirm) {
      onClear();
    }
  };

  return (
    <div className="space-y-6" id="history-dashboard-section">
      {/* 1. STATISTICS HEADER CUMULATIVE BOARD */}
      <h2 className="text-xl font-display font-extrabold text-white flex items-center gap-2">
        <BarChart2 className={`h-5 w-5 ${themeConfig.text}`} />
        Beast Stats Tracker
      </h2>
      
      <div className="grid grid-cols-3 gap-3" id="history-stats-grid">
        {/* Total workouts */}
        <div className="bg-zinc-900/40 border border-zinc-850/80 p-4 rounded-2xl flex flex-col justify-between select-none">
          <span className="text-[10px] font-display font-extrabold text-zinc-500 uppercase tracking-wider block">Completed</span>
          <div className="flex items-baseline space-x-1 mt-1.5">
            <span className="text-2xl md:text-3xl font-mono font-extrabold text-white">{totalWorkouts}</span>
            <span className="text-[10px] text-zinc-550 font-sans font-bold">sets</span>
          </div>
        </div>

        {/* Total Active minutes */}
        <div className="bg-zinc-900/40 border border-zinc-850/80 p-4 rounded-2xl flex flex-col justify-between select-none p-4">
          <span className="text-[10px] font-display font-extrabold text-zinc-500 uppercase tracking-wider block">Duration</span>
          <div className="flex items-baseline space-x-1 mt-1.5">
            <span className="text-2xl md:text-3xl font-mono font-extrabold text-amber-500">{totalMinutes}</span>
            <span className="text-[10px] text-zinc-550 font-sans font-bold">mins</span>
          </div>
        </div>

        {/* Total calories */}
        <div className="bg-zinc-900/40 border border-zinc-850/80 p-4 rounded-2xl flex flex-col justify-between select-none p-4">
          <span className="text-[10px] font-display font-extrabold text-zinc-500 uppercase tracking-wider block">Calories</span>
          <div className="flex items-baseline space-x-1 mt-1.5">
            <span className="text-2xl md:text-3xl font-mono font-extrabold text-red-400">{totalCalories}</span>
            <span className="text-[10px] text-zinc-550 font-sans font-bold">kcal</span>
          </div>
        </div>
      </div>

      {/* 2. HISTORY LIST BOARD */}
      <div className="flex items-center justify-between border-b border-zinc-850 pb-3 mt-8">
        <h3 className="text-base font-display font-bold text-zinc-300 flex items-center gap-2">
          <History className="h-4.5 w-4.5 text-zinc-500" />
          Workout History Logs
        </h3>
        {history.length > 0 && (
          <button
            onClick={handleClearPrompt}
            className="text-xs text-red-500/80 hover:text-red-400 flex items-center gap-1 font-mono uppercase font-bold tracking-wider py-1 px-2.5 rounded-lg border border-transparent hover:border-red-950/40 hover:bg-red-950/20 transition-all"
            id="btn-clear-history-logs"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Clear
          </button>
        )}
      </div>

      {history.length === 0 ? (
        <div className="text-center py-10 bg-zinc-950/40 rounded-2xl border border-zinc-900 text-zinc-550 space-y-2">
          <Trophy className="h-8 w-8 mx-auto stroke-1" />
          <p className="font-display font-semibold text-sm">No gym sessions logged yet.</p>
          <p className="text-xs font-sans max-w-[250px] mx-auto text-zinc-650">Select or design a custom workout above to kick in beast mode!</p>
        </div>
      ) : (
        <div className="space-y-3.5" id="history-logs-stack">
          {history.map((entry) => {
            const planExists = plans.some(p => p.id === entry.planId);
            return (
              <motion.div
                key={entry.id}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-zinc-900/35 border border-zinc-850/70 p-4.5 rounded-2xl hover:border-zinc-800 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                {/* Meta details */}
                <div className="space-y-1">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <h4 className="font-display font-extrabold text-base text-white">{entry.name}</h4>
                    <span className="font-mono text-[9px] uppercase tracking-wider bg-zinc-950 text-zinc-400 px-2 py-0.5 rounded border border-zinc-850">
                      {entry.type === 'SETS' ? 'Intervals' : 'AMRAP'}
                    </span>
                    <span className={`font-mono text-[10px] px-2 py-0.5 rounded border ${getScoreColor(entry.performanceScore)}`}>
                      Score: {entry.performanceScore}%
                    </span>
                  </div>

                  <div className="flex items-center gap-4 text-xs text-zinc-500 font-medium pt-1 font-sans">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5" />
                      {formatHistoryDate(entry.date)}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" />
                      {Math.floor(entry.totalDuration / 60)}m {entry.totalDuration % 60}s
                    </span>
                    <span className="flex items-center gap-1 text-red-500/80">
                      <Flame className="h-3.5 w-3.5" />
                      {entry.caloriesBurned} kcal
                    </span>
                  </div>
                </div>

                {/* Quick actions (Replay, etc.) */}
                <div className="flex items-center justify-between md:justify-end gap-3 border-t md:border-t-0 border-zinc-850/50 pt-2 md:pt-0">
                  <div className="text-left md:text-right font-mono text-xs text-zinc-450">
                    {entry.type === 'SETS' ? (
                      <div>
                        Sets: <span className="text-white font-extrabold">{entry.setsCompleted}/{entry.totalSetsGoal}</span>
                      </div>
                    ) : (
                      <div>
                        Rounds: <span className="text-emerald-400 font-extrabold">{entry.setsCompleted} Completed</span>
                      </div>
                    )}
                  </div>

                  {planExists && (
                    <button
                      onClick={() => onReplay(entry.planId)}
                      className={`flex items-center gap-1 text-xs font-display font-extrabold uppercase tracking-wider py-2 px-3.5 rounded-xl border border-zinc-850 bg-zinc-900 hover:bg-zinc-805 text-white active:scale-95 transition-all`}
                      id={`btn-replay-history-${entry.id}`}
                    >
                      <Play className="h-3.5 w-3.5 text-zinc-450 fill-current" />
                      Replay
                    </button>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
