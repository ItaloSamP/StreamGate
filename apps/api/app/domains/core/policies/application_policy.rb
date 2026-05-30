class ApplicationPolicy
  attr_reader :actor, :record

  def initialize(actor, record)
    @actor = actor
    @record = record
  end

  def index?
    false
  end

  def show?
    false
  end

  def create?
    false
  end

  def update?
    false
  end

  def destroy?
    false
  end

  private

  def admin?
    actor&.admin?
  end
end
