function LoginPromptFactory(){
	var port
	
	function ConnectToBackgroundScript(){
		port = browser.runtime.connect({name: 'picker'})
		port.onMessage.addListener(OnMessage);	
	}

	function OnMessage(m){
		console.log(m.greeting);
	}		
		
	function GetSubmissionData(){
		var username = document.getElementById('platter-username').value
		var password = document.getElementById('platter-password').value
		
		return {'username': username, 'password': password}
	}

	function PrecheckSubmissionData(data){
		return data.username.length != 0 && data.password.length != 0
	}

	function SubmitLogin(){
		var data = GetSubmissionData();
		if(PrecheckSubmissionData(data) == false){
			console.log('Precheck failed')
			return false;
		}
		
		var xhr = new XMLHttpRequest()
		data = JSON.stringify(data)
		
		xhr.open("POST", 'http://localhost:8000/plugin_login')
		xhr.setRequestHeader('Content-type', 'application/json; charset=utf-8');
		xhr.onreadystatechange = function () {
			if(xhr.readyState === XMLHttpRequest.DONE && xhr.status === 200) {
				
				let submit_response = JSON.parse(xhr.responseText)
				if(submit_response.success){
					document.getElementById('platter-login-body').remove()
					browser.runtime.sendMessage({
						login_successful: true,
						hide_login_prompt: true,
						login_token: submit_response.token
					})
				}
					
			}
		};
		xhr.send(data)
		
	}

	function SubmitRegistration(){
		console.log('registering...')
	}
	
	function CancelLogin(){
		var login_prompt = document.getElementById('platter-login-body')
		console.log(login_prompt)
		login_prompt.parentNode.removeChild(login_prompt);
	}

	function InitControls(){
		
		document.getElementById('platter-webext-login').onclick = SubmitLogin;
		// document.getElementById('platter-webext-register').onclick = SubmitRegistration;
		document.getElementById('platter-webext-cancel').onclick = CancelLogin;
		
		browser.runtime.onMessage.addListener(
			function(req, sender, senderResponse){
				console.log('Message recieved')
				console.log(req)
				if(req.login_successful){
					console.log('logindetected successful login')
				}
			}
		);
	}

	function OpenLoginPrompt(){
		var picker_interface_url = browser.runtime.getURL("html/login_prompt.html");
		var request = new XMLHttpRequest();
		request.open('GET', picker_interface_url, true)

		request.onload = function(){
			if(request.status >=200 && request.status <400){
				var resp = request.responseText;			
				var frag = document.createElement('html');
				frag.innerHTML = resp;
				var login_prompt = document.querySelector('body').appendChild(frag);	

				InitControls();
				ConnectToBackgroundScript();
					
			}
		};

		request.send();
		
		
	}
	
	var login_prompt = {}
	login_prompt.Open = OpenLoginPrompt;
	return login_prompt
}

login_prompt = LoginPromptFactory()

login_prompt.Open()