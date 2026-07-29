import { httpClient } from '../../../api/httpClient';

export const getSchedules = async () => {
    const { data } = await httpClient.get('/schedules');
    return data;
};

export const updateSchedule = async (id, payload) => {
    const { data } = await httpClient.put(`/schedules/${id}`, payload);
    return data;
};

export const toggleSchedule = async (id) => {
    const { data } = await httpClient.patch(`/schedules/${id}/toggle`);
    return data;
};
