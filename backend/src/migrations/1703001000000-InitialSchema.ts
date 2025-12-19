import { MigrationInterface, QueryRunner, Table } from 'typeorm';

export class InitialSchema1703001000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Check if table already exists (for existing databases)
    const tableExists = await queryRunner.hasTable('tasks');

    if (!tableExists) {
      await queryRunner.createTable(
        new Table({
          name: 'tasks',
          columns: [
            {
              name: 'id',
              type: 'uuid',
              isPrimary: true,
              default: 'uuid_generate_v4()',
            },
            {
              name: 'title',
              type: 'varchar',
              length: '255',
              isNullable: false,
            },
            {
              name: 'description',
              type: 'text',
              isNullable: true,
            },
            {
              name: 'scheduled_time',
              type: 'timestamp with time zone',
              isNullable: false,
            },
            {
              name: 'discord_webhook_url',
              type: 'text',
              isNullable: false,
            },
            {
              name: 'is_completed',
              type: 'boolean',
              default: false,
            },
            {
              name: 'is_active',
              type: 'boolean',
              default: true,
            },
            {
              name: 'created_at',
              type: 'timestamp with time zone',
              default: 'now()',
            },
            {
              name: 'updated_at',
              type: 'timestamp with time zone',
              default: 'now()',
            },
          ],
        }),
        true
      );

      // Create indexes for performance
      await queryRunner.query(`
        CREATE INDEX idx_tasks_scheduled_time ON tasks(scheduled_time);
      `);

      await queryRunner.query(`
        CREATE INDEX idx_tasks_is_active_is_completed ON tasks(is_active, is_completed);
      `);
    }

    // Ensure UUID extension exists
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp";`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('tasks', true);
  }
}
