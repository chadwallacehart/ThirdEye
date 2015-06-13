/*includeJS('js/md5test.js');
function includeJS(jsPath) {
    var script = document.createElement("script");
    script.type = "text/javascript";
    script.src = jsPath;
    document.getElementsByTagName("head")[0].appendChild(script);
}*/


//********Initialize logger**********/
  wsc.setLogger(console);

//**************Initialize variables******************************/
  var wsUri,loginUri,userName, wscSession,callHandler,sessionId = null,logoutUri,
      isVideo=false,callConfig,demoName ="Demo", onIncomingCallCmd;
  wsUri = "ws://ocwsc71se.optaresolutions.com:7001/ws/webrtc/guest";
  loginUri = "http://" + window.location.hostname + ":8080/index.html";  //ToDo:Change this
  logoutUri = "http://ocwsc71se.optaresolutions.com:7001/logout?redirect_uri=" + loginUri;
  //**************Initailize Session******************/
  function initSession(userName){
	var wsUrlEle = document.getElementById("wsUrl");
	if (wsUrlEle.value) {
	  wsUri = wsUrlEle.value;
	} else {
		console.log("No WebSocket URI are loaded or input. The default WebSorcket URI is: \n"+wsUri);
	}
		
	console.log("The WebSocket URI used for registering is: "+wsUri);
     if (isPageReload) {
      setStatus("Page is reloading, please wait...");
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
    initializeUserName();
	  savePageInfo();
    if (wscSession.getAllSubSessions().length == 0) {
      initializeCommand();
    } else {
      var videos = document.getElementById("videos");
      if (videos)
        videos.hidden = false;	
    }
  }
  function initializeUserName() {
    userName = wscSession.getUserName();
    var hdg = document.getElementById("heading");
    hdg.innerHTML = demoName +"-- Welcome, " + userName;
    hdg.innerHTML += "<div align=center'><input type='button' name='logoutButton' id='logoutButton' value='Logout' onclick='logout()'/></div>";
    var stunHtml = "<div align=center'> <span style='font-size:14px;'>STUN URL: </span><input type='text' name='stunUrl' id='stunUrl' size='50'/><input type='button' id='saveStunUrl' value='Save STUN URL' onclick='saveStun()' /><span id='stunUrlExample' style='color:gray;font-size:14px;'>Format: [IP Address]:[Port].  Example: ocwsc71me.optaresolutions.com:3478</span></div>";
    hdg.innerHTML += stunHtml;
	if(localStorage.stunUrl){
		document.getElementById("stunUrl").value = localStorage.stunUrl;
	}
  }
  
  function saveStun() {
	localStorage.stunUrl = document.getElementById("stunUrl").value;
	console.log("STUN Url is saved to local storage: "+localStorage.stunUrl);
  }
  
  function saveWSUrl() {
	localStorage.wsUrl = document.getElementById("wsUrl").value;
	console.log("WebSorcket Url is saved to local storage: "+localStorage.wsUrl);
  }
  
  function initializeCommand() {
    var iCmd = "Enter Your Callee: <input type='text' name='callee' id='callee'/><br><hr>"
        + "<input type='button' name='callButton' id='callButton'  value='Call' onclick='onCallSomeOne()'/>"
        + "<input type='button' name='cancelButton' id='cancelButton'  value='Cancel' onclick='cancelCall()' disabled ='true'/><br><br><hr>";
    setCmd(iCmd);
    var videos = document.getElementById("videos");
    //videos.hidden = false;
    videos.hidden = !isVideo;
    var calleeInput = document.getElementById("callee");
    if (calleeInput) {
      calleeInput.focus();
    }
  }
  // Modify UI according to authentication info. Set value for wsUri. 
  function initalizeRegisterUI() {
    var wsHtml = "<div align=center'> <span style='font-size:14px;'>WebSocket URL: </span><input type='text' name='wsUrl' value='ws://ocwsc71se.optaresolutions.com:7001/ws/webrtc/guest' id='wsUrl' size='50'/><input type='button' id='saveWSUrl' value='Save WebSocket URL' onclick='saveWSUrl()' /><span style='color:gray;font-size:14px;'>Format: 'ws://[IP Address]:[Port]/[Path]'    Example: ws://ocwscse.optaresolutions.com:7001/ws/webrtc/guest</span></div>";

    var icmd = "<div id='userIdDiv'> Enter Your ID:<input type='text' name='userName' id='userName'/>    <span style='color:gray;font-size:14px;'>Example: bob@example.com </span> </div><input type='button' name='loginButton' id='loginButton'  value='Register' onclick='register()'/>";
    clearText("currentCommand");
    //alert('init');
    setCmd(wsHtml + icmd);
	//initialize the value from localStorage for the websocket URI
	if(localStorage.wsUrl){
		document.getElementById("wsUrl").value = localStorage.wsUrl;
	}
	
    var localString = String(window.document.location.href),
     
    userIdDiv =document.getElementById("userIdDiv");
   
    userIdDiv.hidden = false;
    wsUri = "ws://ocwsc71se.optaresolutions.com:7001/ws/webrtc/guest";
    logoutUri = loginUri;
	  
    if(!userName){
      userName = document.getElementById("userName").value;
    }
   
  }
  
  function onSessionError(error) {
    showResults("onSessionError: error code=" + error.code + ", reason=" + error.reason);
    setStatus("Session Failed, please logout and try again.");  
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
    callHandler = new wsc.CallPackage(wscSession)
    if(callHandler) {
      callHandler.onIncomingCall=function(callobj,callConfig){onIncomingCall(callobj,callConfig)};
      callHandler.onResurrect = onResurrect;
    }
  }
  //On incoming call callback
  function onIncomingCall(callobj, remoteCallConfig) {
    var callType = "audio:"+remoteCallConfig.audioConfig+",video:"+remoteCallConfig.videoConfig;
    onIncomingCallCmd = "<input type='button' name='acceptButton' id='acceptButton' value='Accept "
        + callobj.getCaller()
        + " Incoming Call' onclick=''/><input type='button' name='declineButton' id='declineButton' value='Decline Incoming Call' onclick=''/>"
        + "<br>"
        +callType+"<br><hr>";
  
    setCmd(onIncomingCallCmd);
    //callobj.iceTimeout = 3000;
    document.getElementById("acceptButton").onclick = function() {
      callobj.accept(callobj.callConfig);
    };
    document.getElementById("declineButton").onclick = function() {
      //callobj.answer(false, callConfig, null, extheader);
      callobj.decline();
    };
    initCallback(callobj);
    call = callobj;
  }
  
  // Bind event handler to Call object.
  function initCallback(callobj) {
    var  definedArgLen=1,extheader=null;
     if (arguments.length > definedArgLen) {
      extheader = arguments[definedArgLen];
     };
     if(extheader){
      showResults("The extended headers:"+ JSON.stringify(extheader));
     }
    callobj.onCallStateChange = function(newState){
      onCallStateChange(callobj,newState);
    };
    callobj.onMediaStreamEvent= mediaStateCallback;
  }
 
  function callEstablished(callObj) {
    var icmd = "<input type='button' name='hButton' id='hButton' value='Hangup' onclick=''/>"
    setCmd(icmd);
    document.getElementById("hButton").onclick = function() {
      callObj.end();
    }  
  }
  function doCallError(error) {
    showResults('Call error reason:' + error.reason);
  }
  function startCall(){
    printResults("Calling... " + callee);
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
  var isPageReload = false;
  function onPageLoad() {
    if (getSavedPageInfo()) {
      isPageReload = true;
      register();
    }
  }
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
    showResults("sessionState : " + sessionState);

    switch (sessionState) {
      case wsc.SESSIONSTATE.RECONNECTING :
        setStatus("Network is unstable, please wait...");
        break;

      case wsc.SESSIONSTATE.CONNECTED :
	    setStatus("Session connected.");
        if (wscSession.getAllSubSessions().length == 0) {
          initializeCommand();
        }
        break;
      case wsc.SESSIONSTATE.FAILED :
        setStatus("Session Failed, please logout and try again.");
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


//**************Authentication callback****************/
function getAuthInfo(authHeaders,vcnonce){
/* ******Run this case needs implemente the "hex_md5" algorithm.*****
 var strUser='{"user":"'+wscSession.getUserName()+'","password":"welcome1"}',
     authStr = window.prompt("Input user/password:",strUser);
    //authStr = '{"user":"xiaomanxu1","password":"welcome1"}';
  if(authStr==null) return false;
  var userObj = JSON.parse(authStr),
  username = userObj.user,
  passowrd = userObj.password,
  realm =authHeaders['realm'],
  ha1 = hex_md5(username+":"+realm+":"+passowrd),
  method = authHeaders['method'],
  req_uri = authHeaders['uri'],
  qop = authHeaders['qop'],
  nc = '00000001',
  nonce = authHeaders['nonce'],
  cnonce = vcnonce,
  ha2 = hex_md5(method+":"+req_uri),
  response;
    //cnonce is provided by client, any string.
  if(vcnonce){
    cnonce = vcnonce;
  }else{
    cnonce = hex_md5((parseInt(1000*Math.random())).toString());
  }
  if(!qop){
    response = hex_md5(ha1+":"+nonce+":"+ha2);
  }else if(qop=="auth"){
    response = hex_md5(ha1+":"+nonce+":"+nc+":"+cnonce+":"+qop+":"+ha2);
  }
  authHeaders['username'] = username;
  authHeaders['cnonce'] = cnonce;
  authHeaders['response'] = response;
  authHeaders['nc'] = nc;
  return authHeaders; */
  return false;
  };
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
      console.log("***********invoke getTurnAuthInfo");
    // set STUN server to null so that candidate gathering
    // can be quickly in LAN. if in WAN, set a reachable STUN
    // server in statement above and comment the statement below.
      
//      return {
//        "iceServers" : [ {
//          "url":"turn:10.182.13.232:3478", "credential":"sips", "username":"admin"
//        } ]
//      };

//      return {
//        "iceServers" : [ {
//          "url":"stun:10.182.13.232:3478"
//        } ]
//      };

      var stunUrlEle = document.getElementById("stunUrl");
      if (stunUrlEle.value) {
        return {
          "iceServers" : [ {
            "url" : "stun:"+stunUrlEle.value
          } ]
        };        
      }
      
      return null;
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

