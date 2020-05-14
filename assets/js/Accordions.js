var accordions = (function () {
    'use strict';

    var Utils = {
      checkIfElementExist(element) {
        return typeof element !== typeof undefined && element !== null;
      },

      isObject(o) {
        return typeof o === 'object' && o !== null && o.constructor && o.constructor === Object;
      },

      extend(...args) {
        const self = this;
        const to = Object(args[0]);

        for (let i = 1; i < args.length; i += 1) {
          const nextSource = args[i];

          if (nextSource !== undefined && nextSource !== null) {
            const keysArray = Object.keys(Object(nextSource));

            for (let nextIndex = 0, len = keysArray.length; nextIndex < len; nextIndex += 1) {
              const nextKey = keysArray[nextIndex];
              const desc = Object.getOwnPropertyDescriptor(nextSource, nextKey);

              if (desc !== undefined && desc.enumerable) {
                if (self.isObject(to[nextKey]) && self.isObject(nextSource[nextKey])) {
                  self.extend(to[nextKey], nextSource[nextKey]);
                } else if (!self.isObject(to[nextKey]) && self.isObject(nextSource[nextKey])) {
                  to[nextKey] = {};
                  self.extend(to[nextKey], nextSource[nextKey]);
                } else {
                  to[nextKey] = nextSource[nextKey];
                }
              }
            }
          }
        }

        return to;
      },

      checkIfElementIsHover(element) {
        return element.querySelector(':hover') || element.parentNode.querySelector(':hover') === element;
      },

      checkIfElementIsFocus(element) {
        return element.querySelector(':focus') || element.parentNode.querySelector(':focus') === element;
      }

    };

    var defaultParams = {
      init: true,
      withTransition: true,
      baseTranstionDuration: .3,
      multipleOpen: false,
      elSelector: '.js-accordion__container',
      title: {
        elSelector: '.accordion__title',
        hover: {
          classname: '--is-hover'
        },
        active: {
          classname: '--is-active'
        }
      },
      content: {
        elSelector: '.accordion__content',
        active: {
          classname: '--is-active'
        },
        inner: {
          elSelector: '.accordion__content__inner'
        }
      },
      contentPreview: {
        preview: false,
        previewHeight: '100px',
        previewWithOverlay: true
      }
    };

    function _defineProperty(obj, key, value) {
      if (key in obj) {
        Object.defineProperty(obj, key, {
          value: value,
          enumerable: true,
          configurable: true,
          writable: true
        });
      } else {
        obj[key] = value;
      }

      return obj;
    }

    class ClassManagement {
      constructor(params = {}) {
        const self = this;
        self.params = params; // Events

        self.eventsListeners = {};

        if (self.params && self.params.on) {
          Object.keys(self.params.on).forEach(eventName => {
            self.on(eventName, self.params.on[eventName]);
          });
        }
      }

      on(events, handler, priority) {
        const self = this;
        if (typeof handler !== 'function') return self;
        const method = priority ? 'unshift' : 'push';
        events.split(' ').forEach(event => {
          if (!self.eventsListeners[event]) self.eventsListeners[event] = [];
          self.eventsListeners[event][method](handler);
        });
        return self;
      }

      once(events, handler, priority) {
        const self = this;
        if (typeof handler !== 'function') return self;

        function onceHandler(...args) {
          self.off(events, onceHandler);

          if (onceHandler.f7proxy) {
            delete onceHandler.f7proxy;
          }

          handler.apply(self, args);
        }

        onceHandler.f7proxy = handler;
        return self.on(events, onceHandler, priority);
      }

      off(events, handler) {
        const self = this;
        if (!self.eventsListeners) return self;
        events.split(' ').forEach(event => {
          if (typeof handler === 'undefined') {
            self.eventsListeners[event] = [];
          } else if (self.eventsListeners[event] && self.eventsListeners[event].length) {
            self.eventsListeners[event].forEach((eventHandler, index) => {
              if (eventHandler === handler || eventHandler.f7proxy && eventHandler.f7proxy === handler) {
                self.eventsListeners[event].splice(index, 1);
              }
            });
          }
        });
        return self;
      }

      emit(...args) {
        const self = this;
        if (!self.eventsListeners) return self;
        let events;
        let data;
        let context;

        if (typeof args[0] === 'string' || Array.isArray(args[0])) {
          events = args[0];
          data = args.slice(1, args.length);
          context = self;
        } else {
          events = args[0].events;
          data = args[0].data;
          context = args[0].context || self;
        }

        const eventsArray = Array.isArray(events) ? events : events.split(' ');
        eventsArray.forEach(event => {
          if (self.eventsListeners && self.eventsListeners[event]) {
            self.eventsListeners[event].forEach(eventHandler => {
              eventHandler.apply(context, data);
            });
          }
        });
        return self;
      }

    }

    const accordionsCSS = [];

    class Accordion extends ClassManagement {
      constructor(params) {
        super(params);

        _defineProperty(this, "onTitleHover", e => {
          const self = this;
          e.preventDefault(); // Emit

          self.emit('titleHover');

          if (self.opened) {
            return;
          }

          if (self.params.contentPreview.preview) {
            clearInterval(self.previewInterval);
            clearTimeout(self.previewTimeout);
            self.emit('previewWillOpen');
            const contentPreviewOpenTransitionDuration = self.params.contentPreview.openTransitionDuration || self.params.contentPreview.baseTransitionDuration || self.params.baseTranstionDuration;
            self.params.content.el.style.transitionDuration = contentPreviewOpenTransitionDuration + 's';
            const contentPreviewTransitionEasing = self.params.contentPreview.transitionEasing || null;

            if (contentPreviewTransitionEasing !== null) {
              self.params.content.el.style.transitionTimingFunction = contentPreviewTransitionEasing;
            }

            const innerCurrentHeight = self.params.content.inner.el.offsetHeight;
            let toHeight = self.params.contentPreview.previewHeight;

            if (innerCurrentHeight <= parseInt(self.params.contentPreview.previewHeight)) {
              toHeight = innerCurrentHeight + 'px';
            }

            self.params.content.el.style.height = toHeight;
            self.previewInterval = window.setInterval(function () {
              if (!Utils.checkIfElementIsHover(self.params.title.el) && !Utils.checkIfElementIsFocus(self.params.title.el)) return;
              const elemCurrentHeight = window.getComputedStyle(self.params.content.el, null).getPropertyValue('height');

              if (elemCurrentHeight === toHeight) {
                self.emit('previewIsOpen');
                self.params.content.el.style.transitionDuration = '';
                self.params.content.el.style.transitionTimingFunction = '';
                clearInterval(self.previewInterval);
                clearTimeout(self.previewTimeout);
              }
            }, 100); //SAFE

            self.previewTimeout = setTimeout(function () {
              clearInterval(self.previewInterval);
            }, contentPreviewOpenTransitionDuration * 1000 + 200);
          }
        });

        _defineProperty(this, "onTitleEndHover", e => {
          e.preventDefault();
          const self = this; // Emit

          self.emit('titleEndHover');

          if (!self.opened && self.params.contentPreview.preview) {
            clearInterval(self.previewInterval);
            clearTimeout(self.previewTimeout);
            self.emit('previewWillClose');
            self.params.content.el.style.height = '0px';
            const contentPreviewCloseTransitionDuration = self.params.contentPreview.closeTransitionDuration || self.params.contentPreview.baseTransitionDuration || self.params.baseTranstionDuration;
            self.params.content.el.style.transitionDuration = contentPreviewCloseTransitionDuration + 's';
            const contentPreviewTransitionEasing = self.params.contentPreview.transitionEasing || null;

            if (contentPreviewTransitionEasing !== null) {
              self.params.content.el.style.transitionTimingFunction = contentPreviewTransitionEasing;
            }

            self.previewInterval = window.setInterval(function () {
              const elemCurrentHeight = window.getComputedStyle(self.params.content.el, null).getPropertyValue('height');

              if (elemCurrentHeight === 0 + 'px') {
                self.emit('previewIsClose');
                self.params.content.el.style.transitionDuration = '';
                self.params.content.el.style.transitionTimingFunction = '';
                clearInterval(self.previewInterval);
                clearTimeout(self.previewTimeout);
              }
            }, 100); //SAFE

            self.previewTimeout = setTimeout(function () {
              clearInterval(self.previewInterval);
            }, contentPreviewCloseTransitionDuration * 1000 + 200);
          }
        });

        _defineProperty(this, "onTitleClick", e => {
          e.preventDefault();
          const self = this;

          if (e.type === 'keydown' && e.key !== 'Enter' && e.code !== 'Space') {
            return;
          } // Emit


          self.emit('beforeAccordionChange');
          clearInterval(self.changeInterval);
          clearTimeout(self.changeTimeout);
          self.toogleAccordion();
        });

        const accordion = this;
        params.el.accordion = accordion; // Init

        if (accordion.params.init) {
          accordion.init();
        }
      }

      init() {
        const self = this;
        if (self.initialized) return; // Emit

        self.emit('beforeInit');
        self.setElementsParams();
        self.initDynamicCSS();
        self.initCSSClass();
        self.initTitleEvents();
        self.initContentPreview(); // Init Flag

        self.initialized = true;
        self.params.el.classList.add('--is-init'); // Emit

        self.emit('init');
      }

      setElementsParams() {
        const self = this;
        self.params.title.el = self.params.el.querySelector(self.params.title.elSelector);
        self.params.content.el = self.params.el.querySelector(self.params.content.elSelector);
        self.params.content.inner.el = self.params.content.el.querySelector(self.params.content.inner.elSelector);
      }

      initDynamicCSS() {
        const self = this;
        self.params.dynamicsCssRulesToInsert = [];
        const styleElement = document.querySelector('.dynamicAccordionStyle');
        let sheet = null;

        if (styleElement === typeof undefined || styleElement === null) {
          sheet = function () {
            // Create the <style> tag
            var style = document.createElement('style');
            style.setAttribute('class', 'dynamicAccordionStyle'); // WebKit hack :(

            style.appendChild(document.createTextNode('')); // Add the <style> element to the page

            document.head.appendChild(style);
            return style.sheet;
          }();

          self.params.cssSheet = sheet;
        } else {
          sheet = styleElement.sheet;
          self.params.cssSheet = sheet;
        }

        if (!accordionsCSS.includes(self.params.hash)) {
          self.initTitleDynamicCss();
        }
      }

      initTitleDynamicCss() {
        const self = this;
        self.params.dynamicsCssRulesToInsert.push(`
            [data-hash="${self.params.hash}"] ${self.params.title.elSelector} { 
                color : ${self.params.title.fontColor};
                background : ${self.params.title.bgColor};
                transition-duration:  ${self.params.title.transitionDuration}s;
                transition-timing-function: ${self.params.title.transitionEasing};
            }`, `
            [data-hash="${self.params.hash}"] ${self.params.title.elSelector}:hover { 
                color: ${self.params.title.hover.fontColor}; 
                background: ${self.params.title.hover.bgColor}; 
            }`, `
            [data-hash="${self.params.hash}"] ${self.params.title.elSelector}.${self.params.title.active.classname} { 
                color: ${self.params.title.active.fontColor}; 
                background: ${self.params.title.active.bgColor}; 
            }
            `, `
            [data-hash="${self.params.hash}"] ${self.params.content.elSelector} { 
                color : ${self.params.content.fontColor};
                background : ${self.params.content.bgColor};
                height : 0;
                overflow : hidden;
                transition-duration:  ${self.params.title.transitionDuration}s;
                transition-timing-function: ${self.params.title.transitionEasing};
            }
        `);
        let cssLength = self.params.cssSheet.cssRules.length;
        self.params.dynamicsCssRulesToInsert.forEach(function (cssRule) {
          self.params.cssSheet.insertRule(cssRule, cssLength);
          cssLength++;
        });
        accordionsCSS.push(self.params.hash);
      }

      initCSSClass() {
        const self = this;
        self.params.el.dataset.hash = self.params.hash;
      }

      initTitleEvents() {
        const self = this;

        if (!Utils.checkIfElementExist(self.params.title.el) || !Utils.checkIfElementExist(self.params.content.el)) {
          return;
        }

        self.params.title.el.addEventListener('focus', self.onTitleHover);
        self.params.title.el.addEventListener('mouseenter', self.onTitleHover);
        self.params.title.el.addEventListener('mouseleave', self.onTitleEndHover);
        self.params.title.el.addEventListener('blur', self.onTitleEndHover);
        self.params.title.el.addEventListener('touchstart', self.onTitleClick);
        self.params.title.el.addEventListener('click', self.onTitleClick);
        self.params.title.el.addEventListener('keydown', self.onTitleClick);
      }

      toogleAccordion(toogleWithTransition = true) {
        const self = this;
        self.emit('accordionWillChange');
        self.opened ? self.closeAccordion(toogleWithTransition) : self.openAccordion(toogleWithTransition);
        self.params.title.el.classList.toggle(self.params.title.active.classname);
        self.params.content.el.classList.toggle(self.params.content.active.classname);

        if (self.withTransition === false) {
          setTimeout(function () {
            self.params.title.el.style.transitionDuration = '';
            self.params.content.el.style.transitionDuration = '';
          }, 0);
        }

        self.opened = !self.opened;
      }

      openAccordion(toogleWithTransition = false) {
        const self = this;
        self.emit('accordionWillOpen');
        self.params.content.el.style.height = self.params.content.inner.el.offsetHeight + 'px';
        let contentOpenTransitionDuration = self.params.content.openTransitionDuration || self.params.content.baseTransitionDuration || self.params.baseTranstionDuration;

        if ((toogleWithTransition === false || self.params.withTransition === false) && !self.params.contentPreview.preview) {
          contentOpenTransitionDuration = '0';
        }

        self.params.content.el.style.transitionDuration = contentOpenTransitionDuration + 's';
        let toHeight = self.params.content.inner.el.offsetHeight + 'px';
        self.changeInterval = window.setInterval(function () {
          const elemCurrentHeight = window.getComputedStyle(self.params.content.el, null).getPropertyValue('height');

          if (elemCurrentHeight === toHeight) {
            self.emit('accordionIsOpen');
            self.emit('accordionChanged');
            self.params.content.el.style.transitionDuration = '';
            self.params.content.el.style.transitionTimingFunction = '';
            clearInterval(self.changeInterval);
            clearTimeout(self.changeTimeout);
          }
        }, 100); //SAFE

        self.changeTimeout = setTimeout(function () {
          clearInterval(self.changeInterval);
        }, contentOpenTransitionDuration * 1000 + 200);
      }

      closeAccordion(toogleWithTransition = false) {
        const self = this;
        self.emit('accordionWillClose');
        self.params.content.el.style.height = '0';
        let contentCloseTransitionDuration = self.params.content.closeTransitionDuration || self.params.content.baseTransitionDuration || self.params.baseTranstionDuration;

        if ((toogleWithTransition === false || self.params.withTransition === false) && !self.params.contentPreview.preview) {
          contentCloseTransitionDuration = '0';
        }

        self.params.content.el.style.transitionDuration = contentCloseTransitionDuration + 's';
        let toHeight = '0';
        self.changeInterval = window.setInterval(function () {
          const elemCurrentHeight = window.getComputedStyle(self.params.content.el, null).getPropertyValue('height');

          if (self.params.contentPreview.preview && (Utils.checkIfElementIsHover(self.params.title.el) || Utils.checkIfElementIsFocus(self.params.title.el))) {
            toHeight = self.params.contentPreview.previewHeight;
            self.params.content.el.style.height = toHeight + 'px';
          } else {
            toHeight = '0px';
          }

          if (elemCurrentHeight === toHeight) {
            self.emit('accordionIsClose');
            self.emit('accordionChanged');
            self.params.content.el.style.transitionDuration = '';
            self.params.content.el.style.transitionTimingFunction = '';
            clearInterval(self.changeInterval);
            clearTimeout(self.changeTimeout);
          }
        }, 100); //SAFE

        self.changeTimeout = setTimeout(function () {
          clearInterval(self.changeInterval);
        }, contentCloseTransitionDuration * 1000 + 200);
      }

      initContentPreview() {
        const self = this;
        let newOverlay = document.createElement('div');
        newOverlay.className = 'accordion__content-preview__overlay';
        self.params.content.el.appendChild(newOverlay);
      }

    }

    class Accordions {
      constructor(...args) {
        let elSelector;
        let params;

        if (args.length === 1 && args[0].constructor && args[0].constructor === Object) {
          params = args[0];
        } else {
          [elSelector, params] = args;
        }

        if (!params) params = {};
        params = Utils.extend({}, params);
        if (elSelector && !params.elSelector) params.elSelector = elSelector;
        const self = this;
        self.params = Utils.extend({}, defaultParams, params); // Find el
        //If user have set an element

        const mainElem = typeof self.params.el === 'string' || typeof self.params.el === typeof undefined ? document.querySelectorAll(self.params.elSelector) : [self.params.el]; //Return if no elements

        if (!mainElem[0]) {
          return;
        } //Create hash for style separation


        if (!self.params.hash) {
          self.params.hash = Math.random().toString(36).substring(7);
        } //Create accordions list for accordion group


        const accordions = []; //If more than 1 elem

        if (mainElem.length > 1) {
          mainElem.forEach(containerEl => {
            const newAccordionParams = Utils.extend({}, self.params, {
              el: containerEl
            });
            accordions.push(new Accordion(newAccordionParams));
          });
        } else {
          const newAccordionParams = Utils.extend({}, self.params, {
            el: mainElem[0]
          });
          accordions.push(new Accordion(newAccordionParams));
        }

        self.params.accordions = accordions;

        if (self.params.baseDisplay && self.params.baseDisplay.opened && self.params.baseDisplay.opened.length > 0) {
          self.initOpenedAccordion();
        }

        if (self.params.multipleOpen === false) {
          self.initClosingOthersAccordionWhenOneOpen();
        }

        return accordions;
      }

      initOpenedAccordion() {
        const self = this;
        self.params.accordions.forEach(function (accordion, index) {
          if (self.params.baseDisplay.opened.includes(index + 1)) {
            accordion.toogleAccordion(false);
          }
        });
      }

      initClosingOthersAccordionWhenOneOpen() {
        const self = this;
        self.params.accordions.forEach(function (accordion) {
          accordion.on('accordionWillOpen', function () {
            self.params.accordions.forEach(function (accordionToTest) {
              if (accordionToTest.params.el !== accordion.params.el && accordionToTest.opened) {
                accordionToTest.toogleAccordion();
              }
            });
          });
        });
      }

    }

    return Accordions;

}());
