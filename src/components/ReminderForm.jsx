import React, { useState } from 'react';
import { useTranslation } from '../hooks/useTranslation';

const ReminderForm = ({ onAddReminder, onCancel }) => {
  const { t } = useTranslation();
  const [message, setMessage] = useState('');
  const [time, setTime] = useState('');
  const [date, setDate] = useState('');
  const [repeat, setRepeat] = useState('no'); // 'no', 'daily', 'weekly', 'monthly', 'yearly'

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!message || !time || !date) {
      alert(t('allFieldsRequired') || 'Все поля обязательны для заполнения');
      return;
    }

    const newReminder = {
      message,
      time,
      date,
      repeat
    };

    onAddReminder(newReminder);
    // Сброс формы
    setMessage('');
    setTime('');
    setDate('');
    setRepeat('no');
  };

  return (
    <div className="reminder-form-overlay">
      <div className="reminder-form">
        <h3>{t('addNewReminder') || 'Добавить напоминание'}</h3>
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="reminder-message">{t('reminderMessage') || 'Сообщение'}</label>
            <textarea
              id="reminder-message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={t('enterReminderMessage') || 'Введите сообщение напоминания'}
              required
            />
          </div>
          
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="reminder-date">{t('date') || 'Дата'}</label>
              <input
                type="date"
                id="reminder-date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="reminder-time">{t('time') || 'Время'}</label>
              <input
                type="time"
                id="reminder-time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                required
              />
            </div>
          </div>
          
          <div className="form-group">
            <label htmlFor="reminder-repeat">{t('repeat') || 'Повторение'}</label>
            <select
              id="reminder-repeat"
              value={repeat}
              onChange={(e) => setRepeat(e.target.value)}
            >
              <option value="no">{t('noRepeat') || 'Без повторения'}</option>
              <option value="daily">{t('daily') || 'Каждый день'}</option>
              <option value="weekly">{t('weekly') || 'Каждую неделю'}</option>
              <option value="monthly">{t('monthly') || 'Каждый месяц'}</option>
              <option value="yearly">{t('yearly') || 'Каждый год'}</option>
            </select>
          </div>
          
          <div className="form-actions">
            <button type="button" className="btn-cancel" onClick={onCancel}>
              {t('cancel') || 'Отмена'}
            </button>
            <button type="submit" className="btn-submit">
              {t('addReminder') || 'Добавить'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ReminderForm;