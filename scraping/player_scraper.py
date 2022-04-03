from bs4 import BeautifulSoup

def scrape_player(row_soup, team_code, year):
    jersey_number = row_soup.select('th[data-stat="uniform_number"]')[0].text
    full_name = row_soup.select('td[data-stat="player"]')[0]["csk"]
    last_name, first_name = full_name.split(",")
    position = row_soup.select('td[data-stat="pos"]')[0].text
    weight = row_soup.select('td[data-stat="weight"]')[0].text
    height = row_soup.select('td[data-stat="height"]')[0].text
    college = row_soup.select('td[data-stat="college_id"]')[0].text
    birth_date = row_soup.select('td[data-stat="birth_date_mod"]')[0].text
    experience = row_soup.select('td[data-stat="experience"]')[0].text
    av_rating = row_soup.select('td[data-stat="av"]')[0].text
    print(f"{team_code} - {position} #{jersey_number} - {first_name} {last_name} - {height} {weight} - {college} - {birth_date} ({experience}) - {year} AV: {av_rating}")
