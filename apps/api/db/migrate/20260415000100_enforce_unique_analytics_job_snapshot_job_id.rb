class EnforceUniqueAnalyticsJobSnapshotJobId < ActiveRecord::Migration[8.1]
  INDEX_NAME = "index_analytics_job_snapshots_on_job_id"

  def up
    remove_index :analytics_job_snapshots, name: INDEX_NAME, if_exists: true
    add_index :analytics_job_snapshots, :job_id, unique: true, name: INDEX_NAME
  end

  def down
    remove_index :analytics_job_snapshots, name: INDEX_NAME, if_exists: true
    add_index :analytics_job_snapshots, :job_id, name: INDEX_NAME
  end
end
