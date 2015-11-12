'use strict';

var TestHelper = require('../../../TestHelper');

var TestContainer = require('mocha-test-container-support');

/* global bootstrapModeler, inject */

var propertiesPanelModule = require('../../../../lib'),
  domQuery = require('min-dom/lib/query'),
  coreModule = require('bpmn-js/lib/core'),
  selectionModule = require('diagram-js/lib/features/selection'),
  modelingModule = require('bpmn-js/lib/features/modeling'),
  propertiesProviderModule = require('../../../../lib/provider/camunda'),
  camundaModdlePackage = require('camunda-bpmn-moddle/resources/camunda'),
  getBusinessObject = require('bpmn-js/lib/util/ModelUtil').getBusinessObject;

describe('script-properties', function() {

  var diagramXML = require('./ScriptProperties.bpmn');

  var testModules = [
    coreModule, selectionModule, modelingModule,
    propertiesPanelModule,
    propertiesProviderModule
  ];

  var container;

  beforeEach(function() {
    container = TestContainer.get(this);
  });

  beforeEach(bootstrapModeler(diagramXML, {
    modules: testModules,
    moddleExtensions: {camunda: camundaModdlePackage}
  }));


  beforeEach(inject(function(commandStack) {

    var undoButton = document.createElement('button');
    undoButton.textContent = 'UNDO';

    undoButton.addEventListener('click', function() {
      commandStack.undo();
    });

    container.appendChild(undoButton);
  }));

  it('should fetch the inline script properties of a script task',
      inject(function(propertiesPanel, selection, elementRegistry) {

    propertiesPanel.attachTo(container);

    var shape = elementRegistry.get('ScriptTask_1');
    selection.select(shape);

    var scriptFormat = domQuery('input[name=scriptFormat]', propertiesPanel._container),
        scriptType = domQuery('select[name="scriptType"]', propertiesPanel._container),
        scriptValue = domQuery('textarea[name="scriptValue"]', propertiesPanel._container),
        businessObject = getBusinessObject(shape);

    expect(scriptFormat.value).to.equal('groovy');
    expect(scriptType.value).to.equal('script');
    expect(scriptValue.value).to.equal('printf(\'hello world\')');
    expect(businessObject.get('scriptFormat')).to.equal(scriptFormat.value);
    expect(businessObject.get('script')).to.equal(scriptValue.value);

  }));

  it('should fetch the external resource script properties of a script task',
      inject(function(propertiesPanel, selection, elementRegistry) {

    propertiesPanel.attachTo(container);

    var shape = elementRegistry.get('ScriptTask_Resource');
    selection.select(shape);

    var scriptFormat = domQuery('input[name=scriptFormat]', propertiesPanel._container),
        scriptType = domQuery('select[name="scriptType"]', propertiesPanel._container),
        scriptResourceValue = domQuery('input[name="scriptResourceValue"]', propertiesPanel._container),
        scriptResultVariable = domQuery('input[name="scriptResultVariable"]', propertiesPanel._container),
        businessObject = getBusinessObject(shape);

    expect(scriptFormat.value).to.equal('dmn');
    expect(scriptType.value).to.equal('scriptResource');
    expect(scriptResourceValue.value).to.equal('org/camunda/bpm/DmnScriptTaskTest.dmn10.xml');
    expect(scriptResultVariable.value).to.equal('decisionResult');
    expect(businessObject.get('scriptFormat')).to.equal(scriptFormat.value);
    expect(businessObject.get('camunda:resource')).to.equal(scriptResourceValue.value);
    expect(businessObject.get('camunda:resultVariable')).to.equal(scriptResultVariable.value);

  }));

  it('should fill script properties to an empty script task',
      inject(function(propertiesPanel, selection, elementRegistry) {

    propertiesPanel.attachTo(container);

    var shape = elementRegistry.get('ScriptTask_Empty');
    selection.select(shape);

    var scriptFormat = domQuery('input[name=scriptFormat]', propertiesPanel._container),
        scriptType = domQuery('select[name="scriptType"]', propertiesPanel._container),
        scriptValue = domQuery('textarea[name="scriptValue"]', propertiesPanel._container),
        scriptResultVariable = domQuery('input[name="scriptResultVariable"]', propertiesPanel._container),
        businessObject = getBusinessObject(shape);

    // given
    expect(scriptFormat.value).is.empty;
    // 'script' is the default value
    expect(scriptType.value).to.equal('script');
    expect(scriptValue.value).is.empty;
    expect(scriptResultVariable.value).is.empty;
    expect(businessObject).to.not.have.property('scriptFormat');
    expect(businessObject).to.not.have.property('script');
    expect(businessObject).to.not.have.property('camunda:resultVariable');
    expect(businessObject).to.not.have.property('camunda:resource');

    // when
    TestHelper.triggerValue(scriptFormat, 'groovy');
    TestHelper.triggerValue(scriptValue, 'printf(\'my first script\')');
    TestHelper.triggerValue(scriptResultVariable, 'myVar');

    // then
    expect(scriptFormat.value).to.equal('groovy');
    expect(scriptType.value).to.equal('script');
    expect(scriptValue.value).to.equal('printf(\'my first script\')');
    expect(scriptResultVariable.value).to.equal('myVar');
    expect(businessObject.get('scriptFormat')).to.equal(scriptFormat.value);
    expect(businessObject.get('script')).to.equal(scriptValue.value);
    expect(businessObject.get('camunda:resultVariable')).to.equal(scriptResultVariable.value);
    expect(businessObject).to.not.have.property('camunda:resource');

  }));

  it('should change the script type from external resource to inline script for a script task',
      inject(function(propertiesPanel, selection, elementRegistry) {

    propertiesPanel.attachTo(container);

    var shape = elementRegistry.get('ScriptTask_Resource');
    selection.select(shape);

    var scriptFormat = domQuery('input[name=scriptFormat]', propertiesPanel._container),
        scriptType = domQuery('select[name="scriptType"]', propertiesPanel._container),
        scriptResourceValue = domQuery('input[name="scriptResourceValue"]', propertiesPanel._container),
        scriptValue = domQuery('textarea[name="scriptValue"]', propertiesPanel._container),
        scriptResultVariable = domQuery('input[name="scriptResultVariable"]', propertiesPanel._container),
        businessObject = getBusinessObject(shape);

    // given
    expect(scriptFormat.value).to.equal('dmn');
    expect(scriptType.value).to.equal('scriptResource');
    expect(scriptResourceValue.value).to.equal('org/camunda/bpm/DmnScriptTaskTest.dmn10.xml');
    expect(scriptResultVariable.value).to.equal('decisionResult');
    expect(scriptValue.value).is.empty;
    expect(businessObject.get('scriptFormat')).to.equal(scriptFormat.value);
    expect(businessObject.get('camunda:resource')).to.equal(scriptResourceValue.value);
    expect(businessObject.get('camunda:resultVariable')).to.equal(scriptResultVariable.value);

    // when
    // select 'inline script'
    scriptType.options[0].selected = 'selected';
    TestHelper.triggerEvent(scriptType, 'change');
    TestHelper.triggerValue(scriptValue, 'printf(\'hello world\')');

    // then
    expect(scriptFormat.value).to.equal('dmn');
    expect(scriptType.value).to.equal('script');
    expect(scriptValue.value).to.equal('printf(\'hello world\')');
    expect(scriptResourceValue.value).is.empty;
    expect(scriptResultVariable.value).to.equal('decisionResult');
    expect(businessObject.get('scriptFormat')).to.equal(scriptFormat.value);
    expect(businessObject).to.not.have.property('camunda:resource');
    expect(businessObject.get('script')).to.equal(scriptValue.value);
    expect(businessObject.get('camunda:resultVariable')).to.equal(scriptResultVariable.value);

  }));

  it('should remove the result variable value of a script task',
      inject(function(propertiesPanel, selection, elementRegistry) {

    propertiesPanel.attachTo(container);

    var shape = elementRegistry.get('ScriptTask_Resource');
    selection.select(shape);

    var scriptResultVariable = domQuery('input[name="scriptResultVariable"]', propertiesPanel._container),
        clearButton = domQuery('[data-entry=scriptResultVariable] > .field-wrapper > button[data-action=clear]',
                                propertiesPanel._container),
        businessObject = getBusinessObject(shape);

    // given
    expect(scriptResultVariable.value).to.equal('decisionResult');
    expect(businessObject.get('camunda:resultVariable')).to.equal(scriptResultVariable.value);

    // when
    TestHelper.triggerEvent(clearButton, 'click');

    // then
    expect(scriptResultVariable.value).is.empty;
    expect(businessObject).to.not.have.property('camunda:resultVariable');

  }));

  it('should remove the script format value of a script task',
      inject(function(propertiesPanel, selection, elementRegistry) {

    propertiesPanel.attachTo(container);

    var shape = elementRegistry.get('ScriptTask_1');
    selection.select(shape);

    var scriptFormat = domQuery('input[name="scriptFormat"]', propertiesPanel._container),
        clearButton = domQuery('[data-entry=script-implementation] > .pp-row > .field-wrapper > button[data-action=script\\\.clearScriptFormat]',
                                propertiesPanel._container),
        businessObject = getBusinessObject(shape);

    // given
    expect(scriptFormat.value).to.equal('groovy');
    expect(businessObject.get('scriptFormat')).to.equal(scriptFormat.value);

    // when
    TestHelper.triggerEvent(clearButton, 'click');

    // then
    expect(scriptFormat.value).is.empty;
    expect(businessObject.get('scriptFormat')).is.undefined;

  }));

  it('should not remove the script value of a script task',
      inject(function(propertiesPanel, selection, elementRegistry) {

    propertiesPanel.attachTo(container);

    var shape = elementRegistry.get('ScriptTask_1');
    selection.select(shape);

    var scriptValue = domQuery('textarea[name="scriptValue"]', propertiesPanel._container),
        clearButton = domQuery('[data-entry=script-implementation] > .pp-row > .field-wrapper > button[data-action=script\\\.clearScript]',
                                propertiesPanel._container),
        businessObject = getBusinessObject(shape);

    // given
    expect(scriptValue.value).to.equal('printf(\'hello world\')');
    expect(businessObject.get('script')).to.equal(scriptValue.value);

    // when
    TestHelper.triggerEvent(clearButton, 'click');

    // then
    expect(scriptValue.value).is.empty;
    expect(scriptValue.className).to.equal('invalid');
    expect(businessObject.get('script')).to.equal('printf(\'hello world\')');

  }));

  it('should not remove the script resource value of a script task',
      inject(function(propertiesPanel, selection, elementRegistry) {

    propertiesPanel.attachTo(container);

    var shape = elementRegistry.get('ScriptTask_Resource');
    selection.select(shape);

    var scriptResourceValue = domQuery('input[name="scriptResourceValue"]', propertiesPanel._container),
        clearButton = domQuery('[data-entry=script-implementation] > .pp-row > .field-wrapper > button[data-action=script\\\.clearScriptResource]',
                                propertiesPanel._container),
        businessObject = getBusinessObject(shape);

    // given
    expect(scriptResourceValue.value).to.equal('org/camunda/bpm/DmnScriptTaskTest.dmn10.xml');
    expect(businessObject.get('camunda:resource')).to.equal(scriptResourceValue.value);

    // when
    TestHelper.triggerEvent(clearButton, 'click');

    // then
    expect(scriptResourceValue.value).is.empty;
    expect(scriptResourceValue.className).to.equal('invalid');
    expect(businessObject.get('camunda:resource')).is.not.empty;

  }));

  it('should fetch the external resource script properties of a sequence flow',
      inject(function(propertiesPanel, selection, elementRegistry) {

    propertiesPanel.attachTo(container);

    var shape = elementRegistry.get('SequenceFlow_5');
    selection.select(shape);

    var conditionType = domQuery('select[name=conditionType]', propertiesPanel._container),
        scriptFormat = domQuery('input[name=scriptFormat]', propertiesPanel._container),
        scriptType = domQuery('select[name="scriptType"]', propertiesPanel._container),
        scriptResourceValue = domQuery('input[name="scriptResourceValue"]', propertiesPanel._container),
        businessObject = getBusinessObject(shape).conditionExpression;

    expect(conditionType.value).to.equal('script');
    expect(scriptFormat.value).to.equal('groovy');
    expect(scriptType.value).to.equal('scriptResource');
    expect(scriptResourceValue.value).to.equal('org/camunda/bpm/condition.groovy');
    expect(businessObject.get('language')).to.equal(scriptFormat.value);
    expect(businessObject.get('camunda:resource')).to.equal(scriptResourceValue.value);

  }));

  it('should fetch the inline script properties of a sequence flow',
      inject(function(propertiesPanel, selection, elementRegistry) {

    propertiesPanel.attachTo(container);

    var shape = elementRegistry.get('SequenceFlow_4');
    selection.select(shape);

    var conditionType = domQuery('select[name=conditionType]', propertiesPanel._container),
        scriptFormat = domQuery('input[name=scriptFormat]', propertiesPanel._container),
        scriptType = domQuery('select[name="scriptType"]', propertiesPanel._container),
        scriptValue = domQuery('textarea[name="scriptValue"]', propertiesPanel._container),
        businessObject = getBusinessObject(shape).conditionExpression;

    expect(conditionType.value).to.equal('script');
    expect(scriptFormat.value).to.equal('groovy');
    expect(scriptType.value).to.equal('script');
    expect(scriptValue.value).to.equal('status == \'complete\'');
    expect(businessObject.get('language')).to.equal(scriptFormat.value);
    expect(businessObject.body).to.equal(scriptValue.value);

  }));

  it('should add inline script properties for a sequence flow',
      inject(function(propertiesPanel, selection, elementRegistry) {

    propertiesPanel.attachTo(container);

    var shape = elementRegistry.get('SequenceFlow_1');
    selection.select(shape);

    var conditionType = domQuery('select[name=conditionType]', propertiesPanel._container),
        scriptFormat = domQuery('input[name=scriptFormat]', propertiesPanel._container),
        scriptType = domQuery('select[name="scriptType"]', propertiesPanel._container),
        scriptValue = domQuery('textarea[name="scriptValue"]', propertiesPanel._container),
        businessObject = getBusinessObject(shape);

    // given
    expect(businessObject).to.not.have.property('conditionExpression');

    // when
    // select 'script'
    conditionType.options[1].selected = 'selected';
    TestHelper.triggerEvent(conditionType, 'change');
    TestHelper.triggerValue(scriptFormat, 'groovy');
    TestHelper.triggerValue(scriptValue, 'status == \'complete\'');

    // then
    expect(conditionType.value).to.equal('script');
    expect(scriptFormat.value).to.equal('groovy');
    expect(scriptType.value).to.equal('script');
    expect(scriptValue.value).to.equal('status == \'complete\'');

    expect(businessObject.conditionExpression).is.not.empty;
    expect(businessObject.conditionExpression.get('language')).to.equal(scriptFormat.value);
    expect(businessObject.conditionExpression.body).to.equal(scriptValue.value);

  }));

  it('should change the script type from external resource to inline script for a sequence flow',
      inject(function(propertiesPanel, selection, elementRegistry) {

    propertiesPanel.attachTo(container);

    var shape = elementRegistry.get('SequenceFlow_5');
    selection.select(shape);

    var conditionType = domQuery('select[name=conditionType]', propertiesPanel._container),
        scriptFormat = domQuery('input[name=scriptFormat]', propertiesPanel._container),
        scriptType = domQuery('select[name="scriptType"]', propertiesPanel._container),
        scriptResourceValue = domQuery('input[name="scriptResourceValue"]', propertiesPanel._container),
        scriptValue = domQuery('textarea[name="scriptValue"]', propertiesPanel._container),
        businessObject = getBusinessObject(shape).conditionExpression;

    // given
    expect(conditionType.value).to.equal('script');
    expect(scriptFormat.value).to.equal('groovy');
    expect(scriptType.value).to.equal('scriptResource');
    expect(scriptResourceValue.value).to.equal('org/camunda/bpm/condition.groovy');
    expect(scriptValue.value).is.empty;
    expect(businessObject.get('language')).to.equal(scriptFormat.value);
    expect(businessObject.get('camunda:resource')).to.equal(scriptResourceValue.value);

    // when
    // select 'inline script'
    scriptType.options[0].selected = 'selected';
    TestHelper.triggerEvent(scriptType, 'change');
    TestHelper.triggerValue(scriptValue, 'printf(\'hello world\')');

    // then
    expect(scriptFormat.value).to.equal('groovy');
    expect(scriptType.value).to.equal('script');
    expect(scriptValue.value).to.equal('printf(\'hello world\')');
    expect(scriptResourceValue.value).is.empty;

    // refresh businessObject after changes
    businessObject = getBusinessObject(shape).conditionExpression;
    expect(businessObject.get('language')).to.equal(scriptFormat.value);
    expect(businessObject).to.not.have.property('camunda:resource');
    expect(businessObject.body).to.equal(scriptValue.value);

  }));

  it('should not remove the script format value of a sequence flow',
      inject(function(propertiesPanel, selection, elementRegistry) {

    propertiesPanel.attachTo(container);

    var shape = elementRegistry.get('SequenceFlow_4');
    selection.select(shape);

    var scriptFormat = domQuery('input[name="scriptFormat"]', propertiesPanel._container),
        clearButton = domQuery('[data-entry=condition] button[data-action=script\\\.clearScriptFormat]',
                                propertiesPanel._container),
        businessObject = getBusinessObject(shape).conditionExpression;

    // given
    expect(scriptFormat.value).to.equal('groovy');
    expect(businessObject.get('language')).to.equal(scriptFormat.value);

    // when
    TestHelper.triggerEvent(clearButton, 'click');

    // then
    expect(scriptFormat.value).is.empty;
    expect(scriptFormat.className).to.equal('invalid');
    expect(businessObject.get('language')).to.equal('groovy');

  }));

  it('should fetch the inline script properties of an execution listener',
      inject(function(propertiesPanel, selection, elementRegistry) {

    propertiesPanel.attachTo(container);

    var shape = elementRegistry.get('StartEvent_1');
    selection.select(shape);

    var eventType = domQuery('select[name=eventType]', propertiesPanel._container),
        listenerType = domQuery('select[name=listenerType]', propertiesPanel._container),
        scriptFormat = domQuery('input[name=scriptFormat]', propertiesPanel._container),
        scriptType = domQuery('select[name="scriptType"]', propertiesPanel._container),
        scriptValue = domQuery('textarea[name="scriptValue"]', propertiesPanel._container),
        businessObject = getBusinessObject(shape).extensionElements.values;

    expect(eventType.value).to.equal('start');
    expect(listenerType.value).to.equal('script');
    expect(scriptFormat.value).to.equal('groovy');
    expect(scriptType.value).to.equal('script');
    expect(scriptValue.value).to.equal('${sourceCode}');

    expect(businessObject.length).to.equal(1);
    expect(businessObject[0].get('event')).to.equal(eventType.value);
    expect(businessObject[0].script.get('scriptFormat')).to.equal(scriptFormat.value);
    expect(businessObject[0].script.value).to.equal(scriptValue.value);

  }));

  it('should add inline script properties for an execution listener',
      inject(function(propertiesPanel, selection, elementRegistry) {

    propertiesPanel.attachTo(container);

    var shape = elementRegistry.get('ServiceTask_1');
    selection.select(shape);

    var addListenerButton = domQuery('[data-entry=executionListeners] > div > button[data-action=addListener]', propertiesPanel._container),
        businessObject = getBusinessObject(shape);

    // given
    expect(businessObject).to.not.have.property('extensionElements');

    // when
    TestHelper.triggerEvent(addListenerButton, 'click');

    var eventType = domQuery('select[name=eventType]', propertiesPanel._container),
        listenerType = domQuery('select[name=listenerType]', propertiesPanel._container),
        scriptFormat = domQuery('input[name=scriptFormat]', propertiesPanel._container),
        scriptType = domQuery('select[name="scriptType"]', propertiesPanel._container),
        scriptValue = domQuery('textarea[name="scriptValue"]', propertiesPanel._container);

    // select 'script'
    listenerType.options[3].selected = "selected";
    TestHelper.triggerEvent(listenerType, 'change');
    TestHelper.triggerValue(scriptFormat, 'groovy');
    TestHelper.triggerValue(scriptValue, '${sourceCode}');

    // then
    expect(listenerType.value).to.equal('script');
    expect(eventType.value).to.equal('start');
    expect(scriptFormat.value).to.equal('groovy');
    expect(scriptType.value).to.equal('script');
    expect(scriptValue.value).to.equal('${sourceCode}');

    expect(businessObject.extensionElements).is.not.empty;
    expect(businessObject.extensionElements.values.length).to.equal(1);

    businessObject = businessObject.extensionElements.values[0];
    expect(businessObject.get('event')).to.equal(eventType.value);
    expect(businessObject.script.get('scriptFormat')).to.equal(scriptFormat.value);
    expect(businessObject.script.value).to.equal(scriptValue.value);

  }));

  it('should change the script type from inline script to external resource for an execution listener',
      inject(function(propertiesPanel, selection, elementRegistry) {

    propertiesPanel.attachTo(container);

    var shape = elementRegistry.get('StartEvent_1');
    selection.select(shape);

    var listenerType = domQuery('select[name=listenerType]', propertiesPanel._container),
        eventType = domQuery('select[name=eventType]', propertiesPanel._container),
        scriptFormat = domQuery('input[name=scriptFormat]', propertiesPanel._container),
        scriptType = domQuery('select[name="scriptType"]', propertiesPanel._container),
        scriptResourceValue = domQuery('input[name="scriptResourceValue"]', propertiesPanel._container),
        scriptValue = domQuery('textarea[name="scriptValue"]', propertiesPanel._container),
        businessObject = getBusinessObject(shape).extensionElements.values;

    // given
    expect(businessObject.length).to.equal(1);
    expect(listenerType.value).to.equal('script');
    expect(eventType.value).to.equal('start');
    expect(scriptFormat.value).to.equal('groovy');
    expect(scriptType.value).to.equal('script');
    expect(scriptResourceValue.value).is.empty;
    expect(scriptValue.value).to.equal('${sourceCode}');
    expect(businessObject[0].get('event')).to.equal(eventType.value);
    expect(businessObject[0].script.get('scriptFormat')).to.equal(scriptFormat.value);
    expect(businessObject[0].script.value).to.equal(scriptValue.value);
    expect(businessObject[0].script).to.not.have.property('resource');

    // when
    // select 'external resource'
    scriptType.options[1].selected = 'selected';
    TestHelper.triggerEvent(scriptType, 'change');
    TestHelper.triggerValue(scriptResourceValue, 'myResource.xml');

    // then
    // refresh business object
    businessObject = getBusinessObject(shape).extensionElements.values;

    expect(businessObject.length).to.equal(1);
    expect(listenerType.value).to.equal('script');
    expect(eventType.value).to.equal('start');
    expect(scriptFormat.value).to.equal('groovy');
    expect(scriptType.value).to.equal('scriptResource');
    expect(scriptResourceValue.value).to.equal('myResource.xml');
    expect(businessObject[0].get('event')).to.equal(eventType.value);
    expect(businessObject[0].script.get('scriptFormat')).to.equal(scriptFormat.value);
    expect(businessObject[0].script.get('resource')).to.equal(scriptResourceValue.value);
    expect(businessObject[0]).to.not.have.property('value');

  }));

});
