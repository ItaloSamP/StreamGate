module Permissions
  class Matrix
    DEFAULTS = {
      "admin" => %w[
        dashboard.read
        dashboard.export
        realtime.read
        alerts.review
        alerts.dismiss
        connectors.manage
        permissions.manage
        retention.manage
      ],
      "operator" => %w[
        dashboard.read
        dashboard.export
        realtime.read
        alerts.review
      ],
      "service_account" => %w[
        realtime.read
      ]
    }.freeze

    def self.allowed?(actor, capability, organization_id: nil)
      new(actor, capability, organization_id: organization_id).allowed?
    end

    def initialize(actor, capability, organization_id: nil)
      @actor = actor
      @capability = capability.to_s
      @organization_id = organization_id
    end

    def allowed?
      return false if actor.blank?
      return false if organization_id.present? && !actor.admin? && actor.organization_id != organization_id

      rule = explicit_rule
      return rule.enabled? unless rule.nil?

      default_allowed?
    end

    private

    attr_reader :actor, :capability, :organization_id

    def explicit_rule
      return nil unless Rails.application.config.x.permission_matrix_enabled

      PermissionRule
        .where(role: actor.role, capability: capability)
        .where(organization_id: [ actor.organization_id, nil ])
        .order(Arel.sql("organization_id IS NULL ASC"))
        .first
    end

    def default_allowed?
      DEFAULTS.fetch(actor.role, []).include?(capability)
    end
  end
end
