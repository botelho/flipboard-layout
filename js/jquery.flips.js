/**
 * jquery.flips.js
 * 
 * Copyright 2011, Pedro Botelho / Codrops
 * Free to use under the MIT license.
 *
 * Date: Fri May 4 2012
 */
 
/**
 * Note: This is highly experimental and just a proof-of-concept! 
 * There are some few "hacks", probably some bugs, and some functionality 
 * is incomplete... definitely not ready for a production environment.
 *
 *
 * Tested and working on:
 * - Google Chrome 18.0.1025.168
 * - Apple Safari 5.1.5
 * - Apple Safari 5.1 Mobile
 * 
 */

(function( window, undefined ) {
	
	$.Flips 			= function( options, element ) {
	
		this.$el	= $( element );
		this._init( options );
		
	};
	
	$.Flips.defaults 	= {
		flipspeed			: 900,
		fliptimingfunction	: 'linear',
		current				: 0
	};
	
	$.Flips.prototype 	= {
		_init 				: function( options ) {
			
			this.options 		= $.extend( true, {}, $.Flips.defaults, options );
			this.$pages			= this.$el.children( 'div.f-page' );
			this.pagesCount		= this.$pages.length;
			this.History		= window.History;
			this.currentPage	= this.options.current;
			this._validateOpts();
			this._getWinSize();
			this._getState();
			this._layout();
			this._initTouchSwipe();
			this._loadEvents();
			this._goto();
			
		},
		_validateOpts		: function() {
			
			if( this.currentPage < 0 || this.currentPage > this.pagesCount ) {
			
				this.currentPage = 0;
			
			}
		
		},
		_getWinSize			: function() {
			
			var $win = $( window );
			
			this.windowProp = {
				width	: $win.width(),
				height	: $win.height()
			};
		
		},
		_goto				: function() {
			
			var page = ( this.state === undefined ) ? this.currentPage : this.state;
			
			if( !this._isNumber( page ) || page < 0 || page > this.flipPagesCount ) {
			
				page = 0;
			
			}
			
			this.currentPage = page;
			
		},
		_getState			: function() {
		
			this.state = this.History.getState().url.queryStringToJSON().page;
			
		},
		_isNumber			: function( n ) {
		
			return parseFloat( n ) == parseInt( n ) && !isNaN( n ) && isFinite( n );
		
		},
		_adjustLayout		: function( page ) {
		
			var _self = this;
			
			this.$flipPages.each( function( i ) {
				
				var $page	= $(this);
				
				if( i === page - 1 ) {
				
					$page.css({
						'-webkit-transform'	: 'rotateY( -180deg )',
						'-moz-transform'	: 'rotateY( -180deg )',
						'z-index'			: _self.flipPagesCount - 1 + i
					});
				
				}
				else if( i < page ) {
				
					$page.css({
						'-webkit-transform'	: 'rotateY( -181deg )', // todo: fix this (should be -180deg)
						'-moz-transform'	: 'rotateY( -181deg )', // todo: fix this (should be -180deg)
						'z-index'			: _self.flipPagesCount - 1 + i
					});
				
				}
				else {
				
					$page.css({
						'-webkit-transform'	: 'rotateY( 0deg )',
						'-moz-transform'	: 'rotateY( 0deg )',
						'z-index'			: _self.flipPagesCount - 1 - i
					});
				
				}
						
			} );
		
		},
		_saveState			: function() {
		
			// adds a new state to the history object and triggers the statechange event on the window
			var page = this.currentPage;
			
			if( this.History.getState().url.queryStringToJSON().page !== page ) {
					
				this.History.pushState( null, null, '?page=' + page );
				
			}
			
		},
		_layout				: function() {
			
			this._setLayoutSize();
			
			for( var i = 0; i <= this.pagesCount - 2; ++i ) {
				
				var	$page 		= this.$pages.eq( i ),
					pageData	= {
						theClass				: 'page',
						theContentFront			: $page.html(),
						theContentBack			: ( i !== this.pagesCount ) ? this.$pages.eq( i + 1 ).html() : '',
						theStyle				: 'z-index: ' + ( this.pagesCount - i ) + ';left: ' + ( this.windowProp.width / 2 ) + 'px;',
						theContentStyleFront	: 'width:' + this.windowProp.width + 'px;',
						theContentStyleBack		: 'width:' + this.windowProp.width + 'px;'
					};
				
				if( i === 0 ) {
				
					pageData.theClass += ' cover';
				
				}
				else {
					
					pageData.theContentStyleFront += 'left:-' + ( this.windowProp.width / 2 ) + 'px';
					
					if( i === this.pagesCount - 2 ) {
					
						pageData.theClass += ' cover-back';
					
					}
				
				}
				
				$( '#pageTmpl' ).tmpl( pageData ).appendTo( this.$el );
			
			}
			
			this.$pages.remove();
			this.$flipPages		= this.$el.children( 'div.page' );
			this.flipPagesCount	= this.$flipPages.length;
			
			this._adjustLayout( ( this.state === undefined ) ? this.currentPage : this.state );
			
		},
		_setLayoutSize		: function() {
		
			this.$el.css( {
				width	: this.windowProp.width,
				height	: this.windowProp.height
			} );
		
		},
		_initTouchSwipe		: function() {
			
			var _self = this;
			
			this.$el.swipe( {
				threshold			: 0,
				swipeStatus			: function( event, phase, start, end, direction, distance ) {
					
					var startX		= start.x,
						endX		= end.x,
						sym, angle,
						oob			= false,
						noflip		= false;
					
					// check the "page direction" to flip:
					// if the page flips from the right to the left (right side page)
					// or from the left to the right (left side page).
					// check only if not animating
					if( !_self._isAnimating() ) {
					
						( startX < _self.windowProp.width / 2 ) ? _self.flipSide = 'l2r' : _self.flipSide = 'r2l';
					
					}
					
					if( direction === 'up' || direction === 'down' ) {
						
						if( _self.angle === undefined || _self.angle === 0 ) {
						
							_self._removeOverlays();
							return false;
						
						}
						else {
							
							( _self.angle < 90 ) ? direction = 'right' : direction = 'left';
							
						}
						
					};
					
					_self.flipDirection = direction;
					
					// on the first & last page neighbors we don't flip
					if( _self.currentPage === 0 && _self.flipSide === 'l2r' || _self.currentPage === _self.flipPagesCount && _self.flipSide === 'r2l' ) {
						
						return false;
					
					}
					
					// save ending point (symetric point):
					// if we touch / start dragging on, say [x=10], then
					// we need to drag until [window's width - 10] in order to flip the page 100%.
					// if the symetric point is too close we are giving some margin:
					// if we would start dragging right next to [window's width / 2] then
					// the symmetric point would be very close to the starting point. A very short swipe
					// would be enough to flip the page..
					sym	= _self.windowProp.width - startX;
					
					var symMargin = 0.9 * ( _self.windowProp.width / 2 );
					if( Math.abs( startX - sym ) < symMargin ) {
					
						( _self.flipSide === 'r2l' ) ? sym -= symMargin / 2 : sym += symMargin / 2;
					
					}
					
					// some special cases:
					// Page is on the right side, 
					// and we drag/swipe to the same direction
					// ending on a point > than the starting point
					// -----------------------
					// |          |          |
					// |          |          |
					// |   sym    |     s    |
					// |          |      e   |
					// |          |          |
					// -----------------------
					if( endX > startX && _self.flipSide === 'r2l' ) {
					
						angle		= 0;
						oob 		= true;
						noflip		= true;
					
					}
					// Page is on the right side, 
					// and we drag/swipe to the opposite direction
					// ending on a point < than the symmetric point
					// -----------------------
					// |          |          |
					// |          |          |
					// |   sym    |     s    |
					// |  e       |          |
					// |          |          |
					// -----------------------
					else if( endX < sym && _self.flipSide === 'r2l' ) {
					
						angle		= 180;
						oob 		= true;
					
					}
					// Page is on the left side, 
					// and we drag/swipe to the opposite direction
					// ending on a point > than the symmetric point
					// -----------------------
					// |          |          |
					// |          |          |
					// |    s     |   sym    |
					// |          |      e   |
					// |          |          |
					// -----------------------
					else if( endX > sym && _self.flipSide === 'l2r' ) {
					
						angle		= 0;
						oob 		= true;
					
					}
					// Page is on the left side, 
					// and we drag/swipe to the same direction
					// ending on a point < than the starting point
					// -----------------------
					// |          |          |
					// |          |          |
					// |    s     |   sym    |
					// |   e      |          |
					// |          |          |
					// -----------------------
					else if( endX < startX && _self.flipSide === 'l2r' ) {
					
						angle		= 180;
						oob 		= true;
						noflip		= true;
					
					}
					// we drag/swipe to a point between 
					// the starting point and symetric point
					// -----------------------
					// |          |          |
					// |    s     |   sym    |
					// |   sym    |    s     |
					// |         e|          |
					// |          |          |
					// -----------------------
					else {
						
						var s, e, val;
						
						( _self.flipSide === 'r2l' ) ?
							( s = startX, e = sym, val = startX - distance ) : 
							( s = sym, e = startX , val = startX + distance );
						
						angle = _self._calcAngle( val, s, e );
						
						if( ( direction === 'left' && _self.flipSide === 'l2r' ) || ( direction === 'right' && _self.flipSide === 'r2l' ) ) {
							
							noflip	= true;
						
						}
						
					}
					
					switch( phase ) {
					
						case 'start' :
							
							if( _self._isAnimating() ) {
								
								// the user can still grab a page while one is flipping (in this case not being able to move)
								// and once the page is flipped the move/touchmove events are triggered..
								_self.start = true;
								return false;
							
							}
							else {
								
								_self.start = false;
							
							}
							
							// check which page is clicked/touched
							_self._setFlippingPage();
							
							// check which page comes before & after the one we are clicking
							_self.$beforePage 	= _self.$flippingPage.prev();
							_self.$afterPage 	= _self.$flippingPage.next();
							
							break;
							
						case 'move' :
							
							if( distance > 0 ) {
							
								if( _self._isAnimating() || _self.start ) {
										
									return false;
								
								}
								
								// adds overlays: shows shadows while flipping
								if( !_self.hasOverlays ) {
									
									_self._addOverlays();
									
								}
								
								// save last angle
								_self.angle = angle;
								// we will update the rotation value of the page while we move it
								_self._turnPage( angle , true );
							
							}
							break;
							
						case 'end' :
							
							if( distance > 0 ) {
								
								if( _self._isAnimating() || _self.start ) return false;
								
								_self.isAnimating = true;
								
								// keep track if the page was actually flipped or not
								// the data flip will be used later on the transitionend event
								( noflip ) ? _self.$flippingPage.data( 'flip', false ) : _self.$flippingPage.data( 'flip', true );
								
								// if out of bounds we will "manually" flip the page,
								// meaning there will be no transition set
								if( oob ) {
									
									if( !noflip ) {
										
										// the page gets flipped (user dragged from the starting point until the symmetric point)
										// update current page
										_self._updatePage();
									
									}
									
									_self._onEndFlip( _self.$flippingPage );
								
								}
								else {
									
									// save last angle
									_self.angle = angle;
									// calculate the speed to flip the page:
									// the speed will depend on the current angle.
									_self._calculateSpeed();
							
									switch( direction ) {
										
										case 'left' :
											
											_self._turnPage( 180 );
											
											if( _self.flipSide === 'r2l' ) {
												
												_self._updatePage();
											
											}
											
											break;
										
										case 'right' :
											
											_self._turnPage( 0 );
											
											if( _self.flipSide === 'l2r' ) {
												
												_self._updatePage();
											
											}
											
											break;
										
									};
								
								}
								
							}
							
							break;

					};
					
				}
				
			} );
		
		},
		_setFlippingPage	: function() {
			
			var _self = this;
			
			( this.flipSide === 'l2r' ) ?
				this.$flippingPage 	= this.$flipPages.eq( this.currentPage - 1 ) :
				this.$flippingPage	= this.$flipPages.eq( this.currentPage );
			
			this.$flippingPage.on( 'webkitTransitionEnd.flips transitionend.flips OTransitionEnd.flips', function( event ) {
				
				if( $( event.target ).hasClass( 'page' ) ) {
				
					_self._onEndFlip( $(this) );
				
				}
				
			});
		
		},
		_updatePage			: function() {
			
			if( this.flipSide === 'r2l' ) {
			
				++this.currentPage;
				
			}
			else if( this.flipSide === 'l2r' ) {
			
				--this.currentPage;
				
			}
			
		},
		_isAnimating		: function() {
		
			if( this.isAnimating ) {
			
				return true;
			
			}
			
			return false;
		
		},
		_loadEvents			: function() {
			
			var _self = this;
			
			$( window ).on( 'resize.flips', function( event ) {
			
				_self._getWinSize();
				_self._setLayoutSize();
				
				var $contentFront	= _self.$flipPages.children( 'div.front' ).find( 'div.content' ),
					$contentBack	= _self.$flipPages.children( 'div.back' ).find( 'div.content' )
				
				_self.$flipPages.css( 'left', _self.windowProp.width / 2 );
				
				$contentFront.filter( function( i ) {
					return i > 0;
				}).css( {
					width	: _self.windowProp.width,
					left	: -_self.windowProp.width / 2
				} );
				$contentFront.eq( 0 ).css( 'width', _self.windowProp.width );
				
				$contentBack.css( 'width', _self.windowProp.width );
			
			} );
			
			$( window ).on( 'statechange.flips', function( event ) {
				
				_self._getState();
				_self._goto();
				if( !_self.isAnimating ) {
				
					_self._adjustLayout( _self.currentPage );
					
				}
				
			} );
			
			this.$flipPages.find( '.box' ).on( 'click.flips', function( event ) {
				
				var $box 			= $(this),
					$boxClose		= $( '<span class="box-close">close</span>' ),
					transitionProp	= {
						speed			: 450,
						timingfunction	: 'linear'
					},
					$overlay		= $( '<div class="overlay">close</div>' ).css( {
						'z-index'				: 9998,
						'-webkit-transition' 	: 'opacity ' + transitionProp.speed + 'ms ' + transitionProp.timingfunction,
						'-moz-transition' 		: 'opacity ' + transitionProp.speed + 'ms ' + transitionProp.timingfunction
					} ).prependTo( $( 'body' ) ),
					prop 			= {
						width	: $box.outerWidth(true),
						height	: $box.outerHeight(true),
						left	: $box.offset().left,
						top		: $box.offset().top
					},
					$placeholder 	= $box.clone().css( {
						'position' 			: 'absolute',
						'width'				: prop.width,
						'height'			: prop.height,
						'left'				: prop.left,
						'top'				: prop.top,
						'zIndex'			: 9999,
						'overflow-y'		: 'auto',
						'-webkit-transition': 'all ' + transitionProp.speed + 'ms ' + transitionProp.timingfunction,
						'-moz-transition': 'all ' + transitionProp.speed + 'ms ' + transitionProp.timingfunction
					} )
					.insertAfter( $overlay )
					.end()
					.append( $boxClose.on( 'click.flips', function( event ) {
						
						$overlay.css( 'opacity', 0 );
						
						$placeholder.children().hide().end().removeClass( 'box-expanded' ).css( {
							width			: _self.windowProp.width,
							height			: _self.windowProp.height,
							'overflow-y' 	: 'hidden'
						} );
						
						setTimeout( function() {
							$placeholder.css( {
								left    : prop.left,
								top		: prop.top,
								width	: prop.width,
								height	: prop.height,
								'-webkit-transition' 	: 'all ' + transitionProp.speed + 'ms ' + transitionProp.timingfunction,
								'-moz-transition' 	: 'all ' + transitionProp.speed + 'ms ' + transitionProp.timingfunction
							});
						}, 0 );
						
					}) )
					.children()
					.hide()
					.end()
					.on( 'webkitTransitionEnd.flips transitionend.flips OTransitionEnd.flips', function( event ) {
						
						if( $( event.target ).hasClass( 'box-expanded' ) ) { // expanding
							
							$(this).css( {
								width	: '100%',
								height	: '100%',
								'-webkit-transition' : 'none',
								'-moz-transition' : 'none'
							} ).children().fadeIn();
						
						}
						else { // collapsing
							
							$overlay.remove();
							$(this).remove();
						
						}

					});
				
				setTimeout( function() {
					
					$overlay.css( {
						opacity	: 1
					} );
					
					$placeholder.addClass( 'box-expanded' ).css( {
						left    : 0,
						top		: 0,
						width	: _self.windowProp.width,
						height	: _self.windowProp.height
					});
					
				}, 0 );
				
			} );
			
		},
		_onEndFlip			: function( $page ) {
			
			// if the page flips from left to right we will need to change the z-index of the flipped page
			if( ( this.flipSide === 'l2r' && $page.data( 'flip' ) ) || 
				( this.flipSide === 'r2l' && !$page.data( 'flip' ) )  ) {

				$page.css( 'z-index', this.pagesCount - 2 - $page.index() );
			
			}
			
			this.$flippingPage.css( {
				'-webkit-transition' 	: 'none',
				'-moz-transition' 		: 'none'
			} );
			
			// remove overlays
			this._removeOverlays();
			this._saveState();
			this.isAnimating = false;
			
			// hack (todo: issues with safari / z-indexes)
			if( this.flipSide === 'r2l' || ( this.flipSide === 'l2r' && !$page.data( 'flip' ) ) ) {
			
				this.$flippingPage.find('.back').css( '-webkit-transform', 'rotateY(-180deg)' );
			
			}
			
		},
		// given the touch/drag start point (s), the end point (e) and a value in between (x)
		// calculate the respective angle ( 0deg - 180deg )
		_calcAngle			: function( x, s, e ) {
			
			return ( -180 / ( s - e ) ) * x + ( ( s * 180 ) / ( s - e ) );
		
		},
		// given the current angle and the default speed, calculate the respective speed to accomplish the flip
		_calculateSpeed		: function() {
			
			( this.flipDirection === 'right' ) ? 
				this.flipSpeed = ( this.options.flipspeed / 180 ) * this.angle :
				this.flipSpeed = - ( this.options.flipspeed / 180 ) * this.angle + this.options.flipspeed;
		
		},
		_turnPage			: function( angle, update ) {
			
			// hack / todo: before page that was set to -181deg should have -180deg
			this.$beforePage.css({
				'-webkit-transform'	: 'rotateY( -180deg )',
				'-moz-transform'	: 'rotateY( -180deg )'
			});
			
			// if not moving manually set a transition to flip the page
			if( !update ) {
				
				this.$flippingPage.css( {
					'-webkit-transition' : '-webkit-transform ' + this.flipSpeed + 'ms ' + this.options.fliptimingfunction,
					'-moz-transition' : '-moz-transform ' + this.flipSpeed + 'ms ' + this.options.fliptimingfunction
				} );
				
			}
			
			// if page is a right side page, we need to set its z-index higher as soon the page starts to flip.
			// this will make the page be on "top" of the left ones.
			// note: if the flipping page is on the left side then we set the z-index after the flip is over.
			// this is done on the _onEndFlip function.
			var idx	= ( this.flipSide === 'r2l' ) ? this.currentPage : this.currentPage - 1;
			if( this.flipSide === 'r2l' ) {
				
				this.$flippingPage.css( 'z-index', this.flipPagesCount - 1 + idx );
			
			}
			
			// hack (todo: issues with safari / z-indexes)
			this.$flippingPage.find('.back').css( '-webkit-transform', 'rotateY(180deg)' );
			
			// update the angle
			this.$flippingPage.css( {
				'-webkit-transform'		: 'rotateY(-' + angle + 'deg)',
				'-moz-transform'		: 'rotateY(-' + angle + 'deg)'
			} );
			
			// show overlays
			this._overlay( angle, update );
			
		},
		_addOverlays		: function() {
			
			var _self = this;
			
			// remove current overlays
			this._removeOverlays();
			
			this.hasOverlays	= true;
			
			// overlays for the flipping page. One in the front, one in the back.
			
			this.$frontoverlay	= $( '<div class="flipoverlay"></div>' ).appendTo( this.$flippingPage.find( 'div.front > .outer' ) );
			this.$backoverlay	= $( '<div class="flipoverlay"></div>' ).appendTo( this.$flippingPage.find( 'div.back > .outer' ) )
			
			// overlay for the page "under" the flipping page.
			if( this.$afterPage ) {
				
				this.$afterOverlay	= $( '<div class="overlay"></div>' ).appendTo( this.$afterPage.find( 'div.front > .outer' ) );
			
			}
			
			// overlay for the page "before" the flipping page
			if( this.$beforePage ) {
				
				this.$beforeOverlay	= $( '<div class="overlay"></div>' ).appendTo( this.$beforePage.find( 'div.back > .outer' ) );
			
			}
		
		},
		_removeOverlays		: function() {
			
			// removes the 4 overlays
			if( this.$frontoverlay )
				this.$frontoverlay.remove();
			if( this.$backoverlay )
				this.$backoverlay.remove();
			if( this.$afterOverlay )
				this.$afterOverlay.remove();
			if( this.$beforeOverlay )
				this.$beforeOverlay.remove();
				
			this.hasOverlays	= false;
				
		},
		_overlay			: function( angle, update ) {
			
			// changes the opacity of each of the overlays.
			if( update ) {
				
				// if update is true, meaning we are manually flipping the page,
				// we need to calculate the opacity that corresponds to the current angle
				var afterOverlayOpacity 	= - ( 1 / 90 ) * angle + 1,
					beforeOverlayOpacity 	= ( 1 / 90 ) * angle - 1;
				
				if( this.$afterOverlay ) {
				
					this.$afterOverlay.css( 'opacity', afterOverlayOpacity );
					
				}
				if( this.$beforeOverlay ) {
				
					this.$beforeOverlay.css( 'opacity', beforeOverlayOpacity );
					
				}
				
				// the flipping page will have a fixed value.
				// todo: add a gradient instead.
				var flipOpacity 	= 0.1;
				this.$frontoverlay.css( 'opacity', flipOpacity );
				this.$backoverlay.css( 'opacity', flipOpacity );
				
			}
			else {
				
				var _self = this;
				
				// if we release the mouse / touchend then we will set a transition for the overlays.
				// we will need to take in consideration the current angle, the speed (given the angle)
				// and the delays for each overlay (the opacity of the overlay will only change
				// when the flipping page is on the same side).
				var afterspeed	= this.flipSpeed,
					beforespeed	= this.flipSpeed,
					margin		= 60; // hack (todo: issues with safari / z-indexes)
				
				if( this.$afterOverlay ) {
				
					var afterdelay = 0;
					
					if( this.flipDirection === 'right' ) {
						
						if( this.angle > 90 ) {
							
							afterdelay 	= Math.abs( this.flipSpeed - this.options.flipspeed / 2 - margin );
							afterspeed	= this.options.flipspeed / 2 - margin ;
						
						}
						else {
							
							afterspeed -= margin;
						
						}
						
					}
					else {
						
						afterspeed	= Math.abs( this.flipSpeed - this.options.flipspeed / 2 );
					
					}
					
					if( afterspeed <= 0 ) afterspeed = 1;
					
					this.$afterOverlay.css( {
						'-webkit-transition' 	: 'opacity ' + afterspeed + 'ms ' + this.options.fliptimingfunction + ' ' + afterdelay + 'ms',
						'-moz-transition' 		: 'opacity ' + afterspeed + 'ms ' + this.options.fliptimingfunction + ' ' + afterdelay + 'ms',
						'opacity'				: ( this.flipDirection === 'left' ) ? 0 : 1
					} ).on( 'webkitTransitionEnd.flips transitionend.flips OTransitionEnd.flips', function( event ) {
						if( _self.$beforeOverlay ) _self.$beforeOverlay.off( 'webkitTransitionEnd.flips transitionend.flips OTransitionEnd.flips');
						setTimeout( function() {
							_self._adjustLayout(_self.currentPage);
						}, _self.options.flipspeed / 2 - margin );
					} );
					
				}
				
				if( this.$beforeOverlay ) {
				
					var beforedelay = 0;
					
					if( this.flipDirection === 'left' )  {
						
						if( this.angle < 90 ) {
						
							beforedelay = Math.abs( this.flipSpeed - this.options.flipspeed / 2 - margin ) ;
							beforespeed = this.options.flipspeed / 2 - margin;
						
						}
						else {
							
							beforespeed -= margin;
						
						}
						
					}
					else {
						
						beforespeed = Math.abs( this.flipSpeed - this.options.flipspeed / 2 );
						
					}
					
					if( beforespeed <= 0 ) beforespeed = 1;
					
					this.$beforeOverlay.css( {
						'-webkit-transition'	: 'opacity ' + beforespeed + 'ms ' + this.options.fliptimingfunction + ' ' + beforedelay + 'ms',
						'-moz-transition'		: 'opacity ' + beforespeed + 'ms ' + this.options.fliptimingfunction + ' ' + beforedelay + 'ms',
						'opacity'				: ( this.flipDirection === 'left' ) ? 1 : 0
					} ).on( 'webkitTransitionEnd.flips transitionend.flips OTransitionEnd.flips', function( event ) {
						if( _self.$afterOverlay ) _self.$afterOverlay.off( 'webkitTransitionEnd.flips transitionend.flips OTransitionEnd.flips');
						_self._adjustLayout(_self.currentPage);
					} );
					
				}
				
			}
				
		}
	};
	
	var logError 		= function( message ) {
		if ( this.console ) {
			console.error( message );
		}
	};
	
	$.fn.flips			= function( options ) {
		
		if ( typeof options === 'string' ) {
			
			var args = Array.prototype.slice.call( arguments, 1 );
			
			this.each(function() {
			
				var instance = $.data( this, 'flips' );
				
				if ( !instance ) {
					logError( "cannot call methods on flips prior to initialization; " +
					"attempted to call method '" + options + "'" );
					return;
				}
				
				if ( !$.isFunction( instance[options] ) || options.charAt(0) === "_" ) {
					logError( "no such method '" + options + "' for flips instance" );
					return;
				}
				
				instance[ options ].apply( instance, args );
			
			});
		
		} 
		else {
		
			this.each(function() {
			
				var instance = $.data( this, 'flips' );
				if ( !instance ) {
					$.data( this, 'flips', new $.Flips( options, this ) );
				}
			});
		
		}
		
		return this;
		
	};
	
})( window );