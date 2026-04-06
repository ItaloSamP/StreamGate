class AuditEventPolicy < ApplicationPolicy
  def show?
    admin?
  end

  def index?
    admin?
  end
end
