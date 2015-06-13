/**
 * Created by Chad on 10/19/2014.
 * Simple code to detect motion via the canvas method
 * inspired by https://github.com/priologic/easysec/tree/master/2_easysec_with_motion
 * amp sets sensitivity
 * Uses 2 time windows;
 *  1. the number of times motion is detected in 1 second (secThresh) -> triggers 'motion'
 *  2. number of full motion fires (threshold) in timeWindow -> triggers 'alert'
 */

 function Motion (videoElement, timeWindow, threshold, amp, secThresh) {

    var lastFrame = null;
    var currentFrame = null;
    var smallFrame;
    var ampThreshold = amp || 130; //130 //was 30
    var hitThreshold = secThresh || 2;  // 2//was 1000
    var lastMotion = false;
    var times = [];

    timeWindow = timeWindow*1000 || 30*1000; //convert to seconds, default 30 sec
    threshold = threshold || 10;            //default 10 times in 30 seconds


    function compareFrames() {
        if( !smallFrame) {

            var aspectRatio =  videoElement.videoWidth/videoElement.videoHeight;
            var smallFrameHeight = 300;

            smallFrame = document.createElement("canvas");
            smallFrame.width = smallFrameHeight * aspectRatio; //180;
            smallFrame.height = smallFrameHeight; //135;
        }
        var ctx = smallFrame.getContext("2d");
        //var videoElement = document.getElementById("selfVid");
        ctx.drawImage(videoElement, 0, 0, videoElement.videoWidth, videoElement.videoHeight, 0, 0, smallFrame.width, smallFrame.height);
        currentFrame = ctx.getImageData(0, 0, smallFrame.width, smallFrame.height).data;
        var hits = 0;
        if( lastFrame) {
            var n = currentFrame.length;
            for( i = 0; i < n; i++) {
                if( Math.abs(currentFrame[i]-lastFrame[i]) > ampThreshold) {
                    hits++;
                }
            }
        }
        lastFrame = currentFrame;

        var sawMotion = (hits > hitThreshold);
        if (sawMotion){
            console.log("Saw motion");
            $(window).trigger('motion');
        }

        return sawMotion;
    }

    var t;  //timeout var
    var state = "stopped";

    this.start = function(){
        state = "running";
        motionDetection();
    };

    this.stop = function(){
        state = "stopped";
        clearTimeout(t);
        times = [];
        console.log("Motion detector off");
    };

    // Initiate motion detect to scan video five times a second
    function motionDetection() {
        if(state == "running"){
            var sawMotion = compareFrames();
            t=setTimeout( motionDetection, sawMotion?1000:200);  //was 1000:250
        }
    }

    $(window).on('motion', function(){
        var now = new Date();
        if (now - times[0] < timeWindow){
            times.push(now);
        }
        else{
            times.unshift(now);
        }

        if (times.length >= threshold){
            console.log(times.length + " triggers in " + (times[times.length-1] - times[0])/1000 + " seconds (within threshold of " + timeWindow /1000+ " seconds");
            $(window).trigger('alert');
            times = [];
        }

    });


}