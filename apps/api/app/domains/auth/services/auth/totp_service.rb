require "erb"
require "openssl"

module Auth
  module TotpService
    module_function

    ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567".freeze
    PERIOD_SECONDS = 30
    DIGITS = 6

    def generate_secret
      base32_encode(SecureRandom.random_bytes(20))
    end

    def code_for(secret, at: Time.current)
      hotp(secret, (at.to_i / PERIOD_SECONDS).floor)
    end

    def verify?(secret, code, at: Time.current, drift: 1)
      candidate = code.to_s.strip
      return false unless candidate.match?(/\A\d{6}\z/)

      counter = (at.to_i / PERIOD_SECONDS).floor
      (-drift..drift).any? { |offset| secure_compare(hotp(secret, counter + offset), candidate) }
    end

    def provisioning_uri(secret:, email:, issuer: "StreamGate")
      label = "#{issuer}:#{email}"
      "otpauth://totp/#{ERB::Util.url_encode(label)}?secret=#{secret}&issuer=#{ERB::Util.url_encode(issuer)}&period=#{PERIOD_SECONDS}&digits=#{DIGITS}"
    end

    def recovery_codes(count: 8)
      Array.new(count) { SecureRandom.alphanumeric(10).scan(/.{1,5}/).join("-").upcase }
    end

    def base32_encode(bytes)
      bits = bytes.bytes.map { |byte| byte.to_s(2).rjust(8, "0") }.join
      bits.scan(/.{1,5}/).map { |chunk| ALPHABET[chunk.ljust(5, "0").to_i(2)] }.join
    end

    def base32_decode(secret)
      normalized = secret.to_s.upcase.gsub(/[^A-Z2-7]/, "")
      bits = normalized.chars.map { |char| ALPHABET.index(char).to_i.to_s(2).rjust(5, "0") }.join
      bits.scan(/.{8}/).map { |chunk| chunk.to_i(2).chr }.join
    end

    def hotp(secret, counter)
      key = base32_decode(secret)
      digest = OpenSSL::HMAC.digest("SHA1", key, [ counter ].pack("Q>"))
      offset = digest.bytes.last & 0x0f
      truncated = digest.byteslice(offset, 4).unpack1("N") & 0x7fffffff
      (truncated % (10**DIGITS)).to_s.rjust(DIGITS, "0")
    end

    def secure_compare(left, right)
      ActiveSupport::SecurityUtils.secure_compare(left, right)
    rescue ArgumentError
      false
    end
  end
end
