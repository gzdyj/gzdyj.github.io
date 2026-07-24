---
title: "Send SMS via Tencent Cloud API with Spring Boot"
published: 2026-07-23
description: "A progressive guide from raw API debugging to a clean Spring Boot utility class, covering configuration property binding and static utility design."
tags: [SpringBoot, TencentCloud, SMS]
category: Java
lang: "en"
---

# Send SMS via Tencent Cloud API with Spring Boot

## Step 1: Apply for SMS Service

Open the Tencent Cloud console, apply for an SMS application, signature, and template.

## Step 2: API Debugging

You can quickly generate calling code on the [Tencent Cloud API Explorer](https://console.cloud.tencent.com/api/explorer?Product=sms) page.

### Add the Dependency

```xml
<dependency>
    <groupId>com.tencentcloudapi</groupId>
    <artifactId>tencentcloud-sdk-java</artifactId>
    <version>3.1.838</version>
</dependency>
```

### Raw Calling Code

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

Example response:

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

## Step 3: Wrap as a Spring Boot Utility

### 1. Configuration Properties

```yaml
myapp:
  secretId: your-secret-id
  secretKey: your-secret-key
  smsSdkAppId: your-sdk-app-id
  signName: your-sign-name
  templateId: your-template-id
```

### 2. Configuration Binding Class

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

> Note: Don't make set methods `static`, or `@ConfigurationProperties` won't inject values properly.

### 3. SMS Utility Class

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

### 4. API Endpoint

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

## Summary

The evolution: API debugging (raw SDK) → externalized configuration (ConfigurationProperties) → static utility class (@PostConstruct initialization). In daily development, the wrapped utility class approach is recommended to avoid duplicating SDK calling logic across business code.
