function testIdb() {
    resetDb();
    writeToStore(TABLE_NAMES.player, {
        playerName: "test"
    });
    readAllFromStore(TABLE_NAMES.player, function(players) {
        console.log(players);
    });
}