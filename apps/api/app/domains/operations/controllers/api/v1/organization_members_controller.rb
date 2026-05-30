module Api
  module V1
    class OrganizationMembersController < ApplicationController
      before_action :authenticate_request!

      def index
        render_success(data: memberships.map { |membership| OrganizationMembershipSerializer.new(membership).serializable_hash })
      end

      def update
        return unless require_admin!

        membership = memberships.find(params[:id])
        member_params.each do |attribute, value|
          membership.public_send("#{attribute}=", value)
        end
        membership.save!
        membership.user.update!(role: membership.role, status: membership.status) if membership.user.organization_id == current_organization.id
        render_success(data: OrganizationMembershipSerializer.new(membership).serializable_hash)
      end

      def destroy
        return unless require_admin!

        membership = memberships.find(params[:id])
        membership.update!(status: "suspended")
        render_success(data: OrganizationMembershipSerializer.new(membership).serializable_hash)
      end

      private

      def memberships
        current_organization.organization_memberships.includes(:user).order(:created_at)
      end

      def member_params
        raw = params.require(:membership)
        {
          role: raw[:role],
          status: raw[:status]
        }.compact
      end
    end
  end
end
