const NUM_LEAGUES = 3;
const LEAGUE_SIZE = 20;
const ROSTER_SIZE = 53;
const ROSTER_PROMOTION_PROP = 0.05;
const ROSTER_PROMOTION_NUM = Math.ceil(LEAGUE_SIZE * ROSTER_SIZE * ROSTER_PROMOTION_PROP);

function initRelegationSim() {
    leagueSystem = genLeagueSystem();
    console.log(leagueSystem);

    document.getElementById("simButton").addEventListener("click", function () {
        simYear(leagueSystem);
    });
}

function randInt(max) {
    return Math.floor(Math.random() * max);
}

// ratingFloor should not be more than 60
function genPlayer(id, ratingFloor) {
    const tierRoll = Math.random();
    let tierFloor;
    if(tierRoll < 0.4) {
        tierFloor = ratingFloor;
    } else if(tierRoll >= 0.4 && tierRoll < 0.7) {
        tierFloor = ratingFloor + 10;
    } else if(tierRoll >= 0.7 && tierRoll < 0.9) {
        tierFloor = ratingFloor + 20;
    } else if(tierRoll >= 0.9) {
        tierFloor = ratingFloor + 30;
    }

    return {
        id: id,
        rating: tierFloor + randInt(9)
    };
}

function genTeam(teamId, leagueId, ratingFloor) {
    const players = [];
    let ratingSum = 0;
    for(let i = 0; i < ROSTER_SIZE; ++i) {
        const player = genPlayer(i + ROSTER_SIZE * teamId + LEAGUE_SIZE * leagueId, ratingFloor);
        ratingSum += player.rating;
        players.push(player);
    }

    return {
        id: teamId,
        rating: ratingSum / ROSTER_SIZE,
        players: players
    };
}

function genLeague(id, ratingFloor) {
    const teams = [];
    for(let i = 0; i < LEAGUE_SIZE; ++i) {
        teams.push(genTeam(i + LEAGUE_SIZE * id, id, ratingFloor));
    }

    return {
        id: id,
        teams: teams
    };
}

function genLeagueSystem() {
    return {
        year: 0,
        leagues: [
            genLeague(0, 60),
            genLeague(1, 30),
            genLeague(2, 0)
        ]
    };
}

function simYear(leagueSystem) {
    const scheduleAndStandings = generateSchedule(leagueSystem);
    const schedule = scheduleAndStandings.schedule;
    const standings = scheduleAndStandings.standings;
    
    evaluateGames(schedule, standings);
    
    const leagueChanges = getLeagueChanges(standings);
    getPlayerChanges(leagueSystem, leagueChanges);
    applyLeagueChanges(leagueSystem, leagueChanges);

    console.log({ standings, leagueChanges });

    leagueSystem.year += 1;
    console.log(leagueSystem);
}

function generateSchedule(leagueSystem) {
    const schedule = [];
    const standings = {};
    for(let i = 0; i < NUM_LEAGUES; ++i) {
        const league = leagueSystem.leagues[i];
        standings[league.id] = [];
        
        for(let j = 0; j < LEAGUE_SIZE; ++j) {
            const team1 = league.teams[j];
            standings[league.id].push({
                team: team1.id,
                wins: 0,
                losses: 0
            });

            for(let k = 0; k < LEAGUE_SIZE; ++k) {
                const team2 = league.teams[k];

                if((team1.id !== team2.id) && ((team1.id - team2.id) % 4) == 0) {
                    schedule.push({
                        home: team1,
                        away: team2,
                        leagueId: league.id
                    });
                    schedule.push({
                        home: team2,
                        away: team1,
                        leagueId: league.id
                    });
                }
            }
        }
    }

    return { schedule, standings };
}

function evaluateGames(schedule, standings) {
    for(let i = 0; i < schedule.length; ++i) {
        const game = schedule[i];
        const homeWeight = game.home.rating ** 2;
        const awayWeight = game.away.rating ** 2;
        const homeProb = homeWeight / (homeWeight + awayWeight);
        const roll = Math.random();
        const homeWon = roll <= homeProb;
        game.homeWon = homeWon;
        console.log({ game, homeProb, roll, homeWon });

        const homeStandings = standings[game.leagueId].find(t => t.team == game.home.id);
        const awayStandings = standings[game.leagueId].find(t => t.team == game.away.id);
        if(homeWon) {
            homeStandings.wins += 1;
            awayStandings.losses += 1;
        } else {
            homeStandings.losses += 1;
            awayStandings.wins += 1;
        }
    }
    console.log(schedule);
}

function getLeagueChanges(standings) {
    const leagueChanges = {};
    for(let i = 0; i < NUM_LEAGUES; ++i) {
        // rank league by wins
        standings[i].sort((a, b) => (a.wins < b.wins) ? 1 : -1);

        const leaguePromotions = [];
        const leagueRelegations = [];
        for(let j = 0; j < 2; ++j) {
            if(i != 0) {
                leaguePromotions.push(standings[i][j]);
            }
            if(i != NUM_LEAGUES - 1) {
                leagueRelegations.push(standings[i][LEAGUE_SIZE - j - 1]);
            }
        }

        leagueChanges[i] = {
            promotions: leaguePromotions,
            relegations: leagueRelegations
        };
    }

    return leagueChanges;
}

function getPlayerChanges(leagueSystem, leagueChanges) {
    for(let i = 0; i < NUM_LEAGUES; ++i) {
        const league = leagueSystem.leagues[i];
        const leaguePlayers = [];
        for(let j = 0; j < LEAGUE_SIZE; ++j) {
            for(let k = 0; k < ROSTER_SIZE; ++k) {
                const player = league.teams[j].players[k];
                player.teamId = league.teams[j].id;
                leaguePlayers.push(player); 
            }
        }

        // rank players by rating
        leaguePlayers.sort((a, b) => (a.rating > b.rating) ? -1 : 1);
        
        // best 10% and worst 10% of players in leagues move up/down respectively
        const numPlayers = leaguePlayers.length;
        const promotedPlayers = [];
        const relegatedPlayers = [];
        for(let j = 0; j < ROSTER_PROMOTION_NUM; ++j) {
            if(i != 0) {
                promotedPlayers.push(leaguePlayers[j]);
            }
            if(i != NUM_LEAGUES - 1) {
                relegatedPlayers.push(leaguePlayers[numPlayers - j - 1]);
            }
        }

        leagueChanges[i].promotedPlayers = promotedPlayers;
        leagueChanges[i].relegatedPlayers = relegatedPlayers;
    }
}

function applyLeagueChanges(leagueSystem, leagueChanges) {
    for(let i = 0; i < NUM_LEAGUES; ++i) {
        const promotedPlayers = leagueChanges[i].promotedPlayers;
        const relegatedPlayers = leagueChanges[i].relegatedPlayers;
        for(let j = 0; j < ROSTER_PROMOTION_NUM; ++j) {
            if(i != 0) {
                const player = promotedPlayers[j]
            }
        }
    }
}