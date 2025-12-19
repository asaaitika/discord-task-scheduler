'use client';

import { useState } from 'react';
import { taskApi } from '@/lib/api';
import { CreateTaskData } from '@/types';

interface TaskFormProps {
  onTaskCreated: () => void;
}

export default function TaskForm({ onTaskCreated }: TaskFormProps) {
  const [formData, setFormData] = useState<CreateTaskData>({
    title: '',
    description: '',
    scheduled_time: '',
    discord_webhook_url: '',
  });

  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      await taskApi.createTask(formData);
      setFormData({
        title: '',
        description: '',
        scheduled_time: '',
        discord_webhook_url: '',
      });
      onTaskCreated();
      alert('Task created successfully!');
    } catch (error) {
      console.error('Error creating task:', error);
      alert('Failed to create task');
    } finally {
      setSubmitting(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <form onSubmit={handleSubmit} style={{ marginBottom: '2rem' }}>
      <div style={{ marginBottom: '1rem' }}>
        <label htmlFor="title">Title:</label>
        <input
          type="text"
          id="title"
          name="title"
          value={formData.title}
          onChange={handleChange}
          required
          style={{ width: '100%', padding: '0.5rem' }}
        />
      </div>

      <div style={{ marginBottom: '1rem' }}>
        <label htmlFor="description">Description:</label>
        <textarea
          id="description"
          name="description"
          value={formData.description}
          onChange={handleChange}
          rows={4}
          style={{ width: '100%', padding: '0.5rem' }}
        />
      </div>

      <div style={{ marginBottom: '1rem' }}>
        <label htmlFor="scheduled_time">Scheduled Time:</label>
        <input
          type="datetime-local"
          id="scheduled_time"
          name="scheduled_time"
          value={formData.scheduled_time}
          onChange={handleChange}
          required
          style={{ width: '100%', padding: '0.5rem' }}
        />
      </div>

      <div style={{ marginBottom: '1rem' }}>
        <label htmlFor="discord_webhook_url">Discord Webhook URL:</label>
        <input
          type="url"
          id="discord_webhook_url"
          name="discord_webhook_url"
          value={formData.discord_webhook_url}
          onChange={handleChange}
          required
          placeholder="https://discord.com/api/webhooks/..."
          style={{ width: '100%', padding: '0.5rem' }}
        />
      </div>

      <button
        type="submit"
        disabled={submitting}
        style={{
          padding: '0.75rem 1.5rem',
          backgroundColor: '#0070f3',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: submitting ? 'not-allowed' : 'pointer',
        }}
      >
        {submitting ? 'Creating...' : 'Create Task'}
      </button>
    </form>
  );
}
