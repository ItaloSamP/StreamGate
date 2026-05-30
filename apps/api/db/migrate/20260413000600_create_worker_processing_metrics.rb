class CreateWorkerProcessingMetrics < ActiveRecord::Migration[8.1]
  def change
    create_table :worker_processing_metrics, id: false, if_not_exists: true do |t|
      t.string :id, null: false, primary_key: true
      t.string :event_id, null: false
      t.references :job, null: false, type: :string, foreign_key: true
      t.string :status, null: false
      t.integer :retry_count, null: false, default: 0
      t.boolean :moved_to_dlq, null: false, default: false
      t.integer :processing_latency_ms, null: false, default: 0
      t.string :error_code
      t.string :error_class
      t.string :trace_id, null: false
      t.datetime :processed_at, null: false, default: -> { "CURRENT_TIMESTAMP" }
      t.timestamps
    end

    add_index :worker_processing_metrics, :event_id, if_not_exists: true
    add_index :worker_processing_metrics, :processed_at, if_not_exists: true
    add_index :worker_processing_metrics, [ :status, :processed_at ], if_not_exists: true
    add_index :worker_processing_metrics, [ :moved_to_dlq, :processed_at ], if_not_exists: true
  end
end
