function initScraper() {
    initScrapeButton("scrape-add-button", async function (data) {
        await writeAllData(data);
    });
    initScrapeButton("scrape-replace-button", async function (data) {
        await resetDb();
        await writeAllData(data);
    });
    initScrapeButton("scrape-update-button", async function (data) {
        await updateAllData(data);
    });

    document.getElementById("reset-db-button").addEventListener("click", async function (e) {
        await showLoadingIndicator(async function () {
            await resetDb();
        });
    });

    document.getElementById("download-db-button").addEventListener("click", async function (e) {
        await showLoadingIndicator(downloadDb);
    });

    document.getElementById("download-players-button").addEventListener("click", async function (e) {
        await showLoadingIndicator(downloadPlayers);
    });

    document.getElementById("import-file").addEventListener("change", validateDbJson);
    document.getElementById("import-button").addEventListener("click", async function (e) {
        await showLoadingIndicator(importJsonToDb);
    });
}

function initScrapeButton(id, callback) {
    document.getElementById(id).addEventListener("click", async function (e) {
        document.getElementById("loading-indicator").style.display = "table";
        fetch("/scraper/data", {
            headers: {
                "Content-Type": "application/json",
                "Accept": "application/json"
            }
        }).then(response => response.json()).then(async function(data) {
            console.log(data);
            await callback(data);
            document.getElementById("loading-indicator").style.display = "none";
        });
    });
}

async function writeAllData(data) {
    await writeAllToTable(TABLE_NAMES.team, data.teams);
    await writeAllToTable(TABLE_NAMES.player, data.players);
    await writeAllToTable(TABLE_NAMES.playerTeams, data.playerTeams);
    await writeAllToTable(TABLE_NAMES.retiredNumbers, data.retiredNumbers);
    await writeAllToTable(TABLE_NAMES.position, data.positions);
    await writeAllToTable(TABLE_NAMES.college, data.colleges);
}

async function updateAllData(data) {
    // for efficiency, do players and player teams with the same iterator
    const allPlayers = await getAllFromTable(TABLE_NAMES.player);
    const allPlayerTeams = await getAllFromTable(TABLE_NAMES.playerTeams);
    console.log(allPlayerTeams);
    const dataPlayers = data.players;
    for(let i = 0; i < dataPlayers.length; ++i) {
        const row = dataPlayers[i];
        const filter = { playerId: row.playerId };
        const playerMatch = allPlayers.filter(function (p) { return p.playerId === row.playerId})[0];
        const teamMatch = allPlayerTeams.filter(function (t) { return t.playerId === row.playerId})[0];
        if(playerMatch) {
            if(!shallowEqual(playerMatch, row)) {
                console.log("updating player: " + row.playerId);
                await updateRow(TABLE_NAMES.player, filter, row);
            }
        } else {
            await writeToTable(row);
        }
        if(teamMatch) {
            const dataTeam = data.playerTeams.filter(function (t) { return t.playerId === row.playerId; })[0];
            if(!shallowEqual(teamMatch, dataTeam)) {
                console.log("updating player team: " + dataTeam.playerId);
                await updateRow(TABLE_NAMES.playerTeams, filter, dataTeam);
            }
        } else {
            await writeToTable(row);
        }
    }

    await updateTableData(data.teams, TABLE_NAMES.team, "teamCode");
    await updateTableData(data.positions, TABLE_NAMES.position, "positionCode");
    await updateTableData(data.colleges, TABLE_NAMES.college, "collegeName");

    // can't update retired numbers because no unique key (my bad)
    await clearTable(TABLE_NAMES.retiredNumbers);
    await writeAllToTable(TABLE_NAMES.retiredNumbers, data.retiredNumbers);
}

async function updateTableData(tableData, tableName, idCol) {
    const allExistingRows = await getAllFromTable(tableName);

    for(let i = 0; i < tableData.length; ++i) {
        const row = tableData[i];
        const filter = { };
        filter[idCol] = row[idCol];

        const match = allExistingRows.filter(function (r) { return r[idCol] === row[idCol]})[0];
        if(match) {
            if(!shallowEqual(match, row)) {
                console.log("updating " + tableName + " " + row[idCol]);
                await updateRow(tableName, filter, row);
            }
        } else {
            await writeToTable(row);
        }
    }
}

async function downloadDb() {
    const data = await getAllTables();
    const jsonData = JSON.stringify(data, null, 4);
    const content = "data:text/json;charset=utf-8," + jsonData;
    downloadFile("nfltools_db_tables.json", content);
}

async function downloadPlayers() {
    const allPlayers = await getAllFromTable(TABLE_NAMES.player);
    const rows = [];

    const headerRow = [];
    for(let [fieldName, fieldVal] of Object.entries(allPlayers[0])) {
        headerRow.push(fieldName);
    }
    rows.push(headerRow);

    for(let i = 0; i < allPlayers.length; ++i) {
        const row = [];
        for(let [fieldName, fieldVal] of Object.entries(allPlayers[i])) {
            row.push(fieldVal);
        }
        rows.push(row);
    }

    const csvContent = "data:text/csv;charset=utf-8," + rows.map(e => e.join(",")).join("\n");
    downloadFile("nfltools_players.csv", csvContent);
}

function validateDbJson(event) {
    document.getElementById("loading-indicator").style.display = "table";

    const input = event.target;
    const status = document.querySelector(".import-status");
    const importButton = document.getElementById("import-button");
    if("files" in input && input.files.length > 0) {
        const file = input.files[0];
        const reader = new FileReader();
        reader.onload = function(e) {
            const valid = isDbJsonValid(e);
            if(valid) {
                status.style.color = "green";
                status.innerText = "upload is valid";
                importButton.removeAttribute("disabled");
            } else {
                status.style.color = "red";
                status.innerText = "upload is invalid";
                importButton.setAttribute("disabled", "true");
            }
        }

        reader.readAsText(file, "UTF-8");
    } else {
        status.style.color = "red";
        status.innerText = "no data uploaded";
        importButton.setAttribute("disabled", "true");
    }

    document.getElementById("loading-indicator").style.display = "none";
}

function isDbJsonValid(e) {
    try {
        const fileJson = e.target.result; 
        const fileObj = JSON.parse(fileJson);
        
        // verify all tables exist
        for(let [key, tableName] of Object.entries(TABLE_NAMES)) {
            if(!(tableName in fileObj)) {
                return false;
            }
        }

        return true;
    } catch(error) {
        console.log(error);
        return false;
    }
}

async function importJsonToDb() {
    const input = document.getElementById("import-file");
    try {
        const file = input.files[0];
        const reader = new FileReader();
        reader.onload = async function(e) {
            const fileJson = e.target.result;
            const fileObj = JSON.parse(fileJson);
            const fileObjMap = Object.entries(fileObj);
            for(let i = 0; i < fileObjMap.length; ++i) {
                tableName = fileObjMap[i][0];
                tableData = fileObjMap[i][1];
                await writeAllToTable(tableName, tableData);
            }
        }

        reader.readAsText(file, "UTF-8");
    } catch(error) {
        console.log(error);
    }
}