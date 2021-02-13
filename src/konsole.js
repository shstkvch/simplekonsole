let howler = require('howler');
const { Interpreter } = require('../lib/acorn_interpreter');


class Konsole {

	constructor() {
		this.interpreter = false;

		this.bind();
		this.initCanvas();

		this.reset();
	}

	reset() {
		this.cursor = {
			x: 0,
			y: 0
		};
		this.mode = 'scroll';
		this.buffer = [];
		this.max_per_line = 52;
		this.max_lines = 30;
	}


	bind() {
		const run_btn = document.getElementById('run_btn');
		var that = this;

		run_btn.onclick = function() {
			that.run();
		}
	}

	chunkString (str, len) {
		const size = Math.ceil(str.length/len)
		const r = Array(size)
		let offset = 0
		
		for (let i = 0; i < size; i++) {
		  r[i] = str.substr(offset, len)
		  offset += len
		}
		
		return r
	  }

	setMode( mode ) {
		// mode can be either 'draw' or 'scroll
		// move() will work in draw mode
		if ( mode != 'draw' ) {
			mode == 'scroll';
		}
		this.mode = mode;
	}

	initCanvas() {
		this.canvas = document.getElementById('screen');
		this.ctx    = this.canvas.getContext( '2d' );
	}

	move( x, y ) {
		this.cursor = { 
			x: Math.floor(x), 
			y: Math.floor(y)
		};
	}

	clear() {
		this.ctx.clearRect( 0, 0, this.canvas.width, this.canvas.height );
	}

	redraw() {
		if ( this.mode != 'scroll' ) {
			return;
		} 
		this.clear();

		var lines = this.buffer.slice( - this.max_lines );

		var index = 0;
		var that = this;
		lines.map(function(text) {
			that.ctx.fillText(text,0,(index*16)+16);
			index++;
		});
	}

	print( text ) {
		this.ctx.font = '16px monospace';
		this.ctx.fillStyle = 'white';

		if ( this.mode == 'draw' ) {
			this.ctx.fillText(text,this.cursor.x*8,(this.cursor.y*16)+16);

			return;
		}

		var lines = this.chunkString( text+'', this.max_per_line );
		var that = this;

		lines.map( function( line ) {
			that.buffer.push( line );
		});

		this.redraw();

	}


	load() {
		const code = document.getElementById( 'code' ).value;
		const that = this;
		var initFunc = function(interpreter, globalObject) {	  
			var print_wrapper = function(text) {
			  return that.print(text);
			};
			interpreter.setProperty(globalObject, 'print',
				interpreter.createNativeFunction(print_wrapper));

			var clear_wrapper = function() {
				return that.clear();
			};
			interpreter.setProperty(globalObject, 'clear',
				interpreter.createNativeFunction(clear_wrapper));

			var move_wrapper = function(x, y) {
				return that.move(x, y);
			};
			interpreter.setProperty(globalObject, 'move',
				interpreter.createNativeFunction(move_wrapper));
		  };

		this.interpreter = new Interpreter(code, initFunc);

		console.log( 'Loading this code:', code );
		console.log( 'Output from vm:', this.interpreter.value );

		this.interpreter.appendCode( 'main()' );

		this.step();
	}

	step() {
		var out = this.interpreter.step();

		console.log( 'STEP!' );

		var that = this;
		if ( out )  {
			window.requestAnimationFrame( function() {
				that.step();
			} );
		}
	}

	run() {
		this.reset();
		this.load();
	}

}

let k = window.konsole = new Konsole();