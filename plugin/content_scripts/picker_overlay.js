function PickerOverlayFactory(){
		
	var picker = {}
	
	var picking = false;
	var picking_id = '';
	var picking_subheading = false;
	var max_line_display_length = 100;

	var element_picker = elementPickerFactory();

	var port

	function StartPicking(id){
		if(picking == true){
			return false;
		}
		
		element_picker.init({onClick});
		picking_id = id;
		
		var pick_done_button = document.getElementById('start-picking-'.concat(id));
		pick_done_button.innerText = 'Done';
		
		pick_done_button.onclick = (function (myvar){
												return function(){
													StopPicking(myvar);
												}
											})(id);	
		document.getElementById('pick-'+id+'-subheading').style.visibility = 'visible';
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
												}
											})(id);
			
		document.getElementById('pick-'+id+'-subheading').style.visibility = 'hidden';
		picking = false	
		return false
	}

	function OnMessage(msg){
		console.log(msg.greeting);
		if(msg.close){
			console.log('closing')
			picker_dom = document.getElementById('picker-overlay-main')
			console.log(picker_dom)
			picker_dom.parentNode.removeChild(picker_dom)
		}
	}

	function ConnectToBackgroundScript(){
		port = browser.runtime.connect({name: 'picker'})
		port.onMessage.addListener(OnMessage);	
	}

	function ShowLoginPrompt(){
		port.postMessage({greeting: 'Show the login prompt', show_login_prompt: true});
	}

	function InitControls(){
		document.getElementById('start-picking-title').onclick = (function (id){
																						return function(){
																							StartPicking(id);
																						}
																					})('title');
		
		document.getElementById('start-picking-ingredients').onclick = (function (id){
																								return function(){
																									StartPicking(id);
																								}
																							})('ingredients');
																							
		document.getElementById('start-picking-method').onclick =  (function (id){
																								return function(){
																									StartPicking(id);
																								}
																							})('method');
																							
		document.getElementById('submit-recipe').onclick = SubmitRecipe;
		document.getElementById('submit-login').onclick = ShowLoginPrompt;
		// document.getElementById('submit-login').onclick = ShowLoginPrompt;
		
		for(let el of document.getElementsByClassName('pick-subheading')){
			el.style.visibility = 'hidden';
			el.onclick = function(){ picking_subheading = true; };
			picking_subheading = false;
		}
	}

	function LoadHTML(){
		// var picker_interface_url = browser.runtime.getURL("html/login_prompt.html");
		var picker_interface_url = browser.runtime.getURL("html/element_picker.html");
		var request = new XMLHttpRequest();
		request.open('GET', picker_interface_url, true)

		request.onload = function(){
			if(request.status >=200 && request.status <400){
				var resp = request.responseText;			
				var frag = document.createElement('html');
				frag.innerHTML = resp;
				document.querySelector('body').appendChild(frag);	
				InitControls();
				console.log('overlay loading')
				ConnectToBackgroundScript();
			}
		};

		request.send();
	}

	function CloseInterface(){
		var elem = document.querySelector('#plater-epicker');
		elem.parentNode.removeChild(elem);
	}


	function SubmitRecipe(){
		post_url ='http://localhost:8000/submit_recipe'

		var recipe = {};
		recipe['owner'] = '5d5b84d4eab1510c48626ed9';
		recipe['url'] = document.URL;
		recipe['title'] = document.getElementById('recipe-title').innerText;
		
		for(let id of ['ingredients', 'method']){
			
			recipe[id] = [];		
			
			for(let li of Array.from(document.getElementById(id).children)){
				var line = li.getAttribute('data-full-line');
				var subheading = (li.getAttribute('data-heading') == '1')
				recipe[id].push({'line':line, 'subheading': subheading})	
			}
		}
		
		PostData('', recipe)
		.then(data => console.log(JSON.stringify(data))) // JSON-string from `response.json()` call
		.catch(error => console.error(error));
	}

	function onClick(element){
		var picker_div = document.getElementById('picker-overlay-main');
		if(picker_div == element || picker_div.contains(element) == true){
			return;// ignore ourselves
		}
		
		var text = element.innerText;
		if(picking_id == 'title'){
			SetTitle(text);
			StopPicking(picking_id)
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
								}
							})(btn);
		
		return btn;
		
	}

	function SetTitle(text){
		var el = document.querySelector('span#recipe-title')
		el.textContent = text;
	}

	function AddToList(text){
		for(let line of text.split('\n')){
			var list = document.querySelector('ul#'+picking_id);
			var new_li = document.createElement('li');
			var index = list.childNodes.length;
			var display_text = 'ERROR'
			
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
				new_li.appendChild(bold)	
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
		LoadHTML();
		if(window.interface_open){
			CloseInterface();
			window.interface_open = false;
		}
		else{
			window.interface_open = true;
		}
	}
	
	picker.run = run;
	return picker
}

picker = PickerOverlayFactory()

picker.run()