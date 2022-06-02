const path = require('path');

module.exports = {
    entry: {
        data: './ts/data.ts',
        editPlayer: './ts/edit-player.ts',
        players: './ts/players.ts',
        relegationSim: './ts/relegation-sim.ts',
    },
    devtool: "inline-source-map",
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                use: 'ts-loader',
                exclude: /node_modules/,
            },
        ],
    },
    resolve: {
        extensions: [".tsx", ".ts", ".js"],
    },
    output: {
        filename: '[name].js',
        path: path.resolve(__dirname, 'static/js'),
        libraryTarget: "var",
        library: "[name]"
    },
};