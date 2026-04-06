require "test_helper"

class ProcessingAttemptTest < ActiveSupport::TestCase
  test "attempt number is unique per job" do
    duplicate = ProcessingAttempt.new(
      job: jobs(:pending_job),
      initiated_by: users(:operator),
      attempt_number: 1,
      operation: "worker.process_upload",
      trace_id: "trace_duplicate_attempt"
    )

    assert_not duplicate.valid?
    assert_includes duplicate.errors[:attempt_number], "has already been taken"
  end

  test "can finish successfully" do
    attempt = processing_attempts(:first_attempt)

    assert_changes -> { attempt.reload.status }, from: "started", to: "succeeded" do
      attempt.finish_success!
    end

    assert_not_nil attempt.reload.finished_at
  end
end
