async function initScraper() {
    await resetScrapedData();

    document.getElementById("scraper-buttons").style.display = "block";

    document.getElementById("scrape-button").addEventListener("click", async function (e) {
        document.getElementById("loading-indicator").style.display = "table";
        fetch("/scraper/data").then(response => response.json()).then(async function(data) {
            await writeAllToTable(TABLE_NAMES.team, data.teams);
            await writeAllToTable(TABLE_NAMES.player, data.players);
            await resetScrapedData();
            document.getElementById("loading-indicator").style.display = "none";
        });
    });

    document.getElementById("reset-db-button").addEventListener("click", async function (e) {
        document.getElementById("loading-indicator").style.display = "table";
        await resetDb();
        location.reload();
    });

    document.getElementById("download-db-button").addEventListener("click", async function (e) {
        await downloadDb();
    });

    document.getElementById("download-players-button").addEventListener("click", async function (e) {
        await downloadPlayers();
    });

    document.getElementById("import-file").addEventListener("change", validateDbJson);
    document.getElementById("import-button").addEventListener("click", async function (e) {
        await importJsonToDb();
    });

    initFilters();
}

async function resetScrapedData() {
    await resetTeamsList();
    await resetPositionList();
    await resetPlayersTable();
}

async function resetTeamsList() {
    const teamsFilter = document.getElementById("teams-filter");

    // keep the first option in the list
    teamsFilter.querySelectorAll("option").forEach(function (v, i) { 
        if(i != 0) {
            v.remove(); 
        }
    });

    const allTeams = await getAllFromTable(TABLE_NAMES.team);
    for(let i = 0; i < allTeams.length; ++i) {
        const team = allTeams[i];

        const option = document.createElement("option");
        option.value = team.teamCode;
        option.innerText = team.fullName;
        teamsFilter.append(option);
    }
}

async function resetPositionList() {
    const positionFilter = document.getElementById("position-filter");

    // keep the first option in the list
    positionFilter.querySelectorAll("option").forEach(function (v, i) { 
        if(i != 0) {
            v.remove(); 
        }
    });

    const allPlayers = await getAllFromTable(TABLE_NAMES.player);
    const allPositions = [];
    for(let i = 0; i < allPlayers.length; ++i) {
        const player = allPlayers[i];
        const playerPosition = player.position.trim().toUpperCase();
        if(!allPositions.includes(playerPosition)) {
            allPositions.push(playerPosition);

            const option = document.createElement("option");
            option.value = playerPosition;
            option.innerText = playerPosition;
            positionFilter.append(option);
        }
    }
}

async function resetPlayersTable() {
    document.getElementById("roster-table-data").replaceChildren();

    const allPlayers = await getAllFromTable(TABLE_NAMES.player);
    for(let i = 0; i < allPlayers.length; ++i) {
        const player = allPlayers[i];
        const playerRow = document.createElement("tr");
        
        const teamVal = genTableData(player.teamCode);
        const posVal = genTableData(player.position);
        const numVal = genTableData(player.jerseyNumber);
        const lNameVal = genTableData(player.lastName);
        const fNameVal = genTableData(player.firstName);
        const heightVal = genTableData(player.height);
        const weightVal = genTableData(player.weight);
        const collegeVal = genTableData(player.college);
        const expVal = genTableData(player.experience);
        const dobVal = genTableData(player.birthDate);

        teamVal.className = "team-id";
        posVal.className = "position";

        playerRow.appendChild(teamVal);
        playerRow.appendChild(posVal);
        playerRow.appendChild(numVal);
        playerRow.appendChild(lNameVal);
        playerRow.appendChild(fNameVal);
        playerRow.appendChild(heightVal);
        playerRow.appendChild(weightVal);
        playerRow.appendChild(collegeVal);
        playerRow.appendChild(expVal);
        playerRow.appendChild(dobVal);

        document.getElementById("roster-table-data").appendChild(playerRow);
    }
}

function initFilters() {
    const allFilters = document.querySelectorAll("#roster-filters > select");
    for(let i = 0; i < allFilters.length; ++i) {
        const filter = allFilters[i];
        filter.addEventListener("change", function () { filterPlayers(allFilters); });
    }
}

function filterPlayers(allFilters) {
    document.getElementById("roster-table").style.display = "none";
    document.getElementById("loading-indicator").style.display = "table";
    
    const allPlayerRows = document.querySelectorAll("#roster-table-data tr");
    for(let i = 0; i < allPlayerRows.length; ++i) {
        const playerRow = allPlayerRows[i];

        let match = true;
        for(let j = 0; j < allFilters.length; ++j) {
            const filter = allFilters[j];

            const filterValClass = filter.dataset.valueClass;
            const filterSelectedVal = filter.value;
            const showAll = filterSelectedVal.trim().toLowerCase() === "all";
            const playerColVal = playerRow.querySelector(`.${filterValClass}`).innerText;

            const filterMatch = showAll || (playerColVal.trim().toLowerCase() === filterSelectedVal.trim().toLowerCase());
            match = match && filterMatch;
        }

        if(match) {
            playerRow.style.display = "";
        } else {
            playerRow.style.display = "none";
        }
    }

    document.getElementById("roster-table").style.display = "table";
    document.getElementById("loading-indicator").style.display = "none";
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
    document.getElementById("roster-table").style.display = "none";
    document.getElementById("loading-indicator").style.display = "table";

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

            await resetScrapedData();

            document.getElementById("roster-table").style.display = "table";
            document.getElementById("loading-indicator").style.display = "none";
        }

        reader.readAsText(file, "UTF-8");
    } catch(error) {
        console.log(error);
    }
}