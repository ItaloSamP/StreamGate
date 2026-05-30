class AddCommandCenterBackWorkerFoundations < ActiveRecord::Migration[8.1]
  def change
    change_operational_warnings
    create_realtime_events
    create_dashboard_exports
    create_permission_rules
    create_connector_profiles
    create_connector_ingestions
    create_connector_leases
  end

  private

  def change_operational_warnings
    add_column :operational_warnings, :organization_id, :string unless column_exists?(:operational_warnings, :organization_id)
    add_column :operational_warnings, :reviewed_by_id, :string unless column_exists?(:operational_warnings, :reviewed_by_id)
    add_column :operational_warnings, :reviewed_at, :datetime unless column_exists?(:operational_warnings, :reviewed_at)
    add_column :operational_warnings, :review_reason, :text unless column_exists?(:operational_warnings, :review_reason)
    add_column :operational_warnings, :dismissed_by_id, :string unless column_exists?(:operational_warnings, :dismissed_by_id)
    add_column :operational_warnings, :dismissed_at, :datetime unless column_exists?(:operational_warnings, :dismissed_at)
    add_column :operational_warnings, :dismiss_reason, :text unless column_exists?(:operational_warnings, :dismiss_reason)

    add_index :operational_warnings, [ :organization_id, :created_at ], if_not_exists: true
    add_index :operational_warnings, :reviewed_by_id, if_not_exists: true
    add_index :operational_warnings, :dismissed_by_id, if_not_exists: true
  end

  def create_realtime_events
    return if table_exists?(:realtime_events)

    create_table :realtime_events, id: false do |t|
      t.string :id, null: false, primary_key: true
      t.string :event_type, null: false
      t.string :organization_id, null: false
      t.string :actor_id
      t.string :resource_type
      t.string :resource_id
      t.string :severity, null: false, default: "info"
      t.jsonb :payload, null: false, default: {}
      t.datetime :occurred_at, null: false
      t.datetime :expires_at, null: false
      t.string :request_id
      t.string :trace_id, null: false
      t.timestamps
    end

    add_index :realtime_events, [ :organization_id, :occurred_at ], if_not_exists: true
    add_index :realtime_events, [ :resource_type, :resource_id ], if_not_exists: true
    add_index :realtime_events, :expires_at, if_not_exists: true
    add_index :realtime_events, :trace_id, if_not_exists: true
  end

  def create_dashboard_exports
    return if table_exists?(:dashboard_exports)

    create_table :dashboard_exports, id: false do |t|
      t.string :id, null: false, primary_key: true
      t.string :organization_id, null: false
      t.string :actor_id, null: false
      t.string :kind, null: false
      t.string :format, null: false
      t.string :filename, null: false
      t.string :content_type, null: false
      t.bigint :byte_size, null: false, default: 0
      t.string :checksum_sha256, null: false
      t.jsonb :metadata, null: false, default: {}
      t.datetime :generated_at, null: false
      t.datetime :expires_at, null: false
      t.string :request_id
      t.string :trace_id, null: false
      t.timestamps
    end

    add_index :dashboard_exports, [ :organization_id, :generated_at ], if_not_exists: true
    add_index :dashboard_exports, [ :actor_id, :generated_at ], if_not_exists: true
    add_index :dashboard_exports, :expires_at, if_not_exists: true
  end

  def create_permission_rules
    return if table_exists?(:permission_rules)

    create_table :permission_rules, id: false do |t|
      t.string :id, null: false, primary_key: true
      t.string :organization_id
      t.string :role, null: false
      t.string :capability, null: false
      t.boolean :enabled, null: false, default: true
      t.string :created_by_id
      t.jsonb :metadata, null: false, default: {}
      t.timestamps
    end

    add_index :permission_rules, [ :organization_id, :role, :capability ], unique: true, if_not_exists: true
  end

  def create_connector_profiles
    return if table_exists?(:connector_profiles)

    create_table :connector_profiles, id: false do |t|
      t.string :id, null: false, primary_key: true
      t.string :organization_id, null: false
      t.string :kind, null: false
      t.string :name, null: false
      t.string :status, null: false, default: "active"
      t.jsonb :settings, null: false, default: {}
      t.text :secret_payload, null: false, default: "{}"
      t.string :created_by_id, null: false
      t.string :request_id
      t.string :trace_id, null: false
      t.timestamps
    end

    add_index :connector_profiles, [ :organization_id, :kind, :name ], unique: true, if_not_exists: true
    add_index :connector_profiles, [ :organization_id, :status ], if_not_exists: true
  end

  def create_connector_ingestions
    return if table_exists?(:connector_ingestions)

    create_table :connector_ingestions, id: false do |t|
      t.string :id, null: false, primary_key: true
      t.string :connector_profile_id, null: false
      t.string :upload_id, null: false
      t.string :job_id, null: false
      t.string :requested_by_id, null: false
      t.string :status, null: false, default: "pending"
      t.string :object_key
      t.text :source_path
      t.string :filename, null: false
      t.string :content_type, null: false
      t.bigint :byte_size
      t.text :last_error
      t.jsonb :metadata, null: false, default: {}
      t.string :request_id
      t.string :trace_id, null: false
      t.timestamps
    end

    add_index :connector_ingestions, [ :connector_profile_id, :created_at ], if_not_exists: true
    add_index :connector_ingestions, [ :status, :created_at ], if_not_exists: true
    add_index :connector_ingestions, :upload_id, unique: true, if_not_exists: true
    add_index :connector_ingestions, :job_id, unique: true, if_not_exists: true
  end

  def create_connector_leases
    return if table_exists?(:connector_leases)

    create_table :connector_leases, id: false do |t|
      t.string :id, null: false, primary_key: true
      t.string :connector_profile_id, null: false
      t.string :connector_ingestion_id, null: false
      t.string :token_digest, null: false
      t.string :status, null: false, default: "pending"
      t.datetime :expires_at, null: false
      t.datetime :claimed_at
      t.string :claimed_by
      t.string :request_id
      t.string :trace_id, null: false
      t.timestamps
    end

    add_index :connector_leases, :token_digest, unique: true, if_not_exists: true
    add_index :connector_leases, [ :status, :expires_at ], if_not_exists: true
    add_index :connector_leases, :connector_ingestion_id, if_not_exists: true
  end
end
