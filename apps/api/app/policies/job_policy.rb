class JobPolicy < ApplicationPolicy
  def show?
    admin? || actor_owns_upload?
  end

  def retry?
    admin?
  end

  private

  def actor_owns_upload?
    actor.present? && record.upload.user_id == actor.id
  end
end
