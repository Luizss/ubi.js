/* Auxiliar definitions */

var noInput  = null;
var noFather = null;
var doNothing = function () {};

/* DynamicData initiation */

var dynamicData = {
    global : {
	0 : {
	    sons : null,
	    father : null,
	    state : {}
	}
    },
    main : {
	0 : {
	    father : null,
	    sons : [],
	    state : {},
	}
    }
};

/* StaticData example - User Input */

var staticData = {
    'main' : {
	onInit : onInitMain,
	onInput : doNothing,
	onOutput : onOutputMain,
	defaultState : { a : 3, b : 0 },
	template : '<b><%= a %></b><b><%= a %></b><div data-component="hey" data-input="<%= b %>"></div><div data-component="hey" data-input="<%= b %>"></div><b><%= a %></b>'
    },
    'hey' : {
	onInit : onInitHey,
	onInput : onInputHey,
	onOutput : doNothing,
	defaultState : { a : 3 },
	template : '<b><%= a %></b><b><%= a %></b><b><%= a %></b>'
    },
    'sem' : {
	onInit : onInitSem,
	onInput : onInputSem,
	onOutput : doNothing,
	defaultState : {},
	template : ''
    }
};

function onInitSem (el) {
    console.log('SEM');
    console.log(el);
    console.log('SEM');
}

function onInputSem (el, inp) {
    
    console.log('INPUTSEM');
    console.log(inp);
    console.log('SEMINPUT');
    setTimeout(function () {

	el.sendOutput({ imovel : 'apartamento'});
	
    }, 5000);
    
}

function onInitMain (el) {
    
    console.log('oninit2');
    var sem = el.createNew('sem');
    el.sendInput(sem, 1);
    
    el.get$().hover(function () { // events

	var c = el.getState().a;
	console.log(c);
	el.sendInput(sem, 2);
	if (c < 10)
	    el.putState({ a : Number(c) + 1 });
	else
	    el.putState({ a : 10 });

	el.putState({ b : 0 });

	el.render();
	
	console.log('hover');
	
    });
    
}

function onOutputMain (el,comp,out) {
    
    console.log('ONOUTPUT');
    console.log(el);
    console.log(comp);
    console.log(out);
    
}

function onInitHey (el) {
    
    console.log('oninit1');
    
    el.get$().click(function () { // events
	
	var c = el.getState().a;

	if (c < 10)
	    el.putState({ a : Number(c) + 1 });
	else
	    el.putState({ a : 10 });
	
	el.render();
	el.sendOutput(c);
	console.log('CLICK');
	
    });

}

function onInputHey (el, inp) {

    console.log('In');
    el.putState({ a : inp });

    el.render();
    
};

/* Component class */

var Component = {
    getState : getState,
    putState : putState,

    createNew : createNew,
    sendInput : sendInput,
    sendOutput : sendOutput,

    getFather : getFather,
    getSons : getSons,
    
    getDOM : getDOM,
    get$ : get$,
    
    render : render
};

/* Component Methods */

// elem.getState()
function getState () {

    return dynamicData[this.name][this.id].state;
    
}

// elem.putState({ attr : val })
// elem.putState({ attr1 : val1, attr2 : val2, ... })
function putState (obj) {

    for (var k in obj) {
	if (obj.hasOwnProperty(k)) {
	    dynamicData[this.name][this.id].state[k] = obj[k];
	}
    }
    
}

// father.createNew(componentName)
function createNew (name) {

    var newId = makeNewId(name);
    var elem = { name : name, id : newId };
    createElem(elem, this);
    return elem;
   
}

// father.sendInput(son, input)
function sendInput (elem, inp) {

    staticData[elem.name].onInput(elem, inp);

}

// son.sendOutput(output)
function sendOutput (output) {

    var father = dynamicData[this.name][this.id].father;
    staticData[father.name].onOutput(father, this, output);
    
}

// son.getFather()
function getFather () {

    return dynamicData[this.name][this.id].father;

}

// father.getSons()
// father.getSons(name)
// returns sons named *name* or all sons 
function getSons (name) {

    if (!name) {
	return dynamicData[this.name][this.id].sons;
    } else {
	return dynamicData[this.name][this.id].sons.filter(function (son) {
	    return son.name == name;
	});
    }

}

