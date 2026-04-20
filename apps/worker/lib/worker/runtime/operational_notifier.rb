# frozen_string_literal: true

require "json"

module Worker
  module Runtime
    class OperationalNotifier
      def initialize(retention_days: 30)
        @retention_days = retention_days
      end

      def emit_job_transition(connection:, ids:, status:, event_name:, title:, body:)
        setting = notification_setting(connection, ids[:job_id])
        return if setting.nil?

        notification_id = nil
        metadata = {
          job_id: ids[:job_id],
          upload_id: ids[:upload_id],
          event_id: ids[:event_id],
          status: status
        }

        if truthy?(setting.fetch("in_app_enabled"))
          notification_id = insert_notification!(connection, setting, ids, event_name, title, body, metadata)
        end

        insert_delivery!(connection, setting, notification_id, ids, event_name, title, body, metadata, "email") if truthy?(setting.fetch("email_enabled"))
        insert_delivery!(connection, setting, notification_id, ids, event_name, title, body, metadata, "webhook") if truthy?(setting.fetch("webhook_enabled"))
      end

      private

      attr_reader :retention_days

      def notification_setting(connection, job_id)
        result = connection.exec_params(
          <<~SQL,
            SELECT j.requested_by_id AS user_id,
                   ns.id AS setting_id,
                   ns.in_app_enabled,
                   ns.email_enabled,
                   ns.webhook_enabled
            FROM jobs j
            INNER JOIN notification_settings ns ON ns.user_id = j.requested_by_id
            WHERE j.id = $1
            LIMIT 1
          SQL
          [job_id]
        )
        return nil if result.ntuples.zero?

        result[0]
      end

      def insert_notification!(connection, setting, ids, event_name, title, body, metadata)
        notification_id = Worker::Id.generate("notification")
        connection.exec_params(
          <<~SQL,
            INSERT INTO notifications
              (id, recipient_id, event_name, title, body, metadata, trace_id, request_id, expires_at, created_at, updated_at)
            VALUES
              ($1, $2, $3, $4, $5, $6::jsonb, $7, $8, NOW() + ($9::text || ' days')::interval, NOW(), NOW())
            RETURNING id
          SQL
          [
            notification_id,
            setting.fetch("user_id"),
            event_name,
            title,
            body,
            metadata.to_json,
            ids[:trace_id],
            ids[:request_id],
            retention_days
          ]
        )
        notification_id
      end

      def insert_delivery!(connection, setting, notification_id, ids, event_name, title, body, metadata, channel)
        payload = {
          event_name: event_name,
          title: title,
          body: body,
          metadata: metadata
        }

        connection.exec_params(
          <<~SQL,
            INSERT INTO webhook_deliveries
              (id, notification_id, notification_setting_id, channel, event_name, payload, trace_id, request_id, status, next_attempt_at, created_at, updated_at)
            VALUES
              ($1, $2, $3, $4, $5, $6::jsonb, $7, $8, 'pending', NOW(), NOW(), NOW())
          SQL
          [
            Worker::Id.generate("delivery"),
            notification_id,
            setting.fetch("setting_id"),
            channel,
            event_name,
            payload.to_json,
            ids[:trace_id],
            ids[:request_id]
          ]
        )
      end

      def truthy?(value)
        value == true || value.to_s == "t" || value.to_s == "true"
      end
    end
  end
end
