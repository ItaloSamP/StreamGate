import json
import subprocess
import sys
import time

DEADLINE_SECONDS = 180
EXPECTED = {
    'postgres': ('running', 'healthy'),
    'redis': ('running', 'healthy'),
    'rabbitmq': ('running', 'healthy'),
    'minio': ('running', 'healthy'),
    'clickhouse': ('running', 'healthy'),
    'minio-init': ('exited', ''),
}


def load_services(raw: str):
    raw = raw.strip()
    if not raw:
        return []

    if raw.startswith('['):
        services = json.loads(raw)
        return services if isinstance(services, list) else [services]

    services = []
    for line in raw.splitlines():
        line = line.strip()
        if not line:
            continue
        services.append(json.loads(line))
    return services


def main() -> int:
    deadline = time.time() + DEADLINE_SECONDS
    last = []

    while time.time() < deadline:
        raw = subprocess.check_output(['docker', 'compose', 'ps', '-a', '--format', 'json'], text=True)
        services = load_services(raw)
        if not services:
            time.sleep(5)
            continue

        seen = {service['Service']: service for service in services}
        missing = [name for name in EXPECTED if name not in seen]
        if missing:
            last = [f'missing service {name}' for name in missing]
            time.sleep(5)
            continue

        errors = []
        for name, (state, health) in EXPECTED.items():
            current = seen[name]
            if current.get('State') != state:
                errors.append(f"service {name} expected state {state}, got {current.get('State')}")
                continue
            if health and current.get('Health') != health:
                errors.append(f"service {name} expected health {health}, got {current.get('Health')}")
                continue
            if name == 'minio-init' and int(current.get('ExitCode', 1)) != 0:
                errors.append('minio-init did not exit successfully')

        if not errors:
            print('compose smoke test passed')
            return 0

        last = errors
        time.sleep(5)

    raise SystemExit('compose smoke test failed: ' + '; '.join(last))


if __name__ == '__main__':
    sys.exit(main())

