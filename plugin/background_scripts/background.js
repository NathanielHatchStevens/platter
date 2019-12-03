var login_token
// var ports = {}
var funcs
var first_port = true
var picker_open = false

var picker = false
var login = false

function log(msg){
	picker.postMessage({greeting: '[BackgroundScript]: '+msg})
}

function error(e){
	picker.postMessage({greeting: '[BackgroundScript ERROR]: '+e})
}

function OnMessage(msg, sender, sendResponse){
	try{
	if(msg.relay){
		target = msg.relay_target
		delete msg.relay
		delete msg.relay_target
		
		if(target == 'picker'){
			picker.postMessage(msg)
		}
		else{
			log('Unknown relay target: '+target)
		}
	}
	if(msg.show_login_prompt){
		browser.tabs.executeScript({file: "/content_scripts/login_prompt.js"});
	}
	}catch(e){log(e)}
}

function AcceptConnection(p){
	let id = p.name
	
	if(id == 'picker'){
		picker = p;
	}
	else if(id == 'login'){
		login = p;
	}
	else{
		log('Unknown connection origin: '+id)
		return
	}
	p.onMessage.addListener(OnMessage);
	log('Connection Accepted: '+id)
}


function LoadPickerOverlay(tab){
	if(picker_open == false){
		browser.tabs.executeScript({file: "/content_scripts/utils.js"})
		browser.tabs.executeScript({file: "/content_scripts/picker_overlay.js"})
		browser.tabs.executeScript({file: "/content_scripts/element_picker_factory.js"})
		picker_open = true
		
		// browser.storage.local.get('token').then(function(data){
			// picker.postMessage({greeting: 'Stored Login', data: data})
		// });
	}
	else{
		picker.postMessage({greeting: 'Close', close: true})
		picker_open = false
		// alert()
	}
};

// Depreciated
function HandleMessage(req, sender, sendResponse){
	if(req.login_successful){
		login_token = res.token
		for(let tab of tabs){
			browser.tabs.sendMessage(tab.id, {login_successful: true})
		}
	}
}

browser.runtime.onConnect.addListener(AcceptConnection);
browser.runtime.onMessage.addListener(HandleMessage);
browser.browserAction.onClicked.addListener(LoadPickerOverlay);