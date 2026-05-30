class CreateSaasReleaseFoundations < ActiveRecord::Migration[8.1]
  def change
    create_table :organizations, id: :string do |t|
      t.string :slug, null: false
      t.string :name, null: false
      t.string :status, null: false, default: "active"
      t.jsonb :settings, null: false, default: {}
      t.jsonb :quotas, null: false, default: {}
      t.integer :retention_days, null: false, default: 90
      t.jsonb :compliance_profile, null: false, default: {}
      t.timestamps

      t.index :slug, unique: true
      t.index :status
    end

    create_table :organization_memberships, id: :string do |t|
      t.string :organization_id, null: false
      t.string :user_id, null: false
      t.string :role, null: false
      t.string :status, null: false, default: "active"
      t.string :invited_by_id
      t.datetime :joined_at
      t.timestamps

      t.index [ :organization_id, :user_id ], unique: true, name: "idx_org_memberships_org_user"
      t.index [ :organization_id, :role ]
      t.index [ :user_id, :status ]
    end

    create_table :organization_invites, id: :string do |t|
      t.string :organization_id, null: false
      t.string :email, null: false
      t.string :role, null: false
      t.string :status, null: false, default: "pending"
      t.string :token_digest, null: false
      t.datetime :expires_at, null: false
      t.string :invited_by_id, null: false
      t.string :accepted_by_id
      t.datetime :accepted_at
      t.timestamps

      t.index :token_digest, unique: true
      t.index [ :organization_id, :email, :status ], name: "idx_org_invites_org_email_status"
    end

    create_table :mfa_factors, id: :string do |t|
      t.string :user_id, null: false
      t.string :factor_type, null: false, default: "totp"
      t.string :status, null: false, default: "pending"
      t.text :secret_ciphertext, null: false
      t.jsonb :recovery_code_digests, null: false, default: []
      t.datetime :enabled_at
      t.datetime :last_verified_at
      t.timestamps

      t.index [ :user_id, :status ]
    end

    create_table :mfa_challenges, id: :string do |t|
      t.string :user_id, null: false
      t.string :token_digest, null: false
      t.datetime :expires_at, null: false
      t.datetime :verified_at
      t.timestamps

      t.index :token_digest, unique: true
      t.index [ :user_id, :expires_at ]
    end

    create_table :oidc_providers, id: :string do |t|
      t.string :organization_id, null: false
      t.string :provider, null: false, default: "google_workspace"
      t.string :issuer, null: false
      t.string :client_id, null: false
      t.text :client_secret_ciphertext, null: false
      t.string :hosted_domain, null: false
      t.jsonb :scopes, null: false, default: []
      t.string :status, null: false, default: "active"
      t.timestamps

      t.index [ :organization_id, :provider ], unique: true
    end

    create_table :oidc_login_states, id: :string do |t|
      t.string :organization_id, null: false
      t.string :oidc_provider_id, null: false
      t.string :state_digest, null: false
      t.string :nonce, null: false
      t.string :redirect_uri
      t.datetime :expires_at, null: false
      t.datetime :consumed_at
      t.timestamps

      t.index :state_digest, unique: true
      t.index [ :organization_id, :expires_at ]
    end

    create_table :oauth_connections, id: :string do |t|
      t.string :organization_id, null: false
      t.string :user_id, null: false
      t.string :provider, null: false
      t.string :status, null: false, default: "active"
      t.jsonb :scopes, null: false, default: []
      t.text :refresh_token_ciphertext
      t.datetime :token_expires_at
      t.datetime :revoked_at
      t.timestamps

      t.index [ :organization_id, :user_id, :provider ], unique: true, name: "idx_oauth_connections_org_user_provider"
      t.index [ :organization_id, :provider, :status ], name: "idx_oauth_connections_org_provider_status"
    end

    create_table :oauth_authorization_states, id: :string do |t|
      t.string :organization_id, null: false
      t.string :user_id, null: false
      t.string :provider, null: false
      t.string :state_digest, null: false
      t.jsonb :scopes, null: false, default: []
      t.datetime :expires_at, null: false
      t.datetime :consumed_at
      t.timestamps

      t.index :state_digest, unique: true
    end

    create_table :malware_scans, id: :string do |t|
      t.string :upload_id, null: false
      t.string :job_id, null: false
      t.string :connector_ingestion_id
      t.string :status, null: false, default: "pending"
      t.string :scanner, null: false, default: "clamav"
      t.string :signature
      t.string :request_id
      t.string :trace_id, null: false
      t.datetime :scanned_at
      t.timestamps

      t.index [ :upload_id, :status ]
      t.index [ :job_id, :status ]
    end

    create_table :organization_usage_counters, id: :string do |t|
      t.string :organization_id, null: false
      t.date :period_start, null: false
      t.bigint :upload_bytes, null: false, default: 0
      t.integer :connector_runs, null: false, default: 0
      t.timestamps

      t.index [ :organization_id, :period_start ], unique: true, name: "idx_org_usage_counters_org_period"
    end

    add_column :connector_ingestions, :drive_file_id, :string
    add_column :connector_ingestions, :drive_folder_id, :string
    add_column :connector_ingestions, :parent_ingestion_id, :string
    add_index :connector_ingestions, :parent_ingestion_id

    add_foreign_key :organization_memberships, :organizations
    add_foreign_key :organization_memberships, :users
    add_foreign_key :organization_invites, :organizations
    add_foreign_key :organization_invites, :users, column: :invited_by_id
    add_foreign_key :organization_invites, :users, column: :accepted_by_id
    add_foreign_key :mfa_factors, :users
    add_foreign_key :mfa_challenges, :users
    add_foreign_key :oidc_providers, :organizations
    add_foreign_key :oidc_login_states, :organizations
    add_foreign_key :oidc_login_states, :oidc_providers
    add_foreign_key :oauth_connections, :organizations
    add_foreign_key :oauth_connections, :users
    add_foreign_key :oauth_authorization_states, :organizations
    add_foreign_key :oauth_authorization_states, :users
    add_foreign_key :malware_scans, :uploads
    add_foreign_key :malware_scans, :jobs
    add_foreign_key :malware_scans, :connector_ingestions
    add_foreign_key :organization_usage_counters, :organizations

    reversible do |dir|
      dir.up do
        execute <<~SQL.squish
          INSERT INTO organizations (id, slug, name, status, quotas, retention_days, created_at, updated_at)
          SELECT DISTINCT
            users.organization_id,
            lower(regexp_replace(users.organization_id, '[^a-zA-Z0-9]+', '-', 'g')),
            users.organization_id,
            'active',
            '{"max_file_bytes":10737418240,"monthly_upload_bytes":1099511627776,"connector_runs_daily":1000,"retention_days":90}'::jsonb,
            90,
            NOW(),
            NOW()
          FROM users
          WHERE users.organization_id IS NOT NULL
          ON CONFLICT (id) DO NOTHING
        SQL

        execute <<~SQL.squish
          INSERT INTO organization_memberships (id, organization_id, user_id, role, status, joined_at, created_at, updated_at)
          SELECT
            concat('omem_', users.id),
            users.organization_id,
            users.id,
            CASE WHEN users.role = 'admin' THEN 'admin' ELSE 'operator' END,
            CASE WHEN users.status = 'active' THEN 'active' ELSE users.status END,
            users.created_at,
            NOW(),
            NOW()
          FROM users
          WHERE users.organization_id IS NOT NULL
          ON CONFLICT (organization_id, user_id) DO NOTHING
        SQL
      end
    end
  end
end
