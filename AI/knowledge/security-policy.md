# Information Security Policy

**Department:** Security  
**Tags:** security, compliance, access

## Password & authentication

- SSO via Okta required for all internal tools
- MFA mandatory for email, VPN, and production systems
- Password rotation not required when MFA is enabled

## Data classification

| Level | Examples | Handling |
|-------|----------|----------|
| Public | Marketing site | No restrictions |
| Internal | Wiki, policies | Employees only |
| Confidential | Customer data | Need-to-know, encrypted |
| Restricted | PII, keys | Approved access only |

## Incident reporting

Report suspected incidents within 1 hour:

- Email: security@insightflow.example.com
- Slack: #security-incidents
- On-call: PagerDuty "Security Escalation"

## Acceptable use

- No sharing of credentials or API keys in Slack/email
- No storing customer data on personal devices
- Phishing reports go to security@insightflow.example.com

## VPN

Remote access to internal networks requires company VPN. Split tunneling is disabled for engineering subnets.
