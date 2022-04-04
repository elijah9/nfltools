function initScraper() {
    $("button#scrape-button").on("click", function (e) {
        $.get("/scraper/data", function(data, status) {
            writeAllToStore(TABLE_NAMES.team, data.teams);
            writeAllToStore(TABLE_NAMES.player, data.players);
            console.log("scrape results written to db");
        })
    });
    $("button#reset-db-button").on("click", function (e) {
        console.log("resetting db...");
        resetDb();
        console.log("done resetting db");
    });
    $("button#print-db-button").on("click", function (e) {
        console.log("printing db...");
        for(const [tableNameId, tableName] of Object.entries(TABLE_NAMES)) {
            readAllFromStore(tableName, function(allRows) {
                console.log(tableName);
                console.log(allRows);
            })
        }
    });
}