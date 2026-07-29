import React, { useState } from 'react';

const CRON_PRESETS = [
    { label: 'Каждую минуту',  value: '* * * * *' },
    { label: 'Каждый час',     value: '0 * * * *' },
    { label: 'Каждые 2 часа', value: '0 */2 * * *' },
    { label: 'В 02:00',        value: '0 2 * * *' },
    { label: 'В 10:00',        value: '0 10 * * *' },
    { label: 'Каждые 5 мин',  value: '*/5 * * * *' },
];

// ── Frontend Factory: fields depend on queue_name ──────────────────────────
const ScrapingPayloadFields = ({ payload, onChange }) => {
    const set = (key) => (e) => {
        const value = key === 'maxItems' ? Number(e.target.value) : e.target.value;
        onChange({ ...payload, [key]: value });
    };

    return (
        <div className="modal-section">
            <div className="modal-section__title">Параметры парсинга</div>

            <div className="form-group">
                <label className="form-group__label">Поисковый запрос</label>
                <input
                    className="form-group__input"
                    value={payload.query || ''}
                    onChange={set('query')}
                    placeholder="Например: Roborock S8 Pro+"
                />
            </div>

            <div className="form-group">
                <label className="form-group__label">Максимум товаров</label>
                <input
                    className="form-group__input form-group__input--short"
                    type="number"
                    min="1"
                    max="200"
                    value={payload.maxItems ?? 12}
                    onChange={set('maxItems')}
                />
            </div>

            <div className="form-group">
                <label className="form-group__label">Тип поиска</label>
                <select
                    className="form-group__select"
                    value={payload.searchType || 'query'}
                    onChange={set('searchType')}
                >
                    <option value="query">По запросу</option>
                    <option value="url">По URL</option>
                    <option value="sku">По SKU</option>
                    <option value="category">По категории</option>
                </select>
            </div>
        </div>
    );
};

const SellerPayloadFields = () => (
    <div className="modal-section">
        <div className="modal-section__title">Параметры очереди</div>
        <p className="modal__info-note">
            Задача синхронизации продавцов не требует дополнительных настроек.<br />
            Вы можете изменить только расписание запуска выше.
        </p>
    </div>
);

// ── Factory: выбираем нужный блок полей по queue_name ─────────────────────
const PayloadFieldsFactory = ({ queueName, payload, onChange }) => {
    if (queueName === 'scraping') {
        return <ScrapingPayloadFields payload={payload} onChange={onChange} />;
    }
    if (queueName === 'seller') {
        return <SellerPayloadFields />;
    }
    return null;
};

// ── Main Modal ─────────────────────────────────────────────────────────────
export const EditScheduleModal = ({ task, onSave, onClose, saving }) => {
    const [cronExpression, setCronExpression] = useState(task.cronExpression || '');
    const [payload, setPayload] = useState(
        task.payload && typeof task.payload === 'object' ? { ...task.payload } : {}
    );

    const handleSave = () => {
        if (!cronExpression.trim()) return;
        onSave(task.id, { cronExpression: cronExpression.trim(), payload });
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Escape') onClose();
    };

    return (
        <div className="modal-overlay" onClick={onClose} onKeyDown={handleKeyDown}>
            <div className="modal" onClick={(e) => e.stopPropagation()}>

                {/* Header */}
                <div className="modal__header">
                    <span className="modal__title">Редактировать расписание</span>
                    <button className="modal__close" onClick={onClose} title="Закрыть">✕</button>
                </div>

                {/* Body */}
                <div className="modal__body">
                    <p className="modal__task-name">{task.taskName}</p>

                    {/* CRON section */}
                    <div className="modal-section">
                        <div className="modal-section__title">Расписание (CRON)</div>

                        <div className="form-group">
                            <label className="form-group__label">Выражение CRON</label>
                            <input
                                className="form-group__input form-group__input--mono"
                                value={cronExpression}
                                onChange={(e) => setCronExpression(e.target.value)}
                                placeholder="* * * * *"
                                spellCheck={false}
                            />
                        </div>

                        {/* Quick presets */}
                        <div className="cron-presets">
                            {CRON_PRESETS.map((p) => (
                                <button
                                    key={p.value}
                                    type="button"
                                    className={`cron-preset-btn ${cronExpression === p.value ? 'cron-preset-btn--active' : ''}`}
                                    onClick={() => setCronExpression(p.value)}
                                >
                                    {p.label}
                                </button>
                            ))}
                        </div>

                        {/* CRON format hint */}
                        <div className="cron-hint">
                            <div className="cron-hint__title">Формат выражения:</div>
                            <pre className="cron-hint__diagram">{`┌─────────── минута      (0–59)
│ ┌───────── час          (0–23)
│ │ ┌─────── день месяца  (1–31)
│ │ │ ┌───── месяц        (1–12)
│ │ │ │ ┌─── день недели  (0–6, вс=0)
│ │ │ │ │
* * * * *`}</pre>
                            <div className="cron-hint__examples">
                                <span>Примеры:</span>
                                <code>0 10 * * *</code> — каждый день в 10:00,
                                <code>0 */2 * * *</code> — каждые 2 часа,
                                <code>0 2 * * 1</code> — каждый понедельник в 02:00
                            </div>
                        </div>
                    </div>

                    {/* Dynamic payload section */}
                    <PayloadFieldsFactory
                        queueName={task.queueName}
                        payload={payload}
                        onChange={setPayload}
                    />
                </div>

                {/* Footer */}
                <div className="modal__footer">
                    <button className="btn-cancel" onClick={onClose}>
                        Отмена
                    </button>
                    <button
                        className="btn-save"
                        onClick={handleSave}
                        disabled={saving || !cronExpression.trim()}
                    >
                        {saving ? (
                            <>
                                <span className="loading-spinner loading-spinner--small" />
                                Сохранение...
                            </>
                        ) : 'Сохранить'}
                    </button>
                </div>
            </div>
        </div>
    );
};
