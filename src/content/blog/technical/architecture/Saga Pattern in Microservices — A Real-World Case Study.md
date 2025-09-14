---
title: "Saga Pattern in Microservices — A Real-World Case Study"
description: "Learn by making mistakes - a practical guide to implementing the Saga Pattern in distributed systems with real-world challenges and solutions."
pubDate: 2025-04-21
tags: ["microservices", "distributed-systems", "saga-pattern", "architecture"]
categories: ["Software Architecture"]
type: "tutorial"
featured: true
lang: "en"
tableOfContents: true
author: "JLog"
excerpt: "Insights and lessons learned from implementing the Saga Pattern in a real-world microservices scenario with GDPR compliance requirements."
---

## What This Blog Answers

In this post, I’m sharing insights and lessons learned from implementing the **Saga Pattern** in a real-world microservices scenario. This blog is driven by practical challenges I faced when building a distributed order duplication flow where:

- Multiple services needed to work together reliably.
- Any partial failure had to be rolled back without corrupting data.
- GDPR compliance added pressure on data management and traceability.

### Key questions answered:

- When should I use the **Saga Pattern** in microservices?
- What are orchestrated sagas and how do they work?
- How should I structure compensation and rollback logic?
- Which communication pattern (sync vs async) should I choose and when?

## Introduction

Let’s explore the **Saga Pattern** through a real-world business requirement:

> “As a user, I want to duplicate an existing order to reuse past information efficiently.”

This seemingly simple action involves coordinating multiple services (order, billing, shipping, inventory, etc.), maintaining consistency, and gracefully handling failures.

### Business Requirements

**Acceptance Criteria**

1. **Trigger**: On “Duplicate Order” click, start duplication using original order and customer ID.
2. **Enrichment**: Gather customer preferences and product data.
3. **Order Creation**: Store enriched data as a new order.
4. **Downstream Sync**: Notify billing, shipping, inventory, etc.
5. **Rollback on Failure**: If any step fails, delete the new order and undo all changes.
6. **GDPR Compliance**: Rollbacks must remove all order traces.
7. **User Feedback**: Show either the new order or an error message.

---

### Technical Approach

Why **Saga Pattern**?

Traditional distributed transactions are not feasible in microservices. Instead, we use the **Saga Pattern** with **orchestration** to ensure **eventual consistency** and **rollback on failure**.

---

## Architecture Overview

User → OrderController → OrderDuplicationService
├─ fetch original order
├─ Enrichment (ProductService, CustomerService)
├─ Save new order
└─ DuplicationSagaManager
├─ BillingClient.duplicate()
├─ ShippingClient.duplicate()
├─ InventoryClient.duplicate()
└─ If failure → CompensationService.reverse()

---

### Benefits of This Design

| Area                      | Benefit                                      |
| ------------------------- | -------------------------------------------- |
| **Saga Pattern**          | Handles partial failures with rollback logic |
| **Helper Services**       | Keeps business logic clean and modular       |
| **Central Orchestration** | Better control, easier debugging             |
| **Resilience**            | Retry, circuit breaker, timeout support      |
| **Observability**         | Easier traceability with logs + metrics      |

---

### Error Handling Strategy

- Retry transient failures (e.g., via Resilience4j)

- Log trace ID for observability

- On failure:
  - Call compensating APIs
    - Delete new order
    - Return 500 to UI

---

## Choosing Communication Patterns in Microservices

### **1. Ask: Is it user-facing or internal?**

- **User-facing (external APIs):**

  ➤ Use **REST/gRPC** behind an **API Gateway**

  ➤ Use **synchronous communication** for immediate response

- **Internal services:**

  ➤ Use **event-driven (asynchronous)** where possible for loose coupling and better scalability

---

### **2. Check: Does the service need a response?**

- **Needs a response?** ➤ Use **synchronous (REST, gRPC)**

- **Fire-and-forget or background processing?** ➤ Use **asynchronous (message queues, events)**

---

### **3. Consider failure tolerance**

- Use **circuit breakers**, **timeouts**, **retries** for **synchronous calls**

- Use **dead-letter queues**, **retry strategies** for **asynchronous calls**

---

### **4. Monitor & Control with:**

- **Service Discovery** for dynamic environments

- **Load Balancers** for traffic distribution

- **Service Mesh** for advanced observability and traffic control (e.g., Istio)

### 5. Best Practices Summary

| Goal           | Best Practice                                                      |
| -------------- | ------------------------------------------------------------------ |
| Loose Coupling | **Use event-driven architecture**                                  |
| Reliability    | **Implement circuit breakers**, retries, and fallbacks             |
| Scalability    | **Asynchronous** messaging and **message queues** help manage load |
| Simplicity     | **Use REST** or **gRPC** for straightforward, fast communication   |

## Sample Implementation (Scaffold)

### 1. Controller

