---
title: "SpringBoot Email Sending with @Async Optimization"
published: 2026-07-23
description: "Integrate email sending in Spring Boot, implement async email with @Async, and troubleshoot common @Async pitfalls."
tags: [SpringBoot, Email, Async]
category: Java
lang: "en"
---

# SpringBoot Email Sending with @Async Optimization

## Basic Configuration

### 1. Add the Dependency

```xml
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-mail</artifactId>
</dependency>
```

### 2. Configure Mail Properties

```yaml
spring:
  mail:
    username: your-email@example.com
    password: your-auth-code
    host: smtp.163.com
```

> The password field requires an **authorization code**, not your email login password. For 163 mail, enable POP3/SMTP/IMAP in settings and generate an auth code.

### 3. Send a Simple Email

```java
@RestController
@RequiredArgsConstructor
public class EmailController {

    private final JavaMailSender javaMailSender;

    @GetMapping("/send-email")
    public String sendEmail(String email) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom("your-name<your-email@example.com>");
        message.setTo(email);
        message.setSubject("Verification Code");
        message.setText("Your code is: 123456");
        javaMailSender.send(message);
        return "ok";
    }
}
```

## Async Sending with @Async

Synchronous email sending blocks the request thread. For high-concurrency scenarios, async is recommended.

### 1. Enable Async Support

```java
@SpringBootApplication
@EnableAsync
public class Application {
    public static void main(String[] args) {
        SpringApplication.run(Application.class, args);
    }
}
```

### 2. Async Email Service

```java
@Component
@Slf4j
public class EmailService {

    @Autowired
    private JavaMailSender javaMailSender;

    @Autowired
    private StringRedisTemplate stringRedisTemplate;

    @Async
    public void sendVerificationCode(String email) {
        String code = UUID.randomUUID().toString().substring(0, 6);
        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom("your-name<your-email@example.com>");
        message.setTo(email);
        message.setSubject("Verification Code");
        message.setText(code);

        stringRedisTemplate.boundValueOps("code:" + email)
            .set(code, 5, TimeUnit.MINUTES);
        javaMailSender.send(message);
        log.info("Verification code sent to: {}", email);
    }
}
```

### 3. Custom Thread Pool

The default async thread pool has a core pool size of 8. Adjust it as needed:

```yaml
spring:
  task:
    execution:
      pool:
        core-size: 50
```

Or via Java configuration:

```java
@Bean
public ThreadPoolTaskExecutor threadPoolExecutor() {
    ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();
    executor.setCorePoolSize(20);
    executor.setMaxPoolSize(50);
    executor.setQueueCapacity(200);
    executor.setThreadNamePrefix("mail-executor-");
    executor.initialize();
    return executor;
}
```

## Common @Async Pitfalls

`@Async` won't work in these cases:

1. The method is not `public`
2. Return type is not `void` or `Future`
3. The method is `static`
4. Spring cannot scan the class (missing `@Component`/`@Service` etc.)
5. **Caller and callee are in the same class** — Spring AOP proxies can't intercept internal calls
6. Creating the object with `new` instead of dependency injection
7. Adding `@Transactional` directly on an `@Async` method — put `@Transactional` on the called method instead

> Reference: https://blog.csdn.net/u011413452/article/details/124844941
