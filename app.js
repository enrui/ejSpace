on = require('watson-developer-cloud');
var mqtt = require('mqtt');
var sensorLib = require('node-dht-sensor');
var onoff_gpio = require('onoff').Gpio;
var Sound = require('node-aplay');
var fs = require('fs');
var request = require('request');


//define watson auth
var text_to_speech = watson.text_to_speech({
  username: '********************************',
  password: '***********',
  version: 'v1'
});

function get_location(){
	var location_data={};

	request.get('http://ip-api.com/json',  {timeout: 15000}, function (error, response, body) {
	if (!error && response.statusCode == 200) {
		location_data=body;// Show the HTML for the Google homepage.
		console.log(location_data);			
		iot_client.publish('iot-2/evt/status/fmt/json', '{"d":{"status":"upload-location-data","location":'+location_data+' }}');
	}else{
		console.log('Cannot get location data');
	}
	})	
}

//initial led switch 
var yallow_led_pin=2;
var y_led = new onoff_gpio(yallow_led_pin, 'out');

var led_controller = require( './output/led.js' );

var clientId = ['d', "******", "raspberryPi2", "********"].join(':');

iot_client = mqtt.connect("mqtt://******.messaging.internetofthings.ibmcloud.com:1883",
	{
		"clientId" : clientId,
		"keepalive" : 30,
		"username" : "********",
		"password" : "******"
	});

iot_client.on('connect', function() {//如果連接上的話要做的事情
        
    console.log('Rapiro client connected to IBM IoT Cloud.');
	
	var location_timer=setInterval(function () { 
		get_location();
	}, 60000);
})

iot_client.subscribe('iot-2/cmd/signal/fmt/json', function() {
    // when a message arrives, do something with it
    iot_client.on('message', function(topic, message, packet) {
		console.log("Received '" + message + "' on '" + topic + "'");
	  var cmd = JSON.parse(message);
	  if(cmd.ledswitch=="on")
		led_controller.led_switch(y_led,1);
	  else
		led_controller.led_switch(y_led,0);
    });
  });

iot_client.subscribe('iot-2/cmd/speaker/fmt/json', function() {
	// when a message arrives, do something with it
	iot_client.on('message', function(topic, message, packet) {
		console.log("Received '" + message + "' on '" + topic + "'");
		var params = {
			voice: 'en-US_AllisonVoice',
			accept: 'audio/wav'
		};
		var cmd = JSON.parse(message);
		if(cmd.text){
			params.text=cmd.text;
		}
		else{
			params.text="Sorry, i want not say any thing"
		}
		
		text_to_speech.synthesize(params).pipe(fs.createWriteStream('/tmp/tts.wav')); 
		setTimeout(function() {
			new Sound('/tmp/tts.wav').play();
		}, 3000);
	});
  });  

  
var sensor = {
    initialize: function () {
        return sensorLib.initialize(22, 4);
    },
    read: function () {
        var readout = sensorLib.read();
		var d = new Date();
		iot_client.publish('iot-2/evt/status/fmt/json', '{"d":{"status":"upload-sensor-data","timestamp":"'+d.getTime()+'","temp":"'+ readout.temperature.toFixed(2) +'","humidity":"'+readout.humidity.toFixed(2)+'" }}');
		console.log('Temperature: ' + readout.temperature.toFixed(2) + 'C, ' +
            'humidity: ' + readout.humidity.toFixed(2) + '%');
        setTimeout(function () {
            sensor.read();
        }, 60000);
    }
};



if (sensor.initialize()) {
    sensor.read();
} else {
    console.warn('Failed to initialize sensor');
}




 
    
    

                          
                          
   

