/**
 * Copyright (c) 2014-2015, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

var React = require('react');
var ReactPropTypes = React.PropTypes;
var TodoActions = require('../actions/TodoActions');
var TodoItem = require('./TodoItem.react');
const client = require('../client');
var OrderedMap = Immutable.OrderedMap;

// Get new OrderedMap
function getOm(arr) {
  return OrderedMap().withMutations(map => {
    arr.forEach(item => map.set(item.id, item))
  })
}


var MainSection = React.createClass({

  getInitialState: function() {

    client({method: 'GET', path: 'http://rest.learncode.academy/api/dubu/todos'}).done(response => {
      //console.log(response.entity);
      //_todos = response.entity[0].name;
      //_todos = response.entity[0];
      var myOrderedMap = getOm(response.entity);
      _todos = myOrderedMap.toObject();
      //this.setState({employees: response.entity._embedded.employees});
      allTodos = _todos;
      console.log(allTodos);
      TodoActions.destroyCompleted();
    });

    return null;
  },

  //console.log("xxxx");
  propTypes: {
    allTodos: ReactPropTypes.object.isRequired,
    areAllComplete: ReactPropTypes.bool.isRequired
  },

  /**
   * @return {object}
   */
  render: function() {
    // This section should be hidden by default
    // and shown when there are todos.
    //if (Object.keys(this.props.allTodos).length < 1) {
    //  return null;
    //}

    var allTodos = this.props.allTodos;
    var todos = [];

    for (var key in allTodos) {
      todos.push(<TodoItem key={key} todo={allTodos[key]} />);
    }

    return (
      <section id="main">
        <input
          id="toggle-all"
          type="checkbox"
          onChange={this._onToggleCompleteAll}
          checked={this.props.areAllComplete ? 'checked' : ''}
        />
        <label htmlFor="toggle-all">Mark all as complete</label>
        <ul id="todo-list">{todos}</ul>
      </section>
    );
  },

  /**
   * Event handler to mark all TODOs as complete
   */
  _onToggleCompleteAll: function() {
    TodoActions.toggleCompleteAll();
  }

});

module.exports = MainSection;
