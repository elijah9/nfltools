async function initScraper() {
    document.getElementById("scraper-buttons").style.display = "block";

    document.getElementById("scrape-button").addEventListener("click", async function (e) {
        document.getElementById("loading-indicator").style.display = "table";
        fetch("/scraper/data").then(response => response.json()).then(async function(data) {
            console.log(data);
            
            await writeAllToTable(TABLE_NAMES.team, data.teams);
            await writeAllToTable(TABLE_NAMES.player, data.players);
            await writeAllToTable(TABLE_NAMES.playerTeams, data.playerTeams);
            await writeAllToTable(TABLE_NAMES.retiredNumbers, data.retiredNumbers);
            await writeAllToTable(TABLE_NAMES.position, data.positions);
            await writeAllToTable(TABLE_NAMES.college, data.colleges);

            document.getElementById("loading-indicator").style.display = "none";
        });
    });

    document.getElementById("reset-db-button").addEventListener("click", async function (e) {
        await showLoadingIndicator(async function () {
            await resetDb();
            location.reload();
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

async function showLoadingIndicator(work) {
    document.getElementById("loading-indicator").style.display = "table";
    await work();
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