import requests
from bs4 import BeautifulSoup
from scraping.base_scraper import PFR_BASE_URL
from scraping.team_scraper import scrape_team, scrape_team_players, standardize_team_code

def scrape_league(year):
    league_url = f"{PFR_BASE_URL}/teams/"
    league_html = requests.get(league_url)
    league_soup = BeautifulSoup(league_html.content, "html.parser")

    teams_table = league_soup.find(id="teams_active")
    team_rows = teams_table.find("tbody").select('th[data-stat="team_name"] a')
    all_teams = []
    all_players = []
    player_teams = []

    i = 0
    for row in team_rows:
        href_root = "/teams/"
        href_val = row.attrs["href"]
        team_code = href_val.replace(href_root, "").replace("/", "")
        standardized_team_code = standardize_team_code(team_code)
        team = scrape_team(team_code, year)
        all_teams.append(team)
        
        team_players = scrape_team_players(team_code, year)
        for player in team_players:
            player["playerId"] = i
            all_players.append(player)
            player_teams.append({
                "teamCode": standardized_team_code,
                "playerId": i,
            })

            i += 1

    return {
        "teams": all_teams,
        "players": all_players,
        "playerTeams": player_teams
    }