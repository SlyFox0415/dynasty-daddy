
from datetime import date
from Constants import SupportedPlayedWith, SupportedColleges, SupportedTeams
import random
import json
import os
import psycopg2

SupportedYTypes = ['team', 'team', 'team', 'team', 'stat',
                   'stat', 'stat', 'stat', 'stat', 
                   'playedWith']

SupportedXTypes = ['award', 'award', 'award', 'stat', 'stat', 'stat', 'stat', 'stat', 'stat', 'playedWith']

SupportedJerseyNumbers = ['12', '18', '89', '85', '26', '22', '27', '95',
                          '97', '98', '91', '90', '23', '25', '2', '35', '30', '38', '59', '69']

SupportedAwards = ['roty', 'mvp', 's_mvp', 'sb']

SupportedStats = ['rushYd1000',
                  'recYd1000',
                  'passYd4000',
                  'rushTds10',
                  'recTds10',
                  'passingTds30',
                  'ints10',
                  '1Pass1RecG',
                  '1Rush1RecG',
                  '3Pass1RushG',
                  '70RushRecG',
                  '80Rush200PassG',
                  'maxInt4',
                  'maxRec12',
                  'maxTdPass5',
                  'maxTdRec3',
                  'maxTdRush3',
                  'maxYdRec200',
                  'maxYdPass300',
                  'rec100',
                  'specialTds2',
                  'defTkl100',
                  'defFF4',
                  'defSacks10',
                  'defInts6',
                  'defTds2',
                  'defSafe1',
                  'max10TklG',
                  'maxIntsG',
                  'maxFFG',
                  'max2SacksG',
                  'maxDefTdG',
                  '1Sack1IntG',
                  'only1Team',
                  '1stRdPick',
                  'top10Pick',
                  'over100Pick',
# duplicates to increase the odds
                  'only1Team',
                  '1stRdPick',
                  'top10Pick',
                  'over100Pick',
                  '1stRdPick',
                  'top10Pick',
                  'over100Pick']

#   'maxYdRush200',

