import { useState, useEffect, useCallback } from 'react';
import { supabase } from './supabase';
import { Subject } from './types';

export function useSubjects() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSubjects = useCallback(async () => {
    const { data, error } = await supabase
      .from('subjects')
      .select('*')
      .eq('is_active', true)
      .order('name');

    if (!error && data) {
      setSubjects(data as Subject[]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchSubjects();
  }, [fetchSubjects]);

  return { subjects, loading, refetch: fetchSubjects };
}
