namespace :streamgate do
  namespace :outbox do
    desc "Dispatch pending outbox events to RabbitMQ"
    task dispatch: :environment do
      result = OutboxDispatchPendingService.call(limit: ENV.fetch("OUTBOX_DISPATCH_LIMIT", "200").to_i)
      puts "outbox dispatch completed dispatched=#{result.dispatched} failed=#{result.failed}"
    end
  end

  namespace :audit do
    desc "Prune audit events older than configured retention"
    task prune: :environment do
      deleted = Audit::PruneEventsService.call
      puts "audit prune completed deleted=#{deleted}"
    end
  end
end
