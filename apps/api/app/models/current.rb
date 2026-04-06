class Current < ActiveSupport::CurrentAttributes
  attribute :request_id, :trace_id, :actor_id
end
