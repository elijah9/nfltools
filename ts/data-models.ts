export class DataPacket {
    team : Team[] = [];
    player : Player[] = [];
    playerTeams : PlayerTeam[] = [];
    retiredNumbers : RetiredNumber[] = [];
    position : Position[] = [];
    college : College[] = [];

    constructor() { }
};

export class Player {
    playerId : string;
    lastName : string;
    firstName : string;
    jerseyNumber : number;
    position : string;
    height : string;
    weight : number;
    college : string;
    birthDate : Date;
    firstYear : number;
    avRating : number;
};

export class AssignablePlayer extends Player {
    teamCode : string;
}

export type Position = {
    positionCode : string;
    fullName : string;
    unit : string;
    valid : boolean;
};

export type Team = {
    teamCode : string;
    fullName : string;
};

export type PlayerTeam = {
    playerId : string;
    teamCode : string;
};

export type RetiredNumber = {
    teamCode : string;
    jerseyNumber : number;
    playerName : string;
};

export type College = {
    collegeName : string;
};