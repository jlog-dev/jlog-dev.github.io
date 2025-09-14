---
title: Securely Connecting to Private EKS and RDS Clusters in AWS
pubDate: 2025-04-28
description: 关于项目上对于连接eks/rds的思考
category: "Development"
tags: ["technical"]
---

## What This Blog Answers

1. **How to connect to a private EKS or RDS cluster in AWS** with full workflow and ready-to-use scripts.
2. **Why Bastion Host is used** and what its role is.
3. **Key AWS concepts** involved in this setup.

---

## How to Connect to Private EKS / RDS Clusters

When your EKS or RDS cluster is deployed in a **private VPC subnet**, you cannot access it directly from your local machine. Instead, you must **securely tunnel** into the private network. The workflow involves:

- Authenticating your AWS session (using SSO or manual credentials)
- Locating the Bastion Host and target cluster (EKS or RDS)
- Setting up port forwarding via AWS Systems Manager (SSM)
- Accessing the service locally through the tunnel

## Why Use Bastion Host and What's Its Role

In a secure AWS architecture, **private resources** like EKS control planes and RDS databases are kept inside **private subnets** — inaccessible directly from the public internet.

### Role of the Bastion Host:

- Acts as a **secure bridge** into the private network.
- Hosts **SSM agent**, allowing **port-forwarded sessions** without needing SSH.
- Avoids opening public access to sensitive resources.
- **Auditable**: All sessions through SSM are logged and trackable in AWS CloudTrail.

### Why not just open the API or DB publicly?

- Direct public access increases **security risks**.
- Attackers can find and attack exposed services.
- Security best practices recommend **zero-trust models** where access is strictly controlled.

Using Bastion Host + SSM provides **tight control**, **encryption**, and **temporary session-based access**.

---

## Key Concepts

| Concept                            | Meaning                                                                                   |
| ---------------------------------- | ----------------------------------------------------------------------------------------- |
| **VPC Private Subnet**             | Internal AWS network where resources are protected from direct internet exposure.         |
| **Bastion Host**                   | A public-facing EC2 instance used as a gateway to private resources.                      |
| **AWS Systems Manager (SSM)**      | AWS service to manage, connect, and automate EC2 instances securely without SSH.          |
| **SSM Session Document**           | A JSON/YAML template that defines a session action (e.g., port forwarding).               |
| **Port Forwarding**                | Securely tunneling network traffic from your local machine to a remote private resource.  |
| **Temporary Credentials (idpcli)** | Short-lived AWS credentials based on SSO authentication, more secure than long-term keys. |

---

## Final Thoughts

Understanding how to set up secure access to private AWS resources is a crucial step toward building production-grade cloud architectures.

With these scripts and concepts, you can:

- Safely interact with private EKS clusters.
- Connect securely to private RDS databases.
- Avoid exposing sensitive services to the internet.
- Build auditable, secure, and scalable cloud systems.
