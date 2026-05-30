class NotificationSettingPolicy < ApplicationPolicy
  def manage_notification_settings?
    actor.present? && record.user_id == actor.id
  end
end
