require "test_helper"

class UploadTest < ActiveSupport::TestCase
  test "fixture is valid" do
    assert uploads(:registered_upload).valid?
  end

  test "assigns prefixed id on create" do
    upload = Upload.new(
      user: users(:operator),
      filename: "report.csv",
      content_type: "text/csv",
      byte_size: 512,
      checksum_sha256: "b" * 64,
      storage_key: "uploads/report.csv",
      trace_id: "trace_test_upload"
    )

    assert upload.valid?
    assert_match(/\Aupload_[0-9a-f]{32}\z/, upload.id)
  end

  test "requires positive byte size and sha256 checksum" do
    upload = uploads(:registered_upload)
    upload.byte_size = 0
    upload.checksum_sha256 = "invalid"

    assert_not upload.valid?
    assert_includes upload.errors[:byte_size], "must be greater than 0"
    assert upload.errors[:checksum_sha256].any?
  end
end
