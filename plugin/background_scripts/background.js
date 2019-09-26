// var user_id = '5d5b84d4eab1510c48626ed9'

function handleClick(tab){
	browser.tabs.executeScript({file: "/content_scripts/interface_inserter.js"})		// I live in the webpage and can maniuplate dom
};


browser.browserAction.onClicked.addListener(handleClick);