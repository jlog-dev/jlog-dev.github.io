---
title: DDD & 六边形架构（Hexagonal Architecture)
description: 听烂了的DDD的思考版
pubDate: 2025-04-20
tags: ["technical"]
---

## 问题引入

为数不多的项目经验中，大家似乎把 DDD（领域驱动设计）和六边形架构（Hexagonal Architecture)视为一套默认的代码架构设计方案。
那么它们是为了解决什么问题而存在的呢？特地去查了一下，解决的问题包括：

- 业务逻辑越来越复杂，Controller 和 Service 内部代码混合
- 各类数据模型乱成一团，接口、数据库、内部逻辑抱成一块
- 无法做好单元测试，逻辑依赖框架和外部系统

所以我是否可以理解为：

- **DDD** 主要是**建模和设计的理念**，解决“我们应该建什么样的系统”
- **六边形架构** 是一种**架构模式**，关注“我们如何组织代码结构以便更好地分离职责和依赖”

而 DDD 和六边形架构的结合则是因为六边形架构非常适合用于实现 DDD 提出的“领域模型”中的**应用层和领域层**，确保它们不依赖于基础设施层。
**DDD** 的思维方式适合进行模型抽象， 而 **六边形** 进行代码分层和依赖隔离。

## 一个订单系统中的 DDD 和六边形架构

### 订单模块建模（DDD 简化版）

我们用 DDD 的 **战术设计** 方式，建出一张概念模型图，包含常见的订单核心构件：

```markdown
订单模块（Order Context）
├── 📦 Entity：Order（订单）
│ └─ 状态：创建中、已支付、已发货、已取消...
│ └─ 属性：订单号、用户 ID、商品项、总价、地址、状态、创建时间等
├── 📦 Value Object：OrderItem（订单商品项）、Address（地址）
├── 📦 Domain Service：OrderService
│ └─ 业务逻辑：创建订单、支付订单、取消订单
├── 📦 Repository：OrderRepository（接口，提供持久化操作）
├── 📦 Application Service：OrderAppService
│ └─ 编排逻辑（协调仓储、领域服务、发消息）
├── 📦 Events（领域事件）：
│ └─ OrderCreatedEvent、OrderPaidEvent、OrderCancelledEvent
```

---

### 推荐目录结构（六边形架构 + 实际业务场景）

用 Java + Spring Boot 风格举例：

```markdown
┌────────────────────────────────┐
│ adapter │ <== API、Kafka、Client 适配器
├────────────────────────────────┤
│ application │ <== 应用服务、DTO、Mapper、用例编排
├────────────────────────────────┤
│ domain │ <== 核心模型、聚合、值对象、业务规则
├────────────────────────────────┤
│ infrastructure │ <== 数据库、Kafka、HTTP 实现、配置
└────────────────────────────────┘
```

---

```markdown
src/
├── adapter/
│ ├── api/ # REST API 入口
│ │ ├── controller/
│ │ │ └── OrderController.java
│ │ └── dto/
│ │ └── CreateOrderRequestDTO.java
│ │ └── OrderResponseDTO.java
│ │
│ ├── message/ # Kafka 消息监听
│ │ ├── listener/
│ │ │ └── OrderStatusEventListener.java
│ │ └── dto/
│ │ └── OrderStatusKafkaEventDTO.java
│ │
│ ├── client/ # 第三方系统调用的适配器
│ │ ├── ProductClient.java
│ │ └── dto/
│ │ └── ProductResponseDTO.java
│
├── application/
│ ├── service/ # 应用服务，用例处理器
│ │ └── OrderAppService.java
│ │ └── OrderStatusEventAppService.java
│ │
│ ├── dto/ # 应用层内部使用的输入输出 DTO
│ │ └── OrderKafkaEventToSend.java
│ │
│ ├── mapper/ # DTO/DO ↔ Domain 映射器
│ │ └── OrderMapper.java
│ │
│ └── event/ # 可选，用于统一处理领域事件/外部事件
│ └── OrderCreatedEvent.java
│
├── domain/
│ ├── model/
│ │ ├── Order.java # 聚合根
│ │ ├── OrderStatus.java # 枚举 + 行为
│ │ ├── OrderItem.java # 实体
│ │ └── vo/ # 值对象
│ │ └── Money.java
│ │ └── Address.java
│ │
│ ├── service/ # 领域服务（跨聚合行为）
│ │ └── OrderDomainService.java
│ │
│ └── repository/ # 仓储接口
│ └── OrderRepository.java
│
├── infrastructure/
│ ├── persistence/ # 数据库存储实现
│ │ ├── repository/ # 仓储接口实现
│ │ │ └── OrderRepositoryImpl.java
│ │ ├── model/ # 数据库存储对象
│ │ │ └── OrderDO.java
│ │ └── mapper/ # MyBatis/JPA 映射类
│ │ └── OrderDOMapper.xml
│ │
│ ├── kafka/ # Kafka producer 实现
│ │ └── OrderEventProducer.java
│ │
│ ├── client/ # 调用外部服务的实现类
│ │ └── ProductClientImpl.java
│ │
│ └── config/ # 配置类（Kafka、Client、Redis 等）
│ └── KafkaConfig.java
│
└── OrderServiceApplication.java # 启动类
```

