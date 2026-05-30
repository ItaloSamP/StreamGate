class ApplicationSerializer
  attr_reader :record

  def initialize(record)
    @record = record
  end

  def serializable_hash
    raise NotImplementedError, "#{self.class.name} must implement #serializable_hash"
  end
end
