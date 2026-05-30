class NotificationSettingSerializer < ApplicationSerializer
  def serializable_hash
    {
      id: record.id,
      user_id: record.user_id,
      in_app_enabled: record.in_app_enabled,
      email_enabled: record.email_enabled,
      webhook_enabled: record.webhook_enabled,
      webhook_url: record.webhook_url,
      webhook_secret: nil,
      created_at: record.created_at&.iso8601,
      updated_at: record.updated_at&.iso8601
    }
  end
end
