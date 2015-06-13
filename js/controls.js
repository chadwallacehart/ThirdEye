/**
 * Created by chad on 6/13/15.
 */

//*****TRIGGER BUTTONS

//Monitor the buttons
var motionTrigger = false;
var colorTrigger = false;
var personTrigger = false;
var kidsTrigger = false;
var alarmPressed = false;


//ToDo: use jQuery toggle & classes to streamline this
$('#motionButton').click(function(){
    motionTrigger = !motionTrigger;
    console.log("motion active: " +  motionTrigger);
});

$('#colorButton').click(function(){
    colorTrigger = !colorTrigger;
    console.log("color active: " +  colorTrigger);
});

$('#personButton').click(function(){
    personTrigger = !personTrigger;
    console.log("face active: " +  personTrigger);
});

$('#kidsButton').click(function(){
    kidsTrigger = !kidsTrigger;
    console.log("kids active: " +  personTrigger);
});

//change buttons from
$('.normbtn').click(function(){
    console.log("click");
    $(this).toggleClass("btn-default").toggleClass("btn-info");
})
;

//******ALARM BUTTONS

var beepAlarm = false;

$('#beepButton').click(function(){
    beepAlarm = !beepAlarm;
    console.log("beep active: " +  beepAlarm);
});

var motion; //make global
var visionRunning = false
var visionTimer = null;

window.motion = motion;

$('#alarmStartButton').click(function(){

    $(this).toggleClass("btn-danger").toggleClass("btn-success");


    if (!alarmPressed){
        $('#alarmStartButton').html("Stop");

    //Wait 5 seconds to start alarms
    setTimeout(function(){

            if(motionTrigger){
                motion = new Motion( $('#remoteView')[0]);
                motion.start();
            }

            if(personTrigger || kidsTrigger){
                visionTimer = setInterval(function(){
                    callVisionAPI(takePicture($('#remoteView')[0]));
                    visionRunning = true;
                },3000);
            }
        }, 5000);

        alarmPressed = true;


    }
    else{
        $('#alarmStartButton').html("Start");

        //Turn off motion detection
        if(motion) {
            motion.stop();
            delete motion;
        }

        //stop the vision timer
        if (visionRunning){
            console.log("stopping vision");
            clearInterval(visionTimer);
            visionRunning = false;

        }

        alarmPressed = false;

    }

});

$('#smsButton').click(function(){
    var jsonData = {
        "outboundSMSMessageRequest": {
            "address": "tel:16174017778",
            "senderAddress": "tel:16177948881",
            "outboundSMSTextMessage": {
                "message": "Hello world"
            }
        }
    };
    $.ajax({
        beforeSend: function (xhrObj) {
            xhrObj.setRequestHeader("Content-Type", "application/json");
            xhrObj.setRequestHeader("Accept", "application/json");
            xhrObj.setRequestHeader("Authorization", "Basic " + btoa('taduser341' + ":" + '945973430888150'));
            //xhrObj.setRequestHeader('Access-Control-Allow-Headers', '*'); //Chad: added to stop CORS
            //xhrObj.setRequestHeader('Access-Control-Allow-Origin', '*'); //Chad: added to stop CORS

        },
        type: "POST",
        url: "http://ocsg60.optaresolutions.com:8001/oneapi/1/smsmessaging/outbound/tel%3A1111/requests/",
        processData: false,
        data: jsonData,
        dataType: "json",
        success: function (json) {
            $('#results').html(JSON.stringify(results));
        }
    })
        .done(function () {
            console.log('SMS request finished');
        })
        .fail(function (error) {
            console.error(error);
        });

});


$(window).on('alert', function(){

    console.log('Alert!!!');
    if(beepAlarm && alarmPressed){
        for(x=0; x<5; x++) {
            beep(220, 500, 0);
            beep(660, 500, 500);
            beep(220, 500, 1000);
            beep(660, 500, 1500);
        }
    }
});


//show a visual indicator of motion
$(window).on('motion', function(){
    $("#remoteView").fadeToggle(50);
    $("#remoteView").fadeToggle(50);

    if(beepAlarm) {
        beep(440, 200, 0);
    }
});


//http://blog.chrislowis.co.uk/2013/06/05/playing-notes-web-audio-api.html
//webaudio setup for beep
beeping = true;
var context = new AudioContext;

var beeping = false;

function beep(tone, duration, delay){
    if (!beeping){
        var oscillator = context.createOscillator();
        oscillator.frequency.value = tone;
        oscillator.connect(context.destination);
        oscillator.start(delay/1000);
        //oscillator.stop(0.100);
        setTimeout(function(){
            oscillator.stop();
            beeping = false;
        }, duration + delay/1000);
    }

}




