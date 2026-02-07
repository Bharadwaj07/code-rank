import { useState, useEffect, useRef } from 'react';
import { api } from '../services/api.service';
import { SubmissionDetail } from '../services/api.types';

export type PollingStatus = 'IDLE' | 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED';

export interface ConsoleOutput {
    stdout?: string;
    stderr?: string;
    exitCode?: number;
    executionTimeMs?: number;
}

export function useSubmissionPolling(pollingInterval: number = 2000) {
    const [activeSubmissionId, setActiveSubmissionId] = useState<string | null>(null);
    const [status, setStatus] = useState<PollingStatus>('IDLE');
    const [output, setOutput] = useState<ConsoleOutput | null>(null);
    const [error, setError] = useState<string>('');

    const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);

    const startPolling = (submissionId: string) => {
        setActiveSubmissionId(submissionId);
        setStatus('PENDING');
        setOutput(null);
        setError('');
    };

    const setManualResult = (newStatus: PollingStatus, newOutput: ConsoleOutput | null) => {
        setStatus(newStatus);
        setOutput(newOutput);
        setActiveSubmissionId(null); // Stop any active polling
    };

    const setManualError = (msg: string) => {
        setStatus('FAILED');
        setError(msg);
        setActiveSubmissionId(null);
    };

    useEffect(() => {
        if (!activeSubmissionId) return;

        const poll = async () => {
            try {
                const response = await api.get<SubmissionDetail>(`/submissions/${activeSubmissionId}`);
                if (!response || !response.data) {
                    throw new Error('Invalid response from server');
                }

                const sub = response.data;
                const currentStatus = sub.status.toUpperCase() as PollingStatus;

                if (currentStatus === 'COMPLETED' || currentStatus === 'FAILED') {
                    setStatus(currentStatus);
                    setOutput({
                        stdout: sub.stdout,
                        stderr: sub.stderr,
                        exitCode: sub.exitCode,
                        executionTimeMs: sub.executionTimeMs
                    });
                    setActiveSubmissionId(null);
                } else {
                    setStatus(currentStatus);
                }
            } catch (err) {
                console.error('[useSubmissionPolling] Polling failed', err);
                setError('Failed to fetch execution result.');
                setStatus('FAILED');
                setActiveSubmissionId(null);
            }
        };

        poll();
        pollIntervalRef.current = setInterval(poll, pollingInterval);

        return () => {
            if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
        };
    }, [activeSubmissionId, pollingInterval]);

    return {
        status,
        output,
        error,
        startPolling,
        setManualResult,
        setManualError,
        isPolling: !!activeSubmissionId
    };
}
