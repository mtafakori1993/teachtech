# Deployment (manual — no CI/CD)

Target: existing k3s node (`opsadmin@10.20.0.1` over WireGuard), new namespace **`teachtech`**, host `teachtech.shomaaa.ir`.
Same pattern as the sibling SHOMAAA apps: node-local image import, Traefik Ingress + ACME resolver `le`, default-deny NetworkPolicy, hardened pod
(non-root, read-only root FS, dropped capabilities, probes on `/api/health`). No database, volume or secret is required.

## Prerequisites
1. **DNS:** `A teachtech.shomaaa.ir → 193.151.152.230`, DNS-only (no CDN proxy). `shomaaa.ir` is delegated to ArvanCloud, so this record is created there.
   Until it exists Traefik cannot obtain a Let's Encrypt certificate (HTTP-01).
2. Docker locally, WireGuard connectivity, `git` with at least one commit (the tag is the short SHA).

## Release
```bash
deploy/deploy.sh            # build image → import into k3s → apply deploy/k8s → wait for rollout
deploy/deploy.sh rollback   # kubectl rollout undo
```
The first release creates the namespace; other namespaces are untouched. The previous image tag is printed before each release (rollback target).

## Verify after deploying
```bash
curl -s https://teachtech.shomaaa.ir/api/health
curl -s https://teachtech.shomaaa.ir/manifest.webmanifest | head
curl -sI https://teachtech.shomaaa.ir/sw.js | grep -i cache-control
BASE_URL=https://teachtech.shomaaa.ir npx playwright test tests/e2e/pwa.spec.ts tests/e2e/public.spec.ts --project=desktop
```
