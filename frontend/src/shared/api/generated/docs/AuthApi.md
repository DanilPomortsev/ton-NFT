# AuthApi

All URIs are relative to *https://localhost/v1*

| Method | HTTP request | Description |
|------------- | ------------- | -------------|
| [**authTelegram**](AuthApi.md#authtelegramoperation) | **POST** /auth/telegram | Create telegram session |



## authTelegram

> AuthTelegramResponse authTelegram(body)

Create telegram session

### Example

```ts
import {
  Configuration,
  AuthApi,
} from '';
import type { AuthTelegramOperationRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const api = new AuthApi();

  const body = {
    // AuthTelegramRequest | Create telegram session request
    body: ...,
  } satisfies AuthTelegramOperationRequest;

  try {
    const data = await api.authTelegram(body);
    console.log(data);
  } catch (error) {
    console.error(error);
  }
}

// Run the test
example().catch(console.error);
```

### Parameters


| Name | Type | Description  | Notes |
|------------- | ------------- | ------------- | -------------|
| **body** | [AuthTelegramRequest](AuthTelegramRequest.md) | Create telegram session request | |

### Return type

[**AuthTelegramResponse**](AuthTelegramResponse.md)

### Authorization

No authorization required

### HTTP request headers

- **Content-Type**: `application/json`
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | successful operation |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)

