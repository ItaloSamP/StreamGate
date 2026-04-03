# frozen_string_literal: true

RSpec.describe "worker.gemspec" do
  let(:gemspec_path) { File.expand_path("../worker.gemspec", __dir__) }
  let(:specification) { Gem::Specification.load(gemspec_path) }

  it "exposes StreamGate metadata instead of template placeholders" do
    expect(specification.summary).not_to include("TODO")
    expect(specification.description).not_to include("TODO")
    expect(specification.homepage).to include("StreamGate")
    expect(specification.metadata.fetch("source_code_uri")).to include("StreamGate")
  end

  it "keeps a non-empty file list for packaging" do
    expect(specification.files).not_to be_empty
  end
end
