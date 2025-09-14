---
title: Search API Optimization
description: 查询API的优化
pubDate: 2025-04-24
tags: ["technical"]
---

## 1. Problem Context

We are building a REST API to support complex search functionality with the following requirements:

- Joins across **6 tables**
- Selection of **10 fields** from those joins
- Filtering via **7 criteria** (e.g., `person_id`, `is_active`, date range)
- Support for **5 full-text search fields**
- Pagination (**10 results per page**)
- Dynamic sorting across multiple fields and directions

The dataset can span **several thousand rows**, and performance, maintainability, and clarity are key concerns.

---

## 2. The Initial Issue

As the complexity of filters and joins grew, the SQL powering the search became long and difficult to manage. The SQL was responsible for:

- Joining all relevant tables
- Applying optional filters
- Dynamically applying full-text search to selected fields only
- Supporting flexible pagination and sorting logic

This led to concerns around:

- **Query readability and maintainability**
- **Performance degradation** with increasing filters and rows
- **Safety and security** in dynamic sorting or user-defined inputs

---

## 3. Final SQL with Dynamic Sorting and Full-Text Search

```sql
SELECT
    p.id AS person_id,
    p.name,
    p.is_active,
    p.created_at,
    a.city,
    e.job_title,
    ed.degree,
    t.tag_text,
    n.note_text,
    n.created_at AS note_created_at
FROM person p
LEFT JOIN address a ON a.person_id = p.id
LEFT JOIN employment e ON e.person_id = p.id
LEFT JOIN education ed ON ed.person_id = p.id
LEFT JOIN tags t ON t.person_id = p.id
LEFT JOIN notes n ON n.person_id = p.id
WHERE 1 = 1
  AND (:personId IS NULL OR p.id = :personId)
  AND (:isActive IS NULL OR p.is_active = :isActive)
  AND (:startDate IS NULL OR p.created_at >= :startDate)
  AND (:endDate IS NULL OR p.created_at <= :endDate)
  AND (:nameSearch IS NULL OR to_tsvector('english', p.name) @@ plainto_tsquery('english', :nameSearch))
  AND (:jobTitleSearch IS NULL OR to_tsvector('english', e.job_title) @@ plainto_tsquery('english', :jobTitleSearch))
  AND (:degreeSearch IS NULL OR to_tsvector('english', ed.degree) @@ plainto_tsquery('english', :degreeSearch))
  AND (:tagSearch IS NULL OR to_tsvector('english', t.tag_text) @@ plainto_tsquery('english', :tagSearch))
  AND (:noteSearch IS NULL OR to_tsvector('english', n.note_text) @@ plainto_tsquery('english', :noteSearch))
ORDER BY
    CASE WHEN :sortField = 'name' AND :direction = 'ASC' THEN p.name END ASC NULL LAST,
    CASE WHEN :sortField = 'name' AND :direction = 'DESC' THEN p.name END,
    CASE WHEN :sortField = 'created_at' AND :direction = 'ASC' THEN p.created_at END ASC NULL LAST,
    CASE WHEN :sortField = 'created_at' AND :direction = 'DESC' THEN p.created_at END,
    CASE WHEN :sortField = 'city' AND :direction = 'DESC' THEN a.city END,
    CASE WHEN :sortField = 'city' AND :direction = 'ASC' THEN a.city END ASC NULL LAST
LIMIT :pageSize
OFFSET (:pageNumber - 1) * :pageSize;
```

---

## 4. Why We Use Backend Pagination

Pagination is handled in the backend because:

- Transferring thousands of rows to the frontend is **inefficient and slow**
- Backend can apply **authorization and visibility filters**
- SQL engines optimize `LIMIT/OFFSET` or `keyset` pagination very well

Alternative: **Keyset pagination** is more efficient for large pages, using value-based conditions instead of OFFSET.

---

## 5. What is GIN and Why Use It?

GIN (Generalized Inverted Index) is essential for fast full-text search in PostgreSQL.

- It allows fast lookup of text terms in `to_tsvector()` outputs
- You can index fields like:

```sql
CREATE INDEX idx_name_tsv ON person USING GIN(to_tsvector('english', name));
```

- Dramatically improves performance for `@@ plainto_tsquery(...)` queries

---

## 6. Spring Boot Developer Perspective: Integration & Optimization

### 6.1 DTO and Parameter Mapping

```kotlin
data class SearchInputs(
    val nameSearch: String? = null,
    val jobTitleSearch: String? = null,
    val degreeSearch: String? = null,
    val tagSearch: String? = null,
    val noteSearch: String? = null,
    val sortField: String,
    val direction: String,
    val pageSize: Int,
    val pageNumber: Int
)
```

