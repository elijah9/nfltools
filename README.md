# nfltools
Flask app which ideally should replace everything I currently do in a spreadsheet to keep track of football stuff. Mostly a vehicle for me to have a code project to work on in my spare time.

Currently hosted at http://twinprincess.pythonanywhere.com/, but the scraping doesn't work from there (at least it can be somewhat useful still with JSON imports). I probably won't be very proactive about pulling code updates to the server.

## To do
- More scraping options
  - Update existing db
  - Replace existing db
- Basic player rating system
  - Random generation taking center of ratings distribution (60-99 for NFL meaning 80 is center) and weighing less as ratings increase
- Roster cut tool
- Basic simulation
  - Make very basic relegation system where season league rankings are randomized weighted on average player rating
    - Worst 5 players on promoted teams would be cut, best 5 players on relegated teams would replace them
  - Study how ratings distribute over time with relegation system
- Scrape more data
  - Player 
    - Draft position
    - Team history
    - Stats
  - Team
    - Colors
    - Location
    - Conference/division
## Ideas
### Ratings engine
- Specify a set of attributes which contribute to an overall rating
- Create set of archetypes (pre-set attribute values) for different types of players
- (semi?) Automatically generate rated rosters from PFR data by scaling archetypes by PFR AV ratings
  - Could be fully automatic, albeit unlikely to closely reflect reality, if the only archetypes were tied to PFR positions
  - Would only be able to use AV data from completed seasons, but maybe sports-reference has college AV data
- UI to edit ratings, maybe even customize which attributes exist and how they contribute to overall rating for each position
  - This could be used to make it a generic roster editor for any football game like Madden, 2k5, Front Office Football (RIP to the latter two series)
- Numeric ratings system:
  - Overall ratings separated into tiers:
    - Elite 90-99
    - Good 80-89
    - Starter 70-79
    - Depth 60-69
    - Prospect 0-59
    - For NFL players, this should be similar to Madden scaling
      - This would allow for a minor league system coexisting in the same database as the NFL with its own scaling
        - For example, the second tier could have a general range of 40-79
  - Attributes should use the full 0-99 range

### Simulation mode
- Include option for minor league with relegation, 3 tiers would probably work well with ratings scaling

### Table structure
- PlayerRating to store player ID, attribute ID, attribute value
- RatingAttribute to store attribute ID, attribute name short, attribute name long

### Constants to define
- Position dictionary to store position short name, long name, order
- Position mapping from scraped position to dictionary position