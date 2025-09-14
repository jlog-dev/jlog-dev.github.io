---
title: 数据模型分层思考和实践：从 DTO、DO 到 Domain 和 VO
description: 第n遍关于数据模型的总结和思考
pubDate: 2025-04-20
tags: ["technical"]
---

## 问题引入

在项目实践中，我遇到了两类典型的业务流程：

- 第一类是主动调用链：  
   **API 请求 → 业务逻辑处理 → 调用第三方服务 → 持久化数据库 → 发送消息通知**
- 第二类是被动事件链：  
   **监听 Kafka 消息 → 消息处理（包括数据转换与入库）→ 再次发送消息**

这两条流程看似清晰，但随着系统复杂度的提升，**交互过程中所涉及的数据模型也越来越多**：
有些是用来接收接口参数的，有些用于存储数据库，有些用于内部逻辑运算，还有一些则是 Kafka 消息体……久而久之，开始面临这样的问题：

> ❓ 这些数据模型应该怎么定义？  
> ❓ 它们为什么会不断“长出来”？  
> ❓ 到底什么才是“业务模型”？  
> ❓ 模型越来越多是复杂化，还是必要的分工？

这些问题逐渐暴露出项目在**模型职责划分**上的模糊，也引发了我对数据模型分层设计的深入思考。
本文主要分为几部分，第一是目前主流的四种数据模型，它们的含义是什么；以及如何随着项目演化引入不同的数据模型，这些数据模型如何和六边形代码架构（项目上目前使用的）结合，模型之间的转换是怎样的？

---

## 四种数据模型分别是什么

| 类型             | 全称                             | 主要作用                                             | 典型位置                             | 是否含业务逻辑    |
| ---------------- | -------------------------------- | ---------------------------------------------------- | ------------------------------------ | ----------------- |
| **DTO**          | Data Transfer Object             | 用于**接口之间传输数据**（API、Kafka、前端）         | `controller/dto` / `application/dto` | ❌ 没有           |
| **Domain Model** | 领域模型                         | 表示**业务中的核心概念和行为**（有生命周期、有规则） | `domain/model`                       | ✅ 有             |
| **DO / PO**      | Data Object / Persistence Object | 映射数据库表的结构，用于**持久化**                   | `infrastructure/persistence/model`   | ❌ 没有           |
| **VO**           | Value Object                     | 表示业务中的**不可变值概念**，比如金额、地址         | `domain/model/vo`                    | ✅ 有轻量业务规则 |

以一个下订单的场景为例，它们对应的分别是：

| 类别            | 示例                                                        |
| --------------- | ----------------------------------------------------------- |
| **DTO（请求）** | `CreateOrderRequestDTO`：`{ userId, productId, quantity }`  |
| **Domain**      | `Order`：有 `create()`, `pay()`, `cancel()` 方法            |
| **DO**          | `OrderDO`：数据库字段 `{ id, user_id, status, created_at }` |
| **VO**          | `Money`：表示金额，禁止为负，封装 `add`, `subtract` 方法    |

## 不是所有模型都是必要的

在实际的经验中，我的上一个项目不涉及接收和转发消息，但是有复杂的业务逻辑而引入了 VO，现在的项目业务逻辑简单，但是和外部交互频繁，所以我开始思考，哪些模型是必要的，在什么情况下我们会觉得是时候引入下一个数据模型了呢？

### 🟢 **阶段 1：轻量项目（纯增删改查、小系统）**

- **保留 DTO 和 DO 就够了**
- 业务逻辑非常简单，不需要复杂建模
- Domain 直接省略，Service 调用 Repository 就行

✅ 示例：

```java
OrderController -> OrderService -> OrderRepository -> OrderDO
```

---

### 🟡 **阶段 2：业务开始复杂（如订单有状态，规则越来越多）**

- ✅ **引入 Domain 模型**
  - 把业务行为抽象到 `Order` 实体中（如 `order.pay()`）
- ❌ DO 不该参与业务决策
- DTO 仍然保留用于接口通信

🔁 转换：DTO ↔ Domain ↔ DO

---

### 🟠 **阶段 3：模型之间存在“值对象”语义**

