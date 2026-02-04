import { useState, useEffect } from 'react';
import { api } from '../services/api.service';
import { Submission } from '../services/api.types';

interface SubmissionListProps {
    refreshTrigger: number;
    onSelect?: (submission: Submission) => void;
}

export function SubmissionList({ refreshTrigger, onSelect }: SubmissionListProps) {
    const [submissions, setSubmissions] = useState<Submission[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchSubmissions();
    }, [refreshTrigger]);

    const fetchSubmissions = async () => {
        setLoading(true);
        try {
            const response = await api.get<Submission[]>('/submissions');
            // Sort by newest first, handling potentially missing dates safely
            const sorted = response.data.sort((a, b) => {
                const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
                const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
                return dateB - dateA;
            });
            setSubmissions(sorted);
        } catch (err) {
            console.error('Failed to fetch submissions', err);
        } finally {
            setLoading(false);
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'COMPLETED': return 'bg-green-100 text-green-800';
            case 'FAILED': return 'bg-red-100 text-red-800';
            case 'RUNNING': return 'bg-blue-100 text-blue-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const formatDate = (dateString?: string) => {
        if (!dateString) return 'Unknown date';
        try {
            const date = new Date(dateString);
            if (isNaN(date.getTime())) return 'Invalid date';
            return date.toLocaleString();
        } catch (e) {
            return 'Date error';
        }
    };

    if (loading && submissions.length === 0) {
        return <div className="text-center py-4">Loading submissions...</div>;
    }

    return (
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
            <div className="px-4 py-5 sm:px-6">
                <h3 className="text-lg font-medium leading-6 text-gray-900">Recent Submissions</h3>
            </div>
            <div className="border-t border-gray-200">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                ID
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Language
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Status
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Submitted At
                            </th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {submissions.map((submission) => (
                            <tr
                                key={submission.id}
                                onClick={() => onSelect && onSelect(submission)}
                                className="cursor-pointer hover:bg-gray-100 transition-colors"
                            >
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                    {submission.id.substring(0, 8)}...
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {submission.language}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(submission.status)}`}>
                                        {submission.status}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {formatDate(submission.createdAt)}
                                </td>
                            </tr>
                        ))}
                        {submissions.length === 0 && (
                            <tr>
                                <td colSpan={4} className="px-6 py-4 text-center text-sm text-gray-500">
                                    No submissions yet.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
