
# GetTicketsResponseTicketsInner


## Properties

Name | Type
------------ | -------------
`ticketId` | string
`lotteryId` | string
`price` | number
`buyerTgUserId` | number
`owned` | boolean
`state` | [TicketState](TicketState.md)

## Example

```typescript
import type { GetTicketsResponseTicketsInner } from ''

// TODO: Update the object below with actual values
const example = {
  "ticketId": null,
  "lotteryId": null,
  "price": null,
  "buyerTgUserId": null,
  "owned": null,
  "state": null,
} satisfies GetTicketsResponseTicketsInner

console.log(example)

// Convert the instance to a JSON string
const exampleJSON: string = JSON.stringify(example)
console.log(exampleJSON)

// Parse the JSON string back to an object
const exampleParsed = JSON.parse(exampleJSON) as GetTicketsResponseTicketsInner
console.log(exampleParsed)
```

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


