class RetentionPolicy < ApplicationRecord
  include PrefixedId

  prefixed_id_with "retpol"

  DEFAULTS = {
    realtime_events_days: 7,
    dashboard_exports_days: 7,
    operational_warnings_days: 30,
    job_artifacts_days: 30,
    clickhouse_days: 30,
    operational_data_days: 90
  }.freeze

  validates :organization_id, presence: true, uniqueness: true
  validates :realtime_events_days,
            :dashboard_exports_days,
            :operational_warnings_days,
            :job_artifacts_days,
            :clickhouse_days,
            :operational_data_days,
            numericality: { greater_than: 0, only_integer: true }

  def self.for_organization(organization_id)
    find_or_create_by!(organization_id: organization_id) do |policy|
      DEFAULTS.each { |key, value| policy.public_send("#{key}=", value) }
    end
  end
end
