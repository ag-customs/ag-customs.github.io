webpackJsonp([1],{

/***/ 103:
/***/ function(module, exports, __webpack_require__) {

"use strict";
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.TaskQueue = undefined;

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var _aureliaPal = __webpack_require__(21);



var stackSeparator = '\nEnqueued in TaskQueue by:\n';
var microStackSeparator = '\nEnqueued in MicroTaskQueue by:\n';

function makeRequestFlushFromMutationObserver(flush) {
  var observer = _aureliaPal.DOM.createMutationObserver(flush);
  var val = 'a';
  var node = _aureliaPal.DOM.createTextNode('a');
  var values = Object.create(null);
  values.a = 'b';
  values.b = 'a';
  observer.observe(node, { characterData: true });
  return function requestFlush() {
    node.data = val = values[val];
  };
}

function makeRequestFlushFromTimer(flush) {
  return function requestFlush() {
    var timeoutHandle = setTimeout(handleFlushTimer, 0);

    var intervalHandle = setInterval(handleFlushTimer, 50);
    function handleFlushTimer() {
      clearTimeout(timeoutHandle);
      clearInterval(intervalHandle);
      flush();
    }
  };
}

function onError(error, task, longStacks) {
  if (longStacks && task.stack && (typeof error === 'undefined' ? 'undefined' : _typeof(error)) === 'object' && error !== null) {
    error.stack = filterFlushStack(error.stack) + task.stack;
  }

  if ('onError' in task) {
    task.onError(error);
  } else {
    setTimeout(function () {
      throw error;
    }, 0);
  }
}

var TaskQueue = exports.TaskQueue = function () {
  function TaskQueue() {
    var _this = this;

    

    this.flushing = false;
    this.longStacks = false;

    this.microTaskQueue = [];
    this.microTaskQueueCapacity = 1024;
    this.taskQueue = [];

    if (_aureliaPal.FEATURE.mutationObserver) {
      this.requestFlushMicroTaskQueue = makeRequestFlushFromMutationObserver(function () {
        return _this.flushMicroTaskQueue();
      });
    } else {
      this.requestFlushMicroTaskQueue = makeRequestFlushFromTimer(function () {
        return _this.flushMicroTaskQueue();
      });
    }

    this.requestFlushTaskQueue = makeRequestFlushFromTimer(function () {
      return _this.flushTaskQueue();
    });
  }

  TaskQueue.prototype._flushQueue = function _flushQueue(queue, capacity) {
    var index = 0;
    var task = void 0;

    try {
      this.flushing = true;
      while (index < queue.length) {
        task = queue[index];
        if (this.longStacks) {
          this.stack = typeof task.stack === 'string' ? task.stack : undefined;
        }
        task.call();
        index++;

        if (index > capacity) {
          for (var scan = 0, newLength = queue.length - index; scan < newLength; scan++) {
            queue[scan] = queue[scan + index];
          }

          queue.length -= index;
          index = 0;
        }
      }
    } catch (error) {
      onError(error, task, this.longStacks);
    } finally {
      this.flushing = false;
    }
  };

  TaskQueue.prototype.queueMicroTask = function queueMicroTask(task) {
    if (this.microTaskQueue.length < 1) {
      this.requestFlushMicroTaskQueue();
    }

    if (this.longStacks) {
      task.stack = this.prepareQueueStack(microStackSeparator);
    }

    this.microTaskQueue.push(task);
  };

  TaskQueue.prototype.queueTask = function queueTask(task) {
    if (this.taskQueue.length < 1) {
      this.requestFlushTaskQueue();
    }

    if (this.longStacks) {
      task.stack = this.prepareQueueStack(stackSeparator);
    }

    this.taskQueue.push(task);
  };

  TaskQueue.prototype.flushTaskQueue = function flushTaskQueue() {
    var queue = this.taskQueue;
    this.taskQueue = [];
    this._flushQueue(queue, Number.MAX_VALUE);
  };

  TaskQueue.prototype.flushMicroTaskQueue = function flushMicroTaskQueue() {
    var queue = this.microTaskQueue;
    this._flushQueue(queue, this.microTaskQueueCapacity);
    queue.length = 0;
  };

  TaskQueue.prototype.prepareQueueStack = function prepareQueueStack(separator) {
    var stack = separator + filterQueueStack(captureStack());

    if (typeof this.stack === 'string') {
      stack = filterFlushStack(stack) + this.stack;
    }

    return stack;
  };

  return TaskQueue;
}();

function captureStack() {
  var error = new Error();

  if (error.stack) {
    return error.stack;
  }

  try {
    throw error;
  } catch (e) {
    return e.stack;
  }
}

function filterQueueStack(stack) {
  return stack.replace(/^[\s\S]*?\bqueue(Micro)?Task\b[^\n]*\n/, '');
}

function filterFlushStack(stack) {
  var index = stack.lastIndexOf('flushMicroTaskQueue');

  if (index < 0) {
    index = stack.lastIndexOf('flushTaskQueue');
    if (index < 0) {
      return stack;
    }
  }

  index = stack.lastIndexOf('\n', index);

  return index < 0 ? stack : stack.substr(0, index);
}

/***/ },

/***/ 104:
/***/ function(module, exports, __webpack_require__) {

"use strict";
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.updateOverrideContexts = updateOverrideContexts;
exports.createFullOverrideContext = createFullOverrideContext;
exports.updateOverrideContext = updateOverrideContext;
exports.getItemsSourceExpression = getItemsSourceExpression;
exports.unwrapExpression = unwrapExpression;
exports.isOneTime = isOneTime;
exports.updateOneTimeBinding = updateOneTimeBinding;
exports.indexOf = indexOf;

var _aureliaBinding = __webpack_require__(24);

var oneTime = _aureliaBinding.bindingMode.oneTime;

function updateOverrideContexts(views, startIndex) {
  var length = views.length;

  if (startIndex > 0) {
    startIndex = startIndex - 1;
  }

  for (; startIndex < length; ++startIndex) {
    updateOverrideContext(views[startIndex].overrideContext, startIndex, length);
  }
}

function createFullOverrideContext(repeat, data, index, length, key) {
  var bindingContext = {};
  var overrideContext = (0, _aureliaBinding.createOverrideContext)(bindingContext, repeat.scope.overrideContext);

  if (typeof key !== 'undefined') {
    bindingContext[repeat.key] = key;
    bindingContext[repeat.value] = data;
  } else {
    bindingContext[repeat.local] = data;
  }
  updateOverrideContext(overrideContext, index, length);
  return overrideContext;
}

function updateOverrideContext(overrideContext, index, length) {
  var first = index === 0;
  var last = index === length - 1;
  var even = index % 2 === 0;

  overrideContext.$index = index;
  overrideContext.$first = first;
  overrideContext.$last = last;
  overrideContext.$middle = !(first || last);
  overrideContext.$odd = !even;
  overrideContext.$even = even;
}

function getItemsSourceExpression(instruction, attrName) {
  return instruction.behaviorInstructions.filter(function (bi) {
    return bi.originalAttrName === attrName;
  })[0].attributes.items.sourceExpression;
}

function unwrapExpression(expression) {
  var unwrapped = false;
  while (expression instanceof _aureliaBinding.BindingBehavior) {
    expression = expression.expression;
  }
  while (expression instanceof _aureliaBinding.ValueConverter) {
    expression = expression.expression;
    unwrapped = true;
  }
  return unwrapped ? expression : null;
}

function isOneTime(expression) {
  while (expression instanceof _aureliaBinding.BindingBehavior) {
    if (expression.name === 'oneTime') {
      return true;
    }
    expression = expression.expression;
  }
  return false;
}

function updateOneTimeBinding(binding) {
  if (binding.call && binding.mode === oneTime) {
    binding.call(_aureliaBinding.sourceContext);
  } else if (binding.updateOneTimeBindings) {
    binding.updateOneTimeBindings();
  }
}

function indexOf(array, item, matcher, startIndex) {
  if (!matcher) {
    return array.indexOf(item);
  }
  var length = array.length;
  for (var index = startIndex || 0; index < length; index++) {
    if (matcher(array[index], item)) {
      return index;
    }
  }
  return -1;
}

/***/ },

/***/ 1222:
/***/ function(module, exports, __webpack_require__) {

__webpack_require__(24);
__webpack_require__(7);
__webpack_require__("aurelia-event-aggregator");
__webpack_require__("aurelia-framework");
__webpack_require__(189);
__webpack_require__("aurelia-history-browser");
__webpack_require__(123);
__webpack_require__("aurelia-loader-webpack");
__webpack_require__(58);
__webpack_require__("aurelia-logging-console");
__webpack_require__(43);
__webpack_require__(70);
__webpack_require__("aurelia-route-recognizer");
__webpack_require__("aurelia-router");
__webpack_require__(103);
__webpack_require__(20);
__webpack_require__("aurelia-templating-binding");
__webpack_require__("aurelia-templating-router");
module.exports = __webpack_require__("aurelia-templating-resources");


/***/ },

/***/ 189:
/***/ function(module, exports) {

"use strict";
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});



function mi(name) {
  throw new Error('History must implement ' + name + '().');
}

var History = exports.History = function () {
  function History() {
    
  }

  History.prototype.activate = function activate(options) {
    mi('activate');
  };

  History.prototype.deactivate = function deactivate() {
    mi('deactivate');
  };

  History.prototype.getAbsoluteRoot = function getAbsoluteRoot() {
    mi('getAbsoluteRoot');
  };

  History.prototype.navigate = function navigate(fragment, options) {
    mi('navigate');
  };

  History.prototype.navigateBack = function navigateBack() {
    mi('navigateBack');
  };

  History.prototype.setTitle = function setTitle(title) {
    mi('setTitle');
  };

  History.prototype.setState = function setState(key, value) {
    mi('setState');
  };

  History.prototype.getState = function getState(key) {
    mi('getState');
  };

  return History;
}();

/***/ },

/***/ 194:
/***/ function(module, exports, __webpack_require__) {

"use strict";
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.aureliaHideClassName = undefined;
exports.injectAureliaHideStyleAtHead = injectAureliaHideStyleAtHead;
exports.injectAureliaHideStyleAtBoundary = injectAureliaHideStyleAtBoundary;

var _aureliaPal = __webpack_require__(21);

var aureliaHideClassName = exports.aureliaHideClassName = 'aurelia-hide';

var aureliaHideClass = '.' + aureliaHideClassName + ' { display:none !important; }';

function injectAureliaHideStyleAtHead() {
  _aureliaPal.DOM.injectStyles(aureliaHideClass);
}

function injectAureliaHideStyleAtBoundary(domBoundary) {
  if (_aureliaPal.FEATURE.shadowDOM && domBoundary && !domBoundary.hasAureliaHideStyle) {
    domBoundary.hasAureliaHideStyle = true;
    _aureliaPal.DOM.injectStyles(aureliaHideClass, domBoundary);
  }
}

/***/ },

/***/ 20:
/***/ function(module, exports, __webpack_require__) {

"use strict";
/* WEBPACK VAR INJECTION */(function(Promise) {/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0_aurelia_logging__ = __webpack_require__(58);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0_aurelia_logging___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_0_aurelia_logging__);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1_aurelia_metadata__ = __webpack_require__(43);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1_aurelia_metadata___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_1_aurelia_metadata__);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2_aurelia_pal__ = __webpack_require__(21);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2_aurelia_pal___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_2_aurelia_pal__);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_3_aurelia_loader__ = __webpack_require__(123);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_3_aurelia_loader___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_3_aurelia_loader__);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_4_aurelia_path__ = __webpack_require__(70);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_4_aurelia_path___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_4_aurelia_path__);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_5_aurelia_binding__ = __webpack_require__(24);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_6_aurelia_dependency_injection__ = __webpack_require__(7);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_6_aurelia_dependency_injection___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_6_aurelia_dependency_injection__);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_7_aurelia_task_queue__ = __webpack_require__(103);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_7_aurelia_task_queue___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_7_aurelia_task_queue__);
/* harmony export (binding) */ __webpack_require__.d(exports, "Animator", function() { return Animator; });
/* harmony export (binding) */ __webpack_require__.d(exports, "CompositionTransactionNotifier", function() { return CompositionTransactionNotifier; });
/* harmony export (binding) */ __webpack_require__.d(exports, "CompositionTransactionOwnershipToken", function() { return CompositionTransactionOwnershipToken; });
/* harmony export (binding) */ __webpack_require__.d(exports, "CompositionTransaction", function() { return CompositionTransaction; });
/* harmony export (immutable) */ exports["_hyphenate"] = _hyphenate;
/* harmony export (immutable) */ exports["_isAllWhitespace"] = _isAllWhitespace;
/* harmony export (binding) */ __webpack_require__.d(exports, "ViewEngineHooksResource", function() { return ViewEngineHooksResource; });
/* harmony export (immutable) */ exports["viewEngineHooks"] = viewEngineHooks;
/* harmony export (binding) */ __webpack_require__.d(exports, "ElementEvents", function() { return ElementEvents; });
/* harmony export (binding) */ __webpack_require__.d(exports, "ResourceLoadContext", function() { return ResourceLoadContext; });
/* harmony export (binding) */ __webpack_require__.d(exports, "ViewCompileInstruction", function() { return ViewCompileInstruction; });
/* harmony export (binding) */ __webpack_require__.d(exports, "BehaviorInstruction", function() { return BehaviorInstruction; });
/* harmony export (binding) */ __webpack_require__.d(exports, "TargetInstruction", function() { return TargetInstruction; });
/* harmony export (binding) */ __webpack_require__.d(exports, "RelativeViewStrategy", function() { return RelativeViewStrategy; });
/* harmony export (binding) */ __webpack_require__.d(exports, "ConventionalViewStrategy", function() { return ConventionalViewStrategy; });
/* harmony export (binding) */ __webpack_require__.d(exports, "NoViewStrategy", function() { return NoViewStrategy; });
/* harmony export (binding) */ __webpack_require__.d(exports, "TemplateRegistryViewStrategy", function() { return TemplateRegistryViewStrategy; });
/* harmony export (binding) */ __webpack_require__.d(exports, "InlineViewStrategy", function() { return InlineViewStrategy; });
/* harmony export (binding) */ __webpack_require__.d(exports, "StaticViewStrategy", function() { return StaticViewStrategy; });
/* harmony export (binding) */ __webpack_require__.d(exports, "ViewLocator", function() { return ViewLocator; });
/* harmony export (binding) */ __webpack_require__.d(exports, "BindingLanguage", function() { return BindingLanguage; });
/* harmony export (binding) */ __webpack_require__.d(exports, "SlotCustomAttribute", function() { return SlotCustomAttribute; });
/* harmony export (binding) */ __webpack_require__.d(exports, "PassThroughSlot", function() { return PassThroughSlot; });
/* harmony export (binding) */ __webpack_require__.d(exports, "ShadowSlot", function() { return ShadowSlot; });
/* harmony export (binding) */ __webpack_require__.d(exports, "ShadowDOM", function() { return ShadowDOM; });
/* harmony export (immutable) */ exports["validateBehaviorName"] = validateBehaviorName;
/* harmony export (binding) */ __webpack_require__.d(exports, "ViewResources", function() { return ViewResources; });
/* harmony export (binding) */ __webpack_require__.d(exports, "View", function() { return View; });
/* harmony export (binding) */ __webpack_require__.d(exports, "ViewSlot", function() { return ViewSlot; });
/* harmony export (binding) */ __webpack_require__.d(exports, "BoundViewFactory", function() { return BoundViewFactory; });
/* harmony export (binding) */ __webpack_require__.d(exports, "ViewFactory", function() { return ViewFactory; });
/* harmony export (binding) */ __webpack_require__.d(exports, "ViewCompiler", function() { return ViewCompiler; });
/* harmony export (binding) */ __webpack_require__.d(exports, "ResourceModule", function() { return ResourceModule; });
/* harmony export (binding) */ __webpack_require__.d(exports, "ResourceDescription", function() { return ResourceDescription; });
/* harmony export (binding) */ __webpack_require__.d(exports, "ModuleAnalyzer", function() { return ModuleAnalyzer; });
/* harmony export (binding) */ __webpack_require__.d(exports, "ViewEngine", function() { return ViewEngine; });
/* harmony export (binding) */ __webpack_require__.d(exports, "Controller", function() { return Controller; });
/* harmony export (binding) */ __webpack_require__.d(exports, "BehaviorPropertyObserver", function() { return BehaviorPropertyObserver; });
/* harmony export (binding) */ __webpack_require__.d(exports, "BindableProperty", function() { return BindableProperty; });
/* harmony export (binding) */ __webpack_require__.d(exports, "HtmlBehaviorResource", function() { return HtmlBehaviorResource; });
/* harmony export (immutable) */ exports["children"] = children;
/* harmony export (immutable) */ exports["child"] = child;
/* harmony export (binding) */ __webpack_require__.d(exports, "CompositionEngine", function() { return CompositionEngine; });
/* harmony export (binding) */ __webpack_require__.d(exports, "ElementConfigResource", function() { return ElementConfigResource; });
/* harmony export (immutable) */ exports["resource"] = resource;
/* harmony export (immutable) */ exports["behavior"] = behavior;
/* harmony export (immutable) */ exports["customElement"] = customElement;
/* harmony export (immutable) */ exports["customAttribute"] = customAttribute;
/* harmony export (immutable) */ exports["templateController"] = templateController;
/* harmony export (immutable) */ exports["bindable"] = bindable;
/* harmony export (immutable) */ exports["dynamicOptions"] = dynamicOptions;
/* harmony export (immutable) */ exports["useShadowDOM"] = useShadowDOM;
/* harmony export (immutable) */ exports["processAttributes"] = processAttributes;
/* harmony export (immutable) */ exports["processContent"] = processContent;
/* harmony export (immutable) */ exports["containerless"] = containerless;
/* harmony export (immutable) */ exports["useViewStrategy"] = useViewStrategy;
/* harmony export (immutable) */ exports["useView"] = useView;
/* harmony export (immutable) */ exports["inlineView"] = inlineView;
/* harmony export (immutable) */ exports["noView"] = noView;
/* harmony export (immutable) */ exports["view"] = view;
/* harmony export (immutable) */ exports["elementConfig"] = elementConfig;
/* harmony export (immutable) */ exports["viewResources"] = viewResources;
/* harmony export (binding) */ __webpack_require__.d(exports, "TemplatingEngine", function() { return TemplatingEngine; });
var _class, _temp, _dec, _class2, _dec2, _class3, _dec3, _class4, _dec4, _class5, _dec5, _class6, _dec6, _class7, _class8, _temp2, _class9, _temp3, _class11, _dec7, _class13, _dec8, _class14, _class15, _temp4, _dec9, _class16, _dec10, _class17, _dec11, _class18;










const animationEvent = {
  enterBegin: 'animation:enter:begin',
  enterActive: 'animation:enter:active',
  enterDone: 'animation:enter:done',
  enterTimeout: 'animation:enter:timeout',

  leaveBegin: 'animation:leave:begin',
  leaveActive: 'animation:leave:active',
  leaveDone: 'animation:leave:done',
  leaveTimeout: 'animation:leave:timeout',

  staggerNext: 'animation:stagger:next',

  removeClassBegin: 'animation:remove-class:begin',
  removeClassActive: 'animation:remove-class:active',
  removeClassDone: 'animation:remove-class:done',
  removeClassTimeout: 'animation:remove-class:timeout',

  addClassBegin: 'animation:add-class:begin',
  addClassActive: 'animation:add-class:active',
  addClassDone: 'animation:add-class:done',
  addClassTimeout: 'animation:add-class:timeout',

  animateBegin: 'animation:animate:begin',
  animateActive: 'animation:animate:active',
  animateDone: 'animation:animate:done',
  animateTimeout: 'animation:animate:timeout',

  sequenceBegin: 'animation:sequence:begin',
  sequenceDone: 'animation:sequence:done'
};
/* harmony export (immutable) */ exports["animationEvent"] = animationEvent;


let Animator = class Animator {
  enter(element) {
    return Promise.resolve(false);
  }

  leave(element) {
    return Promise.resolve(false);
  }

  removeClass(element, className) {
    element.classList.remove(className);
    return Promise.resolve(false);
  }

  addClass(element, className) {
    element.classList.add(className);
    return Promise.resolve(false);
  }

  animate(element, className) {
    return Promise.resolve(false);
  }

  runSequence(animations) {}

  registerEffect(effectName, properties) {}

  unregisterEffect(effectName) {}
};

let CompositionTransactionNotifier = class CompositionTransactionNotifier {
  constructor(owner) {
    this.owner = owner;
    this.owner._compositionCount++;
  }

  done() {
    this.owner._compositionCount--;
    this.owner._tryCompleteTransaction();
  }
};

let CompositionTransactionOwnershipToken = class CompositionTransactionOwnershipToken {
  constructor(owner) {
    this.owner = owner;
    this.owner._ownershipToken = this;
    this.thenable = this._createThenable();
  }

  waitForCompositionComplete() {
    this.owner._tryCompleteTransaction();
    return this.thenable;
  }

  resolve() {
    this._resolveCallback();
  }

  _createThenable() {
    return new Promise((resolve, reject) => {
      this._resolveCallback = resolve;
    });
  }
};

let CompositionTransaction = class CompositionTransaction {
  constructor() {
    this._ownershipToken = null;
    this._compositionCount = 0;
  }

  tryCapture() {
    return this._ownershipToken === null ? new CompositionTransactionOwnershipToken(this) : null;
  }

  enlist() {
    return new CompositionTransactionNotifier(this);
  }

  _tryCompleteTransaction() {
    if (this._compositionCount <= 0) {
      this._compositionCount = 0;

      if (this._ownershipToken !== null) {
        let token = this._ownershipToken;
        this._ownershipToken = null;
        token.resolve();
      }
    }
  }
};

const capitalMatcher = /([A-Z])/g;

function addHyphenAndLower(char) {
  return '-' + char.toLowerCase();
}

function _hyphenate(name) {
  return (name.charAt(0).toLowerCase() + name.slice(1)).replace(capitalMatcher, addHyphenAndLower);
}

function _isAllWhitespace(node) {
  return !(node.auInterpolationTarget || /[^\t\n\r ]/.test(node.textContent));
}

let ViewEngineHooksResource = class ViewEngineHooksResource {
  constructor() {}

  initialize(container, target) {
    this.instance = container.get(target);
  }

  register(registry, name) {
    registry.registerViewEngineHooks(this.instance);
  }

  load(container, target) {}

  static convention(name) {
    if (name.endsWith('ViewEngineHooks')) {
      return new ViewEngineHooksResource();
    }
  }
};

function viewEngineHooks(target) {
  let deco = function (t) {
    __WEBPACK_IMPORTED_MODULE_1_aurelia_metadata__["metadata"].define(__WEBPACK_IMPORTED_MODULE_1_aurelia_metadata__["metadata"].resource, new ViewEngineHooksResource(), t);
  };

  return target ? deco(target) : deco;
}

let ElementEvents = class ElementEvents {
  constructor(element) {
    this.element = element;
    this.subscriptions = {};
  }

  _enqueueHandler(handler) {
    this.subscriptions[handler.eventName] = this.subscriptions[handler.eventName] || [];
    this.subscriptions[handler.eventName].push(handler);
  }

  _dequeueHandler(handler) {
    let index;
    let subscriptions = this.subscriptions[handler.eventName];
    if (subscriptions) {
      index = subscriptions.indexOf(handler);
      if (index > -1) {
        subscriptions.splice(index, 1);
      }
    }
    return handler;
  }

  publish(eventName, detail = {}, bubbles = true, cancelable = true) {
    let event = __WEBPACK_IMPORTED_MODULE_2_aurelia_pal__["DOM"].createCustomEvent(eventName, { cancelable, bubbles, detail });
    this.element.dispatchEvent(event);
  }

  subscribe(eventName, handler, captureOrOptions = true) {
    if (typeof handler === 'function') {
      const eventHandler = new EventHandlerImpl(this, eventName, handler, captureOrOptions, false);
      return eventHandler;
    }

    return undefined;
  }

  subscribeOnce(eventName, handler, captureOrOptions = true) {
    if (typeof handler === 'function') {
      const eventHandler = new EventHandlerImpl(this, eventName, handler, captureOrOptions, true);
      return eventHandler;
    }

    return undefined;
  }

  dispose(eventName) {
    if (eventName && typeof eventName === 'string') {
      let subscriptions = this.subscriptions[eventName];
      if (subscriptions) {
        while (subscriptions.length) {
          let subscription = subscriptions.pop();
          if (subscription) {
            subscription.dispose();
          }
        }
      }
    } else {
      this.disposeAll();
    }
  }

  disposeAll() {
    for (let key in this.subscriptions) {
      this.dispose(key);
    }
  }
};

let EventHandlerImpl = class EventHandlerImpl {
  constructor(owner, eventName, handler, captureOrOptions, once) {
    this.owner = owner;
    this.eventName = eventName;
    this.handler = handler;

    this.capture = typeof captureOrOptions === 'boolean' ? captureOrOptions : captureOrOptions.capture;
    this.bubbles = !this.capture;
    this.captureOrOptions = captureOrOptions;
    this.once = once;
    owner.element.addEventListener(eventName, this, captureOrOptions);
    owner._enqueueHandler(this);
  }

  handleEvent(e) {
    const fn = this.handler;
    fn(e);
    if (this.once) {
      this.dispose();
    }
  }

  dispose() {
    this.owner.element.removeEventListener(this.eventName, this, this.captureOrOptions);
    this.owner._dequeueHandler(this);
    this.owner = this.handler = null;
  }
};

let ResourceLoadContext = class ResourceLoadContext {
  constructor() {
    this.dependencies = {};
  }

  addDependency(url) {
    this.dependencies[url] = true;
  }

  hasDependency(url) {
    return url in this.dependencies;
  }
};

let ViewCompileInstruction = class ViewCompileInstruction {
  constructor(targetShadowDOM = false, compileSurrogate = false) {
    this.targetShadowDOM = targetShadowDOM;
    this.compileSurrogate = compileSurrogate;
    this.associatedModuleId = null;
  }
};

ViewCompileInstruction.normal = new ViewCompileInstruction();

let BehaviorInstruction = class BehaviorInstruction {
  static enhance() {
    let instruction = new BehaviorInstruction();
    instruction.enhance = true;
    return instruction;
  }

  static unitTest(type, attributes) {
    let instruction = new BehaviorInstruction();
    instruction.type = type;
    instruction.attributes = attributes || {};
    return instruction;
  }

  static element(node, type) {
    let instruction = new BehaviorInstruction();
    instruction.type = type;
    instruction.attributes = {};
    instruction.anchorIsContainer = !(node.hasAttribute('containerless') || type.containerless);
    instruction.initiatedByBehavior = true;
    return instruction;
  }

  static attribute(attrName, type) {
    let instruction = new BehaviorInstruction();
    instruction.attrName = attrName;
    instruction.type = type || null;
    instruction.attributes = {};
    return instruction;
  }

  static dynamic(host, viewModel, viewFactory) {
    let instruction = new BehaviorInstruction();
    instruction.host = host;
    instruction.viewModel = viewModel;
    instruction.viewFactory = viewFactory;
    instruction.inheritBindingContext = true;
    return instruction;
  }
};

const biProto = BehaviorInstruction.prototype;
biProto.initiatedByBehavior = false;
biProto.enhance = false;
biProto.partReplacements = null;
biProto.viewFactory = null;
biProto.originalAttrName = null;
biProto.skipContentProcessing = false;
biProto.contentFactory = null;
biProto.viewModel = null;
biProto.anchorIsContainer = false;
biProto.host = null;
biProto.attributes = null;
biProto.type = null;
biProto.attrName = null;
biProto.inheritBindingContext = false;

BehaviorInstruction.normal = new BehaviorInstruction();

let TargetInstruction = (_temp = _class = class TargetInstruction {
  static shadowSlot(parentInjectorId) {
    let instruction = new TargetInstruction();
    instruction.parentInjectorId = parentInjectorId;
    instruction.shadowSlot = true;
    return instruction;
  }

  static contentExpression(expression) {
    let instruction = new TargetInstruction();
    instruction.contentExpression = expression;
    return instruction;
  }

  static letElement(expressions) {
    let instruction = new TargetInstruction();
    instruction.expressions = expressions;
    instruction.letElement = true;
    return instruction;
  }

  static lifting(parentInjectorId, liftingInstruction) {
    let instruction = new TargetInstruction();
    instruction.parentInjectorId = parentInjectorId;
    instruction.expressions = TargetInstruction.noExpressions;
    instruction.behaviorInstructions = [liftingInstruction];
    instruction.viewFactory = liftingInstruction.viewFactory;
    instruction.providers = [liftingInstruction.type.target];
    instruction.lifting = true;
    return instruction;
  }

  static normal(injectorId, parentInjectorId, providers, behaviorInstructions, expressions, elementInstruction) {
    let instruction = new TargetInstruction();
    instruction.injectorId = injectorId;
    instruction.parentInjectorId = parentInjectorId;
    instruction.providers = providers;
    instruction.behaviorInstructions = behaviorInstructions;
    instruction.expressions = expressions;
    instruction.anchorIsContainer = elementInstruction ? elementInstruction.anchorIsContainer : true;
    instruction.elementInstruction = elementInstruction;
    return instruction;
  }

  static surrogate(providers, behaviorInstructions, expressions, values) {
    let instruction = new TargetInstruction();
    instruction.expressions = expressions;
    instruction.behaviorInstructions = behaviorInstructions;
    instruction.providers = providers;
    instruction.values = values;
    return instruction;
  }
}, _class.noExpressions = Object.freeze([]), _temp);

const tiProto = TargetInstruction.prototype;

tiProto.injectorId = null;
tiProto.parentInjectorId = null;

tiProto.shadowSlot = false;
tiProto.slotName = null;
tiProto.slotFallbackFactory = null;

tiProto.contentExpression = null;
tiProto.letElement = false;

tiProto.expressions = null;
tiProto.expressions = null;
tiProto.providers = null;

tiProto.viewFactory = null;

tiProto.anchorIsContainer = false;
tiProto.elementInstruction = null;
tiProto.lifting = false;

tiProto.values = null;

const viewStrategy = __WEBPACK_IMPORTED_MODULE_1_aurelia_metadata__["protocol"].create('aurelia:view-strategy', {
  validate(target) {
    if (!(typeof target.loadViewFactory === 'function')) {
      return 'View strategies must implement: loadViewFactory(viewEngine: ViewEngine, compileInstruction: ViewCompileInstruction, loadContext?: ResourceLoadContext): Promise<ViewFactory>';
    }

    return true;
  },
  compose(target) {
    if (!(typeof target.makeRelativeTo === 'function')) {
      target.makeRelativeTo = __WEBPACK_IMPORTED_MODULE_2_aurelia_pal__["PLATFORM"].noop;
    }
  }
});
/* harmony export (immutable) */ exports["viewStrategy"] = viewStrategy;


let RelativeViewStrategy = (_dec = viewStrategy(), _dec(_class2 = class RelativeViewStrategy {
  constructor(path) {
    this.path = path;
    this.absolutePath = null;
  }

  loadViewFactory(viewEngine, compileInstruction, loadContext, target) {
    if (this.absolutePath === null && this.moduleId) {
      this.absolutePath = __webpack_require__.i(__WEBPACK_IMPORTED_MODULE_4_aurelia_path__["relativeToFile"])(this.path, this.moduleId);
    }

    compileInstruction.associatedModuleId = this.moduleId;
    return viewEngine.loadViewFactory(this.absolutePath || this.path, compileInstruction, loadContext, target);
  }

  makeRelativeTo(file) {
    if (this.absolutePath === null) {
      this.absolutePath = __webpack_require__.i(__WEBPACK_IMPORTED_MODULE_4_aurelia_path__["relativeToFile"])(this.path, file);
    }
  }
}) || _class2);

let ConventionalViewStrategy = (_dec2 = viewStrategy(), _dec2(_class3 = class ConventionalViewStrategy {
  constructor(viewLocator, origin) {
    this.moduleId = origin.moduleId;
    this.viewUrl = viewLocator.convertOriginToViewUrl(origin);
  }

  loadViewFactory(viewEngine, compileInstruction, loadContext, target) {
    compileInstruction.associatedModuleId = this.moduleId;
    return viewEngine.loadViewFactory(this.viewUrl, compileInstruction, loadContext, target);
  }
}) || _class3);

let NoViewStrategy = (_dec3 = viewStrategy(), _dec3(_class4 = class NoViewStrategy {
  constructor(dependencies, dependencyBaseUrl) {
    this.dependencies = dependencies || null;
    this.dependencyBaseUrl = dependencyBaseUrl || '';
  }

  loadViewFactory(viewEngine, compileInstruction, loadContext, target) {
    let entry = this.entry;
    let dependencies = this.dependencies;

    if (entry && entry.factoryIsReady) {
      return Promise.resolve(null);
    }

    this.entry = entry = new __WEBPACK_IMPORTED_MODULE_3_aurelia_loader__["TemplateRegistryEntry"](this.moduleId || this.dependencyBaseUrl);

    entry.dependencies = [];
    entry.templateIsLoaded = true;

    if (dependencies !== null) {
      for (let i = 0, ii = dependencies.length; i < ii; ++i) {
        let current = dependencies[i];

        if (typeof current === 'string' || typeof current === 'function') {
          entry.addDependency(current);
        } else {
          entry.addDependency(current.from, current.as);
        }
      }
    }

    compileInstruction.associatedModuleId = this.moduleId;

    return viewEngine.loadViewFactory(entry, compileInstruction, loadContext, target);
  }
}) || _class4);

let TemplateRegistryViewStrategy = (_dec4 = viewStrategy(), _dec4(_class5 = class TemplateRegistryViewStrategy {
  constructor(moduleId, entry) {
    this.moduleId = moduleId;
    this.entry = entry;
  }

  loadViewFactory(viewEngine, compileInstruction, loadContext, target) {
    let entry = this.entry;

    if (entry.factoryIsReady) {
      return Promise.resolve(entry.factory);
    }

    compileInstruction.associatedModuleId = this.moduleId;
    return viewEngine.loadViewFactory(entry, compileInstruction, loadContext, target);
  }
}) || _class5);

let InlineViewStrategy = (_dec5 = viewStrategy(), _dec5(_class6 = class InlineViewStrategy {
  constructor(markup, dependencies, dependencyBaseUrl) {
    this.markup = markup;
    this.dependencies = dependencies || null;
    this.dependencyBaseUrl = dependencyBaseUrl || '';
  }

  loadViewFactory(viewEngine, compileInstruction, loadContext, target) {
    let entry = this.entry;
    let dependencies = this.dependencies;

    if (entry && entry.factoryIsReady) {
      return Promise.resolve(entry.factory);
    }

    this.entry = entry = new __WEBPACK_IMPORTED_MODULE_3_aurelia_loader__["TemplateRegistryEntry"](this.moduleId || this.dependencyBaseUrl);
    entry.template = __WEBPACK_IMPORTED_MODULE_2_aurelia_pal__["DOM"].createTemplateFromMarkup(this.markup);

    if (dependencies !== null) {
      for (let i = 0, ii = dependencies.length; i < ii; ++i) {
        let current = dependencies[i];

        if (typeof current === 'string' || typeof current === 'function') {
          entry.addDependency(current);
        } else {
          entry.addDependency(current.from, current.as);
        }
      }
    }

    compileInstruction.associatedModuleId = this.moduleId;
    return viewEngine.loadViewFactory(entry, compileInstruction, loadContext, target);
  }
}) || _class6);

let StaticViewStrategy = (_dec6 = viewStrategy(), _dec6(_class7 = class StaticViewStrategy {

  constructor(config) {
    if (typeof config === 'string' || config instanceof __WEBPACK_IMPORTED_MODULE_2_aurelia_pal__["DOM"].Element && config.tagName === 'TEMPLATE') {
      config = {
        template: config
      };
    }
    this.template = config.template;
    this.dependencies = config.dependencies || [];
    this.factoryIsReady = false;
    this.onReady = null;
    this.moduleId = 'undefined';
  }

  loadViewFactory(viewEngine, compileInstruction, loadContext, target) {
    if (this.factoryIsReady) {
      return Promise.resolve(this.factory);
    }
    let deps = this.dependencies;
    deps = typeof deps === 'function' ? deps() : deps;
    deps = deps ? deps : [];
    deps = Array.isArray(deps) ? deps : [deps];

    return Promise.all(deps).then(dependencies => {
      const container = viewEngine.container;
      const appResources = viewEngine.appResources;
      const viewCompiler = viewEngine.viewCompiler;
      const viewResources = new ViewResources(appResources);

      let resource;
      let elDeps = [];

      if (target) {
        viewResources.autoRegister(container, target);
      }

      for (let dep of dependencies) {
        if (typeof dep === 'function') {
          resource = viewResources.autoRegister(container, dep);
          if (resource.elementName !== null) {
            elDeps.push(resource);
          }
        } else if (dep && typeof dep === 'object') {
          for (let key in dep) {
            let exported = dep[key];
            if (typeof exported === 'function') {
              resource = viewResources.autoRegister(container, exported);
              if (resource.elementName !== null) {
                elDeps.push(resource);
              }
            }
          }
        } else {
          throw new Error(`dependency neither function nor object. Received: "${typeof dep}"`);
        }
      }

      return Promise.all(elDeps.map(el => el.load(container, el.target))).then(() => {
        const factory = this.template !== null ? viewCompiler.compile(this.template, viewResources, compileInstruction) : null;
        this.factoryIsReady = true;
        this.factory = factory;
        return factory;
      });
    });
  }
}) || _class7);

let ViewLocator = (_temp2 = _class8 = class ViewLocator {
  getViewStrategy(value) {
    if (!value) {
      return null;
    }

    if (typeof value === 'object' && 'getViewStrategy' in value) {
      let origin = __WEBPACK_IMPORTED_MODULE_1_aurelia_metadata__["Origin"].get(value.constructor);

      value = value.getViewStrategy();

      if (typeof value === 'string') {
        value = new RelativeViewStrategy(value);
      }

      viewStrategy.assert(value);

      if (origin.moduleId) {
        value.makeRelativeTo(origin.moduleId);
      }

      return value;
    }

    if (typeof value === 'string') {
      value = new RelativeViewStrategy(value);
    }

    if (viewStrategy.validate(value)) {
      return value;
    }

    if (typeof value !== 'function') {
      value = value.constructor;
    }

    if ('$view' in value) {
      let c = value.$view;
      let view;
      c = typeof c === 'function' ? c.call(value) : c;
      if (c === null) {
        view = new NoViewStrategy();
      } else {
        view = c instanceof StaticViewStrategy ? c : new StaticViewStrategy(c);
      }
      __WEBPACK_IMPORTED_MODULE_1_aurelia_metadata__["metadata"].define(ViewLocator.viewStrategyMetadataKey, view, value);
      return view;
    }

    let origin = __WEBPACK_IMPORTED_MODULE_1_aurelia_metadata__["Origin"].get(value);
    let strategy = __WEBPACK_IMPORTED_MODULE_1_aurelia_metadata__["metadata"].get(ViewLocator.viewStrategyMetadataKey, value);

    if (!strategy) {
      if (!origin.moduleId) {
        throw new Error('Cannot determine default view strategy for object.', value);
      }

      strategy = this.createFallbackViewStrategy(origin);
    } else if (origin.moduleId) {
      strategy.moduleId = origin.moduleId;
    }

    return strategy;
  }

  createFallbackViewStrategy(origin) {
    return new ConventionalViewStrategy(this, origin);
  }

  convertOriginToViewUrl(origin) {
    let moduleId = origin.moduleId;
    let id = moduleId.endsWith('.js') || moduleId.endsWith('.ts') ? moduleId.substring(0, moduleId.length - 3) : moduleId;
    return id + '.html';
  }
}, _class8.viewStrategyMetadataKey = 'aurelia:view-strategy', _temp2);

function mi(name) {
  throw new Error(`BindingLanguage must implement ${name}().`);
}

let BindingLanguage = class BindingLanguage {
  inspectAttribute(resources, elementName, attrName, attrValue) {
    mi('inspectAttribute');
  }

  createAttributeInstruction(resources, element, info, existingInstruction) {
    mi('createAttributeInstruction');
  }

  createLetExpressions(resources, element) {
    mi('createLetExpressions');
  }

  inspectTextContent(resources, value) {
    mi('inspectTextContent');
  }
};

let noNodes = Object.freeze([]);

let SlotCustomAttribute = class SlotCustomAttribute {
  static inject() {
    return [__WEBPACK_IMPORTED_MODULE_2_aurelia_pal__["DOM"].Element];
  }

  constructor(element) {
    this.element = element;
    this.element.auSlotAttribute = this;
  }

  valueChanged(newValue, oldValue) {}
};

let PassThroughSlot = class PassThroughSlot {
  constructor(anchor, name, destinationName, fallbackFactory) {
    this.anchor = anchor;
    this.anchor.viewSlot = this;
    this.name = name;
    this.destinationName = destinationName;
    this.fallbackFactory = fallbackFactory;
    this.destinationSlot = null;
    this.projections = 0;
    this.contentView = null;

    let attr = new SlotCustomAttribute(this.anchor);
    attr.value = this.destinationName;
  }

  get needsFallbackRendering() {
    return this.fallbackFactory && this.projections === 0;
  }

  renderFallbackContent(view, nodes, projectionSource, index) {
    if (this.contentView === null) {
      this.contentView = this.fallbackFactory.create(this.ownerView.container);
      this.contentView.bind(this.ownerView.bindingContext, this.ownerView.overrideContext);

      let slots = Object.create(null);
      slots[this.destinationSlot.name] = this.destinationSlot;

      ShadowDOM.distributeView(this.contentView, slots, projectionSource, index, this.destinationSlot.name);
    }
  }

  passThroughTo(destinationSlot) {
    this.destinationSlot = destinationSlot;
  }

  addNode(view, node, projectionSource, index) {
    if (this.contentView !== null) {
      this.contentView.removeNodes();
      this.contentView.detached();
      this.contentView.unbind();
      this.contentView = null;
    }

    if (node.viewSlot instanceof PassThroughSlot) {
      node.viewSlot.passThroughTo(this);
      return;
    }

    this.projections++;
    this.destinationSlot.addNode(view, node, projectionSource, index);
  }

  removeView(view, projectionSource) {
    this.projections--;
    this.destinationSlot.removeView(view, projectionSource);

    if (this.needsFallbackRendering) {
      this.renderFallbackContent(null, noNodes, projectionSource);
    }
  }

  removeAll(projectionSource) {
    this.projections = 0;
    this.destinationSlot.removeAll(projectionSource);

    if (this.needsFallbackRendering) {
      this.renderFallbackContent(null, noNodes, projectionSource);
    }
  }

  projectFrom(view, projectionSource) {
    this.destinationSlot.projectFrom(view, projectionSource);
  }

  created(ownerView) {
    this.ownerView = ownerView;
  }

  bind(view) {
    if (this.contentView) {
      this.contentView.bind(view.bindingContext, view.overrideContext);
    }
  }

  attached() {
    if (this.contentView) {
      this.contentView.attached();
    }
  }

  detached() {
    if (this.contentView) {
      this.contentView.detached();
    }
  }

  unbind() {
    if (this.contentView) {
      this.contentView.unbind();
    }
  }
};

let ShadowSlot = class ShadowSlot {
  constructor(anchor, name, fallbackFactory) {
    this.anchor = anchor;
    this.anchor.isContentProjectionSource = true;
    this.anchor.viewSlot = this;
    this.name = name;
    this.fallbackFactory = fallbackFactory;
    this.contentView = null;
    this.projections = 0;
    this.children = [];
    this.projectFromAnchors = null;
    this.destinationSlots = null;
  }

  get needsFallbackRendering() {
    return this.fallbackFactory && this.projections === 0;
  }

  addNode(view, node, projectionSource, index, destination) {
    if (this.contentView !== null) {
      this.contentView.removeNodes();
      this.contentView.detached();
      this.contentView.unbind();
      this.contentView = null;
    }

    if (node.viewSlot instanceof PassThroughSlot) {
      node.viewSlot.passThroughTo(this);
      return;
    }

    if (this.destinationSlots !== null) {
      ShadowDOM.distributeNodes(view, [node], this.destinationSlots, this, index);
    } else {
      node.auOwnerView = view;
      node.auProjectionSource = projectionSource;
      node.auAssignedSlot = this;

      let anchor = this._findAnchor(view, node, projectionSource, index);
      let parent = anchor.parentNode;

      parent.insertBefore(node, anchor);
      this.children.push(node);
      this.projections++;
    }
  }

  removeView(view, projectionSource) {
    if (this.destinationSlots !== null) {
      ShadowDOM.undistributeView(view, this.destinationSlots, this);
    } else if (this.contentView && this.contentView.hasSlots) {
      ShadowDOM.undistributeView(view, this.contentView.slots, projectionSource);
    } else {
      let found = this.children.find(x => x.auSlotProjectFrom === projectionSource);
      if (found) {
        let children = found.auProjectionChildren;

        for (let i = 0, ii = children.length; i < ii; ++i) {
          let child = children[i];

          if (child.auOwnerView === view) {
            children.splice(i, 1);
            view.fragment.appendChild(child);
            i--;ii--;
            this.projections--;
          }
        }

        if (this.needsFallbackRendering) {
          this.renderFallbackContent(view, noNodes, projectionSource);
        }
      }
    }
  }

  removeAll(projectionSource) {
    if (this.destinationSlots !== null) {
      ShadowDOM.undistributeAll(this.destinationSlots, this);
    } else if (this.contentView && this.contentView.hasSlots) {
      ShadowDOM.undistributeAll(this.contentView.slots, projectionSource);
    } else {
      let found = this.children.find(x => x.auSlotProjectFrom === projectionSource);

      if (found) {
        let children = found.auProjectionChildren;
        for (let i = 0, ii = children.length; i < ii; ++i) {
          let child = children[i];
          child.auOwnerView.fragment.appendChild(child);
          this.projections--;
        }

        found.auProjectionChildren = [];

        if (this.needsFallbackRendering) {
          this.renderFallbackContent(null, noNodes, projectionSource);
        }
      }
    }
  }

  _findAnchor(view, node, projectionSource, index) {
    if (projectionSource) {
      let found = this.children.find(x => x.auSlotProjectFrom === projectionSource);
      if (found) {
        if (index !== undefined) {
          let children = found.auProjectionChildren;
          let viewIndex = -1;
          let lastView;

          for (let i = 0, ii = children.length; i < ii; ++i) {
            let current = children[i];

            if (current.auOwnerView !== lastView) {
              viewIndex++;
              lastView = current.auOwnerView;

              if (viewIndex >= index && lastView !== view) {
                children.splice(i, 0, node);
                return current;
              }
            }
          }
        }

        found.auProjectionChildren.push(node);
        return found;
      }
    }

    return this.anchor;
  }

  projectTo(slots) {
    this.destinationSlots = slots;
  }

  projectFrom(view, projectionSource) {
    let anchor = __WEBPACK_IMPORTED_MODULE_2_aurelia_pal__["DOM"].createComment('anchor');
    let parent = this.anchor.parentNode;
    anchor.auSlotProjectFrom = projectionSource;
    anchor.auOwnerView = view;
    anchor.auProjectionChildren = [];
    parent.insertBefore(anchor, this.anchor);
    this.children.push(anchor);

    if (this.projectFromAnchors === null) {
      this.projectFromAnchors = [];
    }

    this.projectFromAnchors.push(anchor);
  }

  renderFallbackContent(view, nodes, projectionSource, index) {
    if (this.contentView === null) {
      this.contentView = this.fallbackFactory.create(this.ownerView.container);
      this.contentView.bind(this.ownerView.bindingContext, this.ownerView.overrideContext);
      this.contentView.insertNodesBefore(this.anchor);
    }

    if (this.contentView.hasSlots) {
      let slots = this.contentView.slots;
      let projectFromAnchors = this.projectFromAnchors;

      if (projectFromAnchors !== null) {
        for (let slotName in slots) {
          let slot = slots[slotName];

          for (let i = 0, ii = projectFromAnchors.length; i < ii; ++i) {
            let anchor = projectFromAnchors[i];
            slot.projectFrom(anchor.auOwnerView, anchor.auSlotProjectFrom);
          }
        }
      }

      this.fallbackSlots = slots;
      ShadowDOM.distributeNodes(view, nodes, slots, projectionSource, index);
    }
  }

  created(ownerView) {
    this.ownerView = ownerView;
  }

  bind(view) {
    if (this.contentView) {
      this.contentView.bind(view.bindingContext, view.overrideContext);
    }
  }

  attached() {
    if (this.contentView) {
      this.contentView.attached();
    }
  }

  detached() {
    if (this.contentView) {
      this.contentView.detached();
    }
  }

  unbind() {
    if (this.contentView) {
      this.contentView.unbind();
    }
  }
};

let ShadowDOM = (_temp3 = _class9 = class ShadowDOM {

  static getSlotName(node) {
    if (node.auSlotAttribute === undefined) {
      return ShadowDOM.defaultSlotKey;
    }

    return node.auSlotAttribute.value;
  }

  static distributeView(view, slots, projectionSource, index, destinationOverride) {
    let nodes;

    if (view === null) {
      nodes = noNodes;
    } else {
      let childNodes = view.fragment.childNodes;
      let ii = childNodes.length;
      nodes = new Array(ii);

      for (let i = 0; i < ii; ++i) {
        nodes[i] = childNodes[i];
      }
    }

    ShadowDOM.distributeNodes(view, nodes, slots, projectionSource, index, destinationOverride);
  }

  static undistributeView(view, slots, projectionSource) {
    for (let slotName in slots) {
      slots[slotName].removeView(view, projectionSource);
    }
  }

  static undistributeAll(slots, projectionSource) {
    for (let slotName in slots) {
      slots[slotName].removeAll(projectionSource);
    }
  }

  static distributeNodes(view, nodes, slots, projectionSource, index, destinationOverride) {
    for (let i = 0, ii = nodes.length; i < ii; ++i) {
      let currentNode = nodes[i];
      let nodeType = currentNode.nodeType;

      if (currentNode.isContentProjectionSource) {
        currentNode.viewSlot.projectTo(slots);

        for (let slotName in slots) {
          slots[slotName].projectFrom(view, currentNode.viewSlot);
        }

        nodes.splice(i, 1);
        ii--;i--;
      } else if (nodeType === 1 || nodeType === 3 || currentNode.viewSlot instanceof PassThroughSlot) {
        if (nodeType === 3 && _isAllWhitespace(currentNode)) {
          nodes.splice(i, 1);
          ii--;i--;
        } else {
          let found = slots[destinationOverride || ShadowDOM.getSlotName(currentNode)];

          if (found) {
            found.addNode(view, currentNode, projectionSource, index);
            nodes.splice(i, 1);
            ii--;i--;
          }
        }
      } else {
        nodes.splice(i, 1);
        ii--;i--;
      }
    }

    for (let slotName in slots) {
      let slot = slots[slotName];

      if (slot.needsFallbackRendering) {
        slot.renderFallbackContent(view, nodes, projectionSource, index);
      }
    }
  }
}, _class9.defaultSlotKey = '__au-default-slot-key__', _temp3);

function register(lookup, name, resource, type) {
  if (!name) {
    return;
  }

  let existing = lookup[name];
  if (existing) {
    if (existing !== resource) {
      throw new Error(`Attempted to register ${type} when one with the same name already exists. Name: ${name}.`);
    }

    return;
  }

  lookup[name] = resource;
}

function validateBehaviorName(name, type) {
  if (/[A-Z]/.test(name)) {
    let newName = _hyphenate(name);
    __WEBPACK_IMPORTED_MODULE_0_aurelia_logging__["getLogger"]('templating').warn(`'${name}' is not a valid ${type} name and has been converted to '${newName}'. Upper-case letters are not allowed because the DOM is not case-sensitive.`);
    return newName;
  }
  return name;
}

const conventionMark = '__au_resource__';

let ViewResources = class ViewResources {
  static convention(target, existing) {
    let resource;

    if (existing && conventionMark in existing) {
      return existing;
    }
    if ('$resource' in target) {
      let config = target.$resource;

      if (typeof config === 'string') {
        resource = existing || new HtmlBehaviorResource();
        resource[conventionMark] = true;
        if (!resource.elementName) {
          resource.elementName = validateBehaviorName(config, 'custom element');
        }
      } else {
        if (typeof config === 'function') {
          config = config.call(target);
        }
        if (typeof config === 'string') {
          config = { name: config };
        }

        config = Object.assign({}, config);

        let resourceType = config.type || 'element';

        let name = config.name;
        switch (resourceType) {
          case 'element':case 'attribute':
            resource = existing || new HtmlBehaviorResource();
            resource[conventionMark] = true;
            if (resourceType === 'element') {
              if (!resource.elementName) {
                resource.elementName = name ? validateBehaviorName(name, 'custom element') : _hyphenate(target.name);
              }
            } else {
              if (!resource.attributeName) {
                resource.attributeName = name ? validateBehaviorName(name, 'custom attribute') : _hyphenate(target.name);
              }
            }
            if ('templateController' in config) {
              config.liftsContent = config.templateController;
              delete config.templateController;
            }
            if ('defaultBindingMode' in config && resource.attributeDefaultBindingMode !== undefined) {
              config.attributeDefaultBindingMode = config.defaultBindingMode;
              delete config.defaultBindingMode;
            }

            delete config.name;

            Object.assign(resource, config);
            break;
          case 'valueConverter':
            resource = new __WEBPACK_IMPORTED_MODULE_5_aurelia_binding__["ValueConverterResource"](__webpack_require__.i(__WEBPACK_IMPORTED_MODULE_5_aurelia_binding__["camelCase"])(name || target.name));
            break;
          case 'bindingBehavior':
            resource = new __WEBPACK_IMPORTED_MODULE_5_aurelia_binding__["BindingBehaviorResource"](__webpack_require__.i(__WEBPACK_IMPORTED_MODULE_5_aurelia_binding__["camelCase"])(name || target.name));
            break;
          case 'viewEngineHooks':
            resource = new ViewEngineHooksResource();
            break;
        }
      }

      if (resource instanceof HtmlBehaviorResource) {
        let bindables = typeof config === 'string' ? undefined : config.bindables;
        let currentProps = resource.properties;
        if (Array.isArray(bindables)) {
          for (let i = 0, ii = bindables.length; ii > i; ++i) {
            let prop = bindables[i];
            if (!prop || typeof prop !== 'string' && !prop.name) {
              throw new Error(`Invalid bindable property at "${i}" for class "${target.name}". Expected either a string or an object with "name" property.`);
            }
            let newProp = new BindableProperty(prop);

            let existed = false;
            for (let j = 0, jj = currentProps.length; jj > j; ++j) {
              if (currentProps[j].name === newProp.name) {
                existed = true;
                break;
              }
            }
            if (existed) {
              continue;
            }
            newProp.registerWith(target, resource);
          }
        }
      }
    }
    return resource;
  }

  constructor(parent, viewUrl) {
    this.bindingLanguage = null;

    this.parent = parent || null;
    this.hasParent = this.parent !== null;
    this.viewUrl = viewUrl || '';
    this.lookupFunctions = {
      valueConverters: this.getValueConverter.bind(this),
      bindingBehaviors: this.getBindingBehavior.bind(this)
    };
    this.attributes = Object.create(null);
    this.elements = Object.create(null);
    this.valueConverters = Object.create(null);
    this.bindingBehaviors = Object.create(null);
    this.attributeMap = Object.create(null);
    this.values = Object.create(null);
    this.beforeCompile = this.afterCompile = this.beforeCreate = this.afterCreate = this.beforeBind = this.beforeUnbind = false;
  }

  _tryAddHook(obj, name) {
    if (typeof obj[name] === 'function') {
      let func = obj[name].bind(obj);
      let counter = 1;
      let callbackName;

      while (this[callbackName = name + counter.toString()] !== undefined) {
        counter++;
      }

      this[name] = true;
      this[callbackName] = func;
    }
  }

  _invokeHook(name, one, two, three, four) {
    if (this.hasParent) {
      this.parent._invokeHook(name, one, two, three, four);
    }

    if (this[name]) {
      this[name + '1'](one, two, three, four);

      let callbackName = name + '2';
      if (this[callbackName]) {
        this[callbackName](one, two, three, four);

        callbackName = name + '3';
        if (this[callbackName]) {
          this[callbackName](one, two, three, four);

          let counter = 4;

          while (this[callbackName = name + counter.toString()] !== undefined) {
            this[callbackName](one, two, three, four);
            counter++;
          }
        }
      }
    }
  }

  registerViewEngineHooks(hooks) {
    this._tryAddHook(hooks, 'beforeCompile');
    this._tryAddHook(hooks, 'afterCompile');
    this._tryAddHook(hooks, 'beforeCreate');
    this._tryAddHook(hooks, 'afterCreate');
    this._tryAddHook(hooks, 'beforeBind');
    this._tryAddHook(hooks, 'beforeUnbind');
  }

  getBindingLanguage(bindingLanguageFallback) {
    return this.bindingLanguage || (this.bindingLanguage = bindingLanguageFallback);
  }

  patchInParent(newParent) {
    let originalParent = this.parent;

    this.parent = newParent || null;
    this.hasParent = this.parent !== null;

    if (newParent.parent === null) {
      newParent.parent = originalParent;
      newParent.hasParent = originalParent !== null;
    }
  }

  relativeToView(path) {
    return __webpack_require__.i(__WEBPACK_IMPORTED_MODULE_4_aurelia_path__["relativeToFile"])(path, this.viewUrl);
  }

  registerElement(tagName, behavior) {
    register(this.elements, tagName, behavior, 'an Element');
  }

  getElement(tagName) {
    return this.elements[tagName] || (this.hasParent ? this.parent.getElement(tagName) : null);
  }

  mapAttribute(attribute) {
    return this.attributeMap[attribute] || (this.hasParent ? this.parent.mapAttribute(attribute) : null);
  }

  registerAttribute(attribute, behavior, knownAttribute) {
    this.attributeMap[attribute] = knownAttribute;
    register(this.attributes, attribute, behavior, 'an Attribute');
  }

  getAttribute(attribute) {
    return this.attributes[attribute] || (this.hasParent ? this.parent.getAttribute(attribute) : null);
  }

  registerValueConverter(name, valueConverter) {
    register(this.valueConverters, name, valueConverter, 'a ValueConverter');
  }

  getValueConverter(name) {
    return this.valueConverters[name] || (this.hasParent ? this.parent.getValueConverter(name) : null);
  }

  registerBindingBehavior(name, bindingBehavior) {
    register(this.bindingBehaviors, name, bindingBehavior, 'a BindingBehavior');
  }

  getBindingBehavior(name) {
    return this.bindingBehaviors[name] || (this.hasParent ? this.parent.getBindingBehavior(name) : null);
  }

  registerValue(name, value) {
    register(this.values, name, value, 'a value');
  }

  getValue(name) {
    return this.values[name] || (this.hasParent ? this.parent.getValue(name) : null);
  }

  autoRegister(container, impl) {
    let resourceTypeMeta = __WEBPACK_IMPORTED_MODULE_1_aurelia_metadata__["metadata"].getOwn(__WEBPACK_IMPORTED_MODULE_1_aurelia_metadata__["metadata"].resource, impl);
    if (resourceTypeMeta) {
      if (resourceTypeMeta instanceof HtmlBehaviorResource) {
        ViewResources.convention(impl, resourceTypeMeta);

        if (resourceTypeMeta.attributeName === null && resourceTypeMeta.elementName === null) {
          HtmlBehaviorResource.convention(impl.name, resourceTypeMeta);
        }
        if (resourceTypeMeta.attributeName === null && resourceTypeMeta.elementName === null) {
          resourceTypeMeta.elementName = _hyphenate(impl.name);
        }
      }
    } else {
      resourceTypeMeta = ViewResources.convention(impl) || HtmlBehaviorResource.convention(impl.name) || __WEBPACK_IMPORTED_MODULE_5_aurelia_binding__["ValueConverterResource"].convention(impl.name) || __WEBPACK_IMPORTED_MODULE_5_aurelia_binding__["BindingBehaviorResource"].convention(impl.name) || ViewEngineHooksResource.convention(impl.name);
      if (!resourceTypeMeta) {
        resourceTypeMeta = new HtmlBehaviorResource();
        resourceTypeMeta.elementName = _hyphenate(impl.name);
      }
      __WEBPACK_IMPORTED_MODULE_1_aurelia_metadata__["metadata"].define(__WEBPACK_IMPORTED_MODULE_1_aurelia_metadata__["metadata"].resource, resourceTypeMeta, impl);
    }
    resourceTypeMeta.initialize(container, impl);
    resourceTypeMeta.register(this);
    return resourceTypeMeta;
  }
};

let View = class View {
  constructor(container, viewFactory, fragment, controllers, bindings, children, slots) {
    this.container = container;
    this.viewFactory = viewFactory;
    this.resources = viewFactory.resources;
    this.fragment = fragment;
    this.firstChild = fragment.firstChild;
    this.lastChild = fragment.lastChild;
    this.controllers = controllers;
    this.bindings = bindings;
    this.children = children;
    this.slots = slots;
    this.hasSlots = false;
    this.fromCache = false;
    this.isBound = false;
    this.isAttached = false;
    this.bindingContext = null;
    this.overrideContext = null;
    this.controller = null;
    this.viewModelScope = null;
    this.animatableElement = undefined;
    this._isUserControlled = false;
    this.contentView = null;

    for (let key in slots) {
      this.hasSlots = true;
      break;
    }
  }

  returnToCache() {
    this.viewFactory.returnViewToCache(this);
  }

  created() {
    let i;
    let ii;
    let controllers = this.controllers;

    for (i = 0, ii = controllers.length; i < ii; ++i) {
      controllers[i].created(this);
    }
  }

  bind(bindingContext, overrideContext, _systemUpdate) {
    let controllers;
    let bindings;
    let children;
    let i;
    let ii;

    if (_systemUpdate && this._isUserControlled) {
      return;
    }

    if (this.isBound) {
      if (this.bindingContext === bindingContext) {
        return;
      }

      this.unbind();
    }

    this.isBound = true;
    this.bindingContext = bindingContext;
    this.overrideContext = overrideContext || __webpack_require__.i(__WEBPACK_IMPORTED_MODULE_5_aurelia_binding__["createOverrideContext"])(bindingContext);

    this.resources._invokeHook('beforeBind', this);

    bindings = this.bindings;
    for (i = 0, ii = bindings.length; i < ii; ++i) {
      bindings[i].bind(this);
    }

    if (this.viewModelScope !== null) {
      bindingContext.bind(this.viewModelScope.bindingContext, this.viewModelScope.overrideContext);
      this.viewModelScope = null;
    }

    controllers = this.controllers;
    for (i = 0, ii = controllers.length; i < ii; ++i) {
      controllers[i].bind(this);
    }

    children = this.children;
    for (i = 0, ii = children.length; i < ii; ++i) {
      children[i].bind(bindingContext, overrideContext, true);
    }

    if (this.hasSlots) {
      ShadowDOM.distributeView(this.contentView, this.slots);
    }
  }

  addBinding(binding) {
    this.bindings.push(binding);

    if (this.isBound) {
      binding.bind(this);
    }
  }

  unbind() {
    let controllers;
    let bindings;
    let children;
    let i;
    let ii;

    if (this.isBound) {
      this.isBound = false;
      this.resources._invokeHook('beforeUnbind', this);

      if (this.controller !== null) {
        this.controller.unbind();
      }

      bindings = this.bindings;
      for (i = 0, ii = bindings.length; i < ii; ++i) {
        bindings[i].unbind();
      }

      controllers = this.controllers;
      for (i = 0, ii = controllers.length; i < ii; ++i) {
        controllers[i].unbind();
      }

      children = this.children;
      for (i = 0, ii = children.length; i < ii; ++i) {
        children[i].unbind();
      }

      this.bindingContext = null;
      this.overrideContext = null;
    }
  }

  insertNodesBefore(refNode) {
    refNode.parentNode.insertBefore(this.fragment, refNode);
  }

  appendNodesTo(parent) {
    parent.appendChild(this.fragment);
  }

  removeNodes() {
    let fragment = this.fragment;
    let current = this.firstChild;
    let end = this.lastChild;
    let next;

    while (current) {
      next = current.nextSibling;
      fragment.appendChild(current);

      if (current === end) {
        break;
      }

      current = next;
    }
  }

  attached() {
    let controllers;
    let children;
    let i;
    let ii;

    if (this.isAttached) {
      return;
    }

    this.isAttached = true;

    if (this.controller !== null) {
      this.controller.attached();
    }

    controllers = this.controllers;
    for (i = 0, ii = controllers.length; i < ii; ++i) {
      controllers[i].attached();
    }

    children = this.children;
    for (i = 0, ii = children.length; i < ii; ++i) {
      children[i].attached();
    }
  }

  detached() {
    let controllers;
    let children;
    let i;
    let ii;

    if (this.isAttached) {
      this.isAttached = false;

      if (this.controller !== null) {
        this.controller.detached();
      }

      controllers = this.controllers;
      for (i = 0, ii = controllers.length; i < ii; ++i) {
        controllers[i].detached();
      }

      children = this.children;
      for (i = 0, ii = children.length; i < ii; ++i) {
        children[i].detached();
      }
    }
  }
};

function getAnimatableElement(view) {
  if (view.animatableElement !== undefined) {
    return view.animatableElement;
  }

  let current = view.firstChild;

  while (current && current.nodeType !== 1) {
    current = current.nextSibling;
  }

  if (current && current.nodeType === 1) {
    return view.animatableElement = current.classList.contains('au-animate') ? current : null;
  }

  return view.animatableElement = null;
}

let ViewSlot = class ViewSlot {
  constructor(anchor, anchorIsContainer, animator = Animator.instance) {
    this.anchor = anchor;
    this.anchorIsContainer = anchorIsContainer;
    this.bindingContext = null;
    this.overrideContext = null;
    this.animator = animator;
    this.children = [];
    this.isBound = false;
    this.isAttached = false;
    this.contentSelectors = null;
    anchor.viewSlot = this;
    anchor.isContentProjectionSource = false;
  }

  animateView(view, direction = 'enter') {
    let animatableElement = getAnimatableElement(view);

    if (animatableElement !== null) {
      switch (direction) {
        case 'enter':
          return this.animator.enter(animatableElement);
        case 'leave':
          return this.animator.leave(animatableElement);
        default:
          throw new Error('Invalid animation direction: ' + direction);
      }
    }
  }

  transformChildNodesIntoView() {
    let parent = this.anchor;

    this.children.push({
      fragment: parent,
      firstChild: parent.firstChild,
      lastChild: parent.lastChild,
      returnToCache() {},
      removeNodes() {
        let last;

        while (last = parent.lastChild) {
          parent.removeChild(last);
        }
      },
      created() {},
      bind() {},
      unbind() {},
      attached() {},
      detached() {}
    });
  }

  bind(bindingContext, overrideContext) {
    let i;
    let ii;
    let children;

    if (this.isBound) {
      if (this.bindingContext === bindingContext) {
        return;
      }

      this.unbind();
    }

    this.isBound = true;
    this.bindingContext = bindingContext = bindingContext || this.bindingContext;
    this.overrideContext = overrideContext = overrideContext || this.overrideContext;

    children = this.children;
    for (i = 0, ii = children.length; i < ii; ++i) {
      children[i].bind(bindingContext, overrideContext, true);
    }
  }

  unbind() {
    if (this.isBound) {
      let i;
      let ii;
      let children = this.children;

      this.isBound = false;
      this.bindingContext = null;
      this.overrideContext = null;

      for (i = 0, ii = children.length; i < ii; ++i) {
        children[i].unbind();
      }
    }
  }

  add(view) {
    if (this.anchorIsContainer) {
      view.appendNodesTo(this.anchor);
    } else {
      view.insertNodesBefore(this.anchor);
    }

    this.children.push(view);

    if (this.isAttached) {
      view.attached();
      return this.animateView(view, 'enter');
    }
  }

  insert(index, view) {
    let children = this.children;
    let length = children.length;

    if (index === 0 && length === 0 || index >= length) {
      return this.add(view);
    }

    view.insertNodesBefore(children[index].firstChild);
    children.splice(index, 0, view);

    if (this.isAttached) {
      view.attached();
      return this.animateView(view, 'enter');
    }
  }

  move(sourceIndex, targetIndex) {
    if (sourceIndex === targetIndex) {
      return;
    }

    const children = this.children;
    const view = children[sourceIndex];

    view.removeNodes();
    view.insertNodesBefore(children[targetIndex].firstChild);
    children.splice(sourceIndex, 1);
    children.splice(targetIndex, 0, view);
  }

  remove(view, returnToCache, skipAnimation) {
    return this.removeAt(this.children.indexOf(view), returnToCache, skipAnimation);
  }

  removeMany(viewsToRemove, returnToCache, skipAnimation) {
    const children = this.children;
    let ii = viewsToRemove.length;
    let i;
    let rmPromises = [];

    viewsToRemove.forEach(child => {
      if (skipAnimation) {
        child.removeNodes();
        return;
      }

      let animation = this.animateView(child, 'leave');
      if (animation) {
        rmPromises.push(animation.then(() => child.removeNodes()));
      } else {
        child.removeNodes();
      }
    });

    let removeAction = () => {
      if (this.isAttached) {
        for (i = 0; i < ii; ++i) {
          viewsToRemove[i].detached();
        }
      }

      if (returnToCache) {
        for (i = 0; i < ii; ++i) {
          viewsToRemove[i].returnToCache();
        }
      }

      for (i = 0; i < ii; ++i) {
        const index = children.indexOf(viewsToRemove[i]);
        if (index >= 0) {
          children.splice(index, 1);
        }
      }
    };

    if (rmPromises.length > 0) {
      return Promise.all(rmPromises).then(() => removeAction());
    }

    return removeAction();
  }

  removeAt(index, returnToCache, skipAnimation) {
    let view = this.children[index];

    let removeAction = () => {
      index = this.children.indexOf(view);
      view.removeNodes();
      this.children.splice(index, 1);

      if (this.isAttached) {
        view.detached();
      }

      if (returnToCache) {
        view.returnToCache();
      }

      return view;
    };

    if (!skipAnimation) {
      let animation = this.animateView(view, 'leave');
      if (animation) {
        return animation.then(() => removeAction());
      }
    }

    return removeAction();
  }

  removeAll(returnToCache, skipAnimation) {
    let children = this.children;
    let ii = children.length;
    let i;
    let rmPromises = [];

    children.forEach(child => {
      if (skipAnimation) {
        child.removeNodes();
        return;
      }

      let animation = this.animateView(child, 'leave');
      if (animation) {
        rmPromises.push(animation.then(() => child.removeNodes()));
      } else {
        child.removeNodes();
      }
    });

    let removeAction = () => {
      if (this.isAttached) {
        for (i = 0; i < ii; ++i) {
          children[i].detached();
        }
      }

      if (returnToCache) {
        for (i = 0; i < ii; ++i) {
          const child = children[i];

          if (child) {
            child.returnToCache();
          }
        }
      }

      this.children = [];
    };

    if (rmPromises.length > 0) {
      return Promise.all(rmPromises).then(() => removeAction());
    }

    return removeAction();
  }

  attached() {
    let i;
    let ii;
    let children;
    let child;

    if (this.isAttached) {
      return;
    }

    this.isAttached = true;

    children = this.children;
    for (i = 0, ii = children.length; i < ii; ++i) {
      child = children[i];
      child.attached();
      this.animateView(child, 'enter');
    }
  }

  detached() {
    let i;
    let ii;
    let children;

    if (this.isAttached) {
      this.isAttached = false;
      children = this.children;
      for (i = 0, ii = children.length; i < ii; ++i) {
        children[i].detached();
      }
    }
  }

  projectTo(slots) {
    this.projectToSlots = slots;
    this.add = this._projectionAdd;
    this.insert = this._projectionInsert;
    this.move = this._projectionMove;
    this.remove = this._projectionRemove;
    this.removeAt = this._projectionRemoveAt;
    this.removeMany = this._projectionRemoveMany;
    this.removeAll = this._projectionRemoveAll;
    this.children.forEach(view => ShadowDOM.distributeView(view, slots, this));
  }

  _projectionAdd(view) {
    ShadowDOM.distributeView(view, this.projectToSlots, this);

    this.children.push(view);

    if (this.isAttached) {
      view.attached();
    }
  }

  _projectionInsert(index, view) {
    if (index === 0 && !this.children.length || index >= this.children.length) {
      this.add(view);
    } else {
      ShadowDOM.distributeView(view, this.projectToSlots, this, index);

      this.children.splice(index, 0, view);

      if (this.isAttached) {
        view.attached();
      }
    }
  }

  _projectionMove(sourceIndex, targetIndex) {
    if (sourceIndex === targetIndex) {
      return;
    }

    const children = this.children;
    const view = children[sourceIndex];

    ShadowDOM.undistributeView(view, this.projectToSlots, this);
    ShadowDOM.distributeView(view, this.projectToSlots, this, targetIndex);

    children.splice(sourceIndex, 1);
    children.splice(targetIndex, 0, view);
  }

  _projectionRemove(view, returnToCache) {
    ShadowDOM.undistributeView(view, this.projectToSlots, this);
    this.children.splice(this.children.indexOf(view), 1);

    if (this.isAttached) {
      view.detached();
    }
    if (returnToCache) {
      view.returnToCache();
    }
  }

  _projectionRemoveAt(index, returnToCache) {
    let view = this.children[index];

    ShadowDOM.undistributeView(view, this.projectToSlots, this);
    this.children.splice(index, 1);

    if (this.isAttached) {
      view.detached();
    }
    if (returnToCache) {
      view.returnToCache();
    }
  }

  _projectionRemoveMany(viewsToRemove, returnToCache) {
    viewsToRemove.forEach(view => this.remove(view, returnToCache));
  }

  _projectionRemoveAll(returnToCache) {
    ShadowDOM.undistributeAll(this.projectToSlots, this);

    let children = this.children;
    let ii = children.length;

    for (let i = 0; i < ii; ++i) {
      if (returnToCache) {
        children[i].returnToCache();
      } else if (this.isAttached) {
        children[i].detached();
      }
    }

    this.children = [];
  }
};

let ProviderResolver = __webpack_require__.i(__WEBPACK_IMPORTED_MODULE_6_aurelia_dependency_injection__["resolver"])(_class11 = class ProviderResolver {
  get(container, key) {
    let id = key.__providerId__;
    return id in container ? container[id] : container[id] = container.invoke(key);
  }
}) || _class11;

let providerResolverInstance = new ProviderResolver();

function elementContainerGet(key) {
  if (key === __WEBPACK_IMPORTED_MODULE_2_aurelia_pal__["DOM"].Element) {
    return this.element;
  }

  if (key === BoundViewFactory) {
    if (this.boundViewFactory) {
      return this.boundViewFactory;
    }

    let factory = this.instruction.viewFactory;
    let partReplacements = this.partReplacements;

    if (partReplacements) {
      factory = partReplacements[factory.part] || factory;
    }

    this.boundViewFactory = new BoundViewFactory(this, factory, partReplacements);
    return this.boundViewFactory;
  }

  if (key === ViewSlot) {
    if (this.viewSlot === undefined) {
      this.viewSlot = new ViewSlot(this.element, this.instruction.anchorIsContainer);
      this.element.isContentProjectionSource = this.instruction.lifting;
      this.children.push(this.viewSlot);
    }

    return this.viewSlot;
  }

  if (key === ElementEvents) {
    return this.elementEvents || (this.elementEvents = new ElementEvents(this.element));
  }

  if (key === CompositionTransaction) {
    return this.compositionTransaction || (this.compositionTransaction = this.parent.get(key));
  }

  if (key === ViewResources) {
    return this.viewResources;
  }

  if (key === TargetInstruction) {
    return this.instruction;
  }

  return this.superGet(key);
}

function createElementContainer(parent, element, instruction, children, partReplacements, resources) {
  let container = parent.createChild();
  let providers;
  let i;

  container.element = element;
  container.instruction = instruction;
  container.children = children;
  container.viewResources = resources;
  container.partReplacements = partReplacements;

  providers = instruction.providers;
  i = providers.length;

  while (i--) {
    container._resolvers.set(providers[i], providerResolverInstance);
  }

  container.superGet = container.get;
  container.get = elementContainerGet;

  return container;
}

function hasAttribute(name) {
  return this._element.hasAttribute(name);
}

function getAttribute(name) {
  return this._element.getAttribute(name);
}

function setAttribute(name, value) {
  this._element.setAttribute(name, value);
}

function makeElementIntoAnchor(element, elementInstruction) {
  let anchor = __WEBPACK_IMPORTED_MODULE_2_aurelia_pal__["DOM"].createComment('anchor');

  if (elementInstruction) {
    let firstChild = element.firstChild;

    if (firstChild && firstChild.tagName === 'AU-CONTENT') {
      anchor.contentElement = firstChild;
    }

    anchor._element = element;

    anchor.hasAttribute = hasAttribute;
    anchor.getAttribute = getAttribute;
    anchor.setAttribute = setAttribute;
  }

  __WEBPACK_IMPORTED_MODULE_2_aurelia_pal__["DOM"].replaceNode(anchor, element);

  return anchor;
}

function applyInstructions(containers, element, instruction, controllers, bindings, children, shadowSlots, partReplacements, resources) {
  let behaviorInstructions = instruction.behaviorInstructions;
  let expressions = instruction.expressions;
  let elementContainer;
  let i;
  let ii;
  let current;
  let instance;

  if (instruction.contentExpression) {
    bindings.push(instruction.contentExpression.createBinding(element.nextSibling));
    element.nextSibling.auInterpolationTarget = true;
    element.parentNode.removeChild(element);
    return;
  }

  if (instruction.shadowSlot) {
    let commentAnchor = __WEBPACK_IMPORTED_MODULE_2_aurelia_pal__["DOM"].createComment('slot');
    let slot;

    if (instruction.slotDestination) {
      slot = new PassThroughSlot(commentAnchor, instruction.slotName, instruction.slotDestination, instruction.slotFallbackFactory);
    } else {
      slot = new ShadowSlot(commentAnchor, instruction.slotName, instruction.slotFallbackFactory);
    }

    __WEBPACK_IMPORTED_MODULE_2_aurelia_pal__["DOM"].replaceNode(commentAnchor, element);
    shadowSlots[instruction.slotName] = slot;
    controllers.push(slot);
    return;
  }

  if (instruction.letElement) {
    for (i = 0, ii = expressions.length; i < ii; ++i) {
      bindings.push(expressions[i].createBinding());
    }
    element.parentNode.removeChild(element);
    return;
  }

  if (behaviorInstructions.length) {
    if (!instruction.anchorIsContainer) {
      element = makeElementIntoAnchor(element, instruction.elementInstruction);
    }

    containers[instruction.injectorId] = elementContainer = createElementContainer(containers[instruction.parentInjectorId], element, instruction, children, partReplacements, resources);

    for (i = 0, ii = behaviorInstructions.length; i < ii; ++i) {
      current = behaviorInstructions[i];
      instance = current.type.create(elementContainer, current, element, bindings);
      controllers.push(instance);
    }
  }

  for (i = 0, ii = expressions.length; i < ii; ++i) {
    bindings.push(expressions[i].createBinding(element));
  }
}

function styleStringToObject(style, target) {
  let attributes = style.split(';');
  let firstIndexOfColon;
  let i;
  let current;
  let key;
  let value;

  target = target || {};

  for (i = 0; i < attributes.length; i++) {
    current = attributes[i];
    firstIndexOfColon = current.indexOf(':');
    key = current.substring(0, firstIndexOfColon).trim();
    value = current.substring(firstIndexOfColon + 1).trim();
    target[key] = value;
  }

  return target;
}

function styleObjectToString(obj) {
  let result = '';

  for (let key in obj) {
    result += key + ':' + obj[key] + ';';
  }

  return result;
}

function applySurrogateInstruction(container, element, instruction, controllers, bindings, children) {
  let behaviorInstructions = instruction.behaviorInstructions;
  let expressions = instruction.expressions;
  let providers = instruction.providers;
  let values = instruction.values;
  let i;
  let ii;
  let current;
  let instance;
  let currentAttributeValue;

  i = providers.length;
  while (i--) {
    container._resolvers.set(providers[i], providerResolverInstance);
  }

  for (let key in values) {
    currentAttributeValue = element.getAttribute(key);

    if (currentAttributeValue) {
      if (key === 'class') {
        element.setAttribute('class', currentAttributeValue + ' ' + values[key]);
      } else if (key === 'style') {
        let styleObject = styleStringToObject(values[key]);
        styleStringToObject(currentAttributeValue, styleObject);
        element.setAttribute('style', styleObjectToString(styleObject));
      }
    } else {
      element.setAttribute(key, values[key]);
    }
  }

  if (behaviorInstructions.length) {
    for (i = 0, ii = behaviorInstructions.length; i < ii; ++i) {
      current = behaviorInstructions[i];
      instance = current.type.create(container, current, element, bindings);

      if (instance.contentView) {
        children.push(instance.contentView);
      }

      controllers.push(instance);
    }
  }

  for (i = 0, ii = expressions.length; i < ii; ++i) {
    bindings.push(expressions[i].createBinding(element));
  }
}

let BoundViewFactory = class BoundViewFactory {
  constructor(parentContainer, viewFactory, partReplacements) {
    this.parentContainer = parentContainer;
    this.viewFactory = viewFactory;
    this.factoryCreateInstruction = { partReplacements: partReplacements };
  }

  create() {
    let view = this.viewFactory.create(this.parentContainer.createChild(), this.factoryCreateInstruction);
    view._isUserControlled = true;
    return view;
  }

  get isCaching() {
    return this.viewFactory.isCaching;
  }

  setCacheSize(size, doNotOverrideIfAlreadySet) {
    this.viewFactory.setCacheSize(size, doNotOverrideIfAlreadySet);
  }

  getCachedView() {
    return this.viewFactory.getCachedView();
  }

  returnViewToCache(view) {
    this.viewFactory.returnViewToCache(view);
  }
};

let ViewFactory = class ViewFactory {
  constructor(template, instructions, resources) {
    this.isCaching = false;

    this.template = template;
    this.instructions = instructions;
    this.resources = resources;
    this.cacheSize = -1;
    this.cache = null;
  }

  setCacheSize(size, doNotOverrideIfAlreadySet) {
    if (size) {
      if (size === '*') {
        size = Number.MAX_VALUE;
      } else if (typeof size === 'string') {
        size = parseInt(size, 10);
      }
    }

    if (this.cacheSize === -1 || !doNotOverrideIfAlreadySet) {
      this.cacheSize = size;
    }

    if (this.cacheSize > 0) {
      this.cache = [];
    } else {
      this.cache = null;
    }

    this.isCaching = this.cacheSize > 0;
  }

  getCachedView() {
    return this.cache !== null ? this.cache.pop() || null : null;
  }

  returnViewToCache(view) {
    if (view.isAttached) {
      view.detached();
    }

    if (view.isBound) {
      view.unbind();
    }

    if (this.cache !== null && this.cache.length < this.cacheSize) {
      view.fromCache = true;
      this.cache.push(view);
    }
  }

  create(container, createInstruction, element) {
    createInstruction = createInstruction || BehaviorInstruction.normal;

    let cachedView = this.getCachedView();
    if (cachedView !== null) {
      return cachedView;
    }

    let fragment = createInstruction.enhance ? this.template : this.template.cloneNode(true);
    let instructables = fragment.querySelectorAll('.au-target');
    let instructions = this.instructions;
    let resources = this.resources;
    let controllers = [];
    let bindings = [];
    let children = [];
    let shadowSlots = Object.create(null);
    let containers = { root: container };
    let partReplacements = createInstruction.partReplacements;
    let i;
    let ii;
    let view;
    let instructable;
    let instruction;

    this.resources._invokeHook('beforeCreate', this, container, fragment, createInstruction);

    if (element && this.surrogateInstruction !== null) {
      applySurrogateInstruction(container, element, this.surrogateInstruction, controllers, bindings, children);
    }

    if (createInstruction.enhance && fragment.hasAttribute('au-target-id')) {
      instructable = fragment;
      instruction = instructions[instructable.getAttribute('au-target-id')];
      applyInstructions(containers, instructable, instruction, controllers, bindings, children, shadowSlots, partReplacements, resources);
    }

    for (i = 0, ii = instructables.length; i < ii; ++i) {
      instructable = instructables[i];
      instruction = instructions[instructable.getAttribute('au-target-id')];
      applyInstructions(containers, instructable, instruction, controllers, bindings, children, shadowSlots, partReplacements, resources);
    }

    view = new View(container, this, fragment, controllers, bindings, children, shadowSlots);

    if (!createInstruction.initiatedByBehavior) {
      view.created();
    }

    this.resources._invokeHook('afterCreate', view);

    return view;
  }
};

let nextInjectorId = 0;
function getNextInjectorId() {
  return ++nextInjectorId;
}

let lastAUTargetID = 0;
function getNextAUTargetID() {
  return (++lastAUTargetID).toString();
}

function makeIntoInstructionTarget(element) {
  let value = element.getAttribute('class');
  let auTargetID = getNextAUTargetID();

  element.setAttribute('class', value ? value + ' au-target' : 'au-target');
  element.setAttribute('au-target-id', auTargetID);

  return auTargetID;
}

function makeShadowSlot(compiler, resources, node, instructions, parentInjectorId) {
  let auShadowSlot = __WEBPACK_IMPORTED_MODULE_2_aurelia_pal__["DOM"].createElement('au-shadow-slot');
  __WEBPACK_IMPORTED_MODULE_2_aurelia_pal__["DOM"].replaceNode(auShadowSlot, node);

  let auTargetID = makeIntoInstructionTarget(auShadowSlot);
  let instruction = TargetInstruction.shadowSlot(parentInjectorId);

  instruction.slotName = node.getAttribute('name') || ShadowDOM.defaultSlotKey;
  instruction.slotDestination = node.getAttribute('slot');

  if (node.innerHTML.trim()) {
    let fragment = __WEBPACK_IMPORTED_MODULE_2_aurelia_pal__["DOM"].createDocumentFragment();
    let child;

    while (child = node.firstChild) {
      fragment.appendChild(child);
    }

    instruction.slotFallbackFactory = compiler.compile(fragment, resources);
  }

  instructions[auTargetID] = instruction;

  return auShadowSlot;
}

const defaultLetHandler = BindingLanguage.prototype.createLetExpressions;

let ViewCompiler = (_dec7 = __webpack_require__.i(__WEBPACK_IMPORTED_MODULE_6_aurelia_dependency_injection__["inject"])(BindingLanguage, ViewResources), _dec7(_class13 = class ViewCompiler {
  constructor(bindingLanguage, resources) {
    this.bindingLanguage = bindingLanguage;
    this.resources = resources;
  }

  compile(source, resources, compileInstruction) {
    resources = resources || this.resources;
    compileInstruction = compileInstruction || ViewCompileInstruction.normal;
    source = typeof source === 'string' ? __WEBPACK_IMPORTED_MODULE_2_aurelia_pal__["DOM"].createTemplateFromMarkup(source) : source;

    let content;
    let part;
    let cacheSize;

    if (source.content) {
      part = source.getAttribute('part');
      cacheSize = source.getAttribute('view-cache');
      content = __WEBPACK_IMPORTED_MODULE_2_aurelia_pal__["DOM"].adoptNode(source.content);
    } else {
      content = source;
    }

    compileInstruction.targetShadowDOM = compileInstruction.targetShadowDOM && __WEBPACK_IMPORTED_MODULE_2_aurelia_pal__["FEATURE"].shadowDOM;
    resources._invokeHook('beforeCompile', content, resources, compileInstruction);

    let instructions = {};
    this._compileNode(content, resources, instructions, source, 'root', !compileInstruction.targetShadowDOM);

    let firstChild = content.firstChild;
    if (firstChild && firstChild.nodeType === 1) {
      let targetId = firstChild.getAttribute('au-target-id');
      if (targetId) {
        let ins = instructions[targetId];

        if (ins.shadowSlot || ins.lifting || ins.elementInstruction && !ins.elementInstruction.anchorIsContainer) {
          content.insertBefore(__WEBPACK_IMPORTED_MODULE_2_aurelia_pal__["DOM"].createComment('view'), firstChild);
        }
      }
    }

    let factory = new ViewFactory(content, instructions, resources);

    factory.surrogateInstruction = compileInstruction.compileSurrogate ? this._compileSurrogate(source, resources) : null;
    factory.part = part;

    if (cacheSize) {
      factory.setCacheSize(cacheSize);
    }

    resources._invokeHook('afterCompile', factory);

    return factory;
  }

  _compileNode(node, resources, instructions, parentNode, parentInjectorId, targetLightDOM) {
    switch (node.nodeType) {
      case 1:
        return this._compileElement(node, resources, instructions, parentNode, parentInjectorId, targetLightDOM);
      case 3:
        let expression = resources.getBindingLanguage(this.bindingLanguage).inspectTextContent(resources, node.wholeText);
        if (expression) {
          let marker = __WEBPACK_IMPORTED_MODULE_2_aurelia_pal__["DOM"].createElement('au-marker');
          let auTargetID = makeIntoInstructionTarget(marker);
          (node.parentNode || parentNode).insertBefore(marker, node);
          node.textContent = ' ';
          instructions[auTargetID] = TargetInstruction.contentExpression(expression);

          while (node.nextSibling && node.nextSibling.nodeType === 3) {
            (node.parentNode || parentNode).removeChild(node.nextSibling);
          }
        } else {
          while (node.nextSibling && node.nextSibling.nodeType === 3) {
            node = node.nextSibling;
          }
        }
        return node.nextSibling;
      case 11:
        let currentChild = node.firstChild;
        while (currentChild) {
          currentChild = this._compileNode(currentChild, resources, instructions, node, parentInjectorId, targetLightDOM);
        }
        break;
      default:
        break;
    }

    return node.nextSibling;
  }

  _compileSurrogate(node, resources) {
    let tagName = node.tagName.toLowerCase();
    let attributes = node.attributes;
    let bindingLanguage = resources.getBindingLanguage(this.bindingLanguage);
    let knownAttribute;
    let property;
    let instruction;
    let i;
    let ii;
    let attr;
    let attrName;
    let attrValue;
    let info;
    let type;
    let expressions = [];
    let expression;
    let behaviorInstructions = [];
    let values = {};
    let hasValues = false;
    let providers = [];

    for (i = 0, ii = attributes.length; i < ii; ++i) {
      attr = attributes[i];
      attrName = attr.name;
      attrValue = attr.value;

      info = bindingLanguage.inspectAttribute(resources, tagName, attrName, attrValue);
      type = resources.getAttribute(info.attrName);

      if (type) {
        knownAttribute = resources.mapAttribute(info.attrName);
        if (knownAttribute) {
          property = type.attributes[knownAttribute];

          if (property) {
            info.defaultBindingMode = property.defaultBindingMode;

            if (!info.command && !info.expression) {
              info.command = property.hasOptions ? 'options' : null;
            }

            if (info.command && info.command !== 'options' && type.primaryProperty) {
              const primaryProperty = type.primaryProperty;
              attrName = info.attrName = primaryProperty.attribute;

              info.defaultBindingMode = primaryProperty.defaultBindingMode;
            }
          }
        }
      }

      instruction = bindingLanguage.createAttributeInstruction(resources, node, info, undefined, type);

      if (instruction) {
        if (instruction.alteredAttr) {
          type = resources.getAttribute(instruction.attrName);
        }

        if (instruction.discrete) {
          expressions.push(instruction);
        } else {
          if (type) {
            instruction.type = type;
            this._configureProperties(instruction, resources);

            if (type.liftsContent) {
              throw new Error('You cannot place a template controller on a surrogate element.');
            } else {
              behaviorInstructions.push(instruction);
            }
          } else {
            expressions.push(instruction.attributes[instruction.attrName]);
          }
        }
      } else {
        if (type) {
          instruction = BehaviorInstruction.attribute(attrName, type);
          instruction.attributes[resources.mapAttribute(attrName)] = attrValue;

          if (type.liftsContent) {
            throw new Error('You cannot place a template controller on a surrogate element.');
          } else {
            behaviorInstructions.push(instruction);
          }
        } else if (attrName !== 'id' && attrName !== 'part' && attrName !== 'replace-part') {
          hasValues = true;
          values[attrName] = attrValue;
        }
      }
    }

    if (expressions.length || behaviorInstructions.length || hasValues) {
      for (i = 0, ii = behaviorInstructions.length; i < ii; ++i) {
        instruction = behaviorInstructions[i];
        instruction.type.compile(this, resources, node, instruction);
        providers.push(instruction.type.target);
      }

      for (i = 0, ii = expressions.length; i < ii; ++i) {
        expression = expressions[i];
        if (expression.attrToRemove !== undefined) {
          node.removeAttribute(expression.attrToRemove);
        }
      }

      return TargetInstruction.surrogate(providers, behaviorInstructions, expressions, values);
    }

    return null;
  }

  _compileElement(node, resources, instructions, parentNode, parentInjectorId, targetLightDOM) {
    let tagName = node.tagName.toLowerCase();
    let attributes = node.attributes;
    let expressions = [];
    let expression;
    let behaviorInstructions = [];
    let providers = [];
    let bindingLanguage = resources.getBindingLanguage(this.bindingLanguage);
    let liftingInstruction;
    let viewFactory;
    let type;
    let elementInstruction;
    let elementProperty;
    let i;
    let ii;
    let attr;
    let attrName;
    let attrValue;
    let originalAttrName;
    let instruction;
    let info;
    let property;
    let knownAttribute;
    let auTargetID;
    let injectorId;

    if (tagName === 'slot') {
      if (targetLightDOM) {
        node = makeShadowSlot(this, resources, node, instructions, parentInjectorId);
      }
      return node.nextSibling;
    } else if (tagName === 'template') {
      if (!('content' in node)) {
        throw new Error('You cannot place a template element within ' + node.namespaceURI + ' namespace');
      }
      viewFactory = this.compile(node, resources);
      viewFactory.part = node.getAttribute('part');
    } else {
      type = resources.getElement(node.getAttribute('as-element') || tagName);

      if (tagName === 'let' && !type && bindingLanguage.createLetExpressions !== defaultLetHandler) {
        expressions = bindingLanguage.createLetExpressions(resources, node);
        auTargetID = makeIntoInstructionTarget(node);
        instructions[auTargetID] = TargetInstruction.letElement(expressions);
        return node.nextSibling;
      }
      if (type) {
        elementInstruction = BehaviorInstruction.element(node, type);
        type.processAttributes(this, resources, node, attributes, elementInstruction);
        behaviorInstructions.push(elementInstruction);
      }
    }

    for (i = 0, ii = attributes.length; i < ii; ++i) {
      attr = attributes[i];
      originalAttrName = attrName = attr.name;
      attrValue = attr.value;
      info = bindingLanguage.inspectAttribute(resources, tagName, attrName, attrValue);

      if (targetLightDOM && info.attrName === 'slot') {
        info.attrName = attrName = 'au-slot';
      }

      type = resources.getAttribute(info.attrName);
      elementProperty = null;

      if (type) {
        knownAttribute = resources.mapAttribute(info.attrName);
        if (knownAttribute) {
          property = type.attributes[knownAttribute];

          if (property) {
            info.defaultBindingMode = property.defaultBindingMode;

            if (!info.command && !info.expression) {
              info.command = property.hasOptions ? 'options' : null;
            }

            if (info.command && info.command !== 'options' && type.primaryProperty) {
              const primaryProperty = type.primaryProperty;
              attrName = info.attrName = primaryProperty.attribute;

              info.defaultBindingMode = primaryProperty.defaultBindingMode;
            }
          }
        }
      } else if (elementInstruction) {
        elementProperty = elementInstruction.type.attributes[info.attrName];
        if (elementProperty) {
          info.defaultBindingMode = elementProperty.defaultBindingMode;
        }
      }

      if (elementProperty) {
        instruction = bindingLanguage.createAttributeInstruction(resources, node, info, elementInstruction);
      } else {
        instruction = bindingLanguage.createAttributeInstruction(resources, node, info, undefined, type);
      }

      if (instruction) {
        if (instruction.alteredAttr) {
          type = resources.getAttribute(instruction.attrName);
        }

        if (instruction.discrete) {
          expressions.push(instruction);
        } else {
          if (type) {
            instruction.type = type;
            this._configureProperties(instruction, resources);

            if (type.liftsContent) {
              instruction.originalAttrName = originalAttrName;
              liftingInstruction = instruction;
              break;
            } else {
              behaviorInstructions.push(instruction);
            }
          } else if (elementProperty) {
            elementInstruction.attributes[info.attrName].targetProperty = elementProperty.name;
          } else {
            expressions.push(instruction.attributes[instruction.attrName]);
          }
        }
      } else {
        if (type) {
          instruction = BehaviorInstruction.attribute(attrName, type);
          instruction.attributes[resources.mapAttribute(attrName)] = attrValue;

          if (type.liftsContent) {
            instruction.originalAttrName = originalAttrName;
            liftingInstruction = instruction;
            break;
          } else {
            behaviorInstructions.push(instruction);
          }
        } else if (elementProperty) {
          elementInstruction.attributes[attrName] = attrValue;
        }
      }
    }

    if (liftingInstruction) {
      liftingInstruction.viewFactory = viewFactory;
      node = liftingInstruction.type.compile(this, resources, node, liftingInstruction, parentNode);
      auTargetID = makeIntoInstructionTarget(node);
      instructions[auTargetID] = TargetInstruction.lifting(parentInjectorId, liftingInstruction);
    } else {
      let skipContentProcessing = false;

      if (expressions.length || behaviorInstructions.length) {
        injectorId = behaviorInstructions.length ? getNextInjectorId() : false;

        for (i = 0, ii = behaviorInstructions.length; i < ii; ++i) {
          instruction = behaviorInstructions[i];
          instruction.type.compile(this, resources, node, instruction, parentNode);
          providers.push(instruction.type.target);
          skipContentProcessing = skipContentProcessing || instruction.skipContentProcessing;
        }

        for (i = 0, ii = expressions.length; i < ii; ++i) {
          expression = expressions[i];
          if (expression.attrToRemove !== undefined) {
            node.removeAttribute(expression.attrToRemove);
          }
        }

        auTargetID = makeIntoInstructionTarget(node);
        instructions[auTargetID] = TargetInstruction.normal(injectorId, parentInjectorId, providers, behaviorInstructions, expressions, elementInstruction);
      }

      if (skipContentProcessing) {
        return node.nextSibling;
      }

      let currentChild = node.firstChild;
      while (currentChild) {
        currentChild = this._compileNode(currentChild, resources, instructions, node, injectorId || parentInjectorId, targetLightDOM);
      }
    }

    return node.nextSibling;
  }

  _configureProperties(instruction, resources) {
    let type = instruction.type;
    let attrName = instruction.attrName;
    let attributes = instruction.attributes;
    let property;
    let key;
    let value;

    let knownAttribute = resources.mapAttribute(attrName);
    if (knownAttribute && attrName in attributes && knownAttribute !== attrName) {
      attributes[knownAttribute] = attributes[attrName];
      delete attributes[attrName];
    }

    for (key in attributes) {
      value = attributes[key];

      if (value !== null && typeof value === 'object') {
        property = type.attributes[key];

        if (property !== undefined) {
          value.targetProperty = property.name;
        } else {
          value.targetProperty = key;
        }
      }
    }
  }
}) || _class13);

let ResourceModule = class ResourceModule {
  constructor(moduleId) {
    this.id = moduleId;
    this.moduleInstance = null;
    this.mainResource = null;
    this.resources = null;
    this.viewStrategy = null;
    this.isInitialized = false;
    this.onLoaded = null;
    this.loadContext = null;
  }

  initialize(container) {
    let current = this.mainResource;
    let resources = this.resources;
    let vs = this.viewStrategy;

    if (this.isInitialized) {
      return;
    }

    this.isInitialized = true;

    if (current !== undefined) {
      current.metadata.viewStrategy = vs;
      current.initialize(container);
    }

    for (let i = 0, ii = resources.length; i < ii; ++i) {
      current = resources[i];
      current.metadata.viewStrategy = vs;
      current.initialize(container);
    }
  }

  register(registry, name) {
    let main = this.mainResource;
    let resources = this.resources;

    if (main !== undefined) {
      main.register(registry, name);
      name = null;
    }

    for (let i = 0, ii = resources.length; i < ii; ++i) {
      resources[i].register(registry, name);
      name = null;
    }
  }

  load(container, loadContext) {
    if (this.onLoaded !== null) {
      return this.loadContext === loadContext ? Promise.resolve() : this.onLoaded;
    }

    let main = this.mainResource;
    let resources = this.resources;
    let loads;

    if (main !== undefined) {
      loads = new Array(resources.length + 1);
      loads[0] = main.load(container, loadContext);
      for (let i = 0, ii = resources.length; i < ii; ++i) {
        loads[i + 1] = resources[i].load(container, loadContext);
      }
    } else {
      loads = new Array(resources.length);
      for (let i = 0, ii = resources.length; i < ii; ++i) {
        loads[i] = resources[i].load(container, loadContext);
      }
    }

    this.loadContext = loadContext;
    this.onLoaded = Promise.all(loads);
    return this.onLoaded;
  }
};

let ResourceDescription = class ResourceDescription {
  constructor(key, exportedValue, resourceTypeMeta) {
    if (!resourceTypeMeta) {
      resourceTypeMeta = __WEBPACK_IMPORTED_MODULE_1_aurelia_metadata__["metadata"].get(__WEBPACK_IMPORTED_MODULE_1_aurelia_metadata__["metadata"].resource, exportedValue);

      if (!resourceTypeMeta) {
        resourceTypeMeta = new HtmlBehaviorResource();
        resourceTypeMeta.elementName = _hyphenate(key);
        __WEBPACK_IMPORTED_MODULE_1_aurelia_metadata__["metadata"].define(__WEBPACK_IMPORTED_MODULE_1_aurelia_metadata__["metadata"].resource, resourceTypeMeta, exportedValue);
      }
    }

    if (resourceTypeMeta instanceof HtmlBehaviorResource) {
      if (resourceTypeMeta.elementName === undefined) {
        resourceTypeMeta.elementName = _hyphenate(key);
      } else if (resourceTypeMeta.attributeName === undefined) {
        resourceTypeMeta.attributeName = _hyphenate(key);
      } else if (resourceTypeMeta.attributeName === null && resourceTypeMeta.elementName === null) {
        HtmlBehaviorResource.convention(key, resourceTypeMeta);
      }
    } else if (!resourceTypeMeta.name) {
      resourceTypeMeta.name = _hyphenate(key);
    }

    this.metadata = resourceTypeMeta;
    this.value = exportedValue;
  }

  initialize(container) {
    this.metadata.initialize(container, this.value);
  }

  register(registry, name) {
    this.metadata.register(registry, name);
  }

  load(container, loadContext) {
    return this.metadata.load(container, this.value, loadContext);
  }
};

let ModuleAnalyzer = class ModuleAnalyzer {
  constructor() {
    this.cache = Object.create(null);
  }

  getAnalysis(moduleId) {
    return this.cache[moduleId];
  }

  analyze(moduleId, moduleInstance, mainResourceKey) {
    let mainResource;
    let fallbackValue;
    let fallbackKey;
    let resourceTypeMeta;
    let key;
    let exportedValue;
    let resources = [];
    let conventional;
    let vs;
    let resourceModule;

    resourceModule = this.cache[moduleId];
    if (resourceModule) {
      return resourceModule;
    }

    resourceModule = new ResourceModule(moduleId);
    this.cache[moduleId] = resourceModule;

    if (typeof moduleInstance === 'function') {
      moduleInstance = { 'default': moduleInstance };
    }

    if (mainResourceKey) {
      mainResource = new ResourceDescription(mainResourceKey, moduleInstance[mainResourceKey]);
    }

    for (key in moduleInstance) {
      exportedValue = moduleInstance[key];

      if (key === mainResourceKey || typeof exportedValue !== 'function') {
        continue;
      }

      resourceTypeMeta = __WEBPACK_IMPORTED_MODULE_1_aurelia_metadata__["metadata"].get(__WEBPACK_IMPORTED_MODULE_1_aurelia_metadata__["metadata"].resource, exportedValue);

      if (resourceTypeMeta) {
        if (resourceTypeMeta instanceof HtmlBehaviorResource) {
          ViewResources.convention(exportedValue, resourceTypeMeta);

          if (resourceTypeMeta.attributeName === null && resourceTypeMeta.elementName === null) {
            HtmlBehaviorResource.convention(key, resourceTypeMeta);
          }

          if (resourceTypeMeta.attributeName === null && resourceTypeMeta.elementName === null) {
            resourceTypeMeta.elementName = _hyphenate(key);
          }
        }

        if (!mainResource && resourceTypeMeta instanceof HtmlBehaviorResource && resourceTypeMeta.elementName !== null) {
          mainResource = new ResourceDescription(key, exportedValue, resourceTypeMeta);
        } else {
          resources.push(new ResourceDescription(key, exportedValue, resourceTypeMeta));
        }
      } else if (viewStrategy.decorates(exportedValue)) {
        vs = exportedValue;
      } else if (exportedValue instanceof __WEBPACK_IMPORTED_MODULE_3_aurelia_loader__["TemplateRegistryEntry"]) {
        vs = new TemplateRegistryViewStrategy(moduleId, exportedValue);
      } else {
        if (conventional = ViewResources.convention(exportedValue)) {
          if (conventional.elementName !== null && !mainResource) {
            mainResource = new ResourceDescription(key, exportedValue, conventional);
          } else {
            resources.push(new ResourceDescription(key, exportedValue, conventional));
          }
          __WEBPACK_IMPORTED_MODULE_1_aurelia_metadata__["metadata"].define(__WEBPACK_IMPORTED_MODULE_1_aurelia_metadata__["metadata"].resource, conventional, exportedValue);
        } else if (conventional = HtmlBehaviorResource.convention(key)) {
          if (conventional.elementName !== null && !mainResource) {
            mainResource = new ResourceDescription(key, exportedValue, conventional);
          } else {
            resources.push(new ResourceDescription(key, exportedValue, conventional));
          }

          __WEBPACK_IMPORTED_MODULE_1_aurelia_metadata__["metadata"].define(__WEBPACK_IMPORTED_MODULE_1_aurelia_metadata__["metadata"].resource, conventional, exportedValue);
        } else if (conventional = __WEBPACK_IMPORTED_MODULE_5_aurelia_binding__["ValueConverterResource"].convention(key) || __WEBPACK_IMPORTED_MODULE_5_aurelia_binding__["BindingBehaviorResource"].convention(key) || ViewEngineHooksResource.convention(key)) {
          resources.push(new ResourceDescription(key, exportedValue, conventional));
          __WEBPACK_IMPORTED_MODULE_1_aurelia_metadata__["metadata"].define(__WEBPACK_IMPORTED_MODULE_1_aurelia_metadata__["metadata"].resource, conventional, exportedValue);
        } else if (!fallbackValue) {
          fallbackValue = exportedValue;
          fallbackKey = key;
        }
      }
    }

    if (!mainResource && fallbackValue) {
      mainResource = new ResourceDescription(fallbackKey, fallbackValue);
    }

    resourceModule.moduleInstance = moduleInstance;
    resourceModule.mainResource = mainResource;
    resourceModule.resources = resources;
    resourceModule.viewStrategy = vs;

    return resourceModule;
  }
};

let logger = __WEBPACK_IMPORTED_MODULE_0_aurelia_logging__["getLogger"]('templating');

function ensureRegistryEntry(loader, urlOrRegistryEntry) {
  if (urlOrRegistryEntry instanceof __WEBPACK_IMPORTED_MODULE_3_aurelia_loader__["TemplateRegistryEntry"]) {
    return Promise.resolve(urlOrRegistryEntry);
  }

  return loader.loadTemplate(urlOrRegistryEntry);
}

let ProxyViewFactory = class ProxyViewFactory {
  constructor(promise) {
    promise.then(x => this.viewFactory = x);
  }

  create(container, bindingContext, createInstruction, element) {
    return this.viewFactory.create(container, bindingContext, createInstruction, element);
  }

  get isCaching() {
    return this.viewFactory.isCaching;
  }

  setCacheSize(size, doNotOverrideIfAlreadySet) {
    this.viewFactory.setCacheSize(size, doNotOverrideIfAlreadySet);
  }

  getCachedView() {
    return this.viewFactory.getCachedView();
  }

  returnViewToCache(view) {
    this.viewFactory.returnViewToCache(view);
  }
};


let auSlotBehavior = null;

let ViewEngine = (_dec8 = __webpack_require__.i(__WEBPACK_IMPORTED_MODULE_6_aurelia_dependency_injection__["inject"])(__WEBPACK_IMPORTED_MODULE_3_aurelia_loader__["Loader"], __WEBPACK_IMPORTED_MODULE_6_aurelia_dependency_injection__["Container"], ViewCompiler, ModuleAnalyzer, ViewResources), _dec8(_class14 = (_temp4 = _class15 = class ViewEngine {
  constructor(loader, container, viewCompiler, moduleAnalyzer, appResources) {
    this.loader = loader;
    this.container = container;
    this.viewCompiler = viewCompiler;
    this.moduleAnalyzer = moduleAnalyzer;
    this.appResources = appResources;
    this._pluginMap = {};

    if (auSlotBehavior === null) {
      auSlotBehavior = new HtmlBehaviorResource();
      auSlotBehavior.attributeName = 'au-slot';
      __WEBPACK_IMPORTED_MODULE_1_aurelia_metadata__["metadata"].define(__WEBPACK_IMPORTED_MODULE_1_aurelia_metadata__["metadata"].resource, auSlotBehavior, SlotCustomAttribute);
    }

    auSlotBehavior.initialize(container, SlotCustomAttribute);
    auSlotBehavior.register(appResources);
  }

  addResourcePlugin(extension, implementation) {
    let name = extension.replace('.', '') + '-resource-plugin';
    this._pluginMap[extension] = name;
    this.loader.addPlugin(name, implementation);
  }

  loadViewFactory(urlOrRegistryEntry, compileInstruction, loadContext, target) {
    loadContext = loadContext || new ResourceLoadContext();

    return ensureRegistryEntry(this.loader, urlOrRegistryEntry).then(registryEntry => {
      const url = registryEntry.address;

      if (registryEntry.onReady) {
        if (!loadContext.hasDependency(url)) {
          loadContext.addDependency(url);
          return registryEntry.onReady;
        }

        if (registryEntry.template === null) {
          return registryEntry.onReady;
        }

        return Promise.resolve(new ProxyViewFactory(registryEntry.onReady));
      }

      loadContext.addDependency(url);

      registryEntry.onReady = this.loadTemplateResources(registryEntry, compileInstruction, loadContext, target).then(resources => {
        registryEntry.resources = resources;

        if (registryEntry.template === null) {
          return registryEntry.factory = null;
        }

        let viewFactory = this.viewCompiler.compile(registryEntry.template, resources, compileInstruction);
        return registryEntry.factory = viewFactory;
      });

      return registryEntry.onReady;
    });
  }

  loadTemplateResources(registryEntry, compileInstruction, loadContext, target) {
    let resources = new ViewResources(this.appResources, registryEntry.address);
    let dependencies = registryEntry.dependencies;
    let importIds;
    let names;

    compileInstruction = compileInstruction || ViewCompileInstruction.normal;

    if (dependencies.length === 0 && !compileInstruction.associatedModuleId) {
      return Promise.resolve(resources);
    }

    importIds = dependencies.map(x => x.src);
    names = dependencies.map(x => x.name);
    logger.debug(`importing resources for ${registryEntry.address}`, importIds);

    if (target) {
      let viewModelRequires = __WEBPACK_IMPORTED_MODULE_1_aurelia_metadata__["metadata"].get(ViewEngine.viewModelRequireMetadataKey, target);
      if (viewModelRequires) {
        let templateImportCount = importIds.length;
        for (let i = 0, ii = viewModelRequires.length; i < ii; ++i) {
          let req = viewModelRequires[i];
          let importId = typeof req === 'function' ? __WEBPACK_IMPORTED_MODULE_1_aurelia_metadata__["Origin"].get(req).moduleId : __webpack_require__.i(__WEBPACK_IMPORTED_MODULE_4_aurelia_path__["relativeToFile"])(req.src || req, registryEntry.address);

          if (importIds.indexOf(importId) === -1) {
            importIds.push(importId);
            names.push(req.as);
          }
        }
        logger.debug(`importing ViewModel resources for ${compileInstruction.associatedModuleId}`, importIds.slice(templateImportCount));
      }
    }

    return this.importViewResources(importIds, names, resources, compileInstruction, loadContext);
  }

  importViewModelResource(moduleImport, moduleMember) {
    return this.loader.loadModule(moduleImport).then(viewModelModule => {
      let normalizedId = __WEBPACK_IMPORTED_MODULE_1_aurelia_metadata__["Origin"].get(viewModelModule).moduleId;
      let resourceModule = this.moduleAnalyzer.analyze(normalizedId, viewModelModule, moduleMember);

      if (!resourceModule.mainResource) {
        throw new Error(`No view model found in module "${moduleImport}".`);
      }

      resourceModule.initialize(this.container);

      return resourceModule.mainResource;
    });
  }

  importViewResources(moduleIds, names, resources, compileInstruction, loadContext) {
    loadContext = loadContext || new ResourceLoadContext();
    compileInstruction = compileInstruction || ViewCompileInstruction.normal;

    moduleIds = moduleIds.map(x => this._applyLoaderPlugin(x));

    return this.loader.loadAllModules(moduleIds).then(imports => {
      let i;
      let ii;
      let analysis;
      let normalizedId;
      let current;
      let associatedModule;
      let container = this.container;
      let moduleAnalyzer = this.moduleAnalyzer;
      let allAnalysis = new Array(imports.length);

      for (i = 0, ii = imports.length; i < ii; ++i) {
        current = imports[i];
        normalizedId = __WEBPACK_IMPORTED_MODULE_1_aurelia_metadata__["Origin"].get(current).moduleId;

        analysis = moduleAnalyzer.analyze(normalizedId, current);
        analysis.initialize(container);
        analysis.register(resources, names[i]);

        allAnalysis[i] = analysis;
      }

      if (compileInstruction.associatedModuleId) {
        associatedModule = moduleAnalyzer.getAnalysis(compileInstruction.associatedModuleId);

        if (associatedModule) {
          associatedModule.register(resources);
        }
      }

      for (i = 0, ii = allAnalysis.length; i < ii; ++i) {
        allAnalysis[i] = allAnalysis[i].load(container, loadContext);
      }

      return Promise.all(allAnalysis).then(() => resources);
    });
  }

  _applyLoaderPlugin(id) {
    let index = id.lastIndexOf('.');
    if (index !== -1) {
      let ext = id.substring(index);
      let pluginName = this._pluginMap[ext];

      if (pluginName === undefined) {
        return id;
      }

      return this.loader.applyPluginToUrl(id, pluginName);
    }

    return id;
  }
}, _class15.viewModelRequireMetadataKey = 'aurelia:view-model-require', _temp4)) || _class14);

let Controller = class Controller {
  constructor(behavior, instruction, viewModel, container) {
    this.behavior = behavior;
    this.instruction = instruction;
    this.viewModel = viewModel;
    this.isAttached = false;
    this.view = null;
    this.isBound = false;
    this.scope = null;
    this.container = container;
    this.elementEvents = container.elementEvents || null;

    let observerLookup = behavior.observerLocator.getOrCreateObserversLookup(viewModel);
    let handlesBind = behavior.handlesBind;
    let attributes = instruction.attributes;
    let boundProperties = this.boundProperties = [];
    let properties = behavior.properties;
    let i;
    let ii;

    behavior._ensurePropertiesDefined(viewModel, observerLookup);

    for (i = 0, ii = properties.length; i < ii; ++i) {
      properties[i]._initialize(viewModel, observerLookup, attributes, handlesBind, boundProperties);
    }
  }

  created(owningView) {
    if (this.behavior.handlesCreated) {
      this.viewModel.created(owningView, this.view);
    }
  }

  automate(overrideContext, owningView) {
    this.view.bindingContext = this.viewModel;
    this.view.overrideContext = overrideContext || __webpack_require__.i(__WEBPACK_IMPORTED_MODULE_5_aurelia_binding__["createOverrideContext"])(this.viewModel);
    this.view._isUserControlled = true;

    if (this.behavior.handlesCreated) {
      this.viewModel.created(owningView || null, this.view);
    }

    this.bind(this.view);
  }

  bind(scope) {
    let skipSelfSubscriber = this.behavior.handlesBind;
    let boundProperties = this.boundProperties;
    let i;
    let ii;
    let x;
    let observer;
    let selfSubscriber;

    if (this.isBound) {
      if (this.scope === scope) {
        return;
      }

      this.unbind();
    }

    this.isBound = true;
    this.scope = scope;

    for (i = 0, ii = boundProperties.length; i < ii; ++i) {
      x = boundProperties[i];
      observer = x.observer;
      selfSubscriber = observer.selfSubscriber;
      observer.publishing = false;

      if (skipSelfSubscriber) {
        observer.selfSubscriber = null;
      }

      x.binding.bind(scope);
      observer.call();

      observer.publishing = true;
      observer.selfSubscriber = selfSubscriber;
    }

    let overrideContext;
    if (this.view !== null) {
      if (skipSelfSubscriber) {
        this.view.viewModelScope = scope;
      }

      if (this.viewModel === scope.overrideContext.bindingContext) {
        overrideContext = scope.overrideContext;
      } else if (this.instruction.inheritBindingContext) {
        overrideContext = __webpack_require__.i(__WEBPACK_IMPORTED_MODULE_5_aurelia_binding__["createOverrideContext"])(this.viewModel, scope.overrideContext);
      } else {
        overrideContext = __webpack_require__.i(__WEBPACK_IMPORTED_MODULE_5_aurelia_binding__["createOverrideContext"])(this.viewModel);
        overrideContext.__parentOverrideContext = scope.overrideContext;
      }

      this.view.bind(this.viewModel, overrideContext);
    } else if (skipSelfSubscriber) {
      overrideContext = scope.overrideContext;

      if (scope.overrideContext.__parentOverrideContext !== undefined && this.viewModel.viewFactory && this.viewModel.viewFactory.factoryCreateInstruction.partReplacements) {
        overrideContext = Object.assign({}, scope.overrideContext);
        overrideContext.parentOverrideContext = scope.overrideContext.__parentOverrideContext;
      }
      this.viewModel.bind(scope.bindingContext, overrideContext);
    }
  }

  unbind() {
    if (this.isBound) {
      let boundProperties = this.boundProperties;
      let i;
      let ii;

      this.isBound = false;
      this.scope = null;

      if (this.view !== null) {
        this.view.unbind();
      }

      if (this.behavior.handlesUnbind) {
        this.viewModel.unbind();
      }

      if (this.elementEvents !== null) {
        this.elementEvents.disposeAll();
      }

      for (i = 0, ii = boundProperties.length; i < ii; ++i) {
        boundProperties[i].binding.unbind();
      }
    }
  }

  attached() {
    if (this.isAttached) {
      return;
    }

    this.isAttached = true;

    if (this.behavior.handlesAttached) {
      this.viewModel.attached();
    }

    if (this.view !== null) {
      this.view.attached();
    }
  }

  detached() {
    if (this.isAttached) {
      this.isAttached = false;

      if (this.view !== null) {
        this.view.detached();
      }

      if (this.behavior.handlesDetached) {
        this.viewModel.detached();
      }
    }
  }
};

let BehaviorPropertyObserver = (_dec9 = __webpack_require__.i(__WEBPACK_IMPORTED_MODULE_5_aurelia_binding__["subscriberCollection"])(), _dec9(_class16 = class BehaviorPropertyObserver {
  constructor(taskQueue, obj, propertyName, selfSubscriber, initialValue) {
    this.taskQueue = taskQueue;
    this.obj = obj;
    this.propertyName = propertyName;
    this.notqueued = true;
    this.publishing = false;
    this.selfSubscriber = selfSubscriber;
    this.currentValue = this.oldValue = initialValue;
  }

  getValue() {
    return this.currentValue;
  }

  setValue(newValue) {
    let oldValue = this.currentValue;

    if (!Object.is(newValue, oldValue)) {
      this.oldValue = oldValue;
      this.currentValue = newValue;

      if (this.publishing && this.notqueued) {
        if (this.taskQueue.flushing) {
          this.call();
        } else {
          this.notqueued = false;
          this.taskQueue.queueMicroTask(this);
        }
      }
    }
  }

  call() {
    let oldValue = this.oldValue;
    let newValue = this.currentValue;

    this.notqueued = true;

    if (Object.is(newValue, oldValue)) {
      return;
    }

    if (this.selfSubscriber) {
      this.selfSubscriber(newValue, oldValue);
    }

    this.callSubscribers(newValue, oldValue);
    this.oldValue = newValue;
  }

  subscribe(context, callable) {
    this.addSubscriber(context, callable);
  }

  unsubscribe(context, callable) {
    this.removeSubscriber(context, callable);
  }
}) || _class16);

function getObserver(instance, name) {
  let lookup = instance.__observers__;

  if (lookup === undefined) {
    let ctor = Object.getPrototypeOf(instance).constructor;
    let behavior = __WEBPACK_IMPORTED_MODULE_1_aurelia_metadata__["metadata"].get(__WEBPACK_IMPORTED_MODULE_1_aurelia_metadata__["metadata"].resource, ctor);
    if (!behavior.isInitialized) {
      behavior.initialize(__WEBPACK_IMPORTED_MODULE_6_aurelia_dependency_injection__["Container"].instance || new __WEBPACK_IMPORTED_MODULE_6_aurelia_dependency_injection__["Container"](), instance.constructor);
    }

    lookup = behavior.observerLocator.getOrCreateObserversLookup(instance);
    behavior._ensurePropertiesDefined(instance, lookup);
  }

  return lookup[name];
}

let BindableProperty = class BindableProperty {
  constructor(nameOrConfig) {
    if (typeof nameOrConfig === 'string') {
      this.name = nameOrConfig;
    } else {
      Object.assign(this, nameOrConfig);
    }

    this.attribute = this.attribute || _hyphenate(this.name);
    let defaultBindingMode = this.defaultBindingMode;
    if (defaultBindingMode === null || defaultBindingMode === undefined) {
      this.defaultBindingMode = __WEBPACK_IMPORTED_MODULE_5_aurelia_binding__["bindingMode"].oneWay;
    } else if (typeof defaultBindingMode === 'string') {
      this.defaultBindingMode = __WEBPACK_IMPORTED_MODULE_5_aurelia_binding__["bindingMode"][defaultBindingMode] || __WEBPACK_IMPORTED_MODULE_5_aurelia_binding__["bindingMode"].oneWay;
    }
    this.changeHandler = this.changeHandler || null;
    this.owner = null;
    this.descriptor = null;
  }

  registerWith(target, behavior, descriptor) {
    behavior.properties.push(this);
    behavior.attributes[this.attribute] = this;
    this.owner = behavior;

    if (descriptor) {
      this.descriptor = descriptor;
      return this._configureDescriptor(descriptor);
    }

    return undefined;
  }

  _configureDescriptor(descriptor) {
    let name = this.name;

    descriptor.configurable = true;
    descriptor.enumerable = true;

    if ('initializer' in descriptor) {
      this.defaultValue = descriptor.initializer;
      delete descriptor.initializer;
      delete descriptor.writable;
    }

    if ('value' in descriptor) {
      this.defaultValue = descriptor.value;
      delete descriptor.value;
      delete descriptor.writable;
    }

    descriptor.get = function () {
      return getObserver(this, name).getValue();
    };

    descriptor.set = function (value) {
      getObserver(this, name).setValue(value);
    };

    descriptor.get.getObserver = function (obj) {
      return getObserver(obj, name);
    };

    return descriptor;
  }

  defineOn(target, behavior) {
    let name = this.name;
    let handlerName;

    if (this.changeHandler === null) {
      handlerName = name + 'Changed';
      if (handlerName in target.prototype) {
        this.changeHandler = handlerName;
      }
    }

    if (this.descriptor === null) {
      Object.defineProperty(target.prototype, name, this._configureDescriptor(behavior, {}));
    }
  }

  createObserver(viewModel) {
    let selfSubscriber = null;
    let defaultValue = this.defaultValue;
    let changeHandlerName = this.changeHandler;
    let name = this.name;
    let initialValue;

    if (this.hasOptions) {
      return undefined;
    }

    if (changeHandlerName in viewModel) {
      if ('propertyChanged' in viewModel) {
        selfSubscriber = (newValue, oldValue) => {
          viewModel[changeHandlerName](newValue, oldValue);
          viewModel.propertyChanged(name, newValue, oldValue);
        };
      } else {
        selfSubscriber = (newValue, oldValue) => viewModel[changeHandlerName](newValue, oldValue);
      }
    } else if ('propertyChanged' in viewModel) {
      selfSubscriber = (newValue, oldValue) => viewModel.propertyChanged(name, newValue, oldValue);
    } else if (changeHandlerName !== null) {
      throw new Error(`Change handler ${changeHandlerName} was specified but not declared on the class.`);
    }

    if (defaultValue !== undefined) {
      initialValue = typeof defaultValue === 'function' ? defaultValue.call(viewModel) : defaultValue;
    }

    return new BehaviorPropertyObserver(this.owner.taskQueue, viewModel, this.name, selfSubscriber, initialValue);
  }

  _initialize(viewModel, observerLookup, attributes, behaviorHandlesBind, boundProperties) {
    let selfSubscriber;
    let observer;
    let attribute;
    let defaultValue = this.defaultValue;

    if (this.isDynamic) {
      for (let key in attributes) {
        this._createDynamicProperty(viewModel, observerLookup, behaviorHandlesBind, key, attributes[key], boundProperties);
      }
    } else if (!this.hasOptions) {
      observer = observerLookup[this.name];

      if (attributes !== null) {
        selfSubscriber = observer.selfSubscriber;
        attribute = attributes[this.attribute];

        if (behaviorHandlesBind) {
          observer.selfSubscriber = null;
        }

        if (typeof attribute === 'string') {
          viewModel[this.name] = attribute;
          observer.call();
        } else if (attribute) {
          boundProperties.push({ observer: observer, binding: attribute.createBinding(viewModel) });
        } else if (defaultValue !== undefined) {
          observer.call();
        }

        observer.selfSubscriber = selfSubscriber;
      }

      observer.publishing = true;
    }
  }

  _createDynamicProperty(viewModel, observerLookup, behaviorHandlesBind, name, attribute, boundProperties) {
    let changeHandlerName = name + 'Changed';
    let selfSubscriber = null;
    let observer;
    let info;

    if (changeHandlerName in viewModel) {
      if ('propertyChanged' in viewModel) {
        selfSubscriber = (newValue, oldValue) => {
          viewModel[changeHandlerName](newValue, oldValue);
          viewModel.propertyChanged(name, newValue, oldValue);
        };
      } else {
        selfSubscriber = (newValue, oldValue) => viewModel[changeHandlerName](newValue, oldValue);
      }
    } else if ('propertyChanged' in viewModel) {
      selfSubscriber = (newValue, oldValue) => viewModel.propertyChanged(name, newValue, oldValue);
    }

    observer = observerLookup[name] = new BehaviorPropertyObserver(this.owner.taskQueue, viewModel, name, selfSubscriber);

    Object.defineProperty(viewModel, name, {
      configurable: true,
      enumerable: true,
      get: observer.getValue.bind(observer),
      set: observer.setValue.bind(observer)
    });

    if (behaviorHandlesBind) {
      observer.selfSubscriber = null;
    }

    if (typeof attribute === 'string') {
      viewModel[name] = attribute;
      observer.call();
    } else if (attribute) {
      info = { observer: observer, binding: attribute.createBinding(viewModel) };
      boundProperties.push(info);
    }

    observer.publishing = true;
    observer.selfSubscriber = selfSubscriber;
  }
};

let lastProviderId = 0;

function nextProviderId() {
  return ++lastProviderId;
}

function doProcessContent() {
  return true;
}
function doProcessAttributes() {}

let HtmlBehaviorResource = class HtmlBehaviorResource {
  constructor() {
    this.elementName = null;
    this.attributeName = null;
    this.attributeDefaultBindingMode = undefined;
    this.liftsContent = false;
    this.targetShadowDOM = false;
    this.shadowDOMOptions = null;
    this.processAttributes = doProcessAttributes;
    this.processContent = doProcessContent;
    this.usesShadowDOM = false;
    this.childBindings = null;
    this.hasDynamicOptions = false;
    this.containerless = false;
    this.properties = [];
    this.attributes = {};
    this.isInitialized = false;
    this.primaryProperty = null;
  }

  static convention(name, existing) {
    let behavior;

    if (name.endsWith('CustomAttribute')) {
      behavior = existing || new HtmlBehaviorResource();
      behavior.attributeName = _hyphenate(name.substring(0, name.length - 15));
    }

    if (name.endsWith('CustomElement')) {
      behavior = existing || new HtmlBehaviorResource();
      behavior.elementName = _hyphenate(name.substring(0, name.length - 13));
    }

    return behavior;
  }

  addChildBinding(behavior) {
    if (this.childBindings === null) {
      this.childBindings = [];
    }

    this.childBindings.push(behavior);
  }

  initialize(container, target) {
    let proto = target.prototype;
    let properties = this.properties;
    let attributeName = this.attributeName;
    let attributeDefaultBindingMode = this.attributeDefaultBindingMode;
    let i;
    let ii;
    let current;

    if (this.isInitialized) {
      return;
    }

    this.isInitialized = true;
    target.__providerId__ = nextProviderId();

    this.observerLocator = container.get(__WEBPACK_IMPORTED_MODULE_5_aurelia_binding__["ObserverLocator"]);
    this.taskQueue = container.get(__WEBPACK_IMPORTED_MODULE_7_aurelia_task_queue__["TaskQueue"]);

    this.target = target;
    this.usesShadowDOM = this.targetShadowDOM && __WEBPACK_IMPORTED_MODULE_2_aurelia_pal__["FEATURE"].shadowDOM;
    this.handlesCreated = 'created' in proto;
    this.handlesBind = 'bind' in proto;
    this.handlesUnbind = 'unbind' in proto;
    this.handlesAttached = 'attached' in proto;
    this.handlesDetached = 'detached' in proto;
    this.htmlName = this.elementName || this.attributeName;

    if (attributeName !== null) {
      if (properties.length === 0) {
        new BindableProperty({
          name: 'value',
          changeHandler: 'valueChanged' in proto ? 'valueChanged' : null,
          attribute: attributeName,
          defaultBindingMode: attributeDefaultBindingMode
        }).registerWith(target, this);
      }

      current = properties[0];

      if (properties.length === 1 && current.name === 'value') {
        current.isDynamic = current.hasOptions = this.hasDynamicOptions;
        current.defineOn(target, this);
      } else {
        for (i = 0, ii = properties.length; i < ii; ++i) {
          properties[i].defineOn(target, this);
          if (properties[i].primaryProperty) {
            if (this.primaryProperty) {
              throw new Error('Only one bindable property on a custom element can be defined as the default');
            }
            this.primaryProperty = properties[i];
          }
        }

        current = new BindableProperty({
          name: 'value',
          changeHandler: 'valueChanged' in proto ? 'valueChanged' : null,
          attribute: attributeName,
          defaultBindingMode: attributeDefaultBindingMode
        });

        current.hasOptions = true;
        current.registerWith(target, this);
      }
    } else {
      for (i = 0, ii = properties.length; i < ii; ++i) {
        properties[i].defineOn(target, this);
      }

      this._copyInheritedProperties(container, target);
    }
  }

  register(registry, name) {
    if (this.attributeName !== null) {
      registry.registerAttribute(name || this.attributeName, this, this.attributeName);

      if (Array.isArray(this.aliases)) {
        this.aliases.forEach(alias => {
          registry.registerAttribute(alias, this, this.attributeName);
        });
      }
    }

    if (this.elementName !== null) {
      registry.registerElement(name || this.elementName, this);
    }
  }

  load(container, target, loadContext, viewStrategy, transientView) {
    let options;

    if (this.elementName !== null) {
      viewStrategy = container.get(ViewLocator).getViewStrategy(viewStrategy || this.viewStrategy || target);
      options = new ViewCompileInstruction(this.targetShadowDOM, true);

      if (!viewStrategy.moduleId) {
        viewStrategy.moduleId = __WEBPACK_IMPORTED_MODULE_1_aurelia_metadata__["Origin"].get(target).moduleId;
      }

      return viewStrategy.loadViewFactory(container.get(ViewEngine), options, loadContext, target).then(viewFactory => {
        if (!transientView || !this.viewFactory) {
          this.viewFactory = viewFactory;
        }

        return viewFactory;
      });
    }

    return Promise.resolve(this);
  }

  compile(compiler, resources, node, instruction, parentNode) {
    if (this.liftsContent) {
      if (!instruction.viewFactory) {
        let template = __WEBPACK_IMPORTED_MODULE_2_aurelia_pal__["DOM"].createElement('template');
        let fragment = __WEBPACK_IMPORTED_MODULE_2_aurelia_pal__["DOM"].createDocumentFragment();
        let cacheSize = node.getAttribute('view-cache');
        let part = node.getAttribute('part');

        node.removeAttribute(instruction.originalAttrName);
        __WEBPACK_IMPORTED_MODULE_2_aurelia_pal__["DOM"].replaceNode(template, node, parentNode);
        fragment.appendChild(node);
        instruction.viewFactory = compiler.compile(fragment, resources);

        if (part) {
          instruction.viewFactory.part = part;
          node.removeAttribute('part');
        }

        if (cacheSize) {
          instruction.viewFactory.setCacheSize(cacheSize);
          node.removeAttribute('view-cache');
        }

        node = template;
      }
    } else if (this.elementName !== null) {
      let partReplacements = {};

      if (this.processContent(compiler, resources, node, instruction) && node.hasChildNodes()) {
        let currentChild = node.firstChild;
        let contentElement = this.usesShadowDOM ? null : __WEBPACK_IMPORTED_MODULE_2_aurelia_pal__["DOM"].createElement('au-content');
        let nextSibling;
        let toReplace;

        while (currentChild) {
          nextSibling = currentChild.nextSibling;

          if (currentChild.tagName === 'TEMPLATE' && (toReplace = currentChild.getAttribute('replace-part'))) {
            partReplacements[toReplace] = compiler.compile(currentChild, resources);
            __WEBPACK_IMPORTED_MODULE_2_aurelia_pal__["DOM"].removeNode(currentChild, parentNode);
            instruction.partReplacements = partReplacements;
          } else if (contentElement !== null) {
            if (currentChild.nodeType === 3 && _isAllWhitespace(currentChild)) {
              __WEBPACK_IMPORTED_MODULE_2_aurelia_pal__["DOM"].removeNode(currentChild, parentNode);
            } else {
              contentElement.appendChild(currentChild);
            }
          }

          currentChild = nextSibling;
        }

        if (contentElement !== null && contentElement.hasChildNodes()) {
          node.appendChild(contentElement);
        }

        instruction.skipContentProcessing = false;
      } else {
        instruction.skipContentProcessing = true;
      }
    } else if (!this.processContent(compiler, resources, node, instruction)) {
      instruction.skipContentProcessing = true;
    }

    return node;
  }

  create(container, instruction, element, bindings) {
    let viewHost;
    let au = null;

    instruction = instruction || BehaviorInstruction.normal;
    element = element || null;
    bindings = bindings || null;

    if (this.elementName !== null && element) {
      if (this.usesShadowDOM) {
        viewHost = element.attachShadow(this.shadowDOMOptions);
        container.registerInstance(__WEBPACK_IMPORTED_MODULE_2_aurelia_pal__["DOM"].boundary, viewHost);
      } else {
        viewHost = element;
        if (this.targetShadowDOM) {
          container.registerInstance(__WEBPACK_IMPORTED_MODULE_2_aurelia_pal__["DOM"].boundary, viewHost);
        }
      }
    }

    if (element !== null) {
      element.au = au = element.au || {};
    }

    let viewModel = instruction.viewModel || container.get(this.target);
    let controller = new Controller(this, instruction, viewModel, container);
    let childBindings = this.childBindings;
    let viewFactory;

    if (this.liftsContent) {
      au.controller = controller;
    } else if (this.elementName !== null) {
      viewFactory = instruction.viewFactory || this.viewFactory;
      container.viewModel = viewModel;

      if (viewFactory) {
        controller.view = viewFactory.create(container, instruction, element);
      }

      if (element !== null) {
        au.controller = controller;

        if (controller.view) {
          if (!this.usesShadowDOM && (element.childNodes.length === 1 || element.contentElement)) {
            let contentElement = element.childNodes[0] || element.contentElement;
            controller.view.contentView = { fragment: contentElement };
            contentElement.parentNode && __WEBPACK_IMPORTED_MODULE_2_aurelia_pal__["DOM"].removeNode(contentElement);
          }

          if (instruction.anchorIsContainer) {
            if (childBindings !== null) {
              for (let i = 0, ii = childBindings.length; i < ii; ++i) {
                controller.view.addBinding(childBindings[i].create(element, viewModel, controller));
              }
            }

            controller.view.appendNodesTo(viewHost);
          } else {
            controller.view.insertNodesBefore(viewHost);
          }
        } else if (childBindings !== null) {
          for (let i = 0, ii = childBindings.length; i < ii; ++i) {
            bindings.push(childBindings[i].create(element, viewModel, controller));
          }
        }
      } else if (controller.view) {
        controller.view.controller = controller;

        if (childBindings !== null) {
          for (let i = 0, ii = childBindings.length; i < ii; ++i) {
            controller.view.addBinding(childBindings[i].create(instruction.host, viewModel, controller));
          }
        }
      } else if (childBindings !== null) {
        for (let i = 0, ii = childBindings.length; i < ii; ++i) {
          bindings.push(childBindings[i].create(instruction.host, viewModel, controller));
        }
      }
    } else if (childBindings !== null) {
      for (let i = 0, ii = childBindings.length; i < ii; ++i) {
        bindings.push(childBindings[i].create(element, viewModel, controller));
      }
    }

    if (au !== null) {
      au[this.htmlName] = controller;
    }

    if (instruction.initiatedByBehavior && viewFactory) {
      controller.view.created();
    }

    return controller;
  }

  _ensurePropertiesDefined(instance, lookup) {
    let properties;
    let i;
    let ii;
    let observer;

    if ('__propertiesDefined__' in lookup) {
      return;
    }

    lookup.__propertiesDefined__ = true;
    properties = this.properties;

    for (i = 0, ii = properties.length; i < ii; ++i) {
      observer = properties[i].createObserver(instance);

      if (observer !== undefined) {
        lookup[observer.propertyName] = observer;
      }
    }
  }

  _copyInheritedProperties(container, target) {
    let behavior;
    let derived = target;

    while (true) {
      let proto = Object.getPrototypeOf(target.prototype);
      target = proto && proto.constructor;
      if (!target) {
        return;
      }
      behavior = __WEBPACK_IMPORTED_MODULE_1_aurelia_metadata__["metadata"].getOwn(__WEBPACK_IMPORTED_MODULE_1_aurelia_metadata__["metadata"].resource, target);
      if (behavior) {
        break;
      }
    }
    behavior.initialize(container, target);
    for (let i = 0, ii = behavior.properties.length; i < ii; ++i) {
      let prop = behavior.properties[i];

      if (this.properties.some(p => p.name === prop.name)) {
        continue;
      }

      new BindableProperty(prop).registerWith(derived, this);
    }
  }
};

function createChildObserverDecorator(selectorOrConfig, all) {
  return function (target, key, descriptor) {
    let actualTarget = typeof key === 'string' ? target.constructor : target;
    let r = __WEBPACK_IMPORTED_MODULE_1_aurelia_metadata__["metadata"].getOrCreateOwn(__WEBPACK_IMPORTED_MODULE_1_aurelia_metadata__["metadata"].resource, HtmlBehaviorResource, actualTarget);

    if (typeof selectorOrConfig === 'string') {
      selectorOrConfig = {
        selector: selectorOrConfig,
        name: key
      };
    }

    if (descriptor) {
      descriptor.writable = true;
      descriptor.configurable = true;
    }

    selectorOrConfig.all = all;
    r.addChildBinding(new ChildObserver(selectorOrConfig));
  };
}

function children(selectorOrConfig) {
  return createChildObserverDecorator(selectorOrConfig, true);
}

function child(selectorOrConfig) {
  return createChildObserverDecorator(selectorOrConfig, false);
}

let ChildObserver = class ChildObserver {
  constructor(config) {
    this.name = config.name;
    this.changeHandler = config.changeHandler || this.name + 'Changed';
    this.selector = config.selector;
    this.all = config.all;
  }

  create(viewHost, viewModel, controller) {
    return new ChildObserverBinder(this.selector, viewHost, this.name, viewModel, controller, this.changeHandler, this.all);
  }
};


const noMutations = [];

function trackMutation(groupedMutations, binder, record) {
  let mutations = groupedMutations.get(binder);

  if (!mutations) {
    mutations = [];
    groupedMutations.set(binder, mutations);
  }

  mutations.push(record);
}

function onChildChange(mutations, observer) {
  let binders = observer.binders;
  let bindersLength = binders.length;
  let groupedMutations = new Map();

  for (let i = 0, ii = mutations.length; i < ii; ++i) {
    let record = mutations[i];
    let added = record.addedNodes;
    let removed = record.removedNodes;

    for (let j = 0, jj = removed.length; j < jj; ++j) {
      let node = removed[j];
      if (node.nodeType === 1) {
        for (let k = 0; k < bindersLength; ++k) {
          let binder = binders[k];
          if (binder.onRemove(node)) {
            trackMutation(groupedMutations, binder, record);
          }
        }
      }
    }

    for (let j = 0, jj = added.length; j < jj; ++j) {
      let node = added[j];
      if (node.nodeType === 1) {
        for (let k = 0; k < bindersLength; ++k) {
          let binder = binders[k];
          if (binder.onAdd(node)) {
            trackMutation(groupedMutations, binder, record);
          }
        }
      }
    }
  }

  groupedMutations.forEach((value, key) => {
    if (key.changeHandler !== null) {
      key.viewModel[key.changeHandler](value);
    }
  });
}

let ChildObserverBinder = class ChildObserverBinder {
  constructor(selector, viewHost, property, viewModel, controller, changeHandler, all) {
    this.selector = selector;
    this.viewHost = viewHost;
    this.property = property;
    this.viewModel = viewModel;
    this.controller = controller;
    this.changeHandler = changeHandler in viewModel ? changeHandler : null;
    this.usesShadowDOM = controller.behavior.usesShadowDOM;
    this.all = all;

    if (!this.usesShadowDOM && controller.view && controller.view.contentView) {
      this.contentView = controller.view.contentView;
    } else {
      this.contentView = null;
    }
  }

  matches(element) {
    if (element.matches(this.selector)) {
      if (this.contentView === null) {
        return true;
      }

      let contentView = this.contentView;
      let assignedSlot = element.auAssignedSlot;

      if (assignedSlot && assignedSlot.projectFromAnchors) {
        let anchors = assignedSlot.projectFromAnchors;

        for (let i = 0, ii = anchors.length; i < ii; ++i) {
          if (anchors[i].auOwnerView === contentView) {
            return true;
          }
        }

        return false;
      }

      return element.auOwnerView === contentView;
    }

    return false;
  }

  bind(source) {
    let viewHost = this.viewHost;
    let viewModel = this.viewModel;
    let observer = viewHost.__childObserver__;

    if (!observer) {
      observer = viewHost.__childObserver__ = __WEBPACK_IMPORTED_MODULE_2_aurelia_pal__["DOM"].createMutationObserver(onChildChange);

      let options = {
        childList: true,
        subtree: !this.usesShadowDOM
      };

      observer.observe(viewHost, options);
      observer.binders = [];
    }

    observer.binders.push(this);

    if (this.usesShadowDOM) {
      let current = viewHost.firstElementChild;

      if (this.all) {
        let items = viewModel[this.property];
        if (!items) {
          items = viewModel[this.property] = [];
        } else {
          items.splice(0);
        }

        while (current) {
          if (this.matches(current)) {
            items.push(current.au && current.au.controller ? current.au.controller.viewModel : current);
          }

          current = current.nextElementSibling;
        }

        if (this.changeHandler !== null) {
          this.viewModel[this.changeHandler](noMutations);
        }
      } else {
        while (current) {
          if (this.matches(current)) {
            let value = current.au && current.au.controller ? current.au.controller.viewModel : current;
            this.viewModel[this.property] = value;

            if (this.changeHandler !== null) {
              this.viewModel[this.changeHandler](value);
            }

            break;
          }

          current = current.nextElementSibling;
        }
      }
    }
  }

  onRemove(element) {
    if (this.matches(element)) {
      let value = element.au && element.au.controller ? element.au.controller.viewModel : element;

      if (this.all) {
        let items = this.viewModel[this.property] || (this.viewModel[this.property] = []);
        let index = items.indexOf(value);

        if (index !== -1) {
          items.splice(index, 1);
        }

        return true;
      }

      return false;
    }

    return false;
  }

  onAdd(element) {
    if (this.matches(element)) {
      let value = element.au && element.au.controller ? element.au.controller.viewModel : element;

      if (this.all) {
        let items = this.viewModel[this.property] || (this.viewModel[this.property] = []);

        if (this.selector === '*') {
          items.push(value);
          return true;
        }

        let index = 0;
        let prev = element.previousElementSibling;

        while (prev) {
          if (this.matches(prev)) {
            index++;
          }

          prev = prev.previousElementSibling;
        }

        items.splice(index, 0, value);
        return true;
      }

      this.viewModel[this.property] = value;

      if (this.changeHandler !== null) {
        this.viewModel[this.changeHandler](value);
      }
    }

    return false;
  }

  unbind() {
    if (this.viewHost.__childObserver__) {
      this.viewHost.__childObserver__.disconnect();
      this.viewHost.__childObserver__ = null;
      this.viewModel[this.property] = null;
    }
  }
};


function remove(viewSlot, previous) {
  return Array.isArray(previous) ? viewSlot.removeMany(previous, true) : viewSlot.remove(previous, true);
}

const SwapStrategies = {
  before(viewSlot, previous, callback) {
    return previous === undefined ? callback() : callback().then(() => remove(viewSlot, previous));
  },

  with(viewSlot, previous, callback) {
    return previous === undefined ? callback() : Promise.all([remove(viewSlot, previous), callback()]);
  },

  after(viewSlot, previous, callback) {
    return Promise.resolve(viewSlot.removeAll(true)).then(callback);
  }
};
/* harmony export (immutable) */ exports["SwapStrategies"] = SwapStrategies;


function tryActivateViewModel(context) {
  if (context.skipActivation || typeof context.viewModel.activate !== 'function') {
    return Promise.resolve();
  }

  return context.viewModel.activate(context.model) || Promise.resolve();
}

let CompositionEngine = (_dec10 = __webpack_require__.i(__WEBPACK_IMPORTED_MODULE_6_aurelia_dependency_injection__["inject"])(ViewEngine, ViewLocator), _dec10(_class17 = class CompositionEngine {
  constructor(viewEngine, viewLocator) {
    this.viewEngine = viewEngine;
    this.viewLocator = viewLocator;
  }

  _swap(context, view) {
    let swapStrategy = SwapStrategies[context.swapOrder] || SwapStrategies.after;
    let previousViews = context.viewSlot.children.slice();

    return swapStrategy(context.viewSlot, previousViews, () => {
      return Promise.resolve(context.viewSlot.add(view)).then(() => {
        if (context.currentController) {
          context.currentController.unbind();
        }
      });
    }).then(() => {
      if (context.compositionTransactionNotifier) {
        context.compositionTransactionNotifier.done();
      }
    });
  }

  _createControllerAndSwap(context) {
    return this.createController(context).then(controller => {
      if (context.compositionTransactionOwnershipToken) {
        return context.compositionTransactionOwnershipToken.waitForCompositionComplete().then(() => {
          controller.automate(context.overrideContext, context.owningView);

          return this._swap(context, controller.view);
        }).then(() => controller);
      }

      controller.automate(context.overrideContext, context.owningView);

      return this._swap(context, controller.view).then(() => controller);
    });
  }

  createController(context) {
    let childContainer;
    let viewModel;
    let viewModelResource;

    let m;

    return this.ensureViewModel(context).then(tryActivateViewModel).then(() => {
      childContainer = context.childContainer;
      viewModel = context.viewModel;
      viewModelResource = context.viewModelResource;
      m = viewModelResource.metadata;

      let viewStrategy = this.viewLocator.getViewStrategy(context.view || viewModel);

      if (context.viewResources) {
        viewStrategy.makeRelativeTo(context.viewResources.viewUrl);
      }

      return m.load(childContainer, viewModelResource.value, null, viewStrategy, true);
    }).then(viewFactory => m.create(childContainer, BehaviorInstruction.dynamic(context.host, viewModel, viewFactory)));
  }

  ensureViewModel(context) {
    let childContainer = context.childContainer = context.childContainer || context.container.createChild();

    if (typeof context.viewModel === 'string') {
      context.viewModel = context.viewResources ? context.viewResources.relativeToView(context.viewModel) : context.viewModel;

      return this.viewEngine.importViewModelResource(context.viewModel).then(viewModelResource => {
        childContainer.autoRegister(viewModelResource.value);

        if (context.host) {
          childContainer.registerInstance(__WEBPACK_IMPORTED_MODULE_2_aurelia_pal__["DOM"].Element, context.host);
        }

        context.viewModel = childContainer.viewModel = childContainer.get(viewModelResource.value);
        context.viewModelResource = viewModelResource;
        return context;
      });
    }

    let ctor = context.viewModel.constructor;
    let isClass = typeof context.viewModel === 'function';
    if (isClass) {
      ctor = context.viewModel;
      childContainer.autoRegister(ctor);
    }
    let m = __WEBPACK_IMPORTED_MODULE_1_aurelia_metadata__["metadata"].getOrCreateOwn(__WEBPACK_IMPORTED_MODULE_1_aurelia_metadata__["metadata"].resource, HtmlBehaviorResource, ctor);

    m.elementName = m.elementName || 'dynamic-element';

    m.initialize(isClass ? childContainer : context.container || childContainer, ctor);

    context.viewModelResource = { metadata: m, value: ctor };

    if (context.host) {
      childContainer.registerInstance(__WEBPACK_IMPORTED_MODULE_2_aurelia_pal__["DOM"].Element, context.host);
    }
    childContainer.viewModel = context.viewModel = isClass ? childContainer.get(ctor) : context.viewModel;
    return Promise.resolve(context);
  }

  compose(context) {
    context.childContainer = context.childContainer || context.container.createChild();
    context.view = this.viewLocator.getViewStrategy(context.view);

    let transaction = context.childContainer.get(CompositionTransaction);
    let compositionTransactionOwnershipToken = transaction.tryCapture();

    if (compositionTransactionOwnershipToken) {
      context.compositionTransactionOwnershipToken = compositionTransactionOwnershipToken;
    } else {
      context.compositionTransactionNotifier = transaction.enlist();
    }

    if (context.viewModel) {
      return this._createControllerAndSwap(context);
    } else if (context.view) {
      if (context.viewResources) {
        context.view.makeRelativeTo(context.viewResources.viewUrl);
      }

      return context.view.loadViewFactory(this.viewEngine, new ViewCompileInstruction()).then(viewFactory => {
        let result = viewFactory.create(context.childContainer);
        result.bind(context.bindingContext, context.overrideContext);

        if (context.compositionTransactionOwnershipToken) {
          return context.compositionTransactionOwnershipToken.waitForCompositionComplete().then(() => this._swap(context, result)).then(() => result);
        }

        return this._swap(context, result).then(() => result);
      });
    } else if (context.viewSlot) {
      context.viewSlot.removeAll();

      if (context.compositionTransactionNotifier) {
        context.compositionTransactionNotifier.done();
      }

      return Promise.resolve(null);
    }

    return Promise.resolve(null);
  }
}) || _class17);

let ElementConfigResource = class ElementConfigResource {
  initialize(container, target) {}

  register(registry, name) {}

  load(container, target) {
    let config = new target();
    let eventManager = container.get(__WEBPACK_IMPORTED_MODULE_5_aurelia_binding__["EventManager"]);
    eventManager.registerElementConfig(config);
  }
};

function resource(instanceOrConfig) {
  return function (target) {
    let isConfig = typeof instanceOrConfig === 'string' || Object.getPrototypeOf(instanceOrConfig) === Object.prototype;
    if (isConfig) {
      target.$resource = instanceOrConfig;
    } else {
      __WEBPACK_IMPORTED_MODULE_1_aurelia_metadata__["metadata"].define(__WEBPACK_IMPORTED_MODULE_1_aurelia_metadata__["metadata"].resource, instanceOrConfig, target);
    }
  };
}

function behavior(override) {
  return function (target) {
    if (override instanceof HtmlBehaviorResource) {
      __WEBPACK_IMPORTED_MODULE_1_aurelia_metadata__["metadata"].define(__WEBPACK_IMPORTED_MODULE_1_aurelia_metadata__["metadata"].resource, override, target);
    } else {
      let r = __WEBPACK_IMPORTED_MODULE_1_aurelia_metadata__["metadata"].getOrCreateOwn(__WEBPACK_IMPORTED_MODULE_1_aurelia_metadata__["metadata"].resource, HtmlBehaviorResource, target);
      Object.assign(r, override);
    }
  };
}

function customElement(name) {
  return function (target) {
    let r = __WEBPACK_IMPORTED_MODULE_1_aurelia_metadata__["metadata"].getOrCreateOwn(__WEBPACK_IMPORTED_MODULE_1_aurelia_metadata__["metadata"].resource, HtmlBehaviorResource, target);
    r.elementName = validateBehaviorName(name, 'custom element');
  };
}

function customAttribute(name, defaultBindingMode, aliases) {
  return function (target) {
    let r = __WEBPACK_IMPORTED_MODULE_1_aurelia_metadata__["metadata"].getOrCreateOwn(__WEBPACK_IMPORTED_MODULE_1_aurelia_metadata__["metadata"].resource, HtmlBehaviorResource, target);
    r.attributeName = validateBehaviorName(name, 'custom attribute');
    r.attributeDefaultBindingMode = defaultBindingMode;
    r.aliases = aliases;
  };
}

function templateController(target) {
  let deco = function (t) {
    let r = __WEBPACK_IMPORTED_MODULE_1_aurelia_metadata__["metadata"].getOrCreateOwn(__WEBPACK_IMPORTED_MODULE_1_aurelia_metadata__["metadata"].resource, HtmlBehaviorResource, t);
    r.liftsContent = true;
  };

  return target ? deco(target) : deco;
}

function bindable(nameOrConfigOrTarget, key, descriptor) {
  let deco = function (target, key2, descriptor2) {
    let actualTarget = key2 ? target.constructor : target;
    let r = __WEBPACK_IMPORTED_MODULE_1_aurelia_metadata__["metadata"].getOrCreateOwn(__WEBPACK_IMPORTED_MODULE_1_aurelia_metadata__["metadata"].resource, HtmlBehaviorResource, actualTarget);
    let prop;

    if (key2) {
      nameOrConfigOrTarget = nameOrConfigOrTarget || {};
      nameOrConfigOrTarget.name = key2;
    }

    prop = new BindableProperty(nameOrConfigOrTarget);
    return prop.registerWith(actualTarget, r, descriptor2);
  };

  if (!nameOrConfigOrTarget) {
    return deco;
  }

  if (key) {
    let target = nameOrConfigOrTarget;
    nameOrConfigOrTarget = null;
    return deco(target, key, descriptor);
  }

  return deco;
}

function dynamicOptions(target) {
  let deco = function (t) {
    let r = __WEBPACK_IMPORTED_MODULE_1_aurelia_metadata__["metadata"].getOrCreateOwn(__WEBPACK_IMPORTED_MODULE_1_aurelia_metadata__["metadata"].resource, HtmlBehaviorResource, t);
    r.hasDynamicOptions = true;
  };

  return target ? deco(target) : deco;
}

const defaultShadowDOMOptions = { mode: 'open' };

function useShadowDOM(targetOrOptions) {
  let options = typeof targetOrOptions === 'function' || !targetOrOptions ? defaultShadowDOMOptions : targetOrOptions;

  let deco = function (t) {
    let r = __WEBPACK_IMPORTED_MODULE_1_aurelia_metadata__["metadata"].getOrCreateOwn(__WEBPACK_IMPORTED_MODULE_1_aurelia_metadata__["metadata"].resource, HtmlBehaviorResource, t);
    r.targetShadowDOM = true;
    r.shadowDOMOptions = options;
  };

  return typeof targetOrOptions === 'function' ? deco(targetOrOptions) : deco;
}

function processAttributes(processor) {
  return function (t) {
    let r = __WEBPACK_IMPORTED_MODULE_1_aurelia_metadata__["metadata"].getOrCreateOwn(__WEBPACK_IMPORTED_MODULE_1_aurelia_metadata__["metadata"].resource, HtmlBehaviorResource, t);
    r.processAttributes = function (compiler, resources, node, attributes, elementInstruction) {
      try {
        processor(compiler, resources, node, attributes, elementInstruction);
      } catch (error) {
        __WEBPACK_IMPORTED_MODULE_0_aurelia_logging__["getLogger"]('templating').error(error);
      }
    };
  };
}

function doNotProcessContent() {
  return false;
}

function processContent(processor) {
  return function (t) {
    let r = __WEBPACK_IMPORTED_MODULE_1_aurelia_metadata__["metadata"].getOrCreateOwn(__WEBPACK_IMPORTED_MODULE_1_aurelia_metadata__["metadata"].resource, HtmlBehaviorResource, t);
    r.processContent = processor ? function (compiler, resources, node, instruction) {
      try {
        return processor(compiler, resources, node, instruction);
      } catch (error) {
        __WEBPACK_IMPORTED_MODULE_0_aurelia_logging__["getLogger"]('templating').error(error);
        return false;
      }
    } : doNotProcessContent;
  };
}

function containerless(target) {
  let deco = function (t) {
    let r = __WEBPACK_IMPORTED_MODULE_1_aurelia_metadata__["metadata"].getOrCreateOwn(__WEBPACK_IMPORTED_MODULE_1_aurelia_metadata__["metadata"].resource, HtmlBehaviorResource, t);
    r.containerless = true;
  };

  return target ? deco(target) : deco;
}

function useViewStrategy(strategy) {
  return function (target) {
    __WEBPACK_IMPORTED_MODULE_1_aurelia_metadata__["metadata"].define(ViewLocator.viewStrategyMetadataKey, strategy, target);
  };
}

function useView(path) {
  return useViewStrategy(new RelativeViewStrategy(path));
}

function inlineView(markup, dependencies, dependencyBaseUrl) {
  return useViewStrategy(new InlineViewStrategy(markup, dependencies, dependencyBaseUrl));
}

function noView(targetOrDependencies, dependencyBaseUrl) {
  let target;
  let dependencies;
  if (typeof targetOrDependencies === 'function') {
    target = targetOrDependencies;
  } else {
    dependencies = targetOrDependencies;
    target = undefined;
  }

  let deco = function (t) {
    __WEBPACK_IMPORTED_MODULE_1_aurelia_metadata__["metadata"].define(ViewLocator.viewStrategyMetadataKey, new NoViewStrategy(dependencies, dependencyBaseUrl), t);
  };

  return target ? deco(target) : deco;
}

function view(templateOrConfig) {
  return function (target) {
    target.$view = templateOrConfig;
  };
}

function elementConfig(target) {
  let deco = function (t) {
    __WEBPACK_IMPORTED_MODULE_1_aurelia_metadata__["metadata"].define(__WEBPACK_IMPORTED_MODULE_1_aurelia_metadata__["metadata"].resource, new ElementConfigResource(), t);
  };

  return target ? deco(target) : deco;
}

function viewResources(...resources) {
  return function (target) {
    __WEBPACK_IMPORTED_MODULE_1_aurelia_metadata__["metadata"].define(ViewEngine.viewModelRequireMetadataKey, resources, target);
  };
}

let TemplatingEngine = (_dec11 = __webpack_require__.i(__WEBPACK_IMPORTED_MODULE_6_aurelia_dependency_injection__["inject"])(__WEBPACK_IMPORTED_MODULE_6_aurelia_dependency_injection__["Container"], ModuleAnalyzer, ViewCompiler, CompositionEngine), _dec11(_class18 = class TemplatingEngine {
  constructor(container, moduleAnalyzer, viewCompiler, compositionEngine) {
    this._container = container;
    this._moduleAnalyzer = moduleAnalyzer;
    this._viewCompiler = viewCompiler;
    this._compositionEngine = compositionEngine;
    container.registerInstance(Animator, Animator.instance = new Animator());
  }

  configureAnimator(animator) {
    this._container.unregister(Animator);
    this._container.registerInstance(Animator, Animator.instance = animator);
  }

  compose(context) {
    return this._compositionEngine.compose(context);
  }

  enhance(instruction) {
    if (instruction instanceof __WEBPACK_IMPORTED_MODULE_2_aurelia_pal__["DOM"].Element) {
      instruction = { element: instruction };
    }

    let compilerInstructions = { letExpressions: [] };
    let resources = instruction.resources || this._container.get(ViewResources);

    this._viewCompiler._compileNode(instruction.element, resources, compilerInstructions, instruction.element.parentNode, 'root', true);

    let factory = new ViewFactory(instruction.element, compilerInstructions, resources);
    let container = instruction.container || this._container.createChild();
    let view = factory.create(container, BehaviorInstruction.enhance());

    view.bind(instruction.bindingContext || {}, instruction.overrideContext);

    view.firstChild = view.lastChild = view.fragment;
    view.fragment = __WEBPACK_IMPORTED_MODULE_2_aurelia_pal__["DOM"].createDocumentFragment();
    view.attached();

    return view;
  }
}) || _class18);
/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__("bluebird")))

/***/ },

/***/ 24:
/***/ function(module, exports, __webpack_require__) {

"use strict";
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0_aurelia_logging__ = __webpack_require__(58);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0_aurelia_logging___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_0_aurelia_logging__);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1_aurelia_pal__ = __webpack_require__(21);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1_aurelia_pal___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_1_aurelia_pal__);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2_aurelia_task_queue__ = __webpack_require__(103);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2_aurelia_task_queue___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_2_aurelia_task_queue__);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_3_aurelia_metadata__ = __webpack_require__(43);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_3_aurelia_metadata___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_3_aurelia_metadata__);
/* harmony export (immutable) */ exports["camelCase"] = camelCase;
/* harmony export (immutable) */ exports["createOverrideContext"] = createOverrideContext;
/* harmony export (immutable) */ exports["getContextFor"] = getContextFor;
/* harmony export (immutable) */ exports["createScopeForTest"] = createScopeForTest;
/* harmony export (immutable) */ exports["connectable"] = connectable;
/* harmony export (immutable) */ exports["enqueueBindingConnect"] = enqueueBindingConnect;
/* harmony export (immutable) */ exports["subscriberCollection"] = subscriberCollection;
/* harmony export (binding) */ __webpack_require__.d(exports, "ExpressionObserver", function() { return ExpressionObserver; });
/* harmony export (immutable) */ exports["calcSplices"] = calcSplices;
/* harmony export (immutable) */ exports["mergeSplice"] = mergeSplice;
/* harmony export (immutable) */ exports["projectArraySplices"] = projectArraySplices;
/* harmony export (immutable) */ exports["getChangeRecords"] = getChangeRecords;
/* harmony export (binding) */ __webpack_require__.d(exports, "ModifyCollectionObserver", function() { return ModifyCollectionObserver; });
/* harmony export (binding) */ __webpack_require__.d(exports, "CollectionLengthObserver", function() { return CollectionLengthObserver; });
/* harmony export (immutable) */ exports["getArrayObserver"] = getArrayObserver;
/* harmony export (binding) */ __webpack_require__.d(exports, "Expression", function() { return Expression; });
/* harmony export (binding) */ __webpack_require__.d(exports, "BindingBehavior", function() { return BindingBehavior; });
/* harmony export (binding) */ __webpack_require__.d(exports, "ValueConverter", function() { return ValueConverter; });
/* harmony export (binding) */ __webpack_require__.d(exports, "Assign", function() { return Assign; });
/* harmony export (binding) */ __webpack_require__.d(exports, "Conditional", function() { return Conditional; });
/* harmony export (binding) */ __webpack_require__.d(exports, "AccessThis", function() { return AccessThis; });
/* harmony export (binding) */ __webpack_require__.d(exports, "AccessScope", function() { return AccessScope; });
/* harmony export (binding) */ __webpack_require__.d(exports, "AccessMember", function() { return AccessMember; });
/* harmony export (binding) */ __webpack_require__.d(exports, "AccessKeyed", function() { return AccessKeyed; });
/* harmony export (binding) */ __webpack_require__.d(exports, "CallScope", function() { return CallScope; });
/* harmony export (binding) */ __webpack_require__.d(exports, "CallMember", function() { return CallMember; });
/* harmony export (binding) */ __webpack_require__.d(exports, "CallFunction", function() { return CallFunction; });
/* harmony export (binding) */ __webpack_require__.d(exports, "Binary", function() { return Binary; });
/* harmony export (binding) */ __webpack_require__.d(exports, "Unary", function() { return Unary; });
/* harmony export (binding) */ __webpack_require__.d(exports, "LiteralPrimitive", function() { return LiteralPrimitive; });
/* harmony export (binding) */ __webpack_require__.d(exports, "LiteralString", function() { return LiteralString; });
/* harmony export (binding) */ __webpack_require__.d(exports, "LiteralTemplate", function() { return LiteralTemplate; });
/* harmony export (binding) */ __webpack_require__.d(exports, "LiteralArray", function() { return LiteralArray; });
/* harmony export (binding) */ __webpack_require__.d(exports, "LiteralObject", function() { return LiteralObject; });
/* harmony export (binding) */ __webpack_require__.d(exports, "Unparser", function() { return Unparser; });
/* harmony export (binding) */ __webpack_require__.d(exports, "ExpressionCloner", function() { return ExpressionCloner; });
/* harmony export (immutable) */ exports["cloneExpression"] = cloneExpression;
/* harmony export (binding) */ __webpack_require__.d(exports, "Parser", function() { return Parser; });
/* harmony export (binding) */ __webpack_require__.d(exports, "ParserImplementation", function() { return ParserImplementation; });
/* harmony export (immutable) */ exports["getMapObserver"] = getMapObserver;
/* harmony export (binding) */ __webpack_require__.d(exports, "EventManager", function() { return EventManager; });
/* harmony export (binding) */ __webpack_require__.d(exports, "EventSubscriber", function() { return EventSubscriber; });
/* harmony export (binding) */ __webpack_require__.d(exports, "DirtyChecker", function() { return DirtyChecker; });
/* harmony export (binding) */ __webpack_require__.d(exports, "DirtyCheckProperty", function() { return DirtyCheckProperty; });
/* harmony export (binding) */ __webpack_require__.d(exports, "PrimitiveObserver", function() { return PrimitiveObserver; });
/* harmony export (binding) */ __webpack_require__.d(exports, "SetterObserver", function() { return SetterObserver; });
/* harmony export (binding) */ __webpack_require__.d(exports, "XLinkAttributeObserver", function() { return XLinkAttributeObserver; });
/* harmony export (binding) */ __webpack_require__.d(exports, "DataAttributeObserver", function() { return DataAttributeObserver; });
/* harmony export (binding) */ __webpack_require__.d(exports, "StyleObserver", function() { return StyleObserver; });
/* harmony export (binding) */ __webpack_require__.d(exports, "ValueAttributeObserver", function() { return ValueAttributeObserver; });
/* harmony export (binding) */ __webpack_require__.d(exports, "CheckedObserver", function() { return CheckedObserver; });
/* harmony export (binding) */ __webpack_require__.d(exports, "SelectValueObserver", function() { return SelectValueObserver; });
/* harmony export (binding) */ __webpack_require__.d(exports, "ClassObserver", function() { return ClassObserver; });
/* harmony export (immutable) */ exports["hasDeclaredDependencies"] = hasDeclaredDependencies;
/* harmony export (immutable) */ exports["declarePropertyDependencies"] = declarePropertyDependencies;
/* harmony export (immutable) */ exports["computedFrom"] = computedFrom;
/* harmony export (binding) */ __webpack_require__.d(exports, "ComputedExpression", function() { return ComputedExpression; });
/* harmony export (immutable) */ exports["createComputedObserver"] = createComputedObserver;
/* harmony export (binding) */ __webpack_require__.d(exports, "ObserverLocator", function() { return ObserverLocator; });
/* harmony export (binding) */ __webpack_require__.d(exports, "ObjectObservationAdapter", function() { return ObjectObservationAdapter; });
/* harmony export (binding) */ __webpack_require__.d(exports, "BindingExpression", function() { return BindingExpression; });
/* harmony export (binding) */ __webpack_require__.d(exports, "Binding", function() { return Binding; });
/* harmony export (binding) */ __webpack_require__.d(exports, "CallExpression", function() { return CallExpression; });
/* harmony export (binding) */ __webpack_require__.d(exports, "Call", function() { return Call; });
/* harmony export (binding) */ __webpack_require__.d(exports, "ValueConverterResource", function() { return ValueConverterResource; });
/* harmony export (immutable) */ exports["valueConverter"] = valueConverter;
/* harmony export (binding) */ __webpack_require__.d(exports, "BindingBehaviorResource", function() { return BindingBehaviorResource; });
/* harmony export (immutable) */ exports["bindingBehavior"] = bindingBehavior;
/* harmony export (binding) */ __webpack_require__.d(exports, "ListenerExpression", function() { return ListenerExpression; });
/* harmony export (binding) */ __webpack_require__.d(exports, "Listener", function() { return Listener; });
/* harmony export (binding) */ __webpack_require__.d(exports, "NameExpression", function() { return NameExpression; });
/* harmony export (binding) */ __webpack_require__.d(exports, "BindingEngine", function() { return BindingEngine; });
/* harmony export (immutable) */ exports["getSetObserver"] = getSetObserver;
/* harmony export (immutable) */ exports["observable"] = observable;
/* harmony export (immutable) */ exports["connectBindingToSignal"] = connectBindingToSignal;
/* harmony export (immutable) */ exports["signalBindings"] = signalBindings;
var _dec, _dec2, _class, _dec3, _class2, _dec4, _class3, _dec5, _class5, _dec6, _class7, _dec7, _class8, _dec8, _class9, _dec9, _class10, _class11, _temp, _dec10, _class12, _class13, _temp2;






const targetContext = 'Binding:target';
/* harmony export (immutable) */ exports["targetContext"] = targetContext;

const sourceContext = 'Binding:source';
/* harmony export (immutable) */ exports["sourceContext"] = sourceContext;


const map = Object.create(null);

function camelCase(name) {
  if (name in map) {
    return map[name];
  }
  const result = name.charAt(0).toLowerCase() + name.slice(1).replace(/[_.-](\w|$)/g, (_, x) => x.toUpperCase());
  map[name] = result;
  return result;
}

function createOverrideContext(bindingContext, parentOverrideContext) {
  return {
    bindingContext: bindingContext,
    parentOverrideContext: parentOverrideContext || null
  };
}

function getContextFor(name, scope, ancestor) {
  let oc = scope.overrideContext;

  if (ancestor) {
    while (ancestor && oc) {
      ancestor--;
      oc = oc.parentOverrideContext;
    }
    if (ancestor || !oc) {
      return undefined;
    }
    return name in oc ? oc : oc.bindingContext;
  }

  while (oc && !(name in oc) && !(oc.bindingContext && name in oc.bindingContext)) {
    oc = oc.parentOverrideContext;
  }
  if (oc) {
    return name in oc ? oc : oc.bindingContext;
  }

  return scope.bindingContext || scope.overrideContext;
}

function createScopeForTest(bindingContext, parentBindingContext) {
  if (parentBindingContext) {
    return {
      bindingContext,
      overrideContext: createOverrideContext(bindingContext, createOverrideContext(parentBindingContext))
    };
  }
  return {
    bindingContext,
    overrideContext: createOverrideContext(bindingContext)
  };
}

const slotNames = [];
const versionSlotNames = [];

for (let i = 0; i < 100; i++) {
  slotNames.push(`_observer${i}`);
  versionSlotNames.push(`_observerVersion${i}`);
}

function addObserver(observer) {
  let observerSlots = this._observerSlots === undefined ? 0 : this._observerSlots;
  let i = observerSlots;
  while (i-- && this[slotNames[i]] !== observer) {}

  if (i === -1) {
    i = 0;
    while (this[slotNames[i]]) {
      i++;
    }
    this[slotNames[i]] = observer;
    observer.subscribe(sourceContext, this);

    if (i === observerSlots) {
      this._observerSlots = i + 1;
    }
  }

  if (this._version === undefined) {
    this._version = 0;
  }
  this[versionSlotNames[i]] = this._version;
}

function observeProperty(obj, propertyName) {
  let observer = this.observerLocator.getObserver(obj, propertyName);
  addObserver.call(this, observer);
}

function observeArray(array) {
  let observer = this.observerLocator.getArrayObserver(array);
  addObserver.call(this, observer);
}

function unobserve(all) {
  let i = this._observerSlots;
  while (i--) {
    if (all || this[versionSlotNames[i]] !== this._version) {
      let observer = this[slotNames[i]];
      this[slotNames[i]] = null;
      if (observer) {
        observer.unsubscribe(sourceContext, this);
      }
    }
  }
}

function connectable() {
  return function (target) {
    target.prototype.observeProperty = observeProperty;
    target.prototype.observeArray = observeArray;
    target.prototype.unobserve = unobserve;
    target.prototype.addObserver = addObserver;
  };
}

const queue = [];
const queued = {};
let nextId = 0;
const minimumImmediate = 100;
const frameBudget = 15;

let isFlushRequested = false;
let immediate = 0;

function flush(animationFrameStart) {
  const length = queue.length;
  let i = 0;
  while (i < length) {
    const binding = queue[i];
    queued[binding.__connectQueueId] = false;
    binding.connect(true);
    i++;

    if (i % 100 === 0 && __WEBPACK_IMPORTED_MODULE_1_aurelia_pal__["PLATFORM"].performance.now() - animationFrameStart > frameBudget) {
      break;
    }
  }
  queue.splice(0, i);

  if (queue.length) {
    __WEBPACK_IMPORTED_MODULE_1_aurelia_pal__["PLATFORM"].requestAnimationFrame(flush);
  } else {
    isFlushRequested = false;
    immediate = 0;
  }
}

function enqueueBindingConnect(binding) {
  if (immediate < minimumImmediate) {
    immediate++;
    binding.connect(false);
  } else {
    let id = binding.__connectQueueId;
    if (id === undefined) {
      id = nextId;
      nextId++;
      binding.__connectQueueId = id;
    }

    if (!queued[id]) {
      queue.push(binding);
      queued[id] = true;
    }
  }
  if (!isFlushRequested) {
    isFlushRequested = true;
    __WEBPACK_IMPORTED_MODULE_1_aurelia_pal__["PLATFORM"].requestAnimationFrame(flush);
  }
}

function addSubscriber(context, callable) {
  if (this.hasSubscriber(context, callable)) {
    return false;
  }
  if (!this._context0) {
    this._context0 = context;
    this._callable0 = callable;
    return true;
  }
  if (!this._context1) {
    this._context1 = context;
    this._callable1 = callable;
    return true;
  }
  if (!this._context2) {
    this._context2 = context;
    this._callable2 = callable;
    return true;
  }
  if (!this._contextsRest) {
    this._contextsRest = [context];
    this._callablesRest = [callable];
    return true;
  }
  this._contextsRest.push(context);
  this._callablesRest.push(callable);
  return true;
}

function removeSubscriber(context, callable) {
  if (this._context0 === context && this._callable0 === callable) {
    this._context0 = null;
    this._callable0 = null;
    return true;
  }
  if (this._context1 === context && this._callable1 === callable) {
    this._context1 = null;
    this._callable1 = null;
    return true;
  }
  if (this._context2 === context && this._callable2 === callable) {
    this._context2 = null;
    this._callable2 = null;
    return true;
  }
  const callables = this._callablesRest;
  if (callables === undefined || callables.length === 0) {
    return false;
  }
  const contexts = this._contextsRest;
  let i = 0;
  while (!(callables[i] === callable && contexts[i] === context) && callables.length > i) {
    i++;
  }
  if (i >= callables.length) {
    return false;
  }
  contexts.splice(i, 1);
  callables.splice(i, 1);
  return true;
}

let arrayPool1 = [];
let arrayPool2 = [];
let poolUtilization = [];

function callSubscribers(newValue, oldValue) {
  let context0 = this._context0;
  let callable0 = this._callable0;
  let context1 = this._context1;
  let callable1 = this._callable1;
  let context2 = this._context2;
  let callable2 = this._callable2;
  let length = this._contextsRest ? this._contextsRest.length : 0;
  let contextsRest;
  let callablesRest;
  let poolIndex;
  let i;
  if (length) {
    poolIndex = poolUtilization.length;
    while (poolIndex-- && poolUtilization[poolIndex]) {}
    if (poolIndex < 0) {
      poolIndex = poolUtilization.length;
      contextsRest = [];
      callablesRest = [];
      poolUtilization.push(true);
      arrayPool1.push(contextsRest);
      arrayPool2.push(callablesRest);
    } else {
      poolUtilization[poolIndex] = true;
      contextsRest = arrayPool1[poolIndex];
      callablesRest = arrayPool2[poolIndex];
    }

    i = length;
    while (i--) {
      contextsRest[i] = this._contextsRest[i];
      callablesRest[i] = this._callablesRest[i];
    }
  }

  if (context0) {
    if (callable0) {
      callable0.call(context0, newValue, oldValue);
    } else {
      context0(newValue, oldValue);
    }
  }
  if (context1) {
    if (callable1) {
      callable1.call(context1, newValue, oldValue);
    } else {
      context1(newValue, oldValue);
    }
  }
  if (context2) {
    if (callable2) {
      callable2.call(context2, newValue, oldValue);
    } else {
      context2(newValue, oldValue);
    }
  }
  if (length) {
    for (i = 0; i < length; i++) {
      let callable = callablesRest[i];
      let context = contextsRest[i];
      if (callable) {
        callable.call(context, newValue, oldValue);
      } else {
        context(newValue, oldValue);
      }
      contextsRest[i] = null;
      callablesRest[i] = null;
    }
    poolUtilization[poolIndex] = false;
  }
}

function hasSubscribers() {
  return !!(this._context0 || this._context1 || this._context2 || this._contextsRest && this._contextsRest.length);
}

function hasSubscriber(context, callable) {
  let has = this._context0 === context && this._callable0 === callable || this._context1 === context && this._callable1 === callable || this._context2 === context && this._callable2 === callable;
  if (has) {
    return true;
  }
  let index;
  let contexts = this._contextsRest;
  if (!contexts || (index = contexts.length) === 0) {
    return false;
  }
  let callables = this._callablesRest;
  while (index--) {
    if (contexts[index] === context && callables[index] === callable) {
      return true;
    }
  }
  return false;
}

function subscriberCollection() {
  return function (target) {
    target.prototype.addSubscriber = addSubscriber;
    target.prototype.removeSubscriber = removeSubscriber;
    target.prototype.callSubscribers = callSubscribers;
    target.prototype.hasSubscribers = hasSubscribers;
    target.prototype.hasSubscriber = hasSubscriber;
  };
}

let ExpressionObserver = (_dec = connectable(), _dec2 = subscriberCollection(), _dec(_class = _dec2(_class = class ExpressionObserver {
  constructor(scope, expression, observerLocator, lookupFunctions) {
    this.scope = scope;
    this.expression = expression;
    this.observerLocator = observerLocator;
    this.lookupFunctions = lookupFunctions;
  }

  getValue() {
    return this.expression.evaluate(this.scope, this.lookupFunctions);
  }

  setValue(newValue) {
    this.expression.assign(this.scope, newValue);
  }

  subscribe(context, callable) {
    if (!this.hasSubscribers()) {
      this.oldValue = this.expression.evaluate(this.scope, this.lookupFunctions);
      this.expression.connect(this, this.scope);
    }
    this.addSubscriber(context, callable);
    if (arguments.length === 1 && context instanceof Function) {
      return {
        dispose: () => {
          this.unsubscribe(context, callable);
        }
      };
    }
  }

  unsubscribe(context, callable) {
    if (this.removeSubscriber(context, callable) && !this.hasSubscribers()) {
      this.unobserve(true);
      this.oldValue = undefined;
    }
  }

  call() {
    let newValue = this.expression.evaluate(this.scope, this.lookupFunctions);
    let oldValue = this.oldValue;
    if (newValue !== oldValue) {
      this.oldValue = newValue;
      this.callSubscribers(newValue, oldValue);
    }
    this._version++;
    this.expression.connect(this, this.scope);
    this.unobserve(false);
  }
}) || _class) || _class);

function isIndex(s) {
  return +s === s >>> 0;
}

function toNumber(s) {
  return +s;
}

function newSplice(index, removed, addedCount) {
  return {
    index: index,
    removed: removed,
    addedCount: addedCount
  };
}

const EDIT_LEAVE = 0;
const EDIT_UPDATE = 1;
const EDIT_ADD = 2;
const EDIT_DELETE = 3;

function ArraySplice() {}

ArraySplice.prototype = {
  calcEditDistances: function (current, currentStart, currentEnd, old, oldStart, oldEnd) {
    let rowCount = oldEnd - oldStart + 1;
    let columnCount = currentEnd - currentStart + 1;
    let distances = new Array(rowCount);
    let north;
    let west;

    for (let i = 0; i < rowCount; ++i) {
      distances[i] = new Array(columnCount);
      distances[i][0] = i;
    }

    for (let j = 0; j < columnCount; ++j) {
      distances[0][j] = j;
    }

    for (let i = 1; i < rowCount; ++i) {
      for (let j = 1; j < columnCount; ++j) {
        if (this.equals(current[currentStart + j - 1], old[oldStart + i - 1])) {
          distances[i][j] = distances[i - 1][j - 1];
        } else {
          north = distances[i - 1][j] + 1;
          west = distances[i][j - 1] + 1;
          distances[i][j] = north < west ? north : west;
        }
      }
    }

    return distances;
  },

  spliceOperationsFromEditDistances: function (distances) {
    let i = distances.length - 1;
    let j = distances[0].length - 1;
    let current = distances[i][j];
    let edits = [];
    while (i > 0 || j > 0) {
      if (i === 0) {
        edits.push(EDIT_ADD);
        j--;
        continue;
      }
      if (j === 0) {
        edits.push(EDIT_DELETE);
        i--;
        continue;
      }
      let northWest = distances[i - 1][j - 1];
      let west = distances[i - 1][j];
      let north = distances[i][j - 1];

      let min;
      if (west < north) {
        min = west < northWest ? west : northWest;
      } else {
        min = north < northWest ? north : northWest;
      }

      if (min === northWest) {
        if (northWest === current) {
          edits.push(EDIT_LEAVE);
        } else {
          edits.push(EDIT_UPDATE);
          current = northWest;
        }
        i--;
        j--;
      } else if (min === west) {
        edits.push(EDIT_DELETE);
        i--;
        current = west;
      } else {
        edits.push(EDIT_ADD);
        j--;
        current = north;
      }
    }

    edits.reverse();
    return edits;
  },

  calcSplices: function (current, currentStart, currentEnd, old, oldStart, oldEnd) {
    let prefixCount = 0;
    let suffixCount = 0;

    let minLength = Math.min(currentEnd - currentStart, oldEnd - oldStart);
    if (currentStart === 0 && oldStart === 0) {
      prefixCount = this.sharedPrefix(current, old, minLength);
    }

    if (currentEnd === current.length && oldEnd === old.length) {
      suffixCount = this.sharedSuffix(current, old, minLength - prefixCount);
    }

    currentStart += prefixCount;
    oldStart += prefixCount;
    currentEnd -= suffixCount;
    oldEnd -= suffixCount;

    if (currentEnd - currentStart === 0 && oldEnd - oldStart === 0) {
      return [];
    }

    if (currentStart === currentEnd) {
      let splice = newSplice(currentStart, [], 0);
      while (oldStart < oldEnd) {
        splice.removed.push(old[oldStart++]);
      }

      return [splice];
    } else if (oldStart === oldEnd) {
      return [newSplice(currentStart, [], currentEnd - currentStart)];
    }

    let ops = this.spliceOperationsFromEditDistances(this.calcEditDistances(current, currentStart, currentEnd, old, oldStart, oldEnd));

    let splice = undefined;
    let splices = [];
    let index = currentStart;
    let oldIndex = oldStart;
    for (let i = 0; i < ops.length; ++i) {
      switch (ops[i]) {
        case EDIT_LEAVE:
          if (splice) {
            splices.push(splice);
            splice = undefined;
          }

          index++;
          oldIndex++;
          break;
        case EDIT_UPDATE:
          if (!splice) {
            splice = newSplice(index, [], 0);
          }

          splice.addedCount++;
          index++;

          splice.removed.push(old[oldIndex]);
          oldIndex++;
          break;
        case EDIT_ADD:
          if (!splice) {
            splice = newSplice(index, [], 0);
          }

          splice.addedCount++;
          index++;
          break;
        case EDIT_DELETE:
          if (!splice) {
            splice = newSplice(index, [], 0);
          }

          splice.removed.push(old[oldIndex]);
          oldIndex++;
          break;
      }
    }

    if (splice) {
      splices.push(splice);
    }
    return splices;
  },

  sharedPrefix: function (current, old, searchLength) {
    for (let i = 0; i < searchLength; ++i) {
      if (!this.equals(current[i], old[i])) {
        return i;
      }
    }

    return searchLength;
  },

  sharedSuffix: function (current, old, searchLength) {
    let index1 = current.length;
    let index2 = old.length;
    let count = 0;
    while (count < searchLength && this.equals(current[--index1], old[--index2])) {
      count++;
    }

    return count;
  },

  calculateSplices: function (current, previous) {
    return this.calcSplices(current, 0, current.length, previous, 0, previous.length);
  },

  equals: function (currentValue, previousValue) {
    return currentValue === previousValue;
  }
};

let arraySplice = new ArraySplice();

function calcSplices(current, currentStart, currentEnd, old, oldStart, oldEnd) {
  return arraySplice.calcSplices(current, currentStart, currentEnd, old, oldStart, oldEnd);
}

function intersect(start1, end1, start2, end2) {
  if (end1 < start2 || end2 < start1) {
    return -1;
  }

  if (end1 === start2 || end2 === start1) {
    return 0;
  }

  if (start1 < start2) {
    if (end1 < end2) {
      return end1 - start2;
    }

    return end2 - start2;
  }

  if (end2 < end1) {
    return end2 - start1;
  }

  return end1 - start1;
}

function mergeSplice(splices, index, removed, addedCount) {
  let splice = newSplice(index, removed, addedCount);

  let inserted = false;
  let insertionOffset = 0;

  for (let i = 0; i < splices.length; i++) {
    let current = splices[i];
    current.index += insertionOffset;

    if (inserted) {
      continue;
    }

    let intersectCount = intersect(splice.index, splice.index + splice.removed.length, current.index, current.index + current.addedCount);

    if (intersectCount >= 0) {

      splices.splice(i, 1);
      i--;

      insertionOffset -= current.addedCount - current.removed.length;

      splice.addedCount += current.addedCount - intersectCount;
      let deleteCount = splice.removed.length + current.removed.length - intersectCount;

      if (!splice.addedCount && !deleteCount) {
        inserted = true;
      } else {
        let currentRemoved = current.removed;

        if (splice.index < current.index) {
          let prepend = splice.removed.slice(0, current.index - splice.index);
          Array.prototype.push.apply(prepend, currentRemoved);
          currentRemoved = prepend;
        }

        if (splice.index + splice.removed.length > current.index + current.addedCount) {
          let append = splice.removed.slice(current.index + current.addedCount - splice.index);
          Array.prototype.push.apply(currentRemoved, append);
        }

        splice.removed = currentRemoved;
        if (current.index < splice.index) {
          splice.index = current.index;
        }
      }
    } else if (splice.index < current.index) {

      inserted = true;

      splices.splice(i, 0, splice);
      i++;

      let offset = splice.addedCount - splice.removed.length;
      current.index += offset;
      insertionOffset += offset;
    }
  }

  if (!inserted) {
    splices.push(splice);
  }
}

function createInitialSplices(array, changeRecords) {
  let splices = [];

  for (let i = 0; i < changeRecords.length; i++) {
    let record = changeRecords[i];
    switch (record.type) {
      case 'splice':
        mergeSplice(splices, record.index, record.removed.slice(), record.addedCount);
        break;
      case 'add':
      case 'update':
      case 'delete':
        if (!isIndex(record.name)) {
          continue;
        }

        let index = toNumber(record.name);
        if (index < 0) {
          continue;
        }

        mergeSplice(splices, index, [record.oldValue], record.type === 'delete' ? 0 : 1);
        break;
      default:
        console.error('Unexpected record type: ' + JSON.stringify(record));
        break;
    }
  }

  return splices;
}

function projectArraySplices(array, changeRecords) {
  let splices = [];

  createInitialSplices(array, changeRecords).forEach(function (splice) {
    if (splice.addedCount === 1 && splice.removed.length === 1) {
      if (splice.removed[0] !== array[splice.index]) {
        splices.push(splice);
      }

      return;
    }

    splices = splices.concat(calcSplices(array, splice.index, splice.index + splice.addedCount, splice.removed, 0, splice.removed.length));
  });

  return splices;
}

function newRecord(type, object, key, oldValue) {
  return {
    type: type,
    object: object,
    key: key,
    oldValue: oldValue
  };
}

function getChangeRecords(map) {
  let entries = new Array(map.size);
  let keys = map.keys();
  let i = 0;
  let item;

  while (item = keys.next()) {
    if (item.done) {
      break;
    }

    entries[i] = newRecord('added', map, item.value);
    i++;
  }

  return entries;
}

let ModifyCollectionObserver = (_dec3 = subscriberCollection(), _dec3(_class2 = class ModifyCollectionObserver {
  constructor(taskQueue, collection) {
    this.taskQueue = taskQueue;
    this.queued = false;
    this.changeRecords = null;
    this.oldCollection = null;
    this.collection = collection;
    this.lengthPropertyName = collection instanceof Map || collection instanceof Set ? 'size' : 'length';
  }

  subscribe(context, callable) {
    this.addSubscriber(context, callable);
  }

  unsubscribe(context, callable) {
    this.removeSubscriber(context, callable);
  }

  addChangeRecord(changeRecord) {
    if (!this.hasSubscribers() && !this.lengthObserver) {
      return;
    }

    if (changeRecord.type === 'splice') {
      let index = changeRecord.index;
      let arrayLength = changeRecord.object.length;
      if (index > arrayLength) {
        index = arrayLength - changeRecord.addedCount;
      } else if (index < 0) {
        index = arrayLength + changeRecord.removed.length + index - changeRecord.addedCount;
      }
      if (index < 0) {
        index = 0;
      }
      changeRecord.index = index;
    }

    if (this.changeRecords === null) {
      this.changeRecords = [changeRecord];
    } else {
      this.changeRecords.push(changeRecord);
    }

    if (!this.queued) {
      this.queued = true;
      this.taskQueue.queueMicroTask(this);
    }
  }

  flushChangeRecords() {
    if (this.changeRecords && this.changeRecords.length || this.oldCollection) {
      this.call();
    }
  }

  reset(oldCollection) {
    this.oldCollection = oldCollection;

    if (this.hasSubscribers() && !this.queued) {
      this.queued = true;
      this.taskQueue.queueMicroTask(this);
    }
  }

  getLengthObserver() {
    return this.lengthObserver || (this.lengthObserver = new CollectionLengthObserver(this.collection));
  }

  call() {
    let changeRecords = this.changeRecords;
    let oldCollection = this.oldCollection;
    let records;

    this.queued = false;
    this.changeRecords = [];
    this.oldCollection = null;

    if (this.hasSubscribers()) {
      if (oldCollection) {
        if (this.collection instanceof Map || this.collection instanceof Set) {
          records = getChangeRecords(oldCollection);
        } else {
          records = calcSplices(this.collection, 0, this.collection.length, oldCollection, 0, oldCollection.length);
        }
      } else {
        if (this.collection instanceof Map || this.collection instanceof Set) {
          records = changeRecords;
        } else {
          records = projectArraySplices(this.collection, changeRecords);
        }
      }

      this.callSubscribers(records);
    }

    if (this.lengthObserver) {
      this.lengthObserver.call(this.collection[this.lengthPropertyName]);
    }
  }
}) || _class2);

let CollectionLengthObserver = (_dec4 = subscriberCollection(), _dec4(_class3 = class CollectionLengthObserver {
  constructor(collection) {
    this.collection = collection;
    this.lengthPropertyName = collection instanceof Map || collection instanceof Set ? 'size' : 'length';
    this.currentValue = collection[this.lengthPropertyName];
  }

  getValue() {
    return this.collection[this.lengthPropertyName];
  }

  setValue(newValue) {
    this.collection[this.lengthPropertyName] = newValue;
  }

  subscribe(context, callable) {
    this.addSubscriber(context, callable);
  }

  unsubscribe(context, callable) {
    this.removeSubscriber(context, callable);
  }

  call(newValue) {
    let oldValue = this.currentValue;
    this.callSubscribers(newValue, oldValue);
    this.currentValue = newValue;
  }
}) || _class3);

const arrayProto = Array.prototype;
const pop = arrayProto.pop;
const push = arrayProto.push;
const reverse = arrayProto.reverse;
const shift = arrayProto.shift;
const sort = arrayProto.sort;
const splice = arrayProto.splice;
const unshift = arrayProto.unshift;

if (arrayProto.__au_patched__) {
  __WEBPACK_IMPORTED_MODULE_0_aurelia_logging__["getLogger"]('array-observation').warn('Detected 2nd attempt of patching array from Aurelia binding.' + ' This is probably caused by dependency mismatch between core modules and a 3rd party plugin.' + ' Please see https://github.com/aurelia/cli/pull/906 if you are using webpack.');
} else {
  Reflect.defineProperty(arrayProto, '__au_patched__', { value: 1 });
  arrayProto.pop = function () {
    let notEmpty = this.length > 0;
    let methodCallResult = pop.apply(this, arguments);
    if (notEmpty && this.__array_observer__ !== undefined) {
      this.__array_observer__.addChangeRecord({
        type: 'delete',
        object: this,
        name: this.length,
        oldValue: methodCallResult
      });
    }
    return methodCallResult;
  };

  arrayProto.push = function () {
    let methodCallResult = push.apply(this, arguments);
    if (this.__array_observer__ !== undefined) {
      this.__array_observer__.addChangeRecord({
        type: 'splice',
        object: this,
        index: this.length - arguments.length,
        removed: [],
        addedCount: arguments.length
      });
    }
    return methodCallResult;
  };

  arrayProto.reverse = function () {
    let oldArray;
    if (this.__array_observer__ !== undefined) {
      this.__array_observer__.flushChangeRecords();
      oldArray = this.slice();
    }
    let methodCallResult = reverse.apply(this, arguments);
    if (this.__array_observer__ !== undefined) {
      this.__array_observer__.reset(oldArray);
    }
    return methodCallResult;
  };

  arrayProto.shift = function () {
    let notEmpty = this.length > 0;
    let methodCallResult = shift.apply(this, arguments);
    if (notEmpty && this.__array_observer__ !== undefined) {
      this.__array_observer__.addChangeRecord({
        type: 'delete',
        object: this,
        name: 0,
        oldValue: methodCallResult
      });
    }
    return methodCallResult;
  };

  arrayProto.sort = function () {
    let oldArray;
    if (this.__array_observer__ !== undefined) {
      this.__array_observer__.flushChangeRecords();
      oldArray = this.slice();
    }
    let methodCallResult = sort.apply(this, arguments);
    if (this.__array_observer__ !== undefined) {
      this.__array_observer__.reset(oldArray);
    }
    return methodCallResult;
  };

  arrayProto.splice = function () {
    let methodCallResult = splice.apply(this, arguments);
    if (this.__array_observer__ !== undefined) {
      this.__array_observer__.addChangeRecord({
        type: 'splice',
        object: this,
        index: +arguments[0],
        removed: methodCallResult,
        addedCount: arguments.length > 2 ? arguments.length - 2 : 0
      });
    }
    return methodCallResult;
  };

  arrayProto.unshift = function () {
    let methodCallResult = unshift.apply(this, arguments);
    if (this.__array_observer__ !== undefined) {
      this.__array_observer__.addChangeRecord({
        type: 'splice',
        object: this,
        index: 0,
        removed: [],
        addedCount: arguments.length
      });
    }
    return methodCallResult;
  };
}

function getArrayObserver(taskQueue, array) {
  return ModifyArrayObserver.for(taskQueue, array);
}

let ModifyArrayObserver = class ModifyArrayObserver extends ModifyCollectionObserver {
  constructor(taskQueue, array) {
    super(taskQueue, array);
  }

  static for(taskQueue, array) {
    if (!('__array_observer__' in array)) {
      Reflect.defineProperty(array, '__array_observer__', {
        value: ModifyArrayObserver.create(taskQueue, array),
        enumerable: false, configurable: false
      });
    }
    return array.__array_observer__;
  }

  static create(taskQueue, array) {
    return new ModifyArrayObserver(taskQueue, array);
  }
};


let Expression = class Expression {
  constructor() {
    this.isAssignable = false;
  }

  evaluate(scope, lookupFunctions, args) {
    throw new Error(`Binding expression "${this}" cannot be evaluated.`);
  }

  assign(scope, value, lookupFunctions) {
    throw new Error(`Binding expression "${this}" cannot be assigned to.`);
  }

  toString() {
    return typeof FEATURE_NO_UNPARSER === 'undefined' ? Unparser.unparse(this) : super.toString();
  }
};

let BindingBehavior = class BindingBehavior extends Expression {
  constructor(expression, name, args) {
    super();

    this.expression = expression;
    this.name = name;
    this.args = args;
  }

  evaluate(scope, lookupFunctions) {
    return this.expression.evaluate(scope, lookupFunctions);
  }

  assign(scope, value, lookupFunctions) {
    return this.expression.assign(scope, value, lookupFunctions);
  }

  accept(visitor) {
    return visitor.visitBindingBehavior(this);
  }

  connect(binding, scope) {
    this.expression.connect(binding, scope);
  }

  bind(binding, scope, lookupFunctions) {
    if (this.expression.expression && this.expression.bind) {
      this.expression.bind(binding, scope, lookupFunctions);
    }
    let behavior = lookupFunctions.bindingBehaviors(this.name);
    if (!behavior) {
      throw new Error(`No BindingBehavior named "${this.name}" was found!`);
    }
    let behaviorKey = `behavior-${this.name}`;
    if (binding[behaviorKey]) {
      throw new Error(`A binding behavior named "${this.name}" has already been applied to "${this.expression}"`);
    }
    binding[behaviorKey] = behavior;
    behavior.bind.apply(behavior, [binding, scope].concat(evalList(scope, this.args, binding.lookupFunctions)));
  }

  unbind(binding, scope) {
    let behaviorKey = `behavior-${this.name}`;
    binding[behaviorKey].unbind(binding, scope);
    binding[behaviorKey] = null;
    if (this.expression.expression && this.expression.unbind) {
      this.expression.unbind(binding, scope);
    }
  }
};

let ValueConverter = class ValueConverter extends Expression {
  constructor(expression, name, args) {
    super();

    this.expression = expression;
    this.name = name;
    this.args = args;
    this.allArgs = [expression].concat(args);
  }

  evaluate(scope, lookupFunctions) {
    let converter = lookupFunctions.valueConverters(this.name);
    if (!converter) {
      throw new Error(`No ValueConverter named "${this.name}" was found!`);
    }

    if ('toView' in converter) {
      return converter.toView.apply(converter, evalList(scope, this.allArgs, lookupFunctions));
    }

    return this.allArgs[0].evaluate(scope, lookupFunctions);
  }

  assign(scope, value, lookupFunctions) {
    let converter = lookupFunctions.valueConverters(this.name);
    if (!converter) {
      throw new Error(`No ValueConverter named "${this.name}" was found!`);
    }

    if ('fromView' in converter) {
      value = converter.fromView.apply(converter, [value].concat(evalList(scope, this.args, lookupFunctions)));
    }

    return this.allArgs[0].assign(scope, value, lookupFunctions);
  }

  accept(visitor) {
    return visitor.visitValueConverter(this);
  }

  connect(binding, scope) {
    let expressions = this.allArgs;
    let i = expressions.length;
    while (i--) {
      expressions[i].connect(binding, scope);
    }
    let converter = binding.lookupFunctions.valueConverters(this.name);
    if (!converter) {
      throw new Error(`No ValueConverter named "${this.name}" was found!`);
    }
    let signals = converter.signals;
    if (signals === undefined) {
      return;
    }
    i = signals.length;
    while (i--) {
      connectBindingToSignal(binding, signals[i]);
    }
  }
};

let Assign = class Assign extends Expression {
  constructor(target, value) {
    super();

    this.target = target;
    this.value = value;
    this.isAssignable = true;
  }

  evaluate(scope, lookupFunctions) {
    return this.target.assign(scope, this.value.evaluate(scope, lookupFunctions));
  }

  accept(vistor) {
    vistor.visitAssign(this);
  }

  connect(binding, scope) {}

  assign(scope, value) {
    this.value.assign(scope, value);
    this.target.assign(scope, value);
  }
};

let Conditional = class Conditional extends Expression {
  constructor(condition, yes, no) {
    super();

    this.condition = condition;
    this.yes = yes;
    this.no = no;
  }

  evaluate(scope, lookupFunctions) {
    return !!this.condition.evaluate(scope, lookupFunctions) ? this.yes.evaluate(scope, lookupFunctions) : this.no.evaluate(scope, lookupFunctions);
  }

  accept(visitor) {
    return visitor.visitConditional(this);
  }

  connect(binding, scope) {
    this.condition.connect(binding, scope);
    if (this.condition.evaluate(scope)) {
      this.yes.connect(binding, scope);
    } else {
      this.no.connect(binding, scope);
    }
  }
};

let AccessThis = class AccessThis extends Expression {
  constructor(ancestor) {
    super();
    this.ancestor = ancestor;
  }

  evaluate(scope, lookupFunctions) {
    let oc = scope.overrideContext;
    let i = this.ancestor;
    while (i-- && oc) {
      oc = oc.parentOverrideContext;
    }
    return i < 1 && oc ? oc.bindingContext : undefined;
  }

  accept(visitor) {
    return visitor.visitAccessThis(this);
  }

  connect(binding, scope) {}
};

let AccessScope = class AccessScope extends Expression {
  constructor(name, ancestor) {
    super();

    this.name = name;
    this.ancestor = ancestor;
    this.isAssignable = true;
  }

  evaluate(scope, lookupFunctions) {
    let context = getContextFor(this.name, scope, this.ancestor);
    return context[this.name];
  }

  assign(scope, value) {
    let context = getContextFor(this.name, scope, this.ancestor);
    return context ? context[this.name] = value : undefined;
  }

  accept(visitor) {
    return visitor.visitAccessScope(this);
  }

  connect(binding, scope) {
    let context = getContextFor(this.name, scope, this.ancestor);
    binding.observeProperty(context, this.name);
  }
};

let AccessMember = class AccessMember extends Expression {
  constructor(object, name) {
    super();

    this.object = object;
    this.name = name;
    this.isAssignable = true;
  }

  evaluate(scope, lookupFunctions) {
    let instance = this.object.evaluate(scope, lookupFunctions);
    return instance === null || instance === undefined ? instance : instance[this.name];
  }

  assign(scope, value) {
    let instance = this.object.evaluate(scope);

    if (instance === null || instance === undefined) {
      instance = {};
      this.object.assign(scope, instance);
    }

    instance[this.name] = value;
    return value;
  }

  accept(visitor) {
    return visitor.visitAccessMember(this);
  }

  connect(binding, scope) {
    this.object.connect(binding, scope);
    let obj = this.object.evaluate(scope);
    if (obj) {
      binding.observeProperty(obj, this.name);
    }
  }
};

let AccessKeyed = class AccessKeyed extends Expression {
  constructor(object, key) {
    super();

    this.object = object;
    this.key = key;
    this.isAssignable = true;
  }

  evaluate(scope, lookupFunctions) {
    let instance = this.object.evaluate(scope, lookupFunctions);
    let lookup = this.key.evaluate(scope, lookupFunctions);
    return getKeyed(instance, lookup);
  }

  assign(scope, value) {
    let instance = this.object.evaluate(scope);
    let lookup = this.key.evaluate(scope);
    return setKeyed(instance, lookup, value);
  }

  accept(visitor) {
    return visitor.visitAccessKeyed(this);
  }

  connect(binding, scope) {
    this.object.connect(binding, scope);
    let obj = this.object.evaluate(scope);
    if (obj instanceof Object) {
      this.key.connect(binding, scope);
      let key = this.key.evaluate(scope);

      if (key !== null && key !== undefined && !(Array.isArray(obj) && typeof key === 'number')) {
        binding.observeProperty(obj, key);
      }
    }
  }
};

let CallScope = class CallScope extends Expression {
  constructor(name, args, ancestor) {
    super();

    this.name = name;
    this.args = args;
    this.ancestor = ancestor;
  }

  evaluate(scope, lookupFunctions, mustEvaluate) {
    let args = evalList(scope, this.args, lookupFunctions);
    let context = getContextFor(this.name, scope, this.ancestor);
    let func = getFunction(context, this.name, mustEvaluate);
    if (func) {
      return func.apply(context, args);
    }
    return undefined;
  }

  accept(visitor) {
    return visitor.visitCallScope(this);
  }

  connect(binding, scope) {
    let args = this.args;
    let i = args.length;
    while (i--) {
      args[i].connect(binding, scope);
    }
  }
};

let CallMember = class CallMember extends Expression {
  constructor(object, name, args) {
    super();

    this.object = object;
    this.name = name;
    this.args = args;
  }

  evaluate(scope, lookupFunctions, mustEvaluate) {
    let instance = this.object.evaluate(scope, lookupFunctions);
    let args = evalList(scope, this.args, lookupFunctions);
    let func = getFunction(instance, this.name, mustEvaluate);
    if (func) {
      return func.apply(instance, args);
    }
    return undefined;
  }

  accept(visitor) {
    return visitor.visitCallMember(this);
  }

  connect(binding, scope) {
    this.object.connect(binding, scope);
    let obj = this.object.evaluate(scope);
    if (getFunction(obj, this.name, false)) {
      let args = this.args;
      let i = args.length;
      while (i--) {
        args[i].connect(binding, scope);
      }
    }
  }
};

let CallFunction = class CallFunction extends Expression {
  constructor(func, args) {
    super();

    this.func = func;
    this.args = args;
  }

  evaluate(scope, lookupFunctions, mustEvaluate) {
    let func = this.func.evaluate(scope, lookupFunctions);
    if (typeof func === 'function') {
      return func.apply(null, evalList(scope, this.args, lookupFunctions));
    }
    if (!mustEvaluate && (func === null || func === undefined)) {
      return undefined;
    }
    throw new Error(`${this.func} is not a function`);
  }

  accept(visitor) {
    return visitor.visitCallFunction(this);
  }

  connect(binding, scope) {
    this.func.connect(binding, scope);
    let func = this.func.evaluate(scope);
    if (typeof func === 'function') {
      let args = this.args;
      let i = args.length;
      while (i--) {
        args[i].connect(binding, scope);
      }
    }
  }
};

let Binary = class Binary extends Expression {
  constructor(operation, left, right) {
    super();

    this.operation = operation;
    this.left = left;
    this.right = right;
  }

  evaluate(scope, lookupFunctions) {
    let left = this.left.evaluate(scope, lookupFunctions);

    switch (this.operation) {
      case '&&':
        return left && this.right.evaluate(scope, lookupFunctions);
      case '||':
        return left || this.right.evaluate(scope, lookupFunctions);
    }

    let right = this.right.evaluate(scope, lookupFunctions);

    switch (this.operation) {
      case '==':
        return left == right;
      case '===':
        return left === right;
      case '!=':
        return left != right;
      case '!==':
        return left !== right;
      case 'instanceof':
        return typeof right === 'function' && left instanceof right;
      case 'in':
        return typeof right === 'object' && right !== null && left in right;
    }

    if (left === null || right === null || left === undefined || right === undefined) {
      switch (this.operation) {
        case '+':
          if (left !== null && left !== undefined) return left;
          if (right !== null && right !== undefined) return right;
          return 0;
        case '-':
          if (left !== null && left !== undefined) return left;
          if (right !== null && right !== undefined) return 0 - right;
          return 0;
      }

      return null;
    }

    switch (this.operation) {
      case '+':
        return autoConvertAdd(left, right);
      case '-':
        return left - right;
      case '*':
        return left * right;
      case '/':
        return left / right;
      case '%':
        return left % right;
      case '<':
        return left < right;
      case '>':
        return left > right;
      case '<=':
        return left <= right;
      case '>=':
        return left >= right;
      case '^':
        return left ^ right;
    }

    throw new Error(`Internal error [${this.operation}] not handled`);
  }

  accept(visitor) {
    return visitor.visitBinary(this);
  }

  connect(binding, scope) {
    this.left.connect(binding, scope);
    let left = this.left.evaluate(scope);
    if (this.operation === '&&' && !left || this.operation === '||' && left) {
      return;
    }
    this.right.connect(binding, scope);
  }
};

let Unary = class Unary extends Expression {
  constructor(operation, expression) {
    super();

    this.operation = operation;
    this.expression = expression;
  }

  evaluate(scope, lookupFunctions) {
    switch (this.operation) {
      case '!':
        return !this.expression.evaluate(scope, lookupFunctions);
      case 'typeof':
        return typeof this.expression.evaluate(scope, lookupFunctions);
      case 'void':
        return void this.expression.evaluate(scope, lookupFunctions);
    }

    throw new Error(`Internal error [${this.operation}] not handled`);
  }

  accept(visitor) {
    return visitor.visitPrefix(this);
  }

  connect(binding, scope) {
    this.expression.connect(binding, scope);
  }
};

let LiteralPrimitive = class LiteralPrimitive extends Expression {
  constructor(value) {
    super();

    this.value = value;
  }

  evaluate(scope, lookupFunctions) {
    return this.value;
  }

  accept(visitor) {
    return visitor.visitLiteralPrimitive(this);
  }

  connect(binding, scope) {}
};

let LiteralString = class LiteralString extends Expression {
  constructor(value) {
    super();

    this.value = value;
  }

  evaluate(scope, lookupFunctions) {
    return this.value;
  }

  accept(visitor) {
    return visitor.visitLiteralString(this);
  }

  connect(binding, scope) {}
};

let LiteralTemplate = class LiteralTemplate extends Expression {
  constructor(cooked, expressions, raw, tag) {
    super();
    this.cooked = cooked;
    this.expressions = expressions || [];
    this.length = this.expressions.length;
    this.tagged = tag !== undefined;
    if (this.tagged) {
      this.cooked.raw = raw;
      this.tag = tag;
      if (tag instanceof AccessScope) {
        this.contextType = 'Scope';
      } else if (tag instanceof AccessMember || tag instanceof AccessKeyed) {
        this.contextType = 'Object';
      } else {
        throw new Error(`${this.tag} is not a valid template tag`);
      }
    }
  }

  getScopeContext(scope, lookupFunctions) {
    return getContextFor(this.tag.name, scope, this.tag.ancestor);
  }

  getObjectContext(scope, lookupFunctions) {
    return this.tag.object.evaluate(scope, lookupFunctions);
  }

  evaluate(scope, lookupFunctions, mustEvaluate) {
    const results = new Array(this.length);
    for (let i = 0; i < this.length; i++) {
      results[i] = this.expressions[i].evaluate(scope, lookupFunctions);
    }
    if (this.tagged) {
      const func = this.tag.evaluate(scope, lookupFunctions);
      if (typeof func === 'function') {
        const context = this[`get${this.contextType}Context`](scope, lookupFunctions);
        return func.call(context, this.cooked, ...results);
      }
      if (!mustEvaluate) {
        return null;
      }
      throw new Error(`${this.tag} is not a function`);
    }
    let result = this.cooked[0];
    for (let i = 0; i < this.length; i++) {
      result = String.prototype.concat(result, results[i], this.cooked[i + 1]);
    }
    return result;
  }

  accept(visitor) {
    return visitor.visitLiteralTemplate(this);
  }

  connect(binding, scope) {
    for (let i = 0; i < this.length; i++) {
      this.expressions[i].connect(binding, scope);
    }
    if (this.tagged) {
      this.tag.connect(binding, scope);
    }
  }
};

let LiteralArray = class LiteralArray extends Expression {
  constructor(elements) {
    super();

    this.elements = elements;
  }

  evaluate(scope, lookupFunctions) {
    let elements = this.elements;
    let result = [];

    for (let i = 0, length = elements.length; i < length; ++i) {
      result[i] = elements[i].evaluate(scope, lookupFunctions);
    }

    return result;
  }

  accept(visitor) {
    return visitor.visitLiteralArray(this);
  }

  connect(binding, scope) {
    let length = this.elements.length;
    for (let i = 0; i < length; i++) {
      this.elements[i].connect(binding, scope);
    }
  }
};

let LiteralObject = class LiteralObject extends Expression {
  constructor(keys, values) {
    super();

    this.keys = keys;
    this.values = values;
  }

  evaluate(scope, lookupFunctions) {
    let instance = {};
    let keys = this.keys;
    let values = this.values;

    for (let i = 0, length = keys.length; i < length; ++i) {
      instance[keys[i]] = values[i].evaluate(scope, lookupFunctions);
    }

    return instance;
  }

  accept(visitor) {
    return visitor.visitLiteralObject(this);
  }

  connect(binding, scope) {
    let length = this.keys.length;
    for (let i = 0; i < length; i++) {
      this.values[i].connect(binding, scope);
    }
  }
};

function evalList(scope, list, lookupFunctions) {
  const length = list.length;
  const result = [];
  for (let i = 0; i < length; i++) {
    result[i] = list[i].evaluate(scope, lookupFunctions);
  }
  return result;
}

function autoConvertAdd(a, b) {
  if (a !== null && b !== null) {
    if (typeof a === 'string' && typeof b !== 'string') {
      return a + b.toString();
    }

    if (typeof a !== 'string' && typeof b === 'string') {
      return a.toString() + b;
    }

    return a + b;
  }

  if (a !== null) {
    return a;
  }

  if (b !== null) {
    return b;
  }

  return 0;
}

function getFunction(obj, name, mustExist) {
  let func = obj === null || obj === undefined ? null : obj[name];
  if (typeof func === 'function') {
    return func;
  }
  if (!mustExist && (func === null || func === undefined)) {
    return null;
  }
  throw new Error(`${name} is not a function`);
}

function getKeyed(obj, key) {
  if (Array.isArray(obj)) {
    return obj[parseInt(key, 10)];
  } else if (obj) {
    return obj[key];
  } else if (obj === null || obj === undefined) {
    return undefined;
  }

  return obj[key];
}

function setKeyed(obj, key, value) {
  if (Array.isArray(obj)) {
    let index = parseInt(key, 10);

    if (obj.length <= index) {
      obj.length = index + 1;
    }

    obj[index] = value;
  } else {
    obj[key] = value;
  }

  return value;
}

let Unparser = null;

if (typeof FEATURE_NO_UNPARSER === 'undefined') {
  Unparser = class {
    constructor(buffer) {
      this.buffer = buffer;
    }

    static unparse(expression) {
      let buffer = [];
      let visitor = new Unparser(buffer);

      expression.accept(visitor);

      return buffer.join('');
    }

    write(text) {
      this.buffer.push(text);
    }

    writeArgs(args) {
      this.write('(');

      for (let i = 0, length = args.length; i < length; ++i) {
        if (i !== 0) {
          this.write(',');
        }

        args[i].accept(this);
      }

      this.write(')');
    }

    visitBindingBehavior(behavior) {
      let args = behavior.args;

      behavior.expression.accept(this);
      this.write(`&${behavior.name}`);

      for (let i = 0, length = args.length; i < length; ++i) {
        this.write(':');
        args[i].accept(this);
      }
    }

    visitValueConverter(converter) {
      let args = converter.args;

      converter.expression.accept(this);
      this.write(`|${converter.name}`);

      for (let i = 0, length = args.length; i < length; ++i) {
        this.write(':');
        args[i].accept(this);
      }
    }

    visitAssign(assign) {
      assign.target.accept(this);
      this.write('=');
      assign.value.accept(this);
    }

    visitConditional(conditional) {
      conditional.condition.accept(this);
      this.write('?');
      conditional.yes.accept(this);
      this.write(':');
      conditional.no.accept(this);
    }

    visitAccessThis(access) {
      if (access.ancestor === 0) {
        this.write('$this');
        return;
      }
      this.write('$parent');
      let i = access.ancestor - 1;
      while (i--) {
        this.write('.$parent');
      }
    }

    visitAccessScope(access) {
      let i = access.ancestor;
      while (i--) {
        this.write('$parent.');
      }
      this.write(access.name);
    }

    visitAccessMember(access) {
      access.object.accept(this);
      this.write(`.${access.name}`);
    }

    visitAccessKeyed(access) {
      access.object.accept(this);
      this.write('[');
      access.key.accept(this);
      this.write(']');
    }

    visitCallScope(call) {
      let i = call.ancestor;
      while (i--) {
        this.write('$parent.');
      }
      this.write(call.name);
      this.writeArgs(call.args);
    }

    visitCallFunction(call) {
      call.func.accept(this);
      this.writeArgs(call.args);
    }

    visitCallMember(call) {
      call.object.accept(this);
      this.write(`.${call.name}`);
      this.writeArgs(call.args);
    }

    visitPrefix(prefix) {
      this.write(`(${prefix.operation}`);
      if (prefix.operation.charCodeAt(0) >= 97) {
        this.write(' ');
      }
      prefix.expression.accept(this);
      this.write(')');
    }

    visitBinary(binary) {
      binary.left.accept(this);
      if (binary.operation.charCodeAt(0) === 105) {
        this.write(` ${binary.operation} `);
      } else {
        this.write(binary.operation);
      }
      binary.right.accept(this);
    }

    visitLiteralPrimitive(literal) {
      this.write(`${literal.value}`);
    }

    visitLiteralArray(literal) {
      let elements = literal.elements;

      this.write('[');

      for (let i = 0, length = elements.length; i < length; ++i) {
        if (i !== 0) {
          this.write(',');
        }

        elements[i].accept(this);
      }

      this.write(']');
    }

    visitLiteralObject(literal) {
      let keys = literal.keys;
      let values = literal.values;

      this.write('{');

      for (let i = 0, length = keys.length; i < length; ++i) {
        if (i !== 0) {
          this.write(',');
        }

        this.write(`'${keys[i]}':`);
        values[i].accept(this);
      }

      this.write('}');
    }

    visitLiteralString(literal) {
      let escaped = literal.value.replace(/'/g, "\'");
      this.write(`'${escaped}'`);
    }

    visitLiteralTemplate(literal) {
      const { cooked, expressions } = literal;
      const length = expressions.length;
      this.write('`');
      this.write(cooked[0]);
      for (let i = 0; i < length; i++) {
        expressions[i].accept(this);
        this.write(cooked[i + 1]);
      }
      this.write('`');
    }
  };
}

let ExpressionCloner = class ExpressionCloner {
  cloneExpressionArray(array) {
    let clonedArray = [];
    let i = array.length;
    while (i--) {
      clonedArray[i] = array[i].accept(this);
    }
    return clonedArray;
  }

  visitBindingBehavior(behavior) {
    return new BindingBehavior(behavior.expression.accept(this), behavior.name, this.cloneExpressionArray(behavior.args));
  }

  visitValueConverter(converter) {
    return new ValueConverter(converter.expression.accept(this), converter.name, this.cloneExpressionArray(converter.args));
  }

  visitAssign(assign) {
    return new Assign(assign.target.accept(this), assign.value.accept(this));
  }

  visitConditional(conditional) {
    return new Conditional(conditional.condition.accept(this), conditional.yes.accept(this), conditional.no.accept(this));
  }

  visitAccessThis(access) {
    return new AccessThis(access.ancestor);
  }

  visitAccessScope(access) {
    return new AccessScope(access.name, access.ancestor);
  }

  visitAccessMember(access) {
    return new AccessMember(access.object.accept(this), access.name);
  }

  visitAccessKeyed(access) {
    return new AccessKeyed(access.object.accept(this), access.key.accept(this));
  }

  visitCallScope(call) {
    return new CallScope(call.name, this.cloneExpressionArray(call.args), call.ancestor);
  }

  visitCallFunction(call) {
    return new CallFunction(call.func.accept(this), this.cloneExpressionArray(call.args));
  }

  visitCallMember(call) {
    return new CallMember(call.object.accept(this), call.name, this.cloneExpressionArray(call.args));
  }

  visitUnary(unary) {
    return new Unary(prefix.operation, prefix.expression.accept(this));
  }

  visitBinary(binary) {
    return new Binary(binary.operation, binary.left.accept(this), binary.right.accept(this));
  }

  visitLiteralPrimitive(literal) {
    return new LiteralPrimitive(literal);
  }

  visitLiteralArray(literal) {
    return new LiteralArray(this.cloneExpressionArray(literal.elements));
  }

  visitLiteralObject(literal) {
    return new LiteralObject(literal.keys, this.cloneExpressionArray(literal.values));
  }

  visitLiteralString(literal) {
    return new LiteralString(literal.value);
  }

  visitLiteralTemplate(literal) {
    return new LiteralTemplate(literal.cooked, this.cloneExpressionArray(literal.expressions), literal.raw, literal.tag && literal.tag.accept(this));
  }
};

function cloneExpression(expression) {
  let visitor = new ExpressionCloner();
  return expression.accept(visitor);
}

const bindingMode = {
  oneTime: 0,
  toView: 1,
  oneWay: 1,
  twoWay: 2,
  fromView: 3
};
/* harmony export (immutable) */ exports["bindingMode"] = bindingMode;


let Parser = class Parser {
  constructor() {
    this.cache = Object.create(null);
  }

  parse(src) {
    src = src || '';

    return this.cache[src] || (this.cache[src] = new ParserImplementation(src).parseBindingBehavior());
  }
};

const fromCharCode = String.fromCharCode;

let ParserImplementation = class ParserImplementation {
  get raw() {
    return this.src.slice(this.start, this.idx);
  }

  constructor(src) {
    this.idx = 0;

    this.start = 0;

    this.src = src;
    this.len = src.length;

    this.tkn = T$EOF;

    this.val = undefined;

    this.ch = src.charCodeAt(0);
  }

  parseBindingBehavior() {
    this.nextToken();
    if (this.tkn & T$ExpressionTerminal) {
      this.err('Invalid start of expression');
    }
    let result = this.parseValueConverter();
    while (this.opt(T$Ampersand)) {
      result = new BindingBehavior(result, this.val, this.parseVariadicArgs());
    }
    if (this.tkn !== T$EOF) {
      this.err(`Unconsumed token ${this.raw}`);
    }
    return result;
  }

  parseValueConverter() {
    let result = this.parseExpression();
    while (this.opt(T$Bar)) {
      result = new ValueConverter(result, this.val, this.parseVariadicArgs());
    }
    return result;
  }

  parseVariadicArgs() {
    this.nextToken();
    const result = [];
    while (this.opt(T$Colon)) {
      result.push(this.parseExpression());
    }
    return result;
  }

  parseExpression() {
    let exprStart = this.idx;
    let result = this.parseConditional();

    while (this.tkn === T$Eq) {
      if (!result.isAssignable) {
        this.err(`Expression ${this.src.slice(exprStart, this.start)} is not assignable`);
      }
      this.nextToken();
      exprStart = this.idx;
      result = new Assign(result, this.parseConditional());
    }
    return result;
  }

  parseConditional() {
    let result = this.parseBinary(0);

    if (this.opt(T$Question)) {
      let yes = this.parseExpression();
      this.expect(T$Colon);
      result = new Conditional(result, yes, this.parseExpression());
    }
    return result;
  }

  parseBinary(minPrecedence) {
    let left = this.parseLeftHandSide(0);

    while (this.tkn & T$BinaryOp) {
      const opToken = this.tkn;
      if ((opToken & T$Precedence) <= minPrecedence) {
        break;
      }
      this.nextToken();
      left = new Binary(TokenValues[opToken & T$TokenMask], left, this.parseBinary(opToken & T$Precedence));
    }
    return left;
  }

  parseLeftHandSide(context) {
    let result;

    primary: switch (this.tkn) {
      case T$Plus:
        this.nextToken();
        return this.parseLeftHandSide(0);
      case T$Minus:
        this.nextToken();
        return new Binary('-', new LiteralPrimitive(0), this.parseLeftHandSide(0));
      case T$Bang:
      case T$TypeofKeyword:
      case T$VoidKeyword:
        const op = TokenValues[this.tkn & T$TokenMask];
        this.nextToken();
        return new Unary(op, this.parseLeftHandSide(0));
      case T$ParentScope:
        {
          do {
            this.nextToken();
            context++;
            if (this.opt(T$Period)) {
              if (this.tkn === T$Period) {
                this.err();
              }
              continue;
            } else if (this.tkn & T$AccessScopeTerminal) {
              result = new AccessThis(context & C$Ancestor);

              context = context & C$ShorthandProp | C$This;
              break primary;
            } else {
              this.err();
            }
          } while (this.tkn === T$ParentScope);
        }

      case T$Identifier:
        {
          result = new AccessScope(this.val, context & C$Ancestor);
          this.nextToken();
          context = context & C$ShorthandProp | C$Scope;
          break;
        }
      case T$ThisScope:
        this.nextToken();
        result = new AccessThis(0);
        context = context & C$ShorthandProp | C$This;
        break;
      case T$LParen:
        this.nextToken();
        result = this.parseExpression();
        this.expect(T$RParen);
        context = C$Primary;
        break;
      case T$LBracket:
        {
          this.nextToken();
          const elements = [];
          if (this.tkn !== T$RBracket) {
            do {
              elements.push(this.parseExpression());
            } while (this.opt(T$Comma));
          }
          this.expect(T$RBracket);
          result = new LiteralArray(elements);
          context = C$Primary;
          break;
        }
      case T$LBrace:
        {
          const keys = [];
          const values = [];
          this.nextToken();
          while (this.tkn !== T$RBrace) {
            if (this.tkn & T$IdentifierOrKeyword) {
              const { ch, tkn, idx } = this;
              keys.push(this.val);
              this.nextToken();
              if (this.opt(T$Colon)) {
                values.push(this.parseExpression());
              } else {
                this.ch = ch;
                this.tkn = tkn;
                this.idx = idx;
                values.push(this.parseLeftHandSide(C$ShorthandProp));
              }
            } else if (this.tkn & T$Literal) {
              keys.push(this.val);
              this.nextToken();
              this.expect(T$Colon);
              values.push(this.parseExpression());
            } else {
              this.err();
            }
            if (this.tkn !== T$RBrace) {
              this.expect(T$Comma);
            }
          }
          this.expect(T$RBrace);
          result = new LiteralObject(keys, values);
          context = C$Primary;
          break;
        }
      case T$StringLiteral:
        result = new LiteralString(this.val);
        this.nextToken();
        context = C$Primary;
        break;
      case T$TemplateTail:
        result = new LiteralTemplate([this.val]);
        this.nextToken();
        context = C$Primary;
        break;
      case T$TemplateContinuation:
        result = this.parseTemplate(0);
        context = C$Primary;
        break;
      case T$NumericLiteral:
        {
          result = new LiteralPrimitive(this.val);
          this.nextToken();

          break;
        }
      case T$NullKeyword:
      case T$UndefinedKeyword:
      case T$TrueKeyword:
      case T$FalseKeyword:
        result = new LiteralPrimitive(TokenValues[this.tkn & T$TokenMask]);
        this.nextToken();
        context = C$Primary;
        break;
      default:
        if (this.idx >= this.len) {
          this.err('Unexpected end of expression');
        } else {
          this.err();
        }
    }

    if (context & C$ShorthandProp) {
      return result;
    }

    let name = this.val;
    while (this.tkn & T$MemberOrCallExpression) {
      switch (this.tkn) {
        case T$Period:
          this.nextToken();
          if (!(this.tkn & T$IdentifierOrKeyword)) {
            this.err();
          }
          name = this.val;
          this.nextToken();

          context = context & C$Primary | (context & (C$This | C$Scope)) << 1 | context & C$Member | (context & C$Keyed) >> 1 | (context & C$Call) >> 2;
          if (this.tkn === T$LParen) {
            continue;
          }
          if (context & C$Scope) {
            result = new AccessScope(name, result.ancestor);
          } else {
            result = new AccessMember(result, name);
          }
          continue;
        case T$LBracket:
          this.nextToken();
          context = C$Keyed;
          result = new AccessKeyed(result, this.parseExpression());
          this.expect(T$RBracket);
          break;
        case T$LParen:
          this.nextToken();
          const args = [];
          while (this.tkn !== T$RParen) {
            args.push(this.parseExpression());
            if (!this.opt(T$Comma)) {
              break;
            }
          }
          this.expect(T$RParen);
          if (context & C$Scope) {
            result = new CallScope(name, args, result.ancestor);
          } else if (context & (C$Member | C$Primary)) {
            result = new CallMember(result, name, args);
          } else {
            result = new CallFunction(result, args);
          }
          context = C$Call;
          break;
        case T$TemplateTail:
          result = new LiteralTemplate([this.val], [], [this.raw], result);
          this.nextToken();
          break;
        case T$TemplateContinuation:
          result = this.parseTemplate(context | C$Tagged, result);
      }
    }

    return result;
  }

  parseTemplate(context, func) {
    const cooked = [this.val];
    const raw = context & C$Tagged ? [this.raw] : undefined;
    this.expect(T$TemplateContinuation);
    const expressions = [this.parseExpression()];

    while ((this.tkn = this.scanTemplateTail()) !== T$TemplateTail) {
      cooked.push(this.val);
      if (context & C$Tagged) {
        raw.push(this.raw);
      }
      this.expect(T$TemplateContinuation);
      expressions.push(this.parseExpression());
    }

    cooked.push(this.val);
    if (context & C$Tagged) {
      raw.push(this.raw);
    }
    this.nextToken();
    return new LiteralTemplate(cooked, expressions, raw, func);
  }

  nextToken() {
    while (this.idx < this.len) {
      if (this.ch <= 0x20) {
        this.next();
        continue;
      }
      this.start = this.idx;
      if (this.ch === 0x24 || this.ch >= 0x61 && this.ch <= 0x7A) {
        this.tkn = this.scanIdentifier();
        return;
      }

      if ((this.tkn = CharScanners[this.ch](this)) !== null) {
        return;
      }
    }
    this.tkn = T$EOF;
  }

  next() {
    return this.ch = this.src.charCodeAt(++this.idx);
  }

  scanIdentifier() {
    while (AsciiIdParts.has(this.next()) || this.ch > 0x7F && IdParts[this.ch]) {}

    return KeywordLookup[this.val = this.raw] || T$Identifier;
  }

  scanNumber(isFloat) {
    if (isFloat) {
      this.val = 0;
    } else {
      this.val = this.ch - 0x30;
      while (this.next() <= 0x39 && this.ch >= 0x30) {
        this.val = this.val * 10 + this.ch - 0x30;
      }
    }

    if (isFloat || this.ch === 0x2E) {
      if (!isFloat) {
        this.next();
      }
      const start = this.idx;
      let value = this.ch - 0x30;
      while (this.next() <= 0x39 && this.ch >= 0x30) {
        value = value * 10 + this.ch - 0x30;
      }
      this.val = this.val + value / Math.pow(10, this.idx - start);
    }

    if (this.ch === 0x65 || this.ch === 0x45) {
      const start = this.idx;

      this.next();
      if (this.ch === 0x2D || this.ch === 0x2B) {
        this.next();
      }

      if (!(this.ch >= 0x30 && this.ch <= 0x39)) {
        this.idx = start;
        this.err('Invalid exponent');
      }
      while (this.next() <= 0x39 && this.ch >= 0x30) {}
      this.val = parseFloat(this.src.slice(this.start, this.idx));
    }

    return T$NumericLiteral;
  }

  scanString() {
    let quote = this.ch;
    this.next();

    let buffer;
    let marker = this.idx;

    while (this.ch !== quote) {
      if (this.ch === 0x5C) {
        if (!buffer) {
          buffer = [];
        }

        buffer.push(this.src.slice(marker, this.idx));

        this.next();

        let unescaped;

        if (this.ch === 0x75) {
          this.next();

          if (this.idx + 4 < this.len) {
            let hex = this.src.slice(this.idx, this.idx + 4);

            if (!/[A-Z0-9]{4}/i.test(hex)) {
              this.err(`Invalid unicode escape [\\u${hex}]`);
            }

            unescaped = parseInt(hex, 16);
            this.idx += 4;
            this.ch = this.src.charCodeAt(this.idx);
          } else {
            this.err();
          }
        } else {
          unescaped = unescape(this.ch);
          this.next();
        }

        buffer.push(fromCharCode(unescaped));
        marker = this.idx;
      } else if (this.ch === 0 || this.idx >= this.len) {
        this.err('Unterminated quote');
      } else {
        this.next();
      }
    }

    let last = this.src.slice(marker, this.idx);
    this.next();
    let unescaped = last;

    if (buffer !== null && buffer !== undefined) {
      buffer.push(last);
      unescaped = buffer.join('');
    }

    this.val = unescaped;
    return T$StringLiteral;
  }

  scanTemplate() {
    let tail = true;
    let result = '';

    while (this.next() !== 0x60) {
      if (this.ch === 0x24) {
        if (this.idx + 1 < this.len && this.src.charCodeAt(this.idx + 1) === 0x7B) {
          this.idx++;
          tail = false;
          break;
        } else {
          result += '$';
        }
      } else if (this.ch === 0x5C) {
        result += fromCharCode(unescape(this.next()));
      } else {
        result += fromCharCode(this.ch);
      }
    }

    this.next();
    this.val = result;
    if (tail) {
      return T$TemplateTail;
    }
    return T$TemplateContinuation;
  }

  scanTemplateTail() {
    if (this.idx >= this.len) {
      this.err('Unterminated template');
    }
    this.idx--;
    return this.scanTemplate();
  }

  err(message = `Unexpected token ${this.raw}`, column = this.start) {
    throw new Error(`Parser Error: ${message} at column ${column} in expression [${this.src}]`);
  }

  opt(token) {
    if (this.tkn === token) {
      this.nextToken();
      return true;
    }

    return false;
  }

  expect(token) {
    if (this.tkn === token) {
      this.nextToken();
    } else {
      this.err(`Missing expected token ${TokenValues[token & T$TokenMask]}`, this.idx);
    }
  }
};

function unescape(code) {
  switch (code) {
    case 0x66:
      return 0xC;
    case 0x6E:
      return 0xA;
    case 0x72:
      return 0xD;
    case 0x74:
      return 0x9;
    case 0x76:
      return 0xB;
    default:
      return code;
  }
}

const C$This = 1 << 10;
const C$Scope = 1 << 11;
const C$Member = 1 << 12;
const C$Keyed = 1 << 13;
const C$Call = 1 << 14;
const C$Primary = 1 << 15;
const C$ShorthandProp = 1 << 16;
const C$Tagged = 1 << 17;

const C$Ancestor = (1 << 9) - 1;

const T$TokenMask = (1 << 6) - 1;

const T$PrecShift = 6;

const T$Precedence = 7 << T$PrecShift;

const T$ExpressionTerminal = 1 << 11;

const T$ClosingToken = 1 << 12;

const T$OpeningToken = 1 << 13;

const T$AccessScopeTerminal = 1 << 14;
const T$Keyword = 1 << 15;
const T$EOF = 1 << 16 | T$AccessScopeTerminal | T$ExpressionTerminal;
const T$Identifier = 1 << 17;
const T$IdentifierOrKeyword = T$Identifier | T$Keyword;
const T$Literal = 1 << 18;
const T$NumericLiteral = 1 << 19 | T$Literal;
const T$StringLiteral = 1 << 20 | T$Literal;
const T$BinaryOp = 1 << 21;

const T$UnaryOp = 1 << 22;

const T$MemberExpression = 1 << 23;

const T$MemberOrCallExpression = 1 << 24;
const T$TemplateTail = 1 << 25 | T$MemberOrCallExpression;
const T$TemplateContinuation = 1 << 26 | T$MemberOrCallExpression;

const T$FalseKeyword = 0 | T$Keyword | T$Literal;
const T$TrueKeyword = 1 | T$Keyword | T$Literal;
const T$NullKeyword = 2 | T$Keyword | T$Literal;
const T$UndefinedKeyword = 3 | T$Keyword | T$Literal;
const T$ThisScope = 4 | T$IdentifierOrKeyword;
const T$ParentScope = 5 | T$IdentifierOrKeyword;

const T$LParen = 6 | T$OpeningToken | T$AccessScopeTerminal | T$MemberOrCallExpression;
const T$LBrace = 7 | T$OpeningToken;
const T$Period = 8 | T$MemberExpression | T$MemberOrCallExpression;
const T$RBrace = 9 | T$AccessScopeTerminal | T$ClosingToken | T$ExpressionTerminal;
const T$RParen = 10 | T$AccessScopeTerminal | T$ClosingToken | T$ExpressionTerminal;
const T$Comma = 11 | T$AccessScopeTerminal;
const T$LBracket = 12 | T$OpeningToken | T$AccessScopeTerminal | T$MemberExpression | T$MemberOrCallExpression;
const T$RBracket = 13 | T$ClosingToken | T$ExpressionTerminal;
const T$Colon = 14 | T$AccessScopeTerminal;
const T$Question = 15;

const T$Ampersand = 18 | T$AccessScopeTerminal;
const T$Bar = 19 | T$AccessScopeTerminal;
const T$BarBar = 20 | 1 << T$PrecShift | T$BinaryOp;
const T$AmpersandAmpersand = 21 | 2 << T$PrecShift | T$BinaryOp;
const T$Caret = 22 | 3 << T$PrecShift | T$BinaryOp;
const T$EqEq = 23 | 4 << T$PrecShift | T$BinaryOp;
const T$BangEq = 24 | 4 << T$PrecShift | T$BinaryOp;
const T$EqEqEq = 25 | 4 << T$PrecShift | T$BinaryOp;
const T$BangEqEq = 26 | 4 << T$PrecShift | T$BinaryOp;
const T$Lt = 27 | 5 << T$PrecShift | T$BinaryOp;
const T$Gt = 28 | 5 << T$PrecShift | T$BinaryOp;
const T$LtEq = 29 | 5 << T$PrecShift | T$BinaryOp;
const T$GtEq = 30 | 5 << T$PrecShift | T$BinaryOp;
const T$InKeyword = 31 | 5 << T$PrecShift | T$BinaryOp | T$Keyword;
const T$InstanceOfKeyword = 32 | 5 << T$PrecShift | T$BinaryOp | T$Keyword;
const T$Plus = 33 | 6 << T$PrecShift | T$BinaryOp | T$UnaryOp;
const T$Minus = 34 | 6 << T$PrecShift | T$BinaryOp | T$UnaryOp;
const T$TypeofKeyword = 35 | T$UnaryOp | T$Keyword;
const T$VoidKeyword = 36 | T$UnaryOp | T$Keyword;
const T$Star = 37 | 7 << T$PrecShift | T$BinaryOp;
const T$Percent = 38 | 7 << T$PrecShift | T$BinaryOp;
const T$Slash = 39 | 7 << T$PrecShift | T$BinaryOp;
const T$Eq = 40;
const T$Bang = 41 | T$UnaryOp;

const KeywordLookup = Object.create(null);
KeywordLookup.true = T$TrueKeyword;
KeywordLookup.null = T$NullKeyword;
KeywordLookup.false = T$FalseKeyword;
KeywordLookup.undefined = T$UndefinedKeyword;
KeywordLookup.$this = T$ThisScope;
KeywordLookup.$parent = T$ParentScope;
KeywordLookup.in = T$InKeyword;
KeywordLookup.instanceof = T$InstanceOfKeyword;
KeywordLookup.typeof = T$TypeofKeyword;
KeywordLookup.void = T$VoidKeyword;

const TokenValues = [false, true, null, undefined, '$this', '$parent', '(', '{', '.', '}', ')', ',', '[', ']', ':', '?', '\'', '"', '&', '|', '||', '&&', '^', '==', '!=', '===', '!==', '<', '>', '<=', '>=', 'in', 'instanceof', '+', '-', 'typeof', 'void', '*', '%', '/', '=', '!'];

const codes = {
  AsciiIdPart: [0x24, 0, 0x30, 0x3A, 0x41, 0x5B, 0x5F, 0, 0x61, 0x7B],
  IdStart: [0x24, 0, 0x41, 0x5B, 0x5F, 0, 0x61, 0x7B, 0xAA, 0, 0xBA, 0, 0xC0, 0xD7, 0xD8, 0xF7, 0xF8, 0x2B9, 0x2E0, 0x2E5, 0x1D00, 0x1D26, 0x1D2C, 0x1D5D, 0x1D62, 0x1D66, 0x1D6B, 0x1D78, 0x1D79, 0x1DBF, 0x1E00, 0x1F00, 0x2071, 0, 0x207F, 0, 0x2090, 0x209D, 0x212A, 0x212C, 0x2132, 0, 0x214E, 0, 0x2160, 0x2189, 0x2C60, 0x2C80, 0xA722, 0xA788, 0xA78B, 0xA7AF, 0xA7B0, 0xA7B8, 0xA7F7, 0xA800, 0xAB30, 0xAB5B, 0xAB5C, 0xAB65, 0xFB00, 0xFB07, 0xFF21, 0xFF3B, 0xFF41, 0xFF5B],
  Digit: [0x30, 0x3A],
  Skip: [0, 0x21, 0x7F, 0xA1]
};

function decompress(lookup, set, compressed, value) {
  let rangeCount = compressed.length;
  for (let i = 0; i < rangeCount; i += 2) {
    const start = compressed[i];
    let end = compressed[i + 1];
    end = end > 0 ? end : start + 1;
    if (lookup) {
      let j = start;
      while (j < end) {
        lookup[j] = value;
        j++;
      }
    }
    if (set) {
      for (let ch = start; ch < end; ch++) {
        set.add(ch);
      }
    }
  }
}

function returnToken(token) {
  return p => {
    p.next();
    return token;
  };
}
function unexpectedCharacter(p) {
  p.err(`Unexpected character [${fromCharCode(p.ch)}]`);
  return null;
}

const AsciiIdParts = new Set();
decompress(null, AsciiIdParts, codes.AsciiIdPart, true);

const IdParts = new Uint8Array(0xFFFF);
decompress(IdParts, null, codes.IdStart, 1);
decompress(IdParts, null, codes.Digit, 1);

const CharScanners = new Array(0xFFFF);
let ci = 0;
while (ci < 0xFFFF) {
  CharScanners[ci] = unexpectedCharacter;
  ci++;
}

decompress(CharScanners, null, codes.Skip, p => {
  p.next();
  return null;
});
decompress(CharScanners, null, codes.IdStart, p => p.scanIdentifier());
decompress(CharScanners, null, codes.Digit, p => p.scanNumber(false));

CharScanners[0x22] = CharScanners[0x27] = p => {
  return p.scanString();
};
CharScanners[0x60] = p => {
  return p.scanTemplate();
};

CharScanners[0x21] = p => {
  if (p.next() !== 0x3D) {
    return T$Bang;
  }
  if (p.next() !== 0x3D) {
    return T$BangEq;
  }
  p.next();
  return T$BangEqEq;
};

CharScanners[0x3D] = p => {
  if (p.next() !== 0x3D) {
    return T$Eq;
  }
  if (p.next() !== 0x3D) {
    return T$EqEq;
  }
  p.next();
  return T$EqEqEq;
};

CharScanners[0x26] = p => {
  if (p.next() !== 0x26) {
    return T$Ampersand;
  }
  p.next();
  return T$AmpersandAmpersand;
};

CharScanners[0x7C] = p => {
  if (p.next() !== 0x7C) {
    return T$Bar;
  }
  p.next();
  return T$BarBar;
};

CharScanners[0x2E] = p => {
  if (p.next() <= 0x39 && p.ch >= 0x30) {
    return p.scanNumber(true);
  }
  return T$Period;
};

CharScanners[0x3C] = p => {
  if (p.next() !== 0x3D) {
    return T$Lt;
  }
  p.next();
  return T$LtEq;
};

CharScanners[0x3E] = p => {
  if (p.next() !== 0x3D) {
    return T$Gt;
  }
  p.next();
  return T$GtEq;
};

CharScanners[0x25] = returnToken(T$Percent);
CharScanners[0x28] = returnToken(T$LParen);
CharScanners[0x29] = returnToken(T$RParen);
CharScanners[0x2A] = returnToken(T$Star);
CharScanners[0x2B] = returnToken(T$Plus);
CharScanners[0x2C] = returnToken(T$Comma);
CharScanners[0x2D] = returnToken(T$Minus);
CharScanners[0x2F] = returnToken(T$Slash);
CharScanners[0x3A] = returnToken(T$Colon);
CharScanners[0x3F] = returnToken(T$Question);
CharScanners[0x5B] = returnToken(T$LBracket);
CharScanners[0x5D] = returnToken(T$RBracket);
CharScanners[0x5E] = returnToken(T$Caret);
CharScanners[0x7B] = returnToken(T$LBrace);
CharScanners[0x7D] = returnToken(T$RBrace);

let mapProto = Map.prototype;

function getMapObserver(taskQueue, map) {
  return ModifyMapObserver.for(taskQueue, map);
}

let ModifyMapObserver = class ModifyMapObserver extends ModifyCollectionObserver {
  constructor(taskQueue, map) {
    super(taskQueue, map);
  }

  static for(taskQueue, map) {
    if (!('__map_observer__' in map)) {
      Reflect.defineProperty(map, '__map_observer__', {
        value: ModifyMapObserver.create(taskQueue, map),
        enumerable: false, configurable: false
      });
    }
    return map.__map_observer__;
  }

  static create(taskQueue, map) {
    let observer = new ModifyMapObserver(taskQueue, map);

    let proto = mapProto;
    if (proto.set !== map.set || proto.delete !== map.delete || proto.clear !== map.clear) {
      proto = {
        set: map.set,
        delete: map.delete,
        clear: map.clear
      };
    }

    map.set = function () {
      let hasValue = map.has(arguments[0]);
      let type = hasValue ? 'update' : 'add';
      let oldValue = map.get(arguments[0]);
      let methodCallResult = proto.set.apply(map, arguments);
      if (!hasValue || oldValue !== map.get(arguments[0])) {
        observer.addChangeRecord({
          type: type,
          object: map,
          key: arguments[0],
          oldValue: oldValue
        });
      }
      return methodCallResult;
    };

    map.delete = function () {
      let hasValue = map.has(arguments[0]);
      let oldValue = map.get(arguments[0]);
      let methodCallResult = proto.delete.apply(map, arguments);
      if (hasValue) {
        observer.addChangeRecord({
          type: 'delete',
          object: map,
          key: arguments[0],
          oldValue: oldValue
        });
      }
      return methodCallResult;
    };

    map.clear = function () {
      let methodCallResult = proto.clear.apply(map, arguments);
      observer.addChangeRecord({
        type: 'clear',
        object: map
      });
      return methodCallResult;
    };

    return observer;
  }
};

function findOriginalEventTarget(event) {
  return event.path && event.path[0] || event.deepPath && event.deepPath[0] || event.target;
}

function stopPropagation() {
  this.standardStopPropagation();
  this.propagationStopped = true;
}

function handleCapturedEvent(event) {
  event.propagationStopped = false;
  let target = findOriginalEventTarget(event);

  let orderedCallbacks = [];

  while (target) {
    if (target.capturedCallbacks) {
      let callback = target.capturedCallbacks[event.type];
      if (callback) {
        if (event.stopPropagation !== stopPropagation) {
          event.standardStopPropagation = event.stopPropagation;
          event.stopPropagation = stopPropagation;
        }
        orderedCallbacks.push(callback);
      }
    }
    target = target.parentNode;
  }
  for (let i = orderedCallbacks.length - 1; i >= 0 && !event.propagationStopped; i--) {
    let orderedCallback = orderedCallbacks[i];
    if ('handleEvent' in orderedCallback) {
      orderedCallback.handleEvent(event);
    } else {
      orderedCallback(event);
    }
  }
}

let CapturedHandlerEntry = class CapturedHandlerEntry {
  constructor(eventName) {
    this.eventName = eventName;
    this.count = 0;
  }

  increment() {
    this.count++;

    if (this.count === 1) {
      __WEBPACK_IMPORTED_MODULE_1_aurelia_pal__["DOM"].addEventListener(this.eventName, handleCapturedEvent, true);
    }
  }

  decrement() {
    this.count--;

    if (this.count === 0) {
      __WEBPACK_IMPORTED_MODULE_1_aurelia_pal__["DOM"].removeEventListener(this.eventName, handleCapturedEvent, true);
    }
  }
};


function handleDelegatedEvent(event) {
  event.propagationStopped = false;
  let target = findOriginalEventTarget(event);

  while (target && !event.propagationStopped) {
    if (target.delegatedCallbacks) {
      let callback = target.delegatedCallbacks[event.type];
      if (callback) {
        if (event.stopPropagation !== stopPropagation) {
          event.standardStopPropagation = event.stopPropagation;
          event.stopPropagation = stopPropagation;
        }
        if ('handleEvent' in callback) {
          callback.handleEvent(event);
        } else {
          callback(event);
        }
      }
    }

    target = target.parentNode;
  }
}

let DelegateHandlerEntry = class DelegateHandlerEntry {
  constructor(eventName) {
    this.eventName = eventName;
    this.count = 0;
  }

  increment() {
    this.count++;

    if (this.count === 1) {
      __WEBPACK_IMPORTED_MODULE_1_aurelia_pal__["DOM"].addEventListener(this.eventName, handleDelegatedEvent, false);
    }
  }

  decrement() {
    this.count--;

    if (this.count === 0) {
      __WEBPACK_IMPORTED_MODULE_1_aurelia_pal__["DOM"].removeEventListener(this.eventName, handleDelegatedEvent, false);
    }
  }
};
let DelegationEntryHandler = class DelegationEntryHandler {
  constructor(entry, lookup, targetEvent) {
    this.entry = entry;
    this.lookup = lookup;
    this.targetEvent = targetEvent;
  }

  dispose() {
    this.entry.decrement();
    this.lookup[this.targetEvent] = null;
  }
};
let EventHandler = class EventHandler {
  constructor(target, targetEvent, callback) {
    this.target = target;
    this.targetEvent = targetEvent;
    this.callback = callback;
  }

  dispose() {
    this.target.removeEventListener(this.targetEvent, this.callback);
  }
};
let DefaultEventStrategy = class DefaultEventStrategy {
  constructor() {
    this.delegatedHandlers = {};
    this.capturedHandlers = {};
  }

  subscribe(target, targetEvent, callback, strategy, disposable) {
    let delegatedHandlers;
    let capturedHandlers;
    let handlerEntry;

    if (strategy === delegationStrategy.bubbling) {
      delegatedHandlers = this.delegatedHandlers;
      handlerEntry = delegatedHandlers[targetEvent] || (delegatedHandlers[targetEvent] = new DelegateHandlerEntry(targetEvent));
      let delegatedCallbacks = target.delegatedCallbacks || (target.delegatedCallbacks = {});

      handlerEntry.increment();
      delegatedCallbacks[targetEvent] = callback;

      if (disposable === true) {
        return new DelegationEntryHandler(handlerEntry, delegatedCallbacks, targetEvent);
      }

      return function () {
        handlerEntry.decrement();
        delegatedCallbacks[targetEvent] = null;
      };
    }
    if (strategy === delegationStrategy.capturing) {
      capturedHandlers = this.capturedHandlers;
      handlerEntry = capturedHandlers[targetEvent] || (capturedHandlers[targetEvent] = new CapturedHandlerEntry(targetEvent));
      let capturedCallbacks = target.capturedCallbacks || (target.capturedCallbacks = {});

      handlerEntry.increment();
      capturedCallbacks[targetEvent] = callback;

      if (disposable === true) {
        return new DelegationEntryHandler(handlerEntry, capturedCallbacks, targetEvent);
      }

      return function () {
        handlerEntry.decrement();
        capturedCallbacks[targetEvent] = null;
      };
    }

    target.addEventListener(targetEvent, callback);

    if (disposable === true) {
      return new EventHandler(target, targetEvent, callback);
    }

    return function () {
      target.removeEventListener(targetEvent, callback);
    };
  }
};


const delegationStrategy = {
  none: 0,
  capturing: 1,
  bubbling: 2
};
/* harmony export (immutable) */ exports["delegationStrategy"] = delegationStrategy;


let EventManager = class EventManager {
  constructor() {
    this.elementHandlerLookup = {};
    this.eventStrategyLookup = {};

    this.registerElementConfig({
      tagName: 'input',
      properties: {
        value: ['change', 'input'],
        checked: ['change', 'input'],
        files: ['change', 'input']
      }
    });

    this.registerElementConfig({
      tagName: 'textarea',
      properties: {
        value: ['change', 'input']
      }
    });

    this.registerElementConfig({
      tagName: 'select',
      properties: {
        value: ['change']
      }
    });

    this.registerElementConfig({
      tagName: 'content editable',
      properties: {
        value: ['change', 'input', 'blur', 'keyup', 'paste']
      }
    });

    this.registerElementConfig({
      tagName: 'scrollable element',
      properties: {
        scrollTop: ['scroll'],
        scrollLeft: ['scroll']
      }
    });

    this.defaultEventStrategy = new DefaultEventStrategy();
  }

  registerElementConfig(config) {
    let tagName = config.tagName.toLowerCase();
    let properties = config.properties;
    let propertyName;

    let lookup = this.elementHandlerLookup[tagName] = {};

    for (propertyName in properties) {
      if (properties.hasOwnProperty(propertyName)) {
        lookup[propertyName] = properties[propertyName];
      }
    }
  }

  registerEventStrategy(eventName, strategy) {
    this.eventStrategyLookup[eventName] = strategy;
  }

  getElementHandler(target, propertyName) {
    let tagName;
    let lookup = this.elementHandlerLookup;

    if (target.tagName) {
      tagName = target.tagName.toLowerCase();

      if (lookup[tagName] && lookup[tagName][propertyName]) {
        return new EventSubscriber(lookup[tagName][propertyName]);
      }

      if (propertyName === 'textContent' || propertyName === 'innerHTML') {
        return new EventSubscriber(lookup['content editable'].value);
      }

      if (propertyName === 'scrollTop' || propertyName === 'scrollLeft') {
        return new EventSubscriber(lookup['scrollable element'][propertyName]);
      }
    }

    return null;
  }

  addEventListener(target, targetEvent, callbackOrListener, delegate, disposable) {
    return (this.eventStrategyLookup[targetEvent] || this.defaultEventStrategy).subscribe(target, targetEvent, callbackOrListener, delegate, disposable);
  }
};

let EventSubscriber = class EventSubscriber {
  constructor(events) {
    this.events = events;
    this.element = null;
    this.handler = null;
  }

  subscribe(element, callbackOrListener) {
    this.element = element;
    this.handler = callbackOrListener;

    let events = this.events;
    for (let i = 0, ii = events.length; ii > i; ++i) {
      element.addEventListener(events[i], callbackOrListener);
    }
  }

  dispose() {
    if (this.element === null) {
      return;
    }
    let element = this.element;
    let callbackOrListener = this.handler;
    let events = this.events;
    for (let i = 0, ii = events.length; ii > i; ++i) {
      element.removeEventListener(events[i], callbackOrListener);
    }
    this.element = this.handler = null;
  }
};

let DirtyChecker = class DirtyChecker {
  constructor() {
    this.tracked = [];
    this.checkDelay = 120;
  }

  addProperty(property) {
    let tracked = this.tracked;

    tracked.push(property);

    if (tracked.length === 1) {
      this.scheduleDirtyCheck();
    }
  }

  removeProperty(property) {
    let tracked = this.tracked;
    tracked.splice(tracked.indexOf(property), 1);
  }

  scheduleDirtyCheck() {
    setTimeout(() => this.check(), this.checkDelay);
  }

  check() {
    let tracked = this.tracked;
    let i = tracked.length;

    while (i--) {
      let current = tracked[i];

      if (current.isDirty()) {
        current.call();
      }
    }

    if (tracked.length) {
      this.scheduleDirtyCheck();
    }
  }
};

let DirtyCheckProperty = (_dec5 = subscriberCollection(), _dec5(_class5 = class DirtyCheckProperty {
  constructor(dirtyChecker, obj, propertyName) {
    this.dirtyChecker = dirtyChecker;
    this.obj = obj;
    this.propertyName = propertyName;
  }

  getValue() {
    return this.obj[this.propertyName];
  }

  setValue(newValue) {
    this.obj[this.propertyName] = newValue;
  }

  call() {
    let oldValue = this.oldValue;
    let newValue = this.getValue();

    this.callSubscribers(newValue, oldValue);

    this.oldValue = newValue;
  }

  isDirty() {
    return this.oldValue !== this.obj[this.propertyName];
  }

  subscribe(context, callable) {
    if (!this.hasSubscribers()) {
      this.oldValue = this.getValue();
      this.dirtyChecker.addProperty(this);
    }
    this.addSubscriber(context, callable);
  }

  unsubscribe(context, callable) {
    if (this.removeSubscriber(context, callable) && !this.hasSubscribers()) {
      this.dirtyChecker.removeProperty(this);
    }
  }
}) || _class5);

const logger = __WEBPACK_IMPORTED_MODULE_0_aurelia_logging__["getLogger"]('property-observation');

const propertyAccessor = {
  getValue: (obj, propertyName) => obj[propertyName],
  setValue: (value, obj, propertyName) => {
    obj[propertyName] = value;
  }
};
/* harmony export (immutable) */ exports["propertyAccessor"] = propertyAccessor;


let PrimitiveObserver = class PrimitiveObserver {

  constructor(primitive, propertyName) {
    this.doNotCache = true;

    this.primitive = primitive;
    this.propertyName = propertyName;
  }

  getValue() {
    return this.primitive[this.propertyName];
  }

  setValue() {
    let type = typeof this.primitive;
    throw new Error(`The ${this.propertyName} property of a ${type} (${this.primitive}) cannot be assigned.`);
  }

  subscribe() {}

  unsubscribe() {}
};

let SetterObserver = (_dec6 = subscriberCollection(), _dec6(_class7 = class SetterObserver {
  constructor(taskQueue, obj, propertyName) {
    this.taskQueue = taskQueue;
    this.obj = obj;
    this.propertyName = propertyName;
    this.queued = false;
    this.observing = false;
  }

  getValue() {
    return this.obj[this.propertyName];
  }

  setValue(newValue) {
    this.obj[this.propertyName] = newValue;
  }

  getterValue() {
    return this.currentValue;
  }

  setterValue(newValue) {
    let oldValue = this.currentValue;

    if (oldValue !== newValue) {
      if (!this.queued) {
        this.oldValue = oldValue;
        this.queued = true;
        this.taskQueue.queueMicroTask(this);
      }

      this.currentValue = newValue;
    }
  }

  call() {
    let oldValue = this.oldValue;
    let newValue = this.currentValue;

    this.queued = false;

    this.callSubscribers(newValue, oldValue);
  }

  subscribe(context, callable) {
    if (!this.observing) {
      this.convertProperty();
    }
    this.addSubscriber(context, callable);
  }

  unsubscribe(context, callable) {
    this.removeSubscriber(context, callable);
  }

  convertProperty() {
    this.observing = true;
    this.currentValue = this.obj[this.propertyName];
    this.setValue = this.setterValue;
    this.getValue = this.getterValue;

    if (!Reflect.defineProperty(this.obj, this.propertyName, {
      configurable: true,
      enumerable: this.propertyName in this.obj ? this.obj.propertyIsEnumerable(this.propertyName) : true,
      get: this.getValue.bind(this),
      set: this.setValue.bind(this)
    })) {
      logger.warn(`Cannot observe property '${this.propertyName}' of object`, this.obj);
    }
  }
}) || _class7);

let XLinkAttributeObserver = class XLinkAttributeObserver {
  constructor(element, propertyName, attributeName) {
    this.element = element;
    this.propertyName = propertyName;
    this.attributeName = attributeName;
  }

  getValue() {
    return this.element.getAttributeNS('http://www.w3.org/1999/xlink', this.attributeName);
  }

  setValue(newValue) {
    return this.element.setAttributeNS('http://www.w3.org/1999/xlink', this.attributeName, newValue);
  }

  subscribe() {
    throw new Error(`Observation of a "${this.element.nodeName}" element\'s "${this.propertyName}" property is not supported.`);
  }
};

const dataAttributeAccessor = {
  getValue: (obj, propertyName) => obj.getAttribute(propertyName),
  setValue: (value, obj, propertyName) => {
    if (value === null || value === undefined) {
      obj.removeAttribute(propertyName);
    } else {
      obj.setAttribute(propertyName, value);
    }
  }
};
/* harmony export (immutable) */ exports["dataAttributeAccessor"] = dataAttributeAccessor;


let DataAttributeObserver = class DataAttributeObserver {
  constructor(element, propertyName) {
    this.element = element;
    this.propertyName = propertyName;
  }

  getValue() {
    return this.element.getAttribute(this.propertyName);
  }

  setValue(newValue) {
    if (newValue === null || newValue === undefined) {
      return this.element.removeAttribute(this.propertyName);
    }
    return this.element.setAttribute(this.propertyName, newValue);
  }

  subscribe() {
    throw new Error(`Observation of a "${this.element.nodeName}" element\'s "${this.propertyName}" property is not supported.`);
  }
};

let StyleObserver = class StyleObserver {
  constructor(element, propertyName) {
    this.element = element;
    this.propertyName = propertyName;

    this.styles = null;
    this.version = 0;
  }

  getValue() {
    return this.element.style.cssText;
  }

  _setProperty(style, value) {
    let priority = '';

    if (value !== null && value !== undefined && typeof value.indexOf === 'function' && value.indexOf('!important') !== -1) {
      priority = 'important';
      value = value.replace('!important', '');
    }
    this.element.style.setProperty(style, value, priority);
  }

  setValue(newValue) {
    let styles = this.styles || {};
    let style;
    let version = this.version;

    if (newValue !== null && newValue !== undefined) {
      if (newValue instanceof Object) {
        let value;
        for (style in newValue) {
          if (newValue.hasOwnProperty(style)) {
            value = newValue[style];
            style = style.replace(/([A-Z])/g, m => '-' + m.toLowerCase());
            styles[style] = version;
            this._setProperty(style, value);
          }
        }
      } else if (newValue.length) {
        let rx = /\s*([\w\-]+)\s*:\s*((?:(?:[\w\-]+\(\s*(?:"(?:\\"|[^"])*"|'(?:\\'|[^'])*'|[\w\-]+\(\s*(?:^"(?:\\"|[^"])*"|'(?:\\'|[^'])*'|[^\)]*)\),?|[^\)]*)\),?|"(?:\\"|[^"])*"|'(?:\\'|[^'])*'|[^;]*),?\s*)+);?/g;
        let pair;
        while ((pair = rx.exec(newValue)) !== null) {
          style = pair[1];
          if (!style) {
            continue;
          }

          styles[style] = version;
          this._setProperty(style, pair[2]);
        }
      }
    }

    this.styles = styles;
    this.version += 1;

    if (version === 0) {
      return;
    }

    version -= 1;
    for (style in styles) {
      if (!styles.hasOwnProperty(style) || styles[style] !== version) {
        continue;
      }

      this.element.style.removeProperty(style);
    }
  }

  subscribe() {
    throw new Error(`Observation of a "${this.element.nodeName}" element\'s "${this.propertyName}" property is not supported.`);
  }
};

let ValueAttributeObserver = (_dec7 = subscriberCollection(), _dec7(_class8 = class ValueAttributeObserver {
  constructor(element, propertyName, handler) {
    this.element = element;
    this.propertyName = propertyName;
    this.handler = handler;
    if (propertyName === 'files') {
      this.setValue = () => {};
    }
  }

  getValue() {
    return this.element[this.propertyName];
  }

  setValue(newValue) {
    newValue = newValue === undefined || newValue === null ? '' : newValue;
    if (this.element[this.propertyName] !== newValue) {
      this.element[this.propertyName] = newValue;
      this.notify();
    }
  }

  notify() {
    let oldValue = this.oldValue;
    let newValue = this.getValue();

    this.callSubscribers(newValue, oldValue);

    this.oldValue = newValue;
  }

  handleEvent() {
    this.notify();
  }

  subscribe(context, callable) {
    if (!this.hasSubscribers()) {
      this.oldValue = this.getValue();
      this.handler.subscribe(this.element, this);
    }

    this.addSubscriber(context, callable);
  }

  unsubscribe(context, callable) {
    if (this.removeSubscriber(context, callable) && !this.hasSubscribers()) {
      this.handler.dispose();
    }
  }
}) || _class8);

const checkedArrayContext = 'CheckedObserver:array';
const checkedValueContext = 'CheckedObserver:value';

let CheckedObserver = (_dec8 = subscriberCollection(), _dec8(_class9 = class CheckedObserver {
  constructor(element, handler, observerLocator) {
    this.element = element;
    this.handler = handler;
    this.observerLocator = observerLocator;
  }

  getValue() {
    return this.value;
  }

  setValue(newValue) {
    if (this.initialSync && this.value === newValue) {
      return;
    }

    if (this.arrayObserver) {
      this.arrayObserver.unsubscribe(checkedArrayContext, this);
      this.arrayObserver = null;
    }

    if (this.element.type === 'checkbox' && Array.isArray(newValue)) {
      this.arrayObserver = this.observerLocator.getArrayObserver(newValue);
      this.arrayObserver.subscribe(checkedArrayContext, this);
    }

    this.oldValue = this.value;
    this.value = newValue;
    this.synchronizeElement();
    this.notify();

    if (!this.initialSync) {
      this.initialSync = true;
      this.observerLocator.taskQueue.queueMicroTask(this);
    }
  }

  call(context, splices) {
    this.synchronizeElement();

    if (!this.valueObserver) {
      this.valueObserver = this.element.__observers__.model || this.element.__observers__.value;
      if (this.valueObserver) {
        this.valueObserver.subscribe(checkedValueContext, this);
      }
    }
  }

  synchronizeElement() {
    let value = this.value;
    let element = this.element;
    let elementValue = element.hasOwnProperty('model') ? element.model : element.value;
    let isRadio = element.type === 'radio';
    let matcher = element.matcher || ((a, b) => a === b);

    element.checked = isRadio && !!matcher(value, elementValue) || !isRadio && value === true || !isRadio && Array.isArray(value) && value.findIndex(item => !!matcher(item, elementValue)) !== -1;
  }

  synchronizeValue() {
    let value = this.value;
    let element = this.element;
    let elementValue = element.hasOwnProperty('model') ? element.model : element.value;
    let index;
    let matcher = element.matcher || ((a, b) => a === b);

    if (element.type === 'checkbox') {
      if (Array.isArray(value)) {
        index = value.findIndex(item => !!matcher(item, elementValue));
        if (element.checked && index === -1) {
          value.push(elementValue);
        } else if (!element.checked && index !== -1) {
          value.splice(index, 1);
        }

        return;
      }

      value = element.checked;
    } else if (element.checked) {
      value = elementValue;
    } else {
      return;
    }

    this.oldValue = this.value;
    this.value = value;
    this.notify();
  }

  notify() {
    let oldValue = this.oldValue;
    let newValue = this.value;

    if (newValue === oldValue) {
      return;
    }

    this.callSubscribers(newValue, oldValue);
  }

  handleEvent() {
    this.synchronizeValue();
  }

  subscribe(context, callable) {
    if (!this.hasSubscribers()) {
      this.handler.subscribe(this.element, this);
    }
    this.addSubscriber(context, callable);
  }

  unsubscribe(context, callable) {
    if (this.removeSubscriber(context, callable) && !this.hasSubscribers()) {
      this.handler.dispose();
    }
  }

  unbind() {
    if (this.arrayObserver) {
      this.arrayObserver.unsubscribe(checkedArrayContext, this);
      this.arrayObserver = null;
    }
    if (this.valueObserver) {
      this.valueObserver.unsubscribe(checkedValueContext, this);
    }
  }
}) || _class9);

const selectArrayContext = 'SelectValueObserver:array';

let SelectValueObserver = (_dec9 = subscriberCollection(), _dec9(_class10 = class SelectValueObserver {
  constructor(element, handler, observerLocator) {
    this.element = element;
    this.handler = handler;
    this.observerLocator = observerLocator;
  }

  getValue() {
    return this.value;
  }

  setValue(newValue) {
    if (newValue !== null && newValue !== undefined && this.element.multiple && !Array.isArray(newValue)) {
      throw new Error('Only null or Array instances can be bound to a multi-select.');
    }
    if (this.value === newValue) {
      return;
    }

    if (this.arrayObserver) {
      this.arrayObserver.unsubscribe(selectArrayContext, this);
      this.arrayObserver = null;
    }

    if (Array.isArray(newValue)) {
      this.arrayObserver = this.observerLocator.getArrayObserver(newValue);
      this.arrayObserver.subscribe(selectArrayContext, this);
    }

    this.oldValue = this.value;
    this.value = newValue;
    this.synchronizeOptions();
    this.notify();

    if (!this.initialSync) {
      this.initialSync = true;
      this.observerLocator.taskQueue.queueMicroTask(this);
    }
  }

  call(context, splices) {
    this.synchronizeOptions();
  }

  synchronizeOptions() {
    let value = this.value;
    let isArray;

    if (Array.isArray(value)) {
      isArray = true;
    }

    let options = this.element.options;
    let i = options.length;
    let matcher = this.element.matcher || ((a, b) => a === b);
    while (i--) {
      let option = options.item(i);
      let optionValue = option.hasOwnProperty('model') ? option.model : option.value;
      if (isArray) {
        option.selected = value.findIndex(item => !!matcher(optionValue, item)) !== -1;
        continue;
      }
      option.selected = !!matcher(optionValue, value);
    }
  }

  synchronizeValue() {
    let options = this.element.options;
    let count = 0;
    let value = [];

    for (let i = 0, ii = options.length; i < ii; i++) {
      let option = options.item(i);
      if (!option.selected) {
        continue;
      }
      value.push(option.hasOwnProperty('model') ? option.model : option.value);
      count++;
    }

    if (this.element.multiple) {
      if (Array.isArray(this.value)) {
        let matcher = this.element.matcher || ((a, b) => a === b);

        let i = 0;
        while (i < this.value.length) {
          let a = this.value[i];
          if (value.findIndex(b => matcher(a, b)) === -1) {
            this.value.splice(i, 1);
          } else {
            i++;
          }
        }

        i = 0;
        while (i < value.length) {
          let a = value[i];
          if (this.value.findIndex(b => matcher(a, b)) === -1) {
            this.value.push(a);
          }
          i++;
        }
        return;
      }
    } else {
      if (count === 0) {
        value = null;
      } else {
        value = value[0];
      }
    }

    if (value !== this.value) {
      this.oldValue = this.value;
      this.value = value;
      this.notify();
    }
  }

  notify() {
    let oldValue = this.oldValue;
    let newValue = this.value;

    this.callSubscribers(newValue, oldValue);
  }

  handleEvent() {
    this.synchronizeValue();
  }

  subscribe(context, callable) {
    if (!this.hasSubscribers()) {
      this.handler.subscribe(this.element, this);
    }
    this.addSubscriber(context, callable);
  }

  unsubscribe(context, callable) {
    if (this.removeSubscriber(context, callable) && !this.hasSubscribers()) {
      this.handler.dispose();
    }
  }

  bind() {
    this.domObserver = __WEBPACK_IMPORTED_MODULE_1_aurelia_pal__["DOM"].createMutationObserver(() => {
      this.synchronizeOptions();
      this.synchronizeValue();
    });
    this.domObserver.observe(this.element, { childList: true, subtree: true, characterData: true });
  }

  unbind() {
    this.domObserver.disconnect();
    this.domObserver = null;

    if (this.arrayObserver) {
      this.arrayObserver.unsubscribe(selectArrayContext, this);
      this.arrayObserver = null;
    }
  }
}) || _class10);

let ClassObserver = class ClassObserver {
  constructor(element) {
    this.element = element;
    this.doNotCache = true;
    this.value = '';
    this.version = 0;
  }

  getValue() {
    return this.value;
  }

  setValue(newValue) {
    let nameIndex = this.nameIndex || {};
    let version = this.version;
    let names;
    let name;

    if (newValue !== null && newValue !== undefined && newValue.length) {
      names = newValue.split(/\s+/);
      for (let i = 0, length = names.length; i < length; i++) {
        name = names[i];
        if (name === '') {
          continue;
        }
        nameIndex[name] = version;
        this.element.classList.add(name);
      }
    }

    this.value = newValue;
    this.nameIndex = nameIndex;
    this.version += 1;

    if (version === 0) {
      return;
    }

    version -= 1;
    for (name in nameIndex) {
      if (!nameIndex.hasOwnProperty(name) || nameIndex[name] !== version) {
        continue;
      }
      this.element.classList.remove(name);
    }
  }

  subscribe() {
    throw new Error(`Observation of a "${this.element.nodeName}" element\'s "class" property is not supported.`);
  }
};

function hasDeclaredDependencies(descriptor) {
  return !!(descriptor && descriptor.get && descriptor.get.dependencies);
}

function declarePropertyDependencies(ctor, propertyName, dependencies) {
  let descriptor = Object.getOwnPropertyDescriptor(ctor.prototype, propertyName);
  descriptor.get.dependencies = dependencies;
}

function computedFrom(...rest) {
  return function (target, key, descriptor) {
    descriptor.get.dependencies = rest;
    return descriptor;
  };
}

let ComputedExpression = class ComputedExpression extends Expression {
  constructor(name, dependencies) {
    super();

    this.name = name;
    this.dependencies = dependencies;
    this.isAssignable = true;
  }

  evaluate(scope, lookupFunctions) {
    return scope.bindingContext[this.name];
  }

  assign(scope, value) {
    scope.bindingContext[this.name] = value;
  }

  accept(visitor) {
    throw new Error('not implemented');
  }

  connect(binding, scope) {
    let dependencies = this.dependencies;
    let i = dependencies.length;
    while (i--) {
      dependencies[i].connect(binding, scope);
    }
  }
};

function createComputedObserver(obj, propertyName, descriptor, observerLocator) {
  let dependencies = descriptor.get.dependencies;
  if (!(dependencies instanceof ComputedExpression)) {
    let i = dependencies.length;
    while (i--) {
      dependencies[i] = observerLocator.parser.parse(dependencies[i]);
    }
    dependencies = descriptor.get.dependencies = new ComputedExpression(propertyName, dependencies);
  }

  let scope = { bindingContext: obj, overrideContext: createOverrideContext(obj) };
  return new ExpressionObserver(scope, dependencies, observerLocator);
}

let svgElements;
let svgPresentationElements;
let svgPresentationAttributes;
let svgAnalyzer;

if (typeof FEATURE_NO_SVG === 'undefined') {
  svgElements = {
    a: ['class', 'externalResourcesRequired', 'id', 'onactivate', 'onclick', 'onfocusin', 'onfocusout', 'onload', 'onmousedown', 'onmousemove', 'onmouseout', 'onmouseover', 'onmouseup', 'requiredExtensions', 'requiredFeatures', 'style', 'systemLanguage', 'target', 'transform', 'xlink:actuate', 'xlink:arcrole', 'xlink:href', 'xlink:role', 'xlink:show', 'xlink:title', 'xlink:type', 'xml:base', 'xml:lang', 'xml:space'],
    altGlyph: ['class', 'dx', 'dy', 'externalResourcesRequired', 'format', 'glyphRef', 'id', 'onactivate', 'onclick', 'onfocusin', 'onfocusout', 'onload', 'onmousedown', 'onmousemove', 'onmouseout', 'onmouseover', 'onmouseup', 'requiredExtensions', 'requiredFeatures', 'rotate', 'style', 'systemLanguage', 'x', 'xlink:actuate', 'xlink:arcrole', 'xlink:href', 'xlink:role', 'xlink:show', 'xlink:title', 'xlink:type', 'xml:base', 'xml:lang', 'xml:space', 'y'],
    altGlyphDef: ['id', 'xml:base', 'xml:lang', 'xml:space'],
    altGlyphItem: ['id', 'xml:base', 'xml:lang', 'xml:space'],
    animate: ['accumulate', 'additive', 'attributeName', 'attributeType', 'begin', 'by', 'calcMode', 'dur', 'end', 'externalResourcesRequired', 'fill', 'from', 'id', 'keySplines', 'keyTimes', 'max', 'min', 'onbegin', 'onend', 'onload', 'onrepeat', 'repeatCount', 'repeatDur', 'requiredExtensions', 'requiredFeatures', 'restart', 'systemLanguage', 'to', 'values', 'xlink:actuate', 'xlink:arcrole', 'xlink:href', 'xlink:role', 'xlink:show', 'xlink:title', 'xlink:type', 'xml:base', 'xml:lang', 'xml:space'],
    animateColor: ['accumulate', 'additive', 'attributeName', 'attributeType', 'begin', 'by', 'calcMode', 'dur', 'end', 'externalResourcesRequired', 'fill', 'from', 'id', 'keySplines', 'keyTimes', 'max', 'min', 'onbegin', 'onend', 'onload', 'onrepeat', 'repeatCount', 'repeatDur', 'requiredExtensions', 'requiredFeatures', 'restart', 'systemLanguage', 'to', 'values', 'xlink:actuate', 'xlink:arcrole', 'xlink:href', 'xlink:role', 'xlink:show', 'xlink:title', 'xlink:type', 'xml:base', 'xml:lang', 'xml:space'],
    animateMotion: ['accumulate', 'additive', 'begin', 'by', 'calcMode', 'dur', 'end', 'externalResourcesRequired', 'fill', 'from', 'id', 'keyPoints', 'keySplines', 'keyTimes', 'max', 'min', 'onbegin', 'onend', 'onload', 'onrepeat', 'origin', 'path', 'repeatCount', 'repeatDur', 'requiredExtensions', 'requiredFeatures', 'restart', 'rotate', 'systemLanguage', 'to', 'values', 'xlink:actuate', 'xlink:arcrole', 'xlink:href', 'xlink:role', 'xlink:show', 'xlink:title', 'xlink:type', 'xml:base', 'xml:lang', 'xml:space'],
    animateTransform: ['accumulate', 'additive', 'attributeName', 'attributeType', 'begin', 'by', 'calcMode', 'dur', 'end', 'externalResourcesRequired', 'fill', 'from', 'id', 'keySplines', 'keyTimes', 'max', 'min', 'onbegin', 'onend', 'onload', 'onrepeat', 'repeatCount', 'repeatDur', 'requiredExtensions', 'requiredFeatures', 'restart', 'systemLanguage', 'to', 'type', 'values', 'xlink:actuate', 'xlink:arcrole', 'xlink:href', 'xlink:role', 'xlink:show', 'xlink:title', 'xlink:type', 'xml:base', 'xml:lang', 'xml:space'],
    circle: ['class', 'cx', 'cy', 'externalResourcesRequired', 'id', 'onactivate', 'onclick', 'onfocusin', 'onfocusout', 'onload', 'onmousedown', 'onmousemove', 'onmouseout', 'onmouseover', 'onmouseup', 'r', 'requiredExtensions', 'requiredFeatures', 'style', 'systemLanguage', 'transform', 'xml:base', 'xml:lang', 'xml:space'],
    clipPath: ['class', 'clipPathUnits', 'externalResourcesRequired', 'id', 'requiredExtensions', 'requiredFeatures', 'style', 'systemLanguage', 'transform', 'xml:base', 'xml:lang', 'xml:space'],
    'color-profile': ['id', 'local', 'name', 'rendering-intent', 'xlink:actuate', 'xlink:arcrole', 'xlink:href', 'xlink:role', 'xlink:show', 'xlink:title', 'xlink:type', 'xml:base', 'xml:lang', 'xml:space'],
    cursor: ['externalResourcesRequired', 'id', 'requiredExtensions', 'requiredFeatures', 'systemLanguage', 'x', 'xlink:actuate', 'xlink:arcrole', 'xlink:href', 'xlink:role', 'xlink:show', 'xlink:title', 'xlink:type', 'xml:base', 'xml:lang', 'xml:space', 'y'],
    defs: ['class', 'externalResourcesRequired', 'id', 'onactivate', 'onclick', 'onfocusin', 'onfocusout', 'onload', 'onmousedown', 'onmousemove', 'onmouseout', 'onmouseover', 'onmouseup', 'requiredExtensions', 'requiredFeatures', 'style', 'systemLanguage', 'transform', 'xml:base', 'xml:lang', 'xml:space'],
    desc: ['class', 'id', 'style', 'xml:base', 'xml:lang', 'xml:space'],
    ellipse: ['class', 'cx', 'cy', 'externalResourcesRequired', 'id', 'onactivate', 'onclick', 'onfocusin', 'onfocusout', 'onload', 'onmousedown', 'onmousemove', 'onmouseout', 'onmouseover', 'onmouseup', 'requiredExtensions', 'requiredFeatures', 'rx', 'ry', 'style', 'systemLanguage', 'transform', 'xml:base', 'xml:lang', 'xml:space'],
    feBlend: ['class', 'height', 'id', 'in', 'in2', 'mode', 'result', 'style', 'width', 'x', 'xml:base', 'xml:lang', 'xml:space', 'y'],
    feColorMatrix: ['class', 'height', 'id', 'in', 'result', 'style', 'type', 'values', 'width', 'x', 'xml:base', 'xml:lang', 'xml:space', 'y'],
    feComponentTransfer: ['class', 'height', 'id', 'in', 'result', 'style', 'width', 'x', 'xml:base', 'xml:lang', 'xml:space', 'y'],
    feComposite: ['class', 'height', 'id', 'in', 'in2', 'k1', 'k2', 'k3', 'k4', 'operator', 'result', 'style', 'width', 'x', 'xml:base', 'xml:lang', 'xml:space', 'y'],
    feConvolveMatrix: ['bias', 'class', 'divisor', 'edgeMode', 'height', 'id', 'in', 'kernelMatrix', 'kernelUnitLength', 'order', 'preserveAlpha', 'result', 'style', 'targetX', 'targetY', 'width', 'x', 'xml:base', 'xml:lang', 'xml:space', 'y'],
    feDiffuseLighting: ['class', 'diffuseConstant', 'height', 'id', 'in', 'kernelUnitLength', 'result', 'style', 'surfaceScale', 'width', 'x', 'xml:base', 'xml:lang', 'xml:space', 'y'],
    feDisplacementMap: ['class', 'height', 'id', 'in', 'in2', 'result', 'scale', 'style', 'width', 'x', 'xChannelSelector', 'xml:base', 'xml:lang', 'xml:space', 'y', 'yChannelSelector'],
    feDistantLight: ['azimuth', 'elevation', 'id', 'xml:base', 'xml:lang', 'xml:space'],
    feFlood: ['class', 'height', 'id', 'result', 'style', 'width', 'x', 'xml:base', 'xml:lang', 'xml:space', 'y'],
    feFuncA: ['amplitude', 'exponent', 'id', 'intercept', 'offset', 'slope', 'tableValues', 'type', 'xml:base', 'xml:lang', 'xml:space'],
    feFuncB: ['amplitude', 'exponent', 'id', 'intercept', 'offset', 'slope', 'tableValues', 'type', 'xml:base', 'xml:lang', 'xml:space'],
    feFuncG: ['amplitude', 'exponent', 'id', 'intercept', 'offset', 'slope', 'tableValues', 'type', 'xml:base', 'xml:lang', 'xml:space'],
    feFuncR: ['amplitude', 'exponent', 'id', 'intercept', 'offset', 'slope', 'tableValues', 'type', 'xml:base', 'xml:lang', 'xml:space'],
    feGaussianBlur: ['class', 'height', 'id', 'in', 'result', 'stdDeviation', 'style', 'width', 'x', 'xml:base', 'xml:lang', 'xml:space', 'y'],
    feImage: ['class', 'externalResourcesRequired', 'height', 'id', 'preserveAspectRatio', 'result', 'style', 'width', 'x', 'xlink:actuate', 'xlink:arcrole', 'xlink:href', 'xlink:role', 'xlink:show', 'xlink:title', 'xlink:type', 'xml:base', 'xml:lang', 'xml:space', 'y'],
    feMerge: ['class', 'height', 'id', 'result', 'style', 'width', 'x', 'xml:base', 'xml:lang', 'xml:space', 'y'],
    feMergeNode: ['id', 'xml:base', 'xml:lang', 'xml:space'],
    feMorphology: ['class', 'height', 'id', 'in', 'operator', 'radius', 'result', 'style', 'width', 'x', 'xml:base', 'xml:lang', 'xml:space', 'y'],
    feOffset: ['class', 'dx', 'dy', 'height', 'id', 'in', 'result', 'style', 'width', 'x', 'xml:base', 'xml:lang', 'xml:space', 'y'],
    fePointLight: ['id', 'x', 'xml:base', 'xml:lang', 'xml:space', 'y', 'z'],
    feSpecularLighting: ['class', 'height', 'id', 'in', 'kernelUnitLength', 'result', 'specularConstant', 'specularExponent', 'style', 'surfaceScale', 'width', 'x', 'xml:base', 'xml:lang', 'xml:space', 'y'],
    feSpotLight: ['id', 'limitingConeAngle', 'pointsAtX', 'pointsAtY', 'pointsAtZ', 'specularExponent', 'x', 'xml:base', 'xml:lang', 'xml:space', 'y', 'z'],
    feTile: ['class', 'height', 'id', 'in', 'result', 'style', 'width', 'x', 'xml:base', 'xml:lang', 'xml:space', 'y'],
    feTurbulence: ['baseFrequency', 'class', 'height', 'id', 'numOctaves', 'result', 'seed', 'stitchTiles', 'style', 'type', 'width', 'x', 'xml:base', 'xml:lang', 'xml:space', 'y'],
    filter: ['class', 'externalResourcesRequired', 'filterRes', 'filterUnits', 'height', 'id', 'primitiveUnits', 'style', 'width', 'x', 'xlink:actuate', 'xlink:arcrole', 'xlink:href', 'xlink:role', 'xlink:show', 'xlink:title', 'xlink:type', 'xml:base', 'xml:lang', 'xml:space', 'y'],
    font: ['class', 'externalResourcesRequired', 'horiz-adv-x', 'horiz-origin-x', 'horiz-origin-y', 'id', 'style', 'vert-adv-y', 'vert-origin-x', 'vert-origin-y', 'xml:base', 'xml:lang', 'xml:space'],
    'font-face': ['accent-height', 'alphabetic', 'ascent', 'bbox', 'cap-height', 'descent', 'font-family', 'font-size', 'font-stretch', 'font-style', 'font-variant', 'font-weight', 'hanging', 'id', 'ideographic', 'mathematical', 'overline-position', 'overline-thickness', 'panose-1', 'slope', 'stemh', 'stemv', 'strikethrough-position', 'strikethrough-thickness', 'underline-position', 'underline-thickness', 'unicode-range', 'units-per-em', 'v-alphabetic', 'v-hanging', 'v-ideographic', 'v-mathematical', 'widths', 'x-height', 'xml:base', 'xml:lang', 'xml:space'],
    'font-face-format': ['id', 'string', 'xml:base', 'xml:lang', 'xml:space'],
    'font-face-name': ['id', 'name', 'xml:base', 'xml:lang', 'xml:space'],
    'font-face-src': ['id', 'xml:base', 'xml:lang', 'xml:space'],
    'font-face-uri': ['id', 'xlink:actuate', 'xlink:arcrole', 'xlink:href', 'xlink:role', 'xlink:show', 'xlink:title', 'xlink:type', 'xml:base', 'xml:lang', 'xml:space'],
    foreignObject: ['class', 'externalResourcesRequired', 'height', 'id', 'onactivate', 'onclick', 'onfocusin', 'onfocusout', 'onload', 'onmousedown', 'onmousemove', 'onmouseout', 'onmouseover', 'onmouseup', 'requiredExtensions', 'requiredFeatures', 'style', 'systemLanguage', 'transform', 'width', 'x', 'xml:base', 'xml:lang', 'xml:space', 'y'],
    g: ['class', 'externalResourcesRequired', 'id', 'onactivate', 'onclick', 'onfocusin', 'onfocusout', 'onload', 'onmousedown', 'onmousemove', 'onmouseout', 'onmouseover', 'onmouseup', 'requiredExtensions', 'requiredFeatures', 'style', 'systemLanguage', 'transform', 'xml:base', 'xml:lang', 'xml:space'],
    glyph: ['arabic-form', 'class', 'd', 'glyph-name', 'horiz-adv-x', 'id', 'lang', 'orientation', 'style', 'unicode', 'vert-adv-y', 'vert-origin-x', 'vert-origin-y', 'xml:base', 'xml:lang', 'xml:space'],
    glyphRef: ['class', 'dx', 'dy', 'format', 'glyphRef', 'id', 'style', 'x', 'xlink:actuate', 'xlink:arcrole', 'xlink:href', 'xlink:role', 'xlink:show', 'xlink:title', 'xlink:type', 'xml:base', 'xml:lang', 'xml:space', 'y'],
    hkern: ['g1', 'g2', 'id', 'k', 'u1', 'u2', 'xml:base', 'xml:lang', 'xml:space'],
    image: ['class', 'externalResourcesRequired', 'height', 'id', 'onactivate', 'onclick', 'onfocusin', 'onfocusout', 'onload', 'onmousedown', 'onmousemove', 'onmouseout', 'onmouseover', 'onmouseup', 'preserveAspectRatio', 'requiredExtensions', 'requiredFeatures', 'style', 'systemLanguage', 'transform', 'width', 'x', 'xlink:actuate', 'xlink:arcrole', 'xlink:href', 'xlink:role', 'xlink:show', 'xlink:title', 'xlink:type', 'xml:base', 'xml:lang', 'xml:space', 'y'],
    line: ['class', 'externalResourcesRequired', 'id', 'onactivate', 'onclick', 'onfocusin', 'onfocusout', 'onload', 'onmousedown', 'onmousemove', 'onmouseout', 'onmouseover', 'onmouseup', 'requiredExtensions', 'requiredFeatures', 'style', 'systemLanguage', 'transform', 'x1', 'x2', 'xml:base', 'xml:lang', 'xml:space', 'y1', 'y2'],
    linearGradient: ['class', 'externalResourcesRequired', 'gradientTransform', 'gradientUnits', 'id', 'spreadMethod', 'style', 'x1', 'x2', 'xlink:arcrole', 'xlink:href', 'xlink:role', 'xlink:title', 'xlink:type', 'xml:base', 'xml:lang', 'xml:space', 'y1', 'y2'],
    marker: ['class', 'externalResourcesRequired', 'id', 'markerHeight', 'markerUnits', 'markerWidth', 'orient', 'preserveAspectRatio', 'refX', 'refY', 'style', 'viewBox', 'xml:base', 'xml:lang', 'xml:space'],
    mask: ['class', 'externalResourcesRequired', 'height', 'id', 'maskContentUnits', 'maskUnits', 'requiredExtensions', 'requiredFeatures', 'style', 'systemLanguage', 'width', 'x', 'xml:base', 'xml:lang', 'xml:space', 'y'],
    metadata: ['id', 'xml:base', 'xml:lang', 'xml:space'],
    'missing-glyph': ['class', 'd', 'horiz-adv-x', 'id', 'style', 'vert-adv-y', 'vert-origin-x', 'vert-origin-y', 'xml:base', 'xml:lang', 'xml:space'],
    mpath: ['externalResourcesRequired', 'id', 'xlink:actuate', 'xlink:arcrole', 'xlink:href', 'xlink:role', 'xlink:show', 'xlink:title', 'xlink:type', 'xml:base', 'xml:lang', 'xml:space'],
    path: ['class', 'd', 'externalResourcesRequired', 'id', 'onactivate', 'onclick', 'onfocusin', 'onfocusout', 'onload', 'onmousedown', 'onmousemove', 'onmouseout', 'onmouseover', 'onmouseup', 'pathLength', 'requiredExtensions', 'requiredFeatures', 'style', 'systemLanguage', 'transform', 'xml:base', 'xml:lang', 'xml:space'],
    pattern: ['class', 'externalResourcesRequired', 'height', 'id', 'patternContentUnits', 'patternTransform', 'patternUnits', 'preserveAspectRatio', 'requiredExtensions', 'requiredFeatures', 'style', 'systemLanguage', 'viewBox', 'width', 'x', 'xlink:actuate', 'xlink:arcrole', 'xlink:href', 'xlink:role', 'xlink:show', 'xlink:title', 'xlink:type', 'xml:base', 'xml:lang', 'xml:space', 'y'],
    polygon: ['class', 'externalResourcesRequired', 'id', 'onactivate', 'onclick', 'onfocusin', 'onfocusout', 'onload', 'onmousedown', 'onmousemove', 'onmouseout', 'onmouseover', 'onmouseup', 'points', 'requiredExtensions', 'requiredFeatures', 'style', 'systemLanguage', 'transform', 'xml:base', 'xml:lang', 'xml:space'],
    polyline: ['class', 'externalResourcesRequired', 'id', 'onactivate', 'onclick', 'onfocusin', 'onfocusout', 'onload', 'onmousedown', 'onmousemove', 'onmouseout', 'onmouseover', 'onmouseup', 'points', 'requiredExtensions', 'requiredFeatures', 'style', 'systemLanguage', 'transform', 'xml:base', 'xml:lang', 'xml:space'],
    radialGradient: ['class', 'cx', 'cy', 'externalResourcesRequired', 'fx', 'fy', 'gradientTransform', 'gradientUnits', 'id', 'r', 'spreadMethod', 'style', 'xlink:arcrole', 'xlink:href', 'xlink:role', 'xlink:title', 'xlink:type', 'xml:base', 'xml:lang', 'xml:space'],
    rect: ['class', 'externalResourcesRequired', 'height', 'id', 'onactivate', 'onclick', 'onfocusin', 'onfocusout', 'onload', 'onmousedown', 'onmousemove', 'onmouseout', 'onmouseover', 'onmouseup', 'requiredExtensions', 'requiredFeatures', 'rx', 'ry', 'style', 'systemLanguage', 'transform', 'width', 'x', 'xml:base', 'xml:lang', 'xml:space', 'y'],
    script: ['externalResourcesRequired', 'id', 'type', 'xlink:actuate', 'xlink:arcrole', 'xlink:href', 'xlink:role', 'xlink:show', 'xlink:title', 'xlink:type', 'xml:base', 'xml:lang', 'xml:space'],
    set: ['attributeName', 'attributeType', 'begin', 'dur', 'end', 'externalResourcesRequired', 'fill', 'id', 'max', 'min', 'onbegin', 'onend', 'onload', 'onrepeat', 'repeatCount', 'repeatDur', 'requiredExtensions', 'requiredFeatures', 'restart', 'systemLanguage', 'to', 'xlink:actuate', 'xlink:arcrole', 'xlink:href', 'xlink:role', 'xlink:show', 'xlink:title', 'xlink:type', 'xml:base', 'xml:lang', 'xml:space'],
    stop: ['class', 'id', 'offset', 'style', 'xml:base', 'xml:lang', 'xml:space'],
    style: ['id', 'media', 'title', 'type', 'xml:base', 'xml:lang', 'xml:space'],
    svg: ['baseProfile', 'class', 'contentScriptType', 'contentStyleType', 'externalResourcesRequired', 'height', 'id', 'onabort', 'onactivate', 'onclick', 'onerror', 'onfocusin', 'onfocusout', 'onload', 'onmousedown', 'onmousemove', 'onmouseout', 'onmouseover', 'onmouseup', 'onresize', 'onscroll', 'onunload', 'onzoom', 'preserveAspectRatio', 'requiredExtensions', 'requiredFeatures', 'style', 'systemLanguage', 'version', 'viewBox', 'width', 'x', 'xml:base', 'xml:lang', 'xml:space', 'y', 'zoomAndPan'],
    switch: ['class', 'externalResourcesRequired', 'id', 'onactivate', 'onclick', 'onfocusin', 'onfocusout', 'onload', 'onmousedown', 'onmousemove', 'onmouseout', 'onmouseover', 'onmouseup', 'requiredExtensions', 'requiredFeatures', 'style', 'systemLanguage', 'transform', 'xml:base', 'xml:lang', 'xml:space'],
    symbol: ['class', 'externalResourcesRequired', 'id', 'onactivate', 'onclick', 'onfocusin', 'onfocusout', 'onload', 'onmousedown', 'onmousemove', 'onmouseout', 'onmouseover', 'onmouseup', 'preserveAspectRatio', 'style', 'viewBox', 'xml:base', 'xml:lang', 'xml:space'],
    text: ['class', 'dx', 'dy', 'externalResourcesRequired', 'id', 'lengthAdjust', 'onactivate', 'onclick', 'onfocusin', 'onfocusout', 'onload', 'onmousedown', 'onmousemove', 'onmouseout', 'onmouseover', 'onmouseup', 'requiredExtensions', 'requiredFeatures', 'rotate', 'style', 'systemLanguage', 'textLength', 'transform', 'x', 'xml:base', 'xml:lang', 'xml:space', 'y'],
    textPath: ['class', 'externalResourcesRequired', 'id', 'lengthAdjust', 'method', 'onactivate', 'onclick', 'onfocusin', 'onfocusout', 'onload', 'onmousedown', 'onmousemove', 'onmouseout', 'onmouseover', 'onmouseup', 'requiredExtensions', 'requiredFeatures', 'spacing', 'startOffset', 'style', 'systemLanguage', 'textLength', 'xlink:arcrole', 'xlink:href', 'xlink:role', 'xlink:title', 'xlink:type', 'xml:base', 'xml:lang', 'xml:space'],
    title: ['class', 'id', 'style', 'xml:base', 'xml:lang', 'xml:space'],
    tref: ['class', 'dx', 'dy', 'externalResourcesRequired', 'id', 'lengthAdjust', 'onactivate', 'onclick', 'onfocusin', 'onfocusout', 'onload', 'onmousedown', 'onmousemove', 'onmouseout', 'onmouseover', 'onmouseup', 'requiredExtensions', 'requiredFeatures', 'rotate', 'style', 'systemLanguage', 'textLength', 'x', 'xlink:arcrole', 'xlink:href', 'xlink:role', 'xlink:title', 'xlink:type', 'xml:base', 'xml:lang', 'xml:space', 'y'],
    tspan: ['class', 'dx', 'dy', 'externalResourcesRequired', 'id', 'lengthAdjust', 'onactivate', 'onclick', 'onfocusin', 'onfocusout', 'onload', 'onmousedown', 'onmousemove', 'onmouseout', 'onmouseover', 'onmouseup', 'requiredExtensions', 'requiredFeatures', 'rotate', 'style', 'systemLanguage', 'textLength', 'x', 'xml:base', 'xml:lang', 'xml:space', 'y'],
    use: ['class', 'externalResourcesRequired', 'height', 'id', 'onactivate', 'onclick', 'onfocusin', 'onfocusout', 'onload', 'onmousedown', 'onmousemove', 'onmouseout', 'onmouseover', 'onmouseup', 'requiredExtensions', 'requiredFeatures', 'style', 'systemLanguage', 'transform', 'width', 'x', 'xlink:actuate', 'xlink:arcrole', 'xlink:href', 'xlink:role', 'xlink:show', 'xlink:title', 'xlink:type', 'xml:base', 'xml:lang', 'xml:space', 'y'],
    view: ['externalResourcesRequired', 'id', 'preserveAspectRatio', 'viewBox', 'viewTarget', 'xml:base', 'xml:lang', 'xml:space', 'zoomAndPan'],
    vkern: ['g1', 'g2', 'id', 'k', 'u1', 'u2', 'xml:base', 'xml:lang', 'xml:space']
  };


  svgPresentationElements = {
    'a': true,
    'altGlyph': true,
    'animate': true,
    'animateColor': true,
    'circle': true,
    'clipPath': true,
    'defs': true,
    'ellipse': true,
    'feBlend': true,
    'feColorMatrix': true,
    'feComponentTransfer': true,
    'feComposite': true,
    'feConvolveMatrix': true,
    'feDiffuseLighting': true,
    'feDisplacementMap': true,
    'feFlood': true,
    'feGaussianBlur': true,
    'feImage': true,
    'feMerge': true,
    'feMorphology': true,
    'feOffset': true,
    'feSpecularLighting': true,
    'feTile': true,
    'feTurbulence': true,
    'filter': true,
    'font': true,
    'foreignObject': true,
    'g': true,
    'glyph': true,
    'glyphRef': true,
    'image': true,
    'line': true,
    'linearGradient': true,
    'marker': true,
    'mask': true,
    'missing-glyph': true,
    'path': true,
    'pattern': true,
    'polygon': true,
    'polyline': true,
    'radialGradient': true,
    'rect': true,
    'stop': true,
    'svg': true,
    'switch': true,
    'symbol': true,
    'text': true,
    'textPath': true,
    'tref': true,
    'tspan': true,
    'use': true
  };

  svgPresentationAttributes = {
    'alignment-baseline': true,
    'baseline-shift': true,
    'clip-path': true,
    'clip-rule': true,
    'clip': true,
    'color-interpolation-filters': true,
    'color-interpolation': true,
    'color-profile': true,
    'color-rendering': true,
    'color': true,
    'cursor': true,
    'direction': true,
    'display': true,
    'dominant-baseline': true,
    'enable-background': true,
    'fill-opacity': true,
    'fill-rule': true,
    'fill': true,
    'filter': true,
    'flood-color': true,
    'flood-opacity': true,
    'font-family': true,
    'font-size-adjust': true,
    'font-size': true,
    'font-stretch': true,
    'font-style': true,
    'font-variant': true,
    'font-weight': true,
    'glyph-orientation-horizontal': true,
    'glyph-orientation-vertical': true,
    'image-rendering': true,
    'kerning': true,
    'letter-spacing': true,
    'lighting-color': true,
    'marker-end': true,
    'marker-mid': true,
    'marker-start': true,
    'mask': true,
    'opacity': true,
    'overflow': true,
    'pointer-events': true,
    'shape-rendering': true,
    'stop-color': true,
    'stop-opacity': true,
    'stroke-dasharray': true,
    'stroke-dashoffset': true,
    'stroke-linecap': true,
    'stroke-linejoin': true,
    'stroke-miterlimit': true,
    'stroke-opacity': true,
    'stroke-width': true,
    'stroke': true,
    'text-anchor': true,
    'text-decoration': true,
    'text-rendering': true,
    'unicode-bidi': true,
    'visibility': true,
    'word-spacing': true,
    'writing-mode': true
  };

  let createElement = function (html) {
    let div = __WEBPACK_IMPORTED_MODULE_1_aurelia_pal__["DOM"].createElement('div');
    div.innerHTML = html;
    return div.firstChild;
  };

  svgAnalyzer = class SVGAnalyzer {
    constructor() {
      if (createElement('<svg><altGlyph /></svg>').firstElementChild.nodeName === 'altglyph' && elements.altGlyph) {
        elements.altglyph = elements.altGlyph;
        delete elements.altGlyph;
        elements.altglyphdef = elements.altGlyphDef;
        delete elements.altGlyphDef;
        elements.altglyphitem = elements.altGlyphItem;
        delete elements.altGlyphItem;
        elements.glyphref = elements.glyphRef;
        delete elements.glyphRef;
      }
    }

    isStandardSvgAttribute(nodeName, attributeName) {
      return presentationElements[nodeName] && presentationAttributes[attributeName] || elements[nodeName] && elements[nodeName].indexOf(attributeName) !== -1;
    }
  };
}

const elements = svgElements;
/* harmony export (immutable) */ exports["elements"] = elements;

const presentationElements = svgPresentationElements;
/* harmony export (immutable) */ exports["presentationElements"] = presentationElements;

const presentationAttributes = svgPresentationAttributes;
/* harmony export (immutable) */ exports["presentationAttributes"] = presentationAttributes;

const SVGAnalyzer = svgAnalyzer || class {
  isStandardSvgAttribute() {
    return false;
  }
};
/* harmony export (immutable) */ exports["SVGAnalyzer"] = SVGAnalyzer;


let ObserverLocator = (_temp = _class11 = class ObserverLocator {
  constructor(taskQueue, eventManager, dirtyChecker, svgAnalyzer, parser) {
    this.taskQueue = taskQueue;
    this.eventManager = eventManager;
    this.dirtyChecker = dirtyChecker;
    this.svgAnalyzer = svgAnalyzer;
    this.parser = parser;

    this.adapters = [];
    this.logger = __WEBPACK_IMPORTED_MODULE_0_aurelia_logging__["getLogger"]('observer-locator');
  }

  getObserver(obj, propertyName) {
    let observersLookup = obj.__observers__;
    let observer;

    if (observersLookup && propertyName in observersLookup) {
      return observersLookup[propertyName];
    }

    observer = this.createPropertyObserver(obj, propertyName);

    if (!observer.doNotCache) {
      if (observersLookup === undefined) {
        observersLookup = this.getOrCreateObserversLookup(obj);
      }

      observersLookup[propertyName] = observer;
    }

    return observer;
  }

  getOrCreateObserversLookup(obj) {
    return obj.__observers__ || this.createObserversLookup(obj);
  }

  createObserversLookup(obj) {
    let value = {};

    if (!Reflect.defineProperty(obj, '__observers__', {
      enumerable: false,
      configurable: false,
      writable: false,
      value: value
    })) {
      this.logger.warn('Cannot add observers to object', obj);
    }

    return value;
  }

  addAdapter(adapter) {
    this.adapters.push(adapter);
  }

  getAdapterObserver(obj, propertyName, descriptor) {
    for (let i = 0, ii = this.adapters.length; i < ii; i++) {
      let adapter = this.adapters[i];
      let observer = adapter.getObserver(obj, propertyName, descriptor);
      if (observer) {
        return observer;
      }
    }
    return null;
  }

  createPropertyObserver(obj, propertyName) {
    let descriptor;
    let handler;
    let xlinkResult;

    if (!(obj instanceof Object)) {
      return new PrimitiveObserver(obj, propertyName);
    }

    if (obj instanceof __WEBPACK_IMPORTED_MODULE_1_aurelia_pal__["DOM"].Element) {
      if (propertyName === 'class') {
        return new ClassObserver(obj);
      }
      if (propertyName === 'style' || propertyName === 'css') {
        return new StyleObserver(obj, propertyName);
      }
      handler = this.eventManager.getElementHandler(obj, propertyName);
      if (propertyName === 'value' && obj.tagName.toLowerCase() === 'select') {
        return new SelectValueObserver(obj, handler, this);
      }
      if (propertyName === 'checked' && obj.tagName.toLowerCase() === 'input') {
        return new CheckedObserver(obj, handler, this);
      }
      if (handler) {
        return new ValueAttributeObserver(obj, propertyName, handler);
      }
      xlinkResult = /^xlink:(.+)$/.exec(propertyName);
      if (xlinkResult) {
        return new XLinkAttributeObserver(obj, propertyName, xlinkResult[1]);
      }
      if (propertyName === 'role' && (obj instanceof __WEBPACK_IMPORTED_MODULE_1_aurelia_pal__["DOM"].Element || obj instanceof __WEBPACK_IMPORTED_MODULE_1_aurelia_pal__["DOM"].SVGElement) || /^\w+:|^data-|^aria-/.test(propertyName) || obj instanceof __WEBPACK_IMPORTED_MODULE_1_aurelia_pal__["DOM"].SVGElement && this.svgAnalyzer.isStandardSvgAttribute(obj.nodeName, propertyName)) {
        return new DataAttributeObserver(obj, propertyName);
      }
    }

    descriptor = Object.getPropertyDescriptor(obj, propertyName);

    if (hasDeclaredDependencies(descriptor)) {
      return createComputedObserver(obj, propertyName, descriptor, this);
    }

    if (descriptor) {
      const existingGetterOrSetter = descriptor.get || descriptor.set;
      if (existingGetterOrSetter) {
        if (existingGetterOrSetter.getObserver) {
          return existingGetterOrSetter.getObserver(obj);
        }

        let adapterObserver = this.getAdapterObserver(obj, propertyName, descriptor);
        if (adapterObserver) {
          return adapterObserver;
        }
        return new DirtyCheckProperty(this.dirtyChecker, obj, propertyName);
      }
    }

    if (obj instanceof Array) {
      if (propertyName === 'length') {
        return this.getArrayObserver(obj).getLengthObserver();
      }

      return new DirtyCheckProperty(this.dirtyChecker, obj, propertyName);
    } else if (obj instanceof Map) {
      if (propertyName === 'size') {
        return this.getMapObserver(obj).getLengthObserver();
      }

      return new DirtyCheckProperty(this.dirtyChecker, obj, propertyName);
    } else if (obj instanceof Set) {
      if (propertyName === 'size') {
        return this.getSetObserver(obj).getLengthObserver();
      }

      return new DirtyCheckProperty(this.dirtyChecker, obj, propertyName);
    }

    return new SetterObserver(this.taskQueue, obj, propertyName);
  }

  getAccessor(obj, propertyName) {
    if (obj instanceof __WEBPACK_IMPORTED_MODULE_1_aurelia_pal__["DOM"].Element) {
      if (propertyName === 'class' || propertyName === 'style' || propertyName === 'css' || propertyName === 'value' && (obj.tagName.toLowerCase() === 'input' || obj.tagName.toLowerCase() === 'select') || propertyName === 'checked' && obj.tagName.toLowerCase() === 'input' || propertyName === 'model' && obj.tagName.toLowerCase() === 'input' || /^xlink:.+$/.exec(propertyName)) {
        return this.getObserver(obj, propertyName);
      }
      if (/^\w+:|^data-|^aria-/.test(propertyName) || obj instanceof __WEBPACK_IMPORTED_MODULE_1_aurelia_pal__["DOM"].SVGElement && this.svgAnalyzer.isStandardSvgAttribute(obj.nodeName, propertyName) || obj.tagName.toLowerCase() === 'img' && propertyName === 'src' || obj.tagName.toLowerCase() === 'a' && propertyName === 'href') {
        return dataAttributeAccessor;
      }
    }
    return propertyAccessor;
  }

  getArrayObserver(array) {
    return getArrayObserver(this.taskQueue, array);
  }

  getMapObserver(map) {
    return getMapObserver(this.taskQueue, map);
  }

  getSetObserver(set) {
    return getSetObserver(this.taskQueue, set);
  }
}, _class11.inject = [__WEBPACK_IMPORTED_MODULE_2_aurelia_task_queue__["TaskQueue"], EventManager, DirtyChecker, SVGAnalyzer, Parser], _temp);

let ObjectObservationAdapter = class ObjectObservationAdapter {
  getObserver(object, propertyName, descriptor) {
    throw new Error('BindingAdapters must implement getObserver(object, propertyName).');
  }
};

let BindingExpression = class BindingExpression {
  constructor(observerLocator, targetProperty, sourceExpression, mode, lookupFunctions, attribute) {
    this.observerLocator = observerLocator;
    this.targetProperty = targetProperty;
    this.sourceExpression = sourceExpression;
    this.mode = mode;
    this.lookupFunctions = lookupFunctions;
    this.attribute = attribute;
    this.discrete = false;
  }

  createBinding(target) {
    return new Binding(this.observerLocator, this.sourceExpression, target, this.targetProperty, this.mode, this.lookupFunctions);
  }
};

let Binding = (_dec10 = connectable(), _dec10(_class12 = class Binding {
  constructor(observerLocator, sourceExpression, target, targetProperty, mode, lookupFunctions) {
    this.observerLocator = observerLocator;
    this.sourceExpression = sourceExpression;
    this.target = target;
    this.targetProperty = targetProperty;
    this.mode = mode;
    this.lookupFunctions = lookupFunctions;
  }

  updateTarget(value) {
    this.targetObserver.setValue(value, this.target, this.targetProperty);
  }

  updateSource(value) {
    this.sourceExpression.assign(this.source, value, this.lookupFunctions);
  }

  call(context, newValue, oldValue) {
    if (!this.isBound) {
      return;
    }
    if (context === sourceContext) {
      oldValue = this.targetObserver.getValue(this.target, this.targetProperty);
      newValue = this.sourceExpression.evaluate(this.source, this.lookupFunctions);
      if (newValue !== oldValue) {
        this.updateTarget(newValue);
      }
      if (this.mode !== bindingMode.oneTime) {
        this._version++;
        this.sourceExpression.connect(this, this.source);
        this.unobserve(false);
      }
      return;
    }
    if (context === targetContext) {
      if (newValue !== this.sourceExpression.evaluate(this.source, this.lookupFunctions)) {
        this.updateSource(newValue);
      }
      return;
    }
    throw new Error(`Unexpected call context ${context}`);
  }

  bind(source) {
    if (this.isBound) {
      if (this.source === source) {
        return;
      }
      this.unbind();
    }
    this.isBound = true;
    this.source = source;

    if (this.sourceExpression.bind) {
      this.sourceExpression.bind(this, source, this.lookupFunctions);
    }

    let mode = this.mode;
    if (!this.targetObserver) {
      let method = mode === bindingMode.twoWay || mode === bindingMode.fromView ? 'getObserver' : 'getAccessor';
      this.targetObserver = this.observerLocator[method](this.target, this.targetProperty);
    }

    if ('bind' in this.targetObserver) {
      this.targetObserver.bind();
    }
    if (this.mode !== bindingMode.fromView) {
      let value = this.sourceExpression.evaluate(source, this.lookupFunctions);
      this.updateTarget(value);
    }

    if (mode === bindingMode.oneTime) {
      return;
    } else if (mode === bindingMode.toView) {
      enqueueBindingConnect(this);
    } else if (mode === bindingMode.twoWay) {
      this.sourceExpression.connect(this, source);
      this.targetObserver.subscribe(targetContext, this);
    } else if (mode === bindingMode.fromView) {
      this.targetObserver.subscribe(targetContext, this);
    }
  }

  unbind() {
    if (!this.isBound) {
      return;
    }
    this.isBound = false;
    if (this.sourceExpression.unbind) {
      this.sourceExpression.unbind(this, this.source);
    }
    this.source = null;
    if ('unbind' in this.targetObserver) {
      this.targetObserver.unbind();
    }
    if (this.targetObserver.unsubscribe) {
      this.targetObserver.unsubscribe(targetContext, this);
    }
    this.unobserve(true);
  }

  connect(evaluate) {
    if (!this.isBound) {
      return;
    }
    if (evaluate) {
      let value = this.sourceExpression.evaluate(this.source, this.lookupFunctions);
      this.updateTarget(value);
    }
    this.sourceExpression.connect(this, this.source);
  }
}) || _class12);

let CallExpression = class CallExpression {
  constructor(observerLocator, targetProperty, sourceExpression, lookupFunctions) {
    this.observerLocator = observerLocator;
    this.targetProperty = targetProperty;
    this.sourceExpression = sourceExpression;
    this.lookupFunctions = lookupFunctions;
  }

  createBinding(target) {
    return new Call(this.observerLocator, this.sourceExpression, target, this.targetProperty, this.lookupFunctions);
  }
};

let Call = class Call {
  constructor(observerLocator, sourceExpression, target, targetProperty, lookupFunctions) {
    this.sourceExpression = sourceExpression;
    this.target = target;
    this.targetProperty = observerLocator.getObserver(target, targetProperty);
    this.lookupFunctions = lookupFunctions;
  }

  callSource($event) {
    let overrideContext = this.source.overrideContext;
    Object.assign(overrideContext, $event);
    overrideContext.$event = $event;
    let mustEvaluate = true;
    let result = this.sourceExpression.evaluate(this.source, this.lookupFunctions, mustEvaluate);
    delete overrideContext.$event;
    for (let prop in $event) {
      delete overrideContext[prop];
    }
    return result;
  }

  bind(source) {
    if (this.isBound) {
      if (this.source === source) {
        return;
      }
      this.unbind();
    }
    this.isBound = true;
    this.source = source;

    if (this.sourceExpression.bind) {
      this.sourceExpression.bind(this, source, this.lookupFunctions);
    }
    this.targetProperty.setValue($event => this.callSource($event));
  }

  unbind() {
    if (!this.isBound) {
      return;
    }
    this.isBound = false;
    if (this.sourceExpression.unbind) {
      this.sourceExpression.unbind(this, this.source);
    }
    this.source = null;
    this.targetProperty.setValue(null);
  }
};

let ValueConverterResource = class ValueConverterResource {
  constructor(name) {
    this.name = name;
  }

  static convention(name) {
    if (name.endsWith('ValueConverter')) {
      return new ValueConverterResource(camelCase(name.substring(0, name.length - 14)));
    }
  }

  initialize(container, target) {
    this.instance = container.get(target);
  }

  register(registry, name) {
    registry.registerValueConverter(name || this.name, this.instance);
  }

  load(container, target) {}
};

function valueConverter(nameOrTarget) {
  if (nameOrTarget === undefined || typeof nameOrTarget === 'string') {
    return function (target) {
      __WEBPACK_IMPORTED_MODULE_3_aurelia_metadata__["metadata"].define(__WEBPACK_IMPORTED_MODULE_3_aurelia_metadata__["metadata"].resource, new ValueConverterResource(nameOrTarget), target);
    };
  }

  __WEBPACK_IMPORTED_MODULE_3_aurelia_metadata__["metadata"].define(__WEBPACK_IMPORTED_MODULE_3_aurelia_metadata__["metadata"].resource, new ValueConverterResource(), nameOrTarget);
}

let BindingBehaviorResource = class BindingBehaviorResource {
  constructor(name) {
    this.name = name;
  }

  static convention(name) {
    if (name.endsWith('BindingBehavior')) {
      return new BindingBehaviorResource(camelCase(name.substring(0, name.length - 15)));
    }
  }

  initialize(container, target) {
    this.instance = container.get(target);
  }

  register(registry, name) {
    registry.registerBindingBehavior(name || this.name, this.instance);
  }

  load(container, target) {}
};

function bindingBehavior(nameOrTarget) {
  if (nameOrTarget === undefined || typeof nameOrTarget === 'string') {
    return function (target) {
      __WEBPACK_IMPORTED_MODULE_3_aurelia_metadata__["metadata"].define(__WEBPACK_IMPORTED_MODULE_3_aurelia_metadata__["metadata"].resource, new BindingBehaviorResource(nameOrTarget), target);
    };
  }

  __WEBPACK_IMPORTED_MODULE_3_aurelia_metadata__["metadata"].define(__WEBPACK_IMPORTED_MODULE_3_aurelia_metadata__["metadata"].resource, new BindingBehaviorResource(), nameOrTarget);
}

let ListenerExpression = class ListenerExpression {
  constructor(eventManager, targetEvent, sourceExpression, delegationStrategy, preventDefault, lookupFunctions) {
    this.eventManager = eventManager;
    this.targetEvent = targetEvent;
    this.sourceExpression = sourceExpression;
    this.delegationStrategy = delegationStrategy;
    this.discrete = true;
    this.preventDefault = preventDefault;
    this.lookupFunctions = lookupFunctions;
  }

  createBinding(target) {
    return new Listener(this.eventManager, this.targetEvent, this.delegationStrategy, this.sourceExpression, target, this.preventDefault, this.lookupFunctions);
  }
};

let Listener = class Listener {
  constructor(eventManager, targetEvent, delegationStrategy, sourceExpression, target, preventDefault, lookupFunctions) {
    this.eventManager = eventManager;
    this.targetEvent = targetEvent;
    this.delegationStrategy = delegationStrategy;
    this.sourceExpression = sourceExpression;
    this.target = target;
    this.preventDefault = preventDefault;
    this.lookupFunctions = lookupFunctions;
  }

  callSource(event) {
    let overrideContext = this.source.overrideContext;
    overrideContext.$event = event;
    let mustEvaluate = true;
    let result = this.sourceExpression.evaluate(this.source, this.lookupFunctions, mustEvaluate);
    delete overrideContext.$event;
    if (result !== true && this.preventDefault) {
      event.preventDefault();
    }
    return result;
  }

  handleEvent(event) {
    this.callSource(event);
  }

  bind(source) {
    if (this.isBound) {
      if (this.source === source) {
        return;
      }
      this.unbind();
    }
    this.isBound = true;
    this.source = source;

    if (this.sourceExpression.bind) {
      this.sourceExpression.bind(this, source, this.lookupFunctions);
    }
    this._handler = this.eventManager.addEventListener(this.target, this.targetEvent, this, this.delegationStrategy, true);
  }

  unbind() {
    if (!this.isBound) {
      return;
    }
    this.isBound = false;
    if (this.sourceExpression.unbind) {
      this.sourceExpression.unbind(this, this.source);
    }
    this.source = null;
    this._handler.dispose();
    this._handler = null;
  }
};

function getAU(element) {
  let au = element.au;

  if (au === undefined) {
    throw new Error(`No Aurelia APIs are defined for the element: "${element.tagName}".`);
  }

  return au;
}

let NameExpression = class NameExpression {
  constructor(sourceExpression, apiName, lookupFunctions) {
    this.sourceExpression = sourceExpression;
    this.apiName = apiName;
    this.lookupFunctions = lookupFunctions;
    this.discrete = true;
  }

  createBinding(target) {
    return new NameBinder(this.sourceExpression, NameExpression.locateAPI(target, this.apiName), this.lookupFunctions);
  }

  static locateAPI(element, apiName) {
    switch (apiName) {
      case 'element':
        return element;
      case 'controller':
        return getAU(element).controller;
      case 'view-model':
        return getAU(element).controller.viewModel;
      case 'view':
        return getAU(element).controller.view;
      default:
        let target = getAU(element)[apiName];

        if (target === undefined) {
          throw new Error(`Attempted to reference "${apiName}", but it was not found amongst the target's API.`);
        }

        return target.viewModel;
    }
  }
};

let NameBinder = class NameBinder {
  constructor(sourceExpression, target, lookupFunctions) {
    this.sourceExpression = sourceExpression;
    this.target = target;
    this.lookupFunctions = lookupFunctions;
  }

  bind(source) {
    if (this.isBound) {
      if (this.source === source) {
        return;
      }
      this.unbind();
    }
    this.isBound = true;
    this.source = source;
    if (this.sourceExpression.bind) {
      this.sourceExpression.bind(this, source, this.lookupFunctions);
    }
    this.sourceExpression.assign(this.source, this.target, this.lookupFunctions);
  }

  unbind() {
    if (!this.isBound) {
      return;
    }
    this.isBound = false;
    if (this.sourceExpression.evaluate(this.source, this.lookupFunctions) === this.target) {
      this.sourceExpression.assign(this.source, null, this.lookupFunctions);
    }
    if (this.sourceExpression.unbind) {
      this.sourceExpression.unbind(this, this.source);
    }
    this.source = null;
  }
};


const LookupFunctions = {
  bindingBehaviors: name => null,
  valueConverters: name => null
};

let BindingEngine = (_temp2 = _class13 = class BindingEngine {

  constructor(observerLocator, parser) {
    this.observerLocator = observerLocator;
    this.parser = parser;
  }

  createBindingExpression(targetProperty, sourceExpression, mode = bindingMode.toView, lookupFunctions = LookupFunctions) {
    return new BindingExpression(this.observerLocator, targetProperty, this.parser.parse(sourceExpression), mode, lookupFunctions);
  }

  propertyObserver(obj, propertyName) {
    return {
      subscribe: callback => {
        let observer = this.observerLocator.getObserver(obj, propertyName);
        observer.subscribe(callback);
        return {
          dispose: () => observer.unsubscribe(callback)
        };
      }
    };
  }

  collectionObserver(collection) {
    return {
      subscribe: callback => {
        let observer;
        if (collection instanceof Array) {
          observer = this.observerLocator.getArrayObserver(collection);
        } else if (collection instanceof Map) {
          observer = this.observerLocator.getMapObserver(collection);
        } else if (collection instanceof Set) {
          observer = this.observerLocator.getSetObserver(collection);
        } else {
          throw new Error('collection must be an instance of Array, Map or Set.');
        }
        observer.subscribe(callback);
        return {
          dispose: () => observer.unsubscribe(callback)
        };
      }
    };
  }

  expressionObserver(bindingContext, expression) {
    let scope = { bindingContext, overrideContext: createOverrideContext(bindingContext) };
    return new ExpressionObserver(scope, this.parser.parse(expression), this.observerLocator, LookupFunctions);
  }

  parseExpression(expression) {
    return this.parser.parse(expression);
  }

  registerAdapter(adapter) {
    this.observerLocator.addAdapter(adapter);
  }
}, _class13.inject = [ObserverLocator, Parser], _temp2);

let setProto = Set.prototype;

function getSetObserver(taskQueue, set) {
  return ModifySetObserver.for(taskQueue, set);
}

let ModifySetObserver = class ModifySetObserver extends ModifyCollectionObserver {
  constructor(taskQueue, set) {
    super(taskQueue, set);
  }

  static for(taskQueue, set) {
    if (!('__set_observer__' in set)) {
      Reflect.defineProperty(set, '__set_observer__', {
        value: ModifySetObserver.create(taskQueue, set),
        enumerable: false, configurable: false
      });
    }
    return set.__set_observer__;
  }

  static create(taskQueue, set) {
    let observer = new ModifySetObserver(taskQueue, set);

    let proto = setProto;
    if (proto.add !== set.add || proto.delete !== set.delete || proto.clear !== set.clear) {
      proto = {
        add: set.add,
        delete: set.delete,
        clear: set.clear
      };
    }

    set.add = function () {
      let type = 'add';
      let oldSize = set.size;
      let methodCallResult = proto.add.apply(set, arguments);
      let hasValue = set.size === oldSize;
      if (!hasValue) {
        observer.addChangeRecord({
          type: type,
          object: set,
          value: Array.from(set).pop()
        });
      }
      return methodCallResult;
    };

    set.delete = function () {
      let hasValue = set.has(arguments[0]);
      let methodCallResult = proto.delete.apply(set, arguments);
      if (hasValue) {
        observer.addChangeRecord({
          type: 'delete',
          object: set,
          value: arguments[0]
        });
      }
      return methodCallResult;
    };

    set.clear = function () {
      let methodCallResult = proto.clear.apply(set, arguments);
      observer.addChangeRecord({
        type: 'clear',
        object: set
      });
      return methodCallResult;
    };

    return observer;
  }
};


function observable(targetOrConfig, key, descriptor) {
  function deco(target, key, descriptor, config) {
    const isClassDecorator = key === undefined;
    if (isClassDecorator) {
      target = target.prototype;
      key = typeof config === 'string' ? config : config.name;
    }

    let innerPropertyName = `_${key}`;
    const innerPropertyDescriptor = {
      configurable: true,
      enumerable: false,
      writable: true
    };

    const callbackName = config && config.changeHandler || `${key}Changed`;

    if (descriptor) {
      if (typeof descriptor.initializer === 'function') {
        innerPropertyDescriptor.value = descriptor.initializer();
      }
    } else {
      descriptor = {};
    }

    if (!('enumerable' in descriptor)) {
      descriptor.enumerable = true;
    }

    delete descriptor.value;
    delete descriptor.writable;
    delete descriptor.initializer;

    Reflect.defineProperty(target, innerPropertyName, innerPropertyDescriptor);

    descriptor.get = function () {
      return this[innerPropertyName];
    };
    descriptor.set = function (newValue) {
      let oldValue = this[innerPropertyName];
      if (newValue === oldValue) {
        return;
      }

      this[innerPropertyName] = newValue;
      Reflect.defineProperty(this, innerPropertyName, { enumerable: false });

      if (this[callbackName]) {
        this[callbackName](newValue, oldValue, key);
      }
    };

    descriptor.get.dependencies = [innerPropertyName];

    if (isClassDecorator) {
      Reflect.defineProperty(target, key, descriptor);
    } else {
      return descriptor;
    }
  }

  if (key === undefined) {
    return (t, k, d) => deco(t, k, d, targetOrConfig);
  }
  return deco(targetOrConfig, key, descriptor);
}

const signals = {};

function connectBindingToSignal(binding, name) {
  if (!signals.hasOwnProperty(name)) {
    signals[name] = 0;
  }
  binding.observeProperty(signals, name);
}

function signalBindings(name) {
  if (signals.hasOwnProperty(name)) {
    signals[name]++;
  }
}

/***/ },

/***/ 294:
/***/ function(module, exports) {

"use strict";
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});



var AbstractRepeater = exports.AbstractRepeater = function () {
  function AbstractRepeater(options) {
    

    Object.assign(this, {
      local: 'items',
      viewsRequireLifecycle: true
    }, options);
  }

  AbstractRepeater.prototype.viewCount = function viewCount() {
    throw new Error('subclass must implement `viewCount`');
  };

  AbstractRepeater.prototype.views = function views() {
    throw new Error('subclass must implement `views`');
  };

  AbstractRepeater.prototype.view = function view(index) {
    throw new Error('subclass must implement `view`');
  };

  AbstractRepeater.prototype.matcher = function matcher() {
    throw new Error('subclass must implement `matcher`');
  };

  AbstractRepeater.prototype.addView = function addView(bindingContext, overrideContext) {
    throw new Error('subclass must implement `addView`');
  };

  AbstractRepeater.prototype.insertView = function insertView(index, bindingContext, overrideContext) {
    throw new Error('subclass must implement `insertView`');
  };

  AbstractRepeater.prototype.moveView = function moveView(sourceIndex, targetIndex) {
    throw new Error('subclass must implement `moveView`');
  };

  AbstractRepeater.prototype.removeAllViews = function removeAllViews(returnToCache, skipAnimation) {
    throw new Error('subclass must implement `removeAllViews`');
  };

  AbstractRepeater.prototype.removeViews = function removeViews(viewsToRemove, returnToCache, skipAnimation) {
    throw new Error('subclass must implement `removeView`');
  };

  AbstractRepeater.prototype.removeView = function removeView(index, returnToCache, skipAnimation) {
    throw new Error('subclass must implement `removeView`');
  };

  AbstractRepeater.prototype.updateBindings = function updateBindings(view) {
    throw new Error('subclass must implement `updateBindings`');
  };

  return AbstractRepeater;
}();

/***/ },

/***/ 295:
/***/ function(module, exports) {

"use strict";
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.viewsRequireLifecycle = viewsRequireLifecycle;
var lifecycleOptionalBehaviors = exports.lifecycleOptionalBehaviors = ['focus', 'if', 'else', 'repeat', 'show', 'hide', 'with'];

function behaviorRequiresLifecycle(instruction) {
  var t = instruction.type;
  var name = t.elementName !== null ? t.elementName : t.attributeName;
  return lifecycleOptionalBehaviors.indexOf(name) === -1 && (t.handlesAttached || t.handlesBind || t.handlesCreated || t.handlesDetached || t.handlesUnbind) || t.viewFactory && viewsRequireLifecycle(t.viewFactory) || instruction.viewFactory && viewsRequireLifecycle(instruction.viewFactory);
}

function targetRequiresLifecycle(instruction) {
  var behaviors = instruction.behaviorInstructions;
  if (behaviors) {
    var i = behaviors.length;
    while (i--) {
      if (behaviorRequiresLifecycle(behaviors[i])) {
        return true;
      }
    }
  }

  return instruction.viewFactory && viewsRequireLifecycle(instruction.viewFactory);
}

function viewsRequireLifecycle(viewFactory) {
  if ('_viewsRequireLifecycle' in viewFactory) {
    return viewFactory._viewsRequireLifecycle;
  }

  viewFactory._viewsRequireLifecycle = false;

  if (viewFactory.viewFactory) {
    viewFactory._viewsRequireLifecycle = viewsRequireLifecycle(viewFactory.viewFactory);
    return viewFactory._viewsRequireLifecycle;
  }

  if (viewFactory.template.querySelector('.au-animate')) {
    viewFactory._viewsRequireLifecycle = true;
    return true;
  }

  for (var id in viewFactory.instructions) {
    if (targetRequiresLifecycle(viewFactory.instructions[id])) {
      viewFactory._viewsRequireLifecycle = true;
      return true;
    }
  }

  viewFactory._viewsRequireLifecycle = false;
  return false;
}

/***/ },

/***/ 296:
/***/ function(module, exports, __webpack_require__) {

"use strict";
/* WEBPACK VAR INJECTION */(function(Promise) {'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.ArrayRepeatStrategy = undefined;

var _repeatUtilities = __webpack_require__(104);

var _aureliaBinding = __webpack_require__(24);



var ArrayRepeatStrategy = exports.ArrayRepeatStrategy = function () {
  function ArrayRepeatStrategy() {
    
  }

  ArrayRepeatStrategy.prototype.getCollectionObserver = function getCollectionObserver(observerLocator, items) {
    return observerLocator.getArrayObserver(items);
  };

  ArrayRepeatStrategy.prototype.instanceChanged = function instanceChanged(repeat, items) {
    var _this = this;

    var itemsLength = items.length;

    if (!items || itemsLength === 0) {
      repeat.removeAllViews(true, !repeat.viewsRequireLifecycle);
      return;
    }

    var children = repeat.views();
    var viewsLength = children.length;

    if (viewsLength === 0) {
      this._standardProcessInstanceChanged(repeat, items);
      return;
    }

    if (repeat.viewsRequireLifecycle) {
      var childrenSnapshot = children.slice(0);
      var itemNameInBindingContext = repeat.local;
      var matcher = repeat.matcher();

      var itemsPreviouslyInViews = [];
      var viewsToRemove = [];

      for (var index = 0; index < viewsLength; index++) {
        var view = childrenSnapshot[index];
        var oldItem = view.bindingContext[itemNameInBindingContext];

        if ((0, _repeatUtilities.indexOf)(items, oldItem, matcher) === -1) {
          viewsToRemove.push(view);
        } else {
          itemsPreviouslyInViews.push(oldItem);
        }
      }

      var updateViews = void 0;
      var removePromise = void 0;

      if (itemsPreviouslyInViews.length > 0) {
        removePromise = repeat.removeViews(viewsToRemove, true, !repeat.viewsRequireLifecycle);
        updateViews = function updateViews() {
          for (var _index = 0; _index < itemsLength; _index++) {
            var item = items[_index];
            var indexOfView = (0, _repeatUtilities.indexOf)(itemsPreviouslyInViews, item, matcher, _index);
            var _view = void 0;

            if (indexOfView === -1) {
              var overrideContext = (0, _repeatUtilities.createFullOverrideContext)(repeat, items[_index], _index, itemsLength);
              repeat.insertView(_index, overrideContext.bindingContext, overrideContext);

              itemsPreviouslyInViews.splice(_index, 0, undefined);
            } else if (indexOfView === _index) {
              _view = children[indexOfView];
              itemsPreviouslyInViews[indexOfView] = undefined;
            } else {
              _view = children[indexOfView];
              repeat.moveView(indexOfView, _index);
              itemsPreviouslyInViews.splice(indexOfView, 1);
              itemsPreviouslyInViews.splice(_index, 0, undefined);
            }

            if (_view) {
              (0, _repeatUtilities.updateOverrideContext)(_view.overrideContext, _index, itemsLength);
            }
          }

          _this._inPlaceProcessItems(repeat, items);
        };
      } else {
        removePromise = repeat.removeAllViews(true, !repeat.viewsRequireLifecycle);
        updateViews = function updateViews() {
          return _this._standardProcessInstanceChanged(repeat, items);
        };
      }

      if (removePromise instanceof Promise) {
        removePromise.then(updateViews);
      } else {
        updateViews();
      }
    } else {
      this._inPlaceProcessItems(repeat, items);
    }
  };

  ArrayRepeatStrategy.prototype._standardProcessInstanceChanged = function _standardProcessInstanceChanged(repeat, items) {
    for (var i = 0, ii = items.length; i < ii; i++) {
      var overrideContext = (0, _repeatUtilities.createFullOverrideContext)(repeat, items[i], i, ii);
      repeat.addView(overrideContext.bindingContext, overrideContext);
    }
  };

  ArrayRepeatStrategy.prototype._inPlaceProcessItems = function _inPlaceProcessItems(repeat, items) {
    var itemsLength = items.length;
    var viewsLength = repeat.viewCount();

    while (viewsLength > itemsLength) {
      viewsLength--;
      repeat.removeView(viewsLength, true, !repeat.viewsRequireLifecycle);
    }

    var local = repeat.local;

    for (var i = 0; i < viewsLength; i++) {
      var view = repeat.view(i);
      var last = i === itemsLength - 1;
      var middle = i !== 0 && !last;

      if (view.bindingContext[local] === items[i] && view.overrideContext.$middle === middle && view.overrideContext.$last === last) {
        continue;
      }

      view.bindingContext[local] = items[i];
      view.overrideContext.$middle = middle;
      view.overrideContext.$last = last;
      repeat.updateBindings(view);
    }

    for (var _i = viewsLength; _i < itemsLength; _i++) {
      var overrideContext = (0, _repeatUtilities.createFullOverrideContext)(repeat, items[_i], _i, itemsLength);
      repeat.addView(overrideContext.bindingContext, overrideContext);
    }
  };

  ArrayRepeatStrategy.prototype.instanceMutated = function instanceMutated(repeat, array, splices) {
    var _this2 = this;

    if (repeat.__queuedSplices) {
      for (var i = 0, ii = splices.length; i < ii; ++i) {
        var _splices$i = splices[i],
            index = _splices$i.index,
            removed = _splices$i.removed,
            addedCount = _splices$i.addedCount;

        (0, _aureliaBinding.mergeSplice)(repeat.__queuedSplices, index, removed, addedCount);
      }

      repeat.__array = array.slice(0);
      return;
    }

    var maybePromise = this._runSplices(repeat, array.slice(0), splices);
    if (maybePromise instanceof Promise) {
      var queuedSplices = repeat.__queuedSplices = [];

      var runQueuedSplices = function runQueuedSplices() {
        if (!queuedSplices.length) {
          repeat.__queuedSplices = undefined;
          repeat.__array = undefined;
          return;
        }

        var nextPromise = _this2._runSplices(repeat, repeat.__array, queuedSplices) || Promise.resolve();
        queuedSplices = repeat.__queuedSplices = [];
        nextPromise.then(runQueuedSplices);
      };

      maybePromise.then(runQueuedSplices);
    }
  };

  ArrayRepeatStrategy.prototype._runSplices = function _runSplices(repeat, array, splices) {
    var _this3 = this;

    var removeDelta = 0;
    var rmPromises = [];

    for (var i = 0, ii = splices.length; i < ii; ++i) {
      var splice = splices[i];
      var removed = splice.removed;

      for (var j = 0, jj = removed.length; j < jj; ++j) {
        var viewOrPromise = repeat.removeView(splice.index + removeDelta + rmPromises.length, true);
        if (viewOrPromise instanceof Promise) {
          rmPromises.push(viewOrPromise);
        }
      }
      removeDelta -= splice.addedCount;
    }

    if (rmPromises.length > 0) {
      return Promise.all(rmPromises).then(function () {
        var spliceIndexLow = _this3._handleAddedSplices(repeat, array, splices);
        (0, _repeatUtilities.updateOverrideContexts)(repeat.views(), spliceIndexLow);
      });
    }

    var spliceIndexLow = this._handleAddedSplices(repeat, array, splices);
    (0, _repeatUtilities.updateOverrideContexts)(repeat.views(), spliceIndexLow);

    return undefined;
  };

  ArrayRepeatStrategy.prototype._handleAddedSplices = function _handleAddedSplices(repeat, array, splices) {
    var spliceIndex = void 0;
    var spliceIndexLow = void 0;
    var arrayLength = array.length;
    for (var i = 0, ii = splices.length; i < ii; ++i) {
      var splice = splices[i];
      var addIndex = spliceIndex = splice.index;
      var end = splice.index + splice.addedCount;

      if (typeof spliceIndexLow === 'undefined' || spliceIndexLow === null || spliceIndexLow > splice.index) {
        spliceIndexLow = spliceIndex;
      }

      for (; addIndex < end; ++addIndex) {
        var overrideContext = (0, _repeatUtilities.createFullOverrideContext)(repeat, array[addIndex], addIndex, arrayLength);
        repeat.insertView(addIndex, overrideContext.bindingContext, overrideContext);
      }
    }

    return spliceIndexLow;
  };

  return ArrayRepeatStrategy;
}();
/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__("bluebird")))

/***/ },

/***/ 297:
/***/ function(module, exports, __webpack_require__) {

"use strict";
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.BindingSignaler = undefined;

var _aureliaBinding = __webpack_require__(24);



var BindingSignaler = exports.BindingSignaler = function () {
  function BindingSignaler() {
    

    this.signals = {};
  }

  BindingSignaler.prototype.signal = function signal(name) {
    var bindings = this.signals[name];
    if (!bindings) {
      return;
    }
    var i = bindings.length;
    while (i--) {
      bindings[i].call(_aureliaBinding.sourceContext);
    }
  };

  return BindingSignaler;
}();

/***/ },

/***/ 298:
/***/ function(module, exports) {

"use strict";
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});



var SCRIPT_REGEX = /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi;

var HTMLSanitizer = exports.HTMLSanitizer = function () {
  function HTMLSanitizer() {
    
  }

  HTMLSanitizer.prototype.sanitize = function sanitize(input) {
    return input.replace(SCRIPT_REGEX, '');
  };

  return HTMLSanitizer;
}();

/***/ },

/***/ 299:
/***/ function(module, exports, __webpack_require__) {

"use strict";
/* WEBPACK VAR INJECTION */(function(Promise) {"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});



var IfCore = exports.IfCore = function () {
  function IfCore(viewFactory, viewSlot) {
    

    this.viewFactory = viewFactory;
    this.viewSlot = viewSlot;
    this.view = null;
    this.bindingContext = null;
    this.overrideContext = null;

    this.showing = false;
  }

  IfCore.prototype.bind = function bind(bindingContext, overrideContext) {
    this.bindingContext = bindingContext;
    this.overrideContext = overrideContext;
  };

  IfCore.prototype.unbind = function unbind() {
    if (this.view === null) {
      return;
    }

    this.view.unbind();

    if (!this.viewFactory.isCaching) {
      return;
    }

    if (this.showing) {
      this.showing = false;
      this.viewSlot.remove(this.view, true, true);
    } else {
      this.view.returnToCache();
    }

    this.view = null;
  };

  IfCore.prototype._show = function _show() {
    if (this.showing) {
      if (!this.view.isBound) {
        this.view.bind(this.bindingContext, this.overrideContext);
      }
      return;
    }

    if (this.view === null) {
      this.view = this.viewFactory.create();
    }

    if (!this.view.isBound) {
      this.view.bind(this.bindingContext, this.overrideContext);
    }

    this.showing = true;
    return this.viewSlot.add(this.view);
  };

  IfCore.prototype._hide = function _hide() {
    var _this = this;

    if (!this.showing) {
      return;
    }

    this.showing = false;
    var removed = this.viewSlot.remove(this.view);

    if (removed instanceof Promise) {
      return removed.then(function () {
        return _this.view.unbind();
      });
    }

    this.view.unbind();
  };

  return IfCore;
}();
/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__("bluebird")))

/***/ },

/***/ 300:
/***/ function(module, exports, __webpack_require__) {

"use strict";
/* WEBPACK VAR INJECTION */(function(Promise) {'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.MapRepeatStrategy = undefined;

var _repeatUtilities = __webpack_require__(104);



var MapRepeatStrategy = exports.MapRepeatStrategy = function () {
  function MapRepeatStrategy() {
    
  }

  MapRepeatStrategy.prototype.getCollectionObserver = function getCollectionObserver(observerLocator, items) {
    return observerLocator.getMapObserver(items);
  };

  MapRepeatStrategy.prototype.instanceChanged = function instanceChanged(repeat, items) {
    var _this = this;

    var removePromise = repeat.removeAllViews(true, !repeat.viewsRequireLifecycle);
    if (removePromise instanceof Promise) {
      removePromise.then(function () {
        return _this._standardProcessItems(repeat, items);
      });
      return;
    }
    this._standardProcessItems(repeat, items);
  };

  MapRepeatStrategy.prototype._standardProcessItems = function _standardProcessItems(repeat, items) {
    var index = 0;
    var overrideContext = void 0;

    items.forEach(function (value, key) {
      overrideContext = (0, _repeatUtilities.createFullOverrideContext)(repeat, value, index, items.size, key);
      repeat.addView(overrideContext.bindingContext, overrideContext);
      ++index;
    });
  };

  MapRepeatStrategy.prototype.instanceMutated = function instanceMutated(repeat, map, records) {
    var key = void 0;
    var i = void 0;
    var ii = void 0;
    var overrideContext = void 0;
    var removeIndex = void 0;
    var addIndex = void 0;
    var record = void 0;
    var rmPromises = [];
    var viewOrPromise = void 0;

    for (i = 0, ii = records.length; i < ii; ++i) {
      record = records[i];
      key = record.key;
      switch (record.type) {
        case 'update':
          removeIndex = this._getViewIndexByKey(repeat, key);
          viewOrPromise = repeat.removeView(removeIndex, true, !repeat.viewsRequireLifecycle);
          if (viewOrPromise instanceof Promise) {
            rmPromises.push(viewOrPromise);
          }
          overrideContext = (0, _repeatUtilities.createFullOverrideContext)(repeat, map.get(key), removeIndex, map.size, key);
          repeat.insertView(removeIndex, overrideContext.bindingContext, overrideContext);
          break;
        case 'add':
          addIndex = repeat.viewCount() <= map.size - 1 ? repeat.viewCount() : map.size - 1;
          overrideContext = (0, _repeatUtilities.createFullOverrideContext)(repeat, map.get(key), addIndex, map.size, key);
          repeat.insertView(map.size - 1, overrideContext.bindingContext, overrideContext);
          break;
        case 'delete':
          if (record.oldValue === undefined) {
            return;
          }
          removeIndex = this._getViewIndexByKey(repeat, key);
          viewOrPromise = repeat.removeView(removeIndex, true, !repeat.viewsRequireLifecycle);
          if (viewOrPromise instanceof Promise) {
            rmPromises.push(viewOrPromise);
          }
          break;
        case 'clear':
          repeat.removeAllViews(true, !repeat.viewsRequireLifecycle);
          break;
        default:
          continue;
      }
    }

    if (rmPromises.length > 0) {
      Promise.all(rmPromises).then(function () {
        (0, _repeatUtilities.updateOverrideContexts)(repeat.views(), 0);
      });
    } else {
      (0, _repeatUtilities.updateOverrideContexts)(repeat.views(), 0);
    }
  };

  MapRepeatStrategy.prototype._getViewIndexByKey = function _getViewIndexByKey(repeat, key) {
    var i = void 0;
    var ii = void 0;
    var child = void 0;

    for (i = 0, ii = repeat.viewCount(); i < ii; ++i) {
      child = repeat.view(i);
      if (child.bindingContext[repeat.key] === key) {
        return i;
      }
    }

    return undefined;
  };

  return MapRepeatStrategy;
}();
/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__("bluebird")))

/***/ },

/***/ 301:
/***/ function(module, exports) {

"use strict";
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});



var NullRepeatStrategy = exports.NullRepeatStrategy = function () {
  function NullRepeatStrategy() {
    
  }

  NullRepeatStrategy.prototype.instanceChanged = function instanceChanged(repeat, items) {
    repeat.removeAllViews(true);
  };

  NullRepeatStrategy.prototype.getCollectionObserver = function getCollectionObserver(observerLocator, items) {};

  return NullRepeatStrategy;
}();

/***/ },

/***/ 302:
/***/ function(module, exports, __webpack_require__) {

"use strict";
/* WEBPACK VAR INJECTION */(function(Promise) {'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.NumberRepeatStrategy = undefined;

var _repeatUtilities = __webpack_require__(104);



var NumberRepeatStrategy = exports.NumberRepeatStrategy = function () {
  function NumberRepeatStrategy() {
    
  }

  NumberRepeatStrategy.prototype.getCollectionObserver = function getCollectionObserver() {
    return null;
  };

  NumberRepeatStrategy.prototype.instanceChanged = function instanceChanged(repeat, value) {
    var _this = this;

    var removePromise = repeat.removeAllViews(true, !repeat.viewsRequireLifecycle);
    if (removePromise instanceof Promise) {
      removePromise.then(function () {
        return _this._standardProcessItems(repeat, value);
      });
      return;
    }
    this._standardProcessItems(repeat, value);
  };

  NumberRepeatStrategy.prototype._standardProcessItems = function _standardProcessItems(repeat, value) {
    var childrenLength = repeat.viewCount();
    var i = void 0;
    var ii = void 0;
    var overrideContext = void 0;
    var viewsToRemove = void 0;

    value = Math.floor(value);
    viewsToRemove = childrenLength - value;

    if (viewsToRemove > 0) {
      if (viewsToRemove > childrenLength) {
        viewsToRemove = childrenLength;
      }

      for (i = 0, ii = viewsToRemove; i < ii; ++i) {
        repeat.removeView(childrenLength - (i + 1), true, !repeat.viewsRequireLifecycle);
      }

      return;
    }

    for (i = childrenLength, ii = value; i < ii; ++i) {
      overrideContext = (0, _repeatUtilities.createFullOverrideContext)(repeat, i, i, ii);
      repeat.addView(overrideContext.bindingContext, overrideContext);
    }

    (0, _repeatUtilities.updateOverrideContexts)(repeat.views(), 0);
  };

  return NumberRepeatStrategy;
}();
/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__("bluebird")))

/***/ },

/***/ 303:
/***/ function(module, exports, __webpack_require__) {

"use strict";
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.RepeatStrategyLocator = undefined;

var _nullRepeatStrategy = __webpack_require__(301);

var _arrayRepeatStrategy = __webpack_require__(296);

var _mapRepeatStrategy = __webpack_require__(300);

var _setRepeatStrategy = __webpack_require__(304);

var _numberRepeatStrategy = __webpack_require__(302);



var RepeatStrategyLocator = exports.RepeatStrategyLocator = function () {
  function RepeatStrategyLocator() {
    

    this.matchers = [];
    this.strategies = [];

    this.addStrategy(function (items) {
      return items === null || items === undefined;
    }, new _nullRepeatStrategy.NullRepeatStrategy());
    this.addStrategy(function (items) {
      return items instanceof Array;
    }, new _arrayRepeatStrategy.ArrayRepeatStrategy());
    this.addStrategy(function (items) {
      return items instanceof Map;
    }, new _mapRepeatStrategy.MapRepeatStrategy());
    this.addStrategy(function (items) {
      return items instanceof Set;
    }, new _setRepeatStrategy.SetRepeatStrategy());
    this.addStrategy(function (items) {
      return typeof items === 'number';
    }, new _numberRepeatStrategy.NumberRepeatStrategy());
  }

  RepeatStrategyLocator.prototype.addStrategy = function addStrategy(matcher, strategy) {
    this.matchers.push(matcher);
    this.strategies.push(strategy);
  };

  RepeatStrategyLocator.prototype.getStrategy = function getStrategy(items) {
    var matchers = this.matchers;

    for (var i = 0, ii = matchers.length; i < ii; ++i) {
      if (matchers[i](items)) {
        return this.strategies[i];
      }
    }

    return null;
  };

  return RepeatStrategyLocator;
}();

/***/ },

/***/ 304:
/***/ function(module, exports, __webpack_require__) {

"use strict";
/* WEBPACK VAR INJECTION */(function(Promise) {'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.SetRepeatStrategy = undefined;

var _repeatUtilities = __webpack_require__(104);



var SetRepeatStrategy = exports.SetRepeatStrategy = function () {
  function SetRepeatStrategy() {
    
  }

  SetRepeatStrategy.prototype.getCollectionObserver = function getCollectionObserver(observerLocator, items) {
    return observerLocator.getSetObserver(items);
  };

  SetRepeatStrategy.prototype.instanceChanged = function instanceChanged(repeat, items) {
    var _this = this;

    var removePromise = repeat.removeAllViews(true, !repeat.viewsRequireLifecycle);
    if (removePromise instanceof Promise) {
      removePromise.then(function () {
        return _this._standardProcessItems(repeat, items);
      });
      return;
    }
    this._standardProcessItems(repeat, items);
  };

  SetRepeatStrategy.prototype._standardProcessItems = function _standardProcessItems(repeat, items) {
    var index = 0;
    var overrideContext = void 0;

    items.forEach(function (value) {
      overrideContext = (0, _repeatUtilities.createFullOverrideContext)(repeat, value, index, items.size);
      repeat.addView(overrideContext.bindingContext, overrideContext);
      ++index;
    });
  };

  SetRepeatStrategy.prototype.instanceMutated = function instanceMutated(repeat, set, records) {
    var value = void 0;
    var i = void 0;
    var ii = void 0;
    var overrideContext = void 0;
    var removeIndex = void 0;
    var record = void 0;
    var rmPromises = [];
    var viewOrPromise = void 0;

    for (i = 0, ii = records.length; i < ii; ++i) {
      record = records[i];
      value = record.value;
      switch (record.type) {
        case 'add':
          var size = Math.max(set.size - 1, 0);
          overrideContext = (0, _repeatUtilities.createFullOverrideContext)(repeat, value, size, set.size);
          repeat.insertView(size, overrideContext.bindingContext, overrideContext);
          break;
        case 'delete':
          removeIndex = this._getViewIndexByValue(repeat, value);
          viewOrPromise = repeat.removeView(removeIndex, true, !repeat.viewsRequireLifecycle);
          if (viewOrPromise instanceof Promise) {
            rmPromises.push(viewOrPromise);
          }
          break;
        case 'clear':
          repeat.removeAllViews(true, !repeat.viewsRequireLifecycle);
          break;
        default:
          continue;
      }
    }

    if (rmPromises.length > 0) {
      Promise.all(rmPromises).then(function () {
        (0, _repeatUtilities.updateOverrideContexts)(repeat.views(), 0);
      });
    } else {
      (0, _repeatUtilities.updateOverrideContexts)(repeat.views(), 0);
    }
  };

  SetRepeatStrategy.prototype._getViewIndexByValue = function _getViewIndexByValue(repeat, value) {
    var i = void 0;
    var ii = void 0;
    var child = void 0;

    for (i = 0, ii = repeat.viewCount(); i < ii; ++i) {
      child = repeat.view(i);
      if (child.bindingContext[repeat.local] === value) {
        return i;
      }
    }

    return undefined;
  };

  return SetRepeatStrategy;
}();
/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__("bluebird")))

/***/ },

/***/ 305:
/***/ function(module, exports, __webpack_require__) {

"use strict";
/* WEBPACK VAR INJECTION */(function(Promise) {'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.RouterViewLocator = exports.RouterView = undefined;

var _dec, _class, _desc, _value, _class2, _descriptor, _descriptor2, _descriptor3, _descriptor4;

var _aureliaDependencyInjection = __webpack_require__(7);

var _aureliaBinding = __webpack_require__(24);

var _aureliaTemplating = __webpack_require__(20);

var _aureliaRouter = __webpack_require__("aurelia-router");

var _aureliaMetadata = __webpack_require__(43);

var _aureliaPal = __webpack_require__(21);

function _initDefineProp(target, property, descriptor, context) {
  if (!descriptor) return;
  Object.defineProperty(target, property, {
    enumerable: descriptor.enumerable,
    configurable: descriptor.configurable,
    writable: descriptor.writable,
    value: descriptor.initializer ? descriptor.initializer.call(context) : void 0
  });
}



function _applyDecoratedDescriptor(target, property, decorators, descriptor, context) {
  var desc = {};
  Object['ke' + 'ys'](descriptor).forEach(function (key) {
    desc[key] = descriptor[key];
  });
  desc.enumerable = !!desc.enumerable;
  desc.configurable = !!desc.configurable;

  if ('value' in desc || desc.initializer) {
    desc.writable = true;
  }

  desc = decorators.slice().reverse().reduce(function (desc, decorator) {
    return decorator(target, property, desc) || desc;
  }, desc);

  if (context && desc.initializer !== void 0) {
    desc.value = desc.initializer ? desc.initializer.call(context) : void 0;
    desc.initializer = undefined;
  }

  if (desc.initializer === void 0) {
    Object['define' + 'Property'](target, property, desc);
    desc = null;
  }

  return desc;
}

function _initializerWarningHelper(descriptor, context) {
  throw new Error('Decorating class property failed. Please ensure that transform-class-properties is enabled.');
}

var RouterView = exports.RouterView = (_dec = (0, _aureliaTemplating.customElement)('router-view'), _dec(_class = (0, _aureliaTemplating.noView)(_class = (_class2 = function () {
  RouterView.inject = function inject() {
    return [_aureliaPal.DOM.Element, _aureliaDependencyInjection.Container, _aureliaTemplating.ViewSlot, _aureliaRouter.Router, _aureliaTemplating.ViewLocator, _aureliaTemplating.CompositionTransaction, _aureliaTemplating.CompositionEngine];
  };

  function RouterView(element, container, viewSlot, router, viewLocator, compositionTransaction, compositionEngine) {
    

    _initDefineProp(this, 'swapOrder', _descriptor, this);

    _initDefineProp(this, 'layoutView', _descriptor2, this);

    _initDefineProp(this, 'layoutViewModel', _descriptor3, this);

    _initDefineProp(this, 'layoutModel', _descriptor4, this);

    this.element = element;
    this.container = container;
    this.viewSlot = viewSlot;
    this.router = router;
    this.viewLocator = viewLocator;
    this.compositionTransaction = compositionTransaction;
    this.compositionEngine = compositionEngine;
    this.router.registerViewPort(this, this.element.getAttribute('name'));

    if (!('initialComposition' in compositionTransaction)) {
      compositionTransaction.initialComposition = true;
      this.compositionTransactionNotifier = compositionTransaction.enlist();
    }
  }

  RouterView.prototype.created = function created(owningView) {
    this.owningView = owningView;
  };

  RouterView.prototype.bind = function bind(bindingContext, overrideContext) {
    this.container.viewModel = bindingContext;
    this.overrideContext = overrideContext;
  };

  RouterView.prototype.process = function process(viewPortInstruction, waitToSwap) {
    var _this = this;

    var component = viewPortInstruction.component;
    var childContainer = component.childContainer;
    var viewModel = component.viewModel;
    var viewModelResource = component.viewModelResource;
    var metadata = viewModelResource.metadata;
    var config = component.router.currentInstruction.config;
    var viewPort = config.viewPorts ? config.viewPorts[viewPortInstruction.name] || {} : {};

    childContainer.get(RouterViewLocator)._notify(this);

    var layoutInstruction = {
      viewModel: viewPort.layoutViewModel || config.layoutViewModel || this.layoutViewModel,
      view: viewPort.layoutView || config.layoutView || this.layoutView,
      model: viewPort.layoutModel || config.layoutModel || this.layoutModel,
      router: viewPortInstruction.component.router,
      childContainer: childContainer,
      viewSlot: this.viewSlot
    };

    var viewStrategy = this.viewLocator.getViewStrategy(component.view || viewModel);
    if (viewStrategy && component.view) {
      viewStrategy.makeRelativeTo(_aureliaMetadata.Origin.get(component.router.container.viewModel.constructor).moduleId);
    }

    return metadata.load(childContainer, viewModelResource.value, null, viewStrategy, true).then(function (viewFactory) {
      if (!_this.compositionTransactionNotifier) {
        _this.compositionTransactionOwnershipToken = _this.compositionTransaction.tryCapture();
      }

      if (layoutInstruction.viewModel || layoutInstruction.view) {
        viewPortInstruction.layoutInstruction = layoutInstruction;
      }

      viewPortInstruction.controller = metadata.create(childContainer, _aureliaTemplating.BehaviorInstruction.dynamic(_this.element, viewModel, viewFactory));

      if (waitToSwap) {
        return null;
      }

      _this.swap(viewPortInstruction);
    });
  };

  RouterView.prototype.swap = function swap(viewPortInstruction) {
    var _this2 = this;

    var layoutInstruction = viewPortInstruction.layoutInstruction;
    var previousView = this.view;

    var work = function work() {
      var swapStrategy = _aureliaTemplating.SwapStrategies[_this2.swapOrder] || _aureliaTemplating.SwapStrategies.after;
      var viewSlot = _this2.viewSlot;

      swapStrategy(viewSlot, previousView, function () {
        return Promise.resolve(viewSlot.add(_this2.view));
      }).then(function () {
        _this2._notify();
      });
    };

    var ready = function ready(owningView) {
      viewPortInstruction.controller.automate(_this2.overrideContext, owningView);
      if (_this2.compositionTransactionOwnershipToken) {
        return _this2.compositionTransactionOwnershipToken.waitForCompositionComplete().then(function () {
          _this2.compositionTransactionOwnershipToken = null;
          return work();
        });
      }

      return work();
    };

    if (layoutInstruction) {
      if (!layoutInstruction.viewModel) {
        layoutInstruction.viewModel = {};
      }

      return this.compositionEngine.createController(layoutInstruction).then(function (controller) {
        _aureliaTemplating.ShadowDOM.distributeView(viewPortInstruction.controller.view, controller.slots || controller.view.slots);
        controller.automate((0, _aureliaBinding.createOverrideContext)(layoutInstruction.viewModel), _this2.owningView);
        controller.view.children.push(viewPortInstruction.controller.view);
        return controller.view || controller;
      }).then(function (newView) {
        _this2.view = newView;
        return ready(newView);
      });
    }

    this.view = viewPortInstruction.controller.view;

    return ready(this.owningView);
  };

  RouterView.prototype._notify = function _notify() {
    if (this.compositionTransactionNotifier) {
      this.compositionTransactionNotifier.done();
      this.compositionTransactionNotifier = null;
    }
  };

  return RouterView;
}(), (_descriptor = _applyDecoratedDescriptor(_class2.prototype, 'swapOrder', [_aureliaTemplating.bindable], {
  enumerable: true,
  initializer: null
}), _descriptor2 = _applyDecoratedDescriptor(_class2.prototype, 'layoutView', [_aureliaTemplating.bindable], {
  enumerable: true,
  initializer: null
}), _descriptor3 = _applyDecoratedDescriptor(_class2.prototype, 'layoutViewModel', [_aureliaTemplating.bindable], {
  enumerable: true,
  initializer: null
}), _descriptor4 = _applyDecoratedDescriptor(_class2.prototype, 'layoutModel', [_aureliaTemplating.bindable], {
  enumerable: true,
  initializer: null
})), _class2)) || _class) || _class);

var RouterViewLocator = exports.RouterViewLocator = function () {
  function RouterViewLocator() {
    var _this3 = this;

    

    this.promise = new Promise(function (resolve) {
      return _this3.resolve = resolve;
    });
  }

  RouterViewLocator.prototype.findNearest = function findNearest() {
    return this.promise;
  };

  RouterViewLocator.prototype._notify = function _notify(routerView) {
    this.resolve(routerView);
  };

  return RouterViewLocator;
}();
/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__("bluebird")))

/***/ },

/***/ 58:
/***/ function(module, exports) {

"use strict";
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getLogger = getLogger;
exports.addAppender = addAppender;
exports.removeAppender = removeAppender;
exports.getAppenders = getAppenders;
exports.clearAppenders = clearAppenders;
exports.addCustomLevel = addCustomLevel;
exports.removeCustomLevel = removeCustomLevel;
exports.setLevel = setLevel;
exports.getLevel = getLevel;



var logLevel = exports.logLevel = {
  none: 0,
  error: 10,
  warn: 20,
  info: 30,
  debug: 40
};

var loggers = {};
var appenders = [];
var globalDefaultLevel = logLevel.none;

var standardLevels = ['none', 'error', 'warn', 'info', 'debug'];
function isStandardLevel(level) {
  return standardLevels.filter(function (l) {
    return l === level;
  }).length > 0;
}

function appendArgs() {
  return [this].concat(Array.prototype.slice.call(arguments));
}

function logFactory(level) {
  var threshold = logLevel[level];
  return function () {
    if (this.level < threshold) {
      return;
    }

    var args = appendArgs.apply(this, arguments);
    var i = appenders.length;
    while (i--) {
      var _appenders$i;

      (_appenders$i = appenders[i])[level].apply(_appenders$i, args);
    }
  };
}

function logFactoryCustom(level) {
  var threshold = logLevel[level];
  return function () {
    if (this.level < threshold) {
      return;
    }

    var args = appendArgs.apply(this, arguments);
    var i = appenders.length;
    while (i--) {
      var appender = appenders[i];
      if (appender[level] !== undefined) {
        appender[level].apply(appender, args);
      }
    }
  };
}

function connectLoggers() {
  var proto = Logger.prototype;
  for (var _level in logLevel) {
    if (isStandardLevel(_level)) {
      if (_level !== 'none') {
        proto[_level] = logFactory(_level);
      }
    } else {
      proto[_level] = logFactoryCustom(_level);
    }
  }
}

function disconnectLoggers() {
  var proto = Logger.prototype;
  for (var _level2 in logLevel) {
    if (_level2 !== 'none') {
      proto[_level2] = function () {};
    }
  }
}

function getLogger(id) {
  return loggers[id] || new Logger(id);
}

function addAppender(appender) {
  if (appenders.push(appender) === 1) {
    connectLoggers();
  }
}

function removeAppender(appender) {
  appenders = appenders.filter(function (a) {
    return a !== appender;
  });
}

function getAppenders() {
  return [].concat(appenders);
}

function clearAppenders() {
  appenders = [];
  disconnectLoggers();
}

function addCustomLevel(name, value) {
  if (logLevel[name] !== undefined) {
    throw Error('Log level "' + name + '" already exists.');
  }

  if (isNaN(value)) {
    throw Error('Value must be a number.');
  }

  logLevel[name] = value;

  if (appenders.length > 0) {
    connectLoggers();
  } else {
    Logger.prototype[name] = function () {};
  }
}

function removeCustomLevel(name) {
  if (logLevel[name] === undefined) {
    return;
  }

  if (isStandardLevel(name)) {
    throw Error('Built-in log level "' + name + '" cannot be removed.');
  }

  delete logLevel[name];
  delete Logger.prototype[name];
}

function setLevel(level) {
  globalDefaultLevel = level;
  for (var key in loggers) {
    loggers[key].setLevel(level);
  }
}

function getLevel() {
  return globalDefaultLevel;
}

var Logger = exports.Logger = function () {
  function Logger(id) {
    

    var cached = loggers[id];
    if (cached) {
      return cached;
    }

    loggers[id] = this;
    this.id = id;
    this.level = globalDefaultLevel;
  }

  Logger.prototype.debug = function debug(message) {};

  Logger.prototype.info = function info(message) {};

  Logger.prototype.warn = function warn(message) {};

  Logger.prototype.error = function error(message) {};

  Logger.prototype.setLevel = function setLevel(level) {
    this.level = level;
  };

  Logger.prototype.isDebugEnabled = function isDebugEnabled() {
    return this.level === logLevel.debug;
  };

  return Logger;
}();

/***/ },

/***/ 601:
/***/ function(module, exports, __webpack_require__) {

"use strict";
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports._createCSSResource = _createCSSResource;

var _aureliaTemplating = __webpack_require__(20);

var _aureliaLoader = __webpack_require__(123);

var _aureliaDependencyInjection = __webpack_require__(7);

var _aureliaPath = __webpack_require__(70);

var _aureliaPal = __webpack_require__(21);

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }



var cssUrlMatcher = /url\((?!['"]data)([^)]+)\)/gi;

function fixupCSSUrls(address, css) {
  if (typeof css !== 'string') {
    throw new Error('Failed loading required CSS file: ' + address);
  }
  return css.replace(cssUrlMatcher, function (match, p1) {
    var quote = p1.charAt(0);
    if (quote === '\'' || quote === '"') {
      p1 = p1.substr(1, p1.length - 2);
    }
    return 'url(\'' + (0, _aureliaPath.relativeToFile)(p1, address) + '\')';
  });
}

var CSSResource = function () {
  function CSSResource(address) {
    

    this.address = address;
    this._scoped = null;
    this._global = false;
    this._alreadyGloballyInjected = false;
  }

  CSSResource.prototype.initialize = function initialize(container, target) {
    this._scoped = new target(this);
  };

  CSSResource.prototype.register = function register(registry, name) {
    if (name === 'scoped') {
      registry.registerViewEngineHooks(this._scoped);
    } else {
      this._global = true;
    }
  };

  CSSResource.prototype.load = function load(container) {
    var _this = this;

    return container.get(_aureliaLoader.Loader).loadText(this.address).catch(function (err) {
      return null;
    }).then(function (text) {
      text = fixupCSSUrls(_this.address, text);
      _this._scoped.css = text;
      if (_this._global) {
        _this._alreadyGloballyInjected = true;
        _aureliaPal.DOM.injectStyles(text);
      }
    });
  };

  return CSSResource;
}();

var CSSViewEngineHooks = function () {
  function CSSViewEngineHooks(owner) {
    

    this.owner = owner;
    this.css = null;
  }

  CSSViewEngineHooks.prototype.beforeCompile = function beforeCompile(content, resources, instruction) {
    if (instruction.targetShadowDOM) {
      _aureliaPal.DOM.injectStyles(this.css, content, true);
    } else if (_aureliaPal.FEATURE.scopedCSS) {
      var styleNode = _aureliaPal.DOM.injectStyles(this.css, content, true);
      styleNode.setAttribute('scoped', 'scoped');
    } else if (this._global && !this.owner._alreadyGloballyInjected) {
      _aureliaPal.DOM.injectStyles(this.css);
      this.owner._alreadyGloballyInjected = true;
    }
  };

  return CSSViewEngineHooks;
}();

function _createCSSResource(address) {
  var _dec, _class;

  var ViewCSS = (_dec = (0, _aureliaTemplating.resource)(new CSSResource(address)), _dec(_class = function (_CSSViewEngineHooks) {
    _inherits(ViewCSS, _CSSViewEngineHooks);

    function ViewCSS() {
      

      return _possibleConstructorReturn(this, _CSSViewEngineHooks.apply(this, arguments));
    }

    return ViewCSS;
  }(CSSViewEngineHooks)) || _class);

  return ViewCSS;
}

/***/ },

/***/ 602:
/***/ function(module, exports, __webpack_require__) {

"use strict";
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports._createDynamicElement = _createDynamicElement;

var _aureliaTemplating = __webpack_require__(20);



function _createDynamicElement(name, viewUrl, bindableNames) {
  var _dec, _dec2, _class;

  var DynamicElement = (_dec = (0, _aureliaTemplating.customElement)(name), _dec2 = (0, _aureliaTemplating.useView)(viewUrl), _dec(_class = _dec2(_class = function () {
    function DynamicElement() {
      
    }

    DynamicElement.prototype.bind = function bind(bindingContext) {
      this.$parent = bindingContext;
    };

    return DynamicElement;
  }()) || _class) || _class);

  for (var i = 0, ii = bindableNames.length; i < ii; ++i) {
    (0, _aureliaTemplating.bindable)(bindableNames[i])(DynamicElement);
  }
  return DynamicElement;
}

/***/ },

/***/ 603:
/***/ function(module, exports, __webpack_require__) {

"use strict";
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getElementName = getElementName;
exports.configure = configure;

var _aureliaTemplating = __webpack_require__(20);

var _dynamicElement = __webpack_require__(602);

function getElementName(address) {
  return (/([^\/^\?]+)\.html/i.exec(address)[1].toLowerCase()
  );
}

function configure(config) {
  var viewEngine = config.container.get(_aureliaTemplating.ViewEngine);
  var loader = config.aurelia.loader;

  viewEngine.addResourcePlugin('.html', {
    'fetch': function fetch(address) {
      return loader.loadTemplate(address).then(function (registryEntry) {
        var _ref;

        var bindable = registryEntry.template.getAttribute('bindable');
        var elementName = getElementName(address);

        if (bindable) {
          bindable = bindable.split(',').map(function (x) {
            return x.trim();
          });
          registryEntry.template.removeAttribute('bindable');
        } else {
          bindable = [];
        }

        return _ref = {}, _ref[elementName] = (0, _dynamicElement._createDynamicElement)(elementName, address, bindable), _ref;
      });
    }
  });
}

/***/ },

/***/ 604:
/***/ function(module, exports, __webpack_require__) {

"use strict";
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.RouteHref = undefined;

var _dec, _dec2, _dec3, _dec4, _class;

var _aureliaTemplating = __webpack_require__(20);

var _aureliaRouter = __webpack_require__("aurelia-router");

var _aureliaPal = __webpack_require__(21);

var _aureliaLogging = __webpack_require__(58);

var LogManager = _interopRequireWildcard(_aureliaLogging);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }



var logger = LogManager.getLogger('route-href');

var RouteHref = exports.RouteHref = (_dec = (0, _aureliaTemplating.customAttribute)('route-href'), _dec2 = (0, _aureliaTemplating.bindable)({ name: 'route', changeHandler: 'processChange', primaryProperty: true }), _dec3 = (0, _aureliaTemplating.bindable)({ name: 'params', changeHandler: 'processChange' }), _dec4 = (0, _aureliaTemplating.bindable)({ name: 'attribute', defaultValue: 'href' }), _dec(_class = _dec2(_class = _dec3(_class = _dec4(_class = function () {
  RouteHref.inject = function inject() {
    return [_aureliaRouter.Router, _aureliaPal.DOM.Element];
  };

  function RouteHref(router, element) {
    

    this.router = router;
    this.element = element;
  }

  RouteHref.prototype.bind = function bind() {
    this.isActive = true;
    this.processChange();
  };

  RouteHref.prototype.unbind = function unbind() {
    this.isActive = false;
  };

  RouteHref.prototype.attributeChanged = function attributeChanged(value, previous) {
    if (previous) {
      this.element.removeAttribute(previous);
    }

    this.processChange();
  };

  RouteHref.prototype.processChange = function processChange() {
    var _this = this;

    return this.router.ensureConfigured().then(function () {
      if (!_this.isActive) {
        return null;
      }

      var href = _this.router.generate(_this.route, _this.params);

      if (_this.element.au.controller) {
        _this.element.au.controller.viewModel[_this.attribute] = href;
      } else {
        _this.element.setAttribute(_this.attribute, href);
      }

      return null;
    }).catch(function (reason) {
      logger.error(reason);
    });
  };

  return RouteHref;
}()) || _class) || _class) || _class) || _class);

/***/ },

/***/ 605:
/***/ function(module, exports, __webpack_require__) {

"use strict";
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.TemplatingRouteLoader = undefined;

var _dec, _class, _dec2, _class2;

var _aureliaDependencyInjection = __webpack_require__(7);

var _aureliaTemplating = __webpack_require__(20);

var _aureliaRouter = __webpack_require__("aurelia-router");

var _aureliaPath = __webpack_require__(70);

var _aureliaMetadata = __webpack_require__(43);

var _routerView = __webpack_require__(305);

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }



var EmptyClass = (_dec = (0, _aureliaTemplating.inlineView)('<template></template>'), _dec(_class = function EmptyClass() {
  
}) || _class);
var TemplatingRouteLoader = exports.TemplatingRouteLoader = (_dec2 = (0, _aureliaDependencyInjection.inject)(_aureliaTemplating.CompositionEngine), _dec2(_class2 = function (_RouteLoader) {
  _inherits(TemplatingRouteLoader, _RouteLoader);

  function TemplatingRouteLoader(compositionEngine) {
    

    var _this = _possibleConstructorReturn(this, _RouteLoader.call(this));

    _this.compositionEngine = compositionEngine;
    return _this;
  }

  TemplatingRouteLoader.prototype.loadRoute = function loadRoute(router, config) {
    var childContainer = router.container.createChild();

    var viewModel = void 0;
    if (config.moduleId === null) {
      viewModel = EmptyClass;
    } else if (/\.html/i.test(config.moduleId)) {
      viewModel = createDynamicClass(config.moduleId);
    } else {
      viewModel = (0, _aureliaPath.relativeToFile)(config.moduleId, _aureliaMetadata.Origin.get(router.container.viewModel.constructor).moduleId);
    }

    var instruction = {
      viewModel: viewModel,
      childContainer: childContainer,
      view: config.view || config.viewStrategy,
      router: router
    };

    childContainer.registerSingleton(_routerView.RouterViewLocator);

    childContainer.getChildRouter = function () {
      var childRouter = void 0;

      childContainer.registerHandler(_aureliaRouter.Router, function (c) {
        return childRouter || (childRouter = router.createChild(childContainer));
      });

      return childContainer.get(_aureliaRouter.Router);
    };

    return this.compositionEngine.ensureViewModel(instruction);
  };

  return TemplatingRouteLoader;
}(_aureliaRouter.RouteLoader)) || _class2);


function createDynamicClass(moduleId) {
  var _dec3, _dec4, _class3;

  var name = /([^\/^\?]+)\.html/i.exec(moduleId)[1];

  var DynamicClass = (_dec3 = (0, _aureliaTemplating.customElement)(name), _dec4 = (0, _aureliaTemplating.useView)(moduleId), _dec3(_class3 = _dec4(_class3 = function () {
    function DynamicClass() {
      
    }

    DynamicClass.prototype.bind = function bind(bindingContext) {
      this.$parent = bindingContext;
    };

    return DynamicClass;
  }()) || _class3) || _class3);


  return DynamicClass;
}

/***/ },

/***/ 7:
/***/ function(module, exports, __webpack_require__) {

"use strict";
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Container = exports.InvocationHandler = exports._emptyParameters = exports.SingletonRegistration = exports.TransientRegistration = exports.FactoryInvoker = exports.NewInstance = exports.Factory = exports.Parent = exports.Optional = exports.All = exports.Lazy = exports.StrategyResolver = exports.resolver = undefined;

var _dec, _class, _dec2, _class2, _dec3, _class3, _dec4, _class4, _dec5, _class5, _dec6, _class6, _dec7, _class7, _classInvokers;

exports.getDecoratorDependencies = getDecoratorDependencies;
exports.lazy = lazy;
exports.all = all;
exports.optional = optional;
exports.parent = parent;
exports.factory = factory;
exports.newInstance = newInstance;
exports.invoker = invoker;
exports.invokeAsFactory = invokeAsFactory;
exports.registration = registration;
exports.transient = transient;
exports.singleton = singleton;
exports.autoinject = autoinject;
exports.inject = inject;

var _aureliaMetadata = __webpack_require__(43);

var _aureliaPal = __webpack_require__(21);



var resolver = exports.resolver = _aureliaMetadata.protocol.create('aurelia:resolver', function (target) {
  if (!(typeof target.get === 'function')) {
    return 'Resolvers must implement: get(container: Container, key: any): any';
  }

  return true;
});

var StrategyResolver = exports.StrategyResolver = (_dec = resolver(), _dec(_class = function () {
  function StrategyResolver(strategy, state) {
    

    this.strategy = strategy;
    this.state = state;
  }

  StrategyResolver.prototype.get = function get(container, key) {
    switch (this.strategy) {
      case 0:
        return this.state;
      case 1:
        var _singleton = container.invoke(this.state);
        this.state = _singleton;
        this.strategy = 0;
        return _singleton;
      case 2:
        return container.invoke(this.state);
      case 3:
        return this.state(container, key, this);
      case 4:
        return this.state[0].get(container, key);
      case 5:
        return container.get(this.state);
      default:
        throw new Error('Invalid strategy: ' + this.strategy);
    }
  };

  return StrategyResolver;
}()) || _class);
var Lazy = exports.Lazy = (_dec2 = resolver(), _dec2(_class2 = function () {
  function Lazy(key) {
    

    this._key = key;
  }

  Lazy.prototype.get = function get(container) {
    var _this = this;

    return function () {
      return container.get(_this._key);
    };
  };

  Lazy.of = function of(key) {
    return new Lazy(key);
  };

  return Lazy;
}()) || _class2);
var All = exports.All = (_dec3 = resolver(), _dec3(_class3 = function () {
  function All(key) {
    

    this._key = key;
  }

  All.prototype.get = function get(container) {
    return container.getAll(this._key);
  };

  All.of = function of(key) {
    return new All(key);
  };

  return All;
}()) || _class3);
var Optional = exports.Optional = (_dec4 = resolver(), _dec4(_class4 = function () {
  function Optional(key) {
    var checkParent = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : true;

    

    this._key = key;
    this._checkParent = checkParent;
  }

  Optional.prototype.get = function get(container) {
    if (container.hasResolver(this._key, this._checkParent)) {
      return container.get(this._key);
    }

    return null;
  };

  Optional.of = function of(key) {
    var checkParent = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : true;

    return new Optional(key, checkParent);
  };

  return Optional;
}()) || _class4);
var Parent = exports.Parent = (_dec5 = resolver(), _dec5(_class5 = function () {
  function Parent(key) {
    

    this._key = key;
  }

  Parent.prototype.get = function get(container) {
    return container.parent ? container.parent.get(this._key) : null;
  };

  Parent.of = function of(key) {
    return new Parent(key);
  };

  return Parent;
}()) || _class5);
var Factory = exports.Factory = (_dec6 = resolver(), _dec6(_class6 = function () {
  function Factory(key) {
    

    this._key = key;
  }

  Factory.prototype.get = function get(container) {
    var fn = this._key;
    var resolver = container.getResolver(fn);
    if (resolver && resolver.strategy === 3) {
      fn = resolver.state;
    }

    return function () {
      for (var _len = arguments.length, rest = Array(_len), _key = 0; _key < _len; _key++) {
        rest[_key] = arguments[_key];
      }

      return container.invoke(fn, rest);
    };
  };

  Factory.of = function of(key) {
    return new Factory(key);
  };

  return Factory;
}()) || _class6);
var NewInstance = exports.NewInstance = (_dec7 = resolver(), _dec7(_class7 = function () {
  function NewInstance(key) {
    

    this.key = key;
    this.asKey = key;

    for (var _len2 = arguments.length, dynamicDependencies = Array(_len2 > 1 ? _len2 - 1 : 0), _key2 = 1; _key2 < _len2; _key2++) {
      dynamicDependencies[_key2 - 1] = arguments[_key2];
    }

    this.dynamicDependencies = dynamicDependencies;
  }

  NewInstance.prototype.get = function get(container) {
    var dynamicDependencies = this.dynamicDependencies.length > 0 ? this.dynamicDependencies.map(function (dependency) {
      return dependency['protocol:aurelia:resolver'] ? dependency.get(container) : container.get(dependency);
    }) : undefined;

    var fn = this.key;
    var resolver = container.getResolver(fn);
    if (resolver && resolver.strategy === 3) {
      fn = resolver.state;
    }

    var instance = container.invoke(fn, dynamicDependencies);
    container.registerInstance(this.asKey, instance);
    return instance;
  };

  NewInstance.prototype.as = function as(key) {
    this.asKey = key;
    return this;
  };

  NewInstance.of = function of(key) {
    for (var _len3 = arguments.length, dynamicDependencies = Array(_len3 > 1 ? _len3 - 1 : 0), _key3 = 1; _key3 < _len3; _key3++) {
      dynamicDependencies[_key3 - 1] = arguments[_key3];
    }

    return new (Function.prototype.bind.apply(NewInstance, [null].concat([key], dynamicDependencies)))();
  };

  return NewInstance;
}()) || _class7);
function getDecoratorDependencies(target) {
  autoinject(target);

  return target.inject;
}

function lazy(keyValue) {
  return function (target, key, index) {
    var inject = getDecoratorDependencies(target);
    inject[index] = Lazy.of(keyValue);
  };
}

function all(keyValue) {
  return function (target, key, index) {
    var inject = getDecoratorDependencies(target);
    inject[index] = All.of(keyValue);
  };
}

function optional() {
  var checkParentOrTarget = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : true;

  var deco = function deco(checkParent) {
    return function (target, key, index) {
      var inject = getDecoratorDependencies(target);
      inject[index] = Optional.of(inject[index], checkParent);
    };
  };
  if (typeof checkParentOrTarget === 'boolean') {
    return deco(checkParentOrTarget);
  }
  return deco(true);
}

function parent(target, key, index) {
  var inject = getDecoratorDependencies(target);
  inject[index] = Parent.of(inject[index]);
}

function factory(keyValue) {
  return function (target, key, index) {
    var inject = getDecoratorDependencies(target);
    inject[index] = Factory.of(keyValue);
  };
}

function newInstance(asKeyOrTarget) {
  for (var _len4 = arguments.length, dynamicDependencies = Array(_len4 > 1 ? _len4 - 1 : 0), _key4 = 1; _key4 < _len4; _key4++) {
    dynamicDependencies[_key4 - 1] = arguments[_key4];
  }

  var deco = function deco(asKey) {
    return function (target, key, index) {
      var inject = getDecoratorDependencies(target);
      inject[index] = NewInstance.of.apply(NewInstance, [inject[index]].concat(dynamicDependencies));
      if (!!asKey) {
        inject[index].as(asKey);
      }
    };
  };
  if (arguments.length >= 1) {
    return deco(asKeyOrTarget);
  }
  return deco();
}

function invoker(value) {
  return function (target) {
    _aureliaMetadata.metadata.define(_aureliaMetadata.metadata.invoker, value, target);
  };
}

function invokeAsFactory(potentialTarget) {
  var deco = function deco(target) {
    _aureliaMetadata.metadata.define(_aureliaMetadata.metadata.invoker, FactoryInvoker.instance, target);
  };

  return potentialTarget ? deco(potentialTarget) : deco;
}

var FactoryInvoker = exports.FactoryInvoker = function () {
  function FactoryInvoker() {
    
  }

  FactoryInvoker.prototype.invoke = function invoke(container, fn, dependencies) {
    var i = dependencies.length;
    var args = new Array(i);

    while (i--) {
      args[i] = container.get(dependencies[i]);
    }

    return fn.apply(undefined, args);
  };

  FactoryInvoker.prototype.invokeWithDynamicDependencies = function invokeWithDynamicDependencies(container, fn, staticDependencies, dynamicDependencies) {
    var i = staticDependencies.length;
    var args = new Array(i);

    while (i--) {
      args[i] = container.get(staticDependencies[i]);
    }

    if (dynamicDependencies !== undefined) {
      args = args.concat(dynamicDependencies);
    }

    return fn.apply(undefined, args);
  };

  return FactoryInvoker;
}();

FactoryInvoker.instance = new FactoryInvoker();

function registration(value) {
  return function (target) {
    _aureliaMetadata.metadata.define(_aureliaMetadata.metadata.registration, value, target);
  };
}

function transient(key) {
  return registration(new TransientRegistration(key));
}

function singleton(keyOrRegisterInChild) {
  var registerInChild = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;

  return registration(new SingletonRegistration(keyOrRegisterInChild, registerInChild));
}

var TransientRegistration = exports.TransientRegistration = function () {
  function TransientRegistration(key) {
    

    this._key = key;
  }

  TransientRegistration.prototype.registerResolver = function registerResolver(container, key, fn) {
    var existingResolver = container.getResolver(this._key || key);
    return existingResolver === undefined ? container.registerTransient(this._key || key, fn) : existingResolver;
  };

  return TransientRegistration;
}();

var SingletonRegistration = exports.SingletonRegistration = function () {
  function SingletonRegistration(keyOrRegisterInChild) {
    var registerInChild = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;

    

    if (typeof keyOrRegisterInChild === 'boolean') {
      this._registerInChild = keyOrRegisterInChild;
    } else {
      this._key = keyOrRegisterInChild;
      this._registerInChild = registerInChild;
    }
  }

  SingletonRegistration.prototype.registerResolver = function registerResolver(container, key, fn) {
    var targetContainer = this._registerInChild ? container : container.root;
    var existingResolver = targetContainer.getResolver(this._key || key);
    return existingResolver === undefined ? targetContainer.registerSingleton(this._key || key, fn) : existingResolver;
  };

  return SingletonRegistration;
}();

function validateKey(key) {
  if (key === null || key === undefined) {
    throw new Error('key/value cannot be null or undefined. Are you trying to inject/register something that doesn\'t exist with DI?');
  }
}
var _emptyParameters = exports._emptyParameters = Object.freeze([]);

_aureliaMetadata.metadata.registration = 'aurelia:registration';
_aureliaMetadata.metadata.invoker = 'aurelia:invoker';

var resolverDecorates = resolver.decorates;

var InvocationHandler = exports.InvocationHandler = function () {
  function InvocationHandler(fn, invoker, dependencies) {
    

    this.fn = fn;
    this.invoker = invoker;
    this.dependencies = dependencies;
  }

  InvocationHandler.prototype.invoke = function invoke(container, dynamicDependencies) {
    return dynamicDependencies !== undefined ? this.invoker.invokeWithDynamicDependencies(container, this.fn, this.dependencies, dynamicDependencies) : this.invoker.invoke(container, this.fn, this.dependencies);
  };

  return InvocationHandler;
}();

function invokeWithDynamicDependencies(container, fn, staticDependencies, dynamicDependencies) {
  var i = staticDependencies.length;
  var args = new Array(i);
  var lookup = void 0;

  while (i--) {
    lookup = staticDependencies[i];

    if (lookup === null || lookup === undefined) {
      throw new Error('Constructor Parameter with index ' + i + ' cannot be null or undefined. Are you trying to inject/register something that doesn\'t exist with DI?');
    } else {
      args[i] = container.get(lookup);
    }
  }

  if (dynamicDependencies !== undefined) {
    args = args.concat(dynamicDependencies);
  }

  return Reflect.construct(fn, args);
}

var classInvokers = (_classInvokers = {}, _classInvokers[0] = {
  invoke: function invoke(container, Type) {
    return new Type();
  },

  invokeWithDynamicDependencies: invokeWithDynamicDependencies
}, _classInvokers[1] = {
  invoke: function invoke(container, Type, deps) {
    return new Type(container.get(deps[0]));
  },

  invokeWithDynamicDependencies: invokeWithDynamicDependencies
}, _classInvokers[2] = {
  invoke: function invoke(container, Type, deps) {
    return new Type(container.get(deps[0]), container.get(deps[1]));
  },

  invokeWithDynamicDependencies: invokeWithDynamicDependencies
}, _classInvokers[3] = {
  invoke: function invoke(container, Type, deps) {
    return new Type(container.get(deps[0]), container.get(deps[1]), container.get(deps[2]));
  },

  invokeWithDynamicDependencies: invokeWithDynamicDependencies
}, _classInvokers[4] = {
  invoke: function invoke(container, Type, deps) {
    return new Type(container.get(deps[0]), container.get(deps[1]), container.get(deps[2]), container.get(deps[3]));
  },

  invokeWithDynamicDependencies: invokeWithDynamicDependencies
}, _classInvokers[5] = {
  invoke: function invoke(container, Type, deps) {
    return new Type(container.get(deps[0]), container.get(deps[1]), container.get(deps[2]), container.get(deps[3]), container.get(deps[4]));
  },

  invokeWithDynamicDependencies: invokeWithDynamicDependencies
}, _classInvokers.fallback = {
  invoke: invokeWithDynamicDependencies,
  invokeWithDynamicDependencies: invokeWithDynamicDependencies
}, _classInvokers);

function getDependencies(f) {
  if (!f.hasOwnProperty('inject')) {
    return [];
  }

  if (typeof f.inject === 'function') {
    return f.inject();
  }

  return f.inject;
}

var Container = exports.Container = function () {
  function Container(configuration) {
    

    if (configuration === undefined) {
      configuration = {};
    }

    this._configuration = configuration;
    this._onHandlerCreated = configuration.onHandlerCreated;
    this._handlers = configuration.handlers || (configuration.handlers = new Map());
    this._resolvers = new Map();
    this.root = this;
    this.parent = null;
  }

  Container.prototype.makeGlobal = function makeGlobal() {
    Container.instance = this;
    return this;
  };

  Container.prototype.setHandlerCreatedCallback = function setHandlerCreatedCallback(onHandlerCreated) {
    this._onHandlerCreated = onHandlerCreated;
    this._configuration.onHandlerCreated = onHandlerCreated;
  };

  Container.prototype.registerInstance = function registerInstance(key, instance) {
    return this.registerResolver(key, new StrategyResolver(0, instance === undefined ? key : instance));
  };

  Container.prototype.registerSingleton = function registerSingleton(key, fn) {
    return this.registerResolver(key, new StrategyResolver(1, fn === undefined ? key : fn));
  };

  Container.prototype.registerTransient = function registerTransient(key, fn) {
    return this.registerResolver(key, new StrategyResolver(2, fn === undefined ? key : fn));
  };

  Container.prototype.registerHandler = function registerHandler(key, handler) {
    return this.registerResolver(key, new StrategyResolver(3, handler));
  };

  Container.prototype.registerAlias = function registerAlias(originalKey, aliasKey) {
    return this.registerResolver(aliasKey, new StrategyResolver(5, originalKey));
  };

  Container.prototype.registerResolver = function registerResolver(key, resolver) {
    validateKey(key);

    var allResolvers = this._resolvers;
    var result = allResolvers.get(key);

    if (result === undefined) {
      allResolvers.set(key, resolver);
    } else if (result.strategy === 4) {
      result.state.push(resolver);
    } else {
      allResolvers.set(key, new StrategyResolver(4, [result, resolver]));
    }

    return resolver;
  };

  Container.prototype.autoRegister = function autoRegister(key, fn) {
    fn = fn === undefined ? key : fn;

    if (typeof fn === 'function') {
      var _registration = _aureliaMetadata.metadata.get(_aureliaMetadata.metadata.registration, fn);

      if (_registration === undefined) {
        return this.registerResolver(key, new StrategyResolver(1, fn));
      }

      return _registration.registerResolver(this, key, fn);
    }

    return this.registerResolver(key, new StrategyResolver(0, fn));
  };

  Container.prototype.autoRegisterAll = function autoRegisterAll(fns) {
    var i = fns.length;
    while (i--) {
      this.autoRegister(fns[i]);
    }
  };

  Container.prototype.unregister = function unregister(key) {
    this._resolvers.delete(key);
  };

  Container.prototype.hasResolver = function hasResolver(key) {
    var checkParent = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;

    validateKey(key);

    return this._resolvers.has(key) || checkParent && this.parent !== null && this.parent.hasResolver(key, checkParent);
  };

  Container.prototype.getResolver = function getResolver(key) {
    return this._resolvers.get(key);
  };

  Container.prototype.get = function get(key) {
    validateKey(key);

    if (key === Container) {
      return this;
    }

    if (resolverDecorates(key)) {
      return key.get(this, key);
    }

    var resolver = this._resolvers.get(key);

    if (resolver === undefined) {
      if (this.parent === null) {
        return this.autoRegister(key).get(this, key);
      }

      var _registration2 = _aureliaMetadata.metadata.get(_aureliaMetadata.metadata.registration, key);

      if (_registration2 === undefined) {
        return this.parent._get(key);
      }

      return _registration2.registerResolver(this, key, key).get(this, key);
    }

    return resolver.get(this, key);
  };

  Container.prototype._get = function _get(key) {
    var resolver = this._resolvers.get(key);

    if (resolver === undefined) {
      if (this.parent === null) {
        return this.autoRegister(key).get(this, key);
      }

      return this.parent._get(key);
    }

    return resolver.get(this, key);
  };

  Container.prototype.getAll = function getAll(key) {
    validateKey(key);

    var resolver = this._resolvers.get(key);

    if (resolver === undefined) {
      if (this.parent === null) {
        return _emptyParameters;
      }

      return this.parent.getAll(key);
    }

    if (resolver.strategy === 4) {
      var state = resolver.state;
      var i = state.length;
      var results = new Array(i);

      while (i--) {
        results[i] = state[i].get(this, key);
      }

      return results;
    }

    return [resolver.get(this, key)];
  };

  Container.prototype.createChild = function createChild() {
    var child = new Container(this._configuration);
    child.root = this.root;
    child.parent = this;
    return child;
  };

  Container.prototype.invoke = function invoke(fn, dynamicDependencies) {
    try {
      var _handler = this._handlers.get(fn);

      if (_handler === undefined) {
        _handler = this._createInvocationHandler(fn);
        this._handlers.set(fn, _handler);
      }

      return _handler.invoke(this, dynamicDependencies);
    } catch (e) {
      throw new _aureliaPal.AggregateError('Error invoking ' + fn.name + '. Check the inner error for details.', e, true);
    }
  };

  Container.prototype._createInvocationHandler = function _createInvocationHandler(fn) {
    var dependencies = void 0;

    if (fn.inject === undefined) {
      dependencies = _aureliaMetadata.metadata.getOwn(_aureliaMetadata.metadata.paramTypes, fn) || _emptyParameters;
    } else {
      dependencies = [];
      var ctor = fn;
      while (typeof ctor === 'function') {
        var _dependencies;

        (_dependencies = dependencies).push.apply(_dependencies, getDependencies(ctor));
        ctor = Object.getPrototypeOf(ctor);
      }
    }

    var invoker = _aureliaMetadata.metadata.getOwn(_aureliaMetadata.metadata.invoker, fn) || classInvokers[dependencies.length] || classInvokers.fallback;

    var handler = new InvocationHandler(fn, invoker, dependencies);
    return this._onHandlerCreated !== undefined ? this._onHandlerCreated(handler) : handler;
  };

  return Container;
}();

function autoinject(potentialTarget) {
  var deco = function deco(target) {
    if (!target.hasOwnProperty('inject')) {
      target.inject = (_aureliaMetadata.metadata.getOwn(_aureliaMetadata.metadata.paramTypes, target) || _emptyParameters).slice();
    }
  };

  return potentialTarget ? deco(potentialTarget) : deco;
}

function inject() {
  for (var _len5 = arguments.length, rest = Array(_len5), _key5 = 0; _key5 < _len5; _key5++) {
    rest[_key5] = arguments[_key5];
  }

  return function (target, key, descriptor) {
    if (typeof descriptor === 'number') {
      autoinject(target);
      if (rest.length === 1) {
        target.inject[descriptor] = rest[0];
      }
      return;
    }

    if (descriptor) {
      var _fn = descriptor.value;
      _fn.inject = rest;
    } else {
      target.inject = rest;
    }
  };
}

/***/ },

/***/ "aurelia-event-aggregator":
/***/ function(module, exports, __webpack_require__) {

"use strict";
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.EventAggregator = undefined;
exports.includeEventsIn = includeEventsIn;
exports.configure = configure;

var _aureliaLogging = __webpack_require__(58);

var LogManager = _interopRequireWildcard(_aureliaLogging);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }



var logger = LogManager.getLogger('event-aggregator');

var Handler = function () {
  function Handler(messageType, callback) {
    

    this.messageType = messageType;
    this.callback = callback;
  }

  Handler.prototype.handle = function handle(message) {
    if (message instanceof this.messageType) {
      this.callback.call(null, message);
    }
  };

  return Handler;
}();

function invokeCallback(callback, data, event) {
  try {
    callback(data, event);
  } catch (e) {
    logger.error(e);
  }
}

function invokeHandler(handler, data) {
  try {
    handler.handle(data);
  } catch (e) {
    logger.error(e);
  }
}

var EventAggregator = exports.EventAggregator = function () {
  function EventAggregator() {
    

    this.eventLookup = {};
    this.messageHandlers = [];
  }

  EventAggregator.prototype.publish = function publish(event, data) {
    var subscribers = void 0;
    var i = void 0;

    if (!event) {
      throw new Error('Event was invalid.');
    }

    if (typeof event === 'string') {
      subscribers = this.eventLookup[event];
      if (subscribers) {
        subscribers = subscribers.slice();
        i = subscribers.length;

        while (i--) {
          invokeCallback(subscribers[i], data, event);
        }
      }
    } else {
      subscribers = this.messageHandlers.slice();
      i = subscribers.length;

      while (i--) {
        invokeHandler(subscribers[i], event);
      }
    }
  };

  EventAggregator.prototype.subscribe = function subscribe(event, callback) {
    var handler = void 0;
    var subscribers = void 0;

    if (!event) {
      throw new Error('Event channel/type was invalid.');
    }

    if (typeof event === 'string') {
      handler = callback;
      subscribers = this.eventLookup[event] || (this.eventLookup[event] = []);
    } else {
      handler = new Handler(event, callback);
      subscribers = this.messageHandlers;
    }

    subscribers.push(handler);

    return {
      dispose: function dispose() {
        var idx = subscribers.indexOf(handler);
        if (idx !== -1) {
          subscribers.splice(idx, 1);
        }
      }
    };
  };

  EventAggregator.prototype.subscribeOnce = function subscribeOnce(event, callback) {
    var sub = this.subscribe(event, function (a, b) {
      sub.dispose();
      return callback(a, b);
    });

    return sub;
  };

  return EventAggregator;
}();

function includeEventsIn(obj) {
  var ea = new EventAggregator();

  obj.subscribeOnce = function (event, callback) {
    return ea.subscribeOnce(event, callback);
  };

  obj.subscribe = function (event, callback) {
    return ea.subscribe(event, callback);
  };

  obj.publish = function (event, data) {
    ea.publish(event, data);
  };

  return ea;
}

function configure(config) {
  config.instance(EventAggregator, includeEventsIn(config.aurelia));
}

/***/ },

/***/ "aurelia-framework":
/***/ function(module, exports, __webpack_require__) {

"use strict";
/* WEBPACK VAR INJECTION */(function(Promise) {'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.LogManager = exports.FrameworkConfiguration = exports.Aurelia = undefined;

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var _aureliaDependencyInjection = __webpack_require__(7);

Object.keys(_aureliaDependencyInjection).forEach(function (key) {
  if (key === "default" || key === "__esModule") return;
  Object.defineProperty(exports, key, {
    enumerable: true,
    get: function get() {
      return _aureliaDependencyInjection[key];
    }
  });
});

var _aureliaBinding = __webpack_require__(24);

Object.keys(_aureliaBinding).forEach(function (key) {
  if (key === "default" || key === "__esModule") return;
  Object.defineProperty(exports, key, {
    enumerable: true,
    get: function get() {
      return _aureliaBinding[key];
    }
  });
});

var _aureliaMetadata = __webpack_require__(43);

Object.keys(_aureliaMetadata).forEach(function (key) {
  if (key === "default" || key === "__esModule") return;
  Object.defineProperty(exports, key, {
    enumerable: true,
    get: function get() {
      return _aureliaMetadata[key];
    }
  });
});

var _aureliaTemplating = __webpack_require__(20);

Object.keys(_aureliaTemplating).forEach(function (key) {
  if (key === "default" || key === "__esModule") return;
  Object.defineProperty(exports, key, {
    enumerable: true,
    get: function get() {
      return _aureliaTemplating[key];
    }
  });
});

var _aureliaLoader = __webpack_require__(123);

Object.keys(_aureliaLoader).forEach(function (key) {
  if (key === "default" || key === "__esModule") return;
  Object.defineProperty(exports, key, {
    enumerable: true,
    get: function get() {
      return _aureliaLoader[key];
    }
  });
});

var _aureliaTaskQueue = __webpack_require__(103);

Object.keys(_aureliaTaskQueue).forEach(function (key) {
  if (key === "default" || key === "__esModule") return;
  Object.defineProperty(exports, key, {
    enumerable: true,
    get: function get() {
      return _aureliaTaskQueue[key];
    }
  });
});

var _aureliaPath = __webpack_require__(70);

Object.keys(_aureliaPath).forEach(function (key) {
  if (key === "default" || key === "__esModule") return;
  Object.defineProperty(exports, key, {
    enumerable: true,
    get: function get() {
      return _aureliaPath[key];
    }
  });
});

var _aureliaPal = __webpack_require__(21);

Object.keys(_aureliaPal).forEach(function (key) {
  if (key === "default" || key === "__esModule") return;
  Object.defineProperty(exports, key, {
    enumerable: true,
    get: function get() {
      return _aureliaPal[key];
    }
  });
});

var _aureliaLogging = __webpack_require__(58);

var TheLogManager = _interopRequireWildcard(_aureliaLogging);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }



function preventActionlessFormSubmit() {
  _aureliaPal.DOM.addEventListener('submit', function (evt) {
    var target = evt.target;
    var action = target.action;

    if (target.tagName.toLowerCase() === 'form' && !action) {
      evt.preventDefault();
    }
  });
}

var Aurelia = exports.Aurelia = function () {
  function Aurelia(loader, container, resources) {
    

    this.loader = loader || new _aureliaPal.PLATFORM.Loader();
    this.container = container || new _aureliaDependencyInjection.Container().makeGlobal();
    this.resources = resources || new _aureliaTemplating.ViewResources();
    this.use = new FrameworkConfiguration(this);
    this.logger = TheLogManager.getLogger('aurelia');
    this.hostConfigured = false;
    this.host = null;

    this.use.instance(Aurelia, this);
    this.use.instance(_aureliaLoader.Loader, this.loader);
    this.use.instance(_aureliaTemplating.ViewResources, this.resources);
  }

  Aurelia.prototype.start = function start() {
    var _this = this;

    if (this._started) {
      return this._started;
    }

    this.logger.info('Aurelia Starting');
    return this._started = this.use.apply().then(function () {
      preventActionlessFormSubmit();

      if (!_this.container.hasResolver(_aureliaTemplating.BindingLanguage)) {
        var message = 'You must configure Aurelia with a BindingLanguage implementation.';
        _this.logger.error(message);
        throw new Error(message);
      }

      _this.logger.info('Aurelia Started');
      var evt = _aureliaPal.DOM.createCustomEvent('aurelia-started', { bubbles: true, cancelable: true });
      _aureliaPal.DOM.dispatchEvent(evt);
      return _this;
    });
  };

  Aurelia.prototype.enhance = function enhance() {
    var _this2 = this;

    var bindingContext = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
    var applicationHost = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : null;

    this._configureHost(applicationHost || _aureliaPal.DOM.querySelectorAll('body')[0]);

    return new Promise(function (resolve) {
      var engine = _this2.container.get(_aureliaTemplating.TemplatingEngine);
      _this2.root = engine.enhance({ container: _this2.container, element: _this2.host, resources: _this2.resources, bindingContext: bindingContext });
      _this2.root.attached();
      _this2._onAureliaComposed();
      resolve(_this2);
    });
  };

  Aurelia.prototype.setRoot = function setRoot() {
    var _this3 = this;

    var root = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : null;
    var applicationHost = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : null;

    var instruction = {};

    if (this.root && this.root.viewModel && this.root.viewModel.router) {
      this.root.viewModel.router.deactivate();
      this.root.viewModel.router.reset();
    }

    this._configureHost(applicationHost);

    var engine = this.container.get(_aureliaTemplating.TemplatingEngine);
    var transaction = this.container.get(_aureliaTemplating.CompositionTransaction);
    delete transaction.initialComposition;

    if (!root) {
      if (this.configModuleId) {
        root = (0, _aureliaPath.relativeToFile)('./app', this.configModuleId);
      } else {
        root = 'app';
      }
    }

    instruction.viewModel = root;
    instruction.container = instruction.childContainer = this.container;
    instruction.viewSlot = this.hostSlot;
    instruction.host = this.host;

    return engine.compose(instruction).then(function (r) {
      _this3.root = r;
      instruction.viewSlot.attached();
      _this3._onAureliaComposed();
      return _this3;
    });
  };

  Aurelia.prototype._configureHost = function _configureHost(applicationHost) {
    if (this.hostConfigured) {
      return;
    }
    applicationHost = applicationHost || this.host;

    if (!applicationHost || typeof applicationHost === 'string') {
      this.host = _aureliaPal.DOM.getElementById(applicationHost || 'applicationHost');
    } else {
      this.host = applicationHost;
    }

    if (!this.host) {
      throw new Error('No applicationHost was specified.');
    }

    this.hostConfigured = true;
    this.host.aurelia = this;
    this.hostSlot = new _aureliaTemplating.ViewSlot(this.host, true);
    this.hostSlot.transformChildNodesIntoView();
    this.container.registerInstance(_aureliaPal.DOM.boundary, this.host);
  };

  Aurelia.prototype._onAureliaComposed = function _onAureliaComposed() {
    var evt = _aureliaPal.DOM.createCustomEvent('aurelia-composed', { bubbles: true, cancelable: true });
    setTimeout(function () {
      return _aureliaPal.DOM.dispatchEvent(evt);
    }, 1);
  };

  return Aurelia;
}();

var logger = TheLogManager.getLogger('aurelia');
var extPattern = /\.[^/.]+$/;

function runTasks(config, tasks) {
  var current = void 0;
  var next = function next() {
    current = tasks.shift();
    if (current) {
      return Promise.resolve(current(config)).then(next);
    }

    return Promise.resolve();
  };

  return next();
}

function loadPlugin(fwConfig, loader, info) {
  logger.debug('Loading plugin ' + info.moduleId + '.');
  if (typeof info.moduleId === 'string') {
    fwConfig.resourcesRelativeTo = info.resourcesRelativeTo;

    var id = info.moduleId;

    if (info.resourcesRelativeTo.length > 1) {
      return loader.normalize(info.moduleId, info.resourcesRelativeTo[1]).then(function (normalizedId) {
        return _loadPlugin(normalizedId);
      });
    }

    return _loadPlugin(id);
  } else if (typeof info.configure === 'function') {
    if (fwConfig.configuredPlugins.indexOf(info.configure) !== -1) {
      return Promise.resolve();
    }
    fwConfig.configuredPlugins.push(info.configure);

    return Promise.resolve(info.configure.call(null, fwConfig, info.config || {}));
  }
  throw new Error(invalidConfigMsg(info.moduleId || info.configure, 'plugin'));

  function _loadPlugin(moduleId) {
    return loader.loadModule(moduleId).then(function (m) {
      if ('configure' in m) {
        if (fwConfig.configuredPlugins.indexOf(m.configure) !== -1) {
          return Promise.resolve();
        }
        return Promise.resolve(m.configure(fwConfig, info.config || {})).then(function () {
          fwConfig.configuredPlugins.push(m.configure);
          fwConfig.resourcesRelativeTo = null;
          logger.debug('Configured plugin ' + info.moduleId + '.');
        });
      }

      fwConfig.resourcesRelativeTo = null;
      logger.debug('Loaded plugin ' + info.moduleId + '.');
    });
  }
}

function loadResources(aurelia, resourcesToLoad, appResources) {
  if (Object.keys(resourcesToLoad).length === 0) {
    return Promise.resolve();
  }
  var viewEngine = aurelia.container.get(_aureliaTemplating.ViewEngine);

  return Promise.all(Object.keys(resourcesToLoad).map(function (n) {
    return _normalize(resourcesToLoad[n]);
  })).then(function (loads) {
    var names = [];
    var importIds = [];

    loads.forEach(function (l) {
      names.push(undefined);
      importIds.push(l.importId);
    });

    return viewEngine.importViewResources(importIds, names, appResources);
  });

  function _normalize(load) {
    var moduleId = load.moduleId;
    var ext = getExt(moduleId);

    if (isOtherResource(moduleId)) {
      moduleId = removeExt(moduleId);
    }

    return aurelia.loader.normalize(moduleId, load.relativeTo).then(function (normalized) {
      return {
        name: load.moduleId,
        importId: isOtherResource(load.moduleId) ? addOriginalExt(normalized, ext) : normalized
      };
    });
  }

  function isOtherResource(name) {
    var ext = getExt(name);
    if (!ext) return false;
    if (ext === '') return false;
    if (ext === '.js' || ext === '.ts') return false;
    return true;
  }

  function removeExt(name) {
    return name.replace(extPattern, '');
  }

  function addOriginalExt(normalized, ext) {
    return removeExt(normalized) + '.' + ext;
  }
}

function getExt(name) {
  var match = name.match(extPattern);
  if (match && match.length > 0) {
    return match[0].split('.')[1];
  }
}

function loadBehaviors(config) {
  return Promise.all(config.behaviorsToLoad.map(function (m) {
    return m.load(config.container, m.target);
  })).then(function () {
    config.behaviorsToLoad = null;
  });
}

function assertProcessed(plugins) {
  if (plugins.processed) {
    throw new Error('This config instance has already been applied. To load more plugins or global resources, create a new FrameworkConfiguration instance.');
  }
}

function invalidConfigMsg(cfg, type) {
  return 'Invalid ' + type + ' [' + cfg + '], ' + type + ' must be specified as functions or relative module IDs.';
}

var FrameworkConfiguration = function () {
  function FrameworkConfiguration(aurelia) {
    var _this4 = this;

    

    this.aurelia = aurelia;
    this.container = aurelia.container;

    this.info = [];
    this.processed = false;
    this.preTasks = [];
    this.postTasks = [];

    this.behaviorsToLoad = [];

    this.configuredPlugins = [];
    this.resourcesToLoad = {};
    this.preTask(function () {
      return aurelia.loader.normalize('aurelia-bootstrapper').then(function (name) {
        return _this4.bootstrapperName = name;
      });
    });
    this.postTask(function () {
      return loadResources(aurelia, _this4.resourcesToLoad, aurelia.resources);
    });
  }

  FrameworkConfiguration.prototype.instance = function instance(type, _instance) {
    this.container.registerInstance(type, _instance);
    return this;
  };

  FrameworkConfiguration.prototype.singleton = function singleton(type, implementation) {
    this.container.registerSingleton(type, implementation);
    return this;
  };

  FrameworkConfiguration.prototype.transient = function transient(type, implementation) {
    this.container.registerTransient(type, implementation);
    return this;
  };

  FrameworkConfiguration.prototype.preTask = function preTask(task) {
    assertProcessed(this);
    this.preTasks.push(task);
    return this;
  };

  FrameworkConfiguration.prototype.postTask = function postTask(task) {
    assertProcessed(this);
    this.postTasks.push(task);
    return this;
  };

  FrameworkConfiguration.prototype.feature = function feature(plugin) {
    var config = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

    switch (typeof plugin === 'undefined' ? 'undefined' : _typeof(plugin)) {
      case 'string':
        var hasIndex = /\/index$/i.test(plugin);
        var _moduleId = hasIndex || getExt(plugin) ? plugin : plugin + '/index';
        var root = hasIndex ? plugin.substr(0, plugin.length - 6) : plugin;
        this.info.push({ moduleId: _moduleId, resourcesRelativeTo: [root, ''], config: config });
        break;

      case 'function':
        this.info.push({ configure: plugin, config: config || {} });
        break;
      default:
        throw new Error(invalidConfigMsg(plugin, 'feature'));
    }
    return this;
  };

  FrameworkConfiguration.prototype.globalResources = function globalResources(resources) {
    var _this5 = this;

    assertProcessed(this);

    var toAdd = Array.isArray(resources) ? resources : arguments;
    var resource = void 0;
    var resourcesRelativeTo = this.resourcesRelativeTo || ['', ''];

    for (var i = 0, ii = toAdd.length; i < ii; ++i) {
      resource = toAdd[i];
      switch (typeof resource === 'undefined' ? 'undefined' : _typeof(resource)) {
        case 'string':
          var parent = resourcesRelativeTo[0];
          var grandParent = resourcesRelativeTo[1];
          var name = resource;

          if ((resource.startsWith('./') || resource.startsWith('../')) && parent !== '') {
            name = (0, _aureliaPath.join)(parent, resource);
          }

          this.resourcesToLoad[name] = { moduleId: name, relativeTo: grandParent };
          break;
        case 'function':
          var meta = this.aurelia.resources.autoRegister(this.container, resource);
          if (meta instanceof _aureliaTemplating.HtmlBehaviorResource && meta.elementName !== null) {
            if (this.behaviorsToLoad.push(meta) === 1) {
              this.postTask(function () {
                return loadBehaviors(_this5);
              });
            }
          }
          break;
        default:
          throw new Error(invalidConfigMsg(resource, 'resource'));
      }
    }

    return this;
  };

  FrameworkConfiguration.prototype.globalName = function globalName(resourcePath, newName) {
    assertProcessed(this);
    this.resourcesToLoad[resourcePath] = { moduleId: newName, relativeTo: '' };
    return this;
  };

  FrameworkConfiguration.prototype.plugin = function plugin(_plugin, pluginConfig) {
    assertProcessed(this);

    var info = void 0;
    switch (typeof _plugin === 'undefined' ? 'undefined' : _typeof(_plugin)) {
      case 'string':
        info = { moduleId: _plugin, resourcesRelativeTo: [_plugin, ''], config: pluginConfig || {} };
        break;
      case 'function':
        info = { configure: _plugin, config: pluginConfig || {} };
        break;
      default:
        throw new Error(invalidConfigMsg(_plugin, 'plugin'));
    }
    this.info.push(info);
    return this;
  };

  FrameworkConfiguration.prototype._addNormalizedPlugin = function _addNormalizedPlugin(name, config) {
    var _this6 = this;

    var plugin = { moduleId: name, resourcesRelativeTo: [name, ''], config: config || {} };
    this.info.push(plugin);

    this.preTask(function () {
      var relativeTo = [name, _this6.bootstrapperName];
      plugin.moduleId = name;
      plugin.resourcesRelativeTo = relativeTo;
      return Promise.resolve();
    });

    return this;
  };

  FrameworkConfiguration.prototype.defaultBindingLanguage = function defaultBindingLanguage() {
    return this._addNormalizedPlugin('aurelia-templating-binding');
  };

  FrameworkConfiguration.prototype.router = function router() {
    return this._addNormalizedPlugin('aurelia-templating-router');
  };

  FrameworkConfiguration.prototype.history = function history() {
    return this._addNormalizedPlugin('aurelia-history-browser');
  };

  FrameworkConfiguration.prototype.defaultResources = function defaultResources() {
    return this._addNormalizedPlugin('aurelia-templating-resources');
  };

  FrameworkConfiguration.prototype.eventAggregator = function eventAggregator() {
    return this._addNormalizedPlugin('aurelia-event-aggregator');
  };

  FrameworkConfiguration.prototype.basicConfiguration = function basicConfiguration() {
    return this.defaultBindingLanguage().defaultResources().eventAggregator();
  };

  FrameworkConfiguration.prototype.standardConfiguration = function standardConfiguration() {
    return this.basicConfiguration().history().router();
  };

  FrameworkConfiguration.prototype.developmentLogging = function developmentLogging(level) {
    var _this7 = this;

    var logLevel = level ? TheLogManager.logLevel[level] : undefined;

    if (logLevel === undefined) {
      logLevel = TheLogManager.logLevel.debug;
    }

    this.preTask(function () {
      return _this7.aurelia.loader.normalize('aurelia-logging-console', _this7.bootstrapperName).then(function (name) {
        return _this7.aurelia.loader.loadModule(name).then(function (m) {
          TheLogManager.addAppender(new m.ConsoleAppender());
          TheLogManager.setLevel(logLevel);
        });
      });
    });

    return this;
  };

  FrameworkConfiguration.prototype.apply = function apply() {
    var _this8 = this;

    if (this.processed) {
      return Promise.resolve();
    }

    return runTasks(this, this.preTasks).then(function () {
      var loader = _this8.aurelia.loader;
      var info = _this8.info;
      var current = void 0;

      var next = function next() {
        current = info.shift();
        if (current) {
          return loadPlugin(_this8, loader, current).then(next);
        }

        _this8.processed = true;
        _this8.configuredPlugins = null;
        return Promise.resolve();
      };

      return next().then(function () {
        return runTasks(_this8, _this8.postTasks);
      });
    });
  };

  return FrameworkConfiguration;
}();

exports.FrameworkConfiguration = FrameworkConfiguration;
var LogManager = exports.LogManager = TheLogManager;
/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__("bluebird")))

/***/ },

/***/ "aurelia-history-browser":
/***/ function(module, exports, __webpack_require__) {

"use strict";
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.BrowserHistory = exports.DefaultLinkHandler = exports.LinkHandler = undefined;

var _class, _temp;

exports.configure = configure;

var _aureliaPal = __webpack_require__(21);

var _aureliaHistory = __webpack_require__(189);

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }



var LinkHandler = exports.LinkHandler = function () {
  function LinkHandler() {
    
  }

  LinkHandler.prototype.activate = function activate(history) {};

  LinkHandler.prototype.deactivate = function deactivate() {};

  return LinkHandler;
}();

var DefaultLinkHandler = exports.DefaultLinkHandler = function (_LinkHandler) {
  _inherits(DefaultLinkHandler, _LinkHandler);

  function DefaultLinkHandler() {
    

    var _this = _possibleConstructorReturn(this, _LinkHandler.call(this));

    _this.handler = function (e) {
      var _DefaultLinkHandler$g = DefaultLinkHandler.getEventInfo(e),
          shouldHandleEvent = _DefaultLinkHandler$g.shouldHandleEvent,
          href = _DefaultLinkHandler$g.href;

      if (shouldHandleEvent) {
        e.preventDefault();
        _this.history.navigate(href);
      }
    };
    return _this;
  }

  DefaultLinkHandler.prototype.activate = function activate(history) {
    if (history._hasPushState) {
      this.history = history;
      _aureliaPal.DOM.addEventListener('click', this.handler, true);
    }
  };

  DefaultLinkHandler.prototype.deactivate = function deactivate() {
    _aureliaPal.DOM.removeEventListener('click', this.handler);
  };

  DefaultLinkHandler.getEventInfo = function getEventInfo(event) {
    var info = {
      shouldHandleEvent: false,
      href: null,
      anchor: null
    };

    var target = DefaultLinkHandler.findClosestAnchor(event.target);
    if (!target || !DefaultLinkHandler.targetIsThisWindow(target)) {
      return info;
    }

    if (target.hasAttribute('download') || target.hasAttribute('router-ignore')) {
      return info;
    }

    if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) {
      return info;
    }

    var href = target.getAttribute('href');
    info.anchor = target;
    info.href = href;

    var leftButtonClicked = event.which === 1;
    var isRelative = href && !(href.charAt(0) === '#' || /^[a-z]+:/i.test(href));

    info.shouldHandleEvent = leftButtonClicked && isRelative;
    return info;
  };

  DefaultLinkHandler.findClosestAnchor = function findClosestAnchor(el) {
    while (el) {
      if (el.tagName === 'A') {
        return el;
      }

      el = el.parentNode;
    }
  };

  DefaultLinkHandler.targetIsThisWindow = function targetIsThisWindow(target) {
    var targetWindow = target.getAttribute('target');
    var win = _aureliaPal.PLATFORM.global;

    return !targetWindow || targetWindow === win.name || targetWindow === '_self';
  };

  return DefaultLinkHandler;
}(LinkHandler);

function configure(config) {
  config.singleton(_aureliaHistory.History, BrowserHistory);
  config.transient(LinkHandler, DefaultLinkHandler);
}

var BrowserHistory = exports.BrowserHistory = (_temp = _class = function (_History) {
  _inherits(BrowserHistory, _History);

  function BrowserHistory(linkHandler) {
    

    var _this2 = _possibleConstructorReturn(this, _History.call(this));

    _this2._isActive = false;
    _this2._checkUrlCallback = _this2._checkUrl.bind(_this2);

    _this2.location = _aureliaPal.PLATFORM.location;
    _this2.history = _aureliaPal.PLATFORM.history;
    _this2.linkHandler = linkHandler;
    return _this2;
  }

  BrowserHistory.prototype.activate = function activate(options) {
    if (this._isActive) {
      throw new Error('History has already been activated.');
    }

    var wantsPushState = !!options.pushState;

    this._isActive = true;
    this.options = Object.assign({}, { root: '/' }, this.options, options);

    this.root = ('/' + this.options.root + '/').replace(rootStripper, '/');

    this._wantsHashChange = this.options.hashChange !== false;
    this._hasPushState = !!(this.options.pushState && this.history && this.history.pushState);

    var eventName = void 0;
    if (this._hasPushState) {
      eventName = 'popstate';
    } else if (this._wantsHashChange) {
      eventName = 'hashchange';
    }

    _aureliaPal.PLATFORM.addEventListener(eventName, this._checkUrlCallback);

    if (this._wantsHashChange && wantsPushState) {
      var loc = this.location;
      var atRoot = loc.pathname.replace(/[^\/]$/, '$&/') === this.root;

      if (!this._hasPushState && !atRoot) {
        this.fragment = this._getFragment(null, true);
        this.location.replace(this.root + this.location.search + '#' + this.fragment);

        return true;
      } else if (this._hasPushState && atRoot && loc.hash) {
        this.fragment = this._getHash().replace(routeStripper, '');
        this.history.replaceState({}, _aureliaPal.DOM.title, this.root + this.fragment + loc.search);
      }
    }

    if (!this.fragment) {
      this.fragment = this._getFragment();
    }

    this.linkHandler.activate(this);

    if (!this.options.silent) {
      return this._loadUrl();
    }
  };

  BrowserHistory.prototype.deactivate = function deactivate() {
    _aureliaPal.PLATFORM.removeEventListener('popstate', this._checkUrlCallback);
    _aureliaPal.PLATFORM.removeEventListener('hashchange', this._checkUrlCallback);
    this._isActive = false;
    this.linkHandler.deactivate();
  };

  BrowserHistory.prototype.getAbsoluteRoot = function getAbsoluteRoot() {
    var origin = createOrigin(this.location.protocol, this.location.hostname, this.location.port);
    return '' + origin + this.root;
  };

  BrowserHistory.prototype.navigate = function navigate(fragment) {
    var _ref = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {},
        _ref$trigger = _ref.trigger,
        trigger = _ref$trigger === undefined ? true : _ref$trigger,
        _ref$replace = _ref.replace,
        replace = _ref$replace === undefined ? false : _ref$replace;

    if (fragment && absoluteUrl.test(fragment)) {
      this.location.href = fragment;
      return true;
    }

    if (!this._isActive) {
      return false;
    }

    fragment = this._getFragment(fragment || '');

    if (this.fragment === fragment && !replace) {
      return false;
    }

    this.fragment = fragment;

    var url = this.root + fragment;

    if (fragment === '' && url !== '/') {
      url = url.slice(0, -1);
    }

    if (this._hasPushState) {
      url = url.replace('//', '/');
      this.history[replace ? 'replaceState' : 'pushState']({}, _aureliaPal.DOM.title, url);
    } else if (this._wantsHashChange) {
      updateHash(this.location, fragment, replace);
    } else {
      this.location.assign(url);
    }

    if (trigger) {
      return this._loadUrl(fragment);
    }

    return true;
  };

  BrowserHistory.prototype.navigateBack = function navigateBack() {
    this.history.back();
  };

  BrowserHistory.prototype.setTitle = function setTitle(title) {
    _aureliaPal.DOM.title = title;
  };

  BrowserHistory.prototype.setState = function setState(key, value) {
    var state = Object.assign({}, this.history.state);
    var _location = this.location,
        pathname = _location.pathname,
        search = _location.search,
        hash = _location.hash;

    state[key] = value;
    this.history.replaceState(state, null, '' + pathname + search + hash);
  };

  BrowserHistory.prototype.getState = function getState(key) {
    var state = Object.assign({}, this.history.state);
    return state[key];
  };

  BrowserHistory.prototype._getHash = function _getHash() {
    return this.location.hash.substr(1);
  };

  BrowserHistory.prototype._getFragment = function _getFragment(fragment, forcePushState) {
    var root = void 0;

    if (!fragment) {
      if (this._hasPushState || !this._wantsHashChange || forcePushState) {
        fragment = this.location.pathname + this.location.search;
        root = this.root.replace(trailingSlash, '');
        if (!fragment.indexOf(root)) {
          fragment = fragment.substr(root.length);
        }
      } else {
        fragment = this._getHash();
      }
    }

    return '/' + fragment.replace(routeStripper, '');
  };

  BrowserHistory.prototype._checkUrl = function _checkUrl() {
    var current = this._getFragment();
    if (current !== this.fragment) {
      this._loadUrl();
    }
  };

  BrowserHistory.prototype._loadUrl = function _loadUrl(fragmentOverride) {
    var fragment = this.fragment = this._getFragment(fragmentOverride);

    return this.options.routeHandler ? this.options.routeHandler(fragment) : false;
  };

  return BrowserHistory;
}(_aureliaHistory.History), _class.inject = [LinkHandler], _temp);

var routeStripper = /^#?\/*|\s+$/g;

var rootStripper = /^\/+|\/+$/g;

var trailingSlash = /\/$/;

var absoluteUrl = /^([a-z][a-z0-9+\-.]*:)?\/\//i;

function updateHash(location, fragment, replace) {
  if (replace) {
    var _href = location.href.replace(/(javascript:|#).*$/, '');
    location.replace(_href + '#' + fragment);
  } else {
    location.hash = '#' + fragment;
  }
}

function createOrigin(protocol, hostname, port) {
  return protocol + '//' + hostname + (port ? ':' + port : '');
}

/***/ },

/***/ "aurelia-logging-console":
/***/ function(module, exports, __webpack_require__) {

"use strict";
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.ConsoleAppender = undefined;

var _aureliaLogging = __webpack_require__(58);



var ConsoleAppender = exports.ConsoleAppender = function () {
  function ConsoleAppender() {
    
  }

  ConsoleAppender.prototype.debug = function debug(logger) {
    var _console;

    for (var _len = arguments.length, rest = Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
      rest[_key - 1] = arguments[_key];
    }

    (_console = console).debug.apply(_console, ['DEBUG [' + logger.id + ']'].concat(rest));
  };

  ConsoleAppender.prototype.info = function info(logger) {
    var _console2;

    for (var _len2 = arguments.length, rest = Array(_len2 > 1 ? _len2 - 1 : 0), _key2 = 1; _key2 < _len2; _key2++) {
      rest[_key2 - 1] = arguments[_key2];
    }

    (_console2 = console).info.apply(_console2, ['INFO [' + logger.id + ']'].concat(rest));
  };

  ConsoleAppender.prototype.warn = function warn(logger) {
    var _console3;

    for (var _len3 = arguments.length, rest = Array(_len3 > 1 ? _len3 - 1 : 0), _key3 = 1; _key3 < _len3; _key3++) {
      rest[_key3 - 1] = arguments[_key3];
    }

    (_console3 = console).warn.apply(_console3, ['WARN [' + logger.id + ']'].concat(rest));
  };

  ConsoleAppender.prototype.error = function error(logger) {
    var _console4;

    for (var _len4 = arguments.length, rest = Array(_len4 > 1 ? _len4 - 1 : 0), _key4 = 1; _key4 < _len4; _key4++) {
      rest[_key4 - 1] = arguments[_key4];
    }

    (_console4 = console).error.apply(_console4, ['ERROR [' + logger.id + ']'].concat(rest));
  };

  return ConsoleAppender;
}();

/***/ },

/***/ "aurelia-route-recognizer":
/***/ function(module, exports, __webpack_require__) {

"use strict";
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0_aurelia_path__ = __webpack_require__(70);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0_aurelia_path___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_0_aurelia_path__);
/* harmony export (binding) */ __webpack_require__.d(exports, "State", function() { return State; });
/* harmony export (binding) */ __webpack_require__.d(exports, "StaticSegment", function() { return StaticSegment; });
/* harmony export (binding) */ __webpack_require__.d(exports, "DynamicSegment", function() { return DynamicSegment; });
/* harmony export (binding) */ __webpack_require__.d(exports, "StarSegment", function() { return StarSegment; });
/* harmony export (binding) */ __webpack_require__.d(exports, "EpsilonSegment", function() { return EpsilonSegment; });
/* harmony export (binding) */ __webpack_require__.d(exports, "RouteRecognizer", function() { return RouteRecognizer; });


let State = class State {
  constructor(charSpec) {
    this.charSpec = charSpec;
    this.nextStates = [];
  }

  get(charSpec) {
    for (let child of this.nextStates) {
      let isEqual = child.charSpec.validChars === charSpec.validChars && child.charSpec.invalidChars === charSpec.invalidChars;

      if (isEqual) {
        return child;
      }
    }

    return undefined;
  }

  put(charSpec) {
    let state = this.get(charSpec);

    if (state) {
      return state;
    }

    state = new State(charSpec);

    this.nextStates.push(state);

    if (charSpec.repeat) {
      state.nextStates.push(state);
    }

    return state;
  }

  match(ch) {
    let nextStates = this.nextStates;
    let results = [];

    for (let i = 0, l = nextStates.length; i < l; i++) {
      let child = nextStates[i];
      let charSpec = child.charSpec;

      if (charSpec.validChars !== undefined) {
        if (charSpec.validChars.indexOf(ch) !== -1) {
          results.push(child);
        }
      } else if (charSpec.invalidChars !== undefined) {
        if (charSpec.invalidChars.indexOf(ch) === -1) {
          results.push(child);
        }
      }
    }

    return results;
  }
};

const specials = ['/', '.', '*', '+', '?', '|', '(', ')', '[', ']', '{', '}', '\\'];

const escapeRegex = new RegExp('(\\' + specials.join('|\\') + ')', 'g');

let StaticSegment = class StaticSegment {
  constructor(string, caseSensitive) {
    this.string = string;
    this.caseSensitive = caseSensitive;
  }

  eachChar(callback) {
    let s = this.string;
    for (let i = 0, ii = s.length; i < ii; ++i) {
      let ch = s[i];
      callback({ validChars: this.caseSensitive ? ch : ch.toUpperCase() + ch.toLowerCase() });
    }
  }

  regex() {
    return this.string.replace(escapeRegex, '\\$1');
  }

  generate() {
    return this.string;
  }
};

let DynamicSegment = class DynamicSegment {
  constructor(name, optional) {
    this.name = name;
    this.optional = optional;
  }

  eachChar(callback) {
    callback({ invalidChars: '/', repeat: true });
  }

  regex() {
    return '([^/]+)';
  }

  generate(params, consumed) {
    consumed[this.name] = true;
    return params[this.name];
  }
};

let StarSegment = class StarSegment {
  constructor(name) {
    this.name = name;
  }

  eachChar(callback) {
    callback({ invalidChars: '', repeat: true });
  }

  regex() {
    return '(.+)';
  }

  generate(params, consumed) {
    consumed[this.name] = true;
    return params[this.name];
  }
};

let EpsilonSegment = class EpsilonSegment {
  eachChar() {}

  regex() {
    return '';
  }

  generate() {
    return '';
  }
};

let RouteRecognizer = class RouteRecognizer {
  constructor() {
    this.rootState = new State();
    this.names = {};
    this.routes = new Map();
  }

  add(route) {
    if (Array.isArray(route)) {
      route.forEach(r => this.add(r));
      return undefined;
    }

    let currentState = this.rootState;
    let skippableStates = [];
    let regex = '^';
    let types = { statics: 0, dynamics: 0, stars: 0 };
    let names = [];
    let routeName = route.handler.name;
    let isEmpty = true;
    let segments = parse(route.path, names, types, route.caseSensitive);

    for (let i = 0, ii = segments.length; i < ii; i++) {
      let segment = segments[i];
      if (segment instanceof EpsilonSegment) {
        continue;
      }

      let [firstState, nextState] = addSegment(currentState, segment);

      for (let j = 0, jj = skippableStates.length; j < jj; j++) {
        skippableStates[j].nextStates.push(firstState);
      }

      if (segment.optional) {
        skippableStates.push(nextState);
        regex += `(?:/${segment.regex()})?`;
      } else {
        currentState = nextState;
        regex += `/${segment.regex()}`;
        skippableStates.length = 0;
        isEmpty = false;
      }
    }

    if (isEmpty) {
      currentState = currentState.put({ validChars: '/' });
      regex += '/?';
    }

    let handlers = [{ handler: route.handler, names: names }];

    this.routes.set(route.handler, { segments, handlers });
    if (routeName) {
      let routeNames = Array.isArray(routeName) ? routeName : [routeName];
      for (let i = 0; i < routeNames.length; i++) {
        if (!(routeNames[i] in this.names)) {
          this.names[routeNames[i]] = { segments, handlers };
        }
      }
    }

    for (let i = 0; i < skippableStates.length; i++) {
      let state = skippableStates[i];
      state.handlers = handlers;
      state.regex = new RegExp(regex + '$', route.caseSensitive ? '' : 'i');
      state.types = types;
    }

    currentState.handlers = handlers;
    currentState.regex = new RegExp(regex + '$', route.caseSensitive ? '' : 'i');
    currentState.types = types;

    return currentState;
  }

  getRoute(nameOrRoute) {
    return typeof nameOrRoute === 'string' ? this.names[nameOrRoute] : this.routes.get(nameOrRoute);
  }

  handlersFor(nameOrRoute) {
    let route = this.getRoute(nameOrRoute);
    if (!route) {
      throw new Error(`There is no route named ${nameOrRoute}`);
    }

    return [...route.handlers];
  }

  hasRoute(nameOrRoute) {
    return !!this.getRoute(nameOrRoute);
  }

  generate(nameOrRoute, params) {
    let route = this.getRoute(nameOrRoute);
    if (!route) {
      throw new Error(`There is no route named ${nameOrRoute}`);
    }

    let handler = route.handlers[0].handler;
    if (handler.generationUsesHref) {
      return handler.href;
    }

    let routeParams = Object.assign({}, params);
    let segments = route.segments;
    let consumed = {};
    let output = '';

    for (let i = 0, l = segments.length; i < l; i++) {
      let segment = segments[i];

      if (segment instanceof EpsilonSegment) {
        continue;
      }

      let segmentValue = segment.generate(routeParams, consumed);
      if (segmentValue === null || segmentValue === undefined) {
        if (!segment.optional) {
          throw new Error(`A value is required for route parameter '${segment.name}' in route '${nameOrRoute}'.`);
        }
      } else {
        output += '/';
        output += segmentValue;
      }
    }

    if (output.charAt(0) !== '/') {
      output = '/' + output;
    }

    for (let param in consumed) {
      delete routeParams[param];
    }

    let queryString = __webpack_require__.i(__WEBPACK_IMPORTED_MODULE_0_aurelia_path__["buildQueryString"])(routeParams);
    output += queryString ? `?${queryString}` : '';

    return output;
  }

  recognize(path) {
    let states = [this.rootState];
    let queryParams = {};
    let isSlashDropped = false;
    let normalizedPath = path;

    let queryStart = normalizedPath.indexOf('?');
    if (queryStart !== -1) {
      let queryString = normalizedPath.substr(queryStart + 1, normalizedPath.length);
      normalizedPath = normalizedPath.substr(0, queryStart);
      queryParams = __webpack_require__.i(__WEBPACK_IMPORTED_MODULE_0_aurelia_path__["parseQueryString"])(queryString);
    }

    normalizedPath = decodeURI(normalizedPath);

    if (normalizedPath.charAt(0) !== '/') {
      normalizedPath = '/' + normalizedPath;
    }

    let pathLen = normalizedPath.length;
    if (pathLen > 1 && normalizedPath.charAt(pathLen - 1) === '/') {
      normalizedPath = normalizedPath.substr(0, pathLen - 1);
      isSlashDropped = true;
    }

    for (let i = 0, l = normalizedPath.length; i < l; i++) {
      states = recognizeChar(states, normalizedPath.charAt(i));
      if (!states.length) {
        break;
      }
    }

    let solutions = [];
    for (let i = 0, l = states.length; i < l; i++) {
      if (states[i].handlers) {
        solutions.push(states[i]);
      }
    }

    states = sortSolutions(solutions);

    let state = solutions[0];
    if (state && state.handlers) {
      if (isSlashDropped && state.regex.source.slice(-5) === '(.+)$') {
        normalizedPath = normalizedPath + '/';
      }

      return findHandler(state, normalizedPath, queryParams);
    }
  }
};

let RecognizeResults = class RecognizeResults {
  constructor(queryParams) {
    this.splice = Array.prototype.splice;
    this.slice = Array.prototype.slice;
    this.push = Array.prototype.push;
    this.length = 0;
    this.queryParams = queryParams || {};
  }
};


function parse(route, names, types, caseSensitive) {
  let normalizedRoute = route;
  if (route.charAt(0) === '/') {
    normalizedRoute = route.substr(1);
  }

  let results = [];

  let splitRoute = normalizedRoute.split('/');
  for (let i = 0, ii = splitRoute.length; i < ii; ++i) {
    let segment = splitRoute[i];

    let match = segment.match(/^:([^?]+)(\?)?$/);
    if (match) {
      let [, name, optional] = match;
      if (name.indexOf('=') !== -1) {
        throw new Error(`Parameter ${name} in route ${route} has a default value, which is not supported.`);
      }
      results.push(new DynamicSegment(name, !!optional));
      names.push(name);
      types.dynamics++;
      continue;
    }

    match = segment.match(/^\*(.+)$/);
    if (match) {
      results.push(new StarSegment(match[1]));
      names.push(match[1]);
      types.stars++;
    } else if (segment === '') {
      results.push(new EpsilonSegment());
    } else {
      results.push(new StaticSegment(segment, caseSensitive));
      types.statics++;
    }
  }

  return results;
}

function sortSolutions(states) {
  return states.sort((a, b) => {
    if (a.types.stars !== b.types.stars) {
      return a.types.stars - b.types.stars;
    }

    if (a.types.stars) {
      if (a.types.statics !== b.types.statics) {
        return b.types.statics - a.types.statics;
      }
      if (a.types.dynamics !== b.types.dynamics) {
        return b.types.dynamics - a.types.dynamics;
      }
    }

    if (a.types.dynamics !== b.types.dynamics) {
      return a.types.dynamics - b.types.dynamics;
    }

    if (a.types.statics !== b.types.statics) {
      return b.types.statics - a.types.statics;
    }

    return 0;
  });
}

function recognizeChar(states, ch) {
  let nextStates = [];

  for (let i = 0, l = states.length; i < l; i++) {
    let state = states[i];
    nextStates.push(...state.match(ch));
  }

  return nextStates;
}

function findHandler(state, path, queryParams) {
  let handlers = state.handlers;
  let regex = state.regex;
  let captures = path.match(regex);
  let currentCapture = 1;
  let result = new RecognizeResults(queryParams);

  for (let i = 0, l = handlers.length; i < l; i++) {
    let handler = handlers[i];
    let names = handler.names;
    let params = {};

    for (let j = 0, m = names.length; j < m; j++) {
      params[names[j]] = captures[currentCapture++];
    }

    result.push({ handler: handler.handler, params: params, isDynamic: !!names.length });
  }

  return result;
}

function addSegment(currentState, segment) {
  let firstState = currentState.put({ validChars: '/' });
  let nextState = firstState;
  segment.eachChar(ch => {
    nextState = nextState.put(ch);
  });

  return [firstState, nextState];
}

/***/ },

/***/ "aurelia-router":
/***/ function(module, exports, __webpack_require__) {

"use strict";
/* WEBPACK VAR INJECTION */(function(Promise) {'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.AppRouter = exports.PipelineProvider = exports.LoadRouteStep = exports.RouteLoader = exports.ActivateNextStep = exports.DeactivatePreviousStep = exports.CanActivateNextStep = exports.CanDeactivatePreviousStep = exports.Router = exports.BuildNavigationPlanStep = exports.activationStrategy = exports.RouterConfiguration = exports.Pipeline = exports.pipelineStatus = exports.RedirectToRoute = exports.Redirect = exports.NavModel = exports.NavigationInstruction = exports.CommitChangesStep = undefined;

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

exports._normalizeAbsolutePath = _normalizeAbsolutePath;
exports._createRootedPath = _createRootedPath;
exports._resolveUrl = _resolveUrl;
exports._ensureArrayWithSingleRoutePerConfig = _ensureArrayWithSingleRoutePerConfig;
exports.isNavigationCommand = isNavigationCommand;
exports._buildNavigationPlan = _buildNavigationPlan;

var _aureliaLogging = __webpack_require__(58);

var LogManager = _interopRequireWildcard(_aureliaLogging);

var _aureliaRouteRecognizer = __webpack_require__("aurelia-route-recognizer");

var _aureliaDependencyInjection = __webpack_require__(7);

var _aureliaHistory = __webpack_require__(189);

var _aureliaEventAggregator = __webpack_require__("aurelia-event-aggregator");

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }



function _normalizeAbsolutePath(path, hasPushState) {
  var absolute = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : false;

  if (!hasPushState && path[0] !== '#') {
    path = '#' + path;
  }

  if (hasPushState && absolute) {
    path = path.substring(1, path.length);
  }

  return path;
}

function _createRootedPath(fragment, baseUrl, hasPushState, absolute) {
  if (isAbsoluteUrl.test(fragment)) {
    return fragment;
  }

  var path = '';

  if (baseUrl.length && baseUrl[0] !== '/') {
    path += '/';
  }

  path += baseUrl;

  if ((!path.length || path[path.length - 1] !== '/') && fragment[0] !== '/') {
    path += '/';
  }

  if (path.length && path[path.length - 1] === '/' && fragment[0] === '/') {
    path = path.substring(0, path.length - 1);
  }

  return _normalizeAbsolutePath(path + fragment, hasPushState, absolute);
}

function _resolveUrl(fragment, baseUrl, hasPushState) {
  if (isRootedPath.test(fragment)) {
    return _normalizeAbsolutePath(fragment, hasPushState);
  }

  return _createRootedPath(fragment, baseUrl, hasPushState);
}

function _ensureArrayWithSingleRoutePerConfig(config) {
  var routeConfigs = [];

  if (Array.isArray(config.route)) {
    for (var i = 0, ii = config.route.length; i < ii; ++i) {
      var current = Object.assign({}, config);
      current.route = config.route[i];
      routeConfigs.push(current);
    }
  } else {
    routeConfigs.push(Object.assign({}, config));
  }

  return routeConfigs;
}

var isRootedPath = /^#?\//;
var isAbsoluteUrl = /^([a-z][a-z0-9+\-.]*:)?\/\//i;

var CommitChangesStep = exports.CommitChangesStep = function () {
  function CommitChangesStep() {
    
  }

  CommitChangesStep.prototype.run = function run(navigationInstruction, next) {
    return navigationInstruction._commitChanges(true).then(function () {
      navigationInstruction._updateTitle();
      return next();
    });
  };

  return CommitChangesStep;
}();

var NavigationInstruction = exports.NavigationInstruction = function () {
  function NavigationInstruction(init) {
    

    this.plan = null;
    this.options = {};

    Object.assign(this, init);

    this.params = this.params || {};
    this.viewPortInstructions = {};

    var ancestorParams = [];
    var current = this;
    do {
      var currentParams = Object.assign({}, current.params);
      if (current.config && current.config.hasChildRouter) {
        delete currentParams[current.getWildCardName()];
      }

      ancestorParams.unshift(currentParams);
      current = current.parentInstruction;
    } while (current);

    var allParams = Object.assign.apply(Object, [{}, this.queryParams].concat(ancestorParams));
    this.lifecycleArgs = [allParams, this.config, this];
  }

  NavigationInstruction.prototype.getAllInstructions = function getAllInstructions() {
    var instructions = [this];
    for (var _key in this.viewPortInstructions) {
      var childInstruction = this.viewPortInstructions[_key].childNavigationInstruction;
      if (childInstruction) {
        instructions.push.apply(instructions, childInstruction.getAllInstructions());
      }
    }

    return instructions;
  };

  NavigationInstruction.prototype.getAllPreviousInstructions = function getAllPreviousInstructions() {
    return this.getAllInstructions().map(function (c) {
      return c.previousInstruction;
    }).filter(function (c) {
      return c;
    });
  };

  NavigationInstruction.prototype.addViewPortInstruction = function addViewPortInstruction(viewPortName, strategy, moduleId, component) {
    var config = Object.assign({}, this.lifecycleArgs[1], { currentViewPort: viewPortName });
    var viewportInstruction = this.viewPortInstructions[viewPortName] = {
      name: viewPortName,
      strategy: strategy,
      moduleId: moduleId,
      component: component,
      childRouter: component.childRouter,
      lifecycleArgs: [].concat(this.lifecycleArgs[0], config, this.lifecycleArgs[2])
    };

    return viewportInstruction;
  };

  NavigationInstruction.prototype.getWildCardName = function getWildCardName() {
    var wildcardIndex = this.config.route.lastIndexOf('*');
    return this.config.route.substr(wildcardIndex + 1);
  };

  NavigationInstruction.prototype.getWildcardPath = function getWildcardPath() {
    var wildcardName = this.getWildCardName();
    var path = this.params[wildcardName] || '';

    if (this.queryString) {
      path += '?' + this.queryString;
    }

    return path;
  };

  NavigationInstruction.prototype.getBaseUrl = function getBaseUrl() {
    var _this = this;

    var fragment = decodeURI(this.fragment);

    if (fragment === '') {
      var nonEmptyRoute = this.router.routes.find(function (route) {
        return route.name === _this.config.name && route.route !== '';
      });
      if (nonEmptyRoute) {
        fragment = nonEmptyRoute.route;
      }
    }

    if (!this.params) {
      return encodeURI(fragment);
    }

    var wildcardName = this.getWildCardName();
    var path = this.params[wildcardName] || '';

    if (!path) {
      return encodeURI(fragment);
    }

    return encodeURI(fragment.substr(0, fragment.lastIndexOf(path)));
  };

  NavigationInstruction.prototype._commitChanges = function _commitChanges(waitToSwap) {
    var _this2 = this;

    var router = this.router;
    router.currentInstruction = this;

    if (this.previousInstruction) {
      this.previousInstruction.config.navModel.isActive = false;
    }

    this.config.navModel.isActive = true;

    router.refreshNavigation();

    var loads = [];
    var delaySwaps = [];

    var _loop = function _loop(viewPortName) {
      var viewPortInstruction = _this2.viewPortInstructions[viewPortName];
      var viewPort = router.viewPorts[viewPortName];

      if (!viewPort) {
        throw new Error('There was no router-view found in the view for ' + viewPortInstruction.moduleId + '.');
      }

      if (viewPortInstruction.strategy === activationStrategy.replace) {
        if (viewPortInstruction.childNavigationInstruction && viewPortInstruction.childNavigationInstruction.parentCatchHandler) {
          loads.push(viewPortInstruction.childNavigationInstruction._commitChanges(waitToSwap));
        } else {
          if (waitToSwap) {
            delaySwaps.push({ viewPort: viewPort, viewPortInstruction: viewPortInstruction });
          }
          loads.push(viewPort.process(viewPortInstruction, waitToSwap).then(function (x) {
            if (viewPortInstruction.childNavigationInstruction) {
              return viewPortInstruction.childNavigationInstruction._commitChanges(waitToSwap);
            }
          }));
        }
      } else {
        if (viewPortInstruction.childNavigationInstruction) {
          loads.push(viewPortInstruction.childNavigationInstruction._commitChanges(waitToSwap));
        }
      }
    };

    for (var viewPortName in this.viewPortInstructions) {
      _loop(viewPortName);
    }

    return Promise.all(loads).then(function () {
      delaySwaps.forEach(function (x) {
        return x.viewPort.swap(x.viewPortInstruction);
      });
      return null;
    }).then(function () {
      return prune(_this2);
    });
  };

  NavigationInstruction.prototype._updateTitle = function _updateTitle() {
    var title = this._buildTitle(this.router.titleSeparator);
    if (title) {
      this.router.history.setTitle(title);
    }
  };

  NavigationInstruction.prototype._buildTitle = function _buildTitle() {
    var separator = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : ' | ';

    var title = '';
    var childTitles = [];

    if (this.config.navModel.title) {
      title = this.router.transformTitle(this.config.navModel.title);
    }

    for (var viewPortName in this.viewPortInstructions) {
      var _viewPortInstruction = this.viewPortInstructions[viewPortName];

      if (_viewPortInstruction.childNavigationInstruction) {
        var childTitle = _viewPortInstruction.childNavigationInstruction._buildTitle(separator);
        if (childTitle) {
          childTitles.push(childTitle);
        }
      }
    }

    if (childTitles.length) {
      title = childTitles.join(separator) + (title ? separator : '') + title;
    }

    if (this.router.title) {
      title += (title ? separator : '') + this.router.transformTitle(this.router.title);
    }

    return title;
  };

  return NavigationInstruction;
}();

function prune(instruction) {
  instruction.previousInstruction = null;
  instruction.plan = null;
}

var NavModel = exports.NavModel = function () {
  function NavModel(router, relativeHref) {
    

    this.isActive = false;
    this.title = null;
    this.href = null;
    this.relativeHref = null;
    this.settings = {};
    this.config = null;

    this.router = router;
    this.relativeHref = relativeHref;
  }

  NavModel.prototype.setTitle = function setTitle(title) {
    this.title = title;

    if (this.isActive) {
      this.router.updateTitle();
    }
  };

  return NavModel;
}();

function isNavigationCommand(obj) {
  return obj && typeof obj.navigate === 'function';
}

var Redirect = exports.Redirect = function () {
  function Redirect(url) {
    var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

    

    this.url = url;
    this.options = Object.assign({ trigger: true, replace: true }, options);
    this.shouldContinueProcessing = false;
  }

  Redirect.prototype.setRouter = function setRouter(router) {
    this.router = router;
  };

  Redirect.prototype.navigate = function navigate(appRouter) {
    var navigatingRouter = this.options.useAppRouter ? appRouter : this.router || appRouter;
    navigatingRouter.navigate(this.url, this.options);
  };

  return Redirect;
}();

var RedirectToRoute = exports.RedirectToRoute = function () {
  function RedirectToRoute(route) {
    var params = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
    var options = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};

    

    this.route = route;
    this.params = params;
    this.options = Object.assign({ trigger: true, replace: true }, options);
    this.shouldContinueProcessing = false;
  }

  RedirectToRoute.prototype.setRouter = function setRouter(router) {
    this.router = router;
  };

  RedirectToRoute.prototype.navigate = function navigate(appRouter) {
    var navigatingRouter = this.options.useAppRouter ? appRouter : this.router || appRouter;
    navigatingRouter.navigateToRoute(this.route, this.params, this.options);
  };

  return RedirectToRoute;
}();

var pipelineStatus = exports.pipelineStatus = {
  completed: 'completed',
  canceled: 'canceled',
  rejected: 'rejected',
  running: 'running'
};

var Pipeline = exports.Pipeline = function () {
  function Pipeline() {
    

    this.steps = [];
  }

  Pipeline.prototype.addStep = function addStep(step) {
    var run = void 0;

    if (typeof step === 'function') {
      run = step;
    } else if (typeof step.getSteps === 'function') {
      var steps = step.getSteps();
      for (var i = 0, l = steps.length; i < l; i++) {
        this.addStep(steps[i]);
      }

      return this;
    } else {
      run = step.run.bind(step);
    }

    this.steps.push(run);

    return this;
  };

  Pipeline.prototype.run = function run(instruction) {
    var index = -1;
    var steps = this.steps;

    function next() {
      index++;

      if (index < steps.length) {
        var currentStep = steps[index];

        try {
          return currentStep(instruction, next);
        } catch (e) {
          return next.reject(e);
        }
      } else {
        return next.complete();
      }
    }

    next.complete = createCompletionHandler(next, pipelineStatus.completed);
    next.cancel = createCompletionHandler(next, pipelineStatus.canceled);
    next.reject = createCompletionHandler(next, pipelineStatus.rejected);

    return next();
  };

  return Pipeline;
}();

function createCompletionHandler(next, status) {
  return function (output) {
    return Promise.resolve({ status: status, output: output, completed: status === pipelineStatus.completed });
  };
}

var RouterConfiguration = exports.RouterConfiguration = function () {
  function RouterConfiguration() {
    

    this.instructions = [];
    this.options = {};
    this.pipelineSteps = [];
  }

  RouterConfiguration.prototype.addPipelineStep = function addPipelineStep(name, step) {
    if (step === null || step === undefined) {
      throw new Error('Pipeline step cannot be null or undefined.');
    }
    this.pipelineSteps.push({ name: name, step: step });
    return this;
  };

  RouterConfiguration.prototype.addAuthorizeStep = function addAuthorizeStep(step) {
    return this.addPipelineStep('authorize', step);
  };

  RouterConfiguration.prototype.addPreActivateStep = function addPreActivateStep(step) {
    return this.addPipelineStep('preActivate', step);
  };

  RouterConfiguration.prototype.addPreRenderStep = function addPreRenderStep(step) {
    return this.addPipelineStep('preRender', step);
  };

  RouterConfiguration.prototype.addPostRenderStep = function addPostRenderStep(step) {
    return this.addPipelineStep('postRender', step);
  };

  RouterConfiguration.prototype.fallbackRoute = function fallbackRoute(fragment) {
    this._fallbackRoute = fragment;
    return this;
  };

  RouterConfiguration.prototype.map = function map(route) {
    if (Array.isArray(route)) {
      route.forEach(this.map.bind(this));
      return this;
    }

    return this.mapRoute(route);
  };

  RouterConfiguration.prototype.useViewPortDefaults = function useViewPortDefaults(viewPortConfig) {
    this.viewPortDefaults = viewPortConfig;
    return this;
  };

  RouterConfiguration.prototype.mapRoute = function mapRoute(config) {
    this.instructions.push(function (router) {
      var routeConfigs = _ensureArrayWithSingleRoutePerConfig(config);

      var navModel = void 0;
      for (var i = 0, ii = routeConfigs.length; i < ii; ++i) {
        var _routeConfig = routeConfigs[i];
        _routeConfig.settings = _routeConfig.settings || {};
        if (!navModel) {
          navModel = router.createNavModel(_routeConfig);
        }

        router.addRoute(_routeConfig, navModel);
      }
    });

    return this;
  };

  RouterConfiguration.prototype.mapUnknownRoutes = function mapUnknownRoutes(config) {
    this.unknownRouteConfig = config;
    return this;
  };

  RouterConfiguration.prototype.exportToRouter = function exportToRouter(router) {
    var instructions = this.instructions;
    for (var i = 0, ii = instructions.length; i < ii; ++i) {
      instructions[i](router);
    }

    if (this.title) {
      router.title = this.title;
    }

    if (this.titleSeparator) {
      router.titleSeparator = this.titleSeparator;
    }

    if (this.unknownRouteConfig) {
      router.handleUnknownRoutes(this.unknownRouteConfig);
    }

    if (this._fallbackRoute) {
      router.fallbackRoute = this._fallbackRoute;
    }

    if (this.viewPortDefaults) {
      router.useViewPortDefaults(this.viewPortDefaults);
    }

    Object.assign(router.options, this.options);

    var pipelineSteps = this.pipelineSteps;
    if (pipelineSteps.length) {
      if (!router.isRoot) {
        throw new Error('Pipeline steps can only be added to the root router');
      }

      var pipelineProvider = router.pipelineProvider;
      for (var _i = 0, _ii = pipelineSteps.length; _i < _ii; ++_i) {
        var _pipelineSteps$_i = pipelineSteps[_i],
            _name = _pipelineSteps$_i.name,
            _step = _pipelineSteps$_i.step;

        pipelineProvider.addStep(_name, _step);
      }
    }
  };

  return RouterConfiguration;
}();

var activationStrategy = exports.activationStrategy = {
  noChange: 'no-change',
  invokeLifecycle: 'invoke-lifecycle',
  replace: 'replace'
};

var BuildNavigationPlanStep = exports.BuildNavigationPlanStep = function () {
  function BuildNavigationPlanStep() {
    
  }

  BuildNavigationPlanStep.prototype.run = function run(navigationInstruction, next) {
    return _buildNavigationPlan(navigationInstruction).then(function (plan) {
      if (plan instanceof Redirect) {
        return next.cancel(plan);
      }
      navigationInstruction.plan = plan;
      return next();
    }).catch(next.cancel);
  };

  return BuildNavigationPlanStep;
}();

function _buildNavigationPlan(instruction, forceLifecycleMinimum) {
  var config = instruction.config;

  if ('redirect' in config) {
    var _router = instruction.router;
    return _router._createNavigationInstruction(config.redirect).then(function (newInstruction) {
      var params = {};
      for (var _key2 in newInstruction.params) {
        var val = newInstruction.params[_key2];
        if (typeof val === 'string' && val[0] === ':') {
          val = val.slice(1);

          if (val in instruction.params) {
            params[_key2] = instruction.params[val];
          }
        } else {
          params[_key2] = newInstruction.params[_key2];
        }
      }
      var redirectLocation = _router.generate(newInstruction.config.name, params, instruction.options);

      if (instruction.queryString) {
        redirectLocation += '?' + instruction.queryString;
      }

      return Promise.resolve(new Redirect(redirectLocation));
    });
  }

  var prev = instruction.previousInstruction;
  var plan = {};
  var defaults = instruction.router.viewPortDefaults;

  if (prev) {
    var newParams = hasDifferentParameterValues(prev, instruction);
    var pending = [];

    var _loop2 = function _loop2(viewPortName) {
      var prevViewPortInstruction = prev.viewPortInstructions[viewPortName];
      var nextViewPortConfig = viewPortName in config.viewPorts ? config.viewPorts[viewPortName] : prevViewPortInstruction;
      if (nextViewPortConfig.moduleId === null && viewPortName in instruction.router.viewPortDefaults) {
        nextViewPortConfig = defaults[viewPortName];
      }

      var viewPortPlan = plan[viewPortName] = {
        name: viewPortName,
        config: nextViewPortConfig,
        prevComponent: prevViewPortInstruction.component,
        prevModuleId: prevViewPortInstruction.moduleId
      };

      if (prevViewPortInstruction.moduleId !== nextViewPortConfig.moduleId) {
        viewPortPlan.strategy = activationStrategy.replace;
      } else if ('determineActivationStrategy' in prevViewPortInstruction.component.viewModel) {
        var _prevViewPortInstruct;

        viewPortPlan.strategy = (_prevViewPortInstruct = prevViewPortInstruction.component.viewModel).determineActivationStrategy.apply(_prevViewPortInstruct, instruction.lifecycleArgs);
      } else if (config.activationStrategy) {
        viewPortPlan.strategy = config.activationStrategy;
      } else if (newParams || forceLifecycleMinimum) {
        viewPortPlan.strategy = activationStrategy.invokeLifecycle;
      } else {
        viewPortPlan.strategy = activationStrategy.noChange;
      }

      if (viewPortPlan.strategy !== activationStrategy.replace && prevViewPortInstruction.childRouter) {
        var path = instruction.getWildcardPath();
        var task = prevViewPortInstruction.childRouter._createNavigationInstruction(path, instruction).then(function (childInstruction) {
          viewPortPlan.childNavigationInstruction = childInstruction;

          return _buildNavigationPlan(childInstruction, viewPortPlan.strategy === activationStrategy.invokeLifecycle).then(function (childPlan) {
            if (childPlan instanceof Redirect) {
              return Promise.reject(childPlan);
            }
            childInstruction.plan = childPlan;
          });
        });

        pending.push(task);
      }
    };

    for (var viewPortName in prev.viewPortInstructions) {
      _loop2(viewPortName);
    }

    return Promise.all(pending).then(function () {
      return plan;
    });
  }

  for (var viewPortName in config.viewPorts) {
    var viewPortConfig = config.viewPorts[viewPortName];
    if (viewPortConfig.moduleId === null && viewPortName in instruction.router.viewPortDefaults) {
      viewPortConfig = defaults[viewPortName];
    }
    plan[viewPortName] = {
      name: viewPortName,
      strategy: activationStrategy.replace,
      config: viewPortConfig
    };
  }

  return Promise.resolve(plan);
}

function hasDifferentParameterValues(prev, next) {
  var prevParams = prev.params;
  var nextParams = next.params;
  var nextWildCardName = next.config.hasChildRouter ? next.getWildCardName() : null;

  for (var _key3 in nextParams) {
    if (_key3 === nextWildCardName) {
      continue;
    }

    if (prevParams[_key3] !== nextParams[_key3]) {
      return true;
    }
  }

  for (var _key4 in prevParams) {
    if (_key4 === nextWildCardName) {
      continue;
    }

    if (prevParams[_key4] !== nextParams[_key4]) {
      return true;
    }
  }

  if (!next.options.compareQueryParams) {
    return false;
  }

  var prevQueryParams = prev.queryParams;
  var nextQueryParams = next.queryParams;
  for (var _key5 in nextQueryParams) {
    if (prevQueryParams[_key5] !== nextQueryParams[_key5]) {
      return true;
    }
  }

  for (var _key6 in prevQueryParams) {
    if (prevQueryParams[_key6] !== nextQueryParams[_key6]) {
      return true;
    }
  }

  return false;
}

var Router = exports.Router = function () {
  function Router(container, history) {
    var _this3 = this;

    

    this.parent = null;
    this.options = {};
    this.viewPortDefaults = {};

    this.transformTitle = function (title) {
      if (_this3.parent) {
        return _this3.parent.transformTitle(title);
      }
      return title;
    };

    this.container = container;
    this.history = history;
    this.reset();
  }

  Router.prototype.reset = function reset() {
    var _this4 = this;

    this.viewPorts = {};
    this.routes = [];
    this.baseUrl = '';
    this.isConfigured = false;
    this.isNavigating = false;
    this.isExplicitNavigation = false;
    this.isExplicitNavigationBack = false;
    this.isNavigatingFirst = false;
    this.isNavigatingNew = false;
    this.isNavigatingRefresh = false;
    this.isNavigatingForward = false;
    this.isNavigatingBack = false;
    this.couldDeactivate = false;
    this.navigation = [];
    this.currentInstruction = null;
    this.viewPortDefaults = {};
    this._fallbackOrder = 100;
    this._recognizer = new _aureliaRouteRecognizer.RouteRecognizer();
    this._childRecognizer = new _aureliaRouteRecognizer.RouteRecognizer();
    this._configuredPromise = new Promise(function (resolve) {
      _this4._resolveConfiguredPromise = resolve;
    });
  };

  Router.prototype.registerViewPort = function registerViewPort(viewPort, name) {
    name = name || 'default';
    this.viewPorts[name] = viewPort;
  };

  Router.prototype.ensureConfigured = function ensureConfigured() {
    return this._configuredPromise;
  };

  Router.prototype.configure = function configure(callbackOrConfig) {
    var _this5 = this;

    this.isConfigured = true;

    var result = callbackOrConfig;
    var config = void 0;
    if (typeof callbackOrConfig === 'function') {
      config = new RouterConfiguration();
      result = callbackOrConfig(config);
    }

    return Promise.resolve(result).then(function (c) {
      if (c && c.exportToRouter) {
        config = c;
      }

      config.exportToRouter(_this5);
      _this5.isConfigured = true;
      _this5._resolveConfiguredPromise();
    });
  };

  Router.prototype.navigate = function navigate(fragment, options) {
    if (!this.isConfigured && this.parent) {
      return this.parent.navigate(fragment, options);
    }

    this.isExplicitNavigation = true;
    return this.history.navigate(_resolveUrl(fragment, this.baseUrl, this.history._hasPushState), options);
  };

  Router.prototype.navigateToRoute = function navigateToRoute(route, params, options) {
    var path = this.generate(route, params);
    return this.navigate(path, options);
  };

  Router.prototype.navigateBack = function navigateBack() {
    this.isExplicitNavigationBack = true;
    this.history.navigateBack();
  };

  Router.prototype.createChild = function createChild(container) {
    var childRouter = new Router(container || this.container.createChild(), this.history);
    childRouter.parent = this;
    return childRouter;
  };

  Router.prototype.generate = function generate(name, params) {
    var options = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};

    var hasRoute = this._recognizer.hasRoute(name);
    if ((!this.isConfigured || !hasRoute) && this.parent) {
      return this.parent.generate(name, params, options);
    }

    if (!hasRoute) {
      throw new Error('A route with name \'' + name + '\' could not be found. Check that `name: \'' + name + '\'` was specified in the route\'s config.');
    }

    var path = this._recognizer.generate(name, params);
    var rootedPath = _createRootedPath(path, this.baseUrl, this.history._hasPushState, options.absolute);
    return options.absolute ? '' + this.history.getAbsoluteRoot() + rootedPath : rootedPath;
  };

  Router.prototype.createNavModel = function createNavModel(config) {
    var navModel = new NavModel(this, 'href' in config ? config.href : config.route);
    navModel.title = config.title;
    navModel.order = config.nav;
    navModel.href = config.href;
    navModel.settings = config.settings;
    navModel.config = config;

    return navModel;
  };

  Router.prototype.addRoute = function addRoute(config, navModel) {
    if (Array.isArray(config.route)) {
      var routeConfigs = _ensureArrayWithSingleRoutePerConfig(config);
      routeConfigs.forEach(this.addRoute.bind(this));
      return;
    }

    validateRouteConfig(config, this.routes);

    if (!('viewPorts' in config) && !config.navigationStrategy) {
      config.viewPorts = {
        'default': {
          moduleId: config.moduleId,
          view: config.view
        }
      };
    }

    if (!navModel) {
      navModel = this.createNavModel(config);
    }

    this.routes.push(config);

    var path = config.route;
    if (path.charAt(0) === '/') {
      path = path.substr(1);
    }
    var caseSensitive = config.caseSensitive === true;
    var state = this._recognizer.add({ path: path, handler: config, caseSensitive: caseSensitive });

    if (path) {
      var _settings = config.settings;
      delete config.settings;
      var withChild = JSON.parse(JSON.stringify(config));
      config.settings = _settings;
      withChild.route = path + '/*childRoute';
      withChild.hasChildRouter = true;
      this._childRecognizer.add({
        path: withChild.route,
        handler: withChild,
        caseSensitive: caseSensitive
      });

      withChild.navModel = navModel;
      withChild.settings = config.settings;
      withChild.navigationStrategy = config.navigationStrategy;
    }

    config.navModel = navModel;

    if ((navModel.order || navModel.order === 0) && this.navigation.indexOf(navModel) === -1) {
      if (!navModel.href && navModel.href !== '' && (state.types.dynamics || state.types.stars)) {
        throw new Error('Invalid route config for "' + config.route + '" : dynamic routes must specify an "href:" to be included in the navigation model.');
      }

      if (typeof navModel.order !== 'number') {
        navModel.order = ++this._fallbackOrder;
      }

      this.navigation.push(navModel);
      this.navigation = this.navigation.sort(function (a, b) {
        return a.order - b.order;
      });
    }
  };

  Router.prototype.hasRoute = function hasRoute(name) {
    return !!(this._recognizer.hasRoute(name) || this.parent && this.parent.hasRoute(name));
  };

  Router.prototype.hasOwnRoute = function hasOwnRoute(name) {
    return this._recognizer.hasRoute(name);
  };

  Router.prototype.handleUnknownRoutes = function handleUnknownRoutes(config) {
    var _this6 = this;

    if (!config) {
      throw new Error('Invalid unknown route handler');
    }

    this.catchAllHandler = function (instruction) {
      return _this6._createRouteConfig(config, instruction).then(function (c) {
        instruction.config = c;
        return instruction;
      });
    };
  };

  Router.prototype.updateTitle = function updateTitle() {
    if (this.parent) {
      return this.parent.updateTitle();
    }

    if (this.currentInstruction) {
      this.currentInstruction._updateTitle();
    }
    return undefined;
  };

  Router.prototype.refreshNavigation = function refreshNavigation() {
    var nav = this.navigation;

    for (var i = 0, length = nav.length; i < length; i++) {
      var _current = nav[i];
      if (!_current.config.href) {
        _current.href = _createRootedPath(_current.relativeHref, this.baseUrl, this.history._hasPushState);
      } else {
        _current.href = _normalizeAbsolutePath(_current.config.href, this.history._hasPushState);
      }
    }
  };

  Router.prototype.useViewPortDefaults = function useViewPortDefaults(viewPortDefaults) {
    for (var viewPortName in viewPortDefaults) {
      var viewPortConfig = viewPortDefaults[viewPortName];
      this.viewPortDefaults[viewPortName] = {
        moduleId: viewPortConfig.moduleId
      };
    }
  };

  Router.prototype._refreshBaseUrl = function _refreshBaseUrl() {
    if (this.parent) {
      this.baseUrl = generateBaseUrl(this.parent, this.parent.currentInstruction);
    }
  };

  Router.prototype._createNavigationInstruction = function _createNavigationInstruction() {
    var url = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : '';
    var parentInstruction = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : null;

    var fragment = url;
    var queryString = '';

    var queryIndex = url.indexOf('?');
    if (queryIndex !== -1) {
      fragment = url.substr(0, queryIndex);
      queryString = url.substr(queryIndex + 1);
    }

    var results = this._recognizer.recognize(url);
    if (!results || !results.length) {
      results = this._childRecognizer.recognize(url);
    }

    var instructionInit = {
      fragment: fragment,
      queryString: queryString,
      config: null,
      parentInstruction: parentInstruction,
      previousInstruction: this.currentInstruction,
      router: this,
      options: {
        compareQueryParams: this.options.compareQueryParams
      }
    };

    var result = void 0;

    if (results && results.length) {
      var first = results[0];
      var _instruction = new NavigationInstruction(Object.assign({}, instructionInit, {
        params: first.params,
        queryParams: first.queryParams || results.queryParams,
        config: first.config || first.handler
      }));

      if (typeof first.handler === 'function') {
        result = evaluateNavigationStrategy(_instruction, first.handler, first);
      } else if (first.handler && typeof first.handler.navigationStrategy === 'function') {
        result = evaluateNavigationStrategy(_instruction, first.handler.navigationStrategy, first.handler);
      } else {
        result = Promise.resolve(_instruction);
      }
    } else if (this.catchAllHandler) {
      var _instruction2 = new NavigationInstruction(Object.assign({}, instructionInit, {
        params: { path: fragment },
        queryParams: results ? results.queryParams : {},
        config: null }));

      result = evaluateNavigationStrategy(_instruction2, this.catchAllHandler);
    } else if (this.parent) {
      var _router2 = this._parentCatchAllHandler(this.parent);

      if (_router2) {
        var newParentInstruction = this._findParentInstructionFromRouter(_router2, parentInstruction);

        var _instruction3 = new NavigationInstruction(Object.assign({}, instructionInit, {
          params: { path: fragment },
          queryParams: results ? results.queryParams : {},
          router: _router2,
          parentInstruction: newParentInstruction,
          parentCatchHandler: true,
          config: null }));

        result = evaluateNavigationStrategy(_instruction3, _router2.catchAllHandler);
      }
    }

    if (result && parentInstruction) {
      this.baseUrl = generateBaseUrl(this.parent, parentInstruction);
    }

    return result || Promise.reject(new Error('Route not found: ' + url));
  };

  Router.prototype._findParentInstructionFromRouter = function _findParentInstructionFromRouter(router, instruction) {
    if (instruction.router === router) {
      instruction.fragment = router.baseUrl;
      return instruction;
    } else if (instruction.parentInstruction) {
      return this._findParentInstructionFromRouter(router, instruction.parentInstruction);
    }
    return undefined;
  };

  Router.prototype._parentCatchAllHandler = function _parentCatchAllHandler(router) {
    if (router.catchAllHandler) {
      return router;
    } else if (router.parent) {
      return this._parentCatchAllHandler(router.parent);
    }
    return false;
  };

  Router.prototype._createRouteConfig = function _createRouteConfig(config, instruction) {
    var _this7 = this;

    return Promise.resolve(config).then(function (c) {
      if (typeof c === 'string') {
        return { moduleId: c };
      } else if (typeof c === 'function') {
        return c(instruction);
      }

      return c;
    }).then(function (c) {
      return typeof c === 'string' ? { moduleId: c } : c;
    }).then(function (c) {
      c.route = instruction.params.path;
      validateRouteConfig(c, _this7.routes);

      if (!c.navModel) {
        c.navModel = _this7.createNavModel(c);
      }

      return c;
    });
  };

  _createClass(Router, [{
    key: 'isRoot',
    get: function get() {
      return !this.parent;
    }
  }]);

  return Router;
}();

function generateBaseUrl(router, instruction) {
  return '' + (router.baseUrl || '') + (instruction.getBaseUrl() || '');
}

function validateRouteConfig(config, routes) {
  if ((typeof config === 'undefined' ? 'undefined' : _typeof(config)) !== 'object') {
    throw new Error('Invalid Route Config');
  }

  if (typeof config.route !== 'string') {
    var _name2 = config.name || '(no name)';
    throw new Error('Invalid Route Config for "' + _name2 + '": You must specify a "route:" pattern.');
  }

  if (!('redirect' in config || config.moduleId || config.navigationStrategy || config.viewPorts)) {
    throw new Error('Invalid Route Config for "' + config.route + '": You must specify a "moduleId:", "redirect:", "navigationStrategy:", or "viewPorts:".');
  }
}

function evaluateNavigationStrategy(instruction, evaluator, context) {
  return Promise.resolve(evaluator.call(context, instruction)).then(function () {
    if (!('viewPorts' in instruction.config)) {
      instruction.config.viewPorts = {
        'default': {
          moduleId: instruction.config.moduleId
        }
      };
    }

    return instruction;
  });
}

var CanDeactivatePreviousStep = exports.CanDeactivatePreviousStep = function () {
  function CanDeactivatePreviousStep() {
    
  }

  CanDeactivatePreviousStep.prototype.run = function run(navigationInstruction, next) {
    return processDeactivatable(navigationInstruction, 'canDeactivate', next);
  };

  return CanDeactivatePreviousStep;
}();

var CanActivateNextStep = exports.CanActivateNextStep = function () {
  function CanActivateNextStep() {
    
  }

  CanActivateNextStep.prototype.run = function run(navigationInstruction, next) {
    return processActivatable(navigationInstruction, 'canActivate', next);
  };

  return CanActivateNextStep;
}();

var DeactivatePreviousStep = exports.DeactivatePreviousStep = function () {
  function DeactivatePreviousStep() {
    
  }

  DeactivatePreviousStep.prototype.run = function run(navigationInstruction, next) {
    return processDeactivatable(navigationInstruction, 'deactivate', next, true);
  };

  return DeactivatePreviousStep;
}();

var ActivateNextStep = exports.ActivateNextStep = function () {
  function ActivateNextStep() {
    
  }

  ActivateNextStep.prototype.run = function run(navigationInstruction, next) {
    return processActivatable(navigationInstruction, 'activate', next, true);
  };

  return ActivateNextStep;
}();

function processDeactivatable(navigationInstruction, callbackName, next, ignoreResult) {
  var plan = navigationInstruction.plan;
  var infos = findDeactivatable(plan, callbackName);
  var i = infos.length;

  function inspect(val) {
    if (ignoreResult || shouldContinue(val)) {
      return iterate();
    }

    return next.cancel(val);
  }

  function iterate() {
    if (i--) {
      try {
        var viewModel = infos[i];
        var _result = viewModel[callbackName](navigationInstruction);
        return processPotential(_result, inspect, next.cancel);
      } catch (error) {
        return next.cancel(error);
      }
    }

    navigationInstruction.router.couldDeactivate = true;

    return next();
  }

  return iterate();
}

function findDeactivatable(plan, callbackName) {
  var list = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : [];

  for (var viewPortName in plan) {
    var _viewPortPlan = plan[viewPortName];
    var prevComponent = _viewPortPlan.prevComponent;

    if ((_viewPortPlan.strategy === activationStrategy.invokeLifecycle || _viewPortPlan.strategy === activationStrategy.replace) && prevComponent) {
      var viewModel = prevComponent.viewModel;

      if (callbackName in viewModel) {
        list.push(viewModel);
      }
    }

    if (_viewPortPlan.strategy === activationStrategy.replace && prevComponent) {
      addPreviousDeactivatable(prevComponent, callbackName, list);
    } else if (_viewPortPlan.childNavigationInstruction) {
      findDeactivatable(_viewPortPlan.childNavigationInstruction.plan, callbackName, list);
    }
  }

  return list;
}

function addPreviousDeactivatable(component, callbackName, list) {
  var childRouter = component.childRouter;

  if (childRouter && childRouter.currentInstruction) {
    var viewPortInstructions = childRouter.currentInstruction.viewPortInstructions;

    for (var viewPortName in viewPortInstructions) {
      var _viewPortInstruction2 = viewPortInstructions[viewPortName];
      var prevComponent = _viewPortInstruction2.component;
      var prevViewModel = prevComponent.viewModel;

      if (callbackName in prevViewModel) {
        list.push(prevViewModel);
      }

      addPreviousDeactivatable(prevComponent, callbackName, list);
    }
  }
}

function processActivatable(navigationInstruction, callbackName, next, ignoreResult) {
  var infos = findActivatable(navigationInstruction, callbackName);
  var length = infos.length;
  var i = -1;

  function inspect(val, router) {
    if (ignoreResult || shouldContinue(val, router)) {
      return iterate();
    }

    return next.cancel(val);
  }

  function iterate() {
    i++;

    if (i < length) {
      try {
        var _current2$viewModel;

        var _current2 = infos[i];
        var _result2 = (_current2$viewModel = _current2.viewModel)[callbackName].apply(_current2$viewModel, _current2.lifecycleArgs);
        return processPotential(_result2, function (val) {
          return inspect(val, _current2.router);
        }, next.cancel);
      } catch (error) {
        return next.cancel(error);
      }
    }

    return next();
  }

  return iterate();
}

function findActivatable(navigationInstruction, callbackName) {
  var list = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : [];
  var router = arguments[3];

  var plan = navigationInstruction.plan;

  Object.keys(plan).filter(function (viewPortName) {
    var viewPortPlan = plan[viewPortName];
    var viewPortInstruction = navigationInstruction.viewPortInstructions[viewPortName];
    var viewModel = viewPortInstruction.component.viewModel;

    if ((viewPortPlan.strategy === activationStrategy.invokeLifecycle || viewPortPlan.strategy === activationStrategy.replace) && callbackName in viewModel) {
      list.push({
        viewModel: viewModel,
        lifecycleArgs: viewPortInstruction.lifecycleArgs,
        router: router
      });
    }

    if (viewPortPlan.childNavigationInstruction) {
      findActivatable(viewPortPlan.childNavigationInstruction, callbackName, list, viewPortInstruction.component.childRouter || router);
    }
  });

  return list;
}

function shouldContinue(output, router) {
  if (output instanceof Error) {
    return false;
  }

  if (isNavigationCommand(output)) {
    if (typeof output.setRouter === 'function') {
      output.setRouter(router);
    }

    return !!output.shouldContinueProcessing;
  }

  if (output === undefined) {
    return true;
  }

  return output;
}

var SafeSubscription = function () {
  function SafeSubscription(subscriptionFunc) {
    

    this._subscribed = true;
    this._subscription = subscriptionFunc(this);

    if (!this._subscribed) this.unsubscribe();
  }

  SafeSubscription.prototype.unsubscribe = function unsubscribe() {
    if (this._subscribed && this._subscription) this._subscription.unsubscribe();

    this._subscribed = false;
  };

  _createClass(SafeSubscription, [{
    key: 'subscribed',
    get: function get() {
      return this._subscribed;
    }
  }]);

  return SafeSubscription;
}();

function processPotential(obj, resolve, reject) {
  if (obj && typeof obj.then === 'function') {
    return Promise.resolve(obj).then(resolve).catch(reject);
  }

  if (obj && typeof obj.subscribe === 'function') {
    var obs = obj;
    return new SafeSubscription(function (sub) {
      return obs.subscribe({
        next: function next() {
          if (sub.subscribed) {
            sub.unsubscribe();
            resolve(obj);
          }
        },
        error: function error(_error) {
          if (sub.subscribed) {
            sub.unsubscribe();
            reject(_error);
          }
        },
        complete: function complete() {
          if (sub.subscribed) {
            sub.unsubscribe();
            resolve(obj);
          }
        }
      });
    });
  }

  try {
    return resolve(obj);
  } catch (error) {
    return reject(error);
  }
}

var RouteLoader = exports.RouteLoader = function () {
  function RouteLoader() {
    
  }

  RouteLoader.prototype.loadRoute = function loadRoute(router, config, navigationInstruction) {
    throw Error('Route loaders must implement "loadRoute(router, config, navigationInstruction)".');
  };

  return RouteLoader;
}();

var LoadRouteStep = exports.LoadRouteStep = function () {
  LoadRouteStep.inject = function inject() {
    return [RouteLoader];
  };

  function LoadRouteStep(routeLoader) {
    

    this.routeLoader = routeLoader;
  }

  LoadRouteStep.prototype.run = function run(navigationInstruction, next) {
    return loadNewRoute(this.routeLoader, navigationInstruction).then(next).catch(next.cancel);
  };

  return LoadRouteStep;
}();

function loadNewRoute(routeLoader, navigationInstruction) {
  var toLoad = determineWhatToLoad(navigationInstruction);
  var loadPromises = toLoad.map(function (current) {
    return loadRoute(routeLoader, current.navigationInstruction, current.viewPortPlan);
  });

  return Promise.all(loadPromises);
}

function determineWhatToLoad(navigationInstruction) {
  var toLoad = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : [];

  var plan = navigationInstruction.plan;

  for (var viewPortName in plan) {
    var _viewPortPlan2 = plan[viewPortName];

    if (_viewPortPlan2.strategy === activationStrategy.replace) {
      toLoad.push({ viewPortPlan: _viewPortPlan2, navigationInstruction: navigationInstruction });

      if (_viewPortPlan2.childNavigationInstruction) {
        determineWhatToLoad(_viewPortPlan2.childNavigationInstruction, toLoad);
      }
    } else {
      var _viewPortInstruction3 = navigationInstruction.addViewPortInstruction(viewPortName, _viewPortPlan2.strategy, _viewPortPlan2.prevModuleId, _viewPortPlan2.prevComponent);

      if (_viewPortPlan2.childNavigationInstruction) {
        _viewPortInstruction3.childNavigationInstruction = _viewPortPlan2.childNavigationInstruction;
        determineWhatToLoad(_viewPortPlan2.childNavigationInstruction, toLoad);
      }
    }
  }

  return toLoad;
}

function loadRoute(routeLoader, navigationInstruction, viewPortPlan) {
  var moduleId = viewPortPlan.config ? viewPortPlan.config.moduleId : null;

  return loadComponent(routeLoader, navigationInstruction, viewPortPlan.config).then(function (component) {
    var viewPortInstruction = navigationInstruction.addViewPortInstruction(viewPortPlan.name, viewPortPlan.strategy, moduleId, component);

    var childRouter = component.childRouter;
    if (childRouter) {
      var path = navigationInstruction.getWildcardPath();

      return childRouter._createNavigationInstruction(path, navigationInstruction).then(function (childInstruction) {
        viewPortPlan.childNavigationInstruction = childInstruction;

        return _buildNavigationPlan(childInstruction).then(function (childPlan) {
          if (childPlan instanceof Redirect) {
            return Promise.reject(childPlan);
          }
          childInstruction.plan = childPlan;
          viewPortInstruction.childNavigationInstruction = childInstruction;

          return loadNewRoute(routeLoader, childInstruction);
        });
      });
    }

    return undefined;
  });
}

function loadComponent(routeLoader, navigationInstruction, config) {
  var router = navigationInstruction.router;
  var lifecycleArgs = navigationInstruction.lifecycleArgs;

  return routeLoader.loadRoute(router, config, navigationInstruction).then(function (component) {
    var viewModel = component.viewModel,
        childContainer = component.childContainer;

    component.router = router;
    component.config = config;

    if ('configureRouter' in viewModel) {
      var childRouter = childContainer.getChildRouter();
      component.childRouter = childRouter;

      return childRouter.configure(function (c) {
        return viewModel.configureRouter.apply(viewModel, [c, childRouter].concat(lifecycleArgs));
      }).then(function () {
        return component;
      });
    }

    return component;
  });
}

var PipelineSlot = function () {
  function PipelineSlot(container, name, alias) {
    

    this.steps = [];

    this.container = container;
    this.slotName = name;
    this.slotAlias = alias;
  }

  PipelineSlot.prototype.getSteps = function getSteps() {
    var _this8 = this;

    return this.steps.map(function (x) {
      return _this8.container.get(x);
    });
  };

  return PipelineSlot;
}();

var PipelineProvider = exports.PipelineProvider = function () {
  PipelineProvider.inject = function inject() {
    return [_aureliaDependencyInjection.Container];
  };

  function PipelineProvider(container) {
    

    this.container = container;
    this.steps = [BuildNavigationPlanStep, CanDeactivatePreviousStep, LoadRouteStep, this._createPipelineSlot('authorize'), CanActivateNextStep, this._createPipelineSlot('preActivate', 'modelbind'), DeactivatePreviousStep, ActivateNextStep, this._createPipelineSlot('preRender', 'precommit'), CommitChangesStep, this._createPipelineSlot('postRender', 'postcomplete')];
  }

  PipelineProvider.prototype.createPipeline = function createPipeline() {
    var _this9 = this;

    var useCanDeactivateStep = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : true;

    var pipeline = new Pipeline();
    this.steps.forEach(function (step) {
      if (useCanDeactivateStep || step !== CanDeactivatePreviousStep) {
        pipeline.addStep(_this9.container.get(step));
      }
    });
    return pipeline;
  };

  PipelineProvider.prototype._findStep = function _findStep(name) {
    return this.steps.find(function (x) {
      return x.slotName === name || x.slotAlias === name;
    });
  };

  PipelineProvider.prototype.addStep = function addStep(name, step) {
    var found = this._findStep(name);
    if (found) {
      if (!found.steps.includes(step)) {
        found.steps.push(step);
      }
    } else {
      throw new Error('Invalid pipeline slot name: ' + name + '.');
    }
  };

  PipelineProvider.prototype.removeStep = function removeStep(name, step) {
    var slot = this._findStep(name);
    if (slot) {
      slot.steps.splice(slot.steps.indexOf(step), 1);
    }
  };

  PipelineProvider.prototype._clearSteps = function _clearSteps() {
    var name = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : '';

    var slot = this._findStep(name);
    if (slot) {
      slot.steps = [];
    }
  };

  PipelineProvider.prototype.reset = function reset() {
    this._clearSteps('authorize');
    this._clearSteps('preActivate');
    this._clearSteps('preRender');
    this._clearSteps('postRender');
  };

  PipelineProvider.prototype._createPipelineSlot = function _createPipelineSlot(name, alias) {
    return new PipelineSlot(this.container, name, alias);
  };

  return PipelineProvider;
}();

var logger = LogManager.getLogger('app-router');

var AppRouter = exports.AppRouter = function (_Router) {
  _inherits(AppRouter, _Router);

  AppRouter.inject = function inject() {
    return [_aureliaDependencyInjection.Container, _aureliaHistory.History, PipelineProvider, _aureliaEventAggregator.EventAggregator];
  };

  function AppRouter(container, history, pipelineProvider, events) {
    

    var _this10 = _possibleConstructorReturn(this, _Router.call(this, container, history));

    _this10.pipelineProvider = pipelineProvider;
    _this10.events = events;
    return _this10;
  }

  AppRouter.prototype.reset = function reset() {
    _Router.prototype.reset.call(this);
    this.maxInstructionCount = 10;
    if (!this._queue) {
      this._queue = [];
    } else {
      this._queue.length = 0;
    }
  };

  AppRouter.prototype.loadUrl = function loadUrl(url) {
    var _this11 = this;

    return this._createNavigationInstruction(url).then(function (instruction) {
      return _this11._queueInstruction(instruction);
    }).catch(function (error) {
      logger.error(error);
      restorePreviousLocation(_this11);
    });
  };

  AppRouter.prototype.registerViewPort = function registerViewPort(viewPort, name) {
    var _this12 = this;

    _Router.prototype.registerViewPort.call(this, viewPort, name);

    if (!this.isActive) {
      var viewModel = this._findViewModel(viewPort);
      if ('configureRouter' in viewModel) {
        if (!this.isConfigured) {
          var resolveConfiguredPromise = this._resolveConfiguredPromise;
          this._resolveConfiguredPromise = function () {};
          return this.configure(function (config) {
            return viewModel.configureRouter(config, _this12);
          }).then(function () {
            _this12.activate();
            resolveConfiguredPromise();
          });
        }
      } else {
        this.activate();
      }
    } else {
      this._dequeueInstruction();
    }

    return Promise.resolve();
  };

  AppRouter.prototype.activate = function activate(options) {
    if (this.isActive) {
      return;
    }

    this.isActive = true;
    this.options = Object.assign({ routeHandler: this.loadUrl.bind(this) }, this.options, options);
    this.history.activate(this.options);
    this._dequeueInstruction();
  };

  AppRouter.prototype.deactivate = function deactivate() {
    this.isActive = false;
    this.history.deactivate();
  };

  AppRouter.prototype._queueInstruction = function _queueInstruction(instruction) {
    var _this13 = this;

    return new Promise(function (resolve) {
      instruction.resolve = resolve;
      _this13._queue.unshift(instruction);
      _this13._dequeueInstruction();
    });
  };

  AppRouter.prototype._dequeueInstruction = function _dequeueInstruction() {
    var _this14 = this;

    var instructionCount = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 0;

    return Promise.resolve().then(function () {
      if (_this14.isNavigating && !instructionCount) {
        return undefined;
      }

      var instruction = _this14._queue.shift();
      _this14._queue.length = 0;

      if (!instruction) {
        return undefined;
      }

      _this14.isNavigating = true;

      var navtracker = _this14.history.getState('NavigationTracker');
      if (!navtracker && !_this14.currentNavigationTracker) {
        _this14.isNavigatingFirst = true;
        _this14.isNavigatingNew = true;
      } else if (!navtracker) {
        _this14.isNavigatingNew = true;
      } else if (!_this14.currentNavigationTracker) {
        _this14.isNavigatingRefresh = true;
      } else if (_this14.currentNavigationTracker < navtracker) {
        _this14.isNavigatingForward = true;
      } else if (_this14.currentNavigationTracker > navtracker) {
        _this14.isNavigatingBack = true;
      }if (!navtracker) {
        navtracker = Date.now();
        _this14.history.setState('NavigationTracker', navtracker);
      }
      _this14.currentNavigationTracker = navtracker;

      instruction.previousInstruction = _this14.currentInstruction;

      if (!instructionCount) {
        _this14.events.publish('router:navigation:processing', { instruction: instruction });
      } else if (instructionCount === _this14.maxInstructionCount - 1) {
        logger.error(instructionCount + 1 + ' navigation instructions have been attempted without success. Restoring last known good location.');
        restorePreviousLocation(_this14);
        return _this14._dequeueInstruction(instructionCount + 1);
      } else if (instructionCount > _this14.maxInstructionCount) {
        throw new Error('Maximum navigation attempts exceeded. Giving up.');
      }

      var pipeline = _this14.pipelineProvider.createPipeline(!_this14.couldDeactivate);

      return pipeline.run(instruction).then(function (result) {
        return processResult(instruction, result, instructionCount, _this14);
      }).catch(function (error) {
        return { output: error instanceof Error ? error : new Error(error) };
      }).then(function (result) {
        return resolveInstruction(instruction, result, !!instructionCount, _this14);
      });
    });
  };

  AppRouter.prototype._findViewModel = function _findViewModel(viewPort) {
    if (this.container.viewModel) {
      return this.container.viewModel;
    }

    if (viewPort.container) {
      var container = viewPort.container;

      while (container) {
        if (container.viewModel) {
          this.container.viewModel = container.viewModel;
          return container.viewModel;
        }

        container = container.parent;
      }
    }

    return undefined;
  };

  return AppRouter;
}(Router);

function processResult(instruction, result, instructionCount, router) {
  if (!(result && 'completed' in result && 'output' in result)) {
    result = result || {};
    result.output = new Error('Expected router pipeline to return a navigation result, but got [' + JSON.stringify(result) + '] instead.');
  }

  var finalResult = null;
  var navigationCommandResult = null;
  if (isNavigationCommand(result.output)) {
    navigationCommandResult = result.output.navigate(router);
  } else {
    finalResult = result;

    if (!result.completed) {
      if (result.output instanceof Error) {
        logger.error(result.output);
      }

      restorePreviousLocation(router);
    }
  }

  return Promise.resolve(navigationCommandResult).then(function (_) {
    return router._dequeueInstruction(instructionCount + 1);
  }).then(function (innerResult) {
    return finalResult || innerResult || result;
  });
}

function resolveInstruction(instruction, result, isInnerInstruction, router) {
  instruction.resolve(result);

  var eventArgs = { instruction: instruction, result: result };
  if (!isInnerInstruction) {
    router.isNavigating = false;
    router.isExplicitNavigation = false;
    router.isExplicitNavigationBack = false;
    router.isNavigatingFirst = false;
    router.isNavigatingNew = false;
    router.isNavigatingRefresh = false;
    router.isNavigatingForward = false;
    router.isNavigatingBack = false;
    router.couldDeactivate = false;

    var eventName = void 0;

    if (result.output instanceof Error) {
      eventName = 'error';
    } else if (!result.completed) {
      eventName = 'canceled';
    } else {
      var _queryString = instruction.queryString ? '?' + instruction.queryString : '';
      router.history.previousLocation = instruction.fragment + _queryString;
      eventName = 'success';
    }

    router.events.publish('router:navigation:' + eventName, eventArgs);
    router.events.publish('router:navigation:complete', eventArgs);
  } else {
    router.events.publish('router:navigation:child:complete', eventArgs);
  }

  return result;
}

function restorePreviousLocation(router) {
  var previousLocation = router.history.previousLocation;
  if (previousLocation) {
    router.navigate(router.history.previousLocation, { trigger: false, replace: true });
  } else if (router.fallbackRoute) {
    router.navigate(router.fallbackRoute, { trigger: true, replace: true });
  } else {
    logger.error('Router navigation failed, and no previous location or fallbackRoute could be restored.');
  }
}
/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__("bluebird")))

/***/ },

/***/ "aurelia-templating-binding":
/***/ function(module, exports, __webpack_require__) {

"use strict";
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0_aurelia_logging__ = __webpack_require__(58);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0_aurelia_logging___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_0_aurelia_logging__);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1_aurelia_binding__ = __webpack_require__(24);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2_aurelia_templating__ = __webpack_require__(20);
/* harmony export (binding) */ __webpack_require__.d(exports, "AttributeMap", function() { return AttributeMap; });
/* harmony export (binding) */ __webpack_require__.d(exports, "InterpolationBindingExpression", function() { return InterpolationBindingExpression; });
/* harmony export (binding) */ __webpack_require__.d(exports, "InterpolationBinding", function() { return InterpolationBinding; });
/* harmony export (binding) */ __webpack_require__.d(exports, "ChildInterpolationBinding", function() { return ChildInterpolationBinding; });
/* harmony export (binding) */ __webpack_require__.d(exports, "LetExpression", function() { return LetExpression; });
/* harmony export (binding) */ __webpack_require__.d(exports, "LetBinding", function() { return LetBinding; });
/* harmony export (binding) */ __webpack_require__.d(exports, "LetInterpolationBindingExpression", function() { return LetInterpolationBindingExpression; });
/* harmony export (binding) */ __webpack_require__.d(exports, "LetInterpolationBinding", function() { return LetInterpolationBinding; });
/* harmony export (binding) */ __webpack_require__.d(exports, "SyntaxInterpreter", function() { return SyntaxInterpreter; });
/* harmony export (binding) */ __webpack_require__.d(exports, "TemplatingBindingLanguage", function() { return TemplatingBindingLanguage; });
/* harmony export (immutable) */ exports["configure"] = configure;
var _class, _temp, _dec, _class2, _dec2, _class3, _class4, _temp2, _class5, _temp3;





let AttributeMap = (_temp = _class = class AttributeMap {

  constructor(svg) {
    this.elements = Object.create(null);
    this.allElements = Object.create(null);

    this.svg = svg;

    this.registerUniversal('accesskey', 'accessKey');
    this.registerUniversal('contenteditable', 'contentEditable');
    this.registerUniversal('tabindex', 'tabIndex');
    this.registerUniversal('textcontent', 'textContent');
    this.registerUniversal('innerhtml', 'innerHTML');
    this.registerUniversal('scrolltop', 'scrollTop');
    this.registerUniversal('scrollleft', 'scrollLeft');
    this.registerUniversal('readonly', 'readOnly');

    this.register('label', 'for', 'htmlFor');

    this.register('img', 'usemap', 'useMap');

    this.register('input', 'maxlength', 'maxLength');
    this.register('input', 'minlength', 'minLength');
    this.register('input', 'formaction', 'formAction');
    this.register('input', 'formenctype', 'formEncType');
    this.register('input', 'formmethod', 'formMethod');
    this.register('input', 'formnovalidate', 'formNoValidate');
    this.register('input', 'formtarget', 'formTarget');

    this.register('textarea', 'maxlength', 'maxLength');

    this.register('td', 'rowspan', 'rowSpan');
    this.register('td', 'colspan', 'colSpan');
    this.register('th', 'rowspan', 'rowSpan');
    this.register('th', 'colspan', 'colSpan');
  }

  register(elementName, attributeName, propertyName) {
    elementName = elementName.toLowerCase();
    attributeName = attributeName.toLowerCase();
    const element = this.elements[elementName] = this.elements[elementName] || Object.create(null);
    element[attributeName] = propertyName;
  }

  registerUniversal(attributeName, propertyName) {
    attributeName = attributeName.toLowerCase();
    this.allElements[attributeName] = propertyName;
  }

  map(elementName, attributeName) {
    if (this.svg.isStandardSvgAttribute(elementName, attributeName)) {
      return attributeName;
    }
    elementName = elementName.toLowerCase();
    attributeName = attributeName.toLowerCase();
    const element = this.elements[elementName];
    if (element !== undefined && attributeName in element) {
      return element[attributeName];
    }
    if (attributeName in this.allElements) {
      return this.allElements[attributeName];
    }

    if (/(?:^data-)|(?:^aria-)|:/.test(attributeName)) {
      return attributeName;
    }
    return __webpack_require__.i(__WEBPACK_IMPORTED_MODULE_1_aurelia_binding__["camelCase"])(attributeName);
  }
}, _class.inject = [__WEBPACK_IMPORTED_MODULE_1_aurelia_binding__["SVGAnalyzer"]], _temp);

let InterpolationBindingExpression = class InterpolationBindingExpression {
  constructor(observerLocator, targetProperty, parts, mode, lookupFunctions, attribute) {
    this.observerLocator = observerLocator;
    this.targetProperty = targetProperty;
    this.parts = parts;
    this.mode = mode;
    this.lookupFunctions = lookupFunctions;
    this.attribute = this.attrToRemove = attribute;
    this.discrete = false;
  }

  createBinding(target) {
    if (this.parts.length === 3) {
      return new ChildInterpolationBinding(target, this.observerLocator, this.parts[1], this.mode, this.lookupFunctions, this.targetProperty, this.parts[0], this.parts[2]);
    }
    return new InterpolationBinding(this.observerLocator, this.parts, target, this.targetProperty, this.mode, this.lookupFunctions);
  }
};

function validateTarget(target, propertyName) {
  if (propertyName === 'style') {
    __WEBPACK_IMPORTED_MODULE_0_aurelia_logging__["getLogger"]('templating-binding').info('Internet Explorer does not support interpolation in "style" attributes.  Use the style attribute\'s alias, "css" instead.');
  } else if (target.parentElement && target.parentElement.nodeName === 'TEXTAREA' && propertyName === 'textContent') {
    throw new Error('Interpolation binding cannot be used in the content of a textarea element.  Use <textarea value.bind="expression"></textarea> instead.');
  }
}

let InterpolationBinding = class InterpolationBinding {
  constructor(observerLocator, parts, target, targetProperty, mode, lookupFunctions) {
    validateTarget(target, targetProperty);
    this.observerLocator = observerLocator;
    this.parts = parts;
    this.target = target;
    this.targetProperty = targetProperty;
    this.targetAccessor = observerLocator.getAccessor(target, targetProperty);
    this.mode = mode;
    this.lookupFunctions = lookupFunctions;
  }

  interpolate() {
    if (this.isBound) {
      let value = '';
      let parts = this.parts;
      for (let i = 0, ii = parts.length; i < ii; i++) {
        value += i % 2 === 0 ? parts[i] : this[`childBinding${i}`].value;
      }
      this.targetAccessor.setValue(value, this.target, this.targetProperty);
    }
  }

  updateOneTimeBindings() {
    for (let i = 1, ii = this.parts.length; i < ii; i += 2) {
      let child = this[`childBinding${i}`];
      if (child.mode === __WEBPACK_IMPORTED_MODULE_1_aurelia_binding__["bindingMode"].oneTime) {
        child.call();
      }
    }
  }

  bind(source) {
    if (this.isBound) {
      if (this.source === source) {
        return;
      }
      this.unbind();
    }
    this.source = source;

    let parts = this.parts;
    for (let i = 1, ii = parts.length; i < ii; i += 2) {
      let binding = new ChildInterpolationBinding(this, this.observerLocator, parts[i], this.mode, this.lookupFunctions);
      binding.bind(source);
      this[`childBinding${i}`] = binding;
    }

    this.isBound = true;
    this.interpolate();
  }

  unbind() {
    if (!this.isBound) {
      return;
    }
    this.isBound = false;
    this.source = null;
    let parts = this.parts;
    for (let i = 1, ii = parts.length; i < ii; i += 2) {
      let name = `childBinding${i}`;
      this[name].unbind();
    }
  }
};

let ChildInterpolationBinding = (_dec = __webpack_require__.i(__WEBPACK_IMPORTED_MODULE_1_aurelia_binding__["connectable"])(), _dec(_class2 = class ChildInterpolationBinding {
  constructor(target, observerLocator, sourceExpression, mode, lookupFunctions, targetProperty, left, right) {
    if (target instanceof InterpolationBinding) {
      this.parent = target;
    } else {
      validateTarget(target, targetProperty);
      this.target = target;
      this.targetProperty = targetProperty;
      this.targetAccessor = observerLocator.getAccessor(target, targetProperty);
    }
    this.observerLocator = observerLocator;
    this.sourceExpression = sourceExpression;
    this.mode = mode;
    this.lookupFunctions = lookupFunctions;
    this.left = left;
    this.right = right;
  }

  updateTarget(value) {
    value = value === null || value === undefined ? '' : value.toString();
    if (value !== this.value) {
      this.value = value;
      if (this.parent) {
        this.parent.interpolate();
      } else {
        this.targetAccessor.setValue(this.left + value + this.right, this.target, this.targetProperty);
      }
    }
  }

  call() {
    if (!this.isBound) {
      return;
    }

    this.rawValue = this.sourceExpression.evaluate(this.source, this.lookupFunctions);
    this.updateTarget(this.rawValue);

    if (this.mode !== __WEBPACK_IMPORTED_MODULE_1_aurelia_binding__["bindingMode"].oneTime) {
      this._version++;
      this.sourceExpression.connect(this, this.source);
      if (this.rawValue instanceof Array) {
        this.observeArray(this.rawValue);
      }
      this.unobserve(false);
    }
  }

  bind(source) {
    if (this.isBound) {
      if (this.source === source) {
        return;
      }
      this.unbind();
    }
    this.isBound = true;
    this.source = source;

    let sourceExpression = this.sourceExpression;
    if (sourceExpression.bind) {
      sourceExpression.bind(this, source, this.lookupFunctions);
    }

    this.rawValue = sourceExpression.evaluate(source, this.lookupFunctions);
    this.updateTarget(this.rawValue);

    if (this.mode === __WEBPACK_IMPORTED_MODULE_1_aurelia_binding__["bindingMode"].oneWay) {
      __webpack_require__.i(__WEBPACK_IMPORTED_MODULE_1_aurelia_binding__["enqueueBindingConnect"])(this);
    }
  }

  unbind() {
    if (!this.isBound) {
      return;
    }
    this.isBound = false;
    let sourceExpression = this.sourceExpression;
    if (sourceExpression.unbind) {
      sourceExpression.unbind(this, this.source);
    }
    this.source = null;
    this.value = null;
    this.rawValue = null;
    this.unobserve(true);
  }

  connect(evaluate) {
    if (!this.isBound) {
      return;
    }
    if (evaluate) {
      this.rawValue = this.sourceExpression.evaluate(this.source, this.lookupFunctions);
      this.updateTarget(this.rawValue);
    }
    this.sourceExpression.connect(this, this.source);
    if (this.rawValue instanceof Array) {
      this.observeArray(this.rawValue);
    }
  }
}) || _class2);

let LetExpression = class LetExpression {
  constructor(observerLocator, targetProperty, sourceExpression, lookupFunctions, toBindingContext) {
    this.observerLocator = observerLocator;
    this.sourceExpression = sourceExpression;
    this.targetProperty = targetProperty;
    this.lookupFunctions = lookupFunctions;
    this.toBindingContext = toBindingContext;
  }

  createBinding() {
    return new LetBinding(this.observerLocator, this.sourceExpression, this.targetProperty, this.lookupFunctions, this.toBindingContext);
  }
};

let LetBinding = (_dec2 = __webpack_require__.i(__WEBPACK_IMPORTED_MODULE_1_aurelia_binding__["connectable"])(), _dec2(_class3 = class LetBinding {
  constructor(observerLocator, sourceExpression, targetProperty, lookupFunctions, toBindingContext) {
    this.observerLocator = observerLocator;
    this.sourceExpression = sourceExpression;
    this.targetProperty = targetProperty;
    this.lookupFunctions = lookupFunctions;
    this.source = null;
    this.target = null;
    this.toBindingContext = toBindingContext;
  }

  updateTarget() {
    const value = this.sourceExpression.evaluate(this.source, this.lookupFunctions);
    this.target[this.targetProperty] = value;
  }

  call(context) {
    if (!this.isBound) {
      return;
    }
    if (context === __WEBPACK_IMPORTED_MODULE_1_aurelia_binding__["sourceContext"]) {
      this.updateTarget();
      return;
    }
    throw new Error(`Unexpected call context ${context}`);
  }

  bind(source) {
    if (this.isBound) {
      if (this.source === source) {
        return;
      }
      this.unbind();
    }

    this.isBound = true;
    this.source = source;
    this.target = this.toBindingContext ? source.bindingContext : source.overrideContext;

    if (this.sourceExpression.bind) {
      this.sourceExpression.bind(this, source, this.lookupFunctions);
    }

    __webpack_require__.i(__WEBPACK_IMPORTED_MODULE_1_aurelia_binding__["enqueueBindingConnect"])(this);
  }

  unbind() {
    if (!this.isBound) {
      return;
    }
    this.isBound = false;
    if (this.sourceExpression.unbind) {
      this.sourceExpression.unbind(this, this.source);
    }
    this.source = null;
    this.target = null;
    this.unobserve(true);
  }

  connect() {
    if (!this.isBound) {
      return;
    }
    this.updateTarget();
    this.sourceExpression.connect(this, this.source);
  }
}) || _class3);

let LetInterpolationBindingExpression = class LetInterpolationBindingExpression {
  constructor(observerLocator, targetProperty, parts, lookupFunctions, toBindingContext) {
    this.observerLocator = observerLocator;
    this.targetProperty = targetProperty;
    this.parts = parts;
    this.lookupFunctions = lookupFunctions;
    this.toBindingContext = toBindingContext;
  }

  createBinding() {
    return new LetInterpolationBinding(this.observerLocator, this.targetProperty, this.parts, this.lookupFunctions, this.toBindingContext);
  }
};

let LetInterpolationBinding = class LetInterpolationBinding {
  constructor(observerLocator, targetProperty, parts, lookupFunctions, toBindingContext) {
    this.observerLocator = observerLocator;
    this.parts = parts;
    this.targetProperty = targetProperty;
    this.lookupFunctions = lookupFunctions;
    this.toBindingContext = toBindingContext;
    this.target = null;
  }

  bind(source) {
    if (this.isBound) {
      if (this.source === source) {
        return;
      }
      this.unbind();
    }

    this.isBound = true;
    this.source = source;
    this.target = this.toBindingContext ? source.bindingContext : source.overrideContext;

    this.interpolationBinding = this.createInterpolationBinding();
    this.interpolationBinding.bind(source);
  }

  unbind() {
    if (!this.isBound) {
      return;
    }
    this.isBound = false;
    this.source = null;
    this.target = null;
    this.interpolationBinding.unbind();
    this.interpolationBinding = null;
  }

  createInterpolationBinding() {
    if (this.parts.length === 3) {
      return new ChildInterpolationBinding(this.target, this.observerLocator, this.parts[1], __WEBPACK_IMPORTED_MODULE_1_aurelia_binding__["bindingMode"].oneWay, this.lookupFunctions, this.targetProperty, this.parts[0], this.parts[2]);
    }
    return new InterpolationBinding(this.observerLocator, this.parts, this.target, this.targetProperty, __WEBPACK_IMPORTED_MODULE_1_aurelia_binding__["bindingMode"].oneWay, this.lookupFunctions);
  }
};

let SyntaxInterpreter = (_temp2 = _class4 = class SyntaxInterpreter {

  constructor(parser, observerLocator, eventManager, attributeMap) {
    this.parser = parser;
    this.observerLocator = observerLocator;
    this.eventManager = eventManager;
    this.attributeMap = attributeMap;
  }

  interpret(resources, element, info, existingInstruction, context) {
    if (info.command in this) {
      return this[info.command](resources, element, info, existingInstruction, context);
    }

    return this.handleUnknownCommand(resources, element, info, existingInstruction, context);
  }

  handleUnknownCommand(resources, element, info, existingInstruction, context) {
    __WEBPACK_IMPORTED_MODULE_0_aurelia_logging__["getLogger"]('templating-binding').warn('Unknown binding command.', info);
    return existingInstruction;
  }

  determineDefaultBindingMode(element, attrName, context) {
    let tagName = element.tagName.toLowerCase();

    if (tagName === 'input' && (attrName === 'value' || attrName === 'files') && element.type !== 'checkbox' && element.type !== 'radio' || tagName === 'input' && attrName === 'checked' && (element.type === 'checkbox' || element.type === 'radio') || (tagName === 'textarea' || tagName === 'select') && attrName === 'value' || (attrName === 'textcontent' || attrName === 'innerhtml') && element.contentEditable === 'true' || attrName === 'scrolltop' || attrName === 'scrollleft') {
      return __WEBPACK_IMPORTED_MODULE_1_aurelia_binding__["bindingMode"].twoWay;
    }

    if (context && attrName in context.attributes && context.attributes[attrName] && context.attributes[attrName].defaultBindingMode >= __WEBPACK_IMPORTED_MODULE_1_aurelia_binding__["bindingMode"].oneTime) {
      return context.attributes[attrName].defaultBindingMode;
    }

    return __WEBPACK_IMPORTED_MODULE_1_aurelia_binding__["bindingMode"].oneWay;
  }

  bind(resources, element, info, existingInstruction, context) {
    let instruction = existingInstruction || __WEBPACK_IMPORTED_MODULE_2_aurelia_templating__["BehaviorInstruction"].attribute(info.attrName);

    instruction.attributes[info.attrName] = new __WEBPACK_IMPORTED_MODULE_1_aurelia_binding__["BindingExpression"](this.observerLocator, this.attributeMap.map(element.tagName, info.attrName), this.parser.parse(info.attrValue), info.defaultBindingMode === undefined || info.defaultBindingMode === null ? this.determineDefaultBindingMode(element, info.attrName, context) : info.defaultBindingMode, resources.lookupFunctions);

    return instruction;
  }

  trigger(resources, element, info) {
    return new __WEBPACK_IMPORTED_MODULE_1_aurelia_binding__["ListenerExpression"](this.eventManager, info.attrName, this.parser.parse(info.attrValue), __WEBPACK_IMPORTED_MODULE_1_aurelia_binding__["delegationStrategy"].none, true, resources.lookupFunctions);
  }

  capture(resources, element, info) {
    return new __WEBPACK_IMPORTED_MODULE_1_aurelia_binding__["ListenerExpression"](this.eventManager, info.attrName, this.parser.parse(info.attrValue), __WEBPACK_IMPORTED_MODULE_1_aurelia_binding__["delegationStrategy"].capturing, true, resources.lookupFunctions);
  }

  delegate(resources, element, info) {
    return new __WEBPACK_IMPORTED_MODULE_1_aurelia_binding__["ListenerExpression"](this.eventManager, info.attrName, this.parser.parse(info.attrValue), __WEBPACK_IMPORTED_MODULE_1_aurelia_binding__["delegationStrategy"].bubbling, true, resources.lookupFunctions);
  }

  call(resources, element, info, existingInstruction) {
    let instruction = existingInstruction || __WEBPACK_IMPORTED_MODULE_2_aurelia_templating__["BehaviorInstruction"].attribute(info.attrName);

    instruction.attributes[info.attrName] = new __WEBPACK_IMPORTED_MODULE_1_aurelia_binding__["CallExpression"](this.observerLocator, info.attrName, this.parser.parse(info.attrValue), resources.lookupFunctions);

    return instruction;
  }

  options(resources, element, info, existingInstruction, context) {
    let instruction = existingInstruction || __WEBPACK_IMPORTED_MODULE_2_aurelia_templating__["BehaviorInstruction"].attribute(info.attrName);
    let attrValue = info.attrValue;
    let language = this.language;
    let name = null;
    let target = '';
    let current;
    let i;
    let ii;
    let inString = false;
    let inEscape = false;
    let foundName = false;

    for (i = 0, ii = attrValue.length; i < ii; ++i) {
      current = attrValue[i];

      if (current === ';' && !inString) {
        if (!foundName) {
          name = this._getPrimaryPropertyName(resources, context);
        }
        info = language.inspectAttribute(resources, '?', name, target.trim());
        language.createAttributeInstruction(resources, element, info, instruction, context);

        if (!instruction.attributes[info.attrName]) {
          instruction.attributes[info.attrName] = info.attrValue;
        }

        target = '';
        name = null;
      } else if (current === ':' && name === null) {
        foundName = true;
        name = target.trim();
        target = '';
      } else if (current === '\\') {
        target += current;
        inEscape = true;
        continue;
      } else {
        target += current;

        if (name !== null && inEscape === false && current === '\'') {
          inString = !inString;
        }
      }

      inEscape = false;
    }

    if (!foundName) {
      name = this._getPrimaryPropertyName(resources, context);
    }

    if (name !== null) {
      info = language.inspectAttribute(resources, '?', name, target.trim());
      language.createAttributeInstruction(resources, element, info, instruction, context);

      if (!instruction.attributes[info.attrName]) {
        instruction.attributes[info.attrName] = info.attrValue;
      }
    }

    return instruction;
  }

  _getPrimaryPropertyName(resources, context) {
    let type = resources.getAttribute(context.attributeName);
    if (type && type.primaryProperty) {
      return type.primaryProperty.attribute;
    }
    return null;
  }

  'for'(resources, element, info, existingInstruction) {
    let parts;
    let keyValue;
    let instruction;
    let attrValue;
    let isDestructuring;

    attrValue = info.attrValue;
    isDestructuring = attrValue.match(/^ *[[].+[\]]/);
    parts = isDestructuring ? attrValue.split('of ') : attrValue.split(' of ');

    if (parts.length !== 2) {
      throw new Error('Incorrect syntax for "for". The form is: "$local of $items" or "[$key, $value] of $items".');
    }

    instruction = existingInstruction || __WEBPACK_IMPORTED_MODULE_2_aurelia_templating__["BehaviorInstruction"].attribute(info.attrName);

    if (isDestructuring) {
      keyValue = parts[0].replace(/[[\]]/g, '').replace(/,/g, ' ').replace(/\s+/g, ' ').trim().split(' ');
      instruction.attributes.key = keyValue[0];
      instruction.attributes.value = keyValue[1];
    } else {
      instruction.attributes.local = parts[0];
    }

    instruction.attributes.items = new __WEBPACK_IMPORTED_MODULE_1_aurelia_binding__["BindingExpression"](this.observerLocator, 'items', this.parser.parse(parts[1]), __WEBPACK_IMPORTED_MODULE_1_aurelia_binding__["bindingMode"].oneWay, resources.lookupFunctions);

    return instruction;
  }

  'two-way'(resources, element, info, existingInstruction) {
    let instruction = existingInstruction || __WEBPACK_IMPORTED_MODULE_2_aurelia_templating__["BehaviorInstruction"].attribute(info.attrName);

    instruction.attributes[info.attrName] = new __WEBPACK_IMPORTED_MODULE_1_aurelia_binding__["BindingExpression"](this.observerLocator, this.attributeMap.map(element.tagName, info.attrName), this.parser.parse(info.attrValue), __WEBPACK_IMPORTED_MODULE_1_aurelia_binding__["bindingMode"].twoWay, resources.lookupFunctions);

    return instruction;
  }

  'to-view'(resources, element, info, existingInstruction) {
    let instruction = existingInstruction || __WEBPACK_IMPORTED_MODULE_2_aurelia_templating__["BehaviorInstruction"].attribute(info.attrName);

    instruction.attributes[info.attrName] = new __WEBPACK_IMPORTED_MODULE_1_aurelia_binding__["BindingExpression"](this.observerLocator, this.attributeMap.map(element.tagName, info.attrName), this.parser.parse(info.attrValue), __WEBPACK_IMPORTED_MODULE_1_aurelia_binding__["bindingMode"].toView, resources.lookupFunctions);

    return instruction;
  }

  'from-view'(resources, element, info, existingInstruction) {
    let instruction = existingInstruction || __WEBPACK_IMPORTED_MODULE_2_aurelia_templating__["BehaviorInstruction"].attribute(info.attrName);

    instruction.attributes[info.attrName] = new __WEBPACK_IMPORTED_MODULE_1_aurelia_binding__["BindingExpression"](this.observerLocator, this.attributeMap.map(element.tagName, info.attrName), this.parser.parse(info.attrValue), __WEBPACK_IMPORTED_MODULE_1_aurelia_binding__["bindingMode"].fromView, resources.lookupFunctions);

    return instruction;
  }

  'one-time'(resources, element, info, existingInstruction) {
    let instruction = existingInstruction || __WEBPACK_IMPORTED_MODULE_2_aurelia_templating__["BehaviorInstruction"].attribute(info.attrName);

    instruction.attributes[info.attrName] = new __WEBPACK_IMPORTED_MODULE_1_aurelia_binding__["BindingExpression"](this.observerLocator, this.attributeMap.map(element.tagName, info.attrName), this.parser.parse(info.attrValue), __WEBPACK_IMPORTED_MODULE_1_aurelia_binding__["bindingMode"].oneTime, resources.lookupFunctions);

    return instruction;
  }
}, _class4.inject = [__WEBPACK_IMPORTED_MODULE_1_aurelia_binding__["Parser"], __WEBPACK_IMPORTED_MODULE_1_aurelia_binding__["ObserverLocator"], __WEBPACK_IMPORTED_MODULE_1_aurelia_binding__["EventManager"], AttributeMap], _temp2);

SyntaxInterpreter.prototype['one-way'] = SyntaxInterpreter.prototype['to-view'];

let info = {};

let TemplatingBindingLanguage = (_temp3 = _class5 = class TemplatingBindingLanguage extends __WEBPACK_IMPORTED_MODULE_2_aurelia_templating__["BindingLanguage"] {

  constructor(parser, observerLocator, syntaxInterpreter, attributeMap) {
    super();
    this.parser = parser;
    this.observerLocator = observerLocator;
    this.syntaxInterpreter = syntaxInterpreter;
    this.emptyStringExpression = this.parser.parse('\'\'');
    syntaxInterpreter.language = this;
    this.attributeMap = attributeMap;
    this.toBindingContextAttr = 'to-binding-context';
  }

  inspectAttribute(resources, elementName, attrName, attrValue) {
    let parts = attrName.split('.');

    info.defaultBindingMode = null;

    if (parts.length === 2) {
      info.attrName = parts[0].trim();
      info.attrValue = attrValue;
      info.command = parts[1].trim();

      if (info.command === 'ref') {
        info.expression = new __WEBPACK_IMPORTED_MODULE_1_aurelia_binding__["NameExpression"](this.parser.parse(attrValue), info.attrName, resources.lookupFunctions);
        info.command = null;
        info.attrName = 'ref';
      } else {
        info.expression = null;
      }
    } else if (attrName === 'ref') {
      info.attrName = attrName;
      info.attrValue = attrValue;
      info.command = null;
      info.expression = new __WEBPACK_IMPORTED_MODULE_1_aurelia_binding__["NameExpression"](this.parser.parse(attrValue), 'element', resources.lookupFunctions);
    } else {
      info.attrName = attrName;
      info.attrValue = attrValue;
      info.command = null;
      const interpolationParts = this.parseInterpolation(resources, attrValue);
      if (interpolationParts === null) {
        info.expression = null;
      } else {
        info.expression = new InterpolationBindingExpression(this.observerLocator, this.attributeMap.map(elementName, attrName), interpolationParts, __WEBPACK_IMPORTED_MODULE_1_aurelia_binding__["bindingMode"].oneWay, resources.lookupFunctions, attrName);
      }
    }

    return info;
  }

  createAttributeInstruction(resources, element, theInfo, existingInstruction, context) {
    let instruction;

    if (theInfo.expression) {
      if (theInfo.attrName === 'ref') {
        return theInfo.expression;
      }

      instruction = existingInstruction || __WEBPACK_IMPORTED_MODULE_2_aurelia_templating__["BehaviorInstruction"].attribute(theInfo.attrName);
      instruction.attributes[theInfo.attrName] = theInfo.expression;
    } else if (theInfo.command) {
      instruction = this.syntaxInterpreter.interpret(resources, element, theInfo, existingInstruction, context);
    }

    return instruction;
  }

  createLetExpressions(resources, letElement) {
    let expressions = [];
    let attributes = letElement.attributes;

    let attr;

    let parts;
    let attrName;
    let attrValue;
    let command;
    let toBindingContextAttr = this.toBindingContextAttr;
    let toBindingContext = letElement.hasAttribute(toBindingContextAttr);
    for (let i = 0, ii = attributes.length; ii > i; ++i) {
      attr = attributes[i];
      attrName = attr.name;
      attrValue = attr.nodeValue;
      parts = attrName.split('.');

      if (attrName === toBindingContextAttr) {
        continue;
      }

      if (parts.length === 2) {
        command = parts[1];
        if (command !== 'bind') {
          __WEBPACK_IMPORTED_MODULE_0_aurelia_logging__["getLogger"]('templating-binding-language').warn(`Detected invalid let command. Expected "${parts[0]}.bind", given "${attrName}"`);
          continue;
        }
        expressions.push(new LetExpression(this.observerLocator, __webpack_require__.i(__WEBPACK_IMPORTED_MODULE_1_aurelia_binding__["camelCase"])(parts[0]), this.parser.parse(attrValue), resources.lookupFunctions, toBindingContext));
      } else {
        attrName = __webpack_require__.i(__WEBPACK_IMPORTED_MODULE_1_aurelia_binding__["camelCase"])(attrName);
        parts = this.parseInterpolation(resources, attrValue);
        if (parts === null) {
          __WEBPACK_IMPORTED_MODULE_0_aurelia_logging__["getLogger"]('templating-binding-language').warn(`Detected string literal in let bindings. Did you mean "${attrName}.bind=${attrValue}" or "${attrName}=\${${attrValue}}" ?`);
        }
        if (parts) {
          expressions.push(new LetInterpolationBindingExpression(this.observerLocator, attrName, parts, resources.lookupFunctions, toBindingContext));
        } else {
          expressions.push(new LetExpression(this.observerLocator, attrName, new __WEBPACK_IMPORTED_MODULE_1_aurelia_binding__["LiteralString"](attrValue), resources.lookupFunctions, toBindingContext));
        }
      }
    }
    return expressions;
  }

  inspectTextContent(resources, value) {
    const parts = this.parseInterpolation(resources, value);
    if (parts === null) {
      return null;
    }
    return new InterpolationBindingExpression(this.observerLocator, 'textContent', parts, __WEBPACK_IMPORTED_MODULE_1_aurelia_binding__["bindingMode"].oneWay, resources.lookupFunctions, 'textContent');
  }

  parseInterpolation(resources, value) {
    let i = value.indexOf('${', 0);
    let ii = value.length;
    let char;
    let pos = 0;
    let open = 0;
    let quote = null;
    let interpolationStart;
    let parts;
    let partIndex = 0;

    while (i >= 0 && i < ii - 2) {
      open = 1;
      interpolationStart = i;
      i += 2;

      do {
        char = value[i];
        i++;

        if (char === "'" || char === '"') {
          if (quote === null) {
            quote = char;
          } else if (quote === char) {
            quote = null;
          }
          continue;
        }

        if (char === '\\') {
          i++;
          continue;
        }

        if (quote !== null) {
          continue;
        }

        if (char === '{') {
          open++;
        } else if (char === '}') {
          open--;
        }
      } while (open > 0 && i < ii);

      if (open === 0) {
        parts = parts || [];
        if (value[interpolationStart - 1] === '\\' && value[interpolationStart - 2] !== '\\') {
          parts[partIndex] = value.substring(pos, interpolationStart - 1) + value.substring(interpolationStart, i);
          partIndex++;
          parts[partIndex] = this.emptyStringExpression;
          partIndex++;
        } else {
          parts[partIndex] = value.substring(pos, interpolationStart);
          partIndex++;
          parts[partIndex] = this.parser.parse(value.substring(interpolationStart + 2, i - 1));
          partIndex++;
        }
        pos = i;
        i = value.indexOf('${', i);
      } else {
        break;
      }
    }

    if (partIndex === 0) {
      return null;
    }

    parts[partIndex] = value.substr(pos);
    return parts;
  }
}, _class5.inject = [__WEBPACK_IMPORTED_MODULE_1_aurelia_binding__["Parser"], __WEBPACK_IMPORTED_MODULE_1_aurelia_binding__["ObserverLocator"], SyntaxInterpreter, AttributeMap], _temp3);

function configure(config) {
  config.container.registerSingleton(__WEBPACK_IMPORTED_MODULE_2_aurelia_templating__["BindingLanguage"], TemplatingBindingLanguage);
  config.container.registerAlias(__WEBPACK_IMPORTED_MODULE_2_aurelia_templating__["BindingLanguage"], TemplatingBindingLanguage);
}

/***/ },

/***/ "aurelia-templating-resources":
/***/ function(module, exports, __webpack_require__) {

"use strict";
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.viewsRequireLifecycle = exports.unwrapExpression = exports.updateOneTimeBinding = exports.isOneTime = exports.getItemsSourceExpression = exports.updateOverrideContext = exports.createFullOverrideContext = exports.NumberRepeatStrategy = exports.SetRepeatStrategy = exports.MapRepeatStrategy = exports.ArrayRepeatStrategy = exports.NullRepeatStrategy = exports.RepeatStrategyLocator = exports.AbstractRepeater = exports.UpdateTriggerBindingBehavior = exports.BindingSignaler = exports.SignalBindingBehavior = exports.SelfBindingBehavior = exports.DebounceBindingBehavior = exports.ThrottleBindingBehavior = exports.TwoWayBindingBehavior = exports.FromViewBindingBehavior = exports.ToViewBindingBehavior = exports.OneWayBindingBehavior = exports.OneTimeBindingBehavior = exports.AttrBindingBehavior = exports.configure = exports.Focus = exports.Replaceable = exports.SanitizeHTMLValueConverter = exports.HTMLSanitizer = exports.Hide = exports.Show = exports.Repeat = exports.With = exports.Else = exports.If = exports.Compose = undefined;

var _compose = __webpack_require__("aurelia-templating-resources/compose.js");

var _if = __webpack_require__("aurelia-templating-resources/if.js");

var _else = __webpack_require__("aurelia-templating-resources/else.js");

var _with = __webpack_require__("aurelia-templating-resources/with.js");

var _repeat = __webpack_require__("aurelia-templating-resources/repeat.js");

var _show = __webpack_require__("aurelia-templating-resources/show.js");

var _hide = __webpack_require__("aurelia-templating-resources/hide.js");

var _sanitizeHtml = __webpack_require__("aurelia-templating-resources/sanitize-html.js");

var _replaceable = __webpack_require__("aurelia-templating-resources/replaceable.js");

var _focus = __webpack_require__("aurelia-templating-resources/focus.js");

var _aureliaTemplating = __webpack_require__(20);

var _cssResource = __webpack_require__(601);

var _htmlSanitizer = __webpack_require__(298);

var _attrBindingBehavior = __webpack_require__("aurelia-templating-resources/attr-binding-behavior.js");

var _bindingModeBehaviors = __webpack_require__("aurelia-templating-resources/binding-mode-behaviors.js");

var _throttleBindingBehavior = __webpack_require__("aurelia-templating-resources/throttle-binding-behavior.js");

var _debounceBindingBehavior = __webpack_require__("aurelia-templating-resources/debounce-binding-behavior.js");

var _selfBindingBehavior = __webpack_require__("aurelia-templating-resources/self-binding-behavior.js");

var _signalBindingBehavior = __webpack_require__("aurelia-templating-resources/signal-binding-behavior.js");

var _bindingSignaler = __webpack_require__(297);

var _updateTriggerBindingBehavior = __webpack_require__("aurelia-templating-resources/update-trigger-binding-behavior.js");

var _abstractRepeater = __webpack_require__(294);

var _repeatStrategyLocator = __webpack_require__(303);

var _htmlResourcePlugin = __webpack_require__(603);

var _nullRepeatStrategy = __webpack_require__(301);

var _arrayRepeatStrategy = __webpack_require__(296);

var _mapRepeatStrategy = __webpack_require__(300);

var _setRepeatStrategy = __webpack_require__(304);

var _numberRepeatStrategy = __webpack_require__(302);

var _repeatUtilities = __webpack_require__(104);

var _analyzeViewFactory = __webpack_require__(295);

var _aureliaHideStyle = __webpack_require__(194);

function configure(config) {
  (0, _aureliaHideStyle.injectAureliaHideStyleAtHead)();

  config.globalResources(_compose.Compose, _if.If, _else.Else, _with.With, _repeat.Repeat, _show.Show, _hide.Hide, _replaceable.Replaceable, _focus.Focus, _sanitizeHtml.SanitizeHTMLValueConverter, _bindingModeBehaviors.OneTimeBindingBehavior, _bindingModeBehaviors.OneWayBindingBehavior, _bindingModeBehaviors.ToViewBindingBehavior, _bindingModeBehaviors.FromViewBindingBehavior, _bindingModeBehaviors.TwoWayBindingBehavior, _throttleBindingBehavior.ThrottleBindingBehavior, _debounceBindingBehavior.DebounceBindingBehavior, _selfBindingBehavior.SelfBindingBehavior, _signalBindingBehavior.SignalBindingBehavior, _updateTriggerBindingBehavior.UpdateTriggerBindingBehavior, _attrBindingBehavior.AttrBindingBehavior);

  (0, _htmlResourcePlugin.configure)(config);

  var viewEngine = config.container.get(_aureliaTemplating.ViewEngine);
  var styleResourcePlugin = {
    fetch: function fetch(address) {
      var _ref;

      return _ref = {}, _ref[address] = (0, _cssResource._createCSSResource)(address), _ref;
    }
  };
  ['.css', '.less', '.sass', '.scss', '.styl'].forEach(function (ext) {
    return viewEngine.addResourcePlugin(ext, styleResourcePlugin);
  });
}

exports.Compose = _compose.Compose;
exports.If = _if.If;
exports.Else = _else.Else;
exports.With = _with.With;
exports.Repeat = _repeat.Repeat;
exports.Show = _show.Show;
exports.Hide = _hide.Hide;
exports.HTMLSanitizer = _htmlSanitizer.HTMLSanitizer;
exports.SanitizeHTMLValueConverter = _sanitizeHtml.SanitizeHTMLValueConverter;
exports.Replaceable = _replaceable.Replaceable;
exports.Focus = _focus.Focus;
exports.configure = configure;
exports.AttrBindingBehavior = _attrBindingBehavior.AttrBindingBehavior;
exports.OneTimeBindingBehavior = _bindingModeBehaviors.OneTimeBindingBehavior;
exports.OneWayBindingBehavior = _bindingModeBehaviors.OneWayBindingBehavior;
exports.ToViewBindingBehavior = _bindingModeBehaviors.ToViewBindingBehavior;
exports.FromViewBindingBehavior = _bindingModeBehaviors.FromViewBindingBehavior;
exports.TwoWayBindingBehavior = _bindingModeBehaviors.TwoWayBindingBehavior;
exports.ThrottleBindingBehavior = _throttleBindingBehavior.ThrottleBindingBehavior;
exports.DebounceBindingBehavior = _debounceBindingBehavior.DebounceBindingBehavior;
exports.SelfBindingBehavior = _selfBindingBehavior.SelfBindingBehavior;
exports.SignalBindingBehavior = _signalBindingBehavior.SignalBindingBehavior;
exports.BindingSignaler = _bindingSignaler.BindingSignaler;
exports.UpdateTriggerBindingBehavior = _updateTriggerBindingBehavior.UpdateTriggerBindingBehavior;
exports.AbstractRepeater = _abstractRepeater.AbstractRepeater;
exports.RepeatStrategyLocator = _repeatStrategyLocator.RepeatStrategyLocator;
exports.NullRepeatStrategy = _nullRepeatStrategy.NullRepeatStrategy;
exports.ArrayRepeatStrategy = _arrayRepeatStrategy.ArrayRepeatStrategy;
exports.MapRepeatStrategy = _mapRepeatStrategy.MapRepeatStrategy;
exports.SetRepeatStrategy = _setRepeatStrategy.SetRepeatStrategy;
exports.NumberRepeatStrategy = _numberRepeatStrategy.NumberRepeatStrategy;
exports.createFullOverrideContext = _repeatUtilities.createFullOverrideContext;
exports.updateOverrideContext = _repeatUtilities.updateOverrideContext;
exports.getItemsSourceExpression = _repeatUtilities.getItemsSourceExpression;
exports.isOneTime = _repeatUtilities.isOneTime;
exports.updateOneTimeBinding = _repeatUtilities.updateOneTimeBinding;
exports.unwrapExpression = _repeatUtilities.unwrapExpression;
exports.viewsRequireLifecycle = _analyzeViewFactory.viewsRequireLifecycle;

/***/ },

/***/ "aurelia-templating-resources/attr-binding-behavior.js":
/***/ function(module, exports, __webpack_require__) {

"use strict";
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.AttrBindingBehavior = undefined;

var _dec, _class;

var _aureliaBinding = __webpack_require__(24);



var AttrBindingBehavior = exports.AttrBindingBehavior = (_dec = (0, _aureliaBinding.bindingBehavior)('attr'), _dec(_class = function () {
  function AttrBindingBehavior() {
    
  }

  AttrBindingBehavior.prototype.bind = function bind(binding, source) {
    binding.targetObserver = new _aureliaBinding.DataAttributeObserver(binding.target, binding.targetProperty);
  };

  AttrBindingBehavior.prototype.unbind = function unbind(binding, source) {};

  return AttrBindingBehavior;
}()) || _class);

/***/ },

/***/ "aurelia-templating-resources/binding-mode-behaviors.js":
/***/ function(module, exports, __webpack_require__) {

"use strict";
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.TwoWayBindingBehavior = exports.FromViewBindingBehavior = exports.ToViewBindingBehavior = exports.OneWayBindingBehavior = exports.OneTimeBindingBehavior = undefined;

var _dec, _dec2, _class, _dec3, _dec4, _class2, _dec5, _dec6, _class3, _dec7, _dec8, _class4, _dec9, _dec10, _class5;

var _aureliaBinding = __webpack_require__(24);

var _aureliaMetadata = __webpack_require__(43);



var modeBindingBehavior = {
  bind: function bind(binding, source, lookupFunctions) {
    binding.originalMode = binding.mode;
    binding.mode = this.mode;
  },
  unbind: function unbind(binding, source) {
    binding.mode = binding.originalMode;
    binding.originalMode = null;
  }
};

var OneTimeBindingBehavior = exports.OneTimeBindingBehavior = (_dec = (0, _aureliaMetadata.mixin)(modeBindingBehavior), _dec2 = (0, _aureliaBinding.bindingBehavior)('oneTime'), _dec(_class = _dec2(_class = function OneTimeBindingBehavior() {
  

  this.mode = _aureliaBinding.bindingMode.oneTime;
}) || _class) || _class);
var OneWayBindingBehavior = exports.OneWayBindingBehavior = (_dec3 = (0, _aureliaMetadata.mixin)(modeBindingBehavior), _dec4 = (0, _aureliaBinding.bindingBehavior)('oneWay'), _dec3(_class2 = _dec4(_class2 = function OneWayBindingBehavior() {
  

  this.mode = _aureliaBinding.bindingMode.toView;
}) || _class2) || _class2);
var ToViewBindingBehavior = exports.ToViewBindingBehavior = (_dec5 = (0, _aureliaMetadata.mixin)(modeBindingBehavior), _dec6 = (0, _aureliaBinding.bindingBehavior)('toView'), _dec5(_class3 = _dec6(_class3 = function ToViewBindingBehavior() {
  

  this.mode = _aureliaBinding.bindingMode.toView;
}) || _class3) || _class3);
var FromViewBindingBehavior = exports.FromViewBindingBehavior = (_dec7 = (0, _aureliaMetadata.mixin)(modeBindingBehavior), _dec8 = (0, _aureliaBinding.bindingBehavior)('fromView'), _dec7(_class4 = _dec8(_class4 = function FromViewBindingBehavior() {
  

  this.mode = _aureliaBinding.bindingMode.fromView;
}) || _class4) || _class4);
var TwoWayBindingBehavior = exports.TwoWayBindingBehavior = (_dec9 = (0, _aureliaMetadata.mixin)(modeBindingBehavior), _dec10 = (0, _aureliaBinding.bindingBehavior)('twoWay'), _dec9(_class5 = _dec10(_class5 = function TwoWayBindingBehavior() {
  

  this.mode = _aureliaBinding.bindingMode.twoWay;
}) || _class5) || _class5);

/***/ },

/***/ "aurelia-templating-resources/compose.js":
/***/ function(module, exports, __webpack_require__) {

"use strict";
/* WEBPACK VAR INJECTION */(function(Promise) {'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Compose = undefined;

var _dec, _class, _desc, _value, _class2, _descriptor, _descriptor2, _descriptor3, _descriptor4;

var _aureliaDependencyInjection = __webpack_require__(7);

var _aureliaTaskQueue = __webpack_require__(103);

var _aureliaTemplating = __webpack_require__(20);

var _aureliaPal = __webpack_require__(21);

function _initDefineProp(target, property, descriptor, context) {
  if (!descriptor) return;
  Object.defineProperty(target, property, {
    enumerable: descriptor.enumerable,
    configurable: descriptor.configurable,
    writable: descriptor.writable,
    value: descriptor.initializer ? descriptor.initializer.call(context) : void 0
  });
}



function _applyDecoratedDescriptor(target, property, decorators, descriptor, context) {
  var desc = {};
  Object['ke' + 'ys'](descriptor).forEach(function (key) {
    desc[key] = descriptor[key];
  });
  desc.enumerable = !!desc.enumerable;
  desc.configurable = !!desc.configurable;

  if ('value' in desc || desc.initializer) {
    desc.writable = true;
  }

  desc = decorators.slice().reverse().reduce(function (desc, decorator) {
    return decorator(target, property, desc) || desc;
  }, desc);

  if (context && desc.initializer !== void 0) {
    desc.value = desc.initializer ? desc.initializer.call(context) : void 0;
    desc.initializer = undefined;
  }

  if (desc.initializer === void 0) {
    Object['define' + 'Property'](target, property, desc);
    desc = null;
  }

  return desc;
}

function _initializerWarningHelper(descriptor, context) {
  throw new Error('Decorating class property failed. Please ensure that transform-class-properties is enabled.');
}

var Compose = exports.Compose = (_dec = (0, _aureliaTemplating.customElement)('compose'), _dec(_class = (0, _aureliaTemplating.noView)(_class = (_class2 = function () {
  Compose.inject = function inject() {
    return [_aureliaPal.DOM.Element, _aureliaDependencyInjection.Container, _aureliaTemplating.CompositionEngine, _aureliaTemplating.ViewSlot, _aureliaTemplating.ViewResources, _aureliaTaskQueue.TaskQueue];
  };

  function Compose(element, container, compositionEngine, viewSlot, viewResources, taskQueue) {
    

    _initDefineProp(this, 'model', _descriptor, this);

    _initDefineProp(this, 'view', _descriptor2, this);

    _initDefineProp(this, 'viewModel', _descriptor3, this);

    _initDefineProp(this, 'swapOrder', _descriptor4, this);

    this.element = element;
    this.container = container;
    this.compositionEngine = compositionEngine;
    this.viewSlot = viewSlot;
    this.viewResources = viewResources;
    this.taskQueue = taskQueue;
    this.currentController = null;
    this.currentViewModel = null;
    this.changes = Object.create(null);
  }

  Compose.prototype.created = function created(owningView) {
    this.owningView = owningView;
  };

  Compose.prototype.bind = function bind(bindingContext, overrideContext) {
    this.bindingContext = bindingContext;
    this.overrideContext = overrideContext;
    this.changes.view = this.view;
    this.changes.viewModel = this.viewModel;
    this.changes.model = this.model;
    if (!this.pendingTask) {
      processChanges(this);
    }
  };

  Compose.prototype.unbind = function unbind() {
    this.changes = Object.create(null);
    this.bindingContext = null;
    this.overrideContext = null;
    var returnToCache = true;
    var skipAnimation = true;
    this.viewSlot.removeAll(returnToCache, skipAnimation);
  };

  Compose.prototype.modelChanged = function modelChanged(newValue, oldValue) {
    this.changes.model = newValue;
    requestUpdate(this);
  };

  Compose.prototype.viewChanged = function viewChanged(newValue, oldValue) {
    this.changes.view = newValue;
    requestUpdate(this);
  };

  Compose.prototype.viewModelChanged = function viewModelChanged(newValue, oldValue) {
    this.changes.viewModel = newValue;
    requestUpdate(this);
  };

  return Compose;
}(), (_descriptor = _applyDecoratedDescriptor(_class2.prototype, 'model', [_aureliaTemplating.bindable], {
  enumerable: true,
  initializer: null
}), _descriptor2 = _applyDecoratedDescriptor(_class2.prototype, 'view', [_aureliaTemplating.bindable], {
  enumerable: true,
  initializer: null
}), _descriptor3 = _applyDecoratedDescriptor(_class2.prototype, 'viewModel', [_aureliaTemplating.bindable], {
  enumerable: true,
  initializer: null
}), _descriptor4 = _applyDecoratedDescriptor(_class2.prototype, 'swapOrder', [_aureliaTemplating.bindable], {
  enumerable: true,
  initializer: null
})), _class2)) || _class) || _class);


function isEmpty(obj) {
  for (var key in obj) {
    return false;
  }
  return true;
}

function tryActivateViewModel(vm, model) {
  if (vm && typeof vm.activate === 'function') {
    return Promise.resolve(vm.activate(model));
  }
}

function createInstruction(composer, instruction) {
  return Object.assign(instruction, {
    bindingContext: composer.bindingContext,
    overrideContext: composer.overrideContext,
    owningView: composer.owningView,
    container: composer.container,
    viewSlot: composer.viewSlot,
    viewResources: composer.viewResources,
    currentController: composer.currentController,
    host: composer.element,
    swapOrder: composer.swapOrder
  });
}

function processChanges(composer) {
  var changes = composer.changes;
  composer.changes = Object.create(null);

  if (!('view' in changes) && !('viewModel' in changes) && 'model' in changes) {
    composer.pendingTask = tryActivateViewModel(composer.currentViewModel, changes.model);
    if (!composer.pendingTask) {
      return;
    }
  } else {
    var instruction = {
      view: composer.view,
      viewModel: composer.currentViewModel || composer.viewModel,
      model: composer.model
    };

    instruction = Object.assign(instruction, changes);

    instruction = createInstruction(composer, instruction);
    composer.pendingTask = composer.compositionEngine.compose(instruction).then(function (controller) {
      composer.currentController = controller;
      composer.currentViewModel = controller ? controller.viewModel : null;
    });
  }

  composer.pendingTask = composer.pendingTask.then(function () {
    completeCompositionTask(composer);
  }, function (reason) {
    completeCompositionTask(composer);
    throw reason;
  });
}

function completeCompositionTask(composer) {
  composer.pendingTask = null;
  if (!isEmpty(composer.changes)) {
    processChanges(composer);
  }
}

function requestUpdate(composer) {
  if (composer.pendingTask || composer.updateRequested) {
    return;
  }
  composer.updateRequested = true;
  composer.taskQueue.queueMicroTask(function () {
    composer.updateRequested = false;
    processChanges(composer);
  });
}
/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__("bluebird")))

/***/ },

/***/ "aurelia-templating-resources/debounce-binding-behavior.js":
/***/ function(module, exports, __webpack_require__) {

"use strict";
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.DebounceBindingBehavior = undefined;

var _dec, _class;

var _aureliaBinding = __webpack_require__(24);



var unset = {};

function debounceCallSource(event) {
  var _this = this;

  var state = this.debounceState;
  clearTimeout(state.timeoutId);
  state.timeoutId = setTimeout(function () {
    return _this.debouncedMethod(event);
  }, state.delay);
}

function debounceCall(context, newValue, oldValue) {
  var _this2 = this;

  var state = this.debounceState;
  clearTimeout(state.timeoutId);
  if (context !== state.callContextToDebounce) {
    state.oldValue = unset;
    this.debouncedMethod(context, newValue, oldValue);
    return;
  }
  if (state.oldValue === unset) {
    state.oldValue = oldValue;
  }
  state.timeoutId = setTimeout(function () {
    var _oldValue = state.oldValue;
    state.oldValue = unset;
    _this2.debouncedMethod(context, newValue, _oldValue);
  }, state.delay);
}

var DebounceBindingBehavior = exports.DebounceBindingBehavior = (_dec = (0, _aureliaBinding.bindingBehavior)('debounce'), _dec(_class = function () {
  function DebounceBindingBehavior() {
    
  }

  DebounceBindingBehavior.prototype.bind = function bind(binding, source) {
    var delay = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 200;

    var isCallSource = binding.callSource !== undefined;
    var methodToDebounce = isCallSource ? 'callSource' : 'call';
    var debouncer = isCallSource ? debounceCallSource : debounceCall;
    var mode = binding.mode;
    var callContextToDebounce = mode === _aureliaBinding.bindingMode.twoWay || mode === _aureliaBinding.bindingMode.fromView ? _aureliaBinding.targetContext : _aureliaBinding.sourceContext;

    binding.debouncedMethod = binding[methodToDebounce];
    binding.debouncedMethod.originalName = methodToDebounce;

    binding[methodToDebounce] = debouncer;

    binding.debounceState = {
      callContextToDebounce: callContextToDebounce,
      delay: delay,
      timeoutId: 0,
      oldValue: unset
    };
  };

  DebounceBindingBehavior.prototype.unbind = function unbind(binding, source) {
    var methodToRestore = binding.debouncedMethod.originalName;
    binding[methodToRestore] = binding.debouncedMethod;
    binding.debouncedMethod = null;
    clearTimeout(binding.debounceState.timeoutId);
    binding.debounceState = null;
  };

  return DebounceBindingBehavior;
}()) || _class);

/***/ },

/***/ "aurelia-templating-resources/else.js":
/***/ function(module, exports, __webpack_require__) {

"use strict";
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Else = undefined;

var _dec, _dec2, _class;

var _aureliaTemplating = __webpack_require__(20);

var _aureliaDependencyInjection = __webpack_require__(7);

var _ifCore = __webpack_require__(299);



function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var Else = exports.Else = (_dec = (0, _aureliaTemplating.customAttribute)('else'), _dec2 = (0, _aureliaDependencyInjection.inject)(_aureliaTemplating.BoundViewFactory, _aureliaTemplating.ViewSlot), _dec(_class = (0, _aureliaTemplating.templateController)(_class = _dec2(_class = function (_IfCore) {
  _inherits(Else, _IfCore);

  function Else(viewFactory, viewSlot) {
    

    var _this = _possibleConstructorReturn(this, _IfCore.call(this, viewFactory, viewSlot));

    _this._registerInIf();
    return _this;
  }

  Else.prototype.bind = function bind(bindingContext, overrideContext) {
    _IfCore.prototype.bind.call(this, bindingContext, overrideContext);

    if (this.ifVm.condition) {
      this._hide();
    } else {
      this._show();
    }
  };

  Else.prototype._registerInIf = function _registerInIf() {
    var previous = this.viewSlot.anchor.previousSibling;
    while (previous && !previous.au) {
      previous = previous.previousSibling;
    }
    if (!previous || !previous.au.if) {
      throw new Error("Can't find matching If for Else custom attribute.");
    }
    this.ifVm = previous.au.if.viewModel;
    this.ifVm.elseVm = this;
  };

  return Else;
}(_ifCore.IfCore)) || _class) || _class) || _class);

/***/ },

/***/ "aurelia-templating-resources/focus.js":
/***/ function(module, exports, __webpack_require__) {

"use strict";
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Focus = undefined;

var _dec, _class;

var _aureliaTemplating = __webpack_require__(20);

var _aureliaBinding = __webpack_require__(24);

var _aureliaTaskQueue = __webpack_require__(103);

var _aureliaPal = __webpack_require__(21);



var Focus = exports.Focus = (_dec = (0, _aureliaTemplating.customAttribute)('focus', _aureliaBinding.bindingMode.twoWay), _dec(_class = function () {
  Focus.inject = function inject() {
    return [_aureliaPal.DOM.Element, _aureliaTaskQueue.TaskQueue];
  };

  function Focus(element, taskQueue) {
    

    this.element = element;
    this.taskQueue = taskQueue;
    this.isAttached = false;
    this.needsApply = false;
  }

  Focus.prototype.valueChanged = function valueChanged(newValue) {
    if (this.isAttached) {
      this._apply();
    } else {
      this.needsApply = true;
    }
  };

  Focus.prototype._apply = function _apply() {
    var _this = this;

    if (this.value) {
      this.taskQueue.queueMicroTask(function () {
        if (_this.value) {
          _this.element.focus();
        }
      });
    } else {
      this.element.blur();
    }
  };

  Focus.prototype.attached = function attached() {
    this.isAttached = true;
    if (this.needsApply) {
      this.needsApply = false;
      this._apply();
    }
    this.element.addEventListener('focus', this);
    this.element.addEventListener('blur', this);
  };

  Focus.prototype.detached = function detached() {
    this.isAttached = false;
    this.element.removeEventListener('focus', this);
    this.element.removeEventListener('blur', this);
  };

  Focus.prototype.handleEvent = function handleEvent(e) {
    if (e.type === 'focus') {
      this.value = true;
    } else if (_aureliaPal.DOM.activeElement !== this.element) {
      this.value = false;
    }
  };

  return Focus;
}()) || _class);

/***/ },

/***/ "aurelia-templating-resources/hide.js":
/***/ function(module, exports, __webpack_require__) {

"use strict";
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Hide = undefined;

var _dec, _class;

var _aureliaDependencyInjection = __webpack_require__(7);

var _aureliaTemplating = __webpack_require__(20);

var _aureliaPal = __webpack_require__(21);

var _aureliaHideStyle = __webpack_require__(194);



var Hide = exports.Hide = (_dec = (0, _aureliaTemplating.customAttribute)('hide'), _dec(_class = function () {
  Hide.inject = function inject() {
    return [_aureliaPal.DOM.Element, _aureliaTemplating.Animator, _aureliaDependencyInjection.Optional.of(_aureliaPal.DOM.boundary, true)];
  };

  function Hide(element, animator, domBoundary) {
    

    this.element = element;
    this.animator = animator;
    this.domBoundary = domBoundary;
  }

  Hide.prototype.created = function created() {
    (0, _aureliaHideStyle.injectAureliaHideStyleAtBoundary)(this.domBoundary);
  };

  Hide.prototype.valueChanged = function valueChanged(newValue) {
    if (newValue) {
      this.animator.addClass(this.element, _aureliaHideStyle.aureliaHideClassName);
    } else {
      this.animator.removeClass(this.element, _aureliaHideStyle.aureliaHideClassName);
    }
  };

  Hide.prototype.bind = function bind(bindingContext) {
    this.valueChanged(this.value);
  };

  return Hide;
}()) || _class);

/***/ },

/***/ "aurelia-templating-resources/if.js":
/***/ function(module, exports, __webpack_require__) {

"use strict";
/* WEBPACK VAR INJECTION */(function(Promise) {'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.If = undefined;

var _dec, _dec2, _dec3, _class, _desc, _value, _class2, _descriptor, _descriptor2;

var _aureliaTemplating = __webpack_require__(20);

var _aureliaDependencyInjection = __webpack_require__(7);

var _ifCore = __webpack_require__(299);

function _initDefineProp(target, property, descriptor, context) {
  if (!descriptor) return;
  Object.defineProperty(target, property, {
    enumerable: descriptor.enumerable,
    configurable: descriptor.configurable,
    writable: descriptor.writable,
    value: descriptor.initializer ? descriptor.initializer.call(context) : void 0
  });
}



function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

function _applyDecoratedDescriptor(target, property, decorators, descriptor, context) {
  var desc = {};
  Object['ke' + 'ys'](descriptor).forEach(function (key) {
    desc[key] = descriptor[key];
  });
  desc.enumerable = !!desc.enumerable;
  desc.configurable = !!desc.configurable;

  if ('value' in desc || desc.initializer) {
    desc.writable = true;
  }

  desc = decorators.slice().reverse().reduce(function (desc, decorator) {
    return decorator(target, property, desc) || desc;
  }, desc);

  if (context && desc.initializer !== void 0) {
    desc.value = desc.initializer ? desc.initializer.call(context) : void 0;
    desc.initializer = undefined;
  }

  if (desc.initializer === void 0) {
    Object['define' + 'Property'](target, property, desc);
    desc = null;
  }

  return desc;
}

function _initializerWarningHelper(descriptor, context) {
  throw new Error('Decorating class property failed. Please ensure that transform-class-properties is enabled.');
}

var If = exports.If = (_dec = (0, _aureliaTemplating.customAttribute)('if'), _dec2 = (0, _aureliaDependencyInjection.inject)(_aureliaTemplating.BoundViewFactory, _aureliaTemplating.ViewSlot), _dec3 = (0, _aureliaTemplating.bindable)({ primaryProperty: true }), _dec(_class = (0, _aureliaTemplating.templateController)(_class = _dec2(_class = (_class2 = function (_IfCore) {
  _inherits(If, _IfCore);

  function If() {
    var _temp, _this, _ret;

    

    for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
      args[_key] = arguments[_key];
    }

    return _ret = (_temp = (_this = _possibleConstructorReturn(this, _IfCore.call.apply(_IfCore, [this].concat(args))), _this), _initDefineProp(_this, 'condition', _descriptor, _this), _initDefineProp(_this, 'swapOrder', _descriptor2, _this), _temp), _possibleConstructorReturn(_this, _ret);
  }

  If.prototype.bind = function bind(bindingContext, overrideContext) {
    _IfCore.prototype.bind.call(this, bindingContext, overrideContext);
    if (this.condition) {
      this._show();
    } else {
      this._hide();
    }
  };

  If.prototype.conditionChanged = function conditionChanged(newValue) {
    this._update(newValue);
  };

  If.prototype._update = function _update(show) {
    var _this2 = this;

    if (this.animating) {
      return;
    }

    var promise = void 0;
    if (this.elseVm) {
      promise = show ? this._swap(this.elseVm, this) : this._swap(this, this.elseVm);
    } else {
      promise = show ? this._show() : this._hide();
    }

    if (promise) {
      this.animating = true;
      promise.then(function () {
        _this2.animating = false;
        if (_this2.condition !== _this2.showing) {
          _this2._update(_this2.condition);
        }
      });
    }
  };

  If.prototype._swap = function _swap(remove, add) {
    switch (this.swapOrder) {
      case 'before':
        return Promise.resolve(add._show()).then(function () {
          return remove._hide();
        });
      case 'with':
        return Promise.all([remove._hide(), add._show()]);
      default:
        var promise = remove._hide();
        return promise ? promise.then(function () {
          return add._show();
        }) : add._show();
    }
  };

  return If;
}(_ifCore.IfCore), (_descriptor = _applyDecoratedDescriptor(_class2.prototype, 'condition', [_dec3], {
  enumerable: true,
  initializer: null
}), _descriptor2 = _applyDecoratedDescriptor(_class2.prototype, 'swapOrder', [_aureliaTemplating.bindable], {
  enumerable: true,
  initializer: null
})), _class2)) || _class) || _class) || _class);
/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__("bluebird")))

/***/ },

/***/ "aurelia-templating-resources/repeat.js":
/***/ function(module, exports, __webpack_require__) {

"use strict";
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Repeat = undefined;

var _dec, _dec2, _class, _desc, _value, _class2, _descriptor, _descriptor2, _descriptor3, _descriptor4;

var _aureliaDependencyInjection = __webpack_require__(7);

var _aureliaBinding = __webpack_require__(24);

var _aureliaTemplating = __webpack_require__(20);

var _repeatStrategyLocator = __webpack_require__(303);

var _repeatUtilities = __webpack_require__(104);

var _analyzeViewFactory = __webpack_require__(295);

var _abstractRepeater = __webpack_require__(294);

function _initDefineProp(target, property, descriptor, context) {
  if (!descriptor) return;
  Object.defineProperty(target, property, {
    enumerable: descriptor.enumerable,
    configurable: descriptor.configurable,
    writable: descriptor.writable,
    value: descriptor.initializer ? descriptor.initializer.call(context) : void 0
  });
}



function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

function _applyDecoratedDescriptor(target, property, decorators, descriptor, context) {
  var desc = {};
  Object['ke' + 'ys'](descriptor).forEach(function (key) {
    desc[key] = descriptor[key];
  });
  desc.enumerable = !!desc.enumerable;
  desc.configurable = !!desc.configurable;

  if ('value' in desc || desc.initializer) {
    desc.writable = true;
  }

  desc = decorators.slice().reverse().reduce(function (desc, decorator) {
    return decorator(target, property, desc) || desc;
  }, desc);

  if (context && desc.initializer !== void 0) {
    desc.value = desc.initializer ? desc.initializer.call(context) : void 0;
    desc.initializer = undefined;
  }

  if (desc.initializer === void 0) {
    Object['define' + 'Property'](target, property, desc);
    desc = null;
  }

  return desc;
}

function _initializerWarningHelper(descriptor, context) {
  throw new Error('Decorating class property failed. Please ensure that transform-class-properties is enabled.');
}

var Repeat = exports.Repeat = (_dec = (0, _aureliaTemplating.customAttribute)('repeat'), _dec2 = (0, _aureliaDependencyInjection.inject)(_aureliaTemplating.BoundViewFactory, _aureliaTemplating.TargetInstruction, _aureliaTemplating.ViewSlot, _aureliaTemplating.ViewResources, _aureliaBinding.ObserverLocator, _repeatStrategyLocator.RepeatStrategyLocator), _dec(_class = (0, _aureliaTemplating.templateController)(_class = _dec2(_class = (_class2 = function (_AbstractRepeater) {
  _inherits(Repeat, _AbstractRepeater);

  function Repeat(viewFactory, instruction, viewSlot, viewResources, observerLocator, strategyLocator) {
    

    var _this = _possibleConstructorReturn(this, _AbstractRepeater.call(this, {
      local: 'item',
      viewsRequireLifecycle: (0, _analyzeViewFactory.viewsRequireLifecycle)(viewFactory)
    }));

    _initDefineProp(_this, 'items', _descriptor, _this);

    _initDefineProp(_this, 'local', _descriptor2, _this);

    _initDefineProp(_this, 'key', _descriptor3, _this);

    _initDefineProp(_this, 'value', _descriptor4, _this);

    _this.viewFactory = viewFactory;
    _this.instruction = instruction;
    _this.viewSlot = viewSlot;
    _this.lookupFunctions = viewResources.lookupFunctions;
    _this.observerLocator = observerLocator;
    _this.key = 'key';
    _this.value = 'value';
    _this.strategyLocator = strategyLocator;
    _this.ignoreMutation = false;
    _this.sourceExpression = (0, _repeatUtilities.getItemsSourceExpression)(_this.instruction, 'repeat.for');
    _this.isOneTime = (0, _repeatUtilities.isOneTime)(_this.sourceExpression);
    _this.viewsRequireLifecycle = (0, _analyzeViewFactory.viewsRequireLifecycle)(viewFactory);
    return _this;
  }

  Repeat.prototype.call = function call(context, changes) {
    this[context](this.items, changes);
  };

  Repeat.prototype.bind = function bind(bindingContext, overrideContext) {
    this.scope = { bindingContext: bindingContext, overrideContext: overrideContext };
    this.matcherBinding = this._captureAndRemoveMatcherBinding();
    this.itemsChanged();
  };

  Repeat.prototype.unbind = function unbind() {
    this.scope = null;
    this.items = null;
    this.matcherBinding = null;
    this.viewSlot.removeAll(true, true);
    this._unsubscribeCollection();
  };

  Repeat.prototype._unsubscribeCollection = function _unsubscribeCollection() {
    if (this.collectionObserver) {
      this.collectionObserver.unsubscribe(this.callContext, this);
      this.collectionObserver = null;
      this.callContext = null;
    }
  };

  Repeat.prototype.itemsChanged = function itemsChanged() {
    var _this2 = this;

    this._unsubscribeCollection();

    if (!this.scope) {
      return;
    }

    var items = this.items;
    this.strategy = this.strategyLocator.getStrategy(items);
    if (!this.strategy) {
      throw new Error('Value for \'' + this.sourceExpression + '\' is non-repeatable');
    }

    if (!this.isOneTime && !this._observeInnerCollection()) {
      this._observeCollection();
    }
    this.ignoreMutation = true;
    this.strategy.instanceChanged(this, items);
    this.observerLocator.taskQueue.queueMicroTask(function () {
      _this2.ignoreMutation = false;
    });
  };

  Repeat.prototype._getInnerCollection = function _getInnerCollection() {
    var expression = (0, _repeatUtilities.unwrapExpression)(this.sourceExpression);
    if (!expression) {
      return null;
    }
    return expression.evaluate(this.scope, null);
  };

  Repeat.prototype.handleCollectionMutated = function handleCollectionMutated(collection, changes) {
    if (!this.collectionObserver) {
      return;
    }
    if (this.ignoreMutation) {
      return;
    }
    this.strategy.instanceMutated(this, collection, changes);
  };

  Repeat.prototype.handleInnerCollectionMutated = function handleInnerCollectionMutated(collection, changes) {
    var _this3 = this;

    if (!this.collectionObserver) {
      return;
    }

    if (this.ignoreMutation) {
      return;
    }
    this.ignoreMutation = true;
    var newItems = this.sourceExpression.evaluate(this.scope, this.lookupFunctions);
    this.observerLocator.taskQueue.queueMicroTask(function () {
      return _this3.ignoreMutation = false;
    });

    if (newItems === this.items) {
      this.itemsChanged();
    } else {
      this.items = newItems;
    }
  };

  Repeat.prototype._observeInnerCollection = function _observeInnerCollection() {
    var items = this._getInnerCollection();
    var strategy = this.strategyLocator.getStrategy(items);
    if (!strategy) {
      return false;
    }
    this.collectionObserver = strategy.getCollectionObserver(this.observerLocator, items);
    if (!this.collectionObserver) {
      return false;
    }
    this.callContext = 'handleInnerCollectionMutated';
    this.collectionObserver.subscribe(this.callContext, this);
    return true;
  };

  Repeat.prototype._observeCollection = function _observeCollection() {
    var items = this.items;
    this.collectionObserver = this.strategy.getCollectionObserver(this.observerLocator, items);
    if (this.collectionObserver) {
      this.callContext = 'handleCollectionMutated';
      this.collectionObserver.subscribe(this.callContext, this);
    }
  };

  Repeat.prototype._captureAndRemoveMatcherBinding = function _captureAndRemoveMatcherBinding() {
    if (this.viewFactory.viewFactory) {
      var instructions = this.viewFactory.viewFactory.instructions;
      var instructionIds = Object.keys(instructions);
      for (var i = 0; i < instructionIds.length; i++) {
        var expressions = instructions[instructionIds[i]].expressions;
        if (expressions) {
          for (var ii = 0; i < expressions.length; i++) {
            if (expressions[ii].targetProperty === 'matcher') {
              var matcherBinding = expressions[ii];
              expressions.splice(ii, 1);
              return matcherBinding;
            }
          }
        }
      }
    }

    return undefined;
  };

  Repeat.prototype.viewCount = function viewCount() {
    return this.viewSlot.children.length;
  };

  Repeat.prototype.views = function views() {
    return this.viewSlot.children;
  };

  Repeat.prototype.view = function view(index) {
    return this.viewSlot.children[index];
  };

  Repeat.prototype.matcher = function matcher() {
    return this.matcherBinding ? this.matcherBinding.sourceExpression.evaluate(this.scope, this.matcherBinding.lookupFunctions) : null;
  };

  Repeat.prototype.addView = function addView(bindingContext, overrideContext) {
    var view = this.viewFactory.create();
    view.bind(bindingContext, overrideContext);
    this.viewSlot.add(view);
  };

  Repeat.prototype.insertView = function insertView(index, bindingContext, overrideContext) {
    var view = this.viewFactory.create();
    view.bind(bindingContext, overrideContext);
    this.viewSlot.insert(index, view);
  };

  Repeat.prototype.moveView = function moveView(sourceIndex, targetIndex) {
    this.viewSlot.move(sourceIndex, targetIndex);
  };

  Repeat.prototype.removeAllViews = function removeAllViews(returnToCache, skipAnimation) {
    return this.viewSlot.removeAll(returnToCache, skipAnimation);
  };

  Repeat.prototype.removeViews = function removeViews(viewsToRemove, returnToCache, skipAnimation) {
    return this.viewSlot.removeMany(viewsToRemove, returnToCache, skipAnimation);
  };

  Repeat.prototype.removeView = function removeView(index, returnToCache, skipAnimation) {
    return this.viewSlot.removeAt(index, returnToCache, skipAnimation);
  };

  Repeat.prototype.updateBindings = function updateBindings(view) {
    var j = view.bindings.length;
    while (j--) {
      (0, _repeatUtilities.updateOneTimeBinding)(view.bindings[j]);
    }
    j = view.controllers.length;
    while (j--) {
      var k = view.controllers[j].boundProperties.length;
      while (k--) {
        var binding = view.controllers[j].boundProperties[k].binding;
        (0, _repeatUtilities.updateOneTimeBinding)(binding);
      }
    }
  };

  return Repeat;
}(_abstractRepeater.AbstractRepeater), (_descriptor = _applyDecoratedDescriptor(_class2.prototype, 'items', [_aureliaTemplating.bindable], {
  enumerable: true,
  initializer: null
}), _descriptor2 = _applyDecoratedDescriptor(_class2.prototype, 'local', [_aureliaTemplating.bindable], {
  enumerable: true,
  initializer: null
}), _descriptor3 = _applyDecoratedDescriptor(_class2.prototype, 'key', [_aureliaTemplating.bindable], {
  enumerable: true,
  initializer: null
}), _descriptor4 = _applyDecoratedDescriptor(_class2.prototype, 'value', [_aureliaTemplating.bindable], {
  enumerable: true,
  initializer: null
})), _class2)) || _class) || _class) || _class);

/***/ },

/***/ "aurelia-templating-resources/replaceable.js":
/***/ function(module, exports, __webpack_require__) {

"use strict";
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Replaceable = undefined;

var _dec, _dec2, _class;

var _aureliaDependencyInjection = __webpack_require__(7);

var _aureliaTemplating = __webpack_require__(20);



var Replaceable = exports.Replaceable = (_dec = (0, _aureliaTemplating.customAttribute)('replaceable'), _dec2 = (0, _aureliaDependencyInjection.inject)(_aureliaTemplating.BoundViewFactory, _aureliaTemplating.ViewSlot), _dec(_class = (0, _aureliaTemplating.templateController)(_class = _dec2(_class = function () {
  function Replaceable(viewFactory, viewSlot) {
    

    this.viewFactory = viewFactory;
    this.viewSlot = viewSlot;
    this.view = null;
  }

  Replaceable.prototype.bind = function bind(bindingContext, overrideContext) {
    if (this.view === null) {
      this.view = this.viewFactory.create();
      this.viewSlot.add(this.view);
    }

    this.view.bind(bindingContext, overrideContext);
  };

  Replaceable.prototype.unbind = function unbind() {
    this.view.unbind();
  };

  return Replaceable;
}()) || _class) || _class) || _class);

/***/ },

/***/ "aurelia-templating-resources/sanitize-html.js":
/***/ function(module, exports, __webpack_require__) {

"use strict";
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.SanitizeHTMLValueConverter = undefined;

var _dec, _dec2, _class;

var _aureliaBinding = __webpack_require__(24);

var _aureliaDependencyInjection = __webpack_require__(7);

var _htmlSanitizer = __webpack_require__(298);



var SanitizeHTMLValueConverter = exports.SanitizeHTMLValueConverter = (_dec = (0, _aureliaBinding.valueConverter)('sanitizeHTML'), _dec2 = (0, _aureliaDependencyInjection.inject)(_htmlSanitizer.HTMLSanitizer), _dec(_class = _dec2(_class = function () {
  function SanitizeHTMLValueConverter(sanitizer) {
    

    this.sanitizer = sanitizer;
  }

  SanitizeHTMLValueConverter.prototype.toView = function toView(untrustedMarkup) {
    if (untrustedMarkup === null || untrustedMarkup === undefined) {
      return null;
    }

    return this.sanitizer.sanitize(untrustedMarkup);
  };

  return SanitizeHTMLValueConverter;
}()) || _class) || _class);

/***/ },

/***/ "aurelia-templating-resources/self-binding-behavior.js":
/***/ function(module, exports, __webpack_require__) {

"use strict";
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.SelfBindingBehavior = undefined;

var _dec, _class;

var _aureliaBinding = __webpack_require__(24);



function findOriginalEventTarget(event) {
  return event.path && event.path[0] || event.deepPath && event.deepPath[0] || event.target;
}

function handleSelfEvent(event) {
  var target = findOriginalEventTarget(event);
  if (this.target !== target) return;
  this.selfEventCallSource(event);
}

var SelfBindingBehavior = exports.SelfBindingBehavior = (_dec = (0, _aureliaBinding.bindingBehavior)('self'), _dec(_class = function () {
  function SelfBindingBehavior() {
    
  }

  SelfBindingBehavior.prototype.bind = function bind(binding, source) {
    if (!binding.callSource || !binding.targetEvent) throw new Error('Self binding behavior only supports event.');
    binding.selfEventCallSource = binding.callSource;
    binding.callSource = handleSelfEvent;
  };

  SelfBindingBehavior.prototype.unbind = function unbind(binding, source) {
    binding.callSource = binding.selfEventCallSource;
    binding.selfEventCallSource = null;
  };

  return SelfBindingBehavior;
}()) || _class);

/***/ },

/***/ "aurelia-templating-resources/show.js":
/***/ function(module, exports, __webpack_require__) {

"use strict";
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Show = undefined;

var _dec, _class;

var _aureliaDependencyInjection = __webpack_require__(7);

var _aureliaTemplating = __webpack_require__(20);

var _aureliaPal = __webpack_require__(21);

var _aureliaHideStyle = __webpack_require__(194);



var Show = exports.Show = (_dec = (0, _aureliaTemplating.customAttribute)('show'), _dec(_class = function () {
  Show.inject = function inject() {
    return [_aureliaPal.DOM.Element, _aureliaTemplating.Animator, _aureliaDependencyInjection.Optional.of(_aureliaPal.DOM.boundary, true)];
  };

  function Show(element, animator, domBoundary) {
    

    this.element = element;
    this.animator = animator;
    this.domBoundary = domBoundary;
  }

  Show.prototype.created = function created() {
    (0, _aureliaHideStyle.injectAureliaHideStyleAtBoundary)(this.domBoundary);
  };

  Show.prototype.valueChanged = function valueChanged(newValue) {
    if (newValue) {
      this.animator.removeClass(this.element, _aureliaHideStyle.aureliaHideClassName);
    } else {
      this.animator.addClass(this.element, _aureliaHideStyle.aureliaHideClassName);
    }
  };

  Show.prototype.bind = function bind(bindingContext) {
    this.valueChanged(this.value);
  };

  return Show;
}()) || _class);

/***/ },

/***/ "aurelia-templating-resources/signal-binding-behavior.js":
/***/ function(module, exports, __webpack_require__) {

"use strict";
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.SignalBindingBehavior = undefined;

var _dec, _class;

var _aureliaBinding = __webpack_require__(24);

var _bindingSignaler = __webpack_require__(297);



var SignalBindingBehavior = exports.SignalBindingBehavior = (_dec = (0, _aureliaBinding.bindingBehavior)('signal'), _dec(_class = function () {
  SignalBindingBehavior.inject = function inject() {
    return [_bindingSignaler.BindingSignaler];
  };

  function SignalBindingBehavior(bindingSignaler) {
    

    this.signals = bindingSignaler.signals;
  }

  SignalBindingBehavior.prototype.bind = function bind(binding, source) {
    if (!binding.updateTarget) {
      throw new Error('Only property bindings and string interpolation bindings can be signaled.  Trigger, delegate and call bindings cannot be signaled.');
    }
    if (arguments.length === 3) {
      var name = arguments[2];
      var bindings = this.signals[name] || (this.signals[name] = []);
      bindings.push(binding);
      binding.signalName = name;
    } else if (arguments.length > 3) {
      var names = Array.prototype.slice.call(arguments, 2);
      var i = names.length;
      while (i--) {
        var _name = names[i];
        var _bindings = this.signals[_name] || (this.signals[_name] = []);
        _bindings.push(binding);
      }
      binding.signalName = names;
    } else {
      throw new Error('Signal name is required.');
    }
  };

  SignalBindingBehavior.prototype.unbind = function unbind(binding, source) {
    var name = binding.signalName;
    binding.signalName = null;
    if (Array.isArray(name)) {
      var names = name;
      var i = names.length;
      while (i--) {
        var n = names[i];
        var bindings = this.signals[n];
        bindings.splice(bindings.indexOf(binding), 1);
      }
    } else {
      var _bindings2 = this.signals[name];
      _bindings2.splice(_bindings2.indexOf(binding), 1);
    }
  };

  return SignalBindingBehavior;
}()) || _class);

/***/ },

/***/ "aurelia-templating-resources/throttle-binding-behavior.js":
/***/ function(module, exports, __webpack_require__) {

"use strict";
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.ThrottleBindingBehavior = undefined;

var _dec, _class;

var _aureliaBinding = __webpack_require__(24);



function throttle(newValue) {
  var _this = this;

  var state = this.throttleState;
  var elapsed = +new Date() - state.last;
  if (elapsed >= state.delay) {
    clearTimeout(state.timeoutId);
    state.timeoutId = null;
    state.last = +new Date();
    this.throttledMethod(newValue);
    return;
  }
  state.newValue = newValue;
  if (state.timeoutId === null) {
    state.timeoutId = setTimeout(function () {
      state.timeoutId = null;
      state.last = +new Date();
      _this.throttledMethod(state.newValue);
    }, state.delay - elapsed);
  }
}

var ThrottleBindingBehavior = exports.ThrottleBindingBehavior = (_dec = (0, _aureliaBinding.bindingBehavior)('throttle'), _dec(_class = function () {
  function ThrottleBindingBehavior() {
    
  }

  ThrottleBindingBehavior.prototype.bind = function bind(binding, source) {
    var delay = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 200;

    var methodToThrottle = 'updateTarget';
    if (binding.callSource) {
      methodToThrottle = 'callSource';
    } else if (binding.updateSource && binding.mode === _aureliaBinding.bindingMode.twoWay) {
      methodToThrottle = 'updateSource';
    }

    binding.throttledMethod = binding[methodToThrottle];
    binding.throttledMethod.originalName = methodToThrottle;

    binding[methodToThrottle] = throttle;

    binding.throttleState = {
      delay: delay,
      last: 0,
      timeoutId: null
    };
  };

  ThrottleBindingBehavior.prototype.unbind = function unbind(binding, source) {
    var methodToRestore = binding.throttledMethod.originalName;
    binding[methodToRestore] = binding.throttledMethod;
    binding.throttledMethod = null;
    clearTimeout(binding.throttleState.timeoutId);
    binding.throttleState = null;
  };

  return ThrottleBindingBehavior;
}()) || _class);

/***/ },

/***/ "aurelia-templating-resources/update-trigger-binding-behavior.js":
/***/ function(module, exports, __webpack_require__) {

"use strict";
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.UpdateTriggerBindingBehavior = undefined;

var _dec, _class;

var _aureliaBinding = __webpack_require__(24);



var eventNamesRequired = 'The updateTrigger binding behavior requires at least one event name argument: eg <input value.bind="firstName & updateTrigger:\'blur\'">';
var notApplicableMessage = 'The updateTrigger binding behavior can only be applied to two-way/ from-view bindings on input/select elements.';

var UpdateTriggerBindingBehavior = exports.UpdateTriggerBindingBehavior = (_dec = (0, _aureliaBinding.bindingBehavior)('updateTrigger'), _dec(_class = function () {
  function UpdateTriggerBindingBehavior() {
    
  }

  UpdateTriggerBindingBehavior.prototype.bind = function bind(binding, source) {
    for (var _len = arguments.length, events = Array(_len > 2 ? _len - 2 : 0), _key = 2; _key < _len; _key++) {
      events[_key - 2] = arguments[_key];
    }

    if (events.length === 0) {
      throw new Error(eventNamesRequired);
    }
    if (binding.mode !== _aureliaBinding.bindingMode.twoWay && binding.mode !== _aureliaBinding.bindingMode.fromView) {
      throw new Error(notApplicableMessage);
    }

    var targetObserver = binding.observerLocator.getObserver(binding.target, binding.targetProperty);
    if (!targetObserver.handler) {
      throw new Error(notApplicableMessage);
    }
    binding.targetObserver = targetObserver;

    targetObserver.originalHandler = binding.targetObserver.handler;

    var handler = new _aureliaBinding.EventSubscriber(events);
    targetObserver.handler = handler;
  };

  UpdateTriggerBindingBehavior.prototype.unbind = function unbind(binding, source) {
    binding.targetObserver.handler.dispose();
    binding.targetObserver.handler = binding.targetObserver.originalHandler;
    binding.targetObserver.originalHandler = null;
  };

  return UpdateTriggerBindingBehavior;
}()) || _class);

/***/ },

/***/ "aurelia-templating-resources/with.js":
/***/ function(module, exports, __webpack_require__) {

"use strict";
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.With = undefined;

var _dec, _dec2, _class;

var _aureliaDependencyInjection = __webpack_require__(7);

var _aureliaTemplating = __webpack_require__(20);

var _aureliaBinding = __webpack_require__(24);



var With = exports.With = (_dec = (0, _aureliaTemplating.customAttribute)('with'), _dec2 = (0, _aureliaDependencyInjection.inject)(_aureliaTemplating.BoundViewFactory, _aureliaTemplating.ViewSlot), _dec(_class = (0, _aureliaTemplating.templateController)(_class = _dec2(_class = function () {
  function With(viewFactory, viewSlot) {
    

    this.viewFactory = viewFactory;
    this.viewSlot = viewSlot;
    this.parentOverrideContext = null;
    this.view = null;
  }

  With.prototype.bind = function bind(bindingContext, overrideContext) {
    this.parentOverrideContext = overrideContext;
    this.valueChanged(this.value);
  };

  With.prototype.valueChanged = function valueChanged(newValue) {
    var overrideContext = (0, _aureliaBinding.createOverrideContext)(newValue, this.parentOverrideContext);
    if (!this.view) {
      this.view = this.viewFactory.create();
      this.view.bind(newValue, overrideContext);
      this.viewSlot.add(this.view);
    } else {
      this.view.bind(newValue, overrideContext);
    }
  };

  With.prototype.unbind = function unbind() {
    this.parentOverrideContext = null;

    if (this.view) {
      this.view.unbind();
    }
  };

  return With;
}()) || _class) || _class) || _class);

/***/ },

/***/ "aurelia-templating-router":
/***/ function(module, exports, __webpack_require__) {

"use strict";
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.configure = exports.RouteHref = exports.RouterView = exports.TemplatingRouteLoader = undefined;

var _aureliaRouter = __webpack_require__("aurelia-router");

var _routeLoader = __webpack_require__(605);

var _routerView = __webpack_require__(305);

var _routeHref = __webpack_require__(604);

function configure(config) {
  config.singleton(_aureliaRouter.RouteLoader, _routeLoader.TemplatingRouteLoader).singleton(_aureliaRouter.Router, _aureliaRouter.AppRouter).globalResources(_routerView.RouterView, _routeHref.RouteHref);

  config.container.registerAlias(_aureliaRouter.Router, _aureliaRouter.AppRouter);
}

exports.TemplatingRouteLoader = _routeLoader.TemplatingRouteLoader;
exports.RouterView = _routerView.RouterView;
exports.RouteHref = _routeHref.RouteHref;
exports.configure = configure;

/***/ }

},[1222]);
//# sourceMappingURL=aurelia.a7a0e52d2cabe0a9a65f.bundle.map