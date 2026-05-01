# frozen_string_literal: true

require "json"

module Worker
  module Runtime
    class RealtimeEventWriter
      SENSITIVE_KEY_PARTS = %w[token secret password credential authorization access_key api_key].freeze

      def initialize(retention_days:)
        @retention_days = retention_days
      end

      def emit(connection:, event_type:, organization_id:, resource_type:, resource_id:, severity:, payload:, request_id:, trace_id:)
        connection.exec_params(
          <<~SQL,
            INSERT INTO realtime_events
              (id, event_type, organization_id, resource_type, resource_id, severity, payload, occurred_at, expires_at, request_id, trace_id, created_at, updated_at)
            VALUES
              ($1, $2, $3, $4, $5, $6, $7::jsonb, NOW(), NOW() + ($8 || ' days')::interval, $9, $10, NOW(), NOW())
          SQL
          [
            Worker::Id.generate("rte"),
            event_type,
            organization_id,
            resource_type,
            resource_id,
            severity,
            sanitize(payload).to_json,
            retention_days,
            request_id || trace_id,
            trace_id
          ]
        )
      rescue StandardError
        nil
      end

      private

      attr_reader :retention_days

      def sanitize(value)
        case value
        when Hash
          value.each_with_object({}) do |(key, nested), acc|
            normalized = key.to_s
            acc[normalized] = sensitive?(normalized) ? "[masked]" : sanitize(nested)
          end
        when Array
          value.map { |entry| sanitize(entry) }
        else
          value
        end
      end

      def sensitive?(key)
        SENSITIVE_KEY_PARTS.any? { |part| key.downcase.include?(part) }
      end
    end
  end
end
