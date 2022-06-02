import { appendTableData, isEmptyOrSpaces, Position2D } from "./common";
import { Team, Position, College, Player, PlayerTeam } from "./data-models";
import { getAllFromTable, TableName, TABLE_NAMES } from "./idb-utils";

export default async function initPlayers() {
    await resetScrapedData();

    const allFilters : NodeListOf<HTMLSelectElement> = document.querySelectorAll("#roster-filters > select");
    initFilters(allFilters);
    initContextMenu();

    const teamParam : string = (document.getElementById("team-param") as HTMLInputElement).value;
    const positionParam : string = (document.getElementById("position-param") as HTMLInputElement).value;
    if(!(isEmptyOrSpaces(teamParam) || teamParam === "None")) {
        (document.getElementById("teams-filter") as HTMLSelectElement).value = teamParam;
    }
    if(!(isEmptyOrSpaces(positionParam) || positionParam === "None")) {
        (document.getElementById("position-filter") as HTMLSelectElement).value = positionParam;
    }
    filterPlayers(allFilters);
}

async function resetScrapedData() {
    await resetTeamsList();
    await resetPositionList();
    await resetCollegeList();
    await resetPlayersTable();
}

async function resetFilterOptions<T>(filterId : string, tableName : TableName, 
    valueFn : (t : T) => string, labelFn : (t : T) => string) {

    const filter = document.getElementById(filterId) as HTMLSelectElement;

    // keep the first option in the list
    filter.querySelectorAll("option").forEach(
        function (v : HTMLOptionElement, i : number) { 
            if(i != 0) {
                v.remove(); 
            }
        }
    );

    const allRows : T[] = await getAllFromTable(tableName.name);
    for(let i = 0; i < allRows.length; ++i) {
        const row : T = allRows[i];

        const option : HTMLOptionElement = document.createElement("option");
        option.value = valueFn(row);
        option.innerText = labelFn(row);
        filter.append(option);
    }
}

async function resetTeamsList() {
    await resetFilterOptions("teams-filter", TABLE_NAMES.team, 
        (t : Team) => t.teamCode, 
        (t : Team) => `${t.fullName} (${t.teamCode})`);
}

async function resetPositionList() {
    await resetFilterOptions("position-filter", TABLE_NAMES.position, 
        (p : Position) => p.positionCode, 
        (p : Position) => `${p.fullName} (${p.positionCode})`);
}

async function resetCollegeList() {
    await resetFilterOptions("college-filter", TABLE_NAMES.college, 
        (c : College) => c.collegeName, 
        (c : College) => c.collegeName);
}

async function resetPlayersTable() {
    document.getElementById("roster-table-data").replaceChildren();

    const allPlayers : Player[] = await getAllFromTable(TABLE_NAMES.player.name);
    const allPlayerTeams : PlayerTeam[] = await getAllFromTable(TABLE_NAMES.playerTeams.name);
    for(let i = 0; i < allPlayers.length; ++i) {
        const player : Player = allPlayers[i];
        const playerTeam : PlayerTeam = allPlayerTeams.filter(function (pt : PlayerTeam) {
            return pt.playerId === player.playerId;
        })[0];
        const playerRow : HTMLTableRowElement = document.createElement("tr");
        playerRow.dataset.rowId = player.playerId;
        
        appendTableData(playerRow, playerTeam.teamCode, "team-id");
        appendTableData(playerRow, player.position, "position");
        appendTableData(playerRow, player.jerseyNumber);
        appendTableData(playerRow, player.lastName);
        appendTableData(playerRow, player.firstName);
        appendTableData(playerRow, player.height);
        appendTableData(playerRow, player.weight);
        appendTableData(playerRow, player.college, "college");
        appendTableData(playerRow, player.firstYear);
        appendTableData(playerRow, player.birthDate);
        playerRow.className = "player";

        document.getElementById("roster-table-data").appendChild(playerRow);
    }
}

