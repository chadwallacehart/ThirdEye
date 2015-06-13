/**
 * Created by chad on 6/12/15.
 */

//call gUM right away
function getVideo(){
    var video = document.querySelector('video');
    var constraints = {
        audio: false,
        video: true
    };

    navigator.getUserMedia = navigator.getUserMedia ||
        navigator.webkitGetUserMedia || navigator.mozGetUserMedia;

    function successCallback(stream) {
        window.stream = stream; // stream available to console
        if (window.URL) {
            video.src = window.URL.createObjectURL(stream);
        } else {
            video.src = stream;
        }
    }

    function errorCallback(error) {
        console.log('navigator.getUserMedia error: ', error);
    }

    navigator.getUserMedia(constraints, successCallback, errorCallback);
}

var callee =  "eye@example.com";
var caller =  "view@example.com"

function initializeEye(username) {
    //initalizeRegisterUI();
    isVideo = true;
    demoName = " Video Call Demo ";
    wsc.setLogLevel(wsc.LOGLEVEL.DEBUG);
    var audioMediaDirection = wsc.MEDIADIRECTION.NONE;//ToDo: turn this off
    var videoMediaDirection = wsc.MEDIADIRECTION.SENDONLY;

    callConfig = new wsc.CallConfig(audioMediaDirection, videoMediaDirection);
    $('#startButton').prop('disabled', true);
    //var userName = callee;
    initSession(callee);
    initCallHandler("video");
}

function initializeViewer() {
    //initalizeRegisterUI();
    isVideo = true;
    demoName = "ThirdEye by Chad Hart";
    wsc.setLogLevel(wsc.LOGLEVEL.DEBUG);
    var audioMediaDirection = wsc.MEDIADIRECTION.NONE;//ToDo: turn this off
    var videoMediaDirection = wsc.MEDIADIRECTION.SENDRECV;

    callConfig = new wsc.CallConfig(audioMediaDirection, videoMediaDirection);
    $('#callButton').prop('disabled', true);
    //var userName = caller;
    initSession(caller);
    initCallHandler("video");

    var call = startCall(callee);
}


function onCallStateChange(callobj, callState) {
    //setStatus("call state: " + callState.state);
    //showResults("callstate : " + JSON.stringify(callState));

    console.log("call state: " + callState.state);
    console.log(callState);



    if (callState.state == wsc.CALLSTATE.ESTABLISHED) {
        callEstablished(callobj);
    } else if (callState.state == wsc.CALLSTATE.ENDED
        || callState.state == wsc.CALLSTATE.FAILED) {
        //initializeCommand();
        attachMediaStream(document.getElementById("remoteView"), null);
        document.getElementById("remoteView").load();
        attachMediaStream(document.getElementById("selfView"), null);
        document.getElementById("selfView").load();
    }
}


onCallSomeOne = function () {
    callee = document.getElementById("callee").value;
    if (callee.indexOf("@") < 0) {
        callee = callee + "@example.com";
    }
    var call = startCall(callee);
};

function mediaStateCallback(mediaState, stream) {
    console.log("mediastate : " + mediaState);
    //var rurl = webkitURL.createObjectURL(stream);
    if (mediaState == wsc.MEDIASTREAMEVENT.LOCAL_STREAM_ADDED) {
        console.log("Local video stream is added...");
        attachMediaStream(document.getElementById("selfView"), stream);
    } else if (mediaState == wsc.MEDIASTREAMEVENT.REMOTE_STREAM_ADDED) {
        console.log("Remote video streama is added...");
        attachMediaStream(document.getElementById("remoteView"), stream);
    }
}









//*****BEGIN DEMOSUPPORT.JS CODE I MODIFIED***********/


//********Initialize logger**********/
wsc.setLogger(console);

//**************Initialize variables******************************/
var wsUri,loginUri,userName, wscSession,callHandler,sessionId = null,logoutUri,
    isVideo=false,callConfig,demoName ="Demo", onIncomingCallCmd;
wsUri = "ws://ocwsc71se.optaresolutions.com:7001/ws/webrtc/guest";
loginUri = "http://" + window.location.hostname + ":8080/index.html";  //ToDo:Change this
logoutUri = "http://ocwsc71se.optaresolutions.com:7001/logout?redirect_uri=" + loginUri;

var wsUri = "ws://ocwsc71se.optaresolutions.com:7001/ws/webrtc/guest";


var isPageReload = false;


