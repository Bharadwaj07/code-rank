import { useState, useEffect } from 'react';
import { api } from '../services/api.service';
import { CreateLanguageConfigDto, LanguageConfig } from '../services/api.types';
import { useAuth } from '../context/auth.context';
import { Link } from 'react-router-dom';

export function AdminLanguagesPage() {
    const { user } = useAuth();
    const [languages, setLanguages] = useState<LanguageConfig[]>([]);
    const [loading, setLoading] = useState(false);
    const [refreshTrigger, setRefreshTrigger] = useState(0);

    // Form State
    const [formData, setFormData] = useState<CreateLanguageConfigDto>({
        languageId: '',
        displayName: '',
        dockerImage: '',
        compileCommand: '',
        executeCommand: '',
        timeoutSeconds: 10,
        maxMemoryMb: 256,
        isActive: true
    });
    const [formError, setFormError] = useState('');
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        fetchLanguages();
    }, [refreshTrigger]);

    const fetchLanguages = async () => {
        setLoading(true);
        try {
            const response = await api.get<LanguageConfig[]>('/languages');
            setLanguages(response.data);
        } catch (err) {
            console.error('Failed to fetch languages', err);
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked :
                type === 'number' ? Number(value) : value
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setFormError('');
        setSubmitting(true);
        try {
            await api.post('/languages', formData);
            setRefreshTrigger(prev => prev + 1);
            // Reset form usually, but maybe keep some defaults
            setFormData({
                languageId: '',
                displayName: '',
                dockerImage: '',
                compileCommand: '',
                executeCommand: '',
                timeoutSeconds: 10,
                maxMemoryMb: 256,
                isActive: true
            });
        } catch (err: any) {
            console.error('Failed to create language', err);
            setFormError(err.response?.data?.message || 'Failed to create language');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm(`Are you sure you want to delete ${id}?`)) return;
        try {
            await api.delete(`/languages/${id}`);
            setRefreshTrigger(prev => prev + 1);
        } catch (err) {
            console.error('Failed to delete language', err);
            alert('Failed to delete language');
        }
    };

    return (
        <div className="min-h-screen bg-gray-100">
            <nav className="bg-white shadow-sm">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="flex h-16 justify-between">
                        <div className="flex">
                            <div className="flex flex-shrink-0 items-center">
                                <Link to="/dashboard" className="text-xl font-bold text-blue-600">Code Rank Admin</Link>
                            </div>
                        </div>
                        <div className="flex items-center space-x-4">
                            <Link to="/dashboard" className="text-sm font-medium text-gray-700 hover:text-gray-900">Back to Dashboard</Link>
                        </div>
                    </div>
                </div>
            </nav>

            <div className="py-10">
                <header>
                    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                        <h1 className="text-3xl font-bold leading-tight tracking-tight text-gray-900">Language Management</h1>
                    </div>
                </header>

                <main>
                    <div className="mx-auto max-w-7xl sm:px-6 lg:px-8 space-y-8 mt-8">

                        {/* Create Language Form */}
                        <div className="bg-white shadow sm:rounded-lg">
                            <div className="px-4 py-5 sm:p-6">
                                <h3 className="text-lg font-medium leading-6 text-gray-900">Add New Language</h3>
                                {formError && (
                                    <div className="mt-4 bg-red-50 p-4 rounded-md">
                                        <p className="text-sm text-red-700">{formError}</p>
                                    </div>
                                )}
                                <form className="mt-5 grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6" onSubmit={handleSubmit}>

                                    <div className="sm:col-span-3">
                                        <label htmlFor="languageId" className="block text-sm font-medium text-gray-700">Language ID</label>
                                        <input type="text" name="languageId" id="languageId" required
                                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border p-2"
                                            placeholder="e.g. javascript" value={formData.languageId} onChange={handleInputChange} />
                                    </div>

                                    <div className="sm:col-span-3">
                                        <label htmlFor="displayName" className="block text-sm font-medium text-gray-700">Display Name</label>
                                        <input type="text" name="displayName" id="displayName" required
                                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border p-2"
                                            placeholder="e.g. JavaScript (Node.js)" value={formData.displayName} onChange={handleInputChange} />
                                    </div>

                                    <div className="sm:col-span-3">
                                        <label htmlFor="dockerImage" className="block text-sm font-medium text-gray-700">Docker Image</label>
                                        <input type="text" name="dockerImage" id="dockerImage" required
                                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border p-2"
                                            placeholder="e.g. node:18-alpine" value={formData.dockerImage} onChange={handleInputChange} />
                                    </div>

                                    <div className="sm:col-span-3">
                                        <label htmlFor="compileCommand" className="block text-sm font-medium text-gray-700">Compile Command (Optional)</label>
                                        <input type="text" name="compileCommand" id="compileCommand"
                                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border p-2"
                                            placeholder="e.g. tsc solution.ts" value={formData.compileCommand} onChange={handleInputChange} />
                                    </div>

                                    <div className="sm:col-span-6">
                                        <label htmlFor="executeCommand" className="block text-sm font-medium text-gray-700">Execute Command</label>
                                        <input type="text" name="executeCommand" id="executeCommand" required
                                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border p-2"
                                            placeholder="e.g. node solution.js" value={formData.executeCommand} onChange={handleInputChange} />
                                    </div>

                                    <div className="sm:col-span-2">
                                        <label htmlFor="timeoutSeconds" className="block text-sm font-medium text-gray-700">Timeout (s)</label>
                                        <input type="number" name="timeoutSeconds" id="timeoutSeconds" required
                                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border p-2"
                                            value={formData.timeoutSeconds} onChange={handleInputChange} />
                                    </div>

                                    <div className="sm:col-span-2">
                                        <label htmlFor="maxMemoryMb" className="block text-sm font-medium text-gray-700">Max Memory (MB)</label>
                                        <input type="number" name="maxMemoryMb" id="maxMemoryMb" required
                                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border p-2"
                                            value={formData.maxMemoryMb} onChange={handleInputChange} />
                                    </div>

                                    <div className="sm:col-span-2 flex items-center h-full pt-6">
                                        <input id="isActive" name="isActive" type="checkbox"
                                            className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                            checked={formData.isActive} onChange={handleInputChange} />
                                        <label htmlFor="isActive" className="ml-2 block text-sm text-gray-900">Active</label>
                                    </div>

                                    <div className="sm:col-span-6 flex justify-end">
                                        <button type="submit" disabled={submitting}
                                            className="inline-flex justify-center rounded-md border border-transparent bg-blue-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
                                            {submitting ? 'Adding...' : 'Add Language'}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>

                        {/* Language List */}
                        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
                            <div className="px-4 py-5 sm:px-6">
                                <h3 className="text-lg font-medium leading-6 text-gray-900">Supported Languages</h3>
                            </div>
                            <div className="border-t border-gray-200">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Image</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {languages.map((lang) => (
                                            <tr key={lang.languageId}>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{lang.languageId}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{lang.displayName}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{lang.dockerImage}</td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    {lang.isActive ?
                                                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">Active</span> :
                                                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">Inactive</span>
                                                    }
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                    <button onClick={() => handleDelete(lang.languageId)} className="text-red-600 hover:text-red-900">Delete</button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                    </div>
                </main>
            </div>
        </div>
    );
}
