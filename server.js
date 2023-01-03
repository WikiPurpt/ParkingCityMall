const express = require('express')
const fs = require('fs')

const app = express()

var DEFAULT_USERNAME = 'admin';
var DEFAULT_PASSWORD = 'abc123';
var PARKINGS_DIRECTORY = "./parkings"

app.use(express.static(__dirname + '/public'))
app.set('view-engine', 'ejs')

var prevData = {}

var counter = setInterval(async () => {

    var allData = await getData()

    if(allData == null) return

    if(Object.entries(prevData).length === 0){
        prevData = allData
    }else{
        for(var i = 0; i < prevData.length; i++){
            if(prevData[i].name == allData[i].name){
                count(prevData[i].value, allData[i].value)
            }
        }
    }
    prevData = allData

}, 5000)

app.get('/', (req, res) => {
    res.render('pages/index.ejs')
})
app.get('/aboutus', (req, res) => {
    res.render('pages/aboutus.ejs')
})

app.get('/login', (req, res) => {
    var message = req.query.message;
    res.render('pages/login.ejs', {message: message})
})

app.get('/dashboard', (req, res) => {
    var authenticated = req.query.authenticated
    if(authenticated != 'true'){
        res.redirect('/')
    }
    res.render('pages/dashboard.ejs')
})

app.post('/login', express.json(), express.urlencoded(), async (req, res) => {
    var username = req.body.username
    var password = req.body.password

    if(username == DEFAULT_USERNAME && password == DEFAULT_PASSWORD){
        res.redirect('/dashboard?authenticated=true')
    }else{
        res.redirect('/login?message=error')
    }
})

app.post('/get-data', async (req, res) => {
    if(!fs.existsSync('./data.txt')){
        fs.writeFileSync('./data.txt')
    }
    var data = await getData()
    res.send({data: data})
})



app.post('/upload-data', express.json(), express.urlencoded(), async (req, res) => {
    var dataObj = await req.query
    console.log(dataObj)
    var names = Object.keys(dataObj)
    var newData = await setData(names, dataObj)
    saveData(newData)
    res.end()
})

app.get('/upload-availability', (req, res) => {
    var data = Object.keys(req.query)
    //console.log(data[0])
    if(!fs.existsSync(PARKINGS_DIRECTORY + '/' + data[0] + '.txt')){
        fs.writeFileSync(PARKINGS_DIRECTORY + '/' + data[0] + '.txt', '')
    }
    fs.writeFileSync(PARKINGS_DIRECTORY + '/' + data[0] + '.txt', req.query[data[0]])
    res.send('RECEIVED')
})
app.get('/get-parking-names', async (req, res) => {
    var parkingNames = await fs.readdirSync(PARKINGS_DIRECTORY, async (err, files) => {
        return await files
    })
    parkingNames = parkingNames.map(elem => elem.replace('.txt', ''))
    res.send({names: parkingNames})
})
app.get('/get-parking-availabilty', async (req, res) => {
    // console.log(req.query)
    var parkingValue = await fs.readFileSync(PARKINGS_DIRECTORY + '/'+ req.query.name + '.txt', 'utf8')
    res.send({availability: parkingValue})
})





app.get('/get-statistics', async (req, res) => {
    var date = req.query.date
    var data = await getStatistics(date)
    var today = nullToZero(data.today)
    var yesterday = nullToZero(data.yesterday)
    var twoDays = nullToZero(data.twoDays)
    var month = nullToZero(data.month)

    var jan = data.jan
    var feb = data.feb
    var mar = data.mar
    var apr = data.apr
    var may = data.may
    var jun = data.jun
    var jul = data.jul
    var aug = data.aug
    var sep = data.sep
    var oct = data.oct
    var nov = data.nov
    var dec = data.dec

    res.send({
        today: today, 
        yesterday: yesterday, 
        twoDays: twoDays,
        month: month,
        jan: jan, feb: feb, mar: mar, apr: apr, may: may, jun: jun, jul: jul, aug: aug, sep: sep, oct: oct, nov: nov, dec: dec
    })
})

function nullToZero(data){
    return data == null ? 0 : data
}

