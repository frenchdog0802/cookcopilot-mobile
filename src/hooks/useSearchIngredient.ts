import { useMemo, useState, useEffect } from 'react';
import { IngredientEntry } from '../types';

interface UseSearchIngredientsResult {
    filteredIngredients: IngredientEntry[];
    loading: boolean;
}

export default function useSearchIngredients(
    query: string,
    ingredients: IngredientEntry[]
): UseSearchIngredientsResult {
    const [loading, setLoading] = useState(false);

    const filteredIngredients = useMemo(() => {
        if (!query.trim()) {
            return ingredients.slice(0, 10); // Return first 10 if no query
        }

        const lowerQuery = query.toLowerCase();
        return ingredients.filter((ingredient) =>
            ingredient.name && ingredient.name.toLowerCase().includes(lowerQuery)
        ).slice(0, 10); // Limit results
    }, [query, ingredients]);

    // Simulate loading state for smoother UX
    useEffect(() => {
        if (query.trim()) {
            setLoading(true);
            const timer = setTimeout(() => setLoading(false), 200);
            return () => clearTimeout(timer);
        }
        setLoading(false);
    }, [query]);

    return { filteredIngredients, loading };
}
