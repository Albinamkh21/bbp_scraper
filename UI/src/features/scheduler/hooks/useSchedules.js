import { useState, useCallback, useEffect } from 'react';
import { getSchedules, updateSchedule, toggleSchedule } from '../api/schedules.api';

export const useSchedules = () => {
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const fetchSchedules = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await getSchedules();
            setTasks(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error('[useSchedules] Ошибка загрузки расписаний:', err);
            setError(err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchSchedules();
    }, [fetchSchedules]);

    const handleToggle = useCallback(async (id) => {
        const updated = await toggleSchedule(id);
        setTasks(prev => prev.map(t => t.id === updated.id ? updated : t));
        return updated;
    }, []);

    const handleUpdate = useCallback(async (id, payload) => {
        const updated = await updateSchedule(id, payload);
        setTasks(prev => prev.map(t => t.id === updated.id ? updated : t));
        return updated;
    }, []);

    return { tasks, loading, error, fetchSchedules, handleToggle, handleUpdate };
};