- ✅ **引入 VO**
  - 比如金额、地址、用户名、折扣等都可以是 VO
  - 它们不可变、自包含逻辑，如 `Money.of(100)`，`discount.apply(money)`

---

### 🔴 **阶段 4：系统开始走向分布式（微服务、Kafka、异步事件）**

- ✅ DTO 分化为：
  - API DTO（给前端）
  - Kafka DTO（消息通信）
  - 远程服务请求体（Client DTO）
- ✅ Domain 和 Application 之间明确隔离，Mapper 工具出现
- ✅ 各种转换 Mapper 层变成刚需

---

### 所以到底该何时“加一层”？

| 现象                                             | 应该引入                              |
| ------------------------------------------------ | ------------------------------------- |
| 你开始判断“业务是否允许操作”                     | ✅ 引入 Domain                        |
| 同一段业务逻辑在多个地方写了                     | ✅ 抽成 Domain 方法或 Domain Service  |
| 某个字段有不可变逻辑，比如金额不能为负           | ✅ 引入 VO                            |
| 接口数据和内部逻辑字段不同（多余/缺失/单位不同） | ✅ 保持 DTO ↔ Domain 分离             |
| DB 结构和业务模型不一致（如字段冗余）            | ✅ 保持 Domain ↔ DO 分离              |
| 要支持异步消息、远程服务                         | ✅ 分清输入/输出 DTO，统一转换 Mapper |

---

## 对应的代码结构

如果在一个系统中同时涉及：

> - **API 接口**
> - **Kafka 消息接收 & 发送**
> - **调用第三方服务（Client）**
> - **存储数据库（DO）**
> - **内部业务建模（Domain + VO）**

那**整体包结构**（分层 + 模块）该怎么设计，才能职责清晰、好扩展、可维护？

### 总体分层思想（对应六边形架构）

用 **DDD + 六边形架构** 来组织：

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

### 完整包结构示例

```text
src/
├── adapter/
│   ├── api/                             # REST API 入口
│   │   ├── controller/
│   │   │   └── OrderController.java
│   │   └── dto/
│   │       └── CreateOrderRequestDTO.java
│   │       └── OrderResponseDTO.java
│   │
│   ├── message/                         # Kafka 消息监听
│   │   ├── listener/
│   │   │   └── OrderStatusEventListener.java
│   │   └── dto/
│   │       └── OrderStatusKafkaEventDTO.java
│   │
│   ├── client/                          # 第三方系统调用的适配器
│   │   ├── ProductClient.java
│   │   └── dto/
│   │       └── ProductResponseDTO.java
│
├── application/
│   ├── service/                         # 应用服务，用例处理器
│   │   └── OrderAppService.java
│   │   └── OrderStatusEventAppService.java
│   │
│   ├── dto/                             # 应用层内部使用的输入输出 DTO
│   │   └── OrderKafkaEventToSend.java
│   │
│   ├── mapper/                          # DTO/DO ↔ Domain 映射器
│   │   └── OrderMapper.java
│   │
│   └── event/                           # 可选，用于统一处理领域事件/外部事件
│       └── OrderCreatedEvent.java
│
├── domain/
│   ├── model/
│   │   ├── Order.java                   # 聚合根
│   │   ├── OrderStatus.java            # 枚举 + 行为
│   │   ├── OrderItem.java              # 实体
│   │   └── vo/                         # 值对象
│   │       └── Money.java
│   │       └── Address.java
│   │
│   ├── service/                         # 领域服务（跨聚合行为）
│   │   └── OrderDomainService.java
│   │
│   └── repository/                      # 仓储接口
│       └── OrderRepository.java
│
├── infrastructure/
│   ├── persistence/                     # 数据库存储实现
│   │   ├── repository/                  # 仓储接口实现
│   │   │   └── OrderRepositoryImpl.java
│   │   ├── model/                       # 数据库存储对象
│   │   │   └── OrderDO.java
│   │   └── mapper/                      # MyBatis/JPA 映射类
│   │       └── OrderDOMapper.xml
│   │
│   ├── kafka/                           # Kafka producer 实现
│   │   └── OrderEventProducer.java
│   │
│   ├── client/                          # 调用外部服务的实现类
│   │   └── ProductClientImpl.java
│   │
│   └── config/                          # 配置类（Kafka、Client、Redis等）
│       └── KafkaConfig.java
│
└── OrderServiceApplication.java         # 启动类
```

