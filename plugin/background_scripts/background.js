var tabs = {}
var ports = {}

var latest_port = false;

var loaded = false;

function LoadPickerOverlay(tab){
	
	// Should probably change this
	browser.tabs.executeScript({file: "/content_scripts/element_picker_factory.js"})
		.then( ()=> browser.tabs.executeScript({file: "/content_scripts/picker_overlay.js"}))
	
	if(!loaded){
		browser.tabs.executeScript({file: "/content_scripts/utils.js"})
		
			
		browser.tabs.executeScript({file: "/content_scripts/login_prompt.js"})
		tabs[tab.id] = {visible: true};
			
		browser.tabs.insertCSS({file: "/css/element_picker.css"})
		loaded = true;
	}
}

browser.browserAction.onClicked.addListener(LoadPickerOverlay);