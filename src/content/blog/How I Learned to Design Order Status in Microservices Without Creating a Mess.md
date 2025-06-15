---
title: "Order Status Design in Microservices: Tips & Tricks"
description: "Designing order workflows in microservices can get messy with over 20 statuses to manage. "
pubDate: 2025-04-22
tags: ["technical"]
---

When I started designing the order workflow for a microservice system, I quickly ran into problems. Orders in our system can transition through more than 20 statuses — from `ORDER_CREATED` to `PAID`, `SHIPPED`, `CANCELLED`, and beyond.

Each status could require a different service to:

- Perform some business logic (e.g., call another service, validate state)
- Trigger the next transition
- Broadcast updates downstream

At first, I wasn’t sure where the logic should live or how services should coordinate. These were the questions I needed answers to:

1. Should there be a central service that owns all order statuses?
2. How should status transitions be modeled and persisted?
3. How can I avoid bloated `when` statements while keeping the code modular?
4. What if multiple statuses share common logic like updating and broadcasting?
5. Should class names reflect the design patterns used (like `*Strategy`)?

This post is a summary of what I learned while figuring it out.

---

## 1. Should One Central Service Manage All Order Statuses?

I initially considered building a central `OrderStatusService` to coordinate everything. But that quickly felt wrong.

What worked better was **event-driven choreography**:

- Each service emits events like `PaymentCompleted` or `ItemShipped`
- The **Order Service** listens to these events and updates the order status

This approach kept services decoupled and avoided turning the Order Service into a monolith. It also respected service ownership — the service that performs the action should own the event that represents it.

---

## 2. Should I Store Only the Latest Status or Keep the Full History?

It was tempting to just store the latest status in the `orders` table. But I soon realized that **both are useful**:

- `orders.status`: for quick access
- `order_status_history`: for traceability, debugging, and analytics

Keeping a history allowed us to reconstruct workflows, support compliance requirements, and debug production issues more easily.

---

## 3. How Do I Structure Code When Every Status Has Different Logic?

Originally, I was using `when(order.status)` and branching logic inside service classes. It got messy fast.

The better approach was combining the **State Pattern** and **Strategy Pattern**:

- Create a `OrderStatusHandler` interface
- Implement one class per status (or group of statuses)
- Each handler owns its specific logic and knows how to transition

This made the system easier to extend, test, and reason about. Adding a new status no longer meant touching a massive switch statement.

---

## 4. What If Many Statuses Share the Same Final Steps?

For many statuses (e.g., 1–10), the last steps were the same: update the order status and publish an event.

Instead of repeating those steps everywhere, I extracted them into a reusable class: `OrderUpdaterAndBroadcaster`.

Each handler could:

1. Run its specific logic
2. Call a shared method to update and broadcast

This reduced duplication and made cross-cutting concerns (like logging or metrics) easier to manage.

---

## 5. Should Class Names Reflect the Pattern (e.g., `*Strategy`)?

I wondered if I should name my handlers something like `OrderStatusStrategy`. But I realized naming by **domain responsibility** is clearer.

Calling them `OrderStatusHandler` made the role of each class obvious — it handles a specific order status. The fact that it uses a pattern internally is an implementation detail, not the point.

---

## Final Thoughts

If you're designing microservices around stateful business processes like orders, here’s what helped me:

- Let each service emit the events it owns
- Let the Order Service respond to those events and manage status updates
- Use handlers to isolate logic per status
- Extract shared behaviors like `update + broadcast` into reusable components
- Focus on domain-driven names, not design-pattern terms

This approach helped me reduce complexity, improve testability, and keep services modular without sacrificing clarity.

---

## TL;DR

| Problem                   | What I Do Now                                      |
| ------------------------- | -------------------------------------------------- |
| Centralized status logic? | ❌ Use event-driven updates in Order Service       |
| Store status?             | ✅ Both latest and full history                    |
| Unique logic per status?  | ✅ One handler per status                          |
| Shared final steps?       | ✅ Compose reusable logic for update + broadcast   |
| Naming?                   | ✅ Use domain terms like `Handler`, not `Strategy` |
