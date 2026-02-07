import { useState } from 'react';
import { useAuth } from '../context/auth.context';
import { CodeEditor } from '../components/code-editor';
import { OutputConsole } from '../components/output-console';
import { SubmissionList } from '../components/submission-list';
import { SubmissionDetail, Submission } from '../services/api.types';
import { api } from '../services/api.service';
import { useSubmissionPolling } from '../hooks/use-submission-polling';
import { useCodeEditor } from '../hooks/use-code-editor';

export function DashboardPage() {
    const { user, logout } = useAuth();

    // Custom Hooks
    const editor = useCodeEditor();
    const polling = useSubmissionPolling();

    // Local UI State
    const [isEditorRunning, setIsEditorRunning] = useState(false);
    const [refreshHistoryTrigger, setRefreshHistoryTrigger] = useState(0);

    const handleRun = async () => {
        if (!editor.selectedLanguage) {
            console.warn('No language selected');
            return;
        }

        setIsEditorRunning(true);
        polling.startPolling('placeholder'); // Only to unset previous error, ID overwritten below
        // Actually startPolling sets ID.

        try {
            // Note: We don't start polling immediately here because we need the ID first.
            // But we can set status to PENDING manually to show loader.
            polling.setManualResult('PENDING', null);

            const response = await api.post<any>('/submissions', {
                language: editor.selectedLanguage,
                sourceCode: editor.code,
            });

            // Start polling with the returned ID
            const id = response.data.submissionId;
            polling.startPolling(id);
            setRefreshHistoryTrigger(prev => prev + 1);
        } catch (err: any) {
            const msg = err.response?.data?.message || 'Failed to submit code';
            polling.setManualError(msg);
        } finally {
            setIsEditorRunning(false);
        }
    };

    const handleHistorySelect = async (submission: Submission) => {
        try {
            const response = await api.get<SubmissionDetail>(`/submissions/${submission.id}`);
            const detail = response.data;

            // Update Editor
            editor.setCode(detail.sourceCode || '// Source code unavailable');
            editor.setSelectedLanguage(detail.language);

            // Update Console
            polling.setManualResult(
                detail.status.toUpperCase() as any,
                {
                    stdout: detail.stdout,
                    stderr: detail.stderr,
                    exitCode: detail.exitCode,
                    executionTimeMs: detail.executionTimeMs
                }
            );
        } catch (err) {
            console.error('Failed to load submission details', err);
            polling.setManualError('Failed to load submission details.');
        }
    };

    return (
        <div className="flex flex-col h-screen bg-gray-100 overflow-hidden">
            {/* Navbar */}
            <nav className="bg-white border-b border-gray-200 flex-none h-14">
                <div className="max-w-full px-4 sm:px-6 lg:px-8 h-full">
                    <div className="flex h-full justify-between items-center">
                        <div className="flex items-center">
                            <span className="text-xl font-bold text-blue-600">Code Rank</span>
                            <span className="ml-4 text-xs bg-gray-100 text-gray-500 py-1 px-2 rounded-full border border-gray-200">Online Compiler</span>
                        </div>
                        <div className="flex items-center space-x-4">
                            <span className="text-sm text-gray-700">User: {user?.username}</span>
                            <button
                                onClick={logout}
                                className="text-sm font-medium text-gray-500 hover:text-gray-900"
                            >
                                Sign out
                            </button>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Main Content - Two Columns */}
            <div className="flex flex-1 overflow-hidden">

                {/* Left Panel: Code Editor (Main Focus) */}
                <div className="flex-1 flex flex-col min-w-0 bg-[#1e1e1e] border-r border-[#333]">
                    <CodeEditor
                        code={editor.code}
                        onCodeChange={editor.setCode}
                        language={editor.selectedLanguage}
                        onLanguageChange={editor.setSelectedLanguage}
                        languages={editor.languages}
                        isRunning={isEditorRunning || polling.isPolling}
                        onRun={handleRun}
                    />
                </div>

                {/* Right Panel: Console & History */}
                <div className="w-1/3 min-w-[350px] bg-gray-50 flex flex-col border-l border-gray-200">
                    {/* Console Area - Fixed Height for immediate feedback */}
                    <div className="flex-none bg-[#1e1e1e] border-b border-[#333] h-1/2 flex flex-col">
                        <OutputConsole
                            status={polling.status}
                            output={polling.output}
                            error={polling.error}
                        />
                    </div>

                    {/* History Area - Bottom Half - Scrollable */}
                    <div className="flex-1 overflow-y-auto bg-white flex flex-col">
                        <div className="p-3 border-b border-gray-200 bg-gray-50">
                            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Recent Executions</h3>
                        </div>
                        <div className="flex-1">
                            <SubmissionList
                                refreshTrigger={refreshHistoryTrigger}
                                onSelect={handleHistorySelect}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
