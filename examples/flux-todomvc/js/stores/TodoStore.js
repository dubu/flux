/*
 * Copyright (c) 2014, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * TodoStore
 */

var AppDispatcher = require('../dispatcher/AppDispatcher');
var EventEmitter = require('events').EventEmitter;
var TodoConstants = require('../constants/TodoConstants');
var assign = require('object-assign');


var Immutable = require('immutable');

const client = require('../client');

var CHANGE_EVENT = 'change';

var _todos = {};

var OrderedMap = Immutable.OrderedMap;

// Get new OrderedMap
function getOm(arr) {
  return OrderedMap().withMutations(map => {
    arr.forEach(item => map.set(item.id, item))
  })
}

/**
 * Create a TODO item.
 * @param  {string} text The content of the TODO
 */
function create(text) {
  // Hand waving here -- not showing how this interacts with XHR or persistent
  // server-side storage.
  // Using the current timestamp + random number in place of a real id.
  var id = (+new Date() + Math.floor(Math.random() * 999999)).toString(36);
  _todos[id] = {
    id: id,
    complete: false,
    text: text
  };

  //save
  client({
    method: 'POST',
    path: 'http://rest.learncode.academy/api/dubu/todos',
    entity: _todos[id],
    headers: {'Content-Type': 'application/json'}
  });
  //
  //client({method: 'POST', path: 'http://rest.learncode.academy/api/dubu/todos'}).done(response => {
  //  //console.log(response.entity);
  //  //_todos = response.entity[0].name;
  //  //_todos = response.entity[0];
  //  var myOrderedMap = getOm(response.entity);
  //  _todos = myOrderedMap.toObject();
  //  //this.setState({employees: response.entity._embedded.employees});
  //  console.log(_todos);
  //});



  //console.log(_todos);
}

/**
 * Update a TODO item.
 * @param  {string} id
 * @param {object} updates An object literal containing only the data to be
 *     updated.
 */
function update(id, updates) {
  _todos[id] = assign({}, _todos[id], updates);

  client({
    method: 'PUT',
    path: 'http://rest.learncode.academy/api/dubu/todos/'+id,
    entity: _todos[id],
    headers: {'Content-Type': 'application/json'}
  });

  //console.log(_todos);
}

/**
 * Update all of the TODO items with the same object.
 * @param  {object} updates An object literal containing only the data to be
 *     updated.
 */
function updateAll(updates) {
  for (var id in _todos) {
    update(id, updates);
  }
}

/**
 * Delete a TODO item.
 * @param  {string} id
 */
function destroy(id) {

  delete _todos[id];

  client({
    method: 'DELETE',
    path: 'http://rest.learncode.academy/api/dubu/todos/'+id,
    headers: {'Content-Type': 'application/json'}
  }).done(response => {
    console.log(response);
  });


}

/**
 * Delete all the completed TODO items.
 */
function destroyCompleted() {
  for (var id in _todos) {
    if (_todos[id].complete) {
      destroy(id);
    }
  }
}

var TodoStore = assign({}, EventEmitter.prototype, {

  /**
   * Tests whether all the remaining TODO items are marked as completed.
   * @return {boolean}
   */
  areAllComplete: function() {
    for (var id in _todos) {
      if (!_todos[id].complete) {
        return false;
      }
    }
    return true;
  },

  /**
   * Get the entire collection of TODOs.
   * @return {object}
   */
  getAll: function() {

    client({method: 'GET', path: 'http://rest.learncode.academy/api/dubu/todos'}).done(response => {
      //console.log(response.entity);
      //_todos = response.entity[0].name;
      //_todos = response.entity[0];
      var myOrderedMap = getOm(response.entity);
      _todos = myOrderedMap.toObject();
      //this.setState({employees: response.entity._embedded.employees});
      console.log(_todos);
    });

    return _todos;
  },

  emitChange: function() {
    this.emit(CHANGE_EVENT);
  },

  /**
   * @param {function} callback
   */
  addChangeListener: function(callback) {
    this.on(CHANGE_EVENT, callback);
  },

  /**
   * @param {function} callback
   */
  removeChangeListener: function(callback) {
    this.removeListener(CHANGE_EVENT, callback);
  }
});

// Register callback to handle all updates
AppDispatcher.register(function(action) {
  var text;

  switch(action.actionType) {
    case TodoConstants.TODO_CREATE:
      text = action.text.trim();
      if (text !== '') {
        create(text);
        TodoStore.emitChange();
      }
      break;

    case TodoConstants.TODO_TOGGLE_COMPLETE_ALL:
      if (TodoStore.areAllComplete()) {
        updateAll({complete: false});
      } else {
        updateAll({complete: true});
      }
      TodoStore.emitChange();
      break;

    case TodoConstants.TODO_UNDO_COMPLETE:
      update(action.id, {complete: false});
      TodoStore.emitChange();
      break;

    case TodoConstants.TODO_COMPLETE:
      update(action.id, {complete: true});
      TodoStore.emitChange();
      break;

    case TodoConstants.TODO_UPDATE_TEXT:
      text = action.text.trim();
      if (text !== '') {
        update(action.id, {text: text});
        TodoStore.emitChange();
      }
      break;

    case TodoConstants.TODO_DESTROY:
      destroy(action.id);
      TodoStore.emitChange();
      break;

    case TodoConstants.TODO_DESTROY_COMPLETED:
      destroyCompleted();
      TodoStore.emitChange();
      break;

    default:
      // no op
  }
});

module.exports = TodoStore;