def SetNewPlayerGrid():

    # Connect to local test database
    # conn = psycopg2.connect(
    #     database="dynasty_daddy", user='postgres', password='postgres', host='localhost', port='5432'
    # )

    conn = psycopg2.connect(
        database=os.environ['DO_DATABASE'], user=os.environ['DO_DB_USER'], password=os.environ[
            'DO_DB_PASSWORD'], host=os.environ['DO_DB_HOST'], port=os.environ['DO_DB_PORT']
    )

    # Setting auto commit false
    conn.autocommit = True

    # Creating a cursor object using the cursor() method
    cursor = conn.cursor()
    cursor.execute('SELECT * FROM player_grid;')
    rows = cursor.fetchall()
    
    # Check if there is a custom grid defined
    cursor.execute(
        'SELECT config_value FROM config WHERE config_key = \'daily_grid_custom_grid\';')
    customGridString = cursor.fetchall()
    
    if customGridString[0][0] != '{}':
        customGrid = json.loads(customGridString[0][0])
        output_dict = customGrid
        setTodaysGridStatement = '''UPDATE config
            SET
            config_value = \'{}\' WHERE config_key = \'daily_grid_custom_grid\';'''
        cursor.execute(setTodaysGridStatement)
    else:
        # filter out yesterdays teams from teams
        cursor.execute(
            'SELECT config_value FROM config WHERE config_key = \'daily_grid\';')
        yesterdaysGridStr = cursor.fetchall()
        yesterdaysGrid = json.loads(yesterdaysGridStr[0][0])
        todaysSupportedTeams = filterOutTeams(yesterdaysGrid)
        current_date = date.today()
        
        # # if sunday, add extra challenge
        # if current_date.weekday() == 6:
        #     filterPos = random.choice(PositionFilters)
        #     rows = [x for x in rows if filterPos in x[5]]
        #     print(rows[0], filterPos)
        
        iter = 0        
        while True and iter < 100:
            selectedTeams = random.sample(todaysSupportedTeams, 6)
            formattedGrid = [{"type": "team", "value": value}
                            for value in selectedTeams]
            # Y axis wild card
            if (random.choice([True])):
                # on saturday put a college team
                if current_date.weekday() == 5:
                    selectedWildcard = 'college'
                else:
                    selectedWildcard = random.choice(SupportedYTypes)
                if selectedWildcard is 'college':
                    selectedCollege = random.choice(SupportedColleges)
                    formattedGrid[5] = {
                        "type": "college", "value": selectedCollege}
                if selectedWildcard is 'jersey_number':
                    selectedNumber = random.choice(SupportedJerseyNumbers)
                    formattedGrid[5] = {
                        "type": "jersey_number", "value": selectedNumber}
                if selectedWildcard is 'stat':
                    selectedStat = random.choice(SupportedStats)
                    formattedGrid[5] = {"type": "stat", "value": selectedStat}
                if selectedWildcard is 'draftedBy':
                    selectedTeam = random.choice(SupportedTeams)
                    formattedGrid[5] = {"type": "draftedBy", "value": selectedTeam}
                if selectedWildcard is 'playedWith':
                    selectedPlayer = random.choice(SupportedPlayedWith)
                    formattedGrid[5] = {"type": "playedWith", "value": selectedPlayer}
            if (random.choice([True])):
                selectedWildcard = random.choice(SupportedXTypes)
                if selectedWildcard is 'stat':
                    selectedStat = random.choice(SupportedStats)
                    while selectedStat == formattedGrid[5]['value']:
                        selectedStat = random.choice(SupportedStats)
                    formattedGrid[2] = {"type": "stat", "value": selectedStat}
                if selectedWildcard is 'award':
                    selectedAward = random.choice(SupportedAwards)
                    formattedGrid[2] = {"type": "award", "value": selectedAward}
                if selectedWildcard is 'playedWith':
                    selectedPlayer = random.choice(SupportedPlayedWith)
                    while selectedPlayer == formattedGrid[5]['value']:
                        selectedPlayer = random.choice(SupportedPlayedWith)
                    formattedGrid[2] = {"type": "playedWith", "value": selectedPlayer}
            xAxis = formattedGrid[0:3]
            yAxis = formattedGrid[3:6]
            iter = iter + 1
            if ValidateActualSolutionExists(rows, xAxis, yAxis):
                break

        target_date = date(2023, 7, 1)

        gridNumber = (current_date - target_date).days + 1

        output_dict = {
            'xAxis': xAxis,
            'yAxis': yAxis,
            'id': gridNumber
        }

    jsonGrid = json.dumps(output_dict)
    setTodaysGridStatement = '''UPDATE config
        SET
        config_value = %s WHERE config_key = \'daily_grid\';'''
    cursor.execute(setTodaysGridStatement, (str(jsonGrid),))

    archiveGridironStatement = '''INSERT INTO historical_gridirons (daily_grid)
                    VALUES (%s)'''
    cursor.execute(archiveGridironStatement, (str(jsonGrid),))


def ValidateActualSolutionExists(rows, xAxis, yAxis):
    playerIds = []
    playerNames = []
    for x in xAxis:
        for y in yAxis:
            for row in rows:
                yValue = getValueToValidate(row, y['type'])
                xValue = getValueToValidate(row, x['type'])
                if y['value'] in yValue and x['value'] in xValue and row[0] not in playerIds:
                    playerIds.append(row[0])
                    playerNames.append(row[1])
                    break
    if len(playerIds) < 9:
        return False
    return True

# returns array of values to check if player is valid
def getValueToValidate(row, type):
    if type is 'jersey_number':
        return row[2]
    elif type is 'college':
        return [row[6]]
    elif type is 'draftedBy':
        return [row[17]]
    elif type is 'playedWith':
        return row[18] if row[18] != None else []
    elif type is 'award':
        awards = []
        awards_json = row[8]
        for key, value in awards_json.items():
            if value is not '':
                awards.append(key)
        return awards
    elif type is 'stat':
        stats = []
        stats_json = row[11]
        for key, value in stats_json.items():
            if value:
                stats.append(key)
        if len(set(row[3])) == 1:
            stats.append('only1Team')
        if row[16] is not None:
            if row[16] <= 32:
                stats.append('1stRdPick')
            if row[16] <= 10:
                stats.append('top10Pick')
            if row[16] >= 100:
                stats.append('over100Pick')
        return stats
    else:
        return row[3]


def filterOutTeams(json_data):
    yesterdayTeams = [item['value'] for item in json_data['xAxis'] +
                      json_data['yAxis'] if item['type'] == 'team']
    todaysTeams = [
        team for team in SupportedTeams if team not in yesterdayTeams]
    return todaysTeams

# SetNewPlayerGrid()
