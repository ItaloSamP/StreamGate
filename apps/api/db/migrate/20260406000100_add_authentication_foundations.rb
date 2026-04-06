class AddAuthenticationFoundations < ActiveRecord::Migration[8.1]
  def change
    change_table :users, bulk: true do |t|
      t.string :password_digest
      t.string :password_reset_token_digest
      t.datetime :password_reset_sent_at
    end

    add_index :users, :password_reset_token_digest, unique: true

    create_table :auth_sessions, id: false do |t|
      t.string :id, null: false, primary_key: true
      t.references :user, null: false, type: :string, foreign_key: true
      t.string :token_digest, null: false
      t.datetime :expires_at, null: false
      t.datetime :revoked_at
      t.datetime :last_seen_at
      t.string :request_id
      t.string :trace_id, null: false
      t.string :ip_address
      t.string :user_agent
      t.timestamps
    end

    add_index :auth_sessions, :token_digest, unique: true
    add_index :auth_sessions, [:user_id, :created_at]
    add_index :auth_sessions, :expires_at
    add_index :auth_sessions, :trace_id
    add_check_constraint :auth_sessions, "expires_at > created_at", name: "auth_sessions_expires_after_create"
  end
end