async function getStatistics(date){
    var records = await getRecord()
    var months = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec']
    var data = {}

    var yesterday = new Date(date)
    var twoDays = new Date(date)
    yesterday.setDate(yesterday.getDate() - 1)
    twoDays.setDate(twoDays.getDate() - 2)

    var todayDate = date
    var yesterdayDate = yesterday.toISOString().slice(0, 10)
    var twoDaysDate = twoDays.toISOString().slice(0, 10)

    data['today'] = records[todayDate]
    data['yesterday'] = records[yesterdayDate]
    data['twoDays'] = records[twoDaysDate]
    data['month'] = getMonthRecord(records, date)

    for(var i = 0; i < months.length; i++){
        var month = i + 1
        var monthString = month > 9 ? '' + month : '0' + month
        var monthlyDate = date.slice(0, 4) + '-' + monthString + '-01'
        data[months[i]] = getMonthRecord(records, monthlyDate)
    }

    return data
}

function getMonthRecord(records, date){
    var value = 0
    Object.keys(records).forEach((keys) => {
        var dateMonth = date.slice(0, 7)
        var month = keys.slice(0, 7)
        if(dateMonth == month){
            value += records[keys]
        }
    })
    return value
}

async function dataToStringData(data){
    var stringData = ''
    for(var i = 0; i < data.length; i++){
        stringData += `${data[i].name}=${data[i].value}`
        if(i + 1 < data.length){
            stringData += '\n'
        }
    }
    return stringData
}

async function saveData(data){
    if(!fs.existsSync('./data.txt')){
        fs.writeFileSync('./data.txt')
    }
    var dataToWrite = await dataToStringData(data)
    fs.writeFileSync('./data.txt', dataToWrite)
}

async function setData(keyArr, dataObj){
    var allData = await getData()
    if(allData == null){
        return null
    }
    var breakTriggered = false
    for(var i = 0; i < keyArr.length; i++){
        breakTriggered = false
        for(var j = 0; j < allData.length; j++){
            if(allData[j].name == keyArr[i]){
                allData[j].value = dataObj[keyArr[i]]
                breakTriggered = true
                break;
            }
        }
        if(!breakTriggered){
            allData.push({
                name: keyArr[i],
                value: dataObj[keyArr[i]]
            })
        }
    }
    return allData
}

async function getData(){
    var data = await fs.readFileSync('./data.txt', 'utf8').split("\n")
    if(data == ''){
        console.log('No data')
        return null
    }
    var arrObj = arrayToArrayObject(data)
    return arrObj
}

function arrayToArrayObject(arr){
    var arrObj = []
    for(let i = 0; i < arr.length; i++){
        var obj = {}
        obj['name'] = arr[i].split("=")[0]
        obj['value'] = arr[i].split("=")[1].replace('\r', '') === 'true'

        arrObj.push(obj)
    }
    return arrObj
}

function arrayToObject(arr){
    var obj = {}
    for(let i = 0; i < arr.length; i++){
        obj[arr[i].split("=")[0]] = parseInt(arr[i].split("=")[1].replace('\r', ''))
    }
    return obj
}

function getRecord(){
    if(!fs.existsSync('./record.txt')){
        fs.writeFileSync('./record.txt')
    }
    var data = fs.readFileSync('./record.txt', 'utf8').split("\n")
    if(data == ''){
        console.log('No record')
        return null;
    }
    var arrObj = arrayToObject(data)
    return arrObj
}

async function incrementData(date){
    var records = await getRecord()
    if(!records[date]){
        records[0] = 0
    }
    records[date] += 1
    saveRecord(records)
}

function recordToStringRecord(record){
    var stringData = ''
    var i = 0
    Object.keys(record).forEach((key) => {
        stringData += `${key}=${record[key]}`
        if(i + 1 < Object.keys(record).length){
            i += 1
            stringData += '\n'
        }
    })
    return stringData
}

function saveRecord(record){
    if(!fs.existsSync('./record.txt')){
        fs.writeFileSync('./record.txt')
    }
    var dataToWrite = recordToStringRecord(record)
    fs.writeFileSync('./record.txt', dataToWrite)
}

function count(prevData, currentData){
    if(prevData && !currentData){
        var date = new Date().toISOString().slice(0,10)
         setTimeout(() => {
            incrementData(date)
         }, 100)
    }
}

app.listen(8080, '0.0.0.0')
