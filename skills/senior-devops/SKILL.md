---
name: senior-devops
description: Comprehensive DevOps skill for CI/CD, infrastructure automation, containerization, and cloud platforms (AWS, GCP, Azure). Includes pipeline setup, infrastructure as code, deployment automation, and monitoring. Use when setting up pipelines, deploying applications, managing infrastructure, implementing monitoring, or optimizing deployment processes.
---

# Senior DevOps Engineer

CI/CD, containers, Kubernetes, IaC, and observability patterns for production systems.

## Table of Contents

- [GitHub Actions](#github-actions)
- [Docker](#docker)
- [Kubernetes](#kubernetes)
- [Terraform / OpenTofu](#terraform--opentofu)
- [Observability (OpenTelemetry)](#observability-opentelemetry)
- [GitOps](#gitops)
- [Security Scanning](#security-scanning)
- [Cost Optimization](#cost-optimization)

---

## GitHub Actions

### Secretless Auth via OIDC (no long-lived credentials)

```yaml
# .github/workflows/deploy.yml
permissions:
  id-token: write   # required for OIDC
  contents: read

jobs:
  deploy:
    runs-on: ubuntu-latest
    environment: production   # requires manual approval in repo settings
    steps:
      - uses: actions/checkout@v4

      # AWS
      - uses: aws-actions/configure-aws-credentials@v4
        with:
          role-to-assume: arn:aws:iam::123456789012:role/github-actions-deploy
          aws-region: us-east-1

      # GCP
      - uses: google-github-actions/auth@v2
        with:
          workload_identity_provider: projects/123/locations/global/workloadIdentityPools/github/providers/github
          service_account: deploy@my-project.iam.gserviceaccount.com
```

### Pin actions to full commit SHA (not tags)

```yaml
# WRONG — tag can be moved
- uses: actions/checkout@v4

# RIGHT — immutable, auditable
- uses: actions/checkout@11bd71901bbe5b1630ceea73d27597364c9af683  # v4.2.2
```

### Reusable workflows

```yaml
# .github/workflows/_build.yml (reusable)
on:
  workflow_call:
    inputs:
      image-tag:
        required: true
        type: string
    secrets:
      REGISTRY_TOKEN:
        required: true

# Caller
jobs:
  build:
    uses: ./.github/workflows/_build.yml
    with:
      image-tag: ${{ github.sha }}
    secrets:
      REGISTRY_TOKEN: ${{ secrets.REGISTRY_TOKEN }}
```

### Cache dependencies

```yaml
- uses: actions/setup-node@v4
  with:
    node-version: '22'
    cache: 'npm'

- uses: actions/cache@v4
  with:
    path: ~/.cache/pip
    key: ${{ runner.os }}-pip-${{ hashFiles('**/requirements.txt') }}
```

---

## Docker

### Multi-stage build with distroless

```dockerfile
# Build stage
FROM node:22-slim AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --ignore-scripts
COPY . .
RUN npm run build

# Production stage — distroless has no shell, minimal attack surface
FROM gcr.io/distroless/nodejs22-debian12
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
EXPOSE 3000
CMD ["dist/server.js"]
```

### BuildKit caching and secrets (never bake secrets into layers)

```dockerfile
# syntax=docker/dockerfile:1

# Mount pip cache — not stored in image
RUN --mount=type=cache,target=/root/.cache/pip \
    pip install -r requirements.txt

# Mount secret at build time — never appears in layer history
RUN --mount=type=secret,id=npmrc,target=/root/.npmrc \
    npm ci
```

```bash
# Build with BuildKit
DOCKER_BUILDKIT=1 docker build \
  --secret id=npmrc,src=.npmrc \
  --cache-from type=registry,ref=myrepo/app:cache \
  --cache-to   type=registry,ref=myrepo/app:cache,mode=max \
  -t myrepo/app:$GIT_SHA .
```

### Layer ordering (slow → fast)

```dockerfile
# 1. OS deps (rarely change)
RUN apt-get update && apt-get install -y --no-install-recommends curl && rm -rf /var/lib/apt/lists/*

# 2. Package manager files (change on dep updates)
COPY package*.json ./
RUN npm ci --ignore-scripts

# 3. Source code (changes every commit)
COPY . .
RUN npm run build
```

---

## Kubernetes

### Resource requests/limits (always set both — determines QoS class)

```yaml
resources:
  requests:
    cpu: "250m"
    memory: "256Mi"
  limits:
    # Never set CPU limits — causes throttling under burst load
    # Set only memory limits to get Burstable QoS
    memory: "512Mi"
```

**QoS classes:**
- `Guaranteed`: requests == limits for all containers → last evicted
- `Burstable`: requests < limits → evicted after BestEffort
- `BestEffort`: no requests/limits → first evicted

### All three probe types (on separate endpoints)

```yaml
livenessProbe:
  httpGet:
    path: /healthz/live      # returns 200 if process is alive; restart if fails
    port: 8080
  initialDelaySeconds: 30
  periodSeconds: 10
  failureThreshold: 3

readinessProbe:
  httpGet:
    path: /healthz/ready     # returns 200 if ready to receive traffic; remove from LB if fails
    port: 8080
  initialDelaySeconds: 5
  periodSeconds: 5
  failureThreshold: 3

startupProbe:
  httpGet:
    path: /healthz/startup   # gives slow-start apps time before liveness kicks in
    port: 8080
  failureThreshold: 30       # 30 × 10s = 5 minutes max startup
  periodSeconds: 10
```

**Rule**: Never reuse the same endpoint for all three probes. Liveness must not depend on downstream services — it will cause cascading restarts.

### HPA + KEDA for event-driven scaling

```yaml
# Standard HPA (CPU/memory)
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: api
  minReplicas: 2
  maxReplicas: 20
  metrics:
    - type: Resource
      resource:
        name: cpu
        target:
          type: Utilization
          averageUtilization: 70
  behavior:
    scaleDown:
      stabilizationWindowSeconds: 300   # wait 5 min before scaling down
```

```yaml
# KEDA — scale on queue depth, Kafka lag, cron, etc.
apiVersion: keda.sh/v1alpha1
kind: ScaledObject
spec:
  scaleTargetRef:
    name: worker
  minReplicaCount: 0    # can scale to zero
  maxReplicaCount: 50
  triggers:
    - type: aws-sqs-queue
      metadata:
        queueURL: https://sqs.us-east-1.amazonaws.com/123/my-queue
        queueLength: "10"   # 1 pod per 10 messages
```

### PodDisruptionBudget (required for zero-downtime deploys)

```yaml
apiVersion: policy/v1
kind: PodDisruptionBudget
metadata:
  name: api-pdb
spec:
  minAvailable: 2        # or use maxUnavailable: 1
  selector:
    matchLabels:
      app: api
```

### Network policies (default deny, explicit allow)

```yaml
# Default deny all ingress/egress
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: default-deny-all
spec:
  podSelector: {}
  policyTypes: [Ingress, Egress]

# Allow only: api → postgres on 5432
---
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: allow-api-to-postgres
spec:
  podSelector:
    matchLabels:
      app: postgres
  ingress:
    - from:
        - podSelector:
            matchLabels:
              app: api
      ports:
        - port: 5432
```

### Spread across zones

```yaml
topologySpreadConstraints:
  - maxSkew: 1
    topologyKey: topology.kubernetes.io/zone
    whenUnsatisfiable: DoNotSchedule
    labelSelector:
      matchLabels:
        app: api
```

---

## Terraform / OpenTofu

### Layered module structure

```
infra/
├── modules/              # reusable building blocks (no state)
│   ├── vpc/
│   ├── eks/
│   └── rds/
├── environments/
│   ├── staging/          # thin wrappers that call modules
│   │   ├── main.tf
│   │   ├── variables.tf
│   │   └── backend.tf    # remote state config
│   └── production/
└── shared/               # cross-env resources (DNS, ECR)
```

### Remote state + locking

```hcl
# backend.tf
terraform {
  backend "s3" {
    bucket         = "my-terraform-state"
    key            = "production/eks/terraform.tfstate"
    region         = "us-east-1"
    dynamodb_table = "terraform-locks"   # prevents concurrent applies
    encrypt        = true
  }
}
```

### Pin providers and modules

```hcl
terraform {
  required_version = ">= 1.9, < 2.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"   # allows 5.x but not 6.x
    }
  }
}

module "vpc" {
  source  = "terraform-aws-modules/vpc/aws"
  version = "5.13.0"   # exact pin for production
}
```

### Drift detection

```bash
# Check for infrastructure drift without changing anything
terraform plan -refresh-only

# In CI — fail pipeline if drift detected
terraform plan -refresh-only -detailed-exitcode
# exit 0 = no changes, exit 2 = drift detected
```

### Variables and secrets

```hcl
# Use sensitive = true to prevent values appearing in plan output
variable "db_password" {
  type      = string
  sensitive = true
}

# Pass secrets via environment — never in tfvars committed to git
# TF_VAR_db_password=... terraform apply
```

---

## Observability (OpenTelemetry)

**2025 rule**: OTel Collector is the non-negotiable central routing hub. Never send telemetry directly to vendors from application code.

```
App → OTel Collector → [Tempo, Prometheus, Loki, Datadog, etc.]
```

### OTel Collector config

```yaml
# otel-collector.yaml
receivers:
  otlp:
    protocols:
      grpc:
        endpoint: 0.0.0.0:4317
      http:
        endpoint: 0.0.0.0:4318

processors:
  batch:
    timeout: 5s
    send_batch_size: 1024
  tail_sampling:              # sample after seeing full trace
    decision_wait: 10s
    policies:
      - name: errors-policy
        type: status_code
        status_code: { status_codes: [ERROR] }   # always keep errors
      - name: slow-policy
        type: latency
        latency: { threshold_ms: 500 }            # keep slow traces
      - name: probabilistic
        type: probabilistic
        probabilistic: { sampling_percentage: 10 } # sample 10% of rest

exporters:
  otlp/tempo:
    endpoint: tempo:4317
    tls:
      insecure: true
  prometheusremotewrite:
    endpoint: http://prometheus:9090/api/v1/write

service:
  pipelines:
    traces:
      receivers: [otlp]
      processors: [batch, tail_sampling]
      exporters: [otlp/tempo]
    metrics:
      receivers: [otlp]
      processors: [batch]
      exporters: [prometheusremotewrite]
```

### Instrument Node.js with OTel SDK

```typescript
// instrumentation.ts — load before all other imports
import { NodeSDK } from '@opentelemetry/sdk-node'
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-grpc'
import { OTLPMetricExporter } from '@opentelemetry/exporter-metrics-otlp-grpc'
import { PeriodicExportingMetricReader } from '@opentelemetry/sdk-metrics'
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node'

const sdk = new NodeSDK({
  serviceName: process.env.OTEL_SERVICE_NAME ?? 'my-service',
  traceExporter: new OTLPTraceExporter({ url: 'http://otel-collector:4317' }),
  metricReader: new PeriodicExportingMetricReader({
    exporter: new OTLPMetricExporter({ url: 'http://otel-collector:4317' }),
    exportIntervalMillis: 15_000,
  }),
  instrumentations: [getNodeAutoInstrumentations()],
})

sdk.start()
```

### Trace-log correlation

```typescript
import { trace, context } from '@opentelemetry/api'

function getTraceContext() {
  const span = trace.getActiveSpan()
  if (!span) return {}
  const { traceId, spanId } = span.spanContext()
  return { traceId, spanId }
}

// Add to every log line
logger.info('Payment processed', {
  ...getTraceContext(),
  amount: 99.99,
  userId: 'u_123',
})
```

### Key metrics to instrument

```typescript
import { metrics } from '@opentelemetry/api'

const meter = metrics.getMeter('my-service')
const httpDuration = meter.createHistogram('http.server.duration', {
  description: 'HTTP request duration',
  unit: 'ms',
  advice: { explicitBucketBoundaries: [5, 10, 25, 50, 100, 250, 500, 1000] },
})
const activeRequests = meter.createUpDownCounter('http.server.active_requests')

// Use OTel semantic conventions for attribute names
// http.request.method, http.response.status_code, url.path, etc.
```

---

## GitOps

### ArgoCD app-of-apps pattern

```yaml
# apps/root-app.yaml — bootstrap app that manages all other apps
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: root
  namespace: argocd
spec:
  source:
    repoURL: https://github.com/myorg/infra
    targetRevision: main
    path: apps/
  destination:
    server: https://kubernetes.default.svc
    namespace: argocd
  syncPolicy:
    automated:
      prune: true        # remove resources deleted from git
      selfHeal: true     # revert manual kubectl changes
```

### Flux (alternative to ArgoCD)

```yaml
# flux-system/kustomization.yaml
apiVersion: kustomize.toolkit.fluxcd.io/v1
kind: Kustomization
metadata:
  name: apps
spec:
  interval: 5m
  path: ./apps/production
  prune: true
  sourceRef:
    kind: GitRepository
    name: infra
  healthChecks:
    - apiVersion: apps/v1
      kind: Deployment
      name: api
      namespace: default
```

---

## Security Scanning

### Trivy — image and IaC scanning

```bash
# Scan container image (fail on HIGH/CRITICAL)
trivy image --severity HIGH,CRITICAL --exit-code 1 myrepo/app:$GIT_SHA

# Scan Terraform IaC
trivy config --severity HIGH,CRITICAL ./infra/

# Generate SBOM (software bill of materials)
trivy image --format cyclonedx --output sbom.json myrepo/app:$GIT_SHA
```

### GitHub Actions security pipeline

```yaml
jobs:
  security:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@11bd71901bbe5b1630ceea73d27597364c9af683

      - name: Build image
        run: docker build -t app:${{ github.sha }} .

      - name: Scan image
        uses: aquasecurity/trivy-action@915b19bbe73b92a6cf82a1bc12b087c9a19a5fe  # v0.28.0
        with:
          image-ref: app:${{ github.sha }}
          format: sarif
          output: trivy-results.sarif
          severity: HIGH,CRITICAL
          exit-code: '1'

      - name: Upload SARIF to GitHub Security
        uses: github/codeql-action/upload-sarif@v3
        if: always()
        with:
          sarif_file: trivy-results.sarif

      - name: Scan IaC
        run: trivy config --severity HIGH,CRITICAL --exit-code 1 ./infra/
```

### Secret scanning

```bash
# Gitleaks — prevent secrets from reaching git
# Install pre-commit hook
gitleaks protect --staged

# Scan full repo history
gitleaks detect --source . --report-path gitleaks-report.json
```

---

## Cost Optimization

### Karpenter (EKS) — replaces Cluster Autoscaler

Karpenter + spot diversification + consolidation routinely delivers 50-70% compute cost reduction.

```yaml
# NodePool — provision right-sized nodes just in time
apiVersion: karpenter.sh/v1
kind: NodePool
metadata:
  name: default
spec:
  template:
    spec:
      requirements:
        - key: karpenter.sh/capacity-type
          operator: In
          values: ["spot", "on-demand"]   # spot first
        - key: node.kubernetes.io/instance-type
          operator: In
          values: ["m5.large", "m5.xlarge", "m6i.large", "m6i.xlarge"]  # diversify
      nodeClassRef:
        group: karpenter.k8s.aws
        kind: EC2NodeClass
        name: default
  disruption:
    consolidationPolicy: WhenEmptyOrUnderutilized
    consolidateAfter: 30s   # bin-pack idle nodes aggressively
  limits:
    cpu: "1000"
```

```yaml
# EC2NodeClass — use latest EKS-optimized AMI automatically
apiVersion: karpenter.k8s.aws/v1
kind: EC2NodeClass
metadata:
  name: default
spec:
  amiSelectorTerms:
    - alias: al2023@latest   # auto-updates to latest patched AMI
  subnetSelectorTerms:
    - tags:
        karpenter.sh/discovery: my-cluster
  securityGroupSelectorTerms:
    - tags:
        karpenter.sh/discovery: my-cluster
```

### Spot instance best practices

```yaml
# Use multiple instance families and sizes — maximizes spot pool availability
requirements:
  - key: node.kubernetes.io/instance-type
    operator: In
    values:
      - m5.xlarge
      - m5a.xlarge
      - m6i.xlarge
      - m6a.xlarge
      - m7i.xlarge

# Handle spot interruption gracefully
# Karpenter automatically drains nodes 2 minutes before interruption
# Ensure pods have preStop hooks + terminationGracePeriodSeconds
spec:
  terminationGracePeriodSeconds: 90
  containers:
    - lifecycle:
        preStop:
          exec:
            command: ["/bin/sh", "-c", "sleep 5"]  # allow LB to drain
```

### Resource optimization

```bash
# Find over-provisioned pods with VPA recommendation
kubectl get vpa -A

# Goldilocks — namespace-level VPA dashboard
kubectl label ns default goldilocks.fairwinds.com/enabled=true
kubectl port-forward svc/goldilocks-dashboard 8080:80 -n goldilocks
```

---

## Quick Reference

### CI/CD Checklist
- [ ] OIDC auth — no long-lived secrets in GitHub Actions secrets
- [ ] Actions pinned to full commit SHA
- [ ] Environment protection rules on production jobs
- [ ] Docker layer cache configured
- [ ] Trivy scan in pipeline (fail on HIGH/CRITICAL)
- [ ] SBOM generated and attached to release

### Kubernetes Checklist
- [ ] `resources.requests` and `resources.limits.memory` set on all containers
- [ ] All three health probes defined (startup, readiness, liveness)
- [ ] PodDisruptionBudget defined for all critical workloads
- [ ] Network policies: default-deny + explicit allow rules
- [ ] `topologySpreadConstraints` across zones
- [ ] `terminationGracePeriodSeconds` ≥ 30 + preStop sleep

### Terraform Checklist
- [ ] Remote state with locking (S3 + DynamoDB or Terraform Cloud)
- [ ] Provider versions pinned (`~>` minor floor, exact for prod)
- [ ] `sensitive = true` on secret variables
- [ ] Drift detection in scheduled CI job (`plan -refresh-only`)
- [ ] Modules in `/modules`, environments in `/environments`

### Observability Checklist
- [ ] OTel Collector as routing hub (never direct-to-vendor)
- [ ] Tail sampling configured (always keep errors + slow traces)
- [ ] Trace IDs injected into log lines
- [ ] OTel semantic conventions used for attribute names
- [ ] RED metrics: Rate, Errors, Duration per service
