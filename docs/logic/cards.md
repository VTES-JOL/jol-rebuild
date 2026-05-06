# Card Import and Searching

## Card Data
Card data is sourced from the VEKN website.
JOL uses the CSV format located at [CSV Format](https://www.vekn.net/images/stories/downloads/vtescsv_utf8.zip)
There is also a text version located at [Text Format](https://www.vekn.net/images/stories/downloads/cardlist.txt)
A local copy of this file is located at
* [Crypt Cards](../../csv/vtescrypt.csv)
* [Library Cards](../../csv/vteslib.csv)

## Name disambiguation
### Grouping rules
Crypt cards may be printed with the same name, the `Name` column in the CSV file may contain the same data.
To disambiguate Crypt cards we add the `Group` value to the name in the format `G{value}` where value is any of the integer groupings (1-7)
Crypt cards of type `ANY` don't use this format.
If a crypt card is advanced we also append the text `ADV` to the name
Parentheses surround All of these additions – for example
- Theo Bell #201362 would become `Theo Bell (G2)`
- Theo Bell #201363 would become `Theo Bell (G2 ADV)`
- Theo Bell #201613 would become `Theo Bell (G6)`

The non-advanced card with the lowest grouping will also be able to use the base name, in the case that a card with the `ANY` grouping is present, then it will take priority. 
In the example above that would be 
- Theo Bell #201362 would also have `Theo Bell`

### Diacritics and simplified names
For names that contain characters outside the standard ASCII range like `L'Épuisette` a simplified version will also be 
available by using `StringUtils.stripAccents` over the base name before proceeding with groups and advanced flags.
For the example above there would be the following variations
- `L'Épuisette` would become `L'Épuisette (G4)`, `L'Epuisette (G4)`, `L'Épuisette` and `L'Epuisette`

For names that end in the `, The` then a simplified replacement will be available.
`unnamed, The` will become `The unnamed (G6)`, `unnamed, The (G6)`, `unnamed, The` and `The unnamed`

### AKA Names
Some cards have values in the `Aka` field, each value in this column ( seperated by `;` ) would apply the rules above

### Name combinations
Cards that fall into one or more categories defined above will have all the rules applied to them

## Name searching
For importing decklists or manually searching for a card via the Deck builder, or chat autocomplete interface, the following additional
rules will apply
- All searches will be case-insensitive

## Displaying names
To display a card name in game, chat, or deck builder the card name as printed on the card, or in the `Name` column of the CSV will be used,
alongside the group ( if not any ), and the advanced flag.
For display purposes the ADV text will be replaced with the stylised Advanced icon