---

### 典型调用流程示意（创建订单场景）

```markdown
用户 -> REST API (Controller)
-> OrderAppService（应用服务）
-> 调用 ProductClient 校验商品
-> 调用 OrderDomainService 创建订单对象
-> OrderRepository 保存订单
-> OrderProducer 发送 Kafka: OrderCreatedEvent
```

---

### 典型监听流程（支付成功）

```markdown
Kafka: PaymentSuccessEvent
-> PaymentListener（适配器层监听）
-> OrderAppService（应用服务）更新订单状态为“已支付”
-> OrderRepository 更新状态
-> OrderProducer 发送 OrderPaidEvent 通知发货模块
```

---

### ApplicationService vs DomainService vs Domain

**ApplicationService vs DomainService**

| 对比项            | OrderAppService          | OrderDomainService           |
| ----------------- | ------------------------ | ---------------------------- |
| 所在层            | 应用层                   | 领域层                       |
| 关注点            | 用例流程、编排           | 核心业务逻辑、规则           |
| 是否操作 DB/Kafka | 是（通过仓储、producer） | 否（纯业务，不依赖基础设施） |
| 是否调用外部服务  | 是                       | 否                           |
| 是否操作多个模型  | 是（组合多个领域对象）   | 通常只操作实体/值对象        |
| 是否单元可测试    | 是（需 mock 外部依赖）   | 是（天然易测）               |

**DomainService vs Domain**: 领域模型中的两种业务逻辑“落地点

**在很多实践中，会把业务逻辑直接放在 `Order` 这个领域对象（实体）里面，而不是建一个单独的 `OrderDomainService`**，

| 方式                                   | 描述                                                               | 示例                                                | 适用场景                      |
| -------------------------------------- | ------------------------------------------------------------------ | --------------------------------------------------- | ----------------------------- |
| ✅ 实体（如 `Order`）                  | 把**与自身强关联**的业务行为方法直接挂在对象上                     | `order.markAsPaid()`                                | 行为只与自己有关              |
| ✅ 领域服务（如 `OrderDomainService`） | 把**多个对象协作的逻辑**，或**不属于任何单一对象**的逻辑放在服务中 | `orderService.createOrder(user, product, quantity)` | 需要多个实体/值对象协作的业务 |

把逻辑放在 Order 实体中

- `Order` 是**业务的核心对象**，它本身就承载了生命周期、状态变更等逻辑
- 让 `Order` 拥有自己的行为是典型的“面向对象”的思路（数据 + 行为）
- 很多行为天然就是“订单”的动作，比如 `pay()`, `cancel()`, `ship()`，写在 `Order` 更自然

示例（更面向对象）：

```java
public class Order {
    private OrderStatus status;
    private BigDecimal totalPrice;

    public void pay() {
        if (status != OrderStatus.CREATED) {
            throw new IllegalStateException("不能支付当前状态的订单");
        }
        this.status = OrderStatus.PAID;
    }
}
```

**那什么时候才用 `OrderDomainService` 呢？**

🔸 当你发现逻辑开始变得“不属于某一个对象”时，就该考虑用领域服务了，比如：

1. **创建订单时要校验多个商品的价格和库存**（涉及 Product、User、Promotion 等）
2. **订单拆单**、**订单合并**这类跨订单的复杂业务
3. **用例中多个领域模型需要协作**完成某个目标（但不适合让某个模型承担全部逻辑）

示例（放不进 Order 也不属于 Product）：

```java
public class OrderDomainService {
    public Order createOrder(User user, List<Product> products) {
        // 复杂折扣逻辑、商品校验、会员等级处理等
        // 最终生成一个 Order 实体
    }
}
```

---

**实际项目中的建议**

| 情况                             | 建议做法                           |
| -------------------------------- | ---------------------------------- |
| 逻辑只影响一个实体               | 放进实体（如 Order）               |
| 逻辑涉及多个实体/外部协作        | 放进领域服务（OrderDomainService） |
| 逻辑是流程性、编排性的           | 放进应用服务（OrderAppService）    |
| 领域服务只有一两个方法、逻辑简单 | 可以不拆，直接放进实体或应用服务   |

## 它们的不足，以及改进方向

### 不足

- 设计应用成本高，学习较附加
- 初期项目容易过度设计
- 项目小，带来同样的处理复杂度

### 改进思路

| 方向                    | 解释                                                |
| ----------------------- | --------------------------------------------------- |
| 轻量 DDD                | 只使用 Entity + AppService + VO，不一定分割全套细节 |
| 渐进式分层              | 先分清适配器 / 应用层 / 领域，再考虑细节化          |
| Clean Architecture 融合 | 接口层依赖应用，应用依赖领域，实现引用分层路径      |
| 配合 EDA                | 通过 Kafka/事件解耦复杂应用组织                     |

---

## 总结

DDD + 六边形架构，本质是一套把环境和技术造成的复杂度进行隔离、实现重构性模型的思路。

它们本身适合部署于集成度高、复杂度高的中大型项目。

还是得经历非”DDD“或者六边形架构的项目，才能比较出它们的优劣在哪里，但是这确实是一套很成熟的设计思想。
