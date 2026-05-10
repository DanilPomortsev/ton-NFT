
# WalletLinkResponse


## Properties

Name | Type
------------ | -------------
`walletId` | string
`network` | [TonNetwork](TonNetwork.md)
`walletAddress` | string
`state` | [WalletState](WalletState.md)
`linkedAt` | Date

## Example

```typescript
import type { WalletLinkResponse } from ''

// TODO: Update the object below with actual values
const example = {
  "walletId": null,
  "network": null,
  "walletAddress": null,
  "state": null,
  "linkedAt": null,
} satisfies WalletLinkResponse

console.log(example)

// Convert the instance to a JSON string
const exampleJSON: string = JSON.stringify(example)
console.log(exampleJSON)

// Parse the JSON string back to an object
const exampleParsed = JSON.parse(exampleJSON) as WalletLinkResponse
console.log(exampleParsed)
```

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