/*
//Project Oxford Face Detection
function faceAPI(){
    $.ajax({
        url: 'https://api.projectoxford.ai/face/v0/detections?subscription-key=c698d93dc8594c76a8a3e75a55d017dc',
        type: 'POST',
        dataType: "json",
        contentType: "application/json",
        data: {'url': 'http://pic1a.nipic.com/20090319/1689210_094353097_2.jpg'},
        success: function (data) {
            var html = '';
            $.each(data, function (commentIndex, comment) {
                html += 'faceid:' + comment['faceId']+"\r\n";
            });
            alert(html);

        }
    })
        .fail(function (x) {
            alert("error:"+x.statusText+x.responseText);
        });
}

//Project Oxford Face Detection
function visionAPI(imgsrc){
    console.log("vision API triggered");
    $.ajax({
        url: 'https://api.projectoxford.ai/vision/v1/analyses?All?&subscription-key=a8ee9cce61a946098290eb071942c96b',
        //https://www.petlegaciesbcs.com/wp-content/uploads/2014/07/english-bulldog-6-years-old-sitting-in-front-of-white-background.jpg

        type: 'POST',
        dataType: "json",
        //'Ocp-Apim-Subscription-Key': 'a8ee9cce61a946098290eb071942c96b',
        contentType: "application/octet-stream",
        data: imgsrc,
        success: function (data) {
            console.log(data);
        }
    })
        .fail(function (x) {
            console.error("error:"+x.statusText+x.responseText);
        });
}
*/



//Take a still photo
//Inspiration: https://developer.mozilla.org/en-US/docs/Web/API/WebRTC_API/Taking_still_photos
function takePicture(sourceImg) {
    var canvas = document.createElement("canvas");
    //set picture to native size of video
    canvas.width = sourceImg.videoWidth;
    canvas.height = sourceImg.videoHeight;
    canvas.getContext('2d').drawImage(sourceImg, 0, 0, sourceImg.videoWidth, sourceImg.videoHeight);
    //var data = canvas.toDataURL('image/jpeg');
    //console.log(data);


    var imgBase = canvas.toDataURL("image/png");
    var imgBlob = dataURItoBlob(imgBase);

    return(imgBlob);


/*
    var img = {
        type: 'image/jpeg',
        dataURL: data //ToDo: check this
    };
    return (img);*/
}


//*****PROJECT OXFORD API'S
//modified this from: http://typefolly.com/how-old/


function dataURItoBlob(dataURI) {
    // convert base64/URLEncoded data component to raw binary data held in a string
    var byteString;
    if (dataURI.split(',')[0].indexOf('base64') >= 0)
        byteString = atob(dataURI.split(',')[1]);
    else
        byteString = unescape(dataURI.split(',')[1]);

    // separate out the mime component
    var mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0];

    // write the bytes of the string to a typed array
    var ia = new Uint8Array(byteString.length);
    for (var i = 0; i < byteString.length; i++) {
        ia[i] = byteString.charCodeAt(i);
    }

    return new Blob([ia], {type:mimeString});
}


function callVisionAPI(imgBlob) {

    var params = {
        //'visualFeatures': 'All',
        'subscription-key': 'a8ee9cce61a946098290eb071942c96b'
    };

    var http = new XMLHttpRequest();
    var url = 'https://api.projectoxford.ai/vision/v1/analyses?All?&subscription-key=a8ee9cce61a946098290eb071942c96b'; //+ $.param(params);

    http.open("POST", url, true);
    http.setRequestHeader('Content-type', 'application/octet-stream');
    //http.setRequestHeader('Access-Control-Allow-Headers', '*'); //Chad: added to stop CORS
    //http.setRequestHeader('Access-Control-Allow-Origin', '*'); //Chad: added to stop CORS
    http.onreadystatechange = function() {

        if (http.readyState == 4 && http.status == 200) {
            console.log(http.response);
            if (personTrigger)
                monitorPerson(JSON.parse(http.response));
            if (kidsTrigger)
                monitorKids(JSON.parse(http.response));
        }
    };

    http.send(imgBlob);
}



function monitorPerson(visionObj){
    console.log(visionObj);

    var result = $.grep(visionObj.categories,
        function(e, index){
            return e.name == 'people_'});

    if (result.length > 0) {
        $(window).trigger("alert").trigger("people");
    }

}


function monitorKids(visionObj){
    console.log(visionObj);

    var result = $.grep(visionObj.faces,
        function(e, index){
            return e.age < 17});

    if (result.length > 0) {
        $(window).trigger("alert").trigger("kids");
    }
}


