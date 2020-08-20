function LoginPromptFactory() {
	var username = 0;
	
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
		var data = GetSubmissionData();
		if(PrecheckSubmissionData(data) == false){
			console.log('Precheck failed');
			return false;
		}
		username = data.username;
		
		PostData('http://localhost:8000/plugin_login', data)
		.then(response => response.json().then(
			function(submit_response){
				console.log(submit_response);
				if(submit_response.success){
					browser.storage.local.set({login_info: {username: username, token: submit_response.token}});
					ReturnToPicker(true);
				}
				else{
					console.log('failed');
					alert('failed');
					ReturnToPicker(false);
				}
			}));
	}

	function SubmitRegistration(){
		console.log('Registration not yet implemented');
	}
	
	function ReturnToPicker(success){
		HideLogin();
		picker.ReturnFromLogin(success);
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