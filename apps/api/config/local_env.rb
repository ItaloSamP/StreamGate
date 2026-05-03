# frozen_string_literal: true

module StreamGateLocalEnv
  module_function

  def load!
    return if ENV["STREAMGATE_SKIP_DOTENV"] == "1"
    return if production_env?

    env_paths.each { |path| load_file(path) }
  end

  def load_file(path)
    return unless File.file?(path)

    File.readlines(path, chomp: true).each do |line|
      key, value = parse_line(line)
      next unless key
      next if ENV.key?(key)

      ENV[key] = value
    end
  end

  def parse_line(line)
    stripped = line.strip
    return [ nil, nil ] if stripped.empty? || stripped.start_with?("#")

    match = stripped.match(/\A(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)=(.*)\z/)
    return [ nil, nil ] unless match

    [ match[1], parse_value(match[2]) ]
  end

  def parse_value(raw_value)
    value = raw_value.strip
    if quoted?(value)
      value[1...-1]
    else
      value.sub(/\s+#.*\z/, "").strip
    end
  end

  def quoted?(value)
    value.length >= 2 && (
      (value.start_with?('"') && value.end_with?('"')) ||
      (value.start_with?("'") && value.end_with?("'"))
    )
  end

  def env_paths
    root = File.expand_path("../../..", __dir__)
    [ File.join(root, ".env"), File.expand_path("../.env", __dir__) ]
  end

  def production_env?
    ENV["RAILS_ENV"] == "production" || ENV["RACK_ENV"] == "production"
  end
end