// elem.getDOM()
// returns Javascript DOM element
function getDOM () {

    var name_query = '[data-component="' + this.name + '"]';
    var id_query = '[data-id="' + this.id + '"]';

    var comps = document.querySelectorAll(name_query);

    if (comps.length == 1)
	return comps[0];
    else
	return document.querySelectorAll(name_query + id_query)[0];

}

// elem.getDOM()
// returns JQuery Element
function get$ () {

    var name_query = '[data-component="' + this.name + '"]';
    var id_query = '[data-id="' + this.id + '"]';

    var comps = $(name_query);

    if (comps.length == 1)
	return comps;
    else
	return $(name_query + id_query);

}


// elem.render()
// render template with new state value
var rendering = '';
function render () {

    var name = this.name;
    var id   = this.id;

    var templ = staticData[name].template;

    if (templ && templ != '') {

	if (rendering == '') {

	    rendering = name;

	}
	
	var state = dynamicData[name][id].state;
	var globalState = dynamicData['global'][0].state;

	state.global = globalState;
	var after = _.template(templ)(state);
	var before = getHTML(this);

	var result = '';
	var createdElems = [];
	
	if (before != '') {

	    var listBefore = componentsList(before);
	    var listAfter = componentsList(after);

	    var modifications = modifyComponents(listBefore,listAfter);

	    destroyElems(modifications.destroy, this);
	    var htmls1 = createElems(modifications.create, this);
	    var htmls2 = modifyElems(modifications.input, this);
	    
	    result = substHTMLs(after, this, htmls1.concat(htmls2));
	    createdElems = htmls1;
	    
	} else {

	    createdElems = createElems(componentsList(after), this);
	    result = substHTMLs(after, this, createdElems);

	}

	if (this.getDOM()) {

	    if (rendering == name) {
		diffing(result, this);
		rendering = '';
	    }
	    dynamicData[name][id].html = result;
	    
	} else {
	    
	    dynamicData[name][id].html = result;
	    var e = this;
	    setTimeout(function () {
		staticData[e.name].onInit(e);
	    }, 1);
	    
	}

    }

}

/* Initial function call */

function init () {

    var mainElem = {
	name : 'main',
	id : 0
    };

    createElem(mainElem, noFather);
    
    staticData['main'].onInit(mainElem);

}

/* Auxiliar Functions  */

// Create element with name and id inside a father element
function createElem (elem, fatherElem) {

    // element extends component methods
    $.extend(elem, Component);

    if (staticData[elem.name]) {
	
	// update father's dynamic data
	if (fatherElem) {
	    
	    dynamicData[fatherElem.name][fatherElem.id].sons.push(elem);
	    
	}

	//initializing dynamicData for the new element
	if (!dynamicData[elem.name]) {
	    
	    dynamicData[elem.name] = {};

	}    

	dynamicData[elem.name][elem.id] = {
	    father : fatherElem,
	    sons : [],
	    state : $.extend({}, staticData[elem.name].defaultState) // $.extend copies object
	};

	if (staticData[elem.name].template && staticData[elem.name].template != '') 
	    elem.render();
	else
	    staticData[elem.name].onInit(elem);

    } else {

	ubiError('Element "' + elem.name + '" is not defined.');

    }
    
}

function substHTMLs (htmlText, elem, elems) {

    var html = $('<div></div>').append($(htmlText));
    
    _.each(elems, function (elem) {

	var comp = $(html).find('[data-component="' + elem.name + '"]');

	if (comp.length == 1) {

	    comp.html(elem.html());

	} else {

	    var h = $(html).find('[data-component="' + elem.name + '"]:not([data-id])').first();
	    h.html(elem.html);
	    h.attr('data-id', elem.id);
	    
	}
	
    });

    return $(html).html();
    
}

function makeNewId (name) {

    var ids = [];
    
    for (var key in dynamicData[name]) {
	if (dynamicData[name].hasOwnProperty(key)) {
	    ids.push(Number(key));
	}
    }

    if (ids.length == 0)
	return 0;
    else
	return _.max(ids) + 1;
    
}


