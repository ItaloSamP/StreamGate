class UploadPolicy < ApplicationPolicy
  def index?
    actor.present?
  end

  def show?
    admin? || same_organization?
  end

  def create?
    actor.present?
  end

  private

  def same_organization?
    actor.present? && record.user.organization_id == actor.organization_id
  end
end