//**************Initailize Session******************/
function initSession(userName){
    console.log("The WebSocket URI used for registering is: "+wsUri);
    if (isPageReload) {
        console.log("Page is reloading, please wait...");
        wscSession = new wsc.Session(userName, wsUri, onSessionSuccess, onSessionError,
            sessionId);
    } else {
        wscSession = new wsc.Session(userName, wsUri, onSessionSuccess, onSessionError);
    }
    var authHandler = new wsc.AuthHandler(wscSession);
    authHandler.refresh = refreshAuth;
//    wscSession.setIdlePingInterval(10 *1000);
//	wscSession.setBusyPingInterval(3 *1000);
//    wscSession.setReconnectInterval(2 * 1000);
//    wscSession.setReconnectTime(60 * 1000);
    wscSession.onSessionStateChange = onSessionStateChange;
};

function onSessionSuccess() {
    userName = wscSession.getUserName();

    //save into session storage
    sessionStorage.setItem("sessionId", wscSession.getSessionId());

    $('video').show();
}


function onSessionError(error) {
    console.error("onSessionError: error code=" + error.code + ", reason=" + error.reason);
    console.error("Session Failed, please logout and try again.");
}
function logout() {
    wscSession.close();
    if (document.cookie) {
        document.cookie = 'wsc-session=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
    }
    window.location.href = logoutUri;
};
//**************Initialize call package and call****************/
function initCallHandler(){
    callHandler = new wsc.CallPackage(wscSession);
    if(callHandler) {
        callHandler.onIncomingCall=function(callobj,callConfig){
            onIncomingCall(callobj,callConfig)};
        callHandler.onResurrect = onResurrect;
    }
}
//On incoming call callback
function onIncomingCall(callobj, remoteCallConfig) {
    console.log("incoming call");
    var callType = "audio:"+remoteCallConfig.audioConfig+",video:"+remoteCallConfig.videoConfig;
    callobj.accept(callobj.callConfig);
    initCallback(callobj);
    call = callobj;
    console.log(call);
}

// Bind event handler to Call object.
function initCallback(callobj) {
    var  definedArgLen=1,extheader=null;
    if (arguments.length > definedArgLen) {
        extheader = arguments[definedArgLen];
    };
    if(extheader){
        console.log("The extended headers:"+ JSON.stringify(extheader));
    }
    callobj.onCallStateChange = function(newState){
        onCallStateChange(callobj,newState);
    };
    callobj.onMediaStreamEvent= mediaStateCallback;
}

function callEstablished(callObj) {
    //remove hang-up button
    var icmd = "<input type='button' name='hButton' id='hButton' value='Hangup' onclick=''/>"
    setCmd(icmd);
    document.getElementById("hButton").onclick = function() {
        callObj.end();
    }
}
function doCallError(error) {
    console.error('Call error reason:' + error.reason);
}
function startCall(){
    console.log("Calling... " + callee);
    var call = callHandler.createCall(callee,  callConfig, doCallError);
    if (call != null) {
        initCallback(call);
        call.start();
        var callButton = document.getElementById("callButton");
        callButton.disabled = true;
        var cancelButton = document.getElementById("cancelButton");
        cancelButton.disabled = false;
        cancelButton.onclick = function() {
            call.end();
        }
        return call;
    }

}


//**************Reload*********************************/

function savePageInfo() {
    sessionStorage.setItem("sessionId", wscSession.getSessionId());
}

function getSavedPageInfo() {
    sessionId = sessionStorage.getItem("sessionId");
    if (sessionId != null) {
        return true;
    }
    return null;
}

function onSessionStateChange(sessionState) {
    console.log("sessionState : " + sessionState);

    switch (sessionState) {
        case wsc.SESSIONSTATE.RECONNECTING :
            console.info("Network is unstable, please wait...");
            break;

        case wsc.SESSIONSTATE.CONNECTED :
            console.log("Session connected.");
            if (wscSession.getAllSubSessions().length == 0) {
                $('#statusArea').html("Connected");
            }
            break;
        case wsc.SESSIONSTATE.FAILED :
            console.error("Session Failed, please logout and try again.");
            break;
    }
}

function onResurrect(resurrectedCall) {
    initCallback(resurrectedCall);
    resurrectedCall.resume(
        function(){
            onResumeCallSuccess(resurrectedCall);
        },
        doCallError);
}

