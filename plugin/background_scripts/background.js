var tabs = {}
var ports = {}

var latest_port = false

function LoadPickerOverlay(tab){
	console.log('load picker overlay backgrounds');
		browser.tabs.executeScript({file: "/content_scripts/utils.js"})
		
		browser.tabs.executeScript({file: "/content_scripts/element_picker_factory.js"})
			.then( ()=> browser.tabs.executeScript({file: "/content_scripts/picker_overlay.js"}))
			
		browser.tabs.executeScript({file: "/content_scripts/login_prompt.js"})
		tabs[tab.id] = {visible: true};
		
		browser.tabs.insertCSS({file: "/css/element_picker.css"})
}

function AcceptConnection(port){
	console.log('accept connection')
	port.onMessage.addListener(OnMessage);
	latest_port = port;
	port.postMessage({greeting: "What's your tab id", register: true});
}

function OnMessage(msg, sender, sendResponse){
	console.log('onmessage')
	console.log(msg)
	tab_id = sender.sender.tab.id
	if(msg.register){
		ports[tab_id] = latest_port;
		latest_port = false;
	}
}

browser.browserAction.onClicked.addListener(LoadPickerOverlay);
browser.runtime.onConnect.addListener(AcceptConnection);