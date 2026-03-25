# frozen_string_literal: true

RSpec.describe Worker do
  it "has a version number" do
    expect(Worker::VERSION).not_to be nil
  end

  it "uses semantic versioning" do
    expect(Worker::VERSION).to match(/\A\d+\.\d+\.\d+\z/)
  end
end
