# Incident Response Guide

**Department:** Security  
**Tags:** incident, on-call, sev

## Severity levels

| SEV | Description | Response time |
|-----|-------------|---------------|
| SEV1 | Production down or data breach | 15 min |
| SEV2 | Major feature broken | 1 hour |
| SEV3 | Degraded performance | 4 hours |
| SEV4 | Minor issue | Next business day |

## Incident commander

- SEV1/SEV2: On-call engineer becomes IC until handoff
- IC coordinates Slack war room `#incident-YYYYMMDD`

## Communication

- Internal updates every 30 min for SEV1
- Status page updated for customer-facing outages
- Postmortem required within 5 business days for SEV1–SEV2

## Runbook location

Engineering runbooks live in the internal wiki under `/ops/runbooks`.

## Escalation

Page security team for any suspected data exposure using PagerDuty service "Security Escalation".