```kotlin

@RestController

@RequestMapping("/api/orders")

class OrderController(

    private val orderDuplicationService: OrderDuplicationService

) {

    @PostMapping("/{orderId}/duplicate")

    fun duplicateOrder(

        @PathVariable orderId: Long,

        @RequestParam customerId: Long

    ): ResponseEntity<Order> {

        return try {

            val newOrder = orderDuplicationService.duplicateOrder(orderId, customerId)

            ResponseEntity.ok(newOrder)

        } catch (ex: DuplicationException) {

            ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build()

        }

    }

}

```

---

### 2. Service Layer (Core Logic)

```kotlin

@Service

class OrderDuplicationService(

    private val orderRepository: OrderRepository,

    private val customerClient: CustomerClient,

    private val productClient: ProductClient,

    private val sagaManager: DuplicationSagaManager

) {

    fun duplicateOrder(originalOrderId: Long, customerId: Long): Order {

        val originalOrder = orderRepository.findById(originalOrderId)

            .orElseThrow { DuplicationException("Original order not found") }



        val customerData = customerClient.fetchPreferences(customerId)

        val productDetails = productClient.fetchProductDetails(originalOrder.productIds)



        val newOrder = enrichOrder(originalOrder, customerData, productDetails)

        val savedOrder = orderRepository.save(newOrder)



        try {

            sagaManager.orchestrateDuplication(originalOrder.id, savedOrder.id)

        } catch (ex: Exception) {

            sagaManager.rollback(savedOrder.id)

            throw DuplicationException("Duplication failed: ${ex.message}")

        }



        return savedOrder

    }



    private fun enrichOrder(original: Order, customer: CustomerData, products: List<Product>): Order {

        return Order(

            customerId = customer.id,

            productIds = products.map { it.id },

            metadata = original.metadata + customer.preferences,

            status = "CREATED"

        )

    }

}

```

---

### 3. Duplication Saga Manager

```kotlin

@Service

class DuplicationSagaManager(

    private val billingClient: BillingClient,

    private val shippingClient: ShippingClient,

    private val inventoryClient: InventoryClient,

    private val compensationService: CompensationService

) {

    fun orchestrateDuplication(originalId: Long, newId: Long) {

        val succeeded = mutableListOf<String>()

        try {

            billingClient.duplicate(originalId, newId)

            succeeded.add("billing")



            shippingClient.duplicate(originalId, newId)

            succeeded.add("shipping")



            inventoryClient.duplicate(originalId, newId)

            succeeded.add("inventory")



            // Add more services as needed



        } catch (ex: Exception) {

            compensationService.reverse(newId, succeeded)

            throw ex

        }

    }



    fun rollback(newOrderId: Long) {

        compensationService.reverseAll(newOrderId)

    }

}

```

---

### 4. Compensation Service

```kotlin

@Service

class CompensationService(

    private val billingClient: BillingClient,

    private val shippingClient: ShippingClient,

    private val inventoryClient: InventoryClient,

    private val orderRepository: OrderRepository

) {

    fun reverse(newId: Long, succeeded: List<String>) {

        if ("billing" in succeeded) billingClient.deleteDuplicate(newId)

        if ("shipping" in succeeded) shippingClient.deleteDuplicate(newId)

        if ("inventory" in succeeded) inventoryClient.deleteDuplicate(newId)

        orderRepository.deleteById(newId)

    }



    fun reverseAll(newId: Long) {

        billingClient.deleteDuplicate(newId)

        shippingClient.deleteDuplicate(newId)

        inventoryClient.deleteDuplicate(newId)

        orderRepository.deleteById(newId)

    }

}

```

---

### 5. Client Interfaces (Example)

```kotlin

@FeignClient(name = "customer-service")

interface CustomerClient {

    @GetMapping("/customers/{id}/preferences")

    fun fetchPreferences(@PathVariable id: Long): CustomerData

}



@FeignClient(name = "product-service")

interface ProductClient {

    @PostMapping("/products/details")

    fun fetchProductDetails(@RequestBody ids: List<Long>): List<Product>

}



// Replicate similar structure for billingClient, shippingClient, etc.

```

---

### 6. Repository

```kotlin

@Repository

interface OrderRepository : JpaRepository<Order, Long>

```

---

### 7. Exception + Observability

```kotlin

class DuplicationException(message: String) : RuntimeException(message)

```

---

## Final Thoughts

- Can also refer to https://www.geeksforgeeks.org/microservices-communication-patterns/
- Communication patterns should be driven by business requirements.
- To support maintainability and clarity, it’s often useful to introduce **helper services** or split clients based on responsibility. For example, separating `CustomerInfoFetchClient` and `CustomerInfoDuplicationClient` aligns with the **Single Responsibility Principle (SRP)** and promotes cleaner code. It also makes it easier to enforce boundaries like **CORS policies** or different authentication scopes when needed.
