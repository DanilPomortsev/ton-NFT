
# PrepareTicketTransactionResponse


## Properties

Name | Type
------------ | -------------
`intentId` | string
`ticketId` | string
`lotteryId` | string
`expiresAt` | Date
`tx` | [PrepareTicketTransactionResponseTx](PrepareTicketTransactionResponseTx.md)

## Example

```typescript
import type { PrepareTicketTransactionResponse } from ''

// TODO: Update the object below with actual values
const example = {
  "intentId": null,
  "ticketId": null,
  "lotteryId": null,
  "expiresAt": null,
  "tx": null,
} satisfies PrepareTicketTransactionResponse

console.log(example)

// Convert the instance to a JSON string
const exampleJSON: string = JSON.stringify(example)
console.log(exampleJSON)

// Parse the JSON string back to an object
const exampleParsed = JSON.parse(exampleJSON) as PrepareTicketTransactionResponse
console.log(exampleParsed)
```

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


