function initScraper() {
    $("button#scrape-button").on("click", function (e) {
        console.log("button clicked");
        $.get("/scraper/data", function(data, status) {
            console.log(data);
        })
    });
}