import requests
from bs4 import BeautifulSoup, Comment
from scraping.base_scraper import PFR_BASE_URL
from scraping.player_scraper import scrape_player



def standardize_team_code(team_code):
    pfr_team_codes = {
        "crd": "ARI",
        "rav": "BAL",
        "gnb": "GB",
        "htx": "HOU",
        "clt": "IND",
        "kan": "KC",
        "rai": "LV",
        "sdg": "LAC",
        "ram": "LAR",
        "nwe": "NE",
        "nor": "NO",
        "sfo": "SF",
        "tam": "TB",
        "oti": "TEN"
    }

    standardized_team_code = team_code
    if team_code in pfr_team_codes:
        standardized_team_code = pfr_team_codes[team_code]    
    return standardized_team_code.upper()

def scrape_team(team_code, year):
    # get info from roster page for given year
    roster_soup = _scrape_team_common(team_code, year)
    team_name_full = roster_soup.select('h1[itemprop="name"]')[0].find_all("span")[1].text
    standardized_team_code = standardize_team_code(team_code)

    print(f"{standardized_team_code} - {team_name_full}")
    return {
        "teamCode": standardized_team_code,
        "fullName": team_name_full
    }

def scrape_team_players(team_code, year):
    # the roster table is tricky because it's commented out before javascript runs (which doesn't happen for us)
    roster_soup = _scrape_team_common(team_code, year)
    roster_all_comments = roster_soup.findAll(text = lambda text:isinstance(text, Comment))
    roster_table_comment = next(c for c in roster_all_comments if 'table_container' in c)
    roster_table_soup = BeautifulSoup(str(roster_table_comment))
    roster_tbody = roster_table_soup.find("tbody")
    roster_rows = roster_tbody.find_all("tr")
    
    team_players = []
    for row in roster_rows:
        player = scrape_player(row, year)
        team_players.append(player)
    return team_players

def _scrape_team_common(team_code, year):
    # get info from roster page for given year
    roster_url = f"{PFR_BASE_URL}/teams/{team_code}/{year}_roster.htm"
    roster_html = requests.get(roster_url)
    return BeautifulSoup(roster_html.content, "html.parser")