
# nfltools
Flask app which ideally should replace everything I currently do in a spreadsheet to keep track of football stuff. Mostly a vehicle for me to have a code project to work on in my spare time.

## To do
- Store scraped data in IndexedDB
- Implement view for scraped data
- JSON export of data
- JSON import of data

## Ideas
### Scraping
- Store data client-side in IndexedDB
- Allow JSON import and export

### Ratings engine
- Specify a set of attributes which contribute to an overall rating
- Create set of archetypes (pre-set attribute values) for different types of players
- (semi?) Automatically generate rated rosters from PFR data by scaling archetypes by PFR AV ratings
  - Could be fully automatic, albeit unlikely to closely reflect reality, if the only archetypes were tied to PFR positions
  - Would only be able to use AV data from completed seasons, but maybe sports-reference has college AV data
- UI to edit ratings, maybe even customize which attributes exist and how they contribute to overall rating for each position
  - This could be used to make it a generic roster editor for any football game like Madden, 2k5, Front Office Football (RIP to the latter two series)