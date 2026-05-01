module Api
  module V1
    module Connectors
      class ProfilesController < ApplicationController
        include IdempotentOperation

        before_action :authenticate_request!

        def index
          return forbidden unless allowed?

          profiles = ConnectorProfile.where(organization_id: current_actor.organization_id).order(created_at: :desc)
          render_success(data: profiles.map { |profile| ConnectorProfileSerializer.new(profile).serializable_hash })
        end

        def create
          return forbidden unless allowed?

          payload = profile_params.to_h
          with_idempotency!(scope: "connector.profile:create", payload: payload) do
            profile = ConnectorProfile.new(
              organization_id: current_actor.organization_id,
              name: payload.fetch("name"),
              kind: payload.fetch("kind"),
              settings: payload.fetch("settings", {}),
              created_by: current_actor,
              request_id: Current.request_id,
              trace_id: Current.trace_id
            )
            profile.secrets = payload.fetch("secrets", {})
            profile.save!
            audit!(profile, "connector.profile.created")
            [ 201, { data: ConnectorProfileSerializer.new(profile).serializable_hash } ]
          end
        end

        def show
          return forbidden unless allowed?

          profile = ConnectorProfile.where(organization_id: current_actor.organization_id).find(params[:id])
          render_success(data: ConnectorProfileSerializer.new(profile).serializable_hash)
        end

        def update
          return forbidden unless allowed?

          profile = ConnectorProfile.where(organization_id: current_actor.organization_id).find(params[:id])
          payload = profile_params.to_h
          with_idempotency!(scope: "connector.profile:update:#{profile.id}", payload: payload) do
            profile.assign_attributes(payload.slice("name", "kind", "settings", "status"))
            profile.secrets = payload["secrets"] if payload.key?("secrets")
            profile.save!
            audit!(profile, "connector.profile.updated")
            [ 200, { data: ConnectorProfileSerializer.new(profile).serializable_hash } ]
          end
        end

        def test
          return forbidden unless allowed?

          profile = ConnectorProfile.where(organization_id: current_actor.organization_id).find(params[:id])
          render_success(data: { id: profile.id, status: "configured", kind: profile.kind })
        end

        private

        def profile_params
          params.require(:connector_profile).permit(:name, :kind, :status, settings: {}, secrets: {})
        end

        def allowed?
          ConnectorProfilePolicy.new(current_actor, ConnectorProfile).manage?
        end

        def forbidden
          render_api_error(code: "access_denied", message: "Acesso negado para conectores.", status: :forbidden)
        end

        def audit!(profile, action)
          AuditEvent.create!(
            actor: current_actor,
            auditable: profile,
            action: action,
            request_id: Current.request_id,
            trace_id: Current.trace_id,
            occurred_at: Time.current,
            metadata: { action: action, source_type: "connector", status: profile.status }
          )
        end
      end
    end
  end
end
