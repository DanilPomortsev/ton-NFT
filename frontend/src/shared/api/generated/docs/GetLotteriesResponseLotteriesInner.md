
# GetLotteriesResponseLotteriesInner


## Properties

Name | Type
------------ | -------------
`lotteryId` | string
`name` | string
`description` | string
`state` | [LotteryState](LotteryState.md)
`ticketPrice` | number
`creatorTgUserId` | number
`owned` | boolean
`endAt` | Date

## Example

```typescript
import type { GetLotteriesResponseLotteriesInner } from ''

// TODO: Update the object below with actual values
const example = {
  "lotteryId": null,
  "name": null,
  "description": null,
  "state": null,
  "ticketPrice": null,
  "creatorTgUserId": null,
  "owned": null,
  "endAt": null,
} satisfies GetLotteriesResponseLotteriesInner

console.log(example)

// Convert the instance to a JSON string
const exampleJSON: string = JSON.stringify(example)
console.log(exampleJSON)

// Parse the JSON string back to an object
const exampleParsed = JSON.parse(exampleJSON) as GetLotteriesResponseLotteriesInner
console.log(exampleParsed)
```

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


