function LoginPromptFactory() {
	var port = 0;
	var username = 0;
	
	function OnMessage(m){
		if(m.register){
			port.postMessage({register: true})
		}
	}		
	
	function ConnectToBackgroundScript(){
		port = browser.runtime.connect({name: 'login'});
		port.onMessage.addListener(OnMessage);	
	}

	function GetSubmissionData(){
		return {
					'username': document.getElementById('platter-login-username-input').value, 
					'password': document.getElementById('platter-login-password-input').value
				  };
	}

	function PrecheckSubmissionData(data){
		return data.username.length != 0 && data.password.length != 0;
	}

	function SubmitLogin(){
		console.log('Submitting login');
		var data = GetSubmissionData();
		if(PrecheckSubmissionData(data) == false){
			console.log('Precheck failed');
			return false;
		}
		username = data.username;
		
		var xhr = new XMLHttpRequest();
		data = JSON.stringify(data);
		
		xhr.open("POST", 'http://13.211.52.96:8000/plugin_login')
		// xhr.open("POST", 'ec2-13-211-52-96.ap-southeast-2.compute.amazonaws.com:8000/plugin_login')
		// xhr.open("POST", 'http://localhost:8000/plugin_login');
		xhr.setRequestHeader('Content-type', 'application/json; charset=utf-8');
		xhr.onreadystatechange = function () {
			console.log('request status: '+xhr.status);
			console.log('request status: '+xhr.statusText);
			if(xhr.readyState === XMLHttpRequest.DONE && xhr.status === 200) {
				let submit_response = JSON.parse(xhr.responseText);
				if(submit_response.success){
					ReturnToPicker(true, {username: username});
					// document.getElementById('platter-login-body').style.display = 'none';
					// console.log(username);
					browser.storage.local.set({login_info: {username: username, token: submit_response.token}});
					// var msg = {greeting: 'Login Successful', 
 								  // relay: true,
								  // relay_target: 'picker',
								  // login_successful: true, 
								  // username: username,
								  // token: submit_response.token};
					// port.postMessage(msg);
				}
				else{
					console.log('failed');
				}
					
			}
		};
		xhr.send(data);
	}

	function SubmitRegistration(){
		console.log('Registration not yet implemented');
	}
	
	function ReturnToPicker(success, login_info){
		HideLogin();
		picker.ReturnFromLogin(success, login_info);
	}
	
	function HideLogin(){
		document.getElementById('platter-login-body').style.display = 'none';
	}

	function ShowLogin(){
			let el = document.getElementById('platter-login-body');
			el.style.display = 'block';
			el.style.zIndex = '100';
	}

	function InitControls(){		
		document.getElementById('platter-webext-login').onclick = SubmitLogin;
		document.getElementById('platter-webext-register').onclick = SubmitRegistration;
		document.getElementById('platter-webext-cancel').onclick = HideLogin;
	}

	function LoadLoginPromptHTML(){
		var picker_interface_url = browser.runtime.getURL("html/login_prompt.html");
		var request = new XMLHttpRequest();
		request.open('GET', picker_interface_url, true);

		request.onload = function(){
			if(request.status >=200 && request.status <400){
				var resp = request.responseText;			
				var frag = document.createElement('html');
				frag.innerHTML = resp;
				var login_prompt = document.querySelector('body').appendChild(frag);	

				InitControls();
				ConnectToBackgroundScript();
				HideLogin();
				
					
			}
		};

		request.send();
		
		
	}
	
	var login_prompt = {};
	login_prompt.Load = LoadLoginPromptHTML;
	login_prompt.Hide = HideLogin;
	login_prompt.Show = ShowLogin;
	return login_prompt;
}

// only create it if it doesn't exist
if(typeof login_prompt != "object"){
	login_prompt = LoginPromptFactory();
	login_prompt.Load();
}