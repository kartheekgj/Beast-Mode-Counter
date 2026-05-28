import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, Trash2, ArrowLeft, Save, Sparkles, AlertCircle, Dumbbell } from 'lucide-react';
import { WorkoutPlan, Exercise, WorkoutType, AppTheme } from '../types';
import ExerciseIcon, { EXERCISE_ICONS } from './ExerciseIcon';

interface WorkoutCreatorProps {
  theme: AppTheme;
  themeConfig: {
    accent: string;
    glow: string;
    bg: string;
    text: string;
  };
  onSave: (plan: WorkoutPlan) => void;
  onCancel: () => void;
  editingPlan?: WorkoutPlan | null;
}

export default function WorkoutCreator({
  theme,
  themeConfig,
  onSave,
  onCancel,
  editingPlan
}: WorkoutCreatorProps) {
  // Setup forms or initial states
  const [name, setName] = useState(editingPlan ? editingPlan.name : '');
  const [type, setType] = useState<WorkoutType>(editingPlan ? editingPlan.type : 'SETS');
  
  // Exercises list state
  const [exercises, setExercises] = useState<Exercise[]>(
    editingPlan && editingPlan.exercises.length > 0
      ? editingPlan.exercises
      : [
          {
            id: 'ex-init-1',
            name: 'Explosive Push-ups',
            icon: 'zap',
            sets: 3,
            workDuration: 45,
            restDuration: 15,
            nextExerciseRest: 30
          }
        ]
  );

  // AMRAP duration in minutes
  const [amrapMins, setAmrapMins] = useState(
    editingPlan && editingPlan.type === 'AMRAP' 
      ? Math.max(1, Math.round(editingPlan.amrapDuration / 60)) 
      : 15
  );

  const [amrapAutoCircuit, setAmrapAutoCircuit] = useState(
    editingPlan && editingPlan.type === 'AMRAP' 
      ? (editingPlan.amrapAutoCircuit ?? true) 
      : true
  );

  const [amrapWorkDuration, setAmrapWorkDuration] = useState(
    editingPlan && editingPlan.type === 'AMRAP' 
      ? (editingPlan.amrapWorkDuration ?? 45) 
      : 45
  );

  const [amrapRestDuration, setAmrapRestDuration] = useState(
    editingPlan && editingPlan.type === 'AMRAP' 
      ? (editingPlan.amrapRestDuration ?? 15) 
      : 15
  );

  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleAddExercise = () => {
    const newEx: Exercise = {
      id: `ex-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      name: type === 'SETS' ? 'New Exercise' : 'Next Task',
      icon: EXERCISE_ICONS[Math.floor(Math.random() * EXERCISE_ICONS.length)].id,
      sets: type === 'SETS' ? 3 : 1, // AMRAP usually has 1 loop representation
      workDuration: type === 'SETS' ? 45 : 0,
      restDuration: type === 'SETS' ? 15 : 0,
      nextExerciseRest: type === 'SETS' ? 30 : 0
    };
    setExercises([...exercises, newEx]);
  };

  const handleRemoveExercise = (index: number) => {
    if (exercises.length <= 1) {
      setErrorMsg("A workout plan must contain at least 1 exercise.");
      setTimeout(() => setErrorMsg(null), 4000);
      return;
    }
    const copy = [...exercises];
    copy.splice(index, 1);
    setExercises(copy);
  };

  const updateExerciseField = (index: number, field: keyof Exercise, value: any) => {
    const copy = [...exercises];
    copy[index] = { ...copy[index], [field]: value };
    setExercises(copy);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      setErrorMsg("Please provide a workout name.");
      return;
    }

    // Validations
    for (let i = 0; i < exercises.length; i++) {
      if (!exercises[i].name.trim()) {
        setErrorMsg(`Exercise #${i + 1} requires a valid name.`);
        return;
      }
      if (type === 'SETS') {
        if (exercises[i].sets <= 0) {
          setErrorMsg(`Exercise "${exercises[i].name}" requires at least 1 set.`);
          return;
        }
        if (exercises[i].workDuration <= 2) {
          setErrorMsg(`Active duration for "${exercises[i].name}" must be at least 3 seconds.`);
          return;
        }
      }
    }

    const payload: WorkoutPlan = {
      id: editingPlan ? editingPlan.id : `plan-${Date.now()}`,
      name: name.trim(),
      type,
      exercises: exercises.map(ex => ({
        ...ex,
        sets: type === 'AMRAP' ? 1 : ex.sets,
        workDuration: type === 'AMRAP' ? amrapWorkDuration : ex.workDuration,
        restDuration: type === 'AMRAP' ? amrapRestDuration : ex.restDuration,
        nextExerciseRest: type === 'AMRAP' ? 0 : ex.nextExerciseRest
      })),
      amrapDuration: type === 'AMRAP' ? amrapMins * 60 : 0,
      amrapWorkDuration: type === 'AMRAP' ? amrapWorkDuration : undefined,
      amrapRestDuration: type === 'AMRAP' ? amrapRestDuration : undefined,
      amrapAutoCircuit: type === 'AMRAP' ? amrapAutoCircuit : undefined,
      createdAt: editingPlan ? editingPlan.createdAt : Date.now()
    };

    onSave(payload);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      className="max-w-2xl mx-auto px-4 py-6"
      id="workout-creator-section"
    >
      {/* Header action */}
      <div className="flex items-center justify-between mb-8">
        <button
          onClick={onCancel}
          className="flex items-center space-x-2 text-zinc-400 hover:text-white transition-colors bg-zinc-900/80 px-3 py-2 rounded-xl border border-zinc-800"
          id="btn-creator-back"
        >
          <ArrowLeft className="h-4 w-4" />
          <span className="text-sm font-medium font-display">Back to Plans</span>
        </button>
        <span className="text-zinc-500 font-mono text-xs">
          {editingPlan ? 'MODE: EDIT PLAN' : 'MODE: FRESH BUILD'}
        </span>
      </div>

      <div className="mb-6">
        <h1 className="text-3xl font-display font-extrabold text-white tracking-tight flex items-center gap-2">
          <Sparkles className={`h-7 w-7 ${themeConfig.text}`} />
          {editingPlan ? 'Modify Workout' : 'Build Custom Plan'}
        </h1>
        <p className="text-sm text-zinc-400 mt-1">
          Configure sets, durations, and targets for high performance tracking.
        </p>
      </div>

      {/* Warning banner */}
      <AnimatePresence>
        {errorMsg && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-6 bg-red-950/80 border border-red-800 text-red-200 p-4 rounded-xl flex items-start gap-3 text-sm font-sans"
            id="creator-error-banner"
          >
            <AlertCircle className="h-5 w-5 text-red-400 shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Name & Type Cards */}
        <div className="bg-zinc-900/60 backdrop-blur-xl border border-zinc-800/80 rounded-2xl p-6 space-y-6">
          <div>
            <label className="block text-zinc-400 font-display text-sm font-semibold mb-2" htmlFor="workout-name-input">
              WORKOUT TITLE
            </label>
            <input
              id="workout-name-input"
              type="text"
              placeholder="e.g., HIIT Fire Circuit, Heavy Push Day..."
              className="w-full bg-zinc-950 border border-zinc-800 focus:border-zinc-500 text-white placeholder-zinc-650 rounded-xl px-4 py-3.5 outline-none font-display font-bold text-lg focus:ring-1 focus:ring-zinc-650 transition-all shadow-inner"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={40}
            />
          </div>

          <div>
            <label className="block text-zinc-400 font-display text-sm font-semibold mb-3">
              WORKOUT STRUCTURE
            </label>
            <div className="grid grid-cols-2 gap-3" id="creator-type-grid">
              <button
                type="button"
                onClick={() => {
                  setType('SETS');
                  // Adjust internal exercise modes
                  setExercises(exercises.map(ex => ({ ...ex, sets: ex.sets || 3, workDuration: ex.workDuration || 45 })));
                }}
                className={`flex flex-col items-center justify-center p-4 rounded-xl border text-center transition-all ${
                  type === 'SETS'
                    ? `bg-zinc-800/30 text-white border-zinc-600 ring-2 ring-offset-2 ring-offset-zinc-950 ${
                        theme === 'BEAST' ? 'ring-orange-500/80' : theme === 'ZEN' ? 'ring-sky-500/85' : 'ring-green-500/85'
                      }`
                    : 'bg-zinc-950/40 text-zinc-400 border-zinc-850 hover:border-zinc-700 hover:text-zinc-200'
                }`}
                id="btn-select-sets"
              >
                <div className="h-6 w-6 rounded-full bg-orange-500/10 flex items-center justify-center text-orange-400 mb-2">
                  <Dumbbell className="h-3.5 w-3.5" />
                </div>
                <span className="font-display font-extrabold text-sm tracking-wide">SETS BASED</span>
                <span className="text-xs text-zinc-500 mt-1 font-sans font-medium">Exercises done in sets and intervals</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setType('AMRAP');
                  setExercises(exercises.map(ex => ({ ...ex, sets: 1, workDuration: 0 })));
                }}
                className={`flex flex-col items-center justify-center p-4 rounded-xl border text-center transition-all ${
                  type === 'AMRAP'
                    ? `bg-zinc-800/30 text-white border-zinc-600 ring-2 ring-offset-2 ring-offset-zinc-950 ${
                        theme === 'BEAST' ? 'ring-orange-500/80' : theme === 'ZEN' ? 'ring-sky-500/85' : 'ring-green-500/85'
                      }`
                    : 'bg-zinc-950/40 text-zinc-400 border-zinc-850 hover:border-zinc-700 hover:text-zinc-200'
                }`}
                id="btn-select-amrap"
              >
                <div className="h-6 w-6 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-400 mb-2">
                  <Sparkles className="h-3.5 w-3.5" />
                </div>
                <span className="font-display font-extrabold text-sm tracking-wide">TIME CHALLENGE</span>
                <span className="text-xs text-zinc-500 mt-1 font-sans font-medium">As Many Rounds As Possible within limit</span>
              </button>
            </div>
          </div>
        </div>

        {/* Dynamic setup segment */}
        <div className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-lg font-display font-bold text-zinc-300">
              {type === 'SETS' ? 'EXERCISES & INTERVALS' : 'EXERCISES LIST'}
            </h2>
            <button
              type="button"
              onClick={handleAddExercise}
              className={`flex items-center gap-1.5 text-xs font-display font-extrabold uppercase tracking-wider py-2 px-3.5 rounded-xl border border-zinc-850 bg-zinc-900 text-white transition-all hover:bg-zinc-800`}
              id="btn-add-exercise"
            >
              <Plus className="h-3.5 w-3.5 text-zinc-450" />
              Add Exercise
            </button>
          </div>

          {/* AMRAP Total Time Slider & Interval Configuration */}
          {type === 'AMRAP' && (
            <div className="bg-zinc-900/60 border border-zinc-800/85 rounded-2xl p-6 space-y-6">
              {/* Total duration */}
              <div>
                <div className="flex justify-between items-center mb-3">
                  <span className="text-zinc-400 font-display text-sm font-semibold uppercase tracking-wider">TOTAL WORKOUT TIMER</span>
                  <span className={`text-2xl font-mono font-extrabold ${themeConfig.text}`}>{amrapMins} Mins</span>
                </div>
                <input
                  type="range"
                  min={1}
                  max={45}
                  step={1}
                  value={amrapMins}
                  onChange={(e) => setAmrapMins(parseInt(e.target.value))}
                  className={`w-full h-2 rounded-lg appearance-none bg-zinc-950 cursor-pointer ${themeConfig.text}`}
                  id="amrap-duration-slider"
                />
                <div className="flex items-center justify-between text-zinc-550 font-mono text-xs mt-2 select-none">
                  <span>1 MIN</span>
                  <span>15 MINS</span>
                  <span>30 MINS</span>
                  <span>45 MINS</span>
                </div>
              </div>

              {/* Loop style toggle toggle */}
              <div className="pt-4 border-t border-zinc-850/60">
                <label className="block text-zinc-400 font-display text-xs font-semibold mb-3 uppercase tracking-wider">
                  TIMING MECHANIC
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2" id="runner-style-toggle-grid">
                  <button
                    type="button"
                    onClick={() => setAmrapAutoCircuit(true)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl border text-left transition-all ${
                      amrapAutoCircuit
                        ? `bg-zinc-850 border-zinc-650 text-white`
                        : 'bg-zinc-950/60 border-zinc-900 text-zinc-550 hover:text-zinc-350'
                    }`}
                  >
                    <div className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_8px_#10b981]" />
                    <div>
                      <div className="font-display font-extrabold text-xs uppercase tracking-wide">Automated Circuit</div>
                      <div className="text-[10px] text-zinc-500 font-medium">Auto-loops exercises in intervals</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setAmrapAutoCircuit(false)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl border text-left transition-all ${
                      !amrapAutoCircuit
                        ? `bg-zinc-850 border-zinc-650 text-white`
                        : 'bg-zinc-950/60 border-zinc-900 text-zinc-550 hover:text-zinc-350'
                    }`}
                  >
                    <div className="h-2 w-2 rounded-full bg-amber-500 shadow-[0_0_8px_#f59e0b]" />
                    <div>
                      <div className="font-display font-extrabold text-xs uppercase tracking-wide">Manual Lap Mode</div>
                      <div className="text-[10px] text-zinc-500 font-medium font-sans">You log finished laps manually</div>
                    </div>
                  </button>
                </div>
              </div>

              {/* Optional Active and Rest interval fields if Automated Circuit is chosen */}
              {amrapAutoCircuit && (
                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-zinc-850/60" id="amrap-circuit-durations">
                  <div>
                    <label className="block text-[11px] font-display font-bold text-zinc-450 mb-1.5 uppercase tracking-wider">ACTIVE WORK (SECS)</label>
                    <div className="flex items-center bg-zinc-950/80 rounded-xl px-2 py-1.5 border border-zinc-855 select-none">
                      <button
                        type="button"
                        onClick={() => setAmrapWorkDuration(Math.max(5, amrapWorkDuration - 5))}
                        className="text-zinc-550 hover:text-zinc-300 px-2 font-mono text-lg font-bold"
                      >
                        -
                      </button>
                      <input
                        type="number"
                        className="bg-transparent w-full text-center text-white font-mono font-bold outline-none"
                        value={amrapWorkDuration}
                        onChange={(e) => setAmrapWorkDuration(Math.max(3, parseInt(e.target.value) || 5))}
                        min={3}
                      />
                      <button
                        type="button"
                        onClick={() => setAmrapWorkDuration(amrapWorkDuration + 5)}
                        className="text-zinc-550 hover:text-zinc-300 px-2 font-mono text-lg font-bold"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-display font-bold text-zinc-455 mb-1.5 uppercase tracking-wider">TRANSITION REST (SECS)</label>
                    <div className="flex items-center bg-zinc-950/80 rounded-xl px-2 py-1.5 border border-zinc-855 select-none">
                      <button
                        type="button"
                        onClick={() => setAmrapRestDuration(Math.max(0, amrapRestDuration - 5))}
                        className="text-zinc-550 hover:text-zinc-300 px-2 font-mono text-lg font-bold"
                      >
                        -
                      </button>
                      <input
                        type="number"
                        className="bg-transparent w-full text-center text-white font-mono font-bold outline-none"
                        value={amrapRestDuration}
                        onChange={(e) => setAmrapRestDuration(Math.max(0, parseInt(e.target.value) || 0))}
                        min={0}
                      />
                      <button
                        type="button"
                        onClick={() => setAmrapRestDuration(amrapRestDuration + 5)}
                        className="text-zinc-550 hover:text-zinc-300 px-2 font-mono text-lg font-bold"
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* List of exercises */}
          <div className="space-y-4 font-sans text-sm" id="creator-exercises-list">
            <AnimatePresence initial={false}>
              {exercises.map((ex, index) => (
                <motion.div
                  key={ex.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="bg-zinc-900/40 relative border border-zinc-850 rounded-2xl p-5 hover:border-zinc-800 transition-colors"
                >
                  {/* Top line: Number, Name input, trash */}
                  <div className="flex items-center gap-4 mb-4">
                    <span className="font-mono text-xs text-zinc-500 font-extrabold bg-zinc-955 border border-zinc-850 h-7 w-7 rounded-lg flex items-center justify-center shrink-0">
                      #{index + 1}
                    </span>
                    
                    <input
                      type="text"
                      placeholder="Exercise name (e.g. Squats, Pushups)"
                      className="flex-1 bg-transparent border-b border-zinc-800 focus:border-zinc-650 outline-none text-white font-display font-semibold text-base py-1 px-1"
                      value={ex.name}
                      onChange={(e) => updateExerciseField(index, 'name', e.target.value)}
                    />

                    <button
                      type="button"
                      onClick={() => handleRemoveExercise(index)}
                      className="text-zinc-500 hover:text-red-400 p-1.5 hover:bg-red-500/10 rounded-lg transition-colors border border-transparent hover:border-red-900/50"
                      title="Remove exercise"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>

                  {/* Icon Selector Grid */}
                  <div className="mb-4">
                    <span className="block text-zinc-500 font-display text-[11px] font-bold tracking-wider mb-2">EXERCISE ICON</span>
                    <div className="flex flex-wrap gap-2">
                      {EXERCISE_ICONS.map((ico) => {
                        const Icon = ico.icon;
                        const isSelected = ex.icon === ico.id;
                        return (
                          <button
                            key={ico.id}
                            type="button"
                            onClick={() => updateExerciseField(index, 'icon', ico.id)}
                            className={`p-2.5 rounded-xl border transition-all ${
                              isSelected
                                ? `bg-zinc-850 border-zinc-600 text-white ${themeConfig.text}`
                                : 'bg-zinc-950/60 border-zinc-900 text-zinc-500 hover:text-zinc-350 hover:border-zinc-800'
                            }`}
                            title={ico.label}
                          >
                            <Icon className="h-4 w-4" />
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* SETS Parameters row */}
                  {type === 'SETS' && (
                    <div className="grid grid-cols-3 gap-3 pt-2 border-t border-zinc-850/60">
                      <div>
                        <label className="block text-[11px] font-display font-bold text-zinc-450 mb-1.5 uppercase">SETS</label>
                        <div className="flex items-center bg-zinc-950/80 rounded-xl px-2 py-1.5 border border-zinc-855 select-none">
                          <button
                            type="button"
                            onClick={() => updateExerciseField(index, 'sets', Math.max(1, ex.sets - 1))}
                            className="text-zinc-550 hover:text-zinc-300 px-1 font-mono text-lg font-bold"
                          >
                            -
                          </button>
                          <input
                            type="number"
                            className="bg-transparent w-full text-center text-white font-mono font-bold outline-none"
                            value={ex.sets}
                            onChange={(e) => updateExerciseField(index, 'sets', Math.max(1, parseInt(e.target.value) || 1))}
                            min={1}
                          />
                          <button
                            type="button"
                            onClick={() => updateExerciseField(index, 'sets', ex.sets + 1)}
                            className="text-zinc-550 hover:text-zinc-300 px-1 font-mono text-lg font-bold"
                          >
                            +
                          </button>
                        </div>
                      </div>

                      <div>
                        <label className="block text-[11px] font-display font-bold text-zinc-455 mb-1.5 uppercase">WORK (S)</label>
                        <div className="flex items-center bg-zinc-950/80 rounded-xl px-2 py-1.5 border border-zinc-855 select-none">
                          <button
                            type="button"
                            onClick={() => updateExerciseField(index, 'workDuration', Math.max(5, ex.workDuration - 5))}
                            className="text-zinc-550 hover:text-zinc-300 px-1 font-mono text-lg font-bold"
                          >
                            -
                          </button>
                          <input
                            type="number"
                            className="bg-transparent w-full text-center text-white font-mono font-bold outline-none"
                            value={ex.workDuration}
                            onChange={(e) => updateExerciseField(index, 'workDuration', Math.max(3, parseInt(e.target.value) || 5))}
                            min={3}
                          />
                          <button
                            type="button"
                            onClick={() => updateExerciseField(index, 'workDuration', ex.workDuration + 5)}
                            className="text-zinc-550 hover:text-zinc-300 px-1 font-mono text-lg font-bold"
                          >
                            +
                          </button>
                        </div>
                      </div>

                      <div>
                        <label className="block text-[11px] font-display font-bold text-zinc-455 mb-1.5 uppercase">REST (S)</label>
                        <div className="flex items-center bg-zinc-950/80 rounded-xl px-2 py-1.5 border border-zinc-855 select-none">
                          <button
                            type="button"
                            onClick={() => updateExerciseField(index, 'restDuration', Math.max(0, ex.restDuration - 5))}
                            className="text-zinc-550 hover:text-zinc-300 px-1 font-mono text-lg font-bold"
                          >
                            -
                          </button>
                          <input
                            type="number"
                            className="bg-transparent w-full text-center text-white font-mono font-bold outline-none"
                            value={ex.restDuration}
                            onChange={(e) => updateExerciseField(index, 'restDuration', Math.max(0, parseInt(e.target.value) || 0))}
                            min={0}
                          />
                          <button
                            type="button"
                            onClick={() => updateExerciseField(index, 'restDuration', ex.restDuration + 5)}
                            className="text-zinc-550 hover:text-zinc-300 px-1 font-mono text-lg font-bold"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Rest before next exercise (only in SETS mode) */}
                  {type === 'SETS' && (
                    <div className="mt-3 flex items-center justify-between py-2 px-3 bg-zinc-950/30 rounded-xl border border-zinc-855/40 text-xs">
                      <span className="text-zinc-500 font-sans font-medium">Extra rest on transition to next exercise?</span>
                      <select
                        className="bg-zinc-950 border border-zinc-800 text-zinc-300 rounded px-1.5 py-0.5 outline-none font-mono"
                        value={ex.nextExerciseRest || 0}
                        onChange={(e) => updateExerciseField(index, 'nextExerciseRest', parseInt(e.target.value))}
                      >
                        <option value={0}>No extra rest</option>
                        <option value={15}>+15s rest</option>
                        <option value={30}>+30s rest</option>
                        <option value={45}>+45s rest</option>
                        <option value={60}>+60s rest</option>
                      </select>
                    </div>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>

        {/* Save and Submit */}
        <div className="flex gap-4 pt-4 border-t border-zinc-850">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 py-4 px-6 bg-zinc-900 border border-zinc-800/80 hover:bg-zinc-850 text-zinc-400 hover:text-white rounded-2xl font-display font-extrabold uppercase tracking-wider text-sm transition-all shadow-lg text-center"
            id="btn-creator-cancel"
          >
            Cancel
          </button>
          
          <button
            type="submit"
            className={`flex-1 py-4 px-6 rounded-2xl font-display font-extrabold uppercase tracking-wider text-sm text-black transition-all shadow-lg flex items-center justify-center gap-2 ${
              theme === 'BEAST'
                ? 'bg-[#f95738] hover:bg-[#ff7b5f] active:scale-95'
                : theme === 'ZEN'
                ? 'bg-[#38bdf8] hover:bg-[#7dd3fc] active:scale-95'
                : 'bg-[#22c55e] hover:bg-[#4ade80] active:scale-95'
            }`}
            id="btn-creator-save"
          >
            <Save className="h-4.5 w-4.5" />
            {editingPlan ? 'Update Plan' : 'Save Workout'}
          </button>
        </div>
      </form>
    </motion.div>
  );
}
