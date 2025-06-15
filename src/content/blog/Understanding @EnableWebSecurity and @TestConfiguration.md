---
title: Debugging Spring @TestConfiguration and @EnableWebSecurity in Tests
pubDate: 2025-05-16
description: Trying to understand spring component bean mechanism
tags: ["technical"]
---

## The Issue I Encountered

Recently, while writing a `@WebMvcTest` for a Spring Boot application, I encountered an unexpected error:

```
Caused by: org.springframework.beans.factory.NoSuchBeanDefinitionException: No qualifying bean of type 'MyRepository' available: expected at least 1 bean which qualifies as autowire candidate.
```

This error appeared even though I had a `@TestConfiguration` and a custom filter (`TestFilter`) defined in my test setup.

### Initial Setup: Test Configuration and Custom Filter

- I had a `@TestConfiguration` class (`TestSecurityConfig`) that enabled Web Security using `@EnableWebSecurity`.
- This configuration defined a custom `SecurityFilterChain` that included a `TestFilter`:

```kotlin
@TestConfiguration
@EnableWebSecurity
class TestSecurityConfig {
    @Bean("testWebSecurityFilterChain")
    fun webSecurityFilterChain(http: HttpSecurity, testFilter: TestFilter): SecurityFilterChain? = http
        .authorizeHttpRequests { it.anyRequest().permitAll() }
        .csrf { it.disable() }
        .addFilterBefore(testFilter, AuthorizationFilter::class.java)
        .build()
}
@Component
class TestFilter(private val myRepository: MyRepository) : OncePerRequestFilter() {
    override fun doFilterInternal(request: HttpServletRequest, response: HttpServletResponse, filterChain: FilterChain) {
        // my logic here
        filterChain.doFilter(request, response)
    }
}
```

## Further Exploration: What Happens If We Remove `@EnableWebSecurity`?

- If I remove `@EnableWebSecurity`, the error will not occur again unless I manually import this configuration.
- This is because without `@EnableWebSecurity`, the `SecurityFilterChain` is not automatically triggered, and `TestFilter` is not included in the context.
- This demonstrates that the `@EnableWebSecurity` annotation is the trigger that causes Spring to automatically include any registered security filter beans.

## The Core Insight: Why This Happened

1. `@EnableWebSecurity` automatically triggers the security filter chain, and the custom `SecurityFilterChain` tries to use `TestFilter`.
2. `TestFilter` is a `@Component`, so it is automatically registered.
3. The test context does not include `MyRepository`, making `TestFilter` fail due to missing dependency.

## The Correct Way to Write Test Configurations and Bean Definitions

- Define `TestFilter` as a bean directly in the `@TestConfiguration` rather than as a `@Component`.
- This makes it a test-specific bean, only existing in the test context.

```
@TestConfiguration
@EnableWebSecurity
class TestSecurityConfig {
    @Bean("testWebSecurityFilterChain")
    fun webSecurityFilterChain(http: HttpSecurity, testFilter: TestFilter): SecurityFilterChain? = http
        .authorizeHttpRequests { it.anyRequest().permitAll() }
        .csrf { it.disable() }
        .addFilterBefore(testFilter, AuthorizationFilter::class.java)
        .build()
    @Bean
    fun testFilter(myRepository: MyRepository): TestFilter {
        return TestFilter(myRepository)
    }
}
// TestFilter is a plain class, not a component
class TestFilter(private val myRepository: MyRepository) : OncePerRequestFilter() {
    override fun doFilterInternal(request: HttpServletRequest, response: HttpServletResponse, filterChain: FilterChain) {
        // my logic here
        filterChain.doFilter(request, response)
    }
}
```

## Best Practice: Using `@TestConfiguration` and `@Import`

- Always use `@TestConfiguration` for test-specific beans and configurations.
- Register beans inside `@TestConfiguration` instead of using `@Component` to avoid accidental registration in other contexts.
- Remember that beans inside `@TestConfiguration` will not be registered unless you manually `@Import` this configuration in your test class.
- This approach provides complete isolation and control over your test context.

## Key Takeaways

- Avoid using `@Component` for test-specific beans because they may cause unexpected registration.
- Always define test beans inside `@TestConfiguration` for clear isolation.
- If `@EnableWebSecurity` is present, the security filter chain will automatically try to find and register any filters, including `TestFilter`.
- If `@EnableWebSecurity` is removed, the security filter chain is not activated, and `TestFilter` will not be automatically registered.
- Beans inside `@TestConfiguration` are not registered unless you explicitly import this configuration using
