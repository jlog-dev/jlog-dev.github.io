---
title: "How to Connect to a Private EKS Cluster"
description: "Step-by-step guide to securely connecting from your local machine to an AWS EKS cluster in a private VPC using SSO, temporary credentials, and AWS SSM port forwarding."
pubDate: 2025-09-18
updatedDate: 2025-09-18
lang: "en"
tags: ["aws", "eks", "private-cluster", "ssm", "bastion", "security", "kubectl", "vpn"]
categories: ["Cloud", "DevOps"]
type: "tutorial"
featured: false
excerpt: "Authenticate via your IdP, assume an AWS role for temporary creds, create an SSM port-forwarded tunnel to a bastion host, and configure kubectl to talk to your private EKS endpoint."
tableOfContents: true
author: "JLog"
---

This document outlines the step-by-step process of establishing a secure connection from your local machine to an **AWS Elastic Kubernetes Service (EKS)** cluster residing within a private network. 
This process involves authenticating with your corporate identity provider, obtaining temporary AWS credentials, and creating a secure tunnel via AWS Systems Manager (SSM) to reach the private cluster endpoint.

---

## Step 1: Authenticate with Your Corporate Identity Provider

First, you need to authenticate with your organization's Identity Provider (IdP) to get access to your AWS account. This is done using a corporate tool that abstracts the authentication process.

Bash

```
idpcli get-accounts
idpcli configure-credentials --account $ACCOUNT_ID --role $ROLE_NAME
```

After running this command, your shell's environment will be populated with **temporary AWS credentials**. You can verify that the credentials have been set correctly using the AWS CLI.

Bash

```
aws sts get-caller-identity
```

**Expected Output:** This command will return the **ARN** (Amazon Resource Name) of the IAM role you have just assumed, confirming your identity and permissions.

---

## Step 2: Create a Secure Tunnel with AWS Systems Manager (SSM)

Since your EKS cluster is in a private network, you'll use an SSM tunnel to securely connect to it. This requires identifying a bastion host that can reach the cluster.

#### Find the Bastion Host ID

First, find the Instance ID of the bastion host that will be the target of your SSM session.

Bash

```
BASTION_HOST_ID=$(aws ec2 describe-instances \
    --region "$REGION" \
    --filters "Name=tag:Name,Values=*bastion*" \
              "Name=instance-state-name,Values=running" \
              "Name=vpc-id,Values=$VPC_ID" \
    --query "Reservations[*].Instances[*].InstanceId" \
    --output text)
```

#### Start the SSM Session

Next, start a secure port-forwarding session using SSM. This maps a local port on your machine (e.g., `8443`) to a remote port on the bastion host (e.g., `443`), creating a secure tunnel.

Bash

```
aws ssm start-session \
    --region "$REGION" \
    --target "$BASTION_HOST_ID" \
    --document-name AWS-StartPortForwardingSession \
    --parameters '{"portNumber":["443"],"localPortNumber":["8443"]}'
```

This command creates a secure tunnel and a local proxy, making your EKS cluster's API endpoint accessible at `https://localhost:8443`.

---

### Step 3: Configure `kubectl`

With a secure path to the EKS cluster now established, you must configure `kubectl` to use it. The following command automatically updates your `~/.kube/config` file to use the new local proxy and your temporary credentials.

Bash

```
aws eks update-kubeconfig \
    --region "$REGION" \
    --name "$EKS_CLUSTER_NAME" \
    --alias "$EKS_CLUSTER_NAME"
```

---

### Step 4: Communicate with the Cluster

With the tunnel and `kubeconfig` in place, you can now interact with your cluster using standard `kubectl` commands. Your commands will automatically be routed through the secure SSM tunnel to the private EKS cluster.

Bash

```
kubectl get pods
```

**Result:** The command will successfully retrieve the list of pods from your private EKS cluster, demonstrating that the entire authentication and tunneling workflow is functioning correctly.
