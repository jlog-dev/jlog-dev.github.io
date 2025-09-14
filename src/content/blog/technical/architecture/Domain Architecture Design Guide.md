---
title: Domain Architecture Design Guide
description: 关于DDD 和六边形架构再思考
pubDate: 2025-05-21
tags: ["technical"]
---

## 📘 Overview

This document summarizes the design principles and patterns discussed for building a microservice that follows clean architecture, using Domain-Driven Design (DDD) and Hexagonal Architecture (Ports and Adapters). It also includes practical guidance for abstraction and modularization based on real-world complexity.

---

## 🎯 Purpose of This Guide

To answer key questions:

- How do I model the core business logic of my service?
- Where should logic live — domain, application, or infrastructure?
- When should I abstract a layer or break a service into smaller parts?
- How do I apply DDD in a real-world Spring Boot/Kotlin project?

---

## 🧩 Real-World Context: Order Microservice

### Business Requirements:

- Create an order by fetching data from 6+ external services
- Assemble an `Order` aggregate based on mode, toggle, and context
- Save the order to DB and publish Kafka events
- Rollback if any critical step fails

### Resulting Questions:

- How do I prevent my `OrderService` from becoming a God class?
- Should I inject all 6 clients directly into the service?
- Where should I put logic like toggled UUID generation, conditional order assembly?
- How do I structure my project so each part is testable and composable?

---

## ⚙️ Architectural Principles

### 1. Domain-Driven Design (DDD)

- Model the business domain with clarity and intention
- Focus on entities (`Order`, `People`), value objects (`Money`, `Address`), aggregates, and domain services
- Identify bounded contexts — e.g., Order, People, Logistics

### 2. Hexagonal Architecture (Ports & Adapters)

- Keep the domain core isolated from frameworks and infrastructure
- Use **Ports** as interfaces (e.g., `OrderRepository`, `OrderPublisher`)
- Implement those ports in **Adapters** (e.g., `JpaOrderRepository`, `KafkaPublisher`)
- Structure the project around clear boundaries

### 3. Clean Application Layer

- Orchestrate workflows through dedicated **use case classes** like `CreateOrderUseCase`, `CancelOrderUseCase`
- Use factories (e.g., `OrderFactory`) to build domain aggregates
- Use builders (e.g., `OrderContextBuilder`) to collect data from services

---

## 📦 Recommended Project Structure

```markdown
order-service/
├── domain/
│ ├── model/ # Entities, VOs, Aggregates
│ ├── service/ # Domain services
│ └── event/ # Domain events
│
├── application/
│ ├── usecase/ # Use cases like CreateOrderUseCase
│ ├── factory/ # Factories like OrderFactory
│ └── port/
│ ├── inbound/ # Controller interfaces (optional)
│ └── outbound/ # Ports like OrderRepository, KafkaPublisher
│
├── adapter/
│ ├── inbound/
│ │ ├── api/ # Controllers
│ │ └── kafka/ # Kafka consumers
│ └── outbound/
│ ├── messaging/ # KafkaPublisherImpl
│ └── persistence/ # JpaOrderRepository
│
├── infra/
│ ├── config/ # KafkaConfig, JpaConfig, etc.
│ └── shared/ # EnvConfig, ClockProvider, UUIDGenerator
```

---

## 🧠 Design Guidelines

### Domain Layer

- Pure business logic
- No framework dependencies
- Use entities, value objects, and domain services

### Application Layer

- Coordinates use cases
- Builds context and invokes domain logic
- Depends on ports (interfaces), not infrastructure

### Ports

- Defined in the application layer
- Represent what the domain/use case needs (e.g. repository, publisher)

### Adapters

- Implement ports using real infrastructure
- Contain Spring, Kafka, JPA, etc.
- Never depend on the domain directly — only via ports

### Infrastructure Layer

- Shared low-level tech utilities and config
- Used by adapters or injected into use cases

---

## 🤖 Real-World Abstraction Triggers

You should **create a new layer or class** when:

- A method takes 6+ parameters → extract a context object
- Logic uses toggles or env flags → extract to a strategy/factory
- One class talks to 5+ services → extract a builder/service
- Use case starts branching heavily → split into distinct classes
- Domain logic can be reused/tested in isolation → move to domain

---

## ✅ Key Takeaways

| Concept                | Role                                                                     |
| ---------------------- | ------------------------------------------------------------------------ |
| DDD                    | Models core business behavior (what your system is really doing)         |
| Hexagonal Architecture | Organizes your system around that model cleanly                          |
| Application Layer      | Coordinates workflows using the domain and ports                         |
| Ports                  | Define _what_ is needed (e.g. save, publish), not _how_                  |
| Adapters               | Implement the ports using real technology (Kafka, JPA, REST)             |
| OrderContextBuilder    | Gathers external data; lives in application layer                        |
| OrderFactory           | Builds Order aggregate; lives in application layer if it uses env/config |
| Domain Layer           | Pure rules — entities, value objects, and core invariants                |

---

> Build systems where your business logic is free to evolve, unburdened by frameworks. That's what good architecture enables.
