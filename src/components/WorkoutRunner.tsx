import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Play, Pause, SkipForward, RotateCcw, X, Volume2, VolumeX,
  Mic, MicOff, Trophy, Flame, Zap, Shield, HelpCircle, Save, Star
} from 'lucide-react';
import { WorkoutPlan, ActiveWorkoutState, AppTheme, WorkoutHistoryEntry } from '../types';
import { audioSynth } from '../utils/audioSynth';
import { getRandomQuote } from '../utils/quotes';
import { addHistoryEntry } from '../utils/storage';
import ExerciseIcon from './ExerciseIcon';

interface WorkoutRunnerProps {
  plan: WorkoutPlan;
  theme: AppTheme;
  themeConfig: {
    accent: string;
    glow: string;
    bg: string;
    text: string;
    neonColor: string; // e.g. '#ef4444' for custom SVGs
  };
  onClose: () => void;
  onSaved: () => void;
}

// Simple floating React Confetti particle structure
interface ConfettiParticle {
  id: number;
  x: number;
  y: number;
  color: string;
  size: number;
  angle: number;
  duration: number;
}

export default function WorkoutRunner({
  plan,
  theme,
  themeConfig,
  onClose,
  onSaved
}: WorkoutRunnerProps) {
  // Settings
  const [soundOn, setSoundOn] = useState(true);
  const [coachOn, setCoachOn] = useState(true);

  const isSetsMode = plan.type === 'SETS';
  const isAutoCircuit = plan.type === 'AMRAP' && !!plan.amrapAutoCircuit;

  // Core workout state
  const [currentExerciseIdx, setCurrentExerciseIdx] = useState(0);
  const [currentSet, setCurrentSet] = useState(1);
  const [phase, setPhase] = useState<'GET_READY' | 'WORK' | 'REST' | 'COMPLETED'>('GET_READY');
  
  // Timer states
  const [secondsLeft, setSecondsLeft] = useState(isSetsMode || isAutoCircuit ? 5 : plan.amrapDuration);
  const [overallSecondsLeft, setOverallSecondsLeft] = useState(plan.type === 'AMRAP' ? plan.amrapDuration : 0);
  const [isPaused, setIsPaused] = useState(true);
  const [totalElapsed, setTotalElapsed] = useState(0);
  
  // AMRAP-specific
  const [amrapCompletedRounds, setAmrapCompletedRounds] = useState(0);

  // Decorative & gamification
  const [currentQuote, setCurrentQuote] = useState(getRandomQuote());
  const [showConfetti, setShowConfetti] = useState(false);
  const [confettiPool, setConfettiPool] = useState<ConfettiParticle[]>([]);
  const [vibrateTrigger, setVibrateTrigger] = useState(false);

  // End of workout stats (for celebration screen)
  const [effortRating, setEffortRating] = useState(4); // 1-5 Stars
  const [calEstimate, setCalEstimate] = useState(0);
  const [perfScore, setPerfScore] = useState(85);

  const timerRef = useRef<any>(null);
  const quoteIntervalRef = useRef<any>(null);
  
  // Exercises reference
  const currentEx = plan.exercises[currentExerciseIdx];

  // Calculate full SETS metrics to represent overall timeline
  const totalSetsGoal = isSetsMode 
    ? plan.exercises.reduce((sum, ex) => sum + ex.sets, 0)
    : 1;

  // Track sets completed historically in sets-based mode
  const setsCompletedCount = isSetsMode
    ? plan.exercises.slice(0, currentExerciseIdx).reduce((sum, ex) => sum + ex.sets, 0) + 
      (phase === 'REST' || (phase === 'WORK' && secondsLeft === 0) ? currentSet : currentSet - 1)
    : 0;

  // Sync controls with synthesizer instance
  useEffect(() => {
    audioSynth.isSoundEnabled = soundOn;
    audioSynth.isVoiceCoachEnabled = coachOn;
  }, [soundOn, coachOn]);

  // Initial trigger: Voice "Get Ready"
  useEffect(() => {
    // Speak introduction
    setTimeout(() => {
      if (isSetsMode) {
        audioSynth.speak(`Get ready for ${plan.exercises[0]?.name || 'workout'}.`);
      } else {
        audioSynth.speak(`Time challenge starts now. Complete as many rounds as possible!`);
      }
    }, 800);

    return () => {
      // Clean up synth loops on absolute unmount
      audioSynth.stopWorkPulse();
      audioSynth.stopRestAmbience();
    };
  }, [plan]);

  // Trigger custom tactile vibration
  const triggerHaptic = (pattern: number[]) => {
    if ('vibrate' in navigator) {
      try {
        navigator.vibrate(pattern);
      } catch (e) {}
    }
    // Visual jitter fallback
    setVibrateTrigger(true);
    setTimeout(() => setVibrateTrigger(false), 300);
  };

  // Launch brief localized celebrate confetti shower
  const launchConfetti = () => {
    setShowConfetti(true);
    const colors = theme === 'BEAST' 
      ? ['#f95738', '#ee9b00', '#f15bb5', '#9b5de5']
      : theme === 'ZEN'
      ? ['#38bdf8', '#0ea5e9', '#06b6d4', '#e0f2fe']
      : ['#22c55e', '#a3e635', '#22d3ee', '#facc15'];

    const pool = Array.from({ length: 45 }).map((_, idx) => ({
      id: idx + Date.now(),
      x: 30 + Math.random() * 40, // Centered range 30% to 70%
      y: 40 + Math.random() * 15, // Center elevation
      color: colors[Math.floor(Math.random() * colors.length)],
      size: 6 + Math.random() * 10,
      angle: Math.random() * 360,
      duration: 1.5 + Math.random() * 1.5
    }));
    setConfettiPool(pool);
    triggerHaptic([100, 50, 100]);

    setTimeout(() => {
      setShowConfetti(false);
      setConfettiPool([]);
    }, 3000);
  };

  // Sound loops mapping based on phase, work, paused status
  useEffect(() => {
    if (isPaused || phase === 'COMPLETED') {
      audioSynth.stopWorkPulse();
      audioSynth.stopRestAmbience();
      return;
    }

    if (phase === 'WORK') {
      audioSynth.stopRestAmbience();
      // Start bass workout heartbeat pulse (SETS: 110 bpm; AMRAP: 125 bpm for speed)
      audioSynth.startWorkPulse(isSetsMode ? 110 : 125);
    } else if (phase === 'REST') {
      audioSynth.stopWorkPulse();
      // Start deeply soothing respiration soundscape pad
      audioSynth.startRestAmbience();
    } else if (phase === 'GET_READY') {
      audioSynth.stopWorkPulse();
      audioSynth.stopRestAmbience();
    }
  }, [phase, isPaused]);

  // Quote rotation triggers every 14 seconds
  useEffect(() => {
    if (!isPaused && phase !== 'COMPLETED') {
      quoteIntervalRef.current = setInterval(() => {
        setCurrentQuote(getRandomQuote(currentQuote));
      }, 14000);
    }
    return () => {
      if (quoteIntervalRef.current) clearInterval(quoteIntervalRef.current);
    };
  }, [isPaused, currentQuote, phase]);

  // CORE TICKER EFFECT
  useEffect(() => {
    if (isPaused || phase === 'COMPLETED') {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    timerRef.current = setInterval(() => {
      setTotalElapsed(prev => prev + 1);

      if (isAutoCircuit) {
        setOverallSecondsLeft(prevOverall => {
          const nextOverall = prevOverall - 1;
          if (nextOverall <= 0) {
            clearInterval(timerRef.current);
            setTimeout(() => {
              handleWorkoutComplete();
            }, 0);
            return 0;
          }
          return nextOverall;
        });
      }

      setSecondsLeft(prevSec => {
        const nextSec = prevSec - 1;

        // Beep at last 5, 4, 3, 2, 1 seconds
        if (nextSec >= 0 && nextSec <= 5) {
          audioSynth.playCountdownBeep(nextSec);
          // Standard tactile sync pulse
          triggerHaptic([70]);
        }

        if (nextSec <= 0) {
          // Zero seconds reached: transit phase
          handlePhaseTransition();
          return 0;
        }

        return nextSec;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPaused, phase, currentExerciseIdx, currentSet, isAutoCircuit]);

  const handlePhaseTransition = () => {
    if (!isSetsMode && !isAutoCircuit) {
      // AMRAP countdown complete: End Workout
      handleWorkoutComplete();
      return;
    }

    if (isAutoCircuit) {
      if (phase === 'GET_READY') {
        setPhase('WORK');
        const workSecs = plan.amrapWorkDuration || currentEx.workDuration || 45;
        setSecondsLeft(workSecs);
        audioSynth.playGong();
        audioSynth.speak(`Go. ${currentEx.name}`);
        triggerHaptic([300]);
      } else if (phase === 'WORK') {
        setPhase('REST');
        const restSecs = plan.amrapRestDuration || currentEx.restDuration || 15;
        setSecondsLeft(restSecs);
        audioSynth.playGong();
        audioSynth.speak("Rest");
        launchConfetti();

        // Completed another full sequence rep
        const isLastExercise = currentExerciseIdx >= plan.exercises.length - 1;
        if (isLastExercise) {
          setAmrapCompletedRounds(prev => prev + 1);
        }
      } else if (phase === 'REST') {
        const isLastExercise = currentExerciseIdx >= plan.exercises.length - 1;
        const nextIdx = isLastExercise ? 0 : currentExerciseIdx + 1;
        
        setCurrentExerciseIdx(nextIdx);
        setPhase('GET_READY');
        setSecondsLeft(5);
        audioSynth.speak(`Next exercise, ${plan.exercises[nextIdx].name}. Ready in 5 seconds`);
      }
      return;
    }

    // SETS based transitions
    if (phase === 'GET_READY') {
      // Prepare finish, GO!
      setPhase('WORK');
      setSecondsLeft(currentEx.workDuration);
      audioSynth.playGong();
      audioSynth.speak("Go");
      triggerHaptic([300]);
    } else if (phase === 'WORK') {
      // Work segment finished, transitions to rest (except if absolute end)
      const isLastExercise = currentExerciseIdx >= plan.exercises.length - 1;
      const isLastSet = currentSet >= currentEx.sets;

      if (isLastExercise && isLastSet) {
        // Workout fully finished!
        handleWorkoutComplete();
      } else {
        // Transition to REST
        setPhase('REST');
        // Check if exercise transition has custom extra rest
        const extraRest = isLastSet ? (currentEx.nextExerciseRest || 0) : 0;
        const restSecs = currentEx.restDuration + extraRest;
        
        setSecondsLeft(restSecs);
        audioSynth.playGong(); // Bright beep/bell indicating work finish
        audioSynth.speak(extraRest > 0 ? "Exellent, rest transition" : "Rest");
        launchConfetti(); // Short set reward confetti!
      }
    } else if (phase === 'REST') {
      // Rest finish, transits to next set or next exercise
      const isLastSet = currentSet >= currentEx.sets;

      if (isLastSet) {
        // Move to next exercise prep
        const nextIdx = currentExerciseIdx + 1;
        setCurrentExerciseIdx(nextIdx);
        setCurrentSet(1);
        setPhase('GET_READY');
        setSecondsLeft(5); // 5 seconds get ready
        audioSynth.speak(`Next exercise, ${plan.exercises[nextIdx].name}. Ready in 5 seconds`);
      } else {
        // Move to next set of same exercise
        setCurrentSet(prev => prev + 1);
        setPhase('GET_READY');
        setSecondsLeft(5);
        audioSynth.speak(`Set ${currentSet + 1}. Get ready`);
      }
    }
  };

  const handleWorkoutComplete = () => {
    setPhase('COMPLETED');
    setIsPaused(true);
    audioSynth.stopWorkPulse();
    audioSynth.stopRestAmbience();
    audioSynth.speak("Workout complete! Outstanding effort! You are beast mode!");
    triggerHaptic([400, 200, 400]);
    launchConfetti();

    // Set final metrics
    const durationMins = Math.max(1, totalElapsed / 60);
    // Rough calorie formula: ~9 calories/min for standard work, ~11 for AMRAP HIIT challenges
    const calRate = !isSetsMode ? 11.2 : 9.4;
    setCalEstimate(Math.round(totalElapsed * (calRate / 60)));
  };

  // Action Controllers
  const togglePlayPause = () => {
    // Unlock Audio Context on first interaction
    audioSynth.speak(''); 
    setIsPaused(!isPaused);
  };

  const handleSkip = () => {
    triggerHaptic([100]);
    if (!isSetsMode && !isAutoCircuit) {
      // AMRAP skips end
      handleWorkoutComplete();
      return;
    }

    // Sets based and Auto-Circuit skip transitions to next interval segment
    handlePhaseTransition();
  };

  const handleRestartPhase = () => {
    triggerHaptic([150]);
    if (!isSetsMode && !isAutoCircuit) {
      // Restart full AMRAP countdown
      setSecondsLeft(plan.amrapDuration);
      setAmrapCompletedRounds(0);
      setTotalElapsed(0);
    } else if (isAutoCircuit) {
      // Reset full Auto-Circuit session
      setPhase('GET_READY');
      setSecondsLeft(5);
      setOverallSecondsLeft(plan.amrapDuration);
      setAmrapCompletedRounds(0);
      setTotalElapsed(0);
      setCurrentExerciseIdx(0);
      setCurrentSet(1);
    } else {
      // Reset current phase timer
      if (phase === 'GET_READY') setSecondsLeft(5);
      else if (phase === 'WORK') setSecondsLeft(currentEx.workDuration);
      else if (phase === 'REST') {
        const extraRest = currentSet === currentEx.sets ? (currentEx.nextExerciseRest || 0) : 0;
        setSecondsLeft(currentEx.restDuration + extraRest);
      }
    }
    setIsPaused(true);
  };

  const handleEndEarly = () => {
    const confirm = window.confirm("Are you sure you want to quit this workout early? Progress will be saved.");
    if (confirm) {
      handleWorkoutComplete();
    }
  };

  const calculatePerformanceScore = (rating: number) => {
    // Calculated based on sets completed ratio, and subjective rating
    const setsRatio = isSetsMode ? (setsCompletedCount / totalSetsGoal) : 1.0;
    const baseScore = Math.round(setsRatio * 75);
    const starBuff = rating * 5;
    return Math.min(100, baseScore + starBuff);
  };

  const saveWorkoutSession = () => {
    const finalPerfScore = calculatePerformanceScore(effortRating);
    const entry: WorkoutHistoryEntry = {
      id: `history-${Date.now()}`,
      planId: plan.id,
      name: plan.name,
      type: plan.type,
      date: Date.now(),
      totalDuration: totalElapsed,
      setsCompleted: isSetsMode ? setsCompletedCount : amrapCompletedRounds,
      totalSetsGoal: isSetsMode ? totalSetsGoal : amrapCompletedRounds || 1,
      caloriesBurned: calEstimate,
      performanceScore: finalPerfScore,
      themeUsed: theme
    };

    // Store
    addHistoryEntry(entry);
    onSaved();
  };

  // Circular timer percentages
  const maxPhaseDuration = (isSetsMode || isAutoCircuit)
    ? (phase === 'GET_READY'
      ? 5
      : phase === 'WORK'
      ? (isSetsMode ? currentEx.workDuration : (plan.amrapWorkDuration || 45))
      : (isSetsMode ? (currentEx.restDuration + (currentSet === currentEx.sets ? (currentEx.nextExerciseRest || 0) : 0)) : (plan.amrapRestDuration || 15)))
    : plan.amrapDuration;

  const dashProgress = maxPhaseDuration > 0 ? (secondsLeft / maxPhaseDuration) : 0;
  const strokeDashoffset = 2 * Math.PI * 90 * (1 - dashProgress);

  // Time format helper (MM:SS)
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Text status styles
  const getPhaseColorClass = () => {
    if (phase === 'GET_READY') return 'text-amber-400';
    if (phase === 'WORK') {
      return theme === 'BEAST' ? 'text-red-500' : theme === 'ZEN' ? 'text-sky-400' : 'text-green-500';
    }
    return 'text-teal-400';
  };

  return (
    <div
      className={`min-h-[85vh] gradient-noise flex flex-col justify-between text-white relative overflow-hidden px-4 md:px-8 py-6 rounded-3xl border border-zinc-800/60 ${
        vibrateTrigger ? 'scale-[0.99] transition-all bg-red-950/20' : ''
      }`}
      id="workout-execution-view"
    >
      {/* Floating custom Confetti implementation */}
      {showConfetti && (
        <div className="absolute inset-0 pointer-events-none z-55 overflow-hidden">
          {confettiPool.map((p) => (
            <motion.div
              key={p.id}
              initial={{ x: `${p.x}vw`, y: `${p.y}vh`, rotate: 0, opacity: 1 }}
              animate={{
                y: '100vh',
                rotate: p.angle + 360,
                opacity: 0
              }}
              transition={{ duration: p.duration, ease: 'easeOut' }}
              className="absolute rounded-full"
              style={{
                width: p.size,
                height: p.size,
                backgroundColor: p.color,
                boxShadow: `0 0 10px ${p.color}`
              }}
            />
          ))}
        </div>
      )}

      <AnimatePresence mode="wait">
        {phase !== 'COMPLETED' ? (
          <>
            {/* 1. TOP NAVBAR / LIVE PROGRESS BLOCK */}
            <div className="w-full space-y-4 z-10" id="runner-header-nav">
              <div className="flex justify-between items-center bg-zinc-950/40 p-3 rounded-2xl border border-zinc-900">
                <div className="flex items-center space-x-3">
                  <div className={`h-3 w-3 rounded-full animate-pulse ${themeConfig.accent}`} />
                  <div>
                    <h2 className="font-display font-extrabold text-sm tracking-wide line-clamp-1">{plan.name}</h2>
                    <p className="text-[10px] text-zinc-500 font-mono tracking-widest">{plan.type} CHALLENGE</p>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  {/* Sound Toggle */}
                  <button
                    onClick={() => setSoundOn(!soundOn)}
                    className="p-2 rounded-xl text-zinc-450 hover:text-white bg-zinc-900 border border-zinc-850 transition-all active:scale-95"
                    title={soundOn ? 'Mute Beeps' : 'Enable Beeps'}
                  >
                    {soundOn ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4 text-red-500" />}
                  </button>

                  {/* Coach Toggle */}
                  <button
                    onClick={() => setCoachOn(!coachOn)}
                    className="p-2 rounded-xl text-zinc-450 hover:text-white bg-zinc-900 border border-zinc-850 transition-all active:scale-95"
                    title={coachOn ? 'Mute Speech Coach' : 'Enable Speech Coach'}
                  >
                    {coachOn ? <Mic className="h-4 w-4" /> : <MicOff className="h-4 w-4 text-zinc-600" />}
                  </button>

                  {/* Quit */}
                  <button
                    onClick={() => {
                      const quit = window.confirm("Exit this workout and return to the dashboard? Your current progress will not be saved.");
                      if (quit) {
                        onClose();
                      }
                    }}
                    className="p-2 rounded-xl text-zinc-450 hover:text-red-400 bg-zinc-900/50 border border-zinc-900 hover:border-red-950 transition-all active:scale-95 ml-2"
                    title="Close"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Progress bars */}
              {isSetsMode ? (
                <div className="space-y-1.5 px-1 font-mono text-xs">
                  <div className="flex justify-between text-zinc-400">
                    <span className="font-display font-bold text-zinc-350">
                      EXERCISE {currentExerciseIdx + 1} of {plan.exercises.length}
                    </span>
                    <span className="font-bold text-white bg-zinc-900 px-2 py-0.5 rounded border border-zinc-850">
                      ROUND {setsCompletedCount + 1} / {totalSetsGoal}
                    </span>
                  </div>
                  {/* Global completion bar */}
                  <div className="h-1.5 w-full bg-zinc-950 rounded-full overflow-hidden border border-zinc-900">
                    <motion.div
                      className={`h-full ${themeConfig.accent}`}
                      initial={{ width: 0 }}
                      animate={{ width: `${((setsCompletedCount) / totalSetsGoal) * 100}%` }}
                      transition={{ duration: 0.4 }}
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-1.5 px-1 font-mono text-xs">
                  <div className="flex justify-between text-zinc-400">
                    <span className="font-display font-medium text-zinc-350">TIME CHALLENGE ACTIVE</span>
                    <span className="font-bold text-[#22c55e]">
                      ELAPSED: {formatTime(totalElapsed)}
                    </span>
                  </div>
                  {/* Total running elapsed vs target */}
                  <div className="h-1.5 w-full bg-zinc-950 rounded-full overflow-hidden border border-zinc-900 animate-pulse">
                    <div
                      className={`h-full ${themeConfig.accent}`}
                      style={{ width: `${Math.min(100, (totalElapsed / plan.amrapDuration) * 100)}%` }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* 2. BODY WORKOUT SCREEN PANEL: GRID LAYOUT FOR GENERAL GYM VIEWPORT */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center justify-center my-6 z-10 w-full" id="runner-main-panels">
              {/* LEFT SIDE PANEL (Sets Left info) */}
              <div className={`hidden md:flex flex-col bg-[#0d0d0e]/95 p-5 rounded-2.5xl transition-all duration-300 border ${
                phase === 'WORK' 
                  ? theme === 'BEAST' ? 'work-active-beast' : theme === 'ZEN' ? 'work-active-zen' : 'work-active-energy'
                  : 'border-zinc-900'
              } text-center space-y-2 select-none group`}>
                <span className="text-zinc-500 font-mono font-bold text-[10px] uppercase tracking-[0.2em]">
                  {isSetsMode ? 'SETS REMAINING' : 'CHALLENGE LOOP'}
                </span>
                {isSetsMode ? (
                  <div className="py-2">
                    <h3 className={`text-5xl font-mono font-black tracking-tight ${
                      theme === 'BEAST' ? 'text-[#FF4D00]' : theme === 'ZEN' ? 'text-[#38bdf8]' : 'text-emerald-500'
                    } beast-glow`}>
                      {String(totalSetsGoal - setsCompletedCount).padStart(2, '0')}
                    </h3>
                    <p className="text-[10px] text-zinc-400 mt-2 font-mono uppercase tracking-wider">Interval Rounds Left</p>
                    {/* Simulated physical signal strength segment lights */}
                    <div className="flex justify-center gap-1.5 mt-4">
                      {Array.from({ length: 5 }).map((_, idx) => (
                        <div
                          key={idx}
                          className={`h-4 w-1.5 rounded-sm transition-all duration-300 ${
                            idx < (totalSetsGoal - setsCompletedCount) 
                              ? theme === 'BEAST' ? 'bg-[#FF4D00] shadow-[0_0_8px_#FF4D00]' : theme === 'ZEN' ? 'bg-[#38bdf8] shadow-[0_0_8px_#38bdf8]' : 'bg-green-500 shadow-[0_0_8px_#22c55e]'
                              : 'bg-zinc-900'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2 mt-1 text-left" id="runner-left-panel-circuit">
                    <p className="text-[10px] font-mono font-bold uppercase tracking-wider text-zinc-500">Target Routine Loop:</p>
                    <div className="space-y-1 mt-1.5">
                      {plan.exercises.map((ex, i) => {
                        const isActive = isAutoCircuit && i === currentExerciseIdx;
                        return (
                          <div
                            key={ex.id}
                            className={`flex items-center gap-2 text-[11px] py-1.5 px-2 rounded-lg font-medium transition-all ${
                              isActive
                                ? theme === 'BEAST'
                                  ? 'bg-[#FF4D00]/10 border border-[#FF4D00]/30 text-[#FF4D00]'
                                  : theme === 'ZEN'
                                  ? 'bg-[#38bdf8]/10 border border-[#38bdf8]/30 text-[#38bdf8]'
                                  : 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400'
                                : 'text-zinc-500 border border-transparent'
                            }`}
                          >
                            <ExerciseIcon name={ex.icon} className={`h-3.5 w-3.5 shrink-0 ${isActive ? 'opacity-100' : 'opacity-40'}`} />
                            <span className="truncate">{ex.name}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* CENTER MASSIVE ANIMATED TIMER CIRCLE WITH HARDWARE DIAL CASING */}
              <div className="md:col-span-2 flex flex-col items-center justify-center relative">
                <div className={`relative w-80 h-80 flex items-center justify-center select-none bg-[#0a0a0b] rounded-full border-4 border-zinc-900 shadow-2xl transition-all duration-500 ${
                  phase === 'WORK'
                    ? theme === 'BEAST' ? 'work-active-beast shadow-[#FF4D00]/10' : theme === 'ZEN' ? 'work-active-zen shadow-sky-400/10' : 'work-active-energy shadow-green-500/10'
                    : 'shadow-black'
                }`} id="countdown-circle-container">
                  {/* Outer physical ticks decorative overlay */}
                  <div className="absolute inset-2 border border-zinc-800/10 rounded-full border-dashed animate-[spin_120s_linear_infinite] pointer-events-none" />
                  
                  {/* Pulsing state aura based on workout action */}
                  <div
                    className={`absolute inset-6 rounded-full filter blur-2xl transition-all duration-500 ${
                      phase === 'WORK'
                        ? 'bg-[#FF4D00]/10 animate-work-pulse'
                        : phase === 'REST'
                        ? 'bg-sky-500/10 animate-breath'
                        : 'bg-amber-500/5'
                    }`}
                  />

                  {/* SVG Countdown Ring */}
                  <svg className="absolute w-full h-full transform -rotate-90">
                    {/* Dark hardware baseline tick ring */}
                    <circle
                      cx="160"
                      cy="160"
                      r="90"
                      className="stroke-zinc-950"
                      strokeWidth="10"
                      fill="transparent"
                    />
                    {/* Dynamic styled neon physical status progress ring */}
                    <motion.circle
                      cx="160"
                      cy="160"
                      r="90"
                      className={`stroke-current ${getPhaseColorClass()}`}
                      strokeWidth="12"
                      fill="transparent"
                      strokeDasharray={2 * Math.PI * 90}
                      animate={{ strokeDashoffset }}
                      transition={{ duration: 1, ease: 'linear' }}
                      strokeLinecap="round"
                    />
                  </svg>

                  {/* Central Text Metrics, using high contrast display pairing */}
                  <div className="z-10 text-center flex flex-col items-center max-w-[210px] " id="countdown-central-metrics">
                    {/* Small Phase label styling with spacing like instrument meters */}
                    <motion.span
                      key={phase}
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`text-xs font-mono font-black tracking-[0.3em] h-5 uppercase font-display bg-zinc-950 px-3 py-0.5 rounded border border-zinc-900/60 ${getPhaseColorClass()}`}
                    >
                      {phase === 'GET_READY' ? 'GET READY' : phase}
                    </motion.span>

                    {/* Highly-readable large electronic digital gym clock timer */}
                    <h1 className="text-6xl font-mono font-extrabold tracking-tight text-white my-1.5 beast-glow" id="large-clock">
                      {formatTime(secondsLeft)}
                    </h1>

                    {/* Active Exercise Label */}
                    <h2 className="text-xs font-mono font-bold text-zinc-400 uppercase tracking-widest truncate max-w-[170px]" id="runner-exercise-subtitle">
                      {isSetsMode || isAutoCircuit ? currentEx.name : 'ALL EXERCISES'}
                    </h2>

                    {/* Set counter status label */}
                    {isSetsMode && (
                      <span className="text-[10px] font-mono font-black text-zinc-400 mt-2.5 bg-zinc-950 px-3 py-1 rounded-full border border-zinc-900/95 tracking-widest">
                        SET {currentSet} / {currentEx.sets}
                      </span>
                    )}

                    {isAutoCircuit && (
                      <div className="flex flex-col items-center mt-2 gap-0.5 select-none text-center">
                        <span className="text-[9px] font-mono font-black text-emerald-400 bg-zinc-950 px-2 rounded-md border border-zinc-900 tracking-wider">
                          LAP: {currentExerciseIdx + 1} / {plan.exercises.length}
                        </span>
                        <span className="text-[10px] font-mono font-extrabold text-orange-400 tracking-wider mt-0.5">
                          SESSION: {formatTime(overallSecondsLeft)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* RIGHT SIDE PANEL (Sets Completed info) */}
              <div className={`hidden md:flex flex-col bg-[#0d0d0e]/95 p-5 rounded-2.5xl transition-all duration-300 border ${
                phase === 'WORK' 
                  ? theme === 'BEAST' ? 'work-active-beast' : theme === 'ZEN' ? 'work-active-zen' : 'work-active-energy'
                  : 'border-zinc-900'
              } text-center space-y-2 select-none group`}>
                <span className="text-zinc-500 font-mono font-bold text-[10px] uppercase tracking-[0.2em]">
                  {isSetsMode ? 'SETS COMPLETED' : (isAutoCircuit ? 'CIRCUITS COMPLETED' : 'ROUNDS LOGGED')}
                </span>
                
                {isSetsMode ? (
                  <div className="py-2">
                    <h3 className={`text-5xl font-mono font-black tracking-tight ${themeConfig.text} beast-glow`}>
                      {String(setsCompletedCount).padStart(2, '0')}
                    </h3>
                    <p className="text-[10px] text-zinc-400 mt-2 font-mono uppercase tracking-wider">Interval Rounds Done</p>
                    
                    {/* Simulated physical session progress bar */}
                    <div className="mt-4 flex gap-1 h-2 bg-zinc-950 rounded border border-zinc-900/60 p-0.5 overflow-hidden">
                      {Array.from({ length: totalSetsGoal }).map((_, index) => (
                        <div
                          key={index}
                          className={`h-full rounded-xs flex-1 transition-colors duration-300 ${
                            index < setsCompletedCount
                              ? theme === 'BEAST' ? 'bg-[#FF4D00]' : theme === 'ZEN' ? 'bg-[#38bdf8]' : 'bg-green-500'
                              : 'bg-zinc-900'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                ) : isAutoCircuit ? (
                  <div className="py-2 text-center space-y-3">
                    <div>
                      <h3 className={`text-4xl font-mono font-black tracking-tight ${themeConfig.text} beast-glow`}>
                        {String(amrapCompletedRounds).padStart(2, '0')}
                      </h3>
                      <p className="text-[10px] text-zinc-400 mt-1 font-mono uppercase tracking-wider">Completed Circuits</p>
                    </div>

                    <div className="bg-zinc-950/80 p-2.5 rounded-xl border border-zinc-900 text-left space-y-1.5" id="circuit-runner-info-block">
                      <div className="flex justify-between items-center text-[10px] font-mono">
                        <span className="text-zinc-500">WORK INTERVAL:</span>
                        <span className="text-emerald-400 font-bold">{plan.amrapWorkDuration || 45}s</span>
                      </div>
                      <div className="flex justify-between items-center text-[10px] font-mono">
                        <span className="text-zinc-500">REST PERIOD:</span>
                        <span className="text-teal-450 font-bold">{plan.amrapRestDuration || 15}s</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <>
                    <h3 className="text-4xl font-mono font-extrabold text-emerald-400/90">{amrapCompletedRounds}</h3>
                    <button
                      onClick={() => {
                        setAmrapCompletedRounds(prev => prev + 1);
                        triggerHaptic([100, 50, 100]);
                        launchConfetti();
                      }}
                      className="mt-3 w-full bg-emerald-600 hover:bg-emerald-500 text-black font-display font-extrabold uppercase py-2 px-3 text-xs rounded-xl tracking-wider transition-all transform active:scale-95 shadow-md flex items-center justify-center gap-1"
                      id="btn-increment-amrap-round"
                    >
                      <Trophy className="h-3.5 w-3.5" />
                      Round Done
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Mobile Sets display (Visible on small displays only) */}
            <div className="flex md:hidden items-center justify-between px-2 py-3 bg-zinc-950/20 border border-zinc-850/30 rounded-2xl z-10 w-full mb-2">
              <div className="text-center flex-1 py-1 border-r border-zinc-900 select-none">
                <p className="text-[9px] text-zinc-500 font-display font-bold">
                  {isAutoCircuit ? 'SESSION CLOCK' : 'INTERVALS REMAINING'}
                </p>
                <div className="font-mono text-lg sm:text-xl font-extrabold text-amber-500">
                  {isAutoCircuit ? formatTime(overallSecondsLeft) : (isSetsMode ? totalSetsGoal - setsCompletedCount : plan.exercises.length)}
                </div>
              </div>
              <div className="text-center flex-1 py-1 select-none">
                <p className="text-[9px] text-zinc-500 font-display font-bold">
                  {isSetsMode ? 'INTERVALS COMPLETED' : (isAutoCircuit ? 'CIRCUITS CONQUERED' : 'ROUNDS HANDLED')}
                </p>
                <div className={`font-mono text-lg sm:text-xl font-extrabold ${themeConfig.text}`}>
                  {isSetsMode ? setsCompletedCount : amrapCompletedRounds}
                </div>
                {!isSetsMode && !isAutoCircuit && (
                  <button
                    onClick={() => {
                      setAmrapCompletedRounds(prev => prev + 1);
                      triggerHaptic([100, 50, 100]);
                      launchConfetti();
                    }}
                    className="mt-1 mx-auto bg-emerald-500 text-black font-display font-extrabold text-[10px] py-1 px-3 rounded-lg flex items-center gap-0.5 justify-center"
                  >
                    + Round
                  </button>
                )}
              </div>
            </div>

            {/* 3. DYNAMIC MOTIVATIONAL QUOTES BAR */}
            <div className="w-full text-center py-4 bg-zinc-955/45 border-t border-b border-zinc-900/60 z-10 select-none flex items-center justify-center min-h-[50px]">
              <AnimatePresence mode="wait">
                <motion.p
                  key={currentQuote}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 0.85, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.6 }}
                  className="font-display italic text-sm md:text-base font-medium text-zinc-200 px-6 line-clamp-1 py-0.5"
                  id="runner-motivational-quote"
                >
                  “{currentQuote}”
                </motion.p>
              </AnimatePresence>
            </div>

            {/* 4. LARGE BOTTOM CONTROL BUTTONS */}
            <div className="w-full flex items-center justify-center space-x-6 py-4 z-10" id="runner-control-bar">
              {/* Restart current timer segment */}
              <button
                onClick={handleRestartPhase}
                className="p-4 rounded-2xl bg-zinc-950/60 border border-zinc-850/70 hover:border-zinc-700 text-zinc-400 hover:text-white transition-all transform active:scale-90 shadow-md"
                title="Restart phase timer"
              >
                <RotateCcw className="h-5 w-5" />
              </button>

              {/* Main Play / Pause larger button */}
              <button
                onClick={togglePlayPause}
                className={`p-6 rounded-3xl text-black transition-all transform hover:scale-105 active:scale-95 shadow-2.5xl flex items-center justify-center ${
                  isPaused
                    ? theme === 'BEAST'
                      ? 'bg-[#f95738] hover:bg-[#ff7b5f] glow-beast'
                      : theme === 'ZEN'
                      ? 'bg-[#38bdf8] hover:bg-[#7dd3fc] glow-zen'
                      : 'bg-[#22c55e] hover:bg-[#4ade80] glow-energy'
                    : 'bg-white hover:bg-zinc-200'
                }`}
                id="btn-play-pause-timer"
                title={isPaused ? 'Start countdown' : 'Pause workout timer'}
              >
                {isPaused ? (
                  <Play className="h-7 w-7 fill-current ml-0.5" />
                ) : (
                  <Pause className="h-7 w-7 fill-current" />
                )}
              </button>

              {/* Skip ahead */}
              <button
                onClick={handleSkip}
                className="p-4 rounded-2xl bg-zinc-950/60 border border-zinc-850/70 hover:border-zinc-700 text-zinc-400 hover:text-white transition-all transform active:scale-90 shadow-md"
                title="Skip this interval"
              >
                <SkipForward className="h-5 w-5" />
              </button>
            </div>
          </>
        ) : (
          /* CELEBRATION COMPONENT - WORKOUT COMPLETED VISUALIZATION */
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-lg mx-auto py-4 text-center space-y-6 z-10"
            id="runner-celebration-panel"
          >
            <div className="bg-zinc-900/60 backdrop-blur-xl border border-zinc-800 rounded-3xl p-8 space-y-8">
              {/* Giant Trophy Badge */}
              <div className="flex flex-col items-center space-y-2">
                <div className={`relative h-20 w-20 rounded-full flex items-center justify-center glow-beast animate-bounce`}>
                  <Trophy className={`h-10 w-10 text-amber-400 fill-amber-400`} />
                </div>
                <h1 className="text-3xl font-display font-extrabold text-white tracking-tight mt-3">WORKOUT COMPLETE!</h1>
                <p className="text-zinc-450 font-medium text-sm">You successfully conquered the beast domain today!</p>
              </div>

              {/* Live metrics widgets */}
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-zinc-950 p-4 rounded-2xl border border-zinc-850">
                  <span className="text-[10px] font-display font-semibold text-zinc-550 block mb-1">DURATION</span>
                  <span className="text-lg font-mono font-extrabold text-white">{formatTime(totalElapsed)}</span>
                </div>
                
                <div className="bg-zinc-950 p-4 rounded-2xl border border-zinc-850">
                  <span className="text-[10px] font-display font-semibold text-zinc-550 block mb-1">CALORIES</span>
                  <span className="text-lg font-mono font-extrabold text-red-400">{calEstimate} KCAL</span>
                </div>

                <div className="bg-zinc-950 p-4 rounded-2xl border border-zinc-850">
                  <span className="text-[10px] font-display font-semibold text-zinc-550 block mb-1">COMPLETED</span>
                  <span className="text-lg font-mono font-extrabold text-sky-400">
                    {isSetsMode ? `${setsCompletedCount}/${totalSetsGoal}` : `${amrapCompletedRounds} Rnds`}
                  </span>
                </div>
              </div>

              {/* Subjective Star Rating */}
              <div className="bg-zinc-950 p-5 rounded-2xl border border-zinc-850 text-center space-y-3">
                <span className="text-xs font-display font-bold text-zinc-400 tracking-wider block">RATE YOUR PERFORMANCE</span>
                <div className="flex justify-center space-x-2">
                  {[1, 2, 3, 4, 5].map((star) => {
                    const active = star <= effortRating;
                    return (
                      <button
                        key={star}
                        id={`btn-rating-${star}`}
                        onClick={() => {
                          setEffortRating(star);
                          triggerHaptic([50]);
                        }}
                        className="p-1 transition-colors"
                      >
                        <Star
                          className={`h-7 w-7 ${
                            active ? 'text-amber-400 fill-amber-400' : 'text-zinc-650'
                          } transition-all transform active:scale-120`}
                        />
                      </button>
                    );
                  })}
                </div>
                <p className="text-xs font-sans text-zinc-550 font-medium">
                  {effortRating <= 2 ? 'Felt off or slow today. Back on it tomorrow!' : effortRating === 3 ? 'Finished sets steadily. Balanced pace.' : 'Aggressive beast tempo! Extremely powerful energy.'}
                </p>
              </div>

              {/* Primary action */}
              <div className="space-y-3 pt-2">
                <button
                  onClick={saveWorkoutSession}
                  className={`w-full py-4 px-6 rounded-2xl font-display font-extrabold uppercase tracking-wider text-sm text-black transition-all transform active:scale-95 shadow-lg flex items-center justify-center gap-2 ${
                    theme === 'BEAST'
                      ? 'bg-[#f95738] hover:bg-[#ff7b5f]'
                      : theme === 'ZEN'
                      ? 'bg-[#38bdf8] hover:bg-[#7dd3fc]'
                      : 'bg-[#22c55e] hover:bg-[#4ade80]'
                  }`}
                  id="btn-save-session-history"
                >
                  <Save className="h-4.5 w-4.5" />
                  Save Workout to History
                </button>
                <button
                  onClick={onClose}
                  className="w-full py-3.5 px-6 rounded-2xl font-display font-bold text-sm text-zinc-400 hover:text-white bg-zinc-900 border border-zinc-850 transition-colors"
                  id="btn-skip-saving-session"
                >
                  Discard Session
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
