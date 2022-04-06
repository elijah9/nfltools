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

    let teamsFilter = $("#teams-filter");
    teamsFilter.on("change", function () {
        document.getElementById("roster-table").style.display = "none";
        document.getElementById("loading-indicator").style.display = "table";

        let selectedTeamCode = teamsFilter.find(":selected")[0].value;
        let showAllTeams = selectedTeamCode.trim().toLowerCase() === "all";
        let allPlayerRows = $("#roster-table-data tr");
        for(let i = 0; i < allPlayerRows.length; ++i) {
            let playerRow = allPlayerRows[i];
            let playerTeamCode = $(playerRow).find(".row-id")[0].innerText;
            let match = showAllTeams || (playerTeamCode.trim().toLowerCase() === selectedTeamCode.trim().toLowerCase());
            if(match) {
                playerRow.style.display = "";
            } else {
                playerRow.style.display = "none";
            }
        }

        document.getElementById("roster-table").style.display = "table";
        document.getElementById("loading-indicator").style.display = "none";
    });
}

async function resetScrapedData() {
    await resetTeamsList();
    await resetPlayersTable();
}

async function resetTeamsList() {
    let teamsFilter = $("#teams-filter");

    // keep the first 2 options in the list
    teamsFilter.find("option").not(":first").remove();

    let allTeams = await getAllFromTable(TABLE_NAMES.team);
    for(let i = 0; i < allTeams.length; ++i) {
        let team = allTeams[i];

        let option = document.createElement("option");
        option.value = team.teamCode;
        option.innerText = team.fullName;
        teamsFilter.append(option);
    }
}

async function resetPlayersTable() {
    $("#roster-table-data").empty();

    let allPlayers = await getAllFromTable(TABLE_NAMES.player);
    for(let i = 0; i < allPlayers.length; ++i) {
        let player = allPlayers[i];
        let playerRow = document.createElement("tr");
        
        let teamVal = genTableData(player.teamCode);
        teamVal.className = "row-id";
        let posVal = genTableData(player.position);
        let numVal = genTableData(player.jerseyNumber);
        let lNameVal = genTableData(player.lastName);
        let fNameVal = genTableData(player.firstName);
        let heightVal = genTableData(player.height);
        let weightVal = genTableData(player.weight);
        let collegeVal = genTableData(player.college);
        let expVal = genTableData(player.experience);
        let dobVal = genTableData(player.birthDate);

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

function genTableData(cellVal) {
    let cell = document.createElement("td");
    cell.innerText = cellVal;
    return cell;
}