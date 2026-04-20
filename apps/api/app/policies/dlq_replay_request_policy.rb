class DlqReplayRequestPolicy < ApplicationPolicy
  def request_dlq_replay?
    admin?
  end

  def approve_dlq_replay?
    admin? && record.requested_by_id != actor&.id
  end

  def execute_dlq_replay?
    admin?
  end
end
