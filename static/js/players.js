async function initPlayers() {
    await resetScrapedData();
    initFilters();
    initContextMenu();
}

async function resetScrapedData() {
    await resetTeamsList();
    await resetPositionList();
    await resetCollegeList();
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
        option.innerText = `${team.fullName} (${team.teamCode})`;
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

    const allPositions = await getAllFromTable(TABLE_NAMES.position);
    for(let i = 0; i < allPositions.length; ++i) {
        const position = allPositions[i];
        const option = document.createElement("option");
        option.value = position.positionCode;
        option.innerText = `${position.fullName} (${position.positionCode})`;
        positionFilter.append(option);
    }
}

async function resetCollegeList() {
    const collegeFilter = document.getElementById("college-filter");

    // keep the first option in the list
    collegeFilter.querySelectorAll("option").forEach(function (v, i) { 
        if(i != 0) {
            v.remove(); 
        }
    });

    const allColleges = await getAllFromTable(TABLE_NAMES.college);
    for(let i = 0; i < allColleges.length; ++i) {
        const college = allColleges[i];
        const option = document.createElement("option");
        option.value = college.collegeName;
        option.innerText = college.collegeName;
        collegeFilter.append(option);
    }
}

async function resetPlayersTable() {
    document.getElementById("roster-table-data").replaceChildren();

    const allPlayers = await getAllFromTable(TABLE_NAMES.player);
    const allPlayerTeams = await getAllFromTable(TABLE_NAMES.playerTeams);
    for(let i = 0; i < allPlayers.length; ++i) {
        const player = allPlayers[i];
        const playerTeam = allPlayerTeams.filter(function (pt) {
            return pt.playerId === player.playerId;
        })[0];
        const playerRow = document.createElement("tr");
        playerRow.dataset.rowId = player.playerId;
        
        const teamVal = genTableData(playerTeam.teamCode);
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
        collegeVal.className = "college";

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

        playerRow.className = "player";

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

function initContextMenu() {
    const contextMenu = document.getElementById("context-menu");
    const allPlayers = document.getElementsByClassName("player");
    for(let i = 0; i < allPlayers.length; ++i) {
        const player = allPlayers[i];
        player.addEventListener("contextmenu", function (e) {
            e.preventDefault();
            
            const { clientX: mouseX, clientY: mouseY } = e;
            const { normalizedX, normalizedY } = normalizePosition(player, contextMenu, mouseX, mouseY);

            contextMenu.style.left = `${normalizedX}px`;
            contextMenu.style.top = `${normalizedY}px`;

            contextMenu.classList.add("visible");
            contextMenu.dataset.playerId = player.dataset.rowId;
        });
    }

    document.querySelector("body").addEventListener("click", function (e) {
        if(e.target.offsetParent != contextMenu) {
            contextMenu.classList.remove("visible");
        }
    });

    const editPlayer = document.getElementById("edit-player");
    editPlayer.addEventListener("click", function (e) {
        const playerId = contextMenu.dataset.playerId;
        const href = editPlayer.dataset.urlTemplate.replaceAll("$", playerId);
        location.href = href;
    });
}

function normalizePosition(node, menu, mouseX, mouseY) {
    const {
        left: scopeOffsetX,
        top: scopeOffsetY
    } = node.getBoundingClientRect();

    const scopeX = mouseX - scopeOffsetX;
    const scopeY = mouseY - scopeOffsetY;

    const boundX = scopeX + menu.clientWidth > node.clientWidth;
    const boundY = scopeY + menu.clientHeight > node.clientHeight;
    let normalizedX = mouseX;
    let normalizedY = mouseY;
    if(boundX) {
        normalizedX = scopeOffsetX + node.clientWidth - menu.clientWidth;
    }
    if(boundY) {
        normalizedY = scopeOffsetY + node.clientHeight - menu.clientHeight;
    }

    return { normalizedX, normalizedY };
}