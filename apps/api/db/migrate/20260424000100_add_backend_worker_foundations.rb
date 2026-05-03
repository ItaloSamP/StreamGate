class AddBackendWorkerFoundations < ActiveRecord::Migration[8.1]
  def change
    add_column :uploads, :source_type, :string, null: false, default: "upload"
    add_index :uploads, [ :source_type, :created_at ], if_not_exists: true

    create_table :upload_acquisitions, id: false do |t|
      t.string :id, null: false, primary_key: true
      t.references :upload, null: false, type: :string, foreign_key: true, index: false
      t.references :job, null: false, type: :string, foreign_key: true, index: false
      t.string :source_type, null: false
      t.string :link_mode, null: false
      t.string :status, null: false, default: "pending"
      t.string :url_hash, null: false
      t.text :url_masked, null: false
      t.string :source_host, null: false
      t.string :content_type
      t.bigint :byte_size
      t.datetime :requested_at, null: false
      t.datetime :completed_at
      t.text :last_error
      t.string :request_id
      t.string :trace_id, null: false
      t.jsonb :metadata, null: false, default: {}
      t.timestamps
    end

    add_index :upload_acquisitions, :upload_id, unique: true
    add_index :upload_acquisitions, :job_id, unique: true
    add_index :upload_acquisitions, :url_hash
    add_index :upload_acquisitions, [ :status, :created_at ]
    add_index :upload_acquisitions, :trace_id

    create_table :operational_warnings, id: false do |t|
      t.string :id, null: false, primary_key: true
      t.references :job, type: :string, foreign_key: true, index: false
      t.references :upload, type: :string, foreign_key: true, index: false
      t.string :code, null: false
      t.text :message, null: false
      t.string :status, null: false, default: "open"
      t.string :severity, null: false, default: "warning"
      t.integer :retry_count, null: false, default: 0
      t.datetime :resolved_at
      t.datetime :expires_at, null: false
      t.text :last_error
      t.string :request_id
      t.string :trace_id, null: false
      t.jsonb :metadata, null: false, default: {}
      t.timestamps
    end

    add_index :operational_warnings, [ :status, :created_at ]
    add_index :operational_warnings, [ :job_id, :created_at ]
    add_index :operational_warnings, [ :upload_id, :created_at ]
    add_index :operational_warnings, :expires_at
    add_index :operational_warnings, :trace_id
    add_check_constraint :operational_warnings, "retry_count >= 0", name: "operational_warnings_retry_count_non_negative"
  end
end
