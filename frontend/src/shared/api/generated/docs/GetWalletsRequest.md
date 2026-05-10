
# GetWalletsRequest


## Properties

Name | Type
------------ | -------------
`walletIds` | Array&lt;string&gt;
`walletState` | [WalletState](WalletState.md)
`limit` | number
`offset` | number

## Example

```typescript
import type { GetWalletsRequest } from ''

// TODO: Update the object below with actual values
const example = {
  "walletIds": null,
  "walletState": null,
  "limit": null,
  "offset": null,
} satisfies GetWalletsRequest

console.log(example)

// Convert the instance to a JSON string
const exampleJSON: string = JSON.stringify(example)
console.log(exampleJSON)

// Parse the JSON string back to an object
const exampleParsed = JSON.parse(exampleJSON) as GetWalletsRequest
console.log(exampleParsed)
```

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