function onResumeCallSuccess(callObj) {
    if (callObj.getCallState().state == wsc.CALLSTATE.ESTABLISHED) {
        callEstablished(callObj);
    }
//    else if ((callObj.getCallState().state == wsc.CALLSTATE.STARTED || callObj.getCallState().state == wsc.CALLSTATE.RESPONDED)
//        && callObj.getCaller() != userName && onIncomingCallCmd) {
//      // if onIncomingCallCmd is null, it is the refresh case, otherwise, it is un-plugin -> plugin case.
//      setCmd(onIncomingCallCmd);
//      document.getElementById("acceptButton").onclick = function() {
//        callObj.accept(callObj.callConfig);
//      };
//      document.getElementById("declineButton").onclick = function() {
//        callObj.decline();
//      };
//    }
//    else {
//      initializeCommand();
//	  }
}


function getAuthInfo(authHeaders,vcnonce){
    return false;
}

function getServiceAuth(authheaders){
    console.log("***********invoke getSipAuthInfo");
    console.log("Received headers:"+JSON.stringify(authheaders));
    var returnObj = null;
    while(returnObj==null){
        returnObj =getAuthInfo(authheaders);
    }
    return returnObj;
};
function getTurnAuth(){
    console.log("***********StreamStack TURN");

    //ToDo: turn this back on
    var ice = {
        "iceServers": [
        {"url":"stun:turn-001-hstn.streamstack.io:3478"},
        {"url":"turn:turn-001-hstn.streamstack.io:3478?transport=udp","credential":"K1G3zpP2zfZlS1QHYJfQitzonIk=","username":"1434155759:556fda624e8b4fdb333600fb"},
        {"url":"turn:turn-001-hstn.streamstack.io:80?transport=tcp","credential":"K1G3zpP2zfZlS1QHYJfQitzonIk=","username":"1434155759:556fda624e8b4fdb333600fb"},
        {"url":"turns:turn-001-hstn.streamstack.io:443?transport=tcp","credential":"K1G3zpP2zfZlS1QHYJfQitzonIk=","username":"1434155759:556fda624e8b4fdb333600fb"}
        ],
        "ttl": 3600   //Crential time-out period in seconds
    };

 /*   return {
        "iceServers" : [ {
            "url":"stun:turn-001-hstn.streamstack.io:3478"
        } ]
    };*/

    return ice;

};

function refreshAuth(authType,authHeaders){
    var authInfo = null;
    if(authType==wsc.AUTHTYPE.SERVICE){
        authInfo = getServiceAuth(authHeaders);
    }else if(authType==wsc.AUTHTYPE.TURN){
        authInfo = getTurnAuth();
        console.log("Current the turn auth server is: "+JSON.stringify(authInfo));
    }
    return authInfo;
};


//******************Debug Utility**************************/
function setStatus(status) {
    var currentStatus = document.getElementById("statusArea");
    currentStatus.innerHTML = status;
}
function setCmd(command) {
    var currentCmd = document.getElementById("currentCommand");
    currentCmd.innerHTML = command;
}
function showResults(message) {
    printResults(message);
}
function printResults(message) {
    wsc.frameDoc = document.getElementById("output");
    var pre = document.createElement("code");
    pre.innerHTML = "<br>" + message;
    wsc.frameDoc.appendChild(pre);
}
function addStatus(command) {
    var currentCmd = document.getElementById("currentCommand");
    currentCmd.innerHTML = currentCmd.innerHTML + command;
}
function clearText(divname) {
    // var outDiv = document.getElementById("codeDiv");
    var outDiv = document.getElementById(divname);
    //   var pre = document.getElementById("code");
    outDiv.innerHTML = "";
    var subCodeDivs = outDiv.childNodes;
    for ( var i = 0; i < subCodeDivs.length; i++) {
        var oChild = outDiv.children[i];
        // oChild.hidden = true;
        outDiv.removeChild(oChild);
    }
}
function setCodeDiv(targetCode) {
    var codeDiv = document.getElementById("codeDiv");
    var targetCodeDiv = document.getElementById(targetCode);
    if (targetCodeDiv) {
        targetCodeDiv.hidden = false;
        // clearText("codeDiv");
        codeDiv.appendChild(targetCodeDiv);
    }
}
var divCount = 0;
function addDiv(content,divTypeName){
    if(divCount==1){divCount = 0;};
    divCount+=1;
    var top=150*(divCount-1),
        newdiv   =   document.createElement("div");
    newdiv.id = divTypeName;
    newdiv.className = "xWin";
    newdiv.style.position = "relative";
    newdiv.style.left="1px";
    newdiv.style.top=top+"px";
    newdiv.style.width="800px";
    newdiv.style.height="100px";
    newdiv.style.border="2px solid blue";
    newdiv.innerHTML = content;
    var additionCommand = document.getElementById("additionCommand");
    additionCommand.appendChild(newdiv);

}

