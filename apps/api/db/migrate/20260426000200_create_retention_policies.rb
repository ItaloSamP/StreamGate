class CreateRetentionPolicies < ActiveRecord::Migration[8.1]
  def change
    return if table_exists?(:retention_policies)

    create_table :retention_policies, id: false do |t|
      t.string :id, null: false, primary_key: true
      t.string :organization_id, null: false
      t.integer :realtime_events_days, null: false, default: 7
      t.integer :dashboard_exports_days, null: false, default: 7
      t.integer :operational_warnings_days, null: false, default: 30
      t.integer :job_artifacts_days, null: false, default: 30
      t.integer :clickhouse_days, null: false, default: 30
      t.integer :operational_data_days, null: false, default: 90
      t.string :created_by_id
      t.jsonb :metadata, null: false, default: {}
      t.timestamps
    end

    add_index :retention_policies, :organization_id, unique: true, if_not_exists: true
  end
end
