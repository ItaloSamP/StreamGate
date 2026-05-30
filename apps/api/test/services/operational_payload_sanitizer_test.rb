require "test_helper"

class OperationalPayloadSanitizerTest < ActiveSupport::TestCase
  test "masks sensitive keys recursively while preserving operational identifiers" do
    payload = {
      "event_id" => "event_fixture",
      "job_id" => "job_fixture",
      "cpf" => "12345678900",
      "nested" => {
        "authorization" => "Bearer secret",
        "trace_id" => "trace_fixture"
      },
      "rows" => [
        { "email" => "person@example.test", "row_number" => 3 }
      ]
    }

    sanitized = OperationalPayloadSanitizer.sanitize(payload)

    assert_equal "event_fixture", sanitized["event_id"]
    assert_equal "job_fixture", sanitized["job_id"]
    assert_equal "[REDACTED]", sanitized["cpf"]
    assert_equal "[REDACTED]", sanitized.dig("nested", "authorization")
    assert_equal "trace_fixture", sanitized.dig("nested", "trace_id")
    assert_equal "[REDACTED]", sanitized.dig("rows", 0, "email")
    assert_equal 3, sanitized.dig("rows", 0, "row_number")
  end
end
