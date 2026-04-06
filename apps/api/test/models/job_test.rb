require "test_helper"

class JobTest < ActiveSupport::TestCase
  test "starts processing from pending" do
    job = jobs(:pending_job)

    assert_changes -> { job.reload.status }, from: "pending", to: "processing" do
      job.start_processing!
    end
  end

  test "cannot complete directly from pending" do
    job = jobs(:pending_job)

    error = assert_raises(ArgumentError) { job.complete! }
    assert_match(/invalid transition/, error.message)
  end

  test "fails with classified error" do
    job = jobs(:pending_job)
    job.start_processing!

    assert_changes -> { job.reload.status }, from: "processing", to: "failed" do
      job.fail!(error_code: "batch_validation_failed", error_category: :validation)
    end

    assert_equal "batch_validation_failed", job.reload.error_code
    assert_equal "validation", job.error_category
  end
end
