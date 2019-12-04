var login_token


var picker_open = false

var picker = false
var login = false
var logger = false

var tabs = {}

var bgid = -1

function log(msg){
	picker.postMessage({greeting: '[BackgroundScript('+bgid+']: '+msg})
}

function error(e){
	picker.postMessage({greeting: '[BackgroundScript ERROR]: '+e})
}

function OnMessage(msg, sender, sendResponse){
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
}

function AcceptConnection(p){
	let id = p.name
	
	if(id == 'picker'){
		picker = p;
	}
	else if(id == 'login'){
		login = p;
	}
	else if(id == 'logger'){
		logger = p;
	}
	else{
		log('Unknown connection origin: '+id)
		return
	}
	p.onMessage.addListener(OnMessage);
	log('Connection Accepted: '+id)
}


function LoadPickerOverlay(tab){
	if(tab.id in tabs){
		log('Tab has overlay already')
		picker.postMessage({greeting: 'close', close: true});
		delete tabs[tab.id];
	}
	else{
		browser.tabs.executeScript({file: "/content_scripts/utils.js"})
		browser.tabs.executeScript({file: "/content_scripts/picker_overlay.js"})
		browser.tabs.executeScript({file: "/content_scripts/element_picker_factory.js"})
		tabs[tab.id] = {url: tab.url}
	}		
};

// Depreciated
// function HandleMessage(req, sender, sendResponse){
	// if(req.login_successful){
		// login_token = res.token
		// for(let tab of tabs){
			// browser.tabs.sendMessage(tab.id, {login_successful: true})
		// }
	// }
// }
bgid = Math.ceil(Math.random()*100)
browser.browserAction.onClicked.addListener(LoadPickerOverlay);
browser.runtime.onConnect.addListener(AcceptConnection);
// browser.tabs.executeScript({file: "/content_scripts/logger.js"})'