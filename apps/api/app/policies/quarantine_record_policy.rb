class QuarantineRecordPolicy < ApplicationPolicy
  def resolve_quarantine?
    admin?
  end
end
