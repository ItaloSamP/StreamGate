class ConnectorProfileSerializer < ApplicationSerializer
  def serializable_hash
    {
      id: record.id,
      organization_id: record.organization_id,
      kind: record.kind,
      name: record.name,
      status: record.status,
      settings: sanitized_settings,
      created_by_id: record.created_by_id,
      trace_id: record.trace_id,
      created_at: record.created_at&.iso8601,
      updated_at: record.updated_at&.iso8601
    }
  end

  private

  def sanitized_settings
    Operational::PayloadMasker.call(record.settings || {})
  end
end
