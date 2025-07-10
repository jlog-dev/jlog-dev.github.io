

##  Why I Wrote This Post

As a Spring developer working on internationalization (i18n), I’ve repeatedly come across the class `ReloadableResourceBundleMessageSource`. It’s widely used and often recommended, yet its behavior — particularly how it loads resources, how it handles locales, and how it refreshes properties — is poorly understood.

This post explores what `ReloadableResourceBundleMessageSource` really does under the hood, what kinds of resource locations it supports, how it handles caching and locale resolution, and what its limitations are. I also address some common misuses — such as trying to load dynamic HTTP-based content — and offer practical guidance on where it fits well, and where it doesn’t.

---

## What This Post Answers

- What exactly is `ReloadableResourceBundleMessageSource`, and what problem does it solve?
    
- How does it differ from other `MessageSource` implementations in Spring?
    
- What types of resource paths (e.g. classpath, file, HTTP) does it support?
    
- How does Spring resolve locale-specific message files?
    
- How does caching and reloading work?
    
- Can it be used to load `.properties` files over HTTP? (Spoiler: yes, but it’s tricky)
    

---

##  What is `ReloadableResourceBundleMessageSource`?

`ReloadableResourceBundleMessageSource` is a Spring Framework implementation of the `MessageSource` interface, primarily used to support **internationalization (i18n)** by loading message bundles (usually `.properties` files) from one or more resource locations.

It is designed to:

- Load messages based on locale (e.g. `messages.properties`, `messages_de.properties`)
    
- Allow multiple base names
    
- Refresh the properties at runtime at configurable intervals
    
- Support fallback to default locales
    

It is an advanced alternative to `ResourceBundleMessageSource`, with the added benefit of **hot reloading** during application runtime.

---

##  Typical Use Cases

You use `ReloadableResourceBundleMessageSource` when:

- You want to load translation files from the classpath or filesystem
    
- You want the ability to modify translation files without restarting the application
    
- You support multiple languages and locales
    
- You need dynamic fallback behavior for missing keys
    

### Example Setup in Java or Kotlin

```kotlin
val messageSource = ReloadableResourceBundleMessageSource()
messageSource.setBasenames("classpath:messages", "file:/opt/app/config/messages")
messageSource.setDefaultEncoding("UTF-8")
messageSource.setCacheSeconds(3600)
```

### Usage

```kotlin
val greeting = messageSource.getMessage("welcome.message", null, Locale.GERMANY)
```

---

##  How It Resolves Locale-Specific Files

Given a basename like `messages`, and a locale `de_DE`, Spring will try to load the following files in order:

```
messages_de_DE.properties
messages_de.properties
messages.properties
```

These files are merged in order, so keys in more specific files override those in more general ones.

---

## How Reloading Works

The `cacheSeconds` property determines how frequently Spring checks the file for changes. A value of:

- `-1` means cache forever (never reload)
    
- `0` means no caching (always reload)
    
- Positive number = seconds between refresh checks
    

This is ideal for scenarios where translation files may change at runtime (e.g. in dev or staging environments).

---

## Can It Load Resources Over HTTP?

### Technically: **Yes**

You can pass an HTTP URL as a base name:

```kotlin
messageSource.setBasenames("http://translation-service/messages")
```

Spring will then try to load:

```
http://translation-service/messages_de.properties
http://translation-service/messages.properties
```

### But Beware:

- Spring first sends a `HEAD` request to check if the file exists
    
- It only proceeds with a `GET` request if the `HEAD` succeeds
    
- The response must be a valid `.properties` file with MIME type `text/plain` and charset `ISO-8859-1`
    
- If the response is JSON, or if any network issue occurs, Spring silently fails and falls back to the next basename (or throws an error)
    

This makes HTTP-based loading **fragile** and not officially recommended for dynamic translation APIs.

---

## ⚠️ Limitations and Gotchas

|Aspect|Limitation|
|---|---|
|Resource types|Only static `.properties` files — no JSON or XML|
|Encoding|Must be ISO-8859-1 unless you override the `PropertiesPersister`|
|HTTP support|Works only if response format matches `.properties` expectations|
|Logging|Fallback behavior is silent by default — debugging can be tricky|
|Spring Boot support|Spring Boot auto-configures `MessageSource`, so if you use your own, be sure to override it properly|

---

## When Should You Use It?

| Use case                                               | Should you use it?                         |
| ------------------------------------------------------ | ------------------------------------------ |
| Loading translations from classpath                    | ✅ Yes                                      |
| Loading `.properties` from disk with hot reload        | ✅ Yes                                      |
| Centralized translation service (HTTP)                 | ⚠️ Use with caution                        |
| Loading dynamic translations from database or JSON API | ❌ No — use a custom message source instead |

---

##  Final Thoughts

`ReloadableResourceBundleMessageSource` is a powerful and convenient tool when used as designed — for managing `.properties`-based translations with locale-aware fallback and reloadable behavior.

However, if you try to stretch it into loading dynamic HTTP endpoints, JSON content, or databases, you’re likely to hit hidden complexity.

> Understand what it is, what it was designed for, and stay within those boundaries — or extend it carefully if your use case requires.
