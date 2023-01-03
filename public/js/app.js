
const dataGetter = setInterval(async () => {
    var data = await $.post('/get-data', async (data) => {
        return await data
    })
    data = data.data
    if(data == null){
        return
    }
    // console.log(data)
    for(var i = 0; i < data.length; i++){
        var val = () => {
            if(data[i].value){
                return 'available'
            }else{
                return 'not-available'
            }
        }
        var element = $('#' + data[i].name)
        if(element.length){
            element.removeClass('available')
            element.removeClass('not-available')
            element.addClass(val)
        }
    }
}, 1000)