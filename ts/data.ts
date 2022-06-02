import { showLoadingIndicator, shallowEqual, downloadFile } from './common';
import { DataPacket, Player, PlayerTeam } from './data-models';
import { clearTable, getAllFromTable, getAllTables, resetDb, TABLE_NAMES, updateRow, writeAllToTable, writeToTable } from "./idb-utils";

export default function initData() {
    initImportButton("import-add-button", async function (data : DataPacket) {
        await writeAllData(data);
    });
    initImportButton("import-replace-button", async function (data : DataPacket) {
        await resetDb();
        await writeAllData(data);
    });
    initImportButton("import-update-button", async function (data : DataPacket) {
        await updateAllData(data);
    });

    document.getElementById("reset-db-button").addEventListener("click", async function (e : MouseEvent) {
        await showLoadingIndicator(async function () {
            await resetDb();
        });
    });

    document.getElementById("download-db-button").addEventListener("click", async function (e : MouseEvent) {
        await showLoadingIndicator(downloadDb);
    });

    document.getElementById("download-players-button").addEventListener("click", async function (e : MouseEvent) {
        await showLoadingIndicator(async function () {
            await downloadTable(TABLE_NAMES.player.name);
        });
    });

    document.getElementById("import-file").addEventListener("change", validateDbJson);
}

function initImportButton(id : string, callback : (data : DataPacket) => void) {
    document.getElementById(id).addEventListener("click", async function (e : MouseEvent) {
        document.getElementById("loading-indicator").style.display = "table";

        const importModeNode : HTMLInputElement = document.querySelector('input[name="data-sources"]:checked');
        if(importModeNode) {
            const importMode : string = importModeNode.value;
            if(importMode === "scrape-pfr") {
                fetch("/data/scrape", {
                    headers: {
                        "Content-Type": "application/json",
                        "Accept": "application/json"
                    }
                }).then(response => response.json()).then(
                    async function(data : DataPacket) {
                        console.log(data);
                        await callback(data);
                        document.getElementById("loading-indicator").style.display = "none";
                    }
                );
            } else if(importMode === "upload-json") {
                const input = <HTMLInputElement>(document.getElementById("import-file"));
                try {
                    const file : File = input.files[0];
                    const reader = new FileReader();
                    reader.onload = async function(e : ProgressEvent<FileReader>) {
                        const fileJson = <string>(e.target.result);
                        const fileObj : DataPacket = JSON.parse(fileJson);
                        await callback(fileObj);
                        document.getElementById("loading-indicator").style.display = "none";
                    }

                    reader.readAsText(file, "UTF-8");
                } catch(error) {
                    console.log(error);
                }
            }
        }
    });
}

async function writeAllData(data : DataPacket) {
    for(let [tableName, tableData] of Object.entries(data)) {
        await writeAllToTable(tableName, tableData);
    }
}

async function updateAllData(data : DataPacket) {
    // for efficiency, do players and player teams with the same iterator
    const allPlayers : Player[] = await getAllFromTable(TABLE_NAMES.player.name);
    const allPlayerTeams : PlayerTeam[] = await getAllFromTable(TABLE_NAMES.playerTeams.name);
    console.log(allPlayerTeams);
    const dataPlayers : Player[] = data.player;
    for(let i = 0; i < dataPlayers.length; ++i) {
        const row : Player = dataPlayers[i];
        const filter : { [key : string] : string } = { playerId: row.playerId };
        const playerMatch : Player = allPlayers.filter(function (p : Player) { return p.playerId === row.playerId})[0];
        const teamMatch : PlayerTeam = allPlayerTeams.filter(function (t : PlayerTeam) { return t.playerId === row.playerId})[0];
        if(playerMatch) {
            if(!shallowEqual(playerMatch, row)) {
                console.log("updating player: " + row.playerId);
                await updateRow(TABLE_NAMES.player.name, filter, row);
            }
        } else {
            await writeToTable(TABLE_NAMES.player.name, row);
        }
        if(teamMatch) {
            const dataTeam : PlayerTeam = data.playerTeams.filter(function (t : PlayerTeam) { return t.playerId === row.playerId; })[0];
            if(!shallowEqual(teamMatch, dataTeam)) {
                console.log("updating player team: " + dataTeam.playerId);
                await updateRow(TABLE_NAMES.playerTeams.name, filter, dataTeam);
            }
        } else {
            await writeToTable(TABLE_NAMES.player.name, row);
        }
    }

    await updateTableData(data.team, TABLE_NAMES.team.name, "teamCode");
    await updateTableData(data.position, TABLE_NAMES.position.name, "positionCode");
    await updateTableData(data.college, TABLE_NAMES.college.name, "collegeName");

    // can't update retired numbers because no unique key (my bad)
    await clearTable(TABLE_NAMES.retiredNumbers.name);
    await writeAllToTable(TABLE_NAMES.retiredNumbers.name, data.retiredNumbers);
}

