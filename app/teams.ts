const EASTERN_CONFERENCE = [
  {
    id: "ATL",
    name: "Atlanta Hawks",
    logo: require("../assets/images/team_logos/Atlanta Hawks.png"),
  },
  {
    id: "BOS",
    name: "Boston Celtics",
    logo: require("../assets/images/team_logos/Boston Celtics.png"),
  },
  {
    id: "BKN",
    name: "Brooklyn Nets",
    logo: require("../assets/images/team_logos/Brooklyn Nets.png"),
  },
  {
    id: "CHA",
    name: "Charlotte Hornets",
    logo: require("../assets/images/team_logos/Charlotte Hornets.png"),
  },
  {
    id: "CHI",
    name: "Chicago Bulls",
    logo: require("../assets/images/team_logos/Chicago Bulls.png"),
  },
  {
    id: "CLE",
    name: "Cleveland Cavaliers",
    logo: require("../assets/images/team_logos/Cleveland Cavaliers.png"),
  },
  {
    id: "DET",
    name: "Detroit Pistons",
    logo: require("../assets/images/team_logos/Detroit Pistons.png"),
  },
  {
    id: "IND",
    name: "Indiana Pacers",
    logo: require("../assets/images/team_logos/Indiana Pacers.png"),
  },
  {
    id: "MIA",
    name: "Miami Heat",
    logo: require("../assets/images/team_logos/Miami Heat.png"),
  },
  {
    id: "MIL",
    name: "Milwaukee Bucks",
    logo: require("../assets/images/team_logos/Milwaukee Bucks.png"),
  },
  {
    id: "NYK",
    name: "New York Knicks",
    logo: require("../assets/images/team_logos/New York Knicks.png"),
  },
  {
    id: "ORL",
    name: "Orlando Magic",
    logo: require("../assets/images/team_logos/Orlando Magic.png"),
  },
  {
    id: "PHI",
    name: "Philadelphia 76ers",
    logo: require("../assets/images/team_logos/Philadelphia 76ers.png"),
  },
  {
    id: "TOR",
    name: "Toronto Raptors",
    logo: require("../assets/images/team_logos/Toronto Raptors.png"),
  },
  {
    id: "WAS",
    name: "Washington Wizards",
    logo: require("../assets/images/team_logos/Washington Wizards.png"),
  },
];
const WESTERN_CONFERENCE = [
  {
    id: "DAL",
    name: "Dallas Mavericks",
    logo: require("../assets/images/team_logos/Dallas Mavericks.png"),
  },
  {
    id: "DEN",
    name: "Denver Nuggets",
    logo: require("../assets/images/team_logos/Denver Nuggets.png"),
  },
  {
    id: "GSW",
    name: "Golden State Warriors",
    logo: require("../assets/images/team_logos/Golden State Warriors.png"),
  },
  {
    id: "HOU",
    name: "Houston Rockets",
    logo: require("../assets/images/team_logos/Houston Rockets.png"),
  },
  {
    id: "LAC",
    name: "Los Angeles Clippers",
    logo: require("../assets/images/team_logos/Los Angeles Clippers.png"),
  },
  {
    id: "LAL",
    name: "Los Angeles Lakers",
    logo: require("../assets/images/team_logos/Los Angeles Lakers.png"),
  },
  {
    id: "MEM",
    name: "Memphis Grizzlies",
    logo: require("../assets/images/team_logos/Memphis Grizzlies.png"),
  },
  {
    id: "MIN",
    name: "Minnesota Timberwolves",
    logo: require("../assets/images/team_logos/Minnesota Timberwolves.png"),
  },
  {
    id: "NOP",
    name: "New Orleans Pelicans",
    logo: require("../assets/images/team_logos/New Orleans Pelicans.png"),
  },
  {
    id: "OKC",
    name: "Oklahoma City Thunder",
    logo: require("../assets/images/team_logos/Oklahoma City Thunder.png"),
  },
  {
    id: "PHX",
    name: "Phoenix Suns",
    logo: require("../assets/images/team_logos/Phoenix Suns.png"),
  },
  {
    id: "POR",
    name: "Portland Trail Blazers",
    logo: require("../assets/images/team_logos/Portland Trail Blazers.png"),
  },
  {
    id: "SAC",
    name: "Sacramento Kings",
    logo: require("../assets/images/team_logos/Sacramento Kings.png"),
  },
  {
    id: "SAS",
    name: "San Antonio Spurs",
    logo: require("../assets/images/team_logos/San Antonio Spurs.png"),
  },
  {
    id: "UTA",
    name: "Utah Jazz",
    logo: require("../assets/images/team_logos/Utah Jazz.png"),
  },
];
export const ALL_NBA_TEAMS = EASTERN_CONFERENCE.concat(WESTERN_CONFERENCE).sort(
  (a, b) => a.name.localeCompare(b.name),
);
