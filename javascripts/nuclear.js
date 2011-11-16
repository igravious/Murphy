
// http://jsbin.com/esuzud

thing2name = function(obj) { // does not work on jQuery objects ... make it :)
    if (obj.jquery) { return 'jQuery'; }
    var funcNameRegex = /function (.{1,})\(/;
    var results = (funcNameRegex).exec((obj).constructor.toString());
    return (results && results.length > 1) ? results[1] : "";
};

// i don't understand how this works, or how it differs from jQuery.map v1.6

jQuery.collect = function(arr, user_func) {
  var a = [];
  $.each(arr, function(key_from_arr, val_of_key) {
    a.push(user_func(key_from_arr, val_of_key));
  });
  return a;
};


var Gridlock = {
		
	table: function (id) {
		return '<table class="ui-grid"' + (id?' id="' + id + '"':'') + '>\n' + this + '</table>\n';
		},
  

        map2hash: function (the_map) {
        	var name_value = [];
            for (i=0; i<the_map.length; i++) {
				name_value[i] = {};
				//name_value[i][the_map[i].nodeName] = the_map[i].nodeValue;
			name_value[i]['name'] = the_map[i].nodeName;
			name_value[i]['value'] = the_map[i].nodeValue;
            }
                return name_value;
            },
  
        full_html: function (el) {
			attr_list = jQuery.map(Gridlock.map2hash(el.attributes), function(attr, idx) {return attr['name']+'="'+attr['value']+'"';}).join(' ');
		return '<'+el.localName+' '+ attr_list +'>'+el.innerHTML+'</'+el.localName+'>';
        },
  
        t_row: function (key, el, tag) {
	        //console.log(typeof el);
        //console.log(el);
  		if (typeof el === 'object') {
			/* should get whole thing, not just innerHTML */

			return ('<'+tag+'>') + Gridlock.full_html(el) + ('</'+tag+'>');
  		} else {
        	return ('<'+tag+'>') + el.toString() + ('</'+tag+'>');
		}
    },

    t_th: function (key, el) {
		return Gridlock.t_row(key, el, 'th');
    },

    t_td: function (key, el) {
		return Gridlock.t_row(key, el, 'td');
    },
	
	t_head: function () {
		return '<tr>\n  ' + jQuery.collect( this, Gridlock.t_th ).join(' ') + '\n</tr>\n';
	},
	
	t_body: function (columns) {
		var i;
		/* if length is odd ? */
		var rows = this.length / columns;
		var row_by_row = '';
		for (i=0; i<rows; i++) {
			var h = this.slice(i*columns, (i*columns)+columns);
			row_by_row += '<tr>\n' + jQuery.collect( h, Gridlock.t_td ).join('\n') + '</tr>\n';
		}
		return row_by_row;
	},
	
	init: function (gridify, options) {
		/* options object ?? */
		var columns;
		var header;
		if (!options) {
			columns = 2;
			header = false;
			id = null;
		} else {
			columns = options.columns || 2;
			header = options.header || false;
			id = options.id || null;
		}
        if (!gridify || !gridify.length) return null; /* sanity check, what to return? */
  
			if (thing2name(gridify) == 'NamedNodeMap') {
        	var arr = jQuery.map(Gridlock.map2hash(gridify), function(attr, idx) {return [ attr['name'], attr['value'] ];});
          	//console.log(arr);
            return Gridlock.table.call( Gridlock.t_body.call(arr, 2), id );
      	}
        if (thing2name(gridify) == 'Object') {
            // make sure it has a length property
            gridify = $.makeArray(gridify);
        }
        if ((gridify.length % columns) == 0) {
            return Gridlock.table.apply( (header ? Gridlock.t_head.apply(gridify.slice(0,columns)) : '') + (header ? Gridlock.t_body.call(gridify.slice(columns), columns) : Gridlock.t_body.call(gridify, columns)) );
        } else {
			console.log('oh, the unsymmetry');
			return null;
        }
	}
};

/**
 * @author _who _knew _what _when?
 */

// for debugging purposes
var global_ev = null;
var global_ui = null;

//
// this is the shit js can do man
// http://parentnode.org/javascript/default-arguments-in-javascript-functions/
//
Function.prototype.defaults = function()
{
  var _f = this;
  var _a = Array(_f.length-arguments.length).concat(
    Array.prototype.slice.apply(arguments));
  return function()
  {
    return _f.apply(_f, Array.prototype.slice.apply(arguments).concat(
      _a.slice(arguments.length, _a.length)));
  }
}

var Reactor = {
	
	drag: {
		start: function ( event, ui ) {
			$('#toolbox').css('overflow','visible');
			$('#toolbox').parent().css('overflow','visible');

		},

		stop: function ( event, ui ) {
			$('#toolbox').css('overflow','hidden');
			$('#toolbox').parent().css('overflow','hidden');
			
			$('#edit').droppable( "option", "disabled", true );
			$('#edit').removeClass( 'drop-hover-active' );
		},
		
		collided: function (thingy, ui) {
			//var l = thingy.offset().left;
			//var t = thingy.offset().top;
			var offsetXPos = parseInt( ui.offset.left );
		  	var offsetYPos = parseInt( ui.offset.top );
		  	//console.log("offsetXPos " + offsetXPos + " offsetYPos " + offsetYPos + " l " + l + " t " + t);
		  	/* these next six can be pre calculated */
		  	var offsetW = thingy.width();
		  	var offsetH = thingy.height();
		  	var no_collision_at_all = true; // assume innocent until proven guilty
		  	$('.ui-dialog').each(function () {
		    	var p = $(this);
			  	var left = p.offset().left;
		  		var width = p.width();
		  		var top = p.offset().top;
		  		var height = p.height();
			  	//console.log(offsetXPos+" "+offsetYPos+" "+offsetW+" "+offsetH+" : "+left+" "+width+" "+top+" "+height);
		 	 	if (offsetXPos>left && (offsetXPos+offsetW)<(left+width) && (offsetYPos+offsetH)>top && offsetYPos<(top+height)) {
		  			//console.log("collision");
		  			no_collision_at_all = false;
					return;
		  		} else {
		  			//console.log("no collision");  			
		  		}
		    });
		    return no_collision_at_all;
		},

		in_progress: function ( event, ui ) {
			//exclude
			var t = $(this), widget = t.data("draggable");
			var no_collision_at_all = Reactor.drag.collided(t, ui);
		    if (no_collision_at_all) {
				$('#edit').addClass( 'drop-hover-active' );
				$('#edit').droppable( "option", "disabled", false );
		    } else {
		    	$('#edit').droppable( "option", "disabled", true );
		    	$('#edit').removeClass( 'drop-hover-active' );
		    }
		    // should pass in a collision list on init :) 
		  	/*
		  	if ($('#toolbox').parent().hasClass('ui-draggable-overlapped')) {
		  		console.log("collision");  		
		  	} else {
		  		console.log("no collision");  		
		  	}
		  	*/
		}
	},
	
	regular_tag: function (str, squishy) {
		squishy = squishy || '';
	  	return '<'+str+'>'+squishy+'</'+str+'>';
	},
	
	self_closing_tag: function (str) {
		return '<'+str+' />';
	},
	
	tags: {
		FORM_TAGS: [ 'form', 'input', 'select', 'textarea' ],
  		SELF_CLOSING_TAGS: [ 'base', 'meta', 'link', 'hr', 'br', 'param', 'img', 'area', 'input', 'col', 'frame' ]
	},
	
	new_tag: lol_katz = function (str, squishy) {
		tags = this.tags.SELF_CLOSING_TAGS;
		for (i in tags) {
			if (str === tags[i]) {
				return this.self_closing_tag(str);
			}
		}
		return this.regular_tag(str,squishy);
	},
	
	/*
	 * à la prototype.js
	 * http://stackoverflow.com/questions/784586/convert-special-characters-to-html-in-javascript
	 */
	very_simple_html_encode: function (str) {
  		var el = document.createElement("div");
  		el.innerText = el.textContent = str;
  		str = el.innerHTML;
  		delete el;
  		return str;
	},
	
	name_to_tag: function (str) {
		return this.very_simple_html_encode(this.new_tag(str, '…'));
	},
	
	// e = $('#edit');
	// e.data( 'inspect', this.represent('div', e) );
	
	represent: function (obj) {
		var str = obj[0].localName; 
		return { representation: this.name_to_tag(str)};
	},
	
	drop: function ( event, ui ) {
		//document.body.style.cursor='auto';
		global_ev = event;
		global_ui = ui; // good ol' regular JS
		text = event.srcElement.textContent; // TODO should store it in a data in the fake button
		//console.log(ui); // draggable
		var t = $(this);
		//var no_collision_at_all = Reactor.drag.collided(t, ui);
		//if (no_collision_at_all) {
			//console.log(t); // edit (handily enough)
			//console.log(t.data()); // droppable
			obj = $(Reactor.new_tag(text)).appendTo(t)
			obj.data( 'inspect', Reactor.represent(obj) );
			Reactor.update_inspector($('#edit'));
	    //} else {
	    //}
	},
		
	fn: function (str) {
		if (str == 'toolbox') {
      		$('\
<div id="toolbox" title="Basic Toolbox">\
  <div class="tools">\
    <span class="drag_me fake_button">div</span>\
    <span class="drag_me fake_button">span</span>\
    <br/>\
    <span class="drag_me fake_button">br</span>\
    <span class="drag_me fake_button">hr</span>\
  </div>\
  <p>This is your toolbox. The dialog window can be moved and resized. And closed with the "x" icon.</p>\
  <div class="operations">\
    <button>Save</button>\
  </div>\
</div>'
			).appendTo('#container');
			$('#toolbox').dialog();
    		$('.tools .fake_button').button({icons:{primary: 'ui-icon-grip-dotted-vertical'}});
    		$('.tools').html(Gridlock.init($('.tools .fake_button')));
			$('.drag_me').draggable( {
    			// collide: 'flag',
				containment: 'window',
    			helper: 'clone',
    			start: this.drag.start,
    			stop: this.drag.stop,
    			drag: this.drag.in_progress
    		});
    		$('.drag_me').hover(function(){$(this).css('cursor','move');},function(){$(this).css('cursor','auto');})
    		var buffer = (parseInt($('body').css('margin-bottom')[0]) + parseInt($('body').css('margin-top')[0])) + 4;
    		$('#edit').height( $(window).height() - buffer )
    		$(window).resize(function() {
    			//console.log(buffer);
    			$('#edit').height( $(window).height() - buffer );
    		});
  			$('#edit').addClass('drop_on_me');
  			//$('#toolbox').addClass('drop_on_me');
  			//$('#toolbox').parent().addClass('drop_on_me');
    		$('.drop_on_me').droppable( {
    			greedy: true,
    			drop: this.drop
  			});
			$('#edit').droppable( "option", "disabled", true );
			
			$('.operations button').button({icons:{primary: 'ui-icon-document'}});
    		//$('#toolbox').css('overflow','visible');
		}
		else if (str == 'property') {
      		$('\
<div id="property" title="Design Properties">\
  <div id="list"></div>\
  <p>The style and event property list for the element under focus will go here.</p>\
</div>'
			).appendTo('#container');
			$('#property').dialog({ position: 'left' });
		}
		else if (str == 'inspector') {
      		$('\
<div id="inspector" title="Element Inspector">\
  <div id="tree"></div>\
  <p>A tree view of the elements goes here.</p>\
</div>'
			).appendTo('#container');
			$('#inspector').dialog({ position: 'right' });
		}
	},
	
	pretty_print: function(node) {
		return ""+node.data('inspect').representation;
	},
	
	table: function (seq) {
		console.log(seq);
		return Gridlock.init(seq.attributes, {id: 'property-list'});
		// $(seq).gridLock() /* defaults to 2 columns */
	},
	
	update_property: function (ev) {
		var t = $(this);
		console.log(t);
		console.log(t.data());
		var html = Reactor.table(t.data('embed'));
		$('#property #list').html(html);
	},

	update_inspector: function (node) {
		//console.log($('#inspector #tree'));
		var _ul = $( "<ul class='tree'></ul>" );
		//console.log(_ul);
  		//var html = "<ul class='tree'>\n"+this.recurse_inspector($('#edit'), 4)+"</ul>";
  		var _foo = _ul.append( this.recurse_inspector( $('#edit'), 4 ) );
		//console.log(_foo);
  		//$('#inspector #tree').html(html);
  		$('#inspector #tree').empty();
  		//console.log($('#inspector #tree'));
  		$('#inspector #tree').append(_foo);
  		//console.log($('#inspector #tree'));
  		$('.kaboom').click(Reactor.update_property);
  		//$('.kaboom').hover(function(){$(this).addClass('kaboom-hover-active');},function(){$(this).removeClass('kaboom-hover-active');})
  		$(".tree").simpleTreeMenu();
  		$(".tree").simpleTreeMenu('expandAll');
	},
		
	recurse_inspector: function (node, indent) {
		var qq = null;
		//how to accumlate this using .each()? would i have to use Function.prototype?
		node.each( function () { //how to accumlate this? would i have to use Function.prototype?
			each_node = $(this);
			var text  = Reactor.pretty_print(each_node);
			var li = $( '<li></li>' ).clone(true);
			//console.log("li "+indent);
			//console.log(li);
			//html += "<li>\n"
			var span = $( "<span class='kaboom'>"+text+"</span>\n" ).data( 'embed', this ).clone(true);
			//console.log("span "+indent);
			//console.log(span);
			var foo = li.append(span).clone(true);
			//console.log("foo "+indent);
			//console.log(foo);
			//html += "<span class='kaboom'>"+text+"</span>\n";
			var ul = $( "<ul></ul>" ).clone(true);
			//console.log("ul "+indent);
			//console.log(ul);
			//html += "<ul style='display: block;'>\n";
			var bar = null;
			ret = Reactor.recurse_inspector(each_node.children(), indent+2);
			if (ret) {
				bar = ul.append( ret.clone(true) ).clone(true);
			} else {
				bar = ul.clone(true);
			}
			//console.log("bar "+indent);
			//console.log(bar);
			var baz = foo.append(bar).clone(true);
			//console.log("baz "+indent);
			//console.log(baz);
			qq = qq ? qq.after(baz) : baz;
			//console.log("qq "+indent);
			//console.log(qq);
			//html += "</ul>\n"
			//html += "</li>\n"
		});
		return qq;
	},

	activate: function (r) {
  		//console.log(this);
  		// for (var obj in array)
		var len = r.length;
		for (var n = 0; n < len; n++) {
			// this.fn ?
  			this.fn(r[n]);
  		}
  		e = $('#edit');
  		e.data( 'inspect', this.represent(e) );
  		//console.log(e);
  		this.update_inspector($('#edit'));
	}
}

/*
 	  body do
        div.container! do
          header do
          end
          div.main!(:role => "main") do
            self << yield
          end
          footer do
          end
        end
      end # end body
 */
