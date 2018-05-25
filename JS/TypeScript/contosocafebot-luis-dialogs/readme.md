# contosocafebot-luis-dialogs

This bot demonstrates uses LUIS to determine intent and extract entities for making a restaurant reservation.

> [!NOTE]
> Unlike the **contosocafebot-luis-1** sample, this one passes the `RecognizerResult` returned from `LUISRecognizer` 
> to the 'reserveTable' dialog, and checks for entities inside the dialog.

|Intent| Example |
|-----|-----|
|Book table | reserve table for 4 at 8pm 5/24/2018 <br> reserve a table|
|Greeting| hi <br/> Hello|
|Who_are_you| who are you |

## Checking the entities

The entities property includes both simple entities, built-in entities, and lists.

```js
export interface _Entities {
    // Simple entities
    partySize?: string[];

    // Built-in entities
    datetime?: DateTimeSpec[];
    number?: number[];

    // Lists
    cafeLocation?: string[][];
    $instance : _Instance;
}
```

> [!NOTE]
> The `datetime` type is an array of `DateTimeSpec`:

```js
// datetime is an array of type 
DateTimeSpec {
    /**
        * Type of expression.
        *
        * @remarks
        * Example types include:
        *
        * - **time**: simple time expression like "3pm".
        * - **date**: simple date like "july 3rd".
        * - **datetime**: combination of date and time like "march 23 2pm".
        * - **timerange**: a range of time like "2pm to 4pm".
        * - **daterange**: a range of dates like "march 23rd to 24th".
        * - **datetimerange**: a range of dates and times like "july 3rd 2pm to 5th 4pm".
        * - **set**: a recurrence like "every monday".
        */
    type: string;
    /** Timex expressions. */
    timex: string[];
}  
```