'use client';

import { useState, useEffect } from 'react';
import { taskApi } from '@/lib/api';
import { Task } from '@/types';
import TaskList from '@/components/TaskList';
import TaskForm from '@/components/TaskForm';

export default function Home() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const data = await taskApi.getAllTasks();
      setTasks(data);
    } catch (error) {
      console.error('Error fetching tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  const handleTaskCreated = () => {
    fetchTasks();
  };

  const handleTaskDeleted = async (id: string) => {
    try {
      await taskApi.deleteTask(id);
      fetchTasks();
    } catch (error) {
      console.error('Error deleting task:', error);
    }
  };

  return (
    <main style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      <h1>Discord Task Scheduler</h1>
      <TaskForm onTaskCreated={handleTaskCreated} />
      {loading ? (
        <p>Loading tasks...</p>
      ) : (
        <TaskList tasks={tasks} onDelete={handleTaskDeleted} />
      )}
    </main>
  );
}
