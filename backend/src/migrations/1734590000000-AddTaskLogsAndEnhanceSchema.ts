import { MigrationInterface, QueryRunner, Table, TableColumn, TableForeignKey } from 'typeorm';

export class AddTaskLogsAndEnhanceSchema1734590000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Add new columns to tasks table
    await queryRunner.addColumns('tasks', [
      new TableColumn({
        name: 'max_retry',
        type: 'integer',
        default: 3,
        isNullable: false,
      }),
      new TableColumn({
        name: 'status',
        type: 'varchar',
        length: '50',
        default: "'pending'",
        isNullable: false,
      }),
    ]);

    // 2. Change payload column from text to jsonb
    await queryRunner.query(`
      ALTER TABLE tasks 
      ALTER COLUMN discord_webhook_url TYPE text,
      ADD COLUMN IF NOT EXISTS payload jsonb DEFAULT '{}'::jsonb;
    `);

    // 3. Create task_logs table
    await queryRunner.createTable(
      new Table({
        name: 'task_logs',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            default: 'uuid_generate_v4()',
          },
          {
            name: 'task_id',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'execution_time',
            type: 'timestamp with time zone',
            default: 'now()',
          },
          {
            name: 'status',
            type: 'varchar',
            length: '50',
            isNullable: false,
          },
          {
            name: 'retry_count',
            type: 'integer',
            default: 0,
          },
          {
            name: 'message',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'error_details',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'created_at',
            type: 'timestamp with time zone',
            default: 'now()',
          },
        ],
      }),
      true
    );

    // 4. Add foreign key constraint
    await queryRunner.createForeignKey(
      'task_logs',
      new TableForeignKey({
        columnNames: ['task_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'tasks',
        onDelete: 'CASCADE',
        name: 'fk_task_logs_task_id',
      })
    );

    // 5. Create indexes for performance
    await queryRunner.query(`
      CREATE INDEX idx_task_logs_task_id ON task_logs(task_id);
      CREATE INDEX idx_task_logs_status ON task_logs(status);
      CREATE INDEX idx_task_logs_execution_time ON task_logs(execution_time);
      CREATE INDEX idx_tasks_status ON tasks(status);
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop indexes
    await queryRunner.query(`
      DROP INDEX IF EXISTS idx_task_logs_task_id;
      DROP INDEX IF EXISTS idx_task_logs_status;
      DROP INDEX IF EXISTS idx_task_logs_execution_time;
      DROP INDEX IF EXISTS idx_tasks_status;
    `);

    // Drop foreign key
    await queryRunner.dropForeignKey('task_logs', 'fk_task_logs_task_id');

    // Drop task_logs table
    await queryRunner.dropTable('task_logs', true);

    // Remove payload column
    await queryRunner.query(`
      ALTER TABLE tasks DROP COLUMN IF EXISTS payload;
    `);

    // Remove new columns from tasks
    await queryRunner.dropColumns('tasks', ['max_retry', 'status']);
  }
}
