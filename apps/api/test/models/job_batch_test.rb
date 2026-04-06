require "test_helper"

class JobBatchTest < ActiveSupport::TestCase
  test "batch number is unique per job" do
    duplicate = JobBatch.new(
      job: jobs(:pending_job),
      batch_number: 1,
      status: :pending,
      input_rows: 10,
      valid_rows: 0,
      invalid_rows: 0,
      trace_id: "trace_duplicate_batch"
    )

    assert_not duplicate.valid?
    assert_includes duplicate.errors[:batch_number], "has already been taken"
  end
end
