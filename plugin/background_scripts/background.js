var tabs = {}
var ports = {}

var latest_port = false

function LoadPickerOverlay(tab){
	// if(tab.id in tabs == false || tab.id in ports == false){
		browser.tabs.executeScript({file: "/content_scripts/utils.js"})
		
		browser.tabs.executeScript({file: "/content_scripts/element_picker_factory.js"})
			.then( ()=> browser.tabs.executeScript({file: "/content_scripts/picker_overlay.js"}))
			
		browser.tabs.executeScript({file: "/content_scripts/login_prompt.js"})
		tabs[tab.id] = {visible: true};
	// }
	// else{
		// if(tabs[tab.id].visible){
			// try{
			// ports[tab.id].postMessage({greeting: 'hide', hide: true});
			// }catch(e){}
			// tabs[tab.id].visible = false;
		// }
		// else{
			// try{
			// ports[tab.id].postMessage({greeting: 'show', show: true});
			// }catch(e){}
			// tabs[tab.id].visible = true;
		// }
	// }
}

function AcceptConnection(port){
	port.onMessage.addListener(OnMessage);
	latest_port = port;
	port.postMessage({greeting: "What's your tab id", register: true});
}

function OnMessage(msg, sender, sendResponse){
	tab_id = sender.sender.tab.id
	if(msg.register){
		ports[tab_id] = latest_port;
		latest_port = false;
	}
}

browser.browserAction.onClicked.addListener(LoadPickerOverlay);
browser.runtime.onConnect.addListener(AcceptConnection);