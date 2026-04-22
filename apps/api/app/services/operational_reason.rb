class OperationalReason
  Result = Struct.new(:value, :reason, keyword_init: true) do
    def success?
      reason.nil?
    end
  end

  def self.parse(raw)
    value = raw.to_s.strip
    return Result.new(reason: :blank) if value.blank?
    return Result.new(reason: :too_long) if value.length > 500

    Result.new(value: value)
  end
end
