async function initScraper() {
    await resetScrapedData();

    document.getElementById("scraper-buttons").style.display = "block";

    $("button#scrape-button").on("click", async function (e) {
        document.getElementById("loading-indicator").style.display = "table";
        $.get("/scraper/data", async function(data, status) {
            await writeAllToTable(TABLE_NAMES.team, data.teams);
            await writeAllToTable(TABLE_NAMES.player, data.players);
            await resetScrapedData();
            document.getElementById("loading-indicator").style.display = "none";
        })
    });

    $("button#reset-db-button").on("click", async function (e) {
        document.getElementById("loading-indicator").style.display = "table";
        await resetDb();
        location.reload();
    });

    $("button#download-db-button").on("click", async function (e) {
        const data = await getAllTables();
        const jsonData = JSON.stringify(data, null, 4);
        const content = "data:text/json;charset=utf-8," + jsonData;
        downloadFile("nfltools_db_tables.json", content);
    });

    $("button#download-players-button").on("click", async function (e) {
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
    });

    initFilters();
}

async function resetScrapedData() {
    await resetTeamsList();
    await resetPositionList();
    await resetPlayersTable();
}

async function resetTeamsList() {
    const teamsFilter = $("#teams-filter");

    // keep the first option in the list
    teamsFilter.find("option").not(":first").remove();

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
    const positionFilter = $("#position-filter");

    // keep the first option in the list
    positionFilter.find("option").not(":first").remove();

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
    $("#roster-table-data").empty();

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
    const allFilters = $("#roster-filters > select");
    for(let i = 0; i < allFilters.length; ++i) {
        const filter = allFilters[i];
        $(filter).on("change", function () { filterPlayers(allFilters) });
    }
}

function filterPlayers(allFilters) {
    document.getElementById("roster-table").style.display = "none";
    document.getElementById("loading-indicator").style.display = "table";
    
    const allPlayerRows = $("#roster-table-data tr");
    for(let i = 0; i < allPlayerRows.length; ++i) {
        const playerRow = allPlayerRows[i];

        let match = true;
        for(let j = 0; j < allFilters.length; ++j) {
            const filter = allFilters[j];

            const filterValClass = filter.dataset.valueClass;
            const filterSelectedVal = $(filter).find(":selected")[0].value;
            const showAll = filterSelectedVal.trim().toLowerCase() === "all";
            const playerColVal = $(playerRow).find(`.${filterValClass}`)[0].innerText;

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

