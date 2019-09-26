var picking = false;
var picking_id = '';
var picking_subheading = false;
var max_line_display_length = 100;

var element_picker = elementPickerFactory();

var local_test_env = true;

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
	
	console.log('stopped picking')
	
	document.getElementById('pick-'+id+'-subheading').style.visibility = 'hidden';
	
	picking = false
	
	return false
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
																						
	document.getElementById('submit-recipe').onclick = Submit;
	
	for(let el of document.getElementsByClassName('pick-subheading')){
		el.style.visibility = 'hidden';
		el.onclick = function(){ picking_subheading = true; };
		picking_subheading = false;
	}
}

function OpenInterface(){
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
		}
	};

	request.send();
}

function CloseInterface(){
	var elem = document.querySelector('#plater-epicker');
	elem.parentNode.removeChild(elem);
}

function PostData(url = '', data = {}) {
  // Default options are marked with *
    return fetch(url, {
        method: 'POST', // *GET, POST, PUT, DELETE, etc.
        mode: 'cors', // no-cors, cors, *same-origin
        cache: 'no-cache', // *default, no-cache, reload, force-cache, only-if-cached
        credentials: 'same-origin', // include, *same-origin, omit
        headers: {
            'Content-Type': 'application/json',
            // 'Content-Type': 'application/x-www-form-urlencoded',
        },
        redirect: 'follow', // manual, *follow, error
        // referrer: 'client', // no-referrer, *client
        body: JSON.stringify(data), // body data type must match "Content-Type" header
    })
    .then(response => response.json()); // parses JSON response into native JavaScript objects 
}

function Submit(){
	post_url = local_test_env ? 'http://localhost:8000/submit_recipe' : 'https://platter.mybluemix.net/api/submit';

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

function elementPickerFactory() {

  if (typeof window === 'undefined' || !window.document) {
    console.error('elementPicker requires the window and document.');
  }

  var oldTarget;
  var desiredBackgroundColor = 'rgba(0, 0, 0, 0.1)';
  var oldBackgroundColor;
  var onClick;

  function onMouseMove(event) {

    event      = event || window.event;
    var target = event.target || event.srcElement;
    if (oldTarget) {
      resetOldTargetColor();
    }
    else {
      document.body.style.cursor = 'pointer';
    }
    oldTarget = target;
    oldBackgroundColor = target.style.backgroundColor;
    target.style.backgroundColor = desiredBackgroundColor;

  }

  function onMouseClick(event) {

    event      = event || window.event;
    var target = event.target || event.srcElement;
    if (event.preventDefault) event.preventDefault();
    if (event.stopPropagation) event.stopPropagation();
    onClick(target);
    return false

  }

  function reset() {

    document.removeEventListener('mousedown', onMouseClick, false);
    document.removeEventListener('mousemove', onMouseMove, false);
    document.body.style.cursor = 'auto';
    if (oldTarget) {
      resetOldTargetColor();
    }
    oldTarget = null;
    oldBackgroundColor = null;

  }

  function resetOldTargetColor() {
    oldTarget.style.backgroundColor = oldBackgroundColor
  }

  function init(options) {

    if (!options || !options.onClick) {
      console.error('onClick option needs to be specified.');
      return;
    }
    desiredBackgroundColor = options.backgroundColor || desiredBackgroundColor
    onClick = options.onClick;
    document.addEventListener('mousedown', onMouseClick, false);
    document.addEventListener('mousemove', onMouseMove, false);

    return elementPicker;

  }

  /**
   * The library object.
   * @property {Function} init    - Function called to init the library.
   * @property {Function} onClick - The callback triggered once an element is clicked.
   * @property {String} version   - The library's version.
   * @type {Object}
   */
  var elementPicker     = {};
  elementPicker.version = '1.0.1';
  elementPicker.init    = init;
  elementPicker.reset   = reset;

  return elementPicker;

};

function onClick(element){
	var picker_div = document.getElementById('plater-epicker');
	if(picker_div == element || picker_div.contains(element) == true){
		return;// ignore ourselves
	}
	
	var text = element.innerText;
	if(picking_id == 'title'){
		SetTitle(text);
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

function main(){
	if(window.interface_open){
		CloseInterface();
		window.interface_open = false;
	}
	else{
		OpenInterface();
		window.interface_open = true;
	}
}

main()

