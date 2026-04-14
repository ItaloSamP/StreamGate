class AddOperationalReadIndexes < ActiveRecord::Migration[8.1]
  def change
    add_index :jobs, :created_at, if_not_exists: true
    add_index :jobs, [ :status, :created_at ], if_not_exists: true
    add_index :jobs, [ :requested_by_id, :created_at ], if_not_exists: true

    add_index :quarantine_records, :created_at, if_not_exists: true
    add_index :quarantine_records, [ :severity, :created_at ], if_not_exists: true

    add_index :audit_events, :occurred_at, if_not_exists: true
    add_index :audit_events, [ :action, :occurred_at ], if_not_exists: true
    add_index :audit_events, [ :auditable_type, :occurred_at ], if_not_exists: true
  end
end
