class UploadPolicy < ApplicationPolicy
  def index?
    actor.present?
  end

  def show?
    admin? || owns_record?
  end

  def create?
    actor.present?
  end

  private

  def owns_record?
    actor.present? && record.user_id == actor.id
  end
end
