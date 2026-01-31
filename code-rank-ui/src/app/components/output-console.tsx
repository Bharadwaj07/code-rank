interface OutputConsoleProps {
    status: 'IDLE' | 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED';
    output?: {
        stdout?: string;
        stderr?: string;
        exitCode?: number;
        executionTimeMs?: number;
    } | null;
    error?: string;
}

export function OutputConsole({ status, output, error }: OutputConsoleProps) {
    if (status === 'IDLE' && !error) {
        return (
            <div className="h-full bg-[#1e1e1e] border-t border-[#333] p-4 text-gray-500 font-mono text-sm">
                Click "Run Code" to see output here.
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full bg-[#1e1e1e] border-t border-[#333] font-mono text-sm">
            <div className="flex items-center justify-between px-4 py-1 bg-[#252526] border-b border-[#333]">
                <span className="text-gray-400 text-xs uppercase tracking-wider font-semibold">Console</span>
                <div className="flex items-center space-x-2">
                    {status === 'RUNNING' || status === 'PENDING' ? (
                        <span className="text-yellow-500 text-xs flex items-center">
                            <span className="w-2 h-2 bg-yellow-500 rounded-full mr-1 animate-pulse"></span>
                            Running...
                        </span>
                    ) : status === 'COMPLETED' ? (
                        <span className="text-green-500 text-xs">Success</span>
                    ) : (
                        <span className="text-red-500 text-xs">Failed</span>
                    )}
                </div>
            </div>

            <div className="flex-1 p-4 overflow-auto text-gray-300 whitespace-pre-wrap">
                {error && (
                    <div className="text-red-400 mb-2">Error: {error}</div>
                )}

                {output?.stdout && (
                    <div className="mb-2">
                        <div className="text-gray-500 text-xs mb-1">Standard Output:</div>
                        <div className="text-white">{output.stdout}</div>
                    </div>
                )}

                {output?.stderr && (
                    <div className="mb-2">
                        <div className="text-red-400 text-xs mb-1">Standard Error:</div>
                        <div className="text-red-300">{output.stderr}</div>
                    </div>
                )}

                {!output?.stdout && !output?.stderr && !error && status !== 'PENDING' && status !== 'RUNNING' && (
                    <div className="text-gray-500 italic">No output.</div>
                )}

                {output?.executionTimeMs !== undefined && (
                    <div className="mt-4 text-xs text-gray-600 border-t border-[#333] pt-2">
                        Execution Time: {output.executionTimeMs}ms • Exit Code: {output.exitCode}
                    </div>
                )}
            </div>
        </div>
    );
}
