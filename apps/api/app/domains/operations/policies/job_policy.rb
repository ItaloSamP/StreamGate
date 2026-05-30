class JobPolicy < ApplicationPolicy
  def index?
    actor.present?
  end

  def show?
    admin? || same_organization?
  end

  def retry?
    retry_job?
  end

  def retry_job?
    admin?
  end

  def read_job_artifacts?
    admin? || same_organization?
  end

  def download_job_artifact?
    read_job_artifacts?
  end

  private

  def same_organization?
    actor.present? && record.requested_by.organization_id == actor.organization_id
  end
end
