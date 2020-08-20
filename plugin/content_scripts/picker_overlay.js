function PickerOverlayFactory(){
	'use strict';
	var picking = false;
	var picking_id = '';
	var picking_subheading = false;
	var max_line_display_length = 100;
	var remote_url ='http://13.211.52.96:8000/submit_recipe';
	
	var element_picker = elementPickerFactory();

	var port;
	var token = false;
	
	var visible = false;
	
	function StartPicking(id){
		if(picking === true){
			return false;
		}
		
		element_picker.init({'onClick': onClick}); //marked
		picking_id = id;
		
		var pick_done_button = document.getElementById('start-picking-'.concat(id));
		pick_done_button.innerText = 'Done';
		
		pick_done_button.onclick = (function (myvar){
												return function(){
													StopPicking(myvar);
												};
											}(id));	//moved invocation into bracked containing function prev: }})(id);
		document.getElementById('pick-'+id+'-subheading').style.display = 'block';
		picking = true;	
		return false; // stops browser follow dud link
	}

	function StopPicking(id){
		element_picker.reset();
		
		var pick_done_button = document.getElementById('start-picking-'.concat(id));
		pick_done_button.innerText = 'Pick';
		
		pick_done_button.onclick = (function (myvar){
												return function(){
													StartPicking(myvar);
												};
											}(id));//moved invocation into bracked containing function prev: }})(id);
			
		document.getElementById('pick-'+id+'-subheading').style.display = 'none';
		picking = false;
		return false;
	}
	
	function SetLoginStatus(){
		browser.storage.local.get('login_info')
		.then(
			function(data){
				if(data.login_info){
					document.getElementById('platter-username').innerHTML = data.login_info.username;
					document.getElementById('platter-login-element').style.display = 'none';
					document.getElementById('platter-username-logout-element').style.display = 'block';
					token = data.login_info.token;
				}
				
				else{
					document.getElementById('platter-login-element').style.display = 'block';
					document.getElementById('platter-username-logout-element').style.display = 'none';
					token = false;
				}
			}
		);
	}
	
	function ReturnFromLogin(success){
		SetLoginStatus();
		ShowPicker();
	}
	
	function LogOut(){
		browser.storage.local.remove('login_info');
		SetLoginStatus();
	}
	
	function OnMessage(msg){
		console.log('message to picker')
		console.log(msg)
		
		if(msg.register){
			port.postMessage({greeting: 'Register me', register: true});
		}
		
		if(msg.close || msg.hide){
			HidePicker();
		}
		
		if(msg.show){
			ShowPicker();
		}
	}
	
	function ConnectToBackgroundScript(){
		var name = 'picker';
		port = browser.runtime.connect({name: name});
		port.onMessage.addListener(OnMessage);
	}

	function ShowLoginPrompt(){
		// alert('show login');
		HidePicker();
		login_prompt.Show();
	}
	
	function InitControls(){
		
		document.getElementById('start-picking-title').onclick = (function (id){
																						return function(){
																							StartPicking(id);
																						};
																					}('title'));
		
		document.getElementById('start-picking-ingredients').onclick = (function (id){
																								return function(){
																									StartPicking(id);
																								};
																							}('ingredients'));
																							
		document.getElementById('start-picking-method').onclick =  (function (id){
																								return function(){
																									StartPicking(id);
																								};
																							}('method'));
																							
		document.getElementById('submit-recipe-local').onclick = SubmitRecipeLocal;
		
		document.getElementById('submit-recipe-remote').onclick = SubmitRecipeRemote;
		document.getElementById('platter-show-login').onclick = ShowLoginPrompt;
		document.getElementById('platter-submit-logout').onclick = LogOut;
		document.getElementById('test-link').onclick = SuccessfulSubmission;
		
		for(let el of document.getElementsByClassName('pick-subheading')){
			el.style.display = 'none';
			el.onclick = function(){ picking_subheading = true; };
			picking_subheading = false;
		}
		
		SetLoginStatus();
	}
	
	function LoadResource(location, success){
		var resource_url = browser.runtime.getURL(location);
		var request = new XMLHttpRequest();
		
		request.open('GET', resource_url, true);
		request.onload = function(){
			if(request.status >=200 && request.status<400){
				if(success != undefined){
					success(request.responseText);
				}
			};
		};
		request.send()
	}
	
	function Load(){
		
		// LoadResource('css/element_picker.css',
					// function(text){
						// console.log(text);
					// });
		LoadResource("html/element_picker.html", 
					function(text){
						var resp = text;
						var frag = document.createElement('html');
						frag.innerHTML = resp;
						document.querySelector('body').appendChild(frag);	
						InitControls();
						ConnectToBackgroundScript();									
					});
					
		LoadResource("html/recipe_submission_success.html",
					function(text){
						var resp = text;
						var frag = document.createElement('html');
						frag.innerHTML = resp;
						document.querySelector('body').appendChild(frag);
						document.getElementById('recipe-submission-success-pop').style.display = 'none';
					});		
	}
	
	function ToggleVisibility(){
		if(visible){
			HidePicker();
		}
		else{
			ShowPicker();
		}
	}
	
	function ShowPicker(){
		var el = document.getElementById('picker-overlay-main');
		if(el != null){
			el.style.display = 'block';
		}
		visible = true;
	}

	function HidePicker(){
		try{
		document.getElementById('picker-overlay-main').style.display = 'none';
		visible = false;
		}catch(e){ console.log(e);}
	}

	
	function SubmitRecipeLocal(){
		var local_url ='http://localhost:8000/submit_recipe';
		SubmitRecipe(local_url);
	}
	
	function SubmitRecipeRemote(){
		SubmitRecipe(remote_url);
	}
		
	
	function SubmitRecipe(url){
		if(token === false){
			alert('not logged in');
			return;
		}
		var post_url = url;
		var recipe = {};
		recipe.token = token;
		recipe.url = document.URL;
		recipe.title = document.getElementById('recipe-title').innerText;
		
		for(let id of ['ingredients', 'method']){
			
			recipe[id] = [];		
			
			for(let li of Array.from(document.getElementById(id).children)){
				var line = li.getAttribute('data-full-line');
				var subheading = (li.getAttribute('data-heading') == '1');
				recipe[id].push({'line':line, 'subheading': subheading});
			}
		}
		
		PostData(post_url, recipe)
		.then(response => response.json())
		// .then(data => console.log(data))
		// .then(data => console.log(JSON.stringify(data))) // JSON-string from `response.json()` call
		.catch(error => console.error(error));
	}

	function SuccessfulSubmission(){
		document.getElementById('picker-overlay-main').style.display = 'none';
		document.getElementById('recipe-submission-success-pop').style.display = 'block';
		document.getElementById('submission-success-link').href = 'http://13.211.52.96:8000/';
		
		window.setTimeout(function(){
				document.getElementById('recipe-submission-success-pop').style.display = 'none';
			},
			5000);

	}

	function onClick(element){
		var picker_div = document.getElementById('picker-overlay-main');
		if(picker_div == element || picker_div.contains(element) == true){
			return;// ignore ourselves
		}
		
		var text = element.innerText;
		if(picking_id == 'title'){
			SetTitle(text);
			StopPicking(picking_id);
		}
		else{
			AddToList(text);
			
		}
	}

	function CreateDeleteButton(name){
		var btn = document.createElement('button');
		btn.setAttribute('type', 'button');
		btn.setAttribute('date-action', 'X');
		btn.innerText = name;
		
		btn.onclick = (function(self){
								return function(){
									var parent = self.parentNode;
									var grand_parent = parent.parentNode;
									grand_parent.removeChild(parent);
								};
							})(btn);
		
		return btn;
		
	}

	function SetTitle(text){
		var el = document.querySelector('span#recipe-title');
		el.textContent = text;
	}

	function AddToList(text){
		for(let line of text.split('\n')){
			var list = document.querySelector('ul#'+picking_id);
			var new_li = document.createElement('li');
			var index = list.childNodes.length;
			var display_text = 'ERROR';
			
			new_li.setAttribute('data-full-line', line);
			
			if(line.length > max_line_display_length){
				display_text = line.substring(0, max_line_display_length)+' ...';
			}
			else{
				display_text = line;
			}
			
			if(picking_subheading){
				bold = document.createElement('b');
				bold.textContent = display_text;
				new_li.appendChild(bold);
				new_li.setAttribute('data-heading', '1');
				picking_subheading = false;
			}
			else{
				new_li.textContent = display_text;
				new_li.setAttribute('data-heading', '0');
			}
			
			new_li.id = index;
			
			new_li.prepend(CreateDeleteButton('X'));
			list.appendChild(new_li);
		}
	}

	function run(){
		Load();
		ShowPicker();
	}
	
	var picker = {};
	picker.ToggleVisibility = ToggleVisibility;
	picker.run = run;
	picker.ReturnFromLogin = ReturnFromLogin;	
	
	return picker;
}

if(typeof picker == "object"){
	picker.ToggleVisibility();
}
else{
	picker = PickerOverlayFactory();
	picker.run();
}

