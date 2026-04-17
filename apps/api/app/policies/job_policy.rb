class JobPolicy < ApplicationPolicy
  def index?
    actor.present?
  end

  def show?
    admin? || same_organization?
  end

  def retry?
    admin?
  end

  private

  def same_organization?
    actor.present? && record.requested_by.organization_id == actor.organization_id
  end
end
