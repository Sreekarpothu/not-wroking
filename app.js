const express = require('express')
const {open} = require('sqlite')
const sqlite3 = require('sqlite3')
const path = require('path')
const databasePath = path.join(__dirname, 'covid19India.db')
const app = express()
let database = null

const initializeDbAndServer = async () => {
  try {
    database = await open({
      filename: databasePath,
      driver: sqlite3.Database,
    })
    app.listen(3000, () =>
      console.log('Server Running at http://localhost:3000/'),
    )
  } catch (error) {
    console.log(`DB Error: ${error.message}`)
    process.exit(1)
  }
}
initializeDbAndServer()

const convertStateDbObjectToResponseObject = dbObject => {
  return {
    stateId: dbObject.state_id,
    stateName: dbObject.state_name,
    population: dbObject.population,
  }
}
const convertDistrictDbObjectToResponseObject = dbObject => {
  return {
    districtId: dbObject.district_id,
    districtName: dbObject.district_name,
    stateId: dbObject.state_id,
    cases: dbObject.cases,
    cured: dbObject.cured,
    active: dbObject.cured,
    deaths: dbObject.deaths,
  }
}

app.get('/states/', async (request, response) => {
  const getStateQuery = `
  Select
  *
  from
  state
  order by
  state_id;`
  const stateArray = await database.all(getStateQuery)
  response.send(
    stateArray.map(eachState =>
      convertStateDbObjectToResponseObject(eachState),
    ),
  )
})

app.get('/states/:stateId', async (request, response) => {
  const {stateId} = request.params
  const getStateQuery = `
  select
  *
  from state
  where
  state_id = ${stateId};`
  const state = await database.get(getStateQuery)
  response.send(convertStateDbObjectToResponseObject(state))
})

app.post('/districts/', async (request, response) => {
  const createDistrict = request.body
  const {districtName, stateId, cases, cured, active, deaths} = createDistrict
  const newDistrict = `
  INSERT INTO
  district (district_name,state_id,cases,cured,active,deaths)
  VALUES
  ('${districtName}',
  ${stateId},
  ${cases},
  ${cured},
  ${active},
  ${deaths});`
  const addDistrict = await database.run(newDistrict)
  const district = addDistrict.lastId
  response.send('District Successfully Added')
})

app.get('districts/:districtId/', async (request, response) => {
  const {districtId} = request.params
  const getDistrictIdQuery = `
  select
  *
  from 
  district
  where
  district_id = ${districtId};`
  const district = await database.get(getDistrictIdQuery)
  response.send(convertDistrictDbObjectToResponseObject(district))
})

app.delete('/districts/:districtId/', async (request, response) => {
  const {districtId} = request.params
  const deleteDistrict = `
  DELETE
  FROM district
  where district_id = ${districtId};`
  await database.run(deleteDistrict)
  response.send('District Removed')
})

app.put('/districts/:districtId/', async (request, response) => {
  const {districtId} = request.params
  const districtDetails = request.body
  const {districtName, stateId, cases, cured, active, deaths} = districtDetails
  const updateDistrict = `
  UPDATE
  district
  set
  district_name = '${districtName}',
  state_id= ${stateId},
  cases= ${cases},
  cured = ${cured},
  active = ${active},
  deaths = ${deaths}
  where district_id = ${districtId};`
  await database.run(updateDistrict)
  response.send('District Details Updated')
})

app.get('states/:stateId/stats/', async (request, response) => {
  const {stateId} = request.params
  const getStateQuery = `
  select sum(cases) as cases.
  sum(cured) as cured,
  sum(active) as active,
  sum(deaths) as deaths
  from distict
  where state_id = ${stateId};`
  const stateReport = await database.get(getStateQuery)
  const resultReport = convertStateDbObjectToResponseObject(stateReport)
  response.send(resultReport)
})

app.get('/districts/:districtId/details/', async (request, response) => {
  const {districtId} = request.params
  const stateDetails = `
  select state_name
  from state join district
  on state.state_id = district.state_id
  where district.district_id = ${districtId};`
  const stateName = await database.get(stateDetails)
  response.send({stateName: stateName.state_name})
})

module.export = app

//https://github.com/Sreekarpothu/not-wroking.git
//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