Map your query parameters into the appropriate fields based on frontend flags:

```kotlin
val nameSearch = if (searchInName) search else null
```

### 6.2 Native Query Example (Spring Data JPA)

```kotlin
@Query(nativeQuery = true, value = """
    -- insert the SQL from section 3 here
""")
fun searchWithFullText(...): List<PersonSearchResult>
```

### 6.3 Optimization Advice

#### ✅ Use native SQL for complex search if JPA falls short

JPA's abstraction is great for simple queries, but it becomes unwieldy for:

- Multiple joins
- Dynamic filters
- Full-text search

Native SQL gives you full control over performance and clarity. Keep native queries in a separate `@Repository` or use a dedicated interface for maintainability.

#### ✅ Wrap reusable join logic in a database view

If the same join pattern is reused in multiple places, consider creating a database view:

```sql
CREATE VIEW person_search_view AS
SELECT ... FROM person p
LEFT JOIN ...
```

This simplifies query logic and enables more consistent maintenance.

**But what about data freshness?**

- **Views** in PostgreSQL (or other relational DBs) are **not cached** by default. When you query a view, it runs the underlying query on **live data**, so changes are immediately visible in your search results.
- If you use a **materialized view** (for better performance), then it becomes a snapshot and must be **refreshed manually or on a schedule**:

```sql
REFRESH MATERIALIZED VIEW person_search_view;
```

Only use materialized views if your data doesn't change often and query performance is more critical than real-time accuracy.

**Should you use a trigger?** PostgreSQL **does not support automatic triggers on materialized views**. However, there are workarounds:

- **Option 1: Scheduled Refresh** Use a background job (e.g., cron or Spring Scheduler) to refresh the materialized view at intervals.
- **Option 2: Trigger-like Logging** Add triggers to the base tables (`person`, `employment`, etc.) that log changes to a separate table. Then periodically check this log to decide whether to refresh the view.
- **Option 3: Avoid Materialized Views for Real-Time Needs** If real-time accuracy is critical, stick to **regular views**.

**Summary:**

- Use **regular views** for live, always-up-to-date results.
- Use **materialized views** only if you prioritize performance and the data is relatively static.
- Use **logging triggers + scheduled jobs** if you need to simulate automatic updates.

#### ✅ Pre-index full-text fields with GIN

Full-text search on large text columns can be slow without indexing. Use PostgreSQL’s GIN index:

```sql
CREATE INDEX idx_name_tsv ON person USING GIN(to_tsvector('english', name));
```

This enables efficient `@@ plainto_tsquery(...)` lookups even on large datasets.

#### ✅ Validate sort fields and direction in code (avoid SQL injection)

Never interpolate sort fields directly from user input. Instead, map them:

```kotlin
val allowedSortFields = mapOf("name" to "p.name", "created_at" to "p.created_at")
val sortField = allowedSortFields[clientSort] ?: error("Invalid sort")
```

This ensures only known, safe fields are passed into the SQL.

#### ✅ Use keyset pagination if OFFSET becomes a bottleneck

OFFSET performance degrades with high page numbers because the database must scan and skip rows. Keyset pagination avoids this:

```sql
WHERE p.created_at < :lastSeenDate
ORDER BY p.created_at DESC
LIMIT 10
```

This is especially useful in real-time UIs like activity feeds.

#### ✅ Consider a search service layer to compose SQL fragments conditionally

If filters are user-defined or modular (e.g., role-based views), it's better to dynamically construct SQL:

- Use `StringBuilder` or Kotlin DSL for building queries
- Modularize joins and filters
- Improves maintainability and testability

---

## 7. When to Refactor

- If the SQL grows beyond 100+ lines
- If the same join structure is reused in multiple queries
- If filter logic starts branching significantly based on user roles or query modes

💡 **Also consider refactoring when data consistency, performance, or reusability becomes hard to manage**:

> When you see a long, complex SQL query — with joins, filters, full-text search, sorting, and pagination — it's smart to pause and ask: **Should this all live in one query, or should we split it?**

This type of architectural thinking improves maintainability and aligns with best practices in SQL optimization and API design.

- If the same join structure is reused in multiple queries
- If filter logic starts branching significantly based on user roles or query modes

Consider modular SQL or a dynamic builder like **QueryDSL** or **Kotlin Exposed DSL** if flexibility is needed.

---

## 8. Conclusion

What started as a simple search evolved into a complex query due to user-driven flexibility, full-text search, and performance requirements. By moving the complexity into the backend, using proper SQL indexing, full-text search tools, and Spring Boot-native mapping strategies, we can keep the system clean, fast, and maintainable.