function clientRightCheck(authUrl, loginUrl) {
    var getRequestParameter = function(pname) {
        var reg = new RegExp("(^|\\?|&)" + pname + "=([^&]*)(\\s|&|$)", "i");
        if (reg.test(location.href)) {
            return unescape(RegExp.$2.replace(/\+/g, " "));
        }
        return null;
    };

    var getPureUrl = function(urlobj) {
        var parmPos = urlobj.href.indexOf('?'), uStr = urlobj.href;
        if (parmPos > 0) {
            uStr = urlobj.href.substring(0, parmPos);
        }
        return uStr;
    };
    var pureLocalUrl = getPureUrl(document.location), urlKey = 'wsc-accesstime_'
        + pureLocalUrl;

    var validatePage = function(authUrl, loginUrl) {
        var tokenPname = 'wscrandom', curToken = getRequestParameter(tokenPname);
        lastToken = null, isNeedCheck = true, checkUrl = null;
        if (localStorage.getItem(urlKey)) {
            isNeedCheck = false;
        } else if (curToken) {
            try {
                if (localStorage.getItem(tokenPname)) {
                    lastToken = parseInt(localStorage.getItem(tokenPname));
                }
                var intcToken = parseInt(curToken);
                if (lastToken == intcToken) {
                    isNeedCheck = false;
                    localStorage.setItem(urlKey, parseInt(Math.random() * 10 + 2));
                }
            } catch (e) {
                showResults(e);
            }
        }
        ;

        if (isNeedCheck) {
            curToken = parseInt(Math.random() * 10000 + 1);
            checkUrl = authUrl + "?redirect&failUrl=" + loginUrl + "&successUrl="
                + pureLocalUrl + "?" + tokenPname + "=" + curToken;
            localStorage.setItem(tokenPname, curToken);
            window.location.href = checkUrl;
        }
    };
    validatePage(authUrl, loginUrl);
};



/**##########################################################*/

var attachMediaStream = null;
var reattachMediaStream = null;
var webrtcDetectedBrowser = null;


if (navigator.mozGetUserMedia) {

    webrtcDetectedBrowser = "firefox";

    // Attach a media stream to an element.
    attachMediaStream = function(element, stream) {
        console.log("Attaching media stream");
        element.mozSrcObject = stream;
        element.play();
    };

    reattachMediaStream = function(to, from) {
        console.log("Reattaching media stream");
        to.mozSrcObject = from.mozSrcObject;
        to.play();
    };

    // Fake get{Video,Audio}Tracks
//    MediaStream.prototype.getVideoTracks = function() {
//      console.log("Attention!!! Trying to invoke MediaStream.prototype.getVideoTracks of FireFox, but it could be supported in 23.0. This is Fake one!");
//      return [];
//    };
//
//    MediaStream.prototype.getAudioTracks = function() {
//      console.log("Attention!!! Trying to invoke MediaStream.prototype.getAudioTracks of FireFox, but it could be supported in 23.0. This is Fake one!");
//      return [];
//    };
} else if (navigator.webkitGetUserMedia) {

    webrtcDetectedBrowser = "chrome";


    // Attach a media stream to an element.
    attachMediaStream = function(element, stream) {
        element.src = webkitURL.createObjectURL(stream);
    };

    reattachMediaStream = function(to, from) {
        to.src = from.src;
    };

    // The representation of tracks in a stream is changed in M26.
    // Unify them for earlier Chrome versions in the coexisting period.
    if (!webkitMediaStream.prototype.getVideoTracks) {
        webkitMediaStream.prototype.getVideoTracks = function() {
            return this.videoTracks;
        };
        webkitMediaStream.prototype.getAudioTracks = function() {
            return this.audioTracks;
        };
    }

    // New syntax of getXXXStreams method in M26.
    if (!webkitRTCPeerConnection.prototype.getLocalStreams) {
        webkitRTCPeerConnection.prototype.getLocalStreams = function() {
            return this.localStreams;
        };
        webkitRTCPeerConnection.prototype.getRemoteStreams = function() {
            return this.remoteStreams;
        };
    }
} else {
    //console.log("Browser does not appear to be WebRTC-capable");
}
/**##########################################################*/

