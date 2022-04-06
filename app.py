from flask import Flask, render_template
from scraping.league_scraper import scrape_league

app = Flask(__name__)
app.templates_auto_reload = True

@app.route("/home")
@app.route("/")
def home():
    title = "nfltools"
    return render_template("index.html", title=title)

@app.route("/scraper")
def scraper():
    title = "scraper"
    return render_template("scraper.html", title=title)

@app.route("/scraper/data")
def scrape_teams():
    year = 2022
    return scrape_league(year)

if __name__ == "__main__":
    app.run(debug=True)