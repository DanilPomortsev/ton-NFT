# TicketApi

All URIs are relative to *https://localhost/v1*

| Method | HTTP request | Description |
|------------- | ------------- | -------------|
| [**getTicket**](TicketApi.md#getticket) | **GET** /ticket | Get tickets by filters |
| [**prepareTicket**](TicketApi.md#prepareticketoperation) | **POST** /ticket/prepare | Prepare ticket creation transaction |
| [**prepareTicketRefund**](TicketApi.md#prepareticketrefundoperation) | **POST** /ticket/refund/prepare | Prepare ticket refund transaction |



## getTicket

> GetTicketsResponse getTicket(ticketIds, lotteryIds, limit, offset)

Get tickets by filters

### Example

```ts
import {
  Configuration,
  TicketApi,
} from '';
import type { GetTicketRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const api = new TicketApi();

  const body = {
    // Array<string> | Filter by ticket IDs (optional)
    ticketIds: ...,
    // Array<string> | Filter by lottery IDs (optional)
    lotteryIds: ...,
    // number | Pagination limit (optional)
    limit: 789,
    // number | Pagination offset (optional)
    offset: 789,
  } satisfies GetTicketRequest;

  try {
    const data = await api.getTicket(body);
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
| **ticketIds** | `Array<string>` | Filter by ticket IDs | [Optional] |
| **lotteryIds** | `Array<string>` | Filter by lottery IDs | [Optional] |
| **limit** | `number` | Pagination limit | [Optional] [Defaults to `undefined`] |
| **offset** | `number` | Pagination offset | [Optional] [Defaults to `undefined`] |

### Return type

[**GetTicketsResponse**](GetTicketsResponse.md)

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


## prepareTicket

> PrepareTicketTransactionResponse prepareTicket(body)

Prepare ticket creation transaction

### Example

```ts
import {
  Configuration,
  TicketApi,
} from '';
import type { PrepareTicketOperationRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const api = new TicketApi();

  const body = {
    // PrepareTicketRequest | Prepare ticket creation request
    body: ...,
  } satisfies PrepareTicketOperationRequest;

  try {
    const data = await api.prepareTicket(body);
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
| **body** | [PrepareTicketRequest](PrepareTicketRequest.md) | Prepare ticket creation request | |

### Return type

[**PrepareTicketTransactionResponse**](PrepareTicketTransactionResponse.md)

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


## prepareTicketRefund

> PrepareTicketTransactionResponse prepareTicketRefund(body)

Prepare ticket refund transaction

### Example

```ts
import {
  Configuration,
  TicketApi,
} from '';
import type { PrepareTicketRefundOperationRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const api = new TicketApi();

  const body = {
    // PrepareTicketRefundRequest | Prepare ticket creation request
    body: ...,
  } satisfies PrepareTicketRefundOperationRequest;

  try {
    const data = await api.prepareTicketRefund(body);
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
| **body** | [PrepareTicketRefundRequest](PrepareTicketRefundRequest.md) | Prepare ticket creation request | |

### Return type

[**PrepareTicketTransactionResponse**](PrepareTicketTransactionResponse.md)

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

