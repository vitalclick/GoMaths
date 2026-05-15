# dev environment — Terraform

Skeleton only. See `infrastructure/README.md` for the broader plan and `infrastructure/terraform/environments/dev/main.tf` for the next steps.

## Apply (once bootstrapped)

```sh
terraform init
terraform plan -out=tfplan
terraform apply tfplan
```

## Region

`af-south-1` (Cape Town) — locked by ADR-002 for POPIA defensibility.
