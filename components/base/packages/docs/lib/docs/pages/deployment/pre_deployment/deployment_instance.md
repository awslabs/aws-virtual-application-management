---
id: deployment_instance
title: Deployment Instance
sidebar_label: Deployment Instance
---

- Development hardware

  - The solution can be deployed and maintained from a local dev machine, preferably Linux variant or Mac.
  - Alternatively, use a T2.medium (4 GB) EC2 instance or larger

    - Larger machines will have faster networking; larger disks
      will have higher performance
    - Default VPC & subnet are sufficient

- Attach to your instance a IAM role with sufficient permission (such as AdministratorAccess)

  See: [Add an IAM role to an instance](/deployment/reference/iam_role)
