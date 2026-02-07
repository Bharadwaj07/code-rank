import { useState, useEffect } from 'react';
import { api } from '../services/api.service';
import { LanguageConfig } from '../services/api.types';

export function useCodeEditor(defaultCode: string = '// Write your code here') {
    const [languages, setLanguages] = useState<LanguageConfig[]>([]);
    const [selectedLanguage, setSelectedLanguage] = useState('');
    const [code, setCode] = useState(defaultCode);

    useEffect(() => {
        fetchLanguages();
    }, []);

    const fetchLanguages = async () => {
        try {
            const response = await api.get<LanguageConfig[]>('/languages');
            setLanguages(response.data);
            if (response.data && response.data.length > 0) {
                if (!selectedLanguage) {
                    setSelectedLanguage(response.data[0].languageId);
                }
            }
        } catch (err) {
            // In a real app, use a proper logger or notification service
            console.error('[useCodeEditor] Failed to load languages', err);
        }
    };

    return {
        languages,
        selectedLanguage,
        setSelectedLanguage,
        code,
        setCode
    };
}
