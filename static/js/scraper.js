function initScraper() {
    $("button#scrape-button").on("click", function (e) {
        $.get("/scraper/data", function(data, status) {
            console.log(data);
        })
    });
    $("button#test-db-button").on("click", async function (e) {
        await testIdb();
    });
}