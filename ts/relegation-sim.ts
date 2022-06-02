const NUM_LEAGUES = 3;
const LEAGUE_SIZE = 20;
const ROSTER_SIZE = 53;
const ROSTER_PROMOTION_PROP = 0.05;
const ROSTER_PROMOTION_NUM : number = Math.ceil(LEAGUE_SIZE * ROSTER_SIZE * ROSTER_PROMOTION_PROP);

type SimPlayer = {
    id : number;
    rating : number;
    team : number;
};

type SimTeam = {
    id : number;
    rating : number;
    players : SimPlayer[];
};

type SimLeague = {
    id : number;
    teams : SimTeam[];
};

type SimSystem = {
    year : number;
    leagues : SimLeague[];
};

type SimSchedule = {
    schedule : SimGame[];
    standings : SimStandings[];
};

type SimGame = {
    home : SimTeam;
    away : SimTeam;
    leagueId : number;
    homeWon : boolean;
    gamePlayed : boolean;
}

type SimStandings = {
    league : number;
    team : number;
    wins : number;
    losses : number;
};

type SimLeagueChanges = {
    league: number;
    promotions : SimStandings[];
    relegations : SimStandings[];
    promotedPlayers : SimPlayer[];
    relegatedPlayers : SimPlayer[];
}

export default function initRelegationSim() {
    const leagueSystem : SimSystem = genLeagueSystem();
    console.log(leagueSystem);

    document.getElementById("simButton").addEventListener("click", function () {
        simYear(leagueSystem);
    });
}

function randInt(max : number) : number {
    return Math.floor(Math.random() * max);
}

// ratingFloor should not be more than 60
function genPlayer(id : number, ratingFloor : number) : SimPlayer {
    const tierRoll : number = Math.random();
    let tierFloor : number;
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
        rating: tierFloor + randInt(9),
        team: null
    };
}

function genTeam(teamId : number, leagueId : number, ratingFloor : number) : SimTeam {
    const players : SimPlayer[] = [];
    let ratingSum = 0;
    for(let i = 0; i < ROSTER_SIZE; ++i) {
        const player : SimPlayer = genPlayer(i + ROSTER_SIZE * teamId + LEAGUE_SIZE * leagueId, ratingFloor);
        ratingSum += player.rating;
        players.push(player);
    }

    return {
        id: teamId,
        rating: ratingSum / ROSTER_SIZE,
        players: players
    };
}

function genLeague(id : number, ratingFloor : number) : SimLeague {
    const teams : SimTeam[] = [];
    for(let i = 0; i < LEAGUE_SIZE; ++i) {
        teams.push(genTeam(i + LEAGUE_SIZE * id, id, ratingFloor));
    }

    return {
        id: id,
        teams: teams
    };
}

function genLeagueSystem() : SimSystem {
    return {
        year: 0,
        leagues: [
            genLeague(0, 60),
            genLeague(1, 30),
            genLeague(2, 0)
        ]
    };
}

function simYear(leagueSystem : SimSystem) {
    const scheduleAndStandings : SimSchedule = generateSchedule(leagueSystem);
    const schedule : SimGame[] = scheduleAndStandings.schedule;
    const standings : SimStandings[] = scheduleAndStandings.standings;
    
    evaluateGames(schedule, standings);
    
    const systemChanges : SimLeagueChanges[] = getLeagueChanges(standings);
    calcPlayerChanges(leagueSystem, systemChanges);
    applyLeagueChanges(leagueSystem, systemChanges);

    console.log({ standings, systemChanges });

    leagueSystem.year += 1;
    console.log(leagueSystem);
}

function generateSchedule(leagueSystem : SimSystem) : SimSchedule {
    const schedule : SimGame[] = [];
    const standings : SimStandings[] = [];
    for(let i = 0; i < NUM_LEAGUES; ++i) {
        const league : SimLeague = leagueSystem.leagues[i];
        for(let j = 0; j < LEAGUE_SIZE; ++j) {
            const team1 : SimTeam = league.teams[j];
            standings.push({
                league: league.id,
                team: team1.id,
                wins: 0,
                losses: 0
            });

            for(let k = 0; k < LEAGUE_SIZE; ++k) {
                const team2 : SimTeam = league.teams[k];

                if((team1.id !== team2.id) && ((team1.id - team2.id) % 4) == 0) {
                    schedule.push({
                        home: team1,
                        away: team2,
                        leagueId: league.id,
                        homeWon: null,
                        gamePlayed: false
                    });
                    schedule.push({
                        home: team2,
                        away: team1,
                        leagueId: league.id,
                        homeWon: null,
                        gamePlayed: false
                    });
                }
            }
        }
    }

    return { schedule, standings };
}

