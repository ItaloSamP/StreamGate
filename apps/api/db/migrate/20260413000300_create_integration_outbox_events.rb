class CreateIntegrationOutboxEvents < ActiveRecord::Migration[8.1]
  def change
    create_table :integration_outbox_events, id: false, if_not_exists: true do |t|
      t.string :id, null: false, primary_key: true
      t.string :event_id, null: false
      t.string :event_name, null: false
      t.string :routing_key, null: false
      t.string :status, null: false, default: "pending"
      t.integer :attempts_count, null: false, default: 0
      t.datetime :available_at, null: false, default: -> { "CURRENT_TIMESTAMP" }
      t.datetime :dispatched_at
      t.string :request_id, null: false
      t.string :trace_id, null: false
      t.text :last_error
      t.jsonb :payload, null: false, default: {}
      t.jsonb :headers, null: false, default: {}
      t.timestamps
    end

    add_index :integration_outbox_events, :event_id, unique: true, if_not_exists: true
    add_index :integration_outbox_events, :trace_id, if_not_exists: true
    add_index :integration_outbox_events, [ :status, :available_at ], if_not_exists: true
  end
end
