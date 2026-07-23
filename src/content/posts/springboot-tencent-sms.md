---
title: SpringBoot 调用腾讯云 API 发送短信
published: 2026-07-23
description: 从原始 API 调试到封装为 Spring Boot 工具类的渐进式实践，包含配置属性绑定和静态工具类设计。
tags: [SpringBoot, 腾讯云, 短信, SMS]
category: Java
---

# SpringBoot 调用腾讯云 API 发送短信

## 第一步：申请短信服务

打开腾讯云控制台，申请短信应用、签名与模板。

## 第二步：API 调试

在 [腾讯云 API Explorer](https://console.cloud.tencent.com/api/explorer?Product=sms) 页面可以快速生成调用代码。

### 导入依赖

```xml
<dependency>
    <groupId>com.tencentcloudapi</groupId>
    <artifactId>tencentcloud-sdk-java</artifactId>
    <version>3.1.838</version>
</dependency>
```

### 原始调用代码

```java
public class SendSms {
    public static void main(String[] args) {
        try {
            Credential cred = new Credential("SecretId", "SecretKey");
            HttpProfile httpProfile = new HttpProfile();
            httpProfile.setEndpoint("sms.tencentcloudapi.com");

            ClientProfile clientProfile = new ClientProfile();
            clientProfile.setHttpProfile(httpProfile);

            SmsClient client = new SmsClient(cred, "ap-beijing", clientProfile);

            SendSmsRequest req = new SendSmsRequest();
            String[] phoneNumberSet1 = {"your-phone-number"};
            req.setPhoneNumberSet(phoneNumberSet1);
            req.setSmsSdkAppId("1400849908");
            req.setSignName("your-sign-name");
            req.setTemplateId("1907520");

            String[] templateParamSet1 = {"6666"};
            req.setTemplateParamSet(templateParamSet1);

            SendSmsResponse resp = client.SendSms(req);
            System.out.println(SendSmsResponse.toJsonString(resp));
        } catch (TencentCloudSDKException e) {
            System.out.println(e.toString());
        }
    }
}
```

返回结果示例：

```json
{
  "SendStatusSet": [
    {
      "SerialNo": "3369:294906593316931104718082751",
      "PhoneNumber": "your-phone-number",
      "Fee": 1,
      "Code": "Ok",
      "Message": "send success",
      "IsoCode": "CN"
    }
  ],
  "RequestId": "69aceba9-a43d-434c-9021-e7320ef52d49"
}
```

## 第三步：封装为 Spring Boot 工具类

### 1. 配置属性

```yaml
myapp:
  secretId: your-secret-id
  secretKey: your-secret-key
  smsSdkAppId: your-sdk-app-id
  signName: your-sign-name
  templateId: your-template-id
```

### 2. 配置属性绑定类

```java
@Component
@ConfigurationProperties(prefix = "myapp")
public class MyAppProperties {
    private String secretId;
    private String secretKey;
    private String smsSdkAppId;
    private String signName;
    private String templateId;

    // getters and setters
}
```

> 注意：set 方法不要写成 static 的，否则 `@ConfigurationProperties` 无法正常注入。

### 3. 发送短信工具类

```java
@Component
@Slf4j
public class SmsUtil {
    private static SmsClient client = null;

    @PostConstruct
    public void init() {
        client = createClient(
            MyAppProperties.getSecretId(),
            MyAppProperties.getSecretKey()
        );
    }

    public static void sendVerificationCode(String phone, String code) {
        SendSmsRequest req = new SendSmsRequest();
        req.setPhoneNumberSet(new String[]{phone});
        req.setSmsSdkAppId(MyAppProperties.getSmsSdkAppId());
        req.setSignName(MyAppProperties.getSignName());
        req.setTemplateId(MyAppProperties.getTemplateId());
        req.setTemplateParamSet(new String[]{code});

        try {
            SendSmsResponse resp = client.SendSms(req);
            log.info("SMS send result: {}", SendSmsResponse.toJsonString(resp));
        } catch (TencentCloudSDKException e) {
            log.error("Failed to send SMS", e);
            throw new RuntimeException(e);
        }
    }

    private static SmsClient createClient(String secretId, String secretKey) {
        Credential cred = new Credential(secretId, secretKey);
        HttpProfile httpProfile = new HttpProfile();
        httpProfile.setEndpoint("sms.tencentcloudapi.com");
        ClientProfile clientProfile = new ClientProfile();
        clientProfile.setHttpProfile(httpProfile);
        return new SmsClient(cred, "ap-beijing", clientProfile);
    }
}
```

### 4. 对外接口

```java
@RestController
public class SmsController {
    @GetMapping("/sms")
    public String sendSms() {
        SmsUtil.sendVerificationCode("your-phone", "1234");
        return "ok";
    }
}
```

## 总结

整个演进过程：API 调试（原生 SDK）→ 配置外置（ConfigurationProperties）→ 静态工具类封装（@PostConstruct 初始化）。日常开发中推荐直接使用封装后的工具类方式，避免在业务代码中重复编写 SDK 调用逻辑。
