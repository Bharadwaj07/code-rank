import { useState, useEffect } from 'react';
import { api } from '../services/api.service';
import { LanguageConfig } from '../services/api.types';

interface SubmissionFormProps {
    onSuccess: () => void;
}

export function SubmissionForm({ onSuccess }: SubmissionFormProps) {
    const [languages, setLanguages] = useState<LanguageConfig[]>([]);
    const [selectedLanguage, setSelectedLanguage] = useState('');
    const [sourceCode, setSourceCode] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchLanguages();
    }, []);

    const fetchLanguages = async () => {
        try {
            const response = await api.get<LanguageConfig[]>('/languages');
            setLanguages(response.data);
            if (response.data.length > 0) {
                setSelectedLanguage(response.data[0].languageId);
            }
        } catch (err) {
            console.error('Failed to fetch languages', err);
            setError('Could not load languages. Please try again later.');
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            await api.post('/submissions', {
                language: selectedLanguage,
                sourceCode,
            });
            setSourceCode('');
            onSuccess();
        } catch (err: any) {
            console.error('Submission failed', err);
            setError(err.response?.data?.message || 'Failed to submit code.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-white shadow sm:rounded-lg mb-8">
            <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg font-medium leading-6 text-gray-900">New Submission</h3>
                <div className="mt-2 text-sm text-gray-500">
                    <p>Select a language and enter your code below.</p>
                </div>

                {error && (
                    <div className="mt-4 bg-red-50 p-4 rounded-md">
                        <p className="text-sm text-red-700">{error}</p>
                    </div>
                )}

                <form className="mt-5 space-y-4" onSubmit={handleSubmit}>
                    <div>
                        <label htmlFor="language" className="block text-sm font-medium text-gray-700">
                            Language
                        </label>
                        <select
                            id="language"
                            name="language"
                            className="mt-1 block w-full rounded-md border-gray-300 py-2 pl-3 pr-10 text-base focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm border"
                            value={selectedLanguage}
                            onChange={(e) => setSelectedLanguage(e.target.value)}
                            disabled={loading}
                        >
                            {languages.map((lang) => (
                                <option key={lang.languageId} value={lang.languageId}>
                                    {lang.displayName}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label htmlFor="sourceCode" className="block text-sm font-medium text-gray-700">
                            Source Code
                        </label>
                        <div className="mt-1">
                            <textarea
                                id="sourceCode"
                                name="sourceCode"
                                rows={10}
                                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm font-mono border p-2"
                                placeholder="// Write your code here..."
                                value={sourceCode}
                                onChange={(e) => setSourceCode(e.target.value)}
                                required
                                disabled={loading}
                            />
                        </div>
                    </div>

                    <div className="flex justify-end">
                        <button
                            type="submit"
                            disabled={loading || !selectedLanguage}
                            className="inline-flex justify-center rounded-md border border-transparent bg-blue-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
                        >
                            {loading ? 'Submitting...' : 'Submit Code'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
