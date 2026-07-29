import React, { useState } from 'react';
import { useSchedules } from './hooks/useSchedules';
import { EditScheduleModal } from './components/EditScheduleModal';
import '../tasks/tasks.css';

const QUEUE_LABELS = {
    scraping: 'Парсинг',
    seller: 'Продавцы',
};

const formatPayload = (payload) => {
    if (!payload || Object.keys(payload).length === 0) return '—';
    return Object.entries(payload)
        .map(([k, v]) => `${k}: ${v}`)
        .join(' · ');
};

export const SchedulesPage = () => {
    const { tasks, loading, error, handleToggle, handleUpdate } = useSchedules();
    const [editingTask, setEditingTask] = useState(null);
    const [savingId, setSavingId] = useState(null);
    const [togglingId, setTogglingId] = useState(null);

    const onToggle = async (task) => {
        if (togglingId !== null) return;
        setTogglingId(task.id);
        try {
            await handleToggle(task.id);
        } catch (err) {
            console.error('[SchedulesPage] Ошибка переключения задачи:', err);
        } finally {
            setTogglingId(null);
        }
    };

    const onSave = async (id, data) => {
        setSavingId(id);
        try {
            await handleUpdate(id, data);
            setEditingTask(null);
        } catch (err) {
            console.error('[SchedulesPage] Ошибка сохранения задачи:', err);
        } finally {
            setSavingId(null);
        }
    };

    return (
        <div className="tracks-page">
            {/* Page header */}
            <div className="schedules-header">
                <h2 className="schedules-title">Расписание задач</h2>
                <p className="schedules-subtitle">
                    Управление крон-задачами. Изменения сразу применяются в BullMQ.
                </p>
            </div>

            {/* Content area */}
            <div className="grid-wrapper">
                {loading && (
                    <div className="loading-overlay">
                        <div className="loading-spinner" />
                        <span className="loading-text">Загружаем расписания...</span>
                    </div>
                )}

                {!loading && error && (
                    <div className="schedules-error">
                        Не удалось загрузить расписания. Проверьте соединение с сервером.
                    </div>
                )}

                {!loading && !error && tasks.length === 0 && (
                    <div className="schedules-empty">Нет задач по расписанию</div>
                )}

                {!loading && tasks.length > 0 && (
                    <table className="schedules-table">
                        <thead>
                            <tr>
                                <th className="schedules-th">Название</th>
                                <th className="schedules-th">Очередь</th>
                                <th className="schedules-th">Расписание (CRON)</th>
                                <th className="schedules-th">Статус</th>
                                <th className="schedules-th">Payload</th>
                                <th className="schedules-th schedules-th--actions">Действия</th>
                            </tr>
                        </thead>
                        <tbody>
                            {tasks.map((task) => (
                                <tr
                                    key={task.id}
                                    className={`schedules-row ${!task.isActive ? 'schedules-row--inactive' : ''}`}
                                >
                                    <td className="schedules-td schedules-td--name">
                                        {task.taskName}
                                    </td>

                                    <td className="schedules-td">
                                        <span className={`badge-queue badge-queue--${task.queueName}`}>
                                            {QUEUE_LABELS[task.queueName] ?? task.queueName}
                                        </span>
                                    </td>

                                    <td className="schedules-td">
                                        <code className="cron-code">{task.cronExpression}</code>
                                    </td>

                                    <td className="schedules-td">
                                        <label className={`toggle-switch ${togglingId === task.id ? 'toggle-switch--loading' : ''}`}>
                                            <input
                                                type="checkbox"
                                                className="toggle-switch__input"
                                                checked={task.isActive}
                                                onChange={() => onToggle(task)}
                                                disabled={togglingId !== null}
                                            />
                                            <span className="toggle-switch__slider" />
                                            <span className="toggle-switch__label">
                                                {task.isActive ? 'Активна' : 'Отключена'}
                                            </span>
                                        </label>
                                    </td>

                                    <td className="schedules-td">
                                        <span className="payload-preview" title={JSON.stringify(task.payload, null, 2)}>
                                            {formatPayload(task.payload)}
                                        </span>
                                    </td>

                                    <td className="schedules-td schedules-td--actions">
                                        <button
                                            className="btn-edit"
                                            onClick={() => setEditingTask(task)}
                                        >
                                            Редактировать
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Edit modal */}
            {editingTask && (
                <EditScheduleModal
                    task={editingTask}
                    onSave={onSave}
                    onClose={() => setEditingTask(null)}
                    saving={savingId === editingTask.id}
                />
            )}
        </div>
    );
};
