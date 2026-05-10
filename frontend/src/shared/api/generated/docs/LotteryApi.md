# LotteryApi

All URIs are relative to *https://localhost/v1*

| Method | HTTP request | Description |
|------------- | ------------- | -------------|
| [**getLottery**](LotteryApi.md#getlottery) | **GET** /lottery | Get lotteries by filters |
| [**prepareLottery**](LotteryApi.md#preparelotteryoperation) | **POST** /lottery/prepare | Prepare lottery creation transaction |
| [**prepareLotteryFinalizaion**](LotteryApi.md#preparelotteryfinalizaion) | **POST** /lottery/finalization/prepare | Prepare lottery finalization transaction |



## getLottery

> GetLotteriesResponse getLottery(lotteryIds, limit, offset)

Get lotteries by filters

### Example

```ts
import {
  Configuration,
  LotteryApi,
} from '';
import type { GetLotteryRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const api = new LotteryApi();

  const body = {
    // Array<string> | Filter by lottery IDs (optional)
    lotteryIds: ...,
    // number | Pagination limit (optional)
    limit: 789,
    // number | Pagination offset (optional)
    offset: 789,
  } satisfies GetLotteryRequest;

  try {
    const data = await api.getLottery(body);
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
| **lotteryIds** | `Array<string>` | Filter by lottery IDs | [Optional] |
| **limit** | `number` | Pagination limit | [Optional] [Defaults to `undefined`] |
| **offset** | `number` | Pagination offset | [Optional] [Defaults to `undefined`] |

### Return type

[**GetLotteriesResponse**](GetLotteriesResponse.md)

### Authorization

No authorization required

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | successful operation |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## prepareLottery

> PrepareLotteryTransaction prepareLottery(body)

Prepare lottery creation transaction

### Example

```ts
import {
  Configuration,
  LotteryApi,
} from '';
import type { PrepareLotteryOperationRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const api = new LotteryApi();

  const body = {
    // PrepareLotteryRequest | Prepare lottery request
    body: ...,
  } satisfies PrepareLotteryOperationRequest;

  try {
    const data = await api.prepareLottery(body);
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
| **body** | [PrepareLotteryRequest](PrepareLotteryRequest.md) | Prepare lottery request | |

### Return type

[**PrepareLotteryTransaction**](PrepareLotteryTransaction.md)

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


## prepareLotteryFinalizaion

> PrepareLotteryTransaction prepareLotteryFinalizaion(body)

Prepare lottery finalization transaction

### Example

```ts
import {
  Configuration,
  LotteryApi,
} from '';
import type { PrepareLotteryFinalizaionRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const api = new LotteryApi();

  const body = {
    // PrepareLotteryFinalizationRequest | Prepare lottery request
    body: ...,
  } satisfies PrepareLotteryFinalizaionRequest;

  try {
    const data = await api.prepareLotteryFinalizaion(body);
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
| **body** | [PrepareLotteryFinalizationRequest](PrepareLotteryFinalizationRequest.md) | Prepare lottery request | |

### Return type

[**PrepareLotteryTransaction**](PrepareLotteryTransaction.md)

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

