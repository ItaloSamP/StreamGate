require "digest"

module Idempotency
  class GuardService < ApplicationService
    Result = Struct.new(:status, :body, :replayed, :reason, keyword_init: true) do
      def replayed?
        replayed
      end

      def success?
        reason.nil?
      end
    end

    def initialize(actor:, key:, scope:, payload:, trace_id:, request_id:)
      @actor = actor
      @key = key.to_s.strip
      @scope = scope
      @payload = payload
      @trace_id = trace_id
      @request_id = request_id
    end

    def call
      return Result.new(reason: :missing_key) if key.blank?

      fingerprint = Digest::SHA256.hexdigest(JSON.generate(normalized_payload))
      existing = OperationalActionIdempotencyKey.find_by(actor: actor, scope: scope, key: key)

      if existing.present? && !existing.expired?
        return Result.new(reason: :conflict) if existing.request_fingerprint != fingerprint

        return Result.new(status: existing.response_status, body: existing.response_body, replayed: true)
      end

      response_status, response_body = yield

      record = existing || OperationalActionIdempotencyKey.new(actor: actor, scope: scope, key: key)
      record.assign_attributes(
        request_fingerprint: fingerprint,
        response_status: response_status,
        response_body: response_body,
        expires_at: Rails.application.config.x.idempotency_key_ttl_seconds.seconds.from_now,
        trace_id: trace_id,
        request_id: request_id
      )
      replay = save_record!(record, fingerprint)
      return replay if replay

      Result.new(status: response_status, body: response_body, replayed: false)
    end

    private

    attr_reader :actor, :key, :scope, :payload, :trace_id, :request_id

    def save_record!(record, fingerprint)
      record.save!
      nil
    rescue ActiveRecord::RecordInvalid, ActiveRecord::RecordNotUnique
      existing = OperationalActionIdempotencyKey.find_by(actor: actor, scope: scope, key: key)
      raise if existing.blank? || existing.expired? || existing.request_fingerprint != fingerprint

      Result.new(status: existing.response_status, body: existing.response_body, replayed: true)
    end

    def normalized_payload
      payload.deep_stringify_keys.sort.to_h
    end
  end
end
