# frozen_string_literal: true

require "spec_helper"

RSpec.describe Worker::Runtime::OperationalNotifier do
  let(:notifier) { described_class.new }
  let(:connection) { FakeNotifierConnection.new }
  let(:ids) do
    {
      event_id: "event_fixture",
      job_id: "job_fixture",
      upload_id: "upload_fixture",
      trace_id: "trace_fixture",
      request_id: "request_fixture"
    }
  end

  it "creates an in-app notification and webhook/email deliveries for enabled settings" do
    notifier.emit_job_transition(
      connection: connection,
      ids: ids,
      status: "completed",
      event_name: "job.completed",
      title: "Job concluido",
      body: "O job job_fixture foi concluido."
    )

    expect(connection.notifications.size).to eq(1)
    expect(connection.notifications.first).to include(recipient_id: "user_fixture", event_name: "job.completed", trace_id: "trace_fixture")
    expect(connection.deliveries.map { |delivery| delivery[:channel] }).to eq(%w[email webhook])
    expect(connection.deliveries).to all(include(event_name: "job.completed", trace_id: "trace_fixture"))
    expect(connection.deliveries.first[:payload]).not_to include("webhook_secret")
  end

  it "does nothing when the job has no notification setting" do
    connection.setting_rows.clear

    notifier.emit_job_transition(
      connection: connection,
      ids: ids,
      status: "failed",
      event_name: "job.failed",
      title: "Job falhou",
      body: "O job job_fixture falhou."
    )

    expect(connection.notifications).to be_empty
    expect(connection.deliveries).to be_empty
  end
end

class FakeNotifierResult
  def initialize(rows)
    @rows = rows
  end

  def ntuples
    @rows.size
  end

  def [](index)
    @rows.fetch(index)
  end
end

class FakeNotifierConnection
  attr_reader :notifications, :deliveries, :setting_rows

  def initialize
    @setting_rows = [
      {
        "user_id" => "user_fixture",
        "setting_id" => "setting_fixture",
        "in_app_enabled" => "t",
        "email_enabled" => "t",
        "webhook_enabled" => "t"
      }
    ]
    @notifications = []
    @deliveries = []
  end

  def exec_params(sql, params)
    case sql
    when /FROM jobs j\s+INNER JOIN notification_settings/m
      FakeNotifierResult.new(setting_rows)
    when /INSERT INTO notifications/
      @notifications << {
        id: params[0],
        recipient_id: params[1],
        event_name: params[2],
        title: params[3],
        body: params[4],
        metadata: params[5],
        trace_id: params[6],
        request_id: params[7]
      }
      FakeNotifierResult.new([{ "id" => params[0] }])
    when /INSERT INTO webhook_deliveries/
      @deliveries << {
        id: params[0],
        notification_id: params[1],
        notification_setting_id: params[2],
        channel: params[3],
        event_name: params[4],
        payload: params[5],
        trace_id: params[6],
        request_id: params[7]
      }
      FakeNotifierResult.new([])
    else
      FakeNotifierResult.new([])
    end
  end
end
