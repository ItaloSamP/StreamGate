class OperationalWarningPolicy < ApplicationPolicy
  def review?
    Permissions::Matrix.allowed?(actor, "alerts.review", organization_id: organization_id)
  end

  def dismiss?
    Permissions::Matrix.allowed?(actor, "alerts.dismiss", organization_id: organization_id)
  end

  private

  def organization_id
    record.organization_id || record.job&.requested_by&.organization_id || record.upload&.user&.organization_id
  end
end
