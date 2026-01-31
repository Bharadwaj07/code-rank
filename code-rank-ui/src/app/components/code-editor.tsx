import { useState, useEffect } from 'react';
import { api } from '../services/api.service';
import { LanguageConfig, Submission } from '../services/api.types';
import { Play } from 'lucide-react';

interface CodeEditorProps {
    code: string;
    onCodeChange: (code: string) => void;
    language: string;
    onLanguageChange: (lang: string) => void;
    languages: LanguageConfig[];
    isRunning: boolean;
    onRun: () => void;
}

export function CodeEditor({
    code,
    onCodeChange,
    language,
    onLanguageChange,
    languages,
    isRunning,
    onRun
}: CodeEditorProps) {





    return (
        <div className="flex flex-col h-full bg-[#1e1e1e] text-gray-300">
            {/* Editor Header */}
            <div className="flex items-center justify-between px-4 py-2 bg-[#252526] border-b border-[#333]">
                <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium">Language:</span>
                    <select
                        value={language}
                        onChange={(e) => onLanguageChange(e.target.value)}
                        className="bg-[#3c3c3c] text-white text-sm border-none rounded px-2 py-1 focus:ring-1 focus:ring-blue-500 outline-none"
                    >
                        {languages.map((lang) => (
                            <option key={lang.languageId} value={lang.languageId}>
                                {lang.displayName}
                            </option>
                        ))}
                    </select>
                </div>

                <button
                    onClick={onRun}
                    disabled={isRunning || !language}
                    className="flex items-center space-x-1 bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <Play size={14} fill="currentColor" />
                    <span>{isRunning ? 'Running...' : 'Run Code'}</span>
                </button>
            </div>

            {/* Editor Area (Simulated) */}
            <div className="flex-1 relative">
                <textarea
                    value={code}
                    onChange={(e) => onCodeChange(e.target.value)}
                    className="w-full h-full bg-[#1e1e1e] text-[#d4d4d4] font-mono text-sm p-4 resize-none focus:outline-none border-none leading-relaxed"
                    spellCheck={false}
                />
            </div>
        </div>
    );
}
