# WalletApi

All URIs are relative to *https://localhost/v1*

| Method | HTTP request | Description |
|------------- | ------------- | -------------|
| [**chanllengeWallet**](WalletApi.md#chanllengewallet) | **GET** /wallet/challenge | Wallet link challenge |
| [**getWallet**](WalletApi.md#getwallet) | **GET** /wallet | Get wallets by filters |
| [**linkWallet**](WalletApi.md#linkwallet) | **POST** /wallet/link | Link wallet |
| [**revokeWallet**](WalletApi.md#revokewallet) | **POST** /wallet/revoke | Revoke wallet |



## chanllengeWallet

> WalletChallengeResponse chanllengeWallet()

Wallet link challenge

### Example

```ts
import {
  Configuration,
  WalletApi,
} from '';
import type { ChanllengeWalletRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const api = new WalletApi();

  try {
    const data = await api.chanllengeWallet();
    console.log(data);
  } catch (error) {
    console.error(error);
  }
}

// Run the test
example().catch(console.error);
```

### Parameters

This endpoint does not need any parameter.

### Return type

[**WalletChallengeResponse**](WalletChallengeResponse.md)

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


## getWallet

> GetWalletsResponse getWallet(walletIds, walletState, limit, offset)

Get wallets by filters

### Example

```ts
import {
  Configuration,
  WalletApi,
} from '';
import type { GetWalletRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const api = new WalletApi();

  const body = {
    // Array<string> | Filter by wallet IDs (optional)
    walletIds: ...,
    // 'WALLET_STATE_ACTIVE' | 'WALLET_STATE_REVOKED' | Filter by wallet state (optional)
    walletState: walletState_example,
    // number | Pagination limit (optional)
    limit: 789,
    // number | Pagination offset (optional)
    offset: 789,
  } satisfies GetWalletRequest;

  try {
    const data = await api.getWallet(body);
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
| **walletIds** | `Array<string>` | Filter by wallet IDs | [Optional] |
| **walletState** | `WALLET_STATE_ACTIVE`, `WALLET_STATE_REVOKED` | Filter by wallet state | [Optional] [Defaults to `undefined`] [Enum: WALLET_STATE_ACTIVE, WALLET_STATE_REVOKED] |
| **limit** | `number` | Pagination limit | [Optional] [Defaults to `undefined`] |
| **offset** | `number` | Pagination offset | [Optional] [Defaults to `undefined`] |

### Return type

[**GetWalletsResponse**](GetWalletsResponse.md)

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


## linkWallet

> WalletLinkResponse linkWallet(body)

Link wallet

### Example

```ts
import {
  Configuration,
  WalletApi,
} from '';
import type { LinkWalletRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const api = new WalletApi();

  const body = {
    // WalletLinkRequest | Wallet link request
    body: ...,
  } satisfies LinkWalletRequest;

  try {
    const data = await api.linkWallet(body);
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
| **body** | [WalletLinkRequest](WalletLinkRequest.md) | Wallet link request | |

### Return type

[**WalletLinkResponse**](WalletLinkResponse.md)

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


## revokeWallet

> WalletRevokeResponse revokeWallet(body)

Revoke wallet

### Example

```ts
import {
  Configuration,
  WalletApi,
} from '';
import type { RevokeWalletRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const api = new WalletApi();

  const body = {
    // WalletRevokeRequest | Wallet revoke request
    body: ...,
  } satisfies RevokeWalletRequest;

  try {
    const data = await api.revokeWallet(body);
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
| **body** | [WalletRevokeRequest](WalletRevokeRequest.md) | Wallet revoke request | |

### Return type

[**WalletRevokeResponse**](WalletRevokeResponse.md)

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

