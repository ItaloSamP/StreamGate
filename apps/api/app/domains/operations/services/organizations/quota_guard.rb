module Organizations
  class QuotaGuard
    Result = Struct.new(:allowed, :reason, :limit, :used, keyword_init: true) do
      def allowed?
        allowed
      end
    end

    def self.check_upload!(organization:, byte_size:)
      new(organization: organization).check_upload!(byte_size: byte_size)
    end

    def self.record_upload!(organization:, byte_size:)
      new(organization: organization).record_upload!(byte_size: byte_size)
    end

    def self.record_connector_run!(organization:)
      new(organization: organization).record_connector_run!
    end

    def initialize(organization:)
      @organization = organization
    end

    def check_upload!(byte_size:)
      size = byte_size.to_i
      max_file_bytes = organization.quota("max_file_bytes").to_i
      return Result.new(allowed: false, reason: "max_file_bytes", limit: max_file_bytes, used: size) if size > max_file_bytes

      counter = current_counter
      monthly_limit = organization.quota("monthly_upload_bytes").to_i
      projected = counter.upload_bytes + size
      return Result.new(allowed: false, reason: "monthly_upload_bytes", limit: monthly_limit, used: projected) if projected > monthly_limit

      Result.new(allowed: true, limit: monthly_limit, used: projected)
    end

    def record_upload!(byte_size:)
      counter = current_counter
      counter.with_lock do
        counter.update!(upload_bytes: counter.upload_bytes + byte_size.to_i)
      end
    end

    def record_connector_run!
      counter = current_counter
      counter.with_lock do
        counter.update!(connector_runs: counter.connector_runs + 1)
      end
    end

    private

    attr_reader :organization

    def current_counter
      OrganizationUsageCounter.find_or_create_by!(
        organization: organization,
        period_start: Time.current.to_date.beginning_of_month
      )
    end
  end
end