function initFilters(allFilters : NodeListOf<HTMLSelectElement>) {
    for(let i = 0; i < allFilters.length; ++i) {
        const filter : HTMLSelectElement = allFilters[i];
        filter.addEventListener("change", function () { filterPlayers(allFilters); });
    }
}

function filterPlayers(allFilters : NodeListOf<HTMLSelectElement>) {
    document.getElementById("roster-table").style.display = "none";
    document.getElementById("loading-indicator").style.display = "table";
    
    const allPlayerRows : NodeListOf<HTMLTableRowElement> = document.querySelectorAll("#roster-table-data tr");
    for(let i = 0; i < allPlayerRows.length; ++i) {
        const playerRow : HTMLTableRowElement = allPlayerRows[i];

        let match = true;
        for(let j = 0; j < allFilters.length; ++j) {
            const filter : HTMLSelectElement = allFilters[j];

            const filterValClass : string = filter.dataset.valueClass;
            const filterSelectedVal : string = filter.value;
            const showAll : boolean = filterSelectedVal.trim().toLowerCase() === "all";
            const playerColVal = (playerRow.querySelector(`.${filterValClass}`) as HTMLElement).innerText;

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
    const contextMenu = document.getElementById("context-menu") as HTMLElement;
    const allPlayers = document.getElementsByClassName("player") as HTMLCollectionOf<HTMLTableRowElement>;
    for(let i = 0; i < allPlayers.length; ++i) {
        const player : HTMLTableRowElement = allPlayers[i];
        player.addEventListener("contextmenu", function (e : MouseEvent) {
            e.preventDefault();
            
            const { clientX: mouseX, clientY: mouseY } = e;
            const { x: normalizedX, y: normalizedY } : Position2D 
                = normalizePosition(player, contextMenu, mouseX, mouseY);

            contextMenu.style.left = `${normalizedX}px`;
            contextMenu.style.top = `${normalizedY}px`;

            contextMenu.classList.add("visible");
            contextMenu.dataset.playerId = player.dataset.rowId;
        });
    }

    document.querySelector("body").addEventListener("click", function (e : MouseEvent) {
        if((e.target as HTMLElement).offsetParent != contextMenu) {
            contextMenu.classList.remove("visible");
        }
    });

    const editPlayer : HTMLElement = document.getElementById("edit-player");
    editPlayer.addEventListener("click", function (e : MouseEvent) {
        routeToEditPlayer(contextMenu.dataset.playerId, editPlayer);
    });
    editPlayer.addEventListener("auxclick", function (e : MouseEvent) {
        routeToEditPlayer(contextMenu.dataset.playerId, editPlayer, true);
    });
}

function routeToEditPlayer(playerId : string, editPlayer : HTMLElement, newTab : boolean = false) {
    const a : HTMLAnchorElement = document.createElement("a");
    a.href = editPlayer.dataset.urlTemplate.replaceAll("$", playerId);
    if(newTab) {
        a.target = "_blank";
    }
    a.click();
}

function normalizePosition(node : Element, menu : Element, mouseX : number, mouseY : number) : Position2D {
    const {
        left: scopeOffsetX,
        top: scopeOffsetY
    } : DOMRect = node.getBoundingClientRect();

    const scopeX : number = mouseX - scopeOffsetX;
    const scopeY : number = mouseY - scopeOffsetY;

    const boundX : boolean = scopeX + menu.clientWidth > node.clientWidth;
    const boundY : boolean = scopeY + menu.clientHeight > node.clientHeight;
    let normalizedX : number = mouseX;
    let normalizedY : number = mouseY;
    if(boundX) {
        normalizedX = scopeOffsetX + node.clientWidth - menu.clientWidth;
    }
    if(boundY) {
        normalizedY = scopeOffsetY + node.clientHeight - menu.clientHeight;
    }

    return { x: normalizedX, y: normalizedY };
}