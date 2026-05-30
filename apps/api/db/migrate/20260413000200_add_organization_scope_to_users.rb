class AddOrganizationScopeToUsers < ActiveRecord::Migration[8.1]
  def up
    unless column_exists?(:users, :organization_id)
      add_column :users, :organization_id, :string, null: false, default: "org_default"
    end

    add_index :users, :organization_id, if_not_exists: true
    add_index :users, [ :organization_id, :role ], if_not_exists: true
  end

  def down
    remove_index :users, [ :organization_id, :role ], if_exists: true
    remove_index :users, :organization_id, if_exists: true
    remove_column :users, :organization_id if column_exists?(:users, :organization_id)
  end
end
