from datetime import date
from flask import Flask, Response, render_template, request
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

@app.route("/players")
def players():
    title = "players"
    return render_template("players.html", title=title)


@app.route("/edit-player")
def edit_player():
    player_id = request.args.get('player_id', type=int)
    title = "edit player"
    return render_template("edit-player.html", title=title, player_id=player_id)

@app.route("/create-player")
def create_player():
    title = "create player"
    return render_template("edit-player.html", title=title)

@app.route("/sim-test")
def sim_test():
    title = "relegation sim test"
    return render_template("sim-test.html", title=title)

if __name__ == '__main__':
    app.run()