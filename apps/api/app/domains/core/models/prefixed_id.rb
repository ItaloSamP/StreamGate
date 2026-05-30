module PrefixedId
  extend ActiveSupport::Concern

  included do
    before_validation :assign_prefixed_id, on: :create
  end

  class_methods do
    def prefixed_id_with(prefix)
      @prefixed_id_prefix = prefix
    end

    def prefixed_id_prefix
      @prefixed_id_prefix || superclass.try(:prefixed_id_prefix)
    end
  end

  private

  def assign_prefixed_id
    return if id.present?

    prefix = self.class.prefixed_id_prefix
    raise ArgumentError, "prefixed_id_with must be configured for #{self.class.name}" if prefix.blank?

    self.id = StreamGate::Id.generate(prefix)
  end
end
