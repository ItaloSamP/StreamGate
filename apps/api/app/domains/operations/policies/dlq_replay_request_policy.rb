class DlqReplayRequestPolicy < ApplicationPolicy
  def request_dlq_replay?
    admin?
  end

  def approve_dlq_replay?
    admin? && same_organization? && record.requested_by_id != actor&.id
  end

  def execute_dlq_replay?
    admin? && same_organization?
  end

  private

  def same_organization?
    requester_organization_id = record.requested_by&.organization_id
    requester_organization_id.present? &&
      actor&.organization_id == requester_organization_id &&
      actor.active_membership_for?(requester_organization_id)
  end
end
