var login_token
var ports = {}
var funcs
var first_port = true
var picker_open = false

function log(msg){
	ports[first_port].postMessage({greeting: '[BackgroundScript]: '+msg})
}

function error(e){
	ports[first_port].postMessage({greeting: '[BackgroundScript ERROR]: '+e})
}

function OnMessage(msg, sender, sendResponse){
	// log('Message Redcieved: '+msg.greeting)
	if(msg.show_login_prompt){
		browser.tabs.executeScript({file: "/content_scripts/login_prompt.js"});
	}		
}

function AcceptConnection(p){
	let id = p.name
	if(first_port){
		first_port = id;
	}
	
	ports[id] = p;
	ports[id].onMessage.addListener(OnMessage);
	log('connection accepted')
};


function LoadPickerOverlay(tab){
	if(picker_open == false){
		browser.tabs.executeScript({file: "/content_scripts/utils.js"})
		browser.tabs.executeScript({file: "/content_scripts/picker_overlay.js"})
		browser.tabs.executeScript({file: "/content_scripts/element_picker_factory.js"})
		picker_open = true
	}
	else{
		ports['picker'].postMessage({greeting: 'Close', close: true})
		picker_opne = false
	}
};

function HandleMessage(req, sender, sendResponse){
	if(req.show_login_prompt){
		browser.tabs.executeScript({file: "/content_scripts/login_prompt.js"})
		sendResponse({response: 'Loaded login_prompt.js'})
	}
	if(req.login_successful){
		try{
		login_token = res.token
		for(let tab of tabs){
			
			browser.tabs.sendMessage(tab.id, {login_successful: true})
		}
		}catch(e){alert(e)}
	}
}

browser.runtime.onConnect.addListener(AcceptConnection);
browser.runtime.onMessage.addListener(HandleMessage);
browser.browserAction.onClicked.addListener(LoadPickerOverlay);