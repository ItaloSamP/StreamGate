# frozen_string_literal: true

module Worker
  module Runtime
    class ClickhouseBackfill
      def initialize(config:, db_client:, loader: nil)
        @config = config
        @db_client = db_client
        @loader = loader || ClickhouseWarehouseLoader.new(config: config)
      end

      def call
        loaded = 0
        db_client.with_connection do |connection|
          snapshots(connection).each do |snapshot|
            batches(connection, snapshot.fetch("job_id")).each do |batch|
              loader.load_snapshot!(connection: connection, snapshot: snapshot, batch: batch)
              loaded += 1
            end
          end
        end
        loaded
      end

      private

      attr_reader :config, :db_client, :loader

      def snapshots(connection)
        connection.exec_params(
          <<~SQL
            SELECT
              ajs.job_id,
              ajs.upload_id,
              ajs.organization_id,
              ajs.source_type,
              ajs.status,
              ajs.quarantined_records_count,
              ajs.job_created_at,
              ajs.last_synced_at,
              j.trace_id,
              j.request_id
            FROM analytics_job_snapshots ajs
            INNER JOIN jobs j ON j.id = ajs.job_id
          SQL
        )
      end

      def batches(connection, job_id)
        connection.exec_params(
          <<~SQL,
            SELECT id, job_id, input_rows, valid_rows, invalid_rows
            FROM job_batches
            WHERE job_id = $1
            ORDER BY batch_number ASC
          SQL
          [job_id]
        )
      end
    end
  end
end
