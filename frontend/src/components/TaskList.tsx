'use client';

import { Task } from '@/types';

interface TaskListProps {
  tasks: Task[];
  onDelete: (id: string) => void;
}

export default function TaskList({ tasks, onDelete }: TaskListProps) {
  if (tasks.length === 0) {
    return <p>No tasks scheduled yet.</p>;
  }

  return (
    <div>
      <h2>Scheduled Tasks</h2>
      <div style={{ display: 'grid', gap: '1rem' }}>
        {tasks.map((task) => (
          <div
            key={task.id}
            style={{
              border: '1px solid #ddd',
              borderRadius: '8px',
              padding: '1rem',
              backgroundColor: task.is_completed ? '#f0f0f0' : 'white',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
              <div style={{ flex: 1 }}>
                <h3 style={{ margin: '0 0 0.5rem 0' }}>
                  {task.title}
                  {task.is_completed && (
                    <span style={{ marginLeft: '0.5rem', color: 'green' }}>✓ Completed</span>
                  )}
                  {!task.is_active && (
                    <span style={{ marginLeft: '0.5rem', color: 'red' }}>⏸ Inactive</span>
                  )}
                </h3>
                <p style={{ margin: '0 0 0.5rem 0', color: '#666' }}>{task.description}</p>
                <p style={{ margin: '0', fontSize: '0.9rem', color: '#888' }}>
                  <strong>Scheduled:</strong>{' '}
                  {new Date(task.scheduled_time).toLocaleString()}
                </p>
                <p style={{ margin: '0.25rem 0', fontSize: '0.9rem', color: '#888' }}>
                  <strong>Created:</strong> {new Date(task.created_at).toLocaleString()}
                </p>
              </div>
              <button
                onClick={() => {
                  if (confirm('Are you sure you want to delete this task?')) {
                    onDelete(task.id);
                  }
                }}
                style={{
                  padding: '0.5rem 1rem',
                  backgroundColor: '#dc3545',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  marginLeft: '1rem',
                }}
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
