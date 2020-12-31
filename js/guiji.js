//获取认证码
var getAutho = function (){
    var Autho;
    $.ajax({
        type: "GET",
        async: false,
        url: 'https://api.jsciot.com/wm/web/rest/authorization/authorize?appId=szyxy&appSecret=12345678',
        success:function (res, textStatus){
            console.log(res);
            Autho = String(res.data.Authorization);
        }
    });
    return Autho;
}
//返回原始数据
var getData = function (did, begin, end){
    var trace;
    $.ajax({
        type : "GET",
        url : 'https://api.jsciot.com/wm/web/rest/v2/positionInfo/listAllRoundTrack?dids=' + did +
            '&orderByType=ASC&pageNo=1&pageSize=1000000&positionModes=1,2,3&processMode=1&showOriginalTrack=0' + '&utcBegin='+begin + '&utcEnd='+end,
        async : false,

        contentType : "application/x-www-form-urlencoded",
        crossDomain : true,
        beforeSend : function(xhr) {
            xhr.setRequestHeader("Authorization", getAutho());
        },
        success : function(res, textStatus)
        {
            trace = res;
        }
    });
    if (trace[0].rows.length===0){
        alert("there is no data, change another time");
    }
    else{
        return trace;
    }
};
//返回点的实体entities(array)
var getPointEntities = function (data){
    var entities=[];
    var points = data[0].rows;

    for (var i=0; i<points.length-1; i++){
        //1.判断是否为停留点
        var threshold=10;
        var p = points[i];
        var p2 = points[i+1];
        var td = dist(p.lngGps, p.latGps, p2.lngGps, p2.latGps);
        if(td<threshold){
            var color = Cesium.Color.RED;
            var pixelSize = 10;
        }
        else {
            var color = Cesium.Color.WHITE;
            var pixelSize = 5;
        }
        //2.添加属性信息
        var descriptionHtml ="<table>";
        for ( var key in p)
        {
            descriptionHtml+="<tr>"+"<td>"+String(key)+"</td>"+"<td>"+String(p[key])+"</td></tr>";
        }
        descriptionHtml+="</table>";
        let entity = new Cesium.Entity({
            id: p.id.toString(), //id一定要注意，entities里面其他entity的id不能相同。
            name: p.address,
            show:true,
            position:Cesium.Cartesian3.fromDegrees(p.lngGps, p.latGps),
            point:new Cesium.PointGraphics
            ({
                show : true,
                pixelSize :  pixelSize,
                color : color,
            }),
            description:descriptionHtml

        });
        entities.push(entity);
    }
    //3.补上最后一个点
    var end = points[points.length-1];
    var descriptionHtml ="<table>";
    for ( var key in p)
    {
        descriptionHtml+="<tr>"+"<td>"+String(key)+"</td>"+"<td>"+String(p[key])+"</td></tr>";
    }
    let entity = new Cesium.Entity({
        id: end.id.toString(), //id一定要注意，entities里面其他entity的id不能相同。
        name: end.address,
        show:true,
        position:Cesium.Cartesian3.fromDegrees(end.lngGps, end.latGps),
        point:new Cesium.PointGraphics
        ({
            show : true,
            pixelSize :  5,
            color : Cesium.Color.WHITE,
        })
    });
    entities.push(entity);
    return entities;
};
//返回线的czml结构(array)
var getLineCzml = function (data){
    var lineCzml = [{
        id: "document",
        name: "CZML Geometries: Polyline",
        version: "1.0",
    }];
    var points = data[0].rows;
    for(var i=0; i<points.length-1; i++) {
        var p1 = points[i];
        var p2 = points[i + 1];
        var idstr = p1.id.toString() + p2.id.toString();
        var tLine = {
            id: idstr,
            polyline: {
                positions: {
                    cartographicDegrees: [p1.lngGps, p1.latGps, 500000, p2.lngGps, p2.latGps, 500000],
                },
                material: {
                    solidColor: {
                        color: {
                            rgba: [0, 0, 255, 100],
                        },
                    },
                },
                width: 3,
                clampToGround: true,
            }
        };
        lineCzml.push(tLine);
    }
    return lineCzml;
};
//时间与时间戳互换
//戳-时：str.getTime();
//时-戳：var t = new Data("2017-12-08 20:5:30");

//计算两点之间距离，经纬度
var dist = function (lng1, lat1, lng2, lat2){
    var R = 6378137;
    var dLat = (lat1 - lat2) * Math.PI / 180;
    var dLng = (lng1 - lng2) * Math.PI / 180;
    var a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(lat2 * Math.PI / 180) * Math.cos(lat1 * Math.PI / 180) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
    var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    var d = R * c;
    return Math.round(d)
};