---

### 模块职责解读

| 包名                         | 职责                          | 说明                               |
| ---------------------------- | ----------------------------- | ---------------------------------- |
| `adapter/api/controller`     | 对接 REST API                 | 接收前端请求，调用 AppService      |
| `adapter/message/listener`   | Kafka 消息消费                | 接收事件，转 DTO，调用 AppService  |
| `adapter/client`             | 外部系统接口适配              | 转换外部返回结构，防止污染内部     |
| `application/service`        | 用例逻辑编排                  | 编排业务逻辑，不做业务判断         |
| `application/dto`            | 应用输入/输出数据结构         | 与外部隔离，供 AppService 使用     |
| `application/mapper`         | DTO/DO ↔ Domain 转换          | 实现数据模型之间的桥梁             |
| `domain/model`               | 核心业务模型                  | 聚合、实体、值对象、业务方法       |
| `domain/service`             | 跨聚合业务逻辑                | 比如订单金额结算等                 |
| `infrastructure/persistence` | DO / RepositoryImpl / MyBatis | 数据库相关实现                     |
| `infrastructure/kafka`       | Kafka producer 实现           | 发出 Kafka 消息                    |
| `infrastructure/client`      | 第三方调用封装                | 可换实现（如 Feign、RestTemplate） |

---

## 模型转换的最佳实践

那么关于

> ❶ DTO ↔ Domain  
> ❷ Domain ↔ DO  
> ❸ Domain ↔ Kafka 发出的消息 DTO

之间的相互转换是怎么做的呢？
引入 **Mapper 类** 并放在 `application/mapper` 中。
原因在于：

1. **转换操作是“上下层之间的桥梁”**，它本身并不属于业务，也不属于数据库或技术基础设施；
2. **application 层最适合承担“编排、组装、转换”的职责**，它依赖上下两层却不被反依赖。

为什么不把 `toDomain()`、`fromDO()` 写在 DTO、DO、Domain 本身中？

1. ❌ 破坏**职责单一原则（SRP）**

- DTO 的职责是：**传输数据**
- DO 的职责是：**数据库映射**
- Domain 的职责是：**业务行为建模**

⚠️ 一旦你把 `toDomain()`、`fromDO()` 放进去，它们就不再只做自己的事了，还做了**转换逻辑**。

> **转换是一种“编排逻辑”**，应该由 Mapper 组件来承担，而不是让每个类自己干。

---

2.  ❌ 引入**双向依赖，耦合上层和下层**

举例：

- 如果你在 DTO 里写 `toDomain()`，那它必须 **依赖 Domain 层**
- 如果你在 DO 里写 `toDomain()`，那它必须 **依赖 Domain 层**
- 如果你在 Domain 里写 `fromDO()`，那它必须 **依赖 DO / DTO 层**

这就违反了 **六边形架构/整洁架构的依赖倒置原则** —— 内层（Domain）不应该依赖外层（DTO、DO）

```text
DTO  →  Domain  ❌     (DTO 层依赖 Domain，不利于解耦)
DO   →  Domain  ❌     (基础设施层依赖领域模型，不可测)
Domain → DO/DTO ❌     (业务模型不应该知道技术实现)
```

---

3. ❌ 不利于测试和维护

- 你想测转换逻辑，得引入整个 DTO 或 DO
- 如果业务模型变化，DTO 也要同步改（即使只是字段不相关）

⚠️ 直接写在类里，容易形成“神类”，它啥都知道、啥都管

## 思考总结

- 比起是什么，我更好奇为什么。
- 软件设计的结构演进成现在这个样子，一定是很多的经验教训积累起来的，可惜我的项目经验还是太少，或许等我到了一个不这么做的环境，体验到了更多的痛点，我才能更深切地体会这么做的好处。
- 软件设计世界的实践，不管是 DDD 思想方法还是六边形的架构设计，其实都是一种思维方式，我们在现实生活中已经这么做了，只是把它平移到计算机的世界里。
- 在实际的项目经验中并没有完全遵循这样的架构设计，尽管业务本身复杂，但是有时候也会发现转换没必要，所以还是根据实际经验来吧，适合项目的设计就是好设计。
