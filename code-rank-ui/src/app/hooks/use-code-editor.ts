import { useState, useEffect } from 'react';
import { api } from '../services/api.service';
import { LanguageConfig } from '../services/api.types';

export function useCodeEditor() {
    const [languages, setLanguages] = useState<LanguageConfig[]>([]);
    const [selectedLanguage, setSelectedLanguage] = useState('');
    const [code, setCode] = useState('// Write your code here');

    useEffect(() => {
        fetchLanguages();
    }, []);

    const fetchLanguages = async () => {
        try {
            const response = await api.get<LanguageConfig[]>('/languages');
            setLanguages(response.data);
            if (response.data.length > 0) {
                // Only set default if we don't have one? Or always?
                // For simplicity, set default if none selected
                if (!selectedLanguage) {
                    setSelectedLanguage(response.data[0].languageId);
                }
            }
        } catch (err) {
            console.error('Failed to load languages', err);
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
