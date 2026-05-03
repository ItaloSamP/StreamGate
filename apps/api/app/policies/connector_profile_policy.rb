class ConnectorProfilePolicy < ApplicationPolicy
  def manage?
    Permissions::Matrix.allowed?(actor, "connectors.manage", organization_id: actor&.organization_id)
  end
end