function evaluateGames(schedule : SimGame[], standings : SimStandings[]) {
    for(let i = 0; i < schedule.length; ++i) {
        const game : SimGame = schedule[i];
        const homeWeight : number = game.home.rating ** 2;
        const awayWeight : number = game.away.rating ** 2;
        const homeProb : number = homeWeight / (homeWeight + awayWeight);
        const roll : number = Math.random();
        const homeWon : boolean = roll <= homeProb;
        game.homeWon = homeWon;
        console.log({ game, homeProb, roll, homeWon });

        const homeStandings : SimStandings = standings.find(t => t.team == game.home.id);
        const awayStandings : SimStandings = standings.find(t => t.team == game.away.id);
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

function getLeagueChanges(standings : SimStandings[]) : SimLeagueChanges[] {
    const systemChanges : SimLeagueChanges[] = [];
    for(let i = 0; i < NUM_LEAGUES; ++i) {
        // rank league by wins
        const leagueStandings = standings.filter(s => s.league == i);
        leagueStandings.sort((a, b) => (a.wins < b.wins) ? 1 : -1);

        const leaguePromotions : SimStandings[] = [];
        const leagueRelegations : SimStandings[] = [];
        for(let j = 0; j < 2; ++j) {
            if(i != 0) {
                leaguePromotions.push(leagueStandings[j]);
            }
            if(i != NUM_LEAGUES - 1) {
                leagueRelegations.push(leagueStandings[LEAGUE_SIZE - j - 1]);
            }
        }

        systemChanges.push({
            league: i,
            promotions: leaguePromotions,
            relegations: leagueRelegations,
            promotedPlayers: null,
            relegatedPlayers: null
        });
    }

    return systemChanges;
}

function calcPlayerChanges(leagueSystem : SimSystem, systemChanges : SimLeagueChanges[]) {
    for(let i = 0; i < NUM_LEAGUES; ++i) {
        const league : SimLeague = leagueSystem.leagues[i];
        const leaguePlayers : SimPlayer[] = [];
        for(let j = 0; j < LEAGUE_SIZE; ++j) {
            for(let k = 0; k < ROSTER_SIZE; ++k) {
                const player : SimPlayer = league.teams[j].players[k];
                player.team = league.teams[j].id;
                leaguePlayers.push(player); 
            }
        }

        // rank players by rating
        leaguePlayers.sort((a, b) => (a.rating > b.rating) ? -1 : 1);
        
        // best 10% and worst 10% of players in leagues move up/down respectively
        const numPlayers : number = leaguePlayers.length;
        const promotedPlayers : SimPlayer[] = [];
        const relegatedPlayers : SimPlayer[] = [];
        for(let j = 0; j < ROSTER_PROMOTION_NUM; ++j) {
            if(i != 0) {
                promotedPlayers.push(leaguePlayers[j]);
            }
            if(i != NUM_LEAGUES - 1) {
                relegatedPlayers.push(leaguePlayers[numPlayers - j - 1]);
            }
        }

        const leagueChanges : SimLeagueChanges = systemChanges.filter(c => c.league == i)[0];
        systemChanges[i].promotedPlayers = promotedPlayers;
        systemChanges[i].relegatedPlayers = relegatedPlayers;
    }
}

function applyLeagueChanges(leagueSystem : SimSystem, systemChanges : SimLeagueChanges[]) {
    for(let i = 0; i < NUM_LEAGUES; ++i) {
        const promotedPlayers : SimPlayer[] = systemChanges[i].promotedPlayers;
        const relegatedPlayers : SimPlayer[] = systemChanges[i].relegatedPlayers;
        for(let j = 0; j < ROSTER_PROMOTION_NUM; ++j) {
            if(i != 0) {
                const player : SimPlayer = promotedPlayers[j];
            }
        }
    }
}