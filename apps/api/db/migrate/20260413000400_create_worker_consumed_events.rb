class CreateWorkerConsumedEvents < ActiveRecord::Migration[8.1]
  def change
    create_table :worker_consumed_events, id: false, if_not_exists: true do |t|
      t.string :id, null: false, primary_key: true
      t.string :event_id, null: false
      t.string :event_name, null: false
      t.references :job, null: false, type: :string, foreign_key: true
      t.references :upload, null: false, type: :string, foreign_key: true
      t.string :request_id, null: false
      t.string :trace_id, null: false
      t.datetime :processed_at, null: false, default: -> { "CURRENT_TIMESTAMP" }
      t.timestamps
    end

    add_index :worker_consumed_events, :event_id, unique: true, if_not_exists: true
    add_index :worker_consumed_events, :trace_id, if_not_exists: true
    add_index :worker_consumed_events, [ :job_id, :processed_at ], if_not_exists: true
  end
end
