module Realtime
  class TicketIssuer < ApplicationService
    def initialize(actor:)
      @actor = actor
    end

    def call
      expires_at = Rails.application.config.x.realtime_ticket_ttl_seconds.seconds.from_now
      payload = {
        sub: actor.id,
        organization_id: actor.organization_id,
        role: actor.role,
        exp: expires_at.to_i,
        nonce: SecureRandom.hex(12)
      }
      verifier = Rails.application.message_verifier(:realtime_ticket)
      {
        ticket: verifier.generate(payload),
        organization_id: actor.organization_id,
        role: actor.role,
        expires_at: expires_at.iso8601
      }
    end

    private

    attr_reader :actor
  end
end
