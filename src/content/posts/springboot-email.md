---
title: SpringBoot 邮件发送与异步优化
published: 2026-07-23
description: "Spring Boot 集成邮件发送，以及使用 @Async 实现异步邮件发送，并附 @Async 失效的常见原因排查清单。"
tags: [SpringBoot, 邮件, 异步]
category: Java
---

# SpringBoot 邮件发送与异步优化

## 基础配置

### 1. 引入依赖

```xml
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-mail</artifactId>
</dependency>
```

### 2. 配置邮箱参数

```yaml
spring:
  mail:
    username: your-email@example.com
    password: your-auth-code
    host: smtp.163.com
```

> 密码处填写的是邮箱的 **授权码**，不是邮箱登录密码。以 163 邮箱为例，需要在设置 → POP3/SMTP/IMAP 中开启服务并获取授权码。

### 3. 发送简单邮件

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
        message.setSubject("验证码");
        message.setText("您的验证码是：123456");
        javaMailSender.send(message);
        return "ok";
    }
}
```

## 使用 @Async 实现异步发送

同步发送邮件会阻塞请求线程，高并发场景下推荐异步化。

### 1. 开启异步支持

```java
@SpringBootApplication
@EnableAsync
public class Application {
    public static void main(String[] args) {
        SpringApplication.run(Application.class, args);
    }
}
```

### 2. 异步发送服务

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
        message.setSubject("验证码");
        message.setText(code);

        stringRedisTemplate.boundValueOps("code:" + email)
            .set(code, 5, TimeUnit.MINUTES);
        javaMailSender.send(message);
        log.info("Verification code sent to: {}", email);
    }
}
```

### 3. 自定义线程池

默认的异步线程池核心线程数为 8，可根据业务调整：

```yaml
spring:
  task:
    execution:
      pool:
        core-size: 50
```

或通过 Java 配置：

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

## @Async 失效的常见原因

使用 `@Async` 时，以下情况会导致注解失效：

1. 方法不是 `public` 的
2. 返回值不是 `void` 或 `Future`
3. 方法使用 `static` 修饰
4. Spring 扫描不到类（缺少 `@Component`/`@Service` 等注解）
5. **调用方与被调用方在同一个类中**（Spring AOP 代理无法拦截内部调用）
6. 通过 `new` 手动创建对象，而非依赖注入
7. 在 `@Async` 方法上直接加 `@Transactional` 无效——应在被调用的方法上加

> 参考：https://blog.csdn.net/u011413452/article/details/124844941
