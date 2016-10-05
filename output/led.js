module.exports = {
	led_switch : function(led, on){
		if(on)
			led.writeSync(1);
		else
			led.writeSync(0);

	}
};

