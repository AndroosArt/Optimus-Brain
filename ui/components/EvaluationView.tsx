import { useState } from 'react';
import { MissionEvaluation } from '../lib/evaluator';

interface EvaluationViewProps {
    evaluation: MissionEvaluation;
    onProceed: (modifiedObjective: string) => void;
    onCancel: () => void;
}

export default function EvaluationView({ evaluation, onProceed, onCancel }: EvaluationViewProps) {
    const [isPlanning, setIsPlanning] = useState(false);
    const [isAdvanced, setIsAdvanced] = useState(false);
    const [selectedSuggestions, setSelectedSuggestions] = useState<Set<string>>(new Set());

    // Helper for dynamic score colors
    const getScoreColor = (score: number) => {
        if (score >= 8.0) return 'text-green-600 dark:text-green-400';
        if (score >= 5.0) return 'text-yellow-600 dark:text-yellow-400';
        return 'text-red-500 dark:text-red-400';
    };

    const getScoreBg = (score: number) => {
        if (score >= 8.0) return 'bg-green-100 border-green-200 dark:bg-green-900/20 dark:border-green-800';
        if (score >= 5.0) return 'bg-yellow-50 border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-800';
        return 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800';
    };

    // Dynamic Score Calculation
    const boostPerSuggestion = 0.2; // Each suggestion adds 0.2 to the score
    const baseScore = evaluation.value.overall_score;
    const boostAmount = selectedSuggestions.size * boostPerSuggestion;
    const currentScore = Math.min(9.9, baseScore + boostAmount);

    const scoreColor = getScoreColor(currentScore);
    const scoreBg = getScoreBg(currentScore);

    const handleProceedClick = () => {
        setIsPlanning(true);
        // Append selected suggestions to the objective for the planner
        let finalObjective = evaluation.summary.objective;
        if (selectedSuggestions.size > 0) {
            finalObjective += "\n\n[SELECTED IMPROVEMENTS]:";
            selectedSuggestions.forEach(s => {
                finalObjective += `\n- ${s}`;
            });
        }
        onProceed(finalObjective);
    };

    const toggleSuggestion = (suggestion: string) => {
        const newSet = new Set(selectedSuggestions);
        if (newSet.has(suggestion)) {
            newSet.delete(suggestion);
        } else {
            newSet.add(suggestion);
        }
        setSelectedSuggestions(newSet);
    };

    return (
        <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-xl overflow-hidden animate-fade-in border border-gray-100 dark:border-zinc-800 max-w-4xl mx-auto my-8 transition-colors duration-500 font-sans">
            {/* Header */}
            <div className="bg-white dark:bg-zinc-900 border-b border-gray-100 dark:border-zinc-800 p-8 flex justify-between items-start transition-colors duration-500 relative">

                {/* Advanced Toggle */}
                <button
                    onClick={() => setIsAdvanced(!isAdvanced)}
                    className={`absolute top-8 right-8 text-[10px] font-bold uppercase tracking-widest transition-colors ${isAdvanced ? 'text-forest-500' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'}`}
                >
                    {isAdvanced ? 'Advanced Mode On' : 'Advanced Mode Off'}
                </button>

                <div className="max-w-[70%]">
                    <div className="text-xs font-bold tracking-widest text-indigo-500 dark:text-indigo-400 uppercase mb-2">Mission Evaluation</div>

                    {/* Main Title */}
                    <h2 className="text-4xl font-extrabold text-gray-900 dark:text-white leading-tight font-sans tracking-tight mb-4 transition-colors">
                        {evaluation.title || evaluation.summary.objective}
                    </h2>

                    {/* Full Directive */}
                    {evaluation.title && (
                        <p className="text-sm text-gray-500 dark:text-gray-400 font-sans border-l-2 border-gray-200 dark:border-zinc-700 pl-3 transition-colors">
                            {evaluation.summary.objective}
                        </p>
                    )}

                    <div className="flex gap-2 mt-4">
                        {evaluation.summary.systems_affected.map(sys => (
                            <span key={sys} className="px-2 py-1 bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-gray-300 text-xs font-medium rounded-md uppercase tracking-wide transition-colors">
                                {sys}
                            </span>
                        ))}
                    </div>
                </div>

                {/* Score Box */}
                <div className={`mt-12 flex flex-col items-center justify-center p-4 rounded-lg border ${scoreBg} min-w-[140px] transition-all duration-300`}>
                    <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-1">Value Score</span>
                    <div className="flex items-center gap-2">
                        <span className={`text-5xl font-black ${scoreColor} transition-all duration-500`}>
                            {currentScore.toFixed(1)}
                        </span>
                        {boostAmount > 0 && (
                            <span className="text-xs font-bold text-green-600 dark:text-green-400 animate-pulse bg-green-100 dark:bg-green-900/30 px-1 py-0.5 rounded">
                                +{boostAmount.toFixed(1)}
                            </span>
                        )}
                    </div>
                    <span className="text-[10px] uppercase font-bold text-gray-400 dark:text-gray-500 mt-1">/ 10.0</span>
                </div>
            </div>

            <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-12">
                {/* Left Column: Analysis */}
                <div className="space-y-8">

                    {/* Classification & Cost */}
                    <div className="flex gap-4">
                        <div className="flex-1 bg-gray-50 dark:bg-zinc-800/50 p-4 rounded-lg border border-gray-100 dark:border-zinc-700/50 transition-colors">
                            <span className="block text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">Classification</span>
                            <span className="font-bold text-gray-800 dark:text-gray-200">{evaluation.classification}</span>
                        </div>
                        <div className="flex-1 bg-gray-50 dark:bg-zinc-800/50 p-4 rounded-lg border border-gray-100 dark:border-zinc-700/50 transition-colors">
                            <span className="block text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">Est. Project Cost</span>
                            <span className="font-mono font-bold text-gray-800 dark:text-gray-200 tracking-tight">
                                {evaluation.costs.estimate_usd || 'N/A'}
                            </span>
                            <div className="text-[10px] text-gray-400 dark:text-gray-500 mt-1">Reflects token & API usage</div>
                        </div>
                    </div>

                    {/* Advanced: Assumptions */}
                    {isAdvanced && evaluation.assumptions && evaluation.assumptions.length > 0 && (
                        <div className="bg-amber-50 dark:bg-amber-900/10 p-4 rounded-lg border border-amber-100 dark:border-amber-900/30">
                            <h3 className="text-xs font-bold text-amber-900 dark:text-amber-500 uppercase tracking-widest mb-2">Assumptions</h3>
                            <ul className="list-disc list-inside space-y-1">
                                {evaluation.assumptions.map((a, i) => (
                                    <li key={i} className="text-xs text-amber-800 dark:text-amber-200/80 leading-relaxed">
                                        {a}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {/* Value Breakdown */}
                    <div>
                        <h3 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-widest mb-4">Value Analysis</h3>
                        <div className="space-y-3">
                            {Object.entries(evaluation.value.breakdown).map(([key, score]) => (
                                <div key={key} className="flex items-center justify-between group">
                                    <span className="text-sm font-medium text-gray-500 dark:text-gray-400 capitalize group-hover:text-gray-700 dark:group-hover:text-gray-200 transition-colors">
                                        {key.replace(/_/g, ' ')}
                                    </span>
                                    <div className="flex items-center gap-3">
                                        <div className="w-24 h-2 bg-gray-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                                            <div
                                                className={`h-full rounded-full ${Number(score) > 7 ? 'bg-green-500' : Number(score) > 4 ? 'bg-yellow-400' : 'bg-red-400'}`}
                                                style={{ width: `${(Number(score) / 10) * 100}%` }}
                                            />
                                        </div>
                                        <span className="font-mono text-xs font-bold text-gray-700 dark:text-gray-300 w-6 text-right">{Number(score).toFixed(1)}</span>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Reasoning: Show more in Advanced Mode */}
                        <div className="mt-4 bg-gray-50 dark:bg-zinc-800/50 p-3 rounded border border-gray-100 dark:border-zinc-700/50 transition-colors">
                            <p className="text-sm text-gray-600 dark:text-gray-300 italic leading-relaxed">
                                "{evaluation.value.reasoning}"
                            </p>
                        </div>
                    </div>

                    {/* Risks */}
                    <div>
                        <h3 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-widest mb-4">Risk Assessment</h3>
                        <ul className="space-y-3">
                            {evaluation.risks.map((risk, i) => (
                                <li key={i} className="flex items-start gap-3 p-3 bg-red-50 dark:bg-red-900/10 rounded-md border border-red-100 dark:border-red-900/30 transition-colors">
                                    <span className="text-red-500 dark:text-red-400 mt-0.5">⚠</span>
                                    <div>
                                        <p className="text-sm font-bold text-red-900 dark:text-red-200 leading-snug">{risk.description}</p>
                                        <p className="text-xs text-red-700 dark:text-red-300 mt-1">{risk.mitigation}</p>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>

                {/* Right Column: Advisory & Action */}
                <div className="flex flex-col h-full">
                    {/* Suggestions */}
                    {evaluation.advisory && evaluation.advisory.effectiveness_suggestions.length > 0 && (
                        <div className="bg-indigo-50 dark:bg-indigo-900/10 rounded-xl p-6 border border-indigo-100 dark:border-indigo-900/30 mb-8 flex-1 transition-colors">
                            <div className="flex items-center gap-2 mb-4">
                                <span className="text-indigo-600 dark:text-indigo-400 text-lg">✨</span>
                                <h3 className="text-sm font-bold text-indigo-900 dark:text-indigo-300 uppercase tracking-widest">Suggested Improvements</h3>
                            </div>
                            <p className="text-xs text-indigo-600 dark:text-indigo-400 mb-4">Select suggestions to incorporate into the plan.</p>

                            <div className="space-y-3">
                                {evaluation.advisory.effectiveness_suggestions.map((sugg, i) => {
                                    const isSelected = selectedSuggestions.has(sugg.what);
                                    return (
                                        <div
                                            key={i}
                                            onClick={() => toggleSuggestion(sugg.what)}
                                            className={`p-4 rounded-lg border cursor-pointer transition-all duration-200 ${isSelected
                                                ? 'bg-white dark:bg-indigo-900/20 border-indigo-500 shadow-sm ring-1 ring-indigo-500'
                                                : 'bg-white/50 dark:bg-zinc-800/50 border-indigo-100 dark:border-zinc-700 hover:border-indigo-300 dark:hover:border-indigo-500/50'
                                                }`}
                                        >
                                            <div className="flex items-start gap-3">
                                                <div className={`mt-0.5 w-4 h-4 rounded border flex items-center justify-center transition-colors ${isSelected ? 'bg-indigo-500 border-indigo-500' : 'border-gray-300 dark:border-gray-500 bg-white dark:bg-zinc-800'
                                                    }`}>
                                                    {isSelected && <span className="text-white text-[10px]">✓</span>}
                                                </div>
                                                <div>
                                                    <h4 className={`text-sm font-bold ${isSelected ? 'text-indigo-900 dark:text-indigo-200' : 'text-gray-700 dark:text-gray-300'}`}>{sugg.what}</h4>
                                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{sugg.why}</p>
                                                    <div className="mt-2 text-[10px] font-bold text-green-600 dark:text-green-400 uppercase tracking-wide">
                                                        Upside: {sugg.upside}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Recommended Next Steps */}
                    {evaluation.recommended_next_steps && evaluation.recommended_next_steps.length > 0 && (
                        <div className="mb-8">
                            <h3 className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-3">Recommended Next Steps</h3>
                            <ul className="space-y-2">
                                {evaluation.recommended_next_steps.map((step, i) => (
                                    <li key={i} className="flex items-center gap-2 text-sm font-bold text-gray-800 dark:text-gray-200">
                                        <span className="w-1.5 h-1.5 rounded-full bg-forest-500"></span>
                                        {step}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {/* Actions */}
                    <div className="mt-auto">
                        <div className="flex flex-col gap-3">
                            <button
                                onClick={handleProceedClick}
                                disabled={isPlanning}
                                className={`w-full py-4 px-6 rounded-lg shadow-lg text-white font-bold uppercase tracking-wider text-sm transition-all flex items-center justify-center gap-2 ${isPlanning
                                    ? 'bg-gray-800 dark:bg-zinc-800 cursor-wait opacity-90'
                                    : 'bg-forest-500 hover:bg-forest-600 hover:scale-[1.01] hover:shadow-xl'
                                    }`}
                            >
                                {isPlanning && (
                                    <span className="w-4 h-4 border-2 border-white/50 border-t-white rounded-full animate-spin"></span>
                                )}
                                {isPlanning ? 'Initializing Planner...' : 'Proceed to Planning'}
                            </button>

                            {!isPlanning && (
                                <button
                                    onClick={onCancel}
                                    className="w-full py-3 px-6 rounded-lg text-gray-400 dark:text-gray-500 font-bold uppercase tracking-wider text-xs hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors"
                                >
                                    Cancel Mission
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