async function updateTableData<T extends object>(tableData : T[], tableName : string, idCol : string) {
    const allExistingRows : T[] = await getAllFromTable(tableName);

    for(let i = 0; i < tableData.length; ++i) {
        const row : T = tableData[i];
        const filter : { [key : string] : any } = { };
        filter[idCol] = row[idCol];

        const match : T = allExistingRows.filter(function (r : T) { return r[idCol] === row[idCol]})[0];
        if(match) {
            if(!shallowEqual(match, row)) {
                console.log("updating " + tableName + " " + row[idCol]);
                await updateRow(tableName, filter, row);
            }
        } else {
            await writeToTable(tableName, row);
        }
    }
}

async function downloadDb() {
    const data : DataPacket = await getAllTables();
    const jsonData : string = JSON.stringify(data, null, 4);
    const content = "data:text/json;charset=utf-8," + jsonData;
    downloadFile("nfltools_db_tables.json", content);
}

async function downloadTable(tableName : string) {
    const allRows : any[] = await getAllFromTable(tableName);
    const csvRows : string[][] = [];

    const headerRow : string[] = [];
    for(let [fieldName, fieldVal] of Object.entries(allRows[0])) {
        headerRow.push(fieldName);
    }
    csvRows.push(headerRow);

    for(let i = 0; i < allRows.length; ++i) {
        const row : string[] = [];
        for(let [fieldName, fieldVal] of Object.entries(allRows[i])) {
            row.push(fieldVal.toString());
        }
        csvRows.push(row);
    }

    const csvContent = "data:text/csv;charset=utf-8," + csvRows.map((e : string[]) => e.join(",")).join("\n");
    downloadFile("nfltools_players.csv", csvContent);
}

function validateDbJson(event : Event) {
    if(!(event.target instanceof HTMLInputElement)) {
        return;
    }

    document.getElementById("loading-indicator").style.display = "table";

    const input : HTMLInputElement = event.target;
    const status : HTMLElement = document.querySelector(".import-status");
    const uploadOption = document.getElementById("upload-json") as HTMLInputElement;
    if("files" in input && input.files.length > 0) {
        const file : File = input.files[0];
        const reader = new FileReader();
        reader.onload = function(e : ProgressEvent<FileReader>) {
            const valid : boolean = isDbJsonValid(e);
            if(valid) {
                status.style.color = "green";
                status.innerText = "upload is valid";
                uploadOption.removeAttribute("disabled");
            } else {
                status.style.color = "red";
                status.innerText = "upload is invalid";
                uploadOption.setAttribute("disabled", "true");
                uploadOption.checked = false;
            }
        }

        reader.readAsText(file, "UTF-8");
    } else {
        status.style.color = "red";
        status.innerText = "no data uploaded";
        uploadOption.setAttribute("disabled", "true");
    }

    document.getElementById("loading-indicator").style.display = "none";
}

function isDbJsonValid(e : ProgressEvent<FileReader>) : boolean {
    try {
        const fileJson = e.target.result as string; 
        const fileObj : DataPacket = JSON.parse(fileJson);
        
        // verify all tables exist 
        for(let [key, tableName] of Object.entries(TABLE_NAMES)) {
            if(!(tableName.name in fileObj)) {
                return false;
            }
        }

        return true;
    } catch(error) {
        console.log(error);
        return false;
    }
}