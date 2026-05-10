
# WalletRevokeResponse


## Properties

Name | Type
------------ | -------------
`walletId` | string
`state` | [WalletState](WalletState.md)
`revokedAt` | Date

## Example

```typescript
import type { WalletRevokeResponse } from ''

// TODO: Update the object below with actual values
const example = {
  "walletId": null,
  "state": null,
  "revokedAt": null,
} satisfies WalletRevokeResponse

console.log(example)

// Convert the instance to a JSON string
const exampleJSON: string = JSON.stringify(example)
console.log(exampleJSON)

// Parse the JSON string back to an object
const exampleParsed = JSON.parse(exampleJSON) as WalletRevokeResponse
console.log(exampleParsed)
```

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


