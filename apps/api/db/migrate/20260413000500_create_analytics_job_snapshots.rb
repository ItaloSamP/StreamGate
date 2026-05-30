class CreateAnalyticsJobSnapshots < ActiveRecord::Migration[8.1]
  def up
    create_table :analytics_job_snapshots, id: false, if_not_exists: true do |t|
      t.string :id, null: false, primary_key: true
      t.references :job, null: false, type: :string, foreign_key: true
      t.references :upload, null: false, type: :string, foreign_key: true
      t.references :actor, null: false, type: :string, foreign_key: { to_table: :users }
      t.string :organization_id, null: false
      t.string :source_type, null: false
      t.string :status, null: false
      t.integer :quarantined_records_count, null: false, default: 0
      t.datetime :job_created_at, null: false
      t.datetime :last_synced_at, null: false, default: -> { "CURRENT_TIMESTAMP" }
      t.timestamps
    end

    add_index :analytics_job_snapshots, :job_id, unique: true, if_not_exists: true
    add_index :analytics_job_snapshots, [ :job_created_at, :status ], if_not_exists: true
    add_index :analytics_job_snapshots, [ :organization_id, :job_created_at ], if_not_exists: true
    add_index :analytics_job_snapshots, [ :actor_id, :job_created_at ], if_not_exists: true
    add_index :analytics_job_snapshots, [ :source_type, :job_created_at ], if_not_exists: true

    execute <<~SQL
      INSERT INTO analytics_job_snapshots (
        id,
        job_id,
        upload_id,
        actor_id,
        organization_id,
        source_type,
        status,
        quarantined_records_count,
        job_created_at,
        last_synced_at,
        created_at,
        updated_at
      )
      SELECT
        concat('ajs_', j.id),
        j.id,
        j.upload_id,
        j.requested_by_id,
        u.organization_id,
        j.source_type,
        j.status,
        j.quarantined_records_count,
        j.created_at,
        NOW(),
        NOW(),
        NOW()
      FROM jobs j
      INNER JOIN users u ON u.id = j.requested_by_id
      WHERE NOT EXISTS (
        SELECT 1
        FROM analytics_job_snapshots existing
        WHERE existing.job_id = j.id
      );
    SQL
  end

  def down
    drop_table :analytics_job_snapshots, if_exists: true
  end
end