function createElems (objs, father) {
    return _.map(objs, function (obj) {

	var newElem = father.createNew(obj.name);
	
	return {
	    name : obj.name,
	    id : newElem.id,
	    html : dynamicData[obj.name][newElem.id].html
	}
	
    });
}

function destroyElems (objs, father) {
    _.each(objs, function (obj) {
	delete dynamicData[obj.name][obj.id];
	var i = dynamicData[father.name][father.id].sons.indexOf({ name : obj.name, id: obj.id });
	dynamicData[father.name][father.id].sons.splice(i, 1);
    });
}

function modifyElems (objs, father) {
    return _.map(objs, function (obj) {
	if (obj.input) {
	    var elem = $.extend({ name: obj.name, id: obj.id }, Component);
	    staticData[obj.name].onInput(elem, obj.input);
	}
	return {
	    name : obj.name,
	    id : obj.id,
	    html : dynamicData[obj.name][obj.id].html
	}
    });
}

function getHTML (elem) {

    var dom = elem.getDOM();
    
    if (dom)
	return dom.innerHTML;
    else
	return '';
    
}

function elementExist (elem) {

    if (dynamicData[elem.name]) {

	if (dynamicData[elem.name][elem.id]) {

	    return true;

	}

    }

    return false;

}

function componentsList (htmlText) {

    var html = $.parseHTML(htmlText);
    var res = [];
    
    $.each(html, function (i, el) {

	if ($(el).attr('data-component')) {
	    
	    res.push({
		name : $(el).attr('data-component'),
		id : $(el).attr('data-id'),
		input : $(el).attr('data-input')
	    });
	    
	} else {
	    
	}
	
    })

    return res;

}

function modifyComponents (before, after) {

    var res = { destroy : [], create: [], input: [] };
    var end = false;
    var b = 0;
    var a = 0;
    var actualComp = '';
    
    while (!end) {

	if (b >= before.length && a >= after.length) {
	    
	    end = true;
	    
	} else if (b >= before.length) {

	    //destroy
	    end = true;

	} else if (a >= after.length) {

	    //create
	    end = true;
	    
	} else {

	    var nameB = before[b].name;
	    var nameA = after[a].name;
	    var id    = before[b].id;
	    var input = after[a].input;
	    
	    if (nameB == nameA) {
		
		res.input.push({ name : nameB, id : id, input : input });
		
		actualComp = nameB;
		
		a++; b++;
		
	    } else if (nameB != actualComp && nameA != actualComp) {

		res.destroy.push({ name: nameB, id: id });
		res.create.push({ name: nameA });
		
		actualComp = nameA;
		
		a++; b++;
		
	    } else if (nameB != actualComp) {

		res.destroy.push({ name: nameB, id: id });
		
		actualComp = nameA;
		
		b++;

	    } else if (nameA != actualComp) {

		res.create.push({ name: nameA, input: input });
		
		actualComp = nameA;
		
		a++;

	    }
	    
	}

    }

    return res;

}

var renderer = {};

function diffing (html, elem) {

    var el = elem.getDOM();

    if (!renderer) {

	renderer = {};

    }
    
    if (!renderer[elem.name]) {

	renderer[elem.name] = {};

    }
    
    if (!renderer[elem.name][elem.id]) {

	renderer[elem.name][elem.id] = new DiffRenderer(el);
	DiffRenderer.start();
	
    }

    renderer[elem.name][elem.id].update(html);

}

function checkForInputs (father, htmlText) {

    var html = $.parseHTML(htmlText);
    $.each(html, function (el) {

	var name = el.attr('data-component');
	var id   = el.attr('data-id');
	
	if (name) {

	    var inp = el.attr('input');
	    
	    if (!id) {

		id = makeNewId(name);
		
	    }

	    var elem = $.extend({ name : name, id : id }, Component);
	    if (!elementExist(elem)) {
		createElem(elem, father);
	    }
	    father.sendInput(elem,inp);

	}

    });

}

function ubiError (errMsg) {

    console.error('UbiJS Error: ' + errMsg);

}

init();
