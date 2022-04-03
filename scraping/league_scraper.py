import requests
from bs4 import BeautifulSoup
from scraping.base_scraper import PFR_BASE_URL
from scraping.team_scraper import scrape_team

def scrape_league(year):
    league_url = f"{PFR_BASE_URL}/teams/"
    league_html = requests.get(league_url)
    league_soup = BeautifulSoup(league_html.content, "html.parser")

    teams_table = league_soup.find(id="teams_active")
    team_rows = teams_table.find("tbody").select('th[data-stat="team_name"] a')
    for row in team_rows:
        href_root = "/teams/"
        href_val = row.attrs["href"]
        team_code = href_val.replace(href_root, "").replace("/", "")
        scrape_team(team_code, year)

    return {
        "team1": "fake"
    }