
# PrepareLotteryTransaction


## Properties

Name | Type
------------ | -------------
`intentId` | string
`lotteryId` | string
`network` | [TonNetwork](TonNetwork.md)
`expiresAt` | Date
`tx` | [PrepareLotteryTransactionTx](PrepareLotteryTransactionTx.md)

## Example

```typescript
import type { PrepareLotteryTransaction } from ''

// TODO: Update the object below with actual values
const example = {
  "intentId": null,
  "lotteryId": null,
  "network": null,
  "expiresAt": null,
  "tx": null,
} satisfies PrepareLotteryTransaction

console.log(example)

// Convert the instance to a JSON string
const exampleJSON: string = JSON.stringify(example)
console.log(exampleJSON)

// Parse the JSON string back to an object
const exampleParsed = JSON.parse(exampleJSON) as PrepareLotteryTransaction
console.log(exampleParsed)
```

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


