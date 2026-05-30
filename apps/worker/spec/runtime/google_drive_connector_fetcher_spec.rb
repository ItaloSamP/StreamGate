# frozen_string_literal: true

require "spec_helper"

RSpec.describe Worker::Runtime::ConnectorFetcher do
  it "fetches Google Drive files through a delegated access material provider without logging refresh tokens" do
    provider = instance_double(Worker::Runtime::GoogleDriveAccessProvider)
    client = instance_double(Worker::Runtime::GoogleDriveClient)
    tempfile = Tempfile.new(["streamgate-drive-", ".csv"], binmode: true)
    tempfile.write("order_id\n1001\n")
    tempfile.rewind

    fetcher = described_class.new(google_drive_access_provider: provider, google_drive_client: client)
    allow(provider).to receive(:access_token_for).with("oauth_connection_1").and_return("short-lived-access-token")
    allow(client).to receive(:download_file).with(
      access_token: "short-lived-access-token",
      file_id: "drive_file_1"
    ).and_return(tempfile)

    result = fetcher.call(
      connector: {
        "kind" => "google_drive",
        "settings" => { "oauth_connection_id" => "oauth_connection_1" },
        "secrets" => { "refresh_token" => "must-not-be-used" }
      },
      ingestion: {
        "drive_file_id" => "drive_file_1",
        "content_type" => "text/csv"
      }
    )

    expect(result.content_type).to eq("text/csv")
    expect(result.byte_size).to eq(14)
    expect(result.checksum_sha256).to match(/\A[a-f0-9]{64}\z/)
    expect(provider).to have_received(:access_token_for).with("oauth_connection_1")
    expect(client).to have_received(:download_file)
  ensure
    tempfile&.close!
  end